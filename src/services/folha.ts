import { supabase } from "@/lib/supabase/client"
import {
  FolhaCompetencia,
  FolhaPagamentoLinha,
  FolhaTotaisCalculados,
  FolhaTabelaOficial,
  calcularMensalLiquido,
} from "@/types/folha"

export interface SalvarLinhaFolhaPayload {
  id?: string
  empresa_id: string
  competencia: string
  tipo: "Funcionario" | "Terceiro"
  nome: string
  cargo?: string
  funcao: string
  unidade: string
  bruto: number
  salario_base?: number
  filhos: number
  inss: number
  familia: number
  ir: number
  quinzena: number
  quinzena_2?: number
  adiantamento: number
  gratificacao: number
  mensal_liquido: number
  salario_liquido?: number
  obras?: number
  valor_obra?: number
  producao: number
  limpeza?: number
  sabado?: number
  feriado?: number
  ferias?: number
  ajuda_custo?: number
  vendas_obra?: number
  comissao: number
  vendas_ajuda?: number
  conta: string
  pix: string
  chave_pix?: string
  modo_calculo?: "Calculado" | "Digitado"
  oculto?: boolean
  inativo?: boolean
  observacao_linha?: string | null
  funcionario_id?: string | null
  cpf?: string | null
  matricula?: string | null
}

export class FolhaService {
  /**
   * Lista todas as competências cadastradas para a empresa ativa
   */
  static async getCompetencias(empresaId: string): Promise<FolhaCompetencia[]> {
    const { data, error } = await (supabase as any)
      .from("folha_competencias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("competencia", { ascending: false })

    if (error) {
      console.error("Erro ao buscar competências da folha:", error)
      throw error
    }

    return (data || []) as FolhaCompetencia[]
  }

  /**
   * Obtém os dados de uma competência específica
   */
  static async getCompetencia(
    empresaId: string,
    competencia: string,
  ): Promise<FolhaCompetencia | null> {
    const { data, error } = await (supabase as any)
      .from("folha_competencias")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("competencia", competencia)
      .maybeSingle()

    if (error) {
      console.error("Erro ao buscar competência:", error)
      throw error
    }

    return data as FolhaCompetencia | null
  }

  /**
   * Busca ou cria a competência da empresa
   */
  static async obterOuCriarCompetencia(
    empresaId: string,
    competencia: string,
    observacoes?: string,
    dataCompetencia?: string | null,
    percentualQuinzena?: number,
  ): Promise<FolhaCompetencia> {
    const [anoStr, mesStr] = competencia.split("-")
    const ano = parseInt(anoStr, 10) || new Date().getFullYear()
    const mes = parseInt(mesStr, 10) || new Date().getMonth() + 1

    const existente = await this.getCompetencia(empresaId, competencia)
    if (existente) return existente

    const { data, error } = await (supabase as any)
      .from("folha_competencias")
      .insert({
        empresa_id: empresaId,
        competencia,
        ano,
        mes,
        observacoes,
        data_competencia: dataCompetencia || null,
        percentual_quinzena: percentualQuinzena ?? 0.4,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar competência:", error)
      throw error
    }

    return data as FolhaCompetencia
  }

  static async atualizarConfigCompetencia(
    empresaId: string,
    competencia: string,
    config: {
      data_competencia?: string | null
      percentual_quinzena?: number
    },
  ): Promise<FolhaCompetencia> {
    const comp = await this.obterOuCriarCompetencia(empresaId, competencia)
    const { data, error } = await (supabase as any)
      .from("folha_competencias")
      .update({
        ...config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comp.id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar config da competência:", error)
      throw error
    }
    return data as FolhaCompetencia
  }

  /**
   * Lista as linhas de folha de pagamento de uma competência na empresa
   */
  static async getLinhasCompetencia(
    empresaId: string,
    competencia: string,
  ): Promise<FolhaPagamentoLinha[]> {
    const { data, error } = await (supabase as any)
      .from("folha_pagamento_linhas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("competencia", competencia)
      .order("nome", { ascending: true })

    if (error) {
      console.error("Erro ao buscar linhas da folha:", error)
      throw error
    }

    // Normaliza tipos numéricos e strings caso o retorno venha como string/null
    return (data || []).map((l: any) => ({
      ...l,
      tipo: l.tipo === "Terceiro" ? "Terceiro" : "Funcionario",
      nome: l.nome || "",
      cargo: l.cargo || l.funcao || "Geral",
      funcao: l.funcao || l.cargo || "Geral",
      unidade: l.unidade || "SJE",
      bruto: Number(l.bruto || 0),
      salario_base: Number(l.salario_base || l.bruto || 0),
      filhos: parseInt(String(l.filhos || 0), 10) || 0,
      inss: Number(l.inss || 0),
      familia: Number(l.familia || 0),
      ir: Number(l.ir || 0),
      quinzena: Number(l.quinzena || 0),
      quinzena_2: Number(l.quinzena_2 || 0),
      adiantamento: Number(l.adiantamento || 0),
      gratificacao: Number(l.gratificacao || 0),
      obras: Number(l.obras || 0),
      valor_obra: Number(l.valor_obra ?? 20),
      producao: Number(l.producao || 0),
      limpeza: Number(l.limpeza || 0),
      sabado: Number(l.sabado || 0),
      feriado: Number(l.feriado || 0),
      ferias: Number(l.ferias || 0),
      ajuda_custo: Number(l.ajuda_custo || 0),
      vendas_obra: Number(l.vendas_obra || 0),
      comissao: Number(l.comissao || 0),
      vendas_ajuda: Number(l.vendas_ajuda || 0),
      total_proventos: Number(l.total_proventos || 0),
      total_descontos: Number(l.total_descontos || 0),
      salario_liquido: Number(l.salario_liquido || l.mensal_liquido || 0),
      mensal_liquido: Number(l.mensal_liquido || l.salario_liquido || 0),
      conta: l.conta || "",
      pix: l.pix || l.chave_pix || "",
      chave_pix: l.chave_pix || l.pix || "",
      modo_calculo: l.modo_calculo || "Calculado",
      oculto: Boolean(l.oculto),
      inativo: Boolean(l.inativo),
      observacao_linha: l.observacao_linha || l.observacoes || "",
    })) as FolhaPagamentoLinha[]
  }

  /**
   * Salva (cria ou edita) uma única linha de folha
   */
  static async salvarLinha(
    payload: SalvarLinhaFolhaPayload,
  ): Promise<FolhaPagamentoLinha> {
    const comp = await this.obterOuCriarCompetencia(
      payload.empresa_id,
      payload.competencia,
    )

    const dados = {
      empresa_id: payload.empresa_id,
      competencia_id: comp.id,
      competencia: payload.competencia,
      tipo: payload.tipo === "Terceiro" ? "Terceiro" : "Funcionario",
      nome: payload.nome.trim().toUpperCase(),
      cargo: (payload.cargo || payload.funcao).trim().toUpperCase(),
      funcao: payload.funcao.trim().toUpperCase(),
      unidade: payload.unidade.trim().toUpperCase() || "SJE",
      bruto: Number(payload.bruto || 0),
      salario_base: Number(payload.salario_base ?? payload.bruto ?? 0),
      filhos: parseInt(String(payload.filhos || 0), 10) || 0,
      inss: Number(payload.inss || 0),
      familia: Number(payload.familia || 0),
      ir: Number(payload.ir || 0),
      quinzena: Number(payload.quinzena || 0),
      quinzena_2: Number(payload.quinzena_2 || 0),
      adiantamento: Number(payload.adiantamento || 0),
      gratificacao: Number(payload.gratificacao || 0),
      obras: Number(payload.obras || 0),
      valor_obra: Number(payload.valor_obra ?? 20),
      producao: Number(payload.producao || 0),
      limpeza: Number(payload.limpeza || 0),
      sabado: Number(payload.sabado || 0),
      feriado: Number(payload.feriado || 0),
      ferias: Number(payload.ferias || 0),
      ajuda_custo: Number(payload.ajuda_custo || 0),
      vendas_obra: Number(payload.vendas_obra || 0),
      comissao: Number(payload.comissao || 0),
      vendas_ajuda: Number(payload.vendas_ajuda || 0),
      mensal_liquido: Number(payload.mensal_liquido || 0),
      salario_liquido: Number(
        payload.salario_liquido ?? payload.mensal_liquido ?? 0,
      ),
      conta: payload.conta || "",
      pix: payload.pix || payload.chave_pix || "",
      chave_pix: payload.chave_pix || payload.pix || "",
      modo_calculo: payload.modo_calculo || "Calculado",
      oculto: Boolean(payload.oculto),
      inativo: Boolean(payload.inativo),
      observacao_linha: payload.observacao_linha || null,
      funcionario_id: payload.funcionario_id || null,
      cpf: payload.cpf || null,
      matricula: payload.matricula || null,
      updated_at: new Date().toISOString(),
    }

    let resultado: FolhaPagamentoLinha

    if (payload.id) {
      const { data, error } = await (supabase as any)
        .from("folha_pagamento_linhas")
        .update(dados)
        .eq("id", payload.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar linha da folha:", error)
        throw error
      }
      resultado = (data as FolhaPagamentoLinha)
    } else {
      const { data, error } = await (supabase as any)
        .from("folha_pagamento_linhas")
        .insert(dados)
        .select()
        .single()

      if (error) {
        console.error("Erro ao inserir linha da folha:", error)
        throw error
      }
      resultado = (data as FolhaPagamentoLinha)
    }

    // Atualiza totais na competência
    await this.atualizarTotaisCompetencia(
      payload.empresa_id,
      payload.competencia,
    )

    return resultado
  }

  /**
   * Exclui uma linha da folha
   */
  static async excluirLinha(
    id: string,
    empresaId: string,
    competencia: string,
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from("folha_pagamento_linhas")
      .delete()
      .eq("id", id)
      .eq("empresa_id", empresaId)

    if (error) {
      console.error("Erro ao excluir linha da folha:", error)
      throw error
    }

    await this.atualizarTotaisCompetencia(empresaId, competencia)
  }

  /**
   * Importa e salva uma folha completa (cria/atualiza competência e suas linhas)
   * Deduplica estritamente por (empresa_id, competencia, nome_normalizado)
   */
  static async salvarImportacaoFolha(
    empresaId: string,
    competencia: string,
    linhas: Array<Omit<FolhaPagamentoLinha, "id" | "empresa_id">>,
  ): Promise<{
    competencia: FolhaCompetencia
    totalInseridos: number
    totalAtualizados: number
  }> {
    if (!linhas || linhas.length === 0) {
      throw new Error("Nenhuma linha de folha fornecida para salvar.")
    }

    // 1. Obter ou criar competência
    const comp = await this.obterOuCriarCompetencia(empresaId, competencia)

    // 2. Buscar linhas atuais já gravadas nessa competência para deduplicação
    const linhasAtuais = await this.getLinhasCompetencia(empresaId, competencia)
    const mapLinhasAtuaisPorNome = new Map<string, FolhaPagamentoLinha>()
    linhasAtuais.forEach((l) => {
      mapLinhasAtuaisPorNome.set(l.nome.trim().toUpperCase(), l)
    })

    let totalInseridos = 0
    let totalAtualizados = 0

    // 3. Salvar cada linha (update se já existe por nome, ou insert se for nova)
    for (const l of linhas) {
      const nomeUpper = l.nome.trim().toUpperCase()
      const existente = mapLinhasAtuaisPorNome.get(nomeUpper)

      const payload = {
        empresa_id: empresaId,
        competencia_id: comp.id,
        competencia,
        tipo: l.tipo === "Terceiro" ? "Terceiro" : "Funcionario",
        nome: nomeUpper,
        funcao: (l.funcao || "Geral").trim().toUpperCase(),
        unidade: (l.unidade || "SJE").trim().toUpperCase(),
        bruto: Number(l.bruto || 0),
        filhos: parseInt(String(l.filhos || 0), 10) || 0,
        inss: Number(l.inss || 0),
        familia: Number(l.familia || 0),
        ir: Number(l.ir || 0),
        quinzena: Number(l.quinzena || 0),
        adiantamento: Number(l.adiantamento || 0),
        gratificacao: Number(l.gratificacao || 0),
        mensal_liquido: Number(l.mensal_liquido || 0),
        producao: Number(l.producao || 0),
        comissao: Number(l.comissao || 0),
        conta: l.conta || "",
        pix: l.pix || "",
        modo_calculo: l.modo_calculo || "Calculado",
        funcionario_id: l.funcionario_id || null,
        cpf: l.cpf || null,
        matricula: l.matricula || null,
        updated_at: new Date().toISOString(),
      }

      if (existente) {
        const { error } = await (supabase as any)
          .from("folha_pagamento_linhas")
          .update(payload)
          .eq("id", existente.id)
        if (error) throw error
        totalAtualizados++
      } else {
        const { error } = await (supabase as any)
          .from("folha_pagamento_linhas")
          .insert(payload)
        if (error) throw error
        totalInseridos++
      }
    }

    // 4. Recalcula totais na competência
    const compAtualizada = await this.atualizarTotaisCompetencia(
      empresaId,
      competencia,
    )

    return {
      competencia: compAtualizada,
      totalInseridos,
      totalAtualizados,
    }
  }

  /**
   * Recalcula e consolida os totais da competência a partir das linhas gravadas
   */
  static async atualizarTotaisCompetencia(
    empresaId: string,
    competencia: string,
  ): Promise<FolhaCompetencia> {
    const comp = await this.obterOuCriarCompetencia(empresaId, competencia)
    const linhas = await this.getLinhasCompetencia(empresaId, competencia)
    const totais = this.calcularTotais(linhas)

    const { data, error } = await (supabase as any)
      .from("folha_competencias")
      .update({
        total_colaboradores: linhas.length,
        total_proventos:
          totais.totalBruto +
          totais.totalGratificacao +
          totais.totalProducao +
          totais.totalComissao +
          totais.totalFamilia,
        total_descontos:
          totais.totalInss +
          totais.totalIr +
          totais.totalQuinzena +
          totais.totalAdiantamento,
        total_liquido: totais.totalMensalLiquido,
        updated_at: new Date().toISOString(),
      })
      .eq("id", comp.id)
      .select()
      .single()

    if (error) throw error
    return data as FolhaCompetencia
  }

  /**
   * Exclui uma competência inteira e todas as suas linhas
   */
  static async excluirCompetencia(
    empresaId: string,
    competenciaId: string,
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from("folha_competencias")
      .delete()
      .eq("id", competenciaId)
      .eq("empresa_id", empresaId)

    if (error) {
      console.error("Erro ao excluir competência:", error)
      throw error
    }
  }

  /**
   * Obtém a tabela oficial de encargos e tributos da empresa para o ano (ou global)
   */
  static async getTabelaOficial(
    empresaId: string,
    ano: number = 2026,
  ): Promise<FolhaTabelaOficial | null> {
    const { data, error } = await (supabase as any)
      .from("folha_tabelas_oficiais")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ano", ano)
      .maybeSingle()

    if (error) {
      console.error("Erro ao buscar tabela oficial da folha:", error)
      throw error
    }
    return data as FolhaTabelaOficial | null
  }

  /**
   * Salva ou atualiza a tabela oficial da empresa
   */
  static async salvarTabelaOficial(
    tabela: Partial<FolhaTabelaOficial> & {
      empresa_id: string
      ano: number
    },
  ): Promise<FolhaTabelaOficial> {
    const { data, error } = await (supabase as any)
      .from("folha_tabelas_oficiais")
      .upsert(
        {
          ...tabela,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "empresa_id,ano" },
      )
      .select()
      .single()

    if (error) {
      console.error("Erro ao salvar tabela oficial:", error)
      throw error
    }
    return data as FolhaTabelaOficial
  }

  /**
   * Calcula somatório consolidado de todas as colunas reais da Folha GC MIX
   */
  static calcularTotais(linhas: FolhaPagamentoLinha[]): FolhaTotaisCalculados {
    return linhas.reduce(
      (acc, l) => {
        const isTerceiro =
          l.tipo === "Terceiro" ||
          (l.nome &&
            (l.nome.includes("RAIMUNDO MARIANO") ||
              l.nome.includes("MARCIO LUAN")))
        acc.totalRegistros += 1
        if (isTerceiro) {
          acc.totalTerceiros += 1
        } else {
          acc.totalFuncionarios += 1
        }
        acc.totalBruto += Number(l.bruto || 0)
        acc.totalFilhos += isTerceiro ? 0 : Number(l.filhos || 0)
        acc.totalInss += isTerceiro ? 0 : Number(l.inss || 0)
        acc.totalFamilia += isTerceiro ? 0 : Number(l.familia || 0)
        acc.totalIr += isTerceiro ? 0 : Number(l.ir || 0)
        acc.totalQuinzena += Number(l.quinzena || 0)
        acc.totalQuinzena2 += Number(l.quinzena_2 || 0)
        acc.totalAdiantamento += isTerceiro ? 0 : Number(l.adiantamento || 0)
        acc.totalGratificacao += Number(l.gratificacao || 0)
        acc.totalObras += isTerceiro ? 0 : Number(l.obras || 0)
        acc.totalProducao += isTerceiro ? 0 : Number(l.producao || 0)
        acc.totalLimpeza += Number(l.limpeza || 0)
        acc.totalSabado += Number(l.sabado || 0)
        acc.totalFeriado = (acc.totalFeriado || 0) + Number(l.feriado || 0)
        acc.totalFerias += Number(l.ferias || 0)
        acc.totalAjudaCusto += Number(l.ajuda_custo || 0)
        // Vendas e comissão são exclusivas de funcionários
        acc.totalVendas += isTerceiro ? 0 : Number(l.vendas_obra || 0)
        acc.totalComissao += isTerceiro ? 0 : Number(l.comissao || 0)
        acc.totalVendasAjuda += isTerceiro ? 0 : Number(l.vendas_ajuda || 0)
        acc.totalMensalLiquido += Number(l.mensal_liquido || 0)
        acc.totalGeralLiquidoAReceber +=
          Number(l.mensal_liquido || 0) +
          (isTerceiro ? 0 : Number(l.producao || 0))
        return acc
      },
      {
        totalRegistros: 0,
        totalFuncionarios: 0,
        totalTerceiros: 0,
        totalBruto: 0,
        totalFilhos: 0,
        totalInss: 0,
        totalFamilia: 0,
        totalIr: 0,
        totalQuinzena: 0,
        totalQuinzena2: 0,
        totalAdiantamento: 0,
        totalGratificacao: 0,
        totalObras: 0,
        totalProducao: 0,
        totalLimpeza: 0,
        totalSabado: 0,
        totalFeriado: 0,
        totalFerias: 0,
        totalAjudaCusto: 0,
        totalVendas: 0,
        totalComissao: 0,
        totalVendasAjuda: 0,
        totalMensalLiquido: 0,
        totalGeralLiquidoAReceber: 0,
      },
    )
  }

  /**
   * Garante a inicialização da folha (dados já semeados via migrations SQL)
   */
  static async garantirSeedFolha(): Promise<void> {
    // Dados já presentes e mantidos no banco via migrations/importação
    return
  }

  /**
   * Exporta todo o conjunto de dados da folha para a empresa ativa (todas as competências,
   * linhas completas com todos os campos, além de funcionários e terceiros cadastrados).
   */
  static async exportarBackupCompleto(
    empresaId: string,
    empresaNome: string,
    appVersion: string = "0.0.83",
  ): Promise<any> {
    // 1. Competências da empresa
    const { data: competenciasData, error: errComp } = await (supabase as any)
      .from("folha_competencias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("competencia", { ascending: false })
    if (errComp) throw errComp

    // 2. Linhas de todas as competências
    const { data: linhasData, error: errLinhas } = await (supabase as any)
      .from("folha_pagamento_linhas")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("competencia", { ascending: false })
      .order("nome", { ascending: true })
    if (errLinhas) throw errLinhas

    // 3. Cadastro de funcionários
    const { data: funcsData, error: errFuncs } = await (supabase as any)
      .from("funcionarios")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true })
    if (errFuncs) throw errFuncs

    // 4. Terceiros cadastrados
    const { data: tercData, error: errTerc } = await (supabase as any)
      .from("folha_terceiros")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true })
    if (errTerc) throw errTerc

    // Agrupa linhas por competência
    const linhasPorComp: Record<string, any[]> = {}
    for (const l of linhasData || []) {
      const comp = l.competencia || "sem_competencia"
      if (!linhasPorComp[comp]) linhasPorComp[comp] = []
      linhasPorComp[comp].push(l)
    }

    const competenciasComLinhas = (competenciasData || []).map((c: any) => ({
      ...c,
      linhas: linhasPorComp[c.competencia] || [],
    }))

    // Compatibilidade com o formato do sistema legado GC MIX:
    // backupData.cadastros.funcionarios, backupData.folha.func, backupData.folha.terceiros, backupData.folha.lanc
    const legacyFuncsMap: Record<string, any> = {}
    for (const f of funcsData || []) {
      legacyFuncsMap[f.id] = {
        id: f.id,
        nome: f.nome,
        funcao: f.funcao,
        unidade: f.unidade || "SJE",
        bruto: Number(f.bruto || 0),
        filhos: Number(f.filhos || 0),
        conta: f.conta || "",
        pix: f.pix || "",
        inativo: Boolean(f.inativo),
        oculto: Boolean(f.oculto),
        obs: f.observacoes || "",
      }
    }

    const legacyLancMap: Record<string, {
      func: Record<string, any>
      terc: Record<string, any>
    }> = {}
    for (const c of competenciasData || []) {
      const linhas = linhasPorComp[c.competencia] || []
      const funcObj: Record<string, any> = {}
      const tercObj: Record<string, any> = {}

      linhas.forEach((l: any, idx: number) => {
        const key = l.funcionario_id || l.backup_id || `linha_${idx}`
        const dadosLinha = {
          nome: l.nome,
          tipo: l.tipo,
          cargo: l.cargo,
          funcao: l.funcao,
          unidade: l.unidade,
          bruto: Number(l.bruto || 0),
          filhos: Number(l.filhos || 0),
          obras: Number(l.obras || 0),
          valorObra: Number(l.valor_obra || 20),
          producao: Number(l.producao || 0),
          limp: Number(l.limpeza || 0),
          sab: Number(l.sabado || 0),
          fer: Number(l.ferias || 0),
          feriado: Number(l.feriado || 0),
          ajuda: Number(l.ajuda_custo || 0),
          vendObra: Number(l.vendas_obra || 0),
          vendCom: Number(l.comissao || 0),
          vendAjuda: Number(l.vendas_ajuda || 0),
          adiant: Number(l.adiantamento || 0),
          gratif: Number(l.gratificacao || 0),
          inss: Number(l.inss || 0),
          familia: Number(l.familia || 0),
          ir: Number(l.ir || 0),
          quinzena: Number(l.quinzena || 0),
          quinzena_2: Number(l.quinzena_2 || 0),
          mensal_liquido: Number(l.mensal_liquido || 0),
          salario_liquido: Number(l.salario_liquido || 0),
          total_proventos: Number(l.total_proventos || 0),
          total_descontos: Number(l.total_descontos || 0),
          conta: l.conta || "",
          pix: l.pix || l.chave_pix || "",
          chave_pix: l.chave_pix || l.pix || "",
          modo_calculo: l.modo_calculo || "Calculado",
          oculto: Boolean(l.oculto),
          inativo: Boolean(l.inativo),
          observacao_linha: l.observacao_linha || "",
          cpf: l.cpf || null,
        }

        if (l.tipo === "Terceiro") {
          tercObj[key] = dadosLinha
        } else {
          funcObj[key] = dadosLinha
        }
      })

      legacyLancMap[c.competencia] = {
        func: funcObj,
        terc: tercObj,
      }
    }

    return {
      metadata: {
        tipo: "backup_folha_pagamento",
        versao: "2.0",
        app_version: appVersion,
        gerado_em: new Date().toISOString(),
        empresa_id: empresaId,
        empresa_nome: empresaNome,
        contagem: {
          competencias: (competenciasData || []).length,
          linhas: (linhasData || []).length,
          funcionarios: (funcsData || []).length,
          terceiros: (tercData || []).length,
        },
      },
      // Estrutura estruturada moderna
      folha: {
        empresa_id: empresaId,
        competencias: competenciasComLinhas,
        // Mantém mapa legado para retrocompatibilidade
        func: legacyFuncsMap,
        terceiros: tercData || [],
        lanc: legacyLancMap,
      },
      // Cadastros completos da empresa
      cadastros: {
        funcionarios: funcsData || [],
        terceiros: tercData || [],
      },
    }
  }

  /**
   * Analisa um arquivo JSON de backup (suporta formato atual ou legado) e gera o resumo prévio.
   */
  static analisarBackupJson(
    conteudoJson: any,
    empresaAtivaId: string,
    empresaAtivaNome: string,
    funcionariosCadastrados: Array<{
      id: string
      nome: string
      cpf?: string | null
    }>,
  ): {
    valido: boolean
    mensagemErro?: string
    empresaArquivo?: string
    geradoEm?: string
    totalCompetencias: number
    totalLinhas: number
    totalFuncionariosCadastro: number
    totalTerceirosCadastro: number
    competenciasLista: string[]
    linhasPorCompetencia: Record<string, number>
    avisos: string[]
    linhasNormalizadas: Array<{
      competencia: string
      tipo: "Funcionario" | "Terceiro"
      nome: string
      funcao: string
      cargo: string
      unidade: string
      bruto: number
      salario_base?: number
      filhos: number
      inss: number
      familia: number
      ir: number
      quinzena: number
      quinzena_2?: number
      adiantamento: number
      gratificacao: number
      mensal_liquido: number
      salario_liquido?: number
      obras?: number
      valor_obra?: number
      producao?: number
      limpeza?: number
      sabado?: number
      feriado?: number
      ferias?: number
      ajuda_custo?: number
      vendas_obra?: number
      comissao?: number
      vendas_ajuda?: number
      conta: string
      pix: string
      chave_pix?: string
      modo_calculo?: "Calculado" | "Digitado"
      oculto?: boolean
      inativo?: boolean
      observacao_linha?: string | null
      cpf?: string | null
      funcionario_id?: string | null
      backup_id?: string | null
    }>
    funcionariosParaRestaurar: any[]
    terceirosParaRestaurar: any[]
  } {
    const avisos: string[] = []

    if (!conteudoJson || typeof conteudoJson !== "object") {
      return {
        valido: false,
        mensagemErro: "Arquivo não é um JSON válido.",
        totalCompetencias: 0,
        totalLinhas: 0,
        totalFuncionariosCadastro: 0,
        totalTerceirosCadastro: 0,
        competenciasLista: [],
        linhasPorCompetencia: {},
        avisos: ["JSON inválido"],
        linhasNormalizadas: [],
        funcionariosParaRestaurar: [],
        terceirosParaRestaurar: [],
      }
    }

    const empresaArquivo =
      conteudoJson.metadata?.empresa_nome ||
      conteudoJson.metadata?.empresa_id ||
      conteudoJson.empresa ||
      "Não identificada"
    const geradoEm =
      conteudoJson.metadata?.gerado_em || conteudoJson.data_geracao || undefined

    const nomesCadastradosSet = new Set(
      funcionariosCadastrados.map((f) => f.nome.trim().toUpperCase()),
    )

    const linhasNormalizadas: any[] = []
    const competenciasSet = new Set<string>()
    const linhasPorComp: Record<string, number> = {}

    // 1. Verifica se está no formato moderno com array de competências
    if (
      conteudoJson.folha?.competencias &&
      Array.isArray(conteudoJson.folha.competencias)
    ) {
      for (const compItem of conteudoJson.folha.competencias) {
        const comp = compItem.competencia
        if (!comp) continue
        competenciasSet.add(comp)
        const linhas = compItem.linhas || []
        linhasPorComp[comp] = (linhasPorComp[comp] || 0) + linhas.length

        for (const l of linhas) {
          const nomeNorm = (l.nome || "").trim().toUpperCase()
          if (!nomeNorm) continue

          linhasNormalizadas.push({
            competencia: comp,
            tipo: l.tipo === "Terceiro" ? "Terceiro" : "Funcionario",
            nome: nomeNorm,
            cargo: (l.cargo || l.funcao || "Geral").trim().toUpperCase(),
            funcao: (l.funcao || l.cargo || "Geral").trim().toUpperCase(),
            unidade: (l.unidade || "SJE").trim().toUpperCase(),
            bruto: Number(l.bruto || 0),
            salario_base: Number(l.salario_base ?? l.bruto ?? 0),
            filhos: parseInt(String(l.filhos || 0), 10) || 0,
            inss: Number(l.inss || 0),
            familia: Number(l.familia || 0),
            ir: Number(l.ir || 0),
            quinzena: Number(l.quinzena || 0),
            quinzena_2: Number(l.quinzena_2 || 0),
            adiantamento: Number(l.adiantamento || 0),
            gratificacao: Number(l.gratificacao || 0),
            mensal_liquido: Number(l.mensal_liquido || 0),
            salario_liquido: Number(l.salario_liquido ?? l.mensal_liquido ?? 0),
            obras: Number(l.obras || 0),
            valor_obra: Number(l.valor_obra ?? 20),
            producao: Number(l.producao || 0),
            limpeza: Number(l.limpeza || 0),
            sabado: Number(l.sabado || 0),
            feriado: Number(l.feriado || 0),
            ferias: Number(l.ferias || 0),
            ajuda_custo: Number(l.ajuda_custo || 0),
            vendas_obra: Number(l.vendas_obra || 0),
            comissao: Number(l.comissao || 0),
            vendas_ajuda: Number(l.vendas_ajuda || 0),
            conta: l.conta || "",
            pix: l.pix || l.chave_pix || "",
            chave_pix: l.chave_pix || l.pix || "",
            modo_calculo: l.modo_calculo || "Calculado",
            oculto: Boolean(l.oculto),
            inativo: Boolean(l.inativo),
            observacao_linha: l.observacao_linha || null,
            cpf: l.cpf || null,
            funcionario_id: l.funcionario_id || null,
            backup_id: l.backup_id || null,
          })
        }
      }
    } else if (conteudoJson.folha?.lanc) {
      // 2. Formato legado GC MIX (backup-folha-*.json)
      const cadFuncs = conteudoJson.cadastros?.funcionarios || []
      const folhaFuncs = conteudoJson.folha?.func || {}
      const funcMap: Record<string, any> = {}

      for (const f of cadFuncs) {
        const fFolha = folhaFuncs[f.id] || {}
        funcMap[f.id] = {
          ...f,
          ...fFolha,
          cpfLimpo: f.doc ? String(f.doc).replace(/[^\d]/g, "") : null,
        }
      }

      const lanc = conteudoJson.folha.lanc
      for (const [comp, compData] of Object.entries<any>(lanc)) {
        competenciasSet.add(comp)
        const funcsLanc = compData?.func || {}
        const tercLanc = compData?.terc || {}

        // Funcionários
        for (const [funcId, fL] of Object.entries<any>(funcsLanc)) {
          if (funcId === "__novo" || funcId === "undefined") continue
          const fCad = funcMap[funcId] || {}
          const nomeNorm = (fCad.nome || fL.nome || `Colaborador ${funcId}`)
            .trim()
            .toUpperCase()

          const obras = Number(fL.obras || 0)
          const valorObra = Number(fL.valorObra ?? 20)
          const producao = obras * valorObra
          const limp = Number(fL.limp || fL.limpeza || 0)
          const sab = Number(fL.sab || fL.sabado || 0)
          const fer = Number(fL.fer || fL.ferias || 0)
          const feriado = Number(fL.feriado || 0)
          const ajuda = Number(fL.ajuda || fL.ajuda_custo || 0)
          const vendObra = Number(fL.vendObra || fL.vendas_obra || 0)
          let comissao = Number(fL.vendCom || fL.comissao || 0)
          if (comissao === 0 && vendObra > 0) {
            comissao = Math.round(vendObra * 0.005 * 100) / 100
          }
          const vendAjuda = Number(fL.vendAjuda || fL.vendas_ajuda || 0)
          const adiant = Number(fL.adiant || fL.adiantamento || 0)
          const gratif = Number(fL.gratif || fL.gratificacao || 0)
          const bruto = Number(fL.bruto || fCad.bruto || 0)
          const filhos = Number(fL.filhos || fCad.filhos || 0)
          const totalAjuda = ajuda + vendAjuda

          const inss = Number(fL.inss || 0)
          const ir = Number(fL.ir || 0)
          const familia = Number(fL.familia || 0)
          const quinzena = Number(fL.quinzena || 0)

          const totalProventos =
            bruto +
            producao +
            limp +
            sab +
            fer +
            totalAjuda +
            comissao +
            gratif +
            familia
          const totalDescontos = adiant + inss + ir + quinzena
          const liquido = Number(
            fL.mensal_liquido ||
              fL.salario_liquido ||
              totalProventos - totalDescontos,
          )

          linhasNormalizadas.push({
            competencia: comp,
            tipo: "Funcionario",
            nome: nomeNorm,
            cargo: (fCad.funcao || fL.funcao || "Geral").trim().toUpperCase(),
            funcao: (fCad.funcao || fL.funcao || "Geral").trim().toUpperCase(),
            unidade: (fCad.unidade || fL.unidade || "SJE").trim().toUpperCase(),
            bruto,
            salario_base: bruto,
            filhos,
            conta: fCad.conta || fL.conta || "",
            chave_pix: fCad.pix || fL.pix || "",
            pix: fCad.pix || fL.pix || "",
            obras,
            valor_obra: valorObra,
            producao,
            limpeza: limp,
            sabado: sab,
            feriado,
            ferias: fer,
            ajuda_custo: totalAjuda,
            vendas_obra: vendObra,
            comissao,
            vendas_ajuda: vendAjuda,
            adiantamento: adiant,
            gratificacao: gratif,
            inss,
            ir,
            familia,
            quinzena,
            quinzena_2: 0,
            mensal_liquido: liquido,
            salario_liquido: liquido,
            modo_calculo: fL.modo_calculo || "Calculado",
            oculto: Boolean(fCad.oculto || fL.oculto),
            inativo: Boolean(fCad.inativo || fL.inativo),
            observacao_linha: fL.observacao_linha || fCad.obs || null,
            cpf: fCad.cpfLimpo || null,
            funcionario_id: null,
            backup_id: funcId,
          })

          linhasPorComp[comp] = (linhasPorComp[comp] || 0) + 1
        }

        // Terceiros legado
        for (const [tercKey, tL] of Object.entries<any>(tercLanc)) {
          const nomeNorm = (tL.nome || `TERCEIRO ${tercKey}`)
            .trim()
            .toUpperCase()
          const bruto = Number(tL.bruto || 0)
          const vendObra = Number(tL.vendObra || tL.vendas_obra || 0)
          let comissao = Number(tL.vendCom || tL.comissao || 0)
          if (comissao === 0 && vendObra > 0) {
            comissao = Math.round(vendObra * 0.005 * 100) / 100
          }
          const vendAjuda = Number(tL.vendAjuda || tL.vendas_ajuda || 0)
          const adiant = Number(tL.adiant || tL.adiantamento || 0)
          const gratif = Number(tL.gratif || tL.gratificacao || 0)
          const ajuda = Number(tL.ajuda || tL.ajuda_custo || vendAjuda)

          const totalProventos = bruto + comissao + ajuda + gratif
          const totalDescontos = adiant
          const liquido = Number(
            tL.mensal_liquido ||
              tL.salario_liquido ||
              totalProventos - totalDescontos,
          )

          linhasNormalizadas.push({
            competencia: comp,
            tipo: "Terceiro",
            nome: nomeNorm,
            cargo: "Terceiro",
            funcao: "Terceiro",
            unidade: (tL.unidade || "SJE").trim().toUpperCase(),
            bruto,
            salario_base: bruto,
            filhos: 0,
            conta: tL.conta || "",
            chave_pix: tL.pix || "",
            pix: tL.pix || "",
            obras: 0,
            valor_obra: 20,
            producao: 0,
            limpeza: 0,
            sabado: 0,
            feriado: 0,
            ferias: 0,
            ajuda_custo: ajuda,
            vendas_obra: vendObra,
            comissao,
            vendas_ajuda: vendAjuda,
            adiantamento: adiant,
            gratificacao: gratif,
            inss: 0,
            ir: 0,
            familia: 0,
            quinzena: Number(tL.quinzena || 0),
            quinzena_2: 0,
            mensal_liquido: liquido,
            salario_liquido: liquido,
            modo_calculo: tL.modo_calculo || "Calculado",
            oculto: false,
            inativo: false,
            observacao_linha: tL.obs || null,
            cpf: null,
            funcionario_id: null,
            backup_id: `terc_${tercKey}`,
          })

          linhasPorComp[comp] = (linhasPorComp[comp] || 0) + 1
        }
      }
    }

    if (linhasNormalizadas.length === 0) {
      return {
        valido: false,
        mensagemErro:
          "O arquivo não contém competências ou linhas de folha reconhecíveis.",
        empresaArquivo,
        geradoEm,
        totalCompetencias: 0,
        totalLinhas: 0,
        totalFuncionariosCadastro: 0,
        totalTerceirosCadastro: 0,
        competenciasLista: [],
        linhasPorCompetencia: {},
        avisos: ["Nenhuma linha localizada"],
        linhasNormalizadas: [],
        funcionariosParaRestaurar: [],
        terceirosParaRestaurar: [],
      }
    }

    // Avisos de verificação
    if (
      conteudoJson.metadata?.empresa_id &&
      conteudoJson.metadata.empresa_id !== empresaAtivaId
    ) {
      avisos.push(
        `Atenção: O backup foi gerado para a empresa "${empresaArquivo}", mas será restaurado na empresa ativa atual "${empresaAtivaNome}".`,
      )
    }

    // Verifica quantos colaboradores já estão cadastrados
    const nomesNaoCadastrados = new Set<string>()
    for (const l of linhasNormalizadas) {
      if (l.tipo === "Funcionario" && !nomesCadastradosSet.has(l.nome)) {
        nomesNaoCadastrados.add(l.nome)
      }
    }

    if (nomesNaoCadastrados.size > 0) {
      avisos.push(
        `${nomesNaoCadastrados.size} funcionário(s) das linhas não constam no cadastro prévio de colaboradores da empresa ativa e serão vinculados automaticamente.`,
      )
    }

    const funcsCadastros = conteudoJson.cadastros?.funcionarios || []
    const tercCadastros =
      conteudoJson.cadastros?.terceiros || conteudoJson.folha?.terceiros || []

    return {
      valido: true,
      empresaArquivo,
      geradoEm,
      totalCompetencias: competenciasSet.size,
      totalLinhas: linhasNormalizadas.length,
      totalFuncionariosCadastro: Array.isArray(funcsCadastros)
        ? funcsCadastros.length
        : 0,
      totalTerceirosCadastro: Array.isArray(tercCadastros)
        ? tercCadastros.length
        : 0,
      competenciasLista: Array.from(competenciasSet).sort().reverse(),
      linhasPorCompetencia: linhasPorComp,
      avisos,
      linhasNormalizadas,
      funcionariosParaRestaurar: Array.isArray(funcsCadastros)
        ? funcsCadastros
        : [],
      terceirosParaRestaurar: Array.isArray(tercCadastros) ? tercCadastros : [],
    }
  }

  /**
   * Executa a restauração do backup na empresa ativa:
   * modo = 'mesclar': upsert das competências e das linhas por empresa_id+competencia+nome
   * modo = 'substituir': apaga todas as linhas das competências que vieram no backup (somente da empresa ativa) e reinsere
   */
  static async restaurarBackupFolha(
    empresaId: string,
    modo: "mesclar" | "substituir",
    dadosAnalisados: ReturnType<typeof FolhaService.analisarBackupJson>,
    restaurarCadastros: boolean = true,
  ): Promise<{
    competenciasAfetadas: number
    linhasInseridas: number
    linhasAtualizadas: number
    linhasExcluidas: number
  }> {
    if (
      !dadosAnalisados.valido ||
      dadosAnalisados.linhasNormalizadas.length === 0
    ) {
      throw new Error("Dados de backup inválidos para restauração.")
    }

    let linhasInseridas = 0
    let linhasAtualizadas = 0
    let linhasExcluidas = 0

    // 1. Opcional: restaura ou atualiza cadastros de funcionários se presentes no backup
    if (
      restaurarCadastros &&
      dadosAnalisados.funcionariosParaRestaurar.length > 0
    ) {
      for (const f of dadosAnalisados.funcionariosParaRestaurar) {
        if (!f.nome) continue
        const nomeUpper = String(f.nome).trim().toUpperCase()
        const cpfLimpo =
          f.cpf || f.doc ? String(f.cpf || f.doc).replace(/[^\d]/g, "") : null

        const payloadFunc = {
          empresa_id: empresaId,
          nome: nomeUpper,
          funcao: (f.funcao || "Geral").trim().toUpperCase(),
          cpf: cpfLimpo || null,
          data_admissao: f.data_admissao || f.admissao || null,
          ativo: f.ativo !== undefined ? Boolean(f.ativo) : true,
          observacoes: f.observacoes || f.obs || null,
          telefone: f.telefone || null,
          email: f.email || null,
          bruto: Number(f.bruto || 0),
          filhos: parseInt(String(f.filhos || 0), 10) || 0,
          conta: f.conta || "",
          pix: f.pix || "",
          inativo: Boolean(f.inativo),
          oculto: Boolean(f.oculto),
          unidade: (f.unidade || "SJE").trim().toUpperCase(),
          updated_at: new Date().toISOString(),
        }

        // Busca existente por CPF ou Nome
        let existingId: string | null = null
        if (cpfLimpo) {
          const { data: exCpf } = await (supabase as any)
            .from("funcionarios")
            .select("id")
            .eq("empresa_id", empresaId)
            .eq("cpf", cpfLimpo)
            .maybeSingle()
          if (exCpf) existingId = exCpf.id
        }

        if (!existingId) {
          const { data: exNome } = await (supabase as any)
            .from("funcionarios")
            .select("id")
            .eq("empresa_id", empresaId)
            .ilike("nome", nomeUpper)
            .maybeSingle()
          if (exNome) existingId = exNome.id
        }

        if (existingId) {
          await (supabase as any)
            .from("funcionarios")
            .update(payloadFunc)
            .eq("id", existingId)
        } else {
          await (supabase as any).from("funcionarios").insert(payloadFunc)
        }
      }
    }

    // 2. Opcional: restaura terceiros se presentes
    if (
      restaurarCadastros &&
      dadosAnalisados.terceirosParaRestaurar.length > 0
    ) {
      for (const t of dadosAnalisados.terceirosParaRestaurar) {
        if (!t.nome) continue
        const nomeUpper = String(t.nome).trim().toUpperCase()
        const payloadTerc = {
          empresa_id: empresaId,
          nome: nomeUpper,
          bruto: Number(t.bruto || 0),
          conta: t.conta || "",
          pix: t.pix || "",
          obs: t.obs || t.observacoes || "",
          unidade: (t.unidade || "SJE").trim().toUpperCase(),
          ativo: t.ativo !== undefined ? Boolean(t.ativo) : true,
          updated_at: new Date().toISOString(),
        }

        const { data: exTerc } = await (supabase as any)
          .from("folha_terceiros")
          .select("id")
          .eq("empresa_id", empresaId)
          .ilike("nome", nomeUpper)
          .maybeSingle()

        if (exTerc) {
          await (supabase as any)
            .from("folha_terceiros")
            .update(payloadTerc)
            .eq("id", exTerc.id)
        } else {
          await (supabase as any).from("folha_terceiros").insert(payloadTerc)
        }
      }
    }

    // 3. Garante que todas as competências do backup existam
    const mapaCompetenciaObj: Record<string, string> = {}
    for (const comp of dadosAnalisados.competenciasLista) {
      const compCriada = await this.obterOuCriarCompetencia(empresaId, comp)
      mapaCompetenciaObj[comp] = compCriada.id
    }

    // 4. Se modo === 'substituir', apaga as linhas das competências que vieram no backup (APENAS desta empresa)
    if (modo === "substituir") {
      for (const comp of dadosAnalisados.competenciasLista) {
        const { count, error: errCount } = await (supabase as any)
          .from("folha_pagamento_linhas")
          .select("*", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("competencia", comp)

        if (!errCount && count) {
          linhasExcluidas += count
        }

        const { error: errDel } = await (supabase as any)
          .from("folha_pagamento_linhas")
          .delete()
          .eq("empresa_id", empresaId)
          .eq("competencia", comp)

        if (errDel) {
          console.error(`Erro ao apagar linhas da competência ${comp}:`, errDel)
          throw errDel
        }
      }
    }

    // 5. Mapeia funcionários da empresa ativa por nome e por cpf para vincular funcionario_id
    const { data: listaFuncsAtual } = await (supabase as any)
      .from("funcionarios")
      .select("id, nome, cpf")
      .eq("empresa_id", empresaId)

    const mapFuncPorNome = new Map<string, string>()
    const mapFuncPorCpf = new Map<string, string>()
    for (const f of listaFuncsAtual || []) {
      mapFuncPorNome.set(f.nome.trim().toUpperCase(), f.id)
      if (f.cpf) {
        const cpfL = String(f.cpf).replace(/[^\d]/g, "")
        if (cpfL) mapFuncPorCpf.set(cpfL, f.id)
      }
    }

    // 6. Insere ou mescla as linhas
    // Se for modo substituir, podemos inserir em lotes para alta performance
    if (modo === "substituir") {
      const lote: any[] = []
      for (const l of dadosAnalisados.linhasNormalizadas) {
        const compId = mapaCompetenciaObj[l.competencia]
        const nomeUpper = l.nome.trim().toUpperCase()
        const cpfL = l.cpf ? String(l.cpf).replace(/[^\d]/g, "") : null
        const funcId =
          (cpfL && mapFuncPorCpf.get(cpfL)) ||
          mapFuncPorNome.get(nomeUpper) ||
          null

        lote.push({
          empresa_id: empresaId,
          competencia_id: compId,
          competencia: l.competencia,
          tipo: l.tipo,
          nome: nomeUpper,
          cargo: l.cargo || l.funcao || "Geral",
          funcao: l.funcao || l.cargo || "Geral",
          unidade: l.unidade || "SJE",
          bruto: l.bruto,
          salario_base: l.salario_base ?? l.bruto,
          filhos: l.filhos,
          inss: l.inss,
          familia: l.familia,
          ir: l.ir,
          quinzena: l.quinzena,
          quinzena_2: l.quinzena_2 ?? 0,
          adiantamento: l.adiantamento,
          gratificacao: l.gratificacao,
          mensal_liquido: l.mensal_liquido,
          salario_liquido: l.salario_liquido ?? l.mensal_liquido,
          obras: l.obras ?? 0,
          valor_obra: l.valor_obra ?? 20,
          producao: l.producao ?? 0,
          limpeza: l.limpeza ?? 0,
          sabado: l.sabado ?? 0,
          feriado: l.feriado ?? 0,
          ferias: l.ferias ?? 0,
          ajuda_custo: l.ajuda_custo ?? 0,
          vendas_obra: l.vendas_obra ?? 0,
          comissao: l.comissao ?? 0,
          vendas_ajuda: l.vendas_ajuda ?? 0,
          conta: l.conta || "",
          pix: l.pix || "",
          chave_pix: l.chave_pix || l.pix || "",
          modo_calculo: l.modo_calculo || "Calculado",
          oculto: Boolean(l.oculto),
          inativo: Boolean(l.inativo),
          observacao_linha: l.observacao_linha || null,
          cpf: cpfL || null,
          funcionario_id: funcId,
          backup_id: l.backup_id || null,
          updated_at: new Date().toISOString(),
        })
      }

      // Inserção em lotes de 50
      const CHUNK_SIZE = 50
      for (let i = 0; i < lote.length; i += CHUNK_SIZE) {
        const slice = lote.slice(i, i + CHUNK_SIZE)
        const { error: errInsertBatch } = await (supabase as any)
          .from("folha_pagamento_linhas")
          .insert(slice)
        if (errInsertBatch) {
          console.error(
            "Erro ao inserir lote de linhas no modo substituir:",
            errInsertBatch,
          )
          throw errInsertBatch
        }
        linhasInseridas += slice.length
      }
    } else {
      // Modo mesclar (upsert por nome na mesma empresa e competência)
      for (const comp of dadosAnalisados.competenciasLista) {
        const linhasAtuaisComp = await this.getLinhasCompetencia(
          empresaId,
          comp,
        )
        const mapLinhasAtuais = new Map<string, FolhaPagamentoLinha>()
        linhasAtuaisComp.forEach((la) => {
          mapLinhasAtuais.set(la.nome.trim().toUpperCase(), la)
        })

        const linhasDesteComp = dadosAnalisados.linhasNormalizadas.filter(
          (l) => l.competencia === comp,
        )
        const compId = mapaCompetenciaObj[comp]

        for (const l of linhasDesteComp) {
          const nomeUpper = l.nome.trim().toUpperCase()
          const existente = mapLinhasAtuais.get(nomeUpper)
          const cpfL = l.cpf ? String(l.cpf).replace(/[^\d]/g, "") : null
          const funcId =
            (cpfL && mapFuncPorCpf.get(cpfL)) ||
            mapFuncPorNome.get(nomeUpper) ||
            null

          const payload = {
            empresa_id: empresaId,
            competencia_id: compId,
            competencia: comp,
            tipo: l.tipo,
            nome: nomeUpper,
            cargo: l.cargo || l.funcao || "Geral",
            funcao: l.funcao || l.cargo || "Geral",
            unidade: l.unidade || "SJE",
            bruto: l.bruto,
            salario_base: l.salario_base ?? l.bruto,
            filhos: l.filhos,
            inss: l.inss,
            familia: l.familia,
            ir: l.ir,
            quinzena: l.quinzena,
            quinzena_2: l.quinzena_2 ?? 0,
            adiantamento: l.adiantamento,
            gratificacao: l.gratificacao,
            mensal_liquido: l.mensal_liquido,
            salario_liquido: l.salario_liquido ?? l.mensal_liquido,
            obras: l.obras ?? 0,
            valor_obra: l.valor_obra ?? 20,
            producao: l.producao ?? 0,
            limpeza: l.limpeza ?? 0,
            sabado: l.sabado ?? 0,
            feriado: l.feriado ?? 0,
            ferias: l.ferias ?? 0,
            ajuda_custo: l.ajuda_custo ?? 0,
            vendas_obra: l.vendas_obra ?? 0,
            comissao: l.comissao ?? 0,
            vendas_ajuda: l.vendas_ajuda ?? 0,
            conta: l.conta || "",
            pix: l.pix || "",
            chave_pix: l.chave_pix || l.pix || "",
            modo_calculo: l.modo_calculo || "Calculado",
            oculto: Boolean(l.oculto),
            inativo: Boolean(l.inativo),
            observacao_linha: l.observacao_linha || null,
            cpf: cpfL || null,
            funcionario_id: funcId,
            backup_id: l.backup_id || null,
            updated_at: new Date().toISOString(),
          }

          if (existente) {
            const { error: errUpd } = await (supabase as any)
              .from("folha_pagamento_linhas")
              .update(payload)
              .eq("id", existente.id)
            if (errUpd) throw errUpd
            linhasAtualizadas++
          } else {
            const { error: errIns } = await (supabase as any)
              .from("folha_pagamento_linhas")
              .insert(payload)
            if (errIns) throw errIns
            linhasInseridas++
          }
        }
      }
    }

    // 7. Atualiza os totais consolidados de cada competência afetada
    for (const comp of dadosAnalisados.competenciasLista) {
      await this.atualizarTotaisCompetencia(empresaId, comp)
    }

    return {
      competenciasAfetadas: dadosAnalisados.competenciasLista.length,
      linhasInseridas,
      linhasAtualizadas,
      linhasExcluidas,
    }
  }

  /**
   * Exporta linhas da aba GERAL em formato CSV compatível com o importador padrão.
   * Pode exportar uma competência específica ou todas as competências da empresa ativa.
   */
  static async exportarGeralCSV(
    empresaId: string,
    competenciaAlvo?: string, // se undefined, exporta todas as competências
  ): Promise<string> {
    let query = (supabase as any)
      .from("folha_pagamento_linhas")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("competencia", { ascending: false })
      .order("nome", { ascending: true })

    if (competenciaAlvo) {
      query = query.eq("competencia", competenciaAlvo)
    }

    const { data, error } = await query
    if (error) throw error

    // Formato compatível com o parser:
    // Tipo;Nome;Funcao;Unidade;Bruto;Filhos;INSS;Familia;IR;Quinzena;Adiantamento;Gratificacao;MensalLiquido;Producao;Comissao;Conta;PIX
    const colunas = [
      "Tipo",
      "Nome",
      "Funcao",
      "Unidade",
      "Bruto",
      "Filhos",
      "INSS",
      "Familia",
      "IR",
      "Quinzena",
      "Adiantamento",
      "Gratificacao",
      "MensalLiquido",
      "Producao",
      "Comissao",
      "Conta",
      "PIX",
      "Competencia",
    ]

    const linhasCsv: string[] = [colunas.join(";")]

    const formatNum = (v: any) => {
      const n = Number(v || 0)
      return n.toFixed(2).replace(".", ",")
    }

    for (const l of data || []) {
      const valores = [
        l.tipo || "Funcionario",
        (l.nome || "").replace(/;/g, " "),
        (l.funcao || l.cargo || "Geral").replace(/;/g, " "),
        (l.unidade || "SJE").replace(/;/g, " "),
        formatNum(l.bruto),
        String(l.filhos || 0),
        formatNum(l.inss),
        formatNum(l.familia),
        formatNum(l.ir),
        formatNum(l.quinzena),
        formatNum(l.adiantamento),
        formatNum(l.gratificacao),
        formatNum(l.mensal_liquido),
        formatNum(l.producao),
        formatNum(l.comissao),
        (l.conta || "").replace(/;/g, " "),
        (l.pix || l.chave_pix || "").replace(/;/g, " "),
        l.competencia || "",
      ]
      linhasCsv.push(valores.join(";"))
    }

    return "\uFEFF" + linhasCsv.join("\r\n")
  }
}
