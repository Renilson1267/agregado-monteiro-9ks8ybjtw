// Service Worker simples e seguro para o PWA GC MIX Concreto Usinado
// Versão do cache: alterar para invalidar cache estático (build v13 trigger - força atualização dos aparelhos)
const CACHE_NAME = "gcmix-pwa-v13"

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

// Instalação: pré-carrega os recursos básicos e força ativação imediata
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// Ativação: limpa versões antigas do cache e assume controle de abas abertas
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
    event.respondWith(caches.match(request).then((cachedResponse) => {
        // Se já temos no cache, retornamos e atualizamos em segundo plano se necessário
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return networkResponse
          })
          .catch(() => {
            // Em caso de falha de rede ao buscar asset, cachedResponse já cuidará se existir
            return null
          })

        return cachedResponse || fetchPromise
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
