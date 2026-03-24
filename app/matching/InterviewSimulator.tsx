'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ProModal from '@/components/pro/ProModal'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'
const API_BASE = process.env.NEXT_PUBLIC_WORKER_URL || 'https://api.iwor.jp'

// ── 都道府県リスト ──
const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

// ── 型定義 ──
interface Message {
  role: 'interviewer' | 'user'
  content: string
  timestamp: number
}

interface InterviewSettings {
  duration: 5 | 10 | 15
  hospitalType: 'community' | 'university'
  prefecture: string
  pressure: 'gentle' | 'normal' | 'pressure'
}

interface InterviewReport {
  overallGrade: string
  goodPoints: string[]
  improvements: string[]
  questionFeedback: { question: string; rating: number; comment: string }[]
  nextAdvice: string
}

interface Props {
  isPro: boolean
  onShowProModal: () => void
  profile: {
    name: string; university: string; graduationYear: string
    preferredSpecialty: string; strengths: string; motivation: string
  }
  mode: 'matching' | 'career'
}

// ── 設定画面 ──
function SettingsScreen({ onStart }: { onStart: (s: InterviewSettings) => void }) {
  const [duration, setDuration] = useState<5 | 10 | 15>(10)
  const [hospitalType, setHospitalType] = useState<'community' | 'university'>('community')
  const [prefecture, setPrefecture] = useState('東京都')
  const [pressure, setPressure] = useState<'gentle' | 'normal' | 'pressure'>('normal')

  const BtnStyle = (active: boolean) => active
    ? { background: MC, color: '#fff', border: `1.5px solid ${MC}` } as const
    : { background: '#FEFEFC', color: '#1A1917', border: '1.5px solid #DDD9D2' } as const

  return (
    <div className="space-y-4">
      {/* コンパクトヘッダー */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: MC }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: '#1A1917' }}>面接シミュレーション AI</h2>
          <p className="text-[11px]" style={{ color: '#6B6760' }}>マッチング面接特化 / 200問+ / 病院タイプ別 / AIレポート</p>
        </div>
      </div>

      {/* 設定カード */}
      <div className="rounded-2xl p-4 space-y-4" style={{ background: '#FEFEFC', border: '1px solid #E8E5DF' }}>
        {/* 面接時間 */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6760' }}>面接時間</label>
          <div className="flex gap-2">
            {([5, 10, 15] as const).map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={BtnStyle(duration === d)}>
                {d}分
              </button>
            ))}
          </div>
        </div>

        {/* 病院タイプ */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6760' }}>病院タイプ</label>
          <div className="flex gap-2">
            {[
              { id: 'community' as const, label: '市中病院' },
              { id: 'university' as const, label: '大学病院' },
            ].map(h => (
              <button key={h.id} onClick={() => setHospitalType(h.id)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={BtnStyle(hospitalType === h.id)}>
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* 都道府県 + 圧迫度を横並び */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6760' }}>都道府県</label>
            <select value={prefecture} onChange={e => setPrefecture(e.target.value)}
              className="w-full py-2 px-3 rounded-lg text-xs"
              style={{ border: '1.5px solid #DDD9D2', background: '#FEFEFC', fontSize: '16px', color: '#1A1917' }}>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6760' }}>雰囲気</label>
            <div className="flex gap-1.5">
              {[
                { id: 'gentle' as const, label: '穏' },
                { id: 'normal' as const, label: '普通' },
                { id: 'pressure' as const, label: '圧迫' },
              ].map(p => (
                <button key={p.id} onClick={() => setPressure(p.id)}
                  className="flex-1 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={BtnStyle(pressure === p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 免責（1行） */}
      <p className="text-center text-[10px]" style={{ color: '#C8C4BC' }}>
        AIによる面接練習ツールです。合否を保証しません。患者個人情報は入力しないでください。
      </p>

      {/* 開始ボタン */}
      <button onClick={() => onStart({ duration, hospitalType, prefecture, pressure })}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: MC, color: '#fff' }}>
        面接を始める
      </button>

      {/* 練習回数（あれば） */}
      {typeof window !== 'undefined' && parseInt(localStorage.getItem('iwor_interview_count') || '0', 10) > 0 && (
        <p className="text-center text-[10px]" style={{ color: '#C8C4BC' }}>
          練習回数: {localStorage.getItem('iwor_interview_count')}回
        </p>
      )}
    </div>
  )
}

// ── タイプライター表示用Hook ──
function useTypewriter(text: string, speed = 50) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(true); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(timer); setDone(true) }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return { displayed, done }
}

// ── 音声読み上げ ──
function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.95
  utterance.pitch = 0.9
  // 日本語の低めの声を選択
  const voices = window.speechSynthesis.getVoices()
  const jaVoice = voices.find(v => v.lang.startsWith('ja') && v.name.includes('Otoya')) ||
    voices.find(v => v.lang.startsWith('ja') && !v.name.includes('Kyoko')) ||
    voices.find(v => v.lang.startsWith('ja'))
  if (jaVoice) utterance.voice = jaVoice
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

// ── マイク入力Hook ──
function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const start = useCallback(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        final += event.results[i][0].transcript
      }
      setTranscript(final)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setTranscript('')
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { transcript, isListening, start, stop, supported: typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) }
}

// ── 面接官メッセージ（タイプライター付き） ──
function InterviewerBubble({ content, hospitalType, ttsEnabled, isLatest }: {
  content: string; hospitalType: string; ttsEnabled: boolean; isLatest: boolean
}) {
  // 日本語の話すスピード: 約5文字/秒 → 1文字200ms。ただし速すぎないように60msに
  const { displayed, done } = useTypewriter(isLatest ? content : '', 60)
  const shownText = isLatest && !done ? displayed : content

  useEffect(() => {
    if (isLatest && done && ttsEnabled) speakText(content)
  }, [done, isLatest, ttsEnabled, content])

  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] mr-2 mt-1"
        style={{ background: MC, color: '#fff' }}>
        {hospitalType === 'university' ? '教' : '医'}
      </div>
      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed"
        style={{ background: '#F0EDE7', color: '#1A1917' }}>
        <p className="whitespace-pre-wrap">{shownText}{isLatest && !done ? '|' : ''}</p>
      </div>
    </div>
  )
}

// ── チャット画面 ──
function ChatScreen({ settings, messages, input, setInput, onSend, isLoading, timeLeft, onEnd, isPro }: {
  settings: InterviewSettings
  messages: Message[]
  input: string
  setInput: (v: string) => void
  onSend: () => void
  isLoading: boolean
  timeLeft: number
  onEnd: () => void
  isPro: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const { transcript, isListening, start: startMic, stop: stopMic, supported: micSupported } = useSpeechRecognition()

  // マイク入力を入力欄に反映
  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript, setInput])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        if (isListening) stopMic()
        onSend()
      }
    }
  }

  const handleMicToggle = () => {
    if (isListening) {
      stopMic()
    } else {
      startMic()
    }
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isUrgent = timeLeft <= 60

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl" style={{ background: MCL }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: MC, color: '#fff' }}>
            {settings.hospitalType === 'university' ? '教' : '医'}
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: MC }}>
              {settings.prefecture} {settings.hospitalType === 'university' ? '大学病院' : '市中病院'} 面接官
            </p>
            <p className="text-[10px]" style={{ color: '#6B6760' }}>臨床研修プログラム責任者</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-red-500 animate-pulse' : ''}`}
            style={!isUrgent ? { color: MC } : undefined}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <button onClick={onEnd}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#fff', color: '#E74C3C', border: '1px solid #E74C3C' }}>
            終了
          </button>
        </div>
      </div>

      {/* 患者情報警告バナー（常時表示・dismissなし） */}
      <div className="px-3 py-1.5 text-center text-[10px] font-medium" style={{ background: '#FEF3CD', color: '#856404' }}>
        患者個人情報は入力しないでください
      </div>

      {/* メッセージ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: '#FEFEFC' }}>
        {messages.map((m, i) => (
          m.role === 'interviewer' ? (
            <InterviewerBubble
              key={i} content={m.content}
              hospitalType={settings.hospitalType}
              ttsEnabled={ttsEnabled}
              isLatest={i === messages.length - 1}
            />
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed"
                style={{ background: MC, color: '#fff' }}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          )
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] mr-2 mt-1"
              style={{ background: MC, color: '#fff' }}>
              {settings.hospitalType === 'university' ? '教' : '医'}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: '#F0EDE7' }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力欄 */}
      <div className="px-4 py-3" style={{ background: '#FEFEFC' }}>
        {/* TTS + マイクコントロール */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setTtsEnabled(!ttsEnabled)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
            style={ttsEnabled
              ? { background: MCL, color: MC, border: `1px solid ${MC}40` }
              : { background: 'transparent', color: '#C8C4BC', border: '1px solid #E8E5DF' }}>
            {ttsEnabled ? '🔊' : '🔇'} 読み上げ{ttsEnabled ? 'ON' : 'OFF'}
          </button>
          {isListening && (
            <span className="text-[10px] text-red-500 animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> 録音中...
            </span>
          )}
        </div>
        <div className="flex gap-2 items-end">
          {/* マイクボタン */}
          {micSupported && (
            <button onClick={handleMicToggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={isListening
                ? { background: '#EF4444', color: '#fff' }
                : { background: '#F0EDE7', color: '#6B6760', border: '1.5px solid #DDD9D2' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2"
            style={{ borderColor: '#DDD9D2', background: '#F0EDE7', fontSize: '16px', maxHeight: 120 }}
            placeholder={isListening ? '話してください...' : '回答を入力...'}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button onClick={() => { if (isListening) stopMic(); onSend() }} disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
            style={{ background: MC, color: '#fff' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── レポート画面 ──
function ReportScreen({ report, isPro, onShowProModal, onRestart }: {
  report: InterviewReport | null
  isPro: boolean
  onShowProModal: () => void
  onRestart: () => void
}) {
  if (!report) return <div className="text-center py-12 text-sm text-muted">レポートを生成中...</div>

  return (
    <div className="space-y-4">
      {/* 総合評価（FREE表示） */}
      <div className="rounded-2xl p-6 text-center" style={{ background: MCL }}>
        <p className="text-xs mb-2" style={{ color: '#6B6760' }}>総合評価</p>
        <p className="text-5xl font-bold" style={{ color: MC }}>{report.overallGrade}</p>
      </div>

      {/* PRO限定コンテンツ */}
      {isPro ? (
        <>
          {/* 良かった点 */}
          <div className="rounded-2xl p-5" style={{ background: '#F0FAF5', border: '1px solid #C8E6D8' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#2D6A4F' }}>良かった点</p>
            <ul className="space-y-2">
              {report.goodPoints.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: '#1A1917' }}>
                  <span style={{ color: '#2D6A4F' }}>+</span> {p}
                </li>
              ))}
            </ul>
          </div>

          {/* 改善すべき点 */}
          <div className="rounded-2xl p-5" style={{ background: '#FFF5F5', border: '1px solid #E8C8C8' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#C53030' }}>改善すべき点</p>
            <ul className="space-y-2">
              {report.improvements.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: '#1A1917' }}>
                  <span style={{ color: '#C53030' }}>!</span> {p}
                </li>
              ))}
            </ul>
          </div>

          {/* 質問別フィードバック */}
          <div className="rounded-2xl p-5" style={{ background: '#FEFEFC', border: '1px solid #E8E5DF' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#1A1917' }}>質問別フィードバック</p>
            <div className="space-y-3">
              {report.questionFeedback.map((q, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <div className="flex-shrink-0 text-sm">{'★'.repeat(q.rating)}{'☆'.repeat(5 - q.rating)}</div>
                  <div>
                    <p className="font-medium" style={{ color: '#6B6760' }}>{q.question}</p>
                    <p style={{ color: '#1A1917' }}>{q.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 次回のアドバイス */}
          <div className="rounded-2xl p-5" style={{ background: '#F8F5FF', border: '1px solid #D8D0E8' }}>
            <p className="text-sm font-bold mb-2" style={{ color: '#6B46C1' }}>次回のアドバイス</p>
            <p className="text-sm leading-relaxed" style={{ color: '#1A1917' }}>{report.nextAdvice}</p>
          </div>
        </>
      ) : (
        /* FREEユーザー向けPROゲート */
        <div className="relative">
          <div className="space-y-4 opacity-30 blur-sm pointer-events-none select-none">
            <div className="rounded-2xl p-5 h-24" style={{ background: '#F0FAF5' }} />
            <div className="rounded-2xl p-5 h-24" style={{ background: '#FFF5F5' }} />
            <div className="rounded-2xl p-5 h-32" style={{ background: '#FEFEFC' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={onShowProModal}
              className="px-6 py-4 rounded-2xl text-sm font-bold shadow-lg hover:opacity-90 transition-all"
              style={{ background: MC, color: '#fff' }}>
              PRO で詳細レポートを見る
            </button>
          </div>
        </div>
      )}

      {/* 免責 */}
      <p className="text-center text-[10px]" style={{ color: '#C8C4BC' }}>
        AIによる参考意見です。実際の面接結果を保証するものではありません。
      </p>

      {/* 再開ボタン */}
      <button onClick={onRestart}
        className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: MC, color: '#fff' }}>
        もう一度練習する
      </button>
    </div>
  )
}

// ── メインコンポーネント ──
export default function InterviewSimulator({ isPro, onShowProModal, profile, mode }: Props) {
  const [phase, setPhase] = useState<'settings' | 'chat' | 'report'>('settings')
  const [settings, setSettings] = useState<InterviewSettings | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [showProModal, setShowProModal] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── system prompt生成 ──
  const buildSystemPrompt = useCallback((s: InterviewSettings, interviewMode: 'matching' | 'career' = mode) => {
    const hospitalLabel = s.hospitalType === 'university' ? '大学病院' : '市中病院'

    const pressureDesc = {
      gentle: '穏やかな雰囲気の面接官です。学生の緊張をほぐすように微笑みながら話し、「リラックスしてくださいね」と声をかけます。否定的な反応は控えめにし、うなずきながら聞きます。',
      normal: '標準的な面接官です。丁寧だが淡々と進めます。良い回答にはうなずき、曖昧な回答には少し間を置いてから次に進みます。笑顔は控えめ。',
      pressure: '厳しめの面接官です。回答の矛盾や曖昧さを鋭く突きます。「それは本心ですか？」「他の病院でも同じことが言えるのでは？」「もう少し具体的に話してもらえますか」と追及します。沈黙を恐れず、あえて間を作ることもあります。ただし人格否定・差別的表現は絶対に使いません。',
    }[s.pressure]

    const hospitalCharacter = s.hospitalType === 'university'
      ? `■ 大学病院の面接官の特徴:
- あなたは教授クラスの内科医で、学術的な視点を重視します
- 「研究に興味はありますか？」「大学院進学は考えていますか？」「学会発表の経験は？」など学術系の質問を自然に織り交ぜます
- 「なぜ自分の大学ではなく当院を志望するのですか？」は必ず聞きます
- 敬語は硬め。格式を重んじる雰囲気
- 教育理念や指導体制について語ることがあります`
      : `■ 市中病院の面接官の特徴:
- あなたは臨床一筋のベテラン内科医で、即戦力と体力を重視します
- 「当直は月に何回か知っていますか？」「救急車を断らない病院ですが大丈夫ですか？」など実践的な質問をします
- 「ER型研修の覚悟はありますか？」「体力に自信は？」がよく出ます
- やや砕けた口調も交ぜることがあります（「〜だよね」「〜かな」）
- 研修医のQOLや雰囲気を大事にする姿勢を見せます`

    const profileCtx = [
      profile.preferredSpecialty && `志望科: ${profile.preferredSpecialty}`,
      profile.university && `出身大学: ${profile.university}`,
      profile.strengths && `自己申告の強み: ${profile.strengths}`,
    ].filter(Boolean).join('\n')

    return `${interviewMode === 'career'
      ? `あなたは${s.prefecture}にある${hospitalLabel}の診療科部長（${profile.preferredSpecialty || '内科'}）です。
専攻医（後期研修医）または転職希望の医師の採用面接を担当しています。制限時間${s.duration}分の面接です。
面接官は通常2〜3名（部長+医長+事務長）ですが、あなたが代表して質問します。
専攻医向けの質問: 「前の病院を辞める理由は？」「当院でどのような症例を経験したいか？」「専門医取得の計画は？」「研究に興味はあるか？」「当直の回数は月何回可能か？」などを中心に聞きます。`
      : `あなたは${s.prefecture}にある${hospitalLabel}の臨床研修プログラム責任者です。
マッチング面接を担当しています。制限時間${s.duration}分の面接です。
面接官は通常2〜5名ですが、あなたが代表して質問します。`}

${pressureDesc}

${hospitalCharacter}

■ 面接の進め方（リアルなマッチング面接を再現）:
1. まず「お入りください」「受験番号とお名前をお願いします」と始める
2. 以下のカテゴリからバランスよく質問する（全部聞く必要はない。${s.duration}分に収まるように）:
   - 志望理由（なぜこの病院か。見学の感想。併願状況。志望順位）
   - 初期研修への考え（2年間の目標。自由選択はどう使う？）
   - 将来像（志望科。5年後。専門医。大学院）
   - 自己分析（長所短所。挫折経験。ストレス対処法）
   - 医師像・倫理（医師に大切なこと。チーム医療。患者対応）
   - 時事ネタ（医師の働き方改革。AI。地域医療偏在）
   - 突拍子もない質問を1つ（「動物に例えると？」「100万円もらったら？」「無人島に1つ持っていくなら？」「最後の晩餐は？」）
3. 最後に「何か質問はありますか？」で締める

■ 面接官のリアルな振る舞い:
- 1ターンは2〜3文で簡潔に。面接官は長く語らない
- 回答が浅い・表面的 → 深堀りせず「なるほど、わかりました」で次へ進む。この学生に時間を使う価値がないと判断した面接官の態度を再現する
- 回答が具体的で良い → 「もう少し聞かせてください」と1回だけ深堀りする
- 回答が長すぎる → 「ありがとうございます」とやんわり遮って次の質問に移る
- 見学に来ていない様子が見えたら → 「見学にはいらっしゃいましたか？」と確認する
- 併願先を聞いた時、隠そうとする学生には → 「正直に教えていただいて構いませんよ」
- メモを取る仕草として「…（少し間を置いて）では次の質問ですが」のような間を作る

■ 絶対に守ること:
- 臨床判断の正誤は評価しない
- 合否を示唆しない（「合格です」「厳しいですね」等は言わない）
- 人格否定・差別的表現は使わない
- 必ず日本語で会話する。英語を混ぜない
- 敬語で話す（ただし市中病院のやさしいモードでは多少砕けてOK）
- 面接官として自然に振る舞い、AIっぽさを出さない

${profileCtx ? `\n■ 受験者のプロフィール（参考情報。見学に来ている前提で話す）:\n${profileCtx}` : ''}`
  }, [profile])

  // ── タイマー ──
  useEffect(() => {
    if (phase === 'chat' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEndInterview()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [phase, timeLeft > 0])

  // ── 面接開始 ──
  const handleStart = useCallback(async (s: InterviewSettings) => {
    setSettings(s)
    setMessages([])
    setTimeLeft(s.duration * 60)
    setPhase('chat')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('iwor_session_token') || ''
      const res = await fetch(`${API_BASE}/api/interview-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: 'interview',
          userMessage: mode === 'career'
            ? `転職面接を開始してください。私は${profile.preferredSpecialty || '内科'}の専攻医（後期研修医）です。`
            : `マッチング面接を開始してください。私は${profile.university || '医学部'}の${profile.graduationYear || '6年生'}です。`,
          systemPrompt: buildSystemPrompt(s),
        }),
      })
      const data = await res.json()
      if (data.feedback) {
        setMessages([{ role: 'interviewer', content: data.feedback, timestamp: Date.now() }])
      }
    } catch {
      setMessages([{ role: 'interviewer', content: 'それでは面接を始めます。まず、お名前と受験番号をお願いいたします。', timestamp: Date.now() }])
    }
    setIsLoading(false)
  }, [profile, buildSystemPrompt])

  // ── メッセージ送信 ──
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !settings) return
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('iwor_session_token') || ''
      // 直近5ターンの会話を文脈として送る
      const recentContext = [...messages.slice(-8), userMsg]
        .map(m => `${m.role === 'interviewer' ? '面接官' : '受験者'}: ${m.content}`)
        .join('\n')

      const res = await fetch(`${API_BASE}/api/interview-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: 'interview',
          userMessage: `これまでの会話:\n${recentContext}\n\n上記の流れを踏まえて、面接官として次の応答をしてください。`,
          systemPrompt: buildSystemPrompt(settings),
        }),
      })
      const data = await res.json()

      if (data.error === 'rate_limited') {
        setMessages(prev => [...prev, {
          role: 'interviewer',
          content: '（無料体験の上限に達しました。PROプランで無制限に練習できます）',
          timestamp: Date.now(),
        }])
      } else if (data.feedback) {
        setMessages(prev => [...prev, { role: 'interviewer', content: data.feedback, timestamp: Date.now() }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'interviewer', content: 'なるほど、わかりました。では次の質問です。', timestamp: Date.now(),
      }])
    }
    setIsLoading(false)
  }, [input, isLoading, messages, settings, buildSystemPrompt])

  // ── 面接終了 → レポート生成 ──
  const handleEndInterview = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)

    // 面接官の締めメッセージを追加
    setMessages(prev => [...prev, {
      role: 'interviewer',
      content: 'お時間になりました。本日はお越しいただきありがとうございました。結果は追ってご連絡いたします。',
      timestamp: Date.now(),
    }])

    // 少し間を置いてレポート画面へ
    await new Promise(r => setTimeout(r, 1500))
    setPhase('report')
    setIsLoading(true)

    // 会話ログからレポート生成
    const conversationLog = messages
      .map(m => `${m.role === 'interviewer' ? '面接官' : '受験者'}: ${m.content}`)
      .join('\n')

    try {
      const token = localStorage.getItem('iwor_session_token') || ''
      const res = await fetch(`${API_BASE}/api/interview-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: 'feedback',
          question: '面接全体の評価をJSON形式で出力してください',
          answer: conversationLog,
          profile: {
            preferredSpecialty: profile.preferredSpecialty,
            university: profile.university,
            strengths: profile.strengths,
            motivation: profile.motivation,
          },
        }),
      })
      const data = await res.json()
      const text = data.feedback || ''

      // JSONパース試行（Claude Haikuが構造化出力する場合）
      let parsed: InterviewReport | null = null
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const obj = JSON.parse(jsonMatch[0])
          parsed = {
            overallGrade: obj.overallGrade || obj.grade || 'B',
            goodPoints: Array.isArray(obj.goodPoints) ? obj.goodPoints : [],
            improvements: Array.isArray(obj.improvements) ? obj.improvements : [],
            questionFeedback: Array.isArray(obj.questionFeedback) ? obj.questionFeedback.map((q: any) => ({
              question: q.question || '',
              rating: Math.min(5, Math.max(1, parseInt(q.rating) || 3)),
              comment: q.comment || '',
            })) : [],
            nextAdvice: obj.nextAdvice || '',
          }
        }
      } catch { /* JSONパース失敗 → テキストパースにフォールバック */ }

      if (parsed && parsed.goodPoints.length > 0) {
        setReport(parsed)
      } else {
        // テキストからパース（フォールバック）
        setReport({
          overallGrade: extractGrade(text),
          goodPoints: extractSection(text, '良い点', '良かった'),
          improvements: extractSection(text, '改善', '改善すべき'),
          questionFeedback: extractQuestionFeedbackFromConversation(messages, text),
          nextAdvice: extractAfterKeyword(text, '次のステップ') || extractAfterKeyword(text, '次に意識') || extractAfterKeyword(text, 'アドバイス') || '面接で聞かれた質問に対して、具体的なエピソードを交えて回答することを意識しましょう。',
        })
      }
    } catch {
      setReport({
        overallGrade: 'B',
        goodPoints: ['面接に臨む姿勢が良い', '質問への応答速度が適切'],
        improvements: ['回答に具体的なエピソードを加えましょう', '志望動機をより病院固有のものにしましょう'],
        questionFeedback: [],
        nextAdvice: '病院見学の体験を具体的に語れるよう準備しましょう。',
      })
    }
    setIsLoading(false)

    // 練習回数をカウント（localStorage）
    const countKey = 'iwor_interview_count'
    const count = parseInt(localStorage.getItem(countKey) || '0', 10)
    localStorage.setItem(countKey, String(count + 1))
  }, [messages, profile])

  const handleRestart = () => {
    setPhase('settings')
    setMessages([])
    setReport(null)
    setInput('')
  }

  return (
    <>
      {phase === 'settings' && <SettingsScreen onStart={handleStart} />}
      {phase === 'chat' && settings && (
        <ChatScreen
          settings={settings} messages={messages} input={input}
          setInput={setInput} onSend={handleSend} isLoading={isLoading}
          timeLeft={timeLeft} onEnd={handleEndInterview} isPro={isPro}
        />
      )}
      {phase === 'report' && (
        <ReportScreen report={report} isPro={isPro} onShowProModal={onShowProModal} onRestart={handleRestart} />
      )}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} feature="full_access" />}
    </>
  )
}

// ── ヘルパー関数 ──
function extractGrade(text: string): string {
  const match = text.match(/[A-D][+-]?/)
  return match ? match[0] : 'B'
}

function extractSection(text: string, ...keywords: string[]): string[] {
  for (const kw of keywords) {
    const idx = text.indexOf(kw)
    if (idx >= 0) {
      const section = text.slice(idx, idx + 500)
      const lines = section.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('・') || l.trim().match(/^\d\./))
      if (lines.length > 0) return lines.map(l => l.replace(/^[-・\d.]\s*/, '').trim()).slice(0, 3)
    }
  }
  return ['具体的なエピソードを交えて回答しましょう']
}

function extractAfterKeyword(text: string, keyword: string): string {
  const idx = text.indexOf(keyword)
  if (idx < 0) return ''
  const after = text.slice(idx + keyword.length).trim()
  const line = after.split('\n')[0] || after.slice(0, 200)
  return line.replace(/^[】:：\s]+/, '').trim()
}

function extractQuestionFeedbackFromConversation(
  messages: Message[],
  reportText: string
): { question: string; rating: number; comment: string }[] {
  // 面接官の質問を抽出（？を含むメッセージ）
  const interviewerQuestions = messages
    .filter(m => m.role === 'interviewer' && m.content.includes('？'))
    .slice(0, 8)

  // 各質問に対して、直後のユーザー回答の長さからヒューリスティックに評価
  return interviewerQuestions.map((q, i) => {
    const nextUserMsg = messages.find((m, j) =>
      j > messages.indexOf(q) && m.role === 'user'
    )
    const answerLength = nextUserMsg?.content.length || 0

    // 面接官がその後深堀りしたかどうか（良い回答の指標）
    const nextInterviewerMsg = messages.find((m, j) =>
      j > messages.indexOf(q) + 1 && m.role === 'interviewer'
    )
    const wasFollowedUp = nextInterviewerMsg?.content.includes('もう少し') ||
      nextInterviewerMsg?.content.includes('具体的') ||
      nextInterviewerMsg?.content.includes('詳しく')

    // レポートテキストに質問のキーワードが含まれるか確認
    const questionShort = q.content.slice(0, 20)
    const mentionedInReport = reportText.includes(questionShort.replace('？', ''))

    let rating = 3
    if (answerLength > 150 && wasFollowedUp) rating = 4
    if (answerLength > 200 && wasFollowedUp) rating = 5
    if (answerLength < 30) rating = 2
    if (answerLength < 10) rating = 1

    const comments = [
      rating >= 4 ? '具体的なエピソードを交えた良い回答です。面接官も深堀りしたくなる内容でした。' :
      rating === 3 ? '概ね適切ですが、より具体的なエピソードがあると印象が強くなります。' :
      rating === 2 ? '回答が短く、面接官は深堀りせず次へ進みました。もう少し掘り下げて話しましょう。' :
      '回答が不十分です。この質問への準備を重点的に行いましょう。'
    ]

    return {
      question: q.content.slice(0, 60) + (q.content.length > 60 ? '...' : ''),
      rating,
      comment: comments[0],
    }
  })
}
