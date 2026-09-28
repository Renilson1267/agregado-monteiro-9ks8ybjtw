-- Migration: Adicionar suporte para quinzena_2 na folha de pagamento
ALTER TABLE public.folha_pagamento_linhas
ADD COLUMN IF NOT EXISTS quinzena_2 NUMERIC(12,2) NOT NULL DEFAULT 0;
