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
    note: 'AUC/MIC 400-600目標。TDMが一般的' },

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
  const [showCcrCalc, setShowCcrCalc] = useState(false)
  const [ccrAge, setCcrAge] = useState('')
  const [ccrWeight, setCcrWeight] = useState('')
  const [ccrCr, setCcrCr] = useState('')
  const [ccrFemale, setCcrFemale] = useState(false)

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
      slug={toolDef.slug}
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
      explanation={undefined}
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
        <NumberInput id="egfr" label="eGFR / CrCl" unit="mL/min" value={egfr} onChange={setEgfr} step={1} />

        {/* CCr計算オプション */}
        <div>
          <button onClick={() => setShowCcrCalc(!showCcrCalc)}
            className="text-xs text-ac font-medium hover:underline">
            {showCcrCalc ? '▲ CCr計算を閉じる' : '▼ Cockcroft-Gault式でCCrを計算'}
          </button>
          {showCcrCalc && (
            <div className="mt-2 p-3 bg-s1 border border-br rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted block mb-1">年齢</label>
                  <input type="number" value={ccrAge} onChange={e => setCcrAge(e.target.value)}
                    placeholder="70" className="w-full px-2 py-1.5 rounded border border-br text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-1">体重(kg)</label>
                  <input type="number" value={ccrWeight} onChange={e => setCcrWeight(e.target.value)}
                    placeholder="60" className="w-full px-2 py-1.5 rounded border border-br text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-1">Cr(mg/dL)</label>
                  <input type="number" step="0.1" value={ccrCr} onChange={e => setCcrCr(e.target.value)}
                    placeholder="1.2" className="w-full px-2 py-1.5 rounded border border-br text-xs" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={ccrFemale} onChange={e => setCcrFemale(e.target.checked)} />
                女性（×0.85）
              </label>
              <button onClick={() => {
                const a = parseFloat(ccrAge), w = parseFloat(ccrWeight), c = parseFloat(ccrCr)
                if (a && w && c) {
                  const ccr = (140 - a) * w / (72 * c) * (ccrFemale ? 0.85 : 1)
                  setEgfr(String(Math.round(ccr * 10) / 10))
                }
              }} className="w-full py-1.5 bg-ac text-white text-xs font-bold rounded-lg">
                計算してeGFR欄に反映
              </button>
            </div>
          )}
        </div>

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
          <table className="w-full text-xs min-w-[500px]">
            <thead className="bg-s1">
              <tr>
                <th className="text-left px-2 py-2 text-tx font-medium sticky left-0 bg-s1 z-10 w-[90px] max-w-[90px]">薬剤</th>
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
                  <td className="px-2 py-2 text-tx sticky left-0 bg-bg z-10 w-[90px] max-w-[90px]">
                    <div className="font-medium text-xs leading-tight truncate">{abx.name}</div>
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
          ⚠ 掲載情報は下記文献の転記であり、正確性は保証しません。必ず添付文書をご確認ください。
        </div>
      </div>
    </CalculatorLayout>
  )
}
