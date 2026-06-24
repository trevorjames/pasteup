'use client'
// src/app/c/[id]/page.tsx
// Public view of a published collage.
// Accessible to anyone with the link — no auth required.
 
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Scissors, Download, Loader2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Collage } from '@/lib/supabase'
import { CANVAS_FORMATS, DEFAULT_FORMAT } from '@/types'
 
export default function PublicCollagePage() {
  const params = useParams()
  const id = params?.id as string
  const [collage, setCollage] = useState<Collage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
 
  useEffect(() => {
    if (!id) return
 
    supabase
      .from('collages')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setCollage(data)
        }
        setLoading(false)
      })
  }, [id])
 
  const handleDownload = () => {
    if (!collage?.preview_url) return
    const a = document.createElement('a')
    a.href = collage.preview_url
    a.download = `${collage.name.replace(/\s+/g, '-').toLowerCase()}.jpg`
    a.click()
  }
 
  // Resolve the collage's format so the preview frame matches its real
  // proportions (works for any current or future format, including cassette).
  const fmt = collage
    ? (CANVAS_FORMATS.find(f => f.id === collage.format_id) ?? DEFAULT_FORMAT)
    : DEFAULT_FORMAT
 
  return (
    <div className="min-h-screen bg-[#ede8df] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-12 px-6 bg-white border-b border-zinc-200">
        <a href="/editor" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1a1208] rounded flex items-center justify-center">
            <Scissors size={13} className="text-[#f5f0e8]" />
          </div>
          <span className="font-serif text-[15px] font-medium tracking-wide text-zinc-900">
            Pasteup
          </span>
        </a>
        <a
          href="/editor"
          className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#1a1208] text-[#f5f0e8] hover:opacity-85 transition-opacity"
        >
          Make your own
        </a>
      </header>
 
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Loading…</span>
          </div>
        )}
 
        {/* Not found / private */}
        {!loading && notFound && (
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock size={24} className="text-zinc-300" />
            </div>
            <h1 className="text-[18px] font-medium text-zinc-800 mb-2">
              Collage not found
            </h1>
            <p className="text-[13px] text-zinc-500 mb-6">
              This collage may be private or the link may be incorrect.
            </p>
            <a
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium bg-[#1a1208] text-[#f5f0e8] rounded-full hover:opacity-85 transition-opacity"
            >
              Create your own collage
            </a>
          </div>
        )}
 
        {/* Collage view */}
        {!loading && collage && (
          <div className="w-full max-w-2xl">
            {/* Collage name */}
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h1 className="font-serif text-[22px] font-medium text-zinc-900">
                  {collage.name}
                </h1>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Made with Pasteup · {new Date(collage.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
 
              {/* Download button — only if creator enabled it */}
              {(collage as any).allow_download && collage.preview_url && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-zinc-300 rounded-full text-zinc-600 hover:border-zinc-500 hover:text-zinc-800 transition-all"
                >
                  <Download size={12} />
                  Download
                </button>
              )}
            </div>
 
            {/* Collage image */}
            <div
              className="w-full rounded-xl overflow-hidden shadow-xl bg-[#f5f0e8]"
              style={{ aspectRatio: `${fmt.width} / ${fmt.height}` }}
            >
              {collage.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={collage.preview_url}
                  alt={collage.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Scissors size={32} className="text-zinc-300" />
                </div>
              )}
            </div>
 
            {/* Attribution */}
            <div className="mt-4 text-center">
              <p className="text-[11px] text-zinc-400">
                Made with{' '}
                <a href="/editor" className="text-[#c84b2f] hover:underline">
                  Pasteup
                </a>
                {' '}— collage art from public domain imagery
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}