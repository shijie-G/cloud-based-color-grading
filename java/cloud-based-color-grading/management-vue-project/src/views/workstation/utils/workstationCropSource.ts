import type { ImageItem } from '../component-interfaces'
import type { CropState } from '../types/cropTypes'

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })

export const rebuildWorkstationCropSrc = async (
  originalSrc: string,
  cropState: CropState
): Promise<string | undefined> => {
  const { rotate, flipH, flipV, rect } = cropState
  if (rotate === 0 && !flipH && !flipV && !rect) return undefined

  const img = await loadImage(originalSrc)
  let current: HTMLCanvasElement

  if (rotate !== 0) {
    const rad = (rotate * Math.PI) / 180
    const sw = rotate === 90 || rotate === 270 ? img.naturalHeight : img.naturalWidth
    const sh = rotate === 90 || rotate === 270 ? img.naturalWidth : img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')!
    ctx.translate(sw / 2, sh / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    current = canvas
  } else {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    current = canvas
  }

  if (flipH || flipV) {
    const canvas = document.createElement('canvas')
    canvas.width = current.width
    canvas.height = current.height
    const ctx = canvas.getContext('2d')!
    if (flipH) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    if (flipV) { ctx.translate(0, canvas.height); ctx.scale(1, -1) }
    ctx.drawImage(current, 0, 0)
    current = canvas
  }

  if (rect) {
    const canvas = document.createElement('canvas')
    canvas.width = rect.w
    canvas.height = rect.h
    canvas.getContext('2d')!.drawImage(current, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
    current = canvas
  }

  return current.toDataURL('image/png')
}

export const resolveWorkstationSelectedSrc = async (
  image: ImageItem,
  editedSrc?: string,
  cropStateJson?: string
): Promise<string> => {
  const cropState = cropStateJson ? JSON.parse(cropStateJson) as CropState : null
  if (cropState) {
    const rebuilt = await rebuildWorkstationCropSrc(image.originalSrc || image.src, cropState)
    return rebuilt || editedSrc || image.originalSrc || image.src
  }
  return image.originalSrc || editedSrc || image.src
}
