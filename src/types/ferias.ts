export interface ItemControleFerias {
  id: string
  empresa_id: string
  funcionario_id?: string | null
  ordem: number
  nome: string
  funcao: string
  salario_2025: number
  admissao: string | null // YYYY-MM-DD
  cpf: string | null
  agencia: string | null
  conta_corrente: string | null
  ferias: string | null // YYYY-MM-DD
  calca: string | null
  camisa: string | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export type NovoItemFeriasPayload = Omit<ItemControleFerias, "id" | "created_at" | "updated_at">
