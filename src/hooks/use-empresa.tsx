import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Empresa } from '@/types/concreteira'

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

const STORAGE_KEY = 'concreteira_empresa_ativa_id'

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)

  const carregarEmpresas = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('empresas')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error

      const lista: Empresa[] = data || []
      setEmpresas(lista)

      if (lista.length > 0) {
        const savedId = localStorage.getItem(STORAGE_KEY)
        const encontrada = lista.find(
          (e) => e.id === savedId || e.slug === savedId,
        )
        // Preferir salvar a empresa Monteiro ou a primeira ativa
        const padrao = encontrada || lista[0]
        setEmpresaAtiva(padrao)
        if (padrao) {
          localStorage.setItem(STORAGE_KEY, padrao.id)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarEmpresas()
  }, [carregarEmpresas])

  const selecionarEmpresa = (idOrSlug: string) => {
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
    const slugFormatado = dados.slug.toLowerCase().trim().replace(/\s+/g, '-')
    if (dados.id) {
      const { data, error } = await (supabase as any)
        .from('empresas')
        .update({
          nome: dados.nome.trim(),
          slug: slugFormatado,
          ativo: dados.ativo ?? true,
        })
        .eq('id', dados.id)
        .select()
        .single()
      if (error) throw error
      await carregarEmpresas()
      return data
    } else {
      const { data, error } = await (supabase as any)
        .from('empresas')
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
    throw new Error('useEmpresa deve ser usado dentro de um EmpresaProvider')
  }
  return context
}
