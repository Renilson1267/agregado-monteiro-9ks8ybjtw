-- Migration: Criar tabela empresas e adicionar empresa_id com FK e índices

-- 1. Tabela empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed empresas iniciais
INSERT INTO public.empresas (id, nome, slug, ativo)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Monteiro', 'monteiro', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'SJE', 'sje', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Adicionar empresa_id às tabelas operacionais
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.tracos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.cidades ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 3. Preços unitários por material/mês para relatórios de custo
CREATE TABLE IF NOT EXISTS public.precos_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  material_codigo TEXT NOT NULL,
  mes_ano TEXT NOT NULL, -- ex: '09/2026' ou '2026-09'
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, material_codigo, mes_ano)
);

-- 4. Ajustar constraints únicas para serem por empresa_id (materiais, motoristas, veiculos, cidades, tracos)
-- Dropar constraints únicas globais anteriores se existirem
ALTER TABLE public.materiais DROP CONSTRAINT IF EXISTS materiais_codigo_key;
ALTER TABLE public.tracos DROP CONSTRAINT IF EXISTS tracos_nome_key;
ALTER TABLE public.motoristas DROP CONSTRAINT IF EXISTS motoristas_nome_key;
ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS veiculos_placa_key;
ALTER TABLE public.cidades DROP CONSTRAINT IF EXISTS cidades_nome_key;

-- Criar índices e constraints únicos compostos por (empresa_id, ...)
CREATE UNIQUE INDEX IF NOT EXISTS idx_materiais_empresa_codigo ON public.materiais(empresa_id, codigo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracos_empresa_nome ON public.tracos(empresa_id, nome);
CREATE UNIQUE INDEX IF NOT EXISTS idx_motoristas_empresa_nome ON public.motoristas(empresa_id, nome);
CREATE UNIQUE INDEX IF NOT EXISTS idx_veiculos_empresa_placa ON public.veiculos(empresa_id, placa);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cidades_empresa_nome ON public.cidades(empresa_id, nome);

-- Índices de consulta rápida por empresa_id
CREATE INDEX IF NOT EXISTS idx_materiais_empresa ON public.materiais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tracos_empresa ON public.tracos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_empresa ON public.motoristas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_empresa ON public.veiculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cidades_empresa ON public.cidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cargas_empresa ON public.cargas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cargas_empresa_data ON public.cargas(empresa_id, data);
CREATE INDEX IF NOT EXISTS idx_mov_empresa ON public.movimentacoes_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mov_empresa_material ON public.movimentacoes_estoque(empresa_id, material_id);
CREATE INDEX IF NOT EXISTS idx_precos_empresa ON public.precos_material(empresa_id);

-- 5. RLS e Políticas de Acesso
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_material ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_empresas" ON public.empresas;
CREATE POLICY "anon_all_empresas" ON public.empresas FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_precos" ON public.precos_material;
CREATE POLICY "anon_all_precos" ON public.precos_material FOR ALL TO public USING (true) WITH CHECK (true);
