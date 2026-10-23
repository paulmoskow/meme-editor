import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent } from 'react';
import { Canvas, FabricImage, Textbox } from 'fabric'

const MAX_EXPORT_SIDE = 4096
const MAX_CANVAS_WIDTH = 900
const MAX_CANVAS_HEIGHT = 560

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

  useEffect(() => {
    const canvasElement = canvasElementRef.current
    if (!canvasElement) return

    // Create Fabric canvas once after mount
    const fabricCanvas = new Canvas(canvasElement, {
      width: 720,
      height: 480,
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
      const fitScale = Math.min(
        1,
        MAX_CANVAS_WIDTH / imageWidth,
        MAX_CANVAS_HEIGHT / imageHeight
      )

      const previousWidth = canvas.getWidth()
      const previousHeight = canvas.getHeight()

      const newWidth = Math.max(1, Math.round(imageWidth * fitScale))
      const newHeigth = Math.max(1, Math.round(imageHeight * fitScale))

      //set canvas dimension as picture
      canvas.setDimensions({ width: newWidth, height: newHeigth })
      //set text position
      const ratioX = newWidth / previousWidth
      const ratioY = newHeigth / previousHeight

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
        top: newHeigth / 2,
        scaleX: newWidth / imageWidth,
        scaleY: newHeigth / imageHeight,
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

      canvas.renderAll()
    } catch (error) {
      console.error('Image load failed:', error)
      setStatusMessage('Failed to load image.')
    } finally {
      // Release temporary browser URL
      URL.revokeObjectURL(imageUrl)
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
    const clipboardFiles = event.clipboardData.files

    // First try direct clipboard files
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

    const clipboardItems = event.clipboardData.items
    if (!clipboardItems) return

    // Fallback: inspect clipboard items one by one
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1 className="logo">
          Photo <span className="logo-accent">Text</span> Editor
        </h1>
        <p className="tagline">Upload a pic · add a caption · download JPG</p>
      </header>

      <main className="workspace">
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

        <section
          ref={pasteZoneRef}
          className="editor-stage"
          aria-label="Canvas workspace"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <div className="canvas-frame">
            <canvas ref={canvasElementRef} />
          </div>

          <div className="status-bar">
            <span className="status-dot" data-ready={isReady} />
            <p className="status-text">
              {isReady ? statusMessage : 'Canvas is loading...'}
            </p>
            <p className="paste-hint">
              Click here, then <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste an image
            </p>
          </div>
        </section>
      </main>
    </div>
  ) 
}

export default App