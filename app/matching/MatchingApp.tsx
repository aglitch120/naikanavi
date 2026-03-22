'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import AppHeader from '@/components/AppHeader'
import HospitalTab from './HospitalSection'
import DocumentsTab from './DocumentsTab'
import ProfileWizard from './ProfileWizard'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 他タブ用の基本Profile（localStorageから読む） ──
interface BasicProfile {
  name: string; university: string; graduationYear: string
  preferredSpecialty: string; preferredRegions: string[]
  clubs: string; research: string; strengths: string; motivation: string
}
const EMPTY_BASIC: BasicProfile = {
  name: '', university: '', graduationYear: '', preferredSpecialty: '',
  preferredRegions: [], clubs: '', research: '', strengths: '', motivation: '',
}
const STORAGE_KEY = "iwor_matching_profile"
const MODE_STORAGE_KEY = "iwor_matching_mode"

type Mode = 'matching' | 'career'
type TabId = 'profile' | 'documents' | 'hospitals' | 'compare' | 'wishlist'

function getTabs(mode: Mode) {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; pro?: boolean }[] = [
    { id: 'profile', label: 'プロフィール',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
    { id: 'documents', label: '書類・チェックリスト',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
  ]
  tabs.push(
    { id: 'hospitals', label: '病院DB',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
    { id: 'compare', label: '病院比較表',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg> },
    { id: 'wishlist', label: '志望ランキング',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
      pro: true },
  )
  return tabs
}

export default function MatchingApp() {
  const { isPro } = useProStatus()
  const [mode, setMode] = useState<Mode>('matching')
  const [tab, setTab] = useState<TabId>('profile')
  const [basicProfile, setBasicProfile] = useState<BasicProfile>(EMPTY_BASIC)
  const [showProModal, setShowProModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [helpDismissed, setHelpDismissed] = useState(false)
  const [tutorialDone, setTutorialDone] = useState(false)

  // ── 初期化 ──
  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const p = JSON.parse(raw); setBasicProfile(prev => ({ ...prev, ...p })) } } catch {}
    const m = localStorage.getItem(MODE_STORAGE_KEY)
    if (m === 'career' || m === 'matching') setMode(m)
    if (!localStorage.getItem('iwor_matching_tutorial_done')) setShowTutorial(true)
    else setTutorialDone(true)
    if (localStorage.getItem('iwor_matching_help_dismissed')) setHelpDismissed(true)
  }, [])

  // ── タブ変更時にプロフィールをlocalStorageから再読み込み ──
  const handleTabChange = useCallback((newTab: TabId) => {
    setTab(newTab)
    if (newTab !== 'profile') {
      try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const p = JSON.parse(raw); setBasicProfile(prev => ({ ...prev, ...p })) } } catch {}
    }
  }, [])

  const handleModeChange = useCallback((m: Mode) => {
    setMode(m); localStorage.setItem(MODE_STORAGE_KEY, m)
    // タブはどちらのモードでも共通なのでリセット不要
  }, [tab])

  const tabs = getTabs(mode)

  return (
    <>
      {/* ── ヘッダー ── */}
      <div className="mb-4 pt-2">
        <AppHeader
          title="マッチング対策・転職"
          subtitle={mode === 'matching' ? 'プロフィール → 書類 → 病院DB → 志望リスト' : 'プロフィール → 書類・メール'}
          badge="FREE"
          favoriteSlug="app-matching"
          favoriteHref="/matching"
        />

        {/* ── モード切替 ── */}
        <div className="flex bg-s1 rounded-xl p-1 mb-4">
          <button onClick={() => handleModeChange('matching')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'matching' ? 'bg-s0 shadow-sm' : 'text-muted hover:text-tx'}`}
            style={mode === 'matching' ? { color: MC } : undefined}>
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
              医学生（マッチング）
            </span>
          </button>
          <button onClick={() => handleModeChange('career')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'career' ? 'bg-s0 shadow-sm' : 'text-muted hover:text-tx'}`}
            style={mode === 'career' ? { color: MC } : undefined}>
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              専攻医・転職
            </span>
          </button>
        </div>
      </div>

      {/* ── タブナビ ── */}
      <div className="flex gap-1 mb-6 bg-s1 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-s0 shadow-sm' : 'text-muted hover:text-tx'
            }`}
            style={tab === t.id ? { color: MC } : undefined}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.pro && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>}
          </button>
        ))}
      </div>

      {/* ── タブコンテンツ ── */}
      {tab === 'profile' && (
        <ProfileWizard isPro={isPro} onShowProModal={() => setShowProModal(true)} mode={mode} />
      )}
      {tab === 'documents' && <DocumentsTab profile={basicProfile} mode={mode} />}
      {tab === 'hospitals' && (
        <HospitalTab profile={basicProfile} isPro={isPro} onShowProModal={() => setShowProModal(true)} initialSubTab="search" />
      )}
      {tab === 'compare' && (
        <HospitalTab profile={basicProfile} isPro={isPro} onShowProModal={() => setShowProModal(true)} initialSubTab="ranking" />
      )}
      {tab === 'wishlist' && (
        <HospitalTab profile={basicProfile} isPro={isPro} onShowProModal={() => setShowProModal(true)} initialSubTab="wishlist" />
      )}

      {showProModal && <ProModal onClose={() => setShowProModal(false)} feature="save" />}

      {showTutorial && <MatchingTutorial mode={mode} onClose={() => {
        setShowTutorial(false); setTutorialDone(true)
        localStorage.setItem('iwor_matching_tutorial_done', '1')
      }} />}

      {!helpDismissed && tutorialDone && !showTutorial && (
        <div style={{ position:'fixed', bottom:'calc(80px + env(safe-area-inset-bottom, 0px))', right:'max(14px, calc(50% - 346px))', zIndex:40, display:'flex', alignItems:'center', gap:0 }}>
          <button onClick={() => setShowTutorial(true)} style={{ width:40, height:40, borderRadius:'50%', border:'1.5px solid #DDD9D2', background:'#FEFEFC', color:MC, fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,.08)', display:'flex', alignItems:'center', justifyContent:'center' }} aria-label="使い方ヘルプ">?</button>
          <button onClick={() => { setHelpDismissed(true); localStorage.setItem('iwor_matching_help_dismissed','1') }} style={{ width:18, height:18, borderRadius:'50%', border:'none', background:'#C8C4BC', color:'#fff', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', top:-14, left:-6, lineHeight:1 }} aria-label="ヘルプを非表示">×</button>
        </div>
      )}
    </>
  )
}

// ═══ Tutorial ═══
const TUT_MATCH = [
  { emoji: '📝', title: 'プロフィールを入力', desc: '6ステップのウィザードで約10分。クリックや選択で簡単に入力できます。' },
  { emoji: '✉️', title: '書類・メールを作成', desc: '見学申込メール、お礼メール、送付状をテンプレートから作成。見学準備チェックリストも。' },
  { emoji: '🏥', title: '病院を検索・比較', desc: '45病院のデータベースから地域・タイプ・診療科・倍率で検索。志望リストでマッチ確率を確認。' },
]
const TUT_CAREER = [
  { emoji: '📝', title: 'プロフィールを入力', desc: '6ステップのウィザードで約10分。経歴・自己PRを簡単に整理できます。' },
  { emoji: '✉️', title: '書類・メールを作成', desc: '見学申込メール、お礼メールなどをテンプレートから簡単に作成できます。' },
]

function MatchingTutorial({ mode, onClose }: { mode: 'matching' | 'career'; onClose: () => void }) {
  const steps = mode === 'matching' ? TUT_MATCH : TUT_CAREER
  const [step, setStep] = useState(0)
  const s = steps[step]; const isLast = step === steps.length - 1
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#FEFEFC', borderRadius:20, width:'100%', maxWidth:400, padding:'32px 28px 24px', textAlign:'center', animation:'matchTutFadeUp .3s ease-out' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:20 }}>
          {steps.map((_,i) => <div key={i} style={{ width: i===step?20:8, height:8, borderRadius:4, background: i===step?'#1B4F3A':'#E8E5DF', transition:'all .3s' }} />)}
        </div>
        <div style={{ width:64, height:64, borderRadius:16, background:'#E8F0EC', border:'2px solid #1B4F3A30', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>{s.emoji}</div>
        <h3 style={{ fontSize:18, fontWeight:700, color:'#1A1917', marginBottom:8 }}>{s.title}</h3>
        <p style={{ fontSize:13, color:'#6B6760', lineHeight:1.7, marginBottom:24 }}>{s.desc}</p>
        <p style={{ fontSize:11, color:'#C8C4BC', marginBottom:16 }}>{step+1} / {steps.length}</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px 0', border:'1.5px solid #DDD9D2', borderRadius:12, background:'none', color:'#6B6760', fontSize:13, fontWeight:500, cursor:'pointer' }}>スキップ</button>
          <button onClick={() => isLast ? onClose() : setStep(step+1)} style={{ flex:2, padding:'12px 0', border:'none', borderRadius:12, background:'#1B4F3A', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>{isLast ? 'はじめる 🚀' : '次へ →'}</button>
        </div>
      </div>
      <style>{`@keyframes matchTutFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
