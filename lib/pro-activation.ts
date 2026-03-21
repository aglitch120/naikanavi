/**
 * PRO 認証（注文番号で会員登録 + メール/パスワードでログイン）
 */

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'

// ── 会員登録 ──

interface RegisterResult {
  success: boolean
  email?: string
  password?: string
  plan?: string
  expiresAt?: string
  error?: string
}

export async function registerWithOrderNumber(orderNumber: string, email: string): Promise<RegisterResult> {
  const cleanedOrder = orderNumber.trim().replace(/\D/g, '')
  const cleanedEmail = email.trim().toLowerCase()

  if (!cleanedOrder || cleanedOrder.length < 5 || cleanedOrder.length > 12) {
    return { success: false, error: '注文番号を正しく入力してください（数字5〜12桁）' }
  }
  if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
    return { success: false, error: 'メールアドレスを正しく入力してください' }
  }

  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: cleanedOrder,
        email: cleanedEmail,
      }),
    })
    const data = await res.json()

    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || '登録に失敗しました。' }
    }

    // localStorage に保存
    saveProSession(data.email, data.plan, data.expiresAt, data.sessionToken)

    return {
      success: true,
      email: data.email,
      password: data.password,
      plan: data.plan,
      expiresAt: data.expiresAt,
    }
  } catch {
    return { success: false, error: 'サーバーに接続できませんでした。' }
  }
}

// ── プロフィール更新 ──

export interface UserProfile {
  role: string       // 必須: 'student' | 'doctor'
  university?: string
  graduationYear?: string
  hospitalSize?: string
  specialty?: string
}

export async function updateProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem('iwor_session_token') || ''
    : ''
  if (!sessionToken) return { success: false, error: '認証情報がありません。' }

  try {
    const res = await fetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(profile),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'プロフィールの保存に失敗しました。' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'サーバーに接続できませんでした。' }
  }
}

// ── ログイン ──

interface LoginResult {
  success: boolean
  email?: string
  plan?: string
  expiresAt?: string
  expired?: boolean
  error?: string
}

export async function loginWithEmail(email: string, password: string): Promise<LoginResult> {
  const cleanedEmail = email.trim().toLowerCase()

  if (!cleanedEmail || !password) {
    return { success: false, error: 'メールアドレスとパスワードを入力してください' }
  }

  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanedEmail, password }),
    })
    const data = await res.json()

    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'ログインに失敗しました。' }
    }

    if (data.expired) {
      clearProSession()
      return { success: false, error: 'PRO会員の期限が切れています。' }
    }

    saveProSession(data.email, data.plan, data.expiresAt, data.sessionToken)

    return {
      success: true,
      email: data.email,
      plan: data.plan,
      expiresAt: data.expiresAt,
    }
  } catch {
    return { success: false, error: 'サーバーに接続できませんでした。' }
  }
}

// ── パスワード変更 ──

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem('iwor_session_token') || ''
    : ''
  if (!sessionToken) return { success: false, error: '認証情報がありません。再ログインしてください。' }

  try {
    const res = await fetch(`${API_URL}/api/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'パスワード変更に失敗しました。' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'サーバーに接続できませんでした。' }
  }
}

// ── プロフィール取得 ──

export interface FetchedProfile {
  email: string
  plan: string
  expiresAt: string
  registeredAt: string
  role: string | null
  university: string | null
  graduationYear: string | null
  hospitalSize: string | null
  specialty: string | null
}

export async function fetchProfile(): Promise<{ success: boolean; profile?: FetchedProfile; error?: string }> {
  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem('iwor_session_token') || ''
    : ''
  if (!sessionToken) return { success: false, error: '認証情報がありません。' }

  try {
    const res = await fetch(`${API_URL}/api/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'プロフィール取得に失敗しました。' }
    }
    return { success: true, profile: data as FetchedProfile }
  } catch {
    return { success: false, error: 'サーバーに接続できませんでした。' }
  }
}

// ── パスワードリセット ──

interface ResetResult {
  success: boolean
  email?: string
  password?: string
  error?: string
}

export async function resetPassword(orderNumber: string, email: string): Promise<ResetResult> {
  const cleanedOrder = orderNumber.trim().replace(/\D/g, '')
  const cleanedEmail = email.trim().toLowerCase()

  if (!cleanedOrder || cleanedOrder.length < 5 || cleanedOrder.length > 12) {
    return { success: false, error: '注文番号を正しく入力してください（数字5〜12桁）' }
  }
  if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
    return { success: false, error: 'メールアドレスを正しく入力してください' }
  }

  try {
    const res = await fetch(`${API_URL}/api/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: cleanedOrder, email: cleanedEmail }),
    })
    const data = await res.json()

    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'パスワードの再設定に失敗しました。' }
    }

    return {
      success: true,
      email: data.email,
      password: data.password,
    }
  } catch {
    return { success: false, error: 'サーバーに接続できませんでした。' }
  }
}

// ── セッション管理 ──

function saveProSession(email: string, plan: string, expiresAt: string, sessionToken?: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('iwor_pro_user', 'true')
  localStorage.setItem('iwor_pro_email', email)
  localStorage.setItem('iwor_pro_plan', plan || 'pro_1y')
  localStorage.setItem('iwor_pro_expires_at', expiresAt || '')
  if (sessionToken) {
    localStorage.setItem('iwor_session_token', sessionToken)
  }
}

export function getProDetails() {
  if (typeof window === 'undefined') return null
  const isPro = localStorage.getItem('iwor_pro_user') === 'true'
  if (!isPro) return null

  return {
    email: localStorage.getItem('iwor_pro_email') || '',
    plan: localStorage.getItem('iwor_pro_plan') || 'unknown',
    expiresAt: localStorage.getItem('iwor_pro_expires_at') || '',
    sessionToken: localStorage.getItem('iwor_session_token') || '',
  }
}

export function clearProSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('iwor_pro_user')
  localStorage.removeItem('iwor_pro_email')
  localStorage.removeItem('iwor_pro_plan')
  localStorage.removeItem('iwor_pro_expires_at')
  localStorage.removeItem('iwor_session_token')
  // 旧キーも掃除
  localStorage.removeItem('iwor_pro_activated_at')
  localStorage.removeItem('iwor_pro_order')
}
