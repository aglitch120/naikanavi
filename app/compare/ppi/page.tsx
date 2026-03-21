'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'ppi',
  category: '消化器治療薬',
  title: 'PPI（プロトンポンプ阻害薬）比較表',
  description: 'オメプラゾール・ランソプラゾール・ラベプラゾール・エソメプラゾール・ボノプラザンの5剤を比較。代謝経路・相互作用・P-CABとの違い。',
  columns: ['generic', 'brand', 'indication', 'halfLife', 'metabolism', 'features', 'contraindication'],
  drugs: [
    {
      generic: 'オメプラゾール',
      brand: 'オメプラール',
      specs: '10mg/20mg 錠',
      indication: '胃潰瘍、十二指腸潰瘍、GERD、ZES、H.pylori除菌補助',
      halfLife: '約0.5-1時間',
      metabolism: 'CYP2C19（主）、CYP3A4',
      renalAdjust: '通常不要',
      features: '世界初のPPI。CYP2C19の遺伝子多型の影響を最も受ける（PM: 効果↑、RM: 効果↓）。クロピドグレルとの相互作用に注意',
      contraindication: 'アタザナビル・リルピビリン併用禁忌',
    },
    {
      generic: 'ランソプラゾール',
      brand: 'タケプロン',
      specs: '15mg/30mg カプセル/OD錠',
      indication: '胃潰瘍、十二指腸潰瘍、GERD、ZES、H.pylori除菌補助、NSAIDs潰瘍予防',
      halfLife: '約1-2時間',
      metabolism: 'CYP2C19（主）、CYP3A4',
      renalAdjust: '通常不要',
      features: '日本で最も処方量が多いPPI。OD錠（口腔内崩壊錠）あり。経鼻チューブ投与可。低Mg血症に注意（長期使用）',
      contraindication: 'アタザナビル・リルピビリン併用禁忌',
    },
    {
      generic: 'ラベプラゾール',
      brand: 'パリエット',
      specs: '5mg/10mg/20mg 錠',
      indication: '胃潰瘍、十二指腸潰瘍、GERD、ZES、H.pylori除菌補助',
      halfLife: '約1-2時間',
      metabolism: '非酵素的還元（主）、CYP2C19（一部）、CYP3A4',
      renalAdjust: '通常不要',
      features: 'CYP2C19の遺伝子多型の影響が最も少ないPPI（非酵素的還元が主経路）。クロピドグレルとの相互作用リスク低。薬物相互作用が少ない',
      contraindication: 'アタザナビル・リルピビリン併用禁忌',
    },
    {
      generic: 'エソメプラゾール',
      brand: 'ネキシウム',
      specs: '10mg/20mg カプセル',
      indication: '胃潰瘍、十二指腸潰瘍、GERD、ZES、H.pylori除菌補助、NSAIDs潰瘍予防',
      halfLife: '約1-1.5時間',
      metabolism: 'CYP2C19（主）、CYP3A4',
      renalAdjust: '通常不要',
      features: 'オメプラゾールのS体（光学異性体）。バイオアベイラビリティが高い。小児適応あり。注射剤あり',
      contraindication: 'アタザナビル・リルピビリン併用禁忌',
    },
    {
      generic: 'ボノプラザン',
      brand: 'タケキャブ',
      specs: '10mg/20mg 錠',
      indication: '胃潰瘍、十二指腸潰瘍、GERD、ZES、H.pylori除菌補助',
      halfLife: '約7-8時間',
      metabolism: 'CYP3A4（主）',
      renalAdjust: '通常不要',
      features: 'P-CAB（カリウムイオン競合型アシッドブロッカー）。PPI非依存の機序。初回投与から最大効果。CYP2C19多型の影響なし。夜間酸分泌も強力に抑制。H.pylori除菌率が高い（一次除菌90%以上）',
      contraindication: 'アタザナビル・リルピビリン併用禁忌',
    },
  ],
  seoContent: [
    { heading: 'PPI vs P-CAB（ボノプラザン）の違い', text: '従来のPPIは酸性環境で活性化するプロドラッグで、効果発現まで数日かかります。一方、ボノプラザン（P-CAB）はカリウムイオンと競合的にプロトンポンプを阻害し、初回投与から最大効果を発揮します。CYP2C19遺伝子多型の影響を受けないのも大きな利点です。' },
    { heading: 'CYP2C19遺伝子多型とPPI', text: '日本人の約20%がCYP2C19のPoor Metabolizer（PM）で、PPIの血中濃度が上昇し効果が増強します。逆にRapid Metabolizer（RM）ではPPIの効果が減弱することがあります。ラベプラゾールとボノプラザンはこの多型の影響が少なく、安定した効果が期待できます。' },
    { heading: 'PPI長期使用の注意点', text: 'PPI長期使用では低Mg血症、Clostridioides difficile感染症、骨折リスク、腎障害、ビタミンB12欠乏のリスクが報告されています。漫然とした長期投与は避け、適応の見直しを定期的に行うことが重要です。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本消化器病学会. GERD診療ガイドライン 2021',
    'Murakami K et al. Vonoprazan vs lansoprazole for H. pylori eradication. Gut 2016',
    '日本消化器病学会. H. pylori感染の診断と治療のガイドライン 2016改訂版',
  ],
  relatedTools: [
    { href: '/tools/calc/alvarado', name: 'Alvarado' },
    { href: '/tools/calc/rockall', name: 'Rockall' },
    { href: '/tools/calc/gbs', name: 'Glasgow-Blatchford' },
    { href: '/tools/calc/child-pugh', name: 'Child-Pugh' },
  ],
}

export default function PPIComparePage() {
  return <DrugCompareLayout data={data} />
}
