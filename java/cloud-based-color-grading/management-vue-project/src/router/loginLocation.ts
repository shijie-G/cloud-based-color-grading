const LOGIN_ENTRY = '/login.html'
const LOGIN_ROUTE = '/login'

export function toLoginLocation(redirectPath?: string): string {
  const query = redirectPath
    ? `?redirect=${encodeURIComponent(redirectPath)}`
    : ''

  return `${LOGIN_ENTRY}#${LOGIN_ROUTE}${query}`
}

export function redirectBrowserToLogin(redirectPath?: string): void {
  window.location.href = toLoginLocation(redirectPath)
}
