'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'cephalosporin',
  category: '感染症',
  title: 'セフェム系抗菌薬 比較表',
  description: 'セファゾリン・セフメタゾール・セフトリアキソン・セフェピム・セフタジジム・セフォタキシムの6剤（注射剤中心）を比較。世代別スペクトラム・胆泥・偽膜性腸炎。',
  columns: ['generic', 'brand', 'halfLife', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'セファゾリン (CEZ)', brand: 'セファメジン', specs: '注射 0.5g/1g/2g', indication: '術後感染予防、皮膚軟部組織、MSSA菌血症', halfLife: '約1.8時間', metabolism: '腎排泄 80%以上', renalAdjust: 'CCr < 30: 減量・投与間隔延長', features: '第1世代。MSSA・連鎖球菌に強い。術後感染予防の第一選択。グラム陰性桿菌には限定的（大腸菌・Klebsiellaの一部）。MRSA無効。安価', contraindication: 'セフェム系アレルギー', evidence: '' },
    { generic: 'セフメタゾール (CMZ)', brand: 'セフメタゾン', specs: '注射 0.5g/1g/2g', indication: '腹腔内感染、尿路感染、嫌気性菌混合感染', halfLife: '約1.2時間', metabolism: '腎排泄 80%以上', renalAdjust: 'CCr < 30: 減量', features: 'セファマイシン系（第2世代相当）。嫌気性菌（B. fragilis含む）カバーあり。ESBL産生菌にも有効な場合あり（in vitroデータ）。腹腔内感染に有用', contraindication: 'セフェム系アレルギー', evidence: '' },
    { generic: 'セフトリアキソン (CTRX)', brand: 'ロセフィン', specs: '注射 0.5g/1g', indication: '市中肺炎、尿路感染、髄膜炎、菌血症', halfLife: '約8時間', metabolism: '胆汁排泄 40% + 腎排泄 60%', renalAdjust: '腎障害のみでは調整不要（胆汁排泄あり）。透析で除去されにくい', features: '第3世代。1日1-2回投与可（半減期長い）。グラム陰性桿菌に広域。髄膜炎のempiric療法。Ca含有輸液との同一ラインでの混注禁忌（結晶化）。胆泥・偽性胆石の報告あり', contraindication: 'セフェム系アレルギー、新生児の高ビリルビン血症（Ca製剤同時投与禁忌）', evidence: '' },
    { generic: 'セフォタキシム (CTX)', brand: 'クラフォラン/セフォタックス', specs: '注射 0.5g/1g', indication: '髄膜炎、市中肺炎、尿路感染', halfLife: '約1時間（活性代謝物2時間）', metabolism: '肝で脱アセチル化 → 活性代謝物。腎排泄', renalAdjust: 'CCr < 30: 減量', features: '第3世代。CTRXに類似のスペクトラム。髄膜炎のempiric療法（CTRXの代替）。Ca含有輸液との問題なし。胆泥リスクなし。1日3-4回投与', contraindication: 'セフェム系アレルギー', evidence: '' },
    { generic: 'セフタジジム (CAZ)', brand: 'モダシン', specs: '注射 0.5g/1g/2g', indication: '緑膿菌感染症、発熱性好中球減少症', halfLife: '約1.8時間', metabolism: '腎排泄 80%以上', renalAdjust: 'CCr < 30: 減量・間隔延長', features: '第3世代。緑膿菌に対する活性が最強クラス。グラム陽性球菌には弱い。発熱性好中球減少症のempiric therapy。アビバクタムとの合剤（ザビセフタ）はESBL・CRE対策', contraindication: 'セフェム系アレルギー', evidence: '' },
    { generic: 'セフェピム (CFPM)', brand: 'マキシピーム', specs: '注射 0.5g/1g/2g', indication: '発熱性好中球減少症、院内肺炎、緑膿菌感染', halfLife: '約2時間', metabolism: '腎排泄 85%', renalAdjust: 'CCr < 50: 減量。特に腎障害で脳症リスク上昇', features: '第4世代。グラム陰性桿菌（緑膿菌含む）＋グラム陽性球菌の両方にバランスよく有効。AmpC型βラクタマーゼに安定。腎障害での蓄積で脳症（意識障害・痙攣）のリスク — 血中濃度モニタリングが望ましい', contraindication: 'セフェム系アレルギー', evidence: '' },
  ],
  seoContent: [
    { heading: 'セフェム系の世代別スペクトラム', text: '第1世代（CEZ）はグラム陽性球菌に強く、世代が上がるほどグラム陰性桿菌への活性が拡大します。第3世代（CTRX・CTX・CAZ）はグラム陰性桿菌に広域ですが、グラム陽性球菌への活性は第1世代より弱まります。第4世代（CFPM）はグラム陽性・陰性の両方にバランスが取れています。' },
    { heading: '重要な副作用と注意点', text: 'セフトリアキソンはCa含有輸液との同一ラインでの混注で結晶が形成されるため禁忌です。セフェピムは腎機能低下時に蓄積し、脳症（意識障害・ミオクローヌス・痙攣）を起こすリスクがあり、腎機能に応じた厳密な用量調整が必要です。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    'JAID/JSC感染症治療ガイド 2023',
    '日本化学療法学会. 抗菌薬TDMガイドライン 2022',
  ],
  relatedTools: [
    { href: '/tools/calc/egfr', name: 'eGFR' },
    { href: '/tools/calc/cockcroft-gault', name: 'Cockcroft-Gault' },
    { href: '/tools/calc/qsofa', name: 'qSOFA' },
    { href: '/compare/quinolone', name: 'キノロン系比較' },
  ],
}

export default function CephalosporinComparePage() { return <DrugCompareLayout data={data} /> }
