import { useState, useEffect, useRef } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConcreteiraService } from "@/services/concreteira"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import type {
  Traco,
  Material,
  Carga,
  Cliente,
  Veiculo,
  Motorista,
  Cidade,
  RecipienteEstoque,
} from "@/types/concreteira"
import {
  Truck,
  Calculator,
  CheckCircle2,
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  AlertCircle,
  AlertTriangle,
  Flame,
  XCircle,
  Calendar,
  Filter,
  RefreshCw,
  Pencil,
  Printer,
  Sparkles,
  User,
  MapPin,
  Ban,
} from "lucide-react"
import { ReciboImpressao } from "@/components/ReciboImpressao"
import { ModalEditarCarga } from "@/components/ModalEditarCarga"
import type { OrdemServico } from "@/types/concreteira"
import { toast } from "@/hooks/use-toast"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AbaCancelamentoCargas } from "@/components/AbaCancelamentoCargas"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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

export function extrairNomeTracoReferencia(nome?: string | null): string {
  if (!nome) return "—"
  let limpo = nome.replace(/\s*\(Manual\)/gi, "").trim()
  // Limpar sufixos manuais tipo "(Manual)", "(B12:480 / ...)", "(320kg Cim - ...)"
  if (limpo.includes("(") && /B12|B19|kg|Areia|Apenas|Manual/i.test(limpo)) {
    limpo = limpo.split("(")[0].trim()
  }
  // Remove eventuais espaços duplicados ou hífens no fim
  limpo = limpo.replace(/[-–—\s]+$/, "").trim()
  return limpo || "—"
}

/**
 * Retorna a descrição completa formatada do traço conforme o cadastro do traço.
 * Exemplo do formato desejado: "F10B01S12 CP II F 40 (10 MPa)"
 */
export function formatarDescricaoCompletaTraco(traco: {
  nome: string
  fck_mpa?: number | null
}): string {
  if (!traco || !traco.nome) return "—"
  const nome = traco.nome.trim()
  const fck = traco.fck_mpa

  // Se o próprio nome já traz o sufixo "(X MPa)" no final, preserva
  if (/\(\s*\d+\s*MPa\s*\)$/i.test(nome)) {
    return nome
  }

  if (fck !== null && fck !== undefined && Number(fck) > 0) {
    return `${nome} (${fck} MPa)`
  }

  return nome
}

/**
 * Resolve o objeto do traço de referência de uma carga.
 * 1º passo: join pelo ID da carga (traco_id com tracos)
 * 2º passo: para cargas antigas sem vínculo de ID, resolve pelo nome gravado na carga,
 *           limpando sufixos manuais tipo "(Manual)" ou "(B12:480 / ...)".
 */
export function resolverTracoReferenciaCarga(
  carga: {
    traco_id?: string | null
    traco_nome?: string | null
  },
  catalogoTracos: Traco[],
): Traco | undefined {
  if (carga.traco_id) {
    const porId = catalogoTracos.find((t) => t.id === carga.traco_id)
    if (porId) return porId
  }

  if (!carga.traco_nome) return undefined

  const nomeLimpo = extrairNomeTracoReferencia(carga.traco_nome).trim()
  if (!nomeLimpo || nomeLimpo === "—") return undefined

  const nomeLimpoLower = nomeLimpo.toLowerCase()

  // 1. Match exato pelo nome limpo ou nome do traço
  const matchExato = catalogoTracos.find((t) => {
    const tNome = (t.nome || "").trim().toLowerCase()
    const tLimpo = extrairNomeTracoReferencia(t.nome).trim().toLowerCase()
    return tNome === nomeLimpoLower || tLimpo === nomeLimpoLower
  })
  if (matchExato) return matchExato

  // 2. Match por FCK se constar no texto (ex: "Traço FCK 15 MPa", "FCK 25", "F10B01...")
  const matchFck = nomeLimpoLower.match(/(?:fck\s*|f-?|f)(\d{2})\b/i)
  if (matchFck) {
    const fckNum = Number(matchFck[1])
    const matchPorFck = catalogoTracos.find((t) => Number(t.fck_mpa) === fckNum)
    if (matchPorFck) return matchPorFck
  }

  // 3. Match por prefixo ou inclusão do código (ex: "F25B=01S12 CP II F 40")
  const matchPrefixo = catalogoTracos.find((t) => {
    const tNome = (t.nome || "").trim().toLowerCase()
    const tLimpo = extrairNomeTracoReferencia(t.nome).trim().toLowerCase()
    return (
      (tNome.length > 0 &&
        (nomeLimpoLower.startsWith(tNome) ||
          tNome.startsWith(nomeLimpoLower))) ||
      (tLimpo !== "—" &&
        (nomeLimpoLower.startsWith(tLimpo) ||
          tLimpo.startsWith(nomeLimpoLower)))
    )
  })
  if (matchPrefixo) return matchPrefixo

  // 4. Fallback especial para códigos tipo "Traço SJE 290kg" ou "Traço SJE 320kg":
  // Se contiver consumo de cimento (ex: 290kg), casar com traço de consumo aproximado/idêntico
  const matchKg = nomeLimpoLower.match(/(\d{3})\s*kg/)
  if (matchKg) {
    const kg = Number(matchKg[1])
    const matchPorConsumo = catalogoTracos.find(
      (t) => Number(t.consumo_cimento) === kg,
    )
    if (matchPorConsumo) return matchPorConsumo
  }

  return undefined
}

/**
 * Retorna a descrição completa do traço de referência da carga para exibição na tabela.
 * Formato desejado: "F10B01S12 CP II F 40 (10 MPa)"
 */
export function obterDescricaoCompletaCarga(
  carga: {
    traco_id?: string | null
    traco_nome?: string | null
  },
  catalogoTracos: Traco[],
): string {
  const traco = resolverTracoReferenciaCarga(carga, catalogoTracos)
  if (traco) {
    return formatarDescricaoCompletaTraco(traco)
  }

  // Sem vínculo com traço cadastrado
  if (
    !carga.traco_id &&
    (!carga.traco_nome ||
      carga.traco_nome === "Manual" ||
      carga.traco_nome === "Dosagem Manual")
  ) {
    return "Manual"
  }

  // Fallback quando não encontrar vínculo: limpa sufixos manuais do nome gravado
  const limpo = extrairNomeTracoReferencia(carga.traco_nome)
  return limpo || "—"
}

export default function LancamentoCargas() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editarCargaId = searchParams.get("editar")
  const { empresaAtiva } = useEmpresa()
  const { isBalanceiro } = useUsuario()
  const [tracos, setTracos] = useState<Traco[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [salvando, setSalvando] = useState(false)
  // Estado para controle de edição de carga gravada
  const [cargaOriginal, setCargaOriginal] = useState<Carga | null>(null)
  const [carregandoCargaEdicao, setCarregandoCargaEdicao] = useState(false)
  const [modalConfirmarEdicaoAberta, setModalConfirmarEdicaoAberta] =
    useState(false)
  const [modalConfirmarGravacaoAberta, setModalConfirmarGravacaoAberta] =
    useState(false)
  const [modalConfirmarZeradaAberta, setModalConfirmarZeradaAberta] =
    useState(false)

  // Aba ativa: "lancamento" ou "cancelamento"
  const [abaAtiva, setAbaAtiva] = useState<string>("lancamento")

  // Estados da Tabela de Cargas e Filtros
  const [cargasLista, setCargasLista] = useState<Carga[]>([])
  const [carregandoCargasLista, setCarregandoCargasLista] = useState(false)
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("")
  const [filtroDataFim, setFiltroDataFim] = useState<string>("")
  const [filtroTracoId, setFiltroTracoId] = useState<string>("ALL")
  const [filtroDosagem, setFiltroDosagem] = useState<string>("ALL")
  const [osParaReimpressao, setOsParaReimpressao] =
    useState<OrdemServico | null>(null)
  const [modalReimpressaoAberta, setModalReimpressaoAberta] = useState(false)
  const [cargaParaEditarModal, setCargaParaEditarModal] =
    useState<Carga | null>(null)
  const [modalEditarCargaAberta, setModalEditarCargaAberta] = useState(false)

  // Formulário
  const [dataCarga, setDataCarga] = useState(
    new Date().toISOString().split("T")[0],
  )
  const [carregandoTracos, setCarregandoTracos] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(8.0)
  const [volumeTexto, setVolumeTexto] = useState<string>("8")
  const volumeInputRef = useRef<HTMLInputElement>(null)
  const [tracoSelecionadoId, setTracoSelecionadoId] = useState<string>("")

  // Seletores de Cliente, Veículo (Placa), Motorista e Cidade (com suporte a digitação livre opcional)
  const [clienteId, setClienteId] = useState<string>("nenhum")
  const [clienteNomeLivre, setClienteNomeLivre] = useState<string>("")
  const [veiculoId, setVeiculoId] = useState<string>("nenhum")
  const [veiculoPlacaLivre, setVeiculoPlacaLivre] = useState<string>("")
  const [motoristaId, setMotoristaId] = useState<string>("nenhum")
  const [motoristaNomeLivre, setMotoristaNomeLivre] = useState<string>("")
  const [cidadeId, setCidadeId] = useState<string>("nenhum")
  const [cidadeNomeLivre, setCidadeNomeLivre] = useState<string>("")

  // Listas de opções da unidade ativa
  const [clientesLista, setClientesLista] = useState<Cliente[]>([])
  const [veiculosLista, setVeiculosLista] = useState<Veiculo[]>([])
  const [motoristasLista, setMotoristasLista] = useState<Motorista[]>([])
  const [cidadesLista, setCidadesLista] = useState<Cidade[]>([])
  const [carregandoCadastrosAux, setCarregandoCadastrosAux] = useState(false)

  const [observacao, setObservacao] = useState<string>("")
  const [cargaZerada, setCargaZerada] = useState<boolean>(false)

  // Insumos no formulário (no modo manual são DOSAGEM por m³: kg/m³ para sólidos; no automático guardam a dosagem base)
  const [brita12, setBrita12] = useState<number>(0)
  const [brita19, setBrita19] = useState<number>(0)
  const [areia, setAreia] = useState<number>(0)
  const [poPedra, setPoPedra] = useState<number>(0)
  const [cimento, setCimento] = useState<number>(0)
  const [agua, setAgua] = useState<number>(0)
  const [aditivo, setAditivo] = useState<number>(0)
  const [aditivoInput, setAditivoInput] = useState<string>("")
  const [aditivoBruto, setAditivoBruto] = useState<number>(0)
  const [aditivoEditadoManualmente, setAditivoEditadoManualmente] =
    useState<boolean>(false)

  // Controle de Silos e Tanques (exclusivo unidade Patos)
  const [recipientesPatosLista, setRecipientesPatosLista] =
    useState<RecipienteEstoque[]>([])
  const [siloCimento, setSiloCimento] = useState<string>("silo_1")
  const [tanqueAditivo, setTanqueAditivo] = useState<string>("tanque_1")

  // Estados específicos para o Modo Acumulativo de Patos (valores acumulados por 1,00 m³)
  // Cimento = cimento; Brita 0 = brita12; Brita 0+1 = brita0 + brita19; Areia acum = acum_brita01 + areia; Pó acum = acum_areia + poPedra
  const [patosAcumBrita01, setPatosAcumBrita01] = useState<number>(0)
  const [patosAcumAreia, setPatosAcumAreia] = useState<number>(0)
  const [patosAcumPo, setPatosAcumPo] = useState<number>(0)

  // Estado que rastreia tentativa de submissão para destacar campos obrigatórios faltantes
  const [tentouGravar, setTentouGravar] = useState<boolean>(false)

  useEffect(() => {
    async function init() {
      if (!empresaAtiva) return
      setCarregandoTracos(true)
      setCarregandoCadastrosAux(true)
      try {
        const [tr, mats, clis, veics, mots, cids, recs] = await Promise.all([
          ConcreteiraService.getTracos(empresaAtiva.id),
          ConcreteiraService.getMateriais(empresaAtiva.id),
          ConcreteiraService.getClientes(empresaAtiva.id),
          ConcreteiraService.getVeiculos(empresaAtiva.id),
          ConcreteiraService.getMotoristas(empresaAtiva.id),
          ConcreteiraService.getCidades(empresaAtiva.id),
          ConcreteiraService.getRecipientesEstoque(empresaAtiva.id),
        ])

        // Garante ordenação por FCK e nome da unidade ativa
        const catalogoCompleto = [...tr].sort((a, b) => {
          const fckA = a.fck_mpa ?? 0
          const fckB = b.fck_mpa ?? 0
          if (fckA !== fckB) return fckA - fckB
          return (a.nome || "").localeCompare(b.nome || "")
        })

        setTracos(catalogoCompleto)
        setMateriais(mats)
        setClientesLista(clis || [])
        setVeiculosLista(veics || [])
        setMotoristasLista(mots || [])
        setCidadesLista(cids || [])
        setRecipientesPatosLista(recs || [])

        // No novo layout rápido, o formulário inicia limpo/zerado ou sem forçar traço obrigatório
        if (!editarCargaId) {
          setTracoSelecionadoId("")
          setClienteId("nenhum")
          setClienteNomeLivre("")
          setVeiculoId("nenhum")
          setVeiculoPlacaLivre("")
          setMotoristaId("nenhum")
          setMotoristaNomeLivre("")
          setCidadeId("nenhum")
          setCidadeNomeLivre("")
          setCimento(0)
          setBrita12(0)
          setBrita19(0)
          setAreia(0)
          setPoPedra(0)
          setPatosAcumBrita01(0)
          setPatosAcumAreia(0)
          setPatosAcumPo(0)
          setAgua(0)
          setAditivo(0)
          setAditivoInput("")
          setAditivoBruto(0)
          setAditivoEditadoManualmente(false)
        }
      } catch (err) {
        console.error("Erro ao carregar dados do formulário:", err)
      } finally {
        setCarregandoTracos(false)
        setCarregandoCadastrosAux(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id, editarCargaId])

  // Efeito para carregar dados da carga quando em modo de edição
  useEffect(() => {
    async function carregarCargaParaEdicao() {
      if (!editarCargaId) {
        setCargaOriginal(null)
        return
      }

      // Se o usuário logado for balanceiro, não tem permissão para editar carga gravada
      if (isBalanceiro) {
        toast({
          title: "Acesso restrito",
          description:
            "Apenas Administradores têm permissão para editar lançamentos de carga gravados.",
          variant: "destructive",
        })
        navigate("/lancamentos")
        return
      }

      setCarregandoCargaEdicao(true)
      try {
        const c = await ConcreteiraService.getCargaPorId(editarCargaId)
        if (!c) {
          toast({
            title: "Carga não encontrada",
            description: "A carga solicitada para edição não foi localizada.",
            variant: "destructive",
          })
          navigate("/lancamentos")
          return
        }

        setCargaOriginal(c)
        setDataCarga(c.data)
        const vol = Number(c.volume_m3) || 1
        setVolume(vol)
        setVolumeTexto(String(vol).replace(".", ","))
        if (volumeInputRef.current) {
          volumeInputRef.current.value = String(vol).replace(".", ",")
        }
        setCargaZerada(Boolean(c.carga_zerada))
        setObservacao(c.observacao || "")

        // Se tiver traço vinculado ou por nome
        if (c.traco_id) {
          setTracoSelecionadoId(c.traco_id)
        } else if (c.traco_nome) {
          const tEncontrado = resolverTracoReferenciaCarga(c, tracos)
          if (tEncontrado) setTracoSelecionadoId(tEncontrado.id)
        }

        // Recuperar dosagens por m³ a partir do consumo total e volume
        const dosCimento =
          vol > 0
            ? Math.round(Number(c.consumo_cimento || 0) / vol)
            : Number(c.consumo_cimento || 0)
        const dosBrita12 =
          vol > 0
            ? Math.round(Number(c.consumo_brita12 || 0) / vol)
            : Number(c.consumo_brita12 || 0)
        const dosBrita19 =
          vol > 0
            ? Math.round(Number(c.consumo_brita19 || 0) / vol)
            : Number(c.consumo_brita19 || 0)
        const dosAreia =
          vol > 0
            ? Math.round(Number(c.consumo_areia || 0) / vol)
            : Number(c.consumo_areia || 0)
        const dosPoPedra =
          vol > 0
            ? Math.round(Number(c.consumo_po_pedra || 0) / vol)
            : Number(c.consumo_po_pedra || 0)

        setCimento(dosCimento)
        setBrita12(dosBrita12)
        setBrita19(dosBrita19)
        setAreia(dosAreia)
        setPoPedra(dosPoPedra)
        setPatosAcumBrita01(dosBrita12 + dosBrita19)
        setPatosAcumAreia(dosBrita12 + dosBrita19 + dosAreia)
        setPatosAcumPo(dosBrita12 + dosBrita19 + dosAreia + dosPoPedra)
        setAgua(Number(c.consumo_agua || 0))

        // Aditivo total em litros
        const adtValor = Number(c.consumo_aditivo || 0)
        setAditivo(adtValor)
        setAditivoInput(adtValor > 0 ? String(adtValor) : "")
        setAditivoBruto(adtValor)
        setAditivoEditadoManualmente(true)

        // Silo e Tanque salvos na carga
        if (c.silo_cimento) setSiloCimento(c.silo_cimento)
        else setSiloCimento("silo_1")
        if (c.tanque_aditivo) setTanqueAditivo(c.tanque_aditivo)
        else setTanqueAditivo("tanque_1")

        // Cliente / Veículo / Motorista / Cidade
        setClienteNomeLivre(c.cliente_nome || "")
        if (c.cliente_id) {
          setClienteId(c.cliente_id)
        } else if (c.cliente_nome) {
          const matchCli = clientesLista.find(
            (cli) =>
              cli.nome.trim().toLowerCase() ===
              c.cliente_nome?.trim().toLowerCase(),
          )
          setClienteId(matchCli ? matchCli.id : "nenhum")
        } else {
          setClienteId("nenhum")
        }

        setVeiculoPlacaLivre(c.veiculo_placa || "")
        if (c.veiculo_id) {
          setVeiculoId(c.veiculo_id)
        } else if (c.veiculo_placa) {
          const matchV = veiculosLista.find(
            (v) =>
              v.placa.trim().toUpperCase() ===
              c.veiculo_placa?.trim().toUpperCase(),
          )
          setVeiculoId(matchV ? matchV.id : "nenhum")
        } else {
          setVeiculoId("nenhum")
        }

        setMotoristaNomeLivre(c.motorista_nome || "")
        if (c.motorista_id) {
          setMotoristaId(c.motorista_id)
        } else if (c.motorista_nome) {
          const matchM = motoristasLista.find(
            (m) =>
              m.nome.trim().toLowerCase() ===
              c.motorista_nome?.trim().toLowerCase(),
          )
          setMotoristaId(matchM ? matchM.id : "nenhum")
        } else {
          setMotoristaId("nenhum")
        }

        setCidadeNomeLivre(c.cidade_nome || "")
        if (c.cidade_id) {
          setCidadeId(c.cidade_id)
        } else if (c.cidade_nome) {
          const matchC = cidadesLista.find(
            (cid) =>
              cid.nome.trim().toLowerCase() ===
              c.cidade_nome?.trim().toLowerCase(),
          )
          setCidadeId(matchC ? matchC.id : "nenhum")
        } else {
          setCidadeId("nenhum")
        }
      } catch (err: any) {
        console.error("Erro ao carregar carga para edição:", err)
        toast({
          title: "Erro ao carregar carga",
          description: err.message || "Falha ao buscar carga.",
          variant: "destructive",
        })
      } finally {
        setCarregandoCargaEdicao(false)
      }
    }

    carregarCargaParaEdicao()
  }, [
    editarCargaId,
    isBalanceiro,
    navigate,
    tracos,
    clientesLista,
    veiculosLista,
    motoristasLista,
    cidadesLista,
  ])

  // Carregar lista de cargas da empresa ativa
  const carregarCargasLista = async () => {
    if (!empresaAtiva) return
    setCarregandoCargasLista(true)
    try {
      const data = await ConcreteiraService.getCargas({
        empresaId: empresaAtiva.id,
      })
      setCargasLista(data)
    } catch (err) {
      console.error("Erro ao carregar lista de cargas:", err)
    } finally {
      setCarregandoCargasLista(false)
    }
  }

  useEffect(() => {
    carregarCargasLista()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Lista de dosagens únicas calculadas a partir das cargas da unidade (kg/m³)
  const opcoesDosagens = Array.from(
    new Set(
      cargasLista
        .map((c) => {
          const vol = Number(c.volume_m3) || 0
          const cim = Number(c.consumo_cimento) || 0
          if (vol > 0 && cim > 0) {
            return Math.round(cim / vol)
          }
          return null
        })
        .filter((d): d is number => d !== null && d > 0),
    ),
  ).sort((a, b) => a - b)

  // Filtragem das cargas
  const cargasFiltradas = cargasLista.filter((c) => {
    // Filtro de Data Inicial
    if (filtroDataInicio && c.data < filtroDataInicio) return false
    // Filtro de Data Final
    if (filtroDataFim && c.data > filtroDataFim) return false
    // Filtro de Traço (ao escolher um traço de referência, a listagem apresenta SOMENTE as cargas daquele traço)
    if (filtroTracoId && filtroTracoId !== "ALL") {
      const tracoRef = tracos.find((t) => t.id === filtroTracoId)
      // Resolver traço de referência efetivo da carga pelo ID ou nome
      const tracoResolvidoCarga = resolverTracoReferenciaCarga(c, tracos)

      const bateTracoResolvido = tracoResolvidoCarga?.id === filtroTracoId

      const nomeRefRaw = (tracoRef?.nome || "").toLowerCase().trim()
      const nomeRefLimpo = extrairNomeTracoReferencia(tracoRef?.nome)
        .toLowerCase()
        .trim()
      const tracoIdCarga = c.traco_id
      const tracoNomeCargaRaw = (c.traco_nome || "").toLowerCase().trim()
      const tracoNomeCargaLimpo = extrairNomeTracoReferencia(c.traco_nome)
        .toLowerCase()
        .trim()

      const bateId = tracoIdCarga === filtroTracoId
      const bateNomeLimpo =
        nomeRefLimpo !== "—" &&
        tracoNomeCargaLimpo !== "—" &&
        (tracoNomeCargaLimpo === nomeRefLimpo ||
          tracoNomeCargaLimpo.startsWith(nomeRefLimpo) ||
          nomeRefLimpo.startsWith(tracoNomeCargaLimpo))
      const bateNomeRaw =
        nomeRefRaw.length > 0 &&
        (tracoNomeCargaRaw === nomeRefRaw ||
          tracoNomeCargaRaw.startsWith(`${nomeRefRaw} `) ||
          tracoNomeCargaRaw.startsWith(`${nomeRefRaw}(`) ||
          tracoNomeCargaRaw.includes(nomeRefRaw))

      if (!bateTracoResolvido && !bateId && !bateNomeLimpo && !bateNomeRaw)
        return false
    }
    // Filtro de Dosagem (kg/m³)
    if (filtroDosagem && filtroDosagem !== "ALL") {
      const dosAlvo = Number(filtroDosagem)
      const vol = Number(c.volume_m3) || 0
      const cim = Number(c.consumo_cimento) || 0
      const dosCarga = vol > 0 ? Math.round(cim / vol) : 0
      if (dosCarga !== dosAlvo) return false
    }
    return true
  })

  // Impressão da OS no recibo
  const handleImprimirReciboOS = () => {
    const conteudo = document.getElementById(
      "recibo-impressao-modal-lancamentos",
    )
    if (!conteudo) {
      window.print()
      return
    }
    const janela = window.open("", "_blank")
    if (!janela) {
      window.print()
      return
    }
    janela.document.write(`
      <html>
        <head>
          <title>Recibo OS - Concreteira</title>
          <style>
            @page { size: A4; margin: 8mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; color: #000; }
            * { box-sizing: border-box; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          ${conteudo.innerHTML}
        </body>
      </html>
    `)
    janela.document.close()
    janela.focus()
    setTimeout(() => {
      janela.print()
      janela.close()
    }, 250)
  }

  // Unidade Patos ativa?
  const isPatos =
    (empresaAtiva?.nome || "").toLowerCase().includes("patos") ||
    (empresaAtiva?.cidade || "").toLowerCase().includes("patos")

  // Modo Acumulativo de Patos: ativa SEMPRE que a unidade selecionada for PATOS (inclusive com traço Manual / sem dosagem cadastrada)
  const modoAcumulativoPatos = isPatos

  // Consumos REAIS da carga:
  // - Sólidos (cimento, brita12, brita19, areia, pó de pedra) guardam dosagem por m³ e são multiplicados pelo volume efetivo.
  // - Aditivo é o volume total em litros da carga (Math.round).
  // - O que o usuário digitar prevalece exatamente sem alterações.
  const volumeEfetivo = Number(volume) || 0
  const consumoReal = {
    cimento: Math.round(cimento * volumeEfetivo),
    areia: Math.round(areia * volumeEfetivo),
    brita12: Math.round(brita12 * volumeEfetivo),
    brita19: Math.round(brita19 * volumeEfetivo),
    poPedra: Math.round(poPedra * volumeEfetivo),
    aditivo: Math.round(aditivo),
    agua: Math.round(agua),
  }

  // Validação mínima solicitada:
  // - Data
  // - Volume m³ entre 0,5 e 11,0
  // - Insumos (cimento e agregados > 0 a menos que seja carga cancelada/zerada)
  // O traço NÃO é obrigatório (pode salvar manual/sem vínculo)
  // Motorista, placa e cidade não são mais digitados
  const obterErrosValidacao = () => {
    interface ItemErro {
      campo: string
      rotulo: string
      mensagem: string
    }
    const faltantes: ItemErro[] = []

    if (!dataCarga || dataCarga.trim() === "") {
      faltantes.push({
        campo: "data",
        rotulo: "Data da Carga",
        mensagem: "Informe a data da carga",
      })
    }

    // Lê o volume diretamente de volumeTexto ou do estado
    const volRaw =
      volumeTexto !== ""
        ? volumeTexto
        : volumeInputRef.current
          ? volumeInputRef.current.value
          : String(volume)
    const volNum = parseFloat(String(volRaw).replace(",", ".").trim())

    if (isNaN(volNum) || volNum < 0.5 || volNum > 11.0) {
      faltantes.push({
        campo: "volume",
        rotulo: "Volume (m³)",
        mensagem:
          "Volume deve ser entre 0,5 e 11,0 m³ (informado: " +
          (isNaN(volNum) ? "em branco" : volNum) +
          ")",
      })
    }

    if (!cargaZerada) {
      const somaInsumos =
        cimento + brita12 + brita19 + areia + aditivo + poPedra
      if (somaInsumos <= 0) {
        faltantes.push({
          campo: "insumos",
          rotulo: "Insumos da Carga",
          mensagem: "Informe as quantidades/dosagens dos insumos",
        })
      }
    }

    return faltantes
  }

  const errosValidacao = obterErrosValidacao()
  const formularioValido = errosValidacao.length === 0

  const validarFormulario = (): boolean => {
    // Sincroniza o volume do texto para o estado antes de validar e gravar
    const raw =
      volumeTexto.trim() !== ""
        ? volumeTexto
        : volumeInputRef.current
          ? volumeInputRef.current.value
          : ""
    const parsed = parseFloat(raw.replace(",", ".").trim())
    if (!isNaN(parsed) && parsed > 0) {
      setVolume(parsed)
    } else {
      setVolume(0)
    }

    setTentouGravar(true)

    const errosAtuais = obterErrosValidacao()
    if (errosAtuais.length > 0) {
      const listaFaltantes = errosAtuais.map((e) => e.rotulo).join(", ")
      toast({
        title: "Preencha todos os campos para gravar",
        description: `Campos obrigatórios pendentes: ${listaFaltantes}.`,
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const executarSalvarEdicao = async (motivoZerada?: "PERDA" | "CANCELAR") => {
    if (!editarCargaId) return
    const traco = tracos.find((t) => t.id === tracoSelecionadoId)
    // Se houver traço vinculado, grava a referência do traço; se não houver, grava null / "Manual"
    const nomeTracoGravado = traco
      ? formatarDescricaoCompletaTraco(traco)
      : null

    const clienteSel = clientesLista.find((c) => c.id === clienteId)
    const veiculoSel = veiculosLista.find((v) => v.id === veiculoId)
    const motoristaSel = motoristasLista.find((m) => m.id === motoristaId)
    const cidadeSel = cidadesLista.find((c) => c.id === cidadeId)

    const finalClienteId = clienteSel ? clienteSel.id : null
    const finalClienteNome =
      clienteSel?.nome ||
      (clienteNomeLivre.trim() ? clienteNomeLivre.trim() : null)

    const finalVeiculoId = veiculoSel ? veiculoSel.id : null
    const finalVeiculoPlaca =
      veiculoSel?.placa ||
      (veiculoPlacaLivre.trim() ? veiculoPlacaLivre.trim().toUpperCase() : null)

    const finalMotoristaId = motoristaSel ? motoristaSel.id : null
    const finalMotoristaNome =
      motoristaSel?.nome ||
      (motoristaNomeLivre.trim() ? motoristaNomeLivre.trim() : null)

    const finalCidadeId = cidadeSel ? cidadeSel.id : null
    const finalCidadeNome =
      cidadeSel?.nome ||
      (cidadeNomeLivre.trim() ? cidadeNomeLivre.trim() : null)

    setSalvando(true)
    try {
      await ConcreteiraService.atualizarCarga(editarCargaId, {
        data: dataCarga,
        volume_m3: volume,
        traco_id: traco?.id || undefined,
        traco_nome: nomeTracoGravado || "Manual",
        cliente_id: finalClienteId,
        cliente_nome: finalClienteNome,
        motorista_id: finalMotoristaId,
        motorista_nome: finalMotoristaNome,
        veiculo_id: finalVeiculoId,
        veiculo_placa: finalVeiculoPlaca,
        cidade_id: finalCidadeId,
        cidade_nome: finalCidadeNome,
        consumo_brita12: consumoReal.brita12,
        consumo_brita19: consumoReal.brita19,
        consumo_areia: consumoReal.areia,
        consumo_po_pedra: consumoReal.poPedra,
        consumo_cimento: consumoReal.cimento,
        consumo_aditivo: consumoReal.aditivo,
        consumo_agua: consumoReal.agua,
        observacao: observacao || null,
        carga_zerada: cargaZerada,
        motivo_zerada: motivoZerada,
        silo_cimento: isPatos ? siloCimento : undefined,
        tanque_aditivo: isPatos ? tanqueAditivo : undefined,
      })

      setModalConfirmarEdicaoAberta(false)
      setModalConfirmarZeradaAberta(false)

      toast({
        title: "Carga alterada com sucesso!",
        description:
          "Movimentações de estoque recalculadas com os valores digitados.",
      })

      carregarCargasLista()
      navigate(isBalanceiro ? "/lancamentos" : "/")
    } catch (err: any) {
      console.error("Erro ao atualizar carga:", err)
      toast({
        title: "Erro ao atualizar carga",
        description: err.message || "Falha ao salvar alterações no banco.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const executarCriarCarga = async (motivoZerada?: "PERDA" | "CANCELAR") => {
    const traco = tracos.find((t) => t.id === tracoSelecionadoId)
    const nomeTracoGravado = traco
      ? formatarDescricaoCompletaTraco(traco)
      : null

    const clienteSel = clientesLista.find((c) => c.id === clienteId)
    const veiculoSel = veiculosLista.find((v) => v.id === veiculoId)
    const motoristaSel = motoristasLista.find((m) => m.id === motoristaId)
    const cidadeSel = cidadesLista.find((c) => c.id === cidadeId)

    const finalClienteId = clienteSel ? clienteSel.id : null
    const finalClienteNome =
      clienteSel?.nome ||
      (clienteNomeLivre.trim() ? clienteNomeLivre.trim() : undefined)

    const finalVeiculoId = veiculoSel ? veiculoSel.id : null
    const finalVeiculoPlaca =
      veiculoSel?.placa ||
      (veiculoPlacaLivre.trim()
        ? veiculoPlacaLivre.trim().toUpperCase()
        : undefined)

    const finalMotoristaId = motoristaSel ? motoristaSel.id : null
    const finalMotoristaNome =
      motoristaSel?.nome ||
      (motoristaNomeLivre.trim() ? motoristaNomeLivre.trim() : undefined)

    const finalCidadeId = cidadeSel ? cidadeSel.id : null
    const finalCidadeNome =
      cidadeSel?.nome ||
      (cidadeNomeLivre.trim() ? cidadeNomeLivre.trim() : undefined)

    setSalvando(true)
    try {
      await ConcreteiraService.criarCarga({
        empresa_id: empresaAtiva?.id,
        data: dataCarga,
        volume_m3: volume,
        traco_id: traco?.id || undefined,
        traco_nome: nomeTracoGravado || "Manual",
        cliente_id: finalClienteId,
        cliente_nome: finalClienteNome,
        motorista_id: finalMotoristaId,
        motorista_nome: finalMotoristaNome,
        veiculo_id: finalVeiculoId,
        veiculo_placa: finalVeiculoPlaca,
        cidade_id: finalCidadeId,
        cidade_nome: finalCidadeNome,
        consumo_brita12: consumoReal.brita12,
        consumo_brita19: consumoReal.brita19,
        consumo_areia: consumoReal.areia,
        consumo_po_pedra: consumoReal.poPedra,
        consumo_cimento: consumoReal.cimento,
        consumo_aditivo: consumoReal.aditivo,
        consumo_agua: consumoReal.agua,
        observacao: observacao || undefined,
        carga_zerada: cargaZerada,
        motivo_zerada: motivoZerada,
        silo_cimento: isPatos ? siloCimento : undefined,
        tanque_aditivo: isPatos ? tanqueAditivo : undefined,
      })

      setModalConfirmarGravacaoAberta(false)
      setModalConfirmarZeradaAberta(false)

      toast({
        title: "Carga lançada com sucesso!",
        description: cargaZerada
          ? motivoZerada === "PERDA"
            ? "Carga registrada como PERDA OPERACIONAL. Baixa de cimento e aditivo efetuada no estoque."
            : "Carga cancelada registrada SEM nenhuma movimentação de estoque."
          : "Baixa de estoque de cimento e aditivo realizada com sucesso.",
      })

      // Limpar formulário para próximo lançamento e atualizar listagem
      setVolume(8.0)
      setVolumeTexto("8")
      if (volumeInputRef.current) {
        volumeInputRef.current.value = "8"
      }
      setObservacao("")
      setCargaZerada(false)
      setTracoSelecionadoId("")
      setClienteId("nenhum")
      setClienteNomeLivre("")
      setVeiculoId("nenhum")
      setVeiculoPlacaLivre("")
      setMotoristaId("nenhum")
      setMotoristaNomeLivre("")
      setCidadeId("nenhum")
      setCidadeNomeLivre("")
      setCimento(0)
      setBrita12(0)
      setBrita19(0)
      setAreia(0)
      setPoPedra(0)
      setPatosAcumBrita01(0)
      setPatosAcumAreia(0)
      setPatosAcumPo(0)
      setAgua(0)
      setAditivo(0)
      setAditivoInput("")
      setAditivoBruto(0)
      setTentouGravar(false)

      carregarCargasLista()
      if (!isBalanceiro) {
        navigate("/")
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erro ao lançar carga",
        description: err.message || "Falha na comunicação com o banco.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) return

    // Requisito 2 (Trabalho B): Se for carga zerada/cancelada, abrir modal com DUAS opções:
    // "PERDA" (registra observação [PERDA OPERACIONAL] e DEBITA estoque) vs
    // "CANCELAR" (registra como cancelada SEM nenhuma movimentação de estoque)
    if (cargaZerada) {
      setModalConfirmarZeradaAberta(true)
      return
    }

    // Se estiver em modo de edição de carga regular, abre o modal de confirmação com resumo das alterações
    if (editarCargaId) {
      setModalConfirmarEdicaoAberta(true)
      return
    }

    // Gravação nova regular: abre o modal de confirmação com resumo
    setModalConfirmarGravacaoAberta(true)
  }

  const tracoAtual = tracos.find((t) => t.id === tracoSelecionadoId)

  // Lista dos botões de atalho rápido de traço: F10 a F45
  // (Sequência de atalhos rápidos de volume: 3, 4, 5, 6, 7, 8, 9, 10 m³ no template)
  const ATALHOS_TRACO = [
    { label: "F10", fck: 10 },
    { label: "F15", fck: 15 },
    { label: "F20", fck: 20 },
    { label: "F25", fck: 25 },
    { label: "F30", fck: 30 },
    { label: "F35", fck: 35 },
    { label: "F40", fck: 40 },
    { label: "F45", fck: 45 },
  ]

  // Encontra o traço correspondente no catálogo informado para o FCK fornecido
  const encontrarTracoPorFckEmLista = (
    fck: number,
    lista: Traco[],
  ): Traco | undefined => {
    if (!lista || lista.length === 0) return undefined

    // 1. Prioriza pelo campo fck_mpa exato (caso o nome siga o padrão oficial FxxB01S12 CP II F 40)
    const tracoPadraoFck = lista.find(
      (t) =>
        Number(t.fck_mpa) === fck && /^F\d{1,2}B/i.test(t.nome?.trim() || ""),
    )
    if (tracoPadraoFck) return tracoPadraoFck

    // 2. Qualquer traço com o mesmo fck_mpa numérico exato
    const tracoFck = lista.find((t) => Number(t.fck_mpa) === fck)
    if (tracoFck) return tracoFck

    // 3. Match pelo prefixo oficial real: "F25B", "F25 ", "F25-", "F25/"
    const prefixos = [`F${fck}B`, `F${fck} `, `F${fck}-`, `F${fck}/`]
    const tracoPrefixo = lista.find((t) => {
      const nomeUpper = (t.nome || "").trim().toUpperCase()
      return prefixos.some((p) => nomeUpper.startsWith(p.toUpperCase()))
    })
    if (tracoPrefixo) return tracoPrefixo

    // 4. Regex flexível para Fxx seguido de caractere não dígito ou fim de string (ex: F25B01, F25, F25-A)
    const regexFlexivel = new RegExp(`^F0*${fck}(?:[^0-9]|$)`, "i")
    const tracoRegex = lista.find((t) =>
      regexFlexivel.test((t.nome || "").trim()),
    )
    if (tracoRegex) return tracoRegex

    // 5. Inclusão de Fxx isolado ou em parênteses: "(25 MPa)" ou "FCK 25"
    const regexFckTexto = new RegExp(
      `(?:FCK\\s*|\\()0*${fck}(?:\\s*MPa|\\))`,
      "i",
    )
    return lista.find((t) => regexFckTexto.test(t.nome || ""))
  }

  // Encontra o traço correspondente no catálogo da empresa ativa para o FCK informado
  const encontrarTracoPorFck = (fck: number): Traco | undefined => {
    return encontrarTracoPorFckEmLista(fck, tracos)
  }

  // Ao tocar em um botão de traço rápido: pré-preenche os insumos com as dosagens cadastradas
  const selecionarAtalhoTraco = async (fck: number) => {
    let catalogo = tracos

    // Se o catálogo estiver vazio ou carregando, busca sob demanda do serviço
    if (catalogo.length === 0 && empresaAtiva?.id) {
      try {
        setCarregandoTracos(true)
        const tr = await ConcreteiraService.getTracos(empresaAtiva.id)
        const catalogoCompleto = [...tr].sort((a, b) => {
          const fckA = a.fck_mpa ?? 0
          const fckB = b.fck_mpa ?? 0
          if (fckA !== fckB) return fckA - fckB
          return (a.nome || "").localeCompare(b.nome || "")
        })
        setTracos(catalogoCompleto)
        catalogo = catalogoCompleto
      } catch (err) {
        console.error("Erro ao carregar traços sob demanda:", err)
      } finally {
        setCarregandoTracos(false)
      }
    }

    const traco = encontrarTracoPorFckEmLista(fck, catalogo)
    if (traco) {
      setTracoSelecionadoId(traco.id)
      const cCim = Number(traco.consumo_cimento) || 0
      const cB0 = Number(traco.consumo_brita12) || 0
      const cB1 = Number(traco.consumo_brita19) || 0
      const cAr = Number(traco.consumo_areia) || 0
      const cPo = Number(traco.consumo_po_pedra) || 0

      setCimento(cCim)
      setBrita12(cB0)
      setBrita19(cB1)
      setAreia(cAr)
      setPoPedra(cPo)

      // Preenche os acumulados para Patos (brita 0+1, areia acum, pó acum)
      setPatosAcumBrita01(cB0 + cB1)
      setPatosAcumAreia(cB0 + cB1 + cAr)
      setPatosAcumPo(cB0 + cB1 + cAr + cPo)

      // Sincroniza o volume se necessário e preserva volumeTexto
      if (!volume || volume <= 0) {
        setVolume(8.0)
        setVolumeTexto("8")
        if (volumeInputRef.current) volumeInputRef.current.value = "8"
      }
      const volAtual = volume && volume > 0 ? volume : 8.0

      // Aditivo sugerido: calcula total em litros (consumo_aditivo_m3 × volume)
      const adtBase = Number(traco.consumo_aditivo) || 0
      const adtTotal = adtBase > 0 ? Math.round(adtBase * volAtual) : 0
      setAditivo(adtTotal)
      setAditivoInput(adtTotal > 0 ? String(adtTotal) : "")
      setAditivoBruto(adtTotal)
      setAditivoEditadoManualmente(false)

      toast({
        title: `Traço ${formatarDescricaoCompletaTraco(traco)} selecionado`,
        description:
          "Insumos pré-preenchidos. Você pode ajustar qualquer valor livremente.",
      })
    } else {
      toast({
        title: `Traço F${fck} não encontrado`,
        description: `Não há traço cadastrado com FCK ${fck} MPa na unidade ${
          empresaAtiva?.nome || "ativa"
        }.`,
        variant: "destructive",
      })
    }
  }

  // Permite desmarcar o traço para gravar expressamente como Manual / Sem vínculo
  const limparTracoVinculado = () => {
    setTracoSelecionadoId("")
    toast({
      title: "Traço desvinculado",
      description: isPatos
        ? "A carga será gravada sem traço vinculado (Manual). Os insumos acumulativos continuam disponíveis para edição."
        : "A carga será gravada sem traço vinculado (Manual).",
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Topo / Header da Página Adaptado Mobile/Tablet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-9 sm:w-9 shrink-0 rounded-xl"
          >
            <Link to={isBalanceiro ? "/lancamentos" : "/"}>
              <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {editarCargaId ? (
                <>
                  <span className="truncate">
                    Editar Carga #
                    {cargaOriginal
                      ? String(cargaOriginal.numero_carga).padStart(4, "0")
                      : ""}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 bg-amber-500/10 text-amber-500 text-[10px] sm:text-xs font-semibold uppercase"
                  >
                    Modo Edição
                  </Badge>
                </>
              ) : (
                <span className="truncate">Lançamento de Carga</span>
              )}
              {empresaAtiva && (
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold truncate max-w-[140px] sm:max-w-none">
                  {empresaAtiva.nome}
                </span>
              )}
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground truncate">
              {editarCargaId
                ? "Ajuste os dados e confirme a regravação."
                : "Entrada rápida para balanceiro: viagem e insumos."}
            </p>
          </div>
        </div>

        {!isBalanceiro && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-semibold shadow-xs border-primary/50 text-primary hover:bg-primary/10 h-9"
              title="Ir para tela de importação e reimportação de cargas a partir de planilha CSV"
            >
              <Link to="/importar">
                <FileSpreadsheet className="w-4 h-4" />
                Importar Planilha (CSV)
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Principais da Tela: Lançamento vs Cancelamento de Cargas */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/40">
          <TabsTrigger
            value="lancamento"
            className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
          >
            <Truck className="w-4 h-4" />
            <span>Lançamento de Cargas</span>
          </TabsTrigger>
          <TabsTrigger
            value="cancelamento"
            className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
          >
            <Ban className="w-4 h-4 text-destructive" />
            <span>Cancelamento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-4 sm:space-y-5 mt-0">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* NOVO FORMULÁRIO RÁPIDO PARA O BALANCEIRO:
            1. DATA (padrão: hoje)
            2. VOLUME m³ em campo grande/destacado
            3. INSUMOS: CIMENTO, B12, B19, AREIA, ADITIVO (digitação livre) + ATALHOS F10 a F45
            4. GRAVAR em destaque (mantendo modal comparativo Antes x Depois) */}
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                      <Truck className="w-5 h-5 text-primary" />
                      Lançamento Rápido de Carga
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Preencha data, volume e insumos diretamente. O que você
                      digitar prevalece exatamente sem alterações.
                    </CardDescription>
                  </div>

                  {/* Seletores de Silo e Tanque (exclusivo unidade Patos / unidades com recipientes) */}
                  {isPatos && recipientesPatosLista.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2.5 p-2 px-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        Origem Patos:
                      </span>
                      {recipientesPatosLista.filter(
                        (r) =>
                          r.tipo === "silo" || r.material_codigo === "cimento",
                      ).length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Label
                            htmlFor="silo-cimento-sel"
                            className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap"
                          >
                            Silo Cimento:
                          </Label>
                          <Select
                            value={siloCimento}
                            onValueChange={setSiloCimento}
                          >
                            <SelectTrigger
                              id="silo-cimento-sel"
                              className="h-8 min-w-[130px] text-xs font-semibold bg-background"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {recipientesPatosLista
                                .filter(
                                  (r) =>
                                    r.tipo === "silo" ||
                                    r.material_codigo === "cimento",
                                )
                                .map((r) => {
                                  const unidadeFmt =
                                    r.unidade === "litros" || r.unidade === "l"
                                      ? "L"
                                      : r.unidade || "kg"
                                  return (
                                    <SelectItem
                                      key={r.id}
                                      value={r.identificador}
                                    >
                                      {`${r.nome} — ${Number(r.saldo_atual || 0).toLocaleString("pt-BR")} ${unidadeFmt}`}
                                    </SelectItem>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {recipientesPatosLista.filter(
                        (r) =>
                          r.tipo === "tanque" ||
                          r.material_codigo === "aditivo",
                      ).length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Label
                            htmlFor="tanque-aditivo-sel"
                            className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap"
                          >
                            Tanque Aditivo:
                          </Label>
                          <Select
                            value={tanqueAditivo}
                            onValueChange={setTanqueAditivo}
                          >
                            <SelectTrigger
                              id="tanque-aditivo-sel"
                              className="h-8 min-w-[140px] text-xs font-semibold bg-background"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {recipientesPatosLista
                                .filter(
                                  (r) =>
                                    r.tipo === "tanque" ||
                                    r.material_codigo === "aditivo",
                                )
                                .map((r) => {
                                  const unidadeFmt =
                                    r.unidade === "litros" || r.unidade === "l"
                                      ? "L"
                                      : r.unidade || "kg"
                                  return (
                                    <SelectItem
                                      key={r.id}
                                      value={r.identificador}
                                    >
                                      {`${r.nome} — ${Number(r.saldo_atual || 0).toLocaleString("pt-BR")} ${unidadeFmt}`}
                                    </SelectItem>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkbox Carga Zerada / Cancelada */}
                  <div className="flex items-center space-x-2 pt-1 sm:pt-0">
                    <Checkbox
                      id="cargaZerada"
                      checked={cargaZerada}
                      onCheckedChange={(checked) => setCargaZerada(!!checked)}
                    />
                    <Label
                      htmlFor="cargaZerada"
                      className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
                    >
                      <span
                        className={
                          cargaZerada
                            ? "text-amber-500 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        Carga Zerada / Cancelada
                      </span>
                      <span className="text-[11px] text-muted-foreground hidden md:inline">
                        (Sem baixa de estoque)
                      </span>
                    </Label>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* 1. DATA DA CARGA E SELETORES DE VEÍCULO, MOTORISTA E CIDADE */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="data"
                      className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                        tentouGravar && (!dataCarga || dataCarga.trim() === "")
                          ? "text-destructive font-bold"
                          : "text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        1. Data da Carga *
                      </span>
                      {tentouGravar &&
                        (!dataCarga || dataCarga.trim() === "") && (
                          <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                            <AlertCircle className="w-3.5 h-3.5" /> Obrigatório
                          </span>
                        )}
                    </Label>
                    <Input
                      id="data"
                      type="date"
                      value={dataCarga}
                      onChange={(e) => setDataCarga(e.target.value)}
                      required
                      className={`min-h-[48px] h-12 text-sm sm:text-base bg-background font-mono rounded-xl px-3 transition-colors ${
                        tentouGravar && (!dataCarga || dataCarga.trim() === "")
                          ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                          : ""
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Padrão pré-preenchido com a data de hoje.
                    </p>
                  </div>

                  {/* Seletores de Cliente, Veículo, Motorista e Cidade com digitação livre opcional */}
                  <div className="p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-primary" />
                        Destino e Transporte ({empresaAtiva?.nome || "Unidade"})
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Opcionais • Selecione da lista ou digite livremente
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Cliente: seletor + digitação livre */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="seletor-cliente"
                          className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                        >
                          <User className="w-3.5 h-3.5 text-primary" />
                          Cliente
                        </Label>
                        <Select
                          value={clienteId}
                          onValueChange={(val) => {
                            setClienteId(val)
                            if (val !== "nenhum") {
                              const cliSel = clientesLista.find(
                                (c) => c.id === val,
                              )
                              if (cliSel) setClienteNomeLivre(cliSel.nome)
                            }
                          }}
                          disabled={carregandoCadastrosAux}
                        >
                          <SelectTrigger
                            id="seletor-cliente"
                            className="h-10 text-xs rounded-xl bg-background"
                          >
                            <SelectValue placeholder="Selecione o cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="nenhum"
                              className="text-xs text-muted-foreground"
                            >
                              — Sem cliente / Livre —
                            </SelectItem>
                            {clientesLista.map((c) => (
                              <SelectItem
                                key={c.id}
                                value={c.id}
                                className="text-xs"
                              >
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          placeholder="Ou digite o nome do cliente..."
                          value={clienteNomeLivre}
                          onChange={(e) => {
                            setClienteNomeLivre(e.target.value)
                            if (clienteId !== "nenhum") {
                              const cliSel = clientesLista.find(
                                (c) => c.id === clienteId,
                              )
                              if (cliSel && cliSel.nome !== e.target.value) {
                                setClienteId("nenhum")
                              }
                            }
                          }}
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      {/* Veículo / Placa: seletor + digitação livre */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="seletor-veiculo"
                          className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                        >
                          <Truck className="w-3.5 h-3.5 text-primary" />
                          Placa (Veículo)
                        </Label>
                        <Select
                          value={veiculoId}
                          onValueChange={(val) => {
                            setVeiculoId(val)
                            if (val !== "nenhum") {
                              const vSel = veiculosLista.find(
                                (v) => v.id === val,
                              )
                              if (vSel) setVeiculoPlacaLivre(vSel.placa)
                            }
                          }}
                          disabled={carregandoCadastrosAux}
                        >
                          <SelectTrigger
                            id="seletor-veiculo"
                            className="h-10 text-xs rounded-xl bg-background"
                          >
                            <SelectValue placeholder="Selecione a placa..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="nenhum"
                              className="text-xs text-muted-foreground"
                            >
                              — Sem veículo / Livre —
                            </SelectItem>
                            {veiculosLista.map((v) => (
                              <SelectItem
                                key={v.id}
                                value={v.id}
                                className="text-xs"
                              >
                                {v.placa} {v.modelo ? `(${v.modelo})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          placeholder="Ou digite a placa..."
                          value={veiculoPlacaLivre}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase()
                            setVeiculoPlacaLivre(val)
                            if (veiculoId !== "nenhum") {
                              const vSel = veiculosLista.find(
                                (v) => v.id === veiculoId,
                              )
                              if (vSel && vSel.placa !== val) {
                                setVeiculoId("nenhum")
                              }
                            }
                          }}
                          className="h-8 text-xs font-mono uppercase bg-background"
                        />
                      </div>

                      {/* Motorista: seletor + digitação livre */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="seletor-motorista"
                          className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                        >
                          <User className="w-3.5 h-3.5 text-primary" />
                          Motorista
                        </Label>
                        <Select
                          value={motoristaId}
                          onValueChange={(val) => {
                            setMotoristaId(val)
                            if (val !== "nenhum") {
                              const mSel = motoristasLista.find(
                                (m) => m.id === val,
                              )
                              if (mSel) setMotoristaNomeLivre(mSel.nome)
                            }
                          }}
                          disabled={carregandoCadastrosAux}
                        >
                          <SelectTrigger
                            id="seletor-motorista"
                            className="h-10 text-xs rounded-xl bg-background"
                          >
                            <SelectValue placeholder="Selecione o motorista..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="nenhum"
                              className="text-xs text-muted-foreground"
                            >
                              — Sem motorista / Livre —
                            </SelectItem>
                            {motoristasLista.map((m) => (
                              <SelectItem
                                key={m.id}
                                value={m.id}
                                className="text-xs"
                              >
                                {m.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          placeholder="Ou digite o nome..."
                          value={motoristaNomeLivre}
                          onChange={(e) => {
                            setMotoristaNomeLivre(e.target.value)
                            if (motoristaId !== "nenhum") {
                              const mSel = motoristasLista.find(
                                (m) => m.id === motoristaId,
                              )
                              if (mSel && mSel.nome !== e.target.value) {
                                setMotoristaId("nenhum")
                              }
                            }
                          }}
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      {/* Cidade: seletor + digitação livre */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="seletor-cidade"
                          className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          Cidade
                        </Label>
                        <Select
                          value={cidadeId}
                          onValueChange={(val) => {
                            setCidadeId(val)
                            if (val !== "nenhum") {
                              const cSel = cidadesLista.find(
                                (c) => c.id === val,
                              )
                              if (cSel) setCidadeNomeLivre(cSel.nome)
                            }
                          }}
                          disabled={carregandoCadastrosAux}
                        >
                          <SelectTrigger
                            id="seletor-cidade"
                            className="h-10 text-xs rounded-xl bg-background"
                          >
                            <SelectValue placeholder="Selecione a cidade..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="nenhum"
                              className="text-xs text-muted-foreground"
                            >
                              — Sem cidade / Livre —
                            </SelectItem>
                            {cidadesLista.map((c) => (
                              <SelectItem
                                key={c.id}
                                value={c.id}
                                className="text-xs"
                              >
                                {c.nome}
                                {c.uf ? ` - ${c.uf}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          placeholder="Ou digite a cidade..."
                          value={cidadeNomeLivre}
                          onChange={(e) => {
                            setCidadeNomeLivre(e.target.value)
                            if (cidadeId !== "nenhum") {
                              const cSel = cidadesLista.find(
                                (c) => c.id === cidadeId,
                              )
                              if (cSel && cSel.nome !== e.target.value) {
                                setCidadeId("nenhum")
                              }
                            }
                          }}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ATALHOS RÁPIDOS DE TRAÇO: IMEDIATAMENTE ABAIXO DO CAMPO DE DATA */}
                <div className="p-4 rounded-2xl border border-border/70 bg-muted/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Atalhos Rápidos de Traço
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        1 toque pré-preenche as dosagens cadastradas. Opcional:
                        pode digitar direto sem escolher traço.
                      </p>
                    </div>

                    {tracoSelecionadoId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={limparTracoVinculado}
                        className="self-start sm:self-auto text-xs font-semibold h-8 rounded-xl border-dashed"
                      >
                        Limpar Traço (Gravar Manual)
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {ATALHOS_TRACO.map((atalho) => {
                      const tracoExistente = encontrarTracoPorFck(atalho.fck)
                      const isAtivo = tracoSelecionadoId === tracoExistente?.id

                      return (
                        <button
                          key={atalho.label}
                          type="button"
                          onClick={() => void selecionarAtalhoTraco(atalho.fck)}
                          disabled={cargaZerada || carregandoTracos}
                          className={`h-12 px-3 rounded-xl border-2 font-mono font-black text-sm sm:text-base flex items-center justify-between sm:justify-center sm:gap-1.5 transition-all ${
                            isAtivo
                              ? "bg-primary text-primary-foreground border-primary shadow-sm scale-102"
                              : "bg-background text-foreground hover:bg-primary/10 hover:border-primary/50 border-border/80"
                          }`}
                          title={
                            tracoExistente
                              ? formatarDescricaoCompletaTraco(tracoExistente)
                              : `Traço FCK ${atalho.fck} MPa`
                          }
                        >
                          <span>{atalho.label}</span>
                          <span
                            className={`text-[10px] font-sans font-normal ${
                              isAtivo
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {atalho.fck}M
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. VOLUME m³ EM CAMPO GRANDE/DESTACADO */}
                <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-primary/40 bg-primary/5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Label
                      htmlFor="volume"
                      className={`text-sm sm:text-base font-bold flex items-center gap-2 ${
                        tentouGravar &&
                        (!volume ||
                          Number(volume) < 0.5 ||
                          Number(volume) > 11.0)
                          ? "text-destructive font-bold"
                          : "text-foreground"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-primary" />
                      <span>2. Volume da Carga (m³) *</span>
                    </Label>
                    {tentouGravar &&
                      (!volume ||
                        Number(volume) < 0.5 ||
                        Number(volume) > 11.0) && (
                        <span className="text-xs text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Informe volume
                          entre 0,5 e 11,0 m³
                        </span>
                      )}
                  </div>

                  <div className="flex flex-col items-stretch gap-3">
                    <div className="relative w-full">
                      <Input
                        id="volume"
                        ref={volumeInputRef}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={volumeTexto}
                        onChange={(e) => {
                          const raw = e.target.value
                          setVolumeTexto(raw)
                          if (!raw || raw.trim() === "") {
                            setVolume(0)
                            return
                          }
                          const normalizado = raw.replace(",", ".").trim()
                          const parsed = parseFloat(normalizado)
                          setVolume(!isNaN(parsed) && parsed > 0 ? parsed : 0)
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value
                          if (!raw || raw.trim() === "") {
                            setVolume(0)
                            return
                          }
                          const normalizado = raw.replace(",", ".").trim()
                          const parsed = parseFloat(normalizado)
                          if (!isNaN(parsed) && parsed > 0) {
                            setVolume(parsed)
                          } else {
                            setVolume(0)
                          }
                        }}
                        required
                        placeholder="Ex.: 8"
                        style={{
                          color: "#0f172a",
                          backgroundColor: "#ffffff",
                          fontSize: "24px",
                        }}
                        className={`min-h-[52px] h-14 text-2xl font-black font-mono !text-slate-900 !bg-white dark:!text-slate-900 dark:!bg-white text-left pr-14 rounded-xl border-2 transition-colors ${
                          tentouGravar &&
                          (!volume ||
                            Number(volume) < 0.5 ||
                            Number(volume) > 11.0)
                            ? "border-destructive ring-2 ring-destructive/40"
                            : "border-primary/50 focus-visible:ring-primary"
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-black text-muted-foreground pointer-events-none font-mono">
                        m³
                      </span>
                    </div>

                    {/* Opções prontas de volume com 1 toque (0,5 a 11,0 em passos de 0,5) */}
                    <div className="space-y-1.5 w-full">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Opções prontas (0,5 a 11,0 m³):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap w-full">
                        {[
                          0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5,
                          6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.5,
                          11.0,
                        ].map((vRapido) => {
                          const strRapido = Number.isInteger(vRapido)
                            ? String(vRapido)
                            : vRapido.toString().replace(".", ",")
                          const isSelecionado =
                            volume === vRapido ||
                            volumeTexto.trim().replace(",", ".") ===
                              String(vRapido)

                          return (
                            <button
                              key={vRapido}
                              type="button"
                              onClick={() => {
                                setVolume(vRapido)
                                setVolumeTexto(strRapido)
                                if (volumeInputRef.current) {
                                  volumeInputRef.current.value = strRapido
                                }
                              }}
                              className={`h-9 px-2.5 sm:px-3 text-xs font-mono font-bold rounded-lg border-2 transition-all ${
                                isSelecionado
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                                  : "bg-background text-foreground hover:bg-muted border-border/70"
                              }`}
                            >
                              {strRapido} m³
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. INSUMOS DA CARGA (DIGITAÇÃO LIVRE) */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-primary" />
                        3. Insumos da Carga (Digitação Livre)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        O que você digitar prevalece exatamente como digitado. O
                        traço ao lado é apenas sugestão opcional de
                        pré-preenchimento.
                      </p>
                    </div>

                    {tracoAtual && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs py-1 px-2.5 bg-primary/10 text-primary border-primary/30"
                        >
                          Traço sugerido:{" "}
                          {formatarDescricaoCompletaTraco(tracoAtual)}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={limparTracoVinculado}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          title="Gravar sem vínculo com este traço"
                        >
                          Remover vínculo
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Insumos: MODO ACUMULATIVO DE PATOS ou MODO PADRÃO (Monteiro, SJE, Caicó) */}
                  <div className="space-y-3">
                    {modoAcumulativoPatos ? (
                      /* BLOCO DO MODO ACUMULATIVO DE PATOS (para todos os traços F10 a F45) */
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-xs">
                          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-foreground">
                              Modo Acumulativo de Patos Ativo:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              Digite os valores por <strong>1,00 m³</strong> no
                              estilo da tabela impressa de Patos. O sistema
                              desmembra os consumos reais por subtração e
                              multiplica pelo volume da carga (
                              {volumeEfetivo > 0
                                ? String(volumeEfetivo).replace(".", ",")
                                : "0"}{" "}
                              m³).
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {/* 1. Cimento (kg por 1 m³) */}
                          <div className="p-3.5 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-1.5">
                            <Label
                              htmlFor="patos-cimento"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>Cimento (kg) *</span>
                              <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                                Estoque
                              </span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="patos-cimento"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={cimento === 0 ? "" : cimento}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  setCimento(isNaN(val) ? 0 : val)
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-14 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Real:{" "}
                              {consumoReal.cimento.toLocaleString("pt-BR")} kg
                            </p>
                          </div>

                          {/* 2. Brita 0 (kg por 1 m³) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="patos-brita0"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>Brita 0 (kg)</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="patos-brita0"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={brita12 === 0 ? "" : brita12}
                                onChange={(e) => {
                                  const b0Val =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  const nB0 = isNaN(b0Val) ? 0 : b0Val
                                  setBrita12(nB0)
                                  // Recalcula brita19 real = patosAcumBrita01 - nB0
                                  setBrita19(
                                    Math.max(0, patosAcumBrita01 - nB0),
                                  )
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-14 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Real:{" "}
                              {consumoReal.brita12.toLocaleString("pt-BR")} kg
                            </p>
                          </div>

                          {/* 3. Brita 0+1 (kg acumulado) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="patos-brita01"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>Brita 0+1 (kg acum.)</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="patos-brita01"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={
                                  patosAcumBrita01 === 0 ? "" : patosAcumBrita01
                                }
                                onChange={(e) => {
                                  const v =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  const nAcum01 = isNaN(v) ? 0 : v
                                  setPatosAcumBrita01(nAcum01)
                                  // brita19 = acum_brita01 - brita0
                                  setBrita19(Math.max(0, nAcum01 - brita12))
                                  // areia = acum_areia - acum_brita01
                                  setAreia(
                                    Math.max(0, patosAcumAreia - nAcum01),
                                  )
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-14 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Brita 1 real:{" "}
                              {consumoReal.brita19.toLocaleString("pt-BR")} kg
                            </p>
                          </div>

                          {/* 4. Areia (kg acumulado) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="patos-areia"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>Areia (kg acum.)</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="patos-areia"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={
                                  patosAcumAreia === 0 ? "" : patosAcumAreia
                                }
                                onChange={(e) => {
                                  const v =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  const nAcumAr = isNaN(v) ? 0 : v
                                  setPatosAcumAreia(nAcumAr)
                                  // areia = acum_areia - acum_brita01
                                  setAreia(
                                    Math.max(0, nAcumAr - patosAcumBrita01),
                                  )
                                  // po = acum_po - acum_areia
                                  setPoPedra(Math.max(0, patosAcumPo - nAcumAr))
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-14 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Areia real:{" "}
                              {consumoReal.areia.toLocaleString("pt-BR")} kg
                            </p>
                          </div>

                          {/* 5. Pó de Brita (kg acumulado) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="patos-po"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>Pó de Brita (kg acum.)</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="patos-po"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={patosAcumPo === 0 ? "" : patosAcumPo}
                                onChange={(e) => {
                                  const v =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  const nAcumPo = isNaN(v) ? 0 : v
                                  setPatosAcumPo(nAcumPo)
                                  // po = acum_po - acum_areia
                                  setPoPedra(
                                    Math.max(0, nAcumPo - patosAcumAreia),
                                  )
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-14 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Pó real:{" "}
                              {consumoReal.poPedra.toLocaleString("pt-BR")} kg
                            </p>
                          </div>
                        </div>

                        {/* Bloco de Aditivo, Água e Observação para Patos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Aditivo (calculado da dosagem do traço ou digitação livre) */}
                          <div className="p-3.5 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-1.5">
                            <Label
                              htmlFor="aditivo-patos"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5">
                                ADITIVO (Litros totais da carga) *
                                <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                                  Estoque
                                </span>
                              </span>
                              {tracoAtual?.consumo_aditivo && (
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  Cadastro: {tracoAtual.consumo_aditivo} L/m³
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                id="aditivo-patos"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={aditivoInput}
                                onChange={(e) => {
                                  const valBruto = e.target.value
                                  const valLimpo = valBruto.replace(
                                    /[^0-9]/g,
                                    "",
                                  )
                                  setAditivoInput(valLimpo)
                                  const parsed = parseInt(valLimpo, 10)
                                  setAditivo(
                                    !isNaN(parsed) && parsed >= 0 ? parsed : 0,
                                  )
                                  setAditivoEditadoManualmente(true)
                                }}
                                onBlur={() => {
                                  if (
                                    !aditivoInput ||
                                    aditivoInput.trim() === ""
                                  ) {
                                    setAditivo(0)
                                    setAditivoInput("")
                                    return
                                  }
                                  const parsed = parseInt(aditivoInput, 10)
                                  if (!isNaN(parsed) && parsed > 0) {
                                    setAditivo(parsed)
                                    setAditivoInput(String(parsed))
                                  } else {
                                    setAditivo(0)
                                    setAditivoInput("")
                                  }
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background text-primary pr-14 rounded-xl"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                                Litros
                              </span>
                            </div>
                          </div>

                          {/* Água (vindo do cadastro do traço ou digitação manual em litros totais) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                              <span>ÁGUA (Litros totais da carga)</span>
                              {tracoAtual?.consumo_agua ? (
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  Cadastro: {tracoAtual.consumo_agua} L/m³
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  Manual
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              {tracoAtual?.consumo_agua ? (
                                <>
                                  <Input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={`${Math.round(Number(tracoAtual?.consumo_agua || 0) * volumeEfetivo)} L`}
                                    className="min-h-[48px] h-12 text-lg font-mono font-bold bg-muted/40 pr-14 rounded-xl text-foreground"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                                    Fixo traço
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    step="1"
                                    value={agua === 0 ? "" : agua}
                                    onChange={(e) => {
                                      const val =
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value)
                                      setAgua(isNaN(val) ? 0 : val)
                                    }}
                                    disabled={cargaZerada}
                                    placeholder="0"
                                    className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-14 rounded-xl text-foreground"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                                    Litros
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {tracoAtual?.consumo_agua
                                ? `Calculado automaticamente: ${Number(tracoAtual.consumo_agua)} L/m³ × ${
                                    volumeEfetivo > 0
                                      ? String(volumeEfetivo).replace(".", ",")
                                      : "0"
                                  } m³.`
                                : "Total de água adicionada na carga (litros)."}
                            </p>
                          </div>
                        </div>

                        {/* Observação opcional */}
                        <div>
                          <Label
                            htmlFor="observacao"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            Observação (opcional)
                          </Label>
                          <Input
                            id="observacao"
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Ex.: Adicionado na obra, descarga rápida, etc."
                            className="min-h-[40px] h-10 text-xs sm:text-sm bg-background rounded-xl mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      /* BLOCO PADRÃO (Monteiro, SJE, Caicó ou Patos sem traço selecionado) */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* CIMENTO */}
                          <div className="p-3.5 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-1.5">
                            <Label
                              htmlFor="cimento"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5">
                                CIMENTO (kg/m³) *
                                <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                                  Estoque
                                </span>
                              </span>
                              {volume > 0 && (
                                <span className="text-[11px] font-mono font-bold text-primary">
                                  Total:{" "}
                                  {consumoReal.cimento.toLocaleString("pt-BR")}{" "}
                                  kg
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                id="cimento"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={cimento === 0 ? "" : cimento}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  setCimento(isNaN(val) ? 0 : val)
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-16 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                          </div>

                          {/* B12 (brita 12 / brita 0) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="brita12"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>B12 - Brita 12 (kg/m³)</span>
                              {volume > 0 && (
                                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                                  Total:{" "}
                                  {consumoReal.brita12.toLocaleString("pt-BR")}{" "}
                                  kg
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                id="brita12"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={brita12 === 0 ? "" : brita12}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  setBrita12(isNaN(val) ? 0 : val)
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-16 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                          </div>

                          {/* B19 (brita 19 / brita 1) */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="brita19"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>B19 - Brita 19 (kg/m³)</span>
                              {volume > 0 && (
                                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                                  Total:{" "}
                                  {consumoReal.brita19.toLocaleString("pt-BR")}{" "}
                                  kg
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                id="brita19"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={brita19 === 0 ? "" : brita19}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  setBrita19(isNaN(val) ? 0 : val)
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-16 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                          </div>

                          {/* AREIA */}
                          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
                            <Label
                              htmlFor="areia"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span>AREIA (kg/m³)</span>
                              {volume > 0 && (
                                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                                  Total:{" "}
                                  {consumoReal.areia.toLocaleString("pt-BR")} kg
                                </span>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                id="areia"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                value={areia === 0 ? "" : areia}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value)
                                  setAreia(isNaN(val) ? 0 : val)
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background pr-16 rounded-xl"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                kg/m³
                              </span>
                            </div>
                          </div>

                          {/* ADITIVO (LITROS TOTAIS DA CARGA) */}
                          <div className="p-3.5 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-1.5 sm:col-span-2">
                            <Label
                              htmlFor="aditivo"
                              className="text-xs font-bold text-foreground flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5">
                                ADITIVO (Litros totais da carga) *
                                <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                                  Estoque
                                </span>
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Digite o volume total em litros
                              </span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="aditivo"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={aditivoInput}
                                onChange={(e) => {
                                  const valBruto = e.target.value
                                  const valLimpo = valBruto.replace(
                                    /[^0-9]/g,
                                    "",
                                  )
                                  setAditivoInput(valLimpo)
                                  const parsed = parseInt(valLimpo, 10)
                                  setAditivo(
                                    !isNaN(parsed) && parsed >= 0 ? parsed : 0,
                                  )
                                  setAditivoEditadoManualmente(true)
                                }}
                                onBlur={() => {
                                  if (
                                    !aditivoInput ||
                                    aditivoInput.trim() === ""
                                  ) {
                                    setAditivo(0)
                                    setAditivoInput("")
                                    return
                                  }
                                  const parsed = parseInt(aditivoInput, 10)
                                  if (!isNaN(parsed) && parsed > 0) {
                                    setAditivo(parsed)
                                    setAditivoInput(String(parsed))
                                  } else {
                                    setAditivo(0)
                                    setAditivoInput("")
                                  }
                                }}
                                disabled={cargaZerada}
                                placeholder="0"
                                className="min-h-[48px] h-12 text-lg font-mono font-bold bg-background text-primary pr-14 rounded-xl"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">
                                Litros
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Observação opcional */}
                        <div className="pt-2">
                          <Label
                            htmlFor="observacao"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            Observação (opcional)
                          </Label>
                          <Input
                            id="observacao"
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Ex.: Adicionado na obra, descarga rápida, etc."
                            className="min-h-[40px] h-10 text-xs sm:text-sm bg-background rounded-xl mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RESUMO RÁPIDO DO CONSUMO TOTAL QUE SERÁ BAIXADO / UTILIZADO */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">
                      Consumo Total (
                      {volumeEfetivo > 0
                        ? String(volumeEfetivo).replace(".", ",")
                        : "0"}{" "}
                      m³):
                    </span>
                    <span className="font-mono text-primary font-bold">
                      Cimento: {consumoReal.cimento.toLocaleString("pt-BR")} kg
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-foreground font-semibold">
                      Brita 0: {consumoReal.brita12.toLocaleString("pt-BR")} kg
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-foreground font-semibold">
                      Brita 1: {consumoReal.brita19.toLocaleString("pt-BR")} kg
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-foreground font-semibold">
                      Areia: {consumoReal.areia.toLocaleString("pt-BR")} kg
                    </span>
                    {(consumoReal.poPedra > 0 || isPatos) && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-mono text-primary font-semibold">
                          Pó de Brita:{" "}
                          {consumoReal.poPedra.toLocaleString("pt-BR")} kg
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-primary font-bold">
                      Aditivo: {consumoReal.aditivo.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Traço:{" "}
                    {tracoAtual
                      ? formatarDescricaoCompletaTraco(tracoAtual)
                      : "Manual (Sem vínculo)"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Aviso de campos pendentes caso haja erro de validação ao tentar gravar */}
            {!formularioValido && tentouGravar && (
              <div className="p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-destructive/10 border-destructive/30 text-destructive">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="font-bold block sm:inline">
                      Preencha os campos obrigatórios para gravar:
                    </span>{" "}
                    <span className="font-medium">
                      {errosValidacao.map((e) => e.rotulo).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Barra de Ações com Botões Grandes de Toque (Fixo na base no celular para acesso imediato com o polegar) */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                asChild
                variant="outline"
                type="button"
                className="w-full sm:w-auto min-h-[44px] h-11 sm:h-10 text-sm font-semibold rounded-xl"
              >
                <Link to={isBalanceiro ? "/lancamentos" : "/"}>Cancelar</Link>
              </Button>

              {/* Botão de Gravação / Alteração em destaque */}
              {editarCargaId ? (
                <Button
                  type="submit"
                  variant="default"
                  disabled={salvando || carregandoCargaEdicao}
                  className="w-full sm:w-auto min-h-[52px] sm:min-h-[44px] h-13 sm:h-11 gap-2 font-bold text-base shadow-md px-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all"
                >
                  {salvando ? (
                    "Salvando alteração..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Salvar Alteração da Carga
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="default"
                  disabled={salvando}
                  className="w-full sm:w-auto min-h-[52px] sm:min-h-[44px] h-13 sm:h-11 gap-2 font-bold text-base shadow-md px-8 rounded-xl bg-primary text-primary-foreground hover:brightness-105 transition-all"
                >
                  {salvando ? (
                    "Gravando Carga..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Gravar Carga
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Modal de Confirmação com Resumo Antes de Gravar Novo Lançamento (Scrollável e Responsivo para Celular/Tablet) */}
          <AlertDialog
            open={modalConfirmarGravacaoAberta}
            onOpenChange={setModalConfirmarGravacaoAberta}
          >
            <AlertDialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span>Confirmar Gravação da Carga</span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  Confira os dados e os consumos calculados antes de confirmar o
                  lançamento e a baixa automática no estoque.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="rounded-xl border border-border/50 overflow-hidden bg-background divide-y divide-border/20">
                  <div className="p-3 bg-muted/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Data da Carga:
                      </span>
                      <span className="font-semibold font-mono text-sm">
                        {dataCarga.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Volume:
                      </span>
                      <span className="font-bold font-mono text-primary text-base">
                        {Number(volume).toFixed(1)} m³
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Traço:
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {tracoAtual
                          ? formatarDescricaoCompletaTraco(tracoAtual)
                          : "Manual (Sem vínculo)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Status:
                      </span>
                      <span className="font-semibold">
                        {cargaZerada ? (
                          <span className="text-amber-600 font-bold">
                            Zerada / Cancelada
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">
                            Carga Normal
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="col-span-1 sm:col-span-2 pt-1 border-t border-border/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Cliente:
                        </span>
                        <span className="font-semibold text-foreground">
                          {clientesLista.find((c) => c.id === clienteId)
                            ?.nome ||
                            clienteNomeLivre.trim() ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Placa (Veículo):
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {veiculosLista.find((v) => v.id === veiculoId)
                            ?.placa ||
                            veiculoPlacaLivre.trim().toUpperCase() ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Motorista:
                        </span>
                        <span className="font-semibold text-foreground">
                          {motoristasLista.find((m) => m.id === motoristaId)
                            ?.nome ||
                            motoristaNomeLivre.trim() ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Cidade:
                        </span>
                        <span className="font-semibold text-foreground">
                          {cidadesLista.find((c) => c.id === cidadeId)?.nome ||
                            cidadeNomeLivre.trim() ||
                            "—"}
                        </span>
                      </div>
                    </div>
                    {observacao && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-muted-foreground block text-[11px]">
                          Observação:
                        </span>
                        <span className="font-semibold">{observacao}</span>
                      </div>
                    )}
                  </div>

                  {/* Totais de Insumos */}
                  <div className="p-3 space-y-1.5">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      Insumos da Carga:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                      <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                        <span className="text-muted-foreground">
                          Cimento (CP):
                        </span>
                        <span className="font-bold text-primary">
                          {consumoReal.cimento.toLocaleString("pt-BR")} kg (
                          {cimento} kg/m³)
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                        <span className="text-muted-foreground">
                          B12 (Brita 12):
                        </span>
                        <span className="font-semibold">
                          {consumoReal.brita12.toLocaleString("pt-BR")} kg (
                          {brita12} kg/m³)
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                        <span className="text-muted-foreground">
                          B19 (Brita 19):
                        </span>
                        <span className="font-semibold">
                          {consumoReal.brita19.toLocaleString("pt-BR")} kg (
                          {brita19} kg/m³)
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                        <span className="text-muted-foreground">Areia:</span>
                        <span className="font-semibold">
                          {consumoReal.areia.toLocaleString("pt-BR")} kg (
                          {areia} kg/m³)
                        </span>
                      </div>
                      {(consumoReal.poPedra > 0 || isPatos) && (
                        <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                          <span className="text-muted-foreground">
                            Pó de Brita:
                          </span>
                          <span className="font-semibold text-primary">
                            {consumoReal.poPedra.toLocaleString("pt-BR")} kg (
                            {poPedra} kg/m³)
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex justify-between py-0.5 border-b border-border/20 sm:border-0 ${
                          consumoReal.poPedra > 0 || isPatos
                            ? ""
                            : "col-span-1 sm:col-span-2"
                        }`}
                      >
                        <span className="text-muted-foreground">Aditivo:</span>
                        <span className="font-bold text-primary">
                          {consumoReal.aditivo.toLocaleString("pt-BR")} Litros
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!cargaZerada && (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300">
                    ℹ️ Esta gravação registrará a carga e abaterá do estoque as
                    quantidades digitadas de <strong>Cimento</strong> (
                    {consumoReal.cimento} kg) e <strong>Aditivo</strong> (
                    {consumoReal.aditivo} L). O catálogo de traços permanece
                    intocado.
                  </div>
                )}
              </div>

              <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <AlertDialogCancel
                  disabled={salvando}
                  className="w-full sm:w-auto min-h-[44px] h-11 text-xs rounded-xl"
                >
                  Voltar e Revisar
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={salvando}
                  onClick={() => executarCriarCarga()}
                  className="w-full sm:w-auto min-h-[44px] h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl"
                >
                  {salvando ? "Gravando Carga..." : "Sim, Gravar Lançamento"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Modal de Confirmação com Resumo do que Muda na Edição (Scrollável e Responsivo) */}
          <Dialog
            open={modalConfirmarEdicaoAberta}
            onOpenChange={setModalConfirmarEdicaoAberta}
          >
            <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base text-amber-500 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    Confirmar alteração do lançamento #
                    {cargaOriginal
                      ? String(cargaOriginal.numero_carga).padStart(4, "0")
                      : ""}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Confira abaixo o resumo das alterações antes de gravar. O
                  estoque de cimento e aditivo será estornado e recalculado com
                  os novos consumos.
                </DialogDescription>
              </DialogHeader>

              {cargaOriginal && (
                <div className="space-y-3 py-2 text-xs">
                  <div className="rounded-lg border border-border/50 overflow-hidden bg-background">
                    <table className="w-full text-left">
                      <thead className="bg-muted/40 border-b border-border/40 text-[11px] uppercase text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3">Campo</th>
                          <th className="py-2 px-3 text-muted-foreground">
                            Antes (Original)
                          </th>
                          <th className="py-2 px-3 text-amber-600 dark:text-amber-400 font-bold">
                            Depois (Novo)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        <tr
                          className={
                            cargaOriginal.data !== dataCarga
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            Data
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {cargaOriginal.data.split("-").reverse().join("/")}
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-foreground">
                            {dataCarga.split("-").reverse().join("/")}
                          </td>
                        </tr>
                        <tr
                          className={
                            Number(cargaOriginal.volume_m3) !== Number(volume)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            Volume
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {Number(cargaOriginal.volume_m3).toFixed(1)} m³
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-foreground">
                            {Number(volume).toFixed(1)} m³
                          </td>
                        </tr>
                        <tr
                          className={
                            Boolean(cargaOriginal.carga_zerada) !==
                            Boolean(cargaZerada)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            Status Carga
                          </td>
                          <td className="py-1.5 px-3">
                            {cargaOriginal.carga_zerada
                              ? "Zerada / Cancelada"
                              : "Entregue / Válida"}
                          </td>
                          <td className="py-1.5 px-3 font-bold">
                            {cargaZerada
                              ? "Zerada / Cancelada"
                              : "Entregue / Válida"}
                          </td>
                        </tr>
                        <tr
                          className={
                            Number(cargaOriginal.consumo_cimento) !==
                            Number(consumoReal.cimento)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            Cimento (kg)
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {Number(
                              cargaOriginal.consumo_cimento,
                            ).toLocaleString("pt-BR")}{" "}
                            kg
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-primary">
                            {Number(consumoReal.cimento).toLocaleString(
                              "pt-BR",
                            )}{" "}
                            kg
                          </td>
                        </tr>
                        <tr
                          className={
                            Number(cargaOriginal.consumo_brita12) !==
                            Number(consumoReal.brita12)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            B12 - Brita 12 (kg)
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {Number(
                              cargaOriginal.consumo_brita12 || 0,
                            ).toLocaleString("pt-BR")}{" "}
                            kg
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            {Number(consumoReal.brita12).toLocaleString(
                              "pt-BR",
                            )}{" "}
                            kg
                          </td>
                        </tr>
                        <tr
                          className={
                            Number(cargaOriginal.consumo_brita19) !==
                            Number(consumoReal.brita19)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            B19 - Brita 19 (kg)
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {Number(
                              cargaOriginal.consumo_brita19 || 0,
                            ).toLocaleString("pt-BR")}{" "}
                            kg
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            {Number(consumoReal.brita19).toLocaleString(
                              "pt-BR",
                            )}{" "}
                            kg
                          </td>
                        </tr>
                        <tr
                          className={
                            Number(cargaOriginal.consumo_areia) !==
                            Number(consumoReal.areia)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            Areia (kg)
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {Number(cargaOriginal.consumo_areia).toLocaleString(
                              "pt-BR",
                            )}{" "}
                            kg
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            {Number(consumoReal.areia).toLocaleString("pt-BR")}{" "}
                            kg
                          </td>
                        </tr>
                        {(consumoReal.poPedra > 0 ||
                          Number(cargaOriginal.consumo_po_pedra || 0) > 0 ||
                          isPatos) && (
                          <tr
                            className={
                              Number(cargaOriginal.consumo_po_pedra || 0) !==
                              Number(consumoReal.poPedra)
                                ? "bg-amber-500/10"
                                : ""
                            }
                          >
                            <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                              Pó de Brita (kg)
                            </td>
                            <td className="py-1.5 px-3 font-mono">
                              {Number(
                                cargaOriginal.consumo_po_pedra || 0,
                              ).toLocaleString("pt-BR")}{" "}
                              kg
                            </td>
                            <td className="py-1.5 px-3 font-mono font-bold text-primary">
                              {Number(consumoReal.poPedra).toLocaleString(
                                "pt-BR",
                              )}{" "}
                              kg
                            </td>
                          </tr>
                        )}
                        <tr
                          className={
                            Number(cargaOriginal.consumo_aditivo) !==
                            Number(consumoReal.aditivo)
                              ? "bg-amber-500/10"
                              : ""
                          }
                        >
                          <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                            Aditivo (L)
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {Number(
                              cargaOriginal.consumo_aditivo,
                            ).toLocaleString("pt-BR")}{" "}
                            L
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-primary">
                            {Number(consumoReal.aditivo).toLocaleString(
                              "pt-BR",
                            )}{" "}
                            L
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Se for unidade Patos: reconfirmar ou escolher Silo e Tanque na edição */}
                  {isPatos && recipientesPatosLista.length > 0 && (
                    <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-primary" />
                        Destino da Baixa de Estoque em Patos (Silo / Tanque):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {recipientesPatosLista.filter(
                          (r) =>
                            r.tipo === "silo" ||
                            r.material_codigo === "cimento",
                        ).length > 0 && (
                          <div>
                            <Label className="text-[11px] text-muted-foreground font-semibold">
                              Silo de Cimento:
                            </Label>
                            <Select
                              value={siloCimento}
                              onValueChange={setSiloCimento}
                            >
                              <SelectTrigger className="h-8 text-xs bg-background mt-1 font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {recipientesPatosLista
                                  .filter(
                                    (r) =>
                                      r.tipo === "silo" ||
                                      r.material_codigo === "cimento",
                                  )
                                  .map((r) => {
                                    const unidadeFmt =
                                      r.unidade === "litros" ||
                                      r.unidade === "l"
                                        ? "L"
                                        : r.unidade || "kg"
                                    return (
                                      <SelectItem
                                        key={r.id}
                                        value={r.identificador}
                                      >
                                        {`${r.nome} — ${Number(r.saldo_atual || 0).toLocaleString("pt-BR")} ${unidadeFmt}`}
                                      </SelectItem>
                                    )
                                  })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {recipientesPatosLista.filter(
                          (r) =>
                            r.tipo === "tanque" ||
                            r.material_codigo === "aditivo",
                        ).length > 0 && (
                          <div>
                            <Label className="text-[11px] text-muted-foreground font-semibold">
                              Tanque de Aditivo:
                            </Label>
                            <Select
                              value={tanqueAditivo}
                              onValueChange={setTanqueAditivo}
                            >
                              <SelectTrigger className="h-8 text-xs bg-background mt-1 font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {recipientesPatosLista
                                  .filter(
                                    (r) =>
                                      r.tipo === "tanque" ||
                                      r.material_codigo === "aditivo",
                                  )
                                  .map((r) => {
                                    const unidadeFmt =
                                      r.unidade === "litros" ||
                                      r.unidade === "l"
                                        ? "L"
                                        : r.unidade || "kg"
                                    return (
                                      <SelectItem
                                        key={r.id}
                                        value={r.identificador}
                                      >
                                        {`${r.nome} — ${Number(r.saldo_atual || 0).toLocaleString("pt-BR")} ${unidadeFmt}`}
                                      </SelectItem>
                                    )
                                  })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                    ⚠️ <strong>Atenção:</strong> Ao confirmar, o sistema
                    cancelará/estornará as baixas de estoque de cimento (
                    {cargaOriginal.consumo_cimento} kg) e aditivo (
                    {cargaOriginal.consumo_aditivo} L) gravadas anteriormente
                    para esta carga e lançará as novas movimentações (
                    {consumoReal.cimento} kg de cimento{" "}
                    {isPatos
                      ? `no ${recipientesPatosLista.find((r) => r.identificador === siloCimento)?.nome || (siloCimento === "silo_2" ? "Silo 2" : "Silo 1")}`
                      : ""}{" "}
                    e {consumoReal.aditivo} L de aditivo{" "}
                    {isPatos
                      ? `no ${recipientesPatosLista.find((r) => r.identificador === tanqueAditivo)?.nome || (tanqueAditivo === "tanque_2" ? "Tanque 2" : "Tanque 1")}`
                      : ""}
                    ).
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={salvando}
                  onClick={() => setModalConfirmarEdicaoAberta(false)}
                  className="w-full sm:w-auto min-h-[44px] h-11 text-xs rounded-xl"
                >
                  Voltar e Revisar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={salvando}
                  onClick={() => executarSalvarEdicao()}
                  className="w-full sm:w-auto min-h-[44px] h-11 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl"
                >
                  {salvando
                    ? "Salvando Alteração..."
                    : "Sim, Confirmar e Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* SEÇÃO DA TABELA DE CARGAS COM FILTROS (DATA, TRAÇO, DOSAGEM) */}
          <div className="pt-6 border-t border-border/60 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Tabela de Cargas Lançadas
                </h2>
                <p className="text-xs text-muted-foreground">
                  Consulte os lançamentos da unidade ativa por período, traço de
                  referência e dosagem.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2.5 py-1">
                  Total: {cargasFiltradas.length} de {cargasLista.length} cargas
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={carregarCargasLista}
                  disabled={carregandoCargasLista}
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  title="Recarregar cargas"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      carregandoCargasLista ? "animate-spin" : ""
                    }`}
                  />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Bloco de Filtros: Data De/Até, Traço e Dosagem */}
            <Card className="border border-border/60 shadow-xs bg-card/60 backdrop-blur-xs">
              <CardHeader className="p-3 sm:p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  Filtros de Pesquisa
                </CardTitle>

                {/* Botões Rápidos de Período (Mês Atual, Mês Anterior, Anual) */}
                {(() => {
                  const hoje = new Date()
                  const anoAtual = hoje.getFullYear()
                  const mesAtual = hoje.getMonth() + 1
                  const ultimoDiaAtual = new Date(
                    anoAtual,
                    mesAtual,
                    0,
                  ).getDate()
                  const iniMesAtual = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-01`
                  const fimMesAtual = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-${String(ultimoDiaAtual).padStart(2, "0")}`

                  const dAnt = new Date(anoAtual, mesAtual - 2, 1)
                  const aAnt = dAnt.getFullYear()
                  const mAnt = dAnt.getMonth() + 1
                  const ultimoDiaAnt = new Date(aAnt, mAnt, 0).getDate()
                  const iniMesAnt = `${aAnt}-${String(mAnt).padStart(2, "0")}-01`
                  const fimMesAnt = `${aAnt}-${String(mAnt).padStart(2, "0")}-${String(ultimoDiaAnt).padStart(2, "0")}`

                  const iniAnual = `${anoAtual}-01-01`
                  const fimAnual = `${anoAtual}-12-31`

                  const isMesAtual =
                    filtroDataInicio === iniMesAtual &&
                    filtroDataFim === fimMesAtual
                  const isMesAnt =
                    filtroDataInicio === iniMesAnt &&
                    filtroDataFim === fimMesAnt
                  const isAnual =
                    filtroDataInicio === iniAnual && filtroDataFim === fimAnual

                  return (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary" />
                        Período:
                      </span>
                      <Button
                        type="button"
                        variant={isMesAtual ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFiltroDataInicio(iniMesAtual)
                          setFiltroDataFim(fimMesAtual)
                        }}
                        className={`h-7 text-[11px] font-semibold px-2.5 rounded-lg border-border/60 ${
                          isMesAtual
                            ? ""
                            : "hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        MÊS ATUAL
                      </Button>
                      <Button
                        type="button"
                        variant={isMesAnt ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFiltroDataInicio(iniMesAnt)
                          setFiltroDataFim(fimMesAnt)
                        }}
                        className={`h-7 text-[11px] font-semibold px-2.5 rounded-lg border-border/60 ${
                          isMesAnt
                            ? ""
                            : "hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        MÊS ANTERIOR
                      </Button>
                      <Button
                        type="button"
                        variant={isAnual ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFiltroDataInicio(iniAnual)
                          setFiltroDataFim(fimAnual)
                        }}
                        className={`h-7 text-[11px] font-semibold px-2.5 rounded-lg border-border/60 ${
                          isAnual
                            ? ""
                            : "hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        ANUAL
                      </Button>
                    </div>
                  )
                })()}
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Filtro Data Inicial */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Data Inicial (De)
                  </Label>
                  <Input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="h-9 text-xs rounded-lg font-mono bg-background"
                  />
                </div>

                {/* Filtro Data Final */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Data Final (Até)
                  </Label>
                  <Input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="h-9 text-xs rounded-lg font-mono bg-background"
                  />
                </div>

                {/* Filtro Traço de Referência */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    Traço
                  </Label>
                  <Select
                    value={filtroTracoId}
                    onValueChange={(val) => setFiltroTracoId(val)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-background">
                      <SelectValue placeholder="Todos os traços" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL">
                        Todos os traços ({tracos.length})
                      </SelectItem>
                      {tracos.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {formatarDescricaoCompletaTraco(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Dosagem de Cimento (kg/m³) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
                    Dosagem (kg/m³)
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={filtroDosagem}
                      onValueChange={(val) => setFiltroDosagem(val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg bg-background flex-1">
                        <SelectValue placeholder="Todas as dosagens" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="ALL">Todas as dosagens</SelectItem>
                        {opcoesDosagens.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d} kg/m³
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(filtroDataInicio ||
                      filtroDataFim ||
                      filtroTracoId !== "ALL" ||
                      filtroDosagem !== "ALL") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFiltroDataInicio("")
                          setFiltroDataFim("")
                          setFiltroTracoId("ALL")
                          setFiltroDosagem("ALL")
                        }}
                        title="Limpar filtros"
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela Responsiva de Cargas */}
            <Card className="border border-border/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/50 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3 w-16"># Carga</th>
                      <th className="py-3 px-3">Cliente</th>
                      <th className="py-3 px-3">Placa</th>
                      <th className="py-3 px-3">Motorista</th>
                      <th className="py-3 px-3">Cidade</th>
                      <th className="py-3 px-3">Traço</th>
                      <th className="py-3 px-3 text-right">Volume</th>
                      <th className="py-3 px-3 text-right">
                        Insumos (Consumo Real)
                      </th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {carregandoCargasLista ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                            <span>Carregando histórico de cargas...</span>
                          </div>
                        </td>
                      </tr>
                    ) : cargasFiltradas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <Truck className="w-6 h-6 text-muted-foreground/40" />
                            <span className="font-medium text-foreground">
                              Nenhuma carga encontrada para os filtros
                              selecionados
                            </span>
                            <span className="text-[11px]">
                              Ajuste as datas, traço ou dosagem para visualizar
                              outros lançamentos.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      cargasFiltradas.map((carga) => {
                        const vol = Number(carga.volume_m3) || 0
                        const cim = Number(carga.consumo_cimento) || 0
                        const adt = Number(carga.consumo_aditivo) || 0
                        const b12 = Number(carga.consumo_brita12) || 0
                        const b19 = Number(carga.consumo_brita19) || 0
                        const ar = Number(carga.consumo_areia) || 0
                        const isZerada = Boolean(carga.carga_zerada)

                        // Traço: descrição completa quando houver vínculo, ou "Manual" / "—" sem vínculo
                        const descricaoTraco = obterDescricaoCompletaCarga(
                          carga,
                          tracos,
                        )

                        return (
                          <tr
                            key={carga.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {/* Data */}
                            <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                              {carga.data.split("-").reverse().join("/")}
                            </td>

                            {/* Número da Carga */}
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                              #{String(carga.numero_carga).padStart(4, "0")}
                            </td>

                            {/* Cliente */}
                            <td className="py-2.5 px-3 text-xs whitespace-nowrap max-w-[150px] truncate">
                              {carga.cliente_nome ? (
                                <span
                                  className="font-medium text-foreground"
                                  title={carga.cliente_nome}
                                >
                                  {carga.cliente_nome}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Placa (Veículo) */}
                            <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                              {carga.veiculo_placa ? (
                                <span className="font-semibold text-foreground">
                                  {carga.veiculo_placa}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Motorista */}
                            <td className="py-2.5 px-3 text-xs whitespace-nowrap max-w-[140px] truncate">
                              {carga.motorista_nome ? (
                                <span
                                  className="text-foreground"
                                  title={carga.motorista_nome}
                                >
                                  {carga.motorista_nome}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Cidade */}
                            <td className="py-2.5 px-3 text-xs whitespace-nowrap max-w-[140px] truncate">
                              {carga.cidade_nome ? (
                                <span
                                  className="text-foreground"
                                  title={carga.cidade_nome}
                                >
                                  {carga.cidade_nome}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Traço */}
                            <td className="py-2.5 px-3 max-w-[280px]">
                              <span
                                className={`font-semibold ${
                                  descricaoTraco === "—" ||
                                  descricaoTraco === "Manual"
                                    ? "text-muted-foreground italic"
                                    : "text-foreground"
                                }`}
                              >
                                {descricaoTraco}
                              </span>
                            </td>

                            {/* Volume */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                              {vol.toFixed(1)} m³
                            </td>

                            {/* Insumos detalhados */}
                            <td className="py-2.5 px-3 text-right font-mono text-xs whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 text-[11px]">
                                <span
                                  className="font-bold text-primary"
                                  title="Cimento"
                                >
                                  Cim: {cim.toLocaleString("pt-BR")} kg
                                </span>
                                <span
                                  className="text-muted-foreground"
                                  title="B12"
                                >
                                  B12: {b12.toLocaleString("pt-BR")} kg
                                </span>
                                <span
                                  className="text-muted-foreground"
                                  title="B19"
                                >
                                  B19: {b19.toLocaleString("pt-BR")} kg
                                </span>
                                <span
                                  className="text-muted-foreground"
                                  title="Areia"
                                >
                                  Ar: {ar.toLocaleString("pt-BR")} kg
                                </span>
                                {(Number(carga.consumo_po_pedra || 0) > 0 ||
                                  isPatos) && (
                                  <span
                                    className="text-primary font-semibold"
                                    title="Pó de Brita"
                                  >
                                    Pó:{" "}
                                    {Number(
                                      carga.consumo_po_pedra || 0,
                                    ).toLocaleString("pt-BR")}{" "}
                                    kg
                                  </span>
                                )}
                                <span
                                  className="font-bold text-primary"
                                  title="Aditivo"
                                >
                                  Adt: {adt.toLocaleString("pt-BR")} L
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {isZerada ? (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] font-bold py-0.5"
                                >
                                  {carga.observacao?.includes(
                                    "[PERDA OPERACIONAL]",
                                  )
                                    ? "Perda"
                                    : "Cancelada"}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium text-emerald-600 border-emerald-500/30 bg-emerald-500/10 py-0.5"
                                >
                                  Normal
                                </Badge>
                              )}
                            </td>

                            {/* Ações: Editar e Imprimir */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {!isBalanceiro && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setCargaParaEditarModal(carga)
                                      setModalEditarCargaAberta(true)
                                    }}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg"
                                    title="Editar esta carga diretamente"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                )}

                                {carga.ordem_servico_id && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const os =
                                          await ConcreteiraService.getOrdemServicoPorId(
                                            carga.ordem_servico_id!,
                                          )
                                        if (os) {
                                          setOsParaReimpressao(os)
                                          setModalReimpressaoAberta(true)
                                        } else {
                                          toast({
                                            title: "OS não localizada",
                                            description:
                                              "Não foi possível abrir o recibo desta carga.",
                                            variant: "destructive",
                                          })
                                        }
                                      } catch (err: any) {
                                        toast({
                                          title: "Erro ao abrir recibo",
                                          description: err.message || "",
                                          variant: "destructive",
                                        })
                                      }
                                    }}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                    title="Imprimir Recibo da OS"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cancelamento" className="space-y-4 mt-0">
          <AbaCancelamentoCargas
            empresaId={empresaAtiva?.id}
            empresaNome={empresaAtiva?.nome}
            isPatos={isPatos}
            tracosCatalogo={tracos}
            onCancelamentoConcluido={() => {
              carregarCargasLista()
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Edição Direta de Carga (Sobre a Listagem, com AlertDialog de Confirmação) */}
      <ModalEditarCarga
        carga={cargaParaEditarModal}
        open={modalEditarCargaAberta}
        onOpenChange={(aberto) => {
          setModalEditarCargaAberta(aberto)
          if (!aberto) setCargaParaEditarModal(null)
        }}
        onSalvoComSucesso={() => {
          carregarCargasLista()
        }}
        tracosCatalogo={tracos}
        nomeUnidade={empresaAtiva?.nome || "Unidade"}
        isPatos={isPatos}
        empresaId={empresaAtiva?.id}
      />

      {/* Modal de Reimpressão do Recibo da Carga/OS */}
      <Dialog
        open={modalReimpressaoAberta}
        onOpenChange={setModalReimpressaoAberta}
      >
        <DialogContent className="w-[95vw] max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Printer className="w-5 h-5 text-primary shrink-0" />
              <span>
                Recibo de Expedição - OS #{osParaReimpressao?.numero_os}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Visualize e imprima o canhoto / via oficial do cliente para esta
              entrega.
            </DialogDescription>
          </DialogHeader>

          {osParaReimpressao && (
            <div className="py-2">
              <div
                id="recibo-impressao-modal-lancamentos"
                className="bg-white text-slate-900 p-4 rounded-xl border border-border shadow-xs"
              >
                <ReciboImpressao
                  ordem={osParaReimpressao}
                  empresa={empresaAtiva || null}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalReimpressaoAberta(false)}
              className="w-full sm:w-auto text-xs rounded-xl"
            >
              Fechar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleImprimirReciboOS}
              className="w-full sm:w-auto gap-1.5 font-bold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Específico para Carga Zerada/Cancelada (Trabalho B): Escolha entre PERDA vs CANCELAR */}
      <Dialog
        open={modalConfirmarZeradaAberta}
        onOpenChange={setModalConfirmarZeradaAberta}
      >
        <DialogContent className="w-[95vw] max-w-lg p-5 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive font-bold">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <span>Carga Zerada / Cancelada: Escolha a Ação</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Esta carga está marcada como zerada/cancelada. Defina como o
              sistema deve registrar a operação e tratar o estoque de insumos:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Opção PERDA OPERACIONAL */}
            <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-destructive text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  1. Registrar como PERDA OPERACIONAL
                </span>
                <Badge
                  variant="destructive"
                  className="text-[10px] uppercase font-bold"
                >
                  Debita Estoque
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                A batelada foi produzida mas perdida (problema na betoneira,
                traço reprovado na obra, etc.). Grava a observação{" "}
                <strong className="text-foreground font-mono">
                  [PERDA OPERACIONAL]
                </strong>{" "}
                e{" "}
                <strong className="text-destructive font-semibold">
                  DEBITA do estoque
                </strong>{" "}
                o cimento ({consumoReal.cimento.toLocaleString("pt-BR")} kg) e
                aditivo ({consumoReal.aditivo.toLocaleString("pt-BR")} L)
                consumidos.
              </p>
              <Button
                type="button"
                disabled={salvando}
                onClick={() =>
                  editarCargaId
                    ? executarSalvarEdicao("PERDA")
                    : executarCriarCarga("PERDA")
                }
                className="w-full min-h-[42px] h-10 gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs rounded-xl shadow-xs"
              >
                <Flame className="w-4 h-4" />
                {salvando
                  ? "Registrando Perda..."
                  : "Confirmar como PERDA (Baixar Estoque)"}
              </Button>
            </div>

            {/* Opção CANCELAR SEM MOVIMENTAÇÃO */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  2. Registrar como CANCELADA
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono"
                >
                  Sem Estoque
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                A carga foi cancelada antes de rodar a batelada ou digitada por
                engano. Registra a carga como cancelada{" "}
                <strong className="text-foreground">
                  SEM nenhuma movimentação de estoque
                </strong>{" "}
                (cimento e aditivo NÃO são debitados).
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={salvando}
                onClick={() =>
                  editarCargaId
                    ? executarSalvarEdicao("CANCELAR")
                    : executarCriarCarga("CANCELAR")
                }
                className="w-full min-h-[42px] h-10 gap-2 border-border/80 font-bold text-xs rounded-xl hover:bg-muted/50"
              >
                <XCircle className="w-4 h-4" />
                {salvando
                  ? "Cancelando..."
                  : "Confirmar como CANCELADA (Sem Baixa)"}
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={salvando}
              onClick={() => setModalConfirmarZeradaAberta(false)}
              className="w-full text-xs text-muted-foreground"
            >
              Voltar e Revisar Carga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
