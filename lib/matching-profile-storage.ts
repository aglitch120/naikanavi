/**
 * Matching Profile Storage — localStorage + Cloudflare Worker クラウド同期
 *
 * Dashboard Storage と同じパターン:
 * - localStorage: 即時書き込み（キャッシュ）
 * - Worker API: クラウドバックアップ（sessionToken必須・PRO限定）
 */

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'
const LS_KEY = 'iwor_matching_profile'

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('iwor_session_token') || null
}

// ── localStorage ──

export function saveToLocal(data: any): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[MatchingProfile] localStorage write error', e)
  }
}

export function loadFromLocal(): any | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ── Cloud Sync ──

export async function saveToCloud(data: any): Promise<boolean> {
  const token = getSessionToken()
  if (!token) return false

  try {
    const res = await fetch(`${API_URL}/api/matching-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    })
    return res.ok
  } catch (e) {
    console.warn('[MatchingProfile] Cloud save error', e)
    return false
  }
}

export async function loadFromCloud(): Promise<any | null> {
  const token = getSessionToken()
  if (!token) return null

  try {
    const res = await fetch(`${API_URL}/api/matching-profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch (e) {
    console.warn('[MatchingProfile] Cloud load error', e)
    return null
  }
}

// ── Combined Load (cloud優先 → localStorage fallback) ──

export async function loadProfile(): Promise<any | null> {
  const token = getSessionToken()
  if (token) {
    const cloudData = await loadFromCloud()
    if (cloudData) {
      saveToLocal(cloudData) // cache locally
      return cloudData
    }
  }
  return loadFromLocal()
}

// ── Save (localStorage即時 + cloud非同期) ──

let _saveTimeout: ReturnType<typeof setTimeout> | null = null

export function saveProfile(data: any): void {
  // localStorage: 即時
  saveToLocal(data)

  // Cloud: debounced 3秒
  if (_saveTimeout) clearTimeout(_saveTimeout)
  _saveTimeout = setTimeout(async () => {
    const token = getSessionToken()
    if (token) {
      await saveToCloud(data)
    }
  }, 3000)
}
