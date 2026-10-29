-- Migração para unificar e limpar sobrecargas das RPCs:
-- 1. confirmar_email_auth_usuario
-- 2. atualizar_email_usuario
-- 3. proximo_numero_os
-- Ao eliminar sobrecargas e padronizar assinaturas com DROP + CREATE,
-- o gerador de types do Supabase deixa de concatenar mensagens de erro/tipos inválidos.

-- 1. DROP de todas as sobrecargas existentes
DROP FUNCTION IF EXISTS public.confirmar_email_auth_usuario(uuid);
DROP FUNCTION IF EXISTS public.confirmar_email_auth_usuario(text);
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(uuid, text);
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(text, text);
DROP FUNCTION IF EXISTS public.proximo_numero_os(uuid);
DROP FUNCTION IF EXISTS public.proximo_numero_os(text);

-- 2. RPC confirmar_email_auth_usuario (assinatura limpa: p_user_id text -> jsonb)
CREATE OR REPLACE FUNCTION public.confirmar_email_auth_usuario(p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_result jsonb;
BEGIN
  BEGIN
    v_uid := p_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID de usuário inválido');
  END;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado em auth.users');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'E-mail confirmado com sucesso');
END;
$$;

-- 3. RPC atualizar_email_usuario (assinatura limpa: p_usuario_app_id text, p_novo_email text -> jsonb)
CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(p_usuario_app_id text, p_novo_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app_uid uuid;
  v_auth_uid uuid;
BEGIN
  BEGIN
    v_app_uid := p_usuario_app_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID de usuário do app inválido');
  END;

  SELECT user_id INTO v_auth_uid
  FROM public.usuarios_app
  WHERE id = v_app_uid;

  UPDATE public.usuarios_app
  SET email = p_novo_email,
      updated_at = NOW()
  WHERE id = v_app_uid;

  IF v_auth_uid IS NOT NULL THEN
    UPDATE auth.users
    SET email = p_novo_email,
        updated_at = NOW()
    WHERE id = v_auth_uid;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'E-mail atualizado com sucesso');
END;
$$;

-- 4. RPC proximo_numero_os (assinatura limpa: p_empresa_id text -> integer)
CREATE OR REPLACE FUNCTION public.proximo_numero_os(p_empresa_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_uid uuid;
  v_proximo integer;
BEGIN
  BEGIN
    v_empresa_uid := p_empresa_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_empresa_uid := NULL;
  END;

  IF v_empresa_uid IS NOT NULL THEN
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO v_proximo
    FROM public.ordens_servico
    WHERE empresa_id = v_empresa_uid;
  ELSE
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO v_proximo
    FROM public.ordens_servico;
  END IF;

  RETURN v_proximo;
END;
$$;

-- Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO anon, authenticated, service_role;
