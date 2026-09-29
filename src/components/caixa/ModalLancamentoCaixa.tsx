import React, { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, Plus, Loader2 } from "lucide-react"
import {
  CaixaCategoria,
  CaixaLancamento,
  Obra,
  TipoCaixaLancamento,
} from "@/types/caixa"
import { CaixaService } from "@/services/caixa"

interface ModalLancamentoCaixaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  lancamentoEmEdicao: CaixaLancamento | null
  categorias: CaixaCategoria[]
  obras: Obra[]
  competenciaPadrao: string
  onSalvo: () => void
}

export function ModalLancamentoCaixa({
  open,
  onOpenChange,
  empresaId,
  lancamentoEmEdicao,
  categorias,
  obras,
  competenciaPadrao,
  onSalvo,
}: ModalLancamentoCaixaProps) {
  const [tipo, setTipo] = useState<TipoCaixaLancamento>("saida")
  const [data, setData] = useState<string>(
    new Date().toISOString().substring(0, 10),
  )
  const [competencia, setCompetencia] = useState<string>(competenciaPadrao)
  const [categoria, setCategoria] = useState<string>("")
  const [descricao, setDescricao] = useState<string>("")
  const [valor, setValor] = useState<string>("")
  const [obraId, setObraId] = useState<string>("nenhuma")
  const [formaPagamento, setFormaPagamento] = useState<string>("PIX")
  const [documentoRef, setDocumentoRef] = useState<string>("")
  const [observacao, setObservacao] = useState<string>("")
  const [salvando, setSalvando] = useState<boolean>(false)
  const [erro, setErro] = useState<string | null>(null)

  // Sincronizar form quando abrir para edição ou novo
  useEffect(() => {
    if (lancamentoEmEdicao) {
      setTipo(lancamentoEmEdicao.tipo)
      setData(lancamentoEmEdicao.data)
      setCompetencia(lancamentoEmEdicao.competencia)
      setCategoria(lancamentoEmEdicao.categoria)
      setDescricao(lancamentoEmEdicao.descricao)
      setValor(lancamentoEmEdicao.valor.toString())
      setObraId(lancamentoEmEdicao.obra_id || "nenhuma")
      setFormaPagamento(lancamentoEmEdicao.forma_pagamento || "PIX")
      setDocumentoRef(lancamentoEmEdicao.documento_ref || "")
      setObservacao(lancamentoEmEdicao.observacao || "")
    } else {
      const hoje = new Date().toISOString().substring(0, 10)
      setTipo("saida")
      setData(hoje)
      setCompetencia(competenciaPadrao || hoje.substring(0, 7))
      setCategoria("")
      setDescricao("")
      setValor("")
      setObraId("nenhuma")
      setFormaPagamento("PIX")
      setDocumentoRef("")
      setObservacao("")
    }
    setErro(null)
  }, [lancamentoEmEdicao, open, competenciaPadrao])

  // Filtrar categorias pelo tipo
  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo)

  const handleDataChange = (novaData: string) => {
    setData(novaData)
    if (novaData && novaData.length >= 7) {
      setCompetencia(novaData.substring(0, 7))
    }
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const vNum = parseFloat(valor.replace(",", "."))
    if (isNaN(vNum) || vNum <= 0) {
      setErro("Informe um valor válido maior que zero.")
      return
    }

    if (!descricao.trim()) {
      setErro("Informe a descrição do lançamento.")
      return
    }

    if (!categoria.trim()) {
      setErro("Selecione ou informe a categoria.")
      return
    }

    setSalvando(true)
    try {
      let nomeObra: string | null = null
      if (obraId && obraId !== "nenhuma") {
        const ob = obras.find((o) => o.id === obraId)
        nomeObra = ob ? ob.nome : null
      }

      await CaixaService.salvarLancamento({
        id: lancamentoEmEdicao?.id,
        empresa_id: empresaId,
        data,
        competencia,
        tipo,
        categoria,
        descricao,
        valor: vNum,
        obra_id: obraId !== "nenhuma" ? obraId : null,
        obra_nome: nomeObra,
        forma_pagamento: formaPagamento,
        documento_ref: documentoRef || null,
        observacao: observacao || null,
      })

      onSalvo()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setErro(err.message || "Erro ao salvar lançamento.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              {lancamentoEmEdicao
                ? "Editar Lançamento"
                : "Novo Lançamento no Caixa"}
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                tipo === "entrada"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
              }
            >
              {tipo === "entrada" ? "Entrada (+)" : "Saída (-)"}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Registre entradas de recebimentos ou saídas de despesas com vínculo
            a obras e competência.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 pt-2">
          {erro && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
              {erro}
            </div>
          )}

          {/* Seletor Tipo: Entrada ou Saída */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === "entrada" ? "default" : "outline"}
              onClick={() => {
                setTipo("entrada")
                setCategoria("")
              }}
              className={
                tipo === "entrada"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  : "hover:text-emerald-600"
              }
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Entrada (Receita)
            </Button>
            <Button
              type="button"
              variant={tipo === "saida" ? "default" : "outline"}
              onClick={() => {
                setTipo("saida")
                setCategoria("")
              }}
              className={
                tipo === "saida"
                  ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  : "hover:text-rose-600"
              }
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Saída (Despesa)
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Data do Lançamento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Data do Lançamento *
              </Label>
              <Input
                type="date"
                required
                value={data}
                onChange={(e) => handleDataChange(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Competência Automática mas editável */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Competência (Mês/Ano) *
                </Label>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  Calculado
                </Badge>
              </div>
              <Input
                type="month"
                required
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Categoria *</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nome} className="text-xs">
                    {cat.nome}
                  </SelectItem>
                ))}
                {tipo === "entrada" && (
                  <SelectItem value="Recebimento de Obra" className="text-xs">
                    Recebimento de Obra
                  </SelectItem>
                )}
                {tipo === "saida" && (
                  <SelectItem
                    value="Insumos (Cimento/Areia/Brita/Aditivo)"
                    className="text-xs"
                  >
                    Insumos (Cimento/Areia/Brita/Aditivo)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">
                Descrição / Histórico *
              </Label>
              <Input
                placeholder="Ex: Recebimento medição obra COSAMPA lote 2"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Obra Vinculada (Opcional, mas crucial para relatórios de obras) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Obra Vinculada (Opcional)
              </Label>
              <Select value={obraId} onValueChange={setObraId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Vincular a uma obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="nenhuma"
                    className="text-xs text-muted-foreground"
                  >
                    (Sem vínculo de obra)
                  </SelectItem>
                  {obras.map((ob) => (
                    <SelectItem key={ob.id} value={ob.id} className="text-xs">
                      {ob.nome} {ob.cidade ? `(${ob.cidade})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Forma de Pagamento
              </Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX" className="text-xs">
                    PIX
                  </SelectItem>
                  <SelectItem value="TED / Transferência" className="text-xs">
                    TED / Transferência
                  </SelectItem>
                  <SelectItem value="Boleto Bancário" className="text-xs">
                    Boleto Bancário
                  </SelectItem>
                  <SelectItem value="Dinheiro em Espécie" className="text-xs">
                    Dinheiro em Espécie
                  </SelectItem>
                  <SelectItem value="Cartão Débito/Crédito" className="text-xs">
                    Cartão Débito/Crédito
                  </SelectItem>
                  <SelectItem value="Cheque" className="text-xs">
                    Cheque
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documento / Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Doc. / NF / Comprovante
              </Label>
              <Input
                placeholder="Ex: NF-e 1245 ou Compr. 987"
                value={documentoRef}
                onChange={(e) => setDocumentoRef(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Observação Complementar
              </Label>
              <Input
                placeholder="Detalhes adicionais..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {lancamentoEmEdicao
                    ? "Atualizar Lançamento"
                    : "Confirmar Lançamento"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
