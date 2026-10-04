-- Migration: restaurar assinaturas com tipos gerados
CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(p_usuario_app_id text, p_novo_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.usuarios_app
  WHERE id = p_usuario_app_id::uuid;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  UPDATE auth.users
  SET email = p_novo_email,
      updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE public.usuarios_app
  SET email = p_novo_email,
      updated_at = NOW()
  WHERE id = p_usuario_app_id::uuid;

  RETURN jsonb_build_object('success', true);
END;
$$;
