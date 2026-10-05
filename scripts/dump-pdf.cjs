const fs = require("fs")
const zlib = require("zlib")

const buf = fs.readFileSync(
  "src/assets/agregadosn-monteiro-google-planilhas-2157c.pdf",
)
const str = buf.toString("latin1")

let pos = 0
let streamCount = 0
let textChunks = []

while (true) {
  const streamStart =
    str.indexOf("stream\r\n", pos) !== -1
      ? str.indexOf("stream\r\n", pos) + 8
      : str.indexOf("stream\n", pos) !== -1
        ? str.indexOf("stream\n", pos) + 7
        : -1
  if (streamStart === -1) break
  const streamEnd = str.indexOf("endstream", streamStart)
  if (streamEnd === -1) break

  const raw = buf.slice(streamStart, streamEnd)
  streamCount++
  try {
    const decompressed = zlib.inflateSync(raw)
    const decStr = decompressed.toString("latin1")
    if (
      decStr.includes("BT") ||
      decStr.includes("Tj") ||
      decStr.includes("TJ")
    ) {
      textChunks.push(decStr)
    }
  } catch (e) {
    const rawStr = raw.toString("latin1")
    if (rawStr.includes("BT") || rawStr.includes("Tj")) {
      textChunks.push(rawStr)
    }
  }
  pos = streamEnd + 9
}

console.log(`Found ${streamCount} streams, ${textChunks.length} text chunks`)
fs.writeFileSync(
  "scripts/extracted_raw.txt",
  textChunks.join("\n---STREAM---\n"),
)
console.log("Wrote scripts/extracted_raw.txt")
