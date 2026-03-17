// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ── Colors (mirror DESIGN_SYSTEM.md) ── */
const C = {
  bg: '#F5F4F0', s0: '#FEFEFC', s1: '#F0EDE7', s2: '#E8E5DF',
  br: '#DDD9D2', br2: '#C8C4BC', tx: '#1A1917', m: '#6B6760',
  ac: '#1B4F3A', acl: '#E8F0EC', ac2: '#155230',
  ok: '#166534', wn: '#B45309',
}

/* ── Demo data ── */
const DEMO_SPECIALTIES = [
  { short: '総合Ⅰ', cases: 8, minC: 5, groups: 3, minG: 3, sum: 2, minS: 2, color: '#1B4F3A' },
  { short: '総合Ⅱ', cases: 6, minC: 5, groups: 3, minG: 3, sum: 2, minS: 2, color: '#2D6B4E' },
  { short: '総合Ⅲ', cases: 4, minC: 5, groups: 2, minG: 3, sum: 1, minS: 2, color: '#3D8B62' },
  { short: '消化器', cases: 12, minC: 10, groups: 5, minG: 3, sum: 3, minS: 3, color: '#D97706' },
  { short: '循環器', cases: 14, minC: 10, groups: 4, minG: 3, sum: 3, minS: 3, color: '#DC2626' },
  { short: '内分泌', cases: 5, minC: 3, groups: 2, minG: 2, sum: 1, minS: 1, color: '#7C3AED' },
  { short: '代謝', cases: 4, minC: 3, groups: 2, minG: 2, sum: 1, minS: 1, color: '#A855F7' },
  { short: '腎臓', cases: 6, minC: 3, groups: 3, minG: 2, sum: 1, minS: 1, color: '#0891B2' },
  { short: '呼吸器', cases: 9, minC: 6, groups: 3, minG: 3, sum: 2, minS: 2, color: '#0D9488' },
  { short: '血液', cases: 3, minC: 3, groups: 2, minG: 2, sum: 1, minS: 1, color: '#E11D48' },
  { short: '神経', cases: 7, minC: 3, groups: 3, minG: 2, sum: 1, minS: 1, color: '#6366F1' },
  { short: 'アレルギー', cases: 2, minC: 2, groups: 2, minG: 2, sum: 1, minS: 1, color: '#EA580C' },
  { short: '膠原病', cases: 4, minC: 3, groups: 2, minG: 2, sum: 1, minS: 1, color: '#BE185D' },
  { short: '感染症', cases: 8, minC: 5, groups: 3, minG: 3, sum: 2, minS: 2, color: '#CA8A04' },
  { short: '救急', cases: 5, minC: 5, groups: 3, minG: 3, sum: 2, minS: 2, color: '#EF4444' },
  { short: '外科紹介', cases: 2, minC: 2, groups: 1, minG: 0, sum: 2, minS: 2, color: '#94A3B8' },
  { short: '剖検', cases: 1, minC: 1, groups: 1, minG: 0, sum: 1, minS: 1, color: '#64748B' },
]

const demoCases = DEMO_SPECIALTIES.reduce((a, s) => a + s.cases, 0) // ~100
const demoGroups = DEMO_SPECIALTIES.reduce((a, s) => a + s.groups, 0) // ~44
const demoSummaries = DEMO_SPECIALTIES.reduce((a, s) => a + s.sum, 0) // ~27
const demoOther = 2 // of 4

/* ── SVG Ring ── */
function Ring({ pct, size = 100, stroke = 8, color = C.ac }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.s2} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
    </svg>
  )
}

/* ── Progress bar ── */
function PBar({ pct, color = C.ac }: { pct: number; color?: string }) {
  return (
    <div style={{ width: '100%', height: 5, background: C.s2, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease-out' }} />
    </div>
  )
}

/* ── Features ── */
const FEATURES = [
  {
    emoji: '📊',
    title: '進捗ダッシュボード',
    desc: '120症例・56疾患群・29病歴要約・その他要件の達成状況を一目で把握。リングチャートと領域別テーブルで、何が足りないかすぐわかる。',
  },
  {
    emoji: '🏥',
    title: '症例登録 & 疾患群カウント',
    desc: '17領域・70疾患群を選択式で記録。タップするだけで症例数が自動カウント。総合内科Ⅰ〜Ⅲの合算ルールも自動反映。',
  },
  {
    emoji: '🤖',
    title: '病歴要約AI生成',
    desc: 'J-OSLER準拠の書式で病歴要約を自動生成。句読点「, .」常体・受動態・禁止語句チェックまで完全対応。29本の作成を大幅に効率化。',
  },
  {
    emoji: '🔗',
    title: '病棟TODOとの自動連携',
    desc: '病棟TODOで退院→症例ログに記録された症例が、J-OSLER管理に自動反映。ダブル入力不要で、日々の業務がそのまま進捗になる。',
  },
]

/* ── Teaser tabs ── */
const TABS = [
  { id: 'overview', label: '📋 概要', emoji: '📋' },
  { id: 'cases', label: '📊 症例・疾患群', emoji: '📊' },
  { id: 'summaries', label: '📝 病歴要約', emoji: '📝' },
]

export default function JoslerTeaser() {
  const [demoTab, setDemoTab] = useState('overview')

  const cPct = demoCases / 120 * 100
  const gPct = demoGroups / 56 * 100
  const sPct = demoSummaries / 29 * 100
  const oPct = demoOther / 4 * 100
  const overallPct = Math.round((cPct + gPct + sPct + oPct) / 4)

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',sans-serif", color: C.tx }}>
      {/* ── Hero ── */}
      <section style={{ background: `linear-gradient(135deg, ${C.ac} 0%, ${C.ac2} 100%)`, padding: '48px 16px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 14px', marginBottom: 16, backdropFilter: 'blur(4px)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCD34D', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600, letterSpacing: '.5px' }}>COMING SOON</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>J-OSLER管理</h1>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,.85)', lineHeight: 1.7, margin: 0 }}>
            内科専門医J-OSLERの症例登録・進捗管理・病歴要約AI生成。<br />
            120症例・56疾患群・29病歴要約の達成を最短ルートで。
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 14px 80px' }}>

        {/* ── Demo Mockup ── */}
        <section style={{ marginTop: -20, position: 'relative', zIndex: 2 }}>
          <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 16, overflow: 'hidden', boxShadow: `0 8px 32px rgba(0,0,0,.08)` }}>
            {/* Demo header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.br}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: C.ac, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>iw</div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>J-OSLER管理</span>
              <span style={{ fontSize: 11, color: C.ac, background: C.acl, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>PRO</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: '#DCFCE7', color: '#166534', fontFamily: 'monospace' }}>✓ デモ</span>
            </div>

            {/* Demo tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.br}` }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setDemoTab(t.id)} style={{
                  flex: 1, padding: '11px 0', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: demoTab === t.id ? `2.5px solid ${C.ac}` : '2.5px solid transparent',
                  color: demoTab === t.id ? C.ac : C.m, fontWeight: demoTab === t.id ? 600 : 400, fontSize: 13,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Demo content */}
            <div style={{ padding: '16px 14px', minHeight: 320, position: 'relative' }}>
              {demoTab === 'overview' && <OverviewDemo overallPct={overallPct} cPct={cPct} gPct={gPct} sPct={sPct} oPct={oPct} />}
              {demoTab === 'cases' && <CasesDemo />}
              {demoTab === 'summaries' && <SummariesDemo />}

              {/* Blur overlay */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
                background: `linear-gradient(transparent, ${C.s0}ee 40%, ${C.s0})`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: C.m, marginBottom: 8 }}>開発中 — 完成時にPRO会員は即利用可能</p>
                  <Link href="/pro" style={{
                    display: 'inline-block', padding: '10px 28px', borderRadius: 10,
                    background: C.ac, color: '#fff', fontSize: 14, fontWeight: 600,
                    textDecoration: 'none', boxShadow: `0 2px 12px ${C.ac}33`,
                  }}>
                    PRO会員になる →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>主な機能</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '16px 16px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: C.acl,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                }}>
                  {f.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: C.m, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Requirements summary ── */}
        <section style={{ marginTop: 32 }}>
          <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '20px 16px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>内科専門医 修了要件</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: '症例登録', value: '120症例', sub: '17領域', color: C.ac },
                { label: '疾患群', value: '56群以上', sub: '各領域要件あり', color: '#5B7FA6' },
                { label: '病歴要約', value: '29本', sub: '受理まで', color: '#9A3B3B' },
                { label: 'その他', value: '4要件', sub: 'JMECC・論文等', color: '#7C6F4A' },
              ].map((r, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 8, padding: '12px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.m, marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.value}</div>
                  <div style={{ fontSize: 10, color: C.br2, marginTop: 2 }}>{r.sub}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.m, lineHeight: 1.6, marginTop: 14, textAlign: 'center' }}>
              iworが全要件の進捗を一括管理。<br />
              病棟TODOの症例ログから自動連携で、入力は1回だけ。
            </p>
          </div>
        </section>

        {/* ── Integration with Dashboard ── */}
        <section style={{ marginTop: 32 }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.acl}, #d4e8dc)`, border: `1px solid ${C.ac}30`,
            borderRadius: 12, padding: '20px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔗</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ac, marginBottom: 6 }}>病棟TODOとシームレス連携</h3>
            <p style={{ fontSize: 13, color: C.m, lineHeight: 1.65, marginBottom: 16 }}>
              毎日の病棟TODOで記録した症例が、退院時にJ-OSLER管理へ自動反映。<br />
              領域・疾患群・診断名がそのまま引き継がれ、ダブル入力ゼロ。
            </p>
            <Link href="/dashboard" style={{
              display: 'inline-block', padding: '10px 24px', borderRadius: 9,
              border: `1.5px solid ${C.ac}`, background: C.s0, color: C.ac,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              病棟TODOを試す →
            </Link>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ marginTop: 36, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.m, marginBottom: 12, lineHeight: 1.6 }}>
            J-OSLER管理は現在開発中です。<br />
            PRO会員は完成時に追加料金なしで利用できます。
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pro" style={{
              padding: '13px 32px', borderRadius: 10,
              background: `linear-gradient(135deg, ${C.ac}, ${C.ac2})`, color: '#fff',
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: `0 4px 20px ${C.ac}44`,
            }}>
              PRO会員になる
            </Link>
            <Link href="/dashboard" style={{
              padding: '13px 24px', borderRadius: 10,
              border: `1.5px solid ${C.br}`, background: C.s0, color: C.tx,
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}>
              病棟TODOから始める
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </main>
  )
}

/* ═══ Demo: Overview ═══ */
function OverviewDemo({ overallPct, cPct, gPct, sPct, oPct }: any) {
  return (
    <div>
      {/* Hero ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
          <Ring pct={overallPct} size={88} stroke={8} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.ac }}>{overallPct}%</span>
            <span style={{ fontSize: 9, color: C.m }}>総合進捗</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>内科専門医 取得ナビ</div>
          <div style={{ fontSize: 11, color: C.m }}>120症例 / 56疾患群 / 29病歴要約 / その他要件</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: '症例数', val: demoCases, max: 120, color: C.ac },
          { label: '疾患群', val: demoGroups, max: 56, color: '#5B7FA6' },
          { label: '病歴要約', val: demoSummaries, max: 29, color: '#9A3B3B' },
          { label: 'その他要件', val: demoOther, max: 4, color: '#7C6F4A' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: C.m, marginBottom: 4 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 11, color: C.m }}>/ {s.max}</span>
            </div>
            <PBar pct={s.val / s.max * 100} color={s.color} />
          </div>
        ))}
      </div>

      {/* Specialty table */}
      <div style={{ fontSize: 11, fontWeight: 600, color: C.m, marginBottom: 6 }}>領域別 達成状況</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.br}` }}>
              {['領域', '症例', '疾患群', '要約'].map((h, i) => (
                <th key={h} style={{ padding: '6px 4px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 600, color: C.m, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO_SPECIALTIES.map((sp, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.s1}` }}>
                <td style={{ padding: '5px 4px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sp.color, flexShrink: 0 }} />
                  {sp.short}
                </td>
                <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                  <span style={{ color: sp.cases >= sp.minC ? C.ok : C.wn, fontWeight: 600 }}>{sp.cases}</span>
                  <span style={{ color: C.br2 }}>/{sp.minC}</span>
                </td>
                <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                  <span style={{ color: sp.groups >= sp.minG ? C.ok : C.wn, fontWeight: 600 }}>{sp.groups}</span>
                  <span style={{ color: C.br2 }}>/{sp.minG || '-'}</span>
                </td>
                <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                  <span style={{ color: sp.sum >= sp.minS ? C.ok : C.wn, fontWeight: 600 }}>{sp.sum}</span>
                  <span style={{ color: C.br2 }}>/{sp.minS}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══ Demo: Cases ═══ */
function CasesDemo() {
  const [openSp, setOpenSp] = useState<string | null>('cardio')

  const demoExpanded = {
    cardio: [
      { name: '虚血性心疾患', diseases: ['急性冠症候群', '狭心症', '陳旧性心筋梗塞'], checked: ['急性冠症候群', '狭心症'] },
      { name: '心不全', diseases: ['急性心不全', '慢性心不全', '心筋症'], checked: ['急性心不全', '慢性心不全'] },
      { name: '不整脈', diseases: ['心房細動', '心室頻拍', '洞不全症候群', '房室ブロック'], checked: ['心房細動'] },
      { name: '弁膜症', diseases: ['大動脈弁狭窄症', '僧帽弁閉鎖不全症', '感染性心内膜炎'], checked: [] },
    ],
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.ac }}>{demoCases}</span>
          <span style={{ fontSize: 12, color: C.m }}> / 120</span>
          <div style={{ fontSize: 10, color: C.m }}>総症例数</div>
        </div>
        <div>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#5B7FA6' }}>{demoGroups}</span>
          <span style={{ fontSize: 12, color: C.m }}> / 56</span>
          <div style={{ fontSize: 10, color: C.m }}>総疾患群</div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: C.m, marginBottom: 6 }}>① 疾患群の ☐ を押して選択 → ② ▶ で病名を展開 → タップで複数選択</div>

      {/* Specialty accordion */}
      {DEMO_SPECIALTIES.slice(3, 8).map((sp, i) => {
        const isOpen = openSp === ['cardio', 'gastro', 'endo', 'metabolic', 'renal'][i]
        const spKey = ['cardio', 'gastro', 'endo', 'metabolic', 'renal'][i]
        return (
          <div key={i} style={{ marginBottom: 6 }}>
            <button onClick={() => setOpenSp(isOpen ? null : spKey)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              border: `1px solid ${C.br}`, borderRadius: 8, background: C.s0, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: C.tx, textAlign: 'left',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: sp.color }} />
              <span style={{ flex: 1 }}>{sp.short}</span>
              <span style={{ fontSize: 11, color: sp.groups >= sp.minG ? C.ok : C.wn, fontWeight: 600 }}>
                疾患群 {sp.groups}/{sp.minG || '-'}
              </span>
              <span style={{ fontSize: 11, color: C.m, marginLeft: 6 }}>計{sp.cases}症例</span>
              <span style={{ fontSize: 12, color: C.m, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
            </button>
            {isOpen && spKey === 'cardio' && (
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {demoExpanded.cardio.map((dg, j) => (
                  <div key={j} style={{ border: `1px solid ${dg.checked.length > 0 ? sp.color + '88' : C.br}`, borderRadius: 7, background: dg.checked.length > 0 ? sp.color + '14' : C.bg, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, border: `2px solid ${dg.checked.length > 0 ? sp.color : C.br2}`,
                        background: dg.checked.length > 0 ? sp.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 900,
                      }}>
                        {dg.checked.length > 0 && '✓'}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: dg.checked.length > 0 ? sp.color : C.tx }}>{dg.name}</span>
                      {dg.checked.length > 0 && <span style={{ fontSize: 11, color: sp.color, fontWeight: 600 }}>{dg.checked.length}症例</span>}
                    </div>
                    <div style={{ padding: '6px 10px', borderTop: `1px solid ${dg.checked.length > 0 ? sp.color + '44' : C.br}`, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {dg.diseases.map((d, k) => {
                        const on = dg.checked.includes(d)
                        return (
                          <span key={k} style={{
                            padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500,
                            border: `1.5px solid ${on ? sp.color : C.br}`,
                            background: on ? sp.color + '18' : C.s0, color: on ? sp.color : C.m,
                          }}>
                            {on && '✓ '}{d}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══ Demo: Summaries ═══ */
function SummariesDemo() {
  const demoSums = [
    { title: '心不全増悪で入院した拡張型心筋症の70代男性', sp: '循環器', status: 'accepted', color: '#DC2626' },
    { title: '発熱と呼吸困難で搬送された市中肺炎の60代女性', sp: '呼吸器', status: 'accepted', color: '#0D9488' },
    { title: 'DKAで緊急入院した1型糖尿病の30代男性', sp: '代謝', status: 'submitted', color: '#A855F7' },
    { title: '急性腎障害を合併したループス腎炎の40代女性', sp: '膠原病', status: 'draft', color: '#BE185D' },
    { title: '意識障害で搬送された細菌性髄膜炎の50代男性', sp: '感染症', status: 'draft', color: '#CA8A04' },
  ]

  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    accepted: { label: '受理', bg: '#DCFCE7', color: '#166534' },
    submitted: { label: '提出済', bg: '#FEF3C7', color: '#92400E' },
    draft: { label: '作成中', bg: '#F3F4F6', color: '#6B7280' },
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#9A3B3B' }}>{demoSummaries}</span>
          <span style={{ fontSize: 12, color: C.m }}> / 29 受理</span>
          <div style={{ fontSize: 10, color: C.m }}>病歴要約</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {Object.entries(statusMap).map(([k, v]) => (
            <span key={k} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: v.bg, color: v.color, fontWeight: 500 }}>{v.label}</span>
          ))}
        </div>
      </div>

      {/* Stacked progress */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16, background: C.s2 }}>
        <div style={{ width: `${2 / 29 * 100}%`, background: '#166534' }} />
        <div style={{ width: `${1 / 29 * 100}%`, background: '#D97706' }} />
        <div style={{ width: `${2 / 29 * 100}%`, background: '#9CA3AF' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {demoSums.map((s, i) => {
          const st = statusMap[s.status]
          return (
            <div key={i} style={{
              background: C.s0, border: `1px solid ${C.br}`, borderRadius: 10, padding: '12px 14px',
              borderLeft: `3px solid ${s.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                <span style={{ fontSize: 10, color: C.m, background: C.s1, padding: '1px 6px', borderRadius: 4 }}>{s.sp}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{s.title}</div>
            </div>
          )
        })}
      </div>

      {/* AI generation hint */}
      <div style={{ marginTop: 14, background: `linear-gradient(135deg, ${C.acl}, #d4e8dc)`, border: `1px solid ${C.ac}30`, borderRadius: 10, padding: '14px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ac, marginBottom: 2 }}>AI病歴要約生成</div>
          <div style={{ fontSize: 11, color: C.m, lineHeight: 1.5 }}>J-OSLER準拠の書式で自動生成。句読点「, .」常体・禁止語句チェック対応。</div>
        </div>
      </div>
    </div>
  )
}
