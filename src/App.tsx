import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { UsuarioProvider, useUsuario } from "@/hooks/use-usuario"
import { EmpresaProvider } from "@/hooks/use-empresa"
import { AtualizacaoPwaBanner } from "@/components/AtualizacaoPwaBanner"
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
import ImportarCargasPage from "./pages/ImportarCargas"
import NotFound from "./pages/NotFound"

function RotaRaizRedirect() {
  const {
    isBalanceiro,
    isGestor,
    isAdministrador,
    loadingUsuario,
    usuarioApp,
  } = useUsuario()
  // Enquanto as permissões carregam qualquer redirecionamento seria prematuro
  // e pode disparar loop: espera o estado definitivo do perfil.
  if (loadingUsuario) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          Carregando permissões do operador...
        </p>
      </div>
    )
  }
  // Destino único por perfil. A raiz NUNCA devolve para si mesma nem para
  // rotas bloqueadas pelo perfil do usuário — qualquer um dos destinos abaixo
  // existe na árvore de rotas para o perfil em questão, o que elimina o loop.
  //  - administrador / gestor  -> /painel (ambos liberados no grupo acima)
  //  - balanceiro / fallback   -> /dashboard (bloqueado para gestor)
  const destino =
    usuarioApp && !isAdministrador && !isGestor && isBalanceiro
      ? "/dashboard"
      : "/painel"
  return <Navigate to={destino} replace />
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
              <AtualizacaoPwaBanner />
              <Routes>
                {/* Rota Pública de Login */}
                <Route path="/login" element={<Login />} />

                {/* Rotas Protegidas Globais (Requer estar logado) */}
                <Route element={<ProtectedRoute permitirGestor={true} />}>
                  <Route element={<Layout />}>
                    {/* Rota Raiz: redireciona conforme o perfil (Balanceiro -> /lancamentos, Admin -> /painel) */}
                    <Route path="/" element={<RotaRaizRedirect />} />
                    {/* 4 Telas permitidas para Gestor: /painel, /relatorios, /lancamentos, /estoque */}
                    {/* Lançamentos e Estoque: liberados para Gestor, Balanceiro e Administrador */}
                    <Route element={<ProtectedRoute permitirGestor={true} />}>
                      <Route
                        path="/lancamentos"
                        element={<LancamentoCargas />}
                      />
                      <Route path="/estoque" element={<Estoque />} />
                    </Route>
                    {/* Painel Gerencial e Relatórios: liberados para Gestor e Administrador (bloqueados para Balanceiro) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={true}
                        />
                      }
                    >
                      <Route path="/painel" element={<PainelGerencial />} />
                      <Route path="/relatorios" element={<Relatorios />} />
                    </Route>
                    {/* Módulos permitidos para Balanceiro e Admin (Gestor NÃO tem acesso a /dashboard nem /ordens) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={false}
                        />
                      }
                    >
                      <Route path="/dashboard" element={<Index />} />
                      <Route path="/ordens" element={<Ordens />} />
                    </Route>
                    {/* Rotas Restritas a Administrador (Gestor e Balanceiro BLOQUEADOS / redirecionados) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={true}
                          permitirGestor={false}
                        />
                      }
                    >
                      <Route
                        path="/importar"
                        element={<ImportarCargasPage />}
                      />
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
