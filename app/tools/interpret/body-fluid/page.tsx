'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ProGate from '@/components/pro/ProGate'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

type Severity = 'ok' | 'wn' | 'dn' | 'neutral'
type FluidType = 'pleural' | 'ascites' | 'csf' | ''

interface StepResult {
  step: number; title: string; finding: string
  severity: Severity; detail: string; formula?: string
}

// ── Pleural Effusion ──
interface PleuralInput {
  fluidProtein: string; serumProtein: string
  fluidLDH: string; serumLDH: string
  fluidGlucose: string; fluidPH: string
  fluidCellCount: string; fluidNeutrophils: string; fluidLymphocytes: string
  fluidADA: string
  appearance: 'clear' | 'turbid' | 'bloody' | 'milky' | ''
}
const pleuralDefaults: PleuralInput = {
  fluidProtein: '4.2', serumProtein: '6.8', fluidLDH: '320', serumLDH: '200',
  fluidGlucose: '60', fluidPH: '7.30', fluidCellCount: '2500', fluidNeutrophils: '70',
  fluidLymphocytes: '20', fluidADA: '', appearance: 'turbid',
}

function interpretPleural(d: PleuralInput): StepResult[] {
  const steps: StepResult[] = []
  const fp = parseFloat(d.fluidProtein); const sp = parseFloat(d.serumProtein)
  const fl = parseFloat(d.fluidLDH); const sl = parseFloat(d.serumLDH)
  if (!fp || !sp || !fl || !sl) return []

  // Step 1: Light Criteria
  const proteinRatio = fp / sp
  const ldhRatio = fl / sl
  const ldhUpperNormal = sl * 0.67 // 2/3 of upper normal (assuming serum LDH ≈ upper normal)
  const isExudate = proteinRatio > 0.5 || ldhRatio > 0.6 || fl > 200

  const criteria = []
  if (proteinRatio > 0.5) criteria.push(`蛋白比 ${proteinRatio.toFixed(2)} > 0.5`)
  if (ldhRatio > 0.6) criteria.push(`LDH比 ${ldhRatio.toFixed(2)} > 0.6`)
  if (fl > 200) criteria.push(`胸水LDH ${fl} > 200 IU/L`)

  if (isExudate) {
    steps.push({ step: 1, title: 'Light基準', finding: `滲出液（exudate） — ${criteria.join('、')}`,
      severity: 'wn',
      detail: 'Light基準: 3項目中1つ以上陽性で滲出液。感染（肺炎随伴性・膿胸）・悪性胸水・肺塞栓・膠原病・膵炎・結核を鑑別。',
      formula: `蛋白比 = ${fp}/${sp} = ${proteinRatio.toFixed(2)}、LDH比 = ${fl}/${sl} = ${ldhRatio.toFixed(2)}` })

    // Serum-effusion albumin gradient if misclassified transudate
    if (criteria.length === 1 && proteinRatio > 0.5 && proteinRatio < 0.65) {
      steps.push({ step: 1.5, title: '注意', finding: 'Light基準の偽陽性の可能性', severity: 'neutral',
        detail: '利尿薬使用中の心不全では漏出液がLight基準で滲出液と誤分類されることがある。血清-胸水アルブミン差 > 1.2 g/dLなら漏出液の可能性。' })
    }
  } else {
    steps.push({ step: 1, title: 'Light基準', finding: '漏出液（transudate） — Light基準 全項目陰性',
      severity: 'ok',
      detail: '漏出液: 心不全（最多）・肝硬変・ネフローゼ症候群・低アルブミン血症を鑑別。基礎疾患の治療が主体。',
      formula: `蛋白比 = ${proteinRatio.toFixed(2)}、LDH比 = ${ldhRatio.toFixed(2)}` })
  }

  // Step 2: Appearance
  if (d.appearance === 'bloody') {
    steps.push({ step: 2, title: '外観', finding: '血性胸水', severity: 'dn',
      detail: '血性胸水: 悪性腫瘍（肺癌・乳癌・リンパ腫が多い）・肺塞栓・外傷・血胸。胸水Ht > 末梢Htの50%なら血胸 → 胸腔ドレナージ。胸水細胞診を提出。' })
  } else if (d.appearance === 'milky') {
    steps.push({ step: 2, title: '外観', finding: '乳び胸水', severity: 'wn',
      detail: '乳び胸水: 胸水TG > 110 mg/dLで確定。胸管損傷（術後・外傷）・リンパ腫・LAMを鑑別。脂肪制限食＋MCTオイルで保存的に開始。' })
  } else if (d.appearance === 'turbid') {
    steps.push({ step: 2, title: '外観', finding: '混濁', severity: 'wn',
      detail: '混濁胸水: 感染性胸水（肺炎随伴性胸水・膿胸）を最優先で鑑別。白血球数・分画で評価。' })
  }

  // Step 3: Cell count / differential
  const cellCount = parseInt(d.fluidCellCount)
  const neutro = parseInt(d.fluidNeutrophils)
  const lymph = parseInt(d.fluidLymphocytes)

  if (cellCount && isExudate) {
    if (cellCount > 50000) {
      steps.push({ step: 3, title: '細胞数・分画', finding: `WBC ${cellCount.toLocaleString()}/μL → 膿胸を強く疑う`, severity: 'dn',
        detail: '細胞数 > 50,000/μL: 膿胸。排膿（胸腔ドレナージ）＋抗菌薬が必須。' })
    } else if (cellCount > 10000) {
      steps.push({ step: 3, title: '細胞数・分画', finding: `WBC ${cellCount.toLocaleString()}/μL → 高度上昇`, severity: 'dn',
        detail: '肺炎随伴性胸水（complicated parapneumonic effusion）・膿胸を鑑別。' })
    } else if (cellCount > 1000) {
      steps.push({ step: 3, title: '細胞数・分画', finding: `WBC ${cellCount.toLocaleString()}/μL → 中等度上昇`, severity: 'wn',
        detail: '感染・悪性胸水・膠原病を鑑別。分画で好中球優位か リンパ球優位かを確認。' })
    }

    if (neutro && lymph) {
      if (neutro > 50) {
        steps.push({ step: 3.5, title: '分画', finding: `好中球優位（${neutro}%）`, severity: 'wn',
          detail: '好中球優位: 急性感染（肺炎随伴性胸水）・肺塞栓の初期・膵炎を示唆。' })
      } else if (lymph > 50) {
        steps.push({ step: 3.5, title: '分画', finding: `リンパ球優位（${lymph}%）`, severity: 'wn',
          detail: 'リンパ球優位: 結核性胸膜炎・悪性胸水（肺癌・リンパ腫）・膠原病（SLE・RA）・サルコイドーシスを鑑別。ADA値も参考に。' })
      }
    }
  }

  // Step 4: pH / Glucose
  const pH = parseFloat(d.fluidPH)
  const glucose = parseFloat(d.fluidGlucose)

  if (pH && isExudate) {
    if (pH < 7.2) {
      steps.push({ step: 4, title: '胸水pH・糖', finding: `pH ${pH.toFixed(2)} → 著明低下（< 7.2）`, severity: 'dn',
        detail: 'pH < 7.2: complicated parapneumonic effusion/膿胸 → 胸腔ドレナージの適応。悪性胸水・食道破裂・RA胸膜炎でも低下。' })
    } else if (pH < 7.3) {
      steps.push({ step: 4, title: '胸水pH・糖', finding: `pH ${pH.toFixed(2)} → 低下`, severity: 'wn',
        detail: 'pH 7.2-7.3: 感染性胸水の可能性。Gram染色・培養と併せて判断。' })
    }
  }

  if (glucose && isExudate) {
    if (glucose < 40) {
      steps.push({ step: 4.5, title: '胸水糖', finding: `胸水糖 ${glucose} mg/dL → 著明低下`, severity: 'dn',
        detail: '糖 < 40: 膿胸・RA胸膜炎・悪性胸水（特にリンパ腫）・結核・食道破裂・ループス胸膜炎で低下。' })
    } else if (glucose < 60) {
      steps.push({ step: 4.5, title: '胸水糖', finding: `胸水糖 ${glucose} mg/dL → 低下`, severity: 'wn',
        detail: '糖 60 mg/dL未満: 感染性・悪性を鑑別。血糖との比（胸水糖/血糖 < 0.5）も参考。' })
    }
  }

  // Step 5: ADA
  const ada = parseFloat(d.fluidADA)
  if (ada && isExudate) {
    if (ada > 40) {
      steps.push({ step: 5, title: 'ADA', finding: `ADA ${ada} U/L → 上昇（結核を示唆）`, severity: 'dn',
        detail: 'ADA > 40 U/L: 結核性胸膜炎の感度 92%・特異度 90%。リンパ球優位の滲出液 + ADA高値は結核を強く示唆。ただしリンパ腫・膿胸でも上昇しうる。' })
    } else {
      steps.push({ step: 5, title: 'ADA', finding: `ADA ${ada} U/L → 正常範囲`, severity: 'ok',
        detail: 'ADA ≦ 40: 結核性胸膜炎の可能性は低い。' })
    }
  }

  return steps
}

// ── Ascites ──
interface AscitesInput {
  serumAlbumin: string; ascitesAlbumin: string
  ascitesProtein: string; ascitesCellCount: string; ascitesNeutrophils: string
  ascitesGlucose: string; ascitesLDH: string; ascitesAmylase: string
  appearance: 'clear' | 'turbid' | 'bloody' | 'milky' | ''
}
const ascitesDefaults: AscitesInput = {
  serumAlbumin: '2.8', ascitesAlbumin: '1.0', ascitesProtein: '1.5',
  ascitesCellCount: '350', ascitesNeutrophils: '30',
  ascitesGlucose: '', ascitesLDH: '', ascitesAmylase: '', appearance: 'clear',
}

function interpretAscites(d: AscitesInput): StepResult[] {
  const steps: StepResult[] = []
  const sAlb = parseFloat(d.serumAlbumin); const aAlb = parseFloat(d.ascitesAlbumin)
  if (!sAlb || !aAlb) return []

  // Step 1: SAAG
  const saag = sAlb - aAlb
  if (saag >= 1.1) {
    steps.push({ step: 1, title: 'SAAG（血清-腹水アルブミン差）', finding: `SAAG ${saag.toFixed(1)} g/dL → ≧ 1.1: 門脈圧亢進（精度 97%）`, severity: 'wn',
      detail: 'SAAG ≧ 1.1: 門脈圧亢進を示す。肝硬変（最多）・アルコール性肝炎・心不全（うっ血肝）・Budd-Chiari症候群・門脈血栓症を鑑別。',
      formula: `SAAG = 血清Alb(${sAlb}) − 腹水Alb(${aAlb}) = ${saag.toFixed(1)}` })

    // Ascites protein for further differentiation
    const ap = parseFloat(d.ascitesProtein)
    if (ap) {
      if (ap >= 2.5) {
        steps.push({ step: 1.5, title: 'SAAG ≧ 1.1 + 腹水蛋白 ≧ 2.5', finding: '心性腹水（うっ血性心不全）を示唆', severity: 'neutral',
          detail: 'SAAG高値 + 腹水蛋白高値: 心不全による肝うっ血。心エコー・BNPで評価。肝硬変では通常腹水蛋白 < 2.5 g/dL。' })
      } else {
        steps.push({ step: 1.5, title: 'SAAG ≧ 1.1 + 腹水蛋白 < 2.5', finding: '肝硬変による腹水を示唆', severity: 'neutral',
          detail: '典型的な肝硬変パターン。SBP（特発性細菌性腹膜炎）のリスクが高い（特に蛋白 < 1.0 g/dL）。' })
      }
    }
  } else {
    steps.push({ step: 1, title: 'SAAG（血清-腹水アルブミン差）', finding: `SAAG ${saag.toFixed(1)} g/dL → < 1.1: 非門脈圧亢進性`, severity: 'wn',
      detail: 'SAAG < 1.1: 癌性腹膜炎（卵巣癌・胃癌・大腸癌）・結核性腹膜炎・膵性腹水・ネフローゼ症候群・膠原病（SLE腹膜炎）を鑑別。腹水細胞診を提出。',
      formula: `SAAG = 血清Alb(${sAlb}) − 腹水Alb(${aAlb}) = ${saag.toFixed(1)}` })
  }

  // Step 2: Cell count → SBP screening
  const cellCount = parseInt(d.ascitesCellCount)
  const neutro = parseInt(d.ascitesNeutrophils)

  if (cellCount) {
    const pmn = neutro ? Math.round(cellCount * neutro / 100) : null
    if (pmn !== null && pmn >= 250) {
      steps.push({ step: 2, title: '細胞数・好中球', finding: `好中球数 ${pmn}/μL → ≧ 250: SBP（特発性細菌性腹膜炎）`, severity: 'dn',
        detail: '腹水好中球 ≧ 250/μL: SBPの診断基準。培養結果を待たずに経験的抗菌薬（セフォタキシム 2g q8h等）を開始。アルブミン補充（1.5 g/kg day1, 1.0 g/kg day3）で腎不全予防。',
        formula: `PMN = WBC(${cellCount}) × 好中球%(${neutro}) / 100 = ${pmn}` })
    } else if (pmn !== null && pmn < 250) {
      steps.push({ step: 2, title: '細胞数・好中球', finding: `好中球数 ${pmn}/μL → < 250: SBP否定的`, severity: 'ok',
        detail: '好中球 < 250/μL: SBPの可能性は低い。ただし臨床的に感染が疑われる場合は培養結果を待つ。',
        formula: `PMN = WBC(${cellCount}) × 好中球%(${neutro}) / 100 = ${pmn}` })
    } else if (cellCount > 500) {
      steps.push({ step: 2, title: '細胞数', finding: `WBC ${cellCount}/μL → 上昇`, severity: 'wn',
        detail: '好中球分画を確認してSBPを除外。リンパ球優位なら結核性腹膜炎・癌性腹膜炎を鑑別。' })
    }
  }

  // Step 3: Amylase
  const amylase = parseFloat(d.ascitesAmylase)
  if (amylase) {
    if (amylase > 200) {
      steps.push({ step: 3, title: '腹水アミラーゼ', finding: `アミラーゼ ${amylase} → 上昇`, severity: 'dn',
        detail: '腹水アミラーゼ高値: 膵性腹水（膵炎・膵仮性嚢胞破裂）・腸管穿孔を鑑別。通常血清アミラーゼの3倍以上で膵性腹水を示唆。' })
    }
  }

  return steps
}

// ── CSF ──
interface CSFInput {
  wbc: string; neutrophils: string; lymphocytes: string
  protein: string; glucose: string; serumGlucose: string
  openingPressure: string; appearance: 'clear' | 'turbid' | 'bloody' | 'xanthochromic' | ''
  gramStain: 'negative' | 'gpc' | 'gnr' | 'gnc' | 'afb' | ''
}
const csfDefaults: CSFInput = {
  wbc: '350', neutrophils: '85', lymphocytes: '10', protein: '120', glucose: '30', serumGlucose: '100',
  openingPressure: '28', appearance: 'turbid', gramStain: 'negative',
}

function interpretCSF(d: CSFInput): StepResult[] {
  const steps: StepResult[] = []
  const wbc = parseInt(d.wbc); const protein = parseFloat(d.protein)
  const glucose = parseFloat(d.glucose); const serumGlucose = parseFloat(d.serumGlucose)
  if (!wbc && !protein) return []

  // Step 1: Opening pressure
  const op = parseInt(d.openingPressure)
  if (op) {
    if (op > 25) {
      steps.push({ step: 1, title: '初圧', finding: `${op} cmH₂O → 上昇（> 25）`, severity: 'dn',
        detail: '初圧上昇: 細菌性髄膜炎・クリプトコッカス髄膜炎・脳膿瘍・静脈洞血栓・特発性頭蓋内圧亢進症（IIH）を鑑別。' })
    } else if (op > 20) {
      steps.push({ step: 1, title: '初圧', finding: `${op} cmH₂O → 境界域`, severity: 'wn',
        detail: '初圧 20-25: 境界域。臨床像と併せて判断。肥満で偽高値になりうる。' })
    } else {
      steps.push({ step: 1, title: '初圧', finding: `${op} cmH₂O → 正常（6-20）`, severity: 'ok',
        detail: '正常範囲。ウイルス性髄膜炎では通常正常〜軽度上昇。' })
    }
  }

  // Step 2: Appearance
  if (d.appearance === 'turbid') {
    steps.push({ step: 2, title: '外観', finding: '混濁', severity: 'dn',
      detail: '混濁髄液: WBC > 200/μL or 蛋白 > 150 mg/dL or 細菌の大量増殖で混濁。細菌性髄膜炎を最優先で鑑別。' })
  } else if (d.appearance === 'bloody') {
    steps.push({ step: 2, title: '外観', finding: '血性', severity: 'dn',
      detail: '血性髄液: くも膜下出血 vs 穿刺時外傷（traumatic tap）を鑑別。3本法（連続採取で赤血球数が減少→外傷性）、キサントクロミーの有無で判定。' })
  } else if (d.appearance === 'xanthochromic') {
    steps.push({ step: 2, title: '外観', finding: 'キサントクロミー（黄色調）', severity: 'dn',
      detail: 'キサントクロミー: くも膜下出血を強く示唆（出血から6-12時間後に出現、2-4週間持続）。ビリルビン高値・蛋白高値でも見られる。' })
  } else if (d.appearance === 'clear') {
    steps.push({ step: 2, title: '外観', finding: '透明', severity: 'ok',
      detail: '透明髄液: ウイルス性髄膜炎・初期の細菌性髄膜炎・髄膜癌腫症・正常の可能性。' })
  }

  // Step 3: Cell count & differential
  if (wbc > 0) {
    const neutro = parseInt(d.neutrophils)
    const lymph = parseInt(d.lymphocytes)

    if (wbc > 1000) {
      steps.push({ step: 3, title: '細胞数', finding: `WBC ${wbc.toLocaleString()}/μL → 著明上昇`, severity: 'dn',
        detail: 'WBC > 1000: 細菌性髄膜炎を最も強く示唆。好中球優位（> 80%）ならほぼ確実。Gram染色＋培養＋抗菌薬の即時開始。' })
    } else if (wbc > 100) {
      steps.push({ step: 3, title: '細胞数', finding: `WBC ${wbc}/μL → 上昇（100-1000）`, severity: 'wn',
        detail: '中等度上昇: 細菌性髄膜炎初期・ウイルス性髄膜炎・結核性髄膜炎・部分的治療後を鑑別。分画が重要。' })
    } else if (wbc > 5) {
      steps.push({ step: 3, title: '細胞数', finding: `WBC ${wbc}/μL → 軽度上昇`, severity: 'wn',
        detail: 'WBC 5-100: ウイルス性髄膜炎・結核性髄膜炎初期・真菌性・梅毒・HIV・部分的治療後の細菌性を鑑別。' })
    } else {
      steps.push({ step: 3, title: '細胞数', finding: `WBC ${wbc}/μL → 正常（≦ 5）`, severity: 'ok',
        detail: '正常範囲。ただし免疫不全者では細胞数正常でも感染を除外できない。' })
    }

    if (neutro && lymph && wbc > 5) {
      if (neutro > 50) {
        steps.push({ step: 3.5, title: '分画', finding: `好中球優位（${neutro}%）`, severity: 'dn',
          detail: '好中球優位: 細菌性髄膜炎を最も示唆。ウイルス性髄膜炎の初期48時間でも好中球優位になることがある（12-24時間後にリンパ球優位にシフト）。' })
      } else if (lymph > 50) {
        steps.push({ step: 3.5, title: '分画', finding: `リンパ球優位（${lymph}%）`, severity: 'wn',
          detail: 'リンパ球優位: ウイルス性髄膜炎・結核性髄膜炎・真菌性髄膜炎・梅毒・HIV・髄膜癌腫症・自己免疫性脳炎を鑑別。' })
      }
    }
  }

  // Step 4: Protein
  if (protein) {
    if (protein > 500) {
      steps.push({ step: 4, title: '蛋白', finding: `${protein} mg/dL → 著明上昇`, severity: 'dn',
        detail: '蛋白 > 500: 細菌性髄膜炎・結核性髄膜炎・脊髄ブロック（Froin症候群）で高値。' })
    } else if (protein > 100) {
      steps.push({ step: 4, title: '蛋白', finding: `${protein} mg/dL → 上昇`, severity: 'wn',
        detail: '蛋白 100-500: 細菌性・結核性髄膜炎・Guillain-Barré症候群（蛋白細胞解離）を鑑別。' })
    } else if (protein > 45) {
      steps.push({ step: 4, title: '蛋白', finding: `${protein} mg/dL → 軽度上昇`, severity: 'wn',
        detail: '蛋白 45-100: ウイルス性髄膜炎・真菌性・部分的治療後で軽度上昇。' })
    } else {
      steps.push({ step: 4, title: '蛋白', finding: `${protein} mg/dL → 正常（15-45）`, severity: 'ok', detail: '' })
    }
  }

  // Step 5: Glucose
  if (glucose && serumGlucose) {
    const ratio = glucose / serumGlucose
    if (ratio < 0.4) {
      steps.push({ step: 5, title: '糖（髄液/血糖比）', finding: `髄液糖 ${glucose}、比 ${ratio.toFixed(2)} → 著明低下（< 0.4）`, severity: 'dn',
        detail: '髄液糖/血糖比 < 0.4: 細菌性髄膜炎（感度 80%）・結核性・真菌性・癌性髄膜炎で低下。ウイルス性では通常正常。',
        formula: `髄液糖(${glucose}) / 血糖(${serumGlucose}) = ${ratio.toFixed(2)}` })
    } else if (ratio < 0.6) {
      steps.push({ step: 5, title: '糖（髄液/血糖比）', finding: `髄液糖 ${glucose}、比 ${ratio.toFixed(2)} → 低下傾向`, severity: 'wn',
        detail: '境界域の低下。経過観察と他のパラメータと併せて判断。',
        formula: `髄液糖(${glucose}) / 血糖(${serumGlucose}) = ${ratio.toFixed(2)}` })
    } else {
      steps.push({ step: 5, title: '糖（髄液/血糖比）', finding: `髄液糖 ${glucose}、比 ${ratio.toFixed(2)} → 正常`, severity: 'ok',
        detail: '髄液糖/血糖比 ≧ 0.6: 正常。ウイルス性髄膜炎を示唆するパターン。',
        formula: `髄液糖(${glucose}) / 血糖(${serumGlucose}) = ${ratio.toFixed(2)}` })
    }
  }

  // Step 6: Gram stain
  if (d.gramStain && d.gramStain !== 'negative') {
    const stainMap: Record<string, string> = {
      gpc: 'GPC（グラム陽性球菌）→ 肺炎球菌（最多）・GBS・黄色ブドウ球菌。バンコマイシン + セフトリアキソン。',
      gnr: 'GNR（グラム陰性桿菌）→ 大腸菌（新生児）・リステリア・インフルエンザ桿菌。セフトリアキソン ± アンピシリン。',
      gnc: 'GNC（グラム陰性球菌）→ 髄膜炎菌。セフトリアキソン。接触者の予防投与（リファンピシン or シプロフロキサシン）を検討。',
      afb: 'AFB（抗酸菌）→ 結核性髄膜炎。RIPE療法 + デキサメタゾン。',
    }
    steps.push({ step: 6, title: 'Gram染色', finding: stainMap[d.gramStain] || '', severity: 'dn',
      detail: 'Gram染色の感度: 細菌性髄膜炎で60-90%（菌量に依存）。陰性でも臨床的に疑わしければ経験的治療を継続。' })
  } else if (d.gramStain === 'negative') {
    steps.push({ step: 6, title: 'Gram染色', finding: 'Gram染色 陰性', severity: 'neutral',
      detail: 'Gram染色陰性でも細菌性髄膜炎は否定できない（感度60-90%）。培養結果と臨床経過で判断。抗菌薬前投与で感度が低下。' })
  }

  return steps
}

// ── Severity styling ──
const severityStyles: Record<Severity, string> = {
  ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]',
  wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]',
  dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]',
  neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]',
}
const severityTextColor: Record<Severity, string> = {
  ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]',
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

function SelectField({ id, label, value, onChange, options }: {
  id: string; label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-tx mb-0.5">{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac">
        <option value="">選択</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Main Component ──
export default function BodyFluidPage() {
  // PLG: ツール利用トラッキング
  useEffect(() => { trackToolUsage('interpret-body-fluid') }, [])

  const [fluidType, setFluidType] = useState<FluidType>('pleural')
  const [pleural, setPleural] = useState<PleuralInput>(pleuralDefaults)
  const [ascites, setAscites] = useState<AscitesInput>(ascitesDefaults)
  const [csf, setCSF] = useState<CSFInput>(csfDefaults)

  const steps = useMemo(() => {
    if (fluidType === 'pleural') return interpretPleural(pleural)
    if (fluidType === 'ascites') return interpretAscites(ascites)
    if (fluidType === 'csf') return interpretCSF(csf)
    return []
  }, [fluidType, pleural, ascites, csf])

  const setP = (key: keyof PleuralInput) => (val: string) => setPleural(prev => ({ ...prev, [key]: val }))
  const setA = (key: keyof AscitesInput) => (val: string) => setAscites(prev => ({ ...prev, [key]: val }))
  const setC = (key: keyof CSFInput) => (val: string) => setCSF(prev => ({ ...prev, [key]: val }))

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
        <span>体液検査</span>
      </nav>

      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🧪 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">体液検査 インタラクティブ解釈</h1>
        <p className="text-sm text-muted">胸水（Light基準）・腹水（SAAG）・髄液（髄膜炎鑑別）をステップバイステップで評価。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-body-fluid" /></ProPulseHint></div></header>

      {/* Fluid type selector */}
      <div className="flex gap-2 mb-6">
        {([['pleural', '胸水'], ['ascites', '腹水'], ['csf', '髄液']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFluidType(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              fluidType === val ? 'bg-ac text-white' : 'bg-s0 text-tx border border-br hover:border-ac/30'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Pleural input */}
      {fluidType === 'pleural' && (
        <section className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold text-tx mb-3">胸水データ（Light基準）</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <NumField id="fp" label="胸水 蛋白" unit="g/dL" value={pleural.fluidProtein} onChange={setP('fluidProtein')} />
            <NumField id="sp" label="血清 蛋白" unit="g/dL" value={pleural.serumProtein} onChange={setP('serumProtein')} />
            <NumField id="fl" label="胸水 LDH" unit="IU/L" value={pleural.fluidLDH} onChange={setP('fluidLDH')} />
            <NumField id="sl" label="血清 LDH" unit="IU/L" value={pleural.serumLDH} onChange={setP('serumLDH')} />
          </div>
          <h2 className="text-sm font-bold text-tx mb-3">追加検査（任意）</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <NumField id="fg" label="胸水 糖" unit="mg/dL" value={pleural.fluidGlucose} onChange={setP('fluidGlucose')} />
            <NumField id="fph" label="胸水 pH" value={pleural.fluidPH} onChange={setP('fluidPH')} />
            <NumField id="fada" label="ADA" unit="U/L" value={pleural.fluidADA} onChange={setP('fluidADA')} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <NumField id="fcc" label="細胞数" unit="/μL" value={pleural.fluidCellCount} onChange={setP('fluidCellCount')} />
            <NumField id="fn" label="好中球" unit="%" value={pleural.fluidNeutrophils} onChange={setP('fluidNeutrophils')} />
            <NumField id="fly" label="リンパ球" unit="%" value={pleural.fluidLymphocytes} onChange={setP('fluidLymphocytes')} />
          </div>
          <SelectField id="papp" label="外観" value={pleural.appearance} onChange={v => setP('appearance')(v)}
            options={[
              { value: 'clear', label: '透明' }, { value: 'turbid', label: '混濁' },
              { value: 'bloody', label: '血性' }, { value: 'milky', label: '乳び様' },
            ]} />
        </section>
      )}

      {/* Ascites input */}
      {fluidType === 'ascites' && (
        <section className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold text-tx mb-3">腹水データ（SAAG）</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <NumField id="sa" label="血清 アルブミン" unit="g/dL" value={ascites.serumAlbumin} onChange={setA('serumAlbumin')} />
            <NumField id="aa" label="腹水 アルブミン" unit="g/dL" value={ascites.ascitesAlbumin} onChange={setA('ascitesAlbumin')} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <NumField id="ap" label="腹水 蛋白" unit="g/dL" value={ascites.ascitesProtein} onChange={setA('ascitesProtein')} />
            <NumField id="acc" label="細胞数" unit="/μL" value={ascites.ascitesCellCount} onChange={setA('ascitesCellCount')} />
            <NumField id="an" label="好中球" unit="%" value={ascites.ascitesNeutrophils} onChange={setA('ascitesNeutrophils')} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <NumField id="aam" label="アミラーゼ" unit="IU/L" hint="任意" value={ascites.ascitesAmylase} onChange={setA('ascitesAmylase')} />
            <SelectField id="aapp" label="外観" value={ascites.appearance} onChange={v => setA('appearance')(v)}
              options={[
                { value: 'clear', label: '透明' }, { value: 'turbid', label: '混濁' },
                { value: 'bloody', label: '血性' }, { value: 'milky', label: '乳び様' },
              ]} />
          </div>
        </section>
      )}

      {/* CSF input */}
      {fluidType === 'csf' && (
        <section className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold text-tx mb-3">髄液データ</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <NumField id="cop" label="初圧" unit="cmH₂O" value={csf.openingPressure} onChange={setC('openingPressure')} />
            <SelectField id="capp" label="外観" value={csf.appearance} onChange={v => setC('appearance')(v)}
              options={[
                { value: 'clear', label: '透明' }, { value: 'turbid', label: '混濁' },
                { value: 'bloody', label: '血性' }, { value: 'xanthochromic', label: 'キサントクロミー' },
              ]} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <NumField id="cwbc" label="WBC" unit="/μL" value={csf.wbc} onChange={setC('wbc')} />
            <NumField id="cn" label="好中球" unit="%" value={csf.neutrophils} onChange={setC('neutrophils')} />
            <NumField id="cl" label="リンパ球" unit="%" value={csf.lymphocytes} onChange={setC('lymphocytes')} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <NumField id="cprot" label="蛋白" unit="mg/dL" value={csf.protein} onChange={setC('protein')} />
            <NumField id="cgluc" label="髄液糖" unit="mg/dL" value={csf.glucose} onChange={setC('glucose')} />
            <NumField id="csg" label="血糖" unit="mg/dL" value={csf.serumGlucose} onChange={setC('serumGlucose')} />
          </div>
          <SelectField id="gram" label="Gram染色" value={csf.gramStain} onChange={v => setC('gramStain')(v)}
            options={[
              { value: 'negative', label: '陰性' }, { value: 'gpc', label: 'GPC（グラム陽性球菌）' },
              { value: 'gnr', label: 'GNR（グラム陰性桿菌）' }, { value: 'gnc', label: 'GNC（グラム陰性球菌）' },
              { value: 'afb', label: 'AFB（抗酸菌）' },
            ]} />
        </section>
      )}

      {/* Results */}
      {steps.length > 0 && (
        <ProGate feature="interpretation" previewHeight={100}>
          <FluidResultTabs steps={steps} />
        </ProGate>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ツールは医療従事者の体液検査解釈を補助する目的で提供しています。診断・治療の最終判断は必ず担当医が行ってください。</p>
      </div>

      {/* 関連ツール */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/interpret/blood-gas', name: '血ガス解釈' },
            { href: '/tools/calc/light-criteria', name: 'Light基準' },
            { href: '/tools/calc/child-pugh', name: 'Child-Pugh' },
            { href: '/tools/calc/meld', name: 'MELD' },
            { href: '/tools/calc/curb65', name: 'CURB-65' },
            { href: '/tools/calc/sofa', name: 'SOFA' },
          ].map(t => (
            <Link key={t.href} href={t.href}
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
          <li>Light RW et al. Pleural effusions: the diagnostic separation of transudates and exudates. Ann Intern Med 1972;77:507-513</li>
          <li>Runyon BA. AASLD Practice Guideline: Management of adult patients with ascites due to cirrhosis. Hepatology 2013</li>
          <li>Tunkel AR et al. IDSA Practice Guidelines for the Management of Bacterial Meningitis. Clin Infect Dis 2004</li>
          <li>Porcel JM, Light RW. Diagnostic approach to pleural effusion in adults. Am Fam Physician 2006</li>
        </ol>
      </section>
    </div>
  )
}

function FluidResultTabs({ steps }: { steps: StepResult[] }) {
  const [activeTab, setActiveTab] = useState<'result' | 'action'>('result')
  return (
    <section className="mb-8">
      <div className="flex border border-br rounded-xl overflow-hidden mb-4">
        <button onClick={() => setActiveTab('result')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'result' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'}`}>
          検査結果
        </button>
        <button onClick={() => setActiveTab('action')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'action' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'}`}>
          アクション
        </button>
      </div>
      {activeTab === 'result' && (
        <div>
          <h2 className="text-lg font-bold text-tx mb-3">解釈結果（{steps.length}項目）</h2>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 ${severityStyles[s.severity]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityTextColor[s.severity]} bg-white/60`}>Step {Math.floor(s.step)}</span>
                  <span className={`text-sm font-bold ${severityTextColor[s.severity]}`}>{s.title}</span>
                </div>
                <p className={`text-sm font-medium mb-1 ${severityTextColor[s.severity]}`}>{s.finding}</p>
                {s.formula && <p className="text-xs font-mono bg-white/70 text-tx px-2 py-1 rounded mt-1 mb-1">{s.formula}</p>}
                {s.detail && <p className="text-xs text-tx/80">{s.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'action' && (
        <div className="space-y-4 text-sm text-muted">
          <h3 className="font-bold text-tx">胸水: Light基準による分類</h3>
          <p>蛋白比 &gt; 0.5、LDH比 &gt; 0.6、胸水LDH &gt; 正常上限2/3 のいずれかで滲出液。感度98%。利尿薬使用中の心不全で偽陽性あり。</p>
          <h3 className="font-bold text-tx">腹水: SAAG</h3>
          <p>SAAG ≧ 1.1 g/dL → 門脈圧亢進（肝硬変・心不全）。&lt; 1.1 → 非門脈圧亢進性（癌性腹膜炎・結核）。好中球 ≧ 250/μL → SBP。</p>
          <h3 className="font-bold text-tx">髄液: 髄膜炎の鑑別</h3>
          <p>細菌性: WBC &gt; 1000（好中球優位）・蛋白↑・糖↓。ウイルス性: リンパ球優位・蛋白軽度↑・糖正常。結核性: リンパ球・蛋白著明↑・糖↓・ADA↑。</p>
        </div>
      )}
    </section>
  )
}
