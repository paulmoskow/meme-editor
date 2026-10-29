import type { ClipboardEvent } from 'react'

type Props = {
  onPaste: (event: ClipboardEvent<HTMLElement>) => void
}

// instruction on the background while image is missing
export function EmptyState({ onPaste }: Props) {
  return (
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
          onPaste(event)
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
          <li>
            <b>1</b>In your browser, hold an image and tap “Copy”
          </li>
          <li>
            <b>2</b>Come back, hold this area and tap “Paste”
          </li>
          <li>
            <b>3</b>Or pick a file with the button below, then add text
          </li>
          <li>
            <b>4</b>Download your meme as JPG
          </li>
        </ol>
      </div>
    </div>
  )
}