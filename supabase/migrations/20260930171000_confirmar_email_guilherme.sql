-- Migration de confirmação e sincronização do usuário Guilherme Alves (Monteiro)
DO $$
DECLARE
  v_target_uuid uuid := '926e6fe4-d0a3-4dcb-8bde-ec5224bd290b'::uuid;
BEGIN
  -- 1. Confirmar no auth.users
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW(),
    confirmation_token = COALESCE(confirmation_token, '')
  WHERE id = v_target_uuid;

  -- 2. Atualizar no auth.identities
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb
    ),
    updated_at = NOW()
  WHERE user_id = v_target_uuid;
END $$;
