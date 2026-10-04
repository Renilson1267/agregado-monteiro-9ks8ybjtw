-- Migration para adicionar colunas preco_unitario e valor_total na tabela movimentacoes_estoque
-- Usado nas ENTRADAS de insumos controlados (preço varia por entrega/fornecedor)

ALTER TABLE public.movimentacoes_estoque
  ADD COLUMN IF NOT EXISTS preco_unitario numeric,
  ADD COLUMN IF NOT EXISTS valor_total numeric;

COMMENT ON COLUMN public.movimentacoes_estoque.preco_unitario IS 'Preço unitário em R$ informado na entrada de insumo';
COMMENT ON COLUMN public.movimentacoes_estoque.valor_total IS 'Valor total da entrada em R$ (quantidade * preco_unitario)';
