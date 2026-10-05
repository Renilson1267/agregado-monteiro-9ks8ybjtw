import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Boxes,
  FlaskConical,
  Users,
  CalendarDays,
  Sun,
  Moon,
  Building2,
  Settings,
  FileText,
  FileSpreadsheet,
  HeartPulse,
  Briefcase,
  UserCog,
  ChevronDown,
  Plus,
  Scale,
  ShieldCheck,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  KeyRound,
} from "lucide-react"
import {
  LOGO_GC_MIX_QUADRADA,
  LOGO_GC_MIX_HORIZONTAL,
  LOGO_ALT_TEXT,
} from "@/assets/logos"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { useEmpresa } from "@/hooks/use-empresa"
import { useUsuario } from "@/hooks/use-usuario"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { ModalGerenciarEmpresas } from "@/components/ModalGerenciarEmpresas"
import { ModalTrocarSenha } from "@/components/ModalTrocarSenha"

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export type NavGroupId = "operacao" | "estoque_tracos" | "folha" | "cadastros" | "ferramentas"

export interface NavItemDef {
  icon: typeof LayoutDashboard
  label: string
  path: string
  badge?: string
  group: NavGroupId
  adminOnly?: boolean
}

export interface NavGroupDef {
  id: NavGroupId
  label: string
  items: NavItemDef[]
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { empresas, empresaAtiva, selecionarEmpresa } = useEmpresa()
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
  const { isInstallable, installApp } = usePwaInstall()

  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false)
  const [modalTrocarSenhaOpen, setModalTrocarSenhaOpen] = useState(false)

  // Definição dos grupos lógicos objetivos de navegação (em português claro)
  // Estrutura organizada para que o usuário encontre qualquer tela em até 2 cliques:
  // Administrador: acesso a todos os módulos
  // Balanceiro: acesso estrito e exclusivo a 3 módulos:
  //   1. Lançamento de Cargas (/lancamentos)
  //   2. Estoque de Insumos (/estoque)
  //   3. Ordens & Recibos (/ordens)
  const navGroups: NavGroupDef[] = [
    {
      id: "operacao",
      label: "Operação",
      items: [
        {
          icon: TrendingUp,
          label: "Painel Gerencial",
          path: "/painel",
          group: "operacao",
          adminOnly: true,
        },
        {
          icon: Truck,
          label: "Lançamento de Cargas",
          path: "/lancamentos",
          group: "operacao",
        },
        {
          icon: LayoutDashboard,
          label: "Dashboard de Produção",
          path: "/dashboard",
          group: "operacao",
        },
        {
          icon: FileText,
          label: "Ordens & Recibos",
          path: "/ordens",
          group: "operacao",
        },
        {
          icon: Scale,
          label: "Quadro Comparativo",
          path: "/relatorios?tab=comparativo",
          group: "operacao",
          adminOnly: true,
        },
        {
          icon: FileSpreadsheet,
          label: "Relatórios de Produção",
          path: "/relatorios",
          group: "operacao",
        },
      ],
    },
    {
      id: "estoque_tracos",
      label: "Estoque & Insumos",
      items: [
        {
          icon: Boxes,
          label: "Estoque de Insumos",
          path: "/estoque",
          group: "estoque_tracos",
        },
        {
          icon: FlaskConical,
          label: "Traços & Dosagens",
          path: "/tracos",
          group: "estoque_tracos",
          adminOnly: true,
        },
      ],
    },
    {
      id: "folha",
      label: "Folha de Pagamento",
      items: [
        {
          icon: Briefcase,
          label: "Folha de Pagamento",
          path: "/folha",
          group: "folha",
          adminOnly: true,
        },
        {
          icon: Settings,
          label: "Tabelas Oficiais (INSS/IRRF)",
          path: "/folha?tab=tabelas",
          group: "folha",
          adminOnly: true,
        },
      ],
    },
    {
      id: "cadastros",
      label: "Cadastros",
      items: [
        {
          icon: CalendarDays,
          label: "Controle de Férias",
          path: "/cadastros?tab=ferias",
          group: "cadastros",
          adminOnly: true,
        },
        {
          icon: Users,
          label: "Cadastros Gerais",
          path: "/cadastros",
          group: "cadastros",
          adminOnly: true,
        },
        {
          icon: UserCog,
          label: "Gestão de Usuários",
          path: "/cadastros?tab=usuarios",
          group: "cadastros",
          adminOnly: true,
        },
      ],
    },
    {
      id: "ferramentas",
      label: "Ferramentas",
      items: [
        {
          icon: HeartPulse,
          label: "Controle de Exames (ASO)",
          path: "/exames",
          group: "ferramentas",
          adminOnly: true,
        },
        {
          icon: Download,
          label: "Backup & Restauração",
          path: "/folha?tab=backup",
          group: "ferramentas",
          adminOnly: true,
        },
      ],
    },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const isItemActive = (path: string) => {
    if (path.includes("?")) {
      const [basePath, search] = path.split("?")
      const params = new URLSearchParams(search)
      const tab = params.get("tab")
      const currentParams = new URLSearchParams(location.search)
      return location.pathname === basePath && currentParams.get("tab") === tab
    }
    // Caso especial de /cadastros sem ?tab=usuarios
    if (path === "/cadastros" && location.pathname === "/cadastros") {
      const currentParams = new URLSearchParams(location.search)
      return currentParams.get("tab") !== "usuarios"
    }
    return location.pathname === path
  }

  // Renderiza a lista de itens da navegação organizada por grupos lógicos
  const renderNavList = (isMobileView = false) => {
    // Filtra itens de acordo com o perfil do usuário
    const gruposVisiveis = navGroups
      .map((grupo) => {
        const itensVisiveis = grupo.items.filter((item) => {
          if (isBalanceiro && item.adminOnly) return false
          return true
        })
        return {
          ...grupo,
          items: itensVisiveis,
        }
      })
      .filter((grupo) => grupo.items.length > 0)

    return (
      <nav className="flex flex-col gap-3 w-full px-2">
        {gruposVisiveis.map((grupo, gIdx) => (
          <div key={grupo.id} className="w-full space-y-1">
            {/* Título do Grupo em português objetivo */}
            {(!collapsed || isMobileView) && (
              <div
                className={cn(
                  "px-3 pb-1 flex items-center justify-between",
                  gIdx > 0 ? "pt-2 border-t border-border/20" : "pt-0.5",
                )}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                  {grupo.label}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  {grupo.items.length}
                </span>
              </div>
            )}
            {collapsed && !isMobileView && gIdx > 0 && (
              <div className="my-1.5 mx-auto w-6 h-px bg-border/40" />
            )}

            {/* Itens do Grupo */}
            <div className="space-y-0.5">
              {grupo.items.map((item) => {
                const active = isItemActive(item.path)

                const linkContent = (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobileView && onMobileClose) onMobileClose()
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl transition-all duration-150",
                      isMobileView
                        ? "px-3.5 py-3 text-sm min-h-[46px]"
                        : collapsed
                          ? "justify-center px-0 w-11 h-11 mx-auto text-xs"
                          : "w-full px-3 py-2 text-xs sm:text-sm",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground font-medium",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 transition-transform duration-150 group-hover:scale-105",
                        isMobileView
                          ? "w-5 h-5"
                          : collapsed && !isMobileView
                            ? "w-5 h-5"
                            : "w-4 h-4",
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />

                    {(!collapsed || isMobileView) && (
                      <span className="truncate flex-1 text-left text-xs sm:text-sm">
                        {item.label}
                      </span>
                    )}

                    {active && collapsed && !isMobileView && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-primary" />
                    )}
                  </Link>
                )

                if (collapsed && !isMobileView) {
                  return (
                    <Tooltip key={item.path} delayDuration={100}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="font-medium text-xs"
                      >
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {grupo.label}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return linkContent
              })}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  return (
    <>
      {/* SIDEBAR FIXA DESKTOP */}
      <aside
        id="app-sidebar"
        aria-label="Menu Principal"
        className={cn(
          "no-print hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-card border-r border-border/40 shadow-sm transition-all duration-300 ease-in-out",
          collapsed ? "w-18" : "w-64",
        )}
      >
        {/* TOPO: Logo e Marca GC MIX */}
        <div
          className={cn(
            "flex items-center gap-3 px-3.5 py-4 border-b border-border/30 h-16 shrink-0",
            collapsed ? "justify-center px-2" : "justify-between",
          )}
        >
          <Link
            to={isBalanceiro ? "/dashboard" : "/painel"}
            className={cn(
              "flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg",
              collapsed && "justify-center",
            )}
            title="GC MIX Concreto Usinado"
          >
            {collapsed ? (
              <div className="w-10 h-10 p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-border/60 shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src={LOGO_GC_MIX_QUADRADA}
                  alt={LOGO_ALT_TEXT}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={LOGO_GC_MIX_HORIZONTAL}
                  alt={LOGO_ALT_TEXT}
                  className="h-10 w-auto max-w-[170px] object-contain rounded-sm group-hover:scale-102 transition-transform"
                />
              </div>
            )}
          </Link>

          {/* Botão de recolher/expandir sidebar */}
          {onToggleCollapse && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
              title="Recolher menu lateral"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Recolher menu</span>
            </Button>
          )}
        </div>

        {/* SELETOR DE EMPRESA / UNIDADE */}
        <div
          className={cn(
            "p-2.5 border-b border-border/30 shrink-0",
            collapsed && "p-2",
          )}
        >
          {podeTrocarEmpresa ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {collapsed ? (
                  <button
                    type="button"
                    className="w-11 h-11 mx-auto rounded-xl bg-primary/10 text-primary border border-primary/25 flex flex-col items-center justify-center gap-0.5 hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
                    title={`Unidade: ${empresaAtiva?.nome || "Trocar"} (clique para alternar)`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-tight leading-none truncate max-w-[36px]">
                      {empresaAtiva?.slug?.toUpperCase() || "UNID"}
                    </span>
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-between h-auto py-2 px-2.5 bg-background/50 hover:bg-accent/60 border-border/60 text-left rounded-xl transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="block text-[11px] font-semibold text-foreground truncate leading-tight">
                          {empresaAtiva?.nome || "Selecionar Unidade"}
                        </span>
                        <span className="block text-[10px] text-muted-foreground truncate leading-none">
                          {empresaAtiva?.cidade
                            ? `${empresaAtiva.cidade} - ${empresaAtiva.uf || "PB"}`
                            : "Unidade Operacional"}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                  </Button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={collapsed ? "start" : "center"}
                className="w-56"
              >
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                  Unidades Operacionais
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {empresas.map((emp) => {
                  const isAtiva = empresaAtiva?.id === emp.id
                  return (
                    <DropdownMenuItem
                      key={emp.id}
                      onClick={() => selecionarEmpresa(emp.id)}
                      className="flex items-center justify-between cursor-pointer py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0",
                            isAtiva
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {emp.nome.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "block truncate",
                              isAtiva ? "font-bold text-primary" : "",
                            )}
                          >
                            {emp.nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {emp.cidade
                              ? `${emp.cidade} - ${emp.uf || "PB"}`
                              : emp.slug}
                          </span>
                        </div>
                      </div>
                      {isAtiva && (
                        <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 bg-primary/10 rounded shrink-0">
                          Ativa
                        </span>
                      )}
                    </DropdownMenuItem>
                  )
                })}
                {isAdministrador && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setModalEmpresasOpen(true)}
                      className="text-xs text-primary gap-2 cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Gerenciar Unidades
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div
              className={cn(
                "rounded-xl border border-border/40 bg-background/50 flex items-center",
                collapsed
                  ? "w-11 h-11 mx-auto justify-center flex-col gap-0.5"
                  : "p-2 gap-2",
              )}
              title={`Unidade Fixa: ${empresaAtiva?.nome || ""}`}
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Building2 className="w-4 h-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <span className="block text-[11px] font-bold text-foreground truncate leading-tight">
                    {empresaAtiva?.nome || "Unidade"}
                  </span>
                  <span className="block text-[10px] text-muted-foreground truncate leading-none">
                    Unidade Vinculada
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO PRINCIPAL (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-border/40">
          {renderNavList(false)}
        </div>

        {/* RODAPÉ: Botão Expandir (se collapsed), Instalar PWA, Perfil e Ações */}
        <div className="p-2.5 border-t border-border/30 bg-muted/20 shrink-0 flex flex-col gap-2">
          {/* Botão de Expandir se a sidebar estiver recolhida */}
          {collapsed && onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="w-11 h-9 mx-auto rounded-lg text-muted-foreground hover:text-foreground"
              title="Expandir menu lateral"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Expandir menu</span>
            </Button>
          )}

          {/* Botão de Instalação PWA */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={installApp}
              className={cn(
                "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold shadow-2xs transition-all",
                collapsed
                  ? "w-11 h-11 p-0 mx-auto justify-center"
                  : "w-full justify-start gap-2 h-9 text-xs",
              )}
              title="Instalar GC MIX como aplicativo no dispositivo"
            >
              <Download className="w-4 h-4 text-primary shrink-0 animate-bounce" />
              {!collapsed && <span>Instalar Aplicativo</span>}
            </Button>
          )}

          {/* Card do Usuário Logado & Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "rounded-xl border border-border/40 bg-card hover:bg-accent/60 transition-colors text-left flex items-center cursor-pointer shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  collapsed
                    ? "w-11 h-11 mx-auto justify-center p-0"
                    : "w-full p-2 gap-2.5 justify-between",
                )}
                title={`Usuário: ${nomeUsuario} (${nomePerfil})`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/25">
                    {nomeUsuario.slice(0, 1).toUpperCase()}
                  </div>
                  {!collapsed && (
                    <div className="min-w-0 text-left">
                      <span className="block text-xs font-bold text-foreground truncate leading-tight">
                        {nomeUsuario}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isBalanceiro ? (
                          <Scale className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-2.5 h-2.5 text-primary shrink-0" />
                        )}
                        <span className="text-[10px] text-muted-foreground truncate leading-none">
                          {nomePerfil}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? "right" : "top"}
              align={collapsed ? "end" : "center"}
              className="w-56"
            >
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
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-xs cursor-pointer gap-2"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Tema Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-blue-500" />
                    <span>Tema Escuro</span>
                  </>
                )}
              </DropdownMenuItem>
              {isAdministrador && (
                <DropdownMenuItem
                  onClick={() => setModalEmpresasOpen(true)}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Gerenciar Empresas</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setModalTrocarSenhaOpen(true)}
                className="text-xs cursor-pointer gap-2"
              >
                <KeyRound className="w-4 h-4 text-primary" />
                <span>Trocar Senha</span>
              </DropdownMenuItem>
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

          {!collapsed && (
            <div className="pt-0.5 text-center">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                GC MIX v0.0.164
              </span>{" "}
            </div>
          )}
        </div>
      </aside>

      {/* GAVETA MOBILE (SHEET) PARA TELAS PEQUENAS */}
      <Sheet
        open={mobileOpen}
        onOpenChange={(open) => !open && onMobileClose && onMobileClose()}
      >
        <SheetContent
          side="left"
          className="no-print w-[300px] max-w-[85vw] p-0 bg-card border-r-border/40 flex flex-col h-full"
        >
          {/* TOPO MOBILE */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <img
                src={LOGO_GC_MIX_HORIZONTAL}
                alt={LOGO_ALT_TEXT}
                className="h-9 w-auto max-w-[170px] object-contain rounded-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={onMobileClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* SELETOR MOBILE DENTRO DA GAVETA */}
          {podeTrocarEmpresa && (
            <div className="p-3 border-b border-border/30 bg-muted/20">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Unidade Ativa
              </label>
              <select
                value={empresaAtiva?.id || ""}
                onChange={(e) => {
                  selecionarEmpresa(e.target.value)
                  if (onMobileClose) onMobileClose()
                }}
                className="w-full h-10 rounded-xl bg-background border border-border/60 text-xs px-3 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome} ({emp.slug.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* LINKS DE NAVEGAÇÃO COM ITENS TOUCH-FRIENDLY */}
          <div className="flex-1 overflow-y-auto py-3">
            {renderNavList(true)}
          </div>

          {/* RODAPÉ MOBILE */}
          <div className="p-3.5 border-t border-border/30 bg-muted/20 flex flex-col gap-2.5">
            {/* Botão PWA no rodapé mobile caso disponível */}
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onMobileClose) onMobileClose()
                  installApp()
                }}
                className="w-full justify-center gap-2 min-h-[44px] h-11 text-xs border-primary/40 bg-primary/10 text-primary font-bold rounded-xl"
              >
                <Download className="w-4 h-4 text-primary shrink-0 animate-bounce" />
                <span>Adicionar à Tela Inicial</span>
              </Button>
            )}

            <div className="flex items-center justify-between text-xs px-1">
              <div className="min-w-0">
                <span className="block font-bold text-foreground truncate">
                  {nomeUsuario}
                </span>
                <span className="block text-[10px] text-muted-foreground truncate">
                  {nomePerfil}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-10 w-10 rounded-xl"
                title="Alternar Tema"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-500" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onMobileClose) onMobileClose()
                  setModalTrocarSenhaOpen(true)
                }}
                className="flex-1 justify-center gap-1.5 min-h-[42px] h-10 text-xs rounded-xl"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Trocar Senha</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (onMobileClose) onMobileClose()
                  handleLogout()
                }}
                className="flex-1 justify-center gap-1.5 min-h-[42px] h-10 text-xs rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </Button>
            </div>

            <div className="pt-0.5 text-center">
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                GC MIX v0.0.164
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ModalGerenciarEmpresas
        open={modalEmpresasOpen}
        onOpenChange={setModalEmpresasOpen}
      />
      <ModalTrocarSenha
        open={modalTrocarSenhaOpen}
        onOpenChange={setModalTrocarSenhaOpen}
      />
    </>
  )
}
