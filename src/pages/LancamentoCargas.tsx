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
  Motorista,
  Veiculo,
  Cidade,
  Material,
  Carga,
} from "@/types/concreteira"
import {
  Truck,
  Calculator,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  RotateCcw,
  FileSpreadsheet,
  MapPin,
  User,
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
} from "lucide-react"
import { ReciboImpressao } from "@/components/ReciboImpressao"
import type { OrdemServico } from "@/types/concreteira"
import { toast } from "@/hooks/use-toast"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { LISTA_CIDADES_RAIO_POLOS } from "@/data/cidades-polos"
import { Badge } from "@/components/ui/badge"
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
  carga: { traco_id?: string | null traco_nome?: string | null },
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
  carga: { traco_id?: string | null traco_nome?: string | null },
  catalogoTracos: Traco[],
): string {
  const traco = resolverTracoReferenciaCarga(carga, catalogoTracos)
  if (traco) {
    return formatarDescricaoCompletaTraco(traco)
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
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
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

  // Lançamento 100% MANUAL (especificação Trabalho B):
  // A aba "Traço automático" foi removida — operador escolhe o traço no select e
  // digita/ajusta os consumos por m³ com cálculo em tempo real de aditivo e água.
  const modoDosagem = "manual" as const

  // Formulário
  const [dataCarga, setDataCarga] = useState(
    new Date().toISOString().split("T")[0],
  )
  const [volume, setVolume] = useState<number>(8.0)
  const [tracoSelecionadoId, setTracoSelecionadoId] = useState<string>("")
  const [motoristaNome, setMotoristaNome] = useState<string>("")
  const [veiculoPlaca, setVeiculoPlaca] = useState<string>("")
  const [cidadeNome, setCidadeNome] = useState<string>("")
  const [observacao, setObservacao] = useState<string>("")
  const [cargaZerada, setCargaZerada] = useState<boolean>(false)

  // Insumos no formulário (no modo manual são DOSAGEM por m³: kg/m³ para sólidos; no automático guardam a dosagem base)
  const [brita12, setBrita12] = useState<number>(0)
  const [brita19, setBrita19] = useState<number>(0)
  const [areia, setAreia] = useState<number>(0)
  const [poPedra, setPoPedra] = useState<number>(0)
  const [cimento, setCimento] = useState<number>(0)
  const [aditivo, setAditivo] = useState<number>(0)
  // Fator de dosagem para cálculo do aditivo (manual ou traço automático):
  // aditivo (L) = cimento TOTAL da carga (kg) × fator
  // onde cimento_total_kg = dosagem_cimento_kg_m3 × volume_m3 (ou cimento_total no automático)
  // Faixa de fatores do aditivo: 0,005 a 0,010 (+ personalizado)
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

  // Estado que rastreia tentativa de submissão para destacar campos obrigatórios faltantes
  const [tentouGravar, setTentouGravar] = useState<boolean>(false)

  useEffect(() => {
    async function init() {
      if (!empresaAtiva) return
      try {
        const [tr, mot, veic, cid, mats, todosTracos] = await Promise.all([
          ConcreteiraService.getTracos(empresaAtiva.id),
          ConcreteiraService.getMotoristas(empresaAtiva.id),
          ConcreteiraService.getVeiculos(empresaAtiva.id),
          ConcreteiraService.getCidades(empresaAtiva.id),
          ConcreteiraService.getMateriais(empresaAtiva.id),
          ConcreteiraService.getTracos(),
        ])

        // Garante inclusão dos traços F15B01S12 CP II F 40 e F45B01S12 CP II F 40 sem duplicar
        const listaTracos = [...tr]
        const idsAlvo = [
          "f3ca5a9e-21fe-48d1-8279-accc1fe49b2a",
          "6ba33daf-259a-4642-9302-822d41664d4f",
        ]
        todosTracos.forEach((t) => {
          if (
            idsAlvo.includes(t.id) ||
            /F15B01S12|F45B01S12/i.test(t.nome || "")
          ) {
            const jaExiste = listaTracos.some(
              (existente) =>
                existente.id === t.id ||
                extrairNomeTracoReferencia(existente.nome).toLowerCase() ===
                  extrairNomeTracoReferencia(t.nome).toLowerCase(),
            )
            if (!jaExiste) {
              listaTracos.push(t)
            }
          }
        })

        // Monta a lista completa unificada de traços garantindo a inclusão de todos os traços do catálogo
        // e os novos F15 e F45
        const tracosMap = new Map<string, Traco>()
        todosTracos.forEach((t) => tracosMap.set(t.id, t))
        listaTracos.forEach((t) => tracosMap.set(t.id, t))
        const catalogoCompleto = Array.from(tracosMap.values()).sort((a, b) => {
          const fckA = a.fck_mpa ?? 0
          const fckB = b.fck_mpa ?? 0
          if (fckA !== fckB) return fckA - fckB
          return (a.nome || "").localeCompare(b.nome || "")
        })

        setTracos(catalogoCompleto)
        setMotoristas(mot)
        setVeiculos(veic)
        setCidades(cid)
        setMateriais(mats)

        if (tr.length > 0) {
          setTracoSelecionadoId(tr[0].id)
          // Ao iniciar carga nova, zera os insumos para digitação manual ou restaura do traço
          if (isBalanceiro && !editarCargaId) {
            setCimento(0)
            setBrita12(0)
            setBrita19(0)
            setAreia(0)
            setPoPedra(0)
            setAditivo(0)
            setAditivoBruto(0)
            setAgua(0)
            setAguaBruta(0)
            setAditivoEditadoManualmente(false)
            setAguaEditadaManualmente(false)
          }
        } else {
          setTracoSelecionadoId("")
        }
      } catch (err) {
        console.error("Erro ao carregar dados do formulário:", err)
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
        setCargaZerada(Boolean(c.carga_zerada))
        setMotoristaNome(c.motorista_nome || "")
        setVeiculoPlaca(c.veiculo_placa || "")
        setCidadeNome(c.cidade_nome || "")
        setObservacao(c.observacao || "")

        // Se tiver traço vinculado ou por nome
        if (c.traco_id) {
          setTracoSelecionadoId(c.traco_id)
        } else if (c.traco_nome) {
          const tEncontrado = tracos.find(
            (t) => t.nome.toLowerCase() === c.traco_nome?.toLowerCase(),
          )
          if (tEncontrado) setTracoSelecionadoId(tEncontrado.id)
        }

        // Modo sempre manual na edição para refletir com exatidão as dosagens gravadas na carga
        // Calcular dosagens por m³ a partir do consumo total e volume
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

        // No modo manual, aditivo e água são mantidos como totais em litros
        setAditivo(Number(c.consumo_aditivo || 0))
        setAditivoBruto(Number(c.consumo_aditivo || 0))
        setAditivoEditadoManualmente(true)

        setAgua(Number(c.consumo_agua || 0))
        setAguaBruta(Number(c.consumo_agua || 0))
        setAguaEditadaManualmente(true)
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
  }, [editarCargaId, isBalanceiro, navigate, tracos])

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

      // Derivar ou manter o fator de aditivo inicial a partir do traço selecionado
      let fatorAdt = fatorAditivoManual || 0.006
      if (
        Number(traco.consumo_cimento) > 0 &&
        Number(traco.consumo_aditivo) > 0
      ) {
        const fatorTraco =
          Number(traco.consumo_aditivo) / Number(traco.consumo_cimento)
        if (fatorTraco >= 0.001 && fatorTraco <= 0.05) {
          fatorAdt = Number(fatorTraco.toFixed(4))
          setFatorAditivoManual(fatorAdt)
        }
      }

      const cimentoTotal = cimentoDosagem * vol
      // aditivo (L) = cimento total (kg) × fator
      const adtBruto = cimentoTotal * fatorAdt
      setAditivoBruto(adtBruto)
      setAditivo(Math.round(adtBruto))

      // água (L) = cimento total (kg) × fator
      const agBruta = cimentoTotal * (fatorAguaManual || 0.55)
      setAguaBruta(agBruta)
      setAgua(Math.round(agBruta))
    }
  }

  // Lançamento 100% manual: cálculo em tempo real de aditivo e água baseado no cimento por m³ e volume
  useEffect(() => {
    if (cargaZerada) {
      return
    }

    // O cimento digitado (kg/m³) × volume alimenta as fórmulas de aditivo e água em tempo real.
    const cimentoTotal = cimento * volume
    const adtBruto = cimentoTotal * (fatorAditivoManual || 0)
    setAditivoBruto(adtBruto)
    // Arredondamento INTEIRO clássico: Math.round
    if (!aditivoEditadoManualmente) {
      setAditivo(Math.round(adtBruto))
    }

    // Água (L) = cimento_total_kg × fatorAguaManual
    const agBruta = cimentoTotal * (fatorAguaManual || 0)
    setAguaBruta(agBruta)
    if (!aguaEditadaManualmente) {
      setAgua(Math.round(agBruta))
    }
  }, [
    volume,
    cargaZerada,
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
      title: "Aditivo recalculado",
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
      title: "Água recalculada",
      description: `Valor recalculado pela fórmula: ${Math.round(agBruta)} L`,
    })
  }

  const handleResetarParaTraco = () => {
    if (tracoSelecionadoId) {
      setAditivoEditadoManualmente(false)
      setAguaEditadaManualmente(false)
      aplicarDosagemTraco(tracoSelecionadoId, volume)
      toast({
        title: "Dosagem restaurada",
        description:
          "Os valores de dosagem (kg/m³) e cálculos de aditivo e água foram restaurados com base no traço selecionado.",
      })
    }
  }

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

  // Consumos REAIS da carga:
  // Em ambos os modos (manual e traço automático):
  // - Sólidos (cimento, areia, britas, pó de pedra) guardam dosagem por m³ e são multiplicados pelo volume.
  // - Aditivo e Água são liderados como volume TOTAL em litros da carga (já calculados com fator sobre cimento total ou digitados)
  //   e gravados como valor INTEIRO (Math.round).
  const consumoReal = {
    cimento: Math.round(cimento * volume),
    areia: Math.round(areia * volume),
    brita12: Math.round(brita12 * volume),
    brita19: Math.round(brita19 * volume),
    poPedra: Math.round(poPedra * volume),
    aditivo: Math.round(aditivo),
    agua: Math.round(agua),
  }

  // Validação estrita: "SO ACEITAR GRAVAR SE TODOS OS CAMPOS ESTIVEREM PREENCHIDOS"
  // Campos essenciais: data de expedição, volume (>0), traço/dosagem, aditivo, motorista, placa da betoneira e destino/cidade
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
        rotulo: "Data de Expedição",
        mensagem: "Informe a data de expedição",
      })
    }

    if (!volume || Number(volume) <= 0) {
      faltantes.push({
        campo: "volume",
        rotulo: "Volume da Carga",
        mensagem: "Volume deve ser maior que 0 m³",
      })
    }

    if (!tracoSelecionadoId || tracoSelecionadoId.trim() === "") {
      faltantes.push({
        campo: "traco",
        rotulo: "Traço / Dosagem",
        mensagem: "Selecione o traço ou dosagem da carga",
      })
    }

    if (!motoristaNome || motoristaNome.trim() === "") {
      faltantes.push({
        campo: "motorista",
        rotulo: "Motorista",
        mensagem: "Informe o nome do motorista",
      })
    }

    if (!veiculoPlaca || veiculoPlaca.trim() === "") {
      faltantes.push({
        campo: "veiculo",
        rotulo: "Placa Betoneira",
        mensagem: "Selecione o veículo / placa da betoneira",
      })
    }

    if (!cidadeNome || cidadeNome.trim() === "") {
      faltantes.push({
        campo: "cidade",
        rotulo: "Destino / Cidade",
        mensagem: "Informe o destino ou cidade da entrega",
      })
    }

    // Aditivo: deve ser informado / maior que zero (a menos que seja carga cancelada/zerada)
    if (
      !cargaZerada &&
      (aditivo === undefined || aditivo === null || Number(aditivo) <= 0)
    ) {
      faltantes.push({
        campo: "aditivo",
        rotulo: "Aditivo (L)",
        mensagem: "Informe o volume de aditivo (L)",
      })
    }

    // Se estiver no modo manual sem ser cancelada, deve haver consumo de insumos/cimento
    if (modoDosagem === "manual" && !cargaZerada) {
      const somaDosagens =
        brita12 + brita19 + areia + poPedra + cimento + aditivo
      if (somaDosagens <= 0) {
        faltantes.push({
          campo: "insumos",
          rotulo: "Insumos (kg/m³)",
          mensagem: "No modo manual, informe a dosagem de cimento e agregados",
        })
      }
    }

    return faltantes
  }

  const errosValidacao = obterErrosValidacao()
  const formularioValido = errosValidacao.length === 0

  const validarFormulario = (): boolean => {
    setTentouGravar(true)

    if (errosValidacao.length > 0) {
      const listaFaltantes = errosValidacao.map((e) => e.rotulo).join(", ")
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
    const nomeTracoGravado = traco ? `${traco.nome} (Manual)` : "Dosagem Manual"

    setSalvando(true)
    try {
      await ConcreteiraService.atualizarCarga(editarCargaId, {
        data: dataCarga,
        volume_m3: volume,
        traco_id: traco?.id,
        traco_nome: nomeTracoGravado,
        motorista_nome: motoristaNome || null,
        veiculo_placa: veiculoPlaca || null,
        cidade_nome: cidadeNome || null,
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
      })

      setModalConfirmarEdicaoAberta(false)
      setModalConfirmarZeradaAberta(false)

      toast({
        title: "Carga alterada com sucesso!",
        description:
          "Movimentações de estoque recalculadas e integridade do saldo mantida.",
      })

      // Se não for balanceiro ou estiver editando, pode recarregar a lista de cargas
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
    const nomeTracoGravado = traco ? `${traco.nome} (Manual)` : "Dosagem Manual"

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
          ? `[Lançamento manual | Aditivo: ${consumoReal.aditivo}L${
              aditivoEditadoManualmente
                ? " (manual)"
                : ` (fator ${fatorAditivoManual})`
            } | Água: ${consumoReal.agua}L${
              aguaEditadaManualmente
                ? " (manual)"
                : ` (fator ${fatorAguaManual})`
            }] ${observacao}`
          : `[Lançamento manual | Aditivo: ${consumoReal.aditivo}L${
              aditivoEditadoManualmente
                ? " (manual)"
                : ` (fator ${fatorAditivoManual})`
            } | Água: ${consumoReal.agua}L${
              aguaEditadaManualmente
                ? " (manual)"
                : ` (fator ${fatorAguaManual})`
            }]`,
        carga_zerada: cargaZerada,
        motivo_zerada: motivoZerada,
      })

      setModalConfirmarGravacaoAberta(false)
      setModalConfirmarZeradaAberta(false)

      toast({
        title: "Carga lançada com sucesso!",
        description: cargaZerada
          ? motivoZerada === "PERDA"
            ? "Carga registrada como PERDA OPERACIONAL. Baixa de cimento e aditivo efetuada no estoque."
            : "Carga cancelada registrada SEM nenhuma movimentação de estoque."
          : "Baixa de estoque nos materiais controlados (Cimento e Aditivo) realizada com sucesso.",
      })

      // Limpar formulário para próximo lançamento e atualizar listagem
      if (isBalanceiro) {
        setVolume(8.0)
        setMotoristaNome("")
        setVeiculoPlaca("")
        setCidadeNome("")
        setObservacao("")
        setCargaZerada(false)
        setCimento(0)
        setBrita12(0)
        setBrita19(0)
        setAreia(0)
        setPoPedra(0)
        setAditivo(0)
        setAditivoBruto(0)
        setAgua(0)
        setAguaBruta(0)
        setAditivoEditadoManualmente(false)
        setAguaEditadaManualmente(false)
        setTentouGravar(false)
      }
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

  // Faixa de fatores do aditivo pedida pelo usuário: 0,005 a 0,010
  const OPCOES_FATOR_ADITIVO = [
    { valor: 0.005, rotulo: "0,005" },
    { valor: 0.006, rotulo: "0,006" },
    { valor: 0.007, rotulo: "0,007" },
    { valor: 0.008, rotulo: "0,008" },
    { valor: 0.009, rotulo: "0,009" },
    { valor: 0.01, rotulo: "0,010" },
  ]

  // Faixa de fatores de água pedida pelo usuário: 0,45 a 0,8
  const OPCOES_FATOR_AGUA = [
    { valor: 0.45, rotulo: "0,45" },
    { valor: 0.5, rotulo: "0,50" },
    { valor: 0.55, rotulo: "0,55" },
    { valor: 0.6, rotulo: "0,60" },
    { valor: 0.65, rotulo: "0,65" },
    { valor: 0.7, rotulo: "0,70" },
    { valor: 0.75, rotulo: "0,75" },
    { valor: 0.8, rotulo: "0,80" },
  ]

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
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold shadow-xs border-border/60 hover:bg-muted/40 self-stretch sm:self-auto h-9"
            title="Ir para tela de cadastros e importação de planilha de controle diário"
          >
            <Link to="/cadastros">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Importar Planilha CSV
            </Link>
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Bloco 1: Dados Essenciais da Expedição (Data, Volume, Traço, Motorista, Placa, Destino) */}
        <Card className="border-border/50 bg-card/80 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                  <Truck className="w-4 h-4 text-primary" />
                  1. Dados da Expedição e Viagem
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Campos essenciais para identificação rápida da viagem na
                  balança
                </CardDescription>
              </div>

              {/* Checkbox Carga Zerada Compacto no Topo */}
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

          <CardContent className="p-3.5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Data da Carga */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="data"
                  className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                    tentouGravar && (!dataCarga || dataCarga.trim() === "")
                      ? "text-destructive font-bold"
                      : "text-foreground"
                  }`}
                >
                  <span>Data de Expedição *</span>
                  {tentouGravar && (!dataCarga || dataCarga.trim() === "") && (
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
                  className={`min-h-[44px] h-11 sm:h-10 text-sm sm:text-base bg-background font-mono rounded-xl px-3 transition-colors ${
                    tentouGravar && (!dataCarga || dataCarga.trim() === "")
                      ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                      : ""
                  }`}
                />
              </div>

              {/* Volume m³ em destaque com botões rápidos para celular/tablet */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="volume"
                  className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                    tentouGravar && (!volume || Number(volume) <= 0)
                      ? "text-destructive font-bold"
                      : "text-foreground"
                  }`}
                >
                  <span>Volume da Carga *</span>
                  {tentouGravar && (!volume || Number(volume) <= 0) ? (
                    <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                      <AlertCircle className="w-3.5 h-3.5" /> Informe volume
                      &gt; 0
                    </span>
                  ) : (
                    <span className="text-xs text-primary font-mono font-bold">
                      m³
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="volume"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0.5"
                    max="15"
                    value={volume || ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setVolume(isNaN(val) ? 0 : val)
                    }}
                    required
                    className={`min-h-[44px] h-11 sm:h-10 text-base sm:text-lg font-bold font-mono text-primary bg-background pr-10 text-left rounded-xl transition-colors ${
                      tentouGravar && (!volume || Number(volume) <= 0)
                        ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5 text-destructive"
                        : ""
                    }`}
                    placeholder="8.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    m³
                  </span>
                </div>
                {/* Botões rápidos de volume comuns em betoneira (4, 6, 8 m³) para toque com 1 dedo */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[4, 6, 7, 8].map((vRapido) => (
                    <button
                      key={vRapido}
                      type="button"
                      onClick={() => setVolume(vRapido)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                        volume === vRapido
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted border-border/50"
                      }`}
                    >
                      {vRapido}m³
                    </button>
                  ))}
                </div>
              </div>

              {/* Traço / Dosagem */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="traco"
                  className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                    tentouGravar &&
                    (!tracoSelecionadoId || tracoSelecionadoId.trim() === "")
                      ? "text-destructive font-bold"
                      : "text-foreground"
                  }`}
                >
                  <span>
                    {modoDosagem === "manual"
                      ? "Traço de Referência *"
                      : "Traço / Dosagem *"}
                  </span>
                  {tentouGravar &&
                    (!tracoSelecionadoId ||
                      tracoSelecionadoId.trim() === "") && (
                      <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                        <AlertCircle className="w-3.5 h-3.5" /> Selecione o
                        traço
                      </span>
                    )}
                </Label>
                <Select
                  value={tracoSelecionadoId}
                  onValueChange={(val) => {
                    setTracoSelecionadoId(val)
                    if (isBalanceiro && modoDosagem === "manual") {
                      setCimento(0)
                      setBrita12(0)
                      setBrita19(0)
                      setAreia(0)
                      setPoPedra(0)
                      setAditivo(0)
                      setAditivoBruto(0)
                      setAgua(0)
                      setAguaBruta(0)
                      setAditivoEditadoManualmente(false)
                      setAguaEditadaManualmente(false)
                    } else {
                      aplicarDosagemTraco(val, volume)
                    }
                  }}
                  disabled={cargaZerada}
                >
                  <SelectTrigger
                    id="traco"
                    className={`min-h-[44px] h-11 sm:h-10 text-xs sm:text-sm bg-background rounded-xl px-3 transition-colors ${
                      tentouGravar &&
                      (!tracoSelecionadoId || tracoSelecionadoId.trim() === "")
                        ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Selecione o traço" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracos.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        className="text-xs sm:text-sm py-2.5"
                      >
                        {formatarDescricaoCompletaTraco(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Motorista com Datalist e campo alto */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="motorista"
                  className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                    tentouGravar &&
                    (!motoristaNome || motoristaNome.trim() === "")
                      ? "text-destructive font-bold"
                      : "text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4 text-primary" />
                    Motorista *
                  </span>
                  {tentouGravar &&
                    (!motoristaNome || motoristaNome.trim() === "") && (
                      <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                        <AlertCircle className="w-3.5 h-3.5" /> Obrigatório
                      </span>
                    )}
                </Label>
                <div className="relative">
                  <Input
                    id="motorista"
                    list="lista-motoristas"
                    value={motoristaNome}
                    onChange={(e) => setMotoristaNome(e.target.value)}
                    placeholder="Nome do motorista..."
                    className={`min-h-[44px] h-11 sm:h-10 text-xs sm:text-sm bg-background rounded-xl px-3 transition-colors ${
                      tentouGravar &&
                      (!motoristaNome || motoristaNome.trim() === "")
                        ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                        : ""
                    }`}
                  />
                  <datalist id="lista-motoristas">
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.nome} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Placa da Betoneira */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="veiculo"
                  className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                    tentouGravar &&
                    (!veiculoPlaca || veiculoPlaca.trim() === "")
                      ? "text-destructive font-bold"
                      : "text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-primary" />
                    Placa Betoneira *
                  </span>
                  {tentouGravar &&
                    (!veiculoPlaca || veiculoPlaca.trim() === "") && (
                      <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                        <AlertCircle className="w-3.5 h-3.5" /> Obrigatório
                      </span>
                    )}
                </Label>
                <Select value={veiculoPlaca} onValueChange={setVeiculoPlaca}>
                  <SelectTrigger
                    id="veiculo"
                    className={`min-h-[44px] h-11 sm:h-10 text-xs sm:text-sm bg-background font-mono rounded-xl px-3 transition-colors ${
                      tentouGravar &&
                      (!veiculoPlaca || veiculoPlaca.trim() === "")
                        ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={v.placa}
                        className="text-xs sm:text-sm font-mono py-2.5"
                      >
                        {v.placa} {v.modelo ? `- ${v.modelo}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cidade / Destino */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="cidade"
                  className={`text-xs sm:text-sm font-semibold flex items-center justify-between ${
                    tentouGravar && (!cidadeNome || cidadeNome.trim() === "")
                      ? "text-destructive font-bold"
                      : "text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    Destino / Cidade *
                  </span>
                  {tentouGravar &&
                    (!cidadeNome || cidadeNome.trim() === "") && (
                      <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                        <AlertCircle className="w-3.5 h-3.5" /> Obrigatório
                      </span>
                    )}
                </Label>
                <div className="relative">
                  <Input
                    id="cidade"
                    list="lista-cidades"
                    value={cidadeNome}
                    onChange={(e) => setCidadeNome(e.target.value)}
                    placeholder="Cidade ou obra de destino..."
                    className={`min-h-[44px] h-11 sm:h-10 text-xs sm:text-sm bg-background rounded-xl px-3 transition-colors ${
                      tentouGravar && (!cidadeNome || cidadeNome.trim() === "")
                        ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                        : ""
                    }`}
                  />
                  <datalist id="lista-cidades">
                    {LISTA_CIDADES_RAIO_POLOS.map((cidFormatada) => (
                      <option key={cidFormatada} value={cidFormatada} />
                    ))}
                    {cidades
                      .filter(
                        (c) =>
                          !LISTA_CIDADES_RAIO_POLOS.some(
                            (p) =>
                              p.toLowerCase() === c.nome.toLowerCase() ||
                              p
                                .toLowerCase()
                                .startsWith(`${c.nome.toLowerCase()}/`),
                          ),
                      )
                      .map((c) => (
                        <option
                          key={c.id}
                          value={c.uf ? `${c.nome}/${c.uf}` : c.nome}
                        />
                      ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Observações da Carga (linha compacta) */}
            <div className="pt-2 border-t border-border/30">
              <div className="space-y-1.5">
                <Label
                  htmlFor="observacao"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Observações adicionais (opcional)
                </Label>
                <Input
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex.: Obra Centro, concreto bombeado, nota fiscal na entrega..."
                  className="min-h-[44px] h-11 sm:h-9 text-xs sm:text-sm bg-background rounded-xl px-3"
                />
              </div>
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
                  Informe a dosagem de cada insumo em kg/m³. O cimento alimenta
                  em tempo real o cálculo do aditivo e da água. O consumo total
                  gravado é multiplicado automaticamente pelo volume ({volume}{" "}
                  m³).
                </CardDescription>
              </div>

              {/* Indicador de Lançamento 100% Manual */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-8 px-3 text-xs font-semibold bg-primary/10 text-primary border-primary/30 gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Lançamento 100% Manual
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Aviso explicativo no modo manual */}
            {modoDosagem === "manual" && !cargaZerada && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong>Dosagem por m³:</strong> Digite a dosagem de cada
                    insumo em <strong>kg/m³</strong>. O cimento total da carga é{" "}
                    <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono font-semibold">
                      {cimento} kg/m³ × {volume} m³ = {consumoReal.cimento} kg
                    </code>
                    . O <strong>Aditivo</strong> é calculado como{" "}
                    <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono font-semibold">
                      cimento total ({consumoReal.cimento} kg) × fator (
                      {fatorAditivoManual}) = {aditivo} L
                    </code>
                    . A <strong>Água</strong> é calculada como{" "}
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
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <Label
                    htmlFor="volume-ambiente-insumos"
                    className="text-xs sm:text-sm font-semibold text-foreground block"
                  >
                    Volume da Carga (m³)
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    {modoDosagem === "manual"
                      ? "Multiplicador aplicado às dosagens (kg/m³) para obter o consumo total"
                      : "Multiplica os consumos do traço e define aditivo/água por fator"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-36">
                  <Input
                    id="volume-ambiente-insumos"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0.5"
                    max="15"
                    value={volume || ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setVolume(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className="font-mono font-bold text-center pr-9 min-h-[44px] h-11 text-base sm:text-lg bg-background rounded-xl"
                    placeholder="8.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    m³
                  </span>
                </div>
              </div>
            </div>

            {/* Grid dos Insumos (Cimento, Aditivo, ÁGUA, Areia, Brita 12, Brita 19, Pó de Pedra) - Otimizado com campos altos touch-friendly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Cimento */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50"
                }`}
              >
                <Label
                  htmlFor="cimento"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    {`${materiais.find((m) => m.codigo === "cimento")?.nome || "CP II F-40 / CP V ARI"} (kg/m³)`}
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal shrink-0">
                      Estoque
                    </span>
                  </span>
                  {tracoAtual && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_cimento} kg/m³
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
                    value={
                      cimento === 0 && modoDosagem === "manual" ? "" : cimento
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setCimento(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold min-h-[44px] h-11 text-base rounded-xl ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-10"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    {modoDosagem === "manual" ? "kg/m³" : "kg"}
                  </span>
                </div>
                {modoDosagem === "manual" && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.cimento.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Aditivo: CALCULADO POR FATOR (MESMO COMPORTAMENTO NO MODO AUTOMÁTICO E MANUAL) */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  tentouGravar &&
                  !cargaZerada &&
                  (aditivo === undefined ||
                    aditivo === null ||
                    Number(aditivo) <= 0)
                    ? "border-destructive ring-1 ring-destructive/40 bg-destructive/5"
                    : modoDosagem === "manual"
                      ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                      : "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                }`}
              >
                <Label
                  htmlFor="aditivo"
                  className={`text-xs flex justify-between items-center ${
                    tentouGravar &&
                    !cargaZerada &&
                    (aditivo === undefined ||
                      aditivo === null ||
                      Number(aditivo) <= 0)
                      ? "text-destructive font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold flex items-center gap-1">
                    Aditivo (L) *
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal">
                      Estoque
                    </span>
                    {aditivoEditadoManualmente ? (
                      <span className="text-[10px] px-1 py-0.2 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded font-medium">
                        Digitado
                      </span>
                    ) : (
                      <span className="text-[10px] px-1 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-medium">
                        Calculado
                      </span>
                    )}
                  </span>
                  {tentouGravar &&
                  !cargaZerada &&
                  (aditivo === undefined ||
                    aditivo === null ||
                    Number(aditivo) <= 0) ? (
                    <span className="text-[11px] text-destructive flex items-center gap-1 font-normal">
                      <AlertCircle className="w-3.5 h-3.5" /> Obrigatório &gt; 0
                    </span>
                  ) : (
                    tracoAtual && (
                      <span className="text-[10px] text-muted-foreground">
                        Traço:{" "}
                        {(Number(tracoAtual.consumo_aditivo) * volume).toFixed(
                          2,
                        )}{" "}
                        L ({tracoAtual.consumo_aditivo} L/m³)
                      </span>
                    )
                  )}
                </Label>

                <div className="space-y-2">
                  {/* Campo Aditivo Editável com opção de recalcular */}
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        id="aditivo"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={
                          aditivo === 0 && aditivoEditadoManualmente
                            ? ""
                            : aditivo
                        }
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value)
                          setAditivoEditadoManualmente(true)
                          setAditivo(isNaN(val) ? 0 : Math.round(val))
                        }}
                        disabled={cargaZerada}
                        className="font-mono font-bold text-base bg-background text-foreground pr-8 border-primary/40 focus-visible:ring-primary min-h-[44px] h-11 rounded-xl"
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
                        aditivoEditadoManualmente ? "secondary" : "outline"
                      }
                      size="icon"
                      onClick={handleRecalcularAditivo}
                      disabled={cargaZerada}
                      className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl shrink-0"
                      title="Recalcular aditivo pela fórmula (cimento total × fator)"
                    >
                      <RotateCcw className="w-4 h-4" />
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
                      value={
                        OPCOES_FATOR_ADITIVO.some(
                          (o) => o.valor === fatorAditivoManual,
                        )
                          ? String(fatorAditivoManual)
                          : "custom"
                      }
                      onValueChange={(val) => {
                        if (val !== "custom") {
                          setFatorAditivoManual(Number(val))
                          setAditivoEditadoManualmente(false)
                        }
                      }}
                      disabled={cargaZerada}
                    >
                      <SelectTrigger
                        id="fator-aditivo-select"
                        className="min-h-[40px] h-10 text-xs font-mono font-medium flex-1 px-2.5 bg-background border-border/70 shadow-xs rounded-lg"
                      >
                        <SelectValue placeholder="Selecione o fator">
                          {OPCOES_FATOR_ADITIVO.some(
                            (o) => o.valor === fatorAditivoManual,
                          )
                            ? String(fatorAditivoManual).replace(".", ",")
                            : `${String(fatorAditivoManual).replace(".", ",")} (outro)`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover text-popover-foreground">
                        {OPCOES_FATOR_ADITIVO.map((op) => (
                          <SelectItem
                            key={op.valor}
                            value={String(op.valor)}
                            className="font-mono text-xs cursor-pointer py-2.5"
                          >
                            Fator {op.rotulo}
                          </SelectItem>
                        ))}
                        {!OPCOES_FATOR_ADITIVO.some(
                          (o) => o.valor === fatorAditivoManual,
                        ) && (
                          <SelectItem
                            value="custom"
                            className="font-mono text-xs cursor-pointer py-2.5"
                          >
                            {String(fatorAditivoManual).replace(".", ",")}{" "}
                            (Personalizado)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Input numérico para digitação livre do fator (faixa 0,005 a 0,01) */}
                    <Input
                      id="fator-aditivo"
                      type="number"
                      inputMode="decimal"
                      step="0.0005"
                      min="0.001"
                      max="0.05"
                      value={fatorAditivoManual || ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? 0 : Number(e.target.value)
                        setFatorAditivoManual(isNaN(val) ? 0 : val)
                        setAditivoEditadoManualmente(false)
                      }}
                      disabled={cargaZerada}
                      className="min-h-[40px] h-10 w-20 text-xs font-mono font-medium text-center px-1 bg-background border-border/70 rounded-lg"
                      title="Ou digite manualmente o fator de aditivo"
                      placeholder="0.006"
                    />
                  </div>
                  {/* Legenda com o valor bruto e arredondamento */}
                  <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                    <div>
                      {consumoReal.cimento} kg × {fatorAditivoManual} ={" "}
                      <span className="font-mono font-medium">
                        {aditivoBruto.toFixed(2)} →{" "}
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
                        ? "Valor manual digitado (toque em ↺ para restaurar)"
                        : "Arredondamento inteiro: ≥ 0,5 sobe | Digite ou use fator"}
                    </div>
                  </div>
                </div>
              </div>

              {/* NOVO: ÁGUA (Calculada com opção de digitação manual) */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "border-border/40 bg-background/50"
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
                    {modoDosagem === "manual" &&
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
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={agua === 0 && aguaEditadaManualmente ? "" : agua}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value)
                          setAguaEditadaManualmente(true)
                          setAgua(isNaN(val) ? 0 : Math.round(val))
                        }}
                        disabled={cargaZerada}
                        className="font-mono font-bold text-base bg-background text-foreground pr-8 border-cyan-500/40 focus-visible:ring-cyan-500 min-h-[44px] h-11 rounded-xl"
                        placeholder="0"
                        title="Digite o volume de água (L) ou use o cálculo do fator"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                        L
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant={aguaEditadaManualmente ? "secondary" : "outline"}
                      size="icon"
                      onClick={handleRecalcularAgua}
                      disabled={cargaZerada}
                      className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl shrink-0"
                      title="Recalcular água pela fórmula (cimento total × fator)"
                    >
                      <RotateCcw className="w-4 h-4" />
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
                      value={
                        OPCOES_FATOR_AGUA.some(
                          (o) => o.valor === fatorAguaManual,
                        )
                          ? String(fatorAguaManual)
                          : "custom"
                      }
                      onValueChange={(val) => {
                        if (val !== "custom") {
                          setFatorAguaManual(Number(val))
                          setAguaEditadaManualmente(false)
                        }
                      }}
                      disabled={cargaZerada}
                    >
                      <SelectTrigger
                        id="fator-agua-select"
                        className="min-h-[40px] h-10 text-xs font-mono font-medium flex-1 px-2.5 bg-background border-border/70 shadow-xs rounded-lg"
                      >
                        <SelectValue placeholder="Selecione o fator">
                          {OPCOES_FATOR_AGUA.some(
                            (o) => o.valor === fatorAguaManual,
                          )
                            ? String(fatorAguaManual).replace(".", ",")
                            : `${String(fatorAguaManual).replace(".", ",")} (outro)`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover text-popover-foreground">
                        {OPCOES_FATOR_AGUA.map((op) => (
                          <SelectItem
                            key={op.valor}
                            value={String(op.valor)}
                            className="font-mono text-xs cursor-pointer py-2.5"
                          >
                            Fator {op.rotulo}
                          </SelectItem>
                        ))}
                        {!OPCOES_FATOR_AGUA.some(
                          (o) => o.valor === fatorAguaManual,
                        ) && (
                          <SelectItem
                            value="custom"
                            className="font-mono text-xs cursor-pointer py-2.5"
                          >
                            {String(fatorAguaManual).replace(".", ",")}{" "}
                            (Personalizado)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Input numérico para digitação livre do fator (faixa 0,45 a 0,8) */}
                    <Input
                      id="fator-agua"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.30"
                      max="1.20"
                      value={fatorAguaManual || ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? 0 : Number(e.target.value)
                        setFatorAguaManual(isNaN(val) ? 0 : val)
                        setAguaEditadaManualmente(false)
                      }}
                      disabled={cargaZerada}
                      className="min-h-[40px] h-10 w-20 text-xs font-mono font-medium text-center px-1 bg-background border-border/70 rounded-lg"
                      title="Ou digite manualmente o fator de água"
                      placeholder="0.55"
                    />
                  </div>

                  {/* Legenda com o valor bruto e arredondamento */}
                  <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                    <div>
                      {consumoReal.cimento} kg × {fatorAguaManual} ={" "}
                      <span className="font-mono font-medium">
                        {aguaBruta.toFixed(2)} →{" "}
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
                        ? "Valor manual digitado (toque em ↺ para restaurar | Sem estoque)"
                        : "(Arredondamento inteiro: ≥ 0,5 sobe | Sem estoque)"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Areia */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50"
                }`}
              >
                <Label
                  htmlFor="areia"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Areia (kg/m³)
                  </span>
                  {tracoAtual && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_areia} kg/m³
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
                    value={areia === 0 && modoDosagem === "manual" ? "" : areia}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setAreia(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold min-h-[44px] h-11 text-base rounded-xl ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-10"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    {modoDosagem === "manual" ? "kg/m³" : "kg"}
                  </span>
                </div>
                {modoDosagem === "manual" && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.areia.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Brita 12 */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50"
                }`}
              >
                <Label
                  htmlFor="brita12"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Brita 12 (kg/m³)
                  </span>
                  {tracoAtual && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_brita12} kg/m³
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
                    value={
                      brita12 === 0 && modoDosagem === "manual" ? "" : brita12
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setBrita12(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold min-h-[44px] h-11 text-base rounded-xl ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-10"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    {modoDosagem === "manual" ? "kg/m³" : "kg"}
                  </span>
                </div>
                {modoDosagem === "manual" && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.brita12.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Brita 19 */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50"
                }`}
              >
                <Label
                  htmlFor="brita19"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Brita 19 (kg/m³)
                  </span>
                  {tracoAtual && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_brita19} kg/m³
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
                    value={
                      brita19 === 0 && modoDosagem === "manual" ? "" : brita19
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setBrita19(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold min-h-[44px] h-11 text-base rounded-xl ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-10"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    {modoDosagem === "manual" ? "kg/m³" : "kg"}
                  </span>
                </div>
                {modoDosagem === "manual" && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.brita19.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Pó de Pedra */}
              <div
                className={`space-y-1.5 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50"
                }`}
              >
                <Label
                  htmlFor="poPedra"
                  className="text-xs text-muted-foreground flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    Pó de Pedra (kg/m³)
                  </span>
                  {tracoAtual && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço: {tracoAtual.consumo_po_pedra} kg/m³
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="poPedra"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={
                      poPedra === 0 && modoDosagem === "manual" ? "" : poPedra
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setPoPedra(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold min-h-[44px] h-11 text-base rounded-xl ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-10"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    {modoDosagem === "manual" ? "kg/m³" : "kg"}
                  </span>
                </div>
                {modoDosagem === "manual" && (
                  <div className="text-[11px] text-muted-foreground font-mono flex justify-between items-center pt-0.5">
                    <span>Total da carga:</span>
                    <span className="font-semibold text-foreground">
                      {consumoReal.poPedra.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo Dinâmico e Clean de Insumos e Agregados Totais da Carga - Cartões responsivos compactos para mobile */}
            <div className="mt-4 pt-4 border-t border-border/40 bg-muted/20 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3.5 sm:p-5 rounded-b-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Consumo Total Calculado ({volume || 0} m³)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {modoDosagem === "manual"
                    ? "Fórmula: Dosagem (kg/m³) × Volume"
                    : "Fórmula: Traço Selecionado × Volume"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {/* Cimento */}
                <div className="p-2.5 rounded-xl border border-primary/40 bg-primary/10 flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-bold text-foreground">
                    Cimento (CP)
                  </span>
                  <div className="mt-1">
                    <span className="text-base sm:text-lg font-black font-mono text-primary block leading-tight">
                      {consumoReal.cimento.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                      kg
                    </span>
                  </div>
                </div>

                {/* Aditivo */}
                <div className="p-2.5 rounded-xl border border-primary/40 bg-primary/10 flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-bold text-foreground">
                    Aditivo
                  </span>
                  <div className="mt-1">
                    <span className="text-base sm:text-lg font-black font-mono text-primary block leading-tight">
                      {consumoReal.aditivo.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                      Litros
                    </span>
                  </div>
                </div>

                {/* Água */}
                <div className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                    Água
                  </span>
                  <div className="mt-1">
                    <span className="text-base sm:text-lg font-black font-mono text-cyan-600 dark:text-cyan-400 block leading-tight">
                      {consumoReal.agua.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                      Litros
                    </span>
                  </div>
                </div>

                {/* Areia */}
                <div className="p-2.5 rounded-xl border border-border/60 bg-background flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Areia
                  </span>
                  <div className="mt-1">
                    <span className="text-sm sm:text-base font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.areia.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Brita 12 */}
                <div className="p-2.5 rounded-xl border border-border/60 bg-background flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Brita 12
                  </span>
                  <div className="mt-1">
                    <span className="text-sm sm:text-base font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.brita12.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Brita 19 */}
                <div className="p-2.5 rounded-xl border border-border/60 bg-background flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Brita 19
                  </span>
                  <div className="mt-1">
                    <span className="text-sm sm:text-base font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.brita19.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Pó de Pedra */}
                <div className="p-2.5 rounded-xl border border-border/60 bg-background col-span-2 sm:col-span-1 flex flex-col justify-between shadow-2xs">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Pó de Pedra
                  </span>
                  <div className="mt-1">
                    <span className="text-sm sm:text-base font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.poPedra.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso de campos pendentes caso haja erro de validação */}
        {!formularioValido && (
          <div
            className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
              tentouGravar
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold block sm:inline">
                  {tentouGravar
                    ? "Preencha todos os campos para gravar:"
                    : "Campos obrigatórios pendentes para gravação:"}
                </span>{" "}
                <span className="font-medium">
                  {errosValidacao.map((e) => e.rotulo).join(", ")}
                </span>
              </div>
            </div>
            <span className="text-[11px] opacity-80 shrink-0 font-medium">
              Todos os campos são obrigatórios
            </span>
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

          {/* Botão de Gravação / Alteração com bloqueio visual quando há campos pendentes */}
          {editarCargaId ? (
            <Button
              type="submit"
              variant="default"
              disabled={salvando || carregandoCargaEdicao || !formularioValido}
              title={
                !formularioValido
                  ? `Preencha todos os campos: faltam ${errosValidacao.map((e) => e.rotulo).join(", ")}`
                  : undefined
              }
              className={`w-full sm:w-auto min-h-[48px] sm:min-h-[40px] h-12 sm:h-10 gap-2 font-bold text-sm sm:text-base shadow-md px-8 rounded-xl transition-all ${
                !formularioValido
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60 border border-border/40"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
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
              disabled={salvando || !formularioValido}
              title={
                !formularioValido
                  ? `Preencha todos os campos: faltam ${errosValidacao.map((e) => e.rotulo).join(", ")}`
                  : undefined
              }
              className={`w-full sm:w-auto min-h-[48px] sm:min-h-[40px] h-12 sm:h-10 gap-2 font-bold text-sm sm:text-base shadow-md px-8 rounded-xl transition-all ${
                !formularioValido
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60 border border-border/40"
                  : "bg-primary text-primary-foreground hover:brightness-105"
              }`}
            >
              {salvando ? (
                "Gravando Carga..."
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Gravar Lançamento da Carga
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
                    Traço / Dosagem:
                  </span>
                  <span className="font-semibold text-xs sm:text-sm">
                    {modoDosagem === "manual"
                      ? tracoAtual
                        ? `${tracoAtual.nome} (Manual)`
                        : "Dosagem Manual"
                      : tracoAtual?.nome || "Não selecionado"}
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
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Motorista:
                  </span>
                  <span className="font-semibold">
                    {motoristaNome || "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Placa Betoneira:
                  </span>
                  <span className="font-semibold font-mono">
                    {veiculoPlaca || "Não informada"}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">
                    Destino / Cidade:
                  </span>
                  <span className="font-semibold">
                    {cidadeNome || "Não informado"}
                  </span>
                </div>
              </div>

              {/* Totais de Insumos */}
              <div className="p-3 space-y-1.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  Consumos Totais da Carga:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                    <span className="text-muted-foreground">Cimento (CP):</span>
                    <span className="font-bold text-primary">
                      {consumoReal.cimento.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                    <span className="text-muted-foreground">Aditivo:</span>
                    <span className="font-bold text-primary">
                      {consumoReal.aditivo.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                    <span className="text-muted-foreground">Água:</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {consumoReal.agua.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                    <span className="text-muted-foreground">Areia:</span>
                    <span className="font-semibold">
                      {consumoReal.areia.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                    <span className="text-muted-foreground">Brita 12:</span>
                    <span className="font-semibold">
                      {consumoReal.brita12.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/20 sm:border-0">
                    <span className="text-muted-foreground">Brita 19:</span>
                    <span className="font-semibold">
                      {consumoReal.brita19.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Pó de Pedra:</span>
                    <span className="font-semibold">
                      {consumoReal.poPedra.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!cargaZerada && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300">
                ℹ️ Esta gravação registrará a carga e abaterá automaticamente do
                estoque as quantidades de <strong>Cimento</strong> (
                {consumoReal.cimento} kg) e <strong>Aditivo</strong> (
                {consumoReal.aditivo} L).
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
              Confira abaixo o resumo das alterações antes de gravar. O estoque
              de cimento e aditivo será estornado e recalculado com os novos
              consumos.
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
                        {Number(cargaOriginal.consumo_cimento).toLocaleString(
                          "pt-BR",
                        )}{" "}
                        kg
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-primary">
                        {Number(consumoReal.cimento).toLocaleString("pt-BR")} kg
                      </td>
                    </tr>
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
                        {Number(cargaOriginal.consumo_aditivo).toLocaleString(
                          "pt-BR",
                        )}{" "}
                        L
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-primary">
                        {Number(consumoReal.aditivo).toLocaleString("pt-BR")} L
                      </td>
                    </tr>
                    <tr
                      className={
                        Number(cargaOriginal.consumo_agua || 0) !==
                        Number(consumoReal.agua)
                          ? "bg-amber-500/10"
                          : ""
                      }
                    >
                      <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                        Água (L)
                      </td>
                      <td className="py-1.5 px-3 font-mono">
                        {Number(cargaOriginal.consumo_agua || 0).toLocaleString(
                          "pt-BR",
                        )}{" "}
                        L
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {Number(consumoReal.agua).toLocaleString("pt-BR")} L
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
                        {Number(consumoReal.areia).toLocaleString("pt-BR")} kg
                      </td>
                    </tr>
                    <tr
                      className={
                        Number(cargaOriginal.consumo_brita12) !==
                          Number(consumoReal.brita12) ||
                        Number(cargaOriginal.consumo_brita19) !==
                          Number(consumoReal.brita19)
                          ? "bg-amber-500/10"
                          : ""
                      }
                    >
                      <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                        Britas 12 / 19
                      </td>
                      <td className="py-1.5 px-3 font-mono">
                        {Number(cargaOriginal.consumo_brita12)} /{" "}
                        {Number(cargaOriginal.consumo_brita19)} kg
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold">
                        {Number(consumoReal.brita12)} /{" "}
                        {Number(consumoReal.brita19)} kg
                      </td>
                    </tr>
                    <tr
                      className={
                        cargaOriginal.motorista_nome !== motoristaNome
                          ? "bg-amber-500/10"
                          : ""
                      }
                    >
                      <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                        Motorista
                      </td>
                      <td className="py-1.5 px-3">
                        {cargaOriginal.motorista_nome || "—"}
                      </td>
                      <td className="py-1.5 px-3 font-bold">
                        {motoristaNome || "—"}
                      </td>
                    </tr>
                    <tr
                      className={
                        cargaOriginal.veiculo_placa !== veiculoPlaca
                          ? "bg-amber-500/10"
                          : ""
                      }
                    >
                      <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                        Placa Veículo
                      </td>
                      <td className="py-1.5 px-3 font-mono">
                        {cargaOriginal.veiculo_placa || "—"}
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold">
                        {veiculoPlaca || "—"}
                      </td>
                    </tr>
                    <tr
                      className={
                        cargaOriginal.cidade_nome !== cidadeNome
                          ? "bg-amber-500/10"
                          : ""
                      }
                    >
                      <td className="py-1.5 px-3 font-semibold text-muted-foreground">
                        Cidade / Destino
                      </td>
                      <td className="py-1.5 px-3">
                        {cargaOriginal.cidade_nome || "—"}
                      </td>
                      <td className="py-1.5 px-3 font-bold">
                        {cidadeNome || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                ⚠️ <strong>Atenção:</strong> Ao confirmar, o sistema
                cancelará/estornará as baixas de estoque de cimento (
                {cargaOriginal.consumo_cimento} kg) e aditivo (
                {cargaOriginal.consumo_aditivo} L) gravadas anteriormente para
                esta carga e lançará as novas movimentações (
                {consumoReal.cimento} kg de cimento e {consumoReal.aditivo} L de
                aditivo).
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
              {salvando ? "Salvando Alteração..." : "Sim, Confirmar e Salvar"}
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
              const ultimoDiaAtual = new Date(anoAtual, mesAtual, 0).getDate()
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
                filtroDataInicio === iniMesAnt && filtroDataFim === fimMesAnt
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
                      isMesAtual ? "" : "hover:bg-primary/10 hover:text-primary"
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
                      isMesAnt ? "" : "hover:bg-primary/10 hover:text-primary"
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
                      isAnual ? "" : "hover:bg-primary/10 hover:text-primary"
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
                  <th className="py-3 px-3 w-16"># Carga</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Traço</th>
                  <th className="py-3 px-3 text-right">Volume</th>
                  <th className="py-3 px-3 text-right">Cimento (kg)</th>
                  <th className="py-3 px-3 text-right">Aditivo (L)</th>
                  <th className="py-3 px-3">Motorista / Betoneira</th>
                  <th className="py-3 px-3">Destino / Cidade</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {carregandoCargasLista ? (
                  <tr>
                    <td
                      colSpan={10}
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
                      colSpan={10}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Truck className="w-6 h-6 text-muted-foreground/40" />
                        <span className="font-medium text-foreground">
                          Nenhuma carga encontrada para os filtros selecionados
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
                    const dosagemCarga = vol > 0 ? Math.round(cim / vol) : 0
                    const isZerada = Boolean(carga.carga_zerada)

                    return (
                      <tr
                        key={carga.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Número da Carga */}
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                          #{String(carga.numero_carga).padStart(4, "0")}
                        </td>

                        {/* Data */}
                        <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                          {carga.data.split("-").reverse().join("/")}
                        </td>

                        {/* Traço */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-foreground">
                            {obterDescricaoCompletaCarga(carga, tracos)}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {vol.toFixed(1)} m³
                        </td>

                        {/* Cimento */}
                        <td className="py-2.5 px-3 text-right font-mono text-primary font-semibold whitespace-nowrap">
                          {cim.toLocaleString("pt-BR")}
                        </td>

                        {/* Aditivo */}
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {Number(carga.consumo_aditivo || 0).toLocaleString(
                            "pt-BR",
                          )}
                        </td>

                        {/* Motorista / Betoneira */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-foreground">
                            {carga.motorista_nome || "—"}
                          </div>
                          {carga.veiculo_placa && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {carga.veiculo_placa}
                            </div>
                          )}
                        </td>

                        {/* Destino / Cidade */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-medium text-foreground">
                            {carga.cidade_nome || "—"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isZerada ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] font-bold py-0.5"
                            >
                              {carga.observacao?.includes("[PERDA OPERACIONAL]")
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
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg"
                                title="Editar esta carga"
                              >
                                <Link to={`/lancamentos?editar=${carga.id}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Link>
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
