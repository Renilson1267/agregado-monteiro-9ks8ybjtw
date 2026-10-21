export type TipoBrita = "19" | "12"
export type UnidadeBritaEntrega = "m³" | "t"

export interface ControleBritaCompra {
  id: string
  empresa_id: string
  tipo_brita: TipoBrita
  competencia: string // 'YYYY-MM'
  volume_m3: number
  observacao?: string | null
  created_at?: string
  updated_at?: string
}

export interface ControleBritaEntrega {
  id: string
  empresa_id: string
  tipo_brita: TipoBrita
  competencia: string // 'YYYY-MM'
  data: string // 'YYYY-MM-DD'
  quantidade: number
  unidade: UnidadeBritaEntrega
  densidade: number | null
  quantidade_m3: number
  fornecedor?: string | null
  documento?: string | null
  observacao?: string | null
  created_at?: string
}

export interface ResumoBritaItem {
  tipo: TipoBrita
  nome: string // 'Brita 19' ou 'Brita 12'
  compraM3: number
  totalEntregueM3: number
  saldoAReceberM3: number // compraM3 - totalEntregueM3
  entregasExcedentes: boolean // totalEntregueM3 > compraM3
  totalEntregasQtd: number
}
