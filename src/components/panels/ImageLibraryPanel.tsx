'use client'
// src/components/panels/ImageLibraryPanel.tsx
// Searches NYPL (and later other open-source collections), and now
// supports uploading the user's own images. Displays thumbnails,
// lets users click or drag images to the canvas.

import { useState, useCallback, useRef } from 'react'
import { Search, Loader2, ImageOff, BookOpen, Globe, Upload, X } from 'lucide-react'
import { searchNYPL } from '@/lib/nypl'
import { resizeImageFile, ImageTooLargeError, InvalidImageError } from '@/lib/imageResize'
import type { NYPLImage } from '@/types'

type Source = 'nypl' | 'smithsonian' | 'europeana' | 'upload'

const SOURCES: { id: Source; label: string; placeholder?: string }[] = [
  { id: 'nypl', label: 'NYPL', placeholder: 'Search New York Public Library…' },
  { id: 'smithsonian', label: 'Smithsonian', placeholder: 'Search Smithsonian collections…' },
  { id: 'europeana', label: 'Europeana', placeholder: 'Search European heritage…' },
  { id: 'upload', label: 'Upload' },
]

const SEED_QUERIES = ['botanical', 'portrait', 'map', 'architecture', 'pattern']

// Uploaded images live only in browser session memory for now —
// not persisted. Each entry pairs a thumbnail with the (possibly
// resized) full data URL used when adding to canvas.
type UploadedImage = {
  id: string
  name: string
  dataUrl: string
}

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
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Upload-specific state
  const [uploads, setUploads] = useState<UploadedImage[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const doSearch = useCallback(async (q: string, p = 1, append = false) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    setError(null)
    try {
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

  const handleDragStart = (e: React.DragEvent, url: string) => {
    e.dataTransfer.setData('application/pasteup-image-url', url)
    e.dataTransfer.effectAllowed = 'copy'
  }

  // ── Upload handling ──────────────────────────────────────────────────────

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError(null)
    setUploadBusy(true)

    const fileArray = Array.from(files)
    const newUploads: UploadedImage[] = []

    for (const file of fileArray) {
      try {
        const dataUrl = await resizeImageFile(file)
        newUploads.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          dataUrl,
        })
      } catch (err) {
        if (err instanceof ImageTooLargeError || err instanceof InvalidImageError) {
          setUploadError(err.message)
        } else {
          setUploadError('Something went wrong reading that file.')
        }
      }
    }

    setUploads(prev => [...newUploads, ...prev])
    setUploadBusy(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    // reset so the same file can be re-selected later if needed
    e.target.value = ''
  }

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
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
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        {/* Collection sources row */}
        <div className="flex">
          {SOURCES.filter(s => s.id !== 'upload').map(s => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={[
                'flex-1 py-1.5 text-[10px] font-medium transition-all border-b-2',
                source === s.id
                  ? 'text-zinc-900 dark:text-zinc-100 border-[#c84b2f]'
                  : 'text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* Upload — separate row, visually distinct */}
        <button
          onClick={() => setSource('upload')}
          className={[
            'w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-all border-b-2',
            source === 'upload'
              ? 'text-[#c84b2f] border-[#c84b2f] bg-[#c84b2f]/5'
              : 'text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
          ].join(' ')}
        >
          <Upload size={11} />
          Upload your own images
        </button>
      </div>

      {/* ── Upload tab content ────────────────────────────────────────── */}
      {source === 'upload' ? (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleUploadDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'mx-3 mt-3 mb-2 flex flex-col items-center justify-center gap-1.5 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all',
              dragActive
                ? 'border-[#c84b2f] bg-[#c84b2f]/5'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400',
            ].join(' ')}
          >
            <Upload size={18} className="text-zinc-400" />
            <p className="text-[10px] text-zinc-500 text-center px-3 leading-relaxed">
              Drop images here or click to browse
            </p>
            <p className="text-[9px] text-zinc-400">Max 5MB per image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {uploadBusy && (
            <div className="flex items-center gap-2 px-3 pb-2 text-[10px] text-zinc-400">
              <Loader2 size={12} className="animate-spin" /> Processing…
            </div>
          )}

          {uploadError && (
            <div className="mx-3 mb-2 px-2.5 py-2 rounded bg-red-50 dark:bg-red-900/20 text-[10px] text-red-600 dark:text-red-400 leading-relaxed">
              {uploadError}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3">
            {uploads.length === 0 && !uploadBusy && (
              <p className="text-[10px] text-zinc-400 text-center mt-4 leading-relaxed px-2">
                Uploaded images stay in this browser session only — they won't be saved yet.
              </p>
            )}

            <div className="grid grid-cols-2 gap-1.5 pb-3">
              {uploads.map(up => (
                <div
                  key={up.id}
                  draggable
                  onDragStart={e => handleDragStart(e, up.dataUrl)}
                  onClick={() => onImageSelect(up.dataUrl)}
                  title={up.name}
                  className="group relative aspect-[4/3] rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing hover:border-zinc-400 transition-all bg-zinc-100 dark:bg-zinc-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={up.dataUrl}
                    alt={up.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); removeUpload(up.id) }}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X size={10} />
                  </button>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end pointer-events-none">
                    <p className="translate-y-full group-hover:translate-y-0 transition-transform w-full bg-black/70 text-white text-[8px] px-1.5 py-1 leading-tight truncate">
                      {up.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span className="text-[9px] text-zinc-400 tracking-wide">
              Session only — not yet saved
            </span>
          </div>
        </>
      ) : (
        <>
          {/* ── Search input ─────────────────────────────────────────── */}
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
                  onDragStart={(e) => handleDragStart(e, img.imageUrl)}
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
        </>
      )}
    </aside>
  )
}