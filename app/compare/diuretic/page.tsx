'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'diuretic',
  category: '降圧薬・心不全治療薬',
  title: '利尿薬 比較表',
  description: 'フロセミド・トルバプタン・スピロノラクトン・エプレレノン・トリクロルメチアジド・インダパミド・アゾセミドの7剤を比較。作用部位・K保持性・心不全/肝硬変での使い分け。',
  columns: ['generic', 'brand', 'halfLife', 'features', 'renalAdjust', 'contraindication', 'evidence'],
  drugs: [
    { generic: 'フロセミド', brand: 'ラシックス', specs: '10mg/20mg/40mg錠/注', indication: '浮腫（心・腎・肝性）、高血圧', halfLife: '約0.5-1時間', metabolism: 'グルクロン酸抱合、腎排泄', renalAdjust: '腎障害でも使用可（高用量必要な場合あり）', features: 'ループ利尿薬。ヘンレ上行脚のNKCC2阻害。最も強力な利尿作用。注射剤あり（急性肺水腫）。低K・低Na・高尿酸・代謝性アルカローシスに注意。作用時間が短い', contraindication: '無尿、肝性昏睡、体液中のNa/K著明低下', evidence: '' },
    { generic: 'アゾセミド', brand: 'ダイアート', specs: '30mg/60mg', indication: '浮腫', halfLife: '約2.5-3.5時間', metabolism: '肝代謝', renalAdjust: '腎障害でも使用可', features: 'ループ利尿薬。フロセミドより作用が緩徐で持続的。電解質異常が少ない。1日1回。RAA系活性化が少ない', contraindication: '無尿、肝性昏睡、体液中のNa/K著明低下', evidence: '' },
    { generic: 'トリクロルメチアジド', brand: 'フルイトラン', specs: '1mg/2mg', indication: '高血圧、浮腫', halfLife: '約3.5時間（作用持続12-24時間）', metabolism: '腎排泄主体', renalAdjust: 'GFR < 30: 効果減弱（ループ利尿薬に変更）', features: 'サイアザイド系。遠位尿細管のNCC阻害。降圧効果が確立。低K・低Na・高尿酸・高Ca・耐糖能悪化に注意。少量で降圧効果あり', contraindication: '無尿、急性腎不全、体液中のNa/K著明低下', evidence: 'ALLHAT試験（クロルタリドン）' },
    { generic: 'インダパミド', brand: 'ナトリックス/テナキシル', specs: '1mg/2mg', indication: '高血圧', halfLife: '約18時間', metabolism: 'CYP3A4', renalAdjust: '重度腎障害: 効果減弱', features: 'サイアザイド類似薬。降圧効果が強く持続的。血管拡張作用もあり。電解質異常がサイアザイドよりやや少ない。脳卒中予防のエビデンス（PROGRESS試験、ペリンドプリル併用）', contraindication: '無尿、急性腎不全', evidence: 'PROGRESS試験、HYVET試験（高齢者高血圧）' },
    { generic: 'スピロノラクトン', brand: 'アルダクトンA', specs: '25mg/50mg', indication: '浮腫（心・肝・腎性）、高血圧、原発性アルドステロン症', halfLife: '約1.4時間（活性代謝物16-22時間）', metabolism: '肝代謝 → カンレノン（活性代謝物）', renalAdjust: 'K > 5.0 or GFR < 30: 禁忌に近い', features: 'MRA（鉱質コルチコイド受容体拮抗薬）。K保持性。HFrEFの予後改善（RALES）。肝硬変腹水の第一選択（フロセミドと併用）。女性化乳房・月経不順の副作用（抗アンドロゲン作用）。高K血症に注意', contraindication: '高K血症、無尿、急性腎不全、アジソン病', evidence: 'RALES試験（心不全）' },
    { generic: 'エプレレノン', brand: 'セララ/インスプラ', specs: '25mg/50mg/100mg', indication: '高血圧、慢性心不全', halfLife: '約4-6時間', metabolism: 'CYP3A4', renalAdjust: 'GFR < 30: 禁忌。K > 5.0: 禁忌', features: 'MRA。選択的MR拮抗（スピロノラクトンより選択的 → 女性化乳房が少ない）。心不全の適応あり。高K血症に注意。K定期モニタリング必須', contraindication: '高K血症、重度腎障害、K保持性利尿薬併用', evidence: 'EPHESUS・EMPHASIS-HF試験' },
    { generic: 'トルバプタン', brand: 'サムスカ', specs: '7.5mg/15mg/30mg', indication: '心不全・肝硬変の体液貯留、SIADH、PKD', halfLife: '約8時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'バソプレシンV2受容体拮抗薬。水利尿薬（電解質を排泄せず自由水のみ排出）。低Na血症の改善。口渇→飲水制限しない。急激なNa補正に注意（浸透圧性脱髄）。入院下で開始', contraindication: '口渇を感じない/水分摂取困難、高Na血症、CYP3A4強力阻害薬併用', evidence: 'EVEREST試験' },
  ],
  seoContent: [
    { heading: '利尿薬の作用部位別分類', text: '利尿薬は作用部位により、ループ利尿薬（ヘンレ上行脚: フロセミド・アゾセミド）、サイアザイド系（遠位尿細管: トリクロルメチアジド・インダパミド）、MRA（集合管: スピロノラクトン・エプレレノン）、V2受容体拮抗薬（集合管: トルバプタン）に分類されます。利尿効力はループ > サイアザイド > MRAの順です。' },
    { heading: '心不全での利尿薬選択', text: 'うっ血解除にはループ利尿薬（フロセミド）が第一選択です。HFrEFの予後改善にはMRA（スピロノラクトン/エプレレノン）がACE-I/ARB + β遮断薬に追加でとされています。トルバプタンは低Na血症を伴う心不全に有用です。' },
    { heading: '肝硬変腹水での利尿薬', text: '肝硬変腹水にはスピロノラクトン（100mg/日）を基本とし、効果不十分ならフロセミドを追加します。トルバプタンは低Na血症の改善に有用です。利尿薬過剰は腎前性腎不全・肝腎症候群を誘発するため、体重減少速度をモニタリングします。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本循環器学会. 急性・慢性心不全診療ガイドライン 2021',
    'Pitt B et al. Spironolactone (RALES). N Engl J Med 1999;341:709-717',
    'Zannad F et al. Eplerenone (EMPHASIS-HF). N Engl J Med 2011;364:11-21',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/corrected-na', name: 'Na補正' },
    { href: '/compare/arb', name: 'ARB比較' },
    { href: '/compare/beta-blocker', name: 'β遮断薬比較' },
  ],
}

export default function DiureticComparePage() { return <DrugCompareLayout data={data} /> }
