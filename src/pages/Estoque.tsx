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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ConcreteiraService } from "@/services/concreteira"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import type {
  Material,
  MovimentacaoEstoque,
  RecipienteEstoque,
} from "@/types/concreteira"
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Cylinder,
  History,
  TrendingDown,
  TrendingUp,
  Settings2,
  RefreshCw,
  FileSpreadsheet,
  Send,
  Wrench,
  CalendarDays,
  FilterX,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { AlertaPedidoCimento } from "@/components/AlertaPedidoCimento"
import { AbaAcoesEstoque } from "@/components/AbaAcoesEstoque"
import { AbaControleBritas } from "@/components/AbaControleBritas"
import {
  LIMITE_AVISO_PEDIDO_CIMENTO_KG,
  gerarLinkWhatsAppPedidoCimento,
} from "@/lib/pedido-cimento"
import { Layers, FlaskConical, Package } from "lucide-react"

// Cada insumo tem rota própria. A tela lê AS MESMAS tabelas — só o recorte
// muda. Nada é migrado, copiado ou apagado.
type InsumoRota = "cimento" | "aditivo" | "britas" | "acoes"

function insumoDaRota(pathname: string): InsumoRota {
  const p = pathname.replace(/\/+$/, "")
  if (p.endsWith("/estoque/aditivo")) return "aditivo"
  if (p.endsWith("/estoque/britas")) return "britas"
  if (p.endsWith("/estoque/acoes")) return "acoes"
  return "cimento"
}

const ROTA_DO_INSUMO: Record<string, string> = {
  cimento: "/estoque/cimento",
  aditivo: "/estoque/aditivo",
  britas: "/estoque/britas",
  acoes: "/estoque/acoes",
}

export default function Estoque() {
  const { empresaAtiva } = useEmpresa()
  const { isBalanceiro, isAdministrador, isGestor } = useUsuario()
  const podeAcessarAcoes = isAdministrador || isGestor
  const location = useLocation()
  const navigate = useNavigate()
  const insumoRota = insumoDaRota(location.pathname)
  // Na rota de insumo o recorte é FIXO (cimento ou aditivo). Britas e ações
  // usam a própria aba.
  const codigoFixo: "cimento" | "aditivo" | null =
    insumoRota === "britas" || insumoRota === "acoes" ? null : insumoRota
  const valorTab =
    insumoRota === "britas"
      ? "britas"
      : insumoRota === "acoes"
        ? "acoes"
        : "insumos"
  const [materiais, setMateriais] = useState<Material[]>([])
  const [recipientes, setRecipientes] = useState<RecipienteEstoque[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [filtroMaterial, setFiltroMaterial] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)
  // Histórico COMPLETO do material (sem recorte de período) — serve para
  // calcular o saldo de abertura de cada mês exibido no extrato.
  const [movimentacoesTodas, setMovimentacoesTodas] =
    useState<MovimentacaoEstoque[]>([])

  // ===== FILTRO DE PERÍODO DO HISTÓRICO =====
  // dia | mes_atual | mes_anterior | mes_retrasado | personalizado
  const hojeISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }
  const [periodoHist, setPeriodoHist] =
    useState<"dia" | "mes_atual" | "mes_anterior" | "personalizado">(
      "mes_atual",
    )
  const [dataInicioHist, setDataInicioHist] = useState<string>("")
  const [dataFimHist, setDataFimHist] = useState<string>("")

  // Limites de cada atalho, calculados a partir de hoje
  const limitesPeriodo = (p: typeof periodoHist) => {
    const d = new Date()
    const y = d.getFullYear()
    const m = d.getMonth() // 0-11
    const iso = (ano: number, mes0: number, dia: number) =>
      `${ano}-${String(mes0 + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    const ultimoDia = (ano: number, mes0: number) =>
      new Date(ano, mes0 + 1, 0).getDate()

    if (p === "dia") {
      const hj = hojeISO()
      return { inicio: hj, fim: hj }
    }
    if (p === "mes_atual") {
      return { inicio: iso(y, m, 1), fim: iso(y, m, ultimoDia(y, m)) }
    }
    if (p === "mes_anterior") {
      const anoAnt = m === 0 ? y - 1 : y
      const mesAnt = m === 0 ? 11 : m - 1
      return {
        inicio: iso(anoAnt, mesAnt, 1),
        fim: iso(anoAnt, mesAnt, ultimoDia(anoAnt, mesAnt)),
      }
    }
    return { inicio: dataInicioHist, fim: dataFimHist }
  }

  // Dialog Registrar Entrada
  const [openEntrada, setOpenEntrada] = useState(false)
  const [salvandoEntrada, setSalvandoEntrada] = useState(false)
  const [materialEntradaId, setMaterialEntradaId] = useState("")
  const [recipienteDestinoId, setRecipienteDestinoId] = useState("")
  const [quantidadeEntrada, setQuantidadeEntrada] = useState<number>(0)
  const [valorNotaEntrada, setValorNotaEntrada] = useState<string>("")
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

  // ===== SALDO DE ABERTURA POR MÊS =====
  // Para cada mês presente no extrato, calcula quanto havia no início do mês,
  // separado por recipiente (silo/tanque) quando a informação existe.
  const aberturasPorMes = useMemo(() => {
    if (movimentacoesTodas.length === 0) return new Map<string, any[]>()

    // Ordena cronologicamente (data do movimento, depois criação)
    const ordenadas = [...movimentacoesTodas].sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? -1 : 1
      return (a.created_at || "") < (b.created_at || "") ? -1 : 1
    })

    // Acumula saldo por recipiente
    const saldoRec = new Map<string, number>()
    const porMes = new Map<string, any[]>()
    let mesCorrente = ""

    const registraAbertura = (mes: string) => {
      if (porMes.has(mes)) return
      const linhas = Array.from(saldoRec.entries())
        .filter(([, v]) => Math.abs(v) > 0.001)
        .map(([nome, saldo]) => ({ recipiente: nome, saldo }))

      // REGRA: zera SOMENTE o "Silo de Cimento Novo" na exibição.
      // Ele recebeu baixas antes das entradas, então acumula saldo negativo.
      // O déficit sai da linha do silo (fica em 0) e vai para "Não atribuído
      // ao silo", então o total do mês continua igual ao saldo real do
      // cimento. Nenhum outro silo/tanque é afetado.
      const idxSiloNovo = linhas.findIndex((l) =>
        (l.recipiente || "").toLowerCase().includes("cimento novo"),
      )
      if (idxSiloNovo >= 0 && linhas[idxSiloNovo].saldo < 0) {
        const deficit = linhas[idxSiloNovo].saldo
        linhas[idxSiloNovo].saldo = 0
        const idxNaoAtribuido = linhas.findIndex(
          (l) => l.recipiente === "Não atribuído ao silo",
        )
        if (idxNaoAtribuido >= 0) {
          linhas[idxNaoAtribuido].saldo += deficit
        } else {
          linhas.push({
            recipiente: "Não atribuído ao silo",
            saldo: deficit,
          })
        }
      }

      porMes.set(mes, linhas)
    }

    for (const mov of ordenadas) {
      const mes = (mov.data || "").substring(0, 7) // YYYY-MM
      if (mes && mes !== mesCorrente) {
        // Fecha todos os meses intermediários e registra a abertura do novo
        mesCorrente = mes
        registraAbertura(mes)
      }
      const q = Number(mov.quantidade) || 0
      const sinal =
        mov.tipo === "ENTRADA" ||
        mov.tipo === "ABERTURA" ||
        mov.tipo === "AJUSTE"
          ? 1
          : -1
      // Movimentos antigos (antes da separação por silo) entram como
      // "Não atribuído" para que o total feche com o saldo real do insumo.
      const rec = (mov as any).recipiente_nome || "Não atribuído ao silo"
      saldoRec.set(rec, (saldoRec.get(rec) || 0) + sinal * q)
    }
    return porMes
  }, [movimentacoesTodas])

  const carregarDados = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const lim = limitesPeriodo(periodoHist)
      const [mats, movs, recs] = await Promise.all([
        ConcreteiraService.getMateriais(empresaAtiva.id),
        ConcreteiraService.getMovimentacoes(
          filtroMaterial,
          empresaAtiva.id,
          true,
          lim.inicio || undefined,
          lim.fim || undefined,
        ),
        ConcreteiraService.getRecipientesEstoque(empresaAtiva.id),
      ])
      setMateriais(mats)
      setMovimentacoes(movs)
      setRecipientes(recs || [])

      // Busca o histórico COMPLETO do insumo (sem recorte) para os saldos de
      // abertura dos meses. Uma única consulta por material selecionado.
      const matSel =
        filtroMaterial && filtroMaterial !== "ALL"
          ? filtroMaterial
          : mats.find((m) => m.codigo === codigoFixo)?.id
      if (matSel) {
        const todas = await ConcreteiraService.getMovimentacoes(
          matSel,
          empresaAtiva.id,
          false,
        )
        setMovimentacoesTodas(todas)
      }

      // Seleciona material inicial apenas dentre os controlados (cimento e aditivo)
      const matsControlados = mats.filter((m) =>
        codigoFixo ? m.codigo === codigoFixo : m.codigo === "cimento",
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
  }, [
    filtroMaterial,
    empresaAtiva?.id,
    periodoHist,
    dataInicioHist,
    dataFimHist,
  ])

  // ===== TRAVA DO MATERIAL =====
  // O formulário de entrada SEMPRE grava no material da rota. Sem isto o
  // seletor caía no primeiro controlado (cimento) e uma entrada de aditivo
  // era salva como cimento — foi o bug que trocou os lançamentos em 06/11.
  const materiaisDaRota = materiais.filter((m) => m.codigo === codigoFixo)
  const materialDaRota = materiaisDaRota[0] || null

  useEffect(() => {
    if (!materialDaRota) return
    if (materialEntradaId !== materialDaRota.id) {
      setMaterialEntradaId(materialDaRota.id)
    }
    if (filtroMaterial !== materialDaRota.id) {
      setFiltroMaterial(materialDaRota.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoFixo, materialDaRota?.id])

  // Recipientes filtrados para o material selecionado na entrada
  const materialSelecionadoEntrada = materiais.find(
    (m) => m.id === materialEntradaId,
  )
  const recipientesFiltradosEntrada = recipientes.filter((r) => {
    if (!materialSelecionadoEntrada) return false
    if (r.material_id && r.material_id === materialSelecionadoEntrada.id)
      return true
    if (materialSelecionadoEntrada.codigo === "cimento") {
      return r.tipo === "silo" || r.material_codigo === "cimento"
    }
    if (materialSelecionadoEntrada.codigo === "aditivo") {
      return r.tipo === "tanque" || r.material_codigo === "aditivo"
    }
    return false
  })

  // Efeito para ajustar automaticamente o recipiente de destino quando muda o material
  useEffect(() => {
    if (recipientesFiltradosEntrada.length > 0) {
      if (
        !recipienteDestinoId ||
        !recipientesFiltradosEntrada.some((r) => r.id === recipienteDestinoId)
      ) {
        setRecipienteDestinoId(recipientesFiltradosEntrada[0].id)
      }
    } else {
      setRecipienteDestinoId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialEntradaId, recipientes])

  const precisaRecipienteDestino = recipientesFiltradosEntrada.length > 0

  // Parse valor total da nota numérico e cálculo do preço unitário (nota ÷ quantidade)
  const valorNotaNum =
    Number(valorNotaEntrada.replace(/\./g, "").replace(",", ".")) || 0
  const precoUnitarioCalculado =
    quantidadeEntrada > 0 && valorNotaNum > 0
      ? Number((valorNotaNum / quantidadeEntrada).toFixed(4))
      : 0
  const valorTotalCalculado = valorNotaNum > 0 ? valorNotaNum : 0
  const isFormEntradaValido =
    Boolean(materialEntradaId) &&
    quantidadeEntrada > 0 &&
    valorNotaEntrada.trim() !== "" &&
    valorNotaNum > 0 &&
    (!precisaRecipienteDestino || Boolean(recipienteDestinoId))

  const executarSalvarEntrada = async () => {
    setSalvandoEntrada(true)
    try {
      const recEscolhido = recipientes.find((r) => r.id === recipienteDestinoId)

      await ConcreteiraService.registrarEntradaEstoque({
        empresa_id: empresaAtiva?.id,
        material_id: materialEntradaId,
        quantidade: quantidadeEntrada,
        preco_unitario: precoUnitarioCalculado,
        valor_total: valorTotalCalculado,
        data: dataEntrada,
        documento: documentoEntrada || undefined,
        observacao:
          obsEntrada ||
          (recEscolhido ? `Entrada no ${recEscolhido.nome}` : undefined),
        recipiente_id: recEscolhido?.id,
        recipiente_nome: recEscolhido?.nome,
      })
      toast({
        title: "Entrada registrada com sucesso!",
        description: recEscolhido
          ? `Estoque atualizado e creditado no ${recEscolhido.nome}.`
          : "Estoque atualizado com a reposição.",
      })
      setModalConfirmarEntradaAberta(false)
      setOpenEntrada(false)
      setQuantidadeEntrada(0)
      setValorNotaEntrada("")
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

    if (precisaRecipienteDestino && !recipienteDestinoId) {
      toast({
        title: "Atenção",
        description: `Selecione o ${
          materialSelecionadoEntrada?.codigo === "aditivo" ? "tanque" : "silo"
        } de destino.`,
        variant: "destructive",
      })
      return
    }

    if (!valorNotaEntrada.trim() || valorNotaNum <= 0) {
      toast({
        title: "Atenção",
        description: "Informe o valor total da nota válido maior que zero.",
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
            {codigoFixo === "aditivo"
              ? `Entradas e saídas dos tanques de aditivo da unidade ${empresaAtiva?.nome || ""}.`
              : `Entradas e saídas dos silos de cimento da unidade ${empresaAtiva?.nome || ""}.`}
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
                {/* MATERIAL FIXO: definido pela ROTA. Não é selecionável —
                    é isto que impede lançar aditivo como cimento. */}
                <div className="space-y-2">
                  <Label>Material</Label>
                  <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {codigoFixo === "aditivo" ? (
                        <FlaskConical className="w-4 h-4 text-primary" />
                      ) : (
                        <Package className="w-4 h-4 text-primary" />
                      )}
                      {materialDaRota?.nome || "—"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {materialDaRota?.unidade || ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Definido pela tela atual ({codigoFixo}). A entrada será
                    gravada somente neste material.
                  </p>
                </div>

                {/* Se a unidade tiver recipientes para o material (ex.: Patos), seletor de silo/tanque obrigatório */}
                {precisaRecipienteDestino && (
                  <div className="space-y-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <Label
                      htmlFor="recipienteDestino"
                      className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                    >
                      <Cylinder className="w-3.5 h-3.5 text-primary" />
                      {materialSelecionadoEntrada?.codigo === "aditivo"
                        ? "Tanque de Destino (Patos) *"
                        : "Silo de Destino (Patos) *"}
                    </Label>
                    <Select
                      value={recipienteDestinoId}
                      onValueChange={setRecipienteDestinoId}
                    >
                      <SelectTrigger
                        id="recipienteDestino"
                        className="bg-background text-xs font-semibold"
                      >
                        <SelectValue placeholder="Selecione o recipiente de destino..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recipientesFiltradosEntrada.map((r) => (
                          <SelectItem
                            key={r.id}
                            value={r.id}
                            className="text-xs"
                          >
                            {r.nome} — Saldo:{" "}
                            {r.saldo_atual.toLocaleString("pt-BR")} {r.unidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      O saldo deste recipiente e o saldo total da unidade serão
                      creditados simultaneamente.
                    </p>
                  </div>
                )}

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
                    <Label htmlFor="valorNota">
                      Valor total da nota (R$) *
                    </Label>
                    <Input
                      id="valorNota"
                      type="text"
                      inputMode="decimal"
                      value={valorNotaEntrada}
                      onChange={(e) => setValorNotaEntrada(e.target.value)}
                      placeholder="Ex: 21600,00"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Preço unitário calculado:{" "}
                      <span className="font-semibold text-foreground">
                        {precoUnitarioCalculado > 0
                          ? `R$ ${precoUnitarioCalculado.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              },
                            )} / ${
                              materiais.find((m) => m.id === materialEntradaId)
                                ?.unidade || "un"
                            }`
                          : "R$ 0,00"}
                      </span>
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
                      {precoUnitarioCalculado > 0
                        ? precoUnitarioCalculado.toLocaleString("pt-BR", {
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

      {/* Abas Principais de Estoque: Visão Geral vs Controle de Britas vs Ações */}
      <Tabs
        value={valorTab}
        onValueChange={(v) => navigate(ROTA_DO_INSUMO[v] || "/estoque/cimento")}
        className="space-y-4"
      >
        <TabsList className="bg-muted/60 p-1 border border-border/40 h-auto flex-wrap">
          {codigoFixo !== null && (
            <TabsTrigger
              value="insumos"
              className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
            >
              {codigoFixo === "aditivo" ? (
                <FlaskConical className="w-4 h-4 text-primary" />
              ) : (
                <Package className="w-4 h-4 text-primary" />
              )}
              <span>{codigoFixo === "aditivo" ? "ADITIVO" : "CIMENTO"}</span>
            </TabsTrigger>
          )}

          {/* Britas e Ações só aparecem na rota /estoque/britas.
              Nas telas de Cimento e Aditivo o recorte é fechado: só o insumo. */}
          {codigoFixo === null && (
            <TabsTrigger
              value="britas"
              className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
            >
              <Layers className="w-4 h-4 text-primary" />
              <span>CONTROLE DE BRITAS</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/10 font-semibold"
              >
                Brita 19 & 12
              </Badge>
            </TabsTrigger>
          )}

          {podeAcessarAcoes && (
            <TabsTrigger
              value="acoes"
              className="text-xs gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground font-medium"
            >
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Ações</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-mono"
              >
                Admin/Gestor
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {codigoFixo !== null && (
          <TabsContent value="insumos" className="space-y-6 mt-0">
            {/* Alerta de Pedido Automático de Cimento (quando saldo > 0 e saldo < 20.000 kg) */}
            {(() => {
              const matCimento = materiais.find((m) => m.codigo === "cimento")
              if (!matCimento) return null
              const saldo = matCimento.saldo || 0
              // Unidades com saldo zerado não disparam alerta (somente quando há saldo em operação < 20.000 kg)
              if (saldo <= 0) return null

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
                  {codigoFixo === "aditivo"
                    ? "Estoque de Aditivo"
                    : "Estoque de Cimento"}
                  <Badge
                    variant="outline"
                    className="text-xs text-primary border-primary/30"
                  >
                    {codigoFixo === "aditivo"
                      ? "Tanques de Aditivo"
                      : "Silos de Cimento"}
                  </Badge>
                </h2>
                <span className="text-xs text-muted-foreground">
                  Baixa automática nas cargas com alerta de estoque mínimo
                </span>
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${
                  materiaisDaRota.length > 1 ? "md:grid-cols-2" : "md:max-w-2xl"
                }`}
              >
                {materiaisDaRota.map((mat) => {
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
                              Mínimo:{" "}
                              {mat.estoque_minimo.toLocaleString("pt-BR")}{" "}
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
                                    const link = gerarLinkWhatsAppPedidoCimento(
                                      {
                                        unidadeNome:
                                          empresaAtiva?.nome || "Unidade",
                                        saldoAtualKg: saldo,
                                        estoqueMinimoKg:
                                          mat.estoque_minimo || 15000,
                                        empresa: empresaAtiva,
                                      },
                                    )
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

                        {/* SUB-LISTA DE RECIPIENTES (Silos e Tanques individuais de Patos) */}
                        {(() => {
                          const recsDoMaterial = recipientes.filter((r) => {
                            if (r.material_id && r.material_id === mat.id)
                              return true
                            if (mat.codigo === "cimento")
                              return (
                                r.tipo === "silo" ||
                                r.material_codigo === "cimento"
                              )
                            if (mat.codigo === "aditivo")
                              return (
                                r.tipo === "tanque" ||
                                r.material_codigo === "aditivo"
                              )
                            return false
                          })

                          if (recsDoMaterial.length === 0) return null

                          return (
                            <div className="pt-3 mt-3 border-t border-border/40 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Cylinder className="w-3.5 h-3.5 text-primary" />
                                  Saldos Individuais (
                                  {mat.codigo === "cimento"
                                    ? "Silos"
                                    : "Tanques"}
                                  ):
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {recsDoMaterial.length} cadastrados
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {recsDoMaterial.map((rec) => {
                                  const recCritico =
                                    rec.estoque_minimo > 0 &&
                                    rec.saldo_atual < rec.estoque_minimo
                                  const recMargem =
                                    rec.saldo_atual - rec.estoque_minimo
                                  const recAtencao =
                                    !recCritico &&
                                    rec.estoque_minimo > 0 &&
                                    rec.saldo_atual === rec.estoque_minimo

                                  return (
                                    <div
                                      key={rec.id}
                                      className={`p-2.5 rounded-lg border text-xs bg-background/70 space-y-1.5 ${
                                        recCritico
                                          ? "border-destructive/40 bg-destructive/5"
                                          : recAtencao
                                            ? "border-amber-500/40 bg-amber-500/5"
                                            : "border-border/40"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span
                                          className="font-semibold text-foreground truncate"
                                          title={rec.nome}
                                        >
                                          {rec.nome}
                                        </span>
                                        {recCritico ? (
                                          <Badge
                                            variant="destructive"
                                            className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-red-500/10 text-red-600 border-red-500/30 font-bold"
                                          >
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            Abaixo
                                          </Badge>
                                        ) : recAtencao ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold"
                                          >
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            No mínimo
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold"
                                          >
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            OK
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-baseline justify-between font-mono">
                                        <div>
                                          <span
                                            className={`text-sm font-bold ${
                                              recCritico
                                                ? "text-red-600 dark:text-red-400"
                                                : "text-foreground"
                                            }`}
                                          >
                                            {rec.saldo_atual.toLocaleString(
                                              "pt-BR",
                                            )}
                                          </span>{" "}
                                          <span className="text-[10px] text-muted-foreground font-normal">
                                            {rec.unidade}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                          Mín:{" "}
                                          {rec.estoque_minimo.toLocaleString(
                                            "pt-BR",
                                          )}{" "}
                                          {rec.unidade}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Seção Informativa: Materiais Apenas Consumo (só faz sentido na
              visão de agregados — nas rotas de insumo não aparece) */}
            {codigoFixo === null && (
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
                        diretamente no consumo das cargas (sem saldo de estoque,
                        baixa ou alerta mínimo).
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {materiais
                        .filter(
                          (m) =>
                            m.codigo !== "cimento" && m.codigo !== "aditivo",
                        )
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
            )}

            {/* Dialog Editar Estoque Mínimo */}
            <Dialog open={openMinimo} onOpenChange={setOpenMinimo}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajustar Margem Mínima de Segurança</DialogTitle>
                  <DialogDescription>
                    Defina o valor mínimo de estoque para disparo de alertas
                    visuais no dashboard.
                  </DialogDescription>
                </DialogHeader>
                {materialEditando && (
                  <form
                    onSubmit={handleSalvarMinimo}
                    className="space-y-4 py-2"
                  >
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
                    Material:
                  </span>
                  <Select
                    value={filtroMaterial}
                    onValueChange={setFiltroMaterial}
                  >
                    <SelectTrigger className="w-[190px] h-8 text-xs">
                      <SelectValue placeholder="Materiais Controlados" />
                    </SelectTrigger>
                    <SelectContent>
                      {materiaisDaRota.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              {/* BARRA DE FILTROS DE PERÍODO */}
              <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2 border-b border-border/30">
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Período:
                </span>

                {[
                  { id: "dia", label: "DIA ATUAL" },
                  { id: "mes_atual", label: "MÊS ATUAL" },
                  { id: "mes_anterior", label: "MÊS ANTERIOR" },
                ].map((b) => (
                  <Button
                    key={b.id}
                    type="button"
                    size="sm"
                    variant={periodoHist === b.id ? "default" : "outline"}
                    onClick={() => setPeriodoHist(b.id as any)}
                    className={`h-7 px-2.5 text-[10px] font-bold uppercase tracking-tight ${
                      periodoHist === b.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b.label}
                  </Button>
                ))}

                <span className="text-xs text-muted-foreground px-1">|</span>

                <Input
                  type="date"
                  value={dataInicioHist}
                  onChange={(e) => {
                    setDataInicioHist(e.target.value)
                    setPeriodoHist("personalizado")
                  }}
                  className="h-7 w-[135px] text-xs"
                  title="Data inicial"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={dataFimHist}
                  onChange={(e) => {
                    setDataFimHist(e.target.value)
                    setPeriodoHist("personalizado")
                  }}
                  className="h-7 w-[135px] text-xs"
                  title="Data final"
                />

                {periodoHist === "personalizado" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDataInicioHist("")
                      setDataFimHist("")
                      setPeriodoHist("mes_atual")
                    }}
                    className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                  >
                    <FilterX className="w-3 h-3" />
                    Limpar
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-primary/30 text-primary"
                  >
                    {limitesPeriodo(periodoHist).inicio ||
                    limitesPeriodo(periodoHist).fim
                      ? `${(limitesPeriodo(periodoHist).inicio || "…").split("-").reverse().join("/")} — ${(limitesPeriodo(periodoHist).fim || "…").split("-").reverse().join("/")}`
                      : "todo o período"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {movimentacoes.length} mov.
                  </Badge>
                </div>
              </div>
              <CardContent>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 border-b border-border/40 backdrop-blur">
                      <tr>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Recipiente</th>
                        <th className="py-2.5 px-3">Quantidade</th>
                        <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                        <th className="py-2.5 px-3 text-right">Valor Total</th>
                        <th className="py-2.5 px-3">Documento / Ref</th>
                        <th className="py-2.5 px-3">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {movimentacoes.map((mov, movIdx) => {
                        const isEntrada =
                          mov.tipo === "ENTRADA" || mov.tipo === "ABERTURA"
                        const mat =
                          materiais.find((m) => m.id === mov.material_id) ||
                          mov.material

                        // Linha de ABERTURA DE MÊS: inserida antes do primeiro
                        // movimento de cada mês do extrato.
                        const mesMov = (mov.data || "").substring(0, 7)
                        const mesAnterior = movimentacoes[
                          movIdx - 1
                        ]?.data?.substring(0, 7)
                        const ehPrimeiroDoMes =
                          mesMov !== mesAnterior && !!mesMov
                        const abertura = aberturasPorMes.get(mesMov)
                        const unidadeMat = mat?.unidade || "kg"

                        return (
                          <>
                            {ehPrimeiroDoMes && (
                              <tr
                                key={`abertura-${mesMov}`}
                                className="bg-primary/5 border-y border-primary/20"
                              >
                                <td className="py-2 px-3 font-mono font-bold text-primary whitespace-nowrap">
                                  01/{mesMov.substring(5)}/
                                  {mesMov.substring(0, 4)}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold text-primary border-primary/40 bg-primary/10 gap-1"
                                  >
                                    <CalendarDays className="w-3 h-3" />
                                    SALDO INICIAL
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 font-semibold text-foreground">
                                  {mat?.nome || "—"}
                                </td>
                                <td className="py-2 px-3 text-[11px] text-muted-foreground">
                                  {abertura && abertura.length > 0 ? (
                                    <div className="space-y-0.5">
                                      {abertura.map((a: any) => (
                                        <div
                                          key={a.recipiente}
                                          className="flex justify-between gap-3"
                                        >
                                          <span
                                            className="truncate max-w-[150px]"
                                            title={a.recipiente}
                                          >
                                            {a.recipiente}
                                          </span>
                                          <span className="font-mono font-semibold text-foreground whitespace-nowrap">
                                            {a.saldo.toLocaleString("pt-BR", {
                                              maximumFractionDigits: 0,
                                            })}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-primary">
                                  {abertura
                                    ? abertura
                                        .reduce(
                                          (s: number, a: any) => s + a.saldo,
                                          0,
                                        )
                                        .toLocaleString("pt-BR", {
                                          maximumFractionDigits: 0,
                                        })
                                    : "0"}{" "}
                                  {unidadeMat}
                                </td>
                                <td className="py-2 px-3 text-right text-muted-foreground">
                                  —
                                </td>
                                <td className="py-2 px-3 text-right text-muted-foreground">
                                  —
                                </td>
                                <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                                  ABERTURA {mesMov}
                                </td>
                                <td className="py-2 px-3 text-muted-foreground text-[11px]">
                                  Saldo no início do mês
                                </td>
                              </tr>
                            )}
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
                              <td className="py-2.5 px-3 text-muted-foreground text-xs">
                                {(mov as any).recipiente_nome ||
                                  (mov as any).recipiente_id ||
                                  "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span
                                  className={
                                    isEntrada
                                      ? "text-emerald-500"
                                      : "text-rose-500"
                                  }
                                >
                                  {isEntrada ? "+" : "-"}{" "}
                                  {Number(mov.quantidade).toLocaleString(
                                    "pt-BR",
                                  )}{" "}
                                  {mat?.unidade || ""}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {isEntrada && mov.preco_unitario != null
                                  ? Number(mov.preco_unitario).toLocaleString(
                                      "pt-BR",
                                      {
                                        style: "currency",
                                        currency: "BRL",
                                      },
                                    )
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                                {isEntrada && mov.valor_total != null
                                  ? Number(mov.valor_total).toLocaleString(
                                      "pt-BR",
                                      {
                                        style: "currency",
                                        currency: "BRL",
                                      },
                                    )
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
                          </>
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
                    Confira os dados da movimentação antes de confirmar a
                    reposição.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2 text-xs">
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">
                        Insumo:
                      </span>
                      <span className="font-bold text-foreground">
                        {materiais.find((m) => m.id === materialEntradaId)
                          ?.nome || "—"}
                      </span>
                    </div>
                    {precisaRecipienteDestino && recipienteDestinoId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-sans">
                          Destino:
                        </span>
                        <span className="font-bold text-primary">
                          {recipientes.find((r) => r.id === recipienteDestinoId)
                            ?.nome || "—"}
                        </span>
                      </div>
                    )}
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
                        {materiais.find((m) => m.id === materialEntradaId)
                          ?.unidade || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">
                        Preço Unitário (Calculado):
                      </span>
                      <span className="font-semibold">
                        {precoUnitarioCalculado.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-1">
                      <span className="text-muted-foreground font-sans">
                        Valor Total da Nota:
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
                      <span className="text-muted-foreground font-sans">
                        Insumo:
                      </span>
                      <span className="font-bold text-foreground">
                        {materialEditando?.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">
                        Tipo:
                      </span>
                      <span className="font-semibold">AJUSTE DE PARÂMETRO</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">
                        Mínimo Anterior:
                      </span>
                      <span>
                        {materialEditando?.estoque_minimo.toLocaleString(
                          "pt-BR",
                        )}{" "}
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
          </TabsContent>
        )}

        {codigoFixo === null && (
          <TabsContent value="britas" className="space-y-4 mt-0">
            <AbaControleBritas
              empresaAtiva={empresaAtiva}
              podeEditar={!isBalanceiro || isAdministrador || isGestor}
            />
          </TabsContent>
        )}

        {podeAcessarAcoes && (
          <TabsContent value="acoes" className="space-y-4 mt-0">
            <AbaAcoesEstoque
              empresaAtiva={empresaAtiva}
              materiais={materiais}
              onAtualizacao={carregarDados}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
