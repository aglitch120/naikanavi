'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('geckler')!
const data=[
  {group:'1群',epithelial:'>25',neutrophil:'<10',quality:'不良',action:'再提出'},
  {group:'2群',epithelial:'>25',neutrophil:'10-25',quality:'不良',action:'再提出'},
  {group:'3群',epithelial:'>25',neutrophil:'>25',quality:'不良〜可',action:'判断に注意'},
  {group:'4群',epithelial:'10-25',neutrophil:'>25',quality:'良質',action:'培養可'},
  {group:'5群',epithelial:'<10',neutrophil:'>25',quality:'最良',action:'培養が一般的'},
  {group:'6群',epithelial:'<25',neutrophil:'<25',quality:'膿性でない',action:'培養適否は担当医が判断'},
]
export default function GecklerPage(){
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]} result={null}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Geckler RW et al. Microscopic and bacteriological comparison of paired sputa and transtracheal aspirates. J Clin Microbiol 1977;6:396-399'}]}
    >
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-s1">{['群','扁平上皮(/LPF)','好中球(/LPF)','検体品質','判断'].map(h=><th key={h} className="p-2 font-bold text-tx border-b border-br text-center">{h}</th>)}</tr></thead>
          <tbody>{data.map((d,i)=>(
            <tr key={i} className={`${i%2===0?'bg-s0':'bg-bg'} ${i>=3&&i<=4?'font-medium':''}`}>
              <td className={`p-2 text-center border-b border-br ${i>=3&&i<=4?'text-ac font-bold':''}`}>{d.group}</td>
              <td className="p-2 text-center border-b border-br">{d.epithelial}</td>
              <td className="p-2 text-center border-b border-br">{d.neutrophil}</td>
              <td className={`p-2 text-center border-b border-br ${d.quality==='最良'?'text-ac font-bold':d.quality==='良質'?'text-ac':''}`}>{d.quality}</td>
              <td className="p-2 text-center border-b border-br">{d.action}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </CalculatorLayout>
  )
}
