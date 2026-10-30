import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Canvas, Textbox } from 'fabric'
import { DEFAULT_FONT_SIZE, DEFAULT_TEXT_COLOR } from '../constants'
import type { SetStatus } from '../types'
import { getOutlineColor, OUTLINE_WIDTH } from '../utils/color'

type Options = {
  canvas: Canvas | null
  setStatusMessage: SetStatus
}

// everything with text: insert, set values, delete
export function useTextLayer({ canvas, setStatusMessage }: Options) {
  // chosen text on canvas
  const selectedTextRef = useRef<Textbox | null>(null)

  const [hasSelectedText, setHasSelectedText] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)

  // settings panel 
  useEffect(() => {
    if (!canvas) return

    const syncSelection = () => {
      const active = canvas.getActiveObject()

      if (active instanceof Textbox) {
        selectedTextRef.current = active
        setHasSelectedText(true)
        setTextValue(active.text ?? '')
        setFontSize(Math.round(active.fontSize ?? DEFAULT_FONT_SIZE))
        setTextColor(
          typeof active.fill === 'string' ? active.fill : DEFAULT_TEXT_COLOR
        )
      } else {
        selectedTextRef.current = null
        setHasSelectedText(false)
      }
    }

    canvas.on('selection:created', syncSelection)
    canvas.on('selection:updated', syncSelection)
    canvas.on('selection:cleared', syncSelection)
    canvas.on('text:changed', syncSelection)

    // when canvas is disposed no need in event handlers
  }, [canvas])

  const addTextLayer = () => {
    if (!canvas) return

    const textbox = new Textbox('YOUR TEXT', {
      originX: 'center',
      originY: 'center',
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      width: canvas.getWidth() * 0.8,
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: 'Impact, Anton, sans-serif',
      fontWeight: 'normal',
      fill: DEFAULT_TEXT_COLOR,
      stroke: getOutlineColor(DEFAULT_TEXT_COLOR),
      strokeWidth: OUTLINE_WIDTH,
      strokeLineJoin: 'round',
      paintFirst: 'stroke',
      textAlign: 'center',
    })

    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    canvas.requestRenderAll()
    setStatusMessage('Text added. Drag it, or edit it in the panel.')
  }

  const updateSelectedText = (props: Partial<Textbox>) => {
    const textObject = selectedTextRef.current
    if (!canvas || !textObject) return

    textObject.set(props)
    textObject.setCoords()
    canvas.requestRenderAll()
  }

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(event.target.value)
    updateSelectedText({ text: event.target.value })
  }

  const handleFontSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const size = Number(event.target.value)
    setFontSize(size)
    updateSelectedText({ fontSize: size })
  }

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    applyColor(event.target.value)
  }

  const applyColor = (color: string) => {
    const outline = getOutlineColor(color)

    setTextColor(color)
    updateSelectedText({
      fill: color,
      stroke: outline,
      strokeWidth: outline ? OUTLINE_WIDTH : 0,
    })
  }

  const removeText = (target: Textbox) => {
    if (!canvas) return

    canvas.discardActiveObject()
    canvas.remove(target)
    canvas.requestRenderAll()
    setStatusMessage('Text removed.')
  }

  // Remove text
  const removeSelectedText = () => {
    if (selectedTextRef.current) removeText(selectedTextRef.current)
  }

  const removeSelectedOrLastText = (): boolean => {
    if (!canvas) return false

    const target =
      selectedTextRef.current ??
      canvas
        .getObjects()
        .filter((object): object is Textbox => object instanceof Textbox)
        .at(-1)

    if (!target) return false

    removeText(target)
    return true
  }

  return {
    hasSelectedText,
    textValue,
    fontSize,
    textColor,
    addTextLayer,
    handleTextChange,
    handleFontSizeChange,
    handleColorChange,
    applyColor,
    removeSelectedText,
    removeSelectedOrLastText,
  }
}

export type TextLayerApi = ReturnType<typeof useTextLayer>