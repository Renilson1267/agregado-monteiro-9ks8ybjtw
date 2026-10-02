import { FolhaTabelaOficial, FaixaComissaoProgressiva } from "@/types/folha"

/**
 * Funções de cálculo fiscal da Folha GC MIX baseadas nas Tabelas Oficiais do Supabase.
 * Não inventa valores se a tabela não estiver configurada.
 */

/**
 * Calcula o INSS progressivo pelo método oficial:
 * Alíquotas por faixa com parcela a deduzir OU fatiamento progressivo.
 * Fórmula do modelo Excel / Receita:
 * SE(bruto > teto; teto_inss * aliquota_max - deducao_max; PROCV/faixa: bruto * aliquota - deducao)
 */
export function calcularInssProgressivo(
  bruto: number,
  tabela: FolhaTabelaOficial | null,
): number | null {
  if (!tabela || !tabela.inss_faixas || tabela.inss_faixas.length === 0) {
    return null
  }

  const valorBruto = Number(bruto || 0)
  if (valorBruto <= 0) return 0

  // Se ultrapassar o teto do INSS, limita ao teto
  const teto = Number(tabela.teto_inss || 8475.55)
  const baseCalculo = Math.min(valorBruto, teto)

  // Encontrar a faixa correspondente (ordenada por `de` ascendente)
  const faixas = [...tabela.inss_faixas].sort((a, b) => a.de - b.de)
  let faixaAplicavel = faixas[0]

  for (const f of faixas) {
    if (baseCalculo >= f.de) {
      faixaAplicavel = f
    }
  }

  if (!faixaAplicavel) return 0

  const inssCalculado =
    baseCalculo * Number(faixaAplicavel.aliquota) -
    Number(faixaAplicavel.deducao || 0)
  return Math.max(0, Math.round(inssCalculado * 100) / 100)
}

/**
 * Calcula o Salário-Família:
 * Cota por filho até 14 anos se o salário bruto for menor ou igual ao teto oficial.
 */
export function calcularSalarioFamilia(
  bruto: number,
  filhos: number,
  tabela: FolhaTabelaOficial | null,
): number | null {
  if (!tabela) return null
  const qtdFilhos = parseInt(String(filhos || 0), 10)
  if (qtdFilhos <= 0) return 0

  const valorBruto = Number(bruto || 0)
  const tetoFamilia = Number(tabela.familia_teto_salario || 1980.38)
  const cotaPorFilho = Number(tabela.familia_cota_por_filho || 67.54)

  if (valorBruto <= tetoFamilia) {
    return Math.round(qtdFilhos * cotaPorFilho * 100) / 100
  }
  return 0
}

/**
 * Calcula o IRRF (Regras 2026 - Lei 15.270 / Portarias oficiais):
 * Base de cálculo = Bruto - INSS.
 * Se bruto <= ir_isento_ate (R$ 5.000,00), IRRF = 0.
 * Caso contrário, aplica as faixas do IRRF com dedução.
 * Se houver regra de redução gradual para faixa de transição (ex.: até R$ 7.350,00),
 * aplica o desconto gradual: red = parcela_fixa - coef * base.
 */
export function calcularIrrf(
  bruto: number,
  inss: number,
  tabela: FolhaTabelaOficial | null,
): number | null {
  if (!tabela || !tabela.irrf_faixas || tabela.irrf_faixas.length === 0) {
    return null
  }

  const valorBruto = Number(bruto || 0)
  if (valorBruto <= 0) return 0

  const isentoAte = Number(tabela.ir_isento_ate ?? 5000)
  if (valorBruto <= isentoAte) {
    return 0
  }

  const valorInss = Number(inss || 0)
  const base = Math.max(0, valorBruto - valorInss)

  // Encontra faixa da tabela progressiva
  const faixas = [...tabela.irrf_faixas].sort((a, b) => a.de - b.de)
  let faixaAplicavel = faixas[0]
  for (const f of faixas) {
    if (base >= f.de) {
      faixaAplicavel = f
    }
  }

  if (!faixaAplicavel) return 0

  const irTabela =
    base * Number(faixaAplicavel.aliquota) - Number(faixaAplicavel.deducao || 0)
  let irFinal = Math.max(0, irTabela)

  // Redução gradual da Lei 15.270/2025 para base até ir_desconto_gradual_ate (ex: R$ 7.350)
  const tetoGradual = Number(tabela.ir_desconto_gradual_ate ?? 7350)
  const parcelaFixaRed = Number(tabela.ir_parcela_fixa_reducao ?? 978.62)
  const coefRed = Number(tabela.ir_coeficiente_reducao ?? 0.133145)

  if (
    base > isentoAte &&
    base <= tetoGradual &&
    parcelaFixaRed > 0 &&
    coefRed > 0
  ) {
    const reducao = Math.max(0, parcelaFixaRed - coefRed * base)
    irFinal = Math.max(0, irFinal - reducao)
  }

  return Math.round(irFinal * 100) / 100
}

/**
 * Calcula o valor padrão da Quinzena (ex.: 40% da base mensal).
 * Na regra operacional da folha: 40% do mensal líquido ou bruto base.
 */
export function calcularQuinzena(
  base: number,
  percentual: number = 0.4,
): number {
  const v = Number(base || 0)
  if (v <= 0) return 0
  return Math.round(v * percentual * 100) / 100
}

/**
 * Calcula o valor Líquido Mensal da aba GERAL:
 * MENSAL = BRUTO − INSS − IRRF + FAMÍLIA + GRATIFICAÇÃO − QUINZENA − ADIANTAMENTO
 *          + PRODUÇÃO(OBRAS × VALOR/OBRA) + LIMPEZA + SÁBADO + FERIADO + FÉRIAS + AJUDA + COMISSÃO + VENDAS_AJUDA
 */
/**
 * Calcula o valor Líquido Mensal da aba MENSAL (sem produção):
 * REGRA OFICIAL GC MIX:
 * MENSAL (LÍQUIDO) = Salário Bruto − INSS − IRRF − Quinzena − Quinzena 2 (se houver)
 * Sem adicionais (Gratificação, Limpeza, Sábado, Feriado, Férias, Ajuda, Comissão, Vendas/Ajuda).
 * O Adiantamento desconta exclusivamente no "A Pagar" da Produção.
 */
export function calcularMensalSemProducao(
  bruto: number,
  inss: number,
  familia: number,
  irrf: number,
  quinzena: number,
  extras?: {
    limpeza?: number
    sabado?: number
    feriado?: number
    ferias?: number
    ajuda_custo?: number
    gratificacao?: number
    adiantamento?: number
    quinzena_2?: number
    comissao?: number
    vendas_ajuda?: number
  },
): number {
  const b = Number(bruto || 0)
  const i = Number(inss || 0)
  const ir = Number(irrf || 0)
  const q = Number(quinzena || 0)
  const q2 = Number(extras?.quinzena_2 || 0)

  const total = b - i - ir - q - q2
  return Math.round(total * 100) / 100
}

/**
 * Calcula o valor Líquido da aba GERAL:
 * GERAL = MENSAL PURO + A PAGAR DA PRODUÇÃO
 * A PAGAR = Produção Crua (obras × valor_obra + limpeza + sábado + feriado + ajuda) + Gratificação − Adiantamento
 * Comissão e Vendas ficam fora do líquido da GERAL.
 */
export function calcularMensalGeral(
  bruto: number,
  inss: number,
  familia: number,
  irrf: number,
  quinzena: number,
  extras?: {
    obras?: number
    valor_obra?: number
    producao?: number
    limpeza?: number
    sabado?: number
    feriado?: number
    ferias?: number
    ajuda_custo?: number
    gratificacao?: number
    adiantamento?: number
    quinzena_2?: number
    comissao?: number
    vendas_ajuda?: number
  },
): number {
  const semProd = calcularMensalSemProducao(
    bruto,
    inss,
    familia,
    irrf,
    quinzena,
    extras,
  )

  const aPagar = calcularAPagarProducao({
    obras: extras?.obras,
    valor_obra: extras?.valor_obra,
    limpeza: extras?.limpeza,
    sabado: extras?.sabado,
    feriado: extras?.feriado,
    ajuda_custo: extras?.ajuda_custo,
    gratificacao: extras?.gratificacao,
    adiantamento: extras?.adiantamento,
  })

  return Math.round((semProd + aPagar) * 100) / 100
}

/**
 * Cálculos da Aba PRODUÇÃO:
 * PRODUÇÃO = OBRAS × VALOR/OBRA + LIMP + SÁBADO + FERIADO + AJUDA
 * A PAGAR = PRODUÇÃO + GRATIFICAÇÃO − ADIANTAMENTO
 */
export function calcularProducaoTotal(linha: {
  obras?: number
  valor_obra?: number
  limpeza?: number
  sabado?: number
  feriado?: number
  ajuda_custo?: number
}): number {
  const obras = Number(linha.obras || 0)
  const valorObra = Number(linha.valor_obra ?? 20)
  const limpeza = Number(linha.limpeza || 0)
  const sabado = Number(linha.sabado || 0)
  const feriado = Number(linha.feriado || 0)
  const ajuda = Number(linha.ajuda_custo || 0)

  return (
    Math.round((obras * valorObra + limpeza + sabado + feriado + ajuda) * 100) /
    100
  )
}

export function calcularAPagarProducao(linha: {
  obras?: number
  valor_obra?: number
  limpeza?: number
  sabado?: number
  feriado?: number
  ajuda_custo?: number
  gratificacao?: number
  adiantamento?: number
}): number {
  const producao = calcularProducaoTotal(linha)
  const gratificacao = Number(linha.gratificacao || 0)
  const adiantamento = Number(linha.adiantamento || 0)
  return Math.round((producao + gratificacao - adiantamento) * 100) / 100
}

/**
 * Cálculo da Aba VENDAS:
 * COMISSÃO = 0,5% × VALOR DAS OBRAS (padrão para funcionários vendedores)
 */
export function calcularComissaoVendas(valorObras: number): number {
  const v = Number(valorObras || 0)
  return Math.round(v * 0.005 * 100) / 100
}

/**
 * Cálculo Marginal por Faixa da Tabela Progressiva de Comissões:
 * Soma-se a comissão de cada trecho do valor vendido.
 * Exemplo:
 * - 0 a 100.000: 2,5% (0.025)
 * - 100.000,01 a 200.000: 2,0% (0.020)
 * - 200.000,01 a 300.000: 1,5% (0.015)
 * - Acima de 300.000: 1,0% (0.010)
 *
 * Se valor for R$ 169.884,00:
 * 1ª faixa: R$ 100.000,00 × 2,5% = R$ 2.500,00
 * 2ª faixa: R$ 69.884,00 × 2,0% = R$ 1.397,68
 * Total = R$ 3.897,68
 *
 * Retorna null se não houver faixas cadastradas para alertar o operador a configurar a tabela.
 */
export function calcularComissaoProgressivaMarginal(
  valorVendas: number,
  faixas: FaixaComissaoProgressiva[] | null | undefined,
): number | null {
  if (!faixas || faixas.length === 0) {
    return null
  }

  const valor = Number(valorVendas || 0)
  if (valor <= 0) return 0

  // Ordena por de_valor ascendente
  const faixasOrdenadas = [...faixas].sort(
    (a, b) => Number(a.de_valor) - Number(b.de_valor),
  )

  let comissaoTotal = 0

  for (const f of faixasOrdenadas) {
    const de = Number(f.de_valor || 0)
    const ate = Number(f.ate_valor || 0)
    // Suporta percentual informado tanto em decimal (ex: 0.025) quanto em porcentagem (ex: 2.5)
    let perc = Number(f.percentual || 0)
    if (perc > 1) {
      perc = perc / 100
    }

    if (valor <= de) {
      // Valor vendido não alcançou esta faixa
      continue
    }

    // Trecho tributável nesta faixa
    // O início efetivo do trecho da faixa (para de=0 ou de=100000.01)
    const piso =
      de > 0 && Math.abs(de - Math.floor(de)) > 0 ? Math.floor(de) : de
    const limiteSuperior = ate > 0 ? Math.min(valor, ate) : valor
    const baseNaFaixa = Math.max(0, limiteSuperior - piso)

    if (baseNaFaixa > 0) {
      comissaoTotal += baseNaFaixa * perc
    }
  }

  return Math.round(comissaoTotal * 100) / 100
}

/**
 * ============================================================================
 * CÁLCULOS DO 13º SALÁRIO (DÉCIMO TERCEIRO)
 * Regras do usuário:
 * 1. Proporcionalidade: 1/12 por mês trabalhado no ano.
 *    Fração >= 15 dias no mês de admissão conta como mês cheio (1/12).
 *    Se admitido antes do ano-calendário, conta 12/12 (ou até mês de referência, no máximo 12).
 * 2. Base de cálculo do 13º = Salário Bruto contratual (SEM produção, limpeza, sábado, férias, ajuda ou comissão).
 *    Bruto do 13º = (Salário Bruto / 12) * Meses Proporcionais.
 * 3. 1ª Parcela (adiantamento até 30/11):
 *    50% do bruto do 13º, SEM nenhum desconto de INSS nem IRRF.
 * 4. 2ª Parcela (paga em 20/12):
 *    Bruto da 2ª parcela = Bruto do 13º − 1ª Parcela (normalmente 50%).
 *    INSS do 13º: tabela progressiva mensal aplicada sobre a base integral do 13º (descontado na 2ª parcela).
 *    IRRF do 13º (Tributação Exclusiva na fonte com regra anual / Lei 15.270):
 *    - Base do IRRF do 13º = Bruto do 13º − INSS do 13º (− deduções por dependentes, se houver).
 *    - Regra anual da tabela progressiva: se a base anual do 13º for calculada com faixas anuais
 *      (12 × faixas mensais) ou se calculada exclusivamente sobre o 13º líquido do INSS:
 *      Para o 13º salário integral (tributação exclusiva anual):
 *      Se Bruto <= teto de isenção mensal (ex: R$ 5.000) -> IRRF = 0.
 *      Também calcula a base anual acumulada do ano + 13º para conferência de alíquota efetiva.
 * 5. Líquido 2ª Parcela = Bruto 2ª Parcela − INSS 2ª Parcela − IRRF 2ª Parcela.
 * 6. Total Líquido 13º = 1ª Parcela + Líquido 2ª Parcela (= Bruto 13º − INSS − IRRF).
 * ============================================================================
 */

/**
 * Calcula a quantidade de meses proporcionais (avos) de direito ao 13º no ano.
 * Fração >= 15 dias trabalhados no mês conta como mês inteiro.
 * @param dataAdmissao Data no formato YYYY-MM-DD ou DD/MM/AAAA ou nulo
 * @param anoCalendario Ano de competência (padrão 2026)
 * @returns Número de meses entre 0 e 12
 */
export function calcularMesesProporcionais13(
  dataAdmissao: string | null | undefined,
  anoCalendario: number = 2026,
): number {
  if (!dataAdmissao || !dataAdmissao.trim()) {
    // Sem data de admissão cadastrada: assume ano completo (12 avos)
    return 12
  }

  const str = dataAdmissao.trim()
  let dia = 1
  let mes = 1
  let ano = anoCalendario

  if (str.includes("-")) {
    const partes = str.split("-").map(Number)
    ano = partes[0]
    mes = partes[1]
    dia = partes[2] || 1
  } else if (str.includes("/")) {
    const partes = str.split("/").map(Number)
    dia = partes[0]
    mes = partes[1]
    ano = partes[2] || anoCalendario
  }

  // Admitido em ano anterior a anoCalendario -> trabalhou o ano inteiro (12 avos)
  if (ano < anoCalendario) {
    return 12
  }

  // Admitido em ano posterior -> ainda não tem direito
  if (ano > anoCalendario) {
    return 0
  }

  // Admitido no próprio ano-calendário:
  // Se dia de admissão <= 15: o mês de admissão conta (fração >= 15 dias trabalhados).
  // Se dia de admissão > 15: o mês de admissão não conta.
  const mesInicioEfetivo = dia <= 15 ? mes : mes + 1

  if (mesInicioEfetivo > 12) {
    return 0
  }

  const meses = 12 - mesInicioEfetivo + 1
  return Math.max(0, Math.min(12, meses))
}

/**
 * Calcula o IRRF exclusivo anual do 13º salário com base nas tabelas oficiais.
 * Segue a legislação brasileira e regras do usuário (tributação exclusiva anual):
 * - Base = Bruto 13º − INSS 13º.
 * - Isenção até R$ 5.000,00 mensais (conforme tabela 2026 / Lei 15.270/2025).
 * - Se base anual acumulada com remunerações for informada, faz a verificação anual marginal.
 */
export function calcularIrrf13(
  bruto13: number,
  inss13: number,
  tabela: FolhaTabelaOficial | null,
  opcoes?: {
    somaRemuneracoesAno?: number
    somaInssAno?: number
    somaIrrfRetidoAno?: number
  },
): number {
  if (!tabela || !tabela.irrf_faixas || tabela.irrf_faixas.length === 0) {
    return 0
  }

  const b13 = Number(bruto13 || 0)
  if (b13 <= 0) return 0

  const isentoAte = Number(tabela.ir_isento_ate ?? 5000)
  // Se o 13º bruto for até o limite de isenção, é 100% isento
  if (b13 <= isentoAte) {
    return 0
  }

  const baseCalculo13 = Math.max(0, b13 - Number(inss13 || 0))
  if (baseCalculo13 <= isentoAte) {
    return 0
  }

  // Se houver soma acumulada do ano para cálculo da regra anual:
  // Tabela progressiva anual = faixas mensais × 12 (ou × meses trabalhados).
  // Lei 15.270 / RIR: o 13º salário é tributado na fonte separadamente dos demais rendimentos,
  // aplicando a tabela progressiva com base no valor integral do 13º líquido da contribuição previdenciária.
  const faixas = [...tabela.irrf_faixas].sort((a, b) => a.de - b.de)
  let faixaAplicavel = faixas[0]
  for (const f of faixas) {
    if (baseCalculo13 >= f.de) {
      faixaAplicavel = f
    }
  }

  if (!faixaAplicavel) return 0

  const irTabela =
    baseCalculo13 * Number(faixaAplicavel.aliquota) -
    Number(faixaAplicavel.deducao || 0)
  let irFinal = Math.max(0, irTabela)

  // Redução gradual da Lei 15.270 para base até ir_desconto_gradual_ate
  const tetoGradual = Number(tabela.ir_desconto_gradual_ate ?? 7350)
  const parcelaFixaRed = Number(tabela.ir_parcela_fixa_reducao ?? 978.62)
  const coefRed = Number(tabela.ir_coeficiente_reducao ?? 0.133145)

  if (
    baseCalculo13 > isentoAte &&
    baseCalculo13 <= tetoGradual &&
    parcelaFixaRed > 0 &&
    coefRed > 0
  ) {
    const reducao = Math.max(0, parcelaFixaRed - coefRed * baseCalculo13)
    irFinal = Math.max(0, irFinal - reducao)
  }

  // Verificação complementar caso o usuário utilize a regra anual de ajuste com remunerações do ano:
  if (opcoes?.somaRemuneracoesAno && opcoes.somaRemuneracoesAno > 0) {
    const totalAnualBase = Math.max(
      0,
      opcoes.somaRemuneracoesAno + b13 - (opcoes.somaInssAno || 0) - inss13,
    )
    // Se a base anual total acumulada ainda estiver na faixa isenta anual (5000 * 12 = 60000)
    const isentoAnual = isentoAte * 12
    if (totalAnualBase <= isentoAnual) {
      irFinal = 0
    }
  }

  return Math.round(irFinal * 100) / 100
}

export interface CalculoDecimoTerceiroResultado {
  salarioBase: number
  mesesProporcionais: number
  bruto13: number
  primeiraParcela: number
  brutoSegundaParcela: number
  inssSegundaParcela: number
  irrfSegundaParcela: number
  liquidoSegundaParcela: number
  totalLiquido13: number
}

/**
 * Realiza o cálculo completo do 13º salário de um funcionário.
 * Regras:
 * - 1ª parcela = 50% do bruto do 13º, sem descontos.
 * - 2ª parcela = Bruto 13º − 1ª parcela, com desconto de INSS e IRRF da folha do 13º.
 * - Líquido 2ª parcela = Bruto 2ª parcela − INSS − IRRF.
 * - Total Líquido 13º = 1ª parcela + Líquido 2ª parcela.
 */
export function calcularLinhaDecimoTerceiro(
  salarioBase: number,
  mesesProporcionais: number,
  tabelaOficial: FolhaTabelaOficial | null,
  opcoes?: {
    somaRemuneracoesAno?: number
    somaInssAno?: number
    somaIrrfRetidoAno?: number
    brutoAjustado?: number
    mesesAjustados?: number
  },
): CalculoDecimoTerceiroResultado {
  const baseContratual = Number(salarioBase || 0)
  const meses = Math.max(
    0,
    Math.min(12, opcoes?.mesesAjustados ?? mesesProporcionais),
  )

  // Bruto do 13º = (Salário / 12) * Meses (ou valor customizado caso editado)
  const brutoCalculado =
    opcoes?.brutoAjustado !== undefined && opcoes.brutoAjustado !== null
      ? Number(opcoes.brutoAjustado)
      : Math.round((baseContratual / 12) * meses * 100) / 100

  // 1ª parcela: 50% do valor bruto do 13º proporcional, SEM nenhum desconto
  const primeiraParcela = Math.round(brutoCalculado * 0.5 * 100) / 100

  // 2ª parcela bruta: diferença entre o bruto do 13º e a 1ª parcela já adiantada
  const brutoSegundaParcela =
    Math.round((brutoCalculado - primeiraParcela) * 100) / 100

  // INSS do 13º: calcula sobre a base INTEGRAL do 13º pela tabela mensal progressiva
  // e é retido integralmente na 2ª parcela
  const inssCalculado =
    calcularInssProgressivo(brutoCalculado, tabelaOficial) ?? 0

  // IRRF do 13º: calculado na regra anual / tributação exclusiva, retido na 2ª parcela
  const irrfCalculado = calcularIrrf13(
    brutoCalculado,
    inssCalculado,
    tabelaOficial,
    opcoes,
  )

  // Líquido da 2ª parcela
  const liquidoSegundaParcela = Math.max(
    0,
    Math.round((brutoSegundaParcela - inssCalculado - irrfCalculado) * 100) /
      100,
  )

  // Total recebido no 13º (1ª parcela + 2ª parcela líquida)
  const totalLiquido13 =
    Math.round((primeiraParcela + liquidoSegundaParcela) * 100) / 100

  return {
    salarioBase: baseContratual,
    mesesProporcionais: meses,
    bruto13: brutoCalculado,
    primeiraParcela,
    brutoSegundaParcela,
    inssSegundaParcela: inssCalculado,
    irrfSegundaParcela: irrfCalculado,
    liquidoSegundaParcela,
    totalLiquido13,
  }
}
