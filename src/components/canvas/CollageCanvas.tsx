'use client'
// src/components/canvas/CollageCanvas.tsx - Fabric 5 compatible

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react'
import type { ToolMode, CanvasFormat, ObjectProperties } from '@/types'

export type CollageCanvasHandle = {
  loadImage: (url: string) => Promise<void>
  deleteSelected: () => void
  undo: () => void
  serialize: () => string
  loadFromJSON: (json: string) => Promise<void>
  exportImage: (multiplier?: number) => string
  getActiveObjectProps: () => ObjectProperties | null
  updateActiveObject: (props: Partial<ObjectProperties>) => void
  removeClipFromSelected: () => void
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void
}

type Props = {
  format: CanvasFormat
  toolMode: ToolMode
  onSelectionChange: (props: ObjectProperties | null) => void
  onCanvasChange: () => void
  brushSize?: number
  brushColor?: string
  pencilSize?: number
  pencilColor?: string
  textFont?: string
}

export const CollageCanvas = forwardRef<CollageCanvasHandle, Props>(
  function CollageCanvas({ format, toolMode, onSelectionChange, onCanvasChange, brushSize = 20, brushColor = '#1a1208', pencilSize = 2, pencilColor = '#1a1208', textFont = 'Georgia, serif' }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasElRef = useRef<HTMLCanvasElement>(null)
    const lassoCanvasRef = useRef<HTMLCanvasElement>(null)
    const fabricRef = useRef<any>(null)
    const historyRef = useRef<string[]>([])
    const toolModeRef = useRef<ToolMode>(toolMode)
    const utilsRef = useRef<any>(null)
    const lastSelectedRef = useRef<any>(null)
    const textFontRef = useRef(textFont)
    useEffect(() => { textFontRef.current = textFont }, [textFont])
    const [isEmpty, setIsEmpty] = useState(true)

    const updateEmpty = useCallback(() => {
      const canvas = fabricRef.current
      if (!canvas) return
      setIsEmpty(canvas.getObjects().length === 0)
    }, [])

    const lassoRef = useRef<{
      active: boolean
      points: { x: number; y: number }[]
      line: any
    }>({ active: false, points: [], line: null })

    const sliceRef = useRef<{
      active: boolean
      start: { x: number; y: number } | null
      guide: any
      points: { x: number; y: number }[]
    }>({ active: false, start: null, guide: null, points: [] })

    const cropRef = useRef<{
      active: boolean
      start: { x: number; y: number } | null
      rect: any
    }>({ active: false, start: null, rect: null })

    // Circle crop state
    const circleRef = useRef<{
      active: boolean
      start: { x: number; y: number } | null
      preview: any
      targetImg: any
      previewClone: any
    }>({ active: false, start: null, preview: null, targetImg: null, previewClone: null })

    // Keep toolMode ref in sync
    useEffect(() => {
      toolModeRef.current = toolMode
      const canvas = fabricRef.current
      if (!canvas) return
      const { fabric } = (window as any).__fabricLib ?? {}

      const isSelectMode = toolMode === 'select'
      const isDrawMode = toolMode === 'draw' || toolMode === 'brush'

      if (canvas.isDrawingMode && !isDrawMode) {
        canvas.isDrawingMode = false
      }

      if (isDrawMode && fabric) {
        canvas.isDrawingMode = true
        if (toolMode === 'draw') {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
          canvas.freeDrawingBrush.width = pencilSize
          canvas.freeDrawingBrush.color = pencilColor
        } else {
          canvas.freeDrawingBrush = new fabric.CircleBrush(canvas)
          canvas.freeDrawingBrush.width = brushSize
          canvas.freeDrawingBrush.color = brushColor
        }
      }

      canvas.selection = isSelectMode
      canvas.forEachObject((obj: any) => {
        obj.selectable = isSelectMode
        obj.evented = isSelectMode
      })
      canvas.defaultCursor = isSelectMode ? 'default' : 'crosshair'
      canvas.renderAll()
    }, [toolMode, brushSize, brushColor, pencilSize, pencilColor])

    const pushHistory = useCallback(() => {
      const canvas = fabricRef.current
      const utils = utilsRef.current
      if (!canvas || !utils) return
      historyRef.current.push(utils.serializeCanvas(canvas))
      if (historyRef.current.length > 40) historyRef.current.shift()
    }, [])

    useEffect(() => {
      const el = canvasElRef.current
      if (!el) return

      let cancelled = false
      let teardown: (() => void) | undefined

      ;(async () => {
        const [fabricModule, utils] = await Promise.all([
          import('fabric'),
          import('@/lib/fabricUtils'),
        ])

        if (cancelled) return

        utilsRef.current = utils

        const fabric = (fabricModule as any).fabric ?? fabricModule
        ;(window as any).__fabricLib = { fabric }

        const canvas = new fabric.Canvas(el, {
          width: format.pxWidth,
          height: format.pxHeight,
          backgroundColor: '#f5f0e8',
          preserveObjectStacking: true,
          stopContextMenu: true,
          fireRightClick: true,
        })
        fabricRef.current = canvas
        ;(canvasElRef.current as any).__fabricInstance = canvas

        // ── Selection events ──────────────────────────────────────────
        const emitProps = () => {
          const obj = canvas.getActiveObject()
          if (!obj) { onSelectionChange(null); return }
          lastSelectedRef.current = obj
          onSelectionChange({
            opacity: Math.round((obj.opacity ?? 1) * 100),
            angle: Math.round(obj.angle ?? 0),
            scaleX: Math.round((obj.scaleX ?? 1) * 100),
            scaleY: Math.round((obj.scaleY ?? 1) * 100),
            flipX: obj.flipX ?? false,
            flipY: obj.flipY ?? false,
            blendMode: (obj as any).globalCompositeOperation ?? '',
            filter: '',
          })
        }

        canvas.on('selection:created', emitProps)
        canvas.on('selection:updated', emitProps)
        canvas.on('selection:cleared', () => onSelectionChange(null))
        canvas.on('object:modified', () => { pushHistory(); onCanvasChange() })
        canvas.on('object:added', updateEmpty)
        canvas.on('object:removed', updateEmpty)
        canvas.on('path:created', () => { pushHistory(); onCanvasChange() })

        // ── mouse:down ────────────────────────────────────────────────
        canvas.on('mouse:down', (e: any) => {
          const mode = toolModeRef.current
          const pointer = canvas.getPointer(e.e)

          if (mode === 'crop-rect') {
            cropRef.current.active = true
            cropRef.current.start = pointer
            const rect = new fabric.Rect({
              left: pointer.x, top: pointer.y,
              width: 0, height: 0,
              fill: 'rgba(200,75,47,0.15)',
              stroke: '#c84b2f',
              strokeWidth: 1.5,
              strokeDashArray: [6, 4],
              selectable: false, evented: false,
            })
            cropRef.current.rect = rect
            canvas.add(rect)
          }

          if (mode === 'crop-circle') {
            circleRef.current.active = true
            circleRef.current.start = pointer

            const targetForPreview = canvas.getObjects()
              .filter((o: any) => o.type === 'image')
              .reverse()
              .find((o: any) => {
                const b = o.getBoundingRect()
                return (
                  pointer.x >= b.left &&
                  pointer.x <= b.left + b.width &&
                  pointer.y >= b.top &&
                  pointer.y <= b.top + b.height
                )
              })

            circleRef.current.targetImg = targetForPreview ?? null

            const preview = new fabric.Circle({
              left: pointer.x, top: pointer.y,
              radius: 0,
              fill: 'rgba(200,75,47,0.12)',
              stroke: '#c84b2f',
              strokeWidth: 2,
              selectable: false, evented: false,
              originX: 'center', originY: 'center',
            })
            circleRef.current.preview = preview
            canvas.add(preview)
          }

          if (mode === 'crop-lasso' && !lassoRef.current.active) {
            lassoRef.current.active = true
            lassoRef.current.points = [pointer]
            lassoRef.current.line = null
          }

          if (mode === 'slice') {
            sliceRef.current.active = true
            sliceRef.current.start = pointer
            sliceRef.current.points = [pointer]
            sliceRef.current.guide = null
          }

          if (mode === 'tape') {
            pushHistory()
            utils.addTape(canvas, pointer.x - 45, pointer.y - 13)
            onCanvasChange()
          }

          if (mode === 'text') {
            const text = new fabric.IText('Double-click to edit', {
              left: pointer.x,
              top: pointer.y,
              fontSize: 20,
              fill: '#1a1208',
              fontFamily: textFontRef.current,
              selectable: true,
              evented: true,
            })
            canvas.add(text)
            canvas.setActiveObject(text)
            canvas.renderAll()
            pushHistory()
            onCanvasChange()
          }
        })

        // ── mouse:move ────────────────────────────────────────────────
        canvas.on('mouse:move', (e: any) => {
          const mode = toolModeRef.current
          const pointer = canvas.getPointer(e.e)

          if (mode === 'crop-rect' && cropRef.current.active && cropRef.current.rect && cropRef.current.start) {
            const { start, rect } = cropRef.current
            rect.set({
              width: Math.abs(pointer.x - start.x),
              height: Math.abs(pointer.y - start.y),
              left: Math.min(pointer.x, start.x),
              top: Math.min(pointer.y, start.y),
            })
            canvas.renderAll()
          }

          if (mode === 'crop-circle' && circleRef.current.active && circleRef.current.preview && circleRef.current.start) {
            const { start, preview } = circleRef.current
            const dx = pointer.x - start.x
            const dy = pointer.y - start.y
            const radius = Math.sqrt(dx * dx + dy * dy) / 2
            const cx = (start.x + pointer.x) / 2
            const cy = (start.y + pointer.y) / 2
            preview.set({ left: cx, top: cy, radius })
            canvas.renderAll()
          }

          if (mode === 'crop-lasso' && lassoRef.current.active) {
            lassoRef.current.points.push(pointer)
            const lc = lassoCanvasRef.current
            if (lc) {
              const ctx = lc.getContext('2d')!
              ctx.clearRect(0, 0, lc.width, lc.height)
              ctx.beginPath()
              ctx.setLineDash([5, 3])
              ctx.strokeStyle = '#c84b2f'
              ctx.lineWidth = 1.5
              ctx.fillStyle = 'rgba(200,75,47,0.1)'
              lassoRef.current.points.forEach((p, i) => {
                i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
              })
              ctx.closePath()
              ctx.stroke()
              ctx.fill()
            }
          }

          if (mode === 'slice' && sliceRef.current.active) {
            sliceRef.current.points.push(pointer)
            const lc = lassoCanvasRef.current
            if (lc) {
              const ctx = lc.getContext('2d')!
              ctx.clearRect(0, 0, lc.width, lc.height)
              ctx.beginPath()
              ctx.setLineDash([4, 2])
              ctx.strokeStyle = '#1a1208'
              ctx.lineWidth = 2
              ctx.fillStyle = 'rgba(26,18,8,0.08)'
              sliceRef.current.points.forEach((p, i) => {
                i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
              })
              ctx.closePath()
              ctx.stroke()
              ctx.fill()
            }
          }
        })

        // ── mouse:up ──────────────────────────────────────────────────
        canvas.on('mouse:up', (e: any) => {
          const mode = toolModeRef.current
          const pointer = canvas.getPointer(e.e)

          if (mode === 'crop-rect' && cropRef.current.active) {
            const { start, rect } = cropRef.current
            if (rect) canvas.remove(rect)
            cropRef.current = { active: false, start: null, rect: null }

            if (start) {
              const cropRect = {
                left: Math.min(pointer.x, start.x),
                top: Math.min(pointer.y, start.y),
                width: Math.abs(pointer.x - start.x),
                height: Math.abs(pointer.y - start.y),
              }

              const target = canvas.getObjects()
                .filter((o: any) => o.type === 'image')
                .reverse()
                .find((o: any) => {
                  const b = o.getBoundingRect()
                  return (
                    pointer.x >= b.left &&
                    pointer.x <= b.left + b.width &&
                    pointer.y >= b.top &&
                    pointer.y <= b.top + b.height
                  )
                })

              if (target && cropRect.width > 5 && cropRect.height > 5) {
                pushHistory()
                utils.applyRectCrop(canvas, target, cropRect)
                onCanvasChange()
              }
            }
          }

          if (mode === 'crop-circle' && circleRef.current.active) {
            const { start, preview, targetImg } = circleRef.current
            if (preview) canvas.remove(preview)
            circleRef.current = { active: false, start: null, preview: null, targetImg: null, previewClone: null }

            if (start && targetImg) {
              const dx = pointer.x - start.x
              const dy = pointer.y - start.y
              const radius = Math.sqrt(dx * dx + dy * dy) / 2
              const center = {
                x: (start.x + pointer.x) / 2,
                y: (start.y + pointer.y) / 2,
              }

              if (radius > 5) {
                pushHistory()
                const originalToRemove = targetImg
                utils.extractCircle(canvas, targetImg, center, radius, () => {
                  canvas.remove(originalToRemove)
                  canvas.renderAll()
                })
                onCanvasChange()
              }
            }
          }

          if (mode === 'crop-lasso' && lassoRef.current.active) {
            const lc = lassoCanvasRef.current
            if (lc) lc.getContext('2d')!.clearRect(0, 0, lc.width, lc.height)
            const { points } = lassoRef.current
            lassoRef.current = { active: false, points: [], line: null }

            const target = canvas.getObjects()
              .filter((o: any) => o.type === 'image')
              .reverse()
              .find((o: any) => {
                const b = o.getBoundingRect()
                return (
                  pointer.x >= b.left &&
                  pointer.x <= b.left + b.width &&
                  pointer.y >= b.top &&
                  pointer.y <= b.top + b.height
                )
              })

            if (target && points.length >= 3) {
              pushHistory()
              const originalToRemove = target
              utils.extractPieceAsPixels(canvas, target, points, () => {
                canvas.remove(originalToRemove)
                canvas.renderAll()
              })
              onCanvasChange()
            }
          }

          if (mode === 'slice' && sliceRef.current.active) {
            const lc = lassoCanvasRef.current
            if (lc) lc.getContext('2d')!.clearRect(0, 0, lc.width, lc.height)
            const { points } = sliceRef.current
            sliceRef.current = { active: false, start: null, guide: null, points: [] }

            const target = canvas.getActiveObject() ?? lastSelectedRef.current
            if (target && target.type === 'image' && points.length >= 3) {
              pushHistory()
              const originalToRemove = target
              utils.extractPieceAsPixels(canvas, target, points, () => {
                canvas.remove(originalToRemove)
                canvas.renderAll()
              })
              onCanvasChange()
            }
          }
        })

        // ── Keyboard shortcuts ────────────────────────────────────────
        const handleKey = (e: KeyboardEvent) => {
          if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement?.tagName !== 'INPUT') {
            const active = canvas.getActiveObject()
            if (active) {
              canvas.remove(active)
              pushHistory()
              onCanvasChange()
            }
          }
        }
        window.addEventListener('keydown', handleKey)

        // ── Drag and drop ─────────────────────────────────────────────
        const upperCanvas = canvas.upperCanvasEl
        upperCanvas.setAttribute('draggable', 'false')

        const onDragOver = (e: DragEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }

        const onDrop = (e: DragEvent) => {
          e.preventDefault()
          e.stopPropagation()
          const url = e.dataTransfer?.getData('application/pasteup-image-url')
          if (!url) return
          const fc = (canvasElRef.current as any).__fabricInstance
          if (!fc) return
          const isDataUrl = url.startsWith('data:')
          const proxied = isDataUrl ? url : `/api/image-proxy?url=${encodeURIComponent(url)}`
          fabric.Image.fromURL(
            proxied,
            (img: any) => {
              if (!img) return
              const scale = Math.min(
                (fc.width * 0.6) / img.width,
                (fc.height * 0.6) / img.height,
                1
              )
              img.set({
                left: fc.width / 2 - (img.width * scale) / 2,
                top: fc.height / 2 - (img.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                cornerStyle: 'circle',
                cornerColor: '#c84b2f',
                cornerStrokeColor: '#fff',
                borderColor: '#c84b2f',
                transparentCorners: false,
              })
              fc.add(img)
              fc.setActiveObject(img)
              fc.renderAll()
              pushHistory()
              onCanvasChange()
            },
            { crossOrigin: 'anonymous' }
          )
        }

        upperCanvas.addEventListener('dragover', onDragOver, true)
        upperCanvas.addEventListener('drop', onDrop, true)

        teardown = () => {
          canvas.dispose()
          window.removeEventListener('keydown', handleKey)
          upperCanvas.removeEventListener('dragover', onDragOver, true)
          upperCanvas.removeEventListener('drop', onDrop, true)
          fabricRef.current = null
          utilsRef.current = null
        }
      })()

      return () => {
        cancelled = true
        teardown?.()
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [format.pxWidth, format.pxHeight])

    // ── Imperative API ────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      loadImage: async (url: string) => {
        const canvas = fabricRef.current
        const utils = utilsRef.current
        if (!canvas || !utils) return
        pushHistory()
        await utils.loadImageFromUrl(canvas, url)
        onCanvasChange()
      },

      deleteSelected: () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const obj = canvas.getActiveObject()
        if (obj) { pushHistory(); canvas.remove(obj); onCanvasChange() }
      },

      undo: () => {
        const canvas = fabricRef.current
        if (!canvas || historyRef.current.length === 0) return
        const prev = historyRef.current.pop()!
        canvas.loadFromJSON(prev, () => canvas.renderAll())
        onCanvasChange()
      },

      serialize: () => {
        const canvas = fabricRef.current
        const utils = utilsRef.current
        return (canvas && utils) ? utils.serializeCanvas(canvas) : ''
      },

      loadFromJSON: async (json: string) => {
        const canvas = fabricRef.current
        const utils = utilsRef.current
        if (!canvas || !utils) return
        await utils.loadCanvasFromJSON(canvas, json)
      },

      exportImage: (multiplier = 1) => {
        const canvas = fabricRef.current
        const utils = utilsRef.current
        return (canvas && utils) ? utils.exportCanvas(canvas, multiplier) : ''
      },

      getActiveObjectProps: () => {
        const obj = fabricRef.current?.getActiveObject()
        if (!obj) return null
        return {
          opacity: Math.round((obj.opacity ?? 1) * 100),
          angle: Math.round(obj.angle ?? 0),
          scaleX: Math.round((obj.scaleX ?? 1) * 100),
          scaleY: Math.round((obj.scaleY ?? 1) * 100),
          flipX: obj.flipX ?? false,
          flipY: obj.flipY ?? false,
          blendMode: (obj as any).globalCompositeOperation ?? '',
          filter: '',
        }
      },

      updateActiveObject: (props: Partial<ObjectProperties>) => {
        const canvas = fabricRef.current
        const obj = canvas?.getActiveObject()
        if (!canvas || !obj) return
        if (props.opacity !== undefined) obj.set('opacity', props.opacity / 100)
        if (props.angle !== undefined) obj.rotate(props.angle)
        if (props.scaleX !== undefined) obj.set('scaleX', props.scaleX / 100)
        if (props.scaleY !== undefined) obj.set('scaleY', props.scaleY / 100)
        if (props.flipX !== undefined) obj.set('flipX', props.flipX)
        if (props.flipY !== undefined) obj.set('flipY', props.flipY)
        if (props.blendMode !== undefined) {
          ;(obj as any).globalCompositeOperation = props.blendMode
        }
        canvas.renderAll()
        onCanvasChange()
      },

      removeClipFromSelected: () => {
        const canvas = fabricRef.current
        const obj = canvas?.getActiveObject()
        if (canvas && obj) {
          ;(obj as any).clipPath = undefined
          canvas.renderAll()
          onCanvasChange()
        }
      },

      bringForward: () => {
        const canvas = fabricRef.current
        const obj = canvas?.getActiveObject()
        if (canvas && obj) { canvas.bringForward(obj); canvas.renderAll() }
      },

      sendBackward: () => {
        const canvas = fabricRef.current
        const obj = canvas?.getActiveObject()
        if (canvas && obj) { canvas.sendBackwards(obj); canvas.renderAll() }
      },

      bringToFront: () => {
        const canvas = fabricRef.current
        const obj = canvas?.getActiveObject()
        if (canvas && obj) { canvas.bringToFront(obj); canvas.renderAll() }
      },

      sendToBack: () => {
        const canvas = fabricRef.current
        const obj = canvas?.getActiveObject()
        if (canvas && obj) { canvas.sendToBack(obj); canvas.renderAll() }
      },
    }))

    // Derive fold-line positions and panel label centers for formats that
    // define panels (e.g. the cassette J-card). Drawn as a non-interactive
    // overlay, so these guides never end up in the export or saved preview.
    const pxPerInch = format.pxHeight / format.height
    const panelGuides = format.panels
      ? (() => {
          let y = 0
          const labels: { label: string; top: number }[] = []
          const folds: number[] = []
          format.panels.forEach((p, i) => {
            labels.push({ label: p.label, top: y })
            y += p.height * pxPerInch
            if (i < format.panels!.length - 1) folds.push(y)
          })
          return { labels, folds }
        })()
      : null

    return (
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full bg-[#c8c4bc]"
        style={{ minHeight: format.pxHeight + 80 }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] tracking-widest uppercase text-black/30 select-none whitespace-nowrap">
          {format.label} · {format.width}" × {format.height}"
        </div>

        <div
          className="relative"
          style={{
            boxShadow: '0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <canvas ref={canvasElRef} />

          <canvas
            ref={lassoCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              width: format.pxWidth,
              height: format.pxHeight,
            }}
            width={format.pxWidth}
            height={format.pxHeight}
          />

          {panelGuides && (
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={format.pxWidth}
              height={format.pxHeight}
              viewBox={`0 0 ${format.pxWidth} ${format.pxHeight}`}
              style={{ width: format.pxWidth, height: format.pxHeight }}
            >
              {/* trim border */}
              <rect
                x={0.75}
                y={0.75}
                width={format.pxWidth - 1.5}
                height={format.pxHeight - 1.5}
                fill="none"
                stroke="rgba(26,18,8,0.25)"
                strokeWidth={1.5}
              />
              {/* fold lines (horizontal — panels stack vertically) */}
              {panelGuides.folds.map((fy, i) => (
                <line
                  key={`fold-${i}`}
                  x1={0}
                  y1={fy}
                  x2={format.pxWidth}
                  y2={fy}
                  stroke="rgba(26,18,8,0.45)"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                />
              ))}
              {/* panel labels (FRONT highlighted in the accent color) */}
              {panelGuides.labels.map((l, i) => (
                <text
                  key={`label-${i}`}
                  x={format.pxWidth / 2}
                  y={l.top + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  letterSpacing={1.5}
                  fill={l.label.toLowerCase() === 'front' ? 'rgba(200,75,47,0.9)' : 'rgba(26,18,8,0.55)'}
                  stroke="rgba(245,240,232,0.9)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {l.label.toUpperCase()}
                </text>
              ))}
            </svg>
          )}

          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-opacity duration-300"
            style={{ opacity: isEmpty ? 0.35 : 0 }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="4" width="32" height="32" rx="2" stroke="#1a1208" strokeWidth="1.5" strokeDasharray="4 3"/>
              <path d="M13 27L19 19L23 23L27 17" stroke="#1a1208" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="15" r="2.5" stroke="#1a1208" strokeWidth="1.5"/>
            </svg>
            <p className="mt-3 text-sm text-[#1a1208]">Search and drag images to begin</p>
          </div>
        </div>
      </div>
    )
  }
)