/**
 * 臨床計算ツール ロジックテスト（Vitest版）
 *
 * eGFR, FIB-4, 補正Ca, A-aDO2, BMI, Cockcroft-Gault, Anion Gap の計算ロジックを検証
 * 計算関数はページ内にローカル定義されているため、同一ロジックをここに再定義してテスト
 */
import { describe, it, expect } from 'vitest'

// ── Helper ──
function closeTo(actual: number, expected: number, tolerance: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

// ══════════════════════════════════════════
// eGFR (CKD-EPI 2021 + 日本人係数 0.813)
// ══════════════════════════════════════════
function calculateEgfr(cr: number, age: number, sex: 'male' | 'female'): number {
  const kappa = sex === 'female' ? 0.7 : 0.9
  const alpha = sex === 'female' ? -0.241 : -0.302
  const sexFactor = sex === 'female' ? 1.012 : 1.0
  const crKappa = cr / kappa
  const minVal = Math.min(crKappa, 1)
  const maxVal = Math.max(crKappa, 1)
  const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexFactor
  return egfr * 0.813
}

// eGFR JSN (日本腎臓学会推算式)
function calculateEgfrJsn(cr: number, age: number, sex: 'male' | 'female'): number {
  const base = 194 * Math.pow(cr, -1.094) * Math.pow(age, -0.287)
  return sex === 'female' ? base * 0.739 : base
}

describe('eGFR (CKD-EPI 2021, 日本人係数)', () => {
  it('50歳男性 Cr=1.0 -> ~73', () => closeTo(calculateEgfr(1.0, 50, 'male'), 73, 3))
  it('50歳女性 Cr=0.7 -> ~86', () => closeTo(calculateEgfr(0.7, 50, 'female'), 86, 3))
  it('70歳男性 Cr=2.0 -> ~29', () => closeTo(calculateEgfr(2.0, 70, 'male'), 29, 3))
  it('30歳男性 Cr=0.8 -> ~99', () => closeTo(calculateEgfr(0.8, 30, 'male'), 99, 3))
})

describe('eGFR JSN (日本腎臓学会)', () => {
  it('50歳男性 Cr=1.0 -> ~63', () => closeTo(calculateEgfrJsn(1.0, 50, 'male'), 63, 3))
  it('50歳女性 Cr=0.7 -> ~69', () => closeTo(calculateEgfrJsn(0.7, 50, 'female'), 69, 3))
  it('70歳男性 Cr=2.0 -> ~27', () => closeTo(calculateEgfrJsn(2.0, 70, 'male'), 27, 3))
})

// ══════════════════════════════════════════
// FIB-4 Index
// ══════════════════════════════════════════
function calculateFib4(age: number, ast: number, alt: number, plt: number): number {
  return (age * ast) / (plt * Math.sqrt(alt))
}

describe('FIB-4 Index', () => {
  it('standard case: 60歳 AST=40 ALT=30 PLT=200 -> ~2.19', () =>
    closeTo(calculateFib4(60, 40, 30, 200), 2.19, 0.1))
  it('low risk: 40歳 AST=25 ALT=25 PLT=250 -> ~0.80', () =>
    closeTo(calculateFib4(40, 25, 25, 250), 0.80, 0.1))
  it('high risk: 65歳 AST=80 ALT=40 PLT=100 -> ~8.23', () =>
    closeTo(calculateFib4(65, 80, 40, 100), 8.23, 0.1))
})

// ══════════════════════════════════════════
// 補正Ca (Payne式): Ca + 0.8 * (4.0 - Alb)
// ══════════════════════════════════════════
// Note: actual page uses Payne式 with 0.8 coefficient
function correctedCa(ca: number, alb: number): number {
  return ca + 0.8 * (4.0 - alb)
}

describe('補正Ca (Payne式)', () => {
  it('Ca=8.5 Alb=3.0 -> 9.3', () => closeTo(correctedCa(8.5, 3.0), 9.3, 0.01))
  it('Ca=9.0 Alb=4.0 -> 9.0', () => closeTo(correctedCa(9.0, 4.0), 9.0, 0.01))
  it('Ca=7.5 Alb=2.0 -> 9.1', () => closeTo(correctedCa(7.5, 2.0), 9.1, 0.01))
  it('Alb=4.0 で補正不要', () => closeTo(correctedCa(10.0, 4.0), 10.0, 0.01))
})

// ══════════════════════════════════════════
// A-aDO2
// ══════════════════════════════════════════
function calculateAaDO2(fio2: number, paco2: number, pao2: number, patm = 760): number {
  const pah2o = 47
  const pao2Alveolar = fio2 * (patm - pah2o) - (paco2 / 0.8)
  return pao2Alveolar - pao2
}

describe('A-aDO2', () => {
  it('room air normal', () => closeTo(calculateAaDO2(0.21, 40, 100), -0.3, 2))
  it('mild elevation', () => closeTo(calculateAaDO2(0.21, 40, 80), 19.7, 2))
  it('high FiO2', () => closeTo(calculateAaDO2(0.40, 35, 80), 161.7, 3))
})

// ══════════════════════════════════════════
// BMI
// ══════════════════════════════════════════
function calcBmi(height: number, weight: number): number {
  return weight / ((height / 100) ** 2)
}

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return '低体重'
  if (bmi < 25) return '普通体重'
  if (bmi < 30) return '肥満1度'
  if (bmi < 35) return '肥満2度'
  if (bmi < 40) return '肥満3度'
  return '肥満4度'
}

describe('BMI', () => {
  it('170cm 60kg -> ~20.8', () => closeTo(calcBmi(170, 60), 20.8, 0.1))
  it('180cm 80kg -> ~24.7', () => closeTo(calcBmi(180, 80), 24.7, 0.1))
  it('160cm 45kg -> ~17.6 低体重', () => {
    const bmi = calcBmi(160, 45)
    closeTo(bmi, 17.6, 0.1)
    expect(classifyBmi(bmi)).toBe('低体重')
  })
  it('170cm 90kg -> ~31.1 肥満2度', () => {
    const bmi = calcBmi(170, 90)
    closeTo(bmi, 31.1, 0.1)
    expect(classifyBmi(bmi)).toBe('肥満2度')
  })
})

// ══════════════════════════════════════════
// Cockcroft-Gault (CCr)
// ══════════════════════════════════════════
function calcCCr(age: number, weight: number, cr: number, sex: 'male' | 'female'): number {
  const base = ((140 - age) * weight) / (72 * cr)
  return sex === 'female' ? base * 0.85 : base
}

describe('Cockcroft-Gault (CCr)', () => {
  it('65歳男性 60kg Cr=1.2 -> ~52.1', () =>
    closeTo(calcCCr(65, 60, 1.2, 'male'), 52.1, 1))
  it('50歳男性 70kg Cr=1.0 -> ~87.5', () =>
    closeTo(calcCCr(50, 70, 1.0, 'male'), 87.5, 1))
  it('50歳女性 55kg Cr=0.8 -> ~73.0', () =>
    closeTo(calcCCr(50, 55, 0.8, 'female'), 73.0, 1))
  it('80歳男性 50kg Cr=2.0 -> ~20.8', () =>
    closeTo(calcCCr(80, 50, 2.0, 'male'), 20.8, 1))
})

// ══════════════════════════════════════════
// Anion Gap
// ══════════════════════════════════════════
function calcAnionGap(na: number, cl: number, hco3: number): number {
  return na - cl - hco3
}

function calcCorrectedAg(ag: number, alb: number): number {
  return ag + 2.5 * (4.0 - alb)
}

describe('Anion Gap', () => {
  it('Na=140 Cl=105 HCO3=24 -> AG=11', () =>
    expect(calcAnionGap(140, 105, 24)).toBe(11))
  it('Na=140 Cl=100 HCO3=10 -> AG=30 (high)', () =>
    expect(calcAnionGap(140, 100, 10)).toBe(30))
  it('Alb補正: AG=11, Alb=3.0 -> 13.5', () =>
    closeTo(calcCorrectedAg(11, 3.0), 13.5, 0.1))
  it('Alb=4.0 で補正なし', () =>
    closeTo(calcCorrectedAg(11, 4.0), 11, 0.01))
})

// ══════════════════════════════════════════
// Expected A-a Gradient (年齢別)
// ══════════════════════════════════════════
function getExpectedGradient(age: number): number {
  return (age + 10) / 4
}

describe('Expected A-a Gradient', () => {
  it('20歳 -> 7.5', () => closeTo(getExpectedGradient(20), 7.5, 0.1))
  it('60歳 -> 17.5', () => closeTo(getExpectedGradient(60), 17.5, 0.1))
  it('80歳 -> 22.5', () => closeTo(getExpectedGradient(80), 22.5, 0.1))
})
