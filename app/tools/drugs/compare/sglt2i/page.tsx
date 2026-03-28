'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'sglt2i',
  category: '糖尿病治療薬',
  title: 'SGLT2阻害薬 比較表',
  description: 'エンパグリフロジン・ダパグリフロジン・カナグリフロジン・イプラグリフロジン・トホグリフロジン・ルセオグリフロジンの6剤を比較。添付文書ベースの薬剤比較。',
  columns: ['generic', 'brand', 'indication', 'halfLife', 'metabolism', 'renalAdjust', 'features', 'evidence'],
  drugs: [
    {
      generic: 'エンパグリフロジン',
      brand: 'ジャディアンス',
      specs: '10mg/25mg 錠',
      indication: '2型糖尿病、慢性心不全（HFrEF/HFpEF）、CKD',
      halfLife: '約12.4時間',
      metabolism: 'グルクロン酸抱合（UGT2B7/1A3/1A9）',
      renalAdjust: '糖尿病: eGFR < 30で血糖降下効果減弱。心不全・CKD適応: eGFR ≥ 20で継続可能（添付文書要確認）',
      contraindication: '重症ケトーシス、糖尿病性昏睡、重症感染症、1型糖尿病',
    },
    {
      generic: 'ダパグリフロジン',
      brand: 'フォシーガ',
      specs: '5mg/10mg 錠',
      indication: '2型糖尿病、1型糖尿病（日本）、慢性心不全、CKD',
      halfLife: '約12.9時間',
      metabolism: 'グルクロン酸抱合（UGT1A9）',
      renalAdjust: 'eGFR < 25: 新規投与は一般的でない（心不全・CKD適応では継続可能な場合あり）',
      contraindication: '重症ケトーシス、糖尿病性昏睡、重症感染症',
    },
    {
      generic: 'カナグリフロジン',
      brand: 'カナグル',
      specs: '100mg 錠',
      indication: '2型糖尿病',
      halfLife: '約10.6時間',
      metabolism: 'グルクロン酸抱合（UGT1A9/2B4）',
      renalAdjust: 'eGFR < 30: 効果減弱のため一般的でない',
      contraindication: '重症ケトーシス、糖尿病性昏睡、重症感染症、1型糖尿病',
    },
    {
      generic: 'イプラグリフロジン',
      brand: 'スーグラ',
      specs: '25mg/50mg 錠',
      indication: '2型糖尿病、1型糖尿病（インスリン併用）',
      halfLife: '約15時間',
      metabolism: 'グルクロン酸抱合（UGT2B7）',
      renalAdjust: '中等度以上の腎障害: 効果減弱',
      contraindication: '重症ケトーシス、糖尿病性昏睡、重症感染症',
    },
    {
      generic: 'トホグリフロジン',
      brand: 'デベルザ/アプルウェイ',
      specs: '20mg 錠',
      indication: '2型糖尿病',
      halfLife: '約5.4時間',
      metabolism: 'CYP2C18/4A11/4F3B、グルクロン酸抱合',
      renalAdjust: '中等度以上の腎障害: 効果減弱',
      contraindication: '重症ケトーシス、糖尿病性昏睡、重症感染症、1型糖尿病',
    },
    {
      generic: 'ルセオグリフロジン',
      brand: 'ルセフィ',
      specs: '2.5mg/5mg 錠',
      indication: '2型糖尿病',
      halfLife: '約11時間',
      metabolism: 'CYP3A4/4A11/4F3B、グルクロン酸抱合',
      renalAdjust: '中等度以上の腎障害: 効果減弱',
      contraindication: '重症ケトーシス、糖尿病性昏睡、重症感染症、1型糖尿病',
    }],
  seoContent: [],
  references: [
    '各薬剤の添付文書（最新版）',
    'Zinman B et al. Empagliflozin (EMPA-REG OUTCOME). N Engl J Med 2015;373:2117-2128',
    'McMurray JJV et al. Dapagliflozin in heart failure (DAPA-HF). N Engl J Med 2019;381:1995-2008',
    'Heerspink HJL et al. Dapagliflozin in CKD (DAPA-CKD). N Engl J Med 2020;383:1436-1446',
    '日本糖尿病学会. 糖尿病治療ガイド 2024-2025'],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/drugs/compare/dpp4i', name: 'DPP-4阻害薬比較' },
    { href: '/tools/drugs/compare/arb', name: 'ARB比較' }],
}

export default function SGLT2iComparePage() {
  return <DrugCompareLayout data={data} />
}
