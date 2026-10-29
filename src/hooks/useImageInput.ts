import { useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, RefObject } from 'react'
import { Canvas, FabricImage } from 'fabric'
import type { SetStatus } from '../types'
import { getMaxCanvasSize } from '../utils/canvasSize'
import { findImageFile, findImageUrl } from '../utils/clipboard'

type Options = {
  canvas: Canvas | null
  frameRef: RefObject<HTMLDivElement | null>
  setStatusMessage: SetStatus
}

// everything about image - upload, insert and delete
export function useImageInput({ canvas, frameRef, setStatusMessage }: Options) {
  // the image is on the canvas now
  const currentImageRef = useRef<FabricImage | null>(null)

  const [hasImage, setHasImage] = useState(false)
  const [fileName, setFileName] = useState('No image selected')

  const placeImageOnCanvas = async (
    file: File,
    source: 'upload' | 'clipboard'
  ) => {
    if (!canvas) return

    // temp link to the file
    const imageUrl = URL.createObjectURL(file)

    try {
      const image = await FabricImage.fromURL(imageUrl)

      // delete prev image
      if (currentImageRef.current) {
        canvas.remove(currentImageRef.current)
        currentImageRef.current = null
      }

      const imageWidth = image.width ?? 1
      const imageHeight = image.height ?? 1

      // insert image in the available area
      const { width: maxWidth, height: maxHeight } = getMaxCanvasSize(
        frameRef.current
      )
      const fitScale = Math.min(1, maxWidth / imageWidth, maxHeight / imageHeight)

      const previousWidth = canvas.getWidth()
      const previousHeight = canvas.getHeight()

      const newWidth = Math.max(1, Math.round(imageWidth * fitScale))
      const newHeight = Math.max(1, Math.round(imageHeight * fitScale))

      // canvas takes the shape of image
      canvas.setDimensions({ width: newWidth, height: newHeight })

      // adaptation of the text to the new size
      const ratioX = newWidth / previousWidth
      const ratioY = newHeight / previousHeight

      canvas.getObjects().forEach((object) => {
        object.set({
          left: (object.left ?? 0) * ratioX,
          top: (object.top ?? 0) * ratioY,
        })
        object.setCoords()
      })

      // background image is unusable
      image.set({
        originX: 'center',
        originY: 'center',
        left: newWidth / 2,
        top: newHeight / 2,
        scaleX: newWidth / imageWidth,
        scaleY: newHeight / imageHeight,
        selectable: false,
        evented: false,
      })

      image.setCoords()

      canvas.add(image)
      canvas.sendObjectToBack(image)

      currentImageRef.current = image
      setFileName(file.name || 'clipboard-image.png')
      setStatusMessage(
        source === 'upload'
          ? 'Image uploaded successfully.'
          : 'Image pasted from clipboard successfully.'
      )
      setHasImage(true)

      canvas.renderAll()
    } catch (error) {
      console.error('Image load failed:', error)
      setStatusMessage('Failed to load image.')
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  // image thet comes as html or link
  const placeImageFromUrl = async (url: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' })
      const blob = await response.blob()

      if (!blob.type.startsWith('image/')) throw new Error('Not an image')

      await placeImageOnCanvas(
        new File([blob], 'pasted-image', { type: blob.type }),
        'clipboard'
      )
    } catch {
      // if downloading is forbidden
      setStatusMessage(
        'This site does not allow loading the image. Save it to your device and use "Select image".'
      )
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await placeImageOnCanvas(file, 'upload')

    // to choose same file again
    event.target.value = ''
  }

  const handlePaste = async (event: ClipboardEvent<HTMLElement>) => {
    const file = findImageFile(event.clipboardData)
    const url = file ? null : findImageUrl(event.clipboardData)

    if (file) {
      event.preventDefault()
      await placeImageOnCanvas(file, 'clipboard')
      return
    }

    if (url) {
      event.preventDefault()
      await placeImageFromUrl(url)
      return
    }

    setStatusMessage('Clipboard does not contain an image.')
  }

  // insert button for mobile
  const pasteFromClipboardButton = async () => {
    if (!navigator.clipboard?.read) {
      setStatusMessage(
        'Your browser cannot read the clipboard. Long-press the canvas and choose Paste.'
      )
      return
    }

    try {
      const items = await navigator.clipboard.read()

      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'))
        if (type) {
          const blob = await item.getType(type)
          await placeImageOnCanvas(
            new File([blob], 'clipboard-image.png', { type }),
            'clipboard'
          )
          return
        }
      }

      setStatusMessage('Clipboard does not contain an image.')
    } catch {
      setStatusMessage(
        'Clipboard access denied. Long-press the canvas and choose Paste.'
      )
    }
  }

  // delete everything from canvas
  const clearCanvasImage = () => {
    if (!canvas || !currentImageRef.current) return

    canvas.discardActiveObject()
    canvas.remove(...canvas.getObjects())

    const { width, height } = getMaxCanvasSize(frameRef.current)
    canvas.setDimensions({ width, height })

    currentImageRef.current = null
    setFileName('No image selected')
    setStatusMessage('Image removed.')
    setHasImage(false)
    canvas.requestRenderAll()
  }

  return {
    hasImage,
    fileName,
    handleImageUpload,
    handlePaste,
    pasteFromClipboardButton,
    clearCanvasImage,
  }
}

export type ImageInputApi = ReturnType<typeof useImageInput>