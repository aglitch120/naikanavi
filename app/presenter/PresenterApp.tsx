'use client'
import { useState, useMemo, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'
import GlowButton from '@/components/GlowButton'
import { FeedbackRow } from '@/components/tools/ErrorReportButton'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 型定義 ──
type PresentationType = 'conference' | 'study-group' | 'consultation'
type TopicSource = 'case' | 'paper' | 'theme'
type Audience = 'specialist' | 'resident' | 'student' | 'mixed'
type OutputFormat = 'slide' | 'poster' | 'a4-handout' | 'abstract-text' | 'text'

// ── 定数 ──
const TYPES = [
  { id: 'conference' as const, label: '学会発表', icon: '🎤', desc: '口演・ポスター' },
  { id: 'study-group' as const, label: '勉強会・抄読会', icon: '📚', desc: 'ジャーナルクラブ等' },
  { id: 'consultation' as const, label: 'コンサルテーション', icon: '🏥', desc: '他科コンサル要約' },
]
const TOPIC_SOURCES = [
  { id: 'case' as const, label: '症例', icon: '📋', desc: 'カルテ情報から' },
  { id: 'paper' as const, label: '特定の論文', icon: '📄', desc: 'PMID/DOIで指定' },
  { id: 'theme' as const, label: 'テーマ', icon: '💡', desc: 'ざっくりテーマだけ' },
]
const AUDIENCES = [
  { id: 'specialist' as const, label: '専門医' },
  { id: 'resident' as const, label: '研修医' },
  { id: 'student' as const, label: '医学生' },
  { id: 'mixed' as const, label: '混合' },
]
const FORMATS = [
  { id: 'slide' as const, label: 'スライド', icon: '🖥️', hasCount: true },
  { id: 'poster' as const, label: 'ポスター', icon: '📊', hasCount: false },
  { id: 'a4-handout' as const, label: 'A4配布資料', icon: '📋', hasCount: true },
  { id: 'abstract-text' as const, label: '抄録文章', icon: '📝', hasCount: false, hasCharLimit: true },
  { id: 'text' as const, label: 'テキスト', icon: '📃', hasCount: false },
]
const DURATIONS = [1, 3, 5, 7, 10, 15]

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com/', color: '#10A37F' },
  { name: 'Claude', url: 'https://claude.ai/', color: '#CC785C' },
  { name: 'Gemini', url: 'https://gemini.google.com/', color: '#4285F4' },
]

// ── プロンプト生成 ──
function generatePrompt(opts: {
  type: PresentationType; topicSource: TopicSource; audience: Audience
  format: OutputFormat; duration: number; slideCount: number; charLimit: number
  karteText: string; paperRef: string; themeText: string
}): string {
  const { type, topicSource, audience, format, duration, slideCount, charLimit, karteText, paperRef, themeText } = opts

  const audienceDesc = audience === 'specialist' ? '専門医（専門用語OK、エビデンスレベルを明示）'
    : audience === 'resident' ? '研修医（基本的な略語は使用可、背景を簡潔に説明）'
    : audience === 'student' ? '医学生（略語は初出時にフルスペル、基礎知識の補足を入れる）'
    : '混合（専門用語は最小限に、重要な略語は注釈）'

  const formatDesc = format === 'slide' ? `スライド形式（${slideCount}枚目安、1スライド=1メッセージ）`
    : format === 'poster' ? 'A0ポスター形式（Introduction/Methods/Results/Discussion/Conclusionの構成）'
    : format === 'a4-handout' ? `A4配布資料（${slideCount}ページ目安）`
    : format === 'abstract-text' ? `抄録文章（${charLimit}文字以内厳守）`
    : 'テキスト原稿'

  const typeDesc = type === 'conference' ? '学会発表（口演）'
    : type === 'study-group' ? '勉強会・ジャーナルクラブ・抄読会'
    : 'コンサルテーション要約'

  // 学会発表のスライドデザイン指示
  const slideDesignGuide = format === 'slide' ? `

■ スライドデザインの原則（日本の学会慣習に準拠）:
- タイトルスライド: 演題名（日本語）、発表者名・所属、日付、利益相反（COI）開示
- フォント: タイトル28pt以上、本文20pt以上、注釈14pt以上
- 配色: 3色以内（背景白、アクセント1色、強調1色）
- 1スライド=1メッセージ。文字の羅列を避け、図表・画像を活用
- 箇条書きは1スライド5行以内。キーワードのみ記載し、詳細は口頭で補足
- グラフには軸ラベル・単位・n数を必ず記載
- 最終スライドに参考文献リスト（Vancouver形式）
- 発表時間${duration}分に対してスライド${slideCount}枚が目安` : ''

  const posterGuide = format === 'poster' ? `

■ ポスターデザインの原則:
- サイズ: A0縦（841mm×1189mm）が標準
- 構成: Title → Introduction → Methods → Results → Discussion → Conclusion → References
- フォント: タイトル72pt以上、見出し36pt以上、本文24pt以上
- 3段組みレイアウトが標準
- 図表は大きく（ポスターの40-50%を占めるように）
- 結論は箱で囲むなど視覚的に目立たせる
- QRコード（補足資料やフルテキストへのリンク）を入れると好印象` : ''

  // トピックソース別の指示
  let topicInstruction = ''
  if (topicSource === 'case') {
    topicInstruction = `
■ トピック: 症例報告
以下のカルテ情報を元に${typeDesc}の資料を作成してください。

【カルテ情報】
${karteText || '（カルテ情報が入力されていません。ユーザーにカルテ情報の入力を促してください）'}

構成:
1. タイトルスライド（演題名: 疾患名+特徴的なポイント）
2. 症例提示（年齢・性別・主訴・現病歴・既往歴）
3. 身体所見・検査所見（異常値をハイライト、画像所見）
4. 臨床経過（タイムライン形式推奨）
5. 考察（鑑別疾患、文献的考察、ガイドラインとの比較）
6. まとめ・Take Home Message（2-3点）
7. 参考文献（Vancouver形式）`
  } else if (topicSource === 'paper') {
    topicInstruction = `
■ トピック: 特定の論文
以下の論文を元に${typeDesc}の資料を作成してください。

【論文情報】
${paperRef || '（論文情報が入力されていません）'}

まず、この論文のフルテキストを検索してください。
- PubMed、Google Scholar、論文のDOIリンクから全文を取得してください
- もしフルテキストが入手できない場合は、abstractから得られる情報で作成し、「フルテキストを入手して追加情報を提供してください」とユーザーに伝えてください

構成（PICO形式で整理）:
1. タイトル・論文情報（著者・雑誌・IF・出版年）
2. Clinical Question（PICO形式）
3. 研究デザイン・方法（組み入れ基準、盲検化、サンプルサイズ）
4. 結果（主要結果を図表で。NNT/NNH算出可能なら含める）
5. 批判的吟味（内的妥当性・外的妥当性・バイアスリスク）
6. Clinical Bottom Line（明日からの診療にどう活かすか）
7. 参考文献`
  } else {
    topicInstruction = `
■ トピック: テーマベース
以下のテーマで${typeDesc}の資料を作成してください。

【テーマ】
${themeText || '（テーマが入力されていません）'}

まず、このテーマに関する最新のエビデンス（ガイドライン、システマティックレビュー、RCT等）をPubMed等で検索してください。
- もしフルテキストが入手できない論文がある場合は、abstractベースで作成し、「以下の論文のフルテキストを提供していただけると、より詳細な資料が作成できます」とユーザーに伝えてください
- 日本のガイドラインがある場合は優先的に引用

構成:
1. タイトル（テーマを簡潔に）
2. 背景・臨床的意義（なぜこのテーマが重要か）
3. 現在のエビデンス（主要な研究結果を図表で）
4. ガイドラインの推奨（日本のガイドラインを優先）
5. 臨床への応用（具体的な診療アルゴリズム）
6. まとめ・Take Home Message
7. 参考文献（Vancouver形式）`
  }

  return `あなたは日本の臨床医向けプレゼンテーション資料の専門家です。

■ 発表タイプ: ${typeDesc}
■ 対象者: ${audienceDesc}
■ 発表時間: ${duration}分
■ 出力形式: ${formatDesc}
${topicInstruction}
${slideDesignGuide}
${posterGuide}

■ 出力ルール:
- すべて日本語で書いてください（英語の専門用語は適宜使用可）
- 「以下の資料を作成しました」等のメタ説明は不要。資料本文のみ出力
- ${format === 'abstract-text' ? `文字数は${charLimit}文字以内を厳守` : ''}
- エビデンスレベルを明示（RCT、メタ解析、コホート研究等）
- 引用文献はVancouver形式で番号付き
- 図表の提案がある場合は「【図表案】」として説明を記載`.trim()
}

// ═══════════════════════════════════════
export default function PresenterApp() {
  const [type, setType] = useState<PresentationType>('conference')
  const [topicSource, setTopicSource] = useState<TopicSource>('case')
  const [audience, setAudience] = useState<Audience>('mixed')
  const [format, setFormat] = useState<OutputFormat>('slide')
  const [duration, setDuration] = useState(7)
  const [slideCount, setSlideCount] = useState(10)
  const [charLimit, setCharLimit] = useState(400)

  // トピック入力
  const [karteText, setKarteText] = useState('')
  const [karteConsent, setKarteConsent] = useState(false)
  const [paperRef, setPaperRef] = useState('')
  const [themeText, setThemeText] = useState('')

  // 結果
  const [prompt, setPrompt] = useState('')
  const [copied, setCopied] = useState('')

  const canGenerate = useMemo(() => {
    if (topicSource === 'case') return karteConsent && karteText.length > 10
    if (topicSource === 'paper') return paperRef.length > 3
    return themeText.length > 2
  }, [topicSource, karteConsent, karteText, paperRef, themeText])

  const handleGenerate = useCallback(() => {
    const p = generatePrompt({ type, topicSource, audience, format, duration, slideCount, charLimit, karteText, paperRef, themeText })
    setPrompt(p)
    setTimeout(() => document.getElementById('prompt-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [type, topicSource, audience, format, duration, slideCount, charLimit, karteText, paperRef, themeText])

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    })
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
      <AppHeader title="プレゼン資料生成" subtitle="AIプロンプトを生成 → ChatGPT/Claudeに貼り付け" badge="FREE" favoriteSlug="app-presenter" favoriteHref="/presenter" />

      <div className="space-y-3">
        {/* 1. 発表タイプ + 対象者 */}
        <div className="bg-s0 border border-br rounded-xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-muted mb-1.5">発表タイプ</p>
              <div className="flex flex-col gap-1">
                {TYPES.map(t => (
                  <button key={t.id} onClick={() => setType(t.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-left ${
                      type === t.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                    }`}>{t.icon} {t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted mb-1.5">対象者</p>
              <div className="flex flex-wrap gap-1">
                {AUDIENCES.map(a => (
                  <button key={a.id} onClick={() => setAudience(a.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      audience === a.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                    }`}>{a.label}</button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-muted mb-1.5 mt-3">発表時間</p>
              <div className="flex flex-wrap gap-1">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      duration === d ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                    }`}>{d}分</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. 出力形式 */}
        <div className="bg-s0 border border-br rounded-xl p-3">
          <p className="text-[10px] font-bold text-muted mb-1.5">出力形式</p>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                  format === f.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                }`}>{f.icon} {f.label}</button>
            ))}
          </div>
          {/* 枚数/文字数 */}
          {(format === 'slide' || format === 'a4-handout') && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-muted">枚数目安:</span>
              <input type="number" value={slideCount} onChange={e => setSlideCount(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-br rounded-lg text-xs bg-bg text-tx text-center" min={1} max={50} />
              <span className="text-[10px] text-muted">枚</span>
            </div>
          )}
          {format === 'abstract-text' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-muted">文字数上限:</span>
              <input type="number" value={charLimit} onChange={e => setCharLimit(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-br rounded-lg text-xs bg-bg text-tx text-center" min={100} max={2000} step={50} />
              <span className="text-[10px] text-muted">字</span>
            </div>
          )}
        </div>

        {/* 3. トピック入力 */}
        <div className="bg-s0 border border-br rounded-xl p-3">
          <p className="text-[10px] font-bold text-muted mb-1.5">トピックの決め方</p>
          <div className="flex gap-1.5 mb-3">
            {TOPIC_SOURCES.map(ts => (
              <button key={ts.id} onClick={() => setTopicSource(ts.id)}
                className={`flex-1 px-2 py-2 rounded-lg text-[11px] font-medium border transition-all text-center ${
                  topicSource === ts.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                }`}>{ts.icon} {ts.label}</button>
            ))}
          </div>

          {topicSource === 'case' && (
            <>
              <textarea value={karteText} onChange={e => setKarteText(e.target.value)}
                placeholder="カルテ情報を貼り付けてください（主訴・現病歴・検査結果等）"
                rows={4}
                className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none resize-none mb-2" />
              <label className="flex items-start gap-2 text-[10px] text-muted cursor-pointer">
                <input type="checkbox" checked={karteConsent} onChange={e => setKarteConsent(e.target.checked)}
                  className="mt-0.5 accent-green-700" />
                <span>
                  患者の同意取得済み・施設基準を満たしていること・非匿名化処理済みであることを確認しました。
                  データはサーバーに送信・保存されません（ブラウザ上のテキスト操作のみ）。
                </span>
              </label>
            </>
          )}

          {topicSource === 'paper' && (
            <div className="space-y-2">
              <input type="text" value={paperRef} onChange={e => setPaperRef(e.target.value)}
                placeholder="PMID、DOI、または論文タイトルを入力"
                className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none" />
              <p className="text-[9px] text-muted">例: PMID: 34587382 / DOI: 10.1056/NEJMoa2102953 / Inker LA, et al. NEJM 2021</p>
            </div>
          )}

          {topicSource === 'theme' && (
            <textarea value={themeText} onChange={e => setThemeText(e.target.value)}
              placeholder="テーマを入力（例: SGLT2阻害薬の心不全への効果、高齢者の抗凝固療法）"
              rows={2}
              className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none resize-none" />
          )}
        </div>

        {/* 生成ボタン */}
        <GlowButton fullWidth radius={12}>
          <button onClick={handleGenerate} disabled={!canGenerate}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: MC }}>
            プロンプトを生成
          </button>
        </GlowButton>

        {/* AIリンク */}
        {prompt && (
          <div className="flex gap-2 justify-center">
            {AI_LINKS.map(ai => (
              <a key={ai.name} href={ai.url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: ai.color }}>
                {ai.name}で開く
              </a>
            ))}
          </div>
        )}

        {/* 結果 */}
        {prompt && (
          <div id="prompt-result" className="bg-s0 border border-br rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-tx">生成されたプロンプト</p>
              <button onClick={() => handleCopy(prompt, 'prompt')}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: MC }}>
                {copied === 'prompt' ? '✓ コピー済み' : 'コピー'}
              </button>
            </div>
            <pre className="text-[11px] text-tx/80 leading-relaxed whitespace-pre-wrap bg-bg rounded-lg p-3 max-h-64 overflow-y-auto border border-br">
              {prompt}
            </pre>
            <p className="text-[9px] text-muted mt-2">
              上のプロンプトをコピーしてChatGPT・Claude・Geminiに貼り付けてください。
              フルテキストが必要な場合はAIから指示があります。
            </p>
          </div>
        )}
      </div>

      <FeedbackRow appName="プレゼン資料生成" />
    </div>
  )
}
