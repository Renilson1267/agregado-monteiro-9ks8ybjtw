-- Migration: Criar as competências 2026-10, 2026-11 e 2026-12 para ambas as empresas (Monteiro e SJE)
-- Idempotente com ON CONFLICT (empresa_id, competencia) DO NOTHING

INSERT INTO public.folha_competencias (
  empresa_id,
  competencia,
  ano,
  mes,
  total_colaboradores,
  total_proventos,
  total_descontos,
  total_liquido,
  total_fgts,
  total_inss_empresa,
  status,
  observacoes,
  data_competencia,
  percentual_quinzena
)
SELECT
  e.id AS empresa_id,
  c.competencia,
  c.ano,
  c.mes,
  0 AS total_colaboradores,
  0 AS total_proventos,
  0 AS total_descontos,
  0 AS total_liquido,
  0 AS total_fgts,
  0 AS total_inss_empresa,
  'ABERTA' AS status,
  'Competência criada para encerramento do exercício 2026' AS observacoes,
  NULL AS data_competencia,
  0.40 AS percentual_quinzena
FROM public.empresas e
CROSS JOIN (
  VALUES
    ('2026-10', 2026, 10),
    ('2026-11', 2026, 11),
    ('2026-12', 2026, 12)
) AS c(competencia, ano, mes)
ON CONFLICT (empresa_id, competencia) DO NOTHING;
