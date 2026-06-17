'use client'
// src/components/panels/PropertiesPanel.tsx
 
import { FlipHorizontal, FlipVertical, Download, Globe } from 'lucide-react'
import type { ObjectProperties } from '@/types'
 
type Props = {
  properties: ObjectProperties | null
  onChange: (props: Partial<ObjectProperties>) => void
  onRemoveClip: () => void
  onExportPNG: () => void
  onExportPDF: () => void
  onPublish: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onBringToFront: () => void
  onSendToBack: () => void
}
 
const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color',
] as const
 
const FILTERS = [
  { id: 'sepia', label: 'Sepia' },
  { id: 'grayscale', label: 'B&W' },
  { id: 'invert', label: 'Invert' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'saturate', label: 'Saturate' },
  { id: 'blur', label: 'Blur' },
]
 
function SliderRow({
  label, value, min, max, unit = '', onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] text-zinc-400 w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-[#c84b2f]"
        style={{ height: 14 }}
      />
      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 w-9 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  )
}
 
export function PropertiesPanel({
  properties,
  onChange,
  onRemoveClip,
  onExportPNG,
  onExportPDF,
  onPublish,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: Props) {
  return (
    <aside className="flex flex-col h-full border-l border-zinc-200 dark:border-zinc-800 w-52 shrink-0">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-zinc-400">
          Properties
        </span>
      </div>
 
      <div className="flex-1 overflow-y-auto">
        {/* No selection placeholder */}
        {!properties && (
          <p className="text-[10px] text-zinc-400 text-center mt-6 px-4 leading-relaxed">
            Select an object on the canvas to adjust its properties
          </p>
        )}
 
        {/* Transform */}
        {properties && (
          <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-[9px] font-medium tracking-[0.1em] uppercase text-zinc-400 mb-2.5">
              Transform
            </p>
            <SliderRow label="Opacity" value={properties.opacity} min={5} max={100} unit="%" onChange={v => onChange({ opacity: v })} />
            <SliderRow label="Rotation" value={properties.angle} min={-180} max={180} unit="°" onChange={v => onChange({ angle: v })} />
            <SliderRow label="Scale X" value={properties.scaleX} min={10} max={300} unit="%" onChange={v => onChange({ scaleX: v })} />
            <SliderRow label="Scale Y" value={properties.scaleY} min={10} max={300} unit="%" onChange={v => onChange({ scaleY: v })} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onChange({ flipX: !properties.flipX })}
                className={[
                  'flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded border transition-all',
                  properties.flipX
                    ? 'border-[#c84b2f] text-[#c84b2f]'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400',
                ].join(' ')}
              >
                <FlipHorizontal size={11} /> Flip H
              </button>
              <button
                onClick={() => onChange({ flipY: !properties.flipY })}
                className={[
                  'flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded border transition-all',
                  properties.flipY
                    ? 'border-[#c84b2f] text-[#c84b2f]'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400',
                ].join(' ')}
              >
                <FlipVertical size={11} /> Flip V
              </button>
            </div>
          </div>
        )}
 
        {/* Filters */}
        {properties && (
          <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-[9px] font-medium tracking-[0.1em] uppercase text-zinc-400 mb-2.5">
              Filters
            </p>
            <div className="grid grid-cols-3 gap-1">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => onChange({ filter: f.id })}
                  className={[
                    'text-[9px] py-1 px-1.5 rounded border text-center transition-all',
                    properties.filter === f.id
                      ? 'border-[#c84b2f] bg-[#c84b2f]/5 text-[#c84b2f]'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
 
        {/* Blend mode */}
        {properties && (
          <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-[9px] font-medium tracking-[0.1em] uppercase text-zinc-400 mb-2.5">
              Blend mode
            </p>
            <div className="grid grid-cols-2 gap-1">
              {BLEND_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => onChange({ blendMode: mode as GlobalCompositeOperation })}
                  className={[
                    'text-[9px] py-1 px-1.5 rounded border text-center capitalize transition-all',
                    properties.blendMode === mode
                      ? 'border-[#c84b2f] bg-[#c84b2f]/5 text-[#c84b2f]'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400',
                  ].join(' ')}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}
 
        {/* Layer order — always visible */}
        <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-[9px] font-medium tracking-[0.1em] uppercase text-zinc-400 mb-2.5">
            Layer order
          </p>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={onBringToFront}
              className="flex items-center justify-center gap-1 py-1.5 text-[10px] border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              ↑ To front
            </button>
            <button
              onClick={onSendToBack}
              className="flex items-center justify-center gap-1 py-1.5 text-[10px] border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              ↓ To back
            </button>
            <button
              onClick={onBringForward}
              className="flex items-center justify-center gap-1 py-1.5 text-[10px] border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              ↑ Forward
            </button>
            <button
              onClick={onSendBackward}
              className="flex items-center justify-center gap-1 py-1.5 text-[10px] border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              ↓ Backward
            </button>
          </div>
        </div>
 
        {/* Masking */}
        {properties && (
          <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-[9px] font-medium tracking-[0.1em] uppercase text-zinc-400 mb-2.5">
              Masking
            </p>
            <button
              onClick={onRemoveClip}
              className="w-full py-1.5 text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded transition-all"
            >
              Clear mask / clip
            </button>
          </div>
        )}
      </div>
 
      {/* Export — always visible */}
      <div className="px-3.5 py-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
        <p className="text-[9px] font-medium tracking-[0.1em] uppercase text-zinc-400 mb-2">
          Export
        </p>
        <button
          onClick={onExportPNG}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-medium bg-[#1a1208] text-[#f5f0e8] rounded hover:opacity-85 transition-opacity"
        >
          <Download size={11} /> Download PNG
        </button>
        <button
          onClick={onExportPDF}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <Download size={11} /> Export print PDF
        </button>
        <button
          onClick={onPublish}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] text-[#c84b2f] border border-[#c84b2f]/40 rounded hover:bg-[#c84b2f]/5 transition-all"
        >
          <Globe size={11} /> Publish online
        </button>
      </div>
    </aside>
  )
}