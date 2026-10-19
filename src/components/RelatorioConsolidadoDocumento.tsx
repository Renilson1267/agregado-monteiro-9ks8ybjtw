import React, { useRef, useState } from "react"
import { Printer, FileText, Check, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import { printElementInIsolatedIframe } from "@/lib/imprimir-recibo"
import { RelatorioConsolidadoSjeMonteiro } from "@/services/relatorio-consolidado"

interface RelatorioConsolidadoDocumentoProps {
  dados: RelatorioConsolidadoSjeMonteiro
  carregando?: boolean
  onAtualizar?: () => void
}

function fmtMoeda(val: number): string {
  return (val || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function fmtNumero(val: number, decimais = 0): string {
  return (val || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })
}

export const RelatorioConsolidadoDocumento: React.FC<RelatorioConsolidadoDocumentoProps> =
  ({ dados, carregando = false, onAtualizar }) => {
    const containerImpressaoRef = useRef<HTMLDivElement>(null)
    const [imprimindo, setImprimindo] = useState(false)

    const handleImprimir = async () => {
      if (!containerImpressaoRef.current) return
      setImprimindo(true)
      try {
        await printElementInIsolatedIframe(containerImpressaoRef.current, {
          title: `GC_MIX_RELATORIO_CONSOLIDADO_SJE_MONTEIRO_${dados.competencia.replace("-", "_")}`,
          waitForImages: true,
          delayMs: 300,
        })
      } catch (err) {
        console.error("Erro ao imprimir relatório consolidado:", err)
        window.print()
      } finally {
        setImprimindo(false)
      }
    }

    const { producao, consumos, folha } = dados

    const linhasConsumo = [
      {
        label: "Cimento",
        unidade: "kg",
        monteiro: consumos.monteiro.cimentoKg,
        sje: consumos.sje.cimentoKg,
        total: consumos.total.cimentoKg,
        decimais: 0,
      },
      {
        label: "Brita 1",
        unidade: "kg",
        monteiro: consumos.monteiro.brita1Kg,
        sje: consumos.sje.brita1Kg,
        total: consumos.total.brita1Kg,
        decimais: 0,
      },
      {
        label: "Brita 2",
        unidade: "kg",
        monteiro: consumos.monteiro.brita2Kg,
        sje: consumos.sje.brita2Kg,
        total: consumos.total.brita2Kg,
        decimais: 0,
      },
      {
        label: "Areia",
        unidade: "kg",
        monteiro: consumos.monteiro.areiaKg,
        sje: consumos.sje.areiaKg,
        total: consumos.total.areiaKg,
        decimais: 0,
      },
      {
        label: "Pó de Pedra",
        unidade: "kg",
        monteiro: consumos.monteiro.poPedraKg,
        sje: consumos.sje.poPedraKg,
        total: consumos.total.poPedraKg,
        decimais: 0,
      },
      {
        label: "Aditivo",
        unidade: "L",
        monteiro: consumos.monteiro.aditivoL,
        sje: consumos.sje.aditivoL,
        total: consumos.total.aditivoL,
        decimais: 1,
      },
      {
        label: "Água",
        unidade: "L",
        monteiro: consumos.monteiro.aguaL,
        sje: consumos.sje.aguaL,
        total: consumos.total.aguaL,
        decimais: 0,
      },
    ]

    return (
      <div className="space-y-4">
        {/* Barra superior de ações */}
        <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-card border border-border/60 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                Relatório Consolidado SJE + Monteiro • {dados.rotuloCompetencia}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Documento consolidado único (A4) com Produção, Consumos e Folha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onAtualizar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAtualizar}
                disabled={carregando || imprimindo}
                className="h-9 text-xs gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`}
                />
                Recarregar
              </Button>
            )}

            <Button
              onClick={handleImprimir}
              disabled={imprimindo || carregando}
              className="gap-2 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              <Printer className="w-4 h-4" />
              {imprimindo ? "Preparando Impressão..." : "Imprimir / Salvar PDF"}
            </Button>
          </div>
        </div>

        {/* DOCUMENTO A4 CONSOLIDADO */}
        <div className="flex justify-center w-full">
          <div
            ref={containerImpressaoRef}
            data-relatorio-consolidado-a4
            className="w-full max-w-[820px] bg-white text-black p-5 sm:p-7 border border-gray-300 rounded-lg shadow-md font-sans print:shadow-none print:border-0 print:p-0 print:max-w-none"
            style={{
              minHeight: "1050px",
              boxSizing: "border-box",
              color: "#000000",
              backgroundColor: "#ffffff",
            }}
          >
            {/* (a) CABEÇALHO */}
            <div className="border-b-2 border-black pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={LOGO_GC_MIX_HORIZONTAL}
                    alt={LOGO_ALT_TEXT}
                    className="h-10 w-auto object-contain"
                    style={{ maxHeight: "42px" }}
                  />
                  <div>
                    <h1 className="text-sm sm:text-base font-black tracking-wider uppercase leading-tight text-black">
                      GC MIX — RELATÓRIO CONSOLIDADO SJE + MONTEIRO
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
                      CONSOLIDAÇÃO OPERACIONAL E FINANCEIRA •{" "}
                      {dados.rotuloCompetencia}
                    </p>
                    <p className="text-[9px] font-semibold text-gray-800">
                      UNIDADES: SÃO JOSÉ DO EGITO / PE & MONTEIRO / PB
                    </p>
                  </div>
                </div>

                <div className="text-right text-[9px] leading-tight text-gray-700">
                  <p className="font-bold text-black text-[10px]">
                    COMPETÊNCIA: {dados.competencia}
                  </p>
                  <p>Emissão: {dados.dataEmissao}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-gray-100 text-gray-800 border border-gray-300">
                    Documento Oficial A4
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* (b) PRODUÇÃO: Nº DE CARGAS E VOLUME M³ POR UNIDADE + TOTAL SOMADO */}
              <div className="border border-gray-300 rounded p-3 bg-gray-50/60">
                <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    1. PRODUÇÃO CONSOLIDADA (Cargas Válidas)
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">
                    Excluindo canceladas (cancelada=false)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-[9px]">
                        <th className="border border-gray-300 p-2 text-left">
                          Indicador de Produção
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono">
                          MONTEIRO
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono">
                          SJE
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono bg-blue-50 text-blue-900 font-extrabold">
                          TOTAL SOMADO
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium text-gray-700">
                          Nº de Cargas Expedidas
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-bold text-gray-900">
                          {fmtNumero(producao.monteiro.cargas)} cargas
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-bold text-gray-900">
                          {fmtNumero(producao.sje.cargas)} cargas
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-black text-blue-950 bg-blue-50/60 text-xs">
                          {fmtNumero(producao.total.cargas)} cargas
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium text-gray-700">
                          Volume Total Produzido (m³)
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-bold text-gray-900">
                          {fmtNumero(producao.monteiro.volumeM3, 1)} m³
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-bold text-gray-900">
                          {fmtNumero(producao.sje.volumeM3, 1)} m³
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-black text-blue-950 bg-blue-50/60 text-xs">
                          {fmtNumero(producao.total.volumeM3, 1)} m³
                        </td>
                      </tr>
                      <tr className="bg-gray-50 text-[9px] text-gray-600">
                        <td className="border border-gray-300 p-1.5 italic">
                          Média de Volume por Carga (m³)
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono">
                          {producao.monteiro.cargas > 0
                            ? fmtNumero(
                                producao.monteiro.volumeM3 /
                                  producao.monteiro.cargas,
                                2,
                              )
                            : "0,00"}{" "}
                          m³
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono">
                          {producao.sje.cargas > 0
                            ? fmtNumero(
                                producao.sje.volumeM3 / producao.sje.cargas,
                                2,
                              )
                            : "0,00"}{" "}
                          m³
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-blue-900 bg-blue-50/40">
                          {producao.total.cargas > 0
                            ? fmtNumero(
                                producao.total.volumeM3 / producao.total.cargas,
                                2,
                              )
                            : "0,00"}{" "}
                          m³
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* (c) CONSUMOS CONSOLIDADOS */}
              <div className="border border-gray-300 rounded p-3 bg-gray-50/60">
                <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    2. CONSUMOS CONSOLIDADOS DE MATERIAIS
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">
                    Soma dos campos consumo_* das cargas válidas no período
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-[9px]">
                        <th className="border border-gray-300 p-2 text-left">
                          Material Insumo
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono">
                          MONTEIRO
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono">
                          SJE
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono bg-emerald-50 text-emerald-950 font-extrabold">
                          TOTAL (SOMA DAS DUAS)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhasConsumo.map((row) => (
                        <tr key={row.label} className="hover:bg-gray-50/80">
                          <td className="border border-gray-300 p-1.5 font-semibold text-gray-800">
                            {row.label} ({row.unidade})
                          </td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-medium text-gray-900">
                            {fmtNumero(row.monteiro, row.decimais)}{" "}
                            {row.unidade}
                          </td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-medium text-gray-900">
                            {fmtNumero(row.sje, row.decimais)} {row.unidade}
                          </td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-black text-emerald-950 bg-emerald-50/60">
                            {fmtNumero(row.total, row.decimais)} {row.unidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* (d) FOLHA: REAPROVEITAR O CONSOLIDADO MONTEIRO × SJE QUE JÁ EXISTE NO RESUMO */}
              <div className="border border-gray-300 rounded p-3 bg-gray-50/60">
                <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                    3. FOLHA DE PAGAMENTO CONSOLIDADA (RESUMO OFICIAL)
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">
                    Consolidado Monteiro × SJE (fórmula oficial do módulo Folha)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-[9px]">
                        <th className="border border-gray-300 p-2 text-left">
                          Componente da Folha
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono">
                          MONTEIRO
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono">
                          SJE
                        </th>
                        <th className="border border-gray-300 p-2 text-right font-mono bg-purple-50 text-purple-950 font-extrabold">
                          TOTAL GC MIX
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Pessoas na folha
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-gray-900">
                          {folha.monteiro.pessoas}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-gray-900">
                          {folha.sje.pessoas}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-black text-purple-950 bg-purple-50/50">
                          {folha.monteiro.pessoas + folha.sje.pessoas}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Salários Quinzena
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.monteiro.salariosQuinzena)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.sje.salariosQuinzena)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                          {fmtMoeda(
                            folha.monteiro.salariosQuinzena +
                              folha.sje.salariosQuinzena,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Salários Mensal (líquido)
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.monteiro.salariosMensal)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.sje.salariosMensal)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                          {fmtMoeda(
                            folha.monteiro.salariosMensal +
                              folha.sje.salariosMensal,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Produção (a pagar)
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.monteiro.producaoAPagar)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.sje.producaoAPagar)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                          {fmtMoeda(
                            folha.monteiro.producaoAPagar +
                              folha.sje.producaoAPagar,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          COMISSÕES + AJUDA DE CUSTO (Vendas)
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.monteiro.comissoesAjuda)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono text-gray-900">
                          {fmtMoeda(folha.sje.comissoesAjuda)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                          {fmtMoeda(
                            folha.monteiro.comissoesAjuda +
                              folha.sje.comissoesAjuda,
                          )}
                        </td>
                      </tr>
                      <tr className="bg-purple-50/40">
                        <td className="border border-gray-300 p-1.5 text-purple-950 font-semibold">
                          Terceiros (incluindo comissões/ajuda deles)
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-900">
                          {fmtMoeda(folha.monteiro.terceiros)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-900">
                          {fmtMoeda(folha.sje.terceiros)}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-100/60">
                          {fmtMoeda(
                            folha.monteiro.terceiros + folha.sje.terceiros,
                          )}
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                        <td className="border border-gray-300 p-2 uppercase text-gray-900">
                          TOTAL DA UNIDADE
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-black text-black">
                          {fmtMoeda(folha.monteiro.totalUnidade)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-black text-black">
                          {fmtMoeda(folha.sje.totalUnidade)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-mono font-black text-purple-950 bg-purple-100/80">
                          {fmtMoeda(folha.totalGeralGcMix)}
                        </td>
                      </tr>
                      <tr className="bg-gray-200 font-black text-[11px] border-t-2 border-black">
                        <td
                          colSpan={2}
                          className="border border-gray-300 p-2 uppercase text-black"
                        >
                          TOTAL GERAL GC MIX (Monteiro + SJE)
                        </td>
                        <td
                          colSpan={2}
                          className="border border-gray-300 p-2 text-right font-mono font-black text-xs text-black"
                        >
                          {fmtMoeda(folha.totalGeralGcMix)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RODAPÉ DO DOCUMENTO A4 */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-center text-gray-700">
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span className="font-semibold">
                  Responsável Operacional / Usina (SJE + Monteiro)
                </span>
              </div>
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span className="font-semibold">
                  Diretoria Executiva GC MIX — Validação & Fechamento
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
