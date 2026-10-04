-- Migration: restaurar_rpc_atualizar_email_usuario
CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(
  p_usuario_app_id text,
  p_novo_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_app_uuid uuid;
  v_email_limpo text;
  v_conflito_app uuid;
  v_conflito_auth uuid;
BEGIN
  v_email_limpo := lower(trim(p_novo_email));

  IF p_usuario_app_id IS NULL OR trim(p_usuario_app_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Identificador do usuário inválido.');
  END IF;

  BEGIN
    v_app_uuid := p_usuario_app_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não é um UUID válido.');
  END;

  IF v_email_limpo IS NULL OR v_email_limpo = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'O e-mail não pode ficar em branco.');
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.usuarios_app
  WHERE id = v_app_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado na tabela de usuários do sistema.');
  END IF;

  SELECT id INTO v_conflito_app
  FROM public.usuarios_app
  WHERE lower(trim(email)) = v_email_limpo
    AND id <> v_app_uuid
  LIMIT 1;

  IF v_conflito_app IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está em uso por outro operador no sistema.');
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_conflito_auth
    FROM auth.users
    WHERE lower(trim(email)) = v_email_limpo
      AND id <> v_user_id
    LIMIT 1;

    IF v_conflito_auth IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está cadastrado na autenticação do sistema.');
    END IF;

    UPDATE auth.users
    SET
      email = v_email_limpo,
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{email}',
        to_jsonb(v_email_limpo)
      ),
      updated_at = NOW()
    WHERE id = v_user_id;

    UPDATE auth.identities
    SET
      email = v_email_limpo,
      identity_data = jsonb_set(
        COALESCE(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(v_email_limpo)
      ),
      updated_at = NOW()
    WHERE user_id = v_user_id
      AND provider = 'email';
  END IF;

  UPDATE public.usuarios_app
  SET
    email = v_email_limpo,
    updated_at = NOW()
  WHERE id = v_app_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail atualizado com sucesso.',
    'email', v_email_limpo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO authenticated, anon;
