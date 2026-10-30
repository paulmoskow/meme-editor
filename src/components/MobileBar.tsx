import {
  IconDownload,
  IconImage,
  IconPaste,
  IconSize,
  IconTextPlus,
  IconTrash,
} from '../icons'
import type { ExportApi } from '../hooks/useExport'
import type { ImageInputApi } from '../hooks/useImageInput'
import type { TextLayerApi } from '../hooks/useTextLayer'

type Props = {
  imageInput: ImageInputApi
  textLayer: TextLayerApi
  exporter: ExportApi
  onDelete: () => void
}

// foot bar for mobile: text settings and round buttons
export function MobileBar({ imageInput, textLayer, exporter, onDelete }: Props) {
  const { hasImage } = imageInput

  return (
    <div className="mobile-bar">
      <div className="text-strip" data-disabled={!textLayer.hasSelectedText}>
        <IconSize />
        <input
          type="range"
          min={12}
          max={200}
          value={textLayer.fontSize}
          aria-label="Text size"
          onChange={textLayer.handleFontSizeChange}
          disabled={!textLayer.hasSelectedText}
        />
        {(() => {
          const isWhite = textLayer.textColor.toLowerCase() === '#ffffff'

          return (
            <>
              <button
                type="button"
                className="swatch-btn"
                aria-label="White text"
                disabled={!textLayer.hasSelectedText}
                onClick={() => textLayer.applyColor('#ffffff')}
              >
                <span className="swatch" style={{ background: '#ffffff' }} data-active={isWhite} />
              </button>

              <label className="swatch-btn color-picker-btn" aria-label="Custom text color">
                <span
                  className="swatch"
                  style={isWhite ? undefined : { background: textLayer.textColor }}
                  data-rainbow={isWhite}
                  data-active={!isWhite}
                />
                <input
                  type="color"
                  className="color-native"
                  value={textLayer.textColor}
                  onChange={textLayer.handleColorChange}
                  disabled={!textLayer.hasSelectedText}
                />
              </label>
            </>
          )
        })()}
      </div>

      <div className="icon-row">
        <button
          type="button"
          className="icon-btn icon-btn--sky"
          aria-label="Paste from clipboard"
          onClick={imageInput.pasteFromClipboardButton}
        >
          <IconPaste />
        </button>
        <label
          className="icon-btn icon-btn--lavender"
          htmlFor="image-upload"
          aria-label="Select image file"
        >
          <IconImage />
        </label>
        <button
          type="button"
          className="icon-btn icon-btn--yellow"
          aria-label="Add text"
          onClick={textLayer.addTextLayer}
          disabled={!hasImage}
        >
          <IconTextPlus />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--pink"
          aria-label="Delete text or image"
          onClick={onDelete}
          disabled={!hasImage}
        >
          <IconTrash />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--mint"
          aria-label="Download JPG"
          onClick={exporter.exportJpeg}
          disabled={!hasImage}
        >
          <IconDownload />
        </button>
      </div>
    </div>
  )
}