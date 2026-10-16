/**
 * Tipagens geradas do Supabase Database para o GC MIX Concreto Usinado.
 */
export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined
} | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      atualizar_email_usuario: {
        Args: { p_novo_email: string; p_usuario_app_id: string } | {
          p_novo_email: string;
          p_usuario_id: string;
        }
        Returns: Json
      }
      calcular_saldos_estoque: {
        Args: { p_empresa_id?: string }
        Returns: {
          material_id: string
          saldo: number
        }[]
      }
      confirmar_email_auth_usuario: {
        Args: { p_user_id: string } | { p_usuario_id: string }
        Returns: Json | boolean
      }
      proximo_numero_os: {
        Args: { p_empresa_id: string }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Database

type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<T extends keyof DefaultSchema["Tables"] | string = string,> = T extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][T]["Row"]
  : Record<string, any>

export type TablesInsert<T extends keyof DefaultSchema["Tables"] | string = string,> = T extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][T]["Insert"]
  : Record<string, any>

export type TablesUpdate<T extends keyof DefaultSchema["Tables"] | string = string,> = T extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][T]["Update"]
  : Record<string, any>

export type Enums<T extends string = string> = any

export type CompositeTypes<T extends string = string> = any

export const Constants = {
  public: {
    Enums: {},
  },
} as const
