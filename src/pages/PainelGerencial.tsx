import { useState, useEffect, useMemo, useCallback } from "react"
import {
  TrendingUp,
  Truck,
  Boxes,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  Printer,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon,
  MapPin,
  Briefcase,
  HeartPulse,
  Info,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PainelService,
  DadosPainelGerencial,
  ID_EMPRESA_MONTEIRO,
  ID_EMPRESA_SJE,
} from "@/services/painel"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import { cn } from "@/lib/utils"

const CORES_PALETA = [
  "#2563eb", // azul principal
  "#0ea5e9", // azul ciano
  "#10b981", // verde esmeralda
  "#f59e0b", // âmbar
  "#8b5cf6", // roxo
  "#ec4899", // rosa
  "#14b8a6", // teal
  "#64748b", // slate
]

function fmtMoeda(val: number): string {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function fmtDataBr(iso?: string | null): string {
  if (!iso) return "—"
  const [a, m, d] = iso.split("-")
  if (!d) return iso
  return `${d}/${m}/${a}`
}

export function PainelGerencial() {
  const { empresaAtiva, empresas } = useEmpresa()
  const { isBalanceiro, isAdministrador } = useUsuario()

  // Determinar visão inicial de empresa (consolidada por padrão se admin, ou vinculada à selecionada)
  const [modoVisao, setModoVisao] = useState<"todas" | "monteiro" | "sje">(
    () => {
      if (empresaAtiva?.id === ID_EMPRESA_MONTEIRO) return "monteiro"
      if (empresaAtiva?.id === ID_EMPRESA_SJE) return "sje"
      return "todas"
    },
  )

  // Sincroniza com seletor do topo quando o usuário altera no Header
  useEffect(() => {
    if (empresaAtiva?.id === ID_EMPRESA_MONTEIRO) {
      setModoVisao("monteiro")
    } else if (empresaAtiva?.id === ID_EMPRESA_SJE) {
      setModoVisao("sje")
    }
  }, [empresaAtiva?.id])

  // Competência padrão inicial: '2026-09' (última competência ativa com dados consolidados)
  const [competencia, setCompetencia] = useState<string>("2026-09")
  const [dados, setDados] = useState<DadosPainelGerencial | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [abaAlerta, setAbaAlerta] =
    useState<"todos" | "ferias" | "aso" | "estoque">("todos")

  const carregarPainel = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await PainelService.getDadosPainel({
        competencia,
        empresaFiltro: modoVisao,
        empresaAtivaId: empresaAtiva?.id,
      })
      setDados(res)
    } catch (err) {
      console.error("Erro ao carregar dados do painel gerencial:", err)
    } finally {
      setCarregando(false)
    }
  }, [competencia, modoVisao, empresaAtiva?.id])

  useEffect(() => {
    carregarPainel()
  }, [carregarPainel])

  // Rótulo da competência em português (ex: Setembro de 2026)
  const rotuloCompetencia = useMemo(() => {
    if (!competencia) return ""
    const [a, m] = competencia.split("-")
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    const idx = Number(m) - 1
    return `${meses[idx] || m} de ${a}`
  }, [competencia])

  // Navegar entre meses
  const avancarCompetencia = (delta: number) => {
    if (
      !dados?.competenciasDisponiveis ||
      dados.competenciasDisponiveis.length === 0
    ) {
      const [ano, mes] = competencia.split("-").map(Number)
      const data = new Date(ano, mes - 1 + delta, 1)
      const novoAno = data.getFullYear()
      const novoMes = String(data.getMonth() + 1).padStart(2, "0")
      setCompetencia(`${novoAno}-${novoMes}`)
      return
    }

    const idx = dados.competenciasDisponiveis.indexOf(competencia)
    if (idx !== -1) {
      const novoIdx = idx - delta // lista decrescente
      if (novoIdx >= 0 && novoIdx < dados.competenciasDisponiveis.length) {
        setCompetencia(dados.competenciasDisponiveis[novoIdx])
        return
      }
    }

    const [ano, mes] = competencia.split("-").map(Number)
    const data = new Date(ano, mes - 1 + delta, 1)
    const novoAno = data.getFullYear()
    const novoMes = String(data.getMonth() + 1).padStart(2, "0")
    setCompetencia(`${novoAno}-${novoMes}`)
  }

  const handleImprimir = () => {
    window.print()
  }

  const kpis = dados?.kpis
  const alertas = dados?.alertas

  // Nome da unidade no cabeçalho
  const nomeUnidadeVisao = useMemo(() => {
    if (modoVisao === "monteiro") return "Unidade Monteiro"
    if (modoVisao === "sje") return "Unidade SJE / Caldas & Amaral"
    return "Consolidado Geral (Monteiro + SJE)"
  }, [modoVisao])

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          CABEÇALHO EXCLUSIVO PARA IMPRESSÃO A4 PAISAGEM (visível apenas em window.print)
      ========================================================================== */}
      <div className="print-only border-b-2 border-slate-900 pb-3 mb-4 bg-white text-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">
                GC MIX — PAINEL GERENCIAL EXECUTIVO
              </h1>
              <p className="text-xs font-bold text-slate-700">
                Visão Operacional e Estratégica • {nomeUnidadeVisao}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-semibold">Competência: {rotuloCompetencia}</p>
            <p className="text-[10px]">
              Emitido em: {new Date().toLocaleDateString("pt-BR")} às{" "}
              {new Date().toLocaleTimeString("pt-BR")}
            </p>
            <p className="text-[10px] uppercase font-mono text-slate-500">
              Padrão A4 Paisagem
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOPO EM TELA: TÍTULO, SELETOR DE MÊS, SELETOR DE VISÃO E AÇÕES
      ========================================================================== */}
      <div className="no-print flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card/60 p-4 rounded-2xl border border-border/40 shadow-xs backdrop-blur">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Painel Gerencial Executivo
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/30 text-xs font-semibold gap-1"
            >
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              Tempo Real
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Visão consolidada de produção, expedição de concreto, insumos
            operacionais e folha.
          </p>
        </div>

        {/* Controles de Período e Unidade */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Seletor de Visão de Empresa (Consolidada ou Individual) */}
          <Tabs
            value={modoVisao}
            onValueChange={(v) => setModoVisao(v as any)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 h-9 text-xs">
              <TabsTrigger value="todas" className="px-2.5 font-bold">
                Consolidado
              </TabsTrigger>
              <TabsTrigger value="monteiro" className="px-2.5">
                Monteiro
              </TabsTrigger>
              <TabsTrigger value="sje" className="px-2.5">
                SJE
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navegador de Competência */}
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border/60 p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => avancarCompetencia(-1)}
              title="Competência anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger className="h-8 border-0 bg-transparent text-xs font-bold min-w-[130px] focus:ring-0">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {(
                  dados?.competenciasDisponiveis || [
                    "2026-09",
                    "2026-08",
                    "2026-07",
                  ]
                ).map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    className="text-xs font-medium font-mono"
                  >
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => avancarCompetencia(1)}
              title="Próxima competência"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Botão de Atualizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={carregarPainel}
            disabled={carregando}
            className="h-9 gap-1.5 text-xs"
            title="Recarregar dados do painel"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", carregando && "animate-spin")}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {/* Botão Imprimir A4 Paisagem */}
          <Button
            variant="default"
            size="sm"
            onClick={handleImprimir}
            className="h-9 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir A4</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 1: CARDS DE KPIS EXECUTIVOS DO PERÍODO
      ========================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Volume Produzido */}
        <Card className="border-border/40 bg-card/80 relative overflow-hidden shadow-xs hover:border-primary/40 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Volume Total Expedido</span>
              <Truck className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground mt-1">
              {kpis ? kpis.volumeTotalM3.toLocaleString("pt-BR") : "0"}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                m³
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span>Cargas atendidas:</span>
              <span className="font-mono font-bold text-foreground">
                {kpis ? kpis.cargasValidas : 0}{" "}
                {kpis &&
                  kpis.cargasZeradas > 0 &&
                  `(+${kpis.cargasZeradas} zeradas)`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Média por Carga */}
        <Card className="border-border/40 bg-card/80 relative overflow-hidden shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Média por Caminhão</span>
              <Boxes className="w-4 h-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground mt-1">
              {kpis ? kpis.mediaPorCargaM3.toLocaleString("pt-BR") : "0"}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                m³/viagem
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span>Obras / Cidades:</span>
              <span className="font-mono font-bold text-foreground">
                {kpis?.numeroObrasAtendidas ||
                  kpis?.numeroCidadesAtendidas ||
                  0}{" "}
                frentes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Custo Insumos e Faturamento */}
        <Card className="border-border/40 bg-card/80 relative overflow-hidden shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>
                {kpis && kpis.faturamentoEstimado > 0
                  ? "Faturamento das Cargas"
                  : "Custo Total Insumos"}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                {kpis && kpis.faturamentoEstimado > 0 ? "Faturado" : "Insumos"}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground mt-1">
              {kpis && kpis.faturamentoEstimado > 0
                ? fmtMoeda(kpis.faturamentoEstimado)
                : fmtMoeda(kpis ? kpis.custoTotalInsumos : 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span>Custo médio por m³:</span>
              <span className="font-mono font-bold text-foreground">
                {kpis ? fmtMoeda(kpis.custoMedioM3) : "R$ 0,00"}/m³
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Folha de Pagamento do Mês (Oculto para perfil Balanceiro) */}
        {!isBalanceiro ? (
          <Card className="border-border/40 bg-card/80 relative overflow-hidden shadow-xs hover:border-indigo-500/40 transition-colors">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Folha Total (Líquido)</span>
                <Briefcase className="w-4 h-4 text-indigo-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400 mt-1">
                {kpis ? fmtMoeda(kpis.totalFolhaLiquido) : "R$ 0,00"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span>
                  {kpis?.folhaQtdPessoas || 0} pessoas (
                  {kpis ? fmtMoeda(kpis.folhaFuncionarios) : "0"} func. +{" "}
                  {kpis ? fmtMoeda(kpis.folhaTerceiros) : "0"} terc.)
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/40 bg-card/80 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Controle Operacional</span>
                <MapPin className="w-4 h-4 text-amber-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground mt-1">
                {kpis ? kpis.numeroCidadesAtendidas : 0}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  cidades
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span>Cargas no período:</span>
                <span className="font-mono font-bold text-foreground">
                  {kpis ? kpis.totalCargas : 0} viagens
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* =========================================================================
          SEÇÃO 2: EVOLUÇÃO MENSAL (ÚLTIMOS 12 MESES) — GRÁFICO RECHARTS
      ========================================================================== */}
      <Card className="border-border/40 shadow-xs">
        <CardHeader className="py-4 px-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução da Expedição de Concreto (Últimos 12 Meses)
            </CardTitle>
            <CardDescription className="text-xs">
              Volume total produzido em m³ e quantidade de cargas atendidas mês
              a mês.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-primary" />
              <span>Volume (m³)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-400" />
              <span>Cargas</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dados?.evolucao12Meses || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="rotulo"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0", opacity: 0.2 }}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0", opacity: 0.2 }}
                  unit=" m³"
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg text-xs backdrop-blur space-y-1">
                        <p className="font-bold text-foreground">{label}</p>
                        <p className="text-primary font-semibold">
                          Volume:{" "}
                          <span className="font-mono">{data.volumeM3} m³</span>
                        </p>
                        <p className="text-muted-foreground">
                          Cargas:{" "}
                          <span className="font-mono text-foreground">
                            {data.cargas} viagens
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Média:{" "}
                          <span className="font-mono text-foreground">
                            {data.mediaM3PorCarga} m³/carga
                          </span>
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="volumeM3"
                  name="Volume (m³)"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                >
                  {(dados?.evolucao12Meses || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.competencia === competencia
                          ? "hsl(var(--primary))"
                          : "hsl(var(--primary) / 0.5)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          SEÇÃO 3: MIX POR TRAÇO E TOP OBRAS / CLIENTES
      ========================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MIX POR TRAÇO / TIPO DE CONCRETO */}
        <Card className="border-border/40 shadow-xs flex flex-col justify-between">
          <CardHeader className="py-4 px-5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                  Mix por Traço & Tipo de Concreto
                </CardTitle>
                <CardDescription className="text-xs">
                  Participação percentual de cada receita no volume expedido no
                  período.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {dados?.mixTracos.length || 0} tipos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Gráfico de Pizza Donut */}
            {dados?.mixTracos && dados.mixTracos.length > 0 ? (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dados.mixTracos}
                        dataKey="volumeM3"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {dados.mixTracos.map((_, index) => (
                          <Cell
                            key={`traco-${index}`}
                            fill={CORES_PALETA[index % CORES_PALETA.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: any) => [`${value} m³`, "Volume"]}
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Lista descritiva dos traços com barra percentual */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {dados.mixTracos.slice(0, 6).map((traco, idx) => (
                    <div
                      key={traco.nome}
                      className="p-2 rounded-lg bg-muted/30 border border-border/30 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                CORES_PALETA[idx % CORES_PALETA.length],
                            }}
                          />
                          <span className="font-semibold text-foreground truncate max-w-[220px]">
                            {traco.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                          <span className="font-bold text-foreground">
                            {traco.volumeM3} m³
                          </span>
                          <span className="text-muted-foreground">
                            ({traco.percentual}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, traco.percentual)}%`,
                            backgroundColor:
                              CORES_PALETA[idx % CORES_PALETA.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Nenhum traço registrado para esta competência.
              </div>
            )}
          </CardContent>
        </Card>

        {/* TOP CLIENTES / OBRAS DO PERÍODO */}
        <Card className="border-border/40 shadow-xs flex flex-col justify-between">
          <CardHeader className="py-4 px-5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Top Destinos & Clientes do Período
                </CardTitle>
                <CardDescription className="text-xs">
                  Ranking de volume entregue por destino e contratante na
                  competência {competencia}.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Ranking
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {dados?.topCidades && dados.topCidades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold border-b border-border/40">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Destino / Cliente</th>
                      <th className="py-2.5 px-3 text-center">Cargas</th>
                      <th className="py-2.5 px-3 text-right">Volume (m³)</th>
                      <th className="py-2.5 px-3 text-right">% Mix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {dados.topCidades.slice(0, 8).map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {item.nome}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {item.cargas}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {item.volumeM3.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary font-bold">
                          {item.percentual}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Nenhum destino lançado no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          SEÇÃO 4: ALERTAS OPERACIONAIS (FÉRIAS 60 DIAS, EXAMES ASO E ESTOQUE CRÍTICO)
      ========================================================================== */}
      <Card className="border-border/40 shadow-xs">
        <CardHeader className="py-4 px-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base font-bold">
                Alertas Operacionais & Conformidade
              </CardTitle>
              {alertas &&
                (alertas.totalCriticos > 0 || alertas.totalAlertas > 0) && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] font-bold px-1.5 py-0.5"
                  >
                    {alertas.totalCriticos} críticos • {alertas.totalAlertas}{" "}
                    alertas
                  </Badge>
                )}
            </div>
            <CardDescription className="text-xs">
              Monitoramento preventivo de férias de colaboradores, exames
              ocupacionais (ASO/NR-7) e silos com estoque mínimo.
            </CardDescription>
          </div>

          <Tabs
            value={abaAlerta}
            onValueChange={(v) => setAbaAlerta(v as any)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-4 h-8 text-[11px]">
              <TabsTrigger value="todos" className="px-2">
                Todos
              </TabsTrigger>
              <TabsTrigger value="ferias" className="px-2">
                Férias ({alertas?.feriasProximas.length || 0})
              </TabsTrigger>
              <TabsTrigger value="aso" className="px-2">
                ASO ({alertas?.examesCriticos.length || 0})
              </TabsTrigger>
              <TabsTrigger value="estoque" className="px-2">
                Estoque ({alertas?.estoqueBaixo.length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: FÉRIAS PRÓXIMAS (60 DIAS) */}
            {(abaAlerta === "todos" || abaAlerta === "ferias") && (
              <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Férias nos Próximos 60 Dias
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {alertas?.feriasProximas.length || 0}
                  </Badge>
                </div>

                {alertas?.feriasProximas &&
                alertas.feriasProximas.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {alertas.feriasProximas.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-background border border-border/40 text-xs space-y-1 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate max-w-[170px]">
                            {item.nome}
                          </span>
                          <Badge className="bg-blue-600 text-white text-[9px] hover:bg-blue-700">
                            {fmtDataBr(item.ferias)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{item.funcao || "Operacional"}</span>
                          {item.admissao && (
                            <span className="text-[10px]">
                              Adm: {fmtDataBr(item.admissao)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
                    Nenhuma férias agendada nos próximos 60 dias.
                  </div>
                )}
              </div>
            )}

            {/* CARD 2: EXAMES ASO VENCIDOS / A VENCER */}
            {(abaAlerta === "todos" || abaAlerta === "aso") && (
              <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Controle de Exames (ASO)
                    </span>
                  </div>
                  <Badge
                    variant={
                      alertas?.examesCriticos.some(
                        (e) => e.status === "VENCIDO",
                      )
                        ? "destructive"
                        : "outline"
                    }
                    className="text-[10px] font-mono"
                  >
                    {alertas?.examesCriticos.length || 0}
                  </Badge>
                </div>

                {alertas?.examesCriticos &&
                alertas.examesCriticos.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {alertas.examesCriticos.slice(0, 8).map((exame, idx) => {
                      const isVencido = exame.status === "VENCIDO"
                      return (
                        <div
                          key={`${exame.funcionarioNome}-${exame.exameNome}-${idx}`}
                          className={cn(
                            "p-2.5 rounded-lg bg-background border text-xs space-y-1 transition-colors",
                            isVencido
                              ? "border-destructive/40 bg-destructive/5"
                              : "border-amber-500/40 bg-amber-500/5",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground truncate max-w-[160px]">
                              {exame.funcionarioNome}
                            </span>
                            <Badge
                              variant={isVencido ? "destructive" : "outline"}
                              className={cn(
                                "text-[9px] font-bold",
                                !isVencido && "text-amber-600 border-amber-500",
                              )}
                            >
                              {isVencido
                                ? `Vencido há ${Math.abs(exame.dias)}d`
                                : `Vence em ${exame.dias}d`}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{exame.exameNome}</span>
                            <span className="font-mono text-[10px]">
                              {exame.validade
                                ? fmtDataBr(exame.validade)
                                : "Sem data"}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
                    Todos os exames ASO válidos e regulares.
                  </div>
                )}
              </div>
            )}

            {/* CARD 3: ESTOQUE CRÍTICO DE INSUMOS */}
            {(abaAlerta === "todos" || abaAlerta === "estoque") && (
              <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Insumos em Nível Crítico
                    </span>
                  </div>
                  <Badge
                    variant={
                      alertas?.estoqueBaixo && alertas.estoqueBaixo.length > 0
                        ? "destructive"
                        : "outline"
                    }
                    className="text-[10px] font-mono"
                  >
                    {alertas?.estoqueBaixo.length || 0}
                  </Badge>
                </div>

                {alertas?.estoqueBaixo && alertas.estoqueBaixo.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {alertas.estoqueBaixo.map((item) => (
                      <div
                        key={item.material.id}
                        className="p-2.5 rounded-lg bg-background border border-destructive/40 bg-destructive/5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate max-w-[160px]">
                            {item.material.nome}
                          </span>
                          <Badge variant="destructive" className="text-[9px]">
                            Abaixo do Mínimo
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Saldo:{" "}
                            <strong className="text-foreground font-mono">
                              {item.saldo.toLocaleString("pt-BR")}{" "}
                              {item.unidade}
                            </strong>
                          </span>
                          <span className="text-destructive font-mono font-semibold">
                            Mín: {item.minimo.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
                    Silos de cimento e tanques de aditivo com estoque regular.
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PainelGerencial
