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
import { AbaControleFerias } from "@/components/AbaControleFerias"
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
    isAuxiliarAdm,
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
  //  - administrador / gestor / auxiliar_adm  -> /painel
  //  - balanceiro                             -> /dashboard
  const destino =
    usuarioApp &&
    !isAdministrador &&
    !isGestor &&
    !isAuxiliarAdm &&
    isBalanceiro
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
                <Route
                  element={
                    <ProtectedRoute
                      permitirGestor={true}
                      permitirAuxiliarAdm={true}
                    />
                  }
                >
                  <Route element={<Layout />}>
                    {/* Rota Raiz: redireciona conforme o perfil (Balanceiro -> /dashboard, Admin/Gestor/AuxiliarAdm -> /painel) */}
                    <Route path="/" element={<RotaRaizRedirect />} />

                    {/* Painel Gerencial e Relatórios: liberados para Auxiliar Adm, Gestor e Admin */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={true}
                          permitirAuxiliarAdm={true}
                        />
                      }
                    >
                      <Route path="/painel" element={<PainelGerencial />} />
                      <Route path="/relatorios" element={<Relatorios />} />
                    </Route>

                    {/* Estoque de Insumos: liberado para Auxiliar Adm, Gestor, Balanceiro e Admin */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={true}
                          permitirAuxiliarAdm={true}
                        />
                      }
                    >
                      <Route path="/estoque" element={<Estoque />} />
                    </Route>

                    {/* Folha, Exames e Férias: liberados para Auxiliar Adm e Admin (bloqueados para Gestor e Balanceiro) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={false}
                          permitirAuxiliarAdm={true}
                        />
                      }
                    >
                      <Route path="/exames" element={<ControleExames />} />
                      <Route path="/folha" element={<FolhaPagamento />} />
                      <Route path="/ferias" element={<AbaControleFerias />} />
                    </Route>

                    {/* Lançamento de Cargas: liberado para Gestor, Balanceiro e Admin (BLOQUEADO para Auxiliar Adm) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={true}
                          permitirAuxiliarAdm={false}
                        />
                      }
                    >
                      <Route
                        path="/lancamentos"
                        element={<LancamentoCargas />}
                      />
                    </Route>

                    {/* Módulos permitidos apenas para Balanceiro e Admin (Gestor e Auxiliar Adm NÃO têm acesso) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={false}
                          permitirGestor={false}
                          permitirAuxiliarAdm={false}
                        />
                      }
                    >
                      <Route path="/dashboard" element={<Index />} />
                      <Route path="/ordens" element={<Ordens />} />
                    </Route>

                    {/* Rotas Restritas a Administrador (Gestor, Balanceiro e Auxiliar Adm BLOQUEADOS / redirecionados) */}
                    <Route
                      element={
                        <ProtectedRoute
                          permitirApenasAdmin={true}
                          permitirGestor={false}
                          permitirAuxiliarAdm={false}
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
                      <Route path="/cadastros" element={<Cadastros />} />
                      <Route
                        path="/usuarios"
                        element={
                          <Navigate to="/cadastros?tab=usuarios" replace />
                        }
                      />
                    </Route>
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
