import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PainelUsuarios } from "@/components/PainelUsuarios"
import { UserCog } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConcreteiraService } from "@/services/concreteira"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import type {
  Motorista,
  Veiculo,
  Cidade,
  Material,
  PrecoMaterial,
  MetaProducao,
} from "@/types/concreteira"
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
  UserCheck,
  Search,
  Building,
  User,
  Trash2,
  FileSpreadsheet,
  Target,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ModalImportarCargasCSV } from "@/components/ModalImportarCargasCSV"
import {
  formatarCpfCnpj,
  formatarCep,
  formatarTelefone,
  validarCPF,
  validarCNPJ,
  limparMascara,
  consultarCNPJ,
  consultarCEP,
} from "@/lib/documentos"
import type { Cliente } from "@/types/concreteira"
import { Textarea } from "@/components/ui/textarea"
import {
  parseNFeXML,
  sugerirItemParaMaterial,
  normalizarUnidadeXml,
  type DadosNFe,
  type ItemNFe,
} from "@/lib/nfe-parser"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export default function Cadastros() {
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()
  const [searchParams, setSearchParams] = useSearchParams()
  const abaUrl = searchParams.get("tab")
  const [abaAtiva, setAbaAtiva] = useState<string>(() => {
    const permitidas = [
      "usuarios",
      "metas",
      "clientes",
      "insumos",
      "motoristas",
      "veiculos",
      "cidades",
    ]
    return abaUrl && permitidas.includes(abaUrl) ? abaUrl : "usuarios"
  })

  useEffect(() => {
    const permitidas = [
      "usuarios",
      "metas",
      "clientes",
      "insumos",
      "motoristas",
      "veiculos",
      "cidades",
    ]
    if (abaUrl && permitidas.includes(abaUrl) && abaUrl !== abaAtiva) {
      setAbaAtiva(abaUrl)
    }
  }, [abaUrl, abaAtiva])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [precos, setPrecos] = useState<PrecoMaterial[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  // Metas de produção
  const [metaProducao, setMetaProducao] = useState<MetaProducao | null>(null)
  const [metaDiariaInput, setMetaDiariaInput] = useState<number>(50)
  const [metaMensalInput, setMetaMensalInput] = useState<number>(1000)
  const [observacaoMetaInput, setObservacaoMetaInput] = useState<string>("")
  const [salvandoMeta, setSalvandoMeta] = useState(false)

  // Estado do Modal de Cliente
  const [openCliente, setOpenCliente] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [tipoCliente, setTipoCliente] = useState<"PF" | "PJ">("PJ")
  const [cpfCnpjCliente, setCpfCnpjCliente] = useState("")
  const [nomeCliente, setNomeCliente] = useState("")
  const [nomeFantasiaCliente, setNomeFantasiaCliente] = useState("")
  const [telefoneCliente, setTelefoneCliente] = useState("")
  const [emailCliente, setEmailCliente] = useState("")
  const [cepCliente, setCepCliente] = useState("")
  const [logradouroCliente, setLogradouroCliente] = useState("")
  const [numeroCliente, setNumeroCliente] = useState("")
  const [complementoCliente, setComplementoCliente] = useState("")
  const [bairroCliente, setBairroCliente] = useState("")
  const [cidadeCliente, setCidadeCliente] = useState("")
  const [ufCliente, setUfCliente] = useState("PB")
  const [observacoesCliente, setObservacoesCliente] = useState("")
  const [exibirInsumosOsCliente, setExibirInsumosOsCliente] = useState(true)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [filtroClientes, setFiltroClientes] = useState("")

  // Modal Insumo / Material
  const [openMaterial, setOpenMaterial] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(
    null,
  )
  const [densidadeMat, setDensidadeMat] = useState<number>(1.0)
  const [unidadeCompraMat, setUnidadeCompraMat] = useState<string>("m3")
  const [precoCompraMat, setPrecoCompraMat] = useState<number>(0)

  // Modal XML da Nota Fiscal (NF-e)
  const [openXmlModal, setOpenXmlModal] = useState(false)
  const [materialXml, setMaterialXml] = useState<Material | null>(null)
  const [xmlTexto, setXmlTexto] = useState("")
  const [xmlParseado, setXmlParseado] = useState<DadosNFe | null>(null)
  const [itemSelecionado, setItemSelecionado] = useState<ItemNFe | null>(null)
  const [erroXml, setErroXml] = useState<string | null>(null)
  const [modoEntradaXml, setModoEntradaXml] = useState<"upload" | "colar">(
    "upload",
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
          "Formato de XML inválido. Não foi possível processar a nota fiscal.",
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
      setErroXml("Erro ao ler o arquivo selecionado no seu dispositivo.")
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

    const isAditivo = materialXml.codigo === "aditivo"

    // Normalização de unidade se disponível
    const unidadeDetectada = item
      ? normalizarUnidadeXml(item.uCom).unidade
      : (materialXml.unidade_compra ||
          (isAditivo ? "litros" : "kg")) as "kg" | "tonelada" | "m3" | "litros"

    // Densidade do material
    const densidadeUsada =
      materialXml.densidade != null ? Number(materialXml.densidade) : 1.0

    // Conversão para a unidade de consumo da concreteira:
    // Para aditivo -> custo por LITRO (R$/L)
    // Para outros materiais -> custo por KG (R$/kg)
    const custoConvertido = isAditivo
      ? ConcreteiraService.converterCustoAditivoPorLitro(
          precoUnitarioCompra,
          unidadeDetectada,
          densidadeUsada,
        )
      : ConcreteiraService.converterCustoPorKg(
          precoUnitarioCompra,
          unidadeDetectada,
          densidadeUsada,
        )

    const unidadeFinal = isAditivo ? "litros" : materialXml.unidade || "kg"
    const unidadeFinalRotulo = isAditivo ? "L" : "kg"

    // Data da nota para o histórico de preços
    const mesAnoPreco =
      xmlParseado.mesAno ||
      `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`

    setAplicandoXml(true)
    try {
      // 1. Atualiza preço de compra e unidade de compra na tabela materiais
      await ConcreteiraService.updateMaterialCompra(materialXml.id, {
        unidade_compra: unidadeDetectada,
        preco_compra: Number(precoUnitarioCompra.toFixed(4)),
        densidade: densidadeUsada,
      })

      // 2. Persiste o preço unitário convertido no histórico precos_material
      await ConcreteiraService.salvarPrecoMaterial({
        empresa_id: empresaAtiva?.id,
        material_codigo: materialXml.codigo,
        mes_ano: mesAnoPreco,
        preco_unitario: Number(custoConvertido.toFixed(6)),
        unidade: unidadeFinal,
      })

      toast({
        title: "Preço atualizado com sucesso via NF-e!",
        description: `${materialXml.nome}: R$ ${precoUnitarioCompra.toFixed(2)}/${unidadeDetectada} → R$ ${custoConvertido.toFixed(4)}/${unidadeFinalRotulo} (Vigência: ${mesAnoPreco}).`,
      })

      setOpenXmlModal(false)
      setMaterialXml(null)
      setXmlTexto("")
      setXmlParseado(null)
      setItemSelecionado(null)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: "Erro ao aplicar preço da nota",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setAplicandoXml(false)
    }
  }

  // Modais de Cadastro
  const [openMotorista, setOpenMotorista] = useState(false)
  const [nomeMotorista, setNomeMotorista] = useState("")

  const [openVeiculo, setOpenVeiculo] = useState(false)
  const [placaVeiculo, setPlacaVeiculo] = useState("")
  const [modeloVeiculo, setModeloVeiculo] = useState("")

  const [openCidade, setOpenCidade] = useState(false)
  const [nomeCidade, setNomeCidade] = useState("")
  const [ufCidade, setUfCidade] = useState("PB")

  const [salvando, setSalvando] = useState(false)
  const [openImportarCsv, setOpenImportarCsv] = useState(false)

  // Estado para confirmação de exclusão genérica com AlertDialog
  const [dialogExclusao, setDialogExclusao] = useState<{
    open: boolean
    tipo: "cliente" | "motorista" | "veiculo" | "cidade" | "material" | "meta"
    id: string
    titulo: string
    descricao: string
  }>({
    open: false,
    tipo: "cliente",
    id: "",
    titulo: "",
    descricao: "",
  })
  const [excluindo, setExcluindo] = useState(false)

  const carregarTudo = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [mot, vei, cid, mats, prcs, clis, meta] = await Promise.all([
        ConcreteiraService.getMotoristas(empresaAtiva.id),
        ConcreteiraService.getVeiculos(empresaAtiva.id),
        ConcreteiraService.getCidades(empresaAtiva.id),
        ConcreteiraService.getMateriais(empresaAtiva.id),
        ConcreteiraService.getPrecosMaterial(empresaAtiva.id),
        ConcreteiraService.getClientes(empresaAtiva.id),
        ConcreteiraService.getMetaProducao(empresaAtiva.id),
      ])
      setMotoristas(mot)
      setVeiculos(vei)
      setCidades(cid)
      setMateriais(mats)
      setPrecos(prcs)
      setClientes(clis)
      if (meta) {
        setMetaProducao(meta)
        setMetaDiariaInput(meta.meta_diaria_m3)
        setMetaMensalInput(meta.meta_mensal_m3)
        setObservacaoMetaInput(meta.observacao || "")
      }
    } catch (e: any) {
      toast({
        title: "Erro ao carregar cadastros",
        description: e.message,
        variant: "destructive",
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
      toast({ title: "Motorista cadastrado com sucesso!" })
      setNomeMotorista("")
      setOpenMotorista(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: "Erro ao cadastrar",
        description: err.message,
        variant: "destructive",
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
      toast({ title: "Veículo cadastrado com sucesso!" })
      setPlacaVeiculo("")
      setModeloVeiculo("")
      setOpenVeiculo(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: "Erro ao cadastrar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva) return
    setSalvandoMeta(true)
    try {
      const salva = await ConcreteiraService.salvarMetaProducao({
        empresa_id: empresaAtiva.id,
        meta_diaria_m3: Number(metaDiariaInput) || 0,
        meta_mensal_m3: Number(metaMensalInput) || 0,
        observacao: observacaoMetaInput.trim() || undefined,
      })
      setMetaProducao(salva)
      toast({
        title: "Metas de produção salvas!",
        description: `Diária: ${salva.meta_diaria_m3} m³ | Mensal: ${salva.meta_mensal_m3} m³ salvas para a unidade ${empresaAtiva.nome}.`,
      })
    } catch (err: any) {
      toast({
        title: "Erro ao salvar metas",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoMeta(false)
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
      toast({ title: "Cidade cadastrada com sucesso!" })
      setNomeCidade("")
      setOpenCidade(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: "Erro ao cadastrar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  // Abertura do modal de cliente
  const handleNovoCliente = () => {
    setClienteEditando(null)
    setTipoCliente("PJ")
    setCpfCnpjCliente("")
    setNomeCliente("")
    setNomeFantasiaCliente("")
    setTelefoneCliente("")
    setEmailCliente("")
    setCepCliente("")
    setLogradouroCliente("")
    setNumeroCliente("")
    setComplementoCliente("")
    setBairroCliente("")
    setCidadeCliente("")
    setUfCliente("PB")
    setObservacoesCliente("")
    setExibirInsumosOsCliente(true)
    setOpenCliente(true)
  }

  const handleEditarCliente = (cli: Cliente) => {
    setClienteEditando(cli)
    setTipoCliente(cli.tipo || "PJ")
    setCpfCnpjCliente(formatarCpfCnpj(cli.cpf_cnpj))
    setNomeCliente(cli.nome || "")
    setNomeFantasiaCliente(cli.nome_fantasia || "")
    setTelefoneCliente(cli.telefone ? formatarTelefone(cli.telefone) : "")
    setEmailCliente(cli.email || "")
    setCepCliente(cli.cep ? formatarCep(cli.cep) : "")
    setLogradouroCliente(cli.logradouro || "")
    setNumeroCliente(cli.numero || "")
    setComplementoCliente(cli.complemento || "")
    setBairroCliente(cli.bairro || "")
    setCidadeCliente(cli.cidade || "")
    setUfCliente(cli.uf || "PB")
    setObservacoesCliente(cli.observacoes || "")
    setExibirInsumosOsCliente(cli.exibir_insumos_os ?? true)
    setOpenCliente(true)
  }

  // Busca automática ao sair do campo CPF/CNPJ
  const handleBlurCpfCnpj = async () => {
    const raw = limparMascara(cpfCnpjCliente)
    if (!raw) return

    if (tipoCliente === "PF") {
      if (raw.length === 11) {
        if (!validarCPF(raw)) {
          toast({
            title: "CPF com dígitos inválidos",
            description:
              "Verifique se os 11 números foram digitados corretamente.",
            variant: "destructive",
          })
        }
      }
    } else {
      // PJ: busca na BrasilAPI
      if (raw.length === 14) {
        if (!validarCNPJ(raw)) {
          toast({
            title: "CNPJ inválido",
            description: "Verifique o número digitado.",
            variant: "destructive",
          })
          return
        }

        setBuscandoCnpj(true)
        try {
          const dados = await consultarCNPJ(raw)
          if (dados.razao_social) setNomeCliente(dados.razao_social)
          if (dados.nome_fantasia) setNomeFantasiaCliente(dados.nome_fantasia)
          if (dados.ddd_telefone_1) setTelefoneCliente(dados.ddd_telefone_1)
          if (dados.email) setEmailCliente(dados.email.toLowerCase())
          if (dados.cep) setCepCliente(formatarCep(dados.cep))
          if (dados.logradouro) setLogradouroCliente(dados.logradouro)
          if (dados.numero) setNumeroCliente(dados.numero)
          if (dados.complemento) setComplementoCliente(dados.complemento)
          if (dados.bairro) setBairroCliente(dados.bairro)
          if (dados.municipio) setCidadeCliente(dados.municipio)
          if (dados.uf) setUfCliente(dados.uf)

          toast({
            title: "Dados do CNPJ preenchidos!",
            description: dados.razao_social,
          })
        } catch (err: any) {
          toast({
            title: "Consulta automática indisponível",
            description: err.message,
          })
        } finally {
          setBuscandoCnpj(false)
        }
      }
    }
  }

  // Busca automática de endereço ao sair do campo CEP
  const handleBlurCep = async () => {
    const raw = limparMascara(cepCliente)
    if (raw.length !== 8) return

    setBuscandoCep(true)
    try {
      const dados = await consultarCEP(raw)
      if (dados.logradouro) setLogradouroCliente(dados.logradouro)
      if (dados.bairro) setBairroCliente(dados.bairro)
      if (dados.localidade) setCidadeCliente(dados.localidade)
      if (dados.uf) setUfCliente(dados.uf)
      if (dados.complemento && !complementoCliente)
        setComplementoCliente(dados.complemento)

      toast({
        title: "Endereço localizado via CEP!",
        description: `${dados.localidade} - ${dados.uf}`,
      })
    } catch (err: any) {
      toast({
        title: "Aviso de CEP",
        description: err.message,
      })
    } finally {
      setBuscandoCep(false)
    }
  }

  // Salvar cliente
  const handleSalvarClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeCliente.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o Nome ou Razão Social do cliente.",
        variant: "destructive",
      })
      return
    }

    const docLimpo = limparMascara(cpfCnpjCliente)
    if (!docLimpo) {
      toast({
        title: "Campo obrigatório",
        description: `Informe o ${
          tipoCliente === "PF" ? "CPF" : "CNPJ"
        } do cliente.`,
        variant: "destructive",
      })
      return
    }

    if (tipoCliente === "PF" && !validarCPF(docLimpo)) {
      toast({
        title: "CPF Inválido",
        description:
          "O número de CPF informado possui dígitos verificadores incorretos.",
        variant: "destructive",
      })
      return
    }

    if (tipoCliente === "PJ" && !validarCNPJ(docLimpo)) {
      toast({
        title: "CNPJ Inválido",
        description:
          "O número de CNPJ informado possui dígitos verificadores incorretos.",
        variant: "destructive",
      })
      return
    }

    setSalvando(true)
    try {
      await ConcreteiraService.salvarCliente(
        {
          id: clienteEditando?.id,
          tipo: tipoCliente,
          cpf_cnpj: formatarCpfCnpj(docLimpo),
          nome: nomeCliente.trim(),
          nome_fantasia: nomeFantasiaCliente.trim() || null,
          telefone: telefoneCliente.trim() || null,
          email: emailCliente.trim() || null,
          cep: cepCliente.trim() || null,
          logradouro: logradouroCliente.trim() || null,
          numero: numeroCliente.trim() || null,
          complemento: complementoCliente.trim() || null,
          bairro: bairroCliente.trim() || null,
          cidade: cidadeCliente.trim() || null,
          uf: ufCliente.trim().toUpperCase() || "PB",
          observacoes: observacoesCliente.trim() || null,
          ativo: true,
          exibir_insumos_os: exibirInsumosOsCliente,
        },
        empresaAtiva?.id,
      )

      toast({
        title: clienteEditando
          ? "Cliente atualizado com sucesso!"
          : "Cliente cadastrado com sucesso!",
      })
      setOpenCliente(false)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar cliente",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    const { tipo, id, titulo } = dialogExclusao
    if (!id && tipo !== "meta") return
    setExcluindo(true)
    try {
      if (tipo === "cliente") {
        await ConcreteiraService.excluirCliente(id, empresaAtiva?.id)
        toast({ title: "Cliente excluído com sucesso!" })
      } else if (tipo === "motorista") {
        await ConcreteiraService.excluirMotorista(id, empresaAtiva?.id)
        toast({ title: "Motorista excluído com sucesso!" })
      } else if (tipo === "veiculo") {
        await ConcreteiraService.excluirVeiculo(id, empresaAtiva?.id)
        toast({ title: "Veículo excluído com sucesso!" })
      } else if (tipo === "cidade") {
        await ConcreteiraService.excluirCidade(id, empresaAtiva?.id)
        toast({ title: "Cidade excluída com sucesso!" })
      } else if (tipo === "material") {
        await ConcreteiraService.excluirMaterial(id, empresaAtiva?.id)
        toast({ title: "Insumo excluído com sucesso!" })
      } else if (tipo === "meta") {
        if (empresaAtiva?.id) {
          await ConcreteiraService.excluirMetaProducao(empresaAtiva.id)
          setMetaProducao(null)
          setMetaDiariaInput(50)
          setMetaMensalInput(1000)
          setObservacaoMetaInput("")
          toast({ title: "Metas de produção redefinidas com sucesso!" })
        }
      }
      setDialogExclusao((prev) => ({ ...prev, open: false }))
      carregarTudo()
    } catch (err: any) {
      toast({
        title: `Erro ao excluir ${titulo}`,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setExcluindo(false)
    }
  }

  // Filtro de clientes
  const clientesFiltrados = clientes.filter((c) => {
    if (!filtroClientes) return true
    const termo = filtroClientes.toLowerCase()
    return (
      c.nome?.toLowerCase().includes(termo) ||
      c.cpf_cnpj?.toLowerCase().includes(termo) ||
      c.cidade?.toLowerCase().includes(termo) ||
      c.bairro?.toLowerCase().includes(termo)
    )
  })

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
            atendidas da unidade {empresaAtiva?.nome || ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setOpenImportarCsv(true)}
            className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
            title="Importar cargas e controle diário de materiais da empresa ativa via CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Importar Cargas (CSV)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarTudo}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs
        value={abaAtiva}
        onValueChange={(val) => {
          setAbaAtiva(val)
          setSearchParams({ tab: val }, { replace: true })
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-7 w-full max-w-4xl">
          <TabsTrigger value="usuarios" className="gap-1.5 text-xs">
            <UserCog className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-1.5 text-xs">
            <Target className="w-4 h-4 text-primary" />
            Metas m³
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-1.5 text-xs">
            <UserCheck className="w-4 h-4" />
            Clientes ({clientes.length})
          </TabsTrigger>
          <TabsTrigger value="insumos" className="gap-1.5 text-xs">
            <Boxes className="w-4 h-4" />
            Insumos ({materiais.length})
          </TabsTrigger>
          <TabsTrigger value="motoristas" className="gap-1.5 text-xs">
            <Users className="w-4 h-4" />
            Motoristas ({motoristas.length})
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-1.5 text-xs">
            <Truck className="w-4 h-4" />
            Veículos ({veiculos.length})
          </TabsTrigger>
          <TabsTrigger value="cidades" className="gap-1.5 text-xs">
            <MapPin className="w-4 h-4" />
            Cidades ({cidades.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB USUÁRIOS */}
        <TabsContent value="usuarios" className="mt-6 space-y-4">
          <PainelUsuarios />
        </TabsContent>

        {/* TAB METAS DE PRODUÇÃO (Opção 2) */}
        <TabsContent value="metas" className="mt-6 space-y-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Metas de Produção de Concreto Usinado (
                    {empresaAtiva?.nome || "Unidade"})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Defina a meta diária e mensal em metros cúbicos (m³) para a
                    concreteira. O Dashboard exibirá os indicadores em tempo
                    real comparando realizado vs. meta.
                  </CardDescription>
                </div>
                {metaProducao && (
                  <Badge
                    variant="outline"
                    className="font-mono text-xs bg-primary/10 text-primary border-primary/30 shrink-0"
                  >
                    Última atualização:{" "}
                    {new Date(
                      metaProducao.updated_at || metaProducao.created_at || "",
                    ).toLocaleDateString("pt-BR")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvarMeta} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-background/50">
                    <Label
                      htmlFor="metaDiaria"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between"
                    >
                      <span>Meta Diária</span>
                      <span className="text-[10px] text-primary lowercase font-normal font-mono">
                        m³ / dia
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="metaDiaria"
                        type="number"
                        step="any"
                        min="0"
                        value={metaDiariaInput}
                        onChange={(e) =>
                          setMetaDiariaInput(Number(e.target.value))
                        }
                        className="h-11 text-lg font-bold font-mono pl-3 pr-12"
                        placeholder="Ex: 50"
                        required
                      />
                      <span className="absolute right-3 top-3 text-xs text-muted-foreground font-mono">
                        m³
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Volume esperado de concreto expedido por dia de operação
                      na usina.
                    </p>
                  </div>

                  <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-background/50">
                    <Label
                      htmlFor="metaMensal"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between"
                    >
                      <span>Meta Mensal</span>
                      <span className="text-[10px] text-primary lowercase font-normal font-mono">
                        m³ / mês
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="metaMensal"
                        type="number"
                        step="any"
                        min="0"
                        value={metaMensalInput}
                        onChange={(e) =>
                          setMetaMensalInput(Number(e.target.value))
                        }
                        className="h-11 text-lg font-bold font-mono pl-3 pr-12"
                        placeholder="Ex: 1000"
                        required
                      />
                      <span className="absolute right-3 top-3 text-xs text-muted-foreground font-mono">
                        m³
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Meta consolidada do mês civil para a unidade ativa (
                      {empresaAtiva?.nome}).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obsMeta" className="text-xs font-medium">
                    Observações / Critérios de Planejamento (opcional)
                  </Label>
                  <Input
                    id="obsMeta"
                    value={observacaoMetaInput}
                    onChange={(e) => setObservacaoMetaInput(e.target.value)}
                    placeholder="Ex: Meta revisada conforme capacidade dos caminhões e safra regional"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
                  <div className="text-muted-foreground">
                    <strong className="text-foreground">
                      Unidade Configurada:
                    </strong>{" "}
                    {empresaAtiva?.nome} ({empresaAtiva?.slug?.toUpperCase()})
                    <span className="block text-[11px] mt-0.5">
                      Multi-empresa: Monteiro e SJE têm metas individuais e
                      totalmente isoladas.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdministrador && metaProducao && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDialogExclusao({
                            open: true,
                            tipo: "meta",
                            id: metaProducao.id,
                            titulo: "Metas de Produção",
                            descricao: `Deseja realmente remover/redefinir as metas de produção configuradas para a unidade ${empresaAtiva?.nome}? Os valores voltarão aos padrões iniciais.`,
                          })
                        }
                        className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                        title="Limpar e redefinir metas desta unidade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir Metas
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={salvandoMeta}
                      className="bg-primary text-primary-foreground font-semibold gap-1.5 text-xs shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {salvandoMeta ? "Salvando..." : "Salvar Metas"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CLIENTES */}
        <TabsContent value="clientes" className="mt-6 space-y-4">
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Cadastro de Clientes e Destinatários
                </CardTitle>
                <CardDescription className="text-xs">
                  Pessoas Físicas e Jurídicas para emissão de Ordens de Serviço,
                  com busca automática de CNPJ (BrasilAPI) e CEP (ViaCEP)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, documento, cidade..."
                    value={filtroClientes}
                    onChange={(e) => setFiltroClientes(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleNovoCliente}
                  className="gap-1 bg-primary text-primary-foreground text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientesFiltrados.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs italic">
                  Nenhum cliente encontrado. Clique em "Novo Cliente" para
                  adicionar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                      <tr>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Razão Social / Nome</th>
                        <th className="py-2.5 px-3">CPF / CNPJ</th>
                        <th className="py-2.5 px-3">Telefone</th>
                        <th className="py-2.5 px-3">Cidade / Bairro</th>
                        <th className="py-2.5 px-3">CEP</th>
                        <th className="py-2.5 px-3">Insumos na OS</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {clientesFiltrados.map((cli) => (
                        <tr
                          key={cli.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                cli.tipo === "PJ" ? "default" : "secondary"
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              {cli.tipo === "PJ" ? "PJ" : "PF"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-foreground block">
                              {cli.nome}
                            </span>
                            {cli.nome_fantasia && (
                              <span className="text-[10px] text-muted-foreground block">
                                {cli.nome_fantasia}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">
                            {cli.cpf_cnpj}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {cli.telefone || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {cli.cidade
                              ? `${cli.cidade} - ${cli.uf || "PB"}`
                              : "—"}
                            {cli.bairro ? ` (${cli.bairro})` : ""}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">
                            {cli.cep || "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                cli.exibir_insumos_os !== false
                                  ? "outline"
                                  : "secondary"
                              }
                              className={
                                cli.exibir_insumos_os !== false
                                  ? "text-emerald-600 border-emerald-500/40 bg-emerald-500/10 text-[10px]"
                                  : "text-muted-foreground text-[10px]"
                              }
                            >
                              {cli.exibir_insumos_os !== false ? "Sim" : "Não"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEditarCliente(cli)}
                                title="Editar Cliente"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-foreground" />
                              </Button>
                              {isAdministrador && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    setDialogExclusao({
                                      open: true,
                                      tipo: "cliente",
                                      id: cli.id,
                                      titulo: "Cliente",
                                      descricao: `Deseja realmente excluir o cadastro do cliente "${cli.nome}"? Ordens de Serviço vinculadas a ele impedirão a exclusão direta para manter o histórico fiscal e operacional.`,
                                    })
                                  }
                                  title="Excluir Cliente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                  Regras de Conversão de Custos para as Dosagens das Cargas:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-muted-foreground font-mono text-[11px]">
                  <div className="p-2 rounded bg-background/60 border border-border/40">
                    <strong className="text-foreground">Sólidos em kg:</strong>{" "}
                    custo/kg = Preço Unitário
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border/40">
                    <strong className="text-foreground">
                      Sólidos em Tonelada:
                    </strong>{" "}
                    custo/kg = Preço / 1.000
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border/40">
                    <strong className="text-foreground">Sólidos em m³:</strong>{" "}
                    custo/kg = Preço / (Densidade × 1.000)
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-primary/30 bg-primary/5">
                    <strong className="text-primary font-bold">
                      Aditivo Químico:
                    </strong>{" "}
                    custo/L = direto em Litros (ou R$/kg × densidade)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materiais.map((mat) => {
                  const dens =
                    mat.densidade != null ? Number(mat.densidade) : 1.0
                  const isAditivo = mat.codigo === "aditivo"
                  const unCompra =
                    mat.unidade_compra || (isAditivo ? "litros" : "kg")
                  const precoCompra =
                    mat.preco_compra != null ? Number(mat.preco_compra) : 0

                  // Custo unitário convertido conforme a unidade de consumo (L para aditivo, kg para os demais)
                  const custoConvertido = isAditivo
                    ? ConcreteiraService.converterCustoAditivoPorLitro(
                        precoCompra,
                        unCompra,
                        dens,
                      )
                    : ConcreteiraService.converterCustoPorKg(
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
                              Código: {mat.codigo} | Unidade Carga:{" "}
                              {mat.unidade}
                            </p>
                          </div>
                          <Badge
                            variant={
                              mat.controla_estoque ? "default" : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {mat.controla_estoque
                              ? "Estoque Controlado"
                              : "Apenas Consumo"}
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
                              {isAditivo
                                ? unCompra === "litros"
                                  ? "1 L = 1 Litro consumido"
                                  : `1 ${unCompra} = ${dens.toFixed(2)} kg/L`
                                : `1 ${unCompra} = ${kgEquiv.toLocaleString("pt-BR")} kg`}
                            </span>
                          </div>
                        </div>

                        {/* Destaque Custo Convertido (por L para aditivo, por kg para os demais) */}
                        <div className="mt-2.5 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs">
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {isAditivo ? "Custo por Litro:" : "Custo por kg:"}
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            R$ {custoConvertido.toFixed(4)} /{" "}
                            {isAditivo ? "L" : "kg"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-medium"
                            onClick={() => {
                              setMaterialXml(mat)
                              setXmlTexto("")
                              setXmlParseado(null)
                              setItemSelecionado(null)
                              setErroXml(null)
                              setModoEntradaXml("upload")
                              setOpenXmlModal(true)
                            }}
                            title="Importar NF-e em XML para calcular custo unitário automaticamente"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            XML da Nota
                          </Button>
                          {isAdministrador && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setDialogExclusao({
                                  open: true,
                                  tipo: "material",
                                  id: mat.id,
                                  titulo: "Insumo / Material",
                                  descricao: `Deseja realmente excluir o insumo "${mat.nome}"? Se houver cargas, movimentações de estoque ou dosagens vinculadas, a exclusão será bloqueada pelo sistema.`,
                                })
                              }
                              title="Excluir Insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

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
                            setUnidadeCompraMat(mat.unidade_compra || "kg")
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
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                      >
                        Ativo
                      </Badge>
                      {isAdministrador && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDialogExclusao({
                              open: true,
                              tipo: "motorista",
                              id: m.id,
                              titulo: "Motorista",
                              descricao: `Deseja realmente excluir o motorista "${m.nome}"? Se ele possuir cargas expedidas associadas, a exclusão será bloqueada para manter a rastreabilidade das entregas.`,
                            })
                          }
                          title="Excluir Motorista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
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
                        {v.modelo || "Betoneira"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                      >
                        Operacional
                      </Badge>
                      {isAdministrador && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDialogExclusao({
                              open: true,
                              tipo: "veiculo",
                              id: v.id,
                              titulo: "Veículo",
                              descricao: `Deseja realmente excluir o veículo placa "${v.placa}"? Cargas associadas a este veículo impedirão a exclusão para preservar o histórico da frota.`,
                            })
                          }
                          title="Excluir Veículo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {c.uf}
                      </Badge>
                      {isAdministrador && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDialogExclusao({
                              open: true,
                              tipo: "cidade",
                              id: c.id,
                              titulo: "Cidade",
                              descricao: `Deseja realmente excluir a cidade "${c.nome} - ${c.uf}"? Se houver cargas registradas com destino a esta cidade, a exclusão será bloqueada.`,
                            })
                          }
                          title="Excluir Cidade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
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

                  // 2. Atualizar ou refletir o custo unitário convertido na tabela precos_material do mês atual
                  const isAdt = materialEditando.codigo === "aditivo"
                  const custoCalculado = isAdt
                    ? ConcreteiraService.converterCustoAditivoPorLitro(
                        Number(precoCompraMat),
                        unidadeCompraMat,
                        Number(densidadeMat),
                      )
                    : ConcreteiraService.converterCustoPorKg(
                        Number(precoCompraMat),
                        unidadeCompraMat,
                        Number(densidadeMat),
                      )

                  const unAlvo = isAdt
                    ? "litros"
                    : materialEditando.unidade || "kg"
                  const unAlvoRotulo = isAdt ? "L" : "kg"

                  const mesAnoAtual = `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`
                  await ConcreteiraService.salvarPrecoMaterial({
                    empresa_id: empresaAtiva?.id,
                    material_codigo: materialEditando.codigo,
                    mes_ano: mesAnoAtual,
                    preco_unitario: Number(custoCalculado.toFixed(6)),
                    unidade: unAlvo,
                  })

                  toast({
                    title: "Insumo atualizado!",
                    description: `Densidade ${densidadeMat} e custo R$ ${custoCalculado.toFixed(4)}/${unAlvoRotulo} salvos.`,
                  })
                  setOpenMaterial(false)
                  setMaterialEditando(null)
                  carregarTudo()
                } catch (err: any) {
                  toast({
                    title: "Erro ao atualizar insumo",
                    description: err.message,
                    variant: "destructive",
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
                  {materialEditando?.codigo === "aditivo"
                    ? "Aditivo químico padrão: 1,00 a 1,15 kg/L (usado quando a compra vier faturada em kg)."
                    : "Padrões sugeridos: Brita 12 = 1,38 | Brita 19 = 1,44 | Areia = 1,50 | Pó de Pedra = 1,40"}
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

              {/* Pré-visualização do Custo Convertido */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Equivalência calculada:
                  </span>
                  <span className="font-mono font-semibold">
                    {materialEditando?.codigo === "aditivo"
                      ? unidadeCompraMat === "litros"
                        ? "1 L = 1 Litro consumido"
                        : `1 ${unidadeCompraMat} = ${Number(densidadeMat).toFixed(2)} kg/L`
                      : `1 ${unidadeCompraMat} = ${ConcreteiraService.kgPorUnidadeCompra(
                          unidadeCompraMat,
                          densidadeMat,
                        ).toLocaleString("pt-BR")} kg`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>
                    {materialEditando?.codigo === "aditivo"
                      ? "Custo convertido por Litro:"
                      : "Custo convertido por kg:"}
                  </span>
                  <span className="font-mono text-sm">
                    R${" "}
                    {materialEditando?.codigo === "aditivo"
                      ? ConcreteiraService.converterCustoAditivoPorLitro(
                          precoCompraMat,
                          unidadeCompraMat,
                          densidadeMat,
                        ).toFixed(4)
                      : ConcreteiraService.converterCustoPorKg(
                          precoCompraMat,
                          unidadeCompraMat,
                          densidadeMat,
                        ).toFixed(4)}{" "}
                    / {materialEditando?.codigo === "aditivo" ? "L" : "kg"}
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
                  {salvando ? "Salvando..." : "Salvar Alterações"}
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
              preço unitário e o custo{" "}
              {materialXml?.codigo === "aditivo" ? "por Litro" : "por kg"} com
              base no volume e densidade.
            </CardDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Escolha entre upload de arquivo ou colar texto */}
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Button
                type="button"
                variant={modoEntradaXml === "upload" ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5 h-8"
                onClick={() => setModoEntradaXml("upload")}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload de Arquivo .XML
              </Button>
              <Button
                type="button"
                variant={modoEntradaXml === "colar" ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5 h-8"
                onClick={() => setModoEntradaXml("colar")}
              >
                <FileText className="w-3.5 h-3.5" />
                Colar Código XML
              </Button>
            </div>

            {modoEntradaXml === "upload" ? (
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
                      NF-e Identificada{" "}
                      {xmlParseado.numeroNota
                        ? `Nº ${xmlParseado.numeroNota}`
                        : ""}
                      {xmlParseado.serie ? ` (Série ${xmlParseado.serie})` : ""}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      Emissão: {xmlParseado.dataEmissaoFormatada || "Hoje"}
                    </span>
                  </div>
                  {xmlParseado.emitenteNome && (
                    <div className="text-muted-foreground truncate">
                      <strong>Fornecedor:</strong> {xmlParseado.emitenteNome}{" "}
                      {xmlParseado.emitenteCNPJ
                        ? `(CNPJ: ${xmlParseado.emitenteCNPJ})`
                        : ""}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 font-mono">
                    <span className="text-muted-foreground">
                      Valor Total da Nota (vNF):
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      R${" "}
                      {xmlParseado.valorTotalNota.toLocaleString("pt-BR", {
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
                                ? "bg-primary/10 border-l-4 border-primary text-foreground"
                                : "hover:bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            <div className="max-w-[340px]">
                              <p className="font-medium text-foreground truncate">
                                Item {it.numeroItem}: {it.xProd}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                Qtd: {it.qCom.toLocaleString("pt-BR")} {it.uCom}{" "}
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
                    : (materialXml?.unidade_compra ||
                        "kg") as "kg" | "tonelada" | "m3" | "litros"
                  const dens =
                    materialXml?.densidade != null
                      ? Number(materialXml.densidade)
                      : 1.0

                  const isAdt = materialXml?.codigo === "aditivo"
                  const custoCalculado = isAdt
                    ? ConcreteiraService.converterCustoAditivoPorLitro(
                        precoUnitario,
                        unDetectada,
                        dens,
                      )
                    : ConcreteiraService.converterCustoPorKg(
                        precoUnitario,
                        unDetectada,
                        dens,
                      )

                  return (
                    <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                      <div className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4" />
                        Cálculo Automático de Preço e Custo{" "}
                        {isAdt ? "por Litro (L)" : "por kg"}:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-background/80 border border-emerald-500/20">
                          <span className="text-muted-foreground text-[10px] block">
                            Valor Total do Insumo:
                          </span>
                          <span className="font-bold text-foreground">
                            R${" "}
                            {valorTotal.toLocaleString("pt-BR", {
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
                            {qtdComprada.toLocaleString("pt-BR")}{" "}
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
                          {isAdt ? (
                            <span>
                              {unDetectada === "litros"
                                ? "Compra faturada diretamente em Litros"
                                : `Densidade do aditivo: ${dens.toFixed(2)} kg/L`}{" "}
                              | Vigência:{" "}
                              <strong className="text-foreground">
                                {xmlParseado.mesAno}
                              </strong>
                            </span>
                          ) : (
                            <span>
                              Densidade cadastrada:{" "}
                              <strong className="text-foreground">
                                {dens.toFixed(2)} t/m³
                              </strong>{" "}
                              | Vigência:{" "}
                              <strong className="text-foreground">
                                {xmlParseado.mesAno}
                              </strong>
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                          Custo Final: R$ {custoCalculado.toFixed(4)} /{" "}
                          {isAdt ? "L" : "kg"}
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
              {aplicandoXml ? "Aplicando..." : "Aplicar ao Cadastro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Criar / Editar Cliente */}
      <Dialog open={openCliente} onOpenChange={setOpenCliente}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              {clienteEditando ? "Editar Cliente" : "Novo Cadastro de Cliente"}
            </DialogTitle>
            <CardDescription className="text-xs">
              Preencha os dados cadastrais. Ao digitar o CNPJ ou CEP, os dados
              serão buscados automaticamente na Receita / Correios.
            </CardDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarClienteSubmit} className="space-y-4 py-2">
            {/* Tipo de Pessoa e Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Pessoa *</Label>
                <Select
                  value={tipoCliente}
                  onValueChange={(val: "PF" | "PJ") => {
                    setTipoCliente(val)
                    setCpfCnpjCliente("")
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PJ">Pessoa Jurídica (CNPJ)</SelectItem>
                    <SelectItem value="PF">Pessoa Física (CPF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="docCliente" className="text-xs">
                    {tipoCliente === "PF"
                      ? "CPF *"
                      : "CNPJ (Busca Automática) *"}
                  </Label>
                  {buscandoCnpj && (
                    <span className="text-[10px] text-primary flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Consultando BrasilAPI...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="docCliente"
                    placeholder={
                      tipoCliente === "PF"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                    value={cpfCnpjCliente}
                    onChange={(e) =>
                      setCpfCnpjCliente(formatarCpfCnpj(e.target.value))
                    }
                    onBlur={handleBlurCpfCnpj}
                    className="h-9 text-xs font-mono"
                    required
                  />
                  {tipoCliente === "PJ" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBlurCpfCnpj}
                      className="absolute right-1 top-1 h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      title="Forçar consulta na BrasilAPI"
                    >
                      Buscar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Razão Social e Nome Fantasia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nomeCli" className="text-xs">
                  {tipoCliente === "PJ" ? "Razão Social *" : "Nome Completo *"}
                </Label>
                <Input
                  id="nomeCli"
                  placeholder={
                    tipoCliente === "PJ"
                      ? "Ex: CABRAL LEITE CONSTRUCOES LTDA"
                      : "Ex: João da Silva"
                  }
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fantasiaCli" className="text-xs">
                  Nome Fantasia / Apelido
                </Label>
                <Input
                  id="fantasiaCli"
                  placeholder="Ex: Cabral Construtora"
                  value={nomeFantasiaCliente}
                  onChange={(e) => setNomeFantasiaCliente(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Contato: Telefone e Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="telCli" className="text-xs">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="telCli"
                  placeholder="(83) 99999-9999"
                  value={telefoneCliente}
                  onChange={(e) =>
                    setTelefoneCliente(formatarTelefone(e.target.value))
                  }
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emailCli" className="text-xs">
                  E-mail
                </Label>
                <Input
                  id="emailCli"
                  type="email"
                  placeholder="contato@cliente.com.br"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-3">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-primary">
                  <MapPin className="w-3.5 h-3.5" />
                  Endereço e Localização da Obra / Sede
                </span>
                {buscandoCep && (
                  <span className="text-[10px] text-primary flex items-center gap-1 animate-pulse font-normal">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Buscando ViaCEP...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cepCli" className="text-xs">
                    CEP
                  </Label>
                  <Input
                    id="cepCli"
                    placeholder="58755-000"
                    value={cepCliente}
                    onChange={(e) => setCepCliente(formatarCep(e.target.value))}
                    onBlur={handleBlurCep}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="logCli" className="text-xs">
                    Logradouro / Rua
                  </Label>
                  <Input
                    id="logCli"
                    placeholder="Ex: POVOADO DEPOIS DE SÃO JOSÉ DE PRINCESA"
                    value={logradouroCliente}
                    onChange={(e) => setLogradouroCliente(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="numCli" className="text-xs">
                    Número
                  </Label>
                  <Input
                    id="numCli"
                    placeholder="S/N ou nº"
                    value={numeroCliente}
                    onChange={(e) => setNumeroCliente(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="complCli" className="text-xs">
                    Complemento
                  </Label>
                  <Input
                    id="complCli"
                    placeholder="Ex: Galpão / Fazenda"
                    value={complementoCliente}
                    onChange={(e) => setComplementoCliente(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bairroCli" className="text-xs">
                    Bairro / Sítio
                  </Label>
                  <Input
                    id="bairroCli"
                    placeholder="Ex: Centro ou Sítio"
                    value={bairroCliente}
                    onChange={(e) => setBairroCliente(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cidCli" className="text-xs">
                    Município
                  </Label>
                  <Input
                    id="cidCli"
                    placeholder="Ex: Princesa Isabel"
                    value={cidadeCliente}
                    onChange={(e) => setCidadeCliente(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ufCli" className="text-xs">
                    UF
                  </Label>
                  <Input
                    id="ufCli"
                    placeholder="PB"
                    maxLength={2}
                    value={ufCliente}
                    onChange={(e) => setUfCliente(e.target.value.toUpperCase())}
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="obsCli" className="text-xs">
                Observações do Cliente
              </Label>
              <Textarea
                id="obsCli"
                rows={2}
                placeholder="Observações sobre entrega, acesso à obra, restrição de horário..."
                value={observacoesCliente}
                onChange={(e) => setObservacoesCliente(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Configuração de Relatório Impresso: Exibir insumos na OS */}
            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="exibirInsumosCli"
                  className="text-xs font-semibold cursor-pointer"
                >
                  Exibir Insumos na OS impressa (Padrão para este cliente)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, as Ordens de Serviço deste cliente detalham os
                  quilos/litros de cada insumo no recibo A4.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="exibirInsumosCli"
                  type="checkbox"
                  checked={exibirInsumosOsCliente}
                  onChange={(e) => setExibirInsumosOsCliente(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-xs font-medium">
                  {exibirInsumosOsCliente ? "Sim" : "Não"}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCliente(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-primary text-primary-foreground"
              >
                {salvando
                  ? "Salvando..."
                  : clienteEditando
                    ? "Salvar Alterações"
                    : "Cadastrar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Importador CSV de Cargas e Controle Diário */}
      <ModalImportarCargasCSV
        open={openImportarCsv}
        onOpenChange={setOpenImportarCsv}
        onImportadoSucesso={() => {
          carregarTudo()
        }}
      />

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog
        open={dialogExclusao.open}
        onOpenChange={(open) =>
          !excluindo && setDialogExclusao((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão: {dialogExclusao.titulo}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm pt-2 leading-relaxed">
              {dialogExclusao.descricao}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmarExclusao()
              }}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? "Excluindo..." : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
