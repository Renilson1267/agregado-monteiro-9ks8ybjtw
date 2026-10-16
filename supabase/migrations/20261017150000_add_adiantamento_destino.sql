-- Migration aditiva: Adicionar adiantamento_destino em folha_pagamento_linhas
-- Valores possíveis: 'quinzena', 'producao', 'mensal' (padrão 'producao' para manter retrocompatibilidade)

ALTER TABLE public.folha_pagamento_linhas
  ADD COLUMN IF NOT EXISTS adiantamento_destino TEXT NOT NULL DEFAULT 'producao';

-- Atualiza registros existentes que possuem adiantamento > 0 mas sem destino definido (para garantir 'producao')
UPDATE public.folha_pagamento_linhas
  SET adiantamento_destino = 'producao'
  WHERE adiantamento_destino IS NULL OR adiantamento_destino = '';

-- Atualiza tipo em folha_adiantamentos caso esteja nulo ou vazio
UPDATE public.folha_adiantamentos
  SET tipo = 'producao'
  WHERE tipo IS NULL OR tipo = '' OR tipo = 'Funcionario';
