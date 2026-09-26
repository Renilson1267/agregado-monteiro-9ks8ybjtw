import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from './components/Layout'
import Index from './pages/Index'
import LancamentoCargas from './pages/LancamentoCargas'
import Estoque from './pages/Estoque'
import Tracos from './pages/Tracos'
import Cadastros from './pages/Cadastros'
import Relatorios from './pages/Relatorios'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/lancamentos" element={<LancamentoCargas />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/tracos" element={<Tracos />} />
            <Route path="/cadastros" element={<Cadastros />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
)

export default App
