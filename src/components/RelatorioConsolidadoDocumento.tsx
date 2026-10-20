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
          title: `GC_MIX_RELATORIO_CONSOLIDADO_4_UNIDADES_${dados.competencia.replace("-", "_")}`,
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

    // Lista de unidades ativas neste documento (padrão: 4 unidades, ou [Patos] ou [Monteiro, SJE])
    const unidadesFiltradas =
      dados.unidadesFiltro && dados.unidadesFiltro.length > 0
        ? dados.unidadesFiltro
        : ["monteiro", "sje", "patos", "caico"] as const

    const ehApenasPatos =
      unidadesFiltradas.length === 1 && unidadesFiltradas[0] === "patos"
    const ehSjeMonteiro =
      unidadesFiltradas.length === 2 &&
      unidadesFiltradas.includes("monteiro") &&
      unidadesFiltradas.includes("sje")

    // Colunas de unidades a renderizar
    const defColunas: Array<{
      slug: "monteiro" | "sje" | "patos" | "caico"
      label: string
      cargas: number
      volumeM3: number
      consumoKey: "monteiro" | "sje" | "patos" | "caico"
      folhaObj?: typeof folha.monteiro
    }> = []

    if (unidadesFiltradas.includes("monteiro")) {
      defColunas.push({
        slug: "monteiro",
        label: "MONTEIRO",
        cargas: producao.monteiro.cargas,
        volumeM3: producao.monteiro.volumeM3,
        consumoKey: "monteiro",
        folhaObj: folha.monteiro,
      })
    }
    if (unidadesFiltradas.includes("sje")) {
      defColunas.push({
        slug: "sje",
        label: "SJE",
        cargas: producao.sje.cargas,
        volumeM3: producao.sje.volumeM3,
        consumoKey: "sje",
        folhaObj: folha.sje,
      })
    }
    if (unidadesFiltradas.includes("patos")) {
      defColunas.push({
        slug: "patos",
        label: "PATOS",
        cargas: producao.patos.cargas,
        volumeM3: producao.patos.volumeM3,
        consumoKey: "patos",
        folhaObj: folha.patos,
      })
    }
    if (unidadesFiltradas.includes("caico")) {
      defColunas.push({
        slug: "caico",
        label: "CAICÓ",
        cargas: producao.caico.cargas,
        volumeM3: producao.caico.volumeM3,
        consumoKey: "caico",
        folhaObj: folha.caico,
      })
    }

    const temMultiplasUnidades = defColunas.length > 1

    const rotuloTotal = ehSjeMonteiro
      ? "TOTAL SJE+MONTEIRO"
      : ehApenasPatos
        ? "TOTAL PATOS"
        : "TOTAL GERAL"

    const tituloDoc =
      dados.tituloDocumento ||
      (ehApenasPatos
        ? "GC MIX — RELATÓRIO CONSOLIDADO • UNIDADE PATOS"
        : ehSjeMonteiro
          ? "GC MIX — RELATÓRIO CONSOLIDADO • SJE + MONTEIRO"
          : "GC MIX — RELATÓRIO CONSOLIDADO GERAL (4 UNIDADES)")

    const subtituloDoc =
      dados.subtituloDocumento ||
      (ehApenasPatos
        ? "UNIDADE: PATOS / PB • FECHAMENTO OPERACIONAL & FINANCEIRO"
        : ehSjeMonteiro
          ? "UNIDADES: SÃO JOSÉ DO EGITO / PE • MONTEIRO / PB (CONSOLIDADO)"
          : "UNIDADES: MONTEIRO / PB • SJE / PE • PATOS / PB • CAICÓ / RN")

    const linhasConsumo = [
      {
        label: "Cimento",
        unidade: "kg",
        decimais: 0,
        getter: (c: typeof consumos.monteiro) => c.cimentoKg,
        total: consumos.total.cimentoKg,
      },
      {
        label: "Brita 1",
        unidade: "kg",
        decimais: 0,
        getter: (c: typeof consumos.monteiro) => c.brita1Kg,
        total: consumos.total.brita1Kg,
      },
      {
        label: "Brita 2",
        unidade: "kg",
        decimais: 0,
        getter: (c: typeof consumos.monteiro) => c.brita2Kg,
        total: consumos.total.brita2Kg,
      },
      {
        label: "Areia",
        unidade: "kg",
        decimais: 0,
        getter: (c: typeof consumos.monteiro) => c.areiaKg,
        total: consumos.total.areiaKg,
      },
      {
        label: "Pó de Pedra",
        unidade: "kg",
        decimais: 0,
        getter: (c: typeof consumos.monteiro) => c.poPedraKg,
        total: consumos.total.poPedraKg,
      },
      {
        label: "Aditivo",
        unidade: "L",
        decimais: 1,
        getter: (c: typeof consumos.monteiro) => c.aditivoL,
        total: consumos.total.aditivoL,
      },
      {
        label: "Água",
        unidade: "L",
        decimais: 0,
        getter: (c: typeof consumos.monteiro) => c.aguaL,
        total: consumos.total.aguaL,
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
                {tituloDoc} • {dados.rotuloCompetencia}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtituloDoc}
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
                      {tituloDoc}
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
                      CONSOLIDAÇÃO OPERACIONAL E FINANCEIRA •{" "}
                      {dados.rotuloCompetencia}
                    </p>
                    <p className="text-[9px] font-semibold text-gray-800">
                      {subtituloDoc}
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
              {/* (b) PRODUÇÃO: Nº DE CARGAS E VOLUME M³ */}
              <div className="border border-gray-300 rounded p-3 bg-gray-50/60">
                <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    1. PRODUÇÃO CONSOLIDADA (Cargas Válidas)
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">
                    Excluindo canceladas (cancelada=false) •{" "}
                    {defColunas.map((c) => c.label).join(", ")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-[9.5px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-[8.5px]">
                        <th className="border border-gray-300 p-1.5 text-left">
                          Indicador de Produção
                        </th>
                        {defColunas.map((col) => (
                          <th
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono"
                          >
                            {col.label}
                          </th>
                        ))}
                        {temMultiplasUnidades && (
                          <th className="border border-gray-300 p-1.5 text-right font-mono bg-blue-50 text-blue-900 font-extrabold">
                            {rotuloTotal}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5 font-medium text-gray-700">
                          Nº de Cargas Expedidas
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono font-bold text-gray-900"
                          >
                            {fmtNumero(col.cargas)} cargas
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-black text-blue-950 bg-blue-50/60 text-[11px]">
                            {fmtNumero(producao.total.cargas)} cargas
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 font-medium text-gray-700">
                          Volume Total Produzido (m³)
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono font-bold text-gray-900"
                          >
                            {fmtNumero(col.volumeM3, 1)} m³
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-black text-blue-950 bg-blue-50/60 text-[11px]">
                            {fmtNumero(producao.total.volumeM3, 1)} m³
                          </td>
                        )}
                      </tr>
                      <tr className="bg-gray-50 text-[8.5px] text-gray-600">
                        <td className="border border-gray-300 p-1 italic">
                          Média de Volume por Carga (m³)
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1 text-right font-mono"
                          >
                            {col.cargas > 0
                              ? fmtNumero(col.volumeM3 / col.cargas, 2)
                              : "0,00"}{" "}
                            m³
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1 text-right font-mono font-bold text-blue-900 bg-blue-50/40">
                            {producao.total.cargas > 0
                              ? fmtNumero(
                                  producao.total.volumeM3 /
                                    producao.total.cargas,
                                  2,
                                )
                              : "0,00"}{" "}
                            m³
                          </td>
                        )}
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
                    Soma dos consumos no período
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-[9px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-[8.5px]">
                        <th className="border border-gray-300 p-1.5 text-left">
                          Material Insumo
                        </th>
                        {defColunas.map((col) => (
                          <th
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono"
                          >
                            {col.label}
                          </th>
                        ))}
                        {temMultiplasUnidades && (
                          <th className="border border-gray-300 p-1.5 text-right font-mono bg-emerald-50 text-emerald-950 font-extrabold">
                            {rotuloTotal}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {linhasConsumo.map((row) => (
                        <tr key={row.label} className="hover:bg-gray-50/80">
                          <td className="border border-gray-300 p-1.5 font-semibold text-gray-800">
                            {row.label} ({row.unidade})
                          </td>
                          {defColunas.map((col) => {
                            const val = row.getter(consumos[col.consumoKey])
                            return (
                              <td
                                key={col.slug}
                                className="border border-gray-300 p-1.5 text-right font-mono font-medium text-gray-900"
                              >
                                {fmtNumero(val, row.decimais)} {row.unidade}
                              </td>
                            )
                          })}
                          {temMultiplasUnidades && (
                            <td className="border border-gray-300 p-1.5 text-right font-mono font-black text-emerald-950 bg-emerald-50/60">
                              {fmtNumero(row.total, row.decimais)} {row.unidade}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* (d) FOLHA DE PAGAMENTO */}
              <div className="border border-gray-300 rounded p-3 bg-gray-50/60">
                <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                    3. FOLHA DE PAGAMENTO CONSOLIDADA (
                    {defColunas.map((c) => c.label).join(" + ")})
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">
                    Fórmula oficial do módulo Folha
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-[9px]">
                        <th className="border border-gray-300 p-2 text-left">
                          Componente da Folha
                        </th>
                        {defColunas.map((col) => (
                          <th
                            key={col.slug}
                            className="border border-gray-300 p-2 text-right font-mono"
                          >
                            {col.label}
                          </th>
                        ))}
                        {temMultiplasUnidades && (
                          <th className="border border-gray-300 p-2 text-right font-mono bg-purple-50 text-purple-950 font-extrabold">
                            {rotuloTotal}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Pessoas na folha
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono font-bold text-gray-900"
                          >
                            {col.folhaObj?.pessoas || 0}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-black text-purple-950 bg-purple-50/50">
                            {defColunas.reduce(
                              (acc, c) => acc + (c.folhaObj?.pessoas || 0),
                              0,
                            )}
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Salários Quinzena
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono text-gray-900"
                          >
                            {fmtMoeda(col.folhaObj?.salariosQuinzena || 0)}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                            {fmtMoeda(
                              defColunas.reduce(
                                (acc, c) =>
                                  acc + (c.folhaObj?.salariosQuinzena || 0),
                                0,
                              ),
                            )}
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Salários Mensal (líquido)
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono text-gray-900"
                          >
                            {fmtMoeda(col.folhaObj?.salariosMensal || 0)}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                            {fmtMoeda(
                              defColunas.reduce(
                                (acc, c) =>
                                  acc + (c.folhaObj?.salariosMensal || 0),
                                0,
                              ),
                            )}
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          Produção (a pagar)
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono text-gray-900"
                          >
                            {fmtMoeda(col.folhaObj?.producaoAPagar || 0)}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                            {fmtMoeda(
                              defColunas.reduce(
                                (acc, c) =>
                                  acc + (c.folhaObj?.producaoAPagar || 0),
                                0,
                              ),
                            )}
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5 text-gray-700 font-medium">
                          COMISSÕES + AJUDA DE CUSTO (Vendas)
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono text-gray-900"
                          >
                            {fmtMoeda(col.folhaObj?.comissoesAjuda || 0)}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-50/50">
                            {fmtMoeda(
                              defColunas.reduce(
                                (acc, c) =>
                                  acc + (c.folhaObj?.comissoesAjuda || 0),
                                0,
                              ),
                            )}
                          </td>
                        )}
                      </tr>
                      <tr className="bg-purple-50/40">
                        <td className="border border-gray-300 p-1.5 text-purple-950 font-semibold">
                          Terceiros (incluindo comissões/ajuda deles)
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-900"
                          >
                            {fmtMoeda(col.folhaObj?.terceiros || 0)}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-purple-950 bg-purple-100/60">
                            {fmtMoeda(
                              defColunas.reduce(
                                (acc, c) => acc + (c.folhaObj?.terceiros || 0),
                                0,
                              ),
                            )}
                          </td>
                        )}
                      </tr>
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                        <td className="border border-gray-300 p-2 uppercase text-gray-900">
                          TOTAL DA UNIDADE
                        </td>
                        {defColunas.map((col) => (
                          <td
                            key={col.slug}
                            className="border border-gray-300 p-2 text-right font-mono font-black text-black"
                          >
                            {fmtMoeda(col.folhaObj?.totalUnidade || 0)}
                          </td>
                        ))}
                        {temMultiplasUnidades && (
                          <td className="border border-gray-300 p-2 text-right font-mono font-black text-purple-950 bg-purple-100/80">
                            {fmtMoeda(folha.totalGeralGcMix)}
                          </td>
                        )}
                      </tr>
                      {temMultiplasUnidades && (
                        <tr className="bg-gray-200 font-black text-[11px] border-t-2 border-black">
                          <td
                            colSpan={defColunas.length}
                            className="border border-gray-300 p-2 uppercase text-black"
                          >
                            {rotuloTotal}
                          </td>
                          <td className="border border-gray-300 p-2 text-right font-mono font-black text-xs text-black">
                            {fmtMoeda(folha.totalGeralGcMix)}
                          </td>
                        </tr>
                      )}
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
                  Responsável Operacional / Usinas (
                  {defColunas.map((c) => c.label).join(", ")})
                </span>
              </div>
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span className="font-semibold">
                  Diretoria Executiva GC MIX — Validação & Fechamento Geral
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
