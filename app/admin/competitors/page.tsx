'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'

interface Alert {
  id: string
  title: string
  url: string
  source: string
  matchedKeywords: string[]
  threatLevel: 'critical' | 'high' | 'medium' | 'low'
  competitor: string
  publishedAt: string
  fetchedAt: string
  dismissed: boolean
}

const THREAT_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: 'Critical', bg: 'var(--dnl)', text: 'var(--dn)', border: 'var(--dnb)' },
  high:     { label: 'High',     bg: '#FEF3C7',   text: '#92400E', border: '#FCD34D' },
  medium:   { label: 'Medium',   bg: 'var(--acl)', text: 'var(--ac)', border: '#86EFAC' },
  low:      { label: 'Low',      bg: 'var(--s1)',  text: 'var(--m)',  border: 'var(--br)' },
}

const COMPETITOR_TABS = ['すべて', 'HOKUTO', 'MOTiCAN', 'Ubie', 'ヒポクラ', 'Antaa', 'm3', 'その他']
const THREAT_LEVELS = ['all', 'critical', 'high', 'medium', 'low'] as const

export default function CompetitorsPage() {
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState('すべて')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [showDismissed, setShowDismissed] = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/competitors/alerts`, {
        headers: { 'X-Admin-Key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setAlerts(data.alerts || [])
      setTotal(data.total || 0)
      setIsAuthenticated(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    }
    setLoading(false)
  }, [adminKey])

  const dismissAlert = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/api/competitors/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ id }),
      })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))
    } catch {}
  }, [adminKey])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('iwor_admin_key') : null
    if (saved) {
      setAdminKey(saved)
    }
  }, [])

  const handleLogin = () => {
    localStorage.setItem('iwor_admin_key', adminKey)
    fetchAlerts()
  }

  const filtered = alerts.filter(a => {
    if (!showDismissed && a.dismissed) return false
    if (selectedCompetitor !== 'すべて' && a.competitor !== selectedCompetitor) return false
    if (selectedLevel !== 'all' && a.threatLevel !== selectedLevel) return false
    return true
  })

  const threatCounts = alerts.reduce((acc, a) => {
    if (!a.dismissed) acc[a.threatLevel] = (acc[a.threatLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <h1 className="text-xl font-bold text-tx mb-4">競合監視ダッシュボード</h1>
        <div className="bg-s0 border border-br rounded-xl p-6">
          <label className="block text-sm text-muted mb-2">Admin Key</label>
          <input
            type="password"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm mb-3"
            placeholder="X-Admin-Key"
          />
          <button
            onClick={handleLogin}
            className="w-full py-2 bg-ac text-white rounded-lg text-sm font-medium hover:bg-ac2 transition-colors"
          >
            ログイン
          </button>
          {error && <p className="text-sm text-dn mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx mb-1">競合監視</h1>
          <p className="text-sm text-muted">PR TIMES 自動フェッチ / アラート {total}件</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="px-3 py-1.5 bg-ac text-white rounded-lg text-xs font-medium hover:bg-ac2 transition-colors disabled:opacity-50"
          >
            {loading ? '取得中...' : '更新'}
          </button>
          <Link href="/admin" className="px-3 py-1.5 border border-br rounded-lg text-xs text-muted hover:text-ac transition-colors">
            ← 管理画面
          </Link>
        </div>
      </div>

      {/* 脅威レベルサマリー */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['critical', 'high', 'medium', 'low'] as const).map(level => {
          const s = THREAT_STYLES[level]
          const count = threatCounts[level] || 0
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(prev => prev === level ? 'all' : level)}
              className={`rounded-xl p-4 text-left transition-all ${selectedLevel === level ? 'ring-2 ring-offset-1' : ''}`}
              style={{
                background: s.bg,
                borderColor: s.border,
                borderWidth: '1px',
                borderStyle: 'solid',
                ...(selectedLevel === level ? { ringColor: s.text } : {}),
              }}
            >
              <p className="text-[11px] font-medium mb-1" style={{ color: s.text }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.text }}>{count}</p>
            </button>
          )
        })}
      </div>

      {/* 競合別タブ */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {COMPETITOR_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedCompetitor(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCompetitor === tab
                ? 'bg-ac text-white'
                : 'bg-s0 text-muted border border-br hover:text-ac'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* フィルタオプション */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={e => setShowDismissed(e.target.checked)}
            className="rounded"
          />
          非表示済みも表示
        </label>
        <span className="text-xs text-muted">表示: {filtered.length}件</span>
      </div>

      {/* アラート一覧 */}
      {filtered.length === 0 ? (
        <div className="bg-s0 border border-br rounded-xl p-12 text-center">
          <p className="text-muted text-sm">アラートはありません</p>
          <p className="text-muted text-xs mt-1">Cron が日次で PR TIMES をチェックしています</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const s = THREAT_STYLES[alert.threatLevel]
            return (
              <div
                key={alert.id}
                className={`bg-s0 border rounded-xl p-4 transition-opacity ${alert.dismissed ? 'opacity-40' : ''}`}
                style={{ borderColor: s.border }}
              >
                <div className="flex items-start gap-3">
                  {/* 脅威レベルバッジ */}
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: s.bg, color: s.text }}
                  >
                    {s.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-tx hover:text-ac transition-colors line-clamp-2"
                    >
                      {alert.title}
                    </a>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-acl text-ac font-medium">
                        {alert.competitor}
                      </span>
                      {alert.matchedKeywords.map(k => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-s1 text-muted">
                          {k}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
                      <span>{new Date(alert.publishedAt).toLocaleDateString('ja-JP')}</span>
                      <span>取得: {new Date(alert.fetchedAt).toLocaleDateString('ja-JP')}</span>
                      <span>{alert.source}</span>
                    </div>
                  </div>

                  {/* 非表示ボタン */}
                  {!alert.dismissed && (
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-xs text-muted hover:text-dn transition-colors flex-shrink-0"
                      title="非表示にする"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
