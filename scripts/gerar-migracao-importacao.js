import fs from 'fs'
import path from 'path'

// Lê o arquivo JSON do backup
const backupPath = path.resolve('src/assets/backup-folha-2026-09-27-40a44.json')
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

const MONTEIRO_ID = '11111111-1111-1111-1111-111111111111'
const SJE_ID = '22222222-2222-2222-2222-222222222222'

// Mapeia funcionários
const cadastrosFuncs = backupData.cadastros.funcionarios || []
const folhaFuncs = backupData.folha.func || {}
const folhaTerceiros = backupData.folha.terceiros || []
const folhaLanc = backupData.folha.lanc || {}

console.log(`Cadastros: ${cadastrosFuncs.length} funcionários`)
console.log(`Folha Terc: ${folhaTerceiros.length} terceiros`)
console.log(`Competências: ${Object.keys(folhaLanc).length}`)

const escapeSql = (str) => {
  if (str === null || str === undefined) return 'NULL'
  return `'${String(str).replace(/'/g, "''")}'`
}

const numSql = (num, def = 0) => {
  if (num === null || num === undefined || isNaN(Number(num))) return def
  return Number(num)
}

let sql = `-- Migração de importação completa do backup legado da folha
-- Data: 2026-09-28
-- Inclui funcionários (11 SJE, 7 Monteiro), 2 terceiros e ~30 competências

DO $$
DECLARE
  v_empresa_monteiro uuid := '11111111-1111-1111-1111-111111111111';
  v_empresa_sje uuid := '22222222-2222-2222-2222-222222222222';
  v_comp_id uuid;
BEGIN

-- 1. IMPORTAÇÃO DOS FUNCIONÁRIOS
`

const funcMap = {}

for (const f of cadastrosFuncs) {
  const fInfo = folhaFuncs[f.id] || {}
  const unidade = (fInfo.unidade || (f.unidade || 'SJE')).toUpperCase()
  const empresaId = unidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID
  
  funcMap[f.id] = {
    ...f,
    ...fInfo,
    empresaId,
    unidade: unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE'
  }

  sql += `
  INSERT INTO public.funcionarios (
    empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes,
    telefone, email, bruto, filhos, conta, pix, inativo, oculto, unidade
  ) VALUES (
    '${empresaId}',
    ${escapeSql(f.nome.trim().toUpperCase())},
    ${escapeSql(f.funcao || 'Geral')},
    ${f.doc ? escapeSql(f.doc) : 'NULL'},
    ${f.admissao ? escapeSql(f.admissao) : 'NULL'},
    ${fInfo.inativo ? 'false' : 'true'},
    ${escapeSql(fInfo.obs || '')},
    ${escapeSql(f.telefone || '')},
    ${escapeSql(f.email || '')},
    ${numSql(fInfo.bruto)},
    ${numSql(fInfo.filhos)},
    ${escapeSql(fInfo.conta || '')},
    ${escapeSql(fInfo.pix || '')},
    ${fInfo.inativo ? 'true' : 'false'},
    ${fInfo.oculto ? 'true' : 'false'},
    ${escapeSql(unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE')}
  )
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET
    nome = EXCLUDED.nome,
    funcao = EXCLUDED.funcao,
    data_admissao = COALESCE(EXCLUDED.data_admissao, funcionarios.data_admissao),
    ativo = EXCLUDED.ativo,
    telefone = EXCLUDED.telefone,
    email = EXCLUDED.email,
    bruto = EXCLUDED.bruto,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    pix = EXCLUDED.pix,
    inativo = EXCLUDED.inativo,
    oculto = EXCLUDED.oculto,
    unidade = EXCLUDED.unidade,
    updated_at = now();
`
}

sql += `\n-- 2. IMPORTAÇÃO DOS TERCEIROS\n`

for (const t of folhaTerceiros) {
  const unidade = (t.unidade || 'SJE').toUpperCase()
  const empresaId = unidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID

  sql += `
  INSERT INTO public.folha_terceiros (
    empresa_id, nome, bruto, conta, pix, obs, unidade, ativo
  ) VALUES (
    '${empresaId}',
    ${escapeSql(t.nome.trim().toUpperCase())},
    ${numSql(t.bruto)},
    ${escapeSql(t.conta || '')},
    ${escapeSql(t.pix || '')},
    ${escapeSql(t.obs || '')},
    ${escapeSql(unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE')},
    true
  )
  ON CONFLICT (empresa_id, lower(TRIM(nome)))
  DO UPDATE SET
    bruto = EXCLUDED.bruto,
    conta = EXCLUDED.conta,
    pix = EXCLUDED.pix,
    obs = EXCLUDED.obs,
    unidade = EXCLUDED.unidade,
    ativo = EXCLUDED.ativo,
    updated_at = now();
`
}

sql += `\n-- 3. IMPORTAÇÃO DE COMPETÊNCIAS E LANÇAMENTOS\n`

const comps = Object.keys(folhaLanc).sort()

for (const comp of comps) {
  const [ano, mes] = comp.split('-').map(Number)
  const lancComp = folhaLanc[comp]
  const funcsLanc = lancComp.func || {}
  const tercLanc = lancComp.terc || {}

  // Separa por empresa
  for (const empId of [SJE_ID, MONTEIRO_ID]) {
    const isSje = empId === SJE_ID
    const empSlug = isSje ? 'sje' : 'monteiro'

    sql += `
  -- Competência ${comp} para ${empSlug.toUpperCase()}
  INSERT INTO public.folha_competencias (
    empresa_id, competencia, ano, mes, status, observacoes
  ) VALUES (
    '${empId}', '${comp}', ${ano}, ${mes}, 'ABERTA', 'Importado do sistema legado'
  )
  ON CONFLICT (empresa_id, competencia)
  DO UPDATE SET
    ano = EXCLUDED.ano,
    mes = EXCLUDED.mes,
    updated_at = now()
  RETURNING id INTO v_comp_id;
`

    // Processa funcionários dessa empresa
    for (const [funcId, lanc] of Object.entries(funcsLanc)) {
      if (funcId === '__novo' || funcId === 'undefined') continue
      const fCadastro = funcMap[funcId]
      if (!fCadastro) continue
      if (fCadastro.empresaId !== empId) continue

      const obras = numSql(lanc.obras)
      const valorObra = numSql(lanc.valorObra, 20)
      const producao = obras * valorObra
      const limp = numSql(lanc.limp)
      const sab = numSql(lanc.sab)
      const fer = numSql(lanc.fer)
      const ajuda = numSql(lanc.ajuda)
      const vendObra = numSql(lanc.vendObra)
      const vendCom = numSql(lanc.vendCom)
      const vendAjuda = numSql(lanc.vendAjuda)
      const adiant = numSql(lanc.adiant)
      const gratif = numSql(lanc.gratif)
      
      const bruto = numSql(fCadastro.bruto)
      const filhos = numSql(fCadastro.filhos)
      const conta = fCadastro.conta || ''
      const pix = fCadastro.pix || ''
      const oculto = fCadastro.oculto ? 'true' : 'false'
      const inativo = fCadastro.inativo ? 'true' : 'false'

      // Comissão: se vendCom > 0 usa vendCom, senão se vendObra > 0 comissão = 0.5%
      let comissao = vendCom
      if (comissao === 0 && vendObra > 0) {
        comissao = Math.round(vendObra * 0.005 * 100) / 100
      }

      // Proventos = Bruto + Produção + Limpeza + Sábado + Férias + Ajuda de Custo + Comissão + Gratificação + Vendas Ajuda
      const totalProventos = bruto + producao + limp + sab + fer + ajuda + comissao + gratif + vendAjuda
      // Descontos = Adiantamento
      const totalDescontos = adiant
      const liquido = totalProventos - totalDescontos

      sql += `
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id
  ) VALUES (
    '${empId}', v_comp_id, '${comp}',
    ${escapeSql(fCadastro.nome.trim().toUpperCase())},
    ${escapeSql(fCadastro.funcao || 'Geral')},
    'Funcionario',
    ${escapeSql(fCadastro.funcao || 'Geral')},
    ${escapeSql(fCadastro.unidade)},
    ${bruto}, ${bruto}, ${filhos},
    ${escapeSql(conta)}, ${escapeSql(pix)}, ${escapeSql(pix)},
    ${obras}, ${valorObra}, ${producao}, ${limp}, ${sab}, ${fer}, ${ajuda},
    ${vendObra}, ${comissao}, ${vendAjuda}, ${adiant}, ${gratif},
    ${totalProventos}, ${totalDescontos}, ${liquido}, ${liquido},
    'Calculado', ${oculto}, ${inativo}, '${funcId}'
  )
  ON CONFLICT (empresa_id, competencia, lower(TRIM(nome)))
  DO UPDATE SET
    cargo = EXCLUDED.cargo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    updated_at = now();
`
    }

    // Processa terceiros dessa empresa
    // Terc 0 = RAIMUNDO MARIANO DA SILVA JUNIOR (SJE)
    // Terc 1 = Marcio Luan da Silva (MONTEIRO)
    folhaTerceiros.forEach((terc, idx) => {
      const tUnidade = (terc.unidade || 'SJE').toUpperCase()
      const tEmpId = tUnidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID
      if (tEmpId !== empId) return

      const lancTerc = tercLanc[String(idx)] || {}
      const vendObra = numSql(lancTerc.vendObra)
      const vendCom = numSql(lancTerc.vendCom)
      const vendAjuda = numSql(lancTerc.vendAjuda)
      let comissao = vendCom
      if (comissao === 0 && vendObra > 0) {
        comissao = Math.round(vendObra * 0.005 * 100) / 100
      }
      const bruto = numSql(terc.bruto)
      const totalProventos = bruto + comissao + vendAjuda
      const liquido = totalProventos

      sql += `
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id
  ) VALUES (
    '${empId}', v_comp_id, '${comp}',
    ${escapeSql(terc.nome.trim().toUpperCase())},
    'Terceiro',
    'Terceiro',
    'Terceiro',
    ${escapeSql(tUnidade)},
    ${bruto}, ${bruto}, 0,
    ${escapeSql(terc.conta || '')}, ${escapeSql(terc.pix || '')}, ${escapeSql(terc.pix || '')},
    0, 20, 0, 0, 0, 0, 0,
    ${vendObra}, ${comissao}, ${vendAjuda}, 0, 0,
    ${totalProventos}, 0, ${liquido}, ${liquido},
    'Calculado', false, false, 'terc_${idx}'
  )
  ON CONFLICT (empresa_id, competencia, lower(TRIM(nome)))
  DO UPDATE SET
    cargo = EXCLUDED.cargo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    total_proventos = EXCLUDED.total_proventos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    updated_at = now();
`
    })

    // Atualiza totais na folha_competencias
    sql += `
  UPDATE public.folha_competencias
  SET
    total_colaboradores = (SELECT count(*) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id),
    total_proventos = COALESCE((SELECT sum(total_proventos) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id), 0),
    total_descontos = COALESCE((SELECT sum(total_descontos) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id), 0),
    total_liquido = COALESCE((SELECT sum(salario_liquido) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id), 0),
    updated_at = now()
  WHERE id = v_comp_id;
`
  }
}

sql += `
END $$;
`

fs.writeFileSync('supabase/migrations/20260928011000_importar_dados_folha_legado.sql', sql, 'utf8')
console.log('Migração gerada com sucesso: supabase/migrations/20260928011000_importar_dados_folha_legado.sql')
