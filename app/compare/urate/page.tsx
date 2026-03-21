'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'urate',
  category: '代謝・内分泌',
  title: '尿酸降下薬 比較表',
  description: 'フェブキソスタット・アロプリノール・トピロキソスタット・ベンズブロマロン・ドチヌラドの5剤を比較。XOR阻害薬 vs 尿酸排泄促進薬・腎機能別選択。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'フェブキソスタット', brand: 'フェブリク', specs: '10mg/20mg/40mg', indication: '痛風、高尿酸血症', halfLife: '約5-8時間', metabolism: '肝代謝（グルクロン酸抱合・CYP1A2/2C8/2C9）', renalAdjust: '軽〜中等度腎障害: 用量調整不要', features: 'XOR（キサンチンオキシダーゼ）選択的阻害薬。非プリン型。腎機能低下例にも使いやすい（肝代謝主体）。10mgから漸増。CARES試験で心血管死の増加懸念があったが、FAST試験では否定的', contraindication: 'メルカプトプリン・アザチオプリン併用', evidence: 'CARES、FAST試験' },
    { generic: 'アロプリノール', brand: 'ザイロリック', specs: '50mg/100mg', indication: '痛風、高尿酸血症', halfLife: '約1-2時間（活性代謝物オキシプリノール18-30時間）', metabolism: 'XOR → オキシプリノール（活性代謝物）→ 腎排泄', renalAdjust: 'CCr < 60: 減量必要。CCr < 30: さらに減量', features: 'XOR阻害薬。プリン型。歴史が長く安価。腎排泄型なので腎機能に応じた用量調整が必須。重篤な過敏症（SJS/TEN・DRESS）のリスク — HLA-B*5801陽性者でリスク高い', contraindication: 'メルカプトプリン・アザチオプリン併用', evidence: '' },
    { generic: 'トピロキソスタット', brand: 'トピロリック/ウリアデック', specs: '20mg/40mg/60mg/80mg', indication: '痛風、高尿酸血症', halfLife: '約3-5時間', metabolism: '肝代謝（グルクロン酸抱合）', renalAdjust: '腎機能低下例にも使用可', features: 'XOR選択的阻害薬。非プリン型。日本発。肝代謝主体で腎機能の影響少。20mgから漸増', contraindication: 'メルカプトプリン・アザチオプリン併用', evidence: '' },
    { generic: 'ベンズブロマロン', brand: 'ユリノーム', specs: '25mg/50mg', indication: '痛風、高尿酸血症', halfLife: '約3時間', metabolism: 'CYP2C9', renalAdjust: '尿路結石リスク上昇。尿酸結石予防にクエン酸K併用', features: '尿酸排泄促進薬（URAT1阻害）。尿酸産生量が正常〜低い場合（排泄低下型）に適する。劇症肝炎の報告あり → 肝機能定期チェック。尿路結石予防に尿アルカリ化が必須', contraindication: '尿路結石、重篤な腎障害、肝障害', evidence: '' },
    { generic: 'ドチヌラド', brand: 'ユリス', specs: '0.5mg/1mg/2mg', indication: '痛風、高尿酸血症', halfLife: '約10時間', metabolism: 'グルクロン酸抱合（BCRP・MRP4阻害で腎尿細管からの尿酸再吸収を阻害）', renalAdjust: '重度腎障害: 慎重投与', features: '選択的URAT1阻害薬。ベンズブロマロンより肝障害リスクが低い。新世代の尿酸排泄促進薬。0.5mgから漸増。尿アルカリ化が望ましい', contraindication: '重篤な腎障害', evidence: '' },
  ],
  seoContent: [
    { heading: '尿酸降下薬の選択 — 産生抑制 vs 排泄促進', text: '尿酸降下薬はXOR阻害薬（産生抑制: フェブキソスタット・アロプリノール・トピロキソスタット）と尿酸排泄促進薬（URAT1阻害: ベンズブロマロン・ドチヌラド）に大別されます。尿酸排泄低下型（日本人の90%）にはどちらも有効ですが、尿酸産生過剰型にはXOR阻害薬を選択します。' },
    { heading: '腎機能別の選択', text: 'アロプリノールは腎排泄型で腎機能に応じた厳密な減量が必要です。フェブキソスタット・トピロキソスタットは肝代謝主体で、軽〜中等度の腎障害では用量調整不要です。尿酸排泄促進薬は腎障害で効果が減弱し、尿路結石リスクも上昇するため、中等度以上の腎障害ではXOR阻害薬が優先されます。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本痛風・尿酸核酸学会. 高尿酸血症・痛風の治療ガイドライン 第3版 2022',
    'FitzGerald JD et al. 2020 ACR Guideline for Management of Gout. Arthritis Care Res 2020',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/compare/nsaids', name: 'NSAIDs比較' },
  ],
}

export default function UrateComparePage() { return <DrugCompareLayout data={data} /> }
