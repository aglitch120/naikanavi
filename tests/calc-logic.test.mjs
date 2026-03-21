/**
 * 臨床計算ツール ロジックテスト
 * 実行: node tests/calc-logic.test.mjs
 *
 * eGFR, FIB-4, 補正Ca, A-aDO2 の計算ロジックを検証
 */

let passed = 0
let failed = 0

function assert(name, actual, expected, tolerance = 0.5) {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++
    console.log(`  ✅ ${name}: ${actual.toFixed(2)} (expected ~${expected})`)
  } else {
    failed++
    console.error(`  ❌ ${name}: got ${actual.toFixed(2)}, expected ~${expected}`)
  }
}

// ── eGFR (CKD-EPI 2021 + 日本人係数 0.813) ──
function calculateEgfr(cr, age, sex) {
  const kappa = sex === 'female' ? 0.7 : 0.9
  const alpha = sex === 'female' ? -0.241 : -0.302
  const sexFactor = sex === 'female' ? 1.012 : 1.0
  const crKappa = cr / kappa
  const minVal = Math.min(crKappa, 1)
  const maxVal = Math.max(crKappa, 1)
  const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexFactor
  return egfr * 0.813
}

console.log('\n=== eGFR (CKD-EPI 2021, 日本人係数) ===')
// 50歳男性 Cr=1.0 → 日本人eGFR ~73
assert('50M Cr=1.0', calculateEgfr(1.0, 50, 'male'), 73, 3)
// 50歳女性 Cr=0.7 → 日本人eGFR ~86
assert('50F Cr=0.7', calculateEgfr(0.7, 50, 'female'), 86, 3)
// 70歳男性 Cr=2.0 → eGFR ~29
assert('70M Cr=2.0', calculateEgfr(2.0, 70, 'male'), 29, 3)
// 30歳男性 Cr=0.8 → eGFR ~99
assert('30M Cr=0.8', calculateEgfr(0.8, 30, 'male'), 99, 3)

// ── FIB-4 Index ──
function calculateFib4(age, ast, alt, plt) {
  return (age * ast) / (plt * Math.sqrt(alt))
}

console.log('\n=== FIB-4 Index ===')
// 60歳 AST=40 ALT=30 PLT=200 → FIB-4 = (60*40)/(200*sqrt(30)) ≈ 2.19
assert('standard case', calculateFib4(60, 40, 30, 200), 2.19, 0.1)
// 40歳 AST=25 ALT=25 PLT=250 → FIB-4 = (40*25)/(250*sqrt(25)) = 0.80
assert('low risk', calculateFib4(40, 25, 25, 250), 0.80, 0.1)
// 65歳 AST=80 ALT=40 PLT=100 → FIB-4 = (65*80)/(100*sqrt(40)) ≈ 8.23
assert('high risk', calculateFib4(65, 80, 40, 100), 8.23, 0.1)

// ── 補正Ca (Payne式) ──
function correctedCa(ca, alb) {
  return ca + (4.0 - alb)
}

console.log('\n=== 補正Ca (Payne式) ===')
assert('Ca=8.5 Alb=3.0', correctedCa(8.5, 3.0), 9.5, 0.01)
assert('Ca=9.0 Alb=4.0', correctedCa(9.0, 4.0), 9.0, 0.01)
assert('Ca=7.5 Alb=2.0', correctedCa(7.5, 2.0), 9.5, 0.01)

// ── A-aDO2 ──
function calculateAaDO2(fio2, paco2, pao2, patm = 760) {
  const pah2o = 47
  const pao2Alveolar = fio2 * (patm - pah2o) - (paco2 / 0.8)
  return pao2Alveolar - pao2
}

console.log('\n=== A-aDO2 ===')
// Room air: FiO2=0.21, PaCO2=40, PaO2=100 → A-aDO2 ≈ -0.3 (normal young)
assert('room air normal', calculateAaDO2(0.21, 40, 100), -0.3, 2)
// FiO2=0.21, PaCO2=40, PaO2=80 → A-aDO2 ≈ 19.7
assert('mild elevation', calculateAaDO2(0.21, 40, 80), 19.7, 2)
// FiO2=0.40, PaCO2=35, PaO2=80 → A-aDO2 ≈ 161.5
assert('high FiO2', calculateAaDO2(0.40, 35, 80), 161.7, 3)

// ── Summary ──
console.log(`\n${'='.repeat(40)}`)
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
if (failed > 0) {
  console.error('⚠ Some tests failed!')
  process.exit(1)
} else {
  console.log('✅ All tests passed!')
}
