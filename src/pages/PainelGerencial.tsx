import { useState, useEffect, useMemo, useCallback, Fragment } from "react"
import {
  TrendingUp,
  Truck,
  Boxes,
  Calendar,
  Printer,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  PieChart as PieChartIcon,
  MapPin,
  Briefcase,
  HeartPulse,
  Coins,
  Send,
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
import { AlertaPedidoCimento } from "@/components/AlertaPedidoCimento"
import {
  LIMITE_AVISO_PEDIDO_CIMENTO_KG,
  FORNECEDOR_CIMENTO,
  calcularNecessidadePedidoCimento,
  gerarLinkWhatsAppPedidoCimento,
} from "@/lib/pedido-cimento"

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
  const { empresas, empresaAtiva } = useEmpresa()
  const { isBalanceiro } = useUsuario()

  // Helper para resolver os dados cadastrais da empresa por slug/nome
  const obterEmpresaPorUnidade = useCallback(
    (slugOuNome?: string) => {
      if (!slugOuNome) return empresaAtiva
      const s = slugOuNome.toLowerCase().trim()
      return (
        empresas.find(
          (e) =>
            e.slug?.toLowerCase() === s ||
            e.nome?.toLowerCase() === s ||
            (s.includes("monteiro") &&
              (e.slug === "monteiro" ||
                e.nome?.toLowerCase().includes("monteiro"))) ||
            (s.includes("sje") &&
              (e.slug === "sje" || e.nome?.toLowerCase().includes("egito"))) ||
            (s.includes("caico") && e.slug === "caico") ||
            (s.includes("patos") && e.slug === "patos"),
        ) || empresaAtiva
      )
    },
    [empresas, empresaAtiva],
  )

  // Determinar visão inicial de empresa (consolidada por padrão se admin, ou vinculada à selecionada)
  const [modoVisao, setModoVisao] = useState<string>(() => {
    if (empresaAtiva?.slug) return empresaAtiva.slug.toLowerCase()
    if (empresaAtiva?.id === ID_EMPRESA_MONTEIRO) return "monteiro"
    if (empresaAtiva?.id === ID_EMPRESA_SJE) return "sje"
    return "todas"
  })

  // Sincroniza com seletor do topo quando o usuário altera no Header
  useEffect(() => {
    if (empresaAtiva?.slug) {
      setModoVisao(empresaAtiva.slug.toLowerCase())
    } else if (empresaAtiva?.id === ID_EMPRESA_MONTEIRO) {
      setModoVisao("monteiro")
    } else if (empresaAtiva?.id === ID_EMPRESA_SJE) {
      setModoVisao("sje")
    }
  }, [empresaAtiva?.id, empresaAtiva?.slug])

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
    if (modoVisao === "caico") return "Unidade Caicó"
    if (modoVisao === "patos") return "Unidade Patos"
    return "Consolidado Geral (Monteiro, SJE, Caicó e Patos)"
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

      {/* BLOCO DE SALDO DE INSUMOS EXCLUSIVO PARA IMPRESSÃO A4 PAISAGEM (LOGO ABAIXO DO CABEÇALHO/KPIS) */}
      <div className="print-only mb-4 border border-slate-300 rounded-lg p-3 bg-white text-black page-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <strong className="text-xs uppercase font-black tracking-wide text-slate-900">
              Saldo de Insumos & Estoque Atual ({nomeUnidadeVisao})
            </strong>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            {
              (dados?.saldosInsumos || []).filter(
                (i) => i.codigo === "cimento" || i.codigo === "aditivo",
              ).length
            }{" "}
            materiais monitorados
          </span>
        </div>

        <table className="w-full text-[10px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase">
              <th className="py-1 px-2">Insumo</th>
              <th className="py-1 px-2">Tipo / Controle</th>
              <th className="py-1 px-2 text-right">Saldo Atual</th>
              <th className="py-1 px-2 text-right">Estoque Mínimo</th>
              {modoVisao === "todas" && (
                <>
                  <th className="py-1 px-2 text-right">Monteiro</th>
                  <th className="py-1 px-2 text-right">SJE</th>
                </>
              )}
              <th className="py-1 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(dados?.saldosInsumos || [])
              .filter(
                (insumo) =>
                  insumo.codigo === "cimento" || insumo.codigo === "aditivo",
              )
              .map((insumo) => {
                const critico = insumo.abaixoMinimo
                return (
                  <tr
                    key={`print-insumo-${insumo.id}`}
                    className={critico ? "bg-rose-50 font-semibold" : ""}
                  >
                    <td className="py-1 px-2 font-bold text-slate-900">
                      {insumo.nome}
                    </td>
                    <td className="py-1 px-2 text-slate-600">
                      {insumo.codigo === "cimento"
                        ? "Silo de Cimento"
                        : insumo.codigo === "aditivo"
                          ? "Tanque de Aditivo"
                          : insumo.controlaEstoque
                            ? "Controlado"
                            : "Consumo"}
                    </td>
                    <td
                      className={`py-1 px-2 text-right font-mono font-bold ${
                        critico ? "text-rose-700" : "text-slate-900"
                      }`}
                    >
                      {insumo.saldo.toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      {insumo.unidade}
                      {insumo.unidade === "kg" && insumo.saldo >= 1000 && (
                        <span className="text-slate-500 font-normal ml-1">
                          ({(insumo.saldo / 1000).toFixed(2)} t)
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-slate-700">
                      {insumo.controlaEstoque && insumo.estoqueMinimo > 0
                        ? `${insumo.estoqueMinimo.toLocaleString("pt-BR")} ${insumo.unidade}`
                        : "—"}
                    </td>
                    {modoVisao === "todas" && (
                      <>
                        <td className="py-1 px-2 text-right font-mono text-slate-700">
                          {(insumo.saldoMonteiro || 0).toLocaleString("pt-BR")}{" "}
                          {insumo.unidade}
                        </td>
                        <td className="py-1 px-2 text-right font-mono text-slate-700">
                          {(insumo.saldoSje || 0).toLocaleString("pt-BR")}{" "}
                          {insumo.unidade}
                        </td>
                      </>
                    )}
                    <td className="py-1 px-2 text-center">
                      {critico ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-200 text-rose-900 font-bold uppercase">
                          Abaixo do Mínimo
                        </span>
                      ) : insumo.controlaEstoque ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-900 font-medium">
                          Regular
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700 font-medium">
                          Consumo
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* BLOCO DE CUSTOS DE INSUMOS EXCLUSIVO PARA IMPRESSÃO A4 PAISAGEM */}
      <div className="print-only mb-4 border border-slate-300 rounded-lg p-3 bg-white text-black page-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <strong className="text-xs uppercase font-black tracking-wide text-slate-900">
              Custos de Insumos da Produção ({rotuloCompetencia} •{" "}
              {nomeUnidadeVisao})
            </strong>
          </div>
          <div className="text-[10px] text-slate-700 font-mono flex items-center gap-3">
            <span>
              Volume:{" "}
              <strong>
                {dados?.custosInsumos?.volumeTotalM3.toLocaleString("pt-BR") ||
                  0}{" "}
                m³
              </strong>
            </span>
            <span>
              Custo Total:{" "}
              <strong className="text-slate-900">
                {fmtMoeda(dados?.custosInsumos?.custoTotalGeral || 0)}
              </strong>
            </span>
            <span>
              Custo/m³:{" "}
              <strong>
                {fmtMoeda(dados?.custosInsumos?.custoMedioPorM3 || 0)}/m³
              </strong>
            </span>
          </div>
        </div>

        <table className="w-full text-[10px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase">
              <th className="py-1 px-2">Insumo</th>
              <th className="py-1 px-2 text-right">Consumo (kg / L)</th>
              <th className="py-1 px-2 text-right">Volume (m³)</th>
              <th className="py-1 px-2 text-right">Custo Médio Unitário</th>
              <th className="py-1 px-2 text-right">Custo Total (R$)</th>
              <th className="py-1 px-2 text-right">% do Custo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(dados?.custosInsumos?.itens || []).map((item) => {
              const ehB19 = item.codigo === "brita19"
              const somatorio = dados?.custosInsumos?.somatorioBritas

              return (
                <Fragment key={`print-custo-${item.codigo}`}>
                  <tr>
                    <td className="py-1 px-2 font-bold text-slate-900">
                      {item.nome}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-slate-800">
                      {item.quantidadeConsumida.toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      {item.unidade}
                      {item.unidade === "kg" &&
                        item.quantidadeConsumida >= 1000 && (
                          <span className="text-slate-500 font-normal ml-1">
                            ({(item.quantidadeConsumida / 1000).toFixed(2)} t)
                          </span>
                        )}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-semibold text-slate-900">
                      {item.quantidadeM3 !== undefined ? (
                        <span>
                          {item.quantidadeM3.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          m³
                          {item.densidade && (
                            <span className="text-slate-500 font-normal ml-1 text-[9px]">
                              (d={item.densidade.toFixed(2)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-slate-600">
                      {item.custoUnitarioMedio > 0
                        ? `R$ ${item.custoUnitarioMedio.toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            },
                          )}/${item.unidade}`
                        : "—"}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">
                      {fmtMoeda(item.custoTotal)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-slate-700">
                      {item.percentualDoTotal.toFixed(1)}%
                    </td>
                  </tr>

                  {/* Linha de SOMATÓRIO BRITAS = B12 + B19 logo após a Brita 19 */}
                  {ehB19 && somatorio && (
                    <tr className="bg-amber-50/80 font-bold border-y border-amber-300 text-slate-900">
                      <td className="py-1 px-2 uppercase text-amber-950 font-black">
                        SOMATÓRIO BRITAS (B12 + B19)
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-amber-950">
                        {somatorio.quantidadeKg.toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        kg
                        {somatorio.quantidadeKg >= 1000 && (
                          <span className="text-slate-600 font-normal ml-1">
                            ({(somatorio.quantidadeKg / 1000).toFixed(2)} t)
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-black text-amber-950">
                        {somatorio.quantidadeM3.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        m³
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-slate-700 font-semibold">
                        {somatorio.custoUnitarioMedioM3 > 0
                          ? `${fmtMoeda(somatorio.custoUnitarioMedioM3)}/m³`
                          : "—"}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-black text-amber-950">
                        {fmtMoeda(somatorio.custoTotal)}
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-amber-950 font-bold">
                        {somatorio.percentualDoTotal.toFixed(1)}%
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-400 bg-slate-100 font-bold text-slate-900">
              <td className="py-1.5 px-2 uppercase">Total de Insumos</td>
              <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                {dados?.custosInsumos?.totalCargasValidas || 0} viagens
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                {dados?.custosInsumos?.volumeTotalM3.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}{" "}
                m³ concreto
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                {fmtMoeda(dados?.custosInsumos?.custoMedioPorM3 || 0)}/m³
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-xs">
                {fmtMoeda(dados?.custosInsumos?.custoTotalGeral || 0)}
              </td>
              <td className="py-1.5 px-2 text-right font-mono">100,0%</td>
            </tr>
          </tfoot>
        </table>
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
          {/* Seletor de Visão de Empresa (Consolidada ou Individual: Monteiro, SJE, Caicó, Patos) */}
          <Tabs
            value={modoVisao}
            onValueChange={(v) => setModoVisao(v)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-5 h-9 text-xs">
              <TabsTrigger
                value="todas"
                className="px-2 font-bold text-[11px] sm:text-xs"
              >
                Consolidado
              </TabsTrigger>
              <TabsTrigger
                value="monteiro"
                className="px-2 text-[11px] sm:text-xs"
              >
                Monteiro
              </TabsTrigger>
              <TabsTrigger value="sje" className="px-2 text-[11px] sm:text-xs">
                SJE
              </TabsTrigger>
              <TabsTrigger
                value="caico"
                className="px-2 text-[11px] sm:text-xs"
              >
                Caicó
              </TabsTrigger>
              <TabsTrigger
                value="patos"
                className="px-2 text-[11px] sm:text-xs"
              >
                Patos
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
          BLOCO PERMANENTE: TESTAR PEDIDO DE CIMENTO (WHATSAPP)
          Visível SEMPRE no Painel Gerencial (independente do saldo estar acima ou abaixo de 20.000 kg).
          Respeita a unidade selecionada (Monteiro/SJE) e visão consolidada.
      ========================================================================== */}
      {(() => {
        const itemCimento = dados?.saldosInsumos?.find(
          (i) => i.codigo === "cimento",
        )
        if (!itemCimento) return null

        // Resolver os dados de cada unidade para alimentar o teste
        const saldoMonteiro =
          itemCimento.saldoMonteiro !== undefined
            ? itemCimento.saldoMonteiro
            : modoVisao === "monteiro"
              ? itemCimento.saldo
              : 0
        const minimoMonteiro =
          (itemCimento as any).minimoMonteiro ||
          (modoVisao === "monteiro" ? itemCimento.estoqueMinimo : 15000) ||
          15000

        const saldoSje =
          itemCimento.saldoSje !== undefined
            ? itemCimento.saldoSje
            : modoVisao === "sje"
              ? itemCimento.saldo
              : 0
        const minimoSje =
          (itemCimento as any).minimoSje ||
          (modoVisao === "sje" ? itemCimento.estoqueMinimo : 15000) ||
          15000

        // Se for Monteiro:
        if (modoVisao === "monteiro") {
          const nec = calcularNecessidadePedidoCimento({
            saldoAtualKg: saldoMonteiro,
            estoqueMinimoKg: minimoMonteiro,
          })
          const empMonteiro = obterEmpresaPorUnidade("monteiro")
          const link = gerarLinkWhatsAppPedidoCimento({
            unidadeNome: "Monteiro",
            saldoAtualKg: saldoMonteiro,
            estoqueMinimoKg: minimoMonteiro,
            empresa: empMonteiro,
          })
          return (
            <div className="no-print rounded-xl border border-emerald-600/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 sm:p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Pedido de Cimento — {FORNECEDOR_CIMENTO.produtoCompleto}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                    >
                      Monteiro
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground border-border/50"
                    >
                      Raquel ({FORNECEDOR_CIMENTO.telefoneFormatado})
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo atual:{" "}
                    <strong className="text-foreground font-mono">
                      {nec.saldo.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({(nec.saldo / 1000).toFixed(2)} t) • Mínimo:{" "}
                    <span className="font-mono">
                      {nec.minimo.toLocaleString("pt-BR")} kg
                    </span>{" "}
                    • Sugerido:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {nec.sugeridoKg.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({nec.carretasSugeridas} {FORNECEDOR_CIMENTO.cif})
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(link, "_blank", "noopener,noreferrer")
                  }
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shrink-0 shadow-sm w-full sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  Testar pedido de cimento
                </Button>
              </div>
            </div>
          )
        }

        // Se for SJE:
        if (modoVisao === "sje") {
          const nec = calcularNecessidadePedidoCimento({
            saldoAtualKg: saldoSje,
            estoqueMinimoKg: minimoSje,
          })
          const empSje = obterEmpresaPorUnidade("sje")
          const link = gerarLinkWhatsAppPedidoCimento({
            unidadeNome: "SJE",
            saldoAtualKg: saldoSje,
            estoqueMinimoKg: minimoSje,
            empresa: empSje,
          })
          return (
            <div className="no-print rounded-xl border border-emerald-600/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 sm:p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Pedido de Cimento — {FORNECEDOR_CIMENTO.produtoCompleto}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                    >
                      SJE
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground border-border/50"
                    >
                      Raquel ({FORNECEDOR_CIMENTO.telefoneFormatado})
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo atual:{" "}
                    <strong className="text-foreground font-mono">
                      {nec.saldo.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({(nec.saldo / 1000).toFixed(2)} t) • Mínimo:{" "}
                    <span className="font-mono">
                      {nec.minimo.toLocaleString("pt-BR")} kg
                    </span>{" "}
                    • Sugerido:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {nec.sugeridoKg.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({nec.carretasSugeridas} {FORNECEDOR_CIMENTO.cif})
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(link, "_blank", "noopener,noreferrer")
                  }
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shrink-0 shadow-sm w-full sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  Testar pedido de cimento
                </Button>
              </div>
            </div>
          )
        }

        // Se for Caicó ou Patos:
        if (modoVisao === "caico" || modoVisao === "patos") {
          const nomeUnidade = modoVisao === "caico" ? "Caicó" : "Patos"
          const saldo = itemCimento.saldo || 0
          const minimo = itemCimento.estoqueMinimo || 15000
          const nec = calcularNecessidadePedidoCimento({
            saldoAtualKg: saldo,
            estoqueMinimoKg: minimo,
          })
          const empOutra = obterEmpresaPorUnidade(modoVisao)
          const link = gerarLinkWhatsAppPedidoCimento({
            unidadeNome: nomeUnidade,
            saldoAtualKg: saldo,
            estoqueMinimoKg: minimo,
            empresa: empOutra,
          })
          return (
            <div className="no-print rounded-xl border border-emerald-600/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 sm:p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Pedido de Cimento — {FORNECEDOR_CIMENTO.produtoCompleto}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                    >
                      {nomeUnidade}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground border-border/50"
                    >
                      Raquel ({FORNECEDOR_CIMENTO.telefoneFormatado})
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo atual:{" "}
                    <strong className="text-foreground font-mono">
                      {nec.saldo.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({(nec.saldo / 1000).toFixed(2)} t) • Sugerido:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {nec.sugeridoKg.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({nec.carretasSugeridas} {FORNECEDOR_CIMENTO.cif})
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(link, "_blank", "noopener,noreferrer")
                  }
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shrink-0 shadow-sm w-full sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  Testar pedido de cimento
                </Button>
              </div>
            </div>
          )
        }

        // Visão Consolidada ("todas"): oferece teste por unidade (Monteiro e SJE) ou consolidado geral
        const empMonteiro = obterEmpresaPorUnidade("monteiro")
        const empSje = obterEmpresaPorUnidade("sje")

        const necMonteiro = calcularNecessidadePedidoCimento({
          saldoAtualKg: saldoMonteiro,
          estoqueMinimoKg: minimoMonteiro,
        })
        const linkMonteiro = gerarLinkWhatsAppPedidoCimento({
          unidadeNome: "Monteiro",
          saldoAtualKg: saldoMonteiro,
          estoqueMinimoKg: minimoMonteiro,
          empresa: empMonteiro,
        })

        const necSje = calcularNecessidadePedidoCimento({
          saldoAtualKg: saldoSje,
          estoqueMinimoKg: minimoSje,
        })
        const linkSje = gerarLinkWhatsAppPedidoCimento({
          unidadeNome: "SJE",
          saldoAtualKg: saldoSje,
          estoqueMinimoKg: minimoSje,
          empresa: empSje,
        })

        const saldoConsolidado = itemCimento.saldo || saldoMonteiro + saldoSje
        const minimoConsolidado = minimoMonteiro + minimoSje
        const necConsolidado = calcularNecessidadePedidoCimento({
          saldoAtualKg: saldoConsolidado,
          estoqueMinimoKg: minimoConsolidado,
        })
        const linkConsolidado = gerarLinkWhatsAppPedidoCimento({
          unidadeNome: "Monteiro e SJE (Consolidado)",
          saldoAtualKg: saldoConsolidado,
          estoqueMinimoKg: minimoConsolidado,
          empresa: empresaAtiva,
        })

        return (
          <div className="no-print rounded-xl border border-emerald-600/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-600/20 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Testar Pedido de Cimento —{" "}
                  {FORNECEDOR_CIMENTO.produtoCompleto}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground border-border/50"
                >
                  Contato Raquel ({FORNECEDOR_CIMENTO.telefoneFormatado})
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Dispara mensagem pronta no WhatsApp (wa.me)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* Card Monteiro */}
              <div className="p-3 rounded-lg bg-background/80 border border-border/50 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <strong className="text-xs text-foreground">
                      Monteiro
                    </strong>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Mín: {necMonteiro.minimo.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Saldo:{" "}
                    <strong className="font-mono text-foreground">
                      {necMonteiro.saldo.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({(necMonteiro.saldo / 1000).toFixed(2)} t) • Sugerido:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {necMonteiro.sugeridoKg.toLocaleString("pt-BR")} kg
                    </strong>
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(linkMonteiro, "_blank", "noopener,noreferrer")
                  }
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  Testar pedido Monteiro
                </Button>
              </div>

              {/* Card SJE */}
              <div className="p-3 rounded-lg bg-background/80 border border-border/50 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <strong className="text-xs text-foreground">SJE</strong>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Mín: {necSje.minimo.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Saldo:{" "}
                    <strong className="font-mono text-foreground">
                      {necSje.saldo.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({(necSje.saldo / 1000).toFixed(2)} t) • Sugerido:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {necSje.sugeridoKg.toLocaleString("pt-BR")} kg
                    </strong>
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(linkSje, "_blank", "noopener,noreferrer")
                  }
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  Testar pedido SJE
                </Button>
              </div>

              {/* Card Consolidado Geral */}
              <div className="p-3 rounded-lg bg-background/80 border border-border/50 flex flex-col justify-between gap-2 md:col-span-2 lg:col-span-1">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <strong className="text-xs text-foreground">
                      Consolidado Geral
                    </strong>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Mín: {necConsolidado.minimo.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Saldo:{" "}
                    <strong className="font-mono text-foreground">
                      {necConsolidado.saldo.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    ({(necConsolidado.saldo / 1000).toFixed(2)} t) • Sugerido:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {necConsolidado.sugeridoKg.toLocaleString("pt-BR")} kg
                    </strong>
                  </p>
                </div>
                <Button
                  onClick={() =>
                    window.open(
                      linkConsolidado,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  size="sm"
                  variant="outline"
                  className="w-full border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs gap-1.5 h-8 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  Testar pedido Consolidado
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* =========================================================================
          AVISO DE PEDIDO AUTOMÁTICO DE CIMENTO (QUANDO SALDO > 0 E < 20.000 KG)
          Válido para as 4 unidades (Monteiro, SJE, Caicó e Patos) apenas quando houver saldo em operação.
      ========================================================================== */}
      {(() => {
        const itemCimento = dados?.saldosInsumos?.find(
          (i) => i.codigo === "cimento",
        )
        if (!itemCimento) return null

        // Se estiver na visão Monteiro:
        if (modoVisao === "monteiro") {
          const saldo =
            itemCimento.saldoMonteiro !== undefined
              ? itemCimento.saldoMonteiro
              : itemCimento.saldo
          const minimo =
            (itemCimento as any).minimoMonteiro ||
            itemCimento.estoqueMinimo ||
            15000
          if (saldo > 0 && saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG) {
            return (
              <div className="no-print">
                <AlertaPedidoCimento
                  unidadeNome="Monteiro"
                  saldoAtualKg={saldo}
                  estoqueMinimoKg={minimo}
                  empresa={obterEmpresaPorUnidade("monteiro")}
                  variante="card"
                />
              </div>
            )
          }
          return null
        }

        // Se estiver na visão SJE:
        if (modoVisao === "sje") {
          const saldo =
            itemCimento.saldoSje !== undefined
              ? itemCimento.saldoSje
              : itemCimento.saldo
          const minimo =
            (itemCimento as any).minimoSje || itemCimento.estoqueMinimo || 15000
          if (saldo > 0 && saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG) {
            return (
              <div className="no-print">
                <AlertaPedidoCimento
                  unidadeNome="SJE"
                  saldoAtualKg={saldo}
                  estoqueMinimoKg={minimo}
                  empresa={obterEmpresaPorUnidade("sje")}
                  variante="card"
                />
              </div>
            )
          }
          return null
        }

        // Se estiver na visão Caicó ou Patos:
        if (modoVisao === "caico" || modoVisao === "patos") {
          const saldo = itemCimento.saldo || 0
          // Se tiver saldo > 0 e menor que 20.000 kg, mostra
          if (saldo > 0 && saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG) {
            return (
              <div className="no-print">
                <AlertaPedidoCimento
                  unidadeNome={modoVisao === "caico" ? "Caicó" : "Patos"}
                  saldoAtualKg={saldo}
                  estoqueMinimoKg={itemCimento.estoqueMinimo || 15000}
                  empresa={obterEmpresaPorUnidade(modoVisao)}
                  variante="card"
                />
              </div>
            )
          }
          return null
        }

        // Se estiver na visão Consolidada ("todas"):
        // Verificar Monteiro e SJE individualmente se tiver os saldos discriminados
        const saldoMonteiro = itemCimento.saldoMonteiro ?? 0
        const saldoSje = itemCimento.saldoSje ?? 0
        const criticoMonteiro =
          saldoMonteiro > 0 && saldoMonteiro < LIMITE_AVISO_PEDIDO_CIMENTO_KG
        const criticoSje =
          saldoSje > 0 && saldoSje < LIMITE_AVISO_PEDIDO_CIMENTO_KG

        if (!criticoMonteiro && !criticoSje) {
          // Se nenhum dos dois específicos foi detectado, mas o saldo total for < 20.000 kg (e > 0)
          if (
            itemCimento.saldo > 0 &&
            itemCimento.saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG
          ) {
            return (
              <div className="no-print">
                <AlertaPedidoCimento
                  unidadeNome="Consolidado"
                  saldoAtualKg={itemCimento.saldo}
                  estoqueMinimoKg={itemCimento.estoqueMinimo || 15000}
                  empresa={empresaAtiva}
                  variante="card"
                />
              </div>
            )
          }
          return null
        }

        return (
          <div className="no-print space-y-3">
            {criticoMonteiro && (
              <AlertaPedidoCimento
                unidadeNome="Monteiro"
                saldoAtualKg={saldoMonteiro}
                estoqueMinimoKg={(itemCimento as any).minimoMonteiro || 15000}
                empresa={obterEmpresaPorUnidade("monteiro")}
                variante="card"
              />
            )}
            {criticoSje && (
              <AlertaPedidoCimento
                unidadeNome="SJE"
                saldoAtualKg={saldoSje}
                estoqueMinimoKg={(itemCimento as any).minimoSje || 15000}
                empresa={obterEmpresaPorUnidade("sje")}
                variante="card"
              />
            )}
          </div>
        )
      })()}

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
          SEÇÃO 1.5: SALDO DE INSUMOS (ESTOQUE ATUAL EM SILOS, TANQUES E MATERIAIS)
      ========================================================================== */}
      <Card className="border-border/40 shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-bold">
                Saldo de Insumos & Estoque Atual
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs font-mono text-primary border-primary/30"
              >
                {nomeUnidadeVisao}
              </Badge>
              {dados?.saldosInsumos
                ?.filter(
                  (s) => s.codigo === "cimento" || s.codigo === "aditivo",
                )
                .some((s) => s.abaixoMinimo) && (
                <Badge
                  variant="destructive"
                  className="text-[10px] font-bold px-1.5 py-0.5"
                >
                  Abaixo do Mínimo
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Posição atual dos insumos no sistema (silos de cimento e tanques
              de aditivo) conforme movimentações cadastradas.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="mr-2">Regular</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Abaixo do Mínimo</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {dados?.saldosInsumos && dados.saldosInsumos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {dados.saldosInsumos
                .filter(
                  (item) =>
                    item.codigo === "cimento" || item.codigo === "aditivo",
                )
                .map((item) => {
                  const critico = item.abaixoMinimo
                  // Âmbar: quando o saldo está na faixa de atenção (próximo do mínimo, até 15% acima ou no limite seguro)
                  const margem = item.saldo - item.estoqueMinimo
                  const atencao =
                    !critico &&
                    item.controlaEstoque &&
                    item.estoqueMinimo > 0 &&
                    margem <= item.estoqueMinimo * 0.15 // ex: 15.623 kg cimento vs mín 15.000 kg (margem 623 kg <= 2.250 kg)
                  const ehCimento = item.codigo === "cimento"
                  const ehAditivo = item.codigo === "aditivo"
                  const saldoTon =
                    item.unidade === "kg" && item.saldo >= 1000
                      ? (item.saldo / 1000).toFixed(2)
                      : null

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border p-3.5 flex flex-col justify-between transition-all bg-card/60 shadow-xs relative overflow-hidden",
                        critico
                          ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
                          : atencao
                            ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10"
                            : "border-border/50 hover:border-border",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0 left-0 right-0 h-1",
                          critico
                            ? "bg-destructive"
                            : atencao
                              ? "bg-amber-500"
                              : item.controlaEstoque
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/30",
                        )}
                      />

                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5 pt-0.5">
                          <div className="min-w-0">
                            <span
                              className="font-bold text-sm text-foreground truncate block"
                              title={item.nome}
                            >
                              {item.nome}
                            </span>
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
                              {ehCimento
                                ? "Silo de Cimento"
                                : ehAditivo
                                  ? "Tanque de Aditivo"
                                  : item.controlaEstoque
                                    ? "Insumo Controlado"
                                    : "Agregado / Consumo"}
                            </span>
                          </div>
                          {critico ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] shrink-0 font-medium"
                            >
                              Abaixo do Mínimo
                            </Badge>
                          ) : atencao ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                            >
                              Atenção / Próximo ao Mínimo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            >
                              Estoque Regular
                            </Badge>
                          )}
                        </div>

                        {/* Saldo Principal */}
                        <div className="my-2">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "text-2xl font-black font-mono tracking-tight",
                                critico
                                  ? "text-destructive"
                                  : atencao
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-foreground",
                              )}
                            >
                              {item.saldo.toLocaleString("pt-BR", {
                                minimumFractionDigits:
                                  item.unidade === "litros" ? 0 : 0,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                              {item.unidade}
                            </span>
                            {saldoTon && (
                              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-muted text-muted-foreground rounded ml-auto">
                                {saldoTon} t
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detalhes de Estoque Mínimo e Visão por Empresa */}
                      <div className="pt-2 border-t border-border/30 text-[11px] space-y-1">
                        {item.controlaEstoque && item.estoqueMinimo > 0 && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Estoque Mínimo:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {item.estoqueMinimo.toLocaleString("pt-BR")}{" "}
                              {item.unidade}
                            </span>
                          </div>
                        )}

                        {/* Discriminação por unidade se for consolidado */}
                        {modoVisao === "todas" &&
                          (item.saldoMonteiro !== undefined ||
                            item.saldoSje !== undefined) && (
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                              <span>
                                Monteiro:{" "}
                                <strong className="text-foreground font-mono">
                                  {(item.saldoMonteiro || 0).toLocaleString(
                                    "pt-BR",
                                  )}
                                </strong>
                              </span>
                              <span>
                                SJE:{" "}
                                <strong className="text-foreground font-mono">
                                  {(item.saldoSje || 0).toLocaleString("pt-BR")}
                                </strong>
                              </span>
                            </div>
                          )}

                        {/* Margem operacional */}
                        {item.controlaEstoque && item.estoqueMinimo > 0 && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-muted-foreground">
                              Margem:
                            </span>
                            <span
                              className={cn(
                                "font-mono font-bold",
                                critico
                                  ? "text-destructive"
                                  : atencao
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {item.saldo - item.estoqueMinimo > 0 ? "+" : ""}
                              {(item.saldo - item.estoqueMinimo).toLocaleString(
                                "pt-BR",
                              )}{" "}
                              {item.unidade}
                            </span>
                          </div>
                        )}

                        {/* Botão de pedido rápido se for cimento e saldo < 20.000 kg */}
                        {ehCimento &&
                          item.saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG &&
                          item.saldo > 0 && (
                            <div className="pt-2">
                              <Button
                                onClick={() => {
                                  const unidadeParaPedido =
                                    modoVisao === "monteiro"
                                      ? "Monteiro"
                                      : modoVisao === "sje"
                                        ? "SJE"
                                        : "Monteiro / SJE"
                                  const emp = obterEmpresaPorUnidade(modoVisao)
                                  const link = gerarLinkWhatsAppPedidoCimento({
                                    unidadeNome: unidadeParaPedido,
                                    saldoAtualKg: item.saldo,
                                    estoqueMinimoKg:
                                      item.estoqueMinimo || 15000,
                                    empresa: emp,
                                  })
                                  window.open(
                                    link,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }}
                                size="sm"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                Pedir pelo WhatsApp
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
              Nenhum insumo encontrado para a unidade selecionada.
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          SEÇÃO 1.6: CUSTOS DE INSUMOS (CONSUMO NO PERÍODO E CUSTO FINANCEIRO EM R$)
      ========================================================================== */}
      <Card className="border-border/40 shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Coins className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-base font-bold">
                Custos de Insumos da Produção
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                {nomeUnidadeVisao}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs font-mono text-muted-foreground"
              >
                Competência: {rotuloCompetencia}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Consumo efetivo dos materiais nas cargas expedidas × custo
              unitário do cadastro no período.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/40 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                Total Insumos
              </span>
              <span className="font-mono font-black text-sm text-foreground">
                {fmtMoeda(dados?.custosInsumos?.custoTotalGeral || 0)}
              </span>
            </div>
            <div className="w-px h-6 bg-border/60" />
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                Custo / m³
              </span>
              <span className="font-mono font-bold text-xs text-primary">
                {fmtMoeda(dados?.custosInsumos?.custoMedioPorM3 || 0)}/m³
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {dados?.custosInsumos && dados.custosInsumos.itens.length > 0 ? (
            <div className="space-y-4">
              {/* Grid de Cards de Custos por Insumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {dados.custosInsumos.itens.map((item) => {
                  const temConsumo = item.quantidadeConsumida > 0
                  return (
                    <div
                      key={`card-custo-${item.codigo}`}
                      className="rounded-xl border border-border/50 bg-card/60 p-3.5 flex flex-col justify-between transition-all hover:border-border shadow-xs relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/70" />
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5 pt-0.5">
                          <div className="min-w-0">
                            <span
                              className="font-bold text-sm text-foreground truncate block"
                              title={item.nome}
                            >
                              {item.nome}
                            </span>
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
                              Consumo em {item.unidade}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono shrink-0"
                          >
                            {item.percentualDoTotal.toFixed(1)}% do total
                          </Badge>
                        </div>

                        {/* Valor em R$ Principal */}
                        <div className="my-2">
                          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground block">
                            {fmtMoeda(item.custoTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Quantidade Consumida, Volume m³ (se aplicável) e Custo Médio Unitário */}
                      <div className="pt-2 border-t border-border/30 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Consumo total:</span>
                          <span className="font-mono font-semibold text-foreground">
                            {item.quantidadeConsumida.toLocaleString("pt-BR", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {item.unidade}
                            {item.unidade === "kg" &&
                              item.quantidadeConsumida >= 1000 && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  (
                                  {(item.quantidadeConsumida / 1000).toFixed(2)}{" "}
                                  t)
                                </span>
                              )}
                          </span>
                        </div>

                        {item.quantidadeM3 !== undefined && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Volume em m³:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {item.quantidadeM3.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              m³
                              {item.densidade && (
                                <span className="text-muted-foreground font-normal text-[10px] ml-1">
                                  (d={item.densidade.toFixed(2)})
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Preço médio:</span>
                          <span className="font-mono text-foreground">
                            {item.custoUnitarioMedio > 0
                              ? `R$ ${item.custoUnitarioMedio.toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 4,
                                  },
                                )}/${item.unidade}`
                              : "—"}
                          </span>
                        </div>

                        {/* Barra percentual proporcional ao custo total */}
                        <div className="pt-1">
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(temConsumo ? 2 : 0, item.percentualDoTotal))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Card Especial de Destaque: SOMATÓRIO BRITAS (B12 + B19) */}
                {dados.custosInsumos.somatorioBritas && (
                  <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 flex flex-col justify-between transition-all shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5 pt-0.5">
                        <div className="min-w-0">
                          <span className="font-black text-sm text-foreground truncate block">
                            SOMATÓRIO BRITAS (B12 + B19)
                          </span>
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono font-bold">
                            Total Agregados Britados
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold"
                        >
                          {dados.custosInsumos.somatorioBritas.percentualDoTotal.toFixed(
                            1,
                          )}
                          % do total
                        </Badge>
                      </div>

                      <div className="my-2">
                        <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-900 dark:text-amber-200 block">
                          {fmtMoeda(
                            dados.custosInsumos.somatorioBritas.custoTotal,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Peso total:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {dados.custosInsumos.somatorioBritas.quantidadeKg.toLocaleString(
                            "pt-BR",
                            { maximumFractionDigits: 2 },
                          )}{" "}
                          kg
                          {dados.custosInsumos.somatorioBritas.quantidadeKg >=
                            1000 && (
                            <span className="text-muted-foreground font-normal ml-1">
                              (
                              {(
                                dados.custosInsumos.somatorioBritas
                                  .quantidadeKg / 1000
                              ).toFixed(2)}{" "}
                              t)
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Volume combinado:</span>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                          {dados.custosInsumos.somatorioBritas.quantidadeM3.toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}{" "}
                          m³
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Custo médio por m³:</span>
                        <span className="font-mono font-bold text-foreground">
                          {dados.custosInsumos.somatorioBritas
                            .custoUnitarioMedioM3 > 0
                            ? `${fmtMoeda(
                                dados.custosInsumos.somatorioBritas
                                  .custoUnitarioMedioM3,
                              )}/m³`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela Sintética Detalhada com Coluna de Volume m³, Linha SOMATÓRIO BRITAS e Rodapé de Totais */}
              <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/40 mt-3">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold border-b border-border/40">
                    <tr>
                      <th className="py-2.5 px-3">Insumo</th>
                      <th className="py-2.5 px-3 text-right">
                        Consumo ({rotuloCompetencia})
                      </th>
                      <th className="py-2.5 px-3 text-right">Volume em m³</th>
                      <th className="py-2.5 px-3 text-right">
                        Custo Unitário Médio
                      </th>
                      <th className="py-2.5 px-3 text-right">
                        Custo Total (R$)
                      </th>
                      <th className="py-2.5 px-3 text-right">% do Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {dados.custosInsumos.itens.map((item) => {
                      const ehB19 = item.codigo === "brita19"
                      const somatorio = dados.custosInsumos.somatorioBritas

                      return (
                        <Fragment key={`tab-custo-${item.codigo}`}>
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {item.nome}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              {item.quantidadeConsumida.toLocaleString(
                                "pt-BR",
                                {
                                  maximumFractionDigits: 2,
                                },
                              )}{" "}
                              {item.unidade}
                              {item.unidade === "kg" &&
                                item.quantidadeConsumida >= 1000 && (
                                  <span className="text-muted-foreground/80 font-normal ml-1 text-[11px]">
                                    (
                                    {(item.quantidadeConsumida / 1000).toFixed(
                                      2,
                                    )}{" "}
                                    t)
                                  </span>
                                )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium text-foreground">
                              {item.quantidadeM3 !== undefined ? (
                                <span className="text-foreground">
                                  {item.quantidadeM3.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  m³
                                  {item.densidade && (
                                    <span className="text-muted-foreground font-normal ml-1 text-[10px]">
                                      (d={item.densidade.toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 font-normal">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              {item.custoUnitarioMedio > 0
                                ? `R$ ${item.custoUnitarioMedio.toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 4,
                                    },
                                  )}/${item.unidade}`
                                : "—"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                              {fmtMoeda(item.custoTotal)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-primary font-semibold">
                              {item.percentualDoTotal.toFixed(1)}%
                            </td>
                          </tr>

                          {/* Linha SOMATÓRIO BRITAS inserida logo após Brita 19 */}
                          {ehB19 && somatorio && (
                            <tr className="bg-amber-500/10 dark:bg-amber-500/15 font-bold border-y border-amber-500/30">
                              <td className="py-2 px-3 uppercase text-amber-900 dark:text-amber-200 font-black">
                                SOMATÓRIO BRITAS (B12 + B19)
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-amber-900 dark:text-amber-200">
                                {somatorio.quantidadeKg.toLocaleString(
                                  "pt-BR",
                                  { maximumFractionDigits: 2 },
                                )}{" "}
                                kg
                                {somatorio.quantidadeKg >= 1000 && (
                                  <span className="text-muted-foreground font-normal ml-1 text-[11px]">
                                    (
                                    {(somatorio.quantidadeKg / 1000).toFixed(2)}{" "}
                                    t)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-amber-800 dark:text-amber-300">
                                {somatorio.quantidadeM3.toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                m³
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                                {somatorio.custoUnitarioMedioM3 > 0
                                  ? `${fmtMoeda(somatorio.custoUnitarioMedioM3)}/m³`
                                  : "—"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black text-amber-900 dark:text-amber-200">
                                {fmtMoeda(somatorio.custoTotal)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-amber-800 dark:text-amber-300 font-bold">
                                {somatorio.percentualDoTotal.toFixed(1)}%
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border/60 bg-muted/40 font-bold text-foreground">
                      <td className="py-2.5 px-3 uppercase text-[11px] tracking-wider">
                        Total de Insumos (
                        {dados.custosInsumos.totalCargasValidas} viagens
                        válidas)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {dados.custosInsumos.itens
                          .reduce((acc, it) => acc + it.quantidadeConsumida, 0)
                          .toLocaleString("pt-BR", {
                            maximumFractionDigits: 0,
                          })}{" "}
                        kg/L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        Volume Concreto:{" "}
                        {dados.custosInsumos.volumeTotalM3.toLocaleString(
                          "pt-BR",
                          { maximumFractionDigits: 2 },
                        )}{" "}
                        m³
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-primary">
                        {fmtMoeda(dados.custosInsumos.custoMedioPorM3)}/m³
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-foreground">
                        {fmtMoeda(dados.custosInsumos.custoTotalGeral)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        100,0%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
              Nenhum lançamento de insumo encontrado para o período selecionado.
            </div>
          )}
        </CardContent>
      </Card>

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
                        {item.material.codigo === "cimento" && (
                          <div className="pt-1">
                            <Button
                              onClick={() => {
                                const unidadeParaPedido =
                                  modoVisao === "sje" ? "SJE" : "Monteiro"
                                const emp = obterEmpresaPorUnidade(modoVisao)
                                const link = gerarLinkWhatsAppPedidoCimento({
                                  unidadeNome: unidadeParaPedido,
                                  saldoAtualKg: item.saldo,
                                  estoqueMinimoKg: item.minimo,
                                  empresa: emp,
                                })
                                window.open(
                                  link,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }}
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-1 h-7"
                            >
                              <Send className="w-3 h-3" />
                              Pedir pelo WhatsApp
                            </Button>
                          </div>
                        )}
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
