/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { initializePwaAssets, registerPwaServiceWorker } from './lib/pwa-init'

// Inicia os recursos PWA (Service Worker e ícones dinâmicos em alta resolução)
registerPwaServiceWorker()
initializePwaAssets()

createRoot(document.getElementById('root')!).render(<App />)
