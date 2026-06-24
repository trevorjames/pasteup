// src/lib/collages.ts
// Data access functions for collages — save, load, list, delete.

import { supabase } from './supabase'
import type { Collage } from './supabase'

// ─── Save or update a collage ─────────────────────────────────────────────────

export async function saveCollage({
  id,
  name,
  formatId,
  canvasJson,
  previewUrl,
}: {
  id?: string
  name: string
  formatId: string
  canvasJson: string
  previewUrl?: string
}): Promise<Collage> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload = {
    user_id: user.id,
    name,
    format_id: formatId,
    canvas_json: JSON.parse(canvasJson),
    preview_url: previewUrl ?? null,
  }

  if (id) {
    // Update existing
    const { data, error } = await supabase
      .from('collages')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('collages')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ─── List user's collages ─────────────────────────────────────────────────────

export async function listCollages(): Promise<Collage[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('collages')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Load a single collage ────────────────────────────────────────────────────

export async function loadCollage(id: string): Promise<Collage> {
  const { data, error } = await supabase
    .from('collages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ─── Delete a collage ─────────────────────────────────────────────────────────

export async function deleteCollage(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('collages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

// ─── Generate a canvas preview thumbnail ─────────────────────────────────────
// Renders the canvas at small size and returns a data URL.
// Called before saving so we have a thumbnail for the gallery.

export function generatePreview(canvasEl: HTMLCanvasElement): string {
  const size = 400
  const offscreen = document.createElement('canvas')
  const scale = size / Math.max(canvasEl.width, canvasEl.height)
  offscreen.width = canvasEl.width * scale
  offscreen.height = canvasEl.height * scale
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(canvasEl, 0, 0, offscreen.width, offscreen.height)
  return offscreen.toDataURL('image/jpeg', 0.8)
}