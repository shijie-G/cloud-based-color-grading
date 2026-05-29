import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveWorkstationSelectedSrc } from '../workstationCropSource'

class MockImage {
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  naturalWidth = 100
  naturalHeight = 100
  set src(_value: string) {
    queueMicrotask(() => this.onload?.())
  }
}

beforeEach(() => {
  // @ts-expect-error test mock
  globalThis.Image = MockImage
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
      toDataURL: () => 'data:image/png;base64,recreated',
    } as unknown as HTMLCanvasElement
  })
})

describe('resolveWorkstationSelectedSrc', () => {
  it('rebuilds crop source from original image instead of reusing editedSrc', async () => {
    const image = {
      id: 1,
      name: 'test.jpg',
      src: 'data:image/png;base64,original',
      originalSrc: 'data:image/png;base64,original',
      thumbnail: undefined,
      originalFile: new File([''], 'test.jpg'),
      fileHash: 'hash',
    }

    const result = await resolveWorkstationSelectedSrc(
      image,
      'data:image/png;base64,edited',
      JSON.stringify({ rotate: 90, flipH: false, flipV: false, rect: null })
    )

    expect(result).toBe('data:image/png;base64,recreated')
  })
})
