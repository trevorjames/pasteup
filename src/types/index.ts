// src/types/index.ts

export type CanvasFormat = {
  id: string
  label: string
  width: number
  height: number
  pxWidth: number
  pxHeight: number
}

export const CANVAS_FORMATS: CanvasFormat[] = [
  { id: '8x10',  label: '8 × 10"',  width: 8,  height: 10, pxWidth: 480, pxHeight: 600 },
  { id: '5x7',   label: '5 × 7"',   width: 5,  height: 7,  pxWidth: 420, pxHeight: 588 },
  { id: '18x24', label: '18 × 24"', width: 18, height: 24, pxWidth: 540, pxHeight: 720 },
]

export const DEFAULT_FORMAT = CANVAS_FORMATS[0]

export type NYPLImage = {
  uuid: string
  title: string
  imageUrl: string
  thumbnailUrl: string
  date: string
  description: string
}

export type NYPLSearchResponse = {
  images: NYPLImage[]
  totalCount: number
  page: number
}

export type ToolMode =
  | 'select'
  | 'crop-rect'
  | 'crop-circle'
  | 'crop-lasso'
  | 'slice'
  | 'tape'
  | 'text'
  | 'draw'
  | 'brush'

export type CollageState = {
  id?: string
  name: string
  formatId: string
  canvasJson: string
  previewUrl?: string
  published: boolean
  createdAt?: string
  updatedAt?: string
}

export type ObjectProperties = {
  opacity: number
  angle: number
  scaleX: number
  scaleY: number
  flipX: boolean
  flipY: boolean
  blendMode: GlobalCompositeOperation | ''
  filter: string
}
