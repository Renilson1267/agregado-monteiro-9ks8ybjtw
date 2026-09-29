export type TipoCaixaLancamento = "entrada" | "saida"

export interface Obra {
  id: string
  empresa_id: string
  nome: string
  cliente_id?: string | null
  responsavel?: string | null
  cidade?: string | null
  ativo: boolean
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export interface CaixaCategoria {
  id: string
  empresa_id: string
  tipo: TipoCaixaLancamento
  nome: string
  cor?: string
  ordem?: number
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface CaixaLancamento {
  id: string
  empresa_id: string
  data: string // YYYY-MM-DD
  competencia: string // YYYY-MM
  tipo: TipoCaixaLancamento
  categoria: string
  categoria_id?: string | null
  descricao: string
  valor: number
  obra_id?: string | null
  obra_nome?: string | null
  forma_pagamento?: string | null
  documento_ref?: string | null
  observacao?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface CaixaFechamentoMensal {
  id?: string
  empresa_id: string
  competencia: string // YYYY-MM
  ano: number
  mes: number
  saldo_anterior: number
  total_entradas: number
  total_saidas: number
  saldo_final: number
  status: "ABERTO" | "CONGELADO"
  fechado_por?: string | null
  fechado_em?: string | null
  observacoes?: string | null
}

export interface CaixaTotaisCompetencia {
  competencia: string
  saldoAnterior: number
  totalEntradas: number
  totalSaidas: number
  resultadoMes: number
  saldoFinal: number
  quantidadeEntradas: number
  quantidadeSaidas: number
}

export interface ResumoCategoriaCaixa {
  categoria: string
  tipo: TipoCaixaLancamento
  total: number
  quantidade: number
  percentual: number
}

export interface ResumoObraCaixa {
  obraId?: string | null
  obraNome: string
  totalRecebimentos: number
  quantidade: number
}

export interface MesAnualCaixa {
  mes: number
  nomeMes: string
  competencia: string
  saldoInicial: number
  entradas: number
  saidas: number
  resultado: number
  saldoFinal: number
}

export interface ResultadoImportacaoCaixa {
  inseridos: number
  substituidos: number
}
