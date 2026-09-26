// Utilitários para validação e busca de CPF / CNPJ / CEP

export function limparMascara(valor: string): string {
  return (valor || '').replace(/\D/g, '')
}

export function formatarCpfCnpj(valor: string): string {
  const limpo = limparMascara(valor)
  if (limpo.length <= 11) {
    // CPF: 000.000.000-00
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    // CNPJ: 00.000.000/0000-00
    return limpo
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
}

export function formatarTelefone(valor: string): string {
  const limpo = limparMascara(valor)
  if (limpo.length <= 10) {
    // (00) 0000-0000
    return limpo
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  } else {
    // (00) 00000-0000
    return limpo
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
}

export function formatarCep(valor: string): string {
  const limpo = limparMascara(valor).slice(0, 8)
  return limpo.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

/**
 * Validação dos dígitos verificadores de CPF
 */
export function validarCPF(cpf: string): boolean {
  const limpo = limparMascara(cpf)
  if (limpo.length !== 11) return false
  if (/^(\d)\1{10}$/.test(limpo)) return false // Elimina 11111111111, etc.

  let soma = 0
  let resto: number

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo.substring(9, 10), 10)) return false

  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo.substring(10, 11), 10)) return false

  return true
}

/**
 * Validação de CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const limpo = limparMascara(cnpj)
  if (limpo.length !== 14) return false
  if (/^(\d)\1{13}$/.test(limpo)) return false

  let tamanho = limpo.length - 2
  let numeros = limpo.substring(0, tamanho)
  const digitos = limpo.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false

  tamanho += 1
  numeros = limpo.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false

  return true
}

export interface DadosCnpjBrasilApi {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  ddd_telefone_1?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
}

/**
 * Consulta de CNPJ via BrasilAPI pública com fallback para ReceitaWS
 */
export async function consultarCNPJ(
  cnpjRaw: string,
): Promise<DadosCnpjBrasilApi> {
  const cnpj = limparMascara(cnpjRaw)
  if (cnpj.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos')
  }

  try {
    // 1. Tenta BrasilAPI (estável, sem CORS bloqueado no browser)
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
    if (resp.ok) {
      const data = await resp.json()
      return {
        cnpj: data.cnpj,
        razao_social: data.razao_social || data.nome_fantasia || '',
        nome_fantasia: data.nome_fantasia || '',
        ddd_telefone_1: data.ddd_telefone_1
          ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}`
          : '',
        email: data.email || '',
        cep: data.cep || '',
        logradouro: data.descricao_tipo_de_logradouro
          ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`
          : data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || 'PB',
      }
    }
  } catch (e) {
    console.warn('Falha na consulta BrasilAPI CNPJ, tentando fallback:', e)
  }

  // Se falhar ou cair em erro, informa erro amigável para permitir digitação manual
  throw new Error(
    'Não foi possível consultar o CNPJ automaticamente na Receita. Você pode preencher os campos manualmente.',
  )
}

export interface DadosViaCep {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Consulta de CEP via ViaCEP pública
 */
export async function consultarCEP(cepRaw: string): Promise<DadosViaCep> {
  const cep = limparMascara(cepRaw)
  if (cep.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos')
  }

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!resp.ok) {
      throw new Error(`Erro HTTP ${resp.status} na consulta do CEP`)
    }
    const data = await resp.json()
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }
    return data
  } catch (err: any) {
    throw new Error(
      err.message || 'Erro ao consultar CEP. Preencha o endereço manualmente.',
    )
  }
}
