import type { Metadata } from 'next'
import Link from 'next/link'
import { HOSPITALS, REGIONS } from '@/app/matching/hospitals-data'

export const metadata: Metadata = {
  title: '研修病院一覧 — マッチング対策 | iwor',
  description: `全国${1470}病院の初期臨床研修マッチングデータ。倍率・定員・マッチ率を地域別に比較。`,
  alternates: { canonical: 'https://iwor.jp/hospitals' },
}

const PREF_TO_REGION: Record<string, string> = {
  '北海道':'北海道','青森':'東北','岩手':'東北','宮城':'東北','秋田':'東北','山形':'東北','福島':'東北',
  '茨城':'関東','栃木':'関東','群馬':'関東','埼玉':'関東','千葉':'関東','東京':'関東','神奈川':'関東',
  '新潟':'中部','富山':'中部','石川':'中部','福井':'中部','山梨':'中部','長野':'中部','岐阜':'中部','静岡':'中部','愛知':'中部',
  '三重':'近畿','滋賀':'近畿','京都':'近畿','大阪':'近畿','兵庫':'近畿','奈良':'近畿','和歌山':'近畿',
  '鳥取':'中国','島根':'中国','岡山':'中国','広島':'中国','山口':'中国',
  '徳島':'四国','香川':'四国','愛媛':'四国','高知':'四国',
  '福岡':'九州・沖縄','佐賀':'九州・沖縄','長崎':'九州・沖縄','熊本':'九州・沖縄','大分':'九州・沖縄','宮崎':'九州・沖縄','鹿児島':'九州・沖縄','沖縄':'九州・沖縄',
}

export default function HospitalsIndexPage() {
  const grouped = REGIONS.map(region => ({
    region,
    hospitals: HOSPITALS.filter(h => PREF_TO_REGION[h.prefecture] === region)
      .sort((a, b) => b.popularity - a.popularity),
  })).filter(g => g.hospitals.length > 0)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">研修病院一覧</h1>
      <p className="text-sm text-muted mb-8">全国{HOSPITALS.length}病院のマッチングデータを地域別に比較</p>

      {grouped.map(({ region, hospitals }) => (
        <section key={region} className="mb-8">
          <h2 className="text-base font-bold text-tx mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full" style={{ background: 'var(--ac)' }} />
            {region}
            <span className="text-xs text-muted font-normal">({hospitals.length}病院)</span>
          </h2>
          <div className="grid gap-2">
            {hospitals.slice(0, 20).map(h => {
              const popColor = h.popularity <= 2 ? 'var(--ok)' : h.popularity <= 4 ? 'var(--wn)' : 'var(--dn)'
              return (
                <Link key={h.id} href={`/hospitals/${h.id}`}
                  className="flex items-center gap-3 bg-s0 border border-br rounded-xl p-3 hover:border-ac/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-tx truncate">{h.name}</p>
                    <p className="text-[10px] text-muted">{h.prefecture} / 定員{h.capacity}名</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${popColor}15`, color: popColor }}>
                    {h.popularity}倍
                  </span>
                </Link>
              )
            })}
            {hospitals.length > 20 && (
              <p className="text-xs text-muted text-center py-2">他{hospitals.length - 20}病院 — マッチング対策ツールで検索可能</p>
            )}
          </div>
        </section>
      ))}

      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-6 text-sm text-wn">
        掲載情報はJRMP公表データに基づきます。最新情報は各病院の公式サイトをご確認ください。
      </div>
    </div>
  )
}
