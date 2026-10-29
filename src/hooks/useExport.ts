import { useState } from 'react'
import { Canvas, FabricImage } from 'fabric'
import { MAX_EXPORT_SIDE } from '../constants'
import type { SetStatus } from '../types'
import { downloadDataUrl } from '../utils/download'

type Options = {
  canvas: Canvas | null
  setStatusMessage: SetStatus
}

// export canvas into jpg
export function useExport({ canvas, setStatusMessage }: Options) {
  const [jpegQuality, setJpegQuality] = useState(92)
  const [exportOriginalSize, setExportOriginalSize] = useState(true)

  const exportJpeg = () => {
    if (!canvas) return

    // prevention of the frame get into jpg
    canvas.discardActiveObject()
    canvas.requestRenderAll()

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()

    const image = canvas
      .getObjects()
      .find((object): object is FabricImage => object instanceof FabricImage)

    // return default image resolution
    let multiplier = 1
    if (exportOriginalSize && image) {
      multiplier = 1 / (image.scaleX || 1)
    }

    // safe size of the file
    multiplier = Math.min(
      multiplier,
      MAX_EXPORT_SIDE / Math.max(canvasWidth, canvasHeight)
    )

    const dataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: jpegQuality / 100,
      multiplier,
    })

    downloadDataUrl(dataUrl, 'my_picture.jpg')

    setStatusMessage(
      `Exported JPG: ${Math.round(canvasWidth * multiplier)}×${Math.round(
        canvasHeight * multiplier
      )} px.`
    )
  }

  return {
    jpegQuality,
    setJpegQuality,
    exportOriginalSize,
    setExportOriginalSize,
    exportJpeg,
  }
}

export type ExportApi = ReturnType<typeof useExport>