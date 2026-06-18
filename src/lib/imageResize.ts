// src/lib/imageResize.ts
// Client-side image resizing before adding uploads to the canvas.
// Keeps the editor responsive and avoids storing huge data URLs in
// canvas JSON once Supabase persistence lands.

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 2000 // px — generous for an 18x24 print at reasonable DPI

export class ImageTooLargeError extends Error {
  constructor(sizeMB: number) {
    super(`Image is ${sizeMB.toFixed(1)}MB. Max size is 5MB.`)
    this.name = 'ImageTooLargeError'
  }
}

export class InvalidImageError extends Error {
  constructor() {
    super('File is not a valid image.')
    this.name = 'InvalidImageError'
  }
}

/**
 * Reads a File, validates size/type, and resizes it client-side
 * (if needed) down to MAX_DIMENSION on the longest edge.
 * Returns a data URL ready to load into Fabric.
 */
export async function resizeImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new InvalidImageError()
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ImageTooLargeError(file.size / (1024 * 1024))
  }

  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImageElement(dataUrl)

  const { width, height } = img
  const longestEdge = Math.max(width, height)

  // No resize needed if already under the cap
  if (longestEdge <= MAX_DIMENSION) {
    return dataUrl
  }

  const scale = MAX_DIMENSION / longestEdge
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  // JPEG for photos keeps file size down; quality 0.92 is a good balance
  return canvas.toDataURL('image/jpeg', 0.92)
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new InvalidImageError())
    img.src = src
  })
}