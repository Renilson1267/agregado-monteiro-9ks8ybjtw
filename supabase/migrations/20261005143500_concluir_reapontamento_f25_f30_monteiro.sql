-- Migration: concluir_reapontamento_f25_f30_monteiro
-- Reaponta as cargas restantes de "F25B=01S12 CP II F 40" e "F-30B01S12 CP II F 40" de Monteiro
-- e remove esses traços legados do catálogo.

DO $$
DECLARE
  v_emp_monteiro uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_mon_f25 uuid;
  v_mon_f30 uuid;
BEGIN
  SELECT id INTO v_mon_f25
  FROM public.tracos
  WHERE empresa_id = v_emp_monteiro AND nome = 'F25B01S12 CP II F 40';

  SELECT id INTO v_mon_f30
  FROM public.tracos
  WHERE empresa_id = v_emp_monteiro AND nome = 'F30B01S12 CP II F 40';

  -- 1. Reapontar cargas de F25B=01S12 CP II F 40 para F25B01S12
  UPDATE public.cargas
  SET traco_id = v_mon_f25,
      traco_nome = CASE
        WHEN traco_nome LIKE '%(Manual)%' THEN 'F25B01S12 CP II F 40 (Manual)'
        ELSE 'F25B01S12 CP II F 40'
      END
  WHERE empresa_id = v_emp_monteiro
    AND traco_id = '6a478459-dc8c-4b9b-a734-302306bf1bf8'::uuid;

  -- 2. Reapontar cargas de F-30B01S12 CP II F 40 para F30B01S12
  UPDATE public.cargas
  SET traco_id = v_mon_f30,
      traco_nome = CASE
        WHEN traco_nome LIKE '%(Manual)%' THEN 'F30B01S12 CP II F 40 (Manual)'
        ELSE 'F30B01S12 CP II F 40'
      END
  WHERE empresa_id = v_emp_monteiro
    AND traco_id = '607e0263-9890-42da-a4f5-243902ded431'::uuid;

  -- 3. Deletar os dois traços fora do padrão agora que suas cargas foram 100% migradas
  DELETE FROM public.tracos
  WHERE id IN (
    '6a478459-dc8c-4b9b-a734-302306bf1bf8'::uuid,
    '607e0263-9890-42da-a4f5-243902ded431'::uuid
  )
  AND NOT EXISTS (SELECT 1 FROM public.cargas WHERE traco_id = public.tracos.id);

  -- 4. Garantir que não restou nenhum outro traço fora do padrão em Monteiro ou outras unidades
  DELETE FROM public.tracos
  WHERE NOT (nome ~ '^F[0-9]{1,2}B01S12 CP II F 40$')
    AND NOT EXISTS (SELECT 1 FROM public.cargas WHERE traco_id = public.tracos.id);

END $$;
