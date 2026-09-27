import { supabase } from '@/lib/supabase/client'
import {
  FolhaCompetencia,
  FolhaPagamentoLinha,
  FolhaResumoTotais,
} from '@/types/folha'
import { LinhaFolhaParsed } from '@/lib/csv-folha-parser'

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
   * Lista as linhas de folha de pagamento de uma competência
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

    return (data || []) as FolhaPagamentoLinha[]
  }

  /**
   * Importa e salva uma folha completa (cria/atualiza competência e suas linhas)
   * Realiza deduplicação por CPF ou matrícula, atualizando existentes ou inserindo novos
   * Também vincula levemente ao cadastro de funcionários da empresa por CPF/Nome
   */
  static async salvarImportacaoFolha(
    empresaId: string,
    competencia: string,
    linhas: LinhaFolhaParsed[],
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

    // 2. Buscar funcionários cadastrados para vínculo leve (por CPF ou Nome)
    const { data: funcs } = await supabase
      .from('funcionarios')
      .select('id, cpf, nome')
      .eq('empresa_id', empresaId)

    const mapFuncPorCpf = new Map<string, string>()
    const mapFuncPorNome = new Map<string, string>()
    ;(funcs || []).forEach((f) => {
      if (f.cpf) mapFuncPorCpf.set(f.cpf, f.id)
      if (f.nome) mapFuncPorNome.set(f.nome.trim().toUpperCase(), f.id)
    })

    // 3. Buscar linhas atuais já gravadas nessa competência
    const linhasAtuais = await this.getLinhasCompetencia(empresaId, competencia)
    const mapLinhasAtuaisCpf = new Map<string, FolhaPagamentoLinha>()
    const mapLinhasAtuaisNome = new Map<string, FolhaPagamentoLinha>()
    linhasAtuais.forEach((l) => {
      if (l.cpf) mapLinhasAtuaisCpf.set(l.cpf, l)
      mapLinhasAtuaisNome.set(l.nome.trim().toUpperCase(), l)
    })

    let totalInseridos = 0
    let totalAtualizados = 0

    // 4. Salvar cada linha (update ou insert)
    for (const l of linhas) {
      const funcionarioId =
        (l.cpf && mapFuncPorCpf.get(l.cpf)) ||
        mapFuncPorNome.get(l.nome.trim().toUpperCase()) ||
        null

      // Procura linha existente
      const existente =
        (l.cpf && mapLinhasAtuaisCpf.get(l.cpf)) ||
        mapLinhasAtuaisNome.get(l.nome.trim().toUpperCase())

      const payload = {
        empresa_id: empresaId,
        competencia_id: comp.id,
        competencia,
        funcionario_id: funcionarioId,
        matricula: l.matricula,
        cpf: l.cpf,
        nome: l.nome,
        cargo: l.cargo,
        departamento: l.departamento,
        data_admissao: l.data_admissao,
        salario_base: l.salario_base,
        horas_normais: l.horas_normais,
        horas_extras: l.horas_extras,
        valor_horas_extras: l.valor_horas_extras,
        adicional_periculosidade: l.adicional_periculosidade,
        adicional_insalubridade: l.adicional_insalubridade,
        adicional_noturno: l.adicional_noturno,
        gratificacoes: l.gratificacoes,
        comissoes: l.comissoes,
        dsr: l.dsr,
        outros_proventos: l.outros_proventos,
        total_proventos: l.total_proventos,
        inss_retido: l.inss_retido,
        irrf_retido: l.irrf_retido,
        vale_transporte: l.vale_transporte,
        vale_refeicao: l.vale_refeicao,
        adiantamento: l.adiantamento,
        faltas_atrasos: l.faltas_atrasos,
        plano_saude: l.plano_saude,
        outros_descontos: l.outros_descontos,
        total_descontos: l.total_descontos,
        salario_liquido: l.salario_liquido,
        base_inss: l.base_inss,
        base_fgts: l.base_fgts,
        base_irrf: l.base_irrf,
        fgts_mes: l.fgts_mes,
        banco: l.banco,
        agencia: l.agencia,
        conta: l.conta,
        chave_pix: l.chave_pix,
        itens_discriminados: l.itens_discriminados || [],
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

    // 5. Recalcular e consolidar totais da competência
    const todasLinhasAtualizadas = await this.getLinhasCompetencia(
      empresaId,
      competencia,
    )
    const somas = todasLinhasAtualizadas.reduce(
      (acc, curr) => {
        acc.proventos += Number(curr.total_proventos || 0)
        acc.descontos += Number(curr.total_descontos || 0)
        acc.liquido += Number(curr.salario_liquido || 0)
        acc.fgts += Number(curr.fgts_mes || 0)
        return acc
      },
      { proventos: 0, descontos: 0, liquido: 0, fgts: 0 },
    )

    const { data: compAtualizada, error: errComp } = await (supabase as any)
      .from('folha_competencias')
      .update({
        total_colaboradores: todasLinhasAtualizadas.length,
        total_proventos: somas.proventos,
        total_descontos: somas.descontos,
        total_liquido: somas.liquido,
        total_fgts: somas.fgts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', comp.id)
      .select()
      .single()

    if (errComp) throw errComp

    return {
      competencia: compAtualizada as FolhaCompetencia,
      totalInseridos,
      totalAtualizados,
    }
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
   * Calcula resumo consolidado dos totais
   */
  static calcularResumo(linhas: FolhaPagamentoLinha[]): FolhaResumoTotais {
    return linhas.reduce(
      (acc, l) => {
        acc.totalColaboradores += 1
        acc.totalSalarioBase += Number(l.salario_base || 0)
        acc.totalProventos += Number(l.total_proventos || 0)
        acc.totalDescontos += Number(l.total_descontos || 0)
        acc.totalLiquido += Number(l.salario_liquido || 0)
        acc.totalFgts += Number(l.fgts_mes || 0)
        acc.totalInssRetido += Number(l.inss_retido || 0)
        acc.totalIrrfRetido += Number(l.irrf_retido || 0)
        acc.totalAdiantamentos += Number(l.adiantamento || 0)
        acc.totalHorasExtras += Number(l.valor_horas_extras || 0)
        return acc
      },
      {
        totalColaboradores: 0,
        totalSalarioBase: 0,
        totalProventos: 0,
        totalDescontos: 0,
        totalLiquido: 0,
        totalFgts: 0,
        totalInssRetido: 0,
        totalIrrfRetido: 0,
        totalAdiantamentos: 0,
        totalHorasExtras: 0,
      },
    )
  }
}
