'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { registerWithOrderNumber, loginWithEmail, getProDetails, clearProSession } from '@/lib/pro-activation'
import { useProStatus } from '@/components/pro/useProStatus'

const planLabels: Record<string, string> = {
  pro_1y: '1年パス',
  pro_2y: '2年パス',
  pro_3y: '3年パス',
}

type Tab = 'register' | 'login'

export default function ActivatePage() {
  const { isPro, refresh } = useProStatus()
  const [tab, setTab] = useState<Tab>('register')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 登録フォーム
  const [orderNumber, setOrderNumber] = useState('')
  const [regEmail, setRegEmail] = useState('')

  // ログインフォーム
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')

  // 登録成功結果（パスワード表示用）
  const [regResult, setRegResult] = useState<{ email: string; password: string; plan: string } | null>(null)

  // PRO済み情報
  const [proDetails, setProDetails] = useState<ReturnType<typeof getProDetails>>(null)
  useEffect(() => {
    if (isPro) setProDetails(getProDetails())
  }, [isPro])

  // ── 会員登録 ──
  const handleRegister = async () => {
    setIsSubmitting(true)
    setError('')
    const res = await registerWithOrderNumber(orderNumber, regEmail)
    if (res.success) {
      refresh()
      setRegResult({ email: res.email!, password: res.password!, plan: res.plan! })
    } else {
      setError(res.error || '登録に失敗しました。')
    }
    setIsSubmitting(false)
  }

  // ── ログイン ──
  const handleLogin = async () => {
    setIsSubmitting(true)
    setError('')
    const res = await loginWithEmail(loginEmail, loginPass)
    if (res.success) {
      refresh()
    } else {
      setError(res.error || 'ログインに失敗しました。')
    }
    setIsSubmitting(false)
  }

  // ── 登録成功 → パスワード表示 ──
  if (regResult) {
    return (
      <div className="max-w-lg mx-auto -mt-2">
        <Breadcrumb />
        <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div
              className="w-20 h-20 bg-okl border-2 border-okb rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ animation: 'successPop .4s cubic-bezier(.34,1.56,.64,1)' }}
            >
              <span className="text-3xl">🎉</span>
            </div>
            <h1 className="text-xl font-bold text-tx mb-2">登録完了！</h1>
            <p className="text-sm text-muted">iwor PROのすべての機能が使えるようになりました。</p>
          </div>

          <div className="bg-wnl border border-wnb rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-wn mb-2">⚠️ パスワードを必ず保存してください</p>
            <p className="text-xs text-wn/80 mb-3">このパスワードは再表示できません。スクリーンショットまたはメモで保管してください。</p>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">メール</span>
                <span className="font-mono font-bold text-tx">{regResult.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">パスワード</span>
                <span className="font-mono font-bold text-tx text-lg tracking-widest">{regResult.password}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">プラン</span>
                <span className="font-medium text-tx">{planLabels[regResult.plan] || regResult.plan}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/tools"
              className="block w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac2 transition-colors text-center"
            >
              臨床ツールを使ってみる
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

  // ── PRO会員 ──
  if (isPro && proDetails) {
    const expiresDate = proDetails.expiresAt ? new Date(proDetails.expiresAt) : null
    const daysLeft = expiresDate ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

    return (
      <div className="max-w-lg mx-auto -mt-2">
        <Breadcrumb />
        <div className="bg-s0 border border-br rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-okl border border-okb rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-tx mb-2">PRO会員です</h1>
          <p className="text-sm text-muted mb-6">iwor PROのすべての機能をご利用いただけます。</p>

          <div className="bg-s1 rounded-xl p-4 text-left space-y-2 mb-6">
            {proDetails.email && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">メール</span>
                <span className="font-medium text-tx">{proDetails.email}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">プラン</span>
              <span className="font-medium text-tx">{planLabels[proDetails.plan] || proDetails.plan}</span>
            </div>
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

          <button
            onClick={() => { clearProSession(); refresh(); }}
            className="block mx-auto mt-4 text-xs text-muted hover:text-dn transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    )
  }

  // ── 登録/ログインフォーム ──
  return (
    <div className="max-w-lg mx-auto -mt-2">
      <Breadcrumb />
      <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ac/10 border border-ac/20 text-ac text-xs font-bold rounded-full mb-4">
            ✦ iwor PRO
          </div>
          <h1 className="text-xl font-bold text-tx">
            {tab === 'register' ? '会員登録' : 'ログイン'}
          </h1>
        </div>

        {/* タブ */}
        <div className="flex border border-br rounded-xl overflow-hidden mb-6">
          {(['register', 'login'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'
              }`}
            >
              {t === 'register' ? '新規登録' : 'ログイン'}
            </button>
          ))}
        </div>

        {/* 登録タブ */}
        {tab === 'register' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tx mb-1.5">注文番号</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="例: 78274978"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="w-full h-12 px-4 text-base font-mono tracking-wider bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all text-center placeholder:tracking-normal placeholder:font-sans"
              />
              <p className="text-xs text-muted mt-1">BOOTHの注文確認メールに記載の数字</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-tx mb-1.5">メールアドレス</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full h-12 px-4 text-sm bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
              />
              <p className="text-xs text-muted mt-1">ログインに使用します</p>
            </div>
          </div>
        )}

        {/* ログインタブ */}
        {tab === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tx mb-1.5">メールアドレス</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full h-12 px-4 text-sm bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tx mb-1.5">パスワード</label>
              <input
                type="text"
                placeholder="登録時に発行されたパスワード"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                className="w-full h-12 px-4 text-sm font-mono bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-dnl border border-dnb rounded-xl p-3 mt-4">
            <p className="text-sm text-dn text-center">{error}</p>
          </div>
        )}

        {/* ボタン */}
        <button
          onClick={tab === 'register' ? handleRegister : handleLogin}
          disabled={isSubmitting || (tab === 'register' ? (!orderNumber || !regEmail) : (!loginEmail || !loginPass))}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-6 ${
            isSubmitting
              ? 'bg-s1 text-muted border border-br cursor-wait'
              : 'bg-ac text-white hover:bg-ac2 shadow-lg shadow-ac/20 disabled:bg-s1 disabled:text-muted disabled:border disabled:border-br disabled:shadow-none disabled:cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '処理中...' : tab === 'register' ? '会員登録' : 'ログイン'}
        </button>

        {/* ヘルプ */}
        {tab === 'register' && (
          <div className="mt-6 pt-6 border-t border-br">
            <h2 className="text-sm font-bold text-tx mb-3">注文番号の確認方法</h2>
            <div className="space-y-2 text-xs text-muted leading-relaxed">
              <p><span className="font-medium text-tx">1.</span> BOOTHで購入後、<span className="font-medium text-tx">noreply@booth.pm</span> から届くメールを開きます。</p>
              <p><span className="font-medium text-tx">2.</span> 件名「商品が購入されました（注文番号 <span className="font-mono text-tx">XXXXXXXX</span>）」の数字が注文番号です。</p>
              <p><span className="font-medium text-tx">3.</span> それでも解決しない場合は <Link href="/contact" className="text-ac hover:underline">お問い合わせ</Link> ください。</p>
            </div>
          </div>
        )}
      </div>

      {/* 未購入者向け */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted mb-3">まだ購入されていない方</p>
        <Link href="/pro" className="inline-flex items-center gap-2 text-sm text-ac font-medium hover:underline">
          iwor PROについて詳しく見る →
        </Link>
      </div>
    </div>
  )
}

function Breadcrumb() {
  return (
    <nav className="text-sm text-muted mb-8">
      <Link href="/" className="hover:text-ac">ホーム</Link>
      <span className="mx-2">›</span>
      <Link href="/pro" className="hover:text-ac">iwor PRO</Link>
      <span className="mx-2">›</span>
      <span>アカウント</span>
    </nav>
  )
}
