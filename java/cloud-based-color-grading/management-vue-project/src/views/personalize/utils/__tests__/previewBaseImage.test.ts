import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePersonalizeBaseSrc } from '../previewBaseImage'
import type { ImageDBItem } from '@/views/workstation/utils/imageDB'

const loadedSrcs: string[] = []

class MockImage {
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  naturalWidth = 100
  naturalHeight = 100
  set src(value: string) {
    loadedSrcs.push(value)
    queueMicrotask(() => this.onload?.())
  }
}

// @ts-expect-error test mock
globalThis.Image = MockImage

beforeEach(() => {
  loadedSrcs.length = 0
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName !== 'canvas') {
      return Document.prototype.createElement.call(document, tagName)
    }
    return {
      width: 0,
      height: 0,
      getContext: () => ({
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
      }),
      toDataURL: () => 'data:image/png;base64,rebuilt',
    } as unknown as HTMLCanvasElement
  })
})

const makeItem = (overrides: Partial<ImageDBItem>): ImageDBItem => ({
  id: 1,
  name: 'test.jpg',
  blob: new Blob(),
  src: 'data:image/png;base64,original',
  uploadTime: new Date(),
  lastModified: new Date(),
  ...overrides,
})

describe('resolvePersonalizeBaseSrc', () => {
  it('uses the original image as the color pipeline source even when editedSrc exists', async () => {
    const item = makeItem({
      editedSrc: 'data:image/png;base64,already-rendered',
      cropStateJson: JSON.stringify({
        rotate: 90,
        flipH: false,
        flipV: false,
        rect: null,
      }),
      adjustmentsJson: JSON.stringify({
        adjustments: { brightness: 30 },
      }),
    })

    await expect(resolvePersonalizeBaseSrc(item)).resolves.toBeDefined()
    expect(loadedSrcs).toEqual(['data:image/png;base64,original'])
  })
})
