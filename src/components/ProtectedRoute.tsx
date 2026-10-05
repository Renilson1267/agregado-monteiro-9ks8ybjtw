import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useUsuario } from "@/hooks/use-usuario"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  permitirApenasAdmin?: boolean
}

export function ProtectedRoute({
  permitirApenasAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { isBalanceiro, loadingUsuario } = useUsuario()
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

  // Se a rota for restrita a Administrador e o usuário logado for Balanceiro
  if (permitirApenasAdmin && isBalanceiro) {
    // Redireciona para a rota raiz (que para balanceiro já cai no dashboard enxuto /dashboard)
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
