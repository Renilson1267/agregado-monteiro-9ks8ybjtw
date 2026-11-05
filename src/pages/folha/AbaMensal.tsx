import React from "react"
import {
  LinhaFolhaProcessada,
  TotaisUnidadeCalculados,
  formatarMoeda,
} from "./folha-helpers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer } from "lucide-react"
import { calcularSalarioFamilia } from "@/lib/folha-calculos"
import { FolhaTabelaOficial } from "@/types/folha"

interface AbaMensalProps {
  linhas: LinhaFolhaProcessada[]
  totais: TotaisUnidadeCalculados
  tabelaOficial: FolhaTabelaOficial | null
  onImprimirA4: () => void
}

export const AbaMensal: React.FC<AbaMensalProps> = ({
  linhas,
  totais,
  tabelaOficial,
  onImprimirA4,
}) => {
  const calcularFamiliaLinha = (l: LinhaFolhaProcessada): number => {
    if (l.tipo === "Terceiro") return 0
    return (
      Number(
        calcularSalarioFamilia(
          Number(l.bruto || 0),
          Number(l.filhos) || 0,
          tabelaOficial,
        ) ?? l.familiaCalculado,
      ) || 0
    )
  }

  const somaFilhosVisiveis = linhas.reduce(
    (acc, l) => acc + (l.tipo === "Terceiro" ? 0 : Number(l.filhos) || 0),
    0,
  )
  const somaFamiliaVisivel =
    Math.round(
      linhas.reduce((acc, l) => acc + calcularFamiliaLinha(l), 0) * 100,
    ) / 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Mensal Puro: salário bruto com descontos fiscais oficiais (INSS e
          IRRF) e abatimento das quinzenas pagas.
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onImprimirA4}
          className="h-8 text-xs gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir A4
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto bg-card shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
            <tr>
              <th className="py-2.5 px-3">NOME</th>
              <th className="py-2.5 px-2">FUNÇÃO</th>
              <th className="py-2.5 px-2 text-right">BRUTO</th>
              <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                INSS
              </th>
              <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                IRRF
              </th>
              <th className="py-2.5 px-2 text-center">FILHOS</th>
              <th className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                FAMÍLIA
              </th>
              <th className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400">
                QUINZENA
              </th>
              <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                CONSIGNADO
              </th>
              <th className="py-2.5 px-2 text-right font-bold text-foreground bg-primary/10">
                MENSAL LÍQUIDO
              </th>
              <th className="py-2.5 px-3">CHAVE PIX / CONTA</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {linhas.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum registro para exibição.
                </td>
              </tr>
            ) : (
              linhas.map((l) => (
                <tr
                  key={l.id}
                  className={`hover:bg-muted/40 transition-colors ${
                    l.oculto ? "opacity-60 bg-muted/20" : ""
                  }`}
                >
                  <td className="py-2 px-3 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{l.nome}</span>
                      {l.tipo === "Terceiro" && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 text-amber-600 border-amber-400"
                        >
                          Terceiro
                        </Badge>
                      )}
                      {l.oculto && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          Oculto
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {l.funcao || l.cargo || "Geral"}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatarMoeda(l.bruto)}
                  </td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                    {l.inssCalculado > 0 ? formatarMoeda(l.inssCalculado) : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                    {l.irrfCalculado > 0 ? formatarMoeda(l.irrfCalculado) : "—"}
                  </td>
                  <td className="py-2 px-2 text-center text-muted-foreground">
                    {l.tipo === "Terceiro" ? 0 : Number(l.filhos) || 0}
                  </td>
                  <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                    {l.tipo === "Terceiro"
                      ? "—"
                      : calcularFamiliaLinha(l) > 0
                        ? formatarMoeda(calcularFamiliaLinha(l))
                        : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-amber-600 dark:text-amber-400">
                    {l.quinzenaCalculada > 0
                      ? formatarMoeda(l.quinzenaCalculada)
                      : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                    {l.consignadoEfetivo > 0
                      ? formatarMoeda(l.consignadoEfetivo)
                      : "—"}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-foreground bg-primary/10">
                    {formatarMoeda(l.mensalPuro)}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-[11px]">
                    {l.pix || l.chave_pix || l.conta || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-muted font-bold border-t">
            <tr>
              <td colSpan={2} className="py-2.5 px-3">
                TOTAIS
              </td>
              <td className="py-2.5 px-2 text-right">
                {formatarMoeda(totais.totalBruto)}
              </td>
              <td className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                {formatarMoeda(totais.totalInss)}
              </td>
              <td className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                {formatarMoeda(totais.totalIrrf)}
              </td>
              <td className="py-2.5 px-2 text-center">{somaFilhosVisiveis}</td>
              <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                {formatarMoeda(somaFamiliaVisivel)}
              </td>
              <td className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400">
                {formatarMoeda(totais.totalQuinzena)}
              </td>
              <td className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                —
              </td>
              <td className="py-2.5 px-2 text-right text-foreground bg-primary/10">
                {formatarMoeda(totais.totalMensalPuro)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
