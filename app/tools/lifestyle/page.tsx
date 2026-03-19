'use client'

import { useState, useMemo, useEffect } from 'react'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

// ── 型定義 ──
interface PatientData {
  age: string; sex: string; height: string; weight: string; waist: string
  sbp: string; dbp: string; bpType: 'office' | 'home'
  hba1c: string; glucose: string; glucoseType: 'fasting' | 'random'
  tc: string; ldl: string; hdl: string; tg: string
  ast: string; alt: string; ggt: string; ua: string; cr: string
  uacr: string
  smoking: string; alcohol: string; exercise: string
  fhCvd: boolean; fhDm: boolean; fhHtn: boolean
  currentDm: boolean; currentHtn: boolean; currentDl: boolean; currentCkd: boolean
  historyStroke: boolean; historyCad: boolean
  onStatin: boolean; onAntihtn: boolean; onDmMed: boolean
}
type ActionSub = 'diet' | 'exercise' | 'bp' | 'glucose' | 'lipid' | 'renal' | 'liver' | 'uric' | 'general'
interface ActionItem { category: 'screening' | 'referral' | 'lifestyle' | 'medication' | 'monitoring'; subcategory: ActionSub; disease: string; priority: 'high' | 'medium' | 'low'; title: string; detail: string }
interface DiseaseAssessment { name: string; status: 'normal' | 'caution' | 'abnormal' | 'diagnosed'; summary: string; targets: string[]; actions: ActionItem[] }

const defaultData: PatientData = {
  age: '55', sex: 'male', height: '170', weight: '78', waist: '90',
  sbp: '148', dbp: '92', bpType: 'office',
  hba1c: '6.8', glucose: '118', glucoseType: 'fasting',
  tc: '240', ldl: '', hdl: '45', tg: '180',
  ast: '38', alt: '52', ggt: '68', ua: '7.8', cr: '1.1', uacr: '',
  smoking: 'ex', alcohol: 'light', exercise: 'none',
  fhCvd: false, fhDm: true, fhHtn: false,
  currentDm: false, currentHtn: false, currentDl: false, currentCkd: false,
  historyStroke: false, historyCad: false,
  onStatin: false, onAntihtn: false, onDmMed: false,
}

// ── ヘルパー ──
const calcBmi = (h: number, w: number) => w / ((h / 100) ** 2)
const calcEgfr = (cr: number, age: number, sex: string) => 194 * Math.pow(cr, -1.094) * Math.pow(age, -0.287) * (sex === 'female' ? 0.739 : 1)
const calcLdl = (tc: number, hdl: number, tg: number) => tc - hdl - tg / 5
const calcTee = (sex: string, age: number, h: number, w: number, ex: string) => {
  const bee = sex === 'male' ? 66.47 + 13.75 * w + 5.0 * h - 6.76 * age : 655.1 + 9.56 * w + 1.85 * h - 4.68 * age
  const af = ex === 'active' ? 1.5 : ex === 'moderate' ? 1.4 : ex === 'light' ? 1.3 : 1.2
  return { bee: Math.round(bee), tee: Math.round(bee * af), af }
}

// ── CVDリスク分類（久山町スコア風） ──
function classifyCvdRisk(d: PatientData, ldl: number, egfr: number | null) {
  if (d.historyCad || d.historyStroke) return { level: 'very_high' as const, label: '二次予防（CAD/脳卒中既往）', ldlTarget: 70, nonHdlTarget: 100 }
  const dm = d.currentDm || parseFloat(d.hba1c) >= 6.5
  const ckd = (egfr !== null && egfr < 60) || d.currentCkd
  if (dm && ckd) return { level: 'very_high' as const, label: '最高リスク（DM+CKD）', ldlTarget: 70, nonHdlTarget: 100 }
  if (dm) return { level: 'high' as const, label: '高リスク（DM）', ldlTarget: 100, nonHdlTarget: 130 }
  if (ckd) return { level: 'high' as const, label: '高リスク（CKD）', ldlTarget: 120, nonHdlTarget: 150 }
  let rf = 0
  if (parseFloat(d.age) >= 65) rf++; if (d.sex === 'male') rf++
  if (parseFloat(d.sbp) >= 140 || d.currentHtn) rf++; if (d.smoking === 'yes') rf++
  if (parseFloat(d.hdl) < 40) rf++; if (d.fhCvd) rf++; if (ldl >= 140) rf++
  if (rf >= 3) return { level: 'high' as const, label: `高リスク（因子${rf}個）`, ldlTarget: 120, nonHdlTarget: 150 }
  if (rf >= 1) return { level: 'mid' as const, label: `中リスク（因子${rf}個）`, ldlTarget: 140, nonHdlTarget: 170 }
  return { level: 'low' as const, label: '低リスク', ldlTarget: 160, nonHdlTarget: 190 }
}

// ── 評価エンジン ──
function assessAll(d: PatientData) {
  const R: DiseaseAssessment[] = []
  const age = parseFloat(d.age) || 0, sbp = parseFloat(d.sbp) || 0, dbp = parseFloat(d.dbp) || 0
  const hba1c = parseFloat(d.hba1c) || 0, glu = parseFloat(d.glucose) || 0
  const ldl = parseFloat(d.ldl) || ((parseFloat(d.tc) && parseFloat(d.hdl) && parseFloat(d.tg)) ? calcLdl(parseFloat(d.tc), parseFloat(d.hdl), parseFloat(d.tg)) : 0)
  const hdl = parseFloat(d.hdl) || 0, tg = parseFloat(d.tg) || 0
  const ast = parseFloat(d.ast) || 0, alt = parseFloat(d.alt) || 0, ggt = parseFloat(d.ggt) || 0
  const ua = parseFloat(d.ua) || 0, cr = parseFloat(d.cr) || 0, uacr = parseFloat(d.uacr) || 0
  const bmi = (parseFloat(d.height) && parseFloat(d.weight)) ? calcBmi(parseFloat(d.height), parseFloat(d.weight)) : null
  const egfr = (cr && age) ? calcEgfr(cr, age, d.sex) : null
  const w = parseFloat(d.weight) || 60, h = parseFloat(d.height) || 170
  const ibw = 22 * ((h / 100) ** 2)
  const tL = Math.round(ibw * 25), tH = Math.round(ibw * 30)
  const en = calcTee(d.sex, age, h, w, d.exercise)
  const hS = d.bpType === 'home' ? 135 : 140, hD = d.bpType === 'home' ? 85 : 90
  const hnS = d.bpType === 'home' ? 125 : 130, hnD = d.bpType === 'home' ? 75 : 80
  const dmT = d.glucoseType === 'fasting' ? 126 : 200, pdT = d.glucoseType === 'fasting' ? 110 : 140
  const cvd = classifyCvdRisk(d, ldl, egfr)
  const bpL = d.bpType === 'home' ? '家庭' : '診察室'
  const gL = d.glucoseType === 'fasting' ? '空腹時血糖' : '随時血糖'

  // 高血圧
  if (sbp || dbp) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    if (sbp >= 180 || dbp >= 110) { st = 'abnormal'; sm = `III度高血圧（${bpL} ${sbp}/${dbp}）`; a.push({ category: 'medication', subcategory: 'bp', disease: '高血圧', priority: 'high', title: '降圧薬開始', detail: 'Ca拮抗薬 or ARB/ACE-I。二次性高血圧除外を並行' }) }
    else if (sbp >= hS || dbp >= hD) { st = d.currentHtn ? 'diagnosed' : 'abnormal'; sm = d.currentHtn ? `治療中（${bpL} ${sbp}/${dbp}、目標未達）` : `I-II度高血圧（${bpL}）` }
    else if (sbp >= hnS || dbp >= hnD) { st = 'caution'; sm = `高値血圧（${bpL}）` }
    else { sm = `正常（${bpL}）` }
    if (sbp >= hS || dbp >= hD) {
      if (d.bpType === 'office') a.push({ category: 'monitoring', subcategory: 'bp', disease: '高血圧', priority: 'high', title: '家庭血圧測定指導', detail: '朝（起床後1h以内・排尿後・朝食前）と就寝前。135/85以上で高血圧' })
      a.push({ category: 'screening', subcategory: 'bp', disease: '高血圧', priority: 'high', title: '二次性高血圧スクリーニング', detail: '若年(<40歳)・急速発症・治療抵抗性 → PAC/PRA、カテコラミン、腎動脈エコー、甲状腺機能' })
      a.push({ category: 'screening', subcategory: 'bp', disease: '高血圧', priority: 'medium', title: 'SASスクリーニング', detail: '肥満・いびき・日中傾眠 → Epworth → 簡易PSG' })
    }
    const bpTarget = (d.currentDm || (egfr && egfr < 60) || uacr >= 30) ? (d.bpType === 'home' ? '125/75' : '130/80') : age >= 75 ? (d.bpType === 'home' ? '135/85' : '140/90') : (d.bpType === 'home' ? '125/75' : '130/80')
    tg2.push(`降圧目標: < ${bpTarget} mmHg`)
    a.push({ category: 'lifestyle', subcategory: 'diet', disease: '高血圧', priority: 'medium', title: '減塩', detail: '食塩 6g/日未満' })
    if (bmi && bmi >= 25) a.push({ category: 'lifestyle', subcategory: 'exercise', disease: '高血圧', priority: 'medium', title: '減量', detail: `BMI ${bmi.toFixed(1)}。3-6ヶ月で3%減。4kg減≈4mmHg降圧` })
    R.push({ name: '高血圧', status: st, summary: sm, targets: tg2, actions: a })
  }

  // 糖尿病
  if (hba1c || glu) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    if (hba1c >= 6.5 || glu >= dmT || d.currentDm) {
      st = d.currentDm ? 'diagnosed' : 'abnormal'; sm = d.currentDm ? `治療中（HbA1c ${hba1c || '?'}%）` : `糖尿病型（HbA1c ${hba1c}%/${gL} ${glu}）`
      if (hba1c >= 8) a.push({ category: 'medication', subcategory: 'glucose', disease: '糖尿病', priority: 'high', title: '治療強化', detail: 'インスリン or GLP-1RA追加' })
      a.push({ category: 'screening', subcategory: 'glucose', disease: '糖尿病', priority: 'high', title: '合併症スクリーニング', detail: '眼底(年1回)、尿Alb、神経伝導、ABI、頸動脈エコー' })
      a.push({ category: 'monitoring', subcategory: 'glucose', disease: '糖尿病', priority: 'medium', title: '定期検査', detail: 'HbA1c 1-3月毎、腎機能・脂質 3-6月毎' })
      tg2.push(age >= 75 ? 'HbA1c目標: < 8.0%（高齢者）' : 'HbA1c目標: < 7.0%')
    } else if (hba1c >= 6.0 || glu >= pdT) {
      st = 'caution'; sm = `境界型（${gL} ${glu}, HbA1c ${hba1c}%）`
      a.push({ category: 'screening', subcategory: 'glucose', disease: '糖尿病', priority: 'medium', title: '75gOGTT', detail: '境界型確認' })
    } else { sm = '血糖正常' }
    if (st !== 'normal') {
      a.push({ category: 'lifestyle', subcategory: 'diet', disease: '糖尿病', priority: 'high', title: '食事療法', detail: `目標 ${tL}〜${tH} kcal/日（IBW${ibw.toFixed(0)}kg×25-30）。現在推定消費 ${en.tee} kcal/日（BEE${en.bee}×${en.af}）` })
      a.push({ category: 'lifestyle', subcategory: 'exercise', disease: '糖尿病', priority: 'medium', title: '運動療法', detail: '有酸素150分/週 + レジスタンス週2-3回' })
    }
    R.push({ name: '糖尿病', status: st, summary: sm, targets: tg2, actions: a })
  }

  // 脂質異常症
  if (ldl || tg || hdl) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    const ab = ldl >= 140 || tg >= 150 || (hdl && hdl < 40)
    if (ab || d.currentDl) {
      st = d.currentDl ? 'diagnosed' : 'abnormal'
      const p: string[] = []; if (ldl >= 140) p.push(`LDL ${Math.round(ldl)}`); if (tg >= 150) p.push(`TG ${Math.round(tg)}`); if (hdl && hdl < 40) p.push(`HDL ${Math.round(hdl)}(低)`)
      sm = p.join(', ') || '治療中'
      if (ldl >= 180) a.push({ category: 'screening', subcategory: 'lipid', disease: '脂質異常症', priority: 'high', title: 'FHスクリーニング', detail: 'LDL≧180: アキレス腱厚(>9mm)、家族歴、角膜輪' })
      if (ldl >= 160) a.push({ category: 'screening', subcategory: 'lipid', disease: '脂質異常症', priority: 'medium', title: '二次性除外', detail: 'TSH、尿蛋白、肝機能' })
      tg2.push(`LDL-C目標: < ${cvd.ldlTarget} mg/dL（${cvd.label}）`)
      tg2.push(`non-HDL-C目標: < ${cvd.nonHdlTarget} mg/dL`)
      if (tg >= 500) a.push({ category: 'medication', subcategory: 'lipid', disease: '脂質異常症', priority: 'high', title: '高TG治療', detail: 'TG≧500:膵炎リスク。フィブラート+禁酒' })
    } else if (ldl >= 120) { st = 'caution'; sm = 'LDL境界域高値' } else { sm = '脂質正常' }
    if (st !== 'normal') a.push({ category: 'lifestyle', subcategory: 'diet', disease: '脂質異常症', priority: 'high', title: '食事指導（脂質）', detail: '飽和脂肪酸<7%。トランス脂肪酸回避。食物繊維25g/日。青魚推奨' })
    R.push({ name: '脂質異常症', status: st, summary: sm, targets: tg2, actions: a })
  }

  // 高尿酸血症
  if (ua) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    if (ua >= 9) { st = 'abnormal'; sm = `UA ${ua} — 薬物療法検討`; a.push({ category: 'medication', subcategory: 'uric', disease: '高尿酸血症', priority: 'high', title: '尿酸降下薬', detail: 'フェブキソスタット10mg or アロプリノール100mg' }) }
    else if (ua >= 7) { st = 'caution'; sm = `UA ${ua}` } else { sm = '尿酸正常' }
    if (st !== 'normal') { tg2.push('UA目標: < 6.0'); a.push({ category: 'lifestyle', subcategory: 'diet', disease: '高尿酸血症', priority: 'medium', title: '食事指導', detail: 'プリン体制限。水分2L/日。乳製品推奨。果糖・アルコール制限' }) }
    R.push({ name: '高尿酸血症', status: st, summary: sm, targets: tg2, actions: a })
  }

  // CKD
  if (egfr || uacr) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    const ckdS = egfr ? (egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : egfr >= 30 ? 'G3b' : egfr >= 15 ? 'G4' : 'G5') : ''
    if ((egfr && egfr < 60) || uacr >= 30) {
      st = 'abnormal'; sm = `CKD ${ckdS}（eGFR ${egfr?.toFixed(0) || '?'}）`
      if (egfr && egfr < 45) a.push({ category: 'referral', subcategory: 'renal', disease: 'CKD', priority: 'high', title: '腎臓内科紹介', detail: `eGFR ${egfr.toFixed(0)}` })
      a.push({ category: 'monitoring', subcategory: 'renal', disease: 'CKD', priority: 'high', title: 'CKD管理', detail: 'eGFR+尿Alb 3月毎。K/Ca/P/Hbフォロー' })
      a.push({ category: 'lifestyle', subcategory: 'diet', disease: 'CKD', priority: 'high', title: '食事指導（CKD）', detail: '蛋白0.8g/kg/日。食塩6g未満。K制限(G4以上)' })
      tg2.push('eGFR低下 < 4 mL/min/年')
    } else { sm = `腎機能正常（eGFR ${egfr?.toFixed(0) || '?'}）` }
    R.push({ name: 'CKD', status: st, summary: sm, targets: tg2, actions: a })
  }

  // 肝障害
  if (ast || alt || ggt) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    if (alt > 30 || ast > 30 || ggt > 50) {
      st = 'caution'; sm = [alt > 30 ? `ALT(GPT)${alt}` : '', ast > 30 ? `AST(GOT)${ast}` : '', ggt > 50 ? `γGTP${ggt}` : ''].filter(Boolean).join(', ')
      a.push({ category: 'screening', subcategory: 'liver', disease: '肝障害', priority: 'high', title: '腹部エコー', detail: '脂肪肝・肝腫大・胆石。MASLD評価' })
      a.push({ category: 'screening', subcategory: 'liver', disease: '肝障害', priority: 'medium', title: '肝炎ウイルス', detail: 'HBs抗原+HCV抗体' })
      if (alt > 30 && bmi && bmi >= 25) { a.push({ category: 'screening', subcategory: 'liver', disease: '肝障害', priority: 'medium', title: 'FIB-4', detail: '肝線維化リスク評価' }); a.push({ category: 'lifestyle', subcategory: 'exercise', disease: '肝障害', priority: 'high', title: '減量（脂肪肝）', detail: '7-10%減で改善。有酸素150分/週' }) }
      if (ggt > 100 && d.alcohol !== 'none') a.push({ category: 'lifestyle', subcategory: 'diet', disease: '肝障害', priority: 'high', title: '節酒/禁酒', detail: '男性40g/日・女性20g/日以下' })
      tg2.push('ALT < 30 IU/L')
    } else { sm = '肝機能正常' }
    R.push({ name: '肝障害/脂肪肝', status: st, summary: sm, targets: tg2, actions: a })
  }

  // 肥満
  if (bmi) {
    const a: ActionItem[] = []; let st: DiseaseAssessment['status'] = 'normal'; let sm = ''; const tg2: string[] = []
    if (bmi >= 35) { st = 'abnormal'; sm = `BMI ${bmi.toFixed(1)} — 高度肥満`; a.push({ category: 'screening', subcategory: 'general', disease: '肥満', priority: 'high', title: 'SAS', detail: 'BMI≧35: CPAP適応評価' }) }
    else if (bmi >= 25) { st = 'caution'; sm = `BMI ${bmi.toFixed(1)} — 肥満` } else { sm = `BMI ${bmi.toFixed(1)}` }
    if (bmi >= 25) {
      tg2.push(`目標: ${ibw.toFixed(1)}kg（BMI22）、まず3%減`)
      a.push({ category: 'lifestyle', subcategory: 'diet', disease: '肥満', priority: 'high', title: '食事療法', detail: `推定消費 ${en.tee} kcal/日（BEE${en.bee}×${en.af}）→ 目標 ${tL}〜${tH} kcal/日` })
      a.push({ category: 'lifestyle', subcategory: 'exercise', disease: '肥満', priority: 'high', title: '運動療法', detail: '有酸素150分/週以上' })
    }
    R.push({ name: '肥満/メタボ', status: st, summary: sm, targets: tg2, actions: a })
  }

  return { assessments: R, cvdRisk: (ldl || tg || hdl) ? cvd : null }
}

// ── UIパーツ ──
const sCard: Record<string, string> = { normal: 'bg-[#E6F4EA] border-l-4 border-[#34A853]', caution: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]', abnormal: 'bg-[#FDECEA] border-l-4 border-[#D93025]', diagnosed: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]' }
const sText: Record<string, string> = { normal: 'text-[#1B5E20]', caution: 'text-[#E65100]', abnormal: 'text-[#B71C1C]', diagnosed: 'text-[#1565C0]' }
const sLabel: Record<string, string> = { normal: '正常', caution: '注意', abnormal: '異常', diagnosed: '治療中' }
const pBadge: Record<string, string> = { high: 'bg-[#D93025] text-white', medium: 'bg-[#F9A825] text-[#4A3800]', low: 'bg-[#E8E5DF] text-[#6B6760]' }
const catL: Record<string, string> = { screening: '検査', referral: '紹介', lifestyle: '生活指導', medication: '薬物', monitoring: 'モニタリング' }
const subL: Record<string, string> = { diet: '🍽️ 食事', exercise: '🏃 運動', bp: '💓 血圧', glucose: '🩸 血糖', lipid: '🧪 脂質', renal: '💧 腎臓', liver: '🫁 肝臓', uric: '💎 尿酸', general: '📋 全般' }
const rBadge: Record<string, string> = { low: 'bg-[#E6F4EA] text-[#1B5E20]', mid: 'bg-[#FFF8E1] text-[#E65100]', high: 'bg-[#FDECEA] text-[#B71C1C]', very_high: 'bg-[#D93025] text-white' }

function F({ id, label, unit, value, onChange, hint, step }: { id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; hint?: string; step?: number }) {
  return <div><label htmlFor={id} className="block text-xs font-medium text-tx mb-0.5">{label}{unit && <span className="text-muted ml-1">({unit})</span>}</label>{hint && <p className="text-[10px] text-muted mb-0.5">{hint}</p>}<input type="number" id={id} inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} step={step} className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac" /></div>
}
function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 cursor-pointer text-sm text-tx"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-3.5 h-3.5 rounded border-br text-ac" />{label}</label>
}
function Tog({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <div><span className="text-xs font-medium text-tx">{label}</span><div className="flex gap-1 mt-0.5">{options.map(o => <button key={o.value} onClick={() => onChange(o.value)} className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${value === o.value ? 'bg-ac text-white border-ac' : 'bg-bg text-muted border-br hover:border-ac/40'}`}>{o.label}</button>)}</div></div>
}
function AR({ a }: { a: ActionItem }) { return <div className="flex gap-2 items-start"><span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${pBadge[a.priority]}`}>{catL[a.category]}</span><div><p className="text-sm font-medium text-tx">{a.title}</p><p className="text-xs text-muted">{a.detail}</p></div></div> }

export default function LifestylePage() {
  const [data, setData] = useState<PatientData>(defaultData)
  const [actionView, setActionView] = useState<'disease' | 'subcategory'>('disease')
  const s = (key: keyof PatientData) => (val: string | boolean) => setData(prev => ({ ...prev, [key]: val }))
  const { assessments, cvdRisk } = useMemo(() => assessAll(data), [data])
  const all = assessments.flatMap(a => a.actions)
  const hi = all.filter(a => a.priority === 'high')
  const hasIn = !!(data.sbp || data.hba1c || data.ldl || data.tg || data.alt || data.ua || data.cr)
  const bmi = (parseFloat(data.height) && parseFloat(data.weight)) ? calcBmi(parseFloat(data.height), parseFloat(data.weight)) : null
  const egfr = (parseFloat(data.cr) && parseFloat(data.age)) ? calcEgfr(parseFloat(data.cr), parseFloat(data.age), data.sex) : null
  const bySub = useMemo(() => { const m: Record<string, ActionItem[]> = {}; all.forEach(a => { if (!m[a.subcategory]) m[a.subcategory] = []; m[a.subcategory].push(a) }); return m }, [all])
  const byDis = useMemo(() => { const m: Record<string, ActionItem[]> = {}; all.forEach(a => { if (!m[a.disease]) m[a.disease] = []; m[a.disease].push(a) }); return m }, [all])

  // PLG: ツール利用トラッキング
  useEffect(() => { trackToolUsage('lifestyle') }, [])

  return <div className="max-w-4xl mx-auto">
    <div className="mb-6 flex items-start justify-between gap-3"><div className="min-w-0"><h1 className="text-2xl font-bold text-tx">生活習慣病 総合管理ツール</h1><p className="text-sm text-muted mt-1">患者データ入力 → 疾患評価・管理目標・次のアクション自動生成</p><p className="text-xs text-muted mt-1 p-2 bg-bg rounded-lg border border-br">⚠️ 本ツールは臨床判断の補助です。</p></div><ProPulseHint><FavoriteButton slug="lifestyle" title="生活習慣病 総合管理ツール" href="/tools/lifestyle" type="calc" /></ProPulseHint></div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3"><h2 className="text-sm font-bold text-tx">📋 基本情報</h2><div className="grid grid-cols-2 gap-2"><F id="age" label="年齢" unit="歳" value={data.age} onChange={s('age')} /><div><label className="block text-xs font-medium text-tx mb-0.5">性別</label><select value={data.sex} onChange={e => s('sex')(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30"><option value="male">男性</option><option value="female">女性</option></select></div><F id="height" label="身長" unit="cm" value={data.height} onChange={s('height')} /><F id="weight" label="体重" unit="kg" value={data.weight} onChange={s('weight')} /></div><F id="waist" label="腹囲" unit="cm" hint="メタボ:男≧85 女≧90" value={data.waist} onChange={s('waist')} />{bmi && <p className="text-xs text-muted">BMI: <span className="font-mono font-bold text-tx">{bmi.toFixed(1)}</span></p>}</div>

      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3"><h2 className="text-sm font-bold text-tx">💓 血圧</h2><Tog label="測定" value={data.bpType} onChange={v => s('bpType')(v)} options={[{value:'office',label:'診察室'},{value:'home',label:'家庭'}]} /><div className="grid grid-cols-2 gap-2"><F id="sbp" label="収縮期" unit="mmHg" value={data.sbp} onChange={s('sbp')} /><F id="dbp" label="拡張期" unit="mmHg" value={data.dbp} onChange={s('dbp')} /></div><h2 className="text-sm font-bold text-tx pt-2">🩸 血糖</h2><Tog label="採血" value={data.glucoseType} onChange={v => s('glucoseType')(v)} options={[{value:'fasting',label:'早朝空腹時'},{value:'random',label:'随時'}]} /><div className="grid grid-cols-2 gap-2"><F id="hba1c" label="HbA1c" unit="%" value={data.hba1c} onChange={s('hba1c')} step={0.1} /><F id="glucose" label={data.glucoseType==='fasting'?'空腹時血糖':'随時血糖'} unit="mg/dL" value={data.glucose} onChange={s('glucose')} /></div></div>

      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3"><h2 className="text-sm font-bold text-tx">🧪 脂質</h2><div className="grid grid-cols-2 gap-2"><F id="tc" label="TC" unit="mg/dL" value={data.tc} onChange={s('tc')} /><F id="ldl" label="LDL-C" unit="mg/dL" hint="未入力→TC/HDL/TGから計算" value={data.ldl} onChange={s('ldl')} /><F id="hdl" label="HDL-C" unit="mg/dL" value={data.hdl} onChange={s('hdl')} /><F id="tg" label="TG" unit="mg/dL" value={data.tg} onChange={s('tg')} /></div>{!data.ldl&&data.tc&&data.hdl&&data.tg&&parseFloat(data.tg)<400&&<p className="text-xs text-muted">Friedewald LDL-C ≈ <span className="font-mono font-bold text-tx">{Math.round(parseFloat(data.tc)-parseFloat(data.hdl)-parseFloat(data.tg)/5)}</span> mg/dL（non-HDL-C: <span className="font-mono font-bold text-tx">{Math.round(parseFloat(data.tc)-parseFloat(data.hdl))}</span>）</p>}{!data.ldl&&data.tg&&parseFloat(data.tg)>=400&&<p className="text-xs text-[#B71C1C]">⚠️ TG≧400: 直接法LDL-Cを入力</p>}</div>

      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3"><h2 className="text-sm font-bold text-tx">💧 腎・肝・尿酸</h2><div className="grid grid-cols-2 gap-2"><F id="cr" label="Cr" unit="mg/dL" value={data.cr} onChange={s('cr')} step={0.01} /><F id="uacr" label="尿Alb/Cr比" unit="mg/gCr" value={data.uacr} onChange={s('uacr')} /><F id="ua" label="尿酸" unit="mg/dL" value={data.ua} onChange={s('ua')} step={0.1} /><F id="ast" label="AST (GOT)" unit="IU/L" value={data.ast} onChange={s('ast')} /><F id="alt" label="ALT (GPT)" unit="IU/L" value={data.alt} onChange={s('alt')} /><F id="ggt" label="γGTP" unit="IU/L" value={data.ggt} onChange={s('ggt')} /></div>{egfr&&<p className="text-xs text-muted">eGFR: <span className="font-mono font-bold text-tx">{egfr.toFixed(1)}</span> mL/min/1.73m²</p>}</div>

      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3 md:col-span-2"><h2 className="text-sm font-bold text-tx">📝 既往・生活習慣</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[['smoking','喫煙',[['no','非喫煙'],['ex','過去'],['yes','現在']]] as const,['alcohol','飲酒',[['none','なし'],['light','適量(≦20g)'],['moderate','中等量'],['heavy','多量(>40g)']]] as const,['exercise','運動',[['none','なし'],['light','週1-2'],['moderate','週3-4'],['active','週5+']]] as const].map(([k,l,opts])=><div key={k}><label className="block text-xs font-medium text-tx mb-0.5">{l}</label><select value={(data as any)[k]} onChange={e=>s(k as keyof PatientData)(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30">{opts.map(([v,lb])=><option key={v} value={v}>{lb}</option>)}</select></div>)}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1"><Chk label="CVD家族歴" checked={data.fhCvd} onChange={s('fhCvd') as any} /><Chk label="冠動脈疾患既往" checked={data.historyCad} onChange={s('historyCad') as any} /><Chk label="脳卒中既往" checked={data.historyStroke} onChange={s('historyStroke') as any} /><Chk label="DM家族歴" checked={data.fhDm} onChange={s('fhDm') as any} /><Chk label="DM治療中" checked={data.currentDm} onChange={s('currentDm') as any} /><Chk label="高血圧治療中" checked={data.currentHtn} onChange={s('currentHtn') as any} /><Chk label="脂質異常治療中" checked={data.currentDl} onChange={s('currentDl') as any} /><Chk label="CKD治療中" checked={data.currentCkd} onChange={s('currentCkd') as any} /></div></div>
    </div>

    {hasIn&&<>{cvdRisk&&<div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${rBadge[cvdRisk.level]}`}><span className="text-lg">📊</span><div><p className="text-sm font-bold">動脈硬化リスク: {cvdRisk.label}</p><p className="text-xs">LDL目標 &lt;{cvdRisk.ldlTarget} / non-HDL &lt;{cvdRisk.nonHdlTarget} mg/dL</p></div></div>}

      {all.length>0&&<><div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-tx">全アクション（{all.length}件）</h2><div className="flex gap-1"><button onClick={()=>setActionView('disease')} className={`text-xs px-3 py-1 rounded-lg border ${actionView==='disease'?'bg-ac text-white border-ac':'bg-bg text-muted border-br'}`}>疾患別</button><button onClick={()=>setActionView('subcategory')} className={`text-xs px-3 py-1 rounded-lg border ${actionView==='subcategory'?'bg-ac text-white border-ac':'bg-bg text-muted border-br'}`}>カテゴリ別</button></div></div>
        <div className="bg-s0 border border-br rounded-xl p-4 mb-8">{actionView==='disease'?<div className="space-y-4">{Object.entries(byDis).map(([d,as])=><div key={d}><p className="text-xs font-bold text-ac mb-2 border-b border-br pb-1">{d}</p><div className="space-y-2">{as.map((a,i)=><AR key={i} a={a}/>)}</div></div>)}</div>:<div className="space-y-4">{Object.entries(bySub).map(([sub,as])=><div key={sub}><p className="text-xs font-bold text-ac mb-2 border-b border-br pb-1">{subL[sub]||sub}</p><div className="space-y-2">{as.map((a,i)=><AR key={i} a={a}/>)}</div></div>)}</div>}</div>
        </>}
    </>}

    <div className="text-xs text-muted mt-8 pt-4 border-t border-br"><p className="font-semibold">出典:</p><p>JSH2019 / 糖尿病GL2024 / 動脈硬化GL2022 / CKD GL2023 / 高尿酸GL第3版 / MASLD GL2023</p></div>
  </div>
}
