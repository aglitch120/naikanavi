'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('dic-comprehensive')!
const criteria = [
  { name: '急性期DIC (日本血栓止血学会 2017)', items: [
    '基礎疾患あり（感染症/固形癌/血液悪性腫瘍/大動脈瘤等）: 1点',
    'Plt ≧12万: 0 / 8-12万 or 24h内30%以上↓: 1 / 5-8万: 2 / <5万: 3',
    'FDP 10-25: 1 / ≧25: 3（D-dimer換算: 5-12.5/≧12.5）',
    'フィブリノゲン 100-150: 1 / <100: 2',
    'PT比 1.25-1.67: 1 / ≧1.67: 2',
    '臓器症状(肝/腎/肺)あり: 1',
    '出血症状あり: 1',
  ], cutoff: '≧6点でDIC。4-5点はDIC疑い', color: 'bg-blue-50' },
  { name: 'ISTH overt DIC', items: [
    'DICの基礎疾患あり → 以下をスコアリング',
    'Plt 50,000-100,000: 1 / <50,000: 2',
    'FDP/D-dimer 中等度上昇: 2 / 著明上昇: 3',
    'PT延長 3-6秒: 1 / >6秒: 2',
    'フィブリノゲン <100: 1',
  ], cutoff: '≧5点でovert DIC', color: 'bg-green-50' },
  { name: '産科DIC (日産婦 2024改訂)', items: [
    '基礎疾患: 常位胎盤早期剥離/羊水塞栓/DIC型後産期出血/子癇等',
    '産科DICスコア: 基礎疾患+臨床症状+検査所見',
    '出血量/ショック/臓器症状/凝固検査の複合スコア',
  ], cutoff: '≧8点でDIC（産科基礎疾患がある場合はより低値でも治療開始）', color: 'bg-pink-50' },
]
export default function DicComprehensivePage() {
  const [tab, setTab] = useState(0)
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>急性期DIC基準は感染症関連で感度が高い。ISTHは国際標準だが造血器腫瘍では低感度。産科は独自基準。状況に応じて使い分ける。</p></div>}
      relatedTools={[{slug:'isth-dic',name:'ISTH DICスコア計算'},{slug:'4t-score',name:'4T\'s(HIT)'}]}
      references={toolDef.sources||[]}
    >
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {criteria.map((c,i)=>(
          <button key={i} onClick={()=>setTab(i)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${tab===i?'bg-ac text-white':'bg-s0 border border-br text-muted'}`}>
            {c.name.split('(')[0].trim()}
          </button>
        ))}
      </div>
      <div className={`p-4 rounded-xl border ${criteria[tab].color} border-br`}>
        <h3 className="text-sm font-bold text-tx mb-3">{criteria[tab].name}</h3>
        <div className="space-y-1.5 mb-3">
          {criteria[tab].items.map((item,j)=>(
            <p key={j} className="text-xs text-tx flex gap-2"><span className="text-muted shrink-0">•</span>{item}</p>
          ))}
        </div>
        <div className="bg-white/60 p-2 rounded-lg">
          <p className="text-xs font-bold text-tx">{criteria[tab].cutoff}</p>
        </div>
      </div>
    </CalculatorLayout>
  )
}
