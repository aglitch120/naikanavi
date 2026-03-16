'use client'

import { useState, useEffect, useCallback } from 'react'

// ── PRO判定（Phase対応） ──
// Phase 1: localStorage判定 + 有効期限チェック
// Phase 2: Supabase Auth + subscriptions テーブル判定
// この1ファイルを差し替えるだけで移行完了

const PRO_KEY = 'iwor_pro_user'
const EXPIRES_KEY = 'iwor_pro_expires_at'

/** 有効期限をチェックし、期限切れなら自動無効化 */
function checkProValidity(): boolean {
  if (typeof window === 'undefined') return false
  const isPro = localStorage.getItem(PRO_KEY) === 'true'
  if (!isPro) return false
  
  const expiresAt = localStorage.getItem(EXPIRES_KEY)
  if (!expiresAt) return true // 旧バージョン互換（期限なし＝有効）
  
  if (new Date() > new Date(expiresAt)) {
    // 期限切れ → 自動無効化
    localStorage.removeItem(PRO_KEY)
    localStorage.setItem('iwor_pro_expired', 'true')
    return false
  }
  return true
}

/** PRO会員かどうかを判定するフック */
export function useProStatus() {
  const [isPro, setIsPro] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Phase 1: localStorage判定 + 有効期限チェック
    const status = checkProValidity()
    setIsPro(status)
    setIsLoading(false)

    // Phase 2 ではここを Supabase セッション判定に差し替え:
    // const { data: { session } } = await supabase.auth.getSession()
    // if (session) {
    //   const { data } = await supabase
    //     .from('subscriptions')
    //     .select('status')
    //     .eq('user_id', session.user.id)
    //     .single()
    //   setIsPro(data?.status === 'active')
    // }
  }, [])

  /** PRO状態の再チェック（アクティベーション後に呼ぶ） */
  const refresh = useCallback(() => {
    const status = checkProValidity()
    setIsPro(status)
  }, [])

  return { isPro, isLoading, refresh }
}

/** PRO状態を同期的に取得（イベントハンドラ内で使用） */
export function getProStatus(): boolean {
  return checkProValidity()
}

// ── PLGタッチポイント管理 ──
const HINT_KEYS = {
  favPulse: 'iwor_fav_hint_shown',
  thirdUse: 'iwor_third_use_banner_shown',
  copyToast: 'iwor_copy_toast_shown',
} as const

/** ツール利用回数をカウント */
export function trackToolUsage(slug: string) {
  if (typeof window === 'undefined') return
  const key = 'iwor_tool_usage'
  try {
    const usage = JSON.parse(localStorage.getItem(key) || '{}')
    usage[slug] = (usage[slug] || 0) + 1
    usage._total = (usage._total || 0) + 1
    localStorage.setItem(key, JSON.stringify(usage))
  } catch { /* ignore */ }
}

/** 合計ツール利用回数を取得 */
export function getTotalToolUsage(): number {
  if (typeof window === 'undefined') return 0
  try {
    const usage = JSON.parse(localStorage.getItem('iwor_tool_usage') || '{}')
    return usage._total || 0
  } catch { return 0 }
}

/** PLGヒントの表示済みフラグ管理 */
export function useHintStatus(key: keyof typeof HINT_KEYS) {
  const storageKey = HINT_KEYS[key]

  const isShown = useCallback((): boolean => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(storageKey) === 'true'
  }, [storageKey])

  const markShown = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true')
    }
  }, [storageKey])

  return { isShown, markShown }
}
