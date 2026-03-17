'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('hyponatremia-flow')!
export default function Page(){
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">{toolDef.name}</h2><p>{toolDef.description}</p><p className="text-wn font-medium">このツールは準備中です。近日公開予定。</p></section>}
      relatedTools={[]} references={[]}
    ><p className="text-sm text-muted">コンテンツ準備中</p></CalculatorLayout>
  )
}