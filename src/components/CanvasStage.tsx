import type { ClipboardEvent, RefObject } from 'react'
import { EmptyState } from './EmptyState'

type Props = {
  frameRef: RefObject<HTMLDivElement | null>
  canvasElementRef: RefObject<HTMLCanvasElement | null>
  hasImage: boolean
  isReady: boolean
  statusMessage: string
  onPaste: (event: ClipboardEvent<HTMLElement>) => void
}

// working area
export function CanvasStage({
  frameRef,
  canvasElementRef,
  hasImage,
  isReady,
  statusMessage,
  onPaste,
}: Props) {
  return (
    <section
      className="editor-stage"
      aria-label="Canvas workspace"
      tabIndex={0}
      onPaste={onPaste}
    >
      <div className="canvas-frame" ref={frameRef}>
        <div className="canvas-holder" data-empty={!hasImage}>
          <canvas ref={canvasElementRef} />
        </div>

        {!hasImage && <EmptyState onPaste={onPaste} />}
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
  )
}