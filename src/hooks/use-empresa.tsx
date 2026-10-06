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
  const { empresaVinculadaId, isBalanceiro } = useUsuario()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)

  const carregarEmpresas = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("empresas")
        .select("*")
        .order("nome", { ascending: true })

      if (error) throw error

      const lista: Empresa[] = data || []
      setEmpresas(lista)

      if (lista.length > 0) {
        // Se o usuário for balanceiro e estiver vinculado a uma empresa específica
        if (isBalanceiro && empresaVinculadaId) {
          const vinculada = lista.find((e) => e.id === empresaVinculadaId)
          if (vinculada) {
            setEmpresaAtiva(vinculada)
            localStorage.setItem(STORAGE_KEY, vinculada.id)
            return
          }
        }

        // Para Administrador (ou usuário sem vínculo fixo):
        // Usa a empresa salva no localStorage (última utilizada) e, quando não houver nada salvo, usa MONTEIRO como padrão
        const savedId = localStorage.getItem(STORAGE_KEY)
        const encontrada = savedId
          ? lista.find((e) => e.id === savedId || e.slug === savedId)
          : null

        // Se houver empresa salva válida, usa ela; senão usa MONTEIRO (nunca a primeira alfabética Caicó)
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
  }, [isBalanceiro, empresaVinculadaId])

  useEffect(() => {
    carregarEmpresas()
  }, [carregarEmpresas])

  // Se for balanceiro com empresa vinculada, fixar sempre na sua unidade
  useEffect(() => {
    if (isBalanceiro && empresaVinculadaId && empresas.length > 0) {
      const vinculada = empresas.find((e) => e.id === empresaVinculadaId)
      if (vinculada && empresaAtiva?.id !== vinculada.id) {
        setEmpresaAtiva(vinculada)
        localStorage.setItem(STORAGE_KEY, vinculada.id)
      }
    }
  }, [isBalanceiro, empresaVinculadaId, empresas, empresaAtiva?.id])

  const selecionarEmpresa = (idOrSlug: string) => {
    // Balanceiro não pode trocar para outra empresa
    if (isBalanceiro) {
      return
    }
    const emp = empresas.find((e) => e.id === idOrSlug || e.slug === idOrSlug)
    if (emp) {
      setEmpresaAtiva(emp)
      localStorage.setItem(STORAGE_KEY, emp.id)
    }
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
