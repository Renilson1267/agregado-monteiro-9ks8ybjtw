import { FolhaTabelaOficial } from "@/types/folha"

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
 * Calcula o valor padrão da Quinzena (ex.: 40% do total bruto).
 */
export function calcularQuinzena(
  bruto: number,
  percentual: number = 0.4,
): number {
  const b = Number(bruto || 0)
  if (b <= 0) return 0
  return Math.round(b * percentual * 100) / 100
}

/**
 * Calcula o valor Líquido Mensal da aba GERAL:
 * MENSAL = TOTAL BRUTO − INSS + FAMÍLIA − IRRF − QUINZENA
 */
export function calcularMensalGeral(
  bruto: number,
  inss: number,
  familia: number,
  irrf: number,
  quinzena: number,
): number {
  const b = Number(bruto || 0)
  const i = Number(inss || 0)
  const f = Number(familia || 0)
  const ir = Number(irrf || 0)
  const q = Number(quinzena || 0)
  return Math.round((b - i + f - ir - q) * 100) / 100
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
 * COMISSÃO = 0,5% × VALOR DAS OBRAS
 */
export function calcularComissaoVendas(valorObras: number): number {
  const v = Number(valorObras || 0)
  return Math.round(v * 0.005 * 100) / 100
}
