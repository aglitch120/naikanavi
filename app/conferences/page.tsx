import type { Metadata } from 'next'
import ConferencesApp from './ConferencesApp'
import { CONFERENCES_2026 } from '@/lib/conferences-data'

export const metadata: Metadata = {
  title: '医学学会カレンダー 2026 — iwor',
  description: '専門医機構認定 基本領域19学会の学術集会日程を一覧。参加予定の管理も。',
}

// JSON-LD構造化データ
function ConferenceJsonLd() {
  const events = CONFERENCES_2026.map(c => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: c.meetingName,
    startDate: c.startDate,
    endDate: c.endDate,
    location: {
      '@type': 'Place',
      name: c.venue,
      address: { '@type': 'PostalAddress', addressLocality: c.city, addressCountry: 'JP' },
    },
    organizer: { '@type': 'Organization', name: c.society },
  }))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(events) }}
    />
  )
}

export default function ConferencesPage() {
  return (
    <>
      <ConferenceJsonLd />
      <ConferencesApp />
    </>
  )
}
