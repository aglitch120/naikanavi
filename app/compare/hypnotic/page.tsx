'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'hypnotic',
  category: '精神・神経',
  title: '睡眠薬 比較表',
  description: 'ゾルピデム・エスゾピクロン・スボレキサント・レンボレキサント・ラメルテオン・トリアゾラム・ニトラゼパムの7剤を比較。作用機序別分類・依存性・高齢者での使い方。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'ゾルピデム', brand: 'マイスリー', specs: '5mg/10mg', indication: '不眠症（入眠障害）', halfLife: '約2時間', metabolism: 'CYP3A4（主）/2C9/1A2', renalAdjust: '肝障害: 減量', features: '非BZD系（Z-drug）。超短時間作用型。入眠障害に最適。GABA-A受容体α1サブユニット選択的 → 筋弛緩・抗不安が少ない。せん妄惹起リスクあり。依存性は低いが長期使用は避ける', contraindication: '重篤な肝障害、重症筋無力症、急性閉塞隅角緑内障', evidence: '' },
    { generic: 'エスゾピクロン', brand: 'ルネスタ', specs: '1mg/2mg/3mg', indication: '不眠症', halfLife: '約5時間', metabolism: 'CYP3A4/2E1', renalAdjust: '重度肝障害: 減量。高齢者: 減量', features: '非BZD系（Z-drug）。入眠＋中途覚醒に対応。苦味の副作用あり（味覚異常）。長期使用試験のデータあり。ゾピクロンのS体', contraindication: '重篤な肝障害、重症筋無力症', evidence: '' },
    { generic: 'スボレキサント', brand: 'ベルソムラ', specs: '10mg/15mg/20mg', indication: '不眠症', halfLife: '約12時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'オレキシン受容体拮抗薬（DORA）。覚醒システムを抑制（GABAを介さない）。依存性・耐性が極めて少ない。筋弛緩なし。高齢者に使いやすい。CYP3A4強力阻害薬とは併用禁忌', contraindication: 'CYP3A4強力阻害薬（イトラコナゾール等）併用', evidence: '' },
    { generic: 'レンボレキサント', brand: 'デエビゴ', specs: '2.5mg/5mg/10mg', indication: '不眠症', halfLife: '約31-50時間', metabolism: 'CYP3A4（主）', renalAdjust: '重度肝障害: 注意', features: 'オレキシン受容体拮抗薬（DORA）。スボレキサントより入眠効果が強いとのデータ。依存性なし。翌日への持ち越しに注意（半減期長い）。2.5mgから開始可能', contraindication: '重度肝障害', evidence: 'SUNRISE試験（高齢者でのエビデンス）' },
    { generic: 'ラメルテオン', brand: 'ロゼレム', specs: '8mg', indication: '不眠症（入眠困難）', halfLife: '約1-2時間', metabolism: 'CYP1A2（主）/2C/3A4', renalAdjust: '通常不要', features: 'メラトニン受容体作動薬（MT1/MT2）。概日リズムを調整。依存性・耐性なし。向精神薬に該当しない。筋弛緩なし。効果発現にやや時間がかかる（1-2週間）。フルボキサミン併用禁忌（CYP1A2阻害）', contraindication: 'フルボキサミン併用、重篤な肝障害', evidence: '' },
    { generic: 'トリアゾラム', brand: 'ハルシオン', specs: '0.125mg/0.25mg', indication: '不眠症（入眠障害）', halfLife: '約2-4時間', metabolism: 'CYP3A4', renalAdjust: '肝障害: 減量', features: 'BZD系超短時間作用型。入眠効果は強力。依存性・反跳性不眠のリスクが最も高い。前向性健忘の副作用。CYP3A4阻害薬（アゾール系等）で血中濃度著明上昇。高齢者・せん妄リスク高', contraindication: 'アゾール系抗真菌薬・HIV-PI併用、重症筋無力症、急性閉塞隅角緑内障', evidence: '' },
    { generic: 'ニトラゼパム', brand: 'ベンザリン/ネルボン', specs: '5mg/10mg', indication: '不眠症、てんかん', halfLife: '約27時間', metabolism: 'ニトロ還元 → アセチル化', renalAdjust: '通常不要', features: 'BZD系中〜長時間作用型。中途覚醒・早朝覚醒に対応。半減期が長く翌日への持ち越し（日中眠気・ふらつき）に注意。てんかん適応あり。高齢者での転倒リスク', contraindication: '重症筋無力症、急性閉塞隅角緑内障', evidence: '' },
  ],
  seoContent: [
    { heading: '睡眠薬の作用機序別分類', text: '現在の睡眠薬は4つの作用機序に分類されます。BZD系/非BZD系（GABA-A受容体作動）、オレキシン受容体拮抗薬（DORA: スボレキサント・レンボレキサント）、メラトニン受容体作動薬（ラメルテオン）です。近年は依存性の少ないDORA・メラトニン系が第一選択として示されている傾向にあります。' },
    { heading: '高齢者の不眠治療', text: '高齢者ではBZD系睡眠薬による転倒・骨折・せん妄・認知機能低下のリスクが問題です。ガイドラインではオレキシン受容体拮抗薬またはラメルテオンを第一選択とし、BZD系は極力避けることが示されています。やむを得ず使用する場合は超短時間作用型を短期間に限定します。' },
    { heading: 'せん妄と睡眠薬', text: 'BZD系・Z-drugはせん妄惹起のリスク因子です。入院患者のせん妄予防にはスボレキサント・ラメルテオンが有用との報告があります。特にスボレキサントはICU患者のせん妄予防に関するRCTデータがあります。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本睡眠学会. 睡眠薬の適正使用・休薬ガイドライン 2014',
    '厚生労働科学研究班. 高齢者の安全な薬物療法ガイドライン 2015',
    'Hatta K et al. Suvorexant for prevention of delirium. J Clin Psychiatry 2017',
  ],
  relatedTools: [
    { href: '/tools/calc/cam-icu', name: 'CAM-ICU' },
    { href: '/tools/calc/rass', name: 'RASS' },
    { href: '/compare/bzd', name: 'ベンゾジアゼピン比較' },
  ],
}

export default function HypnoticComparePage() { return <DrugCompareLayout data={data} /> }
