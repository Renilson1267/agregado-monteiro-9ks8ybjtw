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
} from '@/components/ui/dialog'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { FolhaService } from '@/services/folha'
import {
  FolhaCompetencia,
  FolhaPagamentoLinha,
  FolhaResumoTotais,
} from '@/types/folha'
import { ModalImportarFolhaCSV } from '@/components/ModalImportarFolhaCSV'
import { formatarCpfCnpj } from '@/lib/documentos'
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from '@/assets/logos'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Search,
  Filter,
  Download,
  Printer,
  Upload,
  RefreshCw,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Layers,
  Percent,
  CheckCircle2,
  Wallet,
  Clock,
  Briefcase,
  AlertCircle,
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

  // Filtros na listagem
  const [busca, setBusca] = useState('')
  const [cargoFiltro, setCargoFiltro] = useState<string>('todos')
  const [linhaExpandidaId, setLinhaExpandidaId] = useState<string | null>(null)
  const [funcionarioModal, setFuncionarioModal] =
    useState<FolhaPagamentoLinha | null>(null)

  // Carrega competências disponíveis para a empresa
  const carregarCompetencias = async () => {
    if (!empresaAtiva) return
    try {
      const comps = await FolhaService.getCompetencias(empresaAtiva.id)
      setCompetencias(comps)

      if (comps.length > 0) {
        // Se a competência ativa ainda não existe na lista, seleciona a primeira mais recente
        if (!comps.some((c) => c.competencia === competenciaAtiva)) {
          setCompetenciaAtiva(comps[0].competencia)
        }
      }
    } catch (e) {
      console.error('Erro ao carregar competências:', e)
    }
  }

  // Carrega linhas da folha para a competência ativa
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
        description: 'Não foi possível carregar os dados desta competência.',
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

  // Lista de cargos únicos para o filtro
  const cargosDisponiveis = useMemo(() => {
    const s = new Set<string>()
    linhasFolha.forEach((l) => {
      if (l.cargo) s.add(l.cargo)
    })
    return Array.from(s).sort()
  }, [linhasFolha])

  // Filtra linhas por busca e cargo
  const linhasFiltradas = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return linhasFolha.filter((l) => {
      if (cargoFiltro !== 'todos' && l.cargo !== cargoFiltro) {
        return false
      }
      if (!q) return true

      const nomeOk = l.nome.toLowerCase().includes(q)
      const cargoOk = l.cargo.toLowerCase().includes(q)
      const cpfOk = l.cpf ? l.cpf.includes(q) : false
      const matOk = l.matricula ? l.matricula.toLowerCase().includes(q) : false
      return nomeOk || cargoOk || cpfOk || matOk
    })
  }, [linhasFolha, busca, cargoFiltro])

  // Totais consolidados
  const totais = useMemo(() => {
    return FolhaService.calcularResumo(linhasFiltradas)
  }, [linhasFiltradas])

  const totaisGerais = useMemo(() => {
    return FolhaService.calcularResumo(linhasFolha)
  }, [linhasFolha])

  // Exportação para CSV da competência
  const handleExportarCSV = () => {
    if (linhasFiltradas.length === 0) {
      toast({
        title: 'Sem dados para exportação',
        description: 'Nenhum registro encontrado na listagem atual.',
        variant: 'destructive',
      })
      return
    }

    const cabecalho = [
      'Empresa',
      'Competencia',
      'Matricula',
      'CPF',
      'Nome Colaborador',
      'Cargo/Funcao',
      'Departamento',
      'Data Admissao',
      'Salario Base (R$)',
      'Horas Extras (R$)',
      'Periculosidade (R$)',
      'Insalubridade (R$)',
      'Outros Proventos (R$)',
      'Total Proventos (R$)',
      'INSS Retido (R$)',
      'IRRF Retido (R$)',
      'Vale Transporte (R$)',
      'Adiantamentos (R$)',
      'Outros Descontos (R$)',
      'Total Descontos (R$)',
      'Salario Liquido (R$)',
      'Base FGTS (R$)',
      'FGTS Mes (R$)',
      'Banco',
      'Conta',
      'Chave PIX',
    ]

    const linhas = linhasFiltradas.map((l) => [
      `"${empresaAtiva?.nome || ''}"`,
      `"${l.competencia}"`,
      `"${l.matricula || ''}"`,
      `"${l.cpf ? formatarCpfCnpj(l.cpf) : ''}"`,
      `"${l.nome}"`,
      `"${l.cargo}"`,
      `"${l.departamento || ''}"`,
      `"${l.data_admissao || ''}"`,
      l.salario_base.toFixed(2),
      l.valor_horas_extras.toFixed(2),
      l.adicional_periculosidade.toFixed(2),
      l.adicional_insalubridade.toFixed(2),
      l.outros_proventos.toFixed(2),
      l.total_proventos.toFixed(2),
      l.inss_retido.toFixed(2),
      l.irrf_retido.toFixed(2),
      l.vale_transporte.toFixed(2),
      l.adiantamento.toFixed(2),
      l.outros_descontos.toFixed(2),
      l.total_descontos.toFixed(2),
      l.salario_liquido.toFixed(2),
      l.base_fgts.toFixed(2),
      l.fgts_mes.toFixed(2),
      `"${l.banco || ''}"`,
      `"${l.conta || ''}"`,
      `"${l.chave_pix || ''}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [cabecalho.join(';'), ...linhas.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Folha_${empresaAtiva?.slug || 'GC_MIX'}_${competenciaAtiva}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'CSV exportado com sucesso!',
      description: `Arquivo da competência ${competenciaAtiva} gerado.`,
    })
  }

  // Impressão oficial A4 GC MIX
  const handleImprimir = () => {
    window.print()
  }

  const toggleExpandir = (id: string) => {
    setLinhaExpandidaId(linhaExpandidaId === id ? null : id)
  }

  // Formata competência legível (ex: 2026-09 -> Setembro / 2026)
  const labelCompetencia = useMemo(() => {
    if (!competenciaAtiva) return ''
    const [ano, mes] = competenciaAtiva.split('-')
    const dataObj = new Date(Number(ano), Number(mes) - 1, 1)
    const nomeMes = dataObj.toLocaleDateString('pt-BR', { month: 'long' })
    return `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} / ${ano}`
  }, [competenciaAtiva])

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* CABEÇALHO EXCLUSIVO DE IMPRESSÃO A4 (visível apenas ao imprimir) */}
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
                {empresaAtiva?.razao_social ||
                  `GC MIX CONCRETO USINADO • ${empresaAtiva?.nome?.toUpperCase() || ''}`}
              </h1>
              <p className="text-xs font-bold text-black">
                Relatório Geral de Folha de Pagamento — Sintético & Analítico
              </p>
              {empresaAtiva?.cnpj && (
                <p className="text-[10px] text-gray-700">
                  CNPJ: {empresaAtiva.cnpj}{' '}
                  {empresaAtiva.telefone ? `• Tel: ${empresaAtiva.telefone}` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[10px] text-black">
            <p className="font-bold">
              Competência: <strong>{labelCompetencia}</strong> (
              {competenciaAtiva})
            </p>
            <p>Emissão: {new Date().toLocaleString('pt-BR')}</p>
            <p>Unidade: {empresaAtiva?.nome || 'Principal'}</p>
          </div>
        </div>

        {/* Quadro de Totais da Folha na Impressão */}
        <div className="mt-3 grid grid-cols-4 gap-2 p-2 bg-gray-100 border border-gray-400 rounded text-xs text-black">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block">
              Colaboradores
            </span>
            <strong className="text-sm font-mono">
              {totais.totalColaboradores}
            </strong>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block">
              Total Proventos
            </span>
            <strong className="text-sm font-mono">
              R${' '}
              {totais.totalProventos.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block">
              Total Descontos
            </span>
            <strong className="text-sm font-mono text-red-700">
              R${' '}
              {totais.totalDescontos.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-600 block">
              Líquido a Pagar
            </span>
            <strong className="text-sm font-mono text-black">
              R${' '}
              {totais.totalLiquido.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BANNER PRINCIPAL NA TELA NORMAL */}
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
              <Badge
                variant="secondary"
                className="text-xs font-mono font-bold"
              >
                {labelCompetencia || competenciaAtiva}
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gestão salarial, proventos, deduções, encargos (INSS/FGTS) e
              exportação oficial multi-empresa
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
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
            onClick={() => setModalImportarOpen(true)}
            className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
          >
            <Upload className="w-4 h-4" />
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
            onClick={handleImprimir}
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
      {/* GRID DE CARDS DE RESUMO FINANCEIRO (ESTILO ERP PEDREIRA) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Colaboradores Ativos na Folha */}
        <Card className="bg-gradient-to-br from-card/90 to-card/50 border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
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
              {totais.totalColaboradores}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>{cargosDisponiveis.length} funções distintas</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-primary font-medium">
                {empresaAtiva?.nome}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Bruto / Proventos */}
        <Card className="bg-gradient-to-br from-card/90 to-card/50 border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Proventos (Bruto)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              R${' '}
              {totais.totalProventos.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Salário base: R${' '}
              {totais.totalSalarioBase.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Descontos */}
        <Card className="bg-gradient-to-br from-card/90 to-card/50 border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Total Descontos
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              R${' '}
              {totais.totalDescontos.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              INSS: R${' '}
              {totais.totalInssRetido.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              | IRRF: R${' '}
              {totais.totalIrrfRetido.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Líquido a Pagar */}
        <Card className="bg-gradient-to-br from-card/90 via-card/70 to-primary/10 border-primary/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-primary uppercase tracking-wider">
              Líquido da Folha
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
              R${' '}
              {totais.totalLiquido.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
              <span>
                FGTS (8%): R${' '}
                {totais.totalFgts.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE FILTROS E BUSCA */}
      {/* ======================================================== */}
      <Card className="no-print bg-card/60 border-border/40 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador, CPF, matrícula ou cargo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <Select value={cargoFiltro} onValueChange={setCargoFiltro}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Filtrar por Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Funções</SelectItem>
                    {cargosDisponiveis.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {competencias.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Histórico:</span>
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
                          {comp.competencia} ({comp.total_colaboradores} colab.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
      {/* TABELA DE COLABORADORES DA FOLHA */}
      {/* ======================================================== */}
      <Card className="border-border/40 bg-card/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>
                Demonstrativo de Folha — {labelCompetencia || competenciaAtiva}
              </span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Valores calculados por colaborador na empresa {empresaAtiva?.nome}.
              Clique em uma linha para ver a composição detalhada.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            >
              Líquido: R${' '}
              {totais.totalLiquido.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Colaborador / CPF</th>
                  <th className="py-3 px-3">Cargo / Função</th>
                  <th className="py-3 px-3 text-right">Salário Base</th>
                  <th className="py-3 px-3 text-right">Proventos</th>
                  <th className="py-3 px-3 text-right">Descontos</th>
                  <th className="py-3 px-3 text-right font-bold text-foreground">
                    Salário Líquido
                  </th>
                  <th className="py-3 px-3 text-right">FGTS Mês</th>
                  <th className="py-3 px-3 text-center no-print">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {linhasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {loading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                          <span>Carregando dados da folha...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40" />
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              Nenhuma folha cadastrada para esta competência (
                              {competenciaAtiva})
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Clique no botão abaixo para importar a planilha CSV
                              da folha de pagamento.
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setModalImportarOpen(true)}
                            className="gap-2 bg-primary text-primary-foreground mt-1"
                          >
                            <Upload className="w-4 h-4" />
                            Importar Folha CSV ({competenciaAtiva})
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  linhasFiltradas.map((linha, idx) => {
                    const expandida = linhaExpandidaId === linha.id

                    return (
                      <>
                        <tr
                          key={linha.id}
                          onClick={() => toggleExpandir(linha.id)}
                          className={`hover:bg-muted/20 transition-colors cursor-pointer ${
                            expandida ? 'bg-muted/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {expandida ? (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-foreground block">
                              {linha.nome}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {linha.cpf
                                ? formatarCpfCnpj(linha.cpf)
                                : linha.matricula
                                  ? `Matr: ${linha.matricula}`
                                  : 'CPF não informado'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-muted/60 text-foreground font-medium">
                              {linha.cargo}
                            </span>
                            {linha.departamento && (
                              <span className="block text-[10px] text-muted-foreground mt-0.5">
                                Setor: {linha.departamento}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            R${' '}
                            {Number(linha.salario_base).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            R${' '}
                            {Number(linha.total_proventos).toLocaleString(
                              'pt-BR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                            R${' '}
                            {Number(linha.total_descontos).toLocaleString(
                              'pt-BR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-foreground">
                            R${' '}
                            {Number(linha.salario_liquido).toLocaleString(
                              'pt-BR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            R${' '}
                            {Number(linha.fgts_mes).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className="py-2.5 px-3 text-center no-print"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFuncionarioModal(linha)}
                              className="h-7 text-xs text-primary hover:bg-primary/10 gap-1 px-2"
                            >
                              Holerite
                            </Button>
                          </td>
                        </tr>

                        {/* Linha Expansível com Detalhamento Completo */}
                        {expandida && (
                          <tr className="bg-muted/15 border-b border-border/30">
                            <td colSpan={9} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Coluna 1: Proventos */}
                                <div className="p-3 bg-card/60 rounded-xl border border-emerald-500/20">
                                  <h5 className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                                    <span>Composição dos Proventos</span>
                                    <span className="font-mono">
                                      R${' '}
                                      {linha.total_proventos.toLocaleString(
                                        'pt-BR',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </h5>
                                  <div className="space-y-1 font-mono text-[11px]">
                                    <div className="flex justify-between py-0.5 border-b border-border/20">
                                      <span className="text-muted-foreground">
                                        Salário Base:
                                      </span>
                                      <span>
                                        R$ {linha.salario_base.toFixed(2)}
                                      </span>
                                    </div>
                                    {linha.valor_horas_extras > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Horas Extras ({linha.horas_extras}h):
                                        </span>
                                        <span>
                                          R$ {linha.valor_horas_extras.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.adicional_periculosidade > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Periculosidade (30%):
                                        </span>
                                        <span>
                                          R${' '}
                                          {linha.adicional_periculosidade.toFixed(
                                            2,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {linha.adicional_insalubridade > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Insalubridade:
                                        </span>
                                        <span>
                                          R${' '}
                                          {linha.adicional_insalubridade.toFixed(
                                            2,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {linha.adicional_noturno > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Adicional Noturno:
                                        </span>
                                        <span>
                                          R${' '}
                                          {linha.adicional_noturno.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.gratificacoes > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Gratificações / Prêmios:
                                        </span>
                                        <span>
                                          R$ {linha.gratificacoes.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.dsr > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          DSR s/ Horas Extras:
                                        </span>
                                        <span>R$ {linha.dsr.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {linha.outros_proventos > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Outros Proventos:
                                        </span>
                                        <span>
                                          R$ {linha.outros_proventos.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Coluna 2: Descontos */}
                                <div className="p-3 bg-card/60 rounded-xl border border-rose-500/20">
                                  <h5 className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                                    <span>Composição dos Descontos</span>
                                    <span className="font-mono">
                                      R${' '}
                                      {linha.total_descontos.toLocaleString(
                                        'pt-BR',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </h5>
                                  <div className="space-y-1 font-mono text-[11px]">
                                    <div className="flex justify-between py-0.5 border-b border-border/20">
                                      <span className="text-muted-foreground">
                                        INSS Retido:
                                      </span>
                                      <span>R$ {linha.inss_retido.toFixed(2)}</span>
                                    </div>
                                    {linha.irrf_retido > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          IRRF Retido:
                                        </span>
                                        <span>
                                          R$ {linha.irrf_retido.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.vale_transporte > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Vale Transporte:
                                        </span>
                                        <span>
                                          R$ {linha.vale_transporte.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.adiantamento > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Adiantamento Salarial / Vale:
                                        </span>
                                        <span>
                                          R$ {linha.adiantamento.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.faltas_atrasos > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Faltas / Atrasos:
                                        </span>
                                        <span>
                                          R$ {linha.faltas_atrasos.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.plano_saude > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Plano de Saúde / Odonto:
                                        </span>
                                        <span>
                                          R$ {linha.plano_saude.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {linha.outros_descontos > 0 && (
                                      <div className="flex justify-between py-0.5 border-b border-border/20">
                                        <span className="text-muted-foreground">
                                          Outros Descontos:
                                        </span>
                                        <span>
                                          R$ {linha.outros_descontos.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Coluna 3: Bases de Cálculo e Dados Bancários */}
                                <div className="p-3 bg-card/60 rounded-xl border border-primary/20 space-y-2">
                                  <h5 className="font-bold text-primary uppercase text-[10px] tracking-wider mb-2">
                                    Bases Legais & Encargos
                                  </h5>
                                  <div className="space-y-1 font-mono text-[11px]">
                                    <div className="flex justify-between py-0.5 border-b border-border/20">
                                      <span className="text-muted-foreground">
                                        Base de Cálculo INSS:
                                      </span>
                                      <span>R$ {linha.base_inss.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-border/20">
                                      <span className="text-muted-foreground">
                                        Base de Cálculo FGTS:
                                      </span>
                                      <span>R$ {linha.base_fgts.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-border/20">
                                      <span className="text-muted-foreground">
                                        FGTS Recolhido (8%):
                                      </span>
                                      <span className="font-bold text-foreground">
                                        R$ {linha.fgts_mes.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {(linha.banco ||
                                    linha.chave_pix ||
                                    linha.conta) && (
                                    <div className="pt-2 border-t border-border/30 text-[10px]">
                                      <span className="font-bold text-foreground block">
                                        Dados para Pagamento:
                                      </span>
                                      {linha.banco && (
                                        <span className="text-muted-foreground block">
                                          Banco: {linha.banco}{' '}
                                          {linha.agencia
                                            ? `Ag: ${linha.agencia}`
                                            : ''}{' '}
                                          {linha.conta
                                            ? `Conta: ${linha.conta}`
                                            : ''}
                                        </span>
                                      )}
                                      {linha.chave_pix && (
                                        <span className="text-muted-foreground block font-mono">
                                          PIX: {linha.chave_pix}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                )}
              </tbody>

              {/* Linha de Totais da Tabela */}
              {linhasFiltradas.length > 0 && (
                <tfoot className="bg-muted/60 font-bold border-t-2 border-border/50">
                  <tr>
                    <td></td>
                    <td className="py-3 px-3 uppercase text-xs">
                      Totais ({linhasFiltradas.length} colaboradores)
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right font-mono">
                      R${' '}
                      {totais.totalSalarioBase.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      R${' '}
                      {totais.totalProventos.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      R${' '}
                      {totais.totalDescontos.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-foreground">
                      R${' '}
                      {totais.totalLiquido.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      R${' '}
                      {totais.totalFgts.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* MODAL DETALHADO DO HOLERITE INDIVIDUAL */}
      {/* ======================================================== */}
      {funcionarioModal && (
        <Dialog
          open={Boolean(funcionarioModal)}
          onOpenChange={(v) => !v && setFuncionarioModal(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
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
                  Imprimir Holerite
                </Button>
              </div>
              <DialogDescription className="text-xs">
                {empresaAtiva?.razao_social || empresaAtiva?.nome} • Competência{' '}
                {labelCompetencia}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 border-y border-border/30 text-xs">
              {/* Cabeçalho do Funcionário */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-xl">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    Nome
                  </span>
                  <span className="font-bold text-foreground">
                    {funcionarioModal.nome}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    Cargo
                  </span>
                  <span>{funcionarioModal.cargo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    CPF
                  </span>
                  <span className="font-mono">
                    {funcionarioModal.cpf
                      ? formatarCpfCnpj(funcionarioModal.cpf)
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    Admissão
                  </span>
                  <span className="font-mono">
                    {funcionarioModal.data_admissao
                      ? funcionarioModal.data_admissao
                          .split('-')
                          .reverse()
                          .join('/')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Tabela de Eventos */}
              <table className="w-full text-xs">
                <thead className="bg-muted/40 uppercase text-[10px] font-bold text-muted-foreground">
                  <tr>
                    <th className="py-1.5 px-2 text-left">Descrição do Evento</th>
                    <th className="py-1.5 px-2 text-right">Vencimentos (R$)</th>
                    <th className="py-1.5 px-2 text-right">Descontos (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-mono">
                  <tr>
                    <td className="py-1.5 px-2">Salário Contratual / Base</td>
                    <td className="py-1.5 px-2 text-right">
                      {funcionarioModal.salario_base.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-muted-foreground">
                      —
                    </td>
                  </tr>
                  {funcionarioModal.valor_horas_extras > 0 && (
                    <tr>
                      <td className="py-1.5 px-2">
                        Horas Extras ({funcionarioModal.horas_extras}h)
                      </td>
                      <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        {funcionarioModal.valor_horas_extras.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        —
                      </td>
                    </tr>
                  )}
                  {funcionarioModal.adicional_periculosidade > 0 && (
                    <tr>
                      <td className="py-1.5 px-2">Adicional de Periculosidade</td>
                      <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        {funcionarioModal.adicional_periculosidade.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        —
                      </td>
                    </tr>
                  )}
                  {funcionarioModal.inss_retido > 0 && (
                    <tr>
                      <td className="py-1.5 px-2">Previdência Social - INSS</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        —
                      </td>
                      <td className="py-1.5 px-2 text-right text-rose-600 dark:text-rose-400">
                        {funcionarioModal.inss_retido.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {funcionarioModal.irrf_retido > 0 && (
                    <tr>
                      <td className="py-1.5 px-2">Imposto de Renda - IRRF</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        —
                      </td>
                      <td className="py-1.5 px-2 text-right text-rose-600 dark:text-rose-400">
                        {funcionarioModal.irrf_retido.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {funcionarioModal.vale_transporte > 0 && (
                    <tr>
                      <td className="py-1.5 px-2">Vale Transporte</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        —
                      </td>
                      <td className="py-1.5 px-2 text-right text-rose-600 dark:text-rose-400">
                        {funcionarioModal.vale_transporte.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {funcionarioModal.adiantamento > 0 && (
                    <tr>
                      <td className="py-1.5 px-2">Adiantamento Salarial / Vale</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        —
                      </td>
                      <td className="py-1.5 px-2 text-right text-rose-600 dark:text-rose-400">
                        {funcionarioModal.adiantamento.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-muted/30 font-bold border-t-2 border-border/40">
                  <tr>
                    <td className="py-2 px-2 uppercase">Totais</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      R$ {funcionarioModal.total_proventos.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-rose-600 dark:text-rose-400">
                      R$ {funcionarioModal.total_descontos.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t border-border/30 bg-primary/5">
                    <td className="py-2.5 px-2 font-black uppercase text-sm text-primary">
                      Valor Líquido a Receber
                    </td>
                    <td
                      colSpan={2}
                      className="py-2.5 px-2 text-right font-mono font-black text-base text-foreground"
                    >
                      R$ {funcionarioModal.salario_liquido.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Importação */}
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
