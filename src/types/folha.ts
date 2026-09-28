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

  // Colunas Reais da Folha GC MIX (Legado)
  tipo: TipoColaboradorFolha // 'Funcionario' | 'Terceiro'
  nome: string
  cargo?: string
  funcao: string
  unidade: string // 'SJE' | 'MONTEIRO'

  bruto: number
  salario_base?: number
  filhos: number
  inss: number
  familia: number // salário-família
  ir: number // imposto de renda
  quinzena: number // 1ª quinzena
  quinzena_2?: number // 2ª quinzena
  adiantamento: number
  gratificacao: number
  mensal_liquido: number // Líquido mensal
  salario_liquido?: number

  // Produção e Obras
  obras: number
  valor_obra: number
  producao: number // obras * valor_obra

  // Benefícios e adicionais
  limpeza: number
  sabado: number
  ferias: number
  ajuda_custo: number

  // Vendas e Comissão
  vendas_obra: number // volume de vendas faturado
  comissao: number // comissão (calculada padrão 0,5% ou digitada)
  vendas_ajuda: number // ajuda de custo para vendedor

  // Totais estruturados
  total_proventos?: number
  total_descontos?: number

  conta: string // dados bancários (ag/conta)
  pix: string // chave PIX (telefone/email/cpf/aleatória)
  chave_pix?: string

  modo_calculo?: ModoCalculoFolha // 'Calculado' | 'Digitado'
  oculto?: boolean
  inativo?: boolean
  backup_id?: string | null

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
  totalQuinzena2?: number
  totalAdiantamento: number
  totalGratificacao: number
  totalObras?: number
  totalProducao: number
  totalLimpeza?: number
  totalSabado?: number
  totalFerias?: number
  totalAjudaCusto?: number
  totalVendas?: number
  totalComissao: number
  totalVendasAjuda?: number
  totalMensalLiquido: number
  totalGeralLiquidoAReceber: number
}

/**
 * FÓRMULA DO LÍQUIDO DO LEGADO GC MIX:
 * bruto − INSS − IR + família + gratificação + produção + limpeza + sábado + férias + ajuda + vendAjuda + comissão − adiantamento − quinzena
 */
export function calcularMensalLiquido(linha: {
  tipo?: TipoColaboradorFolha | string
  bruto?: number
  inss?: number
  ir?: number
  familia?: number
  gratificacao?: number
  obras?: number
  valor_obra?: number
  producao?: number
  limpeza?: number
  sabado?: number
  ferias?: number
  ajuda_custo?: number
  vendas_ajuda?: number
  vendas_obra?: number
  comissao?: number
  adiantamento?: number
  quinzena?: number
  quinzena_2?: number
}): number {
  const bruto = Number(linha.bruto || 0)
  const inss = Number(linha.inss || 0)
  const ir = Number(linha.ir || 0)
  const familia = Number(linha.familia || 0)
  const gratificacao = Number(linha.gratificacao || 0)
  const obras = Number(linha.obras || 0)
  const valorObra = Number(linha.valor_obra ?? 20)
  const producao = linha.producao !== undefined ? Number(linha.producao) : obras * valorObra
  const limpeza = Number(linha.limpeza || 0)
  const sabado = Number(linha.sabado || 0)
  const ferias = Number(linha.ferias || 0)
  const ajuda = Number(linha.ajuda_custo || 0)
  const vendAjuda = Number(linha.vendas_ajuda || 0)
  const comissao = Number(linha.comissao || 0)
  const adiantamento = Number(linha.adiantamento || 0)
  const quinzena = Number(linha.quinzena || 0)
  const quinzena2 = Number(linha.quinzena_2 || 0)

  const liq =
    bruto -
    inss -
    ir +
    familia +
    gratificacao +
    producao +
    limpeza +
    sabado +
    ferias +
    ajuda +
    vendAjuda +
    comissao -
    adiantamento -
    quinzena -
    quinzena2

  return Math.round(liq * 100) / 100
}
