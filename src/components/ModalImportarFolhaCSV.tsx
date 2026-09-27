import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  HelpCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEmpresa } from '@/hooks/use-empresa'
import {
  parseFolhaPagamentoCSV,
  PreviewImportacaoFolhaCSV,
} from '@/lib/csv-folha-parser'
import { FolhaService } from '@/services/folha'
import { FolhaPagamentoLinha } from '@/types/folha'

interface ModalImportarFolhaCSVProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linhasAtuais: FolhaPagamentoLinha[]
  competenciaAtiva: string
  onImportadoSucesso: (competenciaSalva: string) => void
}

export function ModalImportarFolhaCSV({
  open,
  onOpenChange,
  linhasAtuais,
  competenciaAtiva,
  onImportadoSucesso,
}: ModalImportarFolhaCSVProps) {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [conteudoCsv, setConteudoCsv] = useState<string>('')
  const [competenciaSelecionada, setCompetenciaSelecionada] =
    useState<string>(competenciaAtiva || '2026-09')
  const [preview, setPreview] = useState<PreviewImportacaoFolhaCSV | null>(null)
  const [processandoPreview, setProcessandoPreview] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Conjunto de CPFs atuais no banco para indicar se serão atualizados ou novos
  const cpfsCadastrados = new Set(
    linhasAtuais
      .map((l) => l.cpf)
      .filter((cpf): cpf is string => Boolean(cpf)),
  )

  const resetar = () => {
    setArquivoNome(null)
    setConteudoCsv('')
    setPreview(null)
    setProcessandoPreview(false)
    setSalvando(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleProcessarArquivo = (text: string, nome: string, compOverride?: string) => {
    try {
      const compAlvo = compOverride || competenciaSelecionada
      const resultado = parseFolhaPagamentoCSV(
        text,
        nome,
        compAlvo,
        cpfsCadastrados,
      )
      setPreview(resultado)
      if (resultado.competenciaSugerida && !compOverride) {
        setCompetenciaSelecionada(resultado.competenciaSugerida)
      }

      if (resultado.totalColaboradoresValidos === 0) {
        toast({
          title: 'Nenhum colaborador identificado',
          description:
            'Verifique se o arquivo possui colunas com Nome e valores salariais.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Arquivo de folha processado!',
          description: `${resultado.totalColaboradoresValidos} colaboradores identificados para competência ${compAlvo}.`,
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao processar folha',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setProcessandoPreview(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setProcessandoPreview(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = (event.target?.result as string) || ''
      setConteudoCsv(text)
      handleProcessarArquivo(text, file.name)
    }

    reader.onerror = () => {
      toast({
        title: 'Falha na leitura',
        description: 'Não foi possível ler o arquivo selecionado.',
        variant: 'destructive',
      })
      setProcessandoPreview(false)
    }

    reader.readAsText(file, 'ISO-8859-1')
  }

  const handleCompetenciaChange = (novaComp: string) => {
    setCompetenciaSelecionada(novaComp)
    if (conteudoCsv && arquivoNome) {
      handleProcessarArquivo(conteudoCsv, arquivoNome, novaComp)
    }
  }

  const handleConfirmarImportacao = async () => {
    if (!preview || preview.linhas.length === 0 || !empresaAtiva) return

    setSalvando(true)
    try {
      const res = await FolhaService.salvarImportacaoFolha(
        empresaAtiva.id,
        competenciaSelecionada,
        preview.linhas,
      )

      toast({
        title: 'Folha de pagamento importada com sucesso!',
        description: `${res.totalInseridos} colaboradores inseridos e ${res.totalAtualizados} atualizados na competência ${competenciaSelecionada} (${empresaAtiva.nome}).`,
      })

      onImportadoSucesso(competenciaSelecionada)
      onOpenChange(false)
      resetar()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar folha',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!salvando) {
          onOpenChange(v)
          if (!v) resetar()
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Importar Folha de Pagamento (CSV)
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
                Carregue o CSV da folha mensal. O sistema deduplica por CPF ou
                matrícula, discrimina bases e calcula proventos e descontos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Campo de Competência */}
          <div className="p-3 bg-card/60 rounded-xl border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <Label className="text-xs font-semibold text-foreground">
                Competência da Folha (Ano-Mês):
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={competenciaSelecionada}
                onChange={(e) => handleCompetenciaChange(e.target.value)}
                className="h-8 w-40 text-xs font-mono font-bold"
              />
              <span className="text-[11px] text-muted-foreground">
                Ex: 2026-09
              </span>
            </div>
          </div>

          {/* Caixa de Upload */}
          {!preview ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-8 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Clique para selecionar o arquivo CSV da folha ou arraste aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Compatível com o modelo "folha-2026-09.csv", exportações de ERP
                    ou planilhas com separadores vírgula e ponto-e-vírgula.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Instruções */}
              <Alert className="bg-primary/5 border-primary/20">
                <HelpCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold text-primary">
                  Regras e Colunas Reconhecidas
                </AlertTitle>
                <AlertDescription className="text-[11px] text-muted-foreground space-y-1 mt-1">
                  <p>
                    • <strong>Identificação:</strong> Nome, CPF, Matrícula, Cargo/Função,
                    Setor/Departamento, Data de Admissão.
                  </p>
                  <p>
                    • <strong>Proventos:</strong> Salário Base, Horas Extras,
                    Periculosidade, Insalubridade, Noturno, Gratificações, DSR.
                  </p>
                  <p>
                    • <strong>Descontos:</strong> INSS, IRRF, Vale Transporte,
                    Vale Refeição, Adiantamentos/Vales, Faltas.
                  </p>
                  <p>
                    • <strong>Deduplicação Inteligente:</strong> Ao importar a
                    mesma competência novamente, colaboradores existentes têm seus
                    valores atualizados sem duplicação de registros.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo do Arquivo Carregado */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {arquivoNome}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Competência: <strong>{competenciaSelecionada}</strong> •{' '}
                      {preview.totalColaboradoresValidos} colaboradores lidos
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetar}
                  className="text-xs gap-1.5 h-8"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Trocar Arquivo
                </Button>
              </div>

              {/* Cards de Métricas Financeiras do Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Colaboradores
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground mt-1">
                      {preview.totalColaboradoresValidos}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {preview.cargosDetectados.length} cargos distintos
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Total Proventos
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      R${' '}
                      {preview.totais.totalProventos.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Salários + adicionais
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      Total Descontos
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                      R${' '}
                      {preview.totais.totalDescontos.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      INSS, IRRF e adiantamentos
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-500" />
                      Total Líquido
                    </div>
                    <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
                      R${' '}
                      {preview.totais.totalLiquido.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Líquido a pagar
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Avisos de Deduplicação se houver */}
              {preview.avisos.length > 0 && (
                <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-xs font-semibold">
                    Avisos de Deduplicação na Planilha ({preview.avisos.length})
                  </AlertTitle>
                  <AlertDescription className="text-[11px] mt-1 max-h-24 overflow-y-auto space-y-1">
                    {preview.avisos.map((av, idx) => (
                      <p key={idx}>• {av}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Tabela de Prévia das Linhas Identificadas */}
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 border-b border-border/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Prévia dos Colaboradores ({preview.linhas.length})
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {preview.totalNovos} novos •{' '}
                    {preview.totalExistentesAtualizados} já cadastrados
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/20 text-[10px] uppercase font-bold text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Nome / Cargo</th>
                        <th className="py-2 px-3">CPF</th>
                        <th className="py-2 px-3 text-right">Sal. Base</th>
                        <th className="py-2 px-3 text-right">Proventos</th>
                        <th className="py-2 px-3 text-right">Descontos</th>
                        <th className="py-2 px-3 text-right">Líquido</th>
                        <th className="py-2 px-3 text-right">FGTS Mês</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {preview.linhas.map((l) => (
                        <tr
                          key={l.linhaIndex}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2 px-3 text-[11px] font-mono text-muted-foreground">
                            {l.linhaIndex}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-foreground block">
                              {l.nome}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {l.cargo}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                            {l.cpfFormatado || '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            R${' '}
                            {l.salario_base.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            R${' '}
                            {l.total_proventos.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                            R${' '}
                            {l.total_descontos.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                            R${' '}
                            {l.salario_liquido.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground text-[11px]">
                            R${' '}
                            {l.fgts_mes.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border/30 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {preview && (
              <span>
                Total a gravar:{' '}
                <strong className="text-foreground">
                  {preview.linhas.length} colaboradores
                </strong>{' '}
                na competência{' '}
                <strong className="text-primary">
                  {competenciaSelecionada}
                </strong>
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>

            {preview && preview.linhas.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmarImportacao}
                disabled={salvando}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                {salvando ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Gravando Folha...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Gravar Folha no Sistema
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
