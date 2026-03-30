'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('migraine-criteria')!

// 1.1 前兆のない片頭痛
const char11 = ['片側性', '拍動性', '中等度〜重度の頭痛', '日常的な動作（歩行や階段昇降など）により頭痛が増悪する、あるいは頭痛のために日常的な動作を避ける']
const assoc11 = ['悪心 and/or 嘔吐', '光過敏 and 音過敏']

// 1.2 前兆のある片頭痛 — 前兆の種類
const auraTypes = ['視覚症状（閃輝暗点・光・線・視野欠損等）', '感覚症状（チクチク感・しびれ等）', '言語症状（失語等）', '運動症状', '脳幹症状', '網膜症状']
// C: 6項目中3項目以上
const auraFeatures = [
  '① 少なくとも1つの前兆症状が5分以上かけて徐々に進展する',
  '② 2つ以上の前兆が引き続き生じる',
  '③ それぞれの前兆症状は5〜60分持続する',
  '④ 少なくとも1つの前兆症状は片側性である',
  '⑤ 少なくとも1つの前兆症状は陽性症状である',
  '⑥ 前兆に伴って、あるいは前兆出現後60分以内に頭痛が発現する',
]

export default function MigraineCriteriaPage() {
  const [type, setType] = useState('1.1')

  // 1.1
  const [attacks5, setAttacks5] = useState(false)
  const [dur4_72, setDur4_72] = useState(false)
  const [charChecked, setCharChecked] = useState([false, false, false, false])
  const [assocChecked, setAssocChecked] = useState([false, false])
  const [exclude11, setExclude11] = useState(false)

  // 1.2
  const [attacks2, setAttacks2] = useState(false)
  const [auraChecked, setAuraChecked] = useState(auraTypes.map(() => false))
  const [auraFeatChecked, setAuraFeatChecked] = useState(auraFeatures.map(() => false))
  const [exclude12, setExclude12] = useState(false)

  // 1.3
  const [ha15days, setHa15days] = useState(false)
  const [hasMigraine, setHasMigraine] = useState(false)
  const [migraine8days, setMigraine8days] = useState(false)
  const [exclude13, setExclude13] = useState(false)

  const result = useMemo(() => {
    if (type === '1.1') {
      const charCount = charChecked.filter(Boolean).length
      const assocCount = assocChecked.filter(Boolean).length
      const met = attacks5 && dur4_72 && charCount >= 2 && assocCount >= 1
      return {
        met,
        label: met
          ? (exclude11 ? '1.1 前兆のない片頭痛 — ICHD-3基準 A〜E 充足' : '1.1 前兆のない片頭痛 — A〜D充足（E: 他疾患除外が必要）')
          : '基準を満たさない',
        severity: met ? 'wn' as const : 'ok' as const,
      }
    }
    if (type === '1.2') {
      const auraCount = auraChecked.filter(Boolean).length
      const featCount = auraFeatChecked.filter(Boolean).length
      const met = attacks2 && auraCount >= 1 && featCount >= 3
      return {
        met,
        label: met
          ? (exclude12 ? '1.2 前兆のある片頭痛 — ICHD-3基準 A〜D 充足' : '1.2 前兆のある片頭痛 — A〜C充足（D: 他疾患除外が必要）')
          : '基準を満たさない',
        severity: met ? 'wn' as const : 'ok' as const,
      }
    }
    // 1.3
    const met = ha15days && hasMigraine && migraine8days
    return {
      met,
      label: met
        ? (exclude13 ? '1.3 慢性片頭痛 — ICHD-3基準 A〜D 充足' : '1.3 慢性片頭痛 — A〜C充足（D: 他疾患除外が必要）')
        : '基準を満たさない',
      severity: met ? 'wn' as const : 'ok' as const,
    }
  }, [type, attacks5, dur4_72, charChecked, assocChecked, exclude11, attacks2, auraChecked, auraFeatChecked, exclude12, ha15days, hasMigraine, migraine8days, exclude13])

  return (
    <CalculatorLayout slug={toolDef.slug} title="片頭痛の診断基準（ICHD-3）" titleEn="Migraine Diagnostic Criteria (ICHD-3)"
      description="国際頭痛分類 第3版（ICHD-3, 2018）に基づく片頭痛の診断基準チェックリスト。前兆なし(1.1)・前兆あり(1.2)・慢性(1.3)。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={result.met ? '基準充足' : '基準非充足'} interpretation={result.label} />}
      explanation={<div className="text-sm text-muted"><p>二次性頭痛の除外が前提。確定診断は臨床評価による。</p></div>}
      relatedTools={[{ slug: 'nihss', name: 'NIHSS' }]}
      references={[{ text: 'Headache Classification Committee of the IHS. The International Classification of Headache Disorders, 3rd edition. Cephalalgia 2018;38(1):1-211. PMID: 29368949' }]}
    >
      <div className="space-y-4">
        <RadioGroup name="type" label="片頭痛のタイプ" value={type} onChange={v => setType(v)}
          options={[
            { value: '1.1', label: '1.1 前兆のない片頭痛' },
            { value: '1.2', label: '1.2 前兆のある片頭痛' },
            { value: '1.3', label: '1.3 慢性片頭痛' },
          ]} />

        {type === '1.1' && <div className="space-y-3">
          <CheckItem id="a11" label="A. 5回以上の発作歴" sublabel="*1回・数回では確定困難。5回未満は「疑い」" checked={attacks5} onChange={setAttacks5} />
          <CheckItem id="b11" label="B. 頭痛発作の持続時間 4〜72時間" sublabel="未治療または治療が無効の場合。*小児は2-72時間" checked={dur4_72} onChange={setDur4_72} />
          <div>
            <p className="text-sm font-bold text-tx mb-1">C. 頭痛の特徴（4項目中≧2項目）</p>
            {char11.map((c, i) => <CheckItem key={i} id={`c11-${i}`} label={c} checked={charChecked[i]} onChange={v => { const n = [...charChecked]; n[i] = v; setCharChecked(n) }} />)}
          </div>
          <div>
            <p className="text-sm font-bold text-tx mb-1">D. 随伴症状（≧1項目）</p>
            {assoc11.map((a, i) => <CheckItem key={i} id={`d11-${i}`} label={a} checked={assocChecked[i]} onChange={v => { const n = [...assocChecked]; n[i] = v; setAssocChecked(n) }} />)}
          </div>
          <CheckItem id="e11" label="E. 他の疾患によらない（二次性頭痛の除外）" checked={exclude11} onChange={setExclude11} />
        </div>}

        {type === '1.2' && <div className="space-y-3">
          <CheckItem id="a12" label="A. 2回以上の発作歴" checked={attacks2} onChange={setAttacks2} />
          <div>
            <p className="text-sm font-bold text-tx mb-1">B. 前兆の種類（≧1つ）</p>
            {auraTypes.map((a, i) => <CheckItem key={i} id={`b12-${i}`} label={a} checked={auraChecked[i]} onChange={v => { const n = [...auraChecked]; n[i] = v; setAuraChecked(n) }} />)}
          </div>
          <div>
            <p className="text-sm font-bold text-tx mb-1">C. 前兆の特徴（6項目中≧3項目）</p>
            <p className="text-[10px] text-muted mb-1">*運動症状は最長72時間持続しうる。失語は常に片側性とみなす。閃輝暗点やチクチク感は陽性症状。</p>
            {auraFeatures.map((f, i) => <CheckItem key={i} id={`c12-${i}`} label={f} checked={auraFeatChecked[i]} onChange={v => { const n = [...auraFeatChecked]; n[i] = v; setAuraFeatChecked(n) }} />)}
          </div>
          <CheckItem id="d12" label="D. 他の疾患によらない（二次性頭痛・TIAの除外）" checked={exclude12} onChange={setExclude12} />
        </div>}

        {type === '1.3' && <div className="space-y-3">
          <CheckItem id="a13" label="A. 片頭痛様または緊張型頭痛様の頭痛が月15日以上の頻度で3ヶ月を超えて起こり、BとCを満たす" sublabel="*頭痛ダイアリーの記録が推奨される" checked={ha15days} onChange={setHa15days} />
          <CheckItem id="b13" label="B. 「前兆のない片頭痛」の診断基準B〜Dを満たすか、「前兆のある片頭痛」のBおよびCを満たす発作が、併せて5回以上あった患者" checked={hasMigraine} onChange={setHasMigraine} />
          <CheckItem id="c13" label="C. 3ヶ月を超えて月8日以上で、以下のいずれかを満たす" sublabel="①「前兆のない片頭痛」のCとDを満たす ②「前兆のある片頭痛」のBとCを満たす ③発症時には片頭痛であったと患者が考えており、トリプタンあるいは麦角誘導体で改善する" checked={migraine8days} onChange={setMigraine8days} />
          <CheckItem id="d13" label="D. ほかに最適なICHD-3の診断がない" sublabel="*MOHを満たす場合は両方の診断名を付与。薬物離脱後に再評価。" checked={exclude13} onChange={setExclude13} />
        </div>}
      </div>
    </CalculatorLayout>
  )
}
