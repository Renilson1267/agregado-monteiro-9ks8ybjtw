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
  Target,
  CheckCircle2,
  Clock,
  Pencil,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { MetaProducao } from '@/types/concreteira'
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
  Line,
  ComposedChart,
  Legend,
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
import { printElementInIsolatedIframe } from '@/lib/imprimir-recibo'
import type { OrdemServico } from '@/types/concreteira'
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from '@/assets/logos'

type PeriodoTipo =
  | 'hoje'
  | '7dias'
  | 'mes_atual'
  | 'mes_anterior'
  | 'personalizado'

import { useNavigate } from 'react-router-dom'
import { useUsuario } from '@/hooks/use-usuario'

export default function Index() {
  const navigate = useNavigate()
  const { isBalanceiro, isAdministrador } = useUsuario()
  const { empresaAtiva } = useEmpresa()

  // Se o perfil for Balanceiro, cai direto na expedição (/lancamentos)
  useEffect(() => {
    if (isBalanceiro) {
      navigate('/lancamentos', { replace: true })
    }
  }, [isBalanceiro, navigate])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [cargas, setCargas] = useState<Carga[]>([])
  const [metaProducao, setMetaProducao] = useState<MetaProducao | null>(null)
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
      const [mats, crgs, meta] = await Promise.all([
        ConcreteiraService.getMateriais(empresaAtiva.id),
        ConcreteiraService.getCargas({ empresaId: empresaAtiva.id }),
        ConcreteiraService.getMetaProducao(empresaAtiva.id),
      ])
      setMateriais(mats)
      setCargas(crgs)
      setMetaProducao(meta)
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

  // Cálculos de Metas de Produção (Opção 2)
  const dadosMetas = useMemo(() => {
    const hojeStr = new Date().toISOString().split('T')[0]
    // Data de referência mais recente disponível nas cargas ou hoje
    const dataMaisRecente = cargas.length > 0 ? cargas[0].data : hojeStr
    const dataRefObj = new Date(dataMaisRecente + 'T12:00:00')
    const ano = dataRefObj.getFullYear()
    const mes = String(dataRefObj.getMonth() + 1).padStart(2, '0')
    const chaveMesRef = `${ano}-${mes}`

    // Produção do dia (usa a data mais recente com operação se hoje não tiver cargas)
    const dataDiaConsiderada = cargas.some((c) => c.data === hojeStr)
      ? hojeStr
      : dataMaisRecente

    const volumeDia = cargas
      .filter((c) => c.data === dataDiaConsiderada && !c.carga_zerada)
      .reduce((acc, c) => acc + Number(c.volume_m3 || 0), 0)

    // Produção do mês de referência
    const volumeMes = cargas
      .filter(
        (c) => c.data && c.data.startsWith(chaveMesRef) && !c.carga_zerada,
      )
      .reduce((acc, c) => acc + Number(c.volume_m3 || 0), 0)

    const metaDiaria = Number(metaProducao?.meta_diaria_m3) || 50
    const metaMensal = Number(metaProducao?.meta_mensal_m3) || 1000

    const pctDiario = metaDiaria > 0 ? (volumeDia / metaDiaria) * 100 : 0
    const pctMensal = metaMensal > 0 ? (volumeMes / metaMensal) * 100 : 0

    // Volume do período selecionado pelo filtro vs meta proporcional
    const volumeRecorte = volumePeriodo
    let metaRecorte = metaMensal
    if (tipoPeriodo === 'hoje') {
      metaRecorte = metaDiaria
    } else if (tipoPeriodo === '7dias') {
      metaRecorte = metaDiaria * 7
    }
    const pctRecorte = metaRecorte > 0 ? (volumeRecorte / metaRecorte) * 100 : 0

    return {
      dataDiaConsiderada,
      volumeDia,
      volumeMes,
      metaDiaria,
      metaMensal,
      pctDiario: Math.min(Math.round(pctDiario), 999),
      pctMensal: Math.min(Math.round(pctMensal), 999),
      volumeRecorte,
      metaRecorte,
      pctRecorte: Math.min(Math.round(pctRecorte), 999),
      chaveMesRef,
      atingiuDiario: volumeDia >= metaDiaria,
      atingiuMensal: volumeMes >= metaMensal,
      atingiuRecorte: volumeRecorte >= metaRecorte,
    }
  }, [cargas, metaProducao, volumePeriodo, tipoPeriodo])

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

  // Gráfico 3: Consumo Mensal Integrado (Volume m³, Aditivo L e Custo R$)
  // Respeita o filtro de período ativo do Dashboard (cargasFiltradas)
  const dadosGraficoMensal = useMemo(() => {
    const mesesAgrupados: Record<
      string,
      {
        mesChave: string
        rotulo: string
        volume_m3: number
        aditivo_l: number
        custo_total: number
        cargas: number
      }
    > = {}

    const baseCargas = cargasFiltradas.length > 0 ? cargasFiltradas : cargas

    baseCargas.forEach((c) => {
      if (!c.data) return
      const chave = c.data.slice(0, 7) // 'YYYY-MM'
      if (!mesesAgrupados[chave]) {
        const [ano, mes] = chave.split('-')
        const dataObj = new Date(Number(ano), Number(mes) - 1, 1)
        const rotulo = dataObj
          .toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          })
          .replace('.', '')
        mesesAgrupados[chave] = {
          mesChave: chave,
          rotulo: rotulo.charAt(0).toUpperCase() + rotulo.slice(1),
          volume_m3: 0,
          aditivo_l: 0,
          custo_total: 0,
          cargas: 0,
        }
      }

      if (!c.carga_zerada) {
        mesesAgrupados[chave].volume_m3 += Number(c.volume_m3 || 0)
        mesesAgrupados[chave].aditivo_l += Number(c.consumo_aditivo || 0)
        mesesAgrupados[chave].custo_total += Number(c.custo?.total || 0)
      }
      mesesAgrupados[chave].cargas += 1
    })

    return Object.values(mesesAgrupados)
      .sort((a, b) => a.mesChave.localeCompare(b.mesChave))
      .map((m) => ({
        ...m,
        volume_m3: Number(m.volume_m3.toFixed(1)),
        aditivo_l: Number(m.aditivo_l.toFixed(1)),
        custo_total: Number(m.custo_total.toFixed(2)),
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

  const handleImprimirReciboOS = async () => {
    const el = document.getElementById('recibo-impressao-modal-index')
    if (el) {
      await printElementInIsolatedIframe(el, {
        title: `OS_${osParaReimpressao?.numero_os}_Recibo_GC_MIX`,
        waitForImages: true,
        delayMs: 300,
      })
    } else {
      window.print()
    }
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO A4 (visível apenas em window.print) */}
      <div className="print-only border-b-2 border-black pb-3 mb-4 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wider text-black">
              {empresaAtiva?.razao_social ||
                `CONCRETEIRA ${empresaAtiva?.nome?.toUpperCase() || ''}`}
            </h1>
            <p className="text-sm font-bold text-black">
              Dashboard Gerencial — Relatório de Consumo Mensal e Custos
            </p>
            {empresaAtiva?.cnpj && (
              <p className="text-xs text-black">
                CNPJ: {empresaAtiva.cnpj}{' '}
                {empresaAtiva.telefone ? `• Tel: ${empresaAtiva.telefone}` : ''}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-black">
            <p className="font-semibold">
              Emissão: {new Date().toLocaleString('pt-BR')}
            </p>
            <p>Unidade: {empresaAtiva?.nome || 'Principal'}</p>
          </div>
        </div>
        <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs text-black flex justify-between items-center">
          <div>
            <strong>Filtro de Período:</strong> {labelPeriodo}
          </div>
          <div className="text-right">
            <strong>Volume:</strong> {volumePeriodo.toFixed(1)} m³ |{' '}
            <strong>Aditivo:</strong>{' '}
            {consumoPeriodo.aditivo.toLocaleString('pt-BR')} L |{' '}
            <strong>Custos:</strong> R${' '}
            {custoTotalPeriodo.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* BLOCO EXCLUSIVO DE IMPRESSÃO A4: GRÁFICO E TABELA DE CONSUMO MENSAL (m³, aditivo L, custos R$) */}
      <div className="print-only mb-6 border border-black rounded-lg p-3 bg-white text-black page-break-inside-avoid">
        <div className="flex justify-between items-center border-b border-black pb-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-black uppercase">
              Gráfico de Consumo Mensal e Valores dos Custos (Filtro A4)
            </h2>
            <p className="text-xs text-black">
              Volume expedido (m³), consumo de aditivo (L) e custos dos insumos
              (R$) agrupados por mês
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-black">
            {labelPeriodo}
          </div>
        </div>

        {/* Gráfico Recharts formatado para impressão preto/cinza/legível */}
        <div className="h-[240px] w-full mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dadosGraficoMensal}
              margin={{ top: 15, right: 35, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#999999"
                vertical={false}
              />
              <XAxis
                dataKey="rotulo"
                stroke="#000000"
                fontSize={11}
                tickLine={true}
                tick={{ fill: '#000000', fontWeight: 'bold' }}
              />
              {/* Eixo Esquerdo: Volume m³ e Aditivo L */}
              <YAxis
                yAxisId="left"
                stroke="#000000"
                fontSize={10}
                tickLine={true}
                tick={{ fill: '#000000' }}
                label={{
                  value: 'Volume (m³) / Aditivo (L)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#000000',
                  fontSize: 10,
                  style: { textAnchor: 'middle' },
                }}
              />
              {/* Eixo Direito: Custo Total R$ */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#000000"
                fontSize={10}
                tickLine={true}
                tick={{ fill: '#000000' }}
                label={{
                  value: 'Custo Total (R$)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#000000',
                  fontSize: 10,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '11px',
                  color: '#000000',
                  paddingTop: '6px',
                }}
              />
              {/* Barras e Linhas com tons sólidos e contornos visíveis em impressão PB */}
              <Bar
                yAxisId="left"
                dataKey="volume_m3"
                name="Volume (m³)"
                fill="#333333"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="aditivo_l"
                name="Aditivo (L)"
                fill="#777777"
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="custo_total"
                name="Custo Total (R$)"
                stroke="#000000"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#000000' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Apoio dos Valores Mensais na Impressão */}
        <table className="w-full text-xs text-left border-collapse border border-black mt-2">
          <thead>
            <tr className="bg-gray-200 text-black border-b border-black font-bold">
              <th className="py-1 px-2 border-r border-black">Mês</th>
              <th className="py-1 px-2 border-r border-black text-right">
                Cargas
              </th>
              <th className="py-1 px-2 border-r border-black text-right">
                Volume (m³)
              </th>
              <th className="py-1 px-2 border-r border-black text-right">
                Aditivo (L)
              </th>
              <th className="py-1 px-2 border-r border-black text-right">
                Custo Total (R$)
              </th>
              <th className="py-1 px-2 text-right">Custo Médio / m³</th>
            </tr>
          </thead>
          <tbody>
            {dadosGraficoMensal.map((m) => {
              const custoMedioM3 =
                m.volume_m3 > 0 ? m.custo_total / m.volume_m3 : 0
              return (
                <tr key={m.mesChave} className="border-b border-gray-300">
                  <td className="py-1 px-2 border-r border-black font-bold">
                    {m.rotulo}
                  </td>
                  <td className="py-1 px-2 border-r border-black text-right font-mono">
                    {m.cargas}
                  </td>
                  <td className="py-1 px-2 border-r border-black text-right font-mono font-semibold">
                    {m.volume_m3.toFixed(1)} m³
                  </td>
                  <td className="py-1 px-2 border-r border-black text-right font-mono font-semibold">
                    {m.aditivo_l.toLocaleString('pt-BR')} L
                  </td>
                  <td className="py-1 px-2 border-r border-black text-right font-mono font-semibold">
                    R${' '}
                    {m.custo_total.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-1 px-2 text-right font-mono">
                    R${' '}
                    {custoMedioM3.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              )
            })}
            <tr className="bg-gray-100 font-bold border-t-2 border-black">
              <td className="py-1.5 px-2 border-r border-black">
                TOTAL DO PERÍODO
              </td>
              <td className="py-1.5 px-2 border-r border-black text-right font-mono">
                {cargasValidasPeriodo.length}
              </td>
              <td className="py-1.5 px-2 border-r border-black text-right font-mono">
                {volumePeriodo.toFixed(1)} m³
              </td>
              <td className="py-1.5 px-2 border-r border-black text-right font-mono">
                {consumoPeriodo.aditivo.toLocaleString('pt-BR')} L
              </td>
              <td className="py-1.5 px-2 border-r border-black text-right font-mono">
                R${' '}
                {custoTotalPeriodo.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="py-1.5 px-2 text-right font-mono">
                R${' '}
                {custoMedioPorM3Periodo.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Top Banner & Ações com Logo Oficial GC MIX */}
      <div className="no-print flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-border/60 shadow-sm shrink-0">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[210px] object-contain rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
              <span>Usina {empresaAtiva?.nome || 'Concreteira'}</span>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold"
              >
                Unidade {empresaAtiva?.slug?.toUpperCase() || 'ATIVA'}
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              GC MIX Concreto Usinado & Pedreira Cordeiro — Produção, expedição
              e estoques
            </p>
          </div>
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

      {/* CARD DE METAS DE PRODUÇÃO (Opção 2 - Realizado vs Meta Diária e Mensal) */}
      <Card className="no-print border-border/50 bg-gradient-to-r from-card/90 via-card/60 to-primary/5 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <span>
                    Metas de Produção — {empresaAtiva?.nome || 'Unidade'}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono uppercase bg-background/50"
                  >
                    Realizado vs Meta
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Acompanhamento diário e mensal de volume expedido (m³) com
                  status visual de atingimento.
                </CardDescription>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8 self-start sm:self-auto border-border/60 hover:bg-muted"
            >
              <Link to="/cadastros">
                <Target className="w-3.5 h-3.5 text-primary" />
                Ajustar Metas
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Meta 1: Produção Diária */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                dadosMetas.atingiuDiario
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-card/60 border-border/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Meta Diária
                  </span>
                </div>
                <Badge
                  variant={dadosMetas.atingiuDiario ? 'default' : 'secondary'}
                  className={`text-[11px] font-mono font-bold ${
                    dadosMetas.atingiuDiario
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                      : dadosMetas.pctDiario >= 70
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                  }`}
                >
                  {dadosMetas.atingiuDiario ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Atingida (
                      {dadosMetas.pctDiario}%)
                    </span>
                  ) : (
                    <span>{dadosMetas.pctDiario}% atingido</span>
                  )}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <div className="text-2xl font-black font-mono text-foreground">
                  {dadosMetas.volumeDia.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {dadosMetas.metaDiaria} m³
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {dadosMetas.volumeDia >= dadosMetas.metaDiaria
                    ? `+${(dadosMetas.volumeDia - dadosMetas.metaDiaria).toFixed(1)} m³ acima`
                    : `Faltam ${(dadosMetas.metaDiaria - dadosMetas.volumeDia).toFixed(1)} m³`}
                </div>
              </div>

              <Progress
                value={Math.min(dadosMetas.pctDiario, 100)}
                className="h-2.5 bg-muted/60"
              />

              <p className="text-[11px] text-muted-foreground mt-2">
                Operação do dia{' '}
                {dadosMetas.dataDiaConsiderada.split('-').reverse().join('/')}.
              </p>
            </div>

            {/* Meta 2: Produção Mensal */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                dadosMetas.atingiuMensal
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-card/60 border-border/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Meta Mensal
                  </span>
                </div>
                <Badge
                  variant={dadosMetas.atingiuMensal ? 'default' : 'secondary'}
                  className={`text-[11px] font-mono font-bold ${
                    dadosMetas.atingiuMensal
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                      : dadosMetas.pctMensal >= 70
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                  }`}
                >
                  {dadosMetas.atingiuMensal ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Atingida (
                      {dadosMetas.pctMensal}%)
                    </span>
                  ) : (
                    <span>{dadosMetas.pctMensal}% atingido</span>
                  )}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <div className="text-2xl font-black font-mono text-foreground">
                  {dadosMetas.volumeMes.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {dadosMetas.metaMensal} m³
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {dadosMetas.volumeMes >= dadosMetas.metaMensal
                    ? `+${(dadosMetas.volumeMes - dadosMetas.metaMensal).toFixed(1)} m³ acima`
                    : `Faltam ${(dadosMetas.metaMensal - dadosMetas.volumeMes).toFixed(1)} m³`}
                </div>
              </div>

              <Progress
                value={Math.min(dadosMetas.pctMensal, 100)}
                className="h-2.5 bg-muted/60"
              />

              <p className="text-[11px] text-muted-foreground mt-2">
                Consolidado do mês{' '}
                {dadosMetas.chaveMesRef.split('-').reverse().join('/')}.
              </p>
            </div>

            {/* Meta 3: Desempenho no Filtro de Período Ativo */}
            <div
              className={`p-4 rounded-xl border transition-all md:col-span-2 lg:col-span-1 ${
                dadosMetas.atingiuRecorte
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-card/60 border-border/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Período Filtrado
                  </span>
                </div>
                <Badge
                  variant={dadosMetas.atingiuRecorte ? 'default' : 'secondary'}
                  className={`text-[11px] font-mono font-bold ${
                    dadosMetas.atingiuRecorte
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                      : 'bg-primary/10 text-primary border-primary/30'
                  }`}
                >
                  {dadosMetas.pctRecorte}% do referencial
                </Badge>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <div className="text-2xl font-black font-mono text-foreground">
                  {dadosMetas.volumeRecorte.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {dadosMetas.metaRecorte.toFixed(0)} m³
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {cargasValidasPeriodo.length} cargas
                </div>
              </div>

              <Progress
                value={Math.min(dadosMetas.pctRecorte, 100)}
                className="h-2.5 bg-muted/60"
              />

              <p
                className="text-[11px] text-muted-foreground mt-2 truncate"
                title={labelPeriodo}
              >
                Filtro: {labelPeriodo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Gráfico 3 (TELA NORMAL): Consumo Mensal com Volume (m³), Aditivo (L) e Valores dos Custos (R$) */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>
                Consumo Mensal: Volume (m³), Aditivo (L) e Valores dos Custos
                (R$)
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Séries consolidadas por mês respeitando o filtro de período (
              {labelPeriodo})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className="font-mono bg-primary/10 text-primary border-primary/30"
            >
              {dadosGraficoMensal.length}{' '}
              {dadosGraficoMensal.length === 1 ? 'mês' : 'meses'} no recorte
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dadosGraficoMensal}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="rotulo"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                />
                {/* Eixo Esquerdo: Volume (m³) e Aditivo (L) */}
                <YAxis
                  yAxisId="left"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: 'Volume (m³) / Aditivo (L)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#888',
                    fontSize: 10,
                    style: { textAnchor: 'middle' },
                  }}
                />
                {/* Eixo Direito: Custos Totais (R$) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: 'Custo Total (R$)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#10b981',
                    fontSize: 10,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => {
                    if (name === 'Custo Total (R$)') {
                      return [
                        `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        name,
                      ]
                    }
                    if (name === 'Volume (m³)') {
                      return [`${val} m³`, name]
                    }
                    if (name === 'Aditivo (L)') {
                      return [`${Number(val).toLocaleString('pt-BR')} L`, name]
                    }
                    return [val, name]
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="volume_m3"
                  name="Volume (m³)"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="aditivo_l"
                  name="Aditivo (L)"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="custo_total"
                  name="Custo Total (R$)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                        {mat.unidade === 'kg' && saldo >= 1000
                          ? (saldo / 1000).toLocaleString('pt-BR', {
                              maximumFractionDigits: 2,
                            })
                          : saldo.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        {mat.unidade === 'kg' && saldo >= 1000
                          ? 'toneladas (t)'
                          : mat.unidade}
                      </span>
                      {mat.unidade === 'kg' && saldo >= 1000 && (
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
                  {isAdministrador && (
                    <th className="py-2.5 px-3 text-center w-14">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {cargasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdministrador ? 13 : 12}
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
                      {isAdministrador && (
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10"
                            title="Editar lançamento de carga (Administrador)"
                          >
                            <Link to={`/lancamentos?editar=${c.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="sr-only">Editar carga</span>
                            </Link>
                          </Button>
                        </td>
                      )}
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
                onClick={handleImprimirReciboOS}
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

          {osParaReimpressao && (
            <div
              id="recibo-impressao-modal-index"
              className="mt-2 border rounded-lg p-2 bg-white text-black shadow-inner print:border-none print:p-0 print:m-0 print:shadow-none"
            >
              <ReciboImpressao
                ordem={osParaReimpressao}
                empresa={empresaAtiva || null}
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
              onClick={handleImprimirReciboOS}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
