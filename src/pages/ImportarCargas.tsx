import { useState, useRef, useEffect, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  Truck,
  Calendar,
  AlertCircle,
  RefreshCw,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  X,
  FileCheck,
} from "lucide-react"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { toast } from "@/hooks/use-toast"
import { ConcreteiraService } from "@/services/concreteira"
import {
  parseControleDiarioCSV,
  PreviewImportacaoCSV,
} from "@/lib/csv-cargas-parser"
import { Link } from "react-router-dom"

interface MetaMesInfo {
  nome: string
  meta: number
}

// Metas oficiais fornecidas pelo usuário para Monteiro jan-set/2026
const METAS_MONTEIRO_2026: Record<string, MetaMesInfo> = {
  "2026-01": { nome: "Janeiro/2026", meta: 369.0 },
  "2026-02": { nome: "Fevereiro/2026", meta: 316.0 },
  "2026-03": { nome: "Março/2026", meta: 420.0 },
  "2026-04": { nome: "Abril/2026", meta: 343.0 },
  "2026-05": { nome: "Maio/2026", meta: 413.0 },
  "2026-06": { nome: "Junho/2026", meta: 539.0 },
  "2026-07": { nome: "Julho/2026", meta: 765.0 },
  "2026-08": { nome: "Agosto/2026", meta: 635.0 },
  "2026-09": { nome: "Setembro/2026", meta: 508.5 },
}

const META_TOTAL_JAN_SET = 4426.5

export default function ImportarCargasPage() {
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [carregandoArquivo, setCarregandoArquivo] = useState(false)
  const [preview, setPreview] = useState<PreviewImportacaoCSV | null>(null)

  // Estado do banco atual por mês (para comparar antes x depois)
  const [dadosBancoPorMes, setDadosBancoPorMes] = useState<Record<string, {
    cargas: number
    volume_m3: number
  }>>({})
  const [carregandoBanco, setCarregandoBanco] = useState(false)

  // Modal de confirmação da substituição
  const [modalConfirmacaoAberta, setModalConfirmacaoAberta] = useState(false)
  const [cargasExistentesPeriodo, setCargasExistentesPeriodo] = useState<{
    totalCargas: number
    volumeTotalM3: number
    totalMovimentacoes: number
  } | null>(null)
  const [consultandoExclusao, setConsultandoExclusao] = useState(false)

  // Execução
  const [executando, setExecutando] = useState(false)
  const [progressoMensagem, setProgressoMensagem] = useState<string | null>(
    null,
  )
  const [progressoPercentual, setProgressoPercentual] = useState<number>(0)
  const [resultadoFinal, setResultadoFinal] = useState<{
    cargasExcluidas: number
    movimentacoesExcluidas: number
    cargasInseridas: number
    tracosVinculados: number
    tracosManuais: number
    volumeTotalInseridoM3: number
  } | null>(null)

  // Período de substituição fixo: Jan a Set/2026
  const dataInicioSubstituicao = "2026-01-01"
  const dataFimSubstituicao = "2026-09-30"

  // Opções
  const [gerarBaixasEstoque, setGerarBaixasEstoque] = useState(true)

  // Carregar dados atuais do banco para comparação mês a mês
  const carregarTotaisBanco = async () => {
    if (!empresaAtiva?.id) return
    setCarregandoBanco(true)
    try {
      const res = await ConcreteiraService.consultarCargasPorPeriodo(
        empresaAtiva.id,
        "2026-01-01",
        "2026-10-31",
      )
      interface InfoBancoMes {
        cargas: number
        volume_m3: number
      }
      const mapa: Record<string, InfoBancoMes> = {}
      res.porMes.forEach((item) => {
        mapa[item.mes] = { cargas: item.cargas, volume_m3: item.volume_m3 }
      })
      setDadosBancoPorMes(mapa)
    } catch (e) {
      console.error("Erro ao consultar totais do banco:", e)
    } finally {
      setCarregandoBanco(false)
    }
  }

  useEffect(() => {
    carregarTotaisBanco()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCarregandoArquivo(true)
    setArquivoNome(file.name)
    setResultadoFinal(null)

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
        } else {
          toast({
            title: "Arquivo interpretado com sucesso",
            description: `${resultadoPreview.totalLinhasValidas} cargas válidas encontradas.`,
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

    reader.readAsText(file, "UTF-8")
  }

  // Abre modal de confirmação consultando o banco
  const abrirConfirmacaoSubstituicao = async () => {
    if (!empresaAtiva?.id || !preview) return
    setConsultandoExclusao(true)
    setModalConfirmacaoAberta(true)
    try {
      const res = await ConcreteiraService.consultarCargasPorPeriodo(
        empresaAtiva.id,
        dataInicioSubstituicao,
        dataFimSubstituicao,
      )
      setCargasExistentesPeriodo(res)
    } catch (e: any) {
      toast({
        title: "Erro ao consultar período",
        description: e.message || "Falha ao verificar banco de dados.",
        variant: "destructive",
      })
    } finally {
      setConsultandoExclusao(false)
    }
  }

  // Executa a reimportação
  const executarReimportacao = async () => {
    if (!empresaAtiva?.id || !preview) return

    // Filtra cargas do arquivo CSV pertencentes ao período 01/01/2026 a 30/09/2026
    const cargasJanSet = preview.cargas.filter(
      (c) =>
        c.dataIso >= dataInicioSubstituicao && c.dataIso <= dataFimSubstituicao,
    )

    if (cargasJanSet.length === 0) {
      toast({
        title: "Nenhuma carga no período",
        description: `Não há cargas entre ${dataInicioSubstituicao} e ${dataFimSubstituicao} no arquivo selecionado.`,
        variant: "destructive",
      })
      return
    }

    setExecutando(true)
    setProgressoMensagem("Iniciando processo de reimportação...")
    setProgressoPercentual(5)

    try {
      const res = await ConcreteiraService.reimportarCargasComSubstituicao(
        empresaAtiva.id,
        cargasJanSet,
        {
          dataInicio: dataInicioSubstituicao,
          dataFim: dataFimSubstituicao,
        },
        {
          gerarBaixasEstoque,
          onProgresso: (msg, atual) => {
            setProgressoMensagem(msg)
            setProgressoPercentual(atual)
          },
        },
      )

      setResultadoFinal(res)
      setModalConfirmacaoAberta(false)

      toast({
        title: "Reimportação concluída com sucesso!",
        description: `${res.cargasInseridas} cargas regravadas. Volume total: ${res.volumeTotalInseridoM3.toLocaleString("pt-BR")} m³.`,
      })

      // Atualiza comparação do banco
      await carregarTotaisBanco()
    } catch (err: any) {
      console.error("Erro na reimportação:", err)
      toast({
        title: "Erro na reimportação",
        description: err.message || "Falha ao processar reimportação.",
        variant: "destructive",
      })
    } finally {
      setExecutando(false)
      setProgressoMensagem(null)
    }
  }

  // Totais do preview apenas de jan a set
  const totaisJanSetPreview = useMemo(() => {
    if (!preview) return { cargas: 0, volume: 0 }
    const filtradas = preview.cargas.filter(
      (c) =>
        c.dataIso >= dataInicioSubstituicao && c.dataIso <= dataFimSubstituicao,
    )
    const vol = filtradas.reduce((acc, c) => acc + c.volume_m3, 0)
    return {
      cargas: filtradas.length,
      volume: Math.round(vol * 10) / 10,
    }
  }, [preview])

  const mesOutubroBanco = dadosBancoPorMes["2026-10"] || {
    cargas: 0,
    volume_m3: 0,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 sm:pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              Importação e Reimportação de Cargas (CSV)
            </h1>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary font-bold"
            >
              {empresaAtiva?.nome || "Empresa"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Módulo Administrativo
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Envio direto do arquivo CSV do Controle Diário via navegador.
            Substituição controlada por período, preservação de outubro e
            conferência mês a mês.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/lancamentos">
              <Truck className="w-4 h-4 mr-1.5" />
              Lançamentos
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/estoque">
              <Layers className="w-4 h-4 mr-1.5" />
              Estoque
            </Link>
          </Button>
        </div>
      </div>

      {/* Card informativo de regras fixadas */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-foreground">
                Regras de integridade para a unidade Monteiro (Janeiro a
                Setembro/2026):
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">
                    Período de substituição:
                  </strong>{" "}
                  01/01/2026 a 30/09/2026. As cargas anteriores desse período e
                  suas movimentações de estoque vinculadas são removidas antes
                  de reinserir, eliminando duplicatas.
                </li>
                <li>
                  <strong className="text-foreground">
                    Outubro/2026 intocado:
                  </strong>{" "}
                  As 16 cargas de outubro (123,5 m³) já existentes no banco
                  NUNCA são apagadas nem alteradas. A numeração do novo lote é
                  mantida sem colidir.
                </li>
                <li>
                  <strong className="text-foreground">Dosagens exatas:</strong>{" "}
                  Cada carga é gravada com as dosagens exatas digitadas na
                  planilha, sem arredondamento ou interpolação. Casa traço
                  oficial quando a dosagem for idêntica; caso contrário grava
                  como "Manual".
                </li>
                <li>
                  <strong className="text-foreground">
                    Meta validada pelo usuário:
                  </strong>{" "}
                  Total de <strong>4.426,5 m³</strong> de jan a set.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de Upload de CSV */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            1. Selecionar Arquivo CSV de Controle Diário
          </CardTitle>
          <CardDescription className="text-xs">
            Selecione o arquivo .csv exportado da planilha diária de materiais
            (colunas Data, Volume, Britas, Areia, Cimento, Aditivo, Motorista,
            Placa, Cidade).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
              id="input-arquivo-csv-cargas"
              disabled={executando || carregandoArquivo}
            />
            <label
              htmlFor="input-arquivo-csv-cargas"
              className="flex flex-col items-center justify-center cursor-pointer gap-2"
            >
              <FileSpreadsheet className="w-10 h-10 text-primary animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {arquivoNome
                    ? `Arquivo: ${arquivoNome}`
                    : "Clique para selecionar o arquivo .csv"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Processamento instantâneo no navegador. Nenhum dado fica salvo
                  em arquivos locais.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 text-xs font-semibold"
                disabled={executando || carregandoArquivo}
              >
                {arquivoNome
                  ? "Trocar Arquivo CSV"
                  : "Selecionar CSV no Computador"}
              </Button>
            </label>
          </div>

          {carregandoArquivo && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              Lendo e interpretando arquivo CSV...
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRÉVIA: Totais por Mês e Validação contra a Meta */}
      {preview && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  2. Prévia e Comparativo Mês a Mês (Planilha × Meta Oficial)
                </CardTitle>
                <CardDescription className="text-xs">
                  Validação dos totais mensais calculados a partir da planilha
                  antes de qualquer gravação.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    Math.abs(totaisJanSetPreview.volume - META_TOTAL_JAN_SET) <
                    0.1
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs py-1 px-2.5 font-mono font-bold"
                >
                  Jan–Set: {totaisJanSetPreview.volume.toLocaleString("pt-BR")}{" "}
                  m³ / Meta: {META_TOTAL_JAN_SET.toLocaleString("pt-BR")} m³
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Tabela mês a mês comparativa */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold text-xs">
                      Mês / Ano
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs">
                      Cargas (CSV)
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs">
                      Volume (CSV)
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs">
                      Meta Alvo
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs">
                      Diferença
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs">
                      Status da Meta
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs">
                      Banco Atual
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(METAS_MONTEIRO_2026).map(
                    ([chaveMes, infoMeta]) => {
                      const linhaPlanilha = preview.resumoPorMes.find(
                        (r) => r.chaveMes === chaveMes,
                      )
                      const volumeCsv = linhaPlanilha?.volumeTotalM3 || 0
                      const cargasCsv = linhaPlanilha?.cargasCount || 0
                      const diferenca =
                        Math.round((volumeCsv - infoMeta.meta) * 10) / 10
                      const fechouExato = Math.abs(diferenca) < 0.05
                      const dadoBanco = dadosBancoPorMes[chaveMes]

                      return (
                        <TableRow
                          key={chaveMes}
                          className={
                            fechouExato
                              ? "bg-emerald-500/5"
                              : "bg-destructive/5"
                          }
                        >
                          <TableCell className="font-semibold text-xs text-foreground">
                            {infoMeta.nome}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {cargasCsv}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs">
                            {volumeCsv.toLocaleString("pt-BR", {
                              minimumFractionDigits: 1,
                            })}{" "}
                            m³
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {infoMeta.meta.toLocaleString("pt-BR", {
                              minimumFractionDigits: 1,
                            })}{" "}
                            m³
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-xs font-bold ${
                              fechouExato
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {diferenca === 0
                              ? "0,0 m³"
                              : `${
                                  diferenca > 0 ? "+" : ""
                                }${diferenca.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} m³`}
                          </TableCell>
                          <TableCell className="text-center">
                            {fechouExato ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1 font-semibold"
                              >
                                <Check className="w-3 h-3" /> Confere 100%
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] gap-1 font-semibold"
                              >
                                <X className="w-3 h-3" /> Divergente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {dadoBanco
                              ? `${dadoBanco.volume_m3.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} m³ (${dadoBanco.cargas})`
                              : "0 m³"}
                          </TableCell>
                        </TableRow>
                      )
                    },
                  )}

                  {/* Linha de Total Jan-Set */}
                  <TableRow className="bg-muted/70 font-bold border-t-2 border-border">
                    <TableCell className="text-xs font-extrabold text-foreground">
                      TOTAL JAN–SET/2026
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-extrabold">
                      {totaisJanSetPreview.cargas}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-extrabold text-primary">
                      {totaisJanSetPreview.volume.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                      })}{" "}
                      m³
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {META_TOTAL_JAN_SET.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                      })}{" "}
                      m³
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-xs font-extrabold ${
                        Math.abs(
                          totaisJanSetPreview.volume - META_TOTAL_JAN_SET,
                        ) < 0.1
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      {(
                        Math.round(
                          (totaisJanSetPreview.volume - META_TOTAL_JAN_SET) *
                            10,
                        ) / 10
                      ).toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                      })}{" "}
                      m³
                    </TableCell>
                    <TableCell className="text-center">
                      {Math.abs(
                        totaisJanSetPreview.volume - META_TOTAL_JAN_SET,
                      ) < 0.1 ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3" /> TOTAL FECHADO
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="text-[10px] gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" /> TOTAL DIVERGE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {Object.entries(dadosBancoPorMes)
                        .filter(([m]) => m >= "2026-01" && m <= "2026-09")
                        .reduce((acc, [, v]) => acc + v.volume_m3, 0)
                        .toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                        })}{" "}
                      m³
                    </TableCell>
                  </TableRow>

                  {/* Linha informativa de Outubro/2026 (Preservado) */}
                  <TableRow className="bg-amber-500/5 border-t border-border/60">
                    <TableCell className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Outubro/2026 (Intocado no Banco)
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      Preservar
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
                      >
                        Preservado (100% Intocado)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {mesOutubroBanco.volume_m3.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                      })}{" "}
                      m³ ({mesOutubroBanco.cargas} cargas)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Linhas ignoradas e avisos */}
            {preview.avisos.length > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Linhas ignoradas da planilha ({preview.totalLinhasIgnoradas}{" "}
                    no total):
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Ex: linhas de saldo acumulado, rodapés ou sem data/volume
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-muted-foreground font-mono">
                  {preview.avisos.slice(0, 10).map((av, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600">•</span>
                      <span>{av}</span>
                    </div>
                  ))}
                  {preview.avisos.length > 10 && (
                    <div className="text-[10px] text-muted-foreground italic">
                      + {preview.avisos.length - 10} outros avisos similares
                      omitidos...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Configurações de Gravação e Botão de Ação */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-border/40">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chk-gerar-baixas"
                  checked={gerarBaixasEstoque}
                  onCheckedChange={(c) => setGerarBaixasEstoque(!!c)}
                />
                <Label
                  htmlFor="chk-gerar-baixas"
                  className="text-xs cursor-pointer"
                >
                  Gerar baixas de estoque de cimento e aditivo por carga
                  (movimentação vinculada)
                </Label>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={abrirConfirmacaoSubstituicao}
                disabled={executando || totaisJanSetPreview.cargas === 0}
                className="gap-2 bg-primary text-primary-foreground font-bold text-xs sm:text-sm h-11 px-6 shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-destructive-foreground" />
                Substituir Cargas Jan–Set/2026 ({totaisJanSetPreview.cargas}{" "}
                Cargas)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progresso de Execução */}
      {executando && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              {progressoMensagem || "Processando substituição..."}
            </h3>
            <div className="w-full bg-muted rounded-full h-2.5 max-w-md mx-auto overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressoPercentual}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progressoPercentual}% concluído. Não feche a página durante a
              gravação.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Reimportação */}
      {resultadoFinal && (
        <Card className="border-emerald-500 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Reimportação Concluída com Sucesso!
            </CardTitle>
            <CardDescription className="text-xs">
              O banco de dados foi atualizado. Confira os números processados
              abaixo:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border/40 bg-card">
                <span className="text-muted-foreground">
                  Cargas antigas removidas:
                </span>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {resultadoFinal.cargasExcluidas}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-card">
                <span className="text-muted-foreground">Cargas inseridas:</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {resultadoFinal.cargasInseridas}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-card">
                <span className="text-muted-foreground">
                  Volume total gravado:
                </span>
                <p className="text-lg font-bold text-primary mt-0.5">
                  {resultadoFinal.volumeTotalInseridoM3.toLocaleString("pt-BR")}{" "}
                  m³
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-card">
                <span className="text-muted-foreground">
                  Traços Casados / Manuais:
                </span>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {resultadoFinal.tracosVinculados} /{" "}
                  {resultadoFinal.tracosManuais}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link to="/relatorios">Ver Relatórios de Produção</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="text-xs font-bold bg-primary"
              >
                <Link to="/lancamentos">Ver Lançamentos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação Detalhada da Substituição */}
      <Dialog
        open={modalConfirmacaoAberta}
        onOpenChange={(v) => {
          if (!executando) setModalConfirmacaoAberta(v)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Substituição de Cargas ({empresaAtiva?.nome})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Leia com atenção antes de confirmar a gravação. Esta ação
              substitui as cargas do período selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {consultandoExclusao ? (
              <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                Consultando cargas existentes no banco...
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 space-y-2">
                  <div className="font-bold text-destructive flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />O que será APAGADO no banco:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>
                      Período restrito: <strong>01/01/2026 a 30/09/2026</strong>
                      .
                    </li>
                    <li>
                      <strong>
                        {cargasExistentesPeriodo?.totalCargas || 0} cargas
                      </strong>{" "}
                      atualmente lançadas nesse período (totalizando{" "}
                      {cargasExistentesPeriodo?.volumeTotalM3.toLocaleString(
                        "pt-BR",
                      ) || 0}{" "}
                      m³).
                    </li>
                    <li>
                      <strong>
                        {cargasExistentesPeriodo?.totalMovimentacoes || 0}{" "}
                        movimentações de estoque
                      </strong>{" "}
                      vinculadas a essas cargas serão estornadas/removidas para
                      não duplicar.
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />O que será INSERIDO da
                    planilha:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>
                      <strong>{totaisJanSetPreview.cargas} novas cargas</strong>{" "}
                      com dosagens exatas.
                    </li>
                    <li>
                      Volume total de{" "}
                      <strong className="text-foreground">
                        {totaisJanSetPreview.volume.toLocaleString("pt-BR")} m³
                      </strong>{" "}
                      (meta exata: {META_TOTAL_JAN_SET.toLocaleString("pt-BR")}{" "}
                      m³).
                    </li>
                    <li>
                      Novas baixas de estoque automáticas de cimento e aditivo
                      por carga.
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                  <strong>Preservação garantida:</strong> Outubro/2026 (
                  {mesOutubroBanco.volume_m3.toLocaleString("pt-BR")} m³,{" "}
                  {mesOutubroBanco.cargas} cargas) e qualquer outro período fora
                  de jan–set permanecem 100% intocados.
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalConfirmacaoAberta(false)}
              disabled={executando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executarReimportacao}
              disabled={executando || consultandoExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs gap-1.5"
            >
              {executando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Substituindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Sim, Apagar e Reimportar Jan–Set/2026
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
