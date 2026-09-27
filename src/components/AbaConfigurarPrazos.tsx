import { useState, useEffect } from 'react'
import {
  Clock,
  ShieldCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  Info,
  Scale,
  Building2,
  Lock,
} from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { ExamesService } from '@/services/exames'
import {
  TipoExame,
  PrazoExameEmpresa,
  TIPOS_EXAME_CATALOGO,
} from '@/types/exames'

interface AbaConfigurarPrazosProps {
  onPrazosAtualizados?: () => void
}

export function AbaConfigurarPrazos({
  onPrazosAtualizados,
}: AbaConfigurarPrazosProps) {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [prazos, setPrazos] = useState<PrazoExameEmpresa[]>([])
  const [valoresMeses, setValoresMeses] = useState<Record<TipoExame, number>>({
    admissional: 12,
    aso: 12,
    acuidade_visual: 12,
    audiometria: 12,
    avaliacao_clinica: 12,
    toxicologico: 30,
    rx: 12,
    ecg: 12,
    demissional: 0,
  })

  // Carregar dados de prazos da empresa
  const carregarPrazos = async () => {
    if (!empresaAtiva) return
    setLoading(true)
    try {
      const lista = await ExamesService.listarPrazosCompletosEmpresa(
        empresaAtiva.id,
      )
      setPrazos(lista)

      const mapa: Record<TipoExame, number> = {
        admissional: 12,
        aso: 12,
        acuidade_visual: 12,
        audiometria: 12,
        avaliacao_clinica: 12,
        toxicologico: 30,
        rx: 12,
        ecg: 12,
        demissional: 0,
      }
      lista.forEach((p) => {
        if (
          p.tipo_exame !== undefined &&
          p.validade_padrao_meses !== null &&
          p.validade_padrao_meses !== undefined
        ) {
          mapa[p.tipo_exame] = Number(p.validade_padrao_meses)
        }
      })
      setValoresMeses(mapa)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar prazos da empresa',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPrazos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  const handleMudarMeses = (tipo: TipoExame, valorStr: string) => {
    const num = parseInt(valorStr, 10)
    setValoresMeses((prev) => ({
      ...prev,
      [tipo]: isNaN(num) ? 0 : num,
    }))
  }

  const handleSalvar = async () => {
    if (!isAdministrador) {
      toast({
        title: 'Permissão necessária',
        description:
          'Apenas usuários com perfil Administrador podem alterar as configurações de prazos da unidade.',
        variant: 'destructive',
      })
      return
    }

    if (!empresaAtiva) return

    // Validar se todos (exceto demissional) são maiores que zero
    for (const [tipo, meses] of Object.entries(valoresMeses)) {
      if (tipo !== 'demissional' && (!meses || meses <= 0)) {
        const item = TIPOS_EXAME_CATALOGO.find((c) => c.tipo === tipo)
        toast({
          title: 'Prazo inválido',
          description: `O exame "${item?.nome || tipo}" deve possuir prazo de validade maior que zero.`,
          variant: 'destructive',
        })
        return
      }
    }

    setSalvando(true)
    try {
      const listaParaSalvar = prazos.map((p) => ({
        tipo_exame: p.tipo_exame,
        validade_padrao_meses:
          p.tipo_exame === 'demissional'
            ? (valoresMeses[p.tipo_exame] ?? 0)
            : valoresMeses[p.tipo_exame] || 12,
        norma_referencia: p.norma_referencia,
        descricao_norma: p.descricao_norma,
      }))

      await ExamesService.salvarPrazosEmpresa(empresaAtiva.id, listaParaSalvar)

      toast({
        title: 'Prazos salvos com sucesso!',
        description: `Os prazos de validade da unidade ${empresaAtiva.nome} foram atualizados e aplicados imediatamente aos colaboradores.`,
      })

      await carregarPrazos()
      if (onPrazosAtualizados) {
        onPrazosAtualizados()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar prazos',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleRestaurarPadroes = async () => {
    if (!isAdministrador) {
      toast({
        title: 'Permissão necessária',
        description:
          'Apenas administradores podem restaurar as configurações padrão.',
        variant: 'destructive',
      })
      return
    }

    if (!empresaAtiva) return

    const confirmou = window.confirm(
      `Deseja realmente restaurar todos os prazos da unidade ${empresaAtiva.nome} para os padrões oficiais do Ministério do Trabalho / CLT?`,
    )
    if (!confirmou) return

    setRestaurando(true)
    try {
      await ExamesService.restaurarPrazosPadroesNormativos(empresaAtiva.id)
      toast({
        title: 'Valores normativos restaurados!',
        description: `Prazos da unidade ${empresaAtiva.nome} redefinidos com sucesso para as normas oficiais vigentes (NR-7, CLT, CONTRAN).`,
      })
      await carregarPrazos()
      if (onPrazosAtualizados) {
        onPrazosAtualizados()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao restaurar padrões',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setRestaurando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Informação contextual sobre a empresa e cálculo de validade */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Prazos de Validade de Exames por Unidade
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
              Os prazos aqui definidos são isolados por empresa ativa (Monteiro
              e SJE podem ter parâmetros distintos). Eles servem como{' '}
              <strong>fallback padrão</strong> para o cálculo de vencimento e
              status de cada colaborador quando o exame individual não
              especificar uma periodicidade customizada.
            </p>
          </div>
        </div>

        {/* Botões de Ação no Topo */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAdministrador ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestaurarPadroes}
                disabled={loading || salvando || restaurando}
                className="text-xs h-9 gap-1.5"
                title="Redefinir para os prazos padrão do Ministério do Trabalho e CONTRAN"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Restaurar Padrões Legais</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSalvar}
                disabled={loading || salvando || restaurando}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
              </Button>
            </>
          ) : (
            <Badge
              variant="outline"
              className="text-xs gap-1.5 py-1 px-3 bg-muted/60 text-muted-foreground border-border/40"
            >
              <Lock className="w-3.5 h-3.5" />
              Somente Administrador pode editar
            </Badge>
          )}
        </div>
      </div>

      {/* Regra de Prioridade do Cálculo */}
      <Alert className="bg-muted/40 border-border/40">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Hierarquia de Prioridade no Cálculo de Vencimentos
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1 space-y-1">
          <p>
            <strong>1. Validade individual informada:</strong> Se um exame
            específico de um funcionário tiver validade própria cadastrada (ex.:
            recomendação médica no prontuário), ela tem precedência máxima.
          </p>
          <p>
            <strong>2. Prazo configurado da unidade (esta tela):</strong> Usado
            como padrão para todos os colaboradores da empresa quando não houver
            ajuste individual.
          </p>
          <p>
            <strong>3. Padrão geral da norma:</strong> Utilizado caso a empresa
            não tenha nenhum registro específico gravado.
          </p>
        </AlertDescription>
      </Alert>

      {/* Grid com os 8 Tipos de Exame do Catálogo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prazos.map((item) => {
          const meses =
            valoresMeses[item.tipo_exame] ??
            (item.tipo_exame === 'demissional' ? 0 : 12)
          const isDemissional = item.tipo_exame === 'demissional'
          const anosEquiv = isDemissional
            ? '0'
            : (meses / 12).toFixed(1).replace('.0', '')
          const defPadrao = TIPOS_EXAME_CATALOGO.find(
            (c) => c.tipo === item.tipo_exame,
          )

          return (
            <Card
              key={item.tipo_exame}
              className={`border-border/40 bg-card/70 hover:border-primary/40 transition-colors shadow-sm ${
                isDemissional ? 'border-sky-500/30 bg-sky-500/[0.02]' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {item.nome_exame}
                      {isDemissional && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30"
                        >
                          Rescisão CLT
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 leading-relaxed">
                      {item.descricao_norma || defPadrao?.descricaoNorma}
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={`font-mono text-xs px-2 py-0.5 shrink-0 ${
                      isDemissional
                        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    {isDemissional
                      ? 'Na Rescisão'
                      : `${meses} meses (${anosEquiv} ${anosEquiv === '1' ? 'ano' : 'anos'})`}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-border/30">
                  <div className="sm:col-span-2 space-y-1">
                    <Label
                      htmlFor={`prazo-${item.tipo_exame}`}
                      className="text-xs font-medium text-foreground flex items-center gap-1.5"
                    >
                      Validade padrão (meses)
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {isDemissional
                          ? '(0 = sem vencimento periódico / na rescisão)'
                          : '(editável)'}
                      </span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`prazo-${item.tipo_exame}`}
                        type="number"
                        min={isDemissional ? 0 : 1}
                        max={120}
                        value={meses !== undefined ? meses : ''}
                        disabled={!isAdministrador || loading || salvando}
                        onChange={(e) =>
                          handleMudarMeses(item.tipo_exame, e.target.value)
                        }
                        className="h-9 text-xs font-mono font-bold w-28"
                      />
                      <span className="text-xs text-muted-foreground">
                        {isDemissional
                          ? 'meses (0 = exame na rescisão)'
                          : 'meses de validade'}
                      </span>
                    </div>
                  </div>

                  {/* Atalhos rápidos para prazos comuns */}
                  {isAdministrador && !isDemissional && (
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMudarMeses(item.tipo_exame, '6')}
                        className={`h-7 px-2 text-[10px] font-mono ${
                          meses === 6
                            ? 'bg-primary/20 text-primary font-bold'
                            : ''
                        }`}
                        title="6 meses (semestral)"
                      >
                        6m
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMudarMeses(item.tipo_exame, '12')}
                        className={`h-7 px-2 text-[10px] font-mono ${
                          meses === 12
                            ? 'bg-primary/20 text-primary font-bold'
                            : ''
                        }`}
                        title="12 meses (anual)"
                      >
                        12m
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMudarMeses(item.tipo_exame, '24')}
                        className={`h-7 px-2 text-[10px] font-mono ${
                          meses === 24
                            ? 'bg-primary/20 text-primary font-bold'
                            : ''
                        }`}
                        title="24 meses (bienal)"
                      >
                        24m
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMudarMeses(item.tipo_exame, '30')}
                        className={`h-7 px-2 text-[10px] font-mono ${
                          meses === 30
                            ? 'bg-primary/20 text-primary font-bold'
                            : ''
                        }`}
                        title="30 meses (2,5 anos - Motoristas)"
                      >
                        30m
                      </Button>
                    </div>
                  )}

                  {isAdministrador && isDemissional && (
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMudarMeses(item.tipo_exame, '0')}
                        className={`h-7 px-2.5 text-[11px] font-mono ${
                          meses === 0
                            ? 'bg-sky-500/20 text-sky-700 dark:text-sky-400 font-bold'
                            : ''
                        }`}
                        title="Sem validade periódica (exame demissional na rescisão)"
                      >
                        0m (Rescisão)
                      </Button>
                    </div>
                  )}
                </div>

                {/* Citação da Norma Oficial */}
                {(item.norma_referencia || defPadrao?.normaReferencia) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-md border border-border/20">
                    <Scale className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      <strong>Base Legal / Norma:</strong>{' '}
                      {item.norma_referencia || defPadrao?.normaReferencia}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Barra de Ação Inferior */}
      {isAdministrador && (
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Alterações salvas serão sincronizadas na tela{' '}
              <strong>Controle de Exames</strong> e na prévia de importação CSV
              da unidade {empresaAtiva?.nome}.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestaurarPadroes}
              disabled={loading || salvando || restaurando}
              className="text-xs h-9 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões
            </Button>
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={loading || salvando || restaurando}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {salvando ? 'Salvando...' : 'Salvar Prazos da Unidade'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
