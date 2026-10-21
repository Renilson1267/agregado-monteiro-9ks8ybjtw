-- Migration: Adicionar perfil 'auxiliar_adm' e cadastrar Patricia Lima
-- 1. Alterar CHECK usuarios_app_perfil_check para incluir 'auxiliar_adm'
-- 2. Cadastrar usuária Patricia Lima (gcmixsjeadm@gmail.com) vinculada à unidade SJE
-- 3. Garantir as 3 RPCs essenciais: confirmar_email_auth_usuario, atualizar_email_usuario, proximo_numero_os

-- (1) Alterar a constraint usuarios_app_perfil_check
ALTER TABLE public.usuarios_app
  DROP CONSTRAINT IF EXISTS usuarios_app_perfil_check;

ALTER TABLE public.usuarios_app
  ADD CONSTRAINT usuarios_app_perfil_check
  CHECK (perfil = ANY (ARRAY['administrador'::text, 'balanceiro'::text, 'gestor'::text, 'auxiliar_adm'::text]));

COMMENT ON COLUMN public.usuarios_app.perfil IS 'Perfil de acesso do usuário: administrador, balanceiro, gestor ou auxiliar_adm';

-- (2) Criar usuário auth.users e linha em public.usuarios_app para Patricia Lima
DO $$
DECLARE
  v_user_id UUID;
  v_empresa_sje_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_email TEXT := 'gcmixsjeadm@gmail.com';
  v_senha TEXT := 'Skip@Pass123';
  v_nome TEXT := 'Patricia Lima';
  v_user_app_id UUID;
BEGIN
  -- Verificar se empresa SJE existe, senão buscar pelo slug
  IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = v_empresa_sje_id) THEN
    SELECT id INTO v_empresa_sje_id FROM public.empresas WHERE lower(slug) = 'sje' LIMIT 1;
  END IF;

  -- Localizar ou criar em auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(v_senha, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone = NULL,
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, '')
    WHERE id = v_user_id;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone,
      phone_change,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      extensions.crypt(v_senha, extensions.gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('name', v_nome),
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      '',
      NULL,
      '',
      '',
      ''
    );
  END IF;

  -- Atualizar ou inserir em auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.identities
    SET
      identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb),
      updated_at = NOW()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  -- Inserir ou atualizar na public.usuarios_app
  SELECT id INTO v_user_app_id
  FROM public.usuarios_app
  WHERE lower(trim(email)) = lower(trim(v_email))
  LIMIT 1;

  IF v_user_app_id IS NOT NULL THEN
    UPDATE public.usuarios_app
    SET
      user_id = v_user_id,
      nome = v_nome,
      perfil = 'auxiliar_adm',
      empresa_id = v_empresa_sje_id,
      ativo = true,
      updated_at = NOW()
    WHERE id = v_user_app_id;
  ELSE
    INSERT INTO public.usuarios_app (
      user_id,
      nome,
      email,
      perfil,
      empresa_id,
      ativo,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_nome,
      v_email,
      'auxiliar_adm',
      v_empresa_sje_id,
      true,
      NOW(),
      NOW()
    );
  END IF;

END $$;

-- (3) Garantir as 3 RPCs essenciais caso tenham sofrido alteração
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

  SELECT * INTO v_user_app FROM public.usuarios_app WHERE id = p_usuario_id;
  IF FOUND THEN
    v_auth_user_id := v_user_app.user_id;
  ELSE
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_usuario_id) THEN
      v_auth_user_id := p_usuario_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado.');
    END IF;
  END IF;

  IF v_auth_user_id IS NOT NULL THEN
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
