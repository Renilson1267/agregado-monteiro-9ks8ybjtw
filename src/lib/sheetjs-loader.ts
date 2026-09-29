/**
 * Loader dinâmico para SheetJS (xlsx.full.min.js) via CDN de alta disponibilidade (cdnjs / jsdelivr)
 * Permite leitura de arquivos .xlsx e .xls em tempo de execução sem inflar o bundle estático do app.
 */

declare global {
  interface Window {
    XLSX?: any
  }
}

let scriptCarregandoPromise: Promise<any> | null = null

export async function carregarSheetJs(): Promise<any> {
  if (typeof window !== "undefined" && window.XLSX) {
    return window.XLSX
  }

  if (scriptCarregandoPromise) {
    return scriptCarregandoPromise
  }

  scriptCarregandoPromise = new Promise((resolve, reject) => {
    // 1. Tentar carregar do CDN cdnjs
    const script = document.createElement("script")
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
    script.async = true
    script.crossOrigin = "anonymous"

    script.onload = () => {
      if (window.XLSX) {
        resolve(window.XLSX)
      } else {
        tentarFallback()
      }
    }

    script.onerror = () => {
      tentarFallback()
    }

    function tentarFallback() {
      const fallbackScript = document.createElement("script")
      fallbackScript.src =
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
      fallbackScript.async = true
      fallbackScript.crossOrigin = "anonymous"

      fallbackScript.onload = () => {
        if (window.XLSX) {
          resolve(window.XLSX)
        } else {
          reject(new Error("SheetJS não pôde ser inicializado pelo CDN."))
        }
      }

      fallbackScript.onerror = () => {
        reject(
          new Error(
            "Não foi possível carregar o motor de leitura XLSX do CDN. Verifique a conexão com a internet.",
          ),
        )
      }

      document.head.appendChild(fallbackScript)
    }

    document.head.appendChild(script)
  })

  return scriptCarregandoPromise
}
