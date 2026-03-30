'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ctcae')!

const grades = [
  { grade: 1, name: '軽症', desc: '症状がない, または軽度の症状がある; 臨床所見または検査所見のみ; 治療を要さない' },
  { grade: 2, name: '中等症', desc: '最小限/局所的/非侵襲的治療を要する; 年齢相応の身の回り以外の日常生活動作（IADL）の制限' },
  { grade: 3, name: '重症', desc: '重症または医学的に重大であるが, ただちに生命を脅かすものではない; 入院または入院期間の延長を要する; 身の回りの日常生活動作（ADL）の制限' },
  { grade: 4, name: '生命を脅かす', desc: '生命を脅かす; 緊急処置を要する' },
  { grade: 5, name: '死亡', desc: 'AEによる死亡' },
]

// CTCAE v6.0 頻用AE（JCOG日本語訳準拠）
const commonAE = [
  { name: '好中球数減少', soc: '臨床検査', g1: '<1,500-1,000/mm³', g2: '<1,000-500/mm³', g3: '<500-100/mm³', g4: '<100/mm³', v6note: '★v6変更' },
  { name: '血小板減少症', soc: '血液', g1: '<LLN-75,000/mm³', g2: '<75,000-50,000/mm³', g3: '<50,000-10,000/mm³; 輸血要', g4: '<10,000/mm³', v6note: '★v6変更(SOC+カットオフ)' },
  { name: '貧血', soc: '血液', g1: 'Hb <LLN-10.0', g2: 'Hb <10.0-8.0', g3: 'Hb <8.0; 輸血要', g4: '生命を脅かす', v6note: '' },
  { name: '発熱性好中球減少症', soc: '血液', g1: '-', g2: '-', g3: 'ANC<1,000 + 38.3℃超(単回) or 38℃以上(1h超持続)', g4: '生命を脅かす', v6note: '' },
  { name: '悪心', soc: '胃腸', g1: '食欲低下のみ', g2: '経口摂取減少', g3: '経口摂取不能; 入院要', g4: '-', v6note: '' },
  { name: '嘔吐', soc: '胃腸', g1: '24h内1-2回', g2: '24h内3-5回', g3: '24h内≧6回; 入院要', g4: '生命を脅かす', v6note: '' },
  { name: '下痢', soc: '胃腸', g1: '便の固さ/回数の変化', g2: '4-6回/日増加; IADL制限', g3: '≧7回/日増加; 入院要; ADL制限', g4: '生命を脅かす', v6note: '' },
  { name: '高血糖', soc: '代謝', g1: '空腹時 >ULN-160', g2: '空腹時 >160-250', g3: '空腹時 >250-500; 入院要', g4: '空腹時 >500', v6note: '★v6変更(血糖値定義)' },
  { name: '皮疹(斑丘疹)', soc: '皮膚', g1: 'BSA<10%', g2: 'BSA 10-30%; IADL制限', g3: 'BSA>30%; ADL制限', g4: '-', v6note: '' },
  { name: 'ALT増加', soc: '臨床検査', g1: '>ULN-3×ULN', g2: '>3-5×ULN', g3: '>5-20×ULN', g4: '>20×ULN', v6note: '' },
  { name: 'AST増加', soc: '臨床検査', g1: '>ULN-3×ULN', g2: '>3-5×ULN', g3: '>5-20×ULN', g4: '>20×ULN', v6note: '' },
  { name: 'クレアチニン増加', soc: '臨床検査', g1: '>ULN-1.5×ULN', g2: '>1.5-3.0×ULN', g3: '>3.0-6.0×ULN', g4: '>6.0×ULN', v6note: '' },
  { name: '末梢性ニューロパチー', soc: '神経', g1: '症状のみ; DTR低下', g2: '中等度; IADL制限', g3: '重度; ADL制限', g4: '生命を脅かす', v6note: '' },
  { name: '倦怠感', soc: '全身', g1: '安静にて軽減する倦怠感', g2: '安静にて軽減しない倦怠感; IADL制限', g3: '安静にて軽減しない倦怠感; ADL制限', g4: '-', v6note: '' },
]

export default function CtcaePage() {
  const [tab, setTab] = useState<'grade' | 'table'>('table')
  const [search, setSearch] = useState('')
  const filtered = search ? commonAE.filter(ae => ae.name.includes(search) || ae.soc.includes(search)) : commonAE

  return (
    <CalculatorLayout slug={toolDef.slug} title="CTCAE v6.0（有害事象共通用語規準）" titleEn="CTCAE v6.0"
      description="NCI有害事象共通用語規準 v6.0 (2025年7月公開)。JCOG日本語訳版準拠の頻用AE一覧。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted space-y-1">
        <p className="text-xs font-bold text-wn">v5.0からの主な変更点:</p>
        <p className="text-xs">・好中球数減少: G3 &lt;500-100, G4 &lt;100（v5: G3 &lt;1000-500, G4 &lt;500）</p>
        <p className="text-xs">・血小板減少症: SOC変更(臨床検査→血液)。G3 &lt;50000-10000, G4 &lt;10000（v5: G3 &lt;50000-25000, G4 &lt;25000）</p>
        <p className="text-xs">・高血糖: 空腹時血糖値でのGrade定義に変更</p>
        <p className="text-xs">・肺感染→肺炎に名称変更</p>
        <p className="text-[10px] text-muted mt-1">LLN=施設基準下限, ULN=施設基準上限。全項目はJCOG翻訳版PDFを参照（http://www.jcog.jp）。Grade説明文中のセミコロン(;)は「または」を意味する。</p>
      </div>}
      relatedTools={[{ slug: 'naranjo', name: 'Naranjo' }, { slug: 'extravasation', name: '血管外漏出' }]}
      references={[
        { text: 'NCI. Common Terminology Criteria for Adverse Events (CTCAE) v6.0. Published July 10, 2025' },
        { text: 'CTCAE v6.0 日本語訳JCOG版. 2026年3月1日' },
      ]}
    >
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('table')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === 'table' ? 'bg-ac text-white' : 'bg-s1 text-muted'}`}>主要AE一覧</button>
        <button onClick={() => setTab('grade')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === 'grade' ? 'bg-ac text-white' : 'bg-s1 text-muted'}`}>Grade定義</button>
      </div>
      {tab === 'grade' ? (
        <div className="space-y-2">{grades.map(g => (
          <div key={g.grade} className={`p-3 rounded-lg border ${g.grade <= 2 ? 'bg-s0 border-br' : g.grade <= 3 ? 'bg-wnl border-wnb' : 'bg-dnl border-dnb'}`}>
            <span className="text-sm font-bold text-tx">Grade {g.grade}: {g.name}</span>
            <p className="text-xs text-muted mt-0.5">{g.desc}</p>
          </div>
        ))}</div>
      ) : (
        <>
          <input type="text" placeholder="AE名で検索..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 mb-3 bg-s0 border border-br rounded-lg text-sm text-tx placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ac" />
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs border-collapse min-w-[550px]">
              <thead><tr className="bg-s1">
                <th className="p-2 font-bold text-tx border-b border-br text-left">AE</th>
                <th className="p-1.5 font-bold text-tx border-b border-br text-center">G1</th>
                <th className="p-1.5 font-bold text-tx border-b border-br text-center">G2</th>
                <th className="p-1.5 font-bold text-tx border-b border-br text-center bg-wnl">G3</th>
                <th className="p-1.5 font-bold text-tx border-b border-br text-center bg-dnl">G4</th>
              </tr></thead>
              <tbody>{filtered.map((ae, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-s0' : 'bg-bg'}>
                  <td className="p-2 font-medium text-tx border-b border-br">
                    <span className="whitespace-nowrap">{ae.name}</span>
                    {ae.v6note && <span className="text-[9px] text-dn ml-1">{ae.v6note}</span>}
                  </td>
                  <td className="p-1.5 text-center border-b border-br text-muted">{ae.g1}</td>
                  <td className="p-1.5 text-center border-b border-br">{ae.g2}</td>
                  <td className="p-1.5 text-center border-b border-br bg-wnl/30 font-medium">{ae.g3}</td>
                  <td className="p-1.5 text-center border-b border-br bg-dnl/30 font-medium">{ae.g4}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </CalculatorLayout>
  )
}
