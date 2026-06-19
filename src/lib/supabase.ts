// src/lib/supabase.ts
// Supabase client setup for both browser and server usage.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — used in components and client-side code
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types matching our database schema
export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Collage = {
  id: string
  user_id: string
  name: string
  format_id: string
  canvas_json: any
  preview_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}