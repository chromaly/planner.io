import { useLayoutEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// Keep desktop mode when React navigation replaces a route's query string.
// Normal website sessions never acquire this marker through this component.
export function DesktopModeRouteGuard() {
  const location = useLocation()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    if (document.documentElement.dataset.unico !== "true") return
    const params = new URLSearchParams(location.search)
    if (params.get("embed") === "uni") return
    params.set("embed", "uni")
    navigate({
      pathname: location.pathname,
      search: `?${params.toString()}`,
      hash: location.hash,
    }, { replace: true, state: location.state })
  }, [location, navigate])

  return null
}
