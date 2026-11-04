import React from "react"
import { TotaisUnidadeCalculados, formatarMoeda } from "./folha-helpers"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Layers } from "lucide-react"

interface BlocoSomaDuasFolhasProps {
  competencia: string
  totaisMonteiro: TotaisUnidadeCalculados
  totaisSje: TotaisUnidadeCalculados
  totaisConsolidado: TotaisUnidadeCalculados
  onImprimirA4: () => void
}

export const BlocoSomaDuasFolhas: React.FC<BlocoSomaDuasFolhasProps> = ({
  competencia,
  totaisMonteiro,
  totaisSje,
  totaisConsolidado,
  onImprimirA4,
}) => {
  const linhasComparativas = [
    {
      label: "Quinzena (Adiantamento)",
      m: totaisMonteiro.totalQuinzena,
      s: totaisSje.totalQuinzena,
      c: totaisConsolidado.totalQuinzena,
    },
    {
      label: "Mensal Líquido (Puro)",
      m: totaisMonteiro.totalMensalPuro,
      s: totaisSje.totalMensalPuro,
      c: totaisConsolidado.totalMensalPuro,
    },
    {
      label: "Produção a Pagar",
      m: totaisMonteiro.totalProducaoAPagar,
      s: totaisSje.totalProducaoAPagar,
      c: totaisConsolidado.totalProducaoAPagar,
    },
    {
      label: "Férias (Linha própria)",
      m: totaisMonteiro.totalFerias,
      s: totaisSje.totalFerias,
      c: totaisConsolidado.totalFerias,
      destaqueCor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "13º Salário (Proporcional)",
      m: totaisMonteiro.totalDecimo,
      s: totaisSje.totalDecimo,
      c: totaisConsolidado.totalDecimo,
      destaqueCor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Comissões de Vendas",
      m: totaisMonteiro.totalComissaoVendas,
      s: totaisSje.totalComissaoVendas,
      c: totaisConsolidado.totalComissaoVendas,
    },
    {
      label: "Ajuda de Custo Vendedores",
      m: totaisMonteiro.totalAjudaCustoVendas,
      s: totaisSje.totalAjudaCustoVendas,
      c: totaisConsolidado.totalAjudaCustoVendas,
    },
    {
      label: "Terceiros (Informativo)",
      m: totaisMonteiro.totalTerceiros,
      s: totaisSje.totalTerceiros,
      c: totaisConsolidado.totalTerceiros,
      destaqueCor: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <Card className="border shadow-sm bg-gradient-to-b from-card to-muted/10">
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            SOMA DAS DUAS FOLHAS — MONTEIRO + SJE ({competencia})
          </CardTitle>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Consolidação unificada das despesas de folha das duas unidades
            ativas do grupo.
          </div>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={onImprimirA4}
          className="h-8 text-xs gap-1.5 shadow-sm"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir A4 (Soma das Duas Folhas)
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="border rounded-lg overflow-x-auto bg-card shadow-sm">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3 min-w-[200px]">DISCRIMINADO</th>
                <th className="py-2.5 px-3 text-right">MONTEIRO</th>
                <th className="py-2.5 px-3 text-right">SJE</th>
                <th className="py-2.5 px-3 text-right font-bold bg-primary/10 text-foreground">
                  CONSOLIDADO GC MIX
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {linhasComparativas.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-muted-foreground">
                    {item.label}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-medium ${
                      item.destaqueCor || ""
                    }`}
                  >
                    {formatarMoeda(item.m)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-medium ${
                      item.destaqueCor || ""
                    }`}
                  >
                    {formatarMoeda(item.s)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold bg-primary/5 ${
                      item.destaqueCor || "text-foreground"
                    }`}
                  >
                    {formatarMoeda(item.c)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted font-bold border-t">
              <tr className="border-t">
                <td className="py-2.5 px-3">
                  TOTAL DA UNIDADE (SEM TERCEIROS)
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatarMoeda(totaisMonteiro.totalUnidadeGeral)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatarMoeda(totaisSje.totalUnidadeGeral)}
                </td>
                <td className="py-2.5 px-3 text-right bg-primary/10 text-primary">
                  {formatarMoeda(totaisConsolidado.totalUnidadeGeral)}
                </td>
              </tr>
              <tr className="bg-primary/15 text-primary text-sm font-extrabold border-t-2 border-primary/30">
                <td className="py-3 px-3">TOTAL GERAL GC MIX</td>
                <td className="py-3 px-3 text-right">
                  {formatarMoeda(totaisMonteiro.totalUnidadeGeral)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatarMoeda(totaisSje.totalUnidadeGeral)}
                </td>
                <td className="py-3 px-3 text-right text-base">
                  {formatarMoeda(totaisConsolidado.totalUnidadeGeral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
