'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('renal-dose-abx')!

interface Antibiotic {
  id: string
  name: string
  nameEn: string
  category: string
  /** [normal, mild(50-79), moderate(30-49), severe(10-29), dialysis] */
  doses: [string, string, string, string, string]
  note?: string
}

const antibiotics: Antibiotic[] = [
  // ペニシリン系
  { id: 'abpc', name: 'アンピシリン（ABPC）', nameEn: 'Ampicillin', category: 'ペニシリン系',
    doses: ['2g q4-6h', '2g q6-8h', '2g q8-12h', '2g q12h', '2g q12h（HD後追加）'] },
  { id: 'abpc-sbt', name: 'アンピシリン/スルバクタム（ABPC/SBT）', nameEn: 'Ampicillin/Sulbactam', category: 'ペニシリン系',
    doses: ['3g q6h', '3g q6-8h', '3g q8-12h', '3g q12h', '3g q12h（HD後追加）'] },
  { id: 'pipc-taz', name: 'ピペラシリン/タゾバクタム（PIPC/TAZ）', nameEn: 'Piperacillin/Tazobactam', category: 'ペニシリン系',
    doses: ['4.5g q6h', '4.5g q6h', '4.5g q8h', '2.25g q8h', '2.25g q8h（HD後追加）'] },

  // セフェム系
  { id: 'cez', name: 'セファゾリン（CEZ）', nameEn: 'Cefazolin', category: 'セフェム系',
    doses: ['2g q8h', '2g q8h', '1g q12h', '1g q24h', '1g q24h（HD後追加）'] },
  { id: 'ctx', name: 'セフォタキシム（CTX）', nameEn: 'Cefotaxime', category: 'セフェム系',
    doses: ['2g q4-6h', '2g q6-8h', '2g q8-12h', '1g q12h', '1g q24h'] },
  { id: 'ctrx', name: 'セフトリアキソン（CTRX）', nameEn: 'Ceftriaxone', category: 'セフェム系',
    doses: ['2g q24h', '2g q24h', '2g q24h', '2g q24h', '2g q24h（調整不要）'],
    note: '主に肝代謝。腎機能による調整は通常不要' },
  { id: 'caz', name: 'セフタジジム（CAZ）', nameEn: 'Ceftazidime', category: 'セフェム系',
    doses: ['2g q8h', '2g q12h', '1g q12h', '1g q24h', '1g q24h（HD後追加）'] },
  { id: 'cfpm', name: 'セフェピム（CFPM）', nameEn: 'Cefepime', category: 'セフェム系',
    doses: ['2g q8h', '2g q12h', '1g q12h', '1g q24h', '1g q24h（HD後追加）'],
    note: '腎機能低下時の過量投与で脳症リスク' },

  // カルバペネム系
  { id: 'mepm', name: 'メロペネム（MEPM）', nameEn: 'Meropenem', category: 'カルバペネム系',
    doses: ['1g q8h', '1g q8h', '1g q12h', '0.5g q12h', '0.5g q24h（HD後追加）'] },
  { id: 'ipm-cs', name: 'イミペネム/シラスタチン（IPM/CS）', nameEn: 'Imipenem/Cilastatin', category: 'カルバペネム系',
    doses: ['0.5g q6h', '0.5g q6-8h', '0.5g q8-12h', '0.25g q12h', '0.25g q12h（HD後追加）'],
    note: '腎機能低下時に痙攣リスク上昇' },
  { id: 'drpm', name: 'ドリペネム（DRPM）', nameEn: 'Doripenem', category: 'カルバペネム系',
    doses: ['0.5g q8h', '0.5g q8h', '0.25g q8h', '0.25g q12h', '0.25g q12h（HD後追加）'] },

  // アミノグリコシド系
  { id: 'gm', name: 'ゲンタマイシン（GM）', nameEn: 'Gentamicin', category: 'アミノグリコシド系',
    doses: ['5-7mg/kg q24h', '5-7mg/kg q24-36h', '5-7mg/kg q36-48h', 'TDM必須', 'TDM必須（HD後投与）'],
    note: 'TDM必須。トラフ値 <1μg/mL目標' },
  { id: 'amk', name: 'アミカシン（AMK）', nameEn: 'Amikacin', category: 'アミノグリコシド系',
    doses: ['15mg/kg q24h', '15mg/kg q24-36h', '15mg/kg q36-48h', 'TDM必須', 'TDM必須（HD後投与）'],
    note: 'TDM必須。トラフ値 <5μg/mL目標' },

  // グリコペプチド系
  { id: 'vcm', name: 'バンコマイシン（VCM）', nameEn: 'Vancomycin', category: 'グリコペプチド系',
    doses: ['15-20mg/kg q8-12h', '15-20mg/kg q12-24h', '15-20mg/kg q24h', '15-20mg/kg q48-72h', '15-20mg/kg（HD後投与）'],
    note: 'AUC/MIC 400-600目標。TDM推奨' },

  // ニューキノロン系
  { id: 'lvfx', name: 'レボフロキサシン（LVFX）', nameEn: 'Levofloxacin', category: 'ニューキノロン系',
    doses: ['500mg q24h', '500mg 初回→250mg q24h', '250mg q24h', '250mg q48h', '250mg q48h'] },
  { id: 'cpfx', name: 'シプロフロキサシン（CPFX）', nameEn: 'Ciprofloxacin', category: 'ニューキノロン系',
    doses: ['400mg q8h IV', '400mg q8h IV', '400mg q12h IV', '400mg q24h IV', '400mg q24h IV'] },

  // その他
  { id: 'mtz', name: 'メトロニダゾール（MNZ）', nameEn: 'Metronidazole', category: 'その他',
    doses: ['500mg q8h', '500mg q8h', '500mg q8h', '250mg q8h', '250mg q8h'],
    note: '主に肝代謝だが重度腎障害で代謝産物蓄積' },
  { id: 'st', name: 'ST合剤（TMP/SMX）', nameEn: 'TMP/SMX', category: 'その他',
    doses: ['TMP 5mg/kg q6-8h', 'TMP 5mg/kg q6-8h', 'TMP 5mg/kg q12h', '使用を避ける', '使用を避ける'],
    note: 'CrCl <15では高K血症リスク高く原則禁忌' },
  { id: 'lzd', name: 'リネゾリド（LZD）', nameEn: 'Linezolid', category: 'その他',
    doses: ['600mg q12h', '600mg q12h', '600mg q12h', '600mg q12h', '600mg q12h（調整不要）'],
    note: '腎機能による調整不要。2週間以上の使用で血小板減少注意' },
  { id: 'dap', name: 'ダプトマイシン（DAP）', nameEn: 'Daptomycin', category: 'その他',
    doses: ['6-8mg/kg q24h', '6-8mg/kg q24h', '6-8mg/kg q48h', '6-8mg/kg q48h', '6-8mg/kg q48h（HD後投与）'],
    note: 'CPK定期モニタリング。肺炎には無効（サーファクタントで不活化）' },
]

const egfrRanges = [
  { label: '正常 (≥80)', index: 0 },
  { label: '軽度低下 (50-79)', index: 1 },
  { label: '中等度低下 (30-49)', index: 2 },
  { label: '高度低下 (10-29)', index: 3 },
  { label: '透析', index: 4 },
]

function getEgfrIndex(egfr: number): number {
  if (egfr >= 80) return 0
  if (egfr >= 50) return 1
  if (egfr >= 30) return 2
  if (egfr >= 10) return 3
  return 4
}

export default function RenalDoseAbxPage() {
  const [egfr, setEgfr] = useState('60')
  const [selectedAbx, setSelectedAbx] = useState('all')

  const egfrIndex = useMemo(() => {
    const v = parseFloat(egfr)
    return isNaN(v) ? 0 : getEgfrIndex(v)
  }, [egfr])

  const filteredAbx = useMemo(() => {
    if (selectedAbx === 'all') return antibiotics
    return antibiotics.filter(a => a.category === selectedAbx)
  }, [selectedAbx])

  const categories = Array.from(new Set(antibiotics.map(a => a.category)))

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="腎機能区分"
          value={egfrRanges[egfrIndex].label}
          unit=""
          interpretation={`eGFR ${egfr} mL/min/1.73m² → ${egfrRanges[egfrIndex].label}`}
          severity={egfrIndex <= 1 ? 'ok' : egfrIndex <= 2 ? 'wn' : 'dn'}
          details={[
            { label: '表示中の薬剤数', value: `${filteredAbx.length}剤` },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">抗菌薬の腎機能別用量調整</h2>
          <p>腎排泄型の抗菌薬は腎機能低下時に血中濃度が上昇し、副作用リスクが増大します。eGFRまたはCrClに基づいて投与量・投与間隔を調整する必要があります。</p>
          <h3 className="font-bold text-tx">注意事項</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>本表は一般的な目安であり、各施設のプロトコル・添付文書を優先してください</li>
            <li>アミノグリコシド系・バンコマイシンはTDM（血中薬物濃度モニタリング）が推奨</li>
            <li>透析患者では透析後の追加投与タイミングに注意</li>
            <li>急性腎障害（AKI）では腎機能が急速に変動するため頻回の再評価が必要</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'The Sanford Guide to Antimicrobial Therapy 2024' },
        { text: '日本化学療法学会 抗菌薬TDMガイドライン2022' },
        { text: '各薬剤添付文書' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="egfr" label="eGFR（またはCrCl）" unit="mL/min/1.73m²" value={egfr} onChange={setEgfr} step={1} />
        <SelectInput
          id="abx-category"
          label="薬剤カテゴリで絞り込み"
          value={selectedAbx}
          onChange={setSelectedAbx}
          options={[
            { value: 'all', label: 'すべて表示' },
            ...categories.map(c => ({ value: c, label: c })),
          ]}
        />

        {/* 用量テーブル */}
        <div className="mt-4 border border-br rounded-xl overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead className="bg-s1">
              <tr>
                <th className="text-left px-3 py-2 text-tx font-medium sticky left-0 bg-s1 z-10">薬剤名</th>
                {egfrRanges.map((r, i) => (
                  <th
                    key={r.label}
                    className={`text-center px-2 py-2 font-medium ${i === egfrIndex ? 'text-ac bg-acl' : 'text-tx'}`}
                  >
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-br">
              {filteredAbx.map(abx => (
                <tr key={abx.id} className="hover:bg-s1/50">
                  <td className="px-3 py-2 text-tx sticky left-0 bg-bg z-10">
                    <div className="font-medium">{abx.name}</div>
                    {abx.note && <div className="text-xs text-wn mt-0.5">⚠ {abx.note}</div>}
                  </td>
                  {abx.doses.map((dose, i) => (
                    <td
                      key={i}
                      className={`text-center px-2 py-2 ${i === egfrIndex ? 'bg-acl font-medium text-ac' : 'text-muted'}`}
                    >
                      {dose}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-wnl border border-wnb rounded-lg text-xs text-wn">
          ⚠ 免責: 本ツールは一般的な参考情報であり、臨床判断の代替とはなりません。実際の投与量は添付文書・施設プロトコル・TDM結果に基づいて決定してください。
        </div>
      </div>
    </CalculatorLayout>
  )
}
