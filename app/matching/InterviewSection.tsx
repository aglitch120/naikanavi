'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { HOSPITALS, Hospital } from './hospitals-data'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'
const API_URL = 'https://iwor-api.mightyaddnine.workers.dev'

interface Profile {
  name: string
  university: string
  graduationYear: string
  preferredSpecialty: string
  preferredRegions: string[]
  clubs: string
  research: string
  strengths: string
  motivation: string
}

// ── 面接設定 ──
interface InterviewSettings {
  hospitalId: number | null
  mode: 'chat' | 'voice'
  pressure: 'gentle' | 'normal' | 'tough'
  duration: 5 | 10 | 15    // 分
}

// ── チャットメッセージ ──
interface ChatMessage {
  role: 'interviewer' | 'user'
  content: string
  timestamp: Date
}

type Phase = 'setup' | 'interview' | 'feedback'

const PRESSURE_LABELS = {
  gentle: { label: 'やさしめ', desc: '初心者向け、励ましが多い', emoji: '😊' },
  normal: { label: '標準', desc: '実際のマッチング面接に近い', emoji: '🤝' },
  tough: { label: '圧迫', desc: '厳しめの質問、深掘りが多い', emoji: '😤' },
}

const DURATION_OPTIONS = [
  { value: 5 as const, label: '5分', questions: '6-7問' },
  { value: 10 as const, label: '10分', questions: '9-10問' },
  { value: 15 as const, label: '15分', questions: '13-14問' },
]

export default function InterviewTab({
  profile, isPro, onShowProModal,
}: {
  profile: Profile
  isPro: boolean
  onShowProModal: () => void
}) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [settings, setSettings] = useState<InterviewSettings>({
    hospitalId: null,
    mode: 'chat',
    pressure: 'normal',
    duration: 10,
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const selectedHospital = settings.hospitalId
    ? HOSPITALS.find(h => h.id === settings.hospitalId)
    : null

  // 想定質問数
  const maxQuestions = settings.duration === 5 ? 7 : settings.duration === 10 ? 10 : 14

  // ── スクロール（メッセージ追加時のみ） ──
  const prevMsgCount = useRef(0)
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      prevMsgCount.current = messages.length
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth',
          })
        }
      }, 150)
    }
  }, [messages.length])

  // ── API呼び出し（FREE: 5ラリー/日、PRO: 無制限） ──
  const callAI = useCallback(async (systemPrompt: string, userMessage: string): Promise<string | null> => {
    const sessionToken = typeof window !== 'undefined'
      ? localStorage.getItem('iwor_session_token') || ''
      : ''

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`

      const res = await fetch(`${API_URL}/api/interview-feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'interview', systemPrompt, userMessage }),
      })

      if (res.status === 429) {
        // レート制限 → ローカルフォールバック
        setRateLimited(true)
        return null
      }

      const data = await res.json()
      if (data.ok && data.feedback) {
        console.log('[iwor] AI response source:', data.source, 'isPro:', data.isPro)
        return data.feedback
      }
      console.warn('[iwor] AI API returned no feedback:', JSON.stringify(data).slice(0, 200))
      return null
    } catch (err) {
      console.warn('[iwor] AI API error:', err)
      return null
    }
  }, [])

  // ── TTS（音声モード用） ──
  const speak = useCallback((text: string) => {
    if (settings.mode !== 'voice' || typeof window === 'undefined' || !window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.95
    utterance.onstart = () => setIsVoicePlaying(true)
    utterance.onend = () => setIsVoicePlaying(false)
    window.speechSynthesis.speak(utterance)
  }, [settings.mode])

  // ── 音声入力 ──
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setUserInput(prev => prev + text)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }, [])

  // ── 面接開始 ──
  const startInterview = useCallback(async () => {
    setPhase('interview')
    setMessages([])
    setQuestionCount(1)
    setIsThinking(true)

    const hospital = selectedHospital
    const pressureDesc = settings.pressure === 'gentle' ? '優しく温かい雰囲気で'
      : settings.pressure === 'tough' ? '厳しく深掘りしながら' : '適度な緊張感で'

    const systemPrompt = buildInterviewerPrompt(profile, hospital, settings, 'first_question')

    // API → ローカルフォールバック
    let firstQ = await callAI(systemPrompt,
      `面接を開始してください。${pressureDesc}最初の質問をお願いします。`)
    if (!firstQ) {
      if (rateLimited) {
        firstQ = '申し訳ありません。本日の無料AI面接体験の上限に達しました。PRO会員になると、AIによるリアルタイム面接が無制限でご利用いただけます。'
      } else {
        console.log('[iwor] First question: using local fallback')
        firstQ = getLocalQuestion(0, profile, hospital)
      }
    } else {
      console.log('[iwor] First question: from Workers AI')
    }

    const msg: ChatMessage = { role: 'interviewer', content: firstQ, timestamp: new Date() }
    setMessages([msg])
    setIsThinking(false)
    speak(firstQ)
  }, [selectedHospital, settings, profile, callAI, speak])

  // ── ユーザー回答送信 ──
  const sendAnswer = useCallback(async () => {
    if (!userInput.trim() || isThinking) return

    const userMsg: ChatMessage = { role: 'user', content: userInput.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = userInput.trim()
    setUserInput('')
    setIsThinking(true)

    const nextQ = questionCount + 1
    const isLast = nextQ > maxQuestions

    const systemPrompt = buildInterviewerPrompt(
      profile, selectedHospital, settings,
      isLast ? 'closing' : 'follow_up'
    )

    const conversationContext = messages.map(m =>
      `${m.role === 'interviewer' ? '面接官' : '受験者'}: ${m.content}`
    ).join('\n') + `\n受験者: ${currentInput}`

    // API → レート制限ならPRO誘導で停止
    let response = await callAI(systemPrompt, conversationContext)
    if (!response) {
      if (rateLimited) {
        // レート制限 → 面接を中断してPRO誘導
        const stopMsg: ChatMessage = {
          role: 'interviewer',
          content: '面接官：本日の無料体験はここまでとなります。\n\nここまでの会話を拝見すると、とても良い受け答えができていますね。PRO会員になると、AIによるリアルタイム面接が無制限で利用でき、面接終了後には詳細なフィードバックも受けられます。ぜひご検討ください。',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, stopMsg])
        setIsThinking(false)
        setQuestionCount(maxQuestions + 1) // 入力を無効化
        // FREE: ダミーフィードバック表示
        setTimeout(() => {
          setFeedbackText('【総合評価】B+（良好）\n\n■ 良かった点\n・志望動機が具体的で、病院の特色をよく理解している印象を受けました。\n・質問に対して簡潔かつ論理的に回答できていました。\n・自身の経験を交えた回答が説得力を持っていました。\n\n■ 改善ポイント\n・結論を先に述べる「PREP法」を意識するとさらに良くなります。\n・具体的なエピソードをもう1つ追加すると説得力が増します。\n・逆質問の準備をしておくと面接の印象がさらに良くなります。\n\n■ 模範回答例\n（PRO会員限定: 各質問への模範回答と改善アドバイスの全文を表示）\n\n■ 面接官からのコメント\n全体的に好印象です。本番でも自信を持って臨んでください。')
          setPhase('feedback')
        }, 2000)
        return
      }
      // ネットワークエラー等 → ローカルで継続
      const reaction = getLocalReaction(currentInput)
      const nextQuestion = isLast
        ? '本日の面接は以上です。ありがとうございました。何か最後にお伝えしたいことはありますか？'
        : getLocalQuestion(questionCount, profile, selectedHospital)
      response = `${reaction}\n\n${nextQuestion}`
    }

    const aiMsg: ChatMessage = { role: 'interviewer', content: response, timestamp: new Date() }
    setMessages(prev => [...prev, aiMsg])
    setQuestionCount(nextQ)
    setIsThinking(false)
    speak(response)

    // 最終質問後 → フィードバックフェーズ
    if (isLast) {
      setTimeout(() => generateFeedback(), 2000)
    }
  }, [userInput, isThinking, questionCount, maxQuestions, messages, profile, selectedHospital, settings, callAI, speak])

  // ── フィードバック生成 ──
  const generateFeedback = useCallback(async () => {
    setIsThinking(true)
    const conversationLog = messages.map(m =>
      `${m.role === 'interviewer' ? '面接官' : '受験者'}: ${m.content}`
    ).join('\n')

    const feedbackPrompt = `以下のマッチング面接の全体を評価してください。

【評価項目】
1. 全体評価（A〜D）と一言コメント
2. 良かった点（3つ）
3. 改善が必要な点（3つ）
4. 各回答への個別フィードバック
5. 次回の面接で意識すべきポイント

面接記録:
${conversationLog}

具体的かつ建設的に、300-500字で日本語でフィードバックしてください。`

    const fb = await callAI(feedbackPrompt, '面接全体のフィードバックをお願いします。')
    setFeedbackText(fb || generateLocalFeedback(messages))
    setPhase('feedback')
    setIsThinking(false)
  }, [messages, callAI])

  // ── 面接リセット ──
  const resetInterview = () => {
    setPhase('setup')
    setMessages([])
    setFeedbackText('')
    setQuestionCount(0)
    setUserInput('')
  }

  return (
    <div className="space-y-4">
      {/* ══════ 設定画面 ══════ */}
      {phase === 'setup' && (
        <SetupScreen
          settings={settings}
          setSettings={setSettings}
          profile={profile}
          isPro={isPro}
          onShowProModal={onShowProModal}
          onStart={startInterview}
          selectedHospital={selectedHospital}
        />
      )}

      {/* ══════ 面接中 ══════ */}
      {phase === 'interview' && (
        <div className="space-y-3">
          {/* ヘッダー */}
          <div className="bg-s0 border border-br rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: MCL }}>
                {PRESSURE_LABELS[settings.pressure].emoji}
              </div>
              <div>
                <p className="text-xs font-bold text-tx">
                  {selectedHospital ? selectedHospital.name : '一般面接'}
                </p>
                <p className="text-[10px] text-muted">
                  質問 {Math.min(questionCount, maxQuestions)}/{maxQuestions} · {settings.duration}分
                </p>
              </div>
            </div>
            <button onClick={resetInterview} className="text-[10px] text-muted hover:text-tx px-2 py-1 rounded border border-br transition-colors">
              終了
            </button>
          </div>

          {/* チャット領域 */}
          <div className="bg-s0 border border-br rounded-xl overflow-hidden">
            <div ref={chatContainerRef} className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-ac text-white rounded-br-md'
                      : 'bg-s1 text-tx rounded-bl-md'
                  }`}>
                    {msg.role === 'interviewer' && (
                      <p className="text-[10px] font-bold mb-1 opacity-60">面接官</p>
                    )}
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-s1 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 入力エリア or PRO誘導 */}
            {rateLimited && !isPro ? (
              <div className="border-t border-br p-5 text-center">
                <p className="text-sm font-bold text-tx mb-1">無料体験おつかれさまでした！</p>
                <p className="text-xs text-muted mb-3">PRO会員でAI面接が無制限に。詳細フィードバックも受けられます。</p>
                <button onClick={onShowProModal}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white mb-2" style={{ background: MC }}>
                  PRO会員になる
                </button>
                <br />
                <button onClick={resetInterview}
                  className="text-[11px] text-muted hover:text-tx mt-1">
                  設定に戻る
                </button>
              </div>
            ) : questionCount <= maxQuestions ? (
              <div className="border-t border-br p-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendAnswer() } }}
                      placeholder="回答を入力…"
                      rows={2}
                      className="w-full px-3 py-2 border border-br rounded-xl bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none resize-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {settings.mode === 'voice' && (
                      <button onClick={startListening} disabled={isListening}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isListening ? 'border-red-400 bg-red-50' : 'border-br hover:border-br2'
                        }`}>
                        <svg className={`w-4 h-4 ${isListening ? 'text-red-500' : 'text-muted'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        </svg>
                      </button>
                    )}
                    <button onClick={sendAnswer} disabled={!userInput.trim() || isThinking}
                      className="p-2.5 rounded-xl text-white disabled:opacity-40 transition-all"
                      style={{ background: MC }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════ フィードバック ══════ */}
      {phase === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-s0 border border-br rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: MCL }}>
                <svg className="w-5 h-5" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-tx">面接フィードバック</p>
                <p className="text-[10px] text-muted">
                  {selectedHospital ? selectedHospital.name : '一般面接'} · {messages.filter(m => m.role === 'user').length}問回答
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-xs text-tx leading-relaxed whitespace-pre-wrap">
                {feedbackText}
              </div>
              {/* FREE: フィードバック後半モザイク */}
              {!isPro && feedbackText.length > 200 && (
                <div className="absolute inset-0 top-24">
                  <div className="w-full h-full backdrop-blur-md bg-s0/60 flex flex-col items-center justify-center px-6">
                    <p className="text-sm font-bold text-tx mb-1">詳細フィードバックはPRO限定</p>
                    <p className="text-xs text-muted mb-3">全ての改善ポイント＆模範回答を見るには</p>
                    <button onClick={onShowProModal}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
                      PRO会員になる
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={resetInterview}
            className="w-full py-3 rounded-xl text-sm font-bold border border-br text-tx hover:bg-s1 transition-colors">
            もう一度面接する
          </button>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════
//  設定画面
// ═══════════════════════════════════════
function SetupScreen({
  settings, setSettings, profile, isPro, onShowProModal, onStart, selectedHospital,
}: {
  settings: InterviewSettings
  setSettings: (s: InterviewSettings) => void
  profile: Profile
  isPro: boolean
  onShowProModal: () => void
  onStart: () => void
  selectedHospital: Hospital | null | undefined
}) {
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const filteredHospitals = hospitalSearch
    ? HOSPITALS.filter(h => h.name.includes(hospitalSearch) || h.prefecture.includes(hospitalSearch)).slice(0, 5)
    : []

  // 志望リストから読み込み
  const [wishlistHospitals, setWishlistHospitals] = useState<Hospital[]>([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('iwor_matching_wishlist')
      if (raw) {
        const ids: number[] = JSON.parse(raw)
        setWishlistHospitals(ids.map(id => HOSPITALS.find(h => h.id === id)).filter(Boolean) as Hospital[])
      }
    } catch { /* ignore */ }
  }, [])

  const profileCompletion = [profile.name, profile.university, profile.preferredSpecialty, profile.strengths, profile.motivation]
    .filter(f => f.length > 0).length

  return (
    <div className="space-y-4">
      {/* 説明 */}
      <div className="bg-s0 border border-br rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: MCL }}>
            <svg className="w-5 h-5" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-tx mb-1">AI面接シミュレーション</p>
            <p className="text-xs text-muted leading-relaxed">
              病院を選んでパーソナライズされた面接を体験。AIが面接官となり、
              あなたのプロフィール・志望病院に基づいた質問をします。
            </p>
          </div>
        </div>
        {profileCompletion < 3 && (
          <div className="mt-3 px-3 py-2 rounded-lg text-[11px] font-medium flex items-center gap-2" style={{ background: '#FEF3C7', color: '#92400E' }}>
            <span>⚠️</span>
            プロフィールを充実させると、より的確な質問が生成されます
          </div>
        )}
      </div>

      {/* ① 病院選択 */}
      <div className="bg-s0 border border-br rounded-xl p-4">
        <p className="text-xs font-bold text-tx mb-2">① 面接する病院を選択</p>
        {selectedHospital ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-s1">
            <div>
              <p className="text-xs font-bold text-tx">{selectedHospital.name}</p>
              <p className="text-[10px] text-muted">{selectedHospital.prefecture} · {selectedHospital.type}</p>
            </div>
            <button onClick={() => setSettings({ ...settings, hospitalId: null })}
              className="text-[10px] text-muted hover:text-tx px-2 py-1 rounded border border-br">
              変更
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {wishlistHospitals.length > 0 && (
              <div>
                <p className="text-[10px] text-muted mb-1.5">志望リストから選択</p>
                <div className="flex flex-wrap gap-1.5">
                  {wishlistHospitals.map(h => (
                    <button key={h.id}
                      onClick={() => setSettings({ ...settings, hospitalId: h.id })}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-br hover:border-ac/40 transition-all bg-s1 text-tx">
                      {h.name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-br mt-2 pt-2" />
              </div>
            )}
            <input
              type="text"
              value={hospitalSearch}
              onChange={e => setHospitalSearch(e.target.value)}
              placeholder="病院名で検索（空で一般面接）"
              className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac outline-none transition-all"
            />
            {filteredHospitals.length > 0 && (
              <div className="border border-br rounded-lg overflow-hidden">
                {filteredHospitals.map(h => (
                  <button key={h.id}
                    onClick={() => { setSettings({ ...settings, hospitalId: h.id }); setHospitalSearch('') }}
                    className="w-full px-3 py-2.5 text-left hover:bg-s1 transition-colors border-b border-br last:border-b-0">
                    <p className="text-xs font-medium text-tx">{h.name}</p>
                    <p className="text-[10px] text-muted">{h.prefecture} · {h.type}</p>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted text-center">※ 未選択の場合は一般的な面接質問になります</p>
          </div>
        )}
      </div>

      {/* 詳細設定トグル */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-4 py-3 bg-s0 border border-br rounded-xl text-sm hover:bg-s1/50 transition-colors"
      >
        <span className="text-xs font-bold text-tx flex items-center gap-2">
          ⚙️ 詳細設定
          <span className="text-[10px] font-normal text-muted">
            {settings.mode === 'voice' ? '音声' : 'チャット'} · {PRESSURE_LABELS[settings.pressure].label} · {DURATION_OPTIONS.find(o => o.value === settings.duration)?.label}
          </span>
        </span>
        <span className={`text-muted transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          {/* ② モード選択 */}
          <div className="bg-s0 border border-br rounded-xl p-4">
            <p className="text-xs font-bold text-tx mb-2">② 面接スタイル</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { mode: 'chat' as const, label: 'チャット形式', desc: 'テキストで回答', icon: '💬' },
                { mode: 'voice' as const, label: '音声形式', desc: 'マイク＆音声で対話', icon: '🎤' },
              ]).map(opt => (
                <button key={opt.mode}
                  onClick={() => setSettings({ ...settings, mode: opt.mode })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    settings.mode === opt.mode ? 'shadow-sm' : 'border-br'
                  }`}
                  style={settings.mode === opt.mode ? { borderColor: MC, background: MCL } : undefined}>
                  <p className="text-lg mb-1">{opt.icon}</p>
                  <p className="text-xs font-bold text-tx">{opt.label}</p>
                  <p className="text-[10px] text-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
            {settings.mode === 'voice' && (
              <p className="text-[10px] text-muted mt-2 px-1">
                ※ ブラウザの音声認識APIを使用します。Chrome推奨。
              </p>
            )}
          </div>

          {/* ③ 圧迫度 */}
          <div className="bg-s0 border border-br rounded-xl p-4">
            <p className="text-xs font-bold text-tx mb-2">③ 圧迫度</p>
            <div className="flex gap-2">
              {(Object.entries(PRESSURE_LABELS) as [keyof typeof PRESSURE_LABELS, typeof PRESSURE_LABELS[keyof typeof PRESSURE_LABELS]][]).map(([key, val]) => (
                <button key={key}
                  onClick={() => setSettings({ ...settings, pressure: key })}
                  className={`flex-1 p-2.5 rounded-xl border-2 text-center transition-all ${
                    settings.pressure === key ? 'shadow-sm' : 'border-br'
                  }`}
                  style={settings.pressure === key ? { borderColor: MC, background: MCL } : undefined}>
                  <p className="text-lg">{val.emoji}</p>
                  <p className="text-[10px] font-bold text-tx">{val.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ④ 面接時間 */}
          <div className="bg-s0 border border-br rounded-xl p-4">
            <p className="text-xs font-bold text-tx mb-2">④ 面接時間</p>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setSettings({ ...settings, duration: opt.value })}
                  className={`flex-1 p-2.5 rounded-xl border-2 text-center transition-all ${
                    settings.duration === opt.value ? 'shadow-sm' : 'border-br'
                  }`}
                  style={settings.duration === opt.value ? { borderColor: MC, background: MCL } : undefined}>
                  <p className="text-sm font-bold text-tx">{opt.label}</p>
                  <p className="text-[10px] text-muted">{opt.questions}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 開始ボタン */}
      <button onClick={onStart}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ background: MC }}>
        {settings.mode === 'voice' ? '🎤' : '💬'} 面接を開始する
      </button>

      {!isPro && (
        <div className="bg-s0 border border-dashed rounded-xl p-4 text-center" style={{ borderColor: `${MC}40` }}>
          <p className="text-xs text-muted mb-2">
            FREE: 面接体験は可能ですが、パーソナライズされた質問と詳細フィードバックはPRO限定です
          </p>
          <button onClick={onShowProModal}
            className="text-[11px] font-bold px-4 py-1.5 rounded-lg" style={{ background: MCL, color: MC }}>
            PRO会員になる
          </button>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════
//  プロンプト生成
// ═══════════════════════════════════════
function buildInterviewerPrompt(
  profile: Profile,
  hospital: Hospital | null | undefined,
  settings: InterviewSettings,
  phase: 'first_question' | 'follow_up' | 'closing'
): string {
  const pressureGuide = settings.pressure === 'gentle'
    ? '優しく温かい雰囲気で質問してください。受験者を励まし、リラックスさせてください。'
    : settings.pressure === 'tough'
    ? '厳しめに質問してください。回答の矛盾を突いたり、深掘りしたり、少しプレッシャーをかけてください。'
    : '標準的な面接の雰囲気で、適度な緊張感を持って質問してください。'

  const hospitalContext = hospital
    ? `面接対象病院: ${hospital.name}（${hospital.prefecture}、${hospital.type}、${hospital.beds}床）
病院理念: ${hospital.philosophy || '情報なし'}
特徴: ${hospital.features.join('、')}
強い診療科: ${hospital.specialties.join('、')}
救急体制: ${hospital.erType}`
    : '一般的なマッチング面接を想定してください。'

  const profileContext = [
    profile.university && `大学: ${profile.university}`,
    profile.preferredSpecialty && `志望科: ${profile.preferredSpecialty}`,
    profile.clubs && `部活: ${profile.clubs}`,
    profile.research && `研究: ${profile.research}`,
    profile.strengths && `強み: ${profile.strengths}`,
    profile.motivation && `志望動機: ${profile.motivation}`,
  ].filter(Boolean).join('\n')

  let phaseInstruction = ''
  if (phase === 'first_question') {
    phaseInstruction = '面接の最初の質問をしてください。自己紹介や志望動機から始めるのが自然です。'
  } else if (phase === 'follow_up') {
    phaseInstruction = '前の回答を踏まえて次の質問をしてください。深掘りや新しい話題どちらでも構いません。短い一言リアクション（「なるほど」等）+質問1つの形式で。'
  } else {
    phaseInstruction = 'これが最後の質問です。「最後に何か質問はありますか？」など、面接を締めくくる質問をしてください。'
  }

  return `あなたは医学部マッチング面接の面接官です。1つの質問を簡潔に（50-100字程度で）してください。

${pressureGuide}

${hospitalContext}

受験者プロフィール:
${profileContext || '情報なし'}

${phaseInstruction}

注意:
- 面接官として自然に振る舞ってください
- 1回のメッセージに質問は1つだけ
- 回答が短い場合は深掘りしてください
- 病院の理念や特徴に基づいた質問を含めてください`
}


// ═══════════════════════════════════════
//  ローカル面接エンジン（API不要フォールバック）
// ═══════════════════════════════════════

const LOCAL_QUESTIONS_BASE = [
  '本日はお忙しい中ありがとうございます。まず、簡単に自己紹介をお願いできますか？',
  '当院を志望された理由を教えてください。',
  '医師を目指したきっかけは何でしたか？',
  '将来、どのような医師になりたいと考えていますか？',
  '学生時代に最も力を入れたことを教えてください。',
  'あなたの長所と短所を教えてください。',
  'チーム医療で大切だと思うことは何ですか？',
  '患者さんが治療を拒否された場合、どう対応しますか？',
  '当直中に急変があった場合、まず何をしますか？',
  '研修中に自分の限界を感じたとき、どう対処しますか？',
  '上級医の指示に疑問を感じた場合、どうしますか？',
  '最近読んだ医学論文や気になった医療ニュースはありますか？',
  'ストレスへの対処法を教えてください。',
  '10年後のキャリアプランを教えてください。',
]

function getLocalQuestion(
  questionIndex: number,
  profile: Profile,
  hospital: Hospital | null | undefined,
): string {
  // 病院固有の質問を挟む
  const hospitalQuestions: string[] = []
  if (hospital) {
    hospitalQuestions.push(
      `${hospital.name}のどのような点に魅力を感じましたか？`,
      `${hospital.type}での研修を希望する理由を教えてください。`,
    )
    if (hospital.erType === 'ER型') {
      hospitalQuestions.push('救急医療に対する考えを聞かせてください。')
    }
  }
  if (profile.preferredSpecialty) {
    hospitalQuestions.push(`${profile.preferredSpecialty}を志望する理由を教えてください。`)
  }
  if (profile.clubs) {
    hospitalQuestions.push(`${profile.clubs}での活動で学んだことを教えてください。`)
  }
  if (profile.research) {
    hospitalQuestions.push('研究活動について詳しく教えてください。臨床にどう活かしたいですか？')
  }

  // 基本質問と病院質問をインターリーブ
  const allQuestions: string[] = []
  let baseIdx = 0
  let hospIdx = 0
  for (let i = 0; i < 16; i++) {
    if (i % 3 === 1 && hospIdx < hospitalQuestions.length) {
      allQuestions.push(hospitalQuestions[hospIdx++])
    } else if (baseIdx < LOCAL_QUESTIONS_BASE.length) {
      allQuestions.push(LOCAL_QUESTIONS_BASE[baseIdx++])
    }
  }

  return allQuestions[questionIndex % allQuestions.length]
}

function getLocalReaction(answer: string): string {
  const len = answer.length
  if (len < 20) {
    return 'なるほど。もう少し詳しくお聞かせいただけますか。'
  }
  const reactions = [
    'ありがとうございます。',
    'なるほど、よく分かりました。',
    '興味深いお話ですね。',
    'ありがとうございます。それでは次の質問です。',
    'なるほど、そういった考えをお持ちなのですね。',
  ]
  return reactions[Math.floor(Math.random() * reactions.length)]
}

function generateLocalFeedback(messages: ChatMessage[]): string {
  const userMessages = messages.filter(m => m.role === 'user')
  const avgLength = userMessages.reduce((s, m) => s + m.content.length, 0) / (userMessages.length || 1)

  const lines: string[] = []
  lines.push('【全体評価】')
  if (avgLength > 100) {
    lines.push('各回答に十分な分量があり、具体性も感じられます。')
  } else if (avgLength > 40) {
    lines.push('回答の分量は適度ですが、もう少し具体的なエピソードを交えるとさらに良くなります。')
  } else {
    lines.push('全体的に回答が短めです。面接では1-2分程度で話せる分量を目指しましょう。')
  }
  lines.push('')
  lines.push('【良い点】')
  lines.push('・面接に真剣に取り組む姿勢が伝わります。')
  if (userMessages.some(m => m.content.includes('なぜ') || m.content.includes('理由') || m.content.includes('きっかけ'))) {
    lines.push('・動機や理由付けがしっかりしている部分があります。')
  }
  lines.push('')
  lines.push('【改善ポイント】')
  lines.push('・「なぜそう思ったか」を常に具体的なエピソードで裏付けましょう。')
  lines.push('・志望病院の理念や特徴と自分の考えを結びつけると説得力が増します。')
  lines.push('・PREP法（結論→理由→具体例→結論）を意識すると構成が改善します。')
  lines.push('')
  lines.push('【次のステップ】')
  lines.push('改善点を踏まえてもう一度練習してみましょう。繰り返すことで本番での回答力が向上します。')
  lines.push('')
  lines.push('※ PRO会員ではAIによるより詳細な個別フィードバックが受けられます。')

  return lines.join('\n')
}
