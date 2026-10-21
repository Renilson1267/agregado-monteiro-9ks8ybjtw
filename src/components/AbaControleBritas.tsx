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
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Scale,
  Calendar,
  Building2,
  FileText,
  Calculator,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { BritasService } from "@/services/britas"
import type {
  ControleBritaCompra,
  ControleBritaEntrega,
  TipoBrita,
  UnidadeBritaEntrega,
  ResumoBritaItem,
} from "@/types/britas"
import type { Empresa } from "@/types/concreteira"

interface AbaControleBritasProps {
  empresaAtiva: Empresa | null
  podeEditar?: boolean
}

function getCompetenciaAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, "0")
  return `${ano}-${mes}`
}

export function AbaControleBritas({
  empresaAtiva,
  podeEditar = true,
}: AbaControleBritasProps) {
  const [competencia, setCompetencia] = useState<string>(getCompetenciaAtual)
  const [compras, setCompras] = useState<ControleBritaCompra[]>([])
  const [entregas, setEntregas] = useState<ControleBritaEntrega[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filtroTipoBrita, setFiltroTipoBrita] = useState<"ALL" | TipoBrita>(
    "ALL",
  )

  // Modal Lançar Compra Mensal
  const [modalCompraAberta, setModalCompraAberta] = useState(false)
  const [salvandoCompra, setSalvandoCompra] = useState(false)
  const [compraTipoBrita, setCompraTipoBrita] = useState<TipoBrita>("19")
  const [compraVolumeM3, setCompraVolumeM3] = useState<string>("")
  const [compraObservacao, setCompraObservacao] = useState<string>("")

  // Modal Registrar Entrega
  const [modalEntregaAberta, setModalEntregaAberta] = useState(false)
  const [salvandoEntrega, setSalvandoEntrega] = useState(false)
  const [entregaTipoBrita, setEntregaTipoBrita] = useState<TipoBrita>("19")
  const [entregaData, setEntregaData] = useState<string>(
    new Date().toISOString().split("T")[0],
  )
  const [entregaQuantidade, setEntregaQuantidade] = useState<string>("")
  const [entregaUnidade, setEntregaUnidade] =
    useState<UnidadeBritaEntrega>("m³")
  const [entregaDensidade, setEntregaDensidade] = useState<string>("1.5")
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
      const [comprasRes, entregasRes] = await Promise.all([
        BritasService.getComprasCompetencia(empresaAtiva.id, competencia),
        BritasService.getEntregasCompetencia(empresaAtiva.id, competencia),
      ])
      setCompras(comprasRes)
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

  // Cálculo da conversão ao vivo para o modal de entrega
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

  // Resumos Brita 19 e Brita 12
  const resumoBritas: Record<TipoBrita, ResumoBritaItem> = useMemo(() => {
    const tipos: TipoBrita[] = ["19", "12"]
    const resultado: any = {}

    tipos.forEach((tipo) => {
      const compraItem = compras.find((c) => c.tipo_brita === tipo)
      const compraM3 = compraItem ? Number(compraItem.volume_m3) || 0 : 0

      const entregasDoTipo = entregas.filter((e) => e.tipo_brita === tipo)
      const totalEntregueM3 = entregasDoTipo.reduce(
        (acc, cur) => acc + (Number(cur.quantidade_m3) || 0),
        0,
      )

      const saldoAReceberM3 = Number((compraM3 - totalEntregueM3).toFixed(3))
      const entregasExcedentes = totalEntregueM3 > compraM3

      resultado[tipo] = {
        tipo,
        nome: tipo === "19" ? "Brita 19" : "Brita 12",
        compraM3,
        totalEntregueM3: Number(totalEntregueM3.toFixed(3)),
        saldoAReceberM3,
        entregasExcedentes,
        totalEntregasQtd: entregasDoTipo.length,
      }
    })

    return resultado
  }, [compras, entregas])

  // Abrir modal de compra pré-preenchendo valor se já existir
  const abrirModalCompra = (tipo: TipoBrita) => {
    setCompraTipoBrita(tipo)
    const compraExistente = compras.find((c) => c.tipo_brita === tipo)
    if (compraExistente) {
      setCompraVolumeM3(String(compraExistente.volume_m3))
      setCompraObservacao(compraExistente.observacao || "")
    } else {
      setCompraVolumeM3("")
      setCompraObservacao("")
    }
    setModalCompraAberta(true)
  }

  // Salvar compra mensal
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
        tipo_brita: compraTipoBrita,
        competencia,
        volume_m3: vol,
        observacao: compraObservacao,
      })

      toast({
        title: "Compra mensal atualizada",
        description: `Brita ${compraTipoBrita}: ${vol.toLocaleString("pt-BR")} m³ para o mês ${competencia}.`,
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

  // Abrir modal de entrega
  const abrirModalEntrega = (tipo?: TipoBrita) => {
    if (tipo) setEntregaTipoBrita(tipo)
    setEntregaQuantidade("")
    setEntregaUnidade("m³")
    setEntregaDensidade("1.5")
    setEntregaFornecedor("")
    setEntregaDocumento("")
    setEntregaObservacao("")
    setEntregaData(new Date().toISOString().split("T")[0])
    setModalEntregaAberta(true)
  }

  // Salvar entrega
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
        description: `Brita ${entregaTipoBrita}: ${calculoConversaoAoVivo.qtdM3.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m³ adicionados ao controle.`,
      })
      setModalEntregaAberta(false)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao registrar entrega",
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
              className="border-primary/40 text-primary text-xs"
            >
              Fora do estoque normal
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe o volume mensal comprado, as entregas recebidas do
            fornecedor (em m³ ou toneladas com conversão por densidade) e o
            saldo a receber.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Seletor de Competência */}
          <div className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg px-2.5 py-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <Label htmlFor="competencia-britas" className="text-xs font-medium">
              Mês:
            </Label>
            <Input
              id="competencia-britas"
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="h-7 w-36 text-xs font-mono font-semibold border-none shadow-none focus-visible:ring-0 p-0"
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
              onClick={() => abrirModalEntrega()}
              className="h-8 gap-1 text-xs bg-primary text-primary-foreground font-semibold"
            >
              <Truck className="w-3.5 h-3.5" />
              Registrar Entrega
            </Button>
          )}
        </div>
      </div>

      {/* Dois Cartões Principais: Brita 19 e Brita 12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(["19", "12"] as TipoBrita[]).map((tipo) => {
          const resumo = resumoBritas[tipo]
          const isExcedente = resumo.entregasExcedentes
          const progressoPercent =
            resumo.compraM3 > 0
              ? Math.min(
                  100,
                  Math.round((resumo.totalEntregueM3 / resumo.compraM3) * 100),
                )
              : 0

          return (
            <Card
              key={tipo}
              className={`border relative overflow-hidden shadow-sm transition-all ${
                isExcedente
                  ? "border-destructive/60 bg-destructive/5"
                  : "border-border/60 bg-card/80"
              }`}
            >
              {/* Barra superior de status: Vermelha se excedente, azul/verde se regular */}
              <div
                className={`h-2 w-full ${
                  isExcedente
                    ? "bg-destructive animate-pulse"
                    : resumo.saldoAReceberM3 === 0 && resumo.compraM3 > 0
                      ? "bg-emerald-500"
                      : "bg-primary"
                }`}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                        <span>{resumo.nome}</span>
                      </CardTitle>
                      <Badge
                        variant={isExcedente ? "destructive" : "secondary"}
                        className="text-xs font-mono"
                      >
                        {tipo === "19"
                          ? "Agregado Graúdo 19mm"
                          : "Agregado 12,5mm"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Competência:{" "}
                      <strong className="text-foreground">{competencia}</strong>
                    </CardDescription>
                  </div>

                  {podeEditar && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalCompra(tipo)}
                        className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        title="Definir compra mensal contratada"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Lançar Compra
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => abrirModalEntrega(tipo)}
                        className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                        title={`Registrar entrega de ${resumo.nome}`}
                      >
                        <PlusCircle className="w-3 h-3" />
                        Entrega
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Alerta Vermelho se Entrega > Compra */}
                {isExcedente && (
                  <div className="p-3 rounded-lg border border-destructive bg-destructive/15 text-destructive flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold">
                        ALERTA: Entregas excederam o volume comprado no mês!
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Foram entregues{" "}
                        <strong>
                          {resumo.totalEntregueM3.toLocaleString("pt-BR")} m³
                        </strong>{" "}
                        para uma compra de{" "}
                        <strong>
                          {resumo.compraM3.toLocaleString("pt-BR")} m³
                        </strong>{" "}
                        (excesso de{" "}
                        {Math.abs(resumo.saldoAReceberM3).toLocaleString(
                          "pt-BR",
                        )}{" "}
                        m³).
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid com os 3 Indicadores Obrigatórios */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border/40 text-center">
                  {/* COMPRA DO MÊS */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Compra do Mês
                    </span>
                    <span className="text-xl font-extrabold font-mono text-foreground block">
                      {resumo.compraM3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      m³ contratados
                    </span>
                  </div>

                  {/* TOTAL ENTREGUE */}
                  <div className="space-y-1 border-x border-border/40 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Entregue
                    </span>
                    <span className="text-xl font-extrabold font-mono text-primary block">
                      {resumo.totalEntregueM3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      m³ recebidos ({resumo.totalEntregasQtd}x)
                    </span>
                  </div>

                  {/* SALDO A RECEBER */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Saldo a Receber
                    </span>
                    <span
                      className={`text-xl font-extrabold font-mono block ${
                        isExcedente
                          ? "text-destructive font-black"
                          : resumo.saldoAReceberM3 === 0 && resumo.compraM3 > 0
                            ? "text-emerald-500"
                            : "text-foreground"
                      }`}
                    >
                      {resumo.saldoAReceberM3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {isExcedente
                        ? "m³ excedentes"
                        : resumo.saldoAReceberM3 === 0 && resumo.compraM3 > 0
                          ? "100% entregue"
                          : "m³ pendentes"}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso da Entrega */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Atendimento da Compra:</span>
                    <span className="font-semibold text-foreground">
                      {resumo.compraM3 > 0
                        ? `${((resumo.totalEntregueM3 / resumo.compraM3) * 100).toFixed(1)}%`
                        : "Compra não lançada"}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isExcedente
                          ? "bg-destructive"
                          : resumo.totalEntregueM3 >= resumo.compraM3 &&
                              resumo.compraM3 > 0
                            ? "bg-emerald-500"
                            : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, progressoPercent)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Histórico das Entregas do Mês com Excluir */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Histórico das Entregas do Mês ({competencia})
            </CardTitle>
            <CardDescription className="text-xs">
              Registros individuais de cargas recebidas de Brita 19 e Brita 12
              com conversão automática para m³
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
              <p>Nenhuma entrega registrada para o mês {competencia}.</p>
              {podeEditar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirModalEntrega()}
                  className="gap-1.5 text-xs text-primary"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Registrar Primeira Entrega
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
                      <th className="py-2.5 px-3 text-center w-16">Ações</th>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Excluir entrega"
                            onClick={() => setEntregaParaExcluir(entrega)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Modal Lançar Compra Mensal */}
      <Dialog open={modalCompraAberta} onOpenChange={setModalCompraAberta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Lançar Compra Mensal de Brita
            </DialogTitle>
            <DialogDescription>
              Informe o volume total contratado em m³ para a competência{" "}
              <strong>{competencia}</strong> na unidade{" "}
              <strong>{empresaAtiva?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarCompra} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="compraTipoBrita">Tipo de Brita *</Label>
              <Select
                value={compraTipoBrita}
                onValueChange={(val: any) => setCompraTipoBrita(val)}
              >
                <SelectTrigger id="compraTipoBrita">
                  <SelectValue placeholder="Selecione a brita" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="19">Brita 19 (Graúdo 19mm)</SelectItem>
                  <SelectItem value="12">Brita 12 (12,5mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compraVolumeM3">
                Volume Comprado no Mês (m³) *
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
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  m³
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ex.: 450 m³. Este volume servirá de meta para as entregas do
                mês.
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
                {salvandoCompra ? "Salvando..." : "Salvar Compra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Entrega */}
      <Dialog open={modalEntregaAberta} onOpenChange={setModalEntregaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Registrar Entrega de Brita
            </DialogTitle>
            <DialogDescription>
              Lance a carga recebida com conversão em tempo real de m³ ou
              toneladas (t).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarEntrega} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="entregaTipoBrita">Tipo de Brita *</Label>
                <Select
                  value={entregaTipoBrita}
                  onValueChange={(val: any) => setEntregaTipoBrita(val)}
                >
                  <SelectTrigger id="entregaTipoBrita">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19">Brita 19</SelectItem>
                    <SelectItem value="12">Brita 12</SelectItem>
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
                    setEntregaUnidade(val)
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

            {/* Se unidade for Toneladas (t), campo Densidade OBRIGATÓRIO (sugerido 1,5) */}
            {entregaUnidade === "t" && (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="entregaDensidade"
                    className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Densidade da Brita (t/m³) * Obrigatório
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Sugerido: 1,5
                  </span>
                </div>
                <Input
                  id="entregaDensidade"
                  type="text"
                  inputMode="decimal"
                  placeholder="1.5"
                  value={entregaDensidade}
                  onChange={(e) => setEntregaDensidade(e.target.value)}
                  className="bg-background font-mono font-bold text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Fórmula de conversão: Volume (m³) = Quantidade (t) ÷ Densidade
                </p>
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
                onClick={() => setModalEntregaAberta(false)}
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
                {salvandoEntrega ? "Registrando..." : "Registrar Entrega"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
