'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'doac',
  category: '抗凝固薬',
  title: 'DOAC（直接経口抗凝固薬）比較表',
  description: 'ダビガトラン・リバーロキサバン・アピキサバン・エドキサバンの4剤を添付文書情報に基づき比較。適応・半減期・腎機能調整・特徴を一覧。',
  columns: ['generic', 'brand', 'indication', 'halfLife', 'metabolism', 'renalAdjust', 'features', 'contraindication'],
  drugs: [
    {
      generic: 'ダビガトラン',
      brand: 'プラザキサ',
      specs: '75mg/110mg カプセル',
      indication: '非弁膜症性AF脳卒中予防、DVT/PE治療・再発予防',
      halfLife: '12-17時間',
      metabolism: '腎排泄 80%（P-gp基質）',
      renalAdjust: 'CCr 30-50: 減量考慮。CCr < 30: 禁忌',
      features: '唯一の中和薬（イダルシズマブ）あり。カプセルは開封不可。消化管出血のリスクがやや高い。食事の影響なし',
      contraindication: '重度腎障害（CCr < 30）、活動性出血、人工心臓弁',
      evidence: 'RE-LY試験（2009）',
    },
    {
      generic: 'リバーロキサバン',
      brand: 'イグザレルト',
      specs: '10mg/15mg 錠',
      indication: '非弁膜症性AF脳卒中予防、DVT/PE治療・再発予防、ACS二次予防',
      halfLife: '5-9時間（若年）、11-13時間（高齢）',
      metabolism: '肝代謝 2/3 + 腎排泄 1/3（CYP3A4・P-gp基質）',
      renalAdjust: 'CCr 15-49: 減量考慮。CCr < 15: 禁忌',
      features: '1日1回投与。食後服用で吸収向上。ACS適応あり（海外）。日本では15mgが通常用量',
      contraindication: '重度肝障害（Child-Pugh C）、重度腎障害',
      evidence: 'ROCKET AF試験（2011）、J-ROCKET AF（日本）',
    },
    {
      generic: 'アピキサバン',
      brand: 'エリキュース',
      specs: '2.5mg/5mg 錠',
      indication: '非弁膜症性AF脳卒中予防、DVT/PE治療・再発予防',
      halfLife: '約12時間',
      metabolism: '肝代謝 75% + 腎排泄 27%（CYP3A4・P-gp基質）',
      renalAdjust: '2項目以上該当で減量: 年齢≧80歳、体重≦60kg、Cr≧1.5。CCr < 15: 慎重投与',
      features: '腎排泄比率が最も低い（腎機能低下例に使いやすい）。消化管出血リスクが低め。1日2回投与',
      contraindication: '活動性出血、重度肝障害',
      evidence: 'ARISTOTLE試験（2011）',
    },
    {
      generic: 'エドキサバン',
      brand: 'リクシアナ',
      specs: '15mg/30mg/60mg 錠',
      indication: '非弁膜症性AF脳卒中予防、DVT/PE治療・再発予防、整形外科術後VTE予防',
      halfLife: '10-14時間',
      metabolism: '腎排泄 50%（P-gp基質）',
      renalAdjust: 'CCr 15-50/体重≦60kg/P-gp阻害薬併用: 減量。CCr < 15: 禁忌',
      features: '1日1回投与。日本発の臨床試験が豊富。VTE予防の適応あり。CCr > 95ではワルファリンに劣る可能性',
      contraindication: '重度腎障害、活動性出血',
      evidence: 'ENGAGE AF-TIMI 48試験（2013）',
    },
  ],
  seoContent: [
    { heading: 'DOAC（直接経口抗凝固薬）の使い分け', text: 'DOACはワルファリンと比較して定期的なPT-INRモニタリングが不要で、食事制限が少ない利点があります。4剤はそれぞれ作用機序（ダビガトランはトロンビン直接阻害、他3剤はXa因子阻害）、腎排泄率、投与回数、中和薬の有無が異なります。' },
    { heading: '腎機能別の選択', text: '腎排泄率はダビガトラン（80%）> エドキサバン（50%）> リバーロキサバン（33%）> アピキサバン（27%）の順で高く、腎機能低下例ではアピキサバンが使いやすいとされます。CCr < 15の透析患者では基本的に全DOACが禁忌で、ワルファリンが選択されます。' },
    { heading: '出血時の対応', text: 'ダビガトランにはイダルシズマブ（プリズバインド）という特異的中和薬があります。Xa阻害薬にはアンデキサネットアルファ（海外承認）が中和薬として存在しますが、日本での使用可能性は限定的です。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    'Connolly SJ et al. Dabigatran versus warfarin (RE-LY). N Engl J Med 2009;361:1139-1151',
    'Granger CB et al. Apixaban versus warfarin (ARISTOTLE). N Engl J Med 2011;365:981-992',
    'Giugliano RP et al. Edoxaban versus warfarin (ENGAGE AF-TIMI 48). N Engl J Med 2013;369:2093-2104',
    '日本循環器学会. 不整脈薬物治療ガイドライン 2020',
  ],
  relatedTools: [
    { href: '/tools/calc/cha2ds2-vasc', name: 'CHA₂DS₂-VASc' },
    { href: '/tools/calc/has-bled', name: 'HAS-BLED' },
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/cockcroft-gault', name: 'Cockcroft-Gault' },
  ],
}

export default function DOACComparePage() {
  return <DrugCompareLayout data={data} />
}
