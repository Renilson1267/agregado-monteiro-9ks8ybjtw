-- Migração: Criar tabelas de Controle de Britas (Brita 19 e Brita 12)
-- controle_britas_entregas e controle_britas_compras
-- Separado do estoque normal de materiais (sem mexer em movimentacoes_estoque nem saldo cimento/aditivo)

CREATE TABLE IF NOT EXISTS public.controle_britas_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_brita TEXT NOT NULL CHECK (tipo_brita IN ('19', '12')),
  competencia TEXT NOT NULL, -- formato 'YYYY-MM'
  volume_m3 NUMERIC NOT NULL DEFAULT 0 CHECK (volume_m3 >= 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_controle_britas_compras UNIQUE (empresa_id, tipo_brita, competencia)
);

CREATE TABLE IF NOT EXISTS public.controle_britas_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_brita TEXT NOT NULL CHECK (tipo_brita IN ('19', '12')),
  competencia TEXT NOT NULL, -- formato 'YYYY-MM'
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  quantidade NUMERIC NOT NULL CHECK (quantidade > 0),
  unidade TEXT NOT NULL CHECK (unidade IN ('m³', 't')),
  densidade NUMERIC NULL CHECK (densidade IS NULL OR densidade > 0),
  quantidade_m3 NUMERIC NOT NULL CHECK (quantidade_m3 > 0),
  fornecedor TEXT,
  documento TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_controle_britas_compras_emp_comp ON public.controle_britas_compras(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_controle_britas_entregas_emp_comp ON public.controle_britas_entregas(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_controle_britas_entregas_data ON public.controle_britas_entregas(data);

-- Habilitar RLS
ALTER TABLE public.controle_britas_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_britas_entregas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão do projeto (anon e authenticated ALL)
DROP POLICY IF EXISTS "anon_all_controle_britas_compras" ON public.controle_britas_compras;
CREATE POLICY "anon_all_controle_britas_compras" ON public.controle_britas_compras
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_controle_britas_entregas" ON public.controle_britas_entregas;
CREATE POLICY "anon_all_controle_britas_entregas" ON public.controle_britas_entregas
  FOR ALL TO public USING (true) WITH CHECK (true);
