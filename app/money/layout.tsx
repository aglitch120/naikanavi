import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マネー — ふるさと納税・手取り・NISA・確定申告 概算ツール＆返礼品ランキング | iwor',
  description: '医師・専攻医のためのマネー概算ツール。ふるさと納税上限額、手取りシミュレーション、NISA運用シミュレーター、確定申告要否チェッカー。医師に人気の返礼品ランキングも。',
  alternates: { canonical: 'https://iwor.jp/money' },
}

export default function MoneyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
