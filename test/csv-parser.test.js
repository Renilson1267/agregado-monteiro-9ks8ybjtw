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
