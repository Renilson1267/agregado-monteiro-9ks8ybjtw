import { splitCsvLine } from "@/lib/csv-cargas-parser"
import {
  FolhaPagamentoLinha,
  TipoColaboradorFolha,
  FolhaTotaisCalculados,
  calcularMensalLiquido,
} from "@/types/folha"

export interface LinhaFolhaParsed
  extends Omit<FolhaPagamentoLinha, "id" | "empresa_id"> { // se o MensalLiquido do CSV for diferente da fórmula
  linhaIndex: number
  erros: string[]
  avisos: string[]
  diferencaCalculo?: number
}

export interface PreviewImportacaoFolhaCSV {
  competenciaSugerida: string // 'YYYY-MM'
  totalLinhasLidas: number
  totalColaboradoresValidos: number
  totalFuncionarios: number
  totalTerceiros: number
  totalDuplicadosPlanilha: number
  totalExistentesAtualizados: number
  totalNovos: number
  totais: FolhaTotaisCalculados
  linhas: LinhaFolhaParsed[]
  avisos: string[]
  erros: string[]
  funcoesDetectadas: string[]
}

function normalizarTexto(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/**
 * Converte string flexível brasileira/inglesa para número
 * Suporta: "2410", "192.58", "1.253,42", "1253,42", "R$ 1.253,42", "", "-", "—"
 */
export function parseMoedaBr(val: any): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return isNaN(val) ? 0 : val

  let str = String(val).trim()
  if (!str || str === "-" || str === "—" || str === "null") return 0

  let negativo = false
  if (str.startsWith("(") && str.endsWith(")")) {
    negativo = true
    str = str.slice(1, -1).trim()
  } else if (str.startsWith("-")) {
    negativo = true
    str = str.slice(1).trim()
  }

  // Remove "R$" e espaços
  str = str.replace(/[R$\s]/gi, "")

  // Se tem ponto e vírgula (ex: "1.253,42")
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".")
  } else if (str.includes(",")) {
    // Ex: "1253,42"
    str = str.replace(",", ".")
  }
  // Se só tem ponto (ex: "192.58" ou "2410"), o parseFloat nativo já interpreta como decimal correto

  const num = parseFloat(str)
  if (isNaN(num)) return 0
  return negativo ? -num : num
}

/**
 * Tenta inferir competência 'YYYY-MM' do nome do arquivo (ex: "folha-2026-09 (4)-73533.csv" -> "2026-09")
 */
export function extrairCompetenciaDoNomeArquivo(nomeArquivo?: string): string {
  if (nomeArquivo) {
    const matchIso = nomeArquivo.match(/(202\d)[-_](\d{2})/)
    if (matchIso) {
      return `${matchIso[1]}-${matchIso[2]}`
    }
    const matchBr = nomeArquivo.match(/(\d{2})[-_](202\d)/)
    if (matchBr) {
      return `${matchBr[2]}-${matchBr[1]}`
    }
  }

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  return `${ano}-${mes}`
}

/**
 * Mapeamento das colunas da folha real
 * Cabeçalho do anexo:
 * Tipo;Nome;Funcao;Unidade;Bruto;Filhos;INSS;Familia;IR;Quinzena;Adiantamento;Gratificacao;MensalLiquido;Producao;Comissao;Conta;PIX
 */
interface MapaColunasFolhaReal {
  tipo?: number
  nome?: number
  funcao?: number
  unidade?: number
  bruto?: number
  filhos?: number
  inss?: number
  familia?: number
  ir?: number
  quinzena?: number
  adiantamento?: number
  gratificacao?: number
  mensalliquido?: number
  producao?: number
  comissao?: number
  conta?: number
  pix?: number
}

function identificarColunasFolhaReal(
  cabecalho: string[],
): MapaColunasFolhaReal {
  const mapa: MapaColunasFolhaReal = {}

  cabecalho.forEach((colCrua, idx) => {
    const col = normalizarTexto(colCrua).replace(/[\s_-]/g, "")

    if (col === "tipo" || col === "tipocolaborador") {
      if (mapa.tipo === undefined) mapa.tipo = idx
    } else if (
      col === "nome" ||
      col === "colaborador" ||
      col === "funcionario" ||
      col === "empregado"
    ) {
      if (mapa.nome === undefined) mapa.nome = idx
    } else if (col === "funcao" || col === "cargo" || col === "ocupacao") {
      if (mapa.funcao === undefined) mapa.funcao = idx
    } else if (col === "unidade" || col === "empresa" || col === "filial") {
      if (mapa.unidade === undefined) mapa.unidade = idx
    } else if (
      col === "bruto" ||
      col === "salariobruto" ||
      col === "salariobase" ||
      col === "salario"
    ) {
      if (mapa.bruto === undefined) mapa.bruto = idx
    } else if (
      col === "filhos" ||
      col === "dependentes" ||
      col === "qtdfilhos"
    ) {
      if (mapa.filhos === undefined) mapa.filhos = idx
    } else if (col === "inss" || col === "inssretido") {
      if (mapa.inss === undefined) mapa.inss = idx
    } else if (
      col === "familia" ||
      col === "salariofamilia" ||
      col === "salfamilia"
    ) {
      if (mapa.familia === undefined) mapa.familia = idx
    } else if (
      col === "ir" ||
      col === "irrf" ||
      col === "impostoderenda" ||
      col === "irretido"
    ) {
      if (mapa.ir === undefined) mapa.ir = idx
    } else if (
      col === "quinzena" ||
      col === "1quinzena" ||
      col === "primeiraquinzena"
    ) {
      if (mapa.quinzena === undefined) mapa.quinzena = idx
    } else if (
      col === "adiantamento" ||
      col === "vale" ||
      col === "adiantamentos"
    ) {
      if (mapa.adiantamento === undefined) mapa.adiantamento = idx
    } else if (
      col === "gratificacao" ||
      col === "gratificacoes" ||
      col === "premio" ||
      col === "premiacao"
    ) {
      if (mapa.gratificacao === undefined) mapa.gratificacao = idx
    } else if (
      col === "mensalliquido" ||
      col === "liquido" ||
      col === "liquidomensal" ||
      col === "salarioliquido"
    ) {
      if (mapa.mensalliquido === undefined) mapa.mensalliquido = idx
    } else if (col === "producao" || col === "prod") {
      if (mapa.producao === undefined) mapa.producao = idx
    } else if (col === "comissao" || col === "comissoes") {
      if (mapa.comissao === undefined) mapa.comissao = idx
    } else if (
      col === "conta" ||
      col === "contabancaria" ||
      col === "agenciaconta" ||
      col === "banco"
    ) {
      if (mapa.conta === undefined) mapa.conta = idx
    } else if (col === "pix" || col === "chavepix") {
      if (mapa.pix === undefined) mapa.pix = idx
    }
  })

  // Se não encontrou por nomes exatos, define padrão posicional do anexo:
  // Tipo;Nome;Funcao;Unidade;Bruto;Filhos;INSS;Familia;IR;Quinzena;Adiantamento;Gratificacao;MensalLiquido;Producao;Comissao;Conta;PIX
  if (mapa.nome === undefined && cabecalho.length >= 2) {
    mapa.tipo = 0
    mapa.nome = 1
    mapa.funcao = 2
    mapa.unidade = 3
    mapa.bruto = 4
    mapa.filhos = 5
    mapa.inss = 6
    mapa.familia = 7
    mapa.ir = 8
    mapa.quinzena = 9
    mapa.adiantamento = 10
    mapa.gratificacao = 11
    mapa.mensalliquido = 12
    mapa.producao = 13
    mapa.comissao = 14
    mapa.conta = 15
    mapa.pix = 16
  }

  return mapa
}

/**
 * Parser do arquivo CSV da folha real
 * Suporta separadores ';' e ',', decimais com vírgula ou ponto, campos vazios = 0
 * Trata linhas com Tipo "Terceiro" (que não têm Bruto/INSS)
 * Deduplica por (competência, nome)
 */
export function parseFolhaPagamentoCSV(
  conteudoCsv: string,
  nomeArquivo?: string,
  competenciaForcada?: string,
  nomesCadastradosBanco: Set<string> = new Set(),
): PreviewImportacaoFolhaCSV {
  const avisos: string[] = []
  const erros: string[] = []

  const competencia =
    competenciaForcada || extrairCompetenciaDoNomeArquivo(nomeArquivo)

  const emptyResult: PreviewImportacaoFolhaCSV = {
    competenciaSugerida: competencia,
    totalLinhasLidas: 0,
    totalColaboradoresValidos: 0,
    totalFuncionarios: 0,
    totalTerceiros: 0,
    totalDuplicadosPlanilha: 0,
    totalExistentesAtualizados: 0,
    totalNovos: 0,
    totais: {
      totalRegistros: 0,
      totalFuncionarios: 0,
      totalTerceiros: 0,
      totalBruto: 0,
      totalFilhos: 0,
      totalInss: 0,
      totalFamilia: 0,
      totalIr: 0,
      totalQuinzena: 0,
      totalAdiantamento: 0,
      totalGratificacao: 0,
      totalMensalLiquido: 0,
      totalProducao: 0,
      totalComissao: 0,
      totalGeralLiquidoAReceber: 0,
    },
    linhas: [],
    avisos: [],
    erros: [],
    funcoesDetectadas: [],
  }

  if (!conteudoCsv || !conteudoCsv.trim()) {
    emptyResult.erros.push("Arquivo CSV vazio ou sem conteúdo legível.")
    return emptyResult
  }

  const textoTratado = conteudoCsv.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhasCruas = textoTratado.split("\n")

  let indiceLinhaCabecalho = -1
  let delimitador = ";"

  // Detecta linha do cabeçalho e delimitador (; ou ,)
  for (let i = 0; i < Math.min(linhasCruas.length, 10); i++) {
    const l = linhasCruas[i]
    if (!l.trim()) continue

    const pontoVirgulas = (l.match(/;/g) || []).length
    const virgulas = (l.match(/,/g) || []).length

    const delim = pontoVirgulas >= virgulas ? ";" : ","
    const cols = (delim === ";" ? l.split(";") : splitCsvLine(l)).map(
      normalizarTexto,
    )

    const temNome = cols.some((c) => c.includes("nome"))
    const temFuncao = cols.some(
      (c) => c.includes("func") || c.includes("cargo"),
    )
    const temFinanceiro = cols.some(
      (c) =>
        c.includes("bruto") ||
        c.includes("inss") ||
        c.includes("liquido") ||
        c.includes("quinzena"),
    )

    if (temNome && (temFuncao || temFinanceiro)) {
      indiceLinhaCabecalho = i
      delimitador = delim
      break
    }
  }

  if (indiceLinhaCabecalho === -1) {
    indiceLinhaCabecalho = 0
  }

  const cabecalhoBruto = (
    delimitador === ";"
      ? linhasCruas[indiceLinhaCabecalho].split(";")
      : splitCsvLine(linhasCruas[indiceLinhaCabecalho])
  ).map((c) => c.trim())

  const mapa = identificarColunasFolhaReal(cabecalhoBruto)

  const getCol = (cols: string[], idx?: number): string => {
    if (idx === undefined || idx < 0 || idx >= cols.length) return ""
    return cols[idx]?.trim() || ""
  }

  const getNumCol = (cols: string[], idx?: number): number => {
    const raw = getCol(cols, idx)
    return parseMoedaBr(raw)
  }

  const linhasParseadas: LinhaFolhaParsed[] = []
  const nomesVistos = new Set<string>()
  const funcoesSet = new Set<string>()

  let totalDuplicadosPlanilha = 0
  let totalExistentesAtualizados = 0
  let totalNovos = 0
  let totalFuncionarios = 0
  let totalTerceiros = 0

  for (let i = indiceLinhaCabecalho + 1; i < linhasCruas.length; i++) {
    const linhaTexto = linhasCruas[i].trim()
    if (!linhaTexto) continue

    const colunas = (
      delimitador === ";" ? linhaTexto.split(";") : splitCsvLine(linhaTexto)
    ).map((c) => c.trim())

    // Ignora linhas de totalizadores do rodapé da planilha (ex: "TOTAL;;;;;;2583.11...")
    const primeiraColNorm = normalizarTexto(colunas[0] || "")
    const segundaColNorm = normalizarTexto(colunas[1] || "")
    if (
      primeiraColNorm.startsWith("total") ||
      primeiraColNorm.startsWith("subtotal") ||
      segundaColNorm.startsWith("total")
    ) {
      continue
    }

    const nomeCru = getCol(colunas, mapa.nome)
    // Se não tem nome nesta linha, pula
    if (!nomeCru) continue

    const tipoCru = getCol(colunas, mapa.tipo)
    const tipoNorm = normalizarTexto(tipoCru)
    const tipo: TipoColaboradorFolha = tipoNorm.includes("terceiro")
      ? "Terceiro"
      : "Funcionario"

    const funcaoCru =
      getCol(colunas, mapa.funcao) ||
      (tipo === "Terceiro" ? "Terceiro" : "Geral")
    const unidadeCru = getCol(colunas, mapa.unidade) || "SJE"

    // Colunas financeiras
    const bruto = getNumCol(colunas, mapa.bruto)
    const filhosStr = getCol(colunas, mapa.filhos)
    const filhos = parseInt(filhosStr, 10) || 0
    const inss = getNumCol(colunas, mapa.inss)
    const familia = getNumCol(colunas, mapa.familia)
    const ir = getNumCol(colunas, mapa.ir)
    const quinzena = getNumCol(colunas, mapa.quinzena)
    const adiantamento = getNumCol(colunas, mapa.adiantamento)
    const gratificacao = getNumCol(colunas, mapa.gratificacao)
    const mensalLiquidoCsv = getNumCol(colunas, mapa.mensalliquido)
    const producao = getNumCol(colunas, mapa.producao)
    const comissao = getNumCol(colunas, mapa.comissao)

    const conta = getCol(colunas, mapa.conta)
    const pix = getCol(colunas, mapa.pix)

    // Cálculo automático oficial:
    // Líquido Mensal = Bruto − INSS − IR + Família + Gratificação − Quinzena − Adiantamento + Limpeza + Sábado + Férias + Ajuda + Comissão (SEM PRODUÇÃO, que é pagamento à parte)
    const mensalLiquidoCalculado = calcularMensalLiquido({
      tipo,
      bruto,
      inss,
      ir,
      familia,
      gratificacao,
      quinzena,
      adiantamento,
      producao: 0,
      comissao,
    })

    // Se no CSV veio um valor declarado de MensalLiquido diferente de 0, verifica se confere
    let mensalLiquidoFinal = mensalLiquidoCsv
    let modoCalculo: "Calculado" | "Digitado" = "Calculado"
    const diferenca = Math.abs(mensalLiquidoCsv - mensalLiquidoCalculado)

    if (mensalLiquidoCsv !== 0 && diferenca > 0.05) {
      modoCalculo = "Digitado" // Usuário fixou na planilha um valor divergente da fórmula padrão
    } else if (mensalLiquidoCsv === 0 && mensalLiquidoCalculado !== 0) {
      mensalLiquidoFinal = mensalLiquidoCalculado
      modoCalculo = "Calculado"
    }

    const linhaErros: string[] = []
    const linhaAvisos: string[] = []

    if (tipo === "Terceiro") {
      totalTerceiros++
      if (bruto > 0 || inss > 0) {
        linhaAvisos.push(
          "Terceiro com valor de Bruto/INSS informado no arquivo; preservado conforme digitado.",
        )
      }
    } else {
      totalFuncionarios++
      if (bruto <= 0 && producao <= 0 && comissao <= 0) {
        linhaAvisos.push(
          "Funcionário sem valor de Bruto, Produção ou Comissão informado.",
        )
      }
    }

    const nomeChave = normalizarTexto(nomeCru)
    if (nomesVistos.has(nomeChave)) {
      totalDuplicadosPlanilha++
      avisos.push(
        `Linha ${i + 1}: Colaborador "${nomeCru}" duplicado no arquivo. A última ocorrência será considerada.`,
      )
    }
    nomesVistos.add(nomeChave)

    if (nomesCadastradosBanco.has(nomeCru.trim().toUpperCase())) {
      totalExistentesAtualizados++
    } else {
      totalNovos++
    }

    funcoesSet.add(funcaoCru.toUpperCase())

    linhasParseadas.push({
      linhaIndex: i + 1,
      competencia,
      tipo,
      nome: nomeCru.toUpperCase(),
      funcao: funcaoCru.toUpperCase(),
      unidade: unidadeCru.toUpperCase(),
      bruto,
      filhos,
      inss,
      familia,
      ir,
      quinzena,
      adiantamento,
      gratificacao,
      obras: 0,
      valor_obra: 20,
      producao,
      limpeza: 0,
      sabado: 0,
      ferias: 0,
      ajuda_custo: 0,
      vendas_obra: 0,
      comissao,
      vendas_ajuda: 0,
      mensal_liquido: mensalLiquidoFinal,
      conta,
      pix,
      modo_calculo: modoCalculo,
      diferencaCalculo: diferenca > 0.05 ? diferenca : undefined,
      erros: linhaErros,
      avisos: linhaAvisos,
    })
  }

  // Deduplicação pelo nome normalizado (mantém a última ocorrência)
  const mapaFinal = new Map<string, LinhaFolhaParsed>()
  linhasParseadas.forEach((l) => {
    mapaFinal.set(normalizarTexto(l.nome), l)
  })

  const linhasUnicas = Array.from(mapaFinal.values())

  // Totais consolidados do preview
  const totais: FolhaTotaisCalculados = linhasUnicas.reduce(
    (acc, l) => {
      acc.totalRegistros += 1
      if (l.tipo === "Terceiro") {
        acc.totalTerceiros += 1
      } else {
        acc.totalFuncionarios += 1
      }
      acc.totalBruto += l.bruto
      acc.totalFilhos += l.filhos
      acc.totalInss += l.inss
      acc.totalFamilia += l.familia
      acc.totalIr += l.ir
      acc.totalQuinzena += l.quinzena
      acc.totalAdiantamento += l.adiantamento
      acc.totalGratificacao += l.gratificacao
      acc.totalMensalLiquido += l.mensal_liquido
      acc.totalProducao += l.producao
      acc.totalComissao += l.comissao
      acc.totalGeralLiquidoAReceber += l.mensal_liquido + (l.tipo === "Terceiro" ? 0 : l.producao)      return acc
    },
    {
      totalRegistros: 0,
      totalFuncionarios: 0,
      totalTerceiros: 0,
      totalBruto: 0,
      totalFilhos: 0,
      totalInss: 0,
      totalFamilia: 0,
      totalIr: 0,
      totalQuinzena: 0,
      totalAdiantamento: 0,
      totalGratificacao: 0,
      totalMensalLiquido: 0,
      totalProducao: 0,
      totalComissao: 0,
      totalGeralLiquidoAReceber: 0,
    },
  )

  return {
    competenciaSugerida: competencia,
    totalLinhasLidas: linhasParseadas.length,
    totalColaboradoresValidos: linhasUnicas.length,
    totalFuncionarios,
    totalTerceiros,
    totalDuplicadosPlanilha,
    totalExistentesAtualizados,
    totalNovos,
    totais,
    linhas: linhasUnicas,
    avisos,
    erros,
    funcoesDetectadas: Array.from(funcoesSet).sort(),
  }
}
