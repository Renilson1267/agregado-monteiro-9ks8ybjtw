import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import { supabase } from "@/lib/supabase/client"
import type { Empresa } from "@/types/concreteira"
import { useUsuario } from "@/hooks/use-usuario"

interface EmpresaContextType {
  empresas: Empresa[]
  empresaAtiva: Empresa | null
  loading: boolean
  selecionarEmpresa: (idOrSlug: string) => void
  recarregarEmpresas: () => Promise<void>
  salvarEmpresa: (dados: {
    id?: string
    nome: string
    slug: string
    ativo?: boolean
  }) => Promise<Empresa>
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

const STORAGE_KEY = "concreteira_empresa_ativa_id"
export const ID_EMPRESA_MONTEIRO_PADRAO = "11111111-1111-1111-1111-111111111111"
export const ID_EMPRESA_SJE_PADRAO = "22222222-2222-2222-2222-222222222222"

// Lista fixa de empresas permitidas para auxiliar_adm (Patricia Lima)
export const IDS_EMPRESAS_AUXILIAR_ADM = [
  ID_EMPRESA_MONTEIRO_PADRAO,
  ID_EMPRESA_SJE_PADRAO,
]

// Função auxiliar para encontrar a empresa padrão:
// Prioridade 1: Monteiro (por ID fixo, slug 'monteiro' ou nome 'Monteiro')
// Prioridade 2: Primeira empresa ativa
// Prioridade 3: Primeira da lista
export const encontrarEmpresaPadrao = (lista: Empresa[]): Empresa | null => {
  if (!lista || lista.length === 0) return null
  const monteiro = lista.find(
    (e) =>
      e.id === ID_EMPRESA_MONTEIRO_PADRAO ||
      e.slug?.toLowerCase() === "monteiro" ||
      e.nome?.toLowerCase().trim() === "monteiro" ||
      e.nome?.toLowerCase().includes("monteiro"),
  )
  if (monteiro) return monteiro
  const primeiraAtiva = lista.find((e) => e.ativo !== false)
  return primeiraAtiva || lista[0] || null
}

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const { empresaVinculadaId, isBalanceiro, isGestor, isAuxiliarAdm } =
    useUsuario()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)

  // Balanceiro e Gestor ficam 100% restritos à sua empresa vinculada única.
  // Auxiliar_adm pode alternar SOMENTE entre Monteiro e SJE.
  const ehUsuarioRestritoUnico = isBalanceiro || isGestor

  const carregarEmpresas = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("empresas")
        .select("*")
        .order("nome", { ascending: true })

      if (error) throw error

      let lista: Empresa[] = data || []

      // Para auxiliar_adm, lista permitida é SOMENTE Monteiro e SJE (Patos e Caicó FORA de alcance)
      if (isAuxiliarAdm) {
        lista = lista.filter((e) => IDS_EMPRESAS_AUXILIAR_ADM.includes(e.id))
      }

      setEmpresas(lista)

      if (lista.length > 0) {
        // Se o usuário for balanceiro ou gestor (restrito único) e tiver empresa vinculada
        if (ehUsuarioRestritoUnico && empresaVinculadaId) {
          const vinculada = lista.find((e) => e.id === empresaVinculadaId)
          if (vinculada) {
            setEmpresaAtiva(vinculada)
            localStorage.setItem(STORAGE_KEY, vinculada.id)
            return
          }
        }

        // Para Administrador ou Auxiliar_adm (que pode trocar entre Monteiro e SJE):
        // Usa a empresa salva no localStorage se for permitida; caso contrário usa a vinculada ou Monteiro
        const savedId = localStorage.getItem(STORAGE_KEY)
        let encontrada = savedId
          ? lista.find((e) => e.id === savedId || e.slug === savedId)
          : null

        // Se for auxiliar_adm e a salva não for permitida, tenta a vinculada (se permitida) ou Monteiro
        if (isAuxiliarAdm && !encontrada) {
          if (
            empresaVinculadaId &&
            IDS_EMPRESAS_AUXILIAR_ADM.includes(empresaVinculadaId)
          ) {
            encontrada = lista.find((e) => e.id === empresaVinculadaId) || null
          }
        }

        const padrao = encontrada || encontrarEmpresaPadrao(lista)
        setEmpresaAtiva(padrao || null)
        if (padrao) {
          localStorage.setItem(STORAGE_KEY, padrao.id)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err)
    } finally {
      setLoading(false)
    }
  }, [ehUsuarioRestritoUnico, isAuxiliarAdm, empresaVinculadaId])

  useEffect(() => {
    carregarEmpresas()
  }, [carregarEmpresas])

  // Se for usuário restrito único (balanceiro ou gestor) com empresa vinculada, fixar sempre na sua unidade
  useEffect(() => {
    if (ehUsuarioRestritoUnico && empresaVinculadaId && empresas.length > 0) {
      const vinculada = empresas.find((e) => e.id === empresaVinculadaId)
      if (vinculada && empresaAtiva?.id !== vinculada.id) {
        setEmpresaAtiva(vinculada)
        localStorage.setItem(STORAGE_KEY, vinculada.id)
      }
    }
  }, [ehUsuarioRestritoUnico, empresaVinculadaId, empresas, empresaAtiva?.id])

  // Se for auxiliar_adm e a empresa ativa atual não estiver entre as permitidas (Monteiro e SJE),
  // ajusta imediatamente para uma permitida (SJE vinculada ou Monteiro)
  useEffect(() => {
    if (isAuxiliarAdm && empresas.length > 0) {
      const ativaPermitida =
        empresaAtiva && IDS_EMPRESAS_AUXILIAR_ADM.includes(empresaAtiva.id)
      if (!ativaPermitida) {
        const fallback =
          (empresaVinculadaId &&
            empresas.find((e) => e.id === empresaVinculadaId)) ||
          empresas.find((e) => e.id === ID_EMPRESA_MONTEIRO_PADRAO) ||
          empresas[0] ||
          null
        if (fallback) {
          setEmpresaAtiva(fallback)
          localStorage.setItem(STORAGE_KEY, fallback.id)
        }
      }
    }
  }, [isAuxiliarAdm, empresaAtiva, empresas, empresaVinculadaId])

  const selecionarEmpresa = (idOrSlug: string) => {
    // Usuários restritos únicos (balanceiro/gestor) não podem trocar empresa
    if (ehUsuarioRestritoUnico) {
      return
    }
    // Auxiliar adm só pode trocar para empresas da sua lista permitida (Monteiro ou SJE)
    const emp = empresas.find((e) => e.id === idOrSlug || e.slug === idOrSlug)
    if (!emp) return

    if (isAuxiliarAdm && !IDS_EMPRESAS_AUXILIAR_ADM.includes(emp.id)) {
      return
    }

    setEmpresaAtiva(emp)
    localStorage.setItem(STORAGE_KEY, emp.id)
  }

  const salvarEmpresa = async (dados: {
    id?: string
    nome: string
    slug: string
    ativo?: boolean
  }): Promise<Empresa> => {
    const slugFormatado = dados.slug.toLowerCase().trim().replace(/\s+/g, "-")
    if (dados.id) {
      const { data, error } = await (supabase as any)
        .from("empresas")
        .update({
          nome: dados.nome.trim(),
          slug: slugFormatado,
          ativo: dados.ativo ?? true,
        })
        .eq("id", dados.id)
        .select()
        .single()
      if (error) throw error
      await carregarEmpresas()
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from("empresas")
        .insert({
          nome: dados.nome.trim(),
          slug: slugFormatado,
          ativo: dados.ativo ?? true,
        })
        .select()
        .single()
      if (error) throw error
      await carregarEmpresas()
      return data
    }
  }

  return (
    <EmpresaContext.Provider
      value={{
        empresas,
        empresaAtiva,
        loading,
        selecionarEmpresa,
        recarregarEmpresas: carregarEmpresas,
        salvarEmpresa,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  )
}

export const useEmpresa = () => {
  const context = useContext(EmpresaContext)
  if (!context) {
    throw new Error("useEmpresa deve ser usado dentro de um EmpresaProvider")
  }
  return context
}
