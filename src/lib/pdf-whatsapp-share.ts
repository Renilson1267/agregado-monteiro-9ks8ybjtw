/**
 * Utilitário de Geração e Compartilhamento de PDF para Relatórios GC MIX
 *
 * Converte elementos DOM (documentos A4 da GC MIX) em arquivos PDF reais válidos (padrão PDF-1.4 com JPEG)
 * e oferece integração nativa com Web Share API (navigator.share com files) para envio direto ao WhatsApp,
 * além do fallback com download automático do arquivo + abertura do link wa.me com a mensagem oficial.
 */

interface PDFObject {
  id: number
  dict: Record<string, any>
  stream: Uint8Array | null
}

function parseJpegDimensions(
  bytes: Uint8Array,
): {
  width: number
  height: number
  colorSpace: string
} {
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("JPEG inválido: marcador SOI ausente")
  }
  let i = 2
  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xff) {
      i++
      continue
    }
    const marker = bytes[i + 1]
    if (marker === 0xda) break // Início do fluxo comprimido SOS
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (isSof) {
      if (i + 9 >= bytes.length) break
      const height = (bytes[i + 5] << 8) | bytes[i + 6]
      const width = (bytes[i + 7] << 8) | bytes[i + 8]
      const c = bytes[i + 9]
      return {
        width,
        height,
        colorSpace:
          c === 1 ? "/DeviceGray" : c === 4 ? "/DeviceCMYK" : "/DeviceRGB",
      }
    }
    if (i + 3 >= bytes.length) break
    const len = (bytes[i + 2] << 8) | bytes[i + 3]
    i += 2 + len
  }
  throw new Error("Marcador SOF do JPEG não encontrado")
}

function serializePdfVal(val: any): string {
  if (val === null || val === undefined) return "null"
  if (typeof val === "boolean") return val ? "true" : "false"
  if (typeof val === "number")
    return Number.isInteger(val) ? String(val) : val.toFixed(4)
  if (typeof val === "string") return val
  if (Array.isArray(val)) return "[" + val.map(serializePdfVal).join(" ") + "]"
  if (val && typeof val === "object" && val.__ref) return `${val.id} 0 R`
  if (typeof val === "object") {
    const pairs = Object.entries(val)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `/${k} ${serializePdfVal(v)}`)
    return "<<\n" + pairs.join("\n") + "\n>>"
  }
  return String(val)
}

/**
 * Cria um arquivo PDF A4 (595.28 x 841.89 pt) contendo a imagem JPEG passada.
 */
export function createA4PdfFromJpeg(jpegBytes: Uint8Array): Uint8Array {
  // A4 em pontos (72 pt / pol)
  const a4Width = 595.28
  const a4Height = 841.89

  const {
    width: imgW,
    height: imgH,
    colorSpace,
  } = parseJpegDimensions(jpegBytes)

  // Ajusta a escala da imagem mantendo aspecto para caber na página A4 com margens elegantes
  const marginPt = 14.17 // 5mm
  const usableW = a4Width - marginPt * 2
  const usableH = a4Height - marginPt * 2

  const ratioW = usableW / imgW
  const ratioH = usableH / imgH
  const scale = Math.min(ratioW, ratioH)

  const renderW = Math.round(imgW * scale * 100) / 100
  const renderH = Math.round(imgH * scale * 100) / 100

  // Centraliza na página A4
  const posX = Math.round(((a4Width - renderW) / 2) * 100) / 100
  const posY = Math.round(((a4Height - renderH) / 2) * 100) / 100

  const objects: PDFObject[] = []
  let nextId = 1
  const addObj = (
    dict: Record<string, any>,
    stream: Uint8Array | null = null,
  ) => {
    const id = nextId++
    objects.push({ id, dict, stream })
    return { __ref: true, id }
  }

  // Operações de desenho do PDF (coloca o XObject /Im0 nas coordenadas calculadas)
  const streamOps = [
    "q",
    `${renderW.toFixed(2)} 0 0 ${renderH.toFixed(2)} ${posX.toFixed(2)} ${posY.toFixed(2)} cm`,
    "/Im0 Do",
    "Q",
  ].join("\n")

  const enc = new TextEncoder()
  const contentBytes = enc.encode(streamOps)
  const contentRef = addObj({ Length: contentBytes.length }, contentBytes)

  const imageRef = addObj(
    {
      Type: "/XObject",
      Subtype: "/Image",
      Width: imgW,
      Height: imgH,
      ColorSpace: colorSpace,
      BitsPerComponent: 8,
      Filter: "/DCTDecode",
      Length: jpegBytes.length,
    },
    jpegBytes,
  )

  const pageRef = addObj({
    Type: "/Page",
    Parent: null,
    MediaBox: [0, 0, a4Width, a4Height],
    Contents: contentRef,
    Resources: {
      XObject: {
        Im0: imageRef,
      },
    },
  })

  const pagesRef = addObj({
    Type: "/Pages",
    Kids: [pageRef],
    Count: 1,
  })

  // Atualiza o parent da página
  const pageObj = objects.find((o) => o.id === pageRef.id)
  if (pageObj) pageObj.dict.Parent = pagesRef

  const catalogRef = addObj({
    Type: "/Catalog",
    Pages: pagesRef,
  })

  // Serializa todos os objetos e a tabela de referências cruzadas
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let byteOffset = 0

  const header = enc.encode("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n")
  byteOffset += header.length
  chunks.push(header)

  for (const obj of objects) {
    offsets[obj.id] = byteOffset
    const head = `${obj.id} 0 obj\n${serializePdfVal(obj.dict)}\n`
    if (obj.stream) {
      const a = enc.encode(head + "stream\n")
      const b = obj.stream
      const c = enc.encode("\nendstream\nendobj\n")
      byteOffset += a.length + b.length + c.length
      chunks.push(a, b, c)
    } else {
      const b = enc.encode(head + "endobj\n")
      byteOffset += b.length
      chunks.push(b)
    }
  }

  const xrefOffset = byteOffset
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    xref += String(offsets[i] || 0).padStart(10, "0") + " 00000 n \n"
  }
  xref += `trailer\n${serializePdfVal({ Size: objects.length + 1, Root: catalogRef })}\n`
  xref += `startxref\n${xrefOffset}\n%%EOF\n`
  chunks.push(enc.encode(xref))

  let totalLen = 0
  for (const c of chunks) totalLen += c.length
  const finalPdf = new Uint8Array(totalLen)
  let pos = 0
  for (const c of chunks) {
    finalPdf.set(c, pos)
    pos += c.length
  }

  return finalPdf
}

/**
 * Converte um elemento HTML em um Uint8Array contendo imagem JPEG desenhada em Canvas.
 * Usa ForeignObject SVG do navegador para renderizar o layout com fidelidade.
 */
export async function renderElementToJpegBytes(
  element: HTMLElement,
  options: {
    scale?: number
    quality?: number
    backgroundColor?: string
  } = {},
): Promise<Uint8Array> {
  const { scale = 2, quality = 0.95, backgroundColor = "#ffffff" } = options

  // Mede dimensões reais do elemento
  const rect = element.getBoundingClientRect()
  const width = Math.ceil(rect.width) || 794 // 794px ~ A4 96dpi
  const height = Math.ceil(rect.height) || 1123 // 1123px ~ A4 96dpi

  // Coleta folhas de estilo da página para que o SVG contenha as classes Tailwind e estilos A4
  const styleNodes = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
  let cssText = ""
  for (const node of styleNodes) {
    if (node.tagName.toLowerCase() === "style") {
      cssText += node.textContent + "\n"
    } else if (node.tagName.toLowerCase() === "link") {
      const link = node as HTMLLinkElement
      try {
        if (link.sheet) {
          const rules = Array.from(link.sheet.cssRules || [])
          for (const r of rules) cssText += r.cssText + "\n"
        }
      } catch {
        // Ignora cross-origin sheets se houver
      }
    }
  }

  // Prepara o clone do elemento limpo sem scroll e com background garantido
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.margin = "0"
  clone.style.width = `${width}px`
  clone.style.minHeight = `${height}px`
  clone.style.backgroundColor = backgroundColor
  clone.style.boxSizing = "border-box"

  // Função interna para montar o SVG e renderizar no Canvas com captura de erro tainted
  const tentarRenderizar = async (
    removerTodasImgs: boolean,
  ): Promise<Uint8Array> => {
    const cloneTrabalho = clone.cloneNode(true) as HTMLElement

    const imgs = Array.from(cloneTrabalho.querySelectorAll("img"))
    for (const img of imgs) {
      if (removerTodasImgs) {
        img.remove()
        continue
      }

      const src = img.getAttribute("src") || ""
      if (src.startsWith("data:")) {
        // Já é data URI válida
        continue
      }

      // Tenta obter src de imagem já carregada no DOM original correspondente via canvas local
      let converteu = false
      try {
        const imgsOriginais = Array.from(element.querySelectorAll("img"))
        const imgOriginal = imgsOriginais.find(
          (orig) => orig.getAttribute("src") === src || orig.src === img.src,
        )
        if (
          imgOriginal &&
          imgOriginal.complete &&
          imgOriginal.naturalWidth > 0
        ) {
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = imgOriginal.naturalWidth
          tempCanvas.height = imgOriginal.naturalHeight
          const tempCtx = tempCanvas.getContext("2d")
          if (tempCtx) {
            tempCtx.drawImage(imgOriginal, 0, 0)
            // Se toDataURL lançar SecurityError / Tainted canvas, o catch trata
            const dataUri = tempCanvas.toDataURL("image/png")
            img.setAttribute("src", dataUri)
            converteu = true
          }
        }
      } catch {
        converteu = false
      }

      // Se não virou data URI garantido, REMOVER a tag <img> para não contaminar o SVG/Canvas
      if (!converteu) {
        img.remove()
      }
    }

    // Serializa para XML
    const serializer = new XMLSerializer()
    const rawHtml = serializer.serializeToString(cloneTrabalho)

    // Escapar cssText para inclusão segura dentro de XML/SVG
    const safeCssText = cssText.replace(/&/g, "&amp;").replace(/</g, "&lt;")

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="background:${backgroundColor}; color:#000000; font-family: sans-serif;">
            <style>
              ${safeCssText}
              * { box-sizing: border-box !important; }
              body, html { margin: 0 !important; padding: 0 !important; background: ${backgroundColor} !important; }
            </style>
            ${rawHtml}
          </div>
        </foreignObject>
      </svg>
    `

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    })
    const svgUrl = URL.createObjectURL(svgBlob)

    return new Promise<Uint8Array>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = Math.floor(width * scale)
          canvas.height = Math.floor(height * scale)
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            URL.revokeObjectURL(svgUrl)
            reject(new Error("Não foi possível criar contexto 2D do Canvas"))
            return
          }

          // Fundo branco
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(svgUrl)

          // Tenta toBlob diretamente com salvaguarda de tainted canvas
          try {
            canvas.toBlob(
              async (blob) => {
                if (!blob) {
                  reject(new Error("Falha ao gerar blob JPEG do Canvas"))
                  return
                }
                const buffer = await blob.arrayBuffer()
                resolve(new Uint8Array(buffer))
              },
              "image/jpeg",
              quality,
            )
          } catch (blobErr) {
            reject(blobErr)
          }
        } catch (err) {
          URL.revokeObjectURL(svgUrl)
          reject(err)
        }
      }

      img.onerror = (e) => {
        URL.revokeObjectURL(svgUrl)
        reject(
          new Error("Falha ao renderizar SVG no objeto Image: " + String(e)),
        )
      }

      img.src = svgUrl
    })
  }

  // 1ª tentativa: com imagens em data URI
  try {
    return await tentarRenderizar(false)
  } catch (err: any) {
    console.warn(
      "renderElementToJpegBytes falhou na 1ª tentativa (possível tainted canvas ou erro de recurso). Erro:",
      err,
    )

    // Rede de segurança: se der erro de tainted canvas ou falha de renderização,
    // tenta de novo removendo TODAS as <img> do clone (PDF sai sem logo, mas sai) e avisar o usuário de forma amigável
    try {
      const fallbackBytes = await tentarRenderizar(true)
      console.info("PDF gerado com sucesso via fallback sem imagens.")
      if (
        typeof window !== "undefined" &&
        (window as any).__onPdfFallbackSemLogo
      ) {
        try {
          ;(window as any).__onPdfFallbackSemLogo()
        } catch {
          // ignora
        }
      }
      return fallbackBytes
    } catch (errFallback) {
      throw new Error(
        `Não foi possível exportar o documento para PDF: ${err?.message || errFallback}`,
      )
    }
  }
}

/**
 * Converte um elemento DOM em um File (tipo application/pdf)
 */
export async function convertElementToPdfFile(
  element: HTMLElement,
  nomeArquivo: string,
  options?: {
    onAvisoFallbackSemLogo?: () => void
  },
): Promise<File> {
  let acionouFallback = false
  if (typeof window !== "undefined") {
    ;(window as any).__onPdfFallbackSemLogo = () => {
      acionouFallback = true
      options?.onAvisoFallbackSemLogo?.()
    }
  }

  let jpegBytes: Uint8Array
  try {
    jpegBytes = await renderElementToJpegBytes(element, {
      scale: 2,
      quality: 0.95,
    })
  } finally {
    if (typeof window !== "undefined") {
      delete (window as any).__onPdfFallbackSemLogo
    }
  }

  const pdfBytes = createA4PdfFromJpeg(jpegBytes)
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer
  return new File([arrayBuffer], nomeArquivo, {
    type: "application/pdf",
  })
}

/**
 * Dispara o download de um arquivo no navegador
 */
export function downloadFile(file: File | Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 2000)
}

/**
 * Compartilha o arquivo PDF usando navigator.share({ files: [file] }) ou aciona fallback.
 *
 * Tratamento:
 * - Suporta navigator.canShare && navigator.canShare({ files: [file] })
 * - Erro AbortError (usuário cancelou a janela nativa de compartilhamento) é tratado silenciosamente.
 * - Caso não suporte arquivos ou dê erro não-abort, dispara fallback: baixa o PDF e abre wa.me.
 */
export async function compartilharPdfOuFallbackWhatsApp(params: {
  file: File
  telefoneWhatsApp: string // Ex: "5583981503316" ou "5587998061826"
  textoWhatsApp: string
  tituloShare?: string
  onFallbackAcionado?: () => void
  onSucessoCompartilhamento?: () => void
}): Promise<{ metodo: "native_share" | "fallback_download" | "aborted" }> {
  const {
    file,
    telefoneWhatsApp,
    textoWhatsApp,
    tituloShare = "Relatório Consolidado GC MIX",
    onFallbackAcionado,
    onSucessoCompartilhamento,
  } = params

  const linkWaMe = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(textoWhatsApp)}`

  // Verifica se o navegador tem suporte a Web Share API com arquivos
  const podeCompartilharArquivos =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })

  if (podeCompartilharArquivos) {
    try {
      await navigator.share({
        title: tituloShare,
        text: textoWhatsApp,
        files: [file],
      })
      onSucessoCompartilhamento?.()
      return { metodo: "native_share" }
    } catch (err: any) {
      // Se o usuário simplesmente cancelou o diálogo nativo (AbortError), sai silenciosamente
      if (err?.name === "AbortError") {
        return { metodo: "aborted" }
      }
      console.warn(
        "navigator.share falhou, acionando fallback de download e WhatsApp:",
        err,
      )
    }
  }

  // FALLBACK:
  // 1. Baixar o arquivo PDF com o nome especificado
  downloadFile(file, file.name)

  // 2. Copiar mensagem para clipboard se possível
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(textoWhatsApp)
    } catch {
      // silencioso
    }
  }

  // 3. Abrir wa.me com a mensagem de texto oficial
  window.open(linkWaMe, "_blank", "noopener,noreferrer")

  onFallbackAcionado?.()
  return { metodo: "fallback_download" }
}
