'use client'
// src/components/publish/PublishModal.tsx
// Shown when the user clicks Publish. Lets them control
// published state, download permission, and gallery visibility.
 
import { useState, useEffect } from 'react'
import { X, Globe, Copy, Check, Loader2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Collage } from '@/lib/supabase'
 
type Props = {
  collage: Collage
  onClose: () => void
  onUpdate: (updated: Collage) => void
}
 
export function PublishModal({ collage, onClose, onUpdate }: Props) {
  const [published, setPublished] = useState(collage.published)
  const [allowDownload, setAllowDownload] = useState((collage as any).allow_download ?? false)
  const [showInGallery, setShowInGallery] = useState((collage as any).show_in_gallery ?? false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
 
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${collage.id}`
 
  const handleSave = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('collages')
        .update({
          published,
          allow_download: allowDownload,
          show_in_gallery: showInGallery,
        })
        .eq('id', collage.id)
        .select()
        .single()
 
      if (error) throw error
      onUpdate(data)
    } catch (err) {
      console.error('Publish update failed:', err)
      alert('Failed to update — please try again.')
    } finally {
      setSaving(false)
    }
  }
 
  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
 
  // Auto-save when toggles change
  useEffect(() => {
    handleSave()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [published, allowDownload, showInGallery])
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
 
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X size={18} />
        </button>
 
        <h2 className="text-[17px] font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          Publish collage
        </h2>
        <p className="text-[12px] text-zinc-500 mb-6">
          Control who can see and download your work.
        </p>
 
        {/* Published toggle */}
        <div className="space-y-3 mb-6">
          <ToggleRow
            icon={<Globe size={15} />}
            label="Public link"
            description="Anyone with the link can view this collage"
            value={published}
            onChange={setPublished}
          />
 
          <ToggleRow
            icon={<span className="text-[13px]">⬇</span>}
            label="Allow download"
            description="Viewers can download the full-resolution image"
            value={allowDownload}
            onChange={setAllowDownload}
            disabled={!published}
          />
 
          <ToggleRow
            icon={<span className="text-[13px]">🖼</span>}
            label="Show in gallery"
            description="Include this in Pasteup's public discovery gallery"
            value={showInGallery}
            onChange={setShowInGallery}
            disabled={!published}
          />
        </div>
 
        {/* Public URL */}
        {published && (
          <div className="mb-5">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Public link
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <span className="flex-1 text-[11px] text-zinc-600 dark:text-zinc-300 truncate font-mono">
                {publicUrl}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 transition-colors shrink-0"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
 
        {!published && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 mb-5">
            <Lock size={13} className="text-zinc-400 shrink-0" />
            <p className="text-[11px] text-zinc-500">
              This collage is private. Toggle "Public link" to share it.
            </p>
          </div>
        )}
 
        <div className="flex items-center justify-between">
          {saving && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Loader2 size={12} className="animate-spin" />
              Saving…
            </div>
          )}
          {!saving && <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium bg-[#1a1208] text-[#f5f0e8] rounded-lg hover:opacity-85 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
 
function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
  disabled = false,
}: {
  icon: React.ReactNode
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={[
      'flex items-start gap-3 p-3 rounded-xl border transition-all',
      disabled ? 'opacity-40 cursor-not-allowed border-zinc-100 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-700',
      value && !disabled ? 'bg-[#c84b2f]/5 border-[#c84b2f]/30' : '',
    ].join(' ')}>
      <div className="mt-0.5 text-zinc-500 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
        <p className="text-[10px] text-zinc-500 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={[
          'relative w-9 h-5 rounded-full transition-all shrink-0 mt-0.5',
          value && !disabled ? 'bg-[#c84b2f]' : 'bg-zinc-200 dark:bg-zinc-700',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
        aria-label={`Toggle ${label}`}
      >
        <span className={[
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
          value ? 'left-4' : 'left-0.5',
        ].join(' ')} />
      </button>
    </div>
  )
}