import { supabase } from "@/lib/supabase/client"
import {
  PainelService,
  ID_EMPRESA_MONTEIRO,
  ID_EMPRESA_SJE,
  ItemEstoqueInsumo,
  ResumoCustosInsumos,
} from "@/services/painel"
import { FolhaService } from "@/services/folha"
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
} from "@/lib/folha-calculos"
import type {
  FolhaPagamentoLinha,
  FolhaTerceiro,
  FolhaTabelaOficial,
  FaixaComissaoProgressiva,
} from "@/types/folha"

export interface DadosProducaoGerencial {
  volumeTotalM3: number
  totalCargas: number
  totalOS: number
  // Comparativo com mês anterior
  mesAnteriorVolumeM3: number
  mesAnteriorCargas: number
  mesAnteriorOS: number
  variacaoVolumePct: number | null // null se mês anterior = 0
  variacaoCargasPct: number | null
}

export interface DadosVendasGerencial {
  totalVendido: number // faturamento de vendas do mês (folha/OS/preço)
  totalComissoes: number
  numeroClientesAtendidos: number
  numeroObrasAtendidas: number
}

export interface DadosFolhaGerencial {
  pessoasNaFolha: number
  salariosQuinzena: number
  salariosMensalLiquido: number
  producaoAPagar: number
  comissoesVendas: number
  totalFolha: number
  // Itens complementares informativos
  terceirosFolha: number
}

export interface RecipienteRelatorioGerencial {
  id: string
  nome: string
  tipo: "silo" | "tanque" | string
  materialCodigo: "cimento" | "aditivo" | string
  materialNome: string
  saldo: number
  estoqueMinimo: number
  unidade: string
  status: "ABAIXO" | "NO_MINIMO" | "OK"
  ordem: number
}

export interface DadosRelatorioGerencialMes {
  competencia: string // ex: "2026-09"
  rotuloCompetencia: string // ex: "SETEMBRO / 2026"
  empresaFiltro: string // "todas" | "monteiro" | "sje" | "caico" | "patos" | uuid
  nomeEmpresaCabecalho: string
  producao: DadosProducaoGerencial
  vendas: DadosVendasGerencial
  folha: DadosFolhaGerencial
  insumos: ResumoCustosInsumos
  estoque: ItemEstoqueInsumo[]
  recipientes?: RecipienteRelatorioGerencial[]
  dataEmissao: string
}

/**
 * Helper para subtrair 1 mês de uma competência "YYYY-MM"
 */
function obterMesAnterior(comp: string): string {
  const [anoStr, mesStr] = comp.split("-")
  let ano = Number(anoStr) || 2026
  let mes = Number(mesStr) || 9
  if (mes === 1) {
    ano -= 1
    mes = 12
  } else {
    mes -= 1
  }
  return `${ano}-${String(mes).padStart(2, "0")}`
}

/**
 * Helper para formatar o nome da empresa/visão
 */
interface EmpresaItem {
  id: string
  nome: string
  slug?: string
}

export function formatarNomeEmpresaVisao(
  empresaFiltro: string,
  empresasCadastradas: EmpresaItem[],
): string {
  if (!empresaFiltro || empresaFiltro === "todas") {
    return "CONSOLIDADO GERAL (TODAS AS UNIDADES)"
  }
  const achada = empresasCadastradas.find(
    (e) =>
      e.id === empresaFiltro ||
      e.slug?.toLowerCase() === empresaFiltro.toLowerCase(),
  )
  if (achada) return achada.nome.toUpperCase()
  if (empresaFiltro === "monteiro" || empresaFiltro === ID_EMPRESA_MONTEIRO) {
    return "UNIDADE MONTEIRO"
  }
  if (empresaFiltro === "sje" || empresaFiltro === ID_EMPRESA_SJE) {
    return "UNIDADE SÃO JOSÉ DO EGITO"
  }
  return "UNIDADE SELECIONADA"
}

/**
 * Calcula o resumo oficial em 4 linhas da aba RESUMO da /folha para uma dada unidade
 * respeitando:
 * - Valdercleiton mensal puro na MENSAL
 * - Márcio Luan só na VENDAS da Monteiro
 * - Raimundo (terceiro SJE) fora da VENDAS, na QUINZENA 40% e MENSAL 60% sem desconto
 * - Na Monteiro não há bloco de terceiros na quinzena
 */
export function calcularResumoFolhaUnidade(params: {
  empresaId: string
  linhas: FolhaPagamentoLinha[]
  terceiros: FolhaTerceiro[]
  tabelaOficial: FolhaTabelaOficial | null
  faixasComissao: FaixaComissaoProgressiva[]
  percentualQuinzena?: number
}): {
  pessoasNaFolha: number
  salariosQuinzena: number
  salariosMensalLiquido: number
  producaoAPagar: number
  comissoesVendas: number
  totalGeral: number
  totalVendasBase: number
  terceirosFolha: number
} {
  const {
    empresaId,
    linhas,
    terceiros,
    tabelaOficial,
    faixasComissao,
    percentualQuinzena = 0.4,
  } = params

  const isMonteiro =
    empresaId === ID_EMPRESA_MONTEIRO ||
    linhas.some((l) => (l.unidade || "").toUpperCase().includes("MONTEIRO"))

  // 1. Processar funcionários
  const funcs = linhas.filter((l) => l.tipo !== "Terceiro")
  let salariosQuinzena = 0
  let salariosMensalLiquido = 0
  let producaoAPagar = 0
  let comissoesVendas = 0
  let totalVendasBase = 0

  funcs.forEach((l) => {
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

    const inssFinal = Number(l.inss ?? inssCalc ?? 0)
    const familiaFinal = Number(l.familia ?? familiaCalc ?? 0)
    const irrfFinal = Number(l.ir ?? irrfCalc ?? 0)
    const quinzenaFinal =
      l.modo_calculo === "Digitado" &&
      l.quinzena !== undefined &&
      l.quinzena !== null &&
      Number(l.quinzena) > 0
        ? Number(l.quinzena)
        : quinzenaCalc

    const isValdercleiton = (l.nome || "")
      .toUpperCase()
      .includes("VALDERCLEITON")

    const gratificacaoTotal = Number(l.gratificacao || 0)
    const producaoCompletaCalc = calcularProducaoTotal(l) + gratificacaoTotal
    const producaoGeralMais = isValdercleiton ? 0 : producaoCompletaCalc

    const aPagarProd = isValdercleiton ? 0 : calcularAPagarProducao(l)

    const quinzena2Final = Number(l.quinzena_2 || 0)
    const mensalFinal = calcularMensalSemProducao(
      bruto,
      inssFinal,
      familiaFinal,
      irrfFinal,
      quinzenaFinal,
      { quinzena_2: quinzena2Final },
    )

    salariosQuinzena += quinzenaFinal
    salariosMensalLiquido += mensalFinal
    producaoAPagar += aPagarProd

    // Vendas e comissões dos funcionários
    const vObra = Number(l.vendas_obra || 0)
    const comissaoAuto = calcularComissaoVendas(vObra)
    const comissaoFinal =
      l.modo_calculo === "Digitado" &&
      l.comissao !== undefined &&
      l.comissao !== null
        ? Number(l.comissao)
        : Number(l.comissao || comissaoAuto)

    totalVendasBase += vObra
    comissoesVendas += comissaoFinal
  })

  // 2. Terceiros
  const tercs = linhas.filter((l) => l.tipo === "Terceiro")
  let terceirosFolha = 0

  tercs.forEach((t) => {
    const cadastrado = terceiros.find(
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

    // Raimundo (terceiro SJE) NUNCA é vendedor
    const isRaimundo = (t.nome || "").toUpperCase().includes("RAIMUNDO")
    const valorMes =
      ehVendedor && !isRaimundo
        ? Number(t.comissao || 0) + Number(t.ajuda_custo || 0)
        : Number(t.salario_liquido || t.bruto || 0)

    terceirosFolha += valorMes

    // Vendas terceiros: Márcio Luan só na VENDAS da Monteiro
    if (ehVendedor && !isRaimundo) {
      const vObra = Number(t.vendas_obra || 0)
      const comissaoProgressiva =
        faixasComissao.length > 0
          ? (calcularComissaoProgressivaMarginal(vObra, faixasComissao) ?? 0)
          : 0
      const comissaoFinal =
        t.modo_calculo === "Digitado" &&
        t.comissao !== undefined &&
        t.comissao !== null
          ? Number(t.comissao)
          : comissaoProgressiva

      totalVendasBase += vObra
      comissoesVendas += comissaoFinal
    } else if (isRaimundo) {
      // Raimundo: na QUINZENA 40% e MENSAL 60% sem desconto; NÃO entra na comissão
      const quinzenaRaimundo =
        Math.round(valorMes * percentualQuinzena * 100) / 100
      const mensalRaimundo =
        Math.round((valorMes - quinzenaRaimundo) * 100) / 100
      salariosQuinzena += quinzenaRaimundo
      salariosMensalLiquido += mensalRaimundo
    } else if (!isMonteiro) {
      // Terceiros comuns fora da Monteiro (se houver): quinzena e mensal
      const q = Math.round(valorMes * percentualQuinzena * 100) / 100
      const m = Math.round((valorMes - q) * 100) / 100
      salariosQuinzena += q
      salariosMensalLiquido += m
    }
  })

  salariosQuinzena = Math.round(salariosQuinzena * 100) / 100
  salariosMensalLiquido = Math.round(salariosMensalLiquido * 100) / 100
  producaoAPagar = Math.round(producaoAPagar * 100) / 100
  comissoesVendas = Math.round(comissoesVendas * 100) / 100
  terceirosFolha = Math.round(terceirosFolha * 100) / 100
  totalVendasBase = Math.round(totalVendasBase * 100) / 100

  // FÓRMULA OFICIAL DA ABA RESUMO GC MIX:
  // SUBTOTAL FOLHA = Salários Quinzena + Salários Mensal (líquido) + Produção (a pagar) + Comissões de Vendas
  const totalGeral =
    Math.round(
      (salariosQuinzena +
        salariosMensalLiquido +
        producaoAPagar +
        comissoesVendas) *
        100,
    ) / 100

  return {
    pessoasNaFolha: funcs.length + tercs.length,
    salariosQuinzena,
    salariosMensalLiquido,
    producaoAPagar,
    comissoesVendas,
    totalGeral,
    totalVendasBase,
    terceirosFolha,
  }
}

export interface ItemFechamentoWhatsAppUnidade {
  nomeUnidade: string
  pessoasNaFolha: number
  salariosQuinzena: number
  salariosMensalLiquido: number
  producaoAPagar: number
  comissoesAjudaVendas: number
  terceiros: number
  totalUnidade: number
}

export interface DadosFechamentoWhatsApp {
  competencia: string // "YYYY-MM"
  rotuloMesAno: string // "MÊS/ANO"
  telefoneDestino: string | null // "5583981503316" | "5587998061826" | null
  unidades: ItemFechamentoWhatsAppUnidade[]
  totalGeral: number
  textoWhatsApp: string
  linkWhatsApp: string | null
  avisoSemDestino?: string
}

function formatarMoedaWhatsApp(val: number): string {
  return (val || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export const RelatorioGerencialService = {
  obterMesAnterior,

  /**
   * Monta os dados e texto formatado em negrito WhatsApp para o Fechamento do Mês
   * do mês anterior ao relógio (competência atual - 1).
   * Destinos por empresa ativa:
   * - PATOS → 5583981503316
   * - SJE ou MONTEIRO → 5587998061826 (SJE e Monteiro no mesmo fechamento)
   * - CAICÓ → sem destino configurado
   */
  async obterFechamentoWhatsApp(params: {
    empresaAtivaSlugOuId?: string
    competenciaAlvo?: string
  }): Promise<DadosFechamentoWhatsApp> {
    const hoje = new Date()
    const compAtualRelogio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
    // Fechamento do mês anterior ao relógio por padrão
    const compFechamento =
      params.competenciaAlvo || obterMesAnterior(compAtualRelogio)

    const [anoStr, mesStr] = compFechamento.split("-")
    const ano = Number(anoStr) || 2026
    const mes = Number(mesStr) || 1
    const mesesAbrev = [
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
    const nomeMes = mesesAbrev[mes - 1] || mesStr
    const rotuloMesAno = `${nomeMes}/${ano}`

    const slug = (params.empresaAtivaSlugOuId || "").toLowerCase().trim()
    const ehPatos = slug === "patos" || slug.includes("patos")
    const ehCaico = slug === "caico" || slug.includes("caic")

    let telefoneDestino: string | null = null
    let avisoSemDestino: string | undefined = undefined

    if (ehPatos) {
      telefoneDestino = "5583981503316"
    } else if (ehCaico) {
      telefoneDestino = null
      avisoSemDestino =
        "A unidade Caicó não possui destino de WhatsApp configurado para fechamento mensal."
    } else {
      // Padrão: SJE e Monteiro no mesmo fechamento
      telefoneDestino = "5587998061826"
    }

    // Helper interno para carregar e calcular unidade
    const carregarUnidade = async (
      empresaId: string,
      nomeUnidade: string,
    ): Promise<ItemFechamentoWhatsAppUnidade> => {
      try {
        const [linhas, terceiros, tabela, faixas, compObj] = await Promise.all([
          FolhaService.getLinhasCompetencia(empresaId, compFechamento).catch(
            () => [],
          ),
          FolhaService.getTerceiros(empresaId).catch(() => []),
          FolhaService.getTabelaOficial(empresaId, ano).catch(() => null),
          FolhaService.getFaixasComissao(empresaId).catch(() => []),
          FolhaService.getCompetencia(empresaId, compFechamento).catch(
            () => null,
          ),
        ])

        const pctQuinzena = compObj?.percentual_quinzena ?? 0.4
        const resumo = calcularResumoFolhaUnidade({
          empresaId,
          linhas,
          terceiros,
          tabelaOficial: tabela,
          faixasComissao: faixas,
          percentualQuinzena: pctQuinzena,
        })

        // Comissões + Ajuda de Custo (Vendas)
        let ajudaCustoTerceiros = 0
        const tercs = (linhas || []).filter((l) => l.tipo === "Terceiro")
        tercs.forEach((t) => {
          ajudaCustoTerceiros += Number(t.ajuda_custo ?? t.vendas_ajuda ?? 0)
        })

        const comissoesAjudaVendas =
          Math.round((resumo.comissoesVendas + ajudaCustoTerceiros) * 100) / 100

        return {
          nomeUnidade,
          pessoasNaFolha: resumo.pessoasNaFolha,
          salariosQuinzena: resumo.salariosQuinzena,
          salariosMensalLiquido: resumo.salariosMensalLiquido,
          producaoAPagar: resumo.producaoAPagar,
          comissoesAjudaVendas,
          terceiros: resumo.terceirosFolha,
          totalUnidade: resumo.totalGeral,
        }
      } catch (err) {
        console.warn(`Erro ao carregar folha da unidade ${nomeUnidade}:`, err)
        return {
          nomeUnidade,
          pessoasNaFolha: 0,
          salariosQuinzena: 0,
          salariosMensalLiquido: 0,
          producaoAPagar: 0,
          comissoesAjudaVendas: 0,
          terceiros: 0,
          totalUnidade: 0,
        }
      }
    }

    const unidades: ItemFechamentoWhatsAppUnidade[] = []

    if (ehPatos) {
      // Buscar id de Patos
      const { data: empPatos } = await (supabase as any)
        .from("empresas")
        .select("id, nome")
        .eq("slug", "patos")
        .maybeSingle()
      const idPatos = empPatos?.id || params.empresaAtivaSlugOuId || ""
      const uPatos = await carregarUnidade(idPatos, "PATOS")
      unidades.push(uPatos)
    } else if (ehCaico) {
      const { data: empCaico } = await (supabase as any)
        .from("empresas")
        .select("id, nome")
        .eq("slug", "caico")
        .maybeSingle()
      const idCaico = empCaico?.id || params.empresaAtivaSlugOuId || ""
      const uCaico = await carregarUnidade(idCaico, "CAICÓ")
      unidades.push(uCaico)
    } else {
      // SJE e MONTEIRO NO MESMO FECHAMENTO (um só clique monta as duas unidades)
      const [uMonteiro, uSje] = await Promise.all([
        carregarUnidade(ID_EMPRESA_MONTEIRO, "MONTEIRO"),
        carregarUnidade(ID_EMPRESA_SJE, "SÃO JOSÉ DO EGITO"),
      ])
      unidades.push(uMonteiro, uSje)
    }

    const totalGeral =
      Math.round(
        unidades.reduce((acc, u) => acc + (u.totalUnidade || 0), 0) * 100,
      ) / 100

    // Montagem da mensagem formatada com negrito WhatsApp (*texto*)
    const linhasMsg: string[] = []
    linhasMsg.push(`*GC MIX — FECHAMENTO ${rotuloMesAno}*`)
    linhasMsg.push("")

    unidades.forEach((u, idx) => {
      linhasMsg.push(`*UNIDADE ${u.nomeUnidade.toUpperCase()}*`)
      linhasMsg.push(`• Pessoas na folha: ${u.pessoasNaFolha}`)
      linhasMsg.push(
        `• Salários Quinzena: ${formatarMoedaWhatsApp(u.salariosQuinzena)}`,
      )
      linhasMsg.push(
        `• Salários Mensal (líquido): ${formatarMoedaWhatsApp(u.salariosMensalLiquido)}`,
      )
      linhasMsg.push(
        `• Produção (a pagar): ${formatarMoedaWhatsApp(u.producaoAPagar)}`,
      )
      linhasMsg.push(
        `• Comissões + Ajuda de Custo (Vendas): ${formatarMoedaWhatsApp(u.comissoesAjudaVendas)}`,
      )
      linhasMsg.push(`• Terceiros: ${formatarMoedaWhatsApp(u.terceiros)}`)
      linhasMsg.push(
        `*TOTAL DA UNIDADE: ${formatarMoedaWhatsApp(u.totalUnidade)}*`,
      )
      if (idx < unidades.length - 1) {
        linhasMsg.push("")
        linhasMsg.push("────────────────────")
        linhasMsg.push("")
      }
    })

    if (unidades.length > 1) {
      linhasMsg.push("")
      linhasMsg.push(
        `*TOTAL GERAL GC MIX: ${formatarMoedaWhatsApp(totalGeral)}*`,
      )
    }

    const textoWhatsApp = linhasMsg.join("\n")

    let linkWhatsApp: string | null = null
    if (telefoneDestino) {
      linkWhatsApp = `https://wa.me/${telefoneDestino}?text=${encodeURIComponent(textoWhatsApp)}`
    }

    return {
      competencia: compFechamento,
      rotuloMesAno,
      telefoneDestino,
      unidades,
      totalGeral,
      textoWhatsApp,
      linkWhatsApp,
      avisoSemDestino,
    }
  },

  /**
   * Monta o relatório gerencial simplificado de 1 página A4
   */
  async obterRelatorioMes(params: {
    competencia?: string
    empresaFiltro?: string // "todas" | "monteiro" | "sje" | "caico" | "patos" | uuid
  }): Promise<DadosRelatorioGerencialMes> {
    const hojeRelogio = new Date()
    const compAtualRelogio = `${hojeRelogio.getFullYear()}-${String(hojeRelogio.getMonth() + 1).padStart(2, "0")}`
    const competencia = params.competencia || compAtualRelogio
    const empresaFiltro = params.empresaFiltro || "todas"
    const mesAnterior = obterMesAnterior(competencia)

    // 1. Obter empresas cadastradas
    const { data: empresasCadastradas } = await (supabase as any)
      .from("empresas")
      .select("id, nome, slug")
      .eq("ativo", true)
      .order("nome", { ascending: true })

    const listaEmpresas = (empresasCadastradas || []) as Array<{
      id: string
      nome: string
      slug: string
    }>

    let targetEmpresaId: string | undefined = undefined
    if (empresaFiltro && empresaFiltro !== "todas") {
      const encontrada = listaEmpresas.find(
        (e) =>
          e.slug?.toLowerCase() === empresaFiltro.toLowerCase() ||
          e.id === empresaFiltro ||
          (empresaFiltro === "monteiro" && e.id === ID_EMPRESA_MONTEIRO) ||
          (empresaFiltro === "sje" && e.id === ID_EMPRESA_SJE),
      )
      if (encontrada) targetEmpresaId = encontrada.id
      else if (empresaFiltro === "monteiro")
        targetEmpresaId = ID_EMPRESA_MONTEIRO
      else if (empresaFiltro === "sje") targetEmpresaId = ID_EMPRESA_SJE
      else targetEmpresaId = empresaFiltro
    }

    // Datas do mês atual
    const [anoStr, mesStr] = competencia.split("-")
    const ano = Number(anoStr) || 2026
    const mes = Number(mesStr) || 9
    const primeiroDiaAtual = `${competencia}-01`
    const ultimoDiaAtualNum = new Date(ano, mes, 0).getDate()
    const ultimoDiaAtual = `${competencia}-${String(ultimoDiaAtualNum).padStart(2, "0")}`

    // Datas do mês anterior
    const [anoAntStr, mesAntStr] = mesAnterior.split("-")
    const anoAnt = Number(anoAntStr) || 2026
    const mesAnt = Number(mesAntStr) || 8
    const primeiroDiaAnt = `${mesAnterior}-01`
    const ultimoDiaAntNum = new Date(anoAnt, mesAnt, 0).getDate()
    const ultimoDiaAnt = `${mesAnterior}-${String(ultimoDiaAntNum).padStart(2, "0")}`

    // Se targetEmpresaId estiver definido, a visão é de uma unidade ESPECÍFICA (Monteiro, SJE, Caicó, Patos etc.)
    // Se for "todas" / sem targetEmpresaId, a visão é CONSOLIDADA (Monteiro + SJE)
    const isUnidadeEspecifica = Boolean(targetEmpresaId)

    // Executa em paralelo
    const [
      dadosPainelAtual,
      cargasMesAnteriorRes,
      osMesAtualRes,
      osMesAnteriorRes,
      // Folha da unidade específica OU Monteiro/SJE consolidado
      linhasAlvo,
      terceirosAlvo,
      tabelaAlvo,
      faixasAlvo,
      compObjAlvo,
      // Se visão consolidada, carrega Monteiro e SJE
      linhasConsolidado,
      terceirosConsolidado,
      tabelasConsolidado,
      faixasConsolidado,
      compObjConsolidado,
      recipientesUnidadeRes,
    ] = await Promise.all([
      // Dados completos do mês (produção, insumos, estoque cimento/aditivo)
      PainelService.getDadosPainel({
        competencia,
        empresaFiltro,
        empresaAtivaId: targetEmpresaId,
      }),

      // Cargas mês anterior para comparativo de produção
      (async () => {
        let q = (supabase as any)
          .from("cargas")
          .select("id, volume_m3, carga_zerada, empresa_id")
          .gte("data", primeiroDiaAnt)
          .lte("data", ultimoDiaAnt)
        if (targetEmpresaId) q = q.eq("empresa_id", targetEmpresaId)
        const { data } = await q
        return data || []
      })(),

      // OS mês atual (contagem de OS, clientes e obras)
      (async () => {
        let q = (supabase as any)
          .from("ordens_servico")
          .select(
            "id, empresa_id, cliente_id, nome_obra, destinatario_nome, itens",
          )
          .gte("data_emissao", primeiroDiaAtual)
          .lte("data_emissao", ultimoDiaAtual)
        if (targetEmpresaId) q = q.eq("empresa_id", targetEmpresaId)
        const { data } = await q
        return data || []
      })(),

      // OS mês anterior
      (async () => {
        let q = (supabase as any)
          .from("ordens_servico")
          .select("id")
          .gte("data_emissao", primeiroDiaAnt)
          .lte("data_emissao", ultimoDiaAnt)
        if (targetEmpresaId) q = q.eq("empresa_id", targetEmpresaId)
        const { data } = await q
        return data || []
      })(),

      // 1. Unidade Alvo (quando for unidade específica)
      isUnidadeEspecifica && targetEmpresaId
        ? FolhaService.getLinhasCompetencia(targetEmpresaId, competencia).catch(
            () => [],
          )
        : Promise.resolve([]),
      isUnidadeEspecifica && targetEmpresaId
        ? FolhaService.getTerceiros(targetEmpresaId).catch(() => [])
        : Promise.resolve([]),
      isUnidadeEspecifica && targetEmpresaId
        ? FolhaService.getTabelaOficial(targetEmpresaId, ano).catch(() => null)
        : Promise.resolve(null),
      isUnidadeEspecifica && targetEmpresaId
        ? FolhaService.getFaixasComissao(targetEmpresaId).catch(() => [])
        : Promise.resolve([]),
      isUnidadeEspecifica && targetEmpresaId
        ? FolhaService.getCompetencia(targetEmpresaId, competencia).catch(
            () => null,
          )
        : Promise.resolve(null),

      // 2. Consolidado (Monteiro + SJE) quando NÃO for unidade específica
      !isUnidadeEspecifica
        ? Promise.all([
            FolhaService.getLinhasCompetencia(
              ID_EMPRESA_MONTEIRO,
              competencia,
            ).catch(() => []),
            FolhaService.getLinhasCompetencia(
              ID_EMPRESA_SJE,
              competencia,
            ).catch(() => []),
          ])
        : Promise.resolve([[], []]),
      !isUnidadeEspecifica
        ? Promise.all([
            FolhaService.getTerceiros(ID_EMPRESA_MONTEIRO).catch(() => []),
            FolhaService.getTerceiros(ID_EMPRESA_SJE).catch(() => []),
          ])
        : Promise.resolve([[], []]),
      !isUnidadeEspecifica
        ? Promise.all([
            FolhaService.getTabelaOficial(ID_EMPRESA_MONTEIRO, ano).catch(
              () => null,
            ),
            FolhaService.getTabelaOficial(ID_EMPRESA_SJE, ano).catch(
              () => null,
            ),
          ])
        : Promise.resolve([null, null]),
      !isUnidadeEspecifica
        ? Promise.all([
            FolhaService.getFaixasComissao(ID_EMPRESA_MONTEIRO).catch(() => []),
            FolhaService.getFaixasComissao(ID_EMPRESA_SJE).catch(() => []),
          ])
        : Promise.resolve([[], []]),
      !isUnidadeEspecifica
        ? Promise.all([
            FolhaService.getCompetencia(ID_EMPRESA_MONTEIRO, competencia).catch(
              () => null,
            ),
            FolhaService.getCompetencia(ID_EMPRESA_SJE, competencia).catch(
              () => null,
            ),
          ])
        : Promise.resolve([null, null]),

      // 3. Recipientes de estoque da unidade selecionada (caso de Patos)
      (async () => {
        if (!targetEmpresaId) return []
        try {
          const { data, error } = await (supabase as any)
            .from("recipientes_estoque")
            .select("*")
            .eq("empresa_id", targetEmpresaId)
            .order("ordem", { ascending: true })
          if (error) {
            console.warn(
              "Erro ao buscar recipientes_estoque no relatório gerencial:",
              error,
            )
            return []
          }
          return data || []
        } catch (err) {
          console.warn("Falha ao buscar recipientes_estoque:", err)
          return []
        }
      })(),
    ])
    // --- 1. PRODUÇÃO & COMPARATIVO ---
    const volAtual = dadosPainelAtual.kpis.volumeTotalM3
    const cargasAtual = dadosPainelAtual.kpis.totalCargas
    const osAtualCount = osMesAtualRes.length

    // Mês anterior
    const cargasAntValidas = cargasMesAnteriorRes.filter(
      (c: any) => !c.carga_zerada,
    )
    let volAnterior = 0
    cargasAntValidas.forEach((c: any) => {
      volAnterior += Number(c.volume_m3) || 0
    })
    volAnterior = Math.round(volAnterior * 10) / 10
    const cargasAnterior = cargasMesAnteriorRes.length
    const osAnteriorCount = osMesAnteriorRes.length

    // Variações %
    const variacaoVolumePct =
      volAnterior > 0
        ? Math.round(((volAtual - volAnterior) / volAnterior) * 1000) / 10
        : null
    const variacaoCargasPct =
      cargasAnterior > 0
        ? Math.round(((cargasAtual - cargasAnterior) / cargasAnterior) * 1000) /
          10
        : null

    const producao: DadosProducaoGerencial = {
      volumeTotalM3: volAtual,
      totalCargas: cargasAtual,
      totalOS: osAtualCount,
      mesAnteriorVolumeM3: volAnterior,
      mesAnteriorCargas: cargasAnterior,
      mesAnteriorOS: osAnteriorCount,
      variacaoVolumePct,
      variacaoCargasPct,
    }

    // --- 3. FOLHA EM 4 LINHAS (RESUMO OFICIAL) ---
    let folha: DadosFolhaGerencial
    let totalVendidoFolha = 0

    if (isUnidadeEspecifica && targetEmpresaId) {
      // Unidade ESPECÍFICA (Monteiro, SJE, Caicó, Patos etc.)
      const pctQuinzenaAlvo = compObjAlvo?.percentual_quinzena ?? 0.4
      const resumoAlvo = calcularResumoFolhaUnidade({
        empresaId: targetEmpresaId,
        linhas: linhasAlvo || [],
        terceiros: terceirosAlvo || [],
        tabelaOficial: tabelaAlvo,
        faixasComissao: faixasAlvo || [],
        percentualQuinzena: pctQuinzenaAlvo,
      })

      folha = {
        pessoasNaFolha: resumoAlvo.pessoasNaFolha,
        salariosQuinzena: resumoAlvo.salariosQuinzena,
        salariosMensalLiquido: resumoAlvo.salariosMensalLiquido,
        producaoAPagar: resumoAlvo.producaoAPagar,
        comissoesVendas: resumoAlvo.comissoesVendas,
        totalFolha: resumoAlvo.totalGeral,
        terceirosFolha: resumoAlvo.terceirosFolha,
      }
      totalVendidoFolha = resumoAlvo.totalVendasBase
    } else {
      // Consolidado Geral (Monteiro + SJE)
      const [linhasMont, linhasSje] = linhasConsolidado
      const [terceirosMont, terceirosSje] = terceirosConsolidado
      const [tabelaMont, tabelaSje] = tabelasConsolidado
      const [faixasMont, faixasSje] = faixasConsolidado
      const [compMont, compSje] = compObjConsolidado

      const pctQuinzenaMont = compMont?.percentual_quinzena ?? 0.4
      const pctQuinzenaSje = compSje?.percentual_quinzena ?? 0.4

      const resumoMont = calcularResumoFolhaUnidade({
        empresaId: ID_EMPRESA_MONTEIRO,
        linhas: linhasMont,
        terceiros: terceirosMont,
        tabelaOficial: tabelaMont,
        faixasComissao: faixasMont,
        percentualQuinzena: pctQuinzenaMont,
      })

      const resumoSje = calcularResumoFolhaUnidade({
        empresaId: ID_EMPRESA_SJE,
        linhas: linhasSje,
        terceiros: terceirosSje,
        tabelaOficial: tabelaSje,
        faixasComissao: faixasSje,
        percentualQuinzena: pctQuinzenaSje,
      })

      const salQuinzena =
        Math.round(
          (resumoMont.salariosQuinzena + resumoSje.salariosQuinzena) * 100,
        ) / 100
      const salMensal =
        Math.round(
          (resumoMont.salariosMensalLiquido + resumoSje.salariosMensalLiquido) *
            100,
        ) / 100
      const prodPagar =
        Math.round(
          (resumoMont.producaoAPagar + resumoSje.producaoAPagar) * 100,
        ) / 100
      const comVendas =
        Math.round(
          (resumoMont.comissoesVendas + resumoSje.comissoesVendas) * 100,
        ) / 100
      const totGeral =
        Math.round((salQuinzena + salMensal + prodPagar + comVendas) * 100) /
        100

      folha = {
        pessoasNaFolha: resumoMont.pessoasNaFolha + resumoSje.pessoasNaFolha,
        salariosQuinzena: salQuinzena,
        salariosMensalLiquido: salMensal,
        producaoAPagar: prodPagar,
        comissoesVendas: comVendas,
        totalFolha: totGeral,
        terceirosFolha:
          Math.round(
            (resumoMont.terceirosFolha + resumoSje.terceirosFolha) * 100,
          ) / 100,
      }
      totalVendidoFolha =
        Math.round(
          (resumoMont.totalVendasBase + resumoSje.totalVendasBase) * 100,
        ) / 100
    }

    // --- 2. VENDAS ---
    // Faturamento: prioridade para soma de vendas da folha/comissão ou OS com valor ou faturamento estimado
    let faturamentoOS = 0
    const clientesSet = new Set<string>()
    const obrasSet = new Set<string>()

    osMesAtualRes.forEach((os: any) => {
      if (os.destinatario_nome) {
        clientesSet.add(os.destinatario_nome.trim().toUpperCase())
      }
      if (os.nome_obra) {
        obrasSet.add(os.nome_obra.trim().toUpperCase())
      }
      if (os.itens && Array.isArray(os.itens)) {
        os.itens.forEach((it: any) => {
          if (it.valor_total) faturamentoOS += Number(it.valor_total) || 0
        })
      }
    })

    const totalVendidoFinal =
      totalVendidoFolha > 0
        ? totalVendidoFolha
        : faturamentoOS > 0
          ? faturamentoOS
          : dadosPainelAtual.kpis.faturamentoEstimado

    const vendas: DadosVendasGerencial = {
      totalVendido: totalVendidoFinal,
      totalComissoes: folha.comissoesVendas,
      numeroClientesAtendidos:
        clientesSet.size > 0
          ? clientesSet.size
          : dadosPainelAtual.kpis.numeroClientesAtendidos,
      numeroObrasAtendidas:
        obrasSet.size > 0
          ? obrasSet.size
          : dadosPainelAtual.kpis.numeroObrasAtendidas,
    }

    // --- 4 & 5. INSUMOS E ESTOQUE VIGENTE (SOMENTE CIMENTO E ADITIVO) ---
    const insumos = dadosPainelAtual.custosInsumos
    const estoque = dadosPainelAtual.saldosInsumos.filter(
      (i) =>
        i.codigo?.toLowerCase() === "cimento" ||
        i.codigo?.toLowerCase() === "aditivo",
    )

    // Recipientes de estoque da unidade (caso de Patos)
    // Listar cada silo/tanque com nome real, saldo, mínimo individual e status Abaixo/No mínimo/OK
    let recipientes: RecipienteRelatorioGerencial[] | undefined = undefined
    if (recipientesUnidadeRes && recipientesUnidadeRes.length > 0) {
      recipientes = (recipientesUnidadeRes as any[]).map((rec: any) => {
        const saldo = Number(rec.saldo_atual || 0)
        const estoqueMinimo = Number(rec.estoque_minimo || 0)
        const abaixoMinimo = estoqueMinimo > 0 && saldo < estoqueMinimo
        const noMinimo =
          !abaixoMinimo && estoqueMinimo > 0 && saldo === estoqueMinimo
        const status: "ABAIXO" | "NO_MINIMO" | "OK" = abaixoMinimo
          ? "ABAIXO"
          : noMinimo
            ? "NO_MINIMO"
            : "OK"

        const cod = (rec.material_codigo || "").toLowerCase()
        const unidade = rec.unidade || (cod === "cimento" ? "kg" : "litros")

        return {
          id: rec.id,
          nome: rec.nome,
          tipo: rec.tipo || (cod === "cimento" ? "silo" : "tanque"),
          materialCodigo: cod,
          materialNome:
            rec.material_nome || (cod === "cimento" ? "Cimento" : "Aditivo"),
          saldo,
          estoqueMinimo,
          unidade,
          status,
          ordem: Number(rec.ordem || 0),
        }
      })
    }
    const nomesMesesLongos = [
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
    const rotuloCompetencia = `${nomesMesesLongos[mes - 1]} / ${ano}`

    const nomeEmpresaCabecalho = formatarNomeEmpresaVisao(
      empresaFiltro,
      listaEmpresas,
    )

    return {
      competencia,
      rotuloCompetencia,
      empresaFiltro,
      nomeEmpresaCabecalho,
      producao,
      vendas,
      folha,
      insumos,
      estoque,
      recipientes,
      dataEmissao: new Date().toLocaleDateString("pt-BR"),
    }
  },
}
