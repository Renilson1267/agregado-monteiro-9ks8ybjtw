-- Migration: drop RPC functions that generate malformed types
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(text, text);
DROP FUNCTION IF EXISTS public.confirmar_email_auth_usuario(text);
DROP FUNCTION IF EXISTS public.proximo_numero_os(text);
