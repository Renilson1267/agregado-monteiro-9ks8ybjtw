import { carregarSheetJs } from "./sheetjs-loader"
import { TipoCaixaLancamento } from "@/types/caixa"

export interface LinhaCaixaImportada {
  idTemp: string
  origemAba: string
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
}

// Mapeamento de nomes de meses em português para número 01-12
const MESES_MAP: { [k: string]: string } = {
  jan: "01",
  janeiro: "01",
  fev: "02",
  fevereiro: "02",
  mar: "03",
  marco: "03",
  março: "03",
  abr: "04",
  abril: "04",
  mai: "05",
  maio: "05",
  jun: "06",
  junho: "06",
  jul: "07",
  julho: "07",
  ago: "08",
  agosto: "08",
  set: "09",
  setembro: "09",
  out: "10",
  outubro: "10",
  nov: "11",
  novembro: "11",
  dez: "12",
  dezembro: "12",
}

export function detectarCompetenciaDeNomeAba(nomeAba: string): string | null {
  const limpo = nomeAba.trim().toLowerCase()

  // Padrões como: "JAN 2024", "JANEIRO 24", "JAN_24", "01-2024", "2024-01", "SETEMBRO 2025"
  const m1 = limpo.match(/([a-zçãé]+)[\s_-]*(\d{2,4})/)
  if (m1) {
    const nomeMes = m1[1]
      .replace(/ç/g, "c")
      .replace(/ã/g, "a")
      .replace(/é/g, "e")
    let mesNum = MESES_MAP[nomeMes]
    if (!mesNum) {
      // Tentar match por prefixo de 3 letras
      const pref = nomeMes.substring(0, 3)
      mesNum = MESES_MAP[pref]
    }
    if (mesNum) {
      let anoStr = m1[2]
      if (anoStr.length === 2) anoStr = "20" + anoStr
      return `${anoStr}-${mesNum}`
    }
  }

  // Padrão numérico: "01-2024", "2024-01", "01.2024"
  const m2 = limpo.match(/(\d{4})[-_./](\d{1,2})/)
  if (m2) {
    return `${m2[1]}-${m2[2].padStart(2, "0")}`
  }
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

  // Remover R$, espaços, etc
  str = str.replace(/[R$\s]/g, "")

  // Se tiver formato brasileiro 1.234,56
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

  // Se for número serial do Excel (ex: 45292)
  if (typeof valorData === "number" && valorData > 20000 && valorData < 60000) {
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
      d.includes("concretisa")
    ) {
      return "Recebimento de Obra"
    }
    if (
      d.includes("brita") ||
      d.includes("areia") ||
      d.includes("agregado") ||
      d.includes("po")
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
 * Tenta extrair o nome de uma obra do texto ou de coluna dedicada
 */
export function extrairNomeObra(texto: string): string | null {
  if (!texto) return null
  const limpo = texto.trim()
  if (limpo.length < 3) return null

  // Casos comuns: "OBRA TAL", "REC. OBRA COSAMPA", "EDIFICIO X"
  const m = limpo.match(
    /(?:obra|rec\.|rec\s+obra|recebimento)\s+([a-záéíóúâêîôûãõç0-9\s-]+)/i,
  )
  if (m && m[1]) {
    return m[1].trim()
  }

  // Conhecidas do SJE/Monteiro mencionadas no enunciado
  if (/cosampa/i.test(limpo)) return "COSAMPA"
  if (/aurelio|aurélio/i.test(limpo)) return "AURÉLIO"
  if (/concretisa/i.test(limpo)) return "CONCRETISA"

  return null
}

/**
 * Parser de planilhas XLSX / XLS do Caixa (Fec_Caixa SJE com 78 abas ou padrão mensal)
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

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    })

    if (!rows || rows.length === 0) continue

    const compDetectada = detectarCompetenciaDeNomeAba(sheetName)
    const nomeLower = sheetName.toLowerCase()

    let tipoAba: AbaDetectadaInfo["tipo"] = "outros"
    if (compDetectada) {
      tipoAba = "mensal"
      compsEncontradas.add(compDetectada)
    } else if (
      nomeLower.includes("anual") ||
      nomeLower.includes("fechamento")
    ) {
      tipoAba = "anual"
    } else if (nomeLower.includes("obra")) {
      tipoAba = "obras"
    }

    // Processar apenas abas mensais ou abas de obras/movimento que contenham linhas de caixa
    if (
      tipoAba !== "mensal" &&
      !nomeLower.includes("caixa") &&
      !nomeLower.includes("obra")
    ) {
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

    // Analisar cabeçalhos para descobrir índices das colunas
    // Padrões aceitos:
    // Padrão A (Colunas lado a lado): [Data, Descrição, Entrada, Saída, Saldo]
    // Padrão B: [Data, Tipo, Categoria, Descrição, Valor, Obra]
    // Padrão C: Entradas de um lado [Data, Descrição, Valor] e Saídas do outro [Data, Descrição, Valor]
    let colData = -1
    let colDesc = -1
    let colEntrada = -1
    let colSaida = -1
    let colValor = -1
    let colTipo = -1
    let colCategoria = -1
    let colObra = -1
    let headerRowIdx = -1

    // Varrer primeiras 15 linhas para achar cabeçalho
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
        if (cel.includes("data") || cel.includes("dia")) colData = c
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
          cel.includes("rec")
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

      // Se achou pelo menos data e (entrada/saida ou valor)
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

    // Se não encontrou cabeçalho explícito, tentar posições padrão clássicas do Excel GC MIX
    if (headerRowIdx === -1) {
      headerRowIdx = 0
      colData = 0
      colDesc = 1
      colEntrada = 2
      colSaida = 3
    }

    let abaEntradas = 0
    let abaSaidas = 0
    let abaValidos = 0

    // Varrer linhas de dados após o cabeçalho
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r]
      if (!Array.isArray(row) || row.length === 0) continue

      const valDataRaw = colData >= 0 ? row[colData] : null
      const descRaw = colDesc >= 0 ? String(row[colDesc] || "").trim() : ""
      const obraRaw = colObra >= 0 ? String(row[colObra] || "").trim() : ""
      const catRaw =
        colCategoria >= 0 ? String(row[colCategoria] || "").trim() : ""

      // Pular linhas de totalizadores/resumos da planilha
      const textoLinha = row.join(" ").toLowerCase()
      if (
        textoLinha.includes("saldo anterior") ||
        textoLinha.includes("total geral") ||
        textoLinha.includes("total entradas") ||
        textoLinha.includes("total saídas") ||
        textoLinha.includes("saldo final") ||
        textoLinha.includes("fechamento")
      ) {
        continue
      }

      // 1. Extrair Entrada / Saída
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
          // Ambos com valor - cria entrada e saída separadas se necessário
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
              tStr.includes("ent") || tStr.includes("rec") ? "entrada" : "saida"
          } else {
            // Deduzir tipo pelo texto da descrição
            tipoLinha =
              descRaw.toLowerCase().includes("rec") ||
              descRaw.toLowerCase().includes("venda")
                ? "entrada"
                : "saida"
          }
        }
      }

      // Se não encontrou valor numérico positivo, pular linha vazia
      if (!tipoLinha || valorLinha <= 0) {
        continue
      }

      // Normalizar Data
      const dataIso = normalizarDataExcel(
        valDataRaw,
        compDetectada || undefined,
      )
      const compLinha = compDetectada || dataIso.substring(0, 7)
      compsEncontradas.add(compLinha)

      // Categoria e Obra
      const categoriaLinha = catRaw || sugerirCategoria(descRaw, tipoLinha)
      const nomeObraDetectado =
        obraRaw ||
        extrairNomeObra(descRaw) ||
        (tipoAba === "obras" ? sheetName : null)

      const linhaParsed: LinhaCaixaImportada = {
        idTemp: `imp-${sheetName}-${r}`,
        origemAba: sheetName,
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
        observacao: `Aba: ${sheetName}`,
        valido: true,
      }

      linhasValidas.push(linhaParsed)
      abaValidos++

      if (tipoLinha === "entrada") {
        abaEntradas += valorLinha
        totalEntradasGeral += valorLinha
      } else {
        abaSaidas += valorLinha
        totalSaidasGeral += valorLinha
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
  }
}
