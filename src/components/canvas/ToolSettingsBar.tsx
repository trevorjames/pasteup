'use client'
// src/components/canvas/ToolSettingsBar.tsx
// Contextual settings bar shown above the canvas toolbar when
// brush, draw, or text tools are active.

import type { ToolMode } from '@/types'

const FONT_OPTIONS = [
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Sans', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Typewriter', value: '"Courier New", monospace' },
  { label: 'Handwritten', value: '"Comic Sans MS", cursive' },
]

type Props = {
  toolMode: ToolMode
  brushSize: number
  brushColor: string
  pencilSize: number
  pencilColor: string
  textFont: string
  onBrushSizeChange: (v: number) => void
  onBrushColorChange: (v: string) => void
  onPencilSizeChange: (v: number) => void
  onPencilColorChange: (v: string) => void
  onTextFontChange: (v: string) => void
}

export function ToolSettingsBar({
  toolMode,
  brushSize,
  brushColor,
  pencilSize,
  pencilColor,
  textFont,
  onBrushSizeChange,
  onBrushColorChange,
  onPencilSizeChange,
  onPencilColorChange,
  onTextFontChange,
}: Props) {
  if (toolMode !== 'brush' && toolMode !== 'draw' && toolMode !== 'text') return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-1.5 shadow-md text-[11px]">
      {toolMode === 'brush' && (
        <>
          <span className="text-zinc-400">Brush</span>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Size</span>
            <input
              type="range"
              min={4}
              max={60}
              value={brushSize}
              onChange={e => onBrushSizeChange(Number(e.target.value))}
              className="w-20 accent-[#c84b2f]"
            />
            <span className="text-zinc-600 dark:text-zinc-300 w-6 text-right tabular-nums">{brushSize}</span>
          </div>
          <input
            type="color"
            value={brushColor}
            onChange={e => onBrushColorChange(e.target.value)}
            className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            style={{ padding: 0 }}
          />
        </>
      )}

      {toolMode === 'draw' && (
        <>
          <span className="text-zinc-400">Pencil</span>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Size</span>
            <input
              type="range"
              min={1}
              max={12}
              value={pencilSize}
              onChange={e => onPencilSizeChange(Number(e.target.value))}
              className="w-20 accent-[#c84b2f]"
            />
            <span className="text-zinc-600 dark:text-zinc-300 w-6 text-right tabular-nums">{pencilSize}</span>
          </div>
          <input
            type="color"
            value={pencilColor}
            onChange={e => onPencilColorChange(e.target.value)}
            className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            style={{ padding: 0 }}
          />
        </>
      )}

      {toolMode === 'text' && (
        <>
          <span className="text-zinc-400">Font</span>
          <select
            value={textFont}
            onChange={e => onTextFontChange(e.target.value)}
            className="text-[11px] bg-transparent border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-zinc-700 dark:text-zinc-300"
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}