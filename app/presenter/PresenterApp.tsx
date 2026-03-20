'use client'
import { useState, useMemo, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'
import { PresenterTutorial } from '@/components/tutorials'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 型定義 ──
type PresentationType = 'case-report' | 'conference' | 'consultation' | 'journal-club'
type Audience = 'specialist' | 'resident' | 'student' | 'mixed'
type Format = 'slide' | 'poster' | 'abstract-doc' | 'a4-handout'

interface Settings {
  type: PresentationType
  audience: Audience
  duration: number // minutes
  format: Format
  topic: string
  sections: string[] // custom sections to include
}

const TYPES: { id: PresentationType; label: string; icon: string; desc: string }[] = [
  { id: 'case-report', label: '症例報告', icon: '📋', desc: 'カンファ・症例検討会向け' },
  { id: 'conference', label: '学会発表', icon: '🎤', desc: '学会口演・ポスター向け' },
  { id: 'consultation', label: 'コンサルテーション', icon: '🏥', desc: '他科コンサル・紹介状向け' },
  { id: 'journal-club', label: 'ジャーナルクラブ', icon: '📚', desc: '論文抄読会向け' },
]

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: 'specialist', label: '専門医' },
  { id: 'resident', label: '研修医' },
  { id: 'student', label: '医学生' },
  { id: 'mixed', label: '混合' },
]

const FORMATS: { id: Format; label: string; icon: string }[] = [
  { id: 'slide', label: 'スライド', icon: '🖥️' },
  { id: 'poster', label: 'ポスター', icon: '📊' },
  { id: 'abstract-doc', label: '抄録文書', icon: '📄' },
  { id: 'a4-handout', label: 'A4配布資料', icon: '📋' },
]

const DURATIONS = [3, 5, 7, 10, 15, 20, 30]

// ── テンプレート定義 ──
interface TemplateSection {
  title: string
  subtitle?: string
  bullets: string[]
  slideNote?: string
  timeGuide?: string
}

function generateTemplate(s: Settings): { title: string; sections: TemplateSection[]; totalSlides: number; wordGuide: string } {
  const slidePerMin = s.duration <= 5 ? 1.5 : s.duration <= 10 ? 1.2 : 1
  const totalSlides = Math.round(s.duration * slidePerMin)
  const wordsPerMin = s.audience === 'specialist' ? 150 : 120
  const wordGuide = `約${s.duration * wordsPerMin}字（${wordsPerMin}字/分 × ${s.duration}分）`

  const audienceNote = s.audience === 'specialist' ? '専門用語OK、エビデンスレベルを明示'
    : s.audience === 'resident' ? '基本的な略語は使用可、背景を簡潔に説明'
    : s.audience === 'student' ? '略語は初出時にフルスペル、基礎知識の補足を入れる'
    : '専門用語は最小限に、重要な略語は注釈'

  let sections: TemplateSection[] = []

  switch (s.type) {
    case 'case-report':
      sections = [
        { title: 'タイトルスライド', bullets: ['演題名（疾患名+特徴的なポイント）', '発表者名・所属', '日付・カンファレンス名'], timeGuide: '〜30秒' },
        { title: '症例提示', subtitle: '患者背景', bullets: ['年齢・性別（例: 70歳代男性）', '主訴', '現病歴（時系列で簡潔に）', '既往歴・内服薬・アレルギー', '家族歴・社会歴（関連するもののみ）'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '身体所見・検査所見', bullets: ['バイタルサイン', '身体所見（系統的に、異常所見を強調）', '血液検査（異常値をハイライト）', '画像所見（X線/CT/MRI/エコー）', '心電図・その他の検査'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '臨床経過', bullets: ['入院後の治療経過（タイムライン推奨）', '治療内容と反応', '転帰'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '考察', bullets: ['本症例の問題点・ポイント', '鑑別疾患の検討', '文献的考察（ガイドライン/エビデンス）', `対象: ${audienceNote}`], timeGuide: `〜${Math.round(s.duration * 0.35)}分` },
        { title: 'まとめ・Take Home Message', bullets: ['本症例から学ぶべきポイント（2-3点）', '今後の課題'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
        { title: '参考文献', bullets: ['引用文献リスト（Vancouver形式）', '主要なガイドライン'], timeGuide: '表示のみ' },
      ]
      break

    case 'conference':
      sections = [
        { title: 'タイトルスライド', bullets: ['演題名', '発表者名・所属・共同演者', '利益相反（COI）の開示'], timeGuide: '〜30秒' },
        { title: '背景・目的', bullets: ['臨床的背景（なぜこの研究/報告が重要か）', '先行研究の概要と限界', '研究目的（クリアに1-2文で）'], timeGuide: `〜${Math.round(s.duration * 0.15)}分`, slideNote: 'スライド2-3枚' },
        { title: '方法', bullets: ['研究デザイン（RCT/コホート/症例報告等）', '対象患者・選択基準・除外基準', '主要評価項目(primary endpoint)', '統計解析方法'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '結果', bullets: ['患者フローチャート（CONSORT図等）', '主要結果（図表で示す）', '副次的結果', '安全性・有害事象'], timeGuide: `〜${Math.round(s.duration * 0.3)}分`, slideNote: '結果は図表メイン。文字は最小限に' },
        { title: '考察', bullets: ['結果の解釈と臨床的意義', '先行研究との比較', '研究の限界（Limitations）', '今後の展望'], timeGuide: `〜${Math.round(s.duration * 0.2)}分` },
        { title: '結論', bullets: ['主要な結論（1-3点）', 'Clinical implications'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
        { title: '参考文献', bullets: ['引用文献リスト'], timeGuide: '表示のみ' },
      ]
      break

    case 'consultation':
      sections = [
        { title: 'コンサルテーション概要', bullets: ['依頼元（自科名）', '依頼先（コンサル先科名）', '依頼理由（具体的に1-2文）'], timeGuide: '〜30秒' },
        { title: '患者情報', bullets: ['年齢・性別・入院日・病棟', '主病名・入院理由', '関連する既往歴・内服薬'], timeGuide: '〜1分' },
        { title: '現在の問題点', bullets: ['コンサルの具体的な質問（明確に）', '関連する検査結果（バイタル/血液/画像）', '経過・これまでの対応'], timeGuide: '〜2分' },
        { title: '依頼事項', bullets: ['診断の確認/治療方針の相談', '手技/処置の依頼', '具体的に何をしてほしいか'], timeGuide: '〜30秒' },
      ]
      break

    case 'journal-club':
      sections = [
        { title: 'タイトル・論文情報', bullets: ['論文タイトル', '著者・雑誌・出版年', 'Impact Factor・引用数'], timeGuide: '〜30秒' },
        { title: 'Clinical Question', bullets: ['PICO形式で整理', 'P(患者): 対象集団', 'I(介入): 何をしたか', 'C(対照): 何と比較したか', 'O(アウトカム): 何を測定したか'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
        { title: '研究デザイン・方法', bullets: ['研究デザイン（RCT/メタ解析等）', '組み入れ基準・除外基準', 'ランダム化・盲検化の方法', '主要/副次評価項目', 'サンプルサイズ計算'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '結果', bullets: ['主要結果（Table/Figureを引用）', '副次的結果', 'サブグループ解析', 'NNT/NNH（計算可能なら）'], timeGuide: `〜${Math.round(s.duration * 0.25)}分` },
        { title: '批判的吟味', bullets: ['内的妥当性: バイアスのリスク（選択/情報/交絡）', '外的妥当性: 日本の臨床に適用可能か', '統計的問題点', 'エビデンスレベルの評価'], timeGuide: `〜${Math.round(s.duration * 0.25)}分` },
        { title: 'Clinical Bottom Line', bullets: ['この論文から何を学ぶか', '明日からの診療にどう活かすか', '残された疑問・今後の研究課題'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
      ]
      break
  }

  const title = s.topic || TYPES.find(t => t.id === s.type)?.label || 'プレゼンテーション'

  return { title, sections, totalSlides, wordGuide }
}

// ═══════════════════════════════════════
export default function PresenterApp() {
  const [step, setStep] = useState<'settings' | 'result'>('settings')
  const [settings, setSettings] = useState<Settings>({
    type: 'case-report', audience: 'resident', duration: 7, format: 'slide', topic: '', sections: [],
  })
  const [copied, setCopied] = useState(false)

  const template = useMemo(() => generateTemplate(settings), [settings])

  const handleGenerate = useCallback(() => {
    setStep('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCopy = useCallback(() => {
    const text = template.sections.map(s =>
      `【${s.title}】${s.subtitle ? ` — ${s.subtitle}` : ''}\n${s.bullets.map(b => `・${b}`).join('\n')}${s.timeGuide ? `\n（時間目安: ${s.timeGuide}）` : ''}`
    ).join('\n\n')
    const header = `■ ${template.title}\n形式: ${FORMATS.find(f => f.id === settings.format)?.label} | 対象: ${AUDIENCES.find(a => a.id === settings.audience)?.label} | ${settings.duration}分\nスライド目安: ${template.totalSlides}枚 | 文字数目安: ${template.wordGuide}\n${'─'.repeat(40)}\n\n`
    navigator.clipboard.writeText(header + text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [template, settings])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // ── 設定画面 ──
  if (step === 'settings') {
    return (
      <>
        <Header />
        <div className="space-y-5">
          {/* 発表タイプ */}
          <Section title="1. 発表タイプ">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => updateSetting('type', t.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.type === t.id ? 'border-ac bg-acl shadow-sm' : 'border-br bg-s0 hover:border-ac/30'
                  }`}>
                  <span className="text-lg block mb-1">{t.icon}</span>
                  <p className={`text-xs font-bold ${settings.type === t.id ? 'text-ac' : 'text-tx'}`}>{t.label}</p>
                  <p className="text-[10px] text-muted mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* 対象者 */}
          <Section title="2. 対象者">
            <div className="flex gap-2 flex-wrap">
              {AUDIENCES.map(a => (
                <button key={a.id} onClick={() => updateSetting('audience', a.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    settings.audience === a.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                  }`}>{a.label}</button>
              ))}
            </div>
          </Section>

          {/* 発表時間 */}
          <Section title="3. 発表時間">
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map(d => (
                <button key={d} onClick={() => updateSetting('duration', d)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    settings.duration === d ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                  }`}>{d}分</button>
              ))}
            </div>
          </Section>

          {/* 出力形式 */}
          <Section title="4. 出力形式">
            <div className="flex gap-2 flex-wrap">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => updateSetting('format', f.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    settings.format === f.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                  }`}><span>{f.icon}</span>{f.label}</button>
              ))}
            </div>
          </Section>

          {/* トピック（任意） */}
          <Section title="5. トピック（任意）">
            <input type="text" value={settings.topic} onChange={e => updateSetting('topic', e.target.value)}
              placeholder="例: 70歳男性のDKA症例、SGLT2阻害薬の有効性メタ解析"
              className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all" />
          </Section>

          {/* 生成ボタン */}
          <button onClick={handleGenerate}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
            style={{ background: MC, boxShadow: `0 4px 14px ${MC}33` }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            テンプレートを生成
          </button>

          {/* PRO teaser */}
          <ProTeaser />
        </div>
        <PresenterTutorial />
      </>
    )
  }

  // ── 結果画面 ──
  return (
    <>
      <Header />
      <div className="space-y-4">
        {/* 戻る + コピー */}
        <div className="flex items-center justify-between">
          <button onClick={() => setStep('settings')} className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            設定に戻る
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
            style={{ background: MC }}>
            {copied ? (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>コピー済み</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>全文コピー</>
            )}
          </button>
        </div>

        {/* サマリー */}
        <div className="bg-s0 border border-br rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">{TYPES.find(t => t.id === settings.type)?.icon}</span>
            <div>
              <p className="text-base font-bold text-tx">{template.title}</p>
              <p className="text-[11px] text-muted">
                {AUDIENCES.find(a => a.id === settings.audience)?.label}向け · {settings.duration}分 · {FORMATS.find(f => f.id === settings.format)?.label}
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-[11px] mt-2">
            <span className="px-2 py-1 rounded-lg" style={{ background: MCL, color: MC }}>スライド {template.totalSlides}枚目安</span>
            <span className="px-2 py-1 rounded-lg" style={{ background: MCL, color: MC }}>文字数 {template.wordGuide}</span>
          </div>
        </div>

        {/* セクション */}
        {template.sections.map((sec, i) => (
          <div key={i} className="bg-s0 border border-br rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>{i + 1}</span>
                <div>
                  <h3 className="text-sm font-bold text-tx">{sec.title}</h3>
                  {sec.subtitle && <p className="text-[10px] text-muted">{sec.subtitle}</p>}
                </div>
              </div>
              {sec.timeGuide && (
                <span className="text-[10px] text-muted bg-s1 px-2 py-0.5 rounded">{sec.timeGuide}</span>
              )}
            </div>
            <ul className="space-y-1 mt-2">
              {sec.bullets.map((b, j) => (
                <li key={j} className="text-xs text-tx/80 leading-relaxed flex gap-2">
                  <span className="text-ac flex-shrink-0 mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {sec.slideNote && (
              <p className="text-[10px] text-muted mt-2 italic">💡 {sec.slideNote}</p>
            )}
          </div>
        ))}

        {/* プレゼンのコツ */}
        <div className="bg-s1 border border-br rounded-xl p-4">
          <h3 className="text-sm font-bold text-tx mb-2 flex items-center gap-1.5">
            <span>🎯</span>プレゼンのコツ
          </h3>
          <ul className="space-y-1.5 text-xs text-muted">
            <li className="flex gap-2"><span className="text-ac">•</span>1スライド = 1メッセージ。文字は最小限に</li>
            <li className="flex gap-2"><span className="text-ac">•</span>図・表・画像を活用。テキストの羅列を避ける</li>
            <li className="flex gap-2"><span className="text-ac">•</span>フォントサイズ: タイトル28pt以上、本文20pt以上</li>
            <li className="flex gap-2"><span className="text-ac">•</span>配色: 3色以内。背景は白 or 薄い色</li>
            <li className="flex gap-2"><span className="text-ac">•</span>発表練習: 時間を計って最低3回リハーサル</li>
            <li className="flex gap-2"><span className="text-ac">•</span>質疑応答: 想定質問を3-5個準備しておく</li>
          </ul>
        </div>

        {/* PRO teaser */}
        <ProTeaser />
      </div>
    </>
  )
}

// ── 共通パーツ ──
function Header() {
  return (
    <AppHeader
      title="プレゼン資料生成"
      subtitle="タイプ・対象者・時間を設定 → 構成テンプレートを生成"
      badge="PRO"
      favoriteSlug="app-presenter"
      favoriteHref="/presenter"
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-4">
      <p className="text-xs font-bold text-tx mb-3">{title}</p>
      {children}
    </div>
  )
}

function ProTeaser() {
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">✨</span>
        <p className="text-sm font-bold text-tx">Coming Soon — AI生成機能</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>
      </div>
      <div className="space-y-2 relative">
        {['トピックを入力するだけでAIが原稿を自動生成', 'スライド（PPTX）のダウンロード', '論文ブックマークからの自動インポート', 'ポスター/抄録のPDF出力'].map((item, i) => (
          <div key={i} className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-s1 ${i > 0 ? 'select-none' : ''}`}>
            <span className="text-xs text-muted">🔒</span>
            <p className="text-xs text-muted">{item}</p>
          </div>
        ))}
        <div className="absolute inset-0 top-10 backdrop-blur-sm bg-s0/70 rounded-lg flex items-center justify-center">
          <p className="text-xs font-medium" style={{ color: MC }}>開発中 — お楽しみに</p>
        </div>
      </div>
    </div>
  )
}
