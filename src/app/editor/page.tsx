'use client'
// src/app/editor/page.tsx

import { useRef, useState, useCallback, useEffect } from 'react'
import { Scissors, Save, ChevronDown, LogIn, LogOut, User } from 'lucide-react'
import { CollageCanvas, type CollageCanvasHandle } from '@/components/canvas/CollageCanvas'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { ToolSettingsBar } from '@/components/canvas/ToolSettingsBar'
import { ImageLibraryPanel } from '@/components/panels/ImageLibraryPanel'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { AuthModal } from '@/components/auth/AuthModal'
import { PublishModal } from '@/components/publish/PublishModal'
import { supabase } from '@/lib/supabase'
import { saveCollage, loadCollage } from '@/lib/collages'
import { CANVAS_FORMATS, DEFAULT_FORMAT } from '@/types'
import type { CanvasFormat, ToolMode, ObjectProperties } from '@/types'

export default function EditorPage() {
  const canvasRef = useRef<CollageCanvasHandle>(null)
  const [format, setFormat] = useState<CanvasFormat>(DEFAULT_FORMAT)
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [selectedProps, setSelectedProps] = useState<ObjectProperties | null>(null)
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formatMenuOpen, setFormatMenuOpen] = useState(false)
  const [collageName, setCollageName] = useState('Untitled collage')
  const [collageId, setCollageId] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(20)
  const [brushColor, setBrushColor] = useState('#1a1208')
  const [pencilSize, setPencilSize] = useState(2)
  const [pencilColor, setPencilColor] = useState('#1a1208')
  const [textFont, setTextFont] = useState('Georgia, serif')

  // Auth state
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Publish state
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [currentCollage, setCurrentCollage] = useState<any>(null)

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load collage from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id) return

    loadCollage(id).then(collage => {
      setCollageId(collage.id)
      setCollageName(collage.name)
      const fmt = CANVAS_FORMATS.find(f => f.id === collage.format_id) ?? DEFAULT_FORMAT
      setFormat(fmt)

      // Wait for canvas to initialize then load the JSON
      setTimeout(() => {
        const json = typeof collage.canvas_json === 'string'
          ? collage.canvas_json
          : JSON.stringify(collage.canvas_json)
        canvasRef.current?.loadFromJSON(json)
        setSaved(true)
      }, 500)
    }).catch(err => {
      console.error('Failed to load collage:', err)
    })
  }, [])

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

  // ── Properties ────────────────────────────────────────────────────────────
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
    if (!user) {
      setAuthMode('signin')
      setShowAuthModal(true)
      return
    }

    const json = canvasRef.current?.serialize()
    if (!json) return

    setSaving(true)
    try {
  // Generate preview thumbnail from canvas
const canvasEl = document.querySelector('.lower-canvas') as HTMLCanvasElement
let previewUrl: string | undefined
if (canvasEl) {
  const offscreen = document.createElement('canvas')
  const scale = 1200 / Math.max(canvasEl.width, canvasEl.height)
  offscreen.width = Math.round(canvasEl.width * scale)
  offscreen.height = Math.round(canvasEl.height * scale)
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(canvasEl, 0, 0, offscreen.width, offscreen.height)
  previewUrl = offscreen.toDataURL('image/jpeg', 0.92)
}

      const result = await saveCollage({
        id: collageId ?? undefined,
        name: collageName,
        formatId: format.id,
        canvasJson: json,
        previewUrl,
      })
      setCollageId(result.id)
      setCurrentCollage(result)
      setSaved(true)
    } catch (err) {
      console.error('Save failed:', err)
      alert('Save failed — please try again.')
    } finally {
      setSaving(false)
    }
  }, [user, collageName, format.id, collageId])

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUserMenuOpen(false)
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false)
    setTimeout(() => handleSave(), 300)
  }, [handleSave])

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

  const handlePublish = useCallback(async () => {
    if (!user) {
      setAuthMode('signin')
      setShowAuthModal(true)
      return
    }
    // Save first to make sure we have a collageId
    await handleSave()
    setShowPublishModal(true)
  }, [user, handleSave])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 overflow-hidden">

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Publish modal */}
      {showPublishModal && currentCollage && (
        <PublishModal
          collage={currentCollage}
          onClose={() => setShowPublishModal(false)}
          onUpdate={(updated) => setCurrentCollage(updated)}
        />
      )}

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
          {/* Format picker */}
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

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all disabled:opacity-50"
          >
            <Save size={12} />
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>

          {/* Auth */}
          {!user ? (
            <button
              onClick={() => { setAuthMode('signin'); setShowAuthModal(true) }}
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 transition-all"
            >
              <LogIn size={12} />
              Sign in
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                <User size={12} />
                {user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Account'}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 z-50 w-40">
                  <a
                    href="/collages"
                    className="block px-3 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    My collages
                  </a>
                  <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={11} /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Publish CTA */}
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