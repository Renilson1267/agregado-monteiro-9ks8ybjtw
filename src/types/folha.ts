export type TipoColaboradorFolha = 'Funcionario' | 'Terceiro'
export type ModoCalculoFolha = 'Calculado' | 'Digitado'

export interface FolhaCompetencia {
  id: string
  empresa_id: string
  competencia: string // 'YYYY-MM', ex: '2026-09'
  ano: number
  mes: number
  total_colaboradores: number
  total_proventos: number
  total_descontos: number
  total_liquido: number
  total_fgts: number
  total_inss_empresa: number
  status: 'ABERTA' | 'FECHADA'
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export interface FolhaPagamentoLinha {
  id: string
  empresa_id: string
  competencia_id?: string | null
  competencia: string // 'YYYY-MM'

  // Colunas Reais da Folha GC MIX
  tipo: TipoColaboradorFolha // 'Funcionario' | 'Terceiro'
  nome: string
  funcao: string
  unidade: string // 'SJE' | 'Monteiro'

  bruto: number
  filhos: number
  inss: number
  familia: number // salário-família
  ir: number // imposto de renda
  quinzena: number // 1ª quinzena
  adiantamento: number
  gratificacao: number
  mensal_liquido: number // Líquido mensal
  producao: number
  comissao: number

  conta: string // dados bancários (ag/conta)
  pix: string // chave PIX (telefone/email/cpf/aleatória)

  modo_calculo?: ModoCalculoFolha // 'Calculado' | 'Digitado'

  // Campos auxiliares opcionais
  funcionario_id?: string | null
  matricula?: string | null
  cpf?: string | null

  created_at?: string
  updated_at?: string
}

export interface FolhaTotaisCalculados {
  totalRegistros: number
  totalFuncionarios: number
  totalTerceiros: number
  totalBruto: number
  totalFilhos: number
  totalInss: number
  totalFamilia: number
  totalIr: number
  totalQuinzena: number
  totalAdiantamento: number
  totalGratificacao: number
  totalMensalLiquido: number
  totalProducao: number
  totalComissao: number
  totalGeralLiquidoAReceber: number // MensalLiquido (já inclui ou é a base)
}

/**
 * Fórmula de cálculo oficial da Folha GC MIX:
 * Líquido Mensal = Bruto − INSS − IR + Família + Gratificação − Quinzena − Adiantamento + Produção + Comissão
 * (Para "Terceiro", se não tiver Bruto/INSS, calcula ou mantém o valor de adiantamentos/produção/comissão)
 */
export function calcularMensalLiquido(linha: {
  tipo?: TipoColaboradorFolha
  bruto?: number
  inss?: number
  ir?: number
  familia?: number
  gratificacao?: number
  quinzena?: number
  adiantamento?: number
  producao?: number
  comissao?: number
}): number {
  const bruto = Number(linha.bruto || 0)
  const inss = Number(linha.inss || 0)
  const ir = Number(linha.ir || 0)
  const familia = Number(linha.familia || 0)
  const gratificacao = Number(linha.gratificacao || 0)
  const quinzena = Number(linha.quinzena || 0)
  const adiantamento = Number(linha.adiantamento || 0)
  const producao = Number(linha.producao || 0)
  const comissao = Number(linha.comissao || 0)

  // Líquido Mensal = Bruto − INSS − IR + Família + Gratificação − Quinzena − Adiantamento + Produção + Comissão
  const liq =
    bruto -
    inss -
    ir +
    familia +
    gratificacao -
    quinzena -
    adiantamento +
    producao +
    comissao

  return Math.round(liq * 100) / 100
}
