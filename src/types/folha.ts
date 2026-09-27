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

export interface FolhaItemDiscriminado {
  tipo: 'PROVENTO' | 'DESCONTO'
  codigo?: string
  descricao: string
  referencia?: string
  valor: number
}

export interface FolhaPagamentoLinha {
  id: string
  empresa_id: string
  competencia_id: string
  competencia: string
  funcionario_id?: string | null
  matricula?: string | null
  cpf?: string | null
  nome: string
  cargo: string
  departamento?: string | null
  data_admissao?: string | null

  // Valores Salariais e Proventos
  salario_base: number
  horas_normais: number
  horas_extras: number
  valor_horas_extras: number
  adicional_periculosidade: number
  adicional_insalubridade: number
  adicional_noturno: number
  gratificacoes: number
  comissoes: number
  dsr: number
  outros_proventos: number
  total_proventos: number

  // Descontos
  inss_retido: number
  irrf_retido: number
  vale_transporte: number
  vale_refeicao: number
  adiantamento: number
  faltas_atrasos: number
  plano_saude: number
  outros_descontos: number
  total_descontos: number

  // Salário Líquido
  salario_liquido: number

  // Encargos e Bases
  base_inss: number
  base_fgts: number
  base_irrf: number
  fgts_mes: number

  // Extras
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  chave_pix?: string | null
  observacoes?: string | null
  itens_discriminados?: FolhaItemDiscriminado[]

  created_at?: string
  updated_at?: string
}

export interface FolhaResumoTotais {
  totalColaboradores: number
  totalSalarioBase: number
  totalProventos: number
  totalDescontos: number
  totalLiquido: number
  totalFgts: number
  totalInssRetido: number
  totalIrrfRetido: number
  totalAdiantamentos: number
  totalHorasExtras: number
}
