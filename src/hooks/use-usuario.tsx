import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ConcreteiraService } from '@/services/concreteira'
import type { UsuarioApp } from '@/types/concreteira'

export type PerfilUsuario = 'administrador' | 'balanceiro'

interface UsuarioContextType {
  usuarioApp: UsuarioApp | null
  perfil: PerfilUsuario
  isBalanceiro: boolean
  isAdministrador: boolean
  nomePerfil: string
  nomeUsuario: string
  emailUsuario: string
  empresaVinculadaId: string | null
  empresaVinculadaNome: string | null
  podeTrocarEmpresa: boolean
  loadingUsuario: boolean
  recarregarUsuarioApp: () => Promise<void>
  // Para compatibilidade e testes locais de admin (apenas administrador pode alternar temporariamente visualização se quiser)
  alternarPerfil: (novoPerfil: PerfilUsuario) => void
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined)

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: loadingAuth } = useAuth()
  const [usuarioApp, setUsuarioApp] = useState<UsuarioApp | null>(null)
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilUsuario>('administrador')
  const [loadingUsuario, setLoadingUsuario] = useState(true)

  const carregarDadosUsuario = useCallback(async () => {
    if (!user) {
      setUsuarioApp(null)
      setPerfilAtivo('administrador')
      setLoadingUsuario(false)
      return
    }

    try {
      setLoadingUsuario(true)
      const email = user.email || ''
      let appUser = await ConcreteiraService.buscarUsuarioAppPorAuth(
        user.id,
        email,
      )

      // Se encontrou por email mas user_id estava vazio, vincula
      if (appUser && !appUser.user_id) {
        await ConcreteiraService.vincularAuthAUsuarioApp(user.id, email)
        appUser.user_id = user.id
      }

      if (appUser) {
        setUsuarioApp(appUser)
        setPerfilAtivo(appUser.perfil)
      } else {
        // Fallback: se estiver logado via auth mas não tiver linha em usuarios_app
        // Tratar como administrador básico para não bloquear emergências
        const fallbackUser: UsuarioApp = {
          id: user.id,
          user_id: user.id,
          nome: user.user_metadata?.name || email.split('@')[0] || 'Usuário',
          email,
          perfil: 'administrador',
          ativo: true,
        }
        setUsuarioApp(fallbackUser)
        setPerfilAtivo('administrador')
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário na base:', err)
    } finally {
      setLoadingUsuario(false)
    }
  }, [user])

  useEffect(() => {
    if (!loadingAuth) {
      carregarDadosUsuario()
    }
  }, [user, loadingAuth, carregarDadosUsuario])

  // Se o usuário logado for balanceiro, ele nunca pode forçar admin
  const alternarPerfil = (novoPerfil: PerfilUsuario) => {
    // Se no cadastro o usuário for balanceiro, ele não pode mudar para admin
    if (usuarioApp?.perfil === 'balanceiro' && novoPerfil === 'administrador') {
      return
    }
    setPerfilAtivo(novoPerfil)
  }

  const isBalanceiro = perfilAtivo === 'balanceiro'
  const isAdministrador = perfilAtivo === 'administrador'
  const nomePerfil = isBalanceiro ? 'Balanceiro' : 'Administrador'
  const nomeUsuario =
    usuarioApp?.nome ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário'
  const emailUsuario = usuarioApp?.email || user?.email || ''
  // Administrador tem acesso irrestrito e multicompany (pode alternar livremente entre Monteiro, SJE ou qualquer outra unidade).
  // Apenas o Balanceiro fica estritamente restrito à sua empresa vinculada.
  const empresaVinculadaId = isBalanceiro
    ? usuarioApp?.empresa_id || null
    : null
  const empresaVinculadaNome = isBalanceiro
    ? usuarioApp?.empresa_nome || null
    : null
  const podeTrocarEmpresa = isAdministrador

  return (
    <UsuarioContext.Provider
      value={{
        usuarioApp,
        perfil: perfilAtivo,
        isBalanceiro,
        isAdministrador,
        nomePerfil,
        nomeUsuario,
        emailUsuario,
        empresaVinculadaId,
        empresaVinculadaNome,
        podeTrocarEmpresa,
        loadingUsuario: loadingAuth || loadingUsuario,
        recarregarUsuarioApp: carregarDadosUsuario,
        alternarPerfil,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  )
}

export const useUsuario = () => {
  const context = useContext(UsuarioContext)
  if (!context) {
    throw new Error('useUsuario deve ser usado dentro de um UsuarioProvider')
  }
  return context
}
