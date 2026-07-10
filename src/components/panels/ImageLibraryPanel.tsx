'use client'
// src/components/panels/ImageLibraryPanel.tsx
// Searches NYPL (and later other open-source collections), and now
// supports uploading the user's own images. Displays thumbnails,
// lets users click or drag images to the canvas.
 
import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2, ImageOff, BookOpen, Globe, Upload, X } from 'lucide-react'
import { searchSource, SEARCHABLE_SOURCES } from '@/lib/sources'
import { resizeImageFile, ImageTooLargeError, InvalidImageError } from '@/lib/imageResize'
import type { CollectionImage, ImageSource } from '@/types'
 
type Source = ImageSource
 
const SOURCES: { id: Source; label: string; placeholder?: string; footer?: string }[] = [
  {
    id: 'nypl',
    label: 'NYPL',
    placeholder: 'Search New York Public Library…',
    footer: 'NYPL Digital Collections',
  },
  {
    id: 'smithsonian',
    label: 'Smithsonian',
    placeholder: 'Search Smithsonian collections…',
    footer: 'Smithsonian Open Access · CC0',
  },
  {
    id: 'europeana',
    label: 'Europeana',
    placeholder: 'Search European heritage…',
    footer: 'Europeana',
  },
  { id: 'upload', label: 'Upload' },
]
 
// Blurb shown before the user has typed anything.
const SOURCE_BLURB: Record<string, string> = {
  nypl: "Search 900,000+ public domain works from NYPL's digital collections",
  smithsonian: 'Search millions of CC0 images across the Smithsonian’s museums, archives, and the National Zoo',
}
 
// Curated terms that return rich, visually interesting public domain results
// from each collection. A random subset is shown each time.
// Terms are tuned per source — NYPL is strong on print ephemera and
// city life; the Smithsonian on natural history, air & space, portraiture
// and cultural objects. Using one list for both returns thin results.
const SEED_QUERIES: Record<string, string[]> = {
  nypl: [
    'botanical', 'portrait', 'map', 'architecture', 'pattern',
    'fashion', 'illustration', 'circus', 'poster', 'bird',
    'flower', 'cityscape', 'manuscript', 'mythology', 'costume',
    'advertisement', 'landscape', 'anatomy', 'astronomy', 'textile',
    'woodcut', 'lithograph', 'sheet music', 'menu', 'dance',
    'locomotive', 'ocean', 'butterfly', 'typeface', 'ephemera',
  ],
  smithsonian: [
    'butterfly', 'mineral', 'spacecraft', 'portrait', 'ceramic',
    'insect', 'aircraft', 'fossil', 'quilt', 'mask',
    'orchid', 'seashell', 'telescope', 'beetle', 'sculpture',
    'feather', 'meteorite', 'basket', 'coral', 'dinosaur',
    'jewelry', 'moth', 'rocket', 'pottery', 'bird',
    'textile', 'skeleton', 'astronaut', 'stamp', 'shell',
  ],
}
 
const FALLBACK_SEEDS = SEED_QUERIES.nypl
 
function seedsFor(source: string): string[] {
  return SEED_QUERIES[source] ?? FALLBACK_SEEDS
}
 
function getSeedQueries(source: string, count = 9): string[] {
  const shuffled = [...seedsFor(source)].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
 
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
  const [results, setResults] = useState<CollectionImage[]>([])
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
 
  // Seed queries — stable on SSR, randomized after hydration
  const [seedQueries, setSeedQueriesState] = useState<string[]>(FALLBACK_SEEDS.slice(0, 9))
  // Re-shuffle whenever the collection changes, so chips match the source.
  useEffect(() => { setSeedQueriesState(getSeedQueries(source, 9)) }, [source])
 
  const doSearch = useCallback(async (q: string, p = 1, append = false, src?: Source) => {
    const active = src ?? source
    if (!q.trim()) { setResults([]); return }
    if (!SEARCHABLE_SOURCES.includes(active)) {
      setResults([])
      setError(`${SOURCES.find(s => s.id === active)?.label} isn’t connected yet.`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await searchSource(active, q, p)
      setResults(prev => append ? [...prev, ...data.images] : data.images)
      setHasMore(data.images.length === 20)
      setPage(p)
    } catch {
      setError('Search failed — check your connection.')
    } finally {
      setLoading(false)
    }
  }, [source])
 
  // Switching collections clears stale results and re-runs the query there.
  const handleSourceChange = (next: Source) => {
    setSource(next)
    setError(null)
    setResults([])
    setPage(1)
    setHasMore(false)
    if (next !== 'upload' && query.trim()) doSearch(query, 1, false, next)
  }
 
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
              onClick={() => handleSourceChange(s.id)}
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
          onClick={() => handleSourceChange('upload')}
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
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Explore</span>
              <button
                onClick={() => {
                  const next = getSeedQueries(source, 9)
                  setSeedQueriesState(next)
                }}
                className="text-[9px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                title="Shuffle suggestions"
              >
                ↻ shuffle
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {seedQueries.map(q => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); doSearch(q) }}
                  className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-[#c84b2f] hover:text-[#c84b2f] dark:hover:text-[#c84b2f] transition-all capitalize"
                >
                  {q}
                </button>
              ))}
            </div>
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
                {SOURCE_BLURB[source] ?? `${currentSource.label} isn’t connected yet — coming soon.`}
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
                      {img.attribution ? ` · ${img.attribution}` : ''}
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
            <div className={[
              'w-1.5 h-1.5 rounded-full',
              SEARCHABLE_SOURCES.includes(source) ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600',
            ].join(' ')} />
            <span className="text-[9px] text-zinc-400 tracking-wide">
              {currentSource.footer ?? currentSource.label}
            </span>
          </div>
        </>
      )}
    </aside>
  )
}