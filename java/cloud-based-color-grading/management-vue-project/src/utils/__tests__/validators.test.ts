import { describe, expect, it, vi } from 'vitest'
import { validateUsername } from '../validators'

function validate(value: string): Error | undefined {
  const callback = vi.fn()

  validateUsername({}, value, callback)

  return callback.mock.calls[0]?.[0]
}

describe('validateUsername', () => {
  it('accepts a plain backend username such as the seeded admin account', () => {
    expect(validate('admin')).toBeUndefined()
  })
})
