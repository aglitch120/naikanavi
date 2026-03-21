import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ふるさと納税 控除上限シミュレーター — 医師向け | iwor',
  description: '医師・研修医のためのふるさと納税控除上限の目安計算。バイト収入も含めた超ざっくり計算と、価格帯別おすすめ返礼品ランキング。入力データはサーバーに送信されません。',
  alternates: { canonical: 'https://iwor.jp/furusato-nozei' },
}

export default function FurusatoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
