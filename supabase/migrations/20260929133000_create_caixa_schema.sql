-- ============================================================================
-- MIGRATION: Módulo CAIXA (Agregado Monteiro e SJE)
-- Tabelas: obras, caixa_categorias, caixa_lancamentos, caixa_fechamentos
-- Isolamento multi-empresa com RLS
-- ============================================================================

-- 1. TABELA OBRAS (Cadastro de obras por empresa para vínculo nos lançamentos de caixa e relatórios)
CREATE TABLE IF NOT EXISTS public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel TEXT,
  cidade TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_obras_empresa_nome UNIQUE (empresa_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_obras_empresa ON public.obras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obras_empresa_nome ON public.obras(empresa_id, nome);

-- 2. TABELA CAIXA_CATEGORIAS (Categorias de Entrada e Saída editáveis por empresa)
CREATE TABLE IF NOT EXISTS public.caixa_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#10b981',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_caixa_categorias_empresa_tipo_nome UNIQUE (empresa_id, tipo, nome)
);

CREATE INDEX IF NOT EXISTS idx_caixa_categorias_empresa ON public.caixa_categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_caixa_categorias_empresa_tipo ON public.caixa_categorias(empresa_id, tipo);

-- 3. TABELA CAIXA_LANCAMENTOS (Lançamentos de movimentação financeira de caixa)
CREATE TABLE IF NOT EXISTS public.caixa_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  competencia TEXT NOT NULL, -- YYYY-MM
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  categoria_id UUID REFERENCES public.caixa_categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL CHECK (valor >= 0),
  obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
  obra_nome TEXT, -- Desnormalizado para agilidade e histórico
  forma_pagamento TEXT DEFAULT 'PIX',
  documento_ref TEXT,
  observacao TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caixa_lanc_empresa ON public.caixa_lancamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_caixa_lanc_empresa_data ON public.caixa_lancamentos(empresa_id, data);
CREATE INDEX IF NOT EXISTS idx_caixa_lanc_empresa_comp ON public.caixa_lancamentos(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_caixa_lanc_empresa_tipo ON public.caixa_lancamentos(empresa_id, tipo);
CREATE INDEX IF NOT EXISTS idx_caixa_lanc_empresa_obra ON public.caixa_lancamentos(empresa_id, obra_id);
CREATE INDEX IF NOT EXISTS idx_caixa_lanc_empresa_cat ON public.caixa_lancamentos(empresa_id, categoria);

-- 4. TABELA CAIXA_FECHAMENTOS (Registro de congelamento / trava de fechamento mensal opcional)
CREATE TABLE IF NOT EXISTS public.caixa_fechamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL, -- YYYY-MM
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  saldo_anterior NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_entradas NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_saidas NUMERIC(15, 2) NOT NULL DEFAULT 0,
  saldo_final NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'CONGELADO')),
  fechado_por TEXT,
  fechado_em TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_caixa_fechamentos_empresa_comp UNIQUE (empresa_id, competencia)
);

CREATE INDEX IF NOT EXISTS idx_caixa_fech_empresa_comp ON public.caixa_fechamentos(empresa_id, competencia);

-- 5. RLS POLICIES (Mesmo padrão das outras tabelas anon_all_*)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_fechamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_obras" ON public.obras;
CREATE POLICY "anon_all_obras" ON public.obras FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_caixa_categorias" ON public.caixa_categorias;
CREATE POLICY "anon_all_caixa_categorias" ON public.caixa_categorias FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_caixa_lancamentos" ON public.caixa_lancamentos;
CREATE POLICY "anon_all_caixa_lancamentos" ON public.caixa_lancamentos FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_caixa_fechamentos" ON public.caixa_fechamentos;
CREATE POLICY "anon_all_caixa_fechamentos" ON public.caixa_fechamentos FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. SEED DAS CATEGORIAS PADRÃO PARA TODAS AS EMPRESAS ATIVAS
DO $$
DECLARE
  r_emp RECORD;
BEGIN
  FOR r_emp IN SELECT id FROM public.empresas LOOP
    -- Categorias de Entrada
    INSERT INTO public.caixa_categorias (empresa_id, tipo, nome, cor, ordem) VALUES
      (r_emp.id, 'entrada', 'Recebimento de Obra', '#10b981', 10),
      (r_emp.id, 'entrada', 'Venda de Concreto à Vista', '#059669', 20),
      (r_emp.id, 'entrada', 'Venda de Agregados / Brita', '#047857', 30),
      (r_emp.id, 'entrada', 'Serviço de Bombeamento', '#0d9488', 40),
      (r_emp.id, 'entrada', 'Aporte / Transferência entre Contas', '#3b82f6', 50),
      (r_emp.id, 'entrada', 'Rendimento / Financeiro', '#6366f1', 60),
      (r_emp.id, 'entrada', 'Outras Receitas', '#64748b', 90)
    ON CONFLICT (empresa_id, tipo, nome) DO NOTHING;

    -- Categorias de Saída
    INSERT INTO public.caixa_categorias (empresa_id, tipo, nome, cor, ordem) VALUES
      (r_emp.id, 'saida', 'Insumos (Cimento/Areia/Brita/Aditivo)', '#ef4444', 10),
      (r_emp.id, 'saida', 'Folha de Pagamento', '#dc2626', 20),
      (r_emp.id, 'saida', 'Adiantamento de Folha / Quinzena', '#b91c1c', 25),
      (r_emp.id, 'saida', 'Combustível e Lubrificantes', '#f97316', 30),
      (r_emp.id, 'saida', 'Manutenção de Caminhões / Central', '#ea580c', 40),
      (r_emp.id, 'saida', 'Peças e Pneus', '#d97706', 50),
      (r_emp.id, 'saida', 'Impostos e Tributos (DAS/ICMS/ISS)', '#eab308', 60),
      (r_emp.id, 'saida', 'Energia Elétrica / Água / Internet', '#84cc16', 70),
      (r_emp.id, 'saida', 'Aluguel / Imóveis / Máquinas', '#14b8a6', 80),
      (r_emp.id, 'saida', 'Alimentação e Despesas de Viagem', '#06b6d4', 90),
      (r_emp.id, 'saida', 'Despesas Bancárias / Juros / Tarifas', '#8b5cf6', 100),
      (r_emp.id, 'saida', 'Retirada de Pró-labore / Sócios', '#a855f7', 110),
      (r_emp.id, 'saida', 'Outras Despesas Operacionais', '#64748b', 120)
    ON CONFLICT (empresa_id, tipo, nome) DO NOTHING;
  END LOOP;
END $$;
