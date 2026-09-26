import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConcreteiraService } from '@/services/concreteira'
import { useEmpresa } from '@/hooks/use-empresa'
import type { Traco, PrecoMaterial, Carga, Material } from '@/types/concreteira'
import {
  FlaskConical,
  PlusCircle,
  Edit2,
  Layers,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Tracos() {
  const { empresaAtiva } = useEmpresa()
  const [tracos, setTracos] = useState<Traco[]>([])
  const [precos, setPrecos] = useState<PrecoMaterial[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [cargas, setCargas] = useState<Carga[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog Form
  const [openDialog, setOpenDialog] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [tracoEditandoId, setTracoEditandoId] = useState<string | null>(null)

  // Campos do traço
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fckMpa, setFckMpa] = useState<number | ''>(25)
  const [brita12, setBrita12] = useState<number>(480)
  const [brita19, setBrita19] = useState<number>(480)
  const [areia, setAreia] = useState<number>(850)
  const [poPedra, setPoPedra] = useState<number>(0)
  const [cimento, setCimento] = useState<number>(320)
  const [aditivo, setAditivo] = useState<number>(2.5)

  const carregarTracos = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const [data, prc, crgs, mats] = await Promise.all([
        ConcreteiraService.getTracos(empresaAtiva.id),
        ConcreteiraService.getPrecosMaterial(empresaAtiva.id),
        ConcreteiraService.getCargas({ empresaId: empresaAtiva.id }),
        ConcreteiraService.getMateriais(empresaAtiva.id),
      ])
      setTracos(data)
      setPrecos(prc)
      setCargas(crgs)
      setMateriais(mats)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar traços',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaAtiva) {
      carregarTracos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  const abrirNovo = () => {
    setTracoEditandoId(null)
    setNome('')
    setDescricao('')
    setFckMpa(25)
    setBrita12(480)
    setBrita19(480)
    setAreia(850)
    setPoPedra(0)
    setCimento(320)
    setAditivo(2.5)
    setOpenDialog(true)
  }

  const abrirEdicao = (traco: Traco) => {
    setTracoEditandoId(traco.id)
    setNome(traco.nome)
    setDescricao(traco.descricao || '')
    setFckMpa(traco.fck_mpa || '')
    setBrita12(Number(traco.consumo_brita12))
    setBrita19(Number(traco.consumo_brita19))
    setAreia(Number(traco.consumo_areia))
    setPoPedra(Number(traco.consumo_po_pedra))
    setCimento(Number(traco.consumo_cimento))
    setAditivo(Number(traco.consumo_aditivo))
    setOpenDialog(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) {
      toast({
        title: 'Atenção',
        description: 'O nome do traço é obrigatório',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      await ConcreteiraService.salvarTraco(
        {
          id: tracoEditandoId || undefined,
          empresa_id: empresaAtiva?.id,
          nome,
          descricao,
          fck_mpa: fckMpa ? Number(fckMpa) : null,
          consumo_brita12: Number(brita12),
          consumo_brita19: Number(brita19),
          consumo_areia: Number(areia),
          consumo_po_pedra: Number(poPedra),
          consumo_cimento: Number(cimento),
          consumo_aditivo: Number(aditivo),
          ativo: true,
        },
        empresaAtiva?.id,
      )

      toast({
        title: 'Traço salvo com sucesso!',
        description: tracoEditandoId
          ? 'Dosagem atualizada.'
          : 'Novo traço cadastrado para uso nas cargas.',
      })
      setOpenDialog(false)
      carregarTracos()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar traço',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Traços e Dosagens de Concreto
            {empresaAtiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                {empresaAtiva.nome}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Defina o consumo padrão por metro cúbico (m³) da unidade{' '}
            {empresaAtiva?.nome || ''}
          </p>
        </div>

        <Button
          onClick={abrirNovo}
          size="sm"
          className="gap-2 bg-primary text-primary-foreground"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Traço
        </Button>
      </div>

      {/* Grid de Traços Cadastrados com Custos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tracos.map((t) => {
          const calculoTeorico = ConcreteiraService.calcularCustoTracoM3(
            t,
            precos,
          )
          const custoTeoricoM3 = calculoTeorico.totalPorM3

          // Cargas reais expedidas com este traço
          const cargasDesteTraco = cargas.filter(
            (c) =>
              (c.traco_id === t.id || c.traco_nome === t.nome) &&
              !c.carga_zerada,
          )
          const volumeExpedido = cargasDesteTraco.reduce(
            (acc, c) => acc + Number(c.volume_m3),
            0,
          )
          const custoTotalReal = cargasDesteTraco.reduce(
            (acc, c) => acc + (c.custo?.total || 0),
            0,
          )
          const custoMedioRealM3 =
            volumeExpedido > 0 ? custoTotalReal / volumeExpedido : 0

          return (
            <Card
              key={t.id}
              className="border-border/40 bg-card/70 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {t.nome}
                    </CardTitle>
                    {t.fck_mpa && (
                      <Badge
                        variant="outline"
                        className="mt-1 text-xs bg-primary/10 text-primary border-primary/30"
                      >
                        fck ≥ {t.fck_mpa} MPa
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => abrirEdicao(t)}
                    title="Editar Traço"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
                {t.descricao && (
                  <CardDescription className="text-xs mt-2 line-clamp-2">
                    {t.descricao}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Bloco de Custo por m³ */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Custo Teórico Insumos (1 m³):
                    </span>
                    <span className="text-sm font-extrabold text-foreground font-mono">
                      R$ {custoTeoricoM3.toFixed(2)}/m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-primary/10">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      Custo Médio Expedido ({cargasDesteTraco.length} cargas):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {custoMedioRealM3 > 0
                        ? `R$ ${custoMedioRealM3.toFixed(2)}/m³`
                        : 'Sem histórico'}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-t border-border/30 pt-3">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Consumo por m³ de concreto:
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-background/60 border border-border/30">
                    <span
                      className="text-muted-foreground block text-[10px] truncate"
                      title={
                        materiais.find((m) => m.codigo === 'cimento')?.nome ||
                        'CP II F-40 / CP V ARI'
                      }
                    >
                      {materiais.find((m) => m.codigo === 'cimento')?.nome ||
                        'CP II F-40 / CP V ARI'}{' '}
                      (R$ {(calculoTeorico.detalhes.cimento || 0).toFixed(2)})
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {t.consumo_cimento}
                    </span>{' '}
                    kg/m³
                  </div>

                  <div className="p-2 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[10px]">
                      Aditivo (R${' '}
                      {(calculoTeorico.detalhes.aditivo || 0).toFixed(2)})
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {t.consumo_aditivo}
                    </span>{' '}
                    L/m³
                  </div>

                  <div className="p-2 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[10px]">
                      Areia (R${' '}
                      {(calculoTeorico.detalhes.areia || 0).toFixed(2)})
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {t.consumo_areia}
                    </span>{' '}
                    kg/m³
                  </div>

                  <div className="p-2 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[10px]">
                      Brita 12 (R${' '}
                      {(calculoTeorico.detalhes.brita12 || 0).toFixed(2)})
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {t.consumo_brita12}
                    </span>{' '}
                    kg/m³
                  </div>

                  <div className="p-2 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[10px]">
                      Brita 19 (R${' '}
                      {(calculoTeorico.detalhes.brita19 || 0).toFixed(2)})
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {t.consumo_brita19}
                    </span>{' '}
                    kg/m³
                  </div>

                  <div className="p-2 rounded bg-background/60 border border-border/30">
                    <span className="text-muted-foreground block text-[10px]">
                      Pó de Pedra (R${' '}
                      {(calculoTeorico.detalhes.po_pedra || 0).toFixed(2)})
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {t.consumo_po_pedra}
                    </span>{' '}
                    kg/m³
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog Formulário de Traço */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {tracoEditandoId
                ? 'Editar Dosagem do Traço'
                : 'Cadastrar Novo Traço de Concreto'}
            </DialogTitle>
            <DialogDescription>
              Informe os parâmetros de consumo por metro cúbico. Ao despachar
              uma carga com este traço, as quantidades serão multiplicadas pelo
              volume.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="nomeTraco">Nome do Traço *</Label>
                <Input
                  id="nomeTraco"
                  placeholder="Ex: FCK 25 MPa - Padrão"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fck">FCK (MPa)</Label>
                <Input
                  id="fck"
                  type="number"
                  placeholder="Ex: 25"
                  value={fckMpa}
                  onChange={(e) =>
                    setFckMpa(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição / Aplicação Recomendada</Label>
              <Textarea
                id="desc"
                rows={2}
                placeholder="Ex: Utilizado para lajes, vigas, fundações leves..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Consumo por m³ de concreto
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="cimen"
                    className="text-xs truncate block"
                    title={
                      materiais.find((m) => m.codigo === 'cimento')?.nome ||
                      'CP II F-40 / CP V ARI'
                    }
                  >
                    {materiais.find((m) => m.codigo === 'cimento')?.nome ||
                      'CP II F-40 / CP V ARI'}{' '}
                    (kg/m³)
                  </Label>
                  <Input
                    id="cimen"
                    type="number"
                    value={cimento}
                    onChange={(e) => setCimento(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="adit" className="text-xs">
                    Aditivo (L/m³)
                  </Label>
                  <Input
                    id="adit"
                    type="number"
                    step="0.1"
                    value={aditivo}
                    onChange={(e) => setAditivo(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="areia" className="text-xs">
                    Areia (kg/m³)
                  </Label>
                  <Input
                    id="areia"
                    type="number"
                    value={areia}
                    onChange={(e) => setAreia(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="brita12" className="text-xs">
                    Brita 12 (kg/m³)
                  </Label>
                  <Input
                    id="brita12"
                    type="number"
                    value={brita12}
                    onChange={(e) => setBrita12(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="brita19" className="text-xs">
                    Brita 19 (kg/m³)
                  </Label>
                  <Input
                    id="brita19"
                    type="number"
                    value={brita19}
                    onChange={(e) => setBrita19(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="poPedra" className="text-xs">
                    Pó de Pedra (kg/m³)
                  </Label>
                  <Input
                    id="poPedra"
                    type="number"
                    value={poPedra}
                    onChange={(e) => setPoPedra(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-primary text-primary-foreground"
              >
                {salvando ? 'Salvando...' : 'Salvar Traço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
