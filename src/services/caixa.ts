import { supabase } from "@/lib/supabase/client"
import {
  Obra,
  CaixaCategoria,
  CaixaLancamento,
  TipoCaixaLancamento,
  CaixaFechamentoMensal,
  CaixaTotaisCompetencia,
  ResumoCategoriaCaixa,
  ResumoObraCaixa,
  MesAnualCaixa,
  ResultadoImportacaoCaixa,
} from "@/types/caixa"

export const CaixaService = {
  // ==========================================
  // OBRAS
  // ==========================================
  async listarObras(empresaId: string): Promise<Obra[]> {
    const { data, error } = await supabase
      .from("obras" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true })

    if (error) {
      console.error("Erro ao listar obras:", error)
      throw error
    }
    return (data || []) as unknown as Obra[]
  },

  async criarOuObterObra(empresaId: string, nomeObra: string): Promise<Obra> {
    const nomeLimpo = nomeObra.trim()
    if (!nomeLimpo) throw new Error("Nome da obra não pode ser vazio")

    // Buscar existente
    const { data: existente } = await supabase
      .from("obras" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .ilike("nome", nomeLimpo)
      .maybeSingle()

    if (existente) return existente as unknown as Obra

    // Criar nova
    const { data, error } = await supabase
      .from("obras" as any)
      .insert({
        empresa_id: empresaId,
        nome: nomeLimpo,
        ativo: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao cadastrar obra:", error)
      throw error
    }
    return data as unknown as Obra
  },

  // ==========================================
  // CATEGORIAS
  // ==========================================
  async listarCategorias(empresaId: string): Promise<CaixaCategoria[]> {
    const { data, error } = await supabase
      .from("caixa_categorias" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .order("ordem", { ascending: true })
      .order("nome", { ascending: true })

    if (error) {
      console.error("Erro ao listar categorias de caixa:", error)
      throw error
    }
    return (data || []) as unknown as CaixaCategoria[]
  },

  async salvarCategoria(
    categoria: Partial<CaixaCategoria> & {
      empresa_id: string
      nome: string
      tipo: "entrada" | "saida"
    },
  ): Promise<CaixaCategoria> {
    if (categoria.id) {
      const { data, error } = await supabase
        .from("caixa_categorias" as any)
        .update({
          nome: categoria.nome.trim(),
          tipo: categoria.tipo,
          cor: categoria.cor,
          ordem: categoria.ordem ?? 0,
          ativo: categoria.ativo ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoria.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as CaixaCategoria
    } else {
      const { data, error } = await supabase
        .from("caixa_categorias" as any)
        .insert({
          empresa_id: categoria.empresa_id,
          nome: categoria.nome.trim(),
          tipo: categoria.tipo,
          cor:
            categoria.cor ||
            (categoria.tipo === "entrada" ? "#10b981" : "#ef4444"),
          ordem: categoria.ordem ?? 0,
          ativo: categoria.ativo ?? true,
        })
        .select()
        .single()

      if (error) throw error
      return data as unknown as CaixaCategoria
    }
  },

  // ==========================================
  // LANÇAMENTOS
  // ==========================================
  async listarLancamentos(
    empresaId: string,
    filtros?: {
      competencia?: string
      dataInicio?: string
      dataFim?: string
      tipo?: "entrada" | "saida" | "todos"
      categoria?: string
      obraId?: string
      busca?: string
    },
  ): Promise<CaixaLancamento[]> {
    let query = supabase
      .from("caixa_lancamentos" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .limit(10000)

    if (filtros?.competencia) {
      query = query.eq("competencia", filtros.competencia)
    }
    if (filtros?.dataInicio) {
      query = query.gte("data", filtros.dataInicio)
    }
    if (filtros?.dataFim) {
      query = query.lte("data", filtros.dataFim)
    }
    if (filtros?.tipo && filtros.tipo !== "todos") {
      query = query.eq("tipo", filtros.tipo)
    }
    if (filtros?.categoria) {
      query = query.eq("categoria", filtros.categoria)
    }
    if (filtros?.obraId) {
      query = query.eq("obra_id", filtros.obraId)
    }
    if (filtros?.busca) {
      const b = filtros.busca.trim()
      query = query.or(
        `descricao.ilike.%${b}%,observacao.ilike.%${b}%,obra_nome.ilike.%${b}%`,
      )
    }

    query = query
      .order("data", { ascending: true })
      .order("created_at", { ascending: true })

    const { data, error } = await query
    if (error) {
      console.error("Erro ao listar lançamentos do caixa:", error)
      throw error
    }
    return (data || []) as unknown as CaixaLancamento[]
  },

  async salvarLancamento(
    lancamento: Partial<CaixaLancamento> & {
      empresa_id: string
      data: string
      tipo: "entrada" | "saida"
      categoria: string
      descricao: string
      valor: number
    },
  ): Promise<CaixaLancamento> {
    const dataStr = lancamento.data
    const competencia = lancamento.competencia || dataStr.substring(0, 7)

    const payload = {
      empresa_id: lancamento.empresa_id,
      data: dataStr,
      competencia,
      tipo: lancamento.tipo,
      categoria: lancamento.categoria.trim(),
      categoria_id: lancamento.categoria_id || null,
      descricao: lancamento.descricao.trim(),
      valor: Math.abs(Number(lancamento.valor || 0)),
      obra_id: lancamento.obra_id || null,
      obra_nome: lancamento.obra_nome ? lancamento.obra_nome.trim() : null,
      forma_pagamento: lancamento.forma_pagamento || "PIX",
      documento_ref: lancamento.documento_ref || null,
      observacao: lancamento.observacao || null,
      created_by: lancamento.created_by || null,
      updated_at: new Date().toISOString(),
    }

    if (lancamento.id) {
      const { data, error } = await supabase
        .from("caixa_lancamentos" as any)
        .update(payload)
        .eq("id", lancamento.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as CaixaLancamento
    } else {
      const { data, error } = await supabase
        .from("caixa_lancamentos" as any)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data as unknown as CaixaLancamento
    }
  },

  async excluirLancamento(id: string): Promise<void> {
    const { error } = await supabase
      .from("caixa_lancamentos" as any)
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  // ==========================================
  // APURAÇÃO DE FECHAMENTO MENSAL CALCULADA
  // ==========================================
  async calcularFechamentoMensal(
    empresaId: string,
    competencia: string, // YYYY-MM
  ): Promise<{
    totais: CaixaTotaisCompetencia
    categoriasEntradas: ResumoCategoriaCaixa[]
    categoriasSaidas: ResumoCategoriaCaixa[]
    obras: ResumoObraCaixa[]
    lancamentos: CaixaLancamento[]
  }> {
    // 1. Calcular Saldo Anterior acumulando todos os lançamentos antes desta competência
    const { data: lancsAnteriores, error: errAnt } = await (supabase as any)
      .from("caixa_lancamentos")
      .select("tipo, valor")
      .eq("empresa_id", empresaId)
      .lt("competencia", competencia)
      .limit(100000)

    if (errAnt) {
      console.error("Erro ao calcular saldo anterior:", errAnt)
      throw errAnt
    }

    let saldoAnterior = 0
    if (lancsAnteriores) {
      const listaAnt = (lancsAnteriores || []) as Array<{
        tipo: string
        valor: number
      }>
      for (const item of listaAnt) {
        const val = Number(item.valor || 0)
        if (item.tipo === "entrada") saldoAnterior += val
        else if (item.tipo === "saida") saldoAnterior -= val
      }
    }

    // 2. Buscar lançamentos da competência atual
    const lancamentos = await this.listarLancamentos(empresaId, { competencia })

    let totalEntradas = 0
    let totalSaidas = 0
    let qtdEntradas = 0
    let qtdSaidas = 0

    interface TotQtd {
      total: number
      qtd: number
    }
    const catEntradasMap = new Map<string, TotQtd>()
    const catSaidasMap = new Map<string, TotQtd>()
    const obrasMap = new Map<string, {
      total: number
      qtd: number
      id?: string | null
    }>()

    for (const l of lancamentos) {
      const val = Number(l.valor || 0)
      if (l.tipo === "entrada") {
        totalEntradas += val
        qtdEntradas++
        const cur = catEntradasMap.get(l.categoria) || { total: 0, qtd: 0 }
        cur.total += val
        cur.qtd++
        catEntradasMap.set(l.categoria, cur)

        // Se tiver vínculo com obra ou for categoria de obra
        if (l.obra_nome || l.obra_id) {
          const nomeObra = l.obra_nome || "Obra Não Identificada"
          const curO = obrasMap.get(nomeObra) || {
            total: 0,
            qtd: 0,
            id: l.obra_id,
          }
          curO.total += val
          curO.qtd++
          obrasMap.set(nomeObra, curO)
        }
      } else {
        totalSaidas += val
        qtdSaidas++
        const cur = catSaidasMap.get(l.categoria) || { total: 0, qtd: 0 }
        cur.total += val
        cur.qtd++
        catSaidasMap.set(l.categoria, cur)
      }
    }

    const resultadoMes = totalEntradas - totalSaidas
    const saldoFinal = saldoAnterior + resultadoMes

    // Converter Maps para Arrays com percentuais
    const categoriasEntradas: ResumoCategoriaCaixa[] = Array.from(
      catEntradasMap.entries(),
    )
      .map(([categoria, item]) => ({
        categoria,
        tipo: "entrada" as TipoCaixaLancamento,
        total: item.total,
        quantidade: item.qtd,
        percentual: totalEntradas > 0 ? (item.total / totalEntradas) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    const categoriasSaidas: ResumoCategoriaCaixa[] = Array.from(
      catSaidasMap.entries(),
    )
      .map(([categoria, item]) => ({
        categoria,
        tipo: "saida" as TipoCaixaLancamento,
        total: item.total,
        quantidade: item.qtd,
        percentual: totalSaidas > 0 ? (item.total / totalSaidas) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    const obras: ResumoObraCaixa[] = Array.from(obrasMap.entries())
      .map(([obraNome, item]) => ({
        obraId: item.id,
        obraNome,
        totalRecebimentos: item.total,
        quantidade: item.qtd,
      }))
      .sort((a, b) => b.totalRecebimentos - a.totalRecebimentos)

    return {
      totais: {
        competencia,
        saldoAnterior,
        totalEntradas,
        totalSaidas,
        resultadoMes,
        saldoFinal,
        quantidadeEntradas: qtdEntradas,
        quantidadeSaidas: qtdSaidas,
      },
      categoriasEntradas,
      categoriasSaidas,
      obras,
      lancamentos,
    }
  },

  // ==========================================
  // APURAÇÃO DE FECHAMENTO ANUAL (12 MESES)
  // ==========================================
  async calcularFechamentoAnual(
    empresaId: string,
    ano: number,
    categoriaFiltro?: string,
  ): Promise<{
    ano: number
    saldoInicialAno: number
    meses: MesAnualCaixa[]
    totalEntradasAno: number
    totalSaidasAno: number
    resultadoAno: number
    saldoFinalAno: number
  }> {
    const primeiroDiaAno = `${ano}-01`

    // 1. Saldo antes de começar o ano
    const { data: lancsAnteriores } = await (supabase as any)
      .from("caixa_lancamentos")
      .select("tipo, valor")
      .eq("empresa_id", empresaId)
      .lt("competencia", primeiroDiaAno)
      .limit(100000)

    let saldoInicialAno = 0
    if (lancsAnteriores) {
      const listaAntAno = lancsAnteriores as Array<{
        tipo: string
        valor: number
      }>
      for (const item of listaAntAno) {
        const val = Number(item.valor || 0)
        if (item.tipo === "entrada") saldoInicialAno += val
        else if (item.tipo === "saida") saldoInicialAno -= val
      }
    }

    // 2. Buscar lançamentos de todo o ano
    let query = (supabase as any)
      .from("caixa_lancamentos")
      .select("competencia, tipo, categoria, valor")
      .eq("empresa_id", empresaId)
      .gte("competencia", `${ano}-01`)
      .lte("competencia", `${ano}-12`)
      .limit(10000)

    if (categoriaFiltro && categoriaFiltro !== "todas") {
      query = query.eq("categoria", categoriaFiltro)
    }

    const { data: lancsAno, error } = await query
    if (error) throw error

    const nomesMeses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]

    const meses: MesAnualCaixa[] = []
    let saldoCorrente = saldoInicialAno
    let totalEntradasAno = 0
    let totalSaidasAno = 0

    const itensAnoTyped = (lancsAno || []) as {
      competencia: string
      tipo: string
      categoria: string
      valor: number
    }[]

    for (let m = 1; m <= 12; m++) {
      const compStr = `${ano}-${String(m).padStart(2, "0")}`
      const itensDoMes = itensAnoTyped.filter((l) => l.competencia === compStr)

      let ent = 0
      let sai = 0
      for (const it of itensDoMes) {
        const v = Number(it.valor || 0)
        if (it.tipo === "entrada") ent += v
        else if (it.tipo === "saida") sai += v
      }

      const res = ent - sai
      const saldoIni = saldoCorrente
      saldoCorrente = saldoIni + res

      totalEntradasAno += ent
      totalSaidasAno += sai

      meses.push({
        mes: m,
        nomeMes: nomesMeses[m - 1],
        competencia: compStr,
        saldoInicial: saldoIni,
        entradas: ent,
        saidas: sai,
        resultado: res,
        saldoFinal: saldoCorrente,
      })
    }

    return {
      ano,
      saldoInicialAno,
      meses,
      totalEntradasAno,
      totalSaidasAno,
      resultadoAno: totalEntradasAno - totalSaidasAno,
      saldoFinalAno: saldoCorrente,
    }
  },

  // ==========================================
  // APURAÇÃO DE OBRAS (CONSOLIDADA POR MÊS/ANO)
  // ==========================================
  async consolidarObras(
    empresaId: string,
    ano?: number,
    competencia?: string,
  ): Promise<{
    obras: {
      obraNome: string
      clienteNome?: string | null
      totalGeral: number
      meses: { [comp: string]: number }
    }[]
    competenciasListadas: string[]
  }> {
    let query = (supabase as any)
      .from("caixa_lancamentos")
      .select("competencia, valor, obra_nome, obra_id, tipo")
      .eq("empresa_id", empresaId)
      .eq("tipo", "entrada")
      .not("obra_nome", "is", null)
      .limit(10000)

    if (competencia) {
      query = query.eq("competencia", competencia)
    } else if (ano) {
      query = query
        .gte("competencia", `${ano}-01`)
        .lte("competencia", `${ano}-12`)
    }

    const { data, error } = await query
    if (error) throw error

    const mapObras = new Map<string, {
      totalGeral: number
      meses: { [comp: string]: number }
    }>()
    const setComps = new Set<string>()

    const listaObrasLanc = (data || []) as {
      competencia: string
      valor: number
      obra_nome: string | null
      obra_id: string | null
      tipo: string
    }[]

    for (const r of listaObrasLanc) {
      const nome = r.obra_nome?.trim() || "Obra Não Identificada"
      const comp = r.competencia
      const val = Number(r.valor || 0)

      setComps.add(comp)
      const cur = mapObras.get(nome) || { totalGeral: 0, meses: {} }
      cur.totalGeral += val
      cur.meses[comp] = (cur.meses[comp] || 0) + val
      mapObras.set(nome, cur)
    }

    const competenciasListadas = Array.from(setComps).sort()
    const obras = Array.from(mapObras.entries())
      .map(([obraNome, val]) => ({
        obraNome,
        totalGeral: val.totalGeral,
        meses: val.meses,
      }))
      .sort((a, b) => b.totalGeral - a.totalGeral)

    return { obras, competenciasListadas }
  },

  // ==========================================
  // IMPORTAÇÃO EM LOTE (MESCLAR OU SUBSTITUIR)
  // ==========================================
  async importarLoteLancamentos(
    empresaId: string,
    lancamentos: Omit<CaixaLancamento, "id" | "empresa_id">[],
    modo: "mesclar" | "substituir",
    competenciasAlvo: string[],
  ): Promise<ResultadoImportacaoCaixa> {
    if (lancamentos.length === 0) return { inseridos: 0, substituidos: 0 }

    // 1. Se modo 'substituir', apaga antes os lançamentos das competências alvo
    let substituidos = 0
    if (modo === "substituir" && competenciasAlvo.length > 0) {
      const { data: deletados, error: errDel } = await supabase
        .from("caixa_lancamentos" as any)
        .delete()
        .eq("empresa_id", empresaId)
        .in("competencia", competenciasAlvo)
        .select("id")

      if (errDel) throw errDel
      substituidos = deletados?.length || 0
    }

    // 2. Garantir que as obras mencionadas existam no cadastro
    const nomesObrasUnicos = Array.from(
      new Set(
        lancamentos
          .map((l) => l.obra_nome?.trim())
          .filter((n): n is string => Boolean(n && n.length > 0)),
      ),
    )

    const mapaObrasId = new Map<string, string>()
    for (const nomeObra of nomesObrasUnicos) {
      try {
        const obra = await this.criarOuObterObra(empresaId, nomeObra)
        mapaObrasId.set(nomeObra.toLowerCase(), obra.id)
      } catch (e) {
        console.warn("Erro ao vincular obra na importação:", e)
      }
    }

    // 3. Preparar linhas para inserção
    const rows = lancamentos.map((l) => {
      const nomeObra = l.obra_nome ? l.obra_nome.trim() : null
      const obraId =
        (nomeObra && mapaObrasId.get(nomeObra.toLowerCase())) ||
        l.obra_id ||
        null

      return {
        empresa_id: empresaId,
        data: l.data,
        competencia: l.competencia,
        tipo: l.tipo,
        categoria: l.categoria.trim(),
        categoria_id: l.categoria_id || null,
        descricao: l.descricao.trim(),
        valor: Math.abs(Number(l.valor || 0)),
        obra_id: obraId,
        obra_nome: nomeObra,
        forma_pagamento: l.forma_pagamento || "PIX",
        documento_ref: l.documento_ref || null,
        observacao: l.observacao || null,
        created_by: "Importação Planilha",
      }
    })

    // Inserir em lotes de 200
    const tamanhoLote = 200
    let inseridos = 0

    for (let i = 0; i < rows.length; i += tamanhoLote) {
      const lote = rows.slice(i, i + tamanhoLote)
      const { data, error } = await supabase
        .from("caixa_lancamentos" as any)
        .insert(lote)
        .select("id")

      if (error) {
        console.error("Erro ao inserir lote de caixa:", error)
        throw error
      }
      inseridos += data?.length || 0
    }

    return { inseridos, substituidos }
  },
}
