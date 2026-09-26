import { supabase } from '@/lib/supabase/client'
import type {
  Material,
  Traco,
  Motorista,
  Veiculo,
  Cidade,
  Carga,
  MovimentacaoEstoque,
  PrecoMaterial,
  CustoBreakdown,
  ComparativoUnidade,
  Cliente,
  OrdemServico,
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
      controla_estoque:
        mat.controla_estoque ??
        (mat.codigo === 'cimento' || mat.codigo === 'aditivo'),
      estoque_minimo: Number(mat.estoque_minimo) || 0,
      densidade: mat.densidade != null ? Number(mat.densidade) : undefined,
      unidade_compra: mat.unidade_compra ?? 'kg',
      preco_compra:
        mat.preco_compra != null ? Number(mat.preco_compra) : undefined,
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

  // Atualiza densidade, unidade de compra e preço de compra do material
  async updateMaterialCompra(
    id: string,
    dados: {
      densidade?: number
      unidade_compra?: string
      preco_compra?: number
    },
  ) {
    const update: Record<string, any> = {}
    if (dados.densidade !== undefined) update.densidade = dados.densidade
    if (dados.unidade_compra !== undefined)
      update.unidade_compra = dados.unidade_compra
    if (dados.preco_compra !== undefined)
      update.preco_compra = dados.preco_compra

    if (Object.keys(update).length === 0) return null

    const { data, error } = await (supabase as any)
      .from('materiais')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // =========================================================
  // Conversão de unidades de compra → custo por kg
  // compra em kg       → custo/kg = preço
  // compra em tonelada → custo/kg = preço / 1.000
  // compra em m³       → custo/kg = preço / (densidade × 1.000)
  // 1 m³ = densidade t = densidade × 1.000 kg
  // =========================================================
  converterCustoPorKg(
    precoCompra: number,
    unidadeCompra: string,
    densidade?: number,
  ): number {
    const preco = Number(precoCompra) || 0
    const unidade = (unidadeCompra || 'kg').toLowerCase()

    if (unidade === 'kg') return preco
    if (unidade === 'tonelada' || unidade === 'toneladas' || unidade === 't')
      return preco / 1000
    if (unidade === 'm3' || unidade === 'm³') {
      const d = Number(densidade) || 0
      if (d <= 0) return 0
      return preco / (d * 1000)
    }
    return preco
  },

  // =========================================================
  // Conversão de unidades de compra para aditivo → custo por LITRO
  // compra em litros   → custo/L = preço
  // compra em kg       → custo/L = preço × densidade (se densidade > 0; senão densidade 1.0 = preço)
  // compra em tonelada → custo/L = (preço / 1.000) × (densidade × 1.000) = preço × densidade
  // compra em m³       → custo/L = preço / 1.000
  // =========================================================
  converterCustoAditivoPorLitro(
    precoCompra: number,
    unidadeCompra: string,
    densidade?: number,
  ): number {
    const preco = Number(precoCompra) || 0
    const unidade = (unidadeCompra || 'litros').toLowerCase()
    const d = Number(densidade) > 0 ? Number(densidade) : 1.0

    if (
      unidade === 'litros' ||
      unidade === 'l' ||
      unidade === 'lt' ||
      unidade === 'lts'
    ) {
      return preco
    }
    if (unidade === 'kg') {
      // 1 L tem peso de 'd' kg (ex: d = 1,05 kg/L => 1L = 1,05kg => custo/L = preco/kg * 1,05)
      // Se d = 1.0, 1kg = 1L => custo/L = preco
      return preco * d
    }
    if (unidade === 'tonelada' || unidade === 'toneladas' || unidade === 't') {
      // preco por tonelada (1000kg) => preco/kg = preco / 1000 => custo/L = (preco / 1000) * d
      return (preco / 1000) * d
    }
    if (unidade === 'm3' || unidade === 'm³') {
      // 1 m³ = 1.000 litros
      return preco / 1000
    }
    return preco
  },

  // Quantidade de kg equivalente a 1 unidade de compra (ex.: 1 m³ de brita 12 = 1.380 kg)
  kgPorUnidadeCompra(unidadeCompra: string, densidade?: number): number {
    const unidade = (unidadeCompra || 'kg').toLowerCase()
    if (unidade === 'kg') return 1
    if (unidade === 'tonelada' || unidade === 'toneladas' || unidade === 't')
      return 1000
    if (unidade === 'm3' || unidade === 'm³')
      return (Number(densidade) || 0) * 1000
    return 1
  },

  async getMovimentacoes(
    materialId?: string,
    empresaId?: string,
    apenasControlados = true,
  ): Promise<MovimentacaoEstoque[]> {
    let query = (supabase as any)
      .from('movimentacoes_estoque')
      .select('*, material:materiais(*)')
      .order('created_at', { ascending: false })
      .limit(300)

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    if (materialId && materialId !== 'ALL') {
      query = query.eq('material_id', materialId)
    }

    const { data, error } = await query
    if (error) throw error
    let result = (data || []) as MovimentacaoEstoque[]

    // Se apenasControlados for true, filtra movimentações para materiais de estoque controlado (cimento e aditivo)
    if (apenasControlados && (!materialId || materialId === 'ALL')) {
      result = result.filter((m) => {
        const mat = m.material
        if (!mat) return true
        if (mat.controla_estoque !== undefined) return mat.controla_estoque
        return mat.codigo === 'cimento' || mat.codigo === 'aditivo'
      })
    }

    return result
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

  // Cargas com cálculo de custo dos insumos embutido
  async getCargas(filtros?: {
    empresaId?: string
    dataInicio?: string
    dataFim?: string
    cidade?: string
    motorista?: string
    veiculo?: string
    material?: string
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

    let cargas = (data || []) as Carga[]

    // Filtro adicional por material: apenas cargas que consumiram aquele material (> 0)
    if (filtros?.material && filtros.material !== 'ALL') {
      const matKey = filtros.material
      cargas = cargas.filter((c) => {
        if (matKey === 'cimento') return Number(c.consumo_cimento) > 0
        if (matKey === 'aditivo') return Number(c.consumo_aditivo) > 0
        if (matKey === 'areia') return Number(c.consumo_areia) > 0
        if (matKey === 'brita12') return Number(c.consumo_brita12) > 0
        if (matKey === 'brita19') return Number(c.consumo_brita19) > 0
        if (matKey === 'po_pedra') return Number(c.consumo_po_pedra) > 0
        return true
      })
    }

    // Buscar tabela de preços e também ordens de serviço vinculadas a essas cargas
    const [precos, ordensServico] = await Promise.all([
      this.getPrecosMaterial(filtros?.empresaId),
      (supabase as any)
        .from('ordens_servico')
        .select('*')
        .not('carga_id', 'is', null)
        .then(({ data }: any) => (data || []) as OrdemServico[]),
    ])

    const ordensPorCargaId = new Map<string, OrdemServico>()
    ordensServico.forEach((os) => {
      if (os.carga_id) {
        ordensPorCargaId.set(os.carga_id, os)
      }
    })

    return cargas.map((c) => {
      const custo = this.calcularCustoCarga(c, precos)
      const osVinculada = ordensPorCargaId.get(c.id) || null
      return {
        ...c,
        custo,
        ordem_servico: osVinculada,
        numero_os: osVinculada ? osVinculada.numero_os : null,
        ordem_servico_id: osVinculada ? osVinculada.id : null,
      }
    })
  },

  // Resolver o preço unitário aplicável a um material em uma data
  getPrecoUnitarioParaData(
    materialCodigo: string,
    dataStr: string,
    precos: PrecoMaterial[],
  ): number {
    if (!precos || precos.length === 0) return 0

    // Filtra preços para o material
    const precosMat = precos.filter((p) => p.material_codigo === materialCodigo)
    if (precosMat.length === 0) return 0

    // Extrair ano-mes da carga: '2026-09-15' -> '09/2026'
    const [ano, mes] = dataStr ? dataStr.slice(0, 7).split('-') : ['', '']
    const mesAnoCarga = `${mes}/${ano}`

    // 1. Tentar encontrar preço exato do mês da carga
    const precoExato = precosMat.find((p) => p.mes_ano === mesAnoCarga)
    if (precoExato) return Number(precoExato.preco_unitario) || 0

    // 2. Se não houver, pegar o mais recente anterior à data da carga
    // Converte mes_ano 'MM/YYYY' para YYYY-MM para comparação cronológica
    const parseMesAno = (ma: string) => {
      const [m, y] = ma.split('/')
      return `${y}-${m}`
    }
    const targetYm = `${ano}-${mes}`

    const anteriores = precosMat
      .filter((p) => parseMesAno(p.mes_ano) <= targetYm)
      .sort((a, b) =>
        parseMesAno(b.mes_ano).localeCompare(parseMesAno(a.mes_ano)),
      )

    if (anteriores.length > 0) {
      return Number(anteriores[0].preco_unitario) || 0
    }

    // 3. Fallback: qualquer preço disponível ordenado pelo mais recente
    const ordenados = [...precosMat].sort((a, b) =>
      parseMesAno(b.mes_ano).localeCompare(parseMesAno(a.mes_ano)),
    )
    return Number(ordenados[0]?.preco_unitario) || 0
  },

  // Calcula o custo total e breakdown de uma carga
  calcularCustoCarga(carga: Carga, precos: PrecoMaterial[]): CustoBreakdown {
    if (carga.carga_zerada) {
      return {
        cimento: 0,
        aditivo: 0,
        areia: 0,
        brita12: 0,
        brita19: 0,
        po_pedra: 0,
        agua: 0,
        total: 0,
        custoPorM3: 0,
      }
    }

    const pCimento = this.getPrecoUnitarioParaData(
      'cimento',
      carga.data,
      precos,
    )
    const pAditivo = this.getPrecoUnitarioParaData(
      'aditivo',
      carga.data,
      precos,
    )
    const pAreia = this.getPrecoUnitarioParaData('areia', carga.data, precos)
    const pBrita12 = this.getPrecoUnitarioParaData(
      'brita12',
      carga.data,
      precos,
    )
    const pBrita19 = this.getPrecoUnitarioParaData(
      'brita19',
      carga.data,
      precos,
    )
    const pPoPedra = this.getPrecoUnitarioParaData(
      'po_pedra',
      carga.data,
      precos,
    )
    const pAgua = this.getPrecoUnitarioParaData('agua', carga.data, precos)

    const cCimento = Number(carga.consumo_cimento || 0) * pCimento
    const cAditivo = Number(carga.consumo_aditivo || 0) * pAditivo
    const cAreia = Number(carga.consumo_areia || 0) * pAreia
    const cBrita12 = Number(carga.consumo_brita12 || 0) * pBrita12
    const cBrita19 = Number(carga.consumo_brita19 || 0) * pBrita19
    const cPoPedra = Number(carga.consumo_po_pedra || 0) * pPoPedra
    const cAgua = Number(carga.consumo_agua || 0) * pAgua

    const total =
      cCimento + cAditivo + cAreia + cBrita12 + cBrita19 + cPoPedra + cAgua
    const vol = Number(carga.volume_m3) || 0
    const custoPorM3 = vol > 0 ? total / vol : 0

    return {
      cimento: Number(cCimento.toFixed(2)),
      aditivo: Number(cAditivo.toFixed(2)),
      areia: Number(cAreia.toFixed(2)),
      brita12: Number(cBrita12.toFixed(2)),
      brita19: Number(cBrita19.toFixed(2)),
      po_pedra: Number(cPoPedra.toFixed(2)),
      agua: Number(cAgua.toFixed(2)),
      total: Number(total.toFixed(2)),
      custoPorM3: Number(custoPorM3.toFixed(2)),
    }
  },

  // Calcula custo teórico por m³ de um traço padrão
  calcularCustoTracoM3(
    traco: Traco,
    precos: PrecoMaterial[],
  ): {
    totalPorM3: number
    detalhes: Record<string, number>
  } {
    const hoje = new Date().toISOString().split('T')[0]
    const pCimento = this.getPrecoUnitarioParaData('cimento', hoje, precos)
    const pAditivo = this.getPrecoUnitarioParaData('aditivo', hoje, precos)
    const pAreia = this.getPrecoUnitarioParaData('areia', hoje, precos)
    const pBrita12 = this.getPrecoUnitarioParaData('brita12', hoje, precos)
    const pBrita19 = this.getPrecoUnitarioParaData('brita19', hoje, precos)
    const pPoPedra = this.getPrecoUnitarioParaData('po_pedra', hoje, precos)
    const pAgua = this.getPrecoUnitarioParaData('agua', hoje, precos)

    const cCimento = Number(traco.consumo_cimento || 0) * pCimento
    const cAditivo = Number(traco.consumo_aditivo || 0) * pAditivo
    const cAreia = Number(traco.consumo_areia || 0) * pAreia
    const cBrita12 = Number(traco.consumo_brita12 || 0) * pBrita12
    const cBrita19 = Number(traco.consumo_brita19 || 0) * pBrita19
    const cPoPedra = Number(traco.consumo_po_pedra || 0) * pPoPedra
    const cAgua = Number(traco.consumo_agua || 0) * pAgua

    const total =
      cCimento + cAditivo + cAreia + cBrita12 + cBrita19 + cPoPedra + cAgua

    return {
      totalPorM3: Number(total.toFixed(2)),
      detalhes: {
        cimento: Number(cCimento.toFixed(2)),
        aditivo: Number(cAditivo.toFixed(2)),
        areia: Number(cAreia.toFixed(2)),
        brita12: Number(cBrita12.toFixed(2)),
        brita19: Number(cBrita19.toFixed(2)),
        po_pedra: Number(cPoPedra.toFixed(2)),
        agua: Number(cAgua.toFixed(2)),
      },
    }
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
    consumo_agua?: number
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
        consumo_agua: payload.consumo_agua || 0,
        observacao: payload.observacao || null,
        carga_zerada: payload.carga_zerada || false,
      })
      .select()
      .single()

    if (cargaErr) throw cargaErr

    // 2. Se não for zerada, gerar saídas de estoque SOMENTE para materiais com controla_estoque === true (cimento e aditivo)
    if (!payload.carga_zerada) {
      const materiais = await this.getMateriais(payload.empresa_id)
      const docName = `CARGA-${String(carga.numero_carga).padStart(5, '0')}`
      const saídas: any[] = []

      // Materiais controlados: cimento e aditivo
      const matCimento = materiais.find(
        (m) => m.codigo === 'cimento' && m.controla_estoque !== false,
      )
      const matAditivo = materiais.find(
        (m) => m.codigo === 'aditivo' && m.controla_estoque !== false,
      )

      if (payload.consumo_cimento > 0 && matCimento) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matCimento.id,
          tipo: 'SAIDA',
          quantidade: payload.consumo_cimento,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }
      if (payload.consumo_aditivo > 0 && matAditivo) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matAditivo.id,
          tipo: 'SAIDA',
          quantidade: payload.consumo_aditivo,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: `Consumo na carga de ${payload.volume_m3}m³`,
        })
      }

      // IMPORTANTE: Britas, Areia e Pó de Pedra NÃO geram movimentação de saída de estoque!

      if (saídas.length > 0) {
        await (supabase as any).from('movimentacoes_estoque').insert(saídas)
      }
    }

    return carga
  },

  // Salva a carga e gera automaticamente a Ordem de Serviço sequencial (SJE seguindo 4337+, etc.)
  async criarCargaComOS(payload: {
    carga: {
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
      consumo_agua?: number
      observacao?: string
      carga_zerada?: boolean
    }
    entrega: {
      cliente_id?: string | null
      destinatario_nome: string
      destinatario_cpf_cnpj?: string | null
      destinatario_telefone?: string | null
      destinatario_endereco?: string | null
      destinatario_bairro?: string | null
      destinatario_cidade?: string | null
      destinatario_uf?: string | null
      destinatario_cep?: string | null
      nome_obra?: string | null
      local_descarga?: string | null
      discriminacao_produto?: string | null
      slump_central_medido?: string | null
      slump_central_saida?: string | null
      slump_tolerancia?: string | null
      slump_peca_medido?: string | null
      slump_peca_saida?: string | null
      lacre?: string | null
      km_inicial?: number | null
      km_final?: number | null
      hora_carga?: string | null
      hora_saida_central?: string | null
      hora_chegada_obra?: string | null
      hora_inicio_descarga?: string | null
      hora_fim_descarga?: string | null
      hora_saida_obra?: string | null
      hora_chegada_central?: string | null
      visto_obra?: string | null
      visto_motorista_central?: string | null
      peca_concretada?: string | null
      moldagem_central?: string | null
      observacoes?: string | null
      exibir_insumos_os?: boolean
    }
  }): Promise<{ carga: Carga; ordemServico: OrdemServico }> {
    const empresaId = payload.carga.empresa_id!
    // 1. Criar a Carga
    const carga = await this.criarCarga(payload.carga)

    // 2. Obter próximo número sequencial da OS para a empresa
    const proximoNumOS = await this.getProximoNumeroOS(empresaId)

    // 3. Montar itens da OS (discriminando o traço e volume)
    const discriminacao =
      payload.entrega.discriminacao_produto ||
      payload.carga.traco_nome ||
      'CONCRETO USINADO'

    const itens = [
      {
        quantidade: Number(payload.carga.volume_m3) || 8.0,
        unidade: 'm3',
        discriminacao,
      },
    ]

    // 4. Montar detalhamento dos insumos da carga
    const insumosDetalhados: Array<{
      material: string
      quantidade: number
      unidade: string
    }> = [
      {
        material: 'Cimento',
        quantidade: payload.carga.consumo_cimento,
        unidade: 'kg',
      },
      {
        material: 'Aditivo',
        quantidade: payload.carga.consumo_aditivo,
        unidade: 'L',
      },
      {
        material: 'Água',
        quantidade: payload.carga.consumo_agua || 0,
        unidade: 'L',
      },
      {
        material: 'Areia',
        quantidade: payload.carga.consumo_areia,
        unidade: 'kg',
      },
      {
        material: 'Brita 12',
        quantidade: payload.carga.consumo_brita12,
        unidade: 'kg',
      },
      {
        material: 'Brita 19',
        quantidade: payload.carga.consumo_brita19,
        unidade: 'kg',
      },
      {
        material: 'Pó de Pedra',
        quantidade: payload.carga.consumo_po_pedra,
        unidade: 'kg',
      },
    ].filter((ins) => ins.quantidade > 0)

    // 5. Salvar Ordem de Serviço
    const ordemServico = await this.salvarOrdemServico(
      {
        empresa_id: empresaId,
        numero_os: proximoNumOS,
        data_emissao: payload.carga.data,
        cliente_id: payload.entrega.cliente_id || null,
        carga_id: carga.id,
        destinatario_nome:
          payload.entrega.destinatario_nome || 'CONSUMIDOR FINAL',
        destinatario_cpf_cnpj: payload.entrega.destinatario_cpf_cnpj || null,
        destinatario_telefone: payload.entrega.destinatario_telefone || null,
        destinatario_endereco: payload.entrega.destinatario_endereco || null,
        destinatario_bairro: payload.entrega.destinatario_bairro || null,
        destinatario_cidade:
          payload.entrega.destinatario_cidade ||
          payload.carga.cidade_nome ||
          null,
        destinatario_uf: payload.entrega.destinatario_uf || 'PB',
        destinatario_cep: payload.entrega.destinatario_cep || null,
        nome_obra: payload.entrega.nome_obra || null,
        local_descarga: payload.entrega.local_descarga || null,
        itens,
        exibir_insumos_os: payload.entrega.exibir_insumos_os ?? true,
        insumos_detalhados: insumosDetalhados,
        slump_central_medido: payload.entrega.slump_central_medido || null,
        slump_central_saida: payload.entrega.slump_central_saida || null,
        slump_tolerancia: payload.entrega.slump_tolerancia || '+-2',
        agua_adic_central: 0,
        moldagem_central: payload.entrega.moldagem_central || 'SIM',
        visto_motorista_central:
          payload.entrega.visto_motorista_central ||
          payload.carga.motorista_nome ||
          null,
        slump_peca_medido: payload.entrega.slump_peca_medido || null,
        slump_peca_saida: payload.entrega.slump_peca_saida || null,
        peca_concretada: payload.entrega.peca_concretada || 'PISO / ESTRUTURAL',
        veiculo_placa: payload.carga.veiculo_placa || null,
        motorista_nome: payload.carga.motorista_nome || null,
        lacre: payload.entrega.lacre || null,
        km_inicial: payload.entrega.km_inicial ?? null,
        km_final: payload.entrega.km_final ?? null,
        hora_carga:
          payload.entrega.hora_carga || new Date().toTimeString().slice(0, 5),
        hora_saida_central: payload.entrega.hora_saida_central || null,
        hora_chegada_obra: payload.entrega.hora_chegada_obra || null,
        hora_inicio_descarga: payload.entrega.hora_inicio_descarga || null,
        hora_fim_descarga: payload.entrega.hora_fim_descarga || null,
        hora_saida_obra: payload.entrega.hora_saida_obra || null,
        hora_chegada_central: payload.entrega.hora_chegada_central || null,
        visto_obra: payload.entrega.visto_obra || null,
        observacoes:
          payload.entrega.observacoes || payload.carga.observacao || null,
      },
      empresaId,
    )

    return {
      carga: {
        ...carga,
        ordem_servico: ordemServico,
        numero_os: ordemServico.numero_os,
        ordem_servico_id: ordemServico.id,
      },
      ordemServico,
    }
  },

  // Custos / Preços Unitários
  async getPrecosMaterial(empresaId?: string): Promise<PrecoMaterial[]> {
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

  // Salvar ou atualizar preço unitário
  async salvarPrecoMaterial(payload: {
    empresa_id?: string
    material_codigo: string
    mes_ano: string
    preco_unitario: number
    unidade?: string
  }) {
    const { data, error } = await (supabase as any)
      .from('precos_material')
      .upsert(
        {
          empresa_id: payload.empresa_id || null,
          material_codigo: payload.material_codigo,
          mes_ano: payload.mes_ano,
          preco_unitario: payload.preco_unitario,
          unidade: payload.unidade || 'kg',
        },
        { onConflict: 'empresa_id, material_codigo, mes_ano' },
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Relatório Comparativo Monteiro × SJE
  async getComparativoUnidades(filtros?: {
    dataInicio?: string
    dataFim?: string
  }): Promise<{
    unidades: ComparativoUnidade[]
    totaisGerais: {
      volumeTotal: number
      cargasTotal: number
      custoTotal: number
      custoPorM3: number
    }
  }> {
    // Busca todas as empresas ativas
    const { data: empresas, error: empErr } = await (supabase as any)
      .from('empresas')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (empErr) throw empErr

    // Busca todas as cargas no período sem filtrar por empresa
    let cargasQuery = (supabase as any).from('cargas').select('*')
    if (filtros?.dataInicio)
      cargasQuery = cargasQuery.gte('data', filtros.dataInicio)
    if (filtros?.dataFim) cargasQuery = cargasQuery.lte('data', filtros.dataFim)

    const { data: todasCargas, error: crgErr } = await cargasQuery
    if (crgErr) throw crgErr

    // Busca todos os preços
    const { data: todosPrecos, error: prcErr } = await (supabase as any)
      .from('precos_material')
      .select('*')
    if (prcErr) throw prcErr

    const listaCargas = (todasCargas || []) as Carga[]
    const listaPrecos = (todosPrecos || []) as PrecoMaterial[]

    const unidades: ComparativoUnidade[] = (empresas || []).map((emp: any) => {
      const cargasEmpresa = listaCargas.filter((c) => c.empresa_id === emp.id)
      const precosEmpresa = listaPrecos.filter((p) => p.empresa_id === emp.id)

      let volumeTotal = 0
      let cargasTotal = cargasEmpresa.length
      let cargasZeradas = 0
      let custoTotal = 0

      const consumos = {
        cimento: 0,
        aditivo: 0,
        areia: 0,
        brita12: 0,
        brita19: 0,
        po_pedra: 0,
        agua: 0,
      }

      const custosPorMaterial = {
        cimento: 0,
        aditivo: 0,
        areia: 0,
        brita12: 0,
        brita19: 0,
        po_pedra: 0,
        agua: 0,
      }
      const tracosMap: Record<
        string,
        {
          tracoNome: string
          volume: number
          cargas: number
          custoTotal: number
        }
      > = {}

      cargasEmpresa.forEach((c) => {
        if (c.carga_zerada) {
          cargasZeradas++
          return
        }

        const vol = Number(c.volume_m3) || 0
        volumeTotal += vol

        const cCimento = Number(c.consumo_cimento) || 0
        const cAditivo = Number(c.consumo_aditivo) || 0
        const cAreia = Number(c.consumo_areia) || 0
        const cBrita12 = Number(c.consumo_brita12) || 0
        const cBrita19 = Number(c.consumo_brita19) || 0
        const cPoPedra = Number(c.consumo_po_pedra) || 0
        const cAgua = Number(c.consumo_agua) || 0

        consumos.cimento += cCimento
        consumos.aditivo += cAditivo
        consumos.areia += cAreia
        consumos.brita12 += cBrita12
        consumos.brita19 += cBrita19
        consumos.po_pedra += cPoPedra
        consumos.agua += cAgua

        const custoBreakdown = this.calcularCustoCarga(c, precosEmpresa)
        custoTotal += custoBreakdown.total
        custosPorMaterial.cimento += custoBreakdown.cimento
        custosPorMaterial.aditivo += custoBreakdown.aditivo
        custosPorMaterial.areia += custoBreakdown.areia
        custosPorMaterial.brita12 += custoBreakdown.brita12
        custosPorMaterial.brita19 += custoBreakdown.brita19
        custosPorMaterial.po_pedra += custoBreakdown.po_pedra
        custosPorMaterial.agua += custoBreakdown.agua
        const tNome = c.traco_nome || 'Não identificado'
        if (!tracosMap[tNome]) {
          tracosMap[tNome] = {
            tracoNome: tNome,
            volume: 0,
            cargas: 0,
            custoTotal: 0,
          }
        }
        tracosMap[tNome].volume += vol
        tracosMap[tNome].cargas += 1
        tracosMap[tNome].custoTotal += custoBreakdown.total
      })

      const porTraco = Object.values(tracosMap).map((t) => ({
        ...t,
        volume: Number(t.volume.toFixed(1)),
        custoTotal: Number(t.custoTotal.toFixed(2)),
        custoPorM3:
          t.volume > 0 ? Number((t.custoTotal / t.volume).toFixed(2)) : 0,
      }))

      const custoPorM3 =
        volumeTotal > 0 ? Number((custoTotal / volumeTotal).toFixed(2)) : 0

      return {
        empresaId: emp.id,
        empresaNome: emp.nome,
        empresaSlug: emp.slug,
        volumeTotal: Number(volumeTotal.toFixed(1)),
        cargasTotal,
        cargasZeradas,
        custoTotal: Number(custoTotal.toFixed(2)),
        custoPorM3,
        consumos,
        custosPorMaterial: {
          cimento: Number(custosPorMaterial.cimento.toFixed(2)),
          aditivo: Number(custosPorMaterial.aditivo.toFixed(2)),
          areia: Number(custosPorMaterial.areia.toFixed(2)),
          brita12: Number(custosPorMaterial.brita12.toFixed(2)),
          brita19: Number(custosPorMaterial.brita19.toFixed(2)),
          po_pedra: Number(custosPorMaterial.po_pedra.toFixed(2)),
          agua: Number(custosPorMaterial.agua.toFixed(2)),
        },
        porTraco,
      }
    })

    const volGeral = unidades.reduce((a, b) => a + b.volumeTotal, 0)
    const crgGeral = unidades.reduce((a, b) => a + b.cargasTotal, 0)
    const custoGeral = unidades.reduce((a, b) => a + b.custoTotal, 0)
    const custoPorM3Geral =
      volGeral > 0 ? Number((custoGeral / volGeral).toFixed(2)) : 0

    return {
      unidades,
      totaisGerais: {
        volumeTotal: Number(volGeral.toFixed(1)),
        cargasTotal: crgGeral,
        custoTotal: Number(custoGeral.toFixed(2)),
        custoPorM3: custoPorM3Geral,
      },
    }
  },

  // =========================================================
  // Clientes
  // =========================================================
  async getClientes(empresaId?: string): Promise<Cliente[]> {
    let query = (supabase as any)
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarCliente(
    cliente: Partial<Cliente>,
    empresaId?: string,
  ): Promise<Cliente> {
    if (cliente.id) {
      const { data, error } = await (supabase as any)
        .from('clientes')
        .update({
          tipo: cliente.tipo || 'PJ',
          cpf_cnpj: cliente.cpf_cnpj,
          nome: cliente.nome,
          nome_fantasia: cliente.nome_fantasia || null,
          telefone: cliente.telefone || null,
          email: cliente.email || null,
          cep: cliente.cep || null,
          logradouro: cliente.logradouro || null,
          numero: cliente.numero || null,
          complemento: cliente.complemento || null,
          bairro: cliente.bairro || null,
          cidade: cliente.cidade || null,
          uf: cliente.uf || 'PB',
          observacoes: cliente.observacoes || null,
          ativo: cliente.ativo ?? true,
          exibir_insumos_os: cliente.exibir_insumos_os ?? true,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq('id', cliente.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from('clientes')
        .insert({
          empresa_id: empresaId || cliente.empresa_id,
          tipo: cliente.tipo || 'PJ',
          cpf_cnpj: cliente.cpf_cnpj,
          nome: cliente.nome,
          nome_fantasia: cliente.nome_fantasia || null,
          telefone: cliente.telefone || null,
          email: cliente.email || null,
          cep: cliente.cep || null,
          logradouro: cliente.logradouro || null,
          numero: cliente.numero || null,
          complemento: cliente.complemento || null,
          bairro: cliente.bairro || null,
          cidade: cliente.cidade || null,
          uf: cliente.uf || 'PB',
          observacoes: cliente.observacoes || null,
          ativo: cliente.ativo ?? true,
          exibir_insumos_os: cliente.exibir_insumos_os ?? true,
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async excluirCliente(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('clientes')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // =========================================================
  // Ordens de Serviço / Recibos
  // =========================================================
  async getOrdensServico(empresaId?: string): Promise<OrdemServico[]> {
    let query = (supabase as any)
      .from('ordens_servico')
      .select('*')
      .order('numero_os', { ascending: false })

    if (empresaId) {
      query = query.eq('empresa_id', empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getProximoNumeroOS(empresaId: string): Promise<number> {
    const { data, error } = await (supabase as any).rpc('proximo_numero_os', {
      p_empresa_id: empresaId,
    })
    if (error) {
      // Fallback em caso de erro na RPC
      const { data: ultimas } = await (supabase as any)
        .from('ordens_servico')
        .select('numero_os')
        .eq('empresa_id', empresaId)
        .order('numero_os', { ascending: false })
        .limit(1)
      const maxNum =
        ultimas && ultimas[0]?.numero_os ? Number(ultimas[0].numero_os) : 4336
      return maxNum + 1
    }
    return Number(data) || 4337
  },

  async salvarOrdemServico(
    os: Partial<OrdemServico>,
    empresaId: string,
  ): Promise<OrdemServico> {
    const payload = {
      empresa_id: empresaId,
      numero_os: os.numero_os,
      data_emissao: os.data_emissao || new Date().toISOString().split('T')[0],
      cliente_id: os.cliente_id || null,
      carga_id: os.carga_id || null,
      destinatario_nome: os.destinatario_nome,
      destinatario_cpf_cnpj: os.destinatario_cpf_cnpj || null,
      destinatario_telefone: os.destinatario_telefone || null,
      destinatario_endereco: os.destinatario_endereco || null,
      destinatario_bairro: os.destinatario_bairro || null,
      destinatario_cidade: os.destinatario_cidade || null,
      destinatario_uf: os.destinatario_uf || 'PB',
      destinatario_cep: os.destinatario_cep || null,
      nome_obra: os.nome_obra || null,
      local_descarga: os.local_descarga || null,
      itens: os.itens || [],
      exibir_insumos_os: os.exibir_insumos_os ?? true,
      insumos_detalhados: os.insumos_detalhados || [],
      slump_central_medido: os.slump_central_medido || null,
      slump_central_saida: os.slump_central_saida || null,
      slump_tolerancia: os.slump_tolerancia || '+-2',
      agua_adic_central:
        os.agua_adic_central != null ? Number(os.agua_adic_central) : 0,
      moldagem_central: os.moldagem_central || null,
      visto_motorista_central: os.visto_motorista_central || null,
      slump_peca_medido: os.slump_peca_medido || null,
      slump_peca_saida: os.slump_peca_saida || null,
      agua_adic_peca: os.agua_adic_peca != null ? Number(os.agua_adic_peca) : 0,
      peca_concretada: os.peca_concretada || null,
      visto_motorista_peca: os.visto_motorista_peca || null,
      veiculo_placa: os.veiculo_placa || null,
      motorista_nome: os.motorista_nome || null,
      lacre: os.lacre || null,
      km_inicial: os.km_inicial != null ? Number(os.km_inicial) : null,
      km_final: os.km_final != null ? Number(os.km_final) : null,
      hora_carga: os.hora_carga || null,
      hora_saida_central: os.hora_saida_central || null,
      hora_chegada_obra: os.hora_chegada_obra || null,
      hora_inicio_descarga: os.hora_inicio_descarga || null,
      hora_fim_descarga: os.hora_fim_descarga || null,
      hora_saida_obra: os.hora_saida_obra || null,
      hora_chegada_central: os.hora_chegada_central || null,
      visto_obra: os.visto_obra || null,
      vendedor_nome: os.vendedor_nome || null,
      bomba_estacionaria: os.bomba_estacionaria || null,
      observacoes: os.observacoes || null,
      agua_adicional_termo:
        os.agua_adicional_termo != null
          ? Number(os.agua_adicional_termo)
          : null,
      nome_responsavel_termo: os.nome_responsavel_termo || null,
    }

    if (os.id) {
      const { data, error } = await (supabase as any)
        .from('ordens_servico')
        .update(payload)
        .eq('id', os.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from('ordens_servico')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async excluirOrdemServico(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('ordens_servico')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // ==========================================
  // GESTÃO DE USUÁRIOS DO SISTEMA
  // ==========================================
  async listarUsuariosApp(): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('usuarios_app')
      .select('*, empresas(id, nome, slug)')
      .order('nome', { ascending: true })

    if (error) throw error
    return (data || []).map((u: any) => ({
      ...u,
      empresa_nome: u.empresas?.nome || null,
    }))
  },

  async buscarUsuarioAppPorAuth(
    userId: string,
    email?: string,
  ): Promise<any | null> {
    let query = (supabase as any)
      .from('usuarios_app')
      .select('*, empresas(id, nome, slug)')
    if (userId) {
      const { data, error } = await query.eq('user_id', userId).maybeSingle()
      if (!error && data) {
        return {
          ...data,
          empresa_nome: data.empresas?.nome || null,
        }
      }
    }
    if (email) {
      const { data, error } = await (supabase as any)
        .from('usuarios_app')
        .select('*, empresas(id, nome, slug)')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()
      if (!error && data) {
        return {
          ...data,
          empresa_nome: data.empresas?.nome || null,
        }
      }
    }
    return null
  },

  async contarUsuariosApp(): Promise<number> {
    const { count, error } = await (supabase as any)
      .from('usuarios_app')
      .select('*', { count: 'exact', head: true })
    if (error) return 0
    return count || 0
  },

  async salvarUsuarioApp(dados: {
    id?: string
    user_id?: string | null
    nome: string
    email: string
    perfil: 'administrador' | 'balanceiro'
    empresa_id?: string | null
    ativo?: boolean
  }): Promise<any> {
    const payload = {
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      perfil: dados.perfil,
      empresa_id: dados.empresa_id || null,
      ativo: dados.ativo ?? true,
      updated_at: new Date().toISOString(),
    }

    if (dados.id) {
      const { data, error } = await (supabase as any)
        .from('usuarios_app')
        .update(payload)
        .eq('id', dados.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from('usuarios_app')
        .insert({
          ...payload,
          user_id: dados.user_id || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async alternarStatusUsuarioApp(id: string, ativo: boolean): Promise<void> {
    const { error } = await (supabase as any)
      .from('usuarios_app')
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async vincularAuthAUsuarioApp(userId: string, email: string): Promise<void> {
    await (supabase as any)
      .from('usuarios_app')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('email', email.trim().toLowerCase())
      .is('user_id', null)
  },
}
