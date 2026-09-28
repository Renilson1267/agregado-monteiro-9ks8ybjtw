-- Drop functions so generated types file doesn't generate malformed single-line types for them
DROP FUNCTION IF EXISTS public.atualizar_email_usuario(UUID, TEXT);
DROP FUNCTION IF EXISTS public.proximo_numero_os(UUID);
