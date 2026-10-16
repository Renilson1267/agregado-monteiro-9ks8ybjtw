export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with Database type
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cargas: {
        Row: {
          cancelada: boolean | null
          cancelada_em: string | null
          carga_zerada: boolean | null
          cidade_id: string | null
          cidade_nome: string | null
          cliente_id: string | null
          cliente_nome: string | null
          consumo_aditivo: number
          consumo_agua: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number
          created_at: string
          data: string
          empresa_id: string | null
          id: string
          motivo_cancelamento: string | null
          motorista_id: string | null
          motorista_nome: string | null
          numero_carga: number
          observacao: string | null
          silo_cimento: string | null
          tanque_aditivo: string | null
          traco_id: string | null
          traco_nome: string | null
          veiculo_id: string | null
          veiculo_placa: string | null
          volume_m3: number
        }
        Insert: {
          cancelada?: boolean | null
          cancelada_em?: string | null
          carga_zerada?: boolean | null
          cidade_id?: string | null
          cidade_nome?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          consumo_aditivo?: number
          consumo_agua?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          data: string
          empresa_id?: string | null
          id?: string
          motivo_cancelamento?: string | null
          motorista_id?: string | null
          motorista_nome?: string | null
          numero_carga: number
          observacao?: string | null
          silo_cimento?: string | null
          tanque_aditivo?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Update: {
          cancelada?: boolean | null
          cancelada_em?: string | null
          carga_zerada?: boolean | null
          cidade_id?: string | null
          cidade_nome?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          consumo_aditivo?: number
          consumo_agua?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          data?: string
          empresa_id?: string | null
          id?: string
          motivo_cancelamento?: string | null
          motorista_id?: string | null
          motorista_nome?: string | null
          numero_carga?: number
          observacao?: string | null
          silo_cimento?: string | null
          tanque_aditivo?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "cargas_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargas_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "motoristas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargas_traco_id_fkey"
            columns: ["traco_id"]
            isOneToOne: false
            referencedRelation: "tracos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      cidades: {
        Row: {
          created_at: string
          distancia_km: number | null
          empresa_id: string | null
          id: string
          nome: string
          preco_bombeamento: number | null
          preco_frete: number | null
        }
        Insert: {
          created_at?: string
          distancia_km?: number | null
          empresa_id?: string | null
          id?: string
          nome: string
          preco_bombeamento?: number | null
          preco_frete?: number | null
        }
        Update: {
          created_at?: string
          distancia_km?: number | null
          empresa_id?: string | null
          id?: string
          nome?: string
          preco_bombeamento?: number | null
          preco_frete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          nome: string
          razao_social: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome?: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativa: boolean | null
          cnpj: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativa?: boolean | null
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativa?: boolean | null
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      exames_funcionarios: {
        Row: {
          clinica: string | null
          created_at: string
          data_realizacao: string
          data_validade: string | null
          dias_aviso_previo: number | null
          empresa_id: string | null
          funcionario_id: string
          id: string
          laboratorio: string | null
          medico_crm: string | null
          medico_nome: string | null
          observacoes: string | null
          status: string
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          clinica?: string | null
          created_at?: string
          data_realizacao: string
          data_validade?: string | null
          dias_aviso_previo?: number | null
          empresa_id?: string | null
          funcionario_id: string
          id?: string
          laboratorio?: string | null
          medico_crm?: string | null
          medico_nome?: string | null
          observacoes?: string | null
          status?: string
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          clinica?: string | null
          created_at?: string
          data_realizacao?: string
          data_validade?: string | null
          dias_aviso_previo?: number | null
          empresa_id?: string | null
          funcionario_id?: string
          id?: string
          laboratorio?: string | null
          medico_crm?: string | null
          medico_nome?: string | null
          observacoes?: string | null
          status?: string
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_adiantamentos: {
        Row: {
          competencia: string
          created_at: string
          data_adiantamento: string | null
          empresa_id: string
          funcionario_id: string
          id: string
          observacao: string | null
          status: string
          tipo_colaborador: string
          updated_at: string
          valor: number
        }
        Insert: {
          competencia: string
          created_at?: string
          data_adiantamento?: string | null
          empresa_id: string
          funcionario_id: string
          id?: string
          observacao?: string | null
          status?: string
          tipo_colaborador?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          competencia?: string
          created_at?: string
          data_adiantamento?: string | null
          empresa_id?: string
          funcionario_id?: string
          id?: string
          observacao?: string | null
          status?: string
          tipo_colaborador?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "folha_adiantamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_comissao_faixas: {
        Row: {
          aliquota_percentual: number
          competencia: string | null
          created_at: string
          empresa_id: string | null
          faixa_ordem: number
          id: string
          terceiro_id: string | null
          updated_at: string
          valor_ate: number | null
          valor_de: number
        }
        Insert: {
          aliquota_percentual?: number
          competencia?: string | null
          empresa_id?: string | null
          faixa_ordem: number
          id?: string
          terceiro_id?: string | null
          updated_at?: string
          valor_ate?: number | null
          valor_de?: number
        }
        Update: {
          aliquota_percentual?: number
          competencia?: string | null
          empresa_id?: string | null
          faixa_ordem?: number
          id?: string
          terceiro_id?: string | null
          updated_at?: string
          valor_ate?: number | null
          valor_de?: number
        }
        Relationships: [
          {
            foreignKeyName: "folha_comissao_faixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_comissao_faixas_terceiro_id_fkey"
            columns: ["terceiro_id"]
            isOneToOne: false
            referencedRelation: "folha_terceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_competencias: {
        Row: {
          ano: number
          bloqueada: boolean | null
          competencia: string
          created_at: string
          id: string
          mes: number
        }
        Insert: {
          ano: number
          bloqueada?: boolean | null
          competencia: string
          created_at?: string
          id?: string
          mes: number
        }
        Update: {
          ano?: number
          bloqueada?: boolean | null
          competencia?: string
          created_at?: string
          id?: string
          mes?: number
        }
        Relationships: []
      }
      folha_controle_ferias: {
        Row: {
          abono_pecuniario_dias: number | null
          adiantamento_13: boolean | null
          colaborador_id: string
          colaborador_nome: string
          created_at: string
          data_fim_ferias: string | null
          data_inicio_ferias: string | null
          data_limite_concessao: string
          dias_direito: number | null
          dias_gozados: number | null
          dias_saldo: number | null
          empresa_id: string
          id: string
          observacoes: string | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          status: string
          tipo_colaborador: string
          updated_at: string
        }
        Insert: {
          abono_pecuniario_dias?: number | null
          adiantamento_13?: boolean | null
          colaborador_id: string
          colaborador_nome: string
          created_at?: string
          data_fim_ferias?: string | null
          data_inicio_ferias?: string | null
          data_limite_concessao: string
          dias_direito?: number | null
          dias_gozados?: number | null
          dias_saldo?: number | null
          empresa_id: string
          id?: string
          observacoes?: string | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          status?: string
          tipo_colaborador?: string
          updated_at?: string
        }
        Update: {
          abono_pecuniario_dias?: number | null
          adiantamento_13?: boolean | null
          colaborador_id?: string
          colaborador_nome?: string
          created_at?: string
          data_fim_ferias?: string | null
          data_inicio_ferias?: string | null
          data_limite_concessao?: string
          dias_direito?: number | null
          dias_gozados?: number | null
          dias_saldo?: number | null
          empresa_id?: string
          id?: string
          observacoes?: string | null
          periodo_aquisitivo_fim?: string
          periodo_aquisitivo_inicio?: string
          status?: string
          tipo_colaborador?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folha_controle_ferias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_pagamento_backups: {
        Row: {
          autor: string | null
          competencia: string
          created_at: string
          dados_linhas: Json
          descricao: string | null
          empresa_id: string
          id: string
          linhas_count: number | null
          tabelas_snapshot: Json | null
          tipo: string | null
          valor_total_liquido: number | null
        }
        Insert: {
          autor?: string | null
          competencia: string
          created_at?: string
          dados_linhas: Json
          descricao?: string | null
          empresa_id: string
          id?: string
          linhas_count?: number | null
          tabelas_snapshot?: Json | null
          tipo?: string | null
          valor_total_liquido?: number | null
        }
        Update: {
          autor?: string | null
          competencia?: string
          created_at?: string
          dados_linhas?: Json
          descricao?: string | null
          empresa_id?: string
          id?: string
          linhas_count?: number | null
          tabelas_snapshot?: Json | null
          tipo?: string | null
          valor_total_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_backups_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_pagamento_linhas: {
        Row: {
          adiantamento: number | null
          ajuda: number | null
          a_pagar_producao: number | null
          base_irrf: number | null
          base_irrf_13: number | null
          cargo: string | null
          comissao_vendas: number | null
          competencia: string
          cpf: string | null
          created_at: string
          dependentes_irrf: number | null
          empresa_id: string
          ferias: number | null
          funcionario_id: string | null
          gratificacao: number | null
          id: string
          inss: number | null
          inss_13: number | null
          irrf: number | null
          irrf_13: number | null
          limpeza: number | null
          liquido_total: number | null
          mensal_bruto: number | null
          mensal_geral: number | null
          mensal_liquido: number | null
          mensal_sem_producao: number | null
          meses_trabalhados_13: number | null
          modo_calculo: string | null
          nome: string
          num_dependentes_sal_familia: number | null
          obras_quantidade: number | null
          obras_valor_unitario: number | null
          oculto: boolean | null
          ordenacao: number | null
          outros_descontos: number | null
          primeira_parcela_13: number | null
          producao_bruto: number | null
          producao_liquido: number | null
          producao_total: number | null
          quinzena: number | null
          quinzena_2: number | null
          quinzena_fixa: number | null
          quinzena_percentual: number | null
          quinzena_total: number | null
          sabado_feriado: number | null
          salario_bruto: number | null
          salario_familia: number | null
          segunda_parcela_13: number | null
          status_linha: string | null
          terceiro_id: string | null
          tipo_colaborador: string
          total_13: number | null
          total_13_liquido: number | null
          updated_at: string
          valor_quinzena: number | null
          vendas: number | null
        }
        Insert: {
          adiantamento?: number | null
          ajuda?: number | null
          a_pagar_producao?: number | null
          base_irrf?: number | null
          base_irrf_13?: number | null
          cargo?: string | null
          comissao_vendas?: number | null
          competencia: string
          cpf?: string | null
          created_at?: string
          dependentes_irrf?: number | null
          empresa_id: string
          ferias?: number | null
          funcionario_id?: string | null
          gratificacao?: number | null
          id?: string
          inss?: number | null
          inss_13?: number | null
          irrf?: number | null
          irrf_13?: number | null
          limpeza?: number | null
          liquido_total?: number | null
          mensal_bruto?: number | null
          mensal_geral?: number | null
          mensal_liquido?: number | null
          mensal_sem_producao?: number | null
          meses_trabalhados_13?: number | null
          modo_calculo?: string | null
          nome: string
          num_dependentes_sal_familia?: number | null
          obras_quantidade?: number | null
          obras_valor_unitario?: number | null
          oculto?: boolean | null
          ordenacao?: number | null
          outros_descontos?: number | null
          primeira_parcela_13?: number | null
          producao_bruto?: number | null
          producao_liquido?: number | null
          producao_total?: number | null
          quinzena?: number | null
          quinzena_2?: number | null
          quinzena_fixa?: number | null
          quinzena_percentual?: number | null
          quinzena_total?: number | null
          sabado_feriado?: number | null
          salario_bruto?: number | null
          salario_familia?: number | null
          segunda_parcela_13?: number | null
          status_linha?: string | null
          terceiro_id?: string | null
          tipo_colaborador?: string
          total_13?: number | null
          total_13_liquido?: number | null
          updated_at?: string
          valor_quinzena?: number | null
          vendas?: number | null
        }
        Update: {
          adiantamento?: number | null
          ajuda?: number | null
          a_pagar_producao?: number | null
          base_irrf?: number | null
          base_irrf_13?: number | null
          cargo?: string | null
          comissao_vendas?: number | null
          competencia?: string
          cpf?: string | null
          created_at?: string
          dependentes_irrf?: number | null
          empresa_id?: string
          ferias?: number | null
          funcionario_id?: string | null
          gratificacao?: number | null
          id?: string
          inss?: number | null
          inss_13?: number | null
          irrf?: number | null
          irrf_13?: number | null
          limpeza?: number | null
          liquido_total?: number | null
          mensal_bruto?: number | null
          mensal_geral?: number | null
          mensal_liquido?: number | null
          mensal_sem_producao?: number | null
          meses_trabalhados_13?: number | null
          modo_calculo?: string | null
          nome?: string
          num_dependentes_sal_familia?: number | null
          obras_quantidade?: number | null
          obras_valor_unitario?: number | null
          oculto?: boolean | null
          ordenacao?: number | null
          outros_descontos?: number | null
          primeira_parcela_13?: number | null
          producao_bruto?: number | null
          producao_liquido?: number | null
          producao_total?: number | null
          quinzena?: number | null
          quinzena_2?: number | null
          quinzena_fixa?: number | null
          quinzena_percentual?: number | null
          quinzena_total?: number | null
          sabado_feriado?: number | null
          salario_bruto?: number | null
          salario_familia?: number | null
          segunda_parcela_13?: number | null
          status_linha?: string | null
          terceiro_id?: string | null
          tipo_colaborador?: string
          total_13?: number | null
          total_13_liquido?: number | null
          updated_at?: string
          valor_quinzena?: number | null
          vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_linhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_tabelas_oficiais: {
        Row: {
          ano_vigencia: number
          ativo: boolean | null
          created_at: string
          descricao: string | null
          faixas: Json
          id: string
          tipo_tabela: string
          updated_at: string
        }
        Insert: {
          ano_vigencia: number
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          faixas: Json
          id?: string
          tipo_tabela: string
          updated_at?: string
        }
        Update: {
          ano_vigencia?: number
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          faixas?: Json
          id?: string
          tipo_tabela?: string
          updated_at?: string
        }
        Relationships: []
      }
      folha_terceiros: {
        Row: {
          ativo: boolean | null
          chave_pix: string | null
          cnpj_cpf: string | null
          comissao_padrao_percentual: number | null
          created_at: string
          eh_vendedor: boolean | null
          empresa_id: string
          funcao: string | null
          id: string
          nome: string
          observacoes: string | null
          percentual_quinzena: number | null
          tipo_pagamento: string | null
          updated_at: string
          valor_fixo_mensal: number | null
        }
        Insert: {
          ativo?: boolean | null
          chave_pix?: string | null
          cnpj_cpf?: string | null
          comissao_padrao_percentual?: number | null
          created_at?: string
          eh_vendedor?: boolean | null
          empresa_id: string
          funcao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          percentual_quinzena?: number | null
          tipo_pagamento?: string | null
          updated_at?: string
          valor_fixo_mensal?: number | null
        }
        Update: {
          ativo?: boolean | null
          chave_pix?: string | null
          cnpj_cpf?: string | null
          comissao_padrao_percentual?: number | null
          created_at?: string
          eh_vendedor?: boolean | null
          empresa_id?: string
          funcao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_quinzena?: number | null
          tipo_pagamento?: string | null
          updated_at?: string
          valor_fixo_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_terceiros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          chave_pix: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          dependentes_irrf: number | null
          email: string | null
          empresa_id: string
          id: string
          modo_calculo: string | null
          nome: string
          num_dependentes_sal_familia: number | null
          percentual_quinzena: number | null
          salario_bruto: number | null
          status: string | null
          telefone: string | null
          tipo_colaborador: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          dependentes_irrf?: number | null
          email?: string | null
          empresa_id: string
          id?: string
          modo_calculo?: string | null
          nome: string
          num_dependentes_sal_familia?: number | null
          percentual_quinzena?: number | null
          salario_bruto?: number | null
          status?: string | null
          telefone?: string | null
          tipo_colaborador?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          dependentes_irrf?: number | null
          email?: string | null
          empresa_id?: string
          id?: string
          modo_calculo?: string | null
          nome?: string
          num_dependentes_sal_familia?: number | null
          percentual_quinzena?: number | null
          salario_bruto?: number | null
          status?: string | null
          telefone?: string | null
          tipo_colaborador?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          ativo: boolean | null
          codigo: string
          controla_estoque: boolean | null
          created_at: string
          densidade: number | null
          empresa_id: string | null
          estoque_minimo: number | null
          id: string
          nome: string
          preco_unitario: number | null
          unidade: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          controla_estoque?: boolean | null
          created_at?: string
          densidade?: number | null
          empresa_id?: string | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          preco_unitario?: number | null
          unidade: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          controla_estoque?: boolean | null
          created_at?: string
          densidade?: number | null
          empresa_id?: string | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          preco_unitario?: number | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_producao: {
        Row: {
          ano: number
          created_at: string
          empresa_id: string | null
          id: string
          mes: number
          meta_m3: number
        }
        Insert: {
          ano: number
          created_at?: string
          empresa_id?: string | null
          id?: string
          mes: number
          meta_m3: number
        }
        Update: {
          ano?: number
          created_at?: string
          empresa_id?: string | null
          id?: string
          mes?: number
          meta_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      motoristas: {
        Row: {
          ativo: boolean | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "motoristas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          carga_id: string | null
          created_at: string
          data: string
          documento: string | null
          empresa_id: string | null
          id: string
          material_id: string
          observacao: string | null
          preco_unitario: number | null
          quantidade: number
          recipiente_id: string | null
          recipiente_nome: string | null
          tipo: string
          valor_total: number | null
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          data?: string
          documento?: string | null
          empresa_id?: string | null
          id?: string
          material_id: string
          observacao?: string | null
          preco_unitario?: number | null
          quantidade: number
          recipiente_id?: string | null
          recipiente_nome?: string | null
          tipo: string
          valor_total?: number | null
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          data?: string
          documento?: string | null
          empresa_id?: string | null
          id?: string
          material_id?: string
          observacao?: string | null
          preco_unitario?: number | null
          quantidade?: number
          recipiente_id?: string | null
          recipiente_nome?: string | null
          tipo?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          bairro: string | null
          carga_id: string | null
          cep: string | null
          cidade: string | null
          cliente_cnpj_cpf: string | null
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          dados_adicionais: string | null
          data_emissao: string
          empresa_id: string | null
          endereco_obra: string | null
          exibir_insumos: boolean | null
          hora_saida: string | null
          id: string
          insumos_detalhados: Json | null
          itens: Json
          motorista_nome: string | null
          natureza_operacao: string | null
          numero_os: number
          observacoes: string | null
          tipo_entrega: string | null
          updated_at: string
          valor_total: number | null
          veiculo_placa: string | null
        }
        Insert: {
          bairro?: string | null
          carga_id?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_cnpj_cpf?: string | null
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          dados_adicionais?: string | null
          data_emissao?: string
          empresa_id?: string | null
          endereco_obra?: string | null
          exibir_insumos?: boolean | null
          hora_saida?: string | null
          id?: string
          insumos_detalhados?: Json | null
          itens?: Json
          motorista_nome?: string | null
          natureza_operacao?: string | null
          numero_os: number
          observacoes?: string | null
          tipo_entrega?: string | null
          updated_at?: string
          valor_total?: number | null
          veiculo_placa?: string | null
        }
        Update: {
          bairro?: string | null
          carga_id?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_cnpj_cpf?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          dados_adicionais?: string | null
          data_emissao?: string
          empresa_id?: string | null
          endereco_obra?: string | null
          exibir_insumos?: boolean | null
          hora_saida?: string | null
          id?: string
          insumos_detalhados?: Json | null
          itens?: Json
          motorista_nome?: string | null
          natureza_operacao?: string | null
          numero_os?: number
          observacoes?: string | null
          tipo_entrega?: string | null
          updated_at?: string
          valor_total?: number | null
          veiculo_placa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      prazos_exame_empresa: {
        Row: {
          aviso_previo_dias: number
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          obrigatorio: boolean
          periodicidade_meses: number
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          aviso_previo_dias?: number
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          obrigatorio?: boolean
          periodicidade_meses?: number
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          aviso_previo_dias?: number
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          obrigatorio?: boolean
          periodicidade_meses?: number
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prazos_exame_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recipientes_estoque: {
        Row: {
          ativo: boolean | null
          capacidade_maxima: number
          created_at: string
          empresa_id: string
          id: string
          identificador: string
          material_codigo: string
          nome: string
          observacoes: string | null
          ponto_pedido: number | null
          saldo_atual: number
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade_maxima?: number
          created_at?: string
          empresa_id: string
          id?: string
          identificador: string
          material_codigo: string
          nome: string
          observacoes?: string | null
          ponto_pedido?: number | null
          saldo_atual?: number
          tipo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          capacidade_maxima?: number
          created_at?: string
          empresa_id?: string
          id?: string
          identificador?: string
          material_codigo?: string
          nome?: string
          observacoes?: string | null
          ponto_pedido?: number | null
          saldo_atual?: number
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipientes_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tracos: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          fck: number | null
          id: string
          nome: string
          preco_m3: number | null
          quant_aditivo: number | null
          quant_agua: number | null
          quant_areia: number | null
          quant_brita12: number | null
          quant_brita19: number | null
          quant_cimento: number | null
          quant_po_pedra: number | null
          slump: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fck?: number | null
          id?: string
          nome: string
          preco_m3?: number | null
          quant_aditivo?: number | null
          quant_agua?: number | null
          quant_areia?: number | null
          quant_brita12?: number | null
          quant_brita19?: number | null
          quant_cimento?: number | null
          quant_po_pedra?: number | null
          slump?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fck?: number | null
          id?: string
          nome?: string
          preco_m3?: number | null
          quant_aditivo?: number | null
          quant_agua?: number | null
          quant_areia?: number | null
          quant_brita12?: number | null
          quant_brita19?: number | null
          quant_cimento?: number | null
          quant_po_pedra?: number | null
          slump?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_app: {
        Row: {
          ativo: boolean | null
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          perfil: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          email: string
          empresa_id?: string | null
          id?: string
          nome: string
          perfil?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          perfil?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_app_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ativo: boolean | null
          capacidade_m3: number | null
          created_at: string
          empresa_id: string | null
          id: string
          modelo: string | null
          placa: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade_m3?: number | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string | null
          placa: string
        }
        Update: {
          ativo?: boolean | null
          capacidade_m3?: number | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string | null
          placa?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      atualizar_email_usuario:
        | {
            Args: { p_novo_email: string; p_usuario_app_id: string }
            Returns: Json
          }
        | {
            Args: { p_novo_email: string; p_usuario_id: string }
            Returns: Json
          }
      calcular_saldos_estoque: {
        Args: { p_empresa_id?: string }
        Returns: {
          material_id: string
          saldo: number
        }[]
      }
      confirmar_email_auth_usuario:
        | {
            Args: { p_user_id: string }
            Returns: Json
          }
        | {
            Args: { p_usuario_id: string }
            Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] & DefaultSchema["Views"] | {
  schema: keyof DatabaseWithoutInternals
},
TableName extends DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
  : never = never,> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"][TableName] extends {
    Row: infer R
  }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] & DefaultSchema["Views"]
    ? DefaultSchema["Tables"] & DefaultSchema["Views"][DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
    : never

export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
  schema: keyof DatabaseWithoutInternals
},
TableName extends DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
  schema: keyof DatabaseWithoutInternals
},
TableName extends DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
    : never

export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
  schema: keyof DatabaseWithoutInternals
},
EnumName extends DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
  schema: keyof DatabaseWithoutInternals
},
CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
