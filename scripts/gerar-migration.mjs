import fs from "fs"
import path from "path"

const backupPath = path.resolve("src/assets/backup-folha-2026-09-27-40a44.json")
const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"))

const SJE_ID = "22222222-2222-2222-2222-222222222222"
const MONTEIRO_ID = "11111111-1111-1111-1111-111111111111"

const cadFuncs = backupData.cadastros?.funcionarios || []
const folhaFuncs = backupData.folha?.func || {}
const lanc = backupData.folha?.lanc || {}

const funcMap = {}
for (const f of cadFuncs) {
  const fFolha = folhaFuncs[f.id] || {}
  const unidade = (fFolha.unidade || f.unidade || "SJE").toUpperCase()
  const empresaId = unidade.includes("MONTEIRO") ? MONTEIRO_ID : SJE_ID

  funcMap[f.id] = {
    ...f,
    ...fFolha,
    empresaId,
    unidade: unidade.includes("MONTEIRO") ? "MONTEIRO" : "SJE",
    cpfLimpo: f.doc ? f.doc.replace(/[^\d]/g, "") : null,
  }
}

const tercDefs = [
  {
    backupKey: "1",
    nome: "RAIMUNDO MARIANO DA SILVA JUNIOR",
    empresaId: SJE_ID,
    unidade: "SJE",
    bruto: 4270,
    pix: "raimundojunior100@gmail.com",
    conta: "",
  },
  {
    backupKey: "0",
    nome: "MARCIO LUAN DA SILVA",
    empresaId: MONTEIRO_ID,
    unidade: "MONTEIRO",
    bruto: 0,
    pix: "12175804410",
    conta: "",
  },
]

const comps = Object.keys(lanc).sort()

function escapeSql(str) {
  if (str === null || str === undefined) return "NULL"
  return "'" + String(str).replace(/'/g, "''") + "'"
}

let sql = `-- Migration: Importar lançamentos mensais da folha GC MIX de 2023-07 a 2026-09
-- Gerado a partir do backup JSON legado

DO $$
DECLARE
  v_sje_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_monteiro_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_comp_id uuid;
  v_func_id uuid;
BEGIN
`

for (const comp of comps) {
  const [ano, mes] = comp.split("-").map(Number)
  const funcsLanc = lanc[comp].func || {}
  const tercLanc = lanc[comp].terc || {}

  for (const empId of [SJE_ID, MONTEIRO_ID]) {
    const isSje = empId === SJE_ID
    const empVar = isSje ? "v_sje_id" : "v_monteiro_id"
    const empName = isSje ? "SJE" : "MONTEIRO"

    // Verifica se esta empresa tem lançamentos nessa competência
    const linhasParaEmpresa = []
    for (const [funcId, fL] of Object.entries(funcsLanc)) {
      if (funcId === "__novo" || funcId === "undefined") continue
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
      const inss = 0
      const ir = 0
      const familia = 0
      const quinzena = 0

      // FÓRMULA DO LÍQUIDO DO LEGADO (use exatamente esta):
      // líquido = bruto − INSS − IR + família + gratificação − quinzena − adiantamento + (soma das obras: obras × valor/obra) + limpeza + sábado + férias + ajuda + produção + comissão, onde comissão = 0,5% × vendas
      const totalAjuda = ajuda + vendAjuda
      const comissaoCalculada = Math.round(vendObra * 0.005 * 100) / 100
      const modoCalculo =
        vendObra > 0 && Math.abs(comissao - comissaoCalculada) > 0.01
          ? "Digitado"
          : "Calculado"

      const totalProventos =
        bruto + gratif + producao + limp + sab + fer + totalAjuda + comissao
      const totalDescontos = quinzena + adiant + inss + ir
      const liquido = totalProventos - totalDescontos

      linhasParaEmpresa.push({
        tipo: "Funcionario",
        nome: fCad.nome.trim().toUpperCase(),
        cargo: (fCad.funcao || "Geral").trim().toUpperCase(),
        funcao: (fCad.funcao || "Geral").trim().toUpperCase(),
        unidade: fCad.unidade,
        bruto,
        filhos,
        conta: fCad.conta || "",
        pix: fCad.pix || "",
        obras,
        valor_obra: valorObra,
        producao,
        limpeza: limp,
        sabado: sab,
        ferias: fer,
        ajuda_custo: totalAjuda,
        vendas_obra: vendObra,
        comissao,
        vendas_ajuda: vendAjuda,
        adiantamento: adiant,
        gratificacao: gratif,
        inss,
        ir,
        familia,
        quinzena,
        total_proventos: totalProventos,
        total_descontos: totalDescontos,
        salario_liquido: liquido,
        mensal_liquido: liquido,
        modo_calculo: modoCalculo,
        oculto: Boolean(fCad.oculto),
        inativo: Boolean(fCad.inativo),
        backup_id: funcId,
        cpf: fCad.cpfLimpo,
      })
    }

    // Terceiros
    for (const t of tercDefs) {
      if (t.empresaId !== empId) continue
      const tL = tercLanc[t.backupKey] || {}
      const vendObra = Number(tL.vendObra || 0)
      let comissao = Number(tL.vendCom || 0)
      if (comissao === 0 && vendObra > 0) {
        comissao = Math.round(vendObra * 0.005 * 100) / 100
      }
      const vendAjuda = Number(tL.vendAjuda || 0)
      const ajudaCusto = vendAjuda
      const bruto = t.bruto
      const comissaoCalculada = Math.round(vendObra * 0.005 * 100) / 100
      const modoCalculo =
        vendObra > 0 && Math.abs(comissao - comissaoCalculada) > 0.01
          ? "Digitado"
          : "Calculado"

      const totalProventos = bruto + comissao + ajudaCusto
      const liquido = totalProventos

      linhasParaEmpresa.push({
        tipo: "Terceiro",
        nome: t.nome.trim().toUpperCase(),
        cargo: "Terceiro",
        funcao: "Terceiro",
        unidade: t.unidade,
        bruto,
        filhos: 0,
        conta: t.conta,
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
        inss: 0,
        ir: 0,
        familia: 0,
        quinzena: 0,
        total_proventos: totalProventos,
        total_descontos: 0,
        salario_liquido: liquido,
        mensal_liquido: liquido,
        modo_calculo: modoCalculo,
        oculto: false,
        inativo: false,
        backup_id: `terc_${t.backupKey}`,
        cpf: null,
      })
    }

    if (linhasParaEmpresa.length === 0) continue

    sql += `
  -- Competência ${comp} para ${empName}
  SELECT id INTO v_comp_id FROM public.folha_competencias WHERE empresa_id = ${empVar} AND competencia = '${comp}';
  IF v_comp_id IS NULL THEN
    INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
    VALUES (${empVar}, '${comp}', ${ano}, ${mes}, 'ABERTA', 'Importado do backup legado')
    RETURNING id INTO v_comp_id;
  END IF;
`

    for (const l of linhasParaEmpresa) {
      sql += `
  SELECT id INTO v_func_id FROM public.funcionarios WHERE empresa_id = ${empVar} AND ${
    l.cpf
      ? `cpf = '${l.cpf}'`
      : `lower(trim(nome)) = lower(trim(${escapeSql(l.nome)}))`
  } LIMIT 1;

  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, funcionario_id,
    cpf, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    inss, ir, familia, quinzena,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, updated_at
  ) VALUES (
    ${empVar}, v_comp_id, '${comp}', v_func_id,
    ${escapeSql(l.cpf)}, ${escapeSql(l.nome)}, ${escapeSql(l.cargo)}, ${escapeSql(l.tipo)}, ${escapeSql(l.funcao)}, ${escapeSql(l.unidade)},
    ${l.bruto}, ${l.bruto}, ${l.filhos}, ${escapeSql(l.conta)}, ${escapeSql(l.pix)}, ${escapeSql(l.pix)},
    ${l.obras}, ${l.valor_obra}, ${l.producao}, ${l.limpeza}, ${l.sabado}, ${l.ferias}, ${l.ajuda_custo},
    ${l.vendas_obra}, ${l.comissao}, ${l.vendas_ajuda}, ${l.adiantamento}, ${l.gratificacao},
    ${l.inss}, ${l.ir}, ${l.familia}, ${l.quinzena},
    ${l.total_proventos}, ${l.total_descontos}, ${l.salario_liquido}, ${l.mensal_liquido},
    ${escapeSql(l.modo_calculo)}, ${l.oculto}, ${l.inativo}, ${escapeSql(l.backup_id)}, NOW()
  )
  ON CONFLICT (empresa_id, competencia, lower(trim(nome)))
  DO UPDATE SET
    funcionario_id = EXCLUDED.funcionario_id,
    cpf = EXCLUDED.cpf,
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
    inss = EXCLUDED.inss,
    ir = EXCLUDED.ir,
    familia = EXCLUDED.familia,
    quinzena = EXCLUDED.quinzena,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    updated_at = NOW();
`
    }

    // Atualiza totais na folha_competencias
    sql += `
  UPDATE public.folha_competencias
  SET
    total_colaboradores = (SELECT COUNT(*) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id),
    total_proventos = (SELECT COALESCE(SUM(total_proventos), 0) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id),
    total_descontos = (SELECT COALESCE(SUM(total_descontos), 0) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id),
    total_liquido = (SELECT COALESCE(SUM(mensal_liquido), 0) FROM public.folha_pagamento_linhas WHERE competencia_id = v_comp_id),
    updated_at = NOW()
  WHERE id = v_comp_id;
`
  }
}

sql += `
END $$;
`

const migrationPath = path.resolve(
  "supabase/migrations/20260928023500_import_lancamentos_backup.sql",
)
fs.writeFileSync(migrationPath, sql, "utf8")
console.log("Migration escrita com sucesso! Tamanho:", sql.length)
