-- Migration: create_atualizar_email_usuario_rpc
-- Descrição: Permite ao Administrador corrigir o e-mail de um usuário existente, atualizando
-- auth.users (email, email_change, tokens limpos), auth.identities e public.usuarios_app de forma consistente.

CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(
  p_usuario_app_id UUID,
  p_novo_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_usuario RECORD;
  v_email_limpo TEXT;
  v_conflito_app UUID;
  v_conflito_auth UUID;
BEGIN
  v_email_limpo := lower(trim(p_novo_email));

  -- Validação de entrada
  IF v_email_limpo IS NULL OR v_email_limpo = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'O e-mail não pode ficar em branco.'
    );
  END IF;

  -- Validação de formato básico de e-mail
  IF v_email_limpo !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Formato de e-mail inválido.'
    );
  END IF;

  -- Buscar registro do usuário na usuarios_app
  SELECT * INTO v_usuario
  FROM public.usuarios_app
  WHERE id = p_usuario_app_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado.'
    );
  END IF;

  -- Se for o mesmo e-mail, não precisa alterar
  IF lower(trim(v_usuario.email)) = v_email_limpo THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'E-mail inalterado.',
      'email', v_email_limpo
    );
  END IF;

  -- 1. Checar se já está em uso por OUTRO usuário em public.usuarios_app
  SELECT id INTO v_conflito_app
  FROM public.usuarios_app
  WHERE lower(trim(email)) = v_email_limpo
    AND id <> p_usuario_app_id
  LIMIT 1;

  IF v_conflito_app IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este e-mail já está em uso por outro usuário no sistema.'
    );
  END IF;

  -- 2. Checar se já está em uso por OUTRO usuário em auth.users
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

  -- 3. Atualizar no auth.users se existir vínculo
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

    -- Atualizar auth.identities correspondente
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

  -- 4. Atualizar registro em public.usuarios_app
  UPDATE public.usuarios_app
  SET
    email = v_email_limpo,
    updated_at = NOW()
  WHERE id = p_usuario_app_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail atualizado com sucesso.',
    'email', v_email_limpo
  );
END;
$$;

-- Permitir chamada da função pelos usuários autenticados e anon
GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(UUID, TEXT) TO authenticated, anon;
