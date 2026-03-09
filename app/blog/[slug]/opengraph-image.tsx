import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '内科ナビ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface ArticleMeta {
  title: string
  subtitle: string
  category: string
}

function slugToMeta(slug: string): ArticleMeta {
  const metaMap: Record<string, ArticleMeta> = {
    'a01-josler-toha': {
      title: 'J-OSLERとは？',
      subtitle: '内科専攻医が知るべき全体像',
      category: 'J-OSLER基礎',
    },
    'b01-josler-byoreki-youyaku-kakikata': {
      title: '病歴要約の書き方',
      subtitle: 'Accept率を上げる完全ガイド',
      category: '病歴要約',
    },
    'josler-complete-guide': {
      title: 'J-OSLER完全攻略',
      subtitle: '症例登録から修了認定まで',
      category: 'J-OSLER',
    },
    'exam-preparation-guide': {
      title: '内科専門医試験',
      subtitle: '合格マニュアル',
      category: '試験対策',
    },
    'money-guide': {
      title: '専攻医のお金',
      subtitle: 'バイト・確定申告・節税',
      category: 'お金・生活',
    },
    'lifehack-guide': {
      title: 'ライフハック大全',
      subtitle: '研修を乗り切るコツ',
      category: 'メンタル・生活',
    },
    'career-guide': {
      title: 'キャリア設計',
      subtitle: '完全ロードマップ',
      category: 'キャリア',
    },
  }

  if (metaMap[slug]) return metaMap[slug]

  return {
    title: slug.replace(/^[a-z]\d+-/, '').replace(/-/g, ' '),
    subtitle: '',
    category: '内科ナビ',
  }
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meta = slugToMeta(slug)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          backgroundColor: '#1B4F3A',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装飾円（右側） */}
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '-60px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '140px',
            right: '0px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />

        {/* カテゴリバッジ + タイトル */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 1, maxWidth: '75%' }}>
          {/* カテゴリバッジ */}
          <div style={{ display: 'flex' }}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 22,
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: 8,
              }}
            >
              {meta.category}
            </div>
          </div>

          {/* メインタイトル */}
          <div
            style={{
              fontSize: meta.title.length > 12 ? 64 : 80,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {meta.title}
          </div>

          {/* サブタイトル */}
          {meta.subtitle && (
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: 'rgba(134,239,172,0.9)',
                lineHeight: 1.3,
              }}
            >
              {meta.subtitle}
            </div>
          )}
        </div>

        {/* フッター：ブランド名 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            内科ナビ
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
