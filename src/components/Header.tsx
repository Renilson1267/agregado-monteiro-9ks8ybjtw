import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Menu,
  Layers,
  Building2,
  ChevronDown,
  Plus,
  User,
  Scale,
  ShieldCheck,
} from 'lucide-react'
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
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario, PerfilUsuario } from '@/hooks/use-usuario'
import { ModalGerenciarEmpresas } from '@/components/ModalGerenciarEmpresas'
import { useNavigate } from 'react-router-dom'

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Lançar Cargas', path: '/lancamentos' },
  { label: 'Estoque', path: '/estoque' },
  { label: 'Traços / Dosagens', path: '/tracos' },
  { label: 'Cadastros', path: '/cadastros' },
  { label: 'Ordens & Recibos', path: '/ordens' },
  { label: 'Relatórios', path: '/relatorios' },
]

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { empresas, empresaAtiva, selecionarEmpresa } = useEmpresa()
  const { perfil, isBalanceiro, alternarPerfil, nomePerfil } = useUsuario()
  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false)

  const nomeEmpresa = empresaAtiva?.nome || 'Selecione'

  const handleTrocarPerfil = (novo: PerfilUsuario) => {
    alternarPerfil(novo)
    if (novo === 'balanceiro') {
      navigate('/lancamentos')
    }
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
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-foreground">
                  Concreteira {nomeEmpresa}
                </span>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setModalEmpresasOpen(true)}
                className="text-xs text-primary gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Gerenciar Empresas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        {/* Seletor Desktop de Empresa, Perfil e Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Seletor de Perfil (Administrador vs Balanceiro) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 px-2.5 sm:px-3 text-xs gap-1.5 bg-card border-border/50 hover:border-primary/40 shadow-sm ${
                  isBalanceiro ? 'border-amber-500/50 bg-amber-500/5' : ''
                }`}
                title={`Perfil ativo: ${nomePerfil}. Clique para alternar.`}
              >
                {isBalanceiro ? (
                  <Scale className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                )}
                <div className="text-left hidden sm:block">
                  <span className="block font-bold leading-tight">
                    {nomePerfil}
                  </span>
                  <span className="block text-[9px] text-muted-foreground leading-none">
                    {isBalanceiro ? 'Expedição Direta' : 'Acesso Geral'}
                  </span>
                </div>
                <span className="sm:hidden font-semibold text-[11px]">
                  {isBalanceiro ? 'Balanceiro' : 'Admin'}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">
                Perfil do Operador
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleTrocarPerfil('administrador')}
                className="flex items-center justify-between cursor-pointer py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <div>
                    <span
                      className={`block ${perfil === 'administrador' ? 'font-bold text-primary' : ''}`}
                    >
                      Administrador
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Visão geral, dashboards, relatórios e pré-preenchimento
                    </span>
                  </div>
                </div>
                {perfil === 'administrador' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleTrocarPerfil('balanceiro')}
                className="flex items-center justify-between cursor-pointer py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <div>
                    <span
                      className={`block ${perfil === 'balanceiro' ? 'font-bold text-amber-600 dark:text-amber-400' : ''}`}
                    >
                      Balanceiro
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Cai direto na expedição e campos liberados vazios
                    </span>
                  </div>
                </div>
                {perfil === 'balanceiro' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Seletor Desktop de Empresa e Status */}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setModalEmpresasOpen(true)}
                className="text-xs text-primary gap-1.5 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Gerenciar / Cadastrar Unidade
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
