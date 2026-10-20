export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined
} | Json[]

export interface Database {
  __InternalSupabase: {
    PostgresEnums: { [_ in never]: never }
  }
  public: {
    Tables: {
      cargas: {
        Row: {
          cliente_id: string | null
          consumo_aditivo: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number | null
          created_at: string
          data: string
          empresa_id: string
          id: string
          motorista_id: string | null
          motorista_nome: string | null
          observacao: string | null
          status: string
          status_aprovacao: string | null
          tipo_traco: string | null
          traco_id: string | null
          traco_nome: string | null
          updated_at: string
          veiculo_id: string | null
          veiculo_placa: string | null
          volume_m3: number
        }
        Insert: {
          cliente_id?: string | null
          consumo_aditivo?: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra?: number | null
          created_at?: string
          data: string
          empresa_id: string
          id?: string
          motorista_id?: string | null
          motorista_nome?: string | null
          observacao?: string | null
          status?: string
          status_aprovacao?: string | null
          tipo_traco?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          updated_at?: string
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3: number
        }
        Update: {
          cliente_id?: string | null
          consumo_aditivo?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number | null
          created_at?: string
          data?: string
          empresa_id?: string
          id?: string
          motorista_id?: string | null
          motorista_nome?: string | null
          observacao?: string | null
          status?: string
          status_aprovacao?: string | null
          tipo_traco?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          updated_at?: string
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Relationships: [{
          foreignKeyName: "cargas_cliente_id_fkey"
          columns: ["cliente_id"]
          isOneToOne: false
          referencedRelation: "clientes"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "cargas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "cargas_motorista_id_fkey"
          columns: ["motorista_id"]
          isOneToOne: false
          referencedRelation: "motoristas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "cargas_traco_id_fkey"
          columns: ["traco_id"]
          isOneToOne: false
          referencedRelation: "tracos"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "cargas_veiculo_id_fkey"
          columns: ["veiculo_id"]
          isOneToOne: false
          referencedRelation: "veiculos"
          referencedColumns: ["id"]
        }]
      }
      cargas_cancelamentos: {
        Row: {
          carga_id: string
          created_at: string
          criado_por: string | null
          empresa_id: string
          estornou_estoque: boolean
          id: string
          motivo: string
          observacoes: string | null
        }
        Insert: {
          carga_id: string
          created_at?: string
          criado_por?: string | null
          empresa_id: string
          estornou_estoque?: boolean
          id?: string
          motivo: string
          observacoes?: string | null
        }
        Update: {
          carga_id?: string
          created_at?: string
          criado_por?: string | null
          empresa_id?: string
          estornou_estoque?: boolean
          id?: string
          motivo?: string
          observacoes?: string | null
        }
        Relationships: [{
          foreignKeyName: "cargas_cancelamentos_carga_id_fkey"
          columns: ["carga_id"]
          isOneToOne: false
          referencedRelation: "cargas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "cargas_cancelamentos_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      cidades: {
        Row: {
          created_at: string
          distancia_km: number
          empresa_id: string | null
          id: string
          nome: string
          uf: string
        }
        Insert: {
          created_at?: string
          distancia_km?: number
          empresa_id?: string | null
          id?: string
          nome: string
          uf?: string
        }
        Update: {
          created_at?: string
          distancia_km?: number
          empresa_id?: string | null
          id?: string
          nome?: string
          uf?: string
        }
        Relationships: [{
          foreignKeyName: "cidades_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      clientes: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          nome: string
          observacoes: string | null
          razao_social: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome: string
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome?: string
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "clientes_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      controle_exames: {
        Row: {
          created_at: string
          data_realizacao: string
          data_validade: string | null
          empresa_id: string
          funcionario_id: string
          id: string
          observacoes: string | null
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_realizacao: string
          data_validade?: string | null
          empresa_id: string
          funcionario_id: string
          id?: string
          observacoes?: string | null
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_realizacao?: string
          data_validade?: string | null
          empresa_id?: string
          funcionario_id?: string
          id?: string
          observacoes?: string | null
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "controle_exames_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "controle_exames_funcionario_id_fkey"
          columns: ["funcionario_id"]
          isOneToOne: false
          referencedRelation: "funcionarios"
          referencedColumns: ["id"]
        }]
      }
      controle_ferias: {
        Row: {
          abono_pecuniario: boolean
          created_at: string
          data_fim_aquisitivo: string
          data_fim_ferias: string
          data_inicio_aquisitivo: string
          data_inicio_ferias: string
          dias_abono: number
          dias_gozados: number
          empresa_id: string
          funcionario_id: string
          id: string
          observacao: string | null
          periodo_aquisitivo: string
          periodo_gozo: string
          situacao: string
          status_pagamento: string
          updated_at: string
          valor_pago: number | null
        }
        Insert: {
          abono_pecuniario?: boolean
          created_at?: string
          data_fim_aquisitivo: string
          data_fim_ferias: string
          data_inicio_aquisitivo: string
          data_inicio_ferias: string
          dias_abono?: number
          dias_gozados?: number
          empresa_id: string
          funcionario_id: string
          id?: string
          observacao?: string | null
          periodo_aquisitivo: string
          periodo_gozo: string
          situacao?: string
          status_pagamento?: string
          updated_at?: string
          valor_pago?: number | null
        }
        Update: {
          abono_pecuniario?: boolean
          created_at?: string
          data_fim_aquisitivo?: string
          data_fim_ferias?: string
          data_inicio_aquisitivo?: string
          data_inicio_ferias?: string
          dias_abono?: number
          dias_gozados?: number
          empresa_id?: string
          funcionario_id?: string
          id?: string
          observacao?: string | null
          periodo_aquisitivo?: string
          periodo_gozo?: string
          situacao?: string
          status_pagamento?: string
          updated_at?: string
          valor_pago?: number | null
        }
        Relationships: [{
          foreignKeyName: "controle_ferias_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "controle_ferias_funcionario_id_fkey"
          columns: ["funcionario_id"]
          isOneToOne: false
          referencedRelation: "funcionarios"
          referencedColumns: ["id"]
        }]
      }
      controle_silos_tanques: {
        Row: {
          capacidade: number
          conteudo_atual: number
          created_at: string
          empresa_id: string
          id: string
          material_id: string | null
          nome: string
          tipo: string
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          capacidade: number
          conteudo_atual?: number
          created_at?: string
          empresa_id: string
          id?: string
          material_id?: string | null
          nome: string
          tipo: string
          unidade_medida?: string
          updated_at?: string
        }
        Update: {
          capacidade?: number
          conteudo_atual?: number
          created_at?: string
          empresa_id?: string
          id?: string
          material_id?: string | null
          nome?: string
          tipo?: string
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "controle_silos_tanques_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "controle_silos_tanques_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }]
      }
      empresas: {
        Row: {
          ativa: boolean
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          ativa?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          ativa?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      estoque_minimos: {
        Row: {
          created_at: string
          empresa_id: string
          estoque_minimo: number
          id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estoque_minimo?: number
          id?: string
          material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estoque_minimo?: number
          id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "estoque_minimos_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "estoque_minimos_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }]
      }
      folha_adiantamentos: {
        Row: {
          created_at: string
          data: string
          empresa_id: string
          folha_linha_id: string | null
          funcionario_id: string | null
          id: string
          observacao: string | null
          status: string
          terceiro_id: string | null
          tipo_colaborador: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          empresa_id: string
          folha_linha_id?: string | null
          funcionario_id?: string | null
          id?: string
          observacao?: string | null
          status?: string
          terceiro_id?: string | null
          tipo_colaborador: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          empresa_id?: string
          folha_linha_id?: string | null
          funcionario_id?: string | null
          id?: string
          observacao?: string | null
          status?: string
          terceiro_id?: string | null
          tipo_colaborador?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [{
          foreignKeyName: "folha_adiantamentos_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_adiantamentos_folha_linha_id_fkey"
          columns: ["folha_linha_id"]
          isOneToOne: false
          referencedRelation: "folha_pagamento_linhas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_adiantamentos_funcionario_id_fkey"
          columns: ["funcionario_id"]
          isOneToOne: false
          referencedRelation: "funcionarios"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_adiantamentos_terceiro_id_fkey"
          columns: ["terceiro_id"]
          isOneToOne: false
          referencedRelation: "folha_terceiros"
          referencedColumns: ["id"]
        }]
      }
      folha_backup: {
        Row: {
          competencia_id: string
          created_at: string
          criado_por: string | null
          dados: Json
          descricao: string | null
          empresa_id: string
          id: string
          tipo: string
        }
        Insert: {
          competencia_id: string
          created_at?: string
          criado_por?: string | null
          dados: Json
          descricao?: string | null
          empresa_id: string
          id?: string
          tipo?: string
        }
        Update: {
          competencia_id?: string
          created_at?: string
          criado_por?: string | null
          dados?: Json
          descricao?: string | null
          empresa_id?: string
          id?: string
          tipo?: string
        }
        Relationships: [{
          foreignKeyName: "folha_backup_competencia_id_fkey"
          columns: ["competencia_id"]
          isOneToOne: false
          referencedRelation: "folha_competencias"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_backup_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_comissao_faixas: {
        Row: {
          aliquota_percentual: number
          created_at: string
          empresa_id: string
          faixa_ordem: number
          id: string
          terceiro_id: string | null
          updated_at: string
          valor_ate: number | null
          valor_de: number
        }
        Insert: {
          aliquota_percentual: number
          created_at?: string
          empresa_id: string
          faixa_ordem: number
          id?: string
          terceiro_id?: string | null
          updated_at?: string
          valor_ate?: number | null
          valor_de?: number
        }
        Update: {
          aliquota_percentual?: number
          created_at?: string
          empresa_id?: string
          faixa_ordem?: number
          id?: string
          terceiro_id?: string | null
          updated_at?: string
          valor_ate?: number | null
          valor_de?: number
        }
        Relationships: [{
          foreignKeyName: "folha_comissao_faixas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_comissao_faixas_terceiro_id_fkey"
          columns: ["terceiro_id"]
          isOneToOne: false
          referencedRelation: "folha_terceiros"
          referencedColumns: ["id"]
        }]
      }
      folha_competencias: {
        Row: {
          ano: number
          created_at: string
          empresa_id: string
          fechada: boolean
          fechada_em: string | null
          id: string
          mes: number
          nome: string
          percentual_quinzena: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          empresa_id: string
          fechada?: boolean
          fechada_em?: string | null
          id?: string
          mes: number
          nome: string
          percentual_quinzena?: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          empresa_id?: string
          fechada?: boolean
          fechada_em?: string | null
          id?: string
          mes?: number
          nome?: string
          percentual_quinzena?: number
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "folha_competencias_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_decimo_terceiro: {
        Row: {
          adiantamento_1_parcela: number
          ano: number
          created_at: string
          empresa_id: string
          funcionario_id: string
          id: string
          inss_13: number
          irrf_13: number
          meses_trabalhados: number
          numero_dependentes: number
          observacoes: string | null
          pensao_alimenticia: number
          salario_base: number
          saldo_2_parcela: number
          status_1_parcela: string
          status_2_parcela: string
          total_13_bruto: number
          total_13_liquido: number
          updated_at: string
        }
        Insert: {
          adiantamento_1_parcela?: number
          ano: number
          created_at?: string
          empresa_id: string
          funcionario_id: string
          id?: string
          inss_13?: number
          irrf_13?: number
          meses_trabalhados?: number
          numero_dependentes?: number
          observacoes?: string | null
          pensao_alimenticia?: number
          salario_base: number
          saldo_2_parcela?: number
          status_1_parcela?: string
          status_2_parcela?: string
          total_13_bruto?: number
          total_13_liquido?: number
          updated_at?: string
        }
        Update: {
          adiantamento_1_parcela?: number
          ano?: number
          created_at?: string
          empresa_id?: string
          funcionario_id?: string
          id?: string
          inss_13?: number
          irrf_13?: number
          meses_trabalhados?: number
          numero_dependentes?: number
          observacoes?: string | null
          pensao_alimenticia?: number
          salario_base?: number
          saldo_2_parcela?: number
          status_1_parcela?: string
          status_2_parcela?: string
          total_13_bruto?: number
          total_13_liquido?: number
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "folha_decimo_terceiro_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_decimo_terceiro_funcionario_id_fkey"
          columns: ["funcionario_id"]
          isOneToOne: false
          referencedRelation: "funcionarios"
          referencedColumns: ["id"]
        }]
      }
      folha_pagamento_linhas: {
        Row: {
          adiantamento: number
          adiantamento_extra: number
          ajuda_custo: number
          comissao_vendas: number
          competencia_id: string
          created_at: string
          descontos_diversos: number
          empresa_id: string
          ferias: number
          funcionario_id: string | null
          gratificacao: number
          id: string
          inss: number
          irrf: number
          limpeza: number
          mensal_liquido: number
          modo_calculo: string
          numero_dependentes: number
          observacoes: string | null
          oculto: boolean
          pagamento_feriado: number
          pago_mensal: boolean
          pago_producao: boolean
          pago_quinzena: boolean
          pago_vendas: boolean
          producao_bruto: number
          producao_liquido: number
          producao_obs: string | null
          producao_obras: number
          producao_valor_obra: number
          quinzena_1_liquido: number
          quinzena_2_liquido: number
          quinzena_pago: boolean
          sabado: number
          salario_base: number
          salario_familia: number
          status_adiantamento: string
          status_pagamento_mensal: string
          status_pagamento_producao: string
          status_pagamento_quinzena: string
          status_pagamento_vendas: string
          terceiro_id: string | null
          tipo_colaborador: string
          updated_at: string
          vendas_ajuda: number
          vendas_bruto: number
          vendas_comissao: number
          vendas_liquido: number
          vendas_obras: number
          vendas_obs: string | null
          vendas_pago: boolean
          vendas_terceiro_id: string | null
          vendas_total_obras: number
          vendas_valor_obra: number
        }
        Insert: {
          adiantamento?: number
          adiantamento_extra?: number
          ajuda_custo?: number
          comissao_vendas?: number
          competencia_id: string
          created_at?: string
          descontos_diversos?: number
          empresa_id: string
          ferias?: number
          funcionario_id?: string | null
          gratificacao?: number
          id?: string
          inss?: number
          irrf?: number
          limpeza?: number
          mensal_liquido?: number
          modo_calculo?: string
          numero_dependentes?: number
          observacoes?: string | null
          oculto?: boolean
          pagamento_feriado?: number
          pago_mensal?: boolean
          pago_producao?: boolean
          pago_quinzena?: boolean
          pago_vendas?: boolean
          producao_bruto?: number
          producao_liquido?: number
          producao_obs?: string | null
          producao_obras?: number
          producao_valor_obra?: number
          quinzena_1_liquido?: number
          quinzena_2_liquido?: number
          quinzena_pago?: boolean
          sabado?: number
          salario_base?: number
          salario_familia?: number
          status_adiantamento?: string
          status_pagamento_mensal?: string
          status_pagamento_producao?: string
          status_pagamento_quinzena?: string
          status_pagamento_vendas?: string
          terceiro_id?: string | null
          tipo_colaborador?: string
          updated_at?: string
          vendas_ajuda?: number
          vendas_bruto?: number
          vendas_comissao?: number
          vendas_liquido?: number
          vendas_obras?: number
          vendas_obs?: string | null
          vendas_pago?: boolean
          vendas_terceiro_id?: string | null
          vendas_total_obras?: number
          vendas_valor_obra?: number
        }
        Update: {
          adiantamento?: number
          adiantamento_extra?: number
          ajuda_custo?: number
          comissao_vendas?: number
          competencia_id?: string
          created_at?: string
          descontos_diversos?: number
          empresa_id?: string
          ferias?: number
          funcionario_id?: string | null
          gratificacao?: number
          id?: string
          inss?: number
          irrf?: number
          limpeza?: number
          mensal_liquido?: number
          modo_calculo?: string
          numero_dependentes?: number
          observacoes?: string | null
          oculto?: boolean
          pagamento_feriado?: number
          pago_mensal?: boolean
          pago_producao?: boolean
          pago_quinzena?: boolean
          pago_vendas?: boolean
          producao_bruto?: number
          producao_liquido?: number
          producao_obs?: string | null
          producao_obras?: number
          producao_valor_obra?: number
          quinzena_1_liquido?: number
          quinzena_2_liquido?: number
          quinzena_pago?: boolean
          sabado?: number
          salario_base?: number
          salario_familia?: number
          status_adiantamento?: string
          status_pagamento_mensal?: string
          status_pagamento_producao?: string
          status_pagamento_quinzena?: string
          status_pagamento_vendas?: string
          terceiro_id?: string | null
          tipo_colaborador?: string
          updated_at?: string
          vendas_ajuda?: number
          vendas_bruto?: number
          vendas_comissao?: number
          vendas_liquido?: number
          vendas_obras?: number
          vendas_obs?: string | null
          vendas_pago?: boolean
          vendas_terceiro_id?: string | null
          vendas_total_obras?: number
          vendas_valor_obra?: number
        }
        Relationships: [{
          foreignKeyName: "folha_pagamento_linhas_competencia_id_fkey"
          columns: ["competencia_id"]
          isOneToOne: false
          referencedRelation: "folha_competencias"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_pagamento_linhas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_pagamento_linhas_funcionario_id_fkey"
          columns: ["funcionario_id"]
          isOneToOne: false
          referencedRelation: "funcionarios"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_pagamento_linhas_terceiro_id_fkey"
          columns: ["terceiro_id"]
          isOneToOne: false
          referencedRelation: "folha_terceiros"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_pagamento_linhas_vendas_terceiro_id_fkey"
          columns: ["vendas_terceiro_id"]
          isOneToOne: false
          referencedRelation: "folha_terceiros"
          referencedColumns: ["id"]
        }]
      }
      folha_tabelas_oficiais: {
        Row: {
          ano_vigencia: number
          created_at: string
          deducao_dependente_irrf: number
          faixas_inss: Json
          faixas_irrf: Json
          id: string
          limite_salario_familia: number
          salario_minimo: number
          updated_at: string
          valor_cota_salario_familia: number
        }
        Insert: {
          ano_vigencia: number
          created_at?: string
          deducao_dependente_irrf?: number
          faixas_inss?: Json
          faixas_irrf?: Json
          id?: string
          limite_salario_familia?: number
          salario_minimo?: number
          updated_at?: string
          valor_cota_salario_familia?: number
        }
        Update: {
          ano_vigencia?: number
          created_at?: string
          deducao_dependente_irrf?: number
          faixas_inss?: Json
          faixas_irrf?: Json
          id?: string
          limite_salario_familia?: number
          salario_minimo?: number
          updated_at?: string
          valor_cota_salario_familia?: number
        }
        Relationships: []
      }
      folha_terceiros: {
        Row: {
          ativo: boolean
          chave_pix: string | null
          cpf_cnpj: string | null
          created_at: string
          eh_vendedor: boolean
          empresa_id: string
          funcao: string | null
          id: string
          nome: string
          observacoes: string | null
          tipo_pix: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          chave_pix?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          eh_vendedor?: boolean
          empresa_id: string
          funcao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          tipo_pix?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          chave_pix?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          eh_vendedor?: boolean
          empresa_id?: string
          funcao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          tipo_pix?: string | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "folha_terceiros_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      funcionarios: {
        Row: {
          ativo: boolean
          cargo: string
          chave_pix: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          empresa_id: string
          id: string
          nome: string
          numero_dependentes: number
          observacoes: string | null
          salario_base: number
          tipo_contrato: string
          tipo_pix: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          empresa_id: string
          id?: string
          nome: string
          numero_dependentes?: number
          observacoes?: string | null
          salario_base?: number
          tipo_contrato?: string
          tipo_pix?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          chave_pix?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          numero_dependentes?: number
          observacoes?: string | null
          salario_base?: number
          tipo_contrato?: string
          tipo_pix?: string | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "funcionarios_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      materiais: {
        Row: {
          categoria: string
          controla_estoque: boolean
          created_at: string
          empresa_id: string
          estoque_atual: number
          estoque_minimo: number
          id: string
          nome: string
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          categoria: string
          controla_estoque?: boolean
          created_at?: string
          empresa_id: string
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          nome: string
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          controla_estoque?: boolean
          created_at?: string
          empresa_id?: string
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          nome?: string
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "materiais_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      metas_producao: {
        Row: {
          ano: number
          created_at: string
          empresa_id: string
          id: string
          mes: number
          meta_volume_m3: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          empresa_id: string
          id?: string
          mes: number
          meta_volume_m3: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          empresa_id?: string
          id?: string
          mes?: number
          meta_volume_m3?: number
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "metas_producao_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      motoristas: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [{
          foreignKeyName: "motoristas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      movimentacoes_estoque: {
        Row: {
          carga_id: string | null
          created_at: string
          data_movimentacao: string
          descricao: string | null
          empresa_id: string
          id: string
          material_id: string
          observacoes: string | null
          ordem_servico_id: string | null
          preco_unitario: number | null
          quantidade: number
          tipo_movimentacao: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          data_movimentacao?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          material_id: string
          observacoes?: string | null
          ordem_servico_id?: string | null
          preco_unitario?: number | null
          quantidade: number
          tipo_movimentacao: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          data_movimentacao?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          material_id?: string
          observacoes?: string | null
          ordem_servico_id?: string | null
          preco_unitario?: number | null
          quantidade?: number
          tipo_movimentacao?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [{
          foreignKeyName: "movimentacoes_estoque_carga_id_fkey"
          columns: ["carga_id"]
          isOneToOne: false
          referencedRelation: "cargas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "movimentacoes_estoque_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "movimentacoes_estoque_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "movimentacoes_estoque_ordem_servico_id_fkey"
          columns: ["ordem_servico_id"]
          isOneToOne: false
          referencedRelation: "ordens_servico"
          referencedColumns: ["id"]
        }]
      }
      ordens_servico: {
        Row: {
          agua_adic_central: number | null
          agua_adic_peca: number | null
          agua_adicional_termo: number | null
          bomba_estacionaria: string | null
          carga_id: string | null
          cliente_id: string | null
          created_at: string
          data_emissao: string
          destinatario_bairro: string | null
          destinatario_cep: string | null
          destinatario_cidade: string | null
          destinatario_cpf_cnpj: string | null
          destinatario_endereco: string | null
          destinatario_nome: string
          destinatario_telefone: string | null
          destinatario_uf: string | null
          empresa_id: string
          exibir_insumos_os: boolean
          hora_carga: string | null
          hora_chegada_central: string | null
          hora_chegada_obra: string | null
          hora_fim_descarga: string | null
          hora_inicio_descarga: string | null
          hora_saida_central: string | null
          hora_saida_obra: string | null
          id: string
          insumos_detalhados: Json | null
          itens: Json
          km_final: number | null
          km_inicial: number | null
          lacre: string | null
          local_descarga: string | null
          moldagem_central: string | null
          motorista_nome: string | null
          nome_obra: string | null
          nome_responsavel_termo: string | null
          numero_os: number
          observacoes: string | null
          peca_concretada: string | null
          slump_central_medido: string | null
          slump_central_saida: string | null
          slump_peca_medido: string | null
          slump_peca_saida: string | null
          slump_tolerancia: string | null
          updated_at: string
          veiculo_placa: string | null
          vendedor_nome: string | null
          visto_motorista_central: string | null
          visto_motorista_peca: string | null
          visto_obra: string | null
        }
        Insert: {
          agua_adic_central?: number | null
          agua_adic_peca?: number | null
          agua_adicional_termo?: number | null
          bomba_estacionaria?: string | null
          carga_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_cpf_cnpj?: string | null
          destinatario_endereco?: string | null
          destinatario_nome: string
          destinatario_telefone?: string | null
          destinatario_uf?: string | null
          empresa_id: string
          exibir_insumos_os?: boolean
          hora_carga?: string | null
          hora_chegada_central?: string | null
          hora_chegada_obra?: string | null
          hora_fim_descarga?: string | null
          hora_inicio_descarga?: string | null
          hora_saida_central?: string | null
          hora_saida_obra?: string | null
          id?: string
          insumos_detalhados?: Json | null
          itens?: Json
          km_final?: number | null
          km_inicial?: number | null
          lacre?: string | null
          local_descarga?: string | null
          moldagem_central?: string | null
          motorista_nome?: string | null
          nome_obra?: string | null
          nome_responsavel_termo?: string | null
          numero_os: number
          observacoes?: string | null
          peca_concretada?: string | null
          slump_central_medido?: string | null
          slump_central_saida?: string | null
          slump_peca_medido?: string | null
          slump_peca_saida?: string | null
          slump_tolerancia?: string | null
          updated_at?: string
          veiculo_placa?: string | null
          vendedor_nome?: string | null
          visto_motorista_central?: string | null
          visto_motorista_peca?: string | null
          visto_obra?: string | null
        }
        Update: {
          agua_adic_central?: number | null
          agua_adic_peca?: number | null
          agua_adicional_termo?: number | null
          bomba_estacionaria?: string | null
          carga_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_cpf_cnpj?: string | null
          destinatario_endereco?: string | null
          destinatario_nome?: string
          destinatario_telefone?: string | null
          destinatario_uf?: string | null
          empresa_id?: string
          exibir_insumos_os?: boolean
          hora_carga?: string | null
          hora_chegada_central?: string | null
          hora_chegada_obra?: string | null
          hora_fim_descarga?: string | null
          hora_inicio_descarga?: string | null
          hora_saida_central?: string | null
          hora_saida_obra?: string | null
          id?: string
          insumos_detalhados?: Json | null
          itens?: Json
          km_final?: number | null
          km_inicial?: number | null
          lacre?: string | null
          local_descarga?: string | null
          moldagem_central?: string | null
          motorista_nome?: string | null
          nome_obra?: string | null
          nome_responsavel_termo?: string | null
          numero_os?: number
          observacoes?: string | null
          peca_concretada?: string | null
          slump_central_medido?: string | null
          slump_central_saida?: string | null
          slump_peca_medido?: string | null
          slump_peca_saida?: string | null
          slump_tolerancia?: string | null
          updated_at?: string
          veiculo_placa?: string | null
          vendedor_nome?: string | null
          visto_motorista_central?: string | null
          visto_motorista_peca?: string | null
          visto_obra?: string | null
        }
        Relationships: [{
          foreignKeyName: "ordens_servico_carga_id_fkey"
          columns: ["carga_id"]
          isOneToOne: false
          referencedRelation: "cargas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "ordens_servico_cliente_id_fkey"
          columns: ["cliente_id"]
          isOneToOne: false
          referencedRelation: "clientes"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "ordens_servico_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      prazos_exame_empresa: {
        Row: {
          created_at: string
          dias_aviso_previo: number
          empresa_id: string
          id: string
          meses_validade: number
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_aviso_previo?: number
          empresa_id: string
          id?: string
          meses_validade?: number
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_aviso_previo?: number
          empresa_id?: string
          id?: string
          meses_validade?: number
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "prazos_exame_empresa_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      tracos: {
        Row: {
          aditivo_litro_m3: number | null
          agua_litro_m3: number | null
          areia_m3: number | null
          brita12_m3: number | null
          brita19_m3: number | null
          cimento_kg: number
          consumo_aditivo: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number | null
          created_at: string
          densidade_areia: number | null
          densidade_brita12: number | null
          densidade_brita19: number | null
          densidade_po_pedra: number | null
          empresa_id: string
          fck: number
          id: string
          nome: string
          observacoes: string | null
          po_pedra_m3: number | null
          rendimento_m3: number | null
          slump: number | null
          updated_at: string
        }
        Insert: {
          aditivo_litro_m3?: number | null
          agua_litro_m3?: number | null
          areia_m3?: number | null
          brita12_m3?: number | null
          brita19_m3?: number | null
          cimento_kg: number
          consumo_aditivo?: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra?: number | null
          created_at?: string
          densidade_areia?: number | null
          densidade_brita12?: number | null
          densidade_brita19?: number | null
          densidade_po_pedra?: number | null
          empresa_id: string
          fck: number
          id?: string
          nome: string
          observacoes?: string | null
          po_pedra_m3?: number | null
          rendimento_m3?: number | null
          slump?: number | null
          updated_at?: string
        }
        Update: {
          aditivo_litro_m3?: number | null
          agua_litro_m3?: number | null
          areia_m3?: number | null
          brita12_m3?: number | null
          brita19_m3?: number | null
          cimento_kg?: number
          consumo_aditivo?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number | null
          created_at?: string
          densidade_areia?: number | null
          densidade_brita12?: number | null
          densidade_brita19?: number | null
          densidade_po_pedra?: number | null
          empresa_id?: string
          fck?: number
          id?: string
          nome?: string
          observacoes?: string | null
          po_pedra_m3?: number | null
          rendimento_m3?: number | null
          slump?: number | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "tracos_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      usuarios_app: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          perfil: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          empresa_id?: string | null
          id?: string
          nome: string
          perfil: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          perfil?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [{
          foreignKeyName: "usuarios_app_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      veiculos: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string | null
          id: string
          modelo: string | null
          placa: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string | null
          placa: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string | null
          placa?: string
        }
        Relationships: [{
          foreignKeyName: "veiculos_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      atualizar_email_usuario: {
        Args: {
          p_novo_email: string
          p_usuario_app_id: string
        }
        Returns: Json
      } | {
        Args: {
          p_novo_email: string
          p_usuario_id: string
        }
        Returns: Json
      }
      calcular_saldos_estoque: {
        Args: {
          p_empresa_id?: string
        }
        Returns: {
          material_id: string
          saldo: number
        }[]
      }
      confirmar_email_auth_usuario: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      } | {
        Args: {
          p_usuario_id: string
        }
        Returns: boolean
      }
      proximo_numero_os: {
        Args: {
          p_empresa_id: string
        }
        Returns: number
      } | {
        Args: {
          p_empresa_id: string
        }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
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

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
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
