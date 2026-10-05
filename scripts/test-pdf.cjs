// Teste de leitura do PDF
const fs = require("fs")
const stats = fs.statSync(
  "src/assets/agregadosn-monteiro-google-planilhas-2157c.pdf",
)
console.log("PDF exists, size:", stats.size)
const buf = fs.readFileSync(
  "src/assets/agregadosn-monteiro-google-planilhas-2157c.pdf",
)
console.log("Header:", buf.slice(0, 100).toString("binary"))
