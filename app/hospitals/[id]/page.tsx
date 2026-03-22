import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HOSPITALS } from '@/app/matching/hospitals-data'

export function generateStaticParams() {
  return HOSPITALS.map(h => ({ id: String(h.id) }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const h = HOSPITALS.find(h => String(h.id) === params.id)
  if (!h) return {}
  return {
    title: `${h.name} — 研修医マッチング情報 | iwor`,
    description: `${h.name}（${h.prefecture}）の初期臨床研修マッチング情報。倍率${h.popularity}倍、定員${h.capacity}名。`,
    alternates: { canonical: `https://iwor.jp/hospitals/${h.id}` },
    openGraph: {
      title: `${h.name} — 研修医マッチング情報`,
      description: `倍率${h.popularity}倍 / 定員${h.capacity}名 / マッチ率${h.matchRate}%`,
      url: `https://iwor.jp/hospitals/${h.id}`,
    },
  }
}

export default function HospitalPage({ params }: { params: { id: string } }) {
  const h = HOSPITALS.find(h => String(h.id) === params.id)
  if (!h) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hospital',
    name: h.name,
    address: { '@type': 'PostalAddress', addressRegion: h.prefecture, addressCountry: 'JP' },
  }

  const popColor = h.popularity <= 2 ? 'var(--ok)' : h.popularity <= 4 ? 'var(--wn)' : 'var(--dn)'

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-muted mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span>&rsaquo;</span>
        <Link href="/hospitals" className="hover:text-ac">研修病院一覧</Link>
        <span>&rsaquo;</span>
        <span className="truncate">{h.name}</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {h.isUniversity && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">大学病院</span>
          )}
          <span className="text-xs text-muted">{h.prefecture}</span>
        </div>
        <h1 className="text-2xl font-bold text-tx">{h.name}</h1>
        {h.program && <p className="text-sm text-muted mt-1">{h.program}</p>}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="倍率" value={`${h.popularity}倍`} color={popColor} />
        <KpiCard label="定員" value={`${h.capacity}名`} color="var(--tx)" />
        <KpiCard label="マッチ率" value={`${h.matchRate}%`} color={h.matchRate >= 90 ? 'var(--ok)' : 'var(--wn)'} />
        <KpiCard label="応募者数" value={`${h.applicants}名`} color="var(--ac)" />
      </div>

      <section className="bg-s0 border border-br rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold text-tx mb-3">マッチング詳細</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted">定員</div>
          <div className="text-tx font-medium">{h.capacity}名</div>
          <div className="text-muted">マッチ者数</div>
          <div className="text-tx font-medium">{h.matched}名</div>
          <div className="text-muted">空席数</div>
          <div className="text-tx font-medium">{h.vacancy > 0 ? `${h.vacancy}名` : 'なし'}</div>
          <div className="text-muted">第1希望応募者</div>
          <div className="text-tx font-medium">{h.applicants}名</div>
          <div className="text-muted">倍率</div>
          <div className="font-medium" style={{ color: popColor }}>{h.popularity}倍</div>
          <div className="text-muted">マッチ率</div>
          <div className="text-tx font-medium">{h.matchRate}%</div>
        </div>
      </section>

      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-6 text-sm text-wn">
        掲載情報はJRMP（医師臨床研修マッチング協議会）公表データに基づきます。最新情報は各病院の公式サイトをご確認ください。
      </div>

      <div className="flex gap-3">
        <Link href="/matching" className="flex-1 bg-s0 border border-br rounded-xl p-3 text-center text-sm text-muted hover:text-ac hover:border-ac/20 transition-colors">
          &larr; マッチング対策
        </Link>
        <Link href="/hospitals" className="flex-1 bg-s0 border border-br rounded-xl p-3 text-center text-sm text-muted hover:text-ac hover:border-ac/20 transition-colors">
          病院一覧
        </Link>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-3 text-center">
      <p className="text-[10px] text-muted mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
