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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConcreteiraService } from '@/services/concreteira'
import type { Traco, Motorista, Veiculo, Cidade } from '@/types/concreteira'
import {
  Truck,
  Calculator,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Link, useNavigate } from 'react-router-dom'

export default function LancamentoCargas() {
  const navigate = useNavigate()
  const [tracos, setTracos] = useState<Traco[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [salvando, setSalvando] = useState(false)

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
      try {
        const [tr, mot, veic, cid] = await Promise.all([
          ConcreteiraService.getTracos(),
          ConcreteiraService.getMotoristas(),
          ConcreteiraService.getVeiculos(),
          ConcreteiraService.getCidades(),
        ])
        setTracos(tr)
        setMotoristas(mot)
        setVeiculos(veic)
        setCidades(cid)

        if (tr.length > 0) {
          setTracoSelecionadoId(tr[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar dados do formulário:', err)
      }
    }
    init()
  }, [])

  // Recalcular insumos quando mudar traço, volume ou cargaZerada
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

    const traco = tracos.find((t) => t.id === tracoSelecionadoId)
    if (traco && volume > 0) {
      setBrita12(Math.round(Number(traco.consumo_brita12) * volume))
      setBrita19(Math.round(Number(traco.consumo_brita19) * volume))
      setAreia(Math.round(Number(traco.consumo_areia) * volume))
      setPoPedra(Math.round(Number(traco.consumo_po_pedra) * volume))
      setCimento(Math.round(Number(traco.consumo_cimento) * volume))
      setAditivo(Number((Number(traco.consumo_aditivo) * volume).toFixed(2)))
    }
  }, [tracoSelecionadoId, volume, cargaZerada, tracos])

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

    const traco = tracos.find((t) => t.id === tracoSelecionadoId)

    setSalvando(true)
    try {
      await ConcreteiraService.criarCarga({
        data: dataCarga,
        volume_m3: volume,
        traco_id: traco?.id,
        traco_nome: traco?.nome || 'Traço personalizado',
        motorista_nome: motoristaNome || undefined,
        veiculo_placa: veiculoPlaca || undefined,
        cidade_nome: cidadeNome || undefined,
        consumo_brita12: brita12,
        consumo_brita19: brita19,
        consumo_areia: areia,
        consumo_po_pedra: poPedra,
        consumo_cimento: cimento,
        consumo_aditivo: aditivo,
        observacao,
        carga_zerada: cargaZerada,
      })

      toast({
        title: 'Carga lançada com sucesso!',
        description: cargaZerada
          ? 'Carga cancelada registrada sem baixa de materiais.'
          : 'Baixa de estoque nos agregados, cimento e aditivos realizada com sucesso.',
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Lançamento Rápido de Carga
            </h1>
            <p className="text-sm text-muted-foreground">
              Registro de despacho na balança com dosagem e baixa automática no
              estoque
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
                <Label htmlFor="traco">Traço / Dosagem *</Label>
                <Select
                  value={tracoSelecionadoId}
                  onValueChange={setTracoSelecionadoId}
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

        {/* Bloco 2: Consumo Calculado de Insumos */}
        <Card className="border-border/40 bg-card/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Insumos e Agregados por Carga
                </CardTitle>
                <CardDescription className="text-xs">
                  {tracoAtual
                    ? `Baseado no consumo por m³ do traço selecionado (ajuste manual permitido se necessário)`
                    : 'Insumos calculados'}
                </CardDescription>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-primary/10 text-primary">
                Multiplicador: {volume} m³
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-background/50">
                <Label
                  htmlFor="cimento"
                  className="text-xs text-muted-foreground flex justify-between"
                >
                  <span>Cimento (kg)</span>
                  {tracoAtual && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_cimento} kg/m³)
                    </span>
                  )}
                </Label>
                <Input
                  id="cimento"
                  type="number"
                  value={cimento}
                  onChange={(e) => setCimento(Number(e.target.value))}
                  disabled={cargaZerada}
                  className="font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-background/50">
                <Label
                  htmlFor="aditivo"
                  className="text-xs text-muted-foreground flex justify-between"
                >
                  <span>Aditivo (Litros)</span>
                  {tracoAtual && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_aditivo} L/m³)
                    </span>
                  )}
                </Label>
                <Input
                  id="aditivo"
                  type="number"
                  step="0.1"
                  value={aditivo}
                  onChange={(e) => setAditivo(Number(e.target.value))}
                  disabled={cargaZerada}
                  className="font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-background/50">
                <Label
                  htmlFor="areia"
                  className="text-xs text-muted-foreground flex justify-between"
                >
                  <span>Areia (kg)</span>
                  {tracoAtual && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_areia} kg/m³)
                    </span>
                  )}
                </Label>
                <Input
                  id="areia"
                  type="number"
                  value={areia}
                  onChange={(e) => setAreia(Number(e.target.value))}
                  disabled={cargaZerada}
                  className="font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-background/50">
                <Label
                  htmlFor="brita12"
                  className="text-xs text-muted-foreground flex justify-between"
                >
                  <span>Brita 12 (kg)</span>
                  {tracoAtual && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita12} kg/m³)
                    </span>
                  )}
                </Label>
                <Input
                  id="brita12"
                  type="number"
                  value={brita12}
                  onChange={(e) => setBrita12(Number(e.target.value))}
                  disabled={cargaZerada}
                  className="font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-background/50">
                <Label
                  htmlFor="brita19"
                  className="text-xs text-muted-foreground flex justify-between"
                >
                  <span>Brita 19 (kg)</span>
                  {tracoAtual && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita19} kg/m³)
                    </span>
                  )}
                </Label>
                <Input
                  id="brita19"
                  type="number"
                  value={brita19}
                  onChange={(e) => setBrita19(Number(e.target.value))}
                  disabled={cargaZerada}
                  className="font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-background/50">
                <Label
                  htmlFor="poPedra"
                  className="text-xs text-muted-foreground flex justify-between"
                >
                  <span>Pó de Pedra (kg)</span>
                  {tracoAtual && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_po_pedra} kg/m³)
                    </span>
                  )}
                </Label>
                <Input
                  id="poPedra"
                  type="number"
                  value={poPedra}
                  onChange={(e) => setPoPedra(Number(e.target.value))}
                  disabled={cargaZerada}
                  className="font-mono font-semibold"
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
