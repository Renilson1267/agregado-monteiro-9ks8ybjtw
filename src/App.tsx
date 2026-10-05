import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { UsuarioProvider, useUsuario } from "@/hooks/use-usuario"
import { EmpresaProvider } from "@/hooks/use-empresa"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Index from "./pages/Index"
import LancamentoCargas from "./pages/LancamentoCargas"
import Tracos from "./pages/Tracos"
import Estoque from "./pages/Estoque"
import Cadastros from "./pages/Cadastros"
import Ordens from "./pages/Ordens"
import Relatorios from "./pages/Relatorios"
import ControleExames from "./pages/ControleExames"
import FolhaPagamento from "./pages/FolhaPagamento"
import PainelGerencial from "./pages/PainelGerencial"
import NotFound from "./pages/NotFound"

function RotaRaizRedirect() {
  const { isBalanceiro } = useUsuario()
  return <Navigate to={isBalanceiro ? "/dashboard" : "/painel"} replace />
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <UsuarioProvider>
          <EmpresaProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Rota Pública de Login */}
                <Route path="/login" element={<Login />} />

                {/* Rotas Protegidas Globais (Requer estar logado) */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    {/* Rota Raiz: redireciona conforme o perfil (Balanceiro -> /lancamentos, Admin -> /painel) */}
                    <Route path="/" element={<RotaRaizRedirect />} />
                    {/* Módulos Permitidos para Balanceiro & Admin (Lançamentos, Estoque, Ordens e Dashboard Enxuto) */}
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/lancamentos" element={<LancamentoCargas />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/ordens" element={<Ordens />} />
                    {/* Rotas Restritas a Administrador (Balanceiro é redirecionado para o dashboard dele ou /lancamentos) */}
                    <Route
                      element={<ProtectedRoute permitirApenasAdmin={true} />}
                    >
                      <Route path="/relatorios" element={<Relatorios />} />
                      <Route path="/painel" element={<PainelGerencial />} />
                      <Route path="/tracos" element={<Tracos />} />
                      <Route
                        path="/comparativo"
                        element={
                          <Navigate to="/relatorios?tab=comparativo" replace />
                        }
                      />
                      <Route path="/exames" element={<ControleExames />} />
                      <Route path="/folha" element={<FolhaPagamento />} />
                      <Route path="/cadastros" element={<Cadastros />} />
                      <Route
                        path="/usuarios"
                        element={
                          <Navigate to="/cadastros?tab=usuarios" replace />
                        }
                      />
                      <Route
                        path="/ferias"
                        element={
                          <Navigate to="/cadastros?tab=ferias" replace />
                        }
                      />
                    </Route>{" "}
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </EmpresaProvider>
        </UsuarioProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
)

export default App
