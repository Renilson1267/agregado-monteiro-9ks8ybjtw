import React, { useState } from "react"
import {
  LinhaFolhaProcessada,
  TotaisUnidadeCalculados,
  formatarMoeda,
} from "./folha-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, Pencil, Printer } from "lucide-react"

interface AbaQuinzenaProps {
  linhas: LinhaFolhaProcessada[]
  totais: TotaisUnidadeCalculados
  onSalvarQuinzenaInline: (linhaId: string, novoValor: number) => Promise<void>
  onSalvarAdiantamentoInline: (
    linhaId: string,
    novoValor: number,
  ) => Promise<void>
  onEditarLinha: (linha: LinhaFolhaProcessada) => void
  onImprimirA4: () => void
}

type CampoEditavel = "quinzena" | "adiantamento"

export const AbaQuinzena: React.FC<AbaQuinzenaProps> = ({
  linhas,
  totais,
  onSalvarQuinzenaInline,
  onSalvarAdiantamentoInline,
  onEditarLinha,
  onImprimirA4,
}) => {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [campoEditando, setCampoEditando] = useState<CampoEditavel | null>(null)
  const [valorTemp, setValorTemp] = useState<string>("")
  const [salvando, setSalvando] = useState(false)

  const iniciarEdicao = (linha: LinhaFolhaProcessada, campo: CampoEditavel) => {
    setEditandoId(linha.id)
    setCampoEditando(campo)
    setValorTemp(
      String(
        campo === "quinzena"
          ? Number(linha.quinzenaCalculada || 0)
          : Number(linha.adiantamentoEfetivo || 0),
      ),
    )
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setCampoEditando(null)
    setValorTemp("")
  }

  const salvarEdicao = async (linhaId: string, campo: CampoEditavel) => {
    try {
      setSalvando(true)
      const num = parseFloat(valorTemp.replace(",", ".")) || 0
      const valorFinal = Math.max(0, Math.round(num * 100) / 100)
      if (campo === "quinzena") {
        await onSalvarQuinzenaInline(linhaId, valorFinal)
      } else {
        await onSalvarAdiantamentoInline(linhaId, valorFinal)
      }
      setEditandoId(null)
      setCampoEditando(null)
      setValorTemp("")
    } finally {
      setSalvando(false)
    }
  }

  // Soma dos VALORES A PAGAR das linhas (quinzena − adiantamento, mínimo 0),
  // calculada sobre os valores digitados exibidos
  const somaAPagar =
    Math.round(
      linhas.reduce(
        (acc, l) =>
          acc +
          Math.max(0, l.quinzenaCalculada - l.adiantamentoEfetivo) *
            (l.inativo || l.inativoEfetivo ? 0 : 1),
        0,
      ) * 100,
    ) / 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Quinzena digitável — 40% sugerido (clique no valor para editar);
          Adiantamento digitável (desconto). VALOR A PAGAR = quinzena −
          adiantamento.
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
              <th className="py-2.5 px-2 text-right">SALÁRIO BRUTO</th>
              <th className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400 font-semibold">
                QUINZENA (40%)
              </th>
              <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                ADIANTAMENTO
              </th>
              <th className="py-2.5 px-2 text-right font-bold text-foreground bg-primary/10">
                VALOR A PAGAR
              </th>
              <th className="py-2.5 px-3">CHAVE PIX / CONTA</th>
              <th className="py-2.5 px-2 text-center w-20">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {linhas.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum registro para exibição.
                </td>
              </tr>
            ) : (
              linhas.map((l) => {
                const isTerceiro = l.tipo === "Terceiro"
                const editandoQuinzena =
                  editandoId === l.id && campoEditando === "quinzena"
                const editandoAdiantamento =
                  editandoId === l.id && campoEditando === "adiantamento"
                const aPagar = Math.max(
                  0,
                  l.quinzenaCalculada - l.adiantamentoEfetivo,
                )

                const renderCelulaEditavel = (
                  campo: CampoEditavel,
                  editando: boolean,
                  cor: string,
                  valorExibicao: number,
                  titulo: string,
                ) => {
                  if (editando) {
                    return (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={valorTemp}
                          onChange={(e) => setValorTemp(e.target.value)}
                          onBlur={() => salvarEdicao(l.id, campo)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarEdicao(l.id, campo)
                            if (e.key === "Escape") cancelarEdicao()
                          }}
                          className="h-6 w-20 text-xs px-1 text-right"
                          autoFocus
                          disabled={salvando}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => salvarEdicao(l.id, campo)}
                          className="h-6 w-6 p-0 text-emerald-600"
                          disabled={salvando}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  }
                  return (
                    <div
                      onClick={() => iniciarEdicao(l, campo)}
                      className={`cursor-pointer hover:bg-muted/70 rounded px-1 py-0.5 transition-colors ${cor}`}
                      title={titulo}
                    >
                      {valorExibicao > 0 ? formatarMoeda(valorExibicao) : "—"}
                    </div>
                  )
                }

                return (
                  <tr
                    key={l.id}
                    className={`hover:bg-muted/40 transition-colors ${
                      l.oculto ? "opacity-60 bg-muted/20" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{l.nome}</span>
                        {isTerceiro && (
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
                    {/* BRUTO: só exibição, nunca digitável */}
                    <td className="py-2 px-2 text-right">
                      {formatarMoeda(l.bruto)}
                    </td>
                    {/* QUINZENA EDITÁVEL INLINE */}
                    <td className="py-2 px-2 text-right font-medium">
                      {renderCelulaEditavel(
                        "quinzena",
                        editandoQuinzena,
                        "text-amber-600 dark:text-amber-400",
                        l.quinzenaCalculada,
                        "Clique para digitar o valor da quinzena",
                      )}
                    </td>
                    {/* ADIANTAMENTO EDITÁVEL INLINE (desconto) */}
                    <td className="py-2 px-2 text-right">
                      {renderCelulaEditavel(
                        "adiantamento",
                        editandoAdiantamento,
                        "text-red-600 dark:text-red-400",
                        l.adiantamentoEfetivo,
                        "Clique para digitar o valor do adiantamento (desconto)",
                      )}
                    </td>
                    {/* VALOR A PAGAR = quinzena − adiantamento, mínimo 0 */}
                    <td className="py-2 px-2 text-right font-bold text-foreground bg-primary/10">
                      {formatarMoeda(aPagar)}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-[11px]">
                      {l.pix || l.chave_pix || l.conta || "—"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditarLinha(l)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar linha da quinzena"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })
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
              <td className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400">
                {formatarMoeda(totais.totalQuinzena)}
              </td>
              <td className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                {formatarMoeda(totais.totalAdiantamento)}
              </td>
              <td className="py-2.5 px-2 text-right text-foreground bg-primary/10">
                {formatarMoeda(somaAPagar)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
