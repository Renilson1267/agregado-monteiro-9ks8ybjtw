-- Migração: Módulo Controle de Exames (ASO)
-- Criação de tabelas funcionarios e exames_funcionario com isolamento por empresa_id (Monteiro e SJE)

-- 1. Tabela de Funcionários por Empresa
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT 'Geral',
  cpf TEXT,
  data_admissao DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para funcionarios
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa ON public.funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON public.funcionarios(nome);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON public.funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_funcao ON public.funcionarios(funcao);

-- Unique index condicional para CPF por empresa (permitindo nulos caso não cadastrado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionarios_empresa_cpf 
  ON public.funcionarios(empresa_id, cpf) 
  WHERE cpf IS NOT NULL AND cpf <> '';

-- 2. Tabela de Exames por Funcionário
-- Tipos de exames: admissional, aso, acuidade_visual, audiometria, avaliacao_clinica, toxicologico, rx, ecg, outros
CREATE TABLE IF NOT EXISTS public.exames_funcionario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  tipo_exame TEXT NOT NULL, -- 'admissional', 'aso', 'acuidade_visual', 'audiometria', 'avaliacao_clinica', 'toxicologico', 'rx', 'ecg'
  nome_exame TEXT NOT NULL, -- Rótulo legível ex: 'ASO', 'Acuidade Visual', 'Toxicológico'
  data_realizacao DATE,
  validade_meses INTEGER NOT NULL DEFAULT 12,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para exames_funcionario
CREATE INDEX IF NOT EXISTS idx_exames_empresa ON public.exames_funcionario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_exames_funcionario_id ON public.exames_funcionario(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_exames_tipo ON public.exames_funcionario(tipo_exame);
CREATE INDEX IF NOT EXISTS idx_exames_data ON public.exames_funcionario(data_realizacao);

-- Cada funcionário tem no máximo um registro por tipo_exame (para manter o último exame / status atual)
CREATE UNIQUE INDEX IF NOT EXISTS idx_exames_funcionario_tipo 
  ON public.exames_funcionario(funcionario_id, tipo_exame);

-- 3. Habilitar RLS e criar políticas
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames_funcionario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_funcionarios" ON public.funcionarios;
CREATE POLICY "anon_all_funcionarios" ON public.funcionarios FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_exames" ON public.exames_funcionario;
CREATE POLICY "anon_all_exames" ON public.exames_funcionario FOR ALL TO public USING (true) WITH CHECK (true);
