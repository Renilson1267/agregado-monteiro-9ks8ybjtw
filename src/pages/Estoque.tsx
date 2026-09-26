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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConcreteiraService } from '@/services/concreteira'
import { useEmpresa } from '@/hooks/use-empresa'
import type { Material, MovimentacaoEstoque } from '@/types/concreteira'
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Settings2,
  RefreshCw,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Estoque() {
  const { empresaAtiva } = useEmpresa()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [filtroMaterial, setFiltroMaterial] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  // Dialog Registrar Entrada
  const [openEntrada, setOpenEntrada] = useState(false)
  const [salvandoEntrada, setSalvandoEntrada] = useState(false)
  const [materialEntradaId, setMaterialEntradaId] = useState('')
  const [quantidadeEntrada, setQuantidadeEntrada] = useState<number>(0)
  const [dataEntrada, setDataEntrada] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [documentoEntrada, setDocumentoEntrada] = useState('')
  const [obsEntrada, setObsEntrada] = useState('')

  // Dialog Editar Mínimo
  const [openMinimo, setOpenMinimo] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(
    null,
  )
  const [novoMinimo, setNovoMinimo] = useState<number>(0)
  const [salvandoMinimo, setSalvandoMinimo] = useState(false)

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
      // Seleciona material inicial apenas dentre os controlados
      const matsControlados = mats.filter((m) => m.controla_estoque !== false)
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
        title: 'Erro ao carregar estoque',
        description: e.message,
        variant: 'destructive',
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

  const handleSalvarEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialEntradaId || quantidadeEntrada <= 0) {
      toast({
        title: 'Atenção',
        description: 'Informe material e quantidade positiva.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoEntrada(true)
    try {
      await ConcreteiraService.registrarEntradaEstoque({
        empresa_id: empresaAtiva?.id,
        material_id: materialEntradaId,
        quantidade: quantidadeEntrada,
        data: dataEntrada,
        documento: documentoEntrada || undefined,
        observacao: obsEntrada || undefined,
      })
      toast({
        title: 'Entrada registrada com sucesso!',
        description: 'Estoque atualizado com a reposição.',
      })
      setOpenEntrada(false)
      setQuantidadeEntrada(0)
      setDocumentoEntrada('')
      setObsEntrada('')
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar entrada',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvandoEntrada(false)
    }
  }

  const handleSalvarMinimo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialEditando) return

    setSalvandoMinimo(true)
    try {
      await ConcreteiraService.updateMaterialEstoqueMinimo(
        materialEditando.id,
        novoMinimo,
      )
      toast({
        title: 'Estoque mínimo atualizado',
        description: `Margem de segurança de ${materialEditando.nome} redefinida.`,
      })
      setOpenMinimo(false)
      setMaterialEditando(null)
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvandoMinimo(false)
    }
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
            unidade {empresaAtiva?.nome || ''}. (Agregados têm controle
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
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

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
                  Gera uma movimentação de estoque para{' '}
                  {materiais.find((m) => m.codigo === 'cimento')?.nome ||
                    'CP II F-40 / CP V ARI'}{' '}
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
                        .filter((m) => m.controla_estoque !== false)
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
                        ?.unidade || 'kg'}
                      ) *
                    </Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="any"
                      min="1"
                      value={quantidadeEntrada || ''}
                      onChange={(e) =>
                        setQuantidadeEntrada(Number(e.target.value))
                      }
                      placeholder="Ex: 30000"
                      required
                    />
                  </div>
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
                    disabled={salvandoEntrada}
                    className="bg-primary text-primary-foreground"
                  >
                    {salvandoEntrada ? 'Salvando...' : 'Salvar Entrada'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            .filter((m) => m.controla_estoque !== false)
            .map((mat) => {
              const saldo = mat.saldo || 0
              const critico = saldo <= mat.estoque_minimo

              return (
                <Card
                  key={mat.id}
                  className={`border-border/40 bg-card/70 relative overflow-hidden shadow-sm ${critico ? 'border-destructive/40' : ''}`}
                >
                  <div
                    className={`h-1.5 w-full ${critico ? 'bg-destructive' : 'bg-primary'}`}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {mat.nome}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider font-mono">
                          {mat.codigo === 'cimento'
                            ? `Silo de ${mat.nome}`
                            : 'Tanque de Aditivo Químico'}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={critico ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {critico ? 'Reposição Urgente' : 'Estoque Regular'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-extrabold text-foreground">
                          {saldo.toLocaleString('pt-BR')}
                        </span>{' '}
                        <span className="text-sm font-medium text-muted-foreground">
                          {mat.unidade}
                        </span>
                      </div>
                      {saldo >= 1000 && mat.unidade === 'kg' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {(saldo / 1000).toFixed(2)} t
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/30 text-xs space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Estoque Mínimo (Alerta):</span>
                        <span className="font-semibold text-foreground">
                          {mat.estoque_minimo.toLocaleString('pt-BR')}{' '}
                          {mat.unidade}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Margem Operacional:</span>
                        <span
                          className={
                            saldo - mat.estoque_minimo < 0
                              ? 'text-destructive font-bold'
                              : 'text-emerald-500 font-medium'
                          }
                        >
                          {(saldo - mat.estoque_minimo).toLocaleString('pt-BR')}{' '}
                          {mat.unidade}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
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
                .filter((m) => m.controla_estoque === false)
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
                  Unidade: {materialEditando.unidade} | Saldo Atual:{' '}
                  {materialEditando.saldo?.toLocaleString('pt-BR')}
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
                  {salvandoMinimo ? 'Salvando...' : 'Salvar Alteração'}
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
                  .filter((m) => m.controla_estoque !== false)
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
                  <th className="py-2.5 px-3">Documento / Ref</th>
                  <th className="py-2.5 px-3">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {movimentacoes.map((mov) => {
                  const isEntrada =
                    mov.tipo === 'ENTRADA' || mov.tipo === 'ABERTURA'
                  const mat =
                    materiais.find((m) => m.id === mov.material_id) ||
                    mov.material

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {mov.data.split('-').reverse().join('/')}
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
                        {mat?.nome || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={
                            isEntrada ? 'text-emerald-500' : 'text-rose-500'
                          }
                        >
                          {isEntrada ? '+' : '-'}{' '}
                          {Number(mov.quantidade).toLocaleString('pt-BR')}{' '}
                          {mat?.unidade || ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {mov.documento || '—'}
                      </td>
                      <td
                        className="py-2.5 px-3 text-muted-foreground max-w-[250px] truncate"
                        title={mov.observacao || ''}
                      >
                        {mov.observacao || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
