'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'beta-blocker',
  category: '降圧薬・心不全治療薬',
  title: 'β遮断薬 比較表',
  description: 'ビソプロロール・カルベジロール・メトプロロール・アテノロール・プロプラノロール・ネビボロール・ランジオロールの7剤を比較。β1選択性・ISA・心不全適応。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'ビソプロロール', brand: 'メインテート', specs: '0.625mg/2.5mg/5mg', indication: '高血圧、狭心症、心不全、AF心拍数コントロール', halfLife: '約9-12時間', metabolism: '肝代謝 50% + 腎排泄 50%', renalAdjust: '重度腎障害: 慎重投与', features: 'β1高選択性。ISA(-)。慢性心不全（HFrEF）に適応あり。AF心拍数コントロールにも使用。0.625mgから超低用量で開始可能', contraindication: '高度徐脈、2度以上AVB、SSS、心原性ショック、褐色細胞腫（未治療）、喘息', evidence: 'CIBIS-II試験（心不全）' },
    { generic: 'カルベジロール', brand: 'アーチスト', specs: '1.25mg/2.5mg/10mg/20mg', indication: '高血圧、狭心症、心不全', halfLife: '約7-10時間', metabolism: 'CYP2D6/2C9/1A2（肝代謝主体）', renalAdjust: '通常不要（肝代謝主体）', features: 'αβ遮断薬（α1 + β1 + β2遮断）。ISA(-)。慢性心不全に適応あり。血管拡張作用（α1遮断）で末梢循環改善。糖代謝への悪影響が少ない', contraindication: '気管支喘息、高度徐脈、2度以上AVB、心原性ショック', evidence: 'COPERNICUS試験、COMET試験（心不全）' },
    { generic: 'メトプロロール', brand: 'セロケン/ロプレソール', specs: '20mg/40mg', indication: '高血圧、狭心症、頻脈性不整脈', halfLife: '約3-4時間', metabolism: 'CYP2D6（肝代謝主体）', renalAdjust: '通常不要（肝代謝主体）', features: 'β1選択性。ISA(-)。徐放剤（海外）は心不全に適応。CYP2D6 PMでは血中濃度上昇。IV製剤あり（頻脈性不整脈の急性期）', contraindication: '気管支喘息、高度徐脈、2度以上AVB、心原性ショック', evidence: 'MERIT-HF試験（心不全、徐放剤）' },
    { generic: 'アテノロール', brand: 'テノーミン', specs: '25mg/50mg', indication: '高血圧、狭心症、不整脈', halfLife: '約6-7時間', metabolism: '腎排泄主体（肝代謝ほぼなし）', renalAdjust: 'CCr 15-35: 減量。CCr < 15: さらに減量', features: 'β1選択性。ISA(-)。水溶性で中枢移行が少ない（悪夢等の中枢性副作用が少ない）。腎排泄型なので腎機能に応じた用量調整必要', contraindication: '気管支喘息、高度徐脈、2度以上AVB、心原性ショック', evidence: 'LIFE試験（ロサルタンに劣性、脳卒中予防）' },
    { generic: 'プロプラノロール', brand: 'インデラル', specs: '10mg/20mg', indication: '高血圧、狭心症、不整脈、片頭痛予防、甲状腺中毒症', halfLife: '約3-6時間', metabolism: 'CYP2D6/1A2（肝代謝、初回通過効果大）', renalAdjust: '通常不要（肝代謝主体）', features: '非選択的β遮断薬（β1+β2）。ISA(-)。適応が最も広い。片頭痛予防・本態性振戦・甲状腺中毒症にも使用。脂溶性で中枢移行性あり（悪夢の副作用）', contraindication: '気管支喘息・COPD（β2遮断で気管支収縮）、高度徐脈、2度以上AVB', evidence: '' },
    { generic: 'セリプロロール', brand: 'セレクトール', specs: '100mg/200mg', indication: '高血圧、狭心症', halfLife: '約5時間', metabolism: '肝代謝 + 腎排泄', renalAdjust: '重度腎障害: 慎重投与', features: 'β1選択性 + β2刺激作用（ISA+）。気管支拡張作用があり、軽度〜中等度の閉塞性肺疾患でも使用可能（喘息は除く）。末梢血管拡張', contraindication: '高度徐脈、2度以上AVB、重篤な心不全', evidence: '' },
    { generic: 'ランジオロール', brand: 'オノアクト', specs: '注射剤', indication: '周術期頻脈、AF/AFL心拍数コントロール', halfLife: '約4分', metabolism: 'エステラーゼによる加水分解（超短時間作用）', renalAdjust: '不要（血中で分解）', features: '超短時間作用型（半減期4分）。β1高選択性。注射剤のみ。周術期頻脈・AF/AFLの急性期心拍数コントロールに使用。効果の微調整が可能', contraindication: '心原性ショック、高度徐脈、2度以上AVB', evidence: '' },
  ],
  seoContent: [
    { heading: 'β遮断薬の心不全における役割', text: 'β遮断薬は慢性心不全（HFrEF）の予後改善が大規模試験で証明されている3剤があります: ビソプロロール（CIBIS-II）、カルベジロール（COPERNICUS）、メトプロロール徐放剤（MERIT-HF）。日本で心不全適応があるのはビソプロロールとカルベジロールです。極低用量から開始し、忍容性を確認しながら漸増します。' },
    { heading: 'β1選択性と喘息・COPD', text: '非選択的β遮断薬（プロプラノロール）はβ2遮断により気管支収縮を起こすため、喘息・重症COPDには禁忌です。β1選択性の高い薬剤（ビソプロロール）でも高用量では選択性が低下するため、喘息患者には原則使用を避けます。セリプロロールはβ2刺激作用を持ち、例外的に軽度閉塞性肺疾患で使用可能です。' },
    { heading: 'ISA（内因性交感神経刺激作用）の臨床的意義', text: 'ISAを持つβ遮断薬は安静時の心拍数を過度に低下させにくい利点がありますが、心不全・心筋梗塞後の予後改善効果が証明されていません。現在、心不全・虚血性心疾患にはISA(-)の薬剤が示されています。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本循環器学会. 急性・慢性心不全診療ガイドライン 2021',
    'CIBIS-II Investigators. Lancet 1999;353:9-13',
    'Packer M et al. Carvedilol (COPERNICUS). N Engl J Med 2001;344:1651-1658',
  ],
  relatedTools: [
    { href: '/tools/calc/qtc-calculator', name: 'QTc計算' },
    { href: '/compare/ccb', name: 'Ca拮抗薬比較' },
    { href: '/compare/arb', name: 'ARB比較' },
  ],
}

export default function BetaBlockerComparePage() { return <DrugCompareLayout data={data} /> }
