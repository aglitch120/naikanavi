// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#F5F4F0', s0: '#FEFEFC', s1: '#F0EDE7', s2: '#E8E5DF',
  br: '#DDD9D2', br2: '#C8C4BC', tx: '#1A1917', m: '#6B6760',
  ac: '#1B4F3A', acl: '#E8F0EC', ac2: '#155230',
  ok: '#166534', wn: '#B45309', dn: '#991B1B',
}

/* ── Demo quiz question ── */
const DEMO_Q = {
  question: '65歳男性。2型糖尿病で通院中。HbA1c 8.2%、eGFR 35 mL/min/1.73m²。現在メトホルミン1500mg/日を内服中。次の治療方針として最も適切なのはどれか。',
  choices: [
    'メトホルミンを増量する',
    'メトホルミンを減量し、DPP-4阻害薬を追加する',
    'メトホルミンを中止し、SU薬に変更する',
    'GLP-1受容体作動薬を追加する',
    'インスリン療法を開始する',
  ],
  correct: 1,
  explanation: 'eGFR 35はCKD G3b相当であり、メトホルミンは減量（最大750mg/日）が必要。HbA1c 8.2%と血糖コントロール不良のため、腎機能に応じた薬剤追加が適切。DPP-4阻害薬は腎排泄型も用量調整で使用可能であり、低血糖リスクも低い。',
  tags: ['代謝', '糖尿病', '腎機能'],
}

/* ── Demo stats ── */
const DEMO_STATS = {
  totalRate: 72, totalCorrect: 216, totalAttempts: 300,
  recentRate: 78, recentTotal: 50,
  weakGroups: [
    { label: '膠原病及び類縁疾患', rate: 45, correct: 9, attempts: 20 },
    { label: '血液', rate: 52, correct: 13, attempts: 25 },
    { label: '内分泌', rate: 58, correct: 14, attempts: 24 },
  ],
  groupStats: [
    { label: '循環器', rate: 85, attempts: 40 },
    { label: '消化器', rate: 80, attempts: 35 },
    { label: '呼吸器', rate: 76, attempts: 30 },
    { label: '腎臓', rate: 74, attempts: 28 },
    { label: '神経', rate: 70, attempts: 25 },
    { label: '感染症', rate: 68, attempts: 22 },
    { label: '救急', rate: 65, attempts: 20 },
    { label: '代謝', rate: 62, attempts: 18 },
  ],
}

/* ── Features ── */
const FEATURES = [
  {
    emoji: '🧠',
    title: '内科専門医 筆記試験対策',
    desc: '17領域・70疾患群から多肢選択問題をAI自動生成。実際の出題傾向に基づいた問題で、効率的に知識を定着。',
  },
  {
    emoji: '🎯',
    title: '3つの演習モード',
    desc: 'ランダム（全分野）・分野別（特定領域集中）・苦手克服（正答率60%未満を重点出題）。目的に応じた学習が可能。',
  },
  {
    emoji: '📊',
    title: '正答率・苦手分野の可視化',
    desc: '総合正答率・直近正答率・分野別正答率をダッシュボードで一目把握。苦手分野を自動検出してピンポイント学習。',
  },
  {
    emoji: '📚',
    title: '拡張可能な講座プラットフォーム',
    desc: 'エコー講座・輸液講座・抗菌薬講座など、臨床に直結する講座を順次追加予定。体系的に学べる環境を構築。',
  },
]

/* ── Future courses ── */
const COURSES = [
  { emoji: '🇺🇸', title: '医学英語講座', desc: 'フラッシュカード＋4択クイズ・6カテゴリ', status: '公開中', href: '/learning/medical-english' },
  { emoji: '🫀', title: '心エコー講座', desc: '基本断面・計測・弁膜症・RUSH', status: '公開中', href: '/learning/echo' },
  { emoji: '💧', title: '輸液講座', desc: '電解質・酸塩基・輸液設計', status: '公開中', href: '/learning/fluid' },
  { emoji: '💊', title: '抗菌薬講座', desc: 'スペクトラム・エンピリック・TDM', status: '企画中' },
  { emoji: '🫁', title: '人工呼吸器講座', desc: 'モード・設定・ウィーニング', status: '企画中' },
]

export default function LearningTeaser() {
  const [demoTab, setDemoTab] = useState<'quiz' | 'stats'>('quiz')
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleAnswer = (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
  }

  return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',sans-serif", color: C.tx }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${C.ac} 0%, ${C.ac2} 100%)`, padding: '48px 16px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 14px', marginBottom: 16, backdropFilter: 'blur(4px)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCD34D', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600, letterSpacing: '.5px' }}>COMING SOON</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>学習</h1>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,.85)', lineHeight: 1.7, margin: 0 }}>
            内科専門医 筆記試験対策の問題演習と、<br />
            臨床に直結する講座で知識を深める。
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 14px 80px' }}>

        {/* Demo Mockup */}
        <section style={{ marginTop: -20, position: 'relative', zIndex: 2 }}>
          <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>
            {/* Demo header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.br}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: C.ac, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>iw</div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>問題演習</span>
              <span style={{ fontSize: 11, color: C.ac, background: C.acl, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>PRO</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: '#DCFCE7', color: '#166534', fontFamily: 'monospace' }}>✓ デモ</span>
            </div>

            {/* Demo tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.br}` }}>
              {[{ id: 'quiz', l: '🧠 問題' }, { id: 'stats', l: '📊 スタッツ' }].map(t => (
                <button key={t.id} onClick={() => { setDemoTab(t.id as any); setSelected(null); setAnswered(false) }} style={{
                  flex: 1, padding: '11px 0', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: demoTab === t.id ? `2.5px solid ${C.ac}` : '2.5px solid transparent',
                  color: demoTab === t.id ? C.ac : C.m, fontWeight: demoTab === t.id ? 600 : 400, fontSize: 13,
                }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Demo content */}
            <div style={{ padding: '16px 14px', minHeight: 360, position: 'relative' }}>
              {demoTab === 'quiz' ? (
                <QuizDemo selected={selected} answered={answered} onAnswer={handleAnswer} />
              ) : (
                <StatsDemo />
              )}

              {/* Fade overlay */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
                background: `linear-gradient(transparent, ${C.s0}ee 40%, ${C.s0})`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: C.m, marginBottom: 8 }}>開発中 — PRO会員は完成時に即利用可能</p>
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

        {/* Features */}
        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>主な機能</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '16px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.acl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{f.emoji}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: C.m, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Future courses */}
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>講座一覧</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {COURSES.map((c, i) => {
              const inner = (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: C.m, marginBottom: 8, lineHeight: 1.5 }}>{c.desc}</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: (c as any).href ? C.acl : C.s1, color: (c as any).href ? C.ac : C.br2, fontWeight: 500 }}>{c.status}</span>
                </>
              )
              return (c as any).href ? (
                <a key={i} href={(c as any).href} style={{ background: C.s0, border: `1.5px solid ${C.ac}30`, borderRadius: 12, padding: '16px 14px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  {inner}
                </a>
              ) : (
                <div key={i} style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                  {inner}
                </div>
              )
            })}
          </div>
        </section>

        {/* J-OSLER integration */}
        <section style={{ marginTop: 32 }}>
          <div style={{ background: `linear-gradient(135deg, ${C.acl}, #d4e8dc)`, border: `1px solid ${C.ac}30`, borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔗</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ac, marginBottom: 6 }}>J-OSLER管理と連動</h3>
            <p style={{ fontSize: 13, color: C.m, lineHeight: 1.65, marginBottom: 16 }}>
              J-OSLER管理で記録した症例の領域に基づいて、<br />
              足りない知識を自動で特定。効率的に弱点を補強。
            </p>
            <Link href="/josler" style={{
              display: 'inline-block', padding: '10px 24px', borderRadius: 9,
              border: `1.5px solid ${C.ac}`, background: C.s0, color: C.ac,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              J-OSLER管理を見る →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section style={{ marginTop: 36, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.m, marginBottom: 12, lineHeight: 1.6 }}>
            学習プラットフォームは現在開発中です。<br />
            PRO会員は完成時に追加料金なしで利用できます。
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pro" style={{
              padding: '13px 32px', borderRadius: 10,
              background: `linear-gradient(135deg, ${C.ac}, ${C.ac2})`, color: '#fff',
              fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 20px ${C.ac}44`,
            }}>
              PRO会員になる
            </Link>
            <Link href="/josler" style={{
              padding: '13px 24px', borderRadius: 10,
              border: `1.5px solid ${C.br}`, background: C.s0, color: C.tx,
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}>
              J-OSLER管理を試す
            </Link>
          </div>
        </section>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </main>
  )
}

/* ═══ Quiz Demo ═══ */
function QuizDemo({ selected, answered, onAnswer }: any) {
  const q = DEMO_Q
  return (
    <div>
      {/* Mode badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ emoji: '🎲', l: 'ランダム', active: true }, { emoji: '📁', l: '分野別', active: false }, { emoji: '⚡', l: '苦手克服', active: false }].map((m, i) => (
          <div key={i} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${m.active ? C.ac : C.br}`, background: m.active ? C.acl : C.s0,
            color: m.active ? C.ac : C.m, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>{m.emoji}</span>{m.l}
          </div>
        ))}
      </div>

      {/* Question */}
      <div style={{ fontSize: 11, color: C.m, marginBottom: 6 }}>Q1 / 5</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {q.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: C.acl, color: C.ac, fontWeight: 500 }}>{t}</span>)}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16, fontWeight: 500 }}>{q.question}</p>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {q.choices.map((c, i) => {
          const isCorrect = i === q.correct
          const isSelected = selected === i
          let bg = C.s0, border = C.br, color = C.tx
          if (answered) {
            if (isCorrect) { bg = '#DCFCE7'; border = '#86EFAC'; color = C.ok }
            else if (isSelected && !isCorrect) { bg = '#FEE2E2'; border = '#FCA5A5'; color = C.dn }
          } else if (isSelected) { bg = C.acl; border = C.ac; color = C.ac }

          return (
            <button key={i} onClick={() => onAnswer(i)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8,
              border: `1.5px solid ${border}`, background: bg, color, fontSize: 13, cursor: 'pointer',
              textAlign: 'left', width: '100%', fontFamily: 'inherit', lineHeight: 1.5,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${answered && isCorrect ? C.ok : isSelected ? C.ac : C.br2}`, background: answered && isCorrect ? C.ok : isSelected ? C.ac : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                {answered && isCorrect ? '✓' : answered && isSelected ? '✕' : String.fromCharCode(65 + i)}
              </span>
              <span style={{ fontWeight: isSelected || (answered && isCorrect) ? 600 : 400 }}>{c}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 8, background: selected === q.correct ? '#EAF4EE' : '#FDF0F0', border: `1px solid ${selected === q.correct ? '#A7C4B5' : '#E0B8B8'}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selected === q.correct ? C.ok : C.dn, marginBottom: 6 }}>
            {selected === q.correct ? '✓ 正解！' : '✕ 不正解'}
          </div>
          <p style={{ fontSize: 12, color: C.tx, lineHeight: 1.65, margin: 0 }}>{q.explanation}</p>
        </div>
      )}
    </div>
  )
}

/* ═══ Stats Demo ═══ */
function StatsDemo() {
  const s = DEMO_STATS
  return (
    <div>
      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { l: '総合正答率', v: `${s.totalRate}%`, sub: `${s.totalCorrect}/${s.totalAttempts}問`, c: s.totalRate >= 70 ? C.ok : C.wn },
          { l: `直近${s.recentTotal}問`, v: `${s.recentRate}%`, sub: '正答率', c: s.recentRate >= 70 ? C.ok : C.wn },
          { l: '演習済み', v: `${s.totalAttempts}`, sub: '問', c: C.ac },
        ].map((d, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.m, marginBottom: 4 }}>{d.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: d.c }}>{d.v}</div>
            <div style={{ fontSize: 11, color: C.m }}>{d.sub}</div>
          </div>
        ))}
      </div>

      {/* Weak groups */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.wn, marginBottom: 8 }}>⚠ 苦手分野（正答率60%未満）</div>
        {s.weakGroups.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.s0, border: `1px solid ${C.br}`, borderRadius: 8, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{w.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: w.rate < 50 ? C.dn : C.wn }}>{w.rate}%</span>
            <span style={{ fontSize: 11, color: C.m }}>({w.correct}/{w.attempts})</span>
            <span style={{ padding: '3px 8px', background: C.ac, color: '#fff', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>演習</span>
          </div>
        ))}
      </div>

      {/* Group stats table */}
      <div style={{ fontSize: 12, fontWeight: 600, color: C.ac, marginBottom: 8 }}>分野別正答率</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.br}` }}>
              {['分野', '正答率', '問題数'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: h === '分野' ? 'left' : 'center', fontWeight: 600, color: C.m, fontSize: 10 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.groupStats.map((g, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.s1}` }}>
                <td style={{ padding: '6px 8px' }}>{g.label}</td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span style={{ fontWeight: 700, color: g.rate >= 70 ? C.ok : g.rate >= 50 ? C.wn : C.dn }}>{g.rate}%</span>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px', color: C.m }}>{g.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
