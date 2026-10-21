-- Migração: Criar tabela controle_britas_cheques para controle financeiro dos pagamentos da compra de britas
-- empresa_id, competencia, valor numeric, data_vencimento date, numero text, observacao text, pago boolean default false, created_at

CREATE TABLE IF NOT EXISTS public.controle_britas_cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL, -- formato 'YYYY-MM'
  valor NUMERIC NOT NULL CHECK (valor >= 0),
  data_vencimento DATE,
  numero TEXT,
  observacao TEXT,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas rápidas por empresa e competência
CREATE INDEX IF NOT EXISTS idx_controle_britas_cheques_emp_comp ON public.controle_britas_cheques(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_controle_britas_cheques_vencimento ON public.controle_britas_cheques(data_vencimento);

-- Habilitar RLS
ALTER TABLE public.controle_britas_cheques ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão do projeto (acesso irrestrito compatível com a aplicação)
DROP POLICY IF EXISTS "anon_all_controle_britas_cheques" ON public.controle_britas_cheques;
CREATE POLICY "anon_all_controle_britas_cheques" ON public.controle_britas_cheques
  FOR ALL TO public USING (true) WITH CHECK (true);
