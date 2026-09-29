import { carregarSheetJs } from "./sheetjs-loader"
import { TipoCaixaLancamento } from "@/types/caixa"

export interface LinhaCaixaImportada {
  idTemp: string
  origemAba: string
  tipoOrigem: "mensal" | "obras" | "outros"
  data: string // YYYY-MM-DD
  competencia: string // YYYY-MM
  tipo: TipoCaixaLancamento
  categoria: string
  descricao: string
  valor: number
  obraNome?: string | null
  documentoRef?: string | null
  observacao?: string | null
  valido: boolean
  motivoInvalido?: string
}

export interface AbaDetectadaInfo {
  nome: string
  tipo: "mensal" | "anual" | "obras" | "outros"
  competencia?: string
  totalLinhasLidas: number
  totalValidos: number
  totalEntradas: number
  totalSaidas: number
}

export interface PreviewImportacaoCaixa {
  nomeArquivo: string
  totalAbas: number
  abasProcessadas: AbaDetectadaInfo[]
  linhasValidas: LinhaCaixaImportada[]
  linhasInvalidas: LinhaCaixaImportada[]
  competenciasEncontradas: string[]
  totalEntradas: number
  totalSaidas: number
  saldoLiquido: number
  totalLinhasMensais: number
  totalLinhasObras: number
}

// Mapeamento de nomes de meses em português para número 01-12
const MESES_MAP: { [k: string]: string } = {
  jan: "01",
  janeiro: "01",
  jane: "01",
  fev: "02",
  feve: "02",
  fevereiro: "02",
  mar: "03",
  marc: "03",
  marco: "03",
  março: "03",
  abr: "04",
  abri: "04",
  abril: "04",
  mai: "05",
  maio: "05",
  jun: "06",
  junh: "06",
  junho: "06",
  jul: "07",
  julh: "07",
  julho: "07",
  ago: "08",
  agos: "08",
  agosto: "08",
  set: "09",
  sete: "09",
  setembro: "09",
  out: "10",
  outu: "10",
  outubro: "10",
  nov: "11",
  nove: "11",
  novembro: "11",
  dez: "12",
  deze: "12",
  dezembro: "12",
}

/**
 * Detecta competência (YYYY-MM) a partir de nomes de abas como:
 * - "JANEIRO 2023", "FEVEREIRO 2023", "SETEMBRO 2024"
 * - "Agos2026", "Out2026", "Set2025"
 * - "ObrasSET2023", "ObrasJANE2024", "ObrasFEV2024", "ObrasMAR2025"
 * - "01-2024", "2024-01", "01.2024"
 */
export function detectarCompetenciaDeNomeAba(nomeAba: string): string | null {
  if (!nomeAba) return null
  let limpo = nomeAba
    .trim()
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ã|á|à|â/g, "a")
    .replace(/é|ê/g, "e")
    .replace(/í/g, "i")
    .replace(/ó|õ|ô/g, "o")
    .replace(/ú/g, "u")

  // Remove prefixo de Obras se houver ("obras", "obra")
  limpo = limpo.replace(/^obras?[\s_-]*/i, "")

  // Padrões com nome do mês + ano: ex "janeiro 2023", "agos2026", "jane2024", "set2023", "mar24"
  const m1 = limpo.match(/([a-z]+)[\s_-]*(\d{2,4})/)
  if (m1) {
    const nomeMes = m1[1]
    let mesNum = MESES_MAP[nomeMes]
    if (!mesNum) {
      // Tentar prefixos de 4 ou 3 letras
      const pref4 = nomeMes.substring(0, 4)
      const pref3 = nomeMes.substring(0, 3)
      mesNum = MESES_MAP[pref4] || MESES_MAP[pref3]
    }

    if (mesNum) {
      let anoStr = m1[2]
      if (anoStr.length === 2) anoStr = "20" + anoStr
      return `${anoStr}-${mesNum}`
    }
  }

  // Padrão numérico: "2024-01", "2024_01", "2024.01"
  const m2 = limpo.match(/(\d{4})[-_./](\d{1,2})/)
  if (m2) {
    return `${m2[1]}-${m2[2].padStart(2, "0")}`
  }

  // Padrão numérico invertido: "01-2024", "01/2024", "01.2024"
  const m3 = limpo.match(/(\d{1,2})[-_./](\d{4})/)
  if (m3) {
    return `${m3[2]}-${m3[1].padStart(2, "0")}`
  }

  return null
}

export function normalizarMoeda(valor: any): number {
  if (typeof valor === "number")
    return isNaN(valor) ? 0 : Math.round(valor * 100) / 100
  if (!valor) return 0

  let str = String(valor).trim()
  if (!str) return 0

  // Se vier com formatação de moeda R$, espaços, etc
  str = str.replace(/[R$\s]/g, "")

  // Formato brasileiro com separador de milhar e vírgula decimal
  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/\./g, "").replace(",", ".")
  } else if (str.includes(",")) {
    str = str.replace(",", ".")
  }

  const num = parseFloat(str)
  return isNaN(num) ? 0 : Math.round(num * 100) / 100
}

export function normalizarDataExcel(
  valorData: any,
  compPadrao?: string,
): string {
  if (!valorData) {
    return compPadrao
      ? `${compPadrao}-01`
      : new Date().toISOString().substring(0, 10)
  }

  // Se for número serial de data do Excel (ex: 45292)
  if (typeof valorData === "number" && valorData > 20000 && valorData < 70000) {
    // Época do Excel: 1899-12-30
    const dataJs = new Date(Math.round((valorData - 25569) * 86400 * 1000))
    if (!isNaN(dataJs.getTime())) {
      return dataJs.toISOString().substring(0, 10)
    }
  }

  const str = String(valorData).trim()

  // Se já for ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10)
  }

  // Se for formato DD/MM/YYYY ou DD/MM/YY
  const mBr = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (mBr) {
    const dia = mBr[1].padStart(2, "0")
    const mes = mBr[2].padStart(2, "0")
    let ano = mBr[3]
    if (ano.length === 2) ano = "20" + ano
    return `${ano}-${mes}-${dia}`
  }

  // Se for apenas o dia do mês (ex: número 1 a 31)
  if (/^\d{1,2}$/.test(str) && compPadrao) {
    const dia = str.padStart(2, "0")
    return `${compPadrao}-${dia}`
  }

  return compPadrao
    ? `${compPadrao}-01`
    : new Date().toISOString().substring(0, 10)
}

/**
 * Categorizador inteligente baseado no texto da descrição
 */
export function sugerirCategoria(
  descricao: string,
  tipo: TipoCaixaLancamento,
): string {
  const d = descricao.toLowerCase()

  if (tipo === "entrada") {
    if (
      d.includes("obra") ||
      d.includes("concreto") ||
      d.includes("usina") ||
      d.includes("cosampa") ||
      d.includes("aurelio") ||
      d.includes("aurélio") ||
      d.includes("concretisa") ||
      d.includes("rec") ||
      d.includes("medicao") ||
      d.includes("medição")
    ) {
      return "Recebimento de Obra"
    }
    if (
      d.includes("brita") ||
      d.includes("areia") ||
      d.includes("agregado") ||
      d.includes("po") ||
      d.includes("pó")
    ) {
      return "Venda de Agregados / Brita"
    }
    if (d.includes("bomba") || d.includes("bombeamento")) {
      return "Serviço de Bombeamento"
    }
    if (d.includes("aporte") || d.includes("transf") || d.includes("emprest")) {
      return "Aporte / Transferência entre Contas"
    }
    if (d.includes("rend") || d.includes("juro") || d.includes("aplic")) {
      return "Rendimento / Financeiro"
    }
    return "Recebimento de Obra"
  }

  // Tipo Saída
  if (
    d.includes("cimento") ||
    d.includes("aditivo") ||
    d.includes("areia") ||
    d.includes("brita") ||
    d.includes("pedra")
  ) {
    return "Insumos (Cimento/Areia/Brita/Aditivo)"
  }
  if (
    d.includes("diesel") ||
    d.includes("combust") ||
    d.includes("gasolina") ||
    d.includes("posto") ||
    d.includes("abastec")
  ) {
    return "Combustível e Lubrificantes"
  }
  if (
    d.includes("folha") ||
    d.includes("salario") ||
    d.includes("pagamento func") ||
    d.includes("diaria")
  ) {
    return "Folha de Pagamento"
  }
  if (d.includes("quinzena") || d.includes("adiantam") || d.includes("vale")) {
    return "Adiantamento de Folha / Quinzena"
  }
  if (
    d.includes("mecan") ||
    d.includes("manutenc") ||
    d.includes("oficina") ||
    d.includes("conserto") ||
    d.includes("reparo")
  ) {
    return "Manutenção de Caminhões / Central"
  }
  if (
    d.includes("pneu") ||
    d.includes("peça") ||
    d.includes("peca") ||
    d.includes("filtro") ||
    d.includes("bateria")
  ) {
    return "Peças e Pneus"
  }
  if (
    d.includes("imposto") ||
    d.includes("das") ||
    d.includes("darf") ||
    d.includes("icms") ||
    d.includes("iss") ||
    d.includes("fgts") ||
    d.includes("gps")
  ) {
    return "Impostos e Tributos (DAS/ICMS/ISS)"
  }
  if (
    d.includes("energia") ||
    d.includes("luz") ||
    d.includes("agua") ||
    d.includes("cagepa") ||
    d.includes("celpe") ||
    d.includes("internet") ||
    d.includes("telefone")
  ) {
    return "Energia Elétrica / Água / Internet"
  }
  if (d.includes("aluguel") || d.includes("locacao") || d.includes("maquina")) {
    return "Aluguel / Imóveis / Máquinas"
  }
  if (
    d.includes("almoco") ||
    d.includes("lanche") ||
    d.includes("refeic") ||
    d.includes("aliment") ||
    d.includes("viagem") ||
    d.includes("hotel")
  ) {
    return "Alimentação e Despesas de Viagem"
  }
  if (
    d.includes("tarifa") ||
    d.includes("ted") ||
    d.includes("pix") ||
    d.includes("taxa") ||
    d.includes("juro") ||
    d.includes("banco") ||
    d.includes("iof")
  ) {
    return "Despesas Bancárias / Juros / Tarifas"
  }
  if (
    d.includes("pro-labore") ||
    d.includes("prolabore") ||
    d.includes("socio") ||
    d.includes("retirada") ||
    d.includes("marinaldo") ||
    d.includes("roberto")
  ) {
    return "Retirada de Pró-labore / Sócios"
  }

  return "Outras Despesas Operacionais"
}

/**
 * Extrai nome de obra limpo do texto
 */
export function extrairNomeObra(texto: string): string | null {
  if (!texto) return null
  const limpo = texto.trim()
  if (limpo.length < 2) return null

  // Empresas parceiras conhecidas
  if (/cosampa/i.test(limpo)) return "COSAMPA"
  if (/aurelio|aurélio/i.test(limpo)) return "AURÉLIO"
  if (/concretisa/i.test(limpo)) return "CONCRETISA"

  // Casos comuns: "OBRA TAL", "REC. OBRA COSAMPA", "MEDICAO OBRA X"
  const m = limpo.match(
    /(?:obra|rec\.|rec\s+obra|recebimento|medicao|medição)\s+([a-záéíóúâêîôûãõç0-9\s-]+)/i,
  )
  if (m && m[1]) {
    const ob = m[1].trim()
    if (ob.length >= 3) return ob
  }

  return null
}

/**
 * Parser especializado para a planilha "Fec_ Caixa SJE":
 * 1. Abas Mensais do Caixa: "JANEIRO 2023", "FEVEREIRO 2023", ... "Agos2026"
 * 2. Abas de Obras por mês: "ObrasSET2023", "ObrasJANE2024", etc. (~100-160 linhas/mês de recebimentos detalhados por obra)
 * 3. Identifica e pula abas de Fechamento Anual ("CAIXA ANUAL", "Anual2025", "CAIXA ANUAL 2024 SJE") para não duplicar dados
 */
export async function parseCaixaPlanilha(
  fileBuffer: ArrayBuffer,
  nomeArquivo: string,
): Promise<PreviewImportacaoCaixa> {
  const XLSX = await carregarSheetJs()
  const workbook = XLSX.read(fileBuffer, { type: "array", cellDates: true })

  const abasProcessadas: AbaDetectadaInfo[] = []
  const linhasValidas: LinhaCaixaImportada[] = []
  const linhasInvalidas: LinhaCaixaImportada[] = []
  const compsEncontradas = new Set<string>()

  let totalEntradasGeral = 0
  let totalSaidasGeral = 0
  let totalLinhasMensais = 0
  let totalLinhasObras = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    })

    if (!rows || rows.length === 0) continue

    const nomeLower = sheetName.toLowerCase().trim()
    const compDetectada = detectarCompetenciaDeNomeAba(sheetName)

    // Classificação da aba:
    // (a) "obras": se começar com "obras" ou contiver "obras" seguido do mês/ano (ex: ObrasSET2023, ObrasJANE2024)
    // (b) "anual": se contiver "anual" ou "fechamento"
    // (c) "mensal": se detectou competência e não for obra nem anual
    // (d) "outros"
    const ehAbaObras =
      nomeLower.startsWith("obra") ||
      (nomeLower.includes("obra") && Boolean(compDetectada))
    const ehAbaAnual =
      nomeLower.includes("anual") ||
      nomeLower.includes("fechamento") ||
      nomeLower.includes("resumo ano")

    let tipoAba: AbaDetectadaInfo["tipo"] = "outros"
    if (ehAbaAnual) {
      tipoAba = "anual"
    } else if (ehAbaObras) {
      tipoAba = "obras"
    } else if (compDetectada) {
      tipoAba = "mensal"
    }

    // Se for anual ou não puder ser processada, registra e pula
    if (tipoAba === "anual" || tipoAba === "outros") {
      abasProcessadas.push({
        nome: sheetName,
        tipo: tipoAba,
        competencia: compDetectada || undefined,
        totalLinhasLidas: rows.length,
        totalValidos: 0,
        totalEntradas: 0,
        totalSaidas: 0,
      })
      continue
    }

    if (compDetectada) {
      compsEncontradas.add(compDetectada)
    }

    // =========================================================================
    // PROCESSAMENTO ESPECÍFICO CONFORME O TIPO DA ABA
    // =========================================================================

    let abaEntradas = 0
    let abaSaidas = 0
    let abaValidos = 0

    if (ehAbaObras) {
      // -----------------------------------------------------------------------
      // FAMÍLIA DE ABAS DE OBRAS POR MÊS (ex: ObrasSET2023, ObrasJANE2024)
      // Recebimentos detalhados por obra (~100-160 linhas/mês).
      // Colunas comuns: Data / Dia | Obra / Cliente | Descrição / Detalhe | Valor Recebido
      // -----------------------------------------------------------------------
      let colData = -1
      let colObra = -1
      let colDesc = -1
      let colValor = -1
      let headerRowIdx = -1

      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r]
        if (!Array.isArray(row)) continue
        const rowText = row.map((c) =>
          String(c || "")
            .toLowerCase()
            .trim(),
        )

        for (let c = 0; c < rowText.length; c++) {
          const cel = rowText[c]
          if (cel.includes("data") || cel === "dia" || cel.startsWith("dt"))
            colData = c
          if (
            cel.includes("obra") ||
            cel.includes("cliente") ||
            cel.includes("destin")
          )
            colObra = c
          if (
            cel.includes("desc") ||
            cel.includes("hist") ||
            cel.includes("detalhe") ||
            cel.includes("servico")
          )
            colDesc = c
          if (
            cel.includes("valor") ||
            cel.includes("total") ||
            cel.includes("receb") ||
            cel.includes("entrada") ||
            cel.includes("r$")
          )
            colValor = c
        }

        if (colValor !== -1 && (colObra !== -1 || colData !== -1)) {
          headerRowIdx = r
          break
        }
      }

      // Se não encontrou cabeçalho explícito na aba de obras, adotar posições clássicas
      if (headerRowIdx === -1) {
        headerRowIdx = 0
        colData = 0
        colObra = 1
        colDesc = 2
        colValor = 3
      }

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r]
        if (!Array.isArray(row) || row.length === 0) continue

        const textoLinha = row.join(" ").toLowerCase()
        if (
          textoLinha.includes("total geral") ||
          textoLinha.includes("total") ||
          textoLinha.includes("saldo") ||
          textoLinha.includes("subtotal")
        ) {
          continue
        }

        const valDataRaw = colData >= 0 ? row[colData] : null
        const obraRaw = colObra >= 0 ? String(row[colObra] || "").trim() : ""
        const descRaw = colDesc >= 0 ? String(row[colDesc] || "").trim() : ""
        const valorRaw = colValor >= 0 ? row[colValor] : null

        const valor = normalizarMoeda(valorRaw)
        if (valor <= 0) continue

        // Nome da obra identificado
        const nomeObra =
          obraRaw || extrairNomeObra(descRaw) || `Obra ${sheetName}`
        const descricaoFinal =
          descRaw ||
          (obraRaw ? `Recebimento Obra ${obraRaw}` : "Recebimento de Obra")

        const dataIso = normalizarDataExcel(
          valDataRaw,
          compDetectada || undefined,
        )
        const compLinha = compDetectada || dataIso.substring(0, 7)
        compsEncontradas.add(compLinha)

        const linha: LinhaCaixaImportada = {
          idTemp: `imp-obras-${sheetName}-${r}`,
          origemAba: sheetName,
          tipoOrigem: "obras",
          data: dataIso,
          competencia: compLinha,
          tipo: "entrada",
          categoria: "Recebimento de Obra",
          descricao: descricaoFinal,
          valor,
          obraNome: nomeObra,
          observacao: `Importado da aba de Obras (${sheetName})`,
          valido: true,
        }

        linhasValidas.push(linha)
        abaValidos++
        totalLinhasObras++
        abaEntradas += valor
        totalEntradasGeral += valor
      }
    } else {
      // -----------------------------------------------------------------------
      // FAMÍLIA DE ABAS MENSAIS DO CAIXA (ex: "JANEIRO 2023", "Agos2026")
      // Movimentação completa de entradas e saídas operacionais.
      // -----------------------------------------------------------------------
      let colData = -1
      let colDesc = -1
      let colEntrada = -1
      let colSaida = -1
      let colValor = -1
      let colTipo = -1
      let colCategoria = -1
      let colObra = -1
      let headerRowIdx = -1

      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r]
        if (!Array.isArray(row)) continue
        const rowText = row.map((c) =>
          String(c || "")
            .toLowerCase()
            .trim(),
        )

        for (let c = 0; c < rowText.length; c++) {
          const cel = rowText[c]
          if (cel.includes("data") || cel === "dia" || cel.startsWith("dt"))
            colData = c
          if (
            cel.includes("hist") ||
            cel.includes("descri") ||
            cel.includes("detalhe")
          )
            colDesc = c
          if (
            cel.includes("entrada") ||
            cel.includes("receita") ||
            cel.includes("credito") ||
            cel === "rec" ||
            cel.startsWith("rec.")
          )
            colEntrada = c
          if (
            cel.includes("saida") ||
            cel.includes("saída") ||
            cel.includes("despesa") ||
            cel.includes("debito") ||
            cel.includes("pagto")
          )
            colSaida = c
          if (cel === "valor" || cel.includes("valor (r$)")) colValor = c
          if (cel.includes("tipo")) colTipo = c
          if (cel.includes("categ") || cel.includes("grupo")) colCategoria = c
          if (cel.includes("obra") || cel.includes("cliente")) colObra = c
        }

        if (
          colData !== -1 &&
          (colEntrada !== -1 ||
            colSaida !== -1 ||
            colValor !== -1 ||
            colDesc !== -1)
        ) {
          headerRowIdx = r
          break
        }
      }

      if (headerRowIdx === -1) {
        headerRowIdx = 0
        colData = 0
        colDesc = 1
        colEntrada = 2
        colSaida = 3
      }

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r]
        if (!Array.isArray(row) || row.length === 0) continue

        const valDataRaw = colData >= 0 ? row[colData] : null
        const descRaw = colDesc >= 0 ? String(row[colDesc] || "").trim() : ""
        const obraRaw = colObra >= 0 ? String(row[colObra] || "").trim() : ""
        const catRaw =
          colCategoria >= 0 ? String(row[colCategoria] || "").trim() : ""

        const textoLinha = row.join(" ").toLowerCase()
        if (
          textoLinha.includes("saldo anterior") ||
          textoLinha.includes("total geral") ||
          textoLinha.includes("total entradas") ||
          textoLinha.includes("total saídas") ||
          textoLinha.includes("total saidas") ||
          textoLinha.includes("saldo final") ||
          textoLinha.includes("fechamento")
        ) {
          continue
        }

        let tipoLinha: TipoCaixaLancamento | null = null
        let valorLinha = 0

        if (colEntrada >= 0 && colSaida >= 0) {
          const vEnt = normalizarMoeda(row[colEntrada])
          const vSai = normalizarMoeda(row[colSaida])

          if (vEnt > 0 && vSai === 0) {
            tipoLinha = "entrada"
            valorLinha = vEnt
          } else if (vSai > 0 && vEnt === 0) {
            tipoLinha = "saida"
            valorLinha = vSai
          } else if (vEnt > 0 && vSai > 0) {
            tipoLinha = "entrada"
            valorLinha = vEnt
          }
        } else if (colValor >= 0) {
          const v = normalizarMoeda(row[colValor])
          if (v > 0) {
            valorLinha = v
            if (colTipo >= 0) {
              const tStr = String(row[colTipo] || "").toLowerCase()
              tipoLinha =
                tStr.includes("ent") || tStr.includes("rec")
                  ? "entrada"
                  : "saida"
            } else {
              tipoLinha =
                descRaw.toLowerCase().includes("rec") ||
                descRaw.toLowerCase().includes("venda")
                  ? "entrada"
                  : "saida"
            }
          }
        }

        if (!tipoLinha || valorLinha <= 0) continue

        const dataIso = normalizarDataExcel(
          valDataRaw,
          compDetectada || undefined,
        )
        const compLinha = compDetectada || dataIso.substring(0, 7)
        compsEncontradas.add(compLinha)

        const categoriaLinha = catRaw || sugerirCategoria(descRaw, tipoLinha)
        const nomeObraDetectado = obraRaw || extrairNomeObra(descRaw)

        const linha: LinhaCaixaImportada = {
          idTemp: `imp-mensal-${sheetName}-${r}`,
          origemAba: sheetName,
          tipoOrigem: "mensal",
          data: dataIso,
          competencia: compLinha,
          tipo: tipoLinha,
          categoria: categoriaLinha,
          descricao:
            descRaw ||
            (tipoLinha === "entrada"
              ? "Recebimento diverso"
              : "Despesa operacional"),
          valor: valorLinha,
          obraNome: nomeObraDetectado,
          observacao: `Aba Mensal: ${sheetName}`,
          valido: true,
        }

        linhasValidas.push(linha)
        abaValidos++
        totalLinhasMensais++

        if (tipoLinha === "entrada") {
          abaEntradas += valorLinha
          totalEntradasGeral += valorLinha
        } else {
          abaSaidas += valorLinha
          totalSaidasGeral += valorLinha
        }
      }
    }

    abasProcessadas.push({
      nome: sheetName,
      tipo: tipoAba,
      competencia: compDetectada || undefined,
      totalLinhasLidas: rows.length,
      totalValidos: abaValidos,
      totalEntradas: abaEntradas,
      totalSaidas: abaSaidas,
    })
  }

  const compsOrdenadas = Array.from(compsEncontradas).sort()

  return {
    nomeArquivo,
    totalAbas: workbook.SheetNames.length,
    abasProcessadas,
    linhasValidas,
    linhasInvalidas,
    competenciasEncontradas: compsOrdenadas,
    totalEntradas: totalEntradasGeral,
    totalSaidas: totalSaidasGeral,
    saldoLiquido: totalEntradasGeral - totalSaidasGeral,
    totalLinhasMensais,
    totalLinhasObras,
  }
}
