-- Migration: restaurar as 3 funções RPC críticas do projeto
-- 1. confirmar_email_auth_usuario(p_usuario_id uuid) -> boolean (com overload p_user_id text -> jsonb para compatibilidade com chamadas legadas)
-- 2. atualizar_email_usuario(p_usuario_id uuid, p_novo_email text) -> jsonb (com overload p_usuario_app_id text, p_novo_email text -> jsonb)
-- 3. proximo_numero_os(p_empresa_id uuid) -> integer (com overload p_empresa_id text -> integer)

-- 1. confirmar_email_auth_usuario
CREATE OR REPLACE FUNCTION public.confirmar_email_auth_usuario(
  p_usuario_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_user record;
BEGIN
  IF p_usuario_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = p_usuario_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW()),
      confirmation_token = '',
      updated_at = NOW()
  WHERE id = p_usuario_id;

  UPDATE auth.identities
  SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb),
      updated_at = NOW()
  WHERE user_id = p_usuario_id AND provider = 'email';

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(uuid) TO authenticated, anon, service_role;

-- Overload aceitando text (chamada legada da concreteira.ts passando p_user_id)
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

GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(text) TO authenticated, anon, service_role;


-- 2. atualizar_email_usuario
CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(
  p_usuario_id uuid,
  p_novo_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_user_app record;
  v_auth_user_id uuid;
  v_email_limpo text;
BEGIN
  IF p_usuario_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não informado.');
  END IF;

  v_email_limpo := lower(trim(p_novo_email));
  IF v_email_limpo IS NULL OR v_email_limpo = '' OR v_email_limpo !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'E-mail informado é inválido.');
  END IF;

  -- Localiza em usuarios_app
  SELECT * INTO v_user_app FROM public.usuarios_app WHERE id = p_usuario_id;
  IF FOUND THEN
    v_auth_user_id := v_user_app.user_id;
  ELSE
    -- Tenta ver se o ID já é o próprio id de auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_usuario_id) THEN
      v_auth_user_id := p_usuario_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado.');
    END IF;
  END IF;

  -- Se tem vínculo com auth.users, atualiza lá
  IF v_auth_user_id IS NOT NULL THEN
    -- Verifica se outro usuário já possui este email
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email_limpo AND id <> v_auth_user_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está sendo utilizado por outro usuário.');
    END IF;

    UPDATE auth.users
    SET email = v_email_limpo,
        updated_at = NOW(),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_auth_user_id;

    UPDATE auth.identities
    SET email = v_email_limpo,
        identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email_limpo)),
        updated_at = NOW()
    WHERE user_id = v_auth_user_id;
  END IF;

  -- Atualiza em usuarios_app se o registro existir
  IF v_user_app.id IS NOT NULL THEN
    UPDATE public.usuarios_app
    SET email = v_email_limpo,
        updated_at = NOW()
    WHERE id = v_user_app.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail atualizado com sucesso.',
    'email', v_email_limpo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(uuid, text) TO authenticated, anon, service_role;

-- Overload com p_usuario_app_id text para compatibilidade com chamadas existentes do front
CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(
  p_usuario_app_id text,
  p_novo_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_uuid uuid;
BEGIN
  IF p_usuario_app_id IS NULL OR trim(p_usuario_app_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não informado.');
  END IF;

  BEGIN
    v_uuid := p_usuario_app_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não é um UUID válido.');
  END;

  RETURN public.atualizar_email_usuario(v_uuid, p_novo_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO authenticated, anon, service_role;


-- 3. proximo_numero_os
CREATE OR REPLACE FUNCTION public.proximo_numero_os(
  p_empresa_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prox integer;
BEGIN
  IF p_empresa_id IS NULL THEN
    SELECT COALESCE(MAX(numero_os), 4336) + 1
    INTO v_prox
    FROM public.ordens_servico;
    RETURN v_prox;
  END IF;

  SELECT COALESCE(MAX(numero_os), 4336) + 1
  INTO v_prox
  FROM public.ordens_servico
  WHERE empresa_id = p_empresa_id;

  RETURN v_prox;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(uuid) TO authenticated, anon, service_role;

-- Overload com text
CREATE OR REPLACE FUNCTION public.proximo_numero_os(
  p_empresa_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_emp_uuid uuid;
BEGIN
  IF p_empresa_id IS NULL OR trim(p_empresa_id) = '' THEN
    RETURN public.proximo_numero_os(NULL::uuid);
  END IF;

  BEGIN
    v_emp_uuid := p_empresa_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN public.proximo_numero_os(NULL::uuid);
  END;

  RETURN public.proximo_numero_os(v_emp_uuid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO authenticated, anon, service_role;
