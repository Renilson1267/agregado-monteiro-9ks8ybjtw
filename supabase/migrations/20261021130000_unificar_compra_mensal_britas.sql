-- Ajuste no controle_britas_compras:
-- A compra mensal passa a ser UM ÚNICO volume para as duas britas juntas por empresa + competência.
-- Removemos a dependência de tipo_brita em compras (uma única linha por empresa e competência).
-- Se houver compras do mesmo mês para a mesma empresa (ex: 19 e 12), somamos os volumes antes de aplicar a nova restrição única.

DO $$
BEGIN
  -- 1. Se houver duplicidade por empresa_id e competencia na tabela atual, agregar somando volume_m3
  CREATE TEMP TABLE tmp_britas_agrupadas AS
  SELECT
    empresa_id,
    competencia,
    SUM(volume_m3) AS volume_total,
    MAX(observacao) AS observacao_final,
    MIN(created_at) AS min_created_at,
    MAX(updated_at) AS max_updated_at
  FROM public.controle_britas_compras
  GROUP BY empresa_id, competencia;

  -- Limpar a tabela temporariamente e reinserir agregado
  TRUNCATE TABLE public.controle_britas_compras;

  -- Dropar a constraint antiga uq_controle_britas_compras se existir
  ALTER TABLE public.controle_britas_compras DROP CONSTRAINT IF EXISTS uq_controle_britas_compras;

  -- Dropar coluna tipo_brita da tabela de compras
  ALTER TABLE public.controle_britas_compras DROP COLUMN IF EXISTS tipo_brita;

  -- Reinserir os dados agregados
  INSERT INTO public.controle_britas_compras (
    id,
    empresa_id,
    competencia,
    volume_m3,
    observacao,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    empresa_id,
    competencia,
    volume_total,
    observacao_final,
    min_created_at,
    max_updated_at
  FROM tmp_britas_agrupadas;

  DROP TABLE tmp_britas_agrupadas;

  -- Adicionar a nova constraint unique (empresa_id, competencia)
  ALTER TABLE public.controle_britas_compras
    ADD CONSTRAINT uq_controle_britas_compras_mes UNIQUE (empresa_id, competencia);

END $$;
