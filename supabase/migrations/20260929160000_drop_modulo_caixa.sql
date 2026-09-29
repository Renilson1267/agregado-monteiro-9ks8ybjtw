-- ============================================================================
-- MIGRATION: Desconsiderar e Apagar Controle de Caixa
-- Remove completamente as tabelas exclusivas do módulo Caixa:
--   - caixa_lancamentos
--   - caixa_fechamentos
--   - caixa_categorias
--   - obras (criada exclusivamente na migração do caixa)
--
-- ATENÇÃO: Os registros das empresas na tabela public.empresas
-- (incluindo COSAMPA, AURÉLIO, CONCRETISA, Monteiro, SJE) são PRESERVADOS.
-- ============================================================================

-- 1. Drop das tabelas em ordem correta de dependência (ou usando CASCADE)
DROP TABLE IF EXISTS public.caixa_lancamentos CASCADE;
DROP TABLE IF EXISTS public.caixa_fechamentos CASCADE;
DROP TABLE IF EXISTS public.caixa_categorias CASCADE;
DROP TABLE IF EXISTS public.obras CASCADE;
