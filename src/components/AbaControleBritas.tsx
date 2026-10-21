import { useState, useEffect, useMemo } from "react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Layers,
  PlusCircle,
  ShoppingCart,
  Truck,
  Trash2,
  Edit2,
  AlertTriangle,
  RefreshCw,
  Scale,
  Calendar,
  Calculator,
  Layers2,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { BritasService } from "@/services/britas"
import type {
  ControleBritaCompra,
  ControleBritaEntrega,
  TipoBrita,
  UnidadeBritaEntrega,
  ResumoControleBritasMes,
} from "@/types/britas"
import type { Empresa } from "@/types/concreteira"

interface AbaControleBritasProps {
  empresaAtiva: Empresa | null
  podeEditar?: boolean
}

const DENSIDADE_PADRAO: Record<TipoBrita, string> = {
  "12": "1.38",
  "19": "1.40",
}

const MESES_NOMES = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
]

function getCompetenciaAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, "0")
  return `${ano}-${mes}`
}

function formatarCompetenciaRotulo(comp: string): string {
  const [anoStr, mesStr] = comp.split("-")
  const mesIdx = Number(mesStr) - 1
  if (mesIdx >= 0 && mesIdx < 12 && anoStr) {
    return `${MESES_NOMES[mesIdx]}/${anoStr}`
  }
  return comp
}

function somarMesesCompetencia(comp: string, delta: number): string {
  const [anoStr, mesStr] = comp.split("-")
  let ano = Number(anoStr) || new Date().getFullYear()
  let mes = Number(mesStr) || new Date().getMonth() + 1
  mes += delta
  while (mes < 1) {
    mes += 12
    ano -= 1
  }
  while (mes > 12) {
    mes -= 12
    ano += 1
  }
  return `${ano}-${String(mes).padStart(2, "0")}`
}

export function AbaControleBritas({
  empresaAtiva,
  podeEditar = true,
}: AbaControleBritasProps) {
  const [competencia, setCompetencia] = useState<string>(getCompetenciaAtual)
  const [compraMensal, setCompraMensal] = useState<ControleBritaCompra | null>(
    null,
  )
  const [entregas, setEntregas] = useState<ControleBritaEntrega[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filtroTipoBrita, setFiltroTipoBrita] = useState<"ALL" | TipoBrita>(
    "ALL",
  )

  // Modal Lançar / Editar Compra Mensal Única
  const [modalCompraAberta, setModalCompraAberta] = useState(false)
  const [salvandoCompra, setSalvandoCompra] = useState(false)
  const [compraVolumeM3, setCompraVolumeM3] = useState<string>("")
  const [compraObservacao, setCompraObservacao] = useState<string>("")

  // Diálogo para Replicar Compra para o Próximo Mês
  const [confirmarReplicarAberto, setConfirmarReplicarAberto] = useState(false)
  const [replicandoCompra, setReplicandoCompra] = useState(false)

  // Modal Registrar ou Editar Entrega
  const [modalEntregaAberta, setModalEntregaAberta] = useState(false)
  const [entregaEmEdicao, setEntregaEmEdicao] =
    useState<ControleBritaEntrega | null>(null)
  const [salvandoEntrega, setSalvandoEntrega] = useState(false)
  const [entregaTipoBrita, setEntregaTipoBrita] = useState<TipoBrita>("19")
  const [entregaData, setEntregaData] = useState<string>(
    new Date().toISOString().split("T")[0],
  )
  const [entregaQuantidade, setEntregaQuantidade] = useState<string>("")
  const [entregaUnidade, setEntregaUnidade] =
    useState<UnidadeBritaEntrega>("m³")
  const [entregaDensidade, setEntregaDensidade] = useState<string>(
    DENSIDADE_PADRAO["19"],
  )
  // Rastreia se o usuário editou manualmente o campo densidade na sessão do modal
  const [densidadeEditadaManualmente, setDensidadeEditadaManualmente] =
    useState<boolean>(false)
  const [entregaFornecedor, setEntregaFornecedor] = useState<string>("")
  const [entregaDocumento, setEntregaDocumento] = useState<string>("")
  const [entregaObservacao, setEntregaObservacao] = useState<string>("")

  // Dialog Excluir Entrega
  const [entregaParaExcluir, setEntregaParaExcluir] =
    useState<ControleBritaEntrega | null>(null)
  const [excluindoEntrega, setExcluindoEntrega] = useState(false)

  const carregarDados = async () => {
    if (!empresaAtiva?.id) return
    setLoading(true)
    try {
      const [compraRes, entregasRes] = await Promise.all([
        BritasService.getCompraCompetencia(empresaAtiva.id, competencia),
        BritasService.getEntregasCompetencia(empresaAtiva.id, competencia),
      ])
      setCompraMensal(compraRes)
      setEntregas(entregasRes)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erro ao carregar controle de britas",
        description: err.message || "Falha ao buscar registros do mês.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id, competencia])

  // Cálculo da conversão ao vivo para o modal de entrega (criar ou editar)
  const calculoConversaoAoVivo = useMemo(() => {
    const qtdNum = Number(entregaQuantidade.replace(",", ".")) || 0
    if (qtdNum <= 0) return { qtdM3: 0, formula: "" }

    if (entregaUnidade === "m³") {
      return {
        qtdM3: qtdNum,
        formula: `${qtdNum.toLocaleString("pt-BR")} m³ (medida direta)`,
      }
    }

    const densNum = Number(entregaDensidade.replace(",", ".")) || 1.5
    if (densNum <= 0) return { qtdM3: 0, formula: "Densidade inválida" }

    const m3 = Number((qtdNum / densNum).toFixed(3))
    return {
      qtdM3: m3,
      formula: `${qtdNum.toLocaleString("pt-BR")} t ÷ ${densNum.toLocaleString("pt-BR")} = ${m3.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m³`,
    }
  }, [entregaQuantidade, entregaUnidade, entregaDensidade])

  // Resumo Geral: Compra do Mês, Entregas Brita 19, Brita 12, Total Geral e Saldo a Receber
  const resumo: ResumoControleBritasMes = useMemo(() => {
    const compraTotalM3 = compraMensal ? Number(compraMensal.volume_m3) || 0 : 0

    const entregas19 = entregas.filter((e) => e.tipo_brita === "19")
    const entregas12 = entregas.filter((e) => e.tipo_brita === "12")

    const totalEntregue19M3 = Number(
      entregas19
        .reduce((acc, cur) => acc + (Number(cur.quantidade_m3) || 0), 0)
        .toFixed(3),
    )
    const totalEntregue12M3 = Number(
      entregas12
        .reduce((acc, cur) => acc + (Number(cur.quantidade_m3) || 0), 0)
        .toFixed(3),
    )
    const totalEntregueGeralM3 = Number(
      (totalEntregue19M3 + totalEntregue12M3).toFixed(3),
    )

    const saldoAReceberM3 = Number(
      (compraTotalM3 - totalEntregueGeralM3).toFixed(3),
    )
    const entregasExcedentes = totalEntregueGeralM3 > compraTotalM3

    return {
      compraTotalM3,
      totalEntregue19M3,
      totalEntregue12M3,
      totalEntregueGeralM3,
      saldoAReceberM3,
      entregasExcedentes,
      totalEntregasQtd: entregas.length,
      totalEntregas19Qtd: entregas19.length,
      totalEntregas12Qtd: entregas12.length,
    }
  }, [compraMensal, entregas])

  // Percentual atendido da compra
  const percentualAtendido = useMemo(() => {
    if (resumo.compraTotalM3 <= 0) return 0
    return Math.round(
      (resumo.totalEntregueGeralM3 / resumo.compraTotalM3) * 100,
    )
  }, [resumo.compraTotalM3, resumo.totalEntregueGeralM3])

  // Abrir modal de compra mensal (para criar ou editar)
  const abrirModalCompra = () => {
    if (compraMensal) {
      setCompraVolumeM3(String(compraMensal.volume_m3))
      setCompraObservacao(compraMensal.observacao || "")
    } else {
      setCompraVolumeM3("")
      setCompraObservacao("")
    }
    setModalCompraAberta(true)
  }

  // Salvar compra mensal única
  const handleSalvarCompra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva?.id) return

    const vol = Number(compraVolumeM3.replace(",", "."))
    if (isNaN(vol) || vol < 0) {
      toast({
        title: "Volume inválido",
        description: "Informe um volume em m³ válido (0 ou maior).",
        variant: "destructive",
      })
      return
    }

    setSalvandoCompra(true)
    try {
      await BritasService.upsertCompra({
        empresa_id: empresaAtiva.id,
        competencia,
        volume_m3: vol,
        observacao: compraObservacao,
      })

      toast({
        title: "Compra mensal salva",
        description: `Volume total de ${vol.toLocaleString("pt-BR")} m³ registrado para o mês ${competencia}.`,
      })
      setModalCompraAberta(false)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar compra",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoCompra(false)
    }
  }

  // Competência seguinte calculada para o atalho de replicação
  const proximaCompetencia = useMemo(
    () => somarMesesCompetencia(competencia, 1),
    [competencia],
  )
  const anteriorCompetencia = useMemo(
    () => somarMesesCompetencia(competencia, -1),
    [competencia],
  )

  // Handlers de navegação entre meses
  const irMesAnterior = () => {
    setCompetencia(anteriorCompetencia)
  }

  const irProximoMes = () => {
    setCompetencia(proximaCompetencia)
  }

  // Replicar compra da competência atual para a próxima
  const handleConfirmarReplicacao = async () => {
    if (!empresaAtiva?.id) return
    const vol = compraMensal ? Number(compraMensal.volume_m3) || 0 : 0
    if (vol <= 0) {
      toast({
        title: "Nenhuma compra para replicar",
        description: `Cadastre primeiro um volume de compra em ${formatarCompetenciaRotulo(competencia)}.`,
        variant: "destructive",
      })
      setConfirmarReplicarAberto(false)
      return
    }

    setReplicandoCompra(true)
    try {
      await BritasService.upsertCompra({
        empresa_id: empresaAtiva.id,
        competencia: proximaCompetencia,
        volume_m3: vol,
        observacao: compraMensal?.observacao
          ? `Replicado de ${formatarCompetenciaRotulo(competencia)}: ${compraMensal.observacao}`
          : `Replicado de ${formatarCompetenciaRotulo(competencia)}`,
      })

      toast({
        title: "Compra replicada com sucesso",
        description: `Volume de ${vol.toLocaleString("pt-BR")} m³ copiado para ${formatarCompetenciaRotulo(proximaCompetencia)}. Avançando para o mês...`,
      })

      setConfirmarReplicarAberto(false)
      // Avança a tela diretamente para a competência criada
      setCompetencia(proximaCompetencia)
    } catch (err: any) {
      toast({
        title: "Erro ao replicar compra",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setReplicandoCompra(false)
    }
  }

  // Obter data padrão de entrega dentro do mês selecionado
  const obterDataPadraoParaCompetencia = (comp: string): string => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split("T")[0]
    if (hojeStr.startsWith(comp)) {
      return hojeStr
    }
    return `${comp}-01`
  }

  // Troca de tipo de brita no modal com atualização da densidade padrão se a unidade for "t"
  const handleTrocarTipoBritaModal = (novoTipo: TipoBrita) => {
    setEntregaTipoBrita(novoTipo)
    // Se a unidade for "t" e o usuário não tiver digitado um valor manualmente nesta edição
    if (entregaUnidade === "t" && !densidadeEditadaManualmente) {
      setEntregaDensidade(DENSIDADE_PADRAO[novoTipo])
    }
  }

  // Troca de unidade no modal com pré-preenchimento da densidade padrão para "t"
  const handleTrocarUnidadeModal = (novaUnidade: UnidadeBritaEntrega) => {
    setEntregaUnidade(novaUnidade)
    if (novaUnidade === "t" && !densidadeEditadaManualmente) {
      setEntregaDensidade(DENSIDADE_PADRAO[entregaTipoBrita])
    }
  }

  // Abrir modal de entrega para CRIAR
  const abrirModalNovaEntrega = (tipo?: TipoBrita) => {
    const tipoInicial = tipo || "19"
    setEntregaEmEdicao(null)
    setEntregaTipoBrita(tipoInicial)
    setEntregaQuantidade("")
    setEntregaUnidade("m³")
    setEntregaDensidade(DENSIDADE_PADRAO[tipoInicial])
    setDensidadeEditadaManualmente(false)
    setEntregaFornecedor("")
    setEntregaDocumento("")
    setEntregaObservacao("")
    setEntregaData(obterDataPadraoParaCompetencia(competencia))
    setModalEntregaAberta(true)
  }

  // Abrir modal de entrega para EDITAR
  const abrirModalEditarEntrega = (entrega: ControleBritaEntrega) => {
    setEntregaEmEdicao(entrega)
    setEntregaTipoBrita(entrega.tipo_brita)
    setEntregaData(entrega.data)
    setEntregaQuantidade(String(entrega.quantidade))
    setEntregaUnidade(entrega.unidade)
    if (entrega.densidade != null) {
      setEntregaDensidade(String(entrega.densidade))
      setDensidadeEditadaManualmente(true)
    } else {
      setEntregaDensidade(DENSIDADE_PADRAO[entrega.tipo_brita])
      setDensidadeEditadaManualmente(false)
    }
    setEntregaFornecedor(entrega.fornecedor || "")
    setEntregaDocumento(entrega.documento || "")
    setEntregaObservacao(entrega.observacao || "")
    setModalEntregaAberta(true)
  }

  // Salvar entrega (Insert ou Update)
  const handleSalvarEntrega = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva?.id) return

    const qtd = Number(entregaQuantidade.replace(",", "."))
    if (isNaN(qtd) || qtd <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Informe uma quantidade positiva.",
        variant: "destructive",
      })
      return
    }

    let dens: number | null = null
    if (entregaUnidade === "t") {
      dens = Number(entregaDensidade.replace(",", "."))
      if (isNaN(dens) || dens <= 0) {
        toast({
          title: "Densidade obrigatória",
          description:
            "Para entregas em toneladas (t), informe a densidade (sugerido: 1,5).",
          variant: "destructive",
        })
        return
      }
    }

    setSalvandoEntrega(true)
    try {
      if (entregaEmEdicao) {
        // Modo Edição
        await BritasService.atualizarEntrega({
          id: entregaEmEdicao.id,
          tipo_brita: entregaTipoBrita,
          competencia,
          data: entregaData,
          quantidade: qtd,
          unidade: entregaUnidade,
          densidade: dens,
          fornecedor: entregaFornecedor,
          documento: entregaDocumento,
          observacao: entregaObservacao,
        })
        toast({
          title: "Entrega atualizada com sucesso",
          description: `Brita ${entregaTipoBrita}: ${calculoConversaoAoVivo.qtdM3.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m³ recalculados.`,
        })
      } else {
        // Modo Novo Registro
        await BritasService.registrarEntrega({
          empresa_id: empresaAtiva.id,
          tipo_brita: entregaTipoBrita,
          competencia,
          data: entregaData,
          quantidade: qtd,
          unidade: entregaUnidade,
          densidade: dens,
          fornecedor: entregaFornecedor,
          documento: entregaDocumento,
          observacao: entregaObservacao,
        })
        toast({
          title: "Entrega registrada com sucesso",
          description: `Brita ${entregaTipoBrita}: ${calculoConversaoAoVivo.qtdM3.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m³ adicionados ao mês.`,
        })
      }

      setModalEntregaAberta(false)
      setEntregaEmEdicao(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: entregaEmEdicao
          ? "Erro ao atualizar entrega"
          : "Erro ao registrar entrega",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoEntrega(false)
    }
  }

  // Excluir entrega
  const handleConfirmarExclusao = async () => {
    if (!entregaParaExcluir) return
    setExcluindoEntrega(true)
    try {
      await BritasService.excluirEntrega(entregaParaExcluir.id)
      toast({
        title: "Entrega excluída",
        description: "O lançamento foi removido do controle do mês.",
      })
      setEntregaParaExcluir(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao excluir entrega",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setExcluindoEntrega(false)
    }
  }

  const entregasFiltradas = useMemo(() => {
    if (filtroTipoBrita === "ALL") return entregas
    return entregas.filter((e) => e.tipo_brita === filtroTipoBrita)
  }, [entregas, filtroTipoBrita])

  return (
    <div className="space-y-6">
      {/* Barra Superior: Título, Competência, Ações Rápidas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Controle de Britas (Brita 19 & Brita 12)
            </h2>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-xs font-semibold"
            >
              Compra Única Mensal
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            A compra é contratada em <strong>volume único mensal</strong> para
            as duas britas juntas (ex.: 450 m³). Na entrega individual,
            classifica-se se é Brita 19 ou Brita 12 (com conversão m³ / t).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Seletor de Competência com Navegação ‹ anterior / › próximo */}
          <div className="flex items-center bg-background border border-border/60 rounded-lg shadow-sm p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={irMesAnterior}
              title={`Mês anterior (${formatarCompetenciaRotulo(anteriorCompetencia)})`}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex flex-col items-center">
                <span className="text-xs font-extrabold tracking-wider font-mono uppercase text-foreground whitespace-nowrap">
                  {formatarCompetenciaRotulo(competencia)}
                </span>
                <input
                  type="month"
                  value={competencia}
                  onChange={(e) => {
                    if (e.target.value) setCompetencia(e.target.value)
                  }}
                  className="sr-only"
                  id="competencia-britas-hidden"
                  tabIndex={-1}
                  aria-label="Selecionar competência"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={irProximoMes}
              title={`Próximo mês (${formatarCompetenciaRotulo(proximaCompetencia)})`}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Input month nativo para pular direto a qualquer ano/mês */}
          <div className="hidden lg:flex items-center bg-background border border-border/50 rounded-lg px-2 py-1 shadow-sm">
            <Input
              id="competencia-britas"
              type="month"
              value={competencia}
              onChange={(e) => {
                if (e.target.value) setCompetencia(e.target.value)
              }}
              className="h-6 w-32 text-[11px] font-mono border-none shadow-none focus-visible:ring-0 p-0"
              title="Selecione diretamente o mês/ano"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={loading}
            className="h-8 gap-1 text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Recarregar
          </Button>

          {podeEditar && (
            <Button
              size="sm"
              onClick={() => abrirModalNovaEntrega()}
              className="h-8 gap-1 text-xs bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              <Truck className="w-3.5 h-3.5" />
              Registrar Entrega
            </Button>
          )}
        </div>
      </div>

      {/* Alerta Vermelho de Excedente Geral: se entregue geral > compra total */}
      {resumo.entregasExcedentes && (
        <div className="p-4 rounded-xl border-2 border-destructive bg-destructive/15 text-destructive flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 text-destructive" />
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-sm uppercase tracking-wide">
                ALERTA: O total entregue geral superou a compra do mês!
              </p>
              <p className="text-[12px] opacity-90">
                Foram entregues{" "}
                <strong>
                  {resumo.totalEntregueGeralM3.toLocaleString("pt-BR")} m³
                </strong>{" "}
                (Brita 19: {resumo.totalEntregue19M3.toLocaleString("pt-BR")} m³
                | Brita 12: {resumo.totalEntregue12M3.toLocaleString("pt-BR")}{" "}
                m³) para uma compra total de{" "}
                <strong>
                  {resumo.compraTotalM3.toLocaleString("pt-BR")} m³
                </strong>
                . Excesso:{" "}
                <span className="font-mono font-bold">
                  {Math.abs(resumo.saldoAReceberM3).toLocaleString("pt-BR")} m³
                </span>
                .
              </p>
            </div>
          </div>
          {podeEditar && (
            <Button
              size="sm"
              variant="outline"
              onClick={abrirModalCompra}
              className="border-destructive text-destructive hover:bg-destructive/20 h-8 text-xs shrink-0 font-bold"
            >
              Ajustar Compra
            </Button>
          )}
        </div>
      )}

      {/* Cartão Principal: COMPRA DO MÊS + Indicadores Solicitados */}
      <Card className="border border-border/60 bg-card/90 shadow-sm overflow-hidden">
        {/* Barra superior de progresso visual */}
        <div
          className={`h-2.5 w-full ${
            resumo.entregasExcedentes
              ? "bg-destructive animate-pulse"
              : resumo.saldoAReceberM3 === 0 && resumo.compraTotalM3 > 0
                ? "bg-emerald-500"
                : "bg-primary"
          }`}
        />

        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <span>Compra Mensal & Atendimento de Britas</span>
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="font-mono text-xs uppercase font-bold"
                >
                  {formatarCompetenciaRotulo(competencia)}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Volume contratado único para Brita 19 e 12 juntas na unidade{" "}
                <strong className="text-foreground">
                  {empresaAtiva?.nome}
                </strong>{" "}
                em{" "}
                <strong className="text-primary font-mono">
                  {formatarCompetenciaRotulo(competencia)}
                </strong>
              </CardDescription>
            </div>

            {podeEditar && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Atalho Replicar Compra para o Próximo Mês */}
                {resumo.compraTotalM3 > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmarReplicarAberto(true)}
                    className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                    title={`Replicar ${resumo.compraTotalM3.toLocaleString("pt-BR")} m³ para ${formatarCompetenciaRotulo(proximaCompetencia)}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Replicar para o Próximo Mês
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={abrirModalCompra}
                  className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {resumo.compraTotalM3 > 0
                    ? "Editar Compra do Mês"
                    : "Lançar Compra do Mês"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => abrirModalNovaEntrega()}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Lançar Entrega
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Grid com os 5 Indicadores Oficiais */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. COMPRA DO MÊS (ÚNICA) */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center relative flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Compra do Mês
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground block">
                  {resumo.compraTotalM3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>m³ contratados</span>
                {podeEditar && (
                  <button
                    type="button"
                    onClick={abrirModalCompra}
                    className="text-primary hover:underline text-[10px] font-semibold"
                    title="Editar volume da compra mensal"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* 2. TOTAL ENTREGUE BRITA 19 */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Total Entregue Brita 19
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 block">
                  {resumo.totalEntregue19M3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-blue-500/10 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Graúdo 19mm</span>
                <span className="font-mono font-semibold">
                  {resumo.totalEntregas19Qtd}x
                </span>
              </div>
            </div>

            {/* 3. TOTAL ENTREGUE BRITA 12 */}
            <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                  Total Entregue Brita 12
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400 block">
                  {resumo.totalEntregue12M3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Agregado 12,5mm</span>
                <span className="font-mono font-semibold">
                  {resumo.totalEntregas12Qtd}x
                </span>
              </div>
            </div>

            {/* 4. TOTAL ENTREGUE GERAL (m³) */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                  Total Entregue Geral
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-primary block">
                  {resumo.totalEntregueGeralM3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-primary/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>19 + 12 juntas</span>
                <span className="font-mono font-semibold">
                  {resumo.totalEntregasQtd} cargas
                </span>
              </div>
            </div>

            {/* 5. SALDO A RECEBER (compra total − entregue geral) */}
            <div
              className={`p-3.5 rounded-xl border text-center flex flex-col justify-between col-span-2 md:col-span-1 ${
                resumo.entregasExcedentes
                  ? "bg-destructive/15 border-destructive text-destructive"
                  : resumo.saldoAReceberM3 === 0 && resumo.compraTotalM3 > 0
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted/40 border-border/50 text-foreground"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">
                  Saldo a Receber
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono block">
                  {resumo.saldoAReceberM3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-current/20 flex items-center justify-between text-[11px] font-medium">
                <span>
                  {resumo.entregasExcedentes
                    ? "Excedente m³"
                    : resumo.saldoAReceberM3 === 0 && resumo.compraTotalM3 > 0
                      ? "100% entregue"
                      : "Pendente m³"}
                </span>
                <span className="font-mono text-[10px]">
                  {resumo.compraTotalM3 > 0 ? `${percentualAtendido}%` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso do Volume Contratado */}
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers2 className="w-3.5 h-3.5 text-primary" />
                Atendimento do Volume Mensal Contratado:
              </span>
              <span className="font-mono font-bold text-foreground">
                {resumo.compraTotalM3 > 0
                  ? `${resumo.totalEntregueGeralM3.toLocaleString("pt-BR")} m³ de ${resumo.compraTotalM3.toLocaleString("pt-BR")} m³ (${percentualAtendido}%)`
                  : "Volume de compra não cadastrado"}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
              {resumo.compraTotalM3 > 0 ? (
                <>
                  {/* Faixa Brita 19 */}
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (resumo.totalEntregue19M3 / resumo.compraTotalM3) * 100,
                      )}%`,
                    }}
                    title={`Brita 19: ${resumo.totalEntregue19M3} m³`}
                  />
                  {/* Faixa Brita 12 */}
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100 -
                          Math.min(
                            100,
                            (resumo.totalEntregue19M3 / resumo.compraTotalM3) *
                              100,
                          ),
                        (resumo.totalEntregue12M3 / resumo.compraTotalM3) * 100,
                      )}%`,
                    }}
                    title={`Brita 12: ${resumo.totalEntregue12M3} m³`}
                  />
                </>
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                  Brita 19: {resumo.totalEntregue19M3.toLocaleString("pt-BR")}{" "}
                  m³
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                  Brita 12: {resumo.totalEntregue12M3.toLocaleString("pt-BR")}{" "}
                  m³
                </span>
              </div>
              {compraMensal?.observacao && (
                <span
                  className="italic truncate max-w-[280px]"
                  title={compraMensal.observacao}
                >
                  Obs: {compraMensal.observacao}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico das Entregas do Mês com NOVA COLUNA 'AÇÕES' (EDITAR e EXCLUIR) */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Histórico das Entregas do Mês (
              {formatarCompetenciaRotulo(competencia)})
            </CardTitle>
            <CardDescription className="text-xs">
              Registros individuais de cargas recebidas de Brita 19 e Brita 12
              na competência {formatarCompetenciaRotulo(competencia)} com
              conversão automática para m³
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground shrink-0">
              Filtrar brita:
            </span>
            <Select
              value={filtroTipoBrita}
              onValueChange={(val: any) => setFiltroTipoBrita(val)}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Britas</SelectItem>
                <SelectItem value="19">Apenas Brita 19</SelectItem>
                <SelectItem value="12">Apenas Brita 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {entregasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
              <Truck className="w-8 h-8 mx-auto opacity-30" />
              <p>
                Nenhuma entrega registrada para o mês de{" "}
                <strong>{formatarCompetenciaRotulo(competencia)}</strong>.
              </p>
              {podeEditar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirModalNovaEntrega()}
                  className="gap-1.5 text-xs text-primary"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Registrar Primeira Entrega de{" "}
                  {formatarCompetenciaRotulo(competencia)}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo de Brita</th>
                    <th className="py-2.5 px-3">Qtd. Informada</th>
                    <th className="py-2.5 px-3">Densidade</th>
                    <th className="py-2.5 px-3 text-right">
                      Volume Calculado (m³)
                    </th>
                    <th className="py-2.5 px-3">Fornecedor</th>
                    <th className="py-2.5 px-3">Documento / NF</th>
                    <th className="py-2.5 px-3">Observação</th>
                    {podeEditar && (
                      <th className="py-2.5 px-3 text-center w-24">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {entregasFiltradas.map((entrega) => (
                    <tr
                      key={entrega.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {entrega.data.split("-").reverse().join("/")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        <Badge
                          variant="outline"
                          className={
                            entrega.tipo_brita === "19"
                              ? "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                              : "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10"
                          }
                        >
                          Brita {entrega.tipo_brita}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">
                        {Number(entrega.quantidade).toLocaleString("pt-BR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {entrega.unidade}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {entrega.unidade === "t"
                          ? (entrega.densidade ?? 1.5).toLocaleString("pt-BR")
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {Number(entrega.quantidade_m3).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 3,
                        })}{" "}
                        m³
                      </td>
                      <td className="py-2.5 px-3 text-foreground">
                        {entrega.fornecedor || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {entrega.documento || "—"}
                      </td>
                      <td
                        className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate"
                        title={entrega.observacao || ""}
                      >
                        {entrega.observacao || "—"}
                      </td>
                      {podeEditar && (
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="Editar entrega"
                              onClick={() => abrirModalEditarEntrega(entrega)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Excluir entrega"
                              onClick={() => setEntregaParaExcluir(entrega)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Lançar / Editar Compra Mensal Única */}
      <Dialog open={modalCompraAberta} onOpenChange={setModalCompraAberta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {compraMensal
                ? "Editar Compra Mensal de Britas"
                : "Lançar Compra Mensal de Britas"}
            </DialogTitle>
            <DialogDescription>
              Volume único para as britas 19 e 12 juntas no mês{" "}
              <strong>{formatarCompetenciaRotulo(competencia)}</strong> (
              <span className="font-mono">{competencia}</span>) na unidade{" "}
              <strong>{empresaAtiva?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarCompra} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="compraVolumeM3">
                Volume Comprado no Mês (m³ total) *
              </Label>
              <div className="relative">
                <Input
                  id="compraVolumeM3"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 450"
                  value={compraVolumeM3}
                  onChange={(e) => setCompraVolumeM3(e.target.value)}
                  className="font-mono text-base font-bold pr-12"
                  required
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  m³
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Informe o volume total contratado no mês para ambas as britas
                (ex.: 450 m³).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compraObservacao">Observações (opcional)</Label>
              <Input
                id="compraObservacao"
                placeholder="Ex: Contrato Pedreira São Bento / Pedido 1042"
                value={compraObservacao}
                onChange={(e) => setCompraObservacao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCompraAberta(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoCompra || !compraVolumeM3.trim()}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {salvandoCompra ? "Salvando..." : "Salvar Compra do Mês"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar ou Editar Entrega */}
      <Dialog
        open={modalEntregaAberta}
        onOpenChange={(aberto) => {
          setModalEntregaAberta(aberto)
          if (!aberto) {
            setEntregaEmEdicao(null)
            setDensidadeEditadaManualmente(false)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {entregaEmEdicao
                ? "Editar Entrega de Brita"
                : "Registrar Entrega de Brita"}
            </DialogTitle>
            <DialogDescription>
              {entregaEmEdicao
                ? "Altere os dados da carga recebida. O volume em m³ é recalculado automaticamente."
                : `Classifique o tipo (Brita 19 ou Brita 12) e informe a quantidade para o mês de ${formatarCompetenciaRotulo(competencia)}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarEntrega} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="entregaTipoBrita">Tipo de Brita *</Label>
                <Select
                  value={entregaTipoBrita}
                  onValueChange={(val: TipoBrita) =>
                    handleTrocarTipoBritaModal(val)
                  }
                >
                  <SelectTrigger id="entregaTipoBrita">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19">Brita 19 (Graúdo 19mm)</SelectItem>
                    <SelectItem value="12">Brita 12 (12,5mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entregaData">Data da Entrega *</Label>
                <Input
                  id="entregaData"
                  type="date"
                  value={entregaData}
                  onChange={(e) => setEntregaData(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Seletor de Unidade e Quantidade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="entregaUnidade">Unidade da Entrega *</Label>
                <Select
                  value={entregaUnidade}
                  onValueChange={(val: UnidadeBritaEntrega) =>
                    handleTrocarUnidadeModal(val)
                  }
                >
                  <SelectTrigger id="entregaUnidade">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m³">Metros cúbicos (m³)</SelectItem>
                    <SelectItem value="t">Toneladas (t)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entregaQuantidade">
                  Quantidade ({entregaUnidade}) *
                </Label>
                <Input
                  id="entregaQuantidade"
                  type="text"
                  inputMode="decimal"
                  placeholder={entregaUnidade === "m³" ? "Ex: 14" : "Ex: 21"}
                  value={entregaQuantidade}
                  onChange={(e) => setEntregaQuantidade(e.target.value)}
                  className="font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Se unidade for Toneladas (t), campo Densidade pré-preenchido conforme tipo de brita */}
            {entregaUnidade === "t" && (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="entregaDensidade"
                    className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Densidade da Brita {entregaTipoBrita} (t/m³) * Obrigatório
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono font-semibold">
                    Padrão Brita {entregaTipoBrita}:{" "}
                    {DENSIDADE_PADRAO[entregaTipoBrita].replace(".", ",")}
                  </span>
                </div>
                <Input
                  id="entregaDensidade"
                  type="text"
                  inputMode="decimal"
                  placeholder={DENSIDADE_PADRAO[entregaTipoBrita]}
                  value={entregaDensidade}
                  onChange={(e) => {
                    setEntregaDensidade(e.target.value)
                    setDensidadeEditadaManualmente(true)
                  }}
                  className="bg-background font-mono font-bold text-xs"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Fórmula de conversão: Volume (m³) = Quantidade (t) ÷
                    Densidade
                  </span>
                  {densidadeEditadaManualmente && (
                    <button
                      type="button"
                      onClick={() => {
                        setEntregaDensidade(DENSIDADE_PADRAO[entregaTipoBrita])
                        setDensidadeEditadaManualmente(false)
                      }}
                      className="text-primary hover:underline text-[10px] font-semibold"
                    >
                      Restaurar padrão (
                      {DENSIDADE_PADRAO[entregaTipoBrita].replace(".", ",")})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Painel de Conversão Ao Vivo Antes de Salvar */}
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  Conversão em Tempo Real
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {calculoConversaoAoVivo.formula ||
                    "Informe a quantidade acima"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-muted-foreground block">
                  VOLUME FINAL
                </span>
                <span className="text-xl font-extrabold font-mono text-primary block">
                  {calculoConversaoAoVivo.qtdM3 > 0
                    ? `${calculoConversaoAoVivo.qtdM3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      })} m³`
                    : "0,00 m³"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="entregaFornecedor">Fornecedor / Pedreira</Label>
                <Input
                  id="entregaFornecedor"
                  placeholder="Ex: Pedreira Sertão..."
                  value={entregaFornecedor}
                  onChange={(e) => setEntregaFornecedor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entregaDocumento">
                  Nº Documento / Romaneio
                </Label>
                <Input
                  id="entregaDocumento"
                  placeholder="Ex: NF 1284"
                  value={entregaDocumento}
                  onChange={(e) => setEntregaDocumento(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entregaObservacao">Observações (opcional)</Label>
              <Input
                id="entregaObservacao"
                placeholder="Ex: Placa da caçamba, umidade, motorista..."
                value={entregaObservacao}
                onChange={(e) => setEntregaObservacao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalEntregaAberta(false)
                  setEntregaEmEdicao(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  salvandoEntrega ||
                  !entregaQuantidade.trim() ||
                  calculoConversaoAoVivo.qtdM3 <= 0
                }
                className="bg-primary text-primary-foreground font-semibold"
              >
                {salvandoEntrega
                  ? "Salvando..."
                  : entregaEmEdicao
                    ? "Salvar Alterações"
                    : "Registrar Entrega"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação para Replicar Compra para o Próximo Mês */}
      <AlertDialog
        open={confirmarReplicarAberto}
        onOpenChange={setConfirmarReplicarAberto}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Copy className="w-5 h-5 text-emerald-600" />
              Replicar Compra para o Próximo Mês
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Deseja copiar o volume de compra do mês atual (
              <strong>{formatarCompetenciaRotulo(competencia)}</strong>) para a
              competência seguinte (
              <strong className="text-foreground">
                {formatarCompetenciaRotulo(proximaCompetencia)}
              </strong>
              )?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-3 rounded-lg border border-border/40 bg-muted/30 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="font-sans text-muted-foreground">Unidade:</span>
              <span className="font-bold font-sans">{empresaAtiva?.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-muted-foreground">
                Mês Origem:
              </span>
              <span>{formatarCompetenciaRotulo(competencia)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-muted-foreground">
                Mês Destino:
              </span>
              <span className="text-primary font-bold">
                {formatarCompetenciaRotulo(proximaCompetencia)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border/30">
              <span className="font-sans text-xs text-muted-foreground self-center">
                Volume Contratado:
              </span>
              <span>{resumo.compraTotalM3.toLocaleString("pt-BR")} m³</span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={replicandoCompra}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={replicandoCompra}
              onClick={handleConfirmarReplicacao}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {replicandoCompra ? "Replicando..." : "Sim, Replicar Compra"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de Confirmação para Excluir Entrega */}
      <AlertDialog
        open={Boolean(entregaParaExcluir)}
        onOpenChange={(aberto) => !aberto && setEntregaParaExcluir(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Excluir Registro de Entrega
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja remover esta entrega do controle do mês?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {entregaParaExcluir && (
            <div className="p-3 rounded-lg border border-border/40 bg-muted/30 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">Insumo:</span>
                <span className="font-bold">
                  Brita {entregaParaExcluir.tipo_brita}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">Data:</span>
                <span>
                  {entregaParaExcluir.data.split("-").reverse().join("/")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">
                  Informado:
                </span>
                <span>
                  {Number(entregaParaExcluir.quantidade).toLocaleString(
                    "pt-BR",
                  )}{" "}
                  {entregaParaExcluir.unidade}
                </span>
              </div>
              <div className="flex justify-between font-bold text-destructive">
                <span className="font-sans text-muted-foreground">
                  Volume m³:
                </span>
                <span>
                  {Number(entregaParaExcluir.quantidade_m3).toLocaleString(
                    "pt-BR",
                  )}{" "}
                  m³
                </span>
              </div>
              {entregaParaExcluir.documento && (
                <div className="flex justify-between">
                  <span className="font-sans text-muted-foreground">
                    Documento:
                  </span>
                  <span>{entregaParaExcluir.documento}</span>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoEntrega}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindoEntrega}
              onClick={handleConfirmarExclusao}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {excluindoEntrega ? "Excluindo..." : "Sim, Excluir Entrega"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
