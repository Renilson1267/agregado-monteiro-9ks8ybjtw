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
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  FilterX,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { BritasService } from "@/services/britas"
import type {
  ControleBritaCompra,
  ControleBritaEntrega,
  ControleBritaCheque,
  SaldoCompetenciaAnterior,
  TipoBrita,
  UnidadeBritaEntrega,
  ResumoControleBritasMes,
} from "@/types/britas"
import type { Empresa } from "@/types/concreteira"
import { ImpressaoControleBritas } from "@/components/ImpressaoControleBritas"

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

function formatarMoeda(val: number): string {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function AbaControleBritas({
  empresaAtiva,
  podeEditar = true,
}: AbaControleBritasProps) {
  const [competencia, setCompetencia] = useState<string>(getCompetenciaAtual)
  const anoCompetenciaAtual = useMemo(() => {
    return Number(competencia.substring(0, 4)) || new Date().getFullYear()
  }, [competencia])

  // Seletor de ANO: lista de anos com registros + ano corrente
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([
    new Date().getFullYear(),
  ])
  const [anoSelecionado, setAnoSelecionado] =
    useState<number>(anoCompetenciaAtual)

  // Quando o ano selecionado for diferente do ano da competência navegada,
  // ou quando o usuário optar por visão de ano completo
  const modoVisaoAnoCompleto = anoSelecionado !== anoCompetenciaAtual

  const [compras, setCompras] = useState<ControleBritaCompra[]>([])
  const [entregas, setEntregas] = useState<ControleBritaEntrega[]>([])
  const [cheques, setCheques] = useState<ControleBritaCheque[]>([])
  const [saldoAnterior, setSaldoAnterior] =
    useState<SaldoCompetenciaAnterior | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Dados acumulados quando em visão ANO COMPLETO
  const [comprasAno, setComprasAno] = useState<ControleBritaCompra[]>([])
  const [entregasAno, setEntregasAno] = useState<ControleBritaEntrega[]>([])

  // Filtros das entregas (funcionam tanto no mês quanto no ano completo)
  const [filtroTipoBrita, setFiltroTipoBrita] = useState<"ALL" | TipoBrita>(
    "ALL",
  )
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>("")
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("")
  const [filtroDataFim, setFiltroDataFim] = useState<string>("")

  // Modal Lançar / Editar Compra da Competência
  const [modalCompraAberta, setModalCompraAberta] = useState(false)
  const [compraEmEdicao, setCompraEmEdicao] =
    useState<ControleBritaCompra | null>(null)
  const [salvandoCompra, setSalvandoCompra] = useState(false)
  const [compraData, setCompraData] = useState<string>("")
  const [compraVolumeM3, setCompraVolumeM3] = useState<string>("")
  const [compraFornecedor, setCompraFornecedor] = useState<string>("")
  const [compraObservacao, setCompraObservacao] = useState<string>("")

  // Dialog Excluir Compra
  const [compraParaExcluir, setCompraParaExcluir] =
    useState<ControleBritaCompra | null>(null)
  const [excluindoCompra, setExcluindoCompra] = useState(false)

  // Drawer / Seção / Modal de Cheques vinculados à Compra
  const [compraSelecionadaCheques, setCompraSelecionadaCheques] =
    useState<ControleBritaCompra | null>(null)

  // Diálogo para Replicar Compras para o Próximo Mês
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
  const [densidadeEditadaManualmente, setDensidadeEditadaManualmente] =
    useState<boolean>(false)
  const [entregaFornecedor, setEntregaFornecedor] = useState<string>("")
  const [entregaDocumento, setEntregaDocumento] = useState<string>("")
  const [entregaObservacao, setEntregaObservacao] = useState<string>("")

  // Dialog Excluir Entrega
  const [entregaParaExcluir, setEntregaParaExcluir] =
    useState<ControleBritaEntrega | null>(null)
  const [excluindoEntrega, setExcluindoEntrega] = useState(false)

  // Modal e Ações de Cheques
  const [modalChequeAberta, setModalChequeAberta] = useState(false)
  const [chequeEmEdicao, setChequeEmEdicao] =
    useState<ControleBritaCheque | null>(null)
  const [salvandoCheque, setSalvandoCheque] = useState(false)
  const [chequeValor, setChequeValor] = useState<string>("")
  const [chequeDataVencimento, setChequeDataVencimento] = useState<string>("")
  const [chequeNumero, setChequeNumero] = useState<string>("")
  const [chequeObservacao, setChequeObservacao] = useState<string>("")
  const [chequePago, setChequePago] = useState<boolean>(false)

  // Dialog Excluir Cheque
  const [chequeParaExcluir, setChequeParaExcluir] =
    useState<ControleBritaCheque | null>(null)
  const [excluindoCheque, setExcluindoCheque] = useState(false)

  // Carregar lista de anos disponíveis (registros + ano corrente)
  const carregarAnos = useCallback(async () => {
    if (!empresaAtiva?.id) return
    try {
      const lista = await BritasService.getAnosDisponiveis(empresaAtiva.id)
      setAnosDisponiveis(lista)
    } catch (err) {
      console.error("Erro ao carregar anos disponíveis:", err)
    }
  }, [empresaAtiva?.id])

  useEffect(() => {
    carregarAnos()
  }, [carregarAnos])

  const carregarDados = async () => {
    if (!empresaAtiva?.id) return
    setLoading(true)
    try {
      if (modoVisaoAnoCompleto) {
        // Carrega todas as compras e entregas do ano selecionado
        const [comprasAnoRes, entregasAnoRes, anosRes] = await Promise.all([
          BritasService.getComprasAno(empresaAtiva.id, anoSelecionado),
          BritasService.getEntregasAno(empresaAtiva.id, anoSelecionado),
          BritasService.getAnosDisponiveis(empresaAtiva.id),
        ])
        setComprasAno(comprasAnoRes)
        setEntregasAno(entregasAnoRes)
        setAnosDisponiveis(anosRes)
      } else {
        // Visão do mês normal
        const [comprasRes, entregasRes, saldoAntRes, chequesRes, anosRes] =
          await Promise.all([
            BritasService.getComprasCompetencia(empresaAtiva.id, competencia),
            BritasService.getEntregasCompetencia(empresaAtiva.id, competencia),
            BritasService.getSaldoCompetenciaAnterior(
              empresaAtiva.id,
              competencia,
            ),
            BritasService.getChequesCompetencia(empresaAtiva.id, competencia),
            BritasService.getAnosDisponiveis(empresaAtiva.id),
          ])
        setCompras(comprasRes)
        setEntregas(entregasRes)
        setSaldoAnterior(saldoAntRes)
        setCheques(chequesRes)
        setAnosDisponiveis(anosRes)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erro ao carregar controle de britas",
        description: err.message || "Falha ao buscar registros.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id, competencia, modoVisaoAnoCompleto, anoSelecionado])

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

  // Lista de entregas ativas para visualização:
  // Se modoVisaoAnoCompleto, usa entregasAno; senão usa entregas do mês
  const entregasAtivas = useMemo(() => {
    return modoVisaoAnoCompleto ? entregasAno : entregas
  }, [modoVisaoAnoCompleto, entregasAno, entregas])

  // Resumo Geral: Compra do Mês/Ano, Repasse Anterior, Entregas Brita 19, Brita 12, Total Geral e Saldo a Receber
  // Quando em ANO COMPLETO: soma compras de todas as competências do ano e entregas do ano
  const resumo: ResumoControleBritasMes = useMemo(() => {
    if (modoVisaoAnoCompleto) {
      const compraTotalM3 = comprasAno.reduce(
        (acc, c) => acc + (Number(c.volume_m3) || 0),
        0,
      )
      const saldoRepasseM3 = 0 // Na visão ano, as compras somam todas as competências
      const totalDisponivelM3 = compraTotalM3

      const entregas19 = entregasAno.filter((e) => e.tipo_brita === "19")
      const entregas12 = entregasAno.filter((e) => e.tipo_brita === "12")

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
        (totalDisponivelM3 - totalEntregueGeralM3).toFixed(3),
      )
      const entregasExcedentes = totalEntregueGeralM3 > totalDisponivelM3

      return {
        compraTotalM3,
        saldoRepasseM3,
        totalDisponivelM3,
        totalEntregue19M3,
        totalEntregue12M3,
        totalEntregueGeralM3,
        saldoAReceberM3,
        entregasExcedentes,
        totalEntregasQtd: entregasAno.length,
        totalEntregas19Qtd: entregas19.length,
        totalEntregas12Qtd: entregas12.length,
      }
    }

    const compraTotalM3 = Number(
      compras
        .reduce((acc, c) => acc + (Number(c.volume_m3) || 0), 0)
        .toFixed(3),
    )
    const saldoRepasseM3 = saldoAnterior
      ? Number(saldoAnterior.saldoRepasseM3) || 0
      : 0
    const totalDisponivelM3 = Number(
      (compraTotalM3 + saldoRepasseM3).toFixed(3),
    )

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

    // Saldo a receber considerando o repasse
    const saldoAReceberM3 = Number(
      (totalDisponivelM3 - totalEntregueGeralM3).toFixed(3),
    )
    // Alerta vermelho: entregue geral supera o total disponível (compra + repasse)
    const entregasExcedentes = totalEntregueGeralM3 > totalDisponivelM3

    return {
      compraTotalM3,
      saldoRepasseM3,
      totalDisponivelM3,
      totalEntregue19M3,
      totalEntregue12M3,
      totalEntregueGeralM3,
      saldoAReceberM3,
      entregasExcedentes,
      totalEntregasQtd: entregas.length,
      totalEntregas19Qtd: entregas19.length,
      totalEntregas12Qtd: entregas12.length,
    }
  }, [
    modoVisaoAnoCompleto,
    comprasAno,
    entregasAno,
    compras,
    entregas,
    saldoAnterior,
  ])

  // Mapa de cheques indexados por compra_id (e cheques legados sem compra_id)
  const chequesPorCompraId = useMemo(() => {
    const map = new Map<string, ControleBritaCheque[]>()
    const semCompra: ControleBritaCheque[] = []
    cheques.forEach((chq) => {
      if (chq.compra_id) {
        const arr = map.get(chq.compra_id) || []
        arr.push(chq)
        map.set(chq.compra_id, arr)
      } else {
        semCompra.push(chq)
      }
    })
    return { map, semCompra }
  }, [cheques])

  // Totalizadores de cheques da competência
  const totaisCheques = useMemo(() => {
    const total = Number(
      cheques.reduce((acc, c) => acc + (Number(c.valor) || 0), 0).toFixed(2),
    )
    const pagos = Number(
      cheques
        .filter((c) => c.pago)
        .reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
        .toFixed(2),
    )
    const pendentes = Number(
      cheques
        .filter((c) => !c.pago)
        .reduce((acc, c) => acc + (Number(c.valor) || 0), 0)
        .toFixed(2),
    )
    return {
      total,
      pagos,
      pendentes,
      qtd: cheques.length,
      qtdPagos: cheques.filter((c) => c.pago).length,
    }
  }, [cheques])

  // Percentual atendido do total disponível
  const percentualAtendido = useMemo(() => {
    if (resumo.totalDisponivelM3 <= 0) return 0
    return Math.round(
      (resumo.totalEntregueGeralM3 / resumo.totalDisponivelM3) * 100,
    )
  }, [resumo.totalDisponivelM3, resumo.totalEntregueGeralM3])

  // Obter data padrão de compra dentro da competência navegada:
  // padrão = hoje se hoje pertencer à competência, senão 1º dia da competência navegada
  const obterDataPadraoParaCompetencia = (comp: string): string => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split("T")[0]
    if (hojeStr.startsWith(comp)) {
      return hojeStr
    }
    return `${comp}-01`
  }

  // Abrir modal de compra (criar nova)
  const abrirModalNovaCompra = () => {
    setCompraEmEdicao(null)
    setCompraData(obterDataPadraoParaCompetencia(competencia))
    setCompraVolumeM3("")
    setCompraFornecedor("")
    setCompraObservacao("")
    setModalCompraAberta(true)
  }

  // Abrir modal de compra (editar existente)
  const abrirModalEditarCompra = (compra: ControleBritaCompra) => {
    setCompraEmEdicao(compra)
    setCompraData(compra.data || obterDataPadraoParaCompetencia(competencia))
    setCompraVolumeM3(String(compra.volume_m3))
    setCompraFornecedor(compra.fornecedor || "")
    setCompraObservacao(compra.observacao || "")
    setModalCompraAberta(true)
  }

  // Salvar compra (criar ou editar)
  const handleSalvarCompra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva?.id) return

    const vol = Number(compraVolumeM3.replace(",", "."))
    if (isNaN(vol) || vol <= 0) {
      toast({
        title: "Volume inválido",
        description: "Informe um volume em m³ válido (maior que 0).",
        variant: "destructive",
      })
      return
    }

    const dataFinal = compraData || obterDataPadraoParaCompetencia(competencia)

    setSalvandoCompra(true)
    try {
      if (compraEmEdicao) {
        await BritasService.atualizarCompra({
          id: compraEmEdicao.id,
          competencia,
          data: dataFinal,
          volume_m3: vol,
          fornecedor: compraFornecedor,
          observacao: compraObservacao,
        })
        toast({
          title: "Compra atualizada",
          description: `Compra de ${vol.toLocaleString("pt-BR")} m³ atualizada com sucesso.`,
        })
      } else {
        await BritasService.criarCompra({
          empresa_id: empresaAtiva.id,
          competencia,
          data: dataFinal,
          volume_m3: vol,
          fornecedor: compraFornecedor,
          observacao: compraObservacao,
        })
        toast({
          title: "Compra lançada",
          description: `Compra de ${vol.toLocaleString("pt-BR")} m³ adicionada ao mês ${formatarCompetenciaRotulo(competencia)}.`,
        })
      }

      setModalCompraAberta(false)
      setCompraEmEdicao(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: compraEmEdicao
          ? "Erro ao atualizar compra"
          : "Erro ao lançar compra",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoCompra(false)
    }
  }

  // Excluir compra (com aviso se tiver cheques vinculados)
  const handleConfirmarExclusaoCompra = async () => {
    if (!compraParaExcluir) return
    setExcluindoCompra(true)
    try {
      await BritasService.excluirCompra(compraParaExcluir.id)
      toast({
        title: "Compra excluída",
        description:
          "A compra e eventuais cheques vinculados foram excluídos com sucesso.",
      })
      if (compraSelecionadaCheques?.id === compraParaExcluir.id) {
        setCompraSelecionadaCheques(null)
      }
      setCompraParaExcluir(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao excluir compra",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setExcluindoCompra(false)
    }
  }

  // Competência seguinte e anterior calculadas
  const proximaCompetencia = useMemo(
    () => somarMesesCompetencia(competencia, 1),
    [competencia],
  )
  const anteriorCompetencia = useMemo(
    () => somarMesesCompetencia(competencia, -1),
    [competencia],
  )

  const irMesAnterior = () => {
    setCompetencia(anteriorCompetencia)
  }

  const irProximoMes = () => {
    setCompetencia(proximaCompetencia)
  }

  // Replicar compras da competência atual para a próxima
  const handleConfirmarReplicacao = async () => {
    if (!empresaAtiva?.id) return
    if (compras.length === 0) {
      toast({
        title: "Nenhuma compra para replicar",
        description: `Cadastre primeiro uma compra em ${formatarCompetenciaRotulo(competencia)}.`,
        variant: "destructive",
      })
      setConfirmarReplicarAberto(false)
      return
    }

    setReplicandoCompra(true)
    try {
      // Cria as compras na próxima competência com data no 1º dia da próxima competência
      const proximaData = `${proximaCompetencia}-01`
      for (const c of compras) {
        await BritasService.criarCompra({
          empresa_id: empresaAtiva.id,
          competencia: proximaCompetencia,
          data: proximaData,
          volume_m3: Number(c.volume_m3) || 0,
          fornecedor: c.fornecedor || null,
          observacao: c.observacao
            ? `Replicado de ${formatarCompetenciaRotulo(competencia)}: ${c.observacao}`
            : `Replicado de ${formatarCompetenciaRotulo(competencia)}`,
        })
      }

      toast({
        title: "Compras replicadas com sucesso",
        description: `${compras.length} compra(s) copiada(s) para ${formatarCompetenciaRotulo(proximaCompetencia)}. Avançando para o mês...`,
      })

      setConfirmarReplicarAberto(false)
      setCompetencia(proximaCompetencia)
    } catch (err: any) {
      toast({
        title: "Erro ao replicar compras",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setReplicandoCompra(false)
    }
  }

  // Troca de tipo de brita no modal
  const handleTrocarTipoBritaModal = (novoTipo: TipoBrita) => {
    setEntregaTipoBrita(novoTipo)
    if (entregaUnidade === "t" && !densidadeEditadaManualmente) {
      setEntregaDensidade(DENSIDADE_PADRAO[novoTipo])
    }
  }

  // Troca de unidade no modal
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
            "Para entregas em toneladas (t), informe a densidade (Brita 12: 1,38; Brita 19: 1,40).",
          variant: "destructive",
        })
        return
      }
    }

    setSalvandoEntrega(true)
    try {
      if (entregaEmEdicao) {
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

  /* =========================================================================
     AÇÕES DE CHEQUES DA COMPRA
     ========================================================================= */

  const abrirModalNovoCheque = (compra?: ControleBritaCompra) => {
    const alvoCompra = compra || compraSelecionadaCheques || null
    setChequeEmEdicao(null)
    setChequeValor("")
    // Se a compra tem data, sugerir a data da compra ou padrão do mês
    setChequeDataVencimento(
      alvoCompra?.data || obterDataPadraoParaCompetencia(competencia),
    )
    setChequeNumero("")
    setChequeObservacao("")
    setChequePago(false)
    if (alvoCompra) {
      setCompraSelecionadaCheques(alvoCompra)
    }
    setModalChequeAberta(true)
  }

  const abrirModalEditarCheque = (chq: ControleBritaCheque) => {
    setChequeEmEdicao(chq)
    if (chq.compra_id) {
      const c = compras.find((x) => x.id === chq.compra_id) || null
      setCompraSelecionadaCheques(c)
    }
    setChequeValor(String(chq.valor))
    setChequeDataVencimento(chq.data_vencimento || "")
    setChequeNumero(chq.numero || "")
    setChequeObservacao(chq.observacao || "")
    setChequePago(Boolean(chq.pago))
    setModalChequeAberta(true)
  }

  const handleSalvarCheque = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva?.id) return

    const val = Number(chequeValor.replace(",", "."))
    if (isNaN(val) || val <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor positivo para o cheque.",
        variant: "destructive",
      })
      return
    }

    setSalvandoCheque(true)
    try {
      if (chequeEmEdicao) {
        await BritasService.atualizarCheque({
          id: chequeEmEdicao.id,
          compra_id: compraSelecionadaCheques?.id || null,
          valor: val,
          data_vencimento: chequeDataVencimento || null,
          numero: chequeNumero,
          observacao: chequeObservacao,
          pago: chequePago,
        })
        toast({
          title: "Cheque atualizado",
          description: `Cheque ${
            chequeNumero ? `Nº ${chequeNumero}` : ""
          } de ${formatarMoeda(val)} atualizado.`,
        })
      } else {
        await BritasService.criarCheque({
          empresa_id: empresaAtiva.id,
          competencia,
          compra_id: compraSelecionadaCheques?.id || null,
          valor: val,
          data_vencimento: chequeDataVencimento || null,
          numero: chequeNumero,
          observacao: chequeObservacao,
          pago: chequePago,
        })
        toast({
          title: "Cheque lançado",
          description: `Cheque ${
            chequeNumero ? `Nº ${chequeNumero}` : ""
          } de ${formatarMoeda(val)} registrado para a compra${
            compraSelecionadaCheques
              ? ` (${compraSelecionadaCheques.volume_m3} m³)`
              : ""
          }.`,
        })
      }

      setModalChequeAberta(false)
      setChequeEmEdicao(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar cheque",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoCheque(false)
    }
  }

  const handleAlternarPagoCheque = async (chq: ControleBritaCheque) => {
    try {
      const novoStatus = !chq.pago
      await BritasService.alternarPagoCheque(chq.id, novoStatus)
      toast({
        title: novoStatus
          ? "Cheque marcado como PAGO"
          : "Cheque marcado como PENDENTE",
        description: `Cheque ${
          chq.numero ? `Nº ${chq.numero}` : ""
        } de ${formatarMoeda(Number(chq.valor) || 0)} atualizado.`,
      })
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao alterar status do cheque",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleConfirmarExclusaoCheque = async () => {
    if (!chequeParaExcluir) return
    setExcluindoCheque(true)
    try {
      await BritasService.excluirCheque(chequeParaExcluir.id)
      toast({
        title: "Cheque excluído",
        description: "O cheque foi removido do controle da compra.",
      })
      setChequeParaExcluir(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao excluir cheque",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setExcluindoCheque(false)
    }
  }

  // Filtragem no histórico de entregas (mês ou ano completo)
  const entregasFiltradas = useMemo(() => {
    return entregasAtivas.filter((e) => {
      // Filtro tipo de brita
      if (filtroTipoBrita !== "ALL" && e.tipo_brita !== filtroTipoBrita) {
        return false
      }
      // Filtro fornecedor (texto parcial case-insensitive)
      if (filtroFornecedor.trim()) {
        const termo = filtroFornecedor.trim().toLowerCase()
        const fornec = (e.fornecedor || "").toLowerCase()
        if (!fornec.includes(termo)) return false
      }
      // Filtro período inicial
      if (filtroDataInicio && e.data < filtroDataInicio) {
        return false
      }
      // Filtro período final
      if (filtroDataFim && e.data > filtroDataFim) {
        return false
      }
      return true
    })
  }, [
    entregasAtivas,
    filtroTipoBrita,
    filtroFornecedor,
    filtroDataInicio,
    filtroDataFim,
  ])

  const totalVolumeEntregasFiltradas = useMemo(() => {
    return Number(
      entregasFiltradas
        .reduce((acc, cur) => acc + (Number(cur.quantidade_m3) || 0), 0)
        .toFixed(3),
    )
  }, [entregasFiltradas])

  const limparFiltros = () => {
    setFiltroTipoBrita("ALL")
    setFiltroFornecedor("")
    setFiltroDataInicio("")
    setFiltroDataFim("")
  }

  const temFiltroAtivo =
    filtroTipoBrita !== "ALL" ||
    Boolean(filtroFornecedor.trim()) ||
    Boolean(filtroDataInicio) ||
    Boolean(filtroDataFim)

  // Disparo da impressão A4 via window.print
  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          COMPONENTE EXCLUSIVO PARA IMPRESSÃO A4 (visível apenas em window.print)
      ========================================================================== */}
      <ImpressaoControleBritas
        empresaAtiva={empresaAtiva}
        competencia={competencia}
        rotuloCompetencia={formatarCompetenciaRotulo(competencia)}
        compras={modoVisaoAnoCompleto ? comprasAno : compras}
        resumo={resumo}
        entregas={entregasFiltradas}
        cheques={cheques}
        chequesPorCompraId={chequesPorCompraId.map}
        chequesSemCompra={chequesPorCompraId.semCompra}
        totalCheques={totaisCheques.total}
        totalChequesPagos={totaisCheques.pagos}
        totalChequesPendentes={totaisCheques.pendentes}
        filtroTipoBrita={filtroTipoBrita}
        filtroFornecedor={filtroFornecedor}
        filtroDataInicio={filtroDataInicio}
        filtroDataFim={filtroDataFim}
        modoVisao={modoVisaoAnoCompleto ? "ano" : "mes"}
        anoSelecionado={anoSelecionado}
      />

      {/* =========================================================================
          INTERFACE EM TELA (no-print)
      ========================================================================== */}
      {/* Barra Superior: Título, Competência, Ações Rápidas */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Controle de Britas (Brita 19 &amp; Brita 12)
            </h2>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-xs font-semibold"
            >
              Compras &amp; Cheques
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lançamento de <strong>compras do mês</strong> (mais de uma compra no
            mês, pagamentos à vista ou em cheques pré-datados). Na entrega
            individual, classifica-se Brita 19 ou Brita 12 (com conversão m³ /
            t).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Seletor de ANO: lista os anos com registros + ano corrente */}
          <div className="flex items-center bg-background border border-border/60 rounded-lg px-2 py-1 shadow-xs gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-semibold text-muted-foreground">
              Ano:
            </span>
            <Select
              value={String(anoSelecionado)}
              onValueChange={(val) => {
                const anoNum = Number(val)
                setAnoSelecionado(anoNum)
              }}
            >
              <SelectTrigger className="h-6 border-none bg-transparent text-xs font-bold font-mono focus:ring-0 p-0 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map((a) => (
                  <SelectItem
                    key={a}
                    value={String(a)}
                    className="font-mono text-xs"
                  >
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modoVisaoAnoCompleto && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono text-[9px] px-1 py-0 uppercase">
                Ano Completo
              </Badge>
            )}
          </div>

          {/* Seletor de Competência com Navegação ‹ anterior / › próximo */}
          <div
            className={`flex items-center bg-background border rounded-lg shadow-xs p-0.5 ${
              modoVisaoAnoCompleto
                ? "border-amber-500/50 bg-amber-500/5 opacity-80"
                : "border-border/60"
            }`}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                irMesAnterior()
                setAnoSelecionado(Number(anteriorCompetencia.substring(0, 4)))
              }}
              title={`Mês anterior (${formatarCompetenciaRotulo(anteriorCompetencia)})`}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <div className="flex flex-col items-center">
                <span className="text-xs font-extrabold tracking-wider font-mono uppercase text-foreground whitespace-nowrap">
                  {formatarCompetenciaRotulo(competencia)}
                </span>
                <input
                  type="month"
                  value={competencia}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCompetencia(e.target.value)
                      setAnoSelecionado(Number(e.target.value.substring(0, 4)))
                    }
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
              onClick={() => {
                irProximoMes()
                setAnoSelecionado(Number(proximaCompetencia.substring(0, 4)))
              }}
              title={`Próximo mês (${formatarCompetenciaRotulo(proximaCompetencia)})`}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Botão para retornar ao mês navegado caso esteja na visão Ano Completo */}
          {modoVisaoAnoCompleto && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnoSelecionado(anoCompetenciaAtual)}
              className="h-8 gap-1 text-xs border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-bold"
              title={`Voltar para a visão do mês de ${formatarCompetenciaRotulo(competencia)}`}
            >
              Voltar ao Mês ({formatarCompetenciaRotulo(competencia)})
            </Button>
          )}

          {/* Input month nativo para pular direto a qualquer ano/mês */}
          <div className="hidden lg:flex items-center bg-background border border-border/50 rounded-lg px-2 py-1 shadow-xs">
            <Input
              id="competencia-britas"
              type="month"
              value={competencia}
              onChange={(e) => {
                if (e.target.value) {
                  setCompetencia(e.target.value)
                  setAnoSelecionado(Number(e.target.value.substring(0, 4)))
                }
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

          {/* Botão Imprimir A4 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprimir}
            className="h-8 gap-1.5 text-xs font-semibold border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
            title="Imprimir relatório da competência em formato A4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir A4</span>
          </Button>

          {podeEditar && (
            <Button
              size="sm"
              onClick={() => abrirModalNovaEntrega()}
              className="h-8 gap-1 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              <Truck className="w-3.5 h-3.5" />
              Registrar Entrega
            </Button>
          )}
        </div>
      </div>

      {/* Alerta Vermelho de Excedente Geral: se entregue geral > total disponível (compra + repasse) */}
      {resumo.entregasExcedentes && (
        <div className="no-print p-4 rounded-xl border-2 border-destructive bg-destructive/15 text-destructive flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 text-destructive" />
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-sm uppercase tracking-wide">
                ALERTA: O total entregue geral superou a compra do mês +
                repasse!
              </p>
              <p className="text-[12px] opacity-90">
                Foram entregues{" "}
                <strong>
                  {resumo.totalEntregueGeralM3.toLocaleString("pt-BR")} m³
                </strong>{" "}
                (Brita 19: {resumo.totalEntregue19M3.toLocaleString("pt-BR")} m³
                | Brita 12: {resumo.totalEntregue12M3.toLocaleString("pt-BR")}{" "}
                m³) para um volume total contratado de{" "}
                <strong>
                  {resumo.totalDisponivelM3.toLocaleString("pt-BR")} m³
                </strong>{" "}
                (Compra: {resumo.compraTotalM3.toLocaleString("pt-BR")} m³
                {resumo.saldoRepasseM3 !== 0
                  ? ` ${
                      resumo.saldoRepasseM3 > 0 ? "+" : "−"
                    } Repasse: ${Math.abs(resumo.saldoRepasseM3).toLocaleString("pt-BR")} m³`
                  : ""}
                ). Excesso:{" "}
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
              onClick={abrirModalNovaCompra}
              className="border-destructive text-destructive hover:bg-destructive/20 h-8 text-xs shrink-0 font-bold"
            >
              Lançar Compra
            </Button>
          )}
        </div>
      )}

      {/* Cartão Principal: INDICADORES OFICIAIS + LISTA DE COMPRAS DA COMPETÊNCIA */}
      <Card className="no-print border border-border/60 bg-card/90 shadow-xs overflow-hidden">
        {/* Barra superior de progresso visual */}
        <div
          className={`h-2.5 w-full ${
            resumo.entregasExcedentes
              ? "bg-destructive animate-pulse"
              : resumo.saldoAReceberM3 === 0 && resumo.totalDisponivelM3 > 0
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
                  <span>
                    {modoVisaoAnoCompleto
                      ? `Controle de Britas — Visão ANO COMPLETO ${anoSelecionado}`
                      : "Compras da Competência & Atendimento de Britas"}
                  </span>
                </CardTitle>
                <Badge
                  variant={modoVisaoAnoCompleto ? "default" : "secondary"}
                  className={`font-mono text-xs uppercase font-bold ${
                    modoVisaoAnoCompleto ? "bg-amber-600 text-white" : ""
                  }`}
                >
                  {modoVisaoAnoCompleto
                    ? `Ano Completo ${anoSelecionado}`
                    : formatarCompetenciaRotulo(competencia)}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                {modoVisaoAnoCompleto ? (
                  <>
                    Totalizadores de todas as compras e entregas do ano{" "}
                    <strong className="text-foreground font-mono">
                      {anoSelecionado}
                    </strong>{" "}
                    na unidade{" "}
                    <strong className="text-foreground">
                      {empresaAtiva?.nome}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Compras realizadas no mês de{" "}
                    <strong className="text-primary font-mono">
                      {formatarCompetenciaRotulo(competencia)}
                    </strong>{" "}
                    na unidade{" "}
                    <strong className="text-foreground">
                      {empresaAtiva?.nome}
                    </strong>
                    .
                  </>
                )}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {podeEditar && !modoVisaoAnoCompleto && compras.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmarReplicarAberto(true)}
                  className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                  title={`Replicar ${compras.length} compra(s) para ${formatarCompetenciaRotulo(proximaCompetencia)}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Replicar Compras para o Próximo Mês
                </Button>
              )}

              {podeEditar && !modoVisaoAnoCompleto && (
                <Button
                  size="sm"
                  onClick={abrirModalNovaCompra}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  LANÇAR COMPRA
                </Button>
              )}

              {podeEditar && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => abrirModalNovaEntrega()}
                  className="h-8 text-xs gap-1.5 font-semibold"
                >
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  Lançar Entrega
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Grid com os 6 Indicadores Oficiais (incluindo SALDO ANTERIOR REPASSE) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* 1. COMPRA DO MÊS / ANO (soma dos volumes de todas as compras) */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-center relative flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  {modoVisaoAnoCompleto ? "Comprado (Ano)" : "Compra do Mês"}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground block">
                  {resumo.compraTotalM3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>m³ somados</span>
                <span className="text-[10px] font-mono font-semibold">
                  {modoVisaoAnoCompleto
                    ? `${comprasAno.length} compras`
                    : `${compras.length} ${
                        compras.length === 1 ? "compra" : "compras"
                      }`}
                </span>
              </div>
            </div>

            {/* 2. NOVO INDICADOR: TOTAL EM CHEQUES (soma de todos os cheques das compras do mês) */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                  Total em Cheques
                </span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 block truncate">
                  {formatarMoeda(totaisCheques.total)}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-700/80 dark:text-emerald-400">
                <span>
                  {totaisCheques.qtd}{" "}
                  {totaisCheques.qtd === 1 ? "cheque" : "cheques"}
                </span>
                <span className="font-mono text-[10px] font-semibold">
                  {totaisCheques.qtdPagos} baixado(s)
                </span>
              </div>
            </div>

            {/* 2b. SALDO ANTERIOR (REPASSE) */}
            <div
              className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
                resumo.saldoRepasseM3 > 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : resumo.saldoRepasseM3 < 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                    : "bg-muted/40 border-border/50 text-muted-foreground"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                  {modoVisaoAnoCompleto
                    ? "Total Contratado"
                    : "Saldo Anterior (Repasse)"}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono block">
                  {modoVisaoAnoCompleto ? (
                    resumo.totalDisponivelM3.toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  ) : (
                    <>
                      {resumo.saldoRepasseM3 > 0 ? "+" : ""}
                      {resumo.saldoRepasseM3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  )}
                </span>
              </div>
              <div className="mt-2 pt-1 border-t border-current/20 flex items-center justify-between text-[11px] font-medium">
                <span className="text-[10px] truncate">
                  {modoVisaoAnoCompleto
                    ? `Ano ${anoSelecionado}`
                    : formatarCompetenciaRotulo(anteriorCompetencia)}
                </span>
                <span className="font-mono text-[10px]">
                  {modoVisaoAnoCompleto
                    ? "m³ ano"
                    : resumo.saldoRepasseM3 > 0
                      ? "soma"
                      : resumo.saldoRepasseM3 < 0
                        ? "subtrai"
                        : "0"}
                </span>
              </div>
            </div>

            {/* 3. TOTAL ENTREGUE BRITA 19 */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Total Brita 19
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 block">
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

            {/* 4. TOTAL ENTREGUE BRITA 12 */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                  Total Brita 12
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400 block">
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

            {/* 5. TOTAL ENTREGUE GERAL (m³) */}
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                  Total Entregue Geral
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary block">
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

            {/* 6. SALDO A RECEBER (compra + repasse − entregue geral) */}
            <div
              className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
                resumo.entregasExcedentes
                  ? "bg-destructive/15 border-destructive text-destructive"
                  : resumo.saldoAReceberM3 === 0 && resumo.totalDisponivelM3 > 0
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted/40 border-border/50 text-foreground"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">
                  {modoVisaoAnoCompleto ? "Saldo do Ano" : "Saldo a Receber"}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono block">
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
                    : resumo.saldoAReceberM3 === 0 &&
                        resumo.totalDisponivelM3 > 0
                      ? "100% entregue"
                      : modoVisaoAnoCompleto
                        ? "Saldo m³"
                        : "Pendente m³"}
                </span>
                <span className="font-mono text-[10px]">
                  {resumo.totalDisponivelM3 > 0
                    ? `${percentualAtendido}%`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso do Volume Contratado */}
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground flex-wrap gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers2 className="w-3.5 h-3.5 text-primary" />
                Atendimento do Volume Total (Compras {resumo.compraTotalM3} m³
                {resumo.saldoRepasseM3 !== 0
                  ? ` ${
                      resumo.saldoRepasseM3 > 0 ? "+" : "−"
                    } Repasse ${Math.abs(resumo.saldoRepasseM3)} m³ = ${resumo.totalDisponivelM3} m³`
                  : ""}
                ):
              </span>
              <span className="font-mono font-bold text-foreground">
                {resumo.totalDisponivelM3 > 0
                  ? `${resumo.totalEntregueGeralM3.toLocaleString("pt-BR")} m³ de ${resumo.totalDisponivelM3.toLocaleString("pt-BR")} m³ (${percentualAtendido}%)`
                  : "Volume não cadastrado"}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
              {resumo.totalDisponivelM3 > 0 ? (
                <>
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (resumo.totalEntregue19M3 / resumo.totalDisponivelM3) *
                          100,
                      )}%`,
                    }}
                    title={`Brita 19: ${resumo.totalEntregue19M3} m³`}
                  />
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100 -
                          Math.min(
                            100,
                            (resumo.totalEntregue19M3 /
                              resumo.totalDisponivelM3) *
                              100,
                          ),
                        (resumo.totalEntregue12M3 / resumo.totalDisponivelM3) *
                          100,
                      )}%`,
                    }}
                    title={`Brita 12: ${resumo.totalEntregue12M3} m³`}
                  />
                </>
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 flex-wrap gap-2">
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
            </div>
          </div>

          {/* =========================================================================
              (2) LISTA DE COMPRAS DA COMPETÊNCIA — TABELA COM TODAS AS COMPRAS DO MÊS
          ========================================================================== */}
          <div className="pt-3 border-t border-border/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {modoVisaoAnoCompleto
                    ? `Compras do Ano Completo (${anoSelecionado})`
                    : `Compras da Competência (${formatarCompetenciaRotulo(competencia)})`}
                </h3>
                <Badge variant="outline" className="text-xs font-mono">
                  {modoVisaoAnoCompleto ? comprasAno.length : compras.length}{" "}
                  lançamento(s)
                </Badge>
              </div>

              {podeEditar && !modoVisaoAnoCompleto && (
                <Button
                  size="sm"
                  onClick={abrirModalNovaCompra}
                  className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  LANÇAR COMPRA
                </Button>
              )}
            </div>

            {(modoVisaoAnoCompleto ? comprasAno : compras).length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-border/30">
                <p>
                  Nenhuma compra cadastrada para{" "}
                  {modoVisaoAnoCompleto
                    ? `o ano ${anoSelecionado}`
                    : `o mês de ${formatarCompetenciaRotulo(competencia)}`}
                  .
                </p>
                {podeEditar && !modoVisaoAnoCompleto && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={abrirModalNovaCompra}
                    className="text-xs text-primary h-auto p-0 mt-1"
                  >
                    + Lançar primeira compra de brita
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto border border-border/30 rounded-lg bg-background/50">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3 text-right">Volume (m³)</th>
                      <th className="py-2.5 px-3">Fornecedor</th>
                      <th className="py-2.5 px-3">Obs</th>
                      <th className="py-2.5 px-3 text-right">
                        Total em Cheques
                      </th>
                      <th className="py-2.5 px-3 text-center">Cheques</th>
                      {podeEditar && !modoVisaoAnoCompleto && (
                        <th className="py-2.5 px-3 text-center w-28">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {(modoVisaoAnoCompleto ? comprasAno : compras).map(
                      (compra) => {
                        const chqsDestaCompra =
                          chequesPorCompraId.map.get(compra.id) || []
                        const totalChequesDestaCompra = chqsDestaCompra.reduce(
                          (acc, c) => acc + (Number(c.valor) || 0),
                          0,
                        )
                        const estaSelecionada =
                          compraSelecionadaCheques?.id === compra.id

                        return (
                          <tr
                            key={compra.id}
                            className={`hover:bg-muted/20 transition-colors ${
                              estaSelecionada ? "bg-primary/5 font-medium" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-semibold text-foreground whitespace-nowrap">
                              {compra.data
                                ? compra.data.split("-").reverse().join("/")
                                : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-foreground">
                              {Number(compra.volume_m3).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 3,
                                },
                              )}{" "}
                              m³
                            </td>
                            <td className="py-2.5 px-3 text-foreground">
                              {compra.fornecedor || "—"}
                            </td>
                            <td
                              className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate"
                              title={compra.observacao || ""}
                            >
                              {compra.observacao || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {chqsDestaCompra.length > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {formatarMoeda(totalChequesDestaCompra)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Button
                                variant={
                                  estaSelecionada ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  if (estaSelecionada) {
                                    setCompraSelecionadaCheques(null)
                                  } else {
                                    setCompraSelecionadaCheques(compra)
                                  }
                                }}
                                className="h-6 text-[11px] gap-1 px-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                                title={`Gerenciar cheques desta compra (${chqsDestaCompra.length})`}
                              >
                                <Banknote className="w-3 h-3" />
                                <span>CHEQUES ({chqsDestaCompra.length})</span>
                              </Button>
                            </td>
                            {podeEditar && !modoVisaoAnoCompleto && (
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Editar compra"
                                    onClick={() =>
                                      abrirModalEditarCompra(compra)
                                    }
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Excluir compra"
                                    onClick={() => setCompraParaExcluir(compra)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      },
                    )}
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold border-t-2 border-border/60 text-xs">
                    <tr>
                      <td className="py-2.5 px-3 uppercase text-foreground">
                        Total Compras (
                        {modoVisaoAnoCompleto
                          ? comprasAno.length
                          : compras.length}
                        )
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-primary">
                        {resumo.compraTotalM3.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 3,
                        })}{" "}
                        m³
                      </td>
                      <td
                        colSpan={2}
                        className="py-2.5 px-3 text-muted-foreground text-[11px]"
                      >
                        Volume total acumulado
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(totaisCheques.total)}
                      </td>
                      <td
                        colSpan={podeEditar && !modoVisaoAnoCompleto ? 2 : 1}
                      />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Cheques órfãos / legados (sem compra_id) se existirem */}
            {chequesPorCompraId.semCompra.length > 0 && (
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-300">
                  Existem {chequesPorCompraId.semCompra.length} cheque(s)
                  legado(s) vinculados ao mês sem compra específica (
                  {formatarMoeda(
                    chequesPorCompraId.semCompra.reduce(
                      (acc, c) => acc + (Number(c.valor) || 0),
                      0,
                    ),
                  )}
                  ).
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCompraSelecionadaCheques(null)}
                  className="h-6 text-[11px]"
                >
                  Ver todos os cheques
                </Button>
              </div>
            )}
          </div>

          {/* =========================================================================
              (3) SEÇÃO CHEQUES POR COMPRA (ou cheques da compra selecionada / todos)
          ========================================================================== */}
          <div className="pt-3 border-t border-border/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">
                  {compraSelecionadaCheques
                    ? `Cheques da Compra de ${
                        compraSelecionadaCheques.data
                          ? compraSelecionadaCheques.data
                              .split("-")
                              .reverse()
                              .join("/")
                          : ""
                      } (${compraSelecionadaCheques.volume_m3} m³ - ${compraSelecionadaCheques.fornecedor || "Sem fornecedor"})`
                    : "Todos os Cheques da Competência"}
                </h3>
                {compraSelecionadaCheques && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompraSelecionadaCheques(null)}
                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    (Ver todos do mês)
                  </Button>
                )}
                {/* Totalizador filtrado */}
                <Badge
                  variant="outline"
                  className="font-mono text-xs font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                >
                  {compraSelecionadaCheques ? (
                    <>
                      Total:{" "}
                      {formatarMoeda(
                        (
                          chequesPorCompraId.map.get(
                            compraSelecionadaCheques.id,
                          ) || []
                        ).reduce((acc, c) => acc + (Number(c.valor) || 0), 0),
                      )}
                    </>
                  ) : (
                    <>Total Cheques: {formatarMoeda(totaisCheques.total)}</>
                  )}
                </Badge>
              </div>

              {podeEditar && !modoVisaoAnoCompleto && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    abrirModalNovoCheque(compraSelecionadaCheques || undefined)
                  }
                  className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Lançar Cheque {compraSelecionadaCheques ? "nesta Compra" : ""}
                </Button>
              )}
            </div>

            {(() => {
              const listaChequesExibida = compraSelecionadaCheques
                ? chequesPorCompraId.map.get(compraSelecionadaCheques.id) || []
                : cheques

              if (listaChequesExibida.length === 0) {
                return (
                  <div className="py-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-border/30">
                    <p>
                      {compraSelecionadaCheques
                        ? "Nenhum cheque cadastrado para esta compra específica."
                        : "Nenhum cheque cadastrado para a competência."}
                    </p>
                    {podeEditar && !modoVisaoAnoCompleto && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() =>
                          abrirModalNovoCheque(
                            compraSelecionadaCheques || undefined,
                          )
                        }
                        className="text-xs text-primary h-auto p-0 mt-1"
                      >
                        + Lançar primeiro cheque{" "}
                        {compraSelecionadaCheques ? "para esta compra" : ""}
                      </Button>
                    )}
                  </div>
                )
              }

              return (
                <div className="overflow-x-auto border border-border/30 rounded-lg bg-background/50">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                      <tr>
                        <th className="py-2 px-3">Nº Cheque</th>
                        <th className="py-2 px-3">Vencimento (Vai Cair)</th>
                        <th className="py-2 px-3 text-right">Valor (R$)</th>
                        <th className="py-2 px-3 text-center w-28">Status</th>
                        {!compraSelecionadaCheques && (
                          <th className="py-2 px-3">Compra Vinculada</th>
                        )}
                        <th className="py-2 px-3">Observação</th>
                        {podeEditar && !modoVisaoAnoCompleto && (
                          <th className="py-2 px-3 text-center w-24">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {listaChequesExibida.map((chq) => {
                        const compraDoChq = chq.compra_id
                          ? compras.find((c) => c.id === chq.compra_id)
                          : null

                        return (
                          <tr
                            key={chq.id}
                            className={`hover:bg-muted/20 transition-colors ${
                              chq.pago ? "opacity-75" : ""
                            }`}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-foreground">
                              {chq.numero || "—"}
                            </td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">
                              {chq.data_vencimento
                                ? chq.data_vencimento
                                    .split("-")
                                    .reverse()
                                    .join("/")
                                : "—"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                              {formatarMoeda(Number(chq.valor) || 0)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {podeEditar ? (
                                <button
                                  type="button"
                                  onClick={() => handleAlternarPagoCheque(chq)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                                    chq.pago
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
                                  }`}
                                  title={
                                    chq.pago
                                      ? "Clique para marcar como PENDENTE"
                                      : "Clique para marcar como PAGO"
                                  }
                                >
                                  {chq.pago ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>PAGO</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>PENDENTE</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    chq.pago
                                      ? "border-emerald-500 text-emerald-600"
                                      : "border-amber-500 text-amber-600"
                                  }
                                >
                                  {chq.pago ? "PAGO" : "PENDENTE"}
                                </Badge>
                              )}
                            </td>
                            {!compraSelecionadaCheques && (
                              <td className="py-2 px-3 text-muted-foreground">
                                {compraDoChq ? (
                                  <span className="font-mono text-[11px]">
                                    {compraDoChq.data
                                      ? compraDoChq.data
                                          .split("-")
                                          .reverse()
                                          .join("/")
                                      : ""}{" "}
                                    ({compraDoChq.volume_m3} m³
                                    {compraDoChq.fornecedor
                                      ? ` - ${compraDoChq.fornecedor}`
                                      : ""}
                                    )
                                  </span>
                                ) : (
                                  <span className="italic text-muted-foreground/70">
                                    Sem compra vinculada
                                  </span>
                                )}
                              </td>
                            )}
                            <td
                              className="py-2 px-3 text-muted-foreground max-w-[220px] truncate"
                              title={chq.observacao || ""}
                            >
                              {chq.observacao || "—"}
                            </td>
                            {podeEditar && !modoVisaoAnoCompleto && (
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Editar cheque"
                                    onClick={() => abrirModalEditarCheque(chq)}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Excluir cheque"
                                    onClick={() => setChequeParaExcluir(chq)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Histórico das Entregas do Mês com FILTROS e BOTÃO IMPRIMIR */}
      <Card className="no-print border-border/40 bg-card/70">
        <CardHeader className="flex flex-col gap-3 pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span>
                  {modoVisaoAnoCompleto
                    ? `Histórico das Entregas do Ano Completo (${anoSelecionado})`
                    : `Histórico das Entregas do Mês (${formatarCompetenciaRotulo(competencia)})`}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {modoVisaoAnoCompleto
                  ? `Registros individuais de todas as cargas de Brita 19 e Brita 12 entregues em ${anoSelecionado} (todas as competências)`
                  : `Registros individuais de cargas recebidas de Brita 19 e Brita 12 na competência ${formatarCompetenciaRotulo(competencia)} com conversão automática para m³`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImprimir}
                className="h-8 gap-1.5 text-xs font-semibold border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
                title="Imprimir histórico de entregas filtrado em A4"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir A4</span>
              </Button>
            </div>
          </div>

          {/* BARRA DE FILTROS: Tipo de brita, fornecedor (texto) e período (data inicial/final) */}
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-primary" />
                Filtros de Pesquisa
              </span>
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <FilterX className="w-3 h-3" />
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Filtro Tipo de Brita */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Tipo de Brita
                </Label>
                <Select
                  value={filtroTipoBrita}
                  onValueChange={(val: any) => setFiltroTipoBrita(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as Britas</SelectItem>
                    <SelectItem value="19">Apenas Brita 19</SelectItem>
                    <SelectItem value="12">Apenas Brita 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Fornecedor (texto) */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Fornecedor / Pedreira
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Filtrar por pedreira..."
                    value={filtroFornecedor}
                    onChange={(e) => setFiltroFornecedor(e.target.value)}
                    className="h-8 text-xs bg-background pr-7"
                  />
                  {filtroFornecedor && (
                    <button
                      type="button"
                      onClick={() => setFiltroFornecedor("")}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground text-xs"
                      title="Limpar texto"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Período Data Inicial */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Data Inicial
                </Label>
                <Input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              {/* Período Data Final */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Data Final
                </Label>
                <Input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>
            </div>

            {temFiltroAtivo && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/20">
                <span>
                  Exibindo <strong>{entregasFiltradas.length}</strong> de{" "}
                  <strong>{entregasAtivas.length}</strong> entregas{" "}
                  {modoVisaoAnoCompleto ? `do ano ${anoSelecionado}` : "do mês"}
                </span>
                <span className="font-mono font-bold text-foreground">
                  Volume Filtrado:{" "}
                  {totalVolumeEntregasFiltradas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3,
                  })}{" "}
                  m³
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {entregasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
              <Truck className="w-8 h-8 mx-auto opacity-30" />
              <p>
                {temFiltroAtivo
                  ? "Nenhuma entrega corresponde aos filtros selecionados."
                  : `Nenhuma entrega registrada para o mês de ${formatarCompetenciaRotulo(competencia)}.`}
              </p>
              {temFiltroAtivo ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limparFiltros}
                  className="gap-1.5 text-xs text-primary"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Limpar Filtros
                </Button>
              ) : (
                podeEditar && (
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
                )
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    {modoVisaoAnoCompleto && (
                      <th className="py-2.5 px-3">Competência</th>
                    )}
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
                      {modoVisaoAnoCompleto && (
                        <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                          {entrega.competencia
                            ? formatarCompetenciaRotulo(entrega.competencia)
                            : "—"}
                        </td>
                      )}
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
                {/* Totalizador da tabela em tela */}
                <tfoot className="bg-muted/50 font-bold border-t-2 border-border/60 text-xs">
                  <tr>
                    <td
                      colSpan={modoVisaoAnoCompleto ? 5 : 4}
                      className="py-2.5 px-3 uppercase text-foreground"
                    >
                      Total ({entregasFiltradas.length}{" "}
                      {entregasFiltradas.length === 1 ? "entrega" : "entregas"})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-primary">
                      {totalVolumeEntregasFiltradas.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      })}{" "}
                      m³
                    </td>
                    <td
                      colSpan={podeEditar ? 4 : 3}
                      className="py-2.5 px-3 text-muted-foreground text-[11px]"
                    >
                      {modoVisaoAnoCompleto
                        ? "Geral do ano: "
                        : "Geral do mês: "}
                      {resumo.totalEntregueGeralM3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      m³ (19: {resumo.totalEntregue19M3.toLocaleString("pt-BR")}{" "}
                      m³ | 12:{" "}
                      {resumo.totalEntregue12M3.toLocaleString("pt-BR")} m³)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Lançar / Editar Compra da Competência */}
      <Dialog
        open={modalCompraAberta}
        onOpenChange={(aberto) => {
          setModalCompraAberta(aberto)
          if (!aberto) setCompraEmEdicao(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {compraEmEdicao
                ? "Editar Compra de Brita"
                : "Lançar Compra de Brita"}
            </DialogTitle>
            <DialogDescription>
              {compraEmEdicao
                ? "Atualize os dados desta compra de brita."
                : `Registre uma compra realizada no mês de ${formatarCompetenciaRotulo(competencia)} (${empresaAtiva?.nome}). É permitido lançar mais de uma compra no mês.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarCompra} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="compraData">Data da Compra *</Label>
                <Input
                  id="compraData"
                  type="date"
                  value={compraData}
                  onChange={(e) => setCompraData(e.target.value)}
                  className="font-mono text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compraVolumeM3">Volume (m³) *</Label>
                <div className="relative">
                  <Input
                    id="compraVolumeM3"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 450"
                    value={compraVolumeM3}
                    onChange={(e) => setCompraVolumeM3(e.target.value)}
                    className="font-mono font-bold pr-10"
                    required
                    autoFocus
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-semibold">
                    m³
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compraFornecedor">Fornecedor / Pedreira</Label>
              <Input
                id="compraFornecedor"
                placeholder="Ex: Pedreira Sertão, Pedreira São Bento..."
                value={compraFornecedor}
                onChange={(e) => setCompraFornecedor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compraObservacao">Observações (opcional)</Label>
              <Input
                id="compraObservacao"
                placeholder="Ex: Pedido 1042, pagamento à vista / pré-datado..."
                value={compraObservacao}
                onChange={(e) => setCompraObservacao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalCompraAberta(false)
                  setCompraEmEdicao(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoCompra || !compraVolumeM3.trim()}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {salvandoCompra
                  ? "Salvando..."
                  : compraEmEdicao
                    ? "Salvar Alterações"
                    : "Lançar Compra"}
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

      {/* Modal Lançar / Editar Cheque da Compra */}
      <Dialog
        open={modalChequeAberta}
        onOpenChange={(aberto) => {
          setModalChequeAberta(aberto)
          if (!aberto) setChequeEmEdicao(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {chequeEmEdicao
                ? "Editar Cheque da Compra"
                : "Lançar Cheque da Compra"}
            </DialogTitle>
            <DialogDescription>
              Vincule um cheque ao pagamento da compra de britas de{" "}
              <strong>{formatarCompetenciaRotulo(competencia)}</strong> (
              {empresaAtiva?.nome}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarCheque} className="space-y-4 py-2">
            {/* Seletor da Compra a vincular (ou compra já pré-selecionada) */}
            {compras.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="chequeCompraId">Vincular à Compra</Label>
                <Select
                  value={compraSelecionadaCheques?.id || "nenhuma"}
                  onValueChange={(val) => {
                    if (val === "nenhuma") {
                      setCompraSelecionadaCheques(null)
                    } else {
                      const c = compras.find((x) => x.id === val) || null
                      setCompraSelecionadaCheques(c)
                    }
                  }}
                >
                  <SelectTrigger id="chequeCompraId" className="text-xs">
                    <SelectValue placeholder="Selecione a compra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">
                      (Nenhuma compra específica / Geral do mês)
                    </SelectItem>
                    {compras.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-xs font-mono"
                      >
                        {c.data ? c.data.split("-").reverse().join("/") : ""} —{" "}
                        {c.volume_m3} m³{" "}
                        {c.fornecedor ? `(${c.fornecedor})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="chequeValor">Valor do Cheque (R$) *</Label>
                <div className="relative">
                  <Input
                    id="chequeValor"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 5000,00"
                    value={chequeValor}
                    onChange={(e) => setChequeValor(e.target.value)}
                    className="font-mono font-bold pl-8"
                    required
                    autoFocus
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-bold">
                    R$
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chequeDataVencimento">Data que vai cair</Label>
                <Input
                  id="chequeDataVencimento"
                  type="date"
                  value={chequeDataVencimento}
                  onChange={(e) => setChequeDataVencimento(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="chequeNumero">Número do Cheque</Label>
                <Input
                  id="chequeNumero"
                  placeholder="Ex: 001234"
                  value={chequeNumero}
                  onChange={(e) => setChequeNumero(e.target.value)}
                  className="font-mono font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chequePago">Status do Pagamento</Label>
                <Select
                  value={chequePago ? "true" : "false"}
                  onValueChange={(val) => setChequePago(val === "true")}
                >
                  <SelectTrigger id="chequePago" className="text-xs">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">
                      PENDENTE (A compensar)
                    </SelectItem>
                    <SelectItem value="true">
                      PAGO (Compensado / Baixado)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chequeObservacao">Observação (opcional)</Label>
              <Input
                id="chequeObservacao"
                placeholder="Ex: Banco do Brasil, agência centro, favorecido..."
                value={chequeObservacao}
                onChange={(e) => setChequeObservacao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalChequeAberta(false)
                  setChequeEmEdicao(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoCheque || !chequeValor.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {salvandoCheque
                  ? "Salvando..."
                  : chequeEmEdicao
                    ? "Salvar Alterações"
                    : "Lançar Cheque"}
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

      {/* AlertDialog de Confirmação para Excluir Compra (com aviso se tiver cheques) */}
      <AlertDialog
        open={Boolean(compraParaExcluir)}
        onOpenChange={(aberto) => !aberto && setCompraParaExcluir(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Excluir Compra de Brita
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja remover esta compra?
              {compraParaExcluir &&
                (chequesPorCompraId.map.get(compraParaExcluir.id)?.length ||
                  0) > 0 && (
                  <span className="block mt-2 font-bold text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
                    ATENÇÃO: Esta compra possui{" "}
                    {chequesPorCompraId.map.get(compraParaExcluir.id)?.length}{" "}
                    cheque(s) vinculado(s) no valor total de{" "}
                    {formatarMoeda(
                      (
                        chequesPorCompraId.map.get(compraParaExcluir.id) || []
                      ).reduce((acc, c) => acc + (Number(c.valor) || 0), 0),
                    )}
                    . Os cheques serão EXCLUÍDOS JUNTO com a compra!
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {compraParaExcluir && (
            <div className="p-3 rounded-lg border border-border/40 bg-muted/30 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">Data:</span>
                <span className="font-bold">
                  {compraParaExcluir.data
                    ? compraParaExcluir.data.split("-").reverse().join("/")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-destructive">
                <span className="font-sans text-muted-foreground">Volume:</span>
                <span>
                  {Number(compraParaExcluir.volume_m3).toLocaleString("pt-BR")}{" "}
                  m³
                </span>
              </div>
              {compraParaExcluir.fornecedor && (
                <div className="flex justify-between">
                  <span className="font-sans text-muted-foreground">
                    Fornecedor:
                  </span>
                  <span>{compraParaExcluir.fornecedor}</span>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoCompra}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindoCompra}
              onClick={handleConfirmarExclusaoCompra}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {excluindoCompra ? "Excluindo..." : "Sim, Excluir Compra"}
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

      {/* AlertDialog de Confirmação para Excluir Cheque */}
      <AlertDialog
        open={Boolean(chequeParaExcluir)}
        onOpenChange={(aberto) => !aberto && setChequeParaExcluir(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Excluir Cheque da Compra
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja remover este cheque do controle da compra?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {chequeParaExcluir && (
            <div className="p-3 rounded-lg border border-border/40 bg-muted/30 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">Número:</span>
                <span className="font-bold">
                  {chequeParaExcluir.numero || "Sem número"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">Valor:</span>
                <span className="font-bold text-destructive">
                  {formatarMoeda(Number(chequeParaExcluir.valor) || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">
                  Vencimento:
                </span>
                <span>
                  {chequeParaExcluir.data_vencimento
                    ? chequeParaExcluir.data_vencimento
                        .split("-")
                        .reverse()
                        .join("/")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-muted-foreground">Status:</span>
                <span>{chequeParaExcluir.pago ? "PAGO" : "PENDENTE"}</span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoCheque}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindoCheque}
              onClick={handleConfirmarExclusaoCheque}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {excluindoCheque ? "Excluindo..." : "Sim, Excluir Cheque"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
