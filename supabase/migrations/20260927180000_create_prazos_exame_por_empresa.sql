-- Migração para configurar prazos de validade dos exames por empresa (GC MIX: Monteiro e SJE)
-- Data/hora: 2026-09-27 18:00:00

CREATE TABLE IF NOT EXISTS public.prazos_exame_por_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_exame TEXT NOT NULL,
  nome_exame TEXT NOT NULL,
  validade_padrao_meses INTEGER NOT NULL CHECK (validade_padrao_meses > 0),
  norma_referencia TEXT,
  descricao_norma TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT prazos_exame_por_empresa_empresa_tipo_unique UNIQUE (empresa_id, tipo_exame)
);

CREATE INDEX IF NOT EXISTS idx_prazos_exame_empresa ON public.prazos_exame_por_empresa (empresa_id);
CREATE INDEX IF NOT EXISTS idx_prazos_exame_tipo ON public.prazos_exame_por_empresa (tipo_exame);

-- Habilitar RLS
ALTER TABLE public.prazos_exame_por_empresa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_prazos_exame" ON public.prazos_exame_por_empresa;
CREATE POLICY "anon_all_prazos_exame" ON public.prazos_exame_por_empresa
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Inserir os defaults baseados nas normas do Ministério do Trabalho / Legislação de Trânsito
-- para as duas empresas existentes (Monteiro: 11111111-1111-1111-1111-111111111111 e SJE: 22222222-2222-2222-2222-222222222222)
DO $$
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN SELECT id FROM public.empresas LOOP
    -- 1. Exame Admissional
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'admissional',
      'Exame Admissional',
      12,
      'NR-7 item 7.5.8 I',
      'Realizado antes do início das atividades; validade periódica inicial típica de 1 ano até o próximo periódico'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 2. ASO Periódico
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'aso',
      'ASO Periódico',
      12,
      'NR-7 item 7.5.8 II',
      'Anual para expostos a riscos ocupacionais (concreto/ruído/poeiras) ou bienal para não expostos'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 3. Acuidade Visual
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'acuidade_visual',
      'Acuidade Visual',
      12,
      'PCMSO / NR-7 Anexo IV',
      'Exame complementar anual para operadores de máquinas, motoristas e trabalho com atenção visual contínua'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 4. Audiometria
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'audiometria',
      'Audiometria',
      12,
      'NR-7 Anexo II item 4.1 b',
      'Anual sequencial para trabalhadores expostos a níveis de pressão sonora elevados (ruído ocupacional)'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 5. Avaliação Clínica
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'avaliacao_clinica',
      'Avaliação Clínica',
      12,
      'NR-7 item 7.5.8',
      'Avaliação médica clínica anual em funções operacionais e com riscos identificados no PGR'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 6. Toxicológico (30 meses)
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'toxicologico',
      'Toxicológico',
      30,
      'Art. 168 §6º CLT e Art. 148-A CTB / CONTRAN',
      'Periodicidade obrigatória a cada 30 meses (2 anos e meio) para motoristas profissionais CNH C, D e E'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 7. Raio-X (RX)
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'rx',
      'Raio-X (RX)',
      12,
      'NR-7 Anexo I e Anexo IV (Poeiras Minerais / Sílica)',
      'Acompanhamento radiológico de tórax OIT (geralmente anual ou bienal conforme o PCMSO da concreteira)'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

    -- 8. Eletrocardiograma (ECG)
    INSERT INTO public.prazos_exame_por_empresa (
      empresa_id, tipo_exame, nome_exame, validade_padrao_meses, norma_referencia, descricao_norma
    ) VALUES (
      emp.id,
      'ecg',
      'Eletrocardiograma (ECG)',
      12,
      'NR-7 / NR-35 / NR-12',
      'Avaliação cardiovascular anual para motoristas de veículos pesados, operadores e atividades críticas'
    ) ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;
  END LOOP;
END $$;
