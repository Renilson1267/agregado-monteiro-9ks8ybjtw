// Configurações, mensagens e helpers para aviso e pedido automático de cimento via WhatsApp

export const FORNECEDOR_CIMENTO = {
  contato: "Raquel",
  telefoneWhatsApp: "558496126767",
  telefoneFormatado: "(84) 9612-6767",
  cnpj: "33.534.028/0001-68",
  produto: "CP V ARI RS",
  cif: "CIF 35T",
  produtoCompleto: "CP V ARI RS — CIF 35T",
}

// Limite estipulado pelo usuário para disparar o aviso de pedido automático de cimento
export const LIMITE_AVISO_PEDIDO_CIMENTO_KG = 20000

// Quantidade padrão de uma carreta granel de cimento para entrega tipo CIF 35T
export const CARRETA_PADRAO_CIMENTO_KG = 35000

export interface DadosPedidoCimento {
  unidadeNome: string
  saldoAtualKg: number
  estoqueMinimoKg: number
}

/**
 * Calcula os parâmetros de reposição para compor a mensagem do pedido
 */
export function calcularNecessidadePedidoCimento({
  saldoAtualKg,
  estoqueMinimoKg,
}: {
  saldoAtualKg: number
  estoqueMinimoKg: number
}) {
  const saldo = Math.max(0, Math.round(saldoAtualKg))
  const minimo = Math.max(0, Math.round(estoqueMinimoKg))
  const defasagemMinimoKg = Math.max(0, minimo - saldo)

  // Sugestão para recompor:
  // Se estiver abaixo do mínimo, precisa recompor no mínimo a defasagem.
  // Como o fornecimento é CIF 35T (carreta de 35 toneladas = 35.000 kg),
  // sugerimos a carga padrão de 35.000 kg (1 carreta CIF 35T) ou o múltiplo necessário se a defasagem for maior.
  const carretasSugeridas = Math.max(
    1,
    Math.ceil(defasagemMinimoKg / CARRETA_PADRAO_CIMENTO_KG),
  )
  const sugeridoKg = carretasSugeridas * CARRETA_PADRAO_CIMENTO_KG

  return {
    saldo,
    minimo,
    defasagemMinimoKg,
    sugeridoKg,
    carretasSugeridas,
  }
}

/**
 * Monta o texto pronto da mensagem do WhatsApp conforme especificado:
 * - Título: Pedido de cimento — [UNIDADE]
 * - Produto: CP V ARI RS — CIF 35T
 * - Contato Raquel, CNPJ 33.534.028/0001-68
 * - Saldo atual em kg
 * - Quanto falta para recompor o mínimo da unidade (Monteiro 15.000 kg; SJE conforme mínimo cadastrado)
 * - Sugestão de quantidade para recompor o mínimo (ex.: 35.000 kg / 1 carreta CIF 35T)
 */
export function gerarTextoWhatsAppPedidoCimento(
  dados: DadosPedidoCimento,
): string {
  const { saldo, minimo, defasagemMinimoKg, sugeridoKg, carretasSugeridas } =
    calcularNecessidadePedidoCimento(dados)

  const saldoFormatado = `${saldo.toLocaleString("pt-BR")} kg (${(saldo / 1000).toFixed(2)} t)`
  const minimoFormatado = `${minimo.toLocaleString("pt-BR")} kg (${(minimo / 1000).toFixed(2)} t)`
  const faltaFormatado =
    defasagemMinimoKg > 0
      ? `${defasagemMinimoKg.toLocaleString("pt-BR")} kg (${(defasagemMinimoKg / 1000).toFixed(2)} t)`
      : `0 kg (estoque em ${saldoFormatado}, com limite operacional de ${LIMITE_AVISO_PEDIDO_CIMENTO_KG.toLocaleString("pt-BR")} kg)`

  const sugeridoFormatado = `${sugeridoKg.toLocaleString("pt-BR")} kg (${(sugeridoKg / 1000).toFixed(0)} t — ${carretasSugeridas} carreta${
    carretasSugeridas > 1 ? "s" : ""
  } ${FORNECEDOR_CIMENTO.cif})`

  const linhas = [
    `*Pedido de cimento — ${dados.unidadeNome.toUpperCase()}*`,
    ``,
    `Olá ${FORNECEDOR_CIMENTO.contato},`,
    `Gostaríamos de programar um novo pedido de cimento para nossa unidade:`,
    ``,
    `📦 *Produto:* ${FORNECEDOR_CIMENTO.produtoCompleto}`,
    `🏢 *Unidade:* ${dados.unidadeNome}`,
    `📄 *CNPJ do Fornecedor:* ${FORNECEDOR_CIMENTO.cnpj}`,
    ``,
    `📊 *Posição Operacional do Silo:*`,
    `• *Saldo atual:* ${saldoFormatado}`,
    `• *Estoque mínimo da unidade:* ${minimoFormatado}`,
    `• *Falta p/ recompor mínimo:* ${faltaFormatado}`,
    `• *Quantidade sugerida:* ${sugeridoFormatado}`,
    ``,
    `Favor confirmar disponibilidade e previsão de entrega.`,
    `Muito obrigado!`,
  ]

  return linhas.join("\n")
}

/**
 * Gera o link wa.me pronto com número e texto codificado
 */
export function gerarLinkWhatsAppPedidoCimento(
  dados: DadosPedidoCimento,
): string {
  const texto = gerarTextoWhatsAppPedidoCimento(dados)
  return `https://wa.me/${FORNECEDOR_CIMENTO.telefoneWhatsApp}?text=${encodeURIComponent(texto)}`
}
