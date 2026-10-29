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

const QUICK_COLORS = ['#ffffff', '#000000', '#ffe58f']

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
        {QUICK_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className="swatch-btn"
            aria-label={`Text color ${color}`}
            disabled={!textLayer.hasSelectedText}
            onClick={() => textLayer.applyColor(color)}
          >
            <span
              className="swatch"
              style={{ background: color }}
              data-active={textLayer.textColor.toLowerCase() === color}
            />
          </button>
        ))}
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