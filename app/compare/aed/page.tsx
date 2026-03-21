'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'aed',
  category: '精神・神経',
  title: '抗てんかん薬 比較表',
  description: 'レベチラセタム・バルプロ酸・カルバマゼピン・ラモトリギン・ラコサミド・フェニトインの6剤を比較。発作型別選択・TDM・催奇形性・薬物相互作用。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'レベチラセタム (LEV)', brand: 'イーケプラ', specs: '250mg/500mg錠、DS、注', indication: '部分発作、全般発作（ミオクロニー・強直間代）、てんかん重積（注射）', halfLife: '約7時間', metabolism: '血中加水分解（CYP非依存）、腎排泄 66%', renalAdjust: 'CCr < 50: 減量。透析: 補充投与', features: '新世代AEDの第一選択。CYP非依存で薬物相互作用が極めて少ない。注射剤あり（急性期に有用）。広域スペクトラム。TDM通常不要。易怒性・攻撃性の副作用（特に知的障害合併例）', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'バルプロ酸 (VPA)', brand: 'デパケン/セレニカ', specs: '100mg/200mg錠、R錠、シロップ', indication: '全般てんかん（欠神・ミオクロニー・強直間代）、部分発作、躁状態、片頭痛予防', halfLife: '約8-15時間', metabolism: 'グルクロン酸抱合、β酸化、CYP2C9', renalAdjust: '通常不要（肝代謝主体）', features: '全般てんかんの第一選択（特に欠神発作・JME）。広域スペクトラム。TDM対象（目標 50-100 μg/mL）。催奇形性リスク最高（妊娠可能女性には原則避ける）。高アンモニア血症・血小板減少・肝障害に注意', contraindication: '重篤な肝障害、尿素サイクル異常症、妊婦（特に第1三半期）', evidence: '' },
    { generic: 'カルバマゼピン (CBZ)', brand: 'テグレトール', specs: '100mg/200mg錠', indication: '部分発作、全般強直間代発作、三叉神経痛、躁状態', halfLife: '約12-17時間（自己誘導後短縮）', metabolism: 'CYP3A4 → エポキシド（活性代謝物）。強力なCYP誘導薬', renalAdjust: '通常不要', features: '部分発作の古典的第一選択。CYP3A4の強力な誘導薬 → 多数の薬物相互作用（経口避妊薬・ワルファリン・免疫抑制薬等の効果減弱）。TDM対象（4-12 μg/mL）。SJS/TEN（HLA-A*3101関連）。低Na血症（SIADH）', contraindication: '房室ブロック、急性間欠性ポルフィリア', evidence: '' },
    { generic: 'ラモトリギン (LTG)', brand: 'ラミクタール', specs: '2mg/5mg/25mg/100mg', indication: '部分発作、全般発作、双極性障害（うつ相の維持療法）', halfLife: '約25-33時間（VPA併用で70時間に延長）', metabolism: 'グルクロン酸抱合（UGT1A4）', renalAdjust: '重度腎障害: 減量', features: '広域スペクトラム。妊娠可能女性に比較的安全（催奇形性リスク低い）。VPA併用で半減期が倍増 → 減量必須。SJS/TEN のリスク（漸増スケジュール厳守）。双極性障害の維持療法にも', contraindication: '特になし（過敏症のみ）', evidence: '' },
    { generic: 'ラコサミド (LCM)', brand: 'ビムパット', specs: '50mg/100mg錠、注', indication: '部分発作', halfLife: '約13時間', metabolism: 'CYP2C19（一部）、腎排泄 40%', renalAdjust: '重度腎障害・透析: 減量', features: 'Na+チャネルの緩徐不活性化を選択的に増強。CYP関与が少なく相互作用少。注射剤あり。PR間隔延長 → 心伝導障害に注意。TDM通常不要', contraindication: '2度以上の房室ブロック', evidence: '' },
    { generic: 'フェニトイン (PHT)', brand: 'アレビアチン/ヒダントール', specs: '25mg/100mg錠、散、注', indication: '部分発作、全般強直間代発作、てんかん重積', halfLife: '約7-42時間（非線形動態: 用量依存で延長）', metabolism: 'CYP2C9/2C19（飽和動態）', renalAdjust: '低Alb: 遊離型上昇 → 実効濃度に注意', features: '古典的AED。非線形薬物動態（少量の増量で血中濃度急上昇 → 中毒域に入りやすい）。TDM必須（10-20 μg/mL）。CYP誘導薬。歯肉増殖・多毛・骨軟化症・小脳萎縮。ホスフェニトイン（注射）はてんかん重積に使用', contraindication: '洞性徐脈、房室ブロック、Adams-Stokes症候群', evidence: '' },
  ],
  seoContent: [
    { heading: '発作型別の薬剤選択', text: '部分発作にはレベチラセタム・カルバマゼピン・ラモトリギン・ラコサミドが第一選択です。全般てんかん（特に欠神・JME）にはバルプロ酸・レベチラセタム・ラモトリギンが有効です。CBZは欠神発作・ミオクロニー発作を悪化させる可能性があるため、全般てんかんには不適切です。' },
    { heading: '妊娠可能女性への配慮', text: 'バルプロ酸は催奇形性リスク（神経管閉鎖障害等）が最も高く、妊娠可能女性には原則使用を避けます。ラモトリギン・レベチラセタムは催奇形性リスクが比較的低いとされ、妊娠を考慮する女性にとされています。いずれも葉酸補充（妊娠前から）が重要です。' },
    { heading: 'TDM（治療薬物モニタリング）', text: 'フェニトイン（非線形動態）、バルプロ酸、カルバマゼピンはTDMが示されます。フェニトインは低アルブミン血症・腎不全時に遊離型が上昇するため、総濃度の補正（Sheiner-Tozer式）または遊離型測定が必要です。レベチラセタム・ラコサミドは通常TDM不要です。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本神経学会. てんかん診療ガイドライン 2018',
    'Tomson T et al. Antiepileptic drugs and pregnancy outcomes. Lancet Neurol 2019',
  ],
  relatedTools: [
    { href: '/tools/calc/gcs', name: 'GCS' },
    { href: '/compare/bzd', name: 'ベンゾジアゼピン比較' },
  ],
}

export default function AEDComparePage() { return <DrugCompareLayout data={data} /> }
