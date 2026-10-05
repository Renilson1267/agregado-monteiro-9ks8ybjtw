import { useState, useEffect, useCallback } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link, useSearchParams } from "react-router-dom"
import { ConcreteiraService } from "@/services/concreteira"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import {
  RelatorioGerencialService,
  DadosRelatorioGerencialMes,
} from "@/services/relatorio-gerencial"
import { RelatorioGerencialMes } from "@/components/RelatorioGerencialMes"
import type {
  Carga,
  Cidade,
  Veiculo,
  Motorista,
  Material,
  ComparativoUnidade,
} from "@/types/concreteira"
import {
  FileSpreadsheet,
  Download,
  Filter,
  Truck,
  MapPin,
  RefreshCw,
  Printer,
  Scale,
  DollarSign,
  Coins,
  Layers,
  ArrowUpDown,
  Calendar,
  Pencil,
  Trash2,
  Boxes,
  FileText,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react"
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
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

export default function Relatorios() {
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador, isBalanceiro } = useUsuario()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get("tab")
  const [abaAtiva, setAbaAtiva] =
    useState<"gerencial" | "operacional" | "comparativo">(
      tabParam === "gerencial"
        ? "gerencial"
        : isAdministrador && tabParam === "comparativo"
          ? "comparativo"
          : "gerencial",
    )

  useEffect(() => {
    if (tabParam === "gerencial" && abaAtiva !== "gerencial") {
      setAbaAtiva("gerencial")
    } else if (
      tabParam === "comparativo" &&
      isAdministrador &&
      abaAtiva !== "comparativo"
    ) {
      setAbaAtiva("comparativo")
    } else if (tabParam === "operacional" && abaAtiva !== "operacional") {
      setAbaAtiva("operacional")
    }
  }, [tabParam, abaAtiva, isAdministrador])

  const handleMudarAba = (
    novaAba: "gerencial" | "operacional" | "comparativo",
  ) => {
    setAbaAtiva(novaAba)
    const newParams = new URLSearchParams(searchParams)
    newParams.set("tab", novaAba)
    setSearchParams(newParams, { replace: true })
  }

  // Dados operacionais
  const [cargas, setCargas] = useState<Carga[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()

  // Filtros operacionais
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [materialFiltro, setMaterialFiltro] = useState("ALL")
  const [cidadeFiltro, setCidadeFiltro] = useState("ALL")
  const [veiculoFiltro, setVeiculoFiltro] = useState("ALL")
  const [motoristaFiltro, setMotoristaFiltro] = useState("ALL")
  const [apenasZeradas, setApenasZeradas] = useState(false)
  const [periodoAtivo, setPeriodoAtivo] =
    useState<"mes_atual" | "mes_anterior" | "anual" | "todos" | "personalizado">(
      "todos",
    )

  // Estado da lixeira / exclusão de carga
  const [cargaParaExcluir, setCargaParaExcluir] = useState<Carga | null>(null)
  const [excluindoCarga, setExcluindoCarga] = useState(false)

  // Dados comparativos Monteiro × SJE
  const [loadingComparativo, setLoadingComparativo] = useState(false)
  const [tipoPeriodoComparativo, setTipoPeriodoComparativo] =
    useState<"mes_atual" | "hoje" | "7dias" | "mes_anterior" | "personalizado" | "todos">(
      "todos",
    )
  const [comparativoDataInicio, setComparativoDataInicio] = useState("")
  const [comparativoDataFim, setComparativoDataFim] = useState("")
  const [dadosComparativo, setDadosComparativo] = useState<{
    unidades: ComparativoUnidade[]
    totaisGerais: {
      volumeTotal: number
      cargasTotal: number
      custoTotal: number
      custoPorM3: number
    }
  }>({
    unidades: [],
    totaisGerais: {
      volumeTotal: 0,
      cargasTotal: 0,
      custoTotal: 0,
      custoPorM3: 0,
    },
  })

  // =========================================================
  // Estado e Carregamento do Relatório Gerencial (Mês)
  // =========================================================
  const [competenciaGerencial, setCompetenciaGerencial] =
    useState<string>("2026-09")
  const [visaoGerencialEmpresa, setVisaoGerencialEmpresa] = useState<string>(
    () => {
      if (empresaAtiva?.slug) return empresaAtiva.slug.toLowerCase()
      if (empresaAtiva?.id) return empresaAtiva.id
      return "todas"
    },
  )
  const [dadosGerencial, setDadosGerencial] =
    useState<DadosRelatorioGerencialMes | null>(null)
  const [loadingGerencial, setLoadingGerencial] = useState(false)

  // Sincroniza visão gerencial quando o seletor do topo altera a empresa ativa
  useEffect(() => {
    if (empresaAtiva?.slug) {
      setVisaoGerencialEmpresa(empresaAtiva.slug.toLowerCase())
    } else if (empresaAtiva?.id) {
      setVisaoGerencialEmpresa(empresaAtiva.id)
    }
  }, [empresaAtiva?.id, empresaAtiva?.slug])

  const carregarRelatorioGerencial = useCallback(async () => {
    setLoadingGerencial(true)
    try {
      const res = await RelatorioGerencialService.obterRelatorioMes({
        competencia: competenciaGerencial,
        empresaFiltro: visaoGerencialEmpresa,
      })
      setDadosGerencial(res)
    } catch (err) {
      console.error("Erro ao carregar relatório gerencial mensal:", err)
      toast({
        title: "Erro ao carregar relatório gerencial",
        description: "Não foi possível carregar os dados da competência.",
        variant: "destructive",
      })
    } finally {
      setLoadingGerencial(false)
    }
  }, [competenciaGerencial, visaoGerencialEmpresa, toast])

  useEffect(() => {
    if (abaAtiva === "gerencial") {
      carregarRelatorioGerencial()
    }
  }, [abaAtiva, carregarRelatorioGerencial])

  const navegarCompetenciaGerencial = (delta: number) => {
    const [ano, mes] = competenciaGerencial.split("-").map(Number)
    const dt = new Date(ano, mes - 1 + delta, 1)
    const a = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, "0")
    setCompetenciaGerencial(`${a}-${m}`)
  }

  const carregarFiltrosIniciais = async () => {
    if (!empresaAtiva) return
    try {
      const [cid, vei, mot, mat] = await Promise.all([
        ConcreteiraService.getCidades(empresaAtiva.id),
        ConcreteiraService.getVeiculos(empresaAtiva.id),
        ConcreteiraService.getMotoristas(empresaAtiva.id),
        ConcreteiraService.getMateriais(empresaAtiva.id),
      ])
      setCidades(cid)
      setVeiculos(vei)
      setMotoristas(mot)
      setMateriais(mat)
    } catch (e) {
      console.error(e)
    }
  }

  const carregarRelatorio = async (datasOverride?: {
    ini?: string
    fim?: string
  }) => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const iniEfetivo =
        datasOverride !== undefined
          ? datasOverride.ini
          : dataInicio || undefined
      const fimEfetivo =
        datasOverride !== undefined ? datasOverride.fim : dataFim || undefined

      const dados = await ConcreteiraService.getCargas({
        empresaId: empresaAtiva.id,
        dataInicio: iniEfetivo,
        dataFim: fimEfetivo,
        cidade: cidadeFiltro,
        veiculo: veiculoFiltro,
        motorista: motoristaFiltro,
        material: materialFiltro,
        apenasZeradas,
      })
      setCargas(dados)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const aplicarPeriodoRapidoOperacional = (
    tipo: "mes_atual" | "mes_anterior" | "anual" | "todos",
  ) => {
    setPeriodoAtivo(tipo)
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const mesAtual = hoje.getMonth() + 1 // 1 a 12

    let ini = ""
    let fim = ""

    if (tipo === "mes_atual") {
      const ultimoDia = new Date(anoAtual, mesAtual, 0).getDate()
      ini = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-01`
      fim = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`
    } else if (tipo === "mes_anterior") {
      const dAnt = new Date(anoAtual, mesAtual - 2, 1)
      const aAnt = dAnt.getFullYear()
      const mAnt = dAnt.getMonth() + 1
      const ultimoDiaAnt = new Date(aAnt, mAnt, 0).getDate()
      ini = `${aAnt}-${String(mAnt).padStart(2, "0")}-01`
      fim = `${aAnt}-${String(mAnt).padStart(2, "0")}-${String(ultimoDiaAnt).padStart(2, "0")}`
    } else if (tipo === "anual") {
      ini = `${anoAtual}-01-01`
      fim = `${anoAtual}-12-31`
    } else if (tipo === "todos") {
      ini = ""
      fim = ""
    }

    setDataInicio(ini)
    setDataFim(fim)
    carregarRelatorio({ ini: ini || undefined, fim: fim || undefined })
  }

  const carregarComparativo = async (datasOverride?: {
    ini?: string
    fim?: string
  }) => {
    setLoadingComparativo(true)
    try {
      const ini = datasOverride
        ? datasOverride.ini
        : comparativoDataInicio || undefined
      const fim = datasOverride
        ? datasOverride.fim
        : comparativoDataFim || undefined
      const res = await ConcreteiraService.getComparativoUnidades({
        dataInicio: ini,
        dataFim: fim,
      })
      setDadosComparativo(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingComparativo(false)
    }
  }

  const aplicarPredefinicaoComparativo = (
    tipo: "mes_atual" | "hoje" | "7dias" | "mes_anterior" | "anual" | "personalizado" | "todos",
  ) => {
    setTipoPeriodoComparativo(tipo as any)
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const mesAtual = hoje.getMonth() + 1

    let ini = ""
    let fim = ""

    if (tipo === "hoje") {
      const hojeStr = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`
      ini = hojeStr
      fim = hojeStr
    } else if (tipo === "7dias") {
      const d7 = new Date()
      d7.setDate(d7.getDate() - 6)
      const a7 = d7.getFullYear()
      const m7 = d7.getMonth() + 1
      ini = `${a7}-${String(m7).padStart(2, "0")}-${String(d7.getDate()).padStart(2, "0")}`
      fim = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`
    } else if (tipo === "mes_atual") {
      const ultimoDia = new Date(anoAtual, mesAtual, 0).getDate()
      ini = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-01`
      fim = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`
    } else if (tipo === "mes_anterior") {
      const dAnt = new Date(anoAtual, mesAtual - 2, 1)
      const aAnt = dAnt.getFullYear()
      const mAnt = dAnt.getMonth() + 1
      const ultimoDiaAnt = new Date(aAnt, mAnt, 0).getDate()
      ini = `${aAnt}-${String(mAnt).padStart(2, "0")}-01`
      fim = `${aAnt}-${String(mAnt).padStart(2, "0")}-${String(ultimoDiaAnt).padStart(2, "0")}`
    } else if (tipo === "anual") {
      ini = `${anoAtual}-01-01`
      fim = `${anoAtual}-12-31`
    } else if (tipo === "todos") {
      ini = ""
      fim = ""
    }

    setComparativoDataInicio(ini)
    setComparativoDataFim(fim)
    carregarComparativo({ ini: ini || undefined, fim: fim || undefined })
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarFiltrosIniciais()
      carregarRelatorio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  useEffect(() => {
    if (abaAtiva === "comparativo") {
      carregarComparativo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva])

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault()
    carregarRelatorio()
  }

  const handleFiltrarComparativo = (e: React.FormEvent) => {
    e.preventDefault()
    carregarComparativo()
  }

  const limparFiltros = () => {
    setDataInicio("")
    setDataFim("")
    setPeriodoAtivo("todos")
    setMaterialFiltro("ALL")
    setCidadeFiltro("ALL")
    setVeiculoFiltro("ALL")
    setMotoristaFiltro("ALL")
    setApenasZeradas(false)
    setTimeout(() => {
      if (empresaAtiva) {
        ConcreteiraService.getCargas({ empresaId: empresaAtiva.id }).then(
          setCargas,
        )
      }
    }, 50)
  }

  const handleConfirmarExclusaoCarga = async () => {
    if (!cargaParaExcluir) return
    setExcluindoCarga(true)
    try {
      await ConcreteiraService.excluirCarga(cargaParaExcluir.id)
      toast({
        title: "Carga excluída com sucesso",
        description: `Carga #${cargaParaExcluir.numero_carga} (${cargaParaExcluir.volume_m3} m³) excluída e movimentações de estoque estornadas.`,
      })
      setCargaParaExcluir(null)
      await carregarRelatorio()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Não foi possível excluir a carga",
        description:
          err?.message ||
          "Erro ao excluir a carga. Verifique se existe OS/Recibo vinculado ou tente novamente.",
        variant: "destructive",
      })
    } finally {
      setExcluindoCarga(false)
    }
  }

  const handleImprimir = () => {
    window.print()
  }

  // Agrupamento para ranking de cidades
  const cidadesRanking: Record<string, {
    nome: string
    volume: number
    cargas: number
  }> = {}
  cargas.forEach((c) => {
    const nome = c.cidade_nome || "Não informada"
    if (!cidadesRanking[nome])
      cidadesRanking[nome] = { nome, volume: 0, cargas: 0 }
    if (!c.carga_zerada) cidadesRanking[nome].volume += Number(c.volume_m3)
    cidadesRanking[nome].cargas += 1
  })
  const dadosRankingCidades = Object.values(cidadesRanking)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6)
    .map((c) => ({
      nome: c.nome,
      volume: Number(c.volume.toFixed(1)),
      cargas: c.cargas,
    }))

  // Agrupamento para ranking de caminhões / placas
  const caminhoesRanking: Record<string, {
    placa: string
    volume: number
    cargas: number
  }> = {}
  cargas.forEach((c) => {
    const placa = c.veiculo_placa || "Sem placa"
    if (!caminhoesRanking[placa])
      caminhoesRanking[placa] = { placa, volume: 0, cargas: 0 }
    if (!c.carga_zerada) caminhoesRanking[placa].volume += Number(c.volume_m3)
    caminhoesRanking[placa].cargas += 1
  })
  const dadosRankingCaminhoes = Object.values(caminhoesRanking)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6)
    .map((c) => ({
      placa: c.placa,
      volume: Number(c.volume.toFixed(1)),
      cargas: c.cargas,
    }))

  // Exportar CSV (se balanceiro, omite colunas financeiras)
  const exportarCSV = () => {
    const headers = isAdministrador
      ? [
          "Carga #",
          "Data",
          "Volume (m3)",
          "Traço",
          "Custo Total (R$)",
          "Custo por m3 (R$)",
          `${materiais.find((m) => m.codigo === "cimento")?.nome || "CP II F-40 / CP V ARI"} (kg)`,
          `${materiais.find((m) => m.codigo === "aditivo")?.nome || "Aditivo"} (L)`,
          `${materiais.find((m) => m.codigo === "agua")?.nome || "Água"} (L)`,
          `${materiais.find((m) => m.codigo === "areia")?.nome || "Areia"} (kg)`,
          `${materiais.find((m) => m.codigo === "brita12")?.nome || "Brita 12"} (kg)`,
          `${materiais.find((m) => m.codigo === "brita19")?.nome || "Brita 19"} (kg)`,
          `${materiais.find((m) => m.codigo === "po_pedra")?.nome || "Pó de Pedra"} (kg)`,
          "Motorista",
          "Placa",
          "Cidade",
          "Carga Zerada",
          "Observação",
        ]
      : [
          "Carga #",
          "Data",
          "Volume (m3)",
          "Traço",
          `${materiais.find((m) => m.codigo === "cimento")?.nome || "CP II F-40 / CP V ARI"} (kg)`,
          `${materiais.find((m) => m.codigo === "aditivo")?.nome || "Aditivo"} (L)`,
          `${materiais.find((m) => m.codigo === "agua")?.nome || "Água"} (L)`,
          `${materiais.find((m) => m.codigo === "areia")?.nome || "Areia"} (kg)`,
          `${materiais.find((m) => m.codigo === "brita12")?.nome || "Brita 12"} (kg)`,
          `${materiais.find((m) => m.codigo === "brita19")?.nome || "Brita 19"} (kg)`,
          `${materiais.find((m) => m.codigo === "po_pedra")?.nome || "Pó de Pedra"} (kg)`,
          "Motorista",
          "Placa",
          "Cidade",
          "Carga Zerada",
          "Observação",
        ]

    const rows = cargas.map((c) =>
      isAdministrador
        ? [
            c.numero_carga,
            c.data,
            c.volume_m3,
            `"${c.traco_nome || ""}"`,
            c.custo?.total || 0,
            c.custo?.custoPorM3 || 0,
            c.consumo_cimento,
            c.consumo_aditivo,
            c.consumo_agua || 0,
            c.consumo_areia,
            c.consumo_brita12,
            c.consumo_brita19,
            c.consumo_po_pedra,
            `"${c.motorista_nome || ""}"`,
            `"${c.veiculo_placa || ""}"`,
            `"${c.cidade_nome || ""}"`,
            c.carga_zerada ? "SIM" : "NAO",
            `"${(c.observacao || "").replace(/"/g, '""')}"`,
          ]
        : [
            c.numero_carga,
            c.data,
            c.volume_m3,
            `"${c.traco_nome || ""}"`,
            c.consumo_cimento,
            c.consumo_aditivo,
            c.consumo_agua || 0,
            c.consumo_areia,
            c.consumo_brita12,
            c.consumo_brita19,
            c.consumo_po_pedra,
            `"${c.motorista_nome || ""}"`,
            `"${c.veiculo_placa || ""}"`,
            `"${c.cidade_nome || ""}"`,
            c.carga_zerada ? "SIM" : "NAO",
            `"${(c.observacao || "").replace(/"/g, '""')}"`,
          ],
    )

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `relatorio_${empresaAtiva?.slug || "concreteira"}_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Totais do filtro atual
  const cargasValidas = cargas.filter((c) => !c.carga_zerada)
  const totalVolume = cargasValidas.reduce((a, b) => a + Number(b.volume_m3), 0)
  const totalCusto = cargasValidas.reduce(
    (a, b) => a + (b.custo?.total || 0),
    0,
  )
  const custoMedioM3 = totalVolume > 0 ? totalCusto / totalVolume : 0

  const totalCimento = cargas.reduce((a, b) => a + Number(b.consumo_cimento), 0)
  const totalAditivo = cargas.reduce((a, b) => a + Number(b.consumo_aditivo), 0)
  const totalAgua = cargas.reduce((a, b) => a + Number(b.consumo_agua || 0), 0)
  const totalAreia = cargas.reduce((a, b) => a + Number(b.consumo_areia), 0)
  const totalBrita12 = cargas.reduce((a, b) => a + Number(b.consumo_brita12), 0)
  const totalBrita19 = cargas.reduce((a, b) => a + Number(b.consumo_brita19), 0)
  const totalPoPedra = cargas.reduce(
    (a, b) => a + Number(b.consumo_po_pedra),
    0,
  )

  // Totais de custos por material filtrados
  const custoCimento = cargas.reduce((a, b) => a + (b.custo?.cimento || 0), 0)
  const custoAditivo = cargas.reduce((a, b) => a + (b.custo?.aditivo || 0), 0)
  const custoAgua = cargas.reduce((a, b) => a + (b.custo?.agua || 0), 0)
  const custoAreia = cargas.reduce((a, b) => a + (b.custo?.areia || 0), 0)
  const custoBrita12 = cargas.reduce((a, b) => a + (b.custo?.brita12 || 0), 0)
  const custoBrita19 = cargas.reduce((a, b) => a + (b.custo?.brita19 || 0), 0)
  const custoPoPedra = cargas.reduce((a, b) => a + (b.custo?.po_pedra || 0), 0)

  // Descrição legível dos filtros aplicados para o cabeçalho impresso
  const filtrosDescricao = [
    dataInicio || dataFim
      ? `Período: ${
          dataInicio ? dataInicio.split("-").reverse().join("/") : "Início"
        } até ${dataFim ? dataFim.split("-").reverse().join("/") : "Hoje"}`
      : "Período: Todo o histórico",
    materialFiltro !== "ALL" ? `Material: ${materialFiltro}` : null,
    cidadeFiltro !== "ALL" ? `Cidade: ${cidadeFiltro}` : null,
    motoristaFiltro !== "ALL" ? `Motorista: ${motoristaFiltro}` : null,
    veiculoFiltro !== "ALL" ? `Placa: ${veiculoFiltro}` : null,
    apenasZeradas ? "Apenas Cargas Zeradas/Canceladas" : null,
  ]
    .filter(Boolean)
    .join(" | ")

  const labelPeriodoComparativo = (() => {
    if (
      tipoPeriodoComparativo === "todos" &&
      !comparativoDataInicio &&
      !comparativoDataFim
    ) {
      return "Todo o histórico operacional consolidado"
    }
    if (tipoPeriodoComparativo === "hoje") return "Hoje / Operação do dia"
    if (tipoPeriodoComparativo === "7dias") return "Últimos 7 dias"
    if (tipoPeriodoComparativo === "mes_atual") return "Mês Atual"
    if (tipoPeriodoComparativo === "mes_anterior") return "Mês Anterior"
    const ini = comparativoDataInicio
      ? comparativoDataInicio.split("-").reverse().join("/")
      : "Início"
    const fim = comparativoDataFim
      ? comparativoDataFim.split("-").reverse().join("/")
      : "Hoje"
    return `${ini} até ${fim}`
  })()

  if (isBalanceiro) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">
            Acesso restrito ao Administrador
          </h2>
          <p className="text-xs text-muted-foreground">
            O perfil Balanceiro não possui permissão para visualizar relatórios
            de produção, dados consolidados ou comparativos gerenciais.
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link to="/dashboard">Ir para meu Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO A4 (Visível apenas em window.print) */}
      <div className="print-only border-b-2 border-black pb-3 mb-4 text-black bg-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg font-extrabold uppercase tracking-wider text-black">
                {abaAtiva === "comparativo"
                  ? "GC MIX — RELATÓRIO COMPARATIVO: MONTEIRO × SJE"
                  : `GC MIX — ${empresaAtiva?.razao_social || empresaAtiva?.nome || "CONCRETEIRA"}`}
              </h1>
              <p className="text-xs font-bold text-black">
                {abaAtiva === "comparativo"
                  ? "Comparativo Operacional de Produção, Consumo de Insumos e Custos"
                  : isAdministrador
                    ? "Relatório Operacional, Expedição de Cargas e Auditoria de Custos"
                    : "Relatório de Produção, Expedição de Cargas e Consumo de Insumos"}
              </p>
              {empresaAtiva?.cnpj && abaAtiva !== "comparativo" && (
                <p className="text-[11px] text-black">
                  CNPJ: {empresaAtiva.cnpj}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-black">
            <p className="font-semibold print-only">
              Emitido em {new Date().toLocaleDateString("pt-BR")}
            </p>
            <p className="font-semibold no-print">
              Emissão: {new Date().toLocaleString("pt-BR")}
            </p>
            <p>Padrão A4 • Fundo Branco</p>
          </div>
        </div>
        <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs text-black flex justify-between items-center">
          <div>
            <strong>Período:</strong>{" "}
            {abaAtiva === "comparativo"
              ? labelPeriodoComparativo
              : filtrosDescricao}
          </div>
          <div className="text-right">
            <strong>Unidades:</strong>{" "}
            {abaAtiva === "comparativo"
              ? "Monteiro & SJE"
              : empresaAtiva?.nome || "Ativa"}
          </div>
        </div>
      </div>

      {/* Topo em tela */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            {isAdministrador
              ? "Relatórios, Auditoria e Comparativo"
              : "Relatório de Produção e Expedição"}
            {empresaAtiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdministrador
              ? "Custos de insumos por carga, filtros por material/cidade/motorista e relatório comparativo Monteiro × SJE"
              : "Expedição de cargas, consumos de cimento, areia, britas, água e aditivo no período selecionado"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="default"
            size="sm"
            onClick={handleImprimir}
            className="gap-2 bg-primary text-primary-foreground shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportarCSV}
            disabled={cargas.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (abaAtiva === "operacional") carregarRelatorio()
              else carregarComparativo()
            }}
            disabled={loading || loadingComparativo}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading || loadingComparativo ? "animate-spin" : ""
              }`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* TABS: Relatório da Unidade Ativa vs Comparativo Monteiro × SJE */}
      <Tabs
        value={abaAtiva}
        onValueChange={(v) => handleMudarAba(v as any)}
        className="w-full"
      >
        <TabsList
          className={`no-print grid w-full max-w-2xl ${
            isAdministrador ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <TabsTrigger value="gerencial" className="gap-2">
            <FileText className="w-4 h-4" />
            Gerencial (Mês)
          </TabsTrigger>
          <TabsTrigger value="operacional" className="gap-2">
            <Truck className="w-4 h-4" />
            Relatório Operacional ({empresaAtiva?.nome || "Ativa"})
          </TabsTrigger>
          {isAdministrador && (
            <TabsTrigger value="comparativo" className="gap-2">
              <Scale className="w-4 h-4" />
              Comparativo Monteiro × SJE
            </TabsTrigger>
          )}
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 0: GERENCIAL (MÊS) — 1 PÁGINA A4 COM NÚMEROS GRANDES */}
        {/* ========================================================= */}
        <TabsContent value="gerencial" className="space-y-4 mt-4">
          {/* Barra de Filtros da Competência e Visão de Unidade */}
          <Card className="no-print border-border/40 bg-card/70">
            <CardContent className="py-3 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {/* Seletor de Competência */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  Competência:
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navegarCompetenciaGerencial(-1)}
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Select
                    value={competenciaGerencial}
                    onValueChange={setCompetenciaGerencial}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono w-[145px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026-10">10/2026 (Outubro)</SelectItem>
                      <SelectItem value="2026-09">
                        09/2026 (Setembro)
                      </SelectItem>
                      <SelectItem value="2026-08">08/2026 (Agosto)</SelectItem>
                      <SelectItem value="2026-07">07/2026 (Julho)</SelectItem>
                      <SelectItem value="2026-06">06/2026 (Junho)</SelectItem>
                      <SelectItem value="2026-05">05/2026 (Maio)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navegarCompetenciaGerencial(1)}
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Seletor de Visão da Empresa (Unidade Selecionada ou Consolidado 'Todas') */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4 text-primary" />
                  Visão:
                </span>
                <Select
                  value={visaoGerencialEmpresa}
                  onValueChange={setVisaoGerencialEmpresa}
                >
                  <SelectTrigger className="h-8 text-xs min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">
                      Consolidado (Todas as Unidades)
                    </SelectItem>
                    <SelectItem value="monteiro">Unidade Monteiro</SelectItem>
                    <SelectItem value="sje">
                      Unidade São José do Egito
                    </SelectItem>
                    <SelectItem value="caico">Unidade Caicó</SelectItem>
                    <SelectItem value="patos">Unidade Patos</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={carregarRelatorioGerencial}
                  disabled={loadingGerencial}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      loadingGerencial ? "animate-spin" : ""
                    }`}
                  />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Renderização do Componente A4 */}
          {loadingGerencial && !dadosGerencial ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                Carregando relatório gerencial do mês...
              </p>
            </div>
          ) : dadosGerencial ? (
            <RelatorioGerencialMes
              dados={dadosGerencial}
              carregando={loadingGerencial}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum dado encontrado para a competência selecionada.
            </div>
          )}
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 1: OPERACIONAL E CUSTOS DA UNIDADE ATIVA */}
        {/* ========================================================= */}
        <TabsContent value="operacional" className="space-y-6 mt-4">
          {/* Card de Filtros */}
          <Card className="no-print border-border/40 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Filtros de Pesquisa (Período, Insumo, Cidade, Motorista e Placa)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Botões de Período Rápido */}
              <div className="mb-4 pb-3 border-b border-border/40 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Período Rápido:
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={periodoAtivo === "mes_atual" ? "default" : "outline"}
                  onClick={() => aplicarPeriodoRapidoOperacional("mes_atual")}
                  className="h-7 text-xs font-medium"
                >
                  Mês Corrente
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    periodoAtivo === "mes_anterior" ? "default" : "outline"
                  }
                  onClick={() =>
                    aplicarPeriodoRapidoOperacional("mes_anterior")
                  }
                  className="h-7 text-xs font-medium"
                >
                  Mês Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={periodoAtivo === "anual" ? "default" : "outline"}
                  onClick={() => aplicarPeriodoRapidoOperacional("anual")}
                  className="h-7 text-xs font-medium"
                >
                  Anual ({new Date().getFullYear()})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={periodoAtivo === "todos" ? "default" : "outline"}
                  onClick={() => aplicarPeriodoRapidoOperacional("todos")}
                  className="h-7 text-xs font-medium"
                >
                  Todo o Histórico
                </Button>
              </div>

              <form onSubmit={handleFiltrar} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="dtIni" className="text-xs">
                      Data Início
                    </Label>
                    <Input
                      id="dtIni"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => {
                        setDataInicio(e.target.value)
                        setPeriodoAtivo("personalizado")
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="dtFim" className="text-xs">
                      Data Fim
                    </Label>
                    <Input
                      id="dtFim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => {
                        setDataFim(e.target.value)
                        setPeriodoAtivo("personalizado")
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="matF" className="text-xs">
                      Material Insumo
                    </Label>
                    <Select
                      value={materialFiltro}
                      onValueChange={setMaterialFiltro}
                    >
                      <SelectTrigger id="matF" className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Materiais</SelectItem>
                        <SelectItem value="cimento">
                          {materiais.find((m) => m.codigo === "cimento")
                            ?.nome || "CP II F-40 / CP V ARI"}
                        </SelectItem>
                        <SelectItem value="aditivo">Aditivo</SelectItem>
                        <SelectItem value="agua">Água</SelectItem>
                        <SelectItem value="areia">Areia</SelectItem>
                        <SelectItem value="brita12">Brita 12</SelectItem>
                        <SelectItem value="brita19">Brita 19</SelectItem>
                        <SelectItem value="po_pedra">Pó de Pedra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cidF" className="text-xs">
                      Cidade
                    </Label>
                    <Select
                      value={cidadeFiltro}
                      onValueChange={setCidadeFiltro}
                    >
                      <SelectTrigger id="cidF" className="h-8 text-xs">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas as Cidades</SelectItem>
                        {cidades.map((c) => (
                          <SelectItem key={c.id} value={c.nome}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="veicF" className="text-xs">
                      Placa / Caminhão
                    </Label>
                    <Select
                      value={veiculoFiltro}
                      onValueChange={setVeiculoFiltro}
                    >
                      <SelectTrigger id="veicF" className="h-8 text-xs">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Veículos</SelectItem>
                        {veiculos.map((v) => (
                          <SelectItem key={v.id} value={v.placa}>
                            {v.placa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="motF" className="text-xs">
                      Motorista
                    </Label>
                    <Select
                      value={motoristaFiltro}
                      onValueChange={setMotoristaFiltro}
                    >
                      <SelectTrigger id="motF" className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Motoristas</SelectItem>
                        {motoristas.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-border/40">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="zeradasCheck"
                      checked={apenasZeradas}
                      onCheckedChange={(checked) => setApenasZeradas(!!checked)}
                    />
                    <Label
                      htmlFor="zeradasCheck"
                      className="text-xs cursor-pointer text-muted-foreground"
                    >
                      Filtrar apenas cargas zeradas / canceladas
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={limparFiltros}
                      className="text-xs h-8"
                    >
                      Limpar Filtros
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-primary text-primary-foreground text-xs h-8 gap-1"
                    >
                      <Filter className="w-3 h-3" />
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Resumo Operacional (KPIs financeiros apenas para Administrador) */}
          {isAdministrador ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg border border-border/40 bg-card/60">
                <p className="text-xs text-muted-foreground">
                  Volume Total Filtrado
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  {totalVolume.toFixed(1)} m³
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {cargas.length} cargas (
                  {cargas.filter((c) => c.carga_zerada).length} zeradas)
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Custo Total dos Insumos
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  R${" "}
                  {totalCusto.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Soma de todos insumos consumidos
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/10">
                <p className="text-xs text-primary font-semibold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  Custo Médio dos Insumos / m³
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  R${" "}
                  {custoMedioM3.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Custo médio ponderado por m³
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/40 bg-card/60">
                <p
                  className="text-xs text-muted-foreground truncate"
                  title={
                    materiais.find((m) => m.codigo === "cimento")?.nome ||
                    "CP II F-40 / CP V ARI"
                  }
                >
                  {materiais.find((m) => m.codigo === "cimento")?.nome ||
                    "CP II F-40 / CP V ARI"}{" "}
                  Consumido
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  {(totalCimento / 1000).toFixed(2)} t
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  R${" "}
                  {custoCimento.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/10">
                <p className="text-xs text-primary font-semibold">
                  Volume Total de Concreto
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  {totalVolume.toFixed(1)} m³
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Volume expedido no período
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/40 bg-card/60">
                <p className="text-xs text-muted-foreground">Total de Cargas</p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  {cargas.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {cargas.filter((c) => c.carga_zerada).length} zeradas /
                  canceladas
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/40 bg-card/60">
                <p
                  className="text-xs text-muted-foreground truncate"
                  title={
                    materiais.find((m) => m.codigo === "cimento")?.nome ||
                    "CP II F-40 / CP V ARI"
                  }
                >
                  {materiais.find((m) => m.codigo === "cimento")?.nome ||
                    "CP II F-40 / CP V ARI"}
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  {(totalCimento / 1000).toFixed(2)} t
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalCimento.toLocaleString("pt-BR")} kg consumidos
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/40 bg-card/60">
                <p className="text-xs text-muted-foreground">
                  Consumo de Água & Aditivo
                </p>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  {totalAgua.toLocaleString("pt-BR")} L
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalAditivo.toLocaleString("pt-BR")} L de aditivo
                </p>
              </div>
            </div>
          )}

          {/* Breakdown de Custos por Insumo no Período (Apenas para Administrador) */}
          {isAdministrador ? (
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  Composição de Custos por Material no Filtro Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span
                      className="text-muted-foreground block text-[11px] truncate"
                      title={
                        materiais.find((m) => m.codigo === "cimento")?.nome ||
                        "CP II F-40 / CP V ARI"
                      }
                    >
                      {materiais.find((m) => m.codigo === "cimento")?.nome ||
                        "CP II F-40 / CP V ARI"}
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoCimento.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalCimento.toLocaleString("pt-BR")} kg
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Aditivo
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoAditivo.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalAditivo.toLocaleString("pt-BR")} L
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-cyan-700 dark:text-cyan-300 block text-[11px] font-medium">
                      Água (L)
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoAgua.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalAgua.toLocaleString("pt-BR")} L
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Areia
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoAreia.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalAreia.toLocaleString("pt-BR")} kg
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Brita 12
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoBrita12.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalBrita12.toLocaleString("pt-BR")} kg
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Brita 19
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoBrita19.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalBrita19.toLocaleString("pt-BR")} kg
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Pó de Pedra
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      R$ {custoPoPedra.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalPoPedra.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary" />
                  Consumo Total de Insumos da Operação no Filtro
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px] truncate">
                      Cimento
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {(totalCimento / 1000).toFixed(2)} t
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {totalCimento.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Aditivo
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {totalAditivo.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-cyan-700 dark:text-cyan-300 block text-[11px] font-medium">
                      Água
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {totalAgua.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Areia
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {totalAreia.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Brita 12
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {totalBrita12.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Brita 19
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {totalBrita19.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[11px]">
                      Pó de Pedra
                    </span>
                    <span className="font-mono font-bold text-foreground block text-sm">
                      {totalPoPedra.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rankings: Destinos e Caminhões (apenas em tela) */}
          <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Ranking de Volume por Cidade de Destino (m³)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosRankingCidades}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="nome"
                      stroke="#888"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(val: any) => [`${val} m³`, "Volume"]}
                    />
                    <Bar
                      dataKey="volume"
                      radius={[4, 4, 0, 0]}
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Ranking de Volume por Caminhão / Placa (m³)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosRankingCaminhoes}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="placa"
                      stroke="#888"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(val: any) => [`${val} m³`, "Volume"]}
                    />
                    <Bar
                      dataKey="volume"
                      radius={[4, 4, 0, 0]}
                      fill="#10b981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Cargas com Custos e Consumos */}
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {isAdministrador
                    ? "Tabela Detalhada de Cargas e Custos dos Insumos"
                    : "Tabela Detalhada de Expedição de Cargas & Consumo"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {cargas.length} registros no filtro selecionado
                </CardDescription>
              </div>
              {isAdministrador && (
                <span className="text-xs font-mono text-muted-foreground">
                  Total: R${" "}
                  {totalCusto.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[600px] print:max-h-none print:overflow-visible">
                <table className="w-full text-xs text-left border-collapse print:text-[8pt]">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur print:static print:bg-gray-100 print:text-black">
                    <tr>
                      <th className="py-2.5 px-3">Carga #</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Traço</th>
                      {isAdministrador && (
                        <>
                          <th className="py-2.5 px-3">Custo Total</th>
                          <th className="py-2.5 px-3">Custo/m³</th>
                        </>
                      )}
                      <th className="py-2.5 px-3">
                        {materiais.find((m) => m.codigo === "cimento")?.nome ||
                          "CP II F-40 / CP V ARI"}{" "}
                        (kg)
                      </th>
                      <th className="py-2.5 px-3">Aditivo (L)</th>
                      <th className="py-2.5 px-3">Água (L)</th>
                      <th className="py-2.5 px-3">Areia (kg)</th>
                      <th className="py-2.5 px-3">Britas 12/19</th>
                      <th className="py-2.5 px-3">Motorista</th>
                      <th className="py-2.5 px-3">Placa</th>
                      <th className="py-2.5 px-3">Destino</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                      {isAdministrador && (
                        <th className="py-2.5 px-3 text-center no-print w-12">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {cargas.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-muted/20 transition-colors break-inside-avoid page-break-inside-avoid"
                      >
                        <td className="py-2 px-3 font-mono font-medium text-foreground">
                          #{String(c.numero_carga).padStart(4, "0")}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono">
                          {c.data.split("-").reverse().join("/")}
                        </td>
                        <td className="py-2 px-3 font-bold text-foreground">
                          {Number(c.volume_m3).toFixed(1)} m³
                        </td>
                        <td
                          className="py-2 px-3 max-w-[130px] truncate text-muted-foreground"
                          title={c.traco_nome || ""}
                        >
                          {c.traco_nome || "—"}
                        </td>
                        {isAdministrador && (
                          <>
                            <td className="py-2 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {c.carga_zerada
                                ? "—"
                                : `R$ ${(c.custo?.total || 0).toFixed(2)}`}
                            </td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">
                              {c.carga_zerada || !c.custo?.custoPorM3
                                ? "—"
                                : `R$ ${c.custo.custoPorM3.toFixed(2)}`}
                            </td>
                          </>
                        )}
                        <td className="py-2 px-3 font-mono">
                          {Number(c.consumo_cimento).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {Number(c.consumo_aditivo).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 px-3 font-mono text-cyan-600 dark:text-cyan-400">
                          {Number(c.consumo_agua || 0).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {Number(c.consumo_areia).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">
                          {Number(c.consumo_brita12).toLocaleString("pt-BR")} /{" "}
                          {Number(c.consumo_brita19).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {c.motorista_nome || "—"}
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">
                          {c.veiculo_placa || "—"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {c.cidade_nome || "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {c.carga_zerada ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] uppercase font-bold"
                            >
                              Zerada
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                            >
                              OK
                            </Badge>
                          )}
                        </td>
                        {isAdministrador && (
                          <td className="py-2 px-3 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10"
                                title="Editar carga (Administrador)"
                              >
                                <Link to={`/lancamentos?editar=${c.id}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span className="sr-only">Editar carga</span>
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCargaParaExcluir(c)}
                                className="h-7 w-7 p-0 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10"
                                title="Excluir carga e estornar estoque (Administrador)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="sr-only">Excluir carga</span>
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: RELATÓRIO COMPARATIVO MONTEIRO × SJE (Opção 1) */}
        {/* ========================================================= */}
        <TabsContent value="comparativo" className="space-y-6 mt-4">
          {/* Card Informativo do Comparativo */}
          <div className="no-print bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Relatório Comparativo Monteiro × SJE
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Produção (cargas, volume m³), consumo de insumos (cimento kg,
                aditivo L, água L) e custos (R$, custo/m³) lado a lado com
                impressão PDF em padrão A4.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleImprimir}
                className="gap-2 bg-primary text-primary-foreground shadow-sm text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / PDF A4
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => carregarComparativo()}
                disabled={loadingComparativo}
                className="gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loadingComparativo ? "animate-spin" : ""
                  }`}
                />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtro de Período Rápido e Personalizado (mesmo padrão do Dashboard) */}
          <Card className="no-print border-border/40 bg-card/70">
            <CardHeader className="py-3 px-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  Filtro de Período Comparativo
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {labelPeriodoComparativo}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-[180px]">
                    <Select
                      value={tipoPeriodoComparativo}
                      onValueChange={(val: any) =>
                        aplicarPredefinicaoComparativo(val)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todo o Histórico</SelectItem>
                        <SelectItem value="hoje">Hoje / Último Dia</SelectItem>
                        <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                        <SelectItem value="mes_atual">Mês Atual</SelectItem>
                        <SelectItem value="mes_anterior">
                          Mês Anterior
                        </SelectItem>
                        <SelectItem value="anual">
                          Anual ({new Date().getFullYear()})
                        </SelectItem>
                        <SelectItem value="personalizado">
                          Personalizado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoPeriodoComparativo === "personalizado" && (
                    <form
                      onSubmit={handleFiltrarComparativo}
                      className="flex items-center gap-2 flex-wrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <Label
                          htmlFor="compIni"
                          className="text-xs text-muted-foreground"
                        >
                          De:
                        </Label>
                        <Input
                          id="compIni"
                          type="date"
                          value={comparativoDataInicio}
                          onChange={(e) =>
                            setComparativoDataInicio(e.target.value)
                          }
                          className="h-8 w-36 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Label
                          htmlFor="compFim"
                          className="text-xs text-muted-foreground"
                        >
                          Até:
                        </Label>
                        <Input
                          id="compFim"
                          type="date"
                          value={comparativoDataFim}
                          onChange={(e) =>
                            setComparativoDataFim(e.target.value)
                          }
                          className="h-8 w-36 text-xs"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-primary text-primary-foreground h-8 text-xs gap-1"
                      >
                        <Filter className="w-3 h-3" />
                        Filtrar
                      </Button>
                    </form>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Recorte ativo:{" "}
                  <strong className="text-foreground">
                    {labelPeriodoComparativo}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Comparativos Lado a Lado (Monteiro × SJE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dadosComparativo.unidades.map((u) => {
              const semDados = u.volumeTotal === 0 && u.cargasTotal === 0

              return (
                <Card
                  key={u.empresaId}
                  className={`border-border/40 bg-card/70 overflow-hidden relative ${
                    u.empresaSlug === "monteiro"
                      ? "border-blue-500/30"
                      : "border-emerald-500/30"
                  }`}
                >
                  <div
                    className={`h-2 w-full ${
                      u.empresaSlug === "monteiro"
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          Unidade {u.empresaNome}
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {u.empresaSlug.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {semDados
                            ? "Unidade sem movimentações operacionais no período (catálogo cadastrado)"
                            : `${u.cargasTotal} cargas no período (${u.cargasZeradas} canceladas)`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* KPIs Principais da Unidade */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-background/60 border border-border/30">
                        <span className="text-[11px] text-muted-foreground block">
                          Volume Total
                        </span>
                        <span className="text-xl font-extrabold text-foreground font-mono">
                          {u.volumeTotal.toFixed(1)}
                        </span>{" "}
                        <span className="text-xs text-muted-foreground">
                          m³
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background/60 border border-border/30">
                        <span className="text-[11px] text-muted-foreground block">
                          Custo Total
                        </span>
                        <span className="text-sm font-bold text-foreground font-mono block truncate">
                          R${" "}
                          {u.custoTotal.toLocaleString("pt-BR", {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          insumos
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-[11px] text-primary font-semibold block">
                          Custo / m³
                        </span>
                        <span className="text-lg font-extrabold text-foreground font-mono">
                          R$ {u.custoPorM3.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown de Consumos e Custos de Materiais */}
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Consumo & Custo por Insumo
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/20 border border-border/20">
                          <span
                            className="text-muted-foreground block text-[10px] truncate"
                            title={
                              materiais.find((m) => m.codigo === "cimento")
                                ?.nome || "CP II F-40 / CP V ARI"
                            }
                          >
                            {materiais.find((m) => m.codigo === "cimento")
                              ?.nome || "CP II F-40 / CP V ARI"}
                            : {(u.consumos.cimento / 1000).toFixed(1)} t
                          </span>
                          <span className="font-mono font-semibold">
                            R${" "}
                            {u.custosPorMaterial.cimento.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-muted/20 border border-border/20">
                          <span className="text-muted-foreground block text-[10px]">
                            Aditivo: {u.consumos.aditivo.toFixed(0)} L
                          </span>
                          <span className="font-mono font-semibold">
                            R${" "}
                            {u.custosPorMaterial.aditivo.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-muted/20 border border-border/20">
                          <span className="text-muted-foreground block text-[10px]">
                            Água: {u.consumos.agua.toLocaleString("pt-BR")} L
                          </span>
                          <span className="font-mono font-semibold">
                            R${" "}
                            {u.custosPorMaterial.agua.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-muted/20 border border-border/20">
                          <span className="text-muted-foreground block text-[10px]">
                            Areia:{" "}
                            {(
                              u.consumos.areia /
                              ((u.densidades?.areia || 1.5) * 1000)
                            ).toFixed(2)}{" "}
                            m³
                          </span>
                          <span className="font-mono font-semibold">
                            R${" "}
                            {u.custosPorMaterial.areia.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="block text-[9px] text-muted-foreground">
                            {(u.consumos.areia / 1000).toFixed(1)} t •{" "}
                            {(u.densidades?.areia || 1.5).toFixed(2)} kg/L
                          </span>
                        </div>
                        <div className="p-2 rounded bg-muted/20 border border-border/20">
                          <span className="text-muted-foreground block text-[10px]">
                            Brita 12:{" "}
                            {(
                              u.consumos.brita12 /
                              ((u.densidades?.brita12 || 1.38) * 1000)
                            ).toFixed(2)}{" "}
                            m³
                          </span>
                          <span className="font-mono font-semibold">
                            R${" "}
                            {u.custosPorMaterial.brita12.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                          <span className="block text-[9px] text-muted-foreground">
                            {(u.consumos.brita12 / 1000).toFixed(1)} t •{" "}
                            {(u.densidades?.brita12 || 1.38).toFixed(2)} kg/L
                          </span>
                        </div>
                        <div className="p-2 rounded bg-muted/20 border border-border/20">
                          <span className="text-muted-foreground block text-[10px]">
                            Brita 19:{" "}
                            {(
                              u.consumos.brita19 /
                              ((u.densidades?.brita19 || 1.44) * 1000)
                            ).toFixed(2)}{" "}
                            m³
                          </span>
                          <span className="font-mono font-semibold">
                            R${" "}
                            {u.custosPorMaterial.brita19.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                          <span className="block text-[9px] text-muted-foreground">
                            {(u.consumos.brita19 / 1000).toFixed(1)} t •{" "}
                            {(u.densidades?.brita19 || 1.44).toFixed(2)} kg/L
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Produção e Custo por Traço */}
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Desempenho por Traço ({u.porTraco.length})
                      </span>
                      {u.porTraco.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          Nenhum traço expedido nesta unidade para o período
                          selecionado.
                        </p>
                      ) : (
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-border/20 border rounded-lg bg-background/40">
                          {u.porTraco.map((t) => (
                            <div
                              key={t.tracoNome}
                              className="p-2 flex items-center justify-between text-xs"
                            >
                              <div className="max-w-[180px] truncate">
                                <span className="font-medium text-foreground block truncate">
                                  {t.tracoNome}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {t.cargas} cargas | {t.volume} m³
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-foreground block">
                                  R$ {t.custoPorM3.toFixed(2)}/m³
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Total: R${" "}
                                  {t.custoTotal.toLocaleString("pt-BR", {
                                    maximumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tabela Resumo Comparativo Direto */}
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                Quadro Comparativo Consolidado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="py-2.5 px-3">Indicador Operacional</th>
                      {dadosComparativo.unidades.map((u) => (
                        <th
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right"
                        >
                          Unidade {u.empresaNome}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-right font-bold text-primary">
                        Total Geral / Média
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        Volume Total Expedido
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono font-bold"
                        >
                          {u.volumeTotal.toFixed(1)} m³
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {dadosComparativo.totaisGerais.volumeTotal.toFixed(1)}{" "}
                        m³
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        Quantidade de Cargas
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono"
                        >
                          {u.cargasTotal} ({u.cargasZeradas} zeradas)
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {dadosComparativo.totaisGerais.cargasTotal} cargas
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        Custo Total de Insumos
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400"
                        >
                          R${" "}
                          {u.custoTotal.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        R${" "}
                        {dadosComparativo.totaisGerais.custoTotal.toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                    </tr>
                    <tr className="bg-primary/5 font-semibold">
                      <td className="py-2.5 px-3 text-primary">
                        Custo Médio dos Insumos por m³
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono text-base"
                        >
                          {u.custoPorM3 > 0
                            ? `R$ ${u.custoPorM3.toFixed(2)}/m³`
                            : "Sem dados"}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono text-base text-primary">
                        R$ {dadosComparativo.totaisGerais.custoPorM3.toFixed(2)}
                        /m³
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        Consumo (
                        {materiais.find((m) => m.codigo === "cimento")?.nome ||
                          "CP II F-40 / CP V ARI"}
                        )
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono"
                        >
                          {(u.consumos.cimento / 1000).toFixed(2)} t
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {(
                          dadosComparativo.unidades.reduce(
                            (a, b) => a + b.consumos.cimento,
                            0,
                          ) / 1000
                        ).toFixed(2)}{" "}
                        t
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        Consumo de Aditivo
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono"
                        >
                          {u.consumos.aditivo.toLocaleString("pt-BR")} L
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {dadosComparativo.unidades
                          .reduce((a, b) => a + b.consumos.aditivo, 0)
                          .toLocaleString("pt-BR")}{" "}
                        L
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        Consumo de Água
                      </td>
                      {dadosComparativo.unidades.map((u) => (
                        <td
                          key={u.empresaId}
                          className="py-2.5 px-3 text-right font-mono"
                        >
                          {u.consumos.agua.toLocaleString("pt-BR")} L (
                          {(u.consumos.agua / 1000).toFixed(1)} m³)
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        {dadosComparativo.unidades
                          .reduce((a, b) => a + b.consumos.agua, 0)
                          .toLocaleString("pt-BR")}{" "}
                        L (
                        {(
                          dadosComparativo.unidades.reduce(
                            (a, b) => a + b.consumos.agua,
                            0,
                          ) / 1000
                        ).toFixed(1)}{" "}
                        m³)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        <div>Consumo de Areia</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Densidade cadastrada (t/m³)
                        </div>
                      </td>
                      {dadosComparativo.unidades.map((u) => {
                        const dens = u.densidades?.areia || 1.5
                        const volM3 = u.consumos.areia / (dens * 1000)
                        return (
                          <td
                            key={u.empresaId}
                            className="py-2.5 px-3 text-right font-mono"
                          >
                            <div className="font-semibold text-foreground">
                              {volM3.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              m³
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              R${" "}
                              {u.custosPorMaterial.areia.toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              (
                              {(u.consumos.areia / 1000).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                },
                              )}{" "}
                              t • {dens.toFixed(2)} kg/L)
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        <div>
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) =>
                                a +
                                b.consumos.areia /
                                  ((b.densidades?.areia || 1.5) * 1000),
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                          m³
                        </div>
                        <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          R${" "}
                          {dadosComparativo.unidades
                            .reduce((a, b) => a + b.custosPorMaterial.areia, 0)
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        <div>Consumo de Brita 12</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Densidade cadastrada (t/m³)
                        </div>
                      </td>
                      {dadosComparativo.unidades.map((u) => {
                        const dens = u.densidades?.brita12 || 1.38
                        const volM3 = u.consumos.brita12 / (dens * 1000)
                        return (
                          <td
                            key={u.empresaId}
                            className="py-2.5 px-3 text-right font-mono"
                          >
                            <div className="font-semibold text-foreground">
                              {volM3.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              m³
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              R${" "}
                              {u.custosPorMaterial.brita12.toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              (
                              {(u.consumos.brita12 / 1000).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                },
                              )}{" "}
                              t • {dens.toFixed(2)} kg/L)
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        <div>
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) =>
                                a +
                                b.consumos.brita12 /
                                  ((b.densidades?.brita12 || 1.38) * 1000),
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                          m³
                        </div>
                        <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          R${" "}
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) => a + b.custosPorMaterial.brita12,
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">
                        <div>Consumo de Brita 19</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Densidade cadastrada (t/m³)
                        </div>
                      </td>
                      {dadosComparativo.unidades.map((u) => {
                        const dens = u.densidades?.brita19 || 1.44
                        const volM3 = u.consumos.brita19 / (dens * 1000)
                        return (
                          <td
                            key={u.empresaId}
                            className="py-2.5 px-3 text-right font-mono"
                          >
                            <div className="font-semibold text-foreground">
                              {volM3.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              m³
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              R${" "}
                              {u.custosPorMaterial.brita19.toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              (
                              {(u.consumos.brita19 / 1000).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                },
                              )}{" "}
                              t • {dens.toFixed(2)} kg/L)
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        <div>
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) =>
                                a +
                                b.consumos.brita19 /
                                  ((b.densidades?.brita19 || 1.44) * 1000),
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                          m³
                        </div>
                        <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          R${" "}
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) => a + b.custosPorMaterial.brita19,
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-muted/10 font-semibold">
                      <td className="py-2.5 px-3">
                        <div>Total Britas Consumidas (12 + 19)</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Volume e valor combinado
                        </div>
                      </td>
                      {dadosComparativo.unidades.map((u) => {
                        const d12 = u.densidades?.brita12 || 1.38
                        const d19 = u.densidades?.brita19 || 1.44
                        const vol12 = u.consumos.brita12 / (d12 * 1000)
                        const vol19 = u.consumos.brita19 / (d19 * 1000)
                        const volTotal = vol12 + vol19
                        const custoTotalBritas =
                          u.custosPorMaterial.brita12 +
                          u.custosPorMaterial.brita19
                        return (
                          <td
                            key={u.empresaId}
                            className="py-2.5 px-3 text-right font-mono"
                          >
                            <div className="font-bold text-foreground">
                              {volTotal.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              m³
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              R${" "}
                              {custoTotalBritas.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                        <div>
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) =>
                                a +
                                b.consumos.brita12 /
                                  ((b.densidades?.brita12 || 1.38) * 1000) +
                                b.consumos.brita19 /
                                  ((b.densidades?.brita19 || 1.44) * 1000),
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                          m³
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          R${" "}
                          {dadosComparativo.unidades
                            .reduce(
                              (a, b) =>
                                a +
                                b.custosPorMaterial.brita12 +
                                b.custosPorMaterial.brita19,
                              0,
                            )
                            .toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Modal de Confirmação para Exclusão de Carga (Somente Administrador) */}
      <AlertDialog
        open={!!cargaParaExcluir}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindoCarga) setCargaParaExcluir(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
              Confirmar Exclusão de Carga
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-foreground pt-2">
              <p>
                Deseja realmente excluir esta carga de{" "}
                <strong>
                  {Number(cargaParaExcluir?.volume_m3 || 0).toFixed(1)} m³
                </strong>{" "}
                do dia{" "}
                <strong>
                  {cargaParaExcluir?.data
                    ? cargaParaExcluir.data.split("-").reverse().join("/")
                    : ""}
                </strong>
                {cargaParaExcluir?.numero_carga
                  ? ` (Carga #${cargaParaExcluir.numero_carga})`
                  : ""}
                ?
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-800 dark:text-amber-300">
                <strong>Atenção:</strong> As movimentações de saída de estoque
                geradas por esta carga (cimento e aditivo controlados) serão
                estornadas automaticamente (agregados não possuem controle de
                estoque). Cargas com Recibo / Ordem de Serviço vinculada NÃO
                podem ser excluídas por integridade fiscal e operacional.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoCarga}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmarExclusaoCarga()
              }}
              disabled={excluindoCarga}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {excluindoCarga ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Sim, Excluir Carga
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
