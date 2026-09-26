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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConcreteiraService } from '@/services/concreteira'
import type { Motorista, Veiculo, Cidade } from '@/types/concreteira'
import { Users, Truck, MapPin, Plus, Check, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Cadastros() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [loading, setLoading] = useState(true)

  // Modais de Cadastro
  const [openMotorista, setOpenMotorista] = useState(false)
  const [nomeMotorista, setNomeMotorista] = useState('')

  const [openVeiculo, setOpenVeiculo] = useState(false)
  const [placaVeiculo, setPlacaVeiculo] = useState('')
  const [modeloVeiculo, setModeloVeiculo] = useState('')

  const [openCidade, setOpenCidade] = useState(false)
  const [nomeCidade, setNomeCidade] = useState('')
  const [ufCidade, setUfCidade] = useState('PB')

  const [salvando, setSalvando] = useState(false)

  const carregarTudo = async () => {
    setLoading(true)
    try {
      const [mot, vei, cid] = await Promise.all([
        ConcreteiraService.getMotoristas(),
        ConcreteiraService.getVeiculos(),
        ConcreteiraService.getCidades(),
      ])
      setMotoristas(mot)
      setVeiculos(vei)
      setCidades(cid)
    } catch (e: any) {
      toast({
        title: 'Erro ao carregar cadastros',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const handleSalvarMotorista = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeMotorista.trim()) return
    setSalvando(true)
    try {
      await ConcreteiraService.salvarMotorista(nomeMotorista.trim())
      toast({ title: 'Motorista cadastrado com sucesso!' })
      setNomeMotorista('')
      setOpenMotorista(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!placaVeiculo.trim()) return
    setSalvando(true)
    try {
      await ConcreteiraService.salvarVeiculo(
        placaVeiculo.trim().toUpperCase(),
        modeloVeiculo.trim() || undefined,
      )
      toast({ title: 'Veículo cadastrado com sucesso!' })
      setPlacaVeiculo('')
      setModeloVeiculo('')
      setOpenVeiculo(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarCidade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeCidade.trim()) return
    setSalvando(true)
    try {
      await ConcreteiraService.salvarCidade(
        nomeCidade.trim(),
        ufCidade.trim().toUpperCase(),
      )
      toast({ title: 'Cidade cadastrada com sucesso!' })
      setNomeCidade('')
      setOpenCidade(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Cadastros Auxiliares
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie motoristas, frota de caminhões betoneira e cidades
            atendidas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={carregarTudo}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="motoristas" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="motoristas" className="gap-2">
            <Users className="w-4 h-4" />
            Motoristas ({motoristas.length})
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-2">
            <Truck className="w-4 h-4" />
            Veículos ({veiculos.length})
          </TabsTrigger>
          <TabsTrigger value="cidades" className="gap-2">
            <MapPin className="w-4 h-4" />
            Cidades ({cidades.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB MOTORISTAS */}
        <TabsContent value="motoristas" className="mt-6">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Motoristas Cadastrados
                </CardTitle>
                <CardDescription className="text-xs">
                  Condutores autorizados para saídas de caminhão betoneira
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenMotorista(true)}
                className="gap-1 bg-primary text-primary-foreground text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Motorista
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {motoristas.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {m.nome}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Status: Ativo na frota
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                    >
                      Ativo
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB VEÍCULOS */}
        <TabsContent value="veiculos" className="mt-6">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Frota de Caminhões Betoneira
                </CardTitle>
                <CardDescription className="text-xs">
                  Placas e modelos cadastrados para transporte de concreto
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenVeiculo(true)}
                className="gap-1 bg-primary text-primary-foreground text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Veículo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {veiculos.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-base font-bold font-mono tracking-wider text-foreground">
                        {v.placa}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.modelo || 'Betoneira'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                    >
                      Operacional
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CIDADES */}
        <TabsContent value="cidades" className="mt-6">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Cidades de Destino / Atendimento
                </CardTitle>
                <CardDescription className="text-xs">
                  Municípios atendidos pelos despachos da usina
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenCidade(true)}
                className="gap-1 bg-primary text-primary-foreground text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Cidade
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {cidades.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {c.nome}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {c.uf}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Novo Motorista */}
      <Dialog open={openMotorista} onOpenChange={setOpenMotorista}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarMotorista} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nomeMot">Nome Completo *</Label>
              <Input
                id="nomeMot"
                placeholder="Ex: João Ferreira"
                value={nomeMotorista}
                onChange={(e) => setNomeMotorista(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenMotorista(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-primary text-primary-foreground"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Veículo */}
      <Dialog open={openVeiculo} onOpenChange={setOpenVeiculo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Veículo (Placa)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarVeiculo} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="placa">
                Placa do Veículo (ex: ABC-1234 ou ABC1D23) *
              </Label>
              <Input
                id="placa"
                placeholder="Ex: KJR-7715"
                value={placaVeiculo}
                onChange={(e) => setPlacaVeiculo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo / Capacidade</Label>
              <Input
                id="modelo"
                placeholder="Ex: Betoneira 8m³ - Ford Cargo"
                value={modeloVeiculo}
                onChange={(e) => setModeloVeiculo(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenVeiculo(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-primary text-primary-foreground"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Cidade */}
      <Dialog open={openCidade} onOpenChange={setOpenCidade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Cidade de Destino</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarCidade} className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cidadeNome">Nome do Município *</Label>
                <Input
                  id="cidadeNome"
                  placeholder="Ex: Monteiro"
                  value={nomeCidade}
                  onChange={(e) => setNomeCidade(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Input
                  id="uf"
                  placeholder="PB"
                  maxLength={2}
                  value={ufCidade}
                  onChange={(e) => setUfCidade(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCidade(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-primary text-primary-foreground"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
