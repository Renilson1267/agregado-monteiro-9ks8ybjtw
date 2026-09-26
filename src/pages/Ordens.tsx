import { useState, useEffect, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  OrdemServico,
  Cliente,
  Carga,
  Traco,
  Motorista,
  Veiculo,
  ItemOrdemServico,
} from '@/types/concreteira'
import { ReciboImpressao } from '@/components/ReciboImpressao'
import {
  FileText,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Truck,
  Building,
  User,
  Clock,
  Sparkles,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Ordens() {
  const { empresaAtiva } = useEmpresa()

  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargas, setCargas] = useState<Carga[]>([])
  const [tracos, setTracos] = useState<Traco[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro na listagem
  const [busca, setBusca] = useState('')

  // Estado do formulário / modal
  const [modalOpen, setModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [ordemEditando, setOrdemEditando] = useState<OrdemServico | null>(null)

  // Documento selecionado para impressão
  const [ordemParaImprimir, setOrdemParaImprimir] =
    useState<OrdemServico | null>(null)

  // Campos do formulário
  const [numeroOs, setNumeroOs] = useState<number>(4337)
  const [dataEmissao, setDataEmissao] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [clienteSelecionadoId, setClienteSelecionadoId] =
    useState<string>('none')
  const [cargaSelecionadaId, setCargaSelecionadaId] = useState<string>('none')

  // Destinatário
  const [destinatarioNome, setDestinatarioNome] = useState('')
  const [destinatarioCpfCnpj, setDestinatarioCpfCnpj] = useState('')
  const [destinatarioTelefone, setDestinatarioTelefone] = useState('')
  const [destinatarioEndereco, setDestinatarioEndereco] = useState('')
  const [destinatarioBairro, setDestinatarioBairro] = useState('')
  const [destinatarioCidade, setDestinatarioCidade] = useState('')
  const [destinatarioUf, setDestinatarioUf] = useState('PB')
  const [destinatarioCep, setDestinatarioCep] = useState('')

  // Itens
  const [itens, setItens] = useState<ItemOrdemServico[]>([
    {
      quantidade: 8.0,
      unidade: 'm3',
      discriminacao: 'FCK 25 BRITA 0 / 1 SLUMP 12+-2 SJE NAC',
    },
  ])

  // Slump Central & Peça
  const [slumpCentralMedido, setSlumpCentralMedido] = useState('12+-2')
  const [slumpCentralSaida, setSlumpCentralSaida] = useState('12+-2')
  const [aguaAdicCentral, setAguaAdicCentral] = useState<number>(0)
  const [moldagemCentral, setMoldagemCentral] = useState('SIM')
  const [vistoMotoristaCentral, setVistoMotoristaCentral] = useState('')

  const [slumpPecaMedido, setSlumpPecaMedido] = useState('12+-2')
  const [slumpPecaSaida, setSlumpPecaSaida] = useState('12+-2')
  const [aguaAdicPeca, setAguaAdicPeca] = useState<number>(0)
  const [pecaConcretada, setPecaConcretada] = useState('PISO / ESTRUTURAL')
  const [vistoMotoristaPeca, setVistoMotoristaPeca] = useState('')

  // Transporte & Horários
  const [veiculoPlaca, setVeiculoPlaca] = useState('')
  const [motoristaNome, setMotoristaNome] = useState('')
  const [lacre, setLacre] = useState('')
  const [kmInicial, setKmInicial] = useState<string>('')
  const [kmFinal, setKmFinal] = useState<string>('')
  const [horaCarga, setHoraCarga] = useState('')

  const [horaSaidaCentral, setHoraSaidaCentral] = useState('')
  const [horaChegadaObra, setHoraChegadaObra] = useState('')
  const [horaInicioDescarga, setHoraInicioDescarga] = useState('')
  const [horaFimDescarga, setHoraFimDescarga] = useState('')
  const [horaSaidaObra, setHoraSaidaObra] = useState('')
  const [horaChegadaCentral, setHoraChegadaCentral] = useState('')

  const [vistoObra, setVistoObra] = useState('')
  const [vendedorNome, setVendedorNome] = useState('')
  const [bombaEstacionaria, setBombaEstacionaria] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const carregarDados = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [ords, clis, crgs, trcs, mots, veis] = await Promise.all([
        ConcreteiraService.getOrdensServico(empresaAtiva.id),
        ConcreteiraService.getClientes(empresaAtiva.id),
        ConcreteiraService.getCargas({ empresaId: empresaAtiva.id }),
        ConcreteiraService.getTracos(empresaAtiva.id),
        ConcreteiraService.getMotoristas(empresaAtiva.id),
        ConcreteiraService.getVeiculos(empresaAtiva.id),
      ])
      setOrdens(ords)
      setClientes(clis)
      setCargas(crgs)
      setTracos(trcs)
      setMotoristas(mots)
      setVeiculos(veis)
    } catch (e: any) {
      toast({
        title: 'Erro ao carregar Ordens de Serviço',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarDados()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Preenche dados do cliente selecionado no formulário
  const handleSelecionarCliente = (clienteId: string) => {
    setClienteSelecionadoId(clienteId)
    if (clienteId === 'none') return

    const cli = clientes.find((c) => c.id === clienteId)
    if (!cli) return

    setDestinatarioNome(cli.nome)
    setDestinatarioCpfCnpj(cli.cpf_cnpj || '')
    setDestinatarioTelefone(cli.telefone || '')
    setDestinatarioEndereco(
      [cli.logradouro, cli.numero].filter(Boolean).join(', ') ||
        cli.logradouro ||
        '',
    )
    setDestinatarioBairro(cli.bairro || '')
    setDestinatarioCidade(cli.cidade || '')
    setDestinatarioUf(cli.uf || 'PB')
    setDestinatarioCep(cli.cep || '')
  }

  // Vincula dados de uma carga existente
  const handleVincularCarga = (cargaId: string) => {
    setCargaSelecionadaId(cargaId)
    if (cargaId === 'none') return

    const carga = cargas.find((c) => c.id === cargaId)
    if (!carga) return

    if (carga.motorista_nome) {
      setMotoristaNome(carga.motorista_nome)
      setVistoMotoristaCentral(carga.motorista_nome)
      setVistoMotoristaPeca(carga.motorista_nome)
    }
    if (carga.veiculo_placa) setVeiculoPlaca(carga.veiculo_placa)
    if (carga.cidade_nome && !destinatarioCidade) {
      setDestinatarioCidade(carga.cidade_nome)
    }

    // Sugere linha de item com base no volume e traço da carga
    const vol = Number(carga.volume_m3) || 8.0
    const descTraco =
      carga.traco_nome || 'FCK 25 BRITA 0 / 1 SLUMP 12+-2 SJE NAC'

    setItens([
      {
        quantidade: vol,
        unidade: 'm3',
        discriminacao: descTraco,
      },
    ])
  }

  // Abertura para nova OS
  const handleNovaOS = async () => {
    if (!empresaAtiva) return
    setOrdemEditando(null)
    setLoading(true)
    try {
      const prox = await ConcreteiraService.getProximoNumeroOS(empresaAtiva.id)
      setNumeroOs(prox)
      setDataEmissao(new Date().toISOString().split('T')[0])
      setClienteSelecionadoId('none')
      setCargaSelecionadaId('none')
      setDestinatarioNome('')
      setDestinatarioCpfCnpj('')
      setDestinatarioTelefone('')
      setDestinatarioEndereco('')
      setDestinatarioBairro('')
      setDestinatarioCidade('')
      setDestinatarioUf('PB')
      setDestinatarioCep('')

      setItens([
        {
          quantidade: 8.0,
          unidade: 'm3',
          discriminacao: `FCK 25 BRITA 0 / 1 SLUMP 12+-2 ${empresaAtiva.slug?.toUpperCase() || ''} NAC`,
        },
      ])

      setSlumpCentralMedido('12+-2')
      setSlumpCentralSaida('12+-2')
      setAguaAdicCentral(0)
      setMoldagemCentral('SIM')
      setVistoMotoristaCentral('')

      setSlumpPecaMedido('12+-2')
      setSlumpPecaSaida('12+-2')
      setAguaAdicPeca(0)
      setPecaConcretada('PISO / ESTRUTURAL')
      setVistoMotoristaPeca('')

      setVeiculoPlaca('')
      setMotoristaNome('')
      setLacre('')
      setKmInicial('')
      setKmFinal('')
      setHoraCarga(new Date().toTimeString().slice(0, 5))

      setHoraSaidaCentral('')
      setHoraChegadaObra('')
      setHoraInicioDescarga('')
      setHoraFimDescarga('')
      setHoraSaidaObra('')
      setHoraChegadaCentral('')

      setVistoObra('')
      setVendedorNome('')
      setBombaEstacionaria('')
      setObservacoes('')

      setModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  // Abertura para editar OS existente
  const handleEditarOS = (os: OrdemServico) => {
    setOrdemEditando(os)
    setNumeroOs(os.numero_os)
    setDataEmissao(os.data_emissao)
    setClienteSelecionadoId(os.cliente_id || 'none')
    setCargaSelecionadaId(os.carga_id || 'none')

    setDestinatarioNome(os.destinatario_nome)
    setDestinatarioCpfCnpj(os.destinatario_cpf_cnpj || '')
    setDestinatarioTelefone(os.destinatario_telefone || '')
    setDestinatarioEndereco(os.destinatario_endereco || '')
    setDestinatarioBairro(os.destinatario_bairro || '')
    setDestinatarioCidade(os.destinatario_cidade || '')
    setDestinatarioUf(os.destinatario_uf || 'PB')
    setDestinatarioCep(os.destinatario_cep || '')

    setItens(
      os.itens && os.itens.length > 0
        ? os.itens
        : [{ quantidade: 8, unidade: 'm3', discriminacao: 'FCK 25' }],
    )

    setSlumpCentralMedido(os.slump_central_medido || '12+-2')
    setSlumpCentralSaida(os.slump_central_saida || '12+-2')
    setAguaAdicCentral(Number(os.agua_adic_central || 0))
    setMoldagemCentral(os.moldagem_central || 'SIM')
    setVistoMotoristaCentral(os.visto_motorista_central || '')

    setSlumpPecaMedido(os.slump_peca_medido || '12+-2')
    setSlumpPecaSaida(os.slump_peca_saida || '12+-2')
    setAguaAdicPeca(Number(os.agua_adic_peca || 0))
    setPecaConcretada(os.peca_concretada || 'PISO / ESTRUTURAL')
    setVistoMotoristaPeca(os.visto_motorista_peca || '')

    setVeiculoPlaca(os.veiculo_placa || '')
    setMotoristaNome(os.motorista_nome || '')
    setLacre(os.lacre || '')
    setKmInicial(os.km_inicial != null ? String(os.km_inicial) : '')
    setKmFinal(os.km_final != null ? String(os.km_final) : '')
    setHoraCarga(os.hora_carga || '')

    setHoraSaidaCentral(os.hora_saida_central || '')
    setHoraChegadaObra(os.hora_chegada_obra || '')
    setHoraInicioDescarga(os.hora_inicio_descarga || '')
    setHoraFimDescarga(os.hora_fim_descarga || '')
    setHoraSaidaObra(os.hora_saida_obra || '')
    setHoraChegadaCentral(os.hora_chegada_central || '')

    setVistoObra(os.visto_obra || '')
    setVendedorNome(os.vendedor_nome || '')
    setBombaEstacionaria(os.bomba_estacionaria || '')
    setObservacoes(os.observacoes || '')

    setModalOpen(true)
  }

  // Manipulação de linhas de itens
  const handleAddItem = () => {
    setItens((prev) => [
      ...prev,
      {
        quantidade: 8.0,
        unidade: 'm3',
        discriminacao: 'FCK 25 BRITA 0 / 1 SLUMP 12+-2',
      },
    ])
  }

  const handleUpdateItem = (
    index: number,
    field: keyof ItemOrdemServico,
    val: any,
  ) => {
    setItens((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const handleRemoveItem = (index: number) => {
    if (itens.length <= 1) return
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  // Salvar OS
  const handleSalvarOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva) return

    if (!destinatarioNome.trim()) {
      toast({
        title: 'Nome do Destinatário é obrigatório',
        description: 'Selecione um cliente cadastrado ou digite o nome.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      const payload: Partial<OrdemServico> = {
        id: ordemEditando?.id,
        empresa_id: empresaAtiva.id,
        numero_os: Number(numeroOs),
        data_emissao: dataEmissao,
        cliente_id:
          clienteSelecionadoId !== 'none' ? clienteSelecionadoId : null,
        carga_id: cargaSelecionadaId !== 'none' ? cargaSelecionadaId : null,

        destinatario_nome: destinatarioNome.trim(),
        destinatario_cpf_cnpj: destinatarioCpfCnpj.trim() || null,
        destinatario_telefone: destinatarioTelefone.trim() || null,
        destinatario_endereco: destinatarioEndereco.trim() || null,
        destinatario_bairro: destinatarioBairro.trim() || null,
        destinatario_cidade: destinatarioCidade.trim() || null,
        destinatario_uf: destinatarioUf.trim() || 'PB',
        destinatario_cep: destinatarioCep.trim() || null,

        itens,

        slump_central_medido: slumpCentralMedido.trim() || null,
        slump_central_saida: slumpCentralSaida.trim() || null,
        agua_adic_central: Number(aguaAdicCentral) || 0,
        moldagem_central: moldagemCentral.trim() || null,
        visto_motorista_central: vistoMotoristaCentral.trim() || null,

        slump_peca_medido: slumpPecaMedido.trim() || null,
        slump_peca_saida: slumpPecaSaida.trim() || null,
        agua_adic_peca: Number(aguaAdicPeca) || 0,
        peca_concretada: pecaConcretada.trim() || null,
        visto_motorista_peca: vistoMotoristaPeca.trim() || null,

        veiculo_placa: veiculoPlaca.trim() || null,
        motorista_nome: motoristaNome.trim() || null,
        lacre: lacre.trim() || null,
        km_inicial: kmInicial ? Number(kmInicial) : null,
        km_final: kmFinal ? Number(kmFinal) : null,
        hora_carga: horaCarga.trim() || null,

        hora_saida_central: horaSaidaCentral.trim() || null,
        hora_chegada_obra: horaChegadaObra.trim() || null,
        hora_inicio_descarga: horaInicioDescarga.trim() || null,
        hora_fim_descarga: horaFimDescarga.trim() || null,
        hora_saida_obra: horaSaidaObra.trim() || null,
        hora_chegada_central: horaChegadaCentral.trim() || null,

        visto_obra: vistoObra.trim() || null,
        vendedor_nome: vendedorNome.trim() || null,
        bomba_estacionaria: bombaEstacionaria.trim() || null,
        observacoes: observacoes.trim() || null,
      }

      const salva = await ConcreteiraService.salvarOrdemServico(
        payload,
        empresaAtiva.id,
      )

      toast({
        title: ordemEditando
          ? `Recibo Nº ${salva.numero_os} atualizado com sucesso!`
          : `Recibo Nº ${salva.numero_os} gerado com sucesso!`,
      })

      setModalOpen(false)
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar Ordem de Serviço',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Excluir OS
  const handleExcluirOS = async (id: string, num: number) => {
    if (!confirm(`Deseja realmente remover o Recibo Nº ${num}?`)) return
    try {
      await ConcreteiraService.excluirOrdemServico(id)
      toast({ title: `Recibo Nº ${num} excluído` })
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Ação de Impressão
  const dispararImpressao = (os: OrdemServico) => {
    setOrdemParaImprimir(os)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Filtro
  const ordensFiltradas = useMemo(() => {
    if (!busca) return ordens
    const b = busca.toLowerCase()
    return ordens.filter(
      (o) =>
        String(o.numero_os).includes(b) ||
        o.destinatario_nome?.toLowerCase().includes(b) ||
        o.destinatario_cidade?.toLowerCase().includes(b) ||
        o.veiculo_placa?.toLowerCase().includes(b) ||
        o.motorista_nome?.toLowerCase().includes(b),
    )
  }, [ordens, busca])

  return (
    <div className="space-y-6">
      {/* DOCUMENTO EXCLUSIVO DE IMPRESSÃO A4 (renderizado apenas durante window.print) */}
      {ordemParaImprimir && (
        <div className="print-only">
          <ReciboImpressao ordem={ordemParaImprimir} empresa={empresaAtiva} />
        </div>
      )}

      {/* Topo em tela */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Ordens de Serviço e Recibos de Concreto
            {empresaAtiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Emissão, controle de slump, dados de transporte e impressão A4
            oficial do Recibo de Concreto
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={handleNovaOS}
            className="gap-2 bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem / Recibo
          </Button>
        </div>
      </div>

      {/* Card com Listagem de Ordens */}
      <Card className="no-print border-border/40 bg-card/70">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Histórico de Ordens de Serviço ({ordensFiltradas.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Recibos gerados sequencialmente para a unidade{' '}
              {empresaAtiva?.nome || ''}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nº, cliente, placa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {ordensFiltradas.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs italic">
              Nenhuma ordem de serviço encontrada. Clique em "Nova Ordem /
              Recibo" para emitir.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3">Recibo Nº</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Destinatário / Obra</th>
                    <th className="py-2.5 px-3">Volume / Discriminação</th>
                    <th className="py-2.5 px-3">Placa / Motorista</th>
                    <th className="py-2.5 px-3">Destino</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ordensFiltradas.map((os) => {
                    const volTotal = (os.itens || []).reduce(
                      (acc, it) => acc + Number(it.quantidade || 0),
                      0,
                    )
                    const descPrimeiro =
                      os.itens?.[0]?.discriminacao || 'Concreto Usinado'

                    return (
                      <tr
                        key={os.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                          #{os.numero_os}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {os.data_emissao.split('-').reverse().join('/')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-foreground block">
                            {os.destinatario_nome}
                          </span>
                          {os.destinatario_cpf_cnpj && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {os.destinatario_cpf_cnpj}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <span className="font-mono font-bold text-foreground">
                            {volTotal.toFixed(1)} m³
                          </span>{' '}
                          <span
                            className="text-muted-foreground truncate block text-[11px]"
                            title={descPrimeiro}
                          >
                            {descPrimeiro}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {os.veiculo_placa ? (
                            <span className="font-mono font-medium text-foreground">
                              {os.veiculo_placa}
                            </span>
                          ) : (
                            '—'
                          )}
                          {os.motorista_nome && (
                            <span className="block text-[10px] text-muted-foreground">
                              {os.motorista_nome}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {os.destinatario_cidade || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 gap-1.5 bg-primary text-primary-foreground text-xs shadow-sm"
                              onClick={() => dispararImpressao(os)}
                              title="Imprimir / Salvar PDF do Recibo fiel ao modelo oficial"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Imprimir Recibo
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditarOS(os)}
                              title="Editar Ordem"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() =>
                                handleExcluirOS(os.id, os.numero_os)
                              }
                              title="Excluir Ordem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal / Dialog de Criação e Edição da Ordem de Serviço */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              {ordemEditando
                ? `Editar Recibo Nº ${numeroOs}`
                : `Novo Recibo de Concreto Nº ${numeroOs}`}
            </DialogTitle>
            <CardDescription className="text-xs">
              Unidade: {empresaAtiva?.nome || ''}. Todos os campos alimentam
              diretamente a versão A4 oficial impressa.
            </CardDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarOSSubmit} className="space-y-4 py-2">
            {/* Topo do Formulário: Sequência e Vínculos Rápidos */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-muted/20 space-y-3">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                Vínculos Rápidos e Numeração
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Número do Recibo *</Label>
                  <Input
                    type="number"
                    value={numeroOs}
                    onChange={(e) => setNumeroOs(Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Data de Emissão *</Label>
                  <Input
                    type="date"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Puxar Cliente do Cadastro</Label>
                  <Select
                    value={clienteSelecionadoId}
                    onValueChange={handleSelecionarCliente}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Preenchimento Manual</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Puxar Carga Existente</Label>
                  <Select
                    value={cargaSelecionadaId}
                    onValueChange={handleVincularCarga}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Vincular carga..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {cargas.slice(0, 30).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          Carga #{c.numero_carga} - {c.volume_m3}m³ ({c.data})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bloco 1: DADOS DO DESTINATÁRIO */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-card/60 space-y-3">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/30 pb-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Dados do Destinatário
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Nome / Razão Social *</Label>
                  <Input
                    value={destinatarioNome}
                    onChange={(e) => setDestinatarioNome(e.target.value)}
                    placeholder="Ex: CABRAL LEITE CONSTRUCOES LTDA"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">CNPJ / CPF</Label>
                  <Input
                    value={destinatarioCpfCnpj}
                    onChange={(e) => setDestinatarioCpfCnpj(e.target.value)}
                    placeholder="22.779.811/0001-75"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Endereço da Obra</Label>
                  <Input
                    value={destinatarioEndereco}
                    onChange={(e) => setDestinatarioEndereco(e.target.value)}
                    placeholder="Ex: POVOADO DEPOIS DE SÃO JOSÉ DE PRINCESA"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Bairro / Sítio</Label>
                  <Input
                    value={destinatarioBairro}
                    onChange={(e) => setDestinatarioBairro(e.target.value)}
                    placeholder="Ex: sitio"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    value={destinatarioTelefone}
                    onChange={(e) => setDestinatarioTelefone(e.target.value)}
                    placeholder="(83) 9908-5034"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Município</Label>
                  <Input
                    value={destinatarioCidade}
                    onChange={(e) => setDestinatarioCidade(e.target.value)}
                    placeholder="Princesa Isabel"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">UF</Label>
                  <Input
                    value={destinatarioUf}
                    onChange={(e) =>
                      setDestinatarioUf(e.target.value.toUpperCase())
                    }
                    placeholder="PB"
                    maxLength={2}
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">CEP</Label>
                  <Input
                    value={destinatarioCep}
                    onChange={(e) => setDestinatarioCep(e.target.value)}
                    placeholder="58755000"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: ITENS / DISCRIMINAÇÃO */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-card/60 space-y-3">
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Itens do Recibo (Quantidade / Unidade / Discriminação)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Linha
                </Button>
              </div>

              <div className="space-y-2">
                {itens.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.01"
                        value={it.quantidade}
                        onChange={(e) =>
                          handleUpdateItem(
                            idx,
                            'quantidade',
                            Number(e.target.value),
                          )
                        }
                        placeholder="Qtd"
                        className="h-9 text-xs font-mono text-right"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        value={it.unidade}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'unidade', e.target.value)
                        }
                        placeholder="m3"
                        className="h-9 text-xs text-center uppercase"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={it.discriminacao}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'discriminacao', e.target.value)
                        }
                        placeholder="Ex: FCK 25 BRITA 0 / 1 SLUMP 12+-2 SJE NAC"
                        className="h-9 text-xs uppercase"
                      />
                    </div>
                    {itens.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-9 w-9 p-0 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 3: VERIFICAÇÃO SLUMP (CENTRAL E PEÇA CONCRETADA) */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-card/60 space-y-3">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/30 pb-1.5">
                Verificação de Slump (Central e Peça Concretada)
              </div>

              {/* Linha Central */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-primary block">
                  Linha 1: Central
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px]">Slump Medido</Label>
                    <Input
                      value={slumpCentralMedido}
                      onChange={(e) => setSlumpCentralMedido(e.target.value)}
                      placeholder="12+-2"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Slump Saída</Label>
                    <Input
                      value={slumpCentralSaida}
                      onChange={(e) => setSlumpCentralSaida(e.target.value)}
                      placeholder="12+-2"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Água Adic. (Litros)</Label>
                    <Input
                      type="number"
                      value={aguaAdicCentral}
                      onChange={(e) =>
                        setAguaAdicCentral(Number(e.target.value))
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Moldagem</Label>
                    <Input
                      value={moldagemCentral}
                      onChange={(e) => setMoldagemCentral(e.target.value)}
                      placeholder="SIM / NÃO"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Visto Motorista</Label>
                    <Input
                      value={vistoMotoristaCentral}
                      onChange={(e) => setVistoMotoristaCentral(e.target.value)}
                      placeholder="Carlos Alberto"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Linha Peça Concretada */}
              <div className="space-y-1 pt-2 border-t border-border/20">
                <span className="text-[11px] font-semibold text-primary block">
                  Linha 2: Peça Concretada
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px]">Slump Medido</Label>
                    <Input
                      value={slumpPecaMedido}
                      onChange={(e) => setSlumpPecaMedido(e.target.value)}
                      placeholder="12+-2"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Slump Saída</Label>
                    <Input
                      value={slumpPecaSaida}
                      onChange={(e) => setSlumpPecaSaida(e.target.value)}
                      placeholder="12+-2"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Água Adic. (Litros)</Label>
                    <Input
                      type="number"
                      value={aguaAdicPeca}
                      onChange={(e) => setAguaAdicPeca(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Peça Concretada</Label>
                    <Input
                      value={pecaConcretada}
                      onChange={(e) => setPecaConcretada(e.target.value)}
                      placeholder="Piso / Laje / Viga"
                      className="h-8 text-xs uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Visto Motorista</Label>
                    <Input
                      value={vistoMotoristaPeca}
                      onChange={(e) => setVistoMotoristaPeca(e.target.value)}
                      placeholder="Carlos Alberto"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4: DADOS DE TRANSPORTE E HORÁRIOS */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-card/60 space-y-3">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/30 pb-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                Dados de Transporte e Horários
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                <div>
                  <Label className="text-[10px]">Placa</Label>
                  <Input
                    value={veiculoPlaca}
                    onChange={(e) =>
                      setVeiculoPlaca(e.target.value.toUpperCase())
                    }
                    placeholder="PEG6E61"
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[10px]">Motorista</Label>
                  <Input
                    value={motoristaNome}
                    onChange={(e) => setMotoristaNome(e.target.value)}
                    placeholder="Carlos Alberto (Mago)"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Lacre</Label>
                  <Input
                    value={lacre}
                    onChange={(e) => setLacre(e.target.value)}
                    placeholder="16190"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">KM Inicial</Label>
                  <Input
                    type="number"
                    value={kmInicial}
                    onChange={(e) => setKmInicial(e.target.value)}
                    placeholder="0"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Hora Carga</Label>
                  <Input
                    value={horaCarga}
                    onChange={(e) => setHoraCarga(e.target.value)}
                    placeholder="07:30"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Horários */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                  Controle de Horários da Betoneira
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <Label className="text-[9px]">Saída Central</Label>
                    <Input
                      value={horaSaidaCentral}
                      onChange={(e) => setHoraSaidaCentral(e.target.value)}
                      placeholder="07:45"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px]">Chegada Obra</Label>
                    <Input
                      value={horaChegadaObra}
                      onChange={(e) => setHoraChegadaObra(e.target.value)}
                      placeholder="08:20"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px]">Início Descarga</Label>
                    <Input
                      value={horaInicioDescarga}
                      onChange={(e) => setHoraInicioDescarga(e.target.value)}
                      placeholder="08:30"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px]">Fim Descarga</Label>
                    <Input
                      value={horaFimDescarga}
                      onChange={(e) => setHoraFimDescarga(e.target.value)}
                      placeholder="09:15"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px]">Saída Obra</Label>
                    <Input
                      value={horaSaidaObra}
                      onChange={(e) => setHoraSaidaObra(e.target.value)}
                      placeholder="09:25"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[9px]">Chegada Central</Label>
                    <Input
                      value={horaChegadaCentral}
                      onChange={(e) => setHoraChegadaCentral(e.target.value)}
                      placeholder="10:00"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 5: VISTO OBRA, VENDEDOR, BOMBA E OBSERVAÇÕES */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-card/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vendedor Responsável</Label>
                  <Input
                    value={vendedorNome}
                    onChange={(e) => setVendedorNome(e.target.value)}
                    placeholder="Ex: VALDERCLEITON FREIRE"
                    className="h-9 text-xs uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Bomba Estacionária / Operador
                  </Label>
                  <Input
                    value={bombaEstacionaria}
                    onChange={(e) => setBombaEstacionaria(e.target.value)}
                    placeholder="Ex: JUNIOR"
                    className="h-9 text-xs uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Visto da Obra</Label>
                  <Input
                    value={vistoObra}
                    onChange={(e) => setVistoObra(e.target.value)}
                    placeholder="Assinatura / Nome"
                    className="h-9 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  Texto Completo de Observações (impresso no recibo)
                </Label>
                <Textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="FOLGA DE ÁGUA: 15L/m3 PED 002009/26 VENDEDOR: ... CONTRATANTE: ... - BOMBA ESTACIONÁRIA: ..."
                  className="text-xs font-mono uppercase"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {salvando
                  ? 'Salvando...'
                  : ordemEditando
                    ? 'Salvar Alterações'
                    : 'Salvar e Gerar Recibo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
