/**
 * J-OSLER Storage — localStorage + Cloudflare Worker クラウド同期
 * 
 * dashboard-storage.ts と同じパターン:
 * - localStorage: 即時・同期・確実
 * - Worker API: 非同期・クラウドバックアップ（sessionToken必須）
 * - 自動保存: 30秒間隔 + 変更検知
 */

import { EpocData, createDefaultEpocData } from './epoc-data'
import { UserCreditsData } from './credits-data'

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'
const LS_KEY = 'iwor_josler_data'
const EPOC_LS_KEY = 'iwor_epoc_data'
const MODE_LS_KEY = 'iwor_record_mode'
const CREDITS_LS_KEY = 'iwor_credits_data'

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error' | 'offline'

export interface JoslerData {
  eg: any
  summaries: any[]
  other: any
}

// ── localStorage ──

export function saveToLocal(data: JoslerData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[Josler] localStorage write error', e)
  }
}

export function loadFromLocal(): JoslerData | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as JoslerData
  } catch (e) {
    console.warn('[Josler] localStorage read error', e)
    return null
  }
}

// ── Cloud Sync (Worker API) ──

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('iwor_session_token') || null
}

export async function saveToCloud(data: JoslerData): Promise<boolean> {
  const token = getSessionToken()
  if (!token) return false

  try {
    const res = await fetch(`${API_URL}/api/josler`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    })
    return res.ok
  } catch (e) {
    console.warn('[Josler] Cloud save error', e)
    return false
  }
}

export async function loadFromCloud(): Promise<JoslerData | null> {
  const token = getSessionToken()
  if (!token) return null

  try {
    const res = await fetch(`${API_URL}/api/josler`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch (e) {
    console.warn('[Josler] Cloud load error', e)
    return null
  }
}

// ── Combined Load (cloud優先 → localStorage fallback) ──

export async function loadJoslerData(): Promise<JoslerData | null> {
  const token = getSessionToken()
  if (token) {
    const cloudData = await loadFromCloud()
    if (cloudData) {
      saveToLocal(cloudData)
      return cloudData
    }
  }
  return loadFromLocal()
}

// ── Save with status ──

let _lastSaved: string = ''
let _statusCallback: ((status: SaveStatus) => void) | null = null

export function setStatusCallback(cb: (status: SaveStatus) => void) {
  _statusCallback = cb
}

function _setStatus(status: SaveStatus) {
  _statusCallback?.(status)
}

export async function saveJoslerData(data: JoslerData, force = false): Promise<void> {
  const payloadStr = JSON.stringify(data)
  if (!force && payloadStr === _lastSaved) return

  _lastSaved = payloadStr
  _setStatus('saving')

  saveToLocal(data)

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

// ── Auto-save Manager ──

let _saveTimer: ReturnType<typeof setInterval> | null = null

export function startAutoSave(getData: () => JoslerData) {
  stopAutoSave()

  const onBeforeUnload = () => {
    const data = getData()
    const payloadStr = JSON.stringify(data)
    if (payloadStr !== _lastSaved) {
      saveToLocal(data)
      _lastSaved = payloadStr
    }
  }
  window.addEventListener('beforeunload', onBeforeUnload)

  _saveTimer = setInterval(() => {
    const data = getData()
    const payloadStr = JSON.stringify(data)
    if (payloadStr !== _lastSaved) {
      saveJoslerData(data, true)
    }
  }, 30000)

  ;(window as any).__joslerCleanup = () => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    if (_saveTimer) { clearInterval(_saveTimer); _saveTimer = null }
  }
}

export function stopAutoSave() {
  const cleanup = (window as any)?.__joslerCleanup
  if (cleanup) cleanup()
}

// ══════════════════════════════════════
//  EPOC Storage
// ══════════════════════════════════════

export type RecordMode = 'josler' | 'epoc'

export function loadRecordMode(): RecordMode {
  try {
    const raw = localStorage.getItem(MODE_LS_KEY)
    if (raw === 'epoc') return 'epoc'
  } catch {}
  return 'josler'
}

export function saveRecordMode(mode: RecordMode): void {
  try { localStorage.setItem(MODE_LS_KEY, mode) } catch {}
}

export function saveEpocToLocal(data: EpocData): void {
  try { localStorage.setItem(EPOC_LS_KEY, JSON.stringify(data)) } catch {}
}

export function loadEpocFromLocal(): EpocData {
  try {
    const raw = localStorage.getItem(EPOC_LS_KEY)
    if (raw) return JSON.parse(raw) as EpocData
  } catch {}
  return createDefaultEpocData()
}

export async function saveEpocToCloud(data: EpocData): Promise<boolean> {
  const token = getSessionToken()
  if (!token) return false
  try {
    const res = await fetch(`${API_URL}/api/epoc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ data }),
    })
    return res.ok
  } catch { return false }
}

export async function loadEpocFromCloud(): Promise<EpocData | null> {
  const token = getSessionToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_URL}/api/epoc`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch { return null }
}

export async function loadEpocData(): Promise<EpocData> {
  const token = getSessionToken()
  if (token) {
    const cloudData = await loadEpocFromCloud()
    if (cloudData) {
      saveEpocToLocal(cloudData)
      return cloudData
    }
  }
  return loadEpocFromLocal()
}

// ══════════════════════════════════════
//  Credits Storage (専門医単位)
// ══════════════════════════════════════

const defaultCreditsData: UserCreditsData = {
  selectedSpecialty: null,
  entries: [],
  targetDate: undefined,
}

export function saveCreditsToLocal(data: UserCreditsData): void {
  try { localStorage.setItem(CREDITS_LS_KEY, JSON.stringify(data)) } catch {}
}

export function loadCreditsFromLocal(): UserCreditsData {
  try {
    const raw = localStorage.getItem(CREDITS_LS_KEY)
    if (raw) return JSON.parse(raw) as UserCreditsData
  } catch {}
  return { ...defaultCreditsData }
}

export async function saveCreditsToCloud(data: UserCreditsData): Promise<boolean> {
  const token = getSessionToken()
  if (!token) return false
  try {
    const res = await fetch(`${API_URL}/api/credits`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ data }),
    })
    return res.ok
  } catch { return false }
}

export async function loadCreditsFromCloud(): Promise<UserCreditsData | null> {
  const token = getSessionToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_URL}/api/credits`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch { return null }
}

export async function loadCreditsData(): Promise<UserCreditsData> {
  const token = getSessionToken()
  if (token) {
    const cloudData = await loadCreditsFromCloud()
    if (cloudData) {
      saveCreditsToLocal(cloudData)
      return cloudData
    }
  }
  return loadCreditsFromLocal()
}
