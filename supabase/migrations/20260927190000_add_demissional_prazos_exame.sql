-- Atualiza a restrição de validade_padrao_meses para permitir 0 (exame demissional / sem validade periódica)
ALTER TABLE public.prazos_exame_por_empresa 
  DROP CONSTRAINT IF EXISTS prazos_exame_por_empresa_validade_padrao_meses_check;

ALTER TABLE public.prazos_exame_por_empresa 
  ADD CONSTRAINT prazos_exame_por_empresa_validade_padrao_meses_check 
  CHECK (validade_padrao_meses >= 0);

-- Inserção do tipo de exame 'demissional' na tabela prazos_exame_por_empresa para Monteiro e SJE
-- O exame demissional é realizado na data da rescisão (sem periodicidade anual de vencimento)
-- Base legal: Art. 168 §4º CLT — exame na rescisão (até 10 dias após)
-- validade_padrao_meses = 0 (sem validade automática / aplicável apenas na rescisão)

INSERT INTO public.prazos_exame_por_empresa (
  empresa_id,
  tipo_exame,
  nome_exame,
  validade_padrao_meses,
  norma_referencia,
  descricao_norma
)
SELECT 
  e.id as empresa_id,
  'demissional' as tipo_exame,
  'Exame Demissional' as nome_exame,
  0 as validade_padrao_meses,
  'Art. 168 §4º CLT' as norma_referencia,
  'Art. 168 §4º CLT — exame na rescisão (até 10 dias após). Não possui validade periódica prévia.' as descricao_norma
FROM public.empresas e
WHERE e.slug IN ('monteiro', 'sje')
ON CONFLICT (empresa_id, tipo_exame) DO UPDATE SET
  nome_exame = EXCLUDED.nome_exame,
  validade_padrao_meses = EXCLUDED.validade_padrao_meses,
  norma_referencia = EXCLUDED.norma_referencia,
  descricao_norma = EXCLUDED.descricao_norma,
  updated_at = NOW();
