import { useState, useEffect } from "react"
import {
  Table as TableIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Scale,
  Building2,
  Lock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { FolhaService } from "@/services/folha"
import {
  FolhaTabelaOficial,
  FaixaTabelaOficial,
  FaixaComissaoProgressiva,
} from "@/types/folha"
import { TrendingUp, Plus, Trash2 } from "lucide-react"

interface AbaTabelasOficiaisProps {
  onTabelaAtualizada?: (tabela: FolhaTabelaOficial) => void
  onFaixasComissaoAtualizadas?: (faixas: FaixaComissaoProgressiva[]) => void
}

const TABELA_OFICIAL_PADRAO_2026: Omit<FolhaTabelaOficial, "id" | "empresa_id"> =
  {
    ano: 2026,
    descricao:
      "Tabelas Oficiais 2026 (Portaria MPS/MF 13/2026 + Lei 15.270/2025)",
    salario_minimo: 1621.0,
    teto_inss: 8475.55,
    familia_cota_por_filho: 67.54,
    familia_teto_salario: 1980.38,
    ir_isento_ate: 5000.0,
    ir_desconto_gradual_ate: 7350.0,
    ir_parcela_fixa_reducao: 978.62,
    ir_coeficiente_reducao: 0.133145,
    inss_faixas: [
      { de: 0, ate: 1621.0, aliquota: 0.075, deducao: 0 },
      { de: 1621.01, ate: 2902.84, aliquota: 0.09, deducao: 24.32 },
      { de: 2902.85, ate: 4354.27, aliquota: 0.12, deducao: 111.4 },
      { de: 4354.28, ate: 8475.55, aliquota: 0.14, deducao: 198.49 },
    ],
    irrf_faixas: [
      { de: 0, ate: 2428.8, aliquota: 0.0, deducao: 0 },
      { de: 2428.81, ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
      { de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
      { de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
      { de: 4664.69, ate: 999999999, aliquota: 0.275, deducao: 908.73 },
    ],
  }

export function AbaTabelasOficiais({
  onTabelaAtualizada,
  onFaixasComissaoAtualizadas,
}: AbaTabelasOficiaisProps) {
  const { toast } = useToast()
  const { empresaAtiva } = useEmpresa()
  const { isAdministrador } = useUsuario()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [salvandoComissao, setSalvandoComissao] = useState(false)
  const [tabela, setTabela] = useState<FolhaTabelaOficial | null>(null)
  const [faixasComissao, setFaixasComissao] =
    useState<FaixaComissaoProgressiva[]>([])

  // Formulário local
  const [formTabela, setFormTabela] =
    useState<Omit<FolhaTabelaOficial, "id" | "empresa_id">>(
      TABELA_OFICIAL_PADRAO_2026,
    )

  const carregarDados = async () => {
    if (!empresaAtiva?.id) return
    setLoading(true)
    try {
      const [tab, faixas] = await Promise.all([
        FolhaService.getTabelaOficial(empresaAtiva.id, 2026),
        FolhaService.getFaixasComissao(empresaAtiva.id),
      ])

      setFaixasComissao(faixas || [])
      if (tab) {
        setTabela(tab)
        setFormTabela({
          ano: tab.ano || 2026,
          descricao: tab.descricao || TABELA_OFICIAL_PADRAO_2026.descricao,
          salario_minimo: Number(tab.salario_minimo ?? 1621),
          teto_inss: Number(tab.teto_inss ?? 8475.55),
          familia_cota_por_filho: Number(tab.familia_cota_por_filho ?? 67.54),
          familia_teto_salario: Number(tab.familia_teto_salario ?? 1980.38),
          ir_isento_ate: Number(tab.ir_isento_ate ?? 5000),
          ir_desconto_gradual_ate: Number(tab.ir_desconto_gradual_ate ?? 7350),
          ir_parcela_fixa_reducao: Number(
            tab.ir_parcela_fixa_reducao ?? 978.62,
          ),
          ir_coeficiente_reducao: Number(
            tab.ir_coeficiente_reducao ?? 0.133145,
          ),
          inss_faixas:
            tab.inss_faixas && tab.inss_faixas.length > 0
              ? tab.inss_faixas
              : TABELA_OFICIAL_PADRAO_2026.inss_faixas,
          irrf_faixas:
            tab.irrf_faixas && tab.irrf_faixas.length > 0
              ? tab.irrf_faixas
              : TABELA_OFICIAL_PADRAO_2026.irrf_faixas,
        })
      } else {
        setTabela(null)
        setFormTabela(TABELA_OFICIAL_PADRAO_2026)
      }
    } catch (err: any) {
      toast({
        title: "Erro ao carregar tabelas oficiais",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaAtiva?.id])

  const adicionarFaixaComissao = () => {
    setFaixasComissao((prev) => {
      const ultima = prev[prev.length - 1]
      const proximoDe = ultima ? Number(ultima.ate_valor || 0) + 0.01 : 0
      return [
        ...prev,
        {
          de_valor: proximoDe,
          ate_valor: proximoDe + 100000,
          percentual: 0.02,
          ordem: prev.length + 1,
        },
      ]
    })
  }

  const removerFaixaComissao = (idx: number) => {
    setFaixasComissao((prev) => prev.filter((_, i) => i !== idx))
  }

  const atualizarFaixaComissao = (
    idx: number,
    campo: keyof FaixaComissaoProgressiva,
    valor: any,
  ) => {
    setFaixasComissao((prev) => {
      const copia = [...prev]
      copia[idx] = { ...copia[idx], [campo]: valor }
      return copia
    })
  }

  const handleSalvarComissao = async () => {
    if (!isAdministrador) {
      toast({
        title: "Permissão necessária",
        description: "Apenas administradores podem editar faixas de comissão.",
        variant: "destructive",
      })
      return
    }
    if (!empresaAtiva?.id) return

    setSalvandoComissao(true)
    try {
      const salvas = await FolhaService.salvarFaixasComissao(
        empresaAtiva.id,
        faixasComissao,
      )
      setFaixasComissao(salvas)
      toast({
        title: "Tabela progressiva de comissões salva!",
        description: `${salvas.length} faixa(s) salva(s) para ${empresaAtiva.nome}.`,
      })
      if (onFaixasComissaoAtualizadas) {
        onFaixasComissaoAtualizadas(salvas)
      }
    } catch (err: any) {
      toast({
        title: "Erro ao salvar comissões",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvandoComissao(false)
    }
  }

  const atualizarFaixaInss = (
    idx: number,
    campo: keyof FaixaTabelaOficial,
    valor: number,
  ) => {
    setFormTabela((prev) => {
      const copia = [...prev.inss_faixas]
      copia[idx] = { ...copia[idx], [campo]: valor }
      return { ...prev, inss_faixas: copia }
    })
  }

  const atualizarFaixaIrrf = (
    idx: number,
    campo: keyof FaixaTabelaOficial,
    valor: number,
  ) => {
    setFormTabela((prev) => {
      const copia = [...prev.irrf_faixas]
      copia[idx] = { ...copia[idx], [campo]: valor }
      return { ...prev, irrf_faixas: copia }
    })
  }

  const handleSalvar = async () => {
    if (!isAdministrador) {
      toast({
        title: "Permissão necessária",
        description:
          "Apenas usuários Administradores podem atualizar as tabelas oficiais.",
        variant: "destructive",
      })
      return
    }
    if (!empresaAtiva?.id) return

    setSalvando(true)
    try {
      const salva = await FolhaService.salvarTabelaOficial({
        empresa_id: empresaAtiva.id,
        ano: formTabela.ano,
        descricao: formTabela.descricao,
        salario_minimo: formTabela.salario_minimo,
        teto_inss: formTabela.teto_inss,
        familia_cota_por_filho: formTabela.familia_cota_por_filho,
        familia_teto_salario: formTabela.familia_teto_salario,
        ir_isento_ate: formTabela.ir_isento_ate,
        ir_desconto_gradual_ate: formTabela.ir_desconto_gradual_ate,
        ir_parcela_fixa_reducao: formTabela.ir_parcela_fixa_reducao,
        ir_coeficiente_reducao: formTabela.ir_coeficiente_reducao,
        inss_faixas: formTabela.inss_faixas,
        irrf_faixas: formTabela.irrf_faixas,
      })

      setTabela(salva)
      toast({
        title: "Tabelas oficiais salvas com sucesso!",
        description: `Os parâmetros de INSS, Salário-Família e IRRF foram atualizados para ${empresaAtiva.nome}.`,
      })
      if (onTabelaAtualizada) onTabelaAtualizada(salva)
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleRestaurarPadrao = async () => {
    if (!isAdministrador) return
    const confirmou = window.confirm(
      "Deseja restaurar as alíquotas e faixas para os valores da Portaria MPS/MF nº 13/2026 e Lei 15.270/2025?",
    )
    if (!confirmou) return

    setRestaurando(true)
    try {
      setFormTabela(TABELA_OFICIAL_PADRAO_2026)
      if (empresaAtiva?.id) {
        const salva = await FolhaService.salvarTabelaOficial({
          empresa_id: empresaAtiva.id,
          ...TABELA_OFICIAL_PADRAO_2026,
        })
        setTabela(salva)
        if (onTabelaAtualizada) onTabelaAtualizada(salva)
      }
      toast({
        title: "Padrão oficial 2026 restaurado!",
        description:
          "Faixas do INSS e regras do IRRF redefinidas conforme a legislação.",
      })
    } catch (err: any) {
      toast({
        title: "Erro ao restaurar",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setRestaurando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO CONTEXTUAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Tabelas Oficiais da Folha de Pagamento ({formTabela.ano})
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
              Configuração oficial das faixas e alíquotas progressivas do{" "}
              <strong>INSS</strong>, cotas do <strong>Salário-Família</strong> e
              faixas do <strong>IRRF 2026</strong> (com isenção até R$ 5.000,00
              e redução gradual pela Lei 15.270/2025). As fórmulas de cálculo da
              aba GERAL utilizam estes parâmetros em tempo real.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAdministrador ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestaurarPadrao}
                disabled={loading || salvando || restaurando}
                className="text-xs h-9 gap-1.5"
                title="Redefinir para valores da Portaria Interministerial 13/2026"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Restaurar Padrões 2026</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSalvar}
                disabled={loading || salvando || restaurando}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{salvando ? "Salvando..." : "Salvar Tabelas"}</span>
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

      <Alert className="bg-muted/40 border-border/40">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Fontes Normativas Oficiais
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1">
          Portaria Interministerial MPS/MF nº 13/2026 (INSS e salário-família) ·
          Lei 15.270/2025 + tabela da Receita Federal (IRRF). Confirme sempre as
          atualizações anuais com o setor contábil.
        </AlertDescription>
      </Alert>

      {/* PARÂMETROS GERAIS: Salário Mínimo, Teto INSS, Salário Família */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Salário Mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                disabled={!isAdministrador}
                value={formTabela.salario_minimo}
                onChange={(e) =>
                  setFormTabela((prev) => ({
                    ...prev,
                    salario_minimo: parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-8 text-xs font-mono font-bold"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Teto do INSS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                disabled={!isAdministrador}
                value={formTabela.teto_inss}
                onChange={(e) =>
                  setFormTabela((prev) => ({
                    ...prev,
                    teto_inss: parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-8 text-xs font-mono font-bold"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Salário-Família (Cota/Filho)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                disabled={!isAdministrador}
                value={formTabela.familia_cota_por_filho}
                onChange={(e) =>
                  setFormTabela((prev) => ({
                    ...prev,
                    familia_cota_por_filho: parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-8 text-xs font-mono font-bold text-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Por filho de até 14 anos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Salário-Família (Teto Bruto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                disabled={!isAdministrador}
                value={formTabela.familia_teto_salario}
                onChange={(e) =>
                  setFormTabela((prev) => ({
                    ...prev,
                    familia_teto_salario: parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-8 text-xs font-mono font-bold"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Direito apenas para bruto até este limite
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRID DUAS COLUNAS: TABELA INSS PROGRESSIVO E TABELA IRRF 2026 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA 1: INSS */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              Tabela Progressiva de INSS
            </CardTitle>
            <CardDescription className="text-xs">
              Alíquotas progressivas e parcela a deduzir oficiais
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">A partir de (R$)</th>
                  <th className="py-2.5 px-2">Até (R$)</th>
                  <th className="py-2.5 px-2 text-center">Alíquota (%)</th>
                  <th className="py-2.5 px-3 text-right">
                    Parcela Deduzir (R$)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formTabela.inss_faixas.map((f, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-mono">
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isAdministrador}
                        value={f.de}
                        onChange={(e) =>
                          atualizarFaixaInss(
                            idx,
                            "de",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-7 text-xs font-mono w-24"
                      />
                    </td>
                    <td className="py-2 px-2 font-mono">
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isAdministrador}
                        value={f.ate}
                        onChange={(e) =>
                          atualizarFaixaInss(
                            idx,
                            "ate",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-7 text-xs font-mono w-24"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          step="0.001"
                          disabled={!isAdministrador}
                          value={f.aliquota * 100}
                          onChange={(e) =>
                            atualizarFaixaInss(
                              idx,
                              "aliquota",
                              (parseFloat(e.target.value) || 0) / 100,
                            )
                          }
                          className="h-7 text-xs font-mono w-16 text-center"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isAdministrador}
                        value={f.deducao}
                        onChange={(e) =>
                          atualizarFaixaInss(
                            idx,
                            "deducao",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-7 text-xs font-mono w-24 text-right ml-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* COLUNA 2: IRRF 2026 */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              Tabela Progressiva de IRRF (2026)
            </CardTitle>
            <CardDescription className="text-xs">
              Isenção até R$ 5.000,00 e redução gradual pela Lei 15.270/2025
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Base a partir de</th>
                  <th className="py-2.5 px-2 text-center">Alíquota (%)</th>
                  <th className="py-2.5 px-3 text-right">
                    Parcela Deduzir (R$)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formTabela.irrf_faixas.map((f, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-mono">
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isAdministrador}
                        value={f.de}
                        onChange={(e) =>
                          atualizarFaixaIrrf(
                            idx,
                            "de",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-7 text-xs font-mono w-28"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          step="0.001"
                          disabled={!isAdministrador}
                          value={f.aliquota * 100}
                          onChange={(e) =>
                            atualizarFaixaIrrf(
                              idx,
                              "aliquota",
                              (parseFloat(e.target.value) || 0) / 100,
                            )
                          }
                          className="h-7 text-xs font-mono w-16 text-center"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isAdministrador}
                        value={f.deducao}
                        onChange={(e) =>
                          atualizarFaixaIrrf(
                            idx,
                            "deducao",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-7 text-xs font-mono w-24 text-right ml-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Parâmetros de Redução Gradual da Lei 15.270 */}
            <div className="p-4 bg-muted/20 border-t space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-primary" />
                Parâmetros Especiais da Redução (Lei 15.270/2025)
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[11px]">IR Isento até (Bruto)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!isAdministrador}
                    value={formTabela.ir_isento_ate}
                    onChange={(e) =>
                      setFormTabela((prev) => ({
                        ...prev,
                        ir_isento_ate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-7 text-xs font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Desconto Gradual até</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!isAdministrador}
                    value={formTabela.ir_desconto_gradual_ate}
                    onChange={(e) =>
                      setFormTabela((prev) => ({
                        ...prev,
                        ir_desconto_gradual_ate:
                          parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-7 text-xs font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Parcela Fixa Redução</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!isAdministrador}
                    value={formTabela.ir_parcela_fixa_reducao}
                    onChange={(e) =>
                      setFormTabela((prev) => ({
                        ...prev,
                        ir_parcela_fixa_reducao:
                          parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-7 text-xs font-mono mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Coeficiente Redução</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    disabled={!isAdministrador}
                    value={formTabela.ir_coeficiente_reducao}
                    onChange={(e) =>
                      setFormTabela((prev) => ({
                        ...prev,
                        ir_coeficiente_reducao: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-7 text-xs font-mono mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO: TABELA PROGRESSIVA DE COMISSÕES (POR EMPRESA) */}
      <Card className="border-amber-400/40">
        <CardHeader className="pb-3 border-b bg-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Tabela Progressiva de Comissões
                {empresaAtiva && (
                  <Badge
                    variant="outline"
                    className="border-amber-400 text-amber-700 bg-amber-50 text-[10px]"
                  >
                    {empresaAtiva.nome}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Utilizada pelo cálculo automático na aba <strong>VENDAS</strong>{" "}
                para apuração marginal por faixa (o percentual incide sobre a
                fatia vendida de cada trecho).
              </CardDescription>
            </div>

            {isAdministrador && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={adicionarFaixaComissao}
                  disabled={loading || salvandoComissao}
                  className="text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Faixa
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvarComissao}
                  disabled={loading || salvandoComissao}
                  className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  {salvandoComissao
                    ? "Salvando..."
                    : "Salvar Faixas de Comissão"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {faixasComissao.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <p className="font-medium text-amber-700">
                Nenhuma faixa progressiva de comissão configurada para esta
                empresa.
              </p>
              <p className="mt-1">
                Na aba VENDAS, os colaboradores com comissão progressiva
                exibirão o aviso "Configure a tabela progressiva de comissões".
              </p>
              {isAdministrador && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={adicionarFaixaComissao}
                  className="mt-3 text-xs h-8 gap-1.5 border-dashed border-amber-400"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  Adicionar 1ª Faixa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/70 text-muted-foreground font-semibold uppercase border-b">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Faixa</th>
                    <th className="py-2.5 px-3">De (R$)</th>
                    <th className="py-2.5 px-3">Até (R$)</th>
                    <th className="py-2.5 px-3 text-right">% Alíquota</th>
                    <th className="py-2.5 px-3 text-right">% Formatado</th>
                    {isAdministrador && (
                      <th className="py-2.5 px-3 text-center w-16">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {faixasComissao.map((f, idx) => {
                    const percFormatado =
                      Number(f.percentual || 0) > 1
                        ? Number(f.percentual || 0)
                        : Number(f.percentual || 0) * 100

                    return (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-2 px-3 text-center text-muted-foreground font-sans font-bold">
                          {idx + 1}ª
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            disabled={!isAdministrador}
                            value={f.de_valor}
                            onChange={(e) =>
                              atualizarFaixaComissao(
                                idx,
                                "de_valor",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-7 text-xs font-mono w-32"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            disabled={!isAdministrador}
                            value={f.ate_valor}
                            onChange={(e) =>
                              atualizarFaixaComissao(
                                idx,
                                "ate_valor",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-7 text-xs font-mono w-32"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Input
                            type="number"
                            step="0.001"
                            disabled={!isAdministrador}
                            value={f.percentual}
                            onChange={(e) =>
                              atualizarFaixaComissao(
                                idx,
                                "percentual",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-7 text-xs font-mono w-24 text-right ml-auto"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-sans font-bold text-amber-700">
                          {percFormatado.toLocaleString("pt-BR", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 3,
                          })}
                          %
                        </td>
                        {isAdministrador && (
                          <td className="py-2 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerFaixaComissao(idx)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Remover faixa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 bg-muted/20 border-t text-[11px] text-muted-foreground">
            <strong>Dica:</strong> Para faixas ilimitadas (sem teto máximo),
            utilize um valor alto em "Até" como <code>999999999</code>. O
            percentual pode ser informado tanto em decimal (ex:{" "}
            <code>0.025</code>) quanto em porcentagem (ex: <code>2.5</code>).
          </div>
        </CardContent>
      </Card>

      {/* RODAPÉ DE AÇÃO */}
      {isAdministrador && (
        <div className="p-4 rounded-xl border border-border/40 bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Alterações salvas serão aplicadas instantaneamente aos cálculos de
              INSS, Salário-Família e IRRF na folha de{" "}
              <strong>{empresaAtiva?.nome}</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestaurarPadrao}
              disabled={loading || salvando || restaurando}
              className="text-xs h-9 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões 2026
            </Button>
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={loading || salvando || restaurando}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {salvando ? "Salvando..." : "Salvar Tabelas Oficiais"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
