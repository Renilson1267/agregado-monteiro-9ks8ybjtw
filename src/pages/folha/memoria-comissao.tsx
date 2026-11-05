import React from "react"
import { FaixaComissaoProgressiva } from "@/types/folha"
import { formatarMoeda } from "./folha-helpers"

/**
 * MEMÓRIA DE CÁLCULO DA COMISSÃO — SÓ EXIBIÇÃO, nenhum valor muda.
 *
 * FORMATO ANTIGO (anterior à reconstrução da folha em 0.0.415), restaurado:
 * memória FLAT única, no estilo da folha legada, SEM fatiamento por faixas
 * e SEM rótulo "Valor do mês vendido". A memória é a CONTA COMPLETA:
 *
 *   Comissão = R$ vendas × % = R$ comissão  →  TOTAL = R$ comissão
 *
 * - MÁRCIO LUAN (Monteiro, tabela progressiva): usa o percentual EFETIVO da
 *   linha (comissão gravada ÷ vendas) — 200.000 × 1,4202% = 2.840,40.
 * - VALDERCLEITON (SJE, flat 0,5%): 1.032.819,90 × 0,5% = 5.164,10.
 * - O título antigo "VOLUME / OBRAS (m³)" é mantido como rótulo do valor
 *   vendido (mesmo texto do cabeçalho da tabela da VENDAS).
 *
 * NÃO usa calcularComissaoProgressivaMarginal nem altera folha-calculos.ts:
 * o TOTAL exibido é SEMPRE a comissão gravada na folha (só exibição).
 */

const formatarPercentual = (decimal: number) =>
  (decimal * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })

interface MemoriaComissaoProps {
  faixas?: FaixaComissaoProgressiva[] | null
  valorVendas: number
  comissao: number
}

// `faixas` permanece na assinatura (chamadas existentes passam) mas o formato
// antigo NÃO fatia por faixas — ignorado de propósito.
export const MemoriaComissao: React.FC<MemoriaComissaoProps> = ({
  valorVendas,
  comissao,
}) => {
  if (comissao > 0 && valorVendas > 0) {
    const percEfetivo = comissao / valorVendas
    return (
      <div className="space-y-1 text-[11px]">
        <div className="font-semibold text-foreground uppercase">
          VOLUME / OBRAS (m³)
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-muted-foreground">Comissão =</span>
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

  return (
    <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
      Configure a tabela de comissões
    </div>
  )
}
