import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Building2,
  ChevronDown,
  Plus,
  Scale,
  ShieldCheck,
  Download,
  LogOut,
  Sun,
  Moon,
  Menu,
} from "lucide-react"
import { useTheme } from "next-themes"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { ModalGerenciarEmpresas } from "@/components/ModalGerenciarEmpresas"

interface HeaderProps {
  onOpenMobileMenu?: () => void
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function Header({
  onOpenMobileMenu,
  sidebarCollapsed = false,
  onToggleSidebar,
}: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { empresas, empresaAtiva, selecionarEmpresa } = useEmpresa()
  const { isInstallable, installApp } = usePwaInstall()
  const {
    perfil,
    isBalanceiro,
    isAdministrador,
    nomePerfil,
    nomeUsuario,
    emailUsuario,
    podeTrocarEmpresa,
    empresaVinculadaNome,
  } = useUsuario()
  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false)

  const nomeEmpresa = empresaAtiva?.nome || "Selecione"

  // Mapeamento do título da página atual
  const getPageTitle = () => {
    const path = location.pathname
    const search = location.search
    if (path === "/") {
      return isBalanceiro ? "Dashboard Operacional" : "Dashboard de Produção"
    }
    if (path === "/lancamentos") return "Lançamento de Cargas"
    if (path === "/ordens") return "Ordens de Serviço & Recibos"
    if (path === "/estoque") return "Estoque de Insumos"
    if (path === "/tracos") return "Traços & Dosagens"
    if (path === "/exames") return "Controle de Exames (ASO)"
    if (path === "/folha") return "Folha de Pagamento"
    if (path === "/relatorios") {
      const params = new URLSearchParams(search)
      if (params.get("tab") === "comparativo")
        return "Quadro Comparativo (Monteiro × SJE)"
      return "Relatórios de Produção"
    }
    if (path === "/cadastros") {
      const params = new URLSearchParams(search)
      if (params.get("tab") === "usuarios") return "Gestão de Usuários"
      return "Cadastros Operacionais"
    }
    return "GC MIX Concreto Usinado"
  }

  const handleLogout = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <>
      <header className="no-print flex items-center justify-between px-3 sm:px-6 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 w-full border-b border-border/30">
        {/* Esquerda: Botão Mobile Hambúrguer ou Toggle Desktop + Título da Página Atual */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Botão Hambúrguer Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
            className="md:hidden h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Botão de Toggle da Sidebar em Desktop (quando visível) */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
              title={
                sidebarCollapsed
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral"
              }
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Alternar menu</span>
            </Button>
          )}

          {/* Título da tela atual */}
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate tracking-tight">
              {getPageTitle()}
            </h1>
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {nomeEmpresa}
            </span>
          </div>
        </div>

        {/* Direita: Seletor de Empresa, PWA, Tema, Perfil e Menu do Usuário */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Botão de Instalação PWA (se suportado e não instalado) */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={installApp}
              className="h-8 px-2.5 gap-1.5 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs shadow-2xs transition-all"
              title="Instalar GC MIX no computador ou smartphone"
            >
              <Download className="w-3.5 h-3.5 text-primary animate-bounce shrink-0" />
              <span className="hidden sm:inline">Instalar App</span>
            </Button>
          )}

          {/* Alternador de Tema Claro/Escuro */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            title="Alternar entre modo claro e escuro"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Seletor Rápido de Empresa (visível em tablet/desktop no Header para conveniência) */}
          {podeTrocarEmpresa ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-card border-border/50 hover:border-primary/40 shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-[140px] font-semibold">
                    {nomeEmpresa}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  Trocar Unidade Operacional
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {empresas.map((emp) => {
                  const isAtiva = empresaAtiva?.id === emp.id
                  return (
                    <DropdownMenuItem
                      key={emp.id}
                      onClick={() => selecionarEmpresa(emp.id)}
                      className="flex items-center justify-between cursor-pointer py-1.5 text-xs"
                    >
                      <span className={isAtiva ? "font-bold text-primary" : ""}>
                        {emp.nome}
                      </span>
                      {isAtiva && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
                {isAdministrador && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setModalEmpresasOpen(true)}
                      className="text-xs text-primary gap-1.5 cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Gerenciar Unidades
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-8 gap-1.5 px-2.5 rounded-md border border-border/40 bg-card hidden sm:flex items-center font-bold text-xs">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[120px]">{nomeEmpresa}</span>
            </div>
          )}

          {/* Badge de Perfil do Usuário */}
          <div
            className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold bg-card ${
              isBalanceiro
                ? "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                : "border-primary/40 bg-primary/5 text-primary"
            }`}
          >
            {isBalanceiro ? (
              <Scale className="w-3 h-3 shrink-0" />
            ) : (
              <ShieldCheck className="w-3 h-3 shrink-0" />
            )}
            <span>{nomePerfil}</span>
          </div>

          {/* Menu do Usuário Logado & Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 sm:px-2.5 text-xs gap-1.5 bg-card border-border/50 hover:border-primary/40 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                  {nomeUsuario.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-semibold text-foreground truncate max-w-[80px] hidden sm:inline">
                  {nomeUsuario.split(" ")[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">
                Conta Conectada
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground truncate">
                  {nomeUsuario}
                </p>
                <p className="text-[11px] truncate">{emailUsuario}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className="font-semibold text-primary capitalize">
                    {perfil}
                  </span>
                  {empresaVinculadaNome && (
                    <span className="truncate">• {empresaVinculadaNome}</span>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2 py-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ModalGerenciarEmpresas
        open={modalEmpresasOpen}
        onOpenChange={setModalEmpresasOpen}
      />
    </>
  )
}
