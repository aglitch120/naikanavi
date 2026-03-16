'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'antiplatelet',
  category: '循環器',
  title: '抗血小板薬 比較表',
  description: 'アスピリン・クロピドグレル・プラスグレル・チカグレロル・シロスタゾール・サルポグレラートの6剤を比較。DAPT選択・CYP2C19多型・出血リスク。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'アスピリン', brand: 'バイアスピリン', specs: '100mg', indication: '虚血性心疾患・脳血管障害の二次予防、PCI後', halfLife: '約15-20分（不可逆的COX-1阻害で効果は血小板寿命=7-10日持続）', metabolism: 'エステラーゼで加水分解', renalAdjust: '通常不要', features: '不可逆的COX-1阻害。抗血小板療法の基本薬。低用量で抗血小板、高用量で鎮痛。PPI併用で消化管障害予防。一次予防では出血リスクとの天秤。手術前7日休薬', contraindication: 'アスピリン喘息、消化性潰瘍、出血傾向、妊娠後期', evidence: 'CAPRIE、CURE（クロピドグレルと併用）' },
    { generic: 'クロピドグレル', brand: 'プラビックス', specs: '25mg/75mg', indication: '虚血性心疾患・脳血管障害の二次予防、PCI後', halfLife: '約6時間（不可逆的P2Y12阻害で効果は血小板寿命持続）', metabolism: 'CYP2C19（主）→ 活性代謝物。プロドラッグ', renalAdjust: '通常不要', features: 'チエノピリジン系P2Y12阻害薬。プロドラッグ（CYP2C19依存）。CYP2C19 PMでは効果減弱（日本人20%）。アスピリンとのDAPT。オメプラゾールとの相互作用に注意。手術前5日休薬', contraindication: '出血（頭蓋内出血・消化管出血等）', evidence: 'CAPRIE、CURE試験' },
    { generic: 'プラスグレル', brand: 'エフィエント', specs: '2.5mg/3.75mg/5mg/20mg', indication: 'PCI適応のACS、PCI後', halfLife: '約7時間（不可逆的P2Y12阻害）', metabolism: 'エステラーゼ + CYP3A4/2B6 → 活性代謝物。プロドラッグ', renalAdjust: '通常不要', features: 'チエノピリジン系。クロピドグレルより活性代謝物への変換効率が高く、CYP2C19多型の影響が少ない。効果発現が速い。日本では維持量が海外より低い（3.75mg）。出血リスクはクロピドグレルよりやや高い', contraindication: '出血、脳卒中/TIA既往（海外データ）、重度肝障害', evidence: 'TRITON-TIMI 38、PRASFIT-ACS（日本）' },
    { generic: 'チカグレロル', brand: 'ブリリンタ', specs: '60mg/90mg', indication: 'PCI適応のACS、ACS後二次予防', halfLife: '約7-8.5時間（可逆的P2Y12阻害）', metabolism: 'CYP3A4（主）→ 活性代謝物', renalAdjust: '通常不要', features: '非チエノピリジン系（CPTP系）。可逆的P2Y12阻害（休薬後3-5日で血小板機能回復）。プロドラッグでなくCYP2C19非依存。呼吸困難の副作用。CYP3A4強力阻害薬/誘導薬で相互作用', contraindication: '出血、重度肝障害、CYP3A4強力阻害薬併用', evidence: 'PLATO試験' },
    { generic: 'シロスタゾール', brand: 'プレタール', specs: '50mg/100mg', indication: '慢性動脈閉塞症、脳梗塞再発予防', halfLife: '約11時間', metabolism: 'CYP3A4/2D6/2C19', renalAdjust: '通常不要', features: 'PDE3阻害薬。抗血小板＋血管拡張＋抗増殖作用。間欠性跛行の改善に有用。頭痛・動悸・頻脈の副作用。うっ血性心不全には禁忌（PDE3阻害で心不全悪化）', contraindication: 'うっ血性心不全、出血（頭蓋内出血等）', evidence: 'CSPS.com（脳梗塞再発予防）' },
    { generic: 'サルポグレラート', brand: 'アンプラーグ', specs: '100mg', indication: '慢性動脈閉塞症', halfLife: '約0.8時間', metabolism: '肝代謝', renalAdjust: '通常不要', features: '5-HT2受容体拮抗薬。血小板凝集抑制＋血管収縮抑制。出血リスクが比較的低い。閉塞性動脈硬化症の間欠性跛行に使用', contraindication: '出血（頭蓋内出血等）', evidence: '' },
  ],
  seoContent: [
    { heading: 'DAPT（抗血小板薬2剤併用療法）', text: 'PCI後はアスピリン＋P2Y12阻害薬（クロピドグレル/プラスグレル/チカグレロル）のDAPTが標準です。DAPT期間はステントの種類・出血/虚血リスクで決定します。近年は短縮DAPT（1-3ヶ月）後にP2Y12阻害薬単剤への移行（de-escalation）も検討されています。' },
    { heading: 'CYP2C19遺伝子多型とP2Y12阻害薬', text: 'クロピドグレルはCYP2C19依存のプロドラッグで、PM（日本人の約20%）では効果が減弱します。プラスグレル・チカグレロルはこの影響が少なく、ハイリスク症例では有利です。遺伝子検査に基づく薬剤選択も考慮されます。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本循環器学会. 冠動脈疾患患者における抗血栓療法ガイドライン 2020',
    'Wallentin L et al. Ticagrelor versus clopidogrel (PLATO). N Engl J Med 2009;361:1045-1057',
  ],
  relatedTools: [
    { href: '/tools/calc/cha2ds2-vasc', name: 'CHA₂DS₂-VASc' },
    { href: '/tools/calc/has-bled', name: 'HAS-BLED' },
    { href: '/compare/doac', name: 'DOAC比較' },
  ],
}

export default function AntiplateletComparePage() { return <DrugCompareLayout data={data} /> }
