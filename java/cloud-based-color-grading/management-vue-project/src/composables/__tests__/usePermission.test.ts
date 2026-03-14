import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermission } from '../usePermission'
import { useUserStore } from '@/stores/user'

describe('usePermission', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  it('should check single permission correctly', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view', 'system:role:create', 'system:role:edit']

    const { hasPermission } = usePermission()

    expect(hasPermission('system:role:view')).toBe(true)
    expect(hasPermission('system:role:create')).toBe(true)
    expect(hasPermission('system:role:delete')).toBe(false)
  })

  it('should return true for empty permission string', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view']

    const { hasPermission } = usePermission()

    expect(hasPermission('')).toBe(true)
  })

  it('should check any permission correctly', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view', 'system:role:create']

    const { hasAnyPermission } = usePermission()

    // Has at least one permission
    expect(hasAnyPermission(['system:role:view', 'system:role:delete'])).toBe(true)
    expect(hasAnyPermission(['system:role:create', 'system:role:edit'])).toBe(true)

    // Has none of the permissions
    expect(hasAnyPermission(['system:role:delete', 'system:role:edit'])).toBe(false)
  })

  it('should return true for empty permissions array in hasAnyPermission', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view']

    const { hasAnyPermission } = usePermission()

    expect(hasAnyPermission([])).toBe(true)
  })

  it('should check all permissions correctly', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view', 'system:role:create', 'system:role:edit']

    const { hasAllPermissions } = usePermission()

    // Has all permissions
    expect(hasAllPermissions(['system:role:view', 'system:role:create'])).toBe(true)
    expect(hasAllPermissions(['system:role:view'])).toBe(true)

    // Missing at least one permission
    expect(hasAllPermissions(['system:role:view', 'system:role:delete'])).toBe(false)
    expect(hasAllPermissions(['system:role:delete', 'system:role:edit'])).toBe(false)
  })

  it('should return true for empty permissions array in hasAllPermissions', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view']

    const { hasAllPermissions } = usePermission()

    expect(hasAllPermissions([])).toBe(true)
  })

  it('should handle user with no permissions', () => {
    const userStore = useUserStore()
    userStore.permissions = []

    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

    expect(hasPermission('system:role:view')).toBe(false)
    expect(hasAnyPermission(['system:role:view', 'system:role:create'])).toBe(false)
    expect(hasAllPermissions(['system:role:view'])).toBe(false)
  })

  it('should handle complex permission scenarios', () => {
    const userStore = useUserStore()
    userStore.permissions = [
      'system:role:view',
      'system:role:create',
      'system:menu:view',
      'system:permission:view'
    ]

    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

    // Single permission checks
    expect(hasPermission('system:role:view')).toBe(true)
    expect(hasPermission('system:role:delete')).toBe(false)

    // Any permission checks
    expect(hasAnyPermission(['system:role:view', 'system:role:edit'])).toBe(true)
    expect(hasAnyPermission(['system:role:delete', 'system:role:edit'])).toBe(false)

    // All permissions checks
    expect(hasAllPermissions(['system:role:view', 'system:menu:view'])).toBe(true)
    expect(hasAllPermissions(['system:role:view', 'system:role:delete'])).toBe(false)
  })

  it('should react to permission changes', () => {
    const userStore = useUserStore()
    userStore.permissions = ['system:role:view']

    const { hasPermission } = usePermission()

    expect(hasPermission('system:role:view')).toBe(true)
    expect(hasPermission('system:role:create')).toBe(false)

    // Update permissions
    userStore.permissions = ['system:role:view', 'system:role:create']

    expect(hasPermission('system:role:view')).toBe(true)
    expect(hasPermission('system:role:create')).toBe(true)
  })
})
