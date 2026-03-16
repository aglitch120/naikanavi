'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { activateProCode, getProDetails, resetProStatus } from '@/lib/pro-activation'
import { useProStatus } from '@/components/pro/useProStatus'

const planLabels: Record<string, string> = {
  pro_1y: '1年パス',
  pro_2y: '2年パス',
  pro_3y: '3年パス',
}

export default function ActivatePage() {
  const { isPro, refresh } = useProStatus()
  const [segments, setSegments] = useState(['', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // PRO済みユーザーの詳細情報
  const [proDetails, setProDetails] = useState<ReturnType<typeof getProDetails>>(null)
  useEffect(() => {
    if (isPro) setProDetails(getProDetails())
  }, [isPro])

  // セグメント入力ハンドラ
  const handleSegmentChange = (index: number, value: string) => {
    // 大文字化 + 英数字のみ
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    const next = [...segments]
    next[index] = cleaned
    setSegments(next)

    // 4文字入力で次のフィールドへ自動遷移
    if (cleaned.length === 4 && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // ペースト対応（IWOR-XXXX-XXXX-XXXX 形式）
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim().toUpperCase()
    const match = text.match(/^IWOR-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/)
    if (match) {
      e.preventDefault()
      setSegments(['IWOR', match[1], match[2], match[3]])
      inputRefs.current[3]?.focus()
    }
  }

  // バックスペースで前のフィールドに戻る
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && segments[index] === '' && index > 1) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // アクティベーション実行
  const handleActivate = async () => {
    const code = `IWOR-${segments[1]}-${segments[2]}-${segments[3]}`
    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await activateProCode(code)
      if (res.success) {
        refresh()
        setResult({
          success: true,
          message: `🎉 ${planLabels[res.plan!] || res.plan}のアクティベーションが完了しました！`,
        })
      } else {
        setResult({ success: false, message: res.error || '不明なエラーが発生しました。' })
      }
    } catch {
      setResult({ success: false, message: 'エラーが発生しました。もう一度お試しください。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCodeComplete = segments[1].length === 4 && segments[2].length === 4 && segments[3].length === 4

  // ── 既にPRO会員の場合 ──
  if (isPro && proDetails) {
    const expiresDate = proDetails.expiresAt ? new Date(proDetails.expiresAt) : null
    const daysLeft = expiresDate
      ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    return (
      <div className="max-w-lg mx-auto -mt-2">
        <nav className="text-sm text-muted mb-8">
          <Link href="/" className="hover:text-ac">ホーム</Link>
          <span className="mx-2">›</span>
          <Link href="/pro" className="hover:text-ac">iwor PRO</Link>
          <span className="mx-2">›</span>
          <span>アクティベーション</span>
        </nav>

        <div className="bg-s0 border border-br rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-okl border border-okb rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-tx mb-2">PRO会員です</h1>
          <p className="text-sm text-muted mb-6">現在、iwor PROのすべての機能をご利用いただけます。</p>

          <div className="bg-s1 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">プラン</span>
              <span className="font-medium text-tx">{planLabels[proDetails.plan] || proDetails.plan}</span>
            </div>
            {proDetails.activatedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">開始日</span>
                <span className="font-medium text-tx">{new Date(proDetails.activatedAt).toLocaleDateString('ja-JP')}</span>
              </div>
            )}
            {expiresDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">有効期限</span>
                <span className="font-medium text-tx">
                  {expiresDate.toLocaleDateString('ja-JP')}
                  {daysLeft !== null && <span className="text-muted ml-1">（残り{daysLeft}日）</span>}
                </span>
              </div>
            )}
          </div>

          <Link
            href="/tools"
            className="inline-flex items-center gap-2 bg-ac text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors"
          >
            ツールを使う →
          </Link>
        </div>
      </div>
    )
  }

  // ── アクティベーション成功後 ──
  if (result?.success) {
    return (
      <div className="max-w-lg mx-auto -mt-2">
        <nav className="text-sm text-muted mb-8">
          <Link href="/" className="hover:text-ac">ホーム</Link>
          <span className="mx-2">›</span>
          <Link href="/pro" className="hover:text-ac">iwor PRO</Link>
          <span className="mx-2">›</span>
          <span>アクティベーション</span>
        </nav>

        <div className="bg-s0 border border-br rounded-2xl p-8 text-center">
          <div
            className="w-20 h-20 bg-okl border-2 border-okb rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ animation: 'successPop .4s cubic-bezier(.34,1.56,.64,1)' }}
          >
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-xl font-bold text-tx mb-2">アクティベーション完了！</h1>
          <p className="text-sm text-muted mb-6">{result.message}</p>

          <div className="space-y-3">
            <Link
              href="/tools"
              className="block w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac2 transition-colors"
            >
              臨床ツールを使ってみる
            </Link>
            <Link
              href="/pro"
              className="block w-full py-3 bg-s1 text-tx border border-br rounded-xl font-medium text-sm hover:border-ac/30 transition-colors"
            >
              PRO機能一覧を見る
            </Link>
          </div>
        </div>

        <style jsx>{`
          @keyframes successPop {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ── コード入力フォーム ──
  return (
    <div className="max-w-lg mx-auto -mt-2">
      <nav className="text-sm text-muted mb-8">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/pro" className="hover:text-ac">iwor PRO</Link>
        <span className="mx-2">›</span>
        <span>アクティベーション</span>
      </nav>

      <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ac/10 border border-ac/20 text-ac text-xs font-bold rounded-full mb-4">
            ✦ iwor PRO
          </div>
          <h1 className="text-xl font-bold text-tx mb-2">アクティベーションコード入力</h1>
          <p className="text-sm text-muted leading-relaxed">
            BOOTHでご購入いただいたコードを入力してください。
          </p>
        </div>

        {/* コード入力フィールド */}
        <div className="flex items-center justify-center gap-2 mb-6" onPaste={handlePaste}>
          {/* IWOR固定プレフィックス */}
          <div className="w-16 h-12 bg-s1 border border-br rounded-lg flex items-center justify-center text-sm font-mono font-bold text-muted">
            IWOR
          </div>
          <span className="text-muted font-bold">-</span>
          {/* 入力セグメント 3つ */}
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <input
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={4}
                value={segments[i]}
                onChange={e => handleSegmentChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-16 h-12 text-center text-sm font-mono font-bold tracking-wider bg-bg border-2 border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all uppercase placeholder:text-muted/40"
                placeholder="····"
              />
              {i < 3 && <span className="text-muted font-bold">-</span>}
            </div>
          ))}
        </div>

        {/* エラーメッセージ */}
        {result && !result.success && (
          <div className="bg-dnl border border-dnb rounded-xl p-3 mb-4">
            <p className="text-sm text-dn text-center">{result.message}</p>
          </div>
        )}

        {/* アクティベーションボタン */}
        <button
          onClick={handleActivate}
          disabled={!isCodeComplete || isSubmitting}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
            isCodeComplete && !isSubmitting
              ? 'bg-ac text-white hover:bg-ac2 shadow-lg shadow-ac/20'
              : 'bg-s1 text-muted border border-br cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              確認中...
            </span>
          ) : (
            'アクティベーション'
          )}
        </button>

        {/* ヘルプ */}
        <div className="mt-6 pt-6 border-t border-br">
          <h2 className="text-sm font-bold text-tx mb-3">コードが見つからない場合</h2>
          <div className="space-y-2 text-xs text-muted leading-relaxed">
            <p>
              <span className="font-medium text-tx">1.</span>{' '}
              BOOTHの購入完了画面、または注文確認メールをご確認ください。
            </p>
            <p>
              <span className="font-medium text-tx">2.</span>{' '}
              コードは <span className="font-mono text-tx">IWOR-XXXX-XXXX-XXXX</span> の形式です。
            </p>
            <p>
              <span className="font-medium text-tx">3.</span>{' '}
              それでも解決しない場合は{' '}
              <Link href="/contact" className="text-ac hover:underline">お問い合わせ</Link>
              {' '}ください。
            </p>
          </div>
        </div>
      </div>

      {/* まだ購入していない人向け */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted mb-3">コードをお持ちでない方</p>
        <Link
          href="/pro"
          className="inline-flex items-center gap-2 text-sm text-ac font-medium hover:underline"
        >
          iwor PROについて詳しく見る →
        </Link>
      </div>
    </div>
  )
}
