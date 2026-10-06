import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

function splitCsvLine(linha: string): string[] {
  const campos: string[] = []
  let campoAtual = ""
  let dentroDeAspas = false
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]
    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        campoAtual += '"'
        i++
      } else {
        dentroDeAspas = !dentroDeAspas
      }
    } else if (char === "," && !dentroDeAspas) {
      campos.push(campoAtual.trim())
      campoAtual = ""
    } else {
      campoAtual += char
    }
  }
  campos.push(campoAtual.trim())
  return campos
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const csvUrl =
      "https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/4157a8ea-9ed5-47ab-9af6-80bd6942f94c/agregadosn-monteiro-controle-diario-2-d67b5.csv"
    const resCsv = await fetch(csvUrl)
    const csvText = await resCsv.text()
    const lines = csvText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")

    // Procurar todas as linhas que contenham fórmulas ou nomes de meses ou totais em qualquer coluna
    const linhasInteressantes: any[] = []
    lines.forEach((l, idx) => {
      const cols = splitCsvLine(l)
      // Se tiver mais de 11 colunas ou se tiver algo escrito nas colunas de totais
      const p11 = cols[11] || ""
      const p12 = cols[12] || ""
      const p17 = cols[17] || ""
      const p18 = cols[18] || ""
      const p19 = cols[19] || ""
      const p20 = cols[20] || ""
      if (
        p18 ||
        p19 ||
        p20 ||
        l.toLowerCase().includes("total") ||
        l.toLowerCase().includes("mes") ||
        l.toLowerCase().includes("369")
      ) {
        linhasInteressantes.push({
          idx: idx + 1,
          cols: cols.slice(0, 15),
          extraCols: cols.slice(15),
        })
      }
    })

    return new Response(
      JSON.stringify({
        linhasInteressantes: linhasInteressantes.slice(0, 50),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
