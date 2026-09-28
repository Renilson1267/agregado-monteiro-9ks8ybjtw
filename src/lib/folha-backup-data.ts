import backupData from '@/assets/backup-folha-2026-09-28-46d43.json'

export interface BackupFuncionarioCad {
  id: string
  nome: string
  telefone?: string
  doc?: string
  funcao?: string
  email?: string
  admissao?: string
}

export interface BackupFuncionarioFolha {
  bruto?: number
  filhos?: number
  conta?: string
  pix?: string
  obs?: string
  unidade?: string
  inativo?: boolean
  oculto?: boolean
}

export interface BackupTerceiroCad {
  nome: string
  bruto: number
  conta?: string
  pix?: string
  obs?: string
  unidade?: string
}

export interface BackupLancItem {
  obras?: number
  valorObra?: number
  limp?: number
  sab?: number
  fer?: number
  ajuda?: number
  vendObra?: number
  vendCom?: number
  vendAjuda?: number
  adiant?: number
  gratif?: number
}

export const SJE_EMPRESA_ID = '22222222-2222-2222-2222-222222222222'
export const MONTEIRO_EMPRESA_ID = '11111111-1111-1111-1111-111111111111'

export const FOLHA_BACKUP_DATA = backupData
