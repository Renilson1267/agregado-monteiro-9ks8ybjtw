CREATE OR REPLACE FUNCTION public.confirmar_email_auth_usuario(
  p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_user_uuid uuid;
  v_user record;
BEGIN
  IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não informado.');
  END IF;

  BEGIN
    v_user_uuid := p_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não é um UUID válido.');
  END;

  SELECT * INTO v_user FROM auth.users WHERE id = v_user_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado em auth.users.');
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW()),
      confirmation_token = '',
      updated_at = NOW()
  WHERE id = v_user_uuid;

  UPDATE auth.identities
  SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb),
      updated_at = NOW()
  WHERE user_id = v_user_uuid AND provider = 'email';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail confirmado com sucesso.',
    'user_id', p_user_id,
    'email', v_user.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(text) TO authenticated, anon;

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

  IF p_usuario_app_id IS NULL OR trim(p_usuario_app_id) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Identificador do usuário inválido.'
    );
  END IF;

  BEGIN
    v_app_uuid := p_usuario_app_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ID do usuário não é um UUID válido.'
    );
  END IF;

  IF v_email_limpo IS NULL OR v_email_limpo = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'O e-mail não pode ficar em branco.'
    );
  END IF;

  SELECT * INTO v_usuario
  FROM public.usuarios_app
  WHERE id = v_app_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado na tabela de usuários do sistema.'
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
      'error', 'Este e-mail já está em uso por outro operador no sistema.'
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

GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO authenticated, anon;
