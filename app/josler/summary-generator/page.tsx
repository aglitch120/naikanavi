'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ═══════════════════════════════════════
//  病歴要約ジェネレーター v1
//  - AI不使用、データ非保持、ブラウザ完結
//  - J-OSLER「病歴要約 作成と評価の手引き」準拠
//  - 3省2ガイドライン法令遵守
// ═══════════════════════════════════════

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── セクション定義 ──
interface SummarySection {
  id: string
  title: string
  hint: string
  maxChars: number
  rows: number
  required: boolean
}

const SECTIONS: SummarySection[] = [
  { id: 'title', title: 'タイトル', hint: '症例内容を端的に表したタイトル', maxChars: 80, rows: 1, required: true },
  { id: 'diagnosis', title: '確定診断名', hint: '#1 主病名（提出領域の疾患）, #2 副病名...', maxChars: 200, rows: 3, required: true },
  { id: 'chiefComplaint', title: '主訴', hint: '25文字以内', maxChars: 25, rows: 1, required: true },
  { id: 'history', title: '既往歴・生活社会歴・家族歴', hint: '重要なもののみ。合計100文字以内', maxChars: 100, rows: 3, required: true },
  { id: 'presentIllness', title: '病歴（現病歴）', hint: '主病名について時系列で記載。OPQRST。陰性所見も。1000文字以内', maxChars: 1000, rows: 10, required: true },
  { id: 'physicalExam', title: '主な入院時現症', hint: 'バイタル・身体所見。不必要なものは省略。350文字以内', maxChars: 350, rows: 6, required: true },
  { id: 'labFindings', title: '主要な検査所見', hint: '異常値・注目すべき正常値・特殊検査。1000文字以内', maxChars: 1000, rows: 10, required: true },
  { id: 'problemList', title: 'プロブレムリスト', hint: '重要度・緊急度の高い順。#1が主病名。300文字以内', maxChars: 300, rows: 5, required: true },
  { id: 'courseAndDiscussion', title: '入院後経過と考察', hint: 'プロブレム番号順に【経過】と【考察】を分けて記載。1500文字以内', maxChars: 1500, rows: 15, required: true },
  { id: 'dischargeMeds', title: '退院時処方', hint: '一般名で記載。300文字以内', maxChars: 300, rows: 4, required: false },
  { id: 'overallDiscussion', title: '総合考察', hint: '診断・治療法選択の過程。文献2-3本引用。1000文字以内', maxChars: 1000, rows: 10, required: true },
]

// ── テンプレート（空欄プレースホルダー付き） ──
const PHYSICAL_EXAM_TEMPLATE = `身長 【要確認】 cm, 体重 【要確認】 kg, BMI 【要確認】 kg/m2.
体温 【要確認】°C, 脈拍 【要確認】/分, 血圧 【要確認】/【要確認】 mmHg, SpO2 【要確認】% (room air).
意識清明.
眼瞼結膜: 貧血なし. 眼球結膜: 黄染なし.
心音: 整, 雑音なし.
呼吸音: 清, 副雑音なし.
腹部: 平坦・軟, 圧痛なし, 腸蠕動音正常.
下腿浮腫: なし.`

const LAB_TEMPLATE = `【血算】WBC 【要確認】/μL (Neut 【要確認】%, Lym 【要確認】%), Hb 【要確認】 g/dL, Plt 【要確認】万/μL
【生化学】TP 【要確認】 g/dL, Alb 【要確認】 g/dL, T-Bil 【要確認】 mg/dL, AST 【要確認】 U/L, ALT 【要確認】 U/L, LDH 【要確認】 U/L, BUN 【要確認】 mg/dL, Cr 【要確認】 mg/dL, Na 【要確認】 mEq/L, K 【要確認】 mEq/L, Cl 【要確認】 mEq/L, CRP 【要確認】 mg/dL
【凝固】PT-INR 【要確認】, APTT 【要確認】秒
【胸部X線】【要確認】
【心電図】【要確認】`

export default function SummaryGeneratorPage() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    SECTIONS.forEach(s => {
      if (s.id === 'physicalExam') init[s.id] = PHYSICAL_EXAM_TEMPLATE
      else if (s.id === 'labFindings') init[s.id] = LAB_TEMPLATE
      else init[s.id] = ''
    })
    return init
  })
  const [step, setStep] = useState<'edit' | 'preview'>('edit')
  const [copied, setCopied] = useState(false)

  const updateValue = useCallback((id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }))
  }, [])

  const charCount = (id: string) => values[id]?.replace(/【要確認】/g, '').length || 0

  const totalChars = Object.values(values).join('').replace(/【要確認】/g, '').length

  // 要確認リスト生成
  const getConfirmList = () => {
    const list: string[] = []
    SECTIONS.forEach(s => {
      const matches = values[s.id]?.match(/【要確認】/g)
      if (matches) {
        list.push(`・【${s.title}】${matches.length}箇所`)
      }
    })
    return list
  }

  // プレーンテキスト生成
  const generateText = () => {
    const parts: string[] = []
    SECTIONS.forEach(s => {
      if (values[s.id]?.trim()) {
        parts.push(`【${s.title}】\n${values[s.id].trim()}`)
      }
    })

    const confirmList = getConfirmList()
    if (confirmList.length > 0) {
      parts.push(`\n【要確認リスト】\n${confirmList.join('\n')}`)
    }

    return parts.join('\n\n')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=800,height=1100')
    if (!w) return
    const content = SECTIONS.map(s => {
      if (!values[s.id]?.trim()) return ''
      return `<div class="sec"><h3>【${s.title}】</h3><p>${values[s.id].trim().replace(/\n/g, '<br>').replace(/【要確認】/g, '<span class="confirm">【要確認】</span>')}</p></div>`
    }).filter(Boolean).join('\n')

    const confirmList = getConfirmList()
    const confirmHtml = confirmList.length > 0
      ? `<div class="sec confirm-list"><h3>【要確認リスト】</h3><p>${confirmList.join('<br>')}</p></div>`
      : ''

    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>病歴要約</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Yu Mincho","YuMincho","Hiragino Mincho ProN",serif;color:#1a1917;padding:20mm;font-size:11pt;line-height:1.8}
.sec{margin-bottom:12px}
.sec h3{font-size:11pt;font-weight:700;margin-bottom:2px}
.sec p{font-size:10.5pt;line-height:1.8}
.confirm{background:#FEF3C7;color:#92400E;padding:0 2px;border-radius:2px}
.confirm-list{margin-top:20px;padding-top:12px;border-top:1px solid #ccc}
.confirm-list p{font-size:10pt;color:#666}
.footer{margin-top:20px;font-size:8pt;color:#999;text-align:center;border-top:1px solid #eee;padding-top:8px}
@media print{body{padding:15mm}@page{size:A4;margin:15mm}}
</style></head><body>
${content}
${confirmHtml}
<div class="footer">この病歴要約はiwor.jpで作成されました。データはブラウザ上で処理され、サーバーには送信されていません。</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`)
    w.document.close()
  }

  // ── 編集画面 ──
  if (step === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <nav className="text-xs text-muted mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-ac">ホーム</Link>
            <span>›</span>
            <Link href="/record" className="hover:text-ac">研修記録</Link>
            <span>›</span>
            <span>病歴要約ジェネレーター</span>
          </nav>
          <h1 className="text-xl font-bold text-tx">病歴要約ジェネレーター</h1>
          <p className="text-xs text-muted mt-1">J-OSLER「病歴要約 作成と評価の手引き」準拠 / AI不使用 / データ非保持</p>
        </div>

        {/* 免責 */}
        <div className="bg-acl border border-ac/20 rounded-xl p-3 mb-6 text-xs" style={{ color: MC }}>
          <p className="font-bold mb-1">プライバシー保護</p>
          <p>入力データは一切サーバーに送信されません。すべてブラウザ上で処理され、ページを閉じると消去されます。AIは使用していません。</p>
        </div>

        {/* セクション入力 */}
        <div className="space-y-4">
          {SECTIONS.map(s => (
            <div key={s.id} className="bg-s0 border border-br rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-tx flex items-center gap-1.5">
                  {s.title}
                  {s.required && <span className="text-[9px] px-1 py-0.5 rounded bg-dnl text-dn font-bold">必須</span>}
                </label>
                <span className={`text-[10px] font-mono ${charCount(s.id) > s.maxChars ? 'text-dn font-bold' : 'text-muted'}`}>
                  {charCount(s.id)}/{s.maxChars}
                </span>
              </div>
              <p className="text-[10px] text-muted mb-2">{s.hint}</p>
              {s.rows === 1 ? (
                <input
                  type="text"
                  value={values[s.id]}
                  onChange={e => updateValue(s.id, e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none"
                />
              ) : (
                <textarea
                  value={values[s.id]}
                  onChange={e => updateValue(s.id, e.target.value)}
                  rows={s.rows}
                  className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none resize-y leading-relaxed"
                  style={{ fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 文字数サマリー + アクション */}
        <div className="sticky bottom-16 md:bottom-0 z-10 mt-4 pt-2 pb-1" style={{ background: 'linear-gradient(transparent, var(--bg) 8px)' }}>
          <div className="bg-s0 border border-br rounded-xl p-3 flex items-center justify-between">
            <div className="text-xs text-muted">
              合計: <span className="font-bold text-tx">{totalChars}</span>文字
              <span className="ml-2">要確認: <span className="font-bold text-wn">{getConfirmList().length}</span>箇所</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('preview')}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-br text-muted hover:text-ac hover:border-ac/30 transition-colors"
              >
                プレビュー
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors"
                style={{ background: MC }}
              >
                {copied ? '✓ コピー済み' : 'コピー'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── プレビュー画面 ──
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setStep('edit')} className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          編集に戻る
        </button>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="px-4 py-2 rounded-lg text-xs font-medium border border-br text-muted hover:text-ac transition-colors">
            {copied ? '✓ コピー済み' : 'テキストコピー'}
          </button>
          <button onClick={handlePrint} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: MC }}>
            印刷 / PDF
          </button>
        </div>
      </div>

      {/* プレビュー本文 */}
      <div className="bg-white border border-br rounded-xl p-6 md:p-8 shadow-sm" style={{ fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif' }}>
        {SECTIONS.map(s => {
          if (!values[s.id]?.trim()) return null
          return (
            <div key={s.id} className="mb-4">
              <h3 className="text-sm font-bold text-tx mb-1">【{s.title}】</h3>
              <p className="text-sm leading-[1.8] whitespace-pre-wrap">
                {values[s.id].split('【要確認】').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="bg-wnl text-wn px-0.5 rounded text-xs font-bold">【要確認】</span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          )
        })}

        {/* 要確認リスト */}
        {getConfirmList().length > 0 && (
          <div className="mt-6 pt-4 border-t border-br">
            <h3 className="text-sm font-bold text-wn mb-2">【要確認リスト】</h3>
            <div className="text-xs text-muted space-y-0.5">
              {getConfirmList().map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 評価チェックリスト */}
      <div className="mt-6 bg-s0 border border-br rounded-xl p-4">
        <h3 className="text-sm font-bold text-tx mb-3">自己評価チェックリスト</h3>
        <div className="space-y-2 text-xs text-muted">
          {[
            '基本的記載: 文体統一（常体）/ 句読点「,」「.」/ 略語の初出注記 / 個人情報匿名化 / A4 2枚80%以上',
            '症例選択: 主病名が提出領域の疾患であること',
            '診断プロセス: 陰性所見 / 鑑別診断の明示と除外根拠',
            '治療法: 薬剤一般名 / 治療選択の妥当性',
            '考察: EBM重視 / 文献2-3本引用',
            '倫理的妥当性: 患者の社会的・心理的背景への配慮',
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
