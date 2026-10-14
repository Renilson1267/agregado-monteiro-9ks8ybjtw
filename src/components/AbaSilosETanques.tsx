import { useState, useEffect } from "react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { useToast } from "@/hooks/use-toast"
import { ConcreteiraService } from "@/services/concreteira"
import { RecipienteEstoque } from "@/types/concreteira"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  Cylinder,
  Pencil,
  ArrowDownToLine,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from "lucide-react"

export function AbaSilosETanques() {
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()
  const { toast } = useToast()

  const [recipientes, setRecipientes] = useState<RecipienteEstoque[]>([])
  const [carregando, setCarregando] = useState(false)

  // Modal de edição (saldo e mínimo)
  const [modalEdicaoAberta, setModalEdicaoAberta] = useState(false)
  const [recipienteEditando, setRecipienteEditando] =
    useState<RecipienteEstoque | null>(null)
  const [saldoEditando, setSaldoEditando] = useState<string>("")
  const [minimoEditando, setMinimoEditando] = useState<string>("")
  const [modalConfirmarEdicaoAberta, setModalConfirmarEdicaoAberta] =
    useState(false)

  // Modal de Entrada de Estoque
  const [modalEntradaAberta, setModalEntradaAberta] = useState(false)
  const [recipienteEntrada, setRecipienteEntrada] =
    useState<RecipienteEstoque | null>(null)
  const [quantidadeEntrada, setQuantidadeEntrada] = useState<string>("")
  const [dataEntrada, setDataEntrada] = useState<string>(
    new Date().toISOString().slice(0, 10),
  )
  const [documentoEntrada, setDocumentoEntrada] = useState<string>("")
  const [observacaoEntrada, setObservacaoEntrada] = useState<string>("")
  const [modalConfirmarEntradaAberta, setModalConfirmarEntradaAberta] =
    useState(false)

  const [salvando, setSalvando] = useState(false)

  const carregarRecipientes = async () => {
    if (!empresaAtiva) return
    setCarregando(true)
    try {
      const data = await ConcreteiraService.getRecipientesEstoque(
        empresaAtiva.id,
      )
      setRecipientes(data)
    } catch (err: any) {
      console.error("Erro ao buscar silos e tanques:", err)
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Falha ao carregar silos e tanques.",
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarRecipientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  // Abrir modal de edição
  const handleAbrirEdicao = (rec: RecipienteEstoque) => {
    setRecipienteEditando(rec)
    setSaldoEditando(String(rec.saldo_atual))
    setMinimoEditando(String(rec.estoque_minimo))
    setModalEdicaoAberta(true)
  }

  // Submeter formulário de edição (abre confirmação)
  const handlePreSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault()
    const saldoNum = parseFloat(saldoEditando.replace(",", ".").trim())
    const minNum = parseFloat(minimoEditando.replace(",", ".").trim())
    if (isNaN(saldoNum) || isNaN(minNum)) {
      toast({
        title: "Valores inválidos",
        description: "Informe números válidos para saldo e estoque mínimo.",
        variant: "destructive",
      })
      return
    }
    setModalConfirmarEdicaoAberta(true)
  }

  // Executar salvar edição no banco
  const handleExecutarSalvarEdicao = async () => {
    if (!recipienteEditando) return
    const saldoNum = parseFloat(saldoEditando.replace(",", ".").trim())
    const minNum = parseFloat(minimoEditando.replace(",", ".").trim())

    setSalvando(true)
    try {
      await ConcreteiraService.atualizarRecipienteEstoque(
        recipienteEditando.id,
        {
          saldo_atual: saldoNum,
          estoque_minimo: minNum,
        },
      )

      toast({
        title: "Recipiente atualizado com sucesso!",
        description: `${recipienteEditando.nome} agora possui saldo de ${saldoNum.toLocaleString("pt-BR")} ${recipienteEditando.unidade}.`,
      })

      setModalConfirmarEdicaoAberta(false)
      setModalEdicaoAberta(false)
      setRecipienteEditando(null)
      carregarRecipientes()
    } catch (err: any) {
      console.error("Erro ao salvar recipiente:", err)
      toast({
        title: "Erro ao salvar",
        description: err.message || "Falha ao atualizar recipiente.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  // Abrir modal de entrada
  const handleAbrirEntrada = (rec: RecipienteEstoque) => {
    setRecipienteEntrada(rec)
    setQuantidadeEntrada("")
    setDataEntrada(new Date().toISOString().slice(0, 10))
    setDocumentoEntrada(
      `NF-REC-${new Date().toISOString().slice(5, 10).replace("-", "")}`,
    )
    setObservacaoEntrada(`Recebimento ${rec.nome}`)
    setModalEntradaAberta(true)
  }

  // Submeter entrada (abre confirmação)
  const handlePreSalvarEntrada = (e: React.FormEvent) => {
    e.preventDefault()
    const qtdNum = parseFloat(quantidadeEntrada.replace(",", ".").trim())
    if (isNaN(qtdNum) || qtdNum <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Informe uma quantidade maior que zero para entrada.",
        variant: "destructive",
      })
      return
    }
    if (!dataEntrada) {
      toast({
        title: "Data obrigatória",
        description: "Informe a data da entrada.",
        variant: "destructive",
      })
      return
    }
    setModalConfirmarEntradaAberta(true)
  }

  // Executar registro de entrada
  const handleExecutarSalvarEntrada = async () => {
    if (!recipienteEntrada || !empresaAtiva) return
    const qtdNum = parseFloat(quantidadeEntrada.replace(",", ".").trim())

    setSalvando(true)
    try {
      await ConcreteiraService.registrarEntradaRecipiente({
        empresa_id: empresaAtiva.id,
        recipiente_id: recipienteEntrada.id,
        quantidade: qtdNum,
        data: dataEntrada,
        documento: documentoEntrada || undefined,
        observacao: observacaoEntrada || undefined,
      })

      toast({
        title: "Entrada registrada com sucesso!",
        description: `Creditado ${qtdNum.toLocaleString("pt-BR")} ${recipienteEntrada.unidade} no ${recipienteEntrada.nome}.`,
      })

      setModalConfirmarEntradaAberta(false)
      setModalEntradaAberta(false)
      setRecipienteEntrada(null)
      carregarRecipientes()
    } catch (err: any) {
      console.error("Erro ao registrar entrada:", err)
      toast({
        title: "Erro ao registrar entrada",
        description: err.message || "Falha ao registrar entrada.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  // Status visual do recipiente
  const getStatus = (saldo: number, minimo: number) => {
    if (saldo < minimo) {
      return {
        label: "Abaixo",
        variant: "destructive" as const,
        className: "bg-red-500/10 text-red-600 border-red-500/30 font-bold",
        icon: AlertTriangle,
      }
    }
    if (saldo === minimo) {
      return {
        label: "No mínimo",
        variant: "outline" as const,
        className:
          "bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold",
        icon: AlertTriangle,
      }
    }
    return {
      label: "OK",
      variant: "outline" as const,
      className:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold",
      icon: CheckCircle2,
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/70">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Cylinder className="w-4 h-4 text-primary" />
              Controle de Silos e Tanques (Unidade Patos)
            </CardTitle>
            <CardDescription className="text-xs">
              Gerencie individualmente o saldo e estoque mínimo dos 2 Silos de
              Cimento e 2 Tanques de Aditivo da unidade Patos. O saldo total de
              cimento e aditivo permanece consolidado no Painel e nos
              relatórios.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarRecipientes}
            disabled={carregando}
            className="h-8 gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                <tr>
                  <th className="py-2.5 px-3">Recipiente</th>
                  <th className="py-2.5 px-3">Material Vinculado</th>
                  <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                  <th className="py-2.5 px-3 text-right">Estoque Mínimo</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {carregando ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
                      Carregando recipientes...
                    </td>
                  </tr>
                ) : recipientes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground italic"
                    >
                      Nenhum silo ou tanque cadastrado para a unidade Patos.
                    </td>
                  </tr>
                ) : (
                  recipientes.map((rec) => {
                    const status = getStatus(
                      rec.saldo_atual,
                      rec.estoque_minimo,
                    )
                    const StatusIcon = status.icon

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-foreground flex items-center gap-2">
                          <Cylinder className="w-4 h-4 text-primary shrink-0" />
                          <span>{rec.nome}</span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {rec.material_nome}
                          </span>
                          <span className="text-[10px] block font-mono uppercase text-muted-foreground">
                            {rec.material_codigo} ({rec.unidade})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm font-bold">
                          <span
                            className={
                              rec.saldo_atual < rec.estoque_minimo
                                ? "text-red-600 dark:text-red-400"
                                : "text-foreground"
                            }
                          >
                            {rec.saldo_atual.toLocaleString("pt-BR")}
                          </span>{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {rec.unidade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-muted-foreground">
                          {rec.estoque_minimo.toLocaleString("pt-BR")}{" "}
                          <span className="text-[10px] font-normal">
                            {rec.unidade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={status.variant}
                            className={`text-[10px] gap-1 ${status.className}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirEntrada(rec)}
                              className="h-8 gap-1 text-xs border-primary/40 hover:bg-primary/10 text-primary font-semibold"
                              title="Registrar recebimento de material para este recipiente"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                Entrada de estoque
                              </span>
                              <span className="sm:hidden">Entrada</span>
                            </Button>
                            {isAdministrador && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAbrirEdicao(rec)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Editar saldo atual e estoque mínimo"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE EDIÇÃO DE SALDO E MÍNIMO */}
      <Dialog open={modalEdicaoAberta} onOpenChange={setModalEdicaoAberta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Pencil className="w-4 h-4 text-primary" />
              Editar {recipienteEditando?.nome}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste manual do saldo atual e do estoque mínimo deste recipiente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePreSalvarEdicao} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Saldo Atual ({recipienteEditando?.unidade}) *
              </Label>
              <Input
                type="text"
                value={saldoEditando}
                onChange={(e) => setSaldoEditando(e.target.value)}
                required
                className="h-10 text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Estoque Mínimo ({recipienteEditando?.unidade}) *
              </Label>
              <Input
                type="text"
                value={minimoEditando}
                onChange={(e) => setMinimoEditando(e.target.value)}
                required
                className="h-10 text-sm font-mono font-bold"
              />
              <p className="text-[11px] text-muted-foreground">
                Gera alerta quando o saldo deste recipiente ficar abaixo deste
                valor.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalEdicaoAberta(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground text-xs font-bold"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE EDIÇÃO (Confirmar alteração?) */}
      <AlertDialog
        open={modalConfirmarEdicaoAberta}
        onOpenChange={setModalConfirmarEdicaoAberta}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              Confirmar alteração?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Deseja realmente atualizar os parâmetros do{" "}
                <strong className="text-foreground">
                  {recipienteEditando?.nome}
                </strong>
                ?
              </p>
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40 text-foreground font-mono text-[11px] space-y-1">
                <div>
                  <strong>Novo Saldo:</strong> {saldoEditando}{" "}
                  {recipienteEditando?.unidade}
                </div>
                <div>
                  <strong>Novo Mínimo:</strong> {minimoEditando}{" "}
                  {recipienteEditando?.unidade}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando} className="text-xs">
              Voltar e Revisar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
              onClick={handleExecutarSalvarEdicao}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              {salvando ? "Salvando..." : "Sim, Confirmar Alteração"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE ENTRADA DE ESTOQUE */}
      <Dialog open={modalEntradaAberta} onOpenChange={setModalEntradaAberta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowDownToLine className="w-4 h-4 text-primary" />
              Entrada de Estoque - {recipienteEntrada?.nome}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre a chegada de carregamento ou reposição para creditar
              diretamente este recipiente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePreSalvarEntrada} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Quantidade Recebida ({recipienteEntrada?.unidade}) *
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={quantidadeEntrada}
                onChange={(e) => setQuantidadeEntrada(e.target.value)}
                placeholder="Ex.: 35000"
                required
                className="h-10 text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Data do Recebimento *
              </Label>
              <Input
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Documento / Nota Fiscal
              </Label>
              <Input
                type="text"
                value={documentoEntrada}
                onChange={(e) => setDocumentoEntrada(e.target.value)}
                placeholder="Ex: NF 123456"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Observações (opcional)
              </Label>
              <Input
                type="text"
                value={observacaoEntrada}
                onChange={(e) => setObservacaoEntrada(e.target.value)}
                placeholder="Ex: Carreta de cimento Raquel CP V ARI"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalEntradaAberta(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground text-xs font-bold"
              >
                Registrar Entrada
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE ENTRADA (Confirmar entrada?) */}
      <AlertDialog
        open={modalConfirmarEntradaAberta}
        onOpenChange={setModalConfirmarEntradaAberta}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <ArrowDownToLine className="w-5 h-5 text-primary shrink-0" />
              Confirmar Entrada de Estoque?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Deseja confirmar o crédito de estoque no{" "}
                <strong className="text-foreground">
                  {recipienteEntrada?.nome}
                </strong>
                ?
              </p>
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40 text-foreground font-mono text-[11px] space-y-1">
                <div>
                  <strong>Quantidade:</strong> +{quantidadeEntrada}{" "}
                  {recipienteEntrada?.unidade}
                </div>
                <div>
                  <strong>Data:</strong>{" "}
                  {dataEntrada.split("-").reverse().join("/")}
                </div>
                <div>
                  <strong>Documento:</strong> {documentoEntrada || "—"}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando} className="text-xs">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
              onClick={handleExecutarSalvarEntrada}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
            >
              {salvando ? "Creditando..." : "Sim, Confirmar e Creditar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
