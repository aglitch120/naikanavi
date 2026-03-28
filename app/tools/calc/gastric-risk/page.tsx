'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gastric-risk')!
const riskGroups = [
  { group: '低リスク', conditions: 'H.pylori未感染 or 除菌後（萎縮C-1以下・IM無し）', interval: '必要に応じて', color: 'bg-okl' },
  { group: '中リスク', conditions: '除菌後（萎縮C-2〜C-3・軽度IM）', interval: '2-3年ごと', color: 'bg-wnl' },
  { group: '高リスク', conditions: '除菌後（萎縮O-1以上 or 中等度以上IM）', interval: '1年ごと', color: 'bg-dnl' },
  { group: '最高リスク', conditions: '未除菌 or 除菌後（高度萎縮O-2以上＋広範囲IM）', interval: '年1回以上', color: 'bg-dnl' },
]
export default function GastricRiskPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>内視鏡的萎縮度(木村・竹本分類)と腸上皮化生の程度から胃癌サーベイランス間隔を決定。除菌後も発癌リスクは残存。</p></div>}
      relatedTools={[{slug:'kyoto-classification',name:'京都分類'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-3">{riskGroups.map(r=>(
        <div key={r.group} className={`p-4 rounded-xl border border-br ${r.color}`}>
          <p className="text-sm font-bold text-tx">{r.group}</p>
          <p className="text-xs text-muted mt-1">{r.conditions}</p>
          <p className="text-xs font-medium text-tx mt-1">参考サーベイランス間隔: {r.interval}</p>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
