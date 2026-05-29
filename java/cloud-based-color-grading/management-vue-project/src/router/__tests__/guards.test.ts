import { describe, expect, it, beforeEach, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { redirectBrowserToLogin } from '../loginLocation'
import { setupRouterGuards } from '../guards'

vi.mock('../loginLocation', () => ({
  redirectBrowserToLogin: vi.fn()
}))

const makeRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: { template: '<div />' },
      meta: { requiresAuth: false }
    },
    {
      path: '/gallery',
      name: 'Gallery',
      component: { template: '<div />' },
      meta: { requiresAuth: true }
    }
  ]
})

const makeStationRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'Home',
      component: { template: '<div />' },
      meta: { requiresAuth: false }
    },
    {
      path: '/workstation',
      name: 'Workstation',
      component: { template: '<div />' },
      meta: { requiresAuth: true }
    },
    {
      path: '/album/:id',
      name: 'AlbumDetail',
      component: { template: '<div />' },
      meta: { requiresAuth: true }
    }
  ]
})

describe('setupRouterGuards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(redirectBrowserToLogin).mockClear()
  })

  it('allows protected routes when user_token exists in localStorage even if store has not restored yet', async () => {
    localStorage.setItem('user_token', 'token-from-storage')
    localStorage.setItem('user_info', JSON.stringify({
      userId: 1,
      username: 'user@example.com',
      nickname: 'User',
      roles: [],
      permissions: []
    }))

    const router = makeRouter()
    setupRouterGuards(router)

    await router.push('/gallery')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/gallery')
  })

  it('redirects protected routes to login when localStorage has no user_token', async () => {
    const router = makeRouter()
    setupRouterGuards(router)

    await router.push('/gallery')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/gallery')
  })

  it('uses browser redirect when the current router has no login route', async () => {
    const router = makeStationRouter()
    setupRouterGuards(router)

    await router.push('/home')
    await router.isReady()
    await router.push('/workstation').catch(() => undefined)

    expect(redirectBrowserToLogin).toHaveBeenCalledWith('/workstation')
    expect(router.currentRoute.value.path).not.toBe('/login')
  })

  it('keeps the full original station route when redirecting to login', async () => {
    const router = makeStationRouter()
    setupRouterGuards(router)

    await router.push('/home')
    await router.isReady()
    await router.push('/album/42?tab=selected').catch(() => undefined)

    expect(redirectBrowserToLogin).toHaveBeenCalledWith('/album/42?tab=selected')
  })
})
