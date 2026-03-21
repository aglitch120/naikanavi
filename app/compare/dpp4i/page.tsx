'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'dpp4i',
  category: '糖尿病治療薬',
  title: 'DPP-4阻害薬 比較表',
  description: 'シタグリプチン・ビルダグリプチン・アログリプチン・リナグリプチン・テネリグリプチン・サキサグリプチン・トレラグリプチンの7剤を比較。腎機能別選択・週1回製剤。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'renalAdjust', 'features', 'contraindication'],
  drugs: [
    { generic: 'シタグリプチン', brand: 'ジャヌビア/グラクティブ', specs: '12.5mg/25mg/50mg/100mg', indication: '2型糖尿病', halfLife: '約12時間', metabolism: '腎排泄 80%、CYP3A4/2C8（一部）', renalAdjust: 'CCr 30-50: 減量。CCr < 30: さらに減量。透析: 使用可（減量）', features: '世界初のDPP-4阻害薬。腎排泄型だが全段階で使用可能（減量要）。配合剤豊富', contraindication: '重症ケトーシス、糖尿病性昏睡', evidence: 'TECOS試験（心血管安全性）' },
    { generic: 'ビルダグリプチン', brand: 'エクア', specs: '50mg', indication: '2型糖尿病', halfLife: '約3時間', metabolism: '加水分解（非CYP）→ 腎排泄', renalAdjust: '中等度以上の腎障害: 慎重投与', features: '1日2回投与。CYP非依存で相互作用少。肝機能障害の報告あり → 定期的な肝機能チェックが望ましい', contraindication: '重症ケトーシス、糖尿病性昏睡、肝機能障害', evidence: '' },
    { generic: 'アログリプチン', brand: 'ネシーナ', specs: '6.25mg/12.5mg/25mg', indication: '2型糖尿病', halfLife: '約21時間', metabolism: '腎排泄 60-70%、CYP関与少', renalAdjust: 'CCr 30-60: 減量。CCr < 30: さらに減量。透析: 使用可（減量）', features: '1日1回。腎排泄型だが全段階で使用可能。ピオグリタゾンとの配合剤あり', contraindication: '重症ケトーシス、糖尿病性昏睡', evidence: 'EXAMINE試験（心血管安全性）' },
    { generic: 'リナグリプチン', brand: 'トラゼンタ', specs: '5mg', indication: '2型糖尿病', halfLife: '約100時間以上（終末相）', metabolism: '胆汁排泄（85%が未変化体）。腎排泄 5%', renalAdjust: '全段階で減量不要（腎排泄わずか5%）', features: '腎機能に関わらず用量調整不要（最大の特徴）。CKDを合併する糖尿病に最も使いやすい。1日1回。CYP3A4基質だが臨床的に影響少', contraindication: '重症ケトーシス、糖尿病性昏睡', evidence: 'CARMELINA試験' },
    { generic: 'テネリグリプチン', brand: 'テネリア', specs: '20mg/40mg', indication: '2型糖尿病', halfLife: '約24時間', metabolism: 'CYP3A4/FMO3 → 肝代謝＋腎排泄', renalAdjust: '全段階で減量不要（肝腎の双排泄）', features: '腎機能に関わらず用量調整不要。1日1回。日本発。カナグリフロジンとの配合剤あり', contraindication: '重症ケトーシス、糖尿病性昏睡', evidence: '' },
    { generic: 'サキサグリプチン', brand: 'オングリザ', specs: '2.5mg/5mg', indication: '2型糖尿病', halfLife: '約2.5時間（活性代謝物7.4時間）', metabolism: 'CYP3A4/5 → 活性代謝物', renalAdjust: 'CCr ≦ 50: 減量', features: 'CYP3A4で代謝（強力CYP3A4阻害薬と併用時は減量）。メトホルミンとの配合剤あり', contraindication: '重症ケトーシス、糖尿病性昏睡', evidence: 'SAVOR-TIMI 53（心不全入院増加の懸念）' },
    { generic: 'トレラグリプチン', brand: 'ザファテック', specs: '50mg/100mg', indication: '2型糖尿病', halfLife: '約45-68時間', metabolism: '腎排泄（未変化体 > 50%）', renalAdjust: '中等度以上の腎障害: 減量。重度: さらに減量', features: '週1回投与（唯一の週1回DPP-4阻害薬）。服薬アドヒアランス向上に有用。腎排泄型', contraindication: '重症ケトーシス、糖尿病性昏睡', evidence: '' },
  ],
  seoContent: [
    { heading: 'DPP-4阻害薬の使い分け — 腎機能がカギ', text: 'DPP-4阻害薬は7剤全て血糖降下効果に大差はありませんが、腎機能別の用量調整の要否が最大の差別化ポイントです。リナグリプチン・テネリグリプチンは全段階の腎機能で用量調整不要で、CKD合併例に使いやすいです。シタグリプチン・アログリプチンは腎排泄型ですが、減量すれば透析患者にも使用可能です。' },
    { heading: '週1回製剤の位置づけ', text: 'トレラグリプチン（ザファテック）は世界初の週1回DPP-4阻害薬です。毎日の服薬が困難な高齢者や多剤併用患者のアドヒアランス改善に有用ですが、腎機能低下時は減量が必要です。' },
    { heading: 'DPP-4阻害薬の心血管安全性', text: '大規模試験（TECOS・EXAMINE・CARMELINA・SAVOR-TIMI 53）でDPP-4阻害薬の心血管安全性が検証されています。サキサグリプチン（SAVOR-TIMI 53）では心不全入院の有意な増加が報告されましたが、他剤では認められていません。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本糖尿病学会. 糖尿病治療ガイド 2024-2025',
    'Green JB et al. Effect of sitagliptin (TECOS). N Engl J Med 2015;373:232-242',
    'Scirica BM et al. Saxagliptin (SAVOR-TIMI 53). N Engl J Med 2013;369:1317-1326',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/compare/sglt2i', name: 'SGLT2阻害薬比較' },
  ],
}

export default function DPP4iComparePage() { return <DrugCompareLayout data={data} /> }
