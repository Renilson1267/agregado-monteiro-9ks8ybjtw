/**
 * Script de importação dos dados do backup legado da folha de pagamento GC MIX
 * Executável via Node.js:
 *   node scripts/importar-folha-backup.mjs
 *
 * Utiliza as credenciais de ambiente do Supabase (VITE_SUPABASE_URL / SUPABASE_URL e
 * VITE_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY).
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const backupCandidates = [
  path.resolve('scripts/backup-folha-2026-09-27-40a44.json'),
  path.resolve('src/assets/backup-folha-2026-09-27-40a44.json'),
]

let backupPath = backupCandidates.find((p) => fs.existsSync(p))
if (!backupPath) {
  console.error('Arquivo de backup não encontrado em scripts/ nem em src/assets/')
  process.exit(1)
}

const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://sje-concreteira.supabase.co'
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

const SJE_ID = '22222222-2222-2222-2222-222222222222'
const MONTEIRO_ID = '11111111-1111-1111-1111-111111111111'

async function run() {
  console.log('Iniciando importação da folha GC MIX...')

  const cadFuncs = backupData.cadastros?.funcionarios || []
  const folhaFuncs = backupData.folha?.func || {}
  const terceiros = backupData.folha?.terceiros || []
  const lanc = backupData.folha?.lanc || {}

  console.log(`Processando ${cadFuncs.length} funcionários do cadastro...`)
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

    const payload = {
      empresa_id: empresaId,
      nome: f.nome.trim().toUpperCase(),
      funcao: (f.funcao || 'Geral').trim().toUpperCase(),
      cpf: f.doc ? f.doc.replace(/[^\d]/g, '') : null,
      data_admissao: f.admissao || null,
      ativo: !fFolha.inativo,
      observacoes: fFolha.obs || null,
      telefone: f.telefone || null,
      email: f.email || null,
      bruto: Number(fFolha.bruto || 0),
      filhos: parseInt(String(fFolha.filhos || 0), 10) || 0,
      conta: fFolha.conta || '',
      pix: fFolha.pix || '',
      inativo: Boolean(fFolha.inativo),
      oculto: Boolean(fFolha.oculto),
      unidade: unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE',
    }

    const { error } = await supabase
      .from('funcionarios')
      .upsert(payload, { onConflict: 'empresa_id,nome' })

    if (error) {
      console.warn(`Aviso upsert funcionario ${f.nome}:`, error.message)
    }
  }

  console.log(`Processando ${terceiros.length} terceiros...`)
  for (const t of terceiros) {
    const unidade = (t.unidade || 'SJE').toUpperCase()
    const empresaId = unidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID

    const payload = {
      empresa_id: empresaId,
      nome: t.nome.trim().toUpperCase(),
      bruto: Number(t.bruto || 0),
      conta: t.conta || '',
      pix: t.pix || '',
      obs: t.obs || '',
      unidade: unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE',
      ativo: true,
    }

    const { error } = await supabase
      .from('folha_terceiros')
      .upsert(payload, { onConflict: 'empresa_id,nome' })

    if (error) {
      console.warn(`Aviso upsert terceiro ${t.nome}:`, error.message)
    }
  }

  console.log('Importando competências e lançamentos...')
  const comps = Object.keys(lanc).sort()

  for (const comp of comps) {
    const [ano, mes] = comp.split('-').map(Number)
    const funcsLanc = lanc[comp].func || {}
    const tercLanc = lanc[comp].terc || {}

    for (const empId of [SJE_ID, MONTEIRO_ID]) {
      // Cria ou recupera a competência
      const { data: compData, error: compErr } = await supabase
        .from('folha_competencias')
        .upsert(
          {
            empresa_id: empId,
            competencia: comp,
            ano,
            mes,
            status: 'ABERTA',
            observacoes: 'Importado do backup legado',
          },
          { onConflict: 'empresa_id,competencia' }
        )
        .select('id')
        .single()

      if (compErr) {
        console.warn(`Erro comp ${comp} (${empId}):`, compErr.message)
        continue
      }

      const compId = compData.id

      // Linhas funcionários
      const linhasParaInserir = []
      for (const [funcId, fL] of Object.entries(funcsLanc)) {
        if (funcId === '__novo' || funcId === 'undefined') continue
        const fCad = funcMap[funcId]
        if (!fCad || fCad.empresaId !== empId) continue

        const obras = Number(fL.obras || 0)
        const valorObra = Number(fL.valorObra || 20)
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

        const totalProventos =
          bruto + producao + limp + sab + fer + ajuda + comissao + gratif + vendAjuda
        const totalDescontos = adiant
        const liquido = totalProventos - totalDescontos

        linhasParaInserir.push({
          empresa_id: empId,
          competencia_id: compId,
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
          modo_calculo: 'Calculado',
          oculto: Boolean(fCad.oculto),
          inativo: Boolean(fCad.inativo),
          backup_id: funcId,
          cpf: fCad.cpfLimpo || null,
        })
      }

      // Linhas terceiros
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
          nome: 'Marcio Luan da Silva',
          empresaId: MONTEIRO_ID,
          unidade: 'MONTEIRO',
          bruto: 0,
          pix: '12175804410',
          conta: '',
        },
      ]

      for (const t of tercDefs) {
        if (t.empresaId !== empId) continue
        const tL = tercLanc[t.backupKey] || {}
        const vendObra = Number(tL.vendObra || 0)
        const comissao = Number(tL.vendCom || 0)
        const vendAjuda = Number(tL.vendAjuda || 0)
        const ajudaCusto = vendAjuda
        const bruto = t.bruto
        const totalProventos = bruto + comissao + ajudaCusto
        const liquido = totalProventos

        linhasParaInserir.push({
          empresa_id: empId,
          competencia_id: compId,
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
          adiantamento: 0,
          gratificacao: 0,
          total_proventos: totalProventos,
          total_descontos: 0,
          salario_liquido: liquido,
          mensal_liquido: liquido,
          modo_calculo: 'Calculado',
          oculto: false,
          inativo: false,
          backup_id: `terc_${t.backupKey}`,
        })
      }

      if (linhasParaInserir.length > 0) {
        const { error: upsertErr } = await supabase
          .from('folha_pagamento_linhas')
          .upsert(linhasParaInserir, {
            onConflict: 'empresa_id,competencia,nome',
          })
        if (upsertErr) {
          console.warn(`Erro linhas comp ${comp} (${empId}):`, upsertErr.message)
        }
      }
    }
  }

  console.log('Importação concluída!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
