'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('anemia-criteria')!
export default function AnemiaCriteriaPage() {
  const [hb, setHb] = useState('11.0')
  const [mcv, setMcv] = useState('')
  const [sex, setSex] = useState<'male'|'female'|'pregnant'>('male')
  const result = useMemo(() => {
    const h = parseFloat(hb), m = parseFloat(mcv)
    if (!h) return null
    const threshold = sex === 'male' ? 13.0 : sex === 'female' ? 12.0 : 11.0
    const isAnemia = h < threshold
    let severity: 'ok'|'wn'|'dn' = 'ok', grade = '', mcvType = ''
    if (!isAnemia) { grade = '貧血なし' }
    else if (h >= 10) { grade = '軽度貧血（Hb 10.0〜基準値未満）'; severity = 'wn' }
    else if (h >= 8) { grade = '中等度貧血（Hb 8.0〜9.9）'; severity = 'dn' }
    else { grade = '重度貧血（Hb < 8.0） — 輸血を検討'; severity = 'dn' }
    if (m) {
      if (m < 80) mcvType = '小球性（鉄欠乏・サラセミア・慢性疾患）'
      else if (m <= 100) mcvType = '正球性（急性出血・溶血・腎性・慢性疾患）'
      else mcvType = '大球性（VitB12/葉酸欠乏・MDS・肝疾患・甲状腺機能低下）'
    }
    return { isAnemia, threshold, grade, mcvType, severity }
  }, [hb, mcv, sex])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity}
        value={result.isAnemia ? `${result.grade}（基準: Hb < ${result.threshold} g/dL）` : '貧血なし'}
        interpretation={result.mcvType ? `MCV分類: ${result.mcvType}\n\nWHO基準:\n• 成人男性: Hb < 13.0 g/dL\n• 成人女性(非妊娠): Hb < 12.0 g/dL\n• 妊婦: Hb < 11.0 g/dL` : ''} /> : null}
      explanation={<div className="text-sm text-muted"><p>MCV分類により鑑別疾患を絞り込む。網赤血球(RPI)・血清鉄・フェリチン・TSAT・VitB12・葉酸で精査。</p></div>}
      relatedTools={[{slug:'tsat',name:'TSAT'},{slug:'rpi',name:'RPI'},{slug:'iron-deficit',name:'鉄欠乏量'}]}
      references={toolDef.sources||[]}
    >
      <div className="flex gap-2 mb-3">
        {([['male','男性'],['female','女性(非妊娠)'],['pregnant','妊婦']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setSex(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sex===v?'bg-ac text-white':'bg-s1 text-muted'}`}>{l}</button>
        ))}
      </div>
      <NumberInput label="Hb (g/dL)" value={hb} onChange={setHb} step={0.1} />
      <NumberInput label="MCV (fL) ※任意" value={mcv} onChange={setMcv} />
    </CalculatorLayout>
  )
}
