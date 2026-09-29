import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Wallet,
  Plus,
  Filter,
  Search,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  Loader2,
  CheckCircle,
  HardHat,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import {
  CaixaLancamento,
  CaixaCategoria,
  Obra,
  CaixaTotaisCompetencia,
  ResumoCategoriaCaixa,
  ResumoObraCaixa,
  MesAnualCaixa,
} from "@/types/caixa"
import { CaixaService } from "@/services/caixa"
import { ModalLancamentoCaixa } from "@/components/caixa/ModalLancamentoCaixa"
import { ImpressaoFechamentoA4 } from "@/components/caixa/ImpressaoFechamentoA4"
import { ImpressaoAnualA4 } from "@/components/caixa/ImpressaoAnualA4"
import { AbaImportadorCaixa } from "@/components/caixa/AbaImportadorCaixa"

export default function Caixa() {
  const { toast } = useToast()
  const { empresas, empresaAtiva } = useEmpresa()
  const { isBalanceiro } = useUsuario()
  const [searchParams, setSearchParams] = useSearchParams()

  // Aba ativa pela URL (?tab=lancamentos | fechamento | anual | obras | importar)
  const tabAtiva = searchParams.get("tab") || "lancamentos"
  const setTabAtiva = (novaTab: string) => {
    setSearchParams({ tab: novaTab })
  }

  // Competência padrão (mês atual YYYY-MM)
  const hoje = new Date()
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`

  // Estados gerais
  const [competenciaSelecionada, setCompetenciaSelecionada] =
    useState<string>(mesAtualStr)
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    hoje.getFullYear(),
  )
  const [categorias, setCategorias] = useState<CaixaCategoria[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [carregando, setCarregando] = useState<boolean>(false)

  // Estados da Aba Lançamentos
  const [lancamentos, setLancamentos] = useState<CaixaLancamento[]>([])
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "saida">(
    "todos",
  )
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas")
  const [filtroObra, setFiltroObra] = useState<string>("todas")
  const [termoBusca, setTermoBusca] = useState<string>("")
  const [modalLancamentoAberto, setModalLancamentoAberto] =
    useState<boolean>(false)
  const [lancamentoEmEdicao, setLancamentoEmEdicao] =
    useState<CaixaLancamento | null>(null)
  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null)

  // Estados da Aba Fechamento Mensal
  const [fechamentoTotais, setFechamentoTotais] =
    useState<CaixaTotaisCompetencia | null>(null)
  const [fechamentoEntradas, setFechamentoEntradas] =
    useState<ResumoCategoriaCaixa[]>([])
  const [fechamentoSaidas, setFechamentoSaidas] =
    useState<ResumoCategoriaCaixa[]>([])
  const [fechamentoObras, setFechamentoObras] = useState<ResumoObraCaixa[]>([])

  // Estados da Aba Fechamento Anual
  const [dadosAnual, setDadosAnual] = useState<{
    saldoInicialAno: number
    meses: MesAnualCaixa[]
    totalEntradasAno: number
    totalSaidasAno: number
    resultadoAno: number
    saldoFinalAno: number
  } | null>(null)
  const [filtroCatAnual, setFiltroCatAnual] = useState<string>("todas")

  // Estados da Aba Obras
  const [dadosObras, setDadosObras] = useState<{
    obras: {
      obraNome: string
      totalGeral: number
      meses: { [comp: string]: number }
    }[]
    competenciasListadas: string[]
  } | null>(null)

  const fmtMoeda = (val: number) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Carregar dados de base quando a empresa ativa mudar
  useEffect(() => {
    if (!empresaAtiva) return
    carregarAuxiliares()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Recarregar dados da aba atual
  useEffect(() => {
    if (!empresaAtiva) return
    if (tabAtiva === "lancamentos") {
      carregarLancamentos()
    } else if (tabAtiva === "fechamento") {
      carregarFechamentoMensal()
    } else if (tabAtiva === "anual") {
      carregarFechamentoAnual()
    } else if (tabAtiva === "obras") {
      carregarObrasConsolidado()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    empresaAtiva?.id,
    tabAtiva,
    competenciaSelecionada,
    anoSelecionado,
    filtroTipo,
    filtroCategoria,
    filtroObra,
    filtroCatAnual,
  ])

  const carregarAuxiliares = async () => {
    if (!empresaAtiva) return
    try {
      const [cats, obs] = await Promise.all([
        CaixaService.listarCategorias(empresaAtiva.id),
        CaixaService.listarObras(empresaAtiva.id),
      ])
      setCategorias(cats)
      setObras(obs)
    } catch (err) {
      console.error(err)
    }
  }

  const carregarLancamentos = async () => {
    if (!empresaAtiva) return
    setCarregando(true)
    try {
      const lista = await CaixaService.listarLancamentos(empresaAtiva.id, {
        competencia:
          competenciaSelecionada !== "todas"
            ? competenciaSelecionada
            : undefined,
        tipo: filtroTipo,
        categoria: filtroCategoria !== "todas" ? filtroCategoria : undefined,
        obraId: filtroObra !== "todas" ? filtroObra : undefined,
        busca: termoBusca || undefined,
      })
      setLancamentos(lista)
    } catch (err: any) {
      toast({
        title: "Erro ao buscar lançamentos",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  const carregarFechamentoMensal = async () => {
    if (!empresaAtiva) return
    setCarregando(true)
    try {
      const res = await CaixaService.calcularFechamentoMensal(
        empresaAtiva.id,
        competenciaSelecionada,
      )
      setFechamentoTotais(res.totais)
      setFechamentoEntradas(res.categoriasEntradas)
      setFechamentoSaidas(res.categoriasSaidas)
      setFechamentoObras(res.obras)
    } catch (err: any) {
      toast({
        title: "Erro ao calcular fechamento mensal",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  const carregarFechamentoAnual = async () => {
    if (!empresaAtiva) return
    setCarregando(true)
    try {
      const res = await CaixaService.calcularFechamentoAnual(
        empresaAtiva.id,
        anoSelecionado,
        filtroCatAnual,
      )
      setDadosAnual({
        saldoInicialAno: res.saldoInicialAno,
        meses: res.meses,
        totalEntradasAno: res.totalEntradasAno,
        totalSaidasAno: res.totalSaidasAno,
        resultadoAno: res.resultadoAno,
        saldoFinalAno: res.saldoFinalAno,
      })
    } catch (err: any) {
      toast({
        title: "Erro ao calcular fechamento anual",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  const carregarObrasConsolidado = async () => {
    if (!empresaAtiva) return
    setCarregando(true)
    try {
      const res = await CaixaService.consolidarObras(
        empresaAtiva.id,
        anoSelecionado,
      )
      setDadosObras(res)
    } catch (err: any) {
      toast({
        title: "Erro ao consolidar obras",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  const handleExcluirLancamento = async () => {
    if (!idParaExcluir) return
    try {
      await CaixaService.excluirLancamento(idParaExcluir)
      toast({
        title: "Lançamento excluído com sucesso!",
      })
      carregarLancamentos()
    } catch (err: any) {
      toast({
        title: "Erro ao excluir lançamento",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIdParaExcluir(null)
    }
  }

  // Cálculo do saldo acumulado dos lançamentos filtrados
  const totalEntradasTela = lancamentos
    .filter((l) => l.tipo === "entrada")
    .reduce((acc, l) => acc + l.valor, 0)
  const totalSaidasTela = lancamentos
    .filter((l) => l.tipo === "saida")
    .reduce((acc, l) => acc + l.valor, 0)
  const saldoLiquidoTela = totalEntradasTela - totalSaidasTela

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Gestão de Caixa & Financeiro
                {empresaAtiva && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 text-primary border-primary/30"
                  >
                    {empresaAtiva.nome}
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                Movimentação diária, conciliação de recebimentos por obra,
                fechamento mensal e anual.
              </p>
            </div>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS NO TOPO */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              setLancamentoEmEdicao(null)
              setModalLancamentoAberto(true)
            }}
            className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* ABAS DO MÓDULO CAIXA */}
      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="lancamentos"
            className="text-xs font-semibold gap-1.5 py-1.5 px-3"
          >
            <Wallet className="w-3.5 h-3.5" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger
            value="fechamento"
            className="text-xs font-semibold gap-1.5 py-1.5 px-3"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Fechamento Mensal
          </TabsTrigger>
          <TabsTrigger
            value="anual"
            className="text-xs font-semibold gap-1.5 py-1.5 px-3"
          >
            <Scale className="w-3.5 h-3.5" />
            Fechamento Anual
          </TabsTrigger>
          <TabsTrigger
            value="obras"
            className="text-xs font-semibold gap-1.5 py-1.5 px-3"
          >
            <HardHat className="w-3.5 h-3.5" />
            Obras (Recebimentos)
          </TabsTrigger>
          <TabsTrigger
            value="importar"
            className="text-xs font-semibold gap-1.5 py-1.5 px-3"
          >
            <FileText className="w-3.5 h-3.5" />
            Importar Planilha XLSX
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
            ABA 1: LANÇAMENTOS DO CAIXA
           ======================================================== */}
        <TabsContent value="lancamentos" className="space-y-4">
          {/* BARRA DE FILTROS E RESUMO DE SALDO */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* CARD RESUMO DE SALDOS DA TELA */}
            <Card className="lg:col-span-4 bg-card/60 border-border/40">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600">
                      Entradas Filtradas
                    </span>
                    <div className="text-lg font-black font-mono text-emerald-600">
                      {fmtMoeda(totalEntradasTela)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600">
                      Saídas Filtradas
                    </span>
                    <div className="text-lg font-black font-mono text-rose-600">
                      {fmtMoeda(totalSaidasTela)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary">
                      Resultado do Período
                    </span>
                    <div
                      className={`text-lg font-black font-mono ${
                        saldoLiquidoTela >= 0 ? "text-primary" : "text-rose-600"
                      }`}
                    >
                      {fmtMoeda(saldoLiquidoTela)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FILTROS: Competência, Tipo, Categoria, Obra, Busca */}
            <div className="lg:col-span-4 p-3.5 bg-card/60 rounded-xl border border-border/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Seletor Competência */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="month"
                    value={competenciaSelecionada}
                    onChange={(e) => setCompetenciaSelecionada(e.target.value)}
                    className="h-8 w-36 text-xs font-mono font-bold"
                  />
                </div>

                {/* Filtro Tipo */}
                <Select
                  value={filtroTipo}
                  onValueChange={(v: "todos" | "entrada" | "saida") =>
                    setFiltroTipo(v)
                  }
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-xs">
                      Todos os Tipos
                    </SelectItem>
                    <SelectItem
                      value="entrada"
                      className="text-xs text-emerald-600"
                    >
                      Entradas (+)
                    </SelectItem>
                    <SelectItem value="saida" className="text-xs text-rose-600">
                      Saídas (-)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro Categoria */}
                <Select
                  value={filtroCategoria}
                  onValueChange={setFiltroCategoria}
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas" className="text-xs">
                      Todas as Categorias
                    </SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.nome} className="text-xs">
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro Obra */}
                <Select value={filtroObra} onValueChange={setFiltroObra}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="Obra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas" className="text-xs">
                      Todas as Obras
                    </SelectItem>
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id} className="text-xs">
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Busca textual */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar histórico, obra, observação..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") carregarLancamentos()
                    }}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={carregarLancamentos}
                disabled={carregando}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`}
                />
                Filtrar
              </Button>
            </div>
          </div>

          {/* TABELA DE LANÇAMENTOS */}
          <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 font-bold uppercase text-[10px] text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Descrição / Histórico</th>
                    <th className="py-2.5 px-3">Obra Vinculada</th>
                    <th className="py-2.5 px-3">Forma / Doc</th>
                    <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                    <th className="py-2.5 px-3 text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {carregando ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Carregando lançamentos...
                        </div>
                      </td>
                    </tr>
                  ) : lancamentos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground italic"
                      >
                        Nenhum lançamento encontrado para a competência e
                        filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    lancamentos.map((l) => (
                      <tr
                        key={l.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                          {l.data ? l.data.split("-").reverse().join("/") : "-"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={
                              l.tipo === "entrada"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold"
                            }
                          >
                            {l.tipo === "entrada" ? "Entrada (+)" : "Saída (-)"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground truncate max-w-[150px]">
                          {l.categoria}
                        </td>
                        <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-[240px]">
                          <div>{l.descricao}</div>
                          {l.observacao && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {l.observacao}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-sky-600 dark:text-sky-400 truncate max-w-[150px]">
                          {l.obra_nome ? (
                            <span className="flex items-center gap-1">
                              <HardHat className="w-3 h-3 shrink-0" />
                              {l.obra_nome}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {l.forma_pagamento || "PIX"}
                          {l.documento_ref && ` (${l.documento_ref})`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-sm">
                          <span
                            className={
                              l.tipo === "entrada"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {l.tipo === "entrada" ? "+" : "-"}{" "}
                            {fmtMoeda(l.valor)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setLancamentoEmEdicao(l)
                                setModalLancamentoAberto(true)
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIdParaExcluir(l.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            ABA 2: FECHAMENTO MENSAL CALCULADO COM IMPRESSÃO A4
           ======================================================== */}
        <TabsContent value="fechamento" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-card/60 rounded-xl border border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Apuração de Fechamento Mensal
                </h3>
                <p className="text-xs text-muted-foreground">
                  Valores calculados em tempo real direto dos lançamentos no
                  banco de dados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={competenciaSelecionada}
                onChange={(e) => setCompetenciaSelecionada(e.target.value)}
                className="h-8 w-36 text-xs font-mono font-bold"
              />
              {fechamentoTotais && empresaAtiva && (
                <ImpressaoFechamentoA4
                  empresaNome={empresaAtiva.nome}
                  empresaCnpj={empresaAtiva.cnpj}
                  competencia={competenciaSelecionada}
                  totais={fechamentoTotais}
                  categoriasEntradas={fechamentoEntradas}
                  categoriasSaidas={fechamentoSaidas}
                  obras={fechamentoObras}
                  lancamentos={lancamentos}
                />
              )}
            </div>
          </div>

          {/* CARDS RESUMO DO FECHAMENTO MENSAL */}
          {fechamentoTotais && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Card className="bg-card/70 border-border/40">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Saldo Anterior
                    </span>
                    <Badge variant="secondary" className="text-[9px] py-0">
                      Calculado
                    </Badge>
                  </div>
                  <div
                    className={`text-xl font-black font-mono mt-1 ${
                      fechamentoTotais.saldoAnterior >= 0
                        ? "text-foreground"
                        : "text-rose-600"
                    }`}
                  >
                    {fmtMoeda(fechamentoTotais.saldoAnterior)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Acumulado até o mês anterior
                  </span>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-600">
                      Entradas do Mês (+)
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] py-0 text-emerald-600 border-emerald-500/30"
                    >
                      {fechamentoTotais.quantidadeEntradas} lançamentos
                    </Badge>
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-600 mt-1">
                    {fmtMoeda(fechamentoTotais.totalEntradas)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Recebimentos e Vendas
                  </span>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-rose-500/30 bg-rose-500/5">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-rose-600">
                      Saídas do Mês (-)
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] py-0 text-rose-600 border-rose-500/30"
                    >
                      {fechamentoTotais.quantidadeSaidas} despesas
                    </Badge>
                  </div>
                  <div className="text-xl font-black font-mono text-rose-600 mt-1">
                    {fmtMoeda(fechamentoTotais.totalSaidas)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Folha, Insumos e Custos
                  </span>
                </CardContent>
              </Card>

              <Card className="bg-card/70 border-primary/40 bg-primary/5">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-primary">
                      Saldo Final em Caixa
                    </span>
                    <Badge variant="secondary" className="text-[9px] py-0">
                      Calculado
                    </Badge>
                  </div>
                  <div
                    className={`text-2xl font-black font-mono mt-1 ${
                      fechamentoTotais.saldoFinal >= 0
                        ? "text-primary"
                        : "text-rose-600"
                    }`}
                  >
                    {fmtMoeda(fechamentoTotais.saldoFinal)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Resultado Mês: {fmtMoeda(fechamentoTotais.resultadoMes)}
                  </span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DETALHAMENTO DE CATEGORIAS: ENTRADAS X SAÍDAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna Entradas */}
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-600 flex items-center justify-between">
                  <span>Recebimentos por Categoria (Entradas)</span>
                  <span className="font-mono">
                    {fmtMoeda(fechamentoTotais?.totalEntradas || 0)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/20 text-xs">
                  {fechamentoEntradas.map((c) => (
                    <div
                      key={c.categoria}
                      className="p-3 flex items-center justify-between hover:bg-muted/10"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {c.categoria}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.quantidade} lançamentos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-600">
                          {fmtMoeda(c.total)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {c.percentual.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {fechamentoEntradas.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground italic">
                      Sem entradas nesta competência.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coluna Saídas */}
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-rose-600 flex items-center justify-between">
                  <span>Despesas por Categoria (Saídas)</span>
                  <span className="font-mono">
                    {fmtMoeda(fechamentoTotais?.totalSaidas || 0)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/20 text-xs">
                  {fechamentoSaidas.map((c) => (
                    <div
                      key={c.categoria}
                      className="p-3 flex items-center justify-between hover:bg-muted/10"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {c.categoria}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.quantidade} lançamentos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-600">
                          {fmtMoeda(c.total)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {c.percentual.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {fechamentoSaidas.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground italic">
                      Sem despesas nesta competência.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================
            ABA 3: FECHAMENTO ANUAL (12 MESES)
           ======================================================== */}
        <TabsContent value="anual" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-card/60 rounded-xl border border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Fechamento Anual de Caixa ({anoSelecionado})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visão consolidada dos 12 meses do ano com entradas, saídas e
                  saldo acumulado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Seletor de Ano */}
              <Select
                value={anoSelecionado.toString()}
                onValueChange={(v) => setAnoSelecionado(parseInt(v, 10))}
              >
                <SelectTrigger className="h-8 w-28 text-xs font-mono font-bold">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026, 2027].map((a) => (
                    <SelectItem
                      key={a}
                      value={a.toString()}
                      className="text-xs font-mono"
                    >
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Categoria */}
              <Select value={filtroCatAnual} onValueChange={setFiltroCatAnual}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas" className="text-xs">
                    Todas as Categorias
                  </SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.nome} className="text-xs">
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {dadosAnual && empresaAtiva && (
                <ImpressaoAnualA4
                  empresaNome={empresaAtiva.nome}
                  empresaCnpj={empresaAtiva.cnpj}
                  ano={anoSelecionado}
                  categoriaFiltro={filtroCatAnual}
                  saldoInicialAno={dadosAnual.saldoInicialAno}
                  meses={dadosAnual.meses}
                  totalEntradasAno={dadosAnual.totalEntradasAno}
                  totalSaidasAno={dadosAnual.totalSaidasAno}
                  resultadoAno={dadosAnual.resultadoAno}
                  saldoFinalAno={dadosAnual.saldoFinalAno}
                />
              )}
            </div>
          </div>

          {/* TABELA CONSOLIDADA DOS 12 MESES */}
          {dadosAnual && (
            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 font-bold uppercase text-[10px] text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3">Mês</th>
                    <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600">
                      Entradas (+)
                    </th>
                    <th className="py-2.5 px-3 text-right text-rose-600">
                      Saídas (-)
                    </th>
                    <th className="py-2.5 px-3 text-right">Resultado</th>
                    <th className="py-2.5 px-3 text-right font-black">
                      Saldo Final
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {dadosAnual.meses.map((m) => (
                    <tr key={m.mes} className="hover:bg-muted/20">
                      <td className="py-2 px-3 font-semibold text-foreground">
                        {m.nomeMes}{" "}
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({m.competencia})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                        {fmtMoeda(m.saldoInicial)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        {fmtMoeda(m.entradas)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        {fmtMoeda(m.saidas)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-semibold ${
                          m.resultado >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {fmtMoeda(m.resultado)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-black ${
                          m.saldoFinal >= 0
                            ? "text-foreground"
                            : "text-rose-600"
                        }`}
                      >
                        {fmtMoeda(m.saldoFinal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 font-bold border-t border-border/60">
                  <tr>
                    <td className="py-2.5 px-3 uppercase text-foreground">
                      TOTAL DO ANO {anoSelecionado}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {fmtMoeda(dadosAnual.saldoInicialAno)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                      {fmtMoeda(dadosAnual.totalEntradasAno)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                      {fmtMoeda(dadosAnual.totalSaidasAno)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono ${
                        dadosAnual.resultadoAno >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {fmtMoeda(dadosAnual.resultadoAno)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono text-sm ${
                        dadosAnual.saldoFinalAno >= 0
                          ? "text-primary"
                          : "text-rose-600"
                      }`}
                    >
                      {fmtMoeda(dadosAnual.saldoFinalAno)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ========================================================
            ABA 4: OBRAS (RECEBIMENTOS CONSOLIDADOS POR OBRA/MÊS)
           ======================================================== */}
        <TabsContent value="obras" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-card/60 rounded-xl border border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Consolidação de Recebimentos por Obra
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sem digitação dupla: apurado diretamente pelo vínculo das
                  obras nos lançamentos de caixa.
                </p>
              </div>
            </div>

            <Select
              value={anoSelecionado.toString()}
              onValueChange={(v) => setAnoSelecionado(parseInt(v, 10))}
            >
              <SelectTrigger className="h-8 w-28 text-xs font-mono font-bold">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026, 2027].map((a) => (
                  <SelectItem
                    key={a}
                    value={a.toString()}
                    className="text-xs font-mono"
                  >
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 font-bold uppercase text-[10px] text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="py-2.5 px-3">Nome da Obra / Cliente</th>
                  <th className="py-2.5 px-3 text-right">Total Acumulado</th>
                  <th className="py-2.5 px-3 text-center">Meses Ativos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {carregando ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Carregando dados das obras...
                    </td>
                  </tr>
                ) : !dadosObras || dadosObras.obras.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground italic"
                    >
                      Nenhum recebimento vinculado a obras registrado no ano de{" "}
                      {anoSelecionado}.
                    </td>
                  </tr>
                ) : (
                  dadosObras.obras.map((ob) => (
                    <tr key={ob.obraNome} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-sky-500 shrink-0" />
                        {ob.obraNome}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 text-sm">
                        {fmtMoeda(ob.totalGeral)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {Object.entries(ob.meses).map(([comp, val]) => (
                            <Badge
                              key={comp}
                              variant="outline"
                              className="text-[10px] font-mono"
                            >
                              {comp.substring(5)}: {fmtMoeda(val)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ========================================================
            ABA 5: IMPORTADOR COMPLETO DE PLANILHA XLSX
           ======================================================== */}
        <TabsContent value="importar" className="space-y-4">
          <AbaImportadorCaixa
            empresas={empresas}
            empresaAtiva={empresaAtiva}
            onImportadoSucesso={() => {
              carregarLancamentos()
              setTabAtiva("lancamentos")
            }}
          />
        </TabsContent>
      </Tabs>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE LANÇAMENTO */}
      {empresaAtiva && (
        <ModalLancamentoCaixa
          open={modalLancamentoAberto}
          onOpenChange={setModalLancamentoAberto}
          empresaId={empresaAtiva.id}
          lancamentoEmEdicao={lancamentoEmEdicao}
          categorias={categorias}
          obras={obras}
          competenciaPadrao={competenciaSelecionada}
          onSalvo={() => {
            carregarLancamentos()
            carregarAuxiliares()
          }}
        />
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!idParaExcluir}
        onOpenChange={(v) => !v && setIdParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lançamento do Caixa?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta ação removerá o registro financeiro de forma permanente do
              banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirLancamento}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
