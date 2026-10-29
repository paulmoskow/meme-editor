import type { ExportApi } from '../hooks/useExport'
import type { ImageInputApi } from '../hooks/useImageInput'
import type { TextLayerApi } from '../hooks/useTextLayer'

type Props = {
  imageInput: ImageInputApi
  textLayer: TextLayerApi
  exporter: ExportApi
}

// left panel for desktop: Image / Text / Export
export function DesktopTools({ imageInput, textLayer, exporter }: Props) {
  const { hasImage } = imageInput

  return (
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
            onClick={imageInput.clearCanvasImage}
            disabled={!hasImage}
          >
            Remove
          </button>
        </div>

        <p className="file-name" title={imageInput.fileName}>
          {imageInput.fileName}
        </p>
      </section>

      <section className="panel-section">
        <h2>
          <span className="step-badge">2</span>Text
        </h2>

        <button
          className="btn btn-yellow btn-wide"
          type="button"
          onClick={textLayer.addTextLayer}
          disabled={!hasImage}
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
          value={textLayer.hasSelectedText ? textLayer.textValue : ''}
          onChange={textLayer.handleTextChange}
          disabled={!textLayer.hasSelectedText}
        />

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="text-size">
              Size <b>{textLayer.fontSize}px</b>
            </label>
            <input
              id="text-size"
              type="range"
              min={12}
              max={200}
              value={textLayer.fontSize}
              onChange={textLayer.handleFontSizeChange}
              disabled={!textLayer.hasSelectedText}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="text-color">
              Color
            </label>
            <input
              id="text-color"
              type="color"
              value={textLayer.textColor}
              onChange={textLayer.handleColorChange}
              disabled={!textLayer.hasSelectedText}
            />
          </div>
        </div>

        <button
          className="btn btn-pink btn-wide"
          type="button"
          onClick={textLayer.removeSelectedText}
          disabled={!textLayer.hasSelectedText}
        >
          Remove text
        </button>
      </section>

      <section className="panel-section">
        <h2>
          <span className="step-badge">3</span>Export
        </h2>

        <label className="field-label" htmlFor="jpeg-quality">
          JPG quality <b>{exporter.jpegQuality}%</b>
        </label>
        <input
          id="jpeg-quality"
          type="range"
          min={50}
          max={100}
          value={exporter.jpegQuality}
          onChange={(event) => exporter.setJpegQuality(Number(event.target.value))}
        />

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={exporter.exportOriginalSize}
            onChange={(event) =>
              exporter.setExportOriginalSize(event.target.checked)
            }
          />
          Original image resolution
        </label>

        <button
          className="btn btn-mint btn-wide btn-big"
          type="button"
          onClick={exporter.exportJpeg}
          disabled={!hasImage}
        >
          Download JPG
        </button>
      </section>
    </aside>
  )
}