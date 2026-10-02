import { useState, useMemo, useEffect, useRef } from "react"
import {
  Briefcase,
  Search,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Table as TableIcon,
  Layers,
  Calendar,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Award,
  Calculator,
  Copy,
  RefreshCw,
} from "lucide-react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { useToast } from "@/hooks/use-toast"
import { FolhaService, SalvarLinhaFolhaPayload } from "@/services/folha"
import {
  FolhaPagamentoLinha,
  FolhaCompetencia,
  FolhaTabelaOficial,
  FaixaComissaoProgressiva,
  FolhaTerceiro,
} from "@/types/folha"
import {
  calcularInssProgressivo,
  calcularSalarioFamilia,
  calcularIrrf,
  calcularQuinzena,
  calcularMensalSemProducao,
  calcularProducaoTotal,
  calcularAPagarProducao,
  calcularComissaoVendas,
  calcularComissaoProgressivaMarginal,
  calcularMesesProporcionais13,
  calcularLinhaDecimoTerceiro,
} from "@/lib/folha-calculos"
import { LOGO_GC_MIX_HORIZONTAL } from "@/assets/logos"
import { AbaTabelasOficiais } from "@/components/AbaTabelasOficiais"
import { AbaBackupFolha } from "@/components/AbaBackupFolha"
import { AbaDecimoTerceiro } from "@/components/AbaDecimoTerceiro"
import { Gift } from "lucide-react"
import { Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ID_EMPRESA_MONTEIRO = "11111111-1111-1111-1111-111111111111"
const ID_EMPRESA_SJE = "22222222-2222-2222-2222-222222222222"

interface CalculoUnidadeConsolidada {
  totalFuncionarios: number
  totalTerceiros: number
  valorReal: number
  totalVendas: number
  totalComissoes: number
  qtdFuncionarios: number
  qtdTerceiros: number
  linhasCount: number
}

function calcularValorRealEmpresa(
  linhasEmpresa: FolhaPagamentoLinha[],
  terceirosCadastradosEmpresa: FolhaTerceiro[] = [],
): CalculoUnidadeConsolidada {
  if (!linhasEmpresa || linhasEmpresa.length === 0) {
    return {
      totalFuncionarios: 0,
      totalTerceiros: 0,
      valorReal: 0,
      totalVendas: 0,
      totalComissoes: 0,
      qtdFuncionarios: 0,
      qtdTerceiros: 0,
      linhasCount: 0,
    }
  }

  // 1. Funcionários (inclui ocultos como Renilson)
  const funcs = linhasEmpresa.filter((l) => l.tipo !== "Terceiro")
  let totalFuncionarios = 0
  let totalVendasFuncs = 0
  let totalComissoesFuncs = 0
  funcs.forEach((l) => {
    const isValdercleiton = (l.nome || "")
      .toUpperCase()
      .includes("VALDERCLEITON")
    const gratificacao = Number(l.gratificacao || 0)
    const producaoCompleta = isValdercleiton
      ? 0
      : calcularProducaoTotal(l) + gratificacao
    const adiantamento = Number(l.adiantamento || 0)
    // REGRA OFICIAL GC MIX:
    // Mensal puro = bruto - inss - ir - quinzena - quinzena_2 (sem adicionais e sem adiantamento)
    const b = Number(l.bruto || 0)
    const i = Number(l.inss || 0)
    const ir = Number(l.ir || 0)
    const q = Number(l.quinzena || 0)
    const q2 = Number(l.quinzena_2 || 0)
    const mensal = Math.round((b - i - ir - q - q2) * 100) / 100
    totalFuncionarios += mensal + producaoCompleta - adiantamento
    const vObra = Number(l.vendas_obra || 0)
    const comissaoAuto = calcularComissaoVendas(vObra)
    const comissao = Number(l.comissao || comissaoAuto)
    totalVendasFuncs += vObra
    totalComissoesFuncs += comissao
  })
  totalFuncionarios = Math.round(totalFuncionarios * 100) / 100

  // 2. Terceiros
  const tercs = linhasEmpresa.filter((l) => l.tipo === "Terceiro")
  let totalTerceiros = 0
  let totalVendasTercs = 0
  let totalComissoesTercs = 0
  tercs.forEach((t) => {
    const cadastrado = terceirosCadastradosEmpresa.find(
      (c) =>
        (t.id && c.id === t.id) ||
        (t.nome &&
          c.nome &&
          c.nome.trim().toUpperCase() === t.nome.trim().toUpperCase()),
    )
    const ehVendedor = Boolean(
      cadastrado?.eh_vendedor ||
        (t.nome && t.nome.toUpperCase().includes("MARCIO LUAN")),
    )
    const valorMes = ehVendedor
      ? Number(t.comissao || 0) + Number(t.ajuda_custo || 0)
      : Number(t.salario_liquido || t.bruto || 0)
    totalTerceiros += valorMes

    if (ehVendedor && !t.nome.toUpperCase().includes("RAIMUNDO")) {
      totalVendasTercs += Number(t.vendas_obra || 0)
      totalComissoesTercs += Number(t.comissao || 0)
    }
  })
  totalTerceiros = Math.round(totalTerceiros * 100) / 100

  const valorReal = Math.round((totalFuncionarios + totalTerceiros) * 100) / 100
  const totalVendas =
    Math.round((totalVendasFuncs + totalVendasTercs) * 100) / 100
  const totalComissoes =
    Math.round((totalComissoesFuncs + totalComissoesTercs) * 100) / 100

  return {
    totalFuncionarios,
    totalTerceiros,
    valorReal,
    totalVendas,
    totalComissoes,
    qtdFuncionarios: funcs.length,
    qtdTerceiros: tercs.length,
    linhasCount: linhasEmpresa.length,
  }
}

export function FolhaPagamento() {
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()
  const { toast } = useToast()

  // Competência selecionada (ex: '2026-09')
  const [competencia, setCompetencia] = useState<string>("2026-09")
  const [competenciasDisponiveis, setCompetenciasDisponiveis] =
    useState<string[]>([])
  const [competenciaObj, setCompetenciaObj] = useState<FolhaCompetencia | null>(
    null,
  )
  const [linhas, setLinhas] = useState<FolhaPagamentoLinha[]>([])
  const [tabelaOficial, setTabelaOficial] = useState<FolhaTabelaOficial | null>(
    null,
  )
  const [faixasComissao, setFaixasComissao] =
    useState<FaixaComissaoProgressiva[]>([])
  const [terceirosCadastrados, setTerceirosCadastrados] =
    useState<FolhaTerceiro[]>([])
  const [carregando, setCarregando] = useState(false)
  const [gerandoLancamentos, setGerandoLancamentos] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<string>("geral")

  // Cabeçalho editável da competência (fix tsc trigger)
  const [dataCompetencia, setDataCompetencia] = useState<string>("15/09/2026")
  const [percentualQuinzena, setPercentualQuinzena] = useState<number>(0.4)
  const [salvandoConfigComp, setSalvandoConfigComp] = useState(false)

  // Filtros & Visualização
  const [busca, setBusca] = useState("")
  const [mostrarOcultos, setMostrarOcultos] = useState(false)
  const [linhasExpandidas, setLinhasExpandidas] =
    useState<Record<string, boolean>>({})
  const [todasExpandidas, setTodasExpandidas] = useState(false)

  const toggleLinhaExpandida = (id: string) => {
    setLinhasExpandidas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleTodasLinhas = () => {
    const novo = !todasExpandidas
    setTodasExpandidas(novo)
    const mapa: Record<string, boolean> = {}
    linhasGeralProcessadas.forEach((l) => {
      mapa[l.id] = novo
    })
    setLinhasExpandidas(mapa)
  }

  // Modal Edição / Criação
  const [modalAberto, setModalAberto] = useState(false)
  const [linhaEmEdicao, setLinhaEmEdicao] =
    useState<Partial<FolhaPagamentoLinha> | null>(null)
  const [inssManual, setInssManual] = useState(false)
  const [familiaManual, setFamiliaManual] = useState(false)
  const [irManual, setIrManual] = useState(false)
  const [quinzenaManual, setQuinzenaManual] = useState(false)
  const [mensalManual, setMensalManual] = useState(false)
  const [comissaoManual, setComissaoManual] = useState(false)

  // Modal Exclusão
  const [linhaParaExcluir, setLinhaParaExcluir] =
    useState<FolhaPagamentoLinha | null>(null)

  // Holerite / Impressão
  const [tipoImpressaoA4, setTipoImpressaoA4] =
    useState<"geral" | "quinzena" | "mensal" | "producao" | "vendas" | "resumo" | "decimo" | null>(
      null,
    )
  const [funcionariosCadastradosEmpresa, setFuncionariosCadastradosEmpresa] =
    useState<any[]>([])
  const [historicoLinhasAno, setHistoricoLinhasAno] = useState<any[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  // Estado da Consolidação das Duas Folhas (MONTEIRO + SJE)
  const [linhasConsolidacaoMonteiro, setLinhasConsolidacaoMonteiro] =
    useState<FolhaPagamentoLinha[]>([])
  const [linhasConsolidacaoSje, setLinhasConsolidacaoSje] =
    useState<FolhaPagamentoLinha[]>([])
  const [terceirosMonteiro, setTerceirosMonteiro] = useState<FolhaTerceiro[]>(
    [],
  )
  const [terceirosSje, setTerceirosSje] = useState<FolhaTerceiro[]>([])
  const [carregandoConsolidacao, setCarregandoConsolidacao] = useState(false)

  // 1. Carregar lista de competências disponíveis
  useEffect(() => {
    async function carregarCompetencias() {
      if (!empresaAtiva?.id) return
      try {
        const comps = await FolhaService.getCompetencias(empresaAtiva.id)
        const nomesComps = comps
          .map((c) => c.competencia)
          .sort()
          .reverse()
        if (nomesComps.length > 0) {
          setCompetenciasDisponiveis(nomesComps)
          setCompetencia((prev) => {
            if (!nomesComps.includes(prev)) {
              return nomesComps.includes("2026-09") ? "2026-09" : nomesComps[0]
            }
            return prev
          })
        } else {
          setCompetenciasDisponiveis(["2026-09", "2026-08", "2026-07"])
        }
      } catch (err) {
        console.warn("Erro ao carregar competências:", err)
      }
    }
    carregarCompetencias()
  }, [empresaAtiva?.id])

  // 2. Carregar tabelas oficiais (2026), faixas de comissão, terceiros e funcionários cadastrados da empresa
  useEffect(() => {
    async function carregarTabelaEComissoes() {
      if (!empresaAtiva?.id) return
      try {
        const [tab, faixas, tercs, funcs, histAno] = await Promise.all([
          FolhaService.getTabelaOficial(empresaAtiva.id, 2026),
          FolhaService.getFaixasComissao(empresaAtiva.id),
          FolhaService.getTerceiros(empresaAtiva.id),
          FolhaService.getFuncionariosEmpresa(empresaAtiva.id),
          FolhaService.getHistoricoRemuneracoesAno(empresaAtiva.id, 2026),
        ])
        setTabelaOficial(tab)
        setFaixasComissao(faixas || [])
        setTerceirosCadastrados(tercs || [])
        setFuncionariosCadastradosEmpresa(funcs || [])
        setHistoricoLinhasAno(histAno || [])
      } catch (err) {
        console.warn(
          "Erro ao carregar tabelas oficiais/faixas de comissão/funcionários:",
          err,
        )
      }
    }
    carregarTabelaEComissoes()
  }, [empresaAtiva?.id])

  // 3. Carregar dados da competência (data e % quinzena) e linhas
  useEffect(() => {
    async function carregarDados() {
      if (!empresaAtiva?.id || !competencia) return
      setCarregando(true)
      try {
        const [compData, dataLinhas] = await Promise.all([
          FolhaService.getCompetencia(empresaAtiva.id, competencia),
          FolhaService.getLinhasCompetencia(empresaAtiva.id, competencia),
        ])

        setCompetenciaObj(compData)
        if (compData) {
          if (compData.data_competencia) {
            setDataCompetencia(compData.data_competencia)
          } else {
            const [ano, mes] = competencia.split("-")
            setDataCompetencia(`15/${mes || "09"}/${ano || "2026"}`)
          }
          if (typeof compData.percentual_quinzena === "number") {
            setPercentualQuinzena(compData.percentual_quinzena)
          } else {
            setPercentualQuinzena(0.4)
          }
        } else {
          const [ano, mes] = competencia.split("-")
          setDataCompetencia(`15/${mes || "09"}/${ano || "2026"}`)
          setPercentualQuinzena(0.4)
        }

        setLinhas(dataLinhas)
      } catch (err: any) {
        toast({
          title: "Erro ao carregar folha",
          description:
            err.message || "Não foi possível carregar os lançamentos.",
          variant: "destructive",
        })
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [empresaAtiva?.id, competencia, toast])

  // 4. Carregar em paralelo dados consolidados das duas empresas (Monteiro e SJE) para a competência
  useEffect(() => {
    async function carregarConsolidacao() {
      if (!competencia) return
      setCarregandoConsolidacao(true)
      try {
        const [linhasMont, linhasSjeData, tercsMont, tercsSjeData] =
          await Promise.all([
            FolhaService.getLinhasCompetencia(ID_EMPRESA_MONTEIRO, competencia),
            FolhaService.getLinhasCompetencia(ID_EMPRESA_SJE, competencia),
            FolhaService.getTerceiros(ID_EMPRESA_MONTEIRO),
            FolhaService.getTerceiros(ID_EMPRESA_SJE),
          ])

        setLinhasConsolidacaoMonteiro(linhasMont || [])
        setLinhasConsolidacaoSje(linhasSjeData || [])
        setTerceirosMonteiro(tercsMont || [])
        setTerceirosSje(tercsSjeData || [])
      } catch (err) {
        console.warn("Erro ao carregar dados consolidados da folha:", err)
      } finally {
        setCarregandoConsolidacao(false)
      }
    }
    carregarConsolidacao()
  }, [competencia])

  // Salvar cabeçalho da competência (% quinzena ou data)
  const salvarConfigCompetencia = async (
    novaData?: string,
    novoPct?: number,
  ) => {
    if (!empresaAtiva?.id || !competencia) return
    const dComp = novaData !== undefined ? novaData : dataCompetencia
    const pct = novoPct !== undefined ? novoPct : percentualQuinzena

    setSalvandoConfigComp(true)
    try {
      const updated = await FolhaService.atualizarConfigCompetencia(
        empresaAtiva.id,
        competencia,
        {
          data_competencia: dComp,
          percentual_quinzena: pct,
        },
      )
      setCompetenciaObj(updated)
      toast({
        title: "Competência atualizada",
        description: `Parâmetros da competência ${competencia} salvos.`,
      })
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar competência",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoConfigComp(false)
    }
  }

  // Navegação anterior / próxima competência
  const mudarCompetencia = (delta: number) => {
    const idx = competenciasDisponiveis.indexOf(competencia)
    if (idx !== -1) {
      const novoIdx = idx - delta // lista mais recentes primeiro
      if (novoIdx >= 0 && novoIdx < competenciasDisponiveis.length) {
        setCompetencia(competenciasDisponiveis[novoIdx])
        return
      }
    }
    const [ano, mes] = competencia.split("-").map(Number)
    const data = new Date(ano, mes - 1 + delta, 1)
    const novoAno = data.getFullYear()
    const novoMes = String(data.getMonth() + 1).padStart(2, "0")
    setCompetencia(`${novoAno}-${novoMes}`)
  }

  // Separação de funcionários e terceiros
  const funcionariosLinhas = useMemo(() => {
    return linhas.filter((l) => l.tipo !== "Terceiro")
  }, [linhas])

  const terceirosLinhas = useMemo(() => {
    return linhas.filter((l) => l.tipo === "Terceiro")
  }, [linhas])

  // Filtragem de funcionários na tela
  const funcionariosFiltrados = useMemo(() => {
    return funcionariosLinhas.filter((l) => {
      if (!mostrarOcultos && l.oculto) return false
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const nomeOk = l.nome?.toLowerCase().includes(termo)
        const funcaoOk = l.funcao?.toLowerCase().includes(termo)
        const pixOk = (l.pix || l.chave_pix || "").toLowerCase().includes(termo)
        if (!nomeOk && !funcaoOk && !pixOk) return false
      }
      return true
    })
  }, [funcionariosLinhas, mostrarOcultos, busca])

  // Filtragem de terceiros na tela
  const terceirosFiltrados = useMemo(() => {
    return terceirosLinhas.filter((l) => {
      if (!mostrarOcultos && l.oculto) return false
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const nomeOk = l.nome?.toLowerCase().includes(termo)
        const obsOk = (l.observacao_linha || "").toLowerCase().includes(termo)
        const pixOk = (l.pix || l.chave_pix || "").toLowerCase().includes(termo)
        if (!nomeOk && !obsOk && !pixOk) return false
      }
      return true
    })
  }, [terceirosLinhas, mostrarOcultos, busca])

  // CÁLCULOS DINÂMICOS PARA CADA FUNCIONÁRIO (seguindo as regras da planilha modelo)
  // Se houver tabela oficial, calcula os valores recomendados; senão, mantém null ou digitado
  interface LinhaGeralProcessada
    extends FolhaPagamentoLinha {
    // Componentes discriminados do líquido
    // Líquido decomposto calculado que fecha 100% com a fórmula
    // Líquido da aba Geral (mensal + produção)
    inssCalculado: number | null
    familiaCalculado: number | null
    irrfCalculado: number | null
    quinzenaCalculada: number
    mensalCalculado: number
    inssFinal: number
    familiaFinal: number
    irrfFinal: number
    quinzenaFinal: number
    mensalFinal: number
    liquidoGeral: number
    isInssSobrescrito: boolean
    isFamiliaSobrescrito: boolean
    isIrrfSobrescrito: boolean
    isQuinzenaSobrescrita: boolean
    isMensalSobrescrito: boolean
    producaoTotal: number
    limpezaTotal: number
    sabadoTotal: number
    feriasTotal: number
    ajudaTotal: number
    gratificacaoTotal: number
    comissaoTotal: number
    vendasAjudaTotal: number
    adiantamentoTotal: number
    aPagarProducao: number
    producaoGeralMais: number
    liquidoComposto: number
  }

  const linhasGeralProcessadas = useMemo<LinhaGeralProcessada[]>(() => {
    return funcionariosFiltrados.map((l) => {
      const bruto = Number(l.bruto || 0)
      const filhos = Number(l.filhos || 0)

      const inssCalc = calcularInssProgressivo(bruto, tabelaOficial)
      const familiaCalc = calcularSalarioFamilia(bruto, filhos, tabelaOficial)
      const irrfCalc = calcularIrrf(
        bruto,
        inssCalc ?? Number(l.inss || 0),
        tabelaOficial,
      )
      const quinzenaCalc = calcularQuinzena(bruto, percentualQuinzena)

      // Valores finais fiscais e adiantamento
      const inssFinal = Number(l.inss ?? inssCalc ?? 0)
      const familiaFinal = Number(l.familia ?? familiaCalc ?? 0)
      const irrfFinal = Number(l.ir ?? irrfCalc ?? 0)
      // Quinzena: se modo_calculo for 'Digitado' e houver valor digitado pelo usuário, respeita;
      // caso contrário (modo_calculo <> 'Digitado'), sempre calcula automaticamente (bruto × % da competência)
      const quinzenaFinal =
        l.modo_calculo === "Digitado" &&
        l.quinzena !== undefined &&
        l.quinzena !== null &&
        Number(l.quinzena) > 0
          ? Number(l.quinzena)
          : quinzenaCalc

      // Regra Valdercleiton: forçar producaoTotal = 0 e usar mensal puro = bruto - inss - quinzena (sem comissão e sem ajuda)
      const isValdercleiton = (l.nome || "")
        .toUpperCase()
        .includes("VALDERCLEITON")

      // Extras
      const obras = Number(l.obras || 0)
      const valorObra = Number(l.valor_obra ?? 20)
      const producaoTotal = isValdercleiton
        ? 0
        : l.producao !== undefined && Number(l.producao) > 0
          ? Number(l.producao)
          : obras * valorObra
      const limpezaTotal = Number(l.limpeza || 0)
      const sabadoTotal = Number(l.sabado || 0)
      const feriasTotal = Number(l.ferias || 0)
      const ajudaTotal = Number(l.ajuda_custo || 0)
      const gratificacaoTotal = Number(l.gratificacao || 0)
      const comissaoTotal = Number(l.comissao || 0)
      const vendasAjudaTotal = Number(l.vendas_ajuda || 0)
      const adiantamentoTotal = Number(l.adiantamento || 0)

      // PRODUÇÃO(+) da GERAL = calcularProducaoTotal(linha) + gratificacao
      // = obras×valor + limpeza + sabado + feriado + ajuda_custo + gratificacao
      const producaoCompletaCalc = calcularProducaoTotal(l) + gratificacaoTotal
      const producaoGeralMais = isValdercleiton ? 0 : producaoCompletaCalc

      // A PAGAR da tabela de produção: producaoTotal + gratificacaoTotal - adiantamentoTotal
      const aPagarProducao = isValdercleiton
        ? 0
        : Math.round((producaoGeralMais - adiantamentoTotal) * 100) / 100

      // Cálculo do MENSAL LÍQUIDO:
      // REGRA OFICIAL GC MIX (para TODOS os funcionários):
      // MENSAL (LÍQUIDO) = Salário Bruto − INSS − IRRF − Quinzena − Quinzena 2 (se houver)
      // Sem adicionais (Gratificação, Limpeza, Sábado, Feriado, Férias, Ajuda, Comissão, Vendas/Ajuda).
      // Adiantamento desconta exclusivamente no Líquido Total.
      // Aplica a fórmula pura SEMPRE e PARA TODOS (inclusive linhas em modo Digitado).
      const quinzena2Final = Number(l.quinzena_2 || 0)
      const mensalCalculadoSemProd = calcularMensalSemProducao(
        bruto,
        inssFinal,
        familiaFinal,
        irrfFinal,
        quinzenaFinal,
        {
          quinzena_2: quinzena2Final,
        },
      )

      // Exibição do mensal deve usar SEMPRE a fórmula pura recalculada para todos
      const mensalFinal = mensalCalculadoSemProd
      const mensalCalc = mensalCalculadoSemProd

      // Líquido completo para a aba GERAL:
      // LÍQUIDO GERAL = mensalFinal (puro) + PRODUÇÃO(+) − adiantamento
      const liquidoGeral =
        Math.round(
          (mensalFinal + producaoGeralMais - adiantamentoTotal) * 100,
        ) / 100
      const liquidoComposto = liquidoGeral

      const isInssSobrescrito =
        inssCalc !== null &&
        Math.abs(inssFinal - inssCalc) > 0.05 &&
        inssFinal > 0
      const isFamiliaSobrescrito =
        familiaCalc !== null && Math.abs(familiaFinal - familiaCalc) > 0.05
      const isIrrfSobrescrito =
        irrfCalc !== null &&
        Math.abs(irrfFinal - irrfCalc) > 0.05 &&
        irrfFinal > 0
      const isQuinzenaSobrescrita =
        l.modo_calculo === "Digitado" &&
        Math.abs(quinzenaFinal - quinzenaCalc) > 0.05
      const isMensalSobrescrito = Math.abs(mensalFinal - mensalCalc) > 0.05

      return {
        ...l,
        inssCalculado: inssCalc,
        familiaCalculado: familiaCalc,
        irrfCalculado: irrfCalc,
        quinzenaCalculada: quinzenaCalc,
        mensalCalculado: mensalCalc,
        inssFinal,
        familiaFinal,
        irrfFinal,
        quinzenaFinal,
        mensalFinal,
        liquidoGeral,
        isInssSobrescrito,
        isFamiliaSobrescrito,
        isIrrfSobrescrito,
        isQuinzenaSobrescrita,
        isMensalSobrescrito,
        producaoTotal,
        limpezaTotal,
        sabadoTotal,
        feriasTotal,
        ajudaTotal,
        gratificacaoTotal,
        comissaoTotal,
        vendasAjudaTotal,
        adiantamentoTotal,
        aPagarProducao,
        producaoGeralMais,
        liquidoComposto,
      }
    })
  }, [funcionariosFiltrados, tabelaOficial, percentualQuinzena])

  // Processamento de Terceiros (Folha à parte: sem desconto, quinzena 40% automática pelo % da competência, mensal 60%)
  const terceirosProcessados = useMemo(() => {
    return terceirosFiltrados.map((t) => {
      const cadastrado = terceirosCadastrados.find(
        (c) =>
          (t.id && c.id === t.id) ||
          (t.nome &&
            c.nome &&
            c.nome.trim().toUpperCase() === t.nome.trim().toUpperCase()),
      )
      const ehVendedor = Boolean(
        cadastrado?.eh_vendedor ||
          (t.nome && t.nome.toUpperCase().includes("MARCIO LUAN")),
      )

      const valorMes = ehVendedor
        ? Number(t.comissao || 0) + Number(t.ajuda_custo || 0)
        : Number(t.salario_liquido || t.bruto || 0)

      const quinzenaAuto = ehVendedor
        ? 0
        : Math.round(valorMes * percentualQuinzena * 100) / 100
      const quinzena = ehVendedor
        ? 0
        : t.modo_calculo === "Digitado" &&
            t.quinzena !== undefined &&
            t.quinzena !== null &&
            Number(t.quinzena) > 0
          ? Number(t.quinzena)
          : quinzenaAuto
      const mensal = ehVendedor
        ? valorMes
        : Math.round((valorMes - quinzena) * 100) / 100
      return {
        ...t,
        ehVendedor,
        valorMes,
        quinzena,
        mensal,
      }
    })
  }, [terceirosFiltrados, terceirosCadastrados, percentualQuinzena])

  // Helper: identifica se o colaborador é lançador/responsável de vendas (ex: VALDERCLEITON FREIRE DE OLIVEIRA)
  // que deve ser retirado da produção principal e ter seção própria em VENDAS
  const isLancadorVendas = (nome: string | undefined | null) =>
    (nome || "").toUpperCase().includes("VALDERCLEITON")

  // Linhas da Aba PRODUÇÃO (filtra fora Valdercleiton — ele fica exclusivamente na aba de Vendas)
  const linhasProducao = useMemo(() => {
    return funcionariosFiltrados
      .filter((l) => !isLancadorVendas(l.nome))
      .map((l) => {
        const producaoTotal = calcularProducaoTotal(l)
        const aPagar = calcularAPagarProducao(l)
        return {
          ...l,
          producaoTotal,
          aPagar,
        }
      })
  }, [funcionariosFiltrados])

  // Dados exclusivos do lançador de vendas (Valdercleiton) para a aba VENDAS
  const dadosLancadorVendas = useMemo(() => {
    const lancador = funcionariosFiltrados.find((l) => isLancadorVendas(l.nome))
    if (!lancador) return null

    const vendasObra = Number(lancador.vendas_obra || 0)
    const comissaoAuto = calcularComissaoVendas(vendasObra)
    const isComissaoSobrescrita =
      lancador.modo_calculo === "Digitado" ||
      (vendasObra > 0 &&
        Math.abs(Number(lancador.comissao || 0) - comissaoAuto) > 0.05)
    const comissaoFinal = Number(lancador.comissao || comissaoAuto)
    const ajudaCusto = Number(
      lancador.ajuda_custo || lancador.vendas_ajuda || 0,
    )
    const totalReceberVendas = comissaoFinal + ajudaCusto

    return {
      linha: lancador,
      vendasObra,
      comissaoAuto,
      comissaoFinal,
      isComissaoSobrescrita,
      ajudaCusto,
      totalReceberVendas,
    }
  }, [funcionariosFiltrados])

  // Linhas de Funcionários da Aba VENDAS (comissão 0,5% ou digitada)
  const linhasVendasFuncionarios = useMemo(() => {
    const candidatos = funcionariosFiltrados.filter(
      (l) =>
        Number(l.vendas_obra || 0) > 0 ||
        Number(l.comissao || 0) > 0 ||
        (l.nome && l.nome.toUpperCase().includes("VALDERCLEITON")) ||
        (l.funcao && l.funcao.toUpperCase().includes("VENDEDOR")) ||
        (l.cargo && l.cargo.toUpperCase().includes("VENDEDOR")),
    )
    return candidatos.map((l) => {
      const comissaoAuto = calcularComissaoVendas(Number(l.vendas_obra || 0))
      const isComissaoSobrescrita =
        l.modo_calculo === "Digitado" ||
        (Number(l.vendas_obra || 0) > 0 &&
          Math.abs(Number(l.comissao || 0) - comissaoAuto) > 0.05)
      const comissaoFinal = Number(l.comissao || comissaoAuto)
      return {
        ...l,
        comissaoAuto,
        comissaoFinal,
        isComissaoSobrescrita,
      }
    })
  }, [funcionariosFiltrados])

  // Linhas de Vendedores Terceiros da Aba VENDAS (fora da folha, ex: Márcio Luan — Raimundo segue fora)
  // Utiliza tabela progressiva marginal de comissões por faixa
  const linhasVendasTerceiros = useMemo(() => {
    // 1. Identifica terceiros marcados como vendedores no cadastro (folha_terceiros)
    const vendedoresCadastrados = terceirosCadastrados.filter(
      (c) => c.eh_vendedor || c.nome.toUpperCase().includes("MARCIO LUAN"),
    )

    // 2. Mapeia com a linha da competência (ou cria representação com dados do cadastro se ainda não tiver linha)
    const linhasVendedores: FolhaPagamentoLinha[] = []

    // Procura nas linhas de terceiros da competência atual
    terceirosFiltrados.forEach((t) => {
      const cadastrado = terceirosCadastrados.find(
        (c) =>
          c.id === t.id ||
          c.nome.toUpperCase() === t.nome.toUpperCase() ||
          t.nome.toUpperCase().includes(c.nome.toUpperCase()),
      )
      const ehVendedor =
        cadastrado?.eh_vendedor ||
        t.nome.toUpperCase().includes("MARCIO LUAN") ||
        (t.tipo === "Terceiro" &&
          (Number(t.vendas_obra || 0) > 0 || Number(t.comissao || 0) > 0))

      // Raimundo NUNCA é vendedor
      if (ehVendedor && !t.nome.toUpperCase().includes("RAIMUNDO")) {
        linhasVendedores.push({
          ...t,
          conta: t.conta || cadastrado?.conta || "",
          pix: t.pix || t.chave_pix || cadastrado?.pix || "",
        })
      }
    })

    // Se houver terceiro vendedor no cadastro mas ainda não existir linha na competência, inclui
    vendedoresCadastrados.forEach((vc) => {
      if (vc.nome.toUpperCase().includes("RAIMUNDO")) return
      const jaExiste = linhasVendedores.some(
        (l) => l.nome.toUpperCase() === vc.nome.toUpperCase(),
      )
      if (!jaExiste) {
        linhasVendedores.push({
          id: vc.id,
          empresa_id: vc.empresa_id,
          competencia,
          tipo: "Terceiro",
          nome: vc.nome,
          cargo: "VENDEDOR TERCEIRO",
          funcao: "VENDEDOR TERCEIRO",
          unidade: vc.unidade || "MONTEIRO",
          salario_base: 0,
          bruto: Number(vc.bruto || 0),
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
          feriado: 0,
          ferias: 0,
          ajuda_custo: 0,
          vendas_obra: 0,
          comissao: 0,
          vendas_ajuda: 0,
          mensal_liquido: Number(vc.bruto || 0),
          salario_liquido: Number(vc.bruto || 0),
          conta: vc.conta || "",
          pix: vc.pix || "",
          chave_pix: vc.pix || "",
          observacao_linha: vc.obs || "",
          modo_calculo: "Calculado",
          oculto: false,
          inativo: false,
        })
      }
    })

    return linhasVendedores.map((t) => {
      const vendas = Number(t.vendas_obra || 0)
      const temTabelaConfigurada = Boolean(
        faixasComissao && faixasComissao.length > 0,
      )
      const comissaoProgressiva = temTabelaConfigurada
        ? (calcularComissaoProgressivaMarginal(vendas, faixasComissao) ?? 0)
        : 0
      const comissaoAuto = comissaoProgressiva

      // Quando modo_calculo !== 'Digitado', a comissão exibida/salva deve ser SEMPRE a progressiva automática
      // Badge 'Digitado' apenas quando modo_calculo === 'Digitado'
      const isComissaoSobrescrita = t.modo_calculo === "Digitado"

      const comissaoFinal =
        isComissaoSobrescrita && t.comissao !== undefined && t.comissao !== null
          ? Number(t.comissao)
          : comissaoAuto

      return {
        ...t,
        comissaoAuto,
        comissaoFinal,
        isComissaoSobrescrita,
        temTabelaConfigurada,
      }
    })
  }, [terceirosFiltrados, terceirosCadastrados, faixasComissao, competencia])

  // Todas as linhas de vendas combinadas (mantendo compatibilidade com linhasVendas anterior)
  const linhasVendas = useMemo(() => {
    return [...linhasVendasFuncionarios, ...linhasVendasTerceiros]
  }, [linhasVendasFuncionarios, linhasVendasTerceiros])

  // TOTAIS DA ABA GERAL (FUNCIONÁRIOS) COM DISCRIMINAÇÃO COMPLETA
  const totaisGeral = useMemo(() => {
    return linhasGeralProcessadas.reduce(
      (acc, l) => {
        acc.bruto += Number(l.bruto || 0)
        acc.filhos += Number(l.filhos || 0)
        acc.inss += l.inssFinal
        acc.familia += l.familiaFinal
        acc.irrf += l.irrfFinal
        acc.quinzena += l.quinzenaFinal
        acc.producao += l.producaoTotal
        acc.limpeza += l.limpezaTotal
        acc.sabado += l.sabadoTotal
        acc.ferias += l.feriasTotal
        acc.ajuda_custo += l.ajudaTotal
        acc.gratificacao += l.gratificacaoTotal
        acc.comissao += l.comissaoTotal
        acc.vendas_ajuda += l.vendasAjudaTotal
        acc.adiantamento += l.adiantamentoTotal
        acc.aPagarProducao += l.aPagarProducao
        acc.producaoGeralMais += l.producaoGeralMais
        acc.mensal += l.mensalFinal
        acc.liquidoGeral += l.liquidoGeral
        return acc
      },
      {
        bruto: 0,
        filhos: 0,
        inss: 0,
        familia: 0,
        irrf: 0,
        quinzena: 0,
        producao: 0,
        limpeza: 0,
        sabado: 0,
        ferias: 0,
        ajuda_custo: 0,
        gratificacao: 0,
        comissao: 0,
        vendas_ajuda: 0,
        adiantamento: 0,
        aPagarProducao: 0,
        producaoGeralMais: 0,
        mensal: 0,
        liquidoGeral: 0,
      },
    )
  }, [linhasGeralProcessadas])

  // TOTAIS TERCEIROS
  const totaisTerceiros = useMemo(() => {
    return terceirosProcessados.reduce(
      (acc, t) => {
        acc.valorMes += t.valorMes
        acc.quinzena += t.quinzena
        acc.mensal += t.mensal
        return acc
      },
      { valorMes: 0, quinzena: 0, mensal: 0 },
    )
  }, [terceirosProcessados])

  // Helper para identificar Márcio Luan (deve ficar fora da aba MENSAL e de seus totais)
  const isMarcioLuan = (nome: string | undefined | null) =>
    (nome || "").toUpperCase().includes("MARCIO LUAN")

  // Terceiros exibidos e somados na aba MENSAL (exclui Márcio Luan — ele fica só na aba VENDAS)
  const terceirosMensal = useMemo(() => {
    return terceirosProcessados.filter((t) => !isMarcioLuan(t.nome))
  }, [terceirosProcessados])

  // Totais de terceiros para a aba MENSAL (sem Márcio Luan)
  const totaisTerceirosMensal = useMemo(() => {
    return terceirosMensal.reduce(
      (acc, t) => {
        acc.valorMes += t.valorMes
        acc.quinzena += t.quinzena
        acc.mensal += t.mensal
        return acc
      },
      { valorMes: 0, quinzena: 0, mensal: 0 },
    )
  }, [terceirosMensal])

  // TOTAIS PRODUÇÃO
  const totaisProducao = useMemo(() => {
    return linhasProducao.reduce(
      (acc, l) => {
        acc.obras += Number(l.obras || 0)
        acc.limpeza += Number(l.limpeza || 0)
        acc.sabado += Number(l.sabado || 0)
        acc.feriado += Number(l.feriado || 0)
        acc.ajuda_custo += Number(l.ajuda_custo || 0)
        acc.adiantamento += Number(l.adiantamento || 0)
        acc.gratificacao += Number(l.gratificacao || 0)
        acc.producao += l.producaoTotal
        acc.aPagar += l.aPagar
        return acc
      },
      {
        obras: 0,
        limpeza: 0,
        sabado: 0,
        feriado: 0,
        ajuda_custo: 0,
        adiantamento: 0,
        gratificacao: 0,
        producao: 0,
        aPagar: 0,
      },
    )
  }, [linhasProducao])

  // TOTAIS VENDAS FUNCIONÁRIOS
  const totaisVendasFuncionarios = useMemo(() => {
    return linhasVendasFuncionarios.reduce(
      (acc, l) => {
        acc.vendas_obra += Number(l.vendas_obra || 0)
        acc.comissao += l.comissaoFinal
        return acc
      },
      { vendas_obra: 0, comissao: 0 },
    )
  }, [linhasVendasFuncionarios])

  // TOTAIS VENDAS TERCEIROS
  const totaisVendasTerceiros = useMemo(() => {
    return linhasVendasTerceiros.reduce(
      (acc, l) => {
        acc.vendas_obra += Number(l.vendas_obra || 0)
        acc.comissao += l.comissaoFinal
        return acc
      },
      { vendas_obra: 0, comissao: 0 },
    )
  }, [linhasVendasTerceiros])

  // TOTAIS VENDAS (GERAL: FUNCIONÁRIOS + TERCEIROS VENDEDORES)
  const totaisVendas = useMemo(() => {
    return {
      vendas_obra:
        totaisVendasFuncionarios.vendas_obra +
        totaisVendasTerceiros.vendas_obra,
      comissao:
        totaisVendasFuncionarios.comissao + totaisVendasTerceiros.comissao,
    }
  }, [totaisVendasFuncionarios, totaisVendasTerceiros])

  // CÁLCULO DA CONSOLIDAÇÃO DAS DUAS FOLHAS (MONTEIRO + SJE)
  const consolidacaoDuasFolhas = useMemo(() => {
    // Se a empresa ativa atual for Monteiro ou SJE, podemos usar os dados já calculados e reativos da tela para a empresa ativa
    const isAtivaMonteiro = empresaAtiva?.id === ID_EMPRESA_MONTEIRO
    const isAtivaSje = empresaAtiva?.id === ID_EMPRESA_SJE

    // Cálculo Monteiro
    let monteiro: CalculoUnidadeConsolidada
    if (isAtivaMonteiro) {
      monteiro = {
        totalFuncionarios: Math.round(totaisGeral.liquidoGeral * 100) / 100,
        totalTerceiros: Math.round(totaisTerceiros.valorMes * 100) / 100,
        valorReal:
          Math.round(
            (totaisGeral.liquidoGeral + totaisTerceiros.valorMes) * 100,
          ) / 100,
        totalVendas: Math.round(totaisVendas.vendas_obra * 100) / 100,
        totalComissoes: Math.round(totaisVendas.comissao * 100) / 100,
        qtdFuncionarios: linhasGeralProcessadas.length,
        qtdTerceiros: terceirosProcessados.length,
        linhasCount: linhas.length,
      }
    } else {
      monteiro = calcularValorRealEmpresa(
        linhasConsolidacaoMonteiro,
        terceirosMonteiro,
      )
    }

    // Cálculo SJE
    let sje: CalculoUnidadeConsolidada
    if (isAtivaSje) {
      sje = {
        totalFuncionarios: Math.round(totaisGeral.liquidoGeral * 100) / 100,
        totalTerceiros: Math.round(totaisTerceiros.valorMes * 100) / 100,
        valorReal:
          Math.round(
            (totaisGeral.liquidoGeral + totaisTerceiros.valorMes) * 100,
          ) / 100,
        totalVendas: Math.round(totaisVendas.vendas_obra * 100) / 100,
        totalComissoes: Math.round(totaisVendas.comissao * 100) / 100,
        qtdFuncionarios: linhasGeralProcessadas.length,
        qtdTerceiros: terceirosProcessados.length,
        linhasCount: linhas.length,
      }
    } else {
      sje = calcularValorRealEmpresa(linhasConsolidacaoSje, terceirosSje)
    }

    const temMonteiro = monteiro.linhasCount > 0
    const temSje = sje.linhasCount > 0
    const totalConsolidado =
      Math.round((monteiro.valorReal + sje.valorReal) * 100) / 100
    const totalVendasConsolidado =
      Math.round((monteiro.totalVendas + sje.totalVendas) * 100) / 100
    const totalComissoesConsolidado =
      Math.round((monteiro.totalComissoes + sje.totalComissoes) * 100) / 100

    return {
      monteiro,
      sje,
      temMonteiro,
      temSje,
      totalConsolidado,
      totalVendasConsolidado,
      totalComissoesConsolidado,
    }
  }, [
    empresaAtiva?.id,
    totaisGeral.liquidoGeral,
    totaisTerceiros.valorMes,
    totaisVendas.vendas_obra,
    totaisVendas.comissao,
    linhasGeralProcessadas.length,
    terceirosProcessados.length,
    linhas.length,
    linhasConsolidacaoMonteiro,
    terceirosMonteiro,
    linhasConsolidacaoSje,
    terceirosSje,
  ])

  // RESUMO GERAL CONSOLIDADO (Aba 6)
  const resumo = useMemo(() => {
    const pessoasNaFolha = linhasGeralProcessadas.length
    const salariosQuinzena = totaisGeral.quinzena
    // Salários Mensal Líquido não inclui produção (produção fica separada como pagamento à parte)
    const salariosMensalLiquido = totaisGeral.mensal
    const subtotalFolha = salariosQuinzena + salariosMensalLiquido
    // Produção a pagar é item separado (pagamento à parte) sem duplicar no mensal
    const producaoAPagar = totaisProducao.aPagar
    // Vendas (comissões): inclui comissões dos funcionários + comissões dos vendedores terceiros (ex: Márcio Luan)
    const vendasComissoes = totaisVendas.comissao
    const terceirosFolha = totaisTerceiros.valorMes
    const inssRetido = totaisGeral.inss
    const irrfRetido = totaisGeral.irrf
    const salarioFamiliaPago = totaisGeral.familia

    // Total Geral do Mês = Subtotal Folha (Quinzena + Mensal Líquido sem produção) + Produção a pagar + Terceiros (folha à parte)
    // OBS: Como terceirosFolha (totaisTerceiros.valorMes) agora já soma a remuneração integral de terceiros
    // (incluindo terceiros vendedores: comissão + ajuda de custo), NÃO devemos somar comissaoTerceirosVendedores novamente,
    // garantindo que Total Geral do Mês no Resumo seja estritamente igual ao Total Geral da GERAL (totaisGeral.liquidoGeral + totaisTerceiros.valorMes).
    const comissaoTerceirosVendedores = totaisVendasTerceiros.comissao
    const totalGeralDoMes = subtotalFolha + producaoAPagar + terceirosFolha

    return {
      pessoasNaFolha,
      salariosQuinzena,
      salariosMensalLiquido,
      subtotalFolha,
      producaoAPagar,
      vendasComissoes,
      terceirosFolha,
      comissaoTerceirosVendedores,
      inssRetido,
      irrfRetido,
      salarioFamiliaPago,
      totalGeralDoMes,
    }
  }, [
    totaisGeral,
    totaisProducao,
    totaisVendas,
    totaisTerceiros,
    totaisVendasTerceiros,
    linhasGeralProcessadas.length,
  ])

  // Abrir Modal de Edição / Criação
  const abrirModalEdicao = (
    linha?: FolhaPagamentoLinha,
    tipoForcado?: "Funcionario" | "Terceiro",
  ) => {
    if (linha) {
      setLinhaEmEdicao({ ...linha })
      setInssManual(
        Boolean(
          linha.inss && linha.inss > 0 && linha.modo_calculo === "Digitado",
        ),
      )
      setFamiliaManual(
        Boolean(
          linha.familia &&
            linha.familia > 0 &&
            linha.modo_calculo === "Digitado",
        ),
      )
      setIrManual(
        Boolean(linha.ir && linha.ir > 0 && linha.modo_calculo === "Digitado"),
      )
      setQuinzenaManual(
        linha.modo_calculo === "Digitado" &&
          Boolean(linha.quinzena && linha.quinzena > 0),
      )
      setMensalManual(
        Boolean(
          linha.mensal_liquido &&
            linha.mensal_liquido > 0 &&
            linha.modo_calculo === "Digitado",
        ),
      )
      setComissaoManual(linha.modo_calculo === "Digitado")
    } else {
      const tipo = tipoForcado || "Funcionario"
      const brutoPadrao = tipo === "Terceiro" ? 0 : 2410
      const quinzenaPadrao =
        Math.round(brutoPadrao * percentualQuinzena * 100) / 100

      setLinhaEmEdicao({
        empresa_id: empresaAtiva?.id,
        competencia,
        tipo,
        nome: "",
        funcao: tipo === "Terceiro" ? "TERCEIRO" : "MOTORISTA",
        unidade: empresaAtiva?.nome?.includes("Monteiro") ? "MONTEIRO" : "SJE",
        bruto: brutoPadrao,
        filhos: 0,
        inss: 0,
        familia: 0,
        ir: 0,
        quinzena: quinzenaPadrao,
        quinzena_2: 0,
        adiantamento: 0,
        gratificacao: 0,
        obras: 0,
        valor_obra: 20,
        producao: 0,
        limpeza: 0,
        sabado: 0,
        feriado: 0,
        ferias: 0,
        ajuda_custo: 0,
        vendas_obra: 0,
        comissao: 0,
        vendas_ajuda: 0,
        mensal_liquido: brutoPadrao - quinzenaPadrao,
        conta: "",
        pix: "",
        observacao_linha: "",
        modo_calculo: "Calculado",
        oculto: false,
      })
      setInssManual(false)
      setFamiliaManual(false)
      setIrManual(false)
      setQuinzenaManual(false)
      setMensalManual(false)
      setComissaoManual(false)
    }
    setModalAberto(true)
  }

  // Atualizar campo no modal com recálculo automático se não estiver em modo manual
  const atualizarCampoEdicao = (
    campo: keyof FolhaPagamentoLinha,
    valor: any,
  ) => {
    setLinhaEmEdicao((prev) => {
      if (!prev) return null
      const updated = { ...prev, [campo]: valor }

      const bruto = Number(campo === "bruto" ? valor : updated.bruto || 0)
      const filhos = Number(campo === "filhos" ? valor : updated.filhos || 0)

      // Se mudou obras ou valor_obra
      if (campo === "obras" || campo === "valor_obra") {
        const obs = Number(campo === "obras" ? valor : updated.obras || 0)
        const valOb = Number(
          campo === "valor_obra" ? valor : (updated.valor_obra ?? 20),
        )
        updated.producao = obs * valOb
      }

      // Se mudou vendas e comissão não é manual
      if (campo === "vendas_obra" && !comissaoManual) {
        const valorVendas = Number(valor || 0)
        const isTerceiro = updated.tipo === "Terceiro"
        const ehVendedorTerceiro =
          isTerceiro &&
          (Boolean(
            terceirosCadastrados.find(
              (c) =>
                (updated.id && c.id === updated.id) ||
                (updated.nome &&
                  c.nome &&
                  c.nome.trim().toUpperCase() ===
                    updated.nome.trim().toUpperCase()),
            )?.eh_vendedor,
          ) ||
            Boolean(updated.nome?.toUpperCase().includes("MARCIO LUAN")))

        if (ehVendedorTerceiro) {
          if (faixasComissao && faixasComissao.length > 0) {
            updated.comissao =
              calcularComissaoProgressivaMarginal(
                valorVendas,
                faixasComissao,
              ) ?? 0
          } else {
            updated.comissao = 0
            toast({
              title: "Tabela progressiva não configurada",
              description: "Configure as faixas na aba TABELAS.",
              variant: "destructive",
            })
          }
        } else {
          // Só usar calcularComissaoVendas (0,5%) para funcionários e terceiros não-vendedores
          updated.comissao = calcularComissaoVendas(valorVendas)
        }
      }

      // Recálculos de INSS, Família, IRRF e Quinzena se automáticos
      let inss = Number(updated.inss || 0)
      if (!inssManual && tabelaOficial) {
        const inssCalc = calcularInssProgressivo(bruto, tabelaOficial)
        if (inssCalc !== null) inss = inssCalc
        updated.inss = inss
      }

      let familia = Number(updated.familia || 0)
      if (!familiaManual && tabelaOficial) {
        const famCalc = calcularSalarioFamilia(bruto, filhos, tabelaOficial)
        if (famCalc !== null) familia = famCalc
        updated.familia = familia
      }

      let irrf = Number(updated.ir || 0)
      if (!irManual && tabelaOficial) {
        const irCalc = calcularIrrf(bruto, inss, tabelaOficial)
        if (irCalc !== null) irrf = irCalc
        updated.ir = irrf
      }

      let quinzena = Number(updated.quinzena || 0)
      if (!quinzenaManual) {
        quinzena = calcularQuinzena(bruto, percentualQuinzena)
        updated.quinzena = quinzena
      }

      if (!mensalManual) {
        // Mensal Líquido pela fórmula pura: Bruto − INSS − IRRF − Quinzena − Quinzena 2
        updated.mensal_liquido = calcularMensalSemProducao(
          bruto,
          inss,
          familia,
          irrf,
          quinzena,
          {
            quinzena_2: updated.quinzena_2,
          },
        )
      }

      return updated
    })
  }

  // Salvar linha
  const salvarLinha = async () => {
    if (!linhaEmEdicao || !empresaAtiva?.id) return
    if (!linhaEmEdicao.nome?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do colaborador.",
        variant: "destructive",
      })
      return
    }

    try {
      const isTerceiro = linhaEmEdicao.tipo === "Terceiro"

      const payload: SalvarLinhaFolhaPayload = {
        id: linhaEmEdicao.id,
        empresa_id: empresaAtiva.id,
        competencia,
        tipo: linhaEmEdicao.tipo || "Funcionario",
        nome: linhaEmEdicao.nome.trim().toUpperCase(),
        cargo: (linhaEmEdicao.funcao || "Geral").trim().toUpperCase(),
        funcao: (linhaEmEdicao.funcao || "Geral").trim().toUpperCase(),
        unidade:
          linhaEmEdicao.unidade ||
          (empresaAtiva.nome.includes("Monteiro") ? "MONTEIRO" : "SJE"),
        bruto: Number(linhaEmEdicao.bruto || 0),
        salario_base: Number(linhaEmEdicao.bruto || 0),
        filhos: Number(linhaEmEdicao.filhos || 0),
        inss: isTerceiro ? 0 : Number(linhaEmEdicao.inss || 0),
        familia: isTerceiro ? 0 : Number(linhaEmEdicao.familia || 0),
        ir: isTerceiro ? 0 : Number(linhaEmEdicao.ir || 0),
        quinzena: isTerceiro
          ? Math.round(
              Number(linhaEmEdicao.bruto || 0) * percentualQuinzena * 100,
            ) / 100
          : Number(linhaEmEdicao.quinzena || 0),
        quinzena_2: Number(linhaEmEdicao.quinzena_2 || 0),
        adiantamento: isTerceiro ? 0 : Number(linhaEmEdicao.adiantamento || 0),
        gratificacao: Number(linhaEmEdicao.gratificacao || 0),
        obras: isTerceiro ? 0 : Number(linhaEmEdicao.obras || 0),
        valor_obra: Number(linhaEmEdicao.valor_obra ?? 20),
        producao: isTerceiro ? 0 : Number(linhaEmEdicao.producao || 0),
        limpeza: Number(linhaEmEdicao.limpeza || 0),
        sabado: Number(linhaEmEdicao.sabado || 0),
        feriado: Number(linhaEmEdicao.feriado || 0),
        ferias: Number(linhaEmEdicao.ferias || 0),
        ajuda_custo: Number(linhaEmEdicao.ajuda_custo || 0),
        // Terceiros vendedores têm vendas e comissão; terceiros não-vendedores ficam zerados
        vendas_obra: Number(linhaEmEdicao.vendas_obra || 0),
        comissao: Number(linhaEmEdicao.comissao || 0),
        vendas_ajuda: Number(linhaEmEdicao.vendas_ajuda || 0),
        // Para terceiro, mensal_liquido é o valor do mês integral (conforme quinzena 40% e mensal 60% sem desconto)
        mensal_liquido: isTerceiro
          ? Number(linhaEmEdicao.bruto || 0)
          : Number(linhaEmEdicao.mensal_liquido || 0),
        salario_liquido: isTerceiro
          ? Number(linhaEmEdicao.bruto || 0)
          : Number(linhaEmEdicao.mensal_liquido || 0),
        conta: linhaEmEdicao.conta || "",
        pix: linhaEmEdicao.pix || "",
        chave_pix: linhaEmEdicao.pix || "",
        observacao_linha: linhaEmEdicao.observacao_linha || null,
        modo_calculo:
          comissaoManual ||
          quinzenaManual ||
          inssManual ||
          familiaManual ||
          irManual ||
          mensalManual
            ? "Digitado"
            : "Calculado",
        oculto: Boolean(linhaEmEdicao.oculto),
        inativo: Boolean(linhaEmEdicao.inativo),
      }

      const salva = await FolhaService.salvarLinha(payload)
      toast({
        title: "Registro salvo",
        description: `Lançamento de ${salva.nome} atualizado com sucesso.`,
      })

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
        title: "Erro ao salvar",
        description: err.message || "Ocorreu um erro ao gravar a linha.",
        variant: "destructive",
      })
    }
  }

  // Excluir linha (apenas Administrador)
  const solicitarExclusao = (linha: FolhaPagamentoLinha) => {
    if (!isAdministrador) {
      toast({
        title: "Acesso restrito",
        description:
          "Apenas usuários com perfil Administrador podem excluir lançamentos da folha.",
        variant: "destructive",
      })
      return
    }
    setLinhaParaExcluir(linha)
  }

  const confirmarExclusao = async () => {
    if (!linhaParaExcluir || !empresaAtiva?.id) return
    try {
      await FolhaService.excluirLinha(
        linhaParaExcluir.id,
        empresaAtiva.id,
        competencia,
      )
      setLinhas((prev) => prev.filter((l) => l.id !== linhaParaExcluir.id))
      toast({
        title: "Lançamento excluído",
        description: `O registro de ${linhaParaExcluir.nome} foi removido.`,
      })
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message || "Falha ao remover o registro.",
        variant: "destructive",
      })
    } finally {
      setLinhaParaExcluir(null)
    }
  }

  // Disparar impressão de aba em A4
  const imprimirAbaA4 = (
    tipo: "geral" | "quinzena" | "mensal" | "producao" | "vendas" | "resumo" | "decimo",
  ) => {
    setTipoImpressaoA4(tipo)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Estado de edição inline da aba PRODUÇÃO
  // Colunas editáveis: 'limpeza' | 'sabado' | 'feriado' | 'ajuda_custo' | 'gratificacao' | 'adiantamento'
  type CampoProducaoEditavel = "limpeza" | "sabado" | "feriado" | "ajuda_custo" | "gratificacao" | "adiantamento"

  const [celulaAtivaProducao, setCelulaAtivaProducao] = useState<{
    linhaId: string
    campo: CampoProducaoEditavel
  } | null>(null)
  const [valorTempProducao, setValorTempProducao] = useState<string>("")
  const [salvandoCelulaProducao, setSalvandoCelulaProducao] =
    useState<string | null>(null)

  const parseValorInline = (valStr: string): number => {
    const raw = valStr.trim()
    if (!raw || raw === "-" || raw === "—") return 0
    // Remove "R$" e espaços
    let limpo = raw.replace(/[R$\s]/gi, "")
    if (limpo.includes(".") && limpo.includes(",")) {
      limpo = limpo.replace(/\./g, "").replace(",", ".")
    } else if (limpo.includes(",")) {
      limpo = limpo.replace(",", ".")
    }
    const num = parseFloat(limpo)
    return isNaN(num) ? 0 : Math.round(num * 100) / 100
  }

  const iniciarEdicaoCelula = (
    linhaId: string,
    campo: CampoProducaoEditavel,
    valorAtual: number | undefined | null,
  ) => {
    const v = Number(valorAtual || 0)
    setCelulaAtivaProducao({ linhaId, campo })
    setValorTempProducao(v > 0 ? String(v).replace(".", ",") : "")
  }

  const cancelarEdicaoCelula = () => {
    setCelulaAtivaProducao(null)
    setValorTempProducao("")
  }

  const salvarEdicaoCelula = async (
    linhaId: string,
    campo: CampoProducaoEditavel,
    novoValorTexto?: string,
  ) => {
    if (!empresaAtiva?.id) return
    const textoParaSalvar =
      novoValorTexto !== undefined ? novoValorTexto : valorTempProducao
    const numNovo = parseValorInline(textoParaSalvar)
    const chaveSalvando = `${linhaId}-${campo}`

    const linhaAtual = linhas.find((l) => l.id === linhaId)
    if (!linhaAtual) {
      cancelarEdicaoCelula()
      return
    }

    const valorAntigo = Number((linhaAtual as any)[campo] || 0)
    if (numNovo === valorAntigo) {
      cancelarEdicaoCelula()
      return
    }

    setCelulaAtivaProducao(null)
    setSalvandoCelulaProducao(chaveSalvando)

    // Atualização otimista imediata na lista de linhas
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.id !== linhaId) return l
        return {
          ...l,
          [campo]: numNovo,
          updated_at: new Date().toISOString(),
        }
      }),
    )

    try {
      const linhaGravada = await FolhaService.atualizarCamposProducaoLinha(
        linhaId,
        empresaAtiva.id,
        competencia,
        { [campo]: numNovo },
      )
      // Mescla com retorno do backend
      setLinhas((prev) =>
        prev.map((l) => (l.id === linhaId ? { ...l, ...linhaGravada } : l)),
      )
      toast({
        title: "Produção salva",
        description: `${linhaAtual.nome} atualizado com sucesso.`,
      })
    } catch (err: any) {
      // Reverte em caso de erro
      setLinhas((prev) =>
        prev.map((l) => {
          if (l.id !== linhaId) return l
          return {
            ...l,
            [campo]: valorAntigo,
          }
        }),
      )
      toast({
        title: "Erro ao salvar",
        description: err.message || "Falha ao gravar campo da produção.",
        variant: "destructive",
      })
    } finally {
      setSalvandoCelulaProducao(null)
    }
  }

  // Formatação moeda BRL
  const fmtMoeda = (val: number | undefined | null) => {
    if (val === null || val === undefined) return "-"
    return Number(val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Rótulo amigável: '2026-09' -> 'SETEMBRO/2026'
  const rotuloCompetenciaMesAno = useMemo(() => {
    const meses = [
      "JANEIRO",
      "FEVEREIRO",
      "MARÇO",
      "ABRIL",
      "MAIO",
      "JUNHO",
      "JULHO",
      "AGOSTO",
      "SETEMBRO",
      "OUTUBRO",
      "NOVEMBRO",
      "DEZEMBRO",
    ]
    const [ano, mes] = competencia.split("-").map(Number)
    if (!ano || !mes) return competencia
    return `${meses[mes - 1]}/${ano}`
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
            <Badge
              variant="outline"
              className="text-xs font-semibold uppercase"
            >
              {empresaAtiva?.nome || "Unidade"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Replicado fielmente do modelo de folha da concreteira: Geral,
            Quinzena, Mensal, Produção, Vendas e Resumo.
          </p>
        </div>

        {/* Seletor de Competência e Ação */}
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
            <Select
              value={competencia}
              onValueChange={(val) => setCompetencia(val)}
            >
              <SelectTrigger className="h-8 w-44 font-semibold bg-background">
                <SelectValue>{rotuloCompetenciaMesAno}</SelectValue>
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
            variant="outline"
            className="ml-2 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            disabled={gerandoLancamentos}
            onClick={async () => {
              if (!empresaAtiva?.id) return
              const conf = window.confirm(
                `Deseja gerar os lançamentos da competência ${competencia} com base na competência anterior?\n\n- Copia funcionários ativos/ocultos e terceiros\n- Salários base do mês anterior\n- Quinzena = ${Math.round(percentualQuinzena * 100)}% do salário\n- INSS e IRRF calculados pelas tabelas oficiais 2026\n- Produção e comissões zeradas para lançamento`,
              )
              if (!conf) return
              setGerandoLancamentos(true)
              try {
                const res = await FolhaService.lancarLinhasCompetencia(
                  empresaAtiva.id,
                  competencia,
                )
                toast({
                  title: "Lançamento da competência realizado!",
                  description: `${res.inseridos} novos lançamentos inseridos e ${res.atualizados} atualizados para ${competencia}.`,
                })
                // Recarrega os dados da competência na tela
                const [compData, dataLinhas] = await Promise.all([
                  FolhaService.getCompetencia(empresaAtiva.id, competencia),
                  FolhaService.getLinhasCompetencia(
                    empresaAtiva.id,
                    competencia,
                  ),
                ])
                setCompetenciaObj(compData)
                setLinhas(dataLinhas)
              } catch (err: any) {
                toast({
                  title: "Erro ao gerar lançamentos",
                  description: err.message || "Falha ao processar folha.",
                  variant: "destructive",
                })
              } finally {
                setGerandoLancamentos(false)
              }
            }}
            title={`Gerar/Preencher as linhas da competência ${competencia} a partir da anterior`}
          >
            {gerandoLancamentos ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Gerar Competência
          </Button>

          <Button
            size="sm"
            className="ml-1 gap-1.5"
            onClick={() => abrirModalEdicao()}
          >
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* AVISO QUANDO TABELAS OFICIAIS NÃO ESTÃO CONFIGURADAS */}
      {!tabelaOficial && (
        <Alert variant="destructive" className="print:hidden">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configure as tabelas oficiais</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            As alíquotas oficiais de INSS, Salário-Família e IRRF ainda não
            foram configuradas para esta empresa. Os campos automáticos de
            impostos ficam vazios até a configuração na aba{" "}
            <strong>Tabelas</strong> (acesso Administrador).
          </AlertDescription>
        </Alert>
      )}

      {/* ABAS FIÉIS AO EXCEL MODELO: GERAL, QUINZENA, MENSAL, PRODUÇÃO, VENDAS, RESUMO (+ TABELAS ADMIN) */}
      <Tabs
        value={abaAtiva}
        onValueChange={setAbaAtiva}
        className="space-y-4 print:hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <TabsList className="bg-muted p-1 flex-wrap h-auto">
            <TabsTrigger value="geral" className="gap-2 font-semibold">
              <Briefcase className="h-4 w-4" />
              GERAL
            </TabsTrigger>
            <TabsTrigger value="quinzena" className="gap-2 font-semibold">
              <Calendar className="h-4 w-4" />
              QUINZENA
            </TabsTrigger>
            <TabsTrigger value="mensal" className="gap-2 font-semibold">
              <DollarSign className="h-4 w-4" />
              MENSAL
            </TabsTrigger>
            <TabsTrigger value="producao" className="gap-2 font-semibold">
              <Layers className="h-4 w-4" />
              PRODUÇÃO
            </TabsTrigger>
            <TabsTrigger value="vendas" className="gap-2 font-semibold">
              <TrendingUp className="h-4 w-4" />
              VENDAS
            </TabsTrigger>
            <TabsTrigger value="resumo" className="gap-2 font-semibold">
              <Award className="h-4 w-4" />
              RESUMO
            </TabsTrigger>
            <TabsTrigger
              value="decimo"
              className="gap-2 font-semibold text-blue-600 dark:text-blue-400"
            >
              <Gift className="h-4 w-4" />
              13º
            </TabsTrigger>
            {isAdministrador && (
              <>
                <TabsTrigger
                  value="tabelas"
                  className="gap-2 font-semibold text-amber-600"
                >
                  <TableIcon className="h-4 w-4" />
                  TABELAS (ADMIN)
                </TabsTrigger>
                <TabsTrigger
                  value="backup"
                  className="gap-2 font-semibold text-primary"
                >
                  <Database className="h-4 w-4" />
                  BACKUP
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou PIX..."
                className="pl-8 h-9 text-xs"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <Button
              variant={mostrarOcultos ? "secondary" : "outline"}
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => setMostrarOcultos(!mostrarOcultos)}
              title="Alternar exibição de colaboradores ocultos (ex: Renilson)"
            >
              {mostrarOcultos ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              {mostrarOcultos ? "Ocultos Visíveis" : "Mostrar Ocultos"}
            </Button>
          </div>
        </div>

        {/* =========================================================================
            ABA 1: GERAL (A PRINCIPAL DE DIGITAÇÃO)
        ========================================================================== */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            {/* CABEÇALHO CONFORME PLANILHA EXCEL */}
            <CardHeader className="py-3 px-4 border-b space-y-3 bg-muted/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded border">
                    <span className="font-bold text-foreground">
                      Competência:
                    </span>
                    <span className="text-primary font-bold">
                      {rotuloCompetenciaMesAno}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded border">
                    <span className="font-bold text-foreground">Data:</span>
                    <Input
                      value={dataCompetencia}
                      onChange={(e) => setDataCompetencia(e.target.value)}
                      onBlur={() =>
                        salvarConfigCompetencia(
                          dataCompetencia,
                          percentualQuinzena,
                        )
                      }
                      className="h-6 w-28 text-xs font-mono"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded border">
                    <span className="font-bold text-foreground">
                      % Quinzena:
                    </span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={percentualQuinzena}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0
                          setPercentualQuinzena(v)
                        }}
                        onBlur={() =>
                          salvarConfigCompetencia(
                            dataCompetencia,
                            percentualQuinzena,
                          )
                        }
                        className="h-6 w-16 text-xs font-mono font-bold text-center"
                      />
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        ({Math.round(percentualQuinzena * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-1.5 text-xs font-semibold"
                    onClick={toggleTodasLinhas}
                    title="Expandir/recolher discriminação de todas as linhas"
                  >
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    {todasExpandidas ? "Ocultar Detalhes" : "Discriminar Todos"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => imprimirAbaA4("geral")}
                    title="Imprimir Folha Geral em A4"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimir Geral A4
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => abrirModalEdicao()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Funcionário
                  </Button>
                </div>
              </div>

              {/* LEGENDA E FÓRMULA DISCRIMINADA */}
              <div className="space-y-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-amber-900 dark:text-amber-200">
                <div className="text-[11px] flex flex-wrap items-center gap-2">
                  <span className="font-bold">🟡 AMARELO = você digita</span>
                  <span>·</span>
                  <span className="font-bold">
                    ⚪ CINZA = calculado sozinho
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-primary">
                    🔍 Clique na linha ou no botão da coluna DETALHE para ver
                    toda a composição que forma o Líquido
                  </span>
                </div>
                <div className="text-[11px] font-mono bg-background/80 p-2 rounded border border-amber-500/30 text-foreground flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                  <span className="font-bold text-primary">
                    FÓRMULA DO LÍQUIDO TOTAL (GERAL):
                  </span>
                  <span>
                    Líquido Total = Mensal (Bruto − INSS − IRRF + Família +
                    Gratificação − Quinzena − Adiantamento + Limpeza + Sábado +
                    Férias + Ajuda + Comissão) + Produção (Obras×Valor,
                    pagamento à parte)
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* TABELA DE FUNCIONÁRIOS GERAL COM DISCRIMINAÇÃO COMPLETA */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">Nº</th>
                      <th
                        className="py-2.5 px-2 text-center w-8 print:hidden"
                        title="Expandir/recolher detalhamento"
                      >
                        DET.
                      </th>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-2">FUNÇÃO</th>
                      <th className="py-2.5 px-2 text-right bg-amber-100/50 dark:bg-amber-950/20 font-bold text-amber-900 dark:text-amber-200">
                        TOTAL BRUTO
                      </th>
                      <th className="py-2.5 px-2 text-center bg-amber-100/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                        FILHOS
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20"
                        title="PRODUÇÃO (+) = Obras×Valor + Limpeza + Sábado + Feriado + Ajuda + Gratificação"
                      >
                        PRODUÇÃO (+)
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-muted-foreground font-semibold bg-blue-50/40 dark:bg-blue-950/20"
                        title="Quinzena"
                      >
                        QUINZENA
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-red-600"
                        title="Desconto INSS (base = salário bruto)"
                      >
                        INSS (−)
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-emerald-600"
                        title="Salário Família"
                      >
                        FAMÍLIA (+)
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-red-600"
                        title="Desconto IRRF (base = salário bruto − INSS)"
                      >
                        IRRF (−)
                      </th>
                      <th
                        className="py-2.5 px-2 text-right font-bold text-primary bg-primary/10"
                        title="Líquido total a receber na Geral (Mensal + Produção)"
                      >
                        LÍQUIDO TOTAL
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                      <th className="py-2.5 px-3">OBS</th>
                      <th className="py-2.5 px-2 text-center print:hidden">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasGeralProcessadas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={17}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {carregando
                            ? "Carregando folha..."
                            : "Nenhum funcionário cadastrado nesta competência."}
                        </td>
                      </tr>
                    ) : (
                      linhasGeralProcessadas.map((l, index) => {
                        const isExpandida = Boolean(linhasExpandidas[l.id])
                        const temExtras =
                          l.producaoTotal > 0 ||
                          l.limpezaTotal > 0 ||
                          l.sabadoTotal > 0 ||
                          l.feriasTotal > 0 ||
                          l.ajudaTotal > 0 ||
                          l.gratificacaoTotal > 0 ||
                          l.comissaoTotal > 0 ||
                          l.vendasAjudaTotal > 0 ||
                          l.adiantamentoTotal > 0

                        return (
                          <>
                            <tr
                              key={l.id}
                              className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                                l.oculto ? "bg-amber-500/5 opacity-80" : ""
                              } ${isExpandida ? "bg-muted/30" : ""}`}
                              onClick={() => toggleLinhaExpandida(l.id)}
                            >
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="py-2 px-1 text-center print:hidden">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleLinhaExpandida(l.id)
                                  }}
                                  title={
                                    isExpandida
                                      ? "Recolher composição"
                                      : "Ver discriminação completa"
                                  }
                                >
                                  {isExpandida ? (
                                    <ChevronUp className="h-4 w-4 text-primary" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                              <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>{l.nome}</span>
                                  {l.oculto && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 h-4 text-amber-600 border-amber-300"
                                    >
                                      Oculto
                                    </Badge>
                                  )}
                                  {temExtras && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] px-1 py-0 h-4 font-mono font-normal text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300"
                                      title="Contém produção, ajuda ou gratificação adicionados ao líquido"
                                    >
                                      +Extras
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                                {l.funcao}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-medium whitespace-nowrap bg-amber-50/40 dark:bg-amber-950/10">
                                {fmtMoeda(l.bruto)}
                              </td>
                              <td className="py-2 px-2 text-center font-mono bg-amber-50/40 dark:bg-amber-950/10">
                                {l.filhos > 0 ? l.filhos : 0}
                              </td>

                              {/* PRODUÇÃO VISÍVEL NA ABA GERAL: PRODUÇÃO (+) */}
                              <td className="py-2 px-2 text-right font-mono whitespace-nowrap text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10">
                                <div className="flex items-center justify-end gap-1">
                                  <span>
                                    {l.producaoGeralMais > 0
                                      ? `+${fmtMoeda(l.producaoGeralMais)}`
                                      : fmtMoeda(0)}
                                  </span>
                                  {l.obras > 0 && (
                                    <span className="text-[9px] text-muted-foreground font-sans">
                                      ({l.obras}ob)
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* QUINZENA NA ABA GERAL (EM BRANCO / SÓ EXIBIÇÃO) */}
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground whitespace-nowrap bg-blue-50/20 dark:bg-blue-950/10">
                                —
                              </td>

                              {/* INSS com badge Calculado / Digitado */}
                              <td className="py-2 px-2 text-right font-mono whitespace-nowrap text-red-600">
                                <div className="flex items-center justify-end gap-1">
                                  <span>
                                    {l.inssFinal > 0
                                      ? `−${fmtMoeda(l.inssFinal)}`
                                      : fmtMoeda(0)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[8px] px-1 py-0 h-3.5 ${
                                      l.isInssSobrescrito
                                        ? "border-amber-400 text-amber-700 bg-amber-50"
                                        : "border-muted text-muted-foreground"
                                    }`}
                                  >
                                    {l.isInssSobrescrito
                                      ? "Digitado"
                                      : "Calculado"}
                                  </Badge>
                                </div>
                              </td>

                              {/* FAMÍLIA */}
                              <td className="py-2 px-2 text-right font-mono whitespace-nowrap text-emerald-600">
                                <div className="flex items-center justify-end gap-1">
                                  <span>
                                    {l.familiaFinal > 0
                                      ? `+${fmtMoeda(l.familiaFinal)}`
                                      : "-"}
                                  </span>
                                  {l.familiaFinal > 0 && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[8px] px-1 py-0 h-3.5 ${
                                        l.isFamiliaSobrescrito
                                          ? "border-amber-400 text-amber-700 bg-amber-50"
                                          : "border-muted text-muted-foreground"
                                      }`}
                                    >
                                      {l.isFamiliaSobrescrito
                                        ? "Digitado"
                                        : "Calculado"}
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* IRRF */}
                              <td className="py-2 px-2 text-right font-mono whitespace-nowrap text-red-600">
                                <div className="flex items-center justify-end gap-1">
                                  <span>
                                    {l.irrfFinal > 0
                                      ? `−${fmtMoeda(l.irrfFinal)}`
                                      : "-"}
                                  </span>
                                  {l.irrfFinal > 0 && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[8px] px-1 py-0 h-3.5 ${
                                        l.isIrrfSobrescrito
                                          ? "border-amber-400 text-amber-700 bg-amber-50"
                                          : "border-muted text-muted-foreground"
                                      }`}
                                    >
                                      {l.isIrrfSobrescrito
                                        ? "Digitado"
                                        : "Calculado"}
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* LÍQUIDO A RECEBER (MENSAL + PRODUÇÃO) */}
                              <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/10 whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-sm">
                                    {fmtMoeda(l.liquidoGeral)}
                                  </span>
                                  {l.isMensalSobrescrito && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] px-1 py-0 h-3.5 border-amber-400 text-amber-700 bg-amber-50"
                                    >
                                      Digitado
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              <td className="py-2 px-3 text-muted-foreground font-mono text-[11px] truncate max-w-[140px]">
                                {l.conta || "-"}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground font-mono text-[11px] truncate max-w-[140px]">
                                {l.pix || l.chave_pix || "-"}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground text-[11px] truncate max-w-[150px]">
                                {l.observacao_linha || "-"}
                              </td>

                              <td
                                className="py-2 px-2 text-center whitespace-nowrap print:hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
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
                                    onClick={() => solicitarExclusao(l)}
                                    title={
                                      isAdministrador
                                        ? "Excluir"
                                        : "Exclusão permitida apenas para Administrador"
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {/* LINHA DISCRIMINADA EXPANSÍVEL: MOSTRA CADA COMPONENTE QUE GERA O LÍQUIDO */}
                            {isExpandida && (
                              <tr
                                key={`${l.id}-detalhe`}
                                className="bg-muted/20 border-b border-primary/20"
                              >
                                <td colSpan={17} className="p-3 pl-8">
                                  <div className="rounded-lg border bg-card p-3 shadow-sm space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                      <div className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-primary" />
                                        <span className="font-bold text-xs uppercase tracking-wide text-foreground">
                                          Discriminação Completa do Líquido —{" "}
                                          {l.nome}
                                        </span>
                                      </div>
                                      <div className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                                        Total Líquido:{" "}
                                        {fmtMoeda(l.liquidoGeral)}
                                      </div>
                                    </div>

                                    {/* Grid de composição: PRODUÇÃO(+) e DEDUÇÃO DO ADIANTAMENTO */}
                                    <div className="space-y-2">
                                      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                                        <span>
                                          Composição da PRODUÇÃO (+) e Deduções
                                        </span>
                                        <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                                          PRODUÇÃO (+) ={" "}
                                          {fmtMoeda(l.producaoGeralMais)}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                                        <div className="bg-muted/40 p-2 rounded border">
                                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                                            Produção Crua (+)
                                          </div>
                                          <div className="font-mono font-bold text-foreground text-sm">
                                            {fmtMoeda(l.producaoTotal)}
                                          </div>
                                          {l.obras > 0 && (
                                            <div className="text-[9px] text-muted-foreground">
                                              {l.obras} obras
                                            </div>
                                          )}
                                        </div>

                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">
                                            Limpeza (+)
                                          </div>
                                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {l.limpezaTotal > 0
                                              ? `+${fmtMoeda(l.limpezaTotal)}`
                                              : fmtMoeda(0)}
                                          </div>
                                        </div>

                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">
                                            Sábado (+)
                                          </div>
                                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {l.sabadoTotal > 0
                                              ? `+${fmtMoeda(l.sabadoTotal)}`
                                              : fmtMoeda(0)}
                                          </div>
                                        </div>

                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">
                                            Feriado (+)
                                          </div>
                                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {Number(l.feriado || 0) > 0
                                              ? `+${fmtMoeda(Number(l.feriado || 0))}`
                                              : fmtMoeda(0)}
                                          </div>
                                        </div>

                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">
                                            Ajuda Custo (+)
                                          </div>
                                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {l.ajudaTotal > 0
                                              ? `+${fmtMoeda(l.ajudaTotal)}`
                                              : fmtMoeda(0)}
                                          </div>
                                        </div>

                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">
                                            Gratificação (+)
                                          </div>
                                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {l.gratificacaoTotal > 0
                                              ? `+${fmtMoeda(l.gratificacaoTotal)}`
                                              : fmtMoeda(0)}
                                          </div>
                                        </div>

                                        <div className="bg-red-50/50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900/30">
                                          <div className="text-[10px] text-red-700 dark:text-red-300 uppercase font-semibold">
                                            − Adiantamento
                                          </div>
                                          <div className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                                            {l.adiantamentoTotal > 0
                                              ? `−${fmtMoeda(l.adiantamentoTotal)}`
                                              : fmtMoeda(0)}
                                          </div>
                                          <div className="text-[9px] text-muted-foreground">
                                            dedução do líquido
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Resumo da Equação em Linha com Produção (+) e Dedução do Adiantamento */}
                                    <div className="bg-muted/40 p-2.5 rounded text-[11px] font-mono text-muted-foreground flex flex-wrap items-center gap-1.5 border">
                                      <span className="font-bold text-foreground">
                                        Equação do Líquido:
                                      </span>
                                      <span>{fmtMoeda(l.bruto)} (Bruto)</span>
                                      {l.inssFinal > 0 && (
                                        <span>
                                          − {fmtMoeda(l.inssFinal)} (INSS)
                                        </span>
                                      )}
                                      {l.irrfFinal > 0 && (
                                        <span>
                                          − {fmtMoeda(l.irrfFinal)} (IRRF)
                                        </span>
                                      )}
                                      {l.quinzenaFinal > 0 && (
                                        <span>
                                          − {fmtMoeda(l.quinzenaFinal)}{" "}
                                          (Quinzena)
                                        </span>
                                      )}
                                      <span className="text-muted-foreground font-semibold">
                                        = {fmtMoeda(l.mensalFinal)} (Mensal
                                        Puro)
                                      </span>
                                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                                        + {fmtMoeda(l.producaoGeralMais)}{" "}
                                        (PRODUÇÃO +)
                                      </span>
                                      {l.adiantamentoTotal > 0 && (
                                        <span className="text-red-600 dark:text-red-400 font-semibold">
                                          − {fmtMoeda(l.adiantamentoTotal)}{" "}
                                          (Adiantamento)
                                        </span>
                                      )}
                                      <span className="font-bold text-primary ml-1 text-xs">
                                        = {fmtMoeda(l.liquidoGeral)} (LÍQUIDO
                                        TOTAL)
                                      </span>
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

                  {/* TOTAL RODAPÉ FUNCIONÁRIOS DISCRIMINADO */}
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-2 text-center">-</td>
                      <td className="py-2.5 px-1 text-center print:hidden">
                        -
                      </td>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                        TOTAL ({linhasGeralProcessadas.length})
                      </td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono bg-amber-50/40 dark:bg-amber-950/10">
                        {fmtMoeda(totaisGeral.bruto)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono bg-amber-50/40 dark:bg-amber-950/10">
                        {totaisGeral.filhos}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {totaisGeral.producaoGeralMais > 0
                          ? `+${fmtMoeda(totaisGeral.producaoGeralMais)}`
                          : fmtMoeda(0)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-muted-foreground bg-blue-50/20 dark:bg-blue-950/10">
                        —
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-red-600">
                        {totaisGeral.inss > 0
                          ? `−${fmtMoeda(totaisGeral.inss)}`
                          : fmtMoeda(0)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600">
                        {totaisGeral.familia > 0
                          ? `+${fmtMoeda(totaisGeral.familia)}`
                          : fmtMoeda(0)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-red-600">
                        {totaisGeral.irrf > 0
                          ? `−${fmtMoeda(totaisGeral.irrf)}`
                          : fmtMoeda(0)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary bg-primary/20 text-sm">
                        {fmtMoeda(totaisGeral.liquidoGeral)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={4}></td>
                    </tr>
                    {terceirosProcessados.length > 0 && (
                      <tr className="border-t-2 border-primary/30 bg-primary/10 text-xs font-bold text-foreground">
                        <td className="py-2.5 px-2 text-center">-</td>
                        <td className="py-2.5 px-3 sticky left-0 bg-primary/15 z-10 border-r font-bold text-primary uppercase">
                          TOTAL GERAL DA FOLHA (FUNCIONÁRIOS + TERCEIROS)
                        </td>
                        <td className="py-2.5 px-2 text-muted-foreground font-normal">
                          {linhasGeralProcessadas.length +
                            terceirosProcessados.length}{" "}
                          pessoas
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-muted-foreground font-semibold">
                          {fmtMoeda(
                            totaisGeral.bruto + totaisTerceiros.valorMes,
                          )}
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono text-muted-foreground">
                          {totaisGeral.filhos}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-600">
                          {fmtMoeda(totaisGeral.producaoGeralMais)}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">
                          —
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-red-600">
                          {fmtMoeda(totaisGeral.inss)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-600">
                          {fmtMoeda(totaisGeral.familia)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-red-600">
                          {fmtMoeda(totaisGeral.irrf)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-primary bg-primary/25 text-sm">
                          {fmtMoeda(
                            totaisGeral.liquidoGeral + totaisTerceiros.valorMes,
                          )}
                        </td>
                        <td className="py-2.5 px-3" colSpan={4}></td>
                      </tr>
                    )}
                    {/* Linha adicional no rodapé detalhando totais dos componentes da GERAL */}
                    <tr className="bg-muted/60 text-[11px] border-t border-border font-normal">
                      <td colSpan={17} className="py-2 px-4">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground font-mono">
                          <span className="font-bold text-foreground">
                            Discriminação dos totais:
                          </span>
                          <span>Bruto: {fmtMoeda(totaisGeral.bruto)}</span>
                          {totaisGeral.inss > 0 && (
                            <span className="text-red-600">
                              INSS: −{fmtMoeda(totaisGeral.inss)}
                            </span>
                          )}
                          {totaisGeral.irrf > 0 && (
                            <span className="text-red-600">
                              IRRF: −{fmtMoeda(totaisGeral.irrf)}
                            </span>
                          )}
                          {totaisGeral.quinzena > 0 && (
                            <span className="text-blue-600">
                              Quinzena: −{fmtMoeda(totaisGeral.quinzena)}
                            </span>
                          )}
                          <span className="text-muted-foreground font-semibold">
                            Mensal Puro: {fmtMoeda(totaisGeral.mensal)}
                          </span>
                          {totaisGeral.producaoGeralMais > 0 && (
                            <span className="text-emerald-600 font-semibold">
                              PRODUÇÃO (+): +
                              {fmtMoeda(totaisGeral.producaoGeralMais)}
                            </span>
                          )}
                          {totaisGeral.adiantamento > 0 && (
                            <span className="text-red-600 font-semibold">
                              Adiantamento: −
                              {fmtMoeda(totaisGeral.adiantamento)}
                            </span>
                          )}
                          <span className="font-bold text-primary ml-auto">
                            = Total Líquido {fmtMoeda(totaisGeral.liquidoGeral)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* SEÇÃO SEPARADA EMBAIXO: TERCEIROS — FOLHA À PARTE (SEM DESCONTO) */}
              <div className="border-t-4 border-t-muted p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-2">
                      <Badge className="bg-purple-600 text-white hover:bg-purple-700 text-xs">
                        TERCEIROS
                      </Badge>
                      FOLHA À PARTE (SEM DESCONTO)
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Vigia e prestadores de serviço autônomos. Pagamentos
                      divididos em Quinzena (
                      {Math.round(percentualQuinzena * 100)}%) e Mensal (
                      {Math.round((1 - percentualQuinzena) * 100)}%).
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => abrirModalEdicao(undefined, "Terceiro")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Terceiro
                  </Button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 uppercase font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">NOME</th>
                        <th className="py-2 px-2 text-right bg-amber-100/40 dark:bg-amber-950/20">
                          VALOR DO MÊS
                        </th>
                        <th className="py-2 px-2 text-right font-semibold text-blue-600">
                          QUINZENA ({Math.round(percentualQuinzena * 100)}%)
                        </th>
                        <th className="py-2 px-2 text-right font-bold text-primary">
                          MENSAL ({Math.round((1 - percentualQuinzena) * 100)}%)
                        </th>
                        <th className="py-2 px-3">PIX</th>
                        <th className="py-2 px-3">OBS</th>
                        <th className="py-2 px-2 text-center print:hidden">
                          AÇÕES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {terceirosProcessados.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-4 text-muted-foreground"
                          >
                            Nenhum terceiro lançado nesta competência.
                          </td>
                        </tr>
                      ) : (
                        terceirosProcessados.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/30">
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {t.nome}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-medium bg-amber-50/40 dark:bg-amber-950/10">
                              {fmtMoeda(t.valorMes)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-blue-600">
                              {fmtMoeda(t.quinzena)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-primary">
                              {fmtMoeda(t.mensal)}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                              {t.pix || "-"}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-[11px]">
                              {t.observacao_linha || "-"}
                            </td>
                            <td className="py-2 px-2 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => abrirModalEdicao(t)}
                                  title="Editar"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => solicitarExclusao(t)}
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
                    <tfoot className="bg-purple-100/40 dark:bg-purple-950/40 font-bold border-t">
                      <tr>
                        <td className="py-2 px-3">
                          TOTAL TERCEIROS ({terceirosProcessados.length})
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(totaisTerceiros.valorMes)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-blue-600">
                          {fmtMoeda(totaisTerceiros.quinzena)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-primary">
                          {fmtMoeda(totaisTerceiros.mensal)}
                        </td>
                        <td className="py-2 px-3" colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* CARDS RESUMO NO RODAPÉ DA PÁGINA DA GERAL */}
              <div className="p-4 border-t bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <span className="text-xs text-muted-foreground font-medium block">
                      Total Funcionários ({linhasGeralProcessadas.length})
                    </span>
                    <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                      {fmtMoeda(totaisGeral.liquidoGeral)}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Líquido da competência (mensal + produção)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-card-foreground shadow-sm">
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium block">
                      Total Terceiros ({terceirosProcessados.length})
                    </span>
                    <span className="text-lg font-bold font-mono text-purple-900 dark:text-purple-200 mt-1 block">
                      {fmtMoeda(totaisTerceiros.valorMes)}
                    </span>
                    <span className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-0.5 block">
                      Prestadores e serviços autônomos
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border-2 border-primary bg-primary/10 shadow-sm">
                    <span className="text-xs font-bold text-primary block uppercase tracking-wide">
                      Valor Real da Folha
                    </span>
                    <span className="text-xl font-black font-mono text-primary mt-1 block">
                      {fmtMoeda(
                        totaisGeral.liquidoGeral + totaisTerceiros.valorMes,
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Funcionários + Terceiros (total competência)
                    </span>
                  </div>
                </div>

                {/* BLOCO DESTACADO: SOMA DAS DUAS FOLHAS (MONTEIRO + SJE) */}
                <div className="mt-4 p-4 rounded-xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-200/60 dark:border-blue-800/60">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-black shadow-sm">
                        Σ
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-950 dark:text-blue-100">
                        SOMA DAS DUAS FOLHAS (MONTEIRO + SJE)
                      </h4>
                      <Badge
                        variant="outline"
                        className="border-blue-400 text-blue-700 dark:text-blue-300 font-mono text-[10px] bg-white/80 dark:bg-background/80"
                      >
                        {rotuloCompetenciaMesAno}
                      </Badge>
                    </div>
                    {carregandoConsolidacao && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                        Atualizando valores consolidados...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3">
                    {/* CARD MONTEIRO */}
                    <div className="p-3 rounded-lg border bg-background/90 dark:bg-card/90 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            Monteiro
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {consolidacaoDuasFolhas.temMonteiro
                              ? `${consolidacaoDuasFolhas.monteiro.qtdFuncionarios} func. + ${consolidacaoDuasFolhas.monteiro.qtdTerceiros} terc.`
                              : "0 registros"}
                          </span>
                        </div>
                        <span className="text-lg font-bold font-mono text-foreground mt-1.5 block">
                          {fmtMoeda(consolidacaoDuasFolhas.monteiro.valorReal)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        {consolidacaoDuasFolhas.temMonteiro ? (
                          <div className="space-y-0.5 text-[10.5px]">
                            <div className="flex justify-between">
                              <span>Líquido func.:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.monteiro
                                    .totalFuncionarios,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Terceiros:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.monteiro
                                    .totalTerceiros,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-600 dark:text-blue-400 pt-0.5 border-t border-border/30">
                              <span>Vendas / Obras:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.monteiro.totalVendas,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-amber-600 dark:text-amber-400">
                              <span>Comissões:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.monteiro
                                    .totalComissoes,
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            competência não lançada na unidade Monteiro
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD SJE */}
                    <div className="p-3 rounded-lg border bg-background/90 dark:bg-card/90 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            SJE / Caldas & Amaral
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {consolidacaoDuasFolhas.temSje
                              ? `${consolidacaoDuasFolhas.sje.qtdFuncionarios} func. + ${consolidacaoDuasFolhas.sje.qtdTerceiros} terc.`
                              : "0 registros"}
                          </span>
                        </div>
                        <span className="text-lg font-bold font-mono text-foreground mt-1.5 block">
                          {fmtMoeda(consolidacaoDuasFolhas.sje.valorReal)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        {consolidacaoDuasFolhas.temSje ? (
                          <div className="space-y-0.5 text-[10.5px]">
                            <div className="flex justify-between">
                              <span>Líquido func.:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.sje.totalFuncionarios,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Terceiros:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.sje.totalTerceiros,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-600 dark:text-blue-400 pt-0.5 border-t border-border/30">
                              <span>Vendas / Obras:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.sje.totalVendas,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-amber-600 dark:text-amber-400">
                              <span>Comissões:</span>
                              <span className="font-mono font-medium">
                                {fmtMoeda(
                                  consolidacaoDuasFolhas.sje.totalComissoes,
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            competência não lançada na unidade SJE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD TOTAL CONSOLIDADO */}
                    <div className="p-3 rounded-lg border-2 border-blue-600 bg-blue-600/10 dark:bg-blue-600/20 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wide text-blue-900 dark:text-blue-200">
                            TOTAL CONSOLIDADO
                          </span>
                          <Badge className="bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700">
                            GC MIX GERAL
                          </Badge>
                        </div>
                        <span className="text-2xl font-black font-mono text-blue-700 dark:text-blue-300 mt-1 block">
                          {fmtMoeda(consolidacaoDuasFolhas.totalConsolidado)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-700 text-[11px] text-muted-foreground flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                          <span>Total de Vendas (Monteiro + SJE):</span>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                            {fmtMoeda(
                              consolidacaoDuasFolhas.totalVendasConsolidado,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                          <span>Total de Comissões:</span>
                          <span className="font-mono font-bold">
                            {fmtMoeda(
                              consolidacaoDuasFolhas.totalComissoesConsolidado,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-blue-200 dark:border-blue-800 text-[10px]">
                          <span>Soma real das unidades</span>
                          {!consolidacaoDuasFolhas.temMonteiro ||
                          !consolidacaoDuasFolhas.temSje ? (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              Reflete apenas unidade lançada
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              Duas unidades somadas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 2: QUINZENA (CÁLCULO AUTOMÁTICO 40% SEM VALOR BRUTO + IMPRESSÃO A4)
        ========================================================================== */}
        <TabsContent value="quinzena" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Folha de Pagamento — Quinzena
                </CardTitle>
                <CardDescription className="text-xs">
                  Cálculo automático de adiantamento da quinzena (
                  {Math.round(percentualQuinzena * 100)}% definido no cabeçalho
                  da competência {rotuloCompetenciaMesAno}), sem digitação
                  manual e sem exibição de bruto.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => imprimirAbaA4("quinzena")}
              >
                <Printer className="h-4 w-4" />
                Imprimir Quinzena A4
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">Nº</th>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-2">FUNÇÃO</th>
                      <th className="py-2.5 px-2 text-right font-bold text-blue-600 bg-blue-50/50 dark:bg-blue-950/20">
                        QUINZENA ({Math.round(percentualQuinzena * 100)}%
                        AUTOMÁTICO)
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasGeralProcessadas.map((l, index) => (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r">
                          {l.nome}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {l.funcao}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                          {fmtMoeda(l.quinzenaFinal)}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                          {l.conta || "-"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                          {l.pix || l.chave_pix || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-2 text-center">-</td>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                        TOTAL FUNCIONÁRIOS ({linhasGeralProcessadas.length})
                      </td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600 bg-blue-50/50 dark:bg-blue-950/20">
                        {fmtMoeda(totaisGeral.quinzena)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={2}></td>
                    </tr>
                    {terceirosProcessados.length > 0 && (
                      <tr className="border-t border-border/60 bg-muted/70 text-xs">
                        <td className="py-2 px-2 text-center">-</td>
                        <td className="py-2 px-3 sticky left-0 bg-muted/95 z-10 border-r font-semibold">
                          TOTAL GERAL (FUNCIONÁRIOS + TERCEIROS)
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {linhasGeralProcessadas.length +
                            terceirosProcessados.length}{" "}
                          pessoas
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40">
                          {fmtMoeda(
                            totaisGeral.quinzena + totaisTerceiros.quinzena,
                          )}
                        </td>
                        <td className="py-2 px-3" colSpan={2}></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* TABELA DE TERCEIROS NA ABA QUINZENA (SEM BRUTO, 40% AUTOMÁTICO) */}
              {terceirosProcessados.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700 text-[10px]">
                      TERCEIROS
                    </Badge>
                    QUINZENA TERCEIROS ({Math.round(percentualQuinzena * 100)}%
                    AUTOMÁTICO)
                  </h4>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 uppercase font-semibold border-b">
                        <tr>
                          <th className="py-2 px-2 text-center w-8">Nº</th>
                          <th className="py-2 px-3">NOME</th>
                          <th className="py-2 px-2 text-right font-bold text-blue-600">
                            QUINZENA ({Math.round(percentualQuinzena * 100)}%)
                          </th>
                          <th className="py-2 px-3">PIX</th>
                          <th className="py-2 px-3">OBS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {terceirosProcessados.map((t, idx) => (
                          <tr key={t.id} className="hover:bg-muted/30">
                            <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {t.nome}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-blue-600">
                              {fmtMoeda(t.quinzena)}
                            </td>
                            <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                              {t.pix || t.chave_pix || "-"}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-[11px]">
                              {t.observacao_linha || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-purple-100/50 dark:bg-purple-950/40 font-bold border-t">
                        <tr>
                          <td className="py-2 px-2 text-center">-</td>
                          <td className="py-2 px-3">
                            TOTAL TERCEIROS ({terceirosProcessados.length})
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-blue-600">
                            {fmtMoeda(totaisTerceiros.quinzena)}
                          </td>
                          <td className="py-2 px-3" colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* SEÇÃO PROTOCOLO DE RECEBIMENTO — ASSINATURAS */}
              <div className="p-6 border-t bg-muted/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  PROTOCOLO DE RECEBIMENTO — ASSINATURAS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                  {linhasGeralProcessadas.map((l) => (
                    <div
                      key={l.id}
                      className="border-b border-gray-400 pb-1 pt-6 text-[11px]"
                    >
                      <span className="font-semibold block truncate">
                        {l.nome}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Assinatura
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 3: MENSAL (LÍQUIDO MENSAL + ASSINATURAS + IMPRESSÃO A4)
        ========================================================================== */}
        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Folha de Pagamento — Mensal
                </CardTitle>
                <CardDescription className="text-xs">
                  Pagamento mensal com descontos fiscais e adiantamento da
                  quinzena quitado (produção é pagamento à parte e fica na aba
                  Geral).
                </CardDescription>
              </div>{" "}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => imprimirAbaA4("mensal")}
              >
                <Printer className="h-4 w-4" />
                Imprimir Mensal A4
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">Nº</th>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-2">FUNÇÃO</th>
                      <th className="py-2.5 px-2 text-right text-blue-600">
                        QUINZENA
                      </th>
                      <th className="py-2.5 px-2 text-right">INSS</th>
                      <th className="py-2.5 px-2 text-right">FAMÍLIA</th>
                      <th className="py-2.5 px-2 text-right">IRRF</th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary bg-primary/5">
                        MENSAL (LÍQUIDO)
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasGeralProcessadas.map((l, index) => (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                          {l.nome}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {l.funcao}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-blue-600">
                          {fmtMoeda(l.quinzenaFinal)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(l.inssFinal)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {l.familiaFinal > 0 ? fmtMoeda(l.familiaFinal) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {l.irrfFinal > 0 ? fmtMoeda(l.irrfFinal) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5 whitespace-nowrap">
                          {fmtMoeda(l.mensalFinal)}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-[11px] truncate max-w-[130px]">
                          {l.conta || "-"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-[11px] truncate max-w-[130px]">
                          {l.pix || l.chave_pix || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-2 text-center">-</td>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                        TOTAL FUNCIONÁRIOS ({linhasGeralProcessadas.length})
                      </td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">
                        {fmtMoeda(totaisGeral.quinzena)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.inss)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.familia)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.irrf)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary bg-primary/10">
                        {fmtMoeda(totaisGeral.mensal)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={2}></td>
                    </tr>
                    {terceirosMensal.length > 0 && (
                      <tr className="border-t border-border/60 bg-muted/70 text-xs">
                        <td className="py-2 px-2 text-center">-</td>
                        <td className="py-2 px-3 sticky left-0 bg-muted/95 z-10 border-r font-semibold">
                          TOTAL GERAL (FUNCIONÁRIOS + TERCEIROS)
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {linhasGeralProcessadas.length +
                            terceirosMensal.length}{" "}
                          pessoas
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-blue-600">
                          {fmtMoeda(
                            totaisGeral.quinzena +
                              totaisTerceirosMensal.quinzena,
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(totaisGeral.inss)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(totaisGeral.familia)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(totaisGeral.irrf)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/20">
                          {fmtMoeda(
                            totaisGeral.mensal + totaisTerceirosMensal.mensal,
                          )}
                        </td>
                        <td className="py-2 px-3" colSpan={2}></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* TABELA DE TERCEIROS NA ABA MENSAL (60% LÍQUIDO, SEM DESCONTO — SEM MÁRCIO LUAN) */}
              {terceirosMensal.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700 text-[10px]">
                      TERCEIROS
                    </Badge>
                    MENSAL TERCEIROS (
                    {Math.round((1 - percentualQuinzena) * 100)}% SEM DESCONTO)
                  </h4>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 uppercase font-semibold border-b">
                        <tr>
                          <th className="py-2 px-2 text-center w-8">Nº</th>
                          <th className="py-2 px-3">NOME</th>
                          <th className="py-2 px-2 text-right">VALOR DO MÊS</th>
                          <th className="py-2 px-2 text-right font-bold text-primary bg-primary/5">
                            MENSAL ({Math.round((1 - percentualQuinzena) * 100)}
                            % SEM DESCONTO)
                          </th>
                          <th className="py-2 px-3">PIX</th>
                          <th className="py-2 px-3">OBS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {terceirosMensal.map((t, idx) => (
                          <tr key={t.id} className="hover:bg-muted/30">
                            <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {t.nome}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                              {fmtMoeda(t.valorMes)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5">
                              {fmtMoeda(t.mensal)}
                            </td>
                            <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                              {t.pix || t.chave_pix || "-"}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-[11px]">
                              {t.observacao_linha || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-purple-100/50 dark:bg-purple-950/40 font-bold border-t">
                        <tr>
                          <td className="py-2 px-2 text-center">-</td>
                          <td className="py-2 px-3">
                            TOTAL TERCEIROS ({terceirosMensal.length})
                          </td>
                          <td className="py-2 px-2 text-right font-mono">
                            {fmtMoeda(totaisTerceirosMensal.valorMes)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-primary">
                            {fmtMoeda(totaisTerceirosMensal.mensal)}
                          </td>
                          <td className="py-2 px-3" colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* SEÇÃO ASSINATURAS */}
              <div className="p-6 border-t bg-muted/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  ASSINATURAS:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                  {linhasGeralProcessadas.map((l) => (
                    <div
                      key={l.id}
                      className="border-b border-gray-400 pb-1 pt-6 text-[11px]"
                    >
                      <span className="font-semibold block truncate">
                        {l.nome}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Assinatura
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 4: PRODUÇÃO (OBRAS, LIMPEZA, SÁBADO, FERIADO, AJUDA, A PAGAR)
        ========================================================================== */}
        <TabsContent value="producao" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Tabela de Produção
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p className="font-semibold text-foreground">
                    A PAGAR = PRODUÇÃO + GRATIFICAÇÃO − ADIANTAMENTO (o
                    adiantamento é o que a pessoa já recebeu no mês)
                  </p>
                  <p>
                    PRODUÇÃO = OBRAS × VALOR/OBRA + LIMP + SÁBADO + FERIADO +
                    AJUDA
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => imprimirAbaA4("producao")}
              >
                <Printer className="h-4 w-4" />
                Imprimir Produção A4
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">Nº</th>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-2 text-center">OBRAS</th>
                      <th className="py-2.5 px-2 text-right">VALOR/OBRA</th>
                      <th
                        className="py-2.5 px-2 text-right"
                        title="Clique na célula para digitar diretamente"
                      >
                        <span className="cursor-help border-b border-dotted border-muted-foreground/60">
                          LIMP/LUBRIF.
                        </span>
                      </th>
                      <th
                        className="py-2.5 px-2 text-right"
                        title="Clique na célula para digitar diretamente"
                      >
                        <span className="cursor-help border-b border-dotted border-muted-foreground/60">
                          SÁBADO
                        </span>
                      </th>
                      <th
                        className="py-2.5 px-2 text-right"
                        title="Clique na célula para digitar diretamente"
                      >
                        <span className="cursor-help border-b border-dotted border-muted-foreground/60">
                          FERIADO
                        </span>
                      </th>
                      <th
                        className="py-2.5 px-2 text-right"
                        title="Clique na célula para digitar diretamente"
                      >
                        <span className="cursor-help border-b border-dotted border-muted-foreground/60">
                          AJUDA DE CUSTO
                        </span>
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-emerald-600"
                        title="Clique na célula para digitar diretamente"
                      >
                        <span className="cursor-help border-b border-dotted border-emerald-600/60">
                          GRATIFICAÇÃO
                        </span>
                      </th>
                      <th
                        className="py-2.5 px-2 text-right text-red-600"
                        title="Clique na célula para digitar diretamente"
                      >
                        <span className="cursor-help border-b border-dotted border-red-600/60">
                          ADIANT. (−)
                        </span>
                      </th>
                      <th className="py-2.5 px-2 text-right font-semibold text-foreground">
                        PRODUÇÃO
                      </th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary bg-primary/5">
                        A PAGAR (=)
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                      <th className="py-2.5 px-2 text-center print:hidden">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasProducao.map((l, index) => (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                          {l.nome}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-primary">
                          {l.obras > 0 ? l.obras : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                          {l.obras > 0 ? fmtMoeda(l.valor_obra) : "-"}
                        </td>
                        {/* 1. LIMP/LUBRIF. (inline) */}
                        <td
                          className="py-1 px-1 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition-colors"
                          onClick={() => {
                            if (
                              celulaAtivaProducao?.linhaId !== l.id ||
                              celulaAtivaProducao?.campo !== "limpeza"
                            ) {
                              iniciarEdicaoCelula(l.id, "limpeza", l.limpeza)
                            }
                          }}
                          title="Clique para editar Limpeza/Lubrificação"
                        >
                          {celulaAtivaProducao?.linhaId === l.id &&
                          celulaAtivaProducao?.campo === "limpeza" ? (
                            <Input
                              autoFocus
                              className="h-7 w-24 text-right font-mono text-xs px-1.5 py-0 bg-background border-primary focus-visible:ring-1"
                              value={valorTempProducao}
                              onChange={(e) =>
                                setValorTempProducao(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  salvarEdicaoCelula(l.id, "limpeza")
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  cancelarEdicaoCelula()
                                }
                              }}
                              onBlur={() => salvarEdicaoCelula(l.id, "limpeza")}
                              placeholder="0,00"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 px-1 py-1 rounded">
                              {salvandoCelulaProducao === `${l.id}-limpeza` ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                              ) : null}
                              <span
                                className={
                                  Number(l.limpeza || 0) > 0
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {Number(l.limpeza || 0) > 0
                                  ? fmtMoeda(l.limpeza)
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 2. SÁBADO (inline) */}
                        <td
                          className="py-1 px-1 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition-colors"
                          onClick={() => {
                            if (
                              celulaAtivaProducao?.linhaId !== l.id ||
                              celulaAtivaProducao?.campo !== "sabado"
                            ) {
                              iniciarEdicaoCelula(l.id, "sabado", l.sabado)
                            }
                          }}
                          title="Clique para editar Sábado"
                        >
                          {celulaAtivaProducao?.linhaId === l.id &&
                          celulaAtivaProducao?.campo === "sabado" ? (
                            <Input
                              autoFocus
                              className="h-7 w-24 text-right font-mono text-xs px-1.5 py-0 bg-background border-primary focus-visible:ring-1"
                              value={valorTempProducao}
                              onChange={(e) =>
                                setValorTempProducao(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  salvarEdicaoCelula(l.id, "sabado")
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  cancelarEdicaoCelula()
                                }
                              }}
                              onBlur={() => salvarEdicaoCelula(l.id, "sabado")}
                              placeholder="0,00"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 px-1 py-1 rounded">
                              {salvandoCelulaProducao === `${l.id}-sabado` ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                              ) : null}
                              <span
                                className={
                                  Number(l.sabado || 0) > 0
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {Number(l.sabado || 0) > 0
                                  ? fmtMoeda(l.sabado)
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 3. FERIADO (inline) */}
                        <td
                          className="py-1 px-1 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition-colors"
                          onClick={() => {
                            if (
                              celulaAtivaProducao?.linhaId !== l.id ||
                              celulaAtivaProducao?.campo !== "feriado"
                            ) {
                              iniciarEdicaoCelula(l.id, "feriado", l.feriado)
                            }
                          }}
                          title="Clique para editar Feriado"
                        >
                          {celulaAtivaProducao?.linhaId === l.id &&
                          celulaAtivaProducao?.campo === "feriado" ? (
                            <Input
                              autoFocus
                              className="h-7 w-24 text-right font-mono text-xs px-1.5 py-0 bg-background border-primary focus-visible:ring-1"
                              value={valorTempProducao}
                              onChange={(e) =>
                                setValorTempProducao(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  salvarEdicaoCelula(l.id, "feriado")
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  cancelarEdicaoCelula()
                                }
                              }}
                              onBlur={() => salvarEdicaoCelula(l.id, "feriado")}
                              placeholder="0,00"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 px-1 py-1 rounded">
                              {salvandoCelulaProducao === `${l.id}-feriado` ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                              ) : null}
                              <span
                                className={
                                  Number(l.feriado || 0) > 0
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {Number(l.feriado || 0) > 0
                                  ? fmtMoeda(l.feriado)
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 4. AJUDA DE CUSTO (inline) */}
                        <td
                          className="py-1 px-1 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition-colors"
                          onClick={() => {
                            if (
                              celulaAtivaProducao?.linhaId !== l.id ||
                              celulaAtivaProducao?.campo !== "ajuda_custo"
                            ) {
                              iniciarEdicaoCelula(
                                l.id,
                                "ajuda_custo",
                                l.ajuda_custo,
                              )
                            }
                          }}
                          title="Clique para editar Ajuda de Custo"
                        >
                          {celulaAtivaProducao?.linhaId === l.id &&
                          celulaAtivaProducao?.campo === "ajuda_custo" ? (
                            <Input
                              autoFocus
                              className="h-7 w-24 text-right font-mono text-xs px-1.5 py-0 bg-background border-primary focus-visible:ring-1"
                              value={valorTempProducao}
                              onChange={(e) =>
                                setValorTempProducao(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  salvarEdicaoCelula(l.id, "ajuda_custo")
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  cancelarEdicaoCelula()
                                }
                              }}
                              onBlur={() =>
                                salvarEdicaoCelula(l.id, "ajuda_custo")
                              }
                              placeholder="0,00"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 px-1 py-1 rounded">
                              {salvandoCelulaProducao ===
                              `${l.id}-ajuda_custo` ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                              ) : null}
                              <span
                                className={
                                  Number(l.ajuda_custo || 0) > 0
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {Number(l.ajuda_custo || 0) > 0
                                  ? fmtMoeda(l.ajuda_custo)
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 6. GRATIFICAÇÃO (inline) */}
                        <td
                          className="py-1 px-1 text-right font-mono text-emerald-600 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                          onClick={() => {
                            if (
                              celulaAtivaProducao?.linhaId !== l.id ||
                              celulaAtivaProducao?.campo !== "gratificacao"
                            ) {
                              iniciarEdicaoCelula(
                                l.id,
                                "gratificacao",
                                l.gratificacao,
                              )
                            }
                          }}
                          title="Clique para editar Gratificação"
                        >
                          {celulaAtivaProducao?.linhaId === l.id &&
                          celulaAtivaProducao?.campo === "gratificacao" ? (
                            <Input
                              autoFocus
                              className="h-7 w-24 text-right font-mono text-xs px-1.5 py-0 bg-background border-emerald-500 text-emerald-600 focus-visible:ring-1"
                              value={valorTempProducao}
                              onChange={(e) =>
                                setValorTempProducao(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  salvarEdicaoCelula(l.id, "gratificacao")
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  cancelarEdicaoCelula()
                                }
                              }}
                              onBlur={() =>
                                salvarEdicaoCelula(l.id, "gratificacao")
                              }
                              placeholder="0,00"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 px-1 py-1 rounded">
                              {salvandoCelulaProducao ===
                              `${l.id}-gratificacao` ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                              ) : null}
                              <span
                                className={
                                  Number(l.gratificacao || 0) > 0
                                    ? "font-semibold text-emerald-600"
                                    : "text-muted-foreground"
                                }
                              >
                                {Number(l.gratificacao || 0) > 0
                                  ? fmtMoeda(l.gratificacao)
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 7. ADIANTAMENTO (inline) */}
                        <td
                          className="py-1 px-1 text-right font-mono text-red-600 cursor-pointer hover:bg-red-500/10 transition-colors"
                          onClick={() => {
                            if (
                              celulaAtivaProducao?.linhaId !== l.id ||
                              celulaAtivaProducao?.campo !== "adiantamento"
                            ) {
                              iniciarEdicaoCelula(
                                l.id,
                                "adiantamento",
                                l.adiantamento,
                              )
                            }
                          }}
                          title="Clique para editar Adiantamento"
                        >
                          {celulaAtivaProducao?.linhaId === l.id &&
                          celulaAtivaProducao?.campo === "adiantamento" ? (
                            <Input
                              autoFocus
                              className="h-7 w-24 text-right font-mono text-xs px-1.5 py-0 bg-background border-red-500 text-red-600 focus-visible:ring-1"
                              value={valorTempProducao}
                              onChange={(e) =>
                                setValorTempProducao(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  salvarEdicaoCelula(l.id, "adiantamento")
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  cancelarEdicaoCelula()
                                }
                              }}
                              onBlur={() =>
                                salvarEdicaoCelula(l.id, "adiantamento")
                              }
                              placeholder="0,00"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 px-1 py-1 rounded">
                              {salvandoCelulaProducao ===
                              `${l.id}-adiantamento` ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-red-600" />
                              ) : null}
                              <span
                                className={
                                  Number(l.adiantamento || 0) > 0
                                    ? "font-semibold text-red-600"
                                    : "text-muted-foreground"
                                }
                              >
                                {Number(l.adiantamento || 0) > 0
                                  ? fmtMoeda(l.adiantamento)
                                  : "-"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                          {l.producaoTotal > 0
                            ? fmtMoeda(l.producaoTotal)
                            : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5 whitespace-nowrap">
                          {fmtMoeda(l.aPagar)}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-[11px] truncate max-w-[130px]">
                          {l.conta || "-"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-[11px] truncate max-w-[130px]">
                          {l.pix || l.chave_pix || "-"}
                        </td>
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
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-2 text-center">-</td>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                        TOTAL
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">
                        {totaisProducao.obras}
                      </td>
                      <td className="py-2.5 px-2 text-right">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisProducao.limpeza)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisProducao.sabado)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisProducao.feriado)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisProducao.ajuda_custo)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600">
                        {fmtMoeda(totaisProducao.gratificacao)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-red-600">
                        {fmtMoeda(totaisProducao.adiantamento)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisProducao.producao)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary bg-primary/10">
                        {fmtMoeda(totaisProducao.aPagar)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* SEÇÃO ASSINATURAS */}
              <div className="p-6 border-t bg-muted/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  ASSINATURAS:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                  {linhasProducao
                    .filter((l) => l.aPagar > 0 || l.obras > 0)
                    .map((l) => (
                      <div
                        key={l.id}
                        className="border-b border-gray-400 pb-1 pt-6 text-[11px]"
                      >
                        <span className="font-semibold block truncate">
                          {l.nome}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Assinatura
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 5: VENDAS (COMISSÃO 0,5% × VALOR VENDIDO + SEÇÃO EXCLUSIVA DE VALDERCLEITON)
        ========================================================================== */}
        <TabsContent value="vendas" className="space-y-4">
          {/* SEÇÃO PRÓPRIA DO LANÇADOR DE VENDAS (VALDERCLEITON FREIRE DE OLIVEIRA) */}
          {dadosLancadorVendas && (
            <Card className="border-amber-300 bg-gradient-to-br from-amber-500/5 via-background to-amber-500/10 shadow-sm">
              <CardHeader className="py-3 px-4 border-b bg-amber-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <div>
                      <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <span>
                          LANÇADOR DE VENDAS: {dadosLancadorVendas.linha.nome}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-amber-500 text-amber-700 bg-amber-100/60 dark:bg-amber-950/40 text-[10px]"
                        >
                          Vendedor Titular
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Folha de Vendas exclusiva — retirado da produção
                        principal para apuração direta de obras, comissão e
                        ajuda de custo.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs border-amber-400 hover:bg-amber-100/50"
                    onClick={() => abrirModalEdicao(dadosLancadorVendas.linha)}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-amber-700" />
                    Editar Dados de Vendas
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* CARDS DE DESTAQUE DOS VALORES */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border bg-card/80">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium block">
                      Total Obras / Vendido
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-600 block mt-1">
                      {fmtMoeda(dadosLancadorVendas.vendasObra)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Base das comissões do mês
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border bg-card/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                        Comissão (0,5%)
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[8px] px-1 py-0 h-3.5 ${
                          dadosLancadorVendas.isComissaoSobrescrita
                            ? "border-amber-400 text-amber-700 bg-amber-50"
                            : "border-muted text-muted-foreground"
                        }`}
                      >
                        {dadosLancadorVendas.isComissaoSobrescrita
                          ? "Digitado"
                          : "0,5% Auto"}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold font-mono text-amber-600 block mt-1">
                      {fmtMoeda(dadosLancadorVendas.comissaoFinal)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      0,5% × {fmtMoeda(dadosLancadorVendas.vendasObra)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border bg-card/80">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium block">
                      Ajuda de Custo
                    </span>
                    <span className="text-lg font-bold font-mono text-foreground block mt-1">
                      {fmtMoeda(dadosLancadorVendas.ajudaCusto)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Auxílio mensal de vendas
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <span className="text-[11px] text-primary uppercase tracking-wide font-bold block">
                      Total a Receber (Vendas)
                    </span>
                    <span className="text-lg font-extrabold font-mono text-primary block mt-1">
                      {fmtMoeda(dadosLancadorVendas.totalReceberVendas)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Comissão + Ajuda de Custo
                    </span>
                  </div>
                </div>

                {/* DETALHES BANCÁRIOS E ASSINATURA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Agência / Conta:
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {dadosLancadorVendas.linha.conta || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Chave PIX:
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {dadosLancadorVendas.linha.pix ||
                        dadosLancadorVendas.linha.chave_pix ||
                        "Não informado"}
                    </span>
                  </div>
                  <div className="border-b border-gray-400 pb-1 text-[11px]">
                    <span className="font-semibold block truncate">
                      {dadosLancadorVendas.linha.nome}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Assinatura — Lançador de Vendas
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BOTÃO IMPRIMIR NO TOPO DA ABA VENDAS */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => imprimirAbaA4("vendas")}
            >
              <Printer className="h-4 w-4" />
              Imprimir Vendas A4
            </Button>
          </div>

          {/* 1. SEÇÃO VENDEDORES TERCEIROS (FORA DA FOLHA) - CONFORME PLANILHA DO USUÁRIO */}
          <Card className="border-purple-300 dark:border-purple-800">
            <CardHeader className="py-3 px-4 border-b bg-purple-500/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    VENDEDORES TERCEIROS (fora da folha)
                    <Badge
                      variant="outline"
                      className="border-purple-400 text-purple-700 bg-purple-50 text-[10px]"
                    >
                      Tabela Progressiva
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 text-purple-700 dark:text-purple-300 font-semibold">
                    COMISSÃO = TABELA PROGRESSIVA (calcula sozinha)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {faixasComissao.length === 0 && (
                <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Configure a tabela progressiva de comissões na aba{" "}
                    <strong>Tabelas (Admin)</strong> para cálculo automático
                    marginal por faixa.
                  </span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-purple-100/60 dark:bg-purple-950/40 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3 sticky left-0 bg-purple-100/90 dark:bg-purple-950/90 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-3 text-right font-semibold text-blue-600">
                        VALOR DAS OBRAS
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-amber-600">
                        COMISSÃO
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                      <th className="py-2.5 px-2 text-center print:hidden w-16">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasVendasTerceiros.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Nenhum vendedor terceiro cadastrado ou com vendas
                          nesta unidade.
                        </td>
                      </tr>
                    ) : (
                      linhasVendasTerceiros.map((l) => (
                        <tr key={l.id} className="hover:bg-purple-50/30">
                          <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{l.nome}</span>
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1 py-0 h-4 bg-purple-100 text-purple-700"
                              >
                                Terceiro Vendedor
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-blue-600 font-semibold whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <span>{fmtMoeda(l.vendas_obra)}</span>
                              <Badge
                                variant="outline"
                                className="text-[8px] px-1 py-0 h-3.5 border-blue-300 text-blue-700 bg-blue-50"
                              >
                                Digitado
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {!l.temTabelaConfigurada ? (
                                <span className="text-[11px] font-normal text-amber-600 italic">
                                  Configure as faixas na aba TABELAS
                                </span>
                              ) : (
                                <span>{fmtMoeda(l.comissaoFinal)}</span>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1 py-0 h-3.5 ${
                                  l.isComissaoSobrescrita
                                    ? "border-amber-400 text-amber-700 bg-amber-50"
                                    : "border-muted text-muted-foreground"
                                }`}
                              >
                                {l.isComissaoSobrescrita
                                  ? "Digitado"
                                  : "Calculado"}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                            {l.conta || "-"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                            {l.pix || l.chave_pix || "-"}
                          </td>
                          <td className="py-2 px-2 text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => abrirModalEdicao(l, "Terceiro")}
                              title="Editar vendas do terceiro"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-purple-100/40 dark:bg-purple-950/30 font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-3 sticky left-0 bg-purple-100/40 dark:bg-purple-950/30 z-10 border-r">
                        TOTAL TERCEIROS ({linhasVendasTerceiros.length})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-600">
                        {fmtMoeda(totaisVendasTerceiros.vendas_obra)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                        {fmtMoeda(totaisVendasTerceiros.comissao)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 2. TABELA DE VENDEDORES DA FOLHA (FUNCIONÁRIOS) */}
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <div>
                <CardTitle className="text-base font-semibold">
                  VENDEDORES DA FOLHA (comissão é pagamento à parte do salário)
                </CardTitle>
                <CardDescription className="text-xs mt-1 text-primary font-medium">
                  COMISSÃO = 0,5% DO VALOR VENDIDO (calcula sozinha)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">Nº</th>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-2 text-right font-semibold text-blue-600">
                        VALOR DAS OBRAS
                      </th>
                      <th className="py-2.5 px-2 text-right font-bold text-amber-600">
                        COMISSÃO (0,5%)
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                      <th className="py-2.5 px-2 text-center print:hidden">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasVendasFuncionarios.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Nenhum funcionário vendedor com obras nesta
                          competência.
                        </td>
                      </tr>
                    ) : (
                      linhasVendasFuncionarios.map((l, index) => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{l.nome}</span>
                              {isLancadorVendas(l.nome) && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 border-amber-400 text-amber-700 bg-amber-50"
                                >
                                  Lançador Vendas
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-blue-600 font-semibold whitespace-nowrap">
                            {fmtMoeda(l.vendas_obra)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <span>{fmtMoeda(l.comissaoFinal)}</span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1 py-0 h-3.5 ${
                                  l.isComissaoSobrescrita
                                    ? "border-amber-400 text-amber-700 bg-amber-50"
                                    : "border-muted text-muted-foreground"
                                }`}
                              >
                                {l.isComissaoSobrescrita
                                  ? "Digitado"
                                  : "Calculado"}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                            {l.conta || "-"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                            {l.pix || l.chave_pix || "-"}
                          </td>
                          <td className="py-2 px-2 text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => abrirModalEdicao(l)}
                              title="Editar vendas"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-2 text-center">-</td>
                      <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r">
                        TOTAL VENDAS FUNCIONÁRIOS
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">
                        {fmtMoeda(totaisVendasFuncionarios.vendas_obra)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-amber-600">
                        {fmtMoeda(totaisVendasFuncionarios.comissao)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={3}></td>
                    </tr>
                    <tr className="bg-primary/10 text-primary font-extrabold border-t">
                      <td className="py-2.5 px-2 text-center">-</td>
                      <td className="py-2.5 px-3 sticky left-0 bg-primary/10 z-10 border-r uppercase">
                        TOTAL GERAL VENDAS (FUNCIONÁRIOS + TERCEIROS)
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisVendas.vendas_obra)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisVendas.comissao)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 3. EXIBIÇÃO DA TABELA PROGRESSIVA NO RODAPÉ DA ABA VENDAS (CONFORME PLANILHA) */}
          <Card className="border-muted">
            <CardHeader className="py-2.5 px-4 bg-muted/40 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>
                  TABELA PROGRESSIVA DE COMISSÕES (usada pelas fórmulas acima)
                </span>
                {isAdministrador && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-[11px] h-6 p-0 text-amber-600"
                    onClick={() => setAbaAtiva("tabelas")}
                  >
                    Editar faixas na aba Tabelas &rarr;
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {faixasComissao.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhuma faixa cadastrada. Configure na aba{" "}
                  <strong>Tabelas (Admin)</strong>.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b">
                      <tr>
                        <th className="py-1.5 px-3">De (R$)</th>
                        <th className="py-1.5 px-3">Até (R$)</th>
                        <th className="py-1.5 px-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {faixasComissao.map((f, idx) => {
                        const percFormatado =
                          Number(f.percentual || 0) > 1
                            ? Number(f.percentual || 0)
                            : Number(f.percentual || 0) * 100
                        return (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-1.5 px-3">
                              {fmtMoeda(f.de_valor)}
                            </td>
                            <td className="py-1.5 px-3">
                              {Number(f.ate_valor) >= 900000000
                                ? "Sem limite"
                                : fmtMoeda(f.ate_valor)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-amber-700">
                              {percFormatado.toLocaleString("pt-BR", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 3,
                              })}
                              %
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
        </TabsContent>

        {/* =========================================================================
            ABA 6: RESUMO (CONSOLIDAÇÃO TOTAL AUTOMÁTICA)
        ========================================================================== */}
        <TabsContent value="resumo" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => imprimirAbaA4("resumo")}
            >
              <Printer className="h-4 w-4" />
              Imprimir Resumo A4
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">
                  Resumo Geral — {rotuloCompetenciaMesAno}
                </CardTitle>
                <CardDescription className="text-xs">
                  Tudo aqui é automático — puxa do GERAL, PRODUÇÃO e VENDAS.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <span className="text-muted-foreground">Competência</span>
                    <span className="font-semibold text-foreground">
                      {rotuloCompetenciaMesAno}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <span className="text-muted-foreground">
                      Pessoas na folha
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {resumo.pessoasNaFolha}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <span className="text-muted-foreground">
                      Salários — Quinzena
                    </span>
                    <span className="font-mono font-medium text-blue-600">
                      {fmtMoeda(resumo.salariosQuinzena)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <span className="text-muted-foreground">
                      Salários — Mensal (líquido)
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {fmtMoeda(resumo.salariosMensalLiquido)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4 bg-muted/40 font-bold">
                    <span className="text-foreground">SUBTOTAL FOLHA</span>
                    <span className="font-mono text-primary text-sm">
                      {fmtMoeda(resumo.subtotalFolha)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <span className="text-muted-foreground">
                      Produção (a pagar)
                    </span>
                    <span className="font-mono font-medium text-emerald-600">
                      {fmtMoeda(resumo.producaoAPagar)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Vendas (comissões)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {totaisVendasTerceiros.comissao > 0
                          ? `Funcionários (${fmtMoeda(totaisVendasFuncionarios.comissao)}) + Terceiros Vendedores (${fmtMoeda(totaisVendasTerceiros.comissao)})`
                          : "Funcionários + Vendedores Terceiros"}
                      </span>
                    </div>
                    <span className="font-mono font-medium text-amber-600">
                      {fmtMoeda(resumo.vendasComissoes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4 bg-purple-50/50 dark:bg-purple-950/20">
                    <div className="flex flex-col">
                      <span className="text-purple-900 dark:text-purple-200 font-semibold">
                        Terceiros (folha à parte)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Quinzena ({fmtMoeda(totaisTerceiros.quinzena)}) + Mensal
                        ({fmtMoeda(totaisTerceiros.mensal)}) — salários sem
                        comissão / sem desconto
                      </span>
                    </div>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                      {fmtMoeda(resumo.terceirosFolha)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4 bg-primary/10 font-bold border-t-2">
                    <span className="text-primary text-sm uppercase">
                      TOTAL GERAL DO MÊS
                    </span>
                    <span className="font-mono text-primary text-base font-extrabold">
                      {fmtMoeda(resumo.totalGeralDoMes)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ENCARGOS RETIDOS / RECOLHIMENTO */}
            <Card>
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">
                  Tributos & Retenções da Competência
                </CardTitle>
                <CardDescription className="text-xs">
                  Valores apurados para guias de recolhimento da Receita Federal
                  e Previdência.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  <div className="flex items-center justify-between py-3 px-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        INSS retido (recolher)
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Descontado dos colaboradores na folha mensal
                      </p>
                    </div>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {fmtMoeda(resumo.inssRetido)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        IRRF retido (recolher)
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Imposto de Renda retido na fonte
                      </p>
                    </div>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {fmtMoeda(resumo.irrfRetido)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        Salário-família pago
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Valor dedutível na guia da Previdência Social
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      {fmtMoeda(resumo.salarioFamiliaPago)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =========================================================================
            ABA: 13º SALÁRIO (DÉCIMO TERCEIRO)
        ========================================================================== */}
        <TabsContent value="decimo" className="space-y-4">
          <AbaDecimoTerceiro
            ano={2026}
            empresaNome={empresaAtiva?.nome || "GC MIX"}
            funcionarios={
              funcionariosCadastradosEmpresa.length > 0
                ? funcionariosCadastradosEmpresa
                : funcionariosLinhas.map((fl: any) => ({
                    id: fl.funcionario_id || fl.id,
                    nome: fl.nome,
                    funcao: fl.funcao,
                    cargo: fl.cargo,
                    unidade: fl.unidade,
                    data_admissao: fl.data_admissao,
                    bruto: fl.bruto,
                    conta: fl.conta,
                    pix: fl.pix || fl.chave_pix,
                    oculto: fl.oculto,
                  }))
            }
            historicoLinhasAno={historicoLinhasAno}
            tabelaOficial={tabelaOficial}
            mostrarOcultos={mostrarOcultos}
            busca={busca}
            onImprimirA4={() => imprimirAbaA4("decimo")}
          />
        </TabsContent>

        {/* =========================================================================
            ABA 7: TABELAS (OFICIAIS — ADMIN)
        ========================================================================== */}
        {isAdministrador && (
          <TabsContent value="tabelas" className="space-y-4">
            <AbaTabelasOficiais
              onTabelaAtualizada={(novaTab) => {
                setTabelaOficial(novaTab)
              }}
              onFaixasComissaoAtualizadas={(novasFaixas) => {
                setFaixasComissao(novasFaixas)
              }}
            />
          </TabsContent>
        )}

        {/* =========================================================================
            ABA 8: BACKUP E RESTAURAÇÃO (ADMIN)
        ========================================================================== */}
        {isAdministrador && (
          <TabsContent value="backup" className="space-y-4">
            <AbaBackupFolha
              competenciaAtiva={competencia}
              competenciasDisponiveis={competenciasDisponiveis}
              onRestauraçãoConcluida={async () => {
                // Recarrega competências e dados atuais da folha
                if (empresaAtiva?.id) {
                  try {
                    const comps = await FolhaService.getCompetencias(
                      empresaAtiva.id,
                    )
                    const nomesComps = comps
                      .map((c) => c.competencia)
                      .sort()
                      .reverse()
                    if (nomesComps.length > 0) {
                      setCompetenciasDisponiveis(nomesComps)
                    }
                    const [compData, dataLinhas] = await Promise.all([
                      FolhaService.getCompetencia(empresaAtiva.id, competencia),
                      FolhaService.getLinhasCompetencia(
                        empresaAtiva.id,
                        competencia,
                      ),
                    ])
                    setCompetenciaObj(compData)
                    setLinhas(dataLinhas)
                  } catch (e) {
                    console.error("Erro ao atualizar folha pós-restauração:", e)
                  }
                }
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* MODAL DE EDIÇÃO / CRIAÇÃO DE LINHA */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {linhaEmEdicao?.id
                ? "Editar Registro na Folha"
                : "Novo Registro na Folha"}
            </DialogTitle>
          </DialogHeader>

          {linhaEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Nome Completo</Label>
                  <Input
                    value={linhaEmEdicao.nome || ""}
                    onChange={(e) =>
                      atualizarCampoEdicao("nome", e.target.value)
                    }
                    placeholder="Ex: ARLINDO LEITE DE BRITO JUNIOR"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Vínculo</Label>
                  <Select
                    value={linhaEmEdicao.tipo || "Funcionario"}
                    onValueChange={(val: any) =>
                      atualizarCampoEdicao("tipo", val)
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Funcionario">Funcionário</SelectItem>
                      <SelectItem value="Terceiro">
                        Terceiro (Folha à parte)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Função / Cargo</Label>
                  <Input
                    value={linhaEmEdicao.funcao || ""}
                    onChange={(e) =>
                      atualizarCampoEdicao("funcao", e.target.value)
                    }
                    placeholder="Ex: MOTORISTA"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Salário / Valor Bruto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={linhaEmEdicao.bruto ?? 0}
                    onChange={(e) =>
                      atualizarCampoEdicao(
                        "bruto",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="mt-1 h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs">Filhos (Até 14 Anos)</Label>
                  <Input
                    type="number"
                    value={linhaEmEdicao.filhos ?? 0}
                    onChange={(e) =>
                      atualizarCampoEdicao(
                        "filhos",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* IMPOSTOS & ENCARGOS FISCAIS (COM OPÇÃO DE SOBRESCREVER) */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TableIcon className="h-3.5 w-3.5 text-primary" />
                    Cálculos Oficiais (INSS, IRRF, Família, Quinzena, Líquido)
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    {tabelaOficial
                      ? "Tabelas 2026 Ativas"
                      : "Configure as tabelas"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px]">INSS (R$)</Label>
                      <button
                        type="button"
                        onClick={() => setInssManual(!inssManual)}
                        className="text-[9px] text-primary underline"
                      >
                        {inssManual ? "Auto" : "Digitar"}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.inss ?? 0}
                      onChange={(e) => {
                        setInssManual(true)
                        atualizarCampoEdicao(
                          "inss",
                          parseFloat(e.target.value) || 0,
                        )
                      }}
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px]">Família (R$)</Label>
                      <button
                        type="button"
                        onClick={() => setFamiliaManual(!familiaManual)}
                        className="text-[9px] text-primary underline"
                      >
                        {familiaManual ? "Auto" : "Digitar"}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.familia ?? 0}
                      onChange={(e) => {
                        setFamiliaManual(true)
                        atualizarCampoEdicao(
                          "familia",
                          parseFloat(e.target.value) || 0,
                        )
                      }}
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px]">IRRF (R$)</Label>
                      <button
                        type="button"
                        onClick={() => setIrManual(!irManual)}
                        className="text-[9px] text-primary underline"
                      >
                        {irManual ? "Auto" : "Digitar"}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.ir ?? 0}
                      onChange={(e) => {
                        setIrManual(true)
                        atualizarCampoEdicao(
                          "ir",
                          parseFloat(e.target.value) || 0,
                        )
                      }}
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-blue-600 font-semibold">
                        Quinzena (R$)
                      </Label>
                      <button
                        type="button"
                        onClick={() => setQuinzenaManual(!quinzenaManual)}
                        className="text-[9px] text-primary underline"
                      >
                        {quinzenaManual ? "Auto" : "Digitar"}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.quinzena ?? 0}
                      onChange={(e) => {
                        setQuinzenaManual(true)
                        atualizarCampoEdicao(
                          "quinzena",
                          parseFloat(e.target.value) || 0,
                        )
                      }}
                      className="mt-1 h-7 text-xs font-mono text-blue-600 font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-primary font-bold">
                        Mensal Líquido
                      </Label>
                      <button
                        type="button"
                        onClick={() => setMensalManual(!mensalManual)}
                        className="text-[9px] text-primary underline"
                      >
                        {mensalManual ? "Auto" : "Digitar"}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.mensal_liquido ?? 0}
                      onChange={(e) => {
                        setMensalManual(true)
                        atualizarCampoEdicao(
                          "mensal_liquido",
                          parseFloat(e.target.value) || 0,
                        )
                      }}
                      className="mt-1 h-7 text-xs font-mono font-bold text-primary bg-primary/5"
                    />
                  </div>
                </div>
              </div>

              {/* DADOS BANCÁRIOS & OBSERVAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Agência / Conta</Label>
                  <Input
                    value={linhaEmEdicao.conta || ""}
                    onChange={(e) =>
                      atualizarCampoEdicao("conta", e.target.value)
                    }
                    placeholder="Ex: 1563/82316-4"
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Chave PIX</Label>
                  <Input
                    value={linhaEmEdicao.pix || ""}
                    onChange={(e) =>
                      atualizarCampoEdicao("pix", e.target.value)
                    }
                    placeholder="Ex: 87999146340"
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Observação</Label>
                  <Input
                    value={linhaEmEdicao.observacao_linha || ""}
                    onChange={(e) =>
                      atualizarCampoEdicao("observacao_linha", e.target.value)
                    }
                    placeholder="Ex: Comissões na aba vendas"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarLinha}>Gravar Lançamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={Boolean(linhaParaExcluir)}
        onOpenChange={(open) => !open && setLinhaParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento da folha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o lançamento de{" "}
              <strong>{linhaParaExcluir?.nome}</strong> da competência{" "}
              <strong>{competencia}</strong>.
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

      {/* ÁREA DE IMPRESSÃO A4 (VISÍVEL SOMENTE NA IMPRESSÃO) */}
      <div
        className="hidden print:block font-sans text-black p-4"
        ref={printRef}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
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
                Unidade: {empresaAtiva?.nome}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-xs uppercase bg-gray-100 px-2.5 py-1 rounded border">
              {tipoImpressaoA4 === "quinzena"
                ? "FOLHA DE QUINZENA"
                : tipoImpressaoA4 === "producao"
                  ? "FOLHA DE PRODUÇÃO"
                  : tipoImpressaoA4 === "geral"
                    ? "FOLHA GERAL DE PAGAMENTO"
                    : tipoImpressaoA4 === "vendas"
                      ? "FOLHA DE VENDAS / COMISSÕES"
                      : tipoImpressaoA4 === "resumo"
                        ? "RESUMO GERAL DA FOLHA"
                        : tipoImpressaoA4 === "decimo"
                          ? "FOLHA DO 13º SALÁRIO"
                          : "FOLHA MENSAL"}
            </span>
            <p className="text-[11px] font-semibold mt-1">
              {tipoImpressaoA4 === "decimo"
                ? "Exercício: 2026"
                : `Competência: ${rotuloCompetenciaMesAno}`}
            </p>
            <p className="text-[10px] text-gray-600 print-only">
              Emitido em {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {tipoImpressaoA4 === "geral" && (
          <div className="space-y-4">
            <table className="w-full border-collapse border text-[9px]">
              <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                <tr>
                  <th className="border p-1 text-center w-5">Nº</th>
                  <th className="border p-1 text-left">NOME</th>
                  <th className="border p-1 text-left">FUNÇÃO</th>
                  <th className="border p-1 text-right">TOTAL BRUTO</th>
                  <th className="border p-1 text-center">FILHOS</th>
                  <th className="border p-1 text-right">PRODUÇÃO (+)</th>
                  <th className="border p-1 text-right">QUINZENA</th>
                  <th className="border p-1 text-right">INSS</th>
                  <th className="border p-1 text-right">FAMÍLIA</th>
                  <th className="border p-1 text-right">IRRF</th>
                  <th className="border p-1 text-right font-bold">
                    LÍQUIDO TOTAL
                  </th>
                  <th className="border p-1 text-left">PIX / CONTA</th>
                  <th className="border p-1 text-center w-36">ASSINATURA</th>
                </tr>
              </thead>
              <tbody>
                {linhasGeralProcessadas.map((l, idx) => (
                  <tr key={l.id}>
                    <td className="border p-1 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border p-1 font-semibold">{l.nome}</td>
                    <td className="border p-1">{l.funcao}</td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(l.bruto)}
                    </td>
                    <td className="border p-1 text-center font-mono">
                      {l.filhos > 0 ? l.filhos : 0}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {l.producaoGeralMais > 0
                        ? fmtMoeda(l.producaoGeralMais)
                        : "-"}
                    </td>
                    <td className="border p-1 text-center font-mono">—</td>
                    <td className="border p-1 text-right font-mono">
                      {l.inssFinal > 0 ? fmtMoeda(l.inssFinal) : "-"}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {l.familiaFinal > 0 ? fmtMoeda(l.familiaFinal) : "-"}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {l.irrfFinal > 0 ? fmtMoeda(l.irrfFinal) : "-"}
                    </td>
                    <td className="border p-1 text-right font-mono font-bold">
                      {fmtMoeda(l.liquidoGeral)}
                    </td>
                    <td className="border p-1 font-mono text-[8px]">
                      {l.pix || l.conta || "-"}
                    </td>
                    <td className="border p-1"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="border p-1 text-center">-</td>
                  <td className="border p-1">
                    TOTAL FUNCIONÁRIOS ({linhasGeralProcessadas.length})
                  </td>
                  <td className="border p-1">-</td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.bruto)}
                  </td>
                  <td className="border p-1 text-center font-mono">
                    {totaisGeral.filhos}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.producaoGeralMais)}
                  </td>
                  <td className="border p-1 text-center font-mono">—</td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.inss)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.familia)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.irrf)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.liquidoGeral)}
                  </td>
                  <td className="border p-1" colSpan={2}></td>
                </tr>
                {terceirosProcessados.length > 0 && (
                  <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                    <td className="border p-1 text-center">-</td>
                    <td className="border p-1 uppercase">
                      TOTAL GERAL DA FOLHA (FUNC. + TERC.)
                    </td>
                    <td className="border p-1">
                      {linhasGeralProcessadas.length +
                        terceirosProcessados.length}{" "}
                      pess.
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(totaisGeral.bruto + totaisTerceiros.valorMes)}
                    </td>
                    <td className="border p-1 text-center font-mono">
                      {totaisGeral.filhos}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(totaisGeral.producaoGeralMais)}
                    </td>
                    <td className="border p-1 text-center font-mono">—</td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(totaisGeral.inss)}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(totaisGeral.familia)}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(totaisGeral.irrf)}
                    </td>
                    <td className="border p-1 text-right font-mono text-[10px] font-black">
                      {fmtMoeda(
                        totaisGeral.liquidoGeral + totaisTerceiros.valorMes,
                      )}
                    </td>
                    <td className="border p-1" colSpan={2}></td>
                  </tr>
                )}
              </tfoot>
            </table>

            {terceirosProcessados.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="font-bold text-[10px] uppercase">
                  TERCEIROS (QUINZENA {Math.round(percentualQuinzena * 100)}% /
                  MENSAL {Math.round((1 - percentualQuinzena) * 100)}% SEM
                  DESCONTO)
                </div>
                <table className="w-full border-collapse border text-[9px]">
                  <thead className="bg-gray-100 font-bold uppercase">
                    <tr>
                      <th className="border p-1 text-center w-5">Nº</th>
                      <th className="border p-1 text-left">NOME</th>
                      <th className="border p-1 text-right">VALOR DO MÊS</th>
                      <th className="border p-1 text-right">QUINZENA</th>
                      <th className="border p-1 text-right font-bold">
                        MENSAL
                      </th>
                      <th className="border p-1 text-left">PIX</th>
                      <th className="border p-1 text-left">OBS</th>
                      <th className="border p-1 text-center w-36">
                        ASSINATURA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {terceirosProcessados.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="border p-1 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border p-1 font-semibold">{t.nome}</td>
                        <td className="border p-1 text-right font-mono">
                          {fmtMoeda(t.valorMes)}
                        </td>
                        <td className="border p-1 text-right font-mono">
                          {fmtMoeda(t.quinzena)}
                        </td>
                        <td className="border p-1 text-right font-mono font-bold">
                          {fmtMoeda(t.mensal)}
                        </td>
                        <td className="border p-1 font-mono text-[8px]">
                          {t.pix || t.chave_pix || "-"}
                        </td>
                        <td className="border p-1 text-[8px]">
                          {t.observacao_linha || "-"}
                        </td>
                        <td className="border p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5">
                        TOTAL TERCEIROS ({terceirosProcessados.length})
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisTerceiros.valorMes)}
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisTerceiros.quinzena)}
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisTerceiros.mensal)}
                      </td>
                      <td className="border p-1.5" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* BOX DE CONSOLIDAÇÃO GERAL GC MIX NA IMPRESSÃO A4 (SOMA DAS DUAS UNIDADES) */}
            <div className="space-y-1.5 pt-3">
              <div className="font-black text-[10px] uppercase tracking-wide bg-gray-200 border border-gray-400 p-1.5 flex items-center justify-between">
                <span>
                  CONSOLIDAÇÃO GERAL GC MIX (SOMA DAS DUAS UNIDADES) —{" "}
                  {rotuloCompetenciaMesAno}
                </span>
                <span className="text-[9px] font-semibold text-gray-700">
                  MONTEIRO + SJE / CALDAS & AMARAL
                </span>
              </div>
              <table className="w-full border-collapse border border-gray-400 text-[9px]">
                <thead className="bg-gray-100 font-bold uppercase text-gray-800">
                  <tr>
                    <th className="border border-gray-400 p-1 text-left">
                      UNIDADE
                    </th>
                    <th className="border border-gray-400 p-1 text-center w-28">
                      COLABORADORES
                    </th>
                    <th className="border border-gray-400 p-1 text-right">
                      LÍQUIDO FUNCIONÁRIOS
                    </th>
                    <th className="border border-gray-400 p-1 text-right">
                      TOTAL TERCEIROS
                    </th>
                    <th className="border border-gray-400 p-1 text-right">
                      TOTAL DE VENDAS
                    </th>
                    <th className="border border-gray-400 p-1 text-right">
                      COMISSÕES
                    </th>
                    <th className="border border-gray-400 p-1 text-right font-bold">
                      VALOR REAL DA FOLHA
                    </th>
                    <th className="border border-gray-400 p-1 text-left">
                      SITUAÇÃO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-1 font-semibold">
                      UNIDADE MONTEIRO
                    </td>
                    <td className="border border-gray-400 p-1 text-center font-mono">
                      {consolidacaoDuasFolhas.temMonteiro
                        ? `${consolidacaoDuasFolhas.monteiro.qtdFuncionarios} func. + ${consolidacaoDuasFolhas.monteiro.qtdTerceiros} terc.`
                        : "0"}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono">
                      {fmtMoeda(
                        consolidacaoDuasFolhas.monteiro.totalFuncionarios,
                      )}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono">
                      {fmtMoeda(consolidacaoDuasFolhas.monteiro.totalTerceiros)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono text-blue-800">
                      {fmtMoeda(consolidacaoDuasFolhas.monteiro.totalVendas)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono text-amber-800">
                      {fmtMoeda(consolidacaoDuasFolhas.monteiro.totalComissoes)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono font-bold">
                      {fmtMoeda(consolidacaoDuasFolhas.monteiro.valorReal)}
                    </td>
                    <td className="border border-gray-400 p-1 text-[8px]">
                      {consolidacaoDuasFolhas.temMonteiro
                        ? "Competência lançada"
                        : "Competência não lançada"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1 font-semibold">
                      UNIDADE SJE (CALDAS & AMARAL)
                    </td>
                    <td className="border border-gray-400 p-1 text-center font-mono">
                      {consolidacaoDuasFolhas.temSje
                        ? `${consolidacaoDuasFolhas.sje.qtdFuncionarios} func. + ${consolidacaoDuasFolhas.sje.qtdTerceiros} terc.`
                        : "0"}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono">
                      {fmtMoeda(consolidacaoDuasFolhas.sje.totalFuncionarios)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono">
                      {fmtMoeda(consolidacaoDuasFolhas.sje.totalTerceiros)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono text-blue-800">
                      {fmtMoeda(consolidacaoDuasFolhas.sje.totalVendas)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono text-amber-800">
                      {fmtMoeda(consolidacaoDuasFolhas.sje.totalComissoes)}
                    </td>
                    <td className="border border-gray-400 p-1 text-right font-mono font-bold">
                      {fmtMoeda(consolidacaoDuasFolhas.sje.valorReal)}
                    </td>
                    <td className="border border-gray-400 p-1 text-[8px]">
                      {consolidacaoDuasFolhas.temSje
                        ? "Competência lançada"
                        : "Competência não lançada"}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-gray-200 font-bold border-t-2 border-gray-500">
                  <tr>
                    <td className="border border-gray-400 p-1.5 uppercase font-black">
                      TOTAL CONSOLIDADO GC MIX
                    </td>
                    <td className="border border-gray-400 p-1.5 text-center font-mono">
                      {consolidacaoDuasFolhas.monteiro.qtdFuncionarios +
                        consolidacaoDuasFolhas.monteiro.qtdTerceiros +
                        consolidacaoDuasFolhas.sje.qtdFuncionarios +
                        consolidacaoDuasFolhas.sje.qtdTerceiros}{" "}
                      total
                    </td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono">
                      {fmtMoeda(
                        consolidacaoDuasFolhas.monteiro.totalFuncionarios +
                          consolidacaoDuasFolhas.sje.totalFuncionarios,
                      )}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono">
                      {fmtMoeda(
                        consolidacaoDuasFolhas.monteiro.totalTerceiros +
                          consolidacaoDuasFolhas.sje.totalTerceiros,
                      )}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono font-bold text-blue-900">
                      {fmtMoeda(consolidacaoDuasFolhas.totalVendasConsolidado)}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono font-bold text-amber-900">
                      {fmtMoeda(
                        consolidacaoDuasFolhas.totalComissoesConsolidado,
                      )}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono text-[10px] font-black text-black">
                      {fmtMoeda(consolidacaoDuasFolhas.totalConsolidado)}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-[8px]">
                      {!consolidacaoDuasFolhas.temMonteiro ||
                      !consolidacaoDuasFolhas.temSje
                        ? "Total parcial (unidade pendente)"
                        : "Consolidação completa das 2 unidades"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {tipoImpressaoA4 === "quinzena" && (
          <div className="space-y-4">
            <table className="w-full border-collapse border text-[10px]">
              <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                <tr>
                  <th className="border p-1.5 text-center w-6">Nº</th>
                  <th className="border p-1.5 text-left">NOME</th>
                  <th className="border p-1.5 text-left">FUNÇÃO</th>
                  <th className="border p-1.5 text-right font-bold">
                    QUINZENA ({Math.round(percentualQuinzena * 100)}%)
                  </th>
                  <th className="border p-1.5 text-left">AGÊNCIA / C/C</th>
                  <th className="border p-1.5 text-left">PIX</th>
                  <th className="border p-1.5 text-center w-36">ASSINATURA</th>
                </tr>
              </thead>
              <tbody>
                {linhasGeralProcessadas.map((l, idx) => (
                  <tr key={l.id}>
                    <td className="border p-1 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border p-1 font-semibold">{l.nome}</td>
                    <td className="border p-1">{l.funcao}</td>
                    <td className="border p-1 text-right font-mono font-bold">
                      {fmtMoeda(l.quinzenaFinal)}
                    </td>
                    <td className="border p-1 font-mono text-[9px]">
                      {l.conta || "-"}
                    </td>
                    <td className="border p-1 font-mono text-[9px]">
                      {l.pix || l.chave_pix || "-"}
                    </td>
                    <td className="border p-1"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="border p-1.5 text-center">-</td>
                  <td className="border p-1.5">
                    TOTAL FUNCIONÁRIOS ({linhasGeralProcessadas.length})
                  </td>
                  <td className="border p-1.5">-</td>
                  <td className="border p-1.5 text-right font-mono">
                    {fmtMoeda(totaisGeral.quinzena)}
                  </td>
                  <td className="border p-1.5" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>

            {terceirosProcessados.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <h4 className="text-[11px] font-bold uppercase text-gray-800">
                  QUINZENA TERCEIROS ({Math.round(percentualQuinzena * 100)}%)
                </h4>
                <table className="w-full border-collapse border text-[10px]">
                  <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                    <tr>
                      <th className="border p-1.5 text-center w-6">Nº</th>
                      <th className="border p-1.5 text-left">NOME</th>
                      <th className="border p-1.5 text-right font-bold">
                        QUINZENA ({Math.round(percentualQuinzena * 100)}%)
                      </th>
                      <th className="border p-1.5 text-left">PIX</th>
                      <th className="border p-1.5 text-left">OBS</th>
                      <th className="border p-1.5 text-center w-36">
                        ASSINATURA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {terceirosProcessados.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="border p-1 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border p-1 font-semibold">{t.nome}</td>
                        <td className="border p-1 text-right font-mono font-bold">
                          {fmtMoeda(t.quinzena)}
                        </td>
                        <td className="border p-1 font-mono text-[9px]">
                          {t.pix || t.chave_pix || "-"}
                        </td>
                        <td className="border p-1 text-[9px]">
                          {t.observacao_linha || "-"}
                        </td>
                        <td className="border p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5">
                        TOTAL TERCEIROS ({terceirosProcessados.length})
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisTerceiros.quinzena)}
                      </td>
                      <td className="border p-1.5" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {tipoImpressaoA4 === "mensal" && (
          <div className="space-y-4">
            <table className="w-full border-collapse border text-[9px]">
              <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                <tr>
                  <th className="border p-1 text-center w-5">Nº</th>
                  <th className="border p-1 text-left">NOME</th>
                  <th className="border p-1 text-left">FUNÇÃO</th>
                  <th className="border p-1 text-right">QUINZENA</th>
                  <th className="border p-1 text-right">INSS</th>
                  <th className="border p-1 text-right">FAMÍLIA</th>
                  <th className="border p-1 text-right">IRRF</th>
                  <th className="border p-1 text-right font-bold">
                    MENSAL (LÍQUIDO)
                  </th>
                  <th className="border p-1 text-left">PIX / CONTA</th>
                  <th className="border p-1 text-center w-36">ASSINATURA</th>
                </tr>
              </thead>
              <tbody>
                {linhasGeralProcessadas.map((l, idx) => (
                  <tr key={l.id}>
                    <td className="border p-1 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border p-1 font-semibold">{l.nome}</td>
                    <td className="border p-1">{l.funcao}</td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(l.quinzenaFinal)}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {fmtMoeda(l.inssFinal)}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {l.familiaFinal > 0 ? fmtMoeda(l.familiaFinal) : "-"}
                    </td>
                    <td className="border p-1 text-right font-mono">
                      {l.irrfFinal > 0 ? fmtMoeda(l.irrfFinal) : "-"}
                    </td>
                    <td className="border p-1 text-right font-mono font-bold">
                      {fmtMoeda(l.mensalFinal)}
                    </td>
                    <td className="border p-1 font-mono text-[8px]">
                      {l.pix || l.conta || "-"}
                    </td>
                    <td className="border p-1"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="border p-1 text-center">-</td>
                  <td className="border p-1">TOTAL FUNCIONÁRIOS</td>
                  <td className="border p-1">-</td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.quinzena)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.inss)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.familia)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.irrf)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(totaisGeral.mensal)}
                  </td>
                  <td className="border p-1" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>

            {terceirosMensal.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="font-bold text-[10px] uppercase">
                  MENSAL TERCEIROS ({Math.round((1 - percentualQuinzena) * 100)}
                  % SEM DESCONTO)
                </div>
                <table className="w-full border-collapse border text-[9px]">
                  <thead className="bg-gray-100 font-bold uppercase">
                    <tr>
                      <th className="border p-1 text-center w-5">Nº</th>
                      <th className="border p-1 text-left">NOME</th>
                      <th className="border p-1 text-right">VALOR DO MÊS</th>
                      <th className="border p-1 text-right font-bold">
                        MENSAL
                      </th>
                      <th className="border p-1 text-left">PIX</th>
                      <th className="border p-1 text-left">OBS</th>
                      <th className="border p-1 text-center w-36">
                        ASSINATURA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {terceirosMensal.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="border p-1 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border p-1 font-semibold">{t.nome}</td>
                        <td className="border p-1 text-right font-mono">
                          {fmtMoeda(t.valorMes)}
                        </td>
                        <td className="border p-1 text-right font-mono font-bold">
                          {fmtMoeda(t.mensal)}
                        </td>
                        <td className="border p-1 font-mono text-[9px]">
                          {t.pix || t.chave_pix || "-"}
                        </td>
                        <td className="border p-1 text-[9px]">
                          {t.observacao_linha || "-"}
                        </td>
                        <td className="border p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td className="border p-1.5 text-center">-</td>
                      <td className="border p-1.5">
                        TOTAL TERCEIROS ({terceirosMensal.length})
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisTerceirosMensal.valorMes)}
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisTerceirosMensal.mensal)}
                      </td>
                      <td className="border p-1.5" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {tipoImpressaoA4 === "producao" && (
          <table className="w-full border-collapse border text-[9px]">
            <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
              <tr>
                <th className="border p-1 text-center w-5">Nº</th>
                <th className="border p-1 text-left">NOME</th>
                <th className="border p-1 text-center">OBRAS</th>
                <th className="border p-1 text-right">R$/OBRA</th>
                <th className="border p-1 text-right">LIMP.</th>
                <th className="border p-1 text-right">SÁB.</th>
                <th className="border p-1 text-right">FER.</th>
                <th className="border p-1 text-right">AJUDA</th>
                <th className="border p-1 text-right">PRODUÇÃO</th>
                <th className="border p-1 text-right">GRATIF.</th>
                <th className="border p-1 text-right">ADIANT. (−)</th>
                <th className="border p-1 text-right font-bold">A PAGAR (=)</th>
                <th className="border p-1 text-center w-36">ASSINATURA</th>
              </tr>
            </thead>
            <tbody>
              {linhasProducao.map((l, idx) => (
                <tr key={l.id}>
                  <td className="border p-1 text-center font-mono">
                    {idx + 1}
                  </td>
                  <td className="border p-1 font-semibold">{l.nome}</td>
                  <td className="border p-1 text-center font-mono">
                    {l.obras > 0 ? l.obras : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.obras > 0 ? fmtMoeda(l.valor_obra) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.limpeza > 0 ? fmtMoeda(l.limpeza) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.sabado > 0 ? fmtMoeda(l.sabado) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.feriado && l.feriado > 0 ? fmtMoeda(l.feriado) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.ajuda_custo > 0 ? fmtMoeda(l.ajuda_custo) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(l.producaoTotal)}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.gratificacao > 0 ? fmtMoeda(l.gratificacao) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono">
                    {l.adiantamento > 0 ? fmtMoeda(l.adiantamento) : "-"}
                  </td>
                  <td className="border p-1 text-right font-mono font-bold">
                    {fmtMoeda(l.aPagar)}
                  </td>
                  <td className="border p-1"></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td className="border p-1 text-center">-</td>
                <td className="border p-1">TOTAL</td>
                <td className="border p-1 text-center font-mono">
                  {totaisProducao.obras}
                </td>
                <td className="border p-1">-</td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.limpeza)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.sabado)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.feriado)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.ajuda_custo)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.producao)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.gratificacao)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.adiantamento)}
                </td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisProducao.aPagar)}
                </td>
                <td className="border p-1"></td>
              </tr>
            </tfoot>
          </table>
        )}

        {tipoImpressaoA4 === "vendas" && (
          <div className="space-y-4">
            {/* Seção Terceiros Vendedores na Impressão A4 */}
            {linhasVendasTerceiros.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-[11px] uppercase bg-gray-100 p-1 border">
                  VENDEDORES TERCEIROS (fora da folha) — COMISSÃO TABELA
                  PROGRESSIVA
                </div>
                <table className="w-full border-collapse border text-[10px]">
                  <thead className="bg-gray-50 font-bold uppercase">
                    <tr>
                      <th className="border p-1.5 text-left">NOME</th>
                      <th className="border p-1.5 text-right">
                        VALOR DAS OBRAS
                      </th>
                      <th className="border p-1.5 text-right">
                        COMISSÃO (PROGRESSIVA)
                      </th>
                      <th className="border p-1.5 text-left">AGÊNCIA / C/C</th>
                      <th className="border p-1.5 text-left">PIX</th>
                      <th className="border p-1.5 text-center w-36">
                        ASSINATURA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasVendasTerceiros.map((l) => (
                      <tr key={l.id}>
                        <td className="border p-1 font-semibold">{l.nome}</td>
                        <td className="border p-1 text-right font-mono">
                          {fmtMoeda(l.vendas_obra)}
                        </td>
                        <td className="border p-1 text-right font-mono font-bold">
                          {fmtMoeda(l.comissaoFinal)}
                        </td>
                        <td className="border p-1 font-mono text-[9px]">
                          {l.conta || "-"}
                        </td>
                        <td className="border p-1 font-mono text-[9px]">
                          {l.pix || l.chave_pix || "-"}
                        </td>
                        <td className="border p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td className="border p-1.5">
                        TOTAL TERCEIROS VENDEDORES
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisVendasTerceiros.vendas_obra)}
                      </td>
                      <td className="border p-1.5 text-right font-mono">
                        {fmtMoeda(totaisVendasTerceiros.comissao)}
                      </td>
                      <td className="border p-1.5" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Seção Funcionários Vendedores na Impressão A4 */}
            <div className="space-y-2">
              <div className="font-bold text-[11px] uppercase bg-gray-100 p-1 border">
                VENDEDORES DA FOLHA (FUNCIONÁRIOS) — COMISSÃO 0,5%
              </div>
              <table className="w-full border-collapse border text-[10px]">
                <thead className="bg-gray-50 text-gray-800 font-bold uppercase">
                  <tr>
                    <th className="border p-1.5 text-center w-6">Nº</th>
                    <th className="border p-1.5 text-left">NOME</th>
                    <th className="border p-1.5 text-right font-semibold">
                      VALOR DAS OBRAS
                    </th>
                    <th className="border p-1.5 text-right font-bold">
                      COMISSÃO (0,5%)
                    </th>
                    <th className="border p-1.5 text-left">AGÊNCIA / C/C</th>
                    <th className="border p-1.5 text-left">PIX</th>
                    <th className="border p-1.5 text-center w-36">
                      ASSINATURA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhasVendasFuncionarios.map((l, idx) => (
                    <tr key={l.id}>
                      <td className="border p-1 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border p-1 font-semibold">{l.nome}</td>
                      <td className="border p-1 text-right font-mono">
                        {fmtMoeda(l.vendas_obra)}
                      </td>
                      <td className="border p-1 text-right font-mono font-bold">
                        {fmtMoeda(l.comissaoFinal)}
                      </td>
                      <td className="border p-1 font-mono text-[9px]">
                        {l.conta || "-"}
                      </td>
                      <td className="border p-1 font-mono text-[9px]">
                        {l.pix || l.chave_pix || "-"}
                      </td>
                      <td className="border p-1"></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="border p-1.5 text-center">-</td>
                    <td className="border p-1.5">
                      TOTAL VENDAS FUNCIONÁRIOS (
                      {linhasVendasFuncionarios.length})
                    </td>
                    <td className="border p-1.5 text-right font-mono">
                      {fmtMoeda(totaisVendasFuncionarios.vendas_obra)}
                    </td>
                    <td className="border p-1.5 text-right font-mono">
                      {fmtMoeda(totaisVendasFuncionarios.comissao)}
                    </td>
                    <td className="border p-1.5" colSpan={3}></td>
                  </tr>
                  <tr className="bg-gray-200 font-extrabold border-t-2">
                    <td className="border p-1.5 text-center">-</td>
                    <td className="border p-1.5">
                      TOTAL GERAL VENDAS (FUNCIONÁRIOS + TERCEIROS)
                    </td>
                    <td className="border p-1.5 text-right font-mono">
                      {fmtMoeda(totaisVendas.vendas_obra)}
                    </td>
                    <td className="border p-1.5 text-right font-mono">
                      {fmtMoeda(totaisVendas.comissao)}
                    </td>
                    <td className="border p-1.5" colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tabela Progressiva na Impressão A4 */}
            {faixasComissao.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold uppercase mb-1">
                  TABELA PROGRESSIVA DE COMISSÕES (usada pelas fórmulas acima)
                </div>
                <table className="w-1/2 border-collapse border text-[9px] font-mono">
                  <thead className="bg-gray-50 uppercase">
                    <tr>
                      <th className="border p-1 text-left">De (R$)</th>
                      <th className="border p-1 text-left">Até (R$)</th>
                      <th className="border p-1 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faixasComissao.map((f, idx) => {
                      const percFormatado =
                        Number(f.percentual || 0) > 1
                          ? Number(f.percentual || 0)
                          : Number(f.percentual || 0) * 100
                      return (
                        <tr key={idx}>
                          <td className="border p-1">{fmtMoeda(f.de_valor)}</td>
                          <td className="border p-1">
                            {Number(f.ate_valor) >= 900000000
                              ? "Sem limite"
                              : fmtMoeda(f.ate_valor)}
                          </td>
                          <td className="border p-1 text-right font-bold">
                            {percFormatado.toLocaleString("pt-BR", {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 3,
                            })}
                            %
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {dadosLancadorVendas && (
              <div className="p-3 border rounded bg-gray-50 text-[10px] space-y-1">
                <div className="font-bold uppercase">
                  Destaque Lançador de Vendas: {dadosLancadorVendas.linha.nome}
                </div>
                <div className="flex gap-4">
                  <span>
                    Vendido: {fmtMoeda(dadosLancadorVendas.vendasObra)}
                  </span>
                  <span>
                    Comissão: {fmtMoeda(dadosLancadorVendas.comissaoFinal)}
                  </span>
                  <span>
                    Ajuda de Custo: {fmtMoeda(dadosLancadorVendas.ajudaCusto)}
                  </span>
                  <span className="font-bold">
                    Total Vendas:{" "}
                    {fmtMoeda(dadosLancadorVendas.totalReceberVendas)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {tipoImpressaoA4 === "decimo" && (
          <div className="space-y-4">
            <table className="w-full border-collapse border text-[8px]">
              <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                <tr>
                  <th className="border p-1 text-center w-5">Nº</th>
                  <th className="border p-1 text-left">NOME</th>
                  <th className="border p-1 text-left">FUNÇÃO</th>
                  <th className="border p-1 text-center">ADMISSÃO</th>
                  <th className="border p-1 text-center">MESES</th>
                  <th className="border p-1 text-right">BRUTO 13º</th>
                  <th className="border p-1 text-right">1ª PARCELA</th>
                  <th className="border p-1 text-right">INSS 2ª P.</th>
                  <th className="border p-1 text-right">IRRF 2ª P.</th>
                  <th className="border p-1 text-right">LÍQ. 2ª P.</th>
                  <th className="border p-1 text-right font-bold">TOTAL 13º</th>
                  <th className="border p-1 text-left">CONTA / PIX</th>
                  <th className="border p-1 text-center w-32">ASSINATURA</th>
                </tr>
              </thead>
              <tbody>
                {(funcionariosCadastradosEmpresa.length > 0
                  ? funcionariosCadastradosEmpresa
                  : funcionariosLinhas.map((fl: any) => ({
                      id: fl.funcionario_id || fl.id,
                      nome: fl.nome,
                      funcao: fl.funcao,
                      cargo: fl.cargo,
                      unidade: fl.unidade,
                      data_admissao: fl.data_admissao,
                      bruto: fl.bruto,
                      conta: fl.conta,
                      pix: fl.pix || fl.chave_pix,
                      oculto: fl.oculto,
                    }))
                )
                  .filter((f: any) => (mostrarOcultos ? true : !f.oculto))
                  .map((f, idx) => {
                    const meses = calcularMesesProporcionais13(
                      f.data_admissao,
                      2026,
                    )
                    const calc = calcularLinhaDecimoTerceiro(
                      f.bruto,
                      meses,
                      tabelaOficial,
                    )
                    return (
                      <tr key={f.id}>
                        <td className="border p-1 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border p-1 font-semibold whitespace-nowrap">
                          {f.nome}
                        </td>
                        <td className="border p-1 whitespace-nowrap">
                          {f.funcao || "Geral"}
                        </td>
                        <td className="border p-1 text-center font-mono text-[8px] whitespace-nowrap">
                          {f.data_admissao
                            ? f.data_admissao.includes("-")
                              ? f.data_admissao.split("-").reverse().join("/")
                              : f.data_admissao
                            : "—"}
                        </td>
                        <td className="border p-1 text-center font-mono font-bold">
                          {meses}/12
                        </td>
                        <td className="border p-1 text-right font-mono">
                          {fmtMoeda(calc.bruto13)}
                        </td>
                        <td className="border p-1 text-right font-mono font-bold text-blue-800">
                          {fmtMoeda(calc.primeiraParcela)}
                        </td>
                        <td className="border p-1 text-right font-mono">
                          {calc.inssSegundaParcela > 0
                            ? fmtMoeda(calc.inssSegundaParcela)
                            : "-"}
                        </td>
                        <td className="border p-1 text-right font-mono">
                          {calc.irrfSegundaParcela > 0
                            ? fmtMoeda(calc.irrfSegundaParcela)
                            : "-"}
                        </td>
                        <td className="border p-1 text-right font-mono">
                          {fmtMoeda(calc.liquidoSegundaParcela)}
                        </td>
                        <td className="border p-1 text-right font-mono font-bold">
                          {fmtMoeda(calc.totalLiquido13)}
                        </td>
                        <td className="border p-1 font-mono text-[7px] whitespace-nowrap">
                          {f.pix || f.conta || "-"}
                        </td>
                        <td className="border p-1"></td>
                      </tr>
                    )
                  })}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                {(() => {
                  const lista = (
                    funcionariosCadastradosEmpresa.length > 0
                      ? funcionariosCadastradosEmpresa
                      : funcionariosLinhas.map((fl: any) => ({
                          id: fl.funcionario_id || fl.id,
                          nome: fl.nome,
                          funcao: fl.funcao,
                          cargo: fl.cargo,
                          unidade: fl.unidade,
                          data_admissao: fl.data_admissao,
                          bruto: fl.bruto,
                          conta: fl.conta,
                          pix: fl.pix || fl.chave_pix,
                          oculto: fl.oculto,
                        }))
                  ).filter((f: any) => (mostrarOcultos ? true : !f.oculto))

                  const tot = lista.reduce(
                    (acc: any, f: any) => {
                      const m = calcularMesesProporcionais13(
                        f.data_admissao,
                        2026,
                      )
                      const c = calcularLinhaDecimoTerceiro(
                        f.bruto,
                        m,
                        tabelaOficial,
                      )
                      return {
                        bruto13: acc.bruto13 + c.bruto13,
                        primeira: acc.primeira + c.primeiraParcela,
                        inss: acc.inss + c.inssSegundaParcela,
                        irrf: acc.irrf + c.irrfSegundaParcela,
                        liquido2: acc.liquido2 + c.liquidoSegundaParcela,
                        total: acc.total + c.totalLiquido13,
                      }
                    },
                    {
                      bruto13: 0,
                      primeira: 0,
                      inss: 0,
                      irrf: 0,
                      liquido2: 0,
                      total: 0,
                    },
                  )

                  return (
                    <tr>
                      <td className="border p-1 text-center">-</td>
                      <td className="border p-1 uppercase" colSpan={4}>
                        TOTAL GERAL 13º ({lista.length} FUNCIONÁRIOS)
                      </td>
                      <td className="border p-1 text-right font-mono">
                        {fmtMoeda(tot.bruto13)}
                      </td>
                      <td className="border p-1 text-right font-mono">
                        {fmtMoeda(tot.primeira)}
                      </td>
                      <td className="border p-1 text-right font-mono">
                        {fmtMoeda(tot.inss)}
                      </td>
                      <td className="border p-1 text-right font-mono">
                        {fmtMoeda(tot.irrf)}
                      </td>
                      <td className="border p-1 text-right font-mono">
                        {fmtMoeda(tot.liquido2)}
                      </td>
                      <td className="border p-1 text-right font-mono text-[9px] font-black">
                        {fmtMoeda(tot.total)}
                      </td>
                      <td className="border p-1" colSpan={2}></td>
                    </tr>
                  )
                })()}
              </tfoot>
            </table>
            <div className="pt-6 grid grid-cols-2 gap-8 text-[11px] text-center">
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span>Responsável pelo Departamento Financeiro / Folha</span>
              </div>
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span>Diretoria / Aprovação</span>
              </div>
            </div>
          </div>
        )}

        {tipoImpressaoA4 === "resumo" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <table className="w-full border-collapse border text-[10px]">
                <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                  <tr>
                    <th className="border p-2 text-left" colSpan={2}>
                      RESUMO DA FOLHA — {rotuloCompetenciaMesAno}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Pessoas na Folha</td>
                    <td className="border p-2 text-right font-mono font-bold">
                      {resumo.pessoasNaFolha}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Salários — Quinzena</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.salariosQuinzena)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Salários — Mensal Líquido</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.salariosMensalLiquido)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="border p-2">SUBTOTAL FOLHA FUNCIONÁRIOS</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.subtotalFolha)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Produção (a pagar)</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.producaoAPagar)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Vendas (comissões)</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.vendasComissoes)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Terceiros (folha à parte)</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.terceirosFolha)}
                    </td>
                  </tr>
                  <tr className="bg-gray-200 font-bold text-xs">
                    <td className="border p-2">TOTAL GERAL DO MÊS</td>
                    <td className="border p-2 text-right font-mono">
                      {fmtMoeda(resumo.totalGeralDoMes)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border text-[10px]">
                <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
                  <tr>
                    <th className="border p-2 text-left" colSpan={2}>
                      TRIBUTOS & RETENÇÕES DA COMPETÊNCIA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">INSS Retido (a recolher)</td>
                    <td className="border p-2 text-right font-mono font-bold">
                      {fmtMoeda(resumo.inssRetido)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">IRRF Retido (a recolher)</td>
                    <td className="border p-2 text-right font-mono font-bold">
                      {fmtMoeda(resumo.irrfRetido)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">
                      Salário-família Pago (a deduzir)
                    </td>
                    <td className="border p-2 text-right font-mono font-bold">
                      {fmtMoeda(resumo.salarioFamiliaPago)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-8 text-[11px] text-center">
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span>Responsável pelo Departamento Financeiro / Folha</span>
              </div>
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1"></div>
                <span>Diretoria / Aprovação</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default FolhaPagamento
