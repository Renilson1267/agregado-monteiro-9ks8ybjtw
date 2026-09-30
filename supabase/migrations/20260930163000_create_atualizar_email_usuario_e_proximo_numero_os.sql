-- Migration: create_atualizar_email_usuario_e_proximo_numero_os
-- Descrição: Recria com segurança a RPC atualizar_email_usuario e proximo_numero_os.
-- A atualizar_email_usuario aceita parâmetros escalares (text) p_usuario_app_id e p_novo_email,
-- valida formato, checa unicidade tanto em usuarios_app quanto em auth.users, e atualiza de forma
-- transacional usuarios_app, auth.users e auth.identities com SECURITY DEFINER.

-- 1. Dropar eventuais versões anteriores
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(uuid, text);
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(text, text);
DROP FUNCTION IF EXISTS public.proximo_numero_os(uuid);
DROP FUNCTION IF EXISTS public.proximo_numero_os(text);

-- 2. Criar função proximo_numero_os com assinatura p_empresa_id text
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

-- 3. Criar função atualizar_email_usuario
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
  -- Normalização de entrada
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
  END;

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
  WHERE id = v_app_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado na tabela de usuários do sistema.'
    );
  END IF;

  -- Se for o mesmo e-mail, encerra com sucesso
  IF lower(trim(v_usuario.email)) = v_email_limpo THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'E-mail inalterado.',
      'email', v_email_limpo
    );
  END IF;

  -- 1. Checar se o e-mail já está em uso por outro usuário em public.usuarios_app
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

  -- 2. Checar se já está em uso por outro usuário em auth.users
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

    -- Atualizar auth.identities correspondente (se existir identidade para o usuário)
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
  WHERE id = v_app_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail atualizado com sucesso.',
    'email', v_email_limpo
  );
END;
$$;

-- 4. Permissões de execução para authenticated e anon
GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO authenticated, anon;
