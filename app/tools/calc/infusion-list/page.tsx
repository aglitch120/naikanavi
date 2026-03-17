'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('infusion-list')!
const data=[
  {name:'生理食塩水',na:154,k:0,cl:154,ca:0,lac:0,glu:0,osm:308},
  {name:'リンゲル液',na:147,k:4,cl:156,ca:4.5,lac:0,glu:0,osm:309},
  {name:'乳酸リンゲル',na:130,k:4,cl:109,ca:3,lac:28,glu:0,osm:275},
  {name:'酢酸リンゲル',na:130,k:4,cl:109,ca:3,lac:0,glu:0,osm:275,note:'乳酸→酢酸28mEq'},
  {name:'1号液(開始液)',na:90,k:0,cl:70,ca:0,lac:20,glu:26,osm:300,note:'細胞外液型+ブドウ糖'},
  {name:'2号液(脱水補給液)',na:84,k:20,cl:66,ca:0,lac:20,glu:33,osm:320,note:'K含有。腎機能確認'},
  {name:'3号液(維持液)',na:35,k:20,cl:35,ca:0,lac:20,glu:43,osm:290,note:'維持輸液の標準'},
  {name:'4号液(術後回復液)',na:30,k:0,cl:20,ca:0,lac:10,glu:50,osm:230,note:'低張液。K含まない'},
  {name:'5%ブドウ糖液',na:0,k:0,cl:0,ca:0,lac:0,glu:50,osm:278,note:'自由水補給'},
]
export default function InfusionListPage(){
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">輸液製剤の選択</h2><p>細胞外液補充→生食/リンゲル。維持輸液→3号液。脱水→1-2号液。自由水補給→5%Glu。高Na血症→5%Glu or 0.45%NaCl。</p></section>}
      relatedTools={[]} references={[{text:'日本輸液学会. 輸液療法のガイドライン'}]}
    >
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead><tr className="bg-s1">{['製剤','Na','K','Cl','Ca','乳酸','Glu%','浸透圧'].map(h=><th key={h} className="p-2 font-bold text-tx border-b border-br text-center">{h}</th>)}</tr></thead>
          <tbody>{data.map((d,i)=>(
            <tr key={i} className={i%2===0?'bg-s0':'bg-bg'}>
              <td className="p-2 font-bold text-tx border-b border-br whitespace-nowrap">{d.name}{d.note&&<span className="block text-[10px] font-normal text-muted">{d.note}</span>}</td>
              <td className="p-2 text-center border-b border-br">{d.na||'-'}</td><td className="p-2 text-center border-b border-br">{d.k||'-'}</td>
              <td className="p-2 text-center border-b border-br">{d.cl||'-'}</td><td className="p-2 text-center border-b border-br">{d.ca||'-'}</td>
              <td className="p-2 text-center border-b border-br">{d.lac||'-'}</td><td className="p-2 text-center border-b border-br">{d.glu||'-'}</td>
              <td className="p-2 text-center border-b border-br">{d.osm}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </CalculatorLayout>
  )
}
