import React, { useState, useEffect, useMemo, useRef } from "react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { FeriasService } from "@/services/ferias"
import type { ItemControleFerias } from "@/types/ferias"
import { toast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { LOGO_GC_MIX_HORIZONTAL, LOGO_ALT_TEXT } from "@/assets/logos"
import {
  CalendarDays,
  Printer,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Building2,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react"

export function AbaControleFerias() {
  const { empresaAtiva, empresas, selecionarEmpresa } = useEmpresa()
  const { isAdministrador, podeTrocarEmpresa } = useUsuario()

  const [itens, setItens] = useState<ItemControleFerias[]>([])
  const [loading, setLoading] = useState(false)
  const [busca, setBusca] = useState("")
  const [salvandoInline, setSalvandoInline] = useState<string | null>(null)

  // Modal Novo Registro
  const [openModalNovo, setOpenModalNovo] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [novaFuncao, setNovaFuncao] = useState("")
  const [novoSalario, setNovoSalario] = useState<string>("0,00")
  const [novaAdmissao, setNovaAdmissao] = useState("")
  const [novoCpf, setNovoCpf] = useState("")
  const [novaAgencia, setNovaAgencia] = useState("")
  const [novaConta, setNovaConta] = useState("")
  const [novaFerias, setNovaFerias] = useState("")
  const [novaCalca, setNovaCalca] = useState("")
  const [novaCamisa, setNovaCamisa] = useState("")
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  // Dialog Exclusão
  const [itemParaExcluir, setItemParaExcluir] =
    useState<ItemControleFerias | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const printAreaRef = useRef<HTMLDivElement>(null)

  // Carregar dados da empresa ativa
  const carregarDados = async () => {
    if (!empresaAtiva?.id) return
    setLoading(true)
    try {
      const data = await FeriasService.getControleFerias(empresaAtiva.id)
      setItens(data)
    } catch (err: any) {
      toast({
        title: "Erro ao carregar controle de férias",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Formatação de data ISO (YYYY-MM-DD) para BR (DD/MM/AAAA)
  const formatarDataBr = (dataIso: string | null | undefined): string => {
    if (!dataIso) return "—"
    const partes = dataIso.split("-")
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return dataIso
  }

  // Formatação de Moeda
  const fmtMoeda = (val: number | null | undefined): string => {
    const n = Number(val) || 0
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  // Itens filtrados pela busca
  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return itens
    return itens.filter((it) => {
      return (
        it.nome.toLowerCase().includes(termo) ||
        it.funcao.toLowerCase().includes(termo) ||
        (it.cpf && it.cpf.includes(termo)) ||
        (it.calca && it.calca.toLowerCase().includes(termo)) ||
        (it.camisa && it.camisa.toLowerCase().includes(termo))
      )
    })
  }, [itens, busca])

  // Totais do rodapé
  const totais = useMemo(() => {
    const somaSalarios = itensFiltrados.reduce(
      (acc, it) => acc + (Number(it.salario_2025) || 0),
      0,
    )
    const comFeriasAgendadas = itensFiltrados.filter((it) => !!it.ferias).length
    const comCalca = itensFiltrados.filter(
      (it) => !!it.calca && it.calca.trim() !== "",
    ).length
    const comCamisa = itensFiltrados.filter(
      (it) => !!it.camisa && it.camisa.trim() !== "",
    ).length
    return {
      quantidade: itensFiltrados.length,
      somaSalarios,
      comFeriasAgendadas,
      comCalca,
      comCamisa,
    }
  }, [itensFiltrados])

  // Atualização inline direta (blur ou enter)
  const handleAtualizarInline = async (
    id: string,
    campo: keyof ItemControleFerias,
    valor: any,
  ) => {
    const itemAtual = itens.find((i) => i.id === id)
    if (!itemAtual) return

    // Evita chamada inútil se o valor for idêntico
    if ((itemAtual as any)[campo] === valor) return

    // Atualização otimista local
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)),
    )

    setSalvandoInline(`${id}-${campo}`)
    try {
      await FeriasService.atualizarItemFerias(id, { [campo]: valor })
    } catch (err: any) {
      toast({
        title: "Erro ao salvar alteração",
        description: err.message,
        variant: "destructive",
      })
      // Restaura do servidor se falhar
      carregarDados()
    } finally {
      setTimeout(() => setSalvandoInline(null), 500)
    }
  }

  // Criar novo registro
  const handleCriarNovo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresaAtiva?.id) return
    if (!novoNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do colaborador",
        variant: "destructive",
      })
      return
    }

    setSalvandoNovo(true)
    try {
      const salarioNumerico =
        Number(novoSalario.replace(/\./g, "").replace(",", ".")) || 0

      const proximaOrdem =
        itens.length > 0 ? Math.max(...itens.map((i) => i.ordem || 0)) + 1 : 1

      await FeriasService.criarItemFerias({
        empresa_id: empresaAtiva.id,
        ordem: proximaOrdem,
        nome: novoNome.trim(),
        funcao: novaFuncao.trim(),
        salario_2025: salarioNumerico,
        admissao: novaAdmissao || null,
        cpf: novoCpf.trim() || null,
        agencia: novaAgencia.trim() || null,
        conta_corrente: novaConta.trim() || null,
        ferias: novaFerias || null,
        calca: novaCalca.trim() || null,
        camisa: novaCamisa.trim() || null,
      })

      toast({
        title: "Registro adicionado",
        description: `${novoNome} foi inserido no controle de férias da empresa ${empresaAtiva.nome}.`,
      })

      // Limpar formulário
      setNovoNome("")
      setNovaFuncao("")
      setNovoSalario("0,00")
      setNovaAdmissao("")
      setNovoCpf("")
      setNovaAgencia("")
      setNovaConta("")
      setNovaFerias("")
      setNovaCalca("")
      setNovaCamisa("")
      setOpenModalNovo(false)

      await carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao cadastrar registro",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoNovo(false)
    }
  }

  // Excluir registro
  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return
    setExcluindo(true)
    try {
      await FeriasService.excluirItemFerias(itemParaExcluir.id)
      toast({
        title: "Registro removido com sucesso",
        description: `${itemParaExcluir.nome} foi removido do controle de férias.`,
      })
      setItemParaExcluir(null)
      await carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setExcluindo(false)
    }
  }

  // Disparar Impressão A4 Paisagem
  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* CARD PRINCIPAL EM TELA (NÃO IMPRESSO) */}
      <Card className="border-border/40 bg-card/70 no-print">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Controle de Férias — {empresaAtiva?.nome || "Unidade"}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 font-semibold text-xs"
                >
                  {empresaAtiva?.razao_social || empresaAtiva?.nome}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Planilha integrada de controle de férias por empresa com edição
                inline de datas, fardamento (calça e camisa) e impressão em A4
                paisagem com assinatura.
              </CardDescription>
            </div>

            {/* Ações do cabeçalho */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor rápido de unidade */}
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
                title="Recarregar tabela"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleImprimir}
                className="h-8 gap-1.5 text-xs font-semibold border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
                title="Imprimir relatório em A4 Paisagem com coluna de assinatura"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir A4 Paisagem</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setOpenModalNovo(true)}
                className="h-8 gap-1.5 bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Registro</span>
              </Button>
            </div>
          </div>

          {/* Barra de busca e estatísticas rápidas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador, função, CPF, tamanho..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-xs bg-background/50"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {totais.quantidade}
              </span>{" "}
              colaboradores • Total Folha:{" "}
              <span className="font-mono font-bold text-foreground">
                {fmtMoeda(totais.somaSalarios)}
              </span>
              • Férias Agendadas:{" "}
              <Badge variant="secondary" className="font-mono text-[10px]">
                {totais.comFeriasAgendadas}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-4">
          {itensFiltrados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              {loading
                ? "Carregando controle de férias..."
                : "Nenhum registro encontrado para esta unidade."}
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/40 rounded-xl bg-background/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/40 select-none">
                  <tr>
                    <th className="py-2.5 px-2 text-center w-10">Nº</th>
                    <th className="py-2.5 px-3 min-w-[200px]">NOME</th>
                    <th className="py-2.5 px-3 min-w-[120px]">FUNÇÃO</th>
                    <th className="py-2.5 px-3 text-right min-w-[110px]">
                      SALÁRIO 2025
                    </th>
                    <th className="py-2.5 px-3 min-w-[110px]">ADMISSÃO</th>
                    <th className="py-2.5 px-3 min-w-[120px]">CPF</th>
                    <th className="py-2.5 px-2 text-center w-20">AGÊNCIA</th>
                    <th className="py-2.5 px-3 min-w-[100px]">
                      CONTA CORRENTE
                    </th>
                    <th className="py-2.5 px-3 min-w-[130px] bg-primary/5 text-primary font-bold">
                      FÉRIAS
                    </th>
                    <th className="py-2.5 px-2 text-center w-16">CALÇA</th>
                    <th className="py-2.5 px-2 text-center w-16">CAM.</th>
                    <th className="py-2.5 px-2 text-right w-12">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {itensFiltrados.map((it, idx) => (
                    <tr
                      key={it.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Nº */}
                      <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                        {it.ordem || idx + 1}
                      </td>

                      {/* NOME (Editável inline no blur) */}
                      <td className="py-2 px-3 font-semibold text-foreground">
                        <input
                          type="text"
                          defaultValue={it.nome}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "nome",
                              e.target.value.trim(),
                            )
                          }
                          className="w-full bg-transparent hover:bg-background/80 focus:bg-background rounded px-1.5 py-0.5 border border-transparent focus:border-primary/50 outline-none font-semibold text-foreground transition-all truncate"
                          title="Clique para editar o nome"
                        />
                      </td>

                      {/* FUNÇÃO */}
                      <td className="py-2 px-3 text-muted-foreground">
                        <input
                          type="text"
                          defaultValue={it.funcao}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "funcao",
                              e.target.value.trim(),
                            )
                          }
                          className="w-full bg-transparent hover:bg-background/80 focus:bg-background rounded px-1.5 py-0.5 border border-transparent focus:border-primary/50 outline-none text-muted-foreground focus:text-foreground text-xs transition-all uppercase truncate"
                          title="Clique para editar a função"
                        />
                      </td>

                      {/* SALÁRIO 2025 */}
                      <td className="py-2 px-3 text-right font-mono text-foreground font-semibold">
                        <input
                          type="text"
                          defaultValue={it.salario_2025
                            .toFixed(2)
                            .replace(".", ",")}
                          onBlur={(e) => {
                            const val =
                              Number(
                                e.target.value
                                  .replace(/\./g, "")
                                  .replace(",", "."),
                              ) || 0
                            handleAtualizarInline(it.id, "salario_2025", val)
                          }}
                          className="w-24 text-right bg-transparent hover:bg-background/80 focus:bg-background rounded px-1.5 py-0.5 border border-transparent focus:border-primary/50 outline-none font-mono font-semibold transition-all"
                          title="Salário 2025"
                        />
                      </td>

                      {/* ADMISSÃO */}
                      <td className="py-2 px-3">
                        <input
                          type="date"
                          defaultValue={it.admissao || ""}
                          onChange={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "admissao",
                              e.target.value || null,
                            )
                          }
                          className="w-28 text-xs bg-transparent hover:bg-background/80 focus:bg-background rounded px-1.5 py-0.5 border border-transparent focus:border-primary/50 outline-none font-mono text-muted-foreground focus:text-foreground transition-all"
                          title="Data de admissão"
                        />
                      </td>

                      {/* CPF */}
                      <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                        <input
                          type="text"
                          defaultValue={it.cpf || ""}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "cpf",
                              e.target.value.trim(),
                            )
                          }
                          className="w-28 bg-transparent hover:bg-background/80 focus:bg-background rounded px-1.5 py-0.5 border border-transparent focus:border-primary/50 outline-none font-mono text-[11px] transition-all"
                          placeholder="000.000.000-00"
                        />
                      </td>

                      {/* AGÊNCIA */}
                      <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                        <input
                          type="text"
                          defaultValue={it.agencia || ""}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "agencia",
                              e.target.value.trim(),
                            )
                          }
                          className="w-16 text-center bg-transparent hover:bg-background/80 focus:bg-background rounded px-1 py-0.5 border border-transparent focus:border-primary/50 outline-none font-mono text-xs transition-all"
                          placeholder="—"
                        />
                      </td>

                      {/* CONTA CORRENTE */}
                      <td className="py-2 px-3 font-mono text-muted-foreground">
                        <input
                          type="text"
                          defaultValue={it.conta_corrente || ""}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "conta_corrente",
                              e.target.value.trim(),
                            )
                          }
                          className="w-24 bg-transparent hover:bg-background/80 focus:bg-background rounded px-1.5 py-0.5 border border-transparent focus:border-primary/50 outline-none font-mono text-xs transition-all"
                          placeholder="—"
                        />
                      </td>

                      {/* FÉRIAS (Destaque editável) */}
                      <td className="py-2 px-3 bg-primary/5">
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            defaultValue={it.ferias || ""}
                            onChange={(e) =>
                              handleAtualizarInline(
                                it.id,
                                "ferias",
                                e.target.value || null,
                              )
                            }
                            className="w-28 text-xs font-mono font-bold text-primary bg-background/80 border border-primary/30 rounded px-1.5 py-0.5 outline-none focus:border-primary shadow-2xs"
                            title="Data prevista de férias"
                          />
                        </div>
                      </td>

                      {/* CALÇA */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          defaultValue={it.calca || ""}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "calca",
                              e.target.value.trim().toUpperCase(),
                            )
                          }
                          className="w-12 text-center font-bold text-xs uppercase bg-transparent hover:bg-background/80 focus:bg-background rounded px-1 py-0.5 border border-transparent focus:border-primary/50 outline-none transition-all"
                          placeholder="—"
                          title="Tamanho da calça (ex: M, G, GG, XGG)"
                        />
                      </td>

                      {/* CAMISA */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          defaultValue={it.camisa || ""}
                          onBlur={(e) =>
                            handleAtualizarInline(
                              it.id,
                              "camisa",
                              e.target.value.trim().toUpperCase(),
                            )
                          }
                          className="w-12 text-center font-bold text-xs uppercase bg-transparent hover:bg-background/80 focus:bg-background rounded px-1 py-0.5 border border-transparent focus:border-primary/50 outline-none transition-all"
                          placeholder="—"
                          title="Tamanho da camisa (ex: M, G, GG, XGG)"
                        />
                      </td>

                      {/* AÇÕES */}
                      <td className="py-2 px-2 text-right">
                        {isAdministrador && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemParaExcluir(it)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            title="Excluir este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* RODAPÉ COM TOTAIS */}
                <tfoot className="bg-muted/70 font-bold border-t-2 border-border/60 text-xs">
                  <tr>
                    <td className="py-2.5 px-2 text-center font-mono">—</td>
                    <td className="py-2.5 px-3 uppercase text-foreground">
                      TOTAL ({totais.quantidade} COLABORADORES)
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-foreground font-black">
                      {fmtMoeda(totais.somaSalarios)}
                    </td>
                    <td
                      className="py-2.5 px-3 text-muted-foreground"
                      colSpan={4}
                    >
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {totais.comFeriasAgendadas} férias programadas
                      </span>
                    </td>
                    <td className="py-2.5 px-3 bg-primary/10 text-primary font-mono text-center">
                      {totais.comFeriasAgendadas} prog.
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[11px]">
                      {totais.comCalca} un.
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[11px]">
                      {totais.comCamisa} un.
                    </td>
                    <td className="py-2.5 px-2 text-right"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ÁREA DE IMPRESSÃO OFICIAL: A4 PAISAGEM COM ASSINATURA (SÓ VISÍVEL EM PRINT) */}
      <div
        className="hidden print:block font-sans text-black p-2 bg-white"
        ref={printAreaRef}
      >
        {/* Cabeçalho da Impressão */}
        <div className="flex items-center justify-between border-b pb-2 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_GC_MIX_HORIZONTAL}
              alt={LOGO_ALT_TEXT}
              className="h-10 object-contain"
            />
            <div>
              <h2 className="text-base font-bold uppercase tracking-tight">
                {empresaAtiva?.razao_social || "GC CONCRETO LTDA"}
              </h2>
              <p className="text-[11px] text-gray-700">
                UNIDADE: {empresaAtiva?.nome?.toUpperCase()} • CONTROLE DE
                FÉRIAS & UNIFORMES
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-xs uppercase bg-gray-100 px-3 py-1 rounded border border-gray-300">
              CONTROLE DE FÉRIAS
            </span>
            <p className="text-[10px] text-gray-600 mt-1">
              Impresso em: {new Date().toLocaleDateString("pt-BR")} às{" "}
              {new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Tabela de Impressão Paisagem */}
        <table className="w-full border-collapse border border-gray-400 text-[9px] leading-tight">
          <thead className="bg-gray-100 text-gray-900 font-bold uppercase">
            <tr>
              <th className="border border-gray-300 p-1 text-center w-6">Nº</th>
              <th className="border border-gray-300 p-1 text-left">NOME</th>
              <th className="border border-gray-300 p-1 text-left">FUNÇÃO</th>
              <th className="border border-gray-300 p-1 text-right">
                SALÁRIO 2025
              </th>
              <th className="border border-gray-300 p-1 text-center">
                ADMISSÃO
              </th>
              <th className="border border-gray-300 p-1 text-center">CPF</th>
              <th className="border border-gray-300 p-1 text-center">
                AGÊNCIA
              </th>
              <th className="border border-gray-300 p-1 text-left">
                CONTA CORRENTE
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold">
                FÉRIAS
              </th>
              <th className="border border-gray-300 p-1 text-center w-7">
                CALÇA
              </th>
              <th className="border border-gray-300 p-1 text-center w-7">
                CAM.
              </th>
              <th className="border border-gray-300 p-1 text-center w-36">
                ASSINATURA
              </th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it, idx) => (
              <tr key={it.id} className="border-b border-gray-300">
                <td className="border border-gray-300 p-1 text-center font-mono">
                  {it.ordem || idx + 1}
                </td>
                <td className="border border-gray-300 p-1 font-bold text-gray-900">
                  {it.nome}
                </td>
                <td className="border border-gray-300 p-1 uppercase">
                  {it.funcao || "—"}
                </td>
                <td className="border border-gray-300 p-1 text-right font-mono">
                  {fmtMoeda(it.salario_2025)}
                </td>
                <td className="border border-gray-300 p-1 text-center font-mono">
                  {formatarDataBr(it.admissao)}
                </td>
                <td className="border border-gray-300 p-1 text-center font-mono">
                  {it.cpf || "—"}
                </td>
                <td className="border border-gray-300 p-1 text-center font-mono">
                  {it.agencia || "—"}
                </td>
                <td className="border border-gray-300 p-1 font-mono">
                  {it.conta_corrente || "—"}
                </td>
                <td className="border border-gray-300 p-1 text-center font-mono font-bold bg-gray-50">
                  {formatarDataBr(it.ferias)}
                </td>
                <td className="border border-gray-300 p-1 text-center font-bold uppercase">
                  {it.calca || "—"}
                </td>
                <td className="border border-gray-300 p-1 text-center font-bold uppercase">
                  {it.camisa || "—"}
                </td>
                <td className="border border-gray-300 p-1 border-b border-gray-300">
                  <div className="w-full border-b border-gray-400 mt-3"></div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-400">
            <tr>
              <td className="border border-gray-300 p-1 text-center font-mono">
                —
              </td>
              <td className="border border-gray-300 p-1 uppercase">
                TOTAL GERAL ({itens.length} COLABORADORES)
              </td>
              <td className="border border-gray-300 p-1">—</td>
              <td className="border border-gray-300 p-1 text-right font-mono font-black">
                {fmtMoeda(totais.somaSalarios)}
              </td>
              <td
                className="border border-gray-300 p-1 text-center"
                colSpan={4}
              >
                Prog. Férias: {totais.comFeriasAgendadas}
              </td>
              <td className="border border-gray-300 p-1 text-center font-mono">
                {totais.comFeriasAgendadas}
              </td>
              <td className="border border-gray-300 p-1 text-center font-mono">
                {totais.comCalca}
              </td>
              <td className="border border-gray-300 p-1 text-center font-mono">
                {totais.comCamisa}
              </td>
              <td className="border border-gray-300 p-1"></td>
            </tr>
          </tfoot>
        </table>

        {/* Rodapé da Impressão */}
        <div className="mt-4 pt-2 border-t text-[9px] text-gray-500 flex justify-between items-center">
          <div>
            <span>
              GC MIX • Sistema Integrado de Gestão Operacional & Férias
            </span>
          </div>
          <div>
            <span>
              Visto da Gerência / RH:
              _____________________________________________
            </span>
          </div>
        </div>
      </div>

      {/* MODAL ADICIONAR NOVO REGISTRO */}
      <Dialog open={openModalNovo} onOpenChange={setOpenModalNovo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4 text-primary" />
              Novo Registro no Controle de Férias
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione um novo colaborador ou período de férias para a unidade{" "}
              <strong>{empresaAtiva?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCriarNovo} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="novo-nome" className="text-xs font-semibold">
                  Nome do Colaborador *
                </Label>
                <Input
                  id="novo-nome"
                  required
                  placeholder="Ex: JOSÉ DA SILVA"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nova-funcao" className="text-xs font-semibold">
                  Função
                </Label>
                <Input
                  id="nova-funcao"
                  placeholder="Ex: MOTORISTA"
                  value={novaFuncao}
                  onChange={(e) => setNovaFuncao(e.target.value)}
                  className="h-9 text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="novo-salario" className="text-xs font-semibold">
                  Salário 2025 (R$)
                </Label>
                <Input
                  id="novo-salario"
                  placeholder="2.410,00"
                  value={novoSalario}
                  onChange={(e) => setNovoSalario(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="nova-admissao"
                  className="text-xs font-semibold"
                >
                  Data de Admissão
                </Label>
                <Input
                  id="nova-admissao"
                  type="date"
                  value={novaAdmissao}
                  onChange={(e) => setNovaAdmissao(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="novo-cpf" className="text-xs font-semibold">
                  CPF
                </Label>
                <Input
                  id="novo-cpf"
                  placeholder="000.000.000-00"
                  value={novoCpf}
                  onChange={(e) => setNovoCpf(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nova-agencia" className="text-xs font-semibold">
                  Agência
                </Label>
                <Input
                  id="nova-agencia"
                  placeholder="Ex: 6240"
                  value={novaAgencia}
                  onChange={(e) => setNovaAgencia(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nova-conta" className="text-xs font-semibold">
                  Conta Corrente
                </Label>
                <Input
                  id="nova-conta"
                  placeholder="Ex: 255425-9"
                  value={novaConta}
                  onChange={(e) => setNovaConta(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="nova-ferias"
                  className="text-xs font-semibold text-primary"
                >
                  Data de Férias
                </Label>
                <Input
                  id="nova-ferias"
                  type="date"
                  value={novaFerias}
                  onChange={(e) => setNovaFerias(e.target.value)}
                  className="h-9 text-xs font-mono font-bold border-primary/40"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nova-calca" className="text-xs font-semibold">
                  Calça
                </Label>
                <Input
                  id="nova-calca"
                  placeholder="Ex: G, GG, XGG"
                  value={novaCalca}
                  onChange={(e) => setNovaCalca(e.target.value)}
                  className="h-9 text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nova-camisa" className="text-xs font-semibold">
                  Camisa
                </Label>
                <Input
                  id="nova-camisa"
                  placeholder="Ex: G, GG, XGG"
                  value={novaCamisa}
                  onChange={(e) => setNovaCamisa(e.target.value)}
                  className="h-9 text-xs uppercase"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModalNovo(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvandoNovo}
                className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5"
              >
                <Check className="w-4 h-4" />
                {salvandoNovo ? "Salvando..." : "Salvar Registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!itemParaExcluir}
        onOpenChange={(open) => !open && setItemParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-destructive">
              Excluir registro do Controle de Férias?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja excluir o registro de{" "}
              <strong>{itemParaExcluir?.nome}</strong> (Função:{" "}
              {itemParaExcluir?.funcao}) da empresa {empresaAtiva?.nome}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90"
            >
              {excluindo ? "Excluindo..." : "Excluir Registro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
