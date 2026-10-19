import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent } from 'react';
import { Canvas, FabricImage, Textbox } from 'fabric'

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

      const canvasWidth = canvas.getWidth()
      const canvasHeight = canvas.getHeight()

      const imageWidth = image.width ?? 1
      const imageHeight = image.height ?? 1

      // Fit image into the canvas while keeping aspect ratio
      const scale = Math.min(
        canvasWidth / imageWidth,
        canvasHeight / imageHeight
      )

     // Make the base image non-interactive for now
      image.set({
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      })

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

    const textbox = new Textbox('Your text', {
      originX: 'center',
      originY:'center',
      left: canvas.getWidth()/2,
      top: canvas.getHeight()/2,
      width: 400,
      fontSize: 48,
      fontFamily: 'Arial',
      fontWeight:'700',
      fill: '#ffffff',
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

const exportJpeg = () => {
  const canvas = fabricCanvasRef.current
  if (!canvas) return

  // Delete selection for frame not to get into the file
  canvas.discardActiveObject()
  canvas.requestRenderAll()

  const dataUrl = canvas.toDataURL({
    format: 'jpeg',
    quality: 0.92,
    multiplier: 1,
  })

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'photo-text-editor.jpg'
  link.click()
}

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">React · Vite · TypeScript · Fabric.js</p>
          <h1>Photo Text Editor</h1>
          <p className="subtitle">
            Step 2.1: upload an image from disk or paste it directly from the
            clipboard.
          </p>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel panel-left">
          <section className="panel-section">
            <h2>Status</h2>
            <p>{isReady ? 'Canvas is ready.' : 'Canvas is loading...'}</p>
            <p className="helper-text">{statusMessage}</p>
          </section>

          <section className="panel-section">
            <h2>Image input</h2>

            <label className="upload-label" htmlFor="image-upload">
              Select image
            </label>

            <input
              id="image-upload"
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />

            <p className="helper-text">Current file: {fileName}</p>

            <button
              className="secondary-button"
              type="button"
              onClick={clearCanvasImage}
            >
              Remove image
            </button>
          </section>
          <section className="panel-section">
            <h2>Text</h2>

            <button className="secondary-button" type="button" onClick={addTextLayer}>
              Add text
            </button>

            {hasSelectedText && (
              <div className="text-controls">
                <label className="field-label" htmlFor="text-value">Content</label>
                <textarea
                  id="text-value"
                  className="text-input"
                  rows={3}
                  value={textValue}
                  onChange={handleTextChange}
                />

                <label className="field-label" htmlFor="text-size">
                  Size: {fontSize}px
                </label>
                <input
                  id="text-size"
                  type="range"
                  min={12}
                  max={200}
                  value={fontSize}
                  onChange={handleFontSizeChange}
                />

                <label className="field-label" htmlFor="text-color">Color</label>
                <input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={handleColorChange}
                />

                <button
                  className="secondary-button"
                  type="button"
                  onClick={removeSelectedText}
                >
                  Remove text
                </button>
              </div>
            )}
          </section>

          <section className="panel-section">
            <h2>Export</h2>
            <button className="secondary-button" type="button" onClick={exportJpeg}>
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

          <div className="paste-hint">
            Click this area and press <kbd>Ctrl</kbd> + <kbd>V</kbd> or{' '}
            <kbd>Cmd</kbd> + <kbd>V</kbd> to paste an image from the clipboard.
          </div>
        </section>

        <aside className="panel panel-right">
          <section className="panel-section">
            <h2>Clipboard support</h2>
            <p>
              You can now either upload a local image or paste a copied image
              directly into the editor workspace.
            </p>
          </section>

          <section className="panel-section">
            <h2>Next step</h2>
            <p>
              After image input is done, the next step is adding a text layer on
              top of the canvas.
            </p>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App