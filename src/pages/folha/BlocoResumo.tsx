import React from "react"
import { TotaisUnidadeCalculados, formatarMoeda } from "./folha-helpers"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"

interface BlocoResumoProps {
  empresaNome: string
  competencia: string
  totais: TotaisUnidadeCalculados
  mes: number
  onImprimirA4: () => void
}

export const BlocoResumo: React.FC<BlocoResumoProps> = ({
  empresaNome,
  competencia,
  totais,
  mes,
  onImprimirA4,
}) => {
  const itensResumo = [
    {
      label: "Quinzena (Adiantamento Salarial)",
      valor: totais.totalQuinzena,
      destaque: false,
    },
    {
      label: "Mensal Líquido (Puro sem produção)",
      valor: totais.totalMensalPuro,
      destaque: false,
    },
    {
      label: "Produção a Pagar (Obras, Limpeza, Sábado, etc.)",
      valor: totais.totalProducaoAPagar,
      destaque: false,
    },
    {
      label: "Férias (Linha própria desvinculada)",
      valor: totais.totalFerias,
      destaque: true,
      cor: "text-blue-600 dark:text-blue-400",
    },
    ...(mes === 11 || mes === 12
      ? [
          {
            label: `13º Salário (${mes === 11 ? "1ª Parcela" : "2ª Parcela"})`,
            valor: totais.totalDecimo,
            destaque: true,
            cor: "text-purple-600 dark:text-purple-400",
          },
        ]
      : []),
    {
      label: "Comissões de Vendas",
      valor: totais.totalComissaoVendas,
      destaque: false,
    },
    {
      label: "Ajuda de Custo dos Vendedores",
      valor: totais.totalAjudaCustoVendas,
      destaque: false,
    },
  ]

  return (
    <Card className="border shadow-sm">
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Resumo Oficial da Unidade — {empresaNome} ({competencia})
          </CardTitle>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Total consolidado integrando comissões, ajuda de custo, férias e 13º
            no caixa oficial.
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onImprimirA4}
          className="h-8 text-xs gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir Resumo A4
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y">
                {itensResumo.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-2 px-3 text-muted-foreground font-medium">
                      {item.label}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        item.cor || "text-foreground"
                      }`}
                    >
                      {formatarMoeda(item.valor)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/40 font-bold border-t">
                  <td className="py-2.5 px-3">
                    Terceiros (Informativo / Folha à parte)
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">
                    {formatarMoeda(totais.totalTerceiros)}
                  </td>
                </tr>
                <tr className="bg-primary/10 font-bold text-sm border-t-2 border-primary/20">
                  <td className="py-3 px-3 text-foreground">
                    TOTAL DA UNIDADE
                  </td>
                  <td className="py-3 px-3 text-right text-primary text-base font-extrabold">
                    {formatarMoeda(totais.totalUnidadeGeral)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between p-4 rounded-lg bg-muted/20 border text-xs space-y-3">
            <div className="space-y-2">
              <div className="font-semibold text-foreground">
                Regras Aprovadas da Folha GC MIX:
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>
                  <strong>Comissões e Ajuda de Custo:</strong> Integram
                  diretamente o Total da Unidade no resumo financeiro.
                </li>
                <li>
                  <strong>Férias:</strong> Componente próprio do líquido,
                  desvinculado das metas de produção operacional.
                </li>
                <li>
                  <strong>13º Salário:</strong> Calculado nos meses 11
                  (adiantamento 50%) e 12 (líquido anual), com proporcionalidade
                  CLT pelos dias trabalhados.
                </li>
                <li>
                  <strong>Terceiros:</strong> Total exibido para conferência,
                  calculado em folha própria.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-muted-foreground">
              <span>Colaboradores na competência:</span>
              <span className="font-bold text-foreground">
                {totais.totalColaboradores} pessoas
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
