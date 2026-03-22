'use client'
import { useState, useCallback } from 'react'
import { generateResumePrompt } from '@/lib/matching-questions'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://iwor-api.mightyaddnine.workers.dev'

interface Answer { choices: string[]; freeText: string }
type Phase = 'basic' | 'specialty' | 'q1' | 'q2' | 'activity' | 'insight' | 'q3' | 'q4' | 'q5' | 'result'

// ── 基本情報 ──
const BASIC_INFO = {
  icon: '👤', question: 'まず、基本情報を教えてください',
  sub: '履歴書に必要な情報です',
}

// ── 志望科選択 ──
const SPECIALTY_Q = {
  icon: '🏥', question: '志望する診療科は？',
  sub: '複数選択可（まだ決まっていなくてもOK）',
  choices: ['内科','外科','小児科','産婦人科','整形外科','脳神経外科','皮膚科','眼科','耳鼻咽喉科','泌尿器科','精神科','放射線科','麻酔科','救急科','総合診療科','未定'],
  maxChoices: 3,
  freeLabel: '志望理由を一言で',
}

// ── 課外活動 ──
const ACTIVITY_Q = {
  icon: '🏃', question: '大学時代に力を入れたことは？',
  sub: '面接で必ず聞かれます。部活・バイト・ボランティアなど',
  choices: ['運動部', '文化部', '研究室・ラボ', 'アルバイト', 'ボランティア', '学生団体', '留学・海外経験', '資格取得'],
  maxChoices: 3,
  freeLabel: '具体的な内容・学んだこと',
}

// ── 固定質問（コア5問）──
const QUESTIONS = {
  q1: {
    icon: '💡', question: '医師を目指したきっかけは？',
    sub: '面接で最も聞かれる質問です',
    choices: ['家族や身近な人の病気がきっかけ', '医師の姿に感動した', '科学・人体への純粋な興味', '人の苦しみに寄り添いたい', '社会的に意義のある仕事がしたい', '家族が医療従事者だった', 'なんとなく・周囲の影響'],
    maxChoices: 2,
    freeLabel: 'もう少し具体的に（面接ではここを掘られます）',
  },
  q2: {
    icon: '💪', question: '自分の一番の武器は？',
    sub: '自己PRの核になります',
    choices: ['粘り強さ・諦めない', '共感力・傾聴力', 'リーダーシップ', '冷静な判断力', 'コミュニケーション力', '好奇心・学習意欲', '協調性・チームワーク', '行動力・実行力'],
    maxChoices: 2,
    freeLabel: 'その強みを発揮したエピソード',
  },
  q4: {
    icon: '🔮', question: '5年後、どんな医師でいたい？',
    sub: '志望科・研修先選びの軸になります',
    choices: ['専門性を極めるスペシャリスト', '何でも診れるジェネラリスト', '研究と臨床を両立', '教育・後輩指導に力を入れる', '地域の患者に寄り添う', '最先端医療・イノベーション', '国際的に活躍', 'まだ明確ではない'],
    maxChoices: 2,
    freeLabel: '具体的なイメージがあれば',
  },
  q5: {
    icon: '🎯', question: 'あなたを一言で表すと？',
    sub: '面接の自己紹介で使える「キャッチフレーズ」です',
    choices: [], // AIが生成
    maxChoices: 1,
    freeLabel: '自分で考えたフレーズがあれば',
  },
}

interface Props {
  onComplete: (answers: Record<string, Answer>) => void
  savedAnswers?: Record<string, Answer>
}

export default function ImmersiveWizard({ onComplete, savedAnswers }: Props) {
  const [phase, setPhase] = useState<Phase>('basic')
  const [answers, setAnswers] = useState<Record<string, Answer>>(savedAnswers || {})
  const [selected, setSelected] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [basicName, setBasicName] = useState('')
  const [basicUniv, setBasicUniv] = useState('')
  const [basicYear, setBasicYear] = useState('')
  const [aiInsight, setAiInsight] = useState('')
  const [aiQuestion, setAiQuestion] = useState<{ question: string; choices: string[] } | null>(null)
  const [aiCatchphrases, setAiCatchphrases] = useState<string[]>([])
  const [aiSummary, setAiSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [resumeCopied, setResumeCopied] = useState(false)

  const phases: Phase[] = ['basic', 'specialty', 'q1', 'q2', 'activity', 'insight', 'q3', 'q4', 'q5', 'result']
  const phaseIndex = phases.indexOf(phase)
  const progress = Math.round((phaseIndex / (phases.length - 1)) * 100)

  const toggleChoice = useCallback((c: string, max: number) => {
    setSelected(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c)
      if (max > 0 && prev.length >= max) return [...prev.slice(1), c]
      return [...prev, c]
    })
  }, [])

  const callAI = useCallback(async (prompt: string): Promise<string> => {
    try {
      const res = await fetch(`${API_BASE}/api/self-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [{ question: 'context', answer: prompt }] }),
      })
      const data = await res.json()
      return data?.followUp ? JSON.stringify(data.followUp) : ''
    } catch { return '' }
  }, [])

  const saveAnswer = useCallback((id: string) => {
    const a: Answer = { choices: selected, freeText }
    const newAnswers = { ...answers, [id]: a }
    setAnswers(newAnswers)
    try {
      const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
      existing._wizardAnswers = newAnswers
      localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
    } catch {}
    return newAnswers
  }, [selected, freeText, answers])

  // ═══ 遷移ロジック ═══
  const next = useCallback(async () => {
    setLoading(true)

    if (phase === 'basic') {
      // 基本情報を保存
      try {
        const existing = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}')
        if (basicName) existing.name = basicName
        if (basicUniv) existing.university = basicUniv
        if (basicYear) existing.graduationYear = basicYear
        localStorage.setItem('iwor_matching_profile', JSON.stringify(existing))
      } catch {}
      setLoading(false)
      setPhase('q1')
      return
    }

    if (phase === 'q1') {
      const newAnswers = saveAnswer('doctor-reason')
      setSelected([]); setFreeText('')
      setPhase('q2')
    }

    else if (phase === 'q2') {
      const newAnswers = saveAnswer('strengths')
      // AI洞察を生成
      const q1 = answers['doctor-reason'] || { choices: selected, freeText: '' }
      const context = `医師を目指した理由: ${q1.choices.join(', ')}（${q1.freeText}）\n強み: ${selected.join(', ')}（${freeText}）`

      try {
        const res = await fetch(`${API_BASE}/api/self-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: [
              { question: '医師を目指した理由', answer: `${q1.choices.join(', ')}. ${q1.freeText}` },
              { question: '自分の強み', answer: `${selected.join(', ')}. ${freeText}` },
            ]
          }),
        })
        const data = await res.json()
        if (data.ok && data.followUp) {
          setAiInsight(`あなたは「${q1.choices[0]}」をきっかけに医師を志し、「${selected[0]}」を武器にしています。`)
          setAiQuestion(data.followUp)
        } else {
          setAiInsight(`あなたの動機「${q1.choices[0]}」と強み「${selected[0]}」は一貫性があります。`)
          setAiQuestion({ question: 'その強みが試された具体的な場面は？', choices: ['部活・サークルで', '臨床実習で', 'アルバイトで', '人間関係で'] })
        }
      } catch {
        setAiInsight(`動機と強みの分析中...`)
        setAiQuestion({ question: 'その強みが試された場面は？', choices: ['部活で', '実習で', 'バイトで', '人間関係で'] })
      }
      setSelected([]); setFreeText('')
      setPhase('insight')
    }

    else if (phase === 'insight') {
      setSelected([]); setFreeText('')
      setPhase('q3')
    }

    else if (phase === 'q3') {
      saveAnswer('ai-deepdive')
      setSelected([]); setFreeText('')
      setPhase('q4')
    }

    else if (phase === 'q4') {
      const newAnswers = saveAnswer('future-5y')
      // AIでキャッチフレーズ候補を生成
      const allContext = [
        answers['doctor-reason']?.choices.join(', '),
        answers['strengths']?.choices.join(', '),
        selected.join(', '),
      ].filter(Boolean).join(' / ')

      try {
        const res = await fetch(`${API_BASE}/api/self-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: [
              { question: '全回答のまとめ', answer: allContext },
              { question: 'キャッチフレーズを3つ提案して', answer: `動機:${answers['doctor-reason']?.choices[0]} 強み:${answers['strengths']?.choices[0]} 将来:${selected[0]}` },
            ]
          }),
        })
        const data = await res.json()
        if (data.ok && data.followUp?.choices) {
          setAiCatchphrases(data.followUp.choices)
        } else {
          setAiCatchphrases([
            `${answers['strengths']?.choices[0] || '共感力'}で患者に寄り添う医師`,
            `${selected[0] || '挑戦'}を続ける医師`,
            `チームの力を引き出す医師`,
          ])
        }
      } catch {
        setAiCatchphrases(['患者に寄り添う医師', '学び続ける医師', 'チームを支える医師'])
      }
      setSelected([]); setFreeText('')
      setPhase('q5')
    }

    else if (phase === 'q5') {
      const finalAnswers = saveAnswer('catchphrase')
      // AI最終サマリー
      const summary = [
        answers['doctor-reason'] ? `「${answers['doctor-reason'].choices[0]}」をきっかけに医師を志し` : '',
        answers['strengths'] ? `「${answers['strengths'].choices[0]}」を武器に` : '',
        answers['future-5y'] ? `「${answers['future-5y'].choices[0]}」を目指す` : '',
        selected[0] ? `「${selected[0]}」` : '',
      ].filter(Boolean).join('、')
      setAiSummary(summary)
      onComplete(finalAnswers)
      setPhase('result')
    }

    setLoading(false)
  }, [phase, selected, freeText, answers, saveAnswer, callAI, onComplete])

  const getQ = () => {
    if (phase === 'specialty') return SPECIALTY_Q
    if (phase === 'q1') return QUESTIONS.q1
    if (phase === 'q2') return QUESTIONS.q2
    if (phase === 'activity') return ACTIVITY_Q
    if (phase === 'q4') return QUESTIONS.q4
    if (phase === 'q5') return { ...QUESTIONS.q5, choices: aiCatchphrases }
    return null
  }

  // ═══ 完了画面 ═══
  if (phase === 'result') {
    return (
      <div className="max-w-md mx-auto text-center py-6">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-lg font-bold text-tx mb-2">自己分析が見えてきました</h2>
        <div className="bg-s0 border border-br rounded-xl p-4 mb-4 text-left">
          <p className="text-sm text-tx leading-relaxed">{aiSummary}</p>
        </div>

        <div className="bg-s0 border border-ac/30 rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-tx mb-2">📄 JIS履歴書の志望動機をAIで生成</h3>
          <p className="text-[9px] text-muted mb-2">回答をもとにJIS規格の文字数に合った志望動機文を生成します</p>
          <button onClick={() => {
            const prompt = generateResumePrompt(answers)
            navigator.clipboard.writeText(prompt).then(() => {
              setResumeCopied(true)
              setTimeout(() => setResumeCopied(false), 3000)
            })
          }}
            className="w-full py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: resumeCopied ? 'var(--ok)' : MC, color: '#fff' }}>
            {resumeCopied ? '✓ コピー済み' : '📋 志望動機プロンプトをコピー'}
          </button>
          {resumeCopied && (
            <div className="flex gap-1.5 mt-2">
              <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center" style={{ background: '#10a37f', color: '#fff' }}>ChatGPT</a>
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center" style={{ background: '#d97706', color: '#fff' }}>Claude</a>
              <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center" style={{ background: '#4285f4', color: '#fff' }}>Gemini</a>
            </div>
          )}
        </div>

        {/* JIS履歴書テンプレート */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-4 text-left">
          <h3 className="text-xs font-bold text-tx mb-2">📋 JIS履歴書テンプレート</h3>
          <p className="text-[9px] text-muted mb-2">基本情報+自己分析データを履歴書形式でコピー</p>
          <button onClick={() => {
            let profile: any = {}
            try { profile = JSON.parse(localStorage.getItem('iwor_matching_profile') || '{}') } catch {}
            const template = `━━━━━━━━━━━━━━━━━━━━━━━━
　　　　　　　　　　履　歴　書
━━━━━━━━━━━━━━━━━━━━━━━━

氏名: ${profile.name || '【記入】'}
生年月日: 【記入】
現住所: 【記入】
連絡先: 【記入】

━━ 学歴 ━━
【記入】年3月　○○高等学校 卒業
【記入】年4月　${profile.university || '○○大学医学部医学科'} 入学
${profile.graduationYear || '【記入】'}年3月　${profile.university || '○○大学医学部医学科'} 卒業見込

━━ 免許・資格 ━━
【記入】年　普通自動車第一種運転免許 取得
${profile.graduationYear || '【記入】'}年　医師国家試験 合格見込

━━ 志望の動機・特技・自己PR ━━
${aiSummary || '【志望動機プロンプトをAIで生成してここに貼り付け】'}

━━ 志望科 ━━
${profile.preferredSpecialty || answers['future-5y']?.choices?.[0] || '【記入】'}

━━ 本人希望 ━━
貴院の研修プログラムにて研修を希望いたします.
`
            navigator.clipboard.writeText(template)
          }}
            className="w-full py-2 rounded-xl text-xs font-bold text-white" style={{ background: MC }}>
            📋 JIS履歴書テンプレートをコピー
          </button>
        </div>

        <button onClick={() => { setPhase('basic'); setAnswers({}); setSelected([]); setFreeText('') }}
          className="text-[10px] text-muted underline">やり直す</button>
      </div>
    )
  }

  // ═══ AI洞察カード ═══
  if (phase === 'insight') {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: MC }} />
          </div>
        </div>

        <div className="text-center mb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="text-3xl mb-3">🔍</div>
          <h2 className="text-base font-bold text-tx mb-3">AIからの洞察</h2>
          <div className="bg-acl border border-ac/20 rounded-xl p-4 mb-4">
            <p className="text-sm leading-relaxed" style={{ color: MC }}>{aiInsight}</p>
          </div>
        </div>

        {aiQuestion && (
          <div style={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}>
            <p className="text-sm font-bold text-tx mb-3">🤖 {aiQuestion.question}</p>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {aiQuestion.choices.map(c => {
                const sel = selected.includes(c)
                return (
                  <button key={c} onClick={() => toggleChoice(c, 1)}
                    className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
                    style={{ background: sel ? MC : 'var(--s0)', color: sel ? '#fff' : 'var(--tx)', border: `1.5px solid ${sel ? MC : 'var(--br)'}` }}>
                    {sel ? '✓ ' : ''}{c}
                  </button>
                )
              })}
            </div>
            <div className="mb-4">
              <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={2}
                placeholder="具体的なエピソードを一言で"
                className="w-full px-3 py-2 bg-s0 border border-br rounded-xl text-xs focus:border-ac outline-none resize-none" />
            </div>
          </div>
        )}

        <button onClick={next} disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: MC }}>
          {loading ? '分析中...' : '次へ →'}
        </button>

        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  // ═══ AI深堀り質問（Q3） ═══
  if (phase === 'q3' && aiQuestion) {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: MC }} />
          </div>
        </div>

        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: MCL, color: MC }}>AIが選んだ質問</span>
          </div>
          <h2 className="text-lg font-bold text-tx mb-1">{aiQuestion.question}</h2>
          <p className="text-[10px] text-muted mb-4">あなたの回答パターンから選ばれた深堀り質問です</p>

          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {aiQuestion.choices.map(c => {
              const sel = selected.includes(c)
              return (
                <button key={c} onClick={() => toggleChoice(c, 2)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
                  style={{ background: sel ? MC : 'var(--s0)', color: sel ? '#fff' : 'var(--tx)', border: `1.5px solid ${sel ? MC : 'var(--br)'}` }}>
                  {sel ? '✓ ' : ''}{c}
                </button>
              )
            })}
          </div>
          <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={2}
            placeholder="具体的に答えてみてください"
            className="w-full px-3 py-2 bg-s0 border border-br rounded-xl text-xs focus:border-ac outline-none resize-none mb-4" />
        </div>

        <button onClick={next} disabled={loading || selected.length === 0}
          className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-30"
          style={{ background: MC }}>
          {loading ? '分析中...' : '次へ →'}
        </button>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  // ═══ 基本情報画面 ═══
  if (phase === 'basic') {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: MC }} />
          </div>
        </div>
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{BASIC_INFO.icon}</span>
          </div>
          <h2 className="text-lg font-bold text-tx mb-1">{BASIC_INFO.question}</h2>
          <p className="text-[10px] text-muted mb-5">{BASIC_INFO.sub}</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted block mb-1">氏名</label>
              <input type="text" value={basicName} onChange={e => setBasicName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-xs focus:border-ac outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted block mb-1">大学</label>
              <input type="text" value={basicUniv} onChange={e => setBasicUniv(e.target.value)}
                placeholder="○○大学医学部"
                className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-xs focus:border-ac outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted block mb-1">卒業年度</label>
              <select value={basicYear} onChange={e => setBasicYear(e.target.value)}
                className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-xs focus:border-ac outline-none">
                <option value="">選択してください</option>
                {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={String(y)}>{y}年3月卒業</option>)}
              </select>
            </div>
          </div>
        </div>
        <button onClick={next} disabled={loading}
          className="w-full mt-6 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: MC }}>
          次へ →
        </button>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  // ═══ 通常質問画面（Q1, Q2, Q4, Q5） ═══
  const q = getQ()
  if (!q) return null

  return (
    <div className="max-w-md mx-auto">
      {/* 進捗 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: MC }} />
        </div>
        <span className="text-[10px] font-mono text-muted">
          {phase === 'q1' ? '1/5' : phase === 'q2' ? '2/5' : phase === 'q4' ? '4/5' : '5/5'}
        </span>
      </div>

      <div key={phase} style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{q.icon}</span>
          {(phase === 'q1' || phase === 'q2') && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#991B1B' }}>★★★★★ 最頻出</span>
          )}
        </div>

        <h2 className="text-lg font-bold text-tx mb-1 leading-tight">{q.question}</h2>
        <p className="text-[10px] text-muted mb-5">{q.sub}</p>

        {/* 選択肢 */}
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {q.choices.map(c => {
            const sel = selected.includes(c)
            return (
              <button key={c} onClick={() => toggleChoice(c, q.maxChoices)}
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
                style={{
                  background: sel ? MC : 'var(--s0)',
                  color: sel ? '#fff' : 'var(--tx)',
                  border: `1.5px solid ${sel ? MC : 'var(--br)'}`,
                }}>
                {sel ? '✓ ' : ''}{c}
              </button>
            )
          })}
        </div>

        {/* 自由記述 */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-muted block mb-1">{q.freeLabel}</label>
          <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={2}
            placeholder="ここが面接で差がつくポイントです"
            className="w-full px-3 py-2 bg-s0 border border-br rounded-xl text-xs focus:border-ac outline-none resize-none" />
        </div>
      </div>

      {/* 次へ */}
      <button onClick={next} disabled={loading || (selected.length === 0 && phase !== 'q5')}
        className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-30 transition-all"
        style={{ background: MC }}>
        {loading ? '🤖 AIが分析中...' : phase === 'q5' ? '完了 ✨' : '次へ →'}
      </button>

      {phase !== 'q1' && (
        <button onClick={() => {
          const prev = phase === 'q2' ? 'q1' : phase === 'q4' ? 'q3' : phase === 'q5' ? 'q4' : 'q1'
          setPhase(prev as Phase); setSelected([]); setFreeText('')
        }} className="w-full text-center text-[10px] text-muted mt-2 py-1">← 戻る</button>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
