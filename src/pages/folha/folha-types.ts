export interface FuncionarioCadastroResumo {
  id: string
  nome: string
  data_admissao?: string | null
}

export interface CamposAtualizacaoVendas {
  vendas_obra?: number
  comissao?: number
  vendas_ajuda?: number
}
