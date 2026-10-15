-- Migration: Adicionar controle de soft-delete para cancelamento de cargas
-- Mantém integridade da sequência de numeração e rastreamento de estorno
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS cancelada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS cancelada_em TIMESTAMPTZ;
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- Índice para consultas filtradas por status de cancelamento
CREATE INDEX IF NOT EXISTS idx_cargas_cancelada ON public.cargas(empresa_id, cancelada);
