import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '内科ナビ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// OG画像はslugからタイトルを推測する（Edge Runtime対応）
// Note: Cloudflare Workers(Edge)ではfs/pathが使えないため、
// lib/mdx.tsに依存せずにOG画像を生成する

// slugからタイトルを生成するヘルパー
function slugToTitle(slug: string): string {
  // 記事slugとタイトルのマッピング（新記事追加時に更新）
  const titleMap: Record<string, string> = {
    'a01-josler-toha': '【2026年最新】J-OSLERとは？内科専攻医が知るべき全体像を徹底解説',
    'b01-josler-byoreki-youyaku-kakikata': '【2026年最新】J-OSLER病歴要約の書き方完全ガイド',
    'josler-complete-guide': 'J-OSLER完全攻略ガイド',
    'exam-preparation-guide': '内科専門医試験 合格マニュアル',
    'money-guide': '専攻医のお金完全ガイド',
    'lifehack-guide': '専攻医ライフハック大全',
    'career-guide': 'キャリア設計完全ロードマップ',
  }

  if (titleMap[slug]) return titleMap[slug]

  // マッピングにない場合はslugを整形して表示
  return slug
    .replace(/^b\d+-/, '')
    .replace(/-/g, ' ')
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const title = slugToTitle(slug)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #F5F4F0 0%, #E8F0EC 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ブランドラベル */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#1B4F3A',
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 700,
              padding: '8px 20px',
              borderRadius: 8,
            }}
          >
            内科ナビ
          </div>
        </div>

        {/* タイトル */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: title.length > 30 ? 44 : 52,
              fontWeight: 700,
              color: '#1A1917',
              lineHeight: 1.3,
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#1B4F3A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              内
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#1B4F3A',
              }}
            >
              内科ナビ
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#6B6760',
            }}
          >
            naikanavi.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
