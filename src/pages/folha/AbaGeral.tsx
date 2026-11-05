import React, { useState } from "react"
import {
  LinhaFolhaProcessada,
  TotaisUnidadeCalculados,
  formatarMoeda,
  formatarDataBr,
} from "./folha-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FaixaComissaoProgressiva, FolhaTabelaOficial } from "@/types/folha"
import { calcularSalarioFamilia } from "@/lib/folha-calculos"
import { MemoriaComissao } from "./memoria-comissao"
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Printer,
  Check,
} from "lucide-react"

interface AbaGeralProps {
  linhas: LinhaFolhaProcessada[]
  totais: TotaisUnidadeCalculados
  mes: number
  ano: number
  faixasComissao?: FaixaComissaoProgressiva[]
  empresaNome: string
  competencia: string
  onSalvarFeriasInline: (linhaId: string, novoValor: number) => Promise<void>
  onSalvarFilhosInline: (linhaId: string, novoValor: number) => Promise<void>
  tabelaOficial: FolhaTabelaOficial | null
  onEditarLinha: (linha: LinhaFolhaProcessada) => void
  onExcluirLinha: (linha: LinhaFolhaProcessada) => void
  onImprimirA4: () => void
}

export const AbaGeral: React.FC<AbaGeralProps> = ({
  linhas,
  totais,
  mes,
  ano,
  faixasComissao,
  empresaNome,
  competencia,
  onSalvarFeriasInline,
  onSalvarFilhosInline,
  tabelaOficial,
  onEditarLinha,
  onExcluirLinha,
  onImprimirA4,
}) => {
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
  const [editandoFeriasId, setEditandoFeriasId] = useState<string | null>(null)
  const [valorFeriasTemp, setValorFeriasTemp] = useState<string>("")
  const [salvandoFerias, setSalvandoFerias] = useState(false)
  const [editandoFilhosId, setEditandoFilhosId] = useState<string | null>(null)
  const [valorFilhosTemp, setValorFilhosTemp] = useState<string>("")
  const [salvandoFilhos, setSalvandoFilhos] = useState(false)

  const toggleExpandir = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const iniciarEdicaoFerias = (linha: LinhaFolhaProcessada) => {
    setEditandoFeriasId(linha.id)
    setValorFeriasTemp(String(linha.feriasEfetivo || 0))
  }

  const salvarFerias = async (linhaId: string) => {
    try {
      setSalvandoFerias(true)
      const num = parseFloat(valorFeriasTemp.replace(",", ".")) || 0
      await onSalvarFeriasInline(linhaId, num)
      setEditandoFeriasId(null)
    } finally {
      setSalvandoFerias(false)
    }
  }

  const iniciarEdicaoFilhos = (linha: LinhaFolhaProcessada) => {
    setEditandoFilhosId(linha.id)
    setValorFilhosTemp(String(Number(linha.filhos) || 0))
  }

  const salvarFilhos = async (linhaId: string) => {
    try {
      setSalvandoFilhos(true)
      const num = parseInt(valorFilhosTemp, 10) || 0
      await onSalvarFilhosInline(linhaId, num)
      setEditandoFilhosId(null)
    } finally {
      setSalvandoFilhos(false)
    }
  }

  // Filhos e salário-família das linhas VISÍVEIS (mesma filtragem da tabela),
  // calculados com calcularSalarioFamilia (mesma base do papel A4).
  const calcularFamiliaLinha = (linha: LinhaFolhaProcessada): number => {
    if (linha.tipo === "Terceiro") return 0
    return (
      Number(
        calcularSalarioFamilia(
          Number(linha.bruto || 0),
          Number(linha.filhos) || 0,
          tabelaOficial,
        ) ?? linha.familiaCalculado,
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
          Listagem geral de colaboradores (funcionários e terceiros) com
          composição detalhada do líquido.
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
              <th className="py-2.5 px-2 text-center w-8">#</th>
              <th className="py-2.5 px-3 min-w-[180px]">NOME</th>
              <th className="py-2.5 px-2 min-w-[120px]">FUNÇÃO</th>
              <th className="py-2.5 px-2 text-right">SAL. BRUTO</th>
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
              <th className="py-2.5 px-2 text-right font-semibold bg-muted/40">
                MENSAL PURO
              </th>
              <th className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                PRODUÇÃO (+)
              </th>
              <th className="py-2.5 px-2 text-right text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/40 dark:bg-blue-950/20">
                FÉRIAS (+)
              </th>
              <th className="py-2.5 px-2 text-right text-purple-600 dark:text-purple-400 font-semibold">
                13º (+)
              </th>
              <th className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                ADIANT. (−)
              </th>
              <th className="py-2.5 px-2 text-right font-bold text-foreground bg-primary/10">
                LÍQUIDO TOTAL
              </th>
              <th className="py-2.5 px-2 text-center w-28">ASSINATURA</th>
              <th className="py-2.5 px-2 text-center w-20">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {linhas.length === 0 ? (
              <tr>
                <td
                  colSpan={17}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum colaborador encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              linhas.map((l, index) => {
                const expandido = Boolean(expandidos[l.id])
                const isTerceiro = l.tipo === "Terceiro"
                const editandoEstaFerias = editandoFeriasId === l.id
                const familiaExibicao = calcularFamiliaLinha(l)

                return (
                  <React.Fragment key={l.id}>
                    <tr
                      className={`hover:bg-muted/40 transition-colors ${
                        l.oculto ? "opacity-60 bg-muted/20" : ""
                      }`}
                    >
                      <td className="py-2 px-2 text-center text-muted-foreground">
                        <button
                          onClick={() => toggleExpandir(l.id)}
                          className="hover:text-foreground inline-flex items-center"
                          title="Ver detalhes da composição do líquido"
                        >
                          {expandido ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate max-w-[200px]"
                            title={l.nome}
                          >
                            {l.nome}
                          </span>
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
                        {l.dataAdmissaoEfetiva && (
                          <div className="text-[10px] text-muted-foreground">
                            Adm: {formatarDataBr(l.dataAdmissaoEfetiva)}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground truncate max-w-[130px]">
                        {l.funcao || l.cargo || "Geral"}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatarMoeda(l.bruto)}
                      </td>
                      <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                        {l.inssCalculado > 0
                          ? formatarMoeda(l.inssCalculado)
                          : "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                        {l.irrfCalculado > 0
                          ? formatarMoeda(l.irrfCalculado)
                          : "—"}
                      </td>

                      {/* FILHOS EDITÁVEL INLINE — FAMÍLIA = valor calculado (só exibição, já integra o líquido) */}
                      <td className="py-2 px-2 text-center">
                        {editandoFilhosId === l.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={valorFilhosTemp}
                              onChange={(e) =>
                                setValorFilhosTemp(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") salvarFilhos(l.id)
                                if (e.key === "Escape")
                                  setEditandoFilhosId(null)
                              }}
                              className="h-6 w-14 text-xs px-1 text-right"
                              autoFocus
                              disabled={salvandoFilhos}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => salvarFilhos(l.id)}
                              className="h-6 w-6 p-0 text-emerald-600"
                              disabled={salvandoFilhos}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              !isTerceiro && iniciarEdicaoFilhos(l)
                            }
                            className={`rounded px-1 py-0.5 text-center ${
                              isTerceiro
                                ? "text-muted-foreground"
                                : "cursor-pointer hover:bg-muted/70"
                            }`}
                            title={
                              isTerceiro
                                ? "Terceiros não recebem salário-família"
                                : "Clique para editar o número de filhos inline"
                            }
                          >
                            {Number(l.filhos) || 0}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        {isTerceiro
                          ? "—"
                          : familiaExibicao > 0
                            ? formatarMoeda(familiaExibicao)
                            : "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-amber-600 dark:text-amber-400">
                        {l.quinzenaCalculada > 0
                          ? formatarMoeda(l.quinzenaCalculada)
                          : "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-medium bg-muted/20">
                        {formatarMoeda(l.mensalPuro)}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {l.producaoTotal > 0
                          ? formatarMoeda(l.producaoTotal)
                          : "—"}
                      </td>

                      {/* FÉRIAS EDITÁVEL INLINE */}
                      <td className="py-2 px-2 text-right bg-blue-50/40 dark:bg-blue-950/20">
                        {editandoEstaFerias ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={valorFeriasTemp}
                              onChange={(e) =>
                                setValorFeriasTemp(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") salvarFerias(l.id)
                                if (e.key === "Escape")
                                  setEditandoFeriasId(null)
                              }}
                              className="h-6 w-20 text-xs px-1 text-right"
                              autoFocus
                              disabled={salvandoFerias}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => salvarFerias(l.id)}
                              className="h-6 w-6 p-0 text-emerald-600"
                              disabled={salvandoFerias}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => iniciarEdicaoFerias(l)}
                            className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded px-1 py-0.5 text-blue-700 dark:text-blue-300 font-medium transition-colors"
                            title="Clique para editar férias inline"
                          >
                            {l.feriasEfetivo > 0
                              ? formatarMoeda(l.feriasEfetivo)
                              : "R$ 0,00"}
                          </div>
                        )}
                      </td>

                      {/* 13º NÃO EDITÁVEL (SÓ MESES 11 E 12) */}
                      <td className="py-2 px-2 text-right text-purple-600 dark:text-purple-400 font-medium">
                        {mes === 11 || mes === 12
                          ? l.decimoEfetivo > 0
                            ? formatarMoeda(l.decimoEfetivo)
                            : "—"
                          : "—"}
                      </td>

                      <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                        {l.adiantamentoEfetivo > 0
                          ? formatarMoeda(l.adiantamentoEfetivo)
                          : "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-foreground bg-primary/10">
                        {formatarMoeda(l.liquidoTotal)}
                      </td>
                      {/* COLUNA ASSINATURA — célula em branco para o colaborador assinar a própria linha */}
                      <td
                        className="py-2 px-2"
                        aria-label="Assinatura do colaborador"
                      ></td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditarLinha(l)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Editar colaborador completo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onExcluirLinha(l)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            title="Excluir linha da folha"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANSÃO COM DETALHAMENTO DOS CARDS E EQUAÇÃO */}
                    {expandido && (
                      <tr className="bg-muted/10 border-b">
                        <td colSpan={17} className="p-3">
                          <div className="space-y-3 bg-card p-3 rounded border">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                              <span>Composição e Adicionais — {l.nome}</span>
                              <span className="font-normal normal-case">
                                PIX: {l.pix || l.chave_pix || "Não informado"} |
                                Conta: {l.conta || "Não informada"}
                              </span>
                            </div>

                            {/* CARDS DE COMPONENTES */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-[11px]">
                              <div className="p-2 rounded bg-muted/40 border">
                                <div className="text-muted-foreground text-[10px]">
                                  Obras ({l.obras || 0}x R${l.valor_obra || 20})
                                </div>
                                <div className="font-semibold text-emerald-600">
                                  {formatarMoeda(
                                    (Number(l.obras) || 0) *
                                      (Number(l.valor_obra) || 20),
                                  )}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-muted/40 border">
                                <div className="text-muted-foreground text-[10px]">
                                  Limpeza (+)
                                </div>
                                <div className="font-semibold text-emerald-600">
                                  {formatarMoeda(l.limpeza)}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-muted/40 border">
                                <div className="text-muted-foreground text-[10px]">
                                  Sábado (+)
                                </div>
                                <div className="font-semibold text-emerald-600">
                                  {formatarMoeda(l.sabado)}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-muted/40 border">
                                <div className="text-muted-foreground text-[10px]">
                                  Feriado (+)
                                </div>
                                <div className="font-semibold text-emerald-600">
                                  {formatarMoeda(l.feriado)}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-muted/40 border">
                                <div className="text-muted-foreground text-[10px]">
                                  Ajuda Custo (+)
                                </div>
                                <div className="font-semibold text-emerald-600">
                                  {formatarMoeda(l.ajuda_custo)}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-muted/40 border">
                                <div className="text-muted-foreground text-[10px]">
                                  Gratificação (+)
                                </div>
                                <div className="font-semibold text-emerald-600">
                                  {formatarMoeda(l.gratificacao)}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                                <div className="text-blue-700 dark:text-blue-300 text-[10px]">
                                  Férias (+)
                                </div>
                                <div className="font-bold text-blue-700 dark:text-blue-300">
                                  {formatarMoeda(l.feriasEfetivo)}
                                </div>
                              </div>
                              {/* COMISSÃO (+): card com memória de cálculo quando comissao > 0 */}
                              {Number(l.comissao || 0) > 0 && (
                                <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 sm:col-span-2">
                                  <div className="text-emerald-700 dark:text-emerald-300 text-[10px]">
                                    Comissão (+)
                                  </div>
                                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                    {formatarMoeda(Number(l.comissao || 0))}
                                  </div>
                                  <div className="mt-1.5 pt-1.5 border-t border-emerald-200/70 dark:border-emerald-900/70">
                                    <MemoriaComissao
                                      faixas={faixasComissao}
                                      valorVendas={Number(l.vendas_obra || 0)}
                                      comissao={Number(l.comissao || 0)}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="p-2 rounded bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                                <div className="text-purple-700 dark:text-purple-300 text-[10px]">
                                  13º (
                                  {mes === 11
                                    ? "1ª Parc"
                                    : mes === 12
                                      ? "2ª Parc"
                                      : "—"}
                                  )
                                </div>
                                <div className="font-bold text-purple-700 dark:text-purple-300">
                                  {formatarMoeda(l.decimoEfetivo)}
                                </div>
                              </div>
                            </div>

                            {/* EQUAÇÃO DO LÍQUIDO */}
                            <div className="p-2.5 rounded bg-primary/5 border border-primary/20 flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-primary">
                                Equação do Líquido:
                              </span>
                              <span>
                                Mensal Puro ({formatarMoeda(l.mensalPuro)})
                              </span>
                              <span>+</span>
                              <span className="text-emerald-600 font-medium">
                                Produção ({formatarMoeda(l.producaoTotal)})
                              </span>
                              <span>+</span>
                              <span className="text-blue-600 font-medium">
                                Férias ({formatarMoeda(l.feriasEfetivo)})
                              </span>
                              <span>+</span>
                              <span className="text-purple-600 font-medium">
                                13º ({formatarMoeda(l.decimoEfetivo)})
                              </span>
                              <span>−</span>
                              <span className="text-red-600 font-medium">
                                Adiantamento (
                                {formatarMoeda(l.adiantamentoEfetivo)})
                              </span>
                              <span>=</span>
                              <span className="font-bold text-foreground">
                                Líquido Total ({formatarMoeda(l.liquidoTotal)})
                              </span>
                            </div>
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
                TOTAIS ({totais.totalColaboradores} colaboradores)
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
              <td className="py-2.5 px-2 text-right bg-muted/40">
                {formatarMoeda(totais.totalMensalPuro)}
              </td>
              <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                {formatarMoeda(totais.totalProducao)}
              </td>
              <td className="py-2.5 px-2 text-right text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20">
                {formatarMoeda(totais.totalFerias)}
              </td>
              <td className="py-2.5 px-2 text-right text-purple-600 dark:text-purple-400">
                {formatarMoeda(totais.totalDecimo)}
              </td>
              <td className="py-2.5 px-2 text-right text-red-600 dark:text-red-400">
                {formatarMoeda(totais.totalAdiantamento)}
              </td>
              <td className="py-2.5 px-2 text-right text-foreground bg-primary/10">
                {formatarMoeda(totais.totalLiquido)}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
