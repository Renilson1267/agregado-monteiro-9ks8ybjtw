import { useState, useEffect, useMemo } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
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
  Ban,
  Search,
  Calendar,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertCircle,
  Truck,
  Layers,
} from "lucide-react"
import { ConcreteiraService } from "@/services/concreteira"
import type { Carga, Traco } from "@/types/concreteira"
import { toast } from "@/hooks/use-toast"
import {
  formatarDescricaoCompletaTraco,
  resolverTracoReferenciaCarga,
} from "@/pages/LancamentoCargas"

interface AbaCancelamentoCargasProps {
  empresaId?: string
  empresaNome?: string
  isPatos: boolean
  tracosCatalogo: Traco[]
  onCancelamentoConcluido?: () => void
}

export function AbaCancelamentoCargas({
  empresaId,
  empresaNome,
  isPatos,
  tracosCatalogo,
  onCancelamentoConcluido,
}: AbaCancelamentoCargasProps) {
  const [cargas, setCargas] = useState<Carga[]>([])
  const [carregando, setCarregando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  // Filtros
  const [busca, setBusca] = useState("")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

  // Seleção múltipla
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())

  // Configuração do cancelamento
  const [retornarEstoque, setRetornarEstoque] = useState(true)
  const [motivo, setMotivo] = useState("")
  const [modalConfirmacaoAberta, setModalConfirmacaoAberta] = useState(false)

  const carregarCargas = async () => {
    if (!empresaId) return
    setCarregando(true)
    try {
      // Buscar apenas cargas ATIVAS (não canceladas) da empresa
      const lista = await ConcreteiraService.getCargas({
        empresaId,
        incluirCanceladas: false,
      })
      setCargas(lista)
      setSelecionadas(new Set())
    } catch (err: any) {
      console.error("Erro ao carregar cargas para cancelamento:", err)
      toast({
        title: "Erro ao carregar cargas",
        description: err.message || "Falha ao buscar lançamentos da unidade.",
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarCargas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  // Filtragem
  const cargasFiltradas = useMemo(() => {
    return cargas.filter((c) => {
      if (filtroDataInicio && c.data < filtroDataInicio) return false
      if (filtroDataFim && c.data > filtroDataFim) return false
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim()
        const num = String(c.numero_carga).toLowerCase()
        const cli = (c.cliente_nome || "").toLowerCase()
        const mot = (c.motorista_nome || "").toLowerCase()
        const plc = (c.veiculo_placa || "").toLowerCase()
        const cid = (c.cidade_nome || "").toLowerCase()
        const trc = (c.traco_nome || "").toLowerCase()
        const bate =
          num.includes(termo) ||
          cli.includes(termo) ||
          mot.includes(termo) ||
          plc.includes(termo) ||
          cid.includes(termo) ||
          trc.includes(termo)
        if (!bate) return false
      }
      return true
    })
  }, [cargas, filtroDataInicio, filtroDataFim, busca])

  // Cargas efetivamente selecionadas
  const cargasSelecionadasObjetos = useMemo(() => {
    return cargas.filter((c) => selecionadas.has(c.id))
  }, [cargas, selecionadas])

  // Verificar se alguma possui recibo/OS vinculado
  const cargasComOS = useMemo(() => {
    return cargasSelecionadasObjetos.filter((c) => !!c.ordem_servico_id)
  }, [cargasSelecionadasObjetos])

  // Totais das selecionadas
  const resumoTotais = useMemo(() => {
    let vol = 0
    let cimento = 0
    let aditivo = 0
    let areia = 0
    let brita12 = 0
    let brita19 = 0
    let poPedra = 0
    let agua = 0

    for (const c of cargasSelecionadasObjetos) {
      vol += Number(c.volume_m3) || 0
      cimento += Number(c.consumo_cimento) || 0
      aditivo += Number(c.consumo_aditivo) || 0
      areia += Number(c.consumo_areia) || 0
      brita12 += Number(c.consumo_brita12) || 0
      brita19 += Number(c.consumo_brita19) || 0
      poPedra += Number(c.consumo_po_pedra) || 0
      agua += Number(c.consumo_agua) || 0
    }

    return {
      quantidade: cargasSelecionadasObjetos.length,
      volume: vol,
      cimento,
      aditivo,
      areia,
      brita12,
      brita19,
      poPedra,
      agua,
    }
  }, [cargasSelecionadasObjetos])

  const toggleSelecionarTodas = () => {
    if (
      selecionadas.size === cargasFiltradas.length &&
      cargasFiltradas.length > 0
    ) {
      setSelecionadas(new Set())
    } else {
      setSelecionadas(new Set(cargasFiltradas.map((c) => c.id)))
    }
  }

  const toggleSelecionarUma = (id: string) => {
    const novo = new Set(selecionadas)
    if (novo.has(id)) {
      novo.delete(id)
    } else {
      novo.add(id)
    }
    setSelecionadas(novo)
  }

  const abrirConfirmacao = () => {
    if (selecionadas.size === 0) {
      toast({
        title: "Nenhuma carga selecionada",
        description: "Selecione ao menos uma carga para cancelar.",
        variant: "destructive",
      })
      return
    }

    if (cargasComOS.length > 0) {
      const nums = cargasComOS.map((c) => `#${c.numero_carga}`).join(", ")
      toast({
        title: "Cancelamento bloqueado por Recibo/OS",
        description: `As seguintes cargas possuem Recibo/OS vinculado: ${nums}. Para garantir a integridade sequencial e fiscal, desvincule o recibo antes.`,
        variant: "destructive",
      })
      return
    }

    setModalConfirmacaoAberta(true)
  }

  const executarCancelamento = async () => {
    const ids = Array.from(selecionadas)
    if (ids.length === 0) return

    setCancelando(true)
    try {
      const res = await ConcreteiraService.cancelarCargas({
        cargasIds: ids,
        retornarEstoque,
        motivo: motivo.trim() || undefined,
      })

      toast({
        title: "Cargas canceladas com sucesso!",
        description: `${res.canceladas} carga(s) cancelada(s). ${
          retornarEstoque
            ? `${res.estornadas} movimentação(ões) de entrada gerada(s) para estorno no estoque.`
            : "Insumos NÃO foram retornados ao estoque conforme sua escolha."
        }`,
      })

      setModalConfirmacaoAberta(false)
      setSelecionadas(new Set())
      setMotivo("")
      await carregarCargas()
      if (onCancelamentoConcluido) {
        onCancelamentoConcluido()
      }
    } catch (err: any) {
      console.error("Erro ao cancelar cargas:", err)
      toast({
        title: "Erro no cancelamento",
        description: err.message || "Falha ao processar cancelamento.",
        variant: "destructive",
      })
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Aba */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <Ban className="w-5 h-5 text-destructive" />
                Cancelamento de Cargas — {empresaNome || "Unidade Ativa"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Cancele cargas operacionais com ou sem retorno dos insumos ao
                estoque. A carga é removida da listagem ativa mantendo a
                integridade do sequencial.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={carregarCargas}
                disabled={carregando}
                className="h-8 gap-1.5 text-xs rounded-lg"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Barra de Filtros e Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por #, cliente, placa, motorista, traço..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg bg-background"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                placeholder="Data inicial"
                className="h-9 text-xs rounded-lg font-mono bg-background"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                placeholder="Data final"
                className="h-9 text-xs rounded-lg font-mono bg-background"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(busca || filtroDataInicio || filtroDataFim) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusca("")
                    setFiltroDataInicio("")
                    setFiltroDataFim("")
                  }}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>

          {/* Barra de Ações de Seleção */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sel-todas"
                  checked={
                    cargasFiltradas.length > 0 &&
                    selecionadas.size === cargasFiltradas.length
                  }
                  onCheckedChange={toggleSelecionarTodas}
                />
                <Label
                  htmlFor="sel-todas"
                  className="text-xs font-semibold cursor-pointer"
                >
                  Selecionar todas ({cargasFiltradas.length})
                </Label>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {selecionadas.size} selecionada(s)
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Checkbox Retornar ao Estoque */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border/60">
                <Checkbox
                  id="chk-retornar-estoque"
                  checked={retornarEstoque}
                  onCheckedChange={(ch) => setRetornarEstoque(!!ch)}
                />
                <Label
                  htmlFor="chk-retornar-estoque"
                  className="text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-primary" />
                  Retornar insumos ao estoque?
                </Label>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={selecionadas.size === 0 || cancelando}
                onClick={abrirConfirmacao}
                className="gap-1.5 font-bold text-xs h-9"
              >
                <Ban className="w-4 h-4" />
                Cancelar Selecionada(s) ({selecionadas.size})
              </Button>
            </div>
          </div>

          {/* Tabela de Cargas para Cancelamento */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/60 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                    <th className="py-2.5 px-3 w-20"># Carga</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3">Traço</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Motorista</th>
                    <th className="py-2.5 px-3">Placa</th>
                    <th className="py-2.5 px-3">Cidade</th>
                    <th className="py-2.5 px-3">Recibo/OS</th>
                    <th className="py-2.5 px-3 text-right">Insumos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {carregando ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                          <span>Carregando cargas da unidade...</span>
                        </div>
                      </td>
                    </tr>
                  ) : cargasFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Truck className="w-6 h-6 text-muted-foreground/40" />
                          <span className="font-medium text-foreground">
                            Nenhuma carga ativa encontrada para os filtros.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cargasFiltradas.map((c) => {
                      const sel = selecionadas.has(c.id)
                      const tracoRef = resolverTracoReferenciaCarga(
                        c,
                        tracosCatalogo,
                      )
                      const descTraco = tracoRef
                        ? formatarDescricaoCompletaTraco(tracoRef)
                        : c.traco_nome || "—"
                      const temOS = !!c.ordem_servico_id

                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            sel ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <Checkbox
                              checked={sel}
                              onCheckedChange={() => toggleSelecionarUma(c.id)}
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            #{String(c.numero_carga).padStart(4, "0")}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                            {c.data.split("-").reverse().join("/")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                            {(Number(c.volume_m3) || 0).toFixed(1)} m³
                          </td>
                          <td
                            className="py-2.5 px-3 max-w-[200px] truncate"
                            title={descTraco}
                          >
                            {descTraco}
                          </td>
                          <td
                            className="py-2.5 px-3 max-w-[150px] truncate"
                            title={c.cliente_nome || ""}
                          >
                            {c.cliente_nome || "—"}
                          </td>
                          <td
                            className="py-2.5 px-3 max-w-[130px] truncate"
                            title={c.motorista_nome || ""}
                          >
                            {c.motorista_nome || "—"}
                          </td>
                          <td className="py-2.5 px-3 font-mono uppercase">
                            {c.veiculo_placa || "—"}
                          </td>
                          <td
                            className="py-2.5 px-3 max-w-[120px] truncate"
                            title={c.cidade_nome || ""}
                          >
                            {c.cidade_nome || "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            {temOS ? (
                              <Badge
                                variant="destructive"
                                className="text-[10px] gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Vinculada
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                Sem OS
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                            <span className="text-primary font-bold">
                              {Number(c.consumo_cimento || 0).toLocaleString(
                                "pt-BR",
                              )}
                              kg cim
                            </span>
                            {" • "}
                            <span>
                              {Number(c.consumo_aditivo || 0).toLocaleString(
                                "pt-BR",
                              )}
                              L adt
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação com Resumo dos Insumos e Cargas */}
      <Dialog
        open={modalConfirmacaoAberta}
        onOpenChange={setModalConfirmacaoAberta}
      >
        <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-destructive">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <span>
                Confirmar Cancelamento de {resumoTotais.quantidade} Carga(s)?
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Revise com atenção as cargas selecionadas e o impacto no estoque
              antes de prosseguir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Cargas Selecionadas */}
            <div className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Cargas Selecionadas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cargasSelecionadasObjetos.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    #{c.numero_carga} ({Number(c.volume_m3).toFixed(1)}m³ -{" "}
                    {c.cliente_nome || "Sem cli"})
                  </Badge>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                <span>Total de Volume:</span>
                <strong className="text-foreground font-mono">
                  {resumoTotais.volume.toFixed(1)} m³
                </strong>
              </div>
            </div>

            {/* Opção de Retorno de Insumos */}
            <div
              className={`p-3.5 rounded-xl border ${
                retornarEstoque
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <RotateCcw className="w-4 h-4" />
                  {retornarEstoque
                    ? "Retornar insumos ao estoque: SIM"
                    : "Retornar insumos ao estoque: NÃO"}
                </span>
                <Badge
                  variant={retornarEstoque ? "default" : "outline"}
                  className="text-[10px] uppercase font-bold"
                >
                  {retornarEstoque ? "Gera Entrada" : "Sem Estoque"}
                </Badge>
              </div>

              {retornarEstoque ? (
                <div className="space-y-2 text-xs">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Serão registradas movimentações de{" "}
                    <strong>ENTRADA (Ajuste)</strong> estornando o consumo das
                    cargas e creditando silos/tanques associados.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-background/80 p-2.5 rounded-lg border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Cimento:
                      </span>
                      <strong className="text-foreground">
                        {resumoTotais.cimento.toLocaleString("pt-BR")} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Aditivo:
                      </span>
                      <strong className="text-foreground">
                        {resumoTotais.aditivo.toLocaleString("pt-BR")} L
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Areia:
                      </span>
                      <strong className="text-foreground">
                        {resumoTotais.areia.toLocaleString("pt-BR")} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Brita 12:
                      </span>
                      <strong className="text-foreground">
                        {resumoTotais.brita12.toLocaleString("pt-BR")} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Brita 19:
                      </span>
                      <strong className="text-foreground">
                        {resumoTotais.brita19.toLocaleString("pt-BR")} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Pó de Pedra:
                      </span>
                      <strong className="text-foreground">
                        {resumoTotais.poPedra.toLocaleString("pt-BR")} kg
                      </strong>
                    </div>
                  </div>
                  {isPatos && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Layers className="w-3 h-3 text-primary" />
                      Unidade Patos: os saldos dos silos e tanques
                      correspondentes serão creditados automaticamente.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed">
                  As cargas serão marcadas como canceladas, mas{" "}
                  <strong>
                    nenhum saldo de insumo será retornado ou creditado
                  </strong>{" "}
                  no estoque.
                </p>
              )}
            </div>

            {/* Motivo do Cancelamento */}
            <div className="space-y-1.5">
              <Label
                htmlFor="motivo-cancelamento"
                className="text-xs font-semibold text-foreground"
              >
                Motivo do cancelamento (opcional):
              </Label>
              <Input
                id="motivo-cancelamento"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Cargas canceladas a pedido do cliente / duplicadas"
                className="h-9 text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cancelando}
              onClick={() => setModalConfirmacaoAberta(false)}
              className="w-full sm:w-auto text-xs rounded-xl"
            >
              Voltar e Revisar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={cancelando}
              onClick={executarCancelamento}
              className="w-full sm:w-auto font-bold text-xs rounded-xl"
            >
              {cancelando ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
