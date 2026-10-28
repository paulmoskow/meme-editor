import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent } from 'react';
import { Canvas, FabricImage, Textbox } from 'fabric'
import { IconDownload, IconImage, IconPaste, IconSize, IconTextPlus, IconTrash } from './icons'

function useIsMobile(query = '(max-width: 900px)') {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

const MAX_EXPORT_SIDE = 4096

function App() {
  // DOM canvas element
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)

  // Fabric canvas instance
  const fabricCanvasRef = useRef<Canvas | null>(null)

  // Currently displayed image on the canvas
  const currentImageRef = useRef<FabricImage | null>(null)

  // Focusable area that receives paste events
  const pasteZoneRef = useRef<HTMLDivElement | null>(null)

  // Text lay on focus
  const selectedTextRef = useRef<Textbox | null>(null)

  //When mobile device is used
  const isMobile = useIsMobile()
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [hasImage, setHasImage] = useState(false)

  const [hasSelectedText, setHasSelectedText] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#ffffff')

  const [isReady, setIsReady] = useState(false)
  const [fileName, setFileName] = useState('No image selected')
  const [statusMessage, setStatusMessage] = useState(
    'Upload an image or paste one from the clipboard.'
  )

  //state for download file
  const [jpegQuality, setJpegQuality] = useState(92)
  const [exportOriginalSize, setExportOriginalSize] = useState(true)

  const getMaxCanvasSize = () => {
    const frame = frameRef.current
    if (!frame) return { width: 900, height: 560 }

    const style = getComputedStyle(frame)
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)

    // -14: запас под рамку и «жёсткую» тень холста
    return {
      width: Math.max(200, Math.min(900, frame.clientWidth - padX - 14)),
      height: Math.max(200, frame.clientHeight - padY - 14),
    }
  }

  useEffect(() => {
    const canvasElement = canvasElementRef.current
    if (!canvasElement) return

    // Create Fabric canvas once after mount
    const maxSize = getMaxCanvasSize()

    const fabricCanvas = new Canvas(canvasElement, {
      width: maxSize.width,
      height: maxSize.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    })

    fabricCanvasRef.current = fabricCanvas
    fabricCanvas.renderAll()
    setIsReady(true)

    // Synchronization of the text panel
    const syncSelection = () => {
      const active = fabricCanvas.getActiveObject()
      
      if (active instanceof Textbox) {
        selectedTextRef.current = active
        setHasSelectedText(true)
        setTextValue(active.text ?? '')
        setFontSize(Math.round(active.fontSize ?? 48))
        setTextColor(typeof active.fill === 'string' ? active.fill : '#ffffff')
      } else {
        selectedTextRef.current = null
        setHasSelectedText(false)
      }
    }

    fabricCanvas.on('selection:created', syncSelection)
    fabricCanvas.on('selection:updated', syncSelection)
    fabricCanvas.on('selection:cleared', syncSelection)
    fabricCanvas.on('text:changed', syncSelection)


    // Dispose Fabric instance on unmount
    return () => {
      fabricCanvas.dispose()
      fabricCanvasRef.current = null
      currentImageRef.current = null
      setIsReady(false)
    }
  }, [])

  const placeImageOnCanvas = async (
    file: File,
    source: 'upload' | 'clipboard'
  ) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Create temporary local URL for the selected file
    const imageUrl = URL.createObjectURL(file)

    try {
      // Load image into Fabric object
      const image = await FabricImage.fromURL(imageUrl)

      // Remove previous image before adding a new one
      if (currentImageRef.current) {
        canvas.remove(currentImageRef.current)
        currentImageRef.current = null
      }

      const imageWidth = image.width ?? 1
      const imageHeight = image.height ?? 1

      // Fit image into the canvas while keeping aspect ratio
      const { width: maxWidth, height: maxHeight } = getMaxCanvasSize()

      const fitScale = Math.min(1, maxWidth / imageWidth, maxHeight / imageHeight)

      const previousWidth = canvas.getWidth()
      const previousHeight = canvas.getHeight()

      const newWidth = Math.max(1, Math.round(imageWidth * fitScale))
      const newHeight  = Math.max(1, Math.round(imageHeight * fitScale))

      //set canvas dimension as picture
      canvas.setDimensions({ width: newWidth, height: newHeight  })
      //set text position
      const ratioX = newWidth / previousWidth
      const ratioY = newHeight  / previousHeight

      canvas.getObjects().forEach((object) => {
        object.set({
          left: (object.left ?? 0) * ratioX,
          top: (object.top ?? 0) * ratioY,
        })
        object.setCoords()
      })
    

     // Make the base image non-interactive for now
      image.set({
        originX: 'center',
        originY: 'center',
        left: newWidth / 2,
        top: newHeight  / 2,
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
      // Release temporary browser URL
      URL.revokeObjectURL(imageUrl)
    }
  }

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
      // Чужие сайты часто запрещают загрузку картинки со стороны (CORS)
      setStatusMessage(
        'This site does not allow loading the image. Save it to your device and use "Select image".'
      )
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await placeImageOnCanvas(file, 'upload')

    // Allow selecting the same file again
    event.target.value = ''
  }

 const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
    // data from buffer
    const clipboardFiles = event.clipboardData.files
    const clipboardItems = event.clipboardData.items
    const html = event.clipboardData.getData('text/html')
    const text = event.clipboardData.getData('text/plain').trim()

    // picture is in buffer
    if (clipboardFiles && clipboardFiles.length > 0) {
      const imageFile = Array.from(clipboardFiles).find((file) =>
        file.type.startsWith('image/')
      )

      if (imageFile) {
        event.preventDefault()
        await placeImageOnCanvas(imageFile, 'clipboard')
        return
      }
    }

    // buffer elements
    if (clipboardItems) {
      for (const item of Array.from(clipboardItems)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()

          if (file) {
            event.preventDefault()
            await placeImageOnCanvas(file, 'clipboard')
            return
          }
        }
      }
    }

    // if picture came as html or link
    const htmlSrc = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    const url = htmlSrc ?? (/^https?:\/\/\S+$/i.test(text) ? text : null)

    if (url) {
      event.preventDefault()
      await placeImageFromUrl(url)
      return
    }

    setStatusMessage('Clipboard does not contain an image.')
  }

  const clearCanvasImage = () => {
    const canvas = fabricCanvasRef.current
    const currentImage = currentImageRef.current

    if (!canvas || !currentImage) return

    // Remove current image and reset UI state
    canvas.remove(currentImage)
    currentImageRef.current = null
    setFileName('No image selected')
    setStatusMessage('Canvas image removed.')
    setHasImage(false)
    canvas.renderAll()
  }

  const addTextLayer = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const textbox = new Textbox('YOUR TEXT', {
      originX: 'center',
      originY: 'center',
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      width: canvas.getWidth() * 0.8,
      fontSize: 48,
      fontFamily: 'Impact, Anton, sans-serif',
      fontWeight: 'normal',
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 3,
      strokeLineJoin: 'round',
      paintFirst: 'stroke',
      textAlign: 'center',
    })

    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    canvas.requestRenderAll()
    setStatusMessage('Text added. Drag it, or adit it in the panel.')
  }

  const updateSelectedText = (props: Partial<Textbox>) => {
  const canvas = fabricCanvasRef.current
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
  setTextColor(event.target.value)
  updateSelectedText({ fill: event.target.value })
}

const removeSelectedText = () => {
  const canvas = fabricCanvasRef.current
  const textObject = selectedTextRef.current
  if (!canvas || !textObject) return

  canvas.remove(textObject)
  canvas.discardActiveObject()
  canvas.requestRenderAll()
}

// export of the picture into jpg file

const exportJpeg = () => {
  const canvas = fabricCanvasRef.current
  if (!canvas) return

  // Delete selection for frame not to get into the file
  canvas.discardActiveObject()
  canvas.requestRenderAll()

  const canvasWidth = canvas.getWidth()
  const canvasHeight = canvas.getHeight()
  const image = currentImageRef.current

//multiply canvas to set back default quality of the picture
  let multiplier = 1
  if (exportOriginalSize && image) {
    multiplier = 1 / (image.scaleX || 1)
  }

  const maxMultiplier = MAX_EXPORT_SIDE / Math.max(canvasWidth, canvasHeight)
  multiplier = Math.min(multiplier, maxMultiplier)

  const dataUrl = canvas.toDataURL({
    format: 'jpeg',
    quality: jpegQuality / 100,
    multiplier,
  })

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'my_picture.jpg'
  link.click()

  setStatusMessage(
    `Exported JPG: ${Math.round(canvasWidth * multiplier)}×${Math.round(canvasHeight * multiplier)} px.`
  )
}

const pasteFromClipboardButton = async () => {
  if (!navigator.clipboard?.read) {
    setStatusMessage('Your browser cannot read the clipboard. Long-press the canvas and choose Paste.')
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
    setStatusMessage('Clipboard access denied. Long-press the canvas and choose Paste.')
  }
}

const applyColor = (color: string) => {
  setTextColor(color)
  updateSelectedText({ fill: color })
}

// Мобильная нижняя панель
const mobileBar = (
  <div className="mobile-bar">
    <div className="text-strip" data-disabled={!hasSelectedText}>
      <IconSize />
      <input
        type="range"
        min={12}
        max={200}
        value={fontSize}
        aria-label="Text size"
        onChange={handleFontSizeChange}
        disabled={!hasSelectedText}
      />
      {['#ffffff', '#000000', '#ffe58f'].map((color) => (
        <button
          key={color}
          type="button"
          className="swatch-btn"
          aria-label={`Text color ${color}`}
          disabled={!hasSelectedText}
          onClick={() => applyColor(color)}
        >
          <span
            className="swatch"
            style={{ background: color }}
            data-active={textColor.toLowerCase() === color}
          />
        </button>
      ))}
    </div>

    <div className="icon-row">
      <button type="button" className="icon-btn icon-btn--sky" aria-label="Paste from clipboard" onClick={pasteFromClipboardButton}>
        <IconPaste />
      </button>
      <label className="icon-btn icon-btn--lavender" htmlFor="image-upload" aria-label="Select image file">
        <IconImage />
      </label>
      <button type="button" className="icon-btn icon-btn--yellow" aria-label="Add text" onClick={addTextLayer} disabled={!hasImage}>
        <IconTextPlus />
      </button>
      <button type="button" className="icon-btn icon-btn--pink" aria-label="Delete text" onClick={removeSelectedText} disabled={!hasSelectedText}>
        <IconTrash />
      </button>
      <button type="button" className="icon-btn icon-btn--mint" aria-label="Download JPG" onClick={exportJpeg} disabled={!hasImage}>
        <IconDownload />
      </button>
    </div>
  </div>
)

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1 className="logo">
          Photo <span className="logo-accent">Text</span> Editor
        </h1>
        <p className="tagline">Upload a pic · add a caption · download JPG</p>
      </header>

      <main className="workspace">
        <section
          ref={pasteZoneRef}
          className="editor-stage"
          aria-label="Canvas workspace"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <div className="canvas-frame" ref={frameRef}>
            <div className="canvas-holder" data-empty={!hasImage}>
              <canvas ref={canvasElementRef} />
            </div>

            {!hasImage && (
              <div className="empty-state">
                <div
                  className="paste-target"
                  contentEditable
                  suppressContentEditableWarning
                  inputMode="none"
                  spellCheck={false}
                  role="textbox"
                  aria-label="Paste an image here"
                  onPaste={(event) => {
                    void handlePaste(event)
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onKeyDown={(event) => {
                    if (!(event.ctrlKey || event.metaKey)) event.preventDefault()
                  }}
                  onCut={(event) => event.preventDefault()}
                  onDrop={(event) => event.preventDefault()}
                />

                <div className="empty-content">
                  <h2 className="empty-title">Paste an image here</h2>
                  <p className="empty-bubble">Paste</p>
                  <p className="empty-sub">Touch and hold this area</p>
                  <ol className="empty-steps">
                    <li><b>1</b>In your browser, hold an image and tap “Copy”</li>
                    <li><b>2</b>Come back, hold this area and tap “Paste”</li>
                    <li><b>3</b>Or pick a file with the button below, then add text</li>
                    <li><b>4</b>Download your meme as JPG</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="status-bar">
            <span className="status-dot" data-ready={isReady} />
            <p className="status-text">{isReady ? statusMessage : 'Canvas is loading...'}</p>
            <p className="paste-hint">
              Click here, then <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste an image
            </p>
          </div>
        </section>

        {!isMobile && (
          <aside className="tools">
            <section className="panel-section">
              <h2>
                <span className="step-badge">1</span>Image
              </h2>

              <div className="btn-row">
                <label className="btn btn-lavender" htmlFor="image-upload">
                  Select image
                </label>
                <button
                  className="btn btn-pink"
                  type="button"
                  onClick={clearCanvasImage}
                >
                  Remove
                </button>
              </div>

              <input
                id="image-upload"
                className="file-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />

              <p className="file-name" title={fileName}>
                {fileName}
              </p>
            </section>

            <section className="panel-section">
              <h2>
                <span className="step-badge">2</span>Text
              </h2>

              <button
                className="btn btn-yellow btn-wide"
                type="button"
                onClick={addTextLayer}
              >
                + Add text
              </button>

              <label className="field-label" htmlFor="text-value">
                Caption
              </label>
              <textarea
                id="text-value"
                className="text-input"
                rows={2}
                placeholder="Select or add a text layer"
                value={hasSelectedText ? textValue : ''}
                onChange={handleTextChange}
                disabled={!hasSelectedText}
              />

              <div className="field-row">
                <div className="field">
                  <label className="field-label" htmlFor="text-size">
                    Size <b>{fontSize}px</b>
                  </label>
                  <input
                    id="text-size"
                    type="range"
                    min={12}
                    max={200}
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    disabled={!hasSelectedText}
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="text-color">
                    Color
                  </label>
                  <input
                    id="text-color"
                    type="color"
                    value={textColor}
                    onChange={handleColorChange}
                    disabled={!hasSelectedText}
                  />
                </div>
              </div>

              <button
                className="btn btn-pink btn-wide"
                type="button"
                onClick={removeSelectedText}
                disabled={!hasSelectedText}
              >
                Remove text
              </button>
            </section>

            <section className="panel-section">
              <h2>
                <span className="step-badge">3</span>Export
              </h2>

              <label className="field-label" htmlFor="jpeg-quality">
                JPG quality <b>{jpegQuality}%</b>
              </label>
              <input
                id="jpeg-quality"
                type="range"
                min={50}
                max={100}
                value={jpegQuality}
                onChange={(event) => setJpegQuality(Number(event.target.value))}
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={exportOriginalSize}
                  onChange={(event) => setExportOriginalSize(event.target.checked)}
                />
                Original image resolution
              </label>

              <button
                className="btn btn-mint btn-wide btn-big"
                type="button"
                onClick={exportJpeg}
              >
                Download JPG
              </button>
            </section>
          </aside>
        )}
      </main>

      {isMobile && mobileBar}

      <input
        id="image-upload"
        className="file-input"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  )

}

export default App