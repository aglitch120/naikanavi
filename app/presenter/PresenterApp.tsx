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

■ スライド・ポスター作成の鉄則

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

=== 14. デザインの4原則（CRAP） ===
・整列（Alignment）: テキスト・画像・図表の左端や中央を揃える。グリッド線を活用
・反復（Repetition）: フォント・色・レイアウトをスライド間で統一。テンプレートを使い回す
・近接（Proximity）: 関連する要素を近づける。画像と説明文は必ず隣接させる
・コントラスト（Contrast）: 強調部分とそうでない部分を明確に区別。中途半端な差は避ける

=== 15. 考察のデザイン ===
・考察は箇条書きを避ける。表か図解（フローチャート、比較表）にする
・考察のネタ: 時系列で分岐点を振り返る。「なぜこの検査を選んだか」「なぜこの治療を選んだか」
・結語は1段落、3-5行。「珍しい症例を経験した」で終わらない
・結語に向けて話が一直線になっているか、各スライドの役割を見直す

=== 16. リハーサルと仕上げ ===
・スクリーンに投影して実際の見え方を確認（プロジェクターと画面で色が変わる）
・時間を計って最低3回リハーサル。録画して自分で見直す
・同僚や「症例を知らない第3者」にフィードバックをもらう
・想定質問を3-5個準備しておく
・誤字脱字チェック: Ctrl+F で句読点の統一、全角英数字の確認
・最後の仕上げ: グリッド線でオブジェクト位置を確認

・日本語で出力してください

■ 出力形式
${settings.format === 'slide' ? `スライドごとに以下の形式で出力:
【スライドN: タイトル】
本文（箇条書き。図表の指示を含む）
---ノート---
話す内容の原稿（自然な話し言葉で。時間目安付き）
---図表指示---
このスライドで作成すべき図表の詳細指示（グラフの種類、軸、色、強調ポイント）` : settings.format === 'poster' ? 'ポスターのセクションごとに本文+図表指示を出力。' : settings.format === 'abstract-doc' ? `構造化抄録を${charInfo}で出力。IMRAD方式（Introduction/Methods/Results/Discussion）またはHaynes 8項目（目的/研究デザイン/セッティング/対象/介入/アウトカム/結果/結論）に準拠。Take-home Messageは1つに絞る。` : settings.format === 'text' ? '発表原稿をそのまま出力（時間配分付き）。' : 'A4印刷用にセクション分けして出力。'}`

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

  // ── 1ページ完結UI（病歴要約ジェネレーター風） ──
  return (
    <>
      <Header />
      <div className="space-y-4">
        {/* ═══ Step 1: 設定 ═══ */}
        <Section title={<><span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2" style={{ background: MC }}>1</span>発表の設定</>}>
          {/* 発表タイプ */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => updateSetting('type', t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                  settings.type === t.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                }`}><span>{t.icon}</span>{t.label}</button>
            ))}
          </div>
          {/* 対象者 + 時間 + 形式 を横並び */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <p className="text-[10px] text-muted mb-1">対象者</p>
              <div className="flex gap-1 flex-wrap">
                {AUDIENCES.map(a => (
                  <button key={a.id} onClick={() => updateSetting('audience', a.id)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                      settings.audience === a.id ? 'bg-ac text-white border-ac' : 'border-br text-muted'
                    }`}>{a.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted mb-1">発表時間</p>
              <div className="flex gap-1 flex-wrap">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => updateSetting('duration', d)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                      settings.duration === d ? 'bg-ac text-white border-ac' : 'border-br text-muted'
                    }`}>{d}分</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted mb-1">出力形式</p>
              <div className="flex gap-1 flex-wrap">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => updateSetting('format', f.id)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                      settings.format === f.id ? 'bg-ac text-white border-ac' : 'border-br text-muted'
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
          {/* 枚数/文字数（該当時のみ） */}
          {(settings.format === 'slide' || settings.format === 'a4-handout') && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-muted">枚数:</p>
              {[3,5,8,10,15,20].map(n => (
                <button key={n} onClick={() => updateSetting('slideCount', n)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${settings.slideCount === n ? 'bg-ac text-white border-ac' : 'border-br text-muted'}`}>{n}</button>
              ))}
            </div>
          )}
          {settings.format === 'abstract-doc' && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-muted">文字数:</p>
              {[200,400,600,800,1200].map(n => (
                <button key={n} onClick={() => updateSetting('abstractChars', n)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${settings.abstractChars === n ? 'bg-ac text-white border-ac' : 'border-br text-muted'}`}>{n}字</button>
              ))}
            </div>
          )}
        </Section>

        {/* ═══ Step 2: トピック入力 ═══ */}
        <Section title={<><span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2" style={{ background: MC }}>2</span>トピックを入力</>}>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {TOPIC_SOURCES.map(ts => (
              <button key={ts.id} onClick={() => updateSetting('topicSource', ts.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center ${
                  settings.topicSource === ts.id ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'
                }`}>{ts.icon} {ts.label}</button>
            ))}
          </div>

          {settings.topicSource === 'case' && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-[11px] text-muted bg-wnl border border-wnb rounded-lg p-2.5">
                <input type="checkbox" checked={settings.karteConsent} onChange={e => updateSetting('karteConsent', e.target.checked)}
                  className="mt-0.5 accent-green-700" />
                <span>匿名化処理済み・患者同意取得済み・施設基準を満たしていることを確認しました。</span>
              </label>
              {settings.karteConsent ? (
                <textarea value={settings.karteText} onChange={e => updateSetting('karteText', e.target.value)}
                  placeholder="カルテ情報を貼り付け（主訴・現病歴・検査結果・治療経過など）"
                  rows={5} className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac outline-none transition-all resize-y" />
              ) : (
                <div className="bg-s1 rounded-lg p-4 text-center text-xs text-muted">上のチェックを入れると入力欄が表示されます</div>
              )}
              <p className="text-[9px] text-muted">※ データはサーバーに送信されません。ページを閉じると消去されます。</p>
            </div>
          )}
          {settings.topicSource === 'paper' && (
            <div className="space-y-2">
              <input type="text" value={settings.paperQuery} onChange={e => updateSetting('paperQuery', e.target.value)}
                placeholder="PMID（例: 38157600）、DOI、または論文タイトル"
                className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac outline-none transition-all" />
              <p className="text-[9px] text-muted">AIが論文を検索します。フルテキスト取得不可の場合はPDF貼り付けを求められます。</p>
            </div>
          )}
          {settings.topicSource === 'theme' && (
            <div className="space-y-2">
              <input type="text" value={settings.themeText} onChange={e => updateSetting('themeText', e.target.value)}
                placeholder="例: SGLT2阻害薬の心不全への効果"
                className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac outline-none transition-all" />
              <p className="text-[9px] text-muted">AIがエビデンスを検索して発表資料を構成します。</p>
            </div>
          )}
        </Section>

        {/* ═══ Step 3: プロンプトをコピーしてAIに貼り付け ═══ */}
        <Section title={<><span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2" style={{ background: MC }}>3</span>プロンプトをコピーしてAIに貼り付け</>}>
          {copied ? (
            <div className="bg-acl border border-ac/20 rounded-lg p-3 text-center text-sm font-medium" style={{ color: MC }}>
              クリップボードにコピーしました。下記AIサービスを開いて貼り付けてください。
            </div>
          ) : (
            <GlowButton fullWidth radius={12}>
              <button onClick={handleCopy}
                disabled={settings.topicSource === 'case' && (!settings.karteText || !settings.karteConsent)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: MC }}>
                プロンプトをコピー
              </button>
            </GlowButton>
          )}
          {/* AIリンクボタン */}
          <div className="flex gap-2 mt-3">
            <a href="https://chat.openai.com/" target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg text-xs font-bold text-center text-white" style={{ background: '#10A37F' }}>ChatGPT</a>
            <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg text-xs font-bold text-center text-white" style={{ background: '#D4A574' }}>Claude</a>
            <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg text-xs font-bold text-center text-white" style={{ background: '#4285F4' }}>Gemini</a>
          </div>
          <p className="text-[9px] text-muted text-center mt-1">※ iworはプロンプト（書式指示文）を生成するのみです。外部AIでのデータ匿名化・施設規則遵守はユーザーの責任です。</p>
        </Section>

        {/* 技術仕様 */}
        <div className="bg-s0 border border-br rounded-xl p-3 text-[10px] text-muted space-y-1">
          <p className="font-bold text-tx">技術仕様</p>
          <p>・AI不使用: テンプレートエンジンによる機械的な文字列処理のみ</p>
          <p>・データ非保持: 入力内容はブラウザのメモリ上でのみ処理</p>
          <p>・保存なし: localStorage・Cookie等への保存は一切なし</p>
          <p>・ページを閉じると全データが消去されます</p>
        </div>
      </div>
      <PresenterTutorial />
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

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-4">
      <p className="text-xs font-bold text-tx mb-3">{title}</p>
      {children}
    </div>
  )
}

