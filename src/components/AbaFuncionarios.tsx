import { useState, useMemo } from "react"
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Building2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { ExamesService } from "@/services/exames"
import { FuncionarioComExames } from "@/types/exames"
import { formatarCpfCnpj, limparMascara, validarCPF } from "@/lib/documentos"

const SUGESTOES_FUNCOES = [
  "Motorista",
  "Balanceiro",
  "Ajudante",
  "Vendedor",
  "Secretaria",
  "Operador de Pá",
  "Mecânico",
  "Encarregado",
]

interface AbaFuncionariosProps {
  funcionarios: FuncionarioComExames[]
  loading: boolean
  onAtualizar: () => void
  onVerExames: (funcionario: FuncionarioComExames) => void
}

export function AbaFuncionarios({
  funcionarios,
  loading,
  onAtualizar,
  onVerExames,
}: AbaFuncionariosProps) {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()

  // Filtros
  const [busca, setBusca] = useState("")
  const [filtroFuncao, setFiltroFuncao] = useState<string>("TODAS")
  const [filtroStatusAtivo, setFiltroStatusAtivo] = useState<string>("TODOS")

  // Modal Incluir / Editar Funcionário
  const [modalOpen, setModalOpen] = useState(false)
  const [funcionarioEditando, setFuncionarioEditando] =
    useState<FuncionarioComExames | null>(null)
  const [formNome, setFormNome] = useState("")
  const [formFuncao, setFormFuncao] = useState("")
  const [formCpf, setFormCpf] = useState("")
  const [formDataAdmissao, setFormDataAdmissao] = useState("")
  const [formObservacoes, setFormObservacoes] = useState("")
  const [formAtivo, setFormAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Diálogo de Exclusão
  const [dialogExclusaoOpen, setDialogExclusaoOpen] = useState(false)
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] =
    useState<FuncionarioComExames | null>(null)
  const [examesVinculadosCount, setExamesVinculadosCount] =
    useState<number | null>(null)
  const [checandoVinculos, setChecandoVinculos] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Alternar status ativo
  const [alterandoStatusId, setAlterandoStatusId] = useState<string | null>(
    null,
  )

  // Lista de funções existentes para o filtro
  const funcoesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    funcionarios.forEach((f) => {
      if (f.funcao) set.add(f.funcao)
    })
    return Array.from(set).sort()
  }, [funcionarios])

  // Contadores
  const totalFuncionarios = funcionarios.length
  const totalAtivos = useMemo(
    () => funcionarios.filter((f) => f.ativo).length,
    [funcionarios],
  )
  const totalInativos = totalFuncionarios - totalAtivos

  // Funcionários filtrados
  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) => {
      // Busca por nome ou CPF
      if (busca) {
        const termo = busca.toLowerCase()
        const cpfLimpo = f.cpf ? limparMascara(f.cpf) : ""
        const bateNome = f.nome.toLowerCase().includes(termo)
        const bateFuncao = f.funcao.toLowerCase().includes(termo)
        const bateCpf = f.cpf?.includes(termo) || cpfLimpo.includes(termo)
        if (!bateNome && !bateFuncao && !bateCpf) return false
      }

      // Filtro por Função
      if (filtroFuncao !== "TODAS" && f.funcao !== filtroFuncao) {
        return false
      }

      // Filtro por Ativo/Inativo
      if (filtroStatusAtivo === "ATIVO" && !f.ativo) return false
      if (filtroStatusAtivo === "INATIVO" && f.ativo) return false

      return true
    })
  }, [funcionarios, busca, filtroFuncao, filtroStatusAtivo])

  // Abrir modal de criação
  const handleNovo = () => {
    if (!isAdministrador) {
      toast({
        title: "Permissão necessária",
        description:
          "Apenas Administradores podem cadastrar novos funcionários.",
        variant: "destructive",
      })
      return
    }
    setFuncionarioEditando(null)
    setFormNome("")
    setFormFuncao("")
    setFormCpf("")
    setFormDataAdmissao("")
    setFormObservacoes("")
    setFormAtivo(true)
    setModalOpen(true)
  }

  // Abrir modal de edição
  const handleEditar = (func: FuncionarioComExames) => {
    if (!isAdministrador) {
      toast({
        title: "Permissão necessária",
        description:
          "Apenas Administradores podem editar dados cadastrais de funcionários.",
        variant: "destructive",
      })
      return
    }
    setFuncionarioEditando(func)
    setFormNome(func.nome)
    setFormFuncao(func.funcao)
    setFormCpf(func.cpf ? formatarCpfCnpj(func.cpf) : "")
    setFormDataAdmissao(func.data_admissao || "")
    setFormObservacoes(func.observacoes || "")
    setFormAtivo(func.ativo)
    setModalOpen(true)
  }

  // Salvar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdministrador) return

    if (!formNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome completo do funcionário.",
        variant: "destructive",
      })
      return
    }

    const cpfLimpo = formCpf ? limparMascara(formCpf) : null
    if (cpfLimpo) {
      if (cpfLimpo.length !== 11) {
        toast({
          title: "CPF incompleto",
          description: "O CPF deve possuir exatamente 11 dígitos numéricos.",
          variant: "destructive",
        })
        return
      }
      if (!validarCPF(cpfLimpo)) {
        toast({
          title: "CPF inválido",
          description:
            "Os dígitos verificadores do CPF informado são inválidos.",
          variant: "destructive",
        })
        return
      }
    }

    if (!empresaAtiva) return
    setSalvando(true)

    try {
      await ExamesService.salvarFuncionario({
        id: funcionarioEditando?.id,
        empresa_id: empresaAtiva.id,
        nome: formNome.trim().toUpperCase(),
        funcao: formFuncao.trim() || "Geral",
        cpf: cpfLimpo,
        data_admissao: formDataAdmissao || null,
        ativo: formAtivo,
        observacoes: formObservacoes.trim() || null,
      })

      toast({
        title: funcionarioEditando
          ? "Colaborador atualizado com sucesso!"
          : "Novo colaborador cadastrado com sucesso!",
        description: `${formNome.trim().toUpperCase()} na unidade ${empresaAtiva.nome}.`,
      })

      setModalOpen(false)
      onAtualizar()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar colaborador",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  // Alternar ativo/inativo
  const handleAlternarAtivo = async (func: FuncionarioComExames) => {
    if (!isAdministrador) {
      toast({
        title: "Permissão necessária",
        description:
          "Apenas Administradores podem ativar ou desativar colaboradores.",
        variant: "destructive",
      })
      return
    }

    const novoStatus = !func.ativo
    setAlterandoStatusId(func.id)
    try {
      await ExamesService.alternarStatusFuncionario(
        func.id,
        novoStatus,
        empresaAtiva?.id,
      )
      toast({
        title: novoStatus ? "Colaborador reativado" : "Colaborador desativado",
        description: `${func.nome} agora está ${
          novoStatus ? "ativo" : "inativo"
        }.`,
      })
      onAtualizar()
    } catch (err: any) {
      toast({
        title: "Erro ao alterar status",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setAlterandoStatusId(null)
    }
  }

  // Iniciar exclusão: checa exames vinculados primeiro
  const handleIniciarExclusao = async (func: FuncionarioComExames) => {
    if (!isAdministrador) {
      toast({
        title: "Permissão necessária",
        description: "Apenas Administradores podem excluir funcionários.",
        variant: "destructive",
      })
      return
    }

    setFuncionarioParaExcluir(func)
    setExamesVinculadosCount(null)
    setChecandoVinculos(true)
    setDialogExclusaoOpen(true)

    try {
      const count = await ExamesService.verificarExamesVinculados(func.id)
      setExamesVinculadosCount(count)
    } catch (err: any) {
      console.error("Erro ao verificar exames vinculados:", err)
      setExamesVinculadosCount(0)
    } finally {
      setChecandoVinculos(false)
    }
  }

  // Confirmar exclusão definitiva
  const handleConfirmarExclusao = async () => {
    if (!funcionarioParaExcluir || !empresaAtiva) return
    setExcluindo(true)
    try {
      await ExamesService.excluirFuncionario(
        funcionarioParaExcluir.id,
        empresaAtiva.id,
      )
      toast({
        title: "Colaborador excluído!",
        description: `${funcionarioParaExcluir.nome} foi removido com sucesso.`,
      })
      setDialogExclusaoOpen(false)
      setFuncionarioParaExcluir(null)
      onAtualizar()
    } catch (err: any) {
      toast({
        title: "Exclusão bloqueada",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner da Empresa e Ação Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Cadastro de Funcionários da Unidade
              {empresaAtiva && (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold"
                >
                  {empresaAtiva.nome}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              Gerencie os colaboradores da concreteira com isolamento por
              empresa. Os registros alimentam o prontuário ocupacional e o
              controle de exames admissionais, periódicos e demissionais.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAdministrador ? (
            <Button
              size="sm"
              onClick={handleNovo}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Funcionário</span>
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="text-xs gap-1.5 py-1 px-3 bg-muted/60 text-muted-foreground border-border/40"
            >
              <Lock className="w-3.5 h-3.5" />
              Edição restrita ao Administrador
            </Badge>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Cadastrados
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {totalFuncionarios}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidade {empresaAtiva?.nome || "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Colaboradores Ativos
            </CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalAtivos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em atividade na concreteira
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inativos / Desligados
            </CardTitle>
            <UserX className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-muted-foreground">
              {totalInativos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Histórico preservado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Campo de Busca por Nome ou CPF */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou função..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Filtro por Função */}
            <div>
              <Select value={filtroFuncao} onValueChange={setFiltroFuncao}>
                <SelectTrigger className="h-10 text-xs">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Todas as Funções" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS" className="text-xs">
                    Todas as Funções
                  </SelectItem>
                  {funcoesDisponiveis.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status (Ativo/Inativo) */}
            <div>
              <Select
                value={filtroStatusAtivo}
                onValueChange={setFiltroStatusAtivo}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Status Ativo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">
                    Todos os Funcionários
                  </SelectItem>
                  <SelectItem
                    value="ATIVO"
                    className="text-xs text-emerald-600 font-medium"
                  >
                    Apenas Ativos ({totalAtivos})
                  </SelectItem>
                  <SelectItem
                    value="INATIVO"
                    className="text-xs text-muted-foreground font-medium"
                  >
                    Apenas Inativos ({totalInativos})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total e Limpar */}
            <div className="flex items-center justify-end gap-2">
              {(busca ||
                filtroFuncao !== "TODAS" ||
                filtroStatusAtivo !== "TODOS") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusca("")
                    setFiltroFuncao("TODAS")
                    setFiltroStatusAtivo("TODOS")
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground h-10"
                >
                  Limpar Filtros
                </Button>
              )}
              <span className="text-xs font-mono text-muted-foreground">
                {funcionariosFiltrados.length} listados
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Colaboradores */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Quadro de Colaboradores
            </CardTitle>
            <CardDescription className="text-xs">
              Listagem cadastral com dados de admissão, CPF e atalho direto para
              a aba de exames.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              Carregando funcionários da unidade {empresaAtiva?.nome}...
            </div>
          ) : funcionariosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              Nenhum colaborador encontrado com os filtros selecionados.{" "}
              {isAdministrador && (
                <button
                  type="button"
                  onClick={handleNovo}
                  className="text-primary underline ml-1 font-semibold"
                >
                  Cadastrar agora
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10">
                  <tr>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Nome do Colaborador</th>
                    <th className="py-3 px-3">Função</th>
                    <th className="py-3 px-3">CPF</th>
                    <th className="py-3 px-3">Data de Admissão</th>
                    <th className="py-3 px-3">Exames Registrados</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {funcionariosFiltrados.map((f) => {
                    const examesComData = Object.values(f.exames).filter(
                      (e) => e.dataRealizacao !== null,
                    ).length

                    return (
                      <tr
                        key={f.id}
                        className={`hover:bg-muted/20 transition-colors group ${
                          !f.ativo ? "opacity-65 bg-muted/10" : ""
                        }`}
                      >
                        {/* Status Ativo/Inativo */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {f.ativo ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            >
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-muted text-muted-foreground border-border/40"
                            >
                              Inativo
                            </Badge>
                          )}
                        </td>

                        {/* Nome + Observação */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-foreground block whitespace-nowrap">
                            {f.nome}
                          </span>
                          {f.observacoes && (
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[220px]">
                              {f.observacoes}
                            </span>
                          )}
                        </td>

                        {/* Função */}
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-foreground">
                            {f.funcao}
                          </span>
                        </td>

                        {/* CPF */}
                        <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                          {f.cpf ? formatarCpfCnpj(f.cpf) : "—"}
                        </td>

                        {/* Data Admissão */}
                        <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                          {formatarData(f.data_admissao)}
                        </td>

                        {/* Resumo de Exames */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold">
                              {examesComData}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {examesComData === 1
                                ? "exame realizado"
                                : "exames realizados"}
                            </span>
                            {f.totalVencidos > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-4 px-1.5 text-[9px] font-mono leading-none ml-1"
                              >
                                {f.totalVencidos} vencido(s)
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botão de Atalho "Ver exames" */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onVerExames(f)}
                              className="text-[11px] h-7 px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                              title="Filtrar exames deste colaborador na aba Controle de Exames"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Ver exames</span>
                            </Button>

                            {/* Editar dados do funcionário */}
                            {isAdministrador && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditar(f)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Editar dados cadastrais"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Desativar / Reativar */}
                            {isAdministrador && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAlternarAtivo(f)}
                                disabled={alterandoStatusId === f.id}
                                className={`h-7 w-7 ${
                                  f.ativo
                                    ? "text-amber-600 hover:bg-amber-500/10"
                                    : "text-emerald-600 hover:bg-emerald-500/10"
                                }`}
                                title={
                                  f.ativo
                                    ? "Desativar colaborador"
                                    : "Reativar colaborador"
                                }
                              >
                                {f.ativo ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}

                            {/* Excluir (somente Administrador) */}
                            {isAdministrador && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleIniciarExclusao(f)}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                title="Excluir funcionário (com validação de vínculos)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Incluir / Editar Funcionário */}
      <Dialog
        open={modalOpen}
        onOpenChange={(v) => !salvando && setModalOpen(v)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              {funcionarioEditando
                ? `Editar Colaborador: ${funcionarioEditando.nome}`
                : "Novo Colaborador"}
              {empresaAtiva && (
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/30"
                >
                  {empresaAtiva.nome}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do colaborador para vinculação de exames
              ocupacionais na unidade ativa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label htmlFor="cad-nome" className="text-xs font-medium">
                Nome Completo *
              </Label>
              <Input
                id="cad-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value.toUpperCase())}
                placeholder="Ex: JOSÉ DA SILVA"
                className="h-9 text-xs font-semibold uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="cad-funcao" className="text-xs font-medium">
                  Função / Cargo *
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  (digitação livre ou sugestões abaixo)
                </span>
              </div>
              <Input
                id="cad-funcao"
                value={formFuncao}
                onChange={(e) => setFormFuncao(e.target.value)}
                placeholder="Ex: Motorista, Balanceiro, Ajudante, Vendedor, Secretaria..."
                className="h-9 text-xs"
                required
              />
              {/* Sugestões de preenchimento rápido */}
              <div className="flex flex-wrap gap-1 pt-1">
                {SUGESTOES_FUNCOES.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFormFuncao(sug)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      formFuncao.toLowerCase() === sug.toLowerCase()
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/40"
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cad-cpf" className="text-xs font-medium">
                  CPF
                </Label>
                <Input
                  id="cad-cpf"
                  value={formCpf}
                  onChange={(e) => setFormCpf(formatarCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cad-admissao" className="text-xs font-medium">
                  Data de Admissão
                </Label>
                <Input
                  id="cad-admissao"
                  type="date"
                  value={formDataAdmissao}
                  onChange={(e) => setFormDataAdmissao(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cad-obs" className="text-xs font-medium">
                Observações
              </Label>
              <Input
                id="cad-obs"
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                placeholder="Ex: CNH D/E, restrições médicas, turno..."
                className="h-9 text-xs"
              />
            </div>

            {/* Checkbox Ativo */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cad-ativo"
                checked={formAtivo}
                onChange={(e) => setFormAtivo(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <Label
                htmlFor="cad-ativo"
                className="text-xs font-medium cursor-pointer"
              >
                Colaborador ativo na unidade {empresaAtiva?.nome}
              </Label>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-border/30">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="bg-primary text-primary-foreground font-semibold gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {salvando
                  ? "Salvando..."
                  : funcionarioEditando
                    ? "Salvar Alterações"
                    : "Cadastrar Funcionário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Exclusão com Bloqueio de Vínculos e Orientação de Desativação */}
      <AlertDialog
        open={dialogExclusaoOpen}
        onOpenChange={(v) => !excluindo && setDialogExclusaoOpen(v)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão de Funcionário
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm pt-2 leading-relaxed">
              {checandoVinculos ? (
                <span>Verificando registros de exames vinculados...</span>
              ) : examesVinculadosCount && examesVinculadosCount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Exclusão Bloqueada — Registros Vinculados
                    </p>
                    <p className="mt-1">
                      O colaborador{" "}
                      <strong>{funcionarioParaExcluir?.nome}</strong> possui{" "}
                      <strong>
                        {examesVinculadosCount} exame(s) realizado(s)
                      </strong>{" "}
                      registrado(s) no sistema.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Para preservar a rastreabilidade médica e fiscal da empresa
                    (NR-7), este cadastro <strong>não pode ser excluído</strong>
                    . Recomendamos apenas <strong>desativar</strong> o
                    colaborador.
                  </p>
                </div>
              ) : (
                <div>
                  Deseja realmente excluir permanentemente o cadastro de{" "}
                  <strong className="text-foreground">
                    {funcionarioParaExcluir?.nome}
                  </strong>{" "}
                  ({funcionarioParaExcluir?.funcao}) da unidade{" "}
                  <strong className="text-foreground">
                    {empresaAtiva?.nome}
                  </strong>
                  ?
                  <p className="text-xs text-muted-foreground mt-2">
                    Não existem exames realizados registrados para este
                    colaborador. A exclusão será definitiva.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>

            {examesVinculadosCount && examesVinculadosCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (funcionarioParaExcluir) {
                    await handleAlternarAtivo(funcionarioParaExcluir)
                    setDialogExclusaoOpen(false)
                    setFuncionarioParaExcluir(null)
                  }
                }}
                className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs"
              >
                <UserX className="w-3.5 h-3.5 mr-1" />
                Desativar Colaborador
              </Button>
            ) : (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleConfirmarExclusao()
                }}
                disabled={excluindo || checandoVinculos}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {excluindo ? "Excluindo..." : "Sim, Excluir Cadastro"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—"
  const partes = iso.split("-")
  if (partes.length !== 3) return iso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}
