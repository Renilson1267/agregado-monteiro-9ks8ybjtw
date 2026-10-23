import { useEffect, useState } from "react"
import { SW_REGISTRATION_URL } from "@/lib/pwa-version"

const SW_RELOAD_FLAG_KEY = "sw-reload-ja-feito"
const TEMPO_MINIMO_CARGA_MS = 5000 // Só recarrega se a página já estiver carregada há pelo menos 5s

/**
 * Banner de atualização do PWA GC MIX.
 *
 * Detecta quando um novo Service Worker está instalado e pronto
 * (estado "installed" com controller existente) e mostra um banner
 * fixo na parte inferior da tela: "Nova versão disponível — Toque para atualizar".
 *
 * Ao tocar: envia SKIP_WAITING ao SW novo.
 *
 * Proteções contra loop infinito de recarga:
 * 1) No 'controllerchange', só recarrega UMA vez por sessão (flag em sessionStorage com auto-limpeza)
 * 2) Nunca recarrega se a página acabou de carregar (menos de ~5s)
 * 3) Sem setTimeout incondicional de 3s
 */
export function AtualizacaoPwaBanner() {
  const [precisaAtualizar, setPrecisaAtualizar] = useState(false)
  const [recarregando, setRecarregando] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const momentoInicioPagina = performance.now()
    let swRegistro: ServiceWorkerRegistration | null = null

    const aoEncontrarAtualizacao = () => {
      setPrecisaAtualizar(true)
    }

    const vigiarRegistro = (registro: ServiceWorkerRegistration) => {
      swRegistro = registro
      // SW novo já instalado e esperando (caso comum: abriu o app depois do deploy)
      if (registro.waiting && navigator.serviceWorker.controller) {
        aoEncontrarAtualizacao()
      }
      // SW novo em instalação agora
      registro.addEventListener("updatefound", () => {
        const instalando = registro.installing
        if (!instalando) return
        instalando.addEventListener("statechange", () => {
          if (
            instalando.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            aoEncontrarAtualizacao()
          }
        })
      })
    }

    navigator.serviceWorker
      .register(SW_REGISTRATION_URL, { scope: "/" })
      .then((registro) => {
        vigiarRegistro(registro)
        // Verificação periódica (a cada 60 min) enquanto o app estiver aberto
        const intervalo = window.setInterval(
          () => {
            registro.update().catch(() => {})
          },
          60 * 60 * 1000,
        )
        return () => window.clearInterval(intervalo)
      })
      .catch(() => {
        // Sem SW (ex.: modo privado) — banner simplesmente não aparece
      })

    // Caso o registro já exista de uma carga anterior do módulo
    navigator.serviceWorker.ready.then(vigiarRegistro).catch(() => {})

    // Quando o SW novo assumir o controle, recarrega para carregar o bundle novo
    // Proteções anti-loop:
    // - Recarregar no máximo 1 vez por sessão via sessionStorage
    // - Nunca recarregar se a página acabou de abrir (< 5s de uptime)
    let recarregandoFlag = false
    const aoTrocarController = () => {
      if (recarregandoFlag) return

      const uptime = performance.now() - momentoInicioPagina
      if (uptime < TEMPO_MINIMO_CARGA_MS) {
        console.warn(
          `[PWA] controllerchange ignorado: página carregada há apenas ${Math.round(uptime)}ms (< ${TEMPO_MINIMO_CARGA_MS}ms).`,
        )
        return
      }

      try {
        const jaRecarregou = sessionStorage.getItem(SW_RELOAD_FLAG_KEY)
        if (jaRecarregou) {
          console.warn(
            "[PWA] controllerchange ignorado: reload já executado nesta sessão.",
          )
          return
        }
        sessionStorage.setItem(SW_RELOAD_FLAG_KEY, "true")
        // Limpar após 15 segundos para não bloquear atualizações futuras em sessões longas
        setTimeout(() => {
          try {
            sessionStorage.removeItem(SW_RELOAD_FLAG_KEY)
          } catch {
            /* intentionally ignored */
          }
        }, 15000)
      } catch {
        /* intentionally ignored */
      }

      recarregandoFlag = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      aoTrocarController,
    )

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        aoTrocarController,
      )
      void swRegistro
    }
  }, [])

  const atualizarAgora = () => {
    setRecarregando(true)
    navigator.serviceWorker.ready
      .then((registro) => {
        if (registro.waiting) {
          registro.waiting.postMessage({ type: "SKIP_WAITING" })
        } else {
          // Se não houver waiting explícito, aciona reload controlado
          window.location.reload()
        }
      })
      .catch(() => {
        window.location.reload()
      })
  }

  if (!precisaAtualizar) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-primary/40 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {recarregando ? "Atualizando…" : "Nova versão disponível"}
          </p>
          <p className="text-xs text-muted-foreground">
            {recarregando
              ? "Aplicando a atualização do GC MIX…"
              : "Toque para atualizar o app agora"}
          </p>
        </div>
        <button
          type="button"
          onClick={atualizarAgora}
          disabled={recarregando}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {recarregando ? "…" : "Atualizar"}
        </button>
      </div>
    </div>
  )
}
