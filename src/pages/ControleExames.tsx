import { useState, useEffect, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  ShieldCheck,
  Download,
  Settings,
  ClipboardList,
} from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { ExamesService } from '@/services/exames'
import {
  FuncionarioComExames,
  StatusExame,
  TipoExame,
  TIPOS_EXAME_CATALOGO,
} from '@/types/exames'
import { ModalImportarExamesCSV } from '@/components/ModalImportarExamesCSV'
import { AbaConfigurarPrazos } from '@/components/AbaConfigurarPrazos'
import { AbaFuncionarios } from '@/components/AbaFuncionarios'
import { formatarCpfCnpj, limparMascara, validarCPF } from '@/lib/documentos'

export default function ControleExames() {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()

  const [abaAtiva, setAbaAtiva] = useState<string>('controle')
  const [prazosConfigurados, setPrazosConfigurados] = useState<
    Record<TipoExame, number>
  >({
    admissional: 12,
    aso: 12,
    acuidade_visual: 12,
    audiometria: 12,
    avaliacao_clinica: 12,
    toxicologico: 30,
    rx: 12,
    ecg: 12,
    demissional: 0,
  })

  const [loading, setLoading] = useState(true)
  const [funcionarios, setFuncionarios] = useState<FuncionarioComExames[]>([])

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [filtroFuncao, setFiltroFuncao] = useState<string>('TODAS')

  // Modais
  const [modalImportarOpen, setModalImportarOpen] = useState(false)
  const [modalFuncionarioOpen, setModalFuncionarioOpen] = useState(false)
  const [funcionarioEditando, setFuncionarioEditando] =
    useState<FuncionarioComExames | null>(null)

  // Formulário de Funcionário & Exames
  const [formNome, setFormNome] = useState('')
  const [formFuncao, setFormFuncao] = useState('')
  const [formCpf, setFormCpf] = useState('')
  const [formDataAdmissao, setFormDataAdmissao] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')
  const [formExames, setFormExames] = useState<
    Record<TipoExame, { data: string; validadeMeses: number }>
  >({
    admissional: { data: '', validadeMeses: 12 },
    aso: { data: '', validadeMeses: 12 },
    acuidade_visual: { data: '', validadeMeses: 12 },
    audiometria: { data: '', validadeMeses: 12 },
    avaliacao_clinica: { data: '', validadeMeses: 12 },
    toxicologico: { data: '', validadeMeses: 30 },
    rx: { data: '', validadeMeses: 12 },
    ecg: { data: '', validadeMeses: 12 },
    demissional: { data: '', validadeMeses: 0 },
  })
  const [salvando, setSalvando] = useState(false)

  // Exclusão com AlertDialog
  const [dialogExclusaoOpen, setDialogExclusaoOpen] = useState(false)
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] =
    useState<FuncionarioComExames | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Carregar dados
  const carregarDados = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [lista, prazosMap] = await Promise.all([
        ExamesService.getFuncionariosComExames(empresaAtiva.id),
        ExamesService.getPrazosEmpresa(empresaAtiva.id),
      ])
      setFuncionarios(lista)
      setPrazosConfigurados(prazosMap)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar exames',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Lista de funções disponíveis para o filtro
  const funcoesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    funcionarios.forEach((f) => {
      if (f.funcao) set.add(f.funcao)
    })
    return Array.from(set).sort()
  }, [funcionarios])

  // Indicadores consolidados
  const totalFuncionarios = funcionarios.length
  const totalVencidos = useMemo(
    () => funcionarios.reduce((acc, f) => acc + f.totalVencidos, 0),
    [funcionarios],
  )
  const funcionariosComVencidos = useMemo(
    () => funcionarios.filter((f) => f.totalVencidos > 0),
    [funcionarios],
  )
  const funcionariosComVencimentoProximo = useMemo(
    () =>
      funcionarios.filter(
        (f) => f.examesAVencer30Dias.length > 0 && f.totalVencidos === 0,
      ),
    [funcionarios],
  )
  const totalNoPrazoGeral = useMemo(
    () => funcionarios.filter((f) => f.statusGeralAso === 'NO_PRAZO').length,
    [funcionarios],
  )
  const totalPendentesGeral = useMemo(
    () => funcionarios.filter((f) => f.statusGeralAso === 'PENDENTE').length,
    [funcionarios],
  )

  // Filtro de funcionários na tela
  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) => {
      // Busca por nome, CPF ou função
      if (busca) {
        const termo = busca.toLowerCase()
        const cpfLimpo = f.cpf ? limparMascara(f.cpf) : ''
        const bateNome = f.nome.toLowerCase().includes(termo)
        const bateFuncao = f.funcao.toLowerCase().includes(termo)
        const bateCpf = f.cpf?.includes(termo) || cpfLimpo.includes(termo)
        if (!bateNome && !bateFuncao && !bateCpf) return false
      }

      // Filtro por Função
      if (filtroFuncao !== 'TODAS') {
        if (f.funcao !== filtroFuncao) return false
      }

      // Filtro por Status
      if (filtroStatus === 'VENCIDO') {
        return f.totalVencidos > 0
      }
      if (filtroStatus === 'VENCENDO_30') {
        return f.examesAVencer30Dias.length > 0
      }
      if (filtroStatus === 'NO_PRAZO') {
        return f.statusGeralAso === 'NO_PRAZO' && f.totalVencidos === 0
      }
      if (filtroStatus === 'PENDENTE') {
        return f.statusGeralAso === 'PENDENTE'
      }

      return true
    })
  }, [funcionarios, busca, filtroStatus, filtroFuncao])

  // Abrir modal de novo funcionário
  const handleNovoFuncionario = () => {
    setFuncionarioEditando(null)
    setFormNome('')
    setFormFuncao('')
    setFormCpf('')
    setFormDataAdmissao('')
    setFormObservacoes('')
    const inicialExames: Record<
      TipoExame,
      { data: string; validadeMeses: number }
    > = {
      admissional: {
        data: '',
        validadeMeses: prazosConfigurados.admissional || 12,
      },
      aso: { data: '', validadeMeses: prazosConfigurados.aso || 12 },
      acuidade_visual: {
        data: '',
        validadeMeses: prazosConfigurados.acuidade_visual || 12,
      },
      audiometria: {
        data: '',
        validadeMeses: prazosConfigurados.audiometria || 12,
      },
      avaliacao_clinica: {
        data: '',
        validadeMeses: prazosConfigurados.avaliacao_clinica || 12,
      },
      toxicologico: {
        data: '',
        validadeMeses: prazosConfigurados.toxicologico || 30,
      },
      rx: { data: '', validadeMeses: prazosConfigurados.rx || 12 },
      ecg: { data: '', validadeMeses: prazosConfigurados.ecg || 12 },
      demissional: {
        data: '',
        validadeMeses:
          prazosConfigurados.demissional !== undefined
            ? prazosConfigurados.demissional
            : 0,
      },
    }
    setFormExames(inicialExames)
    setModalFuncionarioOpen(true)
  }

  // Abrir modal de edição
  const handleEditarFuncionario = (func: FuncionarioComExames) => {
    setFuncionarioEditando(func)
    setFormNome(func.nome)
    setFormFuncao(func.funcao)
    setFormCpf(func.cpf ? formatarCpfCnpj(func.cpf) : '')
    setFormDataAdmissao(func.data_admissao || '')
    setFormObservacoes(func.observacoes || '')

    const examesValores: Record<
      TipoExame,
      { data: string; validadeMeses: number }
    > = {
      admissional: {
        data: func.exames.admissional?.dataRealizacao || '',
        validadeMeses:
          func.exames.admissional?.validadeMeses ||
          prazosConfigurados.admissional ||
          12,
      },
      aso: {
        data: func.exames.aso?.dataRealizacao || '',
        validadeMeses:
          func.exames.aso?.validadeMeses || prazosConfigurados.aso || 12,
      },
      acuidade_visual: {
        data: func.exames.acuidade_visual?.dataRealizacao || '',
        validadeMeses:
          func.exames.acuidade_visual?.validadeMeses ||
          prazosConfigurados.acuidade_visual ||
          12,
      },
      audiometria: {
        data: func.exames.audiometria?.dataRealizacao || '',
        validadeMeses:
          func.exames.audiometria?.validadeMeses ||
          prazosConfigurados.audiometria ||
          12,
      },
      avaliacao_clinica: {
        data: func.exames.avaliacao_clinica?.dataRealizacao || '',
        validadeMeses:
          func.exames.avaliacao_clinica?.validadeMeses ||
          prazosConfigurados.avaliacao_clinica ||
          12,
      },
      toxicologico: {
        data: func.exames.toxicologico?.dataRealizacao || '',
        validadeMeses:
          func.exames.toxicologico?.validadeMeses ||
          prazosConfigurados.toxicologico ||
          30,
      },
      rx: {
        data: func.exames.rx?.dataRealizacao || '',
        validadeMeses:
          func.exames.rx?.validadeMeses || prazosConfigurados.rx || 12,
      },
      ecg: {
        data: func.exames.ecg?.dataRealizacao || '',
        validadeMeses:
          func.exames.ecg?.validadeMeses || prazosConfigurados.ecg || 12,
      },
      demissional: {
        data: func.exames.demissional?.dataRealizacao || '',
        validadeMeses:
          func.exames.demissional?.validadeMeses !== undefined
            ? func.exames.demissional.validadeMeses
            : prazosConfigurados.demissional !== undefined
              ? prazosConfigurados.demissional
              : 0,
      },
    }

    setFormExames(examesValores)
    setModalFuncionarioOpen(true)
  }

  // Salvar funcionário e exames
  const handleSalvarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNome.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe o nome do funcionário.',
        variant: 'destructive',
      })
      return
    }

    const cpfLimpo = formCpf ? limparMascara(formCpf) : null
    if (cpfLimpo && cpfLimpo.length === 11 && !validarCPF(cpfLimpo)) {
      toast({
        title: 'CPF com dígitos inválidos',
        description: 'Verifique os números digitados para o CPF.',
        variant: 'destructive',
      })
      return
    }

    if (!empresaAtiva) return
    setSalvando(true)

    try {
      // 1. Salvar dados do colaborador
      const funcSalvo = await ExamesService.salvarFuncionario({
        id: funcionarioEditando?.id,
        empresa_id: empresaAtiva.id,
        nome: formNome.trim(),
        funcao: formFuncao.trim() || 'Geral',
        cpf: cpfLimpo,
        data_admissao: formDataAdmissao || null,
        observacoes: formObservacoes.trim() || null,
      })

      // 2. Salvar exames
      const listaExamesParaSalvar = (
        Object.entries(formExames) as [
          TipoExame,
          { data: string; validadeMeses: number },
        ][]
      ).map(([tipo, val]) => ({
        tipo_exame: tipo,
        data_realizacao: val.data || null,
        validade_meses:
          tipo === 'demissional'
            ? isNaN(Number(val.validadeMeses))
              ? 0
              : Number(val.validadeMeses)
            : Number(val.validadeMeses) || prazosConfigurados[tipo] || 12,
      }))
      await ExamesService.salvarMultiplosExames(
        empresaAtiva.id,
        funcSalvo.id,
        listaExamesParaSalvar,
      )

      toast({
        title: funcionarioEditando
          ? 'Colaborador e exames atualizados com sucesso!'
          : 'Novo colaborador cadastrado com sucesso!',
      })

      setModalFuncionarioOpen(false)
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Confirmar exclusão via AlertDialog
  const confirmarExclusao = async () => {
    if (!funcionarioParaExcluir || !empresaAtiva) return
    setExcluindo(true)
    try {
      await ExamesService.excluirFuncionario(
        funcionarioParaExcluir.id,
        empresaAtiva.id,
      )
      toast({
        title: 'Colaborador excluído com sucesso!',
        description: `${funcionarioParaExcluir.nome} e seus exames foram removidos da unidade ${empresaAtiva.nome}.`,
      })
      setDialogExclusaoOpen(false)
      setFuncionarioParaExcluir(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir colaborador',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  // Exportar dados atuais para CSV formatado
  const exportarParaCsv = () => {
    if (funcionariosFiltrados.length === 0) {
      toast({
        title: 'Nenhum registro para exportar',
        description: 'Ajuste os filtros para exibir dados.',
      })
      return
    }

    const cabecalho = [
      'Colaborador',
      'Funcao',
      'CPF',
      'Data Admissao',
      'Exame Admissional',
      'ASO',
      'Acuidade Visual',
      'Audiometria',
      'Avaliacao Clinica',
      'Toxicologico',
      'RX',
      'ECG',
      'Demissional',
      'Status Geral',
    ].join(';')

    const linhas = funcionariosFiltrados.map((f) => {
      const formatarData = (iso: string | null) => {
        if (!iso) return ''
        const [ano, mes, dia] = iso.split('-')
        return `${dia}/${mes}/${ano}`
      }

      return [
        `"${f.nome}"`,
        `"${f.funcao}"`,
        `"${f.cpf ? formatarCpfCnpj(f.cpf) : ''}"`,
        formatarData(f.data_admissao),
        formatarData(f.exames.admissional?.dataRealizacao),
        formatarData(f.exames.aso?.dataRealizacao),
        formatarData(f.exames.acuidade_visual?.dataRealizacao),
        formatarData(f.exames.audiometria?.dataRealizacao),
        formatarData(f.exames.avaliacao_clinica?.dataRealizacao),
        formatarData(f.exames.toxicologico?.dataRealizacao),
        formatarData(f.exames.rx?.dataRealizacao),
        formatarData(f.exames.ecg?.dataRealizacao),
        formatarData(f.exames.demissional?.dataRealizacao),
        f.statusGeralAso,
      ].join(';')
    })

    const conteudoCsv = [cabecalho, ...linhas].join('\r\n')
    const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Controle_Exames_${empresaAtiva?.slug?.toUpperCase() || 'GCMIX'}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Planilha exportada!',
      description: 'Download do arquivo CSV iniciado.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Topo / Header da Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Controle de Exames (ASO)
            {empresaAtiva && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                Unidade {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento ocupacional, validades de exames médicos, controle de
            prazos e importação de planilhas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {abaAtiva === 'controle' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportarParaCsv}
                className="text-xs gap-1.5 h-9"
                title="Exportar listagem atual para CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalImportarOpen(true)}
                className="text-xs gap-1.5 h-9 border-primary/30 text-primary hover:bg-primary/10"
                title="Importar planilha CSV de controle de exames"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar CSV</span>
              </Button>

              <Button
                size="sm"
                onClick={handleNovoFuncionario}
                className="text-xs gap-1.5 h-9 bg-primary text-primary-foreground font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Colaborador</span>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={carregarDados}
            disabled={loading}
            className="h-9 w-9 text-muted-foreground"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Abas / Tabs do Módulo: Controle de Exames vs Configurar Prazos */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border/40">
          <TabsTrigger
            value="controle"
            className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Controle de Exames</span>
            {totalVencidos > 0 && (
              <Badge
                variant="destructive"
                className="h-4 px-1.5 text-[10px] font-mono leading-none"
              >
                {totalVencidos}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="funcionarios"
            className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
          >
            <UserCheck className="w-4 h-4" />
            <span>Funcionários</span>
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[10px] font-mono leading-none bg-primary/10 text-primary border-primary/20"
            >
              {totalFuncionarios}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="configurar_prazos"
            className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Prazos</span>
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[10px] font-mono leading-none bg-primary/10 text-primary border-primary/20"
            >
              NR-7
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da Aba 1: Controle de Exames */}
        <TabsContent value="controle" className="space-y-6 mt-0">
          {/* Alerta de Exames Vencidos na Unidade */}
          {funcionariosComVencidos.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 text-destructive animate-in fade-in">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-destructive" />
              <div className="flex-1">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  Atenção: Exames Vencidos na Unidade {empresaAtiva?.nome}
                  <Badge variant="destructive" className="font-mono text-xs">
                    {totalVencidos} exame(s) vencido(s)
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Há colaboradores com exames admissionais, periódicos ou
                  toxicológicos fora da validade. Providencie a renovação
                  imediata para cumprimento das NRs.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {funcionariosComVencidos.slice(0, 6).map((f) => (
                    <Badge
                      key={f.id}
                      variant="outline"
                      className="text-[11px] bg-background/80 border-destructive/40 text-destructive font-medium cursor-pointer hover:bg-destructive/20"
                      onClick={() => {
                        setBusca(f.nome)
                        setFiltroStatus('VENCIDO')
                      }}
                    >
                      {f.nome} ({f.funcao}): {f.totalVencidos} vencido(s)
                    </Badge>
                  ))}
                  {funcionariosComVencidos.length > 6 && (
                    <span className="text-[11px] text-muted-foreground self-center">
                      +{funcionariosComVencidos.length - 6} outros colaboradores
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFiltroStatus('VENCIDO')}
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-8"
              >
                Filtrar Vencidos
              </Button>
            </div>
          )}

          {/* Alerta de Exames Vencendo nos Próximos 30 Dias (Requisito 4) */}
          {funcionariosComVencimentoProximo.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-700 dark:text-amber-400">
              <Clock className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  Alerta de Prazos: Exames Vencendo nos Próximos 30 Dias
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                  >
                    {funcionariosComVencimentoProximo.reduce(
                      (acc, f) => acc + f.examesAVencer30Dias.length,
                      0,
                    )}{' '}
                    a vencer
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agende antecipadamente as consultas e coletas para os
                  seguintes funcionários para evitar interdição ou multas:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {funcionariosComVencimentoProximo.slice(0, 5).map((f) => (
                    <Badge
                      key={f.id}
                      variant="outline"
                      className="text-[11px] bg-background/80 border-amber-500/40 text-amber-600 dark:text-amber-400 font-medium cursor-pointer"
                      onClick={() => {
                        setBusca(f.nome)
                        setFiltroStatus('VENCENDO_30')
                      }}
                    >
                      {f.nome} (
                      {f.examesAVencer30Dias
                        .map((e) => `${e.nome} em ${e.diasParaVencer}d`)
                        .join(', ')}
                      )
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFiltroStatus('VENCENDO_30')}
                className="shrink-0 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs h-8"
              >
                Ver Próximos 30 Dias
              </Button>
            </div>
          )}

          {/* Grid de Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total de Colaboradores */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total de Colaboradores
                </CardTitle>
                <UserCheck className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">
                  {totalFuncionarios}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unidade ativa: {empresaAtiva?.nome || '—'}
                </p>
              </CardContent>
            </Card>

            {/* KPI 2: Exames Vencidos */}
            <Card
              className={`border-border/40 shadow-sm cursor-pointer transition-all hover:scale-[1.01] ${
                totalVencidos > 0
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-card/70'
              }`}
              onClick={() =>
                setFiltroStatus(
                  filtroStatus === 'VENCIDO' ? 'TODOS' : 'VENCIDO',
                )
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-destructive uppercase tracking-wider">
                  Exames Vencidos
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-destructive">
                  {totalVencidos}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {funcionariosComVencidos.length} colaboradores afetados
                </p>
              </CardContent>
            </Card>

            {/* KPI 3: Vencendo em 30 Dias */}
            <Card
              className="bg-card/70 border-border/40 shadow-sm cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() =>
                setFiltroStatus(
                  filtroStatus === 'VENCENDO_30' ? 'TODOS' : 'VENCENDO_30',
                )
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Vencendo em 30 Dias
                </CardTitle>
                <Clock className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {funcionarios.reduce(
                    (acc, f) => acc + f.examesAVencer30Dias.length,
                    0,
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Exames a renovar este mês
                </p>
              </CardContent>
            </Card>

            {/* KPI 4: No Prazo / Em Dia */}
            <Card
              className="bg-card/70 border-border/40 shadow-sm cursor-pointer transition-all hover:scale-[1.01]"
              onClick={() =>
                setFiltroStatus(
                  filtroStatus === 'NO_PRAZO' ? 'TODOS' : 'NO_PRAZO',
                )
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  ASO em Dia
                </CardTitle>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {totalNoPrazoGeral}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalPendentesGeral} colaboradores com pendências
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Filtros e Busca */}
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar funcionário, CPF ou função..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>

                {/* Filtro por Status */}
                <div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="h-10 text-xs">
                      <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Status Geral" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS" className="text-xs">
                        Todos os Status
                      </SelectItem>
                      <SelectItem
                        value="VENCIDO"
                        className="text-xs text-destructive font-semibold"
                      >
                        🔴 Vencidos ({funcionariosComVencidos.length})
                      </SelectItem>
                      <SelectItem
                        value="VENCENDO_30"
                        className="text-xs text-amber-600 font-semibold"
                      >
                        🟡 Vencendo em 30 dias
                      </SelectItem>
                      <SelectItem
                        value="NO_PRAZO"
                        className="text-xs text-emerald-600 font-semibold"
                      >
                        🟢 No Prazo ({totalNoPrazoGeral})
                      </SelectItem>
                      <SelectItem
                        value="PENDENTE"
                        className="text-xs text-muted-foreground"
                      >
                        ⚪ Pendentes ({totalPendentesGeral})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Função */}
                <div>
                  <Select value={filtroFuncao} onValueChange={setFiltroFuncao}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Filtrar por Função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS" className="text-xs">
                        Todas as Funções
                      </SelectItem>
                      {funcoesDisponiveis.map((f) => (
                        <SelectItem key={f} value={f} className="text-xs">
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resetar Filtros */}
                <div className="flex items-center justify-end gap-2">
                  {(busca ||
                    filtroStatus !== 'TODOS' ||
                    filtroFuncao !== 'TODAS') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBusca('')
                        setFiltroStatus('TODOS')
                        setFiltroFuncao('TODAS')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground h-10"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                  <span className="text-xs font-mono text-muted-foreground">
                    {funcionariosFiltrados.length} listados
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Principal de Controle de Exames */}
          <Card className="border-border/40 bg-card/70">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Listagem Completa de Colaboradores e Exames
                </CardTitle>
                <CardDescription className="text-xs">
                  Status calculados automaticamente pela data de hoje: Vermelho
                  = Vencido, Verde = No Prazo, Cinza = Pendente.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  <span>
                    Carregando exames da unidade {empresaAtiva?.nome}...
                  </span>
                </div>
              ) : funcionariosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic">
                  Nenhum colaborador encontrado com os filtros selecionados.{' '}
                  <button
                    type="button"
                    onClick={handleNovoFuncionario}
                    className="text-primary underline ml-1 font-semibold"
                  >
                    Cadastrar agora
                  </button>{' '}
                  ou use o botão "Importar CSV" para carregar a planilha.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10">
                      <tr>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Colaborador</th>
                        <th className="py-3 px-3">Função</th>
                        <th className="py-3 px-3">CPF</th>
                        <th className="py-3 px-3">Admissão</th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Exame Admissional (Validade: 12 meses)"
                        >
                          Admissional
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="ASO Periódico (Validade: 12 meses)"
                        >
                          ASO
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Acuidade Visual (Validade: 12 meses)"
                        >
                          Acuidade
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Audiometria (Validade: 12 meses)"
                        >
                          Audiometria
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Avaliação Clínica (Validade: 12 meses)"
                        >
                          Av. Clínica
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Exame Toxicológico (Validade: 30 meses)"
                        >
                          Toxicológico
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Raio-X (RX) (Validade: 12 meses)"
                        >
                          RX
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Eletrocardiograma (ECG) (Validade: 12 meses)"
                        >
                          ECG
                        </th>
                        <th
                          className="py-3 px-2 text-center"
                          title="Exame Demissional (Art. 168 §4º CLT — exame na rescisão)"
                        >
                          Demissional
                        </th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {funcionariosFiltrados.map((f) => (
                        <tr
                          key={f.id}
                          className="hover:bg-muted/20 transition-colors group"
                        >
                          {/* Status Geral */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <BadgeStatusGeral status={f.statusGeralAso} />
                          </td>

                          {/* Nome */}
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-foreground block whitespace-nowrap">
                              {f.nome}
                            </span>
                            {f.observacoes && (
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                                {f.observacoes}
                              </span>
                            )}
                          </td>

                          {/* Função */}
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-foreground">
                              {f.funcao}
                            </span>
                          </td>

                          {/* CPF */}
                          <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                            {f.cpf ? formatarCpfCnpj(f.cpf) : '—'}
                          </td>

                          {/* Data Admissão */}
                          <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                            {formatarDataParaExibicao(f.data_admissao)}
                          </td>

                          {/* Exames */}
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.admissional} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.aso} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.acuidade_visual} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.audiometria} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.avaliacao_clinica} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.toxicologico} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.rx} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.ecg} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <CelulaExame exame={f.exames.demissional} />
                          </td>

                          {/* Ações */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditarFuncionario(f)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Editar colaborador e exames"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>

                              {/* Exclusão permitida apenas para Administrador */}
                              {isAdministrador && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setFuncionarioParaExcluir(f)
                                    setDialogExclusaoOpen(true)
                                  }}
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  title="Excluir colaborador"
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

          {/* Legenda de Cores */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground p-3 bg-muted/20 rounded-xl border border-border/30">
            <span className="font-semibold text-foreground">
              Legenda dos Exames:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span className="text-destructive font-medium">
                VENCIDO:
              </span>{' '}
              data de validade expirada
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-500 font-medium">ATENÇÃO:</span> vence
              nos próximos 30 dias
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-500 font-medium">
                NO PRAZO:
              </span>{' '}
              exame válido
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
              <span>PENDENTE: sem exame registrado</span>
            </div>
          </div>
        </TabsContent>

        {/* Conteúdo da Aba 2: Cadastro de Funcionários */}
        <TabsContent value="funcionarios" className="mt-0">
          <AbaFuncionarios
            funcionarios={funcionarios}
            loading={loading}
            onAtualizar={() => carregarDados()}
            onVerExames={(func) => {
              setBusca(func.nome)
              setAbaAtiva('controle')
            }}
          />
        </TabsContent>

        {/* Conteúdo da Aba 3: Configurar Prazos */}
        <TabsContent value="configurar_prazos" className="mt-0">
          <AbaConfigurarPrazos onPrazosAtualizados={() => carregarDados()} />
        </TabsContent>
      </Tabs>

      {/* Modal Importador de CSV */}
      <ModalImportarExamesCSV
        open={modalImportarOpen}
        onOpenChange={setModalImportarOpen}
        funcionariosAtuais={funcionarios}
        prazosConfigurados={prazosConfigurados}
        onImportadoSucesso={() => carregarDados()}
      />

      {/* Modal de Incluir / Editar Funcionário e Exames */}
      <Dialog
        open={modalFuncionarioOpen}
        onOpenChange={(v) => !salvando && setModalFuncionarioOpen(v)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              {funcionarioEditando
                ? `Editar Colaborador: ${funcionarioEditando.nome}`
                : 'Novo Colaborador e Exames'}
              {empresaAtiva && (
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/30"
                >
                  {empresaAtiva.nome}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados cadastrais e as datas de realização dos exames.
              O status é calculado automaticamente a partir das validades.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSalvarSubmit}
            className="flex-1 overflow-y-auto space-y-4 py-2 pr-1"
          >
            {/* Bloco 1: Dados do Colaborador */}
            <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Dados Cadastrais
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="nome" className="text-xs font-medium">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value.toUpperCase())}
                    placeholder="Ex: JOSÉ DA SILVA"
                    className="h-9 text-xs font-semibold uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="funcao" className="text-xs font-medium">
                    Função / Cargo *
                  </Label>
                  <Input
                    id="funcao"
                    value={formFuncao}
                    onChange={(e) => setFormFuncao(e.target.value)}
                    placeholder="Ex: Motorista, Balanceiro, Ajudante..."
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cpf" className="text-xs font-medium">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={formCpf}
                    onChange={(e) =>
                      setFormCpf(formatarCpfCnpj(e.target.value))
                    }
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="admissao" className="text-xs font-medium">
                    Data de Admissão
                  </Label>
                  <Input
                    id="admissao"
                    type="date"
                    value={formDataAdmissao}
                    onChange={(e) => setFormDataAdmissao(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label htmlFor="obs" className="text-xs font-medium">
                    Observações Internas (opcional)
                  </Label>
                  <Input
                    id="obs"
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                    placeholder="Ex: Restrições médicas, CNH D/E, unidade Monteiro/SJE..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Exames Ocupacionais */}
            <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Datas de Realização dos Exames
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  Campos vazios serão mantidos como Pendente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TIPOS_EXAME_CATALOGO.map((item) => {
                  const prazoVigente =
                    formExames[item.tipo]?.validadeMeses ||
                    prazosConfigurados[item.tipo] ||
                    item.validadePadraoMeses

                  return (
                    <div
                      key={item.tipo}
                      className="p-2.5 rounded-lg border border-border/40 bg-background/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className="font-semibold text-foreground truncate"
                          title={item.nome}
                        >
                          {item.nome}
                        </span>
                        <span
                          className="text-[10px] text-primary font-mono font-semibold"
                          title="Prazo configurado para a unidade ativa"
                        >
                          {prazoVigente}m
                        </span>
                      </div>

                      <Input
                        type="date"
                        value={formExames[item.tipo]?.data || ''}
                        onChange={(e) =>
                          setFormExames((prev) => ({
                            ...prev,
                            [item.tipo]: {
                              ...prev[item.tipo],
                              data: e.target.value,
                            },
                          }))
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-border/30">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalFuncionarioOpen(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="bg-primary text-primary-foreground font-semibold gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {salvando
                  ? 'Salvando...'
                  : funcionarioEditando
                    ? 'Salvar Alterações'
                    : 'Cadastrar Colaborador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação para Excluir Colaborador (Padrão de Exclusão do Sistema) */}
      <AlertDialog
        open={dialogExclusaoOpen}
        onOpenChange={(v) => !excluindo && setDialogExclusaoOpen(v)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão de Colaborador
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm pt-2 leading-relaxed">
              Deseja realmente remover o colaborador{' '}
              <strong className="text-foreground">
                {funcionarioParaExcluir?.nome}
              </strong>{' '}
              ({funcionarioParaExcluir?.funcao}) da unidade{' '}
              <strong className="text-foreground">{empresaAtiva?.nome}</strong>?
              <br />
              <br />
              Todos os registros históricos e exames vinculados a este
              funcionário serão excluídos definitivamente.
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
              {excluindo ? 'Excluindo...' : 'Sim, Excluir Colaborador'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Célula com destaque de status para um exame
 */
function CelulaExame({ exame }: { exame?: any }) {
  if (!exame || !exame.dataRealizacao) {
    return (
      <span className="inline-block px-1.5 py-0.5 text-[10px] text-muted-foreground/60 bg-muted/40 rounded font-mono">
        —
      </span>
    )
  }

  const [ano, mes, dia] = exame.dataRealizacao.split('-')
  const dataFormatada = `${dia}/${mes}/${ano}`

  if (exame.status === 'NA_RESCISAO' || exame.tipo === 'demissional') {
    return (
      <span
        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-sky-700 dark:text-sky-400 bg-sky-500/15 border border-sky-500/30"
        title="Exame na Rescisão (Art. 168 §4º CLT - sem validade automática)"
      >
        {dataFormatada}
      </span>
    )
  }

  if (exame.status === 'VENCIDO') {
    return (
      <span
        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-destructive bg-destructive/15 border border-destructive/30"
        title={`VENCIDO em ${formatarDataParaExibicao(exame.dataValidade)} (${Math.abs(exame.diasParaVencer || 0)} dias atrás)`}
      >
        {dataFormatada}
      </span>
    )
  }

  // Se estiver vencendo nos próximos 30 dias, exibe em amarelo/alerta
  if (exame.diasParaVencer !== null && exame.diasParaVencer <= 30) {
    return (
      <span
        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30"
        title={`ATENÇÃO: Vence em ${exame.diasParaVencer} dias (${formatarDataParaExibicao(exame.dataValidade)})`}
      >
        {dataFormatada}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
      title={`No prazo até ${formatarDataParaExibicao(exame.dataValidade)}`}
    >
      {dataFormatada}
    </span>
  )
}

function BadgeStatusGeral({ status }: { status: StatusExame }) {
  if (status === 'NA_RESCISAO') {
    return (
      <Badge
        variant="outline"
        className="text-[10px] uppercase font-semibold text-sky-700 dark:text-sky-400 border-sky-500/40 bg-sky-500/10"
      >
        Na Rescisão
      </Badge>
    )
  }
  if (status === 'VENCIDO') {
    return (
      <Badge
        variant="destructive"
        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
      >
        Vencido
      </Badge>
    )
  }
  if (status === 'NO_PRAZO') {
    return (
      <Badge className="text-[10px] uppercase font-bold tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5">
        No Prazo
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="text-[10px] uppercase font-medium text-muted-foreground px-2 py-0.5"
    >
      Pendente
    </Badge>
  )
}

function formatarDataParaExibicao(iso: string | null | undefined): string {
  if (!iso) return '—'
  const partes = iso.split('-')
  if (partes.length !== 3) return iso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}
