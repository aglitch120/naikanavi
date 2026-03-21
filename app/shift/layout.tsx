import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '当直シフト作成 — ブラウザ完結・無料 | iwor',
  description: '医師の当直シフトを自動作成。NG日を考慮して均等に割り当て。共有リンクで簡単共有。ブラウザ完結・登録不要・完全無料。',
  alternates: { canonical: 'https://iwor.jp/shift' },
}

export default function ShiftLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
