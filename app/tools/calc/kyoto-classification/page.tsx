'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('kyoto-classification')!
const findings = [
  { name: '萎縮 (Atrophy)', grades: ['C-0（なし）','C-1（前庭部限局）','C-2（体部小弯）','C-3（体部大弯に及ぶ）','O-1（体部全体）','O-2（前庭部にも及ぶ）','O-3（全体高度萎縮）'], significance: '木村・竹本分類。C→O→の順に萎縮進行。O-2以上で胃癌リスク高。' },
  { name: '腸上皮化生 (IM)', grades: ['なし','軽度（限局的）','中等度','高度（広範囲）'], significance: 'IM+高度萎縮は最も胃癌リスクが高い。除菌後も発癌監視が必要。' },
  { name: 'びまん性発赤 (Diffuse redness)', grades: ['なし','軽度','高度'], significance: '現感染のマーカー。除菌成功後は消退。' },
  { name: '皺襞腫大 (Enlarged folds)', grades: ['なし','あり'], significance: '体部主体の現感染所見。H.pylori除菌で改善。' },
  { name: '鳥肌 (Nodularity)', grades: ['なし','あり'], significance: '若年女性に多い。未分化型胃癌のリスク因子とされる。' },
]
export default function KyotoClassificationPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>5つの内視鏡所見からH.pylori感染状態と胃癌リスクを評価。未感染/現感染/既感染の判定に使用。</p></div>}
      relatedTools={[{slug:'gastric-risk',name:'胃癌リスクスコア'},{slug:'la-classification',name:'LA分類'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">{findings.map(f=>(
        <div key={f.name} className="p-4 bg-s0 rounded-xl border border-br">
          <h3 className="text-sm font-bold text-tx mb-1">{f.name}</h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {f.grades.map((g,i)=><span key={i} className="text-[11px] bg-s1 px-2 py-0.5 rounded-full text-tx">{g}</span>)}
          </div>
          <p className="text-xs text-muted">{f.significance}</p>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
