import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Menu, Layers, ShieldCheck } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Lançar Cargas', path: '/lancamentos' },
  { label: 'Estoque', path: '/estoque' },
  { label: 'Traços / Dosagens', path: '/tracos' },
  { label: 'Cadastros', path: '/cadastros' },
  { label: 'Relatórios', path: '/relatorios' },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b border-border/20 md:pl-24">
      {/* Mobile Menu */}
      <div className="md:hidden flex items-center gap-3">
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
                Concreteira Monteiro
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
        <span className="font-bold text-sm">Concreteira Monteiro</span>
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

      {/* Status da Usina / Operação Interna */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-foreground leading-none flex items-center justify-end gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Usina Monteiro - Operação Ativa
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Controle Diário de Agregados
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  )
}
