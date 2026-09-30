import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (
    email: string,
    password: string,
    data?: Record<string, any>,
  ) => Promise<{
    data?: any
    error: any
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    data?: any
    error: any
  }>
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>
  updatePassword: (
    newPassword: string,
    currentPassword?: string,
  ) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // FORBIDDEN: no async/await inside this callback — sync only
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (
    email: string,
    password: string,
    data?: Record<string, any>,
  ) => {
    const res = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: data || {},
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { data: res.data, error: res.error }
  }

  const signIn = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    return { data: res.data, error: res.error }
  }

  const resetPasswordForEmail = async (email: string) => {
    const res = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/`,
      },
    )
    return { error: res.error }
  }

  const updatePassword = async (
    newPassword: string,
    currentPassword?: string,
  ) => {
    // Se a senha atual for fornecida, reautentica primeiro para garantir segurança
    if (currentPassword && user?.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) {
        return {
          error: new Error("A senha atual informada está incorreta."),
        }
      }
    }

    const res = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error: res.error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        resetPasswordForEmail,
        updatePassword,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
