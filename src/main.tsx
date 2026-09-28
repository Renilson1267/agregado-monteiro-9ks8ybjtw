/* Main entry point for the application - renders the root React component */
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./main.css"
import { initializePwaAssets, registerPwaServiceWorker } from "./lib/pwa-init"
import { FolhaService } from "./services/folha"

initializePwaAssets()
registerPwaServiceWorker()

// Executa autoseed da folha em background caso a tabela de linhas ainda esteja sem dados
FolhaService.garantirSeedFolha().catch((err) => {
  console.warn("[Folha] Verificação de seed:", err)
})

createRoot(document.getElementById("root")!).render(<App />)
