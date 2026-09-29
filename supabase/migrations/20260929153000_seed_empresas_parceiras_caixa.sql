-- ============================================================================
-- MIGRATION: Cadastrar Empresas Parceiras do Caixa (COSAMPA, AURÉLIO, CONCRETISA)
-- e categorias padrão para cada unidade
-- ============================================================================

DO $$
DECLARE
  v_cosampa_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
  v_aurelio_id UUID := '44444444-4444-4444-4444-444444444444'::UUID;
  v_concretisa_id UUID := '55555555-5555-5555-5555-555555555555'::UUID;
  r_emp RECORD;
BEGIN
  -- 1. Inserir Empresas Parceiras (idempotente por slug / id)
  INSERT INTO public.empresas (id, nome, slug, ativo, razao_social)
  VALUES
    (v_cosampa_id, 'COSAMPA', 'cosampa', true, 'COSAMPA ENGENHARIA E CONSTRUÇÃO')
  ON CONFLICT (slug) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = true;

  INSERT INTO public.empresas (id, nome, slug, ativo, razao_social)
  VALUES
    (v_aurelio_id, 'AURÉLIO', 'aurelio', true, 'AURÉLIO CONSTRUÇÕES E PARCERIAS')
  ON CONFLICT (slug) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = true;

  INSERT INTO public.empresas (id, nome, slug, ativo, razao_social)
  VALUES
    (v_concretisa_id, 'CONCRETISA', 'concretisa', true, 'CONCRETISA CONCRETO E AGREGADOS')
  ON CONFLICT (slug) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = true;

  -- 2. Garantir categorias de caixa para todas as empresas (existentes e novas)
  FOR r_emp IN SELECT id FROM public.empresas LOOP
    -- Categorias de Entrada
    INSERT INTO public.caixa_categorias (empresa_id, tipo, nome, cor, ordem) VALUES
      (r_emp.id, 'entrada', 'Recebimento de Obra', '#10b981', 10),
      (r_emp.id, 'entrada', 'Venda de Concreto à Vista', '#059669', 20),
      (r_emp.id, 'entrada', 'Venda de Agregados / Brita', '#047857', 30),
      (r_emp.id, 'entrada', 'Serviço de Bombeamento', '#0d9488', 40),
      (r_emp.id, 'entrada', 'Aporte / Transferência entre Contas', '#3b82f6', 50),
      (r_emp.id, 'entrada', 'Rendimento / Financeiro', '#6366f1', 60),
      (r_emp.id, 'entrada', 'Outras Receitas', '#64748b', 90)
    ON CONFLICT (empresa_id, tipo, nome) DO NOTHING;

    -- Categorias de Saída
    INSERT INTO public.caixa_categorias (empresa_id, tipo, nome, cor, ordem) VALUES
      (r_emp.id, 'saida', 'Insumos (Cimento/Areia/Brita/Aditivo)', '#ef4444', 10),
      (r_emp.id, 'saida', 'Folha de Pagamento', '#dc2626', 20),
      (r_emp.id, 'saida', 'Adiantamento de Folha / Quinzena', '#b91c1c', 25),
      (r_emp.id, 'saida', 'Combustível e Lubrificantes', '#f97316', 30),
      (r_emp.id, 'saida', 'Manutenção de Caminhões / Central', '#ea580c', 40),
      (r_emp.id, 'saida', 'Peças e Pneus', '#d97706', 50),
      (r_emp.id, 'saida', 'Impostos e Tributos (DAS/ICMS/ISS)', '#eab308', 60),
      (r_emp.id, 'saida', 'Energia Elétrica / Água / Internet', '#84cc16', 70),
      (r_emp.id, 'saida', 'Aluguel / Imóveis / Máquinas', '#14b8a6', 80),
      (r_emp.id, 'saida', 'Alimentação e Despesas de Viagem', '#06b6d4', 90),
      (r_emp.id, 'saida', 'Despesas Bancárias / Juros / Tarifas', '#8b5cf6', 100),
      (r_emp.id, 'saida', 'Retirada de Pró-labore / Sócios', '#a855f7', 110),
      (r_emp.id, 'saida', 'Outras Despesas Operacionais', '#64748b', 120)
    ON CONFLICT (empresa_id, tipo, nome) DO NOTHING;
  END LOOP;
END $$;
