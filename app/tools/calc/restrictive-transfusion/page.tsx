'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('restrictive-transfusion')!
const data = [
  { condition: '一般的な入院患者', trigger: '7.0', target: '7-9', evidence: 'TRICC (1999), TRISS (2014)' },
  { condition: '重症敗血症', trigger: '7.0', target: '7-9', evidence: 'TRISS (2014)' },
  { condition: '術後（整形外科）', trigger: '8.0', target: '8-10', evidence: 'FOCUS (2011)' },
  { condition: '心臓手術後', trigger: '7.5', target: '7.5-9', evidence: 'TITRe2 (2015)' },
  { condition: '急性冠症候群 (ACS)', trigger: '8.0-10', target: '8-10', evidence: 'REALITY (2021), MINT (2023)' },
  { condition: '上部消化管出血', trigger: '7.0', target: '7-9', evidence: 'Villanueva (2013)' },
  { condition: '脳卒中（急性期）', trigger: '7.0-8.0', target: '検討中', evidence: 'エビデンス限定的' },
  { condition: '慢性貧血・安定', trigger: '7.0', target: '7-8', evidence: '各ガイドライン' },
  { condition: '血液悪性腫瘍', trigger: '7.0-8.0', target: '状態による', evidence: '各施設基準' },
]
export default function RestrictiveTransfusionPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>制限的輸血戦略はほとんどの患者群で自由輸血と同等以上の転帰。ただしACSでは議論が続く（MINT 2023）。</p><p className="mt-1">症状（頻脈・低血圧・胸痛・呼吸困難）がある場合はHb値に関わらず輸血を検討。</p></div>}
      relatedTools={[{slug:'rbc-transfusion-hb',name:'RBC輸血Hb上昇'},{slug:'anemia-criteria',name:'貧血の診断基準'}]}
      references={toolDef.sources||[]}
    >
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs border-collapse min-w-[500px]">
          <thead><tr className="bg-s1">
            <th className="p-2 font-bold text-tx border-b border-br text-left">臨床状況</th>
            <th className="p-2 font-bold text-tx border-b border-br text-center">トリガーHb<br/>(g/dL)</th>
            <th className="p-2 font-bold text-tx border-b border-br text-center">目標Hb</th>
            <th className="p-2 font-bold text-tx border-b border-br text-left">主要エビデンス</th>
          </tr></thead>
          <tbody>{data.map((d,i)=>(
            <tr key={i} className={i%2===0?'bg-s0':'bg-bg'}>
              <td className="p-2 font-medium text-tx border-b border-br">{d.condition}</td>
              <td className="p-2 text-center font-bold text-tx border-b border-br">{d.trigger}</td>
              <td className="p-2 text-center text-tx border-b border-br">{d.target}</td>
              <td className="p-2 text-muted border-b border-br">{d.evidence}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </CalculatorLayout>
  )
}
