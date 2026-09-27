import { limparMascara, formatarCpfCnpj } from '@/lib/documentos'
import { parseDataBrParaIso, splitCsvLine } from '@/lib/csv-cargas-parser'
import { FolhaPagamentoLinha, FolhaItemDiscriminado } from '@/types/folha'

export interface LinhaFolhaParsed extends Omit<FolhaPagamentoLinha, 'id' | 'empresa_id' | 'competencia_id'> {
  linhaIndex: number
  cpfFormatado: string | null
  erros: string[]
  avisos: string[]
}

export interface PreviewImportacaoFolhaCSV {
  competenciaSugerida: string // 'YYYY-MM'
  totalLinhasLidas: number
  totalColaboradoresValidos: number
  totalDuplicadosPlanilha: number
  totalExistentesAtualizados: number
  totalNovos: number
  totais: {
    totalSalarioBase: number
    totalProventos: number
    totalDescontos: number
    totalLiquido: number
    totalFgts: number
    totalInss: number
    totalIrrf: number
  }
  linhas: LinhaFolhaParsed[]
  avisos: string[]
  erros: string[]
  cargosDetectados: string[]
}

function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Converte string monetária flexível brasileira para número (ex: "R$ 2.500,50", "2500.50", "(150,00)")
 */
export function parseMoedaBr(val: any): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val

  let str = String(val).trim()
  if (!str || str === '-' || str === '—' || str === 'null') return 0

  // Trata formato contábil negativo: (120,50) -> -120.50
  let negativo = false
  if (str.startsWith('(') && str.endsWith(')')) {
    negativo = true
    str = str.slice(1, -1).trim()
  } else if (str.startsWith('-')) {
    negativo = true
    str = str.slice(1).trim()
  }

  // Remove R$, espaços e símbolos
  str = str.replace(/[R$\s]/gi, '')

  // Se tiver vírgula e ponto, ex: "1.234,56"
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.')
  } else if (str.includes(',')) {
    // Ex: "1234,56"
    str = str.replace(',', '.')
  }

  const num = parseFloat(str)
  if (isNaN(num)) return 0
  return negativo ? -num : num
}

/**
 * Tenta inferir competência 'YYYY-MM' do nome do arquivo (ex: "folha-2026-09 (2).csv" -> "2026-09")
 * ou da data corrente caso não encontre
 */
export function extrairCompetenciaDoNomeArquivo(nomeArquivo?: string): string {
  if (nomeArquivo) {
    // Procura padrão 202X-XX ou 202X_XX
    const matchIso = nomeArquivo.match(/(202\d)[-_](\d{2})/)
    if (matchIso) {
      return `${matchIso[1]}-${matchIso[2]}`
    }
    // Procura padrão XX-202X ou XX_202X
    const matchBr = nomeArquivo.match(/(\d{2})[-_](202\d)/)
    if (matchBr) {
      return `${matchBr[2]}-${matchBr[1]}`
    }
  }

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

/**
 * Mapeia os índices de colunas de uma planilha de folha de pagamento
 */
interface MapaColunasFolha {
  matricula?: number
  cpf?: number
  nome?: number
  cargo?: number
  departamento?: number
  admissao?: number
  salario_base?: number
  horas_normais?: number
  horas_extras?: number
  valor_horas_extras?: number
  periculosidade?: number
  insalubridade?: number
  adicional_noturno?: number
  gratificacoes?: number
  comissoes?: number
  dsr?: number
  outros_proventos?: number
  total_proventos?: number
  inss?: number
  irrf?: number
  vale_transporte?: number
  vale_refeicao?: number
  adiantamento?: number
  faltas?: number
  plano_saude?: number
  outros_descontos?: number
  total_descontos?: number
  salario_liquido?: number
  base_inss?: number
  base_fgts?: number
  base_irrf?: number
  fgts_mes?: number
  banco?: number
  agencia?: number
  conta?: number
  chave_pix?: number
}

function identificarColunasFolha(cabecalho: string[]): {
  mapa: MapaColunasFolha
  colunasRestantes: { indice: number; rotulo: string }[]
} {
  const mapa: MapaColunasFolha = {}
  const colunasRestantes: { indice: number; rotulo: string }[] = []

  cabecalho.forEach((colCrua, idx) => {
    const col = normalizarTexto(colCrua)
    if (!col) return

    let identificada = true

    if (col === 'matricula' || col === 'matr' || col === 'cod' || col === 'codigo') {
      if (mapa.matricula === undefined) mapa.matricula = idx
    } else if (col === 'cpf' || col.includes('cpf') || col === 'documento') {
      if (mapa.cpf === undefined) mapa.cpf = idx
    } else if (
      col === 'nome' ||
      col === 'funcionario' ||
      col === 'colaborador' ||
      col === 'empregado' ||
      col.includes('nome do') ||
      col.includes('nome func')
    ) {
      if (mapa.nome === undefined) mapa.nome = idx
    } else if (
      col === 'funcao' ||
      col === 'cargo' ||
      col === 'ocupacao' ||
      col.includes('cargo')
    ) {
      if (mapa.cargo === undefined) mapa.cargo = idx
    } else if (
      col === 'departamento' ||
      col === 'depto' ||
      col === 'setor' ||
      col === 'lotacao' ||
      col.includes('setor')
    ) {
      if (mapa.departamento === undefined) mapa.departamento = idx
    } else if (
      col === 'admissao' ||
      col.includes('data adm') ||
      col.includes('dt adm') ||
      col.includes('admiss')
    ) {
      if (mapa.admissao === undefined) mapa.admissao = idx
    } else if (
      col === 'salario base' ||
      col === 'salario' ||
      col === 'sal base' ||
      col === 'vencimento' ||
      col === 'remuneracao' ||
      col.includes('salario contratual') ||
      col.includes('salario base')
    ) {
      if (mapa.salario_base === undefined) mapa.salario_base = idx
    } else if (
      col.includes('hora extra') && (col.includes('qtd') || col.includes('horas') || col.includes('hr'))
    ) {
      if (mapa.horas_extras === undefined) mapa.horas_extras = idx
    } else if (
      col.includes('hora extra') || col.includes('he 50') || col.includes('he 100') || col.includes('valor he')
    ) {
      if (mapa.valor_horas_extras === undefined) mapa.valor_horas_extras = idx
    } else if (col.includes('periculosidade') || col === 'peric') {
      if (mapa.periculosidade === undefined) mapa.periculosidade = idx
    } else if (col.includes('insalubridade') || col === 'insalub') {
      if (mapa.insalubridade === undefined) mapa.insalubridade = idx
    } else if (col.includes('noturno') || col === 'adic noturno') {
      if (mapa.adicional_noturno === undefined) mapa.adicional_noturno = idx
    } else if (col.includes('gratific') || col.includes('premio')) {
      if (mapa.gratificacoes === undefined) mapa.gratificacoes = idx
    } else if (col.includes('comissao') || col.includes('comissoes')) {
      if (mapa.comissoes === undefined) mapa.comissoes = idx
    } else if (col === 'dsr' || col.includes('dsr')) {
      if (mapa.dsr === undefined) mapa.dsr = idx
    } else if (
      col === 'total proventos' ||
      col === 'proventos' ||
      col === 'vencimentos' ||
      col === 'total vencimentos' ||
      col.includes('tot prov') ||
      col.includes('total de prov')
    ) {
      if (mapa.total_proventos === undefined) mapa.total_proventos = idx
    } else if (col === 'inss' || col.includes('inss desc') || col.includes('desc inss')) {
      if (mapa.inss === undefined) mapa.inss = idx
    } else if (col === 'irrf' || col === 'ir' || col.includes('imposto de renda') || col.includes('desc irrf')) {
      if (mapa.irrf === undefined) mapa.irrf = idx
    } else if (col.includes('transporte') || col === 'vt' || col.includes('vale transp')) {
      if (mapa.vale_transporte === undefined) mapa.vale_transporte = idx
    } else if (col.includes('refeicao') || col === 'vr' || col === 'va' || col.includes('alimentacao')) {
      if (mapa.vale_refeicao === undefined) mapa.vale_refeicao = idx
    } else if (col.includes('adiantamento') || col === 'vale' || col.includes('adiant')) {
      if (mapa.adiantamento === undefined) mapa.adiantamento = idx
    } else if (col.includes('falta') || col.includes('atraso')) {
      if (mapa.faltas === undefined) mapa.faltas = idx
    } else if (col.includes('saude') || col.includes('medico') || col.includes('unimed')) {
      if (mapa.plano_saude === undefined) mapa.plano_saude = idx
    } else if (
      col === 'total descontos' ||
      col === 'descontos' ||
      col.includes('tot desc') ||
      col.includes('total de desc')
    ) {
      if (mapa.total_descontos === undefined) mapa.total_descontos = idx
    } else if (
      col === 'liquido' ||
      col === 'salario liquido' ||
      col === 'total liquido' ||
      col === 'valor liquido' ||
      col.includes('liq a receber') ||
      col.includes('liquido a pagar')
    ) {
      if (mapa.salario_liquido === undefined) mapa.salario_liquido = idx
    } else if (col.includes('base inss')) {
      if (mapa.base_inss === undefined) mapa.base_inss = idx
    } else if (col.includes('base fgts')) {
      if (mapa.base_fgts === undefined) mapa.base_fgts = idx
    } else if (col.includes('base irrf') || col.includes('base ir')) {
      if (mapa.base_irrf === undefined) mapa.base_irrf = idx
    } else if (col === 'fgts' || col.includes('fgts mes') || col.includes('valor fgts') || col.includes('fgts do mes')) {
      if (mapa.fgts_mes === undefined) mapa.fgts_mes = idx
    } else if (col === 'banco' || col.includes('nome banco')) {
      if (mapa.banco === undefined) mapa.banco = idx
    } else if (col === 'agencia' || col === 'ag') {
      if (mapa.agencia === undefined) mapa.agencia = idx
    } else if (col === 'conta' || col === 'cc' || col.includes('conta corrente')) {
      if (mapa.conta === undefined) mapa.conta = idx
    } else if (col.includes('pix') || col === 'chave pix') {
      if (mapa.chave_pix === undefined) mapa.chave_pix = idx
    } else {
      identificada = false
    }

    if (!identificada) {
      colunasRestantes.push({ indice: idx, rotulo: colCrua.trim() })
    }
  })

  return { mapa, colunasRestantes }
}

/**
 * Parser de CSV de Folha de Pagamento
 */
export function parseFolhaPagamentoCSV(
  conteudoCsv: string,
  nomeArquivo?: string,
  competenciaForcada?: string,
  cpfsCadastradosBanco: Set<string> = new Set(),
): PreviewImportacaoFolhaCSV {
  const avisos: string[] = []
  const erros: string[] = []

  const competencia =
    competenciaForcada || extrairCompetenciaDoNomeArquivo(nomeArquivo)

  if (!conteudoCsv || !conteudoCsv.trim()) {
    return {
      competenciaSugerida: competencia,
      totalLinhasLidas: 0,
      totalColaboradoresValidos: 0,
      totalDuplicadosPlanilha: 0,
      totalExistentesAtualizados: 0,
      totalNovos: 0,
      totais: {
        totalSalarioBase: 0,
        totalProventos: 0,
        totalDescontos: 0,
        totalLiquido: 0,
        totalFgts: 0,
        totalInss: 0,
        totalIrrf: 0,
      },
      linhas: [],
      avisos: [],
      erros: ['Arquivo CSV vazio ou sem conteúdo legível.'],
      cargosDetectados: [],
    }
  }

  const textoTratado = conteudoCsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const linhasCruas = textoTratado.split('\n')

  let indiceLinhaCabecalho = -1
  let delimitador = ','

  // Procura linha de cabeçalho
  for (let i = 0; i < Math.min(linhasCruas.length, 15); i++) {
    const l = linhasCruas[i]
    if (!l.trim()) continue

    const virgulas = (l.match(/,/g) || []).length
    const pontoVirgulas = (l.match(/;/g) || []).length
    const tabs = (l.match(/\t/g) || []).length

    let delimTeste = ','
    if (pontoVirgulas > virgulas && pontoVirgulas > tabs) delimTeste = ';'
    else if (tabs > virgulas && tabs > pontoVirgulas) delimTeste = '\t'

    const colunas = (
      delimTeste === ';'
        ? l.split(';')
        : delimTeste === '\t'
          ? l.split('\t')
          : splitCsvLine(l)
    ).map(normalizarTexto)

    const temNome = colunas.some(
      (c) =>
        c === 'nome' ||
        c === 'funcionario' ||
        c === 'colaborador' ||
        c.includes('nome'),
    )
    const temSalarial = colunas.some(
      (c) =>
        c.includes('salario') ||
        c.includes('provento') ||
        c.includes('desconto') ||
        c.includes('liquido') ||
        c.includes('inss') ||
        c.includes('cargo') ||
        c.includes('cpf'),
    )

    if (temNome && temSalarial) {
      indiceLinhaCabecalho = i
      delimitador = delimTeste
      break
    }
  }

  if (indiceLinhaCabecalho === -1) {
    indiceLinhaCabecalho = 0
  }

  const cabecalhoBruto = (
    delimitador === ';'
      ? linhasCruas[indiceLinhaCabecalho].split(';')
      : delimitador === '\t'
        ? linhasCruas[indiceLinhaCabecalho].split('\t')
        : splitCsvLine(linhasCruas[indiceLinhaCabecalho])
  ).map((c) => c.trim())

  const { mapa, colunasRestantes } = identificarColunasFolha(cabecalhoBruto)

  // Fallbacks de posição se não identificado por nome
  if (mapa.nome === undefined) {
    // Procura a primeira coluna que contenha string não puramente numérica
    mapa.nome = cabecalhoBruto.length > 1 ? 1 : 0
  }
  if (mapa.cargo === undefined && cabecalhoBruto.length > 2) {
    mapa.cargo = 2
  }

  const getCol = (cols: string[], idx?: number): string => {
    if (idx === undefined || idx < 0 || idx >= cols.length) return ''
    return cols[idx]?.trim() || ''
  }

  const getNumCol = (cols: string[], idx?: number): number => {
    const raw = getCol(cols, idx)
    return parseMoedaBr(raw)
  }

  const linhasParseadas: LinhaFolhaParsed[] = []
  const cpfsVistos = new Set<string>()
  const nomesVistos = new Set<string>()
  const cargosSet = new Set<string>()

  let totalDuplicadosPlanilha = 0
  let totalExistentesAtualizados = 0
  let totalNovos = 0

  for (let i = indiceLinhaCabecalho + 1; i < linhasCruas.length; i++) {
    const linhaTexto = linhasCruas[i].trim()
    if (!linhaTexto) continue

    const colunas = (
      delimitador === ';'
        ? linhaTexto.split(';')
        : delimitador === '\t'
          ? linhaTexto.split('\t')
          : splitCsvLine(linhaTexto)
    ).map((c) => c.trim())

    // Ignora linhas de totalizadores no final da planilha (ex: "TOTAL GERAL", "Subtotal")
    const primeiraColNorm = normalizarTexto(colunas[0] || '')
    const segundaColNorm = normalizarTexto(colunas[1] || '')
    if (
      primeiraColNorm.startsWith('total') ||
      primeiraColNorm.startsWith('subtotal') ||
      segundaColNorm.startsWith('total')
    ) {
      continue
    }

    const nomeCru = getCol(colunas, mapa.nome)
    if (!nomeCru) continue

    const matricula = getCol(colunas, mapa.matricula) || null
    const cpfCru = getCol(colunas, mapa.cpf)
    const cargoCru = getCol(colunas, mapa.cargo) || 'Geral'
    const departamento = getCol(colunas, mapa.departamento) || null
    const admissaoCru = getCol(colunas, mapa.admissao)
    const dataAdmissaoIso = admissaoCru ? parseDataBrParaIso(admissaoCru) : null

    const cpfLimpo = cpfCru ? limparMascara(cpfCru) : null
    const cpfFormatado = cpfLimpo ? formatarCpfCnpj(cpfLimpo) : null

    // Proventos
    const salarioBase = getNumCol(colunas, mapa.salario_base)
    const horasNormais = getNumCol(colunas, mapa.horas_normais)
    const horasExtras = getNumCol(colunas, mapa.horas_extras)
    const valorHorasExtras = getNumCol(colunas, mapa.valor_horas_extras)
    const adicionalPericulosidade = getNumCol(colunas, mapa.periculosidade)
    const adicionalInsalubridade = getNumCol(colunas, mapa.insalubridade)
    const adicionalNoturno = getNumCol(colunas, mapa.adicional_noturno)
    const gratificacoes = getNumCol(colunas, mapa.gratificacoes)
    const comissoes = getNumCol(colunas, mapa.comissoes)
    const dsr = getNumCol(colunas, mapa.dsr)
    let outrosProventos = getNumCol(colunas, mapa.outros_proventos)

    // Descontos
    const inss = getNumCol(colunas, mapa.inss)
    const irrf = getNumCol(colunas, mapa.irrf)
    const vt = getNumCol(colunas, mapa.vale_transporte)
    const vr = getNumCol(colunas, mapa.vale_refeicao)
    const adiantamento = getNumCol(colunas, mapa.adiantamento)
    const faltas = getNumCol(colunas, mapa.faltas)
    const planoSaude = getNumCol(colunas, mapa.plano_saude)
    let outrosDescontos = getNumCol(colunas, mapa.outros_descontos)

    // Colunas extras identificadas nas sobras
    const itensDiscriminados: FolhaItemDiscriminado[] = []
    colunasRestantes.forEach((colRest) => {
      const valStr = getCol(colunas, colRest.indice)
      const valNum = parseMoedaBr(valStr)
      if (valNum !== 0) {
        const nomeNorm = normalizarTexto(colRest.rotulo)
        const ehDesconto =
          nomeNorm.includes('desc') ||
          nomeNorm.includes('contrib') ||
          nomeNorm.includes('sind') ||
          nomeNorm.includes('farm') ||
          nomeNorm.includes('multa') ||
          valNum < 0

        const valorAbs = Math.abs(valNum)
        if (ehDesconto) {
          outrosDescontos += valorAbs
          itensDiscriminados.push({
            tipo: 'DESCONTO',
            descricao: colRest.rotulo,
            valor: valorAbs,
          })
        } else {
          outrosProventos += valorAbs
          itensDiscriminados.push({
            tipo: 'PROVENTO',
            descricao: colRest.rotulo,
            valor: valorAbs,
          })
        }
      }
    })

    // Calcula ou usa totais declarados
    let totalProventosDeclarado = getNumCol(colunas, mapa.total_proventos)
    const totalProventosCalculado =
      salarioBase +
      valorHorasExtras +
      adicionalPericulosidade +
      adicionalInsalubridade +
      adicionalNoturno +
      gratificacoes +
      comissoes +
      dsr +
      outrosProventos

    const totalProventos =
      totalProventosDeclarado > 0
        ? totalProventosDeclarado
        : totalProventosCalculado

    let totalDescontosDeclarado = getNumCol(colunas, mapa.total_descontos)
    const totalDescontosCalculado =
      inss +
      irrf +
      vt +
      vr +
      adiantamento +
      faltas +
      planoSaude +
      outrosDescontos

    const totalDescontos =
      totalDescontosDeclarado > 0
        ? totalDescontosDeclarado
        : totalDescontosCalculado

    let salarioLiquidoDeclarado = getNumCol(colunas, mapa.salario_liquido)
    const salarioLiquido =
      salarioLiquidoDeclarado > 0
        ? salarioLiquidoDeclarado
        : Math.max(0, totalProventos - totalDescontos)

    // Encargos e Bases
    const baseInss = getNumCol(colunas, mapa.base_inss) || totalProventos
    const baseFgts = getNumCol(colunas, mapa.base_fgts) || totalProventos
    const baseIrrf =
      getNumCol(colunas, mapa.base_irrf) ||
      Math.max(0, totalProventos - inss)
    let fgtsMes = getNumCol(colunas, mapa.fgts_mes)
    if (fgtsMes === 0 && baseFgts > 0) {
      fgtsMes = Number((baseFgts * 0.08).toFixed(2)) // 8% do FGTS padrão CLT
    }

    // Dados bancários
    const banco = getCol(colunas, mapa.banco) || null
    const agencia = getCol(colunas, mapa.agencia) || null
    const conta = getCol(colunas, mapa.conta) || null
    const chavePix = getCol(colunas, mapa.chave_pix) || null

    // Deduplicação
    const chaveDedup = cpfLimpo
      ? `cpf_${cpfLimpo}`
      : `nome_${normalizarTexto(nomeCru)}`

    if (cpfLimpo && cpfsVistos.has(cpfLimpo)) {
      totalDuplicadosPlanilha++
      avisos.push(
        `Linha ${i + 1}: CPF ${cpfFormatado} duplicado na planilha (${nomeCru}). Apenas a última ocorrência será mantida.`,
      )
    } else if (!cpfLimpo && nomesVistos.has(normalizarTexto(nomeCru))) {
      totalDuplicadosPlanilha++
      avisos.push(
        `Linha ${i + 1}: Funcionário "${nomeCru}" sem CPF duplicado na planilha.`,
      )
    }

    if (cpfLimpo) cpfsVistos.add(cpfLimpo)
    nomesVistos.add(normalizarTexto(nomeCru))

    if (cpfLimpo && cpfsCadastradosBanco.has(cpfLimpo)) {
      totalExistentesAtualizados++
    } else {
      totalNovos++
    }

    cargosSet.add(cargoCru)

    linhasParseadas.push({
      linhaIndex: i + 1,
      competencia,
      matricula,
      cpf: cpfLimpo,
      cpfFormatado,
      nome: nomeCru.toUpperCase(),
      cargo: cargoCru.toUpperCase(),
      departamento: departamento ? departamento.toUpperCase() : null,
      data_admissao: dataAdmissaoIso,
      salario_base: salarioBase,
      horas_normais: horasNormais,
      horas_extras: horasExtras,
      valor_horas_extras: valorHorasExtras,
      adicional_periculosidade: adicionalPericulosidade,
      adicional_insalubridade: adicionalInsalubridade,
      adicional_noturno: adicionalNoturno,
      gratificacoes,
      comissoes,
      dsr,
      outros_proventos: outrosProventos,
      total_proventos: totalProventos,
      inss_retido: inss,
      irrf_retido: irrf,
      vale_transporte: vt,
      vale_refeicao: vr,
      adiantamento,
      faltas_atrasos: faltas,
      plano_saude: planoSaude,
      outros_descontos: outrosDescontos,
      total_descontos: totalDescontos,
      salario_liquido: salarioLiquido,
      base_inss: baseInss,
      base_fgts: baseFgts,
      base_irrf: baseIrrf,
      fgts_mes: fgtsMes,
      banco,
      agencia,
      conta,
      chave_pix: chavePix,
      itens_discriminados: itensDiscriminados,
      erros: [],
      avisos: [],
    })
  }

  // Deduplicação final por chave
  const mapaFinal = new Map<string, LinhaFolhaParsed>()
  linhasParseadas.forEach((l) => {
    const k = l.cpf ? `cpf_${l.cpf}` : `nome_${normalizarTexto(l.nome)}`
    mapaFinal.set(k, l)
  })

  const linhasUnicas = Array.from(mapaFinal.values())

  // Calcula somatórios gerais
  const totais = linhasUnicas.reduce(
    (acc, l) => {
      acc.totalSalarioBase += l.salario_base
      acc.totalProventos += l.total_proventos
      acc.totalDescontos += l.total_descontos
      acc.totalLiquido += l.salario_liquido
      acc.totalFgts += l.fgts_mes
      acc.totalInss += l.inss_retido
      acc.totalIrrf += l.irrf_retido
      return acc
    },
    {
      totalSalarioBase: 0,
      totalProventos: 0,
      totalDescontos: 0,
      totalLiquido: 0,
      totalFgts: 0,
      totalInss: 0,
      totalIrrf: 0,
    },
  )

  return {
    competenciaSugerida: competencia,
    totalLinhasLidas: linhasParseadas.length,
    totalColaboradoresValidos: linhasUnicas.length,
    totalDuplicadosPlanilha,
    totalExistentesAtualizados,
    totalNovos,
    totais,
    linhas: linhasUnicas,
    avisos,
    erros,
    cargosDetectados: Array.from(cargosSet).sort(),
  }
}
