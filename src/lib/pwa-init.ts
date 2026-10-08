// Utilitário para sintetizar e injetar ícones PWA e favicons
// Usa Canvas no browser para renderizar a imagem oficial LOGO_GC_MIX_QUADRADA com qualidade máxima
// e substitui/injeta nas tags de favicon e apple-touch-icon dinamicamente

import { LOGO_GC_MIX_QUADRADA } from "@/assets/logos"

export function initializePwaAssets() {
  if (typeof window === "undefined") return

  // Gera ícones em Canvas a partir da logo oficial com fundo e proporção perfeitos
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.onload = () => {
    try {
      const sizes = [32, 180, 192, 512]
      const icons: Record<number, string> = {}

      for (const size of sizes) {
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) continue

        // Fundo azul escuro profissional (#0d1b2a)
        ctx.fillStyle = "#0d1b2a"
        ctx.fillRect(0, 0, size, size)

        // Moldura proporcional com padding para safe-area de ícone maskable e padrão
        const pad = Math.round(size * 0.08)
        const innerSize = size - pad * 2
        ctx.drawImage(img, pad, pad, innerSize, innerSize)

        icons[size] = canvas.toDataURL("image/png")

        // Armazenar no Cache Storage do navegador diretamente para que
        // requisições a /pwa-192x192.png e /pwa-512x512.png respondam com o PNG
        canvas.toBlob((blob) => {
          if (blob && "caches" in window) {
            caches.open("gcmix-pwa-v16").then((cache) => {
              const headers = new Headers({
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000",
              })
              const response = new Response(blob, { headers })
              if (size === 192) {
                cache.put("/pwa-192x192.png", response.clone())
                cache.put("/pwa-maskable-192x192.png", response.clone())
              } else if (size === 512) {
                cache.put("/pwa-512x512.png", response.clone())
                cache.put("/pwa-maskable-512x512.png", response.clone())
              } else if (size === 180) {
                cache.put("/apple-touch-icon.png", response.clone())
              }
            })
          }
        }, "image/png")
      }

      // Atualizar favicon dinamicamente
      if (icons[32]) {
        let linkFavicon =
          document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!linkFavicon) {
          linkFavicon = document.createElement("link")
          linkFavicon.rel = "icon"
          document.head.appendChild(linkFavicon)
        }
        linkFavicon.type = "image/png"
        linkFavicon.href = icons[32]
      }

      // Atualizar apple-touch-icon
      if (icons[180]) {
        const appleLinks = document.querySelectorAll<HTMLLinkElement>(
          'link[rel="apple-touch-icon"]',
        )
        appleLinks.forEach((link) => {
          link.href = icons[180]
        })
      }
    } catch (e) {
      console.warn("Falha ao processar assets PWA via Canvas:", e)
    }
  }

  img.src = LOGO_GC_MIX_QUADRADA
}

// Registro e gerenciamento do Service Worker com ciclo de vida seguro
export function registerPwaServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  // Apenas registrar após o carregamento da janela para não impactar a inicialização do app
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js?v=gcmix-pwa-v16", { scope: "/" })
      .then((registration) => {
        // Verificar atualizações periódicas
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing
          if (installingWorker == null) return

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "Nova versão do GC MIX PWA disponível. Pronto para atualizar.",
              )
              // Notificar o SW para pular espera
              installingWorker.postMessage({ type: "SKIP_WAITING" })
            }
          })
        })
      })
      .catch((error) => {
        console.warn("Falha no registro do Service Worker:", error)
      })

    // Ao mudar o controller (SW assumiu uma nova versão)
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        // Não força recarregamento abrupto enquanto o usuário está preenchendo um formulário,
        // mas avisa nos logs e na próxima navegação ou recarregamento a nova versão estará ativa
        console.log(
          "GC MIX PWA atualizado com sucesso para a versão mais recente.",
        )
      }
    })
  })
}
