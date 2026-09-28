import { useState, useRef } from "react"
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useEmpresa } from "@/hooks/use-empresa"
import { useToast } from "@/hooks/use-toast"
import { FolhaService } from "@/services/folha"

interface AbaBackupFolhaProps {
  competenciaAtiva: string
  competenciasDisponiveis: string[]
  onRestauraçãoConcluida: () => void
}

export function AbaBackupFolha({
  competenciaAtiva,
  competenciasDisponiveis,
  onRestauraçãoConcluida,
}: AbaBackupFolhaProps) {
  const { empresaAtiva } = useEmpresa()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de exportação
  const [exportandoJson, setExportandoJson] = useState(false)
  const [exportandoCsv, setExportandoCsv] = useState(false)
  const [escopoCsv, setEscopoCsv] = useState<string>("competencia_ativa")

  // Estados de importação / restauração
  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [lendoArquivo, setLendoArquivo] = useState(false)
  const [dadosAnalisados, setDadosAnalisados] =
    useState<ReturnType<typeof FolhaService.analisarBackupJson> | null>(null)
  const [modoRestauracao, setModoRestauracao] =
    useState<"mesclar" | "substituir">("mesclar")
  const [restaurarCadastros, setRestaurarCadastros] = useState(true)
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)
  const [executandoRestauracao, setExecutandoRestauracao] = useState(false)
  const [resultadoRestauracao, setResultadoRestauracao] = useState<{
    competenciasAfetadas: number
    linhasInseridas: number
    linhasAtualizadas: number
    linhasExcluidas: number
  } | null>(null)

  // Download utilitário no browser
  const baixarArquivo = (
    conteudo: string,
    nomeArquivo: string,
    tipoMime: string,
  ) => {
    const blob = new Blob([conteudo], { type: tipoMime })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 1. Exportar JSON Completo
  const handleExportarJson = async () => {
    if (!empresaAtiva?.id) {
      toast({
        title: "Empresa não selecionada",
        description: "Selecione uma empresa ativa antes de exportar.",
        variant: "destructive",
      })
      return
    }

    setExportandoJson(true)
    try {
      const dataIso = new Date().toISOString().split("T")[0]
      const slugEmpresa = (empresaAtiva.slug || empresaAtiva.nome || "empresa")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")

      const backupData = await FolhaService.exportarBackupCompleto(
        empresaAtiva.id,
        empresaAtiva.nome,
      )

      const jsonString = JSON.stringify(backupData, null, 2)
      const nomeArquivo = `backup-folha-${slugEmpresa}-${dataIso}.json`

      baixarArquivo(jsonString, nomeArquivo, "application/json;charset=utf-8;")

      toast({
        title: "Backup JSON gerado com sucesso!",
        description: `Exportadas ${backupData.metadata.contagem.competencias} competências e ${backupData.metadata.contagem.linhas} linhas da folha (${empresaAtiva.nome}).`,
      })
    } catch (err: any) {
      console.error("Erro ao exportar backup JSON:", err)
      toast({
        title: "Erro ao exportar backup",
        description: err.message || "Falha ao gerar o arquivo de backup JSON.",
        variant: "destructive",
      })
    } finally {
      setExportandoJson(false)
    }
  }

  // 2. Exportar CSV da Folha Geral
  const handleExportarCsv = async () => {
    if (!empresaAtiva?.id) return

    setExportandoCsv(true)
    try {
      const compAlvo =
        escopoCsv === "competencia_ativa" ? competenciaAtiva : undefined
      const dataIso = new Date().toISOString().split("T")[0]
      const slugEmpresa = (empresaAtiva.slug || empresaAtiva.nome || "empresa")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")

      const csvContent = await FolhaService.exportarGeralCSV(
        empresaAtiva.id,
        compAlvo,
      )

      const sufixoComp = compAlvo ? `-${compAlvo}` : "-todas-competencias"
      const nomeArquivo = `folha-geral-${slugEmpresa}${sufixoComp}-${dataIso}.csv`

      baixarArquivo(csvContent, nomeArquivo, "text/csv;charset=utf-8;")

      toast({
        title: "Backup CSV gerado com sucesso!",
        description: `Arquivo CSV da folha geral gerado (${
          compAlvo ? `competência ${compAlvo}` : "todas as competências"
        }).`,
      })
    } catch (err: any) {
      console.error("Erro ao exportar CSV:", err)
      toast({
        title: "Erro ao exportar CSV",
        description: err.message || "Falha ao gerar arquivo CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  // 3. Processar upload de arquivo JSON de backup
  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setLendoArquivo(true)
    setResultadoRestauracao(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)

        // Carrega funcionários atuais da empresa ativa para prévia
        const funcs = await FolhaService.getLinhasCompetencia(
          empresaAtiva?.id || "",
          competenciaAtiva,
        )

        const resultadoAnalise = FolhaService.analisarBackupJson(
          parsed,
          empresaAtiva?.id || "",
          empresaAtiva?.nome || "",
          funcs || [],
        )

        setDadosAnalisados(resultadoAnalise)

        if (!resultadoAnalise.valido) {
          toast({
            title: "Arquivo inválido",
            description:
              resultadoAnalise.mensagemErro ||
              "Não foi possível identificar competências ou linhas de folha.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Backup analisado com sucesso",
            description: `${resultadoAnalise.totalCompetencias} competências e ${resultadoAnalise.totalLinhas} linhas identificadas.`,
          })
        }
      } catch (err: any) {
        console.error("Erro ao ler JSON:", err)
        toast({
          title: "Erro na leitura do JSON",
          description:
            "O arquivo selecionado não contém um formato JSON válido.",
          variant: "destructive",
        })
        setDadosAnalisados(null)
      } finally {
        setLendoArquivo(false)
      }
    }

    reader.onerror = () => {
      toast({
        title: "Erro na leitura",
        description: "Não foi possível carregar o arquivo do disco.",
        variant: "destructive",
      })
      setLendoArquivo(false)
    }

    reader.readAsText(file, "UTF-8")
  }

  const limparArquivoSelecionado = () => {
    setArquivoNome(null)
    setDadosAnalisados(null)
    setResultadoRestauracao(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 4. Iniciar processo de restauração
  const handleCliqueRestaurar = () => {
    if (!dadosAnalisados || !dadosAnalisados.valido) return
    // Abre modal de confirmação obrigatória
    setModalConfirmacaoAberto(true)
  }

  // 5. Execução efetiva após confirmação no modal
  const handleConfirmarRestauracao = async () => {
    if (!dadosAnalisados || !empresaAtiva?.id) return

    setExecutandoRestauracao(true)
    try {
      const res = await FolhaService.restaurarBackupFolha(
        empresaAtiva.id,
        modoRestauracao,
        dadosAnalisados,
        restaurarCadastros,
      )

      setResultadoRestauracao(res)
      setModalConfirmacaoAberto(false)

      toast({
        title: "Restauração concluída com sucesso!",
        description: `${res.linhasInseridas} inseridas, ${res.linhasAtualizadas} atualizadas${
          modoRestauracao === "substituir"
            ? `, ${res.linhasExcluidas} removidas`
            : ""
        } em ${res.competenciasAfetadas} competência(s).`,
      })

      // Notifica a tela pai para recarregar competências e dados atuais
      onRestauraçãoConcluida()
    } catch (err: any) {
      console.error("Erro ao restaurar backup:", err)
      toast({
        title: "Falha na restauração",
        description:
          err.message || "Ocorreu um erro ao gravar os dados do backup.",
        variant: "destructive",
      })
    } finally {
      setExecutandoRestauracao(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA ABA BACKUP */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-muted/40 rounded-xl border border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Backup e Restauração da Folha de Pagamento
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gere cópias de segurança completas da folha da empresa ativa ou
            restaure dados de backups anteriores (incluindo o formato legado GC
            MIX).
          </p>
        </div>

        {empresaAtiva && (
          <Badge
            variant="outline"
            className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/30"
          >
            Empresa Ativa: {empresaAtiva.nome}
          </Badge>
        )}
      </div>

      {/* GRID DE DUAS COLUNAS: GERAR BACKUP (EXPORTAR) E RESTAURAR (IMPORTAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================================================
            COLUNA 1: GERAR BACKUP (EXPORTAR)
        ========================================================================== */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    1. Gerar Backup (Exportar)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Exportação integral dos dados da folha da empresa ativa.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Opção 1: Backup Completo JSON */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <FileJson className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Backup Completo em JSON (Recomendado)
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Exporta TUDO da folha da empresa ativa: todas as
                        competências cadastradas, linhas com todos os
                        componentes (bruto, inss, irrf, família, quinzena,
                        adiantamento, gratificação, produção, obras, limpeza,
                        sábado, férias, ajuda de custo, vendas, comissão,
                        líquidos, contas/PIX, observações, flags) + cadastro de
                        funcionários e terceiros.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-muted-foreground bg-background/80 p-2 rounded border border-border/40">
                  Nome sugerido:{" "}
                  <span className="text-primary font-semibold">
                    backup-folha-
                    {(empresaAtiva?.slug || empresaAtiva?.nome || "empresa")
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-")}
                    -{new Date().toISOString().split("T")[0]}.json
                  </span>
                </div>

                <Button
                  onClick={handleExportarJson}
                  disabled={exportandoJson || !empresaAtiva}
                  className="w-full gap-2 text-xs h-9 font-semibold"
                >
                  {exportandoJson ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Gerando Backup JSON...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Baixar Backup JSON Completo
                    </>
                  )}
                </Button>
              </div>

              {/* Opção 2: Exportar Folha Geral em CSV */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-start gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Baixar Backup CSV (Aba Geral)
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Exporta as linhas da aba Geral com todas as colunas no
                      mesmo formato aceito pelo importador CSV existente
                      (Tipo;Nome;Funcao;Bruto;Filhos...).
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-medium">
                    Escopo da exportação CSV:
                  </Label>
                  <Select value={escopoCsv} onValueChange={setEscopoCsv}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="competencia_ativa">
                        Somente a competência ativa ({competenciaAtiva})
                      </SelectItem>
                      <SelectItem value="todas_competencias">
                        Todas as competências da empresa ativa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={handleExportarCsv}
                  disabled={exportandoCsv || !empresaAtiva}
                  className="w-full gap-2 text-xs h-9 font-semibold"
                >
                  {exportandoCsv ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Gerando CSV...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Baixar Backup CSV
                    </>
                  )}
                </Button>
              </div>

              {/* Informação sobre segurança e escopo */}
              <Alert className="bg-primary/5 border-primary/20 py-2.5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed">
                  Os backups gerados respeitam estritamente a{" "}
                  <strong>empresa ativa</strong> selecionada no topo do sistema
                  ({empresaAtiva?.nome || "—"}), mantendo total isolamento entre
                  unidades concreteiras.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            COLUNA 2: RESTAURAR (IMPORTAR)
        ========================================================================== */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    2. Restaurar (Importar)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Restaura competências e linhas a partir de um backup JSON.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Área de Seleção de Arquivo */}
              {!dadosAnalisados ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-2.5"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">
                      Clique para selecionar o arquivo de backup (.json)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Aceita tanto o backup gerado por esta aba quanto o backup
                      do sistema legado (backup-folha-*.json).
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleArquivoSelecionado}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Arquivo Selecionado */}
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/60">
                    <div className="flex items-center gap-2.5">
                      <FileJson className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {arquivoNome}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Empresa no arquivo:{" "}
                          <strong>{dadosAnalisados.empresaArquivo}</strong>{" "}
                          {dadosAnalisados.geradoEm && (
                            <>
                              • Gerado em:{" "}
                              {new Date(
                                dadosAnalisados.geradoEm,
                              ).toLocaleDateString("pt-BR")}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={limparArquivoSelecionado}
                      className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Trocar
                    </Button>
                  </div>

                  {/* PRÉVIA DOS DADOS DO BACKUP */}
                  <div className="p-3 bg-card rounded-lg border border-border/60 space-y-3">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Prévia do Conteúdo do Arquivo
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/40 p-2 rounded border border-border/40">
                        <div className="text-[10px] text-muted-foreground">
                          Competências
                        </div>
                        <div className="text-base font-bold font-mono text-foreground">
                          {dadosAnalisados.totalCompetencias}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-2 rounded border border-border/40">
                        <div className="text-[10px] text-muted-foreground">
                          Linhas da Folha
                        </div>
                        <div className="text-base font-bold font-mono text-primary">
                          {dadosAnalisados.totalLinhas}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-2 rounded border border-border/40">
                        <div className="text-[10px] text-muted-foreground">
                          Funcionários
                        </div>
                        <div className="text-base font-bold font-mono text-foreground">
                          {dadosAnalisados.totalFuncionariosCadastro}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-2 rounded border border-border/40">
                        <div className="text-[10px] text-muted-foreground">
                          Terceiros
                        </div>
                        <div className="text-base font-bold font-mono text-foreground">
                          {dadosAnalisados.totalTerceirosCadastro}
                        </div>
                      </div>
                    </div>

                    {/* Lista resumida de competências encontradas */}
                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Competências contidas no arquivo (
                        {dadosAnalisados.competenciasLista.length}):
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-muted/20 rounded border border-border/40">
                        {dadosAnalisados.competenciasLista.map((c) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="text-[10px] font-mono px-1.5 py-0"
                          >
                            {c} ({dadosAnalisados.linhasPorCompetencia[c] || 0}{" "}
                            lin)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Avisos identificados */}
                    {dadosAnalisados.avisos.length > 0 && (
                      <Alert className="bg-amber-500/10 border-amber-500/30 py-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                          Avisos de Prévia
                        </AlertTitle>
                        <AlertDescription className="text-[11px] text-amber-900 dark:text-amber-300 space-y-1 mt-1">
                          {dadosAnalisados.avisos.map((av, idx) => (
                            <p key={idx}>• {av}</p>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* ESCOLHA DO MODO DE RESTAURAÇÃO */}
                  <div className="p-3.5 bg-muted/30 rounded-lg border border-border/60 space-y-3">
                    <Label className="text-xs font-bold text-foreground block">
                      Modo de Restauração:
                    </Label>

                    <RadioGroup
                      value={modoRestauracao}
                      onValueChange={(v: any) => setModoRestauracao(v)}
                      className="space-y-2"
                    >
                      <div className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-muted/50 border border-transparent has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                        <RadioGroupItem
                          value="mesclar"
                          id="modo-mesclar"
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="modo-mesclar"
                          className="cursor-pointer space-y-0.5"
                        >
                          <span className="text-xs font-bold text-foreground block">
                            Mesclar (atualizar existentes)
                          </span>
                          <span className="text-[11px] text-muted-foreground block font-normal">
                            Atualiza registros com mesmo nome na mesma
                            competência e insere novos. Preserva linhas
                            existentes que não conflitarem.
                          </span>
                        </Label>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-muted/50 border border-transparent has-[:checked]:border-destructive/40 has-[:checked]:bg-destructive/5">
                        <RadioGroupItem
                          value="substituir"
                          id="modo-substituir"
                          className="mt-0.5 text-destructive"
                        />
                        <Label
                          htmlFor="modo-substituir"
                          className="cursor-pointer space-y-0.5"
                        >
                          <span className="text-xs font-bold text-destructive block">
                            Substituir competências do backup
                          </span>
                          <span className="text-[11px] text-muted-foreground block font-normal">
                            Apaga todas as linhas existentes das competências
                            contidas no arquivo (apenas da empresa ativa:{" "}
                            {empresaAtiva?.nome}) e reinsere exatamente as do
                            backup.
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Opção para restaurar também cadastros */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-border/40">
                      <Checkbox
                        id="restaurar-cadastros"
                        checked={restaurarCadastros}
                        onCheckedChange={(c) =>
                          setRestaurarCadastros(Boolean(c))
                        }
                      />
                      <Label
                        htmlFor="restaurar-cadastros"
                        className="text-xs font-medium cursor-pointer text-foreground"
                      >
                        Sincronizar também cadastros de funcionários e terceiros
                        do arquivo
                      </Label>
                    </div>
                  </div>

                  {/* BOTÃO DE RESTAURAR (DISPARA CONFIRMAÇÃO) */}
                  <Button
                    onClick={handleCliqueRestaurar}
                    disabled={executandoRestauracao || !dadosAnalisados.valido}
                    variant={
                      modoRestauracao === "substituir"
                        ? "destructive"
                        : "default"
                    }
                    className="w-full gap-2 text-xs h-10 font-bold"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {modoRestauracao === "substituir"
                      ? "Continuar e Substituir Competências..."
                      : "Executar Restauração (Mesclar)..."}
                  </Button>
                </div>
              )}

              {/* FEEDBACK DE SUCESSO APÓS RESTAURAÇÃO */}
              {resultadoRestauracao && (
                <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-xs font-bold">
                    Restauração Realizada com Sucesso!
                  </AlertTitle>
                  <AlertDescription className="text-[11px] mt-1 space-y-1">
                    <p>
                      •{" "}
                      <strong>
                        {resultadoRestauracao.competenciasAfetadas}
                      </strong>{" "}
                      competências processadas na empresa {empresaAtiva?.nome}.
                    </p>
                    <p>
                      • <strong>{resultadoRestauracao.linhasInseridas}</strong>{" "}
                      linhas inseridas.
                    </p>
                    <p>
                      •{" "}
                      <strong>{resultadoRestauracao.linhasAtualizadas}</strong>{" "}
                      linhas atualizadas.
                    </p>
                    {resultadoRestauracao.linhasExcluidas > 0 && (
                      <p>
                        •{" "}
                        <strong>{resultadoRestauracao.linhasExcluidas}</strong>{" "}
                        linhas anteriores substituídas.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO OBRIGATÓRIA ANTES DA RESTAURAÇÃO
      ========================================================================== */}
      <AlertDialog
        open={modalConfirmacaoAberto}
        onOpenChange={(open) => {
          if (!executandoRestauracao) setModalConfirmacaoAberto(open)
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <ShieldAlert className="w-5 h-5" />
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Confirmar Restauração da Folha
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs space-y-2 text-muted-foreground">
              <p>
                Você está prestes a restaurar dados na empresa ativa:{" "}
                <strong className="text-foreground">
                  {empresaAtiva?.nome}
                </strong>
                .
              </p>

              {modoRestauracao === "substituir" ? (
                <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1 font-medium">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    ATENÇÃO: MODO SUBSTITUIR
                  </p>
                  <p>
                    Todas as linhas atualmente cadastradas nas seguintes
                    competências serão <strong>APAGADAS</strong> e substituídas
                    pelas do arquivo:
                  </p>
                  <p className="font-mono text-[11px]">
                    {dadosAnalisados?.competenciasLista.join(", ")}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded bg-primary/10 border border-primary/30 text-foreground text-xs space-y-1">
                  <p className="font-bold">MODO MESCLAR:</p>
                  <p>
                    Os colaboradores existentes nas competências do arquivo
                    serão atualizados por nome e novos colaboradores serão
                    adicionados, mantendo o histórico intacto.
                  </p>
                </div>
              )}

              <p className="text-[11px]">
                Total de linhas a processar:{" "}
                <strong className="text-foreground">
                  {dadosAnalisados?.totalLinhas}
                </strong>{" "}
                em{" "}
                <strong className="text-foreground">
                  {dadosAnalisados?.totalCompetencias}
                </strong>{" "}
                competências. Deseja prosseguir?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={executandoRestauracao}
              className="text-xs h-9"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmarRestauracao()
              }}
              disabled={executandoRestauracao}
              className={`text-xs h-9 font-bold ${
                modoRestauracao === "substituir"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }`}
            >
              {executandoRestauracao ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Restaurando...
                </>
              ) : modoRestauracao === "substituir" ? (
                "Sim, Apagar e Substituir"
              ) : (
                "Sim, Confirmar Restauração"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
