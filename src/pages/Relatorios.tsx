import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConcreteiraService } from '@/services/concreteira'
import type { Carga, Cidade, Veiculo, Motorista } from '@/types/concreteira'
import {
  FileSpreadsheet,
  Download,
  Filter,
  BarChart3,
  Truck,
  MapPin,
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
} from 'recharts'

export default function Relatorios() {
  const [cargas, setCargas] = useState<Carga[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [cidadeFiltro, setCidadeFiltro] = useState('ALL')
  const [veiculoFiltro, setVeiculoFiltro] = useState('ALL')
  const [motoristaFiltro, setMotoristaFiltro] = useState('ALL')
  const [apenasZeradas, setApenasZeradas] = useState(false)

  const carregarFiltrosIniciais = async () => {
    try {
      const [cid, vei, mot] = await Promise.all([
        ConcreteiraService.getCidades(),
        ConcreteiraService.getVeiculos(),
        ConcreteiraService.getMotoristas(),
      ])
      setCidades(cid)
      setCVeiculos(vei)
      setMotoristas(mot)
    } catch (e) {
      console.error(e)
    }
  }

  const setCVeiculos = setVeiculos

  const carregarRelatorio = async () => {
    setLoading(true)
    try {
      const dados = await ConcreteiraService.getCargas({
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        cidade: cidadeFiltro,
        veiculo: veiculoFiltro,
        motorista: motoristaFiltro,
        apenasZeradas,
      })
      setCargas(dados)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarFiltrosIniciais()
    carregarRelatorio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault()
    carregarRelatorio()
  }

  const limparFiltros = () => {
    setDataInicio('')
    setDataFim('')
    setCidadeFiltro('ALL')
    setVeiculoFiltro('ALL')
    setMotoristaFiltro('ALL')
    setApenasZeradas(false)
    setTimeout(() => {
      ConcreteiraService.getCargas().then(setCargas)
    }, 50)
  }

  // Agrupamento para ranking de cidades
  const cidadesRanking: Record<
    string,
    { nome: string; volume: number; cargas: number }
  > = {}
  cargas.forEach((c) => {
    const nome = c.cidade_nome || 'Não informada'
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
  const caminhoesRanking: Record<
    string,
    { placa: string; volume: number; cargas: number }
  > = {}
  cargas.forEach((c) => {
    const placa = c.veiculo_placa || 'Sem placa'
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
      'Carga #',
      'Data',
      'Volume (m3)',
      'Traco',
      'Cimento (kg)',
      'Aditivo (L)',
      'Areia (kg)',
      'Brita 12 (kg)',
      'Brita 19 (kg)',
      'Po de Pedra (kg)',
      'Motorista',
      'Placa',
      'Cidade',
      'Carga Zerada',
      'Observacao',
    ]

    const rows = cargas.map((c) => [
      c.numero_carga,
      c.data,
      c.volume_m3,
      `"${c.traco_nome || ''}"`,
      c.consumo_cimento,
      c.consumo_aditivo,
      c.consumo_areia,
      c.consumo_brita12,
      c.consumo_brita19,
      c.consumo_po_pedra,
      `"${c.motorista_nome || ''}"`,
      `"${c.veiculo_placa || ''}"`,
      `"${c.cidade_nome || ''}"`,
      c.carga_zerada ? 'SIM' : 'NAO',
      `"${(c.observacao || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `relatorio_concreteira_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Totais do filtro atual
  const totalVolume = cargas
    .filter((c) => !c.carga_zerada)
    .reduce((a, b) => a + Number(b.volume_m3), 0)
  const totalCimento = cargas.reduce((a, b) => a + Number(b.consumo_cimento), 0)
  const totalAditivo = cargas.reduce((a, b) => a + Number(b.consumo_aditivo), 0)

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            Relatórios e Auditoria de Cargas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filtre por período, insumos, destinos e exporte consultas para
            planilha CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={carregarRelatorio}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Card de Filtros */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Filtros Avançados de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFiltrar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
                <Label htmlFor="cidF" className="text-xs">
                  Cidade
                </Label>
                <Select value={cidadeFiltro} onValueChange={setCidadeFiltro}>
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
                <Select value={veiculoFiltro} onValueChange={setVeiculoFiltro}>
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
                  Limpar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs h-8 gap-1"
                >
                  <Filter className="w-3 h-3" />
                  Aplicar Filtro
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resumo do Filtro */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg border border-border/40 bg-card/60">
          <p className="text-xs text-muted-foreground">
            Total Cargas Filtradas
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {cargas.length}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border/40 bg-card/60">
          <p className="text-xs text-muted-foreground">Volume Total Filtrado</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {totalVolume.toFixed(1)} m³
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border/40 bg-card/60">
          <p className="text-xs text-muted-foreground">
            Consumo Cimento Filtrado
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {(totalCimento / 1000).toFixed(2)} t
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border/40 bg-card/60">
          <p className="text-xs text-muted-foreground">
            Consumo Aditivo Filtrado
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {totalAditivo.toLocaleString('pt-BR')} L
          </p>
        </div>
      </div>

      {/* Rankings: Destinos e Caminhões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Ranking de Volume por Cidade de Destino (m³)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
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
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(val: any) => [`${val} m³`, 'Volume']}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]} fill="#3b82f6" />
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
          <CardContent className="h-[220px]">
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
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(val: any) => [`${val} m³`, 'Volume']}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Tabela de Cargas Auditadas
          </CardTitle>
          <CardDescription className="text-xs">
            {cargas.length} registros correspondentes aos critérios selecionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur">
                <tr>
                  <th className="py-2.5 px-3">Carga #</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Traço</th>
                  <th className="py-2.5 px-3">Cimento (kg)</th>
                  <th className="py-2.5 px-3">Aditivo (L)</th>
                  <th className="py-2.5 px-3">Areia (kg)</th>
                  <th className="py-2.5 px-3">Brita 12 (kg)</th>
                  <th className="py-2.5 px-3">Brita 19 (kg)</th>
                  <th className="py-2.5 px-3">Pó Pedra (kg)</th>
                  <th className="py-2.5 px-3">Motorista</th>
                  <th className="py-2.5 px-3">Placa</th>
                  <th className="py-2.5 px-3">Destino</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {cargas.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-2 px-3 font-mono font-medium text-foreground">
                      #{String(c.numero_carga).padStart(4, '0')}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground font-mono">
                      {c.data.split('-').reverse().join('/')}
                    </td>
                    <td className="py-2 px-3 font-bold text-foreground">
                      {Number(c.volume_m3).toFixed(1)} m³
                    </td>
                    <td
                      className="py-2 px-3 max-w-[140px] truncate text-muted-foreground"
                      title={c.traco_nome || ''}
                    >
                      {c.traco_nome || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {Number(c.consumo_cimento).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {Number(c.consumo_aditivo).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {Number(c.consumo_areia).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {Number(c.consumo_brita12).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {Number(c.consumo_brita19).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {Number(c.consumo_po_pedra).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {c.motorista_nome || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">
                      {c.veiculo_placa || '—'}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {c.cidade_nome || '—'}
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
