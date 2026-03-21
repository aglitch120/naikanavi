'use client'

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getTemplateByDisease, getPubmedSearchUrl, type DiseaseTemplate } from '@/lib/josler-templates'
import { convertPrescriptionToGeneric } from '@/lib/drug-name-converter'
import { parseKarteText, generateDiscussionTemplate } from '@/lib/karte-parser'
import { getRichDiscussion } from '@/lib/josler-discussions'
import { SPECIALTIES as SP, DISEASE_GROUPS as DG } from '@/lib/josler-data'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── セクション定義 ──
interface Section { id: string; title: string; hint: string; maxChars: number; rows: number; required: boolean }

const SECTIONS: Section[] = [
  { id: 'title', title: 'タイトル', hint: '症例内容を端的に表したタイトル', maxChars: 80, rows: 1, required: true },
  { id: 'diagnosis', title: '確定診断名', hint: '#1 主病名, #2 副病名...', maxChars: 200, rows: 3, required: true },
  { id: 'chiefComplaint', title: '主訴', hint: '25文字以内', maxChars: 25, rows: 1, required: true },
  { id: 'history', title: '既往歴・生活社会歴・家族歴', hint: '重要なもののみ。合計100文字以内', maxChars: 100, rows: 3, required: true },
  { id: 'presentIllness', title: '病歴（現病歴）', hint: 'OPQRST。陰性所見も。1000文字以内', maxChars: 1000, rows: 8, required: true },
  { id: 'physicalExam', title: '主な入院時現症', hint: '350文字以内', maxChars: 350, rows: 6, required: true },
  { id: 'labFindings', title: '主要な検査所見', hint: '1000文字以内', maxChars: 1000, rows: 8, required: true },
  { id: 'problemList', title: 'プロブレムリスト', hint: '重要度順。#1が主病名。300文字以内', maxChars: 300, rows: 4, required: true },
  { id: 'courseAndDiscussion', title: '入院後経過と考察', hint: '【経過】と【考察】を分けて記載。1500文字以内', maxChars: 1500, rows: 12, required: true },
  { id: 'dischargeMeds', title: '退院時処方', hint: '一般名で記載。300文字以内', maxChars: 300, rows: 3, required: false },
  { id: 'overallDiscussion', title: '総合考察', hint: '文献2-3本引用。1000文字以内', maxChars: 1000, rows: 8, required: true },
]

// ── 身体所見テンプレート ──
function buildPhysicalExamTemplate(template?: DiseaseTemplate): string {
  const base = `身長 【要確認】 cm, 体重 【要確認】 kg, BMI 【要確認】 kg/m2.
体温 【要確認】°C, 脈拍 【要確認】/分, 血圧 【要確認】/【要確認】 mmHg.`

  if (!template) {
    return base + `\nSpO2 【要確認】% (room air).\n意識清明.\n眼瞼結膜: 貧血なし. 眼球結膜: 黄染なし.\n心音: 整, 雑音なし.\n呼吸音: 清, 副雑音なし.\n腹部: 平坦・軟, 圧痛なし, 腸蠕動音正常.\n下腿浮腫: なし.`
  }

  const items = template.requiredPhysicalExam
    .filter(item => !['体温', '脈拍', '血圧'].includes(item))
    .map(item => `${item}: 【要確認】`)
  return base + '\n' + items.join('.\n') + '.'
}

// ── 検査所見テンプレート ──
function buildLabTemplate(template?: DiseaseTemplate): string {
  if (!template) {
    return `【血算】WBC 【要確認】/μL, Hb 【要確認】 g/dL, Plt 【要確認】万/μL\n【生化学】TP 【要確認】 g/dL, Alb 【要確認】 g/dL, AST 【要確認】 U/L, ALT 【要確認】 U/L, BUN 【要確認】 mg/dL, Cr 【要確認】 mg/dL, Na 【要確認】 mEq/L, K 【要確認】 mEq/L, CRP 【要確認】 mg/dL`
  }

  const labs = template.requiredLabFindings.map(item => `${item} 【要確認】`).join(', ')
  const imaging = template.requiredImaging.length > 0
    ? '\n【画像】' + template.requiredImaging.map(item => `${item}: 【要確認】`).join(', ')
    : ''
  return labs + imaging
}

export default function SummaryGeneratorPage() {
  return <Suspense fallback={<div className="text-center py-20 text-muted text-sm">読み込み中...</div>}><SummaryGeneratorInner /></Suspense>
}

function SummaryGeneratorInner() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'select' | 'edit' | 'preview'>('select')

  // 疾患選択
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDisease, setSelectedDisease] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<DiseaseTemplate | undefined>()

  // フォーム値
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  // 処方変換
  const [rxInput, setRxInput] = useState('')
  const [rxConverted, setRxConverted] = useState('')

  // カルテ貼り付け
  const [karteInput, setKarteInput] = useState('')
  const [karteMode, setKarteMode] = useState<'bulk' | 'sections'>('bulk')
  const [karteSections, setKarteSections] = useState({ cc: '', hpi: '', pmh: '', pe: '', lab: '', rx: '', course: '' })
  const [karteConsent, setKarteConsent] = useState({ anonymized: false, patientConsent: false, hospitalRules: false })

  // URLパラメータから初期値
  useEffect(() => {
    const sp = searchParams.get('specialty')
    if (sp) setSelectedSpecialty(sp)
  }, [searchParams])

  // 疾患選択時にテンプレート適用
  const applyTemplate = useCallback((disease: string) => {
    const tmpl = getTemplateByDisease(disease)
    setActiveTemplate(tmpl)
    const init: Record<string, string> = {}
    SECTIONS.forEach(s => { init[s.id] = '' })

    if (tmpl) {
      init.title = tmpl.titleTemplate
      init.diagnosis = tmpl.diagnosisTemplate
      init.physicalExam = buildPhysicalExamTemplate(tmpl)
      init.labFindings = buildLabTemplate(tmpl)
      init.problemList = tmpl.problemListTemplate.join('\n')
    } else {
      init.physicalExam = buildPhysicalExamTemplate()
      init.labFindings = buildLabTemplate()
    }

    // カルテ貼り付け内容の自動振り分け（強化パーサー）
    // 項目別入力モードの場合はkarteSectionsをkarteInputにマージ
    const effectiveKarteInput = karteMode === 'sections'
      ? [
          karteSections.cc ? `主訴: ${karteSections.cc}` : '',
          karteSections.hpi ? `現病歴: ${karteSections.hpi}` : '',
          karteSections.pmh ? `既往歴: ${karteSections.pmh}` : '',
          karteSections.pe ? `身体所見: ${karteSections.pe}` : '',
          karteSections.lab ? `検査: ${karteSections.lab}` : '',
          karteSections.course ? `経過: ${karteSections.course}` : '',
          karteSections.rx ? `処方: ${karteSections.rx}` : '',
        ].filter(Boolean).join('\n\n')
      : karteInput

    if (effectiveKarteInput.trim()) {
      const parsed = parseKarteText(effectiveKarteInput.trim())
      if (parsed.chiefComplaint) init.chiefComplaint = parsed.chiefComplaint
      if (parsed.history) init.history = parsed.history
      if (parsed.presentIllness) init.presentIllness = parsed.presentIllness
      if (parsed.physicalExam) {
        // テンプレートの【要確認】にカルテの値をマージ
        init.physicalExam = parsed.physicalExam + '\n\n--- テンプレート（不足分を補完） ---\n' + init.physicalExam
      }
      if (parsed.labFindings) {
        init.labFindings = parsed.labFindings + '\n\n--- テンプレート（不足分を補完） ---\n' + init.labFindings
      }
      if (parsed.diagnosis) init.diagnosis = parsed.diagnosis
      if (parsed.dischargeMeds) init.dischargeMeds = parsed.dischargeMeds
      if (parsed.course) {
        // 経過データがあればcourseAndDiscussionに反映
        init.courseAndDiscussion = '【経過】\n' + parsed.course
      }
    }

    // 考察テンプレート生成（AI不使用）
    // Step 1: リッチ考察テンプレート（高品質事前作成文章）を探す
    const richDisc = getRichDiscussion(disease)
    if (richDisc) {
      if (!init.courseAndDiscussion) init.courseAndDiscussion = richDisc.courseAndDiscussion
      if (!init.overallDiscussion) init.overallDiscussion = richDisc.overallDiscussion
    } else if (tmpl) {
      // Step 2: リッチがなければ基本テンプレートから骨格生成
      const { courseTemplate, discussionTemplate } = generateDiscussionTemplate(tmpl, init.problemList, init.diagnosis)
      if (!init.courseAndDiscussion) init.courseAndDiscussion = courseTemplate
      if (!init.overallDiscussion) init.overallDiscussion = discussionTemplate
    }

    setValues(init)
    setStep('edit')
  }, [karteInput, karteMode, karteSections])

  const updateValue = useCallback((id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }))
  }, [])

  const charCount = (id: string) => values[id]?.replace(/【要確認】/g, '').length || 0

  const totalChars = Object.values(values).join('').replace(/【要確認】/g, '').length

  const getConfirmList = () => {
    const list: string[] = []
    SECTIONS.forEach(s => {
      const matches = values[s.id]?.match(/【要確認】/g)
      if (matches) list.push(`・【${s.title}】${matches.length}箇所`)
    })
    return list
  }

  const generateText = () => {
    const parts: string[] = []
    SECTIONS.forEach(s => {
      if (values[s.id]?.trim()) parts.push(`【${s.title}】\n${values[s.id].trim()}`)
    })
    const cl = getConfirmList()
    if (cl.length > 0) parts.push(`\n【要確認リスト】\n${cl.join('\n')}`)
    return parts.join('\n\n')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText()).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleConvertRx = () => {
    setRxConverted(convertPrescriptionToGeneric(rxInput))
  }

  // 疾患群リスト
  const diseaseGroups = useMemo(() => {
    if (!selectedSpecialty) return []
    return DG[selectedSpecialty] || []
  }, [selectedSpecialty])

  // ═══ 疾患選択画面 ═══
  if (step === 'select') {
    return (
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-muted mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-ac">ホーム</Link><span>›</span>
          <Link href="/record" className="hover:text-ac">研修記録</Link><span>›</span>
          <span>病歴要約ジェネレーター</span>
        </nav>
        <h1 className="text-xl font-bold text-tx mb-1">病歴要約ジェネレーター</h1>
        <p className="text-xs text-muted mb-4">J-OSLER手引き準拠 / AI不使用 / データ非保持</p>

        <div className="bg-acl border border-ac/20 rounded-xl p-3 mb-4 text-xs" style={{ color: MC }}>
          <p className="font-bold mb-1">プライバシー保護</p>
          <p>入力データはサーバーに送信されません。ブラウザ上で処理され、ページを閉じると消去されます。</p>
          <p className="mt-1">⚠ 患者情報は必ず匿名化してから入力してください。実名・生年月日・病院名は入力禁止です。</p>
        </div>

        {/* カルテ貼り付け（匿名化済みデータのみ） */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-3">
          <h2 className="text-sm font-bold text-tx mb-2">カルテ情報の貼り付け（任意）</h2>

          {/* 免責・技術説明 */}
          <div className="bg-acl border border-ac/20 rounded-lg p-2 mb-3 text-[10px]" style={{ color: MC }}>
            <p className="font-bold mb-1">本ツールの技術的仕様</p>
            <p>・<strong>AI不使用</strong>: テンプレートエンジン（JavaScript関数）による機械的な文字列処理のみ</p>
            <p>・<strong>データ非保持</strong>: 入力内容はブラウザのメモリ上でのみ処理され、サーバーに送信されません</p>
            <p>・<strong>保存なし</strong>: localStorage・Cookie・IndexedDB等への保存は一切行いません</p>
            <p>・<strong>ページを閉じると全データが消去</strong>されます</p>
          </div>

          {/* 同意チェックボックス（3つ全てチェック必須） */}
          <div className="bg-wnl border border-wnb rounded-lg p-3 mb-3">
            <p className="text-xs font-bold text-wn mb-2">⚠ カルテ情報を貼り付ける前に、以下の全てに同意してください</p>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-wn">
                <input type="checkbox" checked={karteConsent.anonymized}
                  onChange={e => setKarteConsent(p => ({ ...p, anonymized: e.target.checked }))}
                  className="mt-0.5 rounded flex-shrink-0" />
                <span>入力する情報から<strong>全ての患者識別情報</strong>（氏名・生年月日・住所・連絡先・患者ID等）を削除済みであり、<strong>日本内科学会J-OSLER「病歴要約 作成と評価の手引き」の匿名化基準</strong>を満たしていることを確認しました。病院名は「近医」「前医」に変更済みです。</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-wn">
                <input type="checkbox" checked={karteConsent.patientConsent}
                  onChange={e => setKarteConsent(p => ({ ...p, patientConsent: e.target.checked }))}
                  className="mt-0.5 rounded flex-shrink-0" />
                <span>本症例の病歴要約作成について、<strong>患者本人（または代理人）の同意</strong>を得ていること、または所属施設の倫理規定に基づき同意が不要であることを確認しました。</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-wn">
                <input type="checkbox" checked={karteConsent.hospitalRules}
                  onChange={e => setKarteConsent(p => ({ ...p, hospitalRules: e.target.checked }))}
                  className="mt-0.5 rounded flex-shrink-0" />
                <span>本ツールの使用が<strong>所属病院・施設の情報セキュリティ規則</strong>に合致していることを確認しました。診療情報の外部ツールでの利用について施設のルールを遵守しています。</span>
              </label>
            </div>
          </div>

          {/* テキストエリア（全同意時のみ有効） */}
          {karteConsent.anonymized && karteConsent.patientConsent && karteConsent.hospitalRules ? (
            <>
              {/* 入力モード切替 */}
              <div className="flex gap-1.5 mb-2">
                <button onClick={() => setKarteMode('bulk')}
                  className={`px-3 py-1 rounded text-[10px] font-medium border ${karteMode === 'bulk' ? 'bg-ac text-white border-ac' : 'border-br text-muted'}`}>
                  まとめて貼り付け
                </button>
                <button onClick={() => setKarteMode('sections')}
                  className={`px-3 py-1 rounded text-[10px] font-medium border ${karteMode === 'sections' ? 'bg-ac text-white border-ac' : 'border-br text-muted'}`}>
                  項目別入力
                </button>
              </div>

              {karteMode === 'bulk' ? (
                <>
                  <textarea value={karteInput} onChange={e => setKarteInput(e.target.value)}
                    rows={8} placeholder={"匿名化済みのカルテ情報をここに貼り付け。\n\n自動でセクションを検出します:\n・「主訴:」「現病歴:」「既往歴:」「身体所見:」「検査:」「処方:」\n  などのヘッダーがあると精度が上がります。\n・ヘッダーなしでも検査値・バイタル・処方を自動判別します。"}
                    className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-xs focus:border-ac outline-none resize-y leading-relaxed" />
                  <p className="text-[9px] text-muted mt-1">正規表現で「主訴:」「現病歴:」「検査:」等のヘッダーを検出 → 各セクションに自動振り分け</p>
                </>
              ) : (
                <div className="space-y-2">
                  {[
                    { key: 'cc', label: '主訴', rows: 1, placeholder: '発熱, 咳嗽' },
                    { key: 'hpi', label: '現病歴', rows: 4, placeholder: '〇月〇日より発熱を自覚し...' },
                    { key: 'pmh', label: '既往歴・生活歴・家族歴', rows: 2, placeholder: '高血圧, 糖尿病...' },
                    { key: 'pe', label: '身体所見（バイタル含む）', rows: 3, placeholder: 'BT 38.5, BP 120/80, HR 90, SpO2 96%...' },
                    { key: 'lab', label: '検査所見', rows: 4, placeholder: 'WBC 12000, CRP 8.5, Cr 1.2...' },
                    { key: 'course', label: '入院後経過', rows: 4, placeholder: '入院後CTRX開始, Day3解熱...' },
                    { key: 'rx', label: '退院時処方（商品名OK→自動変換）', rows: 2, placeholder: 'クラビット500mg 1T 分1...' },
                  ].map(({ key, label, rows, placeholder }) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-tx">{label}</label>
                      <textarea value={karteSections[key as keyof typeof karteSections]}
                        onChange={e => setKarteSections(p => ({ ...p, [key]: e.target.value }))}
                        rows={rows} placeholder={placeholder}
                        className="w-full px-2 py-1.5 bg-bg border border-br rounded text-xs focus:border-ac outline-none resize-y" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full px-3 py-6 bg-s1 border border-br rounded-lg text-center">
              <p className="text-xs text-muted">上の3項目すべてにチェックを入れると入力欄が表示されます</p>
            </div>
          )}

          {/* 免責（iwor側） */}
          <div className="mt-2 p-2 rounded-lg bg-s1 text-[9px] text-muted leading-relaxed">
            <p><strong>免責事項:</strong> 本ツールは匿名化済みテキストのテンプレート整形機能を提供するものであり、診療情報の収集・保存・分析は行いません。入力データの匿名化の適切性、患者同意の取得、施設規則の遵守は全て利用者（医師）の責任において行われるものとし、iwor運営者は入力内容に関して一切の責任を負いません。</p>
          </div>
        </div>

        {/* Step 1: 領域選択 */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-3">
          <h2 className="text-sm font-bold text-tx mb-3">1. 領域を選択</h2>
          <div className="flex flex-wrap gap-1.5">
            {SP.map(sp => (
              <button key={sp.id} onClick={() => { setSelectedSpecialty(sp.id); setSelectedDisease('') }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all"
                style={{
                  background: selectedSpecialty === sp.id ? sp.color : 'transparent',
                  color: selectedSpecialty === sp.id ? '#fff' : 'var(--m)',
                  borderColor: selectedSpecialty === sp.id ? sp.color : 'var(--br)',
                }}>
                {sp.short}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: 疾患選択 */}
        {selectedSpecialty && (
          <div className="bg-s0 border border-br rounded-xl p-4 mb-3">
            <h2 className="text-sm font-bold text-tx mb-3">2. 疾患を選択</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {diseaseGroups.map((dg: any) => (
                <div key={dg.id}>
                  <p className="text-[10px] font-bold text-muted mb-1">{dg.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {dg.diseases.map((d: string) => {
                      const hasTmpl = !!getTemplateByDisease(d)
                      return (
                        <button key={d} onClick={() => { setSelectedDisease(d); applyTemplate(d) }}
                          className="px-2 py-1 rounded text-[10px] border transition-all"
                          style={{
                            background: selectedDisease === d ? MCL : 'transparent',
                            color: selectedDisease === d ? MC : hasTmpl ? 'var(--tx)' : 'var(--m)',
                            borderColor: selectedDisease === d ? MC : hasTmpl ? 'var(--ac)' + '40' : 'var(--br)',
                            fontWeight: hasTmpl ? 600 : 400,
                          }}>
                          {d} {hasTmpl && '✦'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted mt-2">✦ テンプレートあり（身体所見・検査項目が自動展開されます）</p>
          </div>
        )}

        {/* テンプレートなしでも開始可能 */}
        <button onClick={() => { applyTemplate(selectedDisease || ''); setStep('edit') }}
          className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
          {selectedDisease ? `「${selectedDisease}」で作成開始` : '白紙から作成開始'}
        </button>
      </div>
    )
  }

  // ═══ 編集画面 ═══
  if (step === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setStep('select')} className="text-xs text-muted hover:text-tx flex items-center gap-1">
            ← 疾患選択に戻る
          </button>
          {activeTemplate && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: MCL, color: MC }}>
              {activeTemplate.disease}
            </span>
          )}
        </div>

        {/* テンプレート情報 */}
        {activeTemplate && (
          <div className="bg-s0 border border-br rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-tx">テンプレート参考情報</span>
              <a href={getPubmedSearchUrl(activeTemplate.pubmedQuery)} target="_blank" rel="noopener noreferrer"
                className="text-[10px] px-2 py-1 rounded-lg" style={{ background: MCL, color: MC }}>
                PubMed検索 →
              </a>
            </div>
            {activeTemplate.guidelineRef && (
              <p className="text-[10px] text-muted mb-1">📖 {activeTemplate.guidelineRef}</p>
            )}
            {activeTemplate.chiefComplaintExamples.length > 0 && (
              <p className="text-[10px] text-muted mb-1">主訴例: {activeTemplate.chiefComplaintExamples.join(' / ')}</p>
            )}
            {activeTemplate.differentialDiagnosis.length > 0 && (
              <p className="text-[10px] text-muted mb-1">鑑別: {activeTemplate.differentialDiagnosis.join(', ')}</p>
            )}
            {activeTemplate.standardTreatment.length > 0 && (
              <p className="text-[10px] text-muted">治療: {activeTemplate.standardTreatment.join(', ')}</p>
            )}
          </div>
        )}

        {/* セクション入力 */}
        <div className="space-y-3">
          {SECTIONS.map(s => (
            <div key={s.id} className="bg-s0 border border-br rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-tx flex items-center gap-1">
                  {s.title}
                  {s.required && <span className="text-[8px] px-1 py-0.5 rounded bg-dnl text-dn font-bold">必須</span>}
                </label>
                <span className={`text-[9px] font-mono ${charCount(s.id) > s.maxChars ? 'text-dn font-bold' : 'text-muted'}`}>
                  {charCount(s.id)}/{s.maxChars}
                </span>
              </div>
              {s.rows === 1 ? (
                <input type="text" value={values[s.id] || ''} onChange={e => updateValue(s.id, e.target.value)}
                  placeholder={s.hint}
                  className="w-full px-2 py-1.5 bg-bg border border-br rounded text-xs focus:border-ac outline-none" />
              ) : (
                <textarea value={values[s.id] || ''} onChange={e => updateValue(s.id, e.target.value)}
                  rows={s.rows} placeholder={s.hint}
                  className="w-full px-2 py-1.5 bg-bg border border-br rounded text-xs focus:border-ac outline-none resize-y leading-relaxed"
                  style={{ fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif' }} />
              )}
            </div>
          ))}
        </div>

        {/* 処方 商品名→一般名 変換ツール */}
        <div className="bg-s0 border border-br rounded-xl p-3 mt-3">
          <h3 className="text-xs font-bold text-tx mb-2">💊 商品名→一般名 変換</h3>
          <textarea value={rxInput} onChange={e => setRxInput(e.target.value)}
            rows={3} placeholder="商品名の処方をペースト（例: ロセフィン 2g 1日1回）"
            className="w-full px-2 py-1.5 bg-bg border border-br rounded text-xs focus:border-ac outline-none resize-y mb-2" />
          <button onClick={handleConvertRx}
            className="px-3 py-1.5 rounded text-xs font-bold text-white mb-2" style={{ background: MC }}>
            一般名に変換
          </button>
          {rxConverted && (
            <div className="bg-acl rounded p-2 text-xs" style={{ color: MC }}>
              <p className="font-bold mb-1">変換結果:</p>
              <p className="whitespace-pre-wrap">{rxConverted}</p>
              <button onClick={() => { updateValue('dischargeMeds', rxConverted); setRxConverted(''); setRxInput('') }}
                className="mt-1 text-[10px] underline">
                ↑ 退院時処方に反映
              </button>
            </div>
          )}
        </div>

        {/* アクションバー */}
        <div className="sticky bottom-16 md:bottom-0 z-10 mt-3 pt-2 pb-1" style={{ background: 'linear-gradient(transparent, var(--bg) 8px)' }}>
          <div className="bg-s0 border border-br rounded-xl p-2 flex items-center justify-between">
            <span className="text-[10px] text-muted">
              {totalChars}文字 / 要確認 {getConfirmList().length}箇所
            </span>
            <div className="flex gap-2">
              <button onClick={() => setStep('preview')} className="px-3 py-1.5 rounded text-[10px] font-medium border border-br text-muted hover:text-ac">
                プレビュー
              </button>
              <button onClick={handleCopy} className="px-3 py-1.5 rounded text-[10px] font-bold text-white" style={{ background: MC }}>
                {copied ? '✓ コピー済み' : 'コピー'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══ プレビュー画面 ═══
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setStep('edit')} className="text-xs text-muted hover:text-tx">← 編集に戻る</button>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="px-3 py-1.5 rounded text-[10px] font-medium border border-br text-muted hover:text-ac">
            {copied ? '✓' : 'コピー'}
          </button>
          <button onClick={() => {
            const w = window.open('', '_blank')
            if (!w) return
            const html = SECTIONS.map(s => values[s.id]?.trim() ? `<div style="margin-bottom:10px"><h3 style="font-size:11pt;font-weight:700;margin-bottom:2px">【${s.title}】</h3><p style="font-size:10.5pt;line-height:1.8;white-space:pre-wrap">${values[s.id].trim().replace(/【要確認】/g, '<span style="background:#FEF3C7;color:#92400E;padding:0 2px">【要確認】</span>')}</p></div>` : '').filter(Boolean).join('')
            w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>病歴要約</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Yu Mincho","Hiragino Mincho ProN",serif;padding:20mm;font-size:11pt;line-height:1.8;color:#1a1917}@media print{body{padding:15mm}@page{size:A4;margin:15mm}}</style></head><body>${html}<script>window.onload=function(){window.print()}</script></body></html>`)
            w.document.close()
          }} className="px-3 py-1.5 rounded text-[10px] font-bold text-white" style={{ background: MC }}>
            印刷/PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-br rounded-xl p-5 shadow-sm" style={{ fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif' }}>
        {SECTIONS.map(s => {
          if (!values[s.id]?.trim()) return null
          return (
            <div key={s.id} className="mb-3">
              <h3 className="text-xs font-bold text-tx mb-0.5">【{s.title}】</h3>
              <p className="text-xs leading-[1.8] whitespace-pre-wrap">
                {values[s.id].split('【要確認】').map((part, i, arr) => (
                  <span key={i}>{part}{i < arr.length - 1 && <span className="bg-wnl text-wn px-0.5 rounded text-[9px] font-bold">【要確認】</span>}</span>
                ))}
              </p>
            </div>
          )
        })}
        {getConfirmList().length > 0 && (
          <div className="mt-4 pt-3 border-t border-br">
            <h3 className="text-xs font-bold text-wn mb-1">【要確認リスト】</h3>
            <div className="text-[9px] text-muted">{getConfirmList().map((item, i) => <p key={i}>{item}</p>)}</div>
          </div>
        )}
      </div>

      {/* 自己評価チェックリスト */}
      <div className="mt-4 bg-s0 border border-br rounded-xl p-3">
        <h3 className="text-xs font-bold text-tx mb-2">自己評価チェックリスト</h3>
        <div className="space-y-1.5 text-[10px] text-muted">
          {['文体統一（常体）/ 句読点「,」「.」/ 略語初出注記 / 個人情報匿名化 / A4 2枚80%以上',
            '主病名が提出領域の疾患であること',
            '陰性所見 / 鑑別診断の明示と除外根拠',
            '薬剤一般名 / 治療選択の妥当性',
            'EBM重視 / 文献2-3本引用',
            '患者の社会的・心理的背景への配慮',
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-1.5 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded" /><span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
