'use client'
// src/app/editor/page.tsx

import { useRef, useState, useCallback } from 'react'
import { Scissors, Save, ChevronDown } from 'lucide-react'
import { CollageCanvas, type CollageCanvasHandle } from '@/components/canvas/CollageCanvas'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { ToolSettingsBar } from '@/components/canvas/ToolSettingsBar'
import { ImageLibraryPanel } from '@/components/panels/ImageLibraryPanel'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { CANVAS_FORMATS, DEFAULT_FORMAT } from '@/types'
import type { CanvasFormat, ToolMode, ObjectProperties } from '@/types'

export default function EditorPage() {
  const canvasRef = useRef<CollageCanvasHandle>(null)
  const [format, setFormat] = useState<CanvasFormat>(DEFAULT_FORMAT)
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [selectedProps, setSelectedProps] = useState<ObjectProperties | null>(null)
  const [saved, setSaved] = useState(true)
  const [formatMenuOpen, setFormatMenuOpen] = useState(false)
  const [collageName, setCollageName] = useState('Untitled collage')
  const [brushSize, setBrushSize] = useState(20)
  const [brushColor, setBrushColor] = useState('#1a1208')
  const [pencilSize, setPencilSize] = useState(2)
  const [pencilColor, setPencilColor] = useState('#1a1208')
  const [textFont, setTextFont] = useState('Georgia, serif')

  // ── Image loading ─────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((url: string) => {
    canvasRef.current?.loadImage(url)
    setSaved(false)
  }, [])

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const url = e.dataTransfer.getData('application/pasteup-image-url')
    if (url) handleImageSelect(url)
  }, [handleImageSelect])

  const handleCanvasChange = useCallback(() => setSaved(false), [])

  // ── Properties update ─────────────────────────────────────────────────────
  const handlePropsChange = useCallback((props: Partial<ObjectProperties>) => {
    canvasRef.current?.updateActiveObject(props)
    setSelectedProps(prev => prev ? { ...prev, ...props } : null)
  }, [])

  // ── Layer controls ────────────────────────────────────────────────────────
  const handleBringForward = useCallback(() => canvasRef.current?.bringForward(), [])
  const handleSendBackward = useCallback(() => canvasRef.current?.sendBackward(), [])
  const handleBringToFront = useCallback(() => canvasRef.current?.bringToFront(), [])
  const handleSendToBack = useCallback(() => canvasRef.current?.sendToBack(), [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const json = canvasRef.current?.serialize()
    if (!json) return
    // TODO: POST to /api/collages — Supabase integration Phase 3
    console.log('Save stub — Supabase coming in Phase 3')
    setSaved(true)
  }, [])

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportPNG = useCallback(() => {
    const dataUrl = canvasRef.current?.exportImage(3)
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${collageName.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }, [collageName])

  const handleExportPDF = useCallback(() => {
    alert('Print PDF export coming soon!')
  }, [])

  const handlePublish = useCallback(() => {
    alert('Publishing coming soon!')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1a1208] rounded flex items-center justify-center">
            <Scissors size={13} className="text-[#f5f0e8]" />
          </div>
          <span className="font-serif text-[15px] font-medium tracking-wide text-zinc-900 dark:text-zinc-100">
            Pasteup
          </span>
        </div>

        <input
          type="text"
          value={collageName}
          onChange={e => setCollageName(e.target.value)}
          className="text-[13px] text-zinc-600 dark:text-zinc-300 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-400 focus:outline-none px-1 py-0.5 text-center w-56 transition-colors"
        />

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setFormatMenuOpen(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 transition-all"
            >
              {format.label}
              <ChevronDown size={11} />
            </button>
            {formatMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 z-50 w-32">
                {CANVAS_FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setFormat(f); setFormatMenuOpen(false) }}
                    className={[
                      'w-full text-left px-3 py-1.5 text-[11px] transition-colors',
                      f.id === format.id
                        ? 'text-[#c84b2f] font-medium'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                    ].join(' ')}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
          >
            <Save size={12} />
            {saved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handlePublish}
            className="text-[11px] font-medium px-4 py-1.5 rounded-full bg-[#c84b2f] text-white hover:opacity-85 transition-opacity"
          >
            Publish
          </button>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 overflow-hidden"
        onDragOver={e => e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        <ImageLibraryPanel onImageSelect={handleImageSelect} />

        <main className="flex-1 relative overflow-auto">
          <CollageCanvas
            ref={canvasRef}
            format={format}
            toolMode={toolMode}
            onSelectionChange={setSelectedProps}
            onCanvasChange={handleCanvasChange}
            brushSize={brushSize}
            brushColor={brushColor}
            pencilSize={pencilSize}
            pencilColor={pencilColor}
            textFont={textFont}
          />
          <ToolSettingsBar
            toolMode={toolMode}
            brushSize={brushSize}
            brushColor={brushColor}
            pencilSize={pencilSize}
            pencilColor={pencilColor}
            textFont={textFont}
            onBrushSizeChange={setBrushSize}
            onBrushColorChange={setBrushColor}
            onPencilSizeChange={setPencilSize}
            onPencilColorChange={setPencilColor}
            onTextFontChange={setTextFont}
          />
          <CanvasToolbar
            activeTool={toolMode}
            onToolChange={setToolMode}
            onUndo={() => canvasRef.current?.undo()}
            onDelete={() => canvasRef.current?.deleteSelected()}
          />
        </main>

        <PropertiesPanel
          properties={selectedProps}
          onChange={handlePropsChange}
          onRemoveClip={() => canvasRef.current?.removeClipFromSelected()}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          onPublish={handlePublish}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      </div>
    </div>
  )
}