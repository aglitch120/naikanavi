'use client'

import { useState } from 'react'

// ── Types ──
type Tab = 'dashboard' | 'practice' | 'cards' | 'stats' | 'chat' | 'notes'
type Mark = 'dbl' | 'ok' | 'tri' | 'x' | 'none'

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '◫', label: 'ダッシュボード' },
  { id: 'practice', icon: '✎', label: '演習' },
  { id: 'cards', icon: '⊞', label: '暗記カード' },
  { id: 'stats', icon: '◔', label: '統計' },
  { id: 'chat', icon: '◇', label: 'iwor AI' },
  { id: 'notes', icon: '☰', label: 'ノート' },
]

const EXAM_MODES = ['すべて', '医師国家試験', 'CBT', '初期研修', '専攻医', '一般医師']

// ── Shared Components ──
function ProgressRing({ value, size = 80, stroke = 5, color = '#1B4F3A' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const ci = 2 * Math.PI * r
  const off = ci - (value / 100) * ci
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E5DF" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round"
        className="transition-all duration-700 ease-out" />
    </svg>
  )
}

function StatCard({ label, value, sub, trend, icon }: { label: string; value: string; sub?: string; trend?: number; icon?: string }) {
  return (
    <div className="bg-s0 border border-br rounded-xl px-5 py-[18px] flex-1 min-w-[130px]">
      <div className="text-[11px] text-muted font-medium tracking-wider uppercase mb-2.5">
        {icon && <span className="mr-1.5">{icon}</span>}{label}
      </div>
      <div className="text-[28px] font-bold text-tx leading-none font-mono tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted mt-1.5">{sub}</div>}
      {trend != null && (
        <div className={`text-[11px] font-medium mt-1 ${trend > 0 ? 'text-ok' : 'text-dn'}`}>
          {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

// ── Mock Data ──
const FIELDS = [
  { id: 'A1', label: '循環器', pct: 82, done: 357, total: 420 },
  { id: 'A2', label: '呼吸器', pct: 68, done: 182, total: 280 },
  { id: 'A3', label: '消化管', pct: 75, done: 233, total: 310 },
  { id: 'A4', label: '肝胆膵', pct: 64, done: 140, total: 220 },
  { id: 'A5', label: '腎・電解質', pct: 55, done: 105, total: 190 },
  { id: 'A6', label: '内分泌', pct: 42, done: 84, total: 200 },
  { id: 'A7', label: '血液', pct: 61, done: 110, total: 180 },
  { id: 'A9', label: '感染症', pct: 67, done: 140, total: 210 },
  { id: 'A10', label: '神経', pct: 48, done: 113, total: 250 },
]

const TOTAL_Q = 4180
const TOTAL_DONE = 2317

// ═══ Main Component ═══
export default function KokushiApp() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHover, setSidebarHover] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Dashboard states
  const [kokushiMetric, setKokushiMetric] = useState<'count' | 'rate'>('count')
  const [kokushiPeriod, setKokushiPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [fieldMetric, setFieldMetric] = useState<'rate' | 'progress'>('rate')

  const sidebarVisible = !sidebarCollapsed || sidebarHover

  const switchTab = (t: Tab) => {
    setTab(t)
    setMobileMenuOpen(false)
  }

  // ── Sidebar Content (shared between PC and mobile drawer) ──
  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV_ITEMS.map(it => (
          <button key={it.id}
            onClick={() => { switchTab(it.id); onNavigate?.() }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-none text-[13px] font-medium cursor-pointer text-left w-full transition-colors ${
              tab === it.id ? 'bg-acl text-ac font-semibold' : 'bg-transparent text-muted hover:bg-s1'
            }`}>
            <span className="text-sm w-5 text-center opacity-70">{it.icon}</span>
            {it.label}
            {it.id === 'chat' && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[rgba(108,92,231,0.08)] text-[#6C5CE7] font-semibold">AI</span>
            )}
          </button>
        ))}
        <div className="mt-auto pt-3 px-3 border-t border-br">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted">クレジット</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1B4F3A,#2D6A4F)' }}>PRO</span>
          </div>
          <div className="text-[22px] font-bold font-mono text-tx">247<span className="text-xs font-normal text-muted"> / 300</span></div>
          <div className="h-[3px] bg-s2 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-ac rounded-full" style={{ width: '82%' }} />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-bg text-tx font-sans">

      {/* ── Mobile Header ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-s0 border-b border-br px-4 py-2.5 items-center gap-3 hidden max-md:flex">
        <button onClick={() => setMobileMenuOpen(true)} className="p-1">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="19" y2="6" /><line x1="3" y1="11" x2="19" y2="11" /><line x1="3" y1="16" x2="19" y2="16" />
          </svg>
        </button>
        <div className="w-[26px] h-[26px] rounded-[7px] bg-ac flex items-center justify-center text-xs font-bold text-white">i</div>
        <span className="text-[13px] font-semibold flex-1">{NAV_ITEMS.find(n => n.id === tab)?.label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1B4F3A,#2D6A4F)' }}>PRO</span>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[260px] bg-s0 p-5 flex flex-col gap-0.5 shadow-xl overflow-y-auto animate-[slideRight_0.2s_ease]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-[30px] h-[30px] rounded-[9px] bg-ac flex items-center justify-center text-sm font-bold text-white">i</div>
                <div>
                  <div className="text-sm font-semibold">iwor study</div>
                  <div className="text-[10px] text-muted font-medium">医師国家試験</div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-lg text-muted p-1">✕</button>
            </div>
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Hover Zone (collapsed) ── */}
      {sidebarCollapsed && !sidebarHover && (
        <div onMouseEnter={() => setSidebarHover(true)}
          className="fixed top-0 left-0 w-2 h-screen z-50 cursor-e-resize max-md:hidden" />
      )}

      {/* ── PC Sidebar ── */}
      <nav
        onMouseEnter={() => { if (sidebarCollapsed) setSidebarHover(true) }}
        onMouseLeave={() => { if (sidebarCollapsed) setSidebarHover(false) }}
        className={`flex flex-col gap-0.5 shrink-0 h-screen box-border bg-s0 overflow-y-auto overflow-x-hidden transition-all duration-200 max-md:hidden ${
          sidebarCollapsed ? 'fixed top-0 left-0 z-[60]' : 'sticky top-0'
        } ${sidebarCollapsed && sidebarHover ? 'shadow-xl' : ''}`}
        style={{
          width: sidebarVisible ? 220 : 0,
          minWidth: sidebarVisible ? 220 : 0,
          padding: sidebarVisible ? '20px 12px' : 0,
          borderRight: sidebarVisible ? '1px solid #DDD9D2' : 'none',
          opacity: sidebarVisible ? 1 : 0,
        }}
      >
        {/* Logo + collapse */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-4" style={{ minWidth: 196 }}>
          <div className="w-[30px] h-[30px] rounded-[9px] bg-ac flex items-center justify-center text-sm font-bold text-white">i</div>
          <div className="flex-1">
            <div className="text-sm font-semibold">iwor study</div>
            <div className="text-[10px] text-muted font-medium">医師国家試験</div>
          </div>
          <button
            onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setSidebarHover(false) }}
            title={sidebarCollapsed ? 'サイドバーを固定' : 'フォーカスモード'}
            className="p-1 text-muted hover:bg-s1 hover:text-tx rounded-md transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {sidebarCollapsed
                ? <><line x1="3" y1="3" x2="3" y2="13" /><polyline points="7,6 10,8 7,10" /></>
                : <><line x1="3" y1="3" x2="3" y2="13" /><polyline points="10,6 7,8 10,10" /></>
              }
            </svg>
          </button>
        </div>

        <SidebarContent />
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 p-8 max-w-[960px] min-w-0 overflow-y-auto max-md:px-4 max-md:pt-16 max-md:pb-24">

        {/* ═══ DASHBOARD ═══ */}
        {tab === 'dashboard' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            {/* Greeting */}
            <div className="mb-6">
              <div className="text-[11px] text-muted font-medium tracking-wider uppercase mb-2">2026年3月31日（火）</div>
              <h1 className="text-[28px] font-bold">おかえりなさい</h1>
              <p className="text-sm text-muted mt-2">国試まであと<span className="text-ac font-bold">315日</span></p>
            </div>

            {/* 国試演習 */}
            <div className="text-xs font-semibold text-muted mb-2.5">✎ 国試演習</div>
            <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
              <div className="flex gap-6 flex-wrap">
                {/* Left: Bar chart */}
                <div className="flex-1 min-w-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    {/* Metric toggle */}
                    <div className="flex bg-s1 rounded-lg p-0.5">
                      {(['count', 'rate'] as const).map(k => (
                        <button key={k} onClick={() => setKokushiMetric(k)}
                          className={`px-3.5 py-1 rounded-md text-xs font-medium transition-all ${
                            kokushiMetric === k ? 'bg-s0 text-tx shadow-sm font-semibold' : 'text-muted'
                          }`}>
                          {k === 'count' ? '演習数' : '正答率'}
                        </button>
                      ))}
                    </div>
                    {/* Period toggle */}
                    <div className="flex gap-0.5">
                      {(['day', 'week', 'month', 'year'] as const).map(k => (
                        <button key={k} onClick={() => setKokushiPeriod(k)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            kokushiPeriod === k ? 'bg-acl text-ac' : 'text-muted'
                          }`}>
                          {{ day: '日', week: '週', month: '月', year: '年' }[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Bars */}
                  <div className="flex items-end gap-2 h-[130px] px-1">
                    {(kokushiPeriod === 'day' ? [8, 22, 15, 30, 18, 25, 24] : kokushiPeriod === 'week' ? [95, 120, 142, 88, 110, 135, 142] : kokushiPeriod === 'month' ? [380, 420, 510, 480] : [2400, 3200, 4100]).map((v, i, arr) => {
                      const max = Math.max(...arr)
                      const barH = Math.max(4, Math.round((v / max) * 90))
                      const isLast = i === arr.length - 1
                      const rates = [58, 63, 55, 72, 60, 68, 71]
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className={`text-[10px] font-mono ${isLast ? 'text-ac font-semibold' : 'text-muted'}`}>
                            {kokushiMetric === 'rate' ? (rates[i] || 65) + '%' : v}
                          </span>
                          <div className={`w-full max-w-[40px] rounded transition-all duration-400 ${isLast ? 'bg-ac' : 'bg-s2'}`} style={{ height: barH }} />
                          <span className="text-[9px] text-muted">
                            {kokushiPeriod === 'day' ? ['月', '火', '水', '木', '金', '土', '日'][i] : kokushiPeriod === 'week' ? `W${i + 1}` : kokushiPeriod === 'month' ? `${i + 1}月` : `${2024 + i}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Summary */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-br">
                    <div>
                      <span className="text-2xl font-bold font-mono">{kokushiMetric === 'count' ? '142' : '71%'}</span>
                      <span className="text-xs text-muted ml-1.5">{kokushiMetric === 'count' ? '問（今週）' : '全科目平均'}</span>
                    </div>
                    <div className="text-[11px] text-ok font-medium">↑ {kokushiMetric === 'count' ? '12' : '3'}% vs 先週</div>
                  </div>
                </div>

                {/* Right: Progress ring */}
                <div className="flex flex-col items-center justify-center text-center px-2 border-l border-br min-w-[160px]">
                  <div className="text-[11px] text-muted font-medium tracking-wider uppercase mb-3">全問進捗</div>
                  <div className="relative flex items-center justify-center">
                    <ProgressRing value={Math.round(TOTAL_DONE / TOTAL_Q * 100)} size={100} stroke={6} />
                    <div className="absolute text-center">
                      <div className="text-2xl font-bold font-mono">{Math.round(TOTAL_DONE / TOTAL_Q * 100)}%</div>
                      <div className="text-[10px] text-muted">{TOTAL_DONE.toLocaleString()} / {TOTAL_Q.toLocaleString()}</div>
                    </div>
                  </div>
                  <button onClick={() => switchTab('practice')}
                    className="w-full py-2 px-4 rounded-lg bg-ac text-white text-xs font-semibold cursor-pointer mt-3 hover:bg-ac2 transition-colors">
                    演習を始める
                  </button>
                </div>
              </div>
            </div>

            {/* 暗記カード */}
            <div className="text-xs font-semibold text-muted mb-2.5">⊞ 暗記カード</div>
            <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
              <div className="flex gap-5 flex-wrap items-center">
                <div className="flex gap-3 flex-1 min-w-[280px] flex-wrap">
                  <StatCard icon="⊞" label="今日の復習" value="38" sub="枚" />
                  <StatCard label="カード総数" value="278" sub="枚" />
                  <StatCard icon="🔥" label="連続学習" value="14" sub="日" />
                </div>
                <div className="flex flex-col items-center text-center px-2 border-l border-br min-w-[140px]">
                  <div className="text-[11px] text-muted font-medium tracking-wider uppercase mb-2.5">今日の復習</div>
                  <div className="relative flex items-center justify-center">
                    <ProgressRing value={42} size={80} stroke={5} color="#6C5CE7" />
                    <div className="absolute text-center">
                      <div className="text-xl font-bold font-mono">16</div>
                      <div className="text-[9px] text-muted">/ 38枚</div>
                    </div>
                  </div>
                  <button onClick={() => switchTab('cards')}
                    className="w-full py-1.5 px-4 rounded-lg bg-ac text-white text-xs font-semibold cursor-pointer mt-2.5 hover:bg-ac2 transition-colors">
                    復習を始める
                  </button>
                </div>
              </div>
            </div>

            {/* 科目別 */}
            <div className="bg-s0 border border-br rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">科目別</span>
                  <div className="flex bg-s1 rounded-lg p-0.5">
                    {(['rate', 'progress'] as const).map(k => (
                      <button key={k} onClick={() => setFieldMetric(k)}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                          fieldMetric === k ? 'bg-s0 text-tx shadow-sm font-semibold' : 'text-muted'
                        }`}>
                        {k === 'rate' ? '正答率' : '演習進捗'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {FIELDS.map(s => {
                const val = fieldMetric === 'rate' ? s.pct : Math.round(s.done / s.total * 100)
                const barColor = val >= 70 ? 'bg-ok' : val >= 50 ? 'bg-ac' : val >= 30 ? 'bg-wn' : 'bg-dn'
                return (
                  <div key={s.id} className="flex items-center gap-3 py-[7px]">
                    <div className="w-[72px] text-xs text-muted text-right font-medium">{s.label}</div>
                    <div className="flex-1 h-1.5 bg-s2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-400`} style={{ width: `${val}%` }} />
                    </div>
                    <div className="w-10 text-xs font-semibold font-mono text-right">{val}%</div>
                    {fieldMetric === 'progress' && (
                      <div className="w-[60px] text-[11px] text-muted font-mono">{s.done}/{s.total}</div>
                    )}
                  </div>
                )
              })}
              <button onClick={() => switchTab('practice')} className="text-xs text-ac font-medium mt-3 cursor-pointer hover:underline">
                全科目を表示 →
              </button>
            </div>
          </div>
        )}

        {/* ═══ PLACEHOLDER TABS ═══ */}
        {tab === 'practice' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <h1 className="text-[22px] font-bold mb-2">演習</h1>
            <p className="text-sm text-muted mb-6">→ IMPL_KOKUSHI.md の仕様に基づいてClaude Codeで実装</p>
            <div className="flex gap-1.5 mb-6 flex-wrap">
              {EXAM_MODES.map(m => (
                <button key={m} className="px-3.5 py-1.5 rounded-full border border-br text-xs text-muted hover:bg-acl hover:text-ac hover:border-ac transition-colors">
                  {m}
                </button>
              ))}
            </div>
            <div className="bg-s0 border border-br rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">✎</div>
              <div className="text-sm text-muted">演習タブ — 分野別/回数別/問題セットのドリルダウンUI</div>
              <div className="text-xs text-muted mt-2">プロトタイプ: docs/prototypes/study-kokushi-prototype-v4.jsx</div>
            </div>
          </div>
        )}

        {tab === 'cards' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <h1 className="text-[22px] font-bold mb-2">暗記カード</h1>
            <p className="text-sm text-muted mb-6">デッキ管理（自分のデッキ / 共有デッキ）</p>
            <div className="bg-s0 border border-br rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">⊞</div>
              <div className="text-sm text-muted">デッキがありません</div>
              <div className="text-xs text-muted mt-2">問題演習からカードを生成するか、手動で作成</div>
              <button className="mt-4 px-6 py-2.5 rounded-lg bg-ac text-white text-sm font-semibold">+ デッキ作成</button>
            </div>
          </div>
        )}

        {tab === 'stats' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <h1 className="text-[22px] font-bold mb-6">統計</h1>
            <div className="bg-s0 border border-br rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">◔</div>
              <div className="text-sm text-muted">国試演習 / 暗記カード の統計</div>
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <div className="animate-[fadeIn_0.3s_ease] flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
            <h1 className="text-[22px] font-bold mb-1">iwor AI</h1>
            <p className="text-sm text-muted mb-6">国試対策の壁打ち・疑問解消</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-acl text-ac flex items-center justify-center text-xl font-bold mx-auto mb-4">i</div>
                <div className="text-sm text-muted">何でも聞いてください</div>
              </div>
            </div>
            <div className="flex gap-2.5 pt-3 border-t border-br">
              <input placeholder="質問を入力..." className="flex-1 px-4 py-3 rounded-[10px] border-[1.5px] border-br bg-s0 text-sm outline-none focus:border-ac" />
              <button className="px-6 py-3 rounded-[10px] bg-ac text-white text-sm font-semibold">送信</button>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[22px] font-bold">ノート</h1>
              <button className="px-5 py-2.5 rounded-lg bg-ac text-white text-sm font-semibold">+ 新規作成</button>
            </div>
            <div className="bg-s0 border border-br rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">☰</div>
              <div className="text-sm text-muted">マークダウンで自由にメモ</div>
            </div>
          </div>
        )}
      </main>

      {/* ── Animations ── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  )
}
