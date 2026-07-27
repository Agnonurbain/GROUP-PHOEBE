import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Version du hook shadcn réécrite avec `useSyncExternalStore`.
 *
 * L'original posait son état dans un `useEffect`, ce que la règle
 * `react-hooks/set-state-in-effect` du projet rejette (et qui provoque un rendu
 * de trop). `useSyncExternalStore` est le motif prévu pour s'abonner à une
 * source extérieure : pas d'effet, pas d'état intermédiaire, et un snapshot
 * serveur explicite (`false`) pour un rendu cohérent.
 */
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
