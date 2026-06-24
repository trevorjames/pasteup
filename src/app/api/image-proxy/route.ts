// src/app/api/image-proxy/route.ts
// Fetches external images server-side so Fabric.js can load them without
// hitting browser CORS restrictions.
//
// Security model: this is an allowlist proxy, NOT an open proxy. It will only
// fetch images from known hosts, over https, and re-checks the allowlist on
// every redirect hop so an allowed host can't bounce us to an internal target.

import { NextRequest, NextResponse } from 'next/server'

// Expand this list as additional image sources are added.
const ALLOWED_HOSTS = new Set([
  'images.nypl.org',
  'cdn-d8.nypl.org',
  'digitalcollections.nypl.org',
  'iiif.nypl.org',
])

const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB
const MAX_REDIRECTS = 4

function isAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (ALLOWED_HOSTS.has(h)) return true
  for (const allowed of ALLOWED_HOSTS) {
    if (h.endsWith('.' + allowed)) return true
  }
  return false
}

// https-only + on the allowlist. Returns the parsed URL or a reason to reject.
function check(raw: string): { ok: true; url: URL } | { ok: false; status: number; msg: string } {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, status: 400, msg: 'Invalid url' }
  }
  if (url.protocol !== 'https:') {
    return { ok: false, status: 400, msg: 'Only https is allowed' }
  }
  if (!isAllowed(url.hostname)) {
    return { ok: false, status: 403, msg: 'Host not allowed' }
  }
  return { ok: true, url }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  const first = check(raw)
  if (!first.ok) {
    return new NextResponse(first.msg, { status: first.status })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    // Follow redirects manually, re-validating each hop's host against the
    // allowlist. This is what prevents an allowed host from redirecting the
    // proxy to an internal/arbitrary address (the SSRF-via-redirect bypass).
    let current = first.url
    let upstream: Response | null = null

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(current.toString(), {
        headers: { 'User-Agent': 'Pasteup/1.0', Accept: 'image/*' },
        redirect: 'manual',
        signal: controller.signal,
        next: { revalidate: 86400 },
      })

      const isRedirect = res.status >= 300 && res.status < 400
      if (!isRedirect) {
        upstream = res
        break
      }

      const location = res.headers.get('location')
      if (!location) {
        upstream = res // 3xx with no Location — treat as terminal (will fail .ok below)
        break
      }

      const next = check(new URL(location, current).toString())
      if (!next.ok) {
        return new NextResponse('Redirect to a disallowed host was blocked', { status: 403 })
      }
      current = next.url
    }

    if (!upstream) {
      return new NextResponse('Too many redirects', { status: 502 })
    }
    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: upstream.status })
    }

    const ct = upstream.headers.get('content-type') ?? ''
    if (!ct.startsWith('image/')) {
      return new NextResponse('Response is not an image', { status: 400 })
    }

    // Reject oversized payloads — by declared length first, then actual bytes.
    const declared = Number(upstream.headers.get('content-length') ?? '0')
    if (declared && declared > MAX_BYTES) {
      return new NextResponse('Image too large', { status: 413 })
    }

    const body = await upstream.arrayBuffer()
    if (body.byteLength > MAX_BYTES) {
      return new NextResponse('Image too large', { status: 413 })
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return new NextResponse(aborted ? 'Upstream timed out' : 'Upstream unreachable', {
      status: aborted ? 504 : 502,
    })
  } finally {
    clearTimeout(timeout)
  }
}