-- Migration: restaurar_rpc_proximo_numero_os
CREATE OR REPLACE FUNCTION public.proximo_numero_os(
  p_empresa_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prox integer;
  v_emp_uuid uuid;
BEGIN
  IF p_empresa_id IS NULL OR trim(p_empresa_id) = '' THEN
    SELECT COALESCE(MAX(numero_os), 4336) + 1
    INTO v_prox
    FROM public.ordens_servico;
    RETURN v_prox;
  END IF;

  v_emp_uuid := p_empresa_id::uuid;

  SELECT COALESCE(MAX(numero_os), 4336) + 1
  INTO v_prox
  FROM public.ordens_servico
  WHERE empresa_id = v_emp_uuid;

  RETURN v_prox;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO authenticated, anon;
