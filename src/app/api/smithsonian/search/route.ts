// src/app/api/smithsonian/search/route.ts
// Smithsonian Open Access API — https://www.si.edu/openaccess
// Docs: https://edan.si.edu/openaccess/apidocs/
// Key:  register at https://api.data.gov/signup/  → SMITHSONIAN_API_KEY
 
import { NextRequest, NextResponse } from 'next/server'
 
const SI_API_KEY = process.env.SMITHSONIAN_API_KEY ?? ''
const SI_BASE = 'https://api.si.edu/openaccess/api/v1.0'
const IDS = 'https://ids.si.edu/ids/deliveryService'
 
// Bounded integer coercion — prevents query-param injection into the
// upstream URL (same hardening as the NYPL route).
function toInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = parseInt(value ?? '', 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
 
// Build an IDS delivery URL at a given width when we have an IDS id,
// otherwise fall back to whatever URL the record gave us.
function idsUrl(idsId: string | undefined, fallback: string | undefined, width: number): string {
  if (idsId) return `${IDS}?id=${encodeURIComponent(idsId)}&max_w=${width}`
  return fallback ?? ''
}
 
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''
  const page = toInt(searchParams.get('page'), 1, 1, 1000)
  const perPage = toInt(searchParams.get('per_page'), 20, 1, 100)
 
  if (!query.trim()) {
    return NextResponse.json({ images: [], totalCount: 0, page: 1 })
  }
 
  if (!SI_API_KEY) {
    return NextResponse.json(
      { error: 'No Smithsonian API key configured' },
      { status: 500 }
    )
  }
 
  try {
    // Restrict to CC0-licensed still images so everything returned is
    // safe to remix. `media_usage:CC0` is the same filter si.edu uses.
    const q = `${query} AND online_media_type:"Images" AND media_usage:"CC0"`
    const start = (page - 1) * perPage
 
    const url =
      `${SI_BASE}/search` +
      `?q=${encodeURIComponent(q)}` +
      `&start=${start}` +
      `&rows=${perPage}` +
      `&api_key=${encodeURIComponent(SI_API_KEY)}`
 
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Smithsonian API ${res.status}`)
 
    const data = await res.json()
    const rows = data?.response?.rows ?? []
 
    const images = rows
      .map((row: any) => {
        const dnr = row?.content?.descriptiveNonRepeating
        const media = dnr?.online_media?.media ?? []
 
        // Prefer a CC0 still image; fall back to the first media entry.
        const pick =
          media.find((m: any) => m?.type === 'Images' && m?.usage?.access === 'CC0') ??
          media.find((m: any) => m?.type === 'Images') ??
          media[0]
 
        if (!pick) return null
 
        const idsId: string | undefined = pick.idsId
        const imageUrl = idsUrl(idsId, pick.content, 1600)
        const thumbnailUrl = idsUrl(idsId, pick.thumbnail, 400)
        if (!imageUrl) return null
 
        return {
          uuid: row?.id ?? dnr?.record_ID ?? imageUrl,
          title: dnr?.title?.content ?? row?.title ?? 'Untitled',
          imageUrl,
          thumbnailUrl: thumbnailUrl || imageUrl,
          date: row?.content?.indexedStructured?.date?.[0] ?? '',
          description: '',
          source: 'smithsonian' as const,
          // Which museum/unit it came from — used for attribution.
          attribution: dnr?.data_source ?? 'Smithsonian Institution',
        }
      })
      .filter(Boolean)
 
    return NextResponse.json({
      images,
      totalCount: data?.response?.rowCount ?? images.length,
      page,
    })
  } catch (err) {
    console.error('Smithsonian search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}