import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PROコード管理 | iwor Admin',
  robots: { index: false, follow: false },
}

interface CodeEntry {
  hash: string
  plan: string
  durationDays: number
  createdAt: string
  used: boolean
}

function loadCodes(): CodeEntry[] {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'pro-codes-generated.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    return data.codes || []
  } catch {
    return []
  }
}

const planLabels: Record<string, { label: string; color: string }> = {
  pro_1y: { label: '1年パス', color: 'bg-acl text-ac' },
  pro_2y: { label: '2年パス', color: 'bg-wnl text-wn' },
  pro_3y: { label: '3年パス', color: 'bg-[#EDE9FE] text-[#6D28D9]' },
}

export default function ProCodesPage() {
  const codes = loadCodes()

  // 集計
  const total = codes.length
  const usedCount = codes.filter(c => c.used).length
  const unusedCount = total - usedCount
  const byPlan = codes.reduce<Record<string, { total: number; used: number }>>((acc, c) => {
    if (!acc[c.plan]) acc[c.plan] = { total: 0, used: 0 }
    acc[c.plan].total++
    if (c.used) acc[c.plan].used++
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx mb-1">PROコード管理</h1>
          <p className="text-sm text-muted">アクティベーションコードの在庫状況</p>
        </div>
        <Link href="/admin" className="text-sm text-ac hover:text-ac2 transition-colors">
          ← 管理画面に戻る
        </Link>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-2">総コード数</p>
          <p className="text-3xl font-bold text-tx">{total}</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-2">未使用</p>
          <p className="text-3xl font-bold text-ok">{unusedCount}</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-2">使用済み</p>
          <p className="text-3xl font-bold text-wn">{usedCount}</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-5">
          <p className="text-xs text-muted mb-2">使用率</p>
          <p className="text-3xl font-bold text-tx">{total > 0 ? Math.round(usedCount / total * 100) : 0}%</p>
        </div>
      </div>

      {/* プラン別集計 */}
      <div className="bg-s0 border border-br rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-tx mb-4">プラン別在庫</h2>
        <div className="space-y-3">
          {Object.entries(byPlan).map(([plan, stats]) => {
            const info = planLabels[plan] || { label: plan, color: 'bg-s1 text-muted' }
            return (
              <div key={plan} className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${info.color}`}>
                  {info.label}
                </span>
                <div className="flex-1 h-2 bg-s1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ac rounded-full transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.used / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-muted whitespace-nowrap">
                  {stats.used}/{stats.total} 使用
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* コード一覧 */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden mb-8">
        <div className="p-5 border-b border-br flex items-center justify-between">
          <h2 className="text-sm font-semibold text-tx">コード一覧</h2>
          <span className="text-xs text-muted">ハッシュの先頭8文字のみ表示</span>
        </div>
        <div className="divide-y divide-br">
          {codes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              コードがまだ生成されていません。
              <br />
              <code className="text-xs bg-s1 px-2 py-1 rounded mt-2 inline-block">
                node scripts/generate-pro-codes.mjs --plan pro_1y --count 10
              </code>
            </div>
          ) : (
            codes.map((code, i) => {
              const info = planLabels[code.plan] || { label: code.plan, color: 'bg-s1 text-muted' }
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-3 text-xs">
                  <span className="font-mono text-muted w-20">{code.hash.slice(0, 8)}…</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${info.color}`}>
                    {info.label}
                  </span>
                  <span className="text-muted flex-1">
                    {new Date(code.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    code.used ? 'bg-wnl text-wn' : 'bg-okl text-ok'
                  }`}>
                    {code.used ? '使用済み' : '未使用'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* コード生成方法 */}
      <div className="bg-s0 border border-br rounded-xl p-5">
        <h2 className="text-sm font-semibold text-tx mb-3">コード追加方法</h2>
        <div className="bg-s1 rounded-lg p-4">
          <pre className="text-xs text-tx font-mono whitespace-pre-wrap leading-relaxed">{`# 1年パスを10個生成
node scripts/generate-pro-codes.mjs --plan pro_1y --count 10

# 2年パスを5個生成
node scripts/generate-pro-codes.mjs --plan pro_2y --count 5

# 3年パスを5個生成
node scripts/generate-pro-codes.mjs --plan pro_3y --count 5

# 生成後、コミット＆デプロイ
git add lib/pro-codes-generated.json
git commit -m "feat: add PRO activation codes"
git push`}</pre>
        </div>
        <p className="text-xs text-muted mt-3">
          ※ 生成されたコードはコンソールに表示されます。BOOTH商品の購入完了メッセージに貼り付けてください。
        </p>
      </div>
    </div>
  )
}
