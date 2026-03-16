/**
 * PRO アクティベーションコード検証
 * Phase 1: クライアントサイドSHA-256ハッシュ検証
 * Phase 2: Supabase API検証に差し替え
 */

import codesData from './pro-codes-generated.json'

interface CodeEntry {
  hash: string
  plan: string
  durationDays: number
  createdAt: string
  used: boolean
}

interface ActivationResult {
  success: boolean
  plan?: string
  durationDays?: number
  expiresAt?: string
  error?: string
}

/** Web Crypto API でSHA-256ハッシュを計算 */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** コードのフォーマットを正規化（大文字化、空白除去） */
function normalizeCode(code: string): string {
  return code.toUpperCase().trim().replace(/\s+/g, '')
}

/** コードフォーマットの検証 */
function isValidFormat(code: string): boolean {
  return /^IWOR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)
}

/** ローカルで使用済みコードかチェック */
function isCodeUsedLocally(hash: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const usedCodes = JSON.parse(localStorage.getItem('iwor_used_codes') || '[]')
    return usedCodes.includes(hash)
  } catch { return false }
}

/** コードを使用済みとしてローカルに記録 */
function markCodeUsedLocally(hash: string): void {
  if (typeof window === 'undefined') return
  try {
    const usedCodes = JSON.parse(localStorage.getItem('iwor_used_codes') || '[]')
    usedCodes.push(hash)
    localStorage.setItem('iwor_used_codes', JSON.stringify(usedCodes))
  } catch { /* ignore */ }
}

/**
 * アクティベーションコードを検証し、PRO状態を有効化
 */
export async function activateProCode(rawCode: string): Promise<ActivationResult> {
  const code = normalizeCode(rawCode)
  
  // フォーマットチェック
  if (!isValidFormat(code)) {
    return { success: false, error: 'コードの形式が正しくありません。IWOR-XXXX-XXXX-XXXX の形式で入力してください。' }
  }

  // ハッシュ計算
  const hash = await sha256(code)
  
  // ハッシュ照合
  const entries = (codesData as { codes: CodeEntry[] }).codes
  const match = entries.find(e => e.hash === hash)
  
  if (!match) {
    return { success: false, error: '無効なコードです。入力内容を確認してください。' }
  }

  // 使用済みチェック（ローカル）
  if (isCodeUsedLocally(hash)) {
    return { success: false, error: 'このコードは既に使用されています。' }
  }

  // アクティベーション実行
  const now = new Date()
  const expiresAt = new Date(now.getTime() + match.durationDays * 24 * 60 * 60 * 1000)

  // localStorage に保存
  if (typeof window !== 'undefined') {
    localStorage.setItem('iwor_pro_user', 'true')
    localStorage.setItem('iwor_pro_plan', match.plan)
    localStorage.setItem('iwor_pro_activated_at', now.toISOString())
    localStorage.setItem('iwor_pro_expires_at', expiresAt.toISOString())
    localStorage.setItem('iwor_pro_code_hash', hash)
    
    // コードを使用済みに
    markCodeUsedLocally(hash)
  }

  return {
    success: true,
    plan: match.plan,
    durationDays: match.durationDays,
    expiresAt: expiresAt.toISOString(),
  }
}

/** PRO状態の詳細情報を取得 */
export function getProDetails() {
  if (typeof window === 'undefined') return null
  const isPro = localStorage.getItem('iwor_pro_user') === 'true'
  if (!isPro) return null
  
  return {
    plan: localStorage.getItem('iwor_pro_plan') || 'unknown',
    activatedAt: localStorage.getItem('iwor_pro_activated_at') || '',
    expiresAt: localStorage.getItem('iwor_pro_expires_at') || '',
    codeHash: localStorage.getItem('iwor_pro_code_hash') || '',
  }
}

/** PRO状態をリセット（デバッグ・退会用） */
export function resetProStatus(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('iwor_pro_user')
  localStorage.removeItem('iwor_pro_plan')
  localStorage.removeItem('iwor_pro_activated_at')
  localStorage.removeItem('iwor_pro_expires_at')
  localStorage.removeItem('iwor_pro_code_hash')
}
