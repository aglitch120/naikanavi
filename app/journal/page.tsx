import type { Metadata } from 'next'
import JournalApp from './JournalApp'

export const metadata: Metadata = {
  title: '論文フィード — iwor',
  description: 'PubMedから最新医学論文をリアルタイム取得。NEJM・Lancet・JAMA・BMJのTop4モード、診療科別フィルタ、Impact Factorスライダー。ブックマーク＋プレゼン連携。',
  alternates: { canonical: 'https://iwor.jp/journal' },
  openGraph: {
    title: '論文フィード — iwor',
    description: 'PubMedから最新医学論文をリアルタイム取得。Top4ジャーナル＋30誌対応。',
    url: 'https://iwor.jp/journal',
  },
}

export default function JournalPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <JournalApp />
    </div>
  )
}
