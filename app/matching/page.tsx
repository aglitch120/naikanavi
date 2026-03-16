import type { Metadata } from 'next'
import MatchingApp from './MatchingApp'

export const metadata: Metadata = {
  title: 'マッチング対策 — iwor',
  description:
    'プロフィール入力から履歴書自動生成、病院データベース検索、AI面接練習まで。医学生のマッチング対策をトータルサポート。',
  alternates: { canonical: 'https://iwor.jp/matching' },
  openGraph: {
    title: 'マッチング対策 — iwor',
    description:
      'プロフィール入力→履歴書自動生成→病院DB→AI面接。マッチング対策をトータルサポート。',
    url: 'https://iwor.jp/matching',
    siteName: 'iwor',
    type: 'website',
  },
}

export default function MatchingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MatchingApp />
    </div>
  )
}
