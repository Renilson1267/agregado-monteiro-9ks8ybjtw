-- Migration: Remover percentual_ajuste e excluir unidades operacionais AURÉLIO, CONCRETISA e COSAMPA
-- Mantendo intactas Monteiro (11111111-1111-1111-1111-111111111111) e SJE (22222222-2222-2222-2222-222222222222)

DO $$
BEGIN
  -- 1. Remover coluna percentual_ajuste de public.controle_ferias se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'controle_ferias' 
      AND column_name = 'percentual_ajuste'
  ) THEN
    ALTER TABLE public.controle_ferias DROP COLUMN percentual_ajuste;
  END IF;

  -- 2. Remover coluna percentual_ajuste de public.funcionarios se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'funcionarios' 
      AND column_name = 'percentual_ajuste'
  ) THEN
    ALTER TABLE public.funcionarios DROP COLUMN percentual_ajuste;
  END IF;
END $$;

-- 3. Deletar com segurança as empresas AURÉLIO, CONCRETISA e COSAMPA
-- Garantir que nenhum usuario_app fique apontando para elas antes do delete (caso haja algum futuro)
UPDATE public.usuarios_app
SET empresa_id = NULL
WHERE empresa_id IN (
  '33333333-3333-3333-3333-333333333333'::UUID, -- COSAMPA
  '44444444-4444-4444-4444-444444444444'::UUID, -- AURÉLIO
  '55555555-5555-5555-5555-555555555555'::UUID  -- CONCRETISA
);

-- Como todas as outras tabelas com FK possuem ON DELETE CASCADE, deletar de public.empresas
DELETE FROM public.empresas
WHERE id IN (
  '33333333-3333-3333-3333-333333333333'::UUID, -- COSAMPA
  '44444444-4444-4444-4444-444444444444'::UUID, -- AURÉLIO
  '55555555-5555-5555-5555-555555555555'::UUID  -- CONCRETISA
)
OR slug IN ('cosampa', 'aurelio', 'concretisa')
OR UPPER(nome) IN ('COSAMPA', 'AURÉLIO', 'AURELIO', 'CONCRETISA');
