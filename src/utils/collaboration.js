import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const COLLABORATOR_KEY = 'qlmp-collaborator-name'

let supabaseClient = null

export function isCloudSyncEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function getSupabaseClient() {
  if (!isCloudSyncEnabled()) {
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    })
  }

  return supabaseClient
}

export function getCollaboratorName() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(COLLABORATOR_KEY) || ''
}

export function saveCollaboratorName(name) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(COLLABORATOR_KEY, name)
}
