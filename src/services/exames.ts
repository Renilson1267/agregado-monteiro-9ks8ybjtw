import { supabase } from '@/lib/supabase/client'
import {
  Funcionario,
  ExameFuncionario,
  TipoExame,
  StatusExame,
  ExameCalculado,
  FuncionarioComExames,
  ResumoExamesEmpresa,
  PrazoExameEmpresa,
  TIPOS_EXAME_CATALOGO,
} from '@/types/exames'

/**
 * Calcula a data de validade somando N meses a uma data YYYY-MM-DD
 */
export function calcularDataValidade(
  dataRealizacao: string,
  validadeMeses: number,
): string {
  const [ano, mes, dia] = dataRealizacao.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  data.setMonth(data.getMonth() + validadeMeses)

  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Calcula a diferença em dias entre a data de validade e hoje
 */
export function calcularDiasAteValidade(dataValidade: string): number {
  const [ano, mes, dia] = dataValidade.split('-').map(Number)
  const validade = new Date(ano, mes - 1, dia, 23, 59, 59)
  const agora = new Date()
  const hoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
  )

  const diffMs = validade.getTime() - hoje.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determina o status de um exame
 * PENDENTE: se não há data de realização
 * VENCIDO: se a data de validade já expirou (< 0 dias)
 * NO_PRAZO: se ainda está dentro da validade (>= 0 dias)
 */
export function calcularStatusExame(
  dataRealizacao: string | null,
  validadeMeses: number,
): {
  status: StatusExame
  dataValidade: string | null
  diasParaVencer: number | null
} {
  if (!dataRealizacao) {
    return {
      status: 'PENDENTE',
      dataValidade: null,
      diasParaVencer: null,
    }
  }

  const dataValidade = calcularDataValidade(dataRealizacao, validadeMeses)
  const dias = calcularDiasAteValidade(dataValidade)

  if (dias < 0) {
    return {
      status: 'VENCIDO',
      dataValidade,
      diasParaVencer: dias,
    }
  }

  return {
    status: 'NO_PRAZO',
    dataValidade,
    diasParaVencer: dias,
  }
}

/**
 * Monta o objeto completo de funcionário com todos os exames catalogados e status geral
 */
export function processarFuncionarioComExames(
  funcionario: Funcionario,
  examesRegistrados: ExameFuncionario[],
  prazosConfigurados?: Record<TipoExame, number> | Map<TipoExame, number>,
): FuncionarioComExames {
  const examesMapa: Partial<Record<TipoExame, ExameCalculado>> = {}
  const examesAVencer30Dias: ExameCalculado[] = []

  let totalVencidos = 0
  let totalNoPrazo = 0
  let totalPendentes = 0

  TIPOS_EXAME_CATALOGO.forEach((tipoDef) => {
    const reg = examesRegistrados.find((e) => e.tipo_exame === tipoDef.tipo)
    const prazoEmpresa =
      prazosConfigurados instanceof Map
        ? prazosConfigurados.get(tipoDef.tipo)
        : prazosConfigurados?.[tipoDef.tipo]

    // Hierarquia de prioridade do cálculo:
    // 1. Validade informada no exame individual (se existir e for > 0)
    // 2. Prazo configurado para o tipo de exame na empresa
    // 3. Validade padrão geral da norma/catálogo
    const validadeMeses =
      reg?.validade_meses && reg.validade_meses > 0
        ? reg.validade_meses
        : prazoEmpresa && prazoEmpresa > 0
          ? prazoEmpresa
          : tipoDef.validadePadraoMeses

    const dataRealizacao = reg?.data_realizacao ?? null

    const calc = calcularStatusExame(dataRealizacao, validadeMeses)

    const exameCalc: ExameCalculado = {
      tipo: tipoDef.tipo,
      nome: tipoDef.nome,
      dataRealizacao,
      dataValidade: calc.dataValidade,
      validadeMeses,
      diasParaVencer: calc.diasParaVencer,
      status: calc.status,
      observacao: reg?.observacao ?? null,
    }

    examesMapa[tipoDef.tipo] = exameCalc

    if (calc.status === 'VENCIDO') {
      totalVencidos++
    } else if (calc.status === 'NO_PRAZO') {
      totalNoPrazo++
      // Alerta de 30 dias: vence entre hoje e 30 dias
      if (calc.diasParaVencer !== null && calc.diasParaVencer <= 30) {
        examesAVencer30Dias.push(exameCalc)
      }
    } else {
      totalPendentes++
    }
  })

  // Status Geral do ASO do funcionário:
  // Se tem algum vencido -> VENCIDO
  // Senão, se o ASO ou admissional estiver no prazo -> NO_PRAZO (se nenhum vencido)
  // Se tudo pendente ou ASO pendente sem nada vencido -> PENDENTE
  let statusGeralAso: StatusExame = 'PENDENTE'
  if (totalVencidos > 0) {
    statusGeralAso = 'VENCIDO'
  } else if (
    examesMapa.aso?.status === 'NO_PRAZO' ||
    examesMapa.admissional?.status === 'NO_PRAZO' ||
    totalNoPrazo > 0
  ) {
    // Se há pelo menos exames em dia e nenhum vencido
    statusGeralAso = 'NO_PRAZO'
  } else {
    statusGeralAso = 'PENDENTE'
  }

  return {
    ...funcionario,
    exames: examesMapa as Record<TipoExame, ExameCalculado>,
    statusGeralAso,
    totalVencidos,
    totalNoPrazo,
    totalPendentes,
    examesAVencer30Dias,
  }
}

export const ExamesService = {
  // 1. Obter mapa de prazos configurados por empresa (ou defaults)
  async getPrazosEmpresa(
    empresaId?: string,
  ): Promise<Record<TipoExame, number>> {
    const mapaPadrao: Record<TipoExame, number> = {
      admissional: 12,
      aso: 12,
      acuidade_visual: 12,
      audiometria: 12,
      avaliacao_clinica: 12,
      toxicologico: 30,
      rx: 12,
      ecg: 12,
    }

    if (!empresaId) return mapaPadrao

    try {
      const { data, error } = await (supabase as any)
        .from('prazos_exame_por_empresa')
        .select('*')
        .eq('empresa_id', empresaId)

      if (error) {
        console.warn(
          'Erro ao carregar prazos da empresa, usando fallback:',
          error,
        )
        return mapaPadrao
      }

      if (!data || data.length === 0) {
        return mapaPadrao
      }

      data.forEach((p: any) => {
        if (p.tipo_exame && p.validade_padrao_meses > 0) {
          mapaPadrao[p.tipo_exame as TipoExame] = Number(
            p.validade_padrao_meses,
          )
        }
      })

      return mapaPadrao
    } catch (err) {
      console.warn('Falha na consulta de prazos_exame_por_empresa:', err)
      return mapaPadrao
    }
  },

  // 1.1 Listar registros completos da tabela prazos_exame_por_empresa com referências legais
  async listarPrazosCompletosEmpresa(
    empresaId: string,
  ): Promise<PrazoExameEmpresa[]> {
    if (!empresaId) return []

    const { data, error } = await (supabase as any)
      .from('prazos_exame_por_empresa')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('tipo_exame', { ascending: true })

    if (error) throw error

    // Se a empresa ainda não tiver registros (ex.: empresa nova), inicializa com o catálogo padrão
    if (!data || data.length === 0) {
      return TIPOS_EXAME_CATALOGO.map((item) => ({
        empresa_id: empresaId,
        tipo_exame: item.tipo,
        nome_exame: item.nome,
        validade_padrao_meses: item.validadePadraoMeses,
        norma_referencia: item.normaReferencia || null,
        descricao_norma: item.descricaoNorma || null,
      }))
    }

    // Mescla garantindo que todos os 8 tipos estejam presentes e com a descrição/norma
    return TIPOS_EXAME_CATALOGO.map((cat) => {
      const encontrado = data.find((d: any) => d.tipo_exame === cat.tipo)
      if (encontrado) {
        return {
          id: encontrado.id,
          empresa_id: encontrado.empresa_id,
          tipo_exame: encontrado.tipo_exame as TipoExame,
          nome_exame: encontrado.nome_exame || cat.nome,
          validade_padrao_meses:
            Number(encontrado.validade_padrao_meses) || cat.validadePadraoMeses,
          norma_referencia:
            encontrado.norma_referencia || cat.normaReferencia || null,
          descricao_norma:
            encontrado.descricao_norma || cat.descricaoNorma || null,
          created_at: encontrado.created_at,
          updated_at: encontrado.updated_at,
        }
      }
      return {
        empresa_id: empresaId,
        tipo_exame: cat.tipo,
        nome_exame: cat.nome,
        validade_padrao_meses: cat.validadePadraoMeses,
        norma_referencia: cat.normaReferencia || null,
        descricao_norma: cat.descricaoNorma || null,
      }
    })
  },

  // 1.2 Salvar / atualizar prazos de validade para a empresa ativa
  async salvarPrazosEmpresa(
    empresaId: string,
    prazos: Array<{
      tipo_exame: TipoExame
      validade_padrao_meses: number
      norma_referencia?: string | null
      descricao_norma?: string | null
    }>,
  ): Promise<void> {
    if (!empresaId || !prazos || prazos.length === 0) return

    const rows = prazos.map((p) => {
      const def = TIPOS_EXAME_CATALOGO.find((c) => c.tipo === p.tipo_exame)
      return {
        empresa_id: empresaId,
        tipo_exame: p.tipo_exame,
        nome_exame: def?.nome || p.tipo_exame,
        validade_padrao_meses: Math.max(
          1,
          Math.round(Number(p.validade_padrao_meses) || 12),
        ),
        norma_referencia: p.norma_referencia ?? def?.normaReferencia ?? null,
        descricao_norma: p.descricao_norma ?? def?.descricaoNorma ?? null,
        updated_at: new Date().toISOString(),
      }
    })

    const { error } = await (supabase as any)
      .from('prazos_exame_por_empresa')
      .upsert(rows, { onConflict: 'empresa_id,tipo_exame' })

    if (error) throw error
  },

  // 1.3 Restaurar prazos da empresa aos valores oficiais do Ministério do Trabalho / CLT
  async restaurarPrazosPadroesNormativos(empresaId: string): Promise<void> {
    if (!empresaId) return
    const defaults = TIPOS_EXAME_CATALOGO.map((cat) => ({
      empresa_id: empresaId,
      tipo_exame: cat.tipo,
      nome_exame: cat.nome,
      validade_padrao_meses: cat.validadePadraoMeses,
      norma_referencia: cat.normaReferencia || null,
      descricao_norma: cat.descricaoNorma || null,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await (supabase as any)
      .from('prazos_exame_por_empresa')
      .upsert(defaults, { onConflict: 'empresa_id,tipo_exame' })

    if (error) throw error
  },

  // 1.4 Listar funcionários com exames da empresa ativa (aplicando prazos da empresa como fallback)
  async getFuncionariosComExames(
    empresaId?: string,
    prazosPreCarregados?: Record<TipoExame, number>,
  ): Promise<FuncionarioComExames[]> {
    let queryFunc = (supabase as any)
      .from('funcionarios')
      .select('*')
      .order('nome', { ascending: true })

    if (empresaId) {
      queryFunc = queryFunc.eq('empresa_id', empresaId)
    }

    const { data: funcs, error: funcErr } = await queryFunc
    if (funcErr) throw funcErr
    if (!funcs || funcs.length === 0) return []

    const funcionarioIds = funcs.map((f: any) => f.id)

    // Buscar exames de todos esses funcionários e os prazos configurados em paralelo
    const [examesResult, prazosEmpresa] = await Promise.all([
      (supabase as any)
        .from('exames_funcionario')
        .select('*')
        .in('funcionario_id', funcionarioIds),
      prazosPreCarregados
        ? Promise.resolve(prazosPreCarregados)
        : this.getPrazosEmpresa(empresaId),
    ])

    if (examesResult.error) throw examesResult.error
    const exames = examesResult.data || []

    const examesPorFuncionario = new Map<string, ExameFuncionario[]>()
    exames.forEach((e: ExameFuncionario) => {
      const lista = examesPorFuncionario.get(e.funcionario_id) || []
      lista.push(e)
      examesPorFuncionario.set(e.funcionario_id, lista)
    })

    return funcs.map((f: Funcionario) => {
      const regs = examesPorFuncionario.get(f.id) || []
      return processarFuncionarioComExames(f, regs, prazosEmpresa)
    })
  },

  // 2. Resumo consolidado de exames para o Dashboard e alertas
  async getResumoExames(empresaId?: string): Promise<ResumoExamesEmpresa> {
    const lista = await this.getFuncionariosComExames(empresaId)
    const ativos = lista.filter((f) => f.ativo)

    let totalVencidos = 0
    let totalVencendo30Dias = 0
    let totalNoPrazo = 0
    let totalPendentes = 0

    const funcionariosComVencimento: FuncionarioComExames[] = []

    ativos.forEach((f) => {
      totalVencidos += f.totalVencidos
      totalVencendo30Dias += f.examesAVencer30Dias.length
      totalNoPrazo += f.totalNoPrazo
      totalPendentes += f.totalPendentes

      if (f.totalVencidos > 0 || f.examesAVencer30Dias.length > 0) {
        funcionariosComVencimento.push(f)
      }
    })

    return {
      totalFuncionarios: lista.length,
      totalFuncionariosAtivos: ativos.length,
      totalVencidos,
      totalVencendo30Dias,
      totalNoPrazo,
      totalPendentes,
      funcionariosComVencimento,
    }
  },

  // 3. Salvar (criar ou atualizar) funcionário
  async salvarFuncionario(payload: {
    id?: string
    empresa_id: string
    nome: string
    funcao: string
    cpf?: string | null
    data_admissao?: string | null
    ativo?: boolean
    observacoes?: string | null
  }): Promise<Funcionario> {
    const dados = {
      empresa_id: payload.empresa_id,
      nome: payload.nome.trim(),
      funcao: payload.funcao.trim() || 'Geral',
      cpf: payload.cpf?.trim() || null,
      data_admissao: payload.data_admissao || null,
      ativo: payload.ativo ?? true,
      observacoes: payload.observacoes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (payload.id) {
      const { data, error } = await (supabase as any)
        .from('funcionarios')
        .update(dados)
        .eq('id', payload.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from('funcionarios')
        .insert(dados)
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  // 4. Salvar ou atualizar exame específico de um funcionário
  async salvarExameFuncionario(payload: {
    empresa_id: string
    funcionario_id: string
    tipo_exame: TipoExame
    nome_exame?: string
    data_realizacao: string | null
    validade_meses?: number
    observacao?: string | null
  }): Promise<ExameFuncionario> {
    const tipoDef = TIPOS_EXAME_CATALOGO.find(
      (t) => t.tipo === payload.tipo_exame,
    )
    const nomeExame = payload.nome_exame || tipoDef?.nome || payload.tipo_exame
    const validadeMeses =
      payload.validade_meses !== undefined
        ? payload.validade_meses
        : tipoDef?.validadePadraoMeses || 12

    const dados = {
      empresa_id: payload.empresa_id,
      funcionario_id: payload.funcionario_id,
      tipo_exame: payload.tipo_exame,
      nome_exame: nomeExame,
      data_realizacao: payload.data_realizacao || null,
      validade_meses: validadeMeses,
      observacao: payload.observacao?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await (supabase as any)
      .from('exames_funcionario')
      .upsert(dados, { onConflict: 'funcionario_id,tipo_exame' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 5. Salvar múltiplos exames de um funcionário de uma só vez (usado na edição completa e importação)
  async salvarMultiplosExames(
    empresaId: string,
    funcionarioId: string,
    exames: Array<{
      tipo_exame: TipoExame
      nome_exame?: string
      data_realizacao: string | null
      validade_meses?: number
      observacao?: string | null
    }>,
  ): Promise<void> {
    if (!exames || exames.length === 0) return

    const rows = exames.map((e) => {
      const def = TIPOS_EXAME_CATALOGO.find((t) => t.tipo === e.tipo_exame)
      return {
        empresa_id: empresaId,
        funcionario_id: funcionarioId,
        tipo_exame: e.tipo_exame,
        nome_exame: e.nome_exame || def?.nome || e.tipo_exame,
        data_realizacao: e.data_realizacao || null,
        validade_meses:
          e.validade_meses !== undefined
            ? e.validade_meses
            : def?.validadePadraoMeses || 12,
        observacao: e.observacao?.trim() || null,
        updated_at: new Date().toISOString(),
      }
    })

    const { error } = await (supabase as any)
      .from('exames_funcionario')
      .upsert(rows, { onConflict: 'funcionario_id,tipo_exame' })

    if (error) throw error
  },

  // 6. Excluir funcionário (cascateia os exames automaticamente no banco)
  async excluirFuncionario(id: string, empresaId?: string): Promise<void> {
    let query = (supabase as any).from('funcionarios').delete().eq('id', id)
    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }
    const { error } = await query
    if (error) throw error
  },
}
