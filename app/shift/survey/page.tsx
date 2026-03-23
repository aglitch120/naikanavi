'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import IworLoader from '@/components/IworLoader'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://iwor-api.mightyaddnine.workers.dev'
const MC = '#1B4F3A'
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

interface Survey {
  id: string; groupName: string; year: number; month: number
  doctors: { id: string; name: string }[]
  deadline: string | null; hasPassword: boolean
  responses: Record<string, { name: string; ngDays: number[]; respondedAt: string }>
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate() }
function getFirstDow(y: number, m: number) { return new Date(y, m - 1, 1).getDay() }
function isWeekend(y: number, m: number, d: number) { const dow = new Date(y, m - 1, d).getDay(); return dow === 0 || dow === 6 }

export default function SurveyPage() {
  const params = useSearchParams()
  const surveyId = params.get('id')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = params.get('token')
  const [ngDays, setNgDays] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!surveyId || !token) { setError('無効なリンクです。管理者から受け取ったURLを使用してください。'); setLoading(false); return }
    fetch(`${API}/api/shift/survey?id=${surveyId}&token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setSurvey(d.survey)
          if (d.survey.alreadyResponded) setSubmitted(true)
        } else if (d.error === 'invalid token') setError('無効なトークンです。他の方のリンクを使用していませんか？')
        else setError(d.error || '取得に失敗しました')
      })
      .catch(() => setError('通信エラー'))
      .finally(() => setLoading(false))
  }, [surveyId, token])

  const totalDays = useMemo(() => survey ? getDaysInMonth(survey.year, survey.month) : 0, [survey])
  const firstDow = useMemo(() => survey ? getFirstDow(survey.year, survey.month) : 0, [survey])

  const toggleDay = (day: number) => {
    setNgDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const handleSubmit = async () => {
    if (!survey || !token) return
    const ngStr = ngDays.length > 0 ? ngDays.sort((a, b) => a - b).join(', ') + '日' : 'なし（制限なし）'
    if (!confirm(`以下の内容で送信します。確定後は変更できません。\n\nNG日: ${ngStr}\n\nよろしいですか？`)) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/shift/survey/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: survey.id, token, ngDays }),
      })
      const data = await res.json()
      if (data.ok) setSubmitted(true)
      else if (data.error === 'already responded') setError('既に回答済みです。回答は1回限りです。')
      else if (data.error === 'deadline passed') setError('回答期限を過ぎています')
      else setError(data.error || '送信に失敗しました')
    } catch { setError('通信エラー') }
    setSubmitting(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><IworLoader size="lg" /></div>
  if (error && !survey) return <div className="max-w-md mx-auto px-4 py-12 text-center"><p className="text-sm text-red-600">{error}</p></div>
  if (!survey) return null

  const isExpired = survey.deadline && new Date() > new Date(survey.deadline + 'T23:59:59')

  if (submitted) {
    // 当直回数から月間拘束時間を推算（モチベーション: 当直のストレスに共感）
    const totalDays = survey ? getDaysInMonth(survey.year, survey.month) : 30
    const freeDays = ngDays.length
    const estimatedShifts = Math.max(2, Math.round((totalDays - freeDays) / 5))
    const estimatedHours = estimatedShifts * 16 // 当直≒16時間

    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-lg font-bold text-tx mb-2">回答を送信しました</h1>
          <p className="text-xs text-muted">NG日: {ngDays.length > 0 ? ngDays.sort((a, b) => a - b).join(', ') + '日' : 'なし（制限なし）'}</p>
        </div>

        {/* 価値提供: 当直の負担を可視化 → iworの他ツールへの自然な誘導 */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-tx mb-2">今月の当直、おつかれさまです</p>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-s1 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-tx">{estimatedShifts}</p>
              <p className="text-[9px] text-muted">回（推定）</p>
            </div>
            <div className="flex-1 bg-s1 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-tx">~{estimatedHours}h</p>
              <p className="text-[9px] text-muted">拘束時間</p>
            </div>
            <div className="flex-1 bg-s1 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-tx">{freeDays}</p>
              <p className="text-[9px] text-muted">NG日</p>
            </div>
          </div>
          <p className="text-[10px] text-muted leading-relaxed">
            当直中にサッと使える臨床ツール、知っていますか？
          </p>
        </div>

        {/* iworの全機能への誘導 */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-tx mb-0.5">当直をもっとラクに</p>
          <p className="text-[9px] text-muted mb-2">医師が当直中・日常で使えるツールが全部無料</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { href: '/tools/calc', icon: '🧮', name: '臨床計算 178種', sub: 'eGFR・SOFA・A-DROP' },
            { href: '/tools/drugs', icon: '💊', name: '薬剤ガイド', sub: '抗菌薬・ステロイド換算' },
            { href: '/tools/calc/gamma', icon: '💉', name: 'γ計算', sub: 'DOA・NAd流速計算' },
            { href: '/journal', icon: '📰', name: '論文フィード', sub: '211誌を日本語で毎日配信' },
            { href: '/conferences', icon: '📅', name: '学会カレンダー', sub: '143学会の日程一覧' },
            { href: '/credits', icon: '🏅', name: '専門医単位', sub: '更新単位をカウント&管理' },
            { href: '/study', icon: '📖', name: 'Study', sub: '医学フラッシュカード' },
            { href: '/presenter', icon: '🎤', name: 'プレゼン資料', sub: '抄読会スライドを即作成' },
          ].map(app => (
            <a key={app.href} href={app.href}
              className="flex items-center gap-2 bg-s0 border border-br rounded-xl p-2.5 hover:border-ac/20 transition-all">
              <span className="text-lg flex-shrink-0">{app.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-tx truncate">{app.name}</p>
                <p className="text-[9px] text-muted truncate">{app.sub}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { href: '/shift', icon: '⏰', name: '当直シフト', sub: 'あなたが回答したツール' },
            { href: '/matching', icon: '🏥', name: '転職対策', sub: '1,470病院DB・履歴書AI' },
            { href: '/money', icon: '💰', name: 'マネー', sub: 'ふるさと納税・手取り概算' },
            { href: '/josler', icon: '📊', name: 'J-OSLER', sub: '症例・病歴要約を管理' },
          ].map(app => (
            <a key={app.href} href={app.href}
              className="flex items-center gap-2 bg-s0 border border-br rounded-xl p-2.5 hover:border-ac/20 transition-all">
              <span className="text-lg flex-shrink-0">{app.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-tx truncate">{app.name}</p>
                <p className="text-[9px] text-muted truncate">{app.sub}</p>
              </div>
            </a>
          ))}
        </div>

        <details className="mb-4">
          <summary className="text-[10px] text-muted cursor-pointer hover:text-ac">研修医・専攻医向け ▼</summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <a href="/epoc" className="flex items-center gap-2 bg-s0 border border-br rounded-xl p-2.5 hover:border-ac/20 transition-all">
              <span className="text-lg">📋</span>
              <div><p className="text-[11px] font-bold text-tx">EPOC</p><p className="text-[9px] text-muted">初期研修の経験記録</p></div>
            </a>
            <a href="/josler/summary-generator" className="flex items-center gap-2 bg-s0 border border-br rounded-xl p-2.5 hover:border-ac/20 transition-all">
              <span className="text-lg">🤖</span>
              <div><p className="text-[11px] font-bold text-tx">病歴要約AI</p><p className="text-[9px] text-muted">カルテから自動生成</p></div>
            </a>
          </div>
        </details>

        <a href="https://iwor.jp" className="block bg-ac text-white rounded-xl p-3 text-center hover:bg-ac2 transition-colors">
          <p className="text-sm font-bold">iwor.jp</p>
          <p className="text-[10px] opacity-80">医師のためのワークスペース — 登録不要・完全無料</p>
        </a>
      </div>
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 pb-24">
      <div className="text-center mb-6">
        <p className="text-[10px] text-muted tracking-widest uppercase mb-1">iwor 当直シフト</p>
        <h1 className="text-lg font-bold text-tx">{survey.groupName}</h1>
        <p className="text-sm text-muted">{survey.year}年{survey.month}月 NG日アンケート</p>
        <p className="text-xs font-bold mt-2" style={{ color: '#1B4F3A' }}>{(survey as any).doctorName}さん専用</p>
        {survey.deadline && (
          <p className={`text-[11px] mt-1 ${isExpired ? 'text-red-500 font-bold' : 'text-muted'}`}>
            回答期限: {survey.deadline} {isExpired ? '（期限切れ）' : ''}
          </p>
        )}
      </div>

      {isExpired ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-red-600">回答期限を過ぎています</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* NG日選択カレンダー */}
          <div>
                <label className="text-xs font-bold text-tx block mb-2">NG日を選択（タップで切り替え）</label>
                <div className="bg-s0 border border-br rounded-xl p-3">
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {DAY_LABELS.map((d, i) => (
                      <div key={d} className={`text-center text-[10px] font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted'}`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: totalDays }, (_, i) => {
                      const day = i + 1
                      const isNg = ngDays.includes(day)
                      const we = isWeekend(survey.year, survey.month, day)
                      return (
                        <button key={day} onClick={() => toggleDay(day)}
                          className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                            isNg ? 'bg-red-500 text-white' : we ? 'bg-s1 text-muted hover:bg-red-100' : 'bg-white text-tx hover:bg-red-100'
                          }`}>
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="text-[10px] text-muted mt-2">選択中: {ngDays.length > 0 ? ngDays.sort((a, b) => a - b).join(', ') + '日' : 'なし'}</p>
              </div>

              {/* エラー表示 */}
              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* 送信 */}
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: MC }}>
                {submitting ? '送信中...' : '回答を送信（確定後の変更不可）'}
              </button>
        </div>
      )}

      <p className="text-[9px] text-muted text-center mt-8">Powered by <a href="https://iwor.jp" className="text-ac">iwor.jp</a> — 会員登録不要</p>
    </main>
  )
}
