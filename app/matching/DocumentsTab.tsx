'use client'
import { useState, useCallback } from 'react'

const MC = '#1B4F3A'
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
      { key: 'date1', label: '第1希望日', placeholder: '2026年7月1日（水）', type: 'text' },
      { key: 'date2', label: '第2希望日', placeholder: '2026年7月3日（金）', type: 'text' },
      { key: 'date3', label: '第3希望日', placeholder: '2026年7月8日（水）', type: 'text' },
      { key: 'spec1', label: '見学希望科 第1希望', placeholder: '内科' },
      { key: 'spec2', label: '見学希望科 第2希望', placeholder: '救急科' },
      { key: 'spec3', label: '見学希望科 第3希望（任意）', placeholder: '外科' },
      { key: 'phone', label: '電話番号', placeholder: '090-XXXX-XXXX' },
      { key: 'email', label: 'メールアドレス', placeholder: 'example@univ.ac.jp' },
      { key: 'zip', label: '郵便番号', placeholder: '〒XXX-XXXX' },
      { key: 'address', label: '住所', placeholder: '東京都○○区...' },
    ],
    generate: (v, p) => {
      const contact = v.contactName ? `${v.department} ${v.contactName}` : `${v.department} ご担当者 様`
      const year = p.graduationYear ? `${p.graduationYear}年卒業見込み` : ''
      const spec3Line = v.spec3 ? `\n第3希望: ${v.spec3}` : ''
      return `件名: 病院見学のお願い（${p.university || '○○大学医学部'}${p.graduationYear ? ` ${p.graduationYear}年卒` : ''} ${p.name || '○○'}）

${v.hospitalName || '○○病院'}
${contact}

初めてメールを差し上げます。
私、${p.university || '○○大学医学部'}の${p.name || '○○'}と申します。${year ? `（${year}）` : ''}

貴院のホームページを拝見し、初期臨床研修に大変魅力を感じました。
是非、見学にお伺いさせていただきたく存じます。

可能でしたら、
第1希望日: ${v.date1 || '○月○日（○）'}
第2希望日: ${v.date2 || '○月○日（○）'}
第3希望日: ${v.date3 || '○月○日（○）'}
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
      { key: 'visitedDept', label: '見学した診療科', placeholder: '内科' },
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
      { key: 'zip', label: '郵便番号', placeholder: '〒XXX-XXXX' },
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

貴院の初期臨床研修プログラムに応募させていただきたく、
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
  profile, mode,
}: {
  profile: Profile
  mode: 'matching' | 'career'
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
      {subTab === 'questions' && <VisitQuestions />}
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

  const templates = mode === 'career'
    ? TEMPLATES.filter(t => t.id !== 'adoption-thanks')
    : TEMPLATES

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

      {/* 入力フォーム */}
      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
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
            ) : (
              <input
                type="text"
                value={fieldValues[f.key] || ''}
                onChange={e => updateField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
              />
            )}
          </div>
        ))}
      </div>

      {/* プレビュー */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden">
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
function VisitQuestions() {
  const [openCat, setOpenCat] = useState<number>(0)
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
      <p className="text-xs text-muted">見学時に確認すべきポイント。メモ欄に記録を残せます。</p>
      {VISIT_QUESTIONS.map((cat, ci) => (
        <div key={ci} className="bg-s0 border border-br rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenCat(prev => prev === ci ? -1 : ci)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-s1/30 transition-colors"
          >
            <span className="text-sm font-bold text-tx flex items-center gap-2">
              <span>{cat.icon}</span>
              {cat.title}
              <span className="text-[10px] font-normal text-muted">({cat.questions.length}項目)</span>
            </span>
            <span className={`text-muted transition-transform text-sm ${openCat === ci ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {openCat === ci && (
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
      { label: '写真を用意した（6ヶ月以内・スタジオ撮影推奨）', important: true },
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
      { label: 'プロが撮影（写真館やスタジオ推奨）', important: true },
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
