import { useRef, useState } from 'react'
import { CanvasStage } from './components/CanvasStage'
import { DesktopTools } from './components/DesktopTools'
import { Header } from './components/Header'
import { MobileBar } from './components/MobileBar'
import { useExport } from './hooks/useExport'
import { useFabricCanvas } from './hooks/useFabricCanvas'
import { useImageInput } from './hooks/useImageInput'
import { useIsMobile } from './hooks/useIsMobile'
import { useTextLayer } from './hooks/useTextLayer'

function App() {
  const isMobile = useIsMobile()

  // frame around canvas to set its size
  const frameRef = useRef<HTMLDivElement | null>(null)

  const [statusMessage, setStatusMessage] = useState(
    'Upload an image or paste one from the clipboard.'
  )

  const { canvas, canvasElementRef } = useFabricCanvas(frameRef)
  const imageInput = useImageInput({ canvas, frameRef, setStatusMessage })
  const textLayer = useTextLayer({ canvas, setStatusMessage })
  const exporter = useExport({ canvas, setStatusMessage })

  // remove button for mobile: text first if exists and image after
  const deleteLayer = () => {
    if (!textLayer.removeSelectedOrLastText()) {
      imageInput.clearCanvasImage()
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="workspace">
        <CanvasStage
          frameRef={frameRef}
          canvasElementRef={canvasElementRef}
          hasImage={imageInput.hasImage}
          isReady={canvas !== null}
          statusMessage={statusMessage}
          onPaste={imageInput.handlePaste}
        />

        {!isMobile && (
          <DesktopTools
            imageInput={imageInput}
            textLayer={textLayer}
            exporter={exporter}
          />
        )}
      </main>

      {isMobile && (
        <MobileBar
          imageInput={imageInput}
          textLayer={textLayer}
          exporter={exporter}
          onDelete={deleteLayer}
        />
      )}

      <input
        id="image-upload"
        className="file-input"
        type="file"
        accept="image/*"
        onChange={imageInput.handleImageUpload}
      />
    </div>
  )
}

export default App