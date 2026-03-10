import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '内科ナビ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// クラスターカラー（ASCIIスラッグをキーに使用 - Edge Runtime esbuild互換性のため）
const clusterColorMap: Record<string, string> = {
  'josler-basics': '#1E3A5F',
  'case-registration': '#3D5A80',
  'medical-history': '#1B4F3A',
  'disease-specific': '#2D6A4F',
  'progress-management': '#0D7377',
  'jmecc-training': '#4A5568',
  'specialist-exam': '#7F1D1D',
  'exam-by-field': '#9B2C2C',
  'comprehensive-exam': '#B7410E',
  'ai-tools': '#4338CA',
  'mental-life': '#134E4A',
  'part-time': '#4C1D95',
  'tax-saving': '#92400E',
  'career': '#2B6CB0',
  'academic': '#6D28D9',
  'life-events': '#9D174D',
  'subspecialty': '#5B6ABF',
  'others': '#6B6760',
  // ピラー用
  'josler': '#1E3A5F',
  'exam': '#7F1D1D',
  'money': '#92400E',
  'mental': '#134E4A',
}

const DEFAULT_BG = '#1B4F3A'

// スラッグから日本語表示名へのマッピング
function categoryDisplayName(slug: string): string {
  const map: Record<string, string> = {
    'josler-basics': 'J-OSLER基礎',
    'case-registration': '症例登録',
    'medical-history': '病歴要約',
    'disease-specific': '疾患別病歴要約',
    'progress-management': '進捗管理',
    'jmecc-training': 'JMECC・講習',
    'specialist-exam': '内科専門医試験',
    'exam-by-field': '試験領域別',
    'comprehensive-exam': '総合内科専門医',
    'ai-tools': 'AI・ツール',
    'mental-life': 'メンタル・生活',
    'part-time': 'バイト・収入',
    'tax-saving': '税金・節税',
    'career': 'キャリア',
    'academic': '学会・論文',
    'life-events': '結婚・出産',
    'subspecialty': 'サブスペJ-OSLER',
    'others': 'その他',
    'josler': 'J-OSLER',
    'exam': '試験対策',
    'money': 'お金・生活',
    'mental': 'メンタル',
  }
  return map[slug] || slug
}

// サブタイトルのカラーをベース色に合わせて調整
function getSubtitleColor(bgColor: string): string {
  // 赤系
  if (['#7F1D1D', '#9B2C2C', '#B7410E'].includes(bgColor)) return 'rgba(252,165,165,0.85)'
  // 紫系
  if (['#4C1D95', '#6D28D9', '#5B6ABF'].includes(bgColor)) return 'rgba(196,181,253,0.85)'
  // 青系
  if (['#1E3A5F', '#3D5A80', '#2B6CB0', '#4338CA'].includes(bgColor)) return 'rgba(147,197,253,0.85)'
  // ピンク系
  if (bgColor === '#9D174D') return 'rgba(251,182,206,0.85)'
  // オレンジ系
  if (bgColor === '#92400E') return 'rgba(253,186,116,0.85)'
  // グレー系
  if (['#4A5568', '#6B6760'].includes(bgColor)) return 'rgba(203,213,225,0.85)'
  // ティール/グリーン系（デフォルト）
  return 'rgba(134,239,172,0.85)'
}

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
      category: 'josler-basics',
    },
    'a03-josler-tsukaikata': {
      title: 'J-OSLERの使い方',
      subtitle: '画面の見方から操作方法まで',
      category: 'josler-basics',
    },
    'b01-josler-byoreki-youyaku-kakikata': {
      title: '病歴要約の書き方',
      subtitle: 'Accept率を上げる完全ガイド',
      category: 'medical-history',
    },
    'b02-josler-160cases': {
      title: '160症例の効率的な集め方',
      subtitle: '先輩医師の実体験から学ぶ',
      category: 'case-registration',
    },
    'c04-josler-sougou-kousatsu-kakikata': {
      title: '総合考察の書き方',
      subtitle: '全人的視点の入れ方を徹底解説',
      category: 'medical-history',
    },
    'a06-josler-shuryo-youken': {
      title: 'J-OSLER修了要件',
      subtitle: '症例・病歴要約・講習会すべて網羅',
      category: 'josler-basics',
    },
    'c09-josler-byoreki-youyaku-29cases': {
      title: '29症例の選び方',
      subtitle: '疾患群バランスと書きやすい症例',
      category: 'medical-history',
    },
    'c05-josler-zenjinteki-shiten': {
      title: '全人的視点の書き方',
      subtitle: '具体例とテンプレートで解説',
      category: 'medical-history',
    },
    'b01-josler-shourei-touroku-kakikata': {
      title: 'J-OSLER症例登録の書き方',
      subtitle: 'テンプレートと自己省察の例文付き',
      category: 'case-registration',
    },
    'b03-josler-120cases': {
      title: '120症例の進め方',
      subtitle: '7期生以降の疾患群戦略',
      category: 'case-registration',
    },
    'c01-josler-byoreki-youyaku-kakikata': {
      title: '病歴要約の書き方完全ガイド',
      subtitle: 'Accept率を上げるコツを徹底解説',
      category: 'medical-history',
    },
    'b05-josler-shourei-touroku-template': {
      title: '症例登録テンプレート',
      subtitle: '現病歴・自己省察をパターン別にコピペ',
      category: 'case-registration',
    },
    'c02-josler-byoreki-youyaku-template': {
      title: '病歴要約テンプレート',
      subtitle: '項目別の書き方と入力のコツ',
      category: 'medical-history',
    },
    'c03-josler-byoreki-youyaku-reibun': {
      title: '病歴要約の例文集',
      subtitle: '領域別の書き方を項目ごとに解説',
      category: 'medical-history',
    },
    'c06-josler-nyuingo-keika-kakikata': {
      title: '入院後経過と考察の書き方',
      subtitle: '差し戻されないコツを徹底解説',
      category: 'medical-history',
    },
    'c14-josler-byoreki-youyaku-word-copipe': {
      title: '病歴要約はWordで下書きが正解',
      subtitle: 'コピペ手順と注意点を徹底解説',
      category: 'medical-history',
    },
    'c07-josler-bunken-inyo': {
      title: '文献引用ルール',
      subtitle: 'UpToDate・ガイドラインの書き方',
      category: 'medical-history',
    },
    'c08-josler-byoreki-youyaku-sashimodoshi': {
      title: '病歴要約の差し戻し対策',
      subtitle: 'Revision対応ガイド',
      category: 'medical-history',
    },
    'e01-josler-shinchoku-kanri': {
      title: 'J-OSLER進捗管理の方法',
      subtitle: '最短で修了要件を満たすスケジュール',
      category: 'progress-management',
    },
    'e02-josler-manianai': {
      title: 'J-OSLERが間に合わない！',
      subtitle: '残り期間別の巻き返し戦略',
      category: 'progress-management',
    },
    'e04-josler-checklist': {
      title: 'J-OSLERチェックリスト',
      subtitle: '修了要件を一覧で管理',
      category: 'progress-management',
    },
    'g01-naika-senmoni-benkyouhou': {
      title: '内科専門医試験の勉強法',
      subtitle: 'いつから・何を・どのくらい',
      category: 'specialist-exam',
    },
    'g02-naika-senmoni-itsu-kara': {
      title: '勉強はいつから始める？',
      subtitle: '1ヶ月・3ヶ月・半年プラン',
      category: 'specialist-exam',
    },
    'g03-naika-senmoni-sankousho': {
      title: 'おすすめ参考書・問題集',
      subtitle: '2026年版ランキング',
      category: 'specialist-exam',
    },
    'g05-naika-senmoni-kakomon': {
      title: '内科専門医試験の過去問対策',
      subtitle: '公式問題集の使い方と復元問題',
      category: 'specialist-exam',
    },
    'g08-naika-senmoni-nittei': {
      title: '内科専門医試験の日程まとめ',
      subtitle: '2026年度 出願・会場・時間割',
      category: 'specialist-exam',
    },
    'j01-josler-ai-katsuyo': {
      title: 'J-OSLERをAIで効率化',
      subtitle: 'ChatGPT・Perplexity活用ガイド',
      category: 'ai-tools',
    },
    'j02-byoreki-youyaku-ai-jidou-seisei': {
      title: '病歴要約の総合考察をAIで下書き',
      subtitle: 'プロンプト例付き実践ガイド',
      category: 'ai-tools',
    },
    'a05-josler-kigen-shimekiri': {
      title: 'J-OSLERの期限・締め切り一覧',
      subtitle: '一次評価・二次評価のスケジュール',
      category: 'josler-basics',
    },
    'c12-josler-nijihyouka': {
      title: 'J-OSLER二次評価完全ガイド',
      subtitle: '査読委員の視点とAcceptのコツ',
      category: 'medical-history',
    },
    'josler-complete-guide': {
      title: 'J-OSLER完全攻略',
      subtitle: '症例登録から修了認定まで',
      category: 'josler',
    },
    'exam-preparation-guide': {
      title: '内科専門医試験',
      subtitle: '合格マニュアル',
      category: 'exam',
    },
    'money-guide': {
      title: '専攻医のお金',
      subtitle: 'バイト・確定申告・節税',
      category: 'tax-saving',
    },
    'money-career-guide': {
      title: 'お金とキャリア',
      subtitle: 'バイト・節税・キャリア設計',
      category: 'career',
    },
    'lifehack-guide': {
      title: 'ライフハック大全',
      subtitle: '研修を乗り切るコツ',
      category: 'mental-life',
    },
    'efficiency-guide': {
      title: '効率化ガイド',
      subtitle: 'AI・ツールで作業時間を短縮',
      category: 'ai-tools',
    },
    'career-guide': {
      title: 'キャリア設計',
      subtitle: '完全ロードマップ',
      category: 'career',
    },
  }

  if (metaMap[slug]) return metaMap[slug]

  return {
    title: slug.replace(/^[a-z]\d+-/, '').replace(/-/g, ' '),
    subtitle: '',
    category: 'others',
  }
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meta = slugToMeta(slug)
  const bgColor = clusterColorMap[meta.category] || DEFAULT_BG
  const subtitleColor = getSubtitleColor(bgColor)

  // Noto Sans JP Bold (weight 700) をGoogle Fontsから取得
  const fontBold = await fetch(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700;900&display=swap'
  ).then(res => res.text()).then(css => {
    // CSSからフォントURLを抽出
    const match = css.match(/src: url\(([^)]+)\)/)
    if (match) return fetch(match[1]).then(r => r.arrayBuffer())
    return null
  }).catch(() => null)

  const fonts: { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' | 'italic' }[] = []
  if (fontBold) {
    fonts.push({
      name: 'NotoSansJP',
      data: fontBold,
      weight: 700,
      style: 'normal' as const,
    })
  }

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
          backgroundColor: bgColor,
          fontFamily: fontBold ? 'NotoSansJP' : 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装飾円（右側） */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '-80px',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '130px',
            right: '-10px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />

        {/* カテゴリバッジ + タイトル */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1, maxWidth: '78%' }}>
          {/* カテゴリバッジ */}
          <div style={{ display: 'flex' }}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 24,
                fontWeight: 700,
                padding: '10px 28px',
                borderRadius: 8,
              }}
            >
              {categoryDisplayName(meta.category)}
            </div>
          </div>

          {/* メインタイトル */}
          <div
            style={{
              fontSize: meta.title.length > 12 ? 72 : 88,
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
                fontSize: 36,
                fontWeight: 700,
                color: subtitleColor,
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
              fontSize: 26,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            内科ナビ
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  )
}
