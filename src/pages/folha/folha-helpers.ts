import { FolhaPagamentoLinha, FolhaTabelaOficial } from "@/types/folha"
import {
  calcularInssProgressivo,
  calcularIrrf,
  calcularSalarioFamilia,
  calcularQuinzena,
  calcularMensalSemProducao,
  calcularProducaoTotal,
  calcularAPagarProducao,
  calcularMesesProporcionais13,
  calcularLinhaDecimoTerceiro,
} from "@/lib/folha-calculos"

export interface LinhaFolhaProcessada
  extends FolhaPagamentoLinha {
  // Valores calculados resolvidos
  quinzenaCalculada: number
  inssCalculado: number
  irrfCalculado: number
  familiaCalculado: number
  consignadoEfetivo: number
  mensalPuro: number
  producaoTotal: number
  producaoAPagar: number
  feriasEfetivo: number
  decimoEfetivo: number
  decimoCalculadoObj?: {
    meses: number
    bruto13: number
    primeiraParcela: number
    brutoSegundaParcela: number
    inssSegundaParcela: number
    irrfSegundaParcela: number
    liquidoSegundaParcela: number
  }
  adiantamentoEfetivo: number
  liquidoTotal: number
  dataAdmissaoEfetiva?: string | null
}

export interface TotaisUnidadeCalculados {
  totalColaboradores: number
  totalBruto: number
  totalQuinzena: number
  totalMensalPuro: number
  totalProducao: number
  totalProducaoAPagar: number
  totalFerias: number
  totalDecimo: number
  totalAdiantamento: number
  totalLiquido: number
  totalInss: number
  totalIrrf: number
  totalComissaoVendas: number
  totalAjudaCustoVendas: number
  totalTerceiros: number
  totalUnidadeGeral: number
}

/**
 * Remove acentos e converte para minúsculo para busca insensível
 */
export function normalizarParaBusca(texto: string | null | undefined): string {
  if (!texto) return ""
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/**
 * Calcula os termos de uma linha da folha com as regras aprovadas do Grupo Cordeiro
 */
export function processarLinhaFolha(
  linha: FolhaPagamentoLinha,
  mes: number,
  ano: number,
  tabelaOficial: FolhaTabelaOficial | null,
  fallbackAdmissao?: string | null,
): LinhaFolhaProcessada {
  const nomeUpper = (linha.nome || "").trim().toUpperCase()
  const isRaimundo = nomeUpper.includes("RAIMUNDO")
  const isMarcio = nomeUpper.includes("MARCIO LUAN")
  const isTerceiro = linha.tipo === "Terceiro" || isRaimundo || isMarcio
  const isValdercleiton = nomeUpper.includes("VALDERCLEITON")

  const bruto = Number(linha.bruto || 0)
  const percentualQuinzena = 0.4

  let quinzena = Number(linha.quinzena || 0)
  let inss = Number(linha.inss || 0)
  let irrf = Number(linha.ir || 0)
  let familia = Number(linha.familia || 0)
  const consignado = Number(linha.consignado || 0)

  if (isMarcio) {
    quinzena = 0
    inss = 0
    irrf = 0
    familia = 0
  } else if (isRaimundo || isTerceiro) {
    quinzena =
      quinzena > 0 ? quinzena : calcularQuinzena(bruto, percentualQuinzena)
    inss = 0
    irrf = 0
    familia = 0
  } else {
    // Funcionário padrão
    quinzena =
      quinzena > 0 ? quinzena : calcularQuinzena(bruto, percentualQuinzena)
    inss =
      inss > 0
        ? inss
        : Number(calcularInssProgressivo(bruto, tabelaOficial) || 0)
    familia =
      familia > 0
        ? familia
        : Number(
            calcularSalarioFamilia(bruto, linha.filhos || 0, tabelaOficial) ||
              0,
          )
    irrf =
      irrf > 0 ? irrf : Number(calcularIrrf(bruto, inss, tabelaOficial) || 0)
  }

  // Mensal puro = bruto - inss - irrf - quinzena - consignado (+ família se houver)
  let mensalPuro = 0
  if (isMarcio) {
    mensalPuro = 0
  } else if (isRaimundo || isTerceiro) {
    mensalPuro = Math.max(
      0,
      Math.round((bruto - quinzena - consignado) * 100) / 100,
    )
  } else {
    mensalPuro =
      Math.round(
        (bruto - inss - irrf + familia - quinzena - consignado) * 100,
      ) / 100
  }

  // Produção: Valdercleiton é SEMPRE 0
  const obras = isValdercleiton ? 0 : Number(linha.obras || 0)
  const valorObra = Number(linha.valor_obra ?? 20)
  const limpeza = isValdercleiton ? 0 : Number(linha.limpeza || 0)
  const sabado = isValdercleiton ? 0 : Number(linha.sabado || 0)
  const feriado = isValdercleiton ? 0 : Number(linha.feriado || 0)
  const ajudaCusto = isValdercleiton ? 0 : Number(linha.ajuda_custo || 0)
  const gratificacao = isValdercleiton ? 0 : Number(linha.gratificacao || 0)

  // Produção total e A pagar (Férias NUNCA entra na produção)
  const producaoTotal = isValdercleiton
    ? 0
    : calcularProducaoTotal({
        obras,
        valor_obra: valorObra,
        limpeza,
        sabado,
        feriado,
        ajuda_custo: ajudaCusto,
        gratificacao,
      })

  const adiantamento = Number(linha.adiantamento || 0)
  const producaoAPagar = isValdercleiton
    ? 0
    : calcularAPagarProducao(producaoTotal, adiantamento)

  // Férias é componente PRÓPRIO do líquido
  const ferias = Number(linha.ferias || 0)

  // Data de admissão para cálculo do 13º
  const dataAdmissao = linha.data_admissao || fallbackAdmissao || null

  // 13º Salário: Terceiros NUNCA recebem 13º
  // Novembro = 1ª Parcela (50% do bruto proporcional por avos, sem descontos)
  // Dezembro = 2ª Parcela líquida (bruto proporcional - 1ª parcela - INSS - IRRF regra anual)
  // Outros meses = 0
  let decimoEfetivo = 0
  let decimoCalculadoObj: LinhaFolhaProcessada["decimoCalculadoObj"] = undefined

  if (!isTerceiro && (mes === 11 || mes === 12) && bruto > 0) {
    const mesesAvos = calcularMesesProporcionais13(dataAdmissao, ano)
    const calc13 = calcularLinhaDecimoTerceiro(bruto, mesesAvos, tabelaOficial)
    decimoCalculadoObj = {
      meses: mesesAvos,
      bruto13: calc13.bruto13,
      primeiraParcela: calc13.primeiraParcela,
      brutoSegundaParcela: calc13.brutoSegundaParcela,
      inssSegundaParcela: calc13.inssSegundaParcela,
      irrfSegundaParcela: calc13.irrfSegundaParcela,
      liquidoSegundaParcela: calc13.liquidoSegundaParcela,
    }

    if (mes === 11) {
      decimoEfetivo = calc13.primeiraParcela
    } else if (mes === 12) {
      decimoEfetivo = calc13.liquidoSegundaParcela
    }
  }

  // Líquido total: Mensal Puro + Produção Total + Férias + 13º - Adiantamento
  // Se o adiantamento já foi abatido da produção (producaoAPagar), o total soma producaoTotal - adiantamento
  const liquidoTotal =
    Math.round(
      (mensalPuro + producaoTotal + ferias + decimoEfetivo - adiantamento) *
        100,
    ) / 100

  return {
    ...linha,
    quinzenaCalculada: quinzena,
    inssCalculado: inss,
    irrfCalculado: irrf,
    familiaCalculado: familia,
    consignadoEfetivo: consignado,
    mensalPuro,
    producaoTotal,
    producaoAPagar,
    feriasEfetivo: ferias,
    decimoEfetivo,
    decimoCalculadoObj,
    adiantamentoEfetivo: adiantamento,
    liquidoTotal,
    dataAdmissaoEfetiva: dataAdmissao,
  }
}

/**
 * Calcula os totais de uma lista de linhas processadas
 */
export function calcularTotaisUnidade(
  linhasProcessadas: LinhaFolhaProcessada[],
): TotaisUnidadeCalculados {
  let totalBruto = 0
  let totalQuinzena = 0
  let totalMensalPuro = 0
  let totalProducao = 0
  let totalProducaoAPagar = 0
  let totalFerias = 0
  let totalDecimo = 0
  let totalAdiantamento = 0
  let totalLiquido = 0
  let totalInss = 0
  let totalIrrf = 0
  let totalComissaoVendas = 0
  let totalAjudaCustoVendas = 0
  let totalTerceiros = 0

  linhasProcessadas.forEach((l) => {
    const nomeUpper = (l.nome || "").trim().toUpperCase()
    const isMarcio = nomeUpper.includes("MARCIO LUAN")
    const isRaimundo = nomeUpper.includes("RAIMUNDO")
    const isTerceiro = l.tipo === "Terceiro" || isMarcio || isRaimundo

    totalBruto += Number(l.bruto || 0)
    totalQuinzena += Number(l.quinzenaCalculada || 0)
    totalMensalPuro += Number(l.mensalPuro || 0)
    totalProducao += Number(l.producaoTotal || 0)
    totalProducaoAPagar += Number(l.producaoAPagar || 0)
    totalFerias += Number(l.feriasEfetivo || 0)
    totalDecimo += Number(l.decimoEfetivo || 0)
    totalAdiantamento += Number(l.adiantamentoEfetivo || 0)
    totalLiquido += Number(l.liquidoTotal || 0)
    totalInss += Number(l.inssCalculado || 0)
    totalIrrf += Number(l.irrfCalculado || 0)

    // Comissões e ajuda de vendas
    const comissao = Number(l.comissao || 0)
    // vendas_ajuda prevalece sobre ajuda_custo quando lançada na aba de vendas
    const ajudaVendas = Number(
      l.vendas_ajuda || (isMarcio ? l.ajuda_custo : 0) || 0,
    )

    totalComissaoVendas += comissao
    totalAjudaCustoVendas += ajudaVendas

    if (isTerceiro) {
      totalTerceiros += Number(l.liquidoTotal || 0)
    }
  })

  // Total da unidade geral = soma de todos os componentes da folha que saem do caixa da empresa
  // Quinzena + Mensal + Produção a Pagar + Férias + 13º + Comissões + Ajuda de Custo Vendas
  const totalUnidadeGeral =
    Math.round(
      (totalQuinzena +
        totalMensalPuro +
        totalProducaoAPagar +
        totalFerias +
        totalDecimo +
        totalComissaoVendas +
        totalAjudaCustoVendas) *
        100,
    ) / 100

  return {
    totalColaboradores: linhasProcessadas.length,
    totalBruto: Math.round(totalBruto * 100) / 100,
    totalQuinzena: Math.round(totalQuinzena * 100) / 100,
    totalMensalPuro: Math.round(totalMensalPuro * 100) / 100,
    totalProducao: Math.round(totalProducao * 100) / 100,
    totalProducaoAPagar: Math.round(totalProducaoAPagar * 100) / 100,
    totalFerias: Math.round(totalFerias * 100) / 100,
    totalDecimo: Math.round(totalDecimo * 100) / 100,
    totalAdiantamento: Math.round(totalAdiantamento * 100) / 100,
    totalLiquido: Math.round(totalLiquido * 100) / 100,
    totalInss: Math.round(totalInss * 100) / 100,
    totalIrrf: Math.round(totalIrrf * 100) / 100,
    totalComissaoVendas: Math.round(totalComissaoVendas * 100) / 100,
    totalAjudaCustoVendas: Math.round(totalAjudaCustoVendas * 100) / 100,
    totalTerceiros: Math.round(totalTerceiros * 100) / 100,
    totalUnidadeGeral,
  }
}

export function formatarMoeda(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) return "R$ 0,00"
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function formatarDataBr(dataIso: string | null | undefined): string {
  if (!dataIso) return "—"
  const partes = dataIso.split("T")[0].split("-")
  if (partes.length !== 3) return dataIso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}
