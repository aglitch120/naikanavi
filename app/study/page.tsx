import type { Metadata } from 'next'
import StudyApp from './StudyApp'

export const metadata: Metadata = {
  title: 'iwor Study — 医学フラッシュカード',
  description: '医学部CBT・国試・専門医試験対策のフラッシュカードアプリ。タップでカードをめくり、正解・不正解で自己評価。分野別フィルタ対応。',
  alternates: { canonical: 'https://iwor.jp/study' },
  openGraph: {
    title: 'iwor Study — 医学フラッシュカード',
    description: '医学部CBT・国試・専門医試験対策のフラッシュカードアプリ。',
    url: 'https://iwor.jp/study',
  },
}

export default function StudyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <StudyApp />
    </div>
  )
}
