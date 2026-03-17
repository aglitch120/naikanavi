'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import HospitalTab from './HospitalSection'
import InterviewTab from './InterviewSection'

// ── マッチングテーマカラー（サイト統一グリーン） ──
const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 型定義 ──
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

const EMPTY_PROFILE: Profile = {
  name: '',
  university: '',
  graduationYear: '',
  preferredSpecialty: '',
  preferredRegions: [],
  clubs: '',
  research: '',
  strengths: '',
  motivation: '',
}

const SPECIALTIES = [
  '内科', '外科', '小児科', '産婦人科', '整形外科', '脳神経外科',
  '皮膚科', '眼科', '耳鼻咽喉科', '泌尿器科', '精神科', '放射線科',
  '麻酔科', '救急科', '形成外科', '病理', 'リハビリテーション科',
  '総合診療科', '未定',
]

const REGIONS = [
  '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄',
]


const STORAGE_KEY = "iwor_matching_profile"

// ── タブ定義 ──
type TabId = 'profile' | 'resume' | 'hospitals' | 'interview'
const TABS: { id: TabId; label: string; icon: React.ReactNode; pro?: boolean }[] = [
  {
    id: 'profile', label: 'プロフィール',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  },
  {
    id: 'resume', label: '履歴書',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    pro: true,
  },
  {
    id: 'hospitals', label: '病院検索',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  },
  {
    id: 'interview', label: 'AI面接',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>,
    pro: true,
  },
]

export default function MatchingApp() {
  const { isPro, isLoading } = useProStatus()
  const [tab, setTab] = useState<TabId>('profile')
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [showProModal, setShowProModal] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [helpDismissed, setHelpDismissed] = useState(false)
  const [tutorialDone, setTutorialDone] = useState(false)

  // ── プロフィール読み込み ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch { /* ignore */ }
    // Tutorial
    if (!localStorage.getItem('iwor_matching_tutorial_done')) setShowTutorial(true)
    else setTutorialDone(true)
    if (localStorage.getItem('iwor_matching_help_dismissed')) setHelpDismissed(true)
  }, [])

  // ── プロフィール保存 ──
  const saveProfile = useCallback(() => {
    if (!isPro) {
      setShowProModal(true)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [isPro, profile])

  const updateField = useCallback((field: keyof Profile, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }, [])

  const toggleRegion = useCallback((region: string) => {
    setProfile(prev => ({
      ...prev,
      preferredRegions: prev.preferredRegions.includes(region)
        ? prev.preferredRegions.filter(r => r !== region)
        : [...prev.preferredRegions, region],
    }))
  }, [])

  const profileCompletion = (() => {
    const fields = [
      profile.name, profile.university, profile.graduationYear,
      profile.preferredSpecialty, profile.strengths, profile.motivation,
    ]
    const filled = fields.filter(f => f.length > 0).length
    return Math.round((filled / fields.length) * 100)
  })()

  return (
    <>
      {/* ── ヘッダー ── */}
      <div className="mb-6 pt-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: MCL }}>
            <svg className="w-5 h-5" style={{ stroke: MC }} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-tx">マッチング対策</h1>
            <p className="text-xs text-muted">プロフィール → 履歴書 → 病院検索 → AI面接</p>
          </div>
        </div>
      </div>

      {/* ── タブナビゲーション ── */}
      <div className="flex gap-1 mb-6 bg-s1 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-s0 shadow-sm'
                : 'text-muted hover:text-tx'
            }`}
            style={tab === t.id ? { color: MC } : undefined}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.pro && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: MCL, color: MC }}>
                PRO
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── タブコンテンツ ── */}
      {tab === 'profile' && (
        <ProfileTab
          profile={profile}
          updateField={updateField}
          toggleRegion={toggleRegion}
          saveProfile={saveProfile}
          saved={saved}
          completion={profileCompletion}
          isPro={isPro}
        />
      )}
      {tab === 'resume' && (
        <ResumeTab
          profile={profile}
          isPro={isPro}
          onShowProModal={() => setShowProModal(true)}
        />
      )}
      {tab === 'hospitals' && (
        <HospitalTab
          profile={profile}
          isPro={isPro}
          onShowProModal={() => setShowProModal(true)}
        />
      )}
      {tab === 'interview' && (
        <InterviewTab
          profile={profile}
          isPro={isPro}
          onShowProModal={() => setShowProModal(true)}
        />
      )}

      {/* ── PROモーダル ── */}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} feature="save" />}

      {/* ── チュートリアル ── */}
      {showTutorial && <MatchingTutorial onClose={() => { setShowTutorial(false); setTutorialDone(true); localStorage.setItem('iwor_matching_tutorial_done', '1') }} />}

      {/* ── ヘルプボタン ── */}
      {!helpDismissed && tutorialDone && !showTutorial && (
        <div style={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', left: 'max(14px, calc(50% - 346px))', zIndex: 40, display: 'flex', alignItems: 'center', gap: 0 }}>
          <button onClick={() => setShowTutorial(true)} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #DDD9D2', background: '#FEFEFC', color: MC, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="使い方ヘルプ">?</button>
          <button onClick={() => { setHelpDismissed(true); localStorage.setItem('iwor_matching_help_dismissed', '1') }} style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#C8C4BC', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', top: -14, left: -6, lineHeight: 1 }} aria-label="ヘルプを非表示">×</button>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════
//  プロフィールタブ
// ═══════════════════════════════════════
function ProfileTab({
  profile, updateField, toggleRegion, saveProfile, saved, completion, isPro,
}: {
  profile: Profile
  updateField: (field: keyof Profile, value: string | string[]) => void
  toggleRegion: (region: string) => void
  saveProfile: () => void
  saved: boolean
  completion: number
  isPro: boolean
}) {
  const [openSection, setOpenSection] = useState<number>(1)
  const toggle = (n: number) => setOpenSection(prev => prev === n ? 0 : n)

  return (
    <div className="space-y-3">
      {/* 完成度バー */}
      <div className="bg-s0 border border-br rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-tx">プロフィール完成度</p>
          <p className="text-sm font-bold" style={{ color: MC }}>{completion}%</p>
        </div>
        <div className="w-full h-2 bg-s1 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${completion}%`, background: MC }}
          />
        </div>
        {completion < 100 && (
          <p className="text-[11px] text-muted mt-2">すべて入力すると履歴書が自動生成されます</p>
        )}
      </div>

      {/* 基本情報 */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden">
        <button onClick={() => toggle(1)} className="w-full flex items-center justify-between p-4 hover:bg-s1/50 transition-colors">
          <span className="text-sm font-bold text-tx flex items-center gap-2">
            <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>1</span>
            基本情報
            {profile.name && profile.university && <span className="text-[10px] text-ac">✓</span>}
          </span>
          <span className={`text-muted transition-transform ${openSection === 1 ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {openSection === 1 && (
          <div className="px-5 pb-5 space-y-3">
            <Field label="氏名" value={profile.name} onChange={v => updateField('name', v)} placeholder="山田 太郎" />
            <Field label="大学" value={profile.university} onChange={v => updateField('university', v)} placeholder="○○大学医学部" />
            <div>
              <label className="text-xs font-medium text-tx mb-1 block">卒業年度</label>
              <select
                value={profile.graduationYear}
                onChange={e => updateField('graduationYear', e.target.value)}
                className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
              >
                <option value="">選択してください</option>
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={String(y)}>{y}年3月卒業</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 志望 */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden">
        <button onClick={() => toggle(2)} className="w-full flex items-center justify-between p-4 hover:bg-s1/50 transition-colors">
          <span className="text-sm font-bold text-tx flex items-center gap-2">
            <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>2</span>
            志望情報
            {profile.preferredSpecialty && <span className="text-[10px] text-ac">✓</span>}
          </span>
          <span className={`text-muted transition-transform ${openSection === 2 ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {openSection === 2 && (
          <div className="px-5 pb-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-tx mb-1 block">志望科</label>
              <select
                value={profile.preferredSpecialty}
                onChange={e => updateField('preferredSpecialty', e.target.value)}
                className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
              >
                <option value="">選択してください</option>
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-tx mb-2 block">希望地域（複数選択可）</label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      profile.preferredRegions.includes(r)
                        ? 'text-white border-transparent'
                        : 'border-br text-muted hover:border-br2 bg-s0'
                    }`}
                    style={profile.preferredRegions.includes(r) ? { background: MC } : undefined}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 経歴・PR */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden">
        <button onClick={() => toggle(3)} className="w-full flex items-center justify-between p-4 hover:bg-s1/50 transition-colors">
          <span className="text-sm font-bold text-tx flex items-center gap-2">
            <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>3</span>
            経歴・自己PR
            {profile.strengths && profile.motivation && <span className="text-[10px] text-ac">✓</span>}
          </span>
          <span className={`text-muted transition-transform ${openSection === 3 ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {openSection === 3 && (
          <div className="px-5 pb-5 space-y-3">
            <TextArea label="部活・課外活動" value={profile.clubs} onChange={v => updateField('clubs', v)} placeholder="例: バスケットボール部 主将（4年間）、国際医療ボランティア" rows={2} />
            <TextArea label="研究経験" value={profile.research} onChange={v => updateField('research', v)} placeholder="例: 循環器内科学教室で心不全に関する基礎研究（6年次）" rows={2} />
            <TextArea label="自己PRポイント" value={profile.strengths} onChange={v => updateField('strengths', v)} placeholder="例: チームでの協調性、困難な状況でも粘り強く取り組む姿勢" rows={3} />
            <TextArea label="志望動機" value={profile.motivation} onChange={v => updateField('motivation', v)} placeholder="例: 幅広い症例を経験し、地域医療に貢献できる総合力のある医師になりたい" rows={3} />
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      <button
        onClick={saveProfile}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
        style={{ background: MC, boxShadow: `0 4px 14px ${MC}33` }}
      >
        {saved ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            保存しました
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            {isPro ? 'プロフィールを保存' : 'プロフィールを保存（PRO）'}
          </>
        )}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════
//  履歴書タブ
// ═══════════════════════════════════════
function ResumeTab({
  profile, isPro, onShowProModal,
}: {
  profile: Profile
  isPro: boolean
  onShowProModal: () => void
}) {
  const hasData = profile.name && profile.university

  return (
    <div className="space-y-5">
      {!hasData ? (
        <div className="bg-s0 border border-br rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: MCL }}>
            <svg className="w-7 h-7" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-tx mb-1">履歴書を生成するには</p>
          <p className="text-xs text-muted">先にプロフィールタブで氏名と大学を入力してください</p>
        </div>
      ) : (
        <>
          {/* 履歴書プレビュー */}
          <div className="bg-s0 border border-br rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-br flex items-center justify-between">
              <p className="text-xs font-bold text-tx">履歴書プレビュー</p>
              <div className="flex items-center gap-2">
                {!isPro && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: MCL, color: MC }}>
                    PRO限定：PDF出力
                  </span>
                )}
              </div>
            </div>

            {/* 履歴書本体 */}
            <div className="p-5 relative">
              <div className="space-y-5">
                {/* 顔写真+基本情報ヘッダー */}
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-s1 border border-br rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-muted">写真</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-tx mb-1">{profile.name || '氏名'}</p>
                    <div className="space-y-0.5 text-xs text-muted">
                      <p>{profile.university || '大学名'}</p>
                      {profile.graduationYear && <p>{profile.graduationYear}年3月卒業見込み</p>}
                      {profile.preferredSpecialty && (
                        <p>志望科: <span className="font-medium text-tx">{profile.preferredSpecialty}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-br" />

                {/* 志望動機 */}
                <ResumeSection title="志望動機" content={profile.motivation} />

                {/* 自己PR */}
                <ResumeSection title="自己PRポイント" content={profile.strengths} />

                {/* 部活・課外活動 */}
                <ResumeSection title="部活・課外活動" content={profile.clubs} />

                {/* 研究経験 */}
                <ResumeSection title="研究経験" content={profile.research} />

                {/* 希望地域 */}
                {profile.preferredRegions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-tx mb-1">希望研修地域</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.preferredRegions.map(r => (
                        <span key={r} className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: MCL, color: MC }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PROブラーオーバーレイ */}
              {!isPro && (
                <div className="absolute inset-0 top-32">
                  <div className="w-full h-full backdrop-blur-md bg-s0/60 flex flex-col items-center justify-center px-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: MCL }}>
                      <svg className="w-6 h-6" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-tx mb-1">PRO会員で履歴書を完全生成</p>
                    <p className="text-xs text-muted mb-4 text-center">PDF出力・病院別カスタマイズ・AI添削が使えます</p>
                    <button
                      onClick={onShowProModal}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                      style={{ background: MC }}
                    >
                      PRO会員になる
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PDF出力ボタン */}
          {isPro && (
            <button
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
              style={{ background: MC, boxShadow: `0 4px 14px ${MC}33` }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              PDFをダウンロード
            </button>
          )}
        </>
      )}
    </div>
  )
}

function ResumeSection({ title, content }: { title: string; content: string }) {
  if (!content) return null
  return (
    <div>
      <p className="text-xs font-bold text-tx mb-1">{title}</p>
      <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}


// ── 共通UIパーツ ──
function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-tx mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
      />
    </div>
  )
}

function TextArea({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="text-xs font-medium text-tx mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all resize-none"
      />
    </div>
  )
}

// ═══ Matching Tutorial ═══
const TUTORIAL_STEPS = [
  {
    emoji: '📝',
    title: 'プロフィールを入力',
    desc: 'まずは基本情報を入力しましょう。大学名・志望科・希望地域・自己PRを入力すると、履歴書の自動生成やAI面接のパーソナライズに使われます。',
  },
  {
    emoji: '📄',
    title: '履歴書を自動生成',
    desc: 'プロフィールを元に、研修医マッチング用の履歴書を自動生成。見学申し込みや面接準備に活用できます。（PRO機能）',
  },
  {
    emoji: '🏥',
    title: '病院を検索・比較',
    desc: '45病院のデータベースから地域・タイプ・診療科・倍率など9種のフィルタで検索。気になるリストに追加してマッチ確率を確認できます。',
  },
  {
    emoji: '🤖',
    title: 'AI面接で練習',
    desc: '志望病院に合わせたAI面接練習。チャット形式/音声形式を選べます。圧迫度や時間を調整して本番に備えましょう。',
  },
  {
    emoji: '📊',
    title: 'マッチ確率を確認',
    desc: '気になるリスト・志望リストの病院について、マッチ確率を算出。戦略的な志望順位の決定をサポートします。（PRO機能）',
  },
]

function MatchingTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const s = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FEFEFC', borderRadius: 20, width: '100%', maxWidth: 400,
        padding: '32px 28px 24px', textAlign: 'center', position: 'relative',
        animation: 'matchTutFadeUp .3s ease-out',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? MC : '#E8E5DF', transition: 'all .3s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: MCL,
          border: `2px solid ${MC}30`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 16px', fontSize: 28,
        }}>
          {s.emoji}
        </div>

        {/* Content */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1917', marginBottom: 8 }}>{s.title}</h3>
        <p style={{ fontSize: 13, color: '#6B6760', lineHeight: 1.7, marginBottom: 24 }}>{s.desc}</p>

        {/* Step counter */}
        <p style={{ fontSize: 11, color: '#C8C4BC', marginBottom: 16 }}>
          {step + 1} / {TUTORIAL_STEPS.length}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', border: '1.5px solid #DDD9D2', borderRadius: 12,
            background: 'none', color: '#6B6760', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            スキップ
          </button>
          <button onClick={() => isLast ? onClose() : setStep(step + 1)} style={{
            flex: 2, padding: '12px 0', border: 'none', borderRadius: 12,
            background: MC, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {isLast ? 'はじめる 🚀' : '次へ →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes matchTutFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
