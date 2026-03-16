'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'

// ── マッチングテーマカラー ──
const MC = '#993556'
const MCL = '#FBEAF0'

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

// ── 病院データベース ──
interface Hospital {
  id: number
  name: string
  region: string
  prefecture: string
  type: '大学病院' | '市中病院'
  beds: number
  residents: number
  matchRate: string
  features: string[]
  specialties: string[]
  salary: string
}

const HOSPITALS: Hospital[] = [
  {
    id: 1, name: '聖路加国際病院', region: '関東', prefecture: '東京都',
    type: '市中病院', beds: 520, residents: 40,
    matchRate: '4.2倍', features: ['屋根瓦式', '英語カンファ', '海外研修'],
    specialties: ['内科', '外科', '救急科'], salary: '約450万/年',
  },
  {
    id: 2, name: '亀田メディカルセンター', region: '関東', prefecture: '千葉県',
    type: '市中病院', beds: 865, residents: 36,
    matchRate: '3.8倍', features: ['ER型', '手技豊富', '寮完備'],
    specialties: ['救急科', '外科', '内科'], salary: '約500万/年',
  },
  {
    id: 3, name: '沖縄県立中部病院', region: '九州・沖縄', prefecture: '沖縄県',
    type: '市中病院', beds: 550, residents: 24,
    matchRate: '3.5倍', features: ['米国式', '症例豊富', '離島研修'],
    specialties: ['救急科', '総合診療科', '内科'], salary: '約480万/年',
  },
  {
    id: 4, name: '手稲渓仁会病院', region: '北海道', prefecture: '北海道',
    type: '市中病院', beds: 670, residents: 28,
    matchRate: '3.0倍', features: ['ER型', '症例豊富', '教育充実'],
    specialties: ['救急科', '内科', '外科'], salary: '約520万/年',
  },
  {
    id: 5, name: '虎の門病院', region: '関東', prefecture: '東京都',
    type: '市中病院', beds: 868, residents: 30,
    matchRate: '4.5倍', features: ['専門性高い', '研究機会', '都心立地'],
    specialties: ['内科', '血液内科', '内分泌'], salary: '約430万/年',
  },
  {
    id: 6, name: '東京大学医学部附属病院', region: '関東', prefecture: '東京都',
    type: '大学病院', beds: 1217, residents: 50,
    matchRate: '2.8倍', features: ['研究充実', '専門医取得', 'アカデミック'],
    specialties: ['内科', '外科', '小児科'], salary: '約350万/年',
  },
  {
    id: 7, name: '慶應義塾大学病院', region: '関東', prefecture: '東京都',
    type: '大学病院', beds: 960, residents: 44,
    matchRate: '3.2倍', features: ['関連病院豊富', '研究', '人脈'],
    specialties: ['内科', '外科', '精神科'], salary: '約360万/年',
  },
  {
    id: 8, name: '国立国際医療研究センター', region: '関東', prefecture: '東京都',
    type: '市中病院', beds: 781, residents: 22,
    matchRate: '3.6倍', features: ['グローバル', '感染症', '国際保健'],
    specialties: ['感染症', '内科', '救急科'], salary: '約450万/年',
  },
  {
    id: 9, name: '神戸市立医療センター中央市民病院', region: '近畿', prefecture: '兵庫県',
    type: '市中病院', beds: 768, residents: 28,
    matchRate: '3.4倍', features: ['救急搬送多い', '手技豊富', '教育体制◎'],
    specialties: ['救急科', '内科', '外科'], salary: '約490万/年',
  },
  {
    id: 10, name: '京都大学医学部附属病院', region: '近畿', prefecture: '京都府',
    type: '大学病院', beds: 1121, residents: 42,
    matchRate: '2.5倍', features: ['iPS研究', 'アカデミック', '伝統'],
    specialties: ['内科', '外科', '放射線科'], salary: '約340万/年',
  },
  {
    id: 11, name: '湘南鎌倉総合病院', region: '関東', prefecture: '神奈川県',
    type: '市中病院', beds: 658, residents: 24,
    matchRate: '3.1倍', features: ['救急豊富', '手技重視', '自由度高い'],
    specialties: ['救急科', '循環器', '外科'], salary: '約510万/年',
  },
  {
    id: 12, name: '飯塚病院', region: '九州・沖縄', prefecture: '福岡県',
    type: '市中病院', beds: 1048, residents: 30,
    matchRate: '2.6倍', features: ['総合診療', '教育熱心', '症例豊富'],
    specialties: ['総合診療科', '内科', '外科'], salary: '約500万/年',
  },
  {
    id: 13, name: '大阪大学医学部附属病院', region: '近畿', prefecture: '大阪府',
    type: '大学病院', beds: 1086, residents: 46,
    matchRate: '2.4倍', features: ['先端医療', '研究充実', '免疫学'],
    specialties: ['内科', '外科', '小児科'], salary: '約350万/年',
  },
  {
    id: 14, name: '名古屋大学医学部附属病院', region: '中部', prefecture: '愛知県',
    type: '大学病院', beds: 1080, residents: 40,
    matchRate: '2.2倍', features: ['中部最大', '研究', '関連病院多い'],
    specialties: ['内科', '外科', '整形外科'], salary: '約340万/年',
  },
  {
    id: 15, name: '九州大学病院', region: '九州・沖縄', prefecture: '福岡県',
    type: '大学病院', beds: 1275, residents: 44,
    matchRate: '2.3倍', features: ['九州トップ', '研究', '専門医取得'],
    specialties: ['内科', '外科', '放射線科'], salary: '約350万/年',
  },
  {
    id: 16, name: '済生会横浜市東部病院', region: '関東', prefecture: '神奈川県',
    type: '市中病院', beds: 559, residents: 20,
    matchRate: '2.9倍', features: ['救急強い', '新しい施設', '横浜'],
    specialties: ['救急科', '内科', '外科'], salary: '約480万/年',
  },
  {
    id: 17, name: '東北大学病院', region: '東北', prefecture: '宮城県',
    type: '大学病院', beds: 1225, residents: 38,
    matchRate: '2.0倍', features: ['東北最大', '研究', '災害医療'],
    specialties: ['内科', '外科', '小児科'], salary: '約340万/年',
  },
  {
    id: 18, name: '千葉大学医学部附属病院', region: '関東', prefecture: '千葉県',
    type: '大学病院', beds: 850, residents: 36,
    matchRate: '2.1倍', features: ['関東圏', '研究', 'バランス型'],
    specialties: ['内科', '外科', '皮膚科'], salary: '約350万/年',
  },
  {
    id: 19, name: '横浜市立大学附属病院', region: '関東', prefecture: '神奈川県',
    type: '大学病院', beds: 674, residents: 32,
    matchRate: '2.3倍', features: ['横浜', 'データサイエンス', '国際化'],
    specialties: ['内科', '外科', '産婦人科'], salary: '約350万/年',
  },
  {
    id: 20, name: '洛和会音羽病院', region: '近畿', prefecture: '京都府',
    type: '市中病院', beds: 472, residents: 16,
    matchRate: '2.4倍', features: ['総合内科', 'GIM', 'ケースカンファ充実'],
    specialties: ['総合診療科', '内科', '救急科'], salary: '約470万/年',
  },
]

// ── AI面接の質問テンプレート ──
const INTERVIEW_CATEGORIES = [
  {
    category: '志望動機',
    questions: [
      '当院を志望した理由を教えてください。',
      '初期研修先として当院を選んだ決め手は何ですか？',
      '将来どのような医師になりたいですか？',
    ],
  },
  {
    category: '自己PR',
    questions: [
      'あなたの強みを教えてください。',
      '学生時代に最も力を入れたことは何ですか？',
      'チーム医療であなたが果たせる役割は何ですか？',
    ],
  },
  {
    category: '医療倫理',
    questions: [
      '患者さんが治療を拒否した場合、あなたはどう対応しますか？',
      'インフォームドコンセントで大切なことは何だと思いますか？',
      'チーム内で意見が対立した場合、どう解決しますか？',
    ],
  },
  {
    category: '臨床シナリオ',
    questions: [
      '当直中に急変が起きたら、まず何をしますか？',
      '研修中に自分の限界を感じた時、どう対処しますか？',
      '上級医の指示に疑問を感じた場合、どうしますか？',
    ],
  },
]

const STORAGE_KEY = 'iwor_matching_profile'

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

  // ── プロフィール読み込み ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch { /* ignore */ }
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
  return (
    <div className="space-y-5">
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
      <div className="bg-s0 border border-br rounded-xl p-5">
        <h2 className="text-sm font-bold text-tx mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>1</span>
          基本情報
        </h2>
        <div className="space-y-3">
          <Field label="氏名" value={profile.name} onChange={v => updateField('name', v)} placeholder="山田 太郎" />
          <Field label="大学" value={profile.university} onChange={v => updateField('university', v)} placeholder="○○大学医学部" />
          <div>
            <label className="text-xs font-medium text-tx mb-1 block">卒業年度</label>
            <select
              value={profile.graduationYear}
              onChange={e => updateField('graduationYear', e.target.value)}
              className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-[#993556] focus:ring-1 focus:ring-[#993556]/20 outline-none transition-all"
            >
              <option value="">選択してください</option>
              {[2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={String(y)}>{y}年3月卒業</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 志望 */}
      <div className="bg-s0 border border-br rounded-xl p-5">
        <h2 className="text-sm font-bold text-tx mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>2</span>
          志望情報
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-tx mb-1 block">志望科</label>
            <select
              value={profile.preferredSpecialty}
              onChange={e => updateField('preferredSpecialty', e.target.value)}
              className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-[#993556] focus:ring-1 focus:ring-[#993556]/20 outline-none transition-all"
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
      </div>

      {/* 経歴・PR */}
      <div className="bg-s0 border border-br rounded-xl p-5">
        <h2 className="text-sm font-bold text-tx mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>3</span>
          経歴・自己PR
        </h2>
        <div className="space-y-3">
          <TextArea label="部活・課外活動" value={profile.clubs} onChange={v => updateField('clubs', v)} placeholder="例: バスケットボール部 主将（4年間）、国際医療ボランティア" rows={2} />
          <TextArea label="研究経験" value={profile.research} onChange={v => updateField('research', v)} placeholder="例: 循環器内科学教室で心不全に関する基礎研究（6年次）" rows={2} />
          <TextArea label="自己PRポイント" value={profile.strengths} onChange={v => updateField('strengths', v)} placeholder="例: チームでの協調性、困難な状況でも粘り強く取り組む姿勢" rows={3} />
          <TextArea label="志望動機" value={profile.motivation} onChange={v => updateField('motivation', v)} placeholder="例: 幅広い症例を経験し、地域医療に貢献できる総合力のある医師になりたい" rows={3} />
        </div>
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

// ═══════════════════════════════════════
//  病院検索タブ
// ═══════════════════════════════════════
function HospitalTab({
  profile, isPro, onShowProModal,
}: {
  profile: Profile
  isPro: boolean
  onShowProModal: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = HOSPITALS.filter(h => {
    if (searchQuery && !h.name.includes(searchQuery) && !h.prefecture.includes(searchQuery)) return false
    if (filterRegion && h.region !== filterRegion) return false
    if (filterType && h.type !== filterType) return false
    return true
  })

  // FREE: 上位3件のみ、PRO: 全件
  const FREE_LIMIT = 3
  const visible = isPro ? filtered : filtered.slice(0, FREE_LIMIT)
  const hiddenCount = isPro ? 0 : Math.max(0, filtered.length - FREE_LIMIT)

  return (
    <div className="space-y-4">
      {/* 検索・フィルタ */}
      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="病院名・都道府県で検索"
            className="w-full pl-10 pr-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-[#993556] focus:ring-1 focus:ring-[#993556]/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
            className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-[#993556] outline-none"
          >
            <option value="">全地域</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-[#993556] outline-none"
          >
            <option value="">全タイプ</option>
            <option value="大学病院">大学病院</option>
            <option value="市中病院">市中病院</option>
          </select>
          {profile.preferredRegions.length > 0 && (
            <button
              onClick={() => setFilterRegion(profile.preferredRegions[0])}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-dashed transition-all"
              style={{ borderColor: `${MC}60`, color: MC, background: MCL }}
            >
              希望地域で絞り込み
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted">
          {filtered.length}件の病院{!isPro && ` — 上位${FREE_LIMIT}件表示（PRO会員で全件表示）`}
        </p>
      </div>

      {/* 病院リスト */}
      <div className="space-y-3">
        {visible.map(h => (
          <div key={h.id} className="bg-s0 border border-br rounded-xl overflow-hidden transition-all hover:border-br2">
            <button
              onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-tx truncate">{h.name}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                      h.type === '市中病院' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {h.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span>{h.prefecture}</span>
                    <span>{h.beds}床</span>
                    <span>研修医{h.residents}名</span>
                    <span className="font-medium" style={{ color: MC }}>倍率 {h.matchRate}</span>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${expandedId === h.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {h.features.map(f => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-s1 text-muted">{f}</span>
                ))}
              </div>
            </button>
            {expandedId === h.id && (
              <div className="px-4 pb-4 border-t border-br pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-s1 rounded-lg p-2.5">
                    <p className="text-muted text-[10px] mb-0.5">病床数</p>
                    <p className="font-bold text-tx">{h.beds}床</p>
                  </div>
                  <div className="bg-s1 rounded-lg p-2.5">
                    <p className="text-muted text-[10px] mb-0.5">研修医数</p>
                    <p className="font-bold text-tx">{h.residents}名/年</p>
                  </div>
                  <div className="bg-s1 rounded-lg p-2.5">
                    <p className="text-muted text-[10px] mb-0.5">マッチング倍率</p>
                    <p className="font-bold" style={{ color: MC }}>{h.matchRate}</p>
                  </div>
                  <div className="bg-s1 rounded-lg p-2.5">
                    <p className="text-muted text-[10px] mb-0.5">初期研修医年収目安</p>
                    <p className="font-bold text-tx">{h.salary}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted mb-1">主な強い診療科</p>
                  <div className="flex flex-wrap gap-1">
                    {h.specialties.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: MCL, color: MC }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PRO誘導（FREE時） */}
      {hiddenCount > 0 && (
        <div className="bg-s0 border border-dashed rounded-xl p-6 text-center" style={{ borderColor: `${MC}40` }}>
          <p className="text-sm font-bold text-tx mb-1">あと{hiddenCount}件の病院があります</p>
          <p className="text-xs text-muted mb-4">PRO会員で全{filtered.length}件を表示＋詳細データにアクセス</p>
          <button
            onClick={onShowProModal}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: MC }}
          >
            PRO会員になる
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
//  AI面接タブ
// ═══════════════════════════════════════
function InterviewTab({
  profile, isPro, onShowProModal,
}: {
  profile: Profile
  isPro: boolean
  onShowProModal: () => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)

  const startQuestion = (question: string) => {
    if (!isPro) {
      onShowProModal()
      return
    }
    setCurrentQuestion(question)
    setAnswer('')
    setFeedback(null)
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setIsThinking(true)
    setFeedback(null)

    const sessionToken = typeof window !== 'undefined'
      ? localStorage.getItem('iwor_session_token') || ''
      : ''

    if (!sessionToken) {
      // セッショントークンが無い場合はローカルフォールバック
      await new Promise(r => setTimeout(r, 800))
      setFeedback(generateLocalFeedback(currentQuestion!, answer, profile))
      setIsThinking(false)
      return
    }

    try {
      const res = await fetch('https://iwor-api.mightyaddnine.workers.dev/api/interview-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer,
          profile: {
            preferredSpecialty: profile.preferredSpecialty,
            university: profile.university,
            strengths: profile.strengths,
            motivation: profile.motivation,
          },
        }),
      })
      const data = await res.json()
      if (data.ok && data.feedback) {
        setFeedback(data.feedback)
      } else {
        // APIエラー時はローカルフォールバック
        setFeedback(generateLocalFeedback(currentQuestion!, answer, profile))
      }
    } catch {
      // ネットワークエラー時はローカルフォールバック
      setFeedback(generateLocalFeedback(currentQuestion!, answer, profile))
    }
    setIsThinking(false)
  }

  return (
    <div className="space-y-5">
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
              カテゴリを選んで質問に回答すると、AIがフィードバックをくれます。
              繰り返し練習して、面接本番に備えましょう。
            </p>
          </div>
        </div>
        {!isPro && (
          <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2" style={{ background: MCL, color: MC }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            PRO会員で全カテゴリ＆AIフィードバックが使えます
          </div>
        )}
      </div>

      {!currentQuestion ? (
        <>
          {/* カテゴリ＆質問選択 */}
          {INTERVIEW_CATEGORIES.map(cat => (
            <div key={cat.category} className="bg-s0 border border-br rounded-xl overflow-hidden">
              <button
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left"
              >
                <p className="text-sm font-bold text-tx">{cat.category}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">{cat.questions.length}問</span>
                  <svg
                    className={`w-4 h-4 text-muted transition-transform ${selectedCategory === cat.category ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </button>
              {selectedCategory === cat.category && (
                <div className="px-5 pb-4 space-y-2">
                  {cat.questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => startQuestion(q)}
                      className="w-full text-left px-4 py-3 rounded-lg bg-s1 hover:bg-s2 transition-colors text-xs text-tx flex items-center justify-between gap-3"
                    >
                      <span>{q}</span>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: MC }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <>
          {/* 回答画面 */}
          <div className="bg-s0 border border-br rounded-xl p-5">
            <button
              onClick={() => { setCurrentQuestion(null); setFeedback(null); setAnswer('') }}
              className="text-xs text-muted hover:text-tx mb-3 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              質問一覧に戻る
            </button>

            {/* 質問表示 */}
            <div className="p-4 rounded-xl mb-4" style={{ background: MCL }}>
              <p className="text-xs font-bold mb-1" style={{ color: MC }}>面接官の質問</p>
              <p className="text-sm font-medium text-tx">{currentQuestion}</p>
            </div>

            {/* 回答入力 */}
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="ここに回答を入力してください..."
              rows={6}
              className="w-full px-4 py-3 border border-br rounded-xl bg-bg text-sm text-tx focus:border-[#993556] focus:ring-1 focus:ring-[#993556]/20 outline-none transition-all resize-none mb-3"
            />

            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || isThinking}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: MC }}
            >
              {isThinking ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  AIがフィードバック中...
                </>
              ) : 'フィードバックを受ける'}
            </button>
          </div>

          {/* フィードバック表示 */}
          {feedback && (
            <div className="bg-s0 border border-br rounded-xl p-5">
              <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: MC }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                AIフィードバック
              </p>
              <div className="text-xs text-tx leading-relaxed whitespace-pre-wrap">{feedback}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── ローカルフィードバック生成（MVP用、将来Claude API化） ──
function generateLocalFeedback(question: string, answer: string, profile: Profile): string {
  const length = answer.length
  const lines: string[] = []

  // 長さに応じた全体評価
  if (length < 50) {
    lines.push('【全体評価】回答が短すぎます。面接では具体的なエピソードを交えて1-2分程度で話せる分量を目指しましょう。')
  } else if (length < 150) {
    lines.push('【全体評価】もう少し具体性があると良いです。「なぜそう思ったか」「どのような経験からか」を補足すると説得力が増します。')
  } else {
    lines.push('【全体評価】適切な分量です。内容の構成も意識してみましょう。')
  }

  lines.push('')

  // 構成のアドバイス
  if (!answer.includes('なぜ') && !answer.includes('理由') && !answer.includes('きっかけ')) {
    lines.push('【改善ポイント①】「なぜ」の理由付けが弱い印象です。面接官は動機の深さを見ています。具体的なきっかけとなるエピソードを入れましょう。')
  } else {
    lines.push('【良い点①】理由や動機が述べられています。面接官に説得力を感じてもらえるポイントです。')
  }

  lines.push('')

  // 志望科との関連
  if (profile.preferredSpecialty && !answer.includes(profile.preferredSpecialty)) {
    lines.push(`【改善ポイント②】志望科（${profile.preferredSpecialty}）との関連が回答に含まれていません。将来のビジョンと結びつけると一貫性が出ます。`)
  }

  lines.push('')
  lines.push('【次のステップ】改善点を踏まえてもう一度回答を書き直してみましょう。繰り返し練習することで、本番でも自然に話せるようになります。')

  return lines.join('\n')
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
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-[#993556] focus:ring-1 focus:ring-[#993556]/20 outline-none transition-all"
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
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-[#993556] focus:ring-1 focus:ring-[#993556]/20 outline-none transition-all resize-none"
      />
    </div>
  )
}
