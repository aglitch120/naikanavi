'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('sjs-ten-dihs')!
const diseases = [
  { name: 'SJS (Stevens-Johnson症候群)', criteria: [
    '発熱（38℃以上が多い）',
    '皮膚の紅斑・水疱・びらん（体表面積の10%未満）',
    '口腔・眼・外陰部など2か所以上の粘膜病変',
    'ニコルスキー現象陽性の場合あり',
    '薬剤使用歴（発症1-3週前が多い）',
  ], note: '皮膚剥離面積<10%。10-30%でSJS/TENオーバーラップ。', color: 'bg-wnl border-wnb' },
  { name: 'TEN (中毒性表皮壊死症)', criteria: [
    '全身の紅斑・水疱・びらん（体表面積の30%以上）',
    '発熱（高熱が多い）',
    '粘膜病変（口腔・眼・外陰部）',
    'ニコルスキー現象陽性',
    '表皮の壊死性変化（全層性）',
  ], note: '皮膚剥離面積≧30%。SCORTEN(予後スコア)で重症度評価。', color: 'bg-dnl border-dnb' },
  { name: 'DIHS (薬剤性過敏症候群)', criteria: [
    '限られた薬剤（カルバマゼピン・フェニトイン・アロプリノール・サラゾスルファピリジン等）投与後2-6週で発症',
    '38℃以上の発熱',
    '広範な紅斑・丘疹（皮疹は多形性）',
    '肝機能障害（ALT上昇が多い）',
    'リンパ節腫脹',
    '白血球増多（異型リンパ球出現）/ 好酸球増多',
    'HHV-6再活性化（発症2-3週後にPCR陽性）',
  ], note: '薬剤中止後も症状が遷延・増悪する特徴。自己免疫疾患の後発に注意（甲状腺等）。', color: 'bg-wnl border-wnb' },
]
export default function SjsTenDihsPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>重症薬疹は早期認識と原因薬剤の中止が最重要。眼科・皮膚科への緊急コンサルト必須。</p></div>}
      relatedTools={[{slug:'ctcae',name:'CTCAE'},{slug:'naranjo',name:'Naranjo'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        {diseases.map((d,i)=>(
          <div key={i} className={`p-4 rounded-xl border ${d.color}`}>
            <h3 className="text-sm font-bold text-tx mb-2">{d.name}</h3>
            <div className="space-y-1 mb-2">
              {d.criteria.map((c,j)=><p key={j} className="text-xs text-tx flex gap-2"><span className="text-muted">•</span>{c}</p>)}
            </div>
            <p className="text-[11px] text-muted italic">{d.note}</p>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
