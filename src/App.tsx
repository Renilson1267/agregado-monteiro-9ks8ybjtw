import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { UsuarioProvider } from "@/hooks/use-usuario"
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
import NotFound from "./pages/NotFound"

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
                    {/* Acesso liberado a Balanceiro & Admin (Dashboard e Estoque sem valores financeiros) */}
                    <Route path="/" element={<Index />} />
                    <Route path="/lancamentos" element={<LancamentoCargas />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/ordens" element={<Ordens />} />
                    <Route path="/exames" element={<ControleExames />} />
                    {/* Rotas Restritas a Administrador */}
                    <Route
                      element={<ProtectedRoute permitirApenasAdmin={true} />}
                    >
                      <Route path="/tracos" element={<Tracos />} />
                      <Route path="/relatorios" element={<Relatorios />} />
                      <Route
                        path="/comparativo"
                        element={
                          <Navigate to="/relatorios?tab=comparativo" replace />
                        }
                      />
                      <Route path="/folha" element={<FolhaPagamento />} />
                      <Route path="/cadastros" element={<Cadastros />} />
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
