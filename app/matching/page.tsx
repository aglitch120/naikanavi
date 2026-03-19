import type { Metadata } from 'next'
import MatchingApp from './MatchingApp'

export const metadata: Metadata = {
  title: 'マッチング・転職対策 — iwor',
  description:
    'プロフィール入力から履歴書自動生成、書類・メール作成、病院データベース検索まで。医学生のマッチングから専攻医・転職までトータルサポート。',
  alternates: { canonical: 'https://iwor.jp/matching' },
  openGraph: {
    title: 'マッチング・転職対策 — iwor',
    description:
      'プロフィール→書類・メール→病院DB→志望リスト。マッチング・転職対策をトータルサポート。',
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
