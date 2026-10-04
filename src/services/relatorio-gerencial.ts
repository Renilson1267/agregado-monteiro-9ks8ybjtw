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

export const RelatorioGerencialService = {
  /**
   * Monta o relatório gerencial simplificado de 1 página A4
   */
  async obterRelatorioMes(params: {
    competencia?: string // padrão: "2026-09"
    empresaFiltro?: string // "todas" | "monteiro" | "sje" | "caico" | "patos" | uuid
  }): Promise<DadosRelatorioGerencialMes> {
    const competencia = params.competencia || "2026-09"
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

    // Executa em paralelo
    const [
      dadosPainelAtual,
      cargasMesAnteriorRes,
      osMesAtualRes,
      osMesAnteriorRes,
      linhasMonteiro,
      linhasSje,
      terceirosMonteiro,
      terceirosSje,
      tabelaMonteiro,
      tabelaSje,
      faixasMonteiro,
      faixasSje,
      compObjMonteiro,
      compObjSje,
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

      // Folha Monteiro
      FolhaService.getLinhasCompetencia(ID_EMPRESA_MONTEIRO, competencia).catch(
        () => [],
      ),
      // Folha SJE
      FolhaService.getLinhasCompetencia(ID_EMPRESA_SJE, competencia).catch(
        () => [],
      ),
      // Terceiros Monteiro
      FolhaService.getTerceiros(ID_EMPRESA_MONTEIRO).catch(() => []),
      // Terceiros SJE
      FolhaService.getTerceiros(ID_EMPRESA_SJE).catch(() => []),

      // Tabelas Oficiais e Faixas
      FolhaService.getTabelaOficial(ID_EMPRESA_MONTEIRO, ano).catch(() => null),
      FolhaService.getTabelaOficial(ID_EMPRESA_SJE, ano).catch(() => null),
      FolhaService.getFaixasComissao(ID_EMPRESA_MONTEIRO).catch(() => []),
      FolhaService.getFaixasComissao(ID_EMPRESA_SJE).catch(() => []),

      // Competência Config
      FolhaService.getCompetencia(ID_EMPRESA_MONTEIRO, competencia).catch(
        () => null,
      ),
      FolhaService.getCompetencia(ID_EMPRESA_SJE, competencia).catch(
        () => null,
      ),
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
    const pctQuinzenaMont = compObjMonteiro?.percentual_quinzena ?? 0.4
    const pctQuinzenaSje = compObjSje?.percentual_quinzena ?? 0.4

    const resumoMont = calcularResumoFolhaUnidade({
      empresaId: ID_EMPRESA_MONTEIRO,
      linhas: linhasMonteiro,
      terceiros: terceirosMonteiro,
      tabelaOficial: tabelaMonteiro,
      faixasComissao: faixasMonteiro,
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

    let folha: DadosFolhaGerencial
    let totalVendidoFolha = 0

    const isVisaoMonteiro =
      empresaFiltro === "monteiro" || targetEmpresaId === ID_EMPRESA_MONTEIRO
    const isVisaoSje =
      empresaFiltro === "sje" || targetEmpresaId === ID_EMPRESA_SJE

    if (isVisaoMonteiro) {
      folha = {
        pessoasNaFolha: resumoMont.pessoasNaFolha,
        salariosQuinzena: resumoMont.salariosQuinzena,
        salariosMensalLiquido: resumoMont.salariosMensalLiquido,
        producaoAPagar: resumoMont.producaoAPagar,
        comissoesVendas: resumoMont.comissoesVendas,
        totalFolha: resumoMont.totalGeral,
        terceirosFolha: resumoMont.terceirosFolha,
      }
      totalVendidoFolha = resumoMont.totalVendasBase
    } else if (isVisaoSje) {
      folha = {
        pessoasNaFolha: resumoSje.pessoasNaFolha,
        salariosQuinzena: resumoSje.salariosQuinzena,
        salariosMensalLiquido: resumoSje.salariosMensalLiquido,
        producaoAPagar: resumoSje.producaoAPagar,
        comissoesVendas: resumoSje.comissoesVendas,
        totalFolha: resumoSje.totalGeral,
        terceirosFolha: resumoSje.terceirosFolha,
      }
      totalVendidoFolha = resumoSje.totalVendasBase
    } else {
      // Consolidado
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

    // Rótulo por extenso
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
      dataEmissao: new Date().toLocaleDateString("pt-BR"),
    }
  },
}
