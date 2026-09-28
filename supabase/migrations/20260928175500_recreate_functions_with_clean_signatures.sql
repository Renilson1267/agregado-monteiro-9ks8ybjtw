-- Redefinir funcoes com tipos escalares e argumentos compativeis
CREATE OR REPLACE FUNCTION public.proximo_numero_os(
  p_empresa_id text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_prox integer;
BEGIN
  SELECT COALESCE(MAX(numero_os), 0) + 1
  INTO v_prox
  FROM public.ordens_servico
  WHERE empresa_id = p_empresa_id::uuid;

  RETURN v_prox;
END;
$$;

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
  v_usuario record;
  v_email_limpo text;
  v_conflito_app uuid;
  v_conflito_auth uuid;
  v_app_uuid uuid;
BEGIN
  v_email_limpo := lower(trim(p_novo_email));
  v_app_uuid := p_usuario_app_id::uuid;

  IF v_email_limpo IS NULL OR v_email_limpo = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'O e-mail não pode ficar em branco.'
    );
  END IF;

  IF v_email_limpo !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Formato de e-mail inválido.'
    );
  END IF;

  SELECT * INTO v_usuario
  FROM public.usuarios_app
  WHERE id = v_app_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado.'
    );
  END IF;

  IF lower(trim(v_usuario.email)) = v_email_limpo THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'E-mail inalterado.',
      'email', v_email_limpo
    );
  END IF;

  SELECT id INTO v_conflito_app
  FROM public.usuarios_app
  WHERE lower(trim(email)) = v_email_limpo
    AND id <> v_app_uuid
  LIMIT 1;

  IF v_conflito_app IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este e-mail já está em uso por outro usuário no sistema.'
    );
  END IF;

  IF v_usuario.user_id IS NOT NULL THEN
    SELECT id INTO v_conflito_auth
    FROM auth.users
    WHERE lower(trim(email)) = v_email_limpo
      AND id <> v_usuario.user_id
    LIMIT 1;
  ELSE
    SELECT id INTO v_conflito_auth
    FROM auth.users
    WHERE lower(trim(email)) = v_email_limpo
    LIMIT 1;
  END IF;

  IF v_conflito_auth IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este e-mail já está cadastrado na autenticação do sistema.'
    );
  END IF;

  IF v_usuario.user_id IS NOT NULL THEN
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
    WHERE id = v_usuario.user_id;

    UPDATE auth.identities
    SET
      email = v_email_limpo,
      identity_data = jsonb_set(
        COALESCE(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(v_email_limpo)
      ),
      updated_at = NOW()
    WHERE user_id = v_usuario.user_id
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

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO authenticated, anon;
