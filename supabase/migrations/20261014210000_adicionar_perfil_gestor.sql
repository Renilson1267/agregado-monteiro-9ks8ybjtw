-- Migration: Adicionar 'gestor' ao domínio/CHECK da coluna perfil na tabela usuarios_app
-- Preservando as 3 RPCs essenciais: confirmar_email_auth_usuario, atualizar_email_usuario, proximo_numero_os

ALTER TABLE public.usuarios_app
  DROP CONSTRAINT IF EXISTS usuarios_app_perfil_check;

ALTER TABLE public.usuarios_app
  ADD CONSTRAINT usuarios_app_perfil_check
  CHECK (perfil = ANY (ARRAY['administrador'::text, 'balanceiro'::text, 'gestor'::text]));

COMMENT ON COLUMN public.usuarios_app.perfil IS 'Perfil de acesso do usuário: administrador (acesso total), balanceiro (restrito à expedição) ou gestor (painel gerencial, relatórios, expedição e estoque restrito à sua unidade)';
