-- Migration: redefinir_senha_marinaldo_sje
-- Descrição: Redefine a senha do usuário gcmixsjebalanca@gmail.com (Marinaldo / Balanceiro / SJE)
-- para 'Skip@Pass123', garantindo que o usuário esteja ativo, confirmado e com os tokens GoTrue no formato correto.
-- Se o usuário não constar previamente em auth.users ou public.usuarios_app, garante a criação mantendo exatamente
-- o perfil 'balanceiro' e a empresa SJE, sem alterar nenhum outro usuário ou dados de cargas/estoque.

DO $$
DECLARE
  v_user_id UUID;
  v_empresa_sje_id UUID;
  v_target_email TEXT := 'gcmixsjebalanca@gmail.com';
  v_nova_senha TEXT := 'Skip@Pass123';
  v_user_app_id UUID;
BEGIN
  -- 1. Obter o ID da empresa SJE
  SELECT id INTO v_empresa_sje_id
  FROM public.empresas
  WHERE lower(slug) = 'sje' OR lower(nome) = 'sje'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback de empresa caso não encontre pelo slug: pega o UUID padrão de migração da SJE ou primeiro registro
  IF v_empresa_sje_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.empresas WHERE id = '22222222-2222-2222-2222-222222222222'::uuid) THEN
      v_empresa_sje_id := '22222222-2222-2222-2222-222222222222'::uuid;
    ELSE
      SELECT id INTO v_empresa_sje_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;
    END IF;
  END IF;

  -- 2. Localizar se o usuário já existe em auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_target_email)
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Atualizar a senha e garantir email_confirmed_at e integridade GoTrue
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(v_nova_senha, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, '')
    WHERE id = v_user_id;

    RAISE NOTICE 'Senha do usuario auth.users % atualizada com sucesso.', v_target_email;
  ELSE
    -- Caso o usuário não existisse ainda no auth.users (ex: criado via interface interna pendente),
    -- cria com a senha Skip@Pass123 e tokens GoTrue válidos
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
      v_target_email,
      extensions.crypt(v_nova_senha, extensions.gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Marinaldo"}',
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

    RAISE NOTICE 'Usuario auth.users % criado com a senha nova solicitada.', v_target_email;
  END IF;

  -- 3. Verificar e sincronizar em public.usuarios_app
  -- Garantir que o perfil permaneça 'balanceiro', nome 'Marinaldo' e empresa SJE
  SELECT id INTO v_user_app_id
  FROM public.usuarios_app
  WHERE lower(trim(email)) = lower(v_target_email)
  LIMIT 1;

  IF v_user_app_id IS NOT NULL THEN
    -- Atualizar vínculo do user_id se estivesse nulo ou diferente, e garantir ativo = true
    -- Mantendo perfil e empresa_id intactos (ou preenchendo empresa SJE se estivesse nula)
    UPDATE public.usuarios_app
    SET
      user_id = COALESCE(user_id, v_user_id),
      ativo = true,
      empresa_id = COALESCE(empresa_id, v_empresa_sje_id),
      updated_at = NOW()
    WHERE id = v_user_app_id;

    RAISE NOTICE 'Registro em public.usuarios_app para % atualizado com vinculo ao auth.', v_target_email;
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
      'Marinaldo',
      v_target_email,
      'balanceiro',
      v_empresa_sje_id,
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (lower(trim(email))) DO UPDATE
    SET
      user_id = EXCLUDED.user_id,
      ativo = true,
      updated_at = NOW();

    RAISE NOTICE 'Registro de Marinaldo criado em public.usuarios_app vinculado a SJE: %', v_target_email;
  END IF;

END $$;
