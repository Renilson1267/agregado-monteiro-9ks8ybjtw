export type TipoExame =
  | 'admissional'
  | 'aso'
  | 'acuidade_visual'
  | 'audiometria'
  | 'avaliacao_clinica'
  | 'toxicologico'
  | 'rx'
  | 'ecg'

export type StatusExame = 'VENCIDO' | 'NO_PRAZO' | 'PENDENTE'

export interface DefinicaoTipoExame {
  tipo: TipoExame
  nome: string
  validadePadraoMeses: number
  obrigatorioParaFuncoes?: string[]
}

export const TIPOS_EXAME_CATALOGO: DefinicaoTipoExame[] = [
  { tipo: 'admissional', nome: 'Exame Admissional', validadePadraoMeses: 12 },
  { tipo: 'aso', nome: 'ASO Periódico', validadePadraoMeses: 12 },
  { tipo: 'acuidade_visual', nome: 'Acuidade Visual', validadePadraoMeses: 12 },
  { tipo: 'audiometria', nome: 'Audiometria', validadePadraoMeses: 12 },
  {
    tipo: 'avaliacao_clinica',
    nome: 'Avaliação Clínica',
    validadePadraoMeses: 12,
  },
  { tipo: 'toxicologico', nome: 'Toxicológico', validadePadraoMeses: 30 }, // Geralmente 2 anos e meio para CNH C/D/E
  { tipo: 'rx', nome: 'Raio-X (RX)', validadePadraoMeses: 12 },
  { tipo: 'ecg', nome: 'Eletrocardiograma (ECG)', validadePadraoMeses: 12 },
]

export interface Funcionario {
  id: string
  empresa_id: string | null
  nome: string
  funcao: string
  cpf: string | null
  data_admissao: string | null // YYYY-MM-DD
  ativo: boolean
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export interface ExameFuncionario {
  id?: string
  empresa_id: string | null
  funcionario_id: string
  tipo_exame: TipoExame
  nome_exame: string
  data_realizacao: string | null // YYYY-MM-DD
  validade_meses: number
  observacao?: string | null
  created_at?: string
  updated_at?: string
}

export interface ExameCalculado {
  tipo: TipoExame
  nome: string
  dataRealizacao: string | null // YYYY-MM-DD
  dataValidade: string | null // YYYY-MM-DD
  validadeMeses: number
  diasParaVencer: number | null
  status: StatusExame
  observacao?: string | null
}

export interface FuncionarioComExames extends Funcionario {
  exames: Record<TipoExame, ExameCalculado>
  statusGeralAso: StatusExame
  totalVencidos: number
  totalNoPrazo: number
  totalPendentes: number
  examesAVencer30Dias: ExameCalculado[]
}

export interface ResumoExamesEmpresa {
  totalFuncionarios: number
  totalFuncionariosAtivos: number
  totalVencidos: number
  totalVencendo30Dias: number
  totalNoPrazo: number
  totalPendentes: number
  funcionariosComVencimento: FuncionarioComExames[]
}
