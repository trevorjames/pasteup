// src/app/api/image-proxy/route.ts
// Fetches external images server-side so Fabric.js can load them
// without running into CORS restrictions in the browser.

import { NextRequest, NextResponse } from 'next/server'

// Expand this list as additional image sources are added.
const ALLOWED_HOSTS = new Set([
  'images.nypl.org',
  'cdn-d8.nypl.org',
  'digitalcollections.nypl.org',
  'iiif.nypl.org',
])

function isAllowed(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true
  for (const h of ALLOWED_HOSTS) {
    if (hostname.endsWith('.' + h)) return true
  }
  return false
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return new NextResponse('Protocol not allowed', { status: 400 })
  }

  if (!isAllowed(url.hostname)) {
    return new NextResponse(`Host not in allowlist: ${url.hostname}`, { status: 403 })
  }

  let upstream: Response
  try {
    upstream = await fetch(raw, {
      headers: { 'User-Agent': 'Pasteup/1.0' },
      next: { revalidate: 86400 },
    })
  } catch {
    return new NextResponse('Upstream unreachable', { status: 502 })
  }

  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: upstream.status })
  }

  const ct = upstream.headers.get('content-type') ?? 'image/jpeg'
  if (!ct.startsWith('image/')) {
    return new NextResponse('Response is not an image', { status: 400 })
  }

  const body = await upstream.arrayBuffer()
  return new NextResponse(body, {
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
