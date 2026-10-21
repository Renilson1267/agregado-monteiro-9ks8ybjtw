import { supabase } from "@/lib/supabase/client"
import type {
  ControleBritaCheque,
  ControleBritaCompra,
  ControleBritaEntrega,
  SaldoCompetenciaAnterior,
  TipoBrita,
  UnidadeBritaEntrega,
} from "@/types/britas"

export class BritasService {
  /**
   * Calcula o saldo da competência anterior à informada:
   * (compra do mês anterior − entregue geral do mês anterior).
   * Se não houver compra nem entrega no mês anterior, repasse = 0.
   */
  static async getAnosDisponiveis(empresaId: string): Promise<number[]> {
    const anoAtual = new Date().getFullYear()
    try {
      const [comprasRes, entregasRes] = await Promise.all([
        (supabase as any)
          .from("controle_britas_compras")
          .select("competencia")
          .eq("empresa_id", empresaId),
        (supabase as any)
          .from("controle_britas_entregas")
          .select("competencia, data")
          .eq("empresa_id", empresaId),
      ])

      const anosSet = new Set<number>()
      anosSet.add(anoAtual)

      if (comprasRes.data) {
        comprasRes.data.forEach((c: any) => {
          if (c.competencia && c.competencia.length >= 4) {
            const ano = Number(c.competencia.substring(0, 4))
            if (!isNaN(ano) && ano > 2000) anosSet.add(ano)
          }
        })
      }

      if (entregasRes.data) {
        entregasRes.data.forEach((e: any) => {
          if (e.competencia && e.competencia.length >= 4) {
            const ano = Number(e.competencia.substring(0, 4))
            if (!isNaN(ano) && ano > 2000) anosSet.add(ano)
          }
          if (e.data && e.data.length >= 4) {
            const ano = Number(e.data.substring(0, 4))
            if (!isNaN(ano) && ano > 2000) anosSet.add(ano)
          }
        })
      }

      return Array.from(anosSet).sort((a, b) => b - a)
    } catch (err) {
      console.error("Erro ao buscar anos disponíveis de britas:", err)
      return [anoAtual]
    }
  }

  static async getComprasAno(
    empresaId: string,
    ano: number,
  ): Promise<ControleBritaCompra[]> {
    const { data, error } = await (supabase as any)
      .from("controle_britas_compras")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("competencia", `${ano}-01`)
      .lte("competencia", `${ano}-12`)
      .order("competencia", { ascending: true })

    if (error) {
      console.error("Erro ao buscar compras do ano de britas:", error)
      throw error
    }
    return data || []
  }

  static async getEntregasAno(
    empresaId: string,
    ano: number,
  ): Promise<ControleBritaEntrega[]> {
    const { data, error } = await (supabase as any)
      .from("controle_britas_entregas")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("data", `${ano}-01-01`)
      .lte("data", `${ano}-12-31`)
      .order("data", { ascending: false })

    if (error) {
      console.error("Erro ao buscar entregas do ano de britas:", error)
      throw error
    }
    return data || []
  }

  static async getSaldoCompetenciaAnterior(
    empresaId: string,
    competenciaAtual: string,
  ): Promise<SaldoCompetenciaAnterior> {
    const [anoStr, mesStr] = competenciaAtual.split("-")
    let ano = Number(anoStr) || new Date().getFullYear()
    let mes = Number(mesStr) || new Date().getMonth() + 1
    mes -= 1
    if (mes < 1) {
      mes = 12
      ano -= 1
    }
    const compAnterior = `${ano}-${String(mes).padStart(2, "0")}`

    const [comprasAnteriores, entregasAnteriores] = await Promise.all([
      BritasService.getComprasCompetencia(empresaId, compAnterior),
      BritasService.getEntregasCompetencia(empresaId, compAnterior),
    ])

    const compraM3 = Number(
      comprasAnteriores
        .reduce((acc, c) => acc + (Number(c.volume_m3) || 0), 0)
        .toFixed(3),
    )
    const entregueM3 = Number(
      entregasAnteriores
        .reduce((acc, cur) => acc + (Number(cur.quantidade_m3) || 0), 0)
        .toFixed(3),
    )

    const temRegistroMesAnterior = Boolean(
      comprasAnteriores.length > 0 || entregasAnteriores.length > 0,
    )
    const saldoRepasseM3 = temRegistroMesAnterior
      ? Number((compraM3 - entregueM3).toFixed(3))
      : 0

    return {
      compraMesAnteriorM3: compraM3,
      entregueGeralMesAnteriorM3: entregueM3,
      saldoRepasseM3,
      temRegistroMesAnterior,
    }
  }
  /**
   * Busca todas as compras de britas da empresa na competência informada (ordenadas por data asc, created_at asc)
   */
  static async getComprasCompetencia(
    empresaId: string,
    competencia: string,
  ): Promise<ControleBritaCompra[]> {
    const { data, error } = (await supabase
      .from("controle_britas_compras" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("competencia", competencia)
      .order("data", { ascending: true })
      .order("created_at", { ascending: true })) as any

    if (error) {
      console.error("Erro ao buscar compras de britas:", error)
      throw error
    }
    return (data || []) as ControleBritaCompra[]
  }

  /**
   * Lança uma nova compra de brita na competência
   */
  static async criarCompra(params: {
    empresa_id: string
    competencia: string
    data: string
    volume_m3: number
    fornecedor?: string | null
    observacao?: string | null
  }): Promise<ControleBritaCompra> {
    const { empresa_id, competencia, data, volume_m3, fornecedor, observacao } =
      params

    const { data: result, error } = (await supabase
      .from("controle_britas_compras" as any)
      .insert({
        empresa_id,
        competencia,
        data,
        volume_m3,
        fornecedor: fornecedor?.trim() || null,
        observacao: observacao?.trim() || null,
      })
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao criar compra de brita:", error)
      throw error
    }
    return result as ControleBritaCompra
  }

  /**
   * Atualiza uma compra existente
   */
  static async atualizarCompra(params: {
    id: string
    competencia?: string
    data?: string
    volume_m3?: number
    fornecedor?: string | null
    observacao?: string | null
  }): Promise<ControleBritaCompra> {
    const { id, competencia, data, volume_m3, fornecedor, observacao } = params

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (competencia !== undefined) payload.competencia = competencia
    if (data !== undefined) payload.data = data
    if (volume_m3 !== undefined) payload.volume_m3 = volume_m3
    if (fornecedor !== undefined)
      payload.fornecedor = fornecedor?.trim() || null
    if (observacao !== undefined)
      payload.observacao = observacao?.trim() || null

    const { data: result, error } = (await supabase
      .from("controle_britas_compras" as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao atualizar compra de brita:", error)
      throw error
    }
    return result as ControleBritaCompra
  }

  /**
   * Exclui uma compra de brita (os cheques vinculados por compra_id têm ON DELETE CASCADE)
   */
  static async excluirCompra(id: string): Promise<void> {
    const { error } = (await supabase
      .from("controle_britas_compras" as any)
      .delete()
      .eq("id", id)) as any

    if (error) {
      console.error("Erro ao excluir compra de brita:", error)
      throw error
    }
  }

  /**
   * Busca entregas de britas de uma empresa em uma competência
   */
  static async getEntregasCompetencia(
    empresaId: string,
    competencia: string,
    tipoBrita?: TipoBrita,
  ): Promise<ControleBritaEntrega[]> {
    let query = supabase
      .from("controle_britas_entregas" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("competencia", competencia) as any

    if (tipoBrita) {
      query = query.eq("tipo_brita", tipoBrita)
    }

    const { data, error } = await query
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar entregas de britas:", error)
      throw error
    }
    return (data || []) as ControleBritaEntrega[]
  }

  /**
   * Registra uma nova entrega de brita (com cálculo de quantidade_m3)
   */
  static async registrarEntrega(params: {
    empresa_id: string
    tipo_brita: TipoBrita
    competencia: string
    data: string
    quantidade: number
    unidade: UnidadeBritaEntrega
    densidade?: number | null
    fornecedor?: string | null
    documento?: string | null
    observacao?: string | null
  }): Promise<ControleBritaEntrega> {
    const {
      empresa_id,
      tipo_brita,
      competencia,
      data,
      quantidade,
      unidade,
      densidade,
      fornecedor,
      documento,
      observacao,
    } = params

    // Se unidade for 't', calcula quantidade / densidade. Senão, a própria quantidade já está em m³
    let quantidade_m3 = quantidade
    let densidadeFinal: number | null = null

    if (unidade === "t") {
      const dens = densidade && densidade > 0 ? densidade : 1.5
      densidadeFinal = dens
      quantidade_m3 = Number((quantidade / dens).toFixed(3))
    }

    const { data: result, error } = (await supabase
      .from("controle_britas_entregas" as any)
      .insert({
        empresa_id,
        tipo_brita,
        competencia,
        data,
        quantidade,
        unidade,
        densidade: densidadeFinal,
        quantidade_m3,
        fornecedor: fornecedor?.trim() || null,
        documento: documento?.trim() || null,
        observacao: observacao?.trim() || null,
      })
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao registrar entrega de brita:", error)
      throw error
    }
    return result as ControleBritaEntrega
  }

  /**
   * Atualiza uma entrega de brita existente (recalcula quantidade_m3)
   */
  static async atualizarEntrega(params: {
    id: string
    tipo_brita: TipoBrita
    competencia?: string
    data: string
    quantidade: number
    unidade: UnidadeBritaEntrega
    densidade?: number | null
    fornecedor?: string | null
    documento?: string | null
    observacao?: string | null
  }): Promise<ControleBritaEntrega> {
    const {
      id,
      tipo_brita,
      competencia,
      data,
      quantidade,
      unidade,
      densidade,
      fornecedor,
      documento,
      observacao,
    } = params

    let quantidade_m3 = quantidade
    let densidadeFinal: number | null = null

    if (unidade === "t") {
      const dens = densidade && densidade > 0 ? densidade : 1.5
      densidadeFinal = dens
      quantidade_m3 = Number((quantidade / dens).toFixed(3))
    }

    const updatePayload: Record<string, any> = {
      tipo_brita,
      data,
      quantidade,
      unidade,
      densidade: densidadeFinal,
      quantidade_m3,
      fornecedor: fornecedor?.trim() || null,
      documento: documento?.trim() || null,
      observacao: observacao?.trim() || null,
    }

    if (competencia) {
      updatePayload.competencia = competencia
    }

    const { data: result, error } = (await supabase
      .from("controle_britas_entregas" as any)
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao atualizar entrega de brita:", error)
      throw error
    }
    return result as ControleBritaEntrega
  }

  /**
   * Exclui uma entrega
   */
  static async excluirEntrega(entregaId: string): Promise<void> {
    const { error } = (await supabase
      .from("controle_britas_entregas" as any)
      .delete()
      .eq("id", entregaId)) as any

    if (error) {
      console.error("Erro ao excluir entrega de brita:", error)
      throw error
    }
  }

  /* ==========================================================================
     CHEQUES DA COMPRA DE BRITAS (controle_britas_cheques)
     ========================================================================== */

  /**
   * Busca cheques vinculados à compra de uma empresa em uma competência
   */
  static async getChequesCompetencia(
    empresaId: string,
    competencia: string,
  ): Promise<ControleBritaCheque[]> {
    const { data, error } = (await supabase
      .from("controle_britas_cheques" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("competencia", competencia)
      .order("data_vencimento", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })) as any

    if (error) {
      console.error("Erro ao buscar cheques de britas:", error)
      throw error
    }
    return (data || []) as unknown as ControleBritaCheque[]
  }

  /**
   * Cria um novo cheque vinculado à compra da competência
   */
  static async criarCheque(params: {
    empresa_id: string
    competencia: string
    compra_id?: string | null
    valor: number
    data_vencimento?: string | null
    numero?: string | null
    observacao?: string | null
    pago?: boolean
  }): Promise<ControleBritaCheque> {
    const {
      empresa_id,
      competencia,
      compra_id,
      valor,
      data_vencimento,
      numero,
      observacao,
      pago = false,
    } = params

    const { data, error } = (await supabase
      .from("controle_britas_cheques" as any)
      .insert({
        empresa_id,
        competencia,
        compra_id: compra_id || null,
        valor,
        data_vencimento: data_vencimento || null,
        numero: numero?.trim() || null,
        observacao: observacao?.trim() || null,
        pago: Boolean(pago),
      })
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao criar cheque de britas:", error)
      throw error
    }
    return data as ControleBritaCheque
  }

  /**
   * Atualiza um cheque existente
   */
  static async atualizarCheque(params: {
    id: string
    compra_id?: string | null
    valor?: number
    data_vencimento?: string | null
    numero?: string | null
    observacao?: string | null
    pago?: boolean
  }): Promise<ControleBritaCheque> {
    const { id, compra_id, valor, data_vencimento, numero, observacao, pago } =
      params

    const payload: Record<string, any> = {}
    if (compra_id !== undefined) payload.compra_id = compra_id || null
    if (valor !== undefined) payload.valor = valor
    if (data_vencimento !== undefined)
      payload.data_vencimento = data_vencimento || null
    if (numero !== undefined) payload.numero = numero?.trim() || null
    if (observacao !== undefined)
      payload.observacao = observacao?.trim() || null
    if (pago !== undefined) payload.pago = pago

    const { data, error } = (await supabase
      .from("controle_britas_cheques" as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao atualizar cheque de britas:", error)
      throw error
    }
    return data as ControleBritaCheque
  }

  /**
   * Alterna o status pago/pendente de um cheque
   */
  static async alternarPagoCheque(
    id: string,
    pago: boolean,
  ): Promise<ControleBritaCheque> {
    return BritasService.atualizarCheque({ id, pago })
  }

  /**
   * Exclui um cheque
   */
  static async excluirCheque(id: string): Promise<void> {
    const { error } = (await supabase
      .from("controle_britas_cheques" as any)
      .delete()
      .eq("id", id)) as any

    if (error) {
      console.error("Erro ao excluir cheque de britas:", error)
      throw error
    }
  }
}
