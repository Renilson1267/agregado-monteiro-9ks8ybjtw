import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export function gerarMigrationSeed() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const rootDir = path.resolve(__dirname, '..')

  const backupCandidates = [
    path.resolve(rootDir, 'src/assets/backup-folha-2026-09-28-46d43.json'),
    path.resolve(rootDir, 'src/assets/backup-folha-2026-09-27-40a44.json'),
  ]
  const backupPath = backupCandidates.find((p) => fs.existsSync(p))
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

  const cadFuncs = backupData.cadastros?.funcionarios || []
  const folhaFuncs = backupData.folha?.func || {}
  const lanc = backupData.folha?.lanc || {}

  const SJE_ID = '22222222-2222-2222-2222-222222222222'
  const MONTEIRO_ID = '11111111-1111-1111-1111-111111111111'

  const funcMap = {}
  for (const f of cadFuncs) {
    const fFolha = folhaFuncs[f.id] || {}
    const unidade = (fFolha.unidade || f.unidade || 'SJE').toUpperCase()
    const empresaId = unidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID
    funcMap[f.id] = {
      ...f,
      ...fFolha,
      empresaId,
      unidade: unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE',
      cpfLimpo: f.doc ? f.doc.replace(/[^\d]/g, '') : null,
    }
  }

  const tercDefs = [
    {
      backupKey: '1',
      nome: 'RAIMUNDO MARIANO DA SILVA JUNIOR',
      empresaId: SJE_ID,
      unidade: 'SJE',
      bruto: 4270,
      pix: 'raimundojunior100@gmail.com',
      conta: '',
    },
    {
      backupKey: '0',
      nome: 'MARCIO LUAN DA SILVA',
      empresaId: MONTEIRO_ID,
      unidade: 'MONTEIRO',
      bruto: 0,
      pix: '12175804410',
      conta: '',
    },
  ]

  function esc(val) {
    if (val === null || val === undefined) return 'NULL'
    return `'${String(val).replace(/'/g, "''")}'`
  }

  const comps = Object.keys(lanc).sort()

  let sql = `-- Migration: Importar todos os lançamentos da Folha de Pagamento do Backup GC MIX (2023-07 a 2026-09)
-- Multi-empresa (SJE e Monteiro), garantindo idempotência e cálculo exato das regras do backup legado.

DO $$
BEGIN
`

  for (const comp of comps) {
    const [anoStr, mesStr] = comp.split('-')
    const ano = parseInt(anoStr, 10)
    const mes = parseInt(mesStr, 10)
    const funcsLanc = lanc[comp].func || {}
    const tercLanc = lanc[comp].terc || {}

    for (const empId of [SJE_ID, MONTEIRO_ID]) {
      sql += `
  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('${empId}', '${comp}', ${ano}, ${mes}, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
`

      const rows = []

      // Funcionários
      for (const [funcId, fL] of Object.entries(funcsLanc)) {
        if (funcId === '__novo' || funcId === 'undefined') continue
        const fCad = funcMap[funcId]
        if (!fCad || fCad.empresaId !== empId) continue

        const obras = Number(fL.obras || 0)
        const valorObra = Number(fL.valorObra ?? 20)
        const producao = obras * valorObra
        const limp = Number(fL.limp || 0)
        const sab = Number(fL.sab || 0)
        const fer = Number(fL.fer || 0)
        const ajuda = Number(fL.ajuda || 0)
        const vendObra = Number(fL.vendObra || 0)
        let comissao = Number(fL.vendCom || 0)
        if (comissao === 0 && vendObra > 0) {
          comissao = Math.round(vendObra * 0.005 * 100) / 100
        }
        const vendAjuda = Number(fL.vendAjuda || 0)
        const adiant = Number(fL.adiant || 0)
        const gratif = Number(fL.gratif || 0)
        const bruto = Number(fCad.bruto || 0)
        const filhos = Number(fCad.filhos || 0)

        // FÓRMULA DO LÍQUIDO (do legado):
        // bruto − INSS − IR + família + gratificação + produção + limpeza + sábado + férias + ajuda + vendAjuda + comissão − adiantamento
        const inss = 0
        const ir = 0
        const familia = 0
        const totalProventos =
          bruto + familia + gratif + producao + limp + sab + fer + ajuda + vendAjuda + comissao
        const totalDescontos = adiant + inss + ir
        const liquido =
          Math.round(
            (bruto -
              inss -
              ir +
              familia +
              gratif +
              producao +
              limp +
              sab +
              fer +
              ajuda +
              vendAjuda +
              comissao -
              adiant) *
              100,
          ) / 100
        const comissaoCalc = Math.round(vendObra * 0.005 * 100) / 100
        const modoCalculo =
          vendObra > 0 && Math.abs(comissao - comissaoCalc) > 0.01 ? 'Digitado' : 'Calculado'

        rows.push({
          empresa_id: empId,
          competencia: comp,
          nome: fCad.nome.trim().toUpperCase(),
          cargo: (fCad.funcao || 'Geral').trim().toUpperCase(),
          tipo: 'Funcionario',
          funcao: (fCad.funcao || 'Geral').trim().toUpperCase(),
          unidade: fCad.unidade,
          bruto,
          salario_base: bruto,
          filhos,
          conta: fCad.conta || '',
          chave_pix: fCad.pix || '',
          pix: fCad.pix || '',
          obras,
          valor_obra: valorObra,
          producao,
          limpeza: limp,
          sabado: sab,
          ferias: fer,
          ajuda_custo: ajuda,
          vendas_obra: vendObra,
          comissao,
          vendas_ajuda: vendAjuda,
          adiantamento: adiant,
          gratificacao: gratif,
          total_proventos: totalProventos,
          total_descontos: totalDescontos,
          salario_liquido: liquido,
          mensal_liquido: liquido,
          modo_calculo: modoCalculo,
          oculto: Boolean(fCad.oculto),
          inativo: Boolean(fCad.inativo),
          backup_id: funcId,
          cpf: fCad.cpfLimpo || null,
        })
      }

      // Terceiros
      for (const t of tercDefs) {
        if (t.empresaId !== empId) continue
        const tL = tercLanc[t.backupKey]
        const vendObra = Number(tL?.vendObra || 0)
        let comissao = Number(tL?.vendCom || 0)
        if (comissao === 0 && vendObra > 0) {
          comissao = Math.round(vendObra * 0.005 * 100) / 100
        }
        const vendAjuda = Number(tL?.vendAjuda || 0)
        const adiant = Number(tL?.adiant || 0)
        const gratif = Number(tL?.gratif || 0)
        const ajudaCusto = vendAjuda
        const bruto = t.bruto
        const totalProventos = bruto + comissao + ajudaCusto + gratif
        const totalDescontos = adiant
        const liquido = Math.round((totalProventos - totalDescontos) * 100) / 100

        if (tL || bruto > 0 || vendObra > 0) {
          rows.push({
            empresa_id: empId,
            competencia: comp,
            nome: t.nome.trim().toUpperCase(),
            cargo: 'Terceiro',
            tipo: 'Terceiro',
            funcao: 'Terceiro',
            unidade: t.unidade,
            bruto,
            salario_base: bruto,
            filhos: 0,
            conta: t.conta,
            chave_pix: t.pix,
            pix: t.pix,
            obras: 0,
            valor_obra: 20,
            producao: 0,
            limpeza: 0,
            sabado: 0,
            ferias: 0,
            ajuda_custo: ajudaCusto,
            vendas_obra: vendObra,
            comissao,
            vendas_ajuda: vendAjuda,
            adiantamento: adiant,
            gratificacao: gratif,
            total_proventos: totalProventos,
            total_descontos: totalDescontos,
            salario_liquido: liquido,
            mensal_liquido: liquido,
            modo_calculo:
              vendObra > 0 && Math.abs(comissao - Math.round(vendObra * 0.005 * 100) / 100) > 0.01
                ? 'Digitado'
                : 'Calculado',
            oculto: false,
            inativo: false,
            backup_id: `terc_${t.backupKey}`,
            cpf: null,
          })
        }
      }

      if (rows.length > 0) {
        sql += `  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
`
        const valLines = rows.map((r) => {
          return `    ('${r.empresa_id}'::uuid, ${esc(r.competencia)}, ${esc(r.nome)}, ${esc(r.cargo)}, ${esc(r.tipo)}, ${esc(r.funcao)}, ${esc(r.unidade)}, ${r.bruto}, ${r.salario_base}, ${r.filhos}, ${esc(r.conta)}, ${esc(r.chave_pix)}, ${esc(r.pix)}, ${r.obras}, ${r.valor_obra}, ${r.producao}, ${r.limpeza}, ${r.sabado}, ${r.ferias}, ${r.ajuda_custo}, ${r.vendas_obra}, ${r.comissao}, ${r.vendas_ajuda}, ${r.adiantamento}, ${r.gratificacao}, ${r.total_proventos}, ${r.total_descontos}, ${r.salario_liquido}, ${r.mensal_liquido}, ${esc(r.modo_calculo)}, ${r.oculto}, ${r.inativo}, ${esc(r.backup_id)}, ${esc(r.cpf)})`
        })

        sql += valLines.join(',\n')
        sql += `
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
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
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();
`
      }
    }
  }

  // Vincula funcionario_id pelo nome ou cpf onde existir
  sql += `
  -- Vincula funcionario_id existente nas linhas
  UPDATE public.folha_pagamento_linhas l
  SET funcionario_id = f.id
  FROM public.funcionarios f
  WHERE l.empresa_id = f.empresa_id
    AND lower(trim(l.nome)) = lower(trim(f.nome))
    AND l.funcionario_id IS NULL;

  -- Recalcula totais em todas as competências
  UPDATE public.folha_competencias c
  SET
    total_colaboradores = COALESCE(s.cont, 0),
    total_proventos = COALESCE(s.tot_prov, 0),
    total_descontos = COALESCE(s.tot_desc, 0),
    total_liquido = COALESCE(s.tot_liq, 0),
    updated_at = now()
  FROM (
    SELECT
      competencia_id,
      count(*) as cont,
      sum(total_proventos) as tot_prov,
      sum(total_descontos) as tot_desc,
      sum(mensal_liquido) as tot_liq
    FROM public.folha_pagamento_linhas
    GROUP BY competencia_id
  ) s
  WHERE c.id = s.competencia_id;

END $$;
`

  const outPath = path.resolve(rootDir, 'supabase/migrations/20260928033000_seed_lancamentos_folha.sql')
  fs.writeFileSync(outPath, sql, 'utf8')
  console.log(`Migration gerada: ${sql.length} bytes, ${sql.split('\n').length} linhas em ${outPath}`)
  return { sql, comps, countComps: comps.length }
}

export function gerarChunksSQL(chunkSize = 3) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const rootDir = path.resolve(__dirname, '..')

  const backupCandidates = [
    path.resolve(rootDir, 'src/assets/backup-folha-2026-09-28-46d43.json'),
    path.resolve(rootDir, 'src/assets/backup-folha-2026-09-27-40a44.json'),
  ]
  const backupPath = backupCandidates.find((p) => fs.existsSync(p))
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

  const cadFuncs = backupData.cadastros?.funcionarios || []
  const folhaFuncs = backupData.folha?.func || {}
  const lanc = backupData.folha?.lanc || {}

  const SJE_ID = '22222222-2222-2222-2222-222222222222'
  const MONTEIRO_ID = '11111111-1111-1111-1111-111111111111'

  const funcMap = {}
  for (const f of cadFuncs) {
    const fFolha = folhaFuncs[f.id] || {}
    const unidade = (fFolha.unidade || f.unidade || 'SJE').toUpperCase()
    const empresaId = unidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID
    funcMap[f.id] = {
      ...f,
      ...fFolha,
      empresaId,
      unidade: unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE',
      cpfLimpo: f.doc ? f.doc.replace(/[^\d]/g, '') : null,
    }
  }

  const tercDefs = [
    {
      backupKey: '1',
      nome: 'RAIMUNDO MARIANO DA SILVA JUNIOR',
      empresaId: SJE_ID,
      unidade: 'SJE',
      bruto: 4270,
      pix: 'raimundojunior100@gmail.com',
      conta: '',
    },
    {
      backupKey: '0',
      nome: 'MARCIO LUAN DA SILVA',
      empresaId: MONTEIRO_ID,
      unidade: 'MONTEIRO',
      bruto: 0,
      pix: '12175804410',
      conta: '',
    },
  ]

  function esc(val) {
    if (val === null || val === undefined) return 'NULL'
    return `'${String(val).replace(/'/g, "''")}'`
  }

  const comps = Object.keys(lanc).sort()
  const chunks = []
  for (let i = 0; i < comps.length; i += chunkSize) {
    chunks.push(comps.slice(i, i + chunkSize))
  }

  return chunks.map((group, groupIdx) => {
    let sql = `-- Migration: Importar lote ${groupIdx + 1} da Folha (${group.join(', ')})
DO $$
BEGIN
`
    for (const comp of group) {
      const [anoStr, mesStr] = comp.split('-')
      const ano = parseInt(anoStr, 10)
      const mes = parseInt(mesStr, 10)
      const funcsLanc = lanc[comp].func || {}
      const tercLanc = lanc[comp].terc || {}

      for (const empId of [SJE_ID, MONTEIRO_ID]) {
        sql += `
  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('${empId}', '${comp}', ${ano}, ${mes}, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
`

        const rows = []

        // Funcionários
        for (const [funcId, fL] of Object.entries(funcsLanc)) {
          if (funcId === '__novo' || funcId === 'undefined') continue
          const fCad = funcMap[funcId]
          if (!fCad || fCad.empresaId !== empId) continue

          const obras = Number(fL.obras || 0)
          const valorObra = Number(fL.valorObra ?? 20)
          const producao = obras * valorObra
          const limp = Number(fL.limp || 0)
          const sab = Number(fL.sab || 0)
          const fer = Number(fL.fer || 0)
          const ajuda = Number(fL.ajuda || 0)
          const vendObra = Number(fL.vendObra || 0)
          let comissao = Number(fL.vendCom || 0)
          if (comissao === 0 && vendObra > 0) {
            comissao = Math.round(vendObra * 0.005 * 100) / 100
          }
          const vendAjuda = Number(fL.vendAjuda || 0)
          const adiant = Number(fL.adiant || 0)
          const gratif = Number(fL.gratif || 0)
          const bruto = Number(fCad.bruto || 0)
          const filhos = Number(fCad.filhos || 0)

          const inss = 0
          const ir = 0
          const familia = 0
          const totalProventos =
            bruto + familia + gratif + producao + limp + sab + fer + ajuda + vendAjuda + comissao
          const totalDescontos = adiant + inss + ir
          const liquido =
            Math.round(
              (bruto -
                inss -
                ir +
                familia +
                gratif +
                producao +
                limp +
                sab +
                fer +
                ajuda +
                vendAjuda +
                comissao -
                adiant) *
                100,
            ) / 100
          const comissaoCalc = Math.round(vendObra * 0.005 * 100) / 100
          const modoCalculo =
            vendObra > 0 && Math.abs(comissao - comissaoCalc) > 0.01 ? 'Digitado' : 'Calculado'

          rows.push({
            empresa_id: empId,
            competencia: comp,
            nome: fCad.nome.trim().toUpperCase(),
            cargo: (fCad.funcao || 'Geral').trim().toUpperCase(),
            tipo: 'Funcionario',
            funcao: (fCad.funcao || 'Geral').trim().toUpperCase(),
            unidade: fCad.unidade,
            bruto,
            salario_base: bruto,
            filhos,
            conta: fCad.conta || '',
            chave_pix: fCad.pix || '',
            pix: fCad.pix || '',
            obras,
            valor_obra: valorObra,
            producao,
            limpeza: limp,
            sabado: sab,
            ferias: fer,
            ajuda_custo: ajuda,
            vendas_obra: vendObra,
            comissao,
            vendas_ajuda: vendAjuda,
            adiantamento: adiant,
            gratificacao: gratif,
            total_proventos: totalProventos,
            total_descontos: totalDescontos,
            salario_liquido: liquido,
            mensal_liquido: liquido,
            modo_calculo: modoCalculo,
            oculto: Boolean(fCad.oculto),
            inativo: Boolean(fCad.inativo),
            backup_id: funcId,
            cpf: fCad.cpfLimpo || null,
          })
        }

        // Terceiros
        for (const t of tercDefs) {
          if (t.empresaId !== empId) continue
          const tL = tercLanc[t.backupKey]
          const vendObra = Number(tL?.vendObra || 0)
          let comissao = Number(tL?.vendCom || 0)
          if (comissao === 0 && vendObra > 0) {
            comissao = Math.round(vendObra * 0.005 * 100) / 100
          }
          const vendAjuda = Number(tL?.vendAjuda || 0)
          const adiant = Number(tL?.adiant || 0)
          const gratif = Number(tL?.gratif || 0)
          const ajudaCusto = vendAjuda
          const bruto = t.bruto
          const totalProventos = bruto + comissao + ajudaCusto + gratif
          const totalDescontos = adiant
          const liquido = Math.round((totalProventos - totalDescontos) * 100) / 100

          if (tL || bruto > 0 || vendObra > 0) {
            rows.push({
              empresa_id: empId,
              competencia: comp,
              nome: t.nome.trim().toUpperCase(),
              cargo: 'Terceiro',
              tipo: 'Terceiro',
              funcao: 'Terceiro',
              unidade: t.unidade,
              bruto,
              salario_base: bruto,
              filhos: 0,
              conta: t.conta,
              chave_pix: t.pix,
              pix: t.pix,
              obras: 0,
              valor_obra: 20,
              producao: 0,
              limpeza: 0,
              sabado: 0,
              ferias: 0,
              ajuda_custo: ajudaCusto,
              vendas_obra: vendObra,
              comissao,
              vendas_ajuda: vendAjuda,
              adiantamento: adiant,
              gratificacao: gratif,
              total_proventos: totalProventos,
              total_descontos: totalDescontos,
              salario_liquido: liquido,
              mensal_liquido: liquido,
              modo_calculo:
                vendObra > 0 && Math.abs(comissao - Math.round(vendObra * 0.005 * 100) / 100) > 0.01
                  ? 'Digitado'
                  : 'Calculado',
              oculto: false,
              inativo: false,
              backup_id: `terc_${t.backupKey}`,
              cpf: null,
            })
          }
        }

        if (rows.length > 0) {
          sql += `  INSERT INTO public.folha_pagamento_linhas (
      empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
      bruto, salario_base, filhos, conta, chave_pix, pix,
      obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
      vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
      total_proventos, total_descontos, salario_liquido, mensal_liquido,
      modo_calculo, oculto, inativo, backup_id, cpf
    )
    SELECT
      v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
      v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
      v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
      v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
      v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
      v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
    FROM (VALUES
  `
          const valLines = rows.map((r) => {
            return `    ('${r.empresa_id}'::uuid, ${esc(r.competencia)}, ${esc(r.nome)}, ${esc(r.cargo)}, ${esc(r.tipo)}, ${esc(r.funcao)}, ${esc(r.unidade)}, ${r.bruto}, ${r.salario_base}, ${r.filhos}, ${esc(r.conta)}, ${esc(r.chave_pix)}, ${esc(r.pix)}, ${r.obras}, ${r.valor_obra}, ${r.producao}, ${r.limpeza}, ${r.sabado}, ${r.ferias}, ${r.ajuda_custo}, ${r.vendas_obra}, ${r.comissao}, ${r.vendas_ajuda}, ${r.adiantamento}, ${r.gratificacao}, ${r.total_proventos}, ${r.total_descontos}, ${r.salario_liquido}, ${r.mensal_liquido}, ${esc(r.modo_calculo)}, ${r.oculto}, ${r.inativo}, ${esc(r.backup_id)}, ${esc(r.cpf)})`
          })

          sql += valLines.join(',\n')
          sql += `
    ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
    JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
    ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
    DO UPDATE SET
      competencia_id = EXCLUDED.competencia_id,
      cargo = EXCLUDED.cargo,
      tipo = EXCLUDED.tipo,
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
      cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
      updated_at = now();
  `
        }
      }
    }

    sql += `
    UPDATE public.folha_pagamento_linhas l
    SET funcionario_id = f.id
    FROM public.funcionarios f
    WHERE l.empresa_id = f.empresa_id
      AND lower(trim(l.nome)) = lower(trim(f.nome))
      AND l.funcionario_id IS NULL;

    UPDATE public.folha_competencias c
    SET
      total_colaboradores = COALESCE(s.cont, 0),
      total_proventos = COALESCE(s.tot_prov, 0),
      total_descontos = COALESCE(s.tot_desc, 0),
      total_liquido = COALESCE(s.tot_liq, 0),
      updated_at = now()
    FROM (
      SELECT
        competencia_id,
        count(*) as cont,
        sum(total_proventos) as tot_prov,
        sum(total_descontos) as tot_desc,
        sum(mensal_liquido) as tot_liq
      FROM public.folha_pagamento_linhas
      GROUP BY competencia_id
    ) s
    WHERE c.id = s.competencia_id;

  END $$;
  `
    return { group, sql, ordinal: groupIdx + 1 }
  })
}

if (process.argv[1] && (process.argv[1].endsWith('gerar-seed-lancamentos.js') || process.argv[1].endsWith('gerar-seed-lancamentos.mjs'))) {
  gerarMigrationSeed()
}
