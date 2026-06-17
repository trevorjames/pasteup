import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pasteup — Collage Art Studio',
  description: 'Create collage art from public domain imagery.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}