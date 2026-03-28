'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ctcae')!
const grades = [
  { grade: 1, name: '軽症', desc: '症状がない、または軽度。治療を要さない。臨床所見または検査所見のみ。' },
  { grade: 2, name: '中等症', desc: '最小限/局所的/非侵襲的治療を要する。年齢相応のIADL制限。' },
  { grade: 3, name: '重症', desc: '入院または入院期間の延長を要する。身の回りのADL制限。活動不能。' },
  { grade: 4, name: '生命を脅かす', desc: '緊急処置を要する。生命を脅かす。' },
  { grade: 5, name: '死亡', desc: '有害事象による死亡。' },
]
const commonAE = [
  { name: '好中球減少', g1: 'ANC 1500-<LLN', g2: 'ANC 1000-<1500', g3: 'ANC 500-<1000', g4: 'ANC <500' },
  { name: '血小板減少', g1: 'Plt 75,000-<LLN', g2: 'Plt 50,000-<75,000', g3: 'Plt 25,000-<50,000', g4: 'Plt <25,000' },
  { name: '貧血', g1: 'Hb 10.0-<LLN', g2: 'Hb 8.0-<10.0', g3: 'Hb <8.0/輸血要', g4: '生命を脅かす' },
  { name: '発熱性好中球減少', g1: '-', g2: '-', g3: 'ANC<1000 + 体温>38.3℃（単回）または>38.0℃（1時間以上持続）', g4: '生命を脅かす' },
  { name: '悪心', g1: '食欲低下のみ', g2: '経口摂取減少', g3: '経口摂取不能/入院要', g4: '-' },
  { name: '嘔吐', g1: '24h 1-2回', g2: '24h 3-5回', g3: '24h ≧6回/入院要', g4: '生命を脅かす' },
  { name: '下痢', g1: '4回/日未満増加', g2: '4-6回/日増加', g3: '≧7回/日増加/入院', g4: '生命を脅かす' },
  { name: '末梢神経障害', g1: '症状のみ/DTR低下', g2: '中等度/機能制限', g3: '重度/ADL制限', g4: '生命を脅かす' },
  { name: '皮疹(斑丘疹)', g1: 'BSA<10%', g2: 'BSA 10-30%', g3: 'BSA>30%', g4: '-' },
  { name: 'ALT上昇', g1: '>ULN-3×ULN', g2: '>3-5×ULN', g3: '>5-20×ULN', g4: '>20×ULN' },
  { name: 'Cr上昇', g1: '>ULN-1.5×ULN', g2: '>1.5-3×ULN', g3: '>3-6×ULN', g4: '>6×ULN' },
]
export default function CtcaePage() {
  const [tab, setTab] = useState<'grade'|'table'>('table')
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>CTCAE v5.0は約800の有害事象を収載。ここでは頻用項目を抜粋。全項目はJCOG翻訳版PDFを参照。</p><p className="mt-1">LLN = 施設基準下限, ULN = 施設基準上限</p></div>}
      relatedTools={[{slug:'naranjo',name:'Naranjo'},{slug:'extravasation',name:'血管外漏出'}]}
      references={toolDef.sources||[]}
    >
      <div className="flex gap-2 mb-4">
        <button onClick={()=>setTab('table')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab==='table'?'bg-ac text-white':'bg-s1 text-muted'}`}>主要AE一覧</button>
        <button onClick={()=>setTab('grade')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab==='grade'?'bg-ac text-white':'bg-s1 text-muted'}`}>Grade定義</button>
      </div>
      {tab==='grade' ? (
        <div className="space-y-2">{grades.map(g=>(
          <div key={g.grade} className={`p-3 rounded-lg border ${g.grade<=2?'bg-s0 border-br':g.grade<=3?'bg-wnl border-wnb':'bg-dnl border-dnb'}`}>
            <span className="text-sm font-bold text-tx">Grade {g.grade}: {g.name}</span>
            <p className="text-xs text-muted mt-0.5">{g.desc}</p>
          </div>
        ))}</div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs border-collapse min-w-[550px]">
            <thead><tr className="bg-s1">
              <th className="p-2 font-bold text-tx border-b border-br text-left">AE</th>
              <th className="p-1.5 font-bold text-tx border-b border-br text-center">G1</th>
              <th className="p-1.5 font-bold text-tx border-b border-br text-center">G2</th>
              <th className="p-1.5 font-bold text-tx border-b border-br text-center bg-wnl">G3</th>
              <th className="p-1.5 font-bold text-tx border-b border-br text-center bg-dnl">G4</th>
            </tr></thead>
            <tbody>{commonAE.map((ae,i)=>(
              <tr key={i} className={i%2===0?'bg-s0':'bg-bg'}>
                <td className="p-2 font-medium text-tx border-b border-br whitespace-nowrap">{ae.name}</td>
                <td className="p-1.5 text-center border-b border-br text-muted">{ae.g1}</td>
                <td className="p-1.5 text-center border-b border-br">{ae.g2}</td>
                <td className="p-1.5 text-center border-b border-br bg-wnl/30 font-medium">{ae.g3}</td>
                <td className="p-1.5 text-center border-b border-br bg-dnl/30 font-medium">{ae.g4}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </CalculatorLayout>
  )
}
