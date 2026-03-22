'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('design-r')!

const D_DEPTH = [
  { value: 'd0', label: 'd0: 皮膚損傷・発赤なし', score: 0 },
  { value: 'd1', label: 'd1: 持続する発赤', score: 1 },
  { value: 'd2', label: 'd2: 真皮までの損傷', score: 3 },
  { value: 'D3', label: 'D3: 皮下組織までの損傷', score: 4 },
  { value: 'D4', label: 'D4: 皮下組織を超える損傷', score: 5 },
  { value: 'D5', label: 'D5: 関節腔・体腔に至る損傷', score: 6 },
  { value: 'DU', label: 'DU: 判定不能（壊死組織で覆われ深さ不明）', score: 0 },
]
const E_EXUDATE = [
  { value: 'e0', label: 'e0: なし', score: 0 },
  { value: 'e1', label: 'e1: 少量（毎日のドレッシング交換不要）', score: 1 },
  { value: 'e3', label: 'e3: 中等量（1日1回のドレッシング交換）', score: 3 },
  { value: 'E6', label: 'E6: 多量（1日2回以上のドレッシング交換）', score: 6 },
]
const S_SIZE = [
  { value: 's0', label: 's0: 皮膚損傷なし', score: 0 },
  { value: 's3', label: 's3: < 4cm²', score: 3 },
  { value: 's6', label: 's6: 4 - 16cm²', score: 6 },
  { value: 's8', label: 's8: 16 - 36cm²', score: 8 },
  { value: 's9', label: 's9: 36 - 64cm²', score: 9 },
  { value: 's12', label: 's12: 64 - 100cm²', score: 12 },
  { value: 'S15', label: 'S15: ≧ 100cm²', score: 15 },
]
const I_INFLAM = [
  { value: 'i0', label: 'i0: 局所の炎症徴候なし', score: 0 },
  { value: 'i1', label: 'i1: 局所の炎症徴候あり（発赤・腫脹・熱感・疼痛）', score: 1 },
  { value: 'I3', label: 'I3: 局所の明らかな感染徴候あり（膿・悪臭）', score: 3 },
  { value: 'I9', label: 'I9: 全身的影響あり（発熱・白血球増多等）', score: 9 },
]
const G_GRAN = [
  { value: 'g0', label: 'g0: 治癒 or 創が浅く評価不要', score: 0 },
  { value: 'g1', label: 'g1: 良好な肉芽が全創面を覆う', score: 1 },
  { value: 'g3', label: 'g3: 良好な肉芽が50%以上を覆う', score: 3 },
  { value: 'G4', label: 'G4: 良好な肉芽が50%未満', score: 4 },
  { value: 'G5', label: 'G5: 良好な肉芽が全く形成されていない', score: 5 },
  { value: 'G6', label: 'G6: 肉芽なし＋創面増大あり', score: 6 },
]
const N_NECRO = [
  { value: 'n0', label: 'n0: 壊死組織なし', score: 0 },
  { value: 'N3', label: 'N3: 柔らかい壊死組織あり', score: 3 },
  { value: 'N6', label: 'N6: 硬く厚い壊死組織あり', score: 6 },
]
const P_POCKET = [
  { value: 'p0', label: 'p0: ポケットなし', score: 0 },
  { value: 'p6', label: 'p6: < 4cm²', score: 6 },
  { value: 'p9', label: 'p9: 4 - 16cm²', score: 9 },
  { value: 'p12', label: 'p12: 16 - 36cm²', score: 12 },
  { value: 'P24', label: 'P24: ≧ 36cm²', score: 24 },
]

export default function DesignRPage() {
  const [d, setD] = useState('d0')
  const [e, setE] = useState('e0')
  const [s, setS] = useState('s0')
  const [i, setI] = useState('i0')
  const [g, setG] = useState('g0')
  const [n, setN] = useState('n0')
  const [p, setP] = useState('p0')

  const result = useMemo(() => {
    const sc = (arr: {value:string;score:number}[], v: string) => arr.find(x => x.value === v)?.score ?? 0
    const scores = { d: sc(D_DEPTH, d), e: sc(E_EXUDATE, e), s: sc(S_SIZE, s), i: sc(I_INFLAM, i), g: sc(G_GRAN, g), n: sc(N_NECRO, n), p: sc(P_POCKET, p) }
    const total = Object.values(scores).reduce((a, b) => a + b, 0)
    const notation = `${d}-${e}-${s}-${i}-${g}-${n}-${p}`
    return { total, notation, ...scores }
  }, [d, e, s, i, g, n, p])

  const severity = result.total === 0 ? 'ok' as const : result.total <= 9 ? 'ok' as const : result.total <= 20 ? 'wn' as const : 'dn' as const
  const interpretation = result.total === 0 ? '褥瘡なし / 治癒' : result.total <= 9 ? '軽度褥瘡 — 局所ケアで管理可能' : result.total <= 20 ? '中等度褥瘡 — 専門的な創傷管理が必要' : '重度褥瘡 — 多職種による集中的介入が必要'

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<>
        <ResultCard label="DESIGN-R 合計スコア" value={`${result.total} 点`} interpretation={interpretation} severity={severity} />
        <div className="mt-3 p-3 rounded-lg bg-bg border border-br text-xs">
          <p className="font-medium text-tx mb-1">DESIGN-R 表記</p>
          <p className="font-mono text-ac text-sm">{result.notation}</p>
        </div>
        {result.total > 0 && <div className="mt-3 p-3 rounded-lg bg-bg border border-br text-xs space-y-1">
          <p className="font-medium text-tx mb-1">項目別スコア内訳</p>
          <div className="grid grid-cols-2 gap-1 text-muted">
            <span>D（深さ）: <span className="font-bold text-tx">{result.d}</span></span>
            <span>E（滲出液）: <span className="font-bold text-tx">{result.e}</span></span>
            <span>S（大きさ）: <span className="font-bold text-tx">{result.s}</span></span>
            <span>I（炎症/感染）: <span className="font-bold text-tx">{result.i}</span></span>
            <span>G（肉芽）: <span className="font-bold text-tx">{result.g}</span></span>
            <span>N（壊死）: <span className="font-bold text-tx">{result.n}</span></span>
            <span>P（ポケット）: <span className="font-bold text-tx">{result.p}</span></span>
          </div>
        </div>}
      </>}
      explanation={undefined}
      relatedTools={[]}
      references={[
        { text: '日本褥瘡学会. 褥瘡予防・管理ガイドライン（第5版）, 2022' },
        { text: '日本褥瘡学会. DESIGN-R 2020 コンセンサス・ドキュメント, 2020' },
        { text: 'Sanada H, et al. Reliability and validity of DESIGN, a tool to measure severity of pressure ulcers. Wound Repair Regen 2004;12:602-610' },
        { text: 'Schultz GS, et al. Wound bed preparation: a systematic approach to wound management. Wound Repair Regen 2003;11:S1-S28 (TIME framework)' },
      ]}
    >
      <div className="space-y-4">
        <SelectInput id="depth" label="D: Depth（深さ）" value={d} onChange={setD} options={D_DEPTH.map(x => ({ value: x.value, label: x.label }))} />
        <SelectInput id="exudate" label="E: Exudate（滲出液）" value={e} onChange={setE} options={E_EXUDATE.map(x => ({ value: x.value, label: x.label }))} />
        <SelectInput id="size" label="S: Size（大きさ）" value={s} onChange={setS} options={S_SIZE.map(x => ({ value: x.value, label: x.label }))} />
        <SelectInput id="inflammation" label="I: Inflammation/Infection（炎症/感染）" value={i} onChange={setI} options={I_INFLAM.map(x => ({ value: x.value, label: x.label }))} />
        <SelectInput id="granulation" label="G: Granulation（肉芽組織）" value={g} onChange={setG} options={G_GRAN.map(x => ({ value: x.value, label: x.label }))} />
        <SelectInput id="necrotic" label="N: Necrotic tissue（壊死組織）" value={n} onChange={setN} options={N_NECRO.map(x => ({ value: x.value, label: x.label }))} />
        <SelectInput id="pocket" label="P: Pocket（ポケット）" value={p} onChange={setP} options={P_POCKET.map(x => ({ value: x.value, label: x.label }))} />
      </div>
    </CalculatorLayout>
  )
}