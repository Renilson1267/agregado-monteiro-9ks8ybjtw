import { useState, useEffect } from "react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConcreteiraService } from "@/services/concreteira"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import type { Material, MovimentacaoEstoque } from "@/types/concreteira"
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Settings2,
  RefreshCw,
  FileSpreadsheet,
  Send,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Link } from "react-router-dom"
import { AlertaPedidoCimento } from "@/components/AlertaPedidoCimento"
import {
  LIMITE_AVISO_PEDIDO_CIMENTO_KG,
  gerarLinkWhatsAppPedidoCimento,
} from "@/lib/pedido-cimento"

export default function Estoque() {
  const { empresaAtiva } = useEmpresa()
  const { isBalanceiro } = useUsuario()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [filtroMaterial, setFiltroMaterial] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)

  // Dialog Registrar Entrada
  const [openEntrada, setOpenEntrada] = useState(false)
  const [salvandoEntrada, setSalvandoEntrada] = useState(false)
  const [materialEntradaId, setMaterialEntradaId] = useState("")
  const [quantidadeEntrada, setQuantidadeEntrada] = useState<number>(0)
  const [precoUnitarioEntrada, setPrecoUnitarioEntrada] = useState<string>("")
  const [dataEntrada, setDataEntrada] = useState(
    new Date().toISOString().split("T")[0],
  )
  const [documentoEntrada, setDocumentoEntrada] = useState("")
  const [obsEntrada, setObsEntrada] = useState("")
  const [modalConfirmarEntradaAberta, setModalConfirmarEntradaAberta] =
    useState(false)

  // Dialog Editar Mínimo
  const [openMinimo, setOpenMinimo] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(
    null,
  )
  const [novoMinimo, setNovoMinimo] = useState<number>(0)
  const [salvandoMinimo, setSalvandoMinimo] = useState(false)
  const [modalConfirmarMinimoAberta, setModalConfirmarMinimoAberta] =
    useState(false)

  const carregarDados = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [mats, movs] = await Promise.all([
        ConcreteiraService.getMateriais(empresaAtiva.id),
        ConcreteiraService.getMovimentacoes(
          filtroMaterial,
          empresaAtiva.id,
          true,
        ),
      ])
      setMateriais(mats)
      setMovimentacoes(movs)
      // Seleciona material inicial apenas dentre os controlados (cimento e aditivo)
      const matsControlados = mats.filter(
        (m) => m.codigo === "cimento" || m.codigo === "aditivo",
      )
      if (
        matsControlados.length > 0 &&
        (!materialEntradaId ||
          !matsControlados.some((m) => m.id === materialEntradaId))
      ) {
        setMaterialEntradaId(matsControlados[0].id)
      }
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Erro ao carregar estoque",
        description: e.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarDados()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroMaterial, empresaAtiva?.id])

  // Parse preco unitario numérico
  const precoUnitarioNum = Number(precoUnitarioEntrada.replace(",", ".")) || 0
  const valorTotalCalculado =
    quantidadeEntrada > 0 && precoUnitarioNum > 0
      ? Number((quantidadeEntrada * precoUnitarioNum).toFixed(2))
      : 0
  const isFormEntradaValido =
    Boolean(materialEntradaId) &&
    quantidadeEntrada > 0 &&
    precoUnitarioEntrada.trim() !== "" &&
    precoUnitarioNum > 0

  const executarSalvarEntrada = async () => {
    setSalvandoEntrada(true)
    try {
      await ConcreteiraService.registrarEntradaEstoque({
        empresa_id: empresaAtiva?.id,
        material_id: materialEntradaId,
        quantidade: quantidadeEntrada,
        preco_unitario: precoUnitarioNum,
        valor_total: valorTotalCalculado,
        data: dataEntrada,
        documento: documentoEntrada || undefined,
        observacao: obsEntrada || undefined,
      })
      toast({
        title: "Entrada registrada com sucesso!",
        description: "Estoque atualizado com a reposição.",
      })
      setModalConfirmarEntradaAberta(false)
      setOpenEntrada(false)
      setQuantidadeEntrada(0)
      setPrecoUnitarioEntrada("")
      setDocumentoEntrada("")
      setObsEntrada("")
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao registrar entrada",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoEntrada(false)
    }
  }

  const handleSalvarEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialEntradaId || quantidadeEntrada <= 0) {
      toast({
        title: "Atenção",
        description: "Informe material e quantidade positiva.",
        variant: "destructive",
      })
      return
    }

    if (!precoUnitarioEntrada.trim() || precoUnitarioNum <= 0) {
      toast({
        title: "Atenção",
        description: "Informe um preço unitário válido maior que zero.",
        variant: "destructive",
      })
      return
    }

    setModalConfirmarEntradaAberta(true)
  }

  const executarSalvarMinimo = async () => {
    if (!materialEditando) return

    setSalvandoMinimo(true)
    try {
      await ConcreteiraService.updateMaterialEstoqueMinimo(
        materialEditando.id,
        novoMinimo,
      )
      toast({
        title: "Estoque mínimo atualizado",
        description: `Margem de segurança de ${materialEditando.nome} redefinida.`,
      })
      setModalConfirmarMinimoAberta(false)
      setOpenMinimo(false)
      setMaterialEditando(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoMinimo(false)
    }
  }

  const handleSalvarMinimo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialEditando) return

    setModalConfirmarMinimoAberta(true)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="w-6 h-6 text-primary" />
            Gestão de Estoque e Almoxarifado
            {empresaAtiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe o saldo dos silos de cimento e tanques de aditivo da
            unidade {empresaAtiva?.nome || ""}. (Agregados têm controle
            exclusivo por consumo).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          {!isBalanceiro && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              title="Importar cargas e controle diário a partir de planilha CSV"
            >
              <Link to="/importar">
                <FileSpreadsheet className="w-4 h-4" />
                Importar CSV
              </Link>
            </Button>
          )}

          {/* Dialog Registrar Entrada - apenas para cimento e aditivo */}
          <Dialog open={openEntrada} onOpenChange={setOpenEntrada}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-2 bg-primary text-primary-foreground"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar Reposição / Entrada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Registrar Entrada / Reposição de Insumo Controlado
                </DialogTitle>
                <DialogDescription>
                  Gera uma movimentação de estoque para{" "}
                  {materiais.find((m) => m.codigo === "cimento")?.nome ||
                    "CP II F-40 / CP V ARI"}{" "}
                  ou Aditivo no silo ou tanque correspondente.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSalvarEntrada} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="materialEntrada">Material Controlado *</Label>
                  <Select
                    value={materialEntradaId}
                    onValueChange={setMaterialEntradaId}
                  >
                    <SelectTrigger id="materialEntrada">
                      <SelectValue placeholder="Selecione o material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materiais
                        .filter(
                          (m) =>
                            m.codigo === "cimento" || m.codigo === "aditivo",
                        )
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nome} ({m.unidade})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">
                      Quantidade (
                      {materiais.find((m) => m.id === materialEntradaId)
                        ?.unidade || "kg"}
                      ) *
                    </Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="any"
                      min="0.01"
                      value={quantidadeEntrada || ""}
                      onChange={(e) =>
                        setQuantidadeEntrada(Number(e.target.value))
                      }
                      placeholder="Ex: 30000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precoUnitario">Preço unitário (R$) *</Label>
                    <Input
                      id="precoUnitario"
                      type="text"
                      inputMode="decimal"
                      value={precoUnitarioEntrada}
                      onChange={(e) => setPrecoUnitarioEntrada(e.target.value)}
                      placeholder="Ex: 0.72 ou 18.50"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Por{" "}
                      {materiais.find((m) => m.id === materialEntradaId)
                        ?.unidade || "unidade"}{" "}
                      (varia por entrega)
                    </p>
                  </div>
                </div>

                {/* Cálculo em tempo real do Valor Total */}
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">
                      VALOR TOTAL ESTIMADO
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {quantidadeEntrada > 0
                        ? Number(quantidadeEntrada).toLocaleString("pt-BR")
                        : "0"}{" "}
                      {materiais.find((m) => m.id === materialEntradaId)
                        ?.unidade || "kg"}{" "}
                      × R${" "}
                      {precoUnitarioNum > 0
                        ? precoUnitarioNum.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })
                        : "0,00"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-primary block">
                      {valorTotalCalculado.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dataEnt">Data *</Label>
                    <Input
                      id="dataEnt"
                      type="date"
                      value={dataEntrada}
                      onChange={(e) => setDataEntrada(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc">Nº Nota Fiscal / Romaneio</Label>
                    <Input
                      id="doc"
                      placeholder="Ex: NF-e 45210"
                      value={documentoEntrada}
                      onChange={(e) => setDocumentoEntrada(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obsEnt">Observações</Label>
                  <Input
                    id="obsEnt"
                    placeholder="Ex: Carreta bitrem, fornecedor Cimento Nacional..."
                    value={obsEntrada}
                    onChange={(e) => setObsEntrada(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenEntrada(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={salvandoEntrada || !isFormEntradaValido}
                    className="bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    {salvandoEntrada ? "Salvando..." : "Salvar Entrada"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerta de Pedido Automático de Cimento (quando saldo < 20.000 kg) */}
      {(() => {
        const matCimento = materiais.find((m) => m.codigo === "cimento")
        if (!matCimento) return null
        const saldo = matCimento.saldo || 0
        // Para Monteiro e SJE: se saldo < 20.000 kg, exibe o aviso
        // Para Caicó/Patos (unidades vazias): só se tiver estoque cadastrado (> 0)
        const ehCaicoOuPatos =
          empresaAtiva?.nome?.toLowerCase().includes("caicó") ||
          empresaAtiva?.nome?.toLowerCase().includes("patos")

        if (ehCaicoOuPatos && saldo <= 0) return null

        if (saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG) {
          return (
            <AlertaPedidoCimento
              unidadeNome={empresaAtiva?.nome || "Unidade"}
              saldoAtualKg={saldo}
              estoqueMinimoKg={matCimento.estoque_minimo || 15000}
              empresa={empresaAtiva}
              variante="card"
            />
          )
        }
        return null
      })()}

      {/* Grid de Materiais Controlados (Cimento e Aditivo) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            Insumos com Controle de Estoque
            <Badge
              variant="outline"
              className="text-xs text-primary border-primary/30"
            >
              Silo & Tanque
            </Badge>
          </h2>
          <span className="text-xs text-muted-foreground">
            Baixa automática nas cargas com alerta de estoque mínimo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materiais
            .filter((m) => m.codigo === "cimento" || m.codigo === "aditivo")
            .map((mat) => {
              const saldo = mat.saldo || 0
              const critico =
                mat.estoque_minimo > 0 && saldo < mat.estoque_minimo
              const margem = saldo - mat.estoque_minimo
              // Âmbar quando próximo ao mínimo (margem positiva até 15% do mínimo)
              const atencao =
                !critico &&
                mat.estoque_minimo > 0 &&
                margem <= mat.estoque_minimo * 0.15

              return (
                <Card
                  key={mat.id}
                  className={`border-border/40 bg-card/70 relative overflow-hidden shadow-sm ${
                    critico
                      ? "border-destructive/40"
                      : atencao
                        ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
                        : ""
                  }`}
                >
                  <div
                    className={`h-1.5 w-full ${
                      critico
                        ? "bg-destructive"
                        : atencao
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {mat.nome}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider font-mono">
                          {mat.codigo === "cimento"
                            ? `Silo de ${mat.nome}`
                            : "Tanque de Aditivo Químico"}
                        </CardDescription>
                      </div>
                      {critico ? (
                        <Badge variant="destructive" className="text-xs">
                          Reposição Urgente
                        </Badge>
                      ) : atencao ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold"
                        >
                          Atenção (Âmbar)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-medium"
                        >
                          Estoque Regular (Verde)
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span
                          className={`text-3xl font-extrabold ${
                            critico
                              ? "text-destructive"
                              : atencao
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                          }`}
                        >
                          {saldo.toLocaleString("pt-BR")}
                        </span>{" "}
                        <span className="text-sm font-medium text-muted-foreground">
                          {mat.unidade}
                        </span>
                      </div>
                      {saldo >= 1000 && mat.unidade === "kg" && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {(saldo / 1000).toFixed(2)} t
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/30 text-xs space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Estoque Mínimo (Alerta):</span>
                        <span className="font-semibold text-foreground">
                          {mat.estoque_minimo.toLocaleString("pt-BR")}{" "}
                          {mat.unidade}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Margem Operacional:</span>
                        <span
                          className={
                            critico
                              ? "text-destructive font-bold"
                              : atencao
                                ? "text-amber-600 dark:text-amber-400 font-bold"
                                : "text-emerald-500 font-medium"
                          }
                        >
                          {margem > 0 ? "+" : ""}
                          {margem.toLocaleString("pt-BR")} {mat.unidade}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {!isBalanceiro ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1 px-2"
                          onClick={() => {
                            setMaterialEditando(mat)
                            setNovoMinimo(mat.estoque_minimo)
                            setOpenMinimo(true)
                          }}
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Alterar Mínimo
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Mínimo: {mat.estoque_minimo.toLocaleString("pt-BR")}{" "}
                          {mat.unidade}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {mat.codigo === "cimento" &&
                          saldo < LIMITE_AVISO_PEDIDO_CIMENTO_KG && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs h-8 gap-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={() => {
                                const link = gerarLinkWhatsAppPedidoCimento({
                                  unidadeNome: empresaAtiva?.nome || "Unidade",
                                  saldoAtualKg: saldo,
                                  estoqueMinimoKg: mat.estoque_minimo || 15000,
                                  empresa: empresaAtiva,
                                })
                                window.open(
                                  link,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }}
                            >
                              <Send className="w-3.5 h-3.5" />
                              Pedir WhatsApp
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 gap-1 px-2 text-primary hover:text-primary"
                          onClick={() => {
                            setMaterialEntradaId(mat.id)
                            setOpenEntrada(true)
                          }}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Repor Estoque
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Seção Informativa: Materiais Apenas Consumo */}
      <Card className="border-border/30 bg-muted/20">
        <CardHeader className="py-3 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-muted-foreground" />
                Agregados e Materiais em Modo Apenas Consumo
              </CardTitle>
              <CardDescription className="text-xs">
                Brita 12, Brita 19, Areia e Pó de Pedra são registrados
                diretamente no consumo das cargas (sem saldo de estoque, baixa
                ou alerta mínimo).
              </CardDescription>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {materiais
                .filter((m) => m.codigo !== "cimento" && m.codigo !== "aditivo")
                .map((m) => (
                  <Badge
                    key={m.id}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {m.nome}
                  </Badge>
                ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dialog Editar Estoque Mínimo */}
      <Dialog open={openMinimo} onOpenChange={setOpenMinimo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Margem Mínima de Segurança</DialogTitle>
            <DialogDescription>
              Defina o valor mínimo de estoque para disparo de alertas visuais
              no dashboard.
            </DialogDescription>
          </DialogHeader>
          {materialEditando && (
            <form onSubmit={handleSalvarMinimo} className="space-y-4 py-2">
              <div className="space-y-1">
                <span className="text-sm font-semibold">
                  {materialEditando.nome}
                </span>
                <p className="text-xs text-muted-foreground">
                  Unidade: {materialEditando.unidade} | Saldo Atual:{" "}
                  {materialEditando.saldo?.toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="novoMinimo">
                  Novo Estoque Mínimo ({materialEditando.unidade})
                </Label>
                <Input
                  id="novoMinimo"
                  type="number"
                  min="0"
                  step="any"
                  value={novoMinimo}
                  onChange={(e) => setNovoMinimo(Number(e.target.value))}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenMinimo(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvandoMinimo}
                  className="bg-primary text-primary-foreground"
                >
                  {salvandoMinimo ? "Salvando..." : "Salvar Alteração"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Histórico de Movimentações */}
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Histórico de Movimentações de Estoque
            </CardTitle>
            <CardDescription className="text-xs">
              Extrato completo de entradas (compras/abertura) e baixas por
              produção de concreto
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground shrink-0">
              Filtrar Material:
            </span>
            <Select value={filtroMaterial} onValueChange={setFiltroMaterial}>
              <SelectTrigger className="w-[190px] h-8 text-xs">
                <SelectValue placeholder="Materiais Controlados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Cimento e Aditivo</SelectItem>
                {materiais
                  .filter(
                    (m) => m.codigo === "cimento" || m.codigo === "aditivo",
                  )
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Quantidade</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                  <th className="py-2.5 px-3">Documento / Ref</th>
                  <th className="py-2.5 px-3">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {movimentacoes.map((mov) => {
                  const isEntrada =
                    mov.tipo === "ENTRADA" || mov.tipo === "ABERTURA"
                  const mat =
                    materiais.find((m) => m.id === mov.material_id) ||
                    mov.material

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {mov.data.split("-").reverse().join("/")}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEntrada ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1 font-semibold"
                          >
                            <TrendingUp className="w-3 h-3" />
                            {mov.tipo}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-rose-500 border-rose-500/30 bg-rose-500/10 gap-1 font-semibold"
                          >
                            <TrendingDown className="w-3 h-3" />
                            SAÍDA (CARGA)
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {mat?.nome || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={
                            isEntrada ? "text-emerald-500" : "text-rose-500"
                          }
                        >
                          {isEntrada ? "+" : "-"}{" "}
                          {Number(mov.quantidade).toLocaleString("pt-BR")}{" "}
                          {mat?.unidade || ""}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {isEntrada && mov.preco_unitario != null
                          ? Number(mov.preco_unitario).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                        {isEntrada && mov.valor_total != null
                          ? Number(mov.valor_total).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {mov.documento || "—"}
                      </td>
                      <td
                        className="py-2.5 px-3 text-muted-foreground max-w-[250px] truncate"
                        title={mov.observacao || ""}
                      >
                        {mov.observacao || "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* AlertDialog de Confirmação com Resumo Antes de Gravar Entrada */}
      <AlertDialog
        open={modalConfirmarEntradaAberta}
        onOpenChange={setModalConfirmarEntradaAberta}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <PlusCircle className="w-5 h-5 text-primary" />
              Confirmar Entrada de Insumo no Estoque
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Confira os dados da movimentação antes de confirmar a reposição.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Insumo:</span>
                <span className="font-bold text-foreground">
                  {materiais.find((m) => m.id === materialEntradaId)?.nome ||
                    "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Tipo de Movimentação:
                </span>
                <span className="font-semibold text-emerald-600">
                  ENTRADA / REPOSIÇÃO
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Quantidade:
                </span>
                <span className="font-bold text-primary">
                  {Number(quantidadeEntrada).toLocaleString("pt-BR")}{" "}
                  {materiais.find((m) => m.id === materialEntradaId)?.unidade ||
                    ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Preço Unitário:
                </span>
                <span className="font-semibold">
                  {precoUnitarioNum.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="text-muted-foreground font-sans">
                  Valor Total:
                </span>
                <span className="font-bold text-emerald-600">
                  {valorTotalCalculado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Data da Entrada:
                </span>
                <span>{dataEntrada.split("-").reverse().join("/")}</span>
              </div>
              {documentoEntrada && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">
                    Documento / NF:
                  </span>
                  <span>{documentoEntrada}</span>
                </div>
              )}
              {obsEntrada && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">
                    Observação:
                  </span>
                  <span className="text-right max-w-[200px] truncate">
                    {obsEntrada}
                  </span>
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={salvandoEntrada}>
              Voltar e Revisar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={salvandoEntrada}
              onClick={executarSalvarEntrada}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {salvandoEntrada ? "Gravando..." : "Sim, Confirmar Entrada"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de Confirmação com Resumo Antes de Gravar Novo Mínimo */}
      <AlertDialog
        open={modalConfirmarMinimoAberta}
        onOpenChange={setModalConfirmarMinimoAberta}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Settings2 className="w-5 h-5 text-primary" />
              Confirmar Alteração de Estoque Mínimo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Confira os parâmetros de alerta de estoque para o insumo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Insumo:</span>
                <span className="font-bold text-foreground">
                  {materialEditando?.nome}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Tipo:</span>
                <span className="font-semibold">AJUSTE DE PARÂMETRO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Mínimo Anterior:
                </span>
                <span>
                  {materialEditando?.estoque_minimo.toLocaleString("pt-BR")}{" "}
                  {materialEditando?.unidade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Novo Mínimo:
                </span>
                <span className="font-bold text-primary">
                  {Number(novoMinimo).toLocaleString("pt-BR")}{" "}
                  {materialEditando?.unidade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">
                  Saldo Atual:
                </span>
                <span>
                  {materialEditando?.saldo?.toLocaleString("pt-BR")}{" "}
                  {materialEditando?.unidade}
                </span>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={salvandoMinimo}>
              Voltar e Revisar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={salvandoMinimo}
              onClick={executarSalvarMinimo}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {salvandoMinimo ? "Salvando..." : "Sim, Atualizar Mínimo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
