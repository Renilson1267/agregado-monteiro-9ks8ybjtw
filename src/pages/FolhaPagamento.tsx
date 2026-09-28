import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Users,
  Search,
  Filter,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Printer,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  Download,
} from 'lucide-react'
import { useEmpresa } from '@/hooks/use-empresa'
import { useToast } from '@/hooks/use-toast'
import { FolhaService, SalvarLinhaFolhaPayload } from '@/services/folha'
import { FolhaPagamentoLinha, calcularMensalLiquido } from '@/types/folha'
import { LOGO_GC_MIX_HORIZONTAL } from '@/assets/logos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FolhaPagamento() {
  const { empresaAtiva } = useEmpresa()
  const { toast } = useToast()

  // Competência selecionada (ex: '2026-09')
  const [competencia, setCompetencia] = useState<string>('2026-09')
  const [competenciasDisponiveis, setCompetenciasDisponiveis] = useState<string[]>([])
  const [linhas, setLinhas] = useState<FolhaPagamentoLinha[]>([])
  const [carregando, setCarregando] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<string>('mensal')

  // Filtros
  const [busca, setBusca] = useState('')
  const [mostrarOcultos, setMostrarOcultos] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'funcionarios' | 'terceiros'>('todos')

  // Modal Edição / Criação
  const [modalAberto, setModalAberto] = useState(false)
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<Partial<FolhaPagamentoLinha> | null>(null)
  const [comissaoModoManual, setComissaoModoManual] = useState(false)

  // Modal Exclusão
  const [linhaParaExcluir, setLinhaParaExcluir] = useState<FolhaPagamentoLinha | null>(null)

  // Holerite / Impressão
  const [linhaHolerite, setLinhaHolerite] = useState<FolhaPagamentoLinha | null>(null)
  const holeriteRef = useRef<HTMLDivElement>(null)

  // Carregar lista de competências disponíveis
  useEffect(() => {
    async function carregarCompetencias() {
      if (!empresaAtiva?.id) return
      try {
        const comps = await FolhaService.getCompetencias(empresaAtiva.id)
        const nomesComps = comps.map((c) => c.competencia).sort().reverse()
        if (nomesComps.length > 0) {
          setCompetenciasDisponiveis(nomesComps)
          // Se a atual não estiver, define para a mais recente ou mantém 2026-09 se existir
          setCompetencia((prev) => {
            if (!nomesComps.includes(prev)) {
              return nomesComps.includes('2026-09') ? '2026-09' : nomesComps[0]
            }
            return prev
          })
        } else {
          setCompetenciasDisponiveis(['2026-09', '2026-08', '2026-07'])
        }
      } catch (err) {
        console.warn('Erro ao carregar competências:', err)
      }
    }
    carregarCompetencias()
  }, [empresaAtiva?.id])

  // Carregar linhas da folha para a empresa e competência ativa
  useEffect(() => {
    async function carregarLinhas() {
      if (!empresaAtiva?.id || !competencia) return
      setCarregando(true)
      try {
        const data = await FolhaService.getLinhasCompetencia(empresaAtiva.id, competencia)
        setLinhas(data)
      } catch (err: any) {
        toast({
          title: 'Erro ao carregar folha',
          description: err.message || 'Não foi possível carregar os lançamentos.',
          variant: 'destructive',
        })
      } finally {
        setCarregando(false)
      }
    }
    carregarLinhas()
  }, [empresaAtiva?.id, competencia, toast])

  // Navegação anterior / próxima competência
  const mudarCompetencia = (delta: number) => {
    const idx = competenciasDisponiveis.indexOf(competencia)
    if (idx !== -1) {
      const novoIdx = idx - delta // lista está invertida (mais recentes primeiro)
      if (novoIdx >= 0 && novoIdx < competenciasDisponiveis.length) {
        setCompetencia(competenciasDisponiveis[novoIdx])
        return
      }
    }
    // Fallback: cálculo de data
    const [ano, mes] = competencia.split('-').map(Number)
    const data = new Date(ano, mes - 1 + delta, 1)
    const novoAno = data.getFullYear()
    const novoMes = String(data.getMonth() + 1).padStart(2, '0')
    setCompetencia(`${novoAno}-${novoMes}`)
  }

  // Filtragem de linhas
  const linhasFiltradas = useMemo(() => {
    return linhas.filter((l) => {
      if (!mostrarOcultos && l.oculto) return false
      if (filtroTipo === 'funcionarios' && l.tipo === 'Terceiro') return false
      if (filtroTipo === 'terceiros' && l.tipo !== 'Terceiro') return false
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const nomeOk = l.nome?.toLowerCase().includes(termo)
        const funcaoOk = l.funcao?.toLowerCase().includes(termo)
        const pixOk = (l.pix || l.chave_pix || '').toLowerCase().includes(termo)
        if (!nomeOk && !funcaoOk && !pixOk) return false
      }
      return true
    })
  }, [linhas, mostrarOcultos, filtroTipo, busca])

  // Totais calculados da competência (baseados nas linhas filtradas/visíveis ou de todas)
  const totais = useMemo(() => {
    return FolhaService.calcularTotais(linhasFiltradas)
  }, [linhasFiltradas])

  // Abrir modal de edição/criação
  const abrirModalEdicao = (linha?: FolhaPagamentoLinha) => {
    if (linha) {
      setLinhaEmEdicao({ ...linha })
      setComissaoModoManual(linha.modo_calculo === 'Digitado')
    } else {
      setLinhaEmEdicao({
        empresa_id: empresaAtiva?.id,
        competencia,
        tipo: 'Funcionario',
        nome: '',
        funcao: 'MOTORISTA',
        unidade: empresaAtiva?.nome?.includes('Monteiro') ? 'MONTEIRO' : 'SJE',
        bruto: 2410,
        filhos: 0,
        inss: 0,
        familia: 0,
        ir: 0,
        quinzena: 0,
        quinzena_2: 0,
        adiantamento: 0,
        gratificacao: 0,
        obras: 0,
        valor_obra: 20,
        producao: 0,
        limpeza: 0,
        sabado: 0,
        ferias: 0,
        ajuda_custo: 0,
        vendas_obra: 0,
        comissao: 0,
        vendas_ajuda: 0,
        mensal_liquido: 2410,
        conta: '',
        pix: '',
        modo_calculo: 'Calculado',
        oculto: false,
      })
      setComissaoModoManual(false)
    }
    setModalAberto(true)
  }

  // Recalcular dinamicamente os proventos e líquido no formulário
  const atualizarCampoEdicao = (campo: keyof FolhaPagamentoLinha, valor: any) => {
    setLinhaEmEdicao((prev) => {
      if (!prev) return null
      const updated = { ...prev, [campo]: valor }

      // Se mudou obras ou valor_obra, recalcula produção
      if (campo === 'obras' || campo === 'valor_obra') {
        const obs = Number(campo === 'obras' ? valor : updated.obras || 0)
        const valOb = Number(campo === 'valor_obra' ? valor : updated.valor_obra ?? 20)
        updated.producao = obs * valOb
      }

      // Se mudou vendas_obra e comissão automática
      if (campo === 'vendas_obra' && !comissaoModoManual) {
        const vendas = Number(valor || 0)
        updated.comissao = Math.round(vendas * 0.005 * 100) / 100
      }

      // Recalcula o líquido conforme a fórmula oficial do legado
      updated.mensal_liquido = calcularMensalLiquido(updated as any)
      return updated
    })
  }

  // Salvar linha
  const salvarLinha = async () => {
    if (!linhaEmEdicao || !empresaAtiva?.id) return
    if (!linhaEmEdicao.nome?.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do colaborador.',
        variant: 'destructive',
      })
      return
    }

    try {
      const payload: SalvarLinhaFolhaPayload = {
        id: linhaEmEdicao.id,
        empresa_id: empresaAtiva.id,
        competencia,
        tipo: linhaEmEdicao.tipo || 'Funcionario',
        nome: linhaEmEdicao.nome.trim().toUpperCase(),
        cargo: linhaEmEdicao.funcao || 'Geral',
        funcao: linhaEmEdicao.funcao || 'Geral',
        unidade: linhaEmEdicao.unidade || (empresaAtiva.nome.includes('Monteiro') ? 'MONTEIRO' : 'SJE'),
        bruto: Number(linhaEmEdicao.bruto || 0),
        salario_base: Number(linhaEmEdicao.bruto || 0),
        filhos: Number(linhaEmEdicao.filhos || 0),
        inss: Number(linhaEmEdicao.inss || 0),
        familia: Number(linhaEmEdicao.familia || 0),
        ir: Number(linhaEmEdicao.ir || 0),
        quinzena: Number(linhaEmEdicao.quinzena || 0),
        quinzena_2: Number(linhaEmEdicao.quinzena_2 || 0),
        adiantamento: Number(linhaEmEdicao.adiantamento || 0),
        gratificacao: Number(linhaEmEdicao.gratificacao || 0),
        obras: Number(linhaEmEdicao.obras || 0),
        valor_obra: Number(linhaEmEdicao.valor_obra ?? 20),
        producao: Number(linhaEmEdicao.producao || 0),
        limpeza: Number(linhaEmEdicao.limpeza || 0),
        sabado: Number(linhaEmEdicao.sabado || 0),
        ferias: Number(linhaEmEdicao.ferias || 0),
        ajuda_custo: Number(linhaEmEdicao.ajuda_custo || 0),
        vendas_obra: Number(linhaEmEdicao.vendas_obra || 0),
        comissao: Number(linhaEmEdicao.comissao || 0),
        vendas_ajuda: Number(linhaEmEdicao.vendas_ajuda || 0),
        mensal_liquido: Number(linhaEmEdicao.mensal_liquido || 0),
        salario_liquido: Number(linhaEmEdicao.mensal_liquido || 0),
        conta: linhaEmEdicao.conta || '',
        pix: linhaEmEdicao.pix || '',
        chave_pix: linhaEmEdicao.pix || '',
        modo_calculo: comissaoModoManual ? 'Digitado' : 'Calculado',
        oculto: Boolean(linhaEmEdicao.oculto),
        inativo: Boolean(linhaEmEdicao.inativo),
      }

      const salva = await FolhaService.salvarLinha(payload)
      toast({
        title: 'Registro salvo',
        description: `Lançamento de ${salva.nome} atualizado com sucesso.`,
      })

      // Atualiza lista local
      setLinhas((prev) => {
        const idx = prev.findIndex((l) => l.id === salva.id)
        if (idx !== -1) {
          const copia = [...prev]
          copia[idx] = salva
          return copia
        }
        return [...prev, salva]
      })

      setModalAberto(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Ocorreu um erro ao gravar a linha.',
        variant: 'destructive',
      })
    }
  }

  // Excluir linha
  const confirmarExclusao = async () => {
    if (!linhaParaExcluir || !empresaAtiva?.id) return
    try {
      await FolhaService.excluirLinha(linhaParaExcluir.id, empresaAtiva.id, competencia)
      setLinhas((prev) => prev.filter((l) => l.id !== linhaParaExcluir.id))
      toast({
        title: 'Lançamento excluído',
        description: `O registro de ${linhaParaExcluir.nome} foi removido.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Falha ao remover o registro.',
        variant: 'destructive',
      })
    } finally {
      setLinhaParaExcluir(null)
    }
  }

  // Imprimir holerite
  const dispararImpressaoHolerite = () => {
    window.print()
  }

  // Formatação em Real
  const fmtMoeda = (val: number | undefined) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // Formatação de competência legível: '2026-09' -> 'Setembro / 2026'
  const rotuloCompetencia = useMemo(() => {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    const [ano, mes] = competencia.split('-').map(Number)
    if (!ano || !mes) return competencia
    return `${meses[mes - 1]} de ${ano}`
  }, [competencia])

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* CABEÇALHO DA TELA & NAVEGAÇÃO DE COMPETÊNCIA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-lg p-4 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Folha de Pagamento
            </h1>
            <Badge variant="outline" className="text-xs font-semibold uppercase">
              {empresaAtiva?.nome || 'Unidade'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão integrada da folha mensal, quinzena, produção de obras e comissões de vendas.
          </p>
        </div>

        {/* Seletor de Competência */}
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-lg border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => mudarCompetencia(-1)}
            title="Competência anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 px-2">
            <Calendar className="h-4 w-4 text-primary" />
            <Select value={competencia} onValueChange={(val) => setCompetencia(val)}>
              <SelectTrigger className="h-8 w-44 font-semibold bg-background">
                <SelectValue>{rotuloCompetencia}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {competenciasDisponiveis.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => mudarCompetencia(1)}
            title="Próxima competência"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            className="ml-2 gap-1.5"
            onClick={() => abrirModalEdicao()}
          >
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* 4 CARDS NO TOPO: Total da Folha, Vendas, Comissões, Produção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total da Folha</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {fmtMoeda(totais.totalMensalLiquido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todos os líquidos ({totais.totalRegistros} colaboradores)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {fmtMoeda(totais.totalVendas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Volume faturado de concreto na competência
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {fmtMoeda(totais.totalComissao)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comissão padrão 0,5% ou ajustada
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produção</CardTitle>
            <Layers className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {fmtMoeda(totais.totalProducao)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totais.totalObras} obras concluídas no mês (R$ 20/obra)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ABAS DO LEGADO: FOLHA MENSAL, QUINZENA, PRODUÇÃO, VENDAS */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="mensal" className="gap-2">
              <Briefcase className="h-4 w-4" />
              FOLHA MENSAL
            </TabsTrigger>
            <TabsTrigger value="quinzena" className="gap-2">
              <Calendar className="h-4 w-4" />
              QUINZENA
            </TabsTrigger>
            <TabsTrigger value="producao" className="gap-2">
              <Layers className="h-4 w-4" />
              PRODUÇÃO
            </TabsTrigger>
            <TabsTrigger value="vendas" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              VENDAS
            </TabsTrigger>
          </TabsList>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário..."
                className="pl-8 h-9 text-sm"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <Select
              value={filtroTipo}
              onValueChange={(val: any) => setFiltroTipo(val)}
            >
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="funcionarios">Funcionários</SelectItem>
                <SelectItem value="terceiros">Terceiros</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={mostrarOcultos ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => setMostrarOcultos(!mostrarOcultos)}
              title="Alternar exibição de colaboradores ocultos (ex: Renilson)"
            >
              {mostrarOcultos ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {mostrarOcultos ? 'Ocultos Visíveis' : 'Mostrar Ocultos'}
            </Button>
          </div>
        </div>

        {/* ABA 1: FOLHA MENSAL (TABELA PRINCIPAL COMPLETA) */}
        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Folha Mensal — {rotuloCompetencia}</CardTitle>
                <CardDescription className="text-xs">
                  Colunas oficiais do sistema legado: Proventos, Descontos, Obras, Limpeza, Sábado, Vendas, Comissão e Líquido.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/90 z-10">Colaborador</th>
                      <th className="py-2.5 px-2">Função</th>
                      <th className="py-2.5 px-2 text-right">Bruto</th>
                      <th className="py-2.5 px-2 text-center" title="Quantidade de obras">Obras</th>
                      <th className="py-2.5 px-2 text-right" title="Valor unitário por obra">R$/Obra</th>
                      <th className="py-2.5 px-2 text-right font-semibold text-foreground">Produção</th>
                      <th className="py-2.5 px-2 text-right">Limp.</th>
                      <th className="py-2.5 px-2 text-right">Sábado</th>
                      <th className="py-2.5 px-2 text-right">Férias</th>
                      <th className="py-2.5 px-2 text-right">Ajuda</th>
                      <th className="py-2.5 px-2 text-right">Vendas (R$)</th>
                      <th className="py-2.5 px-2 text-right font-semibold">Comissão</th>
                      <th className="py-2.5 px-2 text-right text-red-600">Adiant.</th>
                      <th className="py-2.5 px-2 text-right">Gratif.</th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary bg-primary/5">Líquido</th>
                      <th className="py-2.5 px-3">Conta / PIX</th>
                      <th className="py-2.5 px-2 text-center print:hidden">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="text-center py-8 text-muted-foreground">
                          {carregando
                            ? 'Carregando folha...'
                            : 'Nenhum lançamento encontrado para os filtros selecionados.'}
                        </td>
                      </tr>
                    ) : (
                      linhasFiltradas.map((l) => (
                        <tr
                          key={l.id}
                          className={`hover:bg-muted/40 transition-colors ${
                            l.oculto ? 'bg-amber-500/5 opacity-80' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-background z-10 border-r">
                            <div className="flex items-center gap-1.5">
                              <span>{l.nome}</span>
                              {l.tipo === 'Terceiro' && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700 border-purple-200">
                                  Terceiro
                                </Badge>
                              )}
                              {l.oculto && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-amber-600 border-amber-300">
                                  Oculto
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{l.funcao}</td>
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            {l.tipo === 'Terceiro' && l.bruto === 0 ? '-' : fmtMoeda(l.bruto)}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {l.obras > 0 ? (
                              <span className="font-semibold text-primary">{l.obras}</span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                            {l.obras > 0 ? fmtMoeda(l.valor_obra) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium text-foreground whitespace-nowrap">
                            {l.producao > 0 ? fmtMoeda(l.producao) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            {l.limpeza > 0 ? fmtMoeda(l.limpeza) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            {l.sabado > 0 ? fmtMoeda(l.sabado) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            {l.ferias > 0 ? fmtMoeda(l.ferias) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            {l.ajuda_custo > 0 ? fmtMoeda(l.ajuda_custo) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-blue-600 whitespace-nowrap">
                            {l.vendas_obra > 0 ? fmtMoeda(l.vendas_obra) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            {l.comissao > 0 ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-semibold text-amber-600">{fmtMoeda(l.comissao)}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-0.5 py-0 h-3.5 ${
                                    l.modo_calculo === 'Digitado'
                                      ? 'border-amber-400 text-amber-700 bg-amber-50'
                                      : 'border-muted-foreground/30 text-muted-foreground'
                                  }`}
                                >
                                  {l.modo_calculo === 'Digitado' ? 'Dig' : 'Calc'}
                                </Badge>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-red-600 whitespace-nowrap">
                            {l.adiantamento > 0 ? fmtMoeda(l.adiantamento) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-emerald-600 whitespace-nowrap">
                            {l.gratificacao > 0 ? fmtMoeda(l.gratificacao) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5 whitespace-nowrap">
                            {fmtMoeda(l.mensal_liquido)}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-[11px] truncate max-w-[160px]" title={`${l.conta} | PIX: ${l.pix}`}>
                            {l.pix ? `PIX: ${l.pix}` : l.conta || '-'}
                          </td>
                          <td className="py-2 px-2 text-center whitespace-nowrap print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setLinhaHolerite(l)}
                                title="Ver / Imprimir Holerite"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => abrirModalEdicao(l)}
                                title="Editar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setLinhaParaExcluir(l)}
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* LINHA DE TOTAIS NO RODAPÉ */}
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                        TOTAL ({linhasFiltradas.length})
                      </td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalBruto)}</td>
                      <td className="py-2.5 px-2 text-center font-mono">{totais.totalObras}</td>
                      <td className="py-2.5 px-2 text-right">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalProducao)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalLimpeza)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalSabado)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalFerias)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalAjudaCusto)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">{fmtMoeda(totais.totalVendas)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-amber-600">{fmtMoeda(totais.totalComissao)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-red-600">{fmtMoeda(totais.totalAdiantamento)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600">{fmtMoeda(totais.totalGratificacao)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary bg-primary/10">
                        {fmtMoeda(totais.totalMensalLiquido)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: QUINZENA */}
        <TabsContent value="quinzena" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base font-semibold">Controle de Quinzena e Adiantamentos</CardTitle>
              <CardDescription className="text-xs">
                Valores adiantados na 1ª quinzena e descontos programados da competência {rotuloCompetencia}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/90 z-10">Colaborador</th>
                      <th className="py-2.5 px-2">Função</th>
                      <th className="py-2.5 px-2 text-right">Salário Base</th>
                      <th className="py-2.5 px-2 text-right font-semibold text-blue-600">1ª Quinzena</th>
                      <th className="py-2.5 px-2 text-right text-muted-foreground">2ª Quinzena</th>
                      <th className="py-2.5 px-2 text-right font-semibold text-red-600">Adiantamento Total</th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary">Líquido Final</th>
                      <th className="py-2.5 px-3">Chave PIX / Banco</th>
                      <th className="py-2.5 px-2 text-center print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasFiltradas.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-background z-10 border-r">
                          {l.nome}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{l.funcao}</td>
                        <td className="py-2 px-2 text-right font-mono">{fmtMoeda(l.bruto)}</td>
                        <td className="py-2 px-2 text-right font-mono text-blue-600 font-medium">
                          {l.quinzena > 0 ? fmtMoeda(l.quinzena) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                          {l.quinzena_2 && l.quinzena_2 > 0 ? fmtMoeda(l.quinzena_2) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-red-600 font-semibold">
                          {l.adiantamento > 0 ? fmtMoeda(l.adiantamento) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-primary">
                          {fmtMoeda(l.mensal_liquido)}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">
                          {l.pix || l.conta || '-'}
                        </td>
                        <td className="py-2 px-2 text-center print:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => abrirModalEdicao(l)}
                            title="Editar adiantamento"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">TOTAL</td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalBruto)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">{fmtMoeda(totais.totalQuinzena)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{fmtMoeda(totais.totalQuinzena2)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-red-600">{fmtMoeda(totais.totalAdiantamento)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary">{fmtMoeda(totais.totalMensalLiquido)}</td>
                      <td className="py-2.5 px-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: PRODUÇÃO (OBRAS E RANKING) */}
        <TabsContent value="producao" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">Tabela de Produção por Funcionário</CardTitle>
                <CardDescription className="text-xs">
                  Cálculo de obras atendidas multiplicadas pela taxa contratual (padrão R$ 20,00 por obra).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                      <tr>
                        <th className="py-2.5 px-3">Funcionário</th>
                        <th className="py-2.5 px-2">Função</th>
                        <th className="py-2.5 px-2 text-center">Obras</th>
                        <th className="py-2.5 px-2 text-right">Valor Unit.</th>
                        <th className="py-2.5 px-2 text-right font-semibold text-emerald-600">Total Produção</th>
                        <th className="py-2.5 px-2 text-right">Limpeza</th>
                        <th className="py-2.5 px-2 text-right">Sábado</th>
                        <th className="py-2.5 px-2 text-center print:hidden">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {linhasFiltradas
                        .filter((l) => l.obras > 0 || l.producao > 0 || l.limpeza > 0 || l.sabado > 0)
                        .map((l) => (
                          <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2 px-3 font-medium text-foreground">{l.nome}</td>
                            <td className="py-2 px-2 text-muted-foreground">{l.funcao}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-primary">{l.obras}</td>
                            <td className="py-2 px-2 text-right font-mono text-muted-foreground">{fmtMoeda(l.valor_obra)}</td>
                            <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-600">
                              {fmtMoeda(l.producao)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">{fmtMoeda(l.limpeza)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtMoeda(l.sabado)}</td>
                            <td className="py-2 px-2 text-center print:hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => abrirModalEdicao(l)}
                                title="Editar produção"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Ranking de Produção do Mês */}
            <Card>
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Top Ranking de Obras
                </CardTitle>
                <CardDescription className="text-xs">
                  Colaboradores com maior volume de entregas no mês.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {linhas
                  .filter((l) => l.obras > 0)
                  .sort((a, b) => b.obras - a.obras)
                  .slice(0, 5)
                  .map((l, index) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-amber-500 text-white'
                              : index === 1
                              ? 'bg-slate-400 text-white'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-none">{l.nome}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{l.funcao}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-primary font-mono">{l.obras} obras</span>
                        <p className="text-[10px] text-muted-foreground">{fmtMoeda(l.producao)}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 4: VENDAS (VENDEDORES E TERCEIROS) */}
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Comissões sobre Vendas</CardTitle>
                <CardDescription className="text-xs">
                  Funcionários vendedores e parceiros terceiros comissionados na competência {rotuloCompetencia}.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Vendedor / Terceiro</th>
                      <th className="py-2.5 px-2">Tipo</th>
                      <th className="py-2.5 px-2 text-right">Salário Fixo</th>
                      <th className="py-2.5 px-2 text-right font-semibold text-blue-600">Volume Vendas</th>
                      <th className="py-2.5 px-2 text-right font-bold text-amber-600">Comissão (0,5%)</th>
                      <th className="py-2.5 px-2 text-center">Tipo Comissão</th>
                      <th className="py-2.5 px-2 text-right">Ajuda de Custo</th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary">Total Líquido</th>
                      <th className="py-2.5 px-3">Dados Bancários / PIX</th>
                      <th className="py-2.5 px-2 text-center print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasFiltradas
                      .filter((l) => l.vendas_obra > 0 || l.comissao > 0 || l.tipo === 'Terceiro')
                      .map((l) => (
                        <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{l.nome}</span>
                              {l.tipo === 'Terceiro' && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700">
                                  Terceiro
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground">{l.funcao}</td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            {l.bruto > 0 ? fmtMoeda(l.bruto) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-blue-600 font-semibold">
                            {fmtMoeda(l.vendas_obra)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-600">
                            {fmtMoeda(l.comissao)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                l.modo_calculo === 'Digitado'
                                  ? 'border-amber-400 text-amber-700 bg-amber-50'
                                  : 'border-muted-foreground/30 text-muted-foreground'
                              }`}
                            >
                              {l.modo_calculo === 'Digitado' ? 'Digitada' : '0,5% Auto'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            {l.vendas_ajuda > 0 ? fmtMoeda(l.vendas_ajuda) : l.ajuda_custo > 0 ? fmtMoeda(l.ajuda_custo) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-primary">
                            {fmtMoeda(l.mensal_liquido)}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                            {l.pix || l.conta || '-'}
                          </td>
                          <td className="py-2.5 px-2 text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => abrirModalEdicao(l)}
                              title="Editar comissão e vendas"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-3">TOTAL VENDAS / COMISSÕES</td>
                      <td className="py-2.5 px-2" colSpan={2}>-</td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">{fmtMoeda(totais.totalVendas)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-amber-600">{fmtMoeda(totais.totalComissao)}</td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">{fmtMoeda(totais.totalVendasAjuda || totais.totalAjudaCusto)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary">{fmtMoeda(totais.totalMensalLiquido)}</td>
                      <td className="py-2.5 px-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE EDIÇÃO / CRIAÇÃO DE LINHA */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {linhaEmEdicao?.id ? 'Editar Lançamento' : 'Novo Lançamento na Folha'}
            </DialogTitle>
          </DialogHeader>

          {linhaEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    value={linhaEmEdicao.nome || ''}
                    onChange={(e) => atualizarCampoEdicao('nome', e.target.value)}
                    placeholder="Ex: ARLINDO LEITE"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Função / Cargo</Label>
                  <Input
                    value={linhaEmEdicao.funcao || ''}
                    onChange={(e) => atualizarCampoEdicao('funcao', e.target.value)}
                    placeholder="Ex: MOTORISTA"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Tipo de Vínculo</Label>
                  <Select
                    value={linhaEmEdicao.tipo || 'Funcionario'}
                    onValueChange={(val: any) => atualizarCampoEdicao('tipo', val)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Funcionario">Funcionário</SelectItem>
                      <SelectItem value="Terceiro">Terceiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Salário Bruto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={linhaEmEdicao.bruto ?? 0}
                    onChange={(e) => atualizarCampoEdicao('bruto', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Filhos (Sal. Família)</Label>
                  <Input
                    type="number"
                    value={linhaEmEdicao.filhos ?? 0}
                    onChange={(e) => atualizarCampoEdicao('filhos', parseInt(e.target.value, 10) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Produção: Obras e Valor por Obra */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Produção de Obras
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Qtd Obras</Label>
                    <Input
                      type="number"
                      value={linhaEmEdicao.obras ?? 0}
                      onChange={(e) => atualizarCampoEdicao('obras', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Valor Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.valor_obra ?? 20}
                      onChange={(e) => atualizarCampoEdicao('valor_obra', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total Produção (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.producao ?? 0}
                      onChange={(e) => atualizarCampoEdicao('producao', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs font-bold text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Benefícios Adicionais: Limpeza, Sábado, Férias, Ajuda */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Adicionais & Benefícios
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Limpeza (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.limpeza ?? 0}
                      onChange={(e) => atualizarCampoEdicao('limpeza', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sábado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.sabado ?? 0}
                      onChange={(e) => atualizarCampoEdicao('sabado', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Férias (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.ferias ?? 0}
                      onChange={(e) => atualizarCampoEdicao('ferias', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ajuda de Custo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.ajuda_custo ?? 0}
                      onChange={(e) => atualizarCampoEdicao('ajuda_custo', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Vendas e Comissões */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                    Vendas & Comissões
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={comissaoModoManual ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setComissaoModoManual(!comissaoModoManual)}
                    >
                      {comissaoModoManual ? 'Comissão Manual' : '0,5% Calculado'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Volume de Vendas (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.vendas_obra ?? 0}
                      onChange={(e) => atualizarCampoEdicao('vendas_obra', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Comissão (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.comissao ?? 0}
                      onChange={(e) => {
                        setComissaoModoManual(true)
                        atualizarCampoEdicao('comissao', parseFloat(e.target.value) || 0)
                      }}
                      className="mt-1 h-8 text-xs font-bold text-amber-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ajuda Vendedor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.vendas_ajuda ?? 0}
                      onChange={(e) => atualizarCampoEdicao('vendas_ajuda', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Descontos e Adiantamentos */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descontos & Gratificações
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-red-600">Adiantamento (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.adiantamento ?? 0}
                      onChange={(e) => atualizarCampoEdicao('adiantamento', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-blue-600">1ª Quinzena (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.quinzena ?? 0}
                      onChange={(e) => atualizarCampoEdicao('quinzena', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-600">Gratificação (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.gratificacao ?? 0}
                      onChange={(e) => atualizarCampoEdicao('gratificacao', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-primary">Líquido Final (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.mensal_liquido ?? 0}
                      onChange={(e) => atualizarCampoEdicao('mensal_liquido', parseFloat(e.target.value) || 0)}
                      className="mt-1 h-8 text-xs font-bold text-primary bg-primary/5"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Bancários & PIX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Conta Bancária</Label>
                  <Input
                    value={linhaEmEdicao.conta || ''}
                    onChange={(e) => atualizarCampoEdicao('conta', e.target.value)}
                    placeholder="Ex: Ag 1563 / C/C 82316-4"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={linhaEmEdicao.pix || ''}
                    onChange={(e) => atualizarCampoEdicao('pix', e.target.value)}
                    placeholder="Ex: 87999146340 ou email"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarLinha}>
              Gravar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={Boolean(linhaParaExcluir)} onOpenChange={(open) => !open && setLinhaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento da folha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o lançamento de <strong>{linhaParaExcluir?.nome}</strong> da competência{' '}
              <strong>{competencia}</strong>. Os dados históricos no backup legado continuarão salvos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL / VISÃO DE HOLERITE A4 INDIVIDUAL */}
      <Dialog open={Boolean(linhaHolerite)} onOpenChange={(open) => !open && setLinhaHolerite(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center justify-between">
              <span>Recibo de Pagamento de Salário</span>
              <Button size="sm" onClick={dispararImpressaoHolerite} className="gap-1.5">
                <Printer className="h-4 w-4" />
                Imprimir A4
              </Button>
            </DialogTitle>
          </DialogHeader>

          {linhaHolerite && (
            <div
              ref={holeriteRef}
              className="bg-white text-black p-8 rounded-lg border shadow-sm font-sans print:m-0 print:p-4 print:border-none text-xs"
              style={{ minHeight: '260mm' }}
            >
              {/* TOPO: LOGO GC MIX E DADOS DA EMPRESA */}
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={LOGO_GC_MIX_HORIZONTAL}
                    alt="GC MIX"
                    className="h-10 object-contain"
                  />
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wide">
                      GC MIX CONCRETO E AGREGADOS
                    </h2>
                    <p className="text-[11px] text-gray-600">
                      Unidade: {empresaAtiva?.nome || linhaHolerite.unidade}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs uppercase bg-gray-100 px-2.5 py-1 rounded border">
                    RECIBO DE PAGAMENTO
                  </span>
                  <p className="text-[11px] font-semibold mt-1">
                    Competência: {rotuloCompetencia}
                  </p>
                </div>
              </div>

              {/* IDENTIFICAÇÃO DO COLABORADOR */}
              <div className="grid grid-cols-3 gap-2 border p-3 rounded bg-gray-50/70 mb-4 text-[11px]">
                <div className="col-span-2">
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Colaborador</span>
                  <span className="font-bold text-sm text-gray-900">{linhaHolerite.nome}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Função</span>
                  <span className="font-semibold text-gray-800">{linhaHolerite.funcao}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Vínculo</span>
                  <span className="font-medium text-gray-800">{linhaHolerite.tipo}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Salário Base</span>
                  <span className="font-mono font-medium">{fmtMoeda(linhaHolerite.bruto)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Conta / PIX</span>
                  <span className="font-mono text-[10px] truncate block">{linhaHolerite.pix || linhaHolerite.conta || '-'}</span>
                </div>
              </div>

              {/* TABELA DE PROVENTOS E DESCONTOS */}
              <table className="w-full border-collapse border text-[11px] mb-4">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="border p-2 text-left">Código / Descrição do Item</th>
                    <th className="border p-2 text-center w-20">Referência</th>
                    <th className="border p-2 text-right w-28">Vencimentos (R$)</th>
                    <th className="border p-2 text-right w-28">Descontos (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-800 font-mono">
                  {linhaHolerite.bruto > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">001 - Salário Base Mensal</td>
                      <td className="border p-1.5 text-center">30 dias</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.bruto)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.producao > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">
                        010 - Produção Concreto ({linhaHolerite.obras} obras × R$ {linhaHolerite.valor_obra})
                      </td>
                      <td className="border p-1.5 text-center">{linhaHolerite.obras} un</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.producao)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.limpeza > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">012 - Adicional Limpeza de Caminhão/Pátio</td>
                      <td className="border p-1.5 text-center">Integral</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.limpeza)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.sabado > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">014 - Adicional Plantão de Sábado</td>
                      <td className="border p-1.5 text-center">Plantão</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.sabado)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.comissao > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">
                        020 - Comissão sobre Vendas (Base R$ {fmtMoeda(linhaHolerite.vendas_obra)})
                      </td>
                      <td className="border p-1.5 text-center">0,5%</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.comissao)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.ajuda_custo > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">025 - Ajuda de Custo Operacional</td>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.ajuda_custo)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.vendas_ajuda > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">026 - Ajuda de Custo Vendas</td>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.vendas_ajuda)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.gratificacao > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">030 - Gratificação Especial</td>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.gratificacao)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.ferias > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans">040 - Proventos de Férias</td>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5 text-right font-medium">{fmtMoeda(linhaHolerite.ferias)}</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                    </tr>
                  )}
                  {linhaHolerite.adiantamento > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans text-red-700">101 - Adiantamento Salarial / Vales</td>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                      <td className="border p-1.5 text-right font-medium text-red-700">{fmtMoeda(linhaHolerite.adiantamento)}</td>
                    </tr>
                  )}
                  {linhaHolerite.quinzena > 0 && (
                    <tr>
                      <td className="border p-1.5 font-sans text-red-700">102 - 1ª Quinzena Adiantada</td>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5 text-right text-gray-400">-</td>
                      <td className="border p-1.5 text-right font-medium text-red-700">{fmtMoeda(linhaHolerite.quinzena)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* TOTAIS E VALOR LÍQUIDO */}
              <div className="grid grid-cols-3 border p-3 rounded bg-gray-50 mb-8 font-mono">
                <div>
                  <span className="text-gray-500 block text-[10px] font-sans uppercase">Total Proventos</span>
                  <span className="font-bold text-sm text-gray-900">
                    {fmtMoeda(
                      linhaHolerite.bruto +
                        linhaHolerite.producao +
                        linhaHolerite.limpeza +
                        linhaHolerite.sabado +
                        linhaHolerite.ferias +
                        linhaHolerite.ajuda_custo +
                        linhaHolerite.vendas_ajuda +
                        linhaHolerite.comissao +
                        linhaHolerite.gratificacao,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-sans uppercase">Total Descontos</span>
                  <span className="font-bold text-sm text-red-700">
                    {fmtMoeda(linhaHolerite.adiantamento + linhaHolerite.quinzena)}
                  </span>
                </div>
                <div className="border-l pl-3">
                  <span className="text-gray-500 block text-[10px] font-sans uppercase">Líquido a Receber</span>
                  <span className="font-bold text-base text-primary">
                    {fmtMoeda(linhaHolerite.mensal_liquido)}
                  </span>
                </div>
              </div>

              {/* DECLARAÇÃO DE QUITAÇÃO & ASSINATURAS */}
              <div className="mt-8 pt-4 border-t text-[10px] text-gray-600 space-y-8">
                <p>
                  Declaro ter recebido da empresa <strong>GC MIX CONCRETO E AGREGADOS</strong> a importância líquida
                  discriminada neste recibo, quitando a competência {rotuloCompetencia}.
                </p>

                <div className="grid grid-cols-2 gap-12 pt-6">
                  <div className="text-center border-t border-gray-400 pt-1">
                    <p className="font-bold text-gray-800">GC MIX CONCRETO</p>
                    <p className="text-[9px] text-gray-500">Empregador</p>
                  </div>
                  <div className="text-center border-t border-gray-400 pt-1">
                    <p className="font-bold text-gray-800">{linhaHolerite.nome}</p>
                    <p className="text-[9px] text-gray-500">Assinatura do Colaborador</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default FolhaPagamento
