'use client'
// src/app/collages/page.tsx
// Gallery of the user's saved collages.

import { useEffect, useState } from 'react'
import { Scissors, Plus, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { listCollages, deleteCollage } from '@/lib/collages'
import type { Collage } from '@/lib/supabase'

export default function CollagesPage() {
  const [user, setUser] = useState<any>(null)
  const [collages, setCollages] = useState<Collage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        listCollages().then(c => {
          setCollages(c)
          setLoading(false)
        }).catch(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collage? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteCollage(id)
      setCollages(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Delete failed — please try again.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between h-12 px-6 border-b border-zinc-200 dark:border-zinc-800">
        <a href="/editor" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1a1208] rounded flex items-center justify-center">
            <Scissors size={13} className="text-[#f5f0e8]" />
          </div>
          <span className="font-serif text-[15px] font-medium tracking-wide text-zinc-900 dark:text-zinc-100">
            Pasteup
          </span>
        </a>
        <a
          href="/editor"
          className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#1a1208] text-[#f5f0e8] hover:opacity-85 transition-opacity"
        >
          <Plus size={12} /> New collage
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-serif text-[26px] font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          My Collages
        </h1>
        <p className="text-[13px] text-zinc-500 mb-8">
          {user ? `Signed in as ${user.email}` : 'Not signed in'}
        </p>

        {/* Not signed in */}
        {!user && !loading && (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">Sign in to see your saved collages.</p>
            <a
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium bg-[#1a1208] text-[#f5f0e8] rounded-full hover:opacity-85 transition-opacity"
            >
              Go to editor
            </a>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 py-20 justify-center">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Loading your collages…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && user && collages.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scissors size={24} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 mb-1">No collages yet</p>
            <p className="text-[12px] text-zinc-400 mb-6">Create your first collage in the editor</p>
            <a
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium bg-[#1a1208] text-[#f5f0e8] rounded-full hover:opacity-85 transition-opacity"
            >
              <Plus size={12} /> New collage
            </a>
          </div>
        )}

        {/* Collage grid */}
        {!loading && collages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* New collage card */}
            <a
              href="/editor"
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-[#c84b2f] hover:text-[#c84b2f] transition-all group"
            >
              <Plus size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">New collage</span>
            </a>

            {collages.map(collage => (
              <div
                key={collage.id}
                className="group relative aspect-[3/4] rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-[#f5f0e8]"
              >
                {/* Preview */}
                {collage.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collage.preview_url}
                    alt={collage.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scissors size={24} className="text-zinc-300" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a
                    href={`/editor?id=${collage.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-white text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    <ExternalLink size={11} /> Open
                  </a>
                  <button
                    onClick={() => handleDelete(collage.id)}
                    disabled={deleting === collage.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting === collage.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />
                    }
                    Delete
                  </button>
                </div>

                {/* Name label */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-[11px] font-medium truncate">{collage.name}</p>
                  <p className="text-white/60 text-[9px]">
                    {new Date(collage.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}