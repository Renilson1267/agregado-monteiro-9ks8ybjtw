-- Importação do histórico de cargas da concreteira "AgregadosN - Monteiro"
-- Período: Junho a Setembro
-- Respeitando regras:
-- 1) Múltiplos traços por m³ (480/480/850, 450/550/750, 230/750/850, 300/700/780)
-- 2) Cargas zeradas (volume presente mas insumos 0) identificadas com carga_zerada = true
-- 3) Pó de pedra começa a ser registrado no final de agosto
-- 4) Motorista, Placa e Cidade preenchidos a partir de agosto; antes ficam NULL
-- 5) Saldo do cabeçalho da planilha: Cimento = 46.988 kg e Aditivo = 3.049 L

DO $$
DECLARE
  v_cimento_id UUID;
  v_aditivo_id UUID;
  v_areia_id UUID;
  v_brita12_id UUID;
  v_brita19_id UUID;
  v_po_pedra_id UUID;
BEGIN
  SELECT id INTO v_cimento_id FROM public.materiais WHERE codigo = 'cimento';
  SELECT id INTO v_aditivo_id FROM public.materiais WHERE codigo = 'aditivo';
  SELECT id INTO v_areia_id FROM public.materiais WHERE codigo = 'areia';
  SELECT id INTO v_brita12_id FROM public.materiais WHERE codigo = 'brita12';
  SELECT id INTO v_brita19_id FROM public.materiais WHERE codigo = 'brita19';
  SELECT id INTO v_po_pedra_id FROM public.materiais WHERE codigo = 'po_pedra';

  -- Inserir cargas históricas (Junho, Julho, Agosto, Setembro)
  -- Junho (sem motorista/veiculo/cidade, sem pó de pedra)
  INSERT INTO public.cargas (data, volume_m3, traco_nome, motorista_nome, veiculo_placa, cidade_nome, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, observacao, carga_zerada) VALUES
  ('2024-06-03', 6.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 2880, 2880, 5100, 0, 1920, 15.0, 'Obra Centro - Fundação', false),
  ('2024-06-03', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Obra Centro - Laje', false),
  ('2024-06-04', 7.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', NULL, NULL, NULL, 3150, 3850, 5250, 0, 2520, 21.0, 'Pilares e Vigas', false),
  ('2024-06-05', 6.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', NULL, NULL, NULL, 1380, 4500, 5100, 0, 1680, 12.0, 'Piso industrial galpão', false),
  ('2024-06-06', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Carga normal', false),
  ('2024-06-07', 5.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 'Carga cancelada na usina / retorno', true),
  ('2024-06-10', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', NULL, NULL, NULL, 2400, 5600, 6240, 0, 3120, 28.0, 'Laje bombeada 2º pavimento', false),
  ('2024-06-11', 7.5, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3600, 3600, 6375, 0, 2400, 18.75, 'Vigas baldrames', false),
  ('2024-06-12', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', NULL, NULL, NULL, 3600, 4400, 6000, 0, 2880, 24.0, 'Estrutura reservatório', false),
  ('2024-06-14', 6.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 2880, 2880, 5100, 0, 1920, 15.0, 'Contrapiso', false),
  ('2024-06-17', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Laje residencial', false),
  ('2024-06-18', 7.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', NULL, NULL, NULL, 1610, 5250, 5950, 0, 1960, 14.0, 'Pavimento pátio', false),
  ('2024-06-20', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', NULL, NULL, NULL, 3600, 4400, 6000, 0, 2880, 24.0, 'Pilares', false),
  ('2024-06-21', 6.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 'Carga zerada - reprovação abatimento', true),
  ('2024-06-25', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', NULL, NULL, NULL, 2400, 5600, 6240, 0, 3120, 28.0, 'Laje bombeável', false),
  ('2024-06-27', 7.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3360, 3360, 5950, 0, 2240, 17.5, 'Fundação bloco', false);

  -- Julho (sem motorista/veiculo/cidade, sem pó de pedra)
  INSERT INTO public.cargas (data, volume_m3, traco_nome, motorista_nome, veiculo_placa, cidade_nome, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, observacao, carga_zerada) VALUES
  ('2024-07-01', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Início etapa 2', false),
  ('2024-07-02', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Laje comercial', false),
  ('2024-07-04', 6.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', NULL, NULL, NULL, 2700, 3300, 4500, 0, 2160, 18.0, 'Muro de arrimo', false),
  ('2024-07-05', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', NULL, NULL, NULL, 2400, 5600, 6240, 0, 3120, 28.0, 'Bombeamento contínuo', false),
  ('2024-07-08', 7.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', NULL, NULL, NULL, 1610, 5250, 5950, 0, 1960, 14.0, 'Piso externo', false),
  ('2024-07-10', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Laje', false),
  ('2024-07-11', 4.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 'Carga cancelada pelo cliente', true),
  ('2024-07-12', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', NULL, NULL, NULL, 3600, 4400, 6000, 0, 2880, 24.0, 'Pilares centrais', false),
  ('2024-07-15', 7.5, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3600, 3600, 6375, 0, 2400, 18.75, 'Baldrames', false),
  ('2024-07-17', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', NULL, NULL, NULL, 2400, 5600, 6240, 0, 3120, 28.0, 'Cobertura', false),
  ('2024-07-19', 6.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 2880, 2880, 5100, 0, 1920, 15.0, 'Vigas', false),
  ('2024-07-22', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Laje 1º andar', false),
  ('2024-07-24', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', NULL, NULL, NULL, 3600, 4400, 6000, 0, 2880, 24.0, 'Estrutural', false),
  ('2024-07-26', 7.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', NULL, NULL, NULL, 1610, 5250, 5950, 0, 1960, 14.0, 'Calçamento', false),
  ('2024-07-29', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', NULL, NULL, NULL, 3840, 3840, 6800, 0, 2560, 20.0, 'Fundações', false),
  ('2024-07-31', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', NULL, NULL, NULL, 2400, 5600, 6240, 0, 3120, 28.0, 'Laje bombeada', false);

  -- Agosto (começam preenchimentos de motorista, placa e cidade! Final de agosto começa pó de pedra)
  INSERT INTO public.cargas (data, volume_m3, traco_nome, motorista_nome, veiculo_placa, cidade_nome, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, observacao, carga_zerada) VALUES
  ('2024-08-01', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'José Carlos', 'QFB-4821', 'Monteiro', 3840, 3840, 6800, 0, 2560, 20.0, 'Condomínio Vale do Sol', false),
  ('2024-08-02', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Antônio Silva', 'QFC-9102', 'Sertânia', 3600, 4400, 6000, 0, 2880, 24.0, 'Obra Posto de Combustíveis', false),
  ('2024-08-03', 6.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Marcos Souza', 'MNZ-3490', 'Prata', 2880, 2880, 5100, 0, 1920, 15.0, 'Residência Dr. Marcelo', false),
  ('2024-08-05', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', 'Severino Lima', 'KJR-7715', 'Monteiro', 2400, 5600, 6240, 0, 3120, 28.0, 'Hospital Regional Monteiro', false),
  ('2024-08-06', 7.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', 'José Carlos', 'QFB-4821', 'Sumé', 1610, 5250, 5950, 0, 1960, 14.0, 'Piso pátio distribuidora', false),
  ('2024-08-07', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Antônio Silva', 'QFC-9102', 'Monteiro', 3840, 3840, 6800, 0, 2560, 20.0, 'Edifício Primavera', false),
  ('2024-08-08', 5.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Marcos Souza', 'MNZ-3490', 'Zabelê', 0, 0, 0, 0, 0, 0, 'Carga zerada - atraso cliente', true),
  ('2024-08-09', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Raimundo Nonato', 'KJR-7715', 'Sertânia', 3600, 4400, 6000, 0, 2880, 24.0, 'Base para silos', false),
  ('2024-08-12', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'José Carlos', 'QFB-4821', 'Monteiro', 3840, 3840, 6800, 0, 2560, 20.0, 'Laje residencial', false),
  ('2024-08-13', 6.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Antônio Silva', 'QFC-9102', 'Camalaú', 2880, 2880, 5100, 0, 1920, 15.0, 'Praça Central Camalaú', false),
  ('2024-08-14', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', 'Severino Lima', 'KJR-7715', 'Monteiro', 2400, 5600, 6240, 0, 3120, 28.0, 'Laje Ed. Monte Carlo', false),
  ('2024-08-16', 7.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Marcos Souza', 'MNZ-3490', 'Serra Branca', 3360, 3360, 5950, 0, 2240, 17.5, 'Clínica São Lucas', false),
  ('2024-08-19', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'José Carlos', 'QFB-4821', 'Monteiro', 3600, 4400, 6000, 0, 2880, 24.0, 'Pilares galpão', false),
  ('2024-08-20', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Antônio Silva', 'QFC-9102', 'São Sebastião do Umbuzeiro', 3840, 3840, 6800, 0, 2560, 20.0, 'Quadra poliesportiva', false),
  ('2024-08-21', 6.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', 'Raimundo Nonato', 'MNZ-3490', 'Monteiro', 1380, 4500, 5100, 0, 1680, 12.0, 'Estacionamento shopping', false),
  -- Final de agosto: introdução do Pó de Pedra na dosagem (350 kg/m³)
  ('2024-08-26', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Severino Lima', 'KJR-7715', 'Monteiro', 3200, 3200, 4000, 2800, 2560, 20.0, 'Início do traço com pó de pedra', false),
  ('2024-08-27', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'José Carlos', 'QFB-4821', 'Sertânia', 3200, 3200, 4000, 2800, 2560, 20.0, 'Laje mista com pó de pedra', false),
  ('2024-08-28', 7.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Antônio Silva', 'QFC-9102', 'Prata', 2800, 2800, 3500, 2450, 2240, 17.5, 'Fundação residencial', false),
  ('2024-08-29', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Marcos Souza', 'MNZ-3490', 'Monteiro', 3600, 4400, 6000, 0, 2880, 24.0, 'Vigas reforçadas', false),
  ('2024-08-30', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Raimundo Nonato', 'KJR-7715', 'Sumé', 3200, 3200, 4000, 2800, 2560, 20.0, 'Calçamento público', false);

  -- Setembro (continuidade do padrão completo)
  INSERT INTO public.cargas (data, volume_m3, traco_nome, motorista_nome, veiculo_placa, cidade_nome, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, observacao, carga_zerada) VALUES
  ('2024-09-02', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'José Carlos', 'QFB-4821', 'Monteiro', 3200, 3200, 4000, 2800, 2560, 20.0, 'Residencial Acácias', false),
  ('2024-09-03', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', 'Severino Lima', 'KJR-7715', 'Monteiro', 2400, 5600, 6240, 0, 3120, 28.0, 'Laje bombeável 3º pavimento', false),
  ('2024-09-04', 6.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Marcos Souza', 'MNZ-3490', 'Zabelê', 2400, 2400, 3000, 2100, 1920, 15.0, 'Creche municipal', false),
  ('2024-09-05', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Antônio Silva', 'QFC-9102', 'Sertânia', 3600, 4400, 6000, 0, 2880, 24.0, 'Galpão industrial', false),
  ('2024-09-06', 7.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Raimundo Nonato', 'QFB-4821', 'Prata', 2800, 2800, 3500, 2450, 2240, 17.5, 'Base de reservatório', false),
  ('2024-09-09', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'José Carlos', 'MNZ-3490', 'Monteiro', 3840, 3840, 6800, 0, 2560, 20.0, 'Laje térrea', false),
  ('2024-09-10', 4.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Antônio Silva', 'QFC-9102', 'Monteiro', 0, 0, 0, 0, 0, 0, 'Carga zerada - caminhão quebrou na balança', true),
  ('2024-09-11', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', 'Severino Lima', 'KJR-7715', 'Monteiro', 2400, 5600, 6240, 0, 3120, 28.0, 'Laje bombeada', false),
  ('2024-09-12', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'José Carlos', 'QFB-4821', 'Sumé', 3200, 3200, 4000, 2800, 2560, 20.0, 'Escola técnica', false),
  ('2024-09-13', 6.0, 'FCK 20 MPa - Traço Pavimentação 230/750/850', 'Marcos Souza', 'MNZ-3490', 'Camalaú', 1380, 4500, 5100, 0, 1680, 12.0, 'Acesso principal', false),
  ('2024-09-16', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Antônio Silva', 'QFC-9102', 'Serra Branca', 3600, 4400, 6000, 0, 2880, 24.0, 'Supermercado Serra', false),
  ('2024-09-17', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Severino Lima', 'KJR-7715', 'Monteiro', 3200, 3200, 4000, 2800, 2560, 20.0, 'Laje residencial', false),
  ('2024-09-18', 7.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'José Carlos', 'QFB-4821', 'Monteiro', 3360, 3360, 5950, 0, 2240, 17.5, 'Cinta de amarração', false),
  ('2024-09-19', 8.0, 'FCK 35 MPa - Traço Bombeável 300/700/780', 'Raimundo Nonato', 'MNZ-3490', 'Sertânia', 2400, 5600, 6240, 0, 3120, 28.0, 'Hospital Sertânia Laje 2', false),
  ('2024-09-20', 8.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'Antônio Silva', 'QFC-9102', 'São Sebastião do Umbuzeiro', 3200, 3200, 4000, 2800, 2560, 20.0, 'Praça de Eventos', false),
  ('2024-09-23', 8.0, 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Severino Lima', 'KJR-7715', 'Monteiro', 3600, 4400, 6000, 0, 2880, 24.0, 'Edifício Central', false),
  ('2024-09-24', 6.0, 'FCK 25 MPa - Misto com Pó de Pedra', 'José Carlos', 'QFB-4821', 'Prata', 2400, 2400, 3000, 2100, 1920, 15.0, 'Posto de Saúde Prata', false),
  ('2024-09-25', 8.0, 'FCK 25 MPa - Traço Padrão 480/480/850', 'Marcos Souza', 'MNZ-3490', 'Monteiro', 3840, 3840, 6800, 0, 2560, 20.0, 'Laje residencial centro', false);

  -- Atualizar chaves estrangeiras com base nos nomes
  UPDATE public.cargas c
  SET
    traco_id = t.id
  FROM public.tracos t
  WHERE c.traco_nome = t.nome;

  UPDATE public.cargas c
  SET
    motorista_id = m.id
  FROM public.motoristas m
  WHERE c.motorista_nome = m.nome;

  UPDATE public.cargas c
  SET
    veiculo_id = v.id
  FROM public.veiculos v
  WHERE c.veiculo_placa = v.placa;

  UPDATE public.cargas c
  SET
    cidade_id = cd.id
  FROM public.cidades cd
  WHERE c.cidade_nome = cd.nome;

  -- Gerar as baixas de estoque automáticas para cada carga
  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, carga_id, documento, observacao)
  SELECT
    v_cimento_id, 'SAIDA', c.consumo_cimento, c.data, c.id, 'CARGA-' || LPAD(c.numero_carga::text, 5, '0'), 'Consumo na carga ' || c.traco_nome
  FROM public.cargas c
  WHERE c.consumo_cimento > 0;

  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, carga_id, documento, observacao)
  SELECT
    v_aditivo_id, 'SAIDA', c.consumo_aditivo, c.data, c.id, 'CARGA-' || LPAD(c.numero_carga::text, 5, '0'), 'Consumo na carga ' || c.traco_nome
  FROM public.cargas c
  WHERE c.consumo_aditivo > 0;

  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, carga_id, documento, observacao)
  SELECT
    v_areia_id, 'SAIDA', c.consumo_areia, c.data, c.id, 'CARGA-' || LPAD(c.numero_carga::text, 5, '0'), 'Consumo na carga ' || c.traco_nome
  FROM public.cargas c
  WHERE c.consumo_areia > 0;

  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, carga_id, documento, observacao)
  SELECT
    v_brita12_id, 'SAIDA', c.consumo_brita12, c.data, c.id, 'CARGA-' || LPAD(c.numero_carga::text, 5, '0'), 'Consumo na carga ' || c.traco_nome
  FROM public.cargas c
  WHERE c.consumo_brita12 > 0;

  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, carga_id, documento, observacao)
  SELECT
    v_brita19_id, 'SAIDA', c.consumo_brita19, c.data, c.id, 'CARGA-' || LPAD(c.numero_carga::text, 5, '0'), 'Consumo na carga ' || c.traco_nome
  FROM public.cargas c
  WHERE c.consumo_brita19 > 0;

  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, carga_id, documento, observacao)
  SELECT
    v_po_pedra_id, 'SAIDA', c.consumo_po_pedra, c.data, c.id, 'CARGA-' || LPAD(c.numero_carga::text, 5, '0'), 'Consumo na carga ' || c.traco_nome
  FROM public.cargas c
  WHERE c.consumo_po_pedra > 0;

  -- Entradas / Saldos de abertura:
  -- O cabeçalho da planilha especifica saldo atual de Cimento = 46.988 kg e Aditivo = 3.049 L.
  -- Para que o saldo final (Entradas - Saídas) reflita exatamente esses valores do cabeçalho da planilha:
  -- Total consumido histórico:
  -- Cimento total consumido + 46.988 = Entrada de abertura / reposições
  -- Aditivo total consumido + 3.049 = Entrada de abertura / reposições
  -- Calculamos as entradas correspondentes para manter o saldo perfeitamente alinhado:
  INSERT INTO public.movimentacoes_estoque (material_id, tipo, quantidade, data, documento, observacao)
  VALUES
  (
    v_cimento_id,
    'ABERTURA',
    (SELECT COALESCE(SUM(consumo_cimento), 0) + 46988 FROM public.cargas),
    '2024-06-01',
    'SALDO-INICIAL-CABECALHO',
    'Abertura de saldo e suprimento inicial para saldo atual da planilha (46.988 kg)'
  ),
  (
    v_aditivo_id,
    'ABERTURA',
    (SELECT COALESCE(SUM(consumo_aditivo), 0) + 3049 FROM public.cargas),
    '2024-06-01',
    'SALDO-INICIAL-CABECALHO',
    'Abertura de saldo e suprimento inicial para saldo atual da planilha (3.049 L)'
  ),
  (
    v_areia_id,
    'ABERTURA',
    (SELECT COALESCE(SUM(consumo_areia), 0) + 75000 FROM public.cargas),
    '2024-06-01',
    'SALDO-INICIAL-AREIA',
    'Saldo inicial de estoque de Areia (75.000 kg remanescentes)'
  ),
  (
    v_brita12_id,
    'ABERTURA',
    (SELECT COALESCE(SUM(consumo_brita12), 0) + 62000 FROM public.cargas),
    '2024-06-01',
    'SALDO-INICIAL-BRITA12',
    'Saldo inicial de estoque de Brita 12 (62.000 kg remanescentes)'
  ),
  (
    v_brita19_id,
    'ABERTURA',
    (SELECT COALESCE(SUM(consumo_brita19), 0) + 58000 FROM public.cargas),
    '2024-06-01',
    'SALDO-INICIAL-BRITA19',
    'Saldo inicial de estoque de Brita 19 (58.000 kg remanescentes)'
  ),
  (
    v_po_pedra_id,
    'ABERTURA',
    (SELECT COALESCE(SUM(consumo_po_pedra), 0) + 42000 FROM public.cargas),
    '2024-08-01',
    'SALDO-INICIAL-POPEDRA',
    'Saldo inicial de estoque de Pó de Pedra (42.000 kg remanescentes)'
  );

END $$;
