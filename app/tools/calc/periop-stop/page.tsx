'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('periop-stop')!
const drugs=[
  {cat:'抗血小板薬',items:[{name:'アスピリン',stop:'冠動脈ステント留置患者以外: 7-10日前',note:'低リスク手術では継続も可'},{name:'クロピドグレル',stop:'5-7日前',note:'DESは12ヶ月以内の中止は要循環器科相談'},{name:'プラスグレル',stop:'7-14日前',note:''},{name:'チカグレロル',stop:'5日前',note:''}]},
  {cat:'抗凝固薬',items:[{name:'ワルファリン',stop:'5日前（PT-INR<1.5確認）',note:'高リスク: ヘパリンブリッジ検討'},{name:'ダビガトラン',stop:'CCr≧50: 2日前、CCr 30-49: 4日前',note:'高出血リスク手術はさらに1日追加'},{name:'リバーロキサバン',stop:'2日前（高リスク: 3日前）',note:''},{name:'アピキサバン',stop:'2日前（高リスク: 3日前）',note:''},{name:'エドキサバン',stop:'2日前',note:''}]},
  {cat:'糖尿病治療薬',items:[{name:'メトホルミン',stop:'手術当日朝から中止',note:'腎機能に応じて術後再開'},{name:'SGLT2阻害薬',stop:'3-5日前（大手術では4-5日前）',note:'周術期DKAリスク'},{name:'SU剤/グリニド',stop:'手術当日朝から中止',note:'低血糖リスク'},{name:'インスリン',stop:'投与量調整（中止しない）',note:'麻酔科・担当医と個別に調整'}]},
  {cat:'その他',items:[{name:'MTX（メトトレキサート）',stop:'継続 or 1週間休薬',note:'施設により異なる'},{name:'経口避妊薬/HRT',stop:'4週間前',note:'VTEリスク'}]},
]
export default function PeriopStopPage(){
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]} result={null}
      explanation={undefined}
      relatedTools={[]} references={[{text:'各薬剤添付文書・日本循環器学会ガイドライン'},{text:'各学会ガイドライン（麻酔科・循環器科・糖尿病内科等）'}]}
    >
      <p className="text-[10px] text-wn bg-wnl border border-wnb rounded-lg px-3 py-2 mb-4">休薬期間は担当科（循環器科・麻酔科）と相談のうえ個別に決定すること</p>
      <div className="space-y-6">{drugs.map(c=>(
        <div key={c.cat}><p className="text-sm font-bold text-ac mb-2">{c.cat}</p>
          <div className="space-y-2">{c.items.map(d=>(
            <div key={d.name} className="bg-s0 border border-br rounded-lg p-3">
              <p className="text-sm font-bold text-tx">{d.name}</p>
              <p className="text-xs text-ac font-medium">休薬: {d.stop}</p>
              {d.note&&<p className="text-xs text-muted mt-1">{d.note}</p>}
            </div>
          ))}</div>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
