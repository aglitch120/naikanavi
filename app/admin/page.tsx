'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ═══════════════════════════════════════════════════════════════
//  iwor CEO Dashboard — 統合管理画面
//  8タブ: Overview / Competitors / SEO / Content / Tools / Brand / Security / Users
// ═══════════════════════════════════════════════════════════════

const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'O' },
  { id: 'funnel', label: 'Funnel', icon: 'F' },
  { id: 'health', label: 'Health', icon: 'H' },
  { id: 'competitors', label: 'Competitors', icon: 'C' },
  { id: 'seo', label: 'SEO', icon: 'S' },
  { id: 'content', label: 'Content', icon: 'B' },
  { id: 'tools', label: 'Tools', icon: 'T' },
  { id: 'brand', label: 'Brand', icon: 'E' },
  { id: 'security', label: 'Security', icon: 'K' },
  { id: 'users', label: 'Users', icon: 'U' },
] as const

type TabId = typeof TABS[number]['id']

// ── 共通UI ──

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-s0 border border-br rounded-xl p-5 ${className}`}>{children}</div>
}

function Metric({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-4">
      <p className="text-[11px] text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || 'var(--tx)' }}>{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function Badge({ text, variant = 'default' }: { text: string; variant?: 'ok' | 'warn' | 'danger' | 'default' | 'accent' }) {
  const styles = {
    ok: 'bg-okl text-ok',
    warn: 'bg-wnl text-wn',
    danger: 'bg-dnl text-dn',
    accent: 'bg-acl text-ac',
    default: 'bg-s1 text-muted',
  }
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[variant]}`}>{text}</span>
}

function SectionTitle({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-tx mb-3 flex items-center justify-between">
      {children}
      {badge}
    </h3>
  )
}

function StatusDot({ status }: { status: 'ok' | 'warn' | 'danger' | 'unknown' }) {
  const c = { ok: 'bg-ok', warn: 'bg-wn', danger: 'bg-dn', unknown: 'bg-muted' }
  return <span className={`inline-block w-2 h-2 rounded-full ${c[status]}`} />
}

// ═══════════════════════════════════════════════════════════════
//  Overview Tab
// ═══════════════════════════════════════════════════════════════

function OverviewTab({ adminKey, analysis }: { adminKey: string; analysis: AnalysisData | null }) {
  const [apiHealth, setApiHealth] = useState<'ok' | 'warn' | 'danger' | 'unknown'>('unknown')

  useEffect(() => {
    fetch(`${API_URL}/api/admin/users`, { headers: { 'X-Admin-Key': adminKey } })
      .then(r => setApiHealth(r.ok ? 'ok' : 'danger'))
      .catch(() => setApiHealth('danger'))
  }, [adminKey])

  const milestones = [
    { id: 'M1', date: '2026-04-21', goal: '公式デッキ2つ + ツール精度チェック完了', done: false },
    { id: 'M2', date: '2026-05-21', goal: 'シードユーザー5人中3人が毎日使用', done: false },
    { id: 'M3', date: '2026-06-21', goal: 'アクティブユーザー30人', done: false },
    { id: 'M4', date: '2026-07-21', goal: 'PRO会員10人 (MRR ¥9,800)', done: false },
    { id: 'M5', date: '2027-03-21', goal: 'PRO会員100人 (MRR ¥98,000)', done: false },
  ]

  const departments = [
    { name: 'Legal', status: 'ok' as const, detail: 'SaMD削除済み / explanation全削除 / 免責整備', items: ['BOOTH非公開済み', 'Creem申請待ち', '特商法書き換え待ち'] },
    { name: 'Finance', status: 'warn' as const, detail: 'MRR ¥100 / Creem未接続', items: ['決済基盤未確立', 'PRO会員1名(テスト)', '価格モデル未確定'] },
    { name: 'Product', status: 'ok' as const, detail: '10サービス稼働 / 166計算ツール', items: ['Study MVP完了', '公式デッキ未作成', 'EPOC/JOSLER分離済み'] },
    { name: 'Design', status: 'ok' as const, detail: 'デザインシステム確立 / レスポンシブ対応', items: ['鳥V字型改善済み', 'ProModal心理学実装済み', 'コミットメント階段実装済み'] },
    { name: 'Engineering', status: 'ok' as const, detail: 'Next.js 14 + CF Pages + Workers', items: ['PBKDF2認証', 'KVキャッシュ', 'PubMedバッチ分割'] },
    { name: 'Security', status: apiHealth as 'ok' | 'warn' | 'danger' | 'unknown', detail: 'PBKDF2 + レート制限 + セッション管理', items: ['Worker API正常', 'Admin認証', 'CORS制御'] },
    { name: 'SEO', status: (analysis ? (analysis.seo.avgScore >= 80 ? 'ok' : 'warn') : 'unknown') as 'ok' | 'warn' | 'danger' | 'unknown', detail: `平均スコア ${analysis?.seo.avgScore ?? '?'}点 / ${analysis?.total ?? '?'}記事`, items: [`孤立: ${analysis?.seo.orphanCount ?? '?'}`, `メタ問題: ${analysis?.seo.metaIssueCount ?? '?'}`, `低スコア: ${analysis?.seo.lowScoreCount ?? '?'}`] },
    { name: 'Marketing', status: 'warn' as const, detail: 'X運用開始前 / シードユーザー0人', items: ['週5投稿目標', 'シードユーザー5人声掛け', 'SEO記事量産'] },
  ]

  const coreValues = [
    { name: '速度', check: '3タップで答え。当直中に10秒で使える', status: 'ok' as const },
    { name: '感情', check: '疲弊した脳に負荷をかけない視覚設計', status: 'ok' as const },
    { name: '時間の返却', check: '使った結果として30分早く帰れる', status: 'ok' as const },
    { name: '広告ゼロ', check: '製薬・医療広告ゼロのブランドプロミス', status: 'ok' as const },
    { name: 'SaMD回避', check: '臨床判断支援・診断支援機能なし', status: 'ok' as const },
  ]

  const daysUntilM1 = Math.ceil((new Date('2026-04-21').getTime() - Date.now()) / 86400000)

  return (
    <div className="space-y-6">
      {/* KPIサマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Metric label="MRR" value="¥100" sub="Target: ¥9,800" color="var(--wn)" />
        <Metric label="PRO会員" value="1" sub="Target: 10" color="var(--ac)" />
        <Metric label="記事数" value={analysis?.total ?? '-'} sub="173 published" color="var(--ac)" />
        <Metric label="計算ツール" value="166" sub="+薬剤25+手技15" color="var(--ac)" />
        <Metric label="SEOスコア" value={analysis ? `${analysis.seo.avgScore}点` : '-'} color={analysis && analysis.seo.avgScore >= 80 ? 'var(--ok)' : 'var(--wn)'} />
        <Metric label="M1まで" value={`${daysUntilM1}日`} sub="公式デッキ+ツール検証" color={daysUntilM1 < 14 ? 'var(--dn)' : 'var(--tx)'} />
      </div>

      {/* コアバリュー整合性 */}
      <Card>
        <SectionTitle>Core Value Alignment</SectionTitle>
        <div className="space-y-2">
          {coreValues.map(v => (
            <div key={v.name} className="flex items-center gap-3">
              <StatusDot status={v.status} />
              <span className="text-xs font-medium text-tx w-20">{v.name}</span>
              <span className="text-xs text-muted flex-1">{v.check}</span>
              <Badge text={v.status === 'ok' ? 'Pass' : 'Check'} variant={v.status === 'ok' ? 'ok' : 'warn'} />
            </div>
          ))}
        </div>
      </Card>

      {/* 部門ステータス */}
      <Card>
        <SectionTitle>Department Status</SectionTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {departments.map(d => (
            <div key={d.name} className="border border-br rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={d.status} />
                <span className="text-xs font-bold text-tx">{d.name}</span>
              </div>
              <p className="text-[10px] text-muted mb-2">{d.detail}</p>
              <div className="space-y-0.5">
                {d.items.map((item, i) => (
                  <p key={i} className="text-[10px] text-muted">- {item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* マイルストーン */}
      <Card>
        <SectionTitle>Milestones</SectionTitle>
        <div className="space-y-2">
          {milestones.map(m => {
            const isPast = new Date(m.date) < new Date()
            return (
              <div key={m.id} className={`flex items-center gap-3 py-2 border-b border-br last:border-0 ${isPast && !m.done ? 'opacity-60' : ''}`}>
                <span className={`w-8 text-xs font-bold ${m.done ? 'text-ok' : 'text-muted'}`}>{m.id}</span>
                <span className="text-[11px] text-muted w-24">{m.date}</span>
                <span className="text-xs text-tx flex-1">{m.goal}</span>
                <Badge text={m.done ? 'Done' : isPast ? 'Overdue' : 'Pending'} variant={m.done ? 'ok' : isPast ? 'danger' : 'default'} />
              </div>
            )
          })}
        </div>
      </Card>

      {/* 戦略リマインダー */}
      <Card>
        <SectionTitle>Strategic Reminders</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-muted">
          <div>
            <p className="font-medium text-tx mb-1">Hero Product</p>
            <p>Study (FSRS) — 全ユーザーをStudyに誘導。毎日使う→習慣化→PRO転換。</p>
          </div>
          <div>
            <p className="font-medium text-tx mb-1">3層構造</p>
            <p>L1:集客装置(ツール/ブログ) → L2:Study(課金中心) → L3:LTV延長(J-OSLER/マッチング等)</p>
          </div>
          <div>
            <p className="font-medium text-tx mb-1">やらないこと</p>
            <p>Phase D(マネタイズ)コード開発 / 新サービス追加 / Build in Public / 「日本初」主張</p>
          </div>
          <div>
            <p className="font-medium text-tx mb-1">次の一手</p>
            <p>品質改善50% + Creem申請 + 公式デッキ作成開始</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Competitors Tab
// ═══════════════════════════════════════════════════════════════

interface Alert {
  id: string; title: string; url: string; source: string
  matchedKeywords: string[]; threatLevel: 'critical' | 'high' | 'medium' | 'low'
  competitor: string; publishedAt: string; fetchedAt: string; dismissed: boolean
}

const THREAT_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: 'Critical', bg: 'var(--dnl)', text: 'var(--dn)', border: 'var(--dnb)' },
  high: { label: 'High', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  medium: { label: 'Medium', bg: 'var(--acl)', text: 'var(--ac)', border: '#86EFAC' },
  low: { label: 'Low', bg: 'var(--s1)', text: 'var(--m)', border: 'var(--br)' },
}

function CompetitorsTab({ adminKey }: { adminKey: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [fetched, setFetched] = useState(false)

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
      setFetched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { if (!fetched) fetchAlerts() }, [fetchAlerts, fetched])

  const dismissAlert = async (id: string) => {
    await fetch(`${API_URL}/api/competitors/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify({ id }),
    }).catch(() => {})
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))
  }

  const active = alerts.filter(a => !a.dismissed)
  const filtered = active.filter(a => {
    if (selectedCompetitor !== 'all' && a.competitor !== selectedCompetitor) return false
    if (selectedLevel !== 'all' && a.threatLevel !== selectedLevel) return false
    return true
  })

  const threatCounts = active.reduce((acc, a) => {
    acc[a.threatLevel] = (acc[a.threatLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const competitors = ['HOKUTO', 'MOTiCAN', 'Ubie', 'Antaa', 'm3']

  // Battlecard data
  const battlecards = [
    { competitor: 'HOKUTO', users: '10万+', overlap: '臨床ツール', strategy: 'SEOで勝つ。HOKUTOにないJobで差別化(Study/J-OSLER/マッチング)', threat: 'high' as const },
    { competitor: 'MOTiCAN', users: '4,000', overlap: 'J-OSLER', strategy: 'バンドル戦略。J-OSLER単品 vs 全部込み¥980', threat: 'medium' as const },
    { competitor: 'Anki', users: '数百万', overlap: 'Study', strategy: '.apkg互換で共存。UX差別化+医療特化', threat: 'medium' as const },
    { competitor: 'm3.com', users: '30万+', overlap: '論文/ニュース', strategy: '広告ゼロの体験で差別化', threat: 'low' as const },
  ]

  return (
    <div className="space-y-6">
      {/* Threat summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as const).map(level => {
          const s = THREAT_STYLES[level]
          return (
            <button key={level} onClick={() => setSelectedLevel(prev => prev === level ? 'all' : level)}
              className={`rounded-xl p-3 text-left transition-all border ${selectedLevel === level ? 'ring-2 ring-ac/30' : ''}`}
              style={{ background: s.bg, borderColor: s.border }}>
              <p className="text-[10px] font-medium" style={{ color: s.text }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.text }}>{threatCounts[level] || 0}</p>
            </button>
          )
        })}
      </div>

      {/* Competitor filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setSelectedCompetitor('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCompetitor === 'all' ? 'bg-ac text-white' : 'bg-s0 text-muted border border-br'}`}>
          All
        </button>
        {competitors.map(c => (
          <button key={c} onClick={() => setSelectedCompetitor(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCompetitor === c ? 'bg-ac text-white' : 'bg-s0 text-muted border border-br'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <SectionTitle badge={<>
          <button onClick={fetchAlerts} disabled={loading} className="text-[10px] text-ac hover:text-ac2">{loading ? '...' : 'Refresh'}</button>
        </>}>
          Alerts ({filtered.length})
        </SectionTitle>
        {error && <p className="text-xs text-dn mb-2">{error}</p>}
        {filtered.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No alerts matching filters</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map(alert => {
              const s = THREAT_STYLES[alert.threatLevel]
              return (
                <div key={alert.id} className="flex items-start gap-2 p-3 border border-br rounded-lg">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                  <div className="flex-1 min-w-0">
                    <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-tx hover:text-ac line-clamp-2">{alert.title}</a>
                    <div className="flex gap-1 mt-1">
                      <Badge text={alert.competitor} variant="accent" />
                      <span className="text-[10px] text-muted">{new Date(alert.publishedAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                  <button onClick={() => dismissAlert(alert.id)} className="text-[10px] text-muted hover:text-dn flex-shrink-0">x</button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Battlecards */}
      <Card>
        <SectionTitle>Battlecards</SectionTitle>
        <div className="grid md:grid-cols-2 gap-3">
          {battlecards.map(b => (
            <div key={b.competitor} className="border border-br rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-tx">{b.competitor}</span>
                <Badge text={b.users} variant="default" />
                <Badge text={b.threat} variant={b.threat === 'high' ? 'warn' : b.threat === 'medium' ? 'accent' : 'default'} />
              </div>
              <p className="text-[10px] text-muted mb-1">Overlap: {b.overlap}</p>
              <p className="text-[10px] text-tx">{b.strategy}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  SEO Tab
// ═══════════════════════════════════════════════════════════════

function SEOTab({ analysis }: { analysis: AnalysisData | null }) {
  if (!analysis) return <p className="text-sm text-muted py-8 text-center">Loading analysis...</p>

  const { seo, orphans, metaIssues, topLinked, bottomLinked, lowScore } = analysis

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Average Score" value={`${seo.avgScore}pts`} color={seo.avgScore >= 80 ? 'var(--ok)' : 'var(--wn)'} />
        <Metric label="Orphan Pages" value={seo.orphanCount} color={seo.orphanCount === 0 ? 'var(--ok)' : 'var(--dn)'} />
        <Metric label="Meta Issues" value={seo.metaIssueCount} color={seo.metaIssueCount === 0 ? 'var(--ok)' : 'var(--wn)'} />
        <Metric label="Low Score (<70)" value={seo.lowScoreCount} color={seo.lowScoreCount === 0 ? 'var(--ok)' : 'var(--dn)'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Orphans */}
        <Card>
          <SectionTitle badge={<Badge text={`${seo.orphanCount}`} variant={seo.orphanCount === 0 ? 'ok' : 'danger'} />}>
            Orphan Pages
          </SectionTitle>
          {orphans.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">All clear</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {orphans.map(a => (
                <div key={a.slug} className="flex items-center justify-between py-1 border-b border-br last:border-0">
                  <Link href={`/blog/${a.slug}`} target="_blank" className="text-[11px] text-tx hover:text-ac truncate">{a.slug}</Link>
                  <Badge text={`${a.score}pts`} variant="danger" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Meta Issues */}
        <Card>
          <SectionTitle badge={<Badge text={`${seo.metaIssueCount}`} variant={seo.metaIssueCount === 0 ? 'ok' : 'warn'} />}>
            Meta Issues
          </SectionTitle>
          {metaIssues.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">All clear</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {metaIssues.map(m => (
                <div key={m.slug} className="text-[11px] border border-br rounded p-2">
                  <Link href={`/blog/${m.slug}`} target="_blank" className="text-tx hover:text-ac truncate block">{m.slug}</Link>
                  <div className="flex gap-1 mt-1">{m.issues.map(i => <Badge key={i} text={i} variant="warn" />)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top linked */}
        <Card>
          <SectionTitle>Top Linked (Hub Pages)</SectionTitle>
          <div className="space-y-1.5">
            {topLinked.map((a, i) => (
              <div key={a.slug} className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-4 text-right">{i + 1}</span>
                <Link href={`/blog/${a.slug}`} target="_blank" className="text-[11px] text-tx hover:text-ac truncate flex-1">{a.slug}</Link>
                <div className="h-1 rounded-full bg-ac/50" style={{ width: `${Math.max(4, a.inlinks * 4)}px` }} />
                <span className="text-[11px] font-medium text-tx w-5 text-right">{a.inlinks}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom linked */}
        <Card>
          <SectionTitle>Least Linked</SectionTitle>
          <div className="space-y-1.5">
            {bottomLinked.map((a, i) => (
              <div key={a.slug} className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-4 text-right">{i + 1}</span>
                <Link href={`/blog/${a.slug}`} target="_blank" className="text-[11px] text-tx hover:text-ac truncate flex-1">{a.slug}</Link>
                <Badge text={`${a.inlinks}`} variant={a.inlinks === 0 ? 'danger' : 'warn'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low score articles */}
      {lowScore.length > 0 && (
        <Card>
          <SectionTitle badge={<Badge text={`${lowScore.length} articles`} variant="danger" />}>
            Low Score Articles (&lt;70pts)
          </SectionTitle>
          <p className="text-[10px] text-muted mb-3">Scoring: Size(-20) SVG(-20) CTA(-15) Links(-15) FAQ(-15) Inlinks(-15)</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {lowScore.map(a => (
              <div key={a.slug} className="flex items-center gap-2 py-1.5 border-b border-br last:border-0">
                <Badge text={`${a.score}pts`} variant={a.score < 50 ? 'danger' : 'warn'} />
                <Link href={`/blog/${a.slug}`} target="_blank" className="text-[11px] text-tx hover:text-ac truncate flex-1">{a.slug}</Link>
                <div className="flex gap-0.5 flex-shrink-0">
                  {a.size < 12000 && <Badge text="Size" variant="danger" />}
                  {a.svgCount < 2 && <Badge text="SVG" variant="danger" />}
                  {a.ctaCount < 2 && <Badge text="CTA" variant="danger" />}
                  {a.outlinks < 3 && <Badge text="Links" variant="danger" />}
                  {!a.hasFaq && <Badge text="FAQ" variant="danger" />}
                  {a.inlinks === 0 && <Badge text="Orphan" variant="warn" />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Content Tab
// ═══════════════════════════════════════════════════════════════

function ContentTab({ analysis }: { analysis: AnalysisData | null }) {
  if (!analysis) return <p className="text-sm text-muted py-8 text-center">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Total Articles" value={analysis.total} color="var(--ac)" />
        <Metric label="Published" value={analysis.statusCount.published} color="var(--ok)" />
        <Metric label="Draft" value={analysis.statusCount.draft + analysis.statusCount.needs_review} color="var(--wn)" />
        <Metric label="Quality Issues" value={analysis.qualityIssues.length} color={analysis.qualityIssues.length === 0 ? 'var(--ok)' : 'var(--dn)'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Cluster breakdown */}
        <Card>
          <SectionTitle>Cluster Breakdown</SectionTitle>
          <div className="space-y-2">
            {analysis.clusters.map(c => (
              <div key={c.cluster} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.bg }} />
                <span className="text-[11px] text-muted flex-1 truncate">{c.name}</span>
                <div className="h-1.5 rounded-full opacity-60" style={{ width: `${Math.max(4, (c.count / analysis.total) * 120)}px`, backgroundColor: c.bg }} />
                <span className="text-[11px] font-medium text-tx w-6 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quality issues */}
        <Card>
          <SectionTitle badge={<Badge text={analysis.qualityIssues.length === 0 ? 'All Clear' : `${analysis.qualityIssues.length} issues`} variant={analysis.qualityIssues.length === 0 ? 'ok' : 'danger'} />}>
            Quality Check
          </SectionTitle>
          {analysis.qualityIssues.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">All {analysis.total} articles pass quality check</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {analysis.qualityIssues.map(q => (
                <div key={q.slug} className="text-[11px] border border-br rounded p-2">
                  <Link href={`/blog/${q.slug}`} target="_blank" className="text-tx hover:text-ac truncate block">{q.slug}</Link>
                  <div className="flex flex-wrap gap-0.5 mt-1">{q.issues.map(i => <Badge key={i} text={i} variant="danger" />)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent posts */}
      <Card>
        <SectionTitle>Recent Articles</SectionTitle>
        <div className="divide-y divide-br">
          {analysis.recentPosts.map(p => (
            <div key={p.slug} className="py-2 flex items-center gap-3">
              <span className="text-[10px] text-muted w-20">{p.date}</span>
              <Link href={`/blog/${p.slug}`} target="_blank" className="text-xs text-tx hover:text-ac truncate flex-1">{p.title || p.slug}</Link>
              <span className="text-[10px] text-muted">{p.readingTime}min</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Tools Tab — Calculator Accuracy & Patrol
// ═══════════════════════════════════════════════════════════════

interface ToolCheck {
  slug: string; name: string; category: string
  testCase: string; expected: string
  status: 'pass' | 'untested' | 'fail'
  lastChecked?: string
}

function ToolsTab() {
  // Built-in verification test cases for critical calculators
  const spotChecks: ToolCheck[] = [
    { slug: 'egfr', name: 'eGFR', category: 'nephrology', testCase: 'Cr 1.0, Age 60, Male', expected: 'eGFR ~64', status: 'untested' },
    { slug: 'bmi', name: 'BMI', category: 'general', testCase: '170cm, 70kg', expected: 'BMI 24.2', status: 'untested' },
    { slug: 'cha2ds2-vasc', name: 'CHA2DS2-VASc', category: 'cardiology', testCase: 'CHF+HTN+Age75 = 4pts', expected: '4点', status: 'untested' },
    { slug: 'child-pugh', name: 'Child-Pugh', category: 'hepatology', testCase: 'All min values = 5pts', expected: 'Class A (5)', status: 'untested' },
    { slug: 'wells-pe', name: 'Wells PE', category: 'respiratory', testCase: 'DVT signs + HR>100 = 4.5pts', expected: '4.5点', status: 'untested' },
    { slug: 'curb-65', name: 'CURB-65', category: 'infectious', testCase: 'Confusion+BUN>7+Age65 = 3pts', expected: '3点', status: 'untested' },
    { slug: 'sofa', name: 'SOFA', category: 'icu', testCase: 'All 0 = 0', expected: '0点', status: 'untested' },
    { slug: 'qsofa', name: 'qSOFA', category: 'icu', testCase: 'All 3 criteria = 3', expected: '3点', status: 'untested' },
    { slug: 'meld', name: 'MELD', category: 'hepatology', testCase: 'Cr1.5 Bil3.0 INR1.5', expected: 'MELD ~15', status: 'untested' },
    { slug: 'corrected-ca', name: '補正Ca', category: 'nephrology', testCase: 'Ca8.0 Alb3.0', expected: '~9.0', status: 'untested' },
    { slug: 'anion-gap', name: 'AG', category: 'nephrology', testCase: 'Na140 Cl105 HCO324', expected: 'AG 11', status: 'untested' },
    { slug: 'cockcroft-gault', name: 'CCr', category: 'nephrology', testCase: 'Age60 Wt60 Cr1.0 M', expected: 'CCr ~60', status: 'untested' },
    { slug: 'harris-benedict', name: 'Harris-Benedict', category: 'nutrition', testCase: '170cm 70kg Age40 M', expected: 'BEE ~1600', status: 'untested' },
    { slug: 'fib-4', name: 'FIB-4', category: 'hepatology', testCase: 'Age60 AST40 ALT30 Plt15', expected: 'FIB-4 ~2.7', status: 'untested' },
    { slug: 'grace', name: 'GRACE', category: 'cardiology', testCase: 'Age65 HR80 SBP130 Cr1.0', expected: 'Low risk', status: 'untested' },
    { slug: 'has-bled', name: 'HAS-BLED', category: 'cardiology', testCase: 'HTN+Renal+Age65 = 3pts', expected: '3点', status: 'untested' },
  ]

  const toolStats = {
    calc: 166,
    drugCompare: 25,
    procedure: 15,
    needsFix: 0,
    lastAudit: '2026-03-22',
    nextAudit: '2026-06',
  }

  const legalStatus = [
    { item: 'explanation全削除', status: 'done' as const },
    { item: '出典明記(SourceCitation)', status: 'done' as const },
    { item: '更新日表示(UpdatedAt)', status: 'done' as const },
    { item: '誤り報告ボタン(ErrorReport)', status: 'done' as const },
    { item: 'SaMDリスクツール削除', status: 'done' as const },
    { item: '四半期精度検証', status: 'pending' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Calculators" value={toolStats.calc} color="var(--ac)" />
        <Metric label="Drug Compare" value={toolStats.drugCompare} color="var(--ac)" />
        <Metric label="Procedures" value={toolStats.procedure} color="var(--ac)" />
        <Metric label="Need Fix" value={toolStats.needsFix} color="var(--ok)" />
      </div>

      {/* Legal compliance */}
      <Card>
        <SectionTitle>Legal Compliance Status</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {legalStatus.map(l => (
            <div key={l.item} className="flex items-center gap-2 py-1.5">
              <StatusDot status={l.status === 'done' ? 'ok' : 'warn'} />
              <span className="text-xs text-tx">{l.item}</span>
              <Badge text={l.status === 'done' ? 'Done' : 'Pending'} variant={l.status === 'done' ? 'ok' : 'warn'} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-3">Last audit: {toolStats.lastAudit} / Next: {toolStats.nextAudit}</p>
      </Card>

      {/* Spot check matrix */}
      <Card>
        <SectionTitle badge={<Badge text={`${spotChecks.filter(c => c.status === 'pass').length}/${spotChecks.length} verified`} variant={spotChecks.every(c => c.status === 'pass') ? 'ok' : 'warn'} />}>
          Accuracy Spot Checks
        </SectionTitle>
        <p className="text-[10px] text-muted mb-3">Critical calculators with known test inputs/outputs. Click slug to manually verify.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-muted border-b border-br">
                <th className="py-2 pr-2">Tool</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 pr-2">Test Case</th>
                <th className="py-2 pr-2">Expected</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {spotChecks.map(c => (
                <tr key={c.slug} className="border-b border-br last:border-0">
                  <td className="py-2 pr-2">
                    <Link href={`/tools/calc/${c.slug}`} target="_blank" className="text-ac hover:text-ac2 font-medium">{c.name}</Link>
                  </td>
                  <td className="py-2 pr-2 text-muted">{c.category}</td>
                  <td className="py-2 pr-2 text-tx">{c.testCase}</td>
                  <td className="py-2 pr-2 font-medium text-tx">{c.expected}</td>
                  <td className="py-2">
                    <Badge text={c.status === 'pass' ? 'Pass' : c.status === 'fail' ? 'FAIL' : 'Untested'}
                      variant={c.status === 'pass' ? 'ok' : c.status === 'fail' ? 'danger' : 'default'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Brand Tab — Ego Search + Social + News
// ═══════════════════════════════════════════════════════════════

function BrandTab() {
  const egoSearchQueries = [
    { query: 'iwor.jp', label: 'iwor.jp (direct)' },
    { query: 'iwor 医師', label: 'iwor + 医師' },
    { query: 'イウォール 医療', label: 'イウォール + 医療' },
    { query: '内科ナビ iwor', label: '内科ナビ → iwor' },
  ]

  const newsQueries = [
    '医療IT SaaS 2026',
    'HOKUTO 医師アプリ',
    '医師向けアプリ 新サービス',
    'J-OSLER 管理 アプリ',
  ]

  const socialLinks = [
    { name: 'X (Twitter)', url: 'https://x.com/search?q=iwor.jp', label: 'Search iwor.jp on X' },
    { name: 'Google', url: 'https://www.google.com/search?q=%22iwor.jp%22', label: 'Exact match search' },
    { name: 'Google News', url: 'https://news.google.com/search?q=iwor.jp', label: 'News search' },
    { name: 'PR TIMES', url: 'https://prtimes.jp/main/action.php?run=search&searchtext=HOKUTO+%E5%8C%BB%E5%B8%AB', label: 'Competitor PR' },
  ]

  const brandHealth = [
    { metric: 'Google indexed pages', value: 'Check GSC', status: 'unknown' as const },
    { metric: 'Brand search volume', value: 'Pre-launch', status: 'unknown' as const },
    { metric: 'X followers', value: '0', status: 'warn' as const },
    { metric: 'Backlinks', value: 'Check Ahrefs', status: 'unknown' as const },
  ]

  return (
    <div className="space-y-6">
      {/* Brand health summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {brandHealth.map(b => (
          <div key={b.metric} className="bg-s0 border border-br rounded-xl p-4">
            <p className="text-[11px] text-muted mb-1">{b.metric}</p>
            <div className="flex items-center gap-2">
              <StatusDot status={b.status} />
              <p className="text-sm font-bold text-tx">{b.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick ego search links */}
      <Card>
        <SectionTitle>Ego Search (Quick Links)</SectionTitle>
        <div className="grid md:grid-cols-2 gap-3">
          {egoSearchQueries.map(q => (
            <a key={q.query} href={`https://www.google.com/search?q=${encodeURIComponent(q.query)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-br rounded-lg hover:border-ac/30 transition-colors">
              <span className="text-xs font-medium text-ac">G</span>
              <span className="text-xs text-tx">{q.label}</span>
              <span className="text-[10px] text-muted ml-auto">Open &rarr;</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Social monitoring links */}
      <Card>
        <SectionTitle>Social & PR Monitoring</SectionTitle>
        <div className="grid md:grid-cols-2 gap-3">
          {socialLinks.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-br rounded-lg hover:border-ac/30 transition-colors">
              <span className="text-xs font-bold text-tx">{s.name}</span>
              <span className="text-[10px] text-muted ml-auto">{s.label}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Competitor news links */}
      <Card>
        <SectionTitle>Industry News (Quick Search)</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {newsQueries.map(q => (
            <a key={q} href={`https://news.google.com/search?q=${encodeURIComponent(q)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 border border-br rounded-lg hover:border-ac/30 transition-colors">
              <span className="text-[11px] text-tx">{q}</span>
              <span className="text-[10px] text-muted ml-auto">News &rarr;</span>
            </a>
          ))}
        </div>
      </Card>

      {/* SNS posting status */}
      <Card>
        <SectionTitle>SNS Posting Plan</SectionTitle>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-tx">0</p>
            <p className="text-[10px] text-muted">Posts this month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-ac">5/week</p>
            <p className="text-[10px] text-muted">Target</p>
          </div>
        </div>
        <div className="text-[10px] text-muted space-y-1">
          <p>Content pillars: Calculator tips / Study usage / J-OSLER strategy / Board exam prep</p>
          <p>Channels: X (primary), Note (secondary)</p>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Security Tab
// ═══════════════════════════════════════════════════════════════

function SecurityTab({ adminKey }: { adminKey: string }) {
  const [apiStatus, setApiStatus] = useState<Record<string, 'ok' | 'error' | 'checking'>>({})

  const endpoints = [
    { name: 'Login', method: 'POST', path: '/api/login', requiresAuth: false },
    { name: 'Admin Users', method: 'GET', path: '/api/admin/users', requiresAuth: true },
    { name: 'Admin Orders', method: 'GET', path: '/api/admin/orders', requiresAuth: true },
    { name: 'Journal Feed', method: 'GET', path: '/api/journal?specialty=general', requiresAuth: false },
    { name: 'Competitor Alerts', method: 'GET', path: '/api/competitors/alerts', requiresAuth: true },
  ]

  const checkEndpoint = async (path: string, requiresAuth: boolean) => {
    setApiStatus(prev => ({ ...prev, [path]: 'checking' }))
    try {
      const headers: Record<string, string> = {}
      if (requiresAuth) headers['X-Admin-Key'] = adminKey
      const res = await fetch(`${API_URL}${path}`, { headers })
      setApiStatus(prev => ({ ...prev, [path]: res.ok ? 'ok' : 'error' }))
    } catch {
      setApiStatus(prev => ({ ...prev, [path]: 'error' }))
    }
  }

  const checkAll = () => endpoints.forEach(e => checkEndpoint(e.path, e.requiresAuth))

  const securityChecklist = [
    { item: 'PBKDF2 password hashing', status: 'ok' as const, detail: '310,000 iterations + random salt' },
    { item: 'Rate limiting (register/reset)', status: 'ok' as const, detail: '5 req/min per IP' },
    { item: 'Session token auth', status: 'ok' as const, detail: 'crypto.randomUUID()' },
    { item: 'CORS origin validation', status: 'ok' as const, detail: 'iwor.jp only' },
    { item: 'Admin key protection', status: 'ok' as const, detail: 'X-Admin-Key header' },
    { item: 'robots noindex on /admin', status: 'ok' as const, detail: 'meta robots tag' },
    { item: 'HTTPS only', status: 'ok' as const, detail: 'Cloudflare Pages/Workers' },
    { item: 'No patient data storage', status: 'ok' as const, detail: 'SaMD avoidance' },
    { item: 'CSP headers', status: 'warn' as const, detail: 'Not yet configured' },
    { item: 'Subresource Integrity', status: 'warn' as const, detail: 'Not yet configured' },
  ]

  const infraStatus = [
    { name: 'Cloudflare Pages', status: 'ok' as const, detail: 'Frontend hosting' },
    { name: 'Cloudflare Workers', status: 'ok' as const, detail: 'API backend' },
    { name: 'Cloudflare KV', status: 'ok' as const, detail: 'User data / cache' },
    { name: 'Cloudflare DNS', status: 'ok' as const, detail: 'iwor.jp' },
    { name: 'GitHub Actions CI', status: 'ok' as const, detail: 'Build + docs-check' },
  ]

  return (
    <div className="space-y-6">
      {/* API health check */}
      <Card>
        <SectionTitle badge={
          <button onClick={checkAll} className="text-[10px] text-ac hover:text-ac2">Check All</button>
        }>
          API Health Check
        </SectionTitle>
        <div className="space-y-2">
          {endpoints.map(e => (
            <div key={e.path} className="flex items-center gap-3 py-1.5 border-b border-br last:border-0">
              <StatusDot status={apiStatus[e.path] === 'ok' ? 'ok' : apiStatus[e.path] === 'error' ? 'danger' : 'unknown'} />
              <span className="text-[10px] text-muted w-12">{e.method}</span>
              <span className="text-[11px] text-tx flex-1 font-mono">{e.path}</span>
              <span className="text-xs text-tx">{e.name}</span>
              <button onClick={() => checkEndpoint(e.path, e.requiresAuth)}
                className="text-[10px] text-ac hover:text-ac2">
                {apiStatus[e.path] === 'checking' ? '...' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Security checklist */}
      <Card>
        <SectionTitle badge={
          <Badge text={`${securityChecklist.filter(s => s.status === 'ok').length}/${securityChecklist.length}`}
            variant={securityChecklist.every(s => s.status === 'ok') ? 'ok' : 'warn'} />
        }>
          Security Checklist
        </SectionTitle>
        <div className="space-y-2">
          {securityChecklist.map(s => (
            <div key={s.item} className="flex items-center gap-3 py-1.5 border-b border-br last:border-0">
              <StatusDot status={s.status} />
              <span className="text-xs text-tx flex-1">{s.item}</span>
              <span className="text-[10px] text-muted">{s.detail}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Infrastructure */}
      <Card>
        <SectionTitle>Infrastructure</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {infraStatus.map(i => (
            <div key={i.name} className="flex items-center gap-2 py-1.5">
              <StatusDot status={i.status} />
              <span className="text-xs font-medium text-tx">{i.name}</span>
              <span className="text-[10px] text-muted ml-auto">{i.detail}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Users Tab
// ═══════════════════════════════════════════════════════════════

interface UserData {
  email: string
  orderId?: string
  plan?: string
  createdAt?: string
  sessionCount?: number
}

function UsersTab({ adminKey }: { adminKey: string }) {
  const [users, setUsers] = useState<UserData[]>([])
  const [orders, setOrders] = useState<{ orderId: string; email: string; plan: string; amount: number; createdAt: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { 'X-Admin-Key': adminKey } }),
        fetch(`${API_URL}/api/admin/orders`, { headers: { 'X-Admin-Key': adminKey } }),
      ])
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders || [])
      }
    } catch {}
    setLoading(false)
  }, [adminKey])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="PRO Members" value={users.length || '-'} color="var(--ac)" />
        <Metric label="Orders" value={orders.length || '-'} color="var(--tx)" />
        <Metric label="MRR" value={orders.length > 0 ? `¥${orders.reduce((s, o) => s + (o.amount || 0), 0).toLocaleString()}` : '¥0'} color="var(--ac)" />
      </div>

      {/* PRO members */}
      <Card>
        <SectionTitle badge={
          <button onClick={fetchData} disabled={loading} className="text-[10px] text-ac hover:text-ac2">{loading ? '...' : 'Refresh'}</button>
        }>
          PRO Members
        </SectionTitle>
        {users.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No PRO members found</p>
        ) : (
          <div className="space-y-2">
            {users.map((u, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-br last:border-0">
                <span className="w-8 h-8 rounded-full bg-acl flex items-center justify-center text-xs text-ac font-bold">{(u.email || '?')[0].toUpperCase()}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-tx truncate">{u.email}</p>
                  <p className="text-[10px] text-muted">{u.plan || 'PRO'} {u.createdAt ? `/ ${new Date(u.createdAt).toLocaleDateString('ja-JP')}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Orders */}
      <Card>
        <SectionTitle>Orders</SectionTitle>
        {orders.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-muted border-b border-br">
                  <th className="py-2 pr-2">Order ID</th>
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Plan</th>
                  <th className="py-2 pr-2">Amount</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId} className="border-b border-br last:border-0">
                    <td className="py-2 pr-2 font-mono text-tx">{o.orderId}</td>
                    <td className="py-2 pr-2 text-tx">{o.email}</td>
                    <td className="py-2 pr-2"><Badge text={o.plan || 'PRO'} variant="accent" /></td>
                    <td className="py-2 pr-2 text-tx">¥{o.amount?.toLocaleString()}</td>
                    <td className="py-2 text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('ja-JP') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <Card>
        <SectionTitle>Quick Links</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/pro-codes" className="p-3 border border-br rounded-lg text-xs text-muted hover:text-ac hover:border-ac/30 text-center transition-colors">
            PRO Code Management &rarr;
          </Link>
          <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
            className="p-3 border border-br rounded-lg text-xs text-muted hover:text-ac hover:border-ac/30 text-center transition-colors">
            GA4 Dashboard &rarr;
          </a>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Funnel Tab — Conversion Funnel Analysis
// ═══════════════════════════════════════════════════════════════

interface FunnelStep {
  name: string
  description: string
  gaEvent: string
  count: number | null
  conversionRate: number | null
}

function FunnelTab() {
  // GA4 event names corresponding to each funnel step
  // These would be populated from GA4 API in production
  const funnelSteps: FunnelStep[] = [
    { name: 'Visit', description: 'Site visit (any page)', gaEvent: 'page_view', count: null, conversionRate: null },
    { name: 'Tool Use', description: 'Calculator or tool used', gaEvent: 'tool_usage', count: null, conversionRate: null },
    { name: 'Favorite', description: 'Added tool to favorites', gaEvent: 'favorite_add', count: null, conversionRate: null },
    { name: 'Account', description: 'Created account', gaEvent: 'sign_up', count: null, conversionRate: null },
    { name: 'Study Start', description: 'Started first Study session', gaEvent: 'study_session_start', count: null, conversionRate: null },
    { name: 'Study 7-day', description: '7-day streak achieved', gaEvent: 'streak_7', count: null, conversionRate: null },
    { name: 'PRO View', description: 'Viewed PRO page', gaEvent: 'pro_page_view', count: null, conversionRate: null },
    { name: 'PRO Purchase', description: 'Purchased PRO', gaEvent: 'purchase', count: null, conversionRate: null },
  ]

  const commitmentLadder = [
    { stage: 'Try Tool', trigger: 'Google search → landing page → first calculation', psychology: 'Zero friction (no signup)', status: 'active' as const },
    { stage: 'Add Favorite', trigger: 'Pulse hint after 3rd tool use', psychology: 'Small commitment (IKEA effect)', status: 'active' as const },
    { stage: 'Create Account', trigger: 'Study progress save prompt', psychology: 'Loss aversion (data loss fear)', status: 'active' as const },
    { stage: 'Daily Study', trigger: 'Streak notification + ranking', psychology: 'Habit formation (Duolingo model)', status: 'active' as const },
    { stage: 'Go PRO', trigger: 'Social proof gate + first taste expiry', psychology: 'FOMO + sunk cost', status: 'active' as const },
  ]

  const channelFunnels = [
    { channel: 'Google Search (SEO)', entry: 'Blog/Calculator', path: 'Article → Tool → Study → PRO', status: 'primary' as const },
    { channel: 'X (Twitter)', entry: 'Tool tip / streak screenshot', path: 'Tweet → Landing → Tool → Study', status: 'planned' as const },
    { channel: 'Word of Mouth', entry: 'Senpai recommendation', path: 'Direct link → Tool → Favorite → Account', status: 'planned' as const },
    { channel: 'Shift Share', entry: 'Shift schedule link', path: 'Shared link → iwor CTA → Tool → Study', status: 'active' as const },
  ]

  return (
    <div className="space-y-6">
      {/* Visual funnel */}
      <Card>
        <SectionTitle badge={<span className="text-[10px] text-muted">GA4 events (connect for live data)</span>}>
          Conversion Funnel
        </SectionTitle>
        <div className="space-y-1">
          {funnelSteps.map((step, i) => {
            const widthPercent = 100 - (i * (60 / funnelSteps.length))
            return (
              <div key={step.name} className="flex items-center gap-3">
                <span className="text-[10px] text-muted w-20 text-right flex-shrink-0">{step.name}</span>
                <div className="flex-1 relative">
                  <div className="h-8 rounded-md flex items-center px-3 transition-all"
                    style={{ width: `${widthPercent}%`, background: `rgba(27, 79, 58, ${0.1 + (i * 0.05)})`, border: '1px solid rgba(27, 79, 58, 0.2)' }}>
                    <span className="text-[10px] text-tx">{step.description}</span>
                    <span className="text-[10px] text-muted ml-auto font-mono">{step.count !== null ? step.count.toLocaleString() : '—'}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted w-12 text-right flex-shrink-0 font-mono">
                  {step.conversionRate !== null ? `${step.conversionRate}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-wnl border border-wnb rounded-lg">
          <p className="text-[10px] text-wn font-medium">Setup Required</p>
          <p className="text-[10px] text-wn mt-1">
            GA4 events need to be tracked for live funnel data. Required events:
            <code className="bg-white/50 px-1 rounded mx-0.5">tool_usage</code>
            <code className="bg-white/50 px-1 rounded mx-0.5">favorite_add</code>
            <code className="bg-white/50 px-1 rounded mx-0.5">study_session_start</code>
            <code className="bg-white/50 px-1 rounded mx-0.5">streak_7</code>
            <code className="bg-white/50 px-1 rounded mx-0.5">pro_page_view</code>
            <code className="bg-white/50 px-1 rounded mx-0.5">purchase</code>
          </p>
        </div>
      </Card>

      {/* Commitment ladder */}
      <Card>
        <SectionTitle>Commitment Ladder (Psychology)</SectionTitle>
        <div className="space-y-2">
          {commitmentLadder.map((s, i) => (
            <div key={s.stage} className="flex items-start gap-3 py-2 border-b border-br last:border-0">
              <div className="w-6 h-6 rounded-full bg-acl border border-ac/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-ac">{i + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-tx">{s.stage}</p>
                <p className="text-[10px] text-muted">{s.trigger}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge text={s.psychology} variant="accent" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Channel funnels */}
      <Card>
        <SectionTitle>Acquisition Channels</SectionTitle>
        <div className="space-y-2">
          {channelFunnels.map(c => (
            <div key={c.channel} className="flex items-center gap-3 py-2 border-b border-br last:border-0">
              <StatusDot status={c.status === 'primary' ? 'ok' : c.status === 'active' ? 'ok' : 'warn'} />
              <div className="flex-1">
                <p className="text-xs font-medium text-tx">{c.channel}</p>
                <p className="text-[10px] text-muted">{c.path}</p>
              </div>
              <Badge text={c.status === 'primary' ? 'Primary' : c.status === 'active' ? 'Active' : 'Planned'}
                variant={c.status === 'primary' ? 'ok' : c.status === 'active' ? 'accent' : 'default'} />
            </div>
          ))}
        </div>
      </Card>

      {/* Key conversion levers */}
      <Card>
        <SectionTitle>Optimization Checklist</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {[
            { item: 'Onboarding modal (segment selection)', done: true },
            { item: 'Favorite pulse hint (3rd tool use)', done: true },
            { item: 'Commitment banner (HomeWidgets)', done: true },
            { item: 'First taste model (PRO preview)', done: true },
            { item: 'Loss aversion counter (ProModal)', done: true },
            { item: 'Streak ranking (social proof)', done: true },
            { item: 'GA4 funnel event tracking', done: false },
            { item: 'Referral program (invite link)', done: false },
            { item: 'Email onboarding sequence', done: false },
            { item: 'Push notifications (PWA)', done: false },
          ].map(c => (
            <div key={c.item} className="flex items-center gap-2 py-1">
              <StatusDot status={c.done ? 'ok' : 'warn'} />
              <span className={`text-[11px] ${c.done ? 'text-muted' : 'text-tx'}`}>{c.item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Health Tab — Uptime & Service Health
// ═══════════════════════════════════════════════════════════════

interface HealthCheck {
  name: string
  url: string
  status: 'ok' | 'error' | 'checking' | 'unknown'
  responseTime: number | null
  lastChecked: string | null
}

function HealthTab({ adminKey }: { adminKey: string }) {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Frontend (iwor.jp)', url: 'https://iwor.jp', status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'Worker API', url: `${API_URL}/api/journal?specialty=general`, status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'Admin API', url: `${API_URL}/api/admin/users`, status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'Blog', url: 'https://iwor.jp/blog', status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'PRO Page', url: 'https://iwor.jp/pro', status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'Study', url: 'https://iwor.jp/study', status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'Tools', url: 'https://iwor.jp/tools', status: 'unknown', responseTime: null, lastChecked: null },
    { name: 'Sitemap', url: 'https://iwor.jp/sitemap.xml', status: 'unknown', responseTime: null, lastChecked: null },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [allOk, setAllOk] = useState<boolean | null>(null)

  const runCheck = async (index: number) => {
    setChecks(prev => prev.map((c, i) => i === index ? { ...c, status: 'checking' } : c))
    const check = checks[index]
    const start = performance.now()
    try {
      const headers: Record<string, string> = {}
      if (check.url.includes('/api/admin/')) headers['X-Admin-Key'] = adminKey
      const res = await fetch(check.url, { headers, mode: 'no-cors' })
      const elapsed = Math.round(performance.now() - start)
      setChecks(prev => prev.map((c, i) => i === index ? {
        ...c,
        status: 'ok',
        responseTime: elapsed,
        lastChecked: new Date().toLocaleTimeString('ja-JP'),
      } : c))
    } catch {
      const elapsed = Math.round(performance.now() - start)
      setChecks(prev => prev.map((c, i) => i === index ? {
        ...c,
        status: 'error',
        responseTime: elapsed,
        lastChecked: new Date().toLocaleTimeString('ja-JP'),
      } : c))
    }
  }

  const runAllChecks = async () => {
    setIsRunning(true)
    const promises = checks.map((_, i) => runCheck(i))
    await Promise.allSettled(promises)
    setIsRunning(false)
    // Note: allOk is computed in the effect below
  }

  useEffect(() => {
    const statuses = checks.map(c => c.status)
    if (statuses.every(s => s === 'unknown')) return
    if (statuses.some(s => s === 'checking')) return
    setAllOk(statuses.every(s => s === 'ok'))
  }, [checks])

  // Overall health score
  const checkedCount = checks.filter(c => c.status !== 'unknown' && c.status !== 'checking').length
  const okCount = checks.filter(c => c.status === 'ok').length
  const avgResponseTime = checks.filter(c => c.responseTime !== null).reduce((s, c) => s + (c.responseTime || 0), 0) / (checkedCount || 1)

  const deployments = [
    { date: '2026-03-22', desc: 'CEO Dashboard (8-tab)', status: 'ok' as const },
    { date: '2026-03-22', desc: 'PubMed batch split + journal expansion', status: 'ok' as const },
    { date: '2026-03-22', desc: 'Summary generator rewrite', status: 'ok' as const },
    { date: '2026-03-22', desc: 'Drug compare migration', status: 'ok' as const },
    { date: '2026-03-21', desc: 'Streak ranking + ProGate extensions', status: 'ok' as const },
  ]

  const kvNamespaces = [
    { name: 'IWOR_KV', purpose: 'User data, sessions, PRO status', estimated: '< 1 MB' },
    { name: 'Journal cache', purpose: 'PubMed article cache (cron)', estimated: '~5 MB' },
    { name: 'Competitor alerts', purpose: 'PR TIMES scrape results', estimated: '< 1 MB' },
    { name: 'Leaderboard', purpose: 'Streak ranking data', estimated: '< 1 MB' },
  ]

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Overall Status"
          value={allOk === null ? 'Unknown' : allOk ? 'All OK' : 'Issues'}
          color={allOk === null ? 'var(--m)' : allOk ? 'var(--ok)' : 'var(--dn)'}
        />
        <Metric label="Services Checked" value={`${okCount}/${checks.length}`}
          color={okCount === checks.length ? 'var(--ok)' : 'var(--wn)'} />
        <Metric label="Avg Response" value={checkedCount > 0 ? `${Math.round(avgResponseTime)}ms` : '—'}
          color={avgResponseTime < 500 ? 'var(--ok)' : avgResponseTime < 2000 ? 'var(--wn)' : 'var(--dn)'} />
        <div className="bg-s0 border border-br rounded-xl p-4 flex items-center justify-center">
          <button onClick={runAllChecks} disabled={isRunning}
            className="px-4 py-2 bg-ac text-white rounded-lg text-xs font-medium hover:bg-ac2 transition-colors disabled:opacity-50">
            {isRunning ? 'Checking...' : 'Run All Checks'}
          </button>
        </div>
      </div>

      {/* Service health table */}
      <Card>
        <SectionTitle badge={
          checks.some(c => c.lastChecked) ? <span className="text-[10px] text-muted">Last: {checks.find(c => c.lastChecked)?.lastChecked}</span> : undefined
        }>
          Service Health
        </SectionTitle>
        <div className="space-y-1.5">
          {checks.map((check, i) => (
            <div key={check.name} className="flex items-center gap-3 py-2 border-b border-br last:border-0">
              <StatusDot status={check.status === 'ok' ? 'ok' : check.status === 'error' ? 'danger' : 'unknown'} />
              <span className="text-xs font-medium text-tx w-40 flex-shrink-0">{check.name}</span>
              <span className="text-[10px] text-muted font-mono flex-1 truncate">{check.url.replace('https://', '')}</span>
              <span className={`text-[10px] font-mono w-16 text-right ${
                check.responseTime === null ? 'text-muted' :
                check.responseTime < 500 ? 'text-ok' :
                check.responseTime < 2000 ? 'text-wn' : 'text-dn'
              }`}>
                {check.responseTime !== null ? `${check.responseTime}ms` : '—'}
              </span>
              <button onClick={() => runCheck(i)}
                className="text-[10px] text-ac hover:text-ac2 w-8 text-right flex-shrink-0">
                {check.status === 'checking' ? '...' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent deployments */}
      <Card>
        <SectionTitle>Recent Deployments</SectionTitle>
        <div className="space-y-1.5">
          {deployments.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-br last:border-0">
              <StatusDot status={d.status} />
              <span className="text-[10px] text-muted w-20">{d.date}</span>
              <span className="text-xs text-tx flex-1">{d.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-3">Auto-deploy via Cloudflare Pages on git push to main</p>
      </Card>

      {/* KV storage */}
      <Card>
        <SectionTitle>Cloudflare KV Storage</SectionTitle>
        <div className="space-y-1.5">
          {kvNamespaces.map(kv => (
            <div key={kv.name} className="flex items-center gap-3 py-1.5 border-b border-br last:border-0">
              <span className="text-xs font-mono text-ac w-32 flex-shrink-0">{kv.name}</span>
              <span className="text-[11px] text-tx flex-1">{kv.purpose}</span>
              <span className="text-[10px] text-muted">{kv.estimated}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <Card>
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Rebuild Journal DB', action: `${API_URL}/api/admin/rebuild-journal`, method: 'POST' },
            { label: 'Clear KV Cache', action: '#', method: 'manual' },
            { label: 'Seed Leaderboard', action: `${API_URL}/api/admin/seed-leaderboard`, method: 'POST' },
            { label: 'CF Pages Dashboard', action: 'https://dash.cloudflare.com', method: 'link' },
          ].map(a => (
            <button key={a.label} onClick={async () => {
              if (a.method === 'link') { window.open(a.action, '_blank'); return }
              if (a.method === 'manual') { alert('Use wrangler CLI: npx wrangler kv:key delete ...'); return }
              try {
                const res = await fetch(a.action, {
                  method: 'POST',
                  headers: { 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' },
                })
                alert(res.ok ? 'Success' : `Error: ${res.status}`)
              } catch (e) { alert('Failed') }
            }}
              className="p-3 border border-br rounded-lg text-[11px] text-muted hover:text-ac hover:border-ac/30 text-center transition-colors">
              {a.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Analysis Data Type
// ═══════════════════════════════════════════════════════════════

interface AnalysisData {
  total: number
  statusCount: { published: number; draft: number; needs_review: number }
  qualityIssues: { slug: string; issues: string[] }[]
  clusters: { cluster: string; name: string; bg: string; count: number }[]
  seo: { avgScore: number; orphanCount: number; metaIssueCount: number; lowScoreCount: number }
  orphans: { slug: string; score: number }[]
  metaIssues: { slug: string; title: string; issues: string[] }[]
  topLinked: { slug: string; inlinks: number }[]
  bottomLinked: { slug: string; inlinks: number }[]
  lowScore: { slug: string; score: number; size: number; svgCount: number; ctaCount: number; outlinks: number; hasFaq: boolean; inlinks: number }[]
  recentPosts: { slug: string; title: string; date: string; readingTime: number; category: string }[]
}

// ═══════════════════════════════════════════════════════════════
//  Main Dashboard
// ═══════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  // Load admin key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('iwor_admin_key')
    if (saved) {
      setAdminKey(saved)
      setIsAuth(true)
    }
  }, [])

  // Fetch analysis data
  useEffect(() => {
    if (!isAuth) return
    fetch('/admin-analysis.json')
      .then(r => r.json())
      .then(data => {
        setAnalysis(data)
        setLastRefresh(new Date().toLocaleTimeString('ja-JP'))
      })
      .catch(() => {})
  }, [isAuth])

  const handleLogin = () => {
    if (!adminKey.trim()) return
    localStorage.setItem('iwor_admin_key', adminKey)
    setIsAuth(true)
  }

  // Auth screen
  if (!isAuth) {
    return (
      <div className="max-w-sm mx-auto mt-20 px-4">
        <div className="bg-s0 border border-br rounded-2xl p-6">
          <h1 className="text-lg font-bold text-tx mb-1">iwor CEO Dashboard</h1>
          <p className="text-xs text-muted mb-4">Admin authentication required</p>
          <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm mb-3" placeholder="Admin Key" />
          <button onClick={handleLogin}
            className="w-full py-2.5 bg-ac text-white rounded-lg text-sm font-medium hover:bg-ac2 transition-colors">
            Enter Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-tx">iwor CEO Dashboard</h1>
          <p className="text-[11px] text-muted">
            {lastRefresh ? `Last refresh: ${lastRefresh}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            fetch('/admin-analysis.json').then(r => r.json()).then(data => {
              setAnalysis(data)
              setLastRefresh(new Date().toLocaleTimeString('ja-JP'))
            })
          }} className="text-xs text-ac hover:text-ac2">
            Refresh
          </button>
          <Link href="/" className="text-xs text-muted hover:text-ac transition-colors">
            Site &rarr;
          </Link>
          <button onClick={() => { localStorage.removeItem('iwor_admin_key'); setIsAuth(false); setAdminKey('') }}
            className="text-xs text-muted hover:text-dn transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-br -mx-4 px-4">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'border-ac text-ac'
                : 'border-transparent text-muted hover:text-tx'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab adminKey={adminKey} analysis={analysis} />}
      {activeTab === 'funnel' && <FunnelTab />}
      {activeTab === 'health' && <HealthTab adminKey={adminKey} />}
      {activeTab === 'competitors' && <CompetitorsTab adminKey={adminKey} />}
      {activeTab === 'seo' && <SEOTab analysis={analysis} />}
      {activeTab === 'content' && <ContentTab analysis={analysis} />}
      {activeTab === 'tools' && <ToolsTab />}
      {activeTab === 'brand' && <BrandTab />}
      {activeTab === 'security' && <SecurityTab adminKey={adminKey} />}
      {activeTab === 'users' && <UsersTab adminKey={adminKey} />}
    </div>
  )
}
