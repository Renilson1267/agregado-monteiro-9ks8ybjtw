import { useEffect, useState } from "react"

/**
 * Banner de atualização do PWA GC MIX.
 *
 * Detecta quando um novo Service Worker está instalado e pronto
 * (estado "installed" com controller existente) e mostra um banner
 * fixo na parte inferior da tela: "Nova versão disponível — Toque para atualizar".
 *
 * Ao tocar: envia SKIP_WAITING ao SW novo e recarrega a página,
 * garantindo que o aparelho passe a rodar a versão mais recente.
 *
 * Também verifica periodicamente (a cada 60 min) se há atualização,
 * cobrindo o caso de aparelho que fica aberto por muito tempo.
 */
export function AtualizacaoPwaBanner() {
  const [precisaAtualizar, setPrecisaAtualizar] = useState(false)
  const [recarregando, setRecarregando] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

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
      .register("/sw.js?v=gcmix-pwa-v16", { scope: "/" })
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
    let recarregandoFlag = false
    const aoTrocarController = () => {
      if (!recarregandoFlag) {
        recarregandoFlag = true
        window.location.reload()
      }
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
        registro.waiting?.postMessage({ type: "SKIP_WAITING" })
      })
      .catch(() => {})
    // Garantia: se o controllerchange não disparar em 3s, recarrega direto
    window.setTimeout(() => {
      window.location.reload()
    }, 3000)
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
