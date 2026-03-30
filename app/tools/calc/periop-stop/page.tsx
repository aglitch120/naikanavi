'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('periop-stop')!
export default function Page() {
  return (
    <CalculatorLayout slug={toolDef.slug} title="周術期の中止薬一覧（提供終了）" titleEn="Perioperative Drug Cessation (Discontinued)"
      description="本ツールの提供は終了しました。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="bg-dnl border border-dnb rounded-xl p-4">
        <p className="font-bold text-dn text-sm mb-2">本ツールは提供を終了しました</p>
        <p className="text-xs text-dn">周術期の中止薬に関するエビデンスは頻繁に更新され、薬剤ごと・手術種類ごとに判断が異なります。固定的な一覧表示は最新ガイドラインと乖離するリスクが高く、患者安全上の懸念があるため提供を中止しました。各施設のプロトコル・最新ガイドライン・担当医の判断に基づいてください。</p>
      </div>}
      relatedTools={[{ slug: 'rcri', name: 'RCRI' }]}
      references={[]}
    ><div /></CalculatorLayout>
  )
}
