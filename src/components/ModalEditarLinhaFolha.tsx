import { useState, useEffect } from "react"
import { FolhaPagamentoLinha, FolhaTabelaOficial } from "@/types/folha"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Calculator, Lock } from "lucide-react"
import {
  calcularInssProgressivo,
  calcularSalarioFamilia,
  calcularIrrf,
  calcularQuinzena,
  calcularMensalSemProducao,
  calcularComissaoVendas,
} from "@/lib/folha-calculos"

export type AbaContextoFolha = "geral" | "quinzena" | "mensal" | "producao" | "vendas"

interface ModalEditarLinhaFolhaProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  linha: FolhaPagamentoLinha | null
  abaContexto: AbaContextoFolha
  percentualQuinzena?: number
  tabelaOficial?: FolhaTabelaOficial | null
  onSalvoSucesso: () => void | Promise<void>
}

export function ModalEditarLinhaFolha({
  aberto,
  onOpenChange,
  linha,
  abaContexto,
  percentualQuinzena = 0.4,
  tabelaOficial = null,
  onSalvoSucesso,
}: ModalEditarLinhaFolhaProps) {
  const { toast } = useToast()
  const [salvando, setSalvando] = useState(false)

  // Campos de edição
  const [bruto, setBruto] = useState<number>(0)
  const [filhos, setFilhos] = useState<number>(0)
  const [quinzena, setQuinzena] = useState<number>(0)
  const [quinzena2, setQuinzena2] = useState<number>(0)
  const [adiantamento, setAdiantamento] = useState<number>(0)
  const [inss, setInss] = useState<number>(0)
  const [familia, setFamilia] = useState<number>(0)
  const [ir, setIr] = useState<number>(0)
  const [mensalLiquido, setMensalLiquido] = useState<number>(0)

  // Produção
  const [obras, setObras] = useState<number>(0)
  const [valorObra, setValorObra] = useState<number>(20)
  const [limpeza, setLimpeza] = useState<number>(0)
  const [sabado, setSabado] = useState<number>(0)
  const [feriado, setFeriado] = useState<number>(0)
  const [ajudaCusto, setAjudaCusto] = useState<number>(0)
  const [gratificacao, setGratificacao] = useState<number>(0)
  const [ferias, setFerias] = useState<number>(0)

  // Vendas
  const [vendasObra, setVendasObra] = useState<number>(0)
  const [comissao, setComissao] = useState<number>(0)
  const [vendasAjuda, setVendasAjuda] = useState<number>(0)

  // Observação / Modo
  const [observacaoLinha, setObservacaoLinha] = useState<string>("")

  useEffect(() => {
    if (linha && aberto) {
      setBruto(Number(linha.bruto || 0))
      setFilhos(Number(linha.filhos || 0))
      setQuinzena(Number(linha.quinzena || 0))
      setQuinzena2(Number(linha.quinzena_2 || 0))
      setAdiantamento(Number(linha.adiantamento || 0))
      setInss(Number(linha.inss || 0))
      setFamilia(Number(linha.familia || 0))
      setIr(Number(linha.ir || 0))
      setMensalLiquido(Number(linha.mensal_liquido || 0))

      setObras(Number(linha.obras || 0))
      setValorObra(Number(linha.valor_obra ?? 20))
      setLimpeza(Number(linha.limpeza || 0))
      setSabado(Number(linha.sabado || 0))
      setFeriado(Number(linha.feriado || 0))
      setAjudaCusto(Number(linha.ajuda_custo || 0))
      setGratificacao(Number(linha.gratificacao || 0))
      setFerias(Number(linha.ferias || 0))

      setVendasObra(Number(linha.vendas_obra || 0))
      setComissao(Number(linha.comissao || 0))
      setVendasAjuda(Number(linha.vendas_ajuda || 0))

      setObservacaoLinha(linha.observacao_linha || "")
    }
  }, [linha, aberto])

  if (!linha) return null

  const isTerceiro = linha.tipo === "Terceiro"
  const nomeColaborador = linha.nome || "Colaborador"
  const cargoColaborador = linha.funcao || linha.cargo || "Não informado"

  // Recálculo automático de apoio para o usuário (botões de auto-preenchimento)
  const recalcularFiscais = () => {
    const inssCalc = calcularInssProgressivo(bruto, tabelaOficial) ?? inss
    const famCalc =
      calcularSalarioFamilia(bruto, filhos, tabelaOficial) ?? familia
    const irCalc = calcularIrrf(bruto, inssCalc, tabelaOficial) ?? ir
    const qCalc = calcularQuinzena(bruto, percentualQuinzena)
    const liqCalc = calcularMensalSemProducao(
      bruto,
      inssCalc,
      famCalc,
      irCalc,
      qCalc,
      { quinzena_2: quinzena2 },
    )

    setInss(Math.round(inssCalc * 100) / 100)
    setFamilia(Math.round(famCalc * 100) / 100)
    setIr(Math.round(irCalc * 100) / 100)
    setQuinzena(Math.round(qCalc * 100) / 100)
    setMensalLiquido(Math.round(liqCalc * 100) / 100)
  }

  const salvarAlteracoes = async () => {
    if (!linha.id) return
    setSalvando(true)

    try {
      const calculoProducao =
        Math.round(Number(obras || 0) * Number(valorObra || 20) * 100) / 100

      const dadosUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
        observacao_linha: observacaoLinha.trim() || null,
        modo_calculo: "Digitado",
      }

      // Conforme o contexto da aba ou GERAL, persiste os campos correspondentes
      if (abaContexto === "quinzena") {
        dadosUpdate.quinzena = Number(quinzena || 0)
        dadosUpdate.quinzena_2 = Number(quinzena2 || 0)
        dadosUpdate.adiantamento = Number(adiantamento || 0)
      } else if (abaContexto === "mensal") {
        dadosUpdate.bruto = Number(bruto || 0)
        dadosUpdate.salario_base = Number(bruto || 0)
        dadosUpdate.filhos = Number(filhos || 0)
        dadosUpdate.inss = isTerceiro ? 0 : Number(inss || 0)
        dadosUpdate.familia = isTerceiro ? 0 : Number(familia || 0)
        dadosUpdate.ir = isTerceiro ? 0 : Number(ir || 0)
        dadosUpdate.quinzena = Number(quinzena || 0)
        dadosUpdate.mensal_liquido = Number(mensalLiquido || 0)
        dadosUpdate.salario_liquido = Number(mensalLiquido || 0)
      } else if (abaContexto === "producao") {
        dadosUpdate.obras = Number(obras || 0)
        dadosUpdate.valor_obra = Number(valorObra || 20)
        dadosUpdate.producao = calculoProducao
        dadosUpdate.limpeza = Number(limpeza || 0)
        dadosUpdate.sabado = Number(sabado || 0)
        dadosUpdate.feriado = Number(feriado || 0)
        dadosUpdate.ajuda_custo = Number(ajudaCusto || 0)
        dadosUpdate.gratificacao = Number(gratificacao || 0)
        dadosUpdate.adiantamento = Number(adiantamento || 0)
        dadosUpdate.ferias = Number(ferias || 0)
      } else if (abaContexto === "vendas") {
        dadosUpdate.vendas_obra = Number(vendasObra || 0)
        dadosUpdate.comissao = Number(comissao || 0)
        dadosUpdate.vendas_ajuda = Number(vendasAjuda || 0)
        dadosUpdate.ajuda_custo = Number(ajudaCusto || 0)
      } else {
        // GERAL: atualiza todos os componentes principais da linha
        dadosUpdate.bruto = Number(bruto || 0)
        dadosUpdate.salario_base = Number(bruto || 0)
        dadosUpdate.filhos = Number(filhos || 0)
        dadosUpdate.quinzena = Number(quinzena || 0)
        dadosUpdate.quinzena_2 = Number(quinzena2 || 0)
        dadosUpdate.adiantamento = Number(adiantamento || 0)
        dadosUpdate.inss = isTerceiro ? 0 : Number(inss || 0)
        dadosUpdate.familia = isTerceiro ? 0 : Number(familia || 0)
        dadosUpdate.ir = isTerceiro ? 0 : Number(ir || 0)
        dadosUpdate.mensal_liquido = Number(mensalLiquido || 0)
        dadosUpdate.salario_liquido = Number(mensalLiquido || 0)

        dadosUpdate.obras = Number(obras || 0)
        dadosUpdate.valor_obra = Number(valorObra || 20)
        dadosUpdate.producao = calculoProducao
        dadosUpdate.limpeza = Number(limpeza || 0)
        dadosUpdate.sabado = Number(sabado || 0)
        dadosUpdate.feriado = Number(feriado || 0)
        dadosUpdate.ajuda_custo = Number(ajudaCusto || 0)
        dadosUpdate.gratificacao = Number(gratificacao || 0)
        dadosUpdate.ferias = Number(ferias || 0)

        dadosUpdate.vendas_obra = Number(vendasObra || 0)
        dadosUpdate.comissao = Number(comissao || 0)
        dadosUpdate.vendas_ajuda = Number(vendasAjuda || 0)
      }

      const { error } = await (supabase as any)
        .from("folha_pagamento_linhas")
        .update(dadosUpdate)
        .eq("id", linha.id)

      if (error) {
        console.error("Erro ao atualizar linha da folha:", error)
        throw error
      }

      toast({
        title: "Linha atualizada",
        description: `Os lançamentos de ${nomeColaborador} foram salvos com sucesso.`,
      })

      onOpenChange(false)
      await onSalvoSucesso()
    } catch (err: any) {
      toast({
        title: "Erro ao salvar linha",
        description:
          err.message ||
          "Não foi possível gravar as alterações no banco de dados.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const tituloAba =
    abaContexto === "quinzena"
      ? "Editar Valores de Quinzena"
      : abaContexto === "mensal"
        ? "Editar Valores Mensais"
        : abaContexto === "producao"
          ? "Editar Lançamento de Produção"
          : abaContexto === "vendas"
            ? "Editar Lançamento de Vendas / Comissões"
            : "Editar Linha da Folha Geral"

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-bold text-foreground">
              {tituloAba}
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-xs uppercase font-semibold"
            >
              Aba: {abaContexto}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajuste os valores desta linha. Nome e cargo são somente leitura.
          </DialogDescription>
        </DialogHeader>

        {/* IDENTIFICAÇÃO DO COLABORADOR (SOMENTE LEITURA) */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Dados Cadastrais (Somente Leitura)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Nome Completo
              </Label>
              <Input
                value={nomeColaborador}
                disabled
                className="mt-1 h-8 bg-background/60 font-semibold cursor-not-allowed text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Função / Cargo
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={cargoColaborador}
                  disabled
                  className="h-8 bg-background/60 cursor-not-allowed text-xs"
                />
                <Badge
                  variant={isTerceiro ? "secondary" : "default"}
                  className="h-8 px-2.5 text-[10px] shrink-0"
                >
                  {isTerceiro ? "Terceiro" : "Funcionário"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* CAMPOS CONFORME A ABA CONTEXTO */}
        <div className="space-y-4 py-1">
          {/* ABA: QUINZENA */}
          {abaContexto === "quinzena" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-blue-600">
                    1ª Quinzena (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quinzena}
                    onChange={(e) =>
                      setQuinzena(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono font-bold text-blue-600"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Padrão: {Math.round(percentualQuinzena * 100)}% do salário
                  </span>
                </div>
                <div>
                  <Label className="text-xs">2ª Quinzena (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quinzena2}
                    onChange={(e) =>
                      setQuinzena2(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Opcional / adicional
                  </span>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-red-600">
                    Adiantamento (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={adiantamento}
                    onChange={(e) =>
                      setAdiantamento(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono text-red-600 font-semibold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Dedução / vale
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded text-xs flex items-center justify-between">
                <span className="text-blue-900 dark:text-blue-200 font-medium">
                  Líquido previsto a receber na Quinzena:
                </span>
                <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                  {(quinzena + quinzena2 - adiantamento).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    },
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ABA: MENSAL */}
          {abaContexto === "mensal" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Valores e Descontos Fiscais
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={recalcularFiscais}
                  className="h-7 text-[11px] gap-1 text-primary"
                >
                  <Calculator className="h-3 w-3" />
                  Sugerir Cálculos Oficiais
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-semibold">
                    Salário Bruto (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bruto}
                    onChange={(e) => setBruto(parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs">Filhos (&lt; 14 anos)</Label>
                  <Input
                    type="number"
                    value={filhos}
                    onChange={(e) =>
                      setFilhos(parseInt(e.target.value, 10) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-blue-600">
                    Quinzena Deduzida
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quinzena}
                    onChange={(e) =>
                      setQuinzena(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono text-blue-600"
                  />
                </div>
                <div>
                  <Label className="text-xs">Salário Família (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={familia}
                    onChange={(e) =>
                      setFamilia(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono text-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-red-600">
                    INSS Retido (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inss}
                    onChange={(e) => setInss(parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-xs font-mono text-red-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-red-600">
                    IRRF Retido (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ir}
                    onChange={(e) => setIr(parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-xs font-mono text-red-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-primary">
                    Mensal Líquido (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={mensalLiquido}
                    onChange={(e) =>
                      setMensalLiquido(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono font-bold text-primary bg-primary/5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA: PRODUÇÃO */}
          {abaContexto === "producao" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Qtd Obras</Label>
                  <Input
                    type="number"
                    value={obras}
                    onChange={(e) => setObras(parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-xs font-mono font-bold text-primary"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor por Obra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorObra}
                    onChange={(e) =>
                      setValorObra(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Limp / Lubrif (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={limpeza}
                    onChange={(e) =>
                      setLimpeza(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Sábado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={sabado}
                    onChange={(e) => setSabado(parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Feriado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={feriado}
                    onChange={(e) =>
                      setFeriado(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ajuda de Custo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ajudaCusto}
                    onChange={(e) =>
                      setAjudaCusto(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-emerald-600 font-semibold">
                    Gratificação (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={gratificacao}
                    onChange={(e) =>
                      setGratificacao(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono text-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-red-600 font-semibold">
                    Adiant. (−) (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={adiantamento}
                    onChange={(e) =>
                      setAdiantamento(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono text-red-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded text-xs flex items-center justify-between">
                <div>
                  <span className="text-emerald-900 dark:text-emerald-200 font-medium block">
                    Total Produção:{" "}
                    {(
                      obras * valorObra +
                      limpeza +
                      sabado +
                      feriado +
                      ajudaCusto
                    ).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    A Pagar = Produção + Gratificação − Adiantamento
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                    A Pagar Previsto
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    {(
                      obras * valorObra +
                      limpeza +
                      sabado +
                      feriado +
                      ajudaCusto +
                      gratificacao -
                      adiantamento
                    ).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ABA: VENDAS */}
          {abaContexto === "vendas" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-blue-600">
                    Vendas / Faturado (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={vendasObra}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0
                      setVendasObra(v)
                      // Auto-calcula 0.5% como sugestão caso o usuário queira
                      if (comissao === 0 || !isTerceiro) {
                        setComissao(calcularComissaoVendas(v))
                      }
                    }}
                    className="mt-1 h-8 text-xs font-mono font-bold text-blue-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-amber-600">
                    Comissão (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={comissao}
                    onChange={(e) =>
                      setComissao(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 h-8 text-xs font-mono font-bold text-amber-600"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Padrão: 0,5% ou tabela progressiva
                  </span>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-emerald-600">
                    Ajuda de Custo (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={vendasAjuda || ajudaCusto}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      setVendasAjuda(val)
                      setAjudaCusto(val)
                    }}
                    className="mt-1 h-8 text-xs font-mono text-emerald-600 font-semibold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Auxílio de vendas
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded text-xs flex items-center justify-between">
                <span className="text-amber-900 dark:text-amber-200 font-medium">
                  Total a Receber Vendas (Comissão + Ajuda):
                </span>
                <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300">
                  {(comissao + (vendasAjuda || ajudaCusto)).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    },
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ABA: GERAL (TODOS OS PRINCIPAIS COMPONENTES) */}
          {abaContexto === "geral" && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-foreground">
                    Componentes Salariais e Fiscais
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={recalcularFiscais}
                    className="h-6 text-[10px] gap-1 text-primary"
                  >
                    <Calculator className="h-3 w-3" />
                    Auto Fiscais
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <Label className="text-[11px]">Salário Bruto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bruto}
                      onChange={(e) =>
                        setBruto(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Quinzena (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quinzena}
                      onChange={(e) =>
                        setQuinzena(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono text-blue-600 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">INSS (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={inss}
                      onChange={(e) => setInss(parseFloat(e.target.value) || 0)}
                      className="mt-1 h-7 text-xs font-mono text-red-600"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">IRRF (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ir}
                      onChange={(e) => setIr(parseFloat(e.target.value) || 0)}
                      className="mt-1 h-7 text-xs font-mono text-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t">
                  <div>
                    <Label className="text-[11px]">Salário Família</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={familia}
                      onChange={(e) =>
                        setFamilia(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono text-emerald-600"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Adiantamento (−)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={adiantamento}
                      onChange={(e) =>
                        setAdiantamento(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono text-red-600"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Filhos (&lt;14)</Label>
                    <Input
                      type="number"
                      value={filhos}
                      onChange={(e) =>
                        setFilhos(parseInt(e.target.value, 10) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-primary">
                      Mensal Líquido
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={mensalLiquido}
                      onChange={(e) =>
                        setMensalLiquido(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono font-bold text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
                <span className="text-xs font-bold uppercase text-foreground block">
                  Produção e Extras
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <Label className="text-[11px]">Obras</Label>
                    <Input
                      type="number"
                      value={obras}
                      onChange={(e) =>
                        setObras(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Valor/Obra</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valorObra}
                      onChange={(e) =>
                        setValorObra(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Limpeza</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={limpeza}
                      onChange={(e) =>
                        setLimpeza(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Sábado / Feriado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sabado + feriado}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0
                        setSabado(v)
                        setFeriado(0)
                      }}
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t">
                  <div>
                    <Label className="text-[11px]">Ajuda de Custo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ajudaCusto}
                      onChange={(e) =>
                        setAjudaCusto(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Gratificação</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={gratificacao}
                      onChange={(e) =>
                        setGratificacao(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono text-emerald-600"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Comissão Vendas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={comissao}
                      onChange={(e) =>
                        setComissao(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 h-7 text-xs font-mono text-amber-600 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OBSERVAÇÃO OPCIONAL */}
          <div>
            <Label className="text-xs">Observação da Linha</Label>
            <Input
              value={observacaoLinha}
              onChange={(e) => setObservacaoLinha(e.target.value)}
              placeholder="Ex: Ajuste acordado na produção / quinzena"
              className="mt-1 h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={salvarAlteracoes}
            disabled={salvando}
            className="gap-1.5"
          >
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
