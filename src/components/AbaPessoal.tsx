import React, { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useEmpresa } from "@/hooks/use-empresa"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Search,
  Download,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  Building2,
  FileSpreadsheet,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  Briefcase,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatarCpfCnpj } from "@/lib/documentos"

export interface ColaboradorUnificado {
  id: string
  origem: "funcionario" | "terceiro"
  nome: string
  tipo: "Funcionário" | "Terceiro"
  funcao: string
  cpf: string
  data_admissao: string | null
  data_demissao: string | null
  salario: number
  banco: string
  agencia: string
  conta: string
  pix: string
  ativo: boolean
  empresa_id: string
}

export interface ConfrontoResultado {
  competencia: string
  soNaFolha: { nome: string; cargo: string; salario: number; cpf?: string }[]
  soNasFerias: {
    nome: string
    funcao: string
    salario: number
    ferias?: string | null
  }[]
  salarioDivergente: {
    nome: string
    funcao: string
    salarioFolha: number
    salarioFerias: number
    diferenca: number
  }[]
}

function normalizarTexto(txt: string | null | undefined): string {
  if (!txt) return ""
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function normalizarCpf(cpf: string | null | undefined): string {
  if (!cpf) return ""
  return cpf.replace(/\D/g, "")
}

export function AbaPessoal() {
  const { empresaAtiva, empresas, podeTrocarEmpresa, selecionarEmpresa } =
    useEmpresa()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [colaboradores, setColaboradores] = useState<ColaboradorUnificado[]>([])
  const [filtroBusca, setFiltroBusca] = useState("")
  const [filtroStatus, setFiltroStatus] =
    useState<"ativos" | "demitidos" | "todos">("ativos")

  // Modal Demissão
  const [colaboradorParaDemitir, setColaboradorParaDemitir] =
    useState<ColaboradorUnificado | null>(null)
  const [demitindo, setDemitindo] = useState(false)

  // Importar da Folha
  const [importandoFolha, setImportandoFolha] = useState(false)

  // Painel Confronto Folha × Férias
  const [modalConfrontoAberta, setModalConfrontoAberta] = useState(false)
  const [carregandoConfronto, setCarregandoConfronto] = useState(false)
  const [resultadoConfronto, setResultadoConfronto] =
    useState<ConfrontoResultado | null>(null)

  const carregarDados = useCallback(async () => {
    if (!empresaAtiva?.id) return
    setLoading(true)
    try {
      // 1. Carregar funcionarios
      const { data: dataFuncs, error: errFuncs } = await (supabase as any)
        .from("funcionarios")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("nome", { ascending: true })

      if (errFuncs) throw errFuncs

      // 2. Carregar folha_terceiros
      const { data: dataTercs, error: errTercs } = await (supabase as any)
        .from("folha_terceiros")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("nome", { ascending: true })

      if (errTercs) throw errTercs

      // 3. Carregar controle_ferias da empresa para cruzar dados bancários (agencia / conta_corrente)
      const { data: dataFerias } = await (supabase as any)
        .from("controle_ferias")
        .select("nome, cpf, agencia, conta_corrente")
        .eq("empresa_id", empresaAtiva.id)

      const mapaBancario = new Map<string, { agencia: string; conta: string }>()
      if (dataFerias) {
        for (const row of dataFerias) {
          const normNome = normalizarTexto(row.nome)
          const normCpf = normalizarCpf(row.cpf)
          const info = {
            agencia: (row.agencia || "").trim(),
            conta: (row.conta_corrente || "").trim(),
          }
          if (normNome) mapaBancario.set(`nome:${normNome}`, info)
          if (normCpf) mapaBancario.set(`cpf:${normCpf}`, info)
        }
      }

      const lista: ColaboradorUnificado[] = []

      // Montar funcionários
      for (const f of dataFuncs || []) {
        const normNome = normalizarTexto(f.nome)
        const normCpf = normalizarCpf(f.cpf)
        const bancario =
          (normCpf && mapaBancario.get(`cpf:${normCpf}`)) ||
          (normNome && mapaBancario.get(`nome:${normNome}`))

        const agenciaFinal = (f.agencia || bancario?.agencia || "").trim()
        const contaFinal = (f.conta || bancario?.conta || "").trim()

        lista.push({
          id: f.id,
          origem: "funcionario",
          nome: f.nome || "",
          tipo: "Funcionário",
          funcao: f.funcao || "—",
          cpf: f.cpf || "",
          data_admissao: f.data_admissao || null,
          data_demissao: f.data_demissao || null,
          salario: Number(f.bruto) || 0,
          banco: "",
          agencia: agenciaFinal,
          conta: contaFinal,
          pix: f.pix || "",
          ativo: f.ativo !== false && !f.data_demissao,
          empresa_id: f.empresa_id,
        })
      }

      // Montar terceiros
      for (const t of dataTercs || []) {
        const normNome = normalizarTexto(t.nome)
        const bancario = normNome ? mapaBancario.get(`nome:${normNome}`) : null

        lista.push({
          id: t.id,
          origem: "terceiro",
          nome: t.nome || "",
          tipo: "Terceiro",
          funcao: t.eh_vendedor
            ? "Vendedor / Comercial"
            : t.obs || "Terceiro Prestador",
          cpf: "",
          data_admissao: null,
          data_demissao: null,
          salario: Number(t.bruto) || 0,
          banco: "",
          agencia: bancario?.agencia || "",
          conta: t.conta || bancario?.conta || "",
          pix: t.pix || "",
          ativo: t.ativo !== false,
          empresa_id: t.empresa_id,
        })
      }

      lista.sort((a, b) => a.nome.localeCompare(b.nome))
      setColaboradores(lista)
    } catch (err: any) {
      console.error("Erro ao carregar colaboradores:", err)
      toast({
        title: "Erro ao carregar colaboradores",
        description: err.message || "Falha na comunicação com o banco.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [empresaAtiva?.id, toast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Filtragem de colaboradores
  const colaboradoresFiltrados = useMemo(() => {
    const termo = normalizarTexto(filtroBusca)
    const termoCpf = normalizarCpf(filtroBusca)

    return colaboradores.filter((colab) => {
      // Filtro status
      if (filtroStatus === "ativos" && !colab.ativo) return false
      if (filtroStatus === "demitidos" && colab.ativo) return false

      // Filtro texto
      if (!termo && !termoCpf) return true

      const matchNome = normalizarTexto(colab.nome).includes(termo)
      const matchFuncao = normalizarTexto(colab.funcao).includes(termo)
      const matchTipo = normalizarTexto(colab.tipo).includes(termo)
      const colabCpfLimpo = normalizarCpf(colab.cpf)
      const matchCpf = termoCpf && colabCpfLimpo.includes(termoCpf)

      return matchNome || matchFuncao || matchTipo || matchCpf
    })
  }, [colaboradores, filtroBusca, filtroStatus])

  // Totais
  const estatisticas = useMemo(() => {
    const ativos = colaboradores.filter((c) => c.ativo).length
    const demitidos = colaboradores.filter((c) => !c.ativo).length
    const funcionarios = colaboradores.filter(
      (c) => c.tipo === "Funcionário" && c.ativo,
    ).length
    const terceiros = colaboradores.filter(
      (c) => c.tipo === "Terceiro" && c.ativo,
    ).length
    const somaSalariosAtivos = colaboradores
      .filter((c) => c.ativo)
      .reduce((acc, c) => acc + (c.salario || 0), 0)

    return { ativos, demitidos, funcionarios, terceiros, somaSalariosAtivos }
  }, [colaboradores])

  // Executar Demissão
  const handleConfirmarDemissao = async () => {
    if (!colaboradorParaDemitir) return
    setDemitindo(true)
    const hojeIso = new Date().toISOString().split("T")[0]

    try {
      if (colaboradorParaDemitir.origem === "funcionario") {
        const { error } = await (supabase as any)
          .from("funcionarios")
          .update({
            ativo: false,
            data_demissao: hojeIso,
            updated_at: new Date().toISOString(),
          })
          .eq("id", colaboradorParaDemitir.id)

        if (error) throw error
      } else {
        const { error } = await (supabase as any)
          .from("folha_terceiros")
          .update({
            ativo: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", colaboradorParaDemitir.id)

        if (error) throw error
      }

      toast({
        title: "Demissão registrada",
        description: `${colaboradorParaDemitir.nome} foi desativado e não aparecerá mais nas listas ativas.`,
      })

      setColaboradorParaDemitir(null)
      await carregarDados()
    } catch (err: any) {
      console.error("Erro ao registrar demissão:", err)
      toast({
        title: "Erro ao demitir colaborador",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setDemitindo(false)
    }
  }

  // Importar da Folha (Idempotente)
  const handleImportarDaFolha = async () => {
    if (!empresaAtiva?.id) return
    setImportandoFolha(true)

    try {
      // 1. Buscar linhas de folha tipo='Funcionario' da empresa ativa ordenadas por created_at desc
      const { data: linhasFolha, error: errFolha } = await (supabase as any)
        .from("folha_pagamento_linhas")
        .select(
          "id, nome, cargo, cpf, data_admissao, salario_base, total_proventos, conta, pix, agencia, created_at, competencia",
        )
        .eq("empresa_id", empresaAtiva.id)
        .eq("tipo", "Funcionario")
        .order("created_at", { ascending: false })

      if (errFolha) throw errFolha

      if (!linhasFolha || linhasFolha.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description:
            "Não foram encontradas linhas de folha de funcionários para esta unidade.",
        })
        return
      }

      // 2. Buscar funcionários já existentes na empresa
      const { data: funcsExistentes, error: errFuncs } = await (supabase as any)
        .from("funcionarios")
        .select("id, nome, cpf")
        .eq("empresa_id", empresaAtiva.id)

      if (errFuncs) throw errFuncs

      const cpfsExistentes = new Set<string>()
      const nomesExistentes = new Set<string>()

      for (const f of funcsExistentes || []) {
        const c = normalizarCpf(f.cpf)
        if (c) cpfsExistentes.add(c)
        const n = normalizarTexto(f.nome)
        if (n) nomesExistentes.add(n)
      }

      // Agrupar linhas mais recentes por colaborador
      const colaboradoresParaCriar: Map<string, any> = new Map()

      for (const linha of linhasFolha) {
        const normNome = normalizarTexto(linha.nome)
        const normCpf = normalizarCpf(linha.cpf)

        if (!normNome) continue

        // Se já existe no banco, ignora
        if (normCpf && cpfsExistentes.has(normCpf)) continue
        if (nomesExistentes.has(normNome)) continue

        // Chave do agrupamento
        const chave = normCpf ? `cpf:${normCpf}` : `nome:${normNome}`

        if (!colaboradoresParaCriar.has(chave)) {
          colaboradoresParaCriar.set(chave, {
            empresa_id: empresaAtiva.id,
            nome: linha.nome.trim().toUpperCase(),
            funcao: (linha.cargo || "").trim().toUpperCase() || "FUNCIONÁRIO",
            cpf: linha.cpf?.trim() || null,
            data_admissao: linha.data_admissao || null,
            bruto:
              Number(linha.salario_base) || Number(linha.total_proventos) || 0,
            conta: linha.conta?.trim() || null,
            pix: linha.pix?.trim() || null,
            agencia: linha.agencia?.trim() || null,
            ativo: true,
          })
        }
      }

      const novosParaInserir = Array.from(colaboradoresParaCriar.values())

      if (novosParaInserir.length === 0) {
        toast({
          title: "Todos os colaboradores já existem",
          description:
            "Nenhum novo colaborador da folha precisou ser criado. A lista já está em dia.",
        })
        return
      }

      const { error: errInsert } = await (supabase as any)
        .from("funcionarios")
        .insert(novosParaInserir)

      if (errInsert) throw errInsert

      toast({
        title: "Importação concluída!",
        description: `${novosParaInserir.length} colaborador(es) importado(s) da folha para os Cadastros.`,
      })

      await carregarDados()
    } catch (err: any) {
      console.error("Erro ao importar da folha:", err)
      toast({
        title: "Erro ao importar da folha",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setImportandoFolha(false)
    }
  }

  // Confrontar Folha × Férias
  const handleAbrirConfronto = async () => {
    if (!empresaAtiva?.id) return
    setModalConfrontoAberta(true)
    setCarregandoConfronto(true)

    try {
      // 1. Achar competência mais recente da empresa
      const { data: compRecente, error: errComp } = await (supabase as any)
        .from("folha_pagamento_linhas")
        .select("competencia")
        .eq("empresa_id", empresaAtiva.id)
        .order("competencia", { ascending: false })
        .limit(1)

      if (errComp) throw errComp

      const comp = compRecente?.[0]?.competencia
      if (!comp) {
        setResultadoConfronto({
          competencia: "Sem dados",
          soNaFolha: [],
          soNasFerias: [],
          salarioDivergente: [],
        })
        return
      }

      // 2. Buscar linhas da folha dessa competência
      const { data: linhasFolha, error: errLinhas } = await (supabase as any)
        .from("folha_pagamento_linhas")
        .select("nome, cargo, salario_base, cpf, tipo")
        .eq("empresa_id", empresaAtiva.id)
        .eq("competencia", comp)

      if (errLinhas) throw errLinhas

      // 3. Buscar linhas de controle_ferias da empresa
      const { data: linhasFerias, error: errFerias } = await (supabase as any)
        .from("controle_ferias")
        .select("nome, funcao, salario_2025, ferias, cpf")
        .eq("empresa_id", empresaAtiva.id)

      if (errFerias) throw errFerias

      // Mapear férias por nome normalizado
      const mapFerias = new Map<string, any>()
      for (const row of linhasFerias || []) {
        const k = normalizarTexto(row.nome)
        if (k) mapFerias.set(k, row)
      }

      // Mapear folha por nome normalizado
      const mapFolha = new Map<string, any>()
      for (const row of linhasFolha || []) {
        const k = normalizarTexto(row.nome)
        if (k) mapFolha.set(k, row)
      }

      const soNaFolha: any[] = []
      const soNasFerias: any[] = []
      const salarioDivergente: any[] = []

      // Checar quem está na folha
      for (const [k, folhaRow] of mapFolha.entries()) {
        const feriasRow = mapFerias.get(k)
        if (!feriasRow) {
          soNaFolha.push({
            nome: folhaRow.nome,
            cargo: folhaRow.cargo || "—",
            salario: Number(folhaRow.salario_base) || 0,
            cpf: folhaRow.cpf || "",
          })
        } else {
          const salFolha = Number(folhaRow.salario_base) || 0
          const salFerias = Number(feriasRow.salario_2025) || 0
          const diff = Math.abs(salFolha - salFerias)
          if (diff > 0.05) {
            salarioDivergente.push({
              nome: folhaRow.nome,
              funcao: feriasRow.funcao || folhaRow.cargo || "—",
              salarioFolha: salFolha,
              salarioFerias: salFerias,
              diferenca: salFolha - salFerias,
            })
          }
        }
      }

      // Checar quem está só nas férias
      for (const [k, feriasRow] of mapFerias.entries()) {
        if (!mapFolha.has(k)) {
          soNasFerias.push({
            nome: feriasRow.nome,
            funcao: feriasRow.funcao || "—",
            salario: Number(feriasRow.salario_2025) || 0,
            ferias: feriasRow.ferias,
          })
        }
      }

      setResultadoConfronto({
        competencia: comp,
        soNaFolha,
        soNasFerias,
        salarioDivergente,
      })
    } catch (err: any) {
      console.error("Erro ao confrontar folha x ferias:", err)
      toast({
        title: "Erro ao confrontar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCarregandoConfronto(false)
    }
  }

  const fmtMoeda = (val: number | undefined | null) => {
    return (Number(val) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const fmtDataBr = (d: string | null | undefined) => {
    if (!d) return "—"
    const p = d.split("-")
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
    return d
  }

  return (
    <div className="space-y-4">
      {/* CARD PRINCIPAL */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Quadro de Pessoal — {empresaAtiva?.nome || "Unidade"}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 font-semibold text-xs"
                >
                  {colaboradores.length} Registros
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Visualização unificada de colaboradores (CLT e terceirizados) da
                unidade, com dados cadastrais, agência/conta, histórico de
                demissão e confronto com a folha mensal.
              </CardDescription>
            </div>

            {/* Ações e Seletor de Unidade */}
            <div className="flex flex-wrap items-center gap-2">
              {podeTrocarEmpresa && (
                <div className="flex items-center gap-1.5 bg-background/80 border border-border/50 rounded-lg px-2.5 py-1 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Unidade:
                  </span>
                  <select
                    value={empresaAtiva?.id || ""}
                    onChange={(e) => selecionarEmpresa(e.target.value)}
                    className="bg-transparent font-bold text-foreground text-xs focus:outline-none cursor-pointer"
                  >
                    {empresas.map((emp) => (
                      <option
                        key={emp.id}
                        value={emp.id}
                        className="bg-popover text-foreground"
                      >
                        {emp.nome} ({emp.slug.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={carregarDados}
                disabled={loading}
                className="h-8 gap-1.5 text-xs"
                title="Recarregar dados"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleImportarDaFolha}
                disabled={importandoFolha || loading}
                className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                title="Criar funcionários da folha que ainda não existem nesta unidade"
              >
                <Download
                  className={`w-3.5 h-3.5 ${
                    importandoFolha ? "animate-spin" : ""
                  }`}
                />
                {importandoFolha ? "Importando..." : "Importar da Folha"}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleAbrirConfronto}
                className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
                title="Comparar nomes e salários da Folha de Pagamento com o Controle de Férias"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Confrontar Folha × Férias
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Colaboradores Ativos
                </span>
                <span className="text-xl font-bold font-mono text-emerald-600 block mt-0.5">
                  {estatisticas.ativos}
                </span>
              </div>
              <UserCheck className="w-6 h-6 text-emerald-500/40" />
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Funcionários CLT
                </span>
                <span className="text-xl font-bold font-mono text-primary block mt-0.5">
                  {estatisticas.funcionarios}
                </span>
              </div>
              <Briefcase className="w-6 h-6 text-primary/40" />
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Terceiros Ativos
                </span>
                <span className="text-xl font-bold font-mono text-amber-600 block mt-0.5">
                  {estatisticas.terceiros}
                </span>
              </div>
              <Users className="w-6 h-6 text-amber-500/40" />
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Folha Bruta Ativa
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-foreground block mt-0.5 truncate">
                  {fmtMoeda(estatisticas.somaSalariosAtivos)}
                </span>
              </div>
              <DollarSign className="w-6 h-6 text-primary/40" />
            </div>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou função..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 w-full sm:w-auto">
              <Button
                type="button"
                variant={filtroStatus === "ativos" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFiltroStatus("ativos")}
                className="h-7 text-xs font-semibold px-2.5"
              >
                Ativos ({estatisticas.ativos})
              </Button>
              <Button
                type="button"
                variant={filtroStatus === "demitidos" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFiltroStatus("demitidos")}
                className="h-7 text-xs font-semibold px-2.5"
              >
                Demitidos ({estatisticas.demitidos})
              </Button>
              <Button
                type="button"
                variant={filtroStatus === "todos" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFiltroStatus("todos")}
                className="h-7 text-xs font-semibold px-2.5"
              >
                Todos ({colaboradores.length})
              </Button>
            </div>
          </div>

          {/* TABELA UNIFICADA */}
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              Carregando quadro de pessoal...
            </div>
          ) : colaboradoresFiltrados.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl border-border/60">
              Nenhum colaborador encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/40 rounded-xl bg-background/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/40 select-none">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Nome</th>
                    <th className="py-2.5 px-2 text-center w-24">Tipo</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Função</th>
                    <th className="py-2.5 px-3 min-w-[110px]">CPF</th>
                    <th className="py-2.5 px-2 text-center w-24">Admissão</th>
                    <th className="py-2.5 px-3 text-right min-w-[100px]">
                      Salário
                    </th>
                    <th className="py-2.5 px-3 min-w-[180px]">
                      Banco / Ag. / Conta / PIX
                    </th>
                    <th className="py-2.5 px-2 text-center w-24">Situação</th>
                    <th className="py-2.5 px-2 text-right w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {colaboradoresFiltrados.map((c) => (
                    <tr
                      key={`${c.origem}-${c.id}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* NOME */}
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        <div className="flex flex-col">
                          <span>{c.nome}</span>
                          {c.data_demissao && (
                            <span className="text-[10px] text-destructive font-mono">
                              Demitido em {fmtDataBr(c.data_demissao)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TIPO */}
                      <td className="py-2.5 px-2 text-center">
                        <Badge
                          variant={
                            c.tipo === "Funcionário" ? "default" : "secondary"
                          }
                          className={`text-[10px] uppercase font-bold ${
                            c.tipo === "Terceiro"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : ""
                          }`}
                        >
                          {c.tipo}
                        </Badge>
                      </td>

                      {/* FUNÇÃO */}
                      <td className="py-2.5 px-3 text-muted-foreground uppercase text-[11px]">
                        {c.funcao}
                      </td>

                      {/* CPF */}
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                        {c.cpf ? formatarCpfCnpj(c.cpf) : "—"}
                      </td>

                      {/* ADMISSÃO */}
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-muted-foreground">
                        {fmtDataBr(c.data_admissao)}
                      </td>

                      {/* SALÁRIO */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                        {fmtMoeda(c.salario)}
                      </td>

                      {/* DADOS BANCÁRIOS */}
                      <td className="py-2.5 px-3 text-[11px] font-mono text-muted-foreground">
                        <div className="space-y-0.5">
                          {c.agencia || c.conta ? (
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3 text-primary shrink-0" />
                              <span>
                                {c.agencia ? `Ag: ${c.agencia}` : ""}
                                {c.agencia && c.conta ? " • " : ""}
                                {c.conta ? `CC: ${c.conta}` : ""}
                              </span>
                            </div>
                          ) : null}
                          {c.pix && (
                            <div
                              className="text-[10px] text-muted-foreground/80 truncate max-w-[200px]"
                              title={`PIX: ${c.pix}`}
                            >
                              PIX: {c.pix}
                            </div>
                          )}
                          {!c.agencia && !c.conta && !c.pix && <span>—</span>}
                        </div>
                      </td>

                      {/* SITUAÇÃO */}
                      <td className="py-2.5 px-2 text-center">
                        {c.ativo ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold"
                          >
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold"
                          >
                            Demitido
                          </Badge>
                        )}
                      </td>

                      {/* AÇÕES */}
                      <td className="py-2.5 px-2 text-right">
                        {c.ativo && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setColaboradorParaDemitir(c)}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold gap-1"
                            title={`Registrar demissão de ${c.nome}`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Demitir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DE CONFIRMAÇÃO DE DEMISSÃO */}
      <AlertDialog
        open={!!colaboradorParaDemitir}
        onOpenChange={(open) => !open && setColaboradorParaDemitir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar demissão de colaborador?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Deseja confirmar a demissão de{" "}
                <strong className="text-foreground">
                  {colaboradorParaDemitir?.nome}
                </strong>{" "}
                ({colaboradorParaDemitir?.tipo} —{" "}
                {colaboradorParaDemitir?.funcao}) da unidade{" "}
                <strong className="text-foreground">
                  {empresaAtiva?.nome}
                </strong>
                ?
              </p>
              <p className="bg-destructive/10 p-2.5 rounded-lg border border-destructive/30 text-destructive text-[11px] font-medium">
                Ele sairá das listas ativas imediatamente e passará a constar
                apenas no filtro "Demitidos" com a data de demissão de hoje (
                {new Date().toLocaleDateString("pt-BR")}).
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={demitindo} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDemissao}
              disabled={demitindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold gap-1.5"
            >
              {demitindo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Demitindo...
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  Sim, Demitir Colaborador
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL CONFRONTO FOLHA × FÉRIAS */}
      <Dialog
        open={modalConfrontoAberta}
        onOpenChange={setModalConfrontoAberta}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Confronto: Folha de Pagamento × Controle de Férias
            </DialogTitle>
            <DialogDescription className="text-xs">
              Unidade <strong>{empresaAtiva?.nome}</strong> • Competência
              analisada:{" "}
              <span className="font-mono font-bold text-foreground">
                {resultadoConfronto?.competencia || "Mais recente"}
              </span>
            </DialogDescription>
          </DialogHeader>

          {carregandoConfronto ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              Cruzando bases de dados...
            </div>
          ) : !resultadoConfronto ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhum dado disponível para cruzamento.
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* GRUPO 1: SÓ NA FOLHA */}
              <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Só na Folha ({resultadoConfronto.soNaFolha.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Colaboradores que recebem na folha mas não constam no
                    controle de férias
                  </span>
                </div>

                {resultadoConfronto.soNaFolha.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    Nenhum colaborador exclusivo da folha. Tudo alinhado.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-border/30 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/30">
                        <tr>
                          <th className="py-2 px-3">Nome</th>
                          <th className="py-2 px-3">Cargo na Folha</th>
                          <th className="py-2 px-3 font-mono">CPF</th>
                          <th className="py-2 px-3 text-right">Salário Base</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 font-mono">
                        {resultadoConfronto.soNaFolha.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-2 px-3 font-sans font-semibold text-foreground">
                              {item.nome}
                            </td>
                            <td className="py-2 px-3 font-sans text-muted-foreground">
                              {item.cargo}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                              {item.cpf ? formatarCpfCnpj(item.cpf) : "—"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-foreground">
                              {fmtMoeda(item.salario)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* GRUPO 2: SÓ NO CONTROLE DE FÉRIAS */}
              <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                    <Calendar className="w-4 h-4" />
                    Só no Controle de Férias (
                    {resultadoConfronto.soNasFerias.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Colaboradores na planilha de férias que não estão nesta
                    folha mensal
                  </span>
                </div>

                {resultadoConfronto.soNasFerias.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    Nenhum colaborador exclusivo de férias. Tudo alinhado.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-border/30 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/30">
                        <tr>
                          <th className="py-2 px-3">Nome</th>
                          <th className="py-2 px-3">Função</th>
                          <th className="py-2 px-3 text-center">
                            Férias Agendadas
                          </th>
                          <th className="py-2 px-3 text-right">Salário 2025</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 font-mono">
                        {resultadoConfronto.soNasFerias.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-2 px-3 font-sans font-semibold text-foreground">
                              {item.nome}
                            </td>
                            <td className="py-2 px-3 font-sans text-muted-foreground">
                              {item.funcao}
                            </td>
                            <td className="py-2 px-3 text-center text-primary font-bold">
                              {fmtDataBr(item.ferias)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-foreground">
                              {fmtMoeda(item.salario)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* GRUPO 3: SALÁRIO DIVERGENTE */}
              <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
                    <DollarSign className="w-4 h-4" />
                    Salário Divergente (
                    {resultadoConfronto.salarioDivergente.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Diferença entre o salário base da folha e o Salário 2025 de
                    Férias
                  </span>
                </div>

                {resultadoConfronto.salarioDivergente.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    Nenhum salário divergente detectado. Os valores conferem.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-border/30 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/30">
                        <tr>
                          <th className="py-2 px-3">Nome</th>
                          <th className="py-2 px-3">Função</th>
                          <th className="py-2 px-3 text-right">Folha (Base)</th>
                          <th className="py-2 px-3 text-right">
                            Férias (2025)
                          </th>
                          <th className="py-2 px-3 text-right">Diferença</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 font-mono">
                        {resultadoConfronto.salarioDivergente.map(
                          (item, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-sans font-semibold text-foreground">
                                {item.nome}
                              </td>
                              <td className="py-2 px-3 font-sans text-muted-foreground">
                                {item.funcao}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {fmtMoeda(item.salarioFolha)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {fmtMoeda(item.salarioFerias)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-rose-600">
                                {item.diferenca > 0 ? "+" : ""}
                                {fmtMoeda(item.diferenca)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
