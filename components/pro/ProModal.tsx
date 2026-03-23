'use client'

import { useEffect, useState } from 'react'
import { trackProModalView, trackCtaClick } from '@/lib/gtag'

type ProFeature = 'interpretation' | 'action_plan' | 'favorites' | 'save' | 'result' | 'full_access' | 'first_taste' | 'social_proof'

const featureMessages: Record<ProFeature, { icon: string; title: string; description: string }> = {
  interpretation: {
    icon: '🔍',
    title: '臨床解釈を読む',
    description: 'スコアの意味と次にすべきアクションを確認できます。',
  },
  action_plan: {
    icon: '📋',
    title: 'アクションプランを見る',
    description: '具体的な治療方針と生活指導の一覧を確認できます。',
  },
  favorites: {
    icon: '⭐',
    title: 'お気に入りに保存',
    description: 'よく使うツールをピン留めして、すぐにアクセスできます。',
  },
  save: {
    icon: '💾',
    title: 'データを保存',
    description: '入力データを保存して、次回もすぐに呼び出せます。',
  },
  result: {
    icon: '📊',
    title: '詳細結果を表示',
    description: '完全な診断結果と詳細レポートを確認できます。',
  },
  full_access: {
    icon: '🔓',
    title: 'すべての機能を使う',
    description: 'データ保存・進捗管理・エクスポートが使い放題になります。',
  },
  first_taste: {
    icon: '🎁',
    title: '初回無料プレビュー終了',
    description: '2回目以降はPRO会員でご利用いただけます。',
  },
  social_proof: {
    icon: '📊',
    title: 'みんなのデータを見る',
    description: '同期の進捗・ランキング・人気データはPRO限定です。',
  },
}

interface ProModalProps {
  feature?: ProFeature
  onClose: () => void
}

// 属性別パーソナライズメッセージ
const ROLE_MESSAGES: Record<string, { headline: string; sub: string }> = {
  student: { headline: 'マッチング・CBT対策を万全に', sub: '1,470病院DB、履歴書AI生成、フラッシュカード350枚+' },
  resident: { headline: '当直中に頼れるツールを', sub: '臨床計算178種、薬剤ガイド、EPOC管理、シフト作成' },
  fellow: { headline: 'J-OSLER・論文・単位を一元管理', sub: '症例登録、病歴要約AI、211誌の論文フィード、専門医単位' },
  attending: { headline: '臨床・論文・マネーをもっと効率的に', sub: '臨床計算、論文フィード、ふるさと納税、専門医単位管理' },
}

export default function ProModal({ feature = 'favorites', onClose }: ProModalProps) {
  const msg = featureMessages[feature]
  const [userData, setUserData] = useState({ study: 0, josler: 0, bookmarks: 0 })
  const [role, setRole] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // GA4トラッキング
  useEffect(() => {
    trackProModalView(feature)
  }, [feature])

  // 属性取得
  useEffect(() => {
    setRole(localStorage.getItem('iwor_user_role') || '')
  }, [])

  // 損失回避カウンター: ユーザーの蓄積データ量を集計
  useEffect(() => {
    try {
      let study = 0, josler = 0, bookmarks = 0
      const fsrs = localStorage.getItem('iwor_study_fsrs')
      if (fsrs) { const arr = JSON.parse(fsrs); study = Array.isArray(arr) ? arr.length : 0 }
      const jd = localStorage.getItem('iwor_josler_data')
      if (jd) { const d = JSON.parse(jd); josler = d?.totalCases || 0 }
      const bm = localStorage.getItem('iwor_journal_bookmarks')
      if (bm) { const arr = JSON.parse(bm); bookmarks = Array.isArray(arr) ? arr.length : 0 }
      setUserData({ study, josler, bookmarks })
    } catch {}
  }, [])

  // body スクロール抑止
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-bg border border-br rounded-2xl shadow-2xl max-w-sm w-full p-6"
        style={{ animation: 'proModalIn .2s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-tx hover:bg-s1 transition-colors"
          aria-label="閉じる"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-3xl mb-3">{msg.icon}</div>
          <h2 className="text-lg font-bold text-tx mb-1">{msg.title}</h2>
          <p className="text-sm text-muted mb-2 leading-relaxed">
            {msg.description}
          </p>
          {/* パーソナライズ: 属性別メッセージ */}
          {role && ROLE_MESSAGES[role] && (
            <div className="bg-acl/50 rounded-lg px-3 py-2 mb-2">
              <p className="text-[11px] font-bold text-ac">{ROLE_MESSAGES[role].headline}</p>
              <p className="text-[9px] text-muted mt-0.5">{ROLE_MESSAGES[role].sub}</p>
            </div>
          )}

          {/* 損失回避カウンター: あなたの蓄積データ */}
          {(userData.study > 0 || userData.josler > 0 || userData.bookmarks > 0) && (
            <div className="bg-s1 rounded-xl p-3 mb-3 text-left">
              <p className="text-[11px] font-bold text-tx mb-1.5">あなたのデータ</p>
              <div className="flex gap-3 text-center">
                {userData.study > 0 && (
                  <div className="flex-1">
                    <p className="text-base font-bold text-ac">{userData.study}</p>
                    <p className="text-[9px] text-muted">Study枚</p>
                  </div>
                )}
                {userData.josler > 0 && (
                  <div className="flex-1">
                    <p className="text-base font-bold text-ac">{userData.josler}</p>
                    <p className="text-[9px] text-muted">JOSLER症例</p>
                  </div>
                )}
                {userData.bookmarks > 0 && (
                  <div className="flex-1">
                    <p className="text-base font-bold text-ac">{userData.bookmarks}</p>
                    <p className="text-[9px] text-muted">ブックマーク</p>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-wn mt-1.5 font-medium">FREE会員ではブラウザを閉じるとデータが失われます</p>
            </div>
          )}

          {/* ネガティブフレーミング: 失うもの */}
          <div className="bg-wnl border border-wnb rounded-xl p-3 mb-3 text-left">
            <p className="text-[11px] font-bold text-wn mb-1">FREE会員では使えません</p>
            <ul className="text-[10px] text-wn space-y-0.5">
              <li>・ データ保存（ブラウザを閉じると消えます）</li>
              <li>・ お気に入り・進捗管理・エクスポート</li>
              <li>・ 同期のベンチマーク・ランキング詳細</li>
            </ul>
          </div>

          <div className="bg-acl/50 border border-ac/20 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-ac mb-1">iwor PRO</p>
            <p className="text-xs text-muted">
              全機能アンロック・データ保存・進捗管理
            </p>
            <div className="flex items-baseline justify-center gap-2 mt-2">
              <p className="text-lg font-bold text-tx">
                ¥980<span className="text-xs font-normal text-muted">/月</span>
              </p>
              <p className="text-xs text-muted">or</p>
              <p className="text-lg font-bold text-tx">
                ¥9,800<span className="text-xs font-normal text-muted">/年</span>
              </p>
            </div>
            <p className="text-[10px] text-ok mt-1">年額なら2ヶ月分おトク</p>
          </div>

          <a
            href="/pro"
            onClick={() => trackCtaClick('pro_modal_detail')}
            className="block w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac/90 transition-colors mb-3"
          >
            PRO会員について詳しく見る
          </a>

          <a
            href="/pro/activate"
            className="block text-sm text-ac hover:underline mb-3"
          >
            購入済みの方はログイン
          </a>

          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-tx transition-colors"
          >
            あとで
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes proModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
