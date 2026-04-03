/**
 * 图片导出核心逻辑
 */

import type { ExportSettings } from '../types/export'

export function useImageExport() {
  /**
   * 导出图片
   * @param imageSrc 图片源（调色后的 dataURL）
   * @param settings 导出设置
   * @param filename 文件名
   * @param dpi DPI 设置（默认 300）
   */
  const exportImage = async (
    imageSrc: string,
    settings: ExportSettings,
    filename: string = 'exported-image',
    dpi: number = 300
  ): Promise<void> => {
    console.log('开始导出图片:', { filename, settings, dpi })

    return new Promise((resolve, reject) => {
      const img = new Image()
      // 如果是 data URL，不需要设置 crossOrigin
      if (!imageSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous'
      }

      img.onload = () => {
        console.log('图片加载成功，开始导出')
        try {
          // 创建 canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d', {
            alpha: settings.format === 'png' && settings.background === 'transparent',
            willReadFrequently: false
          })
          if (!ctx) {
            reject(new Error('无法创建 canvas context'))
            return
          }

          // 计算导出尺寸
          const exportWidth = Math.round(img.naturalWidth * settings.scale)
          const exportHeight = Math.round(img.naturalHeight * settings.scale)

          canvas.width = exportWidth
          canvas.height = exportHeight

          // 设置高质量渲染
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // 绘制背景
          if (settings.format === 'png' && settings.background !== 'transparent') {
            ctx.fillStyle = settings.background === 'white' ? '#ffffff' : '#000000'
            ctx.fillRect(0, 0, exportWidth, exportHeight)
          } else if (settings.format !== 'png') {
            // JPEG 和 WEBP 需要白色背景
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, exportWidth, exportHeight)
          }

          // 绘制图片
          ctx.drawImage(img, 0, 0, exportWidth, exportHeight)

          // 绘制水印
          if (settings.watermark.enabled && settings.watermark.text) {
            drawWatermark(ctx, exportWidth, exportHeight, settings.watermark, settings.scale)
          }

          // 导出
          const mimeType = getMimeType(settings.format)
          // PNG 是无损格式，不需要 quality 参数
          const quality = settings.format === 'png' ? undefined : settings.quality / 100

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('导出失败'))
                return
              }

              console.log(`✅ 导出成功: ${formatFileSize(blob.size)}`)
              console.log(`  尺寸: ${exportWidth} x ${exportHeight}`)
              console.log(`  格式: ${settings.format.toUpperCase()}`)
              if (settings.format !== 'png') {
                console.log(`  画质: ${settings.quality}`)
              }

              // 如果需要设置 DPI，需要修改 blob（仅对 JPEG/PNG 有效）
              if (dpi !== 72 && (settings.format === 'jpeg' || settings.format === 'png')) {
                console.log(`准备设置 DPI: ${dpi}，格式: ${settings.format}`)
                setDPI(blob, dpi).then((modifiedBlob) => {
                  console.log('✅ DPI 设置成功，开始下载')
                  downloadBlob(modifiedBlob, `${filename}.${settings.format}`)
                  resolve()
                }).catch((error) => {
                  // DPI 设置失败，使用原始 blob
                  console.error('❌ DPI 设置失败，使用原始 blob:', error)
                  downloadBlob(blob, `${filename}.${settings.format}`)
                  resolve()
                })
              } else {
                console.log(`跳过 DPI 设置 (dpi=${dpi}, format=${settings.format})`)
                downloadBlob(blob, `${filename}.${settings.format}`)
                resolve()
              }
            },
            mimeType,
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = (e) => {
        console.error('图片加载失败:', e)
        reject(new Error('图片加载失败'))
      }

      img.src = imageSrc
    })
  }

  /**
   * 下载 Blob
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 设置图片 DPI（通过修改 EXIF 数据）
   */
  const setDPI = async (blob: Blob, dpi: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const view = new DataView(arrayBuffer)

          // 检查是否是 JPEG
          if (view.getUint16(0, false) === 0xFFD8) {
            console.log('检测到 JPEG 格式，设置 DPI:', dpi)
            const modifiedBuffer = setJPEGDPI(arrayBuffer, dpi)
            resolve(new Blob([modifiedBuffer], { type: 'image/jpeg' }))
          }
          // 检查是否是 PNG
          else if (view.getUint32(0, false) === 0x89504E47) {
            console.log('检测到 PNG 格式，设置 DPI:', dpi)
            const modifiedBuffer = setPNGDPI(arrayBuffer, dpi)
            resolve(new Blob([modifiedBuffer], { type: 'image/png' }))
          } else {
            console.log('不支持的格式，返回原始 blob')
            // 不支持的格式，返回原始 blob
            resolve(blob)
          }
        } catch (error) {
          console.error('设置 DPI 失败:', error)
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
  }

  /**
   * 设置 JPEG DPI
   */
  const setJPEGDPI = (arrayBuffer: ArrayBuffer, dpi: number): ArrayBuffer => {
    const view = new DataView(arrayBuffer)
    let offset = 2
    let foundAPP0 = false

    console.log('开始修改 JPEG DPI')

    // 查找 APP0 标记（JFIF）
    while (offset < view.byteLength - 1) {
      if (view.getUint8(offset) !== 0xFF) break

      const marker = view.getUint8(offset + 1)
      const length = view.getUint16(offset + 2, false)

      if (marker === 0xE0) {
        // APP0 标记找到
        console.log('找到 APP0 标记，位置:', offset)

        // 检查是否是 JFIF
        const identifier = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7),
          view.getUint8(offset + 8)
        )

        if (identifier === 'JFIF\0') {
          console.log('确认是 JFIF 格式')
          // 偏移 11: 密度单位 (1 = dpi, 2 = dpcm)
          // 偏移 12-13: X 密度
          // 偏移 14-15: Y 密度
          view.setUint8(offset + 11, 1) // 设置单位为 dpi
          view.setUint16(offset + 12, dpi, false) // X 密度（大端序）
          view.setUint16(offset + 14, dpi, false) // Y 密度（大端序）
          foundAPP0 = true
          console.log('DPI 设置成功:', dpi)
          break
        }
      }

      offset += 2 + length
    }

    if (!foundAPP0) {
      console.warn('未找到 JFIF APP0 标记，DPI 可能未设置')
    }

    return arrayBuffer
  }

  /**
   * 设置 PNG DPI
   */
  const setPNGDPI = (arrayBuffer: ArrayBuffer, dpi: number): ArrayBuffer => {
    console.log('开始修改 PNG DPI')

    // PNG DPI 设置需要添加 pHYs chunk
    const dpm = Math.round(dpi * 39.3701) // dpi 转 dots per meter
    console.log('DPI 转换为 DPM:', dpm)

    const originalArray = new Uint8Array(arrayBuffer)

    // 检查是否已经存在 pHYs chunk，如果存在则先移除
    let insertPosition = 33 // PNG signature (8) + IHDR chunk (25) = 33
    let hasExistingPHYs = false
    let offset = 8 // 跳过 PNG signature

    // 遍历所有 chunks 找到 pHYs 或第一个 IDAT
    while (offset < originalArray.length) {
      const chunkLength = (originalArray[offset] << 24) | (originalArray[offset + 1] << 16) |
                         (originalArray[offset + 2] << 8) | originalArray[offset + 3]
      const chunkType = String.fromCharCode(
        originalArray[offset + 4],
        originalArray[offset + 5],
        originalArray[offset + 6],
        originalArray[offset + 7]
      )

      console.log(`找到 chunk: ${chunkType}, 长度: ${chunkLength}, 位置: ${offset}`)

      if (chunkType === 'pHYs') {
        hasExistingPHYs = true
        console.log('发现已存在的 pHYs chunk，将被替换')
        // 移除现有的 pHYs chunk
        const beforePHYs = originalArray.slice(0, offset)
        const afterPHYs = originalArray.slice(offset + 12 + chunkLength) // 12 = length(4) + type(4) + CRC(4)
        const newArray = new Uint8Array(beforePHYs.length + afterPHYs.length)
        newArray.set(beforePHYs)
        newArray.set(afterPHYs, beforePHYs.length)
        return setPNGDPI(newArray.buffer, dpi) // 递归调用，重新插入
      }

      if (chunkType === 'IDAT') {
        insertPosition = offset
        console.log('找到 IDAT chunk，pHYs 将插入在其之前，位置:', insertPosition)
        break
      }

      offset += 12 + chunkLength // 移动到下一个 chunk
    }

    // 计算 CRC
    const calculateCRC = (data: Uint8Array): number => {
      let crc = 0xFFFFFFFF
      for (let i = 0; i < data.length; i++) {
        crc ^= data[i]
        for (let j = 0; j < 8; j++) {
          crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
        }
      }
      return (crc ^ 0xFFFFFFFF) >>> 0
    }

    // 创建 pHYs chunk 数据（不包括长度）
    const pHYsData = new Uint8Array([
      0x70, 0x48, 0x59, 0x73, // 'pHYs'
      (dpm >> 24) & 0xFF, (dpm >> 16) & 0xFF, (dpm >> 8) & 0xFF, dpm & 0xFF, // X pixels per unit
      (dpm >> 24) & 0xFF, (dpm >> 16) & 0xFF, (dpm >> 8) & 0xFF, dpm & 0xFF, // Y pixels per unit
      0x01 // unit: meter
    ])

    const crc = calculateCRC(pHYsData)
    console.log('计算的 CRC:', crc.toString(16))

    // 完整的 pHYs chunk
    const pHYsChunk = new Uint8Array([
      0x00, 0x00, 0x00, 0x09, // chunk length (9 bytes)
      ...pHYsData,
      (crc >> 24) & 0xFF, (crc >> 16) & 0xFF, (crc >> 8) & 0xFF, crc & 0xFF // CRC
    ])

    console.log('pHYs chunk 创建完成，长度:', pHYsChunk.length, '插入位置:', insertPosition)

    // 在正确位置插入 pHYs chunk
    const result = new Uint8Array(originalArray.length + pHYsChunk.length)
    result.set(originalArray.slice(0, insertPosition))
    result.set(pHYsChunk, insertPosition)
    result.set(originalArray.slice(insertPosition), insertPosition + pHYsChunk.length)

    console.log('PNG DPI 设置完成')

    return result.buffer
  }

  /**
   * 绘制水印
   */
  const drawWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    watermark: ExportSettings['watermark'],
    scale: number
  ) => {
    ctx.save()

    // 根据缩放调整字体大小
    const scaledFontSize = watermark.fontSize * scale

    // 设置字体
    const fontWeight = watermark.bold ? 'bold' : 'normal'
    ctx.font = `${fontWeight} ${scaledFontSize}px Arial, sans-serif`
    ctx.fillStyle = watermark.color
    ctx.globalAlpha = watermark.opacity

    // 测量文字尺寸
    const metrics = ctx.measureText(watermark.text)
    const textWidth = metrics.width
    const textHeight = scaledFontSize

    // 计算位置
    let x: number, y: number

    if (watermark.customX !== undefined && watermark.customY !== undefined) {
      // 自定义位置（百分比）
      x = (watermark.customX / 100) * width
      y = (watermark.customY / 100) * height
    } else {
      // 预设位置
      const padding = 20 * scale
      switch (watermark.position) {
        case 'top-left':
          x = padding
          y = padding + textHeight
          break
        case 'top-right':
          x = width - textWidth - padding
          y = padding + textHeight
          break
        case 'bottom-left':
          x = padding
          y = height - padding
          break
        case 'bottom-right':
          x = width - textWidth - padding
          y = height - padding
          break
        case 'center':
          x = (width - textWidth) / 2
          y = (height + textHeight) / 2
          break
        default:
          x = width - textWidth - padding
          y = height - padding
      }
    }

    // 绘制文字
    ctx.fillText(watermark.text, x, y)

    ctx.restore()
  }

  /**
   * 获取 MIME 类型
   */
  const getMimeType = (format: ExportSettings['format']): string => {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'webp':
        return 'image/webp'
      default:
        return 'image/jpeg'
    }
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * 估算文件大小（实时计算）
   */
  const estimateFileSize = async (
    imageSrc: string,
    width: number,
    height: number,
    settings: ExportSettings
  ): Promise<string> => {
    console.log('开始估算文件大小:', { imageSrc: imageSrc.substring(0, 50), width, height, settings })

    return new Promise((resolve) => {
      const img = new Image()
      // 如果是 data URL，不需要设置 crossOrigin
      if (!imageSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous'
      }

      img.onload = () => {
        console.log('图片加载成功，开始计算大小')
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            console.error('无法创建 canvas context')
            resolve('未知')
            return
          }

          const exportWidth = Math.round(width * settings.scale)
          const exportHeight = Math.round(height * settings.scale)

          canvas.width = exportWidth
          canvas.height = exportHeight

          // 绘制背景
          if (settings.format === 'png' && settings.background !== 'transparent') {
            ctx.fillStyle = settings.background === 'white' ? '#ffffff' : '#000000'
            ctx.fillRect(0, 0, exportWidth, exportHeight)
          } else if (settings.format !== 'png') {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, exportWidth, exportHeight)
          }

          // 绘制图片
          ctx.drawImage(img, 0, 0, exportWidth, exportHeight)

          // 绘制水印
          if (settings.watermark.enabled && settings.watermark.text) {
            drawWatermark(ctx, exportWidth, exportHeight, settings.watermark, settings.scale)
          }

          // 转换为 blob 获取真实大小
          const mimeType = getMimeType(settings.format)
          // PNG 是无损格式，不需要 quality 参数
          const quality = settings.format === 'png' ? undefined : settings.quality / 100

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const size = formatFileSize(blob.size)
                console.log('文件大小计算完成:', size)
                resolve(size)
              } else {
                console.error('blob 生成失败')
                resolve('未知')
              }
            },
            mimeType,
            quality
          )
        } catch (error) {
          console.error('计算文件大小失败:', error)
          resolve('未知')
        }
      }

      img.onerror = (e) => {
        console.error('图片加载失败:', e)
        resolve('未知')
      }

      img.src = imageSrc
    })
  }

  return {
    exportImage,
    estimateFileSize
  }
}
