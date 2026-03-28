'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pneumothorax-class')!
const classes = [
  { grade: 'I度（軽度）', desc: '肺尖が鎖骨より上。虚脱率 <20%程度。', tx: '経過観察（安静+O₂投与）。小さければ自然吸収を期待。', color: 'bg-okl' },
  { grade: 'II度（中等度）', desc: '虚脱率 20-50%程度。Light index中等度。', tx: '脱気（穿刺吸引 or 胸腔ドレーン）。初回かつ呼吸困難なければ穿刺吸引を先行。', color: 'bg-wnl' },
  { grade: 'III度（高度）', desc: '虚脱率 >50%。完全虚脱や緊張性気胸。', tx: '胸腔ドレーン挿入。緊張性気胸なら緊急脱気（第4-5肋間中腋窩線（前腋窩線〜中腋窩線 = 安全の三角）が推奨。第2肋間鎖骨中線は古典的手技）。手技の最終判断は指導医と相談の上で行うこと。', color: 'bg-dnl' },
]
export default function PneumothoraxClassPage() {
  const [selected, setSelected] = useState(0)
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={selected===0?'ok':selected===1?'wn':'dn'}
        value={classes[selected].grade} interpretation={`${classes[selected].desc}\n\n治療方針: ${classes[selected].tx}`} />}
      explanation={<div className="text-sm text-muted"><p>Light index: 1 - (虚脱した肺の直径³/胸腔の直径³)で虚脱率を推算。BTS/JSRSガイドラインに基づく。再発例・持続air leakは胸腔鏡手術(VATS)を検討。</p></div>}
      relatedTools={[]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-2">{classes.map((c,i)=>(
        <button key={i} onClick={()=>setSelected(i)}
          className={`w-full text-left p-4 rounded-xl transition-all ${selected===i?'ring-2 ring-ac/50':''} ${c.color} border border-br`}>
          <p className="text-sm font-bold text-tx">{c.grade}</p>
          <p className="text-xs text-muted mt-1">{c.desc}</p>
        </button>
      ))}</div>
    </CalculatorLayout>
  )
}
