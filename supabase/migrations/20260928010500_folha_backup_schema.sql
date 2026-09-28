-- Migração para suporte completo ao modelo de Folha de Pagamento do backup do sistema antigo
-- Data: 2026-09-28

-- 1. Campos adicionais na tabela de funcionários (caso usados no cadastro da folha)
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS bruto NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS filhos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conta TEXT,
  ADD COLUMN IF NOT EXISTS pix TEXT,
  ADD COLUMN IF NOT EXISTS inativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oculto BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unidade TEXT NOT NULL DEFAULT 'SJE';

-- 2. Tabela de Terceiros da folha (caso queira manter cadastros específicos de terceiros com empresa_id)
CREATE TABLE IF NOT EXISTS public.folha_terceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  bruto NUMERIC NOT NULL DEFAULT 0,
  conta TEXT,
  pix TEXT,
  obs TEXT,
  unidade TEXT NOT NULL DEFAULT 'SJE',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folha_terceiros_empresa ON public.folha_terceiros(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_folha_terceiros_empresa_nome ON public.folha_terceiros(empresa_id, LOWER(TRIM(nome)));

ALTER TABLE public.folha_terceiros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_folha_terceiros" ON public.folha_terceiros;
CREATE POLICY "anon_all_folha_terceiros" ON public.folha_terceiros
  FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Campos completos do backup na tabela folha_pagamento_linhas
ALTER TABLE public.folha_pagamento_linhas
  ADD COLUMN IF NOT EXISTS backup_id TEXT, -- ex: 'id1000' ou 'terc_1'
  ADD COLUMN IF NOT EXISTS obras NUMERIC NOT NULL DEFAULT 0, -- quantidade de obras
  ADD COLUMN IF NOT EXISTS valor_obra NUMERIC NOT NULL DEFAULT 20, -- R$ por obra (padrão 20)
  ADD COLUMN IF NOT EXISTS limpeza NUMERIC NOT NULL DEFAULT 0, -- R$ limpeza
  ADD COLUMN IF NOT EXISTS sabado NUMERIC NOT NULL DEFAULT 0, -- R$ sábado
  ADD COLUMN IF NOT EXISTS ferias NUMERIC NOT NULL DEFAULT 0, -- R$ férias
  ADD COLUMN IF NOT EXISTS ajuda_custo NUMERIC NOT NULL DEFAULT 0, -- R$ ajuda de custo
  ADD COLUMN IF NOT EXISTS vendas_obra NUMERIC NOT NULL DEFAULT 0, -- R$ total vendas de obras
  ADD COLUMN IF NOT EXISTS vendas_ajuda NUMERIC NOT NULL DEFAULT 0, -- R$ ajuda de custo vendedor
  ADD COLUMN IF NOT EXISTS oculto BOOLEAN NOT NULL DEFAULT false, -- preservar flag oculto
  ADD COLUMN IF NOT EXISTS inativo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_folha_linhas_oculto ON public.folha_pagamento_linhas(oculto);
