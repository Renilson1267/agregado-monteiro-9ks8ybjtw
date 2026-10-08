import { supabase } from "@/lib/supabase/client"
import { FolhaService } from "@/services/folha"
import { ConcreteiraService } from "@/services/concreteira"
import { FeriasService } from "@/services/ferias"
import { ExamesService } from "@/services/exames"
import type { FolhaPagamentoLinha, FolhaTerceiro } from "@/types/folha"
import { calcularProducaoTotal } from "@/lib/folha-calculos"
import type { ItemControleFerias } from "@/types/ferias"
import type { FuncionarioComExames } from "@/types/exames"
import type { Material } from "@/types/concreteira"

export const ID_EMPRESA_MONTEIRO = "11111111-1111-1111-1111-111111111111"
export const ID_EMPRESA_SJE = "22222222-2222-2222-2222-222222222222"

export interface KpisPeriodo {
  totalCargas: number
  cargasZeradas: number
  cargasValidas: number
  volumeTotalM3: number
  mediaPorCargaM3: number
  faturamentoEstimado: number // se houver preço/faturamento configurado ou 0 com breakdown de custos
  custoTotalInsumos: number
  custoMedioM3: number
  numeroObrasAtendidas: number
  numeroCidadesAtendidas: number
  numeroClientesAtendidos: number
  // Folha do período
  folhaDisponivel: boolean
  totalFolhaLiquido: number // Soma das duas folhas ou da unidade selecionada
  folhaFuncionarios: number
  folhaTerceiros: number
  folhaQtdPessoas: number
  folhaCompetencia: string
}

export interface EvolucaoMensalItem {
  competencia: string // YYYY-MM
  rotulo: string // MMM/YY
  volumeM3: number
  cargas: number
  mediaM3PorCarga: number
  custoInsumos: number
}

export interface TopRankingItem {
  id: string
  nome: string
  tipo: "cliente" | "obra" | "cidade"
  cargas: number
  volumeM3: number
  percentual: number
  destaque?: string
}

export interface MixTracoItem {
  nome: string
  cargas: number
  volumeM3: number
  percentual: number
}

export interface AlertaOperacional {
  id: string
  tipo: "ferias" | "aso" | "estoque"
  gravidade: "critico" | "alerta" | "info"
  titulo: string
  subtitulo: string
  detalhe?: string
  diasRestantes?: number
  dataRef?: string
  empresaNome?: string
}

export interface ItemEstoqueInsumo {
  id: string
  nome: string
  codigo: string
  unidade: string
  controlaEstoque: boolean
  estoqueMinimo: number
  saldo: number
  saldoMonteiro?: number
  saldoSje?: number
  saldoCaico?: number
  saldoPatos?: number
  minimoMonteiro?: number
  minimoSje?: number
  abaixoMinimo: boolean
  defasagem: number
  empresaId?: string
}

export interface ItemCustoInsumo {
  codigo: string
  nome: string
  unidade: string
  quantidadeConsumida: number
  custoTotal: number
  custoUnitarioMedio: number
  percentualDoTotal: number
  // Conversão para volume em m³ quando aplicável (areia, brita12, brita19, po_pedra)
  densidade?: number
  quantidadeM3?: number
  // Discriminação por empresa para visão consolidada
  quantidadePorEmpresa?: Record<string, number>
  custoPorEmpresa?: Record<string, number>
}

export interface SomatorioBritasInfo {
  quantidadeKg: number
  quantidadeM3: number
  custoTotal: number
  percentualDoTotal: number
  custoUnitarioMedioM3: number
}

export interface ResumoCustosInsumos {
  itens: ItemCustoInsumo[]
  custoTotalGeral: number
  custoMedioPorM3: number
  volumeTotalM3: number
  totalCargasValidas: number
  somatorioBritas: SomatorioBritasInfo
}

export interface DadosPainelGerencial {
  competenciaSelecionada: string
  competenciasDisponiveis: string[]
  visaoEmpresa: string // "todas" ou id/slug da empresa (monteiro, sje, caico, patos)
  kpis: KpisPeriodo
  evolucao12Meses: EvolucaoMensalItem[]
  topClientesObras: TopRankingItem[]
  topCidades: TopRankingItem[]
  mixTracos: MixTracoItem[]
  saldosInsumos: ItemEstoqueInsumo[]
  custosInsumos: ResumoCustosInsumos
  alertas: {
    totalCriticos: number
    totalAlertas: number
    feriasProximas: ItemControleFerias[]
    examesCriticos: Array<{
      funcionarioNome: string
      funcao: string
      exameNome: string
      status: "VENCIDO" | "VENCENDO_30_DIAS" | "PENDENTE"
      dias: number
      validade: string | null
    }>
    estoqueBaixo: Array<{
      material: Material
      saldo: number
      minimo: number
      defasagem: number
      unidade: string
      empresaId?: string
    }>
  }
}

/**
 * Função pura idêntica à do FolhaPagamento.tsx (aba GERAL - "SOMA DAS DUAS FOLHAS")
 */
export function calcularValorRealEmpresa(
  linhasEmpresa: FolhaPagamentoLinha[],
  terceirosCadastradosEmpresa: FolhaTerceiro[] = [],
): {
  totalFuncionarios: number
  totalTerceiros: number
  valorReal: number
  qtdFuncionarios: number
  qtdTerceiros: number
  linhasCount: number
} {
  if (!linhasEmpresa || linhasEmpresa.length === 0) {
    return {
      totalFuncionarios: 0,
      totalTerceiros: 0,
      valorReal: 0,
      qtdFuncionarios: 0,
      qtdTerceiros: 0,
      linhasCount: 0,
    }
  }

  // 1. Funcionários (inclui ocultos conforme convenção oficial)
  const funcs = linhasEmpresa.filter((l) => l.tipo !== "Terceiro")
  let totalFuncionarios = 0
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
  })
  totalFuncionarios = Math.round(totalFuncionarios * 100) / 100

  // 2. Terceiros
  const tercs = linhasEmpresa.filter((l) => l.tipo === "Terceiro")
  let totalTerceiros = 0
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
  })
  totalTerceiros = Math.round(totalTerceiros * 100) / 100

  const valorReal = Math.round((totalFuncionarios + totalTerceiros) * 100) / 100

  return {
    totalFuncionarios,
    totalTerceiros,
    valorReal,
    qtdFuncionarios: funcs.length,
    qtdTerceiros: tercs.length,
    linhasCount: linhasEmpresa.length,
  }
}

export const PainelService = {
  /**
   * Carrega todos os dados necessários para o Painel Gerencial
   */
  async getDadosPainel(params: {
    competencia: string
    empresaFiltro?: string // "todas" | "monteiro" | "sje" | "caico" | "patos" | UUID
    empresaAtivaId?: string
  }): Promise<DadosPainelGerencial> {
    const { competencia, empresaFiltro = "todas" } = params

    // 0. Obter empresas cadastradas para suporte dinâmico (Monteiro, SJE, Caicó, Patos etc.)
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

    // Mapear filtro para UUID
    let targetEmpresaId: string | undefined = undefined
    if (empresaFiltro && empresaFiltro !== "todas") {
      const encontrada = listaEmpresas.find(
        (e) =>
          e.slug?.toLowerCase() === empresaFiltro.toLowerCase() ||
          e.id === empresaFiltro ||
          (empresaFiltro === "monteiro" && e.id === ID_EMPRESA_MONTEIRO) ||
          (empresaFiltro === "sje" && e.id === ID_EMPRESA_SJE),
      )
      if (encontrada) {
        targetEmpresaId = encontrada.id
      } else if (empresaFiltro === "monteiro") {
        targetEmpresaId = ID_EMPRESA_MONTEIRO
      } else if (empresaFiltro === "sje") {
        targetEmpresaId = ID_EMPRESA_SJE
      } else {
        targetEmpresaId = empresaFiltro
      }
    }

    // Período da competência selecionada (ex: '2026-09')
    const [anoStr, mesStr] = competencia.split("-")
    const ano = Number(anoStr) || 2026
    const mes = Number(mesStr) || 9

    const primeiroDia = `${competencia}-01`
    const ultimoDiaNum = new Date(ano, mes, 0).getDate()
    const ultimoDia = `${competencia}-${String(ultimoDiaNum).padStart(2, "0")}`

    // 12 meses atrás para histórico
    const dataInicio12Meses = new Date(ano, mes - 12, 1)
      .toISOString()
      .split("T")[0]

    // Consultas paralelas seguras via Supabase client
    const [
      cargasCompetenciaRes,
      cargas12MesesRes,
      ordensServicoRes,
      competenciasFolhaRes,
      linhasMonteiroRes,
      linhasSjeRes,
      terceirosMonteiroRes,
      terceirosSjeRes,
      precosRes,
      feriasMonteiroRes,
      feriasSjeRes,
      examesMonteiroRes,
      examesSjeRes,
      materiaisMonteiroRes,
      materiaisSjeRes,
      materiaisAlvoRes,
    ] = await Promise.all([
      // Cargas do mês
      (async () => {
        let q = (supabase as any)
          .from("cargas")
          .select("*")
          .gte("data", primeiroDia)
          .lte("data", ultimoDia)
          .order("data", { ascending: false })
        if (targetEmpresaId) q = q.eq("empresa_id", targetEmpresaId)
        const { data, error } = await q
        if (error) console.warn("Erro ao buscar cargas da competência:", error)
        return data || []
      })(),

      // Cargas dos últimos 12 meses para gráfico
      (async () => {
        let q = (supabase as any)
          .from("cargas")
          .select("id, data, volume_m3, carga_zerada, empresa_id, traco_nome")
          .gte("data", dataInicio12Meses)
          .lte("data", ultimoDia)
          .order("data", { ascending: true })
        if (targetEmpresaId) q = q.eq("empresa_id", targetEmpresaId)
        const { data, error } = await q
        if (error) console.warn("Erro ao buscar cargas dos 12 meses:", error)
        return data || []
      })(),

      // Ordens de Serviço do período (para cruzar com clientes e obras)
      (async () => {
        let q = (supabase as any)
          .from("ordens_servico")
          .select(
            "id, empresa_id, carga_id, cliente_id, destinatario_nome, nome_obra, data_emissao, itens",
          )
          .gte("data_emissao", primeiroDia)
          .lte("data_emissao", ultimoDia)
        if (targetEmpresaId) q = q.eq("empresa_id", targetEmpresaId)
        const { data, error } = await q
        if (error) console.warn("Erro ao buscar ordens de serviço:", error)
        return data || []
      })(),

      // Competências disponíveis da folha
      (async () => {
        const { data } = await (supabase as any)
          .from("folha_competencias")
          .select("competencia")
          .order("competencia", { ascending: false })
        const comps = Array.from(
          new Set((data || []).map((c: any) => c.competencia).filter(Boolean)),
        ) as string[]
        return comps.length > 0 ? comps : [competencia]
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

      // Preços de materiais para cálculo de custo
      ConcreteiraService.getPrecosMaterial(targetEmpresaId).catch(() => []),

      // Férias Monteiro e SJE
      targetEmpresaId === ID_EMPRESA_SJE
        ? Promise.resolve([])
        : FeriasService.getControleFerias(ID_EMPRESA_MONTEIRO).catch(() => []),
      targetEmpresaId === ID_EMPRESA_MONTEIRO
        ? Promise.resolve([])
        : FeriasService.getControleFerias(ID_EMPRESA_SJE).catch(() => []),

      // Exames Monteiro e SJE
      targetEmpresaId === ID_EMPRESA_SJE
        ? Promise.resolve([])
        : ExamesService.getFuncionariosComExames(ID_EMPRESA_MONTEIRO).catch(
            () => [],
          ),
      targetEmpresaId === ID_EMPRESA_MONTEIRO
        ? Promise.resolve([])
        : ExamesService.getFuncionariosComExames(ID_EMPRESA_SJE).catch(
            () => [],
          ),

      // Materiais com saldo e estoque mínimo
      targetEmpresaId === ID_EMPRESA_SJE
        ? Promise.resolve([])
        : ConcreteiraService.getMateriais(ID_EMPRESA_MONTEIRO).catch(() => []),
      targetEmpresaId === ID_EMPRESA_MONTEIRO
        ? Promise.resolve([])
        : ConcreteiraService.getMateriais(ID_EMPRESA_SJE).catch(() => []),

      // Materiais da unidade específica selecionada (se não for "todas", nem monteiro nem sje fixos)
      targetEmpresaId &&
      targetEmpresaId !== ID_EMPRESA_MONTEIRO &&
      targetEmpresaId !== ID_EMPRESA_SJE
        ? ConcreteiraService.getMateriais(targetEmpresaId).catch(() => [])
        : Promise.resolve([]),
    ])

    // --- CÁLCULO DE KPIS DO PERÍODO ---
    const cargasValidas = cargasCompetenciaRes.filter(
      (c: any) => !c.carga_zerada,
    )
    const totalCargas = cargasCompetenciaRes.length
    const qtdCargasValidas = cargasValidas.length
    const cargasZeradas = totalCargas - qtdCargasValidas

    let volumeTotalM3 = 0
    let custoTotalInsumos = 0
    let faturamentoEstimado = 0
    const cidadesSet = new Set<string>()
    const clientesSet = new Set<string>()
    const obrasSet = new Set<string>()

    // Mapeamento de OSs por carga_id
    const osPorCargaId = new Map<string, any>()
    ordensServicoRes.forEach((os: any) => {
      if (os.carga_id) osPorCargaId.set(os.carga_id, os)
      if (os.destinatario_nome)
        clientesSet.add(os.destinatario_nome.trim().toUpperCase())
      if (os.nome_obra) obrasSet.add(os.nome_obra.trim().toUpperCase())
    })

    cargasValidas.forEach((c: any) => {
      const vol = Number(c.volume_m3) || 0
      volumeTotalM3 += vol
      if (c.cidade_nome) cidadesSet.add(c.cidade_nome.trim().toUpperCase())

      // Cálculo de custo dos insumos da carga
      const custo = ConcreteiraService.calcularCustoCarga(c, precosRes)
      custoTotalInsumos += custo.total

      // Faturamento estimado: se a OS vinculada tiver itens com valor ou baseado no preço de venda padrão
      const os = osPorCargaId.get(c.id)
      if (os?.itens && Array.isArray(os.itens)) {
        os.itens.forEach((it: any) => {
          if (it.valor_total) faturamentoEstimado += Number(it.valor_total) || 0
        })
      }
    })

    volumeTotalM3 = Math.round(volumeTotalM3 * 10) / 10
    custoTotalInsumos = Math.round(custoTotalInsumos * 100) / 100
    const mediaPorCargaM3 =
      qtdCargasValidas > 0
        ? Math.round((volumeTotalM3 / qtdCargasValidas) * 100) / 100
        : 0
    const custoMedioM3 =
      volumeTotalM3 > 0
        ? Math.round((custoTotalInsumos / volumeTotalM3) * 100) / 100
        : 0

    // --- CÁLCULO DA FOLHA DO MÊS (REUTILIZANDO LÓGICA OFICIAL DA ABA GERAL) ---
    const calcMonteiro = calcularValorRealEmpresa(
      linhasMonteiroRes,
      terceirosMonteiroRes,
    )
    const calcSje = calcularValorRealEmpresa(linhasSjeRes, terceirosSjeRes)

    let totalFolhaLiquido = 0
    let folhaFuncionarios = 0
    let folhaTerceiros = 0
    let folhaQtdPessoas = 0
    const folhaDisponivel =
      empresaFiltro === "monteiro"
        ? calcMonteiro.linhasCount > 0
        : empresaFiltro === "sje"
          ? calcSje.linhasCount > 0
          : calcMonteiro.linhasCount > 0 || calcSje.linhasCount > 0

    if (empresaFiltro === "monteiro") {
      totalFolhaLiquido = calcMonteiro.valorReal
      folhaFuncionarios = calcMonteiro.totalFuncionarios
      folhaTerceiros = calcMonteiro.totalTerceiros
      folhaQtdPessoas = calcMonteiro.qtdFuncionarios + calcMonteiro.qtdTerceiros
    } else if (empresaFiltro === "sje") {
      totalFolhaLiquido = calcSje.valorReal
      folhaFuncionarios = calcSje.totalFuncionarios
      folhaTerceiros = calcSje.totalTerceiros
      folhaQtdPessoas = calcSje.qtdFuncionarios + calcSje.qtdTerceiros
    } else {
      // Consolidado das duas empresas (MONTEIRO + SJE)
      totalFolhaLiquido =
        Math.round((calcMonteiro.valorReal + calcSje.valorReal) * 100) / 100
      folhaFuncionarios =
        Math.round(
          (calcMonteiro.totalFuncionarios + calcSje.totalFuncionarios) * 100,
        ) / 100
      folhaTerceiros =
        Math.round(
          (calcMonteiro.totalTerceiros + calcSje.totalTerceiros) * 100,
        ) / 100
      folhaQtdPessoas =
        calcMonteiro.qtdFuncionarios +
        calcMonteiro.qtdTerceiros +
        calcSje.qtdFuncionarios +
        calcSje.qtdTerceiros
    }

    // --- EVOLUÇÃO MENSAL (ÚLTIMOS 12 MESES) ---
    // Agrupa cargas12MesesRes por 'YYYY-MM'
    const mesesMapa = new Map<string, {
      volumeM3: number
      cargas: number
      custoInsumos: number
    }>()

    // Inicializa todos os últimos 12 meses cronologicamente para garantir que não haja saltos
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ano, mes - 1 - i, 1)
      const a = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const compKey = `${a}-${m}`
      mesesMapa.set(compKey, { volumeM3: 0, cargas: 0, custoInsumos: 0 })
    }

    cargas12MesesRes.forEach((c: any) => {
      if (!c.data) return
      const compKey = c.data.slice(0, 7)
      if (mesesMapa.has(compKey)) {
        const item = mesesMapa.get(compKey)!
        item.cargas += 1
        if (!c.carga_zerada) {
          item.volumeM3 += Number(c.volume_m3) || 0
        }
      }
    })

    const nomesMeses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ]

    const evolucao12Meses: EvolucaoMensalItem[] = Array.from(
      mesesMapa.entries(),
    ).map(([compKey, val]) => {
      const [y, m] = compKey.split("-")
      const mesIdx = Number(m) - 1
      const rotulo = `${nomesMeses[mesIdx]}/${y.slice(2)}`
      const volRounded = Math.round(val.volumeM3 * 10) / 10
      return {
        competencia: compKey,
        rotulo,
        volumeM3: volRounded,
        cargas: val.cargas,
        mediaM3PorCarga:
          val.cargas > 0 ? Math.round((volRounded / val.cargas) * 10) / 10 : 0,
        custoInsumos: 0,
      }
    })

    // --- TOP OBRAS / CLIENTES DO PERÍODO ---
    // Agrupamento por cliente/obra com base nas Ordens de Serviço do período e nas cargas vinculadas
    const rankingDestinatarios = new Map<string, {
      nome: string
      tipo: "cliente" | "obra"
      volume: number
      cargas: number
      detalhe?: string
    }>()

    // Prioridade 1: Ordens de serviço da competência
    ordensServicoRes.forEach((os: any) => {
      const nomeCliente = os.destinatario_nome?.trim().toUpperCase()
      const nomeObra = os.nome_obra?.trim().toUpperCase()
      const label = nomeObra
        ? `${nomeObra} (${nomeCliente || "Cliente"})`
        : nomeCliente || "Consumidor Final"

      let vol = 0
      if (os.itens && Array.isArray(os.itens)) {
        os.itens.forEach((it: any) => {
          vol += Number(it.quantidade) || 0
        })
      }

      if (!rankingDestinatarios.has(label)) {
        rankingDestinatarios.set(label, {
          nome: label,
          tipo: nomeObra ? "obra" : "cliente",
          volume: 0,
          cargas: 0,
          detalhe: nomeCliente,
        })
      }
      const item = rankingDestinatarios.get(label)!
      item.volume += vol
      item.cargas += 1
    })

    // Se houver cargas que não têm OS vinculada, agrupa por cidade ou observação
    const rankingCidadesMap = new Map<string, {
      nome: string
      volume: number
      cargas: number
    }>()

    cargasValidas.forEach((c: any) => {
      const cidade =
        c.cidade_nome?.trim().toUpperCase() || "Cidade não informada"
      if (!rankingCidadesMap.has(cidade)) {
        rankingCidadesMap.set(cidade, { nome: cidade, volume: 0, cargas: 0 })
      }
      const item = rankingCidadesMap.get(cidade)!
      item.volume += Number(c.volume_m3) || 0
      item.cargas += 1
    })

    const topCidades: TopRankingItem[] = Array.from(rankingCidadesMap.values())
      .sort((a, b) => b.volume - a.volume)
      .map((c) => ({
        id: c.nome,
        nome: c.nome,
        tipo: "cidade",
        cargas: c.cargas,
        volumeM3: Math.round(c.volume * 10) / 10,
        percentual:
          volumeTotalM3 > 0
            ? Math.round((c.volume / volumeTotalM3) * 1000) / 10
            : 0,
      }))

    // Ordenar ranking de obras/clientes
    const topClientesObras: TopRankingItem[] = Array.from(
      rankingDestinatarios.values(),
    )
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map((r, idx) => ({
        id: `rank-${idx}-${r.nome}`,
        nome: r.nome,
        tipo: r.tipo,
        cargas: r.cargas,
        volumeM3: Math.round(r.volume * 10) / 10,
        percentual:
          volumeTotalM3 > 0
            ? Math.round((r.volume / volumeTotalM3) * 1000) / 10
            : 0,
        destaque: r.detalhe,
      }))

    // --- MIX POR TRAÇO / TIPO DE CONCRETO ---
    const tracosMapa = new Map<string, {
      nome: string
      volume: number
      cargas: number
    }>()
    cargasValidas.forEach((c: any) => {
      const traco = c.traco_nome?.trim() || "Traço Padrão / Não especificado"
      if (!tracosMapa.has(traco)) {
        tracosMapa.set(traco, { nome: traco, volume: 0, cargas: 0 })
      }
      const item = tracosMapa.get(traco)!
      item.volume += Number(c.volume_m3) || 0
      item.cargas += 1
    })

    const mixTracos: MixTracoItem[] = Array.from(tracosMapa.values())
      .sort((a, b) => b.volume - a.volume)
      .map((t) => ({
        nome: t.nome,
        cargas: t.cargas,
        volumeM3: Math.round(t.volume * 10) / 10,
        percentual:
          volumeTotalM3 > 0
            ? Math.round((t.volume / volumeTotalM3) * 1000) / 10
            : 0,
      }))

    // --- ALERTAS OPERACIONAIS ---
    // 1. FÉRIAS marcadas nos próximos 60 dias (ou atrasadas do ano)
    const todasFerias = [...feriasMonteiroRes, ...feriasSjeRes]
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const em60Dias = new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000)

    const feriasProximas = todasFerias
      .filter((f) => {
        if (!f.ferias) return false
        const dt = new Date(f.ferias + "T00:00:00")
        return dt >= hoje && dt <= em60Dias
      })
      .sort((a, b) => (a.ferias || "").localeCompare(b.ferias || ""))

    // 2. EXAMES ASO VENCIDOS OU A VENCER EM 30 DIAS
    const todosFuncionariosExames: FuncionarioComExames[] = [
      ...examesMonteiroRes,
      ...examesSjeRes,
    ]
    const examesCriticos: Array<{
      funcionarioNome: string
      funcao: string
      exameNome: string
      status: "VENCIDO" | "VENCENDO_30_DIAS" | "PENDENTE"
      dias: number
      validade: string | null
    }> = []

    todosFuncionariosExames
      .filter((f) => f.ativo)
      .forEach((f) => {
        // Exames vencidos
        const listaExames = Object.values(f.exames || {})
        for (const e of listaExames) {
          if (e.status === "VENCIDO") {
            examesCriticos.push({
              funcionarioNome: f.nome,
              funcao: f.funcao,
              exameNome: e.nome,
              status: "VENCIDO",
              dias: e.diasParaVencer ?? 0,
              validade: e.dataValidade,
            })
          }
        }

        // Exames a vencer em até 30 dias
        const vencendo30 = f.examesAVencer30Dias || []
        for (const e of vencendo30) {
          examesCriticos.push({
            funcionarioNome: f.nome,
            funcao: f.funcao,
            exameNome: e.nome,
            status: "VENCENDO_30_DIAS",
            dias: e.diasParaVencer ?? 0,
            validade: e.dataValidade,
          })
        }
      })

    // Ordenar exames: Vencidos primeiro, depois dias menores
    examesCriticos.sort((a, b) => a.dias - b.dias)

    // 3. ESTOQUE E SALDO DE INSUMOS
    const todosMateriais: Material[] = [
      ...materiaisMonteiroRes,
      ...materiaisSjeRes,
      ...materiaisAlvoRes,
    ]
    const estoqueBaixo: Array<{
      material: Material
      saldo: number
      minimo: number
      defasagem: number
      unidade: string
      empresaId?: string
    }> = []

    todosMateriais
      .filter(
        (m) =>
          m.controla_estoque !== false &&
          m.estoque_minimo > 0 &&
          (m.codigo?.toLowerCase() === "cimento" ||
            m.codigo?.toLowerCase() === "aditivo"),
      )
      .forEach((m) => {
        const saldo = Number(m.saldo || 0)
        const minimo = Number(m.estoque_minimo || 0)
        // Alerta de estoque baixo só para insumos com saldo ativo em operação (> 0 e < mínimo)
        if (saldo > 0 && saldo < minimo) {
          estoqueBaixo.push({
            material: m,
            saldo,
            minimo,
            defasagem: Math.round((minimo - saldo) * 100) / 100,
            unidade: m.unidade || "kg",
            empresaId: m.empresa_id,
          })
        }
      })

    estoqueBaixo.sort((a, b) => b.defasagem - a.defasagem)

    // Montagem estruturada do Saldo de Insumos para o Painel
    // Se visão for 'monteiro', exibe materiais de Monteiro
    // Se visão for 'sje', exibe materiais de SJE
    // Se visão for outra (ex: Caicó, Patos), exibe materiais correspondentes (ou vazios)
    // Se visão for 'todas' (consolidado), consolida materiais por código/nome com saldo somado e discriminação
    const saldosInsumos: ItemEstoqueInsumo[] = []

    const isMonteiro =
      empresaFiltro === "monteiro" || targetEmpresaId === ID_EMPRESA_MONTEIRO
    const isSje = empresaFiltro === "sje" || targetEmpresaId === ID_EMPRESA_SJE
    const isConsolidado = !empresaFiltro || empresaFiltro === "todas"

    // Função auxiliar para garantir que a seção Saldo de Insumos exiba SOMENTE cimento e aditivo
    const ehInsumoSaldoMonitorado = (cod?: string | null) => {
      const c = cod?.toLowerCase()
      return c === "cimento" || c === "aditivo"
    }

    if (isMonteiro) {
      materiaisMonteiroRes
        .filter((m) => ehInsumoSaldoMonitorado(m.codigo))
        .forEach((m) => {
          const saldo = Number(m.saldo || 0)
          const minimo = Number(m.estoque_minimo || 0)
          const controla = m.controla_estoque !== false
          const abaixoMinimo = controla && minimo > 0 && saldo < minimo
          saldosInsumos.push({
            id: m.id,
            nome: m.nome,
            codigo: m.codigo,
            unidade: m.unidade || "kg",
            controlaEstoque: controla,
            estoqueMinimo: minimo,
            saldo,
            saldoMonteiro: saldo,
            abaixoMinimo,
            defasagem: abaixoMinimo
              ? Math.round((minimo - saldo) * 100) / 100
              : 0,
            empresaId: m.empresa_id,
          })
        })
    } else if (isSje) {
      materiaisSjeRes
        .filter((m) => ehInsumoSaldoMonitorado(m.codigo))
        .forEach((m) => {
          const saldo = Number(m.saldo || 0)
          const minimo = Number(m.estoque_minimo || 0)
          const controla = m.controla_estoque !== false
          const abaixoMinimo = controla && minimo > 0 && saldo < minimo
          saldosInsumos.push({
            id: m.id,
            nome: m.nome,
            codigo: m.codigo,
            unidade: m.unidade || "kg",
            controlaEstoque: controla,
            estoqueMinimo: minimo,
            saldo,
            saldoSje: saldo,
            abaixoMinimo,
            defasagem: abaixoMinimo
              ? Math.round((minimo - saldo) * 100) / 100
              : 0,
            empresaId: m.empresa_id,
          })
        })
    } else if (isConsolidado) {
      // Consolidado: agrupa insumos por código (ou nome) — SOMENTE cimento e aditivo
      const mapaConsolidado = new Map<string, {
        id: string
        nome: string
        codigo: string
        unidade: string
        controlaEstoque: boolean
        estoqueMinimo: number
        saldoTotal: number
        saldoMonteiro: number
        saldoSje: number
        minimoMonteiro?: number
        minimoSje?: number
        abaixoMinimo: boolean
        defasagem: number
      }>()

      // Primeiro Monteiro
      materiaisMonteiroRes
        .filter((m) => ehInsumoSaldoMonitorado(m.codigo))
        .forEach((m) => {
          const key = m.codigo || m.nome.toLowerCase()
          const saldo = Number(m.saldo || 0)
          const minimo = Number(m.estoque_minimo || 0)
          const controla = m.controla_estoque !== false
          const abaixo = controla && minimo > 0 && saldo < minimo
          mapaConsolidado.set(key, {
            id: m.id,
            nome: m.nome,
            codigo: m.codigo,
            unidade: m.unidade || "kg",
            controlaEstoque: controla,
            estoqueMinimo: minimo,
            saldoTotal: saldo,
            saldoMonteiro: saldo,
            saldoSje: 0,
            minimoMonteiro: minimo,
            minimoSje: 0,
            abaixoMinimo: abaixo,
            defasagem: abaixo ? minimo - saldo : 0,
          })
        })

      // Depois SJE somando / complementando
      materiaisSjeRes
        .filter((m) => ehInsumoSaldoMonitorado(m.codigo))
        .forEach((m) => {
          const key = m.codigo || m.nome.toLowerCase()
          const saldo = Number(m.saldo || 0)
          const minimo = Number(m.estoque_minimo || 0)
          const controla = m.controla_estoque !== false

          if (mapaConsolidado.has(key)) {
            const item = mapaConsolidado.get(key)!
            item.saldoSje = saldo
            item.saldoTotal = Math.round((item.saldoTotal + saldo) * 100) / 100
            item.minimoSje = minimo
            item.estoqueMinimo = Math.max(item.estoqueMinimo, minimo)
            // Se qualquer das unidades ou o total estiver crítico
            const abaixoSje = controla && minimo > 0 && saldo < minimo
            if (abaixoSje) item.abaixoMinimo = true
          } else {
            const abaixo = controla && minimo > 0 && saldo < minimo
            mapaConsolidado.set(key, {
              id: m.id,
              nome: m.nome,
              codigo: m.codigo,
              unidade: m.unidade || "kg",
              controlaEstoque: controla,
              estoqueMinimo: minimo,
              saldoTotal: saldo,
              saldoMonteiro: 0,
              saldoSje: saldo,
              minimoMonteiro: 0,
              minimoSje: minimo,
              abaixoMinimo: abaixo,
              defasagem: abaixo ? minimo - saldo : 0,
            })
          }
        })

      mapaConsolidado.forEach((val) => {
        saldosInsumos.push({
          id: val.id,
          nome: val.nome,
          codigo: val.codigo,
          unidade: val.unidade,
          controlaEstoque: val.controlaEstoque,
          estoqueMinimo: val.estoqueMinimo,
          saldo: val.saldoTotal,
          saldoMonteiro: val.saldoMonteiro,
          saldoSje: val.saldoSje,
          minimoMonteiro: (val as any).minimoMonteiro || 0,
          minimoSje: (val as any).minimoSje || 0,
          abaixoMinimo: val.abaixoMinimo,
          defasagem: Math.round(val.defasagem * 100) / 100,
        })
      })
    } else {
      // Outra unidade individual (ex.: Caicó ou Patos)
      // Usa os materiais reais da unidade consultados do banco (materiaisAlvoRes)
      const matsAlvoControlados = materiaisAlvoRes.filter((m) =>
        ehInsumoSaldoMonitorado(m.codigo),
      )
      if (matsAlvoControlados.length > 0) {
        matsAlvoControlados.forEach((m) => {
          const saldo = Number(m.saldo || 0)
          const minimo = Number(m.estoque_minimo || 0)
          const controla = m.controla_estoque !== false
          // Alerta de estoque baixo só se a unidade tiver saldo em operação (> 0) e abaixo do mínimo
          const abaixoMinimo =
            controla && minimo > 0 && saldo > 0 && saldo < minimo
          saldosInsumos.push({
            id: m.id,
            nome: m.nome,
            codigo: m.codigo,
            unidade: m.unidade || "kg",
            controlaEstoque: controla,
            estoqueMinimo: minimo,
            saldo,
            abaixoMinimo,
            defasagem: abaixoMinimo
              ? Math.round((minimo - saldo) * 100) / 100
              : 0,
            empresaId: m.empresa_id,
          })
        })
      } else {
        const catalogoPadrao = [
          {
            codigo: "cimento",
            nome: "CP II F-40 / CP V ARI",
            unidade: "kg",
            controla: true,
            min: 15000,
          },
          {
            codigo: "aditivo",
            nome: "Aditivo Plastificante",
            unidade: "litros",
            controla: true,
            min: 900,
          },
        ]
        catalogoPadrao.forEach((p) => {
          saldosInsumos.push({
            id: `zerado-${p.codigo}`,
            nome: p.nome,
            codigo: p.codigo,
            unidade: p.unidade,
            controlaEstoque: p.controla,
            estoqueMinimo: p.min,
            saldo: 0,
            abaixoMinimo: false,
            defasagem: 0,
            empresaId: targetEmpresaId,
          })
        })
      }
    }

    // --- CÁLCULO DETALHADO DO BLOCO: CUSTOS DE INSUMOS ---
    // Definição dos materiais monitorados
    const catalogoInsumosDef = [
      { codigo: "cimento", nome: "Cimento CP II / CP V", unidade: "kg" },
      { codigo: "aditivo", nome: "Aditivo Plastificante", unidade: "L" },
      { codigo: "areia", nome: "Areia", unidade: "kg" },
      { codigo: "brita12", nome: "Brita 12", unidade: "kg" },
      { codigo: "brita19", nome: "Brita 19", unidade: "kg" },
      { codigo: "po_pedra", nome: "Pó de Pedra", unidade: "kg" },
      { codigo: "agua", nome: "Água", unidade: "L" },
    ]

    const mapaConsumoInsumos: Record<string, {
      quantidadeTotal: number
      custoTotal: number
      porEmpresaQtd: Record<string, number>
      porEmpresaCusto: Record<string, number>
    }> = {
      cimento: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
      aditivo: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
      areia: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
      brita12: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
      brita19: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
      po_pedra: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
      agua: {
        quantidadeTotal: 0,
        custoTotal: 0,
        porEmpresaQtd: {},
        porEmpresaCusto: {},
      },
    }

    cargasValidas.forEach((c: any) => {
      const empId = c.empresa_id || "desconhecida"
      const cBreakdown = ConcreteiraService.calcularCustoCarga(c, precosRes)

      const consumoMat: Record<string, {
        qtd: number
        custo: number
      }> = {
        cimento: {
          qtd: Number(c.consumo_cimento) || 0,
          custo: cBreakdown.cimento,
        },
        aditivo: {
          qtd: Number(c.consumo_aditivo) || 0,
          custo: cBreakdown.aditivo,
        },
        areia: { qtd: Number(c.consumo_areia) || 0, custo: cBreakdown.areia },
        brita12: {
          qtd: Number(c.consumo_brita12) || 0,
          custo: cBreakdown.brita12,
        },
        brita19: {
          qtd: Number(c.consumo_brita19) || 0,
          custo: cBreakdown.brita19,
        },
        po_pedra: {
          qtd: Number(c.consumo_po_pedra) || 0,
          custo: cBreakdown.po_pedra,
        },
        agua: { qtd: Number(c.consumo_agua) || 0, custo: cBreakdown.agua },
      }

      Object.entries(consumoMat).forEach(([cod, vals]) => {
        if (!mapaConsumoInsumos[cod]) {
          mapaConsumoInsumos[cod] = {
            quantidadeTotal: 0,
            custoTotal: 0,
            porEmpresaQtd: {},
            porEmpresaCusto: {},
          }
        }
        mapaConsumoInsumos[cod].quantidadeTotal += vals.qtd
        mapaConsumoInsumos[cod].custoTotal += vals.custo

        mapaConsumoInsumos[cod].porEmpresaQtd[empId] =
          (mapaConsumoInsumos[cod].porEmpresaQtd[empId] || 0) + vals.qtd
        mapaConsumoInsumos[cod].porEmpresaCusto[empId] =
          (mapaConsumoInsumos[cod].porEmpresaCusto[empId] || 0) + vals.custo
      })
    })

    const custoTotalGeralCalculado = Object.values(mapaConsumoInsumos).reduce(
      (acc, item) => acc + item.custoTotal,
      0,
    )

    // Mapa de densidades dos materiais por empresa (lendo da tabela materiais)
    // Se visão for de uma empresa individual, busca da própria unidade.
    // Se visão for "todas", calcula o volume em m³ por empresa ponderado pelas cargas/consumo de cada unidade.
    const densidadePadrao: Record<string, number> = {
      areia: 1.5,
      brita12: 1.38,
      brita19: 1.44,
      po_pedra: 1.4,
    }

    // Indexar materiais por empresa_id -> codigo -> densidade
    const densidadesPorEmpresaEMaterial = new Map<string, Map<string, number>>()
    const todosMateriaisCadastrados: Material[] = [
      ...materiaisMonteiroRes,
      ...materiaisSjeRes,
      ...materiaisAlvoRes,
    ]

    todosMateriaisCadastrados.forEach((m) => {
      const empId = m.empresa_id || "sem_empresa"
      if (!densidadesPorEmpresaEMaterial.has(empId)) {
        densidadesPorEmpresaEMaterial.set(empId, new Map<string, number>())
      }
      const cod = m.codigo?.toLowerCase()
      if (cod && m.densidade != null && Number(m.densidade) > 0) {
        densidadesPorEmpresaEMaterial.get(empId)!.set(cod, Number(m.densidade))
      }
    })

    const obterDensidadeMaterial = (
      empId: string | undefined,
      codigo: string,
    ): number => {
      if (empId && densidadesPorEmpresaEMaterial.has(empId)) {
        const dens = densidadesPorEmpresaEMaterial.get(empId)!.get(codigo)
        if (dens && dens > 0) return dens
      }
      return densidadePadrao[codigo] || 1.0
    }

    const materiaisConversiveisM3 = new Set([
      "areia",
      "brita12",
      "brita19",
      "po_pedra",
    ])

    const itensCustosInsumos: ItemCustoInsumo[] = catalogoInsumosDef.map(
      (def) => {
        const dadosCons = mapaConsumoInsumos[def.codigo] || {
          quantidadeTotal: 0,
          custoTotal: 0,
          porEmpresaQtd: {},
          porEmpresaCusto: {},
        }
        const custoTot = Math.round(dadosCons.custoTotal * 100) / 100
        const qtdTot = Math.round(dadosCons.quantidadeTotal * 100) / 100
        const custoUnitMedio =
          qtdTot > 0 ? Math.round((custoTot / qtdTot) * 10000) / 10000 : 0
        const perc =
          custoTotalGeralCalculado > 0
            ? Math.round((custoTot / custoTotalGeralCalculado) * 1000) / 10
            : 0

        // Conversão kg -> m³ para areia, brita12, brita19 e po_pedra (Cimento não converte; aditivo/água em L)
        let densidadeItem: number | undefined = undefined
        let volumeM3Item: number | undefined = undefined

        if (materiaisConversiveisM3.has(def.codigo)) {
          if (targetEmpresaId) {
            // Unidade individual selecionada
            densidadeItem = obterDensidadeMaterial(targetEmpresaId, def.codigo)
            if (densidadeItem > 0) {
              // m³ = kg / (densidade * 1000)
              volumeM3Item =
                Math.round((qtdTot / (densidadeItem * 1000)) * 100) / 100
            }
          } else {
            // Visão consolidada: calcula volume m³ somando empresa a empresa com suas densidades próprias
            let volSoma = 0
            Object.entries(dadosCons.porEmpresaQtd).forEach(([eId, qtdEmp]) => {
              const d = obterDensidadeMaterial(eId, def.codigo)
              if (d > 0) {
                volSoma += qtdEmp / (d * 1000)
              }
            })
            volumeM3Item = Math.round(volSoma * 100) / 100
            // Densidade média ponderada aparente para exibição se houver consumo
            if (volumeM3Item > 0 && qtdTot > 0) {
              densidadeItem =
                Math.round((qtdTot / (volumeM3Item * 1000)) * 100) / 100
            } else {
              densidadeItem = obterDensidadeMaterial(undefined, def.codigo)
            }
          }
        }

        return {
          codigo: def.codigo,
          nome: def.nome,
          unidade: def.unidade,
          quantidadeConsumida: qtdTot,
          custoTotal: custoTot,
          custoUnitarioMedio: custoUnitMedio,
          percentualDoTotal: perc,
          densidade: densidadeItem,
          quantidadeM3: volumeM3Item,
          quantidadePorEmpresa: dadosCons.porEmpresaQtd,
          custoPorEmpresa: dadosCons.porEmpresaCusto,
        }
      },
    )

    // (1) SOMATÓRIO BRITAS = B12 + B19 (somando quantidade em kg, volume em m³ e custo total)
    const itemB12 = itensCustosInsumos.find((it) => it.codigo === "brita12")
    const itemB19 = itensCustosInsumos.find((it) => it.codigo === "brita19")
    const somatorioBritasKg =
      Math.round(
        ((itemB12?.quantidadeConsumida || 0) +
          (itemB19?.quantidadeConsumida || 0)) *
          100,
      ) / 100
    const somatorioBritasM3 =
      Math.round(
        ((itemB12?.quantidadeM3 || 0) + (itemB19?.quantidadeM3 || 0)) * 100,
      ) / 100
    const somatorioBritasCusto =
      Math.round(
        ((itemB12?.custoTotal || 0) + (itemB19?.custoTotal || 0)) * 100,
      ) / 100
    const somatorioBritasPerc =
      custoTotalGeralCalculado > 0
        ? Math.round((somatorioBritasCusto / custoTotalGeralCalculado) * 1000) /
          10
        : 0
    const somatorioBritasCustoM3 =
      somatorioBritasM3 > 0
        ? Math.round((somatorioBritasCusto / somatorioBritasM3) * 100) / 100
        : 0

    const somatorioBritasInfo: SomatorioBritasInfo = {
      quantidadeKg: somatorioBritasKg,
      quantidadeM3: somatorioBritasM3,
      custoTotal: somatorioBritasCusto,
      percentualDoTotal: somatorioBritasPerc,
      custoUnitarioMedioM3: somatorioBritasCustoM3,
    }

    const resumoCustosInsumos: ResumoCustosInsumos = {
      itens: itensCustosInsumos,
      custoTotalGeral: Math.round(custoTotalGeralCalculado * 100) / 100,
      custoMedioPorM3:
        volumeTotalM3 > 0
          ? Math.round((custoTotalGeralCalculado / volumeTotalM3) * 100) / 100
          : 0,
      volumeTotalM3,
      totalCargasValidas: qtdCargasValidas,
      somatorioBritas: somatorioBritasInfo,
    }

    const totalCriticos =
      examesCriticos.filter((e) => e.status === "VENCIDO").length +
      estoqueBaixo.length
    const totalAlertas =
      feriasProximas.length +
      examesCriticos.filter((e) => e.status === "VENCENDO_30_DIAS").length

    return {
      competenciaSelecionada: competencia,
      competenciasDisponiveis: competenciasFolhaRes,
      visaoEmpresa: empresaFiltro,
      kpis: {
        totalCargas,
        cargasZeradas,
        cargasValidas: qtdCargasValidas,
        volumeTotalM3,
        mediaPorCargaM3,
        faturamentoEstimado,
        custoTotalInsumos: Math.round(custoTotalGeralCalculado * 100) / 100,
        custoMedioM3:
          volumeTotalM3 > 0
            ? Math.round((custoTotalGeralCalculado / volumeTotalM3) * 100) / 100
            : 0,
        numeroObrasAtendidas: obrasSet.size,
        numeroCidadesAtendidas: cidadesSet.size,
        numeroClientesAtendidos: clientesSet.size,
        folhaDisponivel,
        totalFolhaLiquido,
        folhaFuncionarios,
        folhaTerceiros,
        folhaQtdPessoas,
        folhaCompetencia: competencia,
      },
      evolucao12Meses,
      topClientesObras,
      topCidades,
      mixTracos,
      saldosInsumos,
      custosInsumos: resumoCustosInsumos,
      alertas: {
        totalCriticos,
        totalAlertas,
        feriasProximas,
        examesCriticos,
        estoqueBaixo,
      },
    }
  },
}
