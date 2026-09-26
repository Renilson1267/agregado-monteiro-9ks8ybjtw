import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

export type PerfilUsuario = 'administrador' | 'balanceiro'

interface UsuarioContextType {
  perfil: PerfilUsuario
  isBalanceiro: boolean
  isAdministrador: boolean
  alternarPerfil: (novoPerfil: PerfilUsuario) => void
  nomePerfil: string
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined)

const STORAGE_KEY_PERFIL = 'concreteira_usuario_perfil'

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const [perfil, setPerfil] = useState<PerfilUsuario>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY_PERFIL)
      if (salvo === 'balanceiro' || salvo === 'administrador') {
        return salvo
      }
    } catch {
      // fallback
    }
    return 'administrador'
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PERFIL, perfil)
    } catch {
      // ignore
    }
  }, [perfil])

  const alternarPerfil = (novoPerfil: PerfilUsuario) => {
    setPerfil(novoPerfil)
  }

  const nomePerfil = perfil === 'balanceiro' ? 'Balanceiro' : 'Administrador'

  return (
    <UsuarioContext.Provider
      value={{
        perfil,
        isBalanceiro: perfil === 'balanceiro',
        isAdministrador: perfil === 'administrador',
        alternarPerfil,
        nomePerfil,
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
