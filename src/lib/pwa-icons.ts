// Utilitário para sintetizar e salvar os arquivos de ícone PNG PWA em Base64
// e injetar dinamicamente se necessário, além de manter os binários em public/

// Gera um PNG RGBA válido a partir de dados brutos utilizando a estrutura padrão PNG (IHDR, IDAT, IEND)
// com compressão uncompressed DEFLATE válida RFC 1951 (sem depender de módulos externos)

// CRC32 table
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1)
    else c = c >>> 1
  }
  CRC_TABLE[n] = c
}

function calcCrc(buf: Uint8Array, offset: number, length: number): number {
  let c = 0xffffffff
  for (let i = 0; i < length; i++) {
    c = CRC_TABLE[(c ^ buf[offset + i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function calcAdler32(buf: Uint8Array, offset: number, length: number): number {
  let a = 1
  let b = 0
  const MOD = 65521
  for (let i = 0; i < length; i++) {
    a = (a + buf[offset + i]) % MOD
    b = (b + a) % MOD
  }
  return ((b << 16) | a) >>> 0
}

/**
 * Cria um PNG básico RGBA válido compatível com qualquer navegador e instalador PWA
 */
export function buildPngDataUri(
  width: number,
  height: number,
  pixelFn: (x: number, y: number) => [number, number, number, number],
): string {
  const rowBytes = width * 4 + 1
  const rawData = new Uint8Array(height * rowBytes)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes
    rawData[rowOffset] = 0 // Filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y)
      const pxOffset = rowOffset + 1 + x * 4
      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = a
    }
  }

  // Empacota em blocos DEFLATE uncompressed (tipo 00)
  // Cada bloco pode ter no máximo 65535 bytes
  const MAX_BLOCK = 65535
  const numBlocks = Math.ceil(rawData.length / MAX_BLOCK)
  const zlibHeaderLen = 2
  const zlibFooterLen = 4
  const deflateDataLen =
    zlibHeaderLen + numBlocks * 5 + rawData.length + zlibFooterLen

  const idatData = new Uint8Array(deflateDataLen)
  // Zlib header (CMF = 0x78, FLG = 0x01)
  idatData[0] = 0x78
  idatData[1] = 0x01

  let inOffset = 0
  let outOffset = 2

  for (let b = 0; b < numBlocks; b++) {
    const isLast = b === numBlocks - 1
    const blockLen = Math.min(MAX_BLOCK, rawData.length - inOffset)

    idatData[outOffset++] = isLast ? 0x01 : 0x00
    idatData[outOffset++] = blockLen & 0xff
    idatData[outOffset++] = (blockLen >> 8) & 0xff
    const nlen = ~blockLen & 0xffff
    idatData[outOffset++] = nlen & 0xff
    idatData[outOffset++] = (nlen >> 8) & 0xff

    idatData.set(rawData.subarray(inOffset, inOffset + blockLen), outOffset)
    inOffset += blockLen
    outOffset += blockLen
  }

  // Adler32
  const adler = calcAdler32(rawData, 0, rawData.length)
  idatData[outOffset++] = (adler >> 24) & 0xff
  idatData[outOffset++] = (adler >> 16) & 0xff
  idatData[outOffset++] = (adler >> 8) & 0xff
  idatData[outOffset++] = adler & 0xff

  // Montagem do PNG
  // 8 (sig) + 25 (IHDR chunk) + (12 + idatData.length) (IDAT chunk) + 12 (IEND chunk)
  const totalLen = 8 + 25 + (12 + idatData.length) + 12
  const png = new Uint8Array(totalLen)
  let p = 0

  // 1. Signature
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  png.set(sig, p)
  p += 8

  // 2. IHDR
  function writeChunk(typeStr: string, data: Uint8Array) {
    const len = data.length
    png[p++] = (len >> 24) & 0xff
    png[p++] = (len >> 16) & 0xff
    png[p++] = (len >> 8) & 0xff
    png[p++] = len & 0xff

    const typeStart = p
    for (let i = 0; i < 4; i++) {
      png[p++] = typeStr.charCodeAt(i)
    }

    png.set(data, p)
    p += len

    const crc = calcCrc(png, typeStart, 4 + len)
    png[p++] = (crc >> 24) & 0xff
    png[p++] = (crc >> 16) & 0xff
    png[p++] = (crc >> 8) & 0xff
    png[p++] = crc & 0xff
  }

  const ihdr = new Uint8Array(13)
  ihdr[0] = (width >> 24) & 0xff
  ihdr[1] = (width >> 16) & 0xff
  ihdr[2] = (width >> 8) & 0xff
  ihdr[3] = width & 0xff

  ihdr[4] = (height >> 24) & 0xff
  ihdr[5] = (height >> 16) & 0xff
  ihdr[6] = (height >> 8) & 0xff
  ihdr[7] = height & 0xff

  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: 6 = RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  writeChunk("IHDR", ihdr)
  writeChunk("IDAT", idatData)
  writeChunk("IEND", new Uint8Array(0))

  // Converter para base64
  let binary = ""
  const len = png.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(png[i])
  }
  return `data:image/png;base64,${btoa(binary)}`
}

/**
 * Retorna os bytes puros do PNG gerado para salvar em disco
 */
export function buildPngBytes(
  width: number,
  height: number,
  pixelFn: (x: number, y: number) => [number, number, number, number],
): Uint8Array {
  const rowBytes = width * 4 + 1
  const rawData = new Uint8Array(height * rowBytes)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes
    rawData[rowOffset] = 0 // Filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y)
      const pxOffset = rowOffset + 1 + x * 4
      rawData[pxOffset] = r
      rawData[pxOffset + 1] = g
      rawData[pxOffset + 2] = b
      rawData[pxOffset + 3] = a
    }
  }

  const MAX_BLOCK = 65535
  const numBlocks = Math.ceil(rawData.length / MAX_BLOCK)
  const zlibHeaderLen = 2
  const zlibFooterLen = 4
  const deflateDataLen =
    zlibHeaderLen + numBlocks * 5 + rawData.length + zlibFooterLen

  const idatData = new Uint8Array(deflateDataLen)
  idatData[0] = 0x78
  idatData[1] = 0x01

  let inOffset = 0
  let outOffset = 2

  for (let b = 0; b < numBlocks; b++) {
    const isLast = b === numBlocks - 1
    const blockLen = Math.min(MAX_BLOCK, rawData.length - inOffset)

    idatData[outOffset++] = isLast ? 0x01 : 0x00
    idatData[outOffset++] = blockLen & 0xff
    idatData[outOffset++] = (blockLen >> 8) & 0xff
    const nlen = ~blockLen & 0xffff
    idatData[outOffset++] = nlen & 0xff
    idatData[outOffset++] = (nlen >> 8) & 0xff

    idatData.set(rawData.subarray(inOffset, inOffset + blockLen), outOffset)
    inOffset += blockLen
    outOffset += blockLen
  }

  const adler = calcAdler32(rawData, 0, rawData.length)
  idatData[outOffset++] = (adler >> 24) & 0xff
  idatData[outOffset++] = (adler >> 16) & 0xff
  idatData[outOffset++] = (adler >> 8) & 0xff
  idatData[outOffset++] = adler & 0xff

  const totalLen = 8 + 25 + (12 + idatData.length) + 12
  const png = new Uint8Array(totalLen)
  let p = 0

  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  png.set(sig, p)
  p += 8

  function writeChunk(typeStr: string, data: Uint8Array) {
    const len = data.length
    png[p++] = (len >> 24) & 0xff
    png[p++] = (len >> 16) & 0xff
    png[p++] = (len >> 8) & 0xff
    png[p++] = len & 0xff

    const typeStart = p
    for (let i = 0; i < 4; i++) {
      png[p++] = typeStr.charCodeAt(i)
    }

    png.set(data, p)
    p += len

    const crc = calcCrc(png, typeStart, 4 + len)
    png[p++] = (crc >> 24) & 0xff
    png[p++] = (crc >> 16) & 0xff
    png[p++] = (crc >> 8) & 0xff
    png[p++] = crc & 0xff
  }

  const ihdr = new Uint8Array(13)
  ihdr[0] = (width >> 24) & 0xff
  ihdr[1] = (width >> 16) & 0xff
  ihdr[2] = (width >> 8) & 0xff
  ihdr[3] = width & 0xff

  ihdr[4] = (height >> 24) & 0xff
  ihdr[5] = (height >> 16) & 0xff
  ihdr[6] = (height >> 8) & 0xff
  ihdr[7] = height & 0xff

  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  writeChunk("IHDR", ihdr)
  writeChunk("IDAT", idatData)
  writeChunk("IEND", new Uint8Array(0))

  return png
}

/**
 * Função gráfica oficial para desenhar o ícone GC MIX
 */
export function getGcMixPixelColor(
  x: number,
  y: number,
  width: number,
  height: number,
  isMaskable = false,
): [number, number, number, number] {
  const nx = (x / width) * 2 - 1
  const ny = (y / height) * 2 - 1
  const dist = Math.sqrt(nx * nx + ny * ny)

  const bgBlueDark = [13, 27, 42, 255]
  const bgBlueMid = [27, 46, 75, 255]
  const brightBlue = [14, 165, 233, 255]
  const deepBlue = [2, 132, 199, 255]
  const orange = [249, 115, 22, 255]
  const amber = [245, 158, 11, 255]
  const white = [255, 255, 255, 255]

  const grad = Math.min(1, Math.max(0, dist * 0.7))
  let r = Math.round(bgBlueDark[0] * (1 - grad) + bgBlueMid[0] * grad)
  let g = Math.round(bgBlueDark[1] * (1 - grad) + bgBlueMid[1] * grad)
  let b = Math.round(bgBlueDark[2] * (1 - grad) + bgBlueMid[2] * grad)
  const a = 255

  const scale = isMaskable ? 0.75 : 0.85
  const sx = nx / scale
  const sy = ny / scale

  // Tambor misturador
  const drumCenterX = 0.0
  const drumCenterY = -0.22
  const dx = sx - drumCenterX
  const dy = (sy - drumCenterY) * 1.05
  const drumDist = Math.sqrt(dx * dx + dy * dy)
  const drumRadius = 0.46

  if (drumDist < drumRadius) {
    const angle = Math.atan2(dy, dx)
    const stripe = Math.sin(angle * 4 + drumDist * 8)
    const isCenter = drumDist < 0.18

    if (isCenter) {
      r = amber[0]
      g = amber[1]
      b = amber[2]
    } else if (stripe > 0.25) {
      r = orange[0]
      g = orange[1]
      b = orange[2]
    } else if (stripe > -0.25) {
      r = white[0]
      g = white[1]
      b = white[2]
    } else {
      r = deepBlue[0]
      g = deepBlue[1]
      b = deepBlue[2]
    }

    if (drumDist > drumRadius - 0.035) {
      r = white[0]
      g = white[1]
      b = white[2]
    }
  }

  // Anel
  const ringDist = Math.abs(drumDist - 0.52)
  if (ringDist < 0.025 && (dy < 0.35 || Math.abs(dx) > 0.2)) {
    r = brightBlue[0]
    g = brightBlue[1]
    b = brightBlue[2]
  }

  // Tipografia "GC MIX"
  const textY = sy - 0.44
  if (textY >= -0.15 && textY <= 0.15 && Math.abs(sx) <= 0.72) {
    const inG = isPixelInCharG(sx, textY)
    const inC = isPixelInCharC(sx, textY)
    const inM = isPixelInCharM(sx, textY)
    const inI = isPixelInCharI(sx, textY)
    const inX = isPixelInCharX(sx, textY)

    if (inG || inC || inM || inI || inX) {
      r = 255
      g = 255
      b = 255
    }
  }

  // Faixa inferior
  const subY = sy - 0.7
  if (Math.abs(subY) <= 0.018 && Math.abs(sx) <= 0.55) {
    r = amber[0]
    g = amber[1]
    b = amber[2]
  }

  return [r, g, b, a]
}

function isPixelInCharG(x: number, y: number) {
  if (x < -0.64 || x > -0.4 || y < -0.14 || y > 0.14) return false
  const th = 0.045
  if (y <= -0.14 + th) return true
  if (y >= 0.14 - th) return true
  if (x <= -0.64 + th) return true
  if (x >= -0.4 - th && y >= 0.0) return true
  if (y >= -0.01 && y <= 0.035 && x >= -0.52) return true
  return false
}

function isPixelInCharC(x: number, y: number) {
  if (x < -0.36 || x > -0.14 || y < -0.14 || y > 0.14) return false
  const th = 0.045
  if (y <= -0.14 + th) return true
  if (y >= 0.14 - th) return true
  if (x <= -0.36 + th) return true
  return false
}

function isPixelInCharM(x: number, y: number) {
  if (x < -0.08 || x > 0.18 || y < -0.14 || y > 0.14) return false
  const th = 0.042
  if (x <= -0.08 + th || x >= 0.18 - th) return true
  const midX = 0.05
  const distV = Math.abs(Math.abs(x - midX) - (y + 0.14) * 0.45)
  if (distV < 0.03 && y <= 0.08) return true
  return false
}

function isPixelInCharI(x: number, y: number) {
  if (x < 0.24 || x > 0.32 || y < -0.14 || y > 0.14) return false
  return true
}

function isPixelInCharX(x: number, y: number) {
  if (x < 0.38 || x > 0.62 || y < -0.14 || y > 0.14) return false
  const midX = 0.5
  const dx = x - midX
  const dy = y * 0.85
  if (Math.abs(dx - dy) < 0.045 || Math.abs(dx + dy) < 0.045) return true
  return false
}
