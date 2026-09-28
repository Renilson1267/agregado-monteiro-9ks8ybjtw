import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"

export default function Layout() {
  // Estado de colapso da sidebar persistido em localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("gcmix-sidebar-collapsed")
      return saved === "true"
    } catch {
      return false
    }
  })

  // Estado da gaveta mobile acionada pelo Header
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("gcmix-sidebar-collapsed", String(next))
      } catch {
        // ignora se localStorage não disponível
      }
      return next
    })
  }

  // Sincroniza listener de resize para fechar menu mobile ao passar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col md:flex-row">
      {/* Sidebar Desktop Fixa à Esquerda + Gaveta Mobile */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Conteúdo à Direita: cabeçalho fino superior + área de páginas */}
      <div
        className={cn(
          "flex flex-col flex-1 min-h-screen w-full transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:pl-18" : "md:pl-64",
        )}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
