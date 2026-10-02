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
      caixas: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          nome: string
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          saldo_inicial?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "caixas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      cargas: {
        Row: {
          areia_lavada: number | null
          areia_sje: number | null
          brita_0: number | null
          brita_1: number | null
          brita_2: number | null
          carga_zerada: boolean | null
          cidade_nome: string | null
          cimento_branco: number | null
          cimento_cinza: number | null
          cliente_nome: string | null
          created_at: string
          data: string
          empresa_id: string
          filtro_areia: number | null
          horario: string | null
          id: string
          motorista_nome: string | null
          numero_os: string | null
          obs: string | null
          pedrisco: number | null
          po_de_brita: number | null
          sika_1: number | null
          sika_2: number | null
          status: string
          traco_nome: string | null
          updated_at: string
          veiculo_placa: string | null
          volume_m3: number
        }
        Insert: {
          areia_lavada?: number | null
          areia_sje?: number | null
          brita_0?: number | null
          brita_1?: number | null
          brita_2?: number | null
          carga_zerada?: boolean | null
          cidade_nome?: string | null
          cimento_branco?: number | null
          cimento_cinza?: number | null
          cliente_nome?: string | null
          created_at?: string
          data: string
          empresa_id: string
          filtro_areia?: number | null
          horario?: string | null
          id?: string
          motorista_nome?: string | null
          numero_os?: string | null
          obs?: string | null
          pedrisco?: number | null
          po_de_brita?: number | null
          sika_1?: number | null
          sika_2?: number | null
          status?: string
          traco_nome?: string | null
          updated_at?: string
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Update: {
          areia_lavada?: number | null
          areia_sje?: number | null
          brita_0?: number | null
          brita_1?: number | null
          brita_2?: number | null
          carga_zerada?: boolean | null
          cidade_nome?: string | null
          cimento_branco?: number | null
          cimento_cinza?: number | null
          cliente_nome?: string | null
          created_at?: string
          data?: string
          empresa_id?: string
          filtro_areia?: number | null
          horario?: string | null
          id?: string
          motorista_nome?: string | null
          numero_os?: string | null
          obs?: string | null
          pedrisco?: number | null
          po_de_brita?: number | null
          sika_1?: number | null
          sika_2?: number | null
          status?: string
          traco_nome?: string | null
          updated_at?: string
          veiculo_placa?: string | null
          volume_m3?: number
        }
        Relationships: [{
          foreignKeyName: "cargas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      categorias_movimentacao: {
        Row: {
          ativo: boolean
          created_at: string
          cor: string | null
          icone: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          cor?: string | null
          icone?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          cor?: string | null
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      cidades: {
        Row: {
          ativo: boolean
          created_at: string
          distancia_km: number | null
          empresa_id: string
          id: string
          nome: string
          uf: string
          updated_at: string
          valor_frete_padrao: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          distancia_km?: number | null
          empresa_id: string
          id?: string
          nome: string
          uf?: string
          updated_at?: string
          valor_frete_padrao?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          distancia_km?: number | null
          empresa_id?: string
          id?: string
          nome?: string
          uf?: string
          updated_at?: string
          valor_frete_padrao?: number | null
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
          complemento: string | null
          created_at: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          limite_credito: number | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          razao_social: string | null
          status_credito: string | null
          telefone: string | null
          tipo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          limite_credito?: number | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          status_credito?: string | null
          telefone?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          limite_credito?: number | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          status_credito?: string | null
          telefone?: string | null
          tipo?: string
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
          data_vencimento: string
          dias_aviso_previo: number
          empresa_id: string
          funcionario_id: string
          id: string
          laboratorio: string | null
          medico_crm: string | null
          medico_nome: string | null
          observacoes: string | null
          resultado: string
          status: string
          tipo_exame: string
          updated_at: string
          url_anexo: string | null
        }
        Insert: {
          created_at?: string
          data_realizacao: string
          data_vencimento: string
          dias_aviso_previo?: number
          empresa_id: string
          funcionario_id: string
          id?: string
          laboratorio?: string | null
          medico_crm?: string | null
          medico_nome?: string | null
          observacoes?: string | null
          resultado?: string
          status?: string
          tipo_exame: string
          updated_at?: string
          url_anexo?: string | null
        }
        Update: {
          created_at?: string
          data_realizacao?: string
          data_vencimento?: string
          dias_aviso_previo?: number
          empresa_id?: string
          funcionario_id?: string
          id?: string
          laboratorio?: string | null
          medico_crm?: string | null
          medico_nome?: string | null
          observacoes?: string | null
          resultado?: string
          status?: string
          tipo_exame?: string
          updated_at?: string
          url_anexo?: string | null
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
          ano_exercicio: number
          created_at: string
          dias_direito: number
          dias_gozados: number
          dias_saldo: number
          dias_vendidos: number
          empresa_id: string
          fim_aquisitivo: string
          fim_gozo: string | null
          funcionario_id: string
          id: string
          inicio_aquisitivo: string
          inicio_gozo: string | null
          limite_concessao: string
          observacoes: string | null
          prazo_limite: string
          status: string
          updated_at: string
          valor_abono: number | null
          valor_ferias: number | null
          valor_terco: number | null
        }
        Insert: {
          ano_exercicio: number
          created_at?: string
          dias_direito?: number
          dias_gozados?: number
          dias_saldo?: number
          dias_vendidos?: number
          empresa_id: string
          fim_aquisitivo: string
          fim_gozo?: string | null
          funcionario_id: string
          id?: string
          inicio_aquisitivo: string
          inicio_gozo?: string | null
          limite_concessao: string
          observacoes?: string | null
          prazo_limite: string
          status?: string
          updated_at?: string
          valor_abono?: number | null
          valor_ferias?: number | null
          valor_terco?: number | null
        }
        Update: {
          ano_exercicio?: number
          created_at?: string
          dias_direito?: number
          dias_gozados?: number
          dias_saldo?: number
          dias_vendidos?: number
          empresa_id?: string
          fim_aquisitivo?: string
          fim_gozo?: string | null
          funcionario_id?: string
          id?: string
          inicio_aquisitivo?: string
          inicio_gozo?: string | null
          limite_concessao?: string
          observacoes?: string | null
          prazo_limite?: string
          status?: string
          updated_at?: string
          valor_abono?: number | null
          valor_ferias?: number | null
          valor_terco?: number | null
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
      custos_carga: {
        Row: {
          carga_id: string
          created_at: string
          custo_aditivos: number
          custo_agregados: number
          custo_cimento: number
          custo_frete: number
          custo_total: number
          id: string
          lucro_bruto: number | null
          margem_lucro: number | null
          preco_venda: number | null
          updated_at: string
        }
        Insert: {
          carga_id: string
          created_at?: string
          custo_aditivos?: number
          custo_agregados?: number
          custo_cimento?: number
          custo_frete?: number
          custo_total?: number
          id?: string
          lucro_bruto?: number | null
          margem_lucro?: number | null
          preco_venda?: number | null
          updated_at?: string
        }
        Update: {
          carga_id?: string
          created_at?: string
          custo_aditivos?: number
          custo_agregados?: number
          custo_cimento?: number
          custo_frete?: number
          custo_total?: number
          id?: string
          lucro_bruto?: number | null
          margem_lucro?: number | null
          preco_venda?: number | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "custos_carga_carga_id_fkey"
          columns: ["carga_id"]
          isOneToOne: true
          referencedRelation: "cargas"
          referencedColumns: ["id"]
        }]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          slug: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          slug: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          slug?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      estoque_insumos: {
        Row: {
          created_at: string
          custo_medio_unitario: number | null
          empresa_id: string
          id: string
          material_id: string
          ponto_pedido: number | null
          quantidade_atual: number
          quantidade_minima: number | null
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_medio_unitario?: number | null
          empresa_id: string
          id?: string
          material_id: string
          ponto_pedido?: number | null
          quantidade_atual?: number
          quantidade_minima?: number | null
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_medio_unitario?: number | null
          empresa_id?: string
          id?: string
          material_id?: string
          ponto_pedido?: number | null
          quantidade_atual?: number
          quantidade_minima?: number | null
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "estoque_insumos_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "estoque_insumos_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }]
      }
      folha_comissao_faixas: {
        Row: {
          ate_valor: number
          created_at: string
          de_valor: number
          empresa_id: string
          id: string
          ordem: number
          percentual: number
          updated_at: string
        }
        Insert: {
          ate_valor: number
          created_at?: string
          de_valor: number
          empresa_id: string
          id?: string
          ordem?: number
          percentual: number
          updated_at?: string
        }
        Update: {
          ate_valor?: number
          created_at?: string
          de_valor?: number
          empresa_id?: string
          id?: string
          ordem?: number
          percentual?: number
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "folha_comissao_faixas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_competencias: {
        Row: {
          ano: number
          competencia: string
          created_at: string
          data_competencia: string | null
          empresa_id: string
          fechada: boolean
          fechada_em: string | null
          fechada_por: string | null
          id: string
          mes: number
          observacoes: string | null
          percentual_quinzena: number | null
          total_bruto: number | null
          total_descontos: number | null
          total_liquido: number | null
          total_proventos: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          competencia: string
          created_at?: string
          data_competencia?: string | null
          empresa_id: string
          fechada?: boolean
          fechada_em?: string | null
          fechada_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          percentual_quinzena?: number | null
          total_bruto?: number | null
          total_descontos?: number | null
          total_liquido?: number | null
          total_proventos?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          competencia?: string
          created_at?: string
          data_competencia?: string | null
          empresa_id?: string
          fechada?: boolean
          fechada_em?: string | null
          fechada_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          percentual_quinzena?: number | null
          total_bruto?: number | null
          total_descontos?: number | null
          total_liquido?: number | null
          total_proventos?: number | null
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
          adiantamento_1a_parcela: number
          ano: number
          base_calculo: number
          bruto_13: number
          bruto_2a_parcela: number
          chave_pix: string | null
          competencia_1a_parcela: string | null
          competencia_2a_parcela: string | null
          conta: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_pagamento_1a: string | null
          data_pagamento_2a: string | null
          empresa_id: string
          funcao: string
          funcionario_id: string | null
          id: string
          inativo: boolean
          inss_13: number
          inss_2a_parcela: number
          irrf_13: number
          irrf_2a_parcela: number
          liquido_1a_parcela: number
          liquido_2a_parcela: number
          meses_trabalhados: number
          modo_calculo: string
          nome: string
          observacoes: string | null
          oculto: boolean
          pix: string | null
          salario_bruto_mensal: number
          status_1a_parcela: string
          status_2a_parcela: string
          tipo: string
          total_descontos_13: number
          total_liquido_13: number
          unidade: string
          updated_at: string
        }
        Insert: {
          adiantamento_1a_parcela?: number
          ano: number
          base_calculo?: number
          bruto_13?: number
          bruto_2a_parcela?: number
          chave_pix?: string | null
          competencia_1a_parcela?: string | null
          competencia_2a_parcela?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_pagamento_1a?: string | null
          data_pagamento_2a?: string | null
          empresa_id: string
          funcao: string
          funcionario_id?: string | null
          id?: string
          inativo?: boolean
          inss_13?: number
          inss_2a_parcela?: number
          irrf_13?: number
          irrf_2a_parcela?: number
          liquido_1a_parcela?: number
          liquido_2a_parcela?: number
          meses_trabalhados?: number
          modo_calculo?: string
          nome: string
          observacoes?: string | null
          oculto?: boolean
          pix?: string | null
          salario_bruto_mensal?: number
          status_1a_parcela?: string
          status_2a_parcela?: string
          tipo?: string
          total_descontos_13?: number
          total_liquido_13?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          adiantamento_1a_parcela?: number
          ano?: number
          base_calculo?: number
          bruto_13?: number
          bruto_2a_parcela?: number
          chave_pix?: string | null
          competencia_1a_parcela?: string | null
          competencia_2a_parcela?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_pagamento_1a?: string | null
          data_pagamento_2a?: string | null
          empresa_id?: string
          funcao?: string
          funcionario_id?: string | null
          id?: string
          inativo?: boolean
          inss_13?: number
          inss_2a_parcela?: number
          irrf_13?: number
          irrf_2a_parcela?: number
          liquido_1a_parcela?: number
          liquido_2a_parcela?: number
          meses_trabalhados?: number
          modo_calculo?: string
          nome?: string
          observacoes?: string | null
          oculto?: boolean
          pix?: string | null
          salario_bruto_mensal?: number
          status_1a_parcela?: string
          status_2a_parcela?: string
          tipo?: string
          total_descontos_13?: number
          total_liquido_13?: number
          unidade?: string
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
      folha_pagamento_linhas: {
        Row: {
          adiantamento: number
          ajuda_custo: number
          base_inss: number | null
          base_irrf: number | null
          bruto: number
          cargo: string
          chave_pix: string | null
          comissao: number
          competencia: string
          competencia_id: string
          conta: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          dependentes_irrf: number | null
          empresa_id: string
          familia: number
          feriado: number
          ferias: number
          filhos: number
          funcao: string
          funcionario_id: string | null
          gratificacao: number
          id: string
          inativo: boolean
          inss: number
          inss_aliquota_efetiva: number | null
          inss_retido: number | null
          ir: number
          irrf_retido: number | null
          limpeza: number
          matricula: string | null
          mensal_liquido: number
          modo_calculo: string
          nome: string
          obras: number
          observacao_linha: string | null
          oculto: boolean
          origem_importacao: string | null
          pix: string | null
          producao: number
          quinzena: number
          quinzena_2: number
          sabado: number
          salario_base: number
          salario_liquido: number
          tipo: string
          total_descontos: number | null
          total_proventos: number | null
          unidade: string
          updated_at: string
          valor_obra: number
          vendas_ajuda: number
          vendas_obra: number
        }
        Insert: {
          adiantamento?: number
          ajuda_custo?: number
          base_inss?: number | null
          base_irrf?: number | null
          bruto?: number
          cargo: string
          chave_pix?: string | null
          comissao?: number
          competencia: string
          competencia_id: string
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          dependentes_irrf?: number | null
          empresa_id: string
          familia?: number
          feriado?: number
          ferias?: number
          filhos?: number
          funcao: string
          funcionario_id?: string | null
          gratificacao?: number
          id?: string
          inativo?: boolean
          inss?: number
          inss_aliquota_efetiva?: number | null
          inss_retido?: number | null
          ir?: number
          irrf_retido?: number | null
          limpeza?: number
          matricula?: string | null
          mensal_liquido?: number
          modo_calculo?: string
          nome: string
          obras?: number
          observacao_linha?: string | null
          oculto?: boolean
          origem_importacao?: string | null
          pix?: string | null
          producao?: number
          quinzena?: number
          quinzena_2?: number
          sabado?: number
          salario_base?: number
          salario_liquido?: number
          tipo?: string
          total_descontos?: number | null
          total_proventos?: number | null
          unidade?: string
          updated_at?: string
          valor_obra?: number
          vendas_ajuda?: number
          vendas_obra?: number
        }
        Update: {
          adiantamento?: number
          ajuda_custo?: number
          base_inss?: number | null
          base_irrf?: number | null
          bruto?: number
          cargo?: string
          chave_pix?: string | null
          comissao?: number
          competencia?: string
          competencia_id?: string
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          dependentes_irrf?: number | null
          empresa_id?: string
          familia?: number
          feriado?: number
          ferias?: number
          filhos?: number
          funcao?: string
          funcionario_id?: string | null
          gratificacao?: number
          id?: string
          inativo?: boolean
          inss?: number
          inss_aliquota_efetiva?: number | null
          inss_retido?: number | null
          ir?: number
          irrf_retido?: number | null
          limpeza?: number
          matricula?: string | null
          mensal_liquido?: number
          modo_calculo?: string
          nome?: string
          obras?: number
          observacao_linha?: string | null
          oculto?: boolean
          origem_importacao?: string | null
          pix?: string | null
          producao?: number
          quinzena?: number
          quinzena_2?: number
          sabado?: number
          salario_base?: number
          salario_liquido?: number
          tipo?: string
          total_descontos?: number | null
          total_proventos?: number | null
          unidade?: string
          updated_at?: string
          valor_obra?: number
          vendas_ajuda?: number
          vendas_obra?: number
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
        }]
      }
      folha_tabelas_oficiais: {
        Row: {
          ano: number
          created_at: string
          deducao_dependente_ir: number | null
          descricao: string | null
          empresa_id: string
          id: string
          inss_faixas: Json
          ir_coeficiente_reducao: number | null
          ir_desconto_gradual_ate: number | null
          ir_isento_ate: number | null
          ir_parcela_fixa_reducao: number | null
          irrf_faixas: Json
          salario_familia_limite: number | null
          salario_familia_valor_por_filho: number | null
          salario_minimo: number | null
          teto_inss: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          deducao_dependente_ir?: number | null
          descricao?: string | null
          empresa_id: string
          id?: string
          inss_faixas?: Json
          ir_coeficiente_reducao?: number | null
          ir_desconto_gradual_ate?: number | null
          ir_isento_ate?: number | null
          ir_parcela_fixa_reducao?: number | null
          irrf_faixas?: Json
          salario_familia_limite?: number | null
          salario_familia_valor_por_filho?: number | null
          salario_minimo?: number | null
          teto_inss?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          deducao_dependente_ir?: number | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          inss_faixas?: Json
          ir_coeficiente_reducao?: number | null
          ir_desconto_gradual_ate?: number | null
          ir_isento_ate?: number | null
          ir_parcela_fixa_reducao?: number | null
          irrf_faixas?: Json
          salario_familia_limite?: number | null
          salario_familia_valor_por_filho?: number | null
          salario_minimo?: number | null
          teto_inss?: number | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "folha_tabelas_oficiais_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      folha_terceiros: {
        Row: {
          ativo: boolean
          bruto: number | null
          chave_pix: string | null
          conta: string | null
          created_at: string
          eh_vendedor: boolean
          empresa_id: string
          id: string
          nome: string
          obs: string | null
          pix: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bruto?: number | null
          chave_pix?: string | null
          conta?: string | null
          created_at?: string
          eh_vendedor?: boolean
          empresa_id: string
          id?: string
          nome: string
          obs?: string | null
          pix?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bruto?: number | null
          chave_pix?: string | null
          conta?: string | null
          created_at?: string
          eh_vendedor?: boolean
          empresa_id?: string
          id?: string
          nome?: string
          obs?: string | null
          pix?: string | null
          unidade?: string
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
          bruto: number
          chave_pix: string | null
          cnh_categoria: string | null
          cnh_numero: string | null
          cnh_validade: string | null
          conta: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          empresa_id: string
          filhos: number
          funcao: string
          id: string
          inativo: boolean
          matricula: string | null
          nome: string
          observacoes: string | null
          oculto: boolean
          pix: string | null
          rg: string | null
          telefone: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bruto?: number
          chave_pix?: string | null
          cnh_categoria?: string | null
          cnh_numero?: string | null
          cnh_validade?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          empresa_id: string
          filhos?: number
          funcao: string
          id?: string
          inativo?: boolean
          matricula?: string | null
          nome: string
          observacoes?: string | null
          oculto?: boolean
          pix?: string | null
          rg?: string | null
          telefone?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bruto?: number
          chave_pix?: string | null
          cnh_categoria?: string | null
          cnh_numero?: string | null
          cnh_validade?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          empresa_id?: string
          filhos?: number
          funcao?: string
          id?: string
          inativo?: boolean
          matricula?: string | null
          nome?: string
          observacoes?: string | null
          oculto?: boolean
          pix?: string | null
          rg?: string | null
          telefone?: string | null
          unidade?: string
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
      historico_preco_material: {
        Row: {
          created_at: string
          created_by: string | null
          data_vigencia: string
          empresa_id: string | null
          id: string
          material_id: string
          motivo: string | null
          preco_novo: number
          preco_unitario: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_vigencia?: string
          empresa_id?: string | null
          id?: string
          material_id: string
          motivo?: string | null
          preco_novo: number
          preco_unitario: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_vigencia?: string
          empresa_id?: string | null
          id?: string
          material_id?: string
          motivo?: string | null
          preco_novo?: number
          preco_unitario?: number
        }
        Relationships: [{
          foreignKeyName: "historico_preco_material_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }]
      }
      itens_ordem_servico: {
        Row: {
          created_at: string
          descricao: string
          id: string
          observacao: string | null
          ordem_servico_id: string
          quantidade: number
          tipo: string
          unidade: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          observacao?: string | null
          ordem_servico_id: string
          quantidade?: number
          tipo?: string
          unidade?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          observacao?: string | null
          ordem_servico_id?: string
          quantidade?: number
          tipo?: string
          unidade?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [{
          foreignKeyName: "itens_ordem_servico_ordem_servico_id_fkey"
          columns: ["ordem_servico_id"]
          isOneToOne: false
          referencedRelation: "ordens_servico"
          referencedColumns: ["id"]
        }]
      }
      materiais: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          preco_unitario: number
          tipo: string
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          preco_unitario?: number
          tipo: string
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          preco_unitario?: number
          tipo?: string
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      motoristas: {
        Row: {
          ativo: boolean
          cnh: string | null
          cnh_validade: string | null
          created_at: string
          empresa_id: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnh?: string | null
          cnh_validade?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnh?: string | null
          cnh_validade?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "motoristas_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      movimentacoes_caixa: {
        Row: {
          caixa_id: string
          categoria_id: string | null
          created_at: string
          data: string
          descricao: string
          empresa_id: string
          forma_pagamento: string
          id: string
          tipo: string
          updated_at: string
          usuario_id: string | null
          valor: number
        }
        Insert: {
          caixa_id: string
          categoria_id?: string | null
          created_at?: string
          data: string
          descricao: string
          empresa_id: string
          forma_pagamento?: string
          id?: string
          tipo: string
          updated_at?: string
          usuario_id?: string | null
          valor: number
        }
        Update: {
          caixa_id?: string
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          tipo?: string
          updated_at?: string
          usuario_id?: string | null
          valor?: number
        }
        Relationships: [{
          foreignKeyName: "movimentacoes_caixa_caixa_id_fkey"
          columns: ["caixa_id"]
          isOneToOne: false
          referencedRelation: "caixas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "movimentacoes_caixa_categoria_id_fkey"
          columns: ["categoria_id"]
          isOneToOne: false
          referencedRelation: "categorias_movimentacao"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "movimentacoes_caixa_empresa_id_fkey"
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
          created_by: string | null
          data_movimentacao: string
          documento_referencia: string | null
          empresa_id: string
          id: string
          material_id: string
          motivo: string | null
          observacoes: string | null
          quantidade: number
          saldo_anterior: number
          saldo_posterior: number
          tipo: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          created_by?: string | null
          data_movimentacao?: string
          documento_referencia?: string | null
          empresa_id: string
          id?: string
          material_id: string
          motivo?: string | null
          observacoes?: string | null
          quantidade: number
          saldo_anterior: number
          saldo_posterior: number
          tipo: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          created_by?: string | null
          data_movimentacao?: string
          documento_referencia?: string | null
          empresa_id?: string
          id?: string
          material_id?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          saldo_anterior?: number
          saldo_posterior?: number
          tipo?: string
          valor_total?: number | null
          valor_unitario?: number | null
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
        }]
      }
      notas_fiscais_entrada: {
        Row: {
          chave_acesso: string
          created_at: string
          data_emissao: string
          empresa_id: string
          fornecedor_cnpj: string
          fornecedor_nome: string
          id: string
          itens: Json
          numero_nf: string
          serie: string | null
          status: string
          updated_at: string
          valor_total: number
          xml_original: string | null
        }
        Insert: {
          chave_acesso: string
          created_at?: string
          data_emissao: string
          empresa_id: string
          fornecedor_cnpj: string
          fornecedor_nome: string
          id?: string
          itens?: Json
          numero_nf: string
          serie?: string | null
          status?: string
          updated_at?: string
          valor_total: number
          xml_original?: string | null
        }
        Update: {
          chave_acesso?: string
          created_at?: string
          data_emissao?: string
          empresa_id?: string
          fornecedor_cnpj?: string
          fornecedor_nome?: string
          id?: string
          itens?: Json
          numero_nf?: string
          serie?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
          xml_original?: string | null
        }
        Relationships: [{
          foreignKeyName: "notas_fiscais_entrada_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }]
      }
      ordens_servico: {
        Row: {
          bomba_prefixo: string | null
          carga_id: string | null
          cidade: string | null
          cliente_id: string | null
          created_at: string
          data_emissao: string
          data_vencimento: string | null
          desconto: number | null
          destinatario_bairro: string | null
          destinatario_cnpj_cpf: string | null
          destinatario_complemento: string | null
          destinatario_endereco: string | null
          destinatario_nome: string
          destinatario_numero: string | null
          destinatario_telefone: string | null
          empresa_id: string
          forma_pagamento: string | null
          horario_chegada_obra: string | null
          horario_fim_descarga: string | null
          horario_inicio_descarga: string | null
          horario_saida_usina: string | null
          id: string
          motorista_nome: string | null
          nome_obra: string | null
          numero_os: number
          observacoes: string | null
          status: string
          taxa_bombeamento: number | null
          updated_at: string
          valor_frete: number | null
          valor_itens: number
          valor_pago: number | null
          valor_total: number
          veiculo_placa: string | null
          volume_m3: number | null
        }
        Insert: {
          bomba_prefixo?: string | null
          carga_id?: string | null
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_vencimento?: string | null
          desconto?: number | null
          destinatario_bairro?: string | null
          destinatario_cnpj_cpf?: string | null
          destinatario_complemento?: string | null
          destinatario_endereco?: string | null
          destinatario_nome: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          horario_chegada_obra?: string | null
          horario_fim_descarga?: string | null
          horario_inicio_descarga?: string | null
          horario_saida_usina?: string | null
          id?: string
          motorista_nome?: string | null
          nome_obra?: string | null
          numero_os: number
          observacoes?: string | null
          status?: string
          taxa_bombeamento?: number | null
          updated_at?: string
          valor_frete?: number | null
          valor_itens?: number
          valor_pago?: number | null
          valor_total?: number
          veiculo_placa?: string | null
          volume_m3?: number | null
        }
        Update: {
          bomba_prefixo?: string | null
          carga_id?: string | null
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_vencimento?: string | null
          desconto?: number | null
          destinatario_bairro?: string | null
          destinatario_cnpj_cpf?: string | null
          destinatario_complemento?: string | null
          destinatario_endereco?: string | null
          destinatario_nome?: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          horario_chegada_obra?: string | null
          horario_fim_descarga?: string | null
          horario_inicio_descarga?: string | null
          horario_saida_usina?: string | null
          id?: string
          motorista_nome?: string | null
          nome_obra?: string | null
          numero_os?: number
          observacoes?: string | null
          status?: string
          taxa_bombeamento?: number | null
          updated_at?: string
          valor_frete?: number | null
          valor_itens?: number
          valor_pago?: number | null
          valor_total?: number
          veiculo_placa?: string | null
          volume_m3?: number | null
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
          dias_aviso_previo: number
          empresa_id: string
          id: string
          meses_validade: number
          obrigatorio: boolean
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_aviso_previo?: number
          empresa_id: string
          id?: string
          meses_validade: number
          obrigatorio?: boolean
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_aviso_previo?: number
          empresa_id?: string
          id?: string
          meses_validade?: number
          obrigatorio?: boolean
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
      precos_material: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          material_id: string
          preco_unitario: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          material_id: string
          preco_unitario: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          material_id?: string
          preco_unitario?: number
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "precos_material_empresa_id_fkey"
          columns: ["empresa_id"]
          isOneToOne: false
          referencedRelation: "empresas"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "precos_material_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }]
      }
      tracos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          empresa_id: string | null
          fc_mpa: number | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fc_mpa?: number | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fc_mpa?: number | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracos_itens: {
        Row: {
          created_at: string
          id: string
          material_id: string
          quantidade_m3: number
          traco_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          quantidade_m3: number
          traco_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          quantidade_m3?: number
          traco_id?: string
        }
        Relationships: [{
          foreignKeyName: "tracos_itens_material_id_fkey"
          columns: ["material_id"]
          isOneToOne: false
          referencedRelation: "materiais"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "tracos_itens_traco_id_fkey"
          columns: ["traco_id"]
          isOneToOne: false
          referencedRelation: "tracos"
          referencedColumns: ["id"]
        }]
      }
      usuarios_app: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          empresas_permitidas: string[]
          id: string
          nome: string
          perfil: string
          permissoes: string[]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          empresas_permitidas?: string[]
          id: string
          nome: string
          perfil?: string
          permissoes?: string[]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          empresas_permitidas?: string[]
          id?: string
          nome?: string
          perfil?: string
          permissoes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number | null
          ativo: boolean
          capacidade_m3: number | null
          created_at: string
          empresa_id: string
          id: string
          marca: string | null
          modelo: string | null
          placa: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ano?: number | null
          ativo?: boolean
          capacidade_m3?: number | null
          created_at?: string
          empresa_id: string
          id?: string
          marca?: string | null
          modelo?: string | null
          placa: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ano?: number | null
          ativo?: boolean
          capacidade_m3?: number | null
          created_at?: string
          empresa_id?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          placa?: string
          tipo?: string
          updated_at?: string
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
        Args: Record<string, unknown>
        Returns: Json
      }
      confirmar_email_auth_usuario: {
        Args: { p_user_id: string }
        Returns: Json
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
