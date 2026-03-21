import type { Metadata } from 'next'
import LearningTeaser from './LearningTeaser'

export const metadata: Metadata = {
  title: '学習 — iwor',
  description: '内科専門医筆記試験対策の問題演習。17領域・70疾患群から自動出題。ランダム・分野別・苦手克服の3モード。正答率・苦手分野を可視化して効率的に学習。',
  openGraph: {
    title: '学習 — iwor',
    description: '内科専門医筆記試験対策の問題演習。17領域・70疾患群から自動出題。正答率・苦手分野を可視化。',
    url: 'https://iwor.jp/learning',
  },
}

export default function LearningPage() {
  return <LearningTeaser />
}
