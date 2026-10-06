-- Migration: 20261006140000_atualizar_estoque_minimo_aditivo_sje.sql
-- Atualiza o estoque mínimo do aditivo da SJE para 900 L, alinhando com o padrão da Monteiro.

UPDATE public.materiais
SET estoque_minimo = 900
WHERE codigo = 'aditivo'
  AND (
    empresa_id IN (SELECT id FROM public.empresas WHERE slug = 'sje')
    OR empresa_id = '22222222-2222-2222-2222-222222222222'::uuid
  );
