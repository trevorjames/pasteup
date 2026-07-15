'use client'
// src/components/canvas/CanvasToolbar.tsx

import {
  MousePointer2,
  Crop,
  Circle,
  Lasso,
  Scissors,
  Slice,
  Sticker,
  Type,
  Pencil,
  Paintbrush,
  Undo2,
  Trash2,
} from 'lucide-react'
import type { ToolMode } from '@/types'

type Tool = {
  id: ToolMode
  icon: React.ReactNode
  label: string
  tooltip: string
}

const TOOLS: Tool[] = [
  {
    id: 'select',
    icon: <MousePointer2 size={15} />,
    label: 'Select',
    tooltip: 'Select and move objects',
  },
  {
    id: 'crop-rect',
    icon: <Crop size={15} />,
    label: 'Crop',
    tooltip: 'Draw a rectangle to crop the image',
  },
  {
    id: 'crop-circle',
    icon: <Circle size={15} />,
    label: 'Circle',
    tooltip: 'Draw a circle to extract that area',
  },
  {
    id: 'crop-lasso',
    icon: <Lasso size={15} />,
    label: 'Lasso',
    tooltip: 'Draw freehand to extract that shape',
  },
  {
    id: 'slice',
    icon: <Scissors size={15} />,
    label: 'Extract',
    tooltip: 'Draw a freehand shape to extract as a new piece',
  },
  {
    id: 'xacto',
    icon: <Slice size={15} />,
    label: 'X-Acto',
    tooltip: 'Drag across an image to cut it into two pieces',
  },
  {
    id: 'tape',
    icon: <Sticker size={15} />,
    label: 'Tape',
    tooltip: 'Click to add a scotch tape strip',
  },
  {
    id: 'text',
    icon: <Type size={15} />,
    label: 'Text',
    tooltip: 'Add a text element',
  },
  {
    id: 'draw',
    icon: <Pencil size={15} />,
    label: 'Draw',
    tooltip: 'Draw freehand with a pencil',
  },
  {
    id: 'brush',
    icon: <Paintbrush size={15} />,
    label: 'Brush',
    tooltip: 'Paint with a soft brush',
  },
]

// Tools that are separated by a divider before them
const DIVIDERS_BEFORE = new Set(['tape', 'text', 'draw'])

type Props = {
  activeTool: ToolMode
  onToolChange: (tool: ToolMode) => void
  onUndo: () => void
  onDelete: () => void
}

export function CanvasToolbar({ activeTool, onToolChange, onUndo, onDelete }: Props) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-1.5 shadow-lg">
      {TOOLS.map((tool) => (
        <div key={tool.id} className="relative group flex items-center">
          {DIVIDERS_BEFORE.has(tool.id) && (
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          )}
          <button
            onClick={() => onToolChange(tool.id)}
            title={tool.tooltip}
            aria-label={tool.label}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              activeTool === tool.id
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200',
            ].join(' ')}
          >
            {tool.icon}
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
            <div className="bg-zinc-900 text-white text-[9px] rounded px-2 py-1 whitespace-nowrap max-w-[180px] text-center leading-tight">
              {tool.tooltip}
            </div>
          </div>
        </div>
      ))}

      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

      <button
        onClick={onUndo}
        aria-label="Undo"
        title="Undo last action"
        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all"
      >
        <Undo2 size={15} />
      </button>

      <button
        onClick={onDelete}
        aria-label="Delete selected"
        title="Delete selected object"
        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-500 transition-all"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}