import { supabase } from "@/lib/supabase/client"
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
  MetaProducao,
  RecipienteEstoque,
} from "@/types/concreteira"

export const ConcreteiraService = {
  // Materiais e Estoque
  async getMateriais(empresaId?: string): Promise<Material[]> {
    let queryMat = (supabase as any)
      .from("materiais")
      .select("*")
      .order("ordem", { ascending: true })

    if (empresaId) {
      queryMat = queryMat.eq("empresa_id", empresaId)
    }

    const { data: materiais, error: matErr } = await queryMat
    if (matErr) throw matErr

    const saldos: Record<string, number> = {}

    // Tentativa 1: cálculo exato via RPC no banco (sem risco de truncamento por paginação PostgREST)
    try {
      const { data: rpcSaldos, error: rpcErr } = await (supabase as any).rpc(
        "calcular_saldos_estoque",
        empresaId ? { p_empresa_id: empresaId } : {},
      )

      if (!rpcErr && Array.isArray(rpcSaldos)) {
        rpcSaldos.forEach((r: any) => {
          if (r.material_id) {
            saldos[r.material_id] = Number(r.saldo) || 0
          }
        })
      } else if (rpcErr) {
        throw rpcErr
      }
    } catch (rpcFallbackErr) {
      // Fallback com paginação completa em blocos de 1.000 para garantir que 100% das linhas sejam somadas
      console.warn(
        "RPC calcular_saldos_estoque indisponível, usando paginação com range:",
        rpcFallbackErr,
      )
      const PAGE_SIZE = 1000
      let offset = 0
      let hasMore = true

      while (hasMore) {
        let q = (supabase as any)
          .from("movimentacoes_estoque")
          .select("material_id, tipo, quantidade")
          .range(offset, offset + PAGE_SIZE - 1)

        if (empresaId) {
          q = q.eq("empresa_id", empresaId)
        }

        const { data: pageMovs, error: pageErr } = await q
        if (pageErr) throw pageErr

        if (pageMovs && pageMovs.length > 0) {
          pageMovs.forEach((m: any) => {
            const qtd = Number(m.quantidade) || 0
            if (!saldos[m.material_id]) saldos[m.material_id] = 0
            if (m.tipo === "ENTRADA" || m.tipo === "ABERTURA") {
              saldos[m.material_id] += qtd
            } else {
              saldos[m.material_id] -= qtd
            }
          })
          if (pageMovs.length < PAGE_SIZE) {
            hasMore = false
          } else {
            offset += PAGE_SIZE
          }
        } else {
          hasMore = false
        }
      }
    }

    return (materiais || []).map((mat: any) => {
      const isControlado = mat.codigo === "cimento" || mat.codigo === "aditivo"
      const saldoCalculado = isControlado
        ? Number((saldos[mat.id] || 0).toFixed(2))
        : undefined

      return {
        ...mat,
        controla_estoque: isControlado,
        estoque_minimo: isControlado ? Number(mat.estoque_minimo) || 0 : 0,
        densidade: mat.densidade != null ? Number(mat.densidade) : undefined,
        unidade_compra: mat.unidade_compra ?? "kg",
        preco_compra:
          mat.preco_compra != null ? Number(mat.preco_compra) : undefined,
        saldo: saldoCalculado,
      }
    })
  },

  async updateMaterialEstoqueMinimo(id: string, estoque_minimo: number) {
    const { data, error } = await (supabase as any)
      .from("materiais")
      .update({ estoque_minimo })
      .eq("id", id)
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
      .from("materiais")
      .update(update)
      .eq("id", id)
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
    const unidade = (unidadeCompra || "kg").toLowerCase()

    if (unidade === "kg") return preco
    if (unidade === "tonelada" || unidade === "toneladas" || unidade === "t")
      return preco / 1000
    if (unidade === "m3" || unidade === "m³") {
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
    const unidade = (unidadeCompra || "litros").toLowerCase()
    const d = Number(densidade) > 0 ? Number(densidade) : 1.0

    if (
      unidade === "litros" ||
      unidade === "l" ||
      unidade === "lt" ||
      unidade === "lts"
    ) {
      return preco
    }
    if (unidade === "kg") {
      // 1 L tem peso de 'd' kg (ex: d = 1,05 kg/L => 1L = 1,05kg => custo/L = preco/kg * 1,05)
      // Se d = 1.0, 1kg = 1L => custo/L = preco
      return preco * d
    }
    if (unidade === "tonelada" || unidade === "toneladas" || unidade === "t") {
      // preco por tonelada (1000kg) => preco/kg = preco / 1000 => custo/L = (preco / 1000) * d
      return (preco / 1000) * d
    }
    if (unidade === "m3" || unidade === "m³") {
      // 1 m³ = 1.000 litros
      return preco / 1000
    }
    return preco
  },

  // Quantidade de kg equivalente a 1 unidade de compra (ex.: 1 m³ de brita 12 = 1.380 kg)
  kgPorUnidadeCompra(unidadeCompra: string, densidade?: number): number {
    const unidade = (unidadeCompra || "kg").toLowerCase()
    if (unidade === "kg") return 1
    if (unidade === "tonelada" || unidade === "toneladas" || unidade === "t")
      return 1000
    if (unidade === "m3" || unidade === "m³")
      return (Number(densidade) || 0) * 1000
    return 1
  },

  async getMovimentacoes(
    materialId?: string,
    empresaId?: string,
    apenasControlados = true,
  ): Promise<MovimentacaoEstoque[]> {
    let query = (supabase as any)
      .from("movimentacoes_estoque")
      .select("*, material:materiais(*)")
      .order("created_at", { ascending: false })
      .limit(300)

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    if (materialId && materialId !== "ALL") {
      query = query.eq("material_id", materialId)
    }

    const { data, error } = await query
    if (error) throw error
    let result = (data || []) as MovimentacaoEstoque[]

    // Se apenasControlados for true, filtra movimentações para materiais de estoque controlado (cimento e aditivo)
    if (apenasControlados && (!materialId || materialId === "ALL")) {
      result = result.filter((m) => {
        const mat = m.material
        if (!mat) return false
        return mat.codigo === "cimento" || mat.codigo === "aditivo"
      })
    }

    return result
  },

  async getMovimentacoesParaAcoes(filtros: {
    empresaId?: string
    dataInicio?: string
    dataFim?: string
    tipo?: string
    materialId?: string
    limite?: number
  }): Promise<MovimentacaoEstoque[]> {
    let query = (supabase as any)
      .from("movimentacoes_estoque")
      .select("*, material:materiais(*)")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })

    if (filtros.empresaId) {
      query = query.eq("empresa_id", filtros.empresaId)
    }

    if (filtros.dataInicio) {
      query = query.gte("data", filtros.dataInicio)
    }

    if (filtros.dataFim) {
      query = query.lte("data", filtros.dataFim)
    }

    if (filtros.tipo && filtros.tipo !== "ALL") {
      query = query.eq("tipo", filtros.tipo)
    }

    if (filtros.materialId && filtros.materialId !== "ALL") {
      query = query.eq("material_id", filtros.materialId)
    }

    query = query.limit(filtros.limite || 200)

    const { data, error } = await query
    if (error) throw error
    return (data || []) as MovimentacaoEstoque[]
  },

  async atualizarValoresMovimentacao(payload: {
    movimentacaoId: string
    preco_unitario: number
    valor_total: number
    observacao?: string
  }): Promise<MovimentacaoEstoque> {
    const updateData: any = {
      preco_unitario: payload.preco_unitario,
      valor_total: payload.valor_total,
    }
    if (payload.observacao !== undefined) {
      updateData.observacao = payload.observacao
    }

    const { data, error } = await (supabase as any)
      .from("movimentacoes_estoque")
      .update(updateData)
      .eq("id", payload.movimentacaoId)
      .select("*, material:materiais(*)")
      .single()

    if (error) throw error
    return data as MovimentacaoEstoque
  },

  async registrarEntradaEstoque(payload: {
    empresa_id?: string
    material_id: string
    quantidade: number
    preco_unitario: number
    valor_total?: number
    data: string
    documento?: string
    observacao?: string
    recipiente_id?: string
    recipiente_nome?: string
  }) {
    const precoUnit = Number(payload.preco_unitario) || 0
    const qtd = Number(payload.quantidade) || 0
    const valorTot =
      payload.valor_total !== undefined && payload.valor_total !== null
        ? Number(payload.valor_total)
        : Number((qtd * precoUnit).toFixed(2))

    const { data, error } = await (supabase as any)
      .from("movimentacoes_estoque")
      .insert({
        empresa_id: payload.empresa_id || null,
        material_id: payload.material_id,
        recipiente_id: payload.recipiente_id || null,
        recipiente_nome: payload.recipiente_nome || null,
        tipo: "ENTRADA",
        quantidade: qtd,
        preco_unitario: precoUnit,
        valor_total: valorTot,
        data: payload.data,
        documento: payload.documento || "NOTA-REPOSICAO",
        observacao: payload.observacao || "Reposição de estoque",
      })
      .select()
      .single()

    if (error) throw error

    // Se houver recipiente especificado, credita também o saldo do recipiente
    if (payload.recipiente_id) {
      await this.atualizarSaldoRecipiente(payload.recipiente_id, qtd)
    }

    return data
  },

  // Traços
  async getTracos(empresaId?: string): Promise<Traco[]> {
    let query = (supabase as any)
      .from("tracos")
      .select("*")
      .order("nome", { ascending: true })

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarTraco(traco: Partial<Traco>, empresaId?: string) {
    if (traco.id) {
      const { data, error } = await (supabase as any)
        .from("tracos")
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
        .eq("id", traco.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from("tracos")
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

  // Metas de Produção por Empresa
  async getMetaProducao(empresaId: string): Promise<MetaProducao | null> {
    if (!empresaId) return null
    const { data, error } = await (supabase as any)
      .from("metas_producao")
      .select("*")
      .eq("empresa_id", empresaId)
      .maybeSingle()

    if (error) {
      console.error("Erro ao buscar meta de produção:", error)
      return null
    }

    if (!data) {
      // Valores padrão de meta caso ainda não configurado
      return {
        empresa_id: empresaId,
        meta_diaria_m3: 50,
        meta_mensal_m3: 1000,
        observacao: "Meta padrão inicial",
      }
    }

    return {
      ...data,
      meta_diaria_m3: Number(data.meta_diaria_m3) || 0,
      meta_mensal_m3: Number(data.meta_mensal_m3) || 0,
    }
  },

  async salvarMetaProducao(meta: {
    empresa_id: string
    meta_diaria_m3: number
    meta_mensal_m3: number
    observacao?: string
  }): Promise<MetaProducao> {
    const payload = {
      empresa_id: meta.empresa_id,
      meta_diaria_m3: Number(meta.meta_diaria_m3) || 0,
      meta_mensal_m3: Number(meta.meta_mensal_m3) || 0,
      observacao: meta.observacao || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await (supabase as any)
      .from("metas_producao")
      .upsert(payload, { onConflict: "empresa_id" })
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      meta_diaria_m3: Number(data.meta_diaria_m3) || 0,
      meta_mensal_m3: Number(data.meta_mensal_m3) || 0,
    }
  },

  // Recipientes de Estoque (Silos e Tanques - Exclusivo Patos)
  async getRecipientesEstoque(empresaId: string): Promise<RecipienteEstoque[]> {
    if (!empresaId) return []
    const { data, error } = await (supabase as any)
      .from("recipientes_estoque")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("ordem", { ascending: true })

    if (error) {
      console.error("Erro ao buscar recipientes de estoque:", error)
      return []
    }
    return (data || []).map((r: any) => ({
      ...r,
      saldo_atual: Number(r.saldo_atual) || 0,
      estoque_minimo: Number(r.estoque_minimo) || 0,
      ordem: Number(r.ordem) || 0,
    }))
  },

  async atualizarRecipienteEstoque(
    id: string,
    payload: {
      saldo_atual?: number
      estoque_minimo?: number
      nome?: string
    },
  ): Promise<RecipienteEstoque> {
    const updateData: any = { updated_at: new Date().toISOString() }
    if (payload.saldo_atual !== undefined)
      updateData.saldo_atual = payload.saldo_atual
    if (payload.estoque_minimo !== undefined)
      updateData.estoque_minimo = payload.estoque_minimo
    if (payload.nome !== undefined) updateData.nome = payload.nome

    const { data, error } = await (supabase as any)
      .from("recipientes_estoque")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      saldo_atual: Number(data.saldo_atual) || 0,
      estoque_minimo: Number(data.estoque_minimo) || 0,
    }
  },

  async atualizarSaldoRecipiente(
    recipienteId: string,
    delta: number,
  ): Promise<void> {
    if (!recipienteId || delta === 0) return
    const { data: rec, error: getErr } = await (supabase as any)
      .from("recipientes_estoque")
      .select("saldo_atual")
      .eq("id", recipienteId)
      .single()

    if (getErr || !rec) return

    const novoSaldo = Number(rec.saldo_atual) + Number(delta)
    await (supabase as any)
      .from("recipientes_estoque")
      .update({
        saldo_atual: novoSaldo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recipienteId)
  },

  async registrarEntradaRecipiente(payload: {
    empresa_id: string
    recipiente_id: string
    quantidade: number
    data: string
    documento?: string
    observacao?: string
    preco_unitario?: number
  }): Promise<void> {
    const { data: rec, error: recErr } = await (supabase as any)
      .from("recipientes_estoque")
      .select("*")
      .eq("id", payload.recipiente_id)
      .single()

    if (recErr || !rec) {
      throw new Error("Recipiente não encontrado.")
    }

    const qtd = Number(payload.quantidade)
    if (qtd <= 0)
      throw new Error("A quantidade de entrada deve ser maior que zero.")

    const precoUnit = Number(payload.preco_unitario) || 0
    const valorTot = precoUnit > 0 ? Number((qtd * precoUnit).toFixed(2)) : 0

    // 1. Registra movimentação de estoque
    const { error: movErr } = await (supabase as any)
      .from("movimentacoes_estoque")
      .insert({
        empresa_id: payload.empresa_id,
        material_id: rec.material_id,
        recipiente_id: rec.id,
        recipiente_nome: rec.nome,
        tipo: "ENTRADA",
        quantidade: qtd,
        preco_unitario: precoUnit || null,
        valor_total: valorTot || null,
        data: payload.data,
        documento:
          payload.documento ||
          `ENTRADA-${rec.nome.toUpperCase().replace(/\s+/g, "-")}`,
        observacao: payload.observacao || `Entrada no ${rec.nome}`,
      })

    if (movErr) throw movErr

    // 2. Atualiza o saldo do recipiente
    await this.atualizarSaldoRecipiente(rec.id, qtd)
  },

  // Cadastros
  async getMotoristas(empresaId?: string): Promise<Motorista[]> {
    let query = (supabase as any).from("motoristas").select("*").order("nome")

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
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
      let query = (supabase as any)
        .from("motoristas")
        .update({
          nome,
          ativo,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq("id", id)

      if (empresaId) {
        query = query.eq("empresa_id", empresaId)
      }

      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await (supabase as any)
      .from("motoristas")
      .insert({ nome, ativo, empresa_id: empresaId || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizarMotorista(
    id: string,
    dados: {
      nome: string
      ativo?: boolean
    },
    empresaId?: string,
  ) {
    return this.salvarMotorista(dados.nome, dados.ativo ?? true, id, empresaId)
  },

  async getVeiculos(empresaId?: string): Promise<Veiculo[]> {
    let query = (supabase as any).from("veiculos").select("*").order("placa")

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
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
      let query = (supabase as any)
        .from("veiculos")
        .update({
          placa,
          modelo,
          ativo,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq("id", id)

      if (empresaId) {
        query = query.eq("empresa_id", empresaId)
      }

      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await (supabase as any)
      .from("veiculos")
      .insert({ placa, modelo, ativo, empresa_id: empresaId || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizarVeiculo(
    id: string,
    dados: {
      placa: string
      modelo?: string
      ativo?: boolean
    },
    empresaId?: string,
  ) {
    return this.salvarVeiculo(
      dados.placa,
      dados.modelo,
      dados.ativo ?? true,
      id,
      empresaId,
    )
  },

  async getCidades(empresaId?: string): Promise<Cidade[]> {
    let query = (supabase as any).from("cidades").select("*").order("nome")

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarCidade(nome: string, uf = "PB", id?: string, empresaId?: string) {
    if (id) {
      let query = (supabase as any)
        .from("cidades")
        .update({ nome, uf, ...(empresaId ? { empresa_id: empresaId } : {}) })
        .eq("id", id)

      if (empresaId) {
        query = query.eq("empresa_id", empresaId)
      }

      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await (supabase as any)
      .from("cidades")
      .insert({ nome, uf, empresa_id: empresaId || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizarCidade(
    id: string,
    dados: {
      nome: string
      uf?: string
    },
    empresaId?: string,
  ) {
    return this.salvarCidade(dados.nome, dados.uf || "PB", id, empresaId)
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
    incluirCanceladas?: boolean
    apenasCanceladas?: boolean
  }): Promise<Carga[]> {
    let query = (supabase as any)
      .from("cargas")
      .select("*")
      .order("data", { ascending: false })
      .order("numero_carga", { ascending: false })

    if (filtros?.empresaId) query = query.eq("empresa_id", filtros.empresaId)
    if (filtros?.dataInicio) query = query.gte("data", filtros.dataInicio)
    if (filtros?.dataFim) query = query.lte("data", filtros.dataFim)
    if (filtros?.cidade && filtros.cidade !== "ALL")
      query = query.eq("cidade_nome", filtros.cidade)
    if (filtros?.motorista && filtros.motorista !== "ALL")
      query = query.eq("motorista_nome", filtros.motorista)
    if (filtros?.veiculo && filtros.veiculo !== "ALL")
      query = query.eq("veiculo_placa", filtros.veiculo)
    if (filtros?.apenasZeradas) query = query.eq("carga_zerada", true)

    if (filtros?.apenasCanceladas) {
      query = query.eq("cancelada", true)
    } else if (!filtros?.incluirCanceladas) {
      query = query.eq("cancelada", false)
    }

    const { data, error } = await query
    if (error) throw error

    let cargas = (data || []) as Carga[]

    // Filtro adicional por material: apenas cargas que consumiram aquele material (> 0)
    if (filtros?.material && filtros.material !== "ALL") {
      const matKey = filtros.material
      cargas = cargas.filter((c) => {
        if (matKey === "cimento") return Number(c.consumo_cimento) > 0
        if (matKey === "aditivo") return Number(c.consumo_aditivo) > 0
        if (matKey === "areia") return Number(c.consumo_areia) > 0
        if (matKey === "brita12") return Number(c.consumo_brita12) > 0
        if (matKey === "brita19") return Number(c.consumo_brita19) > 0
        if (matKey === "po_pedra") return Number(c.consumo_po_pedra) > 0
        return true
      })
    }

    // Buscar tabela de preços e também ordens de serviço vinculadas a essas cargas
    const [precos, ordensServico] = await Promise.all([
      this.getPrecosMaterial(filtros?.empresaId),
      (supabase as any)
        .from("ordens_servico")
        .select("*")
        .not("carga_id", "is", null)
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
    const [ano, mes] = dataStr ? dataStr.slice(0, 7).split("-") : ["", ""]
    const mesAnoCarga = `${mes}/${ano}`

    // 1. Tentar encontrar preço exato do mês da carga
    const precoExato = precosMat.find((p) => p.mes_ano === mesAnoCarga)
    if (precoExato) return Number(precoExato.preco_unitario) || 0

    // 2. Se não houver, pegar o mais recente anterior à data da carga
    // Converte mes_ano 'MM/YYYY' para YYYY-MM para comparação cronológica
    const parseMesAno = (ma: string) => {
      const [m, y] = ma.split("/")
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
      "cimento",
      carga.data,
      precos,
    )
    const pAditivo = this.getPrecoUnitarioParaData(
      "aditivo",
      carga.data,
      precos,
    )
    const pAreia = this.getPrecoUnitarioParaData("areia", carga.data, precos)
    const pBrita12 = this.getPrecoUnitarioParaData(
      "brita12",
      carga.data,
      precos,
    )
    const pBrita19 = this.getPrecoUnitarioParaData(
      "brita19",
      carga.data,
      precos,
    )
    const pPoPedra = this.getPrecoUnitarioParaData(
      "po_pedra",
      carga.data,
      precos,
    )
    const pAgua = this.getPrecoUnitarioParaData("agua", carga.data, precos)

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
  calcularCustoTracoM3(traco: Traco, precos: PrecoMaterial[]): {
    totalPorM3: number
    detalhes: Record<string, number>
  } {
    const hoje = new Date().toISOString().split("T")[0]
    const pCimento = this.getPrecoUnitarioParaData("cimento", hoje, precos)
    const pAditivo = this.getPrecoUnitarioParaData("aditivo", hoje, precos)
    const pAreia = this.getPrecoUnitarioParaData("areia", hoje, precos)
    const pBrita12 = this.getPrecoUnitarioParaData("brita12", hoje, precos)
    const pBrita19 = this.getPrecoUnitarioParaData("brita19", hoje, precos)
    const pPoPedra = this.getPrecoUnitarioParaData("po_pedra", hoje, precos)
    const pAgua = this.getPrecoUnitarioParaData("agua", hoje, precos)

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
      .from("cargas")
      .select("numero_carga")
      .order("numero_carga", { ascending: false })
      .limit(1)

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query
    if (error) {
      console.error("Erro ao buscar próximo número de carga:", error)
      return 1
    }
    if (data && data.length > 0 && data[0].numero_carga) {
      return Number(data[0].numero_carga) + 1
    }
    return 1
  },

  async getCargaPorId(id: string): Promise<Carga | null> {
    const { data: carga, error } = await (supabase as any)
      .from("cargas")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !carga) return null

    const [precos, { data: osData }] = await Promise.all([
      this.getPrecosMaterial(carga.empresa_id),
      (supabase as any)
        .from("ordens_servico")
        .select("*")
        .eq("carga_id", id)
        .maybeSingle(),
    ])

    const custo = this.calcularCustoCarga(carga, precos)
    const osVinculada = osData as OrdemServico || null

    return {
      ...carga,
      custo,
      ordem_servico: osVinculada,
      numero_os: osVinculada ? osVinculada.numero_os : null,
      ordem_servico_id: osVinculada ? osVinculada.id : null,
    }
  },

  async atualizarCarga(
    id: string,
    payload: {
      data: string
      volume_m3: number
      traco_id?: string
      traco_nome?: string
      motorista_id?: string | null
      motorista_nome?: string | null
      veiculo_id?: string | null
      veiculo_placa?: string | null
      cidade_id?: string | null
      cidade_nome?: string | null
      cliente_id?: string | null
      cliente_nome?: string | null
      consumo_brita12: number
      consumo_brita19: number
      consumo_areia: number
      consumo_po_pedra: number
      consumo_cimento: number
      consumo_aditivo: number
      consumo_agua?: number
      observacao?: string | null
      carga_zerada?: boolean
      motivo_zerada?: "PERDA" | "CANCELAR"
      silo_cimento?: string | null
      tanque_aditivo?: string | null
    },
  ): Promise<Carga> {
    // Se for zerada por PERDA, prefixa [PERDA OPERACIONAL] na observação se ainda não tiver
    let obsFinal = payload.observacao || null
    if (payload.carga_zerada && payload.motivo_zerada === "PERDA") {
      const prefixo = "[PERDA OPERACIONAL]"
      if (!obsFinal || !obsFinal.includes(prefixo)) {
        obsFinal = obsFinal ? `${prefixo} ${obsFinal}` : prefixo
      }
    }

    // 1. Atualiza registro da carga
    const updateData: any = {
      data: payload.data,
      volume_m3: payload.volume_m3,
      traco_id: payload.traco_id || null,
      traco_nome: payload.traco_nome || null,
      motorista_id: payload.motorista_id || null,
      motorista_nome: payload.motorista_nome || null,
      veiculo_id: payload.veiculo_id || null,
      veiculo_placa: payload.veiculo_placa || null,
      cidade_id: payload.cidade_id || null,
      cidade_nome: payload.cidade_nome || null,
      cliente_id: payload.cliente_id !== undefined ? payload.cliente_id : null,
      cliente_nome:
        payload.cliente_nome !== undefined ? payload.cliente_nome : null,
      consumo_brita12: payload.consumo_brita12,
      consumo_brita19: payload.consumo_brita19,
      consumo_areia: payload.consumo_areia,
      consumo_po_pedra: payload.consumo_po_pedra,
      consumo_cimento: payload.consumo_cimento,
      consumo_aditivo: payload.consumo_aditivo,
      consumo_agua: payload.consumo_agua || 0,
      observacao: obsFinal,
      carga_zerada: payload.carga_zerada || false,
    }
    if (payload.silo_cimento !== undefined)
      updateData.silo_cimento = payload.silo_cimento
    if (payload.tanque_aditivo !== undefined)
      updateData.tanque_aditivo = payload.tanque_aditivo

    const { data: cargaAtualizada, error: updErr } = await (supabase as any)
      .from("cargas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updErr) throw updErr

    // 2. Estorna TODAS as movimentações de estoque antigas vinculadas a esta carga
    // Se haviam movimentações vinculadas a recipientes, ajusta o saldo_atual dos recipientes
    const { data: movsAntigas } = await (supabase as any)
      .from("movimentacoes_estoque")
      .select("recipiente_id, quantidade, tipo")
      .eq("carga_id", id)

    if (movsAntigas && movsAntigas.length > 0) {
      for (const m of movsAntigas) {
        if (m.recipiente_id) {
          const delta =
            m.tipo === "SAIDA" ? Number(m.quantidade) : -Number(m.quantidade)
          try {
            const { error: rpcErr } = await (supabase as any).rpc(
              "executar_delta_recipiente",
              {
                p_recipiente_id: m.recipiente_id,
                p_delta: delta,
              },
            )
            if (rpcErr) throw rpcErr
          } catch {
            // Fallback sem RPC se não existir: busca saldo_atual do recipiente e faz update direto
            const { data: rec } = await (supabase as any)
              .from("recipientes_estoque")
              .select("saldo_atual")
              .eq("id", m.recipiente_id)
              .single()
            if (rec) {
              await (supabase as any)
                .from("recipientes_estoque")
                .update({
                  saldo_atual: Number(rec.saldo_atual) + delta,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", m.recipiente_id)
            }
          }
        }
      }
    }

    const { error: delErr } = await (supabase as any)
      .from("movimentacoes_estoque")
      .delete()
      .eq("carga_id", id)

    if (delErr) {
      console.error("Erro ao estornar movimentações antigas da carga:", delErr)
    }

    // 3. Se a carga atualizada NÃO for zerada ou for zerada com motivo "PERDA", grava as novas movimentações recalculadas (apenas cimento e aditivo)
    const deveDebitarEstoque =
      !payload.carga_zerada ||
      payload.motivo_zerada === "PERDA" ||
      (payload.carga_zerada &&
        typeof obsFinal === "string" &&
        obsFinal.includes("[PERDA OPERACIONAL]"))

    if (deveDebitarEstoque) {
      const empresaId = cargaAtualizada.empresa_id
      const materiais = await this.getMateriais(empresaId)
      const docName = `CARGA-${String(cargaAtualizada.numero_carga).padStart(5, "0")}`
      const saídas: any[] = []

      const matCimento = materiais.find((m) => m.codigo === "cimento")
      const matAditivo = materiais.find((m) => m.codigo === "aditivo")

      // Se for Patos, buscar recipientes para associar ID e abater saldo
      let recipientesPatos: RecipienteEstoque[] = []
      if (empresaId && (payload.silo_cimento || payload.tanque_aditivo)) {
        recipientesPatos = await this.getRecipientesEstoque(empresaId)
      }

      const recSilo = payload.silo_cimento
        ? recipientesPatos.find(
            (r) =>
              r.identificador === payload.silo_cimento ||
              r.nome
                .toLowerCase()
                .includes(payload.silo_cimento!.toLowerCase()),
          )
        : null
      const recTanque = payload.tanque_aditivo
        ? recipientesPatos.find(
            (r) =>
              r.identificador === payload.tanque_aditivo ||
              r.nome
                .toLowerCase()
                .includes(payload.tanque_aditivo!.toLowerCase()),
          )
        : null

      const obsMov = payload.carga_zerada
        ? `Perda operacional na batelada (${payload.volume_m3}m³) (recalculado após edição)`
        : `Consumo na carga de ${payload.volume_m3}m³ (recalculado após edição)`

      if (payload.consumo_cimento > 0 && matCimento) {
        saídas.push({
          empresa_id: empresaId || null,
          material_id: matCimento.id,
          recipiente_id: recSilo?.id || null,
          recipiente_nome: recSilo?.nome || null,
          tipo: "SAIDA",
          quantidade: payload.consumo_cimento,
          data: payload.data,
          carga_id: id,
          documento: docName,
          observacao: obsMov,
        })
      }
      if (payload.consumo_aditivo > 0 && matAditivo) {
        saídas.push({
          empresa_id: empresaId || null,
          material_id: matAditivo.id,
          recipiente_id: recTanque?.id || null,
          recipiente_nome: recTanque?.nome || null,
          tipo: "SAIDA",
          quantidade: payload.consumo_aditivo,
          data: payload.data,
          carga_id: id,
          documento: docName,
          observacao: obsMov,
        })
      }

      if (saídas.length > 0) {
        await (supabase as any).from("movimentacoes_estoque").insert(saídas)
        if (recSilo && payload.consumo_cimento > 0) {
          await this.atualizarSaldoRecipiente(
            recSilo.id,
            -payload.consumo_cimento,
          )
        }
        if (recTanque && payload.consumo_aditivo > 0) {
          await this.atualizarSaldoRecipiente(
            recTanque.id,
            -payload.consumo_aditivo,
          )
        }
      }
    }
    // 4. Se houver Ordem de Serviço vinculada a essa carga, sincroniza seus itens e insumos detalhados
    const { data: osVinculada } = await (supabase as any)
      .from("ordens_servico")
      .select("*")
      .eq("carga_id", id)
      .maybeSingle()

    if (osVinculada) {
      const discriminacao =
        payload.traco_nome ||
        (osVinculada.itens && osVinculada.itens[0]?.discriminacao) ||
        "CONCRETO USINADO"

      const itensAtualizados = [
        {
          quantidade: Number(payload.volume_m3) || 8.0,
          unidade: "m3",
          discriminacao,
        },
      ]

      const insumosDetalhados = [
        {
          material: "Cimento",
          quantidade: payload.consumo_cimento,
          unidade: "kg",
        },
        {
          material: "Aditivo",
          quantidade: payload.consumo_aditivo,
          unidade: "L",
        },
        {
          material: "Água",
          quantidade: payload.consumo_agua || 0,
          unidade: "L",
        },
        {
          material: "Areia",
          quantidade: payload.consumo_areia,
          unidade: "kg",
        },
        {
          material: "Brita 12",
          quantidade: payload.consumo_brita12,
          unidade: "kg",
        },
        {
          material: "Brita 19",
          quantidade: payload.consumo_brita19,
          unidade: "kg",
        },
        {
          material: "Pó de Pedra",
          quantidade: payload.consumo_po_pedra,
          unidade: "kg",
        },
      ].filter((ins) => ins.quantidade > 0)

      await (supabase as any)
        .from("ordens_servico")
        .update({
          data_emissao: payload.data,
          itens: itensAtualizados,
          insumos_detalhados: insumosDetalhados,
          motorista_nome: payload.motorista_nome || osVinculada.motorista_nome,
          veiculo_placa: payload.veiculo_placa || osVinculada.veiculo_placa,
        })
        .eq("id", osVinculada.id)
    }

    return cargaAtualizada
  },

  async criarCarga(payload: {
    empresa_id?: string
    data: string
    volume_m3: number
    traco_id?: string
    traco_nome?: string
    motorista_id?: string | null
    motorista_nome?: string | null
    veiculo_id?: string | null
    veiculo_placa?: string | null
    cidade_id?: string | null
    cidade_nome?: string | null
    cliente_id?: string | null
    cliente_nome?: string | null
    consumo_brita12: number
    consumo_brita19: number
    consumo_areia: number
    consumo_po_pedra: number
    consumo_cimento: number
    consumo_aditivo: number
    consumo_agua?: number
    observacao?: string
    carga_zerada?: boolean
    motivo_zerada?: "PERDA" | "CANCELAR"
    silo_cimento?: string | null
    tanque_aditivo?: string | null
  }) {
    // 0. Calcular próximo número de carga para a empresa
    const proximoNum = await this.getProximoNumeroCarga(payload.empresa_id)

    // Se for zerada por PERDA, prefixa [PERDA OPERACIONAL] na observação
    let obsFinal = payload.observacao || null
    if (payload.carga_zerada && payload.motivo_zerada === "PERDA") {
      const prefixo = "[PERDA OPERACIONAL]"
      if (!obsFinal || !obsFinal.includes(prefixo)) {
        obsFinal = obsFinal ? `${prefixo} ${obsFinal}` : prefixo
      }
    }

    // 1. Inserir carga
    const { data: carga, error: cargaErr } = await (supabase as any)
      .from("cargas")
      .insert({
        empresa_id: payload.empresa_id || null,
        numero_carga: proximoNum,
        data: payload.data,
        volume_m3: payload.volume_m3,
        traco_id: payload.traco_id || null,
        traco_nome: payload.traco_nome || null,
        motorista_id: payload.motorista_id || null,
        motorista_nome: payload.motorista_nome || null,
        veiculo_id: payload.veiculo_id || null,
        veiculo_placa: payload.veiculo_placa || null,
        cidade_id: payload.cidade_id || null,
        cidade_nome: payload.cidade_nome || null,
        cliente_id: payload.cliente_id || null,
        cliente_nome: payload.cliente_nome || null,
        consumo_brita12: payload.consumo_brita12,
        consumo_brita19: payload.consumo_brita19,
        consumo_areia: payload.consumo_areia,
        consumo_po_pedra: payload.consumo_po_pedra,
        consumo_cimento: payload.consumo_cimento,
        consumo_aditivo: payload.consumo_aditivo,
        consumo_agua: payload.consumo_agua || 0,
        observacao: obsFinal,
        carga_zerada: payload.carga_zerada || false,
        silo_cimento: payload.silo_cimento || null,
        tanque_aditivo: payload.tanque_aditivo || null,
      })
      .select()
      .single()

    if (cargaErr) throw cargaErr

    // 2. Movimentação de estoque:
    // - Carga regular (!carga_zerada): debita cimento e aditivo normalmente
    // - Carga zerada com motivo "PERDA": DEBITA estoque de cimento/aditivo consumidos na batelada (perda operacional)
    // - Carga zerada com motivo "CANCELAR" (ou padrão): SEM NENHUMA movimentação de estoque
    const deveDebitarEstoque =
      !payload.carga_zerada || payload.motivo_zerada === "PERDA"

    if (deveDebitarEstoque) {
      const materiais = await this.getMateriais(payload.empresa_id)
      const docName = `CARGA-${String(carga.numero_carga).padStart(5, "0")}`
      const saídas: any[] = []

      // Materiais controlados: APENAS cimento e aditivo (agregados areia, brita12, brita19, pó de pedra NÃO geram movimentação)
      const matCimento = materiais.find((m) => m.codigo === "cimento")
      const matAditivo = materiais.find((m) => m.codigo === "aditivo")

      // Se for Patos e houver silo/tanque indicado, buscar recipientes
      let recipientesPatos: RecipienteEstoque[] = []
      if (
        payload.empresa_id &&
        (payload.silo_cimento || payload.tanque_aditivo)
      ) {
        recipientesPatos = await this.getRecipientesEstoque(payload.empresa_id)
      }

      const recSilo = payload.silo_cimento
        ? recipientesPatos.find(
            (r) =>
              r.identificador === payload.silo_cimento ||
              r.nome
                .toLowerCase()
                .includes(payload.silo_cimento!.toLowerCase()),
          )
        : null
      const recTanque = payload.tanque_aditivo
        ? recipientesPatos.find(
            (r) =>
              r.identificador === payload.tanque_aditivo ||
              r.nome
                .toLowerCase()
                .includes(payload.tanque_aditivo!.toLowerCase()),
          )
        : null

      const obsMov =
        payload.carga_zerada && payload.motivo_zerada === "PERDA"
          ? `Perda operacional na batelada (${payload.volume_m3}m³)`
          : `Consumo na carga de ${payload.volume_m3}m³`

      if (payload.consumo_cimento > 0 && matCimento) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matCimento.id,
          recipiente_id: recSilo?.id || null,
          recipiente_nome: recSilo?.nome || null,
          tipo: "SAIDA",
          quantidade: payload.consumo_cimento,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: obsMov,
        })
      }
      if (payload.consumo_aditivo > 0 && matAditivo) {
        saídas.push({
          empresa_id: payload.empresa_id || null,
          material_id: matAditivo.id,
          recipiente_id: recTanque?.id || null,
          recipiente_nome: recTanque?.nome || null,
          tipo: "SAIDA",
          quantidade: payload.consumo_aditivo,
          data: payload.data,
          carga_id: carga.id,
          documento: docName,
          observacao: obsMov,
        })
      }

      // IMPORTANTE: Britas, Areia e Pó de Pedra NÃO geram movimentação de saída de estoque!

      if (saídas.length > 0) {
        await (supabase as any).from("movimentacoes_estoque").insert(saídas)
        if (recSilo && payload.consumo_cimento > 0) {
          await this.atualizarSaldoRecipiente(
            recSilo.id,
            -payload.consumo_cimento,
          )
        }
        if (recTanque && payload.consumo_aditivo > 0) {
          await this.atualizarSaldoRecipiente(
            recTanque.id,
            -payload.consumo_aditivo,
          )
        }
      }
    }

    return carga
  },

  // Cancelamento de cargas com ou sem estorno/retorno dos insumos ao estoque
  async cancelarCargas(payload: {
    cargasIds: string[]
    retornarEstoque: boolean
    motivo?: string
  }): Promise<{
    canceladas: number
    estornadas: number
  }> {
    const { cargasIds, retornarEstoque, motivo } = payload
    if (!cargasIds || !cargasIds.length) {
      return { canceladas: 0, estornadas: 0 }
    }

    // 1. Buscar as cargas selecionadas
    const { data: cargas, error: cargasErr } = await (supabase as any)
      .from("cargas")
      .select("*")
      .in("id", cargasIds)

    if (cargasErr) throw cargasErr
    if (!cargas || cargas.length === 0) {
      throw new Error("Nenhuma carga encontrada para cancelamento.")
    }

    // 2. Bloquear cancelamento se qualquer carga tiver Recibo/OS vinculada
    const { data: osVinculadas, error: osErr } = await (supabase as any)
      .from("ordens_servico")
      .select("id, numero_os, carga_id")
      .in("carga_id", cargasIds)

    if (osErr) throw osErr
    if (osVinculadas && osVinculadas.length > 0) {
      const numeros = osVinculadas
        .map((os: any) => `#${os.numero_os}`)
        .join(", ")
      throw new Error(
        `Cancelamento bloqueado: existem Recibos/OS vinculados às cargas selecionadas (${numeros}). Numeração de recibos é sequencial e protegida por integridade fiscal e operacional. Exclua ou desvincule o recibo antes se estritamente necessário.`,
      )
    }

    const agora = new Date().toISOString()
    const motivoFinal =
      motivo || "Cancelamento operacional via aba de cancelamento"

    // 3. Se retorno ao estoque solicitado: criar movimentações de ENTRADA do tipo ajuste para os consumos
    let movimentacoesCriadas = 0
    if (retornarEstoque) {
      // Buscar empresas únicas envolvidas
      const empresasIds = Array.from(
        new Set(cargas.map((c: any) => c.empresa_id).filter(Boolean)),
      ) as string[]

      // Carregar materiais e recipientes de todas as empresas envolvidas
      const materiaisPorEmpresa = new Map<string, Material[]>()
      const recipientesPorEmpresa = new Map<string, RecipienteEstoque[]>()

      for (const empId of empresasIds) {
        const [mats, recs] = await Promise.all([
          this.getMateriais(empId),
          this.getRecipientesEstoque(empId),
        ])
        materiaisPorEmpresa.set(empId, mats)
        recipientesPorEmpresa.set(empId, recs)
      }

      const novasMovimentacoes: any[] = []
      const deltasRecipientes = new Map<string, number>()

      for (const carga of cargas) {
        const empId = carga.empresa_id
        const mats = empId ? materiaisPorEmpresa.get(empId) || [] : []
        const recs = empId ? recipientesPorEmpresa.get(empId) || [] : []

        const matCimento = mats.find((m) => m.codigo === "cimento")
        const matAditivo = mats.find((m) => m.codigo === "aditivo")
        const matAreia = mats.find((m) => m.codigo === "areia")
        const matBrita12 = mats.find((m) => m.codigo === "brita12")
        const matBrita19 = mats.find((m) => m.codigo === "brita19")
        const matPo = mats.find((m) => m.codigo === "po_pedra")
        const matAgua = mats.find((m) => m.codigo === "agua")

        // Para cargas de Patos: silo_cimento e tanque_aditivo gravados na carga
        const recSilo = carga.silo_cimento
          ? recs.find(
              (r) =>
                r.identificador === carga.silo_cimento ||
                r.nome.toLowerCase().includes(carga.silo_cimento.toLowerCase()),
            )
          : null

        const recTanque = carga.tanque_aditivo
          ? recs.find(
              (r) =>
                r.identificador === carga.tanque_aditivo ||
                r.nome
                  .toLowerCase()
                  .includes(carga.tanque_aditivo.toLowerCase()),
            )
          : null

        const docCancelamento = `CANCEL-CARGA-${String(carga.numero_carga).padStart(5, "0")}`
        const obsCancelamento = `Estorno de insumos por cancelamento da carga #${carga.numero_carga}`
        const dataEstorno = carga.data || agora.slice(0, 10)

        const insumosParaEstornar = [
          {
            mat: matCimento,
            qtd: Number(carga.consumo_cimento) || 0,
            rec: recSilo,
          },
          {
            mat: matAditivo,
            qtd: Number(carga.consumo_aditivo) || 0,
            rec: recTanque,
          },
          {
            mat: matAreia,
            qtd: Number(carga.consumo_areia) || 0,
            rec: null,
          },
          {
            mat: matBrita12,
            qtd: Number(carga.consumo_brita12) || 0,
            rec: null,
          },
          {
            mat: matBrita19,
            qtd: Number(carga.consumo_brita19) || 0,
            rec: null,
          },
          {
            mat: matPo,
            qtd: Number(carga.consumo_po_pedra) || 0,
            rec: null,
          },
          {
            mat: matAgua,
            qtd: Number(carga.consumo_agua) || 0,
            rec: null,
          },
        ]

        for (const ins of insumosParaEstornar) {
          if (ins.mat && ins.qtd > 0) {
            novasMovimentacoes.push({
              empresa_id: empId || null,
              material_id: ins.mat.id,
              recipiente_id: ins.rec?.id || null,
              recipiente_nome: ins.rec?.nome || null,
              tipo: "ENTRADA",
              quantidade: ins.qtd,
              data: dataEstorno,
              carga_id: carga.id,
              documento: docCancelamento,
              observacao: obsCancelamento,
            })

            if (ins.rec) {
              const deltaAtual = deltasRecipientes.get(ins.rec.id) || 0
              deltasRecipientes.set(ins.rec.id, deltaAtual + ins.qtd)
            }
          }
        }
      }

      if (novasMovimentacoes.length > 0) {
        const { error: insMovErr } = await (supabase as any)
          .from("movimentacoes_estoque")
          .insert(novasMovimentacoes)
        if (insMovErr) throw insMovErr
        movimentacoesCriadas = novasMovimentacoes.length
      }

      // Creditar saldos dos recipientes
      for (const [recId, delta] of deltasRecipientes.entries()) {
        await this.atualizarSaldoRecipiente(recId, delta)
      }
    }

    // 4. Soft delete na tabela de cargas: cancelada = true, cancelada_em = agora
    const { error: updErr } = await (supabase as any)
      .from("cargas")
      .update({
        cancelada: true,
        cancelada_em: agora,
        motivo_cancelamento: motivoFinal,
        carga_zerada: true, // Garante que relatórios legados e dashboards que usam carga_zerada também tratem como cancelada
      })
      .in("id", cargasIds)

    if (updErr) throw updErr

    return {
      canceladas: cargas.length,
      estornadas: movimentacoesCriadas,
    }
  },

  // Reabertura de carga cancelada (Apenas Administrador)
  // Retorna ao status normal (cancelada: false, cancelada_em: null, carga_zerada: false).
  // Se foi cancelada COM retorno de estoque (havia movimentação de entrada/estorno gerada),
  // debita de volta na reabertura sem duplicar movimentação.
  async reabrirCarga(cargaId: string): Promise<Carga> {
    // 1. Buscar a carga
    const { data: carga, error: cargaErr } = await (supabase as any)
      .from("cargas")
      .select("*")
      .eq("id", cargaId)
      .single()

    if (cargaErr) throw cargaErr
    if (!carga) {
      throw new Error("Carga não encontrada para reabertura.")
    }

    if (!carga.cancelada) {
      throw new Error("Esta carga já está ativa e não se encontra cancelada.")
    }

    const agora = new Date().toISOString()
    const docCancel = `CANCEL-CARGA-${String(carga.numero_carga).padStart(5, "0")}`
    const docCancelOld = `CANCELAMENTO-${carga.numero_carga}`
    const dataMov = carga.data || agora.slice(0, 10)

    // 2. Verificar se houve retorno de estoque no cancelamento
    // Critérios:
    // a) Movimentações de ENTRADA vinculadas diretamente a carga_id
    // b) Movimentações de ENTRADA com documento do cancelamento desta carga
    const { data: movsEstorno } = await (supabase as any)
      .from("movimentacoes_estoque")
      .select("*")
      .eq("tipo", "ENTRADA")
      .or(
        `carga_id.eq.${cargaId},documento.eq.${docCancel},documento.eq.${docCancelOld}`,
      )

    const houveEstornoEstoque =
      (movsEstorno && movsEstorno.length > 0) ||
      (typeof carga.motivo_cancelamento === "string" &&
        carga.motivo_cancelamento.toLowerCase().includes("retorno dos insumos"))

    // 3. Se houve estorno no cancelamento (insumos voltaram para o estoque):
    // Na reabertura, a carga volta a consumir estoque.
    // Para não duplicar nem perder histórico, removemos os estornos de entrada (ou debitamos se não puder remover)
    // e garantimos que exista a saída normal de estoque (CARGA-XXXXX) vinculada a ela.
    if (houveEstornoEstoque) {
      // Se encontramos as movimentações de ENTRADA de estorno, apagamos as entradas do estorno
      // e ajustamos os saldos dos recipientes para baixo
      if (movsEstorno && movsEstorno.length > 0) {
        for (const mov of movsEstorno) {
          if (mov.recipiente_id && Number(mov.quantidade) > 0) {
            await this.atualizarSaldoRecipiente(
              mov.recipiente_id,
              -Number(mov.quantidade),
            )
          }
        }
        const idsParaDeletar = movsEstorno.map((m: any) => m.id)
        await (supabase as any)
          .from("movimentacoes_estoque")
          .delete()
          .in("id", idsParaDeletar)
      } else {
        // Se as entradas não foram encontradas como linhas separadas, verifica se existem saídas ativas
        const { data: saídasExistentes } = await (supabase as any)
          .from("movimentacoes_estoque")
          .select("id")
          .eq("carga_id", cargaId)
          .eq("tipo", "SAIDA")

        if (!saídasExistentes || saídasExistentes.length === 0) {
          // Gerar a saída de consumo correspondente
          const empresaId = carga.empresa_id
          const materiais = await this.getMateriais(empresaId)
          const matCimento = materiais.find((m) => m.codigo === "cimento")
          const matAditivo = materiais.find((m) => m.codigo === "aditivo")
          const docName = `CARGA-${String(carga.numero_carga).padStart(5, "0")}`
          const saídas: any[] = []

          let recipientesPatos: RecipienteEstoque[] = []
          if (empresaId && (carga.silo_cimento || carga.tanque_aditivo)) {
            recipientesPatos = await this.getRecipientesEstoque(empresaId)
          }

          const recSilo = carga.silo_cimento
            ? recipientesPatos.find(
                (r) =>
                  r.identificador === carga.silo_cimento ||
                  r.nome
                    .toLowerCase()
                    .includes(carga.silo_cimento.toLowerCase()),
              )
            : null
          const recTanque = carga.tanque_aditivo
            ? recipientesPatos.find(
                (r) =>
                  r.identificador === carga.tanque_aditivo ||
                  r.nome
                    .toLowerCase()
                    .includes(carga.tanque_aditivo.toLowerCase()),
              )
            : null

          const consumoCimento = Number(carga.consumo_cimento) || 0
          const consumoAditivo = Number(carga.consumo_aditivo) || 0

          if (consumoCimento > 0 && matCimento) {
            saídas.push({
              empresa_id: empresaId || null,
              material_id: matCimento.id,
              recipiente_id: recSilo?.id || null,
              recipiente_nome: recSilo?.nome || null,
              tipo: "SAIDA",
              quantidade: consumoCimento,
              data: dataMov,
              carga_id: carga.id,
              documento: docName,
              observacao: `Consumo na carga de ${carga.volume_m3}m³ (reaberta pelo admin)`,
            })
            if (recSilo) {
              await this.atualizarSaldoRecipiente(recSilo.id, -consumoCimento)
            }
          }

          if (consumoAditivo > 0 && matAditivo) {
            saídas.push({
              empresa_id: empresaId || null,
              material_id: matAditivo.id,
              recipiente_id: recTanque?.id || null,
              recipiente_nome: recTanque?.nome || null,
              tipo: "SAIDA",
              quantidade: consumoAditivo,
              data: dataMov,
              carga_id: carga.id,
              documento: docName,
              observacao: `Consumo na carga de ${carga.volume_m3}m³ (reaberta pelo admin)`,
            })
            if (recTanque) {
              await this.atualizarSaldoRecipiente(recTanque.id, -consumoAditivo)
            }
          }

          if (saídas.length > 0) {
            await (supabase as any).from("movimentacoes_estoque").insert(saídas)
          }
        }
      }
    }

    // 4. Limpar flags de cancelamento na carga
    const obsAtual = carga.observacao || ""
    const obsLimpa = obsAtual
      .replace(/\[PERDA OPERACIONAL\]/gi, "")
      .replace(/\[CANCELADA\]/gi, "")
      .trim()

    const { data: cargaReaberta, error: updErr } = await (supabase as any)
      .from("cargas")
      .update({
        cancelada: false,
        cancelada_em: null,
        motivo_cancelamento: null,
        carga_zerada: false,
        observacao: obsLimpa || null,
      })
      .eq("id", cargaId)
      .select()
      .single()

    if (updErr) throw updErr

    return cargaReaberta as Carga
  },

  // Exclusão definitiva de carga com integridade e registro na movimentação (Apenas Administrador)
  // Registra nas movimentações de estoque que foi exclusão manual do admin antes de desvincular/remover.
  async excluirCargaDefinitivo(
    cargaId: string,
    usuarioAdminNome?: string,
  ): Promise<void> {
    // 1. Buscar dados da carga antes de excluir
    const { data: carga, error: cargaErr } = await (supabase as any)
      .from("cargas")
      .select("*")
      .eq("id", cargaId)
      .single()

    if (cargaErr) throw cargaErr
    if (!carga) {
      throw new Error("Carga não encontrada para exclusão.")
    }

    // 2. Se houver Recibo/OS vinculado, desvincular ou deletar com aviso
    const { data: osVinculada } = await (supabase as any)
      .from("ordens_servico")
      .select("id, numero_os")
      .eq("carga_id", cargaId)
      .maybeSingle()

    if (osVinculada) {
      // Desvincular carga_id da OS para preservar o registro sequencial do recibo sem violar FK
      await (supabase as any)
        .from("ordens_servico")
        .update({
          carga_id: null,
          observacoes: `[Carga #${carga.numero_carga} excluída definitivamente pelo Admin ${usuarioAdminNome || ""}]`,
        })
        .eq("id", osVinculada.id)
    }

    // 3. Buscar movimentações existentes vinculadas à carga
    const { data: movs } = await (supabase as any)
      .from("movimentacoes_estoque")
      .select("*")
      .eq("carga_id", cargaId)

    // Se houver recipientes afetados por saídas da carga, repor o saldo (estornar saída)
    if (movs && movs.length > 0) {
      for (const m of movs) {
        if (m.recipiente_id && Number(m.quantidade) > 0) {
          const delta =
            m.tipo === "SAIDA" ? Number(m.quantidade) : -Number(m.quantidade)
          await this.atualizarSaldoRecipiente(m.recipiente_id, delta)
        }
      }

      // Inserir registro de auditoria na movimentação informando que foi exclusão manual do admin
      const agora = new Date().toISOString()
      const dataHoje = carga.data || agora.slice(0, 10)
      const matCimentoId = movs.find((m: any) => m.tipo === "SAIDA")
        ?.material_id

      if (matCimentoId) {
        await (supabase as any).from("movimentacoes_estoque").insert({
          empresa_id: carga.empresa_id || null,
          material_id: matCimentoId,
          tipo: "AJUSTE",
          quantidade: 0,
          data: dataHoje,
          carga_id: null,
          documento: `EXCLUSAO-CARGA-${String(carga.numero_carga).padStart(5, "0")}`,
          observacao: `Exclusão manual definitiva da carga #${carga.numero_carga} (${carga.volume_m3}m³) realizada pelo administrador ${usuarioAdminNome || "Admin"}`,
        })
      }

      // Deletar as movimentações vinculadas à carga
      await (supabase as any)
        .from("movimentacoes_estoque")
        .delete()
        .eq("carga_id", cargaId)
    }

    // 4. Deletar a carga do banco de dados definitivamente
    const { error: delErr } = await (supabase as any)
      .from("cargas")
      .delete()
      .eq("id", cargaId)

    if (delErr) throw delErr
  },

  // Exclusão de carga com integridade fiscal e estorno de estoque (Apenas Administrador)
  async excluirCarga(cargaId: string): Promise<void> {
    // 1. Verifica se existe Ordem de Serviço / Recibo vinculado a esta carga
    const { data: osVinculada, error: osErr } = await (supabase as any)
      .from("ordens_servico")
      .select("id, numero_os")
      .eq("carga_id", cargaId)
      .maybeSingle()

    if (osErr) throw osErr

    if (osVinculada) {
      throw new Error(
        `Não é possível excluir esta carga pois o Recibo/OS Nº ${osVinculada.numero_os} está vinculado a ela. A numeração de recibos é sequencial e protegida por integridade fiscal e operacional.`,
      )
    }

    // 2. Estorna/deleta movimentações de estoque vinculadas a esta carga
    const { error: movErr } = await (supabase as any)
      .from("movimentacoes_estoque")
      .delete()
      .eq("carga_id", cargaId)

    if (movErr) throw movErr

    // 3. Deleta o registro da carga
    const { error: cargaErr } = await (supabase as any)
      .from("cargas")
      .delete()
      .eq("id", cargaId)

    if (cargaErr) throw cargaErr
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
  }): Promise<{
    carga: Carga
    ordemServico: OrdemServico
  }> {
    const empresaId = payload.carga.empresa_id!
    // 1. Criar a Carga
    const carga = await this.criarCarga(payload.carga)

    // 2. Obter próximo número sequencial da OS para a empresa
    const proximoNumOS = await this.getProximoNumeroOS(empresaId)

    // 3. Montar itens da OS (discriminando o traço e volume)
    const discriminacao =
      payload.entrega.discriminacao_produto ||
      payload.carga.traco_nome ||
      "CONCRETO USINADO"

    const itens = [
      {
        quantidade: Number(payload.carga.volume_m3) || 8.0,
        unidade: "m3",
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
        material: "Cimento",
        quantidade: payload.carga.consumo_cimento,
        unidade: "kg",
      },
      {
        material: "Aditivo",
        quantidade: payload.carga.consumo_aditivo,
        unidade: "L",
      },
      {
        material: "Água",
        quantidade: payload.carga.consumo_agua || 0,
        unidade: "L",
      },
      {
        material: "Areia",
        quantidade: payload.carga.consumo_areia,
        unidade: "kg",
      },
      {
        material: "Brita 12",
        quantidade: payload.carga.consumo_brita12,
        unidade: "kg",
      },
      {
        material: "Brita 19",
        quantidade: payload.carga.consumo_brita19,
        unidade: "kg",
      },
      {
        material: "Pó de Pedra",
        quantidade: payload.carga.consumo_po_pedra,
        unidade: "kg",
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
          payload.entrega.destinatario_nome || "CONSUMIDOR FINAL",
        destinatario_cpf_cnpj: payload.entrega.destinatario_cpf_cnpj || null,
        destinatario_telefone: payload.entrega.destinatario_telefone || null,
        destinatario_endereco: payload.entrega.destinatario_endereco || null,
        destinatario_bairro: payload.entrega.destinatario_bairro || null,
        destinatario_cidade:
          payload.entrega.destinatario_cidade ||
          payload.carga.cidade_nome ||
          null,
        destinatario_uf: payload.entrega.destinatario_uf || "PB",
        destinatario_cep: payload.entrega.destinatario_cep || null,
        nome_obra: payload.entrega.nome_obra || null,
        local_descarga: payload.entrega.local_descarga || null,
        itens,
        exibir_insumos_os: payload.entrega.exibir_insumos_os ?? true,
        insumos_detalhados: insumosDetalhados,
        slump_central_medido: payload.entrega.slump_central_medido || null,
        slump_central_saida: payload.entrega.slump_central_saida || null,
        slump_tolerancia: payload.entrega.slump_tolerancia || "+-2",
        agua_adic_central: 0,
        moldagem_central: payload.entrega.moldagem_central || "SIM",
        visto_motorista_central:
          payload.entrega.visto_motorista_central ||
          payload.carga.motorista_nome ||
          null,
        slump_peca_medido: payload.entrega.slump_peca_medido || null,
        slump_peca_saida: payload.entrega.slump_peca_saida || null,
        peca_concretada: payload.entrega.peca_concretada || "PISO / ESTRUTURAL",
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
      .from("precos_material")
      .select("*")
      .order("mes_ano", { ascending: true })

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
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
      .from("precos_material")
      .upsert(
        {
          empresa_id: payload.empresa_id || null,
          material_codigo: payload.material_codigo,
          mes_ano: payload.mes_ano,
          preco_unitario: payload.preco_unitario,
          unidade: payload.unidade || "kg",
        },
        { onConflict: "empresa_id, material_codigo, mes_ano" },
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
      .from("empresas")
      .select("*")
      .eq("ativo", true)
      .order("nome")

    if (empErr) throw empErr

    // Busca todas as cargas no período sem filtrar por empresa
    let cargasQuery = (supabase as any).from("cargas").select("*")
    if (filtros?.dataInicio)
      cargasQuery = cargasQuery.gte("data", filtros.dataInicio)
    if (filtros?.dataFim) cargasQuery = cargasQuery.lte("data", filtros.dataFim)

    const { data: todasCargas, error: crgErr } = await cargasQuery
    if (crgErr) throw crgErr

    // Busca todos os preços e materiais cadastrados de todas as empresas
    const [
      { data: todosPrecos, error: prcErr },
      { data: todosMateriais, error: matErr },
    ] = await Promise.all([
      (supabase as any).from("precos_material").select("*"),
      (supabase as any).from("materiais").select("*"),
    ])
    if (prcErr) throw prcErr
    if (matErr) throw matErr

    const listaCargas = (todasCargas || []) as Carga[]
    const listaPrecos = (todosPrecos || []) as PrecoMaterial[]
    const listaMateriais = (todosMateriais || []) as Material[]

    const unidades: ComparativoUnidade[] = (empresas || []).map((emp: any) => {
      const cargasEmpresa = listaCargas.filter((c) => c.empresa_id === emp.id)
      const precosEmpresa = listaPrecos.filter((p) => p.empresa_id === emp.id)
      const materiaisEmpresa = listaMateriais.filter(
        (m) => m.empresa_id === emp.id,
      )

      // Densidades reais com fallback para conversão kg -> m³
      // Fallbacks padrão: brita12 = 1.38 t/m³, brita19 = 1.44 t/m³, areia = 1.50 t/m³
      const matBrita12 = materiaisEmpresa.find((m) => m.codigo === "brita12")
      const matBrita19 = materiaisEmpresa.find((m) => m.codigo === "brita19")
      const matAreia = materiaisEmpresa.find((m) => m.codigo === "areia")

      const densidadeBrita12 =
        matBrita12 && Number(matBrita12.densidade) > 0
          ? Number(matBrita12.densidade)
          : 1.38
      const densidadeBrita19 =
        matBrita19 && Number(matBrita19.densidade) > 0
          ? Number(matBrita19.densidade)
          : 1.44
      const densidadeAreia =
        matAreia && Number(matAreia.densidade) > 0
          ? Number(matAreia.densidade)
          : 1.5

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
      const tracosMap: Record<string, {
        tracoNome: string
        volume: number
        cargas: number
        custoTotal: number
      }> = {}

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
        const tNome = c.traco_nome || "Não identificado"
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
        densidades: {
          areia: densidadeAreia,
          brita12: densidadeBrita12,
          brita19: densidadeBrita19,
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
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true })

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async atualizarCliente(
    id: string,
    dados: Partial<Cliente>,
    empresaId?: string,
  ): Promise<Cliente> {
    return this.salvarCliente({ ...dados, id }, empresaId)
  },

  async salvarCliente(
    cliente: Partial<Cliente>,
    empresaId?: string,
  ): Promise<Cliente> {
    if (cliente.id) {
      const { data, error } = await (supabase as any)
        .from("clientes")
        .update({
          tipo: cliente.tipo || "PJ",
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
          uf: cliente.uf || "PB",
          observacoes: cliente.observacoes || null,
          ativo: cliente.ativo ?? true,
          exibir_insumos_os: cliente.exibir_insumos_os ?? true,
          ...(empresaId ? { empresa_id: empresaId } : {}),
        })
        .eq("id", cliente.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from("clientes")
        .insert({
          empresa_id: empresaId || cliente.empresa_id,
          tipo: cliente.tipo || "PJ",
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
          uf: cliente.uf || "PB",
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

  async excluirCliente(id: string, empresaId?: string): Promise<void> {
    // 1. Verificar vínculos com ordens de serviço
    let queryOs = (supabase as any)
      .from("ordens_servico")
      .select("numero_os", { count: "exact" })
      .eq("cliente_id", id)
    if (empresaId) queryOs = queryOs.eq("empresa_id", empresaId)
    const { count: totalOs, error: errOs } = await queryOs
    if (errOs) throw errOs
    if (totalOs && totalOs > 0) {
      throw new Error(
        `Não é possível excluir este cliente porque existem ${totalOs} Ordem(ns) de Serviço vinculada(s). Para preservar o histórico operacional e fiscal, desative o cadastro em vez de excluir.`,
      )
    }

    let queryDel = (supabase as any).from("clientes").delete().eq("id", id)
    if (empresaId) queryDel = queryDel.eq("empresa_id", empresaId)
    const { error } = await queryDel
    if (error) throw error
  },

  async excluirMotorista(id: string, empresaId?: string): Promise<void> {
    // 1. Obter nome do motorista para checar vínculos por ID ou por nome nas cargas
    const { data: mot } = await (supabase as any)
      .from("motoristas")
      .select("nome")
      .eq("id", id)
      .maybeSingle()

    // 2. Verificar cargas vinculadas por motorista_id
    let queryCargasId = (supabase as any)
      .from("cargas")
      .select("id", { count: "exact", head: true })
      .eq("motorista_id", id)
    if (empresaId) queryCargasId = queryCargasId.eq("empresa_id", empresaId)
    const { count: countCargasId } = await queryCargasId

    // Também verificar por motorista_nome se existir
    let countCargasNome = 0
    if (mot?.nome) {
      let queryCargasNome = (supabase as any)
        .from("cargas")
        .select("id", { count: "exact", head: true })
        .eq("motorista_nome", mot.nome)
      if (empresaId)
        queryCargasNome = queryCargasNome.eq("empresa_id", empresaId)
      const { count } = await queryCargasNome
      countCargasNome = count || 0
    }

    const totalCargas = Math.max(countCargasId || 0, countCargasNome)
    if (totalCargas > 0) {
      throw new Error(
        `Não é possível excluir o motorista porque existem ${totalCargas} carga(s) expedida(s) associada(s) a ele. Recomendamos desativar o motorista para manter os relatórios operacionais intactos.`,
      )
    }

    // 3. Excluir motorista
    let queryDel = (supabase as any).from("motoristas").delete().eq("id", id)
    if (empresaId) queryDel = queryDel.eq("empresa_id", empresaId)
    const { error } = await queryDel
    if (error) throw error
  },

  async excluirVeiculo(id: string, empresaId?: string): Promise<void> {
    // 1. Obter placa do veículo para checar vínculos
    const { data: vei } = await (supabase as any)
      .from("veiculos")
      .select("placa")
      .eq("id", id)
      .maybeSingle()

    // 2. Verificar cargas vinculadas por veiculo_id
    let queryCargasId = (supabase as any)
      .from("cargas")
      .select("id", { count: "exact", head: true })
      .eq("veiculo_id", id)
    if (empresaId) queryCargasId = queryCargasId.eq("empresa_id", empresaId)
    const { count: countCargasId } = await queryCargasId

    let countCargasPlaca = 0
    if (vei?.placa) {
      let queryCargasPlaca = (supabase as any)
        .from("cargas")
        .select("id", { count: "exact", head: true })
        .eq("veiculo_placa", vei.placa)
      if (empresaId)
        queryCargasPlaca = queryCargasPlaca.eq("empresa_id", empresaId)
      const { count } = await queryCargasPlaca
      countCargasPlaca = count || 0
    }

    const totalCargas = Math.max(countCargasId || 0, countCargasPlaca)
    if (totalCargas > 0) {
      throw new Error(
        `Não é possível excluir o veículo placa "${vei?.placa || ""}" porque existem ${totalCargas} carga(s) associada(s) a ele. Desative o veículo para manter o histórico da frota.`,
      )
    }

    let queryDel = (supabase as any).from("veiculos").delete().eq("id", id)
    if (empresaId) queryDel = queryDel.eq("empresa_id", empresaId)
    const { error } = await queryDel
    if (error) throw error
  },

  async excluirCidade(id: string, empresaId?: string): Promise<void> {
    const { data: cid } = await (supabase as any)
      .from("cidades")
      .select("nome")
      .eq("id", id)
      .maybeSingle()

    let queryCargasId = (supabase as any)
      .from("cargas")
      .select("id", { count: "exact", head: true })
      .eq("cidade_id", id)
    if (empresaId) queryCargasId = queryCargasId.eq("empresa_id", empresaId)
    const { count: countCargasId } = await queryCargasId

    let countCargasNome = 0
    if (cid?.nome) {
      let queryCargasNome = (supabase as any)
        .from("cargas")
        .select("id", { count: "exact", head: true })
        .eq("cidade_nome", cid.nome)
      if (empresaId)
        queryCargasNome = queryCargasNome.eq("empresa_id", empresaId)
      const { count } = await queryCargasNome
      countCargasNome = count || 0
    }

    const totalCargas = Math.max(countCargasId || 0, countCargasNome)
    if (totalCargas > 0) {
      throw new Error(
        `Não é possível excluir a cidade "${cid?.nome || ""}" porque constam ${totalCargas} carga(s) expedida(s) para este destino.`,
      )
    }

    let queryDel = (supabase as any).from("cidades").delete().eq("id", id)
    if (empresaId) queryDel = queryDel.eq("empresa_id", empresaId)
    const { error } = await queryDel
    if (error) throw error
  },

  async excluirMaterial(id: string, empresaId?: string): Promise<void> {
    const { data: mat } = await (supabase as any)
      .from("materiais")
      .select("codigo, nome")
      .eq("id", id)
      .maybeSingle()

    if (!mat) {
      throw new Error("Insumo não encontrado.")
    }

    // 1. Checar movimentações de estoque
    let queryMov = (supabase as any)
      .from("movimentacoes_estoque")
      .select("id", { count: "exact", head: true })
      .eq("material_id", id)
    if (empresaId) queryMov = queryMov.eq("empresa_id", empresaId)
    const { count: countMov } = await queryMov
    if (countMov && countMov > 0) {
      throw new Error(
        `Não é possível excluir o insumo "${mat.nome}" pois existem ${countMov} movimentação(ões) de estoque registradas.`,
      )
    }

    // 2. Checar se o código é um dos pilares do sistema (cimento, aditivo, etc.)
    const insumosBasicos = [
      "cimento",
      "aditivo",
      "areia",
      "brita12",
      "brita19",
      "po_pedra",
      "agua",
    ]
    if (insumosBasicos.includes(mat.codigo)) {
      // Checar se existem cargas no sistema usando esse insumo
      const colMap: Record<string, string> = {
        cimento: "consumo_cimento",
        aditivo: "consumo_aditivo",
        areia: "consumo_areia",
        brita12: "consumo_brita12",
        brita19: "consumo_brita19",
        po_pedra: "consumo_po_pedra",
        agua: "consumo_agua",
      }
      const col = colMap[mat.codigo]
      if (col) {
        let qCargas = (supabase as any)
          .from("cargas")
          .select("id", { count: "exact", head: true })
          .gt(col, 0)
        if (empresaId) qCargas = qCargas.eq("empresa_id", empresaId)
        const { count: countCargas } = await qCargas
        if (countCargas && countCargas > 0) {
          throw new Error(
            `Não é possível excluir o insumo fundamental "${mat.nome}" pois ele está em uso em ${countCargas} carga(s).`,
          )
        }
      }
    }

    // 3. Excluir histórico de preços correspondente
    if (mat.codigo) {
      let qPreco = (supabase as any)
        .from("precos_material")
        .delete()
        .eq("material_codigo", mat.codigo)
      if (empresaId) qPreco = qPreco.eq("empresa_id", empresaId)
      await qPreco
    }

    let queryDel = (supabase as any).from("materiais").delete().eq("id", id)
    if (empresaId) queryDel = queryDel.eq("empresa_id", empresaId)
    const { error } = await queryDel
    if (error) throw error
  },

  async excluirTraco(id: string, empresaId?: string): Promise<void> {
    const { data: traco } = await (supabase as any)
      .from("tracos")
      .select("nome")
      .eq("id", id)
      .maybeSingle()

    let queryCargasId = (supabase as any)
      .from("cargas")
      .select("id", { count: "exact", head: true })
      .eq("traco_id", id)
    if (empresaId) queryCargasId = queryCargasId.eq("empresa_id", empresaId)
    const { count: countCargasId } = await queryCargasId

    let countCargasNome = 0
    if (traco?.nome) {
      let queryCargasNome = (supabase as any)
        .from("cargas")
        .select("id", { count: "exact", head: true })
        .eq("traco_nome", traco.nome)
      if (empresaId)
        queryCargasNome = queryCargasNome.eq("empresa_id", empresaId)
      const { count } = await queryCargasNome
      countCargasNome = count || 0
    }

    const totalCargas = Math.max(countCargasId || 0, countCargasNome)
    if (totalCargas > 0) {
      throw new Error(
        `Não é possível excluir o traço "${traco?.nome || ""}" porque existem ${totalCargas} carga(s) expedida(s) com esta receita. Desative o traço para mantê-lo fora de novas seleções sem corromper o histórico.`,
      )
    }

    let queryDel = (supabase as any).from("tracos").delete().eq("id", id)
    if (empresaId) queryDel = queryDel.eq("empresa_id", empresaId)
    const { error } = await queryDel
    if (error) throw error
  },

  async excluirMetaProducao(empresaId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("metas_producao")
      .delete()
      .eq("empresa_id", empresaId)
    if (error) throw error
  },

  async excluirUsuarioApp(
    id: string,
    usuarioLogadoEmail?: string,
  ): Promise<void> {
    // 1. Obter dados do usuário a ser excluído
    const { data: userApp, error: errGet } = await (supabase as any)
      .from("usuarios_app")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (errGet) throw errGet
    if (!userApp) throw new Error("Usuário não encontrado.")

    // 2. Não permitir que o usuário exclua a si mesmo
    if (
      usuarioLogadoEmail &&
      userApp.email.trim().toLowerCase() ===
        usuarioLogadoEmail.trim().toLowerCase()
    ) {
      throw new Error(
        "Você não pode excluir seu próprio usuário logado. Solicite a outro Administrador se necessário.",
      )
    }

    // 3. Garantir que permanece pelo menos um Administrador ativo no sistema
    if (userApp.perfil === "administrador") {
      const { data: outrosAdmins } = await (supabase as any)
        .from("usuarios_app")
        .select("id")
        .eq("perfil", "administrador")
        .neq("id", id)
        .eq("ativo", true)
      if (!outrosAdmins || outrosAdmins.length === 0) {
        throw new Error(
          "Não é possível excluir este usuário pois ele é o único Administrador ativo no sistema.",
        )
      }
    }

    // 4. Executar exclusão da tabela usuarios_app
    const { error } = await (supabase as any)
      .from("usuarios_app")
      .delete()
      .eq("id", id)
    if (error) throw error
  },

  // =========================================================
  // Ordens de Serviço / Recibos
  // =========================================================
  async getOrdensServico(empresaId?: string): Promise<OrdemServico[]> {
    let query = (supabase as any)
      .from("ordens_servico")
      .select("*")
      .order("numero_os", { ascending: false })

    if (empresaId) {
      query = query.eq("empresa_id", empresaId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getOrdemServicoPorId(id: string): Promise<OrdemServico | null> {
    const { data, error } = await (supabase as any)
      .from("ordens_servico")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data || null
  },

  async getProximoNumeroOS(empresaId: string): Promise<number> {
    const { data, error } = await (supabase as any).rpc("proximo_numero_os", {
      p_empresa_id: empresaId,
    })
    if (error) {
      // Fallback em caso de erro na RPC
      const { data: ultimas } = await (supabase as any)
        .from("ordens_servico")
        .select("numero_os")
        .eq("empresa_id", empresaId)
        .order("numero_os", { ascending: false })
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
      data_emissao: os.data_emissao || new Date().toISOString().split("T")[0],
      cliente_id: os.cliente_id || null,
      carga_id: os.carga_id || null,
      destinatario_nome: os.destinatario_nome,
      destinatario_cpf_cnpj: os.destinatario_cpf_cnpj || null,
      destinatario_telefone: os.destinatario_telefone || null,
      destinatario_endereco: os.destinatario_endereco || null,
      destinatario_bairro: os.destinatario_bairro || null,
      destinatario_cidade: os.destinatario_cidade || null,
      destinatario_uf: os.destinatario_uf || "PB",
      destinatario_cep: os.destinatario_cep || null,
      nome_obra: os.nome_obra || null,
      local_descarga: os.local_descarga || null,
      itens: os.itens || [],
      exibir_insumos_os: os.exibir_insumos_os ?? true,
      insumos_detalhados: os.insumos_detalhados || [],
      slump_central_medido: os.slump_central_medido || null,
      slump_central_saida: os.slump_central_saida || null,
      slump_tolerancia: os.slump_tolerancia || "+-2",
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
        .from("ordens_servico")
        .update(payload)
        .eq("id", os.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from("ordens_servico")
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async excluirOrdemServico(_id: string): Promise<void> {
    throw new Error(
      "O Recibo/OS sequencial não pode ser excluído para não quebrar a sequência contínua de numeração da empresa.",
    )
  },

  // ==========================================
  // GESTÃO DE USUÁRIOS DO SISTEMA
  // ==========================================
  async listarUsuariosApp(): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from("usuarios_app")
      .select("*, empresas(id, nome, slug)")
      .order("nome", { ascending: true })

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
      .from("usuarios_app")
      .select("*, empresas(id, nome, slug)")
    if (userId) {
      const { data, error } = await query.eq("user_id", userId).maybeSingle()
      if (!error && data) {
        return {
          ...data,
          empresa_nome: data.empresas?.nome || null,
        }
      }
    }
    if (email) {
      const { data, error } = await (supabase as any)
        .from("usuarios_app")
        .select("*, empresas(id, nome, slug)")
        .eq("email", email.trim().toLowerCase())
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
      .from("usuarios_app")
      .select("*", { count: "exact", head: true })
    if (error) return 0
    return count || 0
  },

  async salvarUsuarioApp(dados: {
    id?: string
    user_id?: string | null
    nome: string
    email: string
    perfil: "administrador" | "balanceiro" | "gestor" | "auxiliar_adm"
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
      // Se houver alteração de e-mail na edição de usuário existente,
      // invoca a RPC que atualiza com segurança em auth.users, auth.identities e usuarios_app
      const emailNovo = payload.email
      const { data: resRpc, error: errRpc } = await (supabase as any).rpc(
        "atualizar_email_usuario",
        {
          p_usuario_app_id: dados.id,
          p_novo_email: emailNovo,
        },
      )
      if (errRpc) throw errRpc
      if (resRpc && resRpc.success === false) {
        throw new Error(resRpc.error || "Erro ao atualizar e-mail do usuário.")
      }

      // Atualiza os demais campos cadastrais
      const { data, error } = await (supabase as any)
        .from("usuarios_app")
        .update({
          nome: payload.nome,
          perfil: payload.perfil,
          empresa_id: payload.empresa_id,
          ativo: payload.ativo,
          updated_at: payload.updated_at,
        })
        .eq("id", dados.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from("usuarios_app")
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
      .from("usuarios_app")
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
  },

  async vincularAuthAUsuarioApp(userId: string, email: string): Promise<void> {
    await (supabase as any)
      .from("usuarios_app")
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("email", email.trim().toLowerCase())
      .is("user_id", null)
  },

  /**
   * Confirma o e-mail de um usuário de autenticação (auth.users)
   * Tenta via Edge Function Admin (Service Role) e fallback para RPC segura
   */
  async confirmarEmailAuthUsuario(userId: string, email?: string): Promise<{
    success: boolean
    message?: string
    error?: string
  }> {
    try {
      // 1. Tentar Edge Function dedicada
      const { data, error } = await supabase.functions.invoke(
        "confirmar-email-admin",
        {
          body: { userId, email },
        },
      )
      if (!error && data?.success) {
        return { success: true, message: data.message }
      }
      if (error) {
        console.warn(
          "Edge function confirmar-email-admin falhou, tentando fallback RPC:",
          error,
        )
      }
    } catch (e) {
      console.warn("Falha ao invocar edge function confirmar-email-admin:", e)
    }

    // 2. Fallback via RPC segura no banco
    try {
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        "confirmar_email_auth_usuario",
        {
          p_user_id: userId,
        },
      )
      if (rpcError) throw rpcError
      return rpcData || { success: true, message: "E-mail confirmado via RPC." }
    } catch (rpcErr: any) {
      return {
        success: false,
        error:
          rpcErr?.message || "Não foi possível confirmar o e-mail do usuário.",
      }
    }
  },

  // Importação em Lote de Cargas do Controle Diário (com deduplicação e auto-cadastro)
  async importarCargasControleDiario(
    empresaId: string,
    cargas: Array<{
      dataIso: string
      volume_m3: number
      consumo_brita12: number
      consumo_brita19: number
      consumo_areia: number
      consumo_po_pedra: number
      consumo_cimento: number
      consumo_aditivo: number
      motorista_nome: string | null
      veiculo_placa: string | null
      cidade_nome: string | null
      observacao: string | null
      carga_zerada: boolean
      dosagemM3: {
        brita12: number
        brita19: number
        areia: number
        po_pedra: number
        cimento: number
        aditivo: number
      }
      tracoChave: string
      tracoSugeridoNome: string
    }>,
    opcoes?: {
      deduplicar?: boolean
      gerarBaixaEstoque?: boolean
    },
  ): Promise<{
    importadas: number
    duplicadasIgnoradas: number
    motoristasCriados: number
    veiculosCriados: number
    cidadesCriadas: number
    tracosCriados: number
  }> {
    const deduplicar = opcoes?.deduplicar ?? true
    const gerarBaixa = opcoes?.gerarBaixaEstoque ?? true

    // 1. Carregar cadastros existentes da empresa para reaproveitar/vincular
    const [
      motoristasExistentes,
      veiculosExistentes,
      cidadesExistentes,
      tracosExistentes,
      cargasExistentes,
      materiaisExistentes,
    ] = await Promise.all([
      this.getMotoristas(empresaId),
      this.getVeiculos(empresaId),
      this.getCidades(empresaId),
      this.getTracos(empresaId),
      // Cargas existentes para deduplicação (data, volume, traco_nome ou consumo_cimento)
      deduplicar
        ? (supabase as any)
            .from("cargas")
            .select(
              "id, data, volume_m3, consumo_cimento, consumo_brita12, consumo_brita19, traco_nome",
            )
            .eq("empresa_id", empresaId)
            .then(({ data }: any) => (data || []) as any[])
        : Promise.resolve([]),
      gerarBaixa ? this.getMateriais(empresaId) : Promise.resolve([]),
    ])

    const motoristasMap = new Map<string, string>()
    motoristasExistentes.forEach((m) =>
      motoristasMap.set(m.nome.toUpperCase().trim(), m.id),
    )

    const veiculosMap = new Map<string, string>()
    veiculosExistentes.forEach((v) =>
      veiculosMap.set(v.placa.toUpperCase().trim(), v.id),
    )

    const cidadesMap = new Map<string, string>()
    cidadesExistentes.forEach((c) =>
      cidadesMap.set(c.nome.toUpperCase().trim(), c.id),
    )

    const tracosMap = new Map<string, {
      id: string
      nome: string
    }>()
    tracosExistentes.forEach((t) => {
      // Indexa tanto por nome quanto por combinação de dosagem
      tracosMap.set(t.nome.toLowerCase().trim(), { id: t.id, nome: t.nome })
      const keyDosagem = `${Math.round(Number(t.consumo_cimento))}_${Math.round(Number(t.consumo_brita12))}_${Math.round(Number(t.consumo_brita19))}_${Math.round(Number(t.consumo_areia))}_${Math.round(Number(t.consumo_po_pedra || 0))}`
      tracosMap.set(keyDosagem, { id: t.id, nome: t.nome })
    })

    let motoristasCriados = 0
    let veiculosCriados = 0
    let cidadesCriadas = 0
    let tracosCriados = 0

    // 2. Coletar nomes novos para cadastrar
    for (const c of cargas) {
      if (
        c.motorista_nome &&
        !motoristasMap.has(c.motorista_nome.toUpperCase().trim())
      ) {
        const nomeMot = c.motorista_nome.toUpperCase().trim()
        try {
          const novo = await this.salvarMotorista(
            nomeMot,
            true,
            undefined,
            empresaId,
          )
          if (novo?.id) {
            motoristasMap.set(nomeMot, novo.id)
            motoristasCriados++
          }
        } catch (e) {
          console.warn("Motorista já existente ou conflito:", nomeMot, e)
        }
      }

      if (
        c.veiculo_placa &&
        !veiculosMap.has(c.veiculo_placa.toUpperCase().trim())
      ) {
        const placa = c.veiculo_placa.toUpperCase().trim()
        try {
          const novo = await this.salvarVeiculo(
            placa,
            "Betoneira",
            true,
            undefined,
            empresaId,
          )
          if (novo?.id) {
            veiculosMap.set(placa, novo.id)
            veiculosCriados++
          }
        } catch (e) {
          console.warn("Veículo já existente ou conflito:", placa, e)
        }
      }

      if (
        c.cidade_nome &&
        !cidadesMap.has(c.cidade_nome.toUpperCase().trim())
      ) {
        const nomeCid = c.cidade_nome.toUpperCase().trim()
        try {
          const nova = await this.salvarCidade(
            nomeCid,
            "PB",
            undefined,
            empresaId,
          )
          if (nova?.id) {
            cidadesMap.set(nomeCid, nova.id)
            cidadesCriadas++
          }
        } catch (e) {
          console.warn("Cidade já existente ou conflito:", nomeCid, e)
        }
      }

      // Traços
      if (!c.carga_zerada) {
        const keyDosagem = `${Math.round(c.dosagemM3.cimento)}_${Math.round(c.dosagemM3.brita12)}_${Math.round(c.dosagemM3.brita19)}_${Math.round(c.dosagemM3.areia)}_${Math.round(c.dosagemM3.po_pedra || 0)}`
        if (
          !tracosMap.has(keyDosagem) &&
          !tracosMap.has(c.tracoSugeridoNome.toLowerCase().trim())
        ) {
          try {
            const novoTraco = await this.salvarTraco(
              {
                nome: c.tracoSugeridoNome,
                descricao: `Traço derivado do Controle Diário (Cimento: ${Math.round(c.dosagemM3.cimento)}kg/m³)`,
                fck_mpa:
                  c.dosagemM3.cimento >= 320
                    ? 30
                    : c.dosagemM3.cimento >= 280
                      ? 25
                      : 20,
                consumo_brita12: c.dosagemM3.brita12,
                consumo_brita19: c.dosagemM3.brita19,
                consumo_areia: c.dosagemM3.areia,
                consumo_po_pedra: c.dosagemM3.po_pedra,
                consumo_cimento: c.dosagemM3.cimento,
                consumo_aditivo: c.dosagemM3.aditivo,
                ativo: true,
              },
              empresaId,
            )
            if (novoTraco?.id) {
              const tracoObj = { id: novoTraco.id, nome: novoTraco.nome }
              tracosMap.set(keyDosagem, tracoObj)
              tracosMap.set(c.tracoSugeridoNome.toLowerCase().trim(), tracoObj)
              tracosCriados++
            }
          } catch (e) {
            console.warn(
              "Traço já existente ou conflito:",
              c.tracoSugeridoNome,
              e,
            )
          }
        }
      }
    }

    // 3. Obter próximo número sequencial de carga
    let proximoNum = await this.getProximoNumeroCarga(empresaId)

    // Mapa de deduplicação existente: data_volume_cimento_b12
    const cargasDedupSet = new Set<string>()
    cargasExistentes.forEach((cg) => {
      const sig = `${cg.data}_${Number(cg.volume_m3).toFixed(1)}_${Math.round(Number(cg.consumo_cimento))}_${Math.round(Number(cg.consumo_brita12))}`
      cargasDedupSet.add(sig)
    })

    // Materiais controlados para estoque (APENAS cimento e aditivo)
    const matCimento = materiaisExistentes.find((m) => m.codigo === "cimento")
    const matAditivo = materiaisExistentes.find((m) => m.codigo === "aditivo")

    let importadas = 0
    let duplicadasIgnoradas = 0

    // Ordenar cargas por data cronológica para numeração lógica
    const cargasOrdenadas = [...cargas].sort((a, b) =>
      a.dataIso.localeCompare(b.dataIso),
    )

    for (const c of cargasOrdenadas) {
      // Assinatura de deduplicação
      const sig = `${c.dataIso}_${Number(c.volume_m3).toFixed(1)}_${Math.round(c.consumo_cimento)}_${Math.round(c.consumo_brita12)}`
      if (deduplicar && cargasDedupSet.has(sig)) {
        duplicadasIgnoradas++
        continue
      }

      // Resolver vínculos
      const motId = c.motorista_nome
        ? motoristasMap.get(c.motorista_nome.toUpperCase().trim())
        : null
      const veicId = c.veiculo_placa
        ? veiculosMap.get(c.veiculo_placa.toUpperCase().trim())
        : null
      const cidId = c.cidade_nome
        ? cidadesMap.get(c.cidade_nome.toUpperCase().trim())
        : null

      const keyDosagem = `${Math.round(c.dosagemM3.cimento)}_${Math.round(c.dosagemM3.brita12)}_${Math.round(c.dosagemM3.brita19)}_${Math.round(c.dosagemM3.areia)}_${Math.round(c.dosagemM3.po_pedra || 0)}`
      const tracoInfo = c.carga_zerada
        ? null
        : tracosMap.get(keyDosagem) ||
          tracosMap.get(c.tracoSugeridoNome.toLowerCase().trim()) ||
          null

      const tracoNomeFinal = c.carga_zerada
        ? "Carga Zerada"
        : tracoInfo?.nome || c.tracoSugeridoNome

      const numeroCargaAtual = proximoNum++

      // Gravar carga
      const { data: cargaSalva, error: errCarga } = await (supabase as any)
        .from("cargas")
        .insert({
          empresa_id: empresaId,
          numero_carga: numeroCargaAtual,
          data: c.dataIso,
          volume_m3: c.volume_m3,
          traco_id: tracoInfo?.id || null,
          traco_nome: tracoNomeFinal,
          motorista_id: motId || null,
          motorista_nome: c.motorista_nome || null,
          veiculo_id: veicId || null,
          veiculo_placa: c.veiculo_placa || null,
          cidade_id: cidId || null,
          cidade_nome: c.cidade_nome || null,
          consumo_brita12: c.consumo_brita12,
          consumo_brita19: c.consumo_brita19,
          consumo_areia: c.consumo_areia,
          consumo_po_pedra: c.consumo_po_pedra,
          consumo_cimento: c.consumo_cimento,
          consumo_aditivo: c.consumo_aditivo,
          consumo_agua: 0,
          observacao:
            c.observacao || "Importado via planilha de Controle Diário",
          carga_zerada: c.carga_zerada,
        })
        .select()
        .single()

      if (errCarga) {
        console.error("Erro ao gravar carga na importação:", errCarga)
        continue
      }

      // Adiciona ao set de deduplicação caso haja repetições no próprio arquivo
      cargasDedupSet.add(sig)
      importadas++

      // Gerar saída de estoque para cimento e aditivo (se configurado)
      if (gerarBaixa && !c.carga_zerada && cargaSalva?.id) {
        const docName = `CARGA-${String(numeroCargaAtual).padStart(5, "0")}`
        const movimentacoes: any[] = []

        if (c.consumo_cimento > 0 && matCimento?.id) {
          movimentacoes.push({
            empresa_id: empresaId,
            material_id: matCimento.id,
            tipo: "SAIDA",
            quantidade: c.consumo_cimento,
            data: c.dataIso,
            carga_id: cargaSalva.id,
            documento: docName,
            observacao: `Consumo na carga de ${c.volume_m3}m³ (${tracoNomeFinal})`,
          })
        }

        if (c.consumo_aditivo > 0 && matAditivo?.id) {
          movimentacoes.push({
            empresa_id: empresaId,
            material_id: matAditivo.id,
            tipo: "SAIDA",
            quantidade: c.consumo_aditivo,
            data: c.dataIso,
            carga_id: cargaSalva.id,
            documento: docName,
            observacao: `Consumo na carga de ${c.volume_m3}m³ (${tracoNomeFinal})`,
          })
        }

        if (movimentacoes.length > 0) {
          await (supabase as any)
            .from("movimentacoes_estoque")
            .insert(movimentacoes)
        }
      }
    }

    return {
      importadas,
      duplicadasIgnoradas,
      motoristasCriados,
      veiculosCriados,
      cidadesCriadas,
      tracosCriados,
    }
  },

  /**
   * Consulta a contagem de cargas e volume m³ existentes no banco por período para uma empresa,
   * permitindo exibir confirmação detalhada antes de apagar/substituir.
   */
  async consultarCargasPorPeriodo(
    empresaId: string,
    dataInicio: string,
    dataFim: string,
  ): Promise<{
    totalCargas: number
    volumeTotalM3: number
    totalMovimentacoes: number
    porMes: Array<{
      mes: string
      cargas: number
      volume_m3: number
    }>
  }> {
    const { data: cargas, error } = await (supabase as any)
      .from("cargas")
      .select("id, data, volume_m3")
      .eq("empresa_id", empresaId)
      .gte("data", dataInicio)
      .lte("data", dataFim)

    if (error) throw error

    const cargasList = (cargas || []) as Array<{
      id: string
      data: string
      volume_m3: number
    }>
    const ids = chargedIds(cargasList)

    let totalMovimentacoes = 0
    if (ids.length > 0) {
      // Chunk de 200 para contagem de movimentações
      for (let i = 0; i < ids.length; i += 200) {
        const slice = ids.slice(i, i + 200)
        const { count, error: movErr } = await (supabase as any)
          .from("movimentacoes_estoque")
          .select("id", { count: "exact", head: true })
          .in("carga_id", slice)

        if (!movErr && count) {
          totalMovimentacoes += count
        }
      }
    }

    type InfoMesBanco = {
      cargas: number
      volume_m3: number
    }
    const mesesMap = new Map<string, InfoMesBanco>()
    let volTotal = 0

    cargasList.forEach((c) => {
      const v = Number(c.volume_m3) || 0
      volTotal += v
      const mes = (c.data || "").slice(0, 7)
      if (mes) {
        const cur = mesesMap.get(mes) || { cargas: 0, volume_m3: 0 }
        cur.cargas += 1
        cur.volume_m3 = Math.round((cur.volume_m3 + v) * 10) / 10
        mesesMap.set(mes, cur)
      }
    })

    const porMes = Array.from(mesesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, info]) => ({
        mes,
        cargas: info.cargas,
        volume_m3: Math.round(info.volume_m3 * 10) / 10,
      }))

    return {
      totalCargas: cargasList.length,
      volumeTotalM3: Math.round(volTotal * 10) / 10,
      totalMovimentacoes,
      porMes,
    }
  },

  /**
   * REIMPORTAÇÃO COM SUBSTITUIÇÃO SEGURA (Período restrito, ex: 01/01/2026 a 30/09/2026):
   * 1. Apaga primeiro as cargas da empresa no período selecionado (e suas movimentações de estoque vinculadas).
   * 2. Desvincula ordens de serviço do período sem apagá-las (integridade fiscal).
   * 3. OUTUBRO/2026 em diante NUNCA é tocado.
   * 4. Insere cada linha do CSV com a dosagem exata digitada na planilha.
   * 5. Casa traço cadastrado da empresa quando houver correspondência exata de dosagem (kg/m³); senão grava como "Manual".
   * 6. Grava baixa de estoque de cimento e aditivo por carga (movimentação vinculada).
   * 7. Mantém numeração sequencial sem colidir.
   */
  async reimportarCargasComSubstituicao(
    empresaId: string,
    cargasParaImportar: Array<any>,
    periodoExclusao: {
      dataInicio: string // '2026-01-01'
      dataFim: string // '2026-09-30'
    },
    opcoes?: {
      gerarBaixasEstoque?: boolean
      onProgresso?: (etapa: string, atual: number, total: number) => void
    },
  ): Promise<{
    cargasExcluidas: number
    movimentacoesExcluidas: number
    cargasInseridas: number
    tracosVinculados: number
    tracosManuais: number
    volumeTotalInseridoM3: number
  }> {
    const gerarBaixa = opcoes?.gerarBaixasEstoque ?? true
    const onProgresso = opcoes?.onProgresso

    onProgresso?.("Consultando cargas existentes no período...", 0, 100)

    // 1. Localiza cargas no período a ser substituído
    const { data: cargasExistentes, error: findErr } = await (supabase as any)
      .from("cargas")
      .select("id, numero_carga")
      .eq("empresa_id", empresaId)
      .gte("data", periodoExclusao.dataInicio)
      .lte("data", periodoExclusao.dataFim)

    if (findErr) throw findErr

    const cargasParaDeletar = (cargasExistentes || []) as Array<{
      id: string
      numero_carga: number
    }>
    const idsParaDeletar = chargedIds(cargasParaDeletar)

    let movimentacoesExcluidas = 0

    if (idsParaDeletar.length > 0) {
      onProgresso?.(
        `Removendo movimentações de estoque vinculadas (${idsParaDeletar.length} cargas)...`,
        10,
        100,
      )

      // Chunks de 100 para deletar movimentações e desvincular OS
      for (let i = 0; i < idsParaDeletar.length; i += 100) {
        const slice = idsParaDeletar.slice(i, i + 100)

        // Desvincula ordens de serviço vinculadas a essas cargas sem apagá-las (preservação fiscal)
        await (supabase as any)
          .from("ordens_servico")
          .update({ carga_id: null })
          .in("carga_id", slice)

        const { error: delMovErr } = await (supabase as any)
          .from("movimentacoes_estoque")
          .delete()
          .in("carga_id", slice)

        if (delMovErr) {
          console.error("Erro ao deletar movimentações vinculadas:", delMovErr)
        } else {
          movimentacoesExcluidas += slice.length
        }
      }

      onProgresso?.(
        `Apagando ${cargasParaDeletar.length} cargas antigas do período...`,
        25,
        100,
      )

      for (let i = 0; i < idsParaDeletar.length; i += 100) {
        const slice = idsParaDeletar.slice(i, i + 100)
        const { error: delCargaErr } = await (supabase as any)
          .from("cargas")
          .delete()
          .in("id", slice)

        if (delCargaErr) {
          throw new Error(
            `Falha ao remover cargas antigas: ${delCargaErr.message}`,
          )
        }
      }
    }

    onProgresso?.("Carregando catálogos de traços e insumos...", 35, 100)

    // 2. Carrega traços e materiais da empresa para casamento
    const [tracosEmpresa, materiaisEmpresa] = await Promise.all([
      this.getTracos(empresaId),
      this.getMateriais(empresaId),
    ])

    const matCimento = materiaisEmpresa.find((m) => m.codigo === "cimento")
    const matAditivo = materiaisEmpresa.find((m) => m.codigo === "aditivo")

    // Helper de chave de dosagem para casamento exato com traços
    // Tolerância zero: B12/B19/Areia/Cimento por m³
    const gerarChaveDosagem = (d: {
      cimento: number
      brita12: number
      brita19: number
      areia: number
      po_pedra?: number
    }) =>
      `${Math.round(Number(d.cimento))}_${Math.round(Number(d.brita12))}_${Math.round(Number(d.brita19))}_${Math.round(Number(d.areia))}_${Math.round(Number(d.po_pedra || 0))}`

    const tracosPorDosagem = new Map<string, typeof tracosEmpresa[0]>()
    tracosEmpresa.forEach((t) => {
      const chave = gerarChaveDosagem({
        cimento: Number(t.consumo_cimento),
        brita12: Number(t.consumo_brita12),
        brita19: Number(t.consumo_brita19),
        areia: Number(t.consumo_areia),
        po_pedra: Number(t.consumo_po_pedra || 0),
      })
      tracosPorDosagem.set(chave, t)
    })

    // 3. Determinar o próximo número de carga a usar de forma segura e não colidente
    // Para períodos históricos anteriores (ex: jan-set), ajusta cargas posteriores caso colidam;
    // Para períodos correntes/posteriores (ex: outubro/2026 em Patos ou Monteiro), continua sequencialmente
    // a partir do maior número já existente na empresa.
    const { data: todasCargasExistentes } = await (supabase as any)
      .from("cargas")
      .select("id, numero_carga, data")
      .eq("empresa_id", empresaId)
      .order("numero_carga", { ascending: true })

    const totalCargasNovas = cargasParaImportar.length

    // Cargas que estão DEPOIS da data fim deste lote de substituição
    const cargasPosteriores = (todasCargasExistentes || []).filter(
      (c: any) => c.data > periodoExclusao.dataFim,
    )

    // Se houver cargas posteriores e o período for de meses anteriores (ex: Monteiro jan-set),
    // garante que cargas posteriores não colidam
    if (cargasPosteriores.length > 0) {
      const minNumPosterior = Math.min(
        ...cargasPosteriores.map((c: any) => c.numero_carga || 0),
      )
      if (minNumPosterior <= totalCargasNovas) {
        let seqPosterior = totalCargasNovas + 1
        for (const cPos of cargasPosteriores) {
          await (supabase as any)
            .from("cargas")
            .update({ numero_carga: seqPosterior++ })
            .eq("id", cPos.id)
        }
      }
    }

    // Cargas ANTERIORES à data de início deste lote
    const cargasAnteriores = (todasCargasExistentes || []).filter(
      (c: any) => c.data < periodoExclusao.dataInicio,
    )
    const maxNumAnterior = cargasAnteriores.reduce(
      (max: number, c: any) => Math.max(max, Number(c.numero_carga) || 0),
      0,
    )

    // Inicia a numeração após as cargas anteriores existentes, ou em 1 se não houver
    let numeroSequencial = maxNumAnterior > 0 ? maxNumAnterior + 1 : 1

    // 4. Inserção das novas cargas do lote
    // Ordenar cronologicamente por data (e linha original se mesma data)
    const cargasOrdenadas = [...cargasParaImportar].sort((a, b) => {
      const cmp = a.dataIso.localeCompare(b.dataIso)
      if (cmp !== 0) return cmp
      return (a.linhaIndex || 0) - (b.linhaIndex || 0)
    })
    let tracosVinculados = 0
    let tracosManuais = 0
    let volumeTotalInserido = 0
    let cargasInseridas = 0

    onProgresso?.("Inserindo cargas e gerando baixas de estoque...", 50, 100)

    // Inserção em lotes de 25 com inserção de movimentações vinculadas
    const BATCH_SIZE = 25
    for (let b = 0; b < cargasOrdenadas.length; b += BATCH_SIZE) {
      const batch = cargasOrdenadas.slice(b, b + BATCH_SIZE)
      const registrosCargas: any[] = []
      const metadadosBatch: Array<{
        linha: any
        numeroCarga: number
        tracoId: string | null
        tracoNome: string
      }> = []

      for (const item of batch) {
        const numCarga = numeroSequencial++
        volumeTotalInserido += Number(item.volume_m3) || 0

        // Casamento exato com traço
        const chaveLinha = gerarChaveDosagem({
          cimento: item.dosagemM3?.cimento ?? item.consumo_cimento,
          brita12: item.dosagemM3?.brita12 ?? item.consumo_brita12,
          brita19: item.dosagemM3?.brita19 ?? item.consumo_brita19,
          areia: item.dosagemM3?.areia ?? item.consumo_areia,
          po_pedra: item.dosagemM3?.po_pedra ?? item.consumo_po_pedra,
        })

        const tracoCasado = item.carga_zerada
          ? null
          : tracosPorDosagem.get(chaveLinha)

        let tracoId: string | null = null
        let tracoNome = "Manual"

        if (item.carga_zerada) {
          tracoNome = "Carga Zerada"
        } else if (tracoCasado) {
          tracoId = tracoCasado.id
          tracoNome = tracoCasado.nome
          tracosVinculados++
        } else {
          tracoNome = "Manual"
          tracosManuais++
        }

        registrosCargas.push({
          empresa_id: empresaId,
          numero_carga: numCarga,
          data: item.dataIso,
          volume_m3: item.volume_m3,
          traco_id: tracoId,
          traco_nome: tracoNome,
          motorista_nome: item.motorista_nome || null,
          veiculo_placa: item.veiculo_placa || null,
          cidade_nome: item.cidade_nome || null,
          consumo_brita12: item.consumo_brita12,
          consumo_brita19: item.consumo_brita19,
          consumo_areia: item.consumo_areia,
          consumo_po_pedra: item.consumo_po_pedra || 0,
          consumo_cimento: item.consumo_cimento,
          consumo_aditivo: item.consumo_aditivo,
          consumo_agua: 0,
          observacao:
            item.observacao || "Importado via planilha de Controle Diário",
          carga_zerada: Boolean(item.carga_zerada),
        })

        metadadosBatch.push({
          linha: item,
          numeroCarga: numCarga,
          tracoId,
          tracoNome,
        })
      }

      const { data: cargasSalvas, error: insErr } = await (supabase as any)
        .from("cargas")
        .insert(registrosCargas)
        .select(
          "id, numero_carga, volume_m3, consumo_cimento, consumo_aditivo, data, traco_nome, carga_zerada",
        )

      if (insErr) {
        throw new Error(`Falha ao inserir lote de cargas: ${insErr.message}`)
      }

      cargasInseridas += (cargasSalvas || []).length

      // Movimentações de estoque vinculadas
      if (gerarBaixa && cargasSalvas && cargasSalvas.length > 0) {
        const movimentacoes: any[] = []

        cargasSalvas.forEach((cs: any) => {
          if (cs.carga_zerada) return
          const docName = `CARGA-${String(cs.numero_carga).padStart(5, "0")}`

          if (Number(cs.consumo_cimento) > 0 && matCimento?.id) {
            movimentacoes.push({
              empresa_id: empresaId,
              material_id: matCimento.id,
              tipo: "SAIDA",
              quantidade: Number(cs.consumo_cimento),
              data: cs.data,
              carga_id: cs.id,
              documento: docName,
              observacao: `Consumo na carga de ${cs.volume_m3}m³ (${cs.traco_nome || "Manual"})`,
            })
          }

          if (Number(cs.consumo_aditivo) > 0 && matAditivo?.id) {
            movimentacoes.push({
              empresa_id: empresaId,
              material_id: matAditivo.id,
              tipo: "SAIDA",
              quantidade: Number(cs.consumo_aditivo),
              data: cs.data,
              carga_id: cs.id,
              documento: docName,
              observacao: `Consumo na carga de ${cs.volume_m3}m³ (${cs.traco_nome || "Manual"})`,
            })
          }
        })

        if (movimentacoes.length > 0) {
          const { error: movInsErr } = await (supabase as any)
            .from("movimentacoes_estoque")
            .insert(movimentacoes)

          if (movInsErr) {
            console.error("Erro ao inserir movimentações do lote:", movInsErr)
          }
        }
      }

      const perc = Math.round(
        50 + ((b + batch.length) / cargasOrdenadas.length) * 48,
      )
      onProgresso?.(
        `Gravadas ${cargasInseridas} de ${cargasOrdenadas.length} cargas...`,
        perc,
        100,
      )
    }

    onProgresso?.("Finalizando reimportação...", 100, 100)

    return {
      cargasExcluidas: cargasParaDeletar.length,
      movimentacoesExcluidas,
      cargasInseridas,
      tracosVinculados,
      tracosManuais,
      volumeTotalInseridoM3: Math.round(volumeTotalInserido * 10) / 10,
    }
  },
}

function chargedIds(list: Array<{ id?: string }>): string[] {
  return list.map((item) => item.id).filter(Boolean) as string[]
}
