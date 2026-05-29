import { describe, expect, it } from 'vitest'
import { toLoginLocation } from '../loginLocation'

describe('toLoginLocation', () => {
  it('points to the login html entry and keeps redirect inside hash route query', () => {
    expect(toLoginLocation('/workstation')).toBe('/login.html#/login?redirect=%2Fworkstation')
    expect(toLoginLocation('/gallery?album=1')).toBe('/login.html#/login?redirect=%2Fgallery%3Falbum%3D1')
  })

  it('supports opening login without a redirect target', () => {
    expect(toLoginLocation()).toBe('/login.html#/login')
  })
})
