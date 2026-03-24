'use client'

import { useState, useMemo, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 文書テンプレート定義 ──
interface DocField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'select' | 'textarea'
  options?: string[]
  rows?: number
  required?: boolean
}

interface DocTemplate {
  id: string
  title: string
  icon: string
  desc: string
  fields: DocField[]
  generatePrompt: (vals: Record<string, string>) => string
}

const TEMPLATES: DocTemplate[] = [
  {
    id: 'referral',
    title: '紹介状（診療情報提供書）',
    icon: '✉️',
    desc: '他院への紹介時に使用。患者情報は入力不要。構成テンプレートを生成。',
    fields: [
      { key: 'department', label: '紹介先の科', placeholder: '例: 消化器内科', type: 'text', required: true },
      { key: 'reason', label: '紹介理由', placeholder: '例: 精査加療依頼', type: 'text', required: true },
      { key: 'diagnosis', label: '主病名/疑い病名', placeholder: '例: 胃癌疑い', type: 'text', required: true },
      { key: 'history', label: '経過の要点（キーワード）', placeholder: '例: 心窩部痛, 体重減少, EGDで腫瘤', type: 'textarea', rows: 3 },
      { key: 'request', label: '依頼内容', placeholder: '例: 精査および治療方針のご検討', type: 'text' },
    ],
    generatePrompt: (v) => `以下の情報をもとに、診療情報提供書（紹介状）のテンプレートを作成してください。

## 要件
- 形式: 診療情報提供書の標準フォーマット
- トーン: 敬語、簡潔かつ丁寧
- 患者氏名・生年月日・住所欄は「○○」で空欄
- 構成: 紹介先→紹介元→傷病名→経過→現在の処方→依頼事項

## 入力情報
- 紹介先: ${v.department}
- 紹介理由: ${v.reason}
- 主病名: ${v.diagnosis}
- 経過の要点: ${v.history || '（記載なし）'}
- 依頼内容: ${v.request || '精査加療のご検討をお願いいたします'}

## 出力
紹介状のテンプレート文面のみを出力してください。患者の具体的な個人情報は含めないでください。`,
  },
  {
    id: 'discharge-summary',
    title: '退院サマリ',
    icon: '📋',
    desc: '退院時要約のテンプレート。SOAP形式。',
    fields: [
      { key: 'diagnosis', label: '主病名', placeholder: '例: 急性心筋梗塞', type: 'text', required: true },
      { key: 'comorbid', label: '併存症', placeholder: '例: 高血圧, 糖尿病', type: 'text' },
      { key: 'admission_reason', label: '入院理由', placeholder: '例: 胸痛発症、CAG施行目的', type: 'text', required: true },
      { key: 'course_keywords', label: '入院経過キーワード', placeholder: '例: PCI施行, DES留置, 合併症なし, リハビリ順調', type: 'textarea', rows: 3 },
      { key: 'discharge_plan', label: '退院後方針', placeholder: '例: 外来フォロー, 服薬継続, 心リハ', type: 'text' },
    ],
    generatePrompt: (v) => `以下の情報をもとに、退院サマリ（退院時要約）のテンプレートを作成してください。

## 要件
- 形式: 一般的な退院サマリのフォーマット
- 構成: 患者情報欄(空欄)→主病名→入院日/退院日(空欄)→現病歴→入院時現症→入院後経過→退院時処方→退院後方針
- 簡潔かつ漏れなく
- 患者の個人情報は含めない（○○で空欄）

## 入力情報
- 主病名: ${v.diagnosis}
- 併存症: ${v.comorbid || '特記なし'}
- 入院理由: ${v.admission_reason}
- 入院経過: ${v.course_keywords || '（記載なし）'}
- 退院後方針: ${v.discharge_plan || '外来フォロー'}

## 出力
退院サマリのテンプレート文面のみ出力してください。`,
  },
  {
    id: 'admission-note',
    title: '入院時カルテ',
    icon: '🏥',
    desc: '入院時の初回カルテテンプレート。',
    fields: [
      { key: 'cc', label: '主訴', placeholder: '例: 胸痛', type: 'text', required: true },
      { key: 'diagnosis', label: '入院時診断', placeholder: '例: 急性冠症候群疑い', type: 'text', required: true },
      { key: 'plan_keywords', label: '方針キーワード', placeholder: '例: モニター管理, CAG予定, ヘパリン開始', type: 'textarea', rows: 2 },
    ],
    generatePrompt: (v) => `以下の情報をもとに、入院時カルテ（入院時記録）のテンプレートを作成してください。

## 要件
- SOAP形式またはPOS形式
- 構成: 入院日時(空欄)→主訴→現病歴(空欄、記載すべき項目を列挙)→既往歴/内服(空欄)→身体所見(空欄、確認すべき項目を列挙)→検査(空欄)→Assessment→Plan
- 主訴「${v.cc}」に対して確認すべき問診項目、身体所見項目を網羅的にリスト化
- 患者の個人情報は含めない

## 入力情報
- 主訴: ${v.cc}
- 入院時診断: ${v.diagnosis}
- 方針: ${v.plan_keywords || '（記載なし）'}

## 出力
入院時カルテのテンプレートのみ出力してください。`,
  },
  {
    id: 'outpatient-note',
    title: '外来カルテ',
    icon: '🩺',
    desc: '外来診療のSOAPテンプレート。',
    fields: [
      { key: 'cc', label: '主訴/受診理由', placeholder: '例: 頭痛, 定期フォロー', type: 'text', required: true },
      { key: 'setting', label: '診療場面', placeholder: '', type: 'select', options: ['初診', '再診（定期フォロー）', '再診（症状あり）', '紹介初診'] },
    ],
    generatePrompt: (v) => `以下の情報をもとに、外来カルテ（SOAP形式）のテンプレートを作成してください。

## 要件
- SOAP形式
- 主訴「${v.cc}」に対する問診項目(S)、確認すべき身体所見(O)、鑑別診断リスト(A)、一般的な方針(P)を網羅
- 場面: ${v.setting || '初診'}
- 患者の個人情報は含めない
- 各セクションは空欄（○○）にし、記載すべき項目を箇条書きで示す

## 出力
外来カルテSOAPテンプレートのみ出力してください。`,
  },
  {
    id: 'ward-note',
    title: '病棟カルテ（経過記録）',
    icon: '📝',
    desc: '日々の経過記録テンプレート。',
    fields: [
      { key: 'diagnosis', label: '主病名', placeholder: '例: 肺炎', type: 'text', required: true },
      { key: 'pod', label: '入院日数/術後日数', placeholder: '例: 入院3日目, POD1', type: 'text' },
      { key: 'focus', label: '本日のフォーカス', placeholder: '例: 解熱傾向, 抗菌薬変更検討', type: 'text' },
    ],
    generatePrompt: (v) => `以下の情報をもとに、病棟カルテ（経過記録）のテンプレートを作成してください。

## 要件
- SOAP形式
- 主病名「${v.diagnosis}」に対する日々のフォローで確認すべき項目を網羅
- ${v.pod || '入院中'}の経過記録として適切な構成
- 本日のフォーカス: ${v.focus || '経過観察'}
- 各セクションは空欄にし、記載すべき項目を示す
- 患者の個人情報は含めない

## 出力
病棟カルテテンプレートのみ出力してください。`,
  },
]

// ── メインコンポーネント ──
export default function DocumentsApp() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  const template = useMemo(() =>
    TEMPLATES.find(t => t.id === selectedTemplate)
  , [selectedTemplate])

  const handleSelect = useCallback((id: string) => {
    setSelectedTemplate(id)
    setValues({})
    setGeneratedPrompt('')
    setCopied(false)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!template) return
    // 必須フィールドチェック
    const missing = template.fields.filter(f => f.required && !values[f.key]?.trim())
    if (missing.length > 0) {
      alert(`${missing.map(f => f.label).join('、')}を入力してください`)
      return
    }
    const prompt = template.generatePrompt(values)
    setGeneratedPrompt(prompt)
    setCopied(false)
  }, [template, values])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [generatedPrompt])

  const handleBack = () => {
    setSelectedTemplate(null)
    setValues({})
    setGeneratedPrompt('')
  }

  return (
    <>
      <div className="mb-4 pt-2">
        <AppHeader
          title="文書支援"
          subtitle="紹介状・退院サマリ・カルテテンプレート"
          badge="FREE"
          favoriteSlug="app-documents"
          favoriteHref="/documents"
        />
      </div>

      {/* 患者情報不保持バナー */}
      <div className="rounded-xl p-3 mb-4 text-[10px] leading-relaxed" style={{ background: '#E8F0EC', border: `1px solid ${MC}30`, color: MC }}>
        <span className="font-bold">患者情報不保持: </span>
        このツールは文書のテンプレート/プロンプトを生成します。患者の個人情報（氏名・ID等）は入力不要です。生成されたプロンプトをChatGPT/Claude等に貼り付けてご使用ください。
      </div>

      {!selectedTemplate ? (
        /* テンプレート一覧 */
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => handleSelect(t.id)}
              className="text-left rounded-2xl p-4 transition-all hover:shadow-md"
              style={{ background: '#FEFEFC', border: '1.5px solid #E8E5DF' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1A1917' }}>{t.title}</p>
                  <p className="text-[11px]" style={{ color: '#6B6760' }}>{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* テンプレート入力画面 */
        <div className="space-y-4">
          <button onClick={handleBack} className="flex items-center gap-1 text-xs font-medium" style={{ color: MC }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{template?.icon}</span>
            <h2 className="text-base font-bold" style={{ color: '#1A1917' }}>{template?.title}</h2>
          </div>

          {/* 入力フィールド */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#FEFEFC', border: '1px solid #E8E5DF' }}>
            {template?.fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#6B6760' }}>
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {f.type === 'select' ? (
                  <select value={values[f.key] || ''} onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg text-sm" style={{ border: '1.5px solid #DDD9D2', background: '#FEFEFC', fontSize: '16px' }}>
                    <option value="">選択...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={values[f.key] || ''} onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={f.rows || 3} placeholder={f.placeholder}
                    className="w-full py-2 px-3 rounded-lg text-sm resize-none" style={{ border: '1.5px solid #DDD9D2', background: '#FEFEFC', fontSize: '16px' }} />
                ) : (
                  <input type="text" value={values[f.key] || ''} onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full py-2 px-3 rounded-lg text-sm" style={{ border: '1.5px solid #DDD9D2', background: '#FEFEFC', fontSize: '16px' }} />
                )}
              </div>
            ))}
          </div>

          {/* 生成ボタン */}
          <button onClick={handleGenerate}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: MC, color: '#fff' }}>
            プロンプトを生成
          </button>

          {/* 生成結果 */}
          {generatedPrompt && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ background: '#F0EDE7', border: '1px solid #DDD9D2' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: '#1A1917' }}>生成されたプロンプト</p>
                  <button onClick={handleCopy}
                    className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all"
                    style={copied ? { background: '#059669', color: '#fff' } : { background: MC, color: '#fff' }}>
                    {copied ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: '#1A1917' }}>{generatedPrompt}</pre>
              </div>

              {/* 使い方ガイド */}
              <div className="rounded-xl p-3 text-[11px]" style={{ background: '#FFF8E7', border: '1px solid #E8DFC0', color: '#6B6760' }}>
                <p className="font-semibold mb-1" style={{ color: '#8B7D3C' }}>使い方:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>上のプロンプトをコピー</li>
                  <li>ChatGPT / Claude / Gemini 等に貼り付け</li>
                  <li>生成された文書に患者情報を自分で追記</li>
                </ol>
              </div>

              {/* AIリンク */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: 'ChatGPT', url: 'https://chatgpt.com/', color: '#10A37F' },
                  { name: 'Claude', url: 'https://claude.ai/', color: '#CC785C' },
                  { name: 'Gemini', url: 'https://gemini.google.com/', color: '#4285F4' },
                ].map(ai => (
                  <a key={ai.name} href={ai.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all hover:opacity-80"
                    style={{ background: ai.color }}>
                    {ai.name} で開く
                  </a>
                ))}
              </div>

              {/* 免責 */}
              <p className="text-center text-[10px]" style={{ color: '#C8C4BC' }}>
                生成されたテンプレートは参考です。内容の正確性は医師ご自身でご確認ください。
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
