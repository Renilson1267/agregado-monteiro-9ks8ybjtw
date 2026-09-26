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
import { useUsuario } from '@/hooks/use-usuario'
import type {
  Traco,
  Motorista,
  Veiculo,
  Cidade,
  PrecoMaterial,
  Material,
  Cliente,
  OrdemServico,
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
  FileText,
  Printer,
  UserPlus,
  Search,
  Building2,
  Clock,
  Gauge,
  KeyRound,
  Check,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ReciboImpressao } from '@/components/ReciboImpressao'
import { printElementInIsolatedIframe } from '@/lib/imprimir-recibo'
import {
  formatarCpfCnpj,
  formatarTelefone,
  formatarCep,
  limparMascara,
} from '@/lib/documentos'

export default function LancamentoCargas() {
  const navigate = useNavigate()
  const { empresaAtiva } = useEmpresa()
  const { isBalanceiro } = useUsuario()
  const [tracos, setTracos] = useState<Traco[]>([])
  const [precos, setPrecos] = useState<PrecoMaterial[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [salvando, setSalvando] = useState(false)

  // Modo de dosagem: 'automatico' (por traço) ou 'manual' (digitação dos insumos).
  // Se o operador for Balanceiro, inicia diretamente em 'manual' com campos liberados para digitação.
  const [modoDosagem, setModoDosagem] = useState<'automatico' | 'manual'>(() =>
    isBalanceiro ? 'manual' : 'automatico',
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

  // Form states - Bloco de Entrega / Ordem de Serviço
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('')
  const [buscaCliente, setBuscaCliente] = useState<string>('')
  const [clienteDropdownAberto, setClienteDropdownAberto] =
    useState<boolean>(false)

  const [destinatarioNome, setDestinatarioNome] = useState<string>('')
  const [destinatarioCpfCnpj, setDestinatarioCpfCnpj] = useState<string>('')
  const [destinatarioTelefone, setDestinatarioTelefone] = useState<string>('')
  const [destinatarioEndereco, setDestinatarioEndereco] = useState<string>('')
  const [destinatarioBairro, setDestinatarioBairro] = useState<string>('')
  const [destinatarioCidade, setDestinatarioCidade] = useState<string>('')
  const [destinatarioUf, setDestinatarioUf] = useState<string>('PB')
  const [destinatarioCep, setDestinatarioCep] = useState<string>('')

  const [nomeObra, setNomeObra] = useState<string>('')
  const [localDescarga, setLocalDescarga] = useState<string>('')
  const [discriminacaoProduto, setDiscriminacaoProduto] = useState<string>('')
  const [slumpCentralMedido, setSlumpCentralMedido] = useState<string>('')
  const [slumpCentralSaida, setSlumpCentralSaida] = useState<string>('')
  const [slumpTolerancia, setSlumpTolerancia] = useState<string>('+-2')
  const [lacre, setLacre] = useState<string>('')
  const [kmInicial, setKmInicial] = useState<string>('')
  const [kmFinal, setKmFinal] = useState<string>('')

  // Helper para somar minutos a um horário "HH:mm"
  const somarMinutosHora = (hora: string, minutos: number): string => {
    if (!hora || !hora.includes(':')) return ''
    const [h, m] = hora.split(':').map((v) => parseInt(v, 10))
    if (isNaN(h) || isNaN(m)) return ''
    const totalMinutos = (h * 60 + m + minutos) % (24 * 60)
    const totalPositivo = (totalMinutos + 24 * 60) % (24 * 60)
    const nh = Math.floor(totalPositivo / 60)
    const nm = totalPositivo % 60
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
  }

  // Horários: hora da carga inicializa com a hora atual, saída usina com +30 min
  const [horaCarga, setHoraCarga] = useState<string>(() =>
    new Date().toTimeString().slice(0, 5),
  )
  const [horaSaidaCentral, setHoraSaidaCentral] = useState<string>(() => {
    const agora = new Date()
    agora.setMinutes(agora.getMinutes() + 30)
    return agora.toTimeString().slice(0, 5)
  })
  const [saidaCentralEditadaManualmente, setSaidaCentralEditadaManualmente] =
    useState<boolean>(false)
  const [horaChegadaObra, setHoraChegadaObra] = useState<string>('')
  const [horaInicioDescarga, setHoraInicioDescarga] = useState<string>('')
  const [horaFimDescarga, setHoraFimDescarga] = useState<string>('')
  const [horaSaidaObra, setHoraSaidaObra] = useState<string>('')
  const [vistoObra, setVistoObra] = useState<string>('')
  const [observacoesEntrega, setObservacoesEntrega] = useState<string>('')

  // Interruptor de Insumos na OS (inicia com padrão do cliente, mas pode ser invertido)
  const [exibirInsumosNaOs, setExibirInsumosNaOs] = useState<boolean>(true)

  // Modal de Cadastro Rápido de Cliente sem perder dados
  const [modalNovoClienteAberto, setModalNovoClienteAberto] =
    useState<boolean>(false)
  const [novoClienteTipo, setNovoClienteTipo] = useState<'PF' | 'PJ'>('PJ')
  const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState<string>('')
  const [novoClienteNome, setNovoClienteNome] = useState<string>('')
  const [novoClienteNomeFantasia, setNovoClienteNomeFantasia] =
    useState<string>('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState<string>('')
  const [novoClienteCep, setNovoClienteCep] = useState<string>('')
  const [novoClienteLogradouro, setNovoClienteLogradouro] = useState<string>('')
  const [novoClienteNumero, setNovoClienteNumero] = useState<string>('')
  const [novoClienteBairro, setNovoClienteBairro] = useState<string>('')
  const [novoClienteCidade, setNovoClienteCidade] = useState<string>('')
  const [novoClienteUf, setNovoClienteUf] = useState<string>('PB')
  const [novoClienteExibirInsumos, setNovoClienteExibirInsumos] =
    useState<boolean>(true)
  const [salvandoClienteRapido, setSalvandoClienteRapido] =
    useState<boolean>(false)

  // Estado da OS gerada para impressão imediata
  const [osGeradaParaImpressao, setOsGeradaParaImpressao] =
    useState<OrdemServico | null>(null)
  const [modalImpressaoAberta, setModalImpressaoAberta] =
    useState<boolean>(false)

  useEffect(() => {
    async function init() {
      if (!empresaAtiva) return
      try {
        const [tr, mot, veic, cid, prc, mats, clis] = await Promise.all([
          ConcreteiraService.getTracos(empresaAtiva.id),
          ConcreteiraService.getMotoristas(empresaAtiva.id),
          ConcreteiraService.getVeiculos(empresaAtiva.id),
          ConcreteiraService.getCidades(empresaAtiva.id),
          ConcreteiraService.getPrecosMaterial(empresaAtiva.id),
          ConcreteiraService.getMateriais(empresaAtiva.id),
          ConcreteiraService.getClientes(empresaAtiva.id),
        ])
        setTracos(tr)
        setPrecos(prc)
        setMotoristas(mot)
        setVeiculos(veic)
        setCidades(cid)
        setMateriais(mats)
        setClientes(clis)

        if (tr.length > 0) {
          setTracoSelecionadoId(tr[0].id)
          // Se for balanceiro, garante modo manual e zera insumos
          if (isBalanceiro) {
            setModoDosagem('manual')
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
          setTracoSelecionadoId('')
        }
      } catch (err) {
        console.error('Erro ao carregar dados do formulário:', err)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Preenche dados quando um cliente é selecionado
  const selecionarCliente = (cli: Cliente) => {
    setClienteSelecionadoId(cli.id)
    setBuscaCliente(cli.nome)
    setDestinatarioNome(cli.nome)
    setDestinatarioCpfCnpj(cli.cpf_cnpj ? formatarCpfCnpj(cli.cpf_cnpj) : '')
    setDestinatarioTelefone(cli.telefone ? formatarTelefone(cli.telefone) : '')
    setDestinatarioEndereco(
      [cli.logradouro, cli.numero].filter(Boolean).join(', ') || '',
    )
    setDestinatarioBairro(cli.bairro || '')
    setDestinatarioCidade(cli.cidade || '')
    setDestinatarioUf(cli.uf || 'PB')
    setDestinatarioCep(cli.cep ? formatarCep(cli.cep) : '')
    if (cli.cidade && !cidadeNome) {
      setCidadeNome(cli.cidade)
    }
    // Inicializa o interruptor de insumos com o valor configurado no cadastro do cliente
    setExibirInsumosNaOs(cli.exibir_insumos_os !== false)
    setClienteDropdownAberto(false)
  }

  // Cadastro rápido de cliente
  const handleSalvarClienteRapido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoClienteNome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome ou razão social do cliente.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoClienteRapido(true)
    try {
      const novo = await ConcreteiraService.salvarCliente(
        {
          empresa_id: empresaAtiva?.id,
          tipo: novoClienteTipo,
          cpf_cnpj: limparMascara(novoClienteCpfCnpj),
          nome: novoClienteNome.trim(),
          nome_fantasia: novoClienteNomeFantasia.trim() || null,
          telefone: limparMascara(novoClienteTelefone) || null,
          cep: limparMascara(novoClienteCep) || null,
          logradouro: novoClienteLogradouro.trim() || null,
          numero: novoClienteNumero.trim() || null,
          bairro: novoClienteBairro.trim() || null,
          cidade: novoClienteCidade.trim() || null,
          uf: novoClienteUf.trim().toUpperCase() || 'PB',
          exibir_insumos_os: novoClienteExibirInsumos,
          ativo: true,
        },
        empresaAtiva?.id,
      )

      // Atualiza lista e já deixa selecionado na tela de lançamento sem perder nada
      setClientes((prev) => [novo, ...prev])
      selecionarCliente(novo)
      setModalNovoClienteAberto(false)

      toast({
        title: 'Cliente cadastrado com sucesso!',
        description: `${novo.nome} foi vinculado à tela de entrega.`,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao cadastrar cliente',
        description: err.message || 'Falha ao salvar cliente.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoClienteRapido(false)
    }
  }

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

      // Atualiza discriminação padrão se necessário
      if (
        !discriminacaoProduto ||
        discriminacaoProduto.startsWith('CONCRETO')
      ) {
        setDiscriminacaoProduto(
          `CONCRETO USINADO ${traco.nome}${traco.fck_mpa ? ` FCK ${traco.fck_mpa} MPA` : ''} - SLUMP 12+-2`,
        )
      }

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

  // Quando o perfil for Balanceiro, garante que o modo de operação é manual
  useEffect(() => {
    if (isBalanceiro) {
      setModoDosagem('manual')
    }
  }, [isBalanceiro])

  // Sincronizar dosagens do traço quando no modo automático ou recalcular aditivo no modo manual
  useEffect(() => {
    if (cargaZerada) {
      return
    }

    if (modoDosagem === 'automatico') {
      // No modo automático (apenas administradores usam), preenche com traço
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

  // Função "Salvar e gerar OS"
  const handleSalvarEGerarOS = async () => {
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

    if (modoDosagem === 'manual' && !cargaZerada) {
      const somaDosagens =
        brita12 + brita19 + areia + poPedra + cimento + aditivo
      if (somaDosagens <= 0) {
        toast({
          title: 'Insumos não informados',
          description:
            'No modo manual, informe a dosagem (kg/m³) de pelo menos um dos insumos ou marque a carga como cancelada.',
          variant: 'destructive',
        })
        return
      }
    }

    const traco = tracos.find((t) => t.id === tracoSelecionadoId)
    let nomeTracoGravado = traco?.nome || 'Traço manual'
    if (modoDosagem === 'manual') {
      nomeTracoGravado = traco ? `${traco.nome} (Manual)` : 'Dosagem Manual'
    }

    const descr =
      discriminacaoProduto.trim() ||
      `${nomeTracoGravado}${traco?.fck_mpa ? ` FCK ${traco.fck_mpa} MPA` : ''}${slumpCentralMedido ? ` - SLUMP ${slumpCentralMedido}` : ''}`

    setSalvando(true)
    try {
      const resultado = await ConcreteiraService.criarCargaComOS({
        carga: {
          empresa_id: empresaAtiva?.id,
          data: dataCarga,
          volume_m3: volume,
          traco_id: traco?.id,
          traco_nome: nomeTracoGravado,
          motorista_nome: motoristaNome || undefined,
          veiculo_placa: veiculoPlaca || undefined,
          cidade_nome: destinatarioCidade || cidadeNome || undefined,
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
        },
        entrega: {
          cliente_id: clienteSelecionadoId || null,
          destinatario_nome:
            destinatarioNome.trim() ||
            buscaCliente.trim() ||
            'CONSUMIDOR FINAL',
          destinatario_cpf_cnpj: destinatarioCpfCnpj.trim() || null,
          destinatario_telefone: destinatarioTelefone.trim() || null,
          destinatario_endereco: destinatarioEndereco.trim() || null,
          destinatario_bairro: destinatarioBairro.trim() || null,
          destinatario_cidade: destinatarioCidade.trim() || cidadeNome || null,
          destinatario_uf: destinatarioUf.trim().toUpperCase() || 'PB',
          destinatario_cep: destinatarioCep.trim() || null,
          nome_obra: nomeObra.trim() || null,
          local_descarga: localDescarga.trim() || null,
          discriminacao_produto: descr,
          slump_central_medido: slumpCentralMedido.trim() || null,
          slump_central_saida: slumpCentralSaida.trim() || null,
          slump_tolerancia: slumpTolerancia.trim() || '+-2',
          lacre: lacre.trim() || null,
          km_inicial: kmInicial ? Number(kmInicial) : null,
          km_final: kmFinal ? Number(kmFinal) : null,
          hora_carga: horaCarga || null,
          hora_saida_central: horaSaidaCentral || null,
          hora_chegada_obra: horaChegadaObra || null,
          hora_inicio_descarga: horaInicioDescarga || null,
          hora_fim_descarga: horaFimDescarga || null,
          hora_saida_obra: horaSaidaObra || null,
          visto_obra: vistoObra.trim() || null,
          visto_motorista_central: motoristaNome || null,
          observacoes: observacoesEntrega.trim() || observacao.trim() || null,
          exibir_insumos_os: exibirInsumosNaOs,
        },
      })

      toast({
        title: `OS Nº ${resultado.ordemServico.numero_os} gerada com sucesso!`,
        description: `Carga Nº ${resultado.carga.numero_carga} vinculada à OS. Preparando recibo para impressão...`,
      })

      // Abre modal de impressão com a OS recém-criada
      setOsGeradaParaImpressao(resultado.ordemServico)
      setModalImpressaoAberta(true)
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao salvar carga e gerar OS',
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
    ? {
        total: 0,
        custoPorM3: 0,
        cimento: 0,
        aditivo: 0,
        areia: 0,
        brita12: 0,
        brita19: 0,
        po_pedra: 0,
        agua: 0,
      }
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

        {!isBalanceiro && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold shadow-sm border-border/60 hover:bg-muted/40"
            title="Ir para tela de cadastros e importação de planilha de controle diário"
          >
            <Link to="/cadastros">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Importar CSV da Unidade
            </Link>
          </Button>
        )}
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
                    const traco = tracos.find((t) => t.id === val)
                    if (traco) {
                      // Atualiza a discriminação do produto na OS mesmo sem preencher os insumos
                      setDiscriminacaoProduto(
                        `CONCRETO USINADO ${traco.nome}${traco.fck_mpa ? ` FCK ${traco.fck_mpa} MPA` : ''} - SLUMP 12+-2`,
                      )
                    }

                    if (isBalanceiro) {
                      // REGRA BALANCEIRO:
                      // Seleciona o traço normalmente, PORÉM NÃO SOBE as quantidades dos insumos!
                      // Deixa todos os campos liberados para digitação manual, zerados/em branco
                      setModoDosagem('manual')
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
                      // Perfil Administrador ou padrão: pré-preenche com as dosagens do traço
                      if (modoDosagem === 'manual') {
                        aplicarDosagemTraco(val, volume)
                      }
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
                {isBalanceiro ? (
                  <Badge
                    variant="outline"
                    className="h-8 px-2.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modo Balanceiro: Digitação Manual Liberada
                  </Badge>
                ) : (
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
                )}
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

            {/* Box de Custo Estimado da Carga (Apenas para Administrador) */}
            {!isBalanceiro && (
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
                      {custoEstimado.aditivo > 0 && (
                        <span className="ml-1 text-emerald-700 dark:text-emerald-300 font-mono">
                          • Aditivo: R$ {custoEstimado.aditivo.toFixed(2)}
                        </span>
                      )}
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
            )}
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

        {/* Bloco 3: Cadastro de Entrega Unificado com a Ordem de Serviço (OS) */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Dados de Entrega & Ordem de Serviço (OS)
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Campos opcionais integrados para impressão do recibo da OS
                  (cura úmida, termo de água e canhoto). Você pode completar
                  agora ou depois.
                </CardDescription>
              </div>

              {/* Interruptor: Mostrar insumos na OS */}
              <div className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-muted/30">
                <div className="text-right">
                  <Label
                    htmlFor="toggleInsumosOS"
                    className="text-xs font-semibold cursor-pointer block"
                  >
                    Mostrar insumos na OS
                  </Label>
                  <span className="text-[10px] text-muted-foreground block">
                    {exibirInsumosNaOs
                      ? 'Exibindo quilos/litros'
                      : 'Oculto no recibo'}
                  </span>
                </div>
                <Switch
                  id="toggleInsumosOS"
                  checked={exibirInsumosNaOs}
                  onCheckedChange={setExibirInsumosNaOs}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* Seção 1: Busca de Cliente e Cadastro Rápido */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Cliente / Destinatário
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNovoClienteNome(buscaCliente || destinatarioNome)
                    setNovoClienteCpfCnpj(destinatarioCpfCnpj)
                    setNovoClienteTelefone(destinatarioTelefone)
                    setNovoClienteLogradouro(destinatarioEndereco)
                    setNovoClienteBairro(destinatarioBairro)
                    setNovoClienteCidade(destinatarioCidade || cidadeNome)
                    setNovoClienteCep(destinatarioCep)
                    setNovoClienteExibirInsumos(exibirInsumosNaOs)
                    setModalNovoClienteAberto(true)
                  }}
                  className="h-7 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Cadastrar cliente aqui
                </Button>
              </div>

              {/* Input com Autocomplete de Clientes */}
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Digite o nome, razão social ou CPF/CNPJ do cliente..."
                    value={buscaCliente}
                    onFocus={() => setClienteDropdownAberto(true)}
                    onChange={(e) => {
                      const val = e.target.value
                      setBuscaCliente(val)
                      setDestinatarioNome(val)
                      setClienteDropdownAberto(true)
                      if (!val.trim()) {
                        setClienteSelecionadoId('')
                      }
                    }}
                    className="pl-9 pr-24 text-sm font-medium"
                  />
                  {clienteSelecionadoId && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      >
                        <Check className="w-2.5 h-2.5 mr-0.5" /> Cadastrado
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setClienteSelecionadoId('')
                          setBuscaCliente('')
                          setDestinatarioNome('')
                          setDestinatarioCpfCnpj('')
                          setDestinatarioTelefone('')
                          setDestinatarioEndereco('')
                          setDestinatarioBairro('')
                          setDestinatarioCep('')
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>

                {/* Dropdown de sugestões de cliente */}
                {clienteDropdownAberto && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setClienteDropdownAberto(false)}
                    />
                    <div className="absolute z-20 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientes.filter((c) => {
                        if (!buscaCliente) return true
                        const term = buscaCliente.toLowerCase()
                        return (
                          c.nome?.toLowerCase().includes(term) ||
                          c.nome_fantasia?.toLowerCase().includes(term) ||
                          c.cpf_cnpj?.includes(term)
                        )
                      }).length > 0 ? (
                        clientes
                          .filter((c) => {
                            if (!buscaCliente) return true
                            const term = buscaCliente.toLowerCase()
                            return (
                              c.nome?.toLowerCase().includes(term) ||
                              c.nome_fantasia?.toLowerCase().includes(term) ||
                              c.cpf_cnpj?.includes(term)
                            )
                          })
                          .slice(0, 10)
                          .map((cli) => (
                            <button
                              type="button"
                              key={cli.id}
                              onClick={() => selecionarCliente(cli)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center justify-between border-b border-border/30 last:border-b-0"
                            >
                              <div>
                                <div className="font-semibold text-foreground">
                                  {cli.nome}
                                </div>
                                <div className="text-muted-foreground text-[11px] font-mono">
                                  {cli.cpf_cnpj
                                    ? formatarCpfCnpj(cli.cpf_cnpj)
                                    : 'Sem documento'}{' '}
                                  • {cli.cidade || 'Sem cidade'}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[10px] shrink-0"
                              >
                                {cli.exibir_insumos_os !== false
                                  ? 'Com insumos'
                                  : 'Sem insumos'}
                              </Badge>
                            </button>
                          ))
                      ) : (
                        <div className="p-3 text-xs text-center text-muted-foreground">
                          Nenhum cliente cadastrado com esse nome.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setClienteDropdownAberto(false)
                              setNovoClienteNome(buscaCliente)
                              setModalNovoClienteAberto(true)
                            }}
                            className="text-primary underline font-medium hover:text-primary/80 ml-1"
                          >
                            Cadastrar agora?
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Grid com Documento, Telefone, Endereço e Bairro */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <Label
                    htmlFor="destCpfCnpj"
                    className="text-xs text-muted-foreground"
                  >
                    CPF / CNPJ
                  </Label>
                  <Input
                    id="destCpfCnpj"
                    placeholder="000.000.000-00"
                    value={destinatarioCpfCnpj}
                    onChange={(e) => setDestinatarioCpfCnpj(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="destTelefone"
                    className="text-xs text-muted-foreground"
                  >
                    Telefone de Contato
                  </Label>
                  <Input
                    id="destTelefone"
                    placeholder="(83) 90000-0000"
                    value={destinatarioTelefone}
                    onChange={(e) => setDestinatarioTelefone(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label
                    htmlFor="destEndereco"
                    className="text-xs text-muted-foreground"
                  >
                    Endereço Completo
                  </Label>
                  <Input
                    id="destEndereco"
                    placeholder="Rua, número, complemento..."
                    value={destinatarioEndereco}
                    onChange={(e) => setDestinatarioEndereco(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="destBairro"
                    className="text-xs text-muted-foreground"
                  >
                    Bairro
                  </Label>
                  <Input
                    id="destBairro"
                    placeholder="Bairro"
                    value={destinatarioBairro}
                    onChange={(e) => setDestinatarioBairro(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="destCidade"
                    className="text-xs text-muted-foreground"
                  >
                    Cidade
                  </Label>
                  <Input
                    id="destCidade"
                    placeholder="Cidade"
                    value={destinatarioCidade}
                    onChange={(e) => {
                      setDestinatarioCidade(e.target.value)
                      if (!cidadeNome) setCidadeNome(e.target.value)
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="destUf"
                    className="text-xs text-muted-foreground"
                  >
                    UF
                  </Label>
                  <Input
                    id="destUf"
                    placeholder="PB"
                    maxLength={2}
                    value={destinatarioUf}
                    onChange={(e) =>
                      setDestinatarioUf(e.target.value.toUpperCase())
                    }
                    className="text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="destCep"
                    className="text-xs text-muted-foreground"
                  >
                    CEP
                  </Label>
                  <Input
                    id="destCep"
                    placeholder="00000-000"
                    value={destinatarioCep}
                    onChange={(e) => setDestinatarioCep(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Obra, Local de Descarga e Discriminação do Traço */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                2. Obra, Descarga & Discriminação do Concreto
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nomeObra" className="text-xs">
                    Nome da Obra
                  </Label>
                  <Input
                    id="nomeObra"
                    placeholder="Ex: Residencial Alphaville - Bloco B"
                    value={nomeObra}
                    onChange={(e) => setNomeObra(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="localDescarga" className="text-xs">
                    Local de Descarga
                  </Label>
                  <Input
                    id="localDescarga"
                    placeholder="Ex: Laje do 2º pavimento, vigas, fundação, piso..."
                    value={localDescarga}
                    onChange={(e) => setLocalDescarga(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discriminacao" className="text-xs">
                      Discriminação do Produto (Automática pelo traço
                      selecionado)
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const traco = tracos.find(
                          (t) => t.id === tracoSelecionadoId,
                        )
                        if (traco) {
                          setDiscriminacaoProduto(
                            `CONCRETO USINADO ${traco.nome}${traco.fck_mpa ? ` FCK ${traco.fck_mpa} MPA` : ''}${slumpCentralMedido ? ` - SLUMP ${slumpCentralMedido} ${slumpTolerancia || '+-2'}` : ''}`,
                          )
                        }
                      }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Restaurar automático
                    </button>
                  </div>
                  <Input
                    id="discriminacao"
                    placeholder="Descrição para a Ordem de Serviço..."
                    value={discriminacaoProduto}
                    onChange={(e) => setDiscriminacaoProduto(e.target.value)}
                    className="text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Slump Central, Tolerância e Transporte */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                3. Slump, Tolerância & Transporte (Betoneira)
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="slumpMedido" className="text-xs">
                    Slump Central
                  </Label>
                  <Input
                    id="slumpMedido"
                    value={slumpCentralMedido}
                    onChange={(e) => setSlumpCentralMedido(e.target.value)}
                    className="text-xs font-mono font-semibold"
                    placeholder="Em branco (motorista preenche)"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="slumpTol" className="text-xs">
                    Tolerância
                  </Label>
                  <Input
                    id="slumpTol"
                    value={slumpTolerancia}
                    onChange={(e) => setSlumpTolerancia(e.target.value)}
                    className="text-xs font-mono"
                    placeholder="+-2"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="motoristaEntrega" className="text-xs">
                    Motorista (Digitação livre ou seleção)
                  </Label>
                  <Input
                    id="motoristaEntrega"
                    list="lista-motoristas"
                    value={motoristaNome}
                    onChange={(e) => setMotoristaNome(e.target.value)}
                    placeholder="Nome do motorista (ou selecione da lista)"
                    className="text-xs"
                  />
                  <datalist id="lista-motoristas">
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.nome}>
                        {m.nome}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="veiculoEntrega" className="text-xs">
                    Placa do Caminhão
                  </Label>
                  <Select value={veiculoPlaca} onValueChange={setVeiculoPlaca}>
                    <SelectTrigger id="veiculoEntrega" className="text-xs">
                      <SelectValue placeholder="Selecione o caminhão" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem
                          key={v.id}
                          value={v.placa}
                          className="text-xs"
                        >
                          {v.placa} {v.modelo ? `- ${v.modelo}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label
                    htmlFor="lacre"
                    className="text-xs flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-muted-foreground" />
                    Nº do Lacre
                  </Label>
                  <Input
                    id="lacre"
                    placeholder="Lacre de segurança"
                    value={lacre}
                    onChange={(e) => setLacre(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="kmInicial" className="text-xs">
                    KM Saída
                  </Label>
                  <Input
                    id="kmInicial"
                    type="number"
                    placeholder="Ex: 125430"
                    value={kmInicial}
                    onChange={(e) => setKmInicial(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="kmFinal" className="text-xs">
                    KM Chegada
                  </Label>
                  <Input
                    id="kmFinal"
                    type="number"
                    placeholder="Ex: 125485"
                    value={kmFinal}
                    onChange={(e) => setKmFinal(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Seção 4: Horários e Visto */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                4. Horários & Assinatura
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="horaCarga"
                    className="text-xs text-muted-foreground"
                  >
                    Carregamento
                  </Label>
                  <Input
                    id="horaCarga"
                    type="time"
                    value={horaCarga}
                    onChange={(e) => {
                      const novaHora = e.target.value
                      setHoraCarga(novaHora)
                      if (!saidaCentralEditadaManualmente) {
                        setHoraSaidaCentral(somarMinutosHora(novaHora, 30))
                      }
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="horaSaidaCentral"
                      className="text-xs text-muted-foreground"
                    >
                      Saída Usina
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      {saidaCentralEditadaManualmente ? '(editado)' : '(+30m)'}
                    </span>
                  </div>
                  <Input
                    id="horaSaidaCentral"
                    type="time"
                    value={horaSaidaCentral}
                    onChange={(e) => {
                      setHoraSaidaCentral(e.target.value)
                      setSaidaCentralEditadaManualmente(true)
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="horaChegadaObra"
                    className="text-xs text-muted-foreground"
                  >
                    Chegada Obra
                  </Label>
                  <Input
                    id="horaChegadaObra"
                    type="time"
                    value={horaChegadaObra}
                    onChange={(e) => setHoraChegadaObra(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="horaInicioDescarga"
                    className="text-xs text-muted-foreground"
                  >
                    Início Descarga
                  </Label>
                  <Input
                    id="horaInicioDescarga"
                    type="time"
                    value={horaInicioDescarga}
                    onChange={(e) => setHoraInicioDescarga(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="horaFimDescarga"
                    className="text-xs text-muted-foreground"
                  >
                    Fim Descarga
                  </Label>
                  <Input
                    id="horaFimDescarga"
                    type="time"
                    value={horaFimDescarga}
                    onChange={(e) => setHoraFimDescarga(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="horaSaidaObra"
                    className="text-xs text-muted-foreground"
                  >
                    Saída Obra
                  </Label>
                  <Input
                    id="horaSaidaObra"
                    type="time"
                    value={horaSaidaObra}
                    onChange={(e) => setHoraSaidaObra(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <Label htmlFor="vistoObra" className="text-xs">
                    Visto / Recebedor na Obra
                  </Label>
                  <Input
                    id="vistoObra"
                    placeholder="Nome de quem recebeu o concreto na obra"
                    value={vistoObra}
                    onChange={(e) => setVistoObra(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <Label htmlFor="obsEntrega" className="text-xs">
                    Observações da OS
                  </Label>
                  <Input
                    id="obsEntrega"
                    placeholder="Avisos sobre a entrega, dosagem ou restrições..."
                    value={observacoesEntrega}
                    onChange={(e) => {
                      setObservacoesEntrega(e.target.value)
                      if (!observacao) setObservacao(e.target.value)
                    }}
                    className="text-xs"
                  />
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
            <Link to="/">Cancelar</Link>
          </Button>

          {/* Botão Secundário: Registrar carga apenas */}
          <Button
            type="submit"
            variant="secondary"
            disabled={salvando}
            className="w-full sm:w-auto gap-2"
          >
            {salvando ? (
              'Salvando...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Apenas Lançar Carga
              </>
            )}
          </Button>

          {/* Botão Principal: Salvar e gerar OS com impressão automática */}
          <Button
            type="button"
            onClick={handleSalvarEGerarOS}
            disabled={salvando}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground font-semibold shadow-md px-6 hover:brightness-105"
          >
            {salvando ? (
              'Processando OS...'
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Salvar e gerar OS
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal de Cadastro Rápido de Cliente */}
      <Dialog
        open={modalNovoClienteAberto}
        onOpenChange={setModalNovoClienteAberto}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-4 h-4 text-primary" />
              Cadastrar Cliente Rápido
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre o cliente sem sair do lançamento e sem perder nada do que
              já foi preenchido na carga.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarClienteRapido} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={novoClienteTipo === 'PJ' ? 'default' : 'outline'}
                onClick={() => setNovoClienteTipo('PJ')}
                className="text-xs flex-1"
              >
                Pessoa Jurídica (PJ)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={novoClienteTipo === 'PF' ? 'default' : 'outline'}
                onClick={() => setNovoClienteTipo('PF')}
                className="text-xs flex-1"
              >
                Pessoa Física (PF)
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="nomeRapido" className="text-xs">
                  Nome / Razão Social *
                </Label>
                <Input
                  id="nomeRapido"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  placeholder="Nome do cliente ou empresa"
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cpfRapido" className="text-xs">
                    {novoClienteTipo === 'PJ' ? 'CNPJ' : 'CPF'}
                  </Label>
                  <Input
                    id="cpfRapido"
                    value={novoClienteCpfCnpj}
                    onChange={(e) => setNovoClienteCpfCnpj(e.target.value)}
                    placeholder={
                      novoClienteTipo === 'PJ'
                        ? '00.000.000/0000-00'
                        : '000.000.000-00'
                    }
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="telRapido" className="text-xs">
                    Telefone
                  </Label>
                  <Input
                    id="telRapido"
                    value={novoClienteTelefone}
                    onChange={(e) => setNovoClienteTelefone(e.target.value)}
                    placeholder="(83) 90000-0000"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="endRapido" className="text-xs">
                    Endereço
                  </Label>
                  <Input
                    id="endRapido"
                    value={novoClienteLogradouro}
                    onChange={(e) => setNovoClienteLogradouro(e.target.value)}
                    placeholder="Rua / Av"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="numRapido" className="text-xs">
                    Número
                  </Label>
                  <Input
                    id="numRapido"
                    value={novoClienteNumero}
                    onChange={(e) => setNovoClienteNumero(e.target.value)}
                    placeholder="Nº"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="bairroRapido" className="text-xs">
                    Bairro
                  </Label>
                  <Input
                    id="bairroRapido"
                    value={novoClienteBairro}
                    onChange={(e) => setNovoClienteBairro(e.target.value)}
                    placeholder="Bairro"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cidRapido" className="text-xs">
                    Cidade
                  </Label>
                  <Input
                    id="cidRapido"
                    value={novoClienteCidade}
                    onChange={(e) => setNovoClienteCidade(e.target.value)}
                    placeholder="Cidade"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cepRapido" className="text-xs">
                    CEP
                  </Label>
                  <Input
                    id="cepRapido"
                    value={novoClienteCep}
                    onChange={(e) => setNovoClienteCep(e.target.value)}
                    placeholder="58000-000"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Exibir insumos por padrão */}
              <div className="p-3 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold">
                    Exibir insumos na OS impressa
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Mostrar o peso de cimento, britas, areia e aditivo no recibo
                  </div>
                </div>
                <Switch
                  checked={novoClienteExibirInsumos}
                  onCheckedChange={setNovoClienteExibirInsumos}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalNovoClienteAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvandoClienteRapido}
                className="gap-1.5"
              >
                {salvandoClienteRapido ? 'Salvando...' : 'Cadastrar e Vincular'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão do Recibo da OS */}
      <Dialog
        open={modalImpressaoAberta}
        onOpenChange={(open) => {
          setModalImpressaoAberta(open)
          if (!open) {
            navigate('/')
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6 text-base">
              <span className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Ordem de Serviço Nº {osGeradaParaImpressao?.numero_os} Gerada!
              </span>
              <Button
                type="button"
                onClick={async () => {
                  const el = document.getElementById(
                    'recibo-impressao-modal-lancamento',
                  )
                  if (el) {
                    await printElementInIsolatedIframe(el, {
                      title: `OS_${osGeradaParaImpressao?.numero_os}_Recibo_GC_MIX`,
                      waitForImages: true,
                      delayMs: 300,
                    })
                  } else {
                    window.print()
                  }
                }}
                className="gap-2 bg-primary text-primary-foreground text-xs h-8"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo (A4)
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Recibo formatado com cabeçalho oficial, dados de transporte, termo
              de responsabilidade de adição de água, aviso de cura úmida e
              canhoto de recebimento.
            </DialogDescription>
          </DialogHeader>

          {osGeradaParaImpressao && (
            <div
              id="recibo-impressao-modal-lancamento"
              className="mt-2 border rounded-lg p-2 bg-white text-black shadow-inner print:border-none print:p-0 print:m-0 print:shadow-none"
            >
              <ReciboImpressao
                ordem={osGeradaParaImpressao}
                empresa={empresaAtiva || null}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalImpressaoAberta(false)
                navigate('/')
              }}
            >
              Concluir e Voltar ao Início
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const el = document.getElementById(
                  'recibo-impressao-modal-lancamento',
                )
                if (el) {
                  await printElementInIsolatedIframe(el, {
                    title: `OS_${osGeradaParaImpressao?.numero_os}_Recibo_GC_MIX`,
                    waitForImages: true,
                    delayMs: 300,
                  })
                } else {
                  window.print()
                }
              }}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
