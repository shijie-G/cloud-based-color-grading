import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ImageViewer from '../ImageViewer.vue'

const { mockImageDB, hslState } = vi.hoisted(() => ({
  mockImageDB: {
    getImage: vi.fn(),
  },
  hslState: {
    processedSrc: { value: '' },
    hslAdjustments: {
      red: { hue: 0, saturation: 0, lightness: 0 },
      orange: { hue: 0, saturation: 0, lightness: 0 },
      yellow: { hue: 0, saturation: 0, lightness: 0 },
      green: { hue: 0, saturation: 0, lightness: 0 },
      cyan: { hue: 0, saturation: 0, lightness: 0 },
      blue: { hue: 0, saturation: 0, lightness: 0 },
      purple: { hue: 0, saturation: 0, lightness: 0 },
      magenta: { hue: 0, saturation: 0, lightness: 0 },
    },
    setSourceImage: vi.fn(),
    setBasicAdjustments: vi.fn(),
    setMaskLayers: vi.fn(),
    setFilterConfig: vi.fn(),
    resetHSL: vi.fn(() => {
      Object.values(hslState.hslAdjustments).forEach(range => {
        range.hue = 0
        range.saturation = 0
        range.lightness = 0
      })
    }),
  },
}))

class MockImage {
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  naturalWidth = 100
  naturalHeight = 100
  set src(_value: string) {
    queueMicrotask(() => this.onload?.())
  }
}

vi.mock('@/views/workstation/utils/imageDB', () => ({
  imageDB: mockImageDB,
}))

vi.mock('@/views/workstation/composables/useHSLState', () => ({
  useHSLState: () => hslState,
}))

vi.mock('@/views/workstation/composables/useMaskState', () => ({
  drawLinearMask: vi.fn(),
  drawRadialMask: vi.fn(),
}))

vi.mock('@/utils/gsj', () => ({
  exportGsjFile: vi.fn(),
}))

const image = {
  id: 1,
  albumId: 1,
  filename: 'test.jpg',
  format: 'jpeg',
  width: 100,
  height: 100,
  size: 1024,
  uploadedAt: Date.now(),
  isFavorite: false,
  isDeleted: false,
  tags: [],
  sortOrder: 0,
  url: 'blob:original',
  thumbnailUrl: 'blob:thumb',
}

describe('ImageViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error test mock
    globalThis.Image = MockImage
    hslState.processedSrc.value = ''
    Object.values(hslState.hslAdjustments).forEach(range => {
      range.hue = 0
      range.saturation = 0
      range.lightness = 0
    })
  })

  it('keeps restored adjustments when an image has no saved filter config', async () => {
    mockImageDB.getImage.mockResolvedValue({
      id: 1,
      name: 'test.jpg',
      src: 'data:image/png;base64,original',
      blob: new Blob(),
      uploadTime: new Date(),
      lastModified: new Date(),
      adjustmentsJson: JSON.stringify({
        adjustments: {
          brightness: 20,
          contrast: 5,
          saturation: 0,
          vibrance: 0,
          hue: 0,
          temperature: 0,
          clarity: 0,
        },
        hslAdjustments: {
          red: { hue: 10, saturation: 20, lightness: 30 },
        },
      }),
      filterConfigJson: undefined,
    })

    mount(ImageViewer, {
      props: { image },
      global: {
        stubs: {
          ExportModal: true,
        },
      },
    })

    await flushPromises()

    expect(hslState.setBasicAdjustments).toHaveBeenLastCalledWith({
      brightness: 20,
      contrast: 5,
      saturation: 0,
      vibrance: 0,
      hue: 0,
      temperature: 0,
      clarity: 0,
    })
    expect(hslState.hslAdjustments.red).toEqual({ hue: 10, saturation: 20, lightness: 30 })
  })
})
