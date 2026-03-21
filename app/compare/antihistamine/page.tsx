'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'antihistamine',
  category: '抗アレルギー薬',
  title: '抗ヒスタミン薬（第2世代）比較表',
  description: 'フェキソフェナジン・ロラタジン・デスロラタジン・セチリジン・レボセチリジン・ビラスチン・ルパタジン・オロパタジンの8剤を比較。眠気・自動車運転制限・食事の影響。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'フェキソフェナジン', brand: 'アレグラ', specs: '30mg/60mg', indication: 'アレルギー性鼻炎、蕁麻疹、皮膚疾患の掻痒', halfLife: '約14時間', metabolism: '肝代謝ほぼなし。胆汁・腎排泄', renalAdjust: '重度腎障害: 慎重投与', features: '眠気が最も少ない（非鎮静性）。自動車運転制限なし。OTC入手可。P-gp基質（エリスロマイシン等で血中濃度上昇）。抗コリン作用なし', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'ロラタジン', brand: 'クラリチン', specs: '10mg錠/OD錠', indication: 'アレルギー性鼻炎、蕁麻疹', halfLife: '約8時間（活性代謝物14時間）', metabolism: 'CYP3A4/2D6 → デスロラタジン（活性代謝物）', renalAdjust: '肝障害: 隔日投与', features: '眠気少ない。自動車運転制限なし。OTC入手可。1日1回。小児適応あり（ドライシロップ）。CYP3A4阻害薬との相互作用に注意', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'デスロラタジン', brand: 'デザレックス', specs: '5mg', indication: 'アレルギー性鼻炎、蕁麻疹', halfLife: '約19-34時間', metabolism: 'グルクロン酸抱合。CYP関与少', renalAdjust: '通常不要', features: 'ロラタジンの活性代謝物。CYP関与が少なく相互作用が少ない。自動車運転制限なし。効果発現が速い。食事の影響なし', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'セチリジン', brand: 'ジルテック', specs: '5mg/10mg錠', indication: 'アレルギー性鼻炎、蕁麻疹、皮膚疾患の掻痒', halfLife: '約7-11時間', metabolism: '肝代謝少。主に腎排泄（未変化体60%）', renalAdjust: 'CCr < 30: 減量。透析: 使用不可', features: '効果発現が速く抗ヒスタミン作用が強い。やや眠気あり（第2世代の中では）。自動車運転時に注意。腎排泄型なので腎機能に応じた調整必要', contraindication: '重篤な腎障害（透析）', evidence: '' },
    { generic: 'レボセチリジン', brand: 'ザイザル', specs: '2.5mg/5mg錠', indication: 'アレルギー性鼻炎、蕁麻疹、皮膚疾患の掻痒', halfLife: '約7-10時間', metabolism: '肝代謝少。腎排泄主体', renalAdjust: 'CCr < 30: 減量。透析: 使用不可', features: 'セチリジンのR体（光学異性体）。セチリジンの半量で同等効果。やや眠気あり。1日1回就寝前。小児シロップあり', contraindication: '重篤な腎障害（透析）', evidence: '' },
    { generic: 'ビラスチン', brand: 'ビラノア', specs: '20mg', indication: 'アレルギー性鼻炎、蕁麻疹', halfLife: '約10.5時間', metabolism: '肝代謝ほぼなし。未変化体で排泄', renalAdjust: '通常不要', features: '非鎮静性。自動車運転制限なし。脳内H1受容体占拠率ほぼ0%。食事の影響大（空腹時服用必須: 食後で吸収40-60%低下）。CYP非関与', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'ルパタジン', brand: 'ルパフィン', specs: '10mg', indication: 'アレルギー性鼻炎、蕁麻疹', halfLife: '約6時間（活性代謝物デスロラタジン19時間）', metabolism: 'CYP3A4 → デスロラタジン（活性代謝物）', renalAdjust: '通常不要', features: '抗ヒスタミン作用 + 抗PAF作用（二重作用）。代謝物がデスロラタジン。やや眠気あり。グレープフルーツジュースで血中濃度上昇', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'オロパタジン', brand: 'アレロック', specs: '2.5mg/5mg', indication: 'アレルギー性鼻炎、蕁麻疹、皮膚疾患の掻痒', halfLife: '約8-12時間', metabolism: '肝代謝少。腎排泄主体', renalAdjust: '重度腎障害: 慎重投与', features: '抗アレルギー作用（メディエーター遊離抑制）もあり、皮膚疾患に強い。眠気はやや多い。点眼薬（パタノール）もあり。1日2回', contraindication: '特になし（過敏症のみ）', evidence: '' },
  ],
  seoContent: [
    { heading: '眠気と自動車運転制限', text: '第2世代抗ヒスタミン薬は第1世代に比べ中枢移行が少なく眠気が少ないですが、薬剤間で差があります。脳内H1受容体占拠率に基づくと、フェキソフェナジン・ビラスチン・デスロラタジン・ロラタジンは「非鎮静性」で自動車運転制限がありません。セチリジン・レボセチリジン・オロパタジンはやや眠気があり「自動車運転時に注意」の記載があります。' },
    { heading: '食事の影響', text: 'ビラスチンは空腹時服用が必須で、食後では吸収が40-60%低下します。フェキソフェナジンもグレープフルーツジュースやオレンジジュースでOATP阻害による吸収低下があります。他の薬剤は食事の影響が少なく、服薬タイミングの制限が少ないです。' },
    { heading: '特殊な状況での選択', text: '腎機能低下例ではフェキソフェナジン・デスロラタジン・ビラスチンが用量調整不要で使いやすいです。妊娠中はロラタジン・セチリジンが比較的安全性データが多いとされます。高齢者では抗コリン作用の少ない薬剤を選択し、眠気・転倒リスクに注意します。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本アレルギー学会. アレルギー性鼻炎ガイド 2024',
    '鼻アレルギー診療ガイドライン 2024（日本耳鼻咽喉科免疫アレルギー学会）',
    'Yanai K et al. H1 receptor occupancy of antihistamines. Clin Exp Allergy 2017',
  ],
  relatedTools: [
    { href: '/compare/nsaids', name: 'NSAIDs比較' },
    { href: '/compare/ppi', name: 'PPI比較' },
  ],
}

export default function AntihistamineComparePage() { return <DrugCompareLayout data={data} /> }
