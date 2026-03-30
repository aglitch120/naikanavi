'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('westley-croup')!
export default function Page() {
  return (
    <CalculatorLayout slug={toolDef.slug} title="Westleyクループスコア（提供終了）" titleEn="Westley Croup Score (Discontinued)"
      description="本ツールの提供は終了しました。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="bg-s0 border border-br rounded-xl p-4">
        <p className="text-sm text-muted">臨床的使用頻度が低いため、本ツールの提供を終了しました。</p>
      </div>}
      relatedTools={[]}
      references={[]}
    ><div /></CalculatorLayout>
  )
}
