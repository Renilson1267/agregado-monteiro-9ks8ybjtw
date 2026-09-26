-- Criar tabelas clientes e ordens_servico multi-empresa com RLS

-- 1. Campos adicionais na tabela empresas para impressão de cabeçalho fiscal/recibo
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS uf TEXT;

-- Atualizar dados padrão das empresas existentes conforme o modelo real
UPDATE public.empresas
SET
  razao_social = 'CALDAS & AMARAL CONSTRUCOES LTDA',
  cnpj = '33.534.028/0001-68',
  telefone = '0800-083-1200',
  endereco = 'SITIO PAPAGAIO',
  cidade = 'SAO JOSE DO EGITO',
  uf = 'PE'
WHERE slug = 'sje' AND (cnpj IS NULL OR cnpj = '');

UPDATE public.empresas
SET
  razao_social = 'AGREGADO MONTEIRO CONSTRUCOES E CONCRETO LTDA',
  cnpj = '12.345.678/0001-90',
  telefone = '(83) 3351-1000',
  endereco = 'RODOVIA PB-264, KM 02',
  cidade = 'MONTEIRO',
  uf = 'PB'
WHERE slug = 'monteiro' AND (cnpj IS NULL OR cnpj = '');

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'PJ', -- 'PF' ou 'PJ'
  cpf_cnpj TEXT NOT NULL,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  telefone TEXT,
  email TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT DEFAULT 'PB',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON public.clientes(empresa_id, cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(empresa_id, nome);

-- RLS Clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_clientes" ON public.clientes;
CREATE POLICY "anon_all_clientes" ON public.clientes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Sequência e Tabela de Ordens de Serviço (Recibo de Concreto)
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_os INTEGER NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vínculos opcionais com cliente e carga
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  carga_id UUID REFERENCES public.cargas(id) ON DELETE SET NULL,

  -- Dados do Destinatário (denormalizados para preservar histórico no recibo impresso)
  destinatario_nome TEXT NOT NULL,
  destinatario_cpf_cnpj TEXT,
  destinatario_telefone TEXT,
  destinatario_endereco TEXT,
  destinatario_bairro TEXT,
  destinatario_cidade TEXT,
  destinatario_uf TEXT DEFAULT 'PB',
  destinatario_cep TEXT,

  -- Itens do Recibo (Quantidade, Unidade, Discriminação) em JSONB
  -- Ex: [{"quantidade": 8.0, "unidade": "m3", "discriminacao": "FCK 25 BRITA 0 / 1 SLUMP 12+-2 SJE NAC"}]
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Bloco de Verificação de Slump (Central e Peça Concretada)
  slump_central_medido TEXT,
  slump_central_saida TEXT,
  agua_adic_central NUMERIC DEFAULT 0,
  moldagem_central TEXT,
  visto_motorista_central TEXT,

  slump_peca_medido TEXT,
  slump_peca_saida TEXT,
  agua_adic_peca NUMERIC DEFAULT 0,
  peca_concretada TEXT,
  visto_motorista_peca TEXT,

  -- Dados de Transporte
  veiculo_placa TEXT,
  motorista_nome TEXT,
  lacre TEXT,
  km_inicial NUMERIC,
  km_final NUMERIC,
  hora_carga TEXT,

  -- Horários da Viagem
  hora_saida_central TEXT,
  hora_chegada_obra TEXT,
  hora_inicio_descarga TEXT,
  hora_fim_descarga TEXT,
  hora_saida_obra TEXT,
  hora_chegada_central TEXT,

  -- Visto Obra e Observações
  visto_obra TEXT,
  vendedor_nome TEXT,
  bomba_estacionaria TEXT,
  observacoes TEXT,

  -- Termo de Responsabilidade
  agua_adicional_termo NUMERIC,
  nome_responsavel_termo TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ordens_servico_empresa_numero_unique UNIQUE (empresa_id, numero_os)
);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_empresa ON public.ordens_servico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_data ON public.ordens_servico(empresa_id, data_emissao);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_numero ON public.ordens_servico(empresa_id, numero_os);

-- RLS Ordens de Serviço
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_ordens_servico" ON public.ordens_servico;
CREATE POLICY "anon_all_ordens_servico" ON public.ordens_servico
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Função auxiliar para obter próximo número sequencial de OS por empresa
CREATE OR REPLACE FUNCTION public.proximo_numero_os(p_empresa_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_prox INTEGER;
BEGIN
  -- Se o modelo inicial da SJE começou no 4337 ou similar, mantemos sequencial automático
  SELECT COALESCE(MAX(numero_os), 4336) + 1 INTO v_prox
  FROM public.ordens_servico
  WHERE empresa_id = p_empresa_id;

  RETURN v_prox;
END;
$$ LANGUAGE plpgsql;

-- 5. Seed inicial com o cliente e a OS de referência (Recibo Nº 4337) na empresa SJE
DO $$
DECLARE
  v_sje_id UUID;
  v_cliente_id UUID;
BEGIN
  SELECT id INTO v_sje_id FROM public.empresas WHERE slug = 'sje' LIMIT 1;
  IF v_sje_id IS NOT NULL THEN
    -- Inserir cliente CABRAL LEITE CONSTRUCOES LTDA se não existir
    SELECT id INTO v_cliente_id FROM public.clientes WHERE empresa_id = v_sje_id AND cpf_cnpj = '22.779.811/0001-75' LIMIT 1;
    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (
        id, empresa_id, tipo, cpf_cnpj, nome, telefone,
        logradouro, bairro, cidade, uf, cep, observacoes
      ) VALUES (
        v_cliente_id,
        v_sje_id,
        'PJ',
        '22.779.811/0001-75',
        'CABRAL LEITE CONSTRUCOES LTDA',
        '(83) 9908-5034',
        'POVOADO DEPOIS DE SÃO JOSÉ DE PRINCESA.',
        'sitio',
        'Princesa Isabel',
        'PB',
        '58755000',
        'Cliente modelo cadastrado para expedição de concreto'
      );
    END IF;

    -- Inserir OS 4337 se não existir
    IF NOT EXISTS (SELECT 1 FROM public.ordens_servico WHERE empresa_id = v_sje_id AND numero_os = 4337) THEN
      INSERT INTO public.ordens_servico (
        empresa_id,
        numero_os,
        data_emissao,
        cliente_id,
        destinatario_nome,
        destinatario_cpf_cnpj,
        destinatario_telefone,
        destinatario_endereco,
        destinatario_bairro,
        destinatario_cidade,
        destinatario_uf,
        destinatario_cep,
        itens,
        slump_central_medido,
        slump_central_saida,
        agua_adic_central,
        moldagem_central,
        visto_motorista_central,
        slump_peca_medido,
        slump_peca_saida,
        agua_adic_peca,
        peca_concretada,
        visto_motorista_peca,
        veiculo_placa,
        motorista_nome,
        lacre,
        hora_carga,
        vendedor_nome,
        bomba_estacionaria,
        observacoes
      ) VALUES (
        v_sje_id,
        4337,
        '2026-09-25',
        v_cliente_id,
        'CABRAL LEITE CONSTRUCOES LTDA',
        '22.779.811/0001-75',
        '(83) 9908-5034',
        'POVOADO DEPOIS DE SÃO JOSÉ DE PRINCESA.',
        'sitio',
        'Princesa Isabel',
        'PB',
        '58755000',
        '[{"quantidade": 8.00, "unidade": "m3", "discriminacao": "FCK 25 BRITA 0 / 1 SLUMP 12+-2 SJE NAC"}]'::jsonb,
        '12+-2',
        '12+-2',
        0,
        'SIM',
        'CARLOS ALBERTO',
        '12+-2',
        '12+-2',
        0,
        'PISO / ESTRUTURAL',
        'CARLOS ALBERTO',
        'PEG6E61',
        'Carlos Alberto(Mago)',
        '16190',
        '07:30',
        'VALDERCLEITON FREIRE',
        'JUNIOR',
        'FOLGA DE ÁGUA: 15L/m3 PED 002009/26 VENDEDOR: VALDERCLEITON FREIRE CONTRATANTE: CABRAL LEITE CONSTRUCOES LTDA - CNPJ/CPF: 22.779.811/0001-75 - ENDEREÇO: POVOADO DEPOIS DE SÃO JOSÉ DE PRINCESA., - sitio - Princesa Isabel, PB - MOTORISTA: CARLOS ALBERTO(MAGO) - LACRE: 16190 - PLACA: PEG6E61 - BOMBA ESTACIONÁRIA: JUNIOR'
      );
    END IF;
  END IF;
END $$;
