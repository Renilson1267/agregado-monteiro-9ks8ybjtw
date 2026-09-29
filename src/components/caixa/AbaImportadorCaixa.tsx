import React, { useState, useRef } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
  Building2,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { parseCaixaPlanilha, PreviewImportacaoCaixa } from "@/lib/caixa-parser"
import { CaixaService } from "@/services/caixa"
import { Empresa } from "@/types/concreteira"

interface AbaImportadorCaixaProps {
  empresas: Empresa[]
  empresaAtiva: Empresa | null
  onImportadoSucesso: () => void
}

export function AbaImportadorCaixa({
  empresas,
  empresaAtiva,
  onImportadoSucesso,
}: AbaImportadorCaixaProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [carregandoArquivo, setCarregandoArquivo] = useState<boolean>(false)
  const [salvando, setSalvando] = useState<boolean>(false)
  const [preview, setPreview] = useState<PreviewImportacaoCaixa | null>(null)

  // Opções de importação
  const [empresaDestinoId, setEmpresaDestinoId] = useState<string>(
    empresaAtiva?.id || "",
  )
  const [modoGravacao, setModoGravacao] = useState<"substituir" | "mesclar">(
    "substituir",
  )
  const [competenciasSelecionadas, setCompetenciasSelecionadas] =
    useState<string[]>([])

  const fmtMoeda = (val: number) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivoNome(file.name)
    setCarregandoArquivo(true)
    setPreview(null)

    try {
      const buffer = await file.arrayBuffer()
      const resultado = await parseCaixaPlanilha(buffer, file.name)
      setPreview(resultado)
      // Selecionar por padrão todas as competências detectadas
      setCompetenciasSelecionadas(resultado.competenciasEncontradas)

      if (resultado.linhasValidas.length === 0) {
        toast({
          title: "Nenhum lançamento identificado",
          description:
            "Verifique se o arquivo possui colunas com Data, Descrição e Entradas/Saídas.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Planilha processada com sucesso!",
          description: `${resultado.linhasValidas.length} lançamentos válidos em ${resultado.competenciasEncontradas.length} competências (${resultado.totalAbas} abas lidas).`,
        })
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erro ao processar planilha",
        description:
          err.message || "Não foi possível interpretar as abas do arquivo.",
        variant: "destructive",
      })
    } finally {
      setCarregandoArquivo(false)
    }
  }

  const toggleCompetencia = (comp: string) => {
    setCompetenciasSelecionadas((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp],
    )
  }

  const handleConfirmarImportacao = async () => {
    if (!preview || preview.linhasValidas.length === 0) return
    const idEmpresa = empresaDestinoId || empresaAtiva?.id
    if (!idEmpresa) {
      toast({
        title: "Selecione a empresa de destino",
        description:
          "É obrigatório escolher Monteiro ou SJE para gravar os lançamentos.",
        variant: "destructive",
      })
      return
    }

    if (competenciasSelecionadas.length === 0) {
      toast({
        title: "Selecione pelo menos uma competência",
        description: "Marque os meses que deseja gravar no banco.",
        variant: "destructive",
      })
      return
    }

    // Filtrar lançamentos pelas competências marcadas
    const linhasParaGravar = preview.linhasValidas.filter((l) =>
      competenciasSelecionadas.includes(l.competencia),
    )

    if (linhasParaGravar.length === 0) {
      toast({
        title: "Nenhum lançamento nas competências selecionadas",
        variant: "destructive",
      })
      return
    }

    setSalvando(true)
    try {
      const res = await CaixaService.importarLoteLancamentos(
        idEmpresa,
        linhasParaGravar.map((l) => ({
          data: l.data,
          competencia: l.competencia,
          tipo: l.tipo,
          categoria: l.categoria,
          descricao: l.descricao,
          valor: l.valor,
          obra_nome: l.obraNome,
          documento_ref: l.documentoRef,
          observacao: l.observacao,
        })),
        modoGravacao,
        competenciasSelecionadas,
      )

      toast({
        title: "Importação concluída com sucesso!",
        description: `${res.inseridos} lançamentos gravados no banco de dados (${res.substituidos} anteriores substituídos).`,
      })

      onImportadoSucesso()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erro ao salvar lançamentos",
        description:
          err.message || "Falha na comunicação com o banco Supabase.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CARD DE INSTRUÇÃO E UPLOAD */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Importador de Planilhas de Caixa (Fec_Caixa SJE / 78 Abas)
              </CardTitle>
              <CardDescription className="text-xs">
                Faça upload do arquivo XLSX do Caixa. O sistema lê as abas
                mensais (2023 a 2026), detecta recebimentos, obras vinculadas e
                saídas operacionais.
              </CardDescription>
            </div>
            {empresaAtiva && (
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/30 w-fit"
              >
                Empresa Ativa: {empresaAtiva.nome}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview && !carregandoArquivo && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-8 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Clique para selecionar a planilha .XLSX ou .XLS do Caixa
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Compatível com <strong>Fec_Caixa SJE</strong> (78 abas, CAIXA
                  3 EMPRESAS, Obras e Fechamentos)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {carregandoArquivo && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="font-semibold text-sm text-foreground">
                Lendo e processando abas da planilha...
              </p>
              <p className="text-xs text-muted-foreground">
                Aguarde alguns segundos enquanto interpretamos as colunas e
                datas.
              </p>
            </div>
          )}

          {/* PRÉVIA DOS DADOS PROCESSADOS */}
          {preview && (
            <div className="space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      {preview.nomeArquivo}
                      <Badge variant="secondary" className="text-[10px]">
                        {preview.totalAbas} abas
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {preview.linhasValidas.length} lançamentos válidos •{" "}
                      {preview.competenciasEncontradas.length} competências
                      detectadas
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreview(null)
                    setArquivoNome(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="text-xs gap-1.5 h-8"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Trocar Arquivo
                </Button>
              </div>

              {/* CARDS COM TOTAIS DA PRÉVIA */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Lançamentos
                    </span>
                    <div className="text-xl font-bold font-mono text-foreground mt-1">
                      {preview.linhasValidas.length}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      em {preview.competenciasEncontradas.length} meses
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                      Total Entradas
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {fmtMoeda(preview.totalEntradas)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Recebimentos e Vendas
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-border/40">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase">
                      Total Saídas
                    </span>
                    <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                      {fmtMoeda(preview.totalSaidas)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Despesas operacionais
                    </span>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 border-primary/40 bg-primary/5">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-semibold text-primary uppercase">
                      Saldo do Período
                    </span>
                    <div className="text-xl font-black font-mono text-foreground mt-1">
                      {fmtMoeda(preview.saldoLiquido)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Resultado Líquido
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* CONFIGURAÇÃO DE DESTINO E MODO DE GRAVAÇÃO */}
              <div className="p-4 bg-card/60 rounded-xl border border-border/40 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Empresa de Destino */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-primary" />
                      Empresa de Destino no Supabase *
                    </Label>
                    <select
                      value={empresaDestinoId}
                      onChange={(e) => setEmpresaDestinoId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-xs"
                    >
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nome} ({emp.razao_social || emp.slug})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      Conforme regra multi-empresa, os dados ficam estritamente
                      isolados para a unidade escolhida.
                    </p>
                  </div>

                  {/* Modo de Gravação */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">
                      Modo de Gravação *
                    </Label>
                    <RadioGroup
                      value={modoGravacao}
                      onValueChange={(v: "substituir" | "mesclar") =>
                        setModoGravacao(v)
                      }
                      className="flex flex-col gap-2 pt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="substituir" id="r-substituir" />
                        <Label
                          htmlFor="r-substituir"
                          className="text-xs font-medium cursor-pointer"
                        >
                          <strong>Substituir:</strong> Apaga os lançamentos
                          anteriores das competências selecionadas e regrava
                          limpo (recomendado)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mesclar" id="r-mesclar" />
                        <Label
                          htmlFor="r-mesclar"
                          className="text-xs font-medium cursor-pointer"
                        >
                          <strong>Mesclar:</strong> Adiciona os novos
                          lançamentos mantendo os registros já existentes
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Seleção de Competências a Importar */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">
                      Competências a Gravar ({competenciasSelecionadas.length}{" "}
                      de {preview.competenciasEncontradas.length} selecionadas):
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCompetenciasSelecionadas(
                            preview.competenciasEncontradas,
                          )
                        }
                        className="text-[11px] h-7 text-primary"
                      >
                        Marcar Todas
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCompetenciasSelecionadas([])}
                        className="text-[11px] h-7 text-muted-foreground"
                      >
                        Desmarcar Todas
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-muted/20 rounded-lg border border-border/30">
                    {preview.competenciasEncontradas.map((comp) => {
                      const sel = competenciasSelecionadas.includes(comp)
                      return (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => toggleCompetencia(comp)}
                          className={`text-xs px-2.5 py-1 rounded-md font-mono font-semibold transition-all ${
                            sel
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {comp}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* PRÉVIA DE AMOSTRAGEM DOS LANÇAMENTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Amostra de Lançamentos Identificados (Primeiros 8 registros)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Total: {preview.linhasValidas.length} linhas
                  </span>
                </div>
                <div className="rounded-xl border border-border/40 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 font-semibold border-b border-border/40 text-[11px] text-muted-foreground">
                      <tr>
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Categoria</th>
                        <th className="py-2 px-3">Descrição</th>
                        <th className="py-2 px-3">Obra Detectada</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {preview.linhasValidas.slice(0, 8).map((l, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-mono text-[11px]">
                            {l.data}
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant="outline"
                              className={
                                l.tipo === "entrada"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]"
                              }
                            >
                              {l.tipo === "entrada" ? "Entrada" : "Saída"}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-medium truncate max-w-[150px]">
                            {l.categoria}
                          </td>
                          <td className="py-2 px-3 truncate max-w-[220px]">
                            {l.descricao}
                          </td>
                          <td className="py-2 px-3 text-sky-600 dark:text-sky-400 font-medium truncate max-w-[140px]">
                            {l.obraNome || "-"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            <span
                              className={
                                l.tipo === "entrada"
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }
                            >
                              {l.tipo === "entrada" ? "+" : "-"}{" "}
                              {fmtMoeda(l.valor)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOTÃO FINAL DE CONFIRMAÇÃO */}
              <div className="pt-3 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(null)
                    setArquivoNome(null)
                  }}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarImportacao}
                  disabled={salvando || competenciasSelecionadas.length === 0}
                  className="bg-primary text-primary-foreground font-semibold gap-2"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gravando no Supabase...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar e Gravar Lançamentos (
                      {competenciasSelecionadas.length} Meses)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
