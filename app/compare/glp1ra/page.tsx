'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'glp1ra',
  category: '糖尿病治療薬',
  title: 'GLP-1受容体作動薬 比較表',
  description: 'リラグルチド・セマグルチド（注/経口）・デュラグルチド・リキシセナチド・エキセナチドの6製剤を比較。投与頻度・心血管/腎保護・体重減少効果。',
  columns: ['generic', 'brand', 'halfLife', 'features', 'renalAdjust', 'contraindication', 'evidence'],
  drugs: [
    { generic: 'リラグルチド', brand: 'ビクトーザ', specs: '皮下注', indication: '2型糖尿病', halfLife: '約13時間', metabolism: 'DPP-4による分解＋内因性代謝', renalAdjust: '透析: 経験限られるため慎重', features: '1日1回皮下注。ヒトGLP-1に脂肪酸鎖を付加（アルブミン結合で長時間化）。心血管アウトカム改善。体重減少効果あり。悪心が最も多い副作用（漸増で軽減）', contraindication: '甲状腺髄様癌の既往/家族歴、MEN2型', evidence: 'LEADER試験（心血管アウトカム）' },
    { generic: 'セマグルチド（注射）', brand: 'オゼンピック', specs: '皮下注', indication: '2型糖尿病', halfLife: '約7日', metabolism: 'タンパク分解＋β酸化', renalAdjust: '重度腎障害: 慎重投与', features: '週1回皮下注。HbA1c低下・体重減少がGLP-1RA中最強クラス。心血管アウトカム改善。高用量（ウゴービ）は肥満症に適応。悪心・嘔吐に注意', contraindication: '甲状腺髄様癌の既往/家族歴、MEN2型', evidence: 'SUSTAIN 6、SELECT試験（心血管）' },
    { generic: 'セマグルチド（経口）', brand: 'リベルサス', specs: '3mg/7mg/14mg錠', indication: '2型糖尿病', halfLife: '約7日', metabolism: 'タンパク分解＋β酸化', renalAdjust: '重度腎障害: 慎重投与', features: '世界初の経口GLP-1RA。SNAC（吸収促進剤）配合。空腹時＋少量の水で服用し30分間飲食禁止。利便性は高いが服薬条件が厳しい。注射剤とほぼ同等の効果', contraindication: '甲状腺髄様癌の既往/家族歴、MEN2型', evidence: 'PIONEER試験シリーズ' },
    { generic: 'デュラグルチド', brand: 'トルリシティ', specs: '皮下注アテオス', indication: '2型糖尿病', halfLife: '約5日', metabolism: '一般的なタンパク分解経路', renalAdjust: '重度腎障害: 慎重投与', features: '週1回皮下注。オートインジェクター（アテオス）で自己注射が簡便。心血管アウトカム改善。体重減少効果はセマグルチドよりやや弱い', contraindication: '甲状腺髄様癌の既往/家族歴、MEN2型', evidence: 'REWIND試験（心血管アウトカム）' },
    { generic: 'リキシセナチド', brand: 'リキスミア', specs: '皮下注', indication: '2型糖尿病', halfLife: '約2-3時間', metabolism: 'タンパク分解', renalAdjust: '重度腎障害: 慎重投与', features: '1日1回皮下注。短時間作用型。食後血糖低下に強い。インスリンとの配合剤（ソリクア: リキシセナチド＋インスリングラルギン）あり。心血管への中立性', contraindication: '甲状腺髄様癌の既往/家族歴', evidence: 'ELIXA試験（心血管中立性）' },
    { generic: 'エキセナチド', brand: 'バイエッタ/ビデュリオン', specs: '皮下注', indication: '2型糖尿病', halfLife: '約2.4時間（徐放製剤は数週間）', metabolism: '腎排泄（GFR依存）', renalAdjust: 'CCr < 30: 使用注意', features: '1日2回（バイエッタ）or 週1回（ビデュリオン・徐放）。世界初のGLP-1RA。腎排泄型なので腎機能低下例は注意。注射部位結節（徐放剤）', contraindication: '重篤な腎障害、甲状腺髄様癌の既往/家族歴', evidence: 'EXSCEL試験' },
  ],
  seoContent: [
    { heading: 'GLP-1RAの心血管・体重への効果', text: 'GLP-1RAの大規模試験で心血管アウトカム改善が示されたのはリラグルチド（LEADER）、セマグルチド注射（SUSTAIN 6）、デュラグルチド（REWIND）です。体重減少効果はセマグルチドが最も強力で、高用量（2.4mg: ウゴービ）は肥満症治療薬としても承認されています。' },
    { heading: '注射 vs 経口', text: '経口セマグルチド（リベルサス）は注射回避ができる利点がありますが、空腹時に少量の水で服用し30分間飲食禁止という厳しい服薬条件があります。アドヒアランスが保てる患者には良い選択ですが、条件を守れない場合は効果が減弱します。' },
    { heading: 'インスリンとの併用・配合剤', text: 'GLP-1RAとインスリンの併用は、血糖改善と体重増加抑制の両立が期待できます。配合剤（ソリクア: リキシセナチド＋グラルギン、ゾルトファイ: セマグルチド＋デグルデク）は注射回数の減少でアドヒアランス向上に寄与します。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本糖尿病学会. 糖尿病治療ガイド 2024-2025',
    'Marso SP et al. Liraglutide (LEADER). N Engl J Med 2016;375:311-322',
    'Gerstein HC et al. Dulaglutide (REWIND). Lancet 2019;394:121-130',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/compare/sglt2i', name: 'SGLT2阻害薬比較' },
    { href: '/compare/dpp4i', name: 'DPP-4阻害薬比較' },
  ],
}

export default function GLP1RAComparePage() { return <DrugCompareLayout data={data} /> }
