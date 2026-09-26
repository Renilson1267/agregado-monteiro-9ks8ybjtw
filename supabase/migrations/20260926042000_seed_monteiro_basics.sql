-- Migration: Materiais operacionais básicos da Unidade Monteiro (para quando o usuário alternar para Monteiro)
DO $$
DECLARE
  v_empresa_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
  -- Materiais Monteiro
  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'brita12', 'Brita 12', 'kg', 10000, 1),
    (gen_random_uuid(), v_empresa_id, 'brita19', 'Brita 19', 'kg', 10000, 2),
    (gen_random_uuid(), v_empresa_id, 'areia', 'Areia Média/Lavada', 'kg', 15000, 3),
    (gen_random_uuid(), v_empresa_id, 'po_pedra', 'Pó de Brita / Pedra', 'kg', 5000, 4),
    (gen_random_uuid(), v_empresa_id, 'cimento', 'Cimento CP-II / CP-IV', 'kg', 10000, 5),
    (gen_random_uuid(), v_empresa_id, 'aditivo', 'Aditivo Plastificante', 'litros', 500, 6)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- Traços Monteiro
  INSERT INTO public.tracos (empresa_id, nome, descricao, fck_mpa, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, ativo) VALUES
    (v_empresa_id, 'FCK 20 MPa - Monteiro', 'Uso geral em pisos e calçadas', 20, 480, 480, 845, 0, 280, 2.4, true),
    (v_empresa_id, 'FCK 25 MPa - Padrão Monteiro', 'Lajes, pilares e vigas', 25, 480, 480, 845, 0, 300, 2.7, true),
    (v_empresa_id, 'FCK 30 MPa - Estrutural Monteiro', 'Concreto de alta resistência estrutural', 30, 480, 480, 845, 0, 330, 3.2, true)
  ON CONFLICT (empresa_id, nome) DO NOTHING;
END $$;
