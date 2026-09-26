import { supabase } from '@/lib/supabase/client'
import type {
  Material,
  Traco,
  Motorista,
  Veiculo,
  Cidade,
  Carga,
  MovimentacaoEstoque,
} from '@/types/concreteira'

export const ConcreteiraService = {
  // Materiais e Estoque
  async getMateriais(empresaId?: string): Promise<Material[]> {
    let queryMat = (supabase as any)
      .from('materiais')
      .select('*')
      .order('ordem', { ascending: true })

    if (empresaId) {
      queryMat = queryMat.eq('empresa_id', empresaId)
    }

    const { data: materiais, error: matErr } = await queryMat
    if (matErr) throw matErr

    let queryMov = (supabase as any)
      .from('movimentacoes_estoque')
      .select('material_id, tipo, quantidade')

    if (empresaId) {
      queryMov = queryMov.eq('empresa_id', empresaId)
    }

    const { data: movs, error: movErr } = await queryMov

    if (movErr) throw movErr

    const saldos: Record<string, number> = {}
    movs?.forEach((m: any) => {
      const qtd = Number(m.quantidade) || 0
      if (!saldos[m.material_id]) saldos[m.material_id] = 0
      if (m.tipo === 'ENTRADA' || m.tipo === 'ABERTURA') {
        saldos[m.material_id] += qtd
      } else {
        saldos[m.material_id] -= qtd
      }
    })

    return (materiais || []).map((mat: any) => ({
      ...mat,
      estoque_minimo: Number(mat.estoque_minimo) || 0,
      saldo: Number((saldos[mat.id] || 0).toFixed(2)),
    }))
  },

  async updateMaterialEstoqueMinimo(id: string, estoque_minimo: number) {
    const { data, error } = await (supabase as any)
      .from('materiais')
      .update({ estoque_minimo })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMovimentacoes(
    materialId?: string,
    empresaId?: string,
  ): Promise<MovimentacaoEstoque[]> {
    let query = (supabase as any)
      .from('movimentacoes_estoque')
      .select('*, material:materiais(*)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    if (materialId && materialId !== 'ALL') {
      query = query.eq('material_id', materialId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async registrarEntradaEstoque(payload: {
    empresa_id?: string
    material_id: string
    quantidade: number
    data: string
    documento?: string
    observacao?: string
  }) {
    const { data, error } = await (supabase as any)
      .from('movimentacoes_estoque')
      .insert({
        empresa_id: payload.empresa_id || null,
        material_id: payload.material_id,
        tipo: 'ENTRADA',
        quantidade: payload.quantidade,
        data: payload.data,
        documento: payload.documento || 'NOTA-REPOSICAO',
        observacao: payload.observacao || 'Reposição de estoque',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Traços
  async getTracos(empresaId?: string): Promise<Traco[]> {
    let query = (supabase as any)
      .from('tracos')
      .select('*')
      .order('nome', { ascending: true })

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarTraco(traco: Partial<Traco>, empresaId?: string) {
    if (traco.id) {
      const { data, error } = await (supabase as any)
        .from('tracos')
        .update({
          nome: traco.nome,
          descricao: traco.descricao,
          fck_mpa: traco.fck_mpa,
          consumo_brita12: traco.consumo_brita12,
          consumo_brita19: traco.consumo_brita19,
          consumo_areia: traco.consumo_areia,
          consumo_po_pedra: traco.consumo_po_pedra,
          consumo_cimento: traco.consumo_cimento,
          consumo_aditivo: traco.consumo_aditivo,
          ativo: traco.ativo ?? true,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq('id', traco.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from('tracos')
        .insert({
          empresa_id: empresaId || traco.empresa_id || null,
          nome: traco.nome,
          descricao: traco.descricao,
          fck_mpa: traco.fck_mpa,
          consumo_brita12: traco.consumo_brita12 || 0,
          consumo_brita19: traco.consumo_brita19 || 0,
          consumo_areia: traco.consumo_areia || 0,
          consumo_po_pedra: traco.consumo_po_pedra || 0,
          consumo_cimento: traco.consumo_cimento || 0,
          consumo_aditivo: traco.consumo_aditivo || 0,
          ativo: traco.ativo ?? true,
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  // Cadastros
  async getMotoristas(empresaId?: string): Promise<Motorista[]> {
    let query = (supabase as any).from('motoristas').select('*').order('nome')

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarMotorista(
    nome: string,
    ativo = true,
    id?: string,
    empresaId?: string,
  ) {
    if (id) {
      const { data, error } = await (supabase as any)
        .from('motoristas')
        .update({
          nome,
          ativo,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await (supabase as any)
      .from('motoristas')
      .insert({ nome, ativo, empresa_id: empresaId || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getVeiculos(empresaId?: string): Promise<Veiculo[]> {
    let query = (supabase as any).from('veiculos').select('*').order('placa')

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarVeiculo(
    placa: string,
    modelo?: string,
    ativo = true,
    id?: string,
    empresaId?: string,
  ) {
    if (id) {
      const { data, error } = await (supabase as any)
        .from('veiculos')
        .update({
          placa,
          modelo,
          ativo,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await (supabase as any)
      .from('veiculos')
      .insert({ placa, modelo, ativo, empresa_id: empresaId || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getCidades(empresaId?: string): Promise<Cidade[]> {
    let query = (supabase as any).from('cidades').select('*').order('nome')

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarCidade(nome: string, uf = 'PB', id?: string, empresaId?: string) {
    if (id) {
      const { data, error } = await (supabase as any)
        .from('cidades')
        .update({ nome, uf, ...(empresaId ? { empresa_id: empresaId } : {}) })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await (supabase as any)
      .from('cidades')
      .insert({ nome, uf, empresa_id: empresaId || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Cargas
  async getCargas(filtros?: {
    empresaId?: string
    dataInicio?: string
    dataFim?: string
    cidade?: string
    motorista?: string
    veiculo?: string
    apenasZeradas?: boolean
  }): Promise<Carga[]> {
    let query = (supabase as any)
      .from('cargas')
      .select('*')
      .order('data', { ascending: false })
      .order('numero_carga', { ascending: false })

    if (filtros?.empresaId) query = query.eq('empresa_id', filtros.empresaId)
    if (filtros?.dataInicio) query = query.gte('data', filtros.dataInicio)
    if (filtros?.dataFim) query = query.lte('data', filtros.dataFim)
    if (filtros?.cidade && filtros.cidade !== 'ALL')
      query = query.eq('cidade_nome', filtros.cidade)
    if (filtros?.motorista && filtros.motorista !== 'ALL')
      query = query.eq('motorista_nome', filtros.motorista)
    if (filtros?.veiculo && filtros.veiculo !== 'ALL')
      query = query.eq('veiculo_placa', filtros.veiculo)
    if (filtros?.apenasZeradas) query = query.eq('carga_zerada', true)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getProximoNumeroCarga(empresaId?: string): Promise<number> {
    let query = (supabase as any)
      .from('cargas')
      .select('numero_carga')
      .order('numero_carga', { ascending: false })
      .limit(1)

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erro ao buscar próximo número de carga:', error)
      return 1
    }
    if (data && data.length > 0 && data[0].numero_carga) {
      return Number(data[0].numero_carga) + 1
    }
    return 1
  },

  async criarCarga(payload: {
    empresa_id?: string
    data: string
    volume_m3: number
    traco_id?: string
    traco_nome?: string
    motorista_nome?: string
    veiculo_placa?: string
    cidade_nome?: string
    consumo_brita12: number
    consumo_brita19: number
    consumo_areia: number
    consumo_po_pedra: number
    consumo_cimento: number
    consumo_aditivo: number
    observacao?: string
    carga_zerada?: boolean
  }) {
    // 0. Calcular próximo número de carga para a empresa
    const proximoNum = await this.getProximoNumeroCarga(payload.empresa_id)

    // 1. Inserir carga
    const { data: carga, error: cargaErr } = await (supabase as any)
      .from('cargas')
      .insert({
        empresa_id: payload.empresa_id || null,
        numero_carga: proximoNum,
        data: payload.data,
        volume_m3: payload.volume_m3,
        traco_id: payload.traco_id || null,
        traco_nome: payload.traco_nome || null,
        motorista_nome: payload.motorista_nome || null,
        veiculo_placa: payload.veiculo_placa || null,
        cidade_nome: payload.cidade_nome || null,
        consumo_brita12: payload.consumo_brita12,
        consumo_brita19: payload.consumo_brita19,
        consumo_areia: payload.consumo_areia,
        consumo_po_pedra: payload.consumo_po_pedra,
        consumo_cimento: payload.consumo_cimento,
        consumo_aditivo: payload.consumo_aditivo,
        observacao: payload.observacao || null,
        carga_zerada: payload.carga_zerada || false,
      })
      .select()
      .single()

    if (cargaErr) throw cargaErr

    // 2. Se não for zerada, gerar saídas de estoque
    if (!payload.carga_zerada) {
      const materiais = await this.getMateriais(payload.empresa_id)
      const matMap = new Map(materiais.map((m) => [m.codigo, m.id]))
      const saídas: any[] = []

      const docName = `CARGA-${String(carga.numero_carga).padStart(5, '0')}`

      if (payload.consumo_cimento > 0 && matMap.get('cimento')) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matMap.get('cimento'),
          tipo: 'SAIDA',
          quantidade: payload.consumo_cimento,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }
      if (payload.consumo_aditivo > 0 && matMap.get('aditivo')) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matMap.get('aditivo'),
          tipo: 'SAIDA',
          quantidade: payload.consumo_aditivo,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }
      if (payload.consumo_areia > 0 && matMap.get('areia')) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matMap.get('areia'),
          tipo: 'SAIDA',
          quantidade: payload.consumo_areia,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }
      if (payload.consumo_brita12 > 0 && matMap.get('brita12')) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matMap.get('brita12'),
          tipo: 'SAIDA',
          quantidade: payload.consumo_brita12,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }
      if (payload.consumo_brita19 > 0 && matMap.get('brita19')) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matMap.get('brita19'),
          tipo: 'SAIDA',
          quantidade: payload.consumo_brita19,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }
      if (payload.consumo_po_pedra > 0 && matMap.get('po_pedra')) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matMap.get('po_pedra'),
          tipo: 'SAIDA',
          quantidade: payload.consumo_po_pedra,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }

      if (saídas.length > 0) {
        await (supabase as any).from('movimentacoes_estoque').insert(saídas)
      }
    }

    return carga
  },

  // Custos / Preços Unitários
  async getPrecosMaterial(empresaId?: string): Promise<any[]> {
    let query = (supabase as any)
      .from('precos_material')
      .select('*')
      .order('mes_ano', { ascending: true })

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },
}
