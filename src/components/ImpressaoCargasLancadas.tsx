import React from "react"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import type { Carga, Empresa, Traco } from "@/types/concreteira"
import { obterDescricaoCompletaCarga } from "@/pages/LancamentoCargas"

export interface ImpressaoCargasLancadasProps {
  cargas: Carga[]
  empresaAtiva: Empresa | null
  tracosCatalogo: Traco[]
  periodoInicio?: string
  periodoFim?: string
  filtroTracoNome?: string
  filtroDosagem?: string
  isPatos?: boolean
  dataEmissao?: string
}

export const ImpressaoCargasLancadas: React.FC<ImpressaoCargasLancadasProps> =
  ({
    cargas,
    empresaAtiva,
    tracosCatalogo,
    periodoInicio,
    periodoFim,
    filtroTracoNome,
    filtroDosagem,
    dataEmissao,
  }) => {
    // Totais: apenas cargas normais (ou todas as filtradas, com volume de não-zeradas)
    const totalCargas = cargas.length
    const totalVolumeSomado = cargas.reduce((acc, c) => {
      return acc + (c.carga_zerada ? 0 : Number(c.volume_m3) || 0)
    }, 0)

    // Formatação do período filtrado
    const formatarDataBr = (iso?: string) => {
      if (!iso) return ""
      const partes = iso.split("-")
      if (partes.length !== 3) return iso
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }

    const periodoTexto = (() => {
      if (periodoInicio && periodoFim) {
        return `${formatarDataBr(periodoInicio)} até ${formatarDataBr(periodoFim)}`
      }
      if (periodoInicio) {
        return `A partir de ${formatarDataBr(periodoInicio)}`
      }
      if (periodoFim) {
        return `Até ${formatarDataBr(periodoFim)}`
      }
      return "Todo o histórico operacional"
    })()

    const emissaoTexto =
      dataEmissao ||
      new Date().toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })

    const nomeUnidade =
      empresaAtiva?.razao_social ||
      empresaAtiva?.nome ||
      "GC MIX CONCRETO USINADO"

    return (
      <div
        className="bg-white text-black p-4 font-sans text-xs leading-normal"
        style={{
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        {/* CABEÇALHO DA IMPRESSÃO A4 */}
        <div className="border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_GC_MIX_HORIZONTAL}
                alt={LOGO_ALT_TEXT}
                className="h-10 w-auto object-contain"
                style={{ maxHeight: "40px" }}
              />
              <div>
                <h1 className="text-base font-black tracking-wider uppercase leading-tight text-black">
                  GC MIX CONCRETO USINADO
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-800">
                  TABELA DE CARGAS LANÇADAS • EXPEDIÇÃO
                </p>
                <p className="text-[10px] font-semibold text-gray-900">
                  UNIDADE ATIVA: {nomeUnidade}
                  {empresaAtiva?.cnpj ? ` • CNPJ: ${empresaAtiva.cnpj}` : ""}
                </p>
              </div>
            </div>

            <div className="text-right text-[9px] leading-tight text-gray-700">
              <p className="font-bold text-black text-[10px]">
                EMISSÃO: {emissaoTexto}
              </p>
              <p className="font-semibold text-gray-800 mt-0.5">
                Formato A4 • Tabela de Lançamentos
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-gray-100 text-gray-800 border border-gray-300">
                {totalCargas}{" "}
                {totalCargas === 1 ? "carga listada" : "cargas listadas"}
              </span>
            </div>
          </div>

          {/* Linha de resumo / filtros aplicados */}
          <div className="mt-2.5 p-2 bg-gray-100 border border-gray-300 rounded text-[10px] text-black flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <strong className="text-gray-900">Período:</strong>{" "}
                <span className="font-mono font-medium">{periodoTexto}</span>
              </div>
              {filtroTracoNome && filtroTracoNome !== "ALL" && (
                <div>
                  <strong className="text-gray-900">Traço:</strong>{" "}
                  <span className="font-semibold">{filtroTracoNome}</span>
                </div>
              )}
              {filtroDosagem && filtroDosagem !== "ALL" && (
                <div>
                  <strong className="text-gray-900">Dosagem:</strong>{" "}
                  <span className="font-mono font-semibold">
                    {filtroDosagem} kg/m³
                  </span>
                </div>
              )}
            </div>

            <div className="text-right flex items-center gap-3">
              <div>
                <strong className="text-gray-900">Total de Cargas:</strong>{" "}
                <span className="font-mono font-bold text-black">
                  {totalCargas}
                </span>
              </div>
              <div>
                <strong className="text-gray-900">Volume Somado:</strong>{" "}
                <span className="font-mono font-black text-black">
                  {totalVolumeSomado.toFixed(1)} m³
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABELA DE CARGAS */}
        <table
          className="w-full text-[9px] border-collapse"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr className="bg-gray-100 text-black border-y-2 border-black font-bold uppercase text-[8px]">
              <th className="py-1.5 px-1.5 text-left w-20">Data</th>
              <th className="py-1.5 px-1.5 text-left w-16"># Carga</th>
              <th className="py-1.5 px-1.5 text-left">Cliente</th>
              <th className="py-1.5 px-1.5 text-left w-20">Placa</th>
              <th className="py-1.5 px-1.5 text-left">Motorista</th>
              <th className="py-1.5 px-1.5 text-left">Cidade</th>
              <th className="py-1.5 px-1.5 text-left">Traço</th>
              <th className="py-1.5 px-1.5 text-right w-24">Volume (m³)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {cargas.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-gray-500 italic text-[10px]"
                >
                  Nenhuma carga encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : (
              cargas.map((carga) => {
                const vol = Number(carga.volume_m3) || 0
                const isZerada = Boolean(carga.carga_zerada)
                const descricaoTraco = obterDescricaoCompletaCarga(
                  carga,
                  tracosCatalogo,
                )

                return (
                  <tr
                    key={carga.id}
                    className="page-break-inside-avoid"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    {/* Data */}
                    <td className="py-1 px-1.5 font-mono whitespace-nowrap text-gray-800">
                      {formatarDataBr(carga.data)}
                    </td>

                    {/* # Carga */}
                    <td className="py-1 px-1.5 font-mono font-bold text-black whitespace-nowrap">
                      #{String(carga.numero_carga).padStart(4, "0")}
                    </td>

                    {/* Cliente */}
                    <td className="py-1 px-1.5 text-black truncate max-w-[180px]">
                      {carga.cliente_nome || "—"}
                    </td>

                    {/* Placa */}
                    <td className="py-1 px-1.5 font-mono text-black whitespace-nowrap">
                      {carga.veiculo_placa || "—"}
                    </td>

                    {/* Motorista */}
                    <td className="py-1 px-1.5 text-gray-800 truncate max-w-[140px]">
                      {carga.motorista_nome || "—"}
                    </td>

                    {/* Cidade */}
                    <td className="py-1 px-1.5 text-gray-800 truncate max-w-[140px]">
                      {carga.cidade_nome || "—"}
                    </td>

                    {/* Traço */}
                    <td className="py-1 px-1.5 text-black font-medium">
                      {descricaoTraco}
                    </td>

                    {/* Volume */}
                    <td className="py-1 px-1.5 text-right font-mono font-bold text-black whitespace-nowrap">
                      {isZerada ? (
                        <span className="text-red-700 font-semibold text-[8px]">
                          0.0 m³ (Zerada)
                        </span>
                      ) : (
                        `${vol.toFixed(1)} m³`
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>

          {/* RODAPÉ COM TOTAIS */}
          <tfoot>
            <tr className="bg-gray-100 text-black border-t-2 border-black font-bold uppercase text-[9px]">
              <td colSpan={7} className="py-2 px-1.5 text-left">
                <strong>TOTAIS GERAIS</strong> ({totalCargas}{" "}
                {totalCargas === 1 ? "carga" : "cargas"})
              </td>
              <td className="py-2 px-1.5 text-right font-mono font-black text-[10px] whitespace-nowrap">
                {totalVolumeSomado.toFixed(1)} m³
              </td>
            </tr>
          </tfoot>
        </table>

        {/* NOTA DE RODAPÉ */}
        <div className="mt-3 pt-2 border-t border-gray-300 text-[8px] text-gray-600 flex justify-between items-center">
          <span>
            GC MIX Concreto Usinado • Sistema Integrado de Gestão e Expedição
          </span>
          <span>Relatório emitido em {emissaoTexto}</span>
        </div>
      </div>
    )
  }

export default ImpressaoCargasLancadas