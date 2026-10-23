import { supabase } from "@/lib/supabase/client"
import { FolhaService } from "@/services/folha"
import { FolhaPagamentoLinha, FolhaTerceiro } from "@/types/folha"
import {
  calcularProducaoTotal,
  calcularComissaoVendas,
} from "@/lib/folha-calculos"

export const ID_EMPRESA_MONTEIRO = "11111111-1111-1111-1111-111111111111"
export const ID_EMPRESA_SJE = "22222222-2222-2222-2222-222222222222"
export const ID_EMPRESA_PATOS = "2da7537f-9f91-42b9-8020-f53c8fb52ec7"
export const ID_EMPRESA_CAICO = "43208b25-5cce-4b94-94fd-9f7639a0960c"

export interface DadosProducaoUnidade {
  cargas: number
  volumeM3: number
}

export interface ConsumosUnidade {
  cimentoKg: number
  brita1Kg: number
  brita2Kg: number
  areiaKg: number
  poPedraKg: number
  aditivoL: number
  aguaL: number
}

export interface ResumoFolhaUnidade {
  pessoas: number
  salariosQuinzena: number
  salariosMensal: number
  producaoAPagar: number
  comissoesAjuda: number
  terceiros: number
  totalUnidade: number
}

export type UnidadeConsolidadoSlug = "monteiro" | "sje" | "patos" | "caico"

export interface ItemUnidadeConsolidadoInfo {
  slug: UnidadeConsolidadoSlug
  nomeCurto: string
  nomeCompleto: string
  empresaId: string
}

export interface RelatorioConsolidadoSjeMonteiro {
  competencia: string // "YYYY-MM"
  rotuloCompetencia: string // "SETEMBRO / 2026"
  dataEmissao: string // "DD/MM/AAAA HH:mm"
  unidadesFiltro?: UnidadeConsolidadoSlug[] // se omitido, são todas as 4
  tituloDocumento?: string
  subtituloDocumento?: string
  producao: {
    monteiro: DadosProducaoUnidade
    sje: DadosProducaoUnidade
    patos: DadosProducaoUnidade
    caico: DadosProducaoUnidade
    total: DadosProducaoUnidade
  }
  consumos: {
    monteiro: ConsumosUnidade
    sje: ConsumosUnidade
    patos: ConsumosUnidade
    caico: ConsumosUnidade
    total: ConsumosUnidade
  }
  folha: {
    monteiro: ResumoFolhaUnidade
    sje: ResumoFolhaUnidade
    patos?: ResumoFolhaUnidade
    caico?: ResumoFolhaUnidade
    totalGeralGcMix: number
  }
}

/**
 * Contabiliza o número de pessoas na folha (funcionários + terceiros)
 */
function contarPessoasUnidade(
  linhasEmpresa: FolhaPagamentoLinha[] = [],
  terceirosEmpresa: FolhaTerceiro[] = [],
): number {
  const funcs = (linhasEmpresa || []).filter((l) => l.tipo !== "Terceiro")
  const tercs = (linhasEmpresa || []).filter((l) => l.tipo === "Terceiro")
  if (tercs.length > 0) return funcs.length + tercs.length
  return funcs.length + (terceirosEmpresa?.length || 0)
}

/**
 * Soma ajuda de custo dos terceiros da folha
 */
function calcularAjudaCustoTerceiros(
  linhasEmpresa: FolhaPagamentoLinha[] = [],
): number {
  let ajuda = 0
  const tercs = (linhasEmpresa || []).filter((l) => l.tipo === "Terceiro")
  tercs.forEach((t) => {
    const val = Number(t.ajuda_custo ?? t.vendas_ajuda ?? 0)
    ajuda += val
  })
  return Math.round(ajuda * 100) / 100
}

/**
 * Calcula os valores consolidados da folha para uma unidade (reaproveitando a exata fórmula do RESUMO comparativo de FolhaPagamento.tsx)
 */
function calcularFolhaUnidadeComparativo(
  linhasEmpresa: FolhaPagamentoLinha[],
  terceirosCadastradosEmpresa: FolhaTerceiro[] = [],
): ResumoFolhaUnidade {
  if (!linhasEmpresa || linhasEmpresa.length === 0) {
    return {
      pessoas: contarPessoasUnidade(linhasEmpresa, terceirosCadastradosEmpresa),
      salariosQuinzena: 0,
      salariosMensal: 0,
      producaoAPagar: 0,
      comissoesAjuda: 0,
      terceiros: 0,
      totalUnidade: 0,
    }
  }

  // 1. Funcionários (inclui ocultos como Renilson)
  const funcs = linhasEmpresa.filter((l) => l.tipo !== "Terceiro")
  let salariosQuinzena = 0
  let salariosMensal = 0
  let producaoAPagar = 0
  let comissoesVendas = 0

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
    // Mensal puro = bruto - inss - ir - quinzena - quinzena_2
    const b = Number(l.bruto || 0)
    const i = Number(l.inss || 0)
    const ir = Number(l.ir || 0)
    const q = Number(l.quinzena || 0)
    const q2 = Number(l.quinzena_2 || 0)
    const mensal = Math.round((b - i - ir - q - q2) * 100) / 100
    const aPagarProd = isValdercleiton
      ? 0
      : Math.max(0, producaoCompleta - adiantamento)

    salariosQuinzena += q
    salariosMensal += mensal
    producaoAPagar += aPagarProd

    const vObra = Number(l.vendas_obra || 0)
    const comissaoAuto = calcularComissaoVendas(vObra)
    const comissao = Number(l.comissao || comissaoAuto)
    comissoesVendas += comissao
  })

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
    const isRaimundo = (t.nome || "").toUpperCase().includes("RAIMUNDO")
    const ehVendedor = Boolean(
      (cadastrado?.eh_vendedor ||
        (t.nome && t.nome.toUpperCase().includes("MARCIO LUAN"))) &&
        !isRaimundo,
    )
    const valorMes = ehVendedor
      ? Number(t.comissao || 0) + Number(t.ajuda_custo || 0)
      : Number(t.salario_liquido || t.bruto || 0)

    // Vendedor terceiro (Márcio Luan) conta SOMENTE em Vendas/Comissões, NUNCA em Terceiros
    if (!ehVendedor) {
      totalTerceiros += valorMes
    }

    if (ehVendedor) {
      const vComissao = Number(t.comissao || 0)
      comissoesVendas += vComissao
    }
  })

  salariosQuinzena = Math.round(salariosQuinzena * 100) / 100
  salariosMensal = Math.round(salariosMensal * 100) / 100
  producaoAPagar = Math.round(producaoAPagar * 100) / 100
  comissoesVendas = Math.round(comissoesVendas * 100) / 100
  totalTerceiros = Math.round(totalTerceiros * 100) / 100

  const ajudaCusto = calcularAjudaCustoTerceiros(linhasEmpresa)
  const comissoesAjudaTotal =
    Math.round((comissoesVendas + ajudaCusto) * 100) / 100

  const pessoas = contarPessoasUnidade(
    linhasEmpresa,
    terceirosCadastradosEmpresa,
  )

  const totalUnidade =
    Math.round(
      (salariosQuinzena + salariosMensal + producaoAPagar + comissoesVendas) *
        100,
    ) / 100

  return {
    pessoas,
    salariosQuinzena,
    salariosMensal,
    producaoAPagar,
    comissoesAjuda: comissoesAjudaTotal,
    terceiros: totalTerceiros,
    totalUnidade,
  }
}

export const RelatorioConsolidadoService = {
  /**
   * Busca e consolida dados de produção, consumos e folha para SJE + Monteiro na competência informada
   */
  async gerarConsolidado(
    competencia: string,
    unidades?: UnidadeConsolidadoSlug[],
  ): Promise<RelatorioConsolidadoSjeMonteiro> {
    const [anoStr, mesStr] = competencia.split("-")
    const ano = Number(anoStr) || 2026
    const mes = Number(mesStr) || 1

    // Período da competência (primeiro e último dia do mês)
    const primeiroDia = `${competencia}-01`
    const ultimoDiaNum = new Date(ano, mes, 0).getDate()
    const ultimoDia = `${competencia}-${String(ultimoDiaNum).padStart(2, "0")}`

    const mesesExtenso = [
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
    const rotuloCompetencia = `${mesesExtenso[mes - 1] || mesStr} / ${ano}`

    const agora = new Date()
    const dataEmissao = `${String(agora.getDate()).padStart(2, "0")}/${String(
      agora.getMonth() + 1,
    ).padStart(2, "0")}/${agora.getFullYear()} ${String(
      agora.getHours(),
    ).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`

    // 1. Buscar empresas 'Monteiro', 'SJdoEgito', 'Patos' e 'Caicó' pelo nome/id
    const { data: empresasCadastradas } = await (supabase as any)
      .from("empresas")
      .select("id, nome")

    let idMonteiro = ID_EMPRESA_MONTEIRO
    let idSje = ID_EMPRESA_SJE
    let idPatos = ID_EMPRESA_PATOS
    let idCaico = ID_EMPRESA_CAICO

    if (empresasCadastradas && empresasCadastradas.length > 0) {
      const empMont = empresasCadastradas.find((e: any) =>
        e.nome.toLowerCase().includes("monteiro"),
      )
      const empSje = empresasCadastradas.find(
        (e: any) =>
          e.nome.toLowerCase().includes("sjdoegito") ||
          e.nome.toLowerCase().includes("egito") ||
          e.nome.toLowerCase().includes("sje"),
      )
      const empPatos = empresasCadastradas.find((e: any) =>
        e.nome.toLowerCase().includes("patos"),
      )
      const empCaico = empresasCadastradas.find((e: any) => {
        const norm = e.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
        return norm.includes("caico")
      })

      if (empMont?.id) idMonteiro = empMont.id
      if (empSje?.id) idSje = empSje.id
      if (empPatos?.id) idPatos = empPatos.id
      if (empCaico?.id) idCaico = empCaico.id
    }

    const idsTodasEmpresas = Array.from(
      new Set([idMonteiro, idSje, idPatos, idCaico]),
    )

    // 2. Buscar cargas no período (EXCLUINDO canceladas: cancelada = false)
    const { data: cargas, error: errCargas } = await (supabase as any)
      .from("cargas")
      .select(
        "id, empresa_id, data, volume_m3, consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_aditivo, consumo_agua, cancelada",
      )
      .gte("data", primeiroDia)
      .lte("data", ultimoDia)
      .eq("cancelada", false)
      .in("empresa_id", idsTodasEmpresas)

    if (errCargas) {
      console.error("Erro ao buscar cargas consolidadas:", errCargas)
    }

    const cargasLista = cargas || []

    const cargasMonteiro = cargasLista.filter(
      (c: any) => c.empresa_id === idMonteiro,
    )
    const cargasSje = cargasLista.filter((c: any) => c.empresa_id === idSje)
    const cargasPatos = cargasLista.filter((c: any) => c.empresa_id === idPatos)
    const cargasCaico = cargasLista.filter((c: any) => c.empresa_id === idCaico)

    // Agrupamento de produção por unidade
    const calcularProd = (lista: any[]): DadosProducaoUnidade => ({
      cargas: lista.length,
      volumeM3:
        Math.round(
          lista.reduce(
            (acc: number, c: any) => acc + (Number(c.volume_m3) || 0),
            0,
          ) * 10,
        ) / 10,
    })

    const prodMonteiro = calcularProd(cargasMonteiro)
    const prodSje = calcularProd(cargasSje)
    const prodPatos = calcularProd(cargasPatos)
    const prodCaico = calcularProd(cargasCaico)

    const prodTotal: DadosProducaoUnidade = {
      cargas:
        prodMonteiro.cargas +
        prodSje.cargas +
        prodPatos.cargas +
        prodCaico.cargas,
      volumeM3:
        Math.round(
          (prodMonteiro.volumeM3 +
            prodSje.volumeM3 +
            prodPatos.volumeM3 +
            prodCaico.volumeM3) *
            10,
        ) / 10,
    }

    // Agrupamento de consumos (brita12 = Brita 1, brita19 = Brita 2)
    const somarConsumos = (lista: any[]): ConsumosUnidade => {
      let cimento = 0
      let brita1 = 0
      let brita2 = 0
      let areia = 0
      let poPedra = 0
      let aditivo = 0
      let agua = 0

      lista.forEach((c) => {
        cimento += Number(c.consumo_cimento) || 0
        brita1 += Number(c.consumo_brita12) || 0
        brita2 += Number(c.consumo_brita19) || 0
        areia += Number(c.consumo_areia) || 0
        poPedra += Number(c.consumo_po_pedra) || 0
        aditivo += Number(c.consumo_aditivo) || 0
        agua += Number(c.consumo_agua) || 0
      })

      return {
        cimentoKg: Math.round(cimento * 100) / 100,
        brita1Kg: Math.round(brita1 * 100) / 100,
        brita2Kg: Math.round(brita2 * 100) / 100,
        areiaKg: Math.round(areia * 100) / 100,
        poPedraKg: Math.round(poPedra * 100) / 100,
        aditivoL: Math.round(aditivo * 100) / 100,
        aguaL: Math.round(agua * 100) / 100,
      }
    }

    const consumosMonteiro = somarConsumos(cargasMonteiro)
    const consumosSje = somarConsumos(cargasSje)
    const consumosPatos = somarConsumos(cargasPatos)
    const consumosCaico = somarConsumos(cargasCaico)

    const consumosTotal: ConsumosUnidade = {
      cimentoKg:
        Math.round(
          (consumosMonteiro.cimentoKg +
            consumosSje.cimentoKg +
            consumosPatos.cimentoKg +
            consumosCaico.cimentoKg) *
            100,
        ) / 100,
      brita1Kg:
        Math.round(
          (consumosMonteiro.brita1Kg +
            consumosSje.brita1Kg +
            consumosPatos.brita1Kg +
            consumosCaico.brita1Kg) *
            100,
        ) / 100,
      brita2Kg:
        Math.round(
          (consumosMonteiro.brita2Kg +
            consumosSje.brita2Kg +
            consumosPatos.brita2Kg +
            consumosCaico.brita2Kg) *
            100,
        ) / 100,
      areiaKg:
        Math.round(
          (consumosMonteiro.areiaKg +
            consumosSje.areiaKg +
            consumosPatos.areiaKg +
            consumosCaico.areiaKg) *
            100,
        ) / 100,
      poPedraKg:
        Math.round(
          (consumosMonteiro.poPedraKg +
            consumosSje.poPedraKg +
            consumosPatos.poPedraKg +
            consumosCaico.poPedraKg) *
            100,
        ) / 100,
      aditivoL:
        Math.round(
          (consumosMonteiro.aditivoL +
            consumosSje.aditivoL +
            consumosPatos.aditivoL +
            consumosCaico.aditivoL) *
            100,
        ) / 100,
      aguaL:
        Math.round(
          (consumosMonteiro.aguaL +
            consumosSje.aguaL +
            consumosPatos.aguaL +
            consumosCaico.aguaL) *
            100,
        ) / 100,
    }

    // 3. Buscar dados de Folha de todas as unidades relevantes (Monteiro, SJE, Patos, Caicó)
    const [
      linhasMont,
      linhasSjeData,
      linhasPatosData,
      linhasCaicoData,
      tercsMont,
      tercsSjeData,
      tercsPatosData,
      tercsCaicoData,
    ] = await Promise.all([
      FolhaService.getLinhasCompetencia(idMonteiro, competencia).catch(
        () => [],
      ),
      FolhaService.getLinhasCompetencia(idSje, competencia).catch(() => []),
      FolhaService.getLinhasCompetencia(idPatos, competencia).catch(() => []),
      FolhaService.getLinhasCompetencia(idCaico, competencia).catch(() => []),
      FolhaService.getTerceiros(idMonteiro).catch(() => []),
      FolhaService.getTerceiros(idSje).catch(() => []),
      FolhaService.getTerceiros(idPatos).catch(() => []),
      FolhaService.getTerceiros(idCaico).catch(() => []),
    ])

    const folhaMonteiro = calcularFolhaUnidadeComparativo(
      linhasMont || [],
      tercsMont || [],
    )
    const folhaSje = calcularFolhaUnidadeComparativo(
      linhasSjeData || [],
      tercsSjeData || [],
    )
    const folhaPatos = calcularFolhaUnidadeComparativo(
      linhasPatosData || [],
      tercsPatosData || [],
    )
    const folhaCaico = calcularFolhaUnidadeComparativo(
      linhasCaicoData || [],
      tercsCaicoData || [],
    )

    // Se houver filtro específico de unidades, calcula os totais somando apenas as unidades filtradas
    const unidadesFiltradas =
      unidades && unidades.length > 0
        ? unidades
        : ["monteiro", "sje", "patos", "caico"]

    // Total produção filtrada
    let cargasTotalFiltro = 0
    let volumeTotalFiltro = 0
    if (unidadesFiltradas.includes("monteiro")) {
      cargasTotalFiltro += prodMonteiro.cargas
      volumeTotalFiltro += prodMonteiro.volumeM3
    }
    if (unidadesFiltradas.includes("sje")) {
      cargasTotalFiltro += prodSje.cargas
      volumeTotalFiltro += prodSje.volumeM3
    }
    if (unidadesFiltradas.includes("patos")) {
      cargasTotalFiltro += prodPatos.cargas
      volumeTotalFiltro += prodPatos.volumeM3
    }
    if (unidadesFiltradas.includes("caico")) {
      cargasTotalFiltro += prodCaico.cargas
      volumeTotalFiltro += prodCaico.volumeM3
    }

    const prodTotalCalculado: DadosProducaoUnidade = {
      cargas: cargasTotalFiltro,
      volumeM3: Math.round(volumeTotalFiltro * 10) / 10,
    }

    // Total consumos filtrados
    const consumosTotalCalculado: ConsumosUnidade = {
      cimentoKg:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.cimentoKg
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.cimentoKg : 0) +
            (unidadesFiltradas.includes("patos")
              ? consumosPatos.cimentoKg
              : 0) +
            (unidadesFiltradas.includes("caico")
              ? consumosCaico.cimentoKg
              : 0)) *
            100,
        ) / 100,
      brita1Kg:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.brita1Kg
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.brita1Kg : 0) +
            (unidadesFiltradas.includes("patos") ? consumosPatos.brita1Kg : 0) +
            (unidadesFiltradas.includes("caico")
              ? consumosCaico.brita1Kg
              : 0)) *
            100,
        ) / 100,
      brita2Kg:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.brita2Kg
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.brita2Kg : 0) +
            (unidadesFiltradas.includes("patos") ? consumosPatos.brita2Kg : 0) +
            (unidadesFiltradas.includes("caico")
              ? consumosCaico.brita2Kg
              : 0)) *
            100,
        ) / 100,
      areiaKg:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.areiaKg
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.areiaKg : 0) +
            (unidadesFiltradas.includes("patos") ? consumosPatos.areiaKg : 0) +
            (unidadesFiltradas.includes("caico") ? consumosCaico.areiaKg : 0)) *
            100,
        ) / 100,
      poPedraKg:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.poPedraKg
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.poPedraKg : 0) +
            (unidadesFiltradas.includes("patos")
              ? consumosPatos.poPedraKg
              : 0) +
            (unidadesFiltradas.includes("caico")
              ? consumosCaico.poPedraKg
              : 0)) *
            100,
        ) / 100,
      aditivoL:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.aditivoL
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.aditivoL : 0) +
            (unidadesFiltradas.includes("patos") ? consumosPatos.aditivoL : 0) +
            (unidadesFiltradas.includes("caico")
              ? consumosCaico.aditivoL
              : 0)) *
            100,
        ) / 100,
      aguaL:
        Math.round(
          ((unidadesFiltradas.includes("monteiro")
            ? consumosMonteiro.aguaL
            : 0) +
            (unidadesFiltradas.includes("sje") ? consumosSje.aguaL : 0) +
            (unidadesFiltradas.includes("patos") ? consumosPatos.aguaL : 0) +
            (unidadesFiltradas.includes("caico") ? consumosCaico.aguaL : 0)) *
            100,
        ) / 100,
    }

    // Total folha filtrada
    let totalFolhaFiltro = 0
    if (unidadesFiltradas.includes("monteiro"))
      totalFolhaFiltro += folhaMonteiro.totalUnidade
    if (unidadesFiltradas.includes("sje"))
      totalFolhaFiltro += folhaSje.totalUnidade
    if (unidadesFiltradas.includes("patos"))
      totalFolhaFiltro += folhaPatos.totalUnidade
    if (unidadesFiltradas.includes("caico"))
      totalFolhaFiltro += folhaCaico.totalUnidade

    const totalGeralGcMix = Math.round(totalFolhaFiltro * 100) / 100

    // Rótulos de documento conforme as unidades
    let tituloDocumento = "GC MIX — RELATÓRIO CONSOLIDADO GERAL (4 UNIDADES)"
    let subtituloDocumento =
      "UNIDADES: MONTEIRO / PB • SJE / PE • PATOS / PB • CAICÓ / RN"
    if (unidades && unidades.length === 1 && unidades[0] === "patos") {
      tituloDocumento = "GC MIX — RELATÓRIO CONSOLIDADO • UNIDADE PATOS"
      subtituloDocumento =
        "UNIDADE: PATOS / PB • FECHAMENTO OPERACIONAL & FINANCEIRO"
    } else if (
      unidades &&
      unidades.length === 2 &&
      unidades.includes("monteiro") &&
      unidades.includes("sje")
    ) {
      tituloDocumento = "GC MIX — RELATÓRIO CONSOLIDADO • SJE + MONTEIRO"
      subtituloDocumento =
        "UNIDADES: SÃO JOSÉ DO EGITO / PE • MONTEIRO / PB (CONSOLIDADO)"
    }

    return {
      competencia,
      rotuloCompetencia,
      dataEmissao,
      unidadesFiltro: unidades,
      tituloDocumento,
      subtituloDocumento,
      producao: {
        monteiro: prodMonteiro,
        sje: prodSje,
        patos: prodPatos,
        caico: prodCaico,
        total: prodTotalCalculado,
      },
      consumos: {
        monteiro: consumosMonteiro,
        sje: consumosSje,
        patos: consumosPatos,
        caico: consumosCaico,
        total: consumosTotalCalculado,
      },
      folha: {
        monteiro: folhaMonteiro,
        sje: folhaSje,
        patos: folhaPatos,
        caico: folhaCaico,
        totalGeralGcMix,
      },
    }
  },
}
