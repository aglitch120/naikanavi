'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'nsaids',
  category: '鎮痛・抗炎症薬',
  title: 'NSAIDs 比較表',
  description: 'ロキソプロフェン・ジクロフェナク・セレコキシブ・メロキシカム・イブプロフェン・インドメタシン・ナプロキセンの7剤を比較。COX選択性・消化管リスク・心血管リスク。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'ロキソプロフェン', brand: 'ロキソニン', specs: '60mg', indication: '疼痛・炎症・発熱', halfLife: '約1.3時間（活性代謝物 約1.2時間）', metabolism: '肝代謝。プロドラッグ → 活性代謝物', renalAdjust: '腎障害: 慎重投与。NSAIDs共通で腎血流低下リスク', features: 'プロドラッグ（消化管への直接刺激が少ない）。日本で最も処方される鎮痛薬。OTC入手可。COX-1/2非選択的', contraindication: '消化性潰瘍、重篤な腎障害・肝障害・心不全、アスピリン喘息', evidence: '' },
    { generic: 'ジクロフェナク', brand: 'ボルタレン', specs: '25mg錠/坐剤/テープ', indication: '疼痛・炎症・術後鎮痛', halfLife: '約1.3時間', metabolism: 'CYP2C9（主）、グルクロン酸抱合', renalAdjust: '腎障害: 慎重投与', features: '強力な抗炎症・鎮痛作用。坐剤は術後疼痛管理に有用。外用剤も豊富。COX-2選択性がやや高い', contraindication: '消化性潰瘍、重篤な腎障害・肝障害・心不全、アスピリン喘息、妊娠後期', evidence: '' },
    { generic: 'セレコキシブ', brand: 'セレコックス', specs: '100mg/200mg', indication: '関節リウマチ・変形性関節症の疼痛', halfLife: '約6-12時間', metabolism: 'CYP2C9（主）', renalAdjust: '重度腎障害: 一般的でない', features: 'COX-2選択的阻害薬。消化管障害リスクが低い（CLASS試験）。心血管リスクは他のNSAIDsと同等〜やや高い。スルホンアミド骨格', contraindication: 'スルホンアミドアレルギー、消化性潰瘍、重篤な肝腎障害・心不全', evidence: 'CLASS試験、PRECISION試験' },
    { generic: 'メロキシカム', brand: 'モービック', specs: '10mg', indication: '関節リウマチ・変形性関節症', halfLife: '約20時間', metabolism: 'CYP2C9/3A4', renalAdjust: '重度腎障害: 慎重投与', features: 'COX-2優先的阻害（選択的ではないが比較的COX-2寄り）。1日1回。半減期が長く安定した効果。消化管リスクは非選択的より低め', contraindication: '消化性潰瘍、重篤な腎障害・肝障害・心不全', evidence: '' },
    { generic: 'イブプロフェン', brand: 'ブルフェン', specs: '100mg/200mg', indication: '疼痛・炎症・発熱', halfLife: '約2時間', metabolism: 'CYP2C9（主）', renalAdjust: '腎障害: 慎重投与', features: 'OTC入手可。小児にも使用可能（解熱鎮痛）。アセトアミノフェンと並ぶ第一選択。低用量アスピリンの抗血小板作用を減弱させうる（競合）', contraindication: '消化性潰瘍、重篤な腎障害・肝障害・心不全、アスピリン喘息', evidence: '' },
    { generic: 'インドメタシン', brand: 'インテバン/インダシン', specs: '25mgカプセル/坐剤', indication: '痛風発作、関節リウマチ、動脈管閉鎖', halfLife: '約4.5時間', metabolism: 'CYP2C9、グルクロン酸抱合。腸肝循環あり', renalAdjust: '腎障害: 慎重投与', features: '最も強力なNSAIDsの一つ。痛風急性発作の標準治療。副作用（消化管・頭痛・めまい）も強い。未熟児動脈管開存に使用', contraindication: '消化性潰瘍、重篤な腎障害・肝障害・心不全、アスピリン喘息', evidence: '' },
    { generic: 'ナプロキセン', brand: 'ナイキサン', specs: '100mg', indication: '疼痛・炎症', halfLife: '約14時間', metabolism: 'CYP2C9/1A2、グルクロン酸抱合', renalAdjust: '腎障害: 慎重投与', features: '半減期が長く1日2回投与可。心血管リスクが最も低いNSAIDsとのデータあり。海外ではOTC。抗血小板作用が比較的強い', contraindication: '消化性潰瘍、重篤な腎障害・肝障害・心不全、アスピリン喘息', evidence: 'PRECISION試験（心血管安全性）' },
  ],
  seoContent: [
    { heading: 'NSAIDsの消化管リスクと選択', text: 'NSAIDsによる消化管障害はCOX-1阻害による粘膜防御低下が主因です。COX-2選択的阻害薬（セレコキシブ）や、プロドラッグ（ロキソプロフェン）は消化管リスクが低めですが、ゼロではありません。リスクの高い患者（高齢・潰瘍既往・抗凝固薬併用）ではPPIの併用を検討します。' },
    { heading: '心血管リスク', text: 'NSAIDs全体として心血管イベント（心筋梗塞・脳卒中）のリスク上昇が指摘されています。PRECISION試験ではセレコキシブ・イブプロフェン・ナプロキセンの心血管リスクは同等でした。ナプロキセンは抗血小板作用により心血管リスクが最も低いとのメタ解析もあります。心疾患患者では可能な限り短期間・低用量で使用します。' },
    { heading: 'NSAIDsと腎機能', text: 'NSAIDsはプロスタグランジン合成阻害により腎血流を低下させます。CKD・脱水・高齢者・利尿薬/ACE-I/ARB併用例では急性腎障害のリスクが高く、いわゆる「triple whammy」（RAS阻害薬＋利尿薬＋NSAIDs）は避けるべきです。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    'Nissen SE et al. Cardiovascular safety of celecoxib, naproxen, or ibuprofen (PRECISION). N Engl J Med 2016;375:2519-2529',
    'Coxib and traditional NSAID Trialists Collaboration. Lancet 2013;382:769-779',
    '日本消化器病学会. NSAIDs潰瘍ガイドライン 2020',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/rockall', name: 'Rockall' },
    { href: '/tools/calc/gbs', name: 'Glasgow-Blatchford' },
    { href: '/compare/ppi', name: 'PPI比較' },
  ],
}

export default function NSAIDsComparePage() { return <DrugCompareLayout data={data} /> }
