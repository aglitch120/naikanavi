'use client'
import { useState, useCallback, useMemo } from 'react'
import { HOSPITALS, Hospital } from './hospitals-data'

const MC = '#1B4F3A'

const ALL_SPECIALTIES = ['内科','循環器内科','消化器内科','呼吸器内科','腎臓内科','内分泌・糖尿病内科','血液内科','神経内科','膠原病・リウマチ科','感染症科','腫瘍内科','外科','消化器外科','心臓血管外科','呼吸器外科','乳腺外科','小児科','産婦人科','整形外科','脳神経外科','皮膚科','眼科','耳鼻咽喉科','泌尿器科','精神科','放射線科','放射線治療科','麻酔科','救急科','総合診療科','リハビリテーション科','病理診断科','形成外科','小児外科']
const MCL = '#E8F0EC'

// ── 型 ──
interface Profile {
  name: string
  university: string
  graduationYear: string
  preferredSpecialty: string
  preferredRegions: string[]
  clubs: string
  research: string
  strengths: string
  motivation: string
}

type DocSubTab = 'emails' | 'checklist' | 'questions' | 'resume-guide'

// ── メールテンプレート ──
type TemplateId = 'visit-request' | 'visit-thanks' | 'adoption-thanks' | 'cover-letter'

interface TemplateField {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'select' | 'textarea' | 'date'
  options?: string[]
  rows?: number
}

interface Template {
  id: TemplateId
  title: string
  icon: string
  desc: string
  fields: TemplateField[]
  generate: (vals: Record<string, string>, profile: Profile) => string
}

const TEMPLATES: Template[] = [
  {
    id: 'visit-request',
    title: '見学申し込みメール',
    icon: '✉️',
    desc: '病院見学の日程調整メール',
    fields: [
      { key: 'hospitalName', label: '病院名', placeholder: '○○病院' },
      { key: 'department', label: '宛先部署', placeholder: '研修管理室 / 総務課 / 教育研修部' },
      { key: 'contactName', label: '担当者名（不明なら空欄）', placeholder: '○○様' },
      { key: 'date1', label: '第1希望日', placeholder: '', type: 'date' },
      { key: 'date2', label: '第2希望日', placeholder: '', type: 'date' },
      { key: 'date3', label: '第3希望日', placeholder: '', type: 'date' },
      { key: 'spec1', label: '見学希望科 第1希望', placeholder: '内科', type: 'select', options: ALL_SPECIALTIES },
      { key: 'spec2', label: '見学希望科 第2希望', placeholder: '救急科', type: 'select', options: ALL_SPECIALTIES },
      { key: 'spec3', label: '見学希望科 第3希望（任意）', placeholder: '', type: 'select', options: ['', ...ALL_SPECIALTIES] },
      { key: 'phone', label: '電話番号', placeholder: '090-XXXX-XXXX' },
      { key: 'email', label: 'メールアドレス', placeholder: 'example@univ.ac.jp' },
      { key: 'zip', label: '郵便番号（7桁で住所自動入力）', placeholder: '1000001' },
      { key: 'address', label: '住所', placeholder: '東京都○○区...' },
    ],
    generate: (v, p) => {
      const contact = v.contactName ? `${v.department} ${v.contactName}` : `${v.department} ご担当者 様`
      const year = p.graduationYear ? `${p.graduationYear}年卒業見込み` : ''
      const spec3Line = v.spec3 ? `\n第3希望: ${v.spec3}` : ''
      const fmtDate = (d: string) => {
        if (!d) return '○月○日（○）'
        const dt = new Date(d + 'T00:00:00')
        const dow = ['日','月','火','水','木','金','土'][dt.getDay()]
        return `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日（${dow}）`
      }
      return `件名: 病院見学のお願い（${p.university || '○○大学医学部'}${p.graduationYear ? ` ${p.graduationYear}年卒` : ''} ${p.name || '○○'}）

${v.hospitalName || '○○病院'}
${contact}

初めてメールを差し上げます。
私、${p.university || '○○大学医学部'}の${p.name || '○○'}と申します。${year ? `（${year}）` : ''}

貴院のホームページを拝見し、臨床研修・診療体制に大変魅力を感じました。
是非、見学にお伺いさせていただきたく存じます。

可能でしたら、
第1希望日: ${fmtDate(v.date1)}
第2希望日: ${fmtDate(v.date2)}
第3希望日: ${fmtDate(v.date3)}
のうち1日見学を希望したいのですが、貴院のご都合はいかがでしょうか。

また、差し支え無ければ、以下の診療科を見学する機会をいただけますよう、お願い申し上げます。
第1希望: ${v.spec1 || '○○科'}
第2希望: ${v.spec2 || '○○科'}${spec3Line}

お忙しいところお手数をおかけ致しますが、お返事をいただけますよう、よろしくお願い申し上げます。

---
${p.university || '○○大学医学部'}
${p.name || '○○ ○○'}
${v.zip ? `〒${v.zip.replace('〒', '')}` : '〒XXX-XXXX'}
${v.address || '住所'}
Tel: ${v.phone || '090-XXXX-XXXX'}
E-mail: ${v.email || 'example@univ.ac.jp'}`
    },
  },
  {
    id: 'visit-thanks',
    title: '見学お礼メール',
    icon: '🙏',
    desc: '見学後のお礼メール',
    fields: [
      { key: 'hospitalName', label: '病院名', placeholder: '○○病院' },
      { key: 'contactName', label: '担当者名', placeholder: '○○様' },
      { key: 'visitedDept', label: '見学した診療科', placeholder: '内科', type: 'select', options: ALL_SPECIALTIES },
      { key: 'impression', label: '印象に残ったこと', placeholder: '先生方の患者さんへの丁寧な説明と迅速な診療', type: 'textarea', rows: 2 },
      { key: 'specific', label: '具体的なエピソード', placeholder: '研修医の先生が救急搬送の初期対応を主体的に行っていた場面', type: 'textarea', rows: 2 },
      { key: 'phone', label: '電話番号', placeholder: '090-XXXX-XXXX' },
      { key: 'email', label: 'メールアドレス', placeholder: 'example@univ.ac.jp' },
    ],
    generate: (v, p) => `件名: 病院見学のお礼（${p.university || '○○大学医学部'} ${p.name || '○○'}）

${v.hospitalName || '○○病院'} 研修医採用担当 ${v.contactName || '○○'}様

お世話になっております。
${p.university || '○○大学医学部'}の${p.name || '○○'}です。

本日は、お忙しい中、貴院の見学をさせていただき、誠にありがとうございました。

${v.visitedDept || '○○科'}の見学では、${v.impression || '先生方の患者さんへの丁寧な説明と迅速な診療の両立に感銘を受けました'}。特に${v.specific || '具体的なエピソード'}が印象的でした。

研修制度の充実ぶりや、先輩研修医の方々の生き生きとした表情を拝見し、貴院での研修に対する意欲がさらに高まりました。

今回の見学で学んだことを活かし、より一層勉学に励んでまいります。
今後ともご指導のほど、よろしくお願い申し上げます。

---
${p.university || '○○大学医学部'} ${p.name || '○○ ○○'}
メール: ${v.email || 'example@univ.ac.jp'}
電話: ${v.phone || '090-XXXX-XXXX'}`,
  },
  {
    id: 'adoption-thanks',
    title: '採用御礼メール',
    icon: '🎉',
    desc: 'マッチング結果後の御礼',
    fields: [
      { key: 'hospitalName', label: '病院名', placeholder: '○○病院' },
      { key: 'department', label: '宛先部署', placeholder: '教育研修課' },
      { key: 'contactName', label: '担当者名', placeholder: '○○様' },
      { key: 'phone', label: '電話番号', placeholder: '090-XXXX-XXXX' },
      { key: 'email', label: 'メールアドレス', placeholder: 'example@univ.ac.jp' },
    ],
    generate: (v, p) => `件名: 【採用の御礼】${p.university || '○○大学'} 医学部 ${p.name || '○○'}

${v.hospitalName || '○○病院'} ${v.department || '○○課'}
${v.contactName || '○○ ○○'}様

いつもお世話になっております。
${p.university || '○○大学医学部'}の${p.name || '○○'}です。

マッチング結果を拝見し、ご連絡差し上げました。
この度は採用いただき、誠にありがとうございます。
光栄に存じますと同時に、身の引き締まる思いでございます。

今後控えております卒業試験・国家試験に合格し、
4月から貴院で研修が開始できますよう、
より一層学業に励んでまいります。

取り急ぎメールにてお礼申し上げます。
今後とも何卒よろしくお願い申し上げます。

---
${p.university || '○○大学医学部'} ${p.name || '○○ ○○'}
メール: ${v.email || 'example@univ.ac.jp'}
電話: ${v.phone || '090-XXXX-XXXX'}`,
  },
  {
    id: 'cover-letter',
    title: '送付状',
    icon: '📋',
    desc: '書類送付時の添え状',
    fields: [
      { key: 'hospitalName', label: '病院名', placeholder: '○○病院' },
      { key: 'department', label: '宛先部署', placeholder: '総務課 / 教育研修部' },
      { key: 'contactName', label: '担当者名（不明なら空欄）', placeholder: '○○様' },
      { key: 'documents', label: '同封書類（カンマ区切り）', placeholder: '履歴書, 成績証明書, 卒業見込証明書', type: 'textarea', rows: 2 },
      { key: 'phone', label: '電話番号', placeholder: '090-XXXX-XXXX' },
      { key: 'email', label: 'メールアドレス', placeholder: 'example@univ.ac.jp' },
      { key: 'zip', label: '郵便番号（7桁で住所自動入力）', placeholder: '1000001' },
      { key: 'address', label: '住所', placeholder: '東京都○○区...' },
    ],
    generate: (v, p) => {
      const today = new Date()
      const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
      const docs = (v.documents || '履歴書, 成績証明書').split(/[,、，]/).map(d => d.trim()).filter(Boolean)
      const contact = v.contactName ? `${v.department} ${v.contactName}` : `${v.department} ご担当者 様`
      return `${dateStr}

${v.hospitalName || '○○病院'}
${contact}

${v.zip ? `〒${v.zip.replace('〒', '')}` : '〒XXX-XXXX'} ${v.address || '住所'}
${p.university || '○○大学医学部'}
${p.name || '○○ ○○'}
Tel: ${v.phone || '090-XXXX-XXXX'}
E-mail: ${v.email || 'example@univ.ac.jp'}

━━━━━━━━━━━━━━━━━━━━
　　　　　応募書類の送付について
━━━━━━━━━━━━━━━━━━━━

拝啓　時下ますますご清祥のこととお慶び申し上げます。

貴院への応募にあたり、
下記の書類を同封いたしましたので、ご査収のほどよろしくお願い申し上げます。

　　　　　　　　　　　記

${docs.map((d, i) => `　${i + 1}. ${d}　…… 1通`).join('\n')}

　　　　　　　　　　　　　　　　　　　以上

何卒ご検討のほど、よろしくお願い申し上げます。

　　　　　　　　　　　　　　　　　　　敬具`
    },
  },
]

// ── 見学準備チェックリスト ──
interface ChecklistCategory {
  title: string
  icon: string
  items: { label: string; required?: boolean }[]
}

const VISIT_CHECKLISTS: ChecklistCategory[] = [
  {
    title: '旅行用持ち物（宿泊時）',
    icon: '🧳',
    items: [
      { label: '財布（現金・カード）', required: true },
      { label: '携帯電話', required: true },
      { label: '充電器・モバイルバッテリー', required: true },
      { label: '身分証明書', required: true },
      { label: '着替え（下着含む）', required: true },
      { label: 'パジャマ' },
      { label: '洗面用具（歯ブラシ等）' },
      { label: 'メガネ・コンタクト用品' },
      { label: '常備薬' },
      { label: '折りたたみ傘' },
    ],
  },
  {
    title: '当日の持ち物',
    icon: '👔',
    items: [
      { label: 'リクルートスーツ上下', required: true },
      { label: 'ワイシャツ・ブラウス（白）', required: true },
      { label: 'ネクタイ（派手でないもの）', required: true },
      { label: '革靴（音が出にくいもの）', required: true },
      { label: '白衣（アイロン済み）', required: true },
      { label: '聴診器', required: true },
      { label: '名札', required: true },
      { label: '病院から要求された書類', required: true },
      { label: 'リクルートバッグ（A4・自立）', required: true },
      { label: 'メモ帳（ポケットサイズ）', required: true },
      { label: '黒ボールペン', required: true },
      { label: '学生証', required: true },
      { label: 'ハンカチ・ティッシュ', required: true },
      { label: 'マスク（予備も）', required: true },
      { label: '腕時計' },
      { label: '水分（ペットボトル）' },
      { label: '昼食代' },
    ],
  },
  {
    title: '身だしなみチェック',
    icon: '✨',
    items: [
      { label: 'ネクタイの位置は正しいか', required: true },
      { label: 'シャツは出ていないか', required: true },
      { label: '靴紐は結ばれているか', required: true },
      { label: 'スーツにしわやゴミはないか', required: true },
      { label: '爪は切っているか', required: true },
      { label: '髪型は整っているか', required: true },
      { label: 'メガネは汚れていないか' },
      { label: '携帯電話の電源はOFFか', required: true },
    ],
  },
  {
    title: '交通手段・病院情報',
    icon: '🚃',
    items: [
      { label: '行きの出発時間を確認', required: true },
      { label: '乗換情報を確認', required: true },
      { label: '病院の住所・連絡先をメモ', required: true },
      { label: '担当者名を確認', required: true },
      { label: '集合時間・場所を確認', required: true },
      { label: '帰りの交通手段を確認' },
    ],
  },
]

// ── 聞くべきことリスト ──
interface QuestionCategory {
  title: string
  icon: string
  questions: string[]
}

const VISIT_QUESTIONS: QuestionCategory[] = [
  {
    title: '研修プログラム',
    icon: '📚',
    questions: [
      'ローテーションの自由度は？必修科の期間は？',
      '研修医の1日のスケジュールは？',
      '当直の頻度・体制は？（何人体制か）',
      '救急の症例数・搬送件数は？',
      '手技はどの程度経験できるか？',
      '研修医はどの程度裁量権があるか？',
    ],
  },
  {
    title: '教育・指導体制',
    icon: '👨‍⚕️',
    questions: [
      '指導医との距離感は？相談しやすいか？',
      '勉強会・カンファレンスの頻度は？',
      '研究機会はあるか？',
      'フィードバックの仕組みは？',
      '上級医は何年目が多いか？',
    ],
  },
  {
    title: '福利厚生・環境',
    icon: '🏥',
    questions: [
      '給料・ボーナスの目安は？',
      '寮・住宅手当はあるか？',
      '研修医室の設備は？',
      '学会参加の費用補助は？',
      '休暇は取りやすいか？',
      '忙しさは？QOLは？',
    ],
  },
  {
    title: 'キャリア・雰囲気',
    icon: '🔮',
    questions: [
      '研修後の進路は？（何割が残るか）',
      '診療科ごとの雰囲気の違いは？',
      '研修医同士の仲は？',
      '女性研修医へのサポート体制は？',
      'この病院を選んだ理由は？（研修医に）',
      '研修で一番成長したと感じることは？',
    ],
  },
  {
    title: 'マッチング情報',
    icon: '📊',
    questions: [
      '例年の倍率・応募者数は？',
      '試験の形式は？（面接/筆記/小論文）',
      '履歴書で重視するポイントは？',
      '面接ではどんな質問が多いか？',
      '見学は何回来るべきか？',
    ],
  },
  {
    title: '見学後のアクション',
    icon: '📝',
    questions: [
      '研修医のLINE/メール交換',
      'お礼メールの送信（当日中が理想）',
      '総合評価メモの記入',
      '次回見学の予定確認',
    ],
  },
]

// ═══════════════════════════════════════
//  メインコンポーネント
// ═══════════════════════════════════════
export default function DocumentsTab({
  profile, mode, isPro, onShowProModal,
}: {
  profile: Profile
  mode: 'matching' | 'career'
  isPro?: boolean
  onShowProModal?: () => void
}) {
  const [subTab, setSubTab] = useState<DocSubTab>('emails')

  const SUB_TABS: { id: DocSubTab; label: string; icon: string }[] = [
    { id: 'emails', label: '書類・メール', icon: '✉️' },
    { id: 'resume-guide', label: '履歴書ガイド', icon: '📝' },
    ...(mode === 'matching' ? [
      { id: 'checklist' as DocSubTab, label: '見学準備', icon: '✅' },
      { id: 'questions' as DocSubTab, label: '聞くべきこと', icon: '❓' },
    ] : []),
  ]

  return (
    <div className="space-y-4">
      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          nav, header, footer, .no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
          /* アコーディオン: 全展開して印刷 */
          .print-area [class*="border-t"] { display: block !important; }
          /* textarea: メモ欄を枠線付きで表示 */
          .print-area textarea { border: 1px solid #ccc !important; min-height: 24px !important; visibility: visible !important; }
          /* チェックボックス・スライダー */
          .print-area input[type="range"] { display: none; }
          .print-area input[type="checkbox"] { visibility: visible !important; }
          /* グリッド改ページ防止 */
          .print-area .grid { page-break-inside: avoid; }
          .print-area > div { page-break-inside: avoid; }
          /* 操作系ボタンは非表示、スコアボタンは表示 */
          .print-area button:not([data-score]) { display: none !important; }
          .print-area button[data-score] { display: block !important; pointer-events: none; }
        }
      `}</style>
      {/* サブタブ */}
      {SUB_TABS.length > 1 && (
        <div className="flex gap-1 bg-s1 rounded-xl p-1">
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                subTab === t.id ? 'bg-s0 shadow-sm' : 'text-muted hover:text-tx'
              }`}
              style={subTab === t.id ? { color: MC } : undefined}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {subTab === 'emails' && <EmailTemplates profile={profile} mode={mode} />}
      {subTab === 'resume-guide' && <ResumeGuide />}
      {subTab === 'checklist' && <VisitChecklist />}
      {subTab === 'questions' && <VisitQuestions isPro={isPro} onShowProModal={onShowProModal} />}
    </div>
  )
}

// ═══════════════════════════════════════
//  メール・書類テンプレート
// ═══════════════════════════════════════
function EmailTemplates({ profile, mode }: { profile: Profile; mode: 'matching' | 'career' }) {
  const [selectedId, setSelectedId] = useState<TemplateId | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const templates = TEMPLATES

  const selected = templates.find(t => t.id === selectedId) ?? null

  const updateField = useCallback((key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSelect = useCallback((id: TemplateId) => {
    setSelectedId(id)
    setFieldValues({})
    setCopied(false)
  }, [])

  const handleCopy = useCallback(() => {
    if (!selected) return
    const text = selected.generate(fieldValues, profile)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [selected, fieldValues, profile])

  if (!selected) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted">テンプレートを選択して、情報を入力するだけでメール・書類が完成します。</p>
        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className="bg-s0 border border-br rounded-xl p-4 text-left hover:border-ac/40 hover:shadow-sm transition-all group"
            >
              <span className="text-2xl block mb-2">{t.icon}</span>
              <p className="text-sm font-bold text-tx group-hover:text-ac transition-colors">{t.title}</p>
              <p className="text-[11px] text-muted mt-1">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const generatedText = selected.generate(fieldValues, profile)

  return (
    <div className="space-y-4">
      {/* 戻る */}
      <button
        onClick={() => setSelectedId(null)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        テンプレート一覧に戻る
      </button>

      {/* テンプレート名 */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{selected.icon}</span>
        <h3 className="text-base font-bold text-tx">{selected.title}</h3>
      </div>

      {/* プロフィール連携案内 */}
      {profile.name && (
        <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: MCL, color: MC }}>
          プロフィールの情報（{profile.name}・{profile.university}）が自動で反映されます
        </div>
      )}

      {/* PC: 左入力→右プレビュー / モバイル: 縦並び */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 入力フォーム */}
        <div className="bg-s0 border border-br rounded-xl p-4 space-y-3 lg:w-1/2 lg:flex-shrink-0">
          <p className="text-xs font-bold text-tx mb-1">情報を入力</p>
          {selected.fields.map(f => (
            <div key={f.key}>
              <label className="text-[11px] font-medium text-tx mb-1 block">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={fieldValues[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={f.rows || 2}
                  className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all resize-none"
                />
              ) : f.type === 'select' && f.options ? (
                <select
                  value={fieldValues[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
                >
                  <option value="">選択してください</option>
                  {f.options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'date' ? (
                <input
                  type="date"
                  value={fieldValues[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
                />
              ) : (
                <>
                  <input
                    type="text"
                    value={fieldValues[f.key] || ''}
                    onChange={f.key === 'zip' ? (e) => {
                      updateField(f.key, e.target.value)
                      const zip = e.target.value.replace(/[^\d]/g, '')
                      if (zip.length === 7) {
                        fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`)
                          .then(r => r.json())
                          .then(data => {
                            if (data.results?.[0]) {
                              const r = data.results[0]
                              updateField('address', `${r.address1}${r.address2}${r.address3}`)
                            }
                          })
                          .catch(() => {})
                      }
                    } : (e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    list={f.key === 'hospitalName' ? 'hospital-list' : undefined}
                    className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
                  />
                  {f.key === 'hospitalName' && (
                    <datalist id="hospital-list">
                      {HOSPITALS.slice(0, 500).map(h => <option key={h.id} value={h.name} />)}
                    </datalist>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* プレビュー */}
        <div className="bg-s0 border border-br rounded-xl overflow-hidden lg:w-1/2 lg:self-start lg:sticky lg:top-4">
          <div className="px-4 py-2.5 border-b border-br flex items-center justify-between">
            <p className="text-xs font-bold text-tx">プレビュー</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ background: MC }}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  コピー済み
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  コピー
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs text-tx leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto">
            {generatedText}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
//  見学準備チェックリスト
// ═══════════════════════════════════════
function VisitChecklist() {
  const STORAGE_KEY = 'iwor_visit_checklist'
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })

  const toggle = useCallback((key: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setChecked(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const totalItems = VISIT_CHECKLISTS.reduce((acc, cat) => acc + cat.items.length, 0)
  const checkedCount = checked.size

  return (
    <div className="space-y-4">
      {/* 進捗 */}
      <div className="bg-s0 border border-br rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-tx">準備の進捗</p>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white" style={{ background: MC }}>
              印刷
            </button>
            <p className="text-sm font-bold" style={{ color: MC }}>{checkedCount}/{totalItems}</p>
            {checkedCount > 0 && (
              <button onClick={reset} className="text-[10px] text-muted hover:text-tx underline">リセット</button>
            )}
          </div>
        </div>
        <div className="w-full h-2 bg-s1 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(checkedCount / totalItems) * 100}%`, background: MC }}
          />
        </div>
      </div>

      {/* カテゴリ */}
      {VISIT_CHECKLISTS.map((cat, ci) => (
        <div key={ci} className="bg-s0 border border-br rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-br">
            <p className="text-sm font-bold text-tx flex items-center gap-2">
              <span>{cat.icon}</span>
              {cat.title}
              <span className="text-[10px] font-normal text-muted ml-auto">
                {cat.items.filter(item => checked.has(`${ci}-${item.label}`)).length}/{cat.items.length}
              </span>
            </p>
          </div>
          <div className="divide-y divide-br/50">
            {cat.items.map((item, ii) => {
              const key = `${ci}-${item.label}`
              const isChecked = checked.has(key)
              return (
                <button
                  key={ii}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-s1/30 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isChecked ? 'border-transparent' : 'border-br'
                  }`} style={isChecked ? { background: MC } : undefined}>
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${isChecked ? 'text-muted line-through' : 'text-tx'}`}>
                    {item.label}
                    {item.required && !isChecked && (
                      <span className="text-[9px] font-bold ml-1.5 px-1 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#DC2626' }}>必須</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
//  聞くべきことリスト
// ═══════════════════════════════════════
function VisitQuestions({ isPro, onShowProModal }: { isPro?: boolean; onShowProModal?: () => void }) {
  const [openCat, setOpenCat] = useState<number | 'all'>('all')
  const STORAGE_KEY = 'iwor_visit_questions_notes'
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })

  const saveNote = useCallback((key: string, value: string) => {
    setNotes(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">見学時に確認すべきポイント。メモ欄に記録を残せます。</p>
        <button
          onClick={() => isPro ? window.print() : onShowProModal?.()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all flex-shrink-0"
          style={{ background: MC }}
        >
          📄 PDF {!isPro && '🔒'}
        </button>
      </div>
      {VISIT_QUESTIONS.map((cat, ci) => (
        <div key={ci} className="bg-s0 border border-br rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenCat(prev => prev === ci ? -1 : prev === 'all' ? ci : ci)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-s1/30 transition-colors"
          >
            <span className="text-sm font-bold text-tx flex items-center gap-2">
              <span>{cat.icon}</span>
              {cat.title}
              <span className="text-[10px] font-normal text-muted">({cat.questions.length}項目)</span>
            </span>
            <span className={`text-muted transition-transform text-sm ${openCat === ci || openCat === 'all' ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {(openCat === ci || openCat === 'all') && (
            <div className="border-t border-br divide-y divide-br/50">
              {cat.questions.map((q, qi) => {
                const key = `${ci}-${qi}`
                return (
                  <div key={qi} className="px-4 py-3">
                    <p className="text-xs font-medium text-tx mb-2 flex items-start gap-2">
                      <span className="text-muted flex-shrink-0">{qi + 1}.</span>
                      {q}
                    </p>
                    <textarea
                      value={notes[key] || ''}
                      onChange={e => saveNote(key, e.target.value)}
                      placeholder="メモを入力..."
                      rows={1}
                      className="w-full px-3 py-1.5 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all resize-none"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
//  履歴書の書き方ガイド・チェックリスト
// ═══════════════════════════════════════
const RESUME_SECTIONS: { title: string; icon: string; items: { label: string; important?: boolean }[] }[] = [
  {
    title: '基本マナー', icon: '📋',
    items: [
      { label: '提出期限を確認し、余裕をもって提出する計画を立てた', important: true },
      { label: '黒色の万年筆またはボールペンを用意した' },
      { label: '下書きを別紙で準備した' },
      { label: '清書用の履歴書を複数枚用意した（書き間違い対策）' },
      { label: '形式が指定されている場合は、指定された形式を入手した', important: true },
    ],
  },
  {
    title: '記入前の準備', icon: '🖊️',
    items: [
      { label: '印鑑を用意した（シャチハタは不可）' },
      { label: '写真を用意した（6ヶ月以内・スタジオ撮影が望ましい）', important: true },
      { label: '必要に応じて定規を用意した' },
    ],
  },
  {
    title: '記入時の注意点', icon: '✍️',
    items: [
      { label: '印鑑は最初に押した（後から押すと失敗リスク高い）', important: true },
      { label: '記入欄は8割程度埋めている', important: true },
      { label: '丁寧な字で書いている' },
      { label: '修正液は使用していない', important: true },
      { label: '日付は郵送なら投函日、持参なら持参日を記入した' },
      { label: 'ふりがな欄は指示通り（ひらがな/カタカナ）' },
      { label: '住所は都道府県名から省略せずに記入した' },
      { label: '学歴は正式名称で記入した（例: ○○高等学校）' },
      { label: '学歴・職歴欄の最後に「以上」と記入した' },
      { label: '資格は正式名称で記入した' },
      { label: '健康状態欄は「良好」と記入した' },
      { label: '本人記入欄や「その他」欄も空白にせず記入した' },
    ],
  },
  {
    title: '完成後の確認', icon: '🔍',
    items: [
      { label: '誤字脱字がないか確認した', important: true },
      { label: '印鑑がかすれていないか確認した' },
      { label: '清書した履歴書をコピーして保存した（面接対策用）', important: true },
    ],
  },
  {
    title: '写真チェックリスト', icon: '📷',
    items: [
      { label: '6ヶ月以内に撮影したもの', important: true },
      { label: 'プロが撮影（写真館やスタジオが望ましい）', important: true },
      { label: 'サイズが指定に合っている（一般的に縦4cm×横3cm）' },
      { label: 'スーツ姿・ネクタイ/ジャケット着用' },
      { label: '清潔感のある髪型' },
      { label: '自然な表情' },
      { label: '裏に大学名と氏名を記入', important: true },
      { label: 'しっかり貼り付け' },
    ],
  },
  {
    title: '封筒の書き方・送付マナー', icon: '📮',
    items: [
      { label: '白のA4サイズの封筒を使用（茶色不可）', important: true },
      { label: '宛先を略さず正確に記入' },
      { label: '部署宛ては「御中」' },
      { label: '左下に「初期研修応募書類在中」と赤字', important: true },
      { label: '裏面に差出人の住所と氏名' },
      { label: '封じ目に「〆」' },
      { label: 'クリップまたはクリアファイルでまとめ' },
      { label: '速達検討 / 郵便追跡番号を控える' },
    ],
  },
]

// ═══════════════════════════════════════
//  病院比較表
// ═══════════════════════════════════════
interface CompareCategory {
  title: string
  items: string[]
}

const COMPARE_CATEGORIES: CompareCategory[] = [
  {
    title: '診療科の強さ',
    items: [
      '内科系の症例数・多様性',
      '外科系の手術件数',
      '救急搬送件数・重症度',
      '専門科の充実度',
      '希望科の指導医数',
      '地域連携・転院体制',
      '学術的な活動（論文・学会）',
      '稀少疾患・難症例の経験',
    ],
  },
  {
    title: '良い教育研修環境',
    items: [
      'ローテーションの自由度',
      '指導医の丁寧さ・距離感',
      '研修医の裁量権',
      '手技経験の機会',
      '勉強会・カンファの頻度',
      'フィードバック体制',
      '研修医同士の仲・雰囲気',
      '専攻医への接続サポート',
      '研究・学会参加機会',
      'シミュレーション設備',
    ],
  },
  {
    title: '福利厚生',
    items: [
      '給与・ボーナスの水準',
      '当直手当・残業代',
      '住宅手当・寮の有無',
      '休暇取得のしやすさ',
      '学会参加費補助',
      '医師賠償責任保険',
      '健康診断・メンタル支援',
      '産休・育休の取りやすさ',
      '交通費支給',
      '食堂・院内環境',
    ],
  },
  {
    title: 'その他',
    items: [
      'アクセス・立地の利便性',
      'マッチング倍率・難易度',
      '病院の規模・ブランド',
      '見学時の印象・対応',
      '将来のキャリアとの整合性',
    ],
  },
]

// ── 病院検索コンポーネント ──
function HospitalSearchInput({ value, onChange, allHospitals, color }: {
  value: string; onChange: (name: string) => void
  allHospitals: { name: string; prefecture: string }[]; color: string
}) {
  const [query, setQuery] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = query.length >= 1
    ? allHospitals.filter(h => h.name.includes(query) || h.prefecture.includes(query)).slice(0, 8)
    : []

  // 重複除去（同名病院）
  const uniqueSuggestions = suggestions.filter((h, i, arr) =>
    arr.findIndex(a => a.name === h.name) === i
  )

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
        onFocus={() => setShowSuggestions(true)}
        className="w-full px-2 py-1.5 border rounded-lg bg-s0 text-xs text-tx focus:outline-none transition-all font-medium"
        style={{ borderColor: color + '66', fontSize: '16px' }}
        placeholder="病院名を検索..."
      />
      {showSuggestions && uniqueSuggestions.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-s0 border border-br rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {uniqueSuggestions.map((h, i) => (
            <button key={i} onClick={() => { setQuery(h.name); onChange(h.name); setShowSuggestions(false) }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-s1 transition-all flex justify-between">
              <span className="font-medium">{h.name}</span>
              <span className="text-muted">{h.prefecture}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function HospitalCompare({ isPro, onShowProModal }: { isPro?: boolean; onShowProModal?: () => void }) {
  const MAX_HOSPITALS = 3
  const [hospitalNames, setHospitalNames] = useState<string[]>(['', '', ''])
  const [activeHospitals, setActiveHospitals] = useState<number>(2)

  // weights[categoryIndex][itemIndex] = 1-5
  const [weights, setWeights] = useState<number[][]>(() =>
    COMPARE_CATEGORIES.map(cat => cat.items.map(() => 3))
  )
  // scores[hospitalIndex][categoryIndex][itemIndex] = 1-5
  const [scores, setScores] = useState<number[][][]>(() =>
    Array.from({ length: MAX_HOSPITALS }, () =>
      COMPARE_CATEGORIES.map(cat => cat.items.map(() => 3))
    )
  )

  const setWeight = useCallback((ci: number, ii: number, val: number) => {
    setWeights(prev => {
      const next = prev.map(row => [...row])
      next[ci][ii] = val
      return next
    })
  }, [])

  const setScore = useCallback((hi: number, ci: number, ii: number, val: number) => {
    setScores(prev => {
      const next = prev.map(catRow => catRow.map(row => [...row]))
      next[hi][ci][ii] = val
      return next
    })
  }, [])

  // weighted average for each hospital
  const totals = Array.from({ length: MAX_HOSPITALS }, (_, hi) => {
    let sumWeightedScore = 0
    let sumWeight = 0
    COMPARE_CATEGORIES.forEach((cat, ci) => {
      cat.items.forEach((_, ii) => {
        const w = weights[ci][ii]
        sumWeightedScore += w * scores[hi][ci][ii]
        sumWeight += w
      })
    })
    return sumWeight > 0 ? Math.round((sumWeightedScore / sumWeight) * 10) / 10 : 0
  })

  const maxTotal = Math.max(...totals.slice(0, activeHospitals))
  const winnerIdx = totals.slice(0, activeHospitals).indexOf(maxTotal)

  const hospitalColors = ['#1B4F3A', '#2563EB', '#D97706']

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">最大3病院を比較。重みと点数を設定して総合評価を自動計算します。</p>
        <button
          onClick={() => isPro ? window.print() : onShowProModal?.()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all flex-shrink-0"
          style={{ background: MC }}
        >
          📄 PDF {!isPro && '🔒'}
        </button>
      </div>

      {/* 病院数切り替え */}
      <div className="flex gap-2">
        {[2, 3].map(n => (
          <button
            key={n}
            onClick={() => setActiveHospitals(n)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              activeHospitals === n ? 'text-white border-transparent' : 'text-muted border-br hover:text-tx'
            }`}
            style={activeHospitals === n ? { background: MC } : undefined}
          >
            {n}病院比較
          </button>
        ))}
      </div>

      {/* 病院名検索入力 */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${activeHospitals}, 1fr)`, overflow: 'visible' }}>
        {Array.from({ length: activeHospitals }, (_, hi) => (
          <div key={hi} style={{ position: 'relative', zIndex: 30 - hi }}>
            <label className="text-[11px] font-medium text-muted block mb-1">病院{hi + 1}</label>
            <HospitalSearchInput
              value={hospitalNames[hi]}
              onChange={name => {
                const next = [...hospitalNames]
                next[hi] = name
                setHospitalNames(next)
              }}
              allHospitals={HOSPITALS.map(h => ({ name: h.name, prefecture: h.prefecture }))}
              color={hospitalColors[hi]}
            />
          </div>
        ))}
      </div>

      {/* ハードデータ比較（DBから自動取得） */}
      {(() => {
        const matchedHospitals = hospitalNames.slice(0, activeHospitals).map(name =>
          HOSPITALS.find(h => h.name === name)
        )
        const anyMatched = matchedHospitals.some(h => h)
        if (!anyMatched) return null

        const DATA_ROWS: { label: string; unit: string; key: keyof Hospital; format?: (v: any) => string; higher?: 'good' | 'bad' }[] = [
          { label: '募集定員', unit: '人', key: 'capacity' },
          { label: 'マッチ者数', unit: '人', key: 'matched' },
          { label: '空席数', unit: '人', key: 'vacancy' },
          { label: '第1希望者数', unit: '人', key: 'applicants' },
          { label: 'マッチ率', unit: '%', key: 'matchRate', higher: 'good' },
          { label: '人気度', unit: '倍', key: 'popularity', format: (v: number) => v.toFixed(1), higher: 'good' },
          { label: '3年平均マッチ率', unit: '%', key: 'avgMatchRate3y' as any, higher: 'good' },
          { label: '本命指数', unit: '', key: 'honmeiIndex' as any, format: (v: number) => v?.toFixed(2) || '—' },
        ]

        return (
          <div className="bg-s0 border border-br rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-br flex items-center justify-between">
              <p className="text-sm font-bold text-tx">マッチングデータ比較</p>
              <span className="text-[10px] text-muted">2024年度JRMP公式データ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-s1">
                  <tr>
                    <th className="px-3 py-2 text-left text-muted font-medium w-28">指標</th>
                    {matchedHospitals.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-center font-semibold" style={{ color: hospitalColors[i] }}>
                        {hospitalNames[i] || `病院${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-br">
                    <td className="px-3 py-2 text-muted">タイプ</td>
                    {matchedHospitals.map((h, i) => (
                      <td key={i} className="px-3 py-2 text-center">
                        {h ? (h.isUniversity ? '🎓 大学' : '🏥 市中') : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-br">
                    <td className="px-3 py-2 text-muted">都道府県</td>
                    {matchedHospitals.map((h, i) => (
                      <td key={i} className="px-3 py-2 text-center">{h?.prefecture || '—'}</td>
                    ))}
                  </tr>
                  {DATA_ROWS.map((row, ri) => {
                    const values = matchedHospitals.map(h => h ? (h as any)[row.key] : null)
                    const validValues = values.filter(v => v !== null && v !== undefined)
                    const best = row.higher === 'good' ? Math.max(...validValues) :
                      row.higher === 'bad' ? Math.min(...validValues) : null
                    return (
                      <tr key={ri} className="border-t border-br">
                        <td className="px-3 py-2 text-muted">{row.label}</td>
                        {matchedHospitals.map((h, i) => {
                          const v = h ? (h as any)[row.key] : null
                          const isBest = best !== null && v === best && validValues.length > 1
                          return (
                            <td key={i} className={`px-3 py-2 text-center font-mono ${isBest ? 'font-bold' : ''}`}
                              style={isBest ? { color: hospitalColors[i] } : undefined}>
                              {v !== null && v !== undefined
                                ? `${row.format ? row.format(v) : v}${row.unit}`
                                : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* 総合スコア */}
      <div className="bg-s0 border border-br rounded-xl p-4">
        <p className="text-xs font-bold text-tx mb-3">総合評価スコア（加重平均）</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${activeHospitals}, 1fr)` }}>
          {Array.from({ length: activeHospitals }, (_, hi) => (
            <div
              key={hi}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                background: hi === winnerIdx ? hospitalColors[hi] + '15' : '#F8F9FA',
                border: hi === winnerIdx ? `2px solid ${hospitalColors[hi]}` : '2px solid transparent',
              }}
            >
              {hi === winnerIdx && (
                <p className="text-[10px] font-bold mb-1" style={{ color: hospitalColors[hi] }}>WINNER</p>
              )}
              <p className="text-[11px] font-medium text-muted truncate">{hospitalNames[hi]}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: hospitalColors[hi] }}>{totals[hi]}</p>
              <p className="text-[10px] text-muted">/ 5.0</p>
            </div>
          ))}
        </div>
      </div>

      {/* カテゴリ別評価 */}
      {COMPARE_CATEGORIES.map((cat, ci) => (
        <div key={ci} className="bg-s0 border border-br rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-br">
            <p className="text-sm font-bold text-tx">{cat.title}</p>
          </div>
          <div className="divide-y divide-br/50">
            {cat.items.map((item, ii) => (
              <div key={ii} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-tx flex-1">{item}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-muted">重み</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={weights[ci][ii]}
                      onChange={e => setWeight(ci, ii, Number(e.target.value))}
                      className="w-16 accent-green-700"
                    />
                    <span className="text-[11px] font-bold w-3 text-center" style={{ color: MC }}>{weights[ci][ii]}</span>
                  </div>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${activeHospitals}, 1fr)` }}>
                  {Array.from({ length: activeHospitals }, (_, hi) => (
                    <div key={hi}>
                      <p className="text-[10px] text-muted mb-1 truncate">{hospitalNames[hi]}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            data-score
                            onClick={() => setScore(hi, ci, ii, star)}
                            className="flex-1 h-5 rounded text-[10px] font-bold transition-all"
                            style={{
                              background: star <= scores[hi][ci][ii] ? hospitalColors[hi] : '#E5E7EB',
                              color: star <= scores[hi][ci][ii] ? 'white' : '#9CA3AF',
                            }}
                          >
                            {star}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResumeGuide() {
  const STORAGE_KEY = 'iwor_resume_checklist'
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })

  const toggle = useCallback((key: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setChecked(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const totalItems = RESUME_SECTIONS.reduce((acc, s) => acc + s.items.length, 0)
  const checkedCount = checked.size

  return (
    <div className="space-y-4">
      <div className="bg-s0 border border-br rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-tx">履歴書チェック進捗</p>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white" style={{ background: MC }}>
              印刷
            </button>
            <p className="text-sm font-bold" style={{ color: MC }}>{checkedCount}/{totalItems}</p>
            {checkedCount > 0 && <button onClick={reset} className="text-[10px] text-muted hover:text-tx underline">リセット</button>}
          </div>
        </div>
        <div className="w-full h-2 bg-s1 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`, background: MC }} />
        </div>
        <p className="text-[11px] text-muted mt-2">履歴書を書く前・書いた後にチェック。重要項目には赤ラベル付き。</p>
      </div>

      {RESUME_SECTIONS.map((sec, si) => {
        const secChecked = sec.items.filter(item => checked.has(`r-${si}-${item.label}`)).length
        return (
          <div key={si} className="bg-s0 border border-br rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-br">
              <p className="text-sm font-bold text-tx flex items-center gap-2">
                <span>{sec.icon}</span>{sec.title}
                <span className="text-[10px] font-normal text-muted ml-auto">{secChecked}/{sec.items.length}</span>
              </p>
            </div>
            <div className="divide-y divide-br/50">
              {sec.items.map((item, ii) => {
                const key = `r-${si}-${item.label}`
                const isChecked = checked.has(key)
                return (
                  <button key={ii} onClick={() => toggle(key)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-s1/30 transition-colors">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isChecked ? 'border-transparent' : 'border-br'
                    }`} style={isChecked ? { background: MC } : undefined}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs leading-relaxed ${isChecked ? 'text-muted line-through' : 'text-tx'}`}>
                      {item.label}
                      {item.important && !isChecked && (
                        <span className="text-[9px] font-bold ml-1.5 px-1 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#DC2626' }}>重要</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
