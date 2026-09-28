import { useState, useMemo, useEffect, useRef } from "react"
import {
  Briefcase,
  Search,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { useToast } from "@/hooks/use-toast"
import { FolhaService, SalvarLinhaFolhaPayload } from "@/services/folha"
import {
  FolhaPagamentoLinha,
  FolhaCompetencia,
  FolhaTabelaOficial,
} from "@/types/folha"
import {
  calcularInssProgressivo,
  calcularSalarioFamilia,
  calcularIrrf,
  calcularQuinzena,
  calcularMensalGeral,
  calcularProducaoTotal,
  calcularAPagarProducao,
  calcularComissaoVendas,
} from "@/lib/folha-calculos"
import { LOGO_GC_MIX_HORIZONTAL } from "@/assets/logos"
import { AbaTabelasOficiais } from "@/components/AbaTabelasOficiais"
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
  const [carregando, setCarregando] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<string>("geral")

  // Cabeçalho editável da competência
  const [dataCompetencia, setDataCompetencia] = useState<string>("15/09/2026")
  const [percentualQuinzena, setPercentualQuinzena] = useState<number>(0.4)
  const [salvandoConfigComp, setSalvandoConfigComp] = useState(false)

  // Filtros
  const [busca, setBusca] = useState("")
  const [mostrarOcultos, setMostrarOcultos] = useState(false)

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
    useState<"quinzena" | "mensal" | "producao" | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

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

  // 2. Carregar tabelas oficiais (2026) da empresa
  useEffect(() => {
    async function carregarTabela() {
      if (!empresaAtiva?.id) return
      try {
        const tab = await FolhaService.getTabelaOficial(empresaAtiva.id, 2026)
        setTabelaOficial(tab)
      } catch (err) {
        console.warn("Erro ao carregar tabela oficial:", err)
      }
    }
    carregarTabela()
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
        const obsOk = (l.observacao_linha || l.observacoes || "")
          .toLowerCase()
          .includes(termo)
        const pixOk = (l.pix || l.chave_pix || "").toLowerCase().includes(termo)
        if (!nomeOk && !obsOk && !pixOk) return false
      }
      return true
    })
  }, [terceirosLinhas, mostrarOcultos, busca])

  // CÁLCULOS DINÂMICOS PARA CADA FUNCIONÁRIO (seguindo as regras da planilha modelo)
  // Se houver tabela oficial, calcula os valores recomendados; senão, mantém null ou digitado
  interface LinhaGeralProcessada extends FolhaPagamentoLinha {
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
    isInssSobrescrito: boolean
    isFamiliaSobrescrito: boolean
    isIrrfSobrescrito: boolean
    isQuinzenaSobrescrita: boolean
    isMensalSobrescrito: boolean
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

      // Valores finais: se digitado pelo usuário ou se tabela não disponível
      const inssFinal = Number(l.inss ?? inssCalc ?? 0)
      const familiaFinal = Number(l.familia ?? familiaCalc ?? 0)
      const irrfFinal = Number(l.ir ?? irrfCalc ?? 0)
      const quinzenaFinal = Number(l.quinzena ?? quinzenaCalc)

      const mensalCalc = calcularMensalGeral(
        bruto,
        inssFinal,
        familiaFinal,
        irrfFinal,
        quinzenaFinal,
      )
      const mensalFinal = Number(l.mensal_liquido ?? mensalCalc)

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
        isInssSobrescrito,
        isFamiliaSobrescrito,
        isIrrfSobrescrito,
        isQuinzenaSobrescrita,
        isMensalSobrescrito,
      }
    })
  }, [funcionariosFiltrados, tabelaOficial, percentualQuinzena])

  // Processamento de Terceiros (Folha à parte: sem desconto, quinzena 40%, mensal 60%)
  const terceirosProcessados = useMemo(() => {
    return terceirosFiltrados.map((t) => {
      const valorMes = Number(t.bruto || 0)
      const quinzena = Math.round(valorMes * percentualQuinzena * 100) / 100
      const mensal = Math.round((valorMes - quinzena) * 100) / 100
      return {
        ...t,
        valorMes,
        quinzena,
        mensal,
      }
    })
  }, [terceirosFiltrados, percentualQuinzena])

  // Linhas da Aba PRODUÇÃO
  const linhasProducao = useMemo(() => {
    return funcionariosFiltrados.map((l) => {
      const producaoTotal = calcularProducaoTotal(l)
      const aPagar = calcularAPagarProducao(l)
      return {
        ...l,
        producaoTotal,
        aPagar,
      }
    })
  }, [funcionariosFiltrados])

  // Linhas da Aba VENDAS
  const linhasVendas = useMemo(() => {
    // Exibe vendedores da folha (funcionários e terceiros que possuem volume de vendas ou cargo de VENDEDOR)
    const candidatos = linhas.filter(
      (l) =>
        l.vendas_obra > 0 ||
        l.comissao > 0 ||
        (l.funcao && l.funcao.toUpperCase().includes("VENDEDOR")) ||
        (l.cargo && l.cargo.toUpperCase().includes("VENDEDOR")),
    )
    return candidatos.map((l) => {
      const comissaoAuto = calcularComissaoVendas(l.vendas_obra || 0)
      const isComissaoSobrescrita =
        l.modo_calculo === "Digitado" ||
        (l.vendas_obra > 0 &&
          Math.abs(Number(l.comissao || 0) - comissaoAuto) > 0.05)
      const comissaoFinal = Number(l.comissao || comissaoAuto)
      return {
        ...l,
        comissaoAuto,
        comissaoFinal,
        isComissaoSobrescrita,
      }
    })
  }, [linhas])

  // TOTAIS DA ABA GERAL (FUNCIONÁRIOS)
  const totaisGeral = useMemo(() => {
    return linhasGeralProcessadas.reduce(
      (acc, l) => {
        acc.bruto += Number(l.bruto || 0)
        acc.filhos += Number(l.filhos || 0)
        acc.inss += l.inssFinal
        acc.familia += l.familiaFinal
        acc.irrf += l.irrfFinal
        acc.quinzena += l.quinzenaFinal
        acc.mensal += l.mensalFinal
        return acc
      },
      {
        bruto: 0,
        filhos: 0,
        inss: 0,
        familia: 0,
        irrf: 0,
        quinzena: 0,
        mensal: 0,
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

  // TOTAIS VENDAS
  const totaisVendas = useMemo(() => {
    return linhasVendas.reduce(
      (acc, l) => {
        acc.vendas_obra += Number(l.vendas_obra || 0)
        acc.comissao += l.comissaoFinal
        return acc
      },
      { vendas_obra: 0, comissao: 0 },
    )
  }, [linhasVendas])

  // RESUMO GERAL CONSOLIDADO (Aba 6)
  const resumo = useMemo(() => {
    const pessoasNaFolha = linhasGeralProcessadas.length
    const salariosQuinzena = totaisGeral.quinzena
    const salariosMensalLiquido = totaisGeral.mensal
    const subtotalFolha = salariosQuinzena + salariosMensalLiquido
    const producaoAPagar = totaisProducao.aPagar
    const vendasComissoes = totaisVendas.comissao
    const terceirosFolha = totaisTerceiros.valorMes
    const inssRetido = totaisGeral.inss
    const irrfRetido = totaisGeral.irrf
    const salarioFamiliaPago = totaisGeral.familia

    const totalGeralDoMes =
      subtotalFolha + producaoAPagar + vendasComissoes + terceirosFolha

    return {
      pessoasNaFolha,
      salariosQuinzena,
      salariosMensalLiquido,
      subtotalFolha,
      producaoAPagar,
      vendasComissoes,
      terceirosFolha,
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
    linhasGeralProcessadas.length,
  ])

  // Abrir Modal de Edição / Criação
  const abrirModalEdicao = (
    linha?: FolhaPagamentoLinha,
    tipoForcado?: "Funcionario" | "Terceiro",
  ) => {
    if (linha) {
      setLinhaEmEdicao({ ...linha })
      setInssManual(Boolean(linha.inss && linha.inss > 0))
      setFamiliaManual(Boolean(linha.familia && linha.familia > 0))
      setIrManual(Boolean(linha.ir && linha.ir > 0))
      setQuinzenaManual(Boolean(linha.quinzena && linha.quinzena > 0))
      setMensalManual(Boolean(linha.mensal_liquido && linha.mensal_liquido > 0))
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
        updated.comissao = calcularComissaoVendas(Number(valor || 0))
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
        updated.mensal_liquido = calcularMensalGeral(
          bruto,
          inss,
          familia,
          irrf,
          quinzena,
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
        feriado: Number(linhaEmEdicao.feriado || 0),
        ferias: Number(linhaEmEdicao.ferias || 0),
        ajuda_custo: Number(linhaEmEdicao.ajuda_custo || 0),
        vendas_obra: Number(linhaEmEdicao.vendas_obra || 0),
        comissao: Number(linhaEmEdicao.comissao || 0),
        vendas_ajuda: Number(linhaEmEdicao.vendas_ajuda || 0),
        mensal_liquido: Number(linhaEmEdicao.mensal_liquido || 0),
        salario_liquido: Number(linhaEmEdicao.mensal_liquido || 0),
        conta: linhaEmEdicao.conta || "",
        pix: linhaEmEdicao.pix || "",
        chave_pix: linhaEmEdicao.pix || "",
        observacao_linha: linhaEmEdicao.observacao_linha || null,
        modo_calculo: comissaoManual ? "Digitado" : "Calculado",
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
  const imprimirAbaA4 = (tipo: "quinzena" | "mensal" | "producao") => {
    setTipoImpressaoA4(tipo)
    setTimeout(() => {
      window.print()
    }, 150)
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
            className="ml-2 gap-1.5"
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
            {isAdministrador && (
              <TabsTrigger
                value="tabelas"
                className="gap-2 font-semibold text-amber-600"
              >
                <TableIcon className="h-4 w-4" />
                TABELAS (ADMIN)
              </TabsTrigger>
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
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => abrirModalEdicao()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Funcionário
                  </Button>
                </div>
              </div>

              {/* LEGENDA IDÊNTICA AO EXCEL */}
              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded text-amber-900 dark:text-amber-200">
                <span className="font-bold">🟡 AMARELO = você digita</span>
                <span>·</span>
                <span className="font-bold">⚪ CINZA = calculado sozinho</span>
                <span>(não mexa; só sobrescreva num caso especial)</span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* TABELA DE FUNCIONÁRIOS GERAL */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">Nº</th>
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                        NOME
                      </th>
                      <th className="py-2.5 px-2">FUNÇÃO</th>
                      <th className="py-2.5 px-2 text-right bg-amber-100/50 dark:bg-amber-950/20 font-bold text-amber-900 dark:text-amber-200">
                        TOTAL BRUTO
                      </th>
                      <th className="py-2.5 px-2 text-center bg-amber-100/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                        FILHOS (ATÉ 14)
                      </th>
                      <th className="py-2.5 px-2 text-right">INSS</th>
                      <th className="py-2.5 px-2 text-right">FAMÍLIA</th>
                      <th className="py-2.5 px-2 text-right">IRRF</th>
                      <th className="py-2.5 px-2 text-right font-semibold text-blue-600">
                        QUINZENA ({Math.round(percentualQuinzena * 100)}%)
                      </th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary bg-primary/5">
                        MENSAL (LÍQUIDO)
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
                          colSpan={14}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {carregando
                            ? "Carregando folha..."
                            : "Nenhum funcionário cadastrado nesta competência."}
                        </td>
                      </tr>
                    ) : (
                      linhasGeralProcessadas.map((l, index) => (
                        <tr
                          key={l.id}
                          className={`hover:bg-muted/40 transition-colors ${
                            l.oculto ? "bg-amber-500/5 opacity-80" : ""
                          }`}
                        >
                          <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                            {index + 1}
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

                          {/* INSS com badge Calculado / Digitado */}
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <span>{fmtMoeda(l.inssFinal)}</span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1 py-0 h-3.5 ${
                                  l.isInssSobrescrito
                                    ? "border-amber-400 text-amber-700 bg-amber-50"
                                    : "border-muted text-muted-foreground"
                                }`}
                              >
                                {l.isInssSobrescrito ? "Digitado" : "Calculado"}
                              </Badge>
                            </div>
                          </td>

                          {/* FAMÍLIA */}
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <span>
                                {l.familiaFinal > 0
                                  ? fmtMoeda(l.familiaFinal)
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
                          <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <span>
                                {l.irrfFinal > 0 ? fmtMoeda(l.irrfFinal) : "-"}
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

                          {/* QUINZENA */}
                          <td className="py-2 px-2 text-right font-mono text-blue-600 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <span>{fmtMoeda(l.quinzenaFinal)}</span>
                              {l.isQuinzenaSobrescrita && (
                                <Badge
                                  variant="outline"
                                  className="text-[8px] px-1 py-0 h-3.5 border-amber-400 text-amber-700 bg-amber-50"
                                >
                                  Digitado
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* MENSAL (LÍQUIDO) */}
                          <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <span>{fmtMoeda(l.mensalFinal)}</span>
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
                            {l.observacao_linha || l.observacoes || "-"}
                          </td>

                          <td className="py-2 px-2 text-center whitespace-nowrap print:hidden">
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
                      ))
                    )}
                  </tbody>

                  {/* TOTAL RODAPÉ FUNCIONÁRIOS */}
                  <tfoot className="bg-muted font-bold text-foreground border-t-2 border-border">
                    <tr>
                      <td className="py-2.5 px-2 text-center">-</td>
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
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.inss)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.familia)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.irrf)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">
                        {fmtMoeda(totaisGeral.quinzena)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-primary bg-primary/10">
                        {fmtMoeda(totaisGeral.mensal)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={4}></td>
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
                              {t.observacao_linha ||
                                t.obs ||
                                t.observacoes ||
                                "-"}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 2: QUINZENA (FOLHA DE PAGAMENTO DA QUINZENA + IMPRESSÃO A4)
        ========================================================================== */}
        <TabsContent value="quinzena" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Folha de Pagamento — Quinzena
                </CardTitle>
                <CardDescription className="text-xs">
                  Valores adiantados da 1ª quinzena (
                  {Math.round(percentualQuinzena * 100)}% do bruto) para a
                  competência {rotuloCompetenciaMesAno}.
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
                      <th className="py-2.5 px-2 text-right">TOTAL BRUTO</th>
                      <th className="py-2.5 px-2 text-right font-bold text-blue-600">
                        QUINZENA
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
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(l.bruto)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-blue-600">
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
                        TOTAL
                      </td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.bruto)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">
                        {fmtMoeda(totaisGeral.quinzena)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

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
                  quinzena quitado.
                </CardDescription>
              </div>
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
                      <th className="py-2.5 px-2 text-right">TOTAL BRUTO</th>
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
                        <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r">
                          {l.nome}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {l.funcao}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {fmtMoeda(l.bruto)}
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
                        <td className="py-2 px-2 text-right font-mono font-bold text-primary bg-primary/5">
                          {fmtMoeda(l.mensalFinal)}
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
                        TOTAL
                      </td>
                      <td className="py-2.5 px-2">-</td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {fmtMoeda(totaisGeral.bruto)}
                      </td>
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
                  </tfoot>
                </table>
              </div>

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
                      <th className="py-2.5 px-2 text-right">LIMP/LUBRIF.</th>
                      <th className="py-2.5 px-2 text-right">SÁBADO</th>
                      <th className="py-2.5 px-2 text-right">FERIADO</th>
                      <th className="py-2.5 px-2 text-right">AJUDA DE CUSTO</th>
                      <th className="py-2.5 px-2 text-right text-red-600">
                        ADIANTAMENTO
                      </th>
                      <th className="py-2.5 px-2 text-right text-emerald-600">
                        GRATIFICAÇÃO
                      </th>
                      <th className="py-2.5 px-2 text-right font-semibold text-foreground">
                        PRODUÇÃO
                      </th>
                      <th className="py-2.5 px-2 text-right font-bold text-primary bg-primary/5">
                        A PAGAR
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
                        <td className="py-2 px-2 text-right font-mono">
                          {l.limpeza > 0 ? fmtMoeda(l.limpeza) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {l.sabado > 0 ? fmtMoeda(l.sabado) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {l.feriado && l.feriado > 0
                            ? fmtMoeda(l.feriado)
                            : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {l.ajuda_custo > 0 ? fmtMoeda(l.ajuda_custo) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-red-600">
                          {l.adiantamento > 0 ? fmtMoeda(l.adiantamento) : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-600">
                          {l.gratificacao > 0 ? fmtMoeda(l.gratificacao) : "-"}
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
                      <td className="py-2.5 px-2 text-right font-mono text-red-600">
                        {fmtMoeda(totaisProducao.adiantamento)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600">
                        {fmtMoeda(totaisProducao.gratificacao)}
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
            ABA 5: VENDAS (COMISSÃO 0,5% × VALOR VENDIDO)
        ========================================================================== */}
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    VENDEDORES DA FOLHA (comissão é pagamento à parte do
                    salário)
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 text-primary font-medium">
                    COMISSÃO = 0,5% DO VALOR VENDIDO (calcula sozinha)
                  </CardDescription>
                </div>
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
                        COMISSÃO
                      </th>
                      <th className="py-2.5 px-3">AGÊNCIA / C/C</th>
                      <th className="py-2.5 px-3">PIX</th>
                      <th className="py-2.5 px-2 text-center print:hidden">
                        AÇÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhasVendas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Nenhum vendedor com obras nesta competência.
                        </td>
                      </tr>
                    ) : (
                      linhasVendas.map((l, index) => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{l.nome}</span>
                              {l.tipo === "Terceiro" && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4 bg-purple-100 text-purple-700"
                                >
                                  Terceiro
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
                        TOTAL VENDAS
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-blue-600">
                        {fmtMoeda(totaisVendas.vendas_obra)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-amber-600">
                        {fmtMoeda(totaisVendas.comissao)}
                      </td>
                      <td className="py-2.5 px-3" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-4 bg-muted/10 border-t text-xs text-muted-foreground">
                <strong>Regra:</strong> COMISSÃO = 0,5% × VALOR VENDIDO (a
                coluna COMISSÃO calcula sozinha).
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 6: RESUMO (CONSOLIDAÇÃO TOTAL AUTOMÁTICA)
        ========================================================================== */}
        <TabsContent value="resumo" className="space-y-4">
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
                    <span className="text-muted-foreground">
                      Vendas (comissões)
                    </span>
                    <span className="font-mono font-medium text-amber-600">
                      {fmtMoeda(resumo.vendasComissoes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4">
                    <span className="text-muted-foreground">
                      Terceiros (folha à parte)
                    </span>
                    <span className="font-mono font-medium text-purple-600">
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
            ABA 7: TABELAS (OFICIAIS — ADMIN)
        ========================================================================== */}
        {isAdministrador && (
          <TabsContent value="tabelas" className="space-y-4">
            <AbaTabelasOficiais
              onTabelaAtualizada={(novaTab) => {
                setTabelaOficial(novaTab)
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

              {/* PRODUÇÃO DE OBRAS */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Produção, Limpeza, Sábado, Feriado e Adiantamentos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-[11px]">Qtd Obras</Label>
                    <Input
                      type="number"
                      value={linhaEmEdicao.obras ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "obras",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Valor/Obra (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.valor_obra ?? 20}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "valor_obra",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Limpeza/Lubrif. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.limpeza ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "limpeza",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Sábado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.sabado ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "sabado",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Feriado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.feriado ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "feriado",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Ajuda de Custo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.ajuda_custo ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "ajuda_custo",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-red-600 font-semibold">
                      Adiantamento (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.adiantamento ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "adiantamento",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono text-red-600"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-emerald-600 font-semibold">
                      Gratificação (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.gratificacao ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "gratificacao",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* VENDAS E COMISSÃO */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                    Vendas & Comissão (0,5%)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setComissaoManual(!comissaoManual)}
                    className="text-[10px] text-primary underline"
                  >
                    {comissaoManual ? "Comissão Manual" : "0,5% Automático"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px]">
                      Valor das Obras Vendidas (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.vendas_obra ?? 0}
                      onChange={(e) =>
                        atualizarCampoEdicao(
                          "vendas_obra",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="mt-1 h-7 text-xs font-mono text-blue-600 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-amber-600 font-semibold">
                      Comissão (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linhaEmEdicao.comissao ?? 0}
                      onChange={(e) => {
                        setComissaoManual(true)
                        atualizarCampoEdicao(
                          "comissao",
                          parseFloat(e.target.value) || 0,
                        )
                      }}
                      className="mt-1 h-7 text-xs font-mono text-amber-600 font-bold"
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
                  : "FOLHA MENSAL"}
            </span>
            <p className="text-[11px] font-semibold mt-1">
              Competência: {rotuloCompetenciaMesAno}
            </p>
          </div>
        </div>

        {tipoImpressaoA4 === "quinzena" && (
          <table className="w-full border-collapse border text-[10px]">
            <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
              <tr>
                <th className="border p-1.5 text-center w-6">Nº</th>
                <th className="border p-1.5 text-left">NOME</th>
                <th className="border p-1.5 text-left">FUNÇÃO</th>
                <th className="border p-1.5 text-right">TOTAL BRUTO</th>
                <th className="border p-1.5 text-right font-bold">QUINZENA</th>
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
                  <td className="border p-1 text-right font-mono">
                    {fmtMoeda(l.bruto)}
                  </td>
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
                <td className="border p-1.5">TOTAL</td>
                <td className="border p-1.5">-</td>
                <td className="border p-1.5 text-right font-mono">
                  {fmtMoeda(totaisGeral.bruto)}
                </td>
                <td className="border p-1.5 text-right font-mono">
                  {fmtMoeda(totaisGeral.quinzena)}
                </td>
                <td className="border p-1.5" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        )}

        {tipoImpressaoA4 === "mensal" && (
          <table className="w-full border-collapse border text-[9px]">
            <thead className="bg-gray-100 text-gray-800 font-bold uppercase">
              <tr>
                <th className="border p-1 text-center w-5">Nº</th>
                <th className="border p-1 text-left">NOME</th>
                <th className="border p-1 text-left">FUNÇÃO</th>
                <th className="border p-1 text-right">TOTAL BRUTO</th>
                <th className="border p-1 text-right">QUINZENA</th>
                <th className="border p-1 text-right">INSS</th>
                <th className="border p-1 text-right">FAMÍLIA</th>
                <th className="border p-1 text-right">IRRF</th>
                <th className="border p-1 text-right font-bold">
                  MENSAL (LÍQUIDO)
                </th>
                <th className="border p-1 text-left">PIX / CONTA</th>
                <th className="border p-1 text-center w-32">ASSINATURA</th>
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
                <td className="border p-1">TOTAL</td>
                <td className="border p-1">-</td>
                <td className="border p-1 text-right font-mono">
                  {fmtMoeda(totaisGeral.bruto)}
                </td>
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
                <th className="border p-1 text-right">ADIANT.</th>
                <th className="border p-1 text-right font-bold">A PAGAR</th>
                <th className="border p-1 text-center w-28">ASSINATURA</th>
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
      </div>
    </div>
  )
}
export default FolhaPagamento
