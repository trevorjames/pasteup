'use client'
// src/components/panels/ImageLibraryPanel.tsx
// Searches NYPL (and later other open-source collections),
// displays thumbnails, and lets users drag images to the canvas.

import { useState, useCallback, useRef } from 'react'
import { Search, Loader2, ImageOff, BookOpen, Globe } from 'lucide-react'
import { searchNYPL } from '@/lib/nypl'
import type { NYPLImage } from '@/types'

type Source = 'nypl' | 'smithsonian' | 'europeana'

const SOURCES: { id: Source; label: string; placeholder: string }[] = [
  { id: 'nypl', label: 'NYPL', placeholder: 'Search New York Public Library…' },
  { id: 'smithsonian', label: 'Smithsonian', placeholder: 'Search Smithsonian collections…' },
  { id: 'europeana', label: 'Europeana', placeholder: 'Search European heritage…' },
]

// Seed results shown before any search
const SEED_QUERIES = ['botanical', 'portrait', 'map', 'architecture', 'pattern']

type Props = {
  onImageSelect: (url: string) => void
}

export function ImageLibraryPanel({ onImageSelect }: Props) {
  const [source, setSource] = useState<Source>('nypl')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NYPLImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  const doSearch = useCallback(async (q: string, p = 1, append = false) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    setError(null)
    try {
      // Only NYPL wired up in this phase; others stubbed
      const data = await searchNYPL(q, p)
      setResults(prev => append ? [...prev, ...data.images] : data.images)
      setHasMore(data.images.length === 20)
      setPage(p)
    } catch {
      setError('Search failed — check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => doSearch(val), 400)
  }

  const loadMore = () => doSearch(query, page + 1, true)

  const handleDragStart = (e: React.DragEvent, img: NYPLImage) => {
    e.dataTransfer.setData('application/pasteup-image-url', img.imageUrl)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const currentSource = SOURCES.find(s => s.id === source)!

  return (
    <aside className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 w-56 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-zinc-400">
          Image Sources
        </span>
        <BookOpen size={13} className="text-zinc-400" />
      </div>

      {/* Source tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {SOURCES.map(s => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={[
              'flex-1 py-1.5 text-[10px] font-medium transition-all border-b-2',
              source === s.id
                ? 'text-zinc-900 dark:text-zinc-100 border-[#c84b2f]'
                : 'text-zinc-400 border-transparent hover:text-zinc-600',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <Search size={13} className="text-zinc-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder={currentSource.placeholder}
          className="flex-1 text-[11px] bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 min-w-0"
        />
        {loading && <Loader2 size={12} className="text-zinc-400 animate-spin shrink-0" />}
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        {SEED_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => { setQuery(q); doSearch(q) }}
            className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all capitalize"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {error && (
          <div className="flex flex-col items-center gap-2 mt-6 text-zinc-400">
            <ImageOff size={20} />
            <p className="text-[11px] text-center">{error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="flex flex-col items-center gap-2 mt-6 text-zinc-400">
            <Globe size={20} />
            <p className="text-[11px] text-center">No results for "{query}"</p>
          </div>
        )}

        {!query && (
          <p className="text-[10px] text-zinc-400 text-center mt-4 leading-relaxed px-2">
            Search 900,000+ public domain works from NYPL's digital collections
          </p>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {results.map(img => (
            <div
              key={img.uuid}
              draggable
              onDragStart={(e) => handleDragStart(e, img)}
              onClick={() => onImageSelect(img.imageUrl)}
              title={img.title}
              className="group relative aspect-[4/3] rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing hover:border-zinc-400 transition-all bg-zinc-100 dark:bg-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnailUrl}
                alt={img.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                <p className="translate-y-full group-hover:translate-y-0 transition-transform w-full bg-black/70 text-white text-[8px] px-1.5 py-1 leading-tight truncate">
                  {img.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={loadMore}
            className="w-full mt-3 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded transition-all"
          >
            Load more
          </button>
        )}
      </div>

      {/* Attribution */}
      <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[9px] text-zinc-400 tracking-wide">
          {currentSource.label} Digital Collections
        </span>
      </div>
    </aside>
  )
}
