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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConcreteiraService } from '@/services/concreteira'
import { useEmpresa } from '@/hooks/use-empresa'
import type {
  Traco,
  Motorista,
  Veiculo,
  Cidade,
  PrecoMaterial,
} from '@/types/concreteira'
import {
  Truck,
  Calculator,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Edit3,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Link, useNavigate } from 'react-router-dom'

export default function LancamentoCargas() {
  const navigate = useNavigate()
  const { empresaAtiva } = useEmpresa()
  const [tracos, setTracos] = useState<Traco[]>([])
  const [precos, setPrecos] = useState<PrecoMaterial[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [salvando, setSalvando] = useState(false)

  // Modo de dosagem: 'automatico' (por traço) ou 'manual' (digitação dos 6 insumos)
  const [modoDosagem, setModoDosagem] = useState<'automatico' | 'manual'>(
    'automatico',
  )

  // Formulário
  const [dataCarga, setDataCarga] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [volume, setVolume] = useState<number>(8.0)
  const [tracoSelecionadoId, setTracoSelecionadoId] = useState<string>('')
  const [motoristaNome, setMotoristaNome] = useState<string>('')
  const [veiculoPlaca, setVeiculoPlaca] = useState<string>('')
  const [cidadeNome, setCidadeNome] = useState<string>('')
  const [observacao, setObservacao] = useState<string>('')
  const [cargaZerada, setCargaZerada] = useState<boolean>(false)

  // Insumos calculados ou ajustados
  const [brita12, setBrita12] = useState<number>(0)
  const [brita19, setBrita19] = useState<number>(0)
  const [areia, setAreia] = useState<number>(0)
  const [poPedra, setPoPedra] = useState<number>(0)
  const [cimento, setCimento] = useState<number>(0)
  const [aditivo, setAditivo] = useState<number>(0)

  useEffect(() => {
    async function init() {
      if (!empresaAtiva) return
      try {
        const [tr, mot, veic, cid, prc] = await Promise.all([
          ConcreteiraService.getTracos(empresaAtiva.id),
          ConcreteiraService.getMotoristas(empresaAtiva.id),
          ConcreteiraService.getVeiculos(empresaAtiva.id),
          ConcreteiraService.getCidades(empresaAtiva.id),
          ConcreteiraService.getPrecosMaterial(empresaAtiva.id),
        ])
        setTracos(tr)
        setPrecos(prc)
        setMotoristas(mot)
        setVeiculos(veic)
        setCidades(cid)

        if (tr.length > 0) {
          setTracoSelecionadoId(tr[0].id)
        } else {
          setTracoSelecionadoId('')
        }
      } catch (err) {
        console.error('Erro ao carregar dados do formulário:', err)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Função utilitária para aplicar cálculo do traço aos insumos
  const aplicarCalculoTraco = (tracoId: string, vol: number) => {
    const traco = tracos.find((t) => t.id === tracoId)
    if (traco && vol > 0) {
      setBrita12(Math.round(Number(traco.consumo_brita12) * vol))
      setBrita19(Math.round(Number(traco.consumo_brita19) * vol))
      setAreia(Math.round(Number(traco.consumo_areia) * vol))
      setPoPedra(Math.round(Number(traco.consumo_po_pedra) * vol))
      setCimento(Math.round(Number(traco.consumo_cimento) * vol))
      setAditivo(Number((Number(traco.consumo_aditivo) * vol).toFixed(2)))
    }
  }

  // Recalcular insumos automaticamente apenas se estiver no modo automático ou cargaZerada
  useEffect(() => {
    if (cargaZerada) {
      setBrita12(0)
      setBrita19(0)
      setAreia(0)
      setPoPedra(0)
      setCimento(0)
      setAditivo(0)
      return
    }

    if (modoDosagem === 'automatico') {
      const traco = tracos.find((t) => t.id === tracoSelecionadoId)
      if (traco && volume > 0) {
        setBrita12(Math.round(Number(traco.consumo_brita12) * volume))
        setBrita19(Math.round(Number(traco.consumo_brita19) * volume))
        setAreia(Math.round(Number(traco.consumo_areia) * volume))
        setPoPedra(Math.round(Number(traco.consumo_po_pedra) * volume))
        setCimento(Math.round(Number(traco.consumo_cimento) * volume))
        setAditivo(Number((Number(traco.consumo_aditivo) * volume).toFixed(2)))
      }
    }
  }, [tracoSelecionadoId, volume, cargaZerada, tracos, modoDosagem])

  // Tratar alternância de modo
  const handleTrocaModo = (novoModo: 'automatico' | 'manual') => {
    setModoDosagem(novoModo)
    if (novoModo === 'manual' && !cargaZerada) {
      // Pré-preenche com o traço selecionado se os valores estiverem zerados ou se o usuário veio do automático
      aplicarCalculoTraco(tracoSelecionadoId, volume)
    } else if (novoModo === 'automatico' && !cargaZerada) {
      aplicarCalculoTraco(tracoSelecionadoId, volume)
    }
  }

  const handleResetarParaTraco = () => {
    if (tracoSelecionadoId) {
      aplicarCalculoTraco(tracoSelecionadoId, volume)
      toast({
        title: 'Valores redefinidos',
        description:
          'Os insumos foram recalculados com base no traço selecionado.',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dataCarga) {
      toast({
        title: 'Atenção',
        description: 'Informe a data da carga',
        variant: 'destructive',
      })
      return
    }
    if (volume <= 0) {
      toast({
        title: 'Atenção',
        description: 'O volume deve ser maior que zero',
        variant: 'destructive',
      })
      return
    }

    // Validação no modo manual: se não for carga zerada, exigir pelo menos um insumo > 0
    if (modoDosagem === 'manual' && !cargaZerada) {
      const somaInsumos =
        brita12 + brita19 + areia + poPedra + cimento + aditivo
      if (somaInsumos <= 0) {
        toast({
          title: 'Insumos não informados',
          description:
            'No modo manual, informe a quantidade de pelo menos um dos insumos ou marque a carga como cancelada/zerada.',
          variant: 'destructive',
        })
        return
      }
    }

    const traco = tracos.find((t) => t.id === tracoSelecionadoId)

    // Nome descritivo do traço gravado na carga
    let nomeTracoGravado = traco?.nome || 'Traço manual'
    if (modoDosagem === 'manual') {
      nomeTracoGravado = traco ? `${traco.nome} (Manual)` : 'Dosagem Manual'
    }

    setSalvando(true)
    try {
      await ConcreteiraService.criarCarga({
        empresa_id: empresaAtiva?.id,
        data: dataCarga,
        volume_m3: volume,
        traco_id: traco?.id,
        traco_nome: nomeTracoGravado,
        motorista_nome: motoristaNome || undefined,
        veiculo_placa: veiculoPlaca || undefined,
        cidade_nome: cidadeNome || undefined,
        consumo_brita12: brita12,
        consumo_brita19: brita19,
        consumo_areia: areia,
        consumo_po_pedra: poPedra,
        consumo_cimento: cimento,
        consumo_aditivo: aditivo,
        observacao: observacao
          ? modoDosagem === 'manual'
            ? `[Modo Manual] ${observacao}`
            : observacao
          : modoDosagem === 'manual'
            ? '[Lançamento com dosagem manual de insumos]'
            : undefined,
        carga_zerada: cargaZerada,
      })

      toast({
        title: 'Carga lançada com sucesso!',
        description: cargaZerada
          ? 'Carga cancelada registrada sem baixa de materiais.'
          : 'Baixa de estoque nos materiais controlados (Cimento e Aditivo) realizada com sucesso.',
      })

      navigate('/')
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao lançar carga',
        description: err.message || 'Falha na comunicação com o banco.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const tracoAtual = tracos.find((t) => t.id === tracoSelecionadoId)

  // Estimativa de custo da carga a ser lançada
  const custoEstimado = cargaZerada
    ? { total: 0, custoPorM3: 0 }
    : ConcreteiraService.calcularCustoCarga(
        {
          id: '',
          numero_carga: 0,
          data: dataCarga,
          volume_m3: volume,
          traco_id: tracoSelecionadoId,
          traco_nome: tracoAtual?.nome || null,
          motorista_id: null,
          motorista_nome: null,
          veiculo_id: null,
          veiculo_placa: null,
          cidade_id: null,
          cidade_nome: null,
          consumo_brita12: brita12,
          consumo_brita19: brita19,
          consumo_areia: areia,
          consumo_po_pedra: poPedra,
          consumo_cimento: cimento,
          consumo_aditivo: aditivo,
          observacao: null,
          carga_zerada: false,
        },
        precos,
      )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Lançamento Rápido de Carga
              {empresaAtiva && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                  {empresaAtiva.nome}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Registro de despacho na balança com dosagem e baixa automática no
              estoque da unidade {empresaAtiva?.nome || ''}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Dados da Expedição */}
        <Card className="border-border/40 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Dados da Expedição
            </CardTitle>
            <CardDescription className="text-xs">
              Informe a data, o volume solicitado em m³ e a dosagem (traço)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data de Expedição *</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataCarga}
                  onChange={(e) => setDataCarga(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume">Volume (m³) *</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="15"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traco">
                  {modoDosagem === 'manual'
                    ? 'Traço de Referência (Opcional)'
                    : 'Traço / Dosagem *'}
                </Label>
                <Select
                  value={tracoSelecionadoId}
                  onValueChange={(val) => {
                    setTracoSelecionadoId(val)
                    if (modoDosagem === 'manual') {
                      // Ao trocar o traço no modo manual, pergunta indiretamente ou atualiza
                      aplicarCalculoTraco(val, volume)
                    }
                  }}
                  disabled={cargaZerada}
                >
                  <SelectTrigger id="traco">
                    <SelectValue placeholder="Selecione o traço" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome} {t.fck_mpa ? `(${t.fck_mpa} MPa)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkbox Carga Zerada */}
            <div className="flex items-center space-x-2 pt-2 border-t border-border/40">
              <Checkbox
                id="cargaZerada"
                checked={cargaZerada}
                onCheckedChange={(checked) => setCargaZerada(!!checked)}
              />
              <Label
                htmlFor="cargaZerada"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <span className="text-amber-500 font-semibold">
                  Carga Zerada / Cancelada
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  (Registra o frete/viagem mas não abate nenhum insumo do
                  estoque)
                </span>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 2: Consumo Calculado ou Manual de Insumos */}
        <Card className="border-border/40 bg-card/70">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Insumos e Agregados da Carga
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {modoDosagem === 'automatico'
                    ? `Valores calculados automaticamente pelo traço (multiplicados por ${volume} m³). Baixa de estoque ocorre apenas para Cimento e Aditivo.`
                    : `Modo manual ativo: digite diretamente os quilos/litros dos 6 insumos pesados na balança para esta carga. Baixa de estoque ocorre apenas para Cimento e Aditivo.`}
                </CardDescription>
              </div>

              {/* Seletor de Modo: Traço automático vs Insumos manuais */}
              <div className="flex items-center gap-2">
                <Tabs
                  value={modoDosagem}
                  onValueChange={(val) =>
                    handleTrocaModo(val as 'automatico' | 'manual')
                  }
                  className="w-auto"
                >
                  <TabsList className="h-9 p-1 bg-muted/60">
                    <TabsTrigger
                      value="automatico"
                      className="text-xs px-3 py-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Traço automático
                    </TabsTrigger>
                    <TabsTrigger
                      value="manual"
                      className="text-xs px-3 py-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Insumos manuais
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Aviso explicativo no modo manual */}
            {modoDosagem === 'manual' && !cargaZerada && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong>Digitação Manual:</strong> Os valores digitados
                    abaixo serão exatamente os gravados no consumo da carga e
                    contabilizados no custo. A baixa de estoque continua
                    restrita a <strong>Cimento</strong> e{' '}
                    <strong>Aditivo</strong>.
                  </span>
                </div>
                {tracoAtual && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetarParaTraco}
                    className="h-7 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shrink-0 self-start sm:self-auto gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resetar p/ traço
                  </Button>
                )}
              </div>
            )}

            {/* Box de Custo Estimado da Carga */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                    Custo Calculado dos Insumos da Carga
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {modoDosagem === 'manual'
                      ? 'Simulação em tempo real baseada nos insumos digitados manualmente'
                      : 'Calculado com base na tabela de preços unitários vigente na data'}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-foreground">
                  R${' '}
                  {custoEstimado.total.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  (R$ {custoEstimado.custoPorM3.toFixed(2)}/m³)
                </span>
              </div>
            </div>

            {/* Grid dos 6 Insumos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Cimento */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="cimento"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    Cimento (kg)
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                      Estoque
                    </span>
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_cimento} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {Math.round(Number(tracoAtual.consumo_cimento) * volume)}{' '}
                      kg
                    </span>
                  )}
                </Label>
                <Input
                  id="cimento"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    cimento === 0 && modoDosagem === 'manual' ? '' : cimento
                  }
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setCimento(isNaN(val) ? 0 : val)
                  }}
                  disabled={cargaZerada}
                  className={`font-mono font-semibold ${
                    modoDosagem === 'manual'
                      ? 'bg-background border-primary/40 focus-visible:ring-primary'
                      : ''
                  }`}
                  placeholder="0"
                />
              </div>

              {/* Aditivo */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="aditivo"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    Aditivo (Litros)
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                      Estoque
                    </span>
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_aditivo} L/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {(Number(tracoAtual.consumo_aditivo) * volume).toFixed(1)}{' '}
                      L
                    </span>
                  )}
                </Label>
                <Input
                  id="aditivo"
                  type="number"
                  min="0"
                  step="0.05"
                  value={
                    aditivo === 0 && modoDosagem === 'manual' ? '' : aditivo
                  }
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setAditivo(isNaN(val) ? 0 : val)
                  }}
                  disabled={cargaZerada}
                  className={`font-mono font-semibold ${
                    modoDosagem === 'manual'
                      ? 'bg-background border-primary/40 focus-visible:ring-primary'
                      : ''
                  }`}
                  placeholder="0.0"
                />
              </div>

              {/* Areia */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="areia"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Areia (kg)
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_areia} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {Math.round(Number(tracoAtual.consumo_areia) * volume)} kg
                    </span>
                  )}
                </Label>
                <Input
                  id="areia"
                  type="number"
                  min="0"
                  step="1"
                  value={areia === 0 && modoDosagem === 'manual' ? '' : areia}
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setAreia(isNaN(val) ? 0 : val)
                  }}
                  disabled={cargaZerada}
                  className={`font-mono font-semibold ${
                    modoDosagem === 'manual'
                      ? 'bg-background border-primary/40 focus-visible:ring-primary'
                      : ''
                  }`}
                  placeholder="0"
                />
              </div>

              {/* Brita 12 */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="brita12"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Brita 12 (kg)
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita12} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {Math.round(Number(tracoAtual.consumo_brita12) * volume)}{' '}
                      kg
                    </span>
                  )}
                </Label>
                <Input
                  id="brita12"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    brita12 === 0 && modoDosagem === 'manual' ? '' : brita12
                  }
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setBrita12(isNaN(val) ? 0 : val)
                  }}
                  disabled={cargaZerada}
                  className={`font-mono font-semibold ${
                    modoDosagem === 'manual'
                      ? 'bg-background border-primary/40 focus-visible:ring-primary'
                      : ''
                  }`}
                  placeholder="0"
                />
              </div>

              {/* Brita 19 */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="brita19"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Brita 19 (kg)
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita19} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {Math.round(Number(tracoAtual.consumo_brita19) * volume)}{' '}
                      kg
                    </span>
                  )}
                </Label>
                <Input
                  id="brita19"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    brita19 === 0 && modoDosagem === 'manual' ? '' : brita19
                  }
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setBrita19(isNaN(val) ? 0 : val)
                  }}
                  disabled={cargaZerada}
                  className={`font-mono font-semibold ${
                    modoDosagem === 'manual'
                      ? 'bg-background border-primary/40 focus-visible:ring-primary'
                      : ''
                  }`}
                  placeholder="0"
                />
              </div>

              {/* Pó de Pedra */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="poPedra"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Pó de Pedra (kg)
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_po_pedra} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {Math.round(Number(tracoAtual.consumo_po_pedra) * volume)}{' '}
                      kg
                    </span>
                  )}
                </Label>
                <Input
                  id="poPedra"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    poPedra === 0 && modoDosagem === 'manual' ? '' : poPedra
                  }
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setPoPedra(isNaN(val) ? 0 : val)
                  }}
                  disabled={cargaZerada}
                  className={`font-mono font-semibold ${
                    modoDosagem === 'manual'
                      ? 'bg-background border-primary/40 focus-visible:ring-primary'
                      : ''
                  }`}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 3: Transporte e Logística (Opcionais) */}
        <Card className="border-border/40 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">
              Transporte e Destino (Logística)
            </CardTitle>
            <CardDescription className="text-xs">
              Vincule o caminhão betoneira, motorista e cidade de entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motorista">Motorista</Label>
                <Select value={motoristaNome} onValueChange={setMotoristaNome}>
                  <SelectTrigger id="motorista">
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {motoristas.map((m) => (
                      <SelectItem key={m.id} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo">Placa do Caminhão</Label>
                <Select value={veiculoPlaca} onValueChange={setVeiculoPlaca}>
                  <SelectTrigger id="veiculo">
                    <SelectValue placeholder="Selecione a placa" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={v.placa}>
                        {v.placa} {v.modelo ? `- ${v.modelo}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade de Destino</Label>
                <Select value={cidadeNome} onValueChange={setCidadeNome}>
                  <SelectTrigger id="cidade">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cidades.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome} ({c.uf})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">
                Observações / Detalhes da Entrega
              </Label>
              <Textarea
                id="observacao"
                rows={2}
                placeholder="Ex: Laje residencial, bloco A, entrega bombeada, teste de slump..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão de Envio */}
        <div className="flex justify-end gap-3">
          <Button asChild variant="outline" type="button">
            <Link to="/">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={salvando}
            className="gap-2 bg-primary text-primary-foreground min-w-[160px]"
          >
            {salvando ? (
              'Salvando...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Registrar e Despachar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
