import React, { useRef, useState } from "react"
import {
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import { printElementInIsolatedIframe } from "@/lib/imprimir-recibo"
import type { DadosRelatorioGerencialMes } from "@/services/relatorio-gerencial"

interface RelatorioGerencialMesProps {
  dados: DadosRelatorioGerencialMes
  carregando?: boolean
}

const fmtMoeda = (val?: number | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00"
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

const fmtNumero = (val?: number | null, decimais = 1) => {
  if (val == null || isNaN(val)) return "0"
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })
}

export const RelatorioGerencialMes: React.FC<RelatorioGerencialMesProps> = ({
  dados,
  carregando = false,
}) => {
  const containerImpressaoRef = useRef<HTMLDivElement>(null)
  const [imprimindo, setImprimindo] = useState(false)

  const handleImprimir = async () => {
    if (!containerImpressaoRef.current) return
    setImprimindo(true)
    try {
      await printElementInIsolatedIframe(containerImpressaoRef.current, {
        title: `Relatorio_Gerencial_${dados.competencia.replace("-", "_")}_${dados.nomeEmpresaCabecalho.replace(/[^a-zA-Z0-9]/g, "_")}`,
        waitForImages: true,
        delayMs: 300,
      })
    } catch (err) {
      console.error("Erro ao imprimir relatório gerencial:", err)
      window.print()
    } finally {
      setImprimindo(false)
    }
  }

  const { producao, vendas, folha, insumos, estoque } = dados

  // Materiais filtrados para consumo
  const itemCimento = insumos.itens.find((i) => i.codigo === "cimento")
  const itemAditivo = insumos.itens.find((i) => i.codigo === "aditivo")
  const itemAreia = insumos.itens.find((i) => i.codigo === "areia")
  const itemPoPedra = insumos.itens.find((i) => i.codigo === "po_pedra")
  const somatorioBritas = insumos.somatorioBritas

  // Estoque atual vigente (somente cimento e aditivo)
  const estoqueCimento = estoque.find((e) => e.codigo === "cimento")
  const estoqueAditivo = estoque.find((e) => e.codigo === "aditivo")

  return (
    <div className="space-y-4">
      {/* Barra de Ações na Tela */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-card border border-border/60 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Relatório Gerencial do Mês • {dados.rotuloCompetencia}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              {dados.nomeEmpresaCabecalho} • Formato 1 Página A4 Retrato
            </p>
          </div>
        </div>

        <Button
          onClick={handleImprimir}
          disabled={imprimindo || carregando}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm w-full sm:w-auto"
        >
          <Printer className="w-4 h-4" />
          {imprimindo ? "Preparando Impressão..." : "Imprimir Página A4"}
        </Button>
      </div>

      {/* =========================================================================
          FOLHA A4 RETRATO: RENDERIZADA NA TELA E IMPRESSA 100% LIMPA NO IFRAME
      ========================================================================== */}
      <div className="flex justify-center w-full">
        <div
          ref={containerImpressaoRef}
          data-relatorio-gerencial-a4
          className="w-full max-w-[820px] bg-white text-black p-5 sm:p-7 border border-gray-300 rounded-lg shadow-md font-sans print:shadow-none print:border-0 print:p-0 print:max-w-none"
          style={{
            minHeight: "1050px",
            boxSizing: "border-box",
            color: "#000000",
            backgroundColor: "#ffffff",
          }}
        >
          {/* CABEÇALHO DO DOCUMENTO A4 */}
          <div className="border-b-2 border-black pb-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={LOGO_GC_MIX_HORIZONTAL}
                  alt={LOGO_ALT_TEXT}
                  className="h-10 w-auto object-contain"
                  style={{ maxHeight: "42px" }}
                />
                <div>
                  <h1 className="text-base font-black tracking-wider uppercase leading-tight text-black">
                    GC MIX CONCRETO USINADO
                  </h1>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
                    RELATÓRIO GERENCIAL SIMPLIFICADO • {dados.rotuloCompetencia}
                  </p>
                  <p className="text-[9px] font-semibold text-gray-800">
                    UNIDADE: {dados.nomeEmpresaCabecalho}
                  </p>
                </div>
              </div>

              <div className="text-right text-[9px] leading-tight text-gray-700">
                <p className="font-bold text-black text-[10px]">
                  COMPETÊNCIA: {dados.competencia}
                </p>
                <p>Emissão: {dados.dataEmissao}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-gray-100 text-gray-800 border border-gray-300">
                  Visão Executiva • A4
                </span>
              </div>
            </div>
          </div>

          {/* GRID COM OS 5 BLOCOS CURTOS E OBJETIVOS */}
          <div className="space-y-3">
            {/* -------------------------------------------------------------
                BLOCO 1: PRODUÇÃO (VOLUME, CARGAS, OS E COMPARATIVO MÊS ANTERIOR)
            -------------------------------------------------------------- */}
            <div className="border border-gray-300 rounded p-2.5 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  1. Produção do Mês
                </span>
                <span className="text-[9px] text-gray-600 font-medium">
                  Comparativo vs. Mês Anterior
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Volume m³ */}
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block">
                    Volume Produzido
                  </span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-black font-mono text-black">
                      {fmtNumero(producao.volumeTotalM3, 1)}{" "}
                      <span className="text-xs font-bold text-gray-600">
                        m³
                      </span>
                    </span>
                    {producao.variacaoVolumePct !== null && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          producao.variacaoVolumePct >= 0
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {producao.variacaoVolumePct >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {producao.variacaoVolumePct > 0 ? "+" : ""}
                        {producao.variacaoVolumePct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    Mês anterior: {fmtNumero(producao.mesAnteriorVolumeM3, 1)}{" "}
                    m³
                  </span>
                </div>

                {/* Nº Cargas */}
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block">
                    Nº de Cargas
                  </span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-black font-mono text-black">
                      {producao.totalCargas}
                    </span>
                    {producao.variacaoCargasPct !== null && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          producao.variacaoCargasPct >= 0
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {producao.variacaoCargasPct >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {producao.variacaoCargasPct > 0 ? "+" : ""}
                        {producao.variacaoCargasPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    Mês anterior: {producao.mesAnteriorCargas} cargas
                  </span>
                </div>

                {/* Nº OS */}
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block">
                    Nº de Ordens (OS)
                  </span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-black font-mono text-black">
                      {producao.totalOS}
                    </span>
                    <span className="text-[8px] font-semibold text-gray-500">
                      Emitidas no mês
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    Mês anterior: {producao.mesAnteriorOS} OS
                  </span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BLOCO 2: VENDAS (TOTAL VENDIDO R$ E CLIENTES/OBRAS ATENDIDAS)
            -------------------------------------------------------------- */}
            <div className="border border-gray-300 rounded p-2.5 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  2. Vendas do Mês
                </span>
                <span className="text-[9px] text-gray-600 font-medium">
                  Faturamento & Atendimento Comercial
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Total Vendido R$ */}
                <div className="bg-white border border-emerald-300 rounded p-2">
                  <span className="text-[9px] uppercase font-bold text-emerald-900 block flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-700" />
                    Total Vendido
                  </span>
                  <p className="text-lg font-black font-mono text-emerald-950 mt-0.5">
                    {fmtMoeda(vendas.totalVendido)}
                  </p>
                  <span className="text-[8px] text-gray-500 block">
                    Comissões geradas: {fmtMoeda(vendas.totalComissoes)}
                  </span>
                </div>

                {/* Clientes Atendidos */}
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    Clientes Atendidos
                  </span>
                  <p className="text-lg font-black font-mono text-black mt-0.5">
                    {vendas.numeroClientesAtendidos}
                  </p>
                  <span className="text-[8px] text-gray-500 block">
                    {vendas.numeroClientesAtendidos > 0
                      ? "Clientes com expedição no mês"
                      : "Sem clientes discriminados em OS"}
                  </span>
                </div>

                {/* Obras Atendidas */}
                <div className="bg-white border border-gray-200 rounded p-2">
                  <span className="text-[9px] uppercase font-bold text-gray-600 block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    Obras Atendidas
                  </span>
                  <p className="text-lg font-black font-mono text-black mt-0.5">
                    {vendas.numeroObrasAtendidas}
                  </p>
                  <span className="text-[8px] text-gray-500 block">
                    {vendas.numeroObrasAtendidas > 0
                      ? "Canteiros / endereços ativos"
                      : "Sem obras discriminadas em OS"}
                  </span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BLOCO 3: FOLHA DE PAGAMENTO (RESUMO OFICIAL EM 4 LINHAS + TOTAL)
            -------------------------------------------------------------- */}
            <div className="border border-gray-300 rounded p-2.5 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                  3. Folha de Pagamento (Resumo Oficial em 4 Linhas)
                </span>
                <span className="text-[9px] text-gray-600 font-medium">
                  {folha.pessoasNaFolha} pessoas na folha
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                <div className="bg-white border border-gray-200 rounded p-1.5">
                  <span className="text-[8px] uppercase font-bold text-gray-600 block">
                    1. Salários Quinzena
                  </span>
                  <p className="text-xs font-black font-mono text-black mt-0.5">
                    {fmtMoeda(folha.salariosQuinzena)}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded p-1.5">
                  <span className="text-[8px] uppercase font-bold text-gray-600 block">
                    2. Mensal (Líquido)
                  </span>
                  <p className="text-xs font-black font-mono text-black mt-0.5">
                    {fmtMoeda(folha.salariosMensalLiquido)}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded p-1.5">
                  <span className="text-[8px] uppercase font-bold text-gray-600 block">
                    3. Produção (A Pagar)
                  </span>
                  <p className="text-xs font-black font-mono text-black mt-0.5">
                    {fmtMoeda(folha.producaoAPagar)}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded p-1.5">
                  <span className="text-[8px] uppercase font-bold text-gray-600 block">
                    4. Comissões Vendas
                  </span>
                  <p className="text-xs font-black font-mono text-black mt-0.5">
                    {fmtMoeda(folha.comissoesVendas)}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-300 rounded p-1.5">
                  <span className="text-[8px] uppercase font-bold text-purple-900 block">
                    TOTAL DA FOLHA
                  </span>
                  <p className="text-xs font-black font-mono text-purple-950 mt-0.5">
                    {fmtMoeda(folha.totalFolha)}
                  </p>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BLOCO 4: INSUMOS — CONSUMO DO MÊS COM SOMATÓRIO BRITAS B12+B19
            -------------------------------------------------------------- */}
            <div className="border border-gray-300 rounded p-2.5 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                  4. Insumos — Consumo da Produção
                </span>
                <span className="text-[9px] text-gray-700 font-bold font-mono">
                  Custo Total Insumos: {fmtMoeda(insumos.custoTotalGeral)} (
                  {fmtMoeda(insumos.custoMedioPorM3)}/m³)
                </span>
              </div>

              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-100 text-gray-700 font-bold uppercase text-[8px]">
                    <th className="py-1 px-1.5 text-left">Insumo</th>
                    <th className="py-1 px-1.5 text-right">Consumo (kg / L)</th>
                    <th className="py-1 px-1.5 text-right">Volume (m³)</th>
                    <th className="py-1 px-1.5 text-right">Custo Total (R$)</th>
                    <th className="py-1 px-1.5 text-right">% Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Cimento */}
                  <tr>
                    <td className="py-1 px-1.5 font-bold text-black">
                      Cimento (CP II / CP V)
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-black font-semibold">
                      {fmtNumero(itemCimento?.quantidadeConsumida, 0)} kg
                      {(itemCimento?.quantidadeConsumida || 0) >= 1000 && (
                        <span className="text-gray-500 ml-1 font-normal">
                          (
                          {(
                            (itemCimento?.quantidadeConsumida || 0) / 1000
                          ).toFixed(2)}{" "}
                          t)
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-gray-500">
                      —
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                      {fmtMoeda(itemCimento?.custoTotal)}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-gray-700">
                      {(itemCimento?.percentualDoTotal || 0).toFixed(1)}%
                    </td>
                  </tr>

                  {/* Aditivo */}
                  <tr>
                    <td className="py-1 px-1.5 font-bold text-black">
                      Aditivo Plastificante
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-black font-semibold">
                      {fmtNumero(itemAditivo?.quantidadeConsumida, 1)} L
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-gray-500">
                      —
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                      {fmtMoeda(itemAditivo?.custoTotal)}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-gray-700">
                      {(itemAditivo?.percentualDoTotal || 0).toFixed(1)}%
                    </td>
                  </tr>

                  {/* Areia */}
                  <tr>
                    <td className="py-1 px-1.5 font-bold text-black">Areia</td>
                    <td className="py-1 px-1.5 text-right font-mono text-black">
                      {fmtNumero(itemAreia?.quantidadeConsumida, 0)} kg
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                      {fmtNumero(itemAreia?.quantidadeM3, 1)} m³
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                      {fmtMoeda(itemAreia?.custoTotal)}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-gray-700">
                      {(itemAreia?.percentualDoTotal || 0).toFixed(1)}%
                    </td>
                  </tr>

                  {/* SOMATÓRIO BRITAS (B12 + B19) */}
                  <tr className="bg-amber-100/70 font-bold border-y border-amber-300 text-black">
                    <td className="py-1 px-1.5 font-black uppercase text-amber-950 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-800" />
                      Somatório Britas (B12 + B19)
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-black text-amber-950">
                      {fmtNumero(somatorioBritas.quantidadeKg, 0)} kg
                      {somatorioBritas.quantidadeKg >= 1000 && (
                        <span className="text-gray-700 ml-1 font-normal">
                          ({(somatorioBritas.quantidadeKg / 1000).toFixed(2)} t)
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-black text-amber-950">
                      {fmtNumero(somatorioBritas.quantidadeM3, 1)} m³
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-black text-amber-950">
                      {fmtMoeda(somatorioBritas.custoTotal)}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-amber-950">
                      {somatorioBritas.percentualDoTotal.toFixed(1)}%
                    </td>
                  </tr>

                  {/* Pó de Pedra (se houver consumo) */}
                  {(itemPoPedra?.quantidadeConsumida || 0) > 0 && (
                    <tr>
                      <td className="py-1 px-1.5 font-bold text-black">
                        Pó de Pedra
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono text-black">
                        {fmtNumero(itemPoPedra?.quantidadeConsumida, 0)} kg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                        {fmtNumero(itemPoPedra?.quantidadeM3, 1)} m³
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-bold text-black">
                        {fmtMoeda(itemPoPedra?.custoTotal)}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono text-gray-700">
                        {(itemPoPedra?.percentualDoTotal || 0).toFixed(1)}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* -------------------------------------------------------------
                BLOCO 5: ESTOQUE ATUAL (REGRA VIGENTE: SOMENTE CIMENTO E ADITIVO)
            -------------------------------------------------------------- */}
            <div className="border border-gray-300 rounded p-2.5 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-700" />
                  5. Estoque Atual (Controle Vigente: Cimento & Aditivo)
                </span>
                <span className="text-[8px] text-gray-600 font-medium">
                  Regra do sistema: agregados não possuem saldo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Saldo Cimento */}
                <div
                  className={`border rounded p-2 bg-white ${
                    estoqueCimento?.abaixoMinimo
                      ? "border-rose-400 bg-rose-50/50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-black">
                      Silo de Cimento (CP II / CP V)
                    </span>
                    {estoqueCimento?.abaixoMinimo ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-200 text-rose-950">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-800" />
                        Abaixo do Mínimo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-emerald-100 text-emerald-900">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                        Regular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      className={`text-lg font-black font-mono ${
                        estoqueCimento?.abaixoMinimo
                          ? "text-rose-900"
                          : "text-black"
                      }`}
                    >
                      {fmtNumero(estoqueCimento?.saldo, 1)} kg
                      {(estoqueCimento?.saldo || 0) >= 1000 && (
                        <span className="text-xs text-gray-600 font-normal ml-1">
                          ({((estoqueCimento?.saldo || 0) / 1000).toFixed(2)} t)
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">
                      Mín: {fmtNumero(estoqueCimento?.estoqueMinimo, 0)} kg
                    </span>
                  </div>

                  {dados.empresaFiltro === "todas" && (
                    <div className="mt-1 pt-1 border-t border-gray-200 text-[8px] text-gray-600 flex justify-between font-mono">
                      <span>
                        Monteiro: {fmtNumero(estoqueCimento?.saldoMonteiro, 0)}{" "}
                        kg
                      </span>
                      <span>
                        SJE: {fmtNumero(estoqueCimento?.saldoSje, 0)} kg
                      </span>
                    </div>
                  )}
                </div>

                {/* Saldo Aditivo */}
                <div
                  className={`border rounded p-2 bg-white ${
                    estoqueAditivo?.abaixoMinimo
                      ? "border-rose-400 bg-rose-50/50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-black">
                      Tanque de Aditivo Plastificante
                    </span>
                    {estoqueAditivo?.abaixoMinimo ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-200 text-rose-950">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-800" />
                        Abaixo do Mínimo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-emerald-100 text-emerald-900">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                        Regular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      className={`text-lg font-black font-mono ${
                        estoqueAditivo?.abaixoMinimo
                          ? "text-rose-900"
                          : "text-black"
                      }`}
                    >
                      {fmtNumero(estoqueAditivo?.saldo, 1)} L
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">
                      Mín: {fmtNumero(estoqueAditivo?.estoqueMinimo, 0)} L
                    </span>
                  </div>

                  {dados.empresaFiltro === "todas" && (
                    <div className="mt-1 pt-1 border-t border-gray-200 text-[8px] text-gray-600 flex justify-between font-mono">
                      <span>
                        Monteiro: {fmtNumero(estoqueAditivo?.saldoMonteiro, 1)}{" "}
                        L
                      </span>
                      <span>
                        SJE: {fmtNumero(estoqueAditivo?.saldoSje, 1)} L
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              6. RODAPÉ DO DOCUMENTO (EMISSÃO AUTOMÁTICA E ASSINATURAS)
          -------------------------------------------------------------- */}
          <div className="mt-4 pt-3 border-t border-gray-300 text-[9px] text-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-black">
                  GC MIX • Central de Dosagem e Controle Tecnológico
                </p>
                <p className="text-[8px] text-gray-600">
                  Emitido em {dados.dataEmissao} às{" "}
                  {new Date().toLocaleTimeString("pt-BR")} • Sistema GC MIX
                </p>
              </div>

              <div className="text-right text-[8px] text-gray-600">
                <p>Relatório Gerencial Mensal • 1 Página A4</p>
                <p className="font-semibold text-black">
                  Competência: {dados.rotuloCompetencia}
                </p>
              </div>
            </div>

            {/* Linhas de Assinatura */}
            <div className="mt-6 pt-3 grid grid-cols-2 gap-8 text-center text-[8px]">
              <div>
                <div className="border-b border-gray-400 pb-0.5 mb-1" />
                <span className="font-bold text-black">
                  Responsável Operacional / Usina
                </span>
              </div>
              <div>
                <div className="border-b border-gray-400 pb-0.5 mb-1" />
                <span className="font-bold text-black">
                  Diretoria / Gerência Geral
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
