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
import { useEmpresa } from '@/hooks/use-empresa'
import type {
  Motorista,
  Veiculo,
  Cidade,
  Material,
  PrecoMaterial,
} from '@/types/concreteira'
import {
  Users,
  Truck,
  MapPin,
  Plus,
  RefreshCw,
  Boxes,
  Scale,
  DollarSign,
  Edit2,
  Calculator,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

export default function Cadastros() {
  const { empresaAtiva } = useEmpresa()
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [precos, setPrecos] = useState<PrecoMaterial[]>([])
  const [loading, setLoading] = useState(true)

  // Modal Insumo / Material
  const [openMaterial, setOpenMaterial] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(
    null,
  )
  const [densidadeMat, setDensidadeMat] = useState<number>(1.0)
  const [unidadeCompraMat, setUnidadeCompraMat] = useState<string>('m3')
  const [precoCompraMat, setPrecoCompraMat] = useState<number>(0)

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
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [mot, vei, cid, mats, prcs] = await Promise.all([
        ConcreteiraService.getMotoristas(empresaAtiva.id),
        ConcreteiraService.getVeiculos(empresaAtiva.id),
        ConcreteiraService.getCidades(empresaAtiva.id),
        ConcreteiraService.getMateriais(empresaAtiva.id),
        ConcreteiraService.getPrecosMaterial(empresaAtiva.id),
      ])
      setMotoristas(mot)
      setVeiculos(vei)
      setCidades(cid)
      setMateriais(mats)
      setPrecos(prcs)
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
    if (empresaAtiva) {
      carregarTudo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  const handleSalvarMotorista = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeMotorista.trim()) return
    setSalvando(true)
    try {
      await ConcreteiraService.salvarMotorista(
        nomeMotorista.trim(),
        true,
        undefined,
        empresaAtiva?.id,
      )
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
        true,
        undefined,
        empresaAtiva?.id,
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
        undefined,
        empresaAtiva?.id,
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
            {empresaAtiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie motoristas, frota de caminhões betoneira e cidades
            atendidas da unidade {empresaAtiva?.nome || ''}
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

      <Tabs defaultValue="insumos" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="insumos" className="gap-2">
            <Boxes className="w-4 h-4" />
            Insumos / Custos ({materiais.length})
          </TabsTrigger>
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

        {/* TAB INSUMOS / MATERIAIS */}
        <TabsContent value="insumos" className="mt-6 space-y-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Cadastro de Insumos, Densidades e Unidades de Compra
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure densidades (t/m³), unidades de compra (m³, tonelada,
                  kg) e cálculo automático de custo por kg para as dosagens
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {/* Box Informativo de Regra de Conversão */}
              <div className="mb-4 p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-primary">
                  <Calculator className="w-4 h-4" />
                  Regras de Conversão para Custo por kg (Consumo das Cargas):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-muted-foreground font-mono text-[11px]">
                  <div className="p-2 rounded bg-background/60 border border-border/40">
                    <strong className="text-foreground">Compra em kg:</strong>{' '}
                    custo/kg = Preço Unitário
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border/40">
                    <strong className="text-foreground">
                      Compra em Tonelada:
                    </strong>{' '}
                    custo/kg = Preço / 1.000
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border/40">
                    <strong className="text-foreground">Compra em m³:</strong>{' '}
                    custo/kg = Preço / (Densidade × 1.000)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materiais.map((mat) => {
                  const dens =
                    mat.densidade != null ? Number(mat.densidade) : 1.0
                  const unCompra = mat.unidade_compra || 'kg'
                  const precoCompra =
                    mat.preco_compra != null ? Number(mat.preco_compra) : 0

                  // Custo por kg calculado
                  const custoPorKg = ConcreteiraService.converterCustoPorKg(
                    precoCompra,
                    unCompra,
                    dens,
                  )
                  // Equivalência em kg de 1 unidade de compra
                  const kgEquiv = ConcreteiraService.kgPorUnidadeCompra(
                    unCompra,
                    dens,
                  )

                  return (
                    <div
                      key={mat.id}
                      className="p-3.5 rounded-lg border border-border/40 bg-background/50 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {mat.nome}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Código: {mat.codigo} | Unidade Carga:{' '}
                              {mat.unidade}
                            </p>
                          </div>
                          <Badge
                            variant={
                              mat.controla_estoque ? 'default' : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {mat.controla_estoque
                              ? 'Estoque Controlado'
                              : 'Apenas Consumo'}
                          </Badge>
                        </div>

                        {/* Detalhes de Densidade e Compra */}
                        <div className="mt-3 p-2.5 rounded-md bg-muted/30 border border-border/30 space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Densidade:
                            </span>
                            <span className="font-semibold text-foreground">
                              {dens.toFixed(2)} t/m³
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Unidade de Compra:
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold"
                            >
                              {unCompra}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Preço de Compra:
                            </span>
                            <span className="font-semibold text-foreground">
                              R$ {precoCompra.toFixed(2)} / {unCompra}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-border/30 pt-1 text-primary">
                            <span>Equivalência:</span>
                            <span className="font-bold">
                              1 {unCompra} = {kgEquiv.toLocaleString('pt-BR')}{' '}
                              kg
                            </span>
                          </div>
                        </div>

                        {/* Destaque Custo por kg */}
                        <div className="mt-2.5 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs">
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            Custo por kg:
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            R$ {custoPorKg.toFixed(4)} / kg
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/30 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setMaterialEditando(mat)
                            setDensidadeMat(
                              mat.densidade != null
                                ? Number(mat.densidade)
                                : 1.0,
                            )
                            setUnidadeCompraMat(mat.unidade_compra || 'kg')
                            setPrecoCompraMat(
                              mat.preco_compra != null
                                ? Number(mat.preco_compra)
                                : 0,
                            )
                            setOpenMaterial(true)
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar Densidade / Compra
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

      {/* Modal Editar Densidade e Compra de Insumo */}
      <Dialog open={openMaterial} onOpenChange={setOpenMaterial}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Insumo: {materialEditando?.nome}</DialogTitle>
            <CardDescription className="text-xs">
              Defina a densidade (t/m³), unidade de compra e preço para cálculo
              de custo por kg
            </CardDescription>
          </DialogHeader>

          {materialEditando && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setSalvando(true)
                try {
                  // 1. Atualizar densidade, unidade e preço na tabela materiais
                  await ConcreteiraService.updateMaterialCompra(
                    materialEditando.id,
                    {
                      densidade: Number(densidadeMat),
                      unidade_compra: unidadeCompraMat,
                      preco_compra: Number(precoCompraMat),
                    },
                  )

                  // 2. Atualizar ou refletir o custo por kg convertido na tabela precos_material do mês atual
                  const custoPorKg = ConcreteiraService.converterCustoPorKg(
                    Number(precoCompraMat),
                    unidadeCompraMat,
                    Number(densidadeMat),
                  )
                  const mesAnoAtual = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`
                  await ConcreteiraService.salvarPrecoMaterial({
                    empresa_id: empresaAtiva?.id,
                    material_codigo: materialEditando.codigo,
                    mes_ano: mesAnoAtual,
                    preco_unitario: Number(custoPorKg.toFixed(6)),
                    unidade: materialEditando.unidade || 'kg',
                  })

                  toast({
                    title: 'Insumo atualizado!',
                    description: `Densidade ${densidadeMat} t/m³ e custo R$ ${custoPorKg.toFixed(4)}/kg salvos.`,
                  })
                  setOpenMaterial(false)
                  setMaterialEditando(null)
                  carregarTudo()
                } catch (err: any) {
                  toast({
                    title: 'Erro ao atualizar insumo',
                    description: err.message,
                    variant: 'destructive',
                  })
                } finally {
                  setSalvando(false)
                }
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-2">
                <Label htmlFor="densidade">Densidade (t/m³) *</Label>
                <Input
                  id="densidade"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="10"
                  value={densidadeMat}
                  onChange={(e) => setDensidadeMat(Number(e.target.value))}
                  placeholder="Ex: 1.38"
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  Padrões sugeridos: Brita 12 = 1,38 | Brita 19 = 1,44 | Areia =
                  1,50
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidadeCompra">Unidade de Compra *</Label>
                <Select
                  value={unidadeCompraMat}
                  onValueChange={setUnidadeCompraMat}
                >
                  <SelectTrigger id="unidadeCompra">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m3">m³ (Metro Cúbico)</SelectItem>
                    <SelectItem value="tonelada">Tonelada (t)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="litros">Litros (L)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precoCompra">
                  Preço de Compra por {unidadeCompraMat} (R$) *
                </Label>
                <Input
                  id="precoCompra"
                  type="number"
                  step="any"
                  min="0"
                  value={precoCompraMat}
                  onChange={(e) => setPrecoCompraMat(Number(e.target.value))}
                  placeholder="Ex: 160.00"
                  required
                />
              </div>

              {/* Pré-visualização do Custo por kg */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Equivalência calculada:
                  </span>
                  <span className="font-mono font-semibold">
                    1 {unidadeCompraMat} ={' '}
                    {ConcreteiraService.kgPorUnidadeCompra(
                      unidadeCompraMat,
                      densidadeMat,
                    ).toLocaleString('pt-BR')}{' '}
                    kg
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Custo convertido por kg:</span>
                  <span className="font-mono text-sm">
                    R${' '}
                    {ConcreteiraService.converterCustoPorKg(
                      precoCompraMat,
                      unidadeCompraMat,
                      densidadeMat,
                    ).toFixed(4)}{' '}
                    / kg
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenMaterial(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvando}
                  className="bg-primary text-primary-foreground"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
