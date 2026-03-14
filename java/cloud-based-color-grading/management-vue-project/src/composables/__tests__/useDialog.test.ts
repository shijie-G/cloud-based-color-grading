import { describe, it, expect } from 'vitest'
import { useDialog } from '../useDialog'

describe('useDialog', () => {
  it('should initialize with default values', () => {
    const { visible, loading } = useDialog()

    expect(visible.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('should open dialog', () => {
    const { visible, loading, open } = useDialog()

    open()

    expect(visible.value).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('should close dialog', () => {
    const { visible, loading, open, close } = useDialog()

    // First open the dialog
    open()
    expect(visible.value).toBe(true)

    // Then close it
    close()

    expect(visible.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('should set loading state', () => {
    const { loading, setLoading } = useDialog()

    expect(loading.value).toBe(false)

    setLoading(true)
    expect(loading.value).toBe(true)

    setLoading(false)
    expect(loading.value).toBe(false)
  })

  it('should reset loading state when opening dialog', () => {
    const { loading, open, setLoading } = useDialog()

    // Set loading to true
    setLoading(true)
    expect(loading.value).toBe(true)

    // Open dialog should reset loading
    open()
    expect(loading.value).toBe(false)
  })

  it('should reset loading state when closing dialog', () => {
    const { loading, open, close, setLoading } = useDialog()

    // Open dialog and set loading
    open()
    setLoading(true)
    expect(loading.value).toBe(true)

    // Close dialog should reset loading
    close()
    expect(loading.value).toBe(false)
  })

  it('should handle typical dialog workflow', () => {
    const { visible, loading, open, close, setLoading } = useDialog()

    // Initial state
    expect(visible.value).toBe(false)
    expect(loading.value).toBe(false)

    // Open dialog
    open()
    expect(visible.value).toBe(true)
    expect(loading.value).toBe(false)

    // Start form submission
    setLoading(true)
    expect(loading.value).toBe(true)

    // Finish submission and close
    setLoading(false)
    close()
    expect(visible.value).toBe(false)
    expect(loading.value).toBe(false)
  })
})
