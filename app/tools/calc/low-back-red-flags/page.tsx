'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('low-back-red-flags')!
const flags = [
  { item: '発症年齢 <20歳 or >55歳', category: '悪性腫瘍' },
  { item: '悪性腫瘍の既往', category: '悪性腫瘍' },
  { item: '原因不明の体重減少', category: '悪性腫瘍' },
  { item: '安静時痛・夜間痛', category: '悪性腫瘍/感染' },
  { item: '発熱', category: '感染' },
  { item: '免疫抑制状態（ステロイド・HIV等）', category: '感染' },
  { item: '静注薬物使用歴', category: '感染' },
  { item: '最近の脊椎手術・処置', category: '感染' },
  { item: '重大な外傷（高齢者は軽微な外傷も）', category: '骨折' },
  { item: 'ステロイド長期使用', category: '骨折' },
  { item: '膀胱直腸障害（尿閉・便失禁）', category: '馬尾症候群' },
  { item: 'サドル麻痺（会陰部の感覚低下）', category: '馬尾症候群' },
  { item: '進行性の下肢筋力低下', category: '馬尾症候群' },
  { item: '広範な神経症状（多髄節にわたる）', category: '馬尾症候群' },
]
export default function LowBackRedFlagsPage() {
  const [checked, setChecked] = useState<boolean[]>(flags.map(()=>false))
  const result = useMemo(() => {
    const count = checked.filter(Boolean).length
    const cats = new Set(flags.filter((_,i)=>checked[i]).map(f=>f.category))
    let severity: 'ok'|'wn'|'dn' = 'ok', interpretation = ''
    if (cats.has('馬尾症候群')) { interpretation = '⚠️ 馬尾症候群の疑い → 緊急MRIを検討。専門科への相談を推奨'; severity = 'dn' }
    else if (count > 0) { interpretation = `${count}項目該当。${Array.from(cats).join('・')}の可能性 → 画像検査(MRI)を検討`; severity = 'wn' }
    else { interpretation = 'レッドフラッグなし。非特異的腰痛として保存的治療。4-6週で改善なければ再評価。' }
    return { count, severity, interpretation }
  }, [checked])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={result.count > 0 ? `レッドフラッグ ${result.count}項目該当` : 'レッドフラッグなし'} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>腰痛の85%は非特異的腰痛。レッドフラッグがなければ画像検査は不要（発症4-6週以内）。</p></div>}
      relatedTools={[]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-1.5">{flags.map((f,i)=>(
        <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${checked[i]?'bg-wnl border border-wnb':'bg-s0 border border-br'}`}>
          <input type="checkbox" checked={checked[i]} onChange={()=>{const n=[...checked];n[i]=!n[i];setChecked(n)}} className="accent-[var(--ac)]"/>
          <span className="text-xs text-tx flex-1">{f.item}</span>
          <span className="text-[10px] text-muted shrink-0">{f.category}</span>
        </label>
      ))}</div>
    </CalculatorLayout>
  )
}
