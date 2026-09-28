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
  ferias?: number
  ajuda_custo?: number
  vendas_obra?: number
  comissao: number
  vendas_ajuda?: number
  conta: string
  pix: string
  chave_pix?: string
  modo_calculo?: 'Calculado' | 'Digitado'
  oculto?: boolean
  inativo?: boolean
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
      cargo: l.cargo || l.funcao || 'Geral',
      funcao: l.funcao || l.cargo || 'Geral',
      unidade: l.unidade || 'SJE',
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
      ferias: Number(l.ferias || 0),
      ajuda_custo: Number(l.ajuda_custo || 0),
      vendas_obra: Number(l.vendas_obra || 0),
      comissao: Number(l.comissao || 0),
      vendas_ajuda: Number(l.vendas_ajuda || 0),
      total_proventos: Number(l.total_proventos || 0),
      total_descontos: Number(l.total_descontos || 0),
      salario_liquido: Number(l.salario_liquido || l.mensal_liquido || 0),
      mensal_liquido: Number(l.mensal_liquido || l.salario_liquido || 0),
      conta: l.conta || '',
      pix: l.pix || l.chave_pix || '',
      chave_pix: l.chave_pix || l.pix || '',
      modo_calculo: l.modo_calculo || 'Calculado',
      oculto: Boolean(l.oculto),
      inativo: Boolean(l.inativo),
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
      cargo: (payload.cargo || payload.funcao).trim().toUpperCase(),
      funcao: payload.funcao.trim().toUpperCase(),
      unidade: payload.unidade.trim().toUpperCase() || 'SJE',
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
      ferias: Number(payload.ferias || 0),
      ajuda_custo: Number(payload.ajuda_custo || 0),
      vendas_obra: Number(payload.vendas_obra || 0),
      comissao: Number(payload.comissao || 0),
      vendas_ajuda: Number(payload.vendas_ajuda || 0),
      mensal_liquido: Number(payload.mensal_liquido || 0),
      salario_liquido: Number(payload.salario_liquido ?? payload.mensal_liquido ?? 0),
      conta: payload.conta || '',
      pix: payload.pix || payload.chave_pix || '',
      chave_pix: payload.chave_pix || payload.pix || '',
      modo_calculo: payload.modo_calculo || 'Calculado',
      oculto: Boolean(payload.oculto),
      inativo: Boolean(payload.inativo),
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
        acc.totalQuinzena2 += Number(l.quinzena_2 || 0)
        acc.totalAdiantamento += Number(l.adiantamento || 0)
        acc.totalGratificacao += Number(l.gratificacao || 0)
        acc.totalObras += Number(l.obras || 0)
        acc.totalProducao += Number(l.producao || 0)
        acc.totalLimpeza += Number(l.limpeza || 0)
        acc.totalSabado += Number(l.sabado || 0)
        acc.totalFerias += Number(l.ferias || 0)
        acc.totalAjudaCusto += Number(l.ajuda_custo || 0)
        acc.totalVendas += Number(l.vendas_obra || 0)
        acc.totalComissao += Number(l.comissao || 0)
        acc.totalVendasAjuda += Number(l.vendas_ajuda || 0)
        acc.totalMensalLiquido += Number(l.mensal_liquido || 0)
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
        totalQuinzena2: 0,
        totalAdiantamento: 0,
        totalGratificacao: 0,
        totalObras: 0,
        totalProducao: 0,
        totalLimpeza: 0,
        totalSabado: 0,
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
   * Garante a importação automática do backup legado no banco se ainda não houver lançamentos
   */
  static async garantirSeedFolha(): Promise<void> {
    try {
      const { count, error } = await (supabase as any)
        .from('folha_pagamento_linhas')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.warn('Erro ao checar contagem folha_pagamento_linhas:', error)
        return
      }

      // Se já temos as ~300+ linhas semeadas, nada a fazer
      if (typeof count === 'number' && count >= 300) {
        return
      }

      console.info('[Folha] Semeando dados do backup legado via client...')
      const { FOLHA_BACKUP_DATA: backupData } = await import('@/lib/folha-backup-data')

      const cadFuncs = (backupData.cadastros?.funcionarios || []) as Array<{
        id: string
        nome: string
        doc?: string
        funcao?: string
        unidade?: string
      }>
      const folhaFuncs = (backupData.folha?.func || {}) as Record<string, any>
      const lanc = (backupData.folha?.lanc || {}) as Record<string, any>

      const SJE_ID = '22222222-2222-2222-2222-222222222222'
      const MONTEIRO_ID = '11111111-1111-1111-1111-111111111111'

      const funcMap: Record<string, any> = {}
      for (const f of cadFuncs) {
        const fFolha = folhaFuncs[f.id] || {}
        const unidadeCru = fFolha.unidade || f.unidade || 'SJE'
        const unidade = String(unidadeCru).toUpperCase()
        const empresaId = unidade.includes('MONTEIRO') ? MONTEIRO_ID : SJE_ID
        funcMap[f.id] = {
          ...f,
          ...fFolha,
          empresaId,
          unidade: unidade.includes('MONTEIRO') ? 'MONTEIRO' : 'SJE',
          cpfLimpo: f.doc ? f.doc.replace(/[^\d]/g, '') : null,
        }
      }

      const tercDefs = [
        {
          backupKey: '1',
          nome: 'RAIMUNDO MARIANO DA SILVA JUNIOR',
          empresaId: SJE_ID,
          unidade: 'SJE',
          bruto: 4270,
          pix: 'raimundojunior100@gmail.com',
          conta: '',
        },
        {
          backupKey: '0',
          nome: 'MARCIO LUAN DA SILVA',
          empresaId: MONTEIRO_ID,
          unidade: 'MONTEIRO',
          bruto: 0,
          pix: '12175804410',
          conta: '',
        },
      ]

      const comps = Object.keys(lanc).sort()

      for (const comp of comps) {
        const [anoStr, mesStr] = comp.split('-')
        const ano = parseInt(anoStr, 10)
        const mes = parseInt(mesStr, 10)
        const funcsLanc = lanc[comp].func || {}
        const tercLanc = lanc[comp].terc || {}

        for (const empId of [SJE_ID, MONTEIRO_ID]) {
          const rows: any[] = []

          // Competencia
          await (supabase as any)
            .from('folha_competencias')
            .upsert(
              {
                empresa_id: empId,
                competencia: comp,
                ano,
                mes,
                status: 'ABERTA',
                observacoes: 'Importado do backup legado',
              },
              { onConflict: 'empresa_id,competencia' },
            )

          for (const [funcId, fL] of Object.entries(funcsLanc) as [string, any][]) {
            if (funcId === '__novo' || funcId === 'undefined') continue
            const fCad = funcMap[funcId]
            if (!fCad || fCad.empresaId !== empId) continue

            const obras = Number(fL.obras || 0)
            const valorObra = Number(fL.valorObra ?? 20)
            const producao = obras * valorObra
            const limp = Number(fL.limp || 0)
            const sab = Number(fL.sab || 0)
            const fer = Number(fL.fer || 0)
            const ajuda = Number(fL.ajuda || 0)
            const vendObra = Number(fL.vendObra || 0)
            let comissao = Number(fL.vendCom || 0)
            if (comissao === 0 && vendObra > 0) {
              comissao = Math.round(vendObra * 0.005 * 100) / 100
            }
            const vendAjuda = Number(fL.vendAjuda || 0)
            const adiant = Number(fL.adiant || 0)
            const gratif = Number(fL.gratif || 0)
            const bruto = Number(fCad.bruto || 0)
            const filhos = Number(fCad.filhos || 0)

            const totalProventos =
              bruto + producao + limp + sab + fer + ajuda + comissao + gratif + vendAjuda
            const totalDescontos = adiant
            const liquido = Math.round((totalProventos - totalDescontos) * 100) / 100
            const comissaoCalc = Math.round(vendObra * 0.005 * 100) / 100
            const modoCalculo =
              vendObra > 0 && Math.abs(comissao - comissaoCalc) > 0.01 ? 'Digitado' : 'Calculado'

            rows.push({
              empresa_id: empId,
              competencia: comp,
              nome: fCad.nome.trim().toUpperCase(),
              cargo: (fCad.funcao || 'Geral').trim().toUpperCase(),
              tipo: 'Funcionario',
              funcao: (fCad.funcao || 'Geral').trim().toUpperCase(),
              unidade: fCad.unidade,
              bruto,
              salario_base: bruto,
              filhos,
              conta: fCad.conta || '',
              chave_pix: fCad.pix || '',
              pix: fCad.pix || '',
              obras,
              valor_obra: valorObra,
              producao,
              limpeza: limp,
              sabado: sab,
              ferias: fer,
              ajuda_custo: ajuda,
              vendas_obra: vendObra,
              comissao,
              vendas_ajuda: vendAjuda,
              adiantamento: adiant,
              gratificacao: gratif,
              total_proventos: totalProventos,
              total_descontos: totalDescontos,
              salario_liquido: liquido,
              mensal_liquido: liquido,
              modo_calculo: modoCalculo,
              oculto: Boolean(fCad.oculto),
              inativo: Boolean(fCad.inativo),
              backup_id: funcId,
              cpf: fCad.cpfLimpo || null,
            })
          }

          for (const t of tercDefs) {
            if (t.empresaId !== empId) continue
            const tL = tercLanc[t.backupKey]
            const vendObra = Number(tL?.vendObra || 0)
            let comissao = Number(tL?.vendCom || 0)
            if (comissao === 0 && vendObra > 0) {
              comissao = Math.round(vendObra * 0.005 * 100) / 100
            }
            const vendAjuda = Number(tL?.vendAjuda || 0)
            const adiant = Number(tL?.adiant || 0)
            const gratif = Number(tL?.gratif || 0)
            const ajudaCusto = vendAjuda
            const bruto = t.bruto
            const totalProventos = bruto + comissao + ajudaCusto + gratif
            const totalDescontos = adiant
            const liquido = Math.round((totalProventos - totalDescontos) * 100) / 100

            if (tL || bruto > 0 || vendObra > 0) {
              rows.push({
                empresa_id: empId,
                competencia: comp,
                nome: t.nome.trim().toUpperCase(),
                cargo: 'Terceiro',
                tipo: 'Terceiro',
                funcao: 'Terceiro',
                unidade: t.unidade,
                bruto,
                salario_base: bruto,
                filhos: 0,
                conta: t.conta,
                chave_pix: t.pix,
                pix: t.pix,
                obras: 0,
                valor_obra: 20,
                producao: 0,
                limpeza: 0,
                sabado: 0,
                ferias: 0,
                ajuda_custo: ajudaCusto,
                vendas_obra: vendObra,
                comissao,
                vendas_ajuda: vendAjuda,
                adiantamento: adiant,
                gratificacao: gratif,
                total_proventos: totalProventos,
                total_descontos: totalDescontos,
                salario_liquido: liquido,
                mensal_liquido: liquido,
                modo_calculo:
                  vendObra > 0 && Math.abs(comissao - Math.round(vendObra * 0.005 * 100) / 100) > 0.01
                    ? 'Digitado'
                    : 'Calculado',
                oculto: false,
                inativo: false,
                backup_id: `terc_${t.backupKey}`,
                cpf: null,
              })
            }
          }

          if (rows.length > 0) {
            await (supabase as any)
              .from('folha_pagamento_linhas')
              .upsert(rows, { onConflict: 'empresa_id,competencia,nome' })
          }
        }
      }

      console.info('[Folha] Seed automático concluído com sucesso.')
    } catch (err) {
      console.error('[Folha] Falha ao semear folha:', err)
    }
  }
}
