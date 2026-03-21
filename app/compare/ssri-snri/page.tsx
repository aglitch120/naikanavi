'use client'
import DrugCompareLayout, { CompareData } from '@/components/compare/DrugCompareLayout'

const data: CompareData = {
  slug: 'ssri-snri',
  category: '精神・神経',
  title: 'SSRI / SNRI 比較表',
  description: 'エスシタロプラム・セルトラリン・パロキセチン・フルボキサミン・デュロキセチン・ベンラファキシン・ミルナシプランの7剤を比較。CYP相互作用・離脱症状・疼痛適応。',
  columns: ['generic', 'brand', 'halfLife', 'metabolism', 'features', 'renalAdjust', 'contraindication'],
  drugs: [
    { generic: 'エスシタロプラム', brand: 'レクサプロ', specs: '10mg/20mg', indication: 'うつ病・うつ状態、社会不安障害', halfLife: '約27-32時間', metabolism: 'CYP2C19（主）/3A4', renalAdjust: '重度腎障害: 慎重投与', features: 'SSRI。シタロプラムのS体。セロトニン選択性が最も高い。CYP阻害作用が弱く相互作用少。QT延長のリスク（高用量）。離脱症状は中等度', contraindication: 'MAO阻害薬併用（14日間の休薬）、ピモジド併用、QT延長', evidence: '' },
    { generic: 'セルトラリン', brand: 'ジェイゾロフト', specs: '25mg/50mg/100mg', indication: 'うつ病・うつ状態、パニック障害、PTSD', halfLife: '約26時間', metabolism: 'CYP2B6/2C19/3A4/2D6', renalAdjust: '通常不要', features: 'SSRI。適応が広い（うつ・パニック・PTSD）。CYP阻害作用が比較的弱い。心疾患合併うつ病での安全性データあり。離脱症状は軽度', contraindication: 'MAO阻害薬併用、ピモジド併用', evidence: 'SADHART試験（心疾患合併うつ）' },
    { generic: 'パロキセチン', brand: 'パキシル/パキシルCR', specs: '5mg/10mg/20mg', indication: 'うつ病、パニック障害、社会不安障害、強迫性障害、PTSD', halfLife: '約14時間', metabolism: 'CYP2D6（主）', renalAdjust: '重度腎障害: 減量', features: 'SSRI。適応が最も広い。CYP2D6の強力な阻害薬 → 多剤併用時の相互作用に注意。抗コリン作用がSSRI中最強。離脱症状が最も強い（半減期短い＋代謝酵素阻害で蓄積→中止時に急減少）。体重増加', contraindication: 'MAO阻害薬併用、ピモジド併用、妊娠（催奇形性の報告）', evidence: '' },
    { generic: 'フルボキサミン', brand: 'ルボックス/デプロメール', specs: '25mg/50mg/75mg', indication: 'うつ病、強迫性障害、社会不安障害', halfLife: '約9-28時間', metabolism: 'CYP2D6', renalAdjust: '重度腎障害: 慎重投与', features: 'SSRI。CYP1A2/2C19の強力な阻害薬 → ラメルテオン・テオフィリン・ワルファリンとの相互作用に特に注意。1日2回投与。σ1受容体親和性（抗不安）', contraindication: 'MAO阻害薬・チザニジン・ラメルテオン併用', evidence: '' },
    { generic: 'デュロキセチン', brand: 'サインバルタ', specs: '20mg/30mg/60mgカプセル', indication: 'うつ病、糖尿病性神経障害・線維筋痛症・慢性腰痛の疼痛、変形性関節症の疼痛', halfLife: '約12時間', metabolism: 'CYP1A2（主）/2D6', renalAdjust: 'CCr < 30: 一般的でない', features: 'SNRI。疼痛適応が豊富（糖尿病性神経障害・線維筋痛症・腰痛・OA）。下行性疼痛抑制系の活性化。CYP2D6の中等度阻害。肝障害で血中濃度上昇', contraindication: 'MAO阻害薬併用、高度腎障害、高度肝障害、尿閉', evidence: '' },
    { generic: 'ベンラファキシン', brand: 'イフェクサーSR', specs: '37.5mg/75mgカプセル', indication: 'うつ病・うつ状態', halfLife: '約5時間（活性代謝物11時間）', metabolism: 'CYP2D6 → デスベンラファキシン（活性代謝物）', renalAdjust: 'CCr 30-70: 減量。CCr < 30: さらに減量', features: 'SNRI。低用量ではSSRI的、高用量ではNRI作用が加わる（用量依存的）。CYP阻害作用が弱い。血圧上昇の副作用（高用量で顕著）。離脱症状がやや強い', contraindication: 'MAO阻害薬併用', evidence: '' },
    { generic: 'ミルナシプラン', brand: 'トレドミン', specs: '12.5mg/25mg/50mg', indication: 'うつ病・うつ状態', halfLife: '約8時間', metabolism: 'グルクロン酸抱合（CYP非依存）', renalAdjust: '腎障害: 減量', features: 'SNRI。CYP非依存で相互作用が最も少ない。NRI作用がSRI作用より強い（意欲・活力への効果）。尿閉の副作用に注意。1日2-3回投与', contraindication: 'MAO阻害薬併用、尿閉、前立腺疾患', evidence: '' },
  ],
  seoContent: [
    { heading: 'SSRI vs SNRIの選択', text: 'SSRIはセロトニン系のみ、SNRIはセロトニン＋ノルアドレナリン系を増強します。疼痛合併例ではSNRI（特にデュロキセチン）が有利です。意欲低下が前景のうつにはNRI作用のあるSNRI、不安が前景の場合はSSRI（エスシタロプラム・セルトラリン）が選択されやすいです。' },
    { heading: 'CYP相互作用の重要性', text: 'パロキセチン（CYP2D6強阻害）とフルボキサミン（CYP1A2/2C19強阻害）は多剤併用時に特に注意が必要です。エスシタロプラム・セルトラリン・ミルナシプランは相互作用が少なく、多剤併用例に使いやすい薬剤です。' },
    { heading: '離脱症候群（中止後症候群）', text: 'SSRI/SNRI の急激な中止は、めまい・しびれ感（brain zap）・嘔気・不安・不眠などの離脱症候群を引き起こします。パロキセチン・ベンラファキシンで特に強く、漸減中止が必要です。半減期の長いフルオキセチン（日本未発売）やエスシタロプラムは比較的離脱症状が少ないとされます。' },
  ],
  references: [
    '各薬剤の添付文書（最新版）',
    '日本うつ病学会. うつ病治療ガイドライン 第2版 2023',
    'Cipriani A et al. Comparative efficacy and acceptability of 21 antidepressant drugs. Lancet 2018;391:1357-1366',
  ],
  relatedTools: [
    { href: '/tools/calc/phq9', name: 'PHQ-9' },
    { href: '/tools/calc/gad7', name: 'GAD-7' },
    { href: '/compare/hypnotic', name: '睡眠薬比較' },
  ],
}

export default function SSRISNRIComparePage() { return <DrugCompareLayout data={data} /> }
