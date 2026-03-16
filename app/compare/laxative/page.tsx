'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'laxative',
  category: '消化器治療薬',
  title: '便秘薬（下剤）比較表',
  description: '酸化マグネシウム・センノシド・ルビプロストン・リナクロチド・エロビキシバット・ナルデメジン・ラクツロースの7剤を比較。作用機序・腎機能・オピオイド誘発性便秘。',
  columns: ['generic', 'brand', 'halfLife', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: '酸化マグネシウム', brand: 'マグミット/マグラックス', specs: '250mg/330mg/500mg', indication: '便秘、制酸', halfLife: '—（腸管内で作用）', metabolism: '吸収されたMgは腎排泄', renalAdjust: 'GFR < 30: 高Mg血症リスク → 禁忌に近い。定期的にMg値測定', features: '浸透圧性下剤。腸管内に水分を引き込み便を軟化。安価で第一選択として広く使用。長期使用で高Mg血症（特に腎障害・高齢者）に注意。NSAIDsとの併用注意。テトラサイクリン・キノロンの吸収低下', contraindication: '高Mg血症、重篤な腎障害、心ブロック', evidence: '' },
    { generic: 'センノシド', brand: 'プルゼニド', specs: '12mg', indication: '便秘', halfLife: '—（腸管内で活性化）', metabolism: '大腸細菌でレインアンスロンに変換', renalAdjust: '通常不要', features: '大腸刺激性下剤。大腸の蠕動運動を亢進。即効性（8-12時間後に効果）。連用で耐性（大腸メラノーシス）。頓用が望ましい。妊婦は慎重投与', contraindication: '急性腹症、重症の硬結便、痙攣性便秘', evidence: '' },
    { generic: 'ルビプロストン', brand: 'アミティーザ', specs: '24μgカプセル', indication: '慢性便秘', halfLife: '約0.9-1.4時間', metabolism: '胃酸・脂肪酸レダクターゼによる還元', renalAdjust: '通常不要', features: 'ClC-2チャネル活性化薬。小腸の腸液分泌を促進。耐性が生じにくい。悪心が比較的多い（食後服用で軽減）。妊婦禁忌', contraindication: '妊婦（動物実験で流産）、腸閉塞', evidence: '' },
    { generic: 'リナクロチド', brand: 'リンゼス', specs: '0.25mg', indication: '便秘型IBS、慢性便秘', halfLife: '—（腸管内で作用）', metabolism: '腸管内でペプチダーゼにより分解', renalAdjust: '通常不要', features: 'グアニル酸シクラーゼC受容体作動薬。腸液分泌促進＋腸管蠕動促進＋内臓痛覚過敏改善。IBS-Cの腹痛改善効果あり。下痢の副作用。食前投与', contraindication: '腸閉塞（確認済み or 疑い）', evidence: '' },
    { generic: 'エロビキシバット', brand: 'グーフィス', specs: '5mg', indication: '慢性便秘', halfLife: '—（腸管内で作用、全身吸収わずか）', metabolism: '全身吸収はわずか', renalAdjust: '通常不要', features: '胆汁酸トランスポーター（IBAT）阻害薬。回腸での胆汁酸再吸収を阻害 → 大腸に胆汁酸が流入 → 水分分泌＋蠕動促進。食前投与。腹痛・下痢に注意', contraindication: '腸閉塞（確認済み or 疑い）', evidence: '' },
    { generic: 'ナルデメジン', brand: 'スインプロイク', specs: '0.2mg', indication: 'オピオイド誘発性便秘（OIC）', halfLife: '約11時間', metabolism: 'CYP3A4（主）', renalAdjust: '通常不要', features: '末梢性μオピオイド受容体拮抗薬（PAMORA）。BBBを通過しにくく、オピオイドの鎮痛作用を減弱させずにOICを改善。オピオイド使用中の便秘に特化。CYP3A4強力阻害薬で血中濃度上昇', contraindication: '消化管閉塞（既知/疑い）、消化管穿孔リスクのある消化管壁の器質的障害', evidence: 'COMPOSE試験' },
    { generic: 'ラクツロース', brand: 'モニラック/ラグノス', specs: 'シロップ', indication: '慢性便秘、高アンモニア血症（肝性脳症）', halfLife: '—（腸管内で作用）', metabolism: '大腸細菌で乳酸・酢酸に分解', renalAdjust: '通常不要', features: '浸透圧性下剤。二糖類で小腸で吸収されず大腸に到達。便軟化＋腸管pHの低下（アンモニア吸収抑制）。肝性脳症の標準治療。耐性が生じにくい。妊婦にも使用可', contraindication: 'ガラクトース血症', evidence: '' },
  ],
  seoContent: [
    { heading: '便秘薬の作用機序別分類', text: '便秘薬は浸透圧性（酸化Mg・ラクツロース）、大腸刺激性（センノシド）、上皮機能変容薬（ルビプロストン・リナクロチド）、胆汁酸トランスポーター阻害薬（エロビキシバット）、末梢性μオピオイド受容体拮抗薬（ナルデメジン）に分類されます。慢性便秘では浸透圧性を基本とし、効果不十分な場合に他の機序を追加します。' },
    { heading: '高齢者・腎機能低下例の注意', text: '酸化マグネシウムは安価で広く使用されますが、腎機能低下例では高Mg血症（筋力低下・徐脈・呼吸抑制）のリスクがあります。eGFR < 30では原則使用を避け、ルビプロストン・リナクロチド・エロビキシバットなど腎排泄に依存しない薬剤を選択します。' },
    { heading: 'オピオイド誘発性便秘（OIC）', text: 'がん疼痛等でオピオイドを使用する患者の40-80%に便秘が生じます。通常の下剤で効果不十分な場合、ナルデメジン（PAMORA）が有効です。末梢のμ受容体のみを拮抗し、鎮痛作用には影響しません。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本消化器病学会. 便通異常症診療ガイドライン 2023 — 慢性便秘症',
    'Katakami N et al. Naldemedine (COMPOSE-4/5). Lancet Oncol 2017',
  ],
  relatedTools: [
    { href: '/compare/ppi', name: 'PPI比較' },
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/child-pugh', name: 'Child-Pugh' },
  ],
}

export default function LaxativeComparePage() { return <DrugCompareLayout data={data} /> }
