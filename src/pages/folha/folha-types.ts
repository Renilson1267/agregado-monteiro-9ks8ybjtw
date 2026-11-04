export interface FuncionarioCadastroResumo {
  id: string
  nome: string
  data_admissao?: string | null
  data_demissao?: string | null
  ativo?: boolean
  inativo?: boolean
}

export interface CamposAtualizacaoVendas {
  vendas_obra?: number
  comissao?: number
  vendas_ajuda?: number
}
