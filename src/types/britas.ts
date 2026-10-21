export type TipoBrita = "19" | "12"
export type UnidadeBritaEntrega = "m³" | "t"

export interface ControleBritaCompra {
  id: string
  empresa_id: string
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

export interface ControleBritaCheque {
  id: string
  empresa_id: string
  competencia: string // 'YYYY-MM'
  valor: number
  data_vencimento?: string | null // 'YYYY-MM-DD'
  numero?: string | null
  observacao?: string | null
  pago: boolean
  created_at?: string
}

export interface SaldoCompetenciaAnterior {
  compraMesAnteriorM3: number
  entregueGeralMesAnteriorM3: number
  saldoRepasseM3: number // compraMesAnteriorM3 - entregueGeralMesAnteriorM3
  temRegistroMesAnterior: boolean
}

export interface ResumoControleBritasMes {
  compraTotalM3: number
  saldoRepasseM3: number // Repasse da competência anterior
  totalDisponivelM3: number // compraTotalM3 + saldoRepasseM3
  totalEntregue19M3: number
  totalEntregue12M3: number
  totalEntregueGeralM3: number
  saldoAReceberM3: number // compraTotalM3 + saldoRepasseM3 - totalEntregueGeralM3
  entregasExcedentes: boolean // totalEntregueGeralM3 > (compraTotalM3 + saldoRepasseM3)
  totalEntregasQtd: number
  totalEntregas19Qtd: number
  totalEntregas12Qtd: number
}
