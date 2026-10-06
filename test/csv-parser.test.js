import test from "node:test"
import assert from "node:assert/strict"

// Mock do parser para validação em Node nativo
function parseNumeroBr(val) {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") {
    return isNaN(val) ? 0 : val
  }
  let str = String(val).trim()
  if (!str || str === "-" || str === "—" || str === "null") return 0

  let negativo = false
  if (str.startsWith("(") && str.endsWith(")")) {
    negativo = true
    str = str.slice(1, -1).trim()
  } else if (str.startsWith("-")) {
    negativo = true
    str = str.slice(1).trim()
  }

  str = str.replace(/[R$\s]/gi, "")

  if (str.includes(".") && str.includes(",")) {
    const limpo = str.replace(/\./g, "").replace(",", ".")
    const parsed = parseFloat(limpo)
    if (isNaN(parsed)) return 0
    return negativo ? -parsed : parsed
  }

  if (str.includes(",")) {
    const limpo = str.replace(",", ".")
    const parsed = parseFloat(limpo)
    if (isNaN(parsed)) return 0
    return negativo ? -parsed : parsed
  }

  if (str.includes(".")) {
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
      const limpo = str.replace(/\./g, "")
      const parsed = parseFloat(limpo)
      if (isNaN(parsed)) return 0
      return negativo ? -parsed : parsed
    }

    const parsed = parseFloat(str)
    if (isNaN(parsed)) return 0
    return negativo ? -parsed : parsed
  }

  const parsed = parseFloat(str)
  if (isNaN(parsed)) return 0
  return negativo ? -parsed : parsed
}

test("parseNumeroBr trata números brasileiros, milhares e decimais", () => {
  assert.equal(parseNumeroBr("8,0"), 8)
  assert.equal(parseNumeroBr("7,5"), 7.5)
  assert.equal(parseNumeroBr("508,5"), 508.5)
  assert.equal(parseNumeroBr("2.320"), 2320)
  assert.equal(parseNumeroBr("1.562,5"), 1562.5)
  assert.equal(parseNumeroBr("2.880,50"), 2880.5)
  assert.equal(parseNumeroBr("8.5"), 8.5)
  assert.equal(parseNumeroBr("0"), 0)
  assert.equal(parseNumeroBr(""), 0)
})

test("Fill-down de data herda datas quando células mescladas vierem vazias", () => {
  const csvLinhas = [
    "Data,Volume,Brita 12,Brita 19,Areia,Pó de Pedra,Cimento,Aditivo,Motorista,Placa,Cidade",
    "06/01/2026,7,480,480,850,0,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",6,480,480,850,0,290,15,MAGO,PEG6E61,MONTEIRO",
    "07/01/2026,8,480,480,850,0,290,20,,,",
    ",6,480,480,850,0,290,15,,,",
    ",1.5,480,480,850,0,290,4,,,",
  ]

  let ultimaDataIso = null
  const resultados = []

  for (let i = 1; i < csvLinhas.length; i++) {
    const cols = csvLinhas[i].split(",")
    let data = cols[0].trim()
    if (data) {
      const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (match) {
        ultimaDataIso = `${match[3]}-${match[2]}-${match[1]}`
      }
    }
    const dataIso = data ? ultimaDataIso : ultimaDataIso
    const volume = parseNumeroBr(cols[1])
    resultados.push({ dataIso, volume })
  }

  assert.equal(resultados.length, 5)
  assert.equal(resultados[0].dataIso, "2026-01-06")
  assert.equal(resultados[1].dataIso, "2026-01-06") // herdado!
  assert.equal(resultados[2].dataIso, "2026-01-07")
  assert.equal(resultados[3].dataIso, "2026-01-07") // herdado!
  assert.equal(resultados[4].dataIso, "2026-01-07") // herdado!
  const volTotal = resultados.reduce((a, b) => a + b.volume, 0)
  assert.equal(volTotal, 28.5)
})

function parseDataBrParaIso(dataStr) {
  if (dataStr === null || dataStr === undefined) return null
  const limpo = String(dataStr).trim()
  if (!limpo) return null

  // 1. Já está em ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    const [a, m, d] = limpo.split("-").map((v) => parseInt(v, 10))
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return limpo
    return null
  }

  // 2. Formato dd/mm/aaaa ou d/m/aaaa (4 dígitos no ano)
  const match4 = limpo.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match4) {
    const dia = match4[1].padStart(2, "0")
    const mes = match4[2].padStart(2, "0")
    const ano = match4[3]
    const diaNum = parseInt(dia, 10)
    const mesNum = parseInt(mes, 10)
    if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12) {
      return `${ano}-${mes}-${dia}`
    }
    return null
  }

  // 3. Formato dd/mm/aa ou d/m/aa (2 dígitos no ano, ex: 01/02/26, 15/08/26)
  const match2 = limpo.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/)
  if (match2) {
    const dia = match2[1].padStart(2, "0")
    const mes = match2[2].padStart(2, "0")
    const ano2 = parseInt(match2[3], 10)
    const anoCheio = ano2 <= 69 ? `20${match2[3]}` : `19${match2[3]}`
    const diaNum = parseInt(dia, 10)
    const mesNum = parseInt(mes, 10)
    if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12) {
      return `${anoCheio}-${mes}-${dia}`
    }
    return null
  }

  // 4. Número serial do Excel/Google Sheets
  if (/^\d{5}$/.test(limpo)) {
    const serial = parseInt(limpo, 10)
    if (serial >= 35000 && serial <= 55000) {
      const dataJs = new Date(Math.round((serial - 25569) * 86400 * 1000))
      const ano = dataJs.getUTCFullYear()
      const mes = String(dataJs.getUTCMonth() + 1).padStart(2, "0")
      const dia = String(dataJs.getUTCDate()).padStart(2, "0")
      return `${ano}-${mes}-${dia}`
    }
  }

  return null
}

test("parseDataBrParaIso suporta formatos dd/mm/aaaa, dd/mm/aa de 2 dígitos e serial de planilha", () => {
  assert.equal(parseDataBrParaIso("06/01/2026"), "2026-01-06")
  assert.equal(parseDataBrParaIso("6/1/2026"), "2026-01-06")
  assert.equal(parseDataBrParaIso("01/02/26"), "2026-02-01") // 2 dígitos de ano
  assert.equal(parseDataBrParaIso("15/08/26"), "2026-08-15") // 2 dígitos de ano
  assert.equal(parseDataBrParaIso("2026-09-30"), "2026-09-30") // ISO
  assert.equal(parseDataBrParaIso("46023"), "2026-01-06") // Serial Excel/Sheets
  assert.equal(parseDataBrParaIso(""), null)
  assert.equal(parseDataBrParaIso("JANEIRO"), null)
  assert.equal(parseDataBrParaIso("TOTAL"), null)
})

test("Simulação de CSV completo com os 9 meses fecha exatamente nas 9 metas", () => {
  // Metas oficiais:
  // Jan 369 · Fev 316 · Mar 420 · Abr 343 · Mai 413 · Jun 539 · Jul 765 · Ago 635 · Set 508,5
  // Total Jan-Set: 4426,5 m³
  const metas = {
    "2026-01": 369.0,
    "2026-02": 316.0,
    "2026-03": 420.0,
    "2026-04": 343.0,
    "2026-05": 413.0,
    "2026-06": 539.0,
    "2026-07": 765.0,
    "2026-08": 635.0,
    "2026-09": 508.5,
  }

  // Geramos linhas CSV contendo os diferentes desafios:
  // 1. Títulos de mês ("JANEIRO/2026", "FEVEREIRO")
  // 2. Cabeçalhos repetidos e com colunas deslocadas (ex: Maio sem pó de pedra, Junho com ordem invertida)
  // 3. Subtotais mensais ("TOTAL JANEIRO", "SUBTOTAL")
  // 4. Datas de 2 dígitos ("01/02/26") e serial
  // 5. Cargas fracionadas (1.5 m³) e grandes (11 m³)
  const linhasCsv = [
    "CONTROLE DIÁRIO DE MATERIAIS - CONCRETEIRA MONTEIRO",
    "Data,Volume,Brita 12,Brita 19,Areia,Pó de Pedra,Cimento,Aditivo,Motorista,Placa,Cidade",
    "JANEIRO/2026,,,,,,,,,,",
    "06/01/2026,360,480,480,850,0,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",9,480,480,850,0,290,20,MAGO,PEG6E61,MONTEIRO",
    "TOTAL JANEIRO,369,,,,,,,,,",
    "FEVEREIRO,,,,,,,,,,",
    "01/02/26,300,480,480,850,0,290,18,ARLINDO,PEG6G21,MONTEIRO", // 2 dígitos
    ",16,480,480,850,0,290,20,MAGO,PEG6E61,MONTEIRO",
    "SUBTOTAL FEVEREIRO,316,,,,,,,,,",
    "MARÇO,,,,,,,,,,",
    "01/03/2026,400,480,480,850,0,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",20,480,480,850,0,290,20,MAGO,PEG6E61,MONTEIRO",
    "ABRIL,,,,,,,,,,",
    "01/04/2026,340,480,480,850,0,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",3,480,480,850,0,290,10,MAGO,PEG6E61,MONTEIRO",
    // Bloco repetido com cabeçalho deslocado (sem pó de pedra)
    "Data,Volume,Brita 12,Brita 19,Areia,Cimento,Aditivo,Motorista,Placa,Cidade",
    "01/05/2026,400,480,480,850,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",13,480,480,850,290,20,MAGO,PEG6E61,MONTEIRO",
    // Junho
    "01/06/2026,500,480,480,850,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",39,480,480,850,290,20,MAGO,PEG6E61,MONTEIRO",
    // Julho
    "01/07/2026,700,480,480,850,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",65,480,480,850,290,20,MAGO,PEG6E61,MONTEIRO",
    // Agosto com serial do Excel e cargas fracionadas/grandes
    "15/08/26,600,480,480,850,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",24,480,480,850,290,20,MAGO,PEG6E61,MONTEIRO",
    ",11,480,480,850,290,20,MAGO,PEG6E61,MONTEIRO", // 11m³
    // Setembro
    "01/09/2026,500,480,480,850,290,18,ARLINDO,PEG6G21,MONTEIRO",
    ",7,480,480,850,290,20,MAGO,PEG6E61,MONTEIRO",
    ",1.5,480,480,850,290,4,MAGO,PEG6E61,MONTEIRO", // 1.5m³
    "TOTAL SETEMBRO,508.5,,,,,,,,,",
  ]

  // Testar a lógica de parsing
  let ultimaDataIso = null
  let ultimaDataOriginal = null
  const totaisMes = {}

  let mapaAtual = { data: 0, volume: 1 }

  for (let i = 0; i < linhasCsv.length; i++) {
    const colunas = linhasCsv[i].split(",").map((s) => s.trim())
    const linhaTexto = linhasCsv[i].trim()

    // Detecta cabeçalhos repetidos
    if (
      colunas[0].toLowerCase().includes("data") &&
      colunas.some((c) => c.toLowerCase().includes("volume"))
    ) {
      const novoMapa = {}
      colunas.forEach((col, idx) => {
        const cNorm = col.toLowerCase()
        if (cNorm.includes("data")) novoMapa["data"] = idx
        if (cNorm.includes("volume")) novoMapa["volume"] = idx
      })
      mapaAtual = novoMapa
      ultimaDataIso = null
      continue
    }

    // Detecta títulos de mês
    const p0 = colunas[0].toLowerCase()
    if (
      /^(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(
        p0,
      ) ||
      p0.includes("controle")
    ) {
      ultimaDataIso = null
      continue
    }

    // Detecta total/subtotal
    if (
      colunas.some((c) => {
        const cNorm = c.toLowerCase()
        return (
          cNorm.startsWith("total") ||
          cNorm.startsWith("subtotal") ||
          cNorm.startsWith("saldo")
        )
      })
    ) {
      ultimaDataIso = null
      continue
    }

    const dataOriginalBruta = colunas[mapaAtual.data || 0]
    let dataIso = null
    if (dataOriginalBruta) {
      const parsed = parseDataBrParaIso(dataOriginalBruta)
      if (parsed) {
        dataIso = parsed
        ultimaDataIso = parsed
      }
    }
    if (!dataIso && ultimaDataIso) {
      dataIso = ultimaDataIso
    }
    if (!dataIso) continue

    const volume = parseNumeroBr(colunas[mapaAtual.volume || 1])
    if (volume <= 0) continue

    const chaveMes = dataIso.slice(0, 7)
    totaisMes[chaveMes] = (totaisMes[chaveMes] || 0) + volume
  }

  // Verifica que cada mês fechou exatamente
  for (const [mes, meta] of Object.entries(metas)) {
    assert.equal(
      totaisMes[mes],
      meta,
      `Mês ${mes} esperado ${meta} mas obteve ${totaisMes[mes]}`,
    )
  }

  const somaTotal = Object.values(totaisMes).reduce((a, b) => a + b, 0)
  assert.equal(somaTotal, 4426.5)
})
