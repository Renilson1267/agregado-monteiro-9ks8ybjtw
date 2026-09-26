import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConcreteiraService } from '@/services/concreteira'
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
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { Link } from 'react-router-dom'

export default function Index() {
  const [materiais, setMateriais] = useState<Material[]>([])
  const [cargas, setCargas] = useState<Carga[]>([])
  const [loading, setLoading] = useState(true)

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [mats, crgs] = await Promise.all([
        ConcreteiraService.getMateriais(),
        ConcreteiraService.getCargas(),
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
    carregarDados()
  }, [])

  // Cálculos de KPIs
  // Consideramos data de referência a data mais recente no banco (para exibir dados expressivos se for histórico) ou hoje
  const hojeStr = new Date().toISOString().split('T')[0]
  const ultimaDataStr = cargas.length > 0 ? cargas[0].data : hojeStr
  const mesRefStr = ultimaDataStr.slice(0, 7) // 'YYYY-MM'

  // Cargas do "dia mais recente" e do "mês de referência"
  const cargasDia = cargas.filter(
    (c) => c.data === ultimaDataStr && !c.carga_zerada,
  )
  const volumeDia = cargasDia.reduce((acc, c) => acc + Number(c.volume_m3), 0)

  const cargasMes = cargas.filter((c) => c.data.startsWith(mesRefStr))
  const cargasMesValidas = cargasMes.filter((c) => !c.carga_zerada)
  const volumeMes = cargasMesValidas.reduce(
    (acc, c) => acc + Number(c.volume_m3),
    0,
  )

  // Consumo no mês
  const consumoMes = {
    cimento: cargasMesValidas.reduce(
      (a, c) => a + Number(c.consumo_cimento),
      0,
    ),
    aditivo: cargasMesValidas.reduce(
      (a, c) => a + Number(c.consumo_aditivo),
      0,
    ),
    areia: cargasMesValidas.reduce((a, c) => a + Number(c.consumo_areia), 0),
    brita12: cargasMesValidas.reduce(
      (a, c) => a + Number(c.consumo_brita12),
      0,
    ),
    brita19: cargasMesValidas.reduce(
      (a, c) => a + Number(c.consumo_brita19),
      0,
    ),
    po_pedra: cargasMesValidas.reduce(
      (a, c) => a + Number(c.consumo_po_pedra),
      0,
    ),
  }

  // Alertas de estoque
  const alertasEstoque = materiais.filter(
    (m) => (m.saldo || 0) <= m.estoque_minimo,
  )

  // Gráfico 1: Evolução diária recente (últimas 14 datas de produção)
  const diasAgrupados: Record<
    string,
    { data: string; volume: number; cargas: number }
  > = {}
  cargas.forEach((c) => {
    if (!diasAgrupados[c.data]) {
      diasAgrupados[c.data] = { data: c.data, volume: 0, cargas: 0 }
    }
    if (!c.carga_zerada) {
      diasAgrupados[c.data].volume += Number(c.volume_m3)
    }
    diasAgrupados[c.data].cargas += 1
  })

  const dadosGraficoDias = Object.values(diasAgrupados)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-14)
    .map((d) => ({
      ...d,
      dataFormatada: d.data.slice(5).replace('-', '/'),
      volume: Number(d.volume.toFixed(1)),
    }))

  // Gráfico 2: Evolução por mês de volume
  const mesesAgrupados: Record<
    string,
    { mes: string; volume: number; cargas: number }
  > = {}
  cargas.forEach((c) => {
    const mes = c.data.slice(0, 7)
    if (!mesesAgrupados[mes]) {
      mesesAgrupados[mes] = { mes, volume: 0, cargas: 0 }
    }
    if (!c.carga_zerada) {
      mesesAgrupados[mes].volume += Number(c.volume_m3)
    }
    mesesAgrupados[mes].cargas += 1
  })
  const dadosGraficoMeses = Object.values(mesesAgrupados)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((m) => {
      const [ano, mes] = m.mes.split('-')
      const nomesMes = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ]
      return {
        mesLabel: `${nomesMes[Number(mes) - 1]}/${ano.slice(2)}`,
        volume: Number(m.volume.toFixed(1)),
        cargas: m.cargas,
      }
    })

  // Dados para gráfico de consumo por material (em toneladas ou L)
  const dadosGraficoConsumo = [
    {
      material: 'Cimento (t)',
      valor: Number((consumoMes.cimento / 1000).toFixed(1)),
      fill: '#f59e0b',
    },
    {
      material: 'Areia (t)',
      valor: Number((consumoMes.areia / 1000).toFixed(1)),
      fill: '#eab308',
    },
    {
      material: 'Brita 12 (t)',
      valor: Number((consumoMes.brita12 / 1000).toFixed(1)),
      fill: '#64748b',
    },
    {
      material: 'Brita 19 (t)',
      valor: Number((consumoMes.brita19 / 1000).toFixed(1)),
      fill: '#475569',
    },
    {
      material: 'Pó de Pedra (t)',
      valor: Number((consumoMes.po_pedra / 1000).toFixed(1)),
      fill: '#94a3b8',
    },
    {
      material: 'Aditivo (×10 L)',
      valor: Number((consumoMes.aditivo / 10).toFixed(1)),
      fill: '#06b6d4',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Usina Monteiro</span>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/30"
            >
              Controle Operacional
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhamento diário de produção, expedição de cargas e saldo de
            estoques
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            className="gap-2 bg-primary text-primary-foreground"
          >
            <Link to="/lancamentos">
              <Truck className="w-4 h-4" />
              Lançar Carga
            </Link>
          </Button>
        </div>
      </div>

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

      {/* Grid de KPIs Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Volume do Último Dia
            </CardTitle>
            <Layers className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {volumeDia.toFixed(1)}{' '}
              <span className="text-base font-normal text-muted-foreground">
                m³
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
              Data de ref: {ultimaDataStr.split('-').reverse().join('/')} (
              {cargasDia.length} cargas)
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Volume do Mês de Ref.
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {volumeMes.toFixed(1)}{' '}
              <span className="text-base font-normal text-muted-foreground">
                m³
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>{cargasMes.length} cargas expedidas</span>
              {cargasMes.filter((c) => c.carga_zerada).length > 0 && (
                <span className="text-amber-500">
                  ({cargasMes.filter((c) => c.carga_zerada).length} canceladas)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Saldo Cimento (destaque da planilha) */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estoque Cimento
            </CardTitle>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
              Silo Principal
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
              kg em estoque
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Saldo Aditivo */}
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estoque Aditivo
            </CardTitle>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-semibold">
              Tanque Químico
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

      {/* Gráficos de Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Produção Diária Recente */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Produção Diária (Últimos Dias)</span>
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

        {/* Gráfico 2: Consumo no Mês por Material */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Consumo de Insumos no Mês</span>
              <span className="text-xs font-normal text-muted-foreground">
                Toneladas / Litros
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Total de agregados, cimento e aditivos consumidos nas cargas
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

      {/* Seção Estoque Atual de Materiais */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Saldo Atual de Estoques
            </CardTitle>
            <CardDescription className="text-xs">
              Posição atualizada considerando entradas, saídas automáticas por
              cargas e saldo de abertura
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
            <Link to="/estoque">
              Ver Histórico Completo
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {materiais.map((mat) => {
              const saldo = mat.saldo || 0
              const percentual =
                mat.estoque_minimo > 0
                  ? (saldo / mat.estoque_minimo) * 100
                  : 100
              const estaCritico = saldo <= mat.estoque_minimo

              return (
                <div
                  key={mat.id}
                  className={`p-3 rounded-lg border transition-all ${
                    estaCritico
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border/40 bg-background/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p
                      className="text-xs font-medium text-muted-foreground truncate"
                      title={mat.nome}
                    >
                      {mat.nome}
                    </p>
                    {estaCritico && (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-foreground">
                      {saldo >= 1000
                        ? (saldo / 1000).toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })
                        : saldo.toLocaleString('pt-BR')}
                    </span>{' '}
                    <span className="text-xs text-muted-foreground font-medium">
                      {saldo >= 1000 && mat.unidade === 'kg'
                        ? 't'
                        : mat.unidade}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      Mín:{' '}
                      {mat.estoque_minimo >= 1000
                        ? `${mat.estoque_minimo / 1000}t`
                        : `${mat.estoque_minimo}${mat.unidade}`}
                    </span>
                    <span
                      className={
                        estaCritico
                          ? 'text-destructive font-semibold'
                          : 'text-emerald-500'
                      }
                    >
                      {estaCritico ? 'Baixo' : 'OK'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cargas Recentes na Usina */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Últimas Cargas Despachadas
            </CardTitle>
            <CardDescription className="text-xs">
              Registro contínuo da balança e dosador da usina
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
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
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Traço</th>
                  <th className="py-2.5 px-3">Cimento (kg)</th>
                  <th className="py-2.5 px-3">Aditivo (L)</th>
                  <th className="py-2.5 px-3">Motorista / Placa</th>
                  <th className="py-2.5 px-3">Destino</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {cargas.slice(0, 8).map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      #{String(c.numero_carga).padStart(4, '0')}
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
