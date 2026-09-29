import React, { useState, useMemo } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Printer,
  Calculator,
  RotateCcw,
  Info,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { FolhaTabelaOficial, LinhaDecimoTerceiro } from "@/types/folha"
import {
  calcularLinhaDecimoTerceiro,
  calcularMesesProporcionais13,
} from "@/lib/folha-calculos"

interface FuncionarioBase13 {
  id: string
  nome: string
  funcao?: string
  cargo?: string
  unidade?: string
  data_admissao?: string | null
  bruto: number
  conta?: string
  pix?: string
  oculto?: boolean
  inativo?: boolean
}

interface LinhaHistoricoAno {
  nome: string
  bruto: number
  inss: number
  ir: number
}

interface AbaDecimoTerceiroProps {
  ano: number
  empresaNome: string
  funcionarios: FuncionarioBase13[]
  historicoLinhasAno?: LinhaHistoricoAno[]
  tabelaOficial: FolhaTabelaOficial | null
  mostrarOcultos: boolean
  busca: string
  onImprimirA4: () => void
}

export const AbaDecimoTerceiro: React.FC<AbaDecimoTerceiroProps> = ({
  ano,
  empresaNome,
  funcionarios,
  historicoLinhasAno = [],
  tabelaOficial,
  mostrarOcultos,
  busca,
  onImprimirA4,
}) => {
  // Ajustes manuais por linha (meses ou bruto customizado)
  // Armazena: { [funcId]: { meses?: number, bruto?: number } }
  const [ajustesManuais, setAjustesManuais] = useState<Record<string, {
    meses?: number
    bruto?: number
  }>>({})

  // Formatação moeda
  const fmtMoeda = (val: number | undefined | null) => {
    if (val === null || val === undefined) return "-"
    return Number(val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Mapa com soma de remunerações / retenções acumuladas do ano por colaborador (para verificação de base anual de IR)
  const acumuladoAnoPorNome = useMemo(() => {
    const mapa = new Map<string, {
      somaBruto: number
      somaInss: number
      somaIr: number
    }>()
    historicoLinhasAno.forEach((h) => {
      const chave = (h.nome || "").trim().toUpperCase()
      const prev = mapa.get(chave) || { somaBruto: 0, somaInss: 0, somaIr: 0 }
      mapa.set(chave, {
        somaBruto: prev.somaBruto + Number(h.bruto || 0),
        somaInss: prev.somaInss + Number(h.inss || 0),
        somaIr: prev.somaIr + Number(h.ir || 0),
      })
    })
    return mapa
  }, [historicoLinhasAno])

  // Processa as linhas do 13º salário
  // ATENÇÃO: Terceiros (ex.: folha_terceiros) ficam FORA do 13º (já vem filtrado)
  const linhasProcessadas = useMemo<LinhaDecimoTerceiro[]>(() => {
    return funcionarios.map((f) => {
      const nomeUpper = (f.nome || "").trim().toUpperCase()
      const salarioBase = Number(f.bruto || 0)

      // Cálculo automático dos meses proporcionais pelo dia de admissão (regra >= 15 dias)
      const mesesCalculados = calcularMesesProporcionais13(f.data_admissao, ano)

      const ajuste = ajustesManuais[f.id]
      const mesesEfetivos =
        ajuste?.meses !== undefined ? ajuste.meses : mesesCalculados

      // Bruto padrão = (salario / 12) * meses
      const brutoPadraoCalculado =
        Math.round((salarioBase / 12) * mesesEfetivos * 100) / 100
      const brutoEfetivo =
        ajuste?.bruto !== undefined ? ajuste.bruto : brutoPadraoCalculado

      const acum = acumuladoAnoPorNome.get(nomeUpper)

      // Cálculo das parcelas
      const calc = calcularLinhaDecimoTerceiro(
        salarioBase,
        mesesEfetivos,
        tabelaOficial,
        {
          somaRemuneracoesAno: acum?.somaBruto,
          somaInssAno: acum?.somaInss,
          somaIrrfRetidoAno: acum?.somaIr,
          brutoAjustado: brutoEfetivo,
          mesesAjustados: mesesEfetivos,
        },
      )

      return {
        id: f.id,
        funcionario_id: f.id,
        nome: f.nome,
        funcao: f.funcao || f.cargo || "Geral",
        cargo: f.cargo || f.funcao || "Geral",
        unidade: f.unidade || "SJE",
        data_admissao: f.data_admissao || null,
        salarioBase,
        mesesProporcionais: mesesEfetivos,
        mesesProporcionaisCalculados: mesesCalculados,
        bruto13: calc.bruto13,
        bruto13Calculado: brutoPadraoCalculado,
        primeiraParcela: calc.primeiraParcela,
        brutoSegundaParcela: calc.brutoSegundaParcela,
        inssSegundaParcela: calc.inssSegundaParcela,
        irrfSegundaParcela: calc.irrfSegundaParcela,
        liquidoSegundaParcela: calc.liquidoSegundaParcela,
        totalLiquido13: calc.totalLiquido13,
        conta: f.conta || "",
        pix: f.pix || "",
        oculto: Boolean(f.oculto),
        editadoMeses: ajuste?.meses !== undefined,
        editadoBruto: ajuste?.bruto !== undefined,
      }
    })
  }, [funcionarios, ano, tabelaOficial, ajustesManuais, acumuladoAnoPorNome])

  // Filtro por busca e colaboradores ocultos
  const linhasFiltradas = useMemo(() => {
    return linhasProcessadas.filter((l) => {
      if (!mostrarOcultos && l.oculto) return false
      if (busca && busca.trim()) {
        const termo = busca.toLowerCase()
        const matchNome = l.nome.toLowerCase().includes(termo)
        const matchPix = l.pix.toLowerCase().includes(termo)
        const matchFuncao = l.funcao.toLowerCase().includes(termo)
        if (!matchNome && !matchPix && !matchFuncao) return false
      }
      return true
    })
  }, [linhasProcessadas, mostrarOcultos, busca])

  // Totais do rodapé
  const totais = useMemo(() => {
    return linhasFiltradas.reduce(
      (acc, l) => ({
        salarioBase: acc.salarioBase + l.salarioBase,
        bruto13: acc.bruto13 + l.bruto13,
        primeiraParcela: acc.primeiraParcela + l.primeiraParcela,
        brutoSegundaParcela: acc.brutoSegundaParcela + l.brutoSegundaParcela,
        inssSegundaParcela: acc.inssSegundaParcela + l.inssSegundaParcela,
        irrfSegundaParcela: acc.irrfSegundaParcela + l.irrfSegundaParcela,
        liquidoSegundaParcela:
          acc.liquidoSegundaParcela + l.liquidoSegundaParcela,
        totalLiquido13: acc.totalLiquido13 + l.totalLiquido13,
      }),
      {
        salarioBase: 0,
        bruto13: 0,
        primeiraParcela: 0,
        brutoSegundaParcela: 0,
        inssSegundaParcela: 0,
        irrfSegundaParcela: 0,
        liquidoSegundaParcela: 0,
        totalLiquido13: 0,
      },
    )
  }, [linhasFiltradas])

  // Funções para editar meses / bruto
  const handleAtualizarMeses = (id: string, mesesVal: number) => {
    const val = Math.max(0, Math.min(12, Math.floor(mesesVal)))
    setAjustesManuais((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        meses: val,
      },
    }))
  }

  const handleAtualizarBruto = (id: string, brutoVal: number) => {
    const val = Math.max(0, Number(brutoVal || 0))
    setAjustesManuais((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        bruto: val,
      },
    }))
  }

  const handleResetLinha = (id: string) => {
    setAjustesManuais((prev) => {
      const copia = { ...prev }
      delete copia[id]
      return copia
    })
  }

  const handleResetTodos = () => {
    setAjustesManuais({})
  }

  return (
    <div className="space-y-4">
      <Card>
        {/* Cabeçalho da Aba 13º */}
        <CardHeader className="py-3 px-4 border-b space-y-3 bg-muted/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Folha do 13º Salário — Exercício {ano}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs uppercase font-bold"
                >
                  {empresaNome}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                1ª Parcela (50% adiantamento até 30/11 sem descontos) e 2ª
                Parcela (em 20/12 com INSS e IRRF na regra anual). Sem
                terceiros.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {Object.keys(ajustesManuais).length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleResetTodos}
                  title="Restaurar todos os cálculos automáticos padrão"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar Automático ({Object.keys(ajustesManuais).length})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={onImprimirA4}
                title="Imprimir Folha do 13º Salário em A4 Paisagem"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir 13º A4
              </Button>
            </div>
          </div>

          {/* Banner de Regras Oficiais */}
          <div className="space-y-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded text-blue-950 dark:text-blue-200">
            <div className="text-[11px] flex flex-wrap items-center gap-2">
              <span className="font-bold">🗓 1ª Parcela (até 30/11):</span>
              <span>50% do bruto proporcional, SEM descontos de INSS/IRRF</span>
              <span>·</span>
              <span className="font-bold">🗓 2ª Parcela (até 20/12):</span>
              <span>
                Bruto 13º − 1ª Parcela, com INSS e IRRF calculados na REGRA
                ANUAL
              </span>
            </div>
            <div className="text-[11px] font-mono bg-background/80 p-2 rounded border border-blue-500/30 text-foreground flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <span className="font-bold text-primary">
                PROPORCIONALIDADE (CLT):
              </span>
              <span>
                1/12 por mês trabalhado no ano. Admissão até o dia 15 conta como
                mês inteiro; admitidos antes de janeiro têm 12/12.
              </span>
              <span className="text-muted-foreground">
                (Base = Salário Bruto, sem produção nem adicionais)
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/80 text-muted-foreground uppercase font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-2 text-center w-8">Nº</th>
                  <th className="py-2.5 px-3 sticky left-0 bg-muted/95 z-10">
                    NOME
                  </th>
                  <th className="py-2.5 px-2">FUNÇÃO</th>
                  <th
                    className="py-2.5 px-2 text-center"
                    title="Data de admissão cadastrada"
                  >
                    ADMISSÃO
                  </th>
                  <th
                    className="py-2.5 px-2 text-center bg-amber-100/40 dark:bg-amber-950/20"
                    title="Meses trabalhados no ano (avos) — editável por linha"
                  >
                    MESES (AVOS)
                  </th>
                  <th
                    className="py-2.5 px-2 text-right bg-amber-100/40 dark:bg-amber-950/20 font-bold"
                    title="Bruto total do 13º = (Salário / 12) * Meses"
                  >
                    BRUTO 13º
                  </th>
                  <th
                    className="py-2.5 px-2 text-right text-blue-700 dark:text-blue-300 font-bold bg-blue-50/50 dark:bg-blue-950/20"
                    title="1ª Parcela (50% do bruto, sem descontos, paga até 30/11)"
                  >
                    1ª PARCELA
                  </th>
                  <th
                    className="py-2.5 px-2 text-right text-red-600"
                    title="INSS descontado na 2ª parcela (tabela progressiva mensal sobre a base do 13º)"
                  >
                    INSS 2ª P. (−)
                  </th>
                  <th
                    className="py-2.5 px-2 text-right text-red-600"
                    title="IRRF descontado na 2ª parcela (regra anual / tributação exclusiva)"
                  >
                    IRRF 2ª P. (−)
                  </th>
                  <th
                    className="py-2.5 px-2 text-right font-bold text-foreground bg-muted/40"
                    title="Líquido a receber na 2ª parcela (Bruto 2ª − INSS − IRRF)"
                  >
                    LÍQUIDO 2ª P.
                  </th>
                  <th
                    className="py-2.5 px-2 text-right font-black text-primary bg-primary/10"
                    title="Total Geral do 13º (1ª Parcela + 2ª Parcela Líquida)"
                  >
                    TOTAL 13º
                  </th>
                  <th className="py-2.5 px-3">CONTA</th>
                  <th className="py-2.5 px-3">PIX</th>
                  <th className="py-2.5 px-2 text-center print:hidden w-16">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum funcionário encontrado para o 13º salário.
                    </td>
                  </tr>
                ) : (
                  linhasFiltradas.map((l, index) => {
                    const temEdicao = l.editadoMeses || l.editadoBruto

                    return (
                      <tr
                        key={l.id}
                        className={`hover:bg-muted/40 transition-colors ${
                          l.oculto ? "bg-amber-500/5 opacity-80" : ""
                        } ${
                          temEdicao ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                        }`}
                      >
                        <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground sticky left-0 bg-background z-10 border-r whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{l.nome}</span>
                            {l.oculto && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-4 text-amber-600 border-amber-300"
                              >
                                Oculto
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[8px] px-1 py-0 h-3.5 ${
                                temEdicao
                                  ? "text-blue-700 bg-blue-100 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                                  : "text-muted-foreground bg-muted/40"
                              }`}
                            >
                              {temEdicao ? "Ajustado" : "Calculado"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                          {l.funcao}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {l.data_admissao
                            ? l.data_admissao.includes("-")
                              ? l.data_admissao.split("-").reverse().join("/")
                              : l.data_admissao
                            : "—"}
                        </td>

                        {/* MESES PROPORCIONAIS (EDITÁVEL) */}
                        <td className="py-1 px-2 text-center bg-amber-50/40 dark:bg-amber-950/10">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="12"
                              step="1"
                              value={l.mesesProporcionais}
                              onChange={(e) =>
                                handleAtualizarMeses(
                                  l.id,
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              className={`h-7 w-14 text-center font-mono text-xs font-bold p-1 ${
                                l.editadoMeses
                                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
                                  : "bg-background"
                              }`}
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">
                              /12
                            </span>
                          </div>
                        </td>

                        {/* BRUTO 13º (EDITÁVEL) */}
                        <td className="py-1 px-2 text-right bg-amber-50/40 dark:bg-amber-950/10 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={l.bruto13}
                              onChange={(e) =>
                                handleAtualizarBruto(
                                  l.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className={`h-7 w-24 text-right font-mono text-xs font-bold p-1 ${
                                l.editadoBruto
                                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40"
                                  : "bg-background"
                              }`}
                            />
                          </div>
                        </td>

                        {/* 1ª PARCELA (50% SEM DESCONTOS) */}
                        <td className="py-2 px-2 text-right font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/10 whitespace-nowrap">
                          {fmtMoeda(l.primeiraParcela)}
                        </td>

                        {/* INSS 2ª PARCELA */}
                        <td className="py-2 px-2 text-right font-mono text-red-600 whitespace-nowrap">
                          {l.inssSegundaParcela > 0
                            ? `−${fmtMoeda(l.inssSegundaParcela)}`
                            : fmtMoeda(0)}
                        </td>

                        {/* IRRF 2ª PARCELA */}
                        <td className="py-2 px-2 text-right font-mono text-red-600 whitespace-nowrap">
                          {l.irrfSegundaParcela > 0
                            ? `−${fmtMoeda(l.irrfSegundaParcela)}`
                            : fmtMoeda(0)}
                        </td>

                        {/* LÍQUIDO 2ª PARCELA */}
                        <td className="py-2 px-2 text-right font-mono font-bold text-foreground bg-muted/30 whitespace-nowrap">
                          {fmtMoeda(l.liquidoSegundaParcela)}
                        </td>

                        {/* TOTAL LÍQUIDO 13º */}
                        <td className="py-2 px-2 text-right font-mono font-black text-primary bg-primary/10 whitespace-nowrap">
                          {fmtMoeda(l.totalLiquido13)}
                        </td>

                        {/* CONTA & PIX */}
                        <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {l.conta || "—"}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {l.pix || "—"}
                        </td>

                        {/* AÇÃO RESET */}
                        <td className="py-2 px-2 text-center print:hidden">
                          {temEdicao && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleResetLinha(l.id)}
                              title="Restaurar valor automático desta linha"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* RODAPÉ TOTALIZADOR */}
              <tfoot className="bg-muted/90 font-bold border-t-2 text-foreground">
                <tr>
                  <td className="py-2.5 px-2 text-center">—</td>
                  <td className="py-2.5 px-3 sticky left-0 bg-muted z-10 border-r uppercase">
                    TOTAL GERAL 13º ({linhasFiltradas.length})
                  </td>
                  <td className="py-2.5 px-2">—</td>
                  <td className="py-2.5 px-2 text-center">—</td>
                  <td className="py-2.5 px-2 text-center">—</td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {fmtMoeda(totais.bruto13)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-blue-700 dark:text-blue-300">
                    {fmtMoeda(totais.primeiraParcela)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-red-600">
                    {totais.inssSegundaParcela > 0
                      ? `−${fmtMoeda(totais.inssSegundaParcela)}`
                      : fmtMoeda(0)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-red-600">
                    {totais.irrfSegundaParcela > 0
                      ? `−${fmtMoeda(totais.irrfSegundaParcela)}`
                      : fmtMoeda(0)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {fmtMoeda(totais.liquidoSegundaParcela)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-primary text-sm font-black">
                    {fmtMoeda(totais.totalLiquido13)}
                  </td>
                  <td className="py-2.5 px-3" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
