export interface Empresa {
  id: string
  nome: string
  slug: string
  ativo: boolean
  razao_social?: string
  cnpj?: string
  telefone?: string
  endereco?: string
  cidade?: string
  uf?: string
  created_at?: string
}

export interface Cliente {
  id: string
  empresa_id: string
  tipo: "PF" | "PJ"
  cpf_cnpj: string
  nome: string
  nome_fantasia?: string | null
  telefone?: string | null
  email?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  observacoes?: string | null
  ativo: boolean
  exibir_insumos_os?: boolean
  created_at?: string
}

export interface InsumoDetalhadoOS {
  material: string
  quantidade: number
  unidade: string
}

export interface ItemOrdemServico {
  quantidade: number
  unidade: string
  discriminacao: string
}

export interface OrdemServico {
  id: string
  empresa_id: string
  numero_os: number
  data_emissao: string
  cliente_id?: string | null
  carga_id?: string | null

  // Destinatário
  destinatario_nome: string
  destinatario_cpf_cnpj?: string | null
  destinatario_telefone?: string | null
  destinatario_endereco?: string | null
  destinatario_bairro?: string | null
  destinatario_cidade?: string | null
  destinatario_uf?: string | null
  destinatario_cep?: string | null

  // Obra e Local
  nome_obra?: string | null
  local_descarga?: string | null

  // Itens
  itens: ItemOrdemServico[]

  // Insumos no recibo
  exibir_insumos_os?: boolean
  insumos_detalhados?: InsumoDetalhadoOS[]

  // Verificação Slump
  slump_central_medido?: string | null
  slump_central_saida?: string | null
  slump_tolerancia?: string | null
  agua_adic_central?: number | null
  moldagem_central?: string | null
  visto_motorista_central?: string | null

  slump_peca_medido?: string | null
  slump_peca_saida?: string | null
  agua_adic_peca?: number | null
  peca_concretada?: string | null
  visto_motorista_peca?: string | null

  // Transporte
  veiculo_placa?: string | null
  motorista_nome?: string | null
  lacre?: string | null
  km_inicial?: number | null
  km_final?: number | null
  hora_carga?: string | null

  // Horários
  hora_saida_central?: string | null
  hora_chegada_obra?: string | null
  hora_inicio_descarga?: string | null
  hora_fim_descarga?: string | null
  hora_saida_obra?: string | null
  hora_chegada_central?: string | null

  // Visto Obra & Observações
  visto_obra?: string | null
  vendedor_nome?: string | null
  bomba_estacionaria?: string | null
  observacoes?: string | null

  // Termo
  agua_adicional_termo?: number | null
  nome_responsavel_termo?: string | null

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
  controla_estoque?: boolean
  densidade?: number
  unidade_compra?: string
  preco_compra?: number
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
  consumo_agua?: number
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

export interface CustoBreakdown {
  cimento: number
  aditivo: number
  areia: number
  brita12: number
  brita19: number
  po_pedra: number
  agua: number
  total: number
  custoPorM3: number
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
  consumo_agua?: number
  observacao: string | null
  carga_zerada: boolean
  custo?: CustoBreakdown
  ordem_servico?: OrdemServico | null
  numero_os?: number | null
  ordem_servico_id?: string | null
  created_at?: string
}

export interface MovimentacaoEstoque {
  id: string
  empresa_id?: string
  material_id: string
  tipo: "ENTRADA" | "SAIDA" | "ABERTURA" | "AJUSTE"
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
  custoTotalMes: number
  custoMedioPorM3Mes: number
  consumoMes: {
    cimento: number
    aditivo: number
    areia: number
    brita12: number
    brita19: number
    po_pedra: number
    agua: number
  }
  estoqueAbaixoMinimo: number
}

export interface UsuarioApp {
  id: string
  user_id?: string | null
  nome: string
  email: string
  perfil: "administrador" | "balanceiro"
  empresa_id?: string | null
  empresa_nome?: string | null
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface ComparativoUnidade {
  empresaId: string
  empresaNome: string
  empresaSlug: string
  volumeTotal: number
  cargasTotal: number
  cargasZeradas: number
  custoTotal: number
  custoPorM3: number
  consumos: {
    cimento: number
    aditivo: number
    areia: number
    brita12: number
    brita19: number
    po_pedra: number
    agua: number
  }
  custosPorMaterial: {
    cimento: number
    aditivo: number
    areia: number
    brita12: number
    brita19: number
    po_pedra: number
    agua: number
  }
  densidades?: {
    areia: number
    brita12: number
    brita19: number
  }
  porTraco: Array<{
    tracoNome: string
    volume: number
    cargas: number
    custoTotal: number
    custoPorM3: number
  }>
}

export interface MetaProducao {
  id?: string
  empresa_id: string
  meta_diaria_m3: number
  meta_mensal_m3: number
  observacao?: string | null
  created_at?: string
  updated_at?: string
}
