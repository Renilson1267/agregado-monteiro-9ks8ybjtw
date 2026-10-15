import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useUsuario } from "@/hooks/use-usuario"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  permitirApenasAdmin?: boolean
  permitirGestor?: boolean
}

export function ProtectedRoute({
  permitirApenasAdmin = false,
  permitirGestor = false,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { isBalanceiro, isGestor, loadingUsuario } = useUsuario()
  const location = useLocation()
  if (authLoading || loadingUsuario) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          Carregando permissões do operador...
        </p>
      </div>
    )
  }

  // Não autenticado -> redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se for rota restrita para Gestor (gestor tem acesso APENAS a /painel, /relatorios, /lancamentos, /estoque)
  if (isGestor) {
    if (permitirApenasAdmin || !permitirGestor) {
      return <Navigate to="/painel" replace />
    }
  }

  // Se a rota for restrita a Administrador e o usuário logado for Balanceiro,
  // vai DIRETO para o dashboard enxuto dele. NUNCA redirecionar para a raiz "/"
  // (a raiz é uma tela pura de redirecionamento por perfil e mandaria de volta
  // para cá, criando um loop infinito).
  if (permitirApenasAdmin && isBalanceiro) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
