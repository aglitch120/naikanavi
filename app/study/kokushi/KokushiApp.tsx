'use client'

import { useState } from 'react'
import type { Tab, DeckView } from '@/components/study/kokushi/types'
import Sidebar from '@/components/study/kokushi/Sidebar'
import MobileNav from '@/components/study/kokushi/MobileNav'
import Dashboard from '@/components/study/kokushi/Dashboard'
import Practice from '@/components/study/kokushi/Practice'
import QuestionList from '@/components/study/kokushi/QuestionList'
import QuestionView from '@/components/study/kokushi/QuestionView'
import SearchPanel from '@/components/study/kokushi/SearchPanel'
import AIFromPractice from '@/components/study/kokushi/AIFromPractice'
import CardGeneration from '@/components/study/kokushi/CardGeneration'
import DeckManager from '@/components/study/kokushi/DeckManager'
import DeckDetail from '@/components/study/kokushi/DeckDetail'
import CardReview from '@/components/study/kokushi/CardReview'
import Stats from '@/components/study/kokushi/Stats'
import AIChat from '@/components/study/kokushi/AIChat'
import Notes from '@/components/study/kokushi/Notes'

// ── Practice サブビュー ──
type PracticeSubView =
  | { kind: 'browse' }
  | { kind: 'questionList'; title: string }
  | { kind: 'search' }
  | { kind: 'activeQuestion' }
  | { kind: 'aiFromPractice' }
  | { kind: 'cardGeneration' }

// ── Cards サブビュー ──
type CardsSubView =
  | { kind: 'list' }
  | { kind: 'detail'; deckId: number }
  | { kind: 'review' }

export default function KokushiApp() {
  // ── グローバルステート ──
  const [tab, setTab] = useState<Tab>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHover, setSidebarHover] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ── Practice サブビュー ──
  const [practiceView, setPracticeView] = useState<PracticeSubView>({ kind: 'browse' })

  // ── Cards サブビュー ──
  const [cardsView, setCardsView] = useState<CardsSubView>({ kind: 'list' })

  const switchTab = (t: Tab) => {
    setTab(t)
    setMobileMenuOpen(false)
    setPracticeView({ kind: 'browse' })
    setCardsView({ kind: 'list' })
  }

  // ── Practice タブの中身 ──
  function renderPractice() {
    switch (practiceView.kind) {
      case 'browse':
        return (
          <Practice
            onShowQuestionList={(title) => setPracticeView({ kind: 'questionList', title })}
            onShowSearch={() => setPracticeView({ kind: 'search' })}
          />
        )
      case 'questionList':
        return (
          <QuestionList
            title={practiceView.title}
            onBack={() => setPracticeView({ kind: 'browse' })}
            onStartQuestion={() => setPracticeView({ kind: 'activeQuestion' })}
          />
        )
      case 'search':
        return (
          <SearchPanel
            onBack={() => setPracticeView({ kind: 'browse' })}
            onStartQuestion={() => setPracticeView({ kind: 'activeQuestion' })}
          />
        )
      case 'activeQuestion':
        return (
          <QuestionView
            onBack={() => setPracticeView({ kind: 'browse' })}
            onShowAI={() => setPracticeView({ kind: 'aiFromPractice' })}
            onShowCardGen={() => setPracticeView({ kind: 'cardGeneration' })}
          />
        )
      case 'aiFromPractice':
        return <AIFromPractice onBack={() => setPracticeView({ kind: 'activeQuestion' })} />
      case 'cardGeneration':
        return <CardGeneration onBack={() => setPracticeView({ kind: 'activeQuestion' })} />
    }
  }

  // ── Cards タブの中身 ──
  function renderCards() {
    switch (cardsView.kind) {
      case 'list':
        return (
          <DeckManager
            onOpenDeckDetail={(id) => setCardsView({ kind: 'detail', deckId: id })}
            onStartReview={() => setCardsView({ kind: 'review' })}
          />
        )
      case 'detail':
        return (
          <DeckDetail
            deckId={cardsView.deckId}
            onBack={() => setCardsView({ kind: 'list' })}
            onStartReview={() => setCardsView({ kind: 'review' })}
          />
        )
      case 'review':
        return <CardReview onBack={() => setCardsView({ kind: 'list' })} />
    }
  }

  return (
    <div className="flex min-h-screen bg-bg text-tx">
      {/* ── モバイルナビ ── */}
      <MobileNav
        tab={tab}
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={switchTab}
        onClose={() => setMobileMenuOpen(false)}
        onOpen={() => setMobileMenuOpen(true)}
      />

      {/* ── PC サイドバー ── */}
      <Sidebar
        tab={tab}
        sidebarCollapsed={sidebarCollapsed}
        sidebarHover={sidebarHover}
        onNavigate={switchTab}
        onToggleCollapse={() => { setSidebarCollapsed(!sidebarCollapsed); setSidebarHover(false) }}
        onHoverEnter={() => setSidebarHover(true)}
        onHoverLeave={() => setSidebarHover(false)}
      />

      {/* ── メインコンテンツ ── */}
      <main className="flex-1 p-8 max-w-[960px] mx-auto min-w-0 overflow-y-auto max-md:px-4 max-md:pt-16 max-md:pb-24">
        {tab === 'dashboard' && <Dashboard onSwitchTab={switchTab} />}
        {tab === 'practice' && renderPractice()}
        {tab === 'cards' && renderCards()}
        {tab === 'stats' && <Stats />}
        {tab === 'chat' && <AIChat />}
        {tab === 'notes' && <Notes />}
      </main>

      {/* ── アニメーション ── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes glowKokushiSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
