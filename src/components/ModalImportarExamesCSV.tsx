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
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEmpresa } from '@/hooks/use-empresa'
import {
  parseControleExamesCSV,
  PreviewImportacaoExamesCSV,
} from '@/lib/csv-exames-parser'
import { ExamesService } from '@/services/exames'
import { FuncionarioComExames, TipoExame } from '@/types/exames'

interface ModalImportarExamesCSVProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funcionariosAtuais: FuncionarioComExames[]
  prazosConfigurados?: Record<TipoExame, number>
  onImportadoSucesso: () => void
}

export function ModalImportarExamesCSV({
  open,
  onOpenChange,
  funcionariosAtuais,
  prazosConfigurados,
  onImportadoSucesso,
}: ModalImportarExamesCSVProps) {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [conteudoCsv, setConteudoCsv] = useState<string>('')
  const [preview, setPreview] = useState<PreviewImportacaoExamesCSV | null>(
    null,
  )
  const [processandoPreview, setProcessandoPreview] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Conjunto de CPFs atuais no banco para deduplicação e identificação de updates
  const cpfsCadastrados = new Set(
    funcionariosAtuais
      .map((f) => f.cpf)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setProcessandoPreview(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = (event.target?.result as string) || ''
        setConteudoCsv(text)
        // Se prazosConfigurados não tiver sido passado, busca da empresa ativa
        const prazosAtivos =
          prazosConfigurados ||
          (await ExamesService.getPrazosEmpresa(empresaAtiva?.id))
        const resultado = parseControleExamesCSV(
          text,
          cpfsCadastrados,
          prazosAtivos,
        )
        setPreview(resultado)

        if (resultado.totalFuncionariosValidos === 0) {
          toast({
            title: 'Nenhum funcionário identificado',
            description:
              'Verifique se o arquivo possui colunas como Nome, Função, CPF e Exames.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Arquivo CSV processado com sucesso!',
            description: `${resultado.totalFuncionariosValidos} colaboradores identificados para a unidade ${empresaAtiva?.nome}.`,
          })
        }
      } catch (err: any) {
        toast({
          title: 'Erro ao ler arquivo CSV',
          description: err.message,
          variant: 'destructive',
        })
      } finally {
        setProcessandoPreview(false)
      }
    }

    reader.onerror = () => {
      toast({
        title: 'Falha na leitura',
        description: 'Não foi possível ler o arquivo selecionado.',
        variant: 'destructive',
      })
      setProcessandoPreview(false)
    }

    reader.readAsText(file, 'ISO-8859-1') // Suporta acentos típicos de planilhas Excel em português
  }

  const handleConfirmarImportacao = async () => {
    if (!preview || preview.linhas.length === 0 || !empresaAtiva) return

    setSalvando(true)
    try {
      let inseridos = 0
      let atualizados = 0

      // Importa ou atualiza funcionário a funcionário com seus exames
      for (const linha of preview.linhas) {
        // Busca se funcionário já existe pelo CPF ou pelo nome na empresa
        let funcExistente = linha.cpf
          ? funcionariosAtuais.find((f) => f.cpf === linha.cpf)
          : undefined

        if (!funcExistente) {
          funcExistente = funcionariosAtuais.find(
            (f) =>
              f.nome.trim().toUpperCase() === linha.nome.trim().toUpperCase(),
          )
        }

        const funcionarioSalvo = await ExamesService.salvarFuncionario({
          id: funcExistente?.id,
          empresa_id: empresaAtiva.id,
          nome: linha.nome,
          funcao: linha.funcao,
          cpf: linha.cpf,
          data_admissao: linha.dataAdmissaoIso,
          ativo: true,
        })

        if (funcExistente) {
          atualizados++
        } else {
          inseridos++
        }

        // Salvar exames do colaborador
        const listaExamesParaSalvar = (
          Object.entries(linha.exames) as [
            TipoExame,
            { dataIso: string | null; validadeMeses: number },
          ][]
        ).map(([tipo, dados]) => ({
          tipo_exame: tipo,
          data_realizacao: dados.dataIso,
          validade_meses: dados.validadeMeses,
        }))

        await ExamesService.salvarMultiplosExames(
          empresaAtiva.id,
          funcionarioSalvo.id,
          listaExamesParaSalvar,
        )
      }

      toast({
        title: 'Importação concluída com sucesso!',
        description: `${inseridos} funcionários novos cadastrados e ${atualizados} atualizados na unidade ${empresaAtiva.nome}.`,
      })

      onImportadoSucesso()
      onOpenChange(false)
      resetar()
    } catch (err: any) {
      toast({
        title: 'Erro na importação',
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Importar Planilha de Controle de Exames (ASO)
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
                Carregue o arquivo CSV de exames na unidade ativa. O sistema
                deduplica colaboradores por CPF e calcula automaticamente as
                validades e status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
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
                    Clique para selecionar a planilha CSV ou arraste aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos suportados: CSV (separado por vírgula ou
                    ponto-e-vírgula). Padrão "Controle de Exames SJdoEgito".
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

              {/* Dicas de Formato */}
              <Alert className="bg-primary/5 border-primary/20">
                <HelpCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold text-primary">
                  Formato esperado das colunas
                </AlertTitle>
                <AlertDescription className="text-[11px] text-muted-foreground space-y-1 mt-1">
                  <p>
                    •{' '}
                    <strong>Colaborador / Função / CPF / Data Admissão</strong>:
                    dados cadastrais do funcionário.
                  </p>
                  <p>
                    • <strong>Colunas de Exames</strong>: Exame Admissional,
                    ASO, Acuidade Visual, Audiometria, Avaliação Clínica,
                    Toxicológico, Raio-X (RX) e ECG.
                  </p>
                  <p>
                    • <strong>Datas no padrão brasileiro (dd/mm/aaaa)</strong>.
                    Campos vazios serão marcados automaticamente como{' '}
                    <span className="font-semibold text-muted-foreground">
                      PENDENTE
                    </span>
                    .
                  </p>
                  <p>
                    • <strong>Deduplicação por CPF</strong>: se o CPF já estiver
                    cadastrado na unidade, os exames serão atualizados sem
                    duplicar registros.
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
                      {preview.totalFuncionariosValidos} funcionários prontos
                      para importação
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

              {/* Cards de Métricas do Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Total de Colaboradores
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground mt-1">
                      {preview.totalFuncionariosValidos}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {preview.funcoesDetectadas.length} funções
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Novos Cadastros
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
                      {preview.totalNovos}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Não existiam na empresa
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      Atualizações de Exames
                    </div>
                    <div className="text-xl font-bold font-mono text-cyan-500 mt-1">
                      {preview.totalExistentesAtualizados}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      CPF já registrado
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Deduplicados Planilha
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-500 mt-1">
                      {preview.totalDuplicadosCpfPlanilha}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Linhas repetidas mescladas
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Avisos se houver */}
              {preview.avisos.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Avisos de Deduplicação ({preview.avisos.length})
                  </div>
                  <div className="max-h-24 overflow-y-auto text-[11px] space-y-0.5">
                    {preview.avisos.map((av, idx) => (
                      <p key={idx}>• {av}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela de Preview */}
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 border-b border-border/40 text-xs font-semibold text-muted-foreground">
                  Pré-visualização dos Funcionários e Status Calculado
                </div>
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur z-10">
                      <tr>
                        <th className="py-2 px-3">Funcionário</th>
                        <th className="py-2 px-3">Função</th>
                        <th className="py-2 px-3">CPF</th>
                        <th className="py-2 px-3">Admissão</th>
                        <th className="py-2 px-3">ASO</th>
                        <th className="py-2 px-3">Acuidade</th>
                        <th className="py-2 px-3">Toxicológico</th>
                        <th className="py-2 px-3 text-center">Status Geral</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {preview.linhas.map((linha, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {linha.nome}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {linha.funcao}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {linha.cpfFormatado || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {linha.dataAdmissaoBr || '—'}
                          </td>
                          <td className="py-2 px-3">
                            <BadgeStatus
                              status={linha.exames.aso.status}
                              dataBr={linha.exames.aso.dataBr}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <BadgeStatus
                              status={linha.exames.acuidade_visual.status}
                              dataBr={linha.exames.acuidade_visual.dataBr}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <BadgeStatus
                              status={linha.exames.toxicologico.status}
                              dataBr={linha.exames.toxicologico.dataBr}
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <BadgeStatusGeral status={linha.statusGeralAso} />
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

        <DialogFooter className="mt-2 pt-2 border-t border-border/30">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              resetar()
            }}
            disabled={salvando}
          >
            Cancelar
          </Button>

          {preview && (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmarImportacao}
              disabled={salvando || preview.totalFuncionariosValidos === 0}
              className="bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {salvando
                ? 'Gravando no Banco...'
                : `Confirmar e Importar ${preview.totalFuncionariosValidos} Colaboradores`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BadgeStatus({
  status,
  dataBr,
}: {
  status: 'VENCIDO' | 'NO_PRAZO' | 'PENDENTE' | 'NA_RESCISAO'
  dataBr: string | null
}) {
  if (status === 'NA_RESCISAO') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-sky-700 dark:text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        {dataBr || 'Na Rescisão'}
      </span>
    )
  }
  if (status === 'VENCIDO') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
        {dataBr || 'Vencido'}
      </span>
    )
  }
  if (status === 'NO_PRAZO') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {dataBr || 'No Prazo'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
      Pendente
    </span>
  )
}

function BadgeStatusGeral({
  status,
}: {
  status: 'VENCIDO' | 'NO_PRAZO' | 'PENDENTE' | 'NA_RESCISAO'
}) {
  if (status === 'NA_RESCISAO') {
    return (
      <Badge
        variant="outline"
        className="text-[10px] uppercase font-semibold text-sky-700 dark:text-sky-400 border-sky-500/40 bg-sky-500/10"
      >
        Na Rescisão
      </Badge>
    )
  }
  if (status === 'VENCIDO') {
    return (
      <Badge
        variant="destructive"
        className="text-[10px] uppercase font-bold tracking-wider"
      >
        Vencido
      </Badge>
    )
  }
  if (status === 'NO_PRAZO') {
    return (
      <Badge className="text-[10px] uppercase font-bold tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white">
        No Prazo
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="text-[10px] uppercase font-semibold text-muted-foreground"
    >
      Pendente
    </Badge>
  )
}
