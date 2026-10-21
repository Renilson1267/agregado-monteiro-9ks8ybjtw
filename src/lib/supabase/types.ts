// @ts-nocheck
export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined
} | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with Database type
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cargas: {
        Row: {
          carga_zerada: boolean
          cidade_id: string | null
          cliente_id: string | null
          consumo_aditivo: number
          consumo_agua: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number
          created_at: string
          data: string
          empresa_id: string
          hora: string | null
          id: string
          motorista_id: string | null
          motorista_nome: string | null
          observacao: string | null
          recipiente_id: string | null
          traco_id: string | null
          traco_nome: string | null
          updated_at: string
          veiculo_id: string | null
          veiculo_placa: string | null
          volume_m3: number
        }
        Insert: {
          carga_zerada?: boolean
          cidade_id?: string | null
          cliente_id?: string | null
          consumo_aditivo?: number
          consumo_agua?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          data: string
          empresa_id: string
          hora?: string | null
          id?: string
          motorista_id?: string | null
          motorista_nome?: string | null
          observacao?: string | null
          recipiente_id?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          updated_at?: string
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Update: {
          carga_zerada?: boolean
          cidade_id?: string | null
          cliente_id?: string | null
          consumo_aditivo?: number
          consumo_agua?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          data?: string
          empresa_id?: string
          hora?: string | null
          id?: string
          motorista_id?: string | null
          motorista_nome?: string | null
          observacao?: string | null
          recipiente_id?: string | null
          traco_id?: string | null
          traco_nome?: string | null
          updated_at?: string
          veiculo_id?: string | null
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Relationships: [{
          foreignKeyName: "cargas_cidade_id_fkey"
          columns: ["cidade_id"]
          isOneToOne: false
          referencedRelation: "cidades"
          referencedColumns: ["id"]
        }, {
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
          foreignKeyName: "cargas_recipiente_id_fkey"
          columns: ["recipiente_id"]
          isOneToOne: false
          referencedRelation: "recipientes_estoque"
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
      cidades: {
        Row: {
          ativo: boolean
          created_at: string
          distancia_km: number | null
          empresa_id: string | null
          id: string
          nome: string
          uf: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          distancia_km?: number | null
          empresa_id?: string | null
          id?: string
          nome: string
          uf?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          distancia_km?: number | null
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
      controle_britas_cheques: {
        Row: {
          bom_para: string
          competencia: string
          created_at: string
          empresa_id: string
          fornecedor: string | null
          id: string
          numero_cheque: string
          observacao: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          bom_para: string
          competencia: string
          created_at?: string
          empresa_id: string
          fornecedor?: string | null
          id?: string
          numero_cheque: string
          observacao?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          bom_para?: string
          competencia?: string
          created_at?: string
          empresa_id?: string
          fornecedor?: string | null
          id?: string
          numero_cheque?: string
          observacao?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [{
          foreignKeyName: "controle_britas_cheques_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      controle_britas_compras: {
        Row: {
          competencia: string
          created_at: string
          empresa_id: string
          fornecedor: string | null
          id: string
          observacao: string | null
          quantidade_comprada_m3: number
          tipo_brita: string
          updated_at: string
          valor_total: number
          valor_unitario_m3: number
        }
        Insert: {
          competencia: string
          created_at?: string
          empresa_id: string
          fornecedor?: string | null
          id?: string
          observacao?: string | null
          quantidade_comprada_m3: number
          tipo_brita: string
          updated_at?: string
          valor_total: number
          valor_unitario_m3: number
        }
        Update: {
          competencia?: string
          created_at?: string
          empresa_id?: string
          fornecedor?: string | null
          id?: string
          observacao?: string | null
          quantidade_comprada_m3?: number
          tipo_brita?: string
          updated_at?: string
          valor_total?: number
          valor_unitario_m3?: number
        }
        Relationships: [{
          foreignKeyName: "controle_britas_compras_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      controle_britas_entregas: {
        Row: {
          competencia: string
          created_at: string
          data_entrega: string
          densidade_ton_m3: number
          empresa_id: string
          fornecedor: string | null
          id: string
          motorista: string | null
          numero_ticket: string | null
          observacao: string | null
          placa: string | null
          quantidade_informada: number
          quantidade_m3: number
          tipo_brita: string
          unidade_informada: string
          updated_at: string
        }
        Insert: {
          competencia: string
          created_at?: string
          data_entrega: string
          densidade_ton_m3?: number
          empresa_id: string
          fornecedor?: string | null
          id?: string
          motorista?: string | null
          numero_ticket?: string | null
          observacao?: string | null
          placa?: string | null
          quantidade_informada: number
          quantidade_m3: number
          tipo_brita: string
          unidade_informada?: string
          updated_at?: string
        }
        Update: {
          competencia?: string
          created_at?: string
          data_entrega?: string
          densidade_ton_m3?: number
          empresa_id?: string
          fornecedor?: string | null
          id?: string
          motorista?: string | null
          numero_ticket?: string | null
          observacao?: string | null
          placa?: string | null
          quantidade_informada?: number
          quantidade_m3?: number
          tipo_brita?: string
          unidade_informada?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "controle_britas_entregas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      controle_britas_saldos_anteriores: {
        Row: {
          competencia: string
          created_at: string
          empresa_id: string
          id: string
          saldo_m3: number
          saldo_reais: number
          tipo_brita: string
          updated_at: string
        }
        Insert: {
          competencia: string
          created_at?: string
          empresa_id: string
          id?: string
          saldo_m3?: number
          saldo_reais?: number
          tipo_brita: string
          updated_at?: string
        }
        Update: {
          competencia?: string
          created_at?: string
          empresa_id?: string
          id?: string
          saldo_m3?: number
          saldo_reais?: number
          tipo_brita?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "controle_britas_saldos_anteriores_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      controle_ferias: {
        Row: {
          adicional_um_terco: number
          colaborador_nome: string
          competencia: string
          created_at: string
          dias_gozo: number
          empresa_id: string
          fim_aquisitivo: string | null
          fim_gozo: string | null
          id: string
          inclusao_na_folha: boolean
          inicio_aquisitivo: string | null
          inicio_gozo: string | null
          observacoes: string | null
          origem: string
          remuneracao_base: number
          status: string
          total_liquido: number
          updated_at: string
          valor_ferias_bruto: number
        }
        Insert: {
          adicional_um_terco?: number
          colaborador_nome: string
          competencia: string
          created_at?: string
          dias_gozo?: number
          empresa_id: string
          fim_aquisitivo?: string | null
          fim_gozo?: string | null
          id?: string
          inclusao_na_folha?: boolean
          inicio_aquisitivo?: string | null
          inicio_gozo?: string | null
          observacoes?: string | null
          origem?: string
          remuneracao_base?: number
          status?: string
          total_liquido?: number
          updated_at?: string
          valor_ferias_bruto?: number
        }
        Update: {
          adicional_um_terco?: number
          colaborador_nome?: string
          competencia?: string
          created_at?: string
          dias_gozo?: number
          empresa_id?: string
          fim_aquisitivo?: string | null
          fim_gozo?: string | null
          id?: string
          inclusao_na_folha?: boolean
          inicio_aquisitivo?: string | null
          inicio_gozo?: string | null
          observacoes?: string | null
          origem?: string
          remuneracao_base?: number
          status?: string
          total_liquido?: number
          updated_at?: string
          valor_ferias_bruto?: number
        }
        Relationships: [{
          foreignKeyName: "controle_ferias_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          slug: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          slug: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          slug?: string
          telefone?: string | null
        }
        Relationships: []
      }
      exames_funcionarios: {
        Row: {
          clinica_local: string | null
          created_at: string
          data_realizacao: string
          data_validade: string
          documento_url: string | null
          empresa_id: string
          funcionario_id: string
          id: string
          laboratorio: string | null
          medico_crm: string | null
          medico_nome: string | null
          observacoes: string | null
          prazo_meses: number
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          clinica_local?: string | null
          created_at?: string
          data_realizacao: string
          data_validade: string
          documento_url?: string | null
          empresa_id: string
          funcionario_id: string
          id?: string
          laboratorio?: string | null
          medico_crm?: string | null
          medico_nome?: string | null
          observacoes?: string | null
          prazo_meses: number
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          clinica_local?: string | null
          created_at?: string
          data_realizacao?: string
          data_validade?: string
          documento_url?: string | null
          empresa_id?: string
          funcionario_id?: string
          id?: string
          laboratorio?: string | null
          medico_crm?: string | null
          medico_nome?: string | null
          observacoes?: string | null
          prazo_meses?: number
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "exames_funcionarios_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "exames_funcionarios_funcionario_id_fkey"
          columns: ["funcionario_id"]
          isOneToOne: false
          referencedRelation: "funcionarios"
          referencedColumns: ["id"]
        }]
      }
      folha_adiantamentos: {
        Row: {
          competencia: string
          created_at: string
          data_adiantamento: string | null
          empresa_id: string
          extra: boolean
          id: string
          nome: string
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
          extra?: boolean
          id?: string
          nome: string
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
          extra?: boolean
          id?: string
          nome?: string
          observacao?: string | null
          status?: string
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
        }]
      }
      folha_backup_historico: {
        Row: {
          competencia: string
          created_at: string
          dados: Json
          descricao: string | null
          empresa_id: string
          id: string
          linhas_contadas: number
          origem: string
          usuario_nome: string | null
        }
        Insert: {
          competencia: string
          created_at?: string
          dados: Json
          descricao?: string | null
          empresa_id: string
          id?: string
          linhas_contadas?: number
          origem?: string
          usuario_nome?: string | null
        }
        Update: {
          competencia?: string
          created_at?: string
          dados?: Json
          descricao?: string | null
          empresa_id?: string
          id?: string
          linhas_contadas?: number
          origem?: string
          usuario_nome?: string | null
        }
        Relationships: [{
          foreignKeyName: "folha_backup_historico_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_comissao_faixas: {
        Row: {
          aliquota: number
          created_at: string
          empresa_id: string | null
          faixa_ordem: number
          id: string
          parcela_deduzir: number
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          aliquota?: number
          created_at?: string
          empresa_id?: string | null
          faixa_ordem: number
          id?: string
          parcela_deduzir?: number
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          aliquota?: number
          created_at?: string
          empresa_id?: string | null
          faixa_ordem?: number
          id?: string
          parcela_deduzir?: number
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: [{
          foreignKeyName: "folha_comissao_faixas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_decimo_terceiro: {
        Row: {
          adiantamento_1a_parcela: number
          ano: number
          colaborador_nome: string
          created_at: string
          data_pagamento_1a: string | null
          data_pagamento_2a: string | null
          empresa_id: string
          id: string
          inss_13: number
          irrf_13: number
          meses_trabalhados: number
          observacoes: string | null
          origem: string
          remuneracao_base: number
          saldo_2a_parcela: number
          status_1a_parcela: string
          status_2a_parcela: string
          tipo_colaborador: string
          total_13_bruto: number
          total_13_liquido: number
          updated_at: string
        }
        Insert: {
          adiantamento_1a_parcela?: number
          ano: number
          colaborador_nome: string
          created_at?: string
          data_pagamento_1a?: string | null
          data_pagamento_2a?: string | null
          empresa_id: string
          id?: string
          inss_13?: number
          irrf_13?: number
          meses_trabalhados?: number
          observacoes?: string | null
          origem?: string
          remuneracao_base?: number
          saldo_2a_parcela?: number
          status_1a_parcela?: string
          status_2a_parcela?: string
          tipo_colaborador?: string
          total_13_bruto?: number
          total_13_liquido?: number
          updated_at?: string
        }
        Update: {
          adiantamento_1a_parcela?: number
          ano?: number
          colaborador_nome?: string
          created_at?: string
          data_pagamento_1a?: string | null
          data_pagamento_2a?: string | null
          empresa_id?: string
          id?: string
          inss_13?: number
          irrf_13?: number
          meses_trabalhados?: number
          observacoes?: string | null
          origem?: string
          remuneracao_base?: number
          saldo_2a_parcela?: number
          status_1a_parcela?: string
          status_2a_parcela?: string
          tipo_colaborador?: string
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
        }]
      }
      folha_pagamento_competencias: {
        Row: {
          ano: number
          bloqueada: boolean
          competencia: string
          created_at: string
          data_fechamento: string | null
          empresa_id: string
          fechada_por: string | null
          id: string
          mes: number
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          bloqueada?: boolean
          competencia: string
          created_at?: string
          data_fechamento?: string | null
          empresa_id: string
          fechada_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          bloqueada?: boolean
          competencia?: string
          created_at?: string
          data_fechamento?: string | null
          empresa_id?: string
          fechada_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "folha_pagamento_competencias_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_pagamento_linhas: {
        Row: {
          adiantamento_quinzenal: number
          ajuda_custo: number
          ajuda_extra: number
          chave_colaborador: string
          colaborador_nome: string
          comissao_vendas: number
          competencia: string
          created_at: string
          dias_ferias: number
          dias_folga: number
          dias_trabalhados: number
          empresa_id: string
          ferias: number
          funcao: string | null
          gratificacao: number
          horas_extras: number
          id: string
          inss: number
          irrf: number
          limpeza: number
          mensal_bruto: number
          mensal_liquido: number
          modo_calculo: string
          observacoes: string | null
          origem_registro: string
          outros_descontos: number
          premio_producao: number
          producao_bruto: number
          producao_liquido: number
          producao_paga: number
          quinzena_bruto: number
          quinzena_liquido: number
          quinzena_paga: number
          quinzena_porcentagem: number
          sabados_feriados: number
          salario_base: number
          salario_familia: number
          saldo_producao_restante: number
          status_pagamento_mensal: string
          status_pagamento_producao: string
          status_pagamento_quinzena: string
          terceiro_id: string | null
          tipo_colaborador: string
          total_descontos: number
          total_proventos: number
          updated_at: string
          valor_por_dia: number
          valor_por_m3: number
          valor_por_obra: number
          vendas_ajuda: number
          vendas_metros_cubicos: number
          vendas_porcentagem: number
          vendas_total_obras: number
          vendas_valor_bruto: number
          volume_produzido_m3: number
        }
        Insert: {
          adiantamento_quinzenal?: number
          ajuda_custo?: number
          ajuda_extra?: number
          chave_colaborador: string
          colaborador_nome: string
          comissao_vendas?: number
          competencia: string
          created_at?: string
          dias_ferias?: number
          dias_folga?: number
          dias_trabalhados?: number
          empresa_id: string
          ferias?: number
          funcao?: string | null
          gratificacao?: number
          horas_extras?: number
          id?: string
          inss?: number
          irrf?: number
          limpeza?: number
          mensal_bruto?: number
          mensal_liquido?: number
          modo_calculo?: string
          observacoes?: string | null
          origem_registro?: string
          outros_descontos?: number
          premio_producao?: number
          producao_bruto?: number
          producao_liquido?: number
          producao_paga?: number
          quinzena_bruto?: number
          quinzena_liquido?: number
          quinzena_paga?: number
          quinzena_porcentagem?: number
          sabados_feriados?: number
          salario_base?: number
          salario_familia?: number
          saldo_producao_restante?: number
          status_pagamento_mensal?: string
          status_pagamento_producao?: string
          status_pagamento_quinzena?: string
          terceiro_id?: string | null
          tipo_colaborador?: string
          total_descontos?: number
          total_proventos?: number
          updated_at?: string
          valor_por_dia?: number
          valor_por_m3?: number
          valor_por_obra?: number
          vendas_ajuda?: number
          vendas_metros_cubicos?: number
          vendas_porcentagem?: number
          vendas_total_obras?: number
          vendas_valor_bruto?: number
          volume_produzido_m3?: number
        }
        Update: {
          adiantamento_quinzenal?: number
          ajuda_custo?: number
          ajuda_extra?: number
          chave_colaborador?: string
          colaborador_nome?: string
          comissao_vendas?: number
          competencia?: string
          created_at?: string
          dias_ferias?: number
          dias_folga?: number
          dias_trabalhados?: number
          empresa_id?: string
          ferias?: number
          funcao?: string | null
          gratificacao?: number
          horas_extras?: number
          id?: string
          inss?: number
          irrf?: number
          limpeza?: number
          mensal_bruto?: number
          mensal_liquido?: number
          modo_calculo?: string
          observacoes?: string | null
          origem_registro?: string
          outros_descontos?: number
          premio_producao?: number
          producao_bruto?: number
          producao_liquido?: number
          producao_paga?: number
          quinzena_bruto?: number
          quinzena_liquido?: number
          quinzena_paga?: number
          quinzena_porcentagem?: number
          sabados_feriados?: number
          salario_base?: number
          salario_familia?: number
          saldo_producao_restante?: number
          status_pagamento_mensal?: string
          status_pagamento_producao?: string
          status_pagamento_quinzena?: string
          terceiro_id?: string | null
          tipo_colaborador?: string
          total_descontos?: number
          total_proventos?: number
          updated_at?: string
          valor_por_dia?: number
          valor_por_m3?: number
          valor_por_obra?: number
          vendas_ajuda?: number
          vendas_metros_cubicos?: number
          vendas_porcentagem?: number
          vendas_total_obras?: number
          vendas_valor_bruto?: number
          volume_produzido_m3?: number
        }
        Relationships: [{
          foreignKeyName: "folha_pagamento_linhas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "folha_pagamento_linhas_terceiro_id_fkey"
          columns: ["terceiro_id"]
          isOneToOne: false
          referencedRelation: "folha_terceiros"
          referencedColumns: ["id"]
        }]
      }
      folha_tabelas_oficiais: {
        Row: {
          aliquota: number
          created_at: string
          deducao: number
          faixa_ordem: number
          id: string
          salario_familia_cota: number | null
          tipo: string
          valor_final: number | null
          valor_inicial: number
          vigencia_ano: number
        }
        Insert: {
          aliquota?: number
          created_at?: string
          deducao?: number
          faixa_ordem: number
          id?: string
          salario_familia_cota?: number | null
          tipo: string
          valor_final?: number | null
          valor_inicial?: number
          vigencia_ano?: number
        }
        Update: {
          aliquota?: number
          created_at?: string
          deducao?: number
          faixa_ordem?: number
          id?: string
          salario_familia_cota?: number | null
          tipo?: string
          valor_final?: number | null
          valor_inicial?: number
          vigencia_ano?: number
        }
        Relationships: []
      }
      folha_terceiros: {
        Row: {
          ativo: boolean
          chave: string
          chave_pix: string | null
          cpf_cnpj: string | null
          created_at: string
          dados_bancarios: string | null
          eh_vendedor: boolean
          empresa_id: string
          funcao: string | null
          id: string
          modo_calculo_padrao: string
          nome: string
          observacoes: string | null
          porcentagem_comissao_padrao: number
          telefone: string | null
          tipo_pix: string | null
          updated_at: string
          valor_ajuda_padrao: number
          valor_por_m3_padrao: number
          valor_por_obra_padrao: number
        }
        Insert: {
          ativo?: boolean
          chave: string
          chave_pix?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          dados_bancarios?: string | null
          eh_vendedor?: boolean
          empresa_id: string
          funcao?: string | null
          id?: string
          modo_calculo_padrao?: string
          nome: string
          observacoes?: string | null
          porcentagem_comissao_padrao?: number
          telefone?: string | null
          tipo_pix?: string | null
          updated_at?: string
          valor_ajuda_padrao?: number
          valor_por_m3_padrao?: number
          valor_por_obra_padrao?: number
        }
        Update: {
          ativo?: boolean
          chave?: string
          chave_pix?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          dados_bancarios?: string | null
          eh_vendedor?: boolean
          empresa_id?: string
          funcao?: string | null
          id?: string
          modo_calculo_padrao?: string
          nome?: string
          observacoes?: string | null
          porcentagem_comissao_padrao?: number
          telefone?: string | null
          tipo_pix?: string | null
          updated_at?: string
          valor_ajuda_padrao?: number
          valor_por_m3_padrao?: number
          valor_por_obra_padrao?: number
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
          celular: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          empresa_id: string
          id: string
          nome: string
          observacoes: string | null
          rg: string | null
          setor: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          celular?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          empresa_id: string
          id?: string
          nome: string
          observacoes?: string | null
          rg?: string | null
          setor?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          celular?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          rg?: string | null
          setor?: string | null
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
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          empresa_id: string | null
          estoque_minimo: number
          id: string
          nome: string
          saldo_atual: number
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          estoque_minimo?: number
          id?: string
          nome: string
          saldo_atual?: number
          tipo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          estoque_minimo?: number
          id?: string
          nome?: string
          saldo_atual?: number
          tipo?: string
          unidade?: string
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
      motoristas: {
        Row: {
          ativo: boolean
          cnh: string | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          cnh?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          cnh?: string | null
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
          documento: string | null
          empresa_id: string
          id: string
          material_id: string
          motivo_ajuste: string | null
          observacao: string | null
          preco_unitario: number | null
          quantidade: number
          recipiente_id: string | null
          tipo: string
          usuario_id: string | null
          valor_total: number | null
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          data_movimentacao?: string
          documento?: string | null
          empresa_id: string
          id?: string
          material_id: string
          motivo_ajuste?: string | null
          observacao?: string | null
          preco_unitario?: number | null
          quantidade: number
          recipiente_id?: string | null
          tipo: string
          usuario_id?: string | null
          valor_total?: number | null
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          data_movimentacao?: string
          documento?: string | null
          empresa_id?: string
          id?: string
          material_id?: string
          motivo_ajuste?: string | null
          observacao?: string | null
          preco_unitario?: number | null
          quantidade?: number
          recipiente_id?: string | null
          tipo?: string
          usuario_id?: string | null
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
          foreignKeyName: "movimentacoes_estoque_recipiente_id_fkey"
          columns: ["recipiente_id"]
          isOneToOne: false
          referencedRelation: "recipientes_estoque"
          referencedColumns: ["id"]
        }]
      }
      ordens_servico: {
        Row: {
          agua_adic_central: number | null
          agua_adic_peca: number | null
          agua_adicional_termo: number | null
          bairro: string | null
          bomba_estacionaria: string | null
          carga_id: string | null
          cep: string | null
          cidade: string | null
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
          endereco: string | null
          exibir_insumos_os: boolean | null
          hora_carga: string | null
          hora_chegada_central: string | null
          hora_chegada_obra: string | null
          hora_fim_descarga: string | null
          hora_inicio_descarga: string | null
          hora_saida_central: string | null
          hora_saida_obra: string | null
          id: string
          insumos_detalhados: Json | null
          itens: Json | null
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
          status: string | null
          uf: string | null
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
          bairro?: string | null
          bomba_estacionaria?: string | null
          carga_id?: string | null
          cep?: string | null
          cidade?: string | null
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
          endereco?: string | null
          exibir_insumos_os?: boolean | null
          hora_carga?: string | null
          hora_chegada_central?: string | null
          hora_chegada_obra?: string | null
          hora_fim_descarga?: string | null
          hora_inicio_descarga?: string | null
          hora_saida_central?: string | null
          hora_saida_obra?: string | null
          id?: string
          insumos_detalhados?: Json | null
          itens?: Json | null
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
          status?: string | null
          uf?: string | null
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
          bairro?: string | null
          bomba_estacionaria?: string | null
          carga_id?: string | null
          cep?: string | null
          cidade?: string | null
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
          endereco?: string | null
          exibir_insumos_os?: boolean | null
          hora_carga?: string | null
          hora_chegada_central?: string | null
          hora_chegada_obra?: string | null
          hora_fim_descarga?: string | null
          hora_inicio_descarga?: string | null
          hora_saida_central?: string | null
          hora_saida_obra?: string | null
          id?: string
          insumos_detalhados?: Json | null
          itens?: Json | null
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
          status?: string | null
          uf?: string | null
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
      prazos_exames_empresa: {
        Row: {
          created_at: string
          dias_alerta_amarelo: number
          dias_alerta_laranja: number
          empresa_id: string
          id: string
          prazo_meses: number
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_alerta_amarelo?: number
          dias_alerta_laranja?: number
          empresa_id: string
          id?: string
          prazo_meses?: number
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_alerta_amarelo?: number
          dias_alerta_laranja?: number
          empresa_id?: string
          id?: string
          prazo_meses?: number
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "prazos_exames_empresa_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      precos_material_historico: {
        Row: {
          created_at: string
          data_inicio: string
          empresa_id: string
          id: string
          material_codigo: string
          observacao: string | null
          preco_unitario: number
          unidade: string
        }
        Insert: {
          created_at?: string
          data_inicio: string
          empresa_id: string
          id?: string
          material_codigo: string
          observacao?: string | null
          preco_unitario: number
          unidade: string
        }
        Update: {
          created_at?: string
          data_inicio?: string
          empresa_id?: string
          id?: string
          material_codigo?: string
          observacao?: string | null
          preco_unitario?: number
          unidade?: string
        }
        Relationships: [{
          foreignKeyName: "precos_material_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      recipientes_estoque: {
        Row: {
          created_at: string
          empresa_id: string
          estoque_minimo: number
          id: string
          identificador: string
          material_codigo: string
          material_id: string | null
          material_nome: string
          nome: string
          ordem: number
          saldo_atual: number
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estoque_minimo?: number
          id?: string
          identificador: string
          material_codigo: string
          material_id?: string | null
          material_nome: string
          nome: string
          ordem?: number
          saldo_atual?: number
          tipo: string
          unidade: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estoque_minimo?: number
          id?: string
          identificador?: string
          material_codigo?: string
          material_id?: string | null
          material_nome?: string
          nome?: string
          ordem?: number
          saldo_atual?: number
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "recipientes_estoque_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "recipientes_estoque_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }]
      }
      tracos: {
        Row: {
          ativo: boolean
          consumo_aditivo: number
          consumo_agua: number | null
          consumo_areia: number
          consumo_brita12: number
          consumo_brita19: number
          consumo_cimento: number
          consumo_po_pedra: number
          created_at: string
          descricao: string | null
          empresa_id: string | null
          fck_mpa: number | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          consumo_aditivo?: number
          consumo_agua?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fck_mpa?: number | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          consumo_aditivo?: number
          consumo_agua?: number | null
          consumo_areia?: number
          consumo_brita12?: number
          consumo_brita19?: number
          consumo_cimento?: number
          consumo_po_pedra?: number
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fck_mpa?: number | null
          id?: string
          nome?: string
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
        Args: { p_novo_email: string p_usuario_app_id: string }
        Returns: Json
      } | {
        Args: { p_novo_email: string p_usuario_id: string }
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
        Args: { p_user_id: string }
        Returns: Json
      } | {
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
