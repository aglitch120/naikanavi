import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'iwor - 内科専攻医の悩みをすべて解決する'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #1B4F3A 0%, #0D3328 60%, #0A2820 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 装飾円 */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '480px', height: '480px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '80px', width: '320px', height: '320px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex' }} />

        {/* メインコンテンツ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 1 }}>
          {/* バッジ */}
          <div style={{ display: 'flex' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '22px',
              fontWeight: 700,
              padding: '8px 24px',
              borderRadius: '8px',
            }}>
              内科専攻医向け情報サイト
            </div>
          </div>

          {/* タイトル */}
          <div style={{
            fontSize: '80px',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            iwor
          </div>

          {/* サブタイトル */}
          <div style={{
            fontSize: '36px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.4,
          }}>
            J-OSLER・病歴要約・専門医試験・<br />キャリア・お金まで完全網羅
          </div>
        </div>

        {/* フッター */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            iwor.jp
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#FFFFFF',
            fontSize: '22px',
            fontWeight: 700,
            padding: '12px 32px',
            borderRadius: '8px',
          }}>
            173本の記事を無料公開中
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
