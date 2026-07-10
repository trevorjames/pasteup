// src/lib/sources.ts
// Unified search across connected open-access collections.
 
import type { CollectionImage, ImageSource } from '@/types'
import { searchNYPL } from './nypl'
 
export type SearchResult = {
  images: CollectionImage[]
  totalCount: number
  page: number
}
 
export async function searchSmithsonian(
  query: string,
  page = 1,
  perPage = 20
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
  })
  const res = await fetch(`/api/smithsonian/search?${params}`)
  if (!res.ok) throw new Error('Smithsonian search failed')
  const data = await res.json()
  return {
    images: data.images ?? [],
    totalCount: data.totalCount ?? 0,
    page: data.page ?? 1,
  }
}
 
// Which collections can actually be searched right now.
export const SEARCHABLE_SOURCES: ImageSource[] = ['nypl', 'smithsonian']
 
// Route a search to the right collection.
export async function searchSource(
  source: ImageSource,
  query: string,
  page = 1
): Promise<SearchResult> {
  switch (source) {
    case 'nypl':
      return searchNYPL(query, page)
    case 'smithsonian':
      return searchSmithsonian(query, page)
    default:
      // Not yet connected (e.g. europeana) — return empty rather than
      // silently searching a different collection.
      return { images: [], totalCount: 0, page: 1 }
  }
}