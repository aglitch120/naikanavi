'use client'

import { useState, useEffect, useRef } from 'react'
import Badge from './Badge'
import { SelfEvalButtons, AttemptHistory } from './MarkSystem'
import KokushiGlowButton from './KokushiGlowButton'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import type { Mark } from './types'

interface QuestionViewProps {
  onBack: () => void
  onShowAI?: () => void
  onShowCardGen?: () => void
}

const CHOICES: { l: string; t: string; correct?: boolean }[] = [
  { l: 'a', t: '膵の萎縮を認める。', correct: true },
  { l: 'b', t: '高齢男性に好発する。' },
  { l: 'c', t: '病理で線維化を認める。' },
  { l: 'd', t: 'IgG4関連疾患に含まれる。' },
  { l: 'e', t: 'グルココルチコイド投与が第一選択。' },
]

const CHOICE_EXPLANATIONS = [
  { l: 'a', correct: true,  text: '自己免疫性膵炎では膵実質の萎縮が特徴的にみられる。' },
  { l: 'b', correct: false, text: '高齢男性に好発するのは急性膵炎。AIPは比較的幅広い年齢層に発症する。' },
  { l: 'c', correct: false, text: '線維化はAIPでも認めるが、それ自体は正答ではない。' },
  { l: 'd', correct: false, text: 'IgG4関連疾患に含まれるのはAIPだが、これは正答肢ではない。' },
  { l: 'e', correct: false, text: 'グルココルチコイドはAIPの第一選択だが、設問の正解は膵萎縮である。' },
]

const ATTEMPTS: { date: string; result: Mark }[] = [
  { date: '03/20 14:32', result: 'x' },
  { date: '03/25 09:15', result: 'ok' },
  { date: '03/31 21:48', result: 'ok' },
]

export default function QuestionView({ onBack, onShowAI, onShowCardGen }: QuestionViewProps) {
  const { isPro, isLoading } = useProStatus()
  const [selAns, setSelAns] = useState<string | null>(null)
  const [showRes, setShowRes] = useState(false)
  const [showAIOverlay, setShowAIOverlay] = useState(false)
  const [showCardOverlay, setShowCardOverlay] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // ── ページ離脱警告（回答後）──
  useEffect(() => {
    if (!showRes) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [showRes])

  // ── 保存中アニメーション（PRO: 回答後に一時的に「保存中」表示）──
  useEffect(() => {
    if (!showRes || !isPro) return
    setIsSaving(true)
    const t = setTimeout(() => setIsSaving(false), 1200)
    return () => clearTimeout(t)
  }, [showRes, isPro])

  function handleChoiceClick(letter: string) {
    if (showRes) return
    setSelAns(letter)
    setTimeout(() => setShowRes(true), 400)
  }

  function choiceClasses(ch: (typeof CHOICES)[number]) {
    const base = 'flex items-center gap-3 w-full mb-2 rounded-[10px] border-[1.5px] p-3 text-left transition-colors'
    if (!showRes) {
      return selAns === ch.l
        ? `${base} bg-acl border-ac`
        : `${base} bg-s0 border-br`
    }
    if (ch.correct) return `${base} bg-okl border-okb`
    if (selAns === ch.l && !ch.correct) return `${base} bg-dnl border-dnb`
    return `${base} bg-s0 border-br`
  }

  function letterBadgeClasses(ch: (typeof CHOICES)[number]) {
    const base = 'w-[26px] h-[26px] rounded-[7px] border-[1.5px] flex items-center justify-center text-xs font-bold shrink-0'
    if (!showRes) {
      return selAns === ch.l
        ? `${base} bg-acl border-ac text-ac`
        : `${base} bg-s1 border-br text-muted`
    }
    if (ch.correct) return `${base} bg-okl border-okb text-ok`
    if (selAns === ch.l && !ch.correct) return `${base} bg-dnl border-dnb text-dn`
    return `${base} bg-s1 border-br text-muted`
  }

  return (
    <>
    <div ref={containerRef} className="px-4 pt-3 pb-28">
      {/* Sticky header */}
      <div className="flex items-center gap-2 sticky top-0 bg-bg pb-3 z-10">
        <button
          onClick={onBack}
          className="text-sm text-muted hover:text-tx transition-colors shrink-0"
        >
          ← 戻る
        </button>
        <Badge>119A1</Badge>
        <Badge color="accent">肝胆膵</Badge>
        <div className="ml-auto flex items-center gap-2">
          {/* 保存ステータス */}
          {!isLoading && (
            isPro ? (
              isSaving ? (
                <span className="flex items-center gap-1 text-[11px] text-muted animate-pulse">
                  <span>↻</span>
                  <span>保存中...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-muted">
                  <span>☁</span>
                  <span>保存済</span>
                </span>
              )
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-wn">
                <span>⚠</span>
                <span>未保存</span>
                <button
                  onClick={() => setShowProModal(true)}
                  className="text-ac font-semibold cursor-pointer hover:underline"
                >PROで保存</button>
              </span>
            )
          )}
          <span className="text-xs text-muted font-mono">1 / 24</span>
          {showRes && (
            <button className="px-3 py-1.5 rounded-lg bg-ac text-white text-xs font-semibold">
              次の問題 →
            </button>
          )}
        </div>
      </div>

      {/* Question stem */}
      <p className="text-[17px] font-medium leading-[1.75] mb-6 text-tx">
        自己免疫性膵炎（AIP）について正しいのはどれか。
      </p>

      {/* Choices */}
      {CHOICES.map(ch => (
        <button
          key={ch.l}
          className={choiceClasses(ch)}
          onClick={() => handleChoiceClick(ch.l)}
        >
          <span className={letterBadgeClasses(ch)}>
            {showRes && ch.correct ? '✓' : showRes && selAns === ch.l && !ch.correct ? '✕' : ch.l}
          </span>
          <span className="text-sm text-tx">{ch.t}</span>
        </button>
      ))}

      {/* Post-answer section */}
      {showRes && (
        <div className="animate-fade-in">
          {/* Self eval + history */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <SelfEvalButtons />
            <AttemptHistory attempts={ATTEMPTS} />
          </div>

          {/* Correct answer card */}
          <div className="bg-s0 border border-br rounded-xl p-5 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-ok font-bold text-sm">正解：a</span>
              <span className="text-sm text-tx">膵の萎縮を認める。</span>
              <Badge color="ai">AI生成</Badge>
            </div>
            <p className="text-sm text-tx leading-relaxed">
              自己免疫性膵炎（AIP）はIgG4関連疾患の一つで、膵実質の広範な萎縮と線維化を特徴とする。
              膵管の不規則な狭窄・閉塞を呈し、グルココルチコイドへの反応が良好である。
            </p>
          </div>

          {/* Per-choice explanations */}
          <div className="mt-4 space-y-2">
            {CHOICE_EXPLANATIONS.map(ex => (
              <div
                key={ex.l}
                className="pl-3 py-2 text-sm text-tx leading-relaxed"
                style={{ borderLeft: `2px solid var(--${ex.correct ? 'ok' : 'dn'})` }}
              >
                <span
                  className="font-bold mr-1.5"
                  style={{ color: `var(--${ex.correct ? 'ok' : 'dn'})` }}
                >
                  {ex.correct ? '○' : '✕'}{ex.l}
                </span>
                {ex.text}
              </div>
            ))}
          </div>

          {/* Background knowledge */}
          <div className="bg-s0 border border-br rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-muted mb-1.5">📚 背景知識</p>
            <p className="text-sm text-tx leading-relaxed">AIPは1型（IgG4関連・中高年男性・閉塞性黄疸）と2型（IgG4非関連・若年者・IBD合併）に分類される。</p>
          </div>

          {/* Key points */}
          <div className="bg-wnl border border-wnb rounded-[10px] p-3 mt-4">
            <p className="text-xs font-semibold text-wn mb-1">💡 覚えるポイント</p>
            <p className="text-sm text-tx leading-relaxed">AIP = IgG4関連 + 膵萎縮 + グルココルチコイド著効。PSC・シェーグレン症候群との鑑別が重要。</p>
          </div>

          {/* Related past questions */}
          <div className="bg-s0 border border-br rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-muted mb-2">関連過去問</p>
            <div className="space-y-2">
              {(['117B12|IgG4関連疾患の特徴はどれか。','118A5|グルココルチコイドが第一選択となる膵疾患はどれか。','116C8|膵管狭窄を来す疾患の組み合わせで正しいのはどれか。'] as const).map(s => {
                const [id, text] = s.split('|')
                return (
                  <div key={id} className="flex items-center gap-2">
                    <Badge>{id}</Badge>
                    <span className="text-xs text-tx">{text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-2 bg-s1 rounded-lg p-2 text-center text-[10.5px] text-muted">
            AI生成コンテンツは参考情報です。正確性は国試公式資料でご確認ください。
          </div>
        </div>
      )}

    </div>

      {/* Fixed bottom action buttons — shown only after answer is revealed */}
      {/* Fixed bottom action buttons — shown only after answer is revealed */}
      {showRes && (
        <div className="fixed bottom-[var(--nav-h,56px)] left-0 right-0 z-30 bg-gradient-to-t from-bg via-bg to-transparent pt-6 pb-4 px-4 md:px-8">
          <div className="flex gap-2.5 max-w-2xl mx-auto">
            <KokushiGlowButton onClick={() => setShowAIOverlay(true)} className="flex-1" small>
              ◇ AI深掘り <span className="text-[10px] opacity-70">3cr</span>
            </KokushiGlowButton>
            <KokushiGlowButton onClick={() => setShowCardOverlay(true)} className="flex-1" small>
              ⊞ 暗記カード生成 <span className="text-[10px] opacity-70">2cr</span>
            </KokushiGlowButton>
          </div>
        </div>
      )}

      {/* ── AI深掘り オーバーレイ ── */}
      {showAIOverlay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-bg/60 backdrop-blur-md"
            onClick={() => setShowAIOverlay(false)}
          />
          <div
            className="relative w-full max-w-2xl mx-auto h-[85vh] bg-s0 rounded-t-2xl border border-br shadow-xl flex flex-col overflow-hidden"
            style={{ animation: 'slideUp .25s cubic-bezier(.4,0,.2,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-br">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-tx">◇ AI深掘り</span>
                <Badge>119A1</Badge>
              </div>
              <button
                onClick={() => setShowAIOverlay(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-s1 text-muted"
              >✕</button>
            </div>
            {/* Chat content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {/* AI greeting bubble */}
              <div
                className="flex gap-2.5 items-start"
                style={{ animation: 'fadeIn .3s .2s cubic-bezier(.4,0,.2,1) both' }}
              >
                <div className="w-7 h-7 rounded-full bg-[rgba(108,92,231,0.12)] flex items-center justify-center text-xs shrink-0">◇</div>
                <div className="bg-s1 rounded-[14px] rounded-tl-[4px] px-4 py-2.5 max-w-[80%] text-sm text-tx leading-relaxed">
                  この問題について、わからないことや気になることはありますか？
                </div>
              </div>
              {/* Preset questions */}
              <div
                className="flex flex-wrap gap-2 ml-9"
                style={{ animation: 'fadeIn .3s .5s cubic-bezier(.4,0,.2,1) both' }}
              >
                <button className="px-3 py-1.5 rounded-lg bg-acl border border-ac/20 text-ac text-xs font-medium hover:bg-ac/10 transition-colors">なぜこれが正解？</button>
                <button className="px-3 py-1.5 rounded-lg bg-acl border border-ac/20 text-ac text-xs font-medium hover:bg-ac/10 transition-colors">他の選択肢の間違いを解説</button>
                <button className="px-3 py-1.5 rounded-lg bg-acl border border-ac/20 text-ac text-xs font-medium hover:bg-ac/10 transition-colors">関連知識をもっと教えて</button>
              </div>
            </div>
            {/* Input area */}
            <div className="border-t border-br px-5 py-3 bg-s0">
              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="質問を入力..."
                  className="flex-1 bg-s1 border border-br rounded-lg px-3 py-2 text-sm text-tx placeholder:text-muted outline-none focus:border-ac"
                />
                <button className="px-4 py-2 rounded-lg bg-ac text-white text-sm font-semibold shrink-0">送信</button>
              </div>
              <p className="text-[10px] text-muted mt-1.5 text-center">1回の質問で3クレジット消費</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 暗記カード生成 オーバーレイ ── */}
      {showCardOverlay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-bg/60 backdrop-blur-md"
            onClick={() => setShowCardOverlay(false)}
          />
          <div
            className="relative w-full max-w-2xl mx-auto h-[75vh] bg-s0 rounded-t-2xl border border-br shadow-xl flex flex-col overflow-hidden"
            style={{ animation: 'slideUp .25s cubic-bezier(.4,0,.2,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-br">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-tx">⊞ 暗記カード生成</span>
                <Badge color="ai">AI生成</Badge>
              </div>
              <button
                onClick={() => setShowCardOverlay(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-s1 text-muted"
              >✕</button>
            </div>
            {/* Cards list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {[
                { front: '自己免疫性膵炎の画像所見は？', back: 'びまん性膵腫大（ソーセージ様）+ capsule-like rim', type: '事実' },
                { front: 'AIPの治療の第一選択は？', back: 'グルココルチコイド（ステロイド）投与', type: '治療' },
                { front: 'AIPはどの疾患群に含まれるか？', back: 'IgG4関連疾患', type: '分類' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-s0 border border-br rounded-xl p-4"
                  style={{ animation: `slideUp .3s ${0.15 + i * 0.12}s cubic-bezier(.4,0,.2,1) both` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color="accent">{card.type}</Badge>
                    <span className="text-xs text-muted">カード {i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-tx mb-1.5">{card.front}</p>
                  <div className="bg-s1 rounded-lg p-3 text-xs text-tx leading-relaxed">{card.back}</div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="border-t border-br px-5 py-3 bg-s0">
              <button className="w-full py-3 rounded-xl bg-ac text-white text-sm font-semibold">3枚をデッキに追加</button>
              <p className="text-[10px] text-muted mt-1.5 text-center">カード生成で2クレジット消費</p>
            </div>
          </div>
        </div>
      )}

      {showProModal && <ProModal feature="save" onClose={() => setShowProModal(false)} />}
    </>
  )
}
