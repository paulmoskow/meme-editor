import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent } from 'react';
import { Canvas, FabricImage } from 'fabric'

function App() {
  // DOM canvas element
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)

  // Fabric canvas instance
  const fabricCanvasRef = useRef<Canvas | null>(null)

  // Currently displayed image on the canvas
  const currentImageRef = useRef<FabricImage | null>(null)

  // Focusable area that receives paste events
  const pasteZoneRef = useRef<HTMLDivElement | null>(null)

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
      width: 900,
      height: 560,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    })

    fabricCanvasRef.current = fabricCanvas
    fabricCanvas.renderAll()
    setIsReady(true)

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

      // Make the base image non-interactive for now
      image.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
      })

      const canvasWidth = canvas.getWidth()
      const canvasHeight = canvas.getHeight()

      const imageWidth = image.width ?? 1
      const imageHeight = image.height ?? 1

      // Fit image into the canvas while keeping aspect ratio
      const scale = Math.min(
        canvasWidth / imageWidth,
        canvasHeight / imageHeight
      )

      image.scale(scale)

      const scaledWidth = imageWidth * scale
      const scaledHeight = imageHeight * scale

      // Center image inside the workspace
      image.set({
        left: (canvasWidth - scaledWidth) / 2,
        top: (canvasHeight - scaledHeight) / 2,
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