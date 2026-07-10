import { NextRequest, NextResponse } from 'next/server'

const NYPL_API_TOKEN = process.env.NYPL_API_TOKEN ?? ''
const NYPL_BASE = 'https://api.repo.nypl.org/api/v2'

// Coerce a query-string value to a bounded integer so it can't be used to
// inject extra parameters into the upstream URL (e.g. smuggling
// publicDomainOnly=false past our publicDomainOnly=true safeguard).
function toInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = parseInt(value ?? '', 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''
  const page = toInt(searchParams.get('page'), 1, 1, 1000)
  const perPage = toInt(searchParams.get('per_page'), 20, 1, 100)

  if (!query.trim()) {
    return NextResponse.json({ images: [], totalCount: 0, page: 1 })
  }

  if (!NYPL_API_TOKEN) {
    return NextResponse.json({ error: 'No API token configured' }, { status: 500 })
  }

  try {
    const url =
      `${NYPL_BASE}/items/search.json` +
      `?q=${encodeURIComponent(query)}` +
      `&page=${page}` +
      `&per_page=${perPage}` +
      `&publicDomainOnly=true`

    const res = await fetch(url, {
      headers: { Authorization: `Token token=${NYPL_API_TOKEN}` },
    })

    if (!res.ok) throw new Error(`NYPL API ${res.status}`)

    const data = await res.json()
    const results = data?.nyplAPI?.response?.result ?? []

    const images = results
      .filter((item: any) => item.imageID)
      .map((item: any) => ({
        uuid: item.uuid ?? '',
        title: item.title ?? 'Untitled',
        imageUrl: `https://images.nypl.org/index.php?id=${item.imageID}&t=w`,
        thumbnailUrl: `https://images.nypl.org/index.php?id=${item.imageID}&t=r`,
        date: item.dateDigitized ?? '',
        description: '',
      }))

    return NextResponse.json({
      images,
      totalCount: data?.nyplAPI?.response?.numFound ?? images.length,
      page,
    })
  } catch (err) {
    console.error('NYPL search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}