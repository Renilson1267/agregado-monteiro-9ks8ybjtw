-- Migration: 20260930173000_definir_senha_guilherme_marinaldo.sql
-- Descrição: Define a senha de autenticação para 'Gcmix@2025' para os usuários:
-- 1) Guilherme Alves Cordeiro do Amaral (gcmixmonteiroadm@gmail.com) - Balanceiro / Monteiro
-- 2) José Marinaldo Pereira de Araújo (gcmixsjebalanca@gmail.com) - Balanceiro / SJE
-- Mantém intactos perfis, empresas, metadados e todos os demais dados do sistema.

DO $$
DECLARE
  v_nova_senha TEXT := 'Gcmix@2025';
  v_rows_affected INT := 0;
BEGIN
  -- Atualiza auth.users garantindo o hash bcrypt correto com pgcrypto (crypt + gen_salt('bf'))
  -- e conformidade com requisitos GoTrue (tokens como string vazia se nulos, email confirmado)
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
  WHERE lower(trim(email)) IN (
    'gcmixmonteiroadm@gmail.com',
    'gcmixsjebalanca@gmail.com'
  );

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  RAISE NOTICE 'Senha definida com sucesso para % usuário(s) em auth.users.', v_rows_affected;

  -- Atualiza auth.identities para marcar email_verified = true caso ainda estivesse pendente
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb
    ),
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE lower(trim(email)) IN (
      'gcmixmonteiroadm@gmail.com',
      'gcmixsjebalanca@gmail.com'
    )
  ) AND provider = 'email';

END $$;
