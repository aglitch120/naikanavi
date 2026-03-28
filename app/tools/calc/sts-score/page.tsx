'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('sts-score')!
export default function StsScorePage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="space-y-3 text-sm text-muted">
        <p>STSスコアは入力項目が50以上あり、公式計算ツールの利用が推奨されます。</p>
        <p><strong className="text-tx">評価対象手術:</strong> CABG単独 / 弁置換単独 / CABG+弁置換 / その他</p>
        <p><strong className="text-tx">主要入力項目:</strong> 年齢・性別・BMI・糖尿病・透析・LVEF・NYHA・直近MI・PCI歴・脳卒中歴・COPD・末梢血管疾患・手術緊急度など</p>
        <p><strong className="text-tx">出力:</strong> 術後死亡率(%) / 脳卒中率 / 腎不全率 / 長期挿管率 / 再手術率 / 深部胸骨感染率</p>
        <div className="bg-wnl border border-wnb rounded-lg p-3 mt-2">
          <p className="text-wn text-xs">TAVI vs SAVR の術式選択判断にSTSスコアが使用されます（STS≧8%で高リスク→TAVI考慮）（術式選択は心臓チームによる総合判断が必須）。</p>
        </div>
      </div>}
      relatedTools={[{slug:'rcri',name:'RCRI'},{slug:'ascvd',name:'ASCVD'}]}
      references={toolDef.sources||[]}
    >
      <div className="text-center py-8">
        <p className="text-sm text-muted mb-4">STSスコアは公式サイトで計算してください（英語）</p>
        <a href="https://riskcalc.sts.org/" target="_blank" rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-ac text-white rounded-xl text-sm font-bold hover:bg-ac2 transition-all">
          STS Risk Calculator（外部サイト）→
        </a>
        <p className="text-xs text-muted mt-3">riskcalc.sts.org — Society of Thoracic Surgeons 公式</p>
      </div>
    </CalculatorLayout>
  )
}
