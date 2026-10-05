/**
 * Parser de planilhas CSV "CONTROLE DIÁRIO DE MATERIAIS - CONCRETEIRA"
 * Compatível com unidades Monteiro, SJE e congêneres.
 *
 * Regras:
 * - Números com vírgula decimal ("8,0", "7,5", "480,0") ou inteiros ("8", "290")
 * - Formato de data em DD/MM/AAAA -> normalizado para YYYY-MM-DD
 * - Colunas de acumulado/saldo são ignoradas
 * - Campos opcionais (motorista, placa, cidade, observações, pó de pedra)
 * - Identificação de cargas zeradas (volume > 0 com dosagem zerada)
 * - Derivação de traço e dosagem por m³
 */

export interface LinhaCargaParsed {
  linhaIndex: number
  dataIso: string // 'YYYY-MM-DD'
  dataOriginal: string // 'DD/MM/AAAA'
  volume_m3: number
  // Consumos totais calculados para a carga (multiplicados por volume se dosagem vier por m³)
  consumo_brita12: number
  consumo_brita19: number
  consumo_areia: number
  consumo_po_pedra: number
  consumo_cimento: number
  consumo_aditivo: number
  // Valores unitários digitados exatamente na linha da planilha
  unitario_brita12: number
  unitario_brita19: number
  unitario_areia: number
  unitario_po_pedra: number
  unitario_cimento: number
  unitario_aditivo: number
  motorista_nome: string | null
  veiculo_placa: string | null
  cidade_nome: string | null
  observacao: string | null
  carga_zerada: boolean

  // Dosagem unitária por m³
  dosagemM3: {
    brita12: number
    brita19: number
    areia: number
    po_pedra: number
    cimento: number
    aditivo: number
  }
  tracoChave: string // Chave única para agrupar traços
  tracoSugeridoNome: string
}

export interface ResumoMesPlanilha {
  chaveMes: string // '2026-01'
  nomeMes: string // 'Janeiro/2026'
  cargasCount: number
  volumeTotalM3: number
  metaM3?: number
  diferencaM3?: number
  atingiuMeta?: boolean
}

export interface TracoResumoDetectado {
  chave: string
  nomeSugerido: string
  cimentoM3: number
  brita12M3: number
  brita19M3: number
  areiaM3: number
  poPedraM3: number
  aditivoM3: number
  totalCargas: number
  fckSugerido: number
}

export interface PreviewImportacaoCSV {
  totalLinhasValidas: number
  totalLinhasIgnoradas: number
  avisos: string[]
  erros: string[]
  periodoInicio: string | null // 'YYYY-MM-DD'
  periodoFim: string | null // 'YYYY-MM-DD'
  volumeTotalM3: number
  totalCargasZeradas: number
  tracosDetectados: TracoResumoDetectado[]
  motoristasEncontrados: string[]
  veiculosEncontrados: string[]
  cidadesEncontradas: string[]
  resumoPorMes: ResumoMesPlanilha[]
  cargas: LinhaCargaParsed[]
}

/**
 * Converte valor numérico brasileiro/texto para number JS.
 * Trata: "8,0" -> 8, "480,0" -> 480, "2.880" -> 2880, "" ou null -> 0
 */
export function parseNumeroBr(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") {
    return isNaN(val) ? 0 : val
  }
  const limpo = String(val).trim()
  if (!limpo) return 0

  // Se contém ponto de milhar e vírgula decimal ex: "2.880,50"
  if (limpo.includes(".") && limpo.includes(",")) {
    const semPonto = limpo.replace(/\./g, "").replace(",", ".")
    const parsed = parseFloat(semPonto)
    return isNaN(parsed) ? 0 : parsed
  }

  // Se contém apenas vírgula decimal ex: "8,0" ou "7,5"
  if (limpo.includes(",")) {
    const parsed = parseFloat(limpo.replace(",", "."))
    return isNaN(parsed) ? 0 : parsed
  }

  // Se contém apenas número padrão ex: "8", "290" ou número com ponto decimal direto "8.5"
  const parsed = parseFloat(limpo)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Converte DD/MM/AAAA para YYYY-MM-DD com validação
 */
export function parseDataBrParaIso(dataStr: string): string | null {
  if (!dataStr) return null
  const limpo = dataStr.trim()

  // Formato dd/mm/aaaa ou d/m/aaaa
  const match = limpo.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!match) {
    // Pode já estar em YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
      return limpo
    }
    return null
  }

  const dia = match[1].padStart(2, "0")
  const mes = match[2].padStart(2, "0")
  const ano = match[3]

  const diaNum = parseInt(dia, 10)
  const mesNum = parseInt(mes, 10)
  if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12) {
    return null
  }

  return `${ano}-${mes}-${dia}`
}

/**
 * Divide uma linha CSV respeitando aspas duplas com vírgula interna
 */
export function splitCsvLine(linha: string): string[] {
  const campos: string[] = []
  let campoAtual = ""
  let dentroDeAspas = false

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]

    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        campoAtual += '"'
        i++ // pula a aspas de escape
      } else {
        dentroDeAspas = !dentroDeAspas
      }
    } else if (char === "," && !dentroDeAspas) {
      campos.push(campoAtual.trim())
      campoAtual = ""
    } else {
      campoAtual += char
    }
  }
  campos.push(campoAtual.trim())
  return campos
}

/**
 * Estima o FCK a partir do consumo de cimento por m³
 */
function estimarFck(cimentoKgM3: number): number {
  if (cimentoKgM3 >= 380) return 35
  if (cimentoKgM3 >= 320) return 30
  if (cimentoKgM3 >= 280) return 25
  if (cimentoKgM3 >= 240) return 20
  return 15
}

/**
 * Gera um nome amigável para o traço baseado nos consumos por m³
 */
function sugerirNomeTraco(dosagem: {
  cimento: number
  brita12: number
  brita19: number
  areia: number
  po_pedra: number
  aditivo: number
}): string {
  const fck = estimarFck(dosagem.cimento)
  const cimentoArred = Math.round(dosagem.cimento)

  if (dosagem.brita12 === 0 && dosagem.brita19 > 0) {
    return `Traço FCK ${fck} MPa (${cimentoArred}kg Cim - Apenas Brita 19)`
  }
  if (dosagem.brita19 === 0 && dosagem.brita12 > 0) {
    return `Traço FCK ${fck} MPa (${cimentoArred}kg Cim - Apenas Brita 12)`
  }
  if (dosagem.po_pedra > 0) {
    return `Traço FCK ${fck} MPa (${cimentoArred}kg Cim - c/ Pó de Pedra)`
  }
  return `Traço FCK ${fck} MPa (${cimentoArred}kg Cim - B12:${Math.round(dosagem.brita12)}/B19:${Math.round(dosagem.brita19)}/Areia:${Math.round(dosagem.areia)})`
}

/**
 * Parser principal do CSV do Controle Diário de Materiais
 */
export function parseControleDiarioCSV(
  conteudoCsv: string,
): PreviewImportacaoCSV {
  const avisos: string[] = []
  const erros: string[] = []
  const linhasValidas: LinhaCargaParsed[] = []

  if (!conteudoCsv || !conteudoCsv.trim()) {
    return {
      totalLinhasValidas: 0,
      totalLinhasIgnoradas: 0,
      avisos: [],
      erros: ["Arquivo CSV vazio ou sem conteúdo legível."],
      periodoInicio: null,
      periodoFim: null,
      volumeTotalM3: 0,
      totalCargasZeradas: 0,
      tracosDetectados: [],
      motoristasEncontrados: [],
      veiculosEncontrados: [],
      cidadesEncontradas: [],
      resumoPorMes: [],
      cargas: [],
    }
  }

  // Normaliza quebras de linha
  const linhasCruas = conteudoCsv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")

  let indiceLinhaCabecalho = -1
  let mapaColunas: Record<string, number> = {}

  // Procura a linha de cabeçalho que contenha "Data" e "Volume"
  for (let i = 0; i < Math.min(linhasCruas.length, 10); i++) {
    const colunas = splitCsvLine(linhasCruas[i]).map((c) =>
      c.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim(),
    )

    const temData = colunas.some((c) => c === "data" || c.startsWith("data"))
    const temVolume = colunas.some((c) => c.includes("volume"))

    if (temData && temVolume) {
      indiceLinhaCabecalho = i

      // Mapeia índices exatos das colunas esperadas
      colunas.forEach((col, idx) => {
        if (col === "data" || col.startsWith("data")) mapaColunas["data"] = idx
        else if (col.includes("volume")) mapaColunas["volume"] = idx
        else if (col.includes("brita 12") && !col.includes("total"))
          mapaColunas["brita12"] = idx
        else if (col.includes("brita 19") && !col.includes("total"))
          mapaColunas["brita19"] = idx
        else if (col.includes("areia") && !col.includes("total"))
          mapaColunas["areia"] = idx
        else if (
          (col.includes("po de pedra") || col.includes("po (kg)")) &&
          !col.includes("total")
        )
          mapaColunas["po_pedra"] = idx
        else if (
          col.includes("cimento") &&
          !col.includes("total") &&
          !col.includes("acumulado") &&
          !col.includes("saldo")
        )
          mapaColunas["cimento"] = idx
        else if (
          col.includes("aditivo") &&
          !col.includes("total") &&
          !col.includes("acumulado") &&
          !col.includes("saldo")
        )
          mapaColunas["aditivo"] = idx
        else if (col.includes("motorista")) mapaColunas["motorista"] = idx
        else if (col.includes("placa")) mapaColunas["placa"] = idx
        else if (col.includes("cidade")) mapaColunas["cidade"] = idx
        else if (col.includes("observa")) mapaColunas["observacoes"] = idx
      })

      break
    }
  }

  // Fallback para índices posicionais se cabeçalho não tiver todas as labels
  // Data(0) | Volume(1) | Brita 12(2) | Brita 19(3) | Areia(4) | Pó de Pedra(5) | Cimento(6) | Aditivo(7) | Motorista(8) | Placa(9) | Cidade(10) | Observações(11)
  if (indiceLinhaCabecalho === -1) {
    // Tenta assumir ordem posicional a partir da linha 1 ou 2 se linha 0 for título da planilha
    indiceLinhaCabecalho = 0
    if (linhasCruas[0].toLowerCase().includes("concreteira")) {
      indiceLinhaCabecalho = 1
    }
  }

  // Garante que, se a coluna de cimento não tiver sido mapeada ou tiver sido associada a coluna de saldo acumulado (>= 12),
  // usa a coluna 6 que é a posição padrão do Cimento nas planilhas do sistema.
  if (mapaColunas["cimento"] === undefined || mapaColunas["cimento"] >= 12) {
    mapaColunas["cimento"] = 6
  }
  if (mapaColunas["aditivo"] === undefined || mapaColunas["aditivo"] >= 12) {
    mapaColunas["aditivo"] = 7
  }
  const getCol = (
    cols: string[],
    chave: string,
    defaultIdx: number,
  ): string => {
    const idx =
      mapaColunas[chave] !== undefined ? mapaColunas[chave] : defaultIdx
    return cols[idx] !== undefined ? cols[idx].trim() : ""
  }

  let totalLinhasIgnoradas = 0

  for (let i = indiceLinhaCabecalho + 1; i < linhasCruas.length; i++) {
    const linhaTexto = linhasCruas[i].trim()
    if (!linhaTexto) continue

    const colunas = splitCsvLine(linhaTexto)

    // Se toda a linha for vazia ou separadores vazios
    if (colunas.every((c) => !c)) {
      totalLinhasIgnoradas++
      continue
    }

    const dataOriginal = getCol(colunas, "data", 0)
    const dataIso = parseDataBrParaIso(dataOriginal)

    if (!dataIso) {
      // Ignora linhas de rodapé ou fórmulas da planilha
      totalLinhasIgnoradas++
      continue
    }

    const volumeCru = getCol(colunas, "volume", 1)
    const volume_m3 = parseNumeroBr(volumeCru)
    if (volume_m3 <= 0) {
      avisos.push(
        `Linha ${i + 1} (${dataOriginal}): Sem volume de concreto ("${volumeCru}"). Linha ignorada.`,
      )
      totalLinhasIgnoradas++
      continue
    }

    const consumo_brita12 = parseNumeroBr(getCol(colunas, "brita12", 2))
    const consumo_brita19 = parseNumeroBr(getCol(colunas, "brita19", 3))
    const consumo_areia = parseNumeroBr(getCol(colunas, "areia", 4))
    const consumo_po_pedra = parseNumeroBr(getCol(colunas, "po_pedra", 5))
    const consumo_cimento = parseNumeroBr(getCol(colunas, "cimento", 6))
    const consumo_aditivo = parseNumeroBr(getCol(colunas, "aditivo", 7))

    const motoristaCru = getCol(colunas, "motorista", 8)
    const veiculoCru = getCol(colunas, "placa", 9)
    const cidadeCru = getCol(colunas, "cidade", 10)
    const observacaoCru = getCol(colunas, "observacoes", 11)

    const motorista_nome = motoristaCru ? motoristaCru.toUpperCase() : null
    const veiculo_placa = veiculoCru
      ? veiculoCru.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
      : null
    const cidade_nome = cidadeCru ? cidadeCru.toUpperCase() : null
    const observacao = observacaoCru || null

    // Verifica se é carga zerada (cimento zerado ou todos agregados zerados)
    const carga_zerada =
      consumo_cimento === 0 &&
      consumo_brita12 === 0 &&
      consumo_brita19 === 0 &&
      consumo_areia === 0

    // Dosagem unitária por m³
    // Na planilha, as colunas Brita 12 / Brita 19 / Areia / Cimento já costumam vir como dosagem unitária por m³ (ex: 480, 480, 850, 290)
    // enquanto o Aditivo vem por carga (ex: 18L / 23L).
    // Testamos a ordem de grandeza: se cimento > 500 para volume de 8m³, veio por-carga (ex: 2320kg / 8m³ = 290kg/m³).
    // Se cimento estiver na faixa 150-500, já veio por m³!
    let cimentoM3 = consumo_cimento
    let brita12M3 = consumo_brita12
    let brita19M3 = consumo_brita19
    let areiaM3 = consumo_areia
    let poPedraM3 = consumo_po_pedra
    let aditivoM3 = consumo_aditivo

    if (!carga_zerada) {
      if (cimentoM3 > 600 && volume_m3 > 0) {
        // Estava por carga, divide pelo volume
        cimentoM3 = Math.round((cimentoM3 / volume_m3) * 10) / 10
        brita12M3 = Math.round((brita12M3 / volume_m3) * 10) / 10
        brita19M3 = Math.round((brita19M3 / volume_m3) * 10) / 10
        areiaM3 = Math.round((areiaM3 / volume_m3) * 10) / 10
        poPedraM3 = Math.round((poPedraM3 / volume_m3) * 10) / 10
      }
      // Aditivo na planilha geralmente é o total da carga (ex: 18L para 6m³ => 3 L/m³)
      if (volume_m3 > 0 && aditivoM3 > 10) {
        aditivoM3 = Math.round((aditivoM3 / volume_m3) * 100) / 100
      }
    }

    const dosagemM3 = {
      brita12: brita12M3,
      brita19: brita19M3,
      areia: areiaM3,
      po_pedra: poPedraM3,
      cimento: cimentoM3,
      aditivo: aditivoM3,
    }

    const tracoChave = carga_zerada
      ? "ZERADA"
      : `${Math.round(cimentoM3)}_${Math.round(brita12M3)}_${Math.round(brita19M3)}_${Math.round(areiaM3)}_${Math.round(poPedraM3)}`

    const tracoSugeridoNome = carga_zerada
      ? "Carga Zerada / Descarte"
      : sugerirNomeTraco(dosagemM3)

    // Consumo TOTAL da carga para armazenamento no banco
    // Se veio já por m³, multiplicamos pelo volume para gravar o consumo total da carga (compatível com a tabela cargas do sistema)
    let consumoCargaCimento = consumo_cimento
    let consumoCargaB12 = consumo_brita12
    let consumoCargaB19 = consumo_brita19
    let consumoCargaAreia = consumo_areia
    let consumoCargaPo = consumo_po_pedra
    let consumoCargaAditivo = consumo_aditivo

    if (!carga_zerada && cimentoM3 > 0 && consumo_cimento <= 600) {
      // Veio como unitário por m³, multiplicar pelo volume para ter o consumo real da carga
      consumoCargaCimento = Math.round(cimentoM3 * volume_m3 * 10) / 10
      consumoCargaB12 = Math.round(brita12M3 * volume_m3 * 10) / 10
      consumoCargaB19 = Math.round(brita19M3 * volume_m3 * 10) / 10
      consumoCargaAreia = Math.round(areiaM3 * volume_m3 * 10) / 10
      consumoCargaPo = Math.round(poPedraM3 * volume_m3 * 10) / 10
      // Se o aditivo na planilha já veio por carga (ex: 18, 23), mantém o valor da carga original (consumo_aditivo).
      // Se era <= 5 por m³, multiplica pelo volume
      if (consumo_aditivo <= 5) {
        consumoCargaAditivo =
          Math.round(consumo_aditivo * volume_m3 * 100) / 100
      } else {
        consumoCargaAditivo = consumo_aditivo
      }
    }

    linhasValidas.push({
      linhaIndex: i + 1,
      dataIso,
      dataOriginal,
      volume_m3,
      consumo_brita12: consumoCargaB12,
      consumo_brita19: consumoCargaB19,
      consumo_areia: consumoCargaAreia,
      consumo_po_pedra: consumoCargaPo,
      consumo_cimento: consumoCargaCimento,
      consumo_aditivo: consumoCargaAditivo,
      unitario_brita12: consumo_brita12,
      unitario_brita19: consumo_brita19,
      unitario_areia: consumo_areia,
      unitario_po_pedra: consumo_po_pedra,
      unitario_cimento: consumo_cimento,
      unitario_aditivo: consumo_aditivo,
      motorista_nome,
      veiculo_placa,
      cidade_nome,
      observacao,
      carga_zerada,
      dosagemM3,
      tracoChave,
      tracoSugeridoNome,
    })
  }

  // Agrupamento de traços detectados
  const tracosMap = new Map<string, TracoResumoDetectado>()
  const motoristasSet = new Set<string>()
  const veiculosSet = new Set<string>()
  const cidadesSet = new Set<string>()
  type InfoMes = {
    count: number
    volume: number
  }
  const mesesMap = new Map<string, InfoMes>()

  // Metas oficiais fornecidas pelo usuário para Monteiro jan-set/2026
  const metasMonteiro2026: Record<string, number> = {
    "2026-01": 369.0,
    "2026-02": 316.0,
    "2026-03": 420.0,
    "2026-04": 343.0,
    "2026-05": 413.0,
    "2026-06": 539.0,
    "2026-07": 765.0,
    "2026-08": 635.0,
    "2026-09": 508.5,
  }

  const nomesMesesPt: Record<string, string> = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  }

  let volumeTotal = 0
  let totalZeradas = 0

  linhasValidas.forEach((l) => {
    volumeTotal += l.volume_m3

    // Agrupamento por mês
    const mesChave = l.dataIso.slice(0, 7) // '2026-01'
    const curMes = mesesMap.get(mesChave) || { count: 0, volume: 0 }
    curMes.count += 1
    curMes.volume += l.volume_m3
    mesesMap.set(mesChave, curMes)

    if (l.carga_zerada) {
      totalZeradas++
      return
    }

    if (l.motorista_nome) motoristasSet.add(l.motorista_nome)
    if (l.veiculo_placa) veiculosSet.add(l.veiculo_placa)
    if (l.cidade_nome) cidadesSet.add(l.cidade_nome)

    const exist = tracosMap.get(l.tracoChave)
    if (exist) {
      exist.totalCargas++
    } else {
      tracosMap.set(l.tracoChave, {
        chave: l.tracoChave,
        nomeSugerido: l.tracoSugeridoNome,
        cimentoM3: l.dosagemM3.cimento,
        brita12M3: l.dosagemM3.brita12,
        brita19M3: l.dosagemM3.brita19,
        areiaM3: l.dosagemM3.areia,
        poPedraM3: l.dosagemM3.po_pedra,
        aditivoM3: l.dosagemM3.aditivo,
        totalCargas: 1,
        fckSugerido: estimarFck(l.dosagemM3.cimento),
      })
    }
  })

  // Monta lista de resumo por mês ordenada
  const chavesMesesOrdenadas = Array.from(mesesMap.keys()).sort()
  const resumoPorMes: ResumoMesPlanilha[] = chavesMesesOrdenadas.map(
    (chave) => {
      const dados = mesesMap.get(chave)!
      const [ano, mes] = chave.split("-")
      const nomeMes = `${nomesMesesPt[mes] || mes}/${ano}`
      const vol = Math.round(dados.volume * 10) / 10
      const meta = metasMonteiro2026[chave]
      const dif =
        meta !== undefined ? Math.round((vol - meta) * 10) / 10 : undefined
      const atingiu =
        meta !== undefined ? Math.abs(vol - meta) < 0.05 : undefined

      return {
        chaveMes: chave,
        nomeMes,
        cargasCount: dados.count,
        volumeTotalM3: vol,
        metaM3: meta,
        diferencaM3: dif,
        atingiuMeta: atingiu,
      }
    },
  )

  // Datas ordenadas para período
  const datasOrdenadas = [...linhasValidas.map((l) => l.dataIso)].sort()
  const periodoInicio = datasOrdenadas.length > 0 ? datasOrdenadas[0] : null
  const periodoFim =
    datasOrdenadas.length > 0 ? datasOrdenadas[datasOrdenadas.length - 1] : null

  return {
    totalLinhasValidas: linhasValidas.length,
    totalLinhasIgnoradas,
    avisos,
    erros,
    periodoInicio,
    periodoFim,
    volumeTotalM3: Math.round(volumeTotal * 10) / 10,
    totalCargasZeradas: totalZeradas,
    tracosDetectados: Array.from(tracosMap.values()).sort(
      (a, b) => b.totalCargas - a.totalCargas,
    ),
    motoristasEncontrados: Array.from(motoristasSet).sort(),
    veiculosEncontrados: Array.from(veiculosSet).sort(),
    cidadesEncontradas: Array.from(cidadesSet).sort(),
    resumoPorMes,
    cargas: linhasValidas,
  }
}
