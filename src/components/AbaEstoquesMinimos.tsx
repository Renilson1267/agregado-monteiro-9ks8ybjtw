import { useState, useEffect, useMemo } from "react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { ConcreteiraService } from "@/services/concreteira"
import { Material } from "@/types/concreteira"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Boxes,
  Pencil,
  RefreshCw,
  Search,
  Building2,
  AlertCircle,
  Check,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function AbaEstoquesMinimos() {
  const { empresaAtiva, empresas, selecionarEmpresa } = useEmpresa()
  const { isBalanceiro, podeTrocarEmpresa } = useUsuario()

  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")

  // Edição do mínimo (modal com campo)
  const [openModalEditar, setOpenModalEditar] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(
    null,
  )
  const [novoMinimo, setNovoMinimo] = useState<number>(0)

  // Modal de confirmação antes de gravar no banco ("Confirmar alteração?")
  const [openConfirmacaoSalvar, setOpenConfirmacaoSalvar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const carregarMateriais = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const todos = await ConcreteiraService.getMateriais(empresaAtiva.id)
      // Filtra apenas os materiais controlados (cimento, aditivo e demais com controle de estoque)
      const controlados = todos.filter(
        (m) =>
          m.controla_estoque === true ||
          m.codigo === "cimento" ||
          m.codigo === "aditivo",
      )
      setMateriais(controlados)
    } catch (err: any) {
      toast({
        title: "Erro ao carregar materiais",
        description:
          err.message || "Não foi possível carregar os estoques da unidade.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarMateriais()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Materiais filtrados pela busca textual
  const materiaisFiltrados = useMemo(() => {
    if (!busca.trim()) return materiais
    const termo = busca.toLowerCase()
    return materiais.filter(
      (m) =>
        m.nome.toLowerCase().includes(termo) ||
        m.codigo.toLowerCase().includes(termo) ||
        m.unidade.toLowerCase().includes(termo),
    )
  }, [materiais, busca])

  // Iniciar edição
  const handleIniciarEdicao = (mat: Material) => {
    setMaterialEditando(mat)
    setNovoMinimo(Number(mat.estoque_minimo) || 0)
    setOpenModalEditar(true)
  }

  // Submissão do formulário de edição -> pede confirmação no modal
  const handleSolicitarSalvar = (e: React.FormEvent) => {
    e.preventDefault()
    if (novoMinimo < 0 || isNaN(novoMinimo)) {
      toast({
        title: "Valor inválido",
        description:
          "Informe um estoque mínimo válido (maior ou igual a zero).",
        variant: "destructive",
      })
      return
    }
    setOpenConfirmacaoSalvar(true)
  }

  // Executa a gravação no Supabase após confirmar no AlertDialog
  const handleConfirmarSalvar = async () => {
    if (!materialEditando) return
    setSalvando(true)
    try {
      await ConcreteiraService.updateMaterialEstoqueMinimo(
        materialEditando.id,
        novoMinimo,
      )

      toast({
        title: "Alteração confirmada",
        description: `Estoque mínimo de ${materialEditando.nome} atualizado para ${novoMinimo.toLocaleString("pt-BR")} ${materialEditando.unidade}.`,
      })

      setOpenConfirmacaoSalvar(false)
      setOpenModalEditar(false)
      setMaterialEditando(null)
      await carregarMateriais()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar alteração",
        description:
          err.message || "Não foi possível gravar o novo estoque mínimo.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  // Função auxiliar para calcular o status do material
  const obterStatusMaterial = (saldo: number, minimo: number) => {
    if (saldo < minimo) {
      return {
        label: "Abaixo do mínimo",
        variant: "destructive" as const,
        badgeClass:
          "bg-destructive/15 text-destructive border-destructive/30 font-semibold",
        icon: AlertTriangle,
      }
    }
    if (saldo === minimo) {
      return {
        label: "No mínimo",
        variant: "outline" as const,
        badgeClass:
          "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold",
        icon: AlertCircle,
      }
    }
    return {
      label: "OK",
      variant: "outline" as const,
      badgeClass:
        "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold",
      icon: CheckCircle2,
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-primary" />
                  Estoques Mínimos — {empresaAtiva?.nome || "Unidade"}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 font-semibold text-xs"
                >
                  {empresaAtiva?.razao_social || empresaAtiva?.nome}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Configure os limites mínimos de segurança para cimento, aditivo
                e materiais com controle de estoque na unidade selecionada.
              </CardDescription>
            </div>

            {/* Ações do cabeçalho */}
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
                onClick={carregarMateriais}
                disabled={loading}
                className="h-8 gap-1.5 text-xs"
                title="Recarregar estoques mínimos"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar material controlado..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-xs bg-background/50"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {materiais.length}
              </span>{" "}
              materiais controlados cadastrados na unidade{" "}
              <strong className="text-foreground">{empresaAtiva?.nome}</strong>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-4">
          {materiaisFiltrados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              {loading
                ? "Carregando estoques mínimos..."
                : "Nenhum material controlado encontrado para esta unidade."}
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/40 rounded-xl bg-background/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/40 select-none">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[220px]">
                      NOME DO MATERIAL
                    </th>
                    <th className="py-2.5 px-3 text-center w-28">
                      UNIDADE DE MEDIDA
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[130px]">
                      SALDO ATUAL
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[130px]">
                      MÍNIMO ATUAL
                    </th>
                    <th className="py-2.5 px-3 text-center min-w-[150px]">
                      STATUS
                    </th>
                    <th className="py-2.5 px-3 text-right w-16">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {materiaisFiltrados.map((mat) => {
                    const saldo = Number(mat.saldo) || 0
                    const minimo = Number(mat.estoque_minimo) || 0
                    const status = obterStatusMaterial(saldo, minimo)
                    const StatusIcon = status.icon

                    return (
                      <tr
                        key={mat.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* NOME DO MATERIAL */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-foreground block">
                            {mat.nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                            Código: {mat.codigo}
                          </span>
                        </td>

                        {/* UNIDADE DE MEDIDA */}
                        <td className="py-3 px-3 text-center font-mono uppercase text-muted-foreground">
                          <Badge variant="secondary" className="text-[11px]">
                            {mat.unidade}
                          </Badge>
                        </td>

                        {/* SALDO ATUAL */}
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              saldo < minimo
                                ? "text-destructive"
                                : saldo === minimo
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-foreground"
                            }
                          >
                            {saldo.toLocaleString("pt-BR")} {mat.unidade}
                          </span>
                          {mat.unidade === "kg" && saldo >= 1000 && (
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {(saldo / 1000).toFixed(2)} t
                            </span>
                          )}
                        </td>

                        {/* MÍNIMO ATUAL */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                          {minimo.toLocaleString("pt-BR")} {mat.unidade}
                          {mat.unidade === "kg" && minimo >= 1000 && (
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {(minimo / 1000).toFixed(2)} t
                            </span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={status.variant}
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 ${status.badgeClass}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </td>

                        {/* AÇÕES (LÁPIS) */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isBalanceiro}
                              onClick={() => handleIniciarEdicao(mat)}
                              className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-md disabled:opacity-40"
                              title={
                                isBalanceiro
                                  ? "Usuário balanceiro não possui permissão para editar"
                                  : `Alterar estoque mínimo de ${mat.nome}`
                              }
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="sr-only">
                                Editar estoque mínimo de {mat.nome}
                              </span>
                            </Button>
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

      {/* MODAL EDITAR ESTOQUE MÍNIMO */}
      <Dialog
        open={openModalEditar}
        onOpenChange={(open) => {
          if (!open && !salvando) {
            setOpenModalEditar(false)
            setMaterialEditando(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="w-4 h-4 text-primary" />
              Alterar Estoque Mínimo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina a quantidade mínima de segurança para o insumo controlado.
            </DialogDescription>
          </DialogHeader>

          {materialEditando && (
            <form onSubmit={handleSolicitarSalvar} className="space-y-4 py-2">
              <div className="p-3 rounded-lg border border-border/40 bg-muted/30 space-y-1">
                <span className="text-sm font-semibold text-foreground block">
                  {materialEditando.nome}
                </span>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Unidade: <strong>{empresaAtiva?.nome}</strong>
                  </span>
                  <span>
                    Medida: <strong>{materialEditando.unidade}</strong>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-1 border-t border-border/30 mt-1 flex justify-between">
                  <span>Saldo Atual:</span>
                  <span className="font-mono font-bold text-foreground">
                    {(Number(materialEditando.saldo) || 0).toLocaleString(
                      "pt-BR",
                    )}{" "}
                    {materialEditando.unidade}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="input-novo-minimo"
                  className="text-xs font-semibold"
                >
                  Novo Estoque Mínimo ({materialEditando.unidade}) *
                </Label>
                <Input
                  id="input-novo-minimo"
                  type="number"
                  min="0"
                  step="any"
                  value={novoMinimo}
                  onChange={(e) => setNovoMinimo(Number(e.target.value))}
                  required
                  className="h-10 text-base font-bold font-mono"
                  placeholder="Ex: 15000"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Quando o saldo ficar abaixo deste limite, o status será
                  marcado como <strong>Abaixo do mínimo</strong>.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpenModalEditar(false)
                    setMaterialEditando(null)
                  }}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR ALTERAÇÃO? (MODAL DE CONFIRMAÇÃO) */}
      <AlertDialog
        open={openConfirmacaoSalvar}
        onOpenChange={(open) => {
          if (!open && !salvando) {
            setOpenConfirmacaoSalvar(false)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <AlertCircle className="w-4 h-4 text-primary" />
              Confirmar alteração?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Deseja realmente alterar o estoque mínimo de{" "}
              <strong className="text-foreground">
                {materialEditando?.nome}
              </strong>{" "}
              para{" "}
              <strong className="text-foreground">
                {novoMinimo.toLocaleString("pt-BR")} {materialEditando?.unidade}
              </strong>{" "}
              na unidade{" "}
              <strong className="text-foreground">{empresaAtiva?.nome}</strong>?
              Cancelar não grava nenhuma informação, confirmar grava diretamente
              no banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={salvando}
              className="text-xs"
              onClick={() => setOpenConfirmacaoSalvar(false)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarSalvar}
              disabled={salvando}
              className="bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 gap-1.5"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Sim, confirmar e gravar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
