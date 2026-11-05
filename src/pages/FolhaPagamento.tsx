import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useToast } from "@/hooks/use-toast"
import { FolhaService } from "@/services/folha"
import { calcularComissaoProgressivaMarginal } from "@/lib/folha-calculos"
import {
  FaixaComissaoProgressiva,
  FolhaCompetencia,
  FolhaPagamentoLinha,
  FolhaTabelaOficial,
} from "@/types/folha"
import {
  LinhaFolhaProcessada,
  TotaisUnidadeCalculados,
  processarLinhaFolha,
  calcularTotaisUnidade,
  normalizarParaBusca,
  formatarMoeda,
} from "./folha/folha-helpers"
import {
  imprimirRelatorioA4,
  imprimirSomaDuasFolhasA4,
} from "./folha/folha-impressao"
import { BarraBuscaFolha, FiltrosBuscaFolha } from "./folha/BarraBuscaFolha"
import {
  FuncionarioCadastroResumo,
  CamposAtualizacaoVendas,
} from "./folha/folha-types"
import { AbaGeral } from "./folha/AbaGeral"
import { AbaQuinzena } from "./folha/AbaQuinzena"
import { AbaMensal } from "./folha/AbaMensal"
import { AbaProducao } from "./folha/AbaProducao"
import { AbaVendas } from "./folha/AbaVendas"
import { BlocoResumo } from "./folha/BlocoResumo"
import { BlocoSomaDuasFolhas } from "./folha/BlocoSomaDuasFolhas"
import { AbaDecimoTerceiro } from "@/components/AbaDecimoTerceiro"
import { ModalEditarLinhaFolha } from "@/components/ModalEditarLinhaFolha"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Calendar,
  Building2,
  Plus,
  RefreshCw,
  Copy,
  DollarSign,
  Users,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react"

export default function FolhaPagamento() {
  const { empresaAtiva, empresas } = useEmpresa()
  const { toast } = useToast()

  // IDs padrão das duas empresas
  const idMonteiro = "11111111-1111-1111-1111-111111111111"
  const idSje = "22222222-2222-2222-2222-222222222222"

  // Competência ativa (mês/ano)
  const [competenciaAtiva, setCompetenciaAtiva] = useState<string>("2026-11")
  const [listaCompetencias, setListaCompetencias] =
    useState<FolhaCompetencia[]>([])

  // Dados brutos da unidade ativa
  const [linhasAtivas, setLinhasAtivas] = useState<FolhaPagamentoLinha[]>([])
  const [tabelaOficial, setTabelaOficial] = useState<FolhaTabelaOficial | null>(
    null,
  )
  const [funcionariosCadastro, setFuncionariosCadastro] =
    useState<FuncionarioCadastroResumo[]>([])
  const [faixasComissao, setFaixasComissao] =
    useState<FaixaComissaoProgressiva[]>([])

  // Dados brutos da outra unidade (para o bloco SOMA DAS DUAS FOLHAS)
  const [linhasOutraUnidade, setLinhasOutraUnidade] =
    useState<FolhaPagamentoLinha[]>([])
  const [tabelaOutraUnidade, setTabelaOutraUnidade] =
    useState<FolhaTabelaOficial | null>(null)
  const [funcsCadastroOutraUnidade, setFuncsCadastroOutraUnidade] =
    useState<FuncionarioCadastroResumo[]>([])

  const [loading, setLoading] = useState(false)
  const [gerandoCompetencia, setGerandoCompetencia] = useState(false)

  // Filtros de busca na tela
  const [filtrosBusca, setFiltrosBusca] = useState<FiltrosBuscaFolha>({
    termo: "",
    tipo: "TODOS",
    situacao: "TODOS",
  })
  const [mostrarOcultosGeral, setMostrarOcultosGeral] = useState(false)

  // Aba ativa (controlada) — usada para esconder os blocos Resumo/Soma na VENDAS
  const [abaAtiva, setAbaAtiva] = useState("geral")

  // Modal de edição de linha
  const [linhaEmEdicao, setLinhaEmEdicao] =
    useState<FolhaPagamentoLinha | null>(null)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)

  // Mês e Ano correntes
  const [ano, mes] = useMemo(() => {
    const partes = competenciaAtiva.split("-")
    return [parseInt(partes[0], 10) || 2026, parseInt(partes[1], 10) || 11]
  }, [competenciaAtiva])

  const isSje = useMemo(() => {
    const nome = (empresaAtiva?.nome || "").toUpperCase()
    return nome.includes("SJE") || nome.includes("EGITO")
  }, [empresaAtiva])

  // Outra unidade ID
  const outraUnidadeId = useMemo(() => {
    if (!empresaAtiva) return idSje
    return empresaAtiva.id === idMonteiro ? idSje : idMonteiro
  }, [empresaAtiva])

  // Mapa completo de dados do cadastro (admissão, demissão, ativo) para a unidade ativa
  const mapaCadastroAtiva = useMemo(() => {
    const mapa = new Map<string, FuncionarioCadastroResumo>()
    funcionariosCadastro.forEach((f) => {
      if (f.id) mapa.set(f.id, f)
      const nomeNorm = normalizarParaBusca(f.nome)
      if (nomeNorm) mapa.set(nomeNorm, f)
    })
    return mapa
  }, [funcionariosCadastro])

  // Mapa completo de dados do cadastro para a outra unidade
  const mapaCadastroOutra = useMemo(() => {
    const mapa = new Map<string, FuncionarioCadastroResumo>()
    funcsCadastroOutraUnidade.forEach((f) => {
      if (f.id) mapa.set(f.id, f)
      const nomeNorm = normalizarParaBusca(f.nome)
      if (nomeNorm) mapa.set(nomeNorm, f)
    })
    return mapa
  }, [funcsCadastroOutraUnidade])

  // Carrega lista de competências disponíveis
  const carregarCompetencias = useCallback(async () => {
    if (!empresaAtiva?.id) return
    try {
      const comps = await FolhaService.getCompetencias(empresaAtiva.id)
      setListaCompetencias(comps)
      if (
        comps.length > 0 &&
        !comps.some((c) => c.competencia === competenciaAtiva)
      ) {
        setCompetenciaAtiva(comps[0].competencia)
      }
    } catch (e) {
      console.error("Erro ao listar competências:", e)
    }
  }, [empresaAtiva?.id, competenciaAtiva])

  // Carrega dados da folha da competência ativa e da outra unidade
  const carregarDadosFolha = useCallback(async () => {
    if (!empresaAtiva?.id) return
    try {
      setLoading(true)

      const [
        linhasAtv,
        tabAtv,
        funcsAtv,
        linhasOutra,
        tabOutra,
        funcsOutra,
        faixas,
      ] = await Promise.all([
        FolhaService.getLinhasCompetencia(
          empresaAtiva.id,
          competenciaAtiva,
        ).catch(() => []),
        FolhaService.getTabelaOficial(empresaAtiva.id, ano).catch(() => null),
        FolhaService.getFuncionariosEmpresa(empresaAtiva.id).catch(() => []),
        FolhaService.getLinhasCompetencia(
          outraUnidadeId,
          competenciaAtiva,
        ).catch(() => []),
        FolhaService.getTabelaOficial(outraUnidadeId, ano).catch(() => null),
        FolhaService.getFuncionariosEmpresa(outraUnidadeId).catch(() => []),
        FolhaService.getFaixasComissao(empresaAtiva.id).catch(() => []),
      ])

      setLinhasAtivas(linhasAtv)
      setTabelaOficial(tabAtv)
      setFuncionariosCadastro(funcsAtv)
      setFaixasComissao(faixas)

      setLinhasOutraUnidade(linhasOutra)
      setTabelaOutraUnidade(tabOutra)
      setFuncsCadastroOutraUnidade(funcsOutra)
    } catch (e) {
      console.error("Erro ao carregar dados da folha:", e)
      toast({
        title: "Erro ao carregar folha",
        description: "Não foi possível carregar os registros da competência.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [empresaAtiva?.id, competenciaAtiva, ano, outraUnidadeId, toast])

  useEffect(() => {
    carregarCompetencias()
  }, [carregarCompetencias])

  useEffect(() => {
    carregarDadosFolha()
  }, [carregarDadosFolha])

  // Processa as linhas da UNIDADE ATIVA (com dados do cadastro para demissão e admissão)
  const linhasProcessadasAtiva = useMemo<LinhaFolhaProcessada[]>(() => {
    return linhasAtivas.map((linha) => {
      const infoCad =
        (linha.funcionario_id && mapaCadastroAtiva.get(linha.funcionario_id)) ||
        mapaCadastroAtiva.get(normalizarParaBusca(linha.nome))
      const fallbackAdmissao = infoCad?.data_admissao || null
      return processarLinhaFolha(
        linha,
        mes,
        ano,
        tabelaOficial,
        fallbackAdmissao,
        infoCad,
      )
    })
  }, [linhasAtivas, mes, ano, tabelaOficial, mapaCadastroAtiva])

  // TOTAIS REAIS DA UNIDADE ATIVA (NUNCA afetados pela busca da tela)
  const totaisUnidadeAtiva = useMemo<TotaisUnidadeCalculados>(() => {
    return calcularTotaisUnidade(linhasProcessadasAtiva)
  }, [linhasProcessadasAtiva])

  // Processa as linhas da OUTRA UNIDADE (para o bloco consolidado)
  const linhasProcessadasOutra = useMemo<LinhaFolhaProcessada[]>(() => {
    return linhasOutraUnidade.map((linha) => {
      const infoCad =
        (linha.funcionario_id && mapaCadastroOutra.get(linha.funcionario_id)) ||
        mapaCadastroOutra.get(normalizarParaBusca(linha.nome))
      const fallbackAdmissao = infoCad?.data_admissao || null
      return processarLinhaFolha(
        linha,
        mes,
        ano,
        tabelaOutraUnidade,
        fallbackAdmissao,
        infoCad,
      )
    })
  }, [linhasOutraUnidade, mes, ano, tabelaOutraUnidade, mapaCadastroOutra])

  const totaisOutraUnidade = useMemo<TotaisUnidadeCalculados>(() => {
    return calcularTotaisUnidade(linhasProcessadasOutra)
  }, [linhasProcessadasOutra])

  // Totais separados de Monteiro e SJE
  const { totaisMonteiro, totaisSje } = useMemo(() => {
    if (empresaAtiva?.id === idMonteiro) {
      return {
        totaisMonteiro: totaisUnidadeAtiva,
        totaisSje: totaisOutraUnidade,
      }
    } else {
      return {
        totaisMonteiro: totaisOutraUnidade,
        totaisSje: totaisUnidadeAtiva,
      }
    }
  }, [empresaAtiva?.id, totaisUnidadeAtiva, totaisOutraUnidade])

  // Totais CONSOLIDADOS (Soma das duas)
  const totaisConsolidado = useMemo<TotaisUnidadeCalculados>(() => {
    return {
      totalColaboradores:
        totaisMonteiro.totalColaboradores + totaisSje.totalColaboradores,
      totalBruto:
        Math.round((totaisMonteiro.totalBruto + totaisSje.totalBruto) * 100) /
        100,
      totalQuinzena:
        Math.round(
          (totaisMonteiro.totalQuinzena + totaisSje.totalQuinzena) * 100,
        ) / 100,
      totalMensalPuro:
        Math.round(
          (totaisMonteiro.totalMensalPuro + totaisSje.totalMensalPuro) * 100,
        ) / 100,
      totalProducao:
        Math.round(
          (totaisMonteiro.totalProducao + totaisSje.totalProducao) * 100,
        ) / 100,
      totalProducaoAPagar:
        Math.round(
          (totaisMonteiro.totalProducaoAPagar + totaisSje.totalProducaoAPagar) *
            100,
        ) / 100,
      totalFerias:
        Math.round((totaisMonteiro.totalFerias + totaisSje.totalFerias) * 100) /
        100,
      totalDecimo:
        Math.round((totaisMonteiro.totalDecimo + totaisSje.totalDecimo) * 100) /
        100,
      totalAdiantamento:
        Math.round(
          (totaisMonteiro.totalAdiantamento + totaisSje.totalAdiantamento) *
            100,
        ) / 100,
      totalLiquido:
        Math.round(
          (totaisMonteiro.totalLiquido + totaisSje.totalLiquido) * 100,
        ) / 100,
      totalInss:
        Math.round((totaisMonteiro.totalInss + totaisSje.totalInss) * 100) /
        100,
      totalIrrf:
        Math.round((totaisMonteiro.totalIrrf + totaisSje.totalIrrf) * 100) /
        100,
      totalComissaoVendas:
        Math.round(
          (totaisMonteiro.totalComissaoVendas + totaisSje.totalComissaoVendas) *
            100,
        ) / 100,
      totalAjudaCustoVendas:
        Math.round(
          (totaisMonteiro.totalAjudaCustoVendas +
            totaisSje.totalAjudaCustoVendas) *
            100,
        ) / 100,
      totalTerceiros:
        Math.round(
          (totaisMonteiro.totalTerceiros + totaisSje.totalTerceiros) * 100,
        ) / 100,
      totalUnidadeGeral:
        Math.round(
          (totaisMonteiro.totalUnidadeGeral + totaisSje.totalUnidadeGeral) *
            100,
        ) / 100,
    }
  }, [totaisMonteiro, totaisSje])

  // FILTRAGEM VISUAL: afeta SOMENTE as tabelas na tela e linhas de impressão A4, NUNCA os totais da unidade
  // Regra 0.0.420 (revendo 0.0.419): colaborador marcado como OCULTO some da folha
  // (tabelas e impressões A4), mas segue contabilizado como ativo em todos os totais.
  // Pode ser revelado via filtro Situação = 'OCULTOS' ou pelo botão 'Ver Ocultos' (mostrarOcultosGeral).
  const linhasFiltradasVisual = useMemo<LinhaFolhaProcessada[]>(() => {
    const termoNorm = normalizarParaBusca(filtrosBusca.termo)

    return linhasProcessadasAtiva.filter((l) => {
      // Filtro Tipo
      if (filtrosBusca.tipo === "FUNCIONARIO" && l.tipo === "Terceiro")
        return false
      if (filtrosBusca.tipo === "TERCEIRO" && l.tipo !== "Terceiro")
        return false

      // Regra de ocultos: por padrão, se l.oculto === true, fica escondido da tabela/impressão,
      // a menos que o usuário ative 'Ver Ocultos' (mostrarOcultosGeral) ou filtre Situação = OCULTOS.
      if (
        l.oculto &&
        !mostrarOcultosGeral &&
        filtrosBusca.situacao !== "OCULTOS"
      ) {
        return false
      }

      // Filtro Situação
      const ehInativo = Boolean(l.inativo || l.inativoEfetivo)
      if (filtrosBusca.situacao === "ATIVOS" && (ehInativo || l.oculto))
        return false
      if (filtrosBusca.situacao === "OCULTOS" && !l.oculto) return false
      if (filtrosBusca.situacao === "INATIVOS" && !ehInativo) return false

      // Filtro por termo (nome, função, pix, conta, observação)
      if (termoNorm) {
        const textoCompleto = normalizarParaBusca(
          `${l.nome} ${l.funcao} ${l.cargo} ${l.pix} ${l.chave_pix} ${l.conta} ${l.observacao_linha}`,
        )
        if (!textoCompleto.includes(termoNorm)) return false
      }

      return true
    })
  }, [linhasProcessadasAtiva, filtrosBusca, mostrarOcultosGeral])

  // Salvar FÉRIAS inline
  const handleSalvarFeriasInline = async (
    linhaId: string,
    novoValor: number,
  ) => {
    if (!empresaAtiva?.id) return
    try {
      await FolhaService.atualizarCamposProducaoLinha(
        linhaId,
        empresaAtiva.id,
        competenciaAtiva,
        { ferias: novoValor },
      )
      toast({
        title: "Férias atualizadas",
        description: `Valor de férias salvo com sucesso: ${formatarMoeda(novoValor)}`,
      })
      await carregarDadosFolha()
    } catch (e) {
      console.error("Erro ao salvar férias inline:", e)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o valor de férias.",
        variant: "destructive",
      })
    }
  }

  // Atualizar campos de Produção inline
  const handleAtualizarProducaoInline = async (
    linhaId: string,
    campos: Record<string, number>,
  ) => {
    if (!empresaAtiva?.id) return
    try {
      await FolhaService.atualizarCamposProducaoLinha(
        linhaId,
        empresaAtiva.id,
        competenciaAtiva,
        campos,
      )
      toast({
        title: "Produção atualizada",
        description: "Valores operacionais salvos com sucesso.",
      })
      await carregarDadosFolha()
    } catch (e) {
      console.error("Erro ao salvar produção inline:", e)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os campos de produção.",
        variant: "destructive",
      })
    }
  }

  // Atualizar campos de Vendas inline
  const handleAtualizarVendasInline = async (
    linhaId: string,
    campos: CamposAtualizacaoVendas,
  ) => {
    if (!empresaAtiva?.id) return
    try {
      // Ao salvar o VALOR DAS VENDAS, a COMISSÃO é recalculada e gravada junto:
      // - vendedor COM faixas na empresa (ex: Márcio Luan, Monteiro): progressiva marginal
      // - vendedor SEM faixas na empresa (ex: Valdercleiton, SJE): 0,5% (0,005) sobre as vendas
      // - Raimundo (SJE) continua fora do módulo de vendas (comissão zerada)
      // Só recalcula quando o usuário salva o valor das vendas — linhas antigas não mudam sozinhas.
      const camposFinais: CamposAtualizacaoVendas = { ...campos }
      if (camposFinais.vendas_obra !== undefined) {
        const linha = linhasAtivas.find((l) => l.id === linhaId)
        const nomeUpper = (linha?.nome || "").trim().toUpperCase()
        const vendas = Number(camposFinais.vendas_obra || 0)
        if (nomeUpper.includes("RAIMUNDO") || vendas <= 0) {
          camposFinais.comissao = 0
        } else {
          const comissaoFaixas = calcularComissaoProgressivaMarginal(
            vendas,
            faixasComissao,
          )
          camposFinais.comissao =
            comissaoFaixas === null
              ? Math.round(vendas * 0.005 * 100) / 100
              : comissaoFaixas
        }
      }
      await FolhaService.atualizarCamposVendasLinha(
        linhaId,
        empresaAtiva.id,
        competenciaAtiva,
        camposFinais,
      )
      toast({
        title: "Vendas atualizadas",
        description: "Valores de vendas e comissões salvos com sucesso.",
      })
      await carregarDadosFolha()
    } catch (e) {
      console.error("Erro ao salvar vendas inline:", e)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os campos de vendas.",
        variant: "destructive",
      })
    }
  }

  // Excluir linha
  const handleExcluirLinha = async (linha: LinhaFolhaProcessada) => {
    if (!empresaAtiva?.id) return
    if (!confirm(`Deseja realmente remover ${linha.nome} desta competência?`))
      return
    try {
      await FolhaService.excluirLinha(
        linha.id,
        empresaAtiva.id,
        competenciaAtiva,
      )
      toast({
        title: "Colaborador removido",
        description: `${linha.nome} foi excluído da competência ${competenciaAtiva}.`,
      })
      await carregarDadosFolha()
    } catch (e) {
      console.error("Erro ao excluir linha:", e)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover a linha da folha.",
        variant: "destructive",
      })
    }
  }

  // Gerar nova competência
  const handleGerarNovaCompetencia = async () => {
    if (!empresaAtiva?.id) return
    const proximaComp = prompt(
      "Digite a competência a ser gerada (formato AAAA-MM):",
      "2026-12",
    )
    if (!proximaComp || !/^\d{4}-\d{2}$/.test(proximaComp)) return

    try {
      setGerandoCompetencia(true)
      await FolhaService.lancarLinhasCompetencia(
        empresaAtiva.id,
        proximaComp,
        competenciaAtiva,
      )
      toast({
        title: "Competência gerada!",
        description: `Competência ${proximaComp} criada com sucesso a partir de ${competenciaAtiva}.`,
      })
      await carregarCompetencias()
      setCompetenciaAtiva(proximaComp)
    } catch (e: any) {
      console.error("Erro ao gerar competência:", e)
      toast({
        title: "Erro ao gerar",
        description: e.message || "Não foi possível gerar a competência.",
        variant: "destructive",
      })
    } finally {
      setGerandoCompetencia(false)
    }
  }

  // Impressões A4
  const imprimirA4AbaGeral = () => {
    const somaImpressaLiquido = linhasFiltradasVisual.reduce(
      (acc, l) => acc + (Number(l.liquidoTotal) || 0),
      0,
    )
    const difOcultos =
      Math.round(
        (totaisUnidadeAtiva.totalLiquido - somaImpressaLiquido) * 100,
      ) / 100
    const linhaInformativa =
      difOcultos > 0.01
        ? `* Nota: O total oficial inclui colaboradores ocultos contabilizados como ativos (Inclui ocultos: ${formatarMoeda(difOcultos)}).`
        : undefined

    imprimirRelatorioA4({
      titulo: "FOLHA GERAL DE PAGAMENTO",
      empresaNome: empresaAtiva?.nome || "GC MIX",
      competencia: competenciaAtiva,
      colunas: [
        "Nº",
        "NOME",
        "FUNÇÃO",
        "SAL. BRUTO",
        "INSS",
        "IRRF",
        "QUINZENA",
        "MENSAL",
        "PRODUÇÃO",
        "FÉRIAS",
        "13º SAL.",
        "ADIANT.",
        "LÍQUIDO TOTAL",
        "ASSINATURA",
      ],
      linhas: linhasFiltradasVisual.map((l, i) => [
        i + 1,
        l.nome,
        l.funcao || "Geral",
        formatarMoeda(l.bruto),
        formatarMoeda(l.inssCalculado),
        formatarMoeda(l.irrfCalculado),
        formatarMoeda(l.quinzenaCalculada),
        formatarMoeda(l.mensalPuro),
        formatarMoeda(l.producaoTotal),
        formatarMoeda(l.feriasEfetivo),
        formatarMoeda(l.decimoEfetivo),
        formatarMoeda(l.adiantamentoEfetivo),
        formatarMoeda(l.liquidoTotal),
        "",
      ]),
      totais: [
        "",
        "TOTAIS",
        "",
        formatarMoeda(totaisUnidadeAtiva.totalBruto),
        formatarMoeda(totaisUnidadeAtiva.totalInss),
        formatarMoeda(totaisUnidadeAtiva.totalIrrf),
        formatarMoeda(totaisUnidadeAtiva.totalQuinzena),
        formatarMoeda(totaisUnidadeAtiva.totalMensalPuro),
        formatarMoeda(totaisUnidadeAtiva.totalProducao),
        formatarMoeda(totaisUnidadeAtiva.totalFerias),
        formatarMoeda(totaisUnidadeAtiva.totalDecimo),
        formatarMoeda(totaisUnidadeAtiva.totalAdiantamento),
        formatarMoeda(totaisUnidadeAtiva.totalLiquido),
        "",
      ],
      linhaInformativa,
    })
  }

  const imprimirA4Quinzena = () => {
    const somaImpressaQuinzena = linhasFiltradasVisual.reduce(
      (acc, l) => acc + (Number(l.quinzenaCalculada) || 0),
      0,
    )
    const difOcultos =
      Math.round(
        (totaisUnidadeAtiva.totalQuinzena - somaImpressaQuinzena) * 100,
      ) / 100
    const linhaInformativa =
      difOcultos > 0.01
        ? `* Nota: O total oficial inclui colaboradores ocultos contabilizados como ativos (Inclui ocultos: ${formatarMoeda(difOcultos)}).`
        : undefined

    imprimirRelatorioA4({
      titulo: "FOLHA DE ADIANTAMENTO QUINZENAL (40%)",
      empresaNome: empresaAtiva?.nome || "GC MIX",
      competencia: competenciaAtiva,
      colunas: ["Nº", "NOME", "A PAGAR", "PIX / CONTA", "ASSINATURA"],
      linhas: linhasFiltradasVisual.map((l, i) => [
        i + 1,
        l.nome,
        formatarMoeda(l.quinzenaCalculada),
        l.pix || l.chave_pix || l.conta || "—",
        "",
      ]),
      totais: [
        "",
        "TOTAIS",
        formatarMoeda(totaisUnidadeAtiva.totalQuinzena),
        "",
        "",
      ],
      linhaInformativa,
      mostrarAssinaturas: true,
      larguraAssinatura: 150,
    })
  }

  const imprimirA4Mensal = () => {
    const somaImpressaMensal = linhasFiltradasVisual.reduce(
      (acc, l) => acc + (Number(l.mensalPuro) || 0),
      0,
    )
    const difOcultos =
      Math.round(
        (totaisUnidadeAtiva.totalMensalPuro - somaImpressaMensal) * 100,
      ) / 100
    const linhaInformativa =
      difOcultos > 0.01
        ? `* Nota: O total oficial inclui colaboradores ocultos contabilizados como ativos (Inclui ocultos: ${formatarMoeda(difOcultos)}).`
        : undefined

    imprimirRelatorioA4({
      titulo: "FOLHA MENSAL LÍQUIDA (SEM PRODUÇÃO)",
      empresaNome: empresaAtiva?.nome || "GC MIX",
      competencia: competenciaAtiva,
      colunas: [
        "Nº",
        "NOME",
        "INSS",
        "IRRF",
        "QUINZENA",
        "MENSAL LÍQUIDO",
        "ASSINATURA",
      ],
      larguraAssinatura: 150,
      linhas: linhasFiltradasVisual.map((l, i) => [
        i + 1,
        l.nome,
        formatarMoeda(l.inssCalculado),
        formatarMoeda(l.irrfCalculado),
        formatarMoeda(l.quinzenaCalculada),
        formatarMoeda(l.mensalPuro),
        "",
      ]),
      totais: [
        "",
        "TOTAIS",
        formatarMoeda(totaisUnidadeAtiva.totalInss),
        formatarMoeda(totaisUnidadeAtiva.totalIrrf),
        formatarMoeda(totaisUnidadeAtiva.totalQuinzena),
        formatarMoeda(totaisUnidadeAtiva.totalMensalPuro),
        "",
      ],
      linhaInformativa,
      mostrarAssinaturas: true,
    })
  }

  const imprimirA4Producao = () => {
    // Papel da PRODUÇÃO sai SOMENTE com funcionários ativos:
    // exclui Terceiros (tipo === "Terceiro", Raimundo Mariano, Márcio Luan) e
    // inativos/demitidos (inativo / inativoEfetivo, ex.: José Pedro).
    // A tabela na TELA continua mostrando tudo como está (linhasFiltradasVisual).
    const linhasProducaoImpressas = linhasFiltradasVisual.filter(
      (l) =>
        l.tipo !== "Terceiro" &&
        l.inativo !== true &&
        l.inativoEfetivo !== true,
    )

    const somaImpressaProducaoAPagar = linhasProducaoImpressas.reduce(
      (acc, l) => acc + (Number(l.producaoAPagar) || 0),
      0,
    )
    const somaImpressaAdiantamento = linhasProducaoImpressas.reduce(
      (acc, l) => acc + (Number(l.quinzena) || 0),
      0,
    )
    const difOcultos =
      Math.round(
        (totaisUnidadeAtiva.totalProducaoAPagar - somaImpressaProducaoAPagar) *
          100,
      ) / 100
    const linhaInformativa =
      difOcultos > 0.01
        ? `* Nota: O total oficial inclui colaboradores ocultos contabilizados como ativos (Inclui ocultos: ${formatarMoeda(difOcultos)}).`
        : undefined

    imprimirRelatorioA4({
      titulo: "FOLHA DE PRODUÇÃO OPERACIONAL",
      empresaNome: empresaAtiva?.nome || "GC MIX",
      competencia: competenciaAtiva,
      colunas: [
        "Nº",
        "NOME",
        "OBRAS",
        "LIMPEZA",
        "SÁBADO",
        "FERIADO",
        "AJUDA",
        "ADIANTAMENTO",
        "A PAGAR (PRODUÇÃO)",
        "ASSINATURA",
      ],
      linhas: linhasProducaoImpressas.map((l, i) => [
        i + 1,
        l.nome,
        String(Number(l.obras) || 0),
        formatarMoeda(l.limpeza),
        formatarMoeda(l.sabado),
        formatarMoeda(l.feriado),
        formatarMoeda(l.ajuda_custo),
        formatarMoeda(l.quinzena),
        formatarMoeda(l.producaoAPagar),
        "",
      ]),
      totais: [
        "",
        "TOTAIS",
        "—",
        "—",
        "—",
        "—",
        "—",
        formatarMoeda(somaImpressaAdiantamento),
        formatarMoeda(totaisUnidadeAtiva.totalProducaoAPagar),
        "",
      ],
      linhaInformativa,
      mostrarAssinaturas: true,
      larguraAssinatura: 150,
    })
  }

  const imprimirA4Vendas = () => {
    const linhasVendas = linhasFiltradasVisual.filter(
      (l) => Number(l.comissao || 0) > 0 || Number(l.vendas_ajuda || 0) > 0,
    )
    const somaImpressaVendas = linhasVendas.reduce(
      (acc, l) =>
        acc +
        (Number(l.comissao || 0) +
          Number(l.vendas_ajuda || l.ajuda_custo || 0)),
      0,
    )
    const totalVendasOficial =
      totaisUnidadeAtiva.totalComissaoVendas +
      totaisUnidadeAtiva.totalAjudaCustoVendas
    const difOcultos =
      Math.round((totalVendasOficial - somaImpressaVendas) * 100) / 100
    const linhaInformativa =
      difOcultos > 0.01
        ? `* Nota: O total oficial inclui colaboradores ocultos contabilizados como ativos (Inclui ocultos: ${formatarMoeda(difOcultos)}).`
        : undefined

    imprimirRelatorioA4({
      titulo: "FOLHA DE VENDAS E COMISSÕES",
      empresaNome: empresaAtiva?.nome || "GC MIX",
      competencia: competenciaAtiva,
      colunas: [
        "Nº",
        "NOME",
        "TIPO",
        "VALOR DAS VENDAS",
        "COMISSÃO",
        "AJUDA CUSTO",
        "TOTAL",
      ],
      linhas: linhasVendas.map((l, i) => [
        i + 1,
        l.nome,
        l.tipo,
        l.vendas_obra || 0,
        formatarMoeda(l.comissao),
        formatarMoeda(l.vendas_ajuda || l.ajuda_custo),
        formatarMoeda(
          Number(l.comissao || 0) +
            Number(l.vendas_ajuda || l.ajuda_custo || 0),
        ),
      ]),
      totais: [
        "",
        "TOTAIS",
        "",
        "",
        formatarMoeda(totaisUnidadeAtiva.totalComissaoVendas),
        formatarMoeda(totaisUnidadeAtiva.totalAjudaCustoVendas),
        formatarMoeda(
          totaisUnidadeAtiva.totalComissaoVendas +
            totaisUnidadeAtiva.totalAjudaCustoVendas,
        ),
      ],
      linhaInformativa,
      mostrarAssinaturas: true,
      assinaturaVendedor: true,
    })
  }

  const imprimirA4SomaDuas = () => {
    imprimirSomaDuasFolhasA4({
      competencia: competenciaAtiva,
      empresaAtivaNome: empresaAtiva?.nome || "GC MIX",
      totaisMonteiro,
      totaisSje,
      totaisConsolidado,
    })
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-lg border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Folha de Pagamento
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {empresaAtiva?.nome || "Unidade Ativa"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Gestão operacional da folha, comissões, férias e 13º salário com
            consolidação Monteiro + SJE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Competência */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-md border">
            <Calendar className="h-4 w-4 text-muted-foreground ml-1.5" />
            <Select
              value={competenciaAtiva}
              onValueChange={(val) => setCompetenciaAtiva(val)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold w-[130px] border-none bg-transparent">
                <SelectValue placeholder="Competência" />
              </SelectTrigger>
              <SelectContent>
                {listaCompetencias.map((comp) => (
                  <SelectItem
                    key={comp.id || comp.competencia}
                    value={comp.competencia}
                    className="text-xs font-medium"
                  >
                    {comp.competencia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={carregarDadosFolha}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
            title="Recarregar dados do banco"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Recarregar
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={handleGerarNovaCompetencia}
            disabled={gerandoCompetencia}
            className="h-8 text-xs gap-1.5"
            title="Copiar colaboradores e gerar nova competência"
          >
            <Copy className="h-3.5 w-3.5" />
            Gerar Competência
          </Button>
        </div>
      </div>

      {/* BARRA DE BUSCA AVANÇADA (filtra SOMENTE as tabelas visuais) */}
      <BarraBuscaFolha
        filtros={filtrosBusca}
        onAlterarFiltros={setFiltrosBusca}
        totalEncontrados={linhasFiltradasVisual.length}
        totalGeral={linhasProcessadasAtiva.length}
        mostrarOcultosGeral={mostrarOcultosGeral}
        onToggleMostrarOcultosGeral={() =>
          setMostrarOcultosGeral((prev) => !prev)
        }
      />

      {/* ABAS DA FOLHA */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1 bg-muted/60">
          <TabsTrigger value="geral" className="text-xs py-1.5 font-semibold">
            GERAL
          </TabsTrigger>
          <TabsTrigger
            value="quinzena"
            className="text-xs py-1.5 font-semibold"
          >
            QUINZENA
          </TabsTrigger>
          <TabsTrigger value="mensal" className="text-xs py-1.5 font-semibold">
            MENSAL
          </TabsTrigger>
          <TabsTrigger
            value="producao"
            className="text-xs py-1.5 font-semibold"
          >
            PRODUÇÃO
          </TabsTrigger>
          <TabsTrigger value="vendas" className="text-xs py-1.5 font-semibold">
            VENDAS
          </TabsTrigger>
          <TabsTrigger value="decimo" className="text-xs py-1.5 font-semibold">
            13º SALÁRIO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <AbaGeral
            linhas={linhasFiltradasVisual}
            totais={totaisUnidadeAtiva}
            mes={mes}
            ano={ano}
            faixasComissao={faixasComissao}
            empresaNome={empresaAtiva?.nome || "GC MIX"}
            competencia={competenciaAtiva}
            onSalvarFeriasInline={handleSalvarFeriasInline}
            onEditarLinha={(linha) => {
              setLinhaEmEdicao(linha)
              setModalEditarAberto(true)
            }}
            onExcluirLinha={handleExcluirLinha}
            onImprimirA4={imprimirA4AbaGeral}
          />
        </TabsContent>

        <TabsContent value="quinzena">
          <AbaQuinzena
            linhas={linhasFiltradasVisual}
            totais={totaisUnidadeAtiva}
            onImprimirA4={imprimirA4Quinzena}
          />
        </TabsContent>

        <TabsContent value="mensal">
          <AbaMensal
            linhas={linhasFiltradasVisual}
            totais={totaisUnidadeAtiva}
            onImprimirA4={imprimirA4Mensal}
          />
        </TabsContent>

        <TabsContent value="producao">
          <AbaProducao
            linhas={linhasFiltradasVisual}
            totais={totaisUnidadeAtiva}
            onAtualizarCamposInline={handleAtualizarProducaoInline}
            onImprimirA4={imprimirA4Producao}
          />
        </TabsContent>

        <TabsContent value="vendas">
          <AbaVendas
            linhas={linhasFiltradasVisual}
            totais={totaisUnidadeAtiva}
            faixasComissao={faixasComissao}
            onAtualizarCamposVendasInline={handleAtualizarVendasInline}
            onImprimirA4={imprimirA4Vendas}
          />
        </TabsContent>

        <TabsContent value="decimo">
          <AbaDecimoTerceiro
            ano={ano}
            empresaNome={empresaAtiva?.nome || "GC MIX"}
            funcionarios={linhasFiltradasVisual
              .filter(
                (l) => l.tipo !== "Terceiro" && !l.inativo && !l.inativoEfetivo,
              )
              .map((l) => ({
                id: l.id,
                nome: l.nome,
                funcao: l.funcao,
                cargo: l.cargo,
                unidade: l.unidade,
                data_admissao: l.dataAdmissaoEfetiva || null,
                bruto: Number(l.bruto || 0),
                conta: l.conta || "",
                pix: l.pix || "",
                oculto: l.oculto,
                inativo: l.inativo || l.inativoEfetivo,
              }))}
            tabelaOficial={tabelaOficial}
            mostrarOcultos={true}
            busca={filtrosBusca.termo}
            onImprimirA4={() => {
              imprimirRelatorioA4({
                titulo: `FOLHA DO 13º SALÁRIO — EXERCÍCIO ${ano}`,
                empresaNome: empresaAtiva?.nome || "GC MIX",
                competencia: competenciaAtiva,
                colunas: [
                  "Nº",
                  "NOME",
                  "FUNÇÃO",
                  "ADMISSÃO",
                  "MESES (AVOS)",
                  "BRUTO 13º",
                  "1ª PARCELA",
                  "BRUTO 2ª PARC",
                  "INSS",
                  "IRRF",
                  "LÍQ 2ª PARC",
                  "TOTAL LÍQUIDO",
                ],
                linhas: linhasFiltradasVisual
                  .filter(
                    (l) =>
                      l.tipo !== "Terceiro" && !l.inativo && !l.inativoEfetivo,
                  )
                  .map((l, i) => [
                    i + 1,
                    l.nome,
                    l.funcao || "Geral",
                    l.dataAdmissaoEfetiva || "—",
                    l.decimoCalculadoObj?.meses || 12,
                    formatarMoeda(l.decimoCalculadoObj?.bruto13 || 0),
                    formatarMoeda(l.decimoCalculadoObj?.primeiraParcela || 0),
                    formatarMoeda(
                      l.decimoCalculadoObj?.brutoSegundaParcela || 0,
                    ),
                    formatarMoeda(
                      l.decimoCalculadoObj?.inssSegundaParcela || 0,
                    ),
                    formatarMoeda(
                      l.decimoCalculadoObj?.irrfSegundaParcela || 0,
                    ),
                    formatarMoeda(
                      l.decimoCalculadoObj?.liquidoSegundaParcela || 0,
                    ),
                    formatarMoeda(
                      (l.decimoCalculadoObj?.primeiraParcela || 0) +
                        (l.decimoCalculadoObj?.liquidoSegundaParcela || 0),
                    ),
                  ]),
              })
            }}
          />
        </TabsContent>
      </Tabs>

      {/* BLOCO RESUMO DA UNIDADE — só na aba GERAL */}
      {abaAtiva === "geral" && (
        <BlocoResumo
          empresaNome={empresaAtiva?.nome || "GC MIX"}
          competencia={competenciaAtiva}
          totais={totaisUnidadeAtiva}
          mes={mes}
          onImprimirA4={() => {
            imprimirRelatorioA4({
              titulo: "RESUMO OFICIAL DA UNIDADE",
              empresaNome: empresaAtiva?.nome || "GC MIX",
              competencia: competenciaAtiva,
              colunas: ["ITEM DISCRIMINADO", "VALOR (R$)"],
              linhas: [
                [
                  "Quinzena (Adiantamento Salarial)",
                  formatarMoeda(totaisUnidadeAtiva.totalQuinzena),
                ],
                [
                  "Mensal Líquido (Puro sem produção)",
                  formatarMoeda(totaisUnidadeAtiva.totalMensalPuro),
                ],
                [
                  "Produção a Pagar",
                  formatarMoeda(totaisUnidadeAtiva.totalProducaoAPagar),
                ],
                [
                  "Férias (Linha própria)",
                  formatarMoeda(totaisUnidadeAtiva.totalFerias),
                ],
                ...(mes === 11 || mes === 12
                  ? [
                      [
                        "13º Salário",
                        formatarMoeda(totaisUnidadeAtiva.totalDecimo),
                      ],
                    ]
                  : []),
                [
                  "Comissões de Vendas",
                  formatarMoeda(totaisUnidadeAtiva.totalComissaoVendas),
                ],
                [
                  "Ajuda de Custo Vendedores",
                  formatarMoeda(totaisUnidadeAtiva.totalAjudaCustoVendas),
                ],
                [
                  "Terceiros (Informativo)",
                  formatarMoeda(totaisUnidadeAtiva.totalTerceiros),
                ],
              ],
              totais: [
                "TOTAL DA UNIDADE",
                formatarMoeda(totaisUnidadeAtiva.totalUnidadeGeral),
              ],
            })
          }}
        />
      )}

      {/* BLOCO SOMA DAS DUAS FOLHAS (MONTEIRO + SJE) — só na aba GERAL */}
      {abaAtiva === "geral" && (
        <BlocoSomaDuasFolhas
          competencia={competenciaAtiva}
          totaisMonteiro={totaisMonteiro}
          totaisSje={totaisSje}
          totaisConsolidado={totaisConsolidado}
          onImprimirA4={imprimirA4SomaDuas}
        />
      )}

      {/* MODAL EDITAR LINHA FOLHA COMPLETO */}
      {modalEditarAberto && linhaEmEdicao && (
        <ModalEditarLinhaFolha
          open={modalEditarAberto}
          onOpenChange={(aberto) => {
            setModalEditarAberto(aberto)
            if (!aberto) setLinhaEmEdicao(null)
          }}
          linha={linhaEmEdicao}
          empresaId={empresaAtiva?.id || ""}
          competencia={competenciaAtiva}
          ano={ano}
          tabelaOficial={tabelaOficial}
          onSalvo={async () => {
            toast({
              title: "Linha atualizada",
              description: "Dados do colaborador salvos com sucesso.",
            })
            await carregarDadosFolha()
          }}
        />
      )}
    </div>
  )
}
