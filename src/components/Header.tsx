import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Menu,
  Building2,
  ChevronDown,
  Plus,
  Scale,
  ShieldCheck,
  Download,
} from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { LOGO_GC_MIX_QUADRADA, LOGO_ALT_TEXT } from '@/assets/logos'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { ModalGerenciarEmpresas } from '@/components/ModalGerenciarEmpresas'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
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

  const nomeEmpresa = empresaAtiva?.nome || 'Selecione'

  // Links visíveis no cabeçalho conforme o perfil
  const navLinks = isBalanceiro
    ? [
        { label: 'Dashboard Operacional', path: '/' },
        { label: 'Lançar Cargas', path: '/lancamentos' },
        { label: 'Estoque de Insumos', path: '/estoque' },
        { label: 'Ordens & Recibos', path: '/ordens' },
        { label: 'Exames (ASO)', path: '/exames' },
      ]
    : [
        { label: 'Dashboard', path: '/' },
        { label: 'Lançar Cargas', path: '/lancamentos' },
        { label: 'Estoque', path: '/estoque' },
        { label: 'Traços / Dosagens', path: '/tracos' },
        { label: 'Cadastros', path: '/cadastros' },
        { label: 'Ordens & Recibos', path: '/ordens' },
        { label: 'Exames (ASO)', path: '/exames' },
        { label: 'Folha', path: '/folha' },
        { label: 'Relatórios', path: '/relatorios' },
      ]

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b border-border/20 md:pl-24">
        {/* Mobile Menu & Nome da Empresa */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[260px] bg-card border-r-border/30"
            >
              <div className="flex items-center gap-2 mb-6 mt-2">
                <div className="w-9 h-9 p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-border/60 flex items-center justify-center shrink-0">
                  <img
                    src={LOGO_GC_MIX_QUADRADA}
                    alt={LOGO_ALT_TEXT}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-foreground text-sm truncate leading-tight">
                    GC MIX
                  </span>
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {nomeEmpresa}
                  </span>
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === link.path
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Seletor Mobile de Empresa */}
          {podeTrocarEmpresa ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 font-bold text-xs bg-card"
                >
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[120px]">{nomeEmpresa}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs">
                  Trocar Empresa
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {empresas.map((emp) => (
                  <DropdownMenuItem
                    key={emp.id}
                    onClick={() => selecionarEmpresa(emp.id)}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={
                        empresaAtiva?.id === emp.id
                          ? 'font-bold text-primary'
                          : ''
                      }
                    >
                      {emp.nome}
                    </span>
                    {empresaAtiva?.id === emp.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                {isAdministrador && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setModalEmpresasOpen(true)}
                      className="text-xs text-primary gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Gerenciar Empresas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-8 gap-1.5 px-2.5 rounded-md border border-border/40 bg-card flex items-center font-bold text-xs">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[120px]">{nomeEmpresa}</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'relative text-sm font-medium transition-colors hover:text-foreground py-1.5',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground',
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Seletor Desktop de Empresa, Perfil e Usuário/Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Instalar como PWA (exibido quando suportado pelo navegador) */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={installApp}
              className="h-9 px-3 gap-1.5 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold shadow-sm transition-all animate-in fade-in"
              title="Instalar GC MIX como aplicativo no computador ou celular"
            >
              <Download className="w-4 h-4 text-primary animate-bounce" />
              <span className="hidden sm:inline">Instalar App</span>
            </Button>
          )}{' '}
          {/* Badge de Perfil (Vinculado ao cadastro do usuário) */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs bg-card ${
              isBalanceiro
                ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400'
                : 'border-primary/40 bg-primary/5 text-primary'
            }`}
          >
            {isBalanceiro ? (
              <Scale className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <div className="text-left">
              <span className="block font-bold leading-tight">
                {nomePerfil}
              </span>
              <span className="block text-[9px] text-muted-foreground leading-none">
                {isBalanceiro ? 'Expedição & OS' : 'Controle Total'}
              </span>
            </div>
          </div>
          {/* Seletor Desktop de Empresa e Status */}
          {podeTrocarEmpresa ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 h-9 px-3 bg-card border-border/50 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Building2 className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <span className="block text-xs font-bold leading-tight">
                      {nomeEmpresa}
                    </span>
                    <span className="block text-[10px] text-muted-foreground leading-none">
                      Unidade Ativa
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  Unidades Operacionais
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {empresas.map((emp) => {
                  const isAtiva = empresaAtiva?.id === emp.id
                  return (
                    <DropdownMenuItem
                      key={emp.id}
                      onClick={() => selecionarEmpresa(emp.id)}
                      className="flex items-center justify-between cursor-pointer py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                            isAtiva
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {emp.nome.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <span
                            className={`text-xs block ${isAtiva ? 'font-bold text-primary' : ''}`}
                          >
                            {emp.nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            slug: {emp.slug}
                          </span>
                        </div>
                      </div>
                      {isAtiva && (
                        <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
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
                      className="text-xs text-primary gap-1.5 cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Gerenciar / Cadastrar Unidade
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-border/50 bg-card shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <Building2 className="w-4 h-4 text-primary" />
              <div className="text-left">
                <span className="block text-xs font-bold leading-tight">
                  {nomeEmpresa}
                </span>
                <span className="block text-[10px] text-muted-foreground leading-none">
                  Unidade Fixa
                </span>
              </div>
            </div>
          )}
          {/* Menu do Usuário Logado & Logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 sm:px-3 text-xs gap-2 bg-card border-border/50 hover:border-primary/40 shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {nomeUsuario.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left hidden md:block max-w-[120px]">
                  <span className="block font-bold leading-tight truncate">
                    {nomeUsuario}
                  </span>
                  <span className="block text-[9px] text-muted-foreground leading-none truncate">
                    {emailUsuario}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
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
                    <span>• {empresaVinculadaNome}</span>
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
