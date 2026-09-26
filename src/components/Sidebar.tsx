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
  Layers,
  Building2,
  Settings,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useEmpresa } from '@/hooks/use-empresa'
import { useUsuario } from '@/hooks/use-usuario'
import { ModalGerenciarEmpresas } from '@/components/ModalGerenciarEmpresas'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Lançar Cargas', path: '/lancamentos' },
  { icon: Boxes, label: 'Estoque', path: '/estoque' },
  { icon: FlaskConical, label: 'Traços / Dosagens', path: '/tracos' },
  { icon: Users, label: 'Cadastros', path: '/cadastros' },
  { icon: FileText, label: 'Ordens & Recibos', path: '/ordens' },
  { icon: FileSpreadsheet, label: 'Relatórios', path: '/relatorios' },
]

export function Sidebar() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { empresaAtiva } = useEmpresa()
  const { isBalanceiro } = useUsuario()
  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false)

  return (
    <>
      <aside
        id="sidebar"
        className="hidden md:flex flex-col items-center w-20 py-6 bg-background border-r border-border/20 h-screen fixed left-0 top-0 z-50 transition-colors duration-300"
      >
        <div className="mb-4">
          <Link
            to={isBalanceiro ? '/lancamentos' : '/'}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-md hover:scale-105 transition-transform"
            title={`Concreteira - ${empresaAtiva?.nome || 'Sistema'}`}
          >
            <Layers className="w-6 h-6" />
          </Link>
        </div>

        {/* Badge da Empresa Atual / Botão para Gerenciar */}
        <div className="mb-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setModalEmpresasOpen(true)}
            className="w-12 py-1.5 px-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex flex-col items-center gap-0.5 transition-all text-center group"
            title={`Unidade: ${empresaAtiva?.nome || 'Trocar'}. Clique para gerenciar.`}
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
        </div>
      </aside>

      <ModalGerenciarEmpresas
        open={modalEmpresasOpen}
        onOpenChange={setModalEmpresasOpen}
      />
    </>
  )
}
