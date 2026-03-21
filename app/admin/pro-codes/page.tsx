'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'

const planLabels: Record<string, { label: string; color: string }> = {
  pro_1y: { label: '1年パス', color: 'bg-acl text-ac' },
  pro_2y: { label: '2年パス', color: 'bg-wnl text-wn' },
  pro_3y: { label: '3年パス', color: 'bg-[#EDE9FE] text-[#6D28D9]' },
  unknown: { label: '不明', color: 'bg-s1 text-muted' },
}

interface Order {
  orderNumber: string
  productName: string
  buyerEmail: string
  plan: string
  durationDays: number
  storedAt: string
  activated: boolean
  activatedAt: string | null
  expiresAt: string | null
}

export default function ProCodesPage() {
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 手動追加用
  const [newOrder, setNewOrder] = useState('')
  const [newPlan, setNewPlan] = useState('iwor PRO 1年パス')
  const [addLoading, setAddLoading] = useState(false)

  const fetchOrders = useCallback(async (key: string) => {
    if (!API_URL) {
      setError('NEXT_PUBLIC_API_URL が未設定です。Worker をデプロイしてください。')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/orders?key=${encodeURIComponent(key)}`)
      if (res.status === 403) {
        setError('Admin Keyが正しくありません。')
        setIsAuthenticated(false)
        return
      }
      const data = await res.json()
      setOrders(data.orders || [])
      setIsAuthenticated(true)
    } catch {
      setError('APIに接続できません。Worker URLを確認してください。')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = () => {
    if (!adminKey.trim()) return
    fetchOrders(adminKey)
  }

  const handleAddOrder = async () => {
    if (!newOrder.trim()) return
    setAddLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/add-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ orderNumber: newOrder.trim(), productName: newPlan }),
      })
      if (res.ok) {
        setNewOrder('')
        fetchOrders(adminKey)
      }
    } catch { /* ignore */ }
    setAddLoading(false)
  }

  // 集計
  const total = orders.length
  const activated = orders.filter(o => o.activated).length
  const pending = total - activated

  // ── 未認証 ──
  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <div className="bg-s0 border border-br rounded-2xl p-8 text-center">
          <h1 className="text-lg font-bold text-tx mb-4">PROコード管理</h1>
          {!API_URL && (
            <div className="bg-wnl border border-wnb rounded-xl p-3 mb-4 text-xs text-wn text-left">
              <p className="font-bold mb-1">Worker未デプロイ</p>
              <p>workers/ ディレクトリの手順に従って Cloudflare Worker をデプロイし、NEXT_PUBLIC_API_URL を設定してください。</p>
            </div>
          )}
          <input
            type="password"
            placeholder="Admin Key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
            className="w-full h-12 px-4 bg-bg border border-br rounded-xl text-sm mb-3 outline-none focus:border-ac"
          />
          {error && <p className="text-xs text-dn mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={!adminKey.trim() || loading}
            className="w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac2 transition-colors disabled:opacity-50"
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </div>
      </div>
    )
  }

  // ── ダッシュボード ──
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx mb-1">PROコード管理</h1>
          <p className="text-sm text-muted">注文番号 → アクティベーション状況</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchOrders(adminKey)} className="text-sm text-ac hover:text-ac2">
            ↻ 更新
          </button>
          <Link href="/admin" className="text-sm text-muted hover:text-ac">← 管理画面</Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-1">総注文数</p>
          <p className="text-3xl font-bold text-tx">{total}</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-1">有効化済み</p>
          <p className="text-3xl font-bold text-ok">{activated}</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-1">未使用</p>
          <p className="text-3xl font-bold text-wn">{pending}</p>
        </div>
      </div>

      {/* 手動追加 */}
      <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-tx mb-3">注文を手動追加</h2>
        <div className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="注文番号"
            value={newOrder}
            onChange={e => setNewOrder(e.target.value.replace(/\D/g, ''))}
            className="flex-1 h-10 px-3 bg-bg border border-br rounded-lg text-sm font-mono outline-none focus:border-ac"
          />
          <select
            value={newPlan}
            onChange={e => setNewPlan(e.target.value)}
            className="h-10 px-3 bg-bg border border-br rounded-lg text-sm outline-none focus:border-ac"
          >
            <option value="iwor PRO 1年パス">1年パス</option>
            <option value="iwor PRO 2年パス">2年パス</option>
            <option value="iwor PRO 3年パス">3年パス</option>
          </select>
          <button
            onClick={handleAddOrder}
            disabled={!newOrder.trim() || addLoading}
            className="px-4 h-10 bg-ac text-white rounded-lg text-sm font-bold hover:bg-ac2 transition-colors disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </div>

      {/* 注文一覧 */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden">
        <div className="p-5 border-b border-br">
          <h2 className="text-sm font-semibold text-tx">注文一覧</h2>
        </div>
        <div className="divide-y divide-br">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              注文データがありません。
            </div>
          ) : (
            orders.map(order => {
              const info = planLabels[order.plan] || planLabels.unknown
              return (
                <div key={order.orderNumber} className="px-5 py-3 flex items-center gap-3 text-xs">
                  <span className="font-mono font-bold text-tx w-24">#{order.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${info.color}`}>
                    {info.label}
                  </span>
                  <span className="text-muted flex-1 truncate">{order.productName}</span>
                  <span className="text-muted">
                    {new Date(order.storedAt).toLocaleDateString('ja-JP')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    order.activated ? 'bg-okl text-ok' : 'bg-wnl text-wn'
                  }`}>
                    {order.activated ? '有効化済' : '未使用'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
