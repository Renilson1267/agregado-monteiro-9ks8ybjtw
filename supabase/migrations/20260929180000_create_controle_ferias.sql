-- Migration: Criar tabela e colunas de controle de ferias e seed dos dados SJE e Monteiro
-- Data: 2026-09-29

-- 1. Estender funcionarios com colunas de perfil de vestuario e bancario se nao existirem
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS calca TEXT;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS camisa TEXT;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS percentual_ajuste NUMERIC;

-- 2. Tabela de controle de ferias dos funcionarios (suporta múltiplos períodos por funcionário)
CREATE TABLE IF NOT EXISTS public.controle_ferias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  ordem INTEGER DEFAULT 0,
  nome TEXT NOT NULL,
  funcao TEXT,
  salario_2025 NUMERIC DEFAULT 0,
  admissao DATE,
  cpf TEXT,
  agencia TEXT,
  conta_corrente TEXT,
  percentual_ajuste NUMERIC,
  ferias DATE,
  calca TEXT,
  camisa TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS e criar políticas de acesso aberto compatíveis com o restante do app
ALTER TABLE public.controle_ferias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_controle_ferias" ON public.controle_ferias;
CREATE POLICY "anon_all_controle_ferias" ON public.controle_ferias
  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_controle_ferias_empresa ON public.controle_ferias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_controle_ferias_funcionario ON public.controle_ferias(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_controle_ferias_cpf ON public.controle_ferias(cpf);
CREATE INDEX IF NOT EXISTS idx_controle_ferias_ferias ON public.controle_ferias(ferias);

-- 3. Atualizar dados cadastrais dos funcionários existentes com base na planilha
DO $$
DECLARE
  v_sje_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_monteiro_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
BEGIN
  -- Atualizar Patrícia
  UPDATE public.funcionarios
  SET agencia = '6045', conta = '7335-0', percentual_ajuste = 1.117108218, bruto = 2080.00
  WHERE empresa_id = v_sje_id AND (cpf = '11169396496' OR nome ILIKE '%PATRÍCIA%');

  -- Atualizar José Marinaldo
  UPDATE public.funcionarios
  SET agencia = '6240', conta = '251525-3', percentual_ajuste = 1.075067776, calca = 'G', camisa = 'G', bruto = 2520.00
  WHERE empresa_id = v_sje_id AND (cpf = '70581240430' OR nome ILIKE '%MARINALDO%');

  -- Atualizar José Ilton
  UPDATE public.funcionarios
  SET agencia = '1563', conta = '52004-7', percentual_ajuste = 1.108321567, calca = 'GG', camisa = 'GG', bruto = 2520.00
  WHERE empresa_id = v_sje_id AND (cpf = '04480839496' OR nome ILIKE '%LACERDA%');

  -- Atualizar José Eugenio
  UPDATE public.funcionarios
  SET agencia = '6240', conta = '255425-9', percentual_ajuste = 1.102171277, calca = 'XGG', camisa = 'XGG', bruto = 2410.00
  WHERE empresa_id = v_sje_id AND (cpf = '04285666421' OR nome ILIKE '%EUGENIO%');

  -- Atualizar Irinaldo
  UPDATE public.funcionarios
  SET agencia = '1563', conta = '76509-0', percentual_ajuste = 1.102171277, calca = 'GG', camisa = 'GG', bruto = 2410.00
  WHERE empresa_id = v_sje_id AND (cpf = '07075099477' OR nome ILIKE '%IRINALDO%');

  -- Atualizar Carlos Alberto
  UPDATE public.funcionarios
  SET percentual_ajuste = 1.075342466, calca = 'M', camisa = 'M', bruto = 2410.00
  WHERE empresa_id = v_sje_id AND (cpf = '07713625445' OR nome ILIKE '%CARLOS ALBERTO%');

  -- Atualizar José Ednaldo
  UPDATE public.funcionarios
  SET percentual_ajuste = 1.075342466, calca = 'G', camisa = 'G', bruto = 1720.00
  WHERE empresa_id = v_sje_id AND (cpf = '10410100447' OR nome ILIKE '%EDNALDO%');

  -- Atualizar Valdercleiton
  UPDATE public.funcionarios
  SET percentual_ajuste = 1.102171277, calca = 'GG', camisa = 'GG', bruto = 3300.00
  WHERE empresa_id = v_sje_id AND (cpf = '10130785431' OR nome ILIKE '%VALDERCLEITON%');

  -- Atualizar Victor Emanoel (Monteiro) se CPF estiver vazio
  UPDATE public.funcionarios
  SET cpf = '14334716474', data_admissao = '2026-09-10'
  WHERE empresa_id = v_monteiro_id AND nome ILIKE '%VICTOR EMANOEL%' AND (cpf IS NULL OR cpf = '');

  -- Atualizar Encarregado Guilherme (Monteiro)
  UPDATE public.funcionarios
  SET funcao = 'ENCARREGADO', bruto = 4000.00
  WHERE empresa_id = v_monteiro_id AND nome ILIKE '%GUILHERME ALVES%';

  -- 4. Seed na tabela controle_ferias (idempotente)
  -- Se a tabela estiver vazia ou não tiver esses registros, insere os dados exatos enviados pelo usuário
  IF NOT EXISTS (SELECT 1 FROM public.controle_ferias WHERE empresa_id = v_sje_id) THEN
    -- Linha 1 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 1, 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 2080.00, '2022-01-17', '111.693.964-96', '6045', '7335-0', 1.117108218, '2026-05-04', '', ''
    );

    -- Linha 2 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 2, 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 2520.00, '2022-01-17', '705.812.404-30', '6240', '251525-3', 1.075067776, '2026-06-02', 'G', 'G'
    );

    -- Linha 3 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 3, 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA', 2520.00, '2022-01-17', '044.808.394-96', '1563', '52004-7', 1.108321567, '2026-02-09', 'GG', 'GG'
    );

    -- Linha 4 SJE (primeiro período)
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 4, 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 2410.00, '2022-10-01', '042.856.664-21', '6240', '255425-9', 1.102171277, '2026-03-01', 'XGG', 'XGG'
    );

    -- Linha 5 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 5, 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 2410.00, '2022-11-01', '070.750.994-77', '1563', '76509-0', 1.102171277, '2026-11-03', 'GG', 'GG'
    );

    -- Linha 6 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 6, 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 2410.00, '2025-09-01', '77.136.254-45', '', '', 1.075342466, '2026-10-05', 'M', 'M'
    );

    -- Linha 7 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 7, 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 1720.00, '2025-04-01', '104.101.004-47', '', '', 1.075342466, '2026-08-01', 'G', 'G'
    );

    -- Linha 8 SJE
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 8, 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 3300.00, '2025-09-01', '101.307.854-31', '', '', 1.102171277, '2026-12-01', 'GG', 'GG'
    );

    -- Linha 9 SJE (segundo período de férias de José Eugenio Brito Alves - manter segunda ocorrência)
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_sje_id, 9, 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 2410.00, '2022-10-01', '042.856.664-21', '6240', '255425-9', 1.102171277, '2026-09-07', 'XGG', 'XGG'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.controle_ferias WHERE empresa_id = v_monteiro_id) THEN
    -- Monteiro Linha 1
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 1, 'Carlos Willington Firmino da Silva', 'MOTORISTA', 2520.00, '2026-07-02', '103.498.794-19', '', '', NULL, NULL, '', ''
    );

    -- Monteiro Linha 2
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 2, 'Cristiano Virgulino Cordeiro', 'AJUDANTE', 1720.00, '2026-07-03', '119.543.834-50', '', '', NULL, NULL, '', ''
    );

    -- Monteiro Linha 3
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 3, 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 2200.00, '2025-11-15', '083.477.884-05', '', '', NULL, NULL, '', ''
    );

    -- Monteiro Linha 4
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 4, 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 2410.00, '2026-08-03', '053.717.144-48', '', '', NULL, NULL, '', ''
    );

    -- Monteiro Linha 5
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 5, 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ENCARREGADO', 4000.00, '2025-12-04', '092.361.304-88', '', '', NULL, NULL, '', ''
    );

    -- Monteiro Linha 6
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 6, 'JOSE CLAUDIO MOURA BARBOSA', 'AJUDANTE', 1720.00, '2026-07-03', '097.891.354-08', '', '', NULL, NULL, '', ''
    );

    -- Monteiro Linha 7
    INSERT INTO public.controle_ferias (
      empresa_id, ordem, nome, funcao, salario_2025, admissao, cpf, agencia, conta_corrente, percentual_ajuste, ferias, calca, camisa
    ) VALUES (
      v_monteiro_id, 7, 'VICTOR EMANOEL ROMAO DA SILVA', 'MOTORISTA', 2410.00, '2026-09-10', '143.347.164-74', '', '', NULL, NULL, '', ''
    );
  END IF;

  -- 5. Vincular funcionario_id na tabela controle_ferias pelo CPF/Nome onde coincidir
  UPDATE public.controle_ferias cf
  SET funcionario_id = f.id
  FROM public.funcionarios f
  WHERE cf.funcionario_id IS NULL
    AND cf.empresa_id = f.empresa_id
    AND (
      (cf.cpf IS NOT NULL AND cf.cpf <> '' AND regexp_replace(cf.cpf, '[^0-9]', '', 'g') = regexp_replace(f.cpf, '[^0-9]', '', 'g'))
      OR (cf.nome ILIKE f.nome)
    );

END $$;
