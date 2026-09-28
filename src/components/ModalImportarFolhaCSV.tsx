import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  HelpCircle,
  RefreshCw,
  TrendingDown,
  Layers,
  Briefcase,
  UserCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import {
  parseFolhaPagamentoCSV,
  PreviewImportacaoFolhaCSV,
} from "@/lib/csv-folha-parser"
import { FolhaService } from "@/services/folha"
import { FolhaPagamentoLinha } from "@/types/folha"

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
  const [conteudoCsv, setConteudoCsv] = useState<string>("")
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<string>(
    competenciaAtiva || "2026-09",
  )
  const [preview, setPreview] = useState<PreviewImportacaoFolhaCSV | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Nomes cadastrados no banco para indicar atualização
  const nomesCadastrados = new Set(
    linhasAtuais.map((l) => l.nome.trim().toUpperCase()),
  )

  const resetar = () => {
    setArquivoNome(null)
    setConteudoCsv("")
    setPreview(null)
    setSalvando(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleProcessarArquivo = (
    text: string,
    nome: string,
    compOverride?: string,
  ) => {
    try {
      const compAlvo = compOverride || competenciaSelecionada
      const resultado = parseFolhaPagamentoCSV(
        text,
        nome,
        compAlvo,
        nomesCadastrados,
      )
      setPreview(resultado)
      if (resultado.competenciaSugerida && !compOverride) {
        setCompetenciaSelecionada(resultado.competenciaSugerida)
      }

      if (resultado.totalColaboradoresValidos === 0) {
        toast({
          title: "Nenhum colaborador identificado",
          description:
            "Verifique se o arquivo possui colunas com Tipo, Nome e valores salariais.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Arquivo da folha processado com sucesso!",
          description: `${resultado.totalFuncionarios} funcionários e ${resultado.totalTerceiros} terceiros na prévia (${compAlvo}).`,
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro ao processar folha",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string || ""
      setConteudoCsv(text)
      handleProcessarArquivo(text, file.name)
    }

    reader.onerror = () => {
      toast({
        title: "Falha na leitura",
        description: "Não foi possível ler o arquivo selecionado.",
        variant: "destructive",
      })
    }

    reader.readAsText(file, "UTF-8")
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
        title: "Folha gravada com sucesso!",
        description: `${res.totalInseridos} inseridos e ${res.totalAtualizados} atualizados na empresa ativa (${empresaAtiva.nome}).`,
      })

      onImportadoSucesso(competenciaSelecionada)
      onOpenChange(false)
      resetar()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar folha no banco",
        description: err.message,
        variant: "destructive",
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
                    Empresa Ativa: {empresaAtiva.nome}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Carregue o CSV da folha mensal. Aceita o padrão real GC MIX (com
                distinção de Funcionário e Terceiro). A Unidade do CSV é
                informativa; a gravação ocorre na <strong>Empresa Ativa</strong>
                .
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Seletor de Competência */}
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

          {/* Área de Seleção de Arquivo */}
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
                    Clique para selecionar o arquivo CSV da folha ou arraste
                    aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato aceito: CSV com separador ponto-e-vírgula (;) ou
                    vírgula (,), números brasileiros ou decimais comuns.
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

              {/* Informações sobre o cabeçalho oficial */}
              <Alert className="bg-primary/5 border-primary/20">
                <HelpCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold text-primary">
                  Estrutura Oficial do Cabeçalho
                </AlertTitle>
                <AlertDescription className="text-[11px] text-muted-foreground space-y-1.5 mt-1 font-mono">
                  <p className="p-1.5 bg-background/60 rounded border border-border/40 text-[10px] break-all">
                    Tipo;Nome;Funcao;Unidade;Bruto;Filhos;INSS;Familia;IR;Quinzena;Adiantamento;Gratificacao;MensalLiquido;Producao;Comissao;Conta;PIX
                  </p>
                  <p className="font-sans text-[11px]">
                    • <strong>Tipo:</strong> Funcionario ou Terceiro (Terceiros
                    não possuem Bruto/INSS).
                  </p>
                  <p className="font-sans text-[11px]">
                    • <strong>Deduplicação Inteligente:</strong> Ao reimportar,
                    registros com mesmo nome na mesma competência são
                    atualizados.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header do preview com arquivo lido */}
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
                      Competência: <strong>{competenciaSelecionada}</strong> •{" "}
                      {preview.totalColaboradoresValidos} colaboradores (
                      {preview.totalFuncionarios} funcionários +{" "}
                      {preview.totalTerceiros} terceiros)
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

              {/* Cards de Métricas da Prévia */}
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
                      {preview.totalFuncionarios} Func. |{" "}
                      {preview.totalTerceiros} Terc.
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Total Bruto
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      R${" "}
                      {preview.totais.totalBruto.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Salários Brutos
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      INSS + IR
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                      R${" "}
                      {(
                        preview.totais.totalInss + preview.totais.totalIr
                      ).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      INSS: R$ {preview.totais.totalInss.toFixed(2)} | IR: R${" "}
                      {preview.totais.totalIr.toFixed(2)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-primary/40 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="text-[10px] font-semibold text-primary uppercase flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      Líquido a Pagar
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-1">
                      R${" "}
                      {preview.totais.totalMensalLiquido.toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Total somatório final
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Avisos */}
              {preview.avisos.length > 0 && (
                <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-xs font-semibold">
                    Avisos de Validação ({preview.avisos.length})
                  </AlertTitle>
                  <AlertDescription className="text-[11px] mt-1 max-h-24 overflow-y-auto space-y-1">
                    {preview.avisos.map((av, idx) => (
                      <p key={idx}>• {av}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Tabela de Prévia */}
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 border-b border-border/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Prévia dos Registros a Gravar ({preview.linhas.length})
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {preview.totalNovos} novos •{" "}
                    {preview.totalExistentesAtualizados} já cadastrados
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/20 text-[10px] uppercase font-bold text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5">Tipo</th>
                        <th className="py-2 px-2.5">Nome</th>
                        <th className="py-2 px-2.5">Função</th>
                        <th className="py-2 px-2.5 text-right">Bruto</th>
                        <th className="py-2 px-2.5 text-right">INSS</th>
                        <th className="py-2 px-2.5 text-right">Quinzena</th>
                        <th className="py-2 px-2.5 text-right">Produção</th>
                        <th className="py-2 px-2.5 text-right font-bold text-foreground">
                          Líquido
                        </th>
                        <th className="py-2 px-2.5">PIX / Conta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono text-[11px]">
                      {preview.linhas.map((l) => (
                        <tr
                          key={l.linhaIndex}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2 px-2.5 font-sans">
                            {l.tipo === "Terceiro" ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold"
                              >
                                Terceiro
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]"
                              >
                                Func.
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-sans font-semibold text-foreground">
                            {l.nome}
                          </td>
                          <td className="py-2 px-2.5 font-sans text-muted-foreground text-[10px]">
                            {l.funcao}
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            {l.bruto > 0 ? l.bruto.toFixed(2) : "—"}
                          </td>
                          <td className="py-2 px-2.5 text-right text-rose-500">
                            {l.inss > 0 ? l.inss.toFixed(2) : "—"}
                          </td>
                          <td className="py-2 px-2.5 text-right text-muted-foreground">
                            {l.quinzena > 0 ? l.quinzena.toFixed(2) : "—"}
                          </td>
                          <td className="py-2 px-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {l.producao > 0 ? l.producao.toFixed(2) : "—"}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-foreground">
                            {l.mensal_liquido.toFixed(2)}
                          </td>
                          <td className="py-2 px-2.5 text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {l.pix || l.conta || "—"}
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
                Total a gravar na empresa{" "}
                <strong className="text-foreground">
                  {empresaAtiva?.nome}
                </strong>
                : <strong>{preview.linhas.length} colaboradores</strong>
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
                    Gravar Folha ({competenciaSelecionada})
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
