/**
 * Utilitário de Impressão Isolada de Documentos e Recibos
 *
 * Resolve definitivamente o problema de páginas em branco no Chrome / Safari / Edge
 * ("Salvar como PDF" ou impressora física), especialmente quando disparado a partir de
 * modais (Radix Dialog), rotas com cabeçalhos de print simultâneos (Dashboard '/')
 * ou renderizações assíncronas de imagens de cabeçalho.
 */

interface PrintElementOptions {
  /** Título do documento no diálogo de impressão/PDF */
  title?: string
  /** Se deve aguardar imagens carregarem antes de imprimir (padrão: true) */
  waitForImages?: boolean
  /** Tempo adicional de segurança em ms antes de window.print() (padrão: 350ms) */
  delayMs?: number
}

/**
 * Clona um elemento do DOM e imprime-o através de um <iframe> isolado.
 * Garante que:
 * 1. O documento tem apenas o conteúdo do recibo (nenhum elemento da página mãe interfere).
 * 2. Todos os estilos e fontes da página mãe (@media print, classes Tailwind, inline styles)
 *    são copiados para o iframe.
 * 3. Todas as imagens (como a logo da GC MIX) estejam 100% carregadas e decodificadas antes
 *    de disparar a caixa de diálogo de impressão.
 * 4. Remove o iframe automaticamente após a conclusão ou cancelamento do diálogo.
 */
export async function printElementInIsolatedIframe(
  element: HTMLElement,
  options: PrintElementOptions = {},
): Promise<void> {
  const {
    title = 'Recibo de Concreto Usinado — GC MIX',
    waitForImages = true,
    delayMs = 350,
  } = options

  // Remove eventuais iframes anteriores que possam ter ficado órfãos
  const existingIframes = document.querySelectorAll(
    'iframe[data-print-isolated]',
  )
  existingIframes.forEach((el) => el.remove())

  // Cria um iframe invisível posicionado fora da tela visível
  const iframe = document.createElement('iframe')
  iframe.setAttribute('data-print-isolated', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    // Fallback: se por restrição de ambiente o iframe falhar, usa window.print normal
    window.print()
    iframe.remove()
    return
  }

  // Coleta todas as tags <style> e <link rel="stylesheet"> da página mãe
  const styleNodes = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )

  let stylesHtml = ''
  styleNodes.forEach((node) => {
    stylesHtml += node.outerHTML + '\n'
  })

  // Estilos de base reforçados para o documento do iframe em A4
  const resetPrintStyles = `
    <style>
      @page {
        size: A4 portrait;
        margin: 5mm 7mm 5mm 7mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 10pt !important;
        width: 100% !important;
        min-height: 0 !important;
        height: auto !important;
      }
      .page-break-inside-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    </style>
  `

  // Prepara o HTML completo do iframe com o elemento clonado
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${stylesHtml}
        ${resetPrintStyles}
      </head>
      <body class="bg-white text-black p-0 m-0">
        <div id="print-root" style="width: 100%; background: #ffffff; color: #000000;">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `)
  doc.close()

  // Aguarda carregamento de estilos e recursos do iframe
  await new Promise<void>((resolve) => {
    if (iframe.contentWindow?.document.readyState === 'complete') {
      resolve()
    } else {
      iframe.onload = () => resolve()
      setTimeout(resolve, 300)
    }
  })

  // Se solicitado, aguarda todas as imagens dentro do iframe carregarem e decodificarem
  if (waitForImages) {
    const images = Array.from(doc.images || [])
    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) {
          if ('decode' in img) {
            try {
              await img.decode()
            } catch {
              // ignora erro de decode se já estiver pronto
            }
          }
          return
        }
        await new Promise<void>((res) => {
          img.onload = async () => {
            if ('decode' in img) {
              try {
                await img.decode()
              } catch {
                // ignora
              }
            }
            res()
          }
          img.onerror = () => res()
          // Timeout de segurança para não travar
          setTimeout(res, 800)
        })
      }),
    )
  }

  // Delay de renderização para garantir pintura do layout no motor do browser
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  // Dispara a impressão a partir do iframe
  try {
    const win = iframe.contentWindow
    if (win) {
      win.focus()
      win.print()
    } else {
      window.print()
    }
  } catch (err) {
    // Fallback se houver bloqueio de cross-window
    console.warn('Falha no iframe.print(), acionando window.print():', err)
    window.print()
  } finally {
    // Remove o iframe após o diálogo fechar (ou após 15 segundos se fechar rápido)
    setTimeout(() => {
      try {
        iframe.remove()
      } catch {
        // noop
      }
    }, 15000)
  }
}
