import { useState, useEffect } from "react"
import {
  Carga,
  Traco,
  Veiculo,
  Motorista,
  Cidade,
  RecipienteEstoque,
} from "@/types/concreteira"
import { ConcreteiraService } from "@/services/concreteira"
import { useToast } from "@/hooks/use-toast"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  Check,
  Pencil,
  RefreshCw,
  Scale,
  Sparkles,
  Truck,
  User,
  MapPin,
} from "lucide-react"

interface ModalEditarCargaProps {
  carga: Carga | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSalvoComSucesso: () => void
  tracosCatalogo: Traco[]
  nomeUnidade: string
  isPatos: boolean
  empresaId?: string
}
export function ModalEditarCarga({
  carga,
  open,
  onOpenChange,
  onSalvoComSucesso,
  tracosCatalogo,
  nomeUnidade,
  isPatos,
  empresaId,
}: ModalEditarCargaProps) {
  const { toast } = useToast()

  // Estados dos campos do formulário de edição
  const [dataCarga, setDataCarga] = useState("")
  const [volumeTexto, setVolumeTexto] = useState("8")
  const [tracoId, setTracoId] = useState<string>("manual")
  const [observacao, setObservacao] = useState("")
  const [cargaZerada, setCargaZerada] = useState(false)

  // Insumos reais (dosagens por m³ para sólidos; aditivo total em litros)
  const [cimento, setCimento] = useState<number>(0)
  const [brita12, setBrita12] = useState<number>(0) // Brita 0 em Patos
  const [brita19, setBrita19] = useState<number>(0)
  const [areia, setAreia] = useState<number>(0)
  const [poPedra, setPoPedra] = useState<number>(0)
  const [aditivo, setAditivo] = useState<number>(0)

  // Placa (veículo), Motorista e Cidade
  const [veiculoId, setVeiculoId] = useState<string>("nenhum")
  const [motoristaId, setMotoristaId] = useState<string>("nenhum")
  const [cidadeId, setCidadeId] = useState<string>("nenhum")

  // Listas de opções carregadas da empresa/unidade
  const [veiculosLista, setVeiculosLista] = useState<Veiculo[]>([])
  const [motoristasLista, setMotoristasLista] = useState<Motorista[]>([])
  const [cidadesLista, setCidadesLista] = useState<Cidade[]>([])
  const [carregandoCadastros, setCarregandoCadastros] = useState(false)

  // Silo e Tanque (exclusivo Patos)
  const [recipientesLista, setRecipientesLista] = useState<RecipienteEstoque[]>(
    [],
  )
  const [siloCimento, setSiloCimento] = useState<string>("silo_1")
  const [tanqueAditivo, setTanqueAditivo] = useState<string>("tanque_1")

  // Campos específicos acumulados de Patos
  // Cimento = cimento; Brita 0 = brita12;
  // Brita 0+1 acum = brita12 + brita19;
  // Areia acum = Brita 0+1 acum + areia;
  // Pó acum = Areia acum + poPedra;
  const [patosAcumBrita01, setPatosAcumBrita01] = useState<number>(0)
  const [patosAcumAreia, setPatosAcumAreia] = useState<number>(0)
  const [patosAcumPo, setPatosAcumPo] = useState<number>(0)

  // Controle do AlertDialog de confirmação
  const [openConfirmacao, setOpenConfirmacao] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Carrega opções de veículos, motoristas e cidades da unidade da carga/empresa
  useEffect(() => {
    if (!open) return
    const idEmpresa = carga?.empresa_id || empresaId
    let cancelado = false
    setCarregandoCadastros(true)

    Promise.all([
      ConcreteiraService.getVeiculos(idEmpresa),
      ConcreteiraService.getMotoristas(idEmpresa),
      ConcreteiraService.getCidades(idEmpresa),
      idEmpresa
        ? ConcreteiraService.getRecipientesEstoque(idEmpresa)
        : Promise.resolve([]),
    ])
      .then(([veics, mots, cids, recs]) => {
        if (!cancelado) {
          setVeiculosLista(veics || [])
          setMotoristasLista(mots || [])
          setCidadesLista(cids || [])
          setRecipientesLista(recs || [])
        }
      })
      .catch((err) => {
        console.error(
          "Erro ao carregar veiculos/motoristas/cidades no modal:",
          err,
        )
      })
      .finally(() => {
        if (!cancelado) setCarregandoCadastros(false)
      })

    return () => {
      cancelado = true
    }
  }, [open, carga?.empresa_id, empresaId])

  // Popula os estados ao abrir a carga
  useEffect(() => {
    if (!carga || !open) return

    setDataCarga(carga.data || "")
    const vol = Number(carga.volume_m3) || 1
    setVolumeTexto(String(vol).replace(".", ","))
    setObservacao(carga.observacao || "")
    setCargaZerada(Boolean(carga.carga_zerada))

    // Traco
    if (carga.traco_id) {
      setTracoId(carga.traco_id)
    } else {
      // Tentar casar pelo nome
      const match = tracosCatalogo.find((t) => t.nome === carga.traco_nome)
      setTracoId(match ? match.id : "manual")
    }

    // Veículo / Placa
    if (carga.veiculo_id) {
      setVeiculoId(carga.veiculo_id)
    } else if (carga.veiculo_placa) {
      const matchV = veiculosLista.find(
        (v) =>
          v.placa.trim().toUpperCase() ===
          carga.veiculo_placa?.trim().toUpperCase(),
      )
      setVeiculoId(matchV ? matchV.id : "nenhum")
    } else {
      setVeiculoId("nenhum")
    }

    // Motorista
    if (carga.motorista_id) {
      setMotoristaId(carga.motorista_id)
    } else if (carga.motorista_nome) {
      const matchM = motoristasLista.find(
        (m) =>
          m.nome.trim().toLowerCase() ===
          carga.motorista_nome?.trim().toLowerCase(),
      )
      setMotoristaId(matchM ? matchM.id : "nenhum")
    } else {
      setMotoristaId("nenhum")
    }

    // Cidade
    if (carga.cidade_id) {
      setCidadeId(carga.cidade_id)
    } else if (carga.cidade_nome) {
      const matchC = cidadesLista.find(
        (c) =>
          c.nome.trim().toLowerCase() ===
          carga.cidade_nome?.trim().toLowerCase(),
      )
      setCidadeId(matchC ? matchC.id : "nenhum")
    } else {
      setCidadeId("nenhum")
    }

    // Dosagens por m³
    const dosCim =
      vol > 0
        ? Math.round(Number(carga.consumo_cimento || 0) / vol)
        : Number(carga.consumo_cimento || 0)
    const dosB0 =
      vol > 0
        ? Math.round(Number(carga.consumo_brita12 || 0) / vol)
        : Number(carga.consumo_brita12 || 0)
    const dosB19 =
      vol > 0
        ? Math.round(Number(carga.consumo_brita19 || 0) / vol)
        : Number(carga.consumo_brita19 || 0)
    const dosAreia =
      vol > 0
        ? Math.round(Number(carga.consumo_areia || 0) / vol)
        : Number(carga.consumo_areia || 0)
    const dosPo =
      vol > 0
        ? Math.round(Number(carga.consumo_po_pedra || 0) / vol)
        : Number(carga.consumo_po_pedra || 0)
    const adtTotal = Math.round(Number(carga.consumo_aditivo || 0))

    setCimento(dosCim)
    setBrita12(dosB0)
    setBrita19(dosB19)
    setAreia(dosAreia)
    setPoPedra(dosPo)
    setAditivo(adtTotal)

    // Silo e Tanque
    if (carga.silo_cimento) setSiloCimento(carga.silo_cimento)
    else setSiloCimento("silo_1")
    if (carga.tanque_aditivo) setTanqueAditivo(carga.tanque_aditivo)
    else setTanqueAditivo("tanque_1")

    // Recompor acumulados de Patos
    const acum01 = dosB0 + dosB19
    const acumAr = acum01 + dosAreia
    const acumPo = acumAr + dosPo
    setPatosAcumBrita01(acum01)
    setPatosAcumAreia(acumAr)
    setPatosAcumPo(acumPo)
  }, [
    carga,
    open,
    tracosCatalogo,
    veiculosLista,
    motoristasLista,
    cidadesLista,
  ])

  const volumeNum =
    parseFloat(String(volumeTexto).replace(",", ".").trim()) || 0

  // Ao trocar traço no select, opcionalmente sugere as dosagens do traço
  const handleSelecionarTraco = (id: string) => {
    setTracoId(id)
    if (id !== "manual") {
      const traco = tracosCatalogo.find((t) => t.id === id)
      if (traco) {
        const cCim = Number(traco.consumo_cimento) || 0
        const cB0 = Number(traco.consumo_brita12) || 0
        const cB1 = Number(traco.consumo_brita19) || 0
        const cAr = Number(traco.consumo_areia) || 0
        const cPo = Number(traco.consumo_po_pedra) || 0
        const cAdt = Number(traco.consumo_aditivo) || 0

        setCimento(cCim)
        setBrita12(cB0)
        setBrita19(cB1)
        setAreia(cAr)
        setPoPedra(cPo)

        const acum01 = cB0 + cB1
        const acumAr = acum01 + cAr
        const acumPo = acumAr + cPo
        setPatosAcumBrita01(acum01)
        setPatosAcumAreia(acumAr)
        setPatosAcumPo(acumPo)

        if (cAdt > 0 && volumeNum > 0) {
          setAditivo(Math.round(cAdt * volumeNum))
        }
      }
    }
  }

  // Cálculos de consumo total real que serão gravados
  const consumoCalculado = {
    cimento: Math.round(cimento * volumeNum),
    brita12: Math.round(brita12 * volumeNum),
    brita19: Math.round(brita19 * volumeNum),
    areia: Math.round(areia * volumeNum),
    poPedra: Math.round(poPedra * volumeNum),
    aditivo: Math.round(aditivo),
  }

  // Validação simples antes de abrir o AlertDialog
  const handlePreSubmeter = (e: React.FormEvent) => {
    e.preventDefault()

    if (!dataCarga) {
      toast({
        title: "Data obrigatória",
        description: "Informe a data da carga.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(volumeNum) || volumeNum < 0.5 || volumeNum > 11.0) {
      toast({
        title: "Volume inválido",
        description: "O volume deve estar entre 0,5 e 11,0 m³.",
        variant: "destructive",
      })
      return
    }

    if (!cargaZerada) {
      if (cimento <= 0) {
        toast({
          title: "Cimento zerado",
          description: "Informe o consumo de cimento por m³.",
          variant: "destructive",
        })
        return
      }
      if (areia <= 0) {
        toast({
          title: "Areia zerada",
          description: "Informe o consumo de areia.",
          variant: "destructive",
        })
        return
      }
    }

    setOpenConfirmacao(true)
  }

  // Execução final após confirmação do usuário no AlertDialog
  const handleConfirmarSalvar = async () => {
    if (!carga) return

    setSalvando(true)
    try {
      const tracoSelecionado = tracosCatalogo.find((t) => t.id === tracoId)
      const nomeTracoGravado = tracoSelecionado
        ? tracoSelecionado.nome
        : tracoId === "manual"
          ? "Manual"
          : carga.traco_nome || "Manual"

      const veiculoSel = veiculosLista.find((v) => v.id === veiculoId)
      const motoristaSel = motoristasLista.find((m) => m.id === motoristaId)
      const cidadeSel = cidadesLista.find((c) => c.id === cidadeId)

      await ConcreteiraService.atualizarCarga(carga.id, {
        data: dataCarga,
        volume_m3: volumeNum,
        traco_id: tracoSelecionado?.id,
        traco_nome: nomeTracoGravado,
        motorista_id: motoristaSel
          ? motoristaSel.id
          : motoristaId === "nenhum"
            ? null
            : carga.motorista_id || null,
        motorista_nome: motoristaSel
          ? motoristaSel.nome
          : motoristaId === "nenhum"
            ? null
            : carga.motorista_nome || null,
        veiculo_id: veiculoSel
          ? veiculoSel.id
          : veiculoId === "nenhum"
            ? null
            : carga.veiculo_id || null,
        veiculo_placa: veiculoSel
          ? veiculoSel.placa
          : veiculoId === "nenhum"
            ? null
            : carga.veiculo_placa || null,
        cidade_id: cidadeSel
          ? cidadeSel.id
          : cidadeId === "nenhum"
            ? null
            : carga.cidade_id || null,
        cidade_nome: cidadeSel
          ? cidadeSel.nome
          : cidadeId === "nenhum"
            ? null
            : carga.cidade_nome || null,
        consumo_brita12: consumoCalculado.brita12,
        consumo_brita19: consumoCalculado.brita19,
        consumo_areia: consumoCalculado.areia,
        consumo_po_pedra: consumoCalculado.poPedra,
        consumo_cimento: consumoCalculado.cimento,
        consumo_aditivo: consumoCalculado.aditivo,
        consumo_agua: Number(carga.consumo_agua) || 0,
        observacao: observacao || null,
        carga_zerada: cargaZerada,
        silo_cimento: isPatos ? siloCimento : undefined,
        tanque_aditivo: isPatos ? tanqueAditivo : undefined,
      })

      toast({
        title: "Carga atualizada com sucesso!",
        description: `Carga #${String(carga.numero_carga).padStart(4, "0")} foi regravada e os estoques de cimento/aditivo foram recalculados.`,
      })

      setOpenConfirmacao(false)
      onOpenChange(false)
      onSalvoComSucesso()
    } catch (err: any) {
      console.error("Erro ao salvar edição da carga:", err)
      toast({
        title: "Erro ao atualizar carga",
        description: err.message || "Falha na comunicação com o banco.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  if (!carga) return null

  const numeroFormatado = String(carga.numero_carga).padStart(4, "0")

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
              <Pencil className="w-5 h-5 text-amber-500" />
              <span>Editar Carga #{numeroFormatado}</span>
              <Badge
                variant="outline"
                className="ml-1 text-[11px] font-semibold border-amber-500/40 text-amber-600 bg-amber-500/10"
              >
                {nomeUnidade}
              </Badge>
              {isPatos && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10"
                >
                  Modo Acumulativo
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajuste as informações da carga. As movimentações de estoque de
              cimento e aditivo serão estornadas e recalculadas com os novos
              valores.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePreSubmeter} className="space-y-4 py-2">
            {/* Linha 1: Data, Volume e Traço */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-data" className="text-xs font-semibold">
                  Data da Carga *
                </Label>
                <Input
                  id="edit-data"
                  type="date"
                  value={dataCarga}
                  onChange={(e) => setDataCarga(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-volume" className="text-xs font-semibold">
                  Volume (m³) *
                </Label>
                <Input
                  id="edit-volume"
                  type="text"
                  inputMode="decimal"
                  value={volumeTexto}
                  onChange={(e) => setVolumeTexto(e.target.value)}
                  placeholder="Ex: 8,0"
                  className="h-9 text-xs font-bold rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-traco" className="text-xs font-semibold">
                  Traço de Referência
                </Label>
                <Select value={tracoId} onValueChange={handleSelecionarTraco}>
                  <SelectTrigger
                    id="edit-traco"
                    className="h-9 text-xs rounded-lg"
                  >
                    <SelectValue placeholder="Selecione o traço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual" className="text-xs">
                      Manual / Sem Traço Vinculado
                    </SelectItem>
                    {tracosCatalogo.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.nome} {t.fck_mpa ? `(${t.fck_mpa} MPa)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Placa (Veículo), Motorista e Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-veiculo"
                  className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                >
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  Placa (Veículo)
                </Label>
                <Select
                  value={veiculoId}
                  onValueChange={setVeiculoId}
                  disabled={carregandoCadastros}
                >
                  <SelectTrigger
                    id="edit-veiculo"
                    className="h-9 text-xs rounded-lg bg-background"
                  >
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="nenhum"
                      className="text-xs text-muted-foreground"
                    >
                      — Nenhum / Sem placa —
                    </SelectItem>
                    {veiculosLista.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="text-xs">
                        {v.placa} {v.modelo ? `(${v.modelo})` : ""}
                      </SelectItem>
                    ))}
                    {/* Se a carga tinha placa sem match no cadastro ativo, exibe opção para manter */}
                    {carga.veiculo_placa &&
                      !veiculosLista.some(
                        (v) =>
                          v.id === carga.veiculo_id ||
                          v.placa === carga.veiculo_placa,
                      ) && (
                        <SelectItem
                          value={`legado_${carga.veiculo_placa}`}
                          className="text-xs italic"
                        >
                          {carga.veiculo_placa} (Registro atual)
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-motorista"
                  className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  Motorista
                </Label>
                <Select
                  value={motoristaId}
                  onValueChange={setMotoristaId}
                  disabled={carregandoCadastros}
                >
                  <SelectTrigger
                    id="edit-motorista"
                    className="h-9 text-xs rounded-lg bg-background"
                  >
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="nenhum"
                      className="text-xs text-muted-foreground"
                    >
                      — Nenhum motorista —
                    </SelectItem>
                    {motoristasLista.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.nome}
                      </SelectItem>
                    ))}
                    {carga.motorista_nome &&
                      !motoristasLista.some(
                        (m) =>
                          m.id === carga.motorista_id ||
                          m.nome === carga.motorista_nome,
                      ) && (
                        <SelectItem
                          value={`legado_${carga.motorista_nome}`}
                          className="text-xs italic"
                        >
                          {carga.motorista_nome} (Registro atual)
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-cidade"
                  className="text-xs font-semibold flex items-center gap-1.5 text-foreground"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Cidade
                </Label>
                <Select
                  value={cidadeId}
                  onValueChange={setCidadeId}
                  disabled={carregandoCadastros}
                >
                  <SelectTrigger
                    id="edit-cidade"
                    className="h-9 text-xs rounded-lg bg-background"
                  >
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="nenhum"
                      className="text-xs text-muted-foreground"
                    >
                      — Nenhuma cidade —
                    </SelectItem>
                    {cidadesLista.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.nome}
                        {c.uf ? ` - ${c.uf}` : ""}
                      </SelectItem>
                    ))}
                    {carga.cidade_nome &&
                      !cidadesLista.some(
                        (c) =>
                          c.id === carga.cidade_id ||
                          c.nome === carga.cidade_nome,
                      ) && (
                        <SelectItem
                          value={`legado_${carga.cidade_nome}`}
                          className="text-xs italic"
                        >
                          {carga.cidade_nome} (Registro atual)
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Origem da Baixa: Silos e Tanques em Patos / unidades com recipientes */}
            {isPatos && recipientesLista.length > 0 && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  Origem da Baixa no Estoque (Patos):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {recipientesLista.filter(
                    (r) => r.tipo === "silo" || r.material_codigo === "cimento",
                  ).length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Silo de Cimento:
                      </Label>
                      <Select
                        value={siloCimento}
                        onValueChange={setSiloCimento}
                      >
                        <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {recipientesLista
                            .filter(
                              (r) =>
                                r.tipo === "silo" ||
                                r.material_codigo === "cimento",
                            )
                            .map((r) => {
                              const unidadeFmt =
                                r.unidade === "litros" || r.unidade === "l"
                                  ? "L"
                                  : r.unidade || "kg"
                              return (
                                <SelectItem key={r.id} value={r.identificador}>
                                  {`${r.nome} — ${Number(r.saldo_atual || 0).toLocaleString("pt-BR")} ${unidadeFmt}`}
                                </SelectItem>
                              )
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {recipientesLista.filter(
                    (r) =>
                      r.tipo === "tanque" || r.material_codigo === "aditivo",
                  ).length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Tanque de Aditivo:
                      </Label>
                      <Select
                        value={tanqueAditivo}
                        onValueChange={setTanqueAditivo}
                      >
                        <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {recipientesLista
                            .filter(
                              (r) =>
                                r.tipo === "tanque" ||
                                r.material_codigo === "aditivo",
                            )
                            .map((r) => {
                              const unidadeFmt =
                                r.unidade === "litros" || r.unidade === "l"
                                  ? "L"
                                  : r.unidade || "kg"
                              return (
                                <SelectItem key={r.id} value={r.identificador}>
                                  {`${r.nome} — ${Number(r.saldo_atual || 0).toLocaleString("pt-BR")} ${unidadeFmt}`}
                                </SelectItem>
                              )
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEÇÃO DE INSUMOS: Se PATOS → Modo Acumulativo; Se OUTRA → Modo Padrão */}
            {isPatos ? (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    Digitação Acumulativa de Patos (por 1 m³)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    O sistema desmembra para consumo real ao salvar
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Cimento (indireto / normal) */}
                  <div className="space-y-1 bg-background/80 p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Cimento (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={cimento === 0 ? "" : cimento}
                      onChange={(e) => setCimento(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Brita 0 (individual) */}
                  <div className="space-y-1 bg-background/80 p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Brita 0 (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={brita12 === 0 ? "" : brita12}
                      onChange={(e) => {
                        const nB0 = Number(e.target.value) || 0
                        setBrita12(nB0)
                        // Ajusta brita 19 mantendo o acumulado digitado
                        setBrita19(Math.max(0, patosAcumBrita01 - nB0))
                      }}
                      placeholder="0"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  {/* Brita 0+1 ACUMULADA */}
                  <div className="space-y-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                    <Label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span>Brita 0+1 Acum. (kg/m³)</span>
                      <span className="text-[9px] font-mono font-normal">
                        B19 real: {brita19}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={patosAcumBrita01 === 0 ? "" : patosAcumBrita01}
                      onChange={(e) => {
                        const nAcum01 = Number(e.target.value) || 0
                        setPatosAcumBrita01(nAcum01)
                        setBrita19(Math.max(0, nAcum01 - brita12))
                        setAreia(Math.max(0, patosAcumAreia - nAcum01))
                      }}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold border-amber-500/50"
                    />
                  </div>

                  {/* Areia ACUMULADA */}
                  <div className="space-y-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                    <Label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span>Areia Acum. (kg/m³)</span>
                      <span className="text-[9px] font-mono font-normal">
                        Areia real: {areia}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={patosAcumAreia === 0 ? "" : patosAcumAreia}
                      onChange={(e) => {
                        const nAcumAr = Number(e.target.value) || 0
                        setPatosAcumAreia(nAcumAr)
                        setAreia(Math.max(0, nAcumAr - patosAcumBrita01))
                        setPoPedra(Math.max(0, patosAcumPo - nAcumAr))
                      }}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold border-amber-500/50"
                    />
                  </div>

                  {/* Pó ACUMULADO */}
                  <div className="space-y-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                    <Label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span>Pó Acum. (kg/m³)</span>
                      <span className="text-[9px] font-mono font-normal">
                        Pó real: {poPedra}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={patosAcumPo === 0 ? "" : patosAcumPo}
                      onChange={(e) => {
                        const nAcumPo = Number(e.target.value) || 0
                        setPatosAcumPo(nAcumPo)
                        setPoPedra(Math.max(0, nAcumPo - patosAcumAreia))
                      }}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold border-amber-500/50"
                    />
                  </div>

                  {/* Aditivo (Litros Total da Carga) */}
                  <div className="space-y-1 bg-background/80 p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Aditivo Total (L)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={aditivo === 0 ? "" : aditivo}
                      onChange={(e) => setAditivo(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* MODO PADRÃO: Monteiro, SJE, Caicó */
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-primary" />
                    Dosagem dos Insumos (kg/m³ ou Litros)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Valores por metro cúbico
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="space-y-1 bg-background p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold">
                      Cimento (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={cimento === 0 ? "" : cimento}
                      onChange={(e) => setCimento(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1 bg-background p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold">
                      Brita 12 (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={brita12 === 0 ? "" : brita12}
                      onChange={(e) => setBrita12(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1 bg-background p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold">
                      Brita 19 (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={brita19 === 0 ? "" : brita19}
                      onChange={(e) => setBrita19(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1 bg-background p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold">
                      Areia (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={areia === 0 ? "" : areia}
                      onChange={(e) => setAreia(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1 bg-background p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold">
                      Pó Pedra (kg/m³)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={poPedra === 0 ? "" : poPedra}
                      onChange={(e) => setPoPedra(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1 bg-background p-2 rounded-lg border border-border/40">
                    <Label className="text-[11px] font-semibold">
                      Aditivo Total (L)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={aditivo === 0 ? "" : aditivo}
                      onChange={(e) => setAditivo(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resumo do Consumo Real que será gravado */}
            <div className="p-3 rounded-xl bg-card border border-border/60 text-xs">
              <span className="font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Consumo total que será gravado (Volume {volumeNum.toFixed(1)}{" "}
                m³):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-foreground font-mono text-[11px]">
                <div className="p-1.5 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">
                    Cimento:
                  </span>
                  <strong>
                    {consumoCalculado.cimento.toLocaleString("pt-BR")} kg
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">
                    Brita 0/12:
                  </span>
                  <strong>
                    {consumoCalculado.brita12.toLocaleString("pt-BR")} kg
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">
                    Brita 19:
                  </span>
                  <strong>
                    {consumoCalculado.brita19.toLocaleString("pt-BR")} kg
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">
                    Areia:
                  </span>
                  <strong>
                    {consumoCalculado.areia.toLocaleString("pt-BR")} kg
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">
                    Pó Pedra:
                  </span>
                  <strong>
                    {consumoCalculado.poPedra.toLocaleString("pt-BR")} kg
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">
                    Aditivo:
                  </span>
                  <strong>
                    {consumoCalculado.aditivo.toLocaleString("pt-BR")} L
                  </strong>
                </div>
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-obs" className="text-xs font-semibold">
                Observações
              </Label>
              <Textarea
                id="edit-obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Informações adicionais, motivo do ajuste, etc."
                className="text-xs min-h-[60px] rounded-lg"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="w-full sm:w-auto gap-1.5 font-bold text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Pencil className="w-3.5 h-3.5" />
                Revisar e Gravar Alteração
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERTDIALOG DE CONFIRMAÇÃO (Padrão AbaEstoquesMinimos / AbaControleFerias) */}
      <AlertDialog
        open={openConfirmacao}
        onOpenChange={(isOpen) => {
          if (!isOpen && !salvando) {
            setOpenConfirmacao(false)
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Confirmar alteração da Carga #{numeroFormatado}?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Deseja realmente aplicar as alterações na carga{" "}
                <strong className="text-foreground">#{numeroFormatado}</strong>{" "}
                da unidade{" "}
                <strong className="text-foreground">{nomeUnidade}</strong>?
              </p>

              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40 space-y-1 text-foreground text-[11px] font-mono">
                <div>
                  <strong>Volume:</strong> {volumeNum.toFixed(1)} m³
                </div>
                <div>
                  <strong>Cimento:</strong>{" "}
                  {Number(carga.consumo_cimento || 0).toLocaleString("pt-BR")}{" "}
                  kg →{" "}
                  <span className="text-primary font-bold">
                    {consumoCalculado.cimento.toLocaleString("pt-BR")} kg
                  </span>
                </div>
                <div>
                  <strong>Aditivo:</strong>{" "}
                  {Number(carga.consumo_aditivo || 0).toLocaleString("pt-BR")} L
                  →{" "}
                  <span className="text-primary font-bold">
                    {consumoCalculado.aditivo.toLocaleString("pt-BR")} L
                  </span>
                </div>
                <div>
                  <strong>Britas + Areia:</strong>{" "}
                  {(
                    consumoCalculado.brita12 +
                    consumoCalculado.brita19 +
                    consumoCalculado.areia +
                    consumoCalculado.poPedra
                  ).toLocaleString("pt-BR")}{" "}
                  kg
                </div>
              </div>

              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                ⚠️ <strong>Impacto:</strong> As movimentações antigas de estoque
                de cimento e aditivo vinculadas a esta carga serão estornadas e
                as novas serão lançadas automaticamente. Se houver Recibo/OS
                vinculada, os itens serão recalculados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={salvando}
              className="text-xs"
              onClick={() => setOpenConfirmacao(false)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarSalvar}
              disabled={salvando}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
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
    </>
  )
}
