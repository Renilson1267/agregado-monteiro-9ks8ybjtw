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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cargas: {
        Row: {
          carga_zerada: boolean
          cidade_id: string | null
          cidade_nome: string | null
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
            foreignKeyName: "cargas_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
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
          empresa_id: string | null
          id: string
          nome: string
          uf: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          uf?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          uf?: string
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
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf_cnpj: string
          created_at: string
          email: string | null
          empresa_id: string
          exibir_insumos_os: boolean
          id: string
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          telefone: string | null
          tipo: string
          uf: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj: string
          created_at?: string
          email?: string | null
          empresa_id: string
          exibir_insumos_os?: boolean
          id?: string
          logradouro?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          uf?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string
          created_at?: string
          email?: string | null
          empresa_id?: string
          exibir_insumos_os?: boolean
          id?: string
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          uf?: string | null
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
          ativo: boolean
          cidade: string | null
          cnpj: string | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          razao_social: string | null
          slug: string
          telefone: string | null
          uf: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          razao_social?: string | null
          slug: string
          telefone?: string | null
          uf?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          razao_social?: string | null
          slug?: string
          telefone?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      exames_funcionario: {
        Row: {
          created_at: string
          data_realizacao: string | null
          empresa_id: string | null
          funcionario_id: string
          id: string
          nome_exame: string
          observacao: string | null
          tipo_exame: string
          updated_at: string
          validade_meses: number
        }
        Insert: {
          created_at?: string
          data_realizacao?: string | null
          empresa_id?: string | null
          funcionario_id: string
          id?: string
          nome_exame: string
          observacao?: string | null
          tipo_exame: string
          updated_at?: string
          validade_meses?: number
        }
        Update: {
          created_at?: string
          data_realizacao?: string | null
          empresa_id?: string | null
          funcionario_id?: string
          id?: string
          nome_exame?: string
          observacao?: string | null
          tipo_exame?: string
          updated_at?: string
          validade_meses?: number
        }
        Relationships: [
          {
            foreignKeyName: "exames_funcionario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_funcionario_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_competencias: {
        Row: {
          ano: number
          competencia: string
          created_at: string
          empresa_id: string
          id: string
          mes: number
          observacoes: string | null
          status: string
          total_colaboradores: number
          total_descontos: number
          total_fgts: number
          total_inss_empresa: number
          total_liquido: number
          total_proventos: number
          updated_at: string
        }
        Insert: {
          ano: number
          competencia: string
          created_at?: string
          empresa_id: string
          id?: string
          mes: number
          observacoes?: string | null
          status?: string
          total_colaboradores?: number
          total_descontos?: number
          total_fgts?: number
          total_inss_empresa?: number
          total_liquido?: number
          total_proventos?: number
          updated_at?: string
        }
        Update: {
          ano?: number
          competencia?: string
          created_at?: string
          empresa_id?: string
          id?: string
          mes?: number
          observacoes?: string | null
          status?: string
          total_colaboradores?: number
          total_descontos?: number
          total_fgts?: number
          total_inss_empresa?: number
          total_liquido?: number
          total_proventos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folha_competencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_pagamento_linhas: {
        Row: {
          adiantamento: number
          adicional_insalubridade: number
          adicional_noturno: number
          adicional_periculosidade: number
          agencia: string | null
          ajuda_custo: number
          backup_id: string | null
          banco: string | null
          base_fgts: number
          base_inss: number
          base_irrf: number
          bruto: number
          cargo: string
          chave_pix: string | null
          comissao: number
          comissoes: number
          competencia: string
          competencia_id: string
          conta: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          departamento: string | null
          dsr: number
          empresa_id: string
          faltas_atrasos: number
          familia: number
          ferias: number
          fgts_mes: number
          filhos: number
          funcao: string
          funcionario_id: string | null
          gratificacao: number
          gratificacoes: number
          horas_extras: number
          horas_normais: number
          id: string
          inativo: boolean
          inss: number
          inss_retido: number
          ir: number
          irrf_retido: number
          itens_discriminados: Json | null
          limpeza: number
          matricula: string | null
          mensal_liquido: number
          modo_calculo: string
          nome: string
          obras: number
          observacoes: string | null
          oculto: boolean
          outros_descontos: number
          outros_proventos: number
          pix: string
          plano_saude: number
          producao: number
          quinzena: number
          quinzena_2: number
          sabado: number
          salario_base: number
          salario_liquido: number
          tipo: string
          total_descontos: number
          total_proventos: number
          unidade: string
          updated_at: string
          vale_refeicao: number
          vale_transporte: number
          valor_horas_extras: number
          valor_obra: number
          vendas_ajuda: number
          vendas_obra: number
        }
        Insert: {
          adiantamento?: number
          adicional_insalubridade?: number
          adicional_noturno?: number
          adicional_periculosidade?: number
          agencia?: string | null
          ajuda_custo?: number
          backup_id?: string | null
          banco?: string | null
          base_fgts?: number
          base_inss?: number
          base_irrf?: number
          bruto?: number
          cargo?: string
          chave_pix?: string | null
          comissao?: number
          comissoes?: number
          competencia: string
          competencia_id: string
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          departamento?: string | null
          dsr?: number
          empresa_id: string
          faltas_atrasos?: number
          familia?: number
          ferias?: number
          fgts_mes?: number
          filhos?: number
          funcao?: string
          funcionario_id?: string | null
          gratificacao?: number
          gratificacoes?: number
          horas_extras?: number
          horas_normais?: number
          id?: string
          inativo?: boolean
          inss?: number
          inss_retido?: number
          ir?: number
          irrf_retido?: number
          itens_discriminados?: Json | null
          limpeza?: number
          matricula?: string | null
          mensal_liquido?: number
          modo_calculo?: string
          nome: string
          obras?: number
          observacoes?: string | null
          oculto?: boolean
          outros_descontos?: number
          outros_proventos?: number
          pix?: string
          plano_saude?: number
          producao?: number
          quinzena?: number
          quinzena_2?: number
          sabado?: number
          salario_base?: number
          salario_liquido?: number
          tipo?: string
          total_descontos?: number
          total_proventos?: number
          unidade?: string
          updated_at?: string
          vale_refeicao?: number
          vale_transporte?: number
          valor_horas_extras?: number
          valor_obra?: number
          vendas_ajuda?: number
          vendas_obra?: number
        }
        Update: {
          adiantamento?: number
          adicional_insalubridade?: number
          adicional_noturno?: number
          adicional_periculosidade?: number
          agencia?: string | null
          ajuda_custo?: number
          backup_id?: string | null
          banco?: string | null
          base_fgts?: number
          base_inss?: number
          base_irrf?: number
          bruto?: number
          cargo?: string
          chave_pix?: string | null
          comissao?: number
          comissoes?: number
          competencia?: string
          competencia_id?: string
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          departamento?: string | null
          dsr?: number
          empresa_id?: string
          faltas_atrasos?: number
          familia?: number
          ferias?: number
          fgts_mes?: number
          filhos?: number
          funcao?: string
          funcionario_id?: string | null
          gratificacao?: number
          gratificacoes?: number
          horas_extras?: number
          horas_normais?: number
          id?: string
          inativo?: boolean
          inss?: number
          inss_retido?: number
          ir?: number
          irrf_retido?: number
          itens_discriminados?: Json | null
          limpeza?: number
          matricula?: string | null
          mensal_liquido?: number
          modo_calculo?: string
          nome?: string
          obras?: number
          observacoes?: string | null
          oculto?: boolean
          outros_descontos?: number
          outros_proventos?: number
          pix?: string
          plano_saude?: number
          producao?: number
          quinzena?: number
          quinzena_2?: number
          sabado?: number
          salario_base?: number
          salario_liquido?: number
          tipo?: string
          total_descontos?: number
          total_proventos?: number
          unidade?: string
          updated_at?: string
          vale_refeicao?: number
          vale_transporte?: number
          valor_horas_extras?: number
          valor_obra?: number
          vendas_ajuda?: number
          vendas_obra?: number
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_linhas_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "folha_competencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_pagamento_linhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_pagamento_linhas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_terceiros: {
        Row: {
          ativo: boolean
          bruto: number
          conta: string | null
          created_at: string
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
          bruto?: number
          conta?: string | null
          created_at?: string
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
          bruto?: number
          conta?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          obs?: string | null
          pix?: string | null
          unidade?: string
          updated_at?: string
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
          ativo: boolean
          bruto: number
          conta: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          email: string | null
          empresa_id: string | null
          filhos: number
          funcao: string
          id: string
          inativo: boolean
          nome: string
          observacoes: string | null
          oculto: boolean
          pix: string | null
          telefone: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bruto?: number
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          empresa_id?: string | null
          filhos?: number
          funcao?: string
          id?: string
          inativo?: boolean
          nome: string
          observacoes?: string | null
          oculto?: boolean
          pix?: string | null
          telefone?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bruto?: number
          conta?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          email?: string | null
          empresa_id?: string | null
          filhos?: number
          funcao?: string
          id?: string
          inativo?: boolean
          nome?: string
          observacoes?: string | null
          oculto?: boolean
          pix?: string | null
          telefone?: string | null
          unidade?: string
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
          codigo: string
          controla_estoque: boolean
          created_at: string
          densidade: number | null
          empresa_id: string | null
          estoque_minimo: number
          id: string
          nome: string
          ordem: number
          preco_compra: number | null
          unidade: string
          unidade_compra: string | null
        }
        Insert: {
          codigo: string
          controla_estoque?: boolean
          created_at?: string
          densidade?: number | null
          empresa_id?: string | null
          estoque_minimo?: number
          id?: string
          nome: string
          ordem?: number
          preco_compra?: number | null
          unidade?: string
          unidade_compra?: string | null
        }
        Update: {
          codigo?: string
          controla_estoque?: boolean
          created_at?: string
          densidade?: number | null
          empresa_id?: string | null
          estoque_minimo?: number
          id?: string
          nome?: string
          ordem?: number
          preco_compra?: number | null
          unidade?: string
          unidade_compra?: string | null
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
          created_at: string
          empresa_id: string
          id: string
          meta_diaria_m3: number
          meta_mensal_m3: number
          observacao: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          meta_diaria_m3?: number
          meta_mensal_m3?: number
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          meta_diaria_m3?: number
          meta_mensal_m3?: number
          observacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      motoristas: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
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
          quantidade: number
          tipo: string
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
          quantidade: number
          tipo: string
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
          quantidade?: number
          tipo?: string
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
          veiculo_placa?: string | null
          vendedor_nome?: string | null
          visto_motorista_central?: string | null
          visto_motorista_peca?: string | null
          visto_obra?: string | null
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
      prazos_exame_por_empresa: {
        Row: {
          created_at: string
          descricao_norma: string | null
          empresa_id: string
          id: string
          nome_exame: string
          norma_referencia: string | null
          tipo_exame: string
          updated_at: string
          validade_padrao_meses: number
        }
        Insert: {
          created_at?: string
          descricao_norma?: string | null
          empresa_id: string
          id?: string
          nome_exame: string
          norma_referencia?: string | null
          tipo_exame: string
          updated_at?: string
          validade_padrao_meses: number
        }
        Update: {
          created_at?: string
          descricao_norma?: string | null
          empresa_id?: string
          id?: string
          nome_exame?: string
          norma_referencia?: string | null
          tipo_exame?: string
          updated_at?: string
          validade_padrao_meses?: number
        }
        Relationships: [
          {
            foreignKeyName: "prazos_exame_por_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      precos_material: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          material_codigo: string
          mes_ano: string
          preco_unitario: number
          unidade: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          material_codigo: string
          mes_ano: string
          preco_unitario?: number
          unidade?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          material_codigo?: string
          mes_ano?: string
          preco_unitario?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "precos_material_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_email_usuario: {
        Args: { p_novo_email: string; p_usuario_app_id: string }
        Returns: Json
      }
      proximo_numero_os: { Args: { p_empresa_id: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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

