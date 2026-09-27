-- Migração: Módulo Folha de Pagamento Multi-Empresa
-- Tabelas: folha_competencias e folha_pagamento_linhas
-- Permite controle mensal por competência (ex: '2026-09'), importação de CSV com deduplicação,
-- armazenamento detalhado dos proventos, descontos, bases, encargos e valores líquidos.

-- 1. Tabela de Competências da Folha por Empresa
CREATE TABLE IF NOT EXISTS public.folha_competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  competencia TEXT NOT NULL, -- Formato 'YYYY-MM', ex: '2026-09'
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_colaboradores INTEGER NOT NULL DEFAULT 0,
  total_proventos NUMERIC NOT NULL DEFAULT 0,
  total_descontos NUMERIC NOT NULL DEFAULT 0,
  total_liquido NUMERIC NOT NULL DEFAULT 0,
  total_fgts NUMERIC NOT NULL DEFAULT 0,
  total_inss_empresa NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ABERTA', -- 'ABERTA', 'FECHADA'
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices e Unique para folha_competencias
CREATE INDEX IF NOT EXISTS idx_folha_comp_empresa ON public.folha_competencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_comp_ano_mes ON public.folha_competencias(competencia);
CREATE UNIQUE INDEX IF NOT EXISTS idx_folha_comp_empresa_competencia 
  ON public.folha_competencias(empresa_id, competencia);

-- 2. Tabela de Linhas Detalhadas da Folha de Pagamento
CREATE TABLE IF NOT EXISTS public.folha_pagamento_linhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  competencia_id UUID REFERENCES public.folha_competencias(id) ON DELETE CASCADE NOT NULL,
  competencia TEXT NOT NULL, -- 'YYYY-MM' para consultas diretas
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  matricula TEXT,
  cpf TEXT,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'Geral',
  departamento TEXT,
  data_admissao DATE,
  
  -- Valores Salariais e Proventos
  salario_base NUMERIC NOT NULL DEFAULT 0,
  horas_normais NUMERIC NOT NULL DEFAULT 0,
  horas_extras NUMERIC NOT NULL DEFAULT 0,
  valor_horas_extras NUMERIC NOT NULL DEFAULT 0,
  adicional_periculosidade NUMERIC NOT NULL DEFAULT 0,
  adicional_insalubridade NUMERIC NOT NULL DEFAULT 0,
  adicional_noturno NUMERIC NOT NULL DEFAULT 0,
  gratificacoes NUMERIC NOT NULL DEFAULT 0,
  comissoes NUMERIC NOT NULL DEFAULT 0,
  dsr NUMERIC NOT NULL DEFAULT 0,
  outros_proventos NUMERIC NOT NULL DEFAULT 0,
  total_proventos NUMERIC NOT NULL DEFAULT 0,
  
  -- Descontos
  inss_retido NUMERIC NOT NULL DEFAULT 0,
  irrf_retido NUMERIC NOT NULL DEFAULT 0,
  vale_transporte NUMERIC NOT NULL DEFAULT 0,
  vale_refeicao NUMERIC NOT NULL DEFAULT 0,
  adiantamento NUMERIC NOT NULL DEFAULT 0,
  faltas_atrasos NUMERIC NOT NULL DEFAULT 0,
  plano_saude NUMERIC NOT NULL DEFAULT 0,
  outros_descontos NUMERIC NOT NULL DEFAULT 0,
  total_descontos NUMERIC NOT NULL DEFAULT 0,
  
  -- Resultado Líquido
  salario_liquido NUMERIC NOT NULL DEFAULT 0,
  
  -- Bases de Cálculo e Encargos
  base_inss NUMERIC NOT NULL DEFAULT 0,
  base_fgts NUMERIC NOT NULL DEFAULT 0,
  base_irrf NUMERIC NOT NULL DEFAULT 0,
  fgts_mes NUMERIC NOT NULL DEFAULT 0,
  
  -- Dados bancários e extras
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  chave_pix TEXT,
  observacoes TEXT,
  itens_discriminados JSONB DEFAULT '[]'::jsonb, -- lista de proventos e descontos avulsos
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para folha_pagamento_linhas
CREATE INDEX IF NOT EXISTS idx_folha_linhas_empresa ON public.folha_pagamento_linhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_comp ON public.folha_pagamento_linhas(competencia_id);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_competencia ON public.folha_pagamento_linhas(competencia);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_cpf ON public.folha_pagamento_linhas(cpf);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_nome ON public.folha_pagamento_linhas(nome);
CREATE INDEX IF NOT EXISTS idx_folha_linhas_func ON public.folha_pagamento_linhas(funcionario_id);

-- Constraint condicional de unicidade por competência + CPF ou matrícula (para deduplicação na importação)
CREATE UNIQUE INDEX IF NOT EXISTS idx_folha_linhas_comp_cpf 
  ON public.folha_pagamento_linhas(competencia_id, cpf)
  WHERE cpf IS NOT NULL AND cpf <> '';

-- 3. Habilitar RLS e criar políticas
ALTER TABLE public.folha_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamento_linhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_folha_competencias" ON public.folha_competencias;
CREATE POLICY "anon_all_folha_competencias" ON public.folha_competencias FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_folha_linhas" ON public.folha_pagamento_linhas;
CREATE POLICY "anon_all_folha_linhas" ON public.folha_pagamento_linhas FOR ALL TO public USING (true) WITH CHECK (true);
