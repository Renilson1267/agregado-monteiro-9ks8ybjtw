-- Drop all overloaded variants of the RPC functions
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(uuid, text);
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(text, text);
DROP FUNCTION IF EXISTS public.proximo_numero_os(uuid);
DROP FUNCTION IF EXISTS public.proximo_numero_os(text);
