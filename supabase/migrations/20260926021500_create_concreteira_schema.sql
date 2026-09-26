-- Migration: Concreteira schema and initial data
-- 1. Create tables

CREATE TABLE IF NOT EXISTS public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'kg', -- 'kg' ou 'L'
  estoque_minimo NUMERIC NOT NULL DEFAULT 1000,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.motoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT UNIQUE NOT NULL,
  modelo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  uf TEXT NOT NULL DEFAULT 'PB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tracos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  fck_mpa INT,
  -- Consumo padrão por m³
  consumo_brita12 NUMERIC NOT NULL DEFAULT 0,
  consumo_brita19 NUMERIC NOT NULL DEFAULT 0,
  consumo_areia NUMERIC NOT NULL DEFAULT 0,
  consumo_po_pedra NUMERIC NOT NULL DEFAULT 0,
  consumo_cimento NUMERIC NOT NULL DEFAULT 0,
  consumo_aditivo NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_carga SERIAL,
  data DATE NOT NULL,
  volume_m3 NUMERIC NOT NULL DEFAULT 0,
  traco_id UUID REFERENCES public.tracos(id) ON DELETE SET NULL,
  traco_nome TEXT,
  motorista_id UUID REFERENCES public.motoristas(id) ON DELETE SET NULL,
  motorista_nome TEXT,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  veiculo_placa TEXT,
  cidade_id UUID REFERENCES public.cidades(id) ON DELETE SET NULL,
  cidade_nome TEXT,
  -- Consumos reais gravados na carga
  consumo_brita12 NUMERIC NOT NULL DEFAULT 0,
  consumo_brita19 NUMERIC NOT NULL DEFAULT 0,
  consumo_areia NUMERIC NOT NULL DEFAULT 0,
  consumo_po_pedra NUMERIC NOT NULL DEFAULT 0,
  consumo_cimento NUMERIC NOT NULL DEFAULT 0,
  consumo_aditivo NUMERIC NOT NULL DEFAULT 0,
  observacao TEXT,
  carga_zerada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'ABERTURA', 'AJUSTE')),
  quantidade NUMERIC NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  carga_id UUID REFERENCES public.cargas(id) ON DELETE CASCADE,
  documento TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cargas_data ON public.cargas(data);
CREATE INDEX IF NOT EXISTS idx_cargas_cidade ON public.cargas(cidade_nome);
CREATE INDEX IF NOT EXISTS idx_cargas_motorista ON public.cargas(motorista_nome);
CREATE INDEX IF NOT EXISTS idx_cargas_veiculo ON public.cargas(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_mov_material_data ON public.movimentacoes_estoque(material_id, data);

-- Enable RLS and permissive policies for public app (no login required)
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_materiais" ON public.materiais;
CREATE POLICY "anon_all_materiais" ON public.materiais FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_motoristas" ON public.motoristas;
CREATE POLICY "anon_all_motoristas" ON public.motoristas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_veiculos" ON public.veiculos;
CREATE POLICY "anon_all_veiculos" ON public.veiculos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_cidades" ON public.cidades;
CREATE POLICY "anon_all_cidades" ON public.cidades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_tracos" ON public.tracos;
CREATE POLICY "anon_all_tracos" ON public.tracos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_cargas" ON public.cargas;
CREATE POLICY "anon_all_cargas" ON public.cargas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_movimentacoes" ON public.movimentacoes_estoque;
CREATE POLICY "anon_all_movimentacoes" ON public.movimentacoes_estoque FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
