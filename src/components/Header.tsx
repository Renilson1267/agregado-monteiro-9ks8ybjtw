import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Reports', path: '/reports' },
  { label: 'Cryptocurrency', path: '/cryptocurrency' },
  { label: 'Exchange', path: '/exchange' },
  { label: 'Community', path: '/community' },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b border-border/10 md:pl-24">
      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[240px] bg-card border-r-border"
          >
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'text-lg font-medium transition-colors',
                    location.pathname === link.path
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'relative text-sm font-medium transition-colors hover:text-foreground py-2',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {link.label}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-foreground leading-none">
            Ilona Smliduet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ilondut46@gmail.com
          </p>
        </div>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage
            src="https://img.usecurling.com/ppl/medium?gender=female"
            alt="Ilona Smliduet"
          />
          <AvatarFallback>IS</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
