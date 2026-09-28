import { useEffect, useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { FolhaService, SalvarLinhaFolhaPayload } from '@/services/folha'
import {
  FolhaCompetencia,
  FolhaPagamentoLinha,
  TipoColaboradorFolha,
  calcularMensalLiquido,
} from '@/types/folha'
import { ModalImportarFolhaCSV } from '@/components/ModalImportarFolhaCSV'
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from '@/assets/logos'
import {
  Users,
  Search,
  Filter,
  Download,
  Printer,
  Upload,
  RefreshCw,
  Calendar,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FolhaPagamento() {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()

  const [competencias, setCompetencias] = useState<FolhaCompetencia[]>([])
  const [competenciaAtiva, setCompetenciaAtiva] = useState<string>('2026-09')
  const [linhasFolha, setLinhasFolha] = useState<FolhaPagamentoLinha[]>([])
  const [loading, setLoading] = useState(true)
  const [modalImportarOpen, setModalImportarOpen] = useState(false)

  // Filtros
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [funcaoFiltro, setFuncaoFiltro] = useState<string>('todos')

  // Modais de Edição/Criação, Holerite e Confirmação de Exclusão
  const [modalFormOpen, setModalFormOpen] = useState(false)
  const [linhaEditando, setLinhaEditando] = useState<Partial<SalvarLinhaFolhaPayload> | null>(null)
  const [linhaParaExcluir, setLinhaParaExcluir] = useState<FolhaPagamentoLinha | null>(null)
  const [holeriteModal, setHoleriteModal] = useState<FolhaPagamentoLinha | null>(null)
  const [salvandoLinha, setSalvandoLinha] = useState(false)
  const [excluindoLinha, setExcluindoLinha] = useState(false)

  // Carrega lista de competências da empresa ativa
  const carregarCompetencias = async () => {
    if (!empresaAtiva) return
    try {
      const comps = await FolhaService.getCompetencias(empresaAtiva.id)
      setCompetencias(comps)

      if (comps.length > 0) {
        if (!comps.some((c) => c.competencia === competenciaAtiva)) {
          setCompetenciaAtiva(comps[0].competencia)
        }
      }
    } catch (e) {
      console.error('Erro ao carregar competências:', e)
    }
  }

  // Carrega linhas da folha
  const carregarLinhasFolha = async () => {
    if (!empresaAtiva || !competenciaAtiva) return
    setLoading(true)
    try {
      const linhas = await FolhaService.getLinhasCompetencia(
        empresaAtiva.id,
        competenciaAtiva,
      )
      setLinhasFolha(linhas)
    } catch (e) {
      console.error('Erro ao carregar linhas da folha:', e)
      toast({
        title: 'Erro ao carregar folha',
        description: 'Não foi possível buscar as linhas desta competência.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarCompetencias()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  useEffect(() => {
    if (empresaAtiva && competenciaAtiva) {
      carregarLinhasFolha()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id, competenciaAtiva])

  // Funções únicas para filtro
  const funcoesDisponiveis = useMemo(() => {
    const s = new Set<string>()
    linhasFolha.forEach((l) => {
      if (l.funcao) s.add(l.funcao)
    })
    return Array.from(s).sort()
  }, [linhasFolha])

  // Filtragem das linhas
  const linhasFiltradas = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return linhasFolha.filter((l) => {
      if (tipoFiltro !== 'todos' && l.tipo !== tipoFiltro) {
        return false
      }
      if (funcaoFiltro !== 'todos' && l.funcao !== funcaoFiltro) {
        return false
      }
      if (!q) return true

      const nomeOk = l.nome.toLowerCase().includes(q)
      const funcOk = l.funcao.toLowerCase().includes(q)
      const unidOk = l.unidade.toLowerCase().includes(q)
      const contaOk = l.conta ? l.conta.toLowerCase().includes(q) : false
      const pixOk = l.pix ? l.pix.toLowerCase().includes(q) : false

      return nomeOk || funcOk || unidOk || contaOk || pixOk
    })
  }, [linhasFolha, busca, tipoFiltro, funcaoFiltro])

  // Totais consolidados
  const totaisFiltrados = useMemo(() => {
    return FolhaService.calcularTotais(linhasFiltradas)
  }, [linhasFiltradas])

  const totaisCompetencia = useMemo(() => {
    return FolhaService.calcularTotais(linhasFolha)
  }, [linhasFolha])

  // Competência formatada legível (ex: "Setembro / 2026")
  const labelCompetencia = useMemo(() => {
    if (!competenciaAtiva) return ''
    const [ano, mes] = competenciaAtiva.split('-')
    const dataObj = new Date(Number(ano), Number(mes) - 1, 1)
    const nomeMes = dataObj.toLocaleDateString('pt-BR', { month: 'long' })
    return `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} / ${ano}`
  }, [competenciaAtiva])

  // Abrir modal para novo colaborador
  const handleNovoColaborador = () => {
    const unidadeSugerida = empresaAtiva?.slug?.toUpperCase() || 'SJE'
    setLinhaEditando({
      empresa_id: empresaAtiva?.id,
      competencia: competenciaAtiva,
      tipo: 'Funcionario',
      nome: '',
      funcao: '',
      unidade: unidadeSugerida,
      bruto: 0,
      filhos: 0,
      inss: 0,
      familia: 0,
      ir: 0,
      quinzena: 0,
      adiantamento: 0,
      gratificacao: 0,
      mensal_liquido: 0,
      producao: 0,
      comissao: 0,
      conta: '',
      pix: '',
      modo_calculo: 'Calculado',
    })
    setModalFormOpen(true)
  }

  // Abrir modal para editar colaborador
  const handleEditarColaborador = (linha: FolhaPagamentoLinha) => {
    setLinhaEditando({
      ...linha,
    })
    setModalFormOpen(true)
  }

  // Atualizar campo no form com recálculo automático quando modo for 'Calculado'
  const handleCampoFormChange = (campo: string, valor: any) => {
    if (!linhaEditando) return

    setLinhaEditando((prev) => {
      if (!prev) return null
      const novo = { ...prev, [campo]: valor }

      // Se for alteração do modo manual/automático
      if (campo === 'modo_calculo') {
        if (valor === 'Calculado') {
          novo.mensal_liquido = calcularMensalLiquido(novo)
        }
        return novo
      }

      // Se o colaborador mudou para 'Terceiro', zera Bruto/INSS caso estejam sem valor fixado
      if (campo === 'tipo' && valor === 'Terceiro') {
        if (Number(novo.bruto || 0) === 0) novo.bruto = 0
        if (Number(novo.inss || 0) === 0) novo.inss = 0
      }

      // Se estiver no modo 'Calculado', recalcula automaticamente o Líquido Mensal
      if (novo.modo_calculo !== 'Digitado') {
        novo.mensal_liquido = calcularMensalLiquido(novo)
      }

      return novo
    })
  }

  // Salvar formulário
  const handleSalvarLinha = async () => {
    if (!linhaEditando || !empresaAtiva) return

    if (!linhaEditando.nome || !linhaEditando.nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do colaborador.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoLinha(true)
    try {
      const payload: SalvarLinhaFolhaPayload = {
        id: linhaEditando.id,
        empresa_id: empresaAtiva.id,
        competencia: competenciaAtiva,
        tipo: (linhaEditando.tipo as TipoColaboradorFolha) || 'Funcionario',
        nome: linhaEditando.nome.trim(),
        funcao: (linhaEditando.funcao || 'Geral').trim(),
        unidade: (linhaEditando.unidade || 'SJE').trim(),
        bruto: Number(linhaEditando.bruto || 0),
        filhos: Number(linhaEditando.filhos || 0),
        inss: Number(linhaEditando.inss || 0),
        familia: Number(linhaEditando.familia || 0),
        ir: Number(linhaEditando.ir || 0),
        quinzena: Number(linhaEditando.quinzena || 0),
        adiantamento: Number(linhaEditando.adiantamento || 0),
        gratificacao: Number(linhaEditando.gratificacao || 0),
        mensal_liquido: Number(linhaEditando.mensal_liquido || 0),
        producao: Number(linhaEditando.producao || 0),
        comissao: Number(linhaEditando.comissao || 0),
        conta: linhaEditando.conta || '',
        pix: linhaEditando.pix || '',
        modo_calculo: linhaEditando.modo_calculo || 'Calculado',
      }

      await FolhaService.salvarLinha(payload)

      toast({
        title: linhaEditando.id ? 'Colaborador atualizado!' : 'Colaborador adicionado!',
        description: `${payload.nome} salvo na folha de ${labelCompetencia}.`,
      })

      setModalFormOpen(false)
      setLinhaEditando(null)
      carregarLinhasFolha()
      carregarCompetencias()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar colaborador',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvandoLinha(false)
    }
  }

  // Excluir colaborador
  const handleConfirmarExclusao = async () => {
    if (!linhaParaExcluir || !empresaAtiva) return

    setExcluindoLinha(true)
    try {
      await FolhaService.excluirLinha(
        linhaParaExcluir.id,
        empresaAtiva.id,
        competenciaAtiva,
      )

      toast({
        title: 'Registro excluído',
        description: `${linhaParaExcluir.nome} removido da competência.`,
      })

      setLinhaParaExcluir(null)
      carregarLinhasFolha()
      carregarCompetencias()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setExcluindoLinha(false)
    }
  }

  // Exportar CSV exatamente com as colunas do anexo
  const handleExportarCSV = () => {
    if (linhasFiltradas.length === 0) {
      toast({
        title: 'Sem dados para exportação',
        description: 'Nenhum registro encontrado na listagem.',
        variant: 'destructive',
      })
      return
    }

    const cabecalho = [
      'Tipo',
      'Nome',
      'Funcao',
      'Unidade',
      'Bruto',
      'Filhos',
      'INSS',
      'Familia',
      'IR',
      'Quinzena',
      'Adiantamento',
      'Gratificacao',
      'MensalLiquido',
      'Producao',
      'Comissao',
      'Conta',
      'PIX',
    ]

    const linhas = linhasFiltradas.map((l) => [
      l.tipo,
      `"${l.nome}"`,
      `"${l.funcao}"`,
      l.unidade,
      l.tipo === 'Terceiro' && l.bruto === 0 ? '' : l.bruto.toFixed(2),
      l.filhos || '',
      l.tipo === 'Terceiro' && l.inss === 0 ? '' : l.inss.toFixed(2),
      l.familia > 0 ? l.familia.toFixed(2) : '',
      l.ir > 0 ? l.ir.toFixed(2) : '',
      l.quinzena > 0 ? l.quinzena.toFixed(2) : '',
      l.adiantamento > 0 ? l.adiantamento.toFixed(2) : '',
      l.gratificacao > 0 ? l.gratificacao.toFixed(2) : '',
      l.mensal_liquido.toFixed(2),
      l.producao > 0 ? l.producao.toFixed(2) : '',
      l.comissao > 0 ? l.comissao.toFixed(2) : '',
      `"${l.conta || ''}"`,
      `"${l.pix || ''}"`,
    ])

    // Linha de TOTAL no formato exato da planilha
    const linhaTotal = [
      'TOTAL',
      '',
      '',
      '',
      totaisFiltrados.totalBruto > 0 ? totaisFiltrados.totalBruto.toFixed(2) : '',
      totaisFiltrados.totalFilhos || '',
      totaisFiltrados.totalInss.toFixed(2),
      totaisFiltrados.totalFamilia.toFixed(2),
      totaisFiltrados.totalIr.toFixed(2),
      totaisFiltrados.totalQuinzena.toFixed(2),
      totaisFiltrados.totalAdiantamento.toFixed(2),
      totaisFiltrados.totalGratificacao.toFixed(2),
      totaisFiltrados.totalMensalLiquido.toFixed(2),
      totaisFiltrados.totalProducao.toFixed(2),
      totaisFiltrados.totalComissao.toFixed(2),
      '',
      '',
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [cabecalho.join(';'), ...linhas.map((e) => e.join(';')), linhaTotal.join(';')].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `folha-${competenciaAtiva}-${empresaAtiva?.slug || 'gcmix'}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'CSV exportado!',
      description: `Arquivo da folha ${competenciaAtiva} baixado com sucesso.`,
    })
  }

  // Formatação em R$ (pt-BR)
  const formatMoeda = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* CABEÇALHO EXCLUSIVO DE IMPRESSÃO A4 (Padrão Relatório Geral) */}
      {/* ======================================================== */}
      <div className="print-only border-b-2 border-black pb-3 mb-4 text-black bg-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-black leading-tight">
                GC MIX CONCRETO USINADO • {empresaAtiva?.nome?.toUpperCase() || ''}
              </h1>
              <p className="text-xs font-bold text-black">
                Folha Mensal de Pagamento — Unidade {empresaAtiva?.slug?.toUpperCase() || 'SJE'}
              </p>
              {empresaAtiva?.cnpj && (
                <p className="text-[10px] text-gray-700">
                  CNPJ: {empresaAtiva.cnpj}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[10px] text-black">
            <p className="font-bold">
              Competência: <strong>{labelCompetencia}</strong> ({competenciaAtiva})
            </p>
            <p>Emissão: {new Date().toLocaleString('pt-BR')}</p>
            <p>Empresa: {empresaAtiva?.nome}</p>
          </div>
        </div>

        {/* Quadro resumo na impressão geral */}
        <div className="mt-3 grid grid-cols-4 gap-2 p-2 bg-gray-100 border border-gray-400 rounded text-xs text-black font-mono">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block font-sans">
              Total Colaboradores
            </span>
            <strong className="text-sm">
              {totaisCompetencia.totalRegistros} ({totaisCompetencia.totalFuncionarios} F / {totaisCompetencia.totalTerceiros} T)
            </strong>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block font-sans">
              Total Bruto
            </span>
            <strong className="text-sm">
              R$ {formatMoeda(totaisCompetencia.totalBruto)}
            </strong>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block font-sans">
              INSS Retido
            </span>
            <strong className="text-sm text-red-700">
              R$ {formatMoeda(totaisCompetencia.totalInss)}
            </strong>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block font-sans">
              Líquido da Folha
            </span>
            <strong className="text-sm text-black">
              R$ {formatMoeda(totaisCompetencia.totalMensalLiquido)}
            </strong>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CABEÇALHO DA TELA NA APLICAÇÃO */}
      {/* ======================================================== */}
      <div className="no-print flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-border/60 shadow-sm shrink-0">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[210px] object-contain rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
              <span>Folha de Pagamento</span>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold"
              >
                {empresaAtiva?.nome || 'Unidade'}
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono font-bold">
                {labelCompetencia || competenciaAtiva}
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gestão de proventos, deduções, horas/produção, comissões, terceiros e holerites individuais
            </p>
          </div>
        </div>

        {/* Barra de ações superiores */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Seletor de Competência */}
          <div className="flex items-center gap-1.5 bg-card border border-border/50 rounded-lg px-2.5 py-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              Mês:
            </span>
            <input
              type="month"
              value={competenciaAtiva}
              onChange={(e) => setCompetenciaAtiva(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleNovoColaborador}
            className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalImportarOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Upload className="w-4 h-4 text-primary" />
            Importar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCSV}
            className="gap-1.5 text-xs"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir A4
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={carregarLinhasFolha}
            disabled={loading}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARDS COM MÉTRICAS PRINCIPAIS DA FOLHA REAL */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registros */}
        <Card className="bg-gradient-to-br from-card/90 to-card/50 border-border/50 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Colaboradores
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {totaisFiltrados.totalRegistros}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {totaisFiltrados.totalFuncionarios} Funcionários
              </span>
              <span>•</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {totaisFiltrados.totalTerceiros} Terceiros
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Salário Bruto */}
        <Card className="bg-gradient-to-br from-card/90 to-card/50 border-border/50 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Bruto
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              R$ {formatMoeda(totaisFiltrados.totalBruto)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Família: R$ {formatMoeda(totaisFiltrados.totalFamilia)}</span>
              <span>•</span>
              <span>Gratif: R$ {formatMoeda(totaisFiltrados.totalGratificacao)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Descontos (INSS + IR + Quinzena + Adiantamento) */}
        <Card className="bg-gradient-to-br from-card/90 to-card/50 border-border/50 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              INSS & Quinzena
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              R$ {formatMoeda(totaisFiltrados.totalInss + totaisFiltrados.totalQuinzena)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              INSS: R$ {formatMoeda(totaisFiltrados.totalInss)} | Quinzena: R${' '}
              {formatMoeda(totaisFiltrados.totalQuinzena)}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Líquido Mensal a Pagar */}
        <Card className="bg-gradient-to-br from-card/90 via-card/70 to-primary/10 border-primary/40 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-primary uppercase tracking-wider">
              Total Líquido Mensal
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
              R$ {formatMoeda(totaisFiltrados.totalMensalLiquido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Prod: R$ {formatMoeda(totaisFiltrados.totalProducao)}</span>
              <span>•</span>
              <span>Comis: R$ {formatMoeda(totaisFiltrados.totalComissao)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* FILTROS E BUSCA */}
      {/* ======================================================== */}
      <Card className="no-print bg-card/60 border-border/40 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador, função, unidade, conta ou PIX..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Tipo: Funcionario vs Terceiro */}
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Funcionario">Funcionários</SelectItem>
                  <SelectItem value="Terceiro">Terceiros</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Função */}
              <Select value={funcaoFiltro} onValueChange={setFuncaoFiltro}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Funções</SelectItem>
                  {funcoesDisponiveis.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Histórico de competências */}
              {competencias.length > 0 && (
                <Select
                  value={competenciaAtiva}
                  onValueChange={setCompetenciaAtiva}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs font-mono font-bold">
                    <SelectValue placeholder="Competência" />
                  </SelectTrigger>
                  <SelectContent>
                    {competencias.map((comp) => (
                      <SelectItem
                        key={comp.id}
                        value={comp.competencia}
                        className="font-mono text-xs"
                      >
                        {comp.competencia} ({comp.total_colaboradores} reg.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Badge
                variant="outline"
                className="text-xs font-mono py-1 px-2.5 h-9 flex items-center"
              >
                {linhasFiltradas.length} de {linhasFolha.length} listados
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* TABELA PRINCIPAL DA FOLHA (COM TODAS AS COLUNAS DO ANEXO) */}
      {/* ======================================================== */}
      <Card className="border-border/40 bg-card/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>
                Quadro Geral da Folha — {labelCompetencia || competenciaAtiva}
              </span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Empresa ativa: <strong>{empresaAtiva?.nome}</strong>. Linhas de
              Terceiro destacadas em amarelo. Totais somados no rodapé.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            >
              Líquido Total: R$ {formatMoeda(totaisFiltrados.totalMensalLiquido)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/50 border-b border-border/40 font-semibold select-none">
                <tr>
                  <th className="py-2.5 px-2.5">Tipo</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Nome</th>
                  <th className="py-2.5 px-2.5 min-w-[110px]">Função</th>
                  <th className="py-2.5 px-2 text-center">Unid</th>
                  <th className="py-2.5 px-2 text-right">Bruto</th>
                  <th className="py-2.5 px-1.5 text-center">Filhos</th>
                  <th className="py-2.5 px-2 text-right">INSS</th>
                  <th className="py-2.5 px-2 text-right">Família</th>
                  <th className="py-2.5 px-2 text-right">IR</th>
                  <th className="py-2.5 px-2 text-right">Quinzena</th>
                  <th className="py-2.5 px-2 text-right">Adiant.</th>
                  <th className="py-2.5 px-2 text-right">Gratif.</th>
                  <th className="py-2.5 px-2.5 text-right font-black text-foreground bg-muted/40">
                    Líquido Mensal
                  </th>
                  <th className="py-2.5 px-2 text-right">Produção</th>
                  <th className="py-2.5 px-2 text-right">Comissão</th>
                  <th className="py-2.5 px-2.5">Conta</th>
                  <th className="py-2.5 px-2.5">PIX</th>
                  <th className="py-2.5 px-2.5 text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 font-mono text-[11px]">
                {linhasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={18}
                      className="py-12 text-center text-muted-foreground font-sans"
                    >
                      {loading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                          <span>Carregando folha de pagamento...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40" />
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              Nenhum registro para {labelCompetencia || competenciaAtiva}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Importe a folha via CSV ou adicione um novo colaborador.
                            </p>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setModalImportarOpen(true)}
                              className="gap-1.5 bg-primary text-primary-foreground"
                            >
                              <Upload className="w-4 h-4" />
                              Importar CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNovoColaborador}
                              className="gap-1.5"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar Manualmente
                            </Button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  linhasFiltradas.map((linha) => {
                    const isTerceiro = linha.tipo === 'Terceiro'

                    return (
                      <tr
                        key={linha.id}
                        className={`hover:bg-muted/25 transition-colors ${
                          isTerceiro ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Tipo */}
                        <td className="py-2 px-2.5 font-sans">
                          {isTerceiro ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-bold text-[10px] px-1.5 py-0"
                            >
                              Terceiro
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0"
                            >
                              Func.
                            </Badge>
                          )}
                        </td>

                        {/* Nome */}
                        <td className="py-2 px-3 font-sans font-bold text-foreground">
                          <span
                            onClick={() => setHoleriteModal(linha)}
                            className="cursor-pointer hover:underline hover:text-primary transition-colors block"
                            title="Clique para ver o holerite individual"
                          >
                            {linha.nome}
                          </span>
                        </td>

                        {/* Função */}
                        <td className="py-2 px-2.5 font-sans text-muted-foreground text-[11px]">
                          {linha.funcao}
                        </td>

                        {/* Unidade */}
                        <td className="py-2 px-2 text-center font-sans font-semibold text-[10px] text-muted-foreground">
                          {linha.unidade}
                        </td>

                        {/* Bruto */}
                        <td className="py-2 px-2 text-right">
                          {linha.bruto > 0 ? (
                            formatMoeda(linha.bruto)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Filhos */}
                        <td className="py-2 px-1.5 text-center text-muted-foreground">
                          {linha.filhos > 0 ? linha.filhos : '0'}
                        </td>

                        {/* INSS */}
                        <td className="py-2 px-2 text-right text-rose-600 dark:text-rose-400">
                          {linha.inss > 0 ? (
                            formatMoeda(linha.inss)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Família */}
                        <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                          {linha.familia > 0 ? (
                            formatMoeda(linha.familia)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* IR */}
                        <td className="py-2 px-2 text-right text-rose-600 dark:text-rose-400">
                          {linha.ir > 0 ? (
                            formatMoeda(linha.ir)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Quinzena */}
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          {linha.quinzena > 0 ? (
                            formatMoeda(linha.quinzena)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Adiantamento */}
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          {linha.adiantamento > 0 ? (
                            formatMoeda(linha.adiantamento)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Gratificação */}
                        <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                          {linha.gratificacao > 0 ? (
                            formatMoeda(linha.gratificacao)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Mensal Líquido */}
                        <td className="py-2 px-2.5 text-right font-black text-foreground bg-muted/20">
                          <div className="flex items-center justify-end gap-1">
                            <span>{formatMoeda(linha.mensal_liquido)}</span>
                            {linha.modo_calculo === 'Digitado' && (
                              <Badge
                                variant="outline"
                                className="font-sans text-[8px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20"
                                title="Valor fixado manualmente"
                              >
                                Dig.
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Produção */}
                        <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                          {linha.producao > 0 ? (
                            formatMoeda(linha.producao)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Comissão */}
                        <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                          {linha.comissao > 0 ? (
                            formatMoeda(linha.comissao)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Conta */}
                        <td className="py-2 px-2.5 font-sans text-muted-foreground text-[10px] truncate max-w-[130px]">
                          {linha.conta || '—'}
                        </td>

                        {/* PIX */}
                        <td className="py-2 px-2.5 font-sans text-muted-foreground text-[10px] truncate max-w-[150px]">
                          {linha.pix || '—'}
                        </td>

                        {/* Ações */}
                        <td className="py-2 px-2.5 text-center font-sans no-print">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setHoleriteModal(linha)}
                              className="h-7 w-7 text-primary hover:bg-primary/10"
                              title="Ver Holerite"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarColaborador(linha)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Editar Linha"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLinhaParaExcluir(linha)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* ======================================================== */}
              {/* LINHA DE TOTAL NO RODAPÉ (SOMATÓRIOS DO ANEXO) */}
              {/* ======================================================== */}
              {linhasFiltradas.length > 0 && (
                <tfoot className="bg-muted/70 font-mono text-[11px] font-bold border-t-2 border-border/60">
                  <tr>
                    <td className="py-3 px-2.5 font-sans uppercase text-[10px] font-black text-foreground">
                      TOTAL
                    </td>
                    <td className="py-3 px-3 font-sans text-xs">
                      {totaisFiltrados.totalRegistros} colaboradores
                    </td>
                    <td className="py-3 px-2.5 font-sans text-[10px] text-muted-foreground">
                      {totaisFiltrados.totalFuncionarios} F / {totaisFiltrados.totalTerceiros} T
                    </td>
                    <td></td>
                    {/* Bruto */}
                    <td className="py-3 px-2 text-right">
                      {formatMoeda(totaisFiltrados.totalBruto)}
                    </td>
                    {/* Filhos */}
                    <td className="py-3 px-1.5 text-center">
                      {totaisFiltrados.totalFilhos}
                    </td>
                    {/* INSS */}
                    <td className="py-3 px-2 text-right text-rose-600 dark:text-rose-400">
                      {formatMoeda(totaisFiltrados.totalInss)}
                    </td>
                    {/* Família */}
                    <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                      {formatMoeda(totaisFiltrados.totalFamilia)}
                    </td>
                    {/* IR */}
                    <td className="py-3 px-2 text-right text-rose-600 dark:text-rose-400">
                      {formatMoeda(totaisFiltrados.totalIr)}
                    </td>
                    {/* Quinzena */}
                    <td className="py-3 px-2 text-right">
                      {formatMoeda(totaisFiltrados.totalQuinzena)}
                    </td>
                    {/* Adiantamento */}
                    <td className="py-3 px-2 text-right">
                      {formatMoeda(totaisFiltrados.totalAdiantamento)}
                    </td>
                    {/* Gratificação */}
                    <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                      {formatMoeda(totaisFiltrados.totalGratificacao)}
                    </td>
                    {/* Líquido Mensal */}
                    <td className="py-3 px-2.5 text-right font-black text-foreground bg-muted/40 text-xs">
                      {formatMoeda(totaisFiltrados.totalMensalLiquido)}
                    </td>
                    {/* Produção */}
                    <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                      {formatMoeda(totaisFiltrados.totalProducao)}
                    </td>
                    {/* Comissão */}
                    <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                      {formatMoeda(totaisFiltrados.totalComissao)}
                    </td>
                    <td colSpan={2}></td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* MODAL PARA INCLUIR / EDITAR COLABORADOR DA FOLHA */}
      {/* ======================================================== */}
      {modalFormOpen && linhaEditando && (
        <Dialog open={modalFormOpen} onOpenChange={setModalFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>
                  {linhaEditando.id ? 'Editar Colaborador na Folha' : 'Novo Registro de Folha'}
                </span>
                <Badge variant="outline" className="text-xs font-mono ml-2">
                  {competenciaAtiva}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Preencha todos os proventos, deduções e dados bancários. O Líquido
                Mensal é calculado automaticamente pela fórmula oficial, com opção
                de sobrescrever se necessário.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Identificação Geral */}
              <div className="p-3 bg-muted/30 rounded-xl space-y-3 border border-border/40">
                <div className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Identificação do Colaborador</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Tipo:
                    </span>
                    <select
                      value={linhaEditando.tipo || 'Funcionario'}
                      onChange={(e) =>
                        handleCampoFormChange('tipo', e.target.value as TipoColaboradorFolha)
                      }
                      className="bg-card border border-border/60 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Funcionario">Funcionario</option>
                      <option value="Terceiro">Terceiro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px]">Nome Completo *</Label>
                    <Input
                      value={linhaEditando.nome || ''}
                      onChange={(e) =>
                        handleCampoFormChange('nome', e.target.value.toUpperCase())
                      }
                      placeholder="Ex: CARLOS ALBERTO FERREIRA"
                      className="h-8 text-xs font-semibold uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Função / Cargo</Label>
                    <Input
                      value={linhaEditando.funcao || ''}
                      onChange={(e) =>
                        handleCampoFormChange('funcao', e.target.value.toUpperCase())
                      }
                      placeholder="Ex: MOTORISTA, BALANCEIRO..."
                      className="h-8 text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Unidade Operacional</Label>
                    <Input
                      value={linhaEditando.unidade || 'SJE'}
                      onChange={(e) =>
                        handleCampoFormChange('unidade', e.target.value.toUpperCase())
                      }
                      placeholder="SJE ou Monteiro"
                      className="h-8 text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Qtd. Filhos (Dependentes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={linhaEditando.filhos ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('filhos', parseInt(e.target.value, 10) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Valores Proventos e Deduções */}
              <div className="p-3 bg-card rounded-xl border border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Valores Salariais (R$)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">Modo do Líquido:</span>
                    <Badge
                      variant={linhaEditando.modo_calculo === 'Digitado' ? 'secondary' : 'default'}
                      onClick={() =>
                        handleCampoFormChange(
                          'modo_calculo',
                          linhaEditando.modo_calculo === 'Digitado' ? 'Calculado' : 'Digitado',
                        )
                      }
                      className="cursor-pointer text-[10px] select-none"
                    >
                      {linhaEditando.modo_calculo === 'Digitado' ? 'Digitado (Manual)' : 'Calculado (Auto)'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Salário Bruto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.bruto ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('bruto', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-rose-600 dark:text-rose-400">INSS Retido</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.inss ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('inss', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-emerald-600 dark:text-emerald-400">Salário Família</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.familia ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('familia', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-rose-600 dark:text-rose-400">IRRF (Imposto Renda)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.ir ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('ir', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">1ª Quinzena</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.quinzena ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('quinzena', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Adiantamento</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.adiantamento ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('adiantamento', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Gratificação</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.gratificacao ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('gratificacao', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Produção</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.producao ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('producao', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Comissão</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEditando.comissao ?? 0}
                      onChange={(e) =>
                        handleCampoFormChange('comissao', parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  {/* Campo Líquido Mensal */}
                  <div className="col-span-2 sm:col-span-3 space-y-1 bg-muted/40 p-2 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-foreground">
                        Líquido Mensal (R$)
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Bruto - INSS - IR + Fam + Grat - Quinz - Adiant + Prod + Comis
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={linhaEditando.mensal_liquido ?? 0}
                        onChange={(e) => {
                          handleCampoFormChange('modo_calculo', 'Digitado')
                          handleCampoFormChange('mensal_liquido', parseFloat(e.target.value) || 0)
                        }}
                        className="h-8 text-xs font-mono font-black text-foreground bg-background"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const liq = calcularMensalLiquido(linhaEditando)
                          handleCampoFormChange('mensal_liquido', liq)
                          handleCampoFormChange('modo_calculo', 'Calculado')
                        }}
                        className="text-[11px] h-8 shrink-0 gap-1"
                        title="Recalcular com base na fórmula oficial"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        Recalcular
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              <div className="p-3 bg-muted/30 rounded-xl space-y-3 border border-border/40">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                  Dados de Pagamento Bancário
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Conta Bancária (Agência / Conta)</Label>
                    <Input
                      value={linhaEditando.conta || ''}
                      onChange={(e) => handleCampoFormChange('conta', e.target.value)}
                      placeholder="Ex: 1563/82316-4"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Chave PIX (Telefone, E-mail, CPF, Chave)</Label>
                    <Input
                      value={linhaEditando.pix || ''}
                      onChange={(e) => handleCampoFormChange('pix', e.target.value)}
                      placeholder="Ex: 87999146340 ou email@exemplo.com"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalFormOpen(false)}
                disabled={salvandoLinha}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSalvarLinha}
                disabled={salvandoLinha}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                {salvandoLinha ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Salvar Colaborador
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ======================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ======================================================== */}
      {linhaParaExcluir && (
        <Dialog
          open={Boolean(linhaParaExcluir)}
          onOpenChange={(v) => !v && setLinhaParaExcluir(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirmar Exclusão</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Deseja remover <strong>{linhaParaExcluir.nome}</strong> da folha
                de <strong>{competenciaAtiva}</strong>? Essa ação é exclusiva do
                administrador.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-2 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinhaParaExcluir(null)}
                disabled={excluindoLinha}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmarExclusao}
                disabled={excluindoLinha}
                className="gap-1.5 font-semibold"
              >
                {excluindoLinha ? 'Excluindo...' : 'Sim, Excluir Registro'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ======================================================== */}
      {/* MODAL / HOLERITE INDIVIDUAL EM FORMATO OFICIAL A4 */}
      {/* ======================================================== */}
      {holeriteModal && (
        <Dialog
          open={Boolean(holeriteModal)}
          onOpenChange={(v) => !v && setHoleriteModal(null)}
        >
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader className="no-print">
              <div className="flex items-center justify-between pr-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <DialogTitle className="text-base font-bold">
                    Demonstrativo Individual de Pagamento
                  </DialogTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs h-8"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Holerite A4
                </Button>
              </div>
              <DialogDescription className="text-xs">
                {empresaAtiva?.nome} • Competência {labelCompetencia} ({competenciaAtiva})
              </DialogDescription>
            </DialogHeader>

            {/* Quadro Holerite Formatado (A4 friendly, fundo branco ao imprimir) */}
            <div className="p-4 bg-white text-black rounded-xl border border-gray-300 space-y-4 print-holerite">
              {/* Cabeçalho do Holerite */}
              <div className="flex justify-between items-start border-b-2 border-black pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={LOGO_GC_MIX_HORIZONTAL}
                    alt={LOGO_ALT_TEXT}
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-sm font-black uppercase text-black leading-tight">
                      GC MIX CONCRETO USINADO
                    </h2>
                    <p className="text-[11px] font-bold text-gray-800">
                      {empresaAtiva?.razao_social || empresaAtiva?.nome}
                    </p>
                    {empresaAtiva?.cnpj && (
                      <p className="text-[10px] text-gray-600">
                        CNPJ: {empresaAtiva.cnpj}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-black">
                  <p className="font-black text-xs uppercase">
                    Recibo de Pagamento
                  </p>
                  <p className="font-bold">
                    Competência: <strong>{labelCompetencia}</strong>
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Unidade: {holeriteModal.unidade || empresaAtiva?.slug?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Dados do Colaborador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-gray-100 rounded border border-gray-300 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 block">
                    Nome Colaborador
                  </span>
                  <strong className="text-xs block truncate text-black">
                    {holeriteModal.nome}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 block">
                    Função / Cargo
                  </span>
                  <span className="text-black font-semibold">
                    {holeriteModal.funcao}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 block">
                    Tipo de Vínculo
                  </span>
                  <span className="text-black font-semibold">
                    {holeriteModal.tipo}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 block">
                    Dependentes / Filhos
                  </span>
                  <span className="text-black font-semibold font-mono">
                    {holeriteModal.filhos}
                  </span>
                </div>
              </div>

              {/* Tabela de Eventos (Proventos e Descontos) */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-200 border-b border-gray-400 text-[10px] font-black uppercase text-gray-800">
                    <th className="py-1.5 px-2 text-left">Descrição do Evento</th>
                    <th className="py-1.5 px-2 text-right">Proventos (R$)</th>
                    <th className="py-1.5 px-2 text-right">Descontos (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono text-xs text-black">
                  {holeriteModal.bruto > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Salário Base / Bruto</td>
                      <td className="py-1.5 px-2 text-right">
                        {formatMoeda(holeriteModal.bruto)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                    </tr>
                  )}
                  {holeriteModal.familia > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Salário Família</td>
                      <td className="py-1.5 px-2 text-right text-green-700 font-semibold">
                        {formatMoeda(holeriteModal.familia)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                    </tr>
                  )}
                  {holeriteModal.gratificacao > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Gratificação</td>
                      <td className="py-1.5 px-2 text-right text-green-700 font-semibold">
                        {formatMoeda(holeriteModal.gratificacao)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                    </tr>
                  )}
                  {holeriteModal.producao > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Produção</td>
                      <td className="py-1.5 px-2 text-right text-green-700 font-semibold">
                        {formatMoeda(holeriteModal.producao)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                    </tr>
                  )}
                  {holeriteModal.comissao > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Comissão</td>
                      <td className="py-1.5 px-2 text-right text-green-700 font-semibold">
                        {formatMoeda(holeriteModal.comissao)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                    </tr>
                  )}
                  {holeriteModal.inss > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Previdência Social - INSS</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                      <td className="py-1.5 px-2 text-right text-red-700 font-semibold">
                        {formatMoeda(holeriteModal.inss)}
                      </td>
                    </tr>
                  )}
                  {holeriteModal.ir > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Imposto de Renda - IRRF</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                      <td className="py-1.5 px-2 text-right text-red-700 font-semibold">
                        {formatMoeda(holeriteModal.ir)}
                      </td>
                    </tr>
                  )}
                  {holeriteModal.quinzena > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">1ª Quinzena</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                      <td className="py-1.5 px-2 text-right text-red-700 font-semibold">
                        {formatMoeda(holeriteModal.quinzena)}
                      </td>
                    </tr>
                  )}
                  {holeriteModal.adiantamento > 0 && (
                    <tr>
                      <td className="py-1.5 px-2 font-sans">Adiantamento</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                      <td className="py-1.5 px-2 text-right text-red-700 font-semibold">
                        {formatMoeda(holeriteModal.adiantamento)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-black font-bold">
                  <tr className="bg-gray-100">
                    <td className="py-2 px-2 uppercase font-sans">Totais</td>
                    <td className="py-2 px-2 text-right text-green-800 font-mono">
                      R${' '}
                      {formatMoeda(
                        holeriteModal.bruto +
                          holeriteModal.familia +
                          holeriteModal.gratificacao +
                          holeriteModal.producao +
                          holeriteModal.comissao,
                      )}
                    </td>
                    <td className="py-2 px-2 text-right text-red-800 font-mono">
                      R${' '}
                      {formatMoeda(
                        holeriteModal.inss +
                          holeriteModal.ir +
                          holeriteModal.quinzena +
                          holeriteModal.adiantamento,
                      )}
                    </td>
                  </tr>
                  <tr className="bg-gray-200 border-t border-gray-400 text-sm">
                    <td className="py-2.5 px-2 uppercase font-black font-sans text-black">
                      Valor Líquido a Receber
                    </td>
                    <td
                      colSpan={2}
                      className="py-2.5 px-2 text-right font-black font-mono text-base text-black"
                    >
                      R$ {formatMoeda(holeriteModal.mensal_liquido)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Informações bancárias para pagamento */}
              {(holeriteModal.conta || holeriteModal.pix) && (
                <div className="p-2.5 bg-gray-50 border border-gray-300 rounded text-xs text-black">
                  <strong className="block uppercase text-[10px] text-gray-700 mb-1">
                    Dados Cadastrados para Pagamento
                  </strong>
                  {holeriteModal.conta && (
                    <p>
                      <strong>Conta Bancária:</strong> {holeriteModal.conta}
                    </p>
                  )}
                  {holeriteModal.pix && (
                    <p className="font-mono">
                      <strong>Chave PIX:</strong> {holeriteModal.pix}
                    </p>
                  )}
                </div>
              )}

              {/* Assinatura */}
              <div className="pt-8 border-t border-gray-300 mt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-black pt-1 font-semibold text-black">
                    GC MIX CONCRETO USINADO
                  </div>
                  <span className="text-[10px] text-gray-600">Empregador</span>
                </div>
                <div>
                  <div className="border-t border-black pt-1 font-semibold text-black">
                    {holeriteModal.nome}
                  </div>
                  <span className="text-[10px] text-gray-600">Assinatura do Colaborador</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Importação CSV */}
      <ModalImportarFolhaCSV
        open={modalImportarOpen}
        onOpenChange={setModalImportarOpen}
        linhasAtuais={linhasFolha}
        competenciaAtiva={competenciaAtiva}
        onImportadoSucesso={(novaComp) => {
          setCompetenciaAtiva(novaComp)
          carregarCompetencias()
          carregarLinhasFolha()
        }}
      />
    </div>
  )
}
