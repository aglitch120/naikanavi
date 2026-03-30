import type { Metadata } from 'next'
import KokushiApp from './KokushiApp'

export const metadata: Metadata = {
  title: '医師国家試験 過去問演習 — 全問無料・AI解説付き | iwor study',
  description: '医師国家試験の過去問を全問無料で演習。AI解説・暗記カード自動生成・苦手分析。第100回〜最新回対応。FSRSアルゴリズムで効率的に復習。',
  alternates: { canonical: 'https://iwor.jp/study/kokushi' },
  openGraph: {
    title: '医師国家試験 過去問演習 — 全問無料・AI解説付き | iwor study',
    description: '医師国家試験の過去問を全問無料で演習。AI解説・暗記カード自動生成・苦手分析。',
    url: 'https://iwor.jp/study/kokushi',
  },
}

export default function KokushiPage() {
  return <KokushiApp />
}
