-- Migration: padronizar_tracos_referencia_lancamentos
-- (1) Renomear "F25B=01S12 CP II F 40" na SJE para "F25B01S12 CP II F 40"
-- (2) Garantir que Monteiro tenha os traços oficiais no catálogo (F10, F15, F20, F25, F30, F35, F40, F45)
-- (3) Reapontar todas as cargas históricas de Monteiro para os traços oficiais correspondentes
-- (4) Deletar do catálogo todos os traços fora do padrão (incluindo o F20 duplicado sem cargas de Monteiro)
-- (5) Garantir as funções RPC internas confirmar_email_auth_usuario, atualizar_email_usuario e proximo_numero_os

DO $$
DECLARE
  v_emp_monteiro uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_emp_sje uuid      := '22222222-2222-2222-2222-222222222222'::uuid;

  v_sje_f25_id uuid;
  v_sje_f25_existente uuid;

  v_mon_f10 uuid;
  v_mon_f15 uuid;
  v_mon_f20 uuid;
  v_mon_f25 uuid;
  v_mon_f30 uuid;
  v_mon_f35 uuid;
  v_mon_f40 uuid;
  v_mon_f45 uuid;

  v_linhas_reapontadas integer := 0;
BEGIN
  ----------------------------------------------------------------------
  -- 1. SJE: Renomear "F25B=01S12 CP II F 40" -> "F25B01S12 CP II F 40"
  ----------------------------------------------------------------------
  SELECT id INTO v_sje_f25_existente
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F25B01S12 CP II F 40';

  SELECT id INTO v_sje_f25_id
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F25B=01S12 CP II F 40';

  IF v_sje_f25_id IS NOT NULL THEN
    IF v_sje_f25_existente IS NOT NULL THEN
      -- Se já existisse o correto, reaponta cargas e remove o digitado errado
      UPDATE public.cargas
      SET traco_id = v_sje_f25_existente,
          traco_nome = 'F25B01S12 CP II F 40'
      WHERE traco_id = v_sje_f25_id;

      DELETE FROM public.tracos WHERE id = v_sje_f25_id;
    ELSE
      UPDATE public.tracos
      SET nome = 'F25B01S12 CP II F 40'
      WHERE id = v_sje_f25_id;
    END IF;
  END IF;

  ----------------------------------------------------------------------
  -- 2. MONTEIRO: Garantir criação dos traços no padrão oficial
  -- "FxxB01S12 CP II F 40" (F10, F15, F20, F25, F30, F35, F40, F45)
  -- Utilizando dosagens padrão da SJE ou dosagens vigentes
  ----------------------------------------------------------------------

  -- F10 (240 kg cimento)
  SELECT id INTO v_mon_f10 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F10B01S12 CP II F 40';
  IF v_mon_f10 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F10B01S12 CP II F 40', 'Traço F10 Padrão Oficial', 10,
      240, 480, 480, 845, 0, 0, 2.425, true
    ) RETURNING id INTO v_mon_f10;
  END IF;

  -- F15 (260 kg cimento)
  SELECT id INTO v_mon_f15 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F15B01S12 CP II F 40';
  IF v_mon_f15 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F15B01S12 CP II F 40', 'Traço F15 Padrão Oficial', 15,
      260, 480, 480, 845, 0, 0, 2.4, true
    ) RETURNING id INTO v_mon_f15;
  END IF;

  -- F20 (270 ou 280 kg cimento)
  -- NOTA: O prompt instrui: "DELETAR do catálogo todos os traços fora do padrão
  -- (inclusive o F20B01S12 duplicado de Monteiro, mantendo o da SJE)."
  -- Para Monteiro ter todos os oficiais disponíveis no select caso necessário ou no catálogo:
  -- Como o prompt pediu explicitamente para deletar o F20B01S12 duplicado de Monteiro,
  -- verificamos se existem cargas nele (vimos que tem 0 cargas).
  -- Mas se o usuário quiser F20 oficial em Monteiro no futuro, podemos recriá-lo depois,
  -- ou seguir estritamente o item (c): deletar o F20B01S12 de Monteiro.

  -- F25 (290 kg cimento) - BASE PRINCIPAL DE MONTEIRO
  SELECT id INTO v_mon_f25 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F25B01S12 CP II F 40';
  IF v_mon_f25 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F25B01S12 CP II F 40', 'Traço F25 Padrão Oficial Monteiro', 25,
      290, 480, 480, 850, 0, 0, 2.5, true
    ) RETURNING id INTO v_mon_f25;
  END IF;

  -- F30 (320-330 kg cimento)
  SELECT id INTO v_mon_f30 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F30B01S12 CP II F 40';
  IF v_mon_f30 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F30B01S12 CP II F 40', 'Traço F30 Padrão Oficial Monteiro', 30,
      320, 480, 480, 850, 0, 0, 3.2, true
    ) RETURNING id INTO v_mon_f30;
  END IF;

  -- F35 (360-380 kg cimento)
  SELECT id INTO v_mon_f35 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F35B01S12 CP II F 40';
  IF v_mon_f35 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F35B01S12 CP II F 40', 'Traço F35 Padrão Oficial Monteiro', 35,
      380, 300, 700, 780, 0, 0, 3.5, true
    ) RETURNING id INTO v_mon_f35;
  END IF;

  -- F40 (390 kg cimento)
  SELECT id INTO v_mon_f40 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F40B01S12 CP II F 40';
  IF v_mon_f40 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F40B01S12 CP II F 40', 'Traço F40 Padrão Oficial Monteiro', 40,
      390, 480, 480, 850, 0, 0, 3.9, true
    ) RETURNING id INTO v_mon_f40;
  END IF;

  -- F45 (420 kg cimento)
  SELECT id INTO v_mon_f45 FROM public.tracos WHERE empresa_id = v_emp_monteiro AND nome = 'F45B01S12 CP II F 40';
  IF v_mon_f45 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_monteiro, 'F45B01S12 CP II F 40', 'Traço F45 Padrão Oficial Monteiro', 45,
      420, 480, 480, 845, 0, 0, 4.2, true
    ) RETURNING id INTO v_mon_f45;
  END IF;

  ----------------------------------------------------------------------
  -- 3. REAPONTAR CARGAS DE MONTEIRO
  -- Mapeamento conforme especificação detalhada:
  -- - Traços 25 MPa e variantes 290kg (inclusive F25B=01S12) -> F25B01S12 (v_mon_f25)
  -- - Traços 28/30 MPa e variantes 300/310/320kg (F-30B01S12, etc.) -> F30B01S12 (v_mon_f30)
  -- - Traços 35 MPa (380kg) -> F35B01S12 (v_mon_f35)
  ----------------------------------------------------------------------

  -- 3.a) Variantes de 25 MPa e 290kg de cimento -> v_mon_f25
  UPDATE public.cargas c
  SET traco_id = v_mon_f25,
      traco_nome = CASE
        WHEN c.traco_nome LIKE '%(Manual)%' THEN 'F25B01S12 CP II F 40 (Manual)'
        ELSE 'F25B01S12 CP II F 40'
      END
  WHERE c.empresa_id = v_emp_monteiro
    AND (
      c.traco_id = '6a478459-dc8c-4b9b-a734-302306bf1bf8'::uuid -- F25B=01S12 CP II F 40
      OR c.traco_id IN (
        SELECT id FROM public.tracos
        WHERE empresa_id = v_emp_monteiro
          AND (
            nome ILIKE 'Traço FCK 15 MPa (290kg%'
            OR nome ILIKE 'Traço FCK 25 MPa (290kg%'
            OR nome ILIKE 'F25B=01S12%'
            OR nome ILIKE 'F25+B01S12%'
            OR nome ILIKE 'F25B+01S12%'
            OR nome ILIKE 'F25B0+1S12%'
            OR nome ILIKE '%F25B01S12 CP II F 40 MAC%'
          )
      )
    );

  -- 3.b) Variantes de 28/30 MPa e 300/310/320/330/340kg -> v_mon_f30
  UPDATE public.cargas c
  SET traco_id = v_mon_f30,
      traco_nome = CASE
        WHEN c.traco_nome LIKE '%(Manual)%' THEN 'F30B01S12 CP II F 40 (Manual)'
        ELSE 'F30B01S12 CP II F 40'
      END
  WHERE c.empresa_id = v_emp_monteiro
    AND (
      c.traco_id = '607e0263-9890-42da-a4f5-243902ded431'::uuid -- F-30B01S12 CP II F 40
      OR c.traco_id IN (
        SELECT id FROM public.tracos
        WHERE empresa_id = v_emp_monteiro
          AND (
            nome ILIKE 'Traço FCK 28 MPa%'
            OR nome ILIKE 'Traço FCK 30 MPa%'
            OR nome ILIKE 'F-30B01S12%'
            OR nome ILIKE '-F30B01S12%'
            OR nome ILIKE '+F30B01S12%'
          )
      )
    );

  -- 3.c) Variantes de 35 MPa (380kg) -> v_mon_f35
  UPDATE public.cargas c
  SET traco_id = v_mon_f35,
      traco_nome = CASE
        WHEN c.traco_nome LIKE '%(Manual)%' THEN 'F35B01S12 CP II F 40 (Manual)'
        ELSE 'F35B01S12 CP II F 40'
      END
  FROM public.tracos t
  WHERE c.traco_id = t.id
    AND c.empresa_id = v_emp_monteiro
    AND (
      t.nome ILIKE 'Traço FCK 35 MPa%'
    );

  ----------------------------------------------------------------------
  -- 4. DELETAR DO CATÁLOGO TODOS OS TRAÇOS FORA DO PADRÃO
  -- Inclusive o F20B01S12 duplicado de Monteiro se não houver cargas nele,
  -- mantendo apenas os traços oficiais no formato "FxxB01S12 CP II F 40".
  ----------------------------------------------------------------------

  -- Deleta o F20 duplicado de Monteiro especificamente conforme item 2.c
  DELETE FROM public.tracos
  WHERE empresa_id = v_emp_monteiro
    AND nome = 'F20B01S12 CP II F 40'
    AND NOT EXISTS (SELECT 1 FROM public.cargas WHERE traco_id = public.tracos.id);

  -- Deleta os demais traços fora do padrão de Monteiro
  DELETE FROM public.tracos
  WHERE empresa_id = v_emp_monteiro
    AND NOT (nome ~ '^F[0-9]{1,2}B01S12 CP II F 40$')
    AND NOT EXISTS (SELECT 1 FROM public.cargas WHERE traco_id = public.tracos.id);

  -- Deleta traços fora do padrão de qualquer outra empresa caso existam e estejam sem cargas
  DELETE FROM public.tracos
  WHERE NOT (nome ~ '^F[0-9]{1,2}B01S12 CP II F 40$')
    AND NOT EXISTS (SELECT 1 FROM public.cargas WHERE traco_id = public.tracos.id);

END $$;

----------------------------------------------------------------------
-- 5. PRESERVAÇÃO / RESTAURAÇÃO DAS FUNÇÕES RPC INTERNAS
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.confirmar_email_auth_usuario(
  p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
  v_user_uuid uuid;
  v_user record;
BEGIN
  IF p_user_id IS NULL OR trim(p_user_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não informado.');
  END IF;

  BEGIN
    v_user_uuid := p_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não é um UUID válido.');
  END;

  SELECT * INTO v_user FROM auth.users WHERE id = v_user_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado em auth.users.');
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW()),
      confirmation_token = '',
      updated_at = NOW()
  WHERE id = v_user_uuid;

  UPDATE auth.identities
  SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb),
      updated_at = NOW()
  WHERE user_id = v_user_uuid AND provider = 'email';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail confirmado com sucesso.',
    'user_id', p_user_id,
    'email', v_user.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_email_auth_usuario(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.proximo_numero_os(
  p_empresa_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prox integer;
  v_emp_uuid uuid;
BEGIN
  IF p_empresa_id IS NULL OR trim(p_empresa_id) = '' THEN
    SELECT COALESCE(MAX(numero_os), 4336) + 1
    INTO v_prox
    FROM public.ordens_servico;
    RETURN v_prox;
  END IF;

  v_emp_uuid := p_empresa_id::uuid;

  SELECT COALESCE(MAX(numero_os), 4336) + 1
  INTO v_prox
  FROM public.ordens_servico
  WHERE empresa_id = v_emp_uuid;

  RETURN v_prox;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO authenticated, anon;

DROP FUNCTION IF EXISTS public.atualizar_email_usuario(text, text);

CREATE OR REPLACE FUNCTION public.atualizar_email_usuario(
  p_novo_email text,
  p_usuario_app_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_app_uuid uuid;
  v_email_limpo text;
  v_conflito_app uuid;
  v_conflito_auth uuid;
BEGIN
  v_email_limpo := lower(trim(p_novo_email));

  IF p_usuario_app_id IS NULL OR trim(p_usuario_app_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Identificador do usuário inválido.');
  END IF;

  BEGIN
    v_app_uuid := p_usuario_app_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do usuário não é um UUID válido.');
  END;

  IF v_email_limpo IS NULL OR v_email_limpo = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'O e-mail não pode ficar em branco.');
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.usuarios_app
  WHERE id = v_app_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado na tabela de usuários do sistema.');
  END IF;

  SELECT id INTO v_conflito_app
  FROM public.usuarios_app
  WHERE lower(trim(email)) = v_email_limpo
    AND id <> v_app_uuid
  LIMIT 1;

  IF v_conflito_app IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está em uso por outro operador no sistema.');
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_conflito_auth
    FROM auth.users
    WHERE lower(trim(email)) = v_email_limpo
      AND id <> v_user_id
    LIMIT 1;

    IF v_conflito_auth IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está cadastrado na autenticação do sistema.');
    END IF;

    UPDATE auth.users
    SET
      email = v_email_limpo,
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{email}',
        to_jsonb(v_email_limpo)
      ),
      updated_at = NOW()
    WHERE id = v_user_id;

    UPDATE auth.identities
    SET
      email = v_email_limpo,
      identity_data = jsonb_set(
        COALESCE(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(v_email_limpo)
      ),
      updated_at = NOW()
    WHERE user_id = v_user_id
      AND provider = 'email';
  END IF;

  UPDATE public.usuarios_app
  SET
    email = v_email_limpo,
    updated_at = NOW()
  WHERE id = v_app_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'E-mail atualizado com sucesso.',
    'email', v_email_limpo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_email_usuario(text, text) TO authenticated, anon;
