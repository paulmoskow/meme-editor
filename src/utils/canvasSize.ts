import { FALLBACK_CANVAS_SIZE, MAX_CANVAS_WIDTH } from '../constants'

// max canvas size that fits the frame
export function getMaxCanvasSize(frame: HTMLElement | null) {
  if (!frame) return FALLBACK_CANVAS_SIZE

  const style = getComputedStyle(frame)
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)

  // area for frames width (-14)
  return {
    width: Math.max(200, Math.min(MAX_CANVAS_WIDTH, frame.clientWidth - padX - 14)),
    height: Math.max(200, frame.clientHeight - padY - 14),
  }
}