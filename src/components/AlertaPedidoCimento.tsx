import React from "react"
import {
  AlertTriangle,
  Send,
  PhoneCall,
  Building2,
  PackageCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FORNECEDOR_CIMENTO,
  LIMITE_AVISO_PEDIDO_CIMENTO_KG,
  DadosPedidoCimento,
  calcularNecessidadePedidoCimento,
  gerarLinkWhatsAppPedidoCimento,
} from "@/lib/pedido-cimento"

interface AlertaPedidoCimentoProps {
  unidadeNome: string
  saldoAtualKg: number
  estoqueMinimoKg: number
  /** Se 'compacto', exibe versão em barra estreita; se 'card', exibe card completo de destaque */
  variante?: "compacto" | "card"
  className?: string
}

export const AlertaPedidoCimento: React.FC<AlertaPedidoCimentoProps> = ({
  unidadeNome,
  saldoAtualKg,
  estoqueMinimoKg,
  variante = "card",
  className = "",
}) => {
  // Se saldo >= 20.000 kg, nenhum aviso aparece (requisito 3)
  if (saldoAtualKg >= LIMITE_AVISO_PEDIDO_CIMENTO_KG) {
    return null
  }

  const { saldo, minimo, defasagemMinimoKg, sugeridoKg, carretasSugeridas } =
    calcularNecessidadePedidoCimento({
      saldoAtualKg,
      estoqueMinimoKg,
    })

  const linkWhatsApp = gerarLinkWhatsAppPedidoCimento({
    unidadeNome,
    saldoAtualKg,
    estoqueMinimoKg,
  })

  const handlePedirWhatsApp = () => {
    window.open(linkWhatsApp, "_blank", "noopener,noreferrer")
  }

  if (variante === "compacto") {
    return (
      <div
        className={`rounded-xl border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-amber-500 text-amber-950 shrink-0 font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-foreground">
                ⚠️ Cimento abaixo de 20.000 kg — fazer pedido
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold"
              >
                {unidadeNome}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Saldo:{" "}
              <strong className="text-destructive font-mono font-bold">
                {saldo.toLocaleString("pt-BR")} kg
              </strong>{" "}
              ({(saldo / 1000).toFixed(2)} t) • Sugerido:{" "}
              <strong className="text-foreground font-mono">
                {sugeridoKg.toLocaleString("pt-BR")} kg
              </strong>{" "}
              ({FORNECEDOR_CIMENTO.produtoCompleto})
            </p>
          </div>
        </div>

        <Button
          onClick={handlePedirWhatsApp}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shrink-0 shadow-sm w-full sm:w-auto"
        >
          <Send className="w-3.5 h-3.5" />
          Pedir pelo WhatsApp
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 dark:from-amber-500/20 dark:via-amber-500/10 dark:to-orange-500/20 p-4 sm:p-5 shadow-sm relative overflow-hidden ${className}`}
      role="alert"
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Mensagem e Posição */}
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-amber-500 text-amber-950">
              <AlertTriangle className="w-3.5 h-3.5" />
              Alerta de Reposição Crítica
            </span>
            <Badge
              variant="outline"
              className="text-xs font-bold border-amber-600/40 text-amber-800 dark:text-amber-200 bg-amber-500/10"
            >
              <Building2 className="w-3 h-3 mr-1" />
              {unidadeNome}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground border-border/50"
            >
              Limite Operacional:{" "}
              {LIMITE_AVISO_PEDIDO_CIMENTO_KG.toLocaleString("pt-BR")} kg
            </Badge>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2 flex-wrap">
              <span>⚠️ Cimento abaixo de 20.000 kg — fazer pedido</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              O saldo do silo de cimento atingiu o ponto de ressuprimento.
              Dispare o pedido automático com o fornecedor via WhatsApp com 1
              clique.
            </p>
          </div>

          {/* Destaque das Métricas Operacionais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Saldo Atual
              </span>
              <span className="text-base font-black font-mono text-destructive">
                {saldo.toLocaleString("pt-BR")}{" "}
                <span className="text-xs font-normal">kg</span>
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {(saldo / 1000).toFixed(2)} t
              </span>
            </div>

            <div className="p-2 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Estoque Mínimo
              </span>
              <span className="text-base font-black font-mono text-foreground">
                {minimo.toLocaleString("pt-BR")}{" "}
                <span className="text-xs font-normal">kg</span>
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {(minimo / 1000).toFixed(2)} t
              </span>
            </div>

            <div className="p-2 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Falta p/ Mínimo
              </span>
              <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                {defasagemMinimoKg > 0
                  ? defasagemMinimoKg.toLocaleString("pt-BR")
                  : "0"}{" "}
                <span className="text-xs font-normal">kg</span>
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {defasagemMinimoKg > 0
                  ? `${(defasagemMinimoKg / 1000).toFixed(2)} t`
                  : "no limite"}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 block">
                Pedido Sugerido
              </span>
              <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                {sugeridoKg.toLocaleString("pt-BR")}{" "}
                <span className="text-xs font-normal">kg</span>
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-semibold">
                {carretasSugeridas} carreta ({FORNECEDOR_CIMENTO.cif})
              </span>
            </div>
          </div>

          {/* Dados do Fornecedor / Produto */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <PackageCheck className="w-3.5 h-3.5 text-primary" />
              {FORNECEDOR_CIMENTO.produtoCompleto}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              Contato: <strong>{FORNECEDOR_CIMENTO.contato}</strong> (
              {FORNECEDOR_CIMENTO.telefoneFormatado})
            </span>
            <span>•</span>
            <span className="font-mono text-[10px]">
              CNPJ: {FORNECEDOR_CIMENTO.cnpj}
            </span>
          </div>
        </div>

        {/* Lado Direito: Ação de Pedido */}
        <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end justify-center gap-2 pt-2 lg:pt-0 shrink-0">
          <Button
            onClick={handlePedirWhatsApp}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm gap-2 shadow-md hover:shadow-lg transition-all h-11 px-5"
          >
            <Send className="w-4 h-4" />
            Pedir pelo WhatsApp
          </Button>
          <span className="text-[10px] text-muted-foreground text-center lg:text-right font-mono">
            Abre wa.me com a mensagem pronta
          </span>
        </div>
      </div>
    </div>
  )
}
