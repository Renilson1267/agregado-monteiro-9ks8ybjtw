import { supabase } from '@/lib/supabase/client'
import {
  FolhaCompetencia,
  FolhaPagamentoLinha,
  FolhaTotaisCalculados,
  calcularMensalLiquido,
} from '@/types/folha'

export interface SalvarLinhaFolhaPayload {
  id?: string
  empresa_id: string
  competencia: string
  tipo: 'Funcionario' | 'Terceiro'
  nome: string
  funcao: string
  unidade: string
  bruto: number
  filhos: number
  inss: number
  familia: number
  ir: number
  quinzena: number
  adiantamento: number
  gratificacao: number
  mensal_liquido: number
  producao: number
  comissao: number
  conta: string
  pix: string
  modo_calculo?: 'Calculado' | 'Digitado'
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
      .from('folha_competencias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('competencia', { ascending: false })

    if (error) {
      console.error('Erro ao buscar competências da folha:', error)
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
      .from('folha_competencias')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('competencia', competencia)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar competência:', error)
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
  ): Promise<FolhaCompetencia> {
    const [anoStr, mesStr] = competencia.split('-')
    const ano = parseInt(anoStr, 10) || new Date().getFullYear()
    const mes = parseInt(mesStr, 10) || new Date().getMonth() + 1

    const existente = await this.getCompetencia(empresaId, competencia)
    if (existente) return existente

    const { data, error } = await (supabase as any)
      .from('folha_competencias')
      .insert({
        empresa_id: empresaId,
        competencia,
        ano,
        mes,
        observacoes,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar competência:', error)
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
      .from('folha_pagamento_linhas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('competencia', competencia)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar linhas da folha:', error)
      throw error
    }

    // Normaliza tipos numéricos e strings caso o retorno venha como string/null
    return (data || []).map((l: any) => ({
      ...l,
      tipo: l.tipo === 'Terceiro' ? 'Terceiro' : 'Funcionario',
      nome: l.nome || '',
      funcao: l.funcao || 'Geral',
      unidade: l.unidade || 'SJE',
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
      conta: l.conta || '',
      pix: l.pix || '',
      modo_calculo: l.modo_calculo || 'Calculado',
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
      tipo: payload.tipo === 'Terceiro' ? 'Terceiro' : 'Funcionario',
      nome: payload.nome.trim().toUpperCase(),
      funcao: payload.funcao.trim().toUpperCase(),
      unidade: payload.unidade.trim().toUpperCase() || 'SJE',
      bruto: Number(payload.bruto || 0),
      filhos: parseInt(String(payload.filhos || 0), 10) || 0,
      inss: Number(payload.inss || 0),
      familia: Number(payload.familia || 0),
      ir: Number(payload.ir || 0),
      quinzena: Number(payload.quinzena || 0),
      adiantamento: Number(payload.adiantamento || 0),
      gratificacao: Number(payload.gratificacao || 0),
      mensal_liquido: Number(payload.mensal_liquido || 0),
      producao: Number(payload.producao || 0),
      comissao: Number(payload.comissao || 0),
      conta: payload.conta || '',
      pix: payload.pix || '',
      modo_calculo: payload.modo_calculo || 'Calculado',
      funcionario_id: payload.funcionario_id || null,
      cpf: payload.cpf || null,
      matricula: payload.matricula || null,
      updated_at: new Date().toISOString(),
    }

    let resultado: FolhaPagamentoLinha

    if (payload.id) {
      const { data, error } = await (supabase as any)
        .from('folha_pagamento_linhas')
        .update(dados)
        .eq('id', payload.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar linha da folha:', error)
        throw error
      }
      resultado = data as FolhaPagamentoLinha
    } else {
      const { data, error } = await (supabase as any)
        .from('folha_pagamento_linhas')
        .insert(dados)
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir linha da folha:', error)
        throw error
      }
      resultado = data as FolhaPagamentoLinha
    }

    // Atualiza totais na competência
    await this.atualizarTotaisCompetencia(payload.empresa_id, payload.competencia)

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
      .from('folha_pagamento_linhas')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      console.error('Erro ao excluir linha da folha:', error)
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
    linhas: Array<Omit<FolhaPagamentoLinha, 'id' | 'empresa_id'>>,
  ): Promise<{
    competencia: FolhaCompetencia
    totalInseridos: number
    totalAtualizados: number
  }> {
    if (!linhas || linhas.length === 0) {
      throw new Error('Nenhuma linha de folha fornecida para salvar.')
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
        tipo: l.tipo === 'Terceiro' ? 'Terceiro' : 'Funcionario',
        nome: nomeUpper,
        funcao: (l.funcao || 'Geral').trim().toUpperCase(),
        unidade: (l.unidade || 'SJE').trim().toUpperCase(),
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
        conta: l.conta || '',
        pix: l.pix || '',
        modo_calculo: l.modo_calculo || 'Calculado',
        funcionario_id: l.funcionario_id || null,
        cpf: l.cpf || null,
        matricula: l.matricula || null,
        updated_at: new Date().toISOString(),
      }

      if (existente) {
        const { error } = await (supabase as any)
          .from('folha_pagamento_linhas')
          .update(payload)
          .eq('id', existente.id)
        if (error) throw error
        totalAtualizados++
      } else {
        const { error } = await (supabase as any)
          .from('folha_pagamento_linhas')
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
      .from('folha_competencias')
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
      .eq('id', comp.id)
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
      .from('folha_competencias')
      .delete()
      .eq('id', competenciaId)
      .eq('empresa_id', empresaId)

    if (error) {
      console.error('Erro ao excluir competência:', error)
      throw error
    }
  }

  /**
   * Calcula somatório consolidado de todas as colunas reais da Folha GC MIX
   */
  static calcularTotais(linhas: FolhaPagamentoLinha[]): FolhaTotaisCalculados {
    return linhas.reduce(
      (acc, l) => {
        acc.totalRegistros += 1
        if (l.tipo === 'Terceiro') {
          acc.totalTerceiros += 1
        } else {
          acc.totalFuncionarios += 1
        }
        acc.totalBruto += Number(l.bruto || 0)
        acc.totalFilhos += Number(l.filhos || 0)
        acc.totalInss += Number(l.inss || 0)
        acc.totalFamilia += Number(l.familia || 0)
        acc.totalIr += Number(l.ir || 0)
        acc.totalQuinzena += Number(l.quinzena || 0)
        acc.totalAdiantamento += Number(l.adiantamento || 0)
        acc.totalGratificacao += Number(l.gratificacao || 0)
        acc.totalMensalLiquido += Number(l.mensal_liquido || 0)
        acc.totalProducao += Number(l.producao || 0)
        acc.totalComissao += Number(l.comissao || 0)
        acc.totalGeralLiquidoAReceber += Number(l.mensal_liquido || 0)
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
        totalAdiantamento: 0,
        totalGratificacao: 0,
        totalMensalLiquido: 0,
        totalProducao: 0,
        totalComissao: 0,
        totalGeralLiquidoAReceber: 0,
      },
    )
  }
}
