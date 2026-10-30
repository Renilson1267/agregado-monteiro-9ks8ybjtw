// Service Worker simples e seguro para o PWA GC MIX Concreto Usinado
// Versão do cache: alterar para invalidar cache estático (build v127 - 0.0.398)
const CACHE_NAME = "gcmix-pwa-v127"
// Recursos estáticos básicos essenciais para abrir o shell do app offline
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/manifest.json",
  "/favicon.ico",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png",
]

// Instalação: pré-carrega os recursos básicos e aciona skipWaiting para não travar em versões defasadas
self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  )
})

// Ativação: limpa versões antigas do cache e assume o controle imediatamente dos clientes (clientsClaim)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// Interceptação de requisições:
// Regra 1: Chamadas para APIs, Supabase, autenticação e WebSocket são NETWORK-ONLY (nunca travam dados nem respostas POST/PUT/DELETE)
// Regra 2: Documentos e navegação SPA: network-first com fallback para index.html em cache se estiver offline
// Regra 3: Assets estáticos (js, css, imagens, fontes): stale-while-revalidate ou cache-first com atualização em background
self.addEventListener("fetch", (event) => {
  const request = event.request

  // Apenas métodos GET são considerados para cache
  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)

  // Ignorar chamadas Supabase, REST/PostgREST, Auth e outros backends externos
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.in") ||
    url.hostname.includes("goskip.dev") ||
    url.pathname.startsWith("/rest/v1") ||
    url.pathname.startsWith("/auth/v1") ||
    url.pathname.startsWith("/storage/v1") ||
    url.pathname.startsWith("/functions/v1") ||
    url.pathname.startsWith("/realtime/v1")
  ) {
    // Network only para banco de dados e APIs em tempo real
    return
  }

  // Interceptar requisições para os ícones PWA caso não existam em disco físico
  if (
    url.origin === self.location.origin &&
    (url.pathname === "/pwa-192x192.png" ||
      url.pathname === "/pwa-512x512.png" ||
      url.pathname === "/apple-touch-icon.png" ||
      url.pathname === "/pwa-maskable-192x192.png" ||
      url.pathname === "/pwa-maskable-512x512.png")
  ) {
    event.respondWith(caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).catch(async () => {
          // Se não existir, tenta favicon ou retorna do cache do shell
          const cache = await caches.open(CACHE_NAME)
          const fallback = await cache.match("/favicon.ico")
          return fallback || new Response("", { status: 404 })
        })
      }))
    return
  }
  // Se for navegação de página SPA (documentos HTML)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedIndex = await cache.match("/index.html")
        return cachedIndex || (await cache.match("/"))
      }),
    )
    return
  }

  // Para assets estáticos da mesma origem (CSS, JS com hash do Vite, imagens, ícones)
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then(async (cachedResponse) => {
        try {
          const networkResponse = await fetch(request)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
            return networkResponse
          }

          // Se a rede respondeu 404/410/500 para um asset JS/CSS (ex.: chunk antigo que não existe mais no servidor)
          if (
            networkResponse &&
            (networkResponse.status === 404 || networkResponse.status === 410)
          ) {
            // Se tiver no cache, ainda podemos tentar; se não houver cache do asset:
            if (!cachedResponse) {
              // Limpar caches antigos para que a próxima requisição não pegue lixo
              const cacheNames = await caches.keys()
              await Promise.all(
                cacheNames
                  .filter((name) => name !== CACHE_NAME)
                  .map((name) => caches.delete(name)),
              )

              // Para requisições JS/CSS ou assets que falharam na rede com 404, devolver index.html como fallback
              // forçando a aplicação/navegador a recarregar a versão nova
              const cache = await caches.open(CACHE_NAME)
              const fallbackIndex =
                (await cache.match("/index.html")) || (await cache.match("/"))
              if (fallbackIndex) {
                return fallbackIndex
              }
            }
          }

          return cachedResponse || networkResponse
        } catch (_fetchErr) {
          // Falha total de rede (offline ou conexão perdida)
          if (cachedResponse) {
            return cachedResponse
          }

          // Cache miss + rede falhando: limpar caches antigos e devolver index.html como fallback
          try {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames
                .filter((name) => name !== CACHE_NAME)
                .map((name) => caches.delete(name)),
            )
            const cache = await caches.open(CACHE_NAME)
            const fallbackIndex =
              (await cache.match("/index.html")) || (await cache.match("/"))
            if (fallbackIndex) {
              return fallbackIndex
            }
          } catch {
            /* ignore fallback error */
          }

          return new Response("Asset indisponível offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        }
      }))
    return
  }

  // Para fontes externas (Google Fonts), tentar cache-first com fallback de rede
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
      }))
  }
})

// Ouvir mensagens de atualização da aplicação
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
