// src/lib/fabricUtils.ts - Fabric 5 compatible

// ─── Helper: reload image from proxy with a clipPath ─────────────────────────

function reloadImageWithClip(
  canvas: any,
  img: any,
  clip: any,
  callback?: () => void
): void {
  const { fabric } = (window as any).__fabricLib
  const src = img._element?.src ?? img._element?.currentSrc ?? ''

  if (!src) {
    console.error('reloadImageWithClip: no src found on image')
    return
  }

  fabric.Image.fromURL(
    src,
    (newImg: any) => {
      if (!newImg) return
      newImg.set({
        left: img.left,
        top: img.top,
        scaleX: img.scaleX,
        scaleY: img.scaleY,
        angle: img.angle,
        clipPath: clip,
        selectable: true,
        evented: true,
        cornerStyle: 'circle',
        cornerColor: '#c84b2f',
        cornerStrokeColor: '#fff',
        borderColor: '#c84b2f',
        transparentCorners: false,
      })
      newImg.setCoords()
      canvas.add(newImg)
      canvas.setActiveObject(newImg)
      canvas.renderAll()
      if (callback) callback()
    },
    { crossOrigin: 'anonymous' }
  )
}

// ─── Load a remote image onto the canvas ─────────────────────────────────────

export function loadImageFromUrl(
  canvas: any,
  url: string,
  options?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const { fabric } = (window as any).__fabricLib

    // Data URLs (from uploads) load directly — no CORS, no proxy needed.
    // Everything else (NYPL, Smithsonian, etc.) goes through the proxy.
    const isDataUrl = url.startsWith('data:')
    const finalUrl = isDataUrl ? url : `/api/image-proxy?url=${encodeURIComponent(url)}`

    fabric.Image.fromURL(
      finalUrl,
      (img: any) => {
        if (!img) { reject(new Error('Image load failed')); return }

        const maxDim = Math.min(canvas.width, canvas.height) * 0.6
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)

        img.set({
          left: canvas.width / 2 - (img.width * scale) / 2,
          top: canvas.height / 2 - (img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          cornerStyle: 'circle',
          cornerColor: '#c84b2f',
          cornerStrokeColor: '#fff',
          borderColor: '#c84b2f',
          transparentCorners: false,
          ...options,
        })

        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        resolve(img)
      },
      { crossOrigin: 'anonymous' }
    )
  })
}

// ─── Rectangular crop ────────────────────────────────────────────────────────

export function applyRectCrop(
  canvas: any,
  img: any,
  rect: { left: number; top: number; width: number; height: number }
): void {
  const bounds = img.getBoundingRect()
  const offscreen = document.createElement('canvas')
  offscreen.width = Math.ceil(rect.width)
  offscreen.height = Math.ceil(rect.height)
  const ctx = offscreen.getContext('2d')!

  ctx.drawImage(
    img._element,
    0, 0,
    img._element.width,
    img._element.height,
    -(rect.left - bounds.left) - (bounds.left - img.left),
    -(rect.top - bounds.top) - (bounds.top - img.top),
    img._element.width * img.scaleX,
    img._element.height * img.scaleY
  )

  const { fabric } = (window as any).__fabricLib
  fabric.Image.fromURL(offscreen.toDataURL('image/png'), (newImg: any) => {
    if (!newImg) return
    newImg.set({
      left: rect.left,
      top: rect.top,
      selectable: true,
      evented: true,
      cornerStyle: 'circle',
      cornerColor: '#c84b2f',
      cornerStrokeColor: '#fff',
      borderColor: '#c84b2f',
      transparentCorners: false,
    })
    newImg.setCoords()
    canvas.add(newImg)
    canvas.setActiveObject(newImg)
    canvas.remove(img)
    canvas.requestRenderAll()
  })
}

// ─── Lasso / freehand mask — pixel extraction ────────────────────────────────

export function applyLassoMask(
  canvas: any,
  img: any,
  points: { x: number; y: number }[],
  callback?: () => void
): void {
  if (points.length < 3) return
  const { fabric } = (window as any).__fabricLib

  const clip = new fabric.Polygon(points, {
    absolutePositioned: true,
    selectable: false,
    evented: false,
  })

  reloadImageWithClip(canvas, img, clip, callback)
}

// ─── Pixel-based extraction (used by lasso + extract tools) ──────────────────

export function extractPieceAsPixels(
  canvas: any,
  img: any,
  points: { x: number; y: number }[],
  callback?: () => void
): void {
  if (points.length < 3) return

  const bounds = img.getBoundingRect()
  const offscreen = document.createElement('canvas')
  offscreen.width = Math.ceil(bounds.width)
  offscreen.height = Math.ceil(bounds.height)
  const ctx = offscreen.getContext('2d')!

  ctx.beginPath()
  points.forEach((p, i) => {
    const lx = p.x - bounds.left
    const ly = p.y - bounds.top
    i === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly)
  })
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    img._element,
    0, 0,
    img._element.width,
    img._element.height,
    -bounds.left + img.left,
    -bounds.top + img.top,
    img._element.width * img.scaleX,
    img._element.height * img.scaleY
  )

  const { fabric } = (window as any).__fabricLib
  fabric.Image.fromURL(offscreen.toDataURL('image/png'), (newImg: any) => {
    if (!newImg) return
    newImg.set({
      left: bounds.left,
      top: bounds.top,
      selectable: true,
      evented: true,
      cornerStyle: 'circle',
      cornerColor: '#c84b2f',
      cornerStrokeColor: '#fff',
      borderColor: '#c84b2f',
      transparentCorners: false,
    })
    newImg.setCoords()
    canvas.add(newImg)
    canvas.setActiveObject(newImg)
    canvas.renderAll()
    if (callback) callback()
  })
}

// ─── Circle crop — pixel extraction ──────────────────────────────────────────

export function extractCircle(
  canvas: any,
  img: any,
  center: { x: number; y: number },
  radius: number,
  callback?: () => void
): void {
  const bounds = img.getBoundingRect()
  const offscreen = document.createElement('canvas')
  offscreen.width = Math.ceil(bounds.width)
  offscreen.height = Math.ceil(bounds.height)
  const ctx = offscreen.getContext('2d')!

  ctx.beginPath()
  ctx.arc(
    center.x - bounds.left,
    center.y - bounds.top,
    radius, 0, Math.PI * 2
  )
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    img._element,
    0, 0,
    img._element.width,
    img._element.height,
    -bounds.left + img.left,
    -bounds.top + img.top,
    img._element.width * img.scaleX,
    img._element.height * img.scaleY
  )

  const { fabric } = (window as any).__fabricLib
  fabric.Image.fromURL(offscreen.toDataURL('image/png'), (newImg: any) => {
    if (!newImg) return
    newImg.set({
      left: bounds.left,
      top: bounds.top,
      selectable: true,
      evented: true,
      cornerStyle: 'circle',
      cornerColor: '#c84b2f',
      cornerStrokeColor: '#fff',
      borderColor: '#c84b2f',
      transparentCorners: false,
    })
    newImg.setCoords()
    canvas.add(newImg)
    canvas.setActiveObject(newImg)
    canvas.renderAll()
    if (callback) callback()
  })
}

// ─── Add tape effect ──────────────────────────────────────────────────────────

export function addTape(
  canvas: any,
  x: number,
  y: number,
  angle = 0
): void {
  const { fabric } = (window as any).__fabricLib

  const width = 90 + Math.random() * 50
  const height = 26

  // Build a jagged torn-edge path on the left and right ends
  const jag = (baseX: number, dir: number) => {
    const teeth = 5
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= teeth; i++) {
      const t = i / teeth
      const jx = baseX + dir * (Math.random() * 3)
      pts.push({ x: jx, y: t * height })
    }
    return pts
  }

  const leftEdge = jag(0, 1)
  const rightEdge = jag(width, -1).reverse()
  const points = [...leftEdge, ...rightEdge]

  const tape = new fabric.Polygon(points, {
    left: x,
    top: y,
    fill: 'rgba(232, 222, 188, 0.55)',
    stroke: 'rgba(200, 188, 150, 0.5)',
    strokeWidth: 0.5,
    angle: angle + (Math.random() * 8 - 4),
    selectable: true,
    evented: true,
    cornerStyle: 'circle',
    cornerColor: '#c84b2f',
    borderColor: '#c84b2f',
    transparentCorners: false,
    shadow: new fabric.Shadow({
      color: 'rgba(0,0,0,0.1)',
      blur: 2,
      offsetX: 1,
      offsetY: 1,
    }),
  })

  canvas.add(tape)
  canvas.setActiveObject(tape)
  canvas.renderAll()
}

// ─── Remove clip ─────────────────────────────────────────────────────────────

export function removeClip(canvas: any, img: any): void {
  img.clipPath = undefined
  canvas.renderAll()
}

// ─── Extract piece (scissors tool) ──────────────────────────────────────────

export function extractPiece(
  canvas: any,
  img: any,
  points: { x: number; y: number }[],
  callback?: () => void
): void {
  extractPieceAsPixels(canvas, img, points, callback)
}

// ─── Canvas serialization ────────────────────────────────────────────────────

export function serializeCanvas(canvas: any): string {
  return JSON.stringify(
    canvas.toJSON(['clipPath', 'id', 'sourceUrl', 'data'])
  )
}

export function loadCanvasFromJSON(
  canvas: any,
  json: string
): Promise<void> {
  return new Promise((resolve) => {
    canvas.loadFromJSON(json, () => {
      canvas.renderAll()
      resolve()
    })
  })
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportCanvas(
  canvas: any,
  multiplier = 1,
  format: 'png' | 'jpeg' = 'png'
): string {
  return canvas.toDataURL({ format, multiplier, quality: 1 })
}