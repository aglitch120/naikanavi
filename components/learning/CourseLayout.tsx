'use client'
import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 型定義 ──
export interface QuizQuestion {
  question: string
  choices: string[]
  correct: number // 0-based index
  explanation: string
}

export interface Lesson {
  id: string
  title: string
  icon: string
  keyPoints: string[]
  content: string[]     // paragraphs
  tips?: string[]
  quiz?: QuizQuestion
  free?: boolean        // true = FREE, default = PRO
}

export interface CourseConfig {
  slug: string
  title: string
  titleEn: string
  icon: string
  description: string
  breadcrumb: string
  href: string
  lessons: Lesson[]
  references?: string[]
}

// ── 進捗管理 ──
function useProgress(slug: string) {
  const key = `iwor_course_${slug}`
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { const r = localStorage.getItem(key); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
  })
  const markDone = useCallback((lessonId: string) => {
    setCompleted(prev => {
      const n = new Set(prev); n.add(lessonId)
      localStorage.setItem(key, JSON.stringify(Array.from(n)))
      return n
    })
  }, [key])
  const reset = useCallback(() => {
    setCompleted(new Set()); localStorage.removeItem(key)
  }, [key])
  return { completed, markDone, reset }
}

// ═══════════════════════════════════════
export default function CourseLayout({ config }: { config: CourseConfig }) {
  const { isPro } = useProStatus()
  const [showProModal, setShowProModal] = useState(false)
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const { completed, markDone, reset } = useProgress(config.slug)

  const pct = config.lessons.length > 0 ? Math.round((completed.size / config.lessons.length) * 100) : 0
  const lesson = config.lessons.find(l => l.id === activeLesson)

  const handleQuizAnswer = useCallback((idx: number, lesson: Lesson) => {
    if (quizAnswer !== null) return
    setQuizAnswer(idx)
    if (idx === lesson.quiz?.correct) markDone(lesson.id)
  }, [quizAnswer, markDone])

  const handleBack = useCallback(() => {
    setActiveLesson(null); setQuizAnswer(null)
  }, [])

  // ── レッスン詳細ビュー ──
  if (lesson) {
    const canAccess = lesson.free || isPro
    return (
      <main className="px-4 py-8">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          {config.title}に戻る
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{lesson.icon}</span>
            <h1 className="text-lg font-bold text-tx">{lesson.title}</h1>
            {completed.has(lesson.id) && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">完了</span>}
          </div>
        </div>

        {canAccess ? (
          <div className="space-y-4">
            {/* Key Points */}
            <div className="rounded-xl p-4" style={{ background: MCL, border: `1px solid ${MC}20` }}>
              <p className="text-xs font-bold mb-2" style={{ color: MC }}>📌 Key Points</p>
              <ul className="space-y-1.5">
                {lesson.keyPoints.map((kp, i) => (
                  <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: MC }}>
                    <span className="flex-shrink-0 mt-0.5">•</span><span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content paragraphs */}
            {lesson.content.map((para, i) => (
              <p key={i} className="text-sm text-tx/85 leading-relaxed">{para}</p>
            ))}

            {/* Tips */}
            {lesson.tips && lesson.tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-2">💡 臨床のコツ</p>
                <ul className="space-y-1">
                  {lesson.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-900 leading-relaxed flex gap-2">
                      <span className="flex-shrink-0 mt-0.5">•</span><span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quiz */}
            {lesson.quiz && (
              <div className="bg-s0 border border-br rounded-xl p-5 mt-4">
                <p className="text-xs font-bold text-tx mb-3">🧠 確認クイズ</p>
                <p className="text-sm text-tx mb-3">{lesson.quiz.question}</p>
                <div className="space-y-2">
                  {lesson.quiz.choices.map((c, i) => {
                    const answered = quizAnswer !== null
                    const isCorrect = i === lesson.quiz!.correct
                    const isSelected = quizAnswer === i
                    let cls = 'border-br bg-bg text-tx hover:border-ac/30'
                    if (answered) {
                      if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-800'
                      else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-800'
                      else cls = 'border-br/50 bg-s1/50 text-muted'
                    }
                    return (
                      <button key={i} onClick={() => handleQuizAnswer(i, lesson)} disabled={answered}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs transition-all ${cls}`}>
                        <span className="font-mono text-muted mr-2">{['A', 'B', 'C', 'D'][i]}.</span>{c}
                        {answered && isCorrect && <span className="ml-1">✓</span>}
                        {answered && isSelected && !isCorrect && <span className="ml-1">✗</span>}
                      </button>
                    )
                  })}
                </div>
                {quizAnswer !== null && (
                  <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed ${
                    quizAnswer === lesson.quiz.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="font-bold mb-1">{quizAnswer === lesson.quiz.correct ? '✅ 正解！' : '❌ 不正解'}</p>
                    <p>{lesson.quiz.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Complete button */}
            {!completed.has(lesson.id) && !lesson.quiz && (
              <button onClick={() => markDone(lesson.id)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: MC }}>
                ✓ レッスン完了
              </button>
            )}
          </div>
        ) : (
          /* PRO gate */
          <div className="bg-s0 border border-br rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: MCL }}>
              <svg className="w-6 h-6" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <p className="text-sm font-bold text-tx mb-1">PRO会員限定コンテンツ</p>
            <p className="text-xs text-muted mb-4">このレッスンはPRO会員のみ閲覧できます</p>
            <button onClick={() => setShowProModal(true)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>PRO会員になる</button>
          </div>
        )}

        {showProModal && <ProModal onClose={() => setShowProModal(false)} feature="full_access" />}
      </main>
    )
  }

  // ── 講座一覧ビュー ──
  return (
    <main className="px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/learning" className="hover:text-ac">学習</Link><span className="mx-2">›</span>
        <span>{config.breadcrumb}</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: MCL }}>{config.icon}</div>
            <div>
              <h1 className="text-xl font-bold text-tx">{config.title}</h1>
              <p className="text-[11px] text-muted">{config.description}</p>
            </div>
          </div>
          <ProPulseHint><FavoriteButton slug={`learning-${config.slug}`} title={config.title} href={config.href} /></ProPulseHint>
        </div>
      </header>

      {/* 進捗バー */}
      <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-tx">学習進捗</p>
          <p className="text-sm font-bold" style={{ color: MC }}>{completed.size}/{config.lessons.length}レッスン（{pct}%）</p>
        </div>
        <div className="w-full h-2 bg-s1 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: MC }} />
        </div>
        {completed.size > 0 && (
          <button onClick={reset} className="text-[10px] text-muted hover:text-tx underline mt-2">進捗リセット</button>
        )}
      </div>

      {/* レッスン一覧 */}
      <div className="space-y-2">
        {config.lessons.map((l, i) => {
          const isDone = completed.has(l.id)
          const locked = !l.free && !isPro
          return (
            <button key={l.id} onClick={() => { if (locked) { setShowProModal(true); return }; setActiveLesson(l.id); setQuizAnswer(null) }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                isDone ? 'bg-green-50/50 border-green-200' : locked ? 'bg-s1/30 border-br/50' : 'bg-s0 border-br hover:border-ac/30 hover:shadow-sm'
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                isDone ? 'bg-green-100 text-green-700' : 'text-tx'
              }`} style={!isDone ? { background: MCL } : undefined}>
                {isDone ? '✓' : l.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${isDone ? 'text-green-700' : locked ? 'text-muted' : 'text-tx'}`}>
                    {i + 1}. {l.title}
                  </p>
                  {locked && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>}
                  {l.free && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">FREE</span>}
                </div>
                <p className="text-[10px] text-muted truncate mt-0.5">{l.keyPoints[0]}</p>
              </div>
              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {locked ? <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></> :
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />}
              </svg>
            </button>
          )
        })}
      </div>

      {/* References */}
      {config.references && config.references.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold text-tx mb-2">参考文献</h2>
          <ol className="list-decimal list-inside text-xs text-muted space-y-1">
            {config.references.map((r, i) => <li key={i}>{r}</li>)}
          </ol>
        </section>
      )}

      {showProModal && <ProModal onClose={() => setShowProModal(false)} feature="full_access" />}
    </main>
  )
}
