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
  Material,
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
  const [materiais, setMateriais] = useState<Material[]>([])
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

  // Insumos no formulário (no modo manual são DOSAGEM por m³: kg/m³ para sólidos; no automático guardam a dosagem base)
  const [brita12, setBrita12] = useState<number>(0)
  const [brita19, setBrita19] = useState<number>(0)
  const [areia, setAreia] = useState<number>(0)
  const [poPedra, setPoPedra] = useState<number>(0)
  const [cimento, setCimento] = useState<number>(0)
  const [aditivo, setAditivo] = useState<number>(0)
  // Fator de dosagem para cálculo do aditivo no modo manual:
  // aditivo (L) = cimento TOTAL da carga (kg) × fator
  // onde cimento_total_kg = dosagem_cimento_kg_m3 × volume_m3
  // Faixa de fatores do aditivo: 0,005 a 0,010
  const [fatorAditivoManual, setFatorAditivoManual] = useState<number>(0.006)
  const [aditivoBruto, setAditivoBruto] = useState<number>(0)

  // INSUMO: ÁGUA (calculada, com opção de digitação manual)
  // água (L) = cimento TOTAL da carga (kg) × fator_de_água
  // onde cimento_total_kg = dosagem_cimento_kg_m3 × volume_m3
  // com fator na faixa 0,45 a 0,8 (opções rápidas: 0,45, 0,5, 0,55, 0,6, 0,65, 0,7, 0,75, 0,8)
  // Arredondamento inteiro clássico (Math.round)
  const [agua, setAgua] = useState<number>(0)
  const [fatorAguaManual, setFatorAguaManual] = useState<number>(0.55)
  const [aguaBruta, setAguaBruta] = useState<number>(0)

  // Controle de edição manual (sobrescrita do cálculo automático)
  const [aditivoEditadoManualmente, setAditivoEditadoManualmente] =
    useState<boolean>(false)
  const [aguaEditadaManualmente, setAguaEditadaManualmente] =
    useState<boolean>(false)

  useEffect(() => {
    async function init() {
      if (!empresaAtiva) return
      try {
        const [tr, mot, veic, cid, prc, mats] = await Promise.all([
          ConcreteiraService.getTracos(empresaAtiva.id),
          ConcreteiraService.getMotoristas(empresaAtiva.id),
          ConcreteiraService.getVeiculos(empresaAtiva.id),
          ConcreteiraService.getCidades(empresaAtiva.id),
          ConcreteiraService.getPrecosMaterial(empresaAtiva.id),
          ConcreteiraService.getMateriais(empresaAtiva.id),
        ])
        setTracos(tr)
        setPrecos(prc)
        setMotoristas(mot)
        setVeiculos(veic)
        setCidades(cid)
        setMateriais(mats)

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

  // Função utilitária para aplicar dosagem base do traço aos campos
  const aplicarDosagemTraco = (tracoId: string, vol: number) => {
    const traco = tracos.find((t) => t.id === tracoId)
    if (traco) {
      const cimentoDosagem = Number(traco.consumo_cimento) || 0
      setBrita12(Number(traco.consumo_brita12) || 0)
      setBrita19(Number(traco.consumo_brita19) || 0)
      setAreia(Number(traco.consumo_areia) || 0)
      setPoPedra(Number(traco.consumo_po_pedra) || 0)
      setCimento(cimentoDosagem)

      // Resetar flags de edição manual para reaplicar os valores calculados
      setAditivoEditadoManualmente(false)
      setAguaEditadaManualmente(false)

      if (modoDosagem === 'manual') {
        // No modo manual:
        // cimento total da carga (kg) = dosagem (kg/m³) × volume (m³)
        const cimentoTotal = cimentoDosagem * vol
        // aditivo (L) = cimento total (kg) × fator
        const adtBruto = cimentoTotal * (fatorAditivoManual || 0.006)
        setAditivoBruto(adtBruto)
        setAditivo(Math.round(adtBruto))

        // água (L) = cimento total (kg) × fator
        const agBruta = cimentoTotal * (fatorAguaManual || 0.55)
        setAguaBruta(agBruta)
        setAgua(Math.round(agBruta))
      } else {
        setAditivo(Number(traco.consumo_aditivo) || 0)
        setAditivoBruto(Number(traco.consumo_aditivo) || 0)
        const cimentoTotal = cimentoDosagem * vol
        const agBruta = cimentoTotal * (fatorAguaManual || 0.55)
        setAguaBruta(agBruta)
        setAgua(Math.round(agBruta))
      }
    }
  }

  // Sincronizar dosagens do traço quando no modo automático ou recalcular aditivo no modo manual
  useEffect(() => {
    if (cargaZerada) {
      return
    }

    if (modoDosagem === 'automatico') {
      const traco = tracos.find((t) => t.id === tracoSelecionadoId)
      if (traco) {
        const cimentoDosagem = Number(traco.consumo_cimento) || 0
        setBrita12(Number(traco.consumo_brita12) || 0)
        setBrita19(Number(traco.consumo_brita19) || 0)
        setAreia(Number(traco.consumo_areia) || 0)
        setPoPedra(Number(traco.consumo_po_pedra) || 0)
        setCimento(cimentoDosagem)
        setAditivo(Number(traco.consumo_aditivo) || 0)
        setAditivoBruto(Number(traco.consumo_aditivo) || 0)

        // Água do traço automático (se houver no traço ou calculada via fator água)
        const cimentoTotal = cimentoDosagem * volume
        const agBruta = cimentoTotal * (fatorAguaManual || 0.55)
        setAguaBruta(agBruta)
        setAgua(Math.round(agBruta))
      }
    } else {
      // Modo manual:
      // cimento_total_kg = dosagem_cimento_kg_m3 × volume_m3
      // aditivo (L) = cimento_total_kg × fatorAditivoManual
      const cimentoTotal = cimento * volume
      const adtBruto = cimentoTotal * (fatorAditivoManual || 0)
      setAditivoBruto(adtBruto)
      // Arredondamento INTEIRO clássico: Math.round (>= 0.5 sobe, < 0.5 desce)
      if (!aditivoEditadoManualmente) {
        setAditivo(Math.round(adtBruto))
      }

      // Água (L) = cimento_total_kg × fatorAguaManual
      const agBruta = cimentoTotal * (fatorAguaManual || 0)
      setAguaBruta(agBruta)
      if (!aguaEditadaManualmente) {
        setAgua(Math.round(agBruta))
      }
    }
  }, [
    tracoSelecionadoId,
    volume,
    cargaZerada,
    tracos,
    modoDosagem,
    cimento,
    fatorAditivoManual,
    fatorAguaManual,
    aditivoEditadoManualmente,
    aguaEditadaManualmente,
  ])

  // Recalcular valor de aditivo conforme fórmula teórica: cimento_total_kg × fator
  const handleRecalcularAditivo = () => {
    setAditivoEditadoManualmente(false)
    const cimentoTotal = cimento * volume
    const adtBruto = cimentoTotal * (fatorAditivoManual || 0)
    setAditivoBruto(adtBruto)
    setAditivo(Math.round(adtBruto))
    toast({
      title: 'Aditivo recalculado',
      description: `Valor recalculado pela fórmula: ${Math.round(adtBruto)} L`,
    })
  }

  // Recalcular valor de água conforme fórmula teórica: cimento_total_kg × fator
  const handleRecalcularAgua = () => {
    setAguaEditadaManualmente(false)
    const cimentoTotal = cimento * volume
    const agBruta = cimentoTotal * (fatorAguaManual || 0)
    setAguaBruta(agBruta)
    setAgua(Math.round(agBruta))
    toast({
      title: 'Água recalculada',
      description: `Valor recalculado pela fórmula: ${Math.round(agBruta)} L`,
    })
  }

  // Tratar alternância de modo
  const handleTrocaModo = (novoModo: 'automatico' | 'manual') => {
    setModoDosagem(novoModo)
    setAditivoEditadoManualmente(false)
    setAguaEditadaManualmente(false)
    if (novoModo === 'manual' && !cargaZerada) {
      // Determinar um fator sugerido coerente com o traço atual se existir:
      // aditivo_por_m3 = consumo_cimento * fator  =>  fator = aditivo_por_m3 / consumo_cimento
      const traco = tracos.find((t) => t.id === tracoSelecionadoId)
      if (traco && Number(traco.consumo_cimento) > 0) {
        const fatorSugerido =
          Number(traco.consumo_aditivo) / Number(traco.consumo_cimento)
        // Se bater próximo de opções conhecidas, adota
        if (fatorSugerido >= 0.0003 && fatorSugerido <= 0.005) {
          setFatorAditivoManual(Number(fatorSugerido.toFixed(4)))
        }
      }
      aplicarDosagemTraco(tracoSelecionadoId, volume)
    } else if (novoModo === 'automatico' && !cargaZerada) {
      aplicarDosagemTraco(tracoSelecionadoId, volume)
    }
  }

  const handleResetarParaTraco = () => {
    if (tracoSelecionadoId) {
      setAditivoEditadoManualmente(false)
      setAguaEditadaManualmente(false)
      aplicarDosagemTraco(tracoSelecionadoId, volume)
      toast({
        title: 'Dosagem restaurada',
        description:
          'Os valores de dosagem (kg/m³) e cálculos de aditivo e água foram restaurados com base no traço selecionado.',
      })
    }
  }

  // Consumos REAIS da carga (multiplicados pelo volume):
  // No modo manual: o operador digita dosagem em kg/m³ e o aditivo já foi calculado como total (L).
  // Portanto: consumo real = dosagem (kg/m³) × volume (m³).
  // Aditivo e Água são gravados como valor INTEIRO (Math.round).
  // No modo automático: os campos do traço são dosagens por m³, multiplicados pelo volume.
  const consumoReal = {
    cimento: Math.round(cimento * volume),
    areia: Math.round(areia * volume),
    brita12: Math.round(brita12 * volume),
    brita19: Math.round(brita19 * volume),
    poPedra: Math.round(poPedra * volume),
    aditivo:
      modoDosagem === 'manual'
        ? Math.round(aditivo)
        : Math.round(aditivo * volume),
    agua: modoDosagem === 'manual' ? Math.round(agua) : Math.round(agua),
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

    // Validação no modo manual: se não for carga zerada, exigir pelo menos um insumo com dosagem > 0
    if (modoDosagem === 'manual' && !cargaZerada) {
      const somaDosagens =
        brita12 + brita19 + areia + poPedra + cimento + aditivo
      if (somaDosagens <= 0) {
        toast({
          title: 'Insumos não informados',
          description:
            'No modo manual, informe a dosagem (kg/m³) de pelo menos um dos insumos ou marque a carga como cancelada/zerada.',
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
        consumo_brita12: consumoReal.brita12,
        consumo_brita19: consumoReal.brita19,
        consumo_areia: consumoReal.areia,
        consumo_po_pedra: consumoReal.poPedra,
        consumo_cimento: consumoReal.cimento,
        consumo_aditivo: consumoReal.aditivo,
        consumo_agua: consumoReal.agua,
        observacao: observacao
          ? modoDosagem === 'manual'
            ? `[Modo Manual | Aditivo: ${consumoReal.aditivo}L${aditivoEditadoManualmente ? ' (manual)' : ` (fator ${fatorAditivoManual})`} | Água: ${consumoReal.agua}L${aguaEditadaManualmente ? ' (manual)' : ` (fator ${fatorAguaManual})`}] ${observacao}`
            : observacao
          : modoDosagem === 'manual'
            ? `[Lançamento manual | Aditivo: ${consumoReal.aditivo}L${aditivoEditadoManualmente ? ' (manual)' : ` (fator ${fatorAditivoManual})`} | Água: ${consumoReal.agua}L${aguaEditadaManualmente ? ' (manual)' : ` (fator ${fatorAguaManual})`}]`
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

  // Estimativa de custo da carga a ser lançada (usando o consumo REAL multiplicado)
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
          consumo_brita12: consumoReal.brita12,
          consumo_brita19: consumoReal.brita19,
          consumo_areia: consumoReal.areia,
          consumo_po_pedra: consumoReal.poPedra,
          consumo_cimento: consumoReal.cimento,
          consumo_aditivo: consumoReal.aditivo,
          consumo_agua: consumoReal.agua,
          observacao: null,
          carga_zerada: false,
        },
        precos,
      )

  // Faixa de fatores do aditivo pedida pelo usuário: 0,005 a 0,010
  const OPCOES_FATOR_ADITIVO = [
    { valor: 0.005, rotulo: '0,005' },
    { valor: 0.006, rotulo: '0,006' },
    { valor: 0.007, rotulo: '0,007' },
    { valor: 0.008, rotulo: '0,008' },
    { valor: 0.009, rotulo: '0,009' },
    { valor: 0.01, rotulo: '0,010' },
  ]

  // Faixa de fatores de água pedida pelo usuário: 0,45 a 0,8
  const OPCOES_FATOR_AGUA = [
    { valor: 0.45, rotulo: '0,45' },
    { valor: 0.5, rotulo: '0,50' },
    { valor: 0.55, rotulo: '0,55' },
    { valor: 0.6, rotulo: '0,60' },
    { valor: 0.65, rotulo: '0,65' },
    { valor: 0.7, rotulo: '0,70' },
    { valor: 0.75, rotulo: '0,75' },
    { valor: 0.8, rotulo: '0,80' },
  ]

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
                  value={volume || ''}
                  onChange={(e) => {
                    const val =
                      e.target.value === '' ? 0 : Number(e.target.value)
                    setVolume(isNaN(val) ? 0 : val)
                  }}
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
                      aplicarDosagemTraco(val, volume)
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
                    ? `Dosagem base do traço por m³ multiplicada pelo volume (${volume} m³). Baixa de estoque apenas para ${materiais.find((m) => m.codigo === 'cimento')?.nome || 'CP II F-40 / CP V ARI'} e Aditivo.`
                    : `Modo manual ativo: informe a dosagem de cada insumo em kg/m³. O consumo gravado e os custos são multiplicados automaticamente pelo volume (${volume} m³).`}
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
                    <strong>Dosagem por m³:</strong> Digite a dosagem de cada
                    insumo em <strong>kg/m³</strong>. O cimento total da carga é{' '}
                    <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono font-semibold">
                      {cimento} kg/m³ × {volume} m³ = {consumoReal.cimento} kg
                    </code>
                    . O <strong>Aditivo</strong> é calculado como{' '}
                    <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono font-semibold">
                      cimento total ({consumoReal.cimento} kg) × fator (
                      {fatorAditivoManual}) = {aditivo} L
                    </code>
                    . A <strong>Água</strong> é calculada como{' '}
                    <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono font-semibold">
                      cimento total ({consumoReal.cimento} kg) × fator (
                      {fatorAguaManual}) = {agua} L
                    </code>
                    .
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

            {/* SEÇÃO INTEGRADA DE VOLUME NO MESMO AMBIENTE DOS INSUMOS */}
            <div className="p-3.5 rounded-lg border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <Label
                    htmlFor="volume-ambiente-insumos"
                    className="text-xs font-semibold text-foreground block"
                  >
                    Volume da Carga (m³)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {modoDosagem === 'manual'
                      ? 'Multiplicador aplicado às dosagens (kg/m³) para obter o consumo total real, aditivo e custos'
                      : 'Volume em metros cúbicos multiplicado pelos insumos do traço'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-36">
                  <Input
                    id="volume-ambiente-insumos"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    value={volume || ''}
                    onChange={(e) => {
                      const val =
                        e.target.value === '' ? 0 : Number(e.target.value)
                      setVolume(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className="font-mono font-bold text-center pr-9 h-9 text-base bg-background"
                    placeholder="8.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    m³
                  </span>
                </div>
              </div>
            </div>

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
                      ? `Calculado sobre o consumo real da carga (${volume} m³ × dosagem)`
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

            {/* Grid dos Insumos (Cimento, Aditivo, ÁGUA, Areia, Brita 12, Brita 19, Pó de Pedra) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    {modoDosagem === 'manual'
                      ? `${materiais.find((m) => m.codigo === 'cimento')?.nome || 'CP II F-40 / CP V ARI'} (kg/m³)`
                      : `${materiais.find((m) => m.codigo === 'cimento')?.nome || 'CP II F-40 / CP V ARI'} (kg)`}
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal shrink-0">
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
                      Traço: {tracoAtual.consumo_cimento} kg/m³
                    </span>
                  )}
                </Label>
                <div className="relative">
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
                        ? 'bg-background border-primary/40 focus-visible:ring-primary pr-14'
                        : 'pr-9'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {modoDosagem === 'manual' ? 'kg/m³' : 'kg'}
                  </span>
                </div>
                {modoDosagem === 'manual' && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.cimento.toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Aditivo: CALCULADO NO MODO MANUAL */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/30'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="aditivo"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    Aditivo (L)
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                      Estoque
                    </span>
                    {modoDosagem === 'manual' &&
                      (aditivoEditadoManualmente ? (
                        <span className="text-[10px] px-1 py-0.2 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded font-medium">
                          Digitado
                        </span>
                      ) : (
                        <span className="text-[10px] px-1 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-medium">
                          Calculado
                        </span>
                      ))}
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_aditivo} L/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{' '}
                      {(Number(tracoAtual.consumo_aditivo) * volume).toFixed(2)}{' '}
                      L
                    </span>
                  )}
                </Label>

                {modoDosagem === 'manual' ? (
                  <div className="space-y-2">
                    {/* Campo Aditivo Editável com opção de recalcular */}
                    <div className="relative flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Input
                          id="aditivo"
                          type="number"
                          min="0"
                          step="1"
                          value={
                            aditivo === 0 && aditivoEditadoManualmente
                              ? ''
                              : aditivo
                          }
                          onChange={(e) => {
                            const val =
                              e.target.value === '' ? 0 : Number(e.target.value)
                            setAditivoEditadoManualmente(true)
                            setAditivo(isNaN(val) ? 0 : Math.round(val))
                          }}
                          disabled={cargaZerada}
                          className="font-mono font-bold text-base bg-background text-foreground pr-8 border-primary/40 focus-visible:ring-primary"
                          placeholder="0"
                          title="Digite o volume de aditivo (L) ou use o cálculo do fator"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                          L
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant={
                          aditivoEditadoManualmente ? 'secondary' : 'outline'
                        }
                        size="icon"
                        onClick={handleRecalcularAditivo}
                        disabled={cargaZerada}
                        className="h-9 w-9 shrink-0"
                        title="Recalcular aditivo pela fórmula (cimento total × fator)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Fator de dosagem selecionável/editável (faixa 0,005 a 0,010) */}
                    <div className="pt-1 border-t border-border/30 flex items-center gap-1.5">
                      <Label
                        htmlFor="fator-aditivo"
                        className="text-[11px] font-medium text-muted-foreground shrink-0"
                      >
                        Fator:
                      </Label>

                      {/* Select com opções rápidas (0,005 a 0,010) */}
                      <Select
                        value={String(fatorAditivoManual)}
                        onValueChange={(val) => {
                          setFatorAditivoManual(Number(val))
                          setAditivoEditadoManualmente(false)
                        }}
                        disabled={cargaZerada}
                      >
                        <SelectTrigger
                          id="fator-aditivo-select"
                          className="h-7 text-xs font-mono font-medium flex-1 px-2 bg-background border-border/60"
                        >
                          <SelectValue placeholder="Selecione o fator" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPCOES_FATOR_ADITIVO.map((op) => (
                            <SelectItem
                              key={op.valor}
                              value={String(op.valor)}
                              className="font-mono text-xs"
                            >
                              {op.rotulo}
                            </SelectItem>
                          ))}
                          {/* Se o valor atual for personalizado e não estiver na lista */}
                          {!OPCOES_FATOR_ADITIVO.some(
                            (o) => o.valor === fatorAditivoManual,
                          ) && (
                            <SelectItem
                              value={String(fatorAditivoManual)}
                              className="font-mono text-xs"
                            >
                              {String(fatorAditivoManual).replace('.', ',')}{' '}
                              (Personalizado)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      {/* Input numérico para digitação livre do fator (faixa 0,005 a 0,01) */}
                      <Input
                        id="fator-aditivo"
                        type="number"
                        step="0.0005"
                        min="0.001"
                        max="0.05"
                        value={fatorAditivoManual}
                        onChange={(e) => {
                          const val =
                            e.target.value === '' ? 0 : Number(e.target.value)
                          setFatorAditivoManual(isNaN(val) ? 0 : val)
                          setAditivoEditadoManualmente(false)
                        }}
                        disabled={cargaZerada}
                        className="h-7 w-20 text-xs font-mono text-center px-1 bg-background"
                        title="Ou digite manualmente o fator"
                      />
                    </div>
                    {/* Legenda com o valor bruto e arredondamento */}
                    <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                      <div>
                        {consumoReal.cimento} kg × {fatorAditivoManual} ={' '}
                        <span className="font-mono font-medium">
                          {aditivoBruto.toFixed(2)} →{' '}
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {Math.round(aditivoBruto)} L
                        </span>
                        {aditivoEditadoManualmente && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold font-mono">
                            (Digitado: {aditivo} L)
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-muted-foreground/80">
                        {aditivoEditadoManualmente
                          ? 'Valor manual digitado pelo operador (clique em ↺ para restaurar a fórmula)'
                          : 'Arredondamento inteiro: ≥ 0,5 sobe | Campo aberto para digitação'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="aditivo"
                      type="number"
                      min="0"
                      step="1"
                      value={consumoReal.aditivo}
                      disabled
                      className="font-mono font-semibold pr-8 bg-muted/40 cursor-not-allowed"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      L
                    </span>
                  </div>
                )}
              </div>

              {/* NOVO: ÁGUA (Calculada com opção de digitação manual) */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === 'manual'
                    ? 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'border-border/40 bg-background/50'
                }`}
              >
                <Label
                  htmlFor="agua"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    Água (L)
                    <span className="text-[10px] px-1 py-0.2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded font-normal">
                      Sem baixa
                    </span>
                    {modoDosagem === 'manual' &&
                      (aguaEditadaManualmente ? (
                        <span className="text-[10px] px-1 py-0.2 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded font-medium">
                          Digitada
                        </span>
                      ) : (
                        <span className="text-[10px] px-1 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-medium">
                          Calculada
                        </span>
                      ))}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Faixa: 0,45 a 0,8
                  </span>
                </Label>

                <div className="space-y-2">
                  {/* Campo Água Editável com opção de recalcular */}
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        id="agua"
                        type="number"
                        min="0"
                        step="1"
                        value={agua === 0 && aguaEditadaManualmente ? '' : agua}
                        onChange={(e) => {
                          const val =
                            e.target.value === '' ? 0 : Number(e.target.value)
                          setAguaEditadaManualmente(true)
                          setAgua(isNaN(val) ? 0 : Math.round(val))
                        }}
                        disabled={cargaZerada}
                        className="font-mono font-bold text-base bg-background text-foreground pr-8 border-cyan-500/40 focus-visible:ring-cyan-500"
                        placeholder="0"
                        title="Digite o volume de água (L) ou use o cálculo do fator"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                        L
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant={aguaEditadaManualmente ? 'secondary' : 'outline'}
                      size="icon"
                      onClick={handleRecalcularAgua}
                      disabled={cargaZerada}
                      className="h-9 w-9 shrink-0"
                      title="Recalcular água pela fórmula (cimento total × fator)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Fator de água selecionável/editável (faixa 0,45 a 0,8) */}
                  <div className="pt-1 border-t border-border/30 flex items-center gap-1.5">
                    <Label
                      htmlFor="fator-agua"
                      className="text-[11px] font-medium text-muted-foreground shrink-0"
                    >
                      Fator:
                    </Label>

                    {/* Select com opções rápidas (0,45 a 0,80) */}
                    <Select
                      value={String(fatorAguaManual)}
                      onValueChange={(val) => {
                        setFatorAguaManual(Number(val))
                        setAguaEditadaManualmente(false)
                      }}
                      disabled={cargaZerada}
                    >
                      <SelectTrigger
                        id="fator-agua-select"
                        className="h-7 text-xs font-mono font-medium flex-1 px-2 bg-background border-border/60"
                      >
                        <SelectValue placeholder="Selecione o fator" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_FATOR_AGUA.map((op) => (
                          <SelectItem
                            key={op.valor}
                            value={String(op.valor)}
                            className="font-mono text-xs"
                          >
                            {op.rotulo}
                          </SelectItem>
                        ))}
                        {/* Se o valor atual for personalizado e não estiver na lista */}
                        {!OPCOES_FATOR_AGUA.some(
                          (o) => o.valor === fatorAguaManual,
                        ) && (
                          <SelectItem
                            value={String(fatorAguaManual)}
                            className="font-mono text-xs"
                          >
                            {String(fatorAguaManual).replace('.', ',')}{' '}
                            (Personalizado)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Input numérico para digitação livre do fator (faixa 0,45 a 0,8) */}
                    <Input
                      id="fator-agua"
                      type="number"
                      step="0.01"
                      min="0.30"
                      max="1.20"
                      value={fatorAguaManual}
                      onChange={(e) => {
                        const val =
                          e.target.value === '' ? 0 : Number(e.target.value)
                        setFatorAguaManual(isNaN(val) ? 0 : val)
                        setAguaEditadaManualmente(false)
                      }}
                      disabled={cargaZerada}
                      className="h-7 w-20 text-xs font-mono text-center px-1 bg-background"
                      title="Ou digite manualmente o fator de água"
                    />
                  </div>

                  {/* Legenda com o valor bruto e arredondamento */}
                  <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                    <div>
                      {consumoReal.cimento} kg × {fatorAguaManual} ={' '}
                      <span className="font-mono font-medium">
                        {aguaBruta.toFixed(2)} →{' '}
                      </span>
                      <span className="font-semibold text-foreground font-mono">
                        {Math.round(aguaBruta)} L
                      </span>
                      {aguaEditadaManualmente && (
                        <span className="ml-1 text-cyan-700 dark:text-cyan-300 font-semibold font-mono">
                          (Digitada: {agua} L)
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-muted-foreground/80">
                      {aguaEditadaManualmente
                        ? 'Valor manual digitado pelo operador (clique em ↺ para restaurar a fórmula | Sem controle de estoque)'
                        : '(Arredondamento inteiro: ≥ 0,5 sobe | Sem controle de estoque | Aberto para digitação)'}
                    </div>
                  </div>
                </div>
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
                    {modoDosagem === 'manual' ? 'Areia (kg/m³)' : 'Areia (kg)'}
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_areia} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_areia} kg/m³
                    </span>
                  )}
                </Label>
                <div className="relative">
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
                        ? 'bg-background border-primary/40 focus-visible:ring-primary pr-14'
                        : 'pr-9'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {modoDosagem === 'manual' ? 'kg/m³' : 'kg'}
                  </span>
                </div>
                {modoDosagem === 'manual' && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.areia.toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                )}
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
                    {modoDosagem === 'manual'
                      ? 'Brita 12 (kg/m³)'
                      : 'Brita 12 (kg)'}
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita12} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_brita12} kg/m³
                    </span>
                  )}
                </Label>
                <div className="relative">
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
                        ? 'bg-background border-primary/40 focus-visible:ring-primary pr-14'
                        : 'pr-9'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {modoDosagem === 'manual' ? 'kg/m³' : 'kg'}
                  </span>
                </div>
                {modoDosagem === 'manual' && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.brita12.toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                )}
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
                    {modoDosagem === 'manual'
                      ? 'Brita 19 (kg/m³)'
                      : 'Brita 19 (kg)'}
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita19} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_brita19} kg/m³
                    </span>
                  )}
                </Label>
                <div className="relative">
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
                        ? 'bg-background border-primary/40 focus-visible:ring-primary pr-14'
                        : 'pr-9'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {modoDosagem === 'manual' ? 'kg/m³' : 'kg'}
                  </span>
                </div>
                {modoDosagem === 'manual' && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.brita19.toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                )}
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
                    {modoDosagem === 'manual'
                      ? 'Pó de Pedra (kg/m³)'
                      : 'Pó de Pedra (kg)'}
                  </span>
                  {tracoAtual && modoDosagem === 'automatico' && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_po_pedra} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === 'manual' && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_po_pedra} kg/m³
                    </span>
                  )}
                </Label>
                <div className="relative">
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
                        ? 'bg-background border-primary/40 focus-visible:ring-primary pr-14'
                        : 'pr-9'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {modoDosagem === 'manual' ? 'kg/m³' : 'kg'}
                  </span>
                </div>
                {modoDosagem === 'manual' && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.poPedra.toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                )}
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
