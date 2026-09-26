import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from './components/Layout'
import Index from './pages/Index'
import Reports from './pages/Reports'
import Cryptocurrency from './pages/Cryptocurrency'
import Exchange from './pages/Exchange'
import Community from './pages/Community'
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
            <Route path="/reports" element={<Reports />} />
            <Route path="/cryptocurrency" element={<Cryptocurrency />} />
            <Route path="/exchange" element={<Exchange />} />
            <Route path="/community" element={<Community />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
)

export default App
