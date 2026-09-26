/**
 * Helper para parse de XML de NF-e (Nota Fiscal Eletrônica) / NFC-e / CF-e
 * Executado 100% no cliente via DOMParser.
 */

export interface ItemNFe {
  numeroItem: number
  cProd: string
  xProd: string
  NCM?: string
  uCom: string
  qCom: number
  vUnCom: number
  vProd: number
}

export interface DadosNFe {
  chaveAcesso?: string
  numeroNota?: string
  serie?: string
  dataEmissao?: string // formato YYYY-MM-DD
  dataEmissaoFormatada?: string // DD/MM/YYYY
  mesAno?: string // MM/YYYY
  emitenteNome?: string
  emitenteCNPJ?: string
  destinatarioNome?: string
  valorTotalNota: number // tag vNF
  itens: ItemNFe[]
}

/**
 * Normaliza textos XML extraindo o conteúdo de uma tag (case insensitive / ignorando namespaces)
 */
function getTagText(parent: Element | Document, tagName: string): string {
  // Procura por tagName direto ou por localName para contornar namespaces como nfe:infNFe
  const el =
    parent.getElementsByTagName(tagName)[0] ||
    Array.from(parent.getElementsByTagName('*')).find(
      (node) => node.localName?.toLowerCase() === tagName.toLowerCase(),
    )
  return el ? el.textContent?.trim() || '' : ''
}

/**
 * Converte valor numérico formatado em padrão XML (ponto decimal)
 */
function parseNumero(str: string): number {
  if (!str) return 0
  const clean = str.replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

/**
 * Faz o parse da string XML da NF-e
 */
export function parseNFeXML(xmlString: string): DadosNFe {
  if (!xmlString || typeof xmlString !== 'string' || !xmlString.trim()) {
    throw new Error('O conteúdo XML informado está vazio.')
  }

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  // Verifica erro de parse de XML
  const parserError = xmlDoc.getElementsByTagName('parsererror')[0]
  if (parserError) {
    throw new Error(
      'Não foi possível ler o arquivo XML. O formato é inválido ou está corrompido.',
    )
  }

  // Verifica se é um documento de NF-e / NFC-e / CFe (busca infNFe ou infCFe ou infMDFe)
  const allElements = Array.from(xmlDoc.getElementsByTagName('*'))
  const infNFeNode = allElements.find(
    (el) =>
      el.localName?.toLowerCase() === 'infnfe' ||
      el.localName?.toLowerCase() === 'infcfe',
  )

  if (!infNFeNode) {
    // Tenta encontrar tags essenciais como vNF ou det
    const temVNF = allElements.some(
      (el) => el.localName?.toLowerCase() === 'vnf',
    )
    const temDet = allElements.some(
      (el) => el.localName?.toLowerCase() === 'det',
    )

    if (!temVNF && !temDet) {
      throw new Error(
        'O XML enviado não aparenta ser uma NF-e ou CF-e válida (tag infNFe/infCFe não encontrada).',
      )
    }
  }

  // Identificação da Nota
  const ideNode = allElements.find(
    (el) => el.localName?.toLowerCase() === 'ide',
  )
  const nNF = ideNode ? getTagText(ideNode, 'nNF') : getTagText(xmlDoc, 'nNF')
  const serie = ideNode
    ? getTagText(ideNode, 'serie')
    : getTagText(xmlDoc, 'serie')

  // Data de emissão: dhEmi (ex: 2026-09-20T10:30:00-03:00) ou dEmi (2026-09-20)
  let rawData = ideNode
    ? getTagText(ideNode, 'dhEmi') || getTagText(ideNode, 'dEmi')
    : getTagText(xmlDoc, 'dhEmi') || getTagText(xmlDoc, 'dEmi')

  let dataEmissao: string | undefined
  let dataEmissaoFormatada: string | undefined
  let mesAno: string | undefined

  if (rawData) {
    // Pega os primeiros 10 caracteres no formato YYYY-MM-DD
    const dateMatch = rawData.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      const [, ano, mes, dia] = dateMatch
      dataEmissao = `${ano}-${mes}-${dia}`
      dataEmissaoFormatada = `${dia}/${mes}/${ano}`
      mesAno = `${mes}/${ano}`
    }
  }

  // Se não extraiu data, usa data atual
  if (!dataEmissao) {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const dia = String(hoje.getDate()).padStart(2, '0')
    dataEmissao = `${ano}-${mes}-${dia}`
    dataEmissaoFormatada = `${dia}/${mes}/${ano}`
    mesAno = `${mes}/${ano}`
  }

  // Emitente
  const emitNode = allElements.find(
    (el) => el.localName?.toLowerCase() === 'emit',
  )
  const emitenteNome = emitNode
    ? getTagText(emitNode, 'xNome')
    : getTagText(xmlDoc, 'xNome')
  const emitenteCNPJ = emitNode
    ? getTagText(emitNode, 'CNPJ') || getTagText(emitNode, 'CPF')
    : ''

  // Total da nota (tag vNF dentro de total/ICMSTot ou similar)
  let valorTotalNota = 0
  const vNFStr = getTagText(xmlDoc, 'vNF')
  if (vNFStr) {
    valorTotalNota = parseNumero(vNFStr)
  }

  // Itens da nota (tags <det>)
  const detNodes = allElements.filter(
    (el) => el.localName?.toLowerCase() === 'det',
  )
  const itens: ItemNFe[] = []

  let somaItens = 0

  detNodes.forEach((detNode, index) => {
    const prodNode = Array.from(detNode.children).find(
      (c) => c.localName?.toLowerCase() === 'prod',
    )
    if (!prodNode) return

    const cProd = getTagText(prodNode, 'cProd')
    const xProd = getTagText(prodNode, 'xProd')
    const NCM = getTagText(prodNode, 'NCM')
    const uCom = getTagText(prodNode, 'uCom')
    const qCom = parseNumero(getTagText(prodNode, 'qCom'))
    const vUnCom = parseNumero(getTagText(prodNode, 'vUnCom'))
    const vProd = parseNumero(getTagText(prodNode, 'vProd'))

    somaItens += vProd

    itens.push({
      numeroItem: index + 1,
      cProd,
      xProd,
      NCM,
      uCom,
      qCom,
      vUnCom,
      vProd,
    })
  })

  // Se vNF estiver zerado ou ausente, usar a soma dos vProd dos itens
  if (valorTotalNota <= 0 && somaItens > 0) {
    valorTotalNota = somaItens
  }

  if (itens.length === 0 && valorTotalNota <= 0) {
    throw new Error(
      'Não foram encontrados produtos nem valores válidos no XML da NF-e.',
    )
  }

  return {
    numeroNota: nNF,
    serie,
    dataEmissao,
    dataEmissaoFormatada,
    mesAno,
    emitenteNome,
    emitenteCNPJ,
    valorTotalNota,
    itens,
  }
}

/**
 * Normaliza a unidade lida do XML para bater com o padrão de compra da concreteira:
 * - 'kg', 'kilos', 'quilograma' -> 'kg'
 * - 'ton', 't', 'tonelada', 'toneladas', 'sc', 'saco', 'sacos' -> 'tonelada' ou 'kg'
 * - 'm3', 'm³', 'metro cubico', 'mt3' -> 'm3'
 * - 'l', 'lt', 'lts', 'litro', 'litros' -> 'litros'
 */
export function normalizarUnidadeXml(uCom: string): {
  unidade: 'kg' | 'tonelada' | 'm3' | 'litros'
  multiplicadorParaKg?: number
} {
  const u = (uCom || '').trim().toLowerCase()

  if (
    u === 'ton' ||
    u === 't' ||
    u === 'tonelada' ||
    u === 'toneladas' ||
    u === 'to'
  ) {
    return { unidade: 'tonelada', multiplicadorParaKg: 1000 }
  }
  if (u === 'm3' || u === 'm³' || u.includes('cub') || u === 'mt3') {
    return { unidade: 'm3' }
  }
  if (
    u === 'l' ||
    u === 'lt' ||
    u === 'lts' ||
    u === 'litro' ||
    u === 'litros'
  ) {
    return { unidade: 'litros' }
  }
  // Saco de 50kg comum em cimento
  if (u === 'sc' || u === 'saco' || u === 'sacos' || u === 'sc50') {
    return { unidade: 'kg', multiplicadorParaKg: 50 }
  }

  // Padrão kg
  return { unidade: 'kg', multiplicadorParaKg: 1 }
}

/**
 * Sugere o item do XML que mais se aproxima do material da concreteira
 */
export function sugerirItemParaMaterial(
  materialCodigo: string,
  materialNome: string,
  itens: ItemNFe[],
): ItemNFe | null {
  if (!itens || itens.length === 0) return null
  if (itens.length === 1) return itens[0]

  const termMatch = (str: string, termos: string[]) => {
    const s = str.toLowerCase()
    return termos.some((t) => s.includes(t.toLowerCase()))
  }

  if (materialCodigo === 'cimento') {
    const match = itens.find((it) =>
      termMatch(it.xProd, [
        'cimento',
        'cp ii',
        'cp v',
        'ari',
        'f-40',
        'cp-ii',
        'cp-v',
      ]),
    )
    if (match) return match
  }

  if (materialCodigo === 'aditivo') {
    const match = itens.find((it) =>
      termMatch(it.xProd, [
        'aditivo',
        'plastificante',
        'polifuncional',
        'superplastificante',
      ]),
    )
    if (match) return match
  }

  if (materialCodigo === 'areia') {
    const match = itens.find((it) =>
      termMatch(it.xProd, ['areia', 'lavada', 'media', 'média']),
    )
    if (match) return match
  }

  if (materialCodigo === 'brita12') {
    const match = itens.find((it) =>
      termMatch(it.xProd, ['brita 1', 'brita 12', 'pedra 1', 'brita 01']),
    )
    if (match) return match
  }

  if (materialCodigo === 'brita19') {
    const match = itens.find((it) =>
      termMatch(it.xProd, ['brita 2', 'brita 19', 'pedra 2', 'brita 02']),
    )
    if (match) return match
  }

  if (materialCodigo === 'po_pedra') {
    const match = itens.find((it) =>
      termMatch(it.xProd, ['po', 'pó', 'pedra', 'pedrisco']),
    )
    if (match) return match
  }

  // Tenta pelo próprio nome do material
  const matchNome = itens.find((it) =>
    termMatch(it.xProd, [materialNome.toLowerCase()]),
  )
  if (matchNome) return matchNome

  return itens[0]
}
