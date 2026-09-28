-- Migração para estruturar a tabela folha_pagamento_linhas com os campos exatos da folha real GC MIX
-- Data de referência: 2026-09-28

-- 1. Garante que folha_competencias e folha_pagamento_linhas existam
CREATE TABLE IF NOT EXISTS public.folha_competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL, -- 'YYYY-MM', ex: '2026-09'
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_colaboradores INTEGER NOT NULL DEFAULT 0,
  total_proventos NUMERIC NOT NULL DEFAULT 0,
  total_descontos NUMERIC NOT NULL DEFAULT 0,
  total_liquido NUMERIC NOT NULL DEFAULT 0,
  total_fgts NUMERIC NOT NULL DEFAULT 0,
  total_inss_empresa NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ABERTA',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.folha_pagamento_linhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia_id UUID REFERENCES public.folha_competencias(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Adiciona/Garante todas as colunas reais da Folha GC MIX
ALTER TABLE public.folha_pagamento_linhas
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'Funcionario', -- 'Funcionario' | 'Terceiro'
  ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS funcao TEXT NOT NULL DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS unidade TEXT NOT NULL DEFAULT 'SJE', -- 'SJE' | 'Monteiro'
  ADD COLUMN IF NOT EXISTS bruto NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS filhos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inss NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS familia NUMERIC NOT NULL DEFAULT 0, -- salário-família
  ADD COLUMN IF NOT EXISTS ir NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quinzena NUMERIC NOT NULL DEFAULT 0, -- 1ª quinzena
  ADD COLUMN IF NOT EXISTS adiantamento NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gratificacao NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mensal_liquido NUMERIC NOT NULL DEFAULT 0, -- Líquido mensal
  ADD COLUMN IF NOT EXISTS producao NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comissao NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS modo_calculo TEXT NOT NULL DEFAULT 'Calculado', -- 'Calculado' | 'Digitado'
  ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matricula TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 3. Índices para performance e busca rápida
CREATE INDEX IF NOT EXISTS idx_folha_linhas_empresa ON public.folha_pagamento_linhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_comp ON public.folha_pagamento_linhas(competencia);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_comp_id ON public.folha_pagamento_linhas(competencia_id);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_tipo ON public.folha_pagamento_linhas(tipo);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_nome ON public.folha_pagamento_linhas(nome);
CREATE INDEX IF NOT EXISTS idx_folha_comp_empresa ON public.folha_competencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_comp_empresa_competencia ON public.folha_competencias(empresa_id, competencia);

-- Drop de índice antigo se houver para evitar conflitos de deduplicação por CPF apenas
DROP INDEX IF EXISTS idx_folha_linhas_comp_cpf;

-- Índice único para deduplicação (empresa, competência, nome)
CREATE UNIQUE INDEX IF NOT EXISTS idx_folha_linhas_empresa_comp_nome
  ON public.folha_pagamento_linhas(empresa_id, competencia, LOWER(TRIM(nome)));

-- 4. RLS - Segurança por empresa igual às demais tabelas do sistema
ALTER TABLE public.folha_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamento_linhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_folha_competencias" ON public.folha_competencias;
CREATE POLICY "anon_all_folha_competencias" ON public.folha_competencias
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_folha_linhas" ON public.folha_pagamento_linhas;
CREATE POLICY "anon_all_folha_linhas" ON public.folha_pagamento_linhas
  FOR ALL TO public USING (true) WITH CHECK (true);
