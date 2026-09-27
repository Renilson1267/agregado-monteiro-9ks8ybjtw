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
  normaReferencia?: string
  descricaoNorma?: string
  obrigatorioParaFuncoes?: string[]
}

export const TIPOS_EXAME_CATALOGO: DefinicaoTipoExame[] = [
  {
    tipo: 'admissional',
    nome: 'Exame Admissional',
    validadePadraoMeses: 12,
    normaReferencia: 'NR-7 item 7.5.8 I',
    descricaoNorma:
      'Realizado antes do início das atividades; validade periódica típica de 1 ano até o próximo periódico.',
  },
  {
    tipo: 'aso',
    nome: 'ASO Periódico',
    validadePadraoMeses: 12,
    normaReferencia: 'NR-7 item 7.5.8 II',
    descricaoNorma:
      'Anual para expostos a riscos ocupacionais (concreto/ruído/poeiras) ou bienal para não expostos.',
  },
  {
    tipo: 'acuidade_visual',
    nome: 'Acuidade Visual',
    validadePadraoMeses: 12,
    normaReferencia: 'PCMSO / NR-7 Anexo IV',
    descricaoNorma:
      'Exame complementar anual para operadores de máquinas, motoristas e postos com atenção visual contínua.',
  },
  {
    tipo: 'audiometria',
    nome: 'Audiometria',
    validadePadraoMeses: 12,
    normaReferencia: 'NR-7 Anexo II item 4.1 b',
    descricaoNorma:
      'Anual sequencial para trabalhadores expostos a níveis de pressão sonora elevados (ruído ocupacional).',
  },
  {
    tipo: 'avaliacao_clinica',
    nome: 'Avaliação Clínica',
    validadePadraoMeses: 12,
    normaReferencia: 'NR-7 item 7.5.8',
    descricaoNorma:
      'Avaliação médica clínica anual em funções operacionais e com riscos identificados no PGR.',
  },
  {
    tipo: 'toxicologico',
    nome: 'Toxicológico',
    validadePadraoMeses: 30,
    normaReferencia: 'Art. 168 §6º CLT e Art. 148-A CTB / CONTRAN',
    descricaoNorma:
      'Periodicidade obrigatória a cada 30 meses (2 anos e meio) para motoristas profissionais CNH C, D e E.',
  },
  {
    tipo: 'rx',
    nome: 'Raio-X (RX)',
    validadePadraoMeses: 12,
    normaReferencia: 'NR-7 Anexo I e Anexo IV (Poeiras Minerais / Sílica)',
    descricaoNorma:
      'Acompanhamento radiológico de tórax OIT (geralmente anual ou bienal conforme o PCMSO da unidade).',
  },
  {
    tipo: 'ecg',
    nome: 'Eletrocardiograma (ECG)',
    validadePadraoMeses: 12,
    normaReferencia: 'NR-7 / NR-35 / NR-12',
    descricaoNorma:
      'Avaliação cardiovascular anual para motoristas de veículos pesados, operadores e atividades críticas.',
  },
]

export interface PrazoExameEmpresa {
  id?: string
  empresa_id: string
  tipo_exame: TipoExame
  nome_exame: string
  validade_padrao_meses: number
  norma_referencia?: string | null
  descricao_norma?: string | null
  created_at?: string
  updated_at?: string
}

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
