-- Migration: allow_admin_multicompany
-- Descrição: Permite que administradores operem todas as empresas (Monteiro e SJE)
-- sem estarem amarrados a uma empresa fixa, e atualiza o administrador padrão para multicompany.

-- 1. Se o administrador padrão gcmixsje@gmail.com estiver amarrado a uma empresa específica, definir empresa_id como NULL (multicompany)
UPDATE public.usuarios_app
SET empresa_id = NULL,
    updated_at = NOW()
WHERE perfil = 'administrador'
  AND lower(trim(email)) = 'gcmixsje@gmail.com';

-- 2. Garantir que administradores já existentes possam alternar livremente (caso queiram ficar multicompany)
-- O campo empresa_id em usuarios_app já é nullable.
