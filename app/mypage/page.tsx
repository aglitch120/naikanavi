'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/components/pro/useProStatus'

const PROFILE_KEY = 'iwor_profile'
const ROLE_KEY = 'iwor_user_role'

interface Profile {
  displayName: string
  role: string // student | resident | fellow | attending
  specialty: string
  hospitalSize: string // small | medium | large | university
  graduationYear: string
  licenseYear: string
}

const ROLES = [
  { id: 'student', label: '医学生' },
  { id: 'resident', label: '初期研修医' },
  { id: 'fellow', label: '専攻医' },
  { id: 'attending', label: '勤務医' },
]

const SPECIALTIES = [
  '総合内科', '循環器', '消化器', '呼吸器', '腎臓', '内分泌', '血液', '神経',
  '膠原病', '感染症', '小児科', '精神科', '外科', '整形外科', '産婦人科',
  '泌尿器', '放射線', '麻酔科', '救急', '皮膚科', '眼科', '耳鼻咽喉科',
  '老年病', '集中治療', 'その他',
]

const HOSPITAL_SIZES = [
  { id: '', label: '未選択' },
  { id: 'clinic', label: 'クリニック' },
  { id: 'small', label: '小規模病院 (~200床)' },
  { id: 'medium', label: '中規模病院 (200-500床)' },
  { id: 'large', label: '大規模病院 (500床+)' },
  { id: 'university', label: '大学病院' },
]

function loadProfile(): Profile {
  if (typeof window === 'undefined') return { displayName: '', role: '', specialty: '', hospitalSize: '', graduationYear: '', licenseYear: '' }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    const p = raw ? JSON.parse(raw) : {}
    const role = localStorage.getItem(ROLE_KEY) || p.role || ''
    return {
      displayName: p.displayName || '',
      role,
      specialty: p.specialty || '',
      hospitalSize: p.hospitalSize || '',
      graduationYear: p.graduationYear || '',
      licenseYear: p.licenseYear || '',
    }
  } catch {
    return { displayName: '', role: '', specialty: '', hospitalSize: '', graduationYear: '', licenseYear: '' }
  }
}

function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  localStorage.setItem(ROLE_KEY, p.role)
}

export default function MyPage() {
  const { isPro } = useProStatus()
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  const update = (key: keyof Profile, value: string) => {
    const next = { ...profile, [key]: value }
    setProfile(next)
    saveProfile(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const email = typeof window !== 'undefined' ? localStorage.getItem('iwor_user_email') || '' : ''

  return (
    <main className="max-w-lg mx-auto px-4 py-8 pb-24">
      <h1 className="text-xl font-bold text-tx mb-1">マイページ</h1>
      <p className="text-xs text-muted mb-6">プロフィール・設定を管理</p>

      {/* PRO Status */}
      <div className={`rounded-xl p-4 mb-6 border ${isPro ? 'bg-acl border-ac/20' : 'bg-s0 border-br'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: isPro ? 'var(--ac)' : 'var(--tx)' }}>
              {isPro ? 'PRO会員' : 'FREE会員'}
            </p>
            {email && <p className="text-[10px] text-muted mt-0.5">{email}</p>}
          </div>
          {!isPro && (
            <Link href="/pro" className="px-4 py-2 bg-ac text-white text-xs font-bold rounded-lg hover:bg-ac2 transition-colors">
              PROにアップグレード
            </Link>
          )}
          {isPro && (
            <span className="text-xs font-bold text-ac px-3 py-1 bg-ac/10 rounded-lg">Active</span>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div className="space-y-4 mb-6">
        <Section title="基本情報">
          {/* Display name */}
          <Field label="ニックネーム" sub="論文コメント等で表示されます">
            <input type="text" value={profile.displayName} onChange={e => update('displayName', e.target.value)}
              placeholder="例: 内科Dr.T"
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac outline-none" />
          </Field>

          {/* Role */}
          <Field label="属性">
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => update('role', r.id)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    profile.role === r.id ? 'bg-acl border-ac/30 text-ac' : 'bg-s0 border-br text-muted hover:border-ac/20'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Graduation year */}
          <Field label="卒業(予定)年">
            <input type="number" value={profile.graduationYear} onChange={e => update('graduationYear', e.target.value)}
              placeholder="例: 2024"
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac outline-none" />
          </Field>

          {/* License year */}
          <Field label="医師免許取得(予定)年">
            <input type="number" value={profile.licenseYear} onChange={e => update('licenseYear', e.target.value)}
              placeholder="例: 2024"
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac outline-none" />
          </Field>
        </Section>

        <Section title="臨床情報">
          {/* Specialty */}
          <Field label="第一標榜診療科">
            <select value={profile.specialty} onChange={e => update('specialty', e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac outline-none">
              <option value="">未選択</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          {/* Hospital size */}
          <Field label="勤務施設規模">
            <select value={profile.hospitalSize} onChange={e => update('hospitalSize', e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac outline-none">
              {HOSPITAL_SIZES.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="アカウント">
          {email ? (
            <div className="text-xs text-muted">
              <p>メール: {email}</p>
              <Link href="/pro/activate" className="text-ac hover:underline mt-1 inline-block">パスワード変更・再ログイン</Link>
            </div>
          ) : (
            <div className="text-xs text-muted">
              <p>ログインしていません</p>
              <Link href="/pro/activate" className="text-ac hover:underline mt-1 inline-block">ログイン / アカウント作成</Link>
            </div>
          )}
        </Section>
      </div>

      {/* Save confirmation */}
      {saved && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-ok text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in">
          保存しました
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/favorites" className="bg-s0 border border-br rounded-xl p-3 text-center text-xs text-muted hover:text-ac hover:border-ac/20 transition-colors">
          お気に入り
        </Link>
        <Link href="/pro" className="bg-s0 border border-br rounded-xl p-3 text-center text-xs text-muted hover:text-ac hover:border-ac/20 transition-colors">
          PROプラン
        </Link>
        <Link href="/privacy" className="bg-s0 border border-br rounded-xl p-3 text-center text-xs text-muted hover:text-ac hover:border-ac/20 transition-colors">
          プライバシーポリシー
        </Link>
        <Link href="/terms" className="bg-s0 border border-br rounded-xl p-3 text-center text-xs text-muted hover:text-ac hover:border-ac/20 transition-colors">
          利用規約
        </Link>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-4">
      <h2 className="text-sm font-bold text-tx mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-tx block mb-1">{label}</label>
      {sub && <p className="text-[10px] text-muted mb-1.5">{sub}</p>}
      {children}
    </div>
  )
}
