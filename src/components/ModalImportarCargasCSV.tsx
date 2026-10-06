import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Truck,
  Users,
  MapPin,
  RefreshCw,
  Info,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import {
  parseControleDiarioCSV,
  PreviewImportacaoCSV,
} from "@/lib/csv-cargas-parser"
import { ConcreteiraService } from "@/services/concreteira"
import { useEmpresa } from "@/hooks/use-empresa"
import { toast } from "@/hooks/use-toast"

interface ModalImportarCargasCSVProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportadoSucesso?: () => void
}

export function ModalImportarCargasCSV({
  open,
  onOpenChange,
  onImportadoSucesso,
}: ModalImportarCargasCSVProps) {
  const { empresaAtiva } = useEmpresa()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [carregandoArquivo, setCarregandoArquivo] = useState(false)
  const [preview, setPreview] = useState<PreviewImportacaoCSV | null>(null)
  const [deduplicar, setDeduplicar] = useState(true)
  const [gerarBaixasEstoque, setGerarBaixasEstoque] = useState(true)
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState<string | null>(null)

  const resetar = () => {
    setArquivoNome(null)
    setPreview(null)
    setImportando(false)
    setProgresso(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCarregandoArquivo(true)
    setArquivoNome(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string
        const resultadoPreview = parseControleDiarioCSV(conteudo)
        setPreview(resultadoPreview)

        if (resultadoPreview.erros.length > 0) {
          toast({
            title: "Aviso no processamento do arquivo",
            description: resultadoPreview.erros.join("; "),
            variant: "destructive",
          })
        }
      } catch (err: any) {
        toast({
          title: "Erro ao interpretar CSV",
          description: err.message || "Arquivo corrompido ou formato ilegível.",
          variant: "destructive",
        })
      } finally {
        setCarregandoArquivo(false)
      }
    }

    reader.onerror = () => {
      toast({
        title: "Falha na leitura",
        description: "Não foi possível ler o arquivo local.",
        variant: "destructive",
      })
      setCarregandoArquivo(false)
    }

    // Leitura como texto com suporte a UTF-8 / ISO-8859-1
    reader.readAsText(file, "UTF-8")
  }

  const handleConfirmarImportacao = async () => {
    if (!empresaAtiva?.id || !preview || preview.cargas.length === 0) return

    setImportando(true)
    setProgresso("Validando cadastros e gravando cargas...")

    try {
      const resultado = await ConcreteiraService.importarCargasControleDiario(
        empresaAtiva.id,
        preview.cargas,
        {
          deduplicar,
          gerarBaixaEstoque: gerarBaixasEstoque,
        },
      )

      const msg = [
        `${resultado.importadas} cargas importadas com sucesso`,
        resultado.duplicadasIgnoradas > 0
          ? `${resultado.duplicadasIgnoradas} duplicadas ignoradas`
          : null,
        resultado.tracosCriados > 0
          ? `${resultado.tracosCriados} novos traços criados`
          : null,
        resultado.motoristasCriados > 0
          ? `${resultado.motoristasCriados} motoristas cadastrados`
          : null,
        resultado.veiculosCriados > 0
          ? `${resultado.veiculosCriados} veículos cadastrados`
          : null,
        resultado.cidadesCriadas > 0
          ? `${resultado.cidadesCriadas} cidades cadastradas`
          : null,
      ]
        .filter(Boolean)
        .join(", ")

      toast({
        title: `Importação concluída para ${empresaAtiva.nome}!`,
        description: msg,
      })

      onImportadoSucesso?.()
      onOpenChange(false)
      resetar()
    } catch (err: any) {
      toast({
        title: "Erro durante a importação",
        description: err.message || "Falha ao gravar cargas no banco de dados.",
        variant: "destructive",
      })
    } finally {
      setImportando(false)
      setProgresso(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!importando) {
          onOpenChange(v)
          if (!v) resetar()
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Importar Controle Diário de Materiais
                <Badge variant="outline" className="text-primary font-bold">
                  {empresaAtiva?.nome || "Empresa Ativa"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Importe a produção diária a partir do arquivo CSV de controle da
                concreteira (mesmo padrão das unidades Monteiro e SJE). O
                processamento ocorre exclusivamente a partir do arquivo
                selecionado em seu computador.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seletor de Arquivo */}
          <div className="p-4 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
              id="input-csv-controle-diario"
              disabled={importando || carregandoArquivo}
            />
            <label
              htmlFor="input-csv-controle-diario"
              className="flex flex-col items-center justify-center cursor-pointer gap-2"
            >
              <UploadCloud className="w-8 h-8 text-primary animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {arquivoNome
                    ? `Arquivo: ${arquivoNome}`
                    : "Clique para selecionar o arquivo .csv da Concreteira"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formato esperado: Data, Volume (m³), Brita 12, Brita 19,
                  Areia, Pó de Pedra, Cimento, Aditivo, Motorista, Placa,
                  Cidade.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 gap-1 text-xs"
                disabled={importando || carregandoArquivo}
              >
                {arquivoNome ? "Substituir Arquivo" : "Buscar no Computador"}
              </Button>
            </label>
          </div>

          {/* Estado de Leitura */}
          {carregandoArquivo && (
            <div className="p-6 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              Lendo e analisando dados da planilha...
            </div>
          )}

          {/* PRÉVIA DE IMPORTAÇÃO */}
          {preview && !carregandoArquivo && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                      Total de Cargas
                    </p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {preview.totalLinhasValidas}
                    </p>
                    {preview.totalCargasZeradas > 0 && (
                      <p className="text-[10px] text-amber-500 font-medium">
                        {preview.totalCargasZeradas} zerada(s) / descarte
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      Volume Total
                    </p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {preview.volumeTotalM3.toLocaleString("pt-BR")} m³
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Concreto expedido
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      Período
                    </p>
                    <p className="text-xs font-bold text-foreground mt-1 truncate">
                      {preview.periodoInicio
                        ? preview.periodoInicio.split("-").reverse().join("/")
                        : "—"}{" "}
                      a{" "}
                      {preview.periodoFim
                        ? preview.periodoFim.split("-").reverse().join("/")
                        : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Detectado nas cargas
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                      Traços Distintos
                    </p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {preview.tracosDetectados.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Formulação de dosagens
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Traços Detectados */}
              <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Traços e Dosagens Identificados no Arquivo (
                    {preview.tracosDetectados.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Serão vinculados ou cadastrados automaticamente
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {preview.tracosDetectados.map((tr, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-background/70 border border-border/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {tr.nomeSugerido}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Cim: {Math.round(tr.cimentoM3)} kg/m³ | B12:{" "}
                          {Math.round(tr.brita12M3)} | B19:{" "}
                          {Math.round(tr.brita19M3)} | Areia:{" "}
                          {Math.round(tr.areiaM3)}
                          {tr.poPedraM3 > 0
                            ? ` | Pó: ${Math.round(tr.poPedraM3)}`
                            : ""}
                          {tr.aditivoM3 > 0
                            ? ` | Adit: ${tr.aditivoM3} L/m³`
                            : ""}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0 self-start sm:self-center"
                      >
                        {tr.totalCargas} carga(s)
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cadastros Complementares Detectados */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-lg border border-border/40 bg-card/40">
                  <span className="font-semibold flex items-center gap-1 text-foreground mb-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Motoristas ({preview.motoristasEncontrados.length})
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {preview.motoristasEncontrados.length > 0
                      ? preview.motoristasEncontrados.join(", ")
                      : "Nenhum identificado na planilha"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-card/40">
                  <span className="font-semibold flex items-center gap-1 text-foreground mb-1">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    Placas / Veículos ({preview.veiculosEncontrados.length})
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {preview.veiculosEncontrados.length > 0
                      ? preview.veiculosEncontrados.join(", ")
                      : "Nenhum identificado na planilha"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-card/40">
                  <span className="font-semibold flex items-center gap-1 text-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Cidades Destino ({preview.cidadesEncontradas.length})
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {preview.cidadesEncontradas.length > 0
                      ? preview.cidadesEncontradas.join(", ")
                      : "Nenhuma identificada na planilha"}
                  </p>
                </div>
              </div>

              {/* Avisos de Validação se houver */}
              {preview.avisos.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Avisos de Linhas Ignoradas ou Incompletas (
                    {preview.avisos.length}):
                  </div>
                  <ul className="list-disc pl-5 max-h-24 overflow-y-auto space-y-0.5 text-[11px]">
                    {preview.avisos.map((aviso, idx) => (
                      <li key={idx}>{aviso}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opções de Importação */}
              <div className="p-3 rounded-lg border border-border/40 bg-card/50 space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Opções de Gravação no Banco de Dados:
                </span>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="opt-deduplicar"
                      checked={deduplicar}
                      onCheckedChange={(c) => setDeduplicar(!!c)}
                      disabled={importando}
                    />
                    <Label
                      htmlFor="opt-deduplicar"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Deduplicação Inteligente (não duplica cargas já existentes
                      com mesma data/volume)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="opt-baixas"
                      checked={gerarBaixasEstoque}
                      onCheckedChange={(c) => setGerarBaixasEstoque(!!c)}
                      disabled={importando}
                    />
                    <Label
                      htmlFor="opt-baixas"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Gerar Saídas de Estoque (apenas Cimento e Aditivo
                      controlados)
                    </Label>
                  </div>
                </div>

                {/* Linhas ignoradas e avisos detalhados no modal */}
                {preview.totalLinhasIgnoradas > 0 && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      {preview.totalLinhasIgnoradas} linha(s) ignorada(s)
                      (linhas vazias, saldos de cabeçalho ou sem volume)
                    </span>
                    {preview.linhasIgnoradasDetalhes &&
                      preview.linhasIgnoradasDetalhes.length > 0 && (
                        <div className="max-h-28 overflow-y-auto space-y-1 text-[10px] font-mono text-muted-foreground pr-1">
                          {preview.linhasIgnoradasDetalhes
                            .slice(0, 10)
                            .map((ign, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="font-bold text-amber-600">
                                  L#{ign.linhaNumero}:
                                </span>
                                <span className="text-foreground">
                                  {ign.motivo}
                                </span>
                              </div>
                            ))}
                          {preview.linhasIgnoradasDetalhes.length > 10 && (
                            <div className="text-[10px] text-muted-foreground italic">
                              + {preview.linhasIgnoradasDetalhes.length - 10}{" "}
                              outras linhas ignoradas...
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Barra de Progresso / Loading */}
          {importando && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {progresso || "Processando importação..."}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Por favor, aguarde enquanto todas as cargas, traços e cadastros
                são persistidos para {empresaAtiva?.nome}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-border/40 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importando}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmarImportacao}
            disabled={
              !preview ||
              preview.cargas.length === 0 ||
              importando ||
              carregandoArquivo
            }
            className="gap-1.5 bg-primary text-primary-foreground text-xs font-bold"
          >
            {importando ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Gravando no Banco...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmar Importação ({preview ? preview.cargas.length : 0}{" "}
                Cargas)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
