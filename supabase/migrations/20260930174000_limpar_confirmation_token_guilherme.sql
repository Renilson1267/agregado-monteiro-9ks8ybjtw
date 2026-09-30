-- Migration: 20260930174000_limpar_confirmation_token_guilherme.sql
-- Descrição: Limpa confirmation_token e tokens associados especificamente para o usuário
-- gcmixmonteiroadm@gmail.com (Guilherme), mantendo encrypted_password, perfis e demais dados intactos.
-- Permite que o GoTrue reconheça a conta como plenamente confirmada e ativa para login com senha.

DO $$
DECLARE
  v_rows_affected INT := 0;
BEGIN
  UPDATE auth.users
  SET
    confirmation_token = '',
    confirmation_sent_at = NULL,
    recovery_token = '',
    reauthentication_token = '',
    email_change_token_new = '',
    email_change_token_current = '',
    email_change = '',
    phone_change = '',
    phone_change_token = '',
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE lower(trim(email)) = 'gcmixmonteiroadm@gmail.com';

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  RAISE NOTICE 'Tokens limpos com sucesso para % usuário(s) em auth.users.', v_rows_affected;

  -- Garante também no auth.identities que o email está marcado como verificado
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb
    ),
    updated_at = NOW()
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE lower(trim(email)) = 'gcmixmonteiroadm@gmail.com'
  ) AND provider = 'email';

END $$;
