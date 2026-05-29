import { describe, expect, it } from 'vitest'
import { toStationLocation } from '../stationLocation'

describe('toStationLocation', () => {
  it('converts station route paths to the station hash entry', () => {
    expect(toStationLocation('/workstation')).toBe('/station.html#/workstation')
    expect(toStationLocation('/gallery')).toBe('/station.html#/gallery')
    expect(toStationLocation('/album/1?tab=all')).toBe('/station.html#/album/1?tab=all')
  })

  it('keeps login routes on the login entry', () => {
    expect(toStationLocation('/login')).toBe('/login')
    expect(toStationLocation('/login?redirect=/gallery')).toBe('/login?redirect=/gallery')
  })
})
