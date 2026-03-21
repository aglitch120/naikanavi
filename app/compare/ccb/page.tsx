'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'ccb',
  category: '降圧薬',
  title: 'Ca拮抗薬（CCB）比較表',
  description: 'アムロジピン・ニフェジピン・ベニジピン・シルニジピン・アゼルニジピン・ジルチアゼム・ベラパミルの7剤を比較。DHP系 vs 非DHP系・心拍への影響。',
  columns: ['generic', 'brand', 'halfLife', 'features', 'renalAdjust', 'contraindication', 'evidence'],
  drugs: [
    { generic: 'アムロジピン', brand: 'ノルバスク/アムロジン', specs: '2.5mg/5mg/10mg', indication: '高血圧、狭心症', halfLife: '約36時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'DHP系。日本で最も処方されるCCB。超長時間作用で24時間以上の効果持続。反射性頻脈が少ない。配合剤が豊富（ARB/CCB）。浮腫が比較的多い', contraindication: '妊婦（ジヒドロピリジン系共通）', evidence: 'ALLHAT試験、ASCOT-BPLA' },
    { generic: 'ニフェジピン CR', brand: 'アダラート CR', specs: '10mg/20mg/40mg', indication: '高血圧、狭心症', halfLife: '約2時間（CR製剤で12-24時間持続）', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'DHP系。速放型は反射性頻脈のリスク → CR（徐放）を使用。妊娠高血圧にも使用可能（ニフェジピン限定）。末梢血管拡張作用が強い', contraindication: '心原性ショック、急性心筋梗塞', evidence: 'INSIGHT試験' },
    { generic: 'ベニジピン', brand: 'コニール', specs: '2mg/4mg/8mg', indication: '高血圧、狭心症、腎実質性高血圧', halfLife: '約2時間（持続的効果）', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'DHP系。L型+T型+N型チャネルを阻害。糸球体輸出細動脈も拡張 → 腎保護作用。CKD合併高血圧に適する', contraindication: '妊婦', evidence: '' },
    { generic: 'シルニジピン', brand: 'アテレック', specs: '5mg/10mg/20mg', indication: '高血圧', halfLife: '約2.5時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'DHP系。L型+N型チャネルを阻害。交感神経抑制作用 → 反射性頻脈が少ない。蛋白尿減少効果。CKD合併高血圧に適する', contraindication: '妊婦', evidence: '' },
    { generic: 'アゼルニジピン', brand: 'カルブロック', specs: '8mg/16mg', indication: '高血圧', halfLife: '約16-19時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'DHP系。緩徐な作用発現で反射性頻脈が少ない。心拍数をほとんど上げない。浮腫が比較的少ない。ARBとの配合剤あり', contraindication: '妊婦', evidence: '' },
    { generic: 'ジルチアゼム', brand: 'ヘルベッサー', specs: '30mg/60mg錠、Rカプセル100mg/200mg', indication: '高血圧、狭心症、上室性不整脈', halfLife: '約4-6時間（R製剤で持続）', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: '非DHP系（ベンゾチアゼピン系）。心拍数低下作用あり → 狭心症に有用。房室伝導抑制。PSVTの停止（IV）。β遮断薬との併用は徐脈リスク', contraindication: '2度以上の房室ブロック、SSS、重篤な心不全', evidence: '' },
    { generic: 'ベラパミル', brand: 'ワソラン', specs: '40mg', indication: '上室性不整脈、狭心症、高血圧', halfLife: '約6-8時間', metabolism: 'CYP3A4/1A2/2C', renalAdjust: '通常不要', features: '非DHP系（フェニルアルキルアミン系）。心拍数低下作用が最も強い。PSVT停止の第一選択（IV）。陰性変力作用 → 心不全には注意。便秘が多い', contraindication: '2度以上の房室ブロック、SSS、重篤な心不全、WPW＋AF', evidence: '' },
  ],
  seoContent: [
    { heading: 'DHP系 vs 非DHP系の違い', text: 'Ca拮抗薬はジヒドロピリジン（DHP）系と非DHP系（ジルチアゼム・ベラパミル）に大別されます。DHP系は血管選択性が高く降圧効果が強い一方、反射性頻脈を起こしうります。非DHP系は心筋・伝導系への作用が強く、心拍数低下・房室伝導抑制作用があり、頻脈性不整脈にも使用されます。' },
    { heading: 'CKD合併高血圧での選択', text: '通常のDHP系CCBは輸入細動脈を選択的に拡張し、糸球体内圧が上昇して蛋白尿を悪化させる可能性があります。ベニジピン・シルニジピンはT型/N型チャネルも阻害し、輸出細動脈も拡張するため糸球体内圧の上昇が抑えられ、CKD合併例に適しています。' },
    { heading: '反射性頻脈の回避', text: '速放型ニフェジピン等による急激な降圧は反射性頻脈を誘発し、心筋酸素需要を増加させます。長時間作用型（アムロジピン・アダラートCR・アゼルニジピン）やN型チャネル阻害作用を持つシルニジピンを選択することで、この問題を軽減できます。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本高血圧学会. 高血圧治療ガイドライン 2019（JSH2019）',
    'ALLHAT Officers. Major outcomes in high-risk hypertensive patients. JAMA 2002;288:2981-2997',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/compare/arb', name: 'ARB比較' },
    { href: '/compare/beta-blocker', name: 'β遮断薬比較' },
  ],
}

export default function CCBComparePage() { return <DrugCompareLayout data={data} /> }
