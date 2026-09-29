import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { LOGO_GC_MIX_HORIZONTAL } from "@/assets/logos"
import { MesAnualCaixa } from "@/types/caixa"

interface ImpressaoAnualProps {
  empresaNome: string
  empresaCnpj?: string | null
  ano: number
  categoriaFiltro?: string
  saldoInicialAno: number
  meses: MesAnualCaixa[]
  totalEntradasAno: number
  totalSaidasAno: number
  resultadoAno: number
  saldoFinalAno: number
}

export function ImpressaoAnualA4({
  empresaNome,
  empresaCnpj,
  ano,
  categoriaFiltro,
  saldoInicialAno,
  meses,
  totalEntradasAno,
  totalSaidasAno,
  resultadoAno,
  saldoFinalAno,
}: ImpressaoAnualProps) {
  const fmtMoeda = (val: number) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div>
      {/* Botão de Disparo */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleImprimir}
        className="gap-2 bg-background hover:bg-muted text-xs font-semibold shadow-xs"
      >
        <Printer className="w-4 h-4 text-primary" />
        Imprimir Fechamento Anual (A4 Paisagem)
      </Button>

      {/* ÁREA EXCLUSIVA DE IMPRESSÃO A4 PAISAGEM */}
      <div className="hidden print:block fixed inset-0 bg-white text-slate-900 z-50 p-6 overflow-visible print-a4-landscape">
        <style>{`
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: white !important;
              color: #0f172a !important;
            }
            .no-print, header, aside, #app-sidebar, nav {
              display: none !important;
            }
            .print-a4-landscape {
              display: block !important;
              position: static !important;
              padding: 0 !important;
              width: 100% !important;
            }
          }
        `}</style>

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-4">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt="GC MIX"
              className="h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {empresaNome}
              </h1>
              <p className="text-[11px] text-slate-600 font-mono">
                {empresaCnpj
                  ? `CNPJ: ${empresaCnpj}`
                  : "GC MIX CONCRETO USINADO"}{" "}
                • DEMONSTRATIVO ANUAL CONSOLIDADO
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              FECHAMENTO ANUAL DE CAIXA ({ano})
            </h2>
            <p className="text-xs font-bold text-slate-700">
              {categoriaFiltro && categoriaFiltro !== "todas"
                ? `Filtrado por: ${categoriaFiltro}`
                : "Todas as Categorias Consolidadas"}
            </p>
            <p className="text-[10px] text-slate-500">
              Gerado em: {new Date().toLocaleDateString("pt-BR")} às{" "}
              {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>

        {/* RESUMO DO ANO */}
        <div className="grid grid-cols-4 gap-3 mb-4 text-center">
          <div className="border border-slate-300 rounded p-2 bg-slate-50">
            <div className="text-[10px] font-bold uppercase text-slate-600">
              Saldo Inicial do Exercício
            </div>
            <div className="text-sm font-black font-mono text-slate-900">
              {fmtMoeda(saldoInicialAno)}
            </div>
          </div>
          <div className="border border-emerald-300 rounded p-2 bg-emerald-50">
            <div className="text-[10px] font-bold uppercase text-emerald-800">
              Total Recebido no Ano (+)
            </div>
            <div className="text-sm font-black font-mono text-emerald-700">
              {fmtMoeda(totalEntradasAno)}
            </div>
          </div>
          <div className="border border-rose-300 rounded p-2 bg-rose-50">
            <div className="text-[10px] font-bold uppercase text-rose-800">
              Total Pago no Ano (-)
            </div>
            <div className="text-sm font-black font-mono text-rose-700">
              {fmtMoeda(totalSaidasAno)}
            </div>
          </div>
          <div className="border-2 border-slate-900 rounded p-2 bg-slate-100">
            <div className="text-[10px] font-extrabold uppercase text-slate-800">
              Saldo Final do Exercício (=)
            </div>
            <div
              className={`text-base font-black font-mono ${
                saldoFinalAno >= 0 ? "text-emerald-800" : "text-rose-800"
              }`}
            >
              {fmtMoeda(saldoFinalAno)}
            </div>
          </div>
        </div>

        {/* TABELA DOS 12 MESES */}
        <div className="border border-slate-300 rounded overflow-hidden mb-6">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[9px]">
              <tr>
                <th className="py-2 px-3">Mês</th>
                <th className="py-2 px-3 text-right">Saldo Inicial</th>
                <th className="py-2 px-3 text-right text-emerald-300">
                  Entradas (+)
                </th>
                <th className="py-2 px-3 text-right text-rose-300">
                  Saídas (-)
                </th>
                <th className="py-2 px-3 text-right">Resultado do Mês</th>
                <th className="py-2 px-3 text-right font-black">Saldo Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {meses.map((m) => (
                <tr
                  key={m.mes}
                  className={m.mes % 2 === 0 ? "bg-slate-50/70" : ""}
                >
                  <td className="py-1.5 px-3 font-bold text-slate-800">
                    {m.nomeMes}{" "}
                    <span className="text-slate-400 font-mono text-[9px]">
                      ({m.competencia})
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                    {fmtMoeda(m.saldoInicial)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {fmtMoeda(m.entradas)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                    {fmtMoeda(m.saidas)}
                  </td>
                  <td
                    className={`py-1.5 px-3 text-right font-mono font-semibold ${
                      m.resultado >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {fmtMoeda(m.resultado)}
                  </td>
                  <td
                    className={`py-1.5 px-3 text-right font-mono font-bold ${
                      m.saldoFinal >= 0 ? "text-slate-900" : "text-rose-700"
                    }`}
                  >
                    {fmtMoeda(m.saldoFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-200 font-black border-t-2 border-slate-900">
              <tr>
                <td className="py-2 px-3 uppercase text-slate-900">
                  TOTAIS CONSOLIDADOS DO ANO
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">
                  {fmtMoeda(saldoInicialAno)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-800">
                  {fmtMoeda(totalEntradasAno)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-rose-800">
                  {fmtMoeda(totalSaidasAno)}
                </td>
                <td
                  className={`py-2 px-3 text-right font-mono ${
                    resultadoAno >= 0 ? "text-emerald-800" : "text-rose-800"
                  }`}
                >
                  {fmtMoeda(resultadoAno)}
                </td>
                <td
                  className={`py-2 px-3 text-right font-mono text-sm ${
                    saldoFinalAno >= 0 ? "text-slate-900" : "text-rose-800"
                  }`}
                >
                  {fmtMoeda(saldoFinalAno)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ASSINATURAS */}
        <div className="mt-8 pt-4 border-t border-slate-400 grid grid-cols-3 gap-8 text-center text-[10px]">
          <div>
            <div className="border-b border-slate-700 w-4/5 mx-auto mb-1.5" />
            <span className="font-bold uppercase text-slate-800">
              Contabilidade / Auditoria
            </span>
          </div>
          <div>
            <div className="border-b border-slate-700 w-4/5 mx-auto mb-1.5" />
            <span className="font-bold uppercase text-slate-800">
              Gerência Administrativa
            </span>
          </div>
          <div>
            <div className="border-b border-slate-700 w-4/5 mx-auto mb-1.5" />
            <span className="font-bold uppercase text-slate-800">
              Diretoria Executiva GC MIX
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
