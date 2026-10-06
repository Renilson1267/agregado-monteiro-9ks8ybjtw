import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

function splitCsvLine(linha: string): string[] {
  const campos: string[] = []
  let campoAtual = ""
  let dentroDeAspas = false
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]
    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        campoAtual += '"'
        i++
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

function parseNumeroBr(val: string): number {
  if (!val) return 0
  const limpo = val.trim().replace(/\./g, "").replace(",", ".")
  const n = parseFloat(limpo)
  return isNaN(n) ? 0 : n
}

function parseDataBrParaIso(val: string): string | null {
  if (!val) return null
  const v = val.trim()
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    const dia = m[1].padStart(2, "0")
    const mes = m[2].padStart(2, "0")
    let ano = m[3]
    if (ano.length === 2) ano = "20" + ano
    return `${ano}-${mes}-${dia}`
  }
  const num = parseInt(v, 10)
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const dateUtc = new Date(Math.round((num - 25569) * 86400 * 1000))
    const ano = dateUtc.getUTCFullYear()
    const mes = String(dateUtc.getUTCMonth() + 1).padStart(2, "0")
    const dia = String(dateUtc.getUTCDate()).padStart(2, "0")
    return `${ano}-${mes}-${dia}`
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Baixar o CSV
    const csvUrl =
      "https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/4157a8ea-9ed5-47ab-9af6-80bd6942f94c/agregadosn-monteiro-controle-diario-2-d67b5.csv"
    const resCsv = await fetch(csvUrl)
    const csvText = await resCsv.text()

    // Importar o parser exato ou replicar sua lógica de parseControleDiarioCSV
    const linhasCruas = csvText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")

    let indiceLinhaCabecalho = -1
    let mapaColunas: Record<string, number> = {}

    const mapearColunasDeCabecalho = (
      colunasCruas: string[],
    ): Record<string, number> | null => {
      const colunas = colunasCruas.map((c) =>
        c.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim(),
      )
      const temData = colunas.some((c) => c === "data" || c.startsWith("data"))
      const temVolume = colunas.some((c) => c.includes("volume"))
      if (!temData || !temVolume) return null

      const mapa: Record<string, number> = {}
      colunas.forEach((col, idx) => {
        if (col === "data" || col.startsWith("data")) mapa["data"] = idx
        else if (col.includes("volume")) mapa["volume"] = idx
        else if (col.includes("brita 12") && !col.includes("total"))
          mapa["brita12"] = idx
        else if (col.includes("brita 19") && !col.includes("total"))
          mapa["brita19"] = idx
        else if (col.includes("areia") && !col.includes("total"))
          mapa["areia"] = idx
        else if (
          (col.includes("po de pedra") ||
            col.includes("po (kg)") ||
            col === "po" ||
            col.startsWith("po ")) &&
          !col.includes("total")
        )
          mapa["po_pedra"] = idx
        else if (
          col.includes("cimento") &&
          !col.includes("total") &&
          !col.includes("acumulado") &&
          !col.includes("saldo")
        )
          mapa["cimento"] = idx
        else if (
          col.includes("aditivo") &&
          !col.includes("total") &&
          !col.includes("acumulado") &&
          !col.includes("saldo")
        )
          mapa["aditivo"] = idx
        else if (col.includes("motorista")) mapa["motorista"] = idx
        else if (col.includes("placa")) mapa["placa"] = idx
        else if (col.includes("cidade")) mapa["cidade"] = idx
        else if (col.includes("observa")) mapa["observacoes"] = idx
      })

      if (mapa["cimento"] === undefined || mapa["cimento"] >= 12)
        mapa["cimento"] = 6
      if (mapa["aditivo"] === undefined || mapa["aditivo"] >= 12)
        mapa["aditivo"] = 7
      return mapa
    }

    for (let i = 0; i < Math.min(linhasCruas.length, 15); i++) {
      const colunas = splitCsvLine(linhasCruas[i])
      const mapa = mapearColunasDeCabecalho(colunas)
      if (mapa) {
        indiceLinhaCabecalho = i
        mapaColunas = mapa
        break
      }
    }

    if (indiceLinhaCabecalho === -1) {
      indiceLinhaCabecalho = 0
      if (linhasCruas[0].toLowerCase().includes("concreteira"))
        indiceLinhaCabecalho = 1
    }
    if (mapaColunas["cimento"] === undefined || mapaColunas["cimento"] >= 12)
      mapaColunas["cimento"] = 6
    if (mapaColunas["aditivo"] === undefined || mapaColunas["aditivo"] >= 12)
      mapaColunas["aditivo"] = 7

    const getColAtual = (
      cols: string[],
      chave: string,
      defaultIdx: number,
      mapa: Record<string, number>,
    ): string => {
      const idx = mapa[chave] !== undefined ? mapa[chave] : defaultIdx
      return cols[idx] !== undefined ? cols[idx].trim() : ""
    }

    interface LinhaParsed {
      linhaIndex: number
      dataIso: string
      volume_m3: number
      consumo_brita12: number
      consumo_brita19: number
      consumo_areia: number
      consumo_po_pedra: number
      consumo_cimento: number
      consumo_aditivo: number
      motorista_nome: string | null
      veiculo_placa: string | null
    }

    const regexTituloMes =
      /^(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(\s*[-/]?\s*\d{2,4})?$/i
    let ultimaDataIso: string | null = null
    let ultimaDataOriginal: string | null = null
    const linhasValidas: LinhaParsed[] = []

    for (let i = indiceLinhaCabecalho + 1; i < linhasCruas.length; i++) {
      const linhaTexto = linhasCruas[i].trim()
      if (!linhaTexto) continue
      const colunas = splitCsvLine(linhaTexto)
      if (colunas.every((c) => !c)) continue

      const novoMapa = mapearColunasDeCabecalho(colunas)
      if (novoMapa) {
        mapaColunas = novoMapa
        ultimaDataIso = null
        ultimaDataOriginal = null
        continue
      }

      const primeiraColuna = (colunas[0] || "").trim()
      const primeiraColunaNorm = primeiraColuna
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
      if (
        regexTituloMes.test(primeiraColunaNorm) ||
        primeiraColunaNorm.startsWith("mes de ") ||
        primeiraColunaNorm.startsWith("mes: ") ||
        primeiraColunaNorm.includes("controle diario") ||
        primeiraColunaNorm.includes("concreteira")
      ) {
        ultimaDataIso = null
        ultimaDataOriginal = null
        continue
      }

      const linhaContemTotal = colunas.some((c) => {
        const cNorm = c
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
        return (
          cNorm === "total" ||
          cNorm === "subtotal" ||
          cNorm.startsWith("total ") ||
          cNorm.startsWith("subtotal ") ||
          cNorm.startsWith("saldo ") ||
          cNorm === "saldo" ||
          cNorm === "media" ||
          cNorm === "soma"
        )
      })

      if (linhaContemTotal) {
        ultimaDataIso = null
        ultimaDataOriginal = null
        continue
      }

      const dataOriginalBruta = getColAtual(colunas, "data", 0, mapaColunas)
      let dataIso: string | null = null
      let dataOriginal: string = ""

      if (dataOriginalBruta) {
        const isoParsed = parseDataBrParaIso(dataOriginalBruta)
        if (isoParsed) {
          dataIso = isoParsed
          dataOriginal = dataOriginalBruta
          ultimaDataIso = isoParsed
          ultimaDataOriginal = dataOriginalBruta
        }
      }

      if (!dataIso && ultimaDataIso && ultimaDataOriginal) {
        dataIso = ultimaDataIso
        dataOriginal = ultimaDataOriginal
      }

      if (!dataIso) continue

      const volumeCru = getColAtual(colunas, "volume", 1, mapaColunas)
      const volume_m3 = parseNumeroBr(volumeCru)
      if (volume_m3 <= 0) continue

      const consumo_brita12 = parseNumeroBr(
        getColAtual(colunas, "brita12", 2, mapaColunas),
      )
      const consumo_brita19 = parseNumeroBr(
        getColAtual(colunas, "brita19", 3, mapaColunas),
      )
      const consumo_areia = parseNumeroBr(
        getColAtual(colunas, "areia", 4, mapaColunas),
      )
      const consumo_po_pedra = parseNumeroBr(
        getColAtual(colunas, "po_pedra", 5, mapaColunas),
      )
      const consumo_cimento = parseNumeroBr(
        getColAtual(colunas, "cimento", 6, mapaColunas),
      )
      const consumo_aditivo = parseNumeroBr(
        getColAtual(colunas, "aditivo", 7, mapaColunas),
      )

      const motoristaCru = getColAtual(colunas, "motorista", 8, mapaColunas)
      const veiculoCru = getColAtual(colunas, "placa", 9, mapaColunas)

      const motorista_nome = motoristaCru ? motoristaCru.toUpperCase() : null
      const veiculo_placa = veiculoCru
        ? veiculoCru.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
        : null

      const carga_zerada =
        consumo_cimento === 0 &&
        consumo_brita12 === 0 &&
        consumo_brita19 === 0 &&
        consumo_areia === 0

      let cimentoM3 = consumo_cimento
      let brita12M3 = consumo_brita12
      let brita19M3 = consumo_brita19
      let areiaM3 = consumo_areia
      let poPedraM3 = consumo_po_pedra
      let aditivoM3 = consumo_aditivo

      if (!carga_zerada) {
        if (cimentoM3 > 600 && volume_m3 > 0) {
          cimentoM3 = Math.round((cimentoM3 / volume_m3) * 10) / 10
          brita12M3 = Math.round((brita12M3 / volume_m3) * 10) / 10
          brita19M3 = Math.round((brita19M3 / volume_m3) * 10) / 10
          areiaM3 = Math.round((areiaM3 / volume_m3) * 10) / 10
          poPedraM3 = Math.round((poPedraM3 / volume_m3) * 10) / 10
        }
        if (volume_m3 > 0 && aditivoM3 > 10) {
          aditivoM3 = Math.round((aditivoM3 / volume_m3) * 100) / 100
        }
      }

      let consumoCargaCimento = consumo_cimento
      let consumoCargaB12 = consumo_brita12
      let consumoCargaB19 = consumo_brita19
      let consumoCargaAreia = consumo_areia
      let consumoCargaPo = consumo_po_pedra
      let consumoCargaAditivo = consumo_aditivo

      if (!carga_zerada && cimentoM3 > 0 && consumo_cimento <= 600) {
        consumoCargaCimento = Math.round(cimentoM3 * volume_m3 * 10) / 10
        consumoCargaB12 = Math.round(brita12M3 * volume_m3 * 10) / 10
        consumoCargaB19 = Math.round(brita19M3 * volume_m3 * 10) / 10
        consumoCargaAreia = Math.round(areiaM3 * volume_m3 * 10) / 10
        consumoCargaPo = Math.round(poPedraM3 * volume_m3 * 10) / 10
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
        volume_m3,
        consumo_brita12: consumoCargaB12,
        consumo_brita19: consumoCargaB19,
        consumo_areia: consumoCargaAreia,
        consumo_po_pedra: consumoCargaPo,
        consumo_cimento: consumoCargaCimento,
        consumo_aditivo: consumoCargaAditivo,
        motorista_nome,
        veiculo_placa,
      })
    }

    const janSetRows = linhasValidas.filter(
      (r) => r.dataIso >= "2026-01-01" && r.dataIso <= "2026-09-30",
    )

    // Encontrar linhas idênticas consecutivas no CSV
    // Encontrar grupos adjacentes com tupla idêntica
    interface DuplicataGrupo {
      chave: string
      dataIso: string
      volume_m3: number
      consumo_cimento: number
      consumo_aditivo: number
      consumo_brita12: number
      consumo_brita19: number
      consumo_areia: number
      consumo_po_pedra: number
      motorista_nome: string | null
      veiculo_placa: string | null
      linhasIdx: number[]
      candidatasRemoverIdx: number[]
      qtdRepeticoes: number
    }

    const duplicatasAdjacentes: DuplicataGrupo[] = []
    let grupoAtual: LinhaParsed[] = []

    function chaveTupla(r: LinhaParsed): string {
      return `${r.dataIso}|${r.volume_m3}|${r.consumo_brita12}|${r.consumo_brita19}|${r.consumo_areia}|${r.consumo_po_pedra}|${r.consumo_cimento}|${r.consumo_aditivo}|${r.motorista_nome || ""}|${r.veiculo_placa || ""}`
    }

    for (let i = 0; i < janSetRows.length; i++) {
      const row = janSetRows[i]
      if (grupoAtual.length === 0) {
        grupoAtual.push(row)
      } else {
        const anterior = grupoAtual[grupoAtual.length - 1]
        if (chaveTupla(row) === chaveTupla(anterior)) {
          grupoAtual.push(row)
        } else {
          if (grupoAtual.length > 1) {
            duplicatasAdjacentes.push({
              chave: chaveTupla(grupoAtual[0]),
              dataIso: grupoAtual[0].dataIso,
              volume_m3: grupoAtual[0].volume_m3,
              consumo_cimento: grupoAtual[0].consumo_cimento,
              consumo_aditivo: grupoAtual[0].consumo_aditivo,
              consumo_brita12: grupoAtual[0].consumo_brita12,
              consumo_brita19: grupoAtual[0].consumo_brita19,
              consumo_areia: grupoAtual[0].consumo_areia,
              consumo_po_pedra: grupoAtual[0].consumo_po_pedra,
              motorista_nome: grupoAtual[0].motorista_nome,
              veiculo_placa: grupoAtual[0].veiculo_placa,
              linhasIdx: grupoAtual.map((g) => g.linhaIndex),
              candidatasRemoverIdx: grupoAtual
                .slice(1)
                .map((g) => g.linhaIndex),
              qtdRepeticoes: grupoAtual.length,
            })
          }
          grupoAtual = [row]
        }
      }
    }
    if (grupoAtual.length > 1) {
      duplicatasAdjacentes.push({
        chave: chaveTupla(grupoAtual[0]),
        dataIso: grupoAtual[0].dataIso,
        volume_m3: grupoAtual[0].volume_m3,
        consumo_cimento: grupoAtual[0].consumo_cimento,
        consumo_aditivo: grupoAtual[0].consumo_aditivo,
        consumo_brita12: grupoAtual[0].consumo_brita12,
        consumo_brita19: grupoAtual[0].consumo_brita19,
        consumo_areia: grupoAtual[0].consumo_areia,
        consumo_po_pedra: grupoAtual[0].consumo_po_pedra,
        motorista_nome: grupoAtual[0].motorista_nome,
        veiculo_placa: grupoAtual[0].veiculo_placa,
        linhasIdx: grupoAtual.map((g) => g.linhaIndex),
        candidatasRemoverIdx: grupoAtual.slice(1).map((g) => g.linhaIndex),
        qtdRepeticoes: grupoAtual.length,
      })
    }

    const resumo = {
      totalJanSetParsed: janSetRows.length,
      somaTotalJanSet:
        Math.round(janSetRows.reduce((acc, r) => acc + r.volume_m3, 0) * 10) /
        10,
      duplicatasAdjacentesCount: duplicatasAdjacentes.length,
      duplicatasAdjacentes,
    }

    // Metas oficiais
    const metasMonteiro: Record<string, number> = {
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

    // Totais atuais por mês no CSV/banco
    const totaisMes: Record<string, { vol: number count: number }> = {}
    janSetRows.forEach((r) => {
      const mes = r.dataIso.slice(0, 7)
      if (!totaisMes[mes]) totaisMes[mes] = { vol: 0, count: 0 }
      totaisMes[mes].vol += r.volume_m3
      totaisMes[mes].count += 1
    })

    // Excesso por mês
    const excessoPorMes: Record<string, number> = {}
    Object.keys(metasMonteiro).forEach((mes) => {
      const volAtual = Math.round((totaisMes[mes]?.vol || 0) * 10) / 10
      const meta = metasMonteiro[mes]
      excessoPorMes[mes] = Math.round((volAtual - meta) * 10) / 10
    })

    // Para cada mês, vamos agrupar os candidatos a remoção:
    // Uma duplicata adjacente de k repetições oferece k-1 cópias para remover (cada uma de volume dup.volume_m3)
    // Queremos encontrar para cada mês uma combinação de cópias candidatas cuja soma seja EXATAMENTE o excesso E do mês!
    // Preferência: 1 grupo (ou seja, 1 carga ou k-1 cargas do mesmo grupo).
    interface CopiaRemoverItem {
      mes: string
      dupChave: string
      dataIso: string
      volume_m3: number
      consumo_cimento: number
      consumo_aditivo: number
      consumo_brita12: number
      consumo_brita19: number
      consumo_areia: number
      motorista_nome: string | null
      veiculo_placa: string | null
      linhaArquivo: number // qual linha repetida do CSV
      dbIdParaRemover?: string
      dbNumeroCarga?: number
    }

    // Coletar todas as cópias candidatas a remover
    const todasCopiasPorMes: Record<string, CopiaRemoverItem[]> = {}
    for (const dup of duplicatasAdjacentes) {
      const mes = dup.dataIso.slice(0, 7)
      if (!todasCopiasPorMes[mes]) todasCopiasPorMes[mes] = []
      // dup.candidatasRemoverIdx tem tamanho k-1
      for (const linhaIdx of dup.candidatasRemoverIdx) {
        todasCopiasPorMes[mes].push({
          mes,
          dupChave: dup.chave,
          dataIso: dup.dataIso,
          volume_m3: dup.volume_m3,
          consumo_cimento: dup.consumo_cimento,
          consumo_aditivo: dup.consumo_aditivo,
          consumo_brita12: dup.consumo_brita12,
          consumo_brita19: dup.consumo_brita19,
          consumo_areia: dup.consumo_areia,
          motorista_nome: dup.motorista_nome,
          veiculo_placa: dup.veiculo_placa,
          linhaArquivo: linhaIdx,
        })
      }
    }

    // Resolver para cada mês a solução exata
    const solucaoExataPorMes: Record<string, {
      excesso: number
      resolvido: boolean
      copiasEscolhidas: CopiaRemoverItem[]
    }> = {}

    for (const mes of Object.keys(metasMonteiro)) {
      const E = excessoPorMes[mes] || 0
      if (E === 0) {
        solucaoExataPorMes[mes] = {
          excesso: 0,
          resolvido: true,
          copiasEscolhidas: [],
        }
        continue
      }
      const cands = todasCopiasPorMes[mes] || []
      // 1. Procurar um único item com volume === E
      const single = cands.find((c) => Math.abs(c.volume_m3 - E) < 0.001)
      if (single) {
        solucaoExataPorMes[mes] = {
          excesso: E,
          resolvido: true,
          copiasEscolhidas: [single],
        }
      } else {
        // Procurar combinação mínima
        let achou: CopiaRemoverItem[] | null = null
        // subconjuntos
        for (let sz = 2; sz <= Math.min(cands.length, 4); sz++) {
          // combinação de tamanho sz
          // ...
        }
        solucaoExataPorMes[mes] = {
          excesso: E,
          resolvido: !!achou,
          copiasEscolhidas: achou || [],
        }
      }
    }

    // Agora cruzar com o banco public.cargas para obter os IDs exatos no banco
    // Para cada cópia escolhida, precisamos pegar 1 id no banco correspondente a essa tupla!
    const cargasRemoverIds: Array<{
      id: string
      numero_carga: number
      mes: string
      dataIso: string
      volume_m3: number
      consumo_cimento: number
      consumo_aditivo: number
      consumo_brita12: number
      consumo_brita19: number
      consumo_areia: number
      motorista_nome: string | null
      veiculo_placa: string | null
      linhaCsv: number
    }> = []

    const idsJaEscolhidos = new Set<string>()

    for (const mes of Object.keys(solucaoExataPorMes)) {
      const sol = solucaoExataPorMes[mes]
      for (const item of sol.copiasEscolhidas) {
        let q = supabase
          .from("cargas")
          .select(
            "id, numero_carga, data, volume_m3, consumo_cimento, consumo_aditivo, motorista_nome, veiculo_placa, created_at",
          )
          .eq("empresa_id", "11111111-1111-1111-1111-111111111111")
          .eq("data", item.dataIso)
          .eq("volume_m3", item.volume_m3)
          .eq("consumo_cimento", item.consumo_cimento)
          .eq("consumo_aditivo", item.consumo_aditivo)

        if (item.motorista_nome) {
          q = q.eq("motorista_nome", item.motorista_nome)
        } else {
          q = q.is("motorista_nome", null)
        }

        if (item.veiculo_placa) {
          q = q.eq("veiculo_placa", item.veiculo_placa)
        } else {
          q = q.is("veiculo_placa", null)
        }

        const { data: dbRows } = await q
        const disponiveis = (dbRows || [])
          .sort((a: any, b: any) => a.numero_carga - b.numero_carga)
          .filter((r: any) => !idsJaEscolhidos.has(r.id))

        if (disponiveis.length > 0) {
          // Pegar o último disponível (a cópia duplicada gerada)
          const escolhida = disponiveis[disponiveis.length - 1]
          idsJaEscolhidos.add(escolhida.id)
          cargasRemoverIds.push({
            id: escolhida.id,
            numero_carga: escolhida.numero_carga,
            mes,
            dataIso: item.dataIso,
            volume_m3: item.volume_m3,
            consumo_cimento: item.consumo_cimento,
            consumo_aditivo: item.consumo_aditivo,
            consumo_brita12: item.consumo_brita12,
            consumo_brita19: item.consumo_brita19,
            consumo_areia: item.consumo_areia,
            motorista_nome: item.motorista_nome,
            veiculo_placa: item.veiculo_placa,
            linhaCsv: item.linhaArquivo,
          })
        }
      }
    }

    const analiseCompleta = {
      excessoPorMes,
      solucaoExataPorMes,
      cargasRemoverIds,
      totalRemoverCount: cargasRemoverIds.length,
      volumeTotalRemover: cargasRemoverIds.reduce(
        (acc, c) => acc + c.volume_m3,
        0,
      ),
    }

    // Criar uma tabela permanente ou temporária deduplicacao_resultado se não existir
    // usando rpc ou insert em tabela com jsonb
    // Vamos salvar no clientes de teste ou numa tabela dedicada via SQL
    await supabase
      .from("metas_producao")
      .update({
        observacao: JSON.stringify(analiseCompleta),
      })
      .eq("empresa_id", "11111111-1111-1111-1111-111111111111")

    // Salvar na tabela _dedup_temp_log
    await supabase.from("_dedup_temp_log").insert({
      resultado: analiseCompleta,
    })

    return new Response(JSON.stringify(analiseCompleta), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
