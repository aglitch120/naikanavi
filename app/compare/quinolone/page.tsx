'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'quinolone',
  category: '感染症',
  title: 'キノロン系抗菌薬 比較表',
  description: 'レボフロキサシン・モキシフロキサシン・シプロフロキサシン・シタフロキサシン・ガレノキサシン・トスフロキサシンの6剤を比較。抗菌スペクトラム・QT延長・腱障害。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'レボフロキサシン (LVFX)', brand: 'クラビット', specs: '250mg/500mg', indication: '呼吸器・尿路・皮膚軟部組織感染症', halfLife: '約7-8時間', metabolism: '腎排泄 80%以上（未変化体）', renalAdjust: 'CCr < 50: 減量必須。CCr < 20: さらに減量', features: 'レスピラトリーキノロン。肺炎球菌含むグラム陽性球菌にも良好。結核の代替薬。尿路感染にも有用。日本で最も処方量多い。1日1回', contraindication: '小児・妊婦・授乳婦、てんかん（痙攣閾値低下）、QT延長', evidence: '' },
    { generic: 'モキシフロキサシン (MFLX)', brand: 'アベロックス', specs: '400mg', indication: '呼吸器感染症', halfLife: '約12時間', metabolism: 'グルクロン酸/硫酸抱合。腎排泄は少ない', renalAdjust: '通常不要（肝代謝主体）', features: 'レスピラトリーキノロン。嫌気性菌カバーあり。QT延長リスクがキノロン中最大。尿路には濃度不足で不適。腎機能での調整不要。NTM治療に使用', contraindication: '小児・妊婦、QT延長・低K血症、重篤な肝障害', evidence: '' },
    { generic: 'シプロフロキサシン (CPFX)', brand: 'シプロキサン', specs: '100mg/200mg錠、注', indication: '尿路・腸管・骨関節感染症、炭疽', halfLife: '約4時間', metabolism: 'CYP1A2（一部）、腎排泄 40-50%', renalAdjust: 'CCr < 30: 減量', features: 'グラム陰性桿菌（緑膿菌含む）に最強。緑膿菌をカバーする唯一の経口キノロン。CYP1A2阻害（テオフィリン・ワルファリン注意）。肺炎球菌には弱い', contraindication: '小児・妊婦、テオフィリン併用時注意', evidence: '' },
    { generic: 'シタフロキサシン (STFX)', brand: 'グレースビット', specs: '50mg', indication: '呼吸器・尿路・耳鼻科感染症', halfLife: '約6時間', metabolism: 'グルクロン酸抱合、腎排泄 50%', renalAdjust: '重度腎障害: 減量', features: '広域スペクトラム。嫌気性菌・非定型菌もカバー。LVFXやMFLX耐性菌にも有効な場合あり。1日2回。光線過敏症に注意', contraindication: '小児・妊婦', evidence: '' },
    { generic: 'ガレノキサシン (GRNX)', brand: 'ジェニナック', specs: '200mg', indication: '呼吸器・耳鼻科感染症', halfLife: '約11時間', metabolism: 'グルクロン酸抱合。CYP関与少', renalAdjust: '通常不要', features: 'レスピラトリーキノロン。肺炎球菌を含むグラム陽性球菌に強い。日本発。尿路には不適。1日1回', contraindication: '小児・妊婦', evidence: '' },
    { generic: 'トスフロキサシン (TFLX)', brand: 'オゼックス', specs: '75mg/150mg', indication: '呼吸器・尿路・耳鼻科感染症、小児中耳炎', halfLife: '約6時間', metabolism: 'グルクロン酸抱合、腎排泄', renalAdjust: '重度腎障害: 減量', features: 'キノロン系で唯一小児適応あり（細粒）。小児の急性中耳炎に使用。成人では他のキノロンに比べ使用頻度低い', contraindication: '妊婦', evidence: '' },
  ],
  seoContent: [
    { heading: 'キノロン系の世代と抗菌スペクトラム', text: '第3世代（レスピラトリーキノロン: LVFX・MFLX・GRNX・STFX）はグラム陽性球菌（肺炎球菌含む）への活性が強化され、市中肺炎の経験的治療に使用されます。第2世代（CPFX）はグラム陰性桿菌（緑膿菌含む）に最も強く、尿路感染・腸管感染が主な適応です。' },
    { heading: 'キノロン系の重要な副作用', text: 'QT延長（MFLX > LVFX > CPFX）、腱障害（アキレス腱断裂: ステロイド併用・高齢者でリスク上昇）、痙攣閾値低下（NSAIDs併用で増強）、末梢神経障害、大動脈解離/瘤のリスク上昇が報告されています。FDA/PMDAからも重大な副作用として警告が出されています。' },
    { heading: '結核診療とキノロン', text: 'キノロンは結核菌にも活性があるため、結核が除外されていない肺炎にキノロンを投与すると、一時的に症状が改善して結核の診断が遅れるリスクがあります。肺炎疑いでキノロンを使用する前に、結核の可能性を評価することが重要です。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    'JAID/JSC感染症治療ガイド 2023',
    '日本結核・非結核性抗酸菌症学会. 結核診療ガイドライン',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/cockcroft-gault', name: 'Cockcroft-Gault' },
    { href: '/tools/calc/curb65', name: 'CURB-65' },
    { href: '/compare/cephalosporin', name: 'セフェム系比較' },
  ],
}

export default function QuinoloneComparePage() { return <DrugCompareLayout data={data} /> }
