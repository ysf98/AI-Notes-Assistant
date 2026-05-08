import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export const isSupabaseConfigured = (): boolean => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null
  if (supabaseClient) return supabaseClient

  supabaseClient = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return supabaseClient
}
