import { supabase } from "@/lib/supabase/client"
import type {
  ControleBritaCompra,
  ControleBritaEntrega,
  TipoBrita,
  UnidadeBritaEntrega,
} from "@/types/britas"

export class BritasService {
  /**
   * Busca as compras cadastradas de Brita 19 e 12 da empresa na competência informada
   */
  static async getComprasCompetencia(
    empresaId: string,
    competencia: string,
  ): Promise<ControleBritaCompra[]> {
    const { data, error } = (await supabase
      .from("controle_britas_compras" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("competencia", competencia)) as any

    if (error) {
      console.error("Erro ao buscar compras de britas:", error)
      throw error
    }
    return (data || []) as ControleBritaCompra[]
  }

  /**
   * Salva ou atualiza a compra mensal de um tipo de brita na competência
   */
  static async upsertCompra(params: {
    empresa_id: string
    tipo_brita: TipoBrita
    competencia: string
    volume_m3: number
    observacao?: string | null
  }): Promise<ControleBritaCompra> {
    const { empresa_id, tipo_brita, competencia, volume_m3, observacao } =
      params

    const { data, error } = (await supabase
      .from("controle_britas_compras" as any)
      .upsert(
        {
          empresa_id,
          tipo_brita,
          competencia,
          volume_m3,
          observacao: observacao || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "empresa_id,tipo_brita,competencia" },
      )
      .select()
      .single()) as any

    if (error) {
      console.error("Erro ao salvar compra de brita:", error)
      throw error
    }
    return data as ControleBritaCompra
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
}
