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

export interface DadosEmpresaPedidoCimento {
  razao_social?: string | null
  cnpj?: string | null
  cidade?: string | null
  uf?: string | null
  nome?: string | null
}

export interface DadosPedidoCimento {
  unidadeNome?: string
  saldoAtualKg?: number
  estoqueMinimoKg?: number
  empresa?: DadosEmpresaPedidoCimento | null
  dataSolicitacao?: Date
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
 * Formata data no formato dd/mm/aaaa
 */
export function formatarDataBr(data: Date): string {
  const d = String(data.getDate()).padStart(2, "0")
  const m = String(data.getMonth() + 1).padStart(2, "0")
  const a = data.getFullYear()
  return `${d}/${m}/${a}`
}

/**
 * Calcula a data de entrega = SEMPRE o dia seguinte à data da solicitação
 */
export function calcularDataEntregaDiaSeguinte(
  solicitacao: Date = new Date(),
): string {
  const diaSeguinte = new Date(solicitacao)
  diaSeguinte.setDate(diaSeguinte.getDate() + 1)
  return formatarDataBr(diaSeguinte)
}

/**
 * Monta o texto pronto da mensagem do WhatsApp conforme modelo exato do usuário:
 *
 * "Raquel Bom dia consegue?
 * [razão social da empresa].
 * [CNPJ]
 * [cidade] [UF]
 * CP V ARI RS - CIF
 * 35T
 * [data de entrega = dia seguinte à solicitação, dd/mm/aaaa]"
 *
 * Se algum dado do cadastro estiver faltando, omite a linha com graciosidade (sem "undefined").
 * SEM detalhes de silo/saldo/mínimo/defasagem — só o pedido direto.
 */
export function gerarTextoWhatsAppPedidoCimento(
  dados: DadosPedidoCimento,
): string {
  const emp = dados.empresa
  const razaoCru = emp?.razao_social?.trim() || dados.unidadeNome?.trim() || ""
  // Razão social seguida de ponto final (se já terminar com ponto não duplicar)
  const razaoSocial = razaoCru
    ? razaoCru.endsWith(".")
      ? razaoCru
      : `${razaoCru}.`
    : ""

  const cnpj = emp?.cnpj?.trim() || ""

  const cidade = emp?.cidade?.trim() || ""
  const uf = emp?.uf?.trim() || ""
  const cidadeUf = cidade && uf ? `${cidade} ${uf}` : cidade || uf || ""

  const dataEntrega = calcularDataEntregaDiaSeguinte(dados.dataSolicitacao)

  const linhas: string[] = ["Raquel Bom dia consegue?"]

  if (razaoSocial) {
    linhas.push(razaoSocial)
  }
  if (cnpj) {
    linhas.push(cnpj)
  }
  if (cidadeUf) {
    linhas.push(cidadeUf)
  }

  linhas.push("CP V ARI RS - CIF")
  linhas.push("35T")
  linhas.push(dataEntrega)

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
