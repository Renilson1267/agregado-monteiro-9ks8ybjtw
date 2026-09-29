import { useState, useEffect } from "react"
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
} from "lucide-react"
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
  const { isAdministrador } = useUsuario()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get("tab")
  const [abaAtiva, setAbaAtiva] = useState<"operacional" | "comparativo">(
    tabParam === "comparativo" ? "comparativo" : "operacional",
  )

  useEffect(() => {
    if (tabParam === "comparativo" && abaAtiva !== "comparativo") {
      setAbaAtiva("comparativo")
    } else if (tabParam === "operacional" && abaAtiva !== "operacional") {
      setAbaAtiva("operacional")
    }
  }, [tabParam, abaAtiva])

  const handleMudarAba = (novaAba: "operacional" | "comparativo") => {
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

  // Filtros operacionais
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [materialFiltro, setMaterialFiltro] = useState("ALL")
  const [cidadeFiltro, setCidadeFiltro] = useState("ALL")
  const [veiculoFiltro, setVeiculoFiltro] = useState("ALL")
  const [motoristaFiltro, setMotoristaFiltro] = useState("ALL")
  const [apenasZeradas, setApenasZeradas] = useState(false)

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

  const carregarRelatorio = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const dados = await ConcreteiraService.getCargas({
        empresaId: empresaAtiva.id,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
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
    tipo: "mes_atual" | "hoje" | "7dias" | "mes_anterior" | "personalizado" | "todos",
  ) => {
    setTipoPeriodoComparativo(tipo)
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split("T")[0]

    let ini = ""
    let fim = ""

    if (tipo === "hoje") {
      ini = hojeStr
      fim = hojeStr
    } else if (tipo === "7dias") {
      const d7 = new Date()
      d7.setDate(d7.getDate() - 6)
      ini = d7.toISOString().split("T")[0]
      fim = hojeStr
    } else if (tipo === "mes_atual") {
      const ano = hoje.getFullYear()
      const mes = hoje.getMonth()
      ini = new Date(ano, mes, 1).toISOString().split("T")[0]
      fim = new Date(ano, mes + 1, 0).toISOString().split("T")[0]
    } else if (tipo === "mes_anterior") {
      const ano = hoje.getFullYear()
      const mes = hoje.getMonth() - 1
      ini = new Date(ano, mes, 1).toISOString().split("T")[0]
      fim = new Date(ano, mes + 1, 0).toISOString().split("T")[0]
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

  // Exportar CSV
  const exportarCSV = () => {
    const headers = [
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

    const rows = cargas.map((c) => [
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
    ])

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
                  : "Relatório Operacional, Expedição de Cargas e Auditoria de Custos"}
              </p>
              {empresaAtiva?.cnpj && abaAtiva !== "comparativo" && (
                <p className="text-[11px] text-black">
                  CNPJ: {empresaAtiva.cnpj}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-black">
            <p className="font-semibold">
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
            Relatórios, Auditoria e Comparativo
            {empresaAtiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Custos de insumos por carga, filtros por material/cidade/motorista e
            relatório comparativo Monteiro × SJE
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
        <TabsList className="no-print grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="operacional" className="gap-2">
            <Truck className="w-4 h-4" />
            Relatório da Unidade ({empresaAtiva?.nome || "Ativa"})
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="gap-2">
            <Scale className="w-4 h-4" />
            Comparativo Monteiro × SJE
          </TabsTrigger>
        </TabsList>

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
                      onChange={(e) => setDataInicio(e.target.value)}
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
                      onChange={(e) => setDataFim(e.target.value)}
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

          {/* Resumo de Custos e Totais Operacionais */}
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

          {/* Breakdown de Custos por Insumo no Período */}
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
                  Tabela Detalhada de Cargas e Custos dos Insumos
                </CardTitle>
                <CardDescription className="text-xs">
                  {cargas.length} registros no filtro selecionado
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Total: R${" "}
                {totalCusto.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur">
                    <tr>
                      <th className="py-2.5 px-3">Carga #</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Traço</th>
                      <th className="py-2.5 px-3">Custo Total</th>
                      <th className="py-2.5 px-3">Custo/m³</th>
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
                        className="hover:bg-muted/20 transition-colors"
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
    </div>
  )
}
