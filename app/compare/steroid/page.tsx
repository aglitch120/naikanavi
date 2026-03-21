'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'steroid',
  category: '抗炎症・免疫抑制',
  title: '経口ステロイド（糖質コルチコイド）比較表',
  description: 'プレドニゾロン・メチルプレドニゾロン・デキサメタゾン・ベタメタゾン・ヒドロコルチゾン・トリアムシノロンの6剤を比較。力価換算・半減期・鉱質コルチコイド作用。',
  columns: ['generic', 'brand', 'halfLife', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'プレドニゾロン (PSL)', brand: 'プレドニン', specs: '1mg/5mg', indication: '各種炎症・免疫疾患・アレルギー・副腎不全補充', halfLife: '生物学的半減期 12-36時間', metabolism: '肝代謝（CYP3A4）', renalAdjust: '通常不要', features: '基準薬（力価1）。中間型。最も汎用されるステロイド。鉱質コルチコイド作用は中等度。長期使用で骨粗鬆症・糖尿病・感染・副腎萎縮に注意', contraindication: '有効な抗菌薬のない感染症、全身真菌症（相対的）', evidence: '' },
    { generic: 'メチルプレドニゾロン (mPSL)', brand: 'メドロール/ソル・メドロール', specs: '2mg/4mg錠、注40mg/125mg/500mg/1000mg', indication: '各種炎症・免疫疾患、パルス療法', halfLife: '生物学的半減期 12-36時間', metabolism: '肝代謝（CYP3A4）', renalAdjust: '通常不要', features: '力価 1.25（PSL比）。中間型。パルス療法（大量静注療法）の標準薬。鉱質コルチコイド作用がPSLより弱い。SLE腎炎・MS再燃・移植拒絶等に使用', contraindication: '有効な抗菌薬のない感染症', evidence: '' },
    { generic: 'デキサメタゾン (DEX)', brand: 'デカドロン', specs: '0.5mg/4mg錠、注', indication: '脳浮腫、悪心・嘔吐、炎症、クッシング症候群診断（DST）', halfLife: '生物学的半減期 36-72時間', metabolism: '肝代謝（CYP3A4）', renalAdjust: '通常不要', features: '力価 6.67（PSL比）。長時間型。鉱質コルチコイド作用ほぼなし。脳浮腫・化学療法の制吐・細菌性髄膜炎補助に使用。HPA軸抑制が強い。COVID-19重症例のエビデンスあり', contraindication: '有効な抗菌薬のない感染症', evidence: 'RECOVERY試験（COVID-19）' },
    { generic: 'ベタメタゾン', brand: 'リンデロン', specs: '0.5mg錠、注', indication: '各種炎症・アレルギー、胎児肺成熟', halfLife: '生物学的半減期 36-72時間', metabolism: '肝代謝', renalAdjust: '通常不要', features: '力価 6.67（PSL比・DEXと同等）。長時間型。鉱質コルチコイド作用ほぼなし。日本で広く使用。切迫早産時の胎児肺成熟促進（母体投与）。外用薬・点眼薬も豊富', contraindication: '有効な抗菌薬のない感染症', evidence: '' },
    { generic: 'ヒドロコルチゾン', brand: 'コートリル/ソル・コーテフ', specs: '10mg錠、注100mg/500mg', indication: '副腎不全補充、アジソン病、副腎クリーゼ', halfLife: '生物学的半減期 8-12時間', metabolism: '肝代謝（11β-HSD）', renalAdjust: '通常不要', features: '力価 0.8（PSL比）。短時間型。生理的コルチゾールに最も近い。鉱質コルチコイド作用あり（Na・水貯留）。副腎不全の補充療法の第一選択。ストレスドーズに使用', contraindication: '有効な抗菌薬のない感染症', evidence: '' },
    { generic: 'トリアムシノロン', brand: 'レダコート/ケナコルト', specs: '4mg錠、関節注', indication: '関節内注射、各種炎症', halfLife: '生物学的半減期 12-36時間', metabolism: '肝代謝', renalAdjust: '通常不要', features: '力価 1.0（PSL比）。中間型。鉱質コルチコイド作用なし。関節内注射（ケナコルト）で使用が多い。筋注用デポ剤あり', contraindication: '有効な抗菌薬のない感染症', evidence: '' },
  ],
  seoContent: [
    { heading: 'ステロイド力価換算', text: '臨床でのステロイド換算はプレドニゾロン（PSL）を基準（力価1）として行います。ヒドロコルチゾン 20mg = PSL 5mg = mPSL 4mg = DEX 0.75mg = ベタメタゾン 0.75mg が概算の等価換算です。長時間型（DEX・ベタメタゾン）はHPA軸抑制が強く、短期使用に適します。' },
    { heading: '鉱質コルチコイド作用の臨床的意義', text: '鉱質コルチコイド作用（Na・水再吸収促進、K排泄促進）は、ヒドロコルチゾン > プレドニゾロン > メチルプレドニゾロン >> デキサメタゾン = ベタメタゾン = トリアムシノロンの順で強いです。副腎不全の補充には鉱質コルチコイド作用のあるヒドロコルチゾンが適しています。浮腫や高血圧を避けたい場合はDEXやmPSLが選択されます。' },
    { heading: 'ステロイドの副作用と離脱', text: 'PSL換算で7.5mg/日以上・3週間以上の投与でHPA軸抑制が生じ、急な中止で副腎クリーゼを起こしうります。漸減が必要です。長期使用の主な副作用は、骨粗鬆症・糖尿病・感染症・消化性潰瘍・白内障・緑内障・大腿骨頭壊死・精神症状・副腎萎縮です。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    'RECOVERY Collaborative Group. Dexamethasone in hospitalized patients with Covid-19. N Engl J Med 2021;384:693-704',
    '日本内分泌学会. 副腎クリーゼを含む副腎皮質機能低下症の診断と治療に関するガイドライン 2014',
  ],
  relatedTools: [
    { href: '/tools/calc/steroid-converter', name: 'ステロイド換算' },
    { href: '/tools/calc/bmi', name: 'BMI' },
    { href: '/compare/nsaids', name: 'NSAIDs比較' },
  ],
}

export default function SteroidComparePage() { return <DrugCompareLayout data={data} /> }
