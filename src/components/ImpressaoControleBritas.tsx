import React from "react"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import type { Empresa } from "@/types/concreteira"
import type {
  ControleBritaCompra,
  ControleBritaEntrega,
  ControleBritaCheque,
  ResumoControleBritasMes,
} from "@/types/britas"

export interface ImpressaoControleBritasProps {
  empresaAtiva: Empresa | null
  competencia: string
  rotuloCompetencia: string
  compraMensal: ControleBritaCompra | null
  resumo: ResumoControleBritasMes
  entregas: ControleBritaEntrega[]
  cheques: ControleBritaCheque[]
  totalCheques: number
  totalChequesPagos: number
  totalChequesPendentes: number
  filtroTipoBrita: string
  filtroFornecedor: string
  filtroDataInicio: string
  filtroDataFim: string
}

function formatarDataBr(iso?: string | null): string {
  if (!iso) return "—"
  const partes = iso.split("-")
  if (partes.length !== 3) return iso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarMoeda(val: number): string {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export const ImpressaoControleBritas: React.FC<ImpressaoControleBritasProps> =
  ({
    empresaAtiva,
    competencia,
    rotuloCompetencia,
    compraMensal,
    resumo,
    entregas,
    cheques,
    totalCheques,
    totalChequesPagos,
    totalChequesPendentes,
    filtroTipoBrita,
    filtroFornecedor,
    filtroDataInicio,
    filtroDataFim,
  }) => {
    const nomeUnidade =
      empresaAtiva?.razao_social ||
      empresaAtiva?.nome ||
      "GC MIX CONCRETO USINADO"

    const agoraTexto = new Date().toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    })

    // Totais dos registros filtrados de entregas
    const totalVolumeEntregasFiltradas = entregas.reduce(
      (acc, cur) => acc + (Number(cur.quantidade_m3) || 0),
      0,
    )

    const temFiltroAtivo =
      filtroTipoBrita !== "ALL" ||
      Boolean(filtroFornecedor.trim()) ||
      Boolean(filtroDataInicio) ||
      Boolean(filtroDataFim)

    return (
      <div
        className="print-only bg-white text-black p-4 font-sans text-xs leading-normal"
        style={{
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        {/* 1. CABEÇALHO GC MIX + COMPETÊNCIA */}
        <div className="border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_GC_MIX_HORIZONTAL}
                alt={LOGO_ALT_TEXT}
                className="h-10 w-auto object-contain print-preserve-logo"
                style={{ maxHeight: "42px" }}
              />
              <div>
                <h1 className="text-base font-black tracking-wider uppercase leading-tight text-black">
                  GC MIX CONCRETO USINADO
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-800">
                  CONTROLE MENSAL DE BRITAS (BRITA 19 &amp; BRITA 12)
                </p>
                <p className="text-[10px] font-semibold text-gray-900">
                  UNIDADE: {nomeUnidade}
                  {empresaAtiva?.cnpj ? ` • CNPJ: ${empresaAtiva.cnpj}` : ""}
                </p>
              </div>
            </div>

            <div className="text-right text-[9px] leading-tight text-gray-700">
              <p className="font-extrabold text-black text-xs uppercase font-mono">
                COMPETÊNCIA: {rotuloCompetencia} ({competencia})
              </p>
              <p className="font-semibold text-gray-800 mt-0.5">
                EMISSÃO: {agoraTexto}
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-gray-100 text-gray-900 border border-gray-300">
                Relatório A4 • Controle Operacional
              </span>
            </div>
          </div>
        </div>

        {/* 2. CARTÃO DE COMPRA COM REPASSE + INDICADORES */}
        <div className="border border-gray-400 rounded-md p-2.5 mb-3 bg-gray-50/70 page-break-inside-avoid">
          <div className="flex justify-between items-center border-b border-gray-300 pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <strong className="text-[11px] uppercase font-black text-black tracking-wide">
                Resumo da Compra &amp; Saldos da Competência
              </strong>
              {compraMensal?.observacao && (
                <span className="text-[9px] text-gray-600 italic">
                  (Obs: {compraMensal.observacao})
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold font-mono text-gray-800">
              Total Financeiro Cheques: {formatarMoeda(totalCheques)}
            </div>
          </div>

          {/* Grid de Indicadores */}
          <div className="grid grid-cols-6 gap-2 text-center">
            {/* Compra do Mês */}
            <div className="border border-gray-300 rounded p-1.5 bg-white">
              <span className="text-[8px] font-bold uppercase text-gray-600 block">
                Compra do Mês
              </span>
              <span className="text-sm font-black font-mono text-black block">
                {resumo.compraTotalM3.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[8px] text-gray-500">m³ contratados</span>
            </div>

            {/* Saldo Anterior (Repasse) */}
            <div className="border border-gray-300 rounded p-1.5 bg-white">
              <span className="text-[8px] font-bold uppercase text-gray-600 block">
                Saldo Anterior (Repasse)
              </span>
              <span
                className={`text-sm font-black font-mono block ${
                  resumo.saldoRepasseM3 > 0
                    ? "text-emerald-700"
                    : resumo.saldoRepasseM3 < 0
                      ? "text-rose-700"
                      : "text-gray-800"
                }`}
              >
                {resumo.saldoRepasseM3 > 0 ? "+" : ""}
                {resumo.saldoRepasseM3.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[8px] text-gray-500">
                {resumo.saldoRepasseM3 > 0
                  ? "Crédito a somar"
                  : resumo.saldoRepasseM3 < 0
                    ? "Débito a abater"
                    : "Sem repasse"}
              </span>
            </div>

            {/* Entregue Brita 19 */}
            <div className="border border-gray-300 rounded p-1.5 bg-white">
              <span className="text-[8px] font-bold uppercase text-gray-600 block">
                Entregue Brita 19
              </span>
              <span className="text-sm font-black font-mono text-blue-800 block">
                {resumo.totalEntregue19M3.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[8px] text-gray-500">
                {resumo.totalEntregas19Qtd} cargas (19mm)
              </span>
            </div>

            {/* Entregue Brita 12 */}
            <div className="border border-gray-300 rounded p-1.5 bg-white">
              <span className="text-[8px] font-bold uppercase text-gray-600 block">
                Entregue Brita 12
              </span>
              <span className="text-sm font-black font-mono text-purple-800 block">
                {resumo.totalEntregue12M3.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[8px] text-gray-500">
                {resumo.totalEntregas12Qtd} cargas (12,5mm)
              </span>
            </div>

            {/* Entregue Geral */}
            <div className="border border-gray-300 rounded p-1.5 bg-white">
              <span className="text-[8px] font-bold uppercase text-gray-600 block">
                Total Entregue Geral
              </span>
              <span className="text-sm font-black font-mono text-black block">
                {resumo.totalEntregueGeralM3.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[8px] text-gray-500">
                {resumo.totalEntregasQtd} cargas no mês
              </span>
            </div>

            {/* Saldo a Receber */}
            <div
              className={`border rounded p-1.5 ${
                resumo.entregasExcedentes
                  ? "bg-rose-50 border-rose-400 text-rose-900"
                  : resumo.saldoAReceberM3 === 0 && resumo.totalDisponivelM3 > 0
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                    : "bg-white border-gray-300 text-black"
              }`}
            >
              <span className="text-[8px] font-bold uppercase block">
                Saldo a Receber
              </span>
              <span className="text-sm font-black font-mono block">
                {resumo.saldoAReceberM3.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[8px]">
                {resumo.entregasExcedentes
                  ? "Excesso entregue"
                  : resumo.saldoAReceberM3 === 0 && resumo.totalDisponivelM3 > 0
                    ? "100% recebido"
                    : "m³ pendentes"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. SEÇÃO DE CHEQUES DA COMPRA */}
        <div className="border border-gray-300 rounded-md p-2.5 mb-3 bg-white page-break-inside-avoid">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-1.5">
            <div className="flex items-center gap-2">
              <strong className="text-[10px] uppercase font-black text-black">
                Cheques Vinculados à Compra ({cheques.length})
              </strong>
              <span className="text-[9px] text-gray-600">
                Pagos: {formatarMoeda(totalChequesPagos)} • Pendentes:{" "}
                {formatarMoeda(totalChequesPendentes)}
              </span>
            </div>
            <div className="text-[10px] font-black font-mono text-black">
              Total Cheques: {formatarMoeda(totalCheques)}
            </div>
          </div>

          {cheques.length === 0 ? (
            <p className="text-[9px] text-gray-500 italic py-1 text-center">
              Nenhum cheque lançado para a compra desta competência.
            </p>
          ) : (
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black border-y border-gray-300 font-bold uppercase text-[8px]">
                  <th className="py-1 px-1.5 text-left w-16">Nº Cheque</th>
                  <th className="py-1 px-1.5 text-left w-24">
                    Vencimento (Cai)
                  </th>
                  <th className="py-1 px-1.5 text-right w-28">Valor (R$)</th>
                  <th className="py-1 px-1.5 text-center w-20">Status</th>
                  <th className="py-1 px-1.5 text-left">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cheques.map((chq) => (
                  <tr key={chq.id}>
                    <td className="py-1 px-1.5 font-mono font-bold text-black">
                      {chq.numero || "—"}
                    </td>
                    <td className="py-1 px-1.5 font-mono text-gray-800">
                      {formatarDataBr(chq.data_vencimento)}
                    </td>
                    <td className="py-1 px-1.5 font-mono font-bold text-right text-black">
                      {formatarMoeda(Number(chq.valor) || 0)}
                    </td>
                    <td className="py-1 px-1.5 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                          chq.pago
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {chq.pago ? "PAGO" : "PENDENTE"}
                      </span>
                    </td>
                    <td className="py-1 px-1.5 text-gray-700 text-[8px]">
                      {chq.observacao || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 text-black border-t border-black font-bold uppercase text-[9px]">
                  <td colSpan={2} className="py-1 px-1.5 text-left">
                    Total dos Cheques ({cheques.length})
                  </td>
                  <td className="py-1 px-1.5 text-right font-mono font-black">
                    {formatarMoeda(totalCheques)}
                  </td>
                  <td colSpan={2} className="py-1 px-1.5 text-right text-[8px]">
                    Pagos: {formatarMoeda(totalChequesPagos)} | Pendentes:{" "}
                    {formatarMoeda(totalChequesPendentes)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 4. TABELA DE ENTREGAS FILTRADA (SEM COLUNA AÇÕES) */}
        <div className="border border-gray-300 rounded-md p-2.5 bg-white">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
            <div>
              <strong className="text-[10px] uppercase font-black text-black">
                Histórico de Entregas Recebidas ({entregas.length} cargas)
              </strong>
              {temFiltroAtivo && (
                <span className="text-[8px] text-gray-600 block mt-0.5">
                  Filtros aplicados:{" "}
                  {filtroTipoBrita !== "ALL"
                    ? `Brita ${filtroTipoBrita}`
                    : "Todas as britas"}
                  {filtroFornecedor.trim()
                    ? ` • Fornecedor: "${filtroFornecedor.trim()}"`
                    : ""}
                  {filtroDataInicio
                    ? ` • De: ${formatarDataBr(filtroDataInicio)}`
                    : ""}
                  {filtroDataFim
                    ? ` • Até: ${formatarDataBr(filtroDataFim)}`
                    : ""}
                </span>
              )}
            </div>
            <div className="text-right text-[10px] font-mono font-black text-black">
              Volume Listado:{" "}
              {totalVolumeEntregasFiltradas.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              })}{" "}
              m³
            </div>
          </div>

          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="bg-gray-100 text-black border-y-2 border-black font-bold uppercase text-[8px]">
                <th className="py-1.5 px-1.5 text-left w-20">Data</th>
                <th className="py-1.5 px-1.5 text-left w-20">Tipo</th>
                <th className="py-1.5 px-1.5 text-left w-28">Qtd. Informada</th>
                <th className="py-1.5 px-1.5 text-left w-20">Densidade</th>
                <th className="py-1.5 px-1.5 text-right w-24">Volume (m³)</th>
                <th className="py-1.5 px-1.5 text-left">
                  Fornecedor / Pedreira
                </th>
                <th className="py-1.5 px-1.5 text-left w-24">Documento / NF</th>
                <th className="py-1.5 px-1.5 text-left">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entregas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center text-gray-500 italic text-[10px]"
                  >
                    Nenhuma entrega encontrada para os critérios informados.
                  </td>
                </tr>
              ) : (
                entregas.map((ent) => (
                  <tr
                    key={ent.id}
                    className="page-break-inside-avoid"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    <td className="py-1 px-1.5 font-mono text-gray-800">
                      {formatarDataBr(ent.data)}
                    </td>
                    <td className="py-1 px-1.5 font-bold">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold ${
                          ent.tipo_brita === "19"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : "bg-purple-100 text-purple-900 border border-purple-300"
                        }`}
                      >
                        Brita {ent.tipo_brita}
                      </span>
                    </td>
                    <td className="py-1 px-1.5 font-mono font-medium text-black">
                      {Number(ent.quantidade).toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {ent.unidade}
                    </td>
                    <td className="py-1 px-1.5 font-mono text-gray-600">
                      {ent.unidade === "t"
                        ? (ent.densidade ?? 1.5).toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="py-1 px-1.5 font-mono font-bold text-right text-black">
                      {Number(ent.quantidade_m3).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      })}{" "}
                      m³
                    </td>
                    <td className="py-1 px-1.5 text-black">
                      {ent.fornecedor || "—"}
                    </td>
                    <td className="py-1 px-1.5 font-mono text-[8px] text-gray-700">
                      {ent.documento || "—"}
                    </td>
                    <td className="py-1 px-1.5 text-gray-700 text-[8px]">
                      {ent.observacao || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 text-black border-t-2 border-black font-bold uppercase text-[9px]">
                <td colSpan={4} className="py-1.5 px-1.5 text-left">
                  TOTAIS DAS ENTREGAS LISTADAS ({entregas.length} CARGAS)
                </td>
                <td className="py-1.5 px-1.5 text-right font-mono font-black">
                  {totalVolumeEntregasFiltradas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3,
                  })}{" "}
                  m³
                </td>
                <td colSpan={3} className="py-1.5 px-1.5 text-right text-[8px]">
                  Geral Mês:{" "}
                  {resumo.totalEntregueGeralM3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  m³ (B19: {resumo.totalEntregue19M3.toLocaleString("pt-BR")} m³
                  | B12: {resumo.totalEntregue12M3.toLocaleString("pt-BR")} m³)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* NOTA DE RODAPÉ */}
        <div className="mt-3 pt-2 border-t border-gray-300 text-[8px] text-gray-600 flex justify-between items-center">
          <span>
            GC MIX Concreto Usinado • Módulo de Estoque e Controle de Britas
          </span>
          <span>
            Documento gerado automaticamente para conferência operacional e
            financeira
          </span>
        </div>
      </div>
    )
  }

export default ImpressaoControleBritas
