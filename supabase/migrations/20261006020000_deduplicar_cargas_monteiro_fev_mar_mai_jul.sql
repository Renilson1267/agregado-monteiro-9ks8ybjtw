-- Deduplicação exata das cargas redundantes da Monteiro (Fev, Mar, Mai e Jul)
-- Cada mês possui um par de linhas adjacentes idênticas (mesma data, dosagens, sem motorista/placa)
-- Removendo 1 cópia redundante de cada mês (−7 m³ cada, total −28 m³)
-- e removendo as 8 movimentações de estoque vinculadas às cópias excluídas.

-- Também remove as tabelas temporárias criadas durante a análise prévia
DROP TABLE IF EXISTS public._dedup_notices;
DROP TABLE IF EXISTS public._dedup_resultado_resumo;
DROP TABLE IF EXISTS public._dedup_temp_log;

DO $$
DECLARE
  v_empresa_id CONSTANT uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_carga_fev CONSTANT uuid := 'bf6c76ea-8b9f-4681-9018-6d53ed442837'::uuid; -- Fev: 2026-02-11 (seq 79)
  v_carga_mar CONSTANT uuid := 'bd3e6a89-1f50-4459-91b8-3d98267fa2e1'::uuid; -- Mar: 2026-03-31 (seq 161)
  v_carga_mai CONSTANT uuid := '794fab1a-9d0f-41c2-87fc-a9e871d9d463'::uuid; -- Mai: 2026-05-11 (seq 237)
  v_carga_jul CONSTANT uuid := 'db09a4e7-8c1c-4ab0-b857-999fd2a8a208'::uuid; -- Jul: 2026-07-08 (seq 367)
  v_deleted_movs integer;
  v_deleted_cargas integer;
BEGIN
  -- 1. Excluir movimentações de estoque associadas às 4 cargas duplicadas
  DELETE FROM public.movimentacoes_estoque
  WHERE carga_id IN (v_carga_fev, v_carga_mar, v_carga_mai, v_carga_jul);
  GET DIAGNOSTICS v_deleted_movs = ROW_COUNT;

  -- 2. Excluir as 4 cargas duplicadas
  DELETE FROM public.cargas
  WHERE id IN (v_carga_fev, v_carga_mar, v_carga_mai, v_carga_jul)
    AND empresa_id = v_empresa_id;
  GET DIAGNOSTICS v_deleted_cargas = ROW_COUNT;

  RAISE NOTICE 'Deduplicação concluída: % movimentações e % cargas removidas.', v_deleted_movs, v_deleted_cargas;
END $$;

-- Garantir que as 3 funções RPC críticas existam e estejam com permissões corretas
DROP FUNCTION IF EXISTS public.confirmar_email_auth_usuario(text);
CREATE OR REPLACE FUNCTION public.confirmar_email_auth_usuario(p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Pode receber tanto um UUID (id do user) quanto um email
  IF p_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_user_id := p_user_id::uuid;
  ELSE
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower(p_user_id);
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado em auth.users');
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = '',
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(text) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.atualizar_email_usuario(text, text);
CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(p_user_id text, p_novo_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := p_user_id::uuid;

  UPDATE auth.users
  SET email = lower(p_novo_email),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = v_uid;

  UPDATE public.usuarios_app
  SET email = lower(p_novo_email),
      updated_at = now()
  WHERE user_id = v_uid;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.proximo_numero_os(text);
CREATE OR REPLACE FUNCTION public.proximo_numero_os(p_empresa_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_uuid uuid;
  v_max_os integer;
BEGIN
  v_empresa_uuid := p_empresa_id::uuid;

  SELECT COALESCE(MAX(numero_os), 0) INTO v_max_os
  FROM public.ordens_servico
  WHERE empresa_id = v_empresa_uuid;

  RETURN v_max_os + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO anon, authenticated, service_role;
