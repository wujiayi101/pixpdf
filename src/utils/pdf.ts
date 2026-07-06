export type PageFormat = 'a4' | 'letter'

export type ImageItem = {
  id: string
  file: File
  previewUrl: string
  name: string
  width: number
  height: number
}

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'])

export function isImageFile(file: File) {
  return ACCEPTED_TYPES.has(file.type)
}

export async function createImageItem(file: File): Promise<ImageItem> {
  const previewUrl = URL.createObjectURL(file)
  const { width, height } = await readImageSize(previewUrl)
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl,
    name: file.name,
    width,
    height,
  }
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

function imageToJpegDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}

function fitOnPage(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  marginMm: number
) {
  const innerWidth = pageWidth - marginMm * 2
  const innerHeight = pageHeight - marginMm * 2
  const scale = Math.min(innerWidth / imageWidth, innerHeight / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  const x = marginMm + (innerWidth - width) / 2
  const y = marginMm + (innerHeight - height) / 2
  return { x, y, width, height }
}

export async function exportImagesToPdf(
  images: ImageItem[],
  options: { format: PageFormat; marginMm: number; filename: string }
) {
  if (images.length === 0) return

  const { jsPDF } = await import('jspdf')
  let pdf: InstanceType<typeof jsPDF> | null = null

  for (let i = 0; i < images.length; i++) {
    const item = images[i]
    const img = await loadImage(item.previewUrl)
    const dataUrl = imageToJpegDataUrl(img)
    const landscape = item.width > item.height
    const orientation = landscape ? 'landscape' : 'portrait'

    if (i === 0) {
      pdf = new jsPDF({ orientation, unit: 'mm', format: options.format })
    } else {
      pdf!.addPage(options.format, orientation)
    }

    const pageWidth = pdf!.internal.pageSize.getWidth()
    const pageHeight = pdf!.internal.pageSize.getHeight()
    const placement = fitOnPage(item.width, item.height, pageWidth, pageHeight, options.marginMm)
    pdf!.addImage(dataUrl, 'JPEG', placement.x, placement.y, placement.width, placement.height, undefined, 'FAST')
  }

  pdf!.save(options.filename)
}

export function revokeImageItem(item: ImageItem) {
  URL.revokeObjectURL(item.previewUrl)
}
