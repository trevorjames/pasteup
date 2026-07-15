'use client'
// src/app/page.tsx
//
// Minimal placeholder landing page. Full marketing/homepage design is a
// separate task (see ROADMAP) — this exists so signed-out visitors have a
// real place to land after logout, with the sign-in flow available there.

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { AuthModal } from '@/components/auth/AuthModal'

// The real Pasteup mark — layered torn paper scraps, a squiggle-and-circle
// doodle, and a strip of tape. Inlined so it renders crisply at any size
// without an extra asset request.
function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(-20,40)">
        <g transform="translate(150,105) rotate(18) translate(52,40)">
          <polygon points="0,4 34,0 40,30 6,34" fill="#6b8a82" opacity="0.85" />
        </g>
        <g transform="translate(48,30)">
          <polygon points="6,10 96,0 150,14 146,108 88,120 8,104" fill="#e8dcc8" />
        </g>
        <g transform="translate(66,44) rotate(7)">
          <polygon points="4,8 82,0 118,12 112,92 70,100 6,86" fill="#c8846a" />
        </g>
        <g transform="translate(80,54) rotate(-6)">
          <polygon points="6,6 66,0 92,10 86,72 54,78 4,64" fill="#2b2018" />
        </g>
        <g transform="translate(96,66) rotate(-6)">
          <path d="M12,4 C24,10 40,2 54,8" fill="none" stroke="#f5f0e8" strokeWidth="1.5" opacity="0.6" />
          <circle cx="20" cy="24" r="10" fill="none" stroke="#f5f0e8" strokeWidth="1.5" opacity="0.5" />
        </g>
        <g transform="translate(30,26) rotate(-22)">
          <rect x="0" y="0" width="150" height="30" fill="#f5f0e8" opacity="0.78" />
          <line x1="0" y1="8" x2="150" y2="8" stroke="#c9bda8" strokeWidth="0.5" opacity="0.8" />
          <line x1="0" y1="15" x2="150" y2="15" stroke="#c9bda8" strokeWidth="0.5" opacity="0.8" />
          <line x1="0" y1="22" x2="150" y2="22" stroke="#c9bda8" strokeWidth="0.5" opacity="0.8" />
        </g>
      </g>
    </svg>
  )
}

// Rotating hero copy — cross-fades between the brand line and a quick
// tour of what the tools actually let you do.
const HERO_SLIDES = [
  {
    heading: 'Turn public-domain treasures into collage art',
    body: 'Search millions of public-domain images from NYPL and the Smithsonian, cut, layer, and paste them into something new — right in your browser.',
  },
  {
    heading: 'Drag. Tape. Slice. Cut. Create.',
    body: 'Crop, lasso, torn-paper tape, an X-Acto knife that splits an image in two, brushes and pencils, layer ordering — a full paper studio on one canvas, built from your own photos or public-domain imagery.',
  },
  {
    heading: 'Save your work. Share it with the world.',
    body: 'Sign in to save every collage you make, come back and keep editing anytime, and publish online with a shareable link so anyone can view your finished piece.',
  },
]

// The full lockup — same icon as LogoMark, plus the "Pasteup" wordmark and
// tagline baked into the SVG exactly as in pasteup-logo-original.svg, so it
// scales as one faithful unit rather than being reassembled from HTML text.
function LogoLockup({ width = 440 }: { width?: number }) {
  const height = width * (210 / 680)
  return (
    <svg width={width} height={height} viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pasteup — Collage Art Studio">
      <g transform="translate(150,105) rotate(18) translate(52,40)">
        <polygon points="0,4 34,0 40,30 6,34" fill="#6b8a82" opacity="0.85" />
      </g>
      <g transform="translate(48,30)">
        <polygon points="6,10 96,0 150,14 146,108 88,120 8,104" fill="#e8dcc8" />
      </g>
      <g transform="translate(66,44) rotate(7)">
        <polygon points="4,8 82,0 118,12 112,92 70,100 6,86" fill="#c8846a" />
      </g>
      <g transform="translate(80,54) rotate(-6)">
        <polygon points="6,6 66,0 92,10 86,72 54,78 4,64" fill="#2b2018" />
      </g>
      <g transform="translate(96,66) rotate(-6)">
        <path d="M12,4 C24,10 40,2 54,8" fill="none" stroke="#f5f0e8" strokeWidth="1.5" opacity="0.6" />
        <circle cx="20" cy="24" r="10" fill="none" stroke="#f5f0e8" strokeWidth="1.5" opacity="0.5" />
      </g>
      <g transform="translate(30,26) rotate(-22)">
        <rect x="0" y="0" width="150" height="30" fill="#f5f0e8" opacity="0.78" />
        <line x1="0" y1="8" x2="150" y2="8" stroke="#c9bda8" strokeWidth="0.5" opacity="0.8" />
        <line x1="0" y1="15" x2="150" y2="15" stroke="#c9bda8" strokeWidth="0.5" opacity="0.8" />
        <line x1="0" y1="22" x2="150" y2="22" stroke="#c9bda8" strokeWidth="0.5" opacity="0.8" />
      </g>
      <text x="252" y="100" fontFamily="Georgia, 'Times New Roman', serif" fontSize="46" fontWeight="500" letterSpacing="0.5" fill="#2b2018">Pasteup</text>
      <text x="253" y="126" fontFamily="Georgia, serif" fontSize="13" letterSpacing="3" fill="#8a7a63">COLLAGE ART STUDIO</text>
    </svg>
  )
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loggedOut = searchParams.get('loggedOut') === '1'

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBanner, setShowBanner] = useState(loggedOut)

  // Cross-fade through the hero copy every few seconds.
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideVisible, setSlideVisible] = useState(true)

  useEffect(() => {
    const FADE_MS = 500
    const HOLD_MS = 5000
    const timer = setInterval(() => {
      setSlideVisible(false)
      setTimeout(() => {
        setSlideIndex(i => (i + 1) % HERO_SLIDES.length)
        setSlideVisible(true)
      }, FADE_MS)
    }, HOLD_MS)
    return () => clearInterval(timer)
  }, [])

  const slide = HERO_SLIDES[slideIndex]

  // Arriving here via the logout redirect: surface a small notice and open
  // the sign-in modal automatically, per the requested UX.
  useEffect(() => {
    if (loggedOut) setShowAuthModal(true)
  }, [loggedOut])

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {showBanner && (
        <div className="bg-ink text-cream text-[13px] text-center py-2.5 px-10 relative">
          You've been signed out.
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/60 hover:text-cream transition-colors text-[12px]"
          >
            Dismiss
          </button>
        </div>
      )}

      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <LogoMark size={36} />
          <span className="font-serif text-[17px] font-medium text-ink">
            Pasteup
          </span>
        </div>
        <button
          onClick={() => setShowAuthModal(true)}
          className="text-[13px] font-medium text-ink hover:text-rust transition-colors"
        >
          Sign in
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 -mt-10">
        <LogoLockup width={440} />
        <div
          className="mt-8 transition-opacity duration-500 ease-in-out"
          style={{ opacity: slideVisible ? 1 : 0 }}
        >
          <h1 className="font-serif text-[40px] sm:text-[52px] leading-[1.1] text-ink max-w-2xl mx-auto mb-5 min-h-[50px] sm:min-h-[62px]">
            {slide.heading}
          </h1>
          <p className="text-[15px] text-ink/60 max-w-md mx-auto mb-9 leading-relaxed min-h-[72px]">
            {slide.body}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-cream text-[14px] font-medium rounded-lg hover:opacity-85 transition-opacity"
          >
            Open the editor
            <ArrowRight size={15} />
          </Link>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 text-[14px] font-medium text-ink border border-ink/15 rounded-lg hover:bg-ink/5 transition-colors"
          >
            Sign in
          </button>
        </div>
      </main>

      <footer className="text-center py-6 text-[11px] text-ink/40">
        Built from public domain collections at NYPL and the Smithsonian.
      </footer>

      {showAuthModal && (
        <AuthModal
          initialMode="signin"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            router.push('/editor')
          }}
        />
      )}
    </div>
  )
}

// useSearchParams requires a Suspense boundary, or Next.js fails the
// production build (the same class of build-time error we hit earlier
// with the image proxy — catching this now avoids a repeat).
export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}