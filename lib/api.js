import { supabase } from './supabase'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
}

export async function apiGet(path) {
  const headers = await getAuthHeader()
  const res = await fetch(path, { headers })
  return res.json()
}

export async function apiPost(path, body) {
  const headers = await getAuthHeader()
  const res = await fetch(path, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiPatch(path, body) {
  const headers = await getAuthHeader()
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiDelete(path, body) {
  const headers = await getAuthHeader()
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}