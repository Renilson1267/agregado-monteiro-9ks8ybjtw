import { supabase } from "@/lib/supabase/client"
import type { ItemControleFerias, NovoItemFeriasPayload } from "@/types/ferias"

export class FeriasService {
  /**
   * Busca todas as linhas do controle de férias de uma determinada empresa
   */
  static async getControleFerias(
    empresaId: string,
  ): Promise<ItemControleFerias[]> {
    if (!empresaId) return []

    const { data, error } = await (supabase as any)
      .from("controle_ferias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao carregar controle de férias:", error)
      throw new Error(error.message || "Erro ao carregar controle de férias")
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      empresa_id: row.empresa_id,
      funcionario_id: row.funcionario_id,
      ordem: Number(row.ordem) || 0,
      nome: row.nome || "",
      funcao: row.funcao || "",
      salario_2025: Number(row.salario_2025) || 0,
      admissao: row.admissao || null,
      cpf: row.cpf || "",
      agencia: row.agencia || "",
      conta_corrente: row.conta_corrente || "",
      ferias: row.ferias || null,
      calca: row.calca || "",
      camisa: row.camisa || "",
      observacoes: row.observacoes || "",
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  }

  /**
   * Atualização parcial inline de um item do controle de férias
   */
  static async atualizarItemFerias(
    id: string,
    campos: Partial<Omit<ItemControleFerias, "id" | "empresa_id" | "created_at" | "updated_at">>,
  ): Promise<ItemControleFerias> {
    const payload: Record<string, any> = {
      ...campos,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await (supabase as any)
      .from("controle_ferias")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar linha de férias:", error)
      throw new Error(error.message || "Erro ao atualizar controle de férias")
    }

    return data as ItemControleFerias
  }

  /**
   * Cria nova linha no controle de férias
   */
  static async criarItemFerias(
    payload: NovoItemFeriasPayload,
  ): Promise<ItemControleFerias> {
    const { data, error } = await (supabase as any)
      .from("controle_ferias")
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar linha no controle de férias:", error)
      throw new Error(error.message || "Erro ao criar linha de férias")
    }

    return data as ItemControleFerias
  }

  /**
   * Exclui uma linha do controle de férias
   */
  static async excluirItemFerias(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("controle_ferias")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir item de férias:", error)
      throw new Error(error.message || "Erro ao excluir linha de férias")
    }
  }
}
