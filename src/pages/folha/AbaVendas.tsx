import React, { useState } from "react"
import {
  LinhaFolhaProcessada,
  TotaisUnidadeCalculados,
  formatarMoeda,
} from "./folha-helpers"
import { FaixaComissaoProgressiva } from "@/types/folha"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Printer,
  Check,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { CamposAtualizacaoVendas } from "./folha-types"
import { MemoriaComissao } from "./memoria-comissao"

interface AbaVendasProps {
  linhas: LinhaFolhaProcessada[]
  totais: TotaisUnidadeCalculados
  isSje: boolean
  faixasComissao?: FaixaComissaoProgressiva[]
  onAtualizarCamposVendasInline: (
    linhaId: string,
    campos: CamposAtualizacaoVendas,
  ) => Promise<void>
  onImprimirA4: () => void
}

export const AbaVendas: React.FC<AbaVendasProps> = ({
  linhas,
  totais,
  isSje,
  faixasComissao,
  onAtualizarCamposVendasInline,
  onImprimirA4,
}) => {
  const [editandoLinhaId, setEditandoLinhaId] = useState<string | null>(null)
  const [campoAtivo, setCampoAtivo] = useState<string | null>(null)
  const [valorTemp, setValorTemp] = useState<string>("")
  const [salvando, setSalvando] = useState(false)
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})

  const toggleExpandir = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Na SJE, vendas tem apenas o card de lançador de comissão
  // Raimundo NUNCA participa de vendas
  const linhasVendedores = linhas.filter((l) => {
    const nomeUpper = (l.nome || "").trim().toUpperCase()
    if (nomeUpper.includes("RAIMUNDO")) return false
    return (
      nomeUpper.includes("MARCIO LUAN") ||
      Number(l.comissao || 0) > 0 ||
      Number(l.vendas_obra || 0) > 0 ||
      Number(l.vendas_ajuda || 0) > 0 ||
      l.tipo === "Terceiro"
    )
  })

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
      await onAtualizarCamposVendasInline(linhaId, { [campo]: num })
      setEditandoLinhaId(null)
      setCampoAtivo(null)
    } finally {
      setSalvando(false)
    }
  }

  const renderCampo = (
    linha: LinhaFolhaProcessada,
    campo: "vendas_obra" | "comissao" | "vendas_ajuda",
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
            className="h-6 w-20 text-xs px-1 text-right"
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

  const tabelaVendedores = (
    <>
      <div className="border rounded-lg overflow-x-auto bg-card shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
            <tr>
              <th className="py-2.5 px-3">VENDEDOR / COLABORADOR</th>
              <th className="py-2.5 px-2">TIPO</th>
              <th className="py-2.5 px-2 text-right">VALOR DAS VENDAS</th>
              <th className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                COMISSÃO
              </th>
              <th className="py-2.5 px-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                AJUDA DE CUSTO
              </th>
              <th className="py-2.5 px-2 text-right font-bold text-foreground bg-primary/10">
                TOTAL A PAGAR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {linhasVendedores.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum colaborador com comissão ou ajuda de vendas na
                  competência.
                </td>
              </tr>
            ) : (
              linhasVendedores.map((l) => {
                const comissao = Number(l.comissao || 0)
                const ajuda = Number(l.vendas_ajuda || l.ajuda_custo || 0)
                const total = comissao + ajuda
                const expandido = Boolean(expandidos[l.id])
                const podeExpandir = comissao > 0

                return (
                  <React.Fragment key={l.id}>
                    <tr
                      className={`hover:bg-muted/40 transition-colors ${
                        l.oculto ? "opacity-60 bg-muted/20" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpandir(l.id)}
                            className={`inline-flex items-center ${
                              podeExpandir
                                ? "hover:text-foreground text-muted-foreground"
                                : "text-muted-foreground/40 cursor-default"
                            }`}
                            title={
                              podeExpandir
                                ? "Ver memória de cálculo da comissão"
                                : "Sem comissão para detalhar"
                            }
                          >
                            {expandido ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span>{l.nome}</span>
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
                        {l.tipo}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {renderCampo(
                          l,
                          "vendas_obra",
                          Number(l.vendas_obra || 0),
                          false,
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {renderCampo(l, "comissao", comissao)}
                      </td>
                      <td className="py-2 px-2 text-right text-blue-600 dark:text-blue-400 font-medium">
                        {renderCampo(l, "vendas_ajuda", ajuda)}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-foreground bg-primary/10">
                        {formatarMoeda(total)}
                      </td>
                    </tr>

                    {/* EXPANSÃO: MEMÓRIA DE CÁLCULO DA COMISSÃO (só exibição) */}
                    {expandido && (
                      <tr className="bg-muted/10 border-b">
                        <td colSpan={6} className="p-3">
                          <div className="bg-card p-3 rounded border space-y-1">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                              Memória de Cálculo da Comissão — {l.nome}
                            </div>
                            <MemoriaComissao
                              faixas={faixasComissao}
                              valorVendas={Number(l.vendas_obra || 0)}
                              comissao={comissao}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
          <tfoot className="bg-muted font-bold border-t">
            <tr>
              <td colSpan={3} className="py-2.5 px-3">
                TOTAIS
              </td>
              <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                {formatarMoeda(totais.totalComissaoVendas)}
              </td>
              <td className="py-2.5 px-2 text-right text-blue-600 dark:text-blue-400">
                {formatarMoeda(totais.totalAjudaCustoVendas)}
              </td>
              <td className="py-2.5 px-2 text-right text-foreground bg-primary/10">
                {formatarMoeda(
                  totais.totalComissaoVendas + totais.totalAjudaCustoVendas,
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )

  if (isSje) {
    return (
      <div className="space-y-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Lançador de Vendas — Unidade SJE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <p className="text-muted-foreground">
              Na unidade SJE, Raimundo está fora do módulo de vendas. Os demais
              vendedores usam comissão simples (percentual sobre vendas).
            </p>
            <div className="p-3 rounded bg-muted/40 border">
              <div className="flex justify-between font-medium">
                <span>Total de Comissões SJE:</span>
                <span className="font-bold text-foreground">
                  {formatarMoeda(totais.totalComissaoVendas)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {tabelaVendedores}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Vendas e Comissões: Márcio Luan com comissão progressiva marginal
          conforme tabelas oficiais. A ajuda de custo dos vendedores integra o
          Total da Unidade.
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

      {tabelaVendedores}
    </div>
  )
}
