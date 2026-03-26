'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import { PresenterTutorial } from '@/components/tutorials'
import GlowButton from '@/components/GlowButton'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 型定義 ──
type PresentationType = 'conference' | 'study-group' | 'consultation'
type Audience = 'specialist' | 'resident' | 'student' | 'mixed'
type Format = 'slide' | 'poster' | 'abstract-doc' | 'a4-handout' | 'text'
type TopicSource = 'case' | 'paper' | 'theme'

interface Settings {
  type: PresentationType
  audience: Audience
  duration: number
  format: Format
  topicSource: TopicSource
  topic: string
  // 症例用
  karteText: string
  karteConsent: boolean
  // 論文用
  paperQuery: string // PMID, DOI, or title
  // テーマ用
  themeText: string
  // 出力オプション
  slideCount?: number
  abstractChars?: number
}

const TYPES: { id: PresentationType; label: string; icon: string; desc: string }[] = [
  { id: 'conference', label: '学会発表', icon: '🎤', desc: '学会口演・ポスター・症例報告' },
  { id: 'study-group', label: '勉強会', icon: '📚', desc: 'ジャーナルクラブ・抄読会・症例検討会' },
  { id: 'consultation', label: 'コンサルテーション', icon: '🏥', desc: '他科コンサル資料' },
]

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: 'specialist', label: '専門医' },
  { id: 'resident', label: '研修医' },
  { id: 'student', label: '医学生' },
  { id: 'mixed', label: '混合' },
]

const FORMATS: { id: Format; label: string; icon: string }[] = [
  { id: 'slide', label: 'スライド', icon: '🖥️' },
  { id: 'poster', label: 'ポスター', icon: '📊' },
  { id: 'a4-handout', label: 'A4配布資料', icon: '📋' },
  { id: 'abstract-doc', label: '抄録文章', icon: '📄' },
  { id: 'text', label: 'テキスト', icon: '📝' },
]

const DURATIONS = [1, 3, 5, 7, 10, 15, 20, 30]

const TOPIC_SOURCES: { id: TopicSource; label: string; icon: string; desc: string }[] = [
  { id: 'case', label: '症例', icon: '🩺', desc: 'カルテ情報から発表資料を作成' },
  { id: 'paper', label: '特定の論文', icon: '📑', desc: 'PMID/DOI/タイトルで論文を指定' },
  { id: 'theme', label: 'テーマ', icon: '💡', desc: 'テーマだけ決まっている' },
]

// ── テンプレート定義 ──
interface TemplateSection {
  title: string
  subtitle?: string
  bullets: string[]
  slideNote?: string
  timeGuide?: string
}

function generateTemplate(s: Settings): { title: string; sections: TemplateSection[]; totalSlides: number; wordGuide: string } {
  const slidePerMin = s.duration <= 5 ? 1.5 : s.duration <= 10 ? 1.2 : 1
  const totalSlides = Math.round(s.duration * slidePerMin)
  const wordsPerMin = s.audience === 'specialist' ? 150 : 120
  const wordGuide = `約${s.duration * wordsPerMin}字（${wordsPerMin}字/分 × ${s.duration}分）`

  const audienceNote = s.audience === 'specialist' ? '専門用語OK、エビデンスレベルを明示'
    : s.audience === 'resident' ? '基本的な略語は使用可、背景を簡潔に説明'
    : s.audience === 'student' ? '略語は初出時にフルスペル、基礎知識の補足を入れる'
    : '専門用語は最小限に、重要な略語は注釈'

  let sections: TemplateSection[] = []

  switch (s.type) {
    case 'conference':
      sections = [
        { title: 'タイトルスライド', bullets: ['演題名', '発表者名・所属・共同演者', '利益相反（COI）の開示'], timeGuide: '〜30秒' },
        { title: '背景・目的', bullets: ['臨床的背景（なぜこの研究/報告が重要か）', '先行研究の概要と限界', '研究目的（クリアに1-2文で）'], timeGuide: `〜${Math.round(s.duration * 0.15)}分`, slideNote: 'スライド2-3枚' },
        { title: '方法', bullets: ['研究デザイン（RCT/コホート/症例報告等）', '対象患者・選択基準・除外基準', '主要評価項目(primary endpoint)', '統計解析方法'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '結果', bullets: ['患者フローチャート（CONSORT図等）', '主要結果（図表で示す）', '副次的結果', '安全性・有害事象'], timeGuide: `〜${Math.round(s.duration * 0.3)}分`, slideNote: '結果は図表メイン。文字は最小限に' },
        { title: '考察', bullets: ['結果の解釈と臨床的意義', '先行研究との比較', '研究の限界（Limitations）', '今後の展望'], timeGuide: `〜${Math.round(s.duration * 0.2)}分` },
        { title: '結論', bullets: ['主要な結論（1-3点）', 'Clinical implications'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
        { title: '参考文献', bullets: ['引用文献リスト'], timeGuide: '表示のみ' },
      ]
      break

    case 'consultation':
      sections = [
        { title: 'コンサルテーション概要', bullets: ['依頼元（自科名）', '依頼先（コンサル先科名）', '依頼理由（具体的に1-2文）'], timeGuide: '〜30秒' },
        { title: '患者情報', bullets: ['年齢・性別・入院日・病棟', '主病名・入院理由', '関連する既往歴・内服薬'], timeGuide: '〜1分' },
        { title: '現在の問題点', bullets: ['コンサルの具体的な質問（明確に）', '関連する検査結果（バイタル/血液/画像）', '経過・これまでの対応'], timeGuide: '〜2分' },
        { title: '依頼事項', bullets: ['診断の確認/治療方針の相談', '手技/処置の依頼', '具体的に何をしてほしいか'], timeGuide: '〜30秒' },
      ]
      break

    case 'study-group':
      sections = [
        { title: 'タイトル・論文情報', bullets: ['論文タイトル', '著者・雑誌・出版年', 'Impact Factor・引用数'], timeGuide: '〜30秒' },
        { title: 'Clinical Question', bullets: ['PICO形式で整理', 'P(患者): 対象集団', 'I(介入): 何をしたか', 'C(対照): 何と比較したか', 'O(アウトカム): 何を測定したか'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
        { title: '研究デザイン・方法', bullets: ['研究デザイン（RCT/メタ解析等）', '組み入れ基準・除外基準', 'ランダム化・盲検化の方法', '主要/副次評価項目', 'サンプルサイズ計算'], timeGuide: `〜${Math.round(s.duration * 0.15)}分` },
        { title: '結果', bullets: ['主要結果（Table/Figureを引用）', '副次的結果', 'サブグループ解析', 'NNT/NNH（計算可能なら）'], timeGuide: `〜${Math.round(s.duration * 0.25)}分` },
        { title: '批判的吟味', bullets: ['内的妥当性: バイアスのリスク（選択/情報/交絡）', '外的妥当性: 日本の臨床に適用可能か', '統計的問題点', 'エビデンスレベルの評価'], timeGuide: `〜${Math.round(s.duration * 0.25)}分` },
        { title: 'Clinical Bottom Line', bullets: ['この論文から何を学ぶか', '明日からの診療にどう活かすか', '残された疑問・今後の研究課題'], timeGuide: `〜${Math.round(s.duration * 0.1)}分` },
      ]
      break
  }

  const title = s.topic || TYPES.find(t => t.id === s.type)?.label || 'プレゼンテーション'

  return { title, sections, totalSlides, wordGuide }
}

// ═══════════════════════════════════════
export default function PresenterApp() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'settings' | 'result'>('settings')
  const [settings, setSettings] = useState<Settings>({
    type: 'conference', audience: 'resident', duration: 7, format: 'slide',
    topicSource: 'case', topic: '',
    karteText: '', karteConsent: false,
    paperQuery: '', themeText: '',
    slideCount: undefined, abstractChars: undefined,
  })
  const [copied, setCopied] = useState(false)

  // URL params からプリフィル（論文フィードからの遷移）
  useEffect(() => {
    const typeParam = searchParams.get('type') as PresentationType | null
    const topicParam = searchParams.get('topic')
    if (typeParam && TYPES.some(t => t.id === typeParam)) {
      const topic = topicParam || ''
      setSettings(prev => ({
        ...prev,
        type: typeParam,
        ...(topic ? { topic, themeText: topic } : {}),
        ...(typeParam === 'study-group' ? { duration: 10, topicSource: 'paper' as TopicSource } : {}),
      }))
    }
  }, [searchParams])

  const template = useMemo(() => generateTemplate(settings), [settings])

  const handleGenerate = useCallback(() => {
    setStep('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // AIプロンプト生成
  const generatePrompt = useCallback(() => {
    const formatLabel = FORMATS.find(f => f.id === settings.format)?.label || 'スライド'
    const audienceLabel = AUDIENCES.find(a => a.id === settings.audience)?.label || '研修医'
    const typeLabel = TYPES.find(t => t.id === settings.type)?.label || '学会発表'
    const slideInfo = settings.slideCount ? `${settings.slideCount}枚` : `${template.totalSlides}枚目安`
    const charInfo = settings.abstractChars ? `${settings.abstractChars}字以内` : template.wordGuide

    let topicBlock = ''
    if (settings.topicSource === 'case' && settings.karteText) {
      topicBlock = `\n【カルテ情報（匿名化処理済み）】\n${settings.karteText}\n`
    } else if (settings.topicSource === 'paper' && settings.paperQuery) {
      topicBlock = `\n【発表する論文】\n${settings.paperQuery}\nまずこの論文のフルテキストを検索・取得してください。取得できない場合は私にPDFの貼り付けを求めてください。\n`
    } else if (settings.topicSource === 'theme' && settings.themeText) {
      topicBlock = `\n【テーマ】\n${settings.themeText}\nこのテーマに関する最新のエビデンス（RCT、メタ解析、ガイドライン）を検索し、根拠に基づいた発表資料を構成してください。フルテキストが必要な場合は私に確認してください。\n`
    }

    // 日本の学会発表ベストプラクティスを反映したプロンプト（専門書の知見統合）
    const prompt = `あなたは日本の医学学会での発表指導経験が20年以上ある教授です。以下の条件で${formatLabel}の発表資料を作成してください。

■ 基本設定
・発表タイプ: ${typeLabel}
・対象者: ${audienceLabel}
・発表時間: ${settings.duration}分
・出力形式: ${formatLabel}${settings.format === 'slide' || settings.format === 'a4-handout' ? `（${slideInfo}）` : ''}${settings.format === 'abstract-doc' ? `（${charInfo}）` : ''}
${topicBlock}
■ 構成ガイドライン
${template.sections.map(s => `【${s.title}】${s.timeGuide ? `（${s.timeGuide}）` : ''}\n${s.bullets.map(b => `  ・${b}`).join('\n')}`).join('\n\n')}

■ スライド・ポスター作成の鉄則（日本の医学学会の専門書に基づく）

=== 1. 「読ませる」のではなく「見てもらう」 ===
・聴衆は3行以上の文章を読む負担を嫌う。文章ではなく図表、特に「図」を使うこと
・スライド上の文章は読んでいる間に次のスライドに移ってしまう
・箇条書きは最大4-5行まで。それ以上は図表化すること

=== 2. 図表のデザイン原則 ===
【グラフの選び方】
・「差」を示す → 棒グラフ
・「割合」を示す → 円グラフ（項目3つまで。それ以上は「その他」にまとめる）
・「変化」を示す → 折れ線グラフ
・群別の「差」→ 積み上げ棒グラフ
・「差」と「割合」を同時に → 100%積み上げ棒グラフ
・項目数が多い → 横棒グラフに切り替え

【棒グラフのテクニック】
・目盛線を消す（Delete）
・強調したい数値のみデータラベルで表示（全数値は載せない）
・凡例はグラフの中に入れる（外に出さない）
・大小を示したい場合は項目を大小順に並べる
・強調したいバーだけ色を変え、他はグレーにする

【円グラフのテクニック】
・凡例は円グラフの中に入れる（入りきらない場合は短い引き出し線）
・グラフ間を白い太線で区切る
・中央に白い円を入れるとすっきり（ドーナツグラフ風）
・n数を中央に表示

【折れ線グラフのテクニック】
・数値の大きさが異なる系列は第2軸（右軸）を使う
・軸の数値を少なくし、適度な幅を持たせる
・目盛線は消す
・凡例はグラフの上または横に配置
・マーカーを□△○など変えて色以外でも区別
・解釈を矢印や吹き出しで示してもよい

【絶対にやってはいけないこと】
・3Dグラフは禁止（割合が歪んで見える）
・縦軸の省略や間隔操作（ダマシのテクニック）
・事実を捻じ曲げる「強調」は許されない

=== 3. 矢印・枠線の使い方 ===
・矢印や枠線は「脇役」。目立ちすぎてはいけない
・避けるべき: 赤などの警告色、原色、立体化、影付き
・推奨: グレーの線（2.25pt以上）で控えめに
・X線など黒背景の画像には黄色の点線（やむを得ず）
・聴衆に見てほしいのは矢印ではなく「内容」

=== 4. 色の設計 ===
・色は本文+強調で3色以内
・白背景の場合:
  メイン=黒、強調1=朱(RGB:255,75,0)、強調2=茶(RGB:128,64,0)
  補助=オレンジ(RGB:246,170,0)、青(RGB:65,129,208)
・灰背景(RGB:242,242,242)の場合: 白背景と同じ強調色でOK
・青背景の場合: メイン=白、強調=オレンジが最適
・黒背景の場合: メイン=白、強調=オレンジ、空色(RGB:191,228,255)
  ※X線画像のスライドは黒背景にすると見やすい
・淡い色はプロジェクターでは見えにくくなる。薄すぎる色は控える

【カラーユニバーサルデザイン】
・赤は使わず朱色(RGB:255,75,0)にする（色覚異常対応）
・赤と緑、赤と黒、白と黄色の組み合わせは避ける
・グレースケールにしても判別できるデザインにする
・色だけでなく形状（□△○）やパターンでも区別する

=== 5. フォントと文字サイズ ===
・推奨フォント: メイリオ（和文）+ Segoe UI（英数字）
  ※どちらもWindows 7以降で使用可能
・ユニバーサルデザインフォント推奨: BIZ UDPゴシック, UDデジタル教科書体
・本文: メイリオ24pt以上（中年以上の聴衆でも読める）
・タイトル: 28pt以上
・補足情報（引用文献等）: 14-18pt
・太古のフォント（MS/MS Pゴシック）は可読性が低いので避ける
・明朝体やTimes New Romanは論文向きで学会発表には不向き（セリフ体は遠くから見にくい）
・ポップ体、行書体、游ゴシック（線が細い）は不適
・フォント埋め込み: 「ファイル→保存オプション→フォントを埋め込む」で互換性確保

=== 6. 強調のテクニック ===
・使ってよい強調: 太字(Bold)、強調色、120%程度のサイズアップ、アンダーライン、囲み
・使ってはいけない: ワードアート、影付き、日本語の斜体
・数値の強調は単位より1-2段階サイズアップ（やりすぎはスーパーのチラシになる）
・菌名イタリックは英語フォントで（日本語斜体は読みにくい）

=== 7. レイアウトと表示 ===
・重要なメッセージはスライドの上部に（下端は聴衆の頭で隠れることがある）
・スライドの端は少し空ける（プロジェクターで切れることがある）
・WEB開催の場合、画面下端はシークバーで隠れるので注意
・1スライドは最低15秒かけて表示（連続で数秒切り替えは聴衆がついてこられない）
・1スライド1メッセージ（One Slide, One Message）

${settings.format === 'poster' ? `
=== ポスター固有の作法 ===
・サイズ: 縦180cm×横90cmが標準（学会指定に従う）
・流れ: 上から下、左から右（Z字型は避ける）
・タイトル: 40pt以上、著者名: 24pt以上、本文: 20pt以上（1.5m離れて読める）
・図表はポスターの50%以上に
・結論ボックスは目立つ色で囲む
・印刷物とモニターで色が異なる（CMYK vs RGB）ので、印刷前にカラー確認
` : ''}
${settings.format === 'abstract-doc' ? `
=== 抄録固有の作法 ===
・構造化抄録（背景/目的/方法/結果/結論）
・文字数制限を厳守（${charInfo}）
・略語は初出時にフルスペル
・統計結果はp値と95%CIを記載
・結論は結果から論理的に導かれるものに限る
` : ''}
=== 8. コンテンツの質 ===
・データすべてを盛り込まない。重要なエッセンスのみ。残りは質疑応答や論文化に
・ビジーで見えないスライドは意味がない。「ビジーで申し訳ありません」は禁句
・検査所見の羅列は禁止。必ず表にする
・数値は表で右揃え。縦罫線を消し、背景色で行を区別
・結語は1つ。1回の発表で言えることは1つだけ
・すべてのスライドは結語のために存在する。結語に関係ないスライドは削る
・結語のNG: 「珍しい症例を経験した」で終わる、条件なしに「鑑別に挙げるべき」、「と思われる」、3段落以上
・1スライドの表示は最低15秒

=== 9. 文章の書き方（医学界の慣例） ===
・現病歴: 患者さんが主語（手術した→手術された）、過去形
・経過: 医療者が主語（手術された→手術した）
・「にて」「認めた」の繰り返しを避ける（例:「近医にてCTにて」→「近医のCTで」）
・「となった」は他人事に聞こえるので避ける
・他科への言及は不要（「外科で手術された」→「手術した」）
・体言止めは許容されるが、4文字超の連結は避ける
・冗長表現を縮める: 「することができる」→「できる」、「であると考えられる」→「である」
・同じ言い回しを繰り返さない
・現病歴から除くもの: 来院手段、日付（季節性でなければ）、前医の病院名、住所
・現症はメリハリ: 陰性所見に意味があるものは記載、それ以外は「異常なし」でまとめる
・句読点: 発表内で統一（，．または、。）

=== 10. 記載ルール ===
・薬剤名は一般名（商品名はカッコで補足のみ）
・菌名はイタリック体、頭文字は大文字（例: *Pseudomonas aeruginosa*）
・数値と単位の間に半角スペース（例: 30 mg）、ただし℃は例外
・桁数が多い場合は単位を調整（300000/μL → 30.0×10⁴/μL）
・英数字は必ず半角。全角英数字は使わない
・略語は発表内で統一。初出はフルスペル
・改行で単語や文節を切らない
・参考文献はVancouver形式。学会では短縮形で内容の直後に配置
・引用と転載を区別。著作権法の引用条件を遵守

=== 11. 削れるもの（積極的に削る） ===
・「ご清聴ありがとうございました」スライド → 最後は結語にする
・医局のロゴマーク → 視線を奪う
・目次/レジュメスライド → 発表時間が短いため不要
・ページ数 → 質疑応答で戻れないので不要
・謝辞 → 学会発表ではスペース/時間がない

=== 12. COI・倫理 ===
・COI開示スライドは必ず入れる（なければ「開示すべきCOIはありません」）
・症例報告: 匿名化（氏名・生年月日・住所・患者番号を消去、顔写真は目にマスキング）
・稀な疾患や顔写真で特定可能な場合は本人同意が必要
・数例の症例報告で遺伝子解析なしなら倫理審査不要

=== 13. 発表者・著者の記載 ===
・発表に寄与した順、同等なら立場が下の順
・ghost authorship（関与したのに載せない）とgift authorship（関与していないのに載せる）はどちらも禁止
・施設が別の場合は上付き番号で区別

・日本語で出力してください

■ 出力形式
${settings.format === 'slide' ? `スライドごとに以下の形式で出力:
【スライドN: タイトル】
本文（箇条書き。図表の指示を含む）
---ノート---
話す内容の原稿（自然な話し言葉で。時間目安付き）
---図表指示---
このスライドで作成すべき図表の詳細指示（グラフの種類、軸、色、強調ポイント）` : settings.format === 'poster' ? 'ポスターのセクションごとに本文+図表指示を出力。' : settings.format === 'abstract-doc' ? `構造化抄録を${charInfo}で出力。` : settings.format === 'text' ? '発表原稿をそのまま出力（時間配分付き）。' : 'A4印刷用にセクション分けして出力。'}`

    return prompt
  }, [template, settings])

  const handleCopy = useCallback(() => {
    const prompt = generatePrompt()
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [generatePrompt])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // ── 設定画面 ──
  if (step === 'settings') {
    return (
      <>
        <Header />
        <div className="space-y-3">
          {/* 発表タイプ */}
          <Section title="1. 発表タイプ">
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => updateSetting('type', t.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    settings.type === t.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                  }`}><span>{t.icon}</span>{t.label}</button>
              ))}
            </div>
          </Section>

          {/* 対象者 + 発表時間（横並び） */}
          <div className="grid grid-cols-2 gap-3">
            <Section title="2. 対象者">
              <div className="flex gap-1.5 flex-wrap">
                {AUDIENCES.map(a => (
                  <button key={a.id} onClick={() => updateSetting('audience', a.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      settings.audience === a.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                    }`}>{a.label}</button>
                ))}
              </div>
            </Section>

            <Section title="3. 発表時間">
              <div className="flex gap-1.5 flex-wrap">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => updateSetting('duration', d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      settings.duration === d ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                    }`}>{d}分</button>
                ))}
              </div>
            </Section>
          </div>

          {/* 出力形式 */}
          <Section title="4. 出力形式">
            <div className="flex gap-2 flex-wrap">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => updateSetting('format', f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    settings.format === f.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                  }`}><span>{f.icon}</span>{f.label}</button>
              ))}
            </div>
          </Section>

          {/* 出力オプション（枚数/文字数） */}
          {(settings.format === 'slide' || settings.format === 'a4-handout') && (
            <Section title="5. 枚数の目安">
              <div className="flex gap-2 flex-wrap">
                {[3,5,8,10,15,20].map(n => (
                  <button key={n} onClick={() => updateSetting('slideCount', n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${settings.slideCount === n ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'}`}>
                    {n}枚
                  </button>
                ))}
              </div>
            </Section>
          )}
          {settings.format === 'abstract-doc' && (
            <Section title="5. 抄録文字数">
              <div className="flex gap-2 flex-wrap">
                {[200,400,600,800,1200].map(n => (
                  <button key={n} onClick={() => updateSetting('abstractChars', n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${settings.abstractChars === n ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'}`}>
                    {n}字
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* トピックの決め方（3分岐） */}
          <Section title="6. トピックの決め方">
            <div className="flex gap-2 flex-wrap mb-3">
              {TOPIC_SOURCES.map(ts => (
                <button key={ts.id} onClick={() => updateSetting('topicSource', ts.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    settings.topicSource === ts.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                  }`}><span>{ts.icon}</span>{ts.label}</button>
              ))}
            </div>

            {/* 症例: カルテ入力 */}
            {settings.topicSource === 'case' && (
              <div className="space-y-2">
                <textarea
                  value={settings.karteText}
                  onChange={e => updateSetting('karteText', e.target.value)}
                  placeholder="カルテ情報を貼り付け（年齢・性別・主訴・現病歴・検査結果・治療経過など）"
                  rows={6}
                  className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all resize-y"
                />
                <label className="flex items-start gap-2 text-[11px] text-muted bg-wnl border border-wnb rounded-lg p-2.5">
                  <input type="checkbox" checked={settings.karteConsent} onChange={e => updateSetting('karteConsent', e.target.checked)}
                    className="mt-0.5 accent-green-700" />
                  <span>
                    患者同意取得済み・施設の倫理基準を満たしている・個人情報は非匿名化処理済みであることを確認しました。
                    データはブラウザ上でのみ使用され、サーバーに保存されません。
                  </span>
                </label>
              </div>
            )}

            {/* 論文: PMID/DOI入力 */}
            {settings.topicSource === 'paper' && (
              <div className="space-y-2">
                <input type="text" value={settings.paperQuery}
                  onChange={e => updateSetting('paperQuery', e.target.value)}
                  placeholder="PMID（例: 38157600）、DOI、または論文タイトルを入力"
                  className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all" />
                <p className="text-[10px] text-muted">AIが論文を検索・取得します。フルテキストが取得できない場合はPDFの貼り付けを求められます。</p>
              </div>
            )}

            {/* テーマ: 自由入力 */}
            {settings.topicSource === 'theme' && (
              <div className="space-y-2">
                <input type="text" value={settings.themeText}
                  onChange={e => updateSetting('themeText', e.target.value)}
                  placeholder="例: SGLT2阻害薬の心不全への効果、抗菌薬の選び方"
                  className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all" />
                <p className="text-[10px] text-muted">AIがエビデンスを検索して発表資料を構成します。</p>
              </div>
            )}
          </Section>

          {/* 生成ボタン — sticky */}
          <div className="sticky bottom-16 md:bottom-0 z-10 pt-2 pb-1" style={{ background: 'linear-gradient(transparent, var(--bg) 8px)' }}>
            <GlowButton fullWidth radius={12}>
              <button onClick={handleGenerate}
                disabled={settings.topicSource === 'case' && (!settings.karteText || !settings.karteConsent)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: MC }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                プロンプトを生成
              </button>
            </GlowButton>
          </div>

          {/* PRO teaser */}
          <ProTeaser />
        </div>
        <PresenterTutorial />
      </>
    )
  }

  // ── 結果画面 ──
  return (
    <>
      <Header />
      <div className="space-y-4">
        {/* 戻る + コピー */}
        <div className="flex items-center justify-between">
          <button onClick={() => setStep('settings')} className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            設定に戻る
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
            style={{ background: MC }}>
            {copied ? (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>コピー済み</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>全文コピー</>
            )}
          </button>
        </div>

        {/* AIで開くボタン */}
        <div className="flex gap-2">
          <a href={`https://chat.openai.com/?q=${encodeURIComponent(generatePrompt().slice(0, 2000))}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border border-br hover:border-ac/30 transition-all text-tx">
            ChatGPT
          </a>
          <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border border-br hover:border-ac/30 transition-all text-tx">
            Claude
          </a>
          <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border border-br hover:border-ac/30 transition-all text-tx">
            Gemini
          </a>
        </div>
        <p className="text-[9px] text-muted text-center">プロンプトをコピーしてAIに貼り付けてください</p>

        {/* サマリー */}
        <div className="bg-s0 border border-br rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">{TYPES.find(t => t.id === settings.type)?.icon}</span>
            <div>
              <p className="text-base font-bold text-tx">{template.title}</p>
              <p className="text-[11px] text-muted">
                {AUDIENCES.find(a => a.id === settings.audience)?.label}向け · {settings.duration}分 · {FORMATS.find(f => f.id === settings.format)?.label}
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-[11px] mt-2">
            <span className="px-2 py-1 rounded-lg" style={{ background: MCL, color: MC }}>スライド {template.totalSlides}枚目安</span>
            <span className="px-2 py-1 rounded-lg" style={{ background: MCL, color: MC }}>文字数 {template.wordGuide}</span>
          </div>
        </div>

        {/* セクション */}
        {template.sections.map((sec, i) => (
          <div key={i} className="bg-s0 border border-br rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: MC }}>{i + 1}</span>
                <div>
                  <h3 className="text-sm font-bold text-tx">{sec.title}</h3>
                  {sec.subtitle && <p className="text-[10px] text-muted">{sec.subtitle}</p>}
                </div>
              </div>
              {sec.timeGuide && (
                <span className="text-[10px] text-muted bg-s1 px-2 py-0.5 rounded">{sec.timeGuide}</span>
              )}
            </div>
            <ul className="space-y-1 mt-2">
              {sec.bullets.map((b, j) => (
                <li key={j} className="text-xs text-tx/80 leading-relaxed flex gap-2">
                  <span className="text-ac flex-shrink-0 mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {sec.slideNote && (
              <p className="text-[10px] text-muted mt-2 italic">💡 {sec.slideNote}</p>
            )}
          </div>
        ))}

        {/* プレゼンのコツ */}
        <div className="bg-s1 border border-br rounded-xl p-4">
          <h3 className="text-sm font-bold text-tx mb-2 flex items-center gap-1.5">
            <span>🎯</span>プレゼンのコツ
          </h3>
          <ul className="space-y-1.5 text-xs text-muted">
            <li className="flex gap-2"><span className="text-ac">•</span>1スライド = 1メッセージ。文字は最小限に</li>
            <li className="flex gap-2"><span className="text-ac">•</span>図・表・画像を活用。テキストの羅列を避ける</li>
            <li className="flex gap-2"><span className="text-ac">•</span>フォントサイズ: タイトル28pt以上、本文20pt以上</li>
            <li className="flex gap-2"><span className="text-ac">•</span>配色: 3色以内。背景は白 or 薄い色</li>
            <li className="flex gap-2"><span className="text-ac">•</span>発表練習: 時間を計って最低3回リハーサル</li>
            <li className="flex gap-2"><span className="text-ac">•</span>質疑応答: 想定質問を3-5個準備しておく</li>
          </ul>
        </div>

        {/* PRO teaser */}
        <ProTeaser />
      </div>
    </>
  )
}

// ── 共通パーツ ──
function Header() {
  return (
    <AppHeader
      title="プレゼン資料生成"
      subtitle="タイプ・対象者・時間を設定 → 構成テンプレートを生成"
      badge="PRO"
      favoriteSlug="app-presenter"
      favoriteHref="/presenter"
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-4">
      <p className="text-xs font-bold text-tx mb-3">{title}</p>
      {children}
    </div>
  )
}

function ProTeaser() {
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">✨</span>
        <p className="text-sm font-bold text-tx">Coming Soon — AI生成機能</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>
      </div>
      <div className="space-y-2 relative">
        {['トピックを入力するだけでAIが原稿を自動生成', 'スライド（PPTX）のダウンロード', '論文ブックマークからの自動インポート', 'ポスター/抄録のPDF出力'].map((item, i) => (
          <div key={i} className={`flex items-center gap-2 py-2 px-3 rounded-lg bg-s1 ${i > 0 ? 'select-none' : ''}`}>
            <span className="text-xs text-muted">🔒</span>
            <p className="text-xs text-muted">{item}</p>
          </div>
        ))}
        <div className="absolute inset-0 top-10 backdrop-blur-sm bg-s0/70 rounded-lg flex items-center justify-center">
          <p className="text-xs font-medium" style={{ color: MC }}>開発中 — お楽しみに</p>
        </div>
      </div>
    </div>
  )
}
