/**
 * Utilitário de leitura e conversão de arquivos de planilha (.xlsx e .csv)
 * Carrega a biblioteca SheetJS sob demanda via CDN seguro com fallback para unpkg/jsdelivr,
 * permitindo interpretar arquivos XLSX com múltiplas abas diretamente no navegador sem dependências nativas pesadas.
 */

declare global {
  interface Window {
    XLSX?: any
  }
}

let sheetJsPromise: Promise<any> | null = null

export function carregarSheetJs(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("SheetJS só pode ser carregado no navegador."),
    )
  }

  if (window.XLSX) {
    return Promise.resolve(window.XLSX)
  }

  if (sheetJsPromise) {
    return sheetJsPromise
  }

  sheetJsPromise = new Promise((resolve, reject) => {
    // Lista de CDNs em ordem de preferência
    const cdnUrls = [
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
      "https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    ]

    let idx = 0

    const tentarProximo = () => {
      if (idx >= cdnUrls.length) {
        sheetJsPromise = null
        reject(
          new Error(
            "Não foi possível carregar a biblioteca de leitura de arquivos Excel (.xlsx). Verifique a conexão com a internet.",
          ),
        )
        return
      }

      const url = cdnUrls[idx++]
      const script = document.createElement("script")
      script.src = url
      script.async = true

      script.onload = () => {
        if (window.XLSX) {
          resolve(window.XLSX)
        } else {
          tentarProximo()
        }
      }

      script.onerror = () => {
        script.remove()
        tentarProximo()
      }

      document.head.appendChild(script)
    }

    tentarProximo()
  })

  return sheetJsPromise
}

export interface ResultadoLeituraPlanilha {
  conteudoCsv: string
  nomesAbas: string[]
  ehXlsx: boolean
}

/**
 * Converte um arquivo (ArrayBuffer ou texto) em formato CSV textual unificado,
 * percorrendo todas as abas caso seja um XLSX.
 */
export async function lerArquivoParaCsv(
  file: File,
): Promise<ResultadoLeituraPlanilha> {
  const nomeLower = file.name.toLowerCase()
  const ehXlsx = nomeLower.endsWith(".xlsx") || nomeLower.endsWith(".xls")

  if (!ehXlsx) {
    // É CSV ou texto delimitado
    const texto = await file.text()
    return {
      conteudoCsv: texto,
      nomesAbas: ["Arquivo CSV"],
      ehXlsx: false,
    }
  }

  // Carrega SheetJS para ler o XLSX binário
  const XLSX = await carregarSheetJs()
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
    cellText: false,
  })

  const nomesAbas = workbook.SheetNames || []
  if (nomesAbas.length === 0) {
    throw new Error(
      "A pasta de trabalho Excel não contém nenhuma planilha/aba.",
    )
  }

  // Converte cada aba para CSV, incluindo cabeçalho/marcador de aba para o parser
  const partesCsv: string[] = []

  nomesAbas.forEach((nomeAba: string) => {
    const sheet = workbook.Sheets[nomeAba]
    if (!sheet) return

    // sheet_to_csv gera campos separados por vírgula no padrão esperado
    const csvAba = XLSX.utils.sheet_to_csv(sheet, {
      FS: ",",
      RS: "\n",
      dateNF: "yyyy-mm-dd",
    })

    if (csvAba && csvAba.trim().length > 0) {
      partesCsv.push(`\n# ABA: ${nomeAba}\n${csvAba}`)
    }
  })

  return {
    conteudoCsv: partesCsv.join("\n"),
    nomesAbas,
    ehXlsx: true,
  }
}
