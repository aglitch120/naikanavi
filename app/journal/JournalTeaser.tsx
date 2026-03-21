// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#F5F4F0', s0: '#FEFEFC', s1: '#F0EDE7', s2: '#E8E5DF',
  br: '#DDD9D2', br2: '#C8C4BC', tx: '#1A1917', m: '#6B6760',
  ac: '#1B4F3A', acl: '#E8F0EC', ac2: '#155230', ok: '#166534',
}

/* ── Demo papers ── */
const DEMO_PAPERS = [
  {
    id: 1,
    title: 'SGLT2阻害薬の心不全入院抑制効果: HFpEF患者における大規模RCTの結果',
    journal: 'NEJM',
    date: '2026-03-15',
    tags: ['循環器', '心不全', 'RCT'],
    summary: 'HFpEF患者2,500名を対象としたRCTにおいて、SGLT2阻害薬は心不全入院を26%有意に減少させた。一次エンドポイントの心血管死亡+心不全入院の複合アウトカムはHR 0.79（95%CI 0.69-0.90）であり、EF≧50%のサブグループでも一貫した効果が確認された。',
    impact: '臨床的意義',
    impactText: 'HFpEFに対するSGLT2阻害薬の適応拡大を支持する重要なエビデンス。ガイドライン改訂への影響が予想される。',
    free: true,
  },
  {
    id: 2,
    title: 'AI支援による敗血症早期認識システムの多施設前向き研究',
    journal: 'Lancet Digital Health',
    date: '2026-03-12',
    tags: ['感染症', '救急', 'AI'],
    summary: '12施設・45,000入院を対象とした前向き研究。AIアラートシステム導入により、敗血症の認識が中央値で2.1時間早期化し、院内死亡率が8.2%→6.4%に低下した（調整OR 0.76）。偽陽性率は12%であり、臨床的に許容可能な範囲であった。',
    impact: 'ポイント',
    impactText: '早期認識の時間短縮が死亡率改善に直結。国内導入に向けた検討材料となる。',
    free: true,
  },
  {
    id: 3,
    title: '免疫チェックポイント阻害薬関連心筋炎の早期診断バイオマーカー',
    journal: 'JAMA Oncology',
    date: '2026-03-10',
    tags: ['腫瘍', '循環器', 'バイオマーカー'],
    summary: 'ICI関連心筋炎の早期診断における高感度トロポニンT+BNP+CRP複合スコアの有用性を後ろ向きに検証。AUC 0.94で従来のトロポニン単独（AUC 0.82）より優れた診断能を示した。',
    impact: '臨床的意義',
    impactText: 'ICI投与中のモニタリング戦略として、複合バイオマーカーの定期測定が推奨される可能性。',
    free: true,
  },
  {
    id: 4,
    title: 'メトホルミンの腸内細菌叢を介した血糖降下メカニズムの解明',
    journal: 'Nature Medicine',
    date: '2026-03-08',
    tags: ['代謝', '糖尿病', '基礎研究'],
    summary: null,
    free: false,
  },
  {
    id: 5,
    title: '高齢CKD患者におけるフェブキソスタットvs アロプリノールの腎保護効果',
    journal: 'Kidney International',
    date: '2026-03-05',
    tags: ['腎臓', '代謝', 'RCT'],
    summary: null,
    free: false,
  },
  {
    id: 6,
    title: 'COVID-19後遺症における自律神経障害の病態生理と治療アプローチ',
    journal: 'Annals of Internal Medicine',
    date: '2026-03-03',
    tags: ['感染症', '神経', 'レビュー'],
    summary: null,
    free: false,
  },
]

/* ── Features ── */
const FEATURES = [
  {
    emoji: '🤖',
    title: 'AI日本語要約',
    desc: 'PubMedから取得した最新論文をAIが日本語で構造化要約。背景・方法・結果・臨床的意義まで、数秒で把握。',
  },
  {
    emoji: '📰',
    title: '主要ジャーナル自動取得',
    desc: 'NEJM・Lancet・JAMA・BMJなど主要ジャーナルの新着論文を毎日自動チェック。内科領域に特化したキュレーション。',
  },
  {
    emoji: '🏷️',
    title: '領域タグ & フィルタ',
    desc: '17の内科領域タグで自動分類。自分の専門・興味のある分野だけをフィルタリングして効率的に閲覧。',
  },
  {
    emoji: '🔖',
    title: 'ブックマーク & メモ',
    desc: '気になる論文をブックマーク保存。メモを残して後から振り返り。抄読会や症例検討の準備に活用。',
  },
]

/* ── Journals ── */
const JOURNALS = [
  { name: 'NEJM', color: '#B91C1C' },
  { name: 'Lancet', color: '#1D4ED8' },
  { name: 'JAMA', color: '#047857' },
  { name: 'BMJ', color: '#7C3AED' },
  { name: 'Ann Int Med', color: '#B45309' },
  { name: 'Nature Med', color: '#0F766E' },
]

export default function JournalTeaser() {
  const [expandedId, setExpandedId] = useState<number | null>(1)

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
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>論文フィード</h1>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,.85)', lineHeight: 1.7, margin: 0 }}>
            最新の医学論文をAIが日本語で要約。<br />
            忙しい臨床の合間に、最新エビデンスをキャッチアップ。
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 14px 80px' }}>

        {/* Demo feed */}
        <section style={{ marginTop: -20, position: 'relative', zIndex: 2 }}>
          <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.br}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: C.ac, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>iw</div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>論文フィード</span>
              <span style={{ fontSize: 11, color: C.ac, background: C.acl, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>FREEMIUM</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: '#DCFCE7', color: '#166534', fontFamily: 'monospace' }}>✓ デモ</span>
            </div>

            {/* Journal filter chips */}
            <div style={{ padding: '10px 14px', display: 'flex', gap: 5, overflowX: 'auto', borderBottom: `1px solid ${C.br}` }}>
              <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: C.ac, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>すべて</span>
              {JOURNALS.map(j => (
                <span key={j.name} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: C.s1, color: C.m, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' }}>{j.name}</span>
              ))}
            </div>

            {/* Paper list */}
            <div style={{ padding: '12px 14px', position: 'relative' }}>
              {DEMO_PAPERS.map((p, i) => {
                const isExpanded = expandedId === p.id
                const isLocked = !p.free
                return (
                  <div key={p.id} onClick={() => !isLocked && setExpandedId(isExpanded ? null : p.id)} style={{
                    background: isLocked ? C.s1 : C.s0, border: `1px solid ${isExpanded ? C.ac + '44' : C.br}`,
                    borderRadius: 10, padding: '14px 14px', marginBottom: 8, cursor: isLocked ? 'default' : 'pointer',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* FREE / PRO badge */}
                    {i < 3 && (
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.acl, color: C.ac, fontWeight: 600 }}>FREE</span>
                    )}
                    {isLocked && (
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>PRO</span>
                    )}

                    {/* Date + journal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: C.br2 }}>{p.date}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: JOURNALS.find(j => j.name === p.journal)?.color + '18' || C.s1, color: JOURNALS.find(j => j.name === p.journal)?.color || C.m, fontWeight: 600 }}>{p.journal}</span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, color: isLocked ? C.br2 : C.tx, filter: isLocked ? 'blur(2px)' : 'none', userSelect: isLocked ? 'none' : 'auto' }}>
                      {p.title}
                    </h3>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: isExpanded ? 10 : 0 }}>
                      {p.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: C.acl, color: C.ac, fontWeight: 500 }}>{t}</span>
                      ))}
                    </div>

                    {/* Expanded summary */}
                    {isExpanded && p.summary && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.ac, marginBottom: 4 }}>📝 AI要約</div>
                        <p style={{ fontSize: 13, color: C.tx, lineHeight: 1.7, margin: '0 0 10px' }}>{p.summary}</p>
                        {p.impactText && (
                          <div style={{ background: C.acl, borderRadius: 8, padding: '10px 12px', border: `1px solid ${C.ac}20` }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.ac, marginBottom: 3 }}>💡 {p.impact}</div>
                            <p style={{ fontSize: 12, color: C.m, lineHeight: 1.6, margin: 0 }}>{p.impactText}</p>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <span style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.br}`, fontSize: 11, color: C.m, cursor: 'pointer' }}>🔖 ブックマーク</span>
                          <span style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.br}`, fontSize: 11, color: C.m, cursor: 'pointer' }}>📋 PubMedで開く</span>
                        </div>
                      </div>
                    )}

                    {/* Locked overlay */}
                    {isLocked && (
                      <div style={{ position: 'absolute', inset: 0, background: `${C.s1}cc`, backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>🔒</div>
                          <div style={{ fontSize: 12, color: C.m, fontWeight: 500 }}>PRO会員で全記事閲覧</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Fade */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
                background: `linear-gradient(transparent, ${C.s0})`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12,
              }}>
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
        </section>

        {/* FREE vs PRO */}
        <section style={{ marginTop: 32 }}>
          <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '20px 16px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>FREE / PRO 比較</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.br}` }}>
              {/* Header */}
              <div style={{ padding: '10px 12px', background: C.s1, fontWeight: 600, fontSize: 13, textAlign: 'center', borderBottom: `1px solid ${C.br}`, borderRight: `1px solid ${C.br}` }}>FREE</div>
              <div style={{ padding: '10px 12px', background: C.acl, fontWeight: 600, fontSize: 13, textAlign: 'center', borderBottom: `1px solid ${C.br}`, color: C.ac }}>PRO</div>
              {/* Rows */}
              {[
                ['最新3件を閲覧', '全アーカイブ閲覧'],
                ['タイトル + タグ', 'AI日本語要約'],
                ['—', 'ブックマーク保存'],
                ['—', 'メモ機能'],
                ['—', '領域フィルタ'],
              ].map(([f, p], i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div style={{ padding: '10px 12px', fontSize: 12, color: f === '—' ? C.br2 : C.tx, borderBottom: i < 4 ? `1px solid ${C.s1}` : 'none', borderRight: `1px solid ${C.br}`, textAlign: 'center' }}>{f}</div>
                  <div style={{ padding: '10px 12px', fontSize: 12, color: C.ac, fontWeight: 500, borderBottom: i < 4 ? `1px solid ${C.s1}` : 'none', textAlign: 'center' }}>✓ {p}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ marginTop: 32 }}>
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

        {/* Journal sources */}
        <section style={{ marginTop: 32 }}>
          <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>対象ジャーナル</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {JOURNALS.map(j => (
                <span key={j.name} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: j.color + '12', color: j.color, border: `1px solid ${j.color}30` }}>{j.name}</span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.m, marginTop: 12 }}>＋ 内科系専門ジャーナルを順次追加予定</p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ marginTop: 36, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.m, marginBottom: 12, lineHeight: 1.6 }}>
            論文フィードは現在開発中です。<br />
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
            <Link href="/blog" style={{
              padding: '13px 24px', borderRadius: 10,
              border: `1.5px solid ${C.br}`, background: C.s0, color: C.tx,
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}>
              ブログを読む
            </Link>
          </div>
        </section>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </main>
  )
}
