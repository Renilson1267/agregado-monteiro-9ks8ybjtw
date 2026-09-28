/**
 * Script gerador de migration SQL a partir de src/assets/backup-folha-2026-09-27-40a44.json
 */
import fs from 'fs'
import path from 'path'

const backupPath = path.resolve('src/assets/backup-folha-2026-09-27-40a44.json')
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

const SJE_ID = '22222222-2222-2222-2222-222222222222'
const MONTEIRO_ID = '11111111-1111-1111-1111-111111111111'

const cadFuncs = backupData.cadastros?.funcionarios || []
const folhaFuncs = backupData.folha?.func || {}
const lanc = backupData.folha?.lanc || {}

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

// Terceiros
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

const comps = Object.keys(lanc).sort()
console.log(`Encontradas ${comps.length} competências:`, comps)

// Vamos analisar se há competências totalmente zeradas
const compStats = []
for (const c of comps) {
  const fL = lanc[c].func || {}
  const tL = lanc[c].terc || {}
  let totalValores = 0
  for (const [k, v] of Object.entries(fL)) {
    if (k === '__novo' || k === 'undefined') continue
    totalValores += (v.obras || 0) + (v.limp || 0) + (v.sab || 0) + (v.fer || 0) + (v.ajuda || 0) + (v.vendObra || 0) + (v.vendCom || 0) + (v.vendAjuda || 0) + (v.adiant || 0) + (v.gratif || 0)
  }
  for (const [k, v] of Object.entries(tL)) {
    totalValores += (v.vendObra || 0) + (v.vendCom || 0) + (v.vendAjuda || 0)
  }
  compStats.push({ comp: c, totalValores })
}
console.log('Estatísticas de competências:')
compStats.forEach(s => console.log(`${s.comp}: ${s.totalValores}`))
