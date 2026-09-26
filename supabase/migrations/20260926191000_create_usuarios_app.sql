-- Migration: create_usuarios_app_and_seed_admin
-- Descrição: Criação da tabela public.usuarios_app vinculada a auth.users, perfil, empresa_id e seed do primeiro administrador

CREATE TABLE IF NOT EXISTS public.usuarios_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('administrador', 'balanceiro')),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_app_email ON public.usuarios_app (lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_app_user_id ON public.usuarios_app (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_app_empresa ON public.usuarios_app (empresa_id);

-- RLS
ALTER TABLE public.usuarios_app ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_usuarios_app" ON public.usuarios_app;
CREATE POLICY "anon_all_usuarios_app" ON public.usuarios_app
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Seed do primeiro usuário administrador padrão (gcmixsje@gmail.com com Skip@Pass123)
-- Obedecendo regras do GoTrue: strings de token/change como '' (nunca NULL) e phone como NULL.
DO $$
DECLARE
  v_admin_user_id UUID;
  v_empresa_id UUID;
BEGIN
  -- Buscar uma empresa inicial (Monteiro ou SJE)
  SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;

  -- Criar o auth.user se não existir
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'gcmixsje@gmail.com') THEN
    v_admin_user_id := gen_random_uuid();
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
      v_admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'gcmixsje@gmail.com',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Administrador Geral"}',
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

    -- Criar registro na tabela usuarios_app
    INSERT INTO public.usuarios_app (
      user_id,
      nome,
      email,
      perfil,
      empresa_id,
      ativo
    ) VALUES (
      v_admin_user_id,
      'Administrador Geral',
      'gcmixsje@gmail.com',
      'administrador',
      v_empresa_id,
      true
    ) ON CONFLICT (lower(trim(email))) DO NOTHING;
  ELSE
    -- Se o auth.user já existir mas não estiver em usuarios_app
    SELECT id INTO v_admin_user_id FROM auth.users WHERE lower(email) = 'gcmixsje@gmail.com' LIMIT 1;
    INSERT INTO public.usuarios_app (
      user_id,
      nome,
      email,
      perfil,
      empresa_id,
      ativo
    ) VALUES (
      v_admin_user_id,
      'Administrador Geral',
      'gcmixsje@gmail.com',
      'administrador',
      v_empresa_id,
      true
    ) ON CONFLICT (lower(trim(email))) DO NOTHING;
  END IF;
END $$;
