'use client'
import { useState, useCallback, useEffect, useRef } from 'react'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

interface Answer { choices: string[]; freeText: string }

// ── 全質問定義 ──
const STEPS = [
  // ── 基本情報 ──
  { id: 'basic', icon: '👤', question: '基本情報を教えてください', sub: '履歴書に必要な情報です', type: 'basic' as const },
  // ── 志望 ──
  { id: 'specialty', icon: '🏥', question: '志望する診療科は？', sub: '複数選択可（まだ決まっていなくてもOK）',
    choices: ['内科','外科','小児科','産婦人科','整形外科','脳神経外科','皮膚科','眼科','耳鼻咽喉科','泌尿器科','精神科','放射線科','麻酔科','救急科','総合診療科','未定'],
    maxChoices: 3, freeLabel: '志望理由を一言で', type: 'choice' as const },
  { id: 'regions', icon: '📍', question: '希望する研修地域は？', sub: '複数選択可',
    choices: ['北海道','東北','関東','中部','近畿','中国','四国','九州・沖縄'],
    maxChoices: 4, freeLabel: '', type: 'choice' as const },
  { id: 'medical-interests', icon: '🔬', question: '興味のある医療分野は？', sub: '病院選びの参考になります',
    choices: ['急性期','慢性期','予防医学','緩和医療','集中治療','手術・処置中心','診断中心'],
    maxChoices: 3, freeLabel: '', type: 'choice' as const },
  // ── 自己分析 ──
  { id: 'doctor-reason', icon: '💡', question: '医師を目指したきっかけは？', sub: '面接で最も聞かれる質問です',
    choices: ['家族や身近な人の病気がきっかけ', '医師の姿に感動した', '科学・人体への純粋な興味', '人の苦しみに寄り添いたい', '社会的に意義のある仕事がしたい', '家族が医療従事者だった', 'なんとなく・周囲の影響'],
    maxChoices: 2, freeLabel: 'もう少し具体的に（面接ではここを掘られます）', type: 'choice' as const },
  { id: 'strengths', icon: '💪', question: '自分の一番の武器は？', sub: '自己PRの核になります',
    choices: ['粘り強さ・諦めない', '共感力・傾聴力', 'リーダーシップ', '冷静な判断力', 'コミュニケーション力', '好奇心・学習意欲', '協調性・チームワーク', '行動力・実行力'],
    maxChoices: 2, freeLabel: 'その強みを発揮したエピソード', type: 'choice' as const },
  { id: 'activity', icon: '🏃', question: '大学時代に力を入れたことは？', sub: '面接で必ず聞かれます',
    choices: ['運動部', '文化部', '研究室・ラボ', 'アルバイト', 'ボランティア', '学生団体', '留学・海外経験', '資格取得'],
    maxChoices: 3, freeLabel: '具体的な内容・役割・学んだこと', type: 'choice' as const },
  { id: 'qualifications', icon: '📜', question: '資格・語学・研究経験は？', sub: '任意。あれば記入',
    freeLabel: '例: TOEIC 800 / 基礎研究（免疫学）/ 普通自動車免許', type: 'freeonly' as const },
  // ── キャリアビジョン ──
  { id: 'career-type', icon: '🧭', question: '目指す医師像は？', sub: '将来のキャリアの方向性',
    choices: ['スペシャリスト型','ジェネラリスト型','研究・臨床両立型','教育・指導医型','地域医療型','グローバル型','医療×IT型'],
    maxChoices: 2, freeLabel: '', type: 'choice' as const },
  { id: 'future-5y', icon: '🔮', question: '5年後、どんな医師でいたい？', sub: '志望科・研修先選びの軸になります',
    freeLabel: '例: 循環器の専門医を取得し、カテーテル治療ができる医師になりたい', type: 'freeonly' as const },
  // ── ライフスタイル ──
  { id: 'work-style', icon: '⚖️', question: '希望する働き方は？', sub: '病院マッチングの参考に',
    choices: ['規則的な勤務','フレックス制','当直含む','残業少ない','土日休み'],
    maxChoices: 3, freeLabel: '', type: 'choice' as const },
  { id: 'workplace', icon: '🏛️', question: '理想の研修環境は？', sub: '雰囲気・指導体制',
    choices: ['活気がある','落ち着いている','フランクな雰囲気','協調性が高い','個人裁量が大きい','手厚い指導'],
    maxChoices: 3, freeLabel: '', type: 'choice' as const },
  // ── まとめ ──
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
  const answersRef = useRef<Record<string, Answer>>(savedAnswers || {})
  const [answers, setAnswers] = useState<Record<string, Answer>>(savedAnswers || {})
  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [basicName, setBasicName] = useState('')
  const [basicUniv, setBasicUniv] = useState('')
  const [basicYear, setBasicYear] = useState('')
  const [done, setDone] = useState(false)

  // 既存データを読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem('iwor_matching_profile')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.name) setBasicName(p.name)
        if (p.university) setBasicUniv(p.university)
        if (p.graduationYear) setBasicYear(p.graduationYear)
        if (p._wizardAnswers) {
          setAnswers(p._wizardAnswers)
          answersRef.current = p._wizardAnswers
          // 初期ステップの回答を復元
          const firstStep = STEPS[0]
          if (firstStep && p._wizardAnswers[firstStep.id]) {
            setSelected(p._wizardAnswers[firstStep.id].choices || [])
            setFreeText(p._wizardAnswers[firstStep.id].freeText || '')
          }
        }
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

  // ステップ遷移ヘルパー: refから即座に復元
  const restoreStep = useCallback((idx: number) => {
    const s = STEPS[idx]
    if (!s) return
    const existing = answersRef.current[s.id]
    if (existing) {
      setSelected(existing.choices || [])
      setFreeText(existing.freeText || '')
    } else {
      setSelected([])
      setFreeText('')
    }
  }, [])

  const handleNext = useCallback(() => {
    const s = STEPS[stepIdx]

    if (s.type === 'basic') {
      try {
        const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
        if (basicName) existing.name = basicName
        if (basicUniv) existing.university = basicUniv
        if (basicYear) existing.graduationYear = basicYear
        // _wizardAnswersがなければ初期化（次ステップでの復元に必要）
        if (!existing._wizardAnswers) existing._wizardAnswers = answersRef.current
        localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
      } catch {}
    } else {
      const a: Answer = { choices: selected, freeText }
      const newAnswers = { ...answers, [s.id]: a }
      answersRef.current = newAnswers
      setAnswers(newAnswers)
      try {
        const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
        existing._wizardAnswers = newAnswers
        localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
      } catch {}
    }

    if (stepIdx < STEPS.length - 1) {
      const nextIdx = stepIdx + 1
      setStepIdx(nextIdx)
      restoreStep(nextIdx)
    } else {
      // 全完了 — 最後のステップの回答もlocalStorageに保存
      const finalAnswers = { ...answers, [s.id]: { choices: selected, freeText } }
      answersRef.current = finalAnswers
      try {
        const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
        existing._wizardAnswers = finalAnswers
        localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
      } catch {}
      onComplete(finalAnswers)
      setDone(true)
    }
  }, [stepIdx, selected, freeText, answers, basicName, basicUniv, basicYear, onComplete])

  const handleBack = () => {
    if (stepIdx > 0) {
      // 現在のステップの回答を保存してから戻る
      const s = STEPS[stepIdx]
      if (s && s.type !== 'basic') {
        const a: Answer = { choices: selected, freeText }
        const newAnswers = { ...answers, [s.id]: a }
        answersRef.current = newAnswers
        setAnswers(newAnswers)
        try {
          const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
          existing._wizardAnswers = newAnswers
          localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
        } catch {}
      }
      const prevIdx = stepIdx - 1
      setStepIdx(prevIdx)
      restoreStep(prevIdx)
    }
  }

  // ═══ 完了画面 ═══
  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-6">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-lg font-bold text-tx mb-2">プロフィール完成！</h2>
        <p className="text-xs text-muted mb-4">AIが自己PR・志望動機を生成して履歴書に反映しています...</p>
        <div className="flex gap-3">
          <button onClick={() => { setStepIdx(0); setDone(false) }}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium" style={{ color: MC, background: MCL }}>
            編集する
          </button>
          <button onClick={() => onComplete(answers)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: MC }}>
            閉じる
          </button>
        </div>
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
