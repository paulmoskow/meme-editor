// image from buffer as file
export function findImageFile(data: DataTransfer): File | null {
  for (const file of Array.from(data.files)) {
    if (file.type.startsWith('image/')) return file
  }

  for (const item of Array.from(data.items ?? [])) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }

  return null
}

// image as html or link
export function findImageUrl(data: DataTransfer): string | null {
  const html = data.getData('text/html')
  const text = data.getData('text/plain').trim()

  const htmlSrc = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]

  return htmlSrc ?? (/^https?:\/\/\S+$/i.test(text) ? text : null)
}