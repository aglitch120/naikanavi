/**
 * Dashboard Storage — localStorage + Cloudflare Worker クラウド同期
 * 
 * naikanavi app.html の save/load パターンを踏襲:
 * - localStorage: 即時・同期・確実（beforeunload でも書き込み可能）
 * - Worker API: 非同期・クラウドバックアップ（sessionToken必須）
 * - 自動保存: 30秒間隔 + 変更検知
 */

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'
const LS_KEY = 'iwor_dashboard_data'

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error' | 'offline'

export interface DashboardData {
  patients: any[]
  archived: any[]
  taskTemplates: any[]
  customFields: any[]
}

const EMPTY_DATA: DashboardData = {
  patients: [],
  archived: [],
  taskTemplates: [],
  customFields: [],
}

// ── localStorage ──

export function saveToLocal(data: DashboardData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[Dashboard] localStorage write error', e)
  }
}

export function loadFromLocal(): DashboardData | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DashboardData
  } catch (e) {
    console.warn('[Dashboard] localStorage read error', e)
    return null
  }
}

// ── Cloud Sync (Worker API) ──

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('iwor_session_token') || null
}

export async function saveToCloud(data: DashboardData): Promise<boolean> {
  const token = getSessionToken()
  if (!token) return false

  try {
    const res = await fetch(`${API_URL}/api/dashboard`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    })
    return res.ok
  } catch (e) {
    console.warn('[Dashboard] Cloud save error', e)
    return false
  }
}

export async function loadFromCloud(): Promise<DashboardData | null> {
  const token = getSessionToken()
  if (!token) return null

  try {
    const res = await fetch(`${API_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch (e) {
    console.warn('[Dashboard] Cloud load error', e)
    return null
  }
}

// ── Combined Load (cloud優先 → localStorage fallback) ──

export async function loadDashboardData(): Promise<DashboardData> {
  // PRO + sessionToken → try cloud first
  const token = getSessionToken()
  if (token) {
    const cloudData = await loadFromCloud()
    if (cloudData) {
      // Cloud data found → also save to localStorage as cache
      saveToLocal(cloudData)
      return cloudData
    }
  }

  // Fallback to localStorage
  const localData = loadFromLocal()
  if (localData) return localData

  return EMPTY_DATA
}

// ── Auto-save Manager ──

let _saveTimer: ReturnType<typeof setInterval> | null = null
let _lastSaved: string = ''
let _statusCallback: ((status: SaveStatus) => void) | null = null

export function setStatusCallback(cb: (status: SaveStatus) => void) {
  _statusCallback = cb
}

function _setStatus(status: SaveStatus) {
  _statusCallback?.(status)
}

export async function saveDashboardData(data: DashboardData, force = false): Promise<void> {
  const payloadStr = JSON.stringify(data)
  if (!force && payloadStr === _lastSaved) return

  _lastSaved = payloadStr
  _setStatus('saving')

  // localStorage (synchronous, reliable)
  saveToLocal(data)

  // Cloud (async, best-effort)
  const token = getSessionToken()
  if (token) {
    const ok = await saveToCloud(data)
    if (!ok) {
      _setStatus('error')
      return
    }
  }

  _setStatus('saved')
}

export function startAutoSave(getData: () => DashboardData) {
  stopAutoSave()

  // beforeunload → localStorage guaranteed write
  const onBeforeUnload = () => {
    const data = getData()
    const payloadStr = JSON.stringify(data)
    if (payloadStr !== _lastSaved) {
      saveToLocal(data)
      _lastSaved = payloadStr
    }
  }
  window.addEventListener('beforeunload', onBeforeUnload)

  // 30-second interval cloud sync
  _saveTimer = setInterval(() => {
    const data = getData()
    const payloadStr = JSON.stringify(data)
    if (payloadStr !== _lastSaved) {
      saveDashboardData(data, true)
    }
  }, 30000)

  // Store cleanup ref
  ;(window as any).__dashboardCleanup = () => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    if (_saveTimer) { clearInterval(_saveTimer); _saveTimer = null }
  }
}

export function stopAutoSave() {
  const cleanup = (window as any)?.__dashboardCleanup
  if (cleanup) cleanup()
}

// ── Immediate save (on every state change) ──

let _pendingDirty = false

export async function markDirty(data: DashboardData): Promise<void> {
  const payloadStr = JSON.stringify(data)
  if (payloadStr === _lastSaved) return

  // Always save to localStorage immediately
  saveToLocal(data)
  _lastSaved = payloadStr
  _setStatus('saving')

  // Debounced cloud save
  const token = getSessionToken()
  if (token) {
    const ok = await saveToCloud(data)
    _setStatus(ok ? 'saved' : 'error')
  } else {
    _setStatus('saved')
  }
}
