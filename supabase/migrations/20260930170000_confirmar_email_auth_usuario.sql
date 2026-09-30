-- Migration: 20260930170000_confirmar_email_auth_usuario.sql
-- Descrição: Cria a função RPC confirmar_email_auth_usuario que atualiza auth.users e auth.identities
-- de forma segura via SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.confirmar_email_auth_usuario(
  p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uuid uuid;
  v_email text;
BEGIN
  IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não fornecido.');
  END IF;

  BEGIN
    v_uuid := p_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID inválido (não é UUID).');
  END;

  -- Checar existência do usuário
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado em auth.users.');
  END IF;

  -- Atualizar auth.users
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW(),
    confirmation_token = COALESCE(confirmation_token, '')
  WHERE id = v_uuid;

  -- Atualizar auth.identities
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb
    ),
    updated_at = NOW()
  WHERE user_id = v_uuid
    AND provider = 'email';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail confirmado com sucesso.',
    'user_id', p_user_id,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(text) TO authenticated, anon;
