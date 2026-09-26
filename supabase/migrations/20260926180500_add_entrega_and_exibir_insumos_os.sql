-- Migration: add_exibir_insumos_os_and_entrega_fields
-- Adiciona opções de exibição de insumos no relatório impresso da OS
-- e dados complementares de entrega (nome da obra, local de descarga, tolerância de slump, etc.)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS exibir_insumos_os BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS nome_obra TEXT,
  ADD COLUMN IF NOT EXISTS local_descarga TEXT,
  ADD COLUMN IF NOT EXISTS slump_tolerancia TEXT DEFAULT '+-2',
  ADD COLUMN IF NOT EXISTS exibir_insumos_os BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS insumos_detalhados JSONB DEFAULT '[]'::jsonb;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_ordens_servico_carga_id ON public.ordens_servico(carga_id);
