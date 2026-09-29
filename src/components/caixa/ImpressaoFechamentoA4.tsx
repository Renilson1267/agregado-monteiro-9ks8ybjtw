import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"
import { LOGO_GC_MIX_HORIZONTAL } from "@/assets/logos"
import {
  CaixaTotaisCompetencia,
  ResumoCategoriaCaixa,
  ResumoObraCaixa,
  CaixaLancamento,
} from "@/types/caixa"

interface ImpressaoFechamentoProps {
  empresaNome: string
  empresaCnpj?: string | null
  competencia: string // YYYY-MM
  totais: CaixaTotaisCompetencia
  categoriasEntradas: ResumoCategoriaCaixa[]
  categoriasSaidas: ResumoCategoriaCaixa[]
  obras: ResumoObraCaixa[]
  lancamentos: CaixaLancamento[]
}

export function ImpressaoFechamentoA4({
  empresaNome,
  empresaCnpj,
  competencia,
  totais,
  categoriasEntradas,
  categoriasSaidas,
  obras,
  lancamentos,
}: ImpressaoFechamentoProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const fmtMoeda = (val: number) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleImprimir = () => {
    window.print()
  }

  // Competência formatada por extenso: "09/2026"
  const [ano, mes] = competencia.split("-")
  const mesesExt = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  const mesExt = mesesExt[parseInt(mes, 10) - 1] || mes

  return (
    <div>
      {/* Botão de Disparo Visível na Tela */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleImprimir}
        className="gap-2 bg-background hover:bg-muted text-xs font-semibold shadow-xs"
      >
        <Printer className="w-4 h-4 text-primary" />
        Imprimir Fechamento (A4 Paisagem)
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

        {/* CABEÇALHO OFICIAL COM LOGO E DADOS DA EMPRESA */}
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
                • SISTEMA DE GESTÃO FINANCEIRA
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              DEMONSTRATIVO DE FECHAMENTO MENSAL DE CAIXA
            </h2>
            <p className="text-xs font-bold text-emerald-800">
              Competência: {mesExt} de {ano} ({mes}/{ano})
            </p>
            <p className="text-[10px] text-slate-500">
              Gerado em: {new Date().toLocaleDateString("pt-BR")} às{" "}
              {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>

        {/* RESUMO EXECUTIVO: SALDO ANTERIOR + ENTRADAS - SAÍDAS = SALDO FINAL */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-600">
              Saldo Anterior Acumulado
            </div>
            <div
              className={`text-sm font-black font-mono ${
                totais.saldoAnterior >= 0 ? "text-slate-900" : "text-rose-700"
              }`}
            >
              {fmtMoeda(totais.saldoAnterior)}
            </div>
          </div>

          <div className="border border-emerald-300 rounded p-2.5 bg-emerald-50 text-center">
            <div className="text-[10px] font-bold uppercase text-emerald-800">
              Total de Entradas (+)
            </div>
            <div className="text-sm font-black font-mono text-emerald-700">
              {fmtMoeda(totais.totalEntradas)}
            </div>
            <div className="text-[9px] text-emerald-800 font-medium">
              ({totais.quantidadeEntradas} lançamentos)
            </div>
          </div>

          <div className="border border-rose-300 rounded p-2.5 bg-rose-50 text-center">
            <div className="text-[10px] font-bold uppercase text-rose-800">
              Total de Saídas (-)
            </div>
            <div className="text-sm font-black font-mono text-rose-700">
              {fmtMoeda(totais.totalSaidas)}
            </div>
            <div className="text-[9px] text-rose-800 font-medium">
              ({totais.quantidadeSaidas} lançamentos)
            </div>
          </div>

          <div className="border-2 border-slate-900 rounded p-2.5 bg-slate-100 text-center">
            <div className="text-[10px] font-extrabold uppercase text-slate-800">
              Saldo Final em Caixa (=)
            </div>
            <div
              className={`text-base font-black font-mono ${
                totais.saldoFinal >= 0 ? "text-emerald-800" : "text-rose-800"
              }`}
            >
              {fmtMoeda(totais.saldoFinal)}
            </div>
            <div className="text-[9px] font-bold text-slate-600">
              Resultado Mês: {fmtMoeda(totais.resultadoMes)}
            </div>
          </div>
        </div>

        {/* DETALHAMENTO EM 2 COLUNAS: ENTRADAS (RECEBIMENTOS E OBRAS) X SAÍDAS POR CATEGORIA */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
          {/* Coluna 1: Entradas e Obras */}
          <div className="space-y-3">
            <div className="border border-slate-300 rounded overflow-hidden">
              <div className="bg-emerald-700 text-white font-bold px-2 py-1 flex justify-between items-center text-[11px]">
                <span>RECEBIMENTOS POR CATEGORIA (ENTRADAS)</span>
                <span>{fmtMoeda(totais.totalEntradas)}</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[9px] border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-2">Categoria</th>
                    <th className="py-1 px-2 text-center">Qtd</th>
                    <th className="py-1 px-2 text-right">Total</th>
                    <th className="py-1 px-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoriasEntradas.map((c) => (
                    <tr key={c.categoria}>
                      <td className="py-1 px-2 font-medium">{c.categoria}</td>
                      <td className="py-1 px-2 text-center text-slate-600">
                        {c.quantidade}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-bold text-emerald-800">
                        {fmtMoeda(c.total)}
                      </td>
                      <td className="py-1 px-2 text-right text-slate-500 font-mono">
                        {c.percentual.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {categoriasEntradas.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-2 text-center text-slate-500 italic"
                      >
                        Sem entradas registradas no período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Obras consolidadas no mês */}
            {obras.length > 0 && (
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-sky-800 text-white font-bold px-2 py-1 flex justify-between items-center text-[11px]">
                  <span>CONSOLIDAÇÃO POR OBRA NO MÊS</span>
                  <span>{obras.length} Obras</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[9px] border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-2">Obra / Cliente</th>
                      <th className="py-1 px-2 text-center">Lançamentos</th>
                      <th className="py-1 px-2 text-right">Total Recebido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {obras.map((o) => (
                      <tr key={o.obraNome}>
                        <td className="py-1 px-2 font-medium">{o.obraNome}</td>
                        <td className="py-1 px-2 text-center text-slate-600">
                          {o.quantidade}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-sky-900">
                          {fmtMoeda(o.totalRecebimentos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Coluna 2: Saídas por Categoria */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-rose-800 text-white font-bold px-2 py-1 flex justify-between items-center text-[11px]">
              <span>DESPESAS POR CATEGORIA (SAÍDAS)</span>
              <span>{fmtMoeda(totais.totalSaidas)}</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[9px] border-b border-slate-200">
                <tr>
                  <th className="py-1 px-2">Categoria de Despesa</th>
                  <th className="py-1 px-2 text-center">Qtd</th>
                  <th className="py-1 px-2 text-right">Total</th>
                  <th className="py-1 px-2 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriasSaidas.map((c) => (
                  <tr key={c.categoria}>
                    <td className="py-1 px-2 font-medium">{c.categoria}</td>
                    <td className="py-1 px-2 text-center text-slate-600">
                      {c.quantidade}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-rose-800">
                      {fmtMoeda(c.total)}
                    </td>
                    <td className="py-1 px-2 text-right text-slate-500 font-mono">
                      {c.percentual.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {categoriasSaidas.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-2 text-center text-slate-500 italic"
                    >
                      Sem despesas registradas no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CAMPO DE ASSINATURAS PADRÃO DA FOLHA E FINANCEIRO */}
        <div className="mt-8 pt-6 border-t border-slate-400 grid grid-cols-3 gap-8 text-center text-[10px]">
          <div>
            <div className="border-b border-slate-700 w-4/5 mx-auto mb-1.5" />
            <span className="font-bold uppercase text-slate-800">
              Responsável Financeiro / Caixa
            </span>
            <div className="text-[9px] text-slate-500">Conferido e Lançado</div>
          </div>
          <div>
            <div className="border-b border-slate-700 w-4/5 mx-auto mb-1.5" />
            <span className="font-bold uppercase text-slate-800">
              Gerência de Operações
            </span>
            <div className="text-[9px] text-slate-500">Validado</div>
          </div>
          <div>
            <div className="border-b border-slate-700 w-4/5 mx-auto mb-1.5" />
            <span className="font-bold uppercase text-slate-800">
              Diretoria Geral GC MIX
            </span>
            <div className="text-[9px] text-slate-500">
              Aprovado para Fechamento
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
