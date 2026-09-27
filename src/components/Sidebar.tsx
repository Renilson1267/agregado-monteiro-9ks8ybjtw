import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Truck,
  Boxes,
  FlaskConical,
  Users,
  Sun,
  Moon,
  Building2,
  Settings,
  FileText,
  FileSpreadsheet,
  HeartPulse,
} from 'lucide-react'
import { LOGO_GC_MIX_QUADRADA, LOGO_ALT_TEXT } from '@/assets/logos'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { ModalGerenciarEmpresas } from '@/components/ModalGerenciarEmpresas'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { empresaAtiva } = useEmpresa()
  const { isBalanceiro, isAdministrador, podeTrocarEmpresa } = useUsuario()
  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false)

  const navItems = isBalanceiro
    ? [
        { icon: LayoutDashboard, label: 'Dashboard Operacional', path: '/' },
        { icon: Truck, label: 'Lançar Cargas', path: '/lancamentos' },
        { icon: Boxes, label: 'Estoque de Insumos', path: '/estoque' },
        { icon: FileText, label: 'Ordens & Recibos', path: '/ordens' },
        {
          icon: HeartPulse,
          label: 'Controle de Exames (ASO)',
          path: '/exames',
        },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Truck, label: 'Lançar Cargas', path: '/lancamentos' },
        { icon: Boxes, label: 'Estoque', path: '/estoque' },
        { icon: FlaskConical, label: 'Traços / Dosagens', path: '/tracos' },
        { icon: Users, label: 'Cadastros', path: '/cadastros' },
        { icon: FileText, label: 'Ordens & Recibos', path: '/ordens' },
        {
          icon: HeartPulse,
          label: 'Controle de Exames (ASO)',
          path: '/exames',
        },
        { icon: FileSpreadsheet, label: 'Relatórios', path: '/relatorios' },
      ]

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside
        id="sidebar"
        className="hidden md:flex flex-col items-center w-20 py-6 bg-background border-r border-border/20 h-screen fixed left-0 top-0 z-50 transition-colors duration-300"
      >
        <div className="mb-4">
          <Link
            to="/"
            className="flex items-center justify-center w-13 h-13 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-border/60 shadow-md hover:scale-105 transition-all overflow-hidden"
            title={`GC MIX Concreto Usinado & Pedreira Cordeiro — ${empresaAtiva?.nome || 'Sistema'}`}
          >
            <img
              src={LOGO_GC_MIX_QUADRADA}
              alt={LOGO_ALT_TEXT}
              className="w-full h-full object-contain rounded-xl"
            />
          </Link>
        </div>

        {/* Badge da Empresa Atual / Botão para Gerenciar */}
        <div className="mb-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              if (podeTrocarEmpresa && isAdministrador) {
                setModalEmpresasOpen(true)
              }
            }}
            disabled={!podeTrocarEmpresa || !isAdministrador}
            className={`w-12 py-1.5 px-1 rounded-xl bg-primary/10 text-primary border border-primary/20 flex flex-col items-center gap-0.5 transition-all text-center group ${
              podeTrocarEmpresa && isAdministrador
                ? 'hover:bg-primary/20 cursor-pointer'
                : 'cursor-default opacity-80'
            }`}
            title={`Unidade: ${empresaAtiva?.nome || 'Trocar'}`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-tight uppercase truncate max-w-[42px] leading-none">
              {empresaAtiva?.slug?.toUpperCase() || 'UNID'}
            </span>
          </button>
        </div>

        <nav className="flex flex-col gap-4 w-full items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          {isAdministrador && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setModalEmpresasOpen(true)}
              className="w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Gerenciar Empresas / Unidades"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Configurações de Empresas</span>
            </Button>
          )}

          <Button
            id="theme-toggle"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Alternar Tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
            title="Sair do Sistema"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </aside>

      <ModalGerenciarEmpresas
        open={modalEmpresasOpen}
        onOpenChange={setModalEmpresasOpen}
      />
    </>
  )
}
