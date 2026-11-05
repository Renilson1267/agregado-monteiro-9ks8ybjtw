import React from "react"
import { FaixaComissaoProgressiva } from "@/types/folha"
import { formatarMoeda } from "./folha-helpers"

/**
 * MEMÓRIA DE CÁLCULO DA COMISSÃO — SÓ EXIBIÇÃO, nenhum valor muda.
 *
 * Dois formatos:
 *
 * 1) Vendedor COM faixas cadastradas na tabela progressiva
 *    (tabela folha_comissao_faixas — caso real: MÁRCIO LUAN, Monteiro,
 *    4 faixas marginais 2,5% / 2% / 1,5% / 1%): fatiamento por faixa no
 *    formato antigo, uma linha por faixa usada:
 *
 *      Faixa X: de R$ A até R$ B — base R$ C × % = R$ D
 *
 *    seguida de TOTAL = R$ comissão GRAVADA na linha (nunca recalculada).
 *    Se a soma das faixas divergir da comissão gravada (out/2026: tabela
 *    2.500,00 × gravado 2.840,40), exibe linha informativa da divergência
 *    SEM alterar o valor.
 *
 * 2) Vendedor SEM faixas (caso real: VALDERCLEITON, SJE, flat 0,5%):
 *    formato flat — 'Valor do mês vendido: R$ X × % = R$ Y' + TOTAL = comissão
 *    gravada.
 *
 * O fatiamento por faixa replica a mecânica de
 * calcularComissaoProgressivaMarginal (folha-calculos.ts) APENAS para
 * exibição — o TOTAL exibido é SEMPRE a comissão gravada na folha.
 */

const TITULO_MEMORIA = "VALOR DAS VENDAS"

const formatarPercentual = (decimal: number) =>
  (decimal * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })

interface FatiaFaixa {
  ordem: number
  de: number
  ate: number
  perc: number
  base: number
  valor: number
}

// Fatiamento marginal por faixa — SÓ para exibição (mesma mecânica de
// calcularComissaoProgressivaMarginal, sem alterar nenhum valor gravado).
const calcularFatias = (
  valorVendas: number,
  faixas: FaixaComissaoProgressiva[] | null | undefined,
): FatiaFaixa[] => {
  const valor = Number(valorVendas || 0)
  if (!faixas || faixas.length === 0 || valor <= 0) return []

  const ordenadas = [...faixas].sort(
    (a, b) => Number(a.de_valor || 0) - Number(b.de_valor || 0),
  )

  const fatias: FatiaFaixa[] = []
  ordenadas.forEach((f, idx) => {
    const de = Number(f.de_valor || 0)
    const ate = Number(f.ate_valor || 0)
    let perc = Number(f.percentual || 0)
    if (perc > 1) perc = perc / 100

    if (valor <= de) return // valor vendido não alcançou esta faixa

    const piso =
      de > 0 && Math.abs(de - Math.floor(de)) > 0 ? Math.floor(de) : de
    const limiteSuperior = ate > 0 ? Math.min(valor, ate) : valor
    const base = Math.max(0, limiteSuperior - piso)

    if (base > 0) {
      fatias.push({ ordem: idx + 1, de, ate, perc, base, valor: base * perc })
    }
  })

  return fatias
}

interface MemoriaComissaoProps {
  faixas?: FaixaComissaoProgressiva[] | null
  valorVendas: number
  comissao: number
}

export const MemoriaComissao: React.FC<MemoriaComissaoProps> = ({
  faixas,
  valorVendas,
  comissao,
}) => {
  const fatias = calcularFatias(valorVendas, faixas)

  if (comissao > 0 && fatias.length > 0) {
    const somaFatias =
      Math.round(fatias.reduce((acc, f) => acc + f.valor, 0) * 100) / 100
    const divergencia = Math.round((comissao - somaFatias) * 100) / 100

    return (
      <div className="space-y-1 text-[11px]">
        <div className="font-semibold text-foreground uppercase">
          {TITULO_MEMORIA}
        </div>
        <div className="text-muted-foreground">
          Tabela progressiva (comissão marginal por faixas):
        </div>
        {fatias.map((f) => (
          <div key={f.ordem} className="flex flex-wrap gap-1">
            <span className="font-semibold text-foreground">
              Faixa {f.ordem}:
            </span>
            <span className="text-muted-foreground">de</span>
            <span className="font-semibold text-foreground">
              {formatarMoeda(f.de)}
            </span>
            <span className="text-muted-foreground">até</span>
            <span className="font-semibold text-foreground">
              {f.ate > 0 ? formatarMoeda(f.ate) : "o total vendido"}
            </span>
            <span className="text-muted-foreground">—</span>
            <span className="text-muted-foreground">base</span>
            <span className="font-semibold text-foreground">
              {formatarMoeda(f.base)}
            </span>
            <span className="text-muted-foreground">×</span>
            <span className="font-semibold text-foreground">
              {formatarPercentual(f.perc)}%
            </span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {formatarMoeda(f.valor)}
            </span>
          </div>
        ))}
        {Math.abs(divergencia) > 0.01 && (
          <div className="text-amber-700 dark:text-amber-300 font-medium">
            Divergência: soma das faixas = {formatarMoeda(somaFatias)} ×
            comissão gravada = {formatarMoeda(comissao)} (diferença{" "}
            {formatarMoeda(divergencia)}) — informativo, TOTAL mantém o valor
            gravado.
          </div>
        )}
        <div className="pt-1 border-t border-border/60 font-semibold text-foreground">
          TOTAL = {formatarMoeda(comissao)}
        </div>
      </div>
    )
  }

  if (comissao > 0 && valorVendas > 0) {
    const percEfetivo = comissao / valorVendas
    return (
      <div className="space-y-1 text-[11px]">
        <div className="font-semibold text-foreground uppercase">
          {TITULO_MEMORIA}
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
    return (
      <div className="space-y-1 text-[11px]">
        <div className="font-semibold text-foreground uppercase">
          {TITULO_MEMORIA}
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
      {faixas && faixas.length > 0
        ? "Sem comissão nesta competência."
        : "Configure a tabela de comissões"}
    </div>
  )
}
