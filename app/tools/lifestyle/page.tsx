'use client'

import { useState, useMemo } from 'react'

// ── 型定義 ──
interface PatientData {
  age: string; sex: string; height: string; weight: string; waist: string
  sbp: string; dbp: string
  hba1c: string; fbs: string; tc: string; ldl: string; hdl: string; tg: string
  ast: string; alt: string; ggt: string; ua: string; cr: string
  uacr: string // 尿アルブミン/Cr比
  smoking: string; alcohol: string; exercise: string
  fhCvd: boolean; fhDm: boolean; fhHtn: boolean
  currentDm: boolean; currentHtn: boolean; currentDl: boolean; currentCkd: boolean
  onStatin: boolean; onAntihtn: boolean; onDmMed: boolean
}

interface ActionItem {
  category: 'screening' | 'referral' | 'lifestyle' | 'medication' | 'monitoring'
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
}

interface DiseaseAssessment {
  name: string
  status: 'normal' | 'caution' | 'abnormal' | 'diagnosed'
  summary: string
  targets: string[]
  actions: ActionItem[]
}

const defaultData: PatientData = {
  age: '55', sex: 'male', height: '170', weight: '78', waist: '90',
  sbp: '148', dbp: '92',
  hba1c: '6.8', fbs: '118', tc: '240', ldl: '', hdl: '45', tg: '180',
  ast: '38', alt: '52', ggt: '68', ua: '7.8', cr: '1.1',
  uacr: '',
  smoking: 'ex', alcohol: 'light', exercise: 'none',
  fhCvd: false, fhDm: true, fhHtn: false,
  currentDm: false, currentHtn: false, currentDl: false, currentCkd: false,
  onStatin: false, onAntihtn: false, onDmMed: false,
}

// ── 計算ヘルパー ──
function calcBmi(h: number, w: number): number { return w / ((h / 100) ** 2) }
function calcEgfr(cr: number, age: number, sex: string): number {
  // 日本腎臓学会 CKD-EPI(日本人係数)
  const s = sex === 'male' ? 194 : 194
  const alpha = sex === 'male' ? -0.287 : -0.329
  const k = sex === 'male' ? 0.9 : 0.7
  const min = Math.min(cr / k, 1)
  const max = Math.max(cr / k, 1)
  const coeff = sex === 'female' ? 0.739 : 1.0
  // 簡易日本人式: 194 × Cr^-1.094 × Age^-0.287 (男性), ×0.739 (女性)
  return 194 * Math.pow(cr, -1.094) * Math.pow(age, -0.287) * coeff
}
function calcLdl(tc: number, hdl: number, tg: number): number { return tc - hdl - tg / 5 }

// ── 疾患評価エンジン ──
function assessAll(d: PatientData): DiseaseAssessment[] {
  const results: DiseaseAssessment[] = []
  const age = parseFloat(d.age) || 0
  const bmi = (parseFloat(d.height) && parseFloat(d.weight)) ? calcBmi(parseFloat(d.height), parseFloat(d.weight)) : null
  const sbp = parseFloat(d.sbp) || 0
  const dbp = parseFloat(d.dbp) || 0
  const hba1c = parseFloat(d.hba1c) || 0
  const fbs = parseFloat(d.fbs) || 0
  const ldl = parseFloat(d.ldl) || ((parseFloat(d.tc) && parseFloat(d.hdl) && parseFloat(d.tg)) ? calcLdl(parseFloat(d.tc), parseFloat(d.hdl), parseFloat(d.tg)) : 0)
  const hdl = parseFloat(d.hdl) || 0
  const tg = parseFloat(d.tg) || 0
  const ast = parseFloat(d.ast) || 0
  const alt = parseFloat(d.alt) || 0
  const ggt = parseFloat(d.ggt) || 0
  const ua = parseFloat(d.ua) || 0
  const cr = parseFloat(d.cr) || 0
  const uacr = parseFloat(d.uacr) || 0
  const egfr = (cr && age) ? calcEgfr(cr, age, d.sex) : null
  const waist = parseFloat(d.waist) || 0
  const isMetSyn = bmi && bmi >= 25 && waist && ((d.sex === 'male' && waist >= 85) || (d.sex === 'female' && waist >= 90))

  // ── 1. 高血圧 ──
  if (sbp || dbp) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    if (sbp >= 180 || dbp >= 110) {
      status = 'abnormal'; summary = 'III度高血圧 — 速やかな降圧治療開始'
      a.push({ category: 'medication', priority: 'high', title: '降圧薬開始', detail: 'Ca拮抗薬 or ARB/ACE-I。二次性高血圧の除外を並行' })
    } else if (sbp >= 140 || dbp >= 90) {
      status = d.currentHtn ? 'diagnosed' : 'abnormal'
      summary = d.currentHtn ? '高血圧治療中 — 目標未達' : 'I-II度高血圧'
      a.push({ category: 'monitoring', priority: 'high', title: '家庭血圧測定指導', detail: '朝（起床後1h以内・排尿後・朝食前）と就寝前。135/85以上で高血圧' })
    } else if (sbp >= 130 || dbp >= 80) {
      status = 'caution'; summary = '高値血圧 — 生活習慣改善を優先'
    } else {
      status = 'normal'; summary = '血圧正常'
    }

    if (sbp >= 140 || dbp >= 90) {
      a.push({ category: 'screening', priority: 'high', title: '二次性高血圧スクリーニング', detail: '若年(<40歳)・急速発症・治療抵抗性 → PAC/PRA、血中/尿中カテコラミン、腎動脈エコー' })
      a.push({ category: 'screening', priority: 'medium', title: 'SAS（睡眠時無呼吸）スクリーニング', detail: '肥満・いびき・日中傾眠 → Epworth眠気尺度 → 簡易PSG' })
    }

    // 降圧目標
    if (d.currentDm || (egfr && egfr < 60) || uacr >= 30) {
      targets.push('降圧目標: 130/80 mmHg未満（DM/CKD/蛋白尿）')
    } else if (age >= 75) {
      targets.push('降圧目標: 140/90 mmHg未満（75歳以上、忍容性があれば130/80）')
    } else {
      targets.push('降圧目標: 130/80 mmHg未満（一般成人）')
    }

    // 生活指導
    a.push({ category: 'lifestyle', priority: 'medium', title: '減塩指導', detail: '食塩 6g/日未満。漬物・味噌汁・麺類の塩分に注意。減塩醤油の活用' })
    if (bmi && bmi >= 25) {
      a.push({ category: 'lifestyle', priority: 'medium', title: '減量指導', detail: `現在BMI ${bmi.toFixed(1)}。3-6ヶ月で現体重の3%減を目標。4kg減で約4mmHg降圧` })
    }

    results.push({ name: '高血圧', status, summary, targets, actions: a })
  }

  // ── 2. 糖尿病 ──
  if (hba1c || fbs) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    if (hba1c >= 6.5 || fbs >= 126 || d.currentDm) {
      status = d.currentDm ? 'diagnosed' : 'abnormal'
      summary = d.currentDm
        ? `DM治療中（HbA1c ${hba1c || '未入力'}）`
        : '糖尿病型 — 75gOGTTまたは再検で確定'

      if (hba1c >= 8.0) {
        a.push({ category: 'medication', priority: 'high', title: '治療強化の検討', detail: 'インスリン導入 or GLP-1RA追加。シックデイルールの教育' })
      }
      a.push({ category: 'screening', priority: 'high', title: '合併症スクリーニング', detail: '眼底検査（年1回）、尿中アルブミン、神経伝導速度、ABI、頸動脈エコー' })
      a.push({ category: 'monitoring', priority: 'medium', title: '定期モニタリング', detail: 'HbA1c 1-3ヶ月毎、腎機能・脂質 3-6ヶ月毎' })

      // 目標設定
      if (age >= 75) {
        targets.push('HbA1c目標: 8.0%未満（低血糖リスクが高い高齢者）')
      } else if (d.currentDm && age >= 65) {
        targets.push('HbA1c目標: 7.0%未満（ただし65歳以上は低血糖に注意）')
      } else {
        targets.push('HbA1c目標: 7.0%未満（合併症予防）')
      }
    } else if (hba1c >= 6.0 || fbs >= 110) {
      status = 'caution'; summary = '境界型（糖尿病予備群） — 75gOGTTを検討'
      a.push({ category: 'screening', priority: 'medium', title: '75gOGTT', detail: '空腹時採血→75gブドウ糖負荷→2h後採血。正常型/境界型/糖尿病型を判定' })
      targets.push('HbA1c 6.5%未満を維持。体重管理が最重要')
    } else {
      status = 'normal'; summary = '血糖正常'
    }

    // 食事指導
    if (status !== 'normal') {
      a.push({ category: 'lifestyle', priority: 'high', title: '食事療法', detail: '標準体重×25-30 kcal/日。炭水化物50-60%、蛋白15-20%、脂質20-25%。食物繊維を積極的に' })
      a.push({ category: 'lifestyle', priority: 'medium', title: '運動療法', detail: '有酸素運動150分/週以上（速歩・水泳等）＋レジスタンス運動週2-3回' })
    }

    results.push({ name: '糖尿病', status, summary, targets, actions: a })
  }

  // ── 3. 脂質異常症 ──
  if (ldl || tg || hdl) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    const hasAbnormal = ldl >= 140 || tg >= 150 || (hdl && hdl < 40)

    if (hasAbnormal || d.currentDl) {
      status = d.currentDl ? 'diagnosed' : 'abnormal'
      const abnormalities: string[] = []
      if (ldl >= 140) abnormalities.push(`LDL ${Math.round(ldl)} mg/dL`)
      if (tg >= 150) abnormalities.push(`TG ${Math.round(tg)} mg/dL`)
      if (hdl && hdl < 40) abnormalities.push(`HDL ${Math.round(hdl)} mg/dL（低HDL）`)
      summary = abnormalities.join('、') || '脂質異常症治療中'

      // FHスクリーニング
      if (ldl >= 180) {
        a.push({ category: 'screening', priority: 'high', title: 'FH（家族性高コレステロール血症）スクリーニング', detail: 'LDL≧180: アキレス腱厚（>9mm）、家族歴、角膜輪。FH疑いならLDL<100を目標' })
      }
      // 甲状腺チェック
      if (ldl >= 160) {
        a.push({ category: 'screening', priority: 'medium', title: '二次性脂質異常の除外', detail: 'TSH（甲状腺機能低下）、尿蛋白（ネフローゼ）、肝機能（胆汁うっ滞）' })
      }

      // リスク層別化・目標
      const isSecondary = d.currentDm || (d.fhCvd && age >= 50) || d.currentCkd
      if (isSecondary) {
        targets.push('LDL-C目標: < 100 mg/dL（二次予防/高リスク）')
        targets.push('non-HDL-C目標: < 130 mg/dL')
      } else {
        targets.push('LDL-C目標: < 120〜140 mg/dL（一次予防・リスクに応じて）')
        targets.push('non-HDL-C目標: LDL目標+30 mg/dL')
      }
      if (tg >= 500) {
        a.push({ category: 'medication', priority: 'high', title: '高TG血症治療', detail: 'TG≧500: 急性膵炎リスク。フィブラート系開始を検討。禁酒指導' })
      } else if (tg >= 150) {
        targets.push('TG目標: < 150 mg/dL（空腹時）')
      }
    } else if (ldl >= 120) {
      status = 'caution'; summary = 'LDL境界域高値'
    } else {
      status = 'normal'; summary = '脂質正常'
    }

    if (status !== 'normal') {
      a.push({ category: 'lifestyle', priority: 'high', title: '食事指導（脂質管理）', detail: '飽和脂肪酸<7%エネルギー。トランス脂肪酸回避。食物繊維25g/日。n-3系脂肪酸（青魚）を推奨' })
    }

    results.push({ name: '脂質異常症', status, summary, targets, actions: a })
  }

  // ── 4. 高尿酸血症 ──
  if (ua) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    if (ua >= 9.0) {
      status = 'abnormal'; summary = `UA ${ua} mg/dL — 痛風発作リスク高。無症状でも薬物療法を検討`
      a.push({ category: 'medication', priority: 'high', title: '尿酸降下薬の開始検討', detail: 'フェブキソスタット10mgから or アロプリノール100mgから。腎結石既往 → 産生抑制型を選択' })
    } else if (ua >= 7.0) {
      status = 'caution'; summary = `UA ${ua} mg/dL — 高尿酸血症。生活習慣改善を優先`
      if (d.currentCkd || d.currentHtn) {
        a.push({ category: 'medication', priority: 'medium', title: '薬物療法の検討', detail: 'CKD/高血圧合併 → UA 6.0未満を目標に薬物療法を考慮' })
      }
    } else {
      status = 'normal'; summary = '尿酸正常'
    }

    if (status !== 'normal') {
      targets.push('UA目標: 6.0 mg/dL未満（痛風既往/腎障害時）')
      a.push({ category: 'lifestyle', priority: 'medium', title: '食事指導（高尿酸）', detail: 'プリン体制限（内臓・干物・ビール）。水分2L/日。乳製品は尿酸排泄促進。果糖・アルコール制限' })
    }

    results.push({ name: '高尿酸血症', status, summary, targets, actions: a })
  }

  // ── 5. CKD ──
  if (egfr || uacr) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    const ckdStage = egfr ? (egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : egfr >= 30 ? 'G3b' : egfr >= 15 ? 'G4' : 'G5') : ''
    const albStage = uacr < 30 ? 'A1' : uacr < 300 ? 'A2' : 'A3'

    if ((egfr && egfr < 60) || uacr >= 30) {
      status = 'abnormal'
      summary = `CKD ${ckdStage}${uacr ? ` ${albStage}` : ''}（eGFR ${egfr?.toFixed(0) || '?'}）`

      if (egfr && egfr < 45) {
        a.push({ category: 'referral', priority: 'high', title: '腎臓内科紹介', detail: `eGFR ${egfr.toFixed(0)} — G3b以下は腎臓専門医と連携` })
      }
      a.push({ category: 'monitoring', priority: 'high', title: 'CKD管理', detail: 'Cr/eGFR + 尿アルブミン 3ヶ月毎。K・Ca・P・Hb 定期フォロー' })
      a.push({ category: 'lifestyle', priority: 'high', title: '食事指導（CKD）', detail: `蛋白質 0.8g/kg/日（G3a以下）。食塩 6g/日未満。K制限（G4以上）` })

      if (uacr >= 30 && !d.currentDm) {
        a.push({ category: 'medication', priority: 'medium', title: 'RAS阻害薬の検討', detail: '蛋白尿陽性 → ARB/ACE-Iで腎保護。K・Crを2週後に再検' })
      }

      targets.push(`eGFR低下速度 < 4 mL/min/1.73m²/年を目標`)
      if (uacr >= 30) targets.push('蛋白尿減少を目標（RAS阻害薬 + 減塩）')
    } else {
      status = 'normal'; summary = `腎機能正常（eGFR ${egfr?.toFixed(0) || '?'}）`
    }

    results.push({ name: 'CKD', status, summary, targets, actions: a })
  }

  // ── 6. 肝障害/脂肪肝 ──
  if (ast || alt || ggt) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    const hasElevation = alt > 30 || ast > 30 || ggt > 50
    const fib4 = (ast && alt && age) ? (age * ast) / (Math.sqrt(alt) * 150) : null // 簡易FIB-4近似（血小板未入力時）

    if (hasElevation) {
      status = 'caution'
      const vals: string[] = []
      if (alt > 30) vals.push(`ALT ${alt}`)
      if (ast > 30) vals.push(`AST ${ast}`)
      if (ggt > 50) vals.push(`γGTP ${ggt}`)
      summary = vals.join(', ') + ' — 肝障害精査を'

      a.push({ category: 'screening', priority: 'high', title: '腹部エコー', detail: '脂肪肝の有無・肝腫大・胆石・脾腫を評価。MASLD（旧NAFLD）スクリーニング' })
      a.push({ category: 'screening', priority: 'medium', title: '肝炎ウイルスチェック', detail: 'HBs抗原 + HCV抗体（未検の場合）' })

      if (alt > 30 && bmi && bmi >= 25) {
        a.push({ category: 'screening', priority: 'medium', title: 'MASLD/MASH評価', detail: 'FIB-4 index（AST・ALT・年齢・血小板）→ 1.3以上で肝線維化リスク。当サイトのFIB-4ツールで計算' })
        a.push({ category: 'lifestyle', priority: 'high', title: '減量指導（脂肪肝）', detail: '体重の7-10%減で肝脂肪・線維化が改善。有酸素運動150分/週' })
      }
      if (ggt > 100 && d.alcohol !== 'none') {
        a.push({ category: 'lifestyle', priority: 'high', title: '節酒/禁酒指導', detail: 'γGTP高値 + 飲酒 → アルコール性肝障害を疑う。男性40g/日・女性20g/日以下に' })
      }

      targets.push('ALT正常化（30 IU/L以下）を目標')
    } else {
      status = 'normal'; summary = '肝機能正常'
    }

    results.push({ name: '肝障害/脂肪肝', status, summary, targets, actions: a })
  }

  // ── 7. 肥満/メタボ ──
  if (bmi) {
    const a: ActionItem[] = []
    let status: DiseaseAssessment['status'] = 'normal'
    let summary = ''
    const targets: string[] = []

    if (bmi >= 35) {
      status = 'abnormal'; summary = `BMI ${bmi.toFixed(1)} — 高度肥満。肥満症専門治療を検討`
      a.push({ category: 'screening', priority: 'high', title: 'SAS（睡眠時無呼吸）スクリーニング', detail: 'BMI≧35: SAS合併率極めて高い。CPAP適応の評価' })
    } else if (bmi >= 25) {
      status = 'caution'; summary = `BMI ${bmi.toFixed(1)} — 肥満`
      if (isMetSyn) summary += '（メタボリックシンドローム該当）'
    } else {
      status = 'normal'; summary = `BMI ${bmi.toFixed(1)} — 正常体重`
    }

    if (bmi >= 25) {
      const targetWeight = 22 * ((parseFloat(d.height) / 100) ** 2)
      targets.push(`目標体重: ${targetWeight.toFixed(1)} kg（BMI 22）`)
      targets.push('まず3-6ヶ月で現体重の3%減を達成')
      a.push({ category: 'lifestyle', priority: 'high', title: '食事療法（減量）', detail: `目標摂取量: ${Math.round(targetWeight * 25)}〜${Math.round(targetWeight * 30)} kcal/日` })
      a.push({ category: 'lifestyle', priority: 'high', title: '運動療法', detail: '有酸素運動（速歩・ジョギング）150分/週以上を目標。日常活動量の増加も重要' })
    }

    results.push({ name: '肥満/メタボ', status, summary, targets, actions: a })
  }

  return results
}

// ── UI ──
const statusColors = {
  normal: 'bg-[#E6F4EA] border-l-4 border-[#34A853]',
  caution: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]',
  abnormal: 'bg-[#FDECEA] border-l-4 border-[#D93025]',
  diagnosed: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]',
}
const statusTextColors: Record<string, string> = {
  normal: 'text-[#1B5E20]', caution: 'text-[#E65100]', abnormal: 'text-[#B71C1C]', diagnosed: 'text-[#1565C0]',
}
const statusLabels = { normal: '正常', caution: '注意', abnormal: '異常', diagnosed: '治療中' }
const priorityColors = { high: 'bg-[#D93025] text-white', medium: 'bg-[#F9A825] text-[#4A3800]', low: 'bg-[#E8E5DF] text-[#6B6760]' }
const categoryLabelsMap: Record<string, string> = { screening: '検査', referral: '紹介', lifestyle: '生活指導', medication: '薬物', monitoring: 'モニタリング' }

function InputField({ id, label, unit, value, onChange, type = 'number', hint, step }: {
  id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; type?: string; hint?: string; step?: number
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-tx mb-0.5">
        {label}{unit && <span className="text-muted ml-1">({unit})</span>}
      </label>
      {hint && <p className="text-[10px] text-muted mb-0.5">{hint}</p>}
      <input type={type} id={id} inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        step={step} className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac" />
    </div>
  )
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-tx">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-3.5 h-3.5 rounded border-br text-ac" />
      {label}
    </label>
  )
}

export default function LifestylePage() {
  const [data, setData] = useState<PatientData>(defaultData)
  const set = (key: keyof PatientData) => (val: string | boolean) => setData(prev => ({ ...prev, [key]: val }))

  const assessments = useMemo(() => assessAll(data), [data])
  const allActions = assessments.flatMap(a => a.actions)
  const highPriority = allActions.filter(a => a.priority === 'high')
  const hasInput = !!(data.sbp || data.hba1c || data.ldl || data.tg || data.alt || data.ua || data.cr)

  const bmi = (parseFloat(data.height) && parseFloat(data.weight)) ? calcBmi(parseFloat(data.height), parseFloat(data.weight)) : null
  const egfr = (parseFloat(data.cr) && parseFloat(data.age)) ? calcEgfr(parseFloat(data.cr), parseFloat(data.age), data.sex) : null

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tx">生活習慣病 総合管理ツール</h1>
        <p className="text-sm text-muted mt-1">
          患者データを入力 → 疾患評価・次のアクション・生活指導が自動生成されます
        </p>
        <p className="text-xs text-muted mt-1 p-2 bg-bg rounded-lg border border-br">
          ⚠️ 本ツールは臨床判断の補助です。個別の患者への適用は主治医の判断で行ってください。
        </p>
      </div>

      {/* 入力セクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* 基本情報 */}
        <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-tx flex items-center gap-1">📋 基本情報</h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField id="age" label="年齢" unit="歳" value={data.age} onChange={set('age')} />
            <div>
              <label className="block text-xs font-medium text-tx mb-0.5">性別</label>
              <select value={data.sex} onChange={e => set('sex')(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30">
                <option value="male">男性</option><option value="female">女性</option>
              </select>
            </div>
            <InputField id="height" label="身長" unit="cm" value={data.height} onChange={set('height')} />
            <InputField id="weight" label="体重" unit="kg" value={data.weight} onChange={set('weight')} />
          </div>
          <InputField id="waist" label="腹囲" unit="cm" hint="メタボ判定: 男≧85 女≧90" value={data.waist} onChange={set('waist')} />
          {bmi && <p className="text-xs text-muted">BMI: <span className="font-mono font-bold text-tx">{bmi.toFixed(1)}</span></p>}
        </div>

        {/* バイタル */}
        <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-tx flex items-center gap-1">💓 バイタル・血圧</h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField id="sbp" label="収縮期血圧" unit="mmHg" value={data.sbp} onChange={set('sbp')} />
            <InputField id="dbp" label="拡張期血圧" unit="mmHg" value={data.dbp} onChange={set('dbp')} />
          </div>
          <h2 className="text-sm font-bold text-tx flex items-center gap-1 pt-2">🩸 血糖</h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField id="hba1c" label="HbA1c" unit="%" value={data.hba1c} onChange={set('hba1c')} step={0.1} />
            <InputField id="fbs" label="空腹時血糖" unit="mg/dL" value={data.fbs} onChange={set('fbs')} />
          </div>
        </div>

        {/* 脂質 */}
        <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-tx flex items-center gap-1">🧪 脂質</h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField id="tc" label="TC" unit="mg/dL" value={data.tc} onChange={set('tc')} />
            <InputField id="ldl" label="LDL-C" unit="mg/dL" hint="未入力時はTC/HDL/TGから計算" value={data.ldl} onChange={set('ldl')} />
            <InputField id="hdl" label="HDL-C" unit="mg/dL" value={data.hdl} onChange={set('hdl')} />
            <InputField id="tg" label="TG" unit="mg/dL" value={data.tg} onChange={set('tg')} />
          </div>
          {!data.ldl && data.tc && data.hdl && data.tg && parseFloat(data.tg) < 400 && (
            <p className="text-xs text-muted mt-1">
              Friedewald式 LDL-C ≈ <span className="font-mono font-bold text-tx">{Math.round(parseFloat(data.tc) - parseFloat(data.hdl) - parseFloat(data.tg) / 5)}</span> mg/dL
              {parseFloat(data.tc) && parseFloat(data.hdl) ? <span className="ml-2">（non-HDL-C: <span className="font-mono font-bold text-tx">{Math.round(parseFloat(data.tc) - parseFloat(data.hdl))}</span>）</span> : null}
            </p>
          )}
          {!data.ldl && data.tg && parseFloat(data.tg) >= 400 && (
            <p className="text-xs text-[#B71C1C] mt-1">⚠️ TG ≧ 400: Friedewald式は不正確です。直接法LDL-Cを入力してください</p>
          )}
        </div>

        {/* 腎・肝・尿酸 */}
        <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-tx flex items-center gap-1">💧 腎・肝・尿酸</h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField id="cr" label="Cr" unit="mg/dL" value={data.cr} onChange={set('cr')} step={0.01} />
            <InputField id="uacr" label="尿Alb/Cr比" unit="mg/gCr" value={data.uacr} onChange={set('uacr')} />
            <InputField id="ua" label="尿酸" unit="mg/dL" value={data.ua} onChange={set('ua')} step={0.1} />
            <InputField id="ast" label="AST" unit="IU/L" value={data.ast} onChange={set('ast')} />
            <InputField id="alt" label="ALT" unit="IU/L" value={data.alt} onChange={set('alt')} />
            <InputField id="ggt" label="γGTP" unit="IU/L" value={data.ggt} onChange={set('ggt')} />
          </div>
          {egfr && <p className="text-xs text-muted">eGFR: <span className="font-mono font-bold text-tx">{egfr.toFixed(1)}</span> mL/min/1.73m²</p>}
        </div>

        {/* 既往・生活習慣 */}
        <div className="bg-s0 border border-br rounded-xl p-4 space-y-3 md:col-span-2">
          <h2 className="text-sm font-bold text-tx flex items-center gap-1">📝 既往・生活習慣</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-tx mb-0.5">喫煙</label>
              <select value={data.smoking} onChange={e => set('smoking')(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30">
                <option value="no">非喫煙</option><option value="ex">過去喫煙</option><option value="yes">現在喫煙</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-tx mb-0.5">飲酒</label>
              <select value={data.alcohol} onChange={e => set('alcohol')(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30">
                <option value="none">飲まない</option><option value="light">適量（20g/日以下）</option><option value="moderate">中等量（20-40g/日）</option><option value="heavy">多量（40g/日超）</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-tx mb-0.5">運動習慣</label>
              <select value={data.exercise} onChange={e => set('exercise')(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30">
                <option value="none">なし</option><option value="light">週1-2回</option><option value="moderate">週3-4回</option><option value="active">週5回以上</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            <CheckField label="CVD家族歴" checked={data.fhCvd} onChange={set('fhCvd') as (v: boolean) => void} />
            <CheckField label="DM家族歴" checked={data.fhDm} onChange={set('fhDm') as (v: boolean) => void} />
            <CheckField label="DM治療中" checked={data.currentDm} onChange={set('currentDm') as (v: boolean) => void} />
            <CheckField label="高血圧治療中" checked={data.currentHtn} onChange={set('currentHtn') as (v: boolean) => void} />
            <CheckField label="脂質異常治療中" checked={data.currentDl} onChange={set('currentDl') as (v: boolean) => void} />
            <CheckField label="CKD治療中" checked={data.currentCkd} onChange={set('currentCkd') as (v: boolean) => void} />
          </div>
        </div>
      </div>

      {/* 結果セクション */}
      {hasInput && (
        <>
          {/* 緊急アクション */}
          {highPriority.length > 0 && (
            <div className="mb-6 p-4 bg-[#FDECEA] border-l-4 border-[#D93025] rounded-xl">
              <h2 className="text-sm font-bold text-[#B71C1C] mb-2">🚨 優先アクション</h2>
              <div className="space-y-2">
                {highPriority.map((a, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#D93025] text-white whitespace-nowrap">{categoryLabelsMap[a.category]}</span>
                    <div>
                      <p className="text-sm font-medium text-tx">{a.title}</p>
                      <p className="text-xs text-tx/70">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 疾患別評価 */}
          <h2 className="text-lg font-bold text-tx mb-3">疾患別評価</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {assessments.map(a => (
              <div key={a.name} className={`rounded-xl p-4 ${statusColors[a.status]}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold text-sm ${statusTextColors[a.status]}`}>{a.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusTextColors[a.status]} bg-white/60`}>{statusLabels[a.status]}</span>
                </div>
                <p className="text-sm text-tx mb-2">{a.summary}</p>
                {a.targets.length > 0 && (
                  <div className="text-xs text-tx space-y-0.5 mb-2">
                    {a.targets.map((t, i) => <p key={i}>🎯 {t}</p>)}
                  </div>
                )}
                {a.actions.length > 0 && (
                  <div className="text-xs space-y-1 mt-2 pt-2 border-t border-tx/10">
                    {a.actions.map((act, i) => (
                      <div key={i} className="flex gap-1.5 items-start">
                        <span className={`px-1 py-0.5 rounded text-[10px] whitespace-nowrap ${priorityColors[act.priority]}`}>{categoryLabelsMap[act.category]}</span>
                        <span className="text-tx">{act.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 全アクション一覧 */}
          {allActions.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-tx mb-3">全アクション一覧</h2>
              <div className="bg-s0 border border-br rounded-xl p-4 mb-8">
                <div className="space-y-3">
                  {allActions.map((a, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${priorityColors[a.priority]}`}>{categoryLabelsMap[a.category]}</span>
                      <div>
                        <p className="text-sm font-medium text-tx">{a.title}</p>
                        <p className="text-xs text-muted">{a.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* 出典 */}
      <div className="text-xs text-muted mt-8 pt-4 border-t border-br space-y-1">
        <p className="font-semibold">出典・参考ガイドライン:</p>
        <p>高血圧治療ガイドライン2019（JSH2019）/ 糖尿病診療ガイドライン2024 / 動脈硬化性疾患予防ガイドライン2022 / CKD診療ガイドライン2023 / 高尿酸血症・痛風の治療ガイドライン第3版 / MASLD診療ガイドライン2023</p>
      </div>
    </div>
  )
}
