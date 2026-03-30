'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('cam-icu')!

export default function CamIcuPage() {
  const [rass, setRass] = useState('')
  const [acuteChange, setAcuteChange] = useState('')
  const [aseErrors, setAseErrors] = useState('')
  const [currentRass, setCurrentRass] = useState('')
  const [disorganized, setDisorganized] = useState('')

  const result = useMemo(() => {
    // Step 1: RASS
    if (!rass) return null
    if (rass === 'deep') return { label: '評価中止', detail: 'RASS -4/-5（深鎮静）→ 意識レベル改善後に再評価', severity: 'neutral' as const }

    // Step 2: 精神状態の急性変化
    if (!acuteChange) return null
    if (acuteChange === 'no') return { label: 'CAM-ICU 陰性', detail: 'せん妄なし（精神状態の急性変化なし）', severity: 'ok' as const }

    // Step 3: 注意力欠如（ASE）
    if (!aseErrors) return null
    if (aseErrors === 'low') return { label: 'CAM-ICU 陰性', detail: 'せん妄なし（ASEエラー3未満 → 注意力保たれている）', severity: 'ok' as const }

    // Step 4: 現在のRASS
    if (!currentRass) return null
    if (currentRass !== '0') return { label: 'CAM-ICU 陽性', detail: 'せん妄あり（注意力欠如 + RASS ≠ 0 → 意識レベルの変容）', severity: 'dn' as const }

    // Step 5: 無秩序思考
    if (!disorganized) return null
    if (disorganized === 'yes') return { label: 'CAM-ICU 陽性', detail: 'せん妄あり（注意力欠如 + 無秩序思考）', severity: 'dn' as const }
    return { label: 'CAM-ICU 陰性', detail: 'せん妄なし（無秩序思考なし）', severity: 'ok' as const }
  }, [rass, acuteChange, aseErrors, currentRass, disorganized])

  // 表示するステップを制御
  const showStep2 = rass === 'responsive'
  const showStep3 = showStep2 && acuteChange === 'yes'
  const showStep4 = showStep3 && aseErrors === 'high'
  const showStep5 = showStep4 && currentRass === '0'

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result
        ? <ResultCard label="CAM-ICU" value={result.label} interpretation={result.detail} severity={result.severity} />
        : <ResultCard label="CAM-ICU" value="評価中…" interpretation="各ステップを順に回答してください" severity={'neutral' as const} />
      }
      explanation={<div className="text-sm text-muted space-y-1">
        <p>5ステップの逐次判定フロー。RASS -3以上で評価可能。</p>
        <p className="text-xs">感度93-100%, 特異度98-100%（Ely 2001）。昏睡はせん妄とは見なさない。</p>
      </div>}
      relatedTools={[...(toolDef.relatedSlugs || []).map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[], { slug: 'rass', name: 'RASS' }]}
      references={[{ text: 'Ely EW, et al. Evaluation of delirium in critically ill patients: validation of the CAM-ICU. JAMA 2001;286:2703-2710' }]}
    >
      <div className="space-y-5">
        {/* Step 1 */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 1: 意識レベル（RASS）</p>
          <RadioGroup name="rass" label="RASSスコア" value={rass} onChange={v => { setRass(v); setAcuteChange(''); setAseErrors(''); setCurrentRass(''); setDisorganized('') }}
            options={[
              { value: 'deep', label: 'RASS -4 or -5（深鎮静）→ 評価中止' },
              { value: 'responsive', label: 'RASS -3 以上（呼びかけに応答可能）→ Step 2へ' },
            ]} />
        </div>

        {/* Step 2 */}
        {showStep2 && <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 2: 精神状態の急性変化または変動</p>
          <p className="text-[10px] text-muted">基準線からの精神状態の急性変化の根拠があるか？ 過去24時間以内に精神状態が変動したか？</p>
          <RadioGroup name="acuteChange" label="" value={acuteChange} onChange={v => { setAcuteChange(v); setAseErrors(''); setCurrentRass(''); setDisorganized('') }}
            options={[
              { value: 'yes', label: 'いずれかあり → Step 3へ' },
              { value: 'no', label: 'いずれもなし → 陰性' },
            ]} />
        </div>}

        {/* Step 3 */}
        {showStep3 && <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 3: 注意力の欠如（ASE）</p>
          <div className="bg-s0 border border-br rounded-lg p-2 text-[10px] text-muted space-y-1">
            <p className="font-medium text-tx">聴覚ASE: 「1の数字を聞いたら手を握ってください」</p>
            <p>読み上げ（3秒間隔）: 2 3 1 4 5 7 1 9 3 1</p>
            <p>スコア = 1で握った回数 + 1以外で握らなかった回数（合計0-10点）</p>
          </div>
          <RadioGroup name="aseErrors" label="ASEスコア" value={aseErrors} onChange={v => { setAseErrors(v); setCurrentRass(''); setDisorganized('') }}
            options={[
              { value: 'high', label: 'エラー3以上（ASE 0-7点）→ 注意力欠如あり → Step 4へ' },
              { value: 'low', label: 'エラー3未満（ASE 8-10点）→ 陰性' },
            ]} />
        </div>}

        {/* Step 4 */}
        {showStep4 && <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 4: 現在のRASSスコア</p>
          <RadioGroup name="currentRass" label="現在のRASS" value={currentRass} onChange={v => { setCurrentRass(v); setDisorganized('') }}
            options={[
              { value: 'not0', label: 'RASS ≠ 0 → 陽性（せん妄あり）' },
              { value: '0', label: 'RASS = 0（意識清明）→ Step 5へ' },
            ]} />
        </div>}

        {/* Step 5 */}
        {showStep5 && <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 5: 無秩序思考</p>
          <div className="bg-s0 border border-br rounded-lg p-2 text-[10px] text-muted space-y-1">
            <p className="font-medium text-tx">質問（4問）:</p>
            <p>Q1. 石は水に浮きますか？ Q2. 魚は海にいますか？</p>
            <p>Q3. 1グラムは2グラムより重いですか？ Q4. 釘を打つのにハンマーは使えますか？</p>
            <p className="font-medium text-tx mt-1">指示:</p>
            <p>評価者が2本の指を挙げ「同じように指を挙げてください」→「反対の手で同じことをやってください」（"2本"とは言わない）</p>
          </div>
          <RadioGroup name="disorganized" label="結果" value={disorganized} onChange={setDisorganized}
            options={[
              { value: 'yes', label: '誤答2問以上、または誤答1問+指示に従えない → 陽性' },
              { value: 'no', label: '上記以外 → 陰性' },
            ]} />
        </div>}
      </div>
    </CalculatorLayout>
  )
}
