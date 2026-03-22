'use client'

import { useState, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { getTemplateByDisease, type DiseaseTemplate } from '@/lib/josler-templates'
import { generateJoslerPrompt, generateRefinePrompt } from '@/lib/josler-prompt-generator'
import { SPECIALTIES as SP, DISEASE_GROUPS as DG } from '@/lib/josler-data'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

export default function SummaryGeneratorPage() {
  return <Suspense fallback={<div className="text-center py-20 text-muted text-sm">読み込み中...</div>}><SummaryGeneratorInner /></Suspense>
}

function SummaryGeneratorInner() {
  // Step 1: カルテ貼り付け
  const [karteInput, setKarteInput] = useState('')
  const [karteConsent, setKarteConsent] = useState(false)

  // Step 2: 疾患選択
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDisease, setSelectedDisease] = useState('')

  // State
  const [promptCopied, setPromptCopied] = useState<string>('')
  const [showTutorial, setShowTutorial] = useState(false)

  const activeTemplate = useMemo(() =>
    selectedDisease ? getTemplateByDisease(selectedDisease) : undefined
  , [selectedDisease])

  const diseaseGroups = useMemo(() => {
    if (!selectedSpecialty) return []
    return DG[selectedSpecialty] || []
  }, [selectedSpecialty])

  // プロンプト生成（カルテデータ込み）
  const generatePrompt = useCallback(() => {
    const basePrompt = generateJoslerPrompt(selectedDisease, activeTemplate)
    if (karteInput.trim()) {
      return basePrompt.replace(
        '（ここに匿名化済みのカルテ情報を貼り付けてください）',
        karteInput.trim()
      )
    }
    return basePrompt
  }, [selectedDisease, activeTemplate, karteInput])

  const handleCopyPrompt = useCallback((type: 'new' | 'refine') => {
    const prompt = type === 'new' ? generatePrompt() : generateRefinePrompt(karteInput)
    navigator.clipboard.writeText(prompt).then(() => {
      setPromptCopied(type)
      setTimeout(() => setPromptCopied(''), 6000)
    })
  }, [generatePrompt, karteInput])

  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-xs text-muted mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-ac">ホーム</Link><span>›</span>
        <Link href="/josler" className="hover:text-ac">JOSLER</Link><span>›</span>
        <span>病歴要約ジェネレーター</span>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-tx mb-1">病歴要約ジェネレーター</h1>
          <p className="text-xs text-muted">J-OSLER手引き準拠 / AI不使用 / データ非保持</p>
        </div>
        <button onClick={() => setShowTutorial(!showTutorial)}
          className="text-xs px-2.5 py-1 rounded-lg border border-br text-muted hover:text-ac">
          使い方
        </button>
      </div>

      {/* チュートリアル */}
      {showTutorial && (
        <div className="bg-acl border border-ac/20 rounded-xl p-4 mb-4 text-xs" style={{ color: MC }}>
          <p className="font-bold mb-2">3ステップで病歴要約プロンプトを生成</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li><strong>カルテ貼り付け</strong> — 匿名化済みカルテ情報を入力（任意）</li>
            <li><strong>疾患選択</strong> — 領域→疾患を選択</li>
            <li><strong>プロンプトコピー</strong> — AIに貼り付けて病歴要約を生成</li>
          </ol>
          <p className="mt-2 text-[10px] opacity-80">iworはプロンプトを生成するだけ。カルテデータはブラウザ上で処理され、ページを閉じると消去されます。</p>
        </div>
      )}

      {/* ─── Step 1: カルテ貼り付け ─── */}
      <div className="bg-s0 border border-br rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: MC }}>1</span>
          <h2 className="text-sm font-bold text-tx">カルテ情報の貼り付け（任意）</h2>
        </div>

        <label className="flex items-start gap-2 cursor-pointer bg-wnl border border-wnb rounded-lg p-3 mb-3 text-[11px] text-wn">
          <input type="checkbox" checked={karteConsent}
            onChange={e => setKarteConsent(e.target.checked)}
            className="mt-0.5 rounded flex-shrink-0" />
          <span>入力する情報は<strong>匿名化済み</strong>で、患者同意を取得済みかつ施設規則に合致していることを確認しました。</span>
        </label>

        {karteConsent ? (
          <textarea value={karteInput} onChange={e => setKarteInput(e.target.value)}
            rows={8} placeholder={"匿名化済みのカルテ情報をここに貼り付け。\n\n「主訴:」「現病歴:」「検査:」等のヘッダーがあると精度が上がります。"}
            className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-xs focus:border-ac outline-none resize-y leading-relaxed" />
        ) : (
          <div className="w-full px-3 py-6 bg-s1 border border-br rounded-lg text-center">
            <p className="text-xs text-muted">上のチェックを入れると入力欄が表示されます</p>
          </div>
        )}

        <p className="mt-1 text-[8px] text-muted">※ データはサーバーに送信されません。ページを閉じると消去されます。匿名化・同意取得は利用者の責任です。</p>
      </div>

      {/* ─── Step 2: 疾患選択 ─── */}
      <div className="bg-s0 border border-br rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: MC }}>2</span>
          <h2 className="text-sm font-bold text-tx">疾患を選択</h2>
        </div>

        {/* 領域選択 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
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

        {/* 疾患選択 */}
        {selectedSpecialty && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {diseaseGroups.map((dg: any) => (
              <div key={dg.id}>
                <p className="text-[10px] font-bold text-muted mb-1">{dg.name}</p>
                <div className="flex flex-wrap gap-1">
                  {dg.diseases.map((d: string) => (
                    <button key={d} onClick={() => setSelectedDisease(d)}
                      className="px-2 py-1 rounded text-[10px] border transition-all"
                      style={{
                        background: selectedDisease === d ? MCL : 'transparent',
                        color: selectedDisease === d ? MC : 'var(--tx)',
                        borderColor: selectedDisease === d ? MC : 'var(--br)',
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Step 3: プロンプト生成・コピー ─── */}
      <div className="bg-s0 border border-ac/30 rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: MC }}>3</span>
          <h2 className="text-sm font-bold text-tx">プロンプトをコピーしてAIに貼り付け</h2>
        </div>

        <div className="flex gap-2 mb-2">
          <button onClick={() => handleCopyPrompt('new')}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: promptCopied === 'new' ? 'var(--ok)' : MC, color: '#fff' }}>
            {promptCopied === 'new' ? '✓ コピー済み！' : `📋 病歴要約プロンプトをコピー${selectedDisease ? `（${selectedDisease}）` : ''}`}
          </button>
        </div>

        {/* コピー後の誘導 */}
        {promptCopied && (
          <div>
            <div className="bg-okl border border-okb rounded-lg p-2.5 mb-2 text-xs text-ok font-medium text-center">
              クリップボードにコピーしました。下記AIサービスを開いて貼り付けてください。
            </div>
            <div className="flex gap-1.5">
              <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg text-xs font-bold text-center"
                style={{ background: '#10a37f', color: '#fff' }}>ChatGPT</a>
              <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg text-xs font-bold text-center"
                style={{ background: '#d97706', color: '#fff' }}>Claude</a>
              <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg text-xs font-bold text-center"
                style={{ background: '#4285f4', color: '#fff' }}>Gemini</a>
            </div>
          </div>
        )}

        <p className="text-[8px] text-muted mt-2 leading-relaxed">
          ※ iworはプロンプト（書式指示文）を生成するのみです。医療情報の処理は行いません。外部AIサービスでの使用時のデータ匿名化・施設規則遵守はユーザーの責任です。
        </p>
      </div>

      {/* ─── 技術仕様 ─── */}
      <div className="bg-s1 rounded-xl p-3 text-[10px] text-muted space-y-1">
        <p className="font-bold text-tx">技術仕様</p>
        <p>・<strong>AI不使用</strong>: テンプレートエンジンによる機械的な文字列処理のみ</p>
        <p>・<strong>データ非保持</strong>: 入力内容はブラウザのメモリ上でのみ処理</p>
        <p>・<strong>保存なし</strong>: localStorage・Cookie等への保存は一切なし</p>
        <p>・ページを閉じると全データが消去されます</p>
        <p className="pt-1 border-t border-br mt-2 text-[9px]">
          ※ 匿名化・患者同意取得・施設規則遵守は利用者の責任であり、iwor運営者は入力内容に関して一切の責任を負いません。
        </p>
      </div>
    </div>
  )
}
