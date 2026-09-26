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
  FileCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  parseNFeXML,
  sugerirItemParaMaterial,
  normalizarUnidadeXml,
  type DadosNFe,
  type ItemNFe,
} from '@/lib/nfe-parser'
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

  // Modal XML da Nota Fiscal (NF-e)
  const [openXmlModal, setOpenXmlModal] = useState(false)
  const [materialXml, setMaterialXml] = useState<Material | null>(null)
  const [xmlTexto, setXmlTexto] = useState('')
  const [xmlParseado, setXmlParseado] = useState<DadosNFe | null>(null)
  const [itemSelecionado, setItemSelecionado] = useState<ItemNFe | null>(null)
  const [erroXml, setErroXml] = useState<string | null>(null)
  const [modoEntradaXml, setModoEntradaXml] = useState<'upload' | 'colar'>(
    'upload',
  )
  const [aplicandoXml, setAplicandoXml] = useState(false)

  const processarTextoXml = (conteudoXml: string) => {
    setErroXml(null)
    setXmlParseado(null)
    setItemSelecionado(null)

    if (!conteudoXml.trim()) {
      return
    }

    try {
      const dados = parseNFeXML(conteudoXml)
      setXmlParseado(dados)

      // Sugere item correspondente se houver material ativo
      if (materialXml && dados.itens.length > 0) {
        const sugerido = sugerirItemParaMaterial(
          materialXml.codigo,
          materialXml.nome,
          dados.itens,
        )
        setItemSelecionado(sugerido)
      } else if (dados.itens.length > 0) {
        setItemSelecionado(dados.itens[0])
      }
    } catch (err: any) {
      setErroXml(
        err.message ||
          'Formato de XML inválido. Não foi possível processar a nota fiscal.',
      )
    }
  }

  const handleFileUploadXml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setXmlTexto(text)
      processarTextoXml(text)
    }
    reader.onerror = () => {
      setErroXml('Erro ao ler o arquivo selecionado no seu dispositivo.')
    }
    reader.readAsText(file)
  }

  const handleAplicarPrecoXml = async () => {
    if (!materialXml || !xmlParseado) return

    // Item a ser usado: selecionado ou primeiro item ou cálculo do total da nota
    const item = itemSelecionado || xmlParseado.itens[0]

    // Quantidade comprada: qCom do item se > 0; senão 1
    const qtdComprada = item && item.qCom > 0 ? item.qCom : 1
    // Valor total a considerar: vProd do item ou vNF total da nota
    const valorNota =
      item && item.vProd > 0 ? item.vProd : xmlParseado.valorTotalNota

    // Preço unitário por unidade de compra (R$ / unidade)
    const precoUnitarioCompra =
      qtdComprada > 0 ? valorNota / qtdComprada : valorNota

    // Normalização de unidade se disponível
    const unidadeDetectada = item
      ? normalizarUnidadeXml(item.uCom).unidade
      : ((materialXml.unidade_compra || 'kg') as
          | 'kg'
          | 'tonelada'
          | 'm3'
          | 'litros')

    // Densidade do material
    const densidadeUsada =
      materialXml.densidade != null ? Number(materialXml.densidade) : 1.0

    // Conversão para custo por kg
    const custoPorKg = ConcreteiraService.converterCustoPorKg(
      precoUnitarioCompra,
      unidadeDetectada,
      densidadeUsada,
    )

    // Data da nota para o histórico de preços
    const mesAnoPreco =
      xmlParseado.mesAno ||
      `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`

    setAplicandoXml(true)
    try {
      // 1. Atualiza preço de compra e unidade de compra na tabela materiais
      await ConcreteiraService.updateMaterialCompra(materialXml.id, {
        unidade_compra: unidadeDetectada,
        preco_compra: Number(precoUnitarioCompra.toFixed(4)),
        densidade: densidadeUsada,
      })

      // 2. Persiste o preço unitário convertido por kg no histórico precos_material
      await ConcreteiraService.salvarPrecoMaterial({
        empresa_id: empresaAtiva?.id,
        material_codigo: materialXml.codigo,
        mes_ano: mesAnoPreco,
        preco_unitario: Number(custoPorKg.toFixed(6)),
        unidade: materialXml.unidade || 'kg',
      })

      toast({
        title: 'Preço atualizado com sucesso via NF-e!',
        description: `${materialXml.nome}: R$ ${precoUnitarioCompra.toFixed(2)}/${unidadeDetectada} → R$ ${custoPorKg.toFixed(4)}/kg (Vigência: ${mesAnoPreco}).`,
      })

      setOpenXmlModal(false)
      setMaterialXml(null)
      setXmlTexto('')
      setXmlParseado(null)
      setItemSelecionado(null)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: 'Erro ao aplicar preço da nota',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setAplicandoXml(false)
    }
  }

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

                      <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-medium"
                          onClick={() => {
                            setMaterialXml(mat)
                            setXmlTexto('')
                            setXmlParseado(null)
                            setItemSelecionado(null)
                            setErroXml(null)
                            setModoEntradaXml('upload')
                            setOpenXmlModal(true)
                          }}
                          title="Importar NF-e em XML para calcular custo unitário automaticamente"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          XML da Nota
                        </Button>

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
                          Editar Compra
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

      {/* Modal XML da Nota Fiscal (NF-e) */}
      <Dialog open={openXmlModal} onOpenChange={setOpenXmlModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-primary" />
              Importar XML de NF-e: {materialXml?.nome}
            </DialogTitle>
            <CardDescription className="text-xs">
              Carregue ou cole o XML da NF-e para calcular automaticamente o
              preço unitário e o custo por kg com base no volume e densidade.
            </CardDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Escolha entre upload de arquivo ou colar texto */}
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Button
                type="button"
                variant={modoEntradaXml === 'upload' ? 'default' : 'outline'}
                size="sm"
                className="text-xs gap-1.5 h-8"
                onClick={() => setModoEntradaXml('upload')}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload de Arquivo .XML
              </Button>
              <Button
                type="button"
                variant={modoEntradaXml === 'colar' ? 'default' : 'outline'}
                size="sm"
                className="text-xs gap-1.5 h-8"
                onClick={() => setModoEntradaXml('colar')}
              >
                <FileText className="w-3.5 h-3.5" />
                Colar Código XML
              </Button>
            </div>

            {modoEntradaXml === 'upload' ? (
              <div className="p-4 border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-lg bg-background/50 text-center space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Selecione o arquivo XML da NF-e
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aceita arquivos padrão NF-e / NFC-e / CF-e (.xml)
                  </p>
                </div>
                <div className="pt-2">
                  <Input
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    onChange={handleFileUploadXml}
                    className="max-w-xs mx-auto text-xs cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="xmlArea" className="text-xs">
                  Cole o código XML completo da NF-e:
                </Label>
                <Textarea
                  id="xmlArea"
                  rows={5}
                  value={xmlTexto}
                  onChange={(e) => {
                    const txt = e.target.value
                    setXmlTexto(txt)
                    processarTextoXml(txt)
                  }}
                  placeholder="Cole aqui o conteúdo iniciando com <nfeProc... ou <NFe... ou <infNFe..."
                  className="font-mono text-[11px] bg-background"
                />
              </div>
            )}

            {/* Mensagem de Erro Claro */}
            {erroXml && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Erro ao ler XML:</span>
                  <span>{erroXml}</span>
                </div>
              </div>
            )}

            {/* Exibição dos dados parseados da NF-e */}
            {xmlParseado && (
              <div className="space-y-3 pt-2">
                {/* Resumo da Nota */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      NF-e Identificada{' '}
                      {xmlParseado.numeroNota
                        ? `Nº ${xmlParseado.numeroNota}`
                        : ''}
                      {xmlParseado.serie ? ` (Série ${xmlParseado.serie})` : ''}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      Emissão: {xmlParseado.dataEmissaoFormatada || 'Hoje'}
                    </span>
                  </div>
                  {xmlParseado.emitenteNome && (
                    <div className="text-muted-foreground truncate">
                      <strong>Fornecedor:</strong> {xmlParseado.emitenteNome}{' '}
                      {xmlParseado.emitenteCNPJ
                        ? `(CNPJ: ${xmlParseado.emitenteCNPJ})`
                        : ''}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 font-mono">
                    <span className="text-muted-foreground">
                      Valor Total da Nota (vNF):
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      R${' '}
                      {xmlParseado.valorTotalNota.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Seleção do Item da Nota se houver mais de um */}
                {xmlParseado.itens.length > 1 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>
                        Itens detectados na nota ({xmlParseado.itens.length}):
                      </span>
                      <span className="text-[11px] text-primary font-normal">
                        Selecione o item correspondente ao insumo
                      </span>
                    </Label>
                    <div className="max-h-40 overflow-y-auto divide-y divide-border/30 border rounded-lg bg-background/50">
                      {xmlParseado.itens.map((it) => {
                        const selecionado =
                          itemSelecionado?.numeroItem === it.numeroItem
                        return (
                          <div
                            key={it.numeroItem}
                            onClick={() => setItemSelecionado(it)}
                            className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              selecionado
                                ? 'bg-primary/10 border-l-4 border-primary text-foreground'
                                : 'hover:bg-muted/30 text-muted-foreground'
                            }`}
                          >
                            <div className="max-w-[340px]">
                              <p className="font-medium text-foreground truncate">
                                Item {it.numeroItem}: {it.xProd}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                Qtd: {it.qCom.toLocaleString('pt-BR')} {it.uCom}{' '}
                                | Unitário: R$ {it.vUnCom.toFixed(4)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-foreground block">
                                R$ {it.vProd.toFixed(2)}
                              </span>
                              {selecionado && (
                                <Badge className="text-[9px] bg-primary text-primary-foreground h-4">
                                  Selecionado
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Item Selecionado e Cálculo de Custo por kg */}
                {(() => {
                  const it = itemSelecionado || xmlParseado.itens[0]
                  if (!it && xmlParseado.valorTotalNota <= 0) return null

                  const qtdComprada = it && it.qCom > 0 ? it.qCom : 1
                  const valorTotal =
                    it && it.vProd > 0 ? it.vProd : xmlParseado.valorTotalNota
                  const precoUnitario =
                    qtdComprada > 0 ? valorTotal / qtdComprada : valorTotal
                  const unDetectada = it
                    ? normalizarUnidadeXml(it.uCom).unidade
                    : ((materialXml?.unidade_compra || 'kg') as
                        | 'kg'
                        | 'tonelada'
                        | 'm3'
                        | 'litros')
                  const dens =
                    materialXml?.densidade != null
                      ? Number(materialXml.densidade)
                      : 1.0

                  const custoKgCalculado =
                    ConcreteiraService.converterCustoPorKg(
                      precoUnitario,
                      unDetectada,
                      dens,
                    )

                  return (
                    <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                      <div className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4" />
                        Cálculo Automático de Preço e Custo por kg:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-background/80 border border-emerald-500/20">
                          <span className="text-muted-foreground text-[10px] block">
                            Valor Total do Insumo:
                          </span>
                          <span className="font-bold text-foreground">
                            R${' '}
                            {valorTotal.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-background/80 border border-emerald-500/20">
                          <span className="text-muted-foreground text-[10px] block">
                            Quantidade / Volume:
                          </span>
                          <span className="font-bold text-foreground">
                            {qtdComprada.toLocaleString('pt-BR')}{' '}
                            {it?.uCom || unDetectada}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-background/80 border border-emerald-500/20">
                          <span className="text-muted-foreground text-[10px] block">
                            Preço Unitário da Compra:
                          </span>
                          <span className="font-bold text-foreground">
                            R$ {precoUnitario.toFixed(4)} / {unDetectada}
                          </span>
                        </div>
                      </div>

                      {/* Destaque Conversão por Densidade */}
                      <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs">
                        <div className="text-muted-foreground">
                          Densidade cadastrada:{' '}
                          <strong className="text-foreground">
                            {dens.toFixed(2)} t/m³
                          </strong>{' '}
                          | Vigência:{' '}
                          <strong className="text-foreground">
                            {xmlParseado.mesAno}
                          </strong>
                        </div>
                        <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                          Custo Final: R$ {custoKgCalculado.toFixed(4)} / kg
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenXmlModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!xmlParseado || aplicandoXml}
              onClick={handleAplicarPrecoXml}
              className="bg-primary text-primary-foreground gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {aplicandoXml ? 'Aplicando...' : 'Aplicar ao Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
