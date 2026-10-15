import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FolhaService } from "@/services/folha"
import { FolhaAdiantamento, FolhaPagamentoLinha } from "@/types/folha"
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  PlusCircle,
  Calendar,
  FileText,
  Printer,
  Search,
  AlertCircle,
} from "lucide-react"

export interface ItemAdiantamentoColaborador {
  key: string // Identificador único (id ou chave composta)
  colaborador_id: string
  nome: string
  tipo: "Funcionario" | "Terceiro"
  funcao: string
  salario_base: number
  percentual_quinzena: number
  valor_quinzena: number
  valor_extra: number
  valor_total_adiantamento: number
  pago: boolean
  data_pagamento: string | null
  observacao: string
  conta?: string
  pix?: string
  registro_adiantamento_id?: string
}

interface AbaAdiantamentoFolhaProps {
  empresaId: string
  competencia: string
  rotuloCompetencia: string
  percentualQuinzena: number
  linhasGeralProcessadas: any[]
  terceirosProcessados: any[]
  isMonteiro: boolean
  imprimirAbaA4?: (aba: string) => void
}

export const AbaAdiantamentoFolha: React.FC<AbaAdiantamentoFolhaProps> = ({
  empresaId,
  competencia,
  rotuloCompetencia,
  percentualQuinzena,
  linhasGeralProcessadas,
  terceirosProcessados,
  isMonteiro,
  imprimirAbaA4,
}) => {
  const { toast } = useToast()

  const [adiantamentosGravados, setAdiantamentosGravados] =
    useState<FolhaAdiantamento[]>([])
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "pendente" | "pago">("todos")

  // Estados para o Diálogo de Marcar como Pago
  const [modalPagoAberto, setModalPagoAberto] = useState(false)
  const [confirmacaoPagoAberta, setConfirmacaoPagoAberta] = useState(false)
  const [itemSelecionado, setItemSelecionado] =
    useState<ItemAdiantamentoColaborador | null>(null)
  const [dataPagamentoInput, setDataPagamentoInput] = useState("")
  const [observacaoInput, setObservacaoInput] = useState("")

  // Estados para o Diálogo de Reverter Pagamento
  const [confirmacaoReverterAberta, setConfirmacaoReverterAberta] =
    useState(false)
  const [itemReverter, setItemReverter] =
    useState<ItemAdiantamentoColaborador | null>(null)

  // Estados para o Diálogo de Editar Valor Extra e Observação
  const [modalExtraAberto, setModalExtraAberto] = useState(false)
  const [itemExtra, setItemExtra] =
    useState<ItemAdiantamentoColaborador | null>(null)
  const [valorExtraInput, setValorExtraInput] = useState("")
  const [salvandoExtra, setSalvandoExtra] = useState(false)

  // 1. Carregar adiantamentos gravados no banco
  const carregarAdiantamentos = useCallback(async () => {
    if (!empresaId || !competencia) return
    try {
      setCarregando(true)
      const dados = await FolhaService.getAdiantamentos(empresaId, competencia)
      setAdiantamentosGravados(dados || [])
    } catch (err) {
      console.error("Erro ao carregar adiantamentos:", err)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os registros de adiantamento.",
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }, [empresaId, competencia, toast])

  useEffect(() => {
    carregarAdiantamentos()
  }, [carregarAdiantamentos])

  // Formatação de Moeda BRL
  const fmtMoeda = (val: number | undefined | null) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Formatação de Data DD/MM/AAAA a partir de YYYY-MM-DD
  const formatarDataBr = (dataIso: string | null | undefined) => {
    if (!dataIso) return "-"
    // se for YYYY-MM-DD
    const partes = dataIso.split("-")
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return dataIso
  }

  // 2. Unificar lista de funcionários + terceiros da quinzena com os registros de adiantamento
  const listaUnificada = useMemo<ItemAdiantamentoColaborador[]>(() => {
    const mapaGravados = new Map<string, FolhaAdiantamento>()
    adiantamentosGravados.forEach((a) => {
      mapaGravados.set(a.colaborador_id, a)
      // fallback por nome se necessário
      if (a.nome) {
        mapaGravados.set(`NOME:${a.nome.trim().toUpperCase()}`, a)
      }
    })

    const itens: ItemAdiantamentoColaborador[] = []

    // 2.1 Funcionários CLT (mesma lista da QUINZENA: linhasGeralProcessadas)
    linhasGeralProcessadas.forEach((l) => {
      const colabId = String(l.funcionario_id || l.id)
      const gravado =
        mapaGravados.get(colabId) ||
        mapaGravados.get(`NOME:${l.nome.trim().toUpperCase()}`)

      const salarioBase = Number(l.salario_base || l.bruto || 0)
      const valorQuinzena = Number(l.quinzenaFinal || 0)
      const valorExtra = gravado ? Number(gravado.valor_extra || 0) : 0
      const valorTotal = valorQuinzena + valorExtra
      const pago = gravado ? Boolean(gravado.pago) : false
      const dataPagamento = gravado?.data_pagamento || null
      const observacao = gravado?.observacao || ""

      itens.push({
        key: `func_${l.id}`,
        colaborador_id: colabId,
        nome: l.nome,
        tipo: "Funcionario",
        funcao: l.funcao || l.cargo || "Geral",
        salario_base: salarioBase,
        percentual_quinzena: percentualQuinzena,
        valor_quinzena: valorQuinzena,
        valor_extra: valorExtra,
        valor_total_adiantamento: valorTotal,
        pago,
        data_pagamento: dataPagamento,
        observacao,
        conta: l.conta || "",
        pix: l.pix || l.chave_pix || "",
        registro_adiantamento_id: gravado?.id,
      })
    })

    // 2.2 Terceiros (mesma lista da QUINZENA: terceirosProcessados, exceto Monteiro se vazio)
    if (
      !isMonteiro &&
      terceirosProcessados &&
      terceirosProcessados.length > 0
    ) {
      terceirosProcessados.forEach((t) => {
        const colabId = String(t.id || `terc_${t.nome}`)
        const gravado =
          mapaGravados.get(colabId) ||
          mapaGravados.get(`NOME:${t.nome.trim().toUpperCase()}`)

        const salarioBase = Number(t.valorMes || t.salario_base || t.bruto || 0)
        const valorQuinzena = Number(t.quinzena || 0)
        const valorExtra = gravado ? Number(gravado.valor_extra || 0) : 0
        const valorTotal = valorQuinzena + valorExtra
        const pago = gravado ? Boolean(gravado.pago) : false
        const dataPagamento = gravado?.data_pagamento || null
        const observacao = gravado?.observacao || ""

        itens.push({
          key: `terc_${t.id}`,
          colaborador_id: colabId,
          nome: t.nome,
          tipo: "Terceiro",
          funcao: "TERCEIRO",
          salario_base: salarioBase,
          percentual_quinzena: percentualQuinzena,
          valor_quinzena: valorQuinzena,
          valor_extra: valorExtra,
          valor_total_adiantamento: valorTotal,
          pago,
          data_pagamento: dataPagamento,
          observacao,
          conta: t.conta || "",
          pix: t.pix || t.chave_pix || "",
          registro_adiantamento_id: gravado?.id,
        })
      })
    }

    return itens
  }, [
    linhasGeralProcessadas,
    terceirosProcessados,
    adiantamentosGravados,
    isMonteiro,
    percentualQuinzena,
  ])

  // 3. Filtragem por busca e por status
  const itensFiltrados = useMemo(() => {
    return listaUnificada.filter((item) => {
      if (filtroStatus === "pago" && !item.pago) return false
      if (filtroStatus === "pendente" && item.pago) return false

      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const nomeOk = item.nome.toLowerCase().includes(termo)
        const funcaoOk = item.funcao.toLowerCase().includes(termo)
        const obsOk = item.observacao.toLowerCase().includes(termo)
        const pixOk = (item.pix || "").toLowerCase().includes(termo)
        if (!nomeOk && !funcaoOk && !obsOk && !pixOk) return false
      }

      return true
    })
  }, [listaUnificada, busca, filtroStatus])

  // 4. Totalizadores do rodapé
  const totais = useMemo(() => {
    let totalQuinzenaBase = 0
    let totalExtra = 0
    let totalAdiantamento = 0
    let totalJaPago = 0
    let totalPendente = 0
    let qtdPagos = 0
    let qtdPendentes = 0

    listaUnificada.forEach((item) => {
      totalQuinzenaBase += item.valor_quinzena
      totalExtra += item.valor_extra
      totalAdiantamento += item.valor_total_adiantamento

      if (item.pago) {
        totalJaPago += item.valor_total_adiantamento
        qtdPagos++
      } else {
        totalPendente += item.valor_total_adiantamento
        qtdPendentes++
      }
    })

    return {
      totalQuinzenaBase,
      totalExtra,
      totalAdiantamento,
      totalJaPago,
      totalPendente,
      qtdPagos,
      qtdPendentes,
      totalColaboradores: listaUnificada.length,
    }
  }, [listaUnificada])

  // Ações de pagamento
  const abrirModalMarcarPago = (item: ItemAdiantamentoColaborador) => {
    setItemSelecionado(item)
    // Data padrão: SEMPRE hoje em YYYY-MM-DD (independente de pagamento anterior)
    const hojeIso = new Date().toISOString().split("T")[0]
    setDataPagamentoInput(hojeIso)
    setObservacaoInput(item.observacao || "")
    setModalPagoAberto(true)
  }

  const prosseguirParaConfirmacaoPago = () => {
    if (!dataPagamentoInput) {
      toast({
        title: "Data obrigatória",
        description: "Informe a data do pagamento.",
        variant: "destructive",
      })
      return
    }
    setModalPagoAberto(false)
    setConfirmacaoPagoAberta(true)
  }

  const confirmarGravacaoPago = async () => {
    if (!itemSelecionado) return
    try {
      await FolhaService.salvarAdiantamento({
        empresa_id: empresaId,
        competencia,
        colaborador_id: itemSelecionado.colaborador_id,
        nome: itemSelecionado.nome,
        tipo: itemSelecionado.tipo,
        valor_extra: itemSelecionado.valor_extra,
        pago: true,
        data_pagamento: dataPagamentoInput,
        observacao: observacaoInput,
      })

      toast({
        title: "Pagamento registrado",
        description: `Adiantamento de ${itemSelecionado.nome} marcado como PAGO em ${formatarDataBr(dataPagamentoInput)}.`,
      })
      setConfirmacaoPagoAberta(false)
      setItemSelecionado(null)
      await carregarAdiantamentos()
    } catch (err) {
      console.error("Erro ao marcar adiantamento pago:", err)
      toast({
        title: "Erro ao gravar pagamento",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      })
    }
  }

  const abrirConfirmacaoReverter = (item: ItemAdiantamentoColaborador) => {
    setItemReverter(item)
    setConfirmacaoReverterAberta(true)
  }

  const confirmarReversaoPagamento = async () => {
    if (!itemReverter) return
    try {
      await FolhaService.reverterAdiantamento({
        empresa_id: empresaId,
        competencia,
        colaborador_id: itemReverter.colaborador_id,
        nome: itemReverter.nome,
        tipo: itemReverter.tipo,
      })

      toast({
        title: "Pagamento revertido",
        description: `Adiantamento de ${itemReverter.nome} retornou para status PENDENTE.`,
      })
      setConfirmacaoReverterAberta(false)
      setItemReverter(null)
      await carregarAdiantamentos()
    } catch (err) {
      console.error("Erro ao reverter pagamento:", err)
      toast({
        title: "Erro ao reverter",
        description: "Não foi possível reverter o status do pagamento.",
        variant: "destructive",
      })
    }
  }

  const abrirModalExtra = (item: ItemAdiantamentoColaborador) => {
    setItemExtra(item)
    setValorExtraInput(
      item.valor_extra > 0 ? item.valor_extra.toFixed(2).replace(".", ",") : "",
    )
    setObservacaoInput(item.observacao || "")
    setModalExtraAberto(true)
  }

  const salvarValorExtra = async () => {
    if (!itemExtra) return
    try {
      setSalvandoExtra(true)
      const numExtra =
        parseFloat(valorExtraInput.replace(/\./g, "").replace(",", ".")) || 0

      if (numExtra < 0) {
        toast({
          title: "Valor inválido",
          description: "O valor extra não pode ser negativo.",
          variant: "destructive",
        })
        return
      }

      await FolhaService.salvarAdiantamento({
        empresa_id: empresaId,
        competencia,
        colaborador_id: itemExtra.colaborador_id,
        nome: itemExtra.nome,
        tipo: itemExtra.tipo,
        valor_extra: numExtra,
        pago: itemExtra.pago,
        data_pagamento: itemExtra.data_pagamento,
        observacao: observacaoInput,
      })

      toast({
        title: "Adiantamento atualizado",
        description: `Valor extra de ${itemExtra.nome} gravado: ${fmtMoeda(numExtra)}.`,
      })
      setModalExtraAberto(false)
      setItemExtra(null)
      await carregarAdiantamentos()
    } catch (err) {
      console.error("Erro ao salvar valor extra:", err)
      toast({
        title: "Erro ao gravar",
        description: "Não foi possível salvar o valor extra de adiantamento.",
        variant: "destructive",
      })
    } finally {
      setSalvandoExtra(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* CARD PRINCIPAL */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Controle de Adiantamento da Quinzena
            </CardTitle>
            <CardDescription className="text-xs">
              Acompanhamento de pagamento do adiantamento quinzenal (
              {Math.round(percentualQuinzena * 100)}% automático do salário base
              + valor extra avulso) na competência {rotuloCompetencia}.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {imprimirAbaA4 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => imprimirAbaA4("adiantamento")}
                title="Imprimir a folha de Quinzena em A4 (inclui o controle de adiantamento)"
              >
                <Printer className="h-4 w-4" />
                Imprimir Adiantamento A4
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* CARDS RESUMO / KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40">
              <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 block">
                TOTAL DO ADIANTAMENTO
              </span>
              <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1">
                {fmtMoeda(totais.totalAdiantamento)}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Base Quinzena: {fmtMoeda(totais.totalQuinzenaBase)}
                {totais.totalExtra > 0 &&
                  ` + Extra: ${fmtMoeda(totais.totalExtra)}`}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40">
              <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                TOTAL JÁ PAGO
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {fmtMoeda(totais.totalJaPago)}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {totais.qtdPagos} colaborador(es) recebido(s)
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                TOTAL PENDENTE
              </span>
              <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                {fmtMoeda(totais.totalPendente)}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {totais.qtdPendentes} colaborador(es) a pagar
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-muted/40">
              <span className="text-[11px] font-semibold text-foreground block">
                COLABORADORES
              </span>
              <div className="text-xl font-bold font-mono text-foreground mt-1">
                {totais.totalColaboradores}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                CLT e Terceiros da competência
              </span>
            </div>
          </div>

          {/* FILTROS E BUSCA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={filtroStatus === "todos" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setFiltroStatus("todos")}
              >
                Todos ({listaUnificada.length})
              </Button>
              <Button
                variant={filtroStatus === "pendente" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs text-amber-700 dark:text-amber-300"
                onClick={() => setFiltroStatus("pendente")}
              >
                Pendentes ({totais.qtdPendentes})
              </Button>
              <Button
                variant={filtroStatus === "pago" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs text-emerald-700 dark:text-emerald-300"
                onClick={() => setFiltroStatus("pago")}
              >
                Pagos ({totais.qtdPagos})
              </Button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, função, PIX ou obs..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* TABELA DE CONTROLE DE ADIANTAMENTO */}
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-2 text-center w-8">Nº</th>
                  <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                    NOME
                  </th>
                  <th className="py-2.5 px-2">TIPO</th>
                  <th className="py-2.5 px-2 text-right">SALÁRIO BASE</th>
                  <th className="py-2.5 px-2 text-right bg-blue-50/50 dark:bg-blue-950/20 font-bold text-blue-700 dark:text-blue-300">
                    QUINZENA ({Math.round(percentualQuinzena * 100)}%)
                  </th>
                  <th className="py-2.5 px-2 text-right bg-amber-50/50 dark:bg-amber-950/20 font-bold text-amber-800 dark:text-amber-300">
                    EXTRA (+)
                  </th>
                  <th className="py-2.5 px-2 text-right bg-primary/10 font-bold text-primary">
                    TOTAL ADIANTAMENTO
                  </th>
                  <th className="py-2.5 px-2 text-center">STATUS</th>
                  <th className="py-2.5 px-2 text-center">DATA PAGTO</th>
                  <th className="py-2.5 px-3">OBSERVAÇÃO</th>
                  <th className="py-2.5 px-2 text-center print:hidden">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {carregando ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Carregando adiantamentos da competência...
                    </td>
                  </tr>
                ) : itensFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum colaborador encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  itensFiltrados.map((item, idx) => (
                    <tr
                      key={item.key}
                      className={`hover:bg-muted/40 transition-colors ${
                        item.pago
                          ? "bg-emerald-50/20 dark:bg-emerald-950/10"
                          : ""
                      }`}
                    >
                      <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{item.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {item.funcao}
                            {item.pix ? ` · PIX: ${item.pix}` : ""}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-2 whitespace-nowrap">
                        {item.tipo === "Terceiro" ? (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] px-1.5 py-0"
                          >
                            Terceiro
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            CLT
                          </Badge>
                        )}
                      </td>

                      <td className="py-2 px-2 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {fmtMoeda(item.salario_base)}
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 whitespace-nowrap">
                        {fmtMoeda(item.valor_quinzena)}
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {item.valor_extra > 0 ? (
                            <span>+{fmtMoeda(item.valor_extra)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-amber-600 print:hidden"
                            onClick={() => abrirModalExtra(item)}
                            title="Lançar ou editar valor extra de adiantamento"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5 whitespace-nowrap">
                        {fmtMoeda(item.valor_total_adiantamento)}
                      </td>

                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        {item.pago ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[10px] px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 gap-1 text-[10px] px-2 py-0.5"
                          >
                            <Clock className="h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </td>

                      <td className="py-2 px-2 text-center font-mono whitespace-nowrap text-muted-foreground">
                        {item.pago ? formatarDataBr(item.data_pagamento) : "—"}
                      </td>

                      <td
                        className="py-2 px-3 text-muted-foreground text-[11px] max-w-[180px] truncate"
                        title={item.observacao || ""}
                      >
                        {item.observacao || "—"}
                      </td>

                      <td className="py-2 px-2 text-center whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {!item.pago ? (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => abrirModalMarcarPago(item)}
                              title="Marcar adiantamento como pago"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Marcar como pago
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1"
                              onClick={() => abrirConfirmacaoReverter(item)}
                              title="Reverter pagamento e voltar para pendente"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reverter
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => abrirModalExtra(item)}
                            title="Editar extra e observação"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                <tr>
                  <td className="py-2.5 px-2 text-center">-</td>
                  <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                    TOTALIZADORES ({itensFiltrados.length} colaboradores)
                  </td>
                  <td className="py-2.5 px-2">-</td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {fmtMoeda(
                      itensFiltrados.reduce(
                        (acc, cur) => acc + cur.salario_base,
                        0,
                      ),
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-blue-600 bg-blue-50/50 dark:bg-blue-950/20">
                    {fmtMoeda(
                      itensFiltrados.reduce(
                        (acc, cur) => acc + cur.valor_quinzena,
                        0,
                      ),
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
                    {fmtMoeda(
                      itensFiltrados.reduce(
                        (acc, cur) => acc + cur.valor_extra,
                        0,
                      ),
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-primary bg-primary/10">
                    {fmtMoeda(
                      itensFiltrados.reduce(
                        (acc, cur) => acc + cur.valor_total_adiantamento,
                        0,
                      ),
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-xs">
                    {totais.qtdPagos} Pagos / {totais.qtdPendentes} Pend.
                  </td>
                  <td className="py-2.5 px-2 text-center">-</td>
                  <td className="py-2.5 px-3">-</td>
                  <td className="py-2.5 px-2 text-center print:hidden">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DIÁLOGO 1: Informar data de pagamento e observação */}
      <Dialog open={modalPagoAberto} onOpenChange={setModalPagoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Marcar Adiantamento como Pago
            </DialogTitle>
            <DialogDescription>
              Confirme a data em que o adiantamento de{" "}
              <strong className="text-foreground">
                {itemSelecionado?.nome}
              </strong>{" "}
              no valor total de{" "}
              <strong className="text-primary font-mono">
                {fmtMoeda(itemSelecionado?.valor_total_adiantamento)}
              </strong>{" "}
              foi realizado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="data_pagamento" className="text-xs font-semibold">
                Data do Pagamento *
              </Label>
              <Input
                id="data_pagamento"
                type="date"
                value={dataPagamentoInput}
                onChange={(e) => setDataPagamentoInput(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="obs_pagamento" className="text-xs font-semibold">
                Observação (opcional)
              </Label>
              <Input
                id="obs_pagamento"
                placeholder="Ex.: PIX comprovante 4819, adiantamento em dinheiro..."
                value={observacaoInput}
                onChange={(e) => setObservacaoInput(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalPagoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={prosseguirParaConfirmacaoPago}
            >
              Avançar para Confirmação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG CONFIRMAÇÃO DO PAGAMENTO (Padrão do sistema) */}
      <AlertDialog
        open={confirmacaoPagoAberta}
        onOpenChange={setConfirmacaoPagoAberta}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-emerald-600" />
              Confirmar Pagamento de Adiantamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                Você está prestes a registrar como <strong>PAGO</strong> o
                adiantamento de:
              </p>
              <div className="bg-muted p-3 rounded text-foreground font-mono space-y-1">
                <div>
                  <strong>Colaborador:</strong> {itemSelecionado?.nome}
                </div>
                <div>
                  <strong>Valor Total:</strong>{" "}
                  {fmtMoeda(itemSelecionado?.valor_total_adiantamento)}
                </div>
                <div>
                  <strong>Data de Pagamento:</strong>{" "}
                  {formatarDataBr(dataPagamentoInput)}
                </div>
                {observacaoInput && (
                  <div>
                    <strong>Observação:</strong> {observacaoInput}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                Esta ação grava o status e a data no banco de dados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmacaoPagoAberta(false)}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={confirmarGravacaoPago}
            >
              Confirmar e Gravar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT DIALOG REVERTER PAGAMENTO */}
      <AlertDialog
        open={confirmacaoReverterAberta}
        onOpenChange={setConfirmacaoReverterAberta}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <RotateCcw className="h-5 w-5" />
              Reverter Pagamento de Adiantamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                Deseja reverter o adiantamento de{" "}
                <strong className="text-foreground">
                  {itemReverter?.nome}
                </strong>{" "}
                (Total:{" "}
                <strong className="text-primary font-mono">
                  {fmtMoeda(itemReverter?.valor_total_adiantamento)}
                </strong>
                ) para o status <strong>PENDENTE</strong>?
              </p>
              <p className="text-muted-foreground">
                A data de pagamento anterior será removida.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmacaoReverterAberta(false)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={confirmarReversaoPagamento}
            >
              Sim, Reverter Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO 3: Lançar/Editar Valor Extra e Observação */}
      <Dialog open={modalExtraAberto} onOpenChange={setModalExtraAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-600" />
              Lançar Valor Extra de Adiantamento
            </DialogTitle>
            <DialogDescription>
              Informe um adiantamento extra digitado para{" "}
              <strong className="text-foreground">{itemExtra?.nome}</strong>. O
              valor será somado ao valor da quinzena automática.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded bg-muted/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Quinzena Automática:
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {fmtMoeda(itemExtra?.valor_quinzena)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor_extra" className="text-xs font-semibold">
                Valor Extra (R$)
              </Label>
              <Input
                id="valor_extra"
                placeholder="0,00"
                value={valorExtraInput}
                onChange={(e) => setValorExtraInput(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-muted-foreground">
                Ex.: 500,00 para somar R$ 500 ao adiantamento quinzenal.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="obs_extra" className="text-xs font-semibold">
                Observação
              </Label>
              <Input
                id="obs_extra"
                placeholder="Ex.: Adiantamento avulso autorizado pela diretoria"
                value={observacaoInput}
                onChange={(e) => setObservacaoInput(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalExtraAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={salvandoExtra}
              onClick={salvarValorExtra}
            >
              {salvandoExtra ? "Salvando..." : "Gravar Valor Extra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
