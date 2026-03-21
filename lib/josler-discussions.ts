// ═══════════════════════════════════════════════════════════════
//  病歴要約 考察テンプレート — 疾患別の高品質事前作成文章
//  AI不使用: 医学的コンセンサスに基づくテンプレートエンジン
//
//  〈〉 = ユーザーが埋める箇所
//  【要確認】 = データ未入力の検査値等
// ═══════════════════════════════════════════════════════════════

export interface RichDiscussion {
  disease: string
  /** 入院後経過と考察（プロブレム別） */
  courseAndDiscussion: string
  /** 総合考察（文献引用付き） */
  overallDiscussion: string
  /** 診断基準（該当する場合） */
  diagnosticCriteria?: string
}

export const RICH_DISCUSSIONS: Record<string, Omit<RichDiscussion, 'disease'>> = {
  // ═══════════════════════════════════════
  //  感染症
  // ═══════════════════════════════════════
  '肺炎（市中肺炎）': {
    courseAndDiscussion: `#1 市中肺炎

【経過】
入院後, A-DROPスコア〈  〉点（〈軽症/中等症/重症〉）と判断し, 〈セフトリアキソンナトリウム 2 g 1日1回/アンピシリン・スルバクタム 3 g 1日4回〉の点滴静注を開始した. 〈入院時喀痰グラム染色ではグラム陽性双球菌を認めた/喀痰培養から〇〇が検出された〉. 第〈  〉病日より解熱傾向となり, CRP 〈  〉 mg/dLまで低下した. 第〈  〉病日に経口抗菌薬（〈レボフロキサシン水和物 500 mg 1日1回〉）へスイッチし, 第〈  〉病日に退院とした. 退院後〈  〉日間の経口抗菌薬投与を行い, 外来にて画像上の改善を確認した.

【考察】
本症例は〈急性の発熱と咳嗽, 胸部画像上の浸潤影〉から市中肺炎と診断した. A-DROPスコア〈  〉点であり, 日本呼吸器学会成人肺炎診療ガイドライン 2017に基づき〈外来治療/一般病棟入院/ICU管理〉の方針とした. 原因微生物として〈肺炎球菌/マイコプラズマ/レジオネラ〉を想定し, 抗菌薬を選択した. 鑑別として肺結核を考慮したが, 喀痰抗酸菌塗抹陰性および臨床経過から否定的であった. 間質性肺炎はHRCTパターンおよび経過から除外した. 抗菌薬の選択はガイドラインに準じた〈β-ラクタム系/呼吸器キノロン〉を使用し, 良好な治療反応を得た.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉に発症した市中肺炎の症例である. 市中肺炎の原因微生物は肺炎球菌が最多であり, 次いでインフルエンザ桿菌, マイコプラズマ, レジオネラが続く（Ishida Tら. Intern Med 2012；51：2545）. 本症例では〈喀痰培養/尿中抗原〉から〈原因微生物名〉が同定された.

治療においては, 日本呼吸器学会 成人肺炎診療ガイドライン 2017に準じ, A-DROPによる重症度判定のうえ抗菌薬を選択した. A-DROPは日本人のデータに基づいて開発されたスコアリングシステムであり, 0点を外来治療, 1-2点を一般病棟入院, 3点以上をICU管理の目安とする（Shindo Yら. J Infect Chemother 2008；14：276）. 抗菌薬は〈選択理由〉に基づいて〈薬剤名〉を選択し, 良好な臨床反応を得た. 第〈  〉病日に経口スイッチを行ったが, 経口スイッチの基準としては解熱, 経口摂取可能, バイタルサインの安定が重要である.

本症例を通じて, 市中肺炎の重症度に応じた適切な治療場所の選択と, エンピリック治療から原因微生物同定後のde-escalationの重要性を学んだ.

（文献）
1. Ishida T, et al. Etiology of community-acquired pneumonia in hospitalized patients. Intern Med 2012；51：2545-2550
2. Shindo Y, et al. Comparison of severity scoring systems A-DROP and CURB-65. J Infect Chemother 2008；14：276-282
3. 日本呼吸器学会編. 成人肺炎診療ガイドライン 2017. 日本呼吸器学会`,
  },

  '敗血症': {
    courseAndDiscussion: `#1 敗血症（感染フォーカス: 〈尿路/肺/腹腔/カテーテル〉）

【経過】
来院時, qSOFA 〈  〉点, SOFA 〈  〉点であり, Sepsis-3の定義に基づき敗血症と診断した. 〈ショックの有無: 適切な輸液負荷にもかかわらず平均動脈圧 65 mmHg未満かつ乳酸値 2 mmol/L超を認め, 敗血症性ショックと判断した〉. Hour-1 Bundleに従い, 来院後1時間以内に血液培養2セット提出, 乳酸値測定, 〈広域抗菌薬: メロペネム水和物 1 g 1日3回/タゾバクタム・ピペラシリンナトリウム 4.5 g 1日4回〉の投与, 晶質液 30 mL/kg の初期輸液負荷を実施した. 〈血管収縮薬（ノルアドレナリン）を平均動脈圧 65 mmHg維持を目標に開始した〉. 血液培養から〈原因菌〉が検出され, 感受性結果に基づき第〈  〉病日に〈de-escalation後の抗菌薬名〉へ変更した. 感染フォーカスとして〈ソースコントロールの内容〉を行った. 第〈  〉病日より乳酸値の正常化, バソプレッサー離脱を確認し, 第〈  〉病日に一般病棟へ転棟, 第〈  〉病日に退院とした.

【考察】
本症例は〈感染フォーカス〉を原因とした敗血症〈/敗血症性ショック〉であった. Sepsis-3の定義（Singer Mら. JAMA 2016；315：801）に基づき, 感染症が疑われる患者においてSOFAスコア 2点以上の急性変化をもって敗血症と診断した. qSOFAはベッドサイドで迅速に評価可能なスクリーニングツールであり, 本症例では〈  〉項目が陽性であった. Surviving Sepsis Campaign Guidelines 2021（Evans Lら. Crit Care Med 2021；49：e1063）に準じたHour-1 Bundleの迅速な実施が予後改善に重要であり, 本症例でも来院後〈  〉分以内に抗菌薬投与を完了した. 鑑別として〈アナフィラキシー/副腎不全/心原性ショック〉を考慮したが, 〈除外根拠〉より否定的であった.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉の〈感染フォーカス〉を原因とした敗血症〈/敗血症性ショック〉の症例である.

敗血症はSepsis-3において「感染症に対する制御不能な宿主反応に起因する生命を脅かす臓器障害」と定義されている（Singer M, et al. JAMA 2016；315：801-810）. 本症例ではSOFAスコア〈  〉点の急性上昇を認め, 本定義を満たした.

治療においてはSurviving Sepsis Campaign Guidelines 2021（Evans L, et al. Crit Care Med 2021；49：e1063-e1143）に準じ, Hour-1 Bundleの迅速な実施を行った. 同ガイドラインでは, 血液培養採取後可及的速やかに広域抗菌薬を投与すること, 低血圧または乳酸値 4 mmol/L以上の場合は晶質液 30 mL/kgの急速投与を行うこと, 初期輸液にもかかわらず低血圧が遷延する場合はノルアドレナリンをfirst-lineの血管収縮薬として使用することが推奨されている. 本症例でも同ガイドラインに準じた初期蘇生を行い, 良好な転帰を得た.

本症例を通じて, 敗血症の早期認識におけるqSOFA/SOFAの有用性, Hour-1 Bundleの迅速な実行, および原因微生物同定後の適切なde-escalationの重要性を再認識した.

（文献）
1. Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA 2016；315：801-810
2. Evans L, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med 2021；49：e1063-e1143
3. 日本版敗血症診療ガイドライン 2020 (J-SSCG 2020). 日本集中治療医学会/日本救急医学会`,

    diagnosticCriteria: `【Sepsis-3 診断基準】
敗血症: 感染症（疑い含む）+ SOFAスコア 2点以上の急性変化
敗血症性ショック: 敗血症 + 適切な輸液にもかかわらずMAP ≥ 65 mmHg維持に血管収縮薬が必要 + 乳酸値 > 2 mmol/L

【qSOFA（ベッドサイドスクリーニング）】
□ 呼吸数 ≥ 22/分
□ 意識変容（GCS < 15）
□ 収縮期血圧 ≤ 100 mmHg
→ 2項目以上で敗血症を疑う`,
  },

  '急性心筋梗塞': {
    courseAndDiscussion: `#1 急性心筋梗塞（〈ST上昇型/非ST上昇型〉, 〈前壁/下壁/側壁/後壁〉）

【経過】
来院時の12誘導心電図にて〈V1-V4のST上昇/II, III, aVFのST上昇〉を認め, 高感度トロポニン〈T/I〉 〈  〉 ng/mLと上昇しており, 〈STEMI/NSTEMI〉と診断した. Killip分類 〈I/II/III/IV〉であった. Door-to-balloon time 〈  〉分にてCAG, 〈RCA/LAD/LCx〉 #〈  〉に〈完全閉塞/99%狭窄〉を認め, 同部位にPCI（〈薬剤溶出ステント留置/バルーン拡張〉）を施行した. 術後, DAPT（アスピリン 100 mg + 〈クロピドグレル硫酸塩 75 mg/プラスグレル塩酸塩 3.75 mg〉）を開始した. 心エコーではEF 〈  〉%, 〈前壁/下壁〉のasynergy（〈hypokinesis/akinesis〉）を認めた. 入院後, 〈β遮断薬/ACE阻害薬/ARB/スタチン〉による二次予防を開始し, 第〈  〉病日より心臓リハビリテーションを開始した. 第〈  〉病日に退院とした.

【考察】
本症例は〈典型的な胸痛と心電図変化, トロポニン上昇〉からSTEMI/NSTEMIと診断した. 鑑別として急性大動脈解離を考慮したが, 造影CTにて大動脈にflap/偽腔を認めず否定した. たこつぼ心筋症は冠動脈造影で責任病変を同定したことから除外した. JCS/JHFS 2023 急性冠症候群診療ガイドラインに準じ, STEMIに対しては90分以内のprimary PCIが推奨されており, 本症例ではdoor-to-balloon time 〈  〉分で再灌流を達成した.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉に発症した〈STEMI/NSTEMI〉の症例である. 冠危険因子として〈高血圧, 脂質異常症, 糖尿病, 喫煙〉を有していた.

急性心筋梗塞の診断はUniversal Definition of Myocardial Infarction（第4版, Thygesen K, et al. Circulation 2018；138：e231-e270）に基づき, 心筋虚血を示す症状または所見の存在下での心筋トロポニンの上昇・下降パターンをもって診断する. 本症例では〈心電図所見とトロポニン動態〉から診断に至った.

治療においてはJCS/JHFS 2023 急性冠症候群診療ガイドラインに準じ, STEMIに対するprimary PCIを施行した. 同ガイドラインでは, STEMIの再灌流療法としてPCIが第一選択であり, first medical contactからのdoor-to-balloon timeは90分以内が推奨されている. 退院後の二次予防として, DAPTの継続（通常12ヶ月間）, スタチン高用量投与（LDL-C 70 mg/dL未満を目標）, ACE阻害薬/ARBおよびβ遮断薬の導入, 心臓リハビリテーションが推奨される.

本症例を通じて, 急性心筋梗塞における迅速な再灌流療法の重要性と, エビデンスに基づいた二次予防の包括的な導入について学んだ.

（文献）
1. Thygesen K, et al. Fourth Universal Definition of Myocardial Infarction (2018). Circulation 2018；138：e231-e270
2. 日本循環器学会/日本心不全学会. 2023年JCS/JHFSガイドライン 急性冠症候群診療ガイドライン
3. Ibanez B, et al. 2017 ESC Guidelines for the management of acute myocardial infarction in patients presenting with ST-segment elevation. Eur Heart J 2018；39：119-177`,
  },

  '心不全': {
    courseAndDiscussion: `#1 慢性心不全急性増悪（NYHA 〈III/IV〉, 〈HFrEF: EF 〈  〉%/HFpEF: EF 〈  〉%〉）

【経過】
入院時, Nohria-Stevenson分類 〈Warm-Wet/Cold-Wet/Cold-Dry〉と判断した. BNP 〈  〉 pg/mL（/NT-proBNP 〈  〉 pg/mL）, 胸部X線にて〈心拡大（CTR 〈  〉%）, 肺うっ血, 両側胸水〉を認めた. 心エコーではEF 〈  〉%, 〈壁運動異常/弁膜症所見〉を認めた. 増悪因子として〈感染症/不整脈/服薬アドヒアランス不良/塩分過多/貧血〉が考えられた. 治療として酸素投与, フロセミド〈静注 20-40 mg/持続静注〉による利尿, 〈血管拡張薬（カルペリチド/硝酸薬）〉を開始した. 第〈  〉病日よりうっ血所見の改善を認め, 経口利尿薬へ切り替えた. 退院に向けてGDMT（guideline-directed medical therapy）の最適化を行い, 〈ACE阻害薬・ARB・ARNI, β遮断薬, MRA, SGLT2阻害薬〉を〈導入/増量〉した. 第〈  〉病日, NYHA 〈II〉まで改善し退院とした.

【考察】
本症例は〈基礎心疾患〉を基盤とした慢性心不全の急性増悪であった. 増悪因子として〈具体的な増悪因子〉を同定した. Nohria-Stevenson分類に基づくprofileの評価は急性期治療戦略の決定に有用であり, 本症例ではprofile 〈B/C〉として利尿と〈血管拡張/強心〉を軸とした治療を行った. JCS/JHFS 2021 急性・慢性心不全診療ガイドラインでは, HFrEFに対するGDMTとして4本柱（ACE阻害薬/ARB/ARNI, β遮断薬, MRA, SGLT2阻害薬）の導入が強く推奨されている. 退院後の多職種による心不全管理とセルフケア教育も再入院予防に重要である.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉の慢性心不全急性増悪（〈HFrEF/HFpEF〉, 基礎心疾患: 〈虚血性心疾患/拡張型心筋症/弁膜症〉）の症例である.

心不全の急性期管理においては, Nohria-Stevenson分類によるプロファイル評価が治療戦略の決定に有用である. 本症例はprofile 〈B/C〉に相当し, 〈利尿/強心/血管拡張〉を軸とした初期治療を行った.

慢性期管理においてはGDMT（guideline-directed medical therapy）の最適化が予後改善に直結する. JCS/JHFS 2021 急性・慢性心不全診療ガイドラインでは, HFrEF（EF ≤ 40%）に対し, RAS阻害薬（ACE阻害薬/ARB）またはARNI, β遮断薬, MRA, SGLT2阻害薬の4剤を「fantastic four」として推奨している. SGLT2阻害薬については, DAPA-HF試験（McMurray JJV, et al. N Engl J Med 2019；381：1995）およびEMPEROR-Reduced試験（Packer M, et al. N Engl J Med 2020；383：1413）により, HFrEFにおける心血管死亡・心不全入院の有意な減少が示されている.

本症例を通じて, 心不全の急性期プロファイル評価に基づいた治療戦略の選択と, 退院前のGDMT最適化の重要性を学んだ.

（文献）
1. McMurray JJV, et al. Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction (DAPA-HF). N Engl J Med 2019；381：1995-2008
2. Packer M, et al. Cardiovascular and Renal Outcomes with Empagliflozin in Heart Failure (EMPEROR-Reduced). N Engl J Med 2020；383：1413-1424
3. 日本循環器学会/日本心不全学会. 2021年JCS/JHFSガイドライン 急性・慢性心不全診療ガイドライン`,
  },

  '脳梗塞': {
    courseAndDiscussion: `#1 脳梗塞（〈アテローム血栓性/心原性/ラクナ/その他〉, TOAST分類）

【経過】
〈  〉時〈  〉分に〈右/左〉〈片麻痺/構音障害/失語〉が突然出現し, 救急搬送された. 来院時NIHSS 〈  〉点であった. 頭部CTにて出血を除外し, 〈発症〈  〉時間以内であり, rt-PA静注療法（アルテプラーゼ 0.6 mg/kg）を施行した/発症時刻不明であったが, 頭部MRI DWI-FLAIR mismatchから〈  〉時間以内の発症と推定し, rt-PA静注療法を施行した〉. 〈頭部MRAにて〈MCA/ICA〉の閉塞を認め, 機械的血栓回収療法を追加した〉. 術後, NIHSS 〈  〉点に改善した. 病型として〈TOAST分類の根拠〉から〈アテローム血栓性/心原性/ラクナ〉脳梗塞と判断した. 〈心原性の場合: 心房細動を認め, CHA₂DS₂-VAScスコア 〈  〉点であり, 第〈  〉病日より抗凝固療法（〈アピキサバン/リバーロキサバン/エドキサバン〉）を開始した〉. 〈非心原性の場合: 第〈  〉病日よりDAPT（アスピリン + クロピドグレル硫酸塩）を開始し, 21日後に単剤へ変更した〉. リハビリテーションを入院第2病日より開始し, 第〈  〉病日にmRS 〈  〉にて〈自宅/回復期リハ病棟〉へ退院とした.

【考察】
本症例は突然発症の神経局在症状から脳梗塞を疑い, 頭部CTで出血を除外のうえ〈rt-PA静注療法/機械的血栓回収療法〉を施行した. rt-PA静注療法は発症4.5時間以内の脳梗塞に対し有効性が示されており（Hacke W, et al. N Engl J Med 2008；359：1317）, 本症例では発症〈  〉時間で投与を完了した. 〈機械的血栓回収療法については, MR CLEAN試験をはじめとする5大RCTのメタ解析（HERMES collaboration. Lancet 2016；387：1723）により, 前方循環の主幹動脈閉塞に対する有効性が確立されている〉. TOAST分類に基づく病型診断は二次予防戦略の決定に直結し, 〈病型に応じた二次予防の根拠〉.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉に発症した〈TOAST分類〉脳梗塞の症例である.

脳梗塞の超急性期治療においては, rt-PA静注療法（発症4.5時間以内）および機械的血栓回収療法（前方循環主幹動脈閉塞, 発症24時間以内）がエビデンスレベルの高い治療として確立されている. rt-PA静注療法についてはECASS III試験（Hacke W, et al. N Engl J Med 2008；359：1317-1329）により4.5時間以内での有効性が示され, 日本では2012年より4.5時間への適応拡大がなされた. 機械的血栓回収療法についてはHERMES collaborationのメタ解析（Goyal M, et al. Lancet 2016；387：1723-1731）により, NNT 2.6という高い治療効果が報告されている.

二次予防においては, TOAST分類に基づく病型診断が治療戦略の根幹となる. 〈心原性脳塞栓症に対しては, CHA₂DS₂-VAScスコアに基づくDOACによる抗凝固療法が推奨される / 非心原性脳梗塞に対しては, CHANCE試験（Wang Y, et al. N Engl J Med 2013；369：11）に基づき, 発症早期のDAPT（21日間）が推奨される〉.

本症例を通じて, 脳梗塞超急性期における迅速な画像診断と再灌流療法の時間依存性, およびTOAST分類に基づく二次予防の重要性を学んだ.

（文献）
1. Hacke W, et al. Thrombolysis with Alteplase 3 to 4.5 Hours after Acute Ischemic Stroke (ECASS III). N Engl J Med 2008；359：1317-1329
2. Goyal M, et al. Endovascular thrombectomy after large-vessel ischaemic stroke: a meta-analysis (HERMES). Lancet 2016；387：1723-1731
3. 日本脳卒中学会. 脳卒中治療ガイドライン 2021`,
  },

  '急性腎障害': {
    courseAndDiscussion: `#1 急性腎障害（KDIGO Stage 〈1/2/3〉, 〈腎前性/腎性/腎後性〉）

【経過】
入院時Cr 〈  〉 mg/dL（ベースラインCr 〈  〉 mg/dL）であり, KDIGO基準Stage 〈  〉の急性腎障害と診断した. 〈乏尿（尿量 〈  〉 mL/日/hr）を認めた〉. 原因として〈腎前性: FENa 〈  〉%（<1%）, 尿浸透圧 〈  〉 mOsm/kg（>500）から腎前性が示唆された / 腎性: 尿沈渣にて顆粒円柱を認め, FENa 〈  〉%（>2%）から急性尿細管壊死（ATN）が示唆された / 腎後性: 腹部エコーにて両側水腎症を認めた〉. 治療として〈補液増量/腎毒性薬剤の中止/尿路閉塞解除/血液透析導入〉を行った. Cr は第〈  〉病日をピークに低下傾向となり, 退院時Cr 〈  〉 mg/dLまで回復した.

【考察】
本症例は〈原因〉を契機とした急性腎障害であった. KDIGO 2012 Clinical Practice Guidelineに基づき, Crの上昇幅および尿量からStage 〈  〉と判定した. 原因鑑別において, FENa, 尿浸透圧, 尿沈渣が有用であった. 〈腎前性ではFENa < 1%かつ尿浸透圧 > 500 mOsm/kgが特徴的であり, 本症例の所見と合致した〉. 鑑別として〈腎後性（画像で否定）, 腎性（糸球体腎炎: 尿沈渣で否定, 間質性腎炎: 好酸球尿なし）〉を考慮した.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉の〈原因〉に伴う急性腎障害（KDIGO Stage 〈  〉）の症例である.

急性腎障害（AKI）はKDIGO 2012 Clinical Practice Guideline（KDIGO. Kidney Int Suppl 2012；2：1）において, 48時間以内のCr 0.3 mg/dL以上の上昇, 7日以内のCr 1.5倍以上の上昇, または尿量 0.5 mL/kg/hr未満が6時間以上持続, のいずれかを満たす場合に診断される. 本症例ではCrが〈ベースライン〉から〈入院時〉へ上昇しており, Stage 〈  〉に相当した.

AKIの原因鑑別においては, 腎前性（循環血液量減少, 心拍出量低下）, 腎性（ATN, 間質性腎炎, 糸球体腎炎）, 腎後性（尿路閉塞）の3カテゴリに分けて系統的に評価することが重要である. FENaは腎前性と腎性ATNの鑑別に有用であり, FENa < 1%は腎前性を, FENa > 2%は腎性ATNを示唆する（Espinel CH. JAMA 1976；236：579）.

本症例を通じて, AKIの早期診断におけるKDIGO基準の活用と, 原因鑑別における尿検査の重要性を学んだ.

（文献）
1. KDIGO. Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl 2012；2：1-138
2. Espinel CH. The FENa test: use in the differential diagnosis of acute renal failure. JAMA 1976；236：579-581`,
  },

  '糖尿病ケトアシドーシス': {
    courseAndDiscussion: `#1 糖尿病ケトアシドーシス

【経過】
来院時, 血糖 〈  〉 mg/dL, pH 〈  〉, HCO₃⁻ 〈  〉 mEq/L, AG 〈  〉, 血清ケトン体〈  〉 μmol/L, 尿ケトン〈強陽性〉であり, 糖尿病ケトアシドーシス（DKA）と診断した. 誘因として〈感染症/服薬中断/初発1型糖尿病〉が考えられた. 生理食塩水 〈1000 mL/hr〉で初期輸液を開始し, インスリン持続静注（0.1単位/kg/hr）を開始した. 血清K 〈  〉 mEq/Lであり, 〈K≧3.3: インスリンと並行してKCL補充を開始した / K<3.3: インスリン開始前にKCL補充を先行した〉. 第〈  〉病日にAG正常化（AG gap閉鎖）を確認し, 皮下インスリンへの切り替えを行った（静注中止の2時間前に皮下投与を重複）. 誘因の〈感染症治療〉も並行して行い, 第〈  〉病日に退院とした.

【考察】
本症例はDKAの3徴（高血糖, ケトン血症, 代謝性アシドーシス）を満たし, DKAと診断した. ADA 2024 Standards of Careに基づき, 輸液（初期は等張液, 血糖 200 mg/dL未満で5%ブドウ糖液を併用）, インスリン持続静注, カリウム補充の3本柱で治療を行った. DKA治療における最重要ポイントはAG gap閉鎖（AG正常化）をもってケトアシドーシスの是正を判断することであり, 血糖値の正常化のみでインスリンを中止してはならない. 脳浮腫予防のため, 血清Na補正値のモニタリングも重要である.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉の糖尿病ケトアシドーシス（DKA）の症例であり, 誘因は〈感染症/服薬中断/初発1型糖尿病〉であった.

DKAはインスリンの絶対的または相対的欠乏により引き起こされる急性代謝性合併症であり, 高血糖, ケトン血症, AG開大性代謝性アシドーシスを三徴とする. ADA 2024 Standards of Medical Care in Diabetesでは, DKAの治療として①積極的な輸液療法（初期は0.9%NaCl, 血糖200 mg/dL未満で5%ブドウ糖液併用）, ②インスリン持続静注（0.1-0.14単位/kg/hr）, ③カリウム補充（血清K 3.3-5.3 mEq/Lの場合, 20-30 mEq/Lの速度で補充）が推奨されている.

DKA治療におけるピットフォールとして, ①AG gap閉鎖前のインスリン中止（ケトアシドーシスの遷延）, ②低カリウム血症の見逃し（致死的不整脈のリスク）, ③急速な血漿浸透圧低下による脳浮腫（特に小児・若年者）が挙げられる. 本症例ではこれらに留意しながら治療を行い, 良好な転帰を得た.

本症例を通じて, DKA治療における系統的アプローチ（輸液→インスリン→カリウム）とAG gapモニタリングの重要性を学んだ.

（文献）
1. American Diabetes Association. Standards of Medical Care in Diabetes — 2024. Diabetes Care 2024；47(Suppl 1)
2. Kitabchi AE, et al. Hyperglycemic crises in adult patients with diabetes. Diabetes Care 2009；32：1335-1343`,
  },

  '心房細動': {
    courseAndDiscussion: `#1 心房細動（〈発作性/持続性/永続性〉）

【経過】
〈動悸/脈の不整/心不全症状〉を主訴に受診し, 12誘導心電図にて心房細動（〈心拍数 〈  〉/分〉）を確認した. 甲状腺機能は正常であった. CHA₂DS₂-VAScスコア 〈  〉点, HAS-BLEDスコア 〈  〉点と評価した. 心エコーにて左房径 〈  〉 mm, EF 〈  〉%であった. 〈レートコントロール: ビソプロロールフマル酸塩 〈  〉 mg/ジルチアゼム塩酸塩 〈  〉 mg を開始し, 安静時心拍数 < 110/分を目標とした / リズムコントロール: 電気的除細動/抗不整脈薬（〈フレカイニド/アミオダロン〉）を施行した〉. CHA₂DS₂-VAScスコアに基づき, 抗凝固療法として〈アピキサバン/リバーロキサバン/エドキサバン〉を開始した.

【考察】
本症例の心房細動は〈基礎心疾患/弁膜症/甲状腺機能亢進症/孤立性〉を背景としたものと考えられた. JCS/JHRS 2020 不整脈薬物治療ガイドラインに基づき, 脳梗塞予防のためCHA₂DS₂-VAScスコアによるリスク層別化を行い, 〈男性≧1点/女性≧2点〉であったため抗凝固療法を導入した. DOACは非弁膜症性心房細動においてワルファリンと比較し, 脳卒中予防効果は同等以上で大出血リスクが低いことが示されている. レートコントロールとリズムコントロールの選択についてはAFFIRM試験（Wyse DG, et al. N Engl J Med 2002；347：1825）を踏まえて判断した.`,

    overallDiscussion: `本症例は〈  〉歳〈男性/女性〉の〈発作性/持続性/永続性〉心房細動の症例である.

心房細動は最も頻度の高い不整脈であり, 脳梗塞・心不全のリスク因子である. 脳梗塞予防においてはCHA₂DS₂-VAScスコアに基づくリスク層別化が国際的に推奨されており（Lip GY, et al. Chest 2010；137：263-272）, 本症例ではスコア〈  〉点であったため抗凝固療法を開始した.

レートコントロール vs リズムコントロールの選択については, AFFIRM試験（Wyse DG, et al. N Engl J Med 2002；347：1825-1833）では両戦略に総死亡の差を認めなかったが, 近年のEAST-AFNET 4試験（Kirchhof P, et al. N Engl J Med 2020；383：1305）では, 早期のリズムコントロールが心血管イベントの減少と関連することが示されている.

本症例を通じて, 心房細動の包括的管理（脳梗塞予防, レート/リズムコントロール, 基礎疾患治療）の重要性を学んだ.

（文献）
1. Lip GY, et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation (CHA2DS2-VASc). Chest 2010；137：263-272
2. Kirchhof P, et al. Early Rhythm-Control Therapy in Patients with Atrial Fibrillation (EAST-AFNET 4). N Engl J Med 2020；383：1305-1316
3. 日本循環器学会/日本不整脈心電学会. 2020年改訂版 不整脈薬物治療ガイドライン`,
  },
}

/** 疾患名からリッチ考察テンプレートを取得 */
export function getRichDiscussion(disease: string): Omit<RichDiscussion, 'disease'> | undefined {
  // 完全一致
  if (RICH_DISCUSSIONS[disease]) return RICH_DISCUSSIONS[disease]
  // 部分一致
  for (const [key, value] of Object.entries(RICH_DISCUSSIONS)) {
    if (disease.includes(key.replace(/（.*）/, '')) || key.includes(disease)) return value
  }
  return undefined
}
