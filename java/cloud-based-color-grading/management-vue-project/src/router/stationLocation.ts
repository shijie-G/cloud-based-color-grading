const STATION_ENTRY = '/station.html'
const STATION_ROUTES = ['/home', '/workstation', '/gallery', '/album', '/personalize']

export function toStationLocation(path: string): string {
  if (!path) {
    return `${STATION_ENTRY}#/workstation`
  }

  if (path.startsWith(`${STATION_ENTRY}#`) || path.startsWith('/station/#')) {
    return path
  }

  if (path === '/login' || path.startsWith('/login?')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const isStationRoute = STATION_ROUTES.some((routePath) => (
    normalizedPath === routePath || normalizedPath.startsWith(`${routePath}/`) || normalizedPath.startsWith(`${routePath}?`)
  ))

  if (!isStationRoute) {
    return path
  }

  return `${STATION_ENTRY}#${normalizedPath}`
}
