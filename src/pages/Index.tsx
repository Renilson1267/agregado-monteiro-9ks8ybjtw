import { useEffect, useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConcreteiraService } from '@/services/concreteira'
import { useEmpresa } from '@/hooks/use-empresa'
import type { Material, Carga } from '@/types/concreteira'
import {
  TrendingUp,
  Truck,
  Layers,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  BarChart2,
  RefreshCw,
  DollarSign,
  Coins,
  Printer,
  Filter,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ReciboImpressao } from '@/components/ReciboImpressao'
import type { OrdemServico } from '@/types/concreteira'

type PeriodoTipo =
  | 'hoje'
  | '7dias'
  | 'mes_atual'
  | 'mes_anterior'
  | 'personalizado'

export default function Index() {
  const { empresaAtiva } = useEmpresa()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [cargas, setCargas] = useState<Carga[]>([])
  const [loading, setLoading] = useState(true)
  const [osParaReimpressao, setOsParaReimpressao] =
    useState<OrdemServico | null>(null)
  const [modalReimpressaoAberta, setModalReimpressaoAberta] = useState(false)

  // Filtros de período
  const [tipoPeriodo, setTipoPeriodo] = useState<PeriodoTipo>('mes_atual')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState('')

  const carregarDados = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [mats, crgs] = await Promise.all([
        ConcreteiraService.getMateriais(empresaAtiva.id),
        ConcreteiraService.getCargas({ empresaId: empresaAtiva.id }),
      ])
      setMateriais(mats)
      setCargas(crgs)
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarDados()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Determinação das datas limites baseadas no período escolhido
  const { dataInicioEfetiva, dataFimEfetiva, labelPeriodo } = useMemo(() => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]

    // Se houver cargas, usamos a data mais recente das cargas ou hoje como âncora
    const dataMaisRecente = cargas.length > 0 ? cargas[0].data : hojeStr
    const dataRefObj = new Date(dataMaisRecente + 'T12:00:00')

    if (tipoPeriodo === 'hoje') {
      return {
        dataInicioEfetiva: dataMaisRecente,
        dataFimEfetiva: dataMaisRecente,
        labelPeriodo: `Hoje / Última Data (${dataMaisRecente.split('-').reverse().join('/')})`,
      }
    }

    if (tipoPeriodo === '7dias') {
      const seteDiasAtras = new Date(dataRefObj)
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6)
      const iniStr = seteDiasAtras.toISOString().split('T')[0]
      return {
        dataInicioEfetiva: iniStr,
        dataFimEfetiva: dataMaisRecente,
        labelPeriodo: `Últimos 7 dias (${iniStr.split('-').reverse().join('/')} a ${dataMaisRecente.split('-').reverse().join('/')})`,
      }
    }

    if (tipoPeriodo === 'mes_atual') {
      const ano = dataRefObj.getFullYear()
      const mes = dataRefObj.getMonth() // 0-11
      const primeiroDia = new Date(ano, mes, 1).toISOString().split('T')[0]
      const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
      const nomeMes = dataRefObj.toLocaleString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
      return {
        dataInicioEfetiva: primeiroDia,
        dataFimEfetiva: ultimoDia,
        labelPeriodo: `Mês Atual (${nomeMes})`,
      }
    }

    if (tipoPeriodo === 'mes_anterior') {
      const ano = dataRefObj.getFullYear()
      const mes = dataRefObj.getMonth() - 1 // Mês anterior
      const primeiroDia = new Date(ano, mes, 1).toISOString().split('T')[0]
      const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
      const dataAntObj = new Date(ano, mes, 1)
      const nomeMes = dataAntObj.toLocaleString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
      return {
        dataInicioEfetiva: primeiroDia,
        dataFimEfetiva: ultimoDia,
        labelPeriodo: `Mês Anterior (${nomeMes})`,
      }
    }

    // Personalizado
    const ini = dataInicioPersonalizada || 'Início'
    const fim = dataFimPersonalizada || 'Hoje'
    return {
      dataInicioEfetiva: dataInicioPersonalizada || undefined,
      dataFimEfetiva: dataFimPersonalizada || undefined,
      labelPeriodo: `Personalizado (${ini.includes('-') ? ini.split('-').reverse().join('/') : ini} a ${fim.includes('-') ? fim.split('-').reverse().join('/') : fim})`,
    }
  }, [tipoPeriodo, dataInicioPersonalizada, dataFimPersonalizada, cargas])

  // Cargas filtradas pelo período ativo
  const cargasFiltradas = useMemo(() => {
    return cargas.filter((c) => {
      if (dataInicioEfetiva && c.data < dataInicioEfetiva) return false
      if (dataFimEfetiva && c.data > dataFimEfetiva) return false
      return true
    })
  }, [cargas, dataInicioEfetiva, dataFimEfetiva])

  // Cargas válidas do período
  const cargasValidasPeriodo = useMemo(() => {
    return cargasFiltradas.filter((c) => !c.carga_zerada)
  }, [cargasFiltradas])

  const cargasZeradasPeriodo = useMemo(() => {
    return cargasFiltradas.filter((c) => c.carga_zerada)
  }, [cargasFiltradas])

  // Cálculos de KPIs no período filtrado
  const volumePeriodo = useMemo(() => {
    return cargasValidasPeriodo.reduce((acc, c) => acc + Number(c.volume_m3), 0)
  }, [cargasValidasPeriodo])

  const custoTotalPeriodo = useMemo(() => {
    return cargasValidasPeriodo.reduce(
      (acc, c) => acc + (c.custo?.total || 0),
      0,
    )
  }, [cargasValidasPeriodo])

  const custoMedioPorM3Periodo = useMemo(() => {
    return volumePeriodo > 0 ? custoTotalPeriodo / volumePeriodo : 0
  }, [volumePeriodo, custoTotalPeriodo])

  // Consumo de materiais no período filtrado
  const consumoPeriodo = useMemo(() => {
    return {
      cimento: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_cimento),
        0,
      ),
      aditivo: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_aditivo),
        0,
      ),
      areia: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_areia),
        0,
      ),
      brita12: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_brita12),
        0,
      ),
      brita19: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_brita19),
        0,
      ),
      po_pedra: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_po_pedra),
        0,
      ),
      agua: cargasValidasPeriodo.reduce(
        (a, c) => a + Number(c.consumo_agua || 0),
        0,
      ),
    }
  }, [cargasValidasPeriodo])

  // Alertas de estoque: materiais com controle de estoque ativo abaixo do mínimo
  const alertasEstoque = useMemo(() => {
    return materiais.filter(
      (m) => m.controla_estoque !== false && (m.saldo || 0) <= m.estoque_minimo,
    )
  }, [materiais])

  // Gráfico 1: Evolução diária no período filtrado
  const dadosGraficoDias = useMemo(() => {
    const diasAgrupados: Record<
      string,
      { data: string; volume: number; cargas: number }
    > = {}

    // Se tiver poucas datas no período filtrado, mostra as do período
    const baseCargas = cargasFiltradas.length > 0 ? cargasFiltradas : cargas

    baseCargas.forEach((c) => {
      if (!diasAgrupados[c.data]) {
        diasAgrupados[c.data] = { data: c.data, volume: 0, cargas: 0 }
      }
      if (!c.carga_zerada) {
        diasAgrupados[c.data].volume += Number(c.volume_m3)
      }
      diasAgrupados[c.data].cargas += 1
    })

    return Object.values(diasAgrupados)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-20) // até 20 dias mais recentes do recorte
      .map((d) => ({
        ...d,
        dataFormatada: d.data.slice(5).replace('-', '/'),
        volume: Number(d.volume.toFixed(1)),
      }))
  }, [cargasFiltradas, cargas])

  // Gráfico 2: Consumo por material no período
  const nomeCimento =
    materiais.find((m) => m.codigo === 'cimento')?.nome ||
    'CP II F-40 / CP V ARI'

  const dadosGraficoConsumo = useMemo(() => {
    return [
      {
        material: `${nomeCimento} (t)`,
        valor: Number((consumoPeriodo.cimento / 1000).toFixed(1)),
        fill: '#f59e0b',
      },
      {
        material: 'Areia (t)',
        valor: Number((consumoPeriodo.areia / 1000).toFixed(1)),
        fill: '#eab308',
      },
      {
        material: 'Brita 12 (t)',
        valor: Number((consumoPeriodo.brita12 / 1000).toFixed(1)),
        fill: '#64748b',
      },
      {
        material: 'Brita 19 (t)',
        valor: Number((consumoPeriodo.brita19 / 1000).toFixed(1)),
        fill: '#475569',
      },
      {
        material: 'Pó de Pedra (t)',
        valor: Number((consumoPeriodo.po_pedra / 1000).toFixed(1)),
        fill: '#94a3b8',
      },
      {
        material: 'Aditivo (×10 L)',
        valor: Number((consumoPeriodo.aditivo / 10).toFixed(1)),
        fill: '#06b6d4',
      },
      {
        material: 'Água (m³)',
        valor: Number((consumoPeriodo.agua / 1000).toFixed(1)),
        fill: '#0284c7',
      },
    ]
  }, [consumoPeriodo, nomeCimento])

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO A4 (visível apenas em window.print) */}
      <div className="print-only border-b border-gray-400 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-black">
              {empresaAtiva?.razao_social ||
                `CONCRETEIRA ${empresaAtiva?.nome?.toUpperCase() || ''}`}
            </h1>
            <p className="text-sm font-semibold text-gray-800">
              Dashboard Gerencial e Operacional — Unidade{' '}
              {empresaAtiva?.nome || ''}
            </p>
            {empresaAtiva?.cnpj && (
              <p className="text-xs text-gray-600">
                CNPJ: {empresaAtiva.cnpj}{' '}
                {empresaAtiva.telefone ? `• Tel: ${empresaAtiva.telefone}` : ''}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Data de Emissão: {new Date().toLocaleString('pt-BR')}</p>
            <p>Relatório A4 Executivo</p>
          </div>
        </div>
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
          <strong>Período Analisado:</strong> {labelPeriodo} |{' '}
          <strong>Cargas no Recorte:</strong> {cargasFiltradas.length} (
          {cargasZeradasPeriodo.length} zeradas) |{' '}
          <strong>Volume Expedido:</strong> {volumePeriodo.toFixed(1)} m³
        </div>
      </div>

      {/* Top Banner & Ações */}
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Usina {empresaAtiva?.nome || 'Concreteira'}</span>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/30"
            >
              Unidade {empresaAtiva?.slug?.toUpperCase() || 'ATIVA'}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhamento de produção, expedição de cargas, custos e saldos de
            estoque
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
            onClick={carregarDados}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            asChild
            size="sm"
            className="gap-2 bg-secondary text-secondary-foreground"
          >
            <Link to="/lancamentos">
              <Truck className="w-4 h-4" />
              Lançar Carga
            </Link>
          </Button>
        </div>
      </div>

      {/* Barra de Filtro de Período do Dashboard */}
      <Card className="no-print bg-card/70 border-border/40 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="w-4 h-4 text-primary" />
              <span>Filtrar Período do Dashboard:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <Select
                value={tipoPeriodo}
                onValueChange={(val) => setTipoPeriodo(val as PeriodoTipo)}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje / Último Dia</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {tipoPeriodo === 'personalizado' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground">De:</Label>
                    <Input
                      type="date"
                      value={dataInicioPersonalizada}
                      onChange={(e) =>
                        setDataInicioPersonalizada(e.target.value)
                      }
                      className="h-9 w-36 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Até:
                    </Label>
                    <Input
                      type="date"
                      value={dataFimPersonalizada}
                      onChange={(e) => setDataFimPersonalizada(e.target.value)}
                      className="h-9 w-36 text-xs"
                    />
                  </div>
                </div>
              )}

              <Badge
                variant="outline"
                className="text-xs font-mono py-1 px-2.5"
              >
                {cargasFiltradas.length} cargas no recorte
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Estoque Baixo */}
      {alertasEstoque.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 text-destructive">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              Alerta de Reposição de Estoque
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Os seguintes materiais estão abaixo ou próximos da margem de
              segurança configurada:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {alertasEstoque.map((m) => (
                <Badge
                  key={m.id}
                  variant="destructive"
                  className="text-xs font-mono"
                >
                  {m.nome}: {m.saldo?.toLocaleString('pt-BR')} {m.unidade} (Mín:{' '}
                  {m.estoque_minimo.toLocaleString('pt-BR')})
                </Badge>
              ))}
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Link to="/estoque">Repor Estoque</Link>
          </Button>
        </div>
      )}

      {/* Grid de KPIs Superiores: Volume & Estoques Alimentados pelo Filtro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Volume Expedido */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Volume Expedido
            </CardTitle>
            <Layers className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {volumePeriodo.toFixed(1)}{' '}
              <span className="text-base font-normal text-muted-foreground">
                m³
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>{labelPeriodo}</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Cargas Expedidas */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cargas Expedidas
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {cargasValidasPeriodo.length}{' '}
              <span className="text-base font-normal text-muted-foreground">
                cargas
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>{cargasFiltradas.length} totais</span>
              {cargasZeradasPeriodo.length > 0 && (
                <span className="text-amber-500 font-medium">
                  ({cargasZeradasPeriodo.length} canceladas)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Saldo Cimento Silo */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate"
              title={nomeCimento}
            >
              Estoque {nomeCimento}
            </CardTitle>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold shrink-0">
              Silo Controlado
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {(
                (materiais.find((m) => m.codigo === 'cimento')?.saldo || 0) /
                1000
              ).toFixed(2)}{' '}
              <span className="text-base font-normal text-muted-foreground">
                ton
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(
                materiais.find((m) => m.codigo === 'cimento')?.saldo || 0
              ).toLocaleString('pt-BR')}{' '}
              kg em estoque atual
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Saldo Aditivo Tanque */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estoque Aditivo
            </CardTitle>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-semibold">
              Tanque Controlado
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {(
                materiais.find((m) => m.codigo === 'aditivo')?.saldo || 0
              ).toLocaleString('pt-BR')}{' '}
              <span className="text-base font-normal text-muted-foreground">
                L
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plastificante e redutor de água
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bloco de Custos dos Insumos Alimentados pelo Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Custo Total Insumos (Período)
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              R${' '}
              {custoTotalPeriodo.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma dos insumos consumidos em {volumePeriodo.toFixed(1)} m³ no
              período
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-primary uppercase tracking-wider">
              Custo Médio dos Insumos por m³
            </CardTitle>
            <Coins className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              R${' '}
              {custoMedioPorM3Periodo.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                / m³
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média ponderada do m³ expedido na unidade
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cimento Consumido (Período)
            </CardTitle>
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {(consumoPeriodo.cimento / 1000).toFixed(2)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                toneladas
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Aditivo: {consumoPeriodo.aditivo.toLocaleString('pt-BR')} L |
              Água: {(consumoPeriodo.agua / 1000).toFixed(1)} m³
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Produção Diária Recente */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Produção Diária (Período)</span>
              <span className="text-xs font-normal text-muted-foreground">
                Volume em m³
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Evolução diária de concreto usinado expedido
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dadosGraficoDias}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="corVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="dataFormatada"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(val: any) => [`${val} m³`, 'Volume Produzido']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#corVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico 2: Consumo no Período por Material */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Consumo de Insumos no Período</span>
              <span className="text-xs font-normal text-muted-foreground">
                Toneladas / Litros
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Total de agregados, cimento e aditivos consumidos nas cargas do
              recorte
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoConsumo}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="material"
                  stroke="#888"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="valor"
                  radius={[4, 4, 0, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seção Estoque Atual de Materiais Controlados (Cimento e Aditivo) */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Saldo dos Insumos com Estoque Controlado
            </CardTitle>
            <CardDescription className="text-xs">
              Apenas Cimento e Aditivo possuem controle contínuo de saldo e
              alerta mínimo. Demais agregados são gerenciados por consumo
              direto.
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="no-print gap-1 text-xs"
          >
            <Link to="/estoque">
              Ver Histórico Completo
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {materiais
              .filter((m) => m.controla_estoque !== false)
              .map((mat) => {
                const saldo = mat.saldo || 0
                const estaCritico = saldo <= mat.estoque_minimo

                return (
                  <div
                    key={mat.id}
                    className={`p-4 rounded-lg border transition-all ${
                      estaCritico
                        ? 'border-destructive/40 bg-destructive/5'
                        : 'border-border/40 bg-background/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {mat.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mat.codigo === 'cimento'
                            ? 'Silo de Cimento'
                            : 'Tanque de Aditivo'}
                        </p>
                      </div>
                      {estaCritico ? (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reposição Necessária
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-emerald-500 border-emerald-500/30"
                        >
                          Regular
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground">
                        {saldo >= 1000
                          ? (saldo / 1000).toLocaleString('pt-BR', {
                              maximumFractionDigits: 2,
                            })
                          : saldo.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        {saldo >= 1000 && mat.unidade === 'kg'
                          ? 'toneladas (t)'
                          : mat.unidade}
                      </span>
                      {saldo >= 1000 && mat.unidade === 'kg' && (
                        <span className="text-xs text-muted-foreground font-mono ml-auto">
                          ({saldo.toLocaleString('pt-BR')} kg)
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-2">
                      <span>
                        Estoque Mínimo de Alerta:{' '}
                        <strong className="text-foreground">
                          {mat.estoque_minimo.toLocaleString('pt-BR')}{' '}
                          {mat.unidade}
                        </strong>
                      </span>
                      <span
                        className={
                          estaCritico
                            ? 'text-destructive font-semibold'
                            : 'text-emerald-500 font-medium'
                        }
                      >
                        Margem:{' '}
                        {(saldo - mat.estoque_minimo).toLocaleString('pt-BR')}{' '}
                        {mat.unidade}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Cargas do Período */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Cargas do Período ({cargasFiltradas.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Expedições registradas na usina no intervalo selecionado (
              {labelPeriodo})
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="no-print gap-1 text-xs"
          >
            <Link to="/relatorios">
              Ver Relatório Detalhado
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                <tr>
                  <th className="py-2.5 px-3">Carga #</th>
                  <th className="py-2.5 px-3">OS</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Traço</th>
                  <th className="py-2.5 px-3">Custo Total</th>
                  <th className="py-2.5 px-3">Custo/m³</th>
                  <th className="py-2.5 px-3">{nomeCimento} (kg)</th>
                  <th className="py-2.5 px-3">Aditivo (L)</th>
                  <th className="py-2.5 px-3">Motorista / Placa</th>
                  <th className="py-2.5 px-3">Destino</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {cargasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-6 text-center text-muted-foreground italic"
                    >
                      Nenhuma carga encontrada para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  cargasFiltradas.slice(0, 15).map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        #{String(c.numero_carga).padStart(4, '0')}
                      </td>
                      <td className="py-2.5 px-3">
                        {c.ordem_servico ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setOsParaReimpressao(c.ordem_servico!)
                              setModalReimpressaoAberta(true)
                            }}
                            className="h-6 px-1.5 text-[10px] font-mono font-bold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                            title="Clique para reimprimir o recibo da OS"
                          >
                            <Printer className="w-3 h-3" />
                            OS {c.ordem_servico.numero_os}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/40 text-[11px]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {c.data.split('-').reverse().join('/')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {Number(c.volume_m3).toFixed(1)} m³
                      </td>
                      <td
                        className="py-2.5 px-3 max-w-[180px] truncate text-muted-foreground"
                        title={c.traco_nome || '—'}
                      >
                        {c.traco_nome || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {c.custo ? `R$ ${c.custo.total.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {c.custo && c.custo.custoPorM3 > 0
                          ? `R$ ${c.custo.custoPorM3.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {Number(c.consumo_cimento).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {Number(c.consumo_aditivo).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {c.motorista_nome ? (
                          `${c.motorista_nome} (${c.veiculo_placa || '—'})`
                        ) : (
                          <span className="text-muted-foreground/50">
                            Não informado
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {c.cidade_nome || (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {c.carga_zerada ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] uppercase font-bold"
                          >
                            Zerada / Cancelada
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                          >
                            Entregue
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {cargasFiltradas.length > 15 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Mostrando as 15 primeiras de {cargasFiltradas.length} cargas do
              período. Acesse Relatórios para exportação completa.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal de Reimpressão de OS a partir da listagem */}
      <Dialog
        open={modalReimpressaoAberta}
        onOpenChange={setModalReimpressaoAberta}
      >
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6 text-base">
              <span className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Reimprimir Ordem de Serviço Nº {osParaReimpressao?.numero_os}
              </span>
              <Button
                type="button"
                onClick={() => window.print()}
                className="gap-2 bg-primary text-primary-foreground text-xs h-8"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo (A4)
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Recibo formatado com dados da carga, transporte, verificação de
              slump, termo de responsabilidade e canhoto.
            </DialogDescription>
          </DialogHeader>

          {osParaReimpressao && empresaAtiva && (
            <div className="mt-2 border rounded-lg p-2 bg-white text-black shadow-inner">
              <ReciboImpressao
                ordem={osParaReimpressao}
                empresa={empresaAtiva}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalReimpressaoAberta(false)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
