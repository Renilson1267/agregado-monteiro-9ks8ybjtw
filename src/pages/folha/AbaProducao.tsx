import React, { useState } from "react"
import {
  LinhaFolhaProcessada,
  TotaisUnidadeCalculados,
  formatarMoeda,
} from "./folha-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Printer, Check } from "lucide-react"

interface AbaProducaoProps {
  linhas: LinhaFolhaProcessada[]
  totais: TotaisUnidadeCalculados
  onAtualizarCamposInline: (
    linhaId: string,
    campos: Record<string, number>,
  ) => Promise<void>
  onImprimirA4: () => void
}

export const AbaProducao: React.FC<AbaProducaoProps> = ({
  linhas,
  totais,
  onAtualizarCamposInline,
  onImprimirA4,
}) => {
  const [editandoLinhaId, setEditandoLinhaId] = useState<string | null>(null)
  const [campoAtivo, setCampoAtivo] = useState<string | null>(null)
  const [valorTemp, setValorTemp] = useState<string>("")
  const [salvando, setSalvando] = useState(false)

  const iniciarEdicao = (
    linhaId: string,
    campo: string,
    valorAtual: number,
  ) => {
    setEditandoLinhaId(linhaId)
    setCampoAtivo(campo)
    setValorTemp(String(valorAtual || 0))
  }

  const salvarCampo = async (linhaId: string, campo: string) => {
    try {
      setSalvando(true)
      const num = parseFloat(valorTemp.replace(",", ".")) || 0
      await onAtualizarCamposInline(linhaId, { [campo]: num })
      setEditandoLinhaId(null)
      setCampoAtivo(null)
    } finally {
      setSalvando(false)
    }
  }

  const renderCampoEditavel = (
    linha: LinhaFolhaProcessada,
    campo: string,
    valor: number,
    isMoeda = true,
  ) => {
    const isEditando = editandoLinhaId === linha.id && campoAtivo === campo

    if (isEditando) {
      return (
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            step="0.01"
            value={valorTemp}
            onChange={(e) => setValorTemp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvarCampo(linha.id, campo)
              if (e.key === "Escape") {
                setEditandoLinhaId(null)
                setCampoAtivo(null)
              }
            }}
            className="h-6 w-16 text-xs px-1 text-right"
            autoFocus
            disabled={salvando}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => salvarCampo(linha.id, campo)}
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
        onClick={() => iniciarEdicao(linha.id, campo, valor)}
        className="cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 text-right font-medium transition-colors"
        title="Clique para editar inline"
      >
        {isMoeda ? (valor > 0 ? formatarMoeda(valor) : "—") : valor || "0"}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Produção Operacional: obras, limpeza, sábado, feriado, ajuda e
          gratificação. A coluna Férias está disponível para digitação inline,
          mas <strong>NÃO compõe</strong> o A Pagar da produção.
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
              <th className="py-2.5 px-3 min-w-[170px]">NOME</th>
              <th className="py-2.5 px-2 text-right">OBRAS</th>
              <th className="py-2.5 px-2 text-right">LIMPEZA</th>
              <th className="py-2.5 px-2 text-right">SÁBADO</th>
              <th className="py-2.5 px-2 text-right">FERIADO</th>
              <th className="py-2.5 px-2 text-right">AJUDA CUSTO</th>
              <th className="py-2.5 px-2 text-right">GRATIFICAÇÃO</th>
              <th className="py-2.5 px-2 text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-semibold">
                FÉRIAS (EDITÁVEL)
              </th>
              <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                ADIANTAMENTO
              </th>
              <th className="py-2.5 px-2 text-right font-bold text-foreground bg-primary/10">
                A PAGAR (PRODUÇÃO)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {linhas.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
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
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right">
                    {renderCampoEditavel(
                      l,
                      "obras",
                      Number(l.obras || 0),
                      false,
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {renderCampoEditavel(l, "limpeza", Number(l.limpeza || 0))}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {renderCampoEditavel(l, "sabado", Number(l.sabado || 0))}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {renderCampoEditavel(l, "feriado", Number(l.feriado || 0))}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {renderCampoEditavel(
                      l,
                      "ajuda_custo",
                      Number(l.ajuda_custo || 0),
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {renderCampoEditavel(
                      l,
                      "gratificacao",
                      Number(l.gratificacao || 0),
                    )}
                  </td>
                  {/* Férias editável inline */}
                  <td className="py-2 px-2 text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                    {renderCampoEditavel(l, "ferias", Number(l.ferias || 0))}
                  </td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                    {renderCampoEditavel(
                      l,
                      "adiantamento",
                      Number(l.adiantamento || 0),
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-foreground bg-primary/10">
                    {formatarMoeda(l.producaoAPagar)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-muted font-bold border-t">
            <tr>
              <td className="py-2.5 px-3">TOTAIS</td>
              <td className="py-2.5 px-2 text-right">—</td>
              <td className="py-2.5 px-2 text-right">—</td>
              <td className="py-2.5 px-2 text-right">—</td>
              <td className="py-2.5 px-2 text-right">—</td>
              <td className="py-2.5 px-2 text-right">—</td>
              <td className="py-2.5 px-2 text-right">—</td>
              <td className="py-2.5 px-2 text-right text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                {formatarMoeda(totais.totalFerias)}
              </td>
              <td className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                {formatarMoeda(totais.totalAdiantamento)}
              </td>
              <td className="py-2.5 px-2 text-right text-foreground bg-primary/10">
                {formatarMoeda(totais.totalProducaoAPagar)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
