import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  RefreshCw,
  Settings,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: FileText, label: 'Cryptocurrency', path: '/cryptocurrency' },
  { icon: RefreshCw, label: 'Exchange', path: '/exchange' },
  { icon: Settings, label: 'Community', path: '/community' },
]

export function Sidebar() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  return (
    <aside
      id="sidebar"
      className="hidden md:flex flex-col items-center w-20 py-6 bg-background border-r border-border/10 h-screen fixed left-0 top-0 z-50 transition-colors duration-300"
    >
      <div className="mb-10">
        <Link
          to="/"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-card text-foreground font-bold text-xl shadow-sm hover:scale-105 transition-transform"
        >
          P
        </Link>
      </div>

      <nav className="flex flex-col gap-6 w-full items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
              title={item.label}
            >
              <item.icon className="w-6 h-6" />
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary translate-x-2" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <Button
          id="theme-toggle"
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Toggle Theme"
        >
          <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </aside>
  )
}
