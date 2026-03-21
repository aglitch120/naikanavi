'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'bzd',
  category: '精神・神経',
  title: 'ベンゾジアゼピン系薬 比較表',
  description: 'ロラゼパム・アルプラゾラム・ジアゼパム・クロナゼパム・ニトラゼパム・エチゾラムの6剤を比較。半減期による分類・等価換算・高齢者での注意。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'ロラゼパム', brand: 'ワイパックス', specs: '0.5mg/1mg', indication: '不安障害、不眠、てんかん重積（注射）', halfLife: '約12時間', metabolism: 'グルクロン酸抱合（CYP非依存）', renalAdjust: '通常不要', features: '中間型。CYP非依存で肝障害・高齢者に使いやすい。活性代謝物なし。注射剤はてんかん重積の第一選択。等価換算: ジアゼパム5mg ≈ ロラゼパム1mg', contraindication: '急性閉塞隅角緑内障、重症筋無力症', evidence: '' },
    { generic: 'アルプラゾラム', brand: 'コンスタン/ソラナックス', specs: '0.4mg/0.8mg', indication: '不安障害、パニック障害', halfLife: '約14時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: '中間型。パニック障害に頻用。トリアゾロ環（抗うつ作用も）。離脱症状がやや強い。CYP3A4阻害薬で血中濃度上昇。等価換算: ジアゼパム5mg ≈ アルプラゾラム0.4mg', contraindication: '急性閉塞隅角緑内障、重症筋無力症', evidence: '' },
    { generic: 'ジアゼパム', brand: 'セルシン/ホリゾン', specs: '2mg/5mg/10mg錠、注', indication: '不安・緊張、けいれん、筋弛緩', halfLife: '約20-70時間（活性代謝物含め200時間超）', metabolism: 'CYP3A4/2C19 → 活性代謝物（デスメチルジアゼパム）', renalAdjust: '通常不要', features: '長時間型。基準薬（等価換算の基準）。注射剤あり（けいれん・興奮の急性期）。活性代謝物の蓄積に注意（高齢者で持ち越し効果）。筋弛緩作用が強い', contraindication: '急性閉塞隅角緑内障、重症筋無力症', evidence: '' },
    { generic: 'クロナゼパム', brand: 'リボトリール/ランドセン', specs: '0.5mg/1mg/2mg', indication: 'てんかん、パニック障害', halfLife: '約18-50時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: '長時間型。抗てんかん薬として確立。パニック障害にも使用。REM睡眠行動障害にも有効。等価換算: ジアゼパム5mg ≈ クロナゼパム0.25mg（力価が高い）', contraindication: '急性閉塞隅角緑内障、重症筋無力症', evidence: '' },
    { generic: 'ニトラゼパム', brand: 'ベンザリン/ネルボン', specs: '5mg/10mg', indication: '不眠症、てんかん', halfLife: '約27時間', metabolism: 'ニトロ還元 → アセチル化', renalAdjust: '通常不要', features: '長時間型。主に催眠目的。中途覚醒・早朝覚醒に対応。翌日への持ち越しに注意。等価換算: ジアゼパム5mg ≈ ニトラゼパム5mg', contraindication: '急性閉塞隅角緑内障、重症筋無力症', evidence: '' },
    { generic: 'エチゾラム', brand: 'デパス', specs: '0.25mg/0.5mg/1mg', indication: '不安・緊張、抑うつ、不眠、筋緊張', halfLife: '約6時間', metabolism: '肝代謝（CYP2C/3A）', renalAdjust: '通常不要', features: 'チエノジアゼピン系（BZD骨格ではないが同等の作用）。短時間型。依存性が高い（短半減期＋強い効果で依存形成しやすい）。2016年に向精神薬指定。等価換算: ジアゼパム5mg ≈ エチゾラム1.5mg', contraindication: '急性閉塞隅角緑内障、重症筋無力症', evidence: '' },
  ],
  seoContent: [
    { heading: 'BZDの半減期と使い分け', text: 'BZDは半減期により超短時間型（〜6時間: エチゾラム）、短時間型（6-12時間）、中間型（12-24時間: ロラゼパム・アルプラゾラム）、長時間型（24時間超: ジアゼパム・クロナゼパム）に分類されます。不安障害には中間〜長時間型、不眠の入眠障害には短時間型が選択されやすいですが、いずれも短期使用が原則です。' },
    { heading: '高齢者とBZD', text: '高齢者ではBZDによる転倒・骨折・せん妄・認知機能低下のリスクが問題です。使用する場合はロラゼパム（CYP非依存・活性代謝物なし）が相対的に安全とされますが、非BZD系の代替薬を優先すべきです。Beers criteria・STOPPでも高齢者へのBZD長期使用は不適切とされています。' },
    { heading: 'BZDの離脱と漸減', text: '4週間以上の連用で身体的依存が形成されます。急な中止は離脱症候群（不安・不眠・振戦・けいれん）を引き起こすため、数週間〜数ヶ月かけて漸減します。短半減期薬（エチゾラム・アルプラゾラム）は離脱症状が強い傾向があり、長半減期薬（ジアゼパム）への置換後に漸減する方法もあります。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '厚生労働科学研究班. 高齢者の安全な薬物療法ガイドライン 2015',
    '日本睡眠学会. 睡眠薬の適正使用・休薬ガイドライン 2014',
  ],
  relatedTools: [
    { href: '/tools/calc/cam-icu', name: 'CAM-ICU' },
    { href: '/tools/calc/gad7', name: 'GAD-7' },
    { href: '/compare/hypnotic', name: '睡眠薬比較' },
    { href: '/compare/ssri-snri', name: 'SSRI/SNRI比較' },
  ],
}

export default function BZDComparePage() { return <DrugCompareLayout data={data} /> }
