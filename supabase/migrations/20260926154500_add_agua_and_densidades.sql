-- Migração: Adicionar consumo_agua na tabela cargas e tracos
-- Adicionar densidade, unidade_compra e preco_compra na tabela materiais
-- Cadastrar insumo 'agua' e aplicar densidades padrão nos agregados

-- 1. Coluna consumo_agua na tabela cargas
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS consumo_agua numeric DEFAULT 0;

-- 2. Coluna consumo_agua na tabela tracos
ALTER TABLE public.tracos ADD COLUMN IF NOT EXISTS consumo_agua numeric DEFAULT 0;

-- 3. Colunas na tabela materiais
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS densidade numeric DEFAULT 1.0;
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS unidade_compra text DEFAULT 'kg';
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS preco_compra numeric DEFAULT 0;

-- 4. Atualizar densidades e unidades de compra padrão para materiais existentes
-- Brita 12 = 1.38 t/m³, compra em m³
UPDATE public.materiais
SET densidade = 1.38,
    unidade_compra = 'm3',
    preco_compra = CASE WHEN preco_compra = 0 OR preco_compra IS NULL THEN 160.00 ELSE preco_compra END
WHERE codigo = 'brita12';

-- Brita 19 = 1.44 t/m³, compra em m³
UPDATE public.materiais
SET densidade = 1.44,
    unidade_compra = 'm3',
    preco_compra = CASE WHEN preco_compra = 0 OR preco_compra IS NULL THEN 160.00 ELSE preco_compra END
WHERE codigo = 'brita19';

-- Areia = 1.50 t/m³, compra em m³
UPDATE public.materiais
SET densidade = 1.50,
    unidade_compra = 'm3',
    preco_compra = CASE WHEN preco_compra = 0 OR preco_compra IS NULL THEN 60.00 ELSE preco_compra END
WHERE codigo = 'areia';

-- Pó de pedra = 1.40 t/m³, compra em kg
UPDATE public.materiais
SET densidade = 1.40,
    unidade_compra = 'kg',
    preco_compra = CASE WHEN preco_compra IS NULL THEN 0 ELSE preco_compra END
WHERE codigo = 'po_pedra';

-- Cimento = 1.0 t/m³, compra em kg
UPDATE public.materiais
SET densidade = 1.0,
    unidade_compra = 'kg',
    preco_compra = CASE WHEN preco_compra = 0 OR preco_compra IS NULL THEN 0.74 ELSE preco_compra END
WHERE codigo = 'cimento';

-- Aditivo = 1.0, compra em litros
UPDATE public.materiais
SET densidade = 1.0,
    unidade_compra = 'litros',
    preco_compra = CASE WHEN preco_compra = 0 OR preco_compra IS NULL THEN 4.00 ELSE preco_compra END
WHERE codigo = 'aditivo';

-- 5. Inserir material Água para cada empresa se não existir
DO $$
DECLARE
  v_emp RECORD;
BEGIN
  FOR v_emp IN SELECT id FROM public.empresas LOOP
    IF NOT EXISTS (SELECT 1 FROM public.materiais WHERE empresa_id = v_emp.id AND codigo = 'agua') THEN
      INSERT INTO public.materiais (empresa_id, codigo, nome, unidade, estoque_minimo, ordem, controla_estoque, densidade, unidade_compra, preco_compra)
      VALUES (v_emp.id, 'agua', 'Água', 'litros', 0, 7, false, 1.0, 'm3', 0.0);
    END IF;

    -- Preço padrão da água (0.00) se não existir
    IF NOT EXISTS (SELECT 1 FROM public.precos_material WHERE empresa_id = v_emp.id AND material_codigo = 'agua') THEN
      INSERT INTO public.precos_material (empresa_id, material_codigo, mes_ano, preco_unitario, unidade)
      VALUES (v_emp.id, 'agua', '09/2026', 0.0, 'litros')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
