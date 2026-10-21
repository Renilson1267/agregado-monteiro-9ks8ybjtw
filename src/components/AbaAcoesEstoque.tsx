import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConcreteiraService } from "@/services/concreteira"
import { useUsuario } from "@/hooks/use-usuario"
import type {
  Empresa,
  Material,
  MovimentacaoEstoque,
} from "@/types/concreteira"
import {
  Wrench,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Edit3,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AbaAcoesEstoqueProps {
  empresaAtiva: Empresa | null
  materiais: Material[]
  onAtualizacao?: () => void
}

function calcularData30DiasAtras(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split("T")[0]
}

function calcularDataHoje(): string {
  return new Date().toISOString().split("T")[0]
}

function limparObservacaoParaEdicao(obs?: string | null): string {
  if (!obs) return ""
  return obs
    .replace(/\[Corrigido em\b[^\]]*\]/gi, "")
    .replace(/\[Obs:\s*[^\]]*\]/gi, "")
    .replace(/\s*[—–-]\s*[—–-]+\s*/g, " — ")
    .replace(/^[\s—–-]+|[\s—–-]+$/g, "")
    .trim()
}

export function AbaAcoesEstoque({
  empresaAtiva,
  materiais,
  onAtualizacao,
}: AbaAcoesEstoqueProps) {
  const { nomeUsuario } = useUsuario()

  // Filtros de busca
  const [dataInicio, setDataInicio] = useState<string>(
    calcularData30DiasAtras(),
  )
  const [dataFim, setDataFim] = useState<string>(calcularDataHoje())
  const [filtroTipo, setFiltroTipo] = useState<string>("ALL")
  const [filtroMaterialId, setFiltroMaterialId] = useState<string>("ALL")
  const [termoBusca, setTermoBusca] = useState<string>("")

  // Listagem
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [carregando, setCarregando] = useState<boolean>(false)

  // Modal de edição / correção
  const [modalAberta, setModalAberta] = useState<boolean>(false)
  const [movEditando, setMovEditando] = useState<MovimentacaoEstoque | null>(
    null,
  )
  const [modoDigitarTotalDireto, setModoDigitarTotalDireto] =
    useState<boolean>(false)
  const [precoUnitarioInput, setPrecoUnitarioInput] = useState<string>("")
  const [valorTotalInput, setValorTotalInput] = useState<string>("")
  const [observacaoEditada, setObservacaoEditada] = useState<string>("")
  const [confirmouAlertaPlausibilidade, setConfirmouAlertaPlausibilidade] =
    useState<boolean>(false)
  const [salvando, setSalvando] = useState<boolean>(false)

  const carregarMovimentacoes = useCallback(async () => {
    if (!empresaAtiva) return
    setCarregando(true)
    try {
      const dados = await ConcreteiraService.getMovimentacoesParaAcoes({
        empresaId: empresaAtiva.id,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        tipo: filtroTipo,
        materialId: filtroMaterialId,
        limite: 300,
      })
      setMovimentacoes(dados)
    } catch (err: any) {
      console.error("Erro ao carregar movimentações:", err)
      toast({
        title: "Erro ao buscar movimentações",
        description: err.message || "Falha na conexão com o banco.",
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }, [empresaAtiva, dataInicio, dataFim, filtroTipo, filtroMaterialId])

  useEffect(() => {
    if (empresaAtiva) {
      carregarMovimentacoes()
    }
  }, [empresaAtiva, carregarMovimentacoes])

  // Filtro client-side rápido por documento/observação
  const movimentacoesFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return movimentacoes
    const q = termoBusca.toLowerCase().trim()
    return movimentacoes.filter((m) => {
      const doc = (m.documento || "").toLowerCase()
      const obs = (m.observacao || "").toLowerCase()
      const mat = (m.material?.nome || "").toLowerCase()
      const rec = ((m as any).recipiente_nome || "").toLowerCase()
      return (
        doc.includes(q) || obs.includes(q) || mat.includes(q) || rec.includes(q)
      )
    })
  }, [movimentacoes, termoBusca])

  // Abrir modal de edição para uma movimentação
  const handleAbrirEdicao = (mov: MovimentacaoEstoque) => {
    setMovEditando(mov)
    setModoDigitarTotalDireto(false)
    setPrecoUnitarioInput(
      mov.preco_unitario != null ? String(mov.preco_unitario) : "",
    )
    setValorTotalInput(mov.valor_total != null ? String(mov.valor_total) : "")
    setObservacaoEditada(limparObservacaoParaEdicao(mov.observacao))
    setConfirmouAlertaPlausibilidade(false)
    setModalAberta(true)
  }

  // Cálculos no modal
  const quantidadeMov = movEditando ? Number(movEditando.quantidade) || 0 : 0
  const materialMov = movEditando
    ? materiais.find((m) => m.id === movEditando.material_id) ||
      movEditando.material
    : null
  const unidadeMov = materialMov?.unidade || "kg"

  // Preço unitário e valor total resultantes baseados no modo de digitação
  const valoresCalculados = useMemo(() => {
    if (!movEditando || quantidadeMov <= 0) {
      return { precoUnitario: 0, valorTotal: 0, valido: false }
    }

    if (modoDigitarTotalDireto) {
      const totalNum = Number(valorTotalInput.replace(",", "."))
      if (isNaN(totalNum) || totalNum <= 0) {
        return { precoUnitario: 0, valorTotal: 0, valido: false }
      }
      const unitarioImplicito = totalNum / quantidadeMov
      return {
        precoUnitario: unitarioImplicito,
        valorTotal: totalNum,
        valido: true,
      }
    } else {
      const unitNum = Number(precoUnitarioInput.replace(",", "."))
      if (isNaN(unitNum) || unitNum <= 0) {
        return { precoUnitario: 0, valorTotal: 0, valido: false }
      }
      const totalCalculado = Number((quantidadeMov * unitNum).toFixed(2))
      return {
        precoUnitario: unitNum,
        valorTotal: totalCalculado,
        valido: true,
      }
    }
  }, [
    movEditando,
    quantidadeMov,
    modoDigitarTotalDireto,
    precoUnitarioInput,
    valorTotalInput,
  ])

  // Checagem de plausibilidade
  // Regra do briefing: se valor_total > R$ 100.000,00 ou preco_unitario > R$ 50/kg
  const ehMaterialKg = unidadeMov.toLowerCase().includes("kg")
  const avisoPlausibilidade = useMemo(() => {
    if (!valoresCalculados.valido) return null

    const valorAlto = valoresCalculados.valorTotal > 100000
    const precoAlto = ehMaterialKg && valoresCalculados.precoUnitario > 50

    if (valorAlto || precoAlto) {
      return {
        tipo: valorAlto && precoAlto ? "ambos" : valorAlto ? "valor" : "preco",
        mensagem:
          "Valor muito alto para esta unidade — confira se o preço está em R$/kg e não R$/tonelada.",
        detalhe: valorAlto
          ? `Total de ${valoresCalculados.valorTotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })} ultrapassa R$ 100.000,00.`
          : `Preço unitário de ${valoresCalculados.precoUnitario.toLocaleString(
              "pt-BR",
              { style: "currency", currency: "BRL" },
            )}/kg ultrapassa R$ 50,00/kg.`,
      }
    }
    return null
  }, [valoresCalculados, ehMaterialKg])

  const podeSalvar =
    Boolean(movEditando) &&
    valoresCalculados.valido &&
    (!avisoPlausibilidade || confirmouAlertaPlausibilidade) &&
    !salvando

  const handleSalvarEdicao = async () => {
    if (!movEditando || !podeSalvar) return

    setSalvando(true)
    try {
      const hojeBr = new Date().toLocaleDateString("pt-BR")
      const trilhaCurta = `[Corrigido em ${hojeBr} por ${nomeUsuario || "usuário"}]`
      const textoDigitado = observacaoEditada.trim()
      const novaObservacao = textoDigitado
        ? `${textoDigitado} — ${trilhaCurta}`
        : trilhaCurta

      await ConcreteiraService.atualizarValoresMovimentacao({
        movimentacaoId: movEditando.id,
        preco_unitario: Number(valoresCalculados.precoUnitario.toFixed(6)),
        valor_total: Number(valoresCalculados.valorTotal.toFixed(2)),
        observacao: novaObservacao,
      })

      // Recarrega movimentações para o novo texto aparecer imediatamente na tabela
      await carregarMovimentacoes()

      toast({
        title: "Movimentação corrigida com sucesso!",
        description: `Preço ajustado para R$ ${valoresCalculados.precoUnitario.toFixed(
          4,
        )} e total para ${valoresCalculados.valorTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}.`,
      })

      setModalAberta(false)
      setMovEditando(null)

      // Notifica componente pai se houver callback
      if (onAtualizacao) {
        onAtualizacao()
      }
    } catch (err: any) {
      console.error("Erro ao salvar correção de movimentação:", err)
      toast({
        title: "Erro ao corrigir movimentação",
        description: err.message || "Falha ao gravar no banco de dados.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Aba */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Wrench className="w-5 h-5 text-primary" />
                Ações e Correções de Estoque
                {empresaAtiva && (
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/30 text-primary font-normal ml-1"
                  >
                    {empresaAtiva.nome}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Correção de erros de digitação em movimentações de estoque
                (preço unitário e valor total). As quantidades físicas e saldos
                de estoque permanecem intactos.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={carregarMovimentacoes}
                disabled={carregando}
                className="gap-2 text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`}
                />
                Atualizar Lista
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Card explicativo / Guia de Plausibilidade */}
          <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Atenção à unidade de medida nas notas de cimento</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              O cimento é controlado em <strong>kg</strong> no estoque. Se a
              nota fiscal faturar em toneladas (ex.: R$ 815,00/ton), informe o
              preço convertido por kg (ex.: <strong>R$ 0,815</strong>/kg) ou
              digite diretamente o valor total da nota para que o sistema
              calcule o preço unitário correto.
            </p>
          </div>

          {/* Filtros de Busca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="data-inicio"
                className="text-xs text-muted-foreground"
              >
                Data Inicial
              </Label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-8 pl-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="data-fim"
                className="text-xs text-muted-foreground"
              >
                Data Final
              </Label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-8 pl-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="filtro-tipo"
                className="text-xs text-muted-foreground"
              >
                Tipo de Movimentação
              </Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger id="filtro-tipo" className="h-8 text-xs">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="ENTRADA">Entrada / Reposição</SelectItem>
                  <SelectItem value="SAIDA">Saída (Cargas)</SelectItem>
                  <SelectItem value="ABERTURA">Abertura de Saldo</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste de Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="filtro-mat"
                className="text-xs text-muted-foreground"
              >
                Material / Insumo
              </Label>
              <Select
                value={filtroMaterialId}
                onValueChange={setFiltroMaterialId}
              >
                <SelectTrigger id="filtro-mat" className="h-8 text-xs">
                  <SelectValue placeholder="Todos os materiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Insumos</SelectItem>
                  {materiais.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} ({m.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="busca-termo"
                className="text-xs text-muted-foreground"
              >
                Doc / NF / Obs
              </Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="busca-termo"
                  type="text"
                  placeholder="Buscar texto..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Movimentações Encontradas ({movimentacoesFiltradas.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Clique em &quot;Corrigir&quot; na linha desejada
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0 border-b border-border/40 backdrop-blur">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3 text-right">Quantidade</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                  <th className="py-2.5 px-3">Doc / NF</th>
                  <th className="py-2.5 px-3">Fornecedor / Obs</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {carregando ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Carregando movimentações do período...
                    </td>
                  </tr>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Nenhuma movimentação encontrada com os filtros
                      selecionados.
                    </td>
                  </tr>
                ) : (
                  movimentacoesFiltradas.map((mov) => {
                    const isEntrada =
                      mov.tipo === "ENTRADA" || mov.tipo === "ABERTURA"
                    const mat =
                      materiais.find((m) => m.id === mov.material_id) ||
                      mov.material
                    const valorTotalNum =
                      mov.valor_total != null ? Number(mov.valor_total) : null
                    const precoUnitNum =
                      mov.preco_unitario != null
                        ? Number(mov.preco_unitario)
                        : null

                    // Alerta visual de linha com valor exorbitante
                    const linhaSuspeita =
                      (valorTotalNum != null && valorTotalNum > 100000) ||
                      (precoUnitNum != null &&
                        mat?.unidade === "kg" &&
                        precoUnitNum > 50)

                    return (
                      <tr
                        key={mov.id}
                        className={`transition-colors ${
                          linhaSuspeita
                            ? "bg-red-500/10 hover:bg-red-500/15"
                            : "hover:bg-muted/20"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                          {mov.data.split("-").reverse().join("/")}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isEntrada ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 font-semibold"
                            >
                              <TrendingUp className="w-3 h-3" />
                              {mov.tipo}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 gap-1 font-semibold"
                            >
                              <TrendingDown className="w-3 h-3" />
                              {mov.tipo}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">
                          <div>{mat?.nome || "—"}</div>
                          {(mov as any).recipiente_nome && (
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              {(mov as any).recipiente_nome}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              isEntrada
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {isEntrada ? "+" : "-"}{" "}
                            {Number(mov.quantidade).toLocaleString("pt-BR")}{" "}
                            {mat?.unidade || ""}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {precoUnitNum != null ? (
                            <span
                              className={
                                linhaSuspeita
                                  ? "text-red-600 dark:text-red-400 font-bold"
                                  : ""
                              }
                            >
                              {precoUnitNum.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {valorTotalNum != null ? (
                            <span
                              className={
                                linhaSuspeita
                                  ? "text-red-600 dark:text-red-400 flex items-center justify-end gap-1 font-extrabold"
                                  : "text-foreground"
                              }
                            >
                              {linhaSuspeita && (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              )}
                              {valorTotalNum.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                          {mov.documento || "—"}
                        </td>
                        <td
                          className="py-2.5 px-3 text-muted-foreground max-w-[240px] truncate"
                          title={mov.observacao || ""}
                        >
                          {mov.observacao || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                            onClick={() => handleAbrirEdicao(mov)}
                          >
                            <Edit3 className="w-3 h-3" />
                            Corrigir
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal / Dialog de Correção da Movimentação */}
      <Dialog open={modalAberta} onOpenChange={setModalAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Wrench className="w-5 h-5 text-primary" />
              Corrigir Movimentação de Estoque
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste o preço unitário ou o valor total digitado incorretamente.
              A quantidade física ({quantidadeMov.toLocaleString("pt-BR")}{" "}
              {unidadeMov}) e o saldo de estoque não serão alterados.
            </DialogDescription>
          </DialogHeader>

          {movEditando && (
            <div className="space-y-4 py-2 text-xs">
              {/* Detalhes Fixos da Movimentação */}
              <div className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">
                    Material / Insumo:
                  </span>
                  <span className="font-bold text-foreground">
                    {materialMov?.nome || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Tipo:</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono uppercase"
                  >
                    {movEditando.tipo}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Data:</span>
                  <span>{movEditando.data.split("-").reverse().join("/")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">
                    Documento / NF:
                  </span>
                  <span>{movEditando.documento || "—"}</span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-1">
                  <span className="text-muted-foreground font-sans font-semibold">
                    Quantidade Fixa (intocada):
                  </span>
                  <span className="font-bold text-primary">
                    {quantidadeMov.toLocaleString("pt-BR")} {unidadeMov}
                  </span>
                </div>
              </div>

              {/* Opção: Digitar Valor Total Direto */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                <Checkbox
                  id="modo-total-direto"
                  checked={modoDigitarTotalDireto}
                  onCheckedChange={(c) => {
                    setModoDigitarTotalDireto(Boolean(c))
                  }}
                />
                <Label
                  htmlFor="modo-total-direto"
                  className="text-xs font-medium cursor-pointer"
                >
                  Digitar o <strong>Valor Total</strong> diretamente (ex: da
                  nota fiscal) e calcular o preço unitário automático
                </Label>
              </div>

              {/* Campos de Edição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!modoDigitarTotalDireto ? (
                  <>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="input-preco-unit"
                        className="text-xs font-semibold"
                      >
                        Preço Unitário (R$ / {unidadeMov}) *
                      </Label>
                      <Input
                        id="input-preco-unit"
                        type="text"
                        inputMode="decimal"
                        value={precoUnitarioInput}
                        onChange={(e) => setPrecoUnitarioInput(e.target.value)}
                        placeholder="Ex: 0.815 ou 0,815"
                        className="h-9 text-xs font-mono font-bold"
                        autoFocus
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Preço por {unidadeMov}.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Valor Total Calculado
                      </Label>
                      <div className="h-9 px-3 flex items-center rounded-md border border-border/60 bg-muted/40 font-mono font-bold text-sm text-foreground">
                        {valoresCalculados.valido
                          ? valoresCalculados.valorTotal.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )
                          : "—"}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {quantidadeMov.toLocaleString("pt-BR")} {unidadeMov} ×
                        R$ {valoresCalculados.precoUnitario.toFixed(4)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="input-valor-total"
                        className="text-xs font-semibold"
                      >
                        Valor Total da Movimentação (R$) *
                      </Label>
                      <Input
                        id="input-valor-total"
                        type="text"
                        inputMode="decimal"
                        value={valorTotalInput}
                        onChange={(e) => setValorTotalInput(e.target.value)}
                        placeholder="Ex: 28329.40"
                        className="h-9 text-xs font-mono font-bold"
                        autoFocus
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Valor total exato da nota fiscal.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Preço Unitário Implícito
                      </Label>
                      <div className="h-9 px-3 flex items-center rounded-md border border-border/60 bg-muted/40 font-mono font-bold text-sm text-foreground">
                        {valoresCalculados.valido
                          ? valoresCalculados.precoUnitario.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 6,
                              },
                            )
                          : "—"}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Total / {quantidadeMov.toLocaleString("pt-BR")}{" "}
                        {unidadeMov}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Comparativo Antes vs Depois */}
              <div className="p-3 rounded-lg border border-border/60 bg-background space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Comparativo Antes × Depois
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="space-y-1 p-2 rounded bg-muted/30">
                    <span className="text-[10px] text-muted-foreground font-sans block">
                      Como estava:
                    </span>
                    <div>
                      Unit:{" "}
                      {movEditando.preco_unitario != null
                        ? `R$ ${Number(movEditando.preco_unitario).toFixed(4)}`
                        : "—"}
                    </div>
                    <div className="font-bold text-muted-foreground">
                      Total:{" "}
                      {movEditando.valor_total != null
                        ? Number(movEditando.valor_total).toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" },
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="space-y-1 p-2 rounded bg-primary/10 border border-primary/20">
                    <span className="text-[10px] text-primary font-sans font-bold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Como vai ficar:
                    </span>
                    <div>
                      Unit:{" "}
                      {valoresCalculados.valido
                        ? `R$ ${valoresCalculados.precoUnitario.toFixed(4)}`
                        : "—"}
                    </div>
                    <div className="font-bold text-primary">
                      Total:{" "}
                      {valoresCalculados.valido
                        ? valoresCalculados.valorTotal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerta de Plausibilidade Inline (Erro motivador: tonelada x kg) */}
              {avisoPlausibilidade && (
                <div className="p-3 rounded-lg border border-destructive/60 bg-destructive/10 text-destructive space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-xs">
                        {avisoPlausibilidade.mensagem}
                      </div>
                      <div className="text-[11px] text-destructive/90">
                        {avisoPlausibilidade.detalhe}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-destructive/30 flex items-center space-x-2">
                    <Checkbox
                      id="confirmo-plausibilidade"
                      checked={confirmouAlertaPlausibilidade}
                      onCheckedChange={(c) =>
                        setConfirmouAlertaPlausibilidade(Boolean(c))
                      }
                    />
                    <Label
                      htmlFor="confirmo-plausibilidade"
                      className="text-xs font-semibold cursor-pointer text-destructive"
                    >
                      Confirmo que o valor está correto e não é um erro de
                      tonelada/kg
                    </Label>
                  </div>
                </div>
              )}

              {/* Fornecedor / Observação */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="obs-editada"
                  className="text-xs text-muted-foreground"
                >
                  Fornecedor / Observação
                </Label>
                <Input
                  id="obs-editada"
                  type="text"
                  placeholder="Ex: CSN, MIZU, Reposição de estoque..."
                  value={observacaoEditada}
                  onChange={(e) => setObservacaoEditada(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalAberta(false)
                setMovEditando(null)
              }}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvarEdicao}
              disabled={!podeSalvar}
              className="bg-primary text-primary-foreground gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {salvando ? "Salvando Correção..." : "Salvar Correção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
