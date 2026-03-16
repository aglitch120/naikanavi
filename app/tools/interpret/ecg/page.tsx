'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ── Types ──
type Severity = 'ok' | 'wn' | 'dn' | 'neutral'

interface StepResult {
  step: number; title: string; finding: string
  severity: Severity; detail: string
}

interface ECGInput {
  rate: string
  rhythm: 'regular' | 'irregular' | 'irregularly_irregular' | ''
  pWave: 'normal' | 'absent' | 'retrograde' | 'flutter' | 'fibrillation' | ''
  prInterval: 'short' | 'normal' | 'prolonged_constant' | 'prolonged_progressive' | ''
  qrsWidth: 'narrow' | 'wide' | ''
  axis: 'normal' | 'lad' | 'rad' | 'extreme' | ''
  stChange: 'none' | 'elevation' | 'depression' | 'both' | ''
  stLeads: string
  tWave: 'normal' | 'inverted' | 'peaked' | 'flattened' | ''
  qtc: string
  otherFindings: string[]
}

const defaults: ECGInput = {
  rate: '78', rhythm: 'regular', pWave: 'normal', prInterval: 'normal',
  qrsWidth: 'narrow', axis: 'normal', stChange: 'none', stLeads: '',
  tWave: 'normal', qtc: '420', otherFindings: [],
}

// ── Interpretation Engine ──
function interpret(d: ECGInput): StepResult[] {
  const steps: StepResult[] = []
  const rate = parseInt(d.rate)
  if (!rate || !d.rhythm) return []

  // Step 1: Heart Rate
  if (rate < 50) {
    steps.push({ step: 1, title: '心拍数', finding: `HR ${rate} bpm → 徐脈`, severity: 'dn',
      detail: 'HR < 50: 症候性徐脈の場合、洞不全症候群・房室ブロック・薬剤性（β遮断薬・Ca拮抗薬・ジギタリス）・甲状腺機能低下症を鑑別。' })
  } else if (rate < 60) {
    steps.push({ step: 1, title: '心拍数', finding: `HR ${rate} bpm → 軽度徐脈`, severity: 'wn',
      detail: 'HR 50-59: スポーツ心臓・睡眠中は正常。症候性なら精査を考慮。' })
  } else if (rate <= 100) {
    steps.push({ step: 1, title: '心拍数', finding: `HR ${rate} bpm → 正常`, severity: 'ok',
      detail: '正常範囲（60-100 bpm）。' })
  } else if (rate <= 150) {
    steps.push({ step: 1, title: '心拍数', finding: `HR ${rate} bpm → 頻脈`, severity: 'wn',
      detail: 'HR 100-150: 洞性頻脈（発熱・脱水・貧血・疼痛・不安等）が最多。narrow QRS + regular で150 bpm前後なら心房粗動（2:1伝導）も鑑別。' })
  } else {
    steps.push({ step: 1, title: '心拍数', finding: `HR ${rate} bpm → 著明な頻脈`, severity: 'dn',
      detail: 'HR > 150: SVT（AVNRT・AVRT）・心房粗動・VTを鑑別。血行動態不安定なら電気的除細動を考慮。' })
  }

  // Step 2: Rhythm
  if (d.rhythm === 'regular') {
    steps.push({ step: 2, title: 'リズム', finding: 'RR間隔整 → 整脈', severity: 'ok',
      detail: '洞調律・SVT・心房粗動（一定の伝導比）・VTなどが整脈を示す。' })
  } else if (d.rhythm === 'irregular') {
    steps.push({ step: 2, title: 'リズム', finding: 'RR間隔不整（規則的な不整）', severity: 'wn',
      detail: '洞性不整脈（呼吸性変動）・2度房室ブロック（Wenckebach）・期外収縮の二段脈/三段脈を鑑別。' })
  } else if (d.rhythm === 'irregularly_irregular') {
    steps.push({ step: 2, title: 'リズム', finding: 'RR間隔絶対不整（irregularly irregular）', severity: 'dn',
      detail: '心房細動が最も多い。多源性心房頻拍（MAT）・頻発する心房期外収縮も鑑別。CHA₂DS₂-VASc スコアで脳梗塞リスク評価を。' })
  }

  // Step 3: P Wave
  if (d.pWave === 'normal') {
    steps.push({ step: 3, title: 'P波', finding: 'P波: 正常（II誘導で陽性、各QRSに先行）', severity: 'ok',
      detail: '洞結節起源を示唆。形態が一定であれば洞調律。' })
  } else if (d.pWave === 'absent') {
    steps.push({ step: 3, title: 'P波', finding: 'P波: 消失', severity: 'dn',
      detail: 'P波消失 + irregularly irregular → 心房細動。P波消失 + narrow QRS regular → AVNRT/接合部調律。P波消失 + wide QRS → VT。' })
  } else if (d.pWave === 'retrograde') {
    steps.push({ step: 3, title: 'P波', finding: 'P波: 逆行性（II・III・aVFで陰性、QRS後方）', severity: 'wn',
      detail: '接合部調律・AVNRT・AVRT を鑑別。逆行性P波がQRS内に隠れている場合もある（pseudo-S in II, pseudo-r\' in V1）。' })
  } else if (d.pWave === 'flutter') {
    steps.push({ step: 3, title: 'P波', finding: 'P波: 鋸歯状波（flutter wave）', severity: 'dn',
      detail: '心房粗動（Atrial Flutter）。典型例は300 bpmの鋸歯状波 + 2:1伝導 → HR 150 bpm。II・III・aVF・V1で確認。' })
  } else if (d.pWave === 'fibrillation') {
    steps.push({ step: 3, title: 'P波', finding: 'P波: 細動波（f波）', severity: 'dn',
      detail: '心房細動。基線の不規則な動揺 + RR間隔絶対不整。弁膜症性 vs 非弁膜症性を区別し、抗凝固療法の適応を判断。' })
  }

  // Step 4: PR Interval
  if (d.prInterval === 'normal') {
    steps.push({ step: 4, title: 'PR間隔', finding: 'PR間隔: 正常（120-200 ms）', severity: 'ok',
      detail: '正常な房室伝導。' })
  } else if (d.prInterval === 'short') {
    steps.push({ step: 4, title: 'PR間隔', finding: 'PR間隔: 短縮（< 120 ms）', severity: 'wn',
      detail: 'PR < 120ms: WPW症候群（デルタ波の有無を確認）・LGL症候群・接合部調律・異所性心房調律を鑑別。WPWではδ波＋wide QRSを伴う。' })
  } else if (d.prInterval === 'prolonged_constant') {
    steps.push({ step: 4, title: 'PR間隔', finding: 'PR間隔: 延長（> 200 ms）・一定', severity: 'wn',
      detail: '1度房室ブロック。PR > 200msだが全てのP波にQRSが後続。多くは良性だが、PR > 300msや症候性なら精査。' })
  } else if (d.prInterval === 'prolonged_progressive') {
    steps.push({ step: 4, title: 'PR間隔', finding: 'PR間隔: 漸次延長 → QRS脱落', severity: 'dn',
      detail: '2度房室ブロック Mobitz I型（Wenckebach）。通常はAVノードレベルの障害で良性のことが多いが、症候性なら経過観察/ペーシング。2度Mobitz II型（PRの変化なしに突然脱落）は危険 → ペースメーカーの適応。' })
  }

  // Step 5: QRS Width
  if (d.qrsWidth === 'narrow') {
    steps.push({ step: 5, title: 'QRS幅', finding: 'QRS < 120 ms → narrow QRS', severity: 'ok',
      detail: '正常な心室内伝導。頻脈であればSVTを示唆。' })
  } else if (d.qrsWidth === 'wide') {
    let wideDetail = 'QRS ≧ 120ms: '
    if (rate > 100) {
      wideDetail += '頻脈 + wide QRS → VT vs SVT with aberrancy を鑑別（Brugada criteria）。血行動態不安定なら迷わず除細動。安定例でもVTを先に除外。'
    } else {
      wideDetail += '脚ブロック（RBBB/LBBB）・心室ペーシング・WPW・高K血症・薬物中毒（TCA・Na channel blocker）を鑑別。'
    }
    steps.push({ step: 5, title: 'QRS幅', finding: 'QRS ≧ 120 ms → wide QRS', severity: 'dn', detail: wideDetail })

    // RBBB vs LBBB hints
    if (d.otherFindings.includes('rbbb')) {
      steps.push({ step: 5.5, title: 'QRS形態', finding: '右脚ブロック（RBBB）パターン', severity: 'neutral',
        detail: 'V1でrsR\'（M字型）、V6でqRs + 幅広S波。新規RBBBならPE・右心負荷を鑑別。' })
    }
    if (d.otherFindings.includes('lbbb')) {
      steps.push({ step: 5.5, title: 'QRS形態', finding: '左脚ブロック（LBBB）パターン', severity: 'wn',
        detail: 'V1でrS/QS、V5-V6で幅広R（ノッチ）。新規LBBBは急性心筋梗塞の等価所見 → Sgarbossa criteria で評価。基礎疾患（心筋症・弁膜症）の検索も。' })
    }
  }

  // Step 6: Axis
  if (d.axis === 'normal') {
    steps.push({ step: 6, title: '電気軸', finding: '正常軸（-30° 〜 +90°）', severity: 'ok',
      detail: 'I・aVF ともに陽性。正常所見。' })
  } else if (d.axis === 'lad') {
    steps.push({ step: 6, title: '電気軸', finding: '左軸偏位（LAD: < -30°）', severity: 'wn',
      detail: 'I(+)・aVF(-): 左脚前枝ブロック（LAFB）・下壁梗塞・LVH・WPW（右側副伝導路）を鑑別。LAFB＋RBBBは二束ブロック → 要経過観察。' })
  } else if (d.axis === 'rad') {
    steps.push({ step: 6, title: '電気軸', finding: '右軸偏位（RAD: > +90°）', severity: 'wn',
      detail: 'I(-)・aVF(+): 右室肥大（PHT・肺性心）・左脚後枝ブロック（LPFB）・PE・側壁梗塞・WPW（左側副伝導路）を鑑別。' })
  } else if (d.axis === 'extreme') {
    steps.push({ step: 6, title: '電気軸', finding: '高度軸偏位（Northwest axis）', severity: 'dn',
      detail: 'I(-)・aVF(-): VT・重度のRVH・重度の左脚後枝ブロック＋LVH・リード付け間違いも確認。' })
  }

  // Step 7: ST Changes
  if (d.stChange === 'none') {
    steps.push({ step: 7, title: 'ST変化', finding: 'ST変化: なし', severity: 'ok',
      detail: '有意なST偏位を認めない。' })
  } else if (d.stChange === 'elevation') {
    const leads = d.stLeads || '（誘導未指定）'
    steps.push({ step: 7, title: 'ST変化', finding: `ST上昇（${leads}）`, severity: 'dn',
      detail: getSTelevationDetail(leads) })
  } else if (d.stChange === 'depression') {
    const leads = d.stLeads || '（誘導未指定）'
    steps.push({ step: 7, title: 'ST変化', finding: `ST低下（${leads}）`, severity: 'dn',
      detail: 'ST低下: 心内膜下虚血（NSTEMI）・ジギタリス効果（盆状低下）・LVH（strain pattern）・低K血症・対側性変化（reciprocal change）を鑑別。高リスクならトロポニン＋連続心電図。' })
  } else if (d.stChange === 'both') {
    steps.push({ step: 7, title: 'ST変化', finding: 'ST上昇 + ST低下の共存', severity: 'dn',
      detail: '急性心筋梗塞（STEMI）の可能性が高い。ST上昇誘導の対側で reciprocal ST depression を認める場合、特異度が上昇。緊急カテーテル検査の適応を検討。' })
  }

  // Step 8: T Wave
  if (d.tWave === 'normal') {
    steps.push({ step: 8, title: 'T波', finding: 'T波: 正常', severity: 'ok',
      detail: '有意なT波異常を認めない。' })
  } else if (d.tWave === 'inverted') {
    steps.push({ step: 8, title: 'T波', finding: 'T波: 陰性', severity: 'wn',
      detail: 'T波陰性: 虚血（特に前胸部誘導の左右対称性deep T inversion → Wellens症候群 = LAD近位部高度狭窄）・LVH with strain・PE（右心負荷でV1-V4）・脳血管障害（巨大陰性T）・たこつぼ心筋症を鑑別。' })
  } else if (d.tWave === 'peaked') {
    steps.push({ step: 8, title: 'T波', finding: 'T波: 尖鋭化（テント状）', severity: 'dn',
      detail: 'テント状T波: 高K血症が最重要（K > 5.5-6.0 mEq/L）。超急性期STEMI（局在性）・正常亜型との鑑別。高K血症の場合QRS幅増大・P波消失を伴えば緊急対応（Ca製剤・GI療法）。' })
  } else if (d.tWave === 'flattened') {
    steps.push({ step: 8, title: 'T波', finding: 'T波: 平坦化', severity: 'wn',
      detail: 'T波平坦化: 低K血症・虚血・ジギタリス・甲状腺機能低下症・心膜炎回復期を鑑別。電解質（特にK・Mg）を確認。' })
  }

  // Step 9: QTc
  const qtc = parseInt(d.qtc)
  if (qtc) {
    if (qtc > 500) {
      steps.push({ step: 9, title: 'QTc間隔', finding: `QTc ${qtc} ms → 著明延長（TdP高リスク）`, severity: 'dn',
        detail: 'QTc > 500ms: Torsades de Pointes（TdP）の高リスク。QT延長薬（抗不整脈薬・抗精神病薬・抗菌薬等）の中止、電解質補正（K > 4.0, Mg > 2.0）、MgSO₄投与を検討。先天性QT延長症候群も鑑別。' })
    } else if (qtc > 470) {
      steps.push({ step: 9, title: 'QTc間隔', finding: `QTc ${qtc} ms → 延長（女性基準）`, severity: 'wn',
        detail: 'QTc 470-500ms: 境界域延長。QT延長薬の併用を確認。女性で > 470ms・男性で > 450msが延長の目安。' })
    } else if (qtc > 450) {
      steps.push({ step: 9, title: 'QTc間隔', finding: `QTc ${qtc} ms → 軽度延長（男性基準）`, severity: 'wn',
        detail: 'QTc 450-470ms: 男性では軽度延長。薬剤歴・家族歴を確認。' })
    } else if (qtc >= 350) {
      steps.push({ step: 9, title: 'QTc間隔', finding: `QTc ${qtc} ms → 正常`, severity: 'ok',
        detail: 'QTc 350-450ms: 正常範囲。' })
    } else {
      steps.push({ step: 9, title: 'QTc間隔', finding: `QTc ${qtc} ms → 短縮`, severity: 'wn',
        detail: 'QTc < 350ms: 短QT症候群（遺伝性）・高Ca血症・ジギタリス・高体温を鑑別。QTc < 330msは心臓突然死リスク上昇。' })
    }
  }

  // Step 10: Other findings
  if (d.otherFindings.includes('delta')) {
    steps.push({ step: 10, title: 'その他の所見', finding: 'デルタ波（δ波）あり', severity: 'dn',
      detail: 'WPW症候群（Kent束による早期興奮）。PR短縮 + δ波 + wide QRS の三徴。Type A（V1で陽性δ波=左側副伝導路）vs Type B（V1で陰性=右側副伝導路）。AF合併時はジギタリス・Ca拮抗薬・アデノシンは禁忌。' })
  }
  if (d.otherFindings.includes('j_point')) {
    steps.push({ step: 10, title: 'その他の所見', finding: 'J点上昇 / 早期再分極パターン', severity: 'neutral',
      detail: '早期再分極: 多くは良性（若年男性）。ただし下壁・側壁誘導のJ点上昇は心臓突然死リスク上昇の報告あり。失神の既往があれば精査を。' })
  }
  if (d.otherFindings.includes('u_wave')) {
    steps.push({ step: 10, title: 'その他の所見', finding: 'U波', severity: 'wn',
      detail: 'U波: 低K血症（最も多い）・低Mg血症・LVH・徐脈・ジギタリス・QT延長で出現。陰性U波は虚血を示唆。' })
  }
  if (d.otherFindings.includes('lvh')) {
    steps.push({ step: 10, title: 'その他の所見', finding: 'LVH所見（Sokolow-Lyon or Cornell基準）', severity: 'wn',
      detail: 'Sokolow-Lyon: SV1 + RV5 or V6 > 35mm。Cornell: RaVL + SV3 > 28mm（男）/ > 20mm（女）。Strain pattern（ST低下＋非対称性T波陰転）を伴えばLVHの可能性が高い。' })
  }
  if (d.otherFindings.includes('rvh')) {
    steps.push({ step: 10, title: 'その他の所見', finding: 'RVH所見', severity: 'wn',
      detail: 'V1でR > S、右軸偏位、V1-V3のST低下＋T波陰転。肺高血圧症・僧帽弁狭窄症・先天性心疾患を鑑別。P pulmonale（II誘導でP波尖鋭化 > 2.5mm）を伴えば右房負荷も示唆。' })
  }
  if (d.otherFindings.includes('low_voltage')) {
    steps.push({ step: 10, title: 'その他の所見', finding: '低電位', severity: 'wn',
      detail: '肢誘導QRS < 5mm or 胸部誘導 < 10mm: 心嚢液貯留・COPD（肺過膨張）・甲状腺機能低下症・心アミロイドーシス・高度肥満・浮腫を鑑別。心嚢液ではelectrical alternansの有無も確認。' })
  }
  if (d.otherFindings.includes('q_wave')) {
    steps.push({ step: 10, title: 'その他の所見', finding: '異常Q波', severity: 'dn',
      detail: '幅 > 40ms or 深さ > R波の1/4: 陳旧性心筋梗塞を示唆。部位診断: II/III/aVF=下壁、V1-V4=前壁、I/aVL/V5-V6=側壁。肥大型心筋症でもseptal Qが出現する。' })
  }

  return steps
}

function getSTelevationDetail(leads: string): string {
  const l = leads.toLowerCase()
  let detail = 'ST上昇の鑑別: STEMI（最重要）・急性心膜炎（広範囲のST上昇＋PR低下）・早期再分極・Brugada症候群（V1-V3）・たこつぼ心筋症。'

  if (l.includes('v1') || l.includes('v2') || l.includes('v3') || l.includes('v4')) {
    detail += ' 前胸部誘導のST上昇 → LAD領域の急性前壁STEMI を最優先で鑑別。'
  }
  if (l.includes('ii') || l.includes('iii') || l.includes('avf')) {
    detail += ' 下壁誘導のST上昇 → RCA（右冠動脈）領域の下壁STEMI。右室梗塞の合併（V4R）を確認。'
  }
  if (l.includes('i') || l.includes('avl') || l.includes('v5') || l.includes('v6')) {
    detail += ' 側壁誘導のST上昇 → LCx領域の側壁STEMI を鑑別。'
  }
  if (l.includes('広範') || l.includes('全')) {
    detail += ' 広範なST上昇（ほぼ全誘導）→ 急性心膜炎（aVRでST低下＋PR上昇が特徴的）・たこつぼ心筋症を鑑別。'
  }

  return detail
}

// ── UI Components ──
const severityStyles: Record<Severity, string> = {
  ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]',
  wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]',
  dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]',
  neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]',
}
const severityTextColor: Record<Severity, string> = {
  ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]',
}

function SelectField({ id, label, value, onChange, options, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-tx mb-0.5">{label}</label>
      {hint && <p className="text-[10px] text-muted mb-0.5">{hint}</p>}
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac">
        <option value="">選択してください</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function NumField({ id, label, unit, value, onChange, hint }: {
  id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-tx mb-0.5">
        {label}{unit && <span className="text-muted ml-1">({unit})</span>}
      </label>
      {hint && <p className="text-[10px] text-muted mb-0.5">{hint}</p>}
      <input type="number" id={id} inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac" />
    </div>
  )
}

const otherFindingOptions = [
  { value: 'rbbb', label: 'RBBB' }, { value: 'lbbb', label: 'LBBB' },
  { value: 'delta', label: 'δ波（デルタ波）' }, { value: 'j_point', label: 'J点上昇 / 早期再分極' },
  { value: 'u_wave', label: 'U波' }, { value: 'lvh', label: 'LVH所見' },
  { value: 'rvh', label: 'RVH所見' }, { value: 'low_voltage', label: '低電位' },
  { value: 'q_wave', label: '異常Q波' },
]

export default function ECGInterpretPage() {
  const [input, setInput] = useState<ECGInput>(defaults)
  const set = <K extends keyof ECGInput>(key: K) => (val: ECGInput[K]) => setInput(prev => ({ ...prev, [key]: val }))

  const toggleFinding = (value: string) => {
    setInput(prev => ({
      ...prev,
      otherFindings: prev.otherFindings.includes(value)
        ? prev.otherFindings.filter(f => f !== value)
        : [...prev.otherFindings, value]
    }))
  }

  const steps = useMemo(() => interpret(input), [input])
  const hasPrimary = steps.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <Link href="/tools/interpret" className="hover:text-ac">検査読影</Link>
        <span className="mx-2">›</span>
        <span>心電図</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-6">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🫀 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">心電図（ECG）系統的読影フロー</h1>
        <p className="text-sm text-muted">
          心拍数 → リズム → P波 → PR間隔 → QRS → 軸 → ST変化 → T波 → QTc をステップバイステップで解釈。見落としを防ぐ9項目チェック。
        </p>
      </header>

      {/* 入力 */}
      <section className="bg-s0 border border-br rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold text-tx mb-3">心電図所見の入力</h2>

        {/* Row 1: Rate + Rhythm */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <NumField id="rate" label="心拍数" unit="bpm" value={input.rate} onChange={v => set('rate')(v)} />
          <SelectField id="rhythm" label="リズム" value={input.rhythm} onChange={v => set('rhythm')(v as ECGInput['rhythm'])}
            options={[
              { value: 'regular', label: '整（regular）' },
              { value: 'irregular', label: '不整（規則的に不整）' },
              { value: 'irregularly_irregular', label: '絶対不整（irregularly irregular）' },
            ]} />
        </div>

        {/* Row 2: P wave + PR */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SelectField id="pWave" label="P波" value={input.pWave} onChange={v => set('pWave')(v as ECGInput['pWave'])}
            options={[
              { value: 'normal', label: '正常（II誘導陽性、QRSに先行）' },
              { value: 'absent', label: '消失' },
              { value: 'retrograde', label: '逆行性（II/III/aVFで陰性）' },
              { value: 'flutter', label: '鋸歯状波（flutter wave）' },
              { value: 'fibrillation', label: '細動波（f波）' },
            ]} />
          <SelectField id="prInterval" label="PR間隔" value={input.prInterval} onChange={v => set('prInterval')(v as ECGInput['prInterval'])}
            options={[
              { value: 'normal', label: '正常（120-200 ms）' },
              { value: 'short', label: '短縮（< 120 ms）' },
              { value: 'prolonged_constant', label: '延長・一定（> 200 ms）' },
              { value: 'prolonged_progressive', label: '漸次延長→QRS脱落' },
            ]} />
        </div>

        {/* Row 3: QRS + Axis */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SelectField id="qrsWidth" label="QRS幅" value={input.qrsWidth} onChange={v => set('qrsWidth')(v as ECGInput['qrsWidth'])}
            options={[
              { value: 'narrow', label: 'Narrow（< 120 ms）' },
              { value: 'wide', label: 'Wide（≧ 120 ms）' },
            ]} />
          <SelectField id="axis" label="電気軸" value={input.axis} onChange={v => set('axis')(v as ECGInput['axis'])}
            hint="I誘導・aVF誘導のQRS極性で判定"
            options={[
              { value: 'normal', label: '正常軸（I+, aVF+）' },
              { value: 'lad', label: '左軸偏位（I+, aVF-）' },
              { value: 'rad', label: '右軸偏位（I-, aVF+）' },
              { value: 'extreme', label: '高度軸偏位（I-, aVF-）' },
            ]} />
        </div>

        {/* Row 4: ST + leads */}
        <h2 className="text-sm font-bold text-tx mb-3 mt-4">ST-T変化</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SelectField id="stChange" label="ST変化" value={input.stChange} onChange={v => set('stChange')(v as ECGInput['stChange'])}
            options={[
              { value: 'none', label: 'なし' },
              { value: 'elevation', label: 'ST上昇' },
              { value: 'depression', label: 'ST低下' },
              { value: 'both', label: 'ST上昇＋低下の共存' },
            ]} />
          {(input.stChange === 'elevation' || input.stChange === 'depression' || input.stChange === 'both') && (
            <div>
              <label htmlFor="stLeads" className="block text-xs font-medium text-tx mb-0.5">ST変化の誘導</label>
              <p className="text-[10px] text-muted mb-0.5">例: V1-V4, II/III/aVF</p>
              <input type="text" id="stLeads" value={input.stLeads} onChange={e => set('stLeads')(e.target.value)}
                placeholder="V1-V4, II/III/aVF..."
                className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac" />
            </div>
          )}
        </div>

        {/* Row 5: T wave + QTc */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SelectField id="tWave" label="T波" value={input.tWave} onChange={v => set('tWave')(v as ECGInput['tWave'])}
            options={[
              { value: 'normal', label: '正常' },
              { value: 'inverted', label: '陰性T波' },
              { value: 'peaked', label: '尖鋭化（テント状）' },
              { value: 'flattened', label: '平坦化' },
            ]} />
          <NumField id="qtc" label="QTc" unit="ms" value={input.qtc} onChange={v => set('qtc')(v)}
            hint="Bazett補正値（QTc = QT/√RR）" />
        </div>

        {/* Other findings */}
        <h2 className="text-sm font-bold text-tx mb-3 mt-4">その他の所見（該当するものをチェック）</h2>
        <div className="flex flex-wrap gap-2">
          {otherFindingOptions.map(o => (
            <button key={o.value} onClick={() => toggleFinding(o.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                input.otherFindings.includes(o.value)
                  ? 'bg-ac text-white border-ac'
                  : 'bg-bg text-tx border-br hover:border-ac/30'
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* ステップバイステップ結果 */}
      {hasPrimary && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-tx mb-4">読影結果（{steps.length}項目）</h2>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 ${severityStyles[s.severity]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityTextColor[s.severity]} bg-white/60`}>
                    Step {Math.floor(s.step)}
                  </span>
                  <span className={`text-sm font-bold ${severityTextColor[s.severity]}`}>{s.title}</span>
                </div>
                <p className={`text-sm font-medium mb-1 ${severityTextColor[s.severity]}`}>{s.finding}</p>
                {s.detail && <p className="text-xs text-tx/80">{s.detail}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ツールは医療従事者の心電図読影を補助する目的で提供しています。自動判定アルゴリズムではなく、入力された所見に基づく教育的ガイドです。診断・治療の最終判断は必ず担当医が行ってください。</p>
      </div>

      {/* SEO解説 */}
      <section className="space-y-4 text-sm text-muted mb-8">
        <h2 className="text-base font-bold text-tx">心電図の系統的読影アプローチ</h2>
        <p>心電図（ECG/EKG）の読影は系統的に行うことで見落としを防ぎます。本ツールは「Rate → Rhythm → P wave → PR → QRS → Axis → ST → T → QTc」の9ステップで、入力された所見から鑑別疾患と次の評価ステップを提示します。</p>

        <h3 className="font-bold text-tx">頻脈の鑑別（Narrow QRS vs Wide QRS）</h3>
        <p>Narrow QRS（&lt; 120ms）: 洞性頻脈・AVNRT・AVRT・心房粗動・心房細動。Wide QRS（≧ 120ms）: VT・SVT with aberrancy・antidromic AVRT。Brugada criteriaで鑑別し、血行動態不安定なら迷わず電気的除細動。</p>

        <h3 className="font-bold text-tx">ST上昇の鑑別</h3>
        <p>STEMI（緊急カテーテル適応）・急性心膜炎（広範囲ST上昇＋PR低下、aVRでST低下）・早期再分極（若年男性、J点上昇）・Brugada症候群（V1-V3のcoved型ST上昇）・たこつぼ心筋症。</p>

        <h3 className="font-bold text-tx">QT延長の評価</h3>
        <p>QTcはBazett補正（QT/√RR）で算出。男性 &gt; 450ms・女性 &gt; 470msで延長。500ms超はTorsades de Pointesの高リスクで、原因薬剤の中止と電解質補正（K &gt; 4.0, Mg &gt; 2.0）が必要。</p>
      </section>

      {/* 関連ツール */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { slug: 'qtc-calculator', name: 'QTc計算' },
            { slug: 'cha2ds2-vasc', name: 'CHA₂DS₂-VASc' },
            { slug: 'has-bled', name: 'HAS-BLED' },
            { slug: 'heart-score', name: 'HEART Score' },
            { slug: 'grace', name: 'GRACE' },
            { slug: 'map', name: '平均動脈圧' },
          ].map(t => (
            <Link key={t.slug} href={`/tools/calc/${t.slug}`}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 参考文献 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Goldberger AL. Clinical Electrocardiography: A Simplified Approach, 10th ed. Elsevier, 2023</li>
          <li>Surawicz B et al. AHA/ACCF/HRS Recommendations for the Standardization and Interpretation of the ECG. JACC 2009</li>
          <li>Brugada P et al. A new approach to the differential diagnosis of a regular tachycardia with a wide QRS complex. Circulation 1991</li>
          <li>Priori SG et al. ESC Guidelines for the management of patients with ventricular arrhythmias. Eur Heart J 2015</li>
        </ol>
      </section>
    </div>
  )
}
