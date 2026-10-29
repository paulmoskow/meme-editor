import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Canvas } from 'fabric'
import { getMaxCanvasSize } from '../utils/canvasSize'

// create canvas Fabric once after mounting and delete it with unmounting 
// until is created canvas set as null
export function useFabricCanvas(frameRef: RefObject<HTMLDivElement | null>) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
  const [canvas, setCanvas] = useState<Canvas | null>(null)

  useEffect(() => {
    const canvasElement = canvasElementRef.current
    if (!canvasElement) return

    const { width, height } = getMaxCanvasSize(frameRef.current)

    const fabricCanvas = new Canvas(canvasElement, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    })

    fabricCanvas.renderAll()
    setCanvas(fabricCanvas)

    return () => {
      void fabricCanvas.dispose()
      setCanvas(null)
    }
  }, [frameRef])

  return { canvas, canvasElementRef }
}