import { parseDataBrParaIso, splitCsvLine } from "@/lib/csv-cargas-parser"
import { limparMascara, formatarCpfCnpj } from "@/lib/documentos"
import { TipoExame, StatusExame } from "@/types/exames"
import { calcularStatusExame } from "@/services/exames"

export interface LinhaExameImportada {
  linhaIndex: number
  nome: string
  funcao: string
  cpf: string | null
  cpfFormatado: string | null
  dataAdmissaoIso: string | null
  dataAdmissaoBr: string | null
  exames: Record<TipoExame, {
    dataIso: string | null
    dataBr: string | null
    status: StatusExame
    validadeMeses: number
  }>
  statusGeralAso: StatusExame
  erros: string[]
  avisos: string[]
}

export interface PreviewImportacaoExamesCSV {
  totalLinhasLidas: number
  totalFuncionariosValidos: number
  totalDuplicadosCpfPlanilha: number
  totalExistentesAtualizados: number
  totalNovos: number
  linhas: LinhaExameImportada[]
  avisos: string[]
  erros: string[]
  funcoesDetectadas: string[]
}

/**
 * Remove acentos e normaliza para busca de colunas
 */
function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/**
 * Mapeia os índices de colunas da planilha de exames
 */
interface MapaColunasExames {
  nome?: number
  funcao?: number
  cpf?: number
  admissao?: number
  admissional?: number
  aso?: number
  acuidade_visual?: number
  audiometria?: number
  avaliacao_clinica?: number
  toxicologico?: number
  rx?: number
  ecg?: number
  demissional?: number
}

function identificarColunas(cabecalho: string[]): MapaColunasExames {
  const mapa: MapaColunasExames = {}

  cabecalho.forEach((colCrua, idx) => {
    const col = normalizarTexto(colCrua)

    if (
      col === "nome" ||
      col.startsWith("funcionario") ||
      col.startsWith("colaborador") ||
      col.includes("nome")
    ) {
      if (mapa.nome === undefined) mapa.nome = idx
    } else if (
      col === "funcao" ||
      col.includes("cargo") ||
      col.includes("ocupacao")
    ) {
      if (mapa.funcao === undefined) mapa.funcao = idx
    } else if (col === "cpf" || col.includes("documento")) {
      if (mapa.cpf === undefined) mapa.cpf = idx
    } else if (col.includes("admiss") && !col.includes("exame")) {
      if (mapa.admissao === undefined) mapa.admissao = idx
    } else if (
      col.includes("admissional") ||
      (col.includes("exame") && col.includes("admiss"))
    ) {
      if (mapa.admissional === undefined) mapa.admissional = idx
    } else if (
      col === "aso" ||
      col.includes("aso") ||
      col.includes("periodico")
    ) {
      if (mapa.aso === undefined) mapa.aso = idx
    } else if (
      col.includes("acuidade") ||
      col.includes("visual") ||
      col.includes("visao")
    ) {
      if (mapa.acuidade_visual === undefined) mapa.acuidade_visual = idx
    } else if (col.includes("audio") || col.includes("audiometria")) {
      if (mapa.audiometria === undefined) mapa.audiometria = idx
    } else if (col.includes("clinica") || col.includes("avaliacao")) {
      if (mapa.avaliacao_clinica === undefined) mapa.avaliacao_clinica = idx
    } else if (col.includes("toxico") || col.includes("tox")) {
      if (mapa.toxicologico === undefined) mapa.toxicologico = idx
    } else if (
      col.includes("rx") ||
      col.includes("raio") ||
      col.includes("torax")
    ) {
      if (mapa.rx === undefined) mapa.rx = idx
    } else if (
      col.includes("ecg") ||
      col.includes("eletro") ||
      col.includes("cardio")
    ) {
      if (mapa.ecg === undefined) mapa.ecg = idx
    } else if (
      col.includes("demiss") ||
      col.includes("rescis") ||
      col.includes("demissional")
    ) {
      if (mapa.demissional === undefined) mapa.demissional = idx
    }
  })

  return mapa
}

/**
 * Parser de CSV de Controle de Exames ASO
 * - Aceita delimitadores vírgula (,) ou ponto-e-vírgula (;) ou tab
 * - Campos vazios em datas são interpretados como exame PENDENTE
 * - Deduplica linhas por CPF
 * - Formata datas dd/mm/aaaa
 */
export function parseControleExamesCSV(
  conteudoCsv: string,
  cpfsJaCadastradosNoBanco: Set<string> = new Set(),
  prazosConfigurados?: Record<TipoExame, number>,
): PreviewImportacaoExamesCSV {
  const avisos: string[] = []
  const erros: string[] = []

  if (!conteudoCsv || !conteudoCsv.trim()) {
    return {
      totalLinhasLidas: 0,
      totalFuncionariosValidos: 0,
      totalDuplicadosCpfPlanilha: 0,
      totalExistentesAtualizados: 0,
      totalNovos: 0,
      linhas: [],
      avisos: [],
      erros: ["Arquivo CSV vazio ou sem conteúdo legível."],
      funcoesDetectadas: [],
    }
  }

  // Normaliza quebras de linha e separadores (se vier separado por ;)
  let textoTratado = conteudoCsv.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhasCruas = textoTratado.split("\n")

  let indiceLinhaCabecalho = -1
  let delimitador = ","

  // Procura a linha de cabeçalho
  for (let i = 0; i < Math.min(linhasCruas.length, 10); i++) {
    const l = linhasCruas[i]
    if (!l.trim()) continue

    // Detecta se usa vírgula ou ponto e vírgula
    const virgulas = (l.match(/,/g) || []).length
    const pontoVirgulas = (l.match(/;/g) || []).length
    const tabs = (l.match(/\t/g) || []).length

    let delimTeste = ","
    if (pontoVirgulas > virgulas && pontoVirgulas > tabs) delimTeste = ";"
    else if (tabs > virgulas && tabs > pontoVirgulas) delimTeste = "\t"

    const colunas = (
      delimTeste === ";"
        ? l.split(";")
        : delimTeste === "\t"
          ? l.split("\t")
          : splitCsvLine(l)
    ).map(normalizarTexto)

    const temNome = colunas.some(
      (c) => c === "nome" || c.startsWith("func") || c.includes("nome"),
    )
    const temFuncao = colunas.some((c) => c === "funcao" || c.includes("cargo"))
    const temAsoOuExame = colunas.some(
      (c) => c.includes("aso") || c.includes("exame") || c.includes("admiss"),
    )

    if (temNome || (temFuncao && temAsoOuExame)) {
      indiceLinhaCabecalho = i
      delimitador = delimTeste
      break
    }
  }

  // Se não identificou cabeçalho padrão, assume primeira linha não vazia
  if (indiceLinhaCabecalho === -1) {
    indiceLinhaCabecalho = 0
  }

  const cabecalhoBruto = (
    delimitador === ";"
      ? linhasCruas[indiceLinhaCabecalho].split(";")
      : delimitador === "\t"
        ? linhasCruas[indiceLinhaCabecalho].split("\t")
        : splitCsvLine(linhasCruas[indiceLinhaCabecalho])
  ).map((c) => c.trim())

  const mapaColunas = identificarColunas(cabecalhoBruto)

  // Fallbacks posicionais caso alguma coluna comum não tenha sido encontrada
  // [Nome(0), Função(1), CPF(2), Admissão(3), Admissional(4), ASO(5), Acuidade(6), Audiometria(7), Clínica(8), Toxicológico(9), RX(10), ECG(11)]
  if (mapaColunas.nome === undefined) mapaColunas.nome = 0
  if (mapaColunas.funcao === undefined && cabecalhoBruto.length > 1)
    mapaColunas.funcao = 1
  if (mapaColunas.cpf === undefined && cabecalhoBruto.length > 2)
    mapaColunas.cpf = 2
  if (mapaColunas.admissao === undefined && cabecalhoBruto.length > 3)
    mapaColunas.admissao = 3

  const getCol = (cols: string[], idx?: number): string => {
    if (idx === undefined || idx < 0 || idx >= cols.length) return ""
    return cols[idx]?.trim() || ""
  }

  const parseDataExame = (cols: string[], idx?: number): {
    dataIso: string | null
    dataBr: string | null
  } => {
    const raw = getCol(cols, idx)
    if (!raw) return { dataIso: null, dataBr: null }
    const iso = parseDataBrParaIso(raw)
    return { dataIso: iso, dataBr: iso ? raw : null }
  }

  const linhasParseadas: LinhaExameImportada[] = []
  const cpfsVistosNaPlanilha = new Set<string>()
  const nomesVistosNaPlanilha = new Set<string>()
  const funcoesSet = new Set<string>()

  let totalDuplicadosCpfPlanilha = 0
  let totalExistentesAtualizados = 0
  let totalNovos = 0

  for (let i = indiceLinhaCabecalho + 1; i < linhasCruas.length; i++) {
    const linhaTexto = linhasCruas[i].trim()
    if (!linhaTexto) continue

    const colunas = (
      delimitador === ";"
        ? linhaTexto.split(";")
        : delimitador === "\t"
          ? linhaTexto.split("\t")
          : splitCsvLine(linhaTexto)
    ).map((c) => c.trim())

    if (colunas.every((c) => !c)) continue

    const nomeCru = getCol(colunas, mapaColunas.nome)
    if (!nomeCru) {
      // Ignora linhas sem nome
      continue
    }

    const funcaoCru = getCol(colunas, mapaColunas.funcao) || "Geral"
    const cpfCru = getCol(colunas, mapaColunas.cpf)
    const admissaoCru = getCol(colunas, mapaColunas.admissao)

    const cpfLimpo = cpfCru ? limparMascara(cpfCru) : null
    const cpfFormatado = cpfLimpo ? formatarCpfCnpj(cpfLimpo) : null
    const admissaoIso = admissaoCru ? parseDataBrParaIso(admissaoCru) : null

    // Deduplicação na própria planilha (por CPF se existir; senão por Nome)
    const chaveDeduplicacao = cpfLimpo
      ? `cpf_${cpfLimpo}`
      : `nome_${normalizarTexto(nomeCru)}`

    if (cpfLimpo && cpfsVistosNaPlanilha.has(cpfLimpo)) {
      totalDuplicadosCpfPlanilha++
      avisos.push(
        `Linha ${i + 1}: CPF ${cpfFormatado} duplicado na planilha (${nomeCru}). Última ocorrência mantida.`,
      )
    } else if (
      !cpfLimpo &&
      nomesVistosNaPlanilha.has(normalizarTexto(nomeCru))
    ) {
      totalDuplicadosCpfPlanilha++
      avisos.push(
        `Linha ${i + 1}: Funcionário "${nomeCru}" sem CPF duplicado na planilha.`,
      )
    }

    if (cpfLimpo) cpfsVistosNaPlanilha.add(cpfLimpo)
    nomesVistosNaPlanilha.add(normalizarTexto(nomeCru))

    // Verifica se já existe cadastrado no banco da empresa
    if (cpfLimpo && cpfsJaCadastradosNoBanco.has(cpfLimpo)) {
      totalExistentesAtualizados++
    } else {
      totalNovos++
    }

    funcoesSet.add(funcaoCru)

    // Parse dos exames
    const adm = parseDataExame(colunas, mapaColunas.admissional)
    const aso = parseDataExame(colunas, mapaColunas.aso)
    const acuidade = parseDataExame(colunas, mapaColunas.acuidade_visual)
    const audio = parseDataExame(colunas, mapaColunas.audiometria)
    const clinica = parseDataExame(colunas, mapaColunas.avaliacao_clinica)
    const tox = parseDataExame(colunas, mapaColunas.toxicologico)
    const rx = parseDataExame(colunas, mapaColunas.rx)
    const ecg = parseDataExame(colunas, mapaColunas.ecg)
    const demissional = parseDataExame(colunas, mapaColunas.demissional)

    const getValidadeTipo = (tipo: TipoExame, padrao: number): number => {
      const v = prazosConfigurados?.[tipo]
      return v !== undefined && v !== null ? v : padrao
    }

    const valAdm = getValidadeTipo("admissional", 12)
    const valAso = getValidadeTipo("aso", 12)
    const valAcuidade = getValidadeTipo("acuidade_visual", 12)
    const valAudio = getValidadeTipo("audiometria", 12)
    const valClinica = getValidadeTipo("avaliacao_clinica", 12)
    const valTox = getValidadeTipo("toxicologico", 30)
    const valRx = getValidadeTipo("rx", 12)
    const valEcg = getValidadeTipo("ecg", 12)
    const valDemissional = getValidadeTipo("demissional", 0)

    const exames: Record<TipoExame, {
      dataIso: string | null
      dataBr: string | null
      status: StatusExame
      validadeMeses: number
    }> = {
      admissional: {
        dataIso: adm.dataIso,
        dataBr: adm.dataBr,
        status: calcularStatusExame(adm.dataIso, valAdm).status,
        validadeMeses: valAdm,
      },
      aso: {
        dataIso: aso.dataIso,
        dataBr: aso.dataBr,
        status: calcularStatusExame(aso.dataIso, valAso).status,
        validadeMeses: valAso,
      },
      acuidade_visual: {
        dataIso: acuidade.dataIso,
        dataBr: acuidade.dataBr,
        status: calcularStatusExame(acuidade.dataIso, valAcuidade).status,
        validadeMeses: valAcuidade,
      },
      audiometria: {
        dataIso: audio.dataIso,
        dataBr: audio.dataBr,
        status: calcularStatusExame(audio.dataIso, valAudio).status,
        validadeMeses: valAudio,
      },
      avaliacao_clinica: {
        dataIso: clinica.dataIso,
        dataBr: clinica.dataBr,
        status: calcularStatusExame(clinica.dataIso, valClinica).status,
        validadeMeses: valClinica,
      },
      toxicologico: {
        dataIso: tox.dataIso,
        dataBr: tox.dataBr,
        status: calcularStatusExame(tox.dataIso, valTox).status,
        validadeMeses: valTox,
      },
      rx: {
        dataIso: rx.dataIso,
        dataBr: rx.dataBr,
        status: calcularStatusExame(rx.dataIso, valRx).status,
        validadeMeses: valRx,
      },
      ecg: {
        dataIso: ecg.dataIso,
        dataBr: ecg.dataBr,
        status: calcularStatusExame(ecg.dataIso, valEcg).status,
        validadeMeses: valEcg,
      },
      demissional: {
        dataIso: demissional.dataIso,
        dataBr: demissional.dataBr,
        status: calcularStatusExame(
          demissional.dataIso,
          valDemissional,
          "demissional",
        ).status,
        validadeMeses: valDemissional,
      },
    }

    // Calcula status geral
    let statusGeral: StatusExame = "PENDENTE"
    const statusValores = Object.values(exames).map((e) => e.status)
    if (statusValores.includes("VENCIDO")) {
      statusGeral = "VENCIDO"
    } else if (
      exames.aso.status === "NO_PRAZO" ||
      exames.admissional.status === "NO_PRAZO" ||
      statusValores.includes("NO_PRAZO")
    ) {
      statusGeral = "NO_PRAZO"
    }

    linhasParseadas.push({
      linhaIndex: i + 1,
      nome: nomeCru.toUpperCase(),
      funcao: funcaoCru,
      cpf: cpfLimpo,
      cpfFormatado,
      dataAdmissaoIso: admissaoIso,
      dataAdmissaoBr: admissaoIso ? admissaoCru : null,
      exames,
      statusGeralAso: statusGeral,
      erros: [],
      avisos: [],
    })
  }

  // Deduplicação final da lista: mantém a última ocorrência de cada CPF (ou nome)
  const mapaFinal = new Map<string, LinhaExameImportada>()
  linhasParseadas.forEach((l) => {
    const chave = l.cpf ? `cpf_${l.cpf}` : `nome_${normalizarTexto(l.nome)}`
    mapaFinal.set(chave, l)
  })

  const linhasUnicas = Array.from(mapaFinal.values())

  return {
    totalLinhasLidas: linhasParseadas.length,
    totalFuncionariosValidos: linhasUnicas.length,
    totalDuplicadosCpfPlanilha,
    totalExistentesAtualizados,
    totalNovos,
    linhas: linhasUnicas,
    avisos,
    erros,
    funcoesDetectadas: Array.from(funcoesSet).sort(),
  }
}
