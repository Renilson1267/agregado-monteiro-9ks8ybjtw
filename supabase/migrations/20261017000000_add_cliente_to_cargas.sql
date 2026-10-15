-- Migration: Adicionar cliente_id e cliente_nome na tabela cargas
-- Permite associar cliente (FK opcional para tabela clientes) ou informar nome livre de cliente na carga

ALTER TABLE public.cargas
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT;

-- Índice para consultas por cliente_id
CREATE INDEX IF NOT EXISTS idx_cargas_cliente_id ON public.cargas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cargas_cliente_nome ON public.cargas(cliente_nome);
