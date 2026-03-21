'use client'
import CourseLayout, { CourseConfig } from '@/components/learning/CourseLayout'

const config: CourseConfig = {
  slug: 'echo',
  title: '心エコー講座',
  titleEn: 'Cardiac Echocardiography',
  icon: '🫀',
  description: '基本断面・計測・弁膜症・壁運動異常の評価を体系的に学習。8レッスン。',
  breadcrumb: '心エコー講座',
  href: '/learning/echo',
  lessons: [
    {
      id: 'echo-01', title: '心エコーの基本と適応', icon: '📋', free: true,
      keyPoints: [
        'TTE（経胸壁）とTEE（経食道）の使い分け',
        '心エコーの主な適応: 心不全評価/弁膜症/壁運動/心膜疾患',
        'プローブの持ち方とマーカーの向き',
      ],
      content: [
        '心エコーは非侵襲的に心臓の構造と機能をリアルタイムで評価できる最も重要な画像検査の一つです。TTE（経胸壁心エコー）が基本であり、ベッドサイドで繰り返し施行できます。',
        '主な適応は、心不全の評価（LVEFの測定）、弁膜症の診断と重症度評価、壁運動異常（虚血性心疾患）、心膜疾患（心嚢液/タンポナーデ）、先天性心疾患の評価です。',
        'TEE（経食道心エコー）はTTEで描出困難な場合や、感染性心内膜炎の疣贅（vegetation）検索、心房内血栓の評価、術中モニタリングで使用します。',
      ],
      tips: [
        '救急では「5分エコー」として、LVEF/心嚢液/IVC/右室拡大/大動脈の5点を確認するだけでも診療の質が大きく変わる',
        'プローブのマーカーは患者の右側（傍胸骨長軸像）または頭側（心尖部像）に向ける',
      ],
      quiz: {
        question: '経食道心エコー（TEE）の適応として最も適切なのはどれか？',
        choices: ['心不全患者のLVEF測定', '感染性心内膜炎の疣贅検索', '高血圧患者のスクリーニング', '運動負荷試験中の壁運動評価'],
        correct: 1,
        explanation: 'TEEはTTEより解像度が高く、特に疣贅（vegetation）や左心耳内血栓の検出に優れています。LVEFはTTEで十分評価可能です。',
      },
    },
    {
      id: 'echo-02', title: '基本断面（傍胸骨長軸像・短軸像）', icon: '🔍', free: true,
      keyPoints: [
        'PLAX: 大動脈弁→僧帽弁→左室→左房を一直線に描出',
        'PSAX: 大動脈弁レベル→僧帽弁レベル→乳頭筋レベルの3段階',
        'PSAX乳頭筋レベルで壁運動の16区域評価',
      ],
      content: [
        '傍胸骨長軸像（PLAX）は心エコーの最も基本的な断面です。左第3-4肋間胸骨左縁にプローブを置き、マーカーを右肩方向に向けます。大動脈弁・僧帽弁・左室・左房を一直線に描出します。',
        'PLAXで評価すべきポイント: 大動脈弁の開閉（AS/AR）、僧帽弁の動き（MS/MR/MVP）、左室壁の厚さ（中隔・後壁: 正常≦11mm）、左室拡張末期径（正常≦55mm）、心嚢液の有無。',
        '傍胸骨短軸像（PSAX）はプローブを90°時計回りに回転させます。大動脈弁レベルでは三尖弁の形態を観察、僧帽弁レベルでは弁口面積をトレース、乳頭筋レベルでは壁運動を16区域で評価します。',
      ],
      tips: [
        'PLAXが出ない時は肋間を1つ上下に変えるか、左側臥位にすると改善することが多い',
        'PSAXの乳頭筋レベルで「円形」に見えない（D-shape）場合は右室圧負荷を疑う',
      ],
      quiz: {
        question: '傍胸骨長軸像（PLAX）で心室中隔の正常壁厚の上限はどれか？',
        choices: ['8mm', '11mm', '15mm', '18mm'],
        correct: 1,
        explanation: '心室中隔・後壁の正常上限は11mmです。12mm以上で肥大と判定します。高血圧性心臓病やHCMの評価に重要です。',
      },
    },
    {
      id: 'echo-03', title: '基本断面（心尖部四腔像・二腔像）', icon: '🔍',
      keyPoints: [
        'A4C: 心尖部から4つの腔（左右心室+左右心房）を同時描出',
        'A4Cはカラードプラでのmr/TR評価、壁運動評価の基本断面',
        'A2C: 前壁/下壁を描出、Simpson法のLVEF計測に使用',
      ],
      content: [
        '心尖部四腔像（A4C）は心尖部にプローブを置き、マーカーを左腋窩方向に向けます。4つの腔を同時に描出でき、最も情報量の多い断面です。',
        'A4Cで評価: 左右心室のサイズ比較（RV/LV比>1.0→右室拡大）、壁運動異常（特にLAD/RCA領域）、僧帽弁・三尖弁の逆流（カラードプラ）、心房中隔欠損（ASD）の検索。',
        '心尖部二腔像（A2C）はA4Cから反時計回りに60°回転します。左室の前壁と下壁を描出し、Simpson法（modified biplane）でLVEFを算出する際にA4Cと組み合わせて使用します。',
      ],
      tips: [
        'A4Cで左室が「丸っこく」見える場合は心尖部が切れている（foreshortening）→プローブをもう少し外側・下方に',
        'RV拡大の迅速評価: A4CでRVがLVより大きく見えたらPEや肺高血圧を疑う',
      ],
      quiz: {
        question: 'Simpson法によるLVEF計測に使用する断面の組み合わせはどれか？',
        choices: ['PLAX + PSAX', 'A4C + A2C', 'A4C + PLAX', 'PSAX + subcostal'],
        correct: 1,
        explanation: 'Modified biplane Simpson法はA4CとA2Cの2断面で左室内腔をトレースし、容積を推定してEFを計算します。目測（eyeballing）より正確です。',
      },
    },
    {
      id: 'echo-04', title: 'LVEF評価と左室機能', icon: '💪',
      keyPoints: [
        'LVEF正常≧50%、軽度低下40-49%（HFmrEF）、中等度低下30-39%、高度低下<30%',
        '目測（eyeballing）は経験者でも±10%の誤差→Simpson法推奨',
        'GLS（Global Longitudinal Strain）は早期の収縮障害を検出',
      ],
      content: [
        'LVEF（左室駆出率）は心機能評価の最も基本的な指標です。正常値は≧50%で、<40%をHFrEF（収縮不全型心不全）、40-49%をHFmrEF（軽度低下型）と分類します。',
        '計測法: ①目測（eyeballing）: 迅速だが精度に限界、②Teichholz法（Mモード）: PLAX1箇所からの推定で不正確な場合あり、③Simpson法（biplane）: A4C+A2CからLVEFを算出、最も推奨される方法。',
        '拡張機能の評価も重要です。E/A比（僧帽弁流入波形）、e\'（組織ドプラ）、E/e\'比（左室充満圧の推定: >14で上昇）、TR velocity（肺動脈圧の推定）を組み合わせて評価します。',
        'GLS（Global Longitudinal Strain）は-20%以下が正常で、LVEF正常でも早期の心筋障害（化学療法心毒性など）を検出できます。',
      ],
      tips: [
        'E/e\' > 14 + TR velocity > 2.8m/s → 拡張障害あり（HFpEF疑い）',
        'LVEFが保たれていてもBNP高値+E/e\'上昇ならHFpEFを考える',
      ],
      quiz: {
        question: 'E/e\'比が15の場合、示唆される状態はどれか？',
        choices: ['左室充満圧は正常', '左室充満圧の上昇', '収縮能の低下', '右室圧負荷'],
        correct: 1,
        explanation: 'E/e\'比>14は左室充満圧の上昇を示唆し、拡張障害（HFpEF）の重要な所見です。E/e\'<8は正常、8-14はグレーゾーンです。',
      },
    },
    {
      id: 'echo-05', title: '弁膜症の評価（大動脈弁）', icon: '🫀',
      keyPoints: [
        'AS重症度: Vmax>4m/s, mean PG>40mmHg, AVA<1.0cm²',
        'AR: カラードプラでジェット幅/LVOT比、vena contracta、PHT',
        'Low-flow low-gradient ASはEF低下時にドブタミン負荷で評価',
      ],
      content: [
        '大動脈弁狭窄症（AS）は高齢者で最も多い弁膜症です。重症度は連続波ドプラ（CW）で最大血流速度（Vmax）と平均圧較差（mean PG）を測定し、連続の式でAVA（弁口面積）を算出して評価します。',
        'AS重症度基準: 軽症（Vmax 2-3m/s, AVA>1.5cm²）、中等症（3-4m/s, 1.0-1.5cm²）、重症（>4m/s, <1.0cm²）。重症ASで症状あり→TAVI/AVR適応。',
        '大動脈弁閉鎖不全症（AR）はカラードプラで逆流ジェットの幅、vena contracta幅（≧6mmで重症）、圧半減時間（PHT: <200msで重症）を評価します。',
      ],
      tips: [
        'CWのビームは大動脈弁ジェットと平行に当てないと過小評価する→A5C（五腔像）や右傍胸骨窓も試す',
        'AS+低EFの場合: ドブタミン負荷エコーで「真の重症AS」と「pseudo-severe AS」を鑑別',
      ],
      quiz: {
        question: '重症大動脈弁狭窄症の基準として正しいのはどれか？',
        choices: ['Vmax > 2m/s', 'AVA < 1.5cm²', 'mean PG > 40mmHg', 'mean PG > 20mmHg'],
        correct: 2,
        explanation: '重症ASの基準: Vmax>4m/s、mean PG>40mmHg、AVA<1.0cm²の3つです。いずれか1つでも該当すれば重症の可能性を考えます。',
      },
    },
    {
      id: 'echo-06', title: '弁膜症の評価（僧帽弁）', icon: '🫀',
      keyPoints: [
        'MR重症度: vena contracta≧7mm, EROA≧0.4cm², regurgitant volume≧60mL',
        'MS: MVA<1.5cm²で中等症以上、PHT法やプラニメトリーで評価',
        '僧帽弁逸脱症（MVP）はBarlow病/線維弾性欠損の2型',
      ],
      content: [
        '僧帽弁閉鎖不全症（MR）は一次性（弁自体の異常: MVP、リウマチ、感染性心内膜炎）と二次性（機能性: 左室拡大による弁輪拡大、テザリング）に分類します。',
        'MR重症度評価: カラードプラのジェット面積（半定量的）、vena contracta幅、PISA法でEROA/逆流量を算出。重症MRでは左室・左房拡大の有無、肺動脈圧の上昇も確認します。',
        '僧帽弁狭窄症（MS）はリウマチ性が大多数です。MVA（僧帽弁口面積）をPHT法（MVA=220/PHT）またはプラニメトリー（PSAX断面でトレース）で測定します。',
      ],
      tips: [
        'MRのカラードプラは左房内のジェット面積だけでは過大/過小評価する→PISA法やvena contractaも併用',
        'MS+AFの患者はTEEで左心耳内血栓の検索が抗凝固管理に重要',
      ],
      quiz: {
        question: '僧帽弁狭窄症のMVAをPHT法で算出する式はどれか？',
        choices: ['MVA = PHT / 220', 'MVA = 220 / PHT', 'MVA = PHT × 0.7', 'MVA = 0.85 × PHT'],
        correct: 1,
        explanation: 'PHT法: MVA = 220 / PHT（ms）。例えばPHT=220msならMVA=1.0cm²（重症MS）です。AF時はPHT測定が困難な場合があります。',
      },
    },
    {
      id: 'echo-07', title: '右心系の評価', icon: '🫁',
      keyPoints: [
        'RV拡大: A4CでRV/LV比>1.0、TAPSE<17mmで収縮障害',
        'TR velocity→簡易ベルヌーイ式でRVSP推定（4V² + RAP）',
        'IVC径と呼吸性変動でRAP推定（<2.1cm+>50%変動→RAP 3mmHg）',
      ],
      content: [
        '右室は左室と異なり三日月形で複雑な形態のため、定量評価が難しいですが、臨床的に非常に重要です。肺塞栓症、肺高血圧、右室梗塞の評価に不可欠です。',
        'RV収縮機能の評価: TAPSE（三尖弁輪収縮期移動距離: M-mode、正常≧17mm）、RV S\'（組織ドプラ: ≧10cm/s）、RV FAC（面積変化率: ≧35%）。',
        '肺動脈収縮期圧（PASP）の推定: TR（三尖弁逆流）のCW速度からRVSP = 4V² + RAP。PASP>35mmHgで肺高血圧疑い。IVC径（<2.1cm）と呼吸性変動（>50%虚脱）でRAP 3mmHg、それ以外で15mmHgと推定します。',
      ],
      tips: [
        'PE疑い→A4CでRV/LV>1.0+McConnell sign（RV自由壁akinesis+心尖部sparing）は高特異的',
        'IVCはsubcostal viewで評価。人工呼吸器管理中は呼吸性変動が逆（吸気で拡大）',
      ],
      quiz: {
        question: 'TAPSEの正常下限値はどれか？',
        choices: ['10mm', '14mm', '17mm', '22mm'],
        correct: 2,
        explanation: 'TAPSE（三尖弁輪収縮期移動距離）の正常下限は17mmです。<17mmは右室収縮障害を示唆します。簡便で再現性が高い指標です。',
      },
    },
    {
      id: 'echo-08', title: '救急でのFocused Echo（FATE/RUSH）', icon: '🚨',
      keyPoints: [
        'FATE: Focus Assessed Transthoracic Echo — 5つの質問に答える',
        'RUSH: Rapid Ultrasound in Shock — Pump/Tank/Pipe',
        'ベッドサイドエコーは「見逃してはいけない」の除外に使う',
      ],
      content: [
        'FATE protocolは5つの質問に答えます: ①心嚢液はあるか？ ②左室サイズ・機能は？ ③右室拡大はあるか？ ④IVCの状態は？ ⑤胸水はあるか？この5点で多くの緊急疾患を迅速に鑑別できます。',
        'RUSH exam（Rapid Ultrasound in Shock and Hypotension）はショック患者の系統的エコー評価です。Pump（心臓: LV機能/心嚢液/RV拡大）→ Tank（容量: IVC/胸水/腹水/FAST）→ Pipe（大血管: 大動脈瘤/解離/DVT）の3ステップで評価します。',
        'Point-of-Care Ultrasound（POCUS）は確定診断ではなく「見逃してはいけない疾患の迅速除外」が目的です。心タンポナーデ、大量PE、重症LV機能低下、大動脈解離/瘤を数分で評価できます。',
      ],
      tips: [
        'ショック患者にはまずsubcostal viewからIVC+心嚢液を確認→心タンポナーデの除外が最優先',
        'PLAXでE-point septal separation（EPSS）>10mmならLVEF<30%を強く疑う（迅速スクリーニング）',
      ],
      quiz: {
        question: 'RUSH examの「Tank」で評価するのはどれか？',
        choices: ['左室収縮機能', 'IVC径と呼吸性変動', '大動脈の拡大', '深部静脈血栓'],
        correct: 1,
        explanation: 'RUSH examのTank（容量評価）ではIVC（前負荷の推定）、胸水・腹水の有無、FAST（腹腔内出血）を評価します。Pumpは心臓、Pipeは大血管です。',
      },
    },
  ],
  references: [
    'ASE/EACVI Guidelines for Cardiac Chamber Quantification (Lang RM et al., JASE 2015)',
    'ASE Guidelines for Diastolic Function Assessment (Nagueh SF et al., JASE 2016)',
    'ASE Guidelines for Valvular Regurgitation (Zoghbi WA et al., JASE 2017)',
    '日本心エコー図学会 ガイドライン',
  ],
}

export default function EchoCourse() {
  return <CourseLayout config={config} />
}
