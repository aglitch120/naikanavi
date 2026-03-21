'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('cam-icu')!

export default function CamIcuPage() {
  const [feature1, setFeature1] = useState('no')
  const [feature2, setFeature2] = useState('no')
  const [feature3, setFeature3] = useState('no')
  const [feature4, setFeature4] = useState('no')

  const result = useMemo(() => {
    const f1 = feature1 === 'yes'
    const f2 = feature2 === 'yes'
    const f3 = feature3 === 'yes'
    const f4 = feature4 === 'yes'
    const isDelirium = f1 && f2 && (f3 || f4)
    return {
      isDelirium,
      interpretation: isDelirium ? 'CAM-ICU陽性 — せん妄と判定' : 'CAM-ICU陰性 — せん妄なし',
      severity: (isDelirium ? 'dn' : 'ok') as 'ok' | 'wn' | 'dn',
    }
  }, [feature1, feature2, feature3, feature4])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CAM-ICU" value={result.isDelirium ? '陽性' : '陰性'} interpretation={result.interpretation} severity={result.severity}
        details={[{ label: '判定基準', value: '特徴1 + 特徴2 + (特徴3 or 特徴4)' }]} />}
      explanation={<section className="space-y-4 text-sm text-muted">
        <h2 className="text-base font-bold text-tx">CAM-ICUとは</h2>
        <p>ICU患者のせん妄を4つの特徴で評価。非言語的に評価できるため、挿管患者にも使用可能。RASS -3〜+4の患者が対象（RASS -4/-5は評価不能）。</p>
        <h3 className="font-bold text-tx">4つの特徴</h3>
        <p>1. 急性発症 or 変動性の経過、2. 注意力障害、3. 思考の混乱、4. 意識レベルの変容（RASS ≠ 0）。1+2+(3 or 4)でせん妄。</p>
        <h3 className="font-bold text-tx">注意力障害の評価法</h3>
        <p>ASE（Attention Screening Examination）: 「サ・ク・ラ・サ・ク」と聞いて「サ」の時に手を握る。2回以上のエラーで陽性。</p>
      </section>}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Ely EW, et al. JAMA 2001;286:2703-2710' }]}
    >
      <div className="space-y-4">
        <RadioGroup label="特徴1: 急性発症 or 変動性の経過" name="f1" value={feature1} onChange={setFeature1}
          options={[{ value: 'yes', label: 'あり（精神状態がベースラインから急に変化、または24h以内に変動）' }, { value: 'no', label: 'なし' }]} />
        <RadioGroup label="特徴2: 注意力障害" name="f2" value={feature2} onChange={setFeature2}
          options={[{ value: 'yes', label: 'あり（ASE 2回以上エラー）' }, { value: 'no', label: 'なし（ASE 0-1回エラー）' }]} />
        <RadioGroup label="特徴3: 思考の混乱" name="f3" value={feature3} onChange={setFeature3}
          options={[{ value: 'yes', label: 'あり（質問に2回以上誤答 or 指示に従えない）' }, { value: 'no', label: 'なし' }]} />
        <RadioGroup label="特徴4: 意識レベルの変容" name="f4" value={feature4} onChange={setFeature4}
          options={[{ value: 'yes', label: 'あり（RASS ≠ 0）' }, { value: 'no', label: 'なし（RASS = 0: 覚醒・穏やか）' }]} />
      </div>
    </CalculatorLayout>
  )
}
