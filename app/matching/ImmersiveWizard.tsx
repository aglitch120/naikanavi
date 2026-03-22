'use client'
import { useState, useCallback, useEffect } from 'react'
import { generateResumePrompt } from '@/lib/matching-questions'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

interface Answer { choices: string[]; freeText: string }

// ── 全質問定義 ──
const STEPS = [
  { id: 'basic', icon: '👤', question: '基本情報を教えてください', sub: '履歴書に必要な情報です', type: 'basic' as const },
  { id: 'specialty', icon: '🏥', question: '志望する診療科は？', sub: '複数選択可（まだ決まっていなくてもOK）',
    choices: ['内科','外科','小児科','産婦人科','整形外科','脳神経外科','皮膚科','眼科','耳鼻咽喉科','泌尿器科','精神科','放射線科','麻酔科','救急科','総合診療科','未定'],
    maxChoices: 3, freeLabel: '志望理由を一言で', type: 'choice' as const },
  { id: 'doctor-reason', icon: '💡', question: '医師を目指したきっかけは？', sub: '面接で最も聞かれる質問です',
    choices: ['家族や身近な人の病気がきっかけ', '医師の姿に感動した', '科学・人体への純粋な興味', '人の苦しみに寄り添いたい', '社会的に意義のある仕事がしたい', '家族が医療従事者だった', 'なんとなく・周囲の影響'],
    maxChoices: 2, freeLabel: 'もう少し具体的に（面接ではここを掘られます）', type: 'choice' as const },
  { id: 'strengths', icon: '💪', question: '自分の一番の武器は？', sub: '自己PRの核になります',
    choices: ['粘り強さ・諦めない', '共感力・傾聴力', 'リーダーシップ', '冷静な判断力', 'コミュニケーション力', '好奇心・学習意欲', '協調性・チームワーク', '行動力・実行力'],
    maxChoices: 2, freeLabel: 'その強みを発揮したエピソード', type: 'choice' as const },
  { id: 'strengths-episode', icon: '📖', question: 'その強みが試された場面は？', sub: '面接で掘り下げられるポイントです',
    freeLabel: '部活・実習・アルバイトなど、具体的なエピソードを記入', type: 'freeonly' as const },
  { id: 'activity', icon: '🏃', question: '大学時代に力を入れたことは？', sub: '面接で必ず聞かれます',
    choices: ['運動部', '文化部', '研究室・ラボ', 'アルバイト', 'ボランティア', '学生団体', '留学・海外経験', '資格取得'],
    maxChoices: 3, freeLabel: '具体的な内容・学んだこと', type: 'choice' as const },
  { id: 'future-5y', icon: '🔮', question: '5年後、どんな医師でいたい？', sub: '志望科・研修先選びの軸になります',
    choices: ['専門性を極めるスペシャリスト', '何でも診れるジェネラリスト', '研究と臨床を両立', '教育・後輩指導に力を入れる', '地域の患者に寄り添う', '最先端医療・イノベーション', '国際的に活躍', 'まだ明確ではない'],
    maxChoices: 2, freeLabel: '具体的なイメージがあれば', type: 'choice' as const },
  { id: 'catchphrase', icon: '🎯', question: 'あなたを一言で表すと？', sub: '面接の自己紹介で使える「キャッチフレーズ」です',
    freeLabel: '例: 「患者の人生に寄り添う医師」「最後まで粘る医師」', type: 'freeonly' as const },
]

interface Props {
  onComplete: (answers: Record<string, Answer>) => void
  savedAnswers?: Record<string, Answer>
  editMode?: boolean
}

export default function ImmersiveWizard({ onComplete, savedAnswers, editMode }: Props) {
  const [stepIdx, setStepIdx] = useState(editMode ? 0 : 0)
  const [answers, setAnswers] = useState<Record<string, Answer>>(savedAnswers || {})
  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [basicName, setBasicName] = useState('')
  const [basicUniv, setBasicUniv] = useState('')
  const [basicYear, setBasicYear] = useState('')
  const [done, setDone] = useState(false)
  const [resumeCopied, setResumeCopied] = useState(false)

  // 既存データを読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem('iwor_matching_profile')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.name) setBasicName(p.name)
        if (p.university) setBasicUniv(p.university)
        if (p.graduationYear) setBasicYear(p.graduationYear)
        if (p._wizardAnswers) setAnswers(p._wizardAnswers)
      }
    } catch {}
  }, [])

  const step = STEPS[stepIdx]
  const progress = Math.round(((stepIdx) / STEPS.length) * 100)

  const toggleChoice = useCallback((c: string, max: number) => {
    setSelected(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c)
      if (max > 0 && prev.length >= max) return [...prev.slice(1), c]
      return [...prev, c]
    })
  }, [])

  // ステップ開始時: 編集モードなら既存回答を復元、新規なら空
  useEffect(() => {
    if (done) return
    const s = STEPS[stepIdx]
    if (!s) return
    if (editMode) {
      const existing = answers[s.id]
      if (existing) {
        setSelected(existing.choices || [])
        setFreeText(existing.freeText || '')
        return
      }
    }
    setSelected([])
    setFreeText('')
  }, [stepIdx, done, editMode])

  const handleNext = useCallback(() => {
    const s = STEPS[stepIdx]

    if (s.type === 'basic') {
      try {
        const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
        if (basicName) existing.name = basicName
        if (basicUniv) existing.university = basicUniv
        if (basicYear) existing.graduationYear = basicYear
        localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
      } catch {}
    } else {
      const a: Answer = { choices: selected, freeText }
      const newAnswers = { ...answers, [s.id]: a }
      setAnswers(newAnswers)
      try {
        const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
        existing._wizardAnswers = newAnswers
        localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
      } catch {}
    }

    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1)
      setSelected([])
      setFreeText('')
    } else {
      // 全完了
      const finalAnswers = { ...answers, [s.id]: { choices: selected, freeText } }
      onComplete(finalAnswers)
      setDone(true)
    }
  }, [stepIdx, selected, freeText, answers, basicName, basicUniv, basicYear, onComplete])

  const handleBack = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  // ═══ 完了画面 ═══
  if (done) {
    const summary = [
      answers['doctor-reason']?.choices[0] ? `「${answers['doctor-reason'].choices[0]}」をきっかけに医師を志し` : '',
      answers['strengths']?.choices[0] ? `「${answers['strengths'].choices[0]}」を武器に` : '',
      answers['future-5y']?.choices[0] ? `「${answers['future-5y'].choices[0]}」を目指す` : '',
      answers['catchphrase']?.freeText ? `「${answers['catchphrase'].freeText}」` : '',
    ].filter(Boolean).join('、')

    return (
      <div className="max-w-md mx-auto text-center py-6">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-lg font-bold text-tx mb-2">プロフィール完成！</h2>
        <div className="bg-s0 border border-br rounded-xl p-4 mb-4 text-left">
          <p className="text-sm text-tx leading-relaxed">{summary || 'プロフィールが保存されました'}</p>
        </div>

        <div className="bg-s0 border border-ac/30 rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-tx mb-2">📄 AIで自己PR・志望動機を生成</h3>
          <p className="text-[9px] text-muted mb-2">回答をもとにJIS規格の文字数に合った文章を生成します</p>
          <button onClick={() => {
            const prompt = generateResumePrompt(answers)
            navigator.clipboard.writeText(prompt).then(() => {
              setResumeCopied(true)
              setTimeout(() => setResumeCopied(false), 3000)
            })
          }}
            className="w-full py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: resumeCopied ? 'var(--ok)' : MC, color: '#fff' }}>
            {resumeCopied ? '✓ コピー済み' : '📋 AIプロンプトをコピー'}
          </button>
          {resumeCopied && (
            <div className="flex gap-1.5 mt-2">
              <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center" style={{ background: '#10a37f', color: '#fff' }}>ChatGPT</a>
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center" style={{ background: '#d97706', color: '#fff' }}>Claude</a>
            </div>
          )}
        </div>

        <button onClick={() => { setStepIdx(0); setDone(false) }}
          className="text-[10px] text-muted underline">編集する</button>
      </div>
    )
  }

  // ═══ 基本情報画面 ═══
  if (step.type === 'basic') {
    return (
      <div className="max-w-md mx-auto">
        <ProgressBar progress={progress} stepIdx={stepIdx} total={STEPS.length} />
        <div key={step.id} style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="flex items-center gap-2 mb-3"><span className="text-2xl">{step.icon}</span></div>
          <h2 className="text-lg font-bold text-tx mb-1">{step.question}</h2>
          <p className="text-[10px] text-muted mb-5">{step.sub}</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted block mb-1">氏名</label>
              <input type="text" value={basicName} onChange={e => setBasicName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm focus:border-ac outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted block mb-1">大学</label>
              <input type="text" value={basicUniv} onChange={e => setBasicUniv(e.target.value)}
                placeholder="○○大学医学部"
                className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm focus:border-ac outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted block mb-1">卒業年度</label>
              <select value={basicYear} onChange={e => setBasicYear(e.target.value)}
                className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm focus:border-ac outline-none">
                <option value="">選択してください</option>
                {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={String(y)}>{y}年3月卒業</option>)}
              </select>
            </div>
          </div>
        </div>
        <NavButtons onBack={handleBack} onNext={handleNext} isFirst={true} />
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  // ═══ 自由記述のみ ═══
  if (step.type === 'freeonly') {
    return (
      <div className="max-w-md mx-auto">
        <ProgressBar progress={progress} stepIdx={stepIdx} total={STEPS.length} />
        <div key={step.id} style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="flex items-center gap-2 mb-3"><span className="text-2xl">{step.icon}</span></div>
          <h2 className="text-lg font-bold text-tx mb-1 leading-tight">{step.question}</h2>
          <p className="text-[10px] text-muted mb-5">{step.sub}</p>
          <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={4}
            placeholder={step.freeLabel}
            className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm focus:border-ac outline-none resize-none" />
        </div>
        <NavButtons onBack={handleBack} onNext={handleNext} isFirst={false} isLast={stepIdx === STEPS.length - 1} />
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  // ═══ 選択肢 + 自由記述 ═══
  return (
    <div className="max-w-md mx-auto">
      <ProgressBar progress={progress} stepIdx={stepIdx} total={STEPS.length} />
      <div key={step.id} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div className="flex items-center gap-2 mb-3"><span className="text-2xl">{step.icon}</span></div>
        <h2 className="text-lg font-bold text-tx mb-1 leading-tight">{step.question}</h2>
        <p className="text-[10px] text-muted mb-5">{step.sub}</p>

        {'choices' in step && step.choices && (
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {step.choices.map((c: string) => {
              const sel = selected.includes(c)
              return (
                <button key={c} onClick={() => toggleChoice(c, step.maxChoices || 1)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
                  style={{ background: sel ? MC : 'var(--s0)', color: sel ? '#fff' : 'var(--tx)', border: `1.5px solid ${sel ? MC : 'var(--br)'}` }}>
                  {sel ? '✓ ' : ''}{c}
                </button>
              )
            })}
          </div>
        )}

        {'freeLabel' in step && (
          <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={2}
            placeholder={step.freeLabel}
            className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm focus:border-ac outline-none resize-none" />
        )}
      </div>
      <NavButtons onBack={handleBack} onNext={handleNext} isFirst={stepIdx === 0} isLast={stepIdx === STEPS.length - 1} />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function ProgressBar({ progress, stepIdx, total }: { progress: number; stepIdx: number; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: MC }} />
      </div>
      <span className="text-[10px] font-mono text-muted">{stepIdx + 1}/{total}</span>
    </div>
  )
}

function NavButtons({ onBack, onNext, isFirst, isLast }: { onBack: () => void; onNext: () => void; isFirst: boolean; isLast?: boolean }) {
  return (
    <div className="flex gap-2 mt-6">
      {!isFirst && (
        <button onClick={onBack} className="px-4 py-3 rounded-xl text-sm font-medium" style={{ color: MC, background: MCL }}>← 戻る</button>
      )}
      <button onClick={onNext} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
        {isLast ? '完了 ✓' : '次へ →'}
      </button>
    </div>
  )
}
