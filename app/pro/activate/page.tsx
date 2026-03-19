'use client'

import Link from 'next/link'
import { useState, useEffect, FormEvent } from 'react'
import { registerWithOrderNumber, loginWithEmail, resetPassword, updateProfile, changePassword, fetchProfile, getProDetails, clearProSession } from '@/lib/pro-activation'
import type { UserProfile, FetchedProfile } from '@/lib/pro-activation'
import { useProStatus } from '@/components/pro/useProStatus'
import { trackProRegister, trackProLogin } from '@/lib/gtag'

const planLabels: Record<string, string> = {
  pro_1y: '1年パス',
  pro_2y: '2年パス',
  pro_3y: '3年パス',
}

type Tab = 'register' | 'login' | 'reset'
type PostRegStep = 'password' | 'profile'

export default function ActivatePage() {
  const { isPro, refresh } = useProStatus()
  const [tab, setTab] = useState<Tab>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 登録フォーム
  const [orderNumber, setOrderNumber] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // ログインフォーム
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')

  // パスワードリセットフォーム
  const [resetOrderNumber, setResetOrderNumber] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  // 登録成功結果（パスワード表示用）
  const [regResult, setRegResult] = useState<{ email: string; password: string; plan: string } | null>(null)
  const [postRegStep, setPostRegStep] = useState<PostRegStep>('password')

  // 登録後プロフィール収集
  const [profileRole, setProfileRole] = useState('')
  const [profileUniversity, setProfileUniversity] = useState('')
  const [profileGradYear, setProfileGradYear] = useState('')
  const [profileHospitalSize, setProfileHospitalSize] = useState('')
  const [profileSpecialty, setProfileSpecialty] = useState('')

  // リセット成功結果
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null)

  // PRO済み情報
  const [proDetails, setProDetails] = useState<ReturnType<typeof getProDetails>>(null)
  useEffect(() => {
    if (isPro) setProDetails(getProDetails())
  }, [isPro])

  // ── 会員登録 ──
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    const res = await registerWithOrderNumber(orderNumber, regEmail)
    if (res.success) {
      refresh()
      trackProRegister(res.plan || 'pro_1y')
      setRegResult({ email: res.email!, password: res.password!, plan: res.plan! })
      setPostRegStep('password')
    } else {
      setError(res.error || '登録に失敗しました。')
    }
    setIsSubmitting(false)
  }

  // ── プロフィール保存 ──
  const handleProfileSave = async () => {
    setIsSubmitting(true)
    const profile: UserProfile = {
      role: profileRole,
      ...(profileUniversity && { university: profileUniversity }),
      ...(profileGradYear && { graduationYear: profileGradYear }),
      ...(profileHospitalSize && { hospitalSize: profileHospitalSize }),
      ...(profileSpecialty && { specialty: profileSpecialty }),
    }
    await updateProfile(profile)
    setIsSubmitting(false)
    // 完了後ツールページへ
    window.location.href = '/tools'
  }

  // ── ログイン ──
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    const res = await loginWithEmail(loginEmail, loginPass)
    if (res.success) {
      trackProLogin()
      refresh()
    } else {
      setError(res.error || 'ログインに失敗しました。')
    }
    setIsSubmitting(false)
  }

  // ── パスワードリセット ──
  const handleReset = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    const res = await resetPassword(resetOrderNumber, resetEmail)
    if (res.success) {
      setResetResult({ email: res.email!, password: res.password! })
    } else {
      setError(res.error || 'パスワードの再設定に失敗しました。')
    }
    setIsSubmitting(false)
  }

  // ── 登録成功 → Step 1: パスワード表示 / Step 2: プロフィール収集 ──
  if (regResult) {
    return (
      <div className="max-w-lg mx-auto -mt-2">
        <Breadcrumb />

        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${postRegStep === 'password' ? 'bg-ac text-white' : 'bg-okl text-ok border border-okb'}`}>
            {postRegStep === 'password' ? '1' : '✓'}
          </div>
          <div className="w-8 h-px bg-br" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${postRegStep === 'profile' ? 'bg-ac text-white' : 'bg-s1 text-muted border border-br'}`}>
            2
          </div>
        </div>

        {postRegStep === 'password' && (
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

            <button
              onClick={() => setPostRegStep('profile')}
              className="w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac2 transition-colors"
            >
              次へ — プロフィール入力
            </button>
            <button
              onClick={() => { window.location.href = '/tools' }}
              className="block mx-auto mt-3 text-xs text-muted hover:text-ac transition-colors"
            >
              スキップして始める
            </button>
          </div>
        )}

        {postRegStep === 'profile' && (
          <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-tx mb-2">プロフィール</h1>
              <p className="text-sm text-muted">サービス改善のためご協力ください（1分で完了します）</p>
            </div>

            <div className="space-y-4">
              {/* 必須: 医学生 or 医師 */}
              <div>
                <label className="block text-sm font-medium text-tx mb-2">
                  あなたの立場 <span className="text-[var(--dn)] text-xs">*必須</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'student', label: '医学生', icon: '📚' },
                    { value: 'doctor', label: '医師', icon: '🩺' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProfileRole(opt.value)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        profileRole === opt.value
                          ? 'border-ac bg-acl text-ac'
                          : 'border-br bg-bg text-muted hover:border-ac/40'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 任意: 大学名 */}
              <div>
                <label htmlFor="profile-univ" className="block text-xs font-medium text-tx mb-1">
                  大学名 <span className="text-muted">（任意）</span>
                </label>
                <input
                  id="profile-univ"
                  type="text"
                  autoComplete="off"
                  placeholder="例: 東京大学"
                  value={profileUniversity}
                  onChange={e => setProfileUniversity(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
                />
              </div>

              {/* 任意: 卒業年 */}
              <div>
                <label htmlFor="profile-year" className="block text-xs font-medium text-tx mb-1">
                  卒業年 <span className="text-muted">（任意）</span>
                </label>
                <select
                  id="profile-year"
                  value={profileGradYear}
                  onChange={e => setProfileGradYear(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all appearance-none"
                >
                  <option value="">選択してください</option>
                  <option value="student">在学中</option>
                  {Array.from({ length: 20 }, (_, i) => {
                    const y = new Date().getFullYear() - i
                    return <option key={y} value={String(y)}>{y}年</option>
                  })}
                  <option value="other">それ以前</option>
                </select>
              </div>

              {/* 任意: 病院規模 */}
              <div>
                <label htmlFor="profile-hospital" className="block text-xs font-medium text-tx mb-1">
                  勤務先の病院規模 <span className="text-muted">（任意）</span>
                </label>
                <select
                  id="profile-hospital"
                  value={profileHospitalSize}
                  onChange={e => setProfileHospitalSize(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all appearance-none"
                >
                  <option value="">選択してください</option>
                  <option value="university">大学病院</option>
                  <option value="large">大規模（500床以上）</option>
                  <option value="medium">中規模（200〜499床）</option>
                  <option value="small">小規模（200床未満）</option>
                  <option value="clinic">クリニック・診療所</option>
                  <option value="student">学生（未所属）</option>
                </select>
              </div>

              {/* 任意: 診療科 */}
              <div>
                <label htmlFor="profile-specialty" className="block text-xs font-medium text-tx mb-1">
                  診療科 <span className="text-muted">（任意）</span>
                </label>
                <select
                  id="profile-specialty"
                  value={profileSpecialty}
                  onChange={e => setProfileSpecialty(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all appearance-none"
                >
                  <option value="">選択してください</option>
                  <option value="general">総合内科・総合診療</option>
                  <option value="cardiology">循環器内科</option>
                  <option value="gastro">消化器内科</option>
                  <option value="respiratory">呼吸器内科</option>
                  <option value="nephrology">腎臓内科</option>
                  <option value="endocrine">内分泌・糖尿病内科</option>
                  <option value="neurology">神経内科</option>
                  <option value="hematology">血液内科</option>
                  <option value="rheumatology">膠原病・リウマチ内科</option>
                  <option value="infectious">感染症内科</option>
                  <option value="emergency">救急科</option>
                  <option value="intensive">集中治療科</option>
                  <option value="surgery">外科系</option>
                  <option value="pediatrics">小児科</option>
                  <option value="obgyn">産婦人科</option>
                  <option value="psychiatry">精神科</option>
                  <option value="dermatology">皮膚科</option>
                  <option value="orthopedics">整形外科</option>
                  <option value="urology">泌尿器科</option>
                  <option value="ophthalmology">眼科</option>
                  <option value="ent">耳鼻咽喉科</option>
                  <option value="radiology">放射線科</option>
                  <option value="anesthesia">麻酔科</option>
                  <option value="pathology">病理</option>
                  <option value="resident">初期研修医</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={isSubmitting || !profileRole}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-6 ${
                isSubmitting
                  ? 'bg-s1 text-muted border border-br cursor-wait'
                  : 'bg-ac text-white hover:bg-ac2 shadow-lg shadow-ac/20 disabled:bg-s1 disabled:text-muted disabled:border disabled:border-br disabled:shadow-none disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '保存中...' : '保存して始める'}
            </button>
            <button
              onClick={() => { window.location.href = '/tools' }}
              className="block mx-auto mt-3 text-xs text-muted hover:text-ac transition-colors"
            >
              スキップして始める
            </button>
          </div>
        )}

        <style jsx>{`
          @keyframes successPop {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ── リセット成功 → 新パスワード表示 ──
  if (resetResult) {
    return (
      <div className="max-w-lg mx-auto -mt-2">
        <Breadcrumb />
        <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-okl border-2 border-okb rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔑</span>
            </div>
            <h1 className="text-xl font-bold text-tx mb-2">パスワード再設定完了</h1>
            <p className="text-sm text-muted">新しいパスワードでログインしてください。</p>
          </div>

          <div className="bg-wnl border border-wnb rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-wn mb-2">⚠️ 新しいパスワードを必ず保存してください</p>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">メール</span>
                <span className="font-mono font-bold text-tx">{resetResult.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">新パスワード</span>
                <span className="font-mono font-bold text-tx text-lg tracking-widest">{resetResult.password}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setResetResult(null)
              setTab('login')
              setLoginEmail(resetResult.email)
              setLoginPass('')
            }}
            className="block w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac2 transition-colors text-center"
          >
            ログインへ
          </button>
        </div>
      </div>
    )
  }

  // ── PRO会員 → マイページ ──
  if (isPro && proDetails) {
    return <MyPage proDetails={proDetails} onLogout={() => { clearProSession(); refresh() }} />
  }

  // ── 登録/ログイン/リセット フォーム ──
  return (
    <div className="max-w-lg mx-auto -mt-2">
      <Breadcrumb />
      <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ac/10 border border-ac/20 text-ac text-xs font-bold rounded-full mb-4">
            ✦ iwor PRO
          </div>
          <h1 className="text-xl font-bold text-tx">
            {tab === 'register' ? '会員登録' : tab === 'login' ? 'ログイン' : 'パスワード再設定'}
          </h1>
        </div>

        {/* タブ */}
        <div className="flex border border-br rounded-xl overflow-hidden mb-6">
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t || (t === 'login' && tab === 'reset') ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'
              }`}
            >
              {t === 'register' ? '新規登録' : 'ログイン'}
            </button>
          ))}
        </div>

        {/* ── ログインタブ ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-tx mb-1.5">メールアドレス</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@gmail.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-tx mb-1.5">パスワード</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="登録時に発行されたパスワード"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-mono bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-dnl border border-dnb rounded-xl p-3 mt-4">
                <p className="text-sm text-dn text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !loginEmail || !loginPass}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-6 ${
                isSubmitting
                  ? 'bg-s1 text-muted border border-br cursor-wait'
                  : 'bg-ac text-white hover:bg-ac2 shadow-lg shadow-ac/20 disabled:bg-s1 disabled:text-muted disabled:border disabled:border-br disabled:shadow-none disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '処理中...' : 'ログイン'}
            </button>

            <button
              type="button"
              onClick={() => { setTab('reset'); setError('') }}
              className="block mx-auto mt-4 text-xs text-muted hover:text-ac transition-colors"
            >
              パスワードを忘れた方 →
            </button>
          </form>
        )}

        {/* ── 登録タブ ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="space-y-4">
              <div>
                <label htmlFor="reg-order" className="block text-sm font-medium text-tx mb-1.5">注文番号</label>
                <input
                  id="reg-order"
                  name="orderNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="例: 78274978"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="w-full h-12 px-4 text-base font-mono tracking-wider bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all text-center placeholder:tracking-normal placeholder:font-sans"
                />
                <p className="text-xs text-muted mt-1">購入時に発行された注文番号</p>
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-tx mb-1.5">メールアドレス</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@gmail.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
                />
                <p className="text-xs text-muted mt-1">ログインに使用します</p>
              </div>
            </div>

            {/* 利用規約・プライバシーポリシー同意 */}
            <div className="mt-6 pt-5 border-t border-br">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 shrink-0 rounded border-2 border-br text-ac focus:ring-ac/30 accent-[var(--ac)] cursor-pointer"
                />
                <span className="text-xs text-muted leading-relaxed group-hover:text-tx transition-colors">
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-ac underline hover:text-ac2">利用規約</a>
                  および
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-ac underline hover:text-ac2">プライバシーポリシー</a>
                  に同意します
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-dnl border border-dnb rounded-xl p-3 mt-4">
                <p className="text-sm text-dn text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !orderNumber || !regEmail || !agreeTerms}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-6 ${
                isSubmitting
                  ? 'bg-s1 text-muted border border-br cursor-wait'
                  : 'bg-ac text-white hover:bg-ac2 shadow-lg shadow-ac/20 disabled:bg-s1 disabled:text-muted disabled:border disabled:border-br disabled:shadow-none disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '処理中...' : '会員登録'}
            </button>

            <div className="mt-6 pt-6 border-t border-br">
              <h2 className="text-sm font-bold text-tx mb-3">注文番号の確認方法</h2>
              <div className="space-y-2 text-xs text-muted leading-relaxed">
                <p><span className="font-medium text-tx">1.</span> 購入後に届く注文確認メールを開きます。</p>
                <p><span className="font-medium text-tx">2.</span> メールに記載された<span className="font-mono text-tx">注文番号（数字）</span>を入力してください。</p>
                <p><span className="font-medium text-tx">3.</span> それでも解決しない場合は <Link href="/contact" className="text-ac hover:underline">お問い合わせ</Link> ください。</p>
              </div>
            </div>
          </form>
        )}

        {/* ── パスワードリセットタブ ── */}
        {tab === 'reset' && (
          <form onSubmit={handleReset}>
            <p className="text-sm text-muted mb-4">
              注文番号と登録メールアドレスを入力すると、新しいパスワードが発行されます。
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-order" className="block text-sm font-medium text-tx mb-1.5">注文番号</label>
                <input
                  id="reset-order"
                  name="orderNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="例: 78274978"
                  value={resetOrderNumber}
                  onChange={e => setResetOrderNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="w-full h-12 px-4 text-base font-mono tracking-wider bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all text-center placeholder:tracking-normal placeholder:font-sans"
                />
              </div>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-tx mb-1.5">登録メールアドレス</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@gmail.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-bg border-2 border-br rounded-xl focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-dnl border border-dnb rounded-xl p-3 mt-4">
                <p className="text-sm text-dn text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !resetOrderNumber || !resetEmail}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-6 ${
                isSubmitting
                  ? 'bg-s1 text-muted border border-br cursor-wait'
                  : 'bg-ac text-white hover:bg-ac2 shadow-lg shadow-ac/20 disabled:bg-s1 disabled:text-muted disabled:border disabled:border-br disabled:shadow-none disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '処理中...' : 'パスワードを再設定'}
            </button>

            <button
              type="button"
              onClick={() => { setTab('login'); setError('') }}
              className="block mx-auto mt-4 text-xs text-muted hover:text-ac transition-colors"
            >
              ← ログインに戻る
            </button>
          </form>
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

const appLinks = [
  { href: '/tools', icon: '🩺', title: '臨床ツール', sub: '計算152種・薬剤・手技・基準値・γ計算', tag: 'FREE' },
  { href: '/josler', icon: '📊', title: 'J-OSLER管理', sub: '症例登録 & 進捗管理', tag: 'PRO' },
  { href: '/matching', icon: '🏥', title: 'マッチング・転職対策', sub: '履歴書 & 病院検索', tag: 'PRO' },
  { href: '/journal', icon: '📄', title: '論文フィード', sub: '日本語要約 & ブックマーク', tag: 'FREEMIUM' },
  { href: '/favorites', icon: '⭐', title: 'お気に入り', sub: '保存したツール一覧', tag: 'PRO' },
]

const roleLabels: Record<string, string> = { student: '医学生', doctor: '医師' }
const hospitalLabels: Record<string, string> = {
  university: '大学病院', large: '大規模（500床以上）', medium: '中規模（200〜499床）',
  small: '小規模（200床未満）', clinic: 'クリニック・診療所', student: '学生（未所属）',
}
const specialtyLabels: Record<string, string> = {
  general: '総合内科・総合診療', cardiology: '循環器内科', gastro: '消化器内科',
  respiratory: '呼吸器内科', nephrology: '腎臓内科', endocrine: '内分泌・糖尿病内科',
  neurology: '神経内科', hematology: '血液内科', rheumatology: '膠原病・リウマチ内科',
  infectious: '感染症内科', emergency: '救急科', intensive: '集中治療科',
  surgery: '外科系', pediatrics: '小児科', obgyn: '産婦人科',
  psychiatry: '精神科', dermatology: '皮膚科', orthopedics: '整形外科',
  urology: '泌尿器科', ophthalmology: '眼科', ent: '耳鼻咽喉科',
  radiology: '放射線科', anesthesia: '麻酔科', pathology: '病理',
  resident: '初期研修医', other: 'その他',
}

function MyPage({ proDetails, onLogout }: { proDetails: { email: string; plan: string; expiresAt: string }; onLogout: () => void }) {
  const expiresDate = proDetails.expiresAt ? new Date(proDetails.expiresAt) : null
  const daysLeft = expiresDate ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  // プロフィール取得
  const [profile, setProfile] = useState<FetchedProfile | null>(null)
  useEffect(() => {
    fetchProfile().then(res => { if (res.success && res.profile) setProfile(res.profile) })
  }, [])

  // パスワード変更
  const [showPwChange, setShowPwChange] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleChangePw = async () => {
    setPwSubmitting(true)
    setPwMsg(null)
    const res = await changePassword(currentPw, newPw)
    if (res.success) {
      setPwMsg({ type: 'ok', text: 'パスワードを変更しました。' })
      setCurrentPw('')
      setNewPw('')
      setShowPwChange(false)
    } else {
      setPwMsg({ type: 'err', text: res.error || '変更に失敗しました。' })
    }
    setPwSubmitting(false)
  }

  return (
    <div className="max-w-lg mx-auto -mt-2">
      <Breadcrumb />

      {/* ヘッダー */}
      <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-acl border border-ac/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-ac font-bold text-sm">PRO</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-tx">マイページ</h1>
            <p className="text-xs text-muted truncate">{proDetails.email}</p>
          </div>
        </div>

        {/* アカウント情報 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">プラン</span>
            <span className="font-medium text-tx">{planLabels[proDetails.plan] || proDetails.plan}</span>
          </div>
          {expiresDate && (
            <div className="flex justify-between">
              <span className="text-muted">有効期限</span>
              <span className="font-medium text-tx">
                {expiresDate.toLocaleDateString('ja-JP')}
                {daysLeft !== null && <span className="text-muted ml-1">（残り{daysLeft}日）</span>}
              </span>
            </div>
          )}
          {profile?.role && (
            <div className="flex justify-between">
              <span className="text-muted">立場</span>
              <span className="font-medium text-tx">{roleLabels[profile.role] || profile.role}</span>
            </div>
          )}
          {profile?.university && (
            <div className="flex justify-between">
              <span className="text-muted">大学</span>
              <span className="font-medium text-tx">{profile.university}</span>
            </div>
          )}
          {profile?.graduationYear && (
            <div className="flex justify-between">
              <span className="text-muted">卒業年</span>
              <span className="font-medium text-tx">{profile.graduationYear === 'student' ? '在学中' : `${profile.graduationYear}年`}</span>
            </div>
          )}
          {profile?.hospitalSize && (
            <div className="flex justify-between">
              <span className="text-muted">病院規模</span>
              <span className="font-medium text-tx">{hospitalLabels[profile.hospitalSize] || profile.hospitalSize}</span>
            </div>
          )}
          {profile?.specialty && (
            <div className="flex justify-between">
              <span className="text-muted">診療科</span>
              <span className="font-medium text-tx">{specialtyLabels[profile.specialty] || profile.specialty}</span>
            </div>
          )}
        </div>

        {/* パスワード変更 */}
        <div className="mt-5 pt-4 border-t border-br">
          {!showPwChange ? (
            <button
              onClick={() => setShowPwChange(true)}
              className="text-sm text-ac hover:underline"
            >
              パスワードを変更する
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-tx">パスワード変更</p>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="現在のパスワード"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="新しいパスワード（6文字以上）"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleChangePw}
                  disabled={pwSubmitting || !currentPw || newPw.length < 6}
                  className="flex-1 py-2 bg-ac text-white rounded-lg text-xs font-bold hover:bg-ac2 transition-colors disabled:bg-s1 disabled:text-muted disabled:border disabled:border-br"
                >
                  {pwSubmitting ? '変更中...' : '変更する'}
                </button>
                <button
                  onClick={() => { setShowPwChange(false); setCurrentPw(''); setNewPw(''); setPwMsg(null) }}
                  className="px-4 py-2 text-xs text-muted hover:text-tx border border-br rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          {pwMsg && (
            <p className={`text-xs mt-2 ${pwMsg.type === 'ok' ? 'text-ok' : 'text-dn'}`}>{pwMsg.text}</p>
          )}
        </div>
      </div>

      {/* 7アプリリンク */}
      <div className="bg-s0 border border-br rounded-2xl p-6 md:p-8 mb-4">
        <h2 className="text-sm font-bold text-tx mb-4">サービス一覧</h2>
        <div className="space-y-2">
          {appLinks.map(app => (
            <Link
              key={app.href}
              href={app.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-s1 transition-colors group"
            >
              <span className="text-xl shrink-0">{app.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-tx group-hover:text-ac transition-colors">{app.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    app.tag === 'FREE' ? 'bg-okl text-ok' : app.tag === 'PRO' ? 'bg-acl text-ac' : 'bg-s1 text-muted'
                  }`}>{app.tag}</span>
                </div>
                <p className="text-xs text-muted truncate">{app.sub}</p>
              </div>
              <span className="text-muted text-xs group-hover:text-ac transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ログアウト */}
      <div className="text-center">
        <button
          onClick={onLogout}
          className="text-xs text-muted hover:text-dn transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
