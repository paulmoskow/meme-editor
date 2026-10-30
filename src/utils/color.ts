// color brightness
function getLuminance(hex: string): number {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.replace(/(.)/g, '$1$1') : value

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// outline color dependency from font color 
export function getOutlineColor(fill: string): string | null {
  return getLuminance(fill) < 0.25 ? '#ffffff' : '#000000'
}

export const OUTLINE_WIDTH = 3