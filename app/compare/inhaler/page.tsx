'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'inhaler',
  category: '呼吸器',
  title: '吸入薬（ICS/LABA/LAMA）比較表',
  description: '喘息・COPDに使用される主要吸入薬7製剤を比較。ICS+LABA合剤・トリプル製剤・デバイスの種類・吸入手技。',
  columns: ['generic', 'brand', 'features', 'contraindication'],
  drugs: [
    { generic: 'フルティカゾンフランカルボン酸/ビランテロール', brand: 'レルベア', specs: 'エリプタ', indication: '喘息、COPD', halfLife: 'ICS 24時間、LABA 25時間', metabolism: 'CYP3A4（ICS）', renalAdjust: '通常不要', features: 'ICS/LABA合剤。エリプタ（ドライパウダー）1日1回。吸入手技が簡便（ふたを開けて吸うだけ）。喘息・COPDの両方に適応。ICS力価が高い', contraindication: '有効な抗菌薬のない感染症（ICS共通・相対的）' },
    { generic: 'ブデソニド/ホルモテロール', brand: 'シムビコート', specs: 'タービュヘイラー', indication: '喘息、COPD', halfLife: 'ICS 2-3時間、LABA 10時間', metabolism: 'CYP3A4（ICS）', renalAdjust: '通常不要', features: 'ICS/LABA合剤。SMART療法（維持＋発作時の追加吸入）が可能な唯一の合剤。タービュヘイラー（DPI）。1日2回（維持）。ホルモテロールの速効性を活かしたフレキシブル投与', contraindication: '急性発作時の単独使用は不可' },
    { generic: 'フルティカゾンプロピオン酸/サルメテロール', brand: 'アドエア', specs: 'ディスカス/エアゾール', indication: '喘息、COPD', halfLife: 'ICS 7.8時間、LABA 5.5時間', metabolism: 'CYP3A4（ICS）', renalAdjust: '通常不要', features: 'ICS/LABA合剤の先駆け。ディスカス（DPI）とエアゾール（pMDI）の2デバイス。1日2回。長い使用実績。サルメテロールは効果発現が遅い（15-20分）', contraindication: '急性発作には不適' },
    { generic: 'フルティカゾンフランカルボン酸/ウメクリジニウム/ビランテロール', brand: 'テリルジー', specs: 'エリプタ', indication: '喘息（ICS/LABAで不十分な場合）、COPD', halfLife: 'ICS 24h、LAMA 11h、LABA 25h', metabolism: 'CYP3A4（ICS）', renalAdjust: '通常不要', features: 'ICS/LAMA/LABA トリプル合剤。1日1回エリプタ。COPDの増悪予防に優れる。喘息にも適応拡大。1吸入で3成分 → 服薬簡便化', contraindication: '閉塞隅角緑内障、前立腺肥大による排尿障害' },
    { generic: 'チオトロピウム', brand: 'スピリーバ', specs: 'レスピマット/ハンディヘラー', indication: 'COPD、喘息（追加療法）', halfLife: '約25時間', metabolism: '腎排泄 74%', renalAdjust: '重度腎障害: 慎重投与', features: 'LAMA単剤。COPDの基本薬。1日1回。長時間気管支拡張。レスピマット（ソフトミスト: 吸入力が弱い高齢者に有利）。喘息への追加療法も承認。閉塞隅角緑内障・前立腺肥大に注意', contraindication: 'アトロピンアレルギー、閉塞隅角緑内障、前立腺肥大による排尿障害' },
    { generic: 'インダカテロール/グリコピロニウム', brand: 'ウルティブロ', specs: 'ブリーズヘラー', indication: 'COPD', halfLife: 'LABA 40-52h、LAMA 33h', metabolism: 'CYP3A4/UGT1A1（LABA）', renalAdjust: '重度腎障害: 慎重投与', features: 'LABA/LAMA合剤。COPDの二剤配合。1日1回カプセル吸入。ICSを含まないため肺炎リスクが低い。COPD増悪頻度が少ない患者に適する', contraindication: '閉塞隅角緑内障、前立腺肥大による排尿障害' },
    { generic: 'モメタゾンフランカルボン酸', brand: 'アズマネックス', specs: 'ツイストヘラー', indication: '喘息', halfLife: '約5時間', metabolism: 'CYP3A4', renalAdjust: '通常不要', features: 'ICS単剤。高力価。1日1-2回。ツイストヘラー（DPI）。口腔カンジダ症予防のため吸入後うがい必須。ICS単剤は軽症〜中等症喘息のStep 1-2で使用', contraindication: '有効な抗菌薬のない感染症（相対的）' },
  ],
  seoContent: [
    { heading: '喘息の吸入薬ステップアップ', text: '喘息の治療はICS単剤（低用量）から開始し、コントロール不十分ならICS/LABA合剤へステップアップします。さらに不十分ならICS増量・LAMA追加（トリプル）・生物学的製剤を検討します。SMART療法（シムビコート）は維持と発作時の両方を1剤で対応できる利点があります。' },
    { heading: 'COPDの吸入薬選択', text: 'COPDの第一選択はLAMA（スピリーバ等）またはLABA単剤です。増悪リスクが高い場合はLAMA/LABA合剤、さらに増悪を繰り返す場合はICS/LAMA/LABAトリプル（テリルジー等）を使用します。ICSは増悪予防に有効ですが、肺炎リスクを上昇させるため適応を慎重に判断します。' },
    { heading: 'デバイスの選択', text: 'DPI（ドライパウダー吸入器）は吸気力が必要で、高齢者・重症COPDでは吸入力不足になることがあります。pMDI（加圧式定量噴霧吸入器）はスペーサー併用で吸入力に依存しません。ソフトミスト（レスピマット）は吸入力が弱い患者に適しています。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本アレルギー学会. 喘息予防・管理ガイドライン 2024（JGL2024）',
    '日本呼吸器学会. COPD診断と治療のためのガイドライン 2022',
    'GOLD 2024 Report (Global Initiative for Chronic Obstructive Lung Disease)',
  ],
  relatedTools: [
    { href: '/tools/calc/aa-gradient', name: 'A-aDO₂' },
    { href: '/compare/steroid', name: 'ステロイド比較' },
  ],
}

export default function InhalerComparePage() { return <DrugCompareLayout data={data} /> }
