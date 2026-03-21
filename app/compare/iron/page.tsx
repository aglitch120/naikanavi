'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'iron',
  category: 'その他',
  title: '鉄剤 比較表',
  description: 'クエン酸第一鉄・フマル酸第一鉄・含糖酸化鉄・カルボキシマルトース鉄・デルイソマルトース鉄の5剤を比較。経口 vs 静注・消化器症状・CKD/IBD での選択。',
  columns: ['generic', 'brand', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'クエン酸第一鉄ナトリウム', brand: 'フェロミア', specs: '50mg（鉄として）', indication: '鉄欠乏性貧血', halfLife: '—', metabolism: '腸管吸収 → トランスフェリン結合', renalAdjust: '通常不要', features: '経口鉄剤。日本で最も処方される。キレート型で胃酸非依存（PPI併用でも吸収低下少ない）。消化器症状（悪心・便秘・腹痛）あり。お茶との吸収低下は臨床的に問題なし', contraindication: '鉄過剰状態（ヘモクロマトーシス）', evidence: '' },
    { generic: 'フマル酸第一鉄', brand: 'フェルム', specs: '100mg（鉄として）カプセル', indication: '鉄欠乏性貧血', halfLife: '—', metabolism: '腸管吸収', renalAdjust: '通常不要', features: '経口鉄剤。徐放カプセル（消化器症状がやや少ない）。1日1回。鉄含有量が多い。食事の影響を受けやすい（空腹時吸収が良いが消化器症状も増える）', contraindication: '鉄過剰状態', evidence: '' },
    { generic: '含糖酸化鉄', brand: 'フェジン', specs: '注射 40mg/2mL', indication: '経口鉄剤不耐・無効の鉄欠乏性貧血', halfLife: '約6時間', metabolism: '細網内皮系で鉄を放出', renalAdjust: '透析患者に頻用', features: '静注鉄剤。日本で長く使用されてきた。1回40-120mg。遊離鉄によるアナフィラキシー（稀だが重篤）。ゆっくり点滴投与。透析患者のESA併用時の鉄補充', contraindication: '鉄過剰状態', evidence: '' },
    { generic: 'カルボキシマルトース鉄', brand: 'フェインジェクト', specs: '注射 500mg/10mL', indication: '経口鉄剤不耐・無効の鉄欠乏性貧血', halfLife: '約7-12時間', metabolism: '細網内皮系で鉄を放出', renalAdjust: '通常不要', features: '静注鉄剤（新世代）。1回最大1000mgの大量急速投与が可能（15分以上で点滴）。遊離鉄放出が少なくアナフィラキシーリスクが含糖酸化鉄より低い。1-2回の投与で鉄補充完了可能。低リン血症の副作用に注意', contraindication: '鉄過剰状態、1st trimester', evidence: '' },
    { generic: 'デルイソマルトース鉄', brand: 'モノヴァー', specs: '注射 100mg/mL', indication: '鉄欠乏性貧血', halfLife: '約1-4日', metabolism: '細網内皮系', renalAdjust: '通常不要', features: '静注鉄剤（最新世代）。1回最大1000-1500mg（20mg/kg）の超大量投与が可能。投与時間も短い。アナフィラキシーリスクが最も低い。多くの患者で1回の投与で鉄補充完了。低リン血症リスクはカルボキシマルトース鉄より低い', contraindication: '鉄過剰状態、1st trimester', evidence: '' },
  ],
  seoContent: [
    { heading: '経口鉄剤 vs 静注鉄剤の選択', text: '鉄欠乏性貧血の第一選択は経口鉄剤です。経口鉄剤が不耐（消化器症状で継続困難）・無効（CKD・IBDでの吸収障害）・緊急性が高い場合（周術期・大量出血後）に静注鉄剤を使用します。新世代の静注鉄剤（カルボキシマルトース鉄・デルイソマルトース鉄）は1回大量投与が可能で、通院回数を減らせます。' },
    { heading: 'CKD・透析患者の鉄補充', text: 'CKD・透析患者ではESA（エリスロポエチン）治療に先立って鉄の充足が重要です。TSAT < 20%またはフェリチン < 100の場合は鉄補充を行います。透析患者では含糖酸化鉄の静注が広く行われてきましたが、新世代静注鉄剤も選択肢に加わっています。' },
    { heading: '経口鉄剤の消化器症状への対策', text: '経口鉄剤の主な副作用は消化器症状（悪心・上腹部不快感・便秘・下痢）です。食後服用・低用量開始・隔日投与で軽減できます。近年の研究では、毎日投与より隔日投与の方が鉄吸収率が高いとの報告もあります（ヘプシジンの日内変動による）。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本鉄バイオサイエンス学会. 鉄剤の適正使用による貧血治療指針 2015',
    'Auerbach M, Adamson JW. How we diagnose and treat iron deficiency anemia. Am J Hematol 2016',
    'Stoffel NU et al. Iron absorption from oral iron supplements given on consecutive versus alternate days. Lancet Haematol 2020',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/anc', name: 'ANC' },
  ],
}

export default function IronComparePage() { return <DrugCompareLayout data={data} /> }
