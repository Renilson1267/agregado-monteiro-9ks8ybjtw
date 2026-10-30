// Utilitário para sintetizar e injetar ícones PWA e favicons
// Usa Canvas no browser para renderizar a imagem oficial LOGO_GC_MIX_QUADRADA com qualidade máxima
// e substitui/injeta nas tags de favicon e apple-touch-icon dinamicamente

import { LOGO_GC_MIX_QUADRADA } from "@/assets/logos"
import { VERSAO_PWA_CACHE, SW_REGISTRATION_URL } from "@/lib/pwa-version"

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
            caches.open(VERSAO_PWA_CACHE).then((cache) => {
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
const RELOAD_PRELOAD_KEY = "pwa-reload-vite-preload"

/**
 * Trata erros de import dinâmico do Vite (ex.: chunk antigo que não existe mais após novo deploy).
 * Limpa todos os caches do Service Worker, desregistra os workers ativos e força um reload UMA única vez.
 */
export async function recuperarDeFalhaModuloDinamico(
  origemErro: string,
  detalheErro?: any,
) {
  if (typeof window === "undefined") return

  try {
    const jaRecarregou = sessionStorage.getItem(RELOAD_PRELOAD_KEY)
    if (jaRecarregou) {
      console.warn(
        `[PWA] Falha de módulo dinâmico detectada (${origemErro}), mas a página já foi recarregada nesta sessão. Ignorando loop.`,
        detalheErro,
      )
      return
    }

    sessionStorage.setItem(RELOAD_PRELOAD_KEY, "true")
    console.warn(
      `[PWA] Falha ao carregar módulo dinâmico (${origemErro}). Limpando caches e atualizando para a versão nova...`,
      detalheErro,
    )

    // 1. Limpa todos os caches do Cache Storage
    if ("caches" in window) {
      const chaves = await caches.keys()
      await Promise.all(chaves.map((k) => caches.delete(k)))
    }

    // 2. Desregistra todos os Service Workers registrados
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((reg) => reg.unregister()))
    }

    // 3. Recarrega a página forçando bypass de cache
    window.location.reload()
  } catch (err) {
    console.error("[PWA] Erro ao recuperar de falha de módulo dinâmico:", err)
    window.location.reload()
  }
}

/**
 * Registra listeners globais para 'vite:preloadError' e falhas de dynamic import no window.
 */
export function configurarTratamentoFalhaModulos() {
  if (typeof window === "undefined") return

  // Limpar a flag de reload se o usuário navegou com sucesso por mais de 20s
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(RELOAD_PRELOAD_KEY)
    } catch {
      /* ignore */
    }
  }, 20000)

  // Evento específico do Vite para falha ao pré-carregar chunks dinâmicos
  window.addEventListener("vite:preloadError", (event) => {
    console.error("[Vite] Evento vite:preloadError interceptado:", event)
    recuperarDeFalhaModuloDinamico("vite:preloadError", event)
  })

  // Falhas em Promises rejeitadas (dynamic import rejeitado: 'Failed to fetch dynamically imported module')
  window.addEventListener("unhandledrejection", (event) => {
    const motivo = event?.reason
    const mensagem =
      typeof motivo === "string"
        ? motivo
        : motivo?.message || String(motivo || "")

    if (
      mensagem.includes("Failed to fetch dynamically imported module") ||
      mensagem.includes("error loading dynamically imported module") ||
      mensagem.includes("Importing a module script failed") ||
      mensagem.includes("Loading chunk")
    ) {
      console.error("[PWA] Dynamic import failure interceptado:", mensagem)
      event.preventDefault()
      recuperarDeFalhaModuloDinamico(
        "unhandledrejection:dynamic-import",
        motivo,
      )
    }
  })
}

// Registro e gerenciamento do Service Worker com ciclo de vida seguro
export function registerPwaServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  // Configura listeners de erro de pré-carregamento de módulos
  configurarTratamentoFalhaModulos()

  // Apenas registrar após o carregamento da janela para não impactar a inicialização do app
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_REGISTRATION_URL, { scope: "/" })
      .then((registration) => {
        // Log informativo de nova versão; controle de ativação é delegado ao AtualizacaoPwaBanner
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing
          if (installingWorker == null) return

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "[PWA] Nova versão do GC MIX instalada e aguardando acionamento pelo usuário.",
              )
            }
          })
        })
      })
      .catch((error) => {
        console.warn("Falha no registro do Service Worker:", error)
      })

    // Ao mudar o controller, apenas loga aqui (o banner cuida do reload protegido)
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        console.log("[PWA] GC MIX PWA controller atualizado com sucesso.")
      }
    })
  })
}
