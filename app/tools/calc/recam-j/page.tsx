'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('recam-j')!
export default function RecamjPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="space-y-3 text-sm text-muted">
        <p><strong className="text-tx">RECAM-J 2023の構造:</strong></p>
        <p>DDW-J 2004の後継。肝細胞障害型と胆汁うっ滞/混合型で別々のスコアリングシートを使用。</p>
        <div className="bg-s0 p-3 rounded-lg border border-br">
          <p className="font-bold text-tx mb-1">Step 1: R ratioで型を判定</p>
          <p>R ≧ 5: 肝細胞障害型 / R ≦ 2: 胆汁うっ滞型 / 2 &lt; R &lt; 5: 混合型</p>
        </div>
        <div className="bg-s0 p-3 rounded-lg border border-br">
          <p className="font-bold text-tx mb-1">Step 2: 各型のスコアシートで評価</p>
          <p>① 発症様式と時間経過 ② 中止後の経過 ③ 他原因の除外 ④ 薬剤情報（過去の報告） ⑤ 再投与の結果</p>
        </div>
        <div className="bg-s0 p-3 rounded-lg border border-br">
          <p className="font-bold text-tx mb-1">判定</p>
          <p>≧9: 極めて高い / 6-8: 高い / 3-5: あり得る / 1-2: 低い / ≦0: 除外的</p>
        </div>
        <p className="text-wn bg-wnl p-2 rounded-lg border border-wnb">※ 完全なスコアリングシートは日本肝臓学会のRECAM-J原著を参照してください。項目数が多く著作権に配慮し、ここでは構造の概要のみ記載しています。</p>
      </div>}
      relatedTools={[{slug:'r-ratio',name:'R ratio'},{slug:'ddw-j-dili',name:'DDW-J 2004'},{slug:'child-pugh',name:'Child-Pugh'}]}
      references={toolDef.sources||[]}
    >
      <div className="text-center py-6">
        <p className="text-sm text-muted mb-3">まずR ratioで肝障害型を判定してください</p>
        <a href="/tools/calc/r-ratio" className="inline-block px-4 py-2 bg-ac text-white rounded-lg text-sm font-bold hover:bg-ac2 transition-all">R ratioを計算する →</a>
      </div>
    </CalculatorLayout>
  )
}
