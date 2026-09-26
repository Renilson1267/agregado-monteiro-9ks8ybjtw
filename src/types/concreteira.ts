export interface Empresa {
  id: string
  nome: string
  slug: string
  ativo: boolean
  created_at?: string
}

export interface Material {
  id: string
  empresa_id?: string
  codigo: string
  nome: string
  unidade: string
  estoque_minimo: number
  ordem: number
  saldo?: number
  created_at?: string
}

export interface Traco {
  id: string
  empresa_id?: string
  nome: string
  descricao: string | null
  fck_mpa: number | null
  consumo_brita12: number
  consumo_brita19: number
  consumo_areia: number
  consumo_po_pedra: number
  consumo_cimento: number
  consumo_aditivo: number
  ativo: boolean
  created_at?: string
}

export interface Motorista {
  id: string
  empresa_id?: string
  nome: string
  ativo: boolean
  created_at?: string
}

export interface Veiculo {
  id: string
  empresa_id?: string
  placa: string
  modelo: string | null
  ativo: boolean
  created_at?: string
}

export interface Cidade {
  id: string
  empresa_id?: string
  nome: string
  uf: string
  created_at?: string
}

export interface Carga {
  id: string
  empresa_id?: string
  numero_carga: number
  data: string
  volume_m3: number
  traco_id: string | null
  traco_nome: string | null
  motorista_id: string | null
  motorista_nome: string | null
  veiculo_id: string | null
  veiculo_placa: string | null
  cidade_id: string | null
  cidade_nome: string | null
  consumo_brita12: number
  consumo_brita19: number
  consumo_areia: number
  consumo_po_pedra: number
  consumo_cimento: number
  consumo_aditivo: number
  observacao: string | null
  carga_zerada: boolean
  created_at?: string
}

export interface MovimentacaoEstoque {
  id: string
  empresa_id?: string
  material_id: string
  tipo: 'ENTRADA' | 'SAIDA' | 'ABERTURA' | 'AJUSTE'
  quantidade: number
  data: string
  carga_id: string | null
  documento: string | null
  observacao: string | null
  created_at?: string
  material?: Material
}

export interface PrecoMaterial {
  id: string
  empresa_id: string
  material_codigo: string
  mes_ano: string
  preco_unitario: number
  unidade: string
  created_at?: string
}

export interface DashboardKPIs {
  volumeHoje: number
  cargasHoje: number
  volumeMes: number
  cargasMes: number
  consumoMes: {
    cimento: number
    aditivo: number
    areia: number
    brita12: number
    brita19: number
    po_pedra: number
  }
  estoqueAbaixoMinimo: number
}
