/** @type {import('next').NextConfig} */
//
// Security headers for the Pasteup deployment.
//
// IMPORTANT — test before trusting this fully:
// The Content-Security-Policy below is scoped to what this app actually
// uses today (Supabase, NYPL, and Smithsonian image hosts). If you add a
// new image source, embed a new external script, or change how Supabase
// auth redirects work, the CSP is the header most likely to silently
// break something. After adding this:
//   1. Run `npm run build && npm start` locally and click through every
//      flow (search both sources, sign in, save, publish, view a public
//      collage) with the browser console open.
//   2. Any CSP violation shows up in the console as
//      "Refused to ... because it violates the following Content
//      Security Policy directive" — it will name the exact directive to
//      loosen.
//   3. Only then deploy and re-test on the live URL.

const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  // Next.js needs 'unsafe-inline' for its own bootstrap scripts with this
  // simple header-based setup (a nonce-based CSP is more strict but needs
  // middleware — worth revisiting later, not required for a beta).
  // 'unsafe-eval' is ONLY added in dev — Next's Fast Refresh (hot reload)
  // uses eval() to swap code live, but production builds never use eval,
  // and testing confirmed production works fine without it. Don't add
  // 'unsafe-eval' unconditionally, or this exact bug comes back.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  // Tailwind's compiled CSS is same-origin; 'unsafe-inline' covers the
  // inline style="" attributes used by the canvas guides and hero fade.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Image search thumbnails are rendered directly from these hosts in
  // <img> tags (not proxied) — must match the image-proxy allowlist in
  // src/app/api/image-proxy/route.ts, plus 'self'/data:/blob: for
  // uploads, canvas exports, and proxied full-resolution images.
  "img-src 'self' data: blob: https://images.nypl.org https://cdn-d8.nypl.org https://digitalcollections.nypl.org https://iiif.nypl.org https://ids.si.edu https://newsdesk.si.edu https://3d-api.si.edu",
  // Supabase REST + Auth calls (wildcard covers any project ref).
  "connect-src 'self' https://*.supabase.co",
  // Nothing on this site should ever be framed by another site.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Redundant with frame-ancestors above for modern browsers, kept
          // for older browser fallback.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features this app never uses.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

module.exports = nextConfig