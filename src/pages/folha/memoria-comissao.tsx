import React from "react"
import { FaixaComissaoProgressiva } from "@/types/folha"
import { formatarMoeda } from "./folha-helpers"

/**
 * MEMÓRIA DE CÁLCULO DA COMISSÃO — SÓ EXIBIÇÃO, nenhum valor muda.
 * Detalha o fatiamento marginal por faixas da tabela progressiva de comissões
 * EXATAMENTE como calcularComissaoProgressivaMarginal (src/lib/folha-calculos.ts)
 * fatia — mesma ordenação, mesmo piso, mesmo limite superior — mas devolvendo
 * os passos intermediários SEM tocar a função original.
 */
export interface PassoComissaoFaixa {
  indice: number
  de: number
  ate: number
  base: number
  percentual: number // decimal normalizado (0.025 = 2,5%)
  valor: number
}

export function detalharComissaoProgressiva(
  valorVendas: number,
  faixas: FaixaComissaoProgressiva[] | null | undefined,
): PassoComissaoFaixa[] {
  if (!faixas || faixas.length === 0) return []

  const valor = Number(valorVendas || 0)
  if (valor <= 0) return []

  // Ordena por de_valor ascendente (mesma regra da função oficial)
  const faixasOrdenadas = [...faixas].sort(
    (a, b) => Number(a.de_valor) - Number(b.de_valor),
  )

  const passos: PassoComissaoFaixa[] = []

  faixasOrdenadas.forEach((f, idx) => {
    const de = Number(f.de_valor || 0)
    const ate = Number(f.ate_valor || 0)
    // Suporta percentual em decimal (0.025) ou em porcentagem (2.5)
    let perc = Number(f.percentual || 0)
    if (perc > 1) {
      perc = perc / 100
    }

    if (valor <= de) return // valor não alcançou esta faixa

    const piso =
      de > 0 && Math.abs(de - Math.floor(de)) > 0 ? Math.floor(de) : de
    const limiteSuperior = ate > 0 ? Math.min(valor, ate) : valor
    const base = Math.max(0, limiteSuperior - piso)

    if (base > 0) {
      passos.push({
        indice: idx + 1,
        de,
        ate,
        base,
        percentual: perc,
        valor: Math.round(base * perc * 100) / 100,
      })
    }
  })

  return passos
}

interface MemoriaComissaoProps {
  faixas: FaixaComissaoProgressiva[] | null | undefined
  valorVendas: number
  comissao: number
}

/**
 * Bloco de exibição da memória de cálculo:
 * "Faixa X: de R$ A até R$ B — base na faixa R$ C × % = R$ D" ... "TOTAL = R$ ..."
 */
export const MemoriaComissao: React.FC<MemoriaComissaoProps> = ({
  faixas,
  valorVendas,
  comissao,
}) => {
  if (!faixas || faixas.length === 0) {
    return (
      <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
        Configure a tabela de comissões
      </div>
    )
  }

  const passos = detalharComissaoProgressiva(valorVendas, faixas)

  return (
    <div className="space-y-1 text-[11px]">
      {passos.length === 0 ? (
        <div className="text-muted-foreground">
          Sem base de vendas informada para o fatiamento por faixas.
        </div>
      ) : (
        passos.map((p) => (
          <div key={p.indice} className="flex flex-wrap gap-1">
            <span className="font-semibold text-foreground">
              Faixa {p.indice}:
            </span>
            <span className="text-muted-foreground">
              de {formatarMoeda(p.de)} até{" "}
              {p.ate > 0 ? formatarMoeda(p.ate) : "sem limite"} — base na faixa{" "}
              {formatarMoeda(p.base)} ×{" "}
              {(p.percentual * 100).toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}
              % ={" "}
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {formatarMoeda(p.valor)}
            </span>
          </div>
        ))
      )}
      <div className="pt-1 border-t border-border/60 font-semibold text-foreground">
        TOTAL = {formatarMoeda(comissao)}
      </div>
    </div>
  )
}
