// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      cargas: {
        Row: {
          carga_zerada: boolean
          cidade_id: string | null
          cidade_nome: string | null
          consumo_aditivo: number
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number
          created_at: string
          data: string
          id: string
          motorista_id: string | null
          motorista_nome: string | null
          numero_carga: number
          observacao: string | null
          traco_id: string | null
          traco_nome: string | null
          veiculo_id: string | null
          veiculo_placa: string | null
          volume_m3: number
        }
        Insert: {
          carga_zerada?: boolean
          cidade_id?: string | null
          cidade_nome?: string | null
          consumo_aditivo?: number
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          data: string
          id?: string
          motorista_id?: string | null
          motorista_nome?: string | null
          numero_carga?: number
          observacao?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Update: {
          carga_zerada?: boolean
          cidade_id?: string | null
          cidade_nome?: string | null
          consumo_aditivo?: number
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          data?: string
          id?: string
          motorista_id?: string | null
          motorista_nome?: string | null
          numero_carga?: number
          observacao?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: 'cargas_cidade_id_fkey'
            columns: ['cidade_id']
            isOneToOne: false
            referencedRelation: 'cidades'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cargas_motorista_id_fkey'
            columns: ['motorista_id']
            isOneToOne: false
            referencedRelation: 'motoristas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cargas_traco_id_fkey'
            columns: ['traco_id']
            isOneToOne: false
            referencedRelation: 'tracos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cargas_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      cidades: {
        Row: {
          created_at: string
          id: string
          nome: string
          uf: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          uf?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          codigo: string
          created_at: string
          estoque_minimo: number
          id: string
          nome: string
          ordem: number
          unidade: string
        }
        Insert: {
          codigo: string
          created_at?: string
          estoque_minimo?: number
          id?: string
          nome: string
          ordem?: number
          unidade?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          estoque_minimo?: number
          id?: string
          nome?: string
          ordem?: number
          unidade?: string
        }
        Relationships: []
      }
      motoristas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          carga_id: string | null
          created_at: string
          data: string
          documento: string | null
          id: string
          material_id: string
          observacao: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          data?: string
          documento?: string | null
          id?: string
          material_id: string
          observacao?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          data?: string
          documento?: string | null
          id?: string
          material_id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'movimentacoes_estoque_carga_id_fkey'
            columns: ['carga_id']
            isOneToOne: false
            referencedRelation: 'cargas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movimentacoes_estoque_material_id_fkey'
            columns: ['material_id']
            isOneToOne: false
            referencedRelation: 'materiais'
            referencedColumns: ['id']
          },
        ]
      }
      tracos: {
        Row: {
          ativo: boolean
          consumo_aditivo: number
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number
          created_at: string
          descricao: string | null
          fck_mpa: number | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          consumo_aditivo?: number
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          descricao?: string | null
          fck_mpa?: number | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          consumo_aditivo?: number
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          descricao?: string | null
          fck_mpa?: number | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          modelo: string | null
          placa: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          modelo?: string | null
          placa: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          modelo?: string | null
          placa?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
