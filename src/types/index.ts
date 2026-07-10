// src/types/index.ts
 
export type CanvasPanel = {
  label: string
  height: number // inches; panels stack top→bottom and heights should sum to the format's total height
}
 
export type CanvasFormat = {
  id: string
  label: string
  width: number
  height: number
  pxWidth: number
  pxHeight: number
  // Optional fold/panel guides drawn over the canvas (left → right).
  // Used by multi-panel formats like the cassette J-card.
  panels?: CanvasPanel[]
}
 
export const CANVAS_FORMATS: CanvasFormat[] = [
  { id: '8x10',  label: '8 × 10"',  width: 8,  height: 10, pxWidth: 480, pxHeight: 600 },
  { id: '5x7',   label: '5 × 7"',   width: 5,  height: 7,  pxWidth: 420, pxHeight: 588 },
  { id: '18x24', label: '18 × 24"', width: 18, height: 24, pxWidth: 540, pxHeight: 720 },
  {
    id: 'cassette',
    label: 'Cassette J-card',
    // Standard Norelco J-card: 4" wide, panels stacked to 4" tall.
    width: 4, height: 4,
    pxWidth: 480, pxHeight: 480,
    // Panels stack top→bottom; a horizontal fold sits between each.
    // Heights should sum to `height`. Bump "Back" to 2.5 for a full
    // back panel (a 4 × 5.5 U-card-style wrap) if you want more art room.
    panels: [
      { label: 'Front', height: 2.5 }, // shows through the front of the case
      { label: 'Spine', height: 0.5 }, // title strip, read when shelved (runs the full 4" width)
      { label: 'Back',  height: 1.0 }, // flap that folds in behind the cassette
    ],
  },
]
 
export const DEFAULT_FORMAT = CANVAS_FORMATS[0]
 
// Where an image came from. 'upload' is the user's own files.
export type ImageSource = 'nypl' | 'smithsonian' | 'europeana' | 'upload'
 
// An image from any connected open-access collection.
export type CollectionImage = {
  uuid: string
  title: string
  imageUrl: string
  thumbnailUrl: string
  date: string
  description: string
  source?: ImageSource
  attribution?: string // e.g. "National Portrait Gallery"
}
 
// Back-compat alias — existing imports of NYPLImage keep working.
export type NYPLImage = CollectionImage
 
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
  | 'xacto'
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