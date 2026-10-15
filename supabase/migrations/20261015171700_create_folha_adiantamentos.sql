-- Migration: criar tabela folha_adiantamentos
-- Tabela para controle de pagamento de adiantamento (quinzena) da folha de pagamento

CREATE TABLE IF NOT EXISTS public.folha_adiantamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  usuario_app_id UUID REFERENCES public.usuarios_app(id) ON DELETE SET NULL,
  colaborador_id TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Funcionario',
  nome TEXT NOT NULL,
  valor_extra NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_folha_adiantamentos_empresa_comp_colab UNIQUE (empresa_id, competencia, colaborador_id)
);

-- Garantir colunas caso tabela já existisse
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS usuario_app_id UUID REFERENCES public.usuarios_app(id) ON DELETE SET NULL;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS colaborador_id TEXT;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'Funcionario';
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS valor_extra NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS data_pagamento DATE;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.folha_adiantamentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índices para buscas rápidas por empresa e competência
CREATE INDEX IF NOT EXISTS idx_folha_adiantamentos_empresa_comp ON public.folha_adiantamentos(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_folha_adiantamentos_colaborador ON public.folha_adiantamentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_folha_adiantamentos_pago ON public.folha_adiantamentos(pago);

-- Habilitar RLS
ALTER TABLE public.folha_adiantamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS compatíveis com o padrão das demais tabelas folha_*
DROP POLICY IF EXISTS "anon_all_folha_adiantamentos" ON public.folha_adiantamentos;
CREATE POLICY "anon_all_folha_adiantamentos" ON public.folha_adiantamentos
  FOR ALL TO public USING (true) WITH CHECK (true);
