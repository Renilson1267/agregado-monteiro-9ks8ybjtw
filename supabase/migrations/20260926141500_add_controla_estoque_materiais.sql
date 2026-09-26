-- Adiciona flag controla_estoque em materiais
ALTER TABLE public.materiais
ADD COLUMN IF NOT EXISTS controla_estoque BOOLEAN NOT NULL DEFAULT false;

-- Atualizar materiais existentes: true apenas para cimento e aditivo, false para os demais
UPDATE public.materiais
SET controla_estoque = true
WHERE codigo IN ('cimento', 'aditivo');

UPDATE public.materiais
SET controla_estoque = false
WHERE codigo NOT IN ('cimento', 'aditivo');

-- Garantir que a Monteiro também tenha preços padrão de materiais cadastrados caso precise calcular custos
INSERT INTO public.precos_material (empresa_id, material_codigo, mes_ano, preco_unitario, unidade)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'cimento', '09/2026', 0.74, 'kg'),
  ('11111111-1111-1111-1111-111111111111', 'aditivo', '09/2026', 4.0, 'litros'),
  ('11111111-1111-1111-1111-111111111111', 'areia', '09/2026', 0.04, 'kg'),
  ('11111111-1111-1111-1111-111111111111', 'brita12', '09/2026', 0.115942, 'kg'),
  ('11111111-1111-1111-1111-111111111111', 'brita19', '09/2026', 0.111111, 'kg'),
  ('11111111-1111-1111-1111-111111111111', 'po_pedra', '09/2026', 0.0, 'kg')
ON CONFLICT (empresa_id, material_codigo, mes_ano) DO NOTHING;
