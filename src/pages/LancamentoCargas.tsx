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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Sparkles,
  RotateCcw,
  FileSpreadsheet,
  MapPin,
  User,
  Layers,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
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

  // Modo de dosagem: 'automatico' (por traço) ou 'manual' (digitação dos insumos).
  // Se o operador for Balanceiro, inicia diretamente em 'manual' com campos liberados para digitação.
  const [modoDosagem, setModoDosagem] = useState<"automatico" | "manual">(() =>
    isBalanceiro ? "manual" : "automatico",
  )

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

  useEffect(() => {
    async function init() {
      if (!empresaAtiva) return
      try {
        const [tr, mot, veic, cid, mats] = await Promise.all([
          ConcreteiraService.getTracos(empresaAtiva.id),
          ConcreteiraService.getMotoristas(empresaAtiva.id),
          ConcreteiraService.getVeiculos(empresaAtiva.id),
          ConcreteiraService.getCidades(empresaAtiva.id),
          ConcreteiraService.getMateriais(empresaAtiva.id),
        ])
        setTracos(tr)
        setMotoristas(mot)
        setVeiculos(veic)
        setCidades(cid)
        setMateriais(mats)

        if (tr.length > 0) {
          setTracoSelecionadoId(tr[0].id)
          // Se for balanceiro, garante modo manual e zera insumos
          if (isBalanceiro && !editarCargaId) {
            setModoDosagem("manual")
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
        setModoDosagem("manual")

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

  // Quando o perfil for Balanceiro, inicia por padrão no modo manual
  // O operador pode alternar livremente para "traço automático" se desejar dosagem pré-preenchida
  useEffect(() => {
    if (isBalanceiro) {
      // Inicia em modo manual se os campos estiverem todos zerados
      // mas não aprisiona o usuário: ele pode clicar em "Traço automático"
    }
  }, [isBalanceiro])

  // Sincronizar dosagens do traço quando no modo automático ou recalcular aditivo no modo manual
  useEffect(() => {
    if (cargaZerada) {
      return
    }

    if (modoDosagem === "automatico") {
      // No modo automático, preenche dosagens com o traço
      const traco = tracos.find((t) => t.id === tracoSelecionadoId)
      if (traco) {
        const cimentoDosagem = Number(traco.consumo_cimento) || 0
        setBrita12(Number(traco.consumo_brita12) || 0)
        setBrita19(Number(traco.consumo_brita19) || 0)
        setAreia(Number(traco.consumo_areia) || 0)
        setPoPedra(Number(traco.consumo_po_pedra) || 0)
        setCimento(cimentoDosagem)

        const cimentoTotal = cimentoDosagem * volume
        // No modo automático, o aditivo também é liderado pela fórmula do fator sobre o cimento total da carga:
        // aditivo = cimento total × fator (ou valor digitado se o usuário sobrescrever)
        const adtBruto = cimentoTotal * (fatorAditivoManual || 0)
        setAditivoBruto(adtBruto)
        if (!aditivoEditadoManualmente) {
          setAditivo(Math.round(adtBruto))
        }

        // Água do traço automático (calculada via fator água ou digitada)
        const agBruta = cimentoTotal * (fatorAguaManual || 0.55)
        setAguaBruta(agBruta)
        if (!aguaEditadaManualmente) {
          setAgua(Math.round(agBruta))
        }
      }
    } else {
      // Modo manual:
      // Para o Balanceiro (ou modo manual em geral): o cimento digitado alimenta as fórmulas de aditivo e água.
      // Se cimento > 0 e não editado manualmente, calcula aditivo e água.
      // Se cimento === 0, aditivo e água calculados ficam 0.
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

  // Tratar alternância de modo
  const handleTrocaModo = (novoModo: "automatico" | "manual") => {
    setModoDosagem(novoModo)
    setAditivoEditadoManualmente(false)
    setAguaEditadaManualmente(false)
    if (!cargaZerada) {
      // Determinar um fator sugerido coerente com o traço atual se existir:
      // aditivo_por_m3 = consumo_cimento * fator  =>  fator = aditivo_por_m3 / consumo_cimento
      const traco = tracos.find((t) => t.id === tracoSelecionadoId)
      if (
        traco &&
        Number(traco.consumo_cimento) > 0 &&
        Number(traco.consumo_aditivo) > 0
      ) {
        const fatorSugerido =
          Number(traco.consumo_aditivo) / Number(traco.consumo_cimento)
        if (fatorSugerido >= 0.001 && fatorSugerido <= 0.05) {
          setFatorAditivoManual(Number(fatorSugerido.toFixed(4)))
        }
      }
      aplicarDosagemTraco(tracoSelecionadoId, volume)
    }
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

  const validarFormulario = (): boolean => {
    if (!dataCarga) {
      toast({
        title: "Atenção",
        description: "Informe a data da carga",
        variant: "destructive",
      })
      return false
    }
    if (volume <= 0) {
      toast({
        title: "Atenção",
        description: "O volume deve ser maior que zero",
        variant: "destructive",
      })
      return false
    }

    if (modoDosagem === "manual" && !cargaZerada) {
      const somaDosagens =
        brita12 + brita19 + areia + poPedra + cimento + aditivo
      if (somaDosagens <= 0) {
        toast({
          title: "Insumos não informados",
          description:
            "No modo manual, informe a dosagem (kg/m³) de pelo menos um dos insumos ou marque a carga como cancelada/zerada.",
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const executarSalvarEdicao = async () => {
    if (!editarCargaId) return
    const traco = tracos.find((t) => t.id === tracoSelecionadoId)
    let nomeTracoGravado = traco?.nome || "Traço manual"
    if (modoDosagem === "manual") {
      nomeTracoGravado = traco ? `${traco.nome} (Manual)` : "Dosagem Manual"
    }

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
      })

      setModalConfirmarEdicaoAberta(false)

      toast({
        title: "Carga alterada com sucesso!",
        description:
          "Movimentações de estoque recalculadas e integridade do saldo mantida.",
      })

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

  const executarCriarCarga = async () => {
    const traco = tracos.find((t) => t.id === tracoSelecionadoId)

    // Nome descritivo do traço gravado na carga
    let nomeTracoGravado = traco?.nome || "Traço manual"
    if (modoDosagem === "manual") {
      nomeTracoGravado = traco ? `${traco.nome} (Manual)` : "Dosagem Manual"
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
          ? modoDosagem === "manual"
            ? `[Modo Manual | Aditivo: ${consumoReal.aditivo}L${
                aditivoEditadoManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAditivoManual})`
              } | Água: ${consumoReal.agua}L${
                aguaEditadaManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAguaManual})`
              }] ${observacao}`
            : `[Traço automático | Aditivo: ${consumoReal.aditivo}L${
                aditivoEditadoManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAditivoManual})`
              } | Água: ${consumoReal.agua}L${
                aguaEditadaManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAguaManual})`
              }] ${observacao}`
          : modoDosagem === "manual"
            ? `[Lançamento manual | Aditivo: ${consumoReal.aditivo}L${
                aditivoEditadoManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAditivoManual})`
              } | Água: ${consumoReal.agua}L${
                aguaEditadaManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAguaManual})`
              }]`
            : `[Traço automático | Aditivo: ${consumoReal.aditivo}L${
                aditivoEditadoManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAditivoManual})`
              } | Água: ${consumoReal.agua}L${
                aguaEditadaManualmente
                  ? " (manual)"
                  : ` (fator ${fatorAguaManual})`
              }]`,
        carga_zerada: cargaZerada,
      })

      setModalConfirmarGravacaoAberta(false)

      toast({
        title: "Carga lançada com sucesso!",
        description: cargaZerada
          ? "Carga cancelada registrada sem baixa de materiais."
          : "Baixa de estoque nos materiais controlados (Cimento e Aditivo) realizada com sucesso.",
      })

      navigate(isBalanceiro ? "/lancamentos" : "/")
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

    // Se estiver em modo de edição, abre o modal de confirmação com resumo das alterações
    if (editarCargaId) {
      setModalConfirmarEdicaoAberta(true)
      return
    }

    // Gravação nova: abre o modal de confirmação com resumo
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Topo / Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            <Link to={isBalanceiro ? "/lancamentos" : "/"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
              {editarCargaId ? (
                <>
                  <span>
                    Editar Carga #
                    {cargaOriginal
                      ? String(cargaOriginal.numero_carga).padStart(4, "0")
                      : ""}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 bg-amber-500/10 text-amber-500 text-xs font-semibold uppercase"
                  >
                    Modo Edição
                  </Badge>
                </>
              ) : (
                <span>Lançamento Rápido de Carga</span>
              )}
              {empresaAtiva && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {empresaAtiva.nome}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {editarCargaId
                ? "Ajuste os dados e confirme a regravação com recálculo automático de estoque."
                : "Entrada rápida para balanceiro: preencha os dados da viagem e a pesagem dos insumos."}
            </p>
          </div>
        </div>

        {!isBalanceiro && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold shadow-sm border-border/60 hover:bg-muted/40 self-start sm:self-auto"
            title="Ir para tela de cadastros e importação de planilha de controle diário"
          >
            <Link to="/cadastros">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Importar Planilha CSV
            </Link>
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Data da Carga */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="data"
                  className="text-xs font-semibold text-foreground"
                >
                  Data de Expedição *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={dataCarga}
                  onChange={(e) => setDataCarga(e.target.value)}
                  required
                  className="h-10 text-sm bg-background font-mono"
                />
              </div>

              {/* Volume m³ em destaque */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="volume"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Volume da Carga *</span>
                  <span className="text-[11px] text-primary font-mono font-bold">
                    m³
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="volume"
                    type="number"
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
                    className="h-10 text-base font-bold font-mono text-primary bg-background pr-9 text-left"
                    placeholder="8.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    m³
                  </span>
                </div>
              </div>

              {/* Traço / Dosagem */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="traco"
                  className="text-xs font-semibold text-foreground"
                >
                  {modoDosagem === "manual"
                    ? "Traço de Referência"
                    : "Traço / Dosagem *"}
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
                    className="h-10 text-xs sm:text-sm bg-background"
                  >
                    <SelectValue placeholder="Selecione o traço" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracos.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        className="text-xs sm:text-sm"
                      >
                        {t.nome} {t.fck_mpa ? `(${t.fck_mpa} MPa)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Motorista */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="motorista"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  Motorista
                </Label>
                <div className="relative">
                  <Input
                    id="motorista"
                    list="lista-motoristas"
                    value={motoristaNome}
                    onChange={(e) => setMotoristaNome(e.target.value)}
                    placeholder="Nome do motorista..."
                    className="h-10 text-xs sm:text-sm bg-background"
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
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  Placa Betoneira
                </Label>
                <Select value={veiculoPlaca} onValueChange={setVeiculoPlaca}>
                  <SelectTrigger
                    id="veiculo"
                    className="h-10 text-xs sm:text-sm bg-background font-mono"
                  >
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={v.placa}
                        className="text-xs sm:text-sm font-mono"
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
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Destino / Cidade
                </Label>
                <div className="relative">
                  <Input
                    id="cidade"
                    list="lista-cidades"
                    value={cidadeNome}
                    onChange={(e) => setCidadeNome(e.target.value)}
                    placeholder="Cidade ou obra de destino..."
                    className="h-10 text-xs sm:text-sm bg-background"
                  />
                  <datalist id="lista-cidades">
                    {cidades.map((c) => (
                      <option key={c.id} value={c.nome} />
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
                  className="h-9 text-xs bg-background"
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
                  {modoDosagem === "automatico"
                    ? `Dosagem base do traço multiplicada pelo volume (${volume} m³). Aditivo liderado por fator sobre cimento total (com seletor e edição manual). Baixa de estoque apenas para ${materiais.find((m) => m.codigo === "cimento")?.nome || "CP II F-40 / CP V ARI"} e Aditivo.`
                    : `Modo manual ativo: informe a dosagem de cada insumo em kg/m³. O consumo gravado é multiplicado automaticamente pelo volume (${volume} m³).`}
                </CardDescription>
              </div>

              {/* Seletor de Modo: Traço automático vs Insumos manuais */}
              <div className="flex items-center gap-2">
                <Tabs
                  value={modoDosagem}
                  onValueChange={(val) =>
                    handleTrocaModo(val as "automatico" | "manual")
                  }
                  className="w-auto"
                >
                  <TabsList className="h-9 p-1 bg-muted/60">
                    <TabsTrigger
                      value="automatico"
                      className="text-xs px-3 py-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary font-medium"
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
                {isBalanceiro && (
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex h-8 px-2 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                    title="No perfil Balanceiro, o modo manual mantém os campos em branco para digitação"
                  >
                    Balanceiro
                  </Badge>
                )}
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
                    {modoDosagem === "manual"
                      ? "Multiplicador aplicado às dosagens (kg/m³) para obter o consumo total real de cimento, agregados, aditivo e água"
                      : "Volume em metros cúbicos multiplicado pelos insumos do traço e cimento total para cálculo do aditivo/água"}
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
                    value={volume || ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
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

            {/* Grid dos Insumos (Cimento, Aditivo, ÁGUA, Areia, Brita 12, Brita 19, Pó de Pedra) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cimento */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
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
                    {modoDosagem === "manual"
                      ? `${materiais.find((m) => m.codigo === "cimento")?.nome || "CP II F-40 / CP V ARI"} (kg/m³)`
                      : `${materiais.find((m) => m.codigo === "cimento")?.nome || "CP II F-40 / CP V ARI"} (kg)`}
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-normal shrink-0">
                      Estoque
                    </span>
                  </span>
                  {tracoAtual && modoDosagem === "automatico" && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_cimento} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === "manual" && (
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
                      cimento === 0 && modoDosagem === "manual" ? "" : cimento
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setCimento(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-9"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                  modoDosagem === "manual"
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                    : "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
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
                  {tracoAtual && (
                    <span className="text-[10px] text-muted-foreground">
                      Traço:{" "}
                      {(Number(tracoAtual.consumo_aditivo) * volume).toFixed(2)}{" "}
                      L ({tracoAtual.consumo_aditivo} L/m³)
                    </span>
                  )}
                </Label>

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
                        aditivoEditadoManualmente ? "secondary" : "outline"
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
                        className="h-8 text-xs font-mono font-medium flex-1 px-2 bg-background border-border/70 shadow-sm"
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
                            className="font-mono text-xs cursor-pointer"
                          >
                            Fator {op.rotulo}
                          </SelectItem>
                        ))}
                        {!OPCOES_FATOR_ADITIVO.some(
                          (o) => o.valor === fatorAditivoManual,
                        ) && (
                          <SelectItem
                            value="custom"
                            className="font-mono text-xs cursor-pointer"
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
                      className="h-8 w-20 text-xs font-mono font-medium text-center px-1 bg-background border-border/70"
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
                        ? "Valor manual digitado pelo operador (clique em ↺ para restaurar a fórmula)"
                        : "Arredondamento inteiro: ≥ 0,5 sobe | Campo aberto para digitação"}
                    </div>
                  </div>
                </div>
              </div>

              {/* NOVO: ÁGUA (Calculada com opção de digitação manual) */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
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
                      variant={aguaEditadaManualmente ? "secondary" : "outline"}
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
                        className="h-8 text-xs font-mono font-medium flex-1 px-2 bg-background border-border/70 shadow-sm"
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
                            className="font-mono text-xs cursor-pointer"
                          >
                            Fator {op.rotulo}
                          </SelectItem>
                        ))}
                        {!OPCOES_FATOR_AGUA.some(
                          (o) => o.valor === fatorAguaManual,
                        ) && (
                          <SelectItem
                            value="custom"
                            className="font-mono text-xs cursor-pointer"
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
                      className="h-8 w-20 text-xs font-mono font-medium text-center px-1 bg-background border-border/70"
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
                        ? "Valor manual digitado pelo operador (clique em ↺ para restaurar a fórmula | Sem controle de estoque)"
                        : "(Arredondamento inteiro: ≥ 0,5 sobe | Sem controle de estoque | Aberto para digitação)"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Areia */}
              <div
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
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
                    {modoDosagem === "manual" ? "Areia (kg/m³)" : "Areia (kg)"}
                  </span>
                  {tracoAtual && modoDosagem === "automatico" && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_areia} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === "manual" && (
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
                    value={areia === 0 && modoDosagem === "manual" ? "" : areia}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setAreia(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-9"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
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
                    {modoDosagem === "manual"
                      ? "Brita 12 (kg/m³)"
                      : "Brita 12 (kg)"}
                  </span>
                  {tracoAtual && modoDosagem === "automatico" && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita12} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === "manual" && (
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
                      brita12 === 0 && modoDosagem === "manual" ? "" : brita12
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setBrita12(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-9"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
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
                    {modoDosagem === "manual"
                      ? "Brita 19 (kg/m³)"
                      : "Brita 19 (kg)"}
                  </span>
                  {tracoAtual && modoDosagem === "automatico" && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_brita19} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === "manual" && (
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
                      brita19 === 0 && modoDosagem === "manual" ? "" : brita19
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setBrita19(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-9"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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
                className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
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
                    {modoDosagem === "manual"
                      ? "Pó de Pedra (kg/m³)"
                      : "Pó de Pedra (kg)"}
                  </span>
                  {tracoAtual && modoDosagem === "automatico" && (
                    <span className="text-[10px]">
                      ({tracoAtual.consumo_po_pedra} kg/m³)
                    </span>
                  )}
                  {tracoAtual && modoDosagem === "manual" && (
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
                      poPedra === 0 && modoDosagem === "manual" ? "" : poPedra
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : Number(e.target.value)
                      setPoPedra(isNaN(val) ? 0 : val)
                    }}
                    disabled={cargaZerada}
                    className={`font-mono font-semibold ${
                      modoDosagem === "manual"
                        ? "bg-background border-primary/40 focus-visible:ring-primary pr-14"
                        : "pr-9"
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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

            {/* Resumo Dinâmico e Clean de Insumos e Agregados Totais da Carga */}
            <div className="mt-4 pt-4 border-t border-border/40 bg-muted/20 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Resumo de Insumos e Agregados da Carga ({volume || 0} m³)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {modoDosagem === "manual"
                    ? "Cálculo: Dosagem × Volume"
                    : "Cálculo: Traço Selecionado × Volume"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {/* Cimento */}
                <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Cimento
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-primary block leading-tight">
                      {consumoReal.cimento.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Aditivo */}
                <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Aditivo
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-primary block leading-tight">
                      {consumoReal.aditivo.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      L
                    </span>
                  </div>
                </div>

                {/* Água */}
                <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Água
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400 block leading-tight">
                      {consumoReal.agua.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      L
                    </span>
                  </div>
                </div>

                {/* Areia */}
                <div className="p-2.5 rounded-lg border border-border/50 bg-background flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Areia
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.areia.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Brita 12 */}
                <div className="p-2.5 rounded-lg border border-border/50 bg-background flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Brita 12
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.brita12.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Brita 19 */}
                <div className="p-2.5 rounded-lg border border-border/50 bg-background flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Brita 19
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-foreground block leading-tight">
                      {consumoReal.brita19.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      kg
                    </span>
                  </div>
                </div>

                {/* Pó de Pedra */}
                <div className="p-2.5 rounded-lg border border-border/50 bg-background flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Pó de Pedra
                  </span>
                  <div className="mt-1">
                    <span className="text-sm font-bold font-mono text-foreground block leading-tight">
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

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full sm:w-auto"
          >
            <Link to={isBalanceiro ? "/lancamentos" : "/"}>Cancelar</Link>
          </Button>

          {/* Botão de Gravação / Alteração */}
          {editarCargaId ? (
            <Button
              type="submit"
              variant="default"
              disabled={salvando || carregandoCargaEdicao}
              className="w-full sm:w-auto gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md px-6"
            >
              {salvando ? (
                "Salvando alteração..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Alteração da Carga
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              variant="default"
              disabled={salvando}
              className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground font-semibold shadow-md px-6 hover:brightness-105"
            >
              {salvando ? (
                "Salvando..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Gravar Lançamento da Carga
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Modal de Confirmação com Resumo Antes de Gravar Novo Lançamento */}
      <AlertDialog
        open={modalConfirmarGravacaoAberta}
        onOpenChange={setModalConfirmarGravacaoAberta}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Confirmar Gravação do Lançamento de Carga
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Confira os dados e os consumos calculados antes de confirmar o
              lançamento e a baixa automática no estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border/50 overflow-hidden bg-background divide-y divide-border/20">
              <div className="p-2.5 bg-muted/30 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Data da Carga:
                  </span>
                  <span className="font-semibold font-mono">
                    {dataCarga.split("-").reverse().join("/")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Volume:
                  </span>
                  <span className="font-bold font-mono text-primary">
                    {Number(volume).toFixed(1)} m³
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Traço / Dosagem:
                  </span>
                  <span className="font-semibold">
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
                      <span className="text-amber-600">Zerada / Cancelada</span>
                    ) : (
                      <span className="text-emerald-600">Carga Normal</span>
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
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">
                    Destino / Cidade:
                  </span>
                  <span className="font-semibold">
                    {cidadeNome || "Não informado"}
                  </span>
                </div>
              </div>

              {/* Totais de Insumos */}
              <div className="p-2.5 space-y-1.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Consumos Totais da Carga (kg / L):
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cimento:</span>
                    <span className="font-bold text-primary">
                      {consumoReal.cimento.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aditivo:</span>
                    <span className="font-bold text-primary">
                      {consumoReal.aditivo.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Água:</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {consumoReal.agua.toLocaleString("pt-BR")} L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Areia:</span>
                    <span className="font-semibold">
                      {consumoReal.areia.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brita 12:</span>
                    <span className="font-semibold">
                      {consumoReal.brita12.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brita 19:</span>
                    <span className="font-semibold">
                      {consumoReal.brita19.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pó de Pedra:</span>
                    <span className="font-semibold">
                      {consumoReal.poPedra.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!cargaZerada && (
              <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300">
                ℹ️ Esta gravação registrará a carga e abaterá automaticamente do
                estoque as quantidades de <strong>Cimento</strong> (
                {consumoReal.cimento} kg) e <strong>Aditivo</strong> (
                {consumoReal.aditivo} L).
              </div>
            )}
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={salvando}>
              Voltar e Revisar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
              onClick={executarCriarCarga}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {salvando ? "Gravando..." : "Sim, Gravar Lançamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação com Resumo do que Muda na Edição */}
      <Dialog
        open={modalConfirmarEdicaoAberta}
        onOpenChange={setModalConfirmarEdicaoAberta}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-amber-500 font-bold">
              <CheckCircle2 className="w-5 h-5 text-amber-500" />
              Confirmar alteração do lançamento #
              {cargaOriginal
                ? String(cargaOriginal.numero_carga).padStart(4, "0")
                : ""}
              ?
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={salvando}
              onClick={() => setModalConfirmarEdicaoAberta(false)}
            >
              Voltar e Revisar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={salvando}
              onClick={executarSalvarEdicao}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {salvando ? "Salvando..." : "Sim, Confirmar e Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
