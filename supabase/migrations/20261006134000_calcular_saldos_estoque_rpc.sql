-- Migration: criar funcao RPC para calcular saldos de estoque agregados
-- Evita o truncamento de 1000 linhas da API PostgREST quando somado no cliente

CREATE OR REPLACE FUNCTION public.calcular_saldos_estoque(p_empresa_id UUID DEFAULT NULL)
RETURNS TABLE (
  material_id UUID,
  saldo NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mov.material_id,
    COALESCE(SUM(
      CASE 
        WHEN mov.tipo IN ('ENTRADA', 'ABERTURA') THEN mov.quantidade 
        ELSE -mov.quantidade 
      END
    ), 0)::NUMERIC AS saldo
  FROM public.movimentacoes_estoque mov
  WHERE (p_empresa_id IS NULL OR mov.empresa_id = p_empresa_id)
  GROUP BY mov.material_id;
$$;

-- Permite chamada por anon e authenticated
GRANT EXECUTE ON FUNCTION public.calcular_saldos_estoque(UUID) TO anon, authenticated, service_role;
