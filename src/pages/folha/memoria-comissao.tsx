import React from "react"
import { FaixaComissaoProgressiva } from "@/types/folha"
import { formatarMoeda } from "./folha-helpers"

/**
 * MEMÓRIA DE CÁLCULO DA COMISSÃO — SÓ EXIBIÇÃO, nenhum valor muda.
 * Dois formatos, definidos pelo usuário:
 *
 * 1) VENDEDOR COM TABELA PROGRESSIVA (Márcio Luan / Monteiro):
 *    fatiamento marginal por faixas EXATAMENTE como
 *    calcularComissaoProgressivaMarginal (src/lib/folha-calculos.ts) fatia —
 *    mesma ordenação, mesmo piso, mesmo limite superior — devolvendo os passos
 *    intermediários SEM tocar a função original. O TOTAL exibido é SEMPRE a
 *    comissão gravada na folha (a soma dos passos da tabela pode divergir —
 *    nesse caso a divergência é mostrada como linha informativa).
 *
 * 2) VENDEDOR SEM FAIXAS CADASTRADAS (Valdercleiton / SJE, comissão flat):
 *    título "VOLUME / OBRAS (m³)" e a conta
 *    "Valor do mês vendido: R$ X × % efetivo = R$ Y", onde o percentual
 *    efetivo = comissão gravada ÷ vendas da obra. TOTAL = comissão gravada.
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

const formatarPercentual = (decimal: number) =>
  (decimal * 100).toLocaleString("pt-BR", { maximumFractionDigits: 4 })

interface MemoriaComissaoProps {
  faixas: FaixaComissaoProgressiva[] | null | undefined
  valorVendas: number
  comissao: number
}

/**
 * Bloco de exibição da memória de cálculo:
 * - Com faixas: "Faixa X: de R$ A até R$ B — base na faixa R$ C × % = R$ D" ...
 *   "TOTAL = R$ <comissão gravada>"
 * - Sem faixas (flat): título "VOLUME / OBRAS (m³)" +
 *   "Valor do mês vendido: R$ X × % = R$ Y" + "TOTAL = R$ Y"
 */
export const MemoriaComissao: React.FC<MemoriaComissaoProps> = ({
  faixas,
  valorVendas,
  comissao,
}) => {
  const temFaixas = Boolean(faixas && faixas.length > 0)

  // SEM FAIXAS CADASTRADAS: memória flat pelo percentual efetivo da linha
  if (!temFaixas) {
    if (comissao > 0 && valorVendas > 0) {
      const percEfetivo = comissao / valorVendas
      return (
        <div className="space-y-1 text-[11px]">
          <div className="font-semibold text-foreground uppercase">
            VOLUME / OBRAS (m³)
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-muted-foreground">Valor do mês vendido:</span>
            <span className="font-semibold text-foreground">
              {formatarMoeda(valorVendas)}
            </span>
            <span className="text-muted-foreground">×</span>
            <span className="font-semibold text-foreground">
              {formatarPercentual(percEfetivo)}%
            </span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {formatarMoeda(comissao)}
            </span>
          </div>
          <div className="pt-1 border-t border-border/60 font-semibold text-foreground">
            TOTAL = {formatarMoeda(comissao)}
          </div>
        </div>
      )
    }

    if (comissao > 0) {
      // Comissão gravada sem base de vendas na linha — mostra só o total
      return (
        <div className="space-y-1 text-[11px]">
          <div className="font-semibold text-foreground uppercase">
            VOLUME / OBRAS (m³)
          </div>
          <div className="font-semibold text-foreground">
            TOTAL = {formatarMoeda(comissao)}{" "}
            <span className="font-normal text-muted-foreground">
              (comissão gravada na folha — sem vendas informadas na linha)
            </span>
          </div>
        </div>
      )
    }

    // Nem faixas, nem comissão na linha
    return (
      <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
        Configure a tabela de comissões
      </div>
    )
  }

  // COM FAIXAS: passos da tabela progressiva + total = comissão gravada
  const passos = detalharComissaoProgressiva(valorVendas, faixas)
  const somaPassos =
    Math.round(passos.reduce((acc, p) => acc + p.valor, 0) * 100) / 100
  const divergente =
    passos.length > 0 && Math.abs(somaPassos - comissao) > 0.005

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

      {divergente && (
        <>
          <div className="text-muted-foreground">
            Soma das faixas da tabela: {formatarMoeda(somaPassos)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Os passos acima refletem a tabela progressiva; o valor pago segue a
            comissão registrada na folha.
          </div>
        </>
      )}

      <div className="pt-1 border-t border-border/60 font-semibold text-foreground">
        TOTAL = {formatarMoeda(comissao)}
        {divergente && (
          <span className="ml-1 font-normal text-muted-foreground">
            (comissão gravada na folha)
          </span>
        )}
      </div>
    </div>
  )
}
