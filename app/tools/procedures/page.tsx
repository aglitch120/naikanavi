'use client'
import { useState } from 'react'
import Link from 'next/link'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

interface Procedure {
  id: string
  name: string
  icon: string
  category: string
  steps: string[]
  tips: string[]
  complications: string[]
  youtubeQuery: string
}

const PROCEDURES: Procedure[] = [
  {
    id: 'venipuncture', name: '採血（静脈採血）', icon: '💉', category: '基本手技',
    steps: [
      '患者確認（フルネーム + ID）、検査項目と採血管の照合',
      '手袋装着、駆血帯を穿刺部位から7-10cm中枢側に装着',
      '血管選択: 肘正中皮静脈 > 橈側皮静脈 > 尺側皮静脈。蒸しタオルで温めると怒張しやすい',
      'アルコール綿で中心→外側に円を描くように消毒、乾燥を待つ',
      '15-20°の角度で血管走行に沿って刺入。逆血を確認',
      '真空管: ホルダーに採血管を差し込み必要量採取。シリンジ: ゆっくり内筒を引く',
      '複数本の場合: 凝固管は2番目に。抗凝固剤入りスピッツは5回以上転倒混和',
      '採血管を外す → 駆血帯を外す → 抜針 → アルコール綿で圧迫',
      '5分以上圧迫止血（抗凝固薬服用中は長めに）。揉まない',
      '針はリキャップせず針廃棄BOXに直接廃棄',
    ],
    tips: ['クレンチング（グーパー）はK値に影響するため避ける', '駆血は1分以内。長いとデータに影響', '採血順序: 生化学→凝固→血算→血糖→その他'],
    complications: ['皮下血腫', '神経損傷（しびれ→即抜針）', '迷走神経反射（気分不良→足挙上+臥位）', '針刺し事故'],
    youtubeQuery: '採血 手技 手順 看護',
  },
  {
    id: 'abg', name: '動脈採血（ABG）', icon: '🔴', category: '基本手技',
    steps: [
      'Allen test: 橈骨動脈+尺骨動脈を両方圧迫→手が白くなる→尺骨動脈のみ解放→5秒以内に赤みが戻ればOK',
      '手関節を背屈位に固定（タオルを下に敷く）',
      '穿刺部位（橈骨動脈が第一選択）を消毒',
      'ヘパリン入りシリンジ（ABG専用）を準備。余分なヘパリンは排出',
      '橈骨動脈の拍動を触知し、45-60°の角度で穿刺',
      '動脈血は自然に逆流する（シリンジを引く必要なし）',
      '0.5-1mL採取後、抜針→即座にガーゼで5分以上圧迫',
      'シリンジ内の気泡を除去し、キャップで密封。氷上で速やかに検査へ',
      '抗凝固薬服用中は10分以上圧迫',
    ],
    tips: ['Allen test陰性→尺骨動脈側 or 上腕/大腿動脈を検討', '採取後30分以内に検査（室温放置でPaO2低下/PaCO2上昇）', '大腿動脈は仮性動脈瘤のリスクあり'],
    complications: ['血腫', '動脈攣縮', '仮性動脈瘤（大腿）', '感染', '神経損傷'],
    youtubeQuery: '動脈採血 手技 ABG',
  },
  {
    id: 'injection', name: '注射（皮下・筋注・静注）', icon: '💊', category: '基本手技',
    steps: [
      '【共通】6R確認: Right patient/drug/dose/route/time/documentation',
      '【皮下注射】上腕外側/大腿前面/腹部。10-30°で刺入。0.5-1mL以下',
      '【筋肉注射】三角筋（肩峰から3横指下）or 中殿筋（クラークの点 or 4分3分法）',
      '【筋注手技】90°で素早く刺入。逆血確認（血管内注入でない確認）→ゆっくり注入',
      '【静脈注射】静脈路確保後、フラッシュ確認→薬剤投与→フラッシュ',
      '【全て】注射後は刺入部をアルコール綿で軽く押さえ、絆創膏',
      '使用済み針はリキャップせず廃棄BOXへ',
    ],
    tips: ['筋注の三角筋: 腋窩神経の損傷回避のため肩峰から3横指下に', '中殿筋: 上殿神経・上殿動脈の回避が重要。坐骨神経を避けるためクラークの点', '皮下注射はインスリン・ヘパリンなど。同じ部位への反復は避ける（脂肪織変性）'],
    complications: ['神経損傷', '血管内誤注入', '感染', '硬結', 'アナフィラキシー'],
    youtubeQuery: '筋肉注射 手技 三角筋',
  },
  {
    id: 'intubation', name: '気道確保・気管内挿管', icon: '🫁', category: '救急・ICU',
    steps: [
      '適応判断: GCS≦8、気道防御反射消失、呼吸不全（NPPV無効）',
      '前酸素化: 100% O2で3-5分（または8回深呼吸）。SpO2を可能な限り上げる',
      '物品準備: 喉頭鏡（Mac/Miller）、チューブ（男性8.0、女性7.0-7.5）、スタイレット、BVM、吸引、カプノグラフィー',
      '体位: Sniffing position（後頭部挙上+頸部屈曲+頭部伸展）',
      '薬剤（RSI）: 鎮静（プロポフォール1-2mg/kg or ケタミン1-2mg/kg）+ 筋弛緩（ロクロニウム1.2mg/kg）',
      '喉頭展開: 右口角から喉頭鏡を挿入→舌を左に寄せながら進める→喉頭蓋を持ち上げる（Macは喉頭蓋谷に、Millerは喉頭蓋の裏面を直接挙上）',
      '声門を確認し、チューブを声帯間に通す。カフを声門下2-3cmに留置',
      'カフ注入（20-30cmH2O）→BVM換気→カプノグラフィーでETCO2確認',
      '聴診: 左右呼吸音+心窩部（食道挿管除外）。胸部X線で先端位置確認（気管分岐部上2-3cm）',
      '固定: テープ or チューブホルダーで固定。男性22cm/女性20cm（門歯基準）',
    ],
    tips: ['LEMON評価: L(look)/E(evaluate 3-3-2)/M(Mallampati)/O(obstruction)/N(neck mobility)で挿管困難を予測', 'Plan B: ビデオ喉頭鏡、声門上器具（i-gel/LMA）、外科的気道確保（輪状甲状靭帯切開）', 'RSI後は必ずカプノグラフィーで確認。聴診のみでは不十分'],
    complications: ['食道挿管（最も危険）', '片肺挿管（右主気管支が多い）', '歯牙損傷', '喉頭・気管損傷', '低酸素', '嘔吐・誤嚥'],
    youtubeQuery: '気管挿管 手技 RSI 喉頭鏡',
  },
  {
    id: 'cvc', name: '中心静脈カテーテル（CVC）', icon: '🔵', category: '救急・ICU',
    steps: [
      '適応: 末梢確保困難、昇圧剤/高カロリー輸液/高浸透圧薬の投与、CVP測定',
      '穿刺部位: 内頸静脈（推奨）> 鎖骨下静脈 > 大腿静脈',
      'エコーガイド下穿刺（推奨: 合併症↓、成功率↑）',
      'Maximal barrier precaution: キャップ+マスク+ガウン+大型ドレープ+手袋',
      '【内頸静脈】頭低位(Trendelenburg)→エコーで内頸静脈を確認（総頸動脈の外側）→局所麻酔→エコーガイド下穿刺',
      'Seldinger法: 穿刺針→ガイドワイヤー挿入→針を抜去→ダイレーター→カテーテル挿入→ガイドワイヤー抜去',
      'ガイドワイヤーの長さをモニター上で確認（心房内に入りすぎない）',
      'カテーテル固定→各ルーメンから逆血確認→輸液接続',
      '胸部X線でカテーテル先端位置を確認（上大静脈/右房接合部付近が理想）',
      '気胸がないことも確認（特に鎖骨下穿刺時）',
    ],
    tips: ['エコーガイド下が標準。ランドマーク法は非推奨', 'ガイドワイヤーは常に視認/把持。体内に迷入させない', 'CLABSI予防: 日常的にカテーテルの必要性を評価し、不要なら早期抜去'],
    complications: ['気胸（鎖骨下静脈で多い）', '動脈穿刺', '空気塞栓', '不整脈（ワイヤーが右心房に触れる）', 'CRBSI（カテーテル関連血流感染）'],
    youtubeQuery: '中心静脈カテーテル 内頸静脈 エコーガイド',
  },
  {
    id: 'arterial-line', name: '動脈ライン（Aライン）', icon: '📈', category: '救急・ICU',
    steps: [
      '適応: 持続的血圧モニタリング、頻回のABG採取が必要な場合',
      'Allen test（採血と同様）→ 陽性なら穿刺可',
      '手関節を20-30°背屈に固定（テープ or 砂袋）',
      '橈骨動脈の拍動を触知、穿刺部位を消毒',
      '20G動脈カテーテルを15-30°で刺入。フラッシュバック（拍動性の逆血）確認',
      'カテーテルを少し進めてから内筒を抜去。外套を留置',
      '圧トランスデューサーに接続。波形を確認（動脈波形: 急峻な立ち上がり+dicrotic notch）',
      'ゼロ校正（phlebostatic axisの高さで大気開放→ゼロ点設定）',
      'カテーテルをしっかり固定（テープ+縫合）',
    ],
    tips: ['エコーガイド下穿刺で成功率↑', '橈骨動脈が不可なら: 足背動脈 > 上腕動脈 > 大腿動脈', 'ヘパリン加生食（2U/mL）で持続フラッシュ'],
    complications: ['血腫', '動脈攣縮', '末梢虚血（Allen test重要）', '仮性動脈瘤', '感染', '血栓'],
    youtubeQuery: '動脈ライン Aライン 橈骨動脈 留置',
  },
  {
    id: 'bone-marrow', name: '骨髄穿刺', icon: '🦴', category: '検査手技',
    steps: [
      '適応: 血液疾患の診断（白血病/MDS/骨髄腫等）、原因不明の血球減少',
      '穿刺部位: 後腸骨稜（最も一般的）> 胸骨（成人、稀に使用）',
      '側臥位 or 腹臥位。穿刺部位を消毒しドレーピング',
      '局所麻酔: 皮膚→皮下→骨膜まで十分にリドカイン浸潤（骨膜が最も痛い）',
      '骨髄穿刺針を骨に垂直に刺入→回転しながら進める→骨皮質を貫通した「抵抗の消失」を感じる',
      '内筒を抜去→シリンジを接続→素早く吸引（この瞬間が最も痛い: 事前に説明）',
      '骨髄液0.3-0.5mL採取（それ以上は末梢血の混入↑）→スライドに塗抹',
      '生検（trephine biopsy）: 必要に応じて骨髄生検針で円柱状の骨髄組織を採取',
      '抜針→圧迫止血5-10分→絆創膏・ガーゼ固定',
    ],
    tips: ['吸引時の痛みは予告しておく（患者の信頼維持に重要）', '血液凝固障害がある場合は止血に十分注意', '採取後すぐにスライド作製（凝固すると評価困難）'],
    complications: ['出血・血腫', '感染', '骨折（胸骨穿刺で縦隔穿通のリスク）', '穿刺部疼痛'],
    youtubeQuery: '骨髄穿刺 手技 後腸骨稜',
  },
  {
    id: 'lumbar-puncture', name: '腰椎穿刺', icon: '💧', category: '検査手技',
    steps: [
      '適応: 髄膜炎疑い、SAH疑い（CT陰性時）、MS/GBS診断、髄液圧測定',
      '禁忌確認: 頭蓋内占拠性病変（脳ヘルニアリスク）→先にCT。凝固障害。穿刺部感染',
      '体位: 側臥位でエビのように丸まる（膝を胸に引き付ける）or 座位',
      '穿刺部位: L3/4 or L4/5（Jacoby線: 両側腸骨稜を結ぶ線 ≈ L4棘突起）',
      '十分な消毒+局所麻酔（皮膚→皮下→棘間靭帯→黄色靭帯）',
      'スパイナル針（22G）を正中から少し頭側に向けて刺入',
      '棘間靭帯→黄色靭帯→硬膜の抵抗消失（pop感）を確認',
      '内筒を抜去→髄液が滴下。初圧をマノメーターで測定（正常: 60-180mmH2O）',
      '髄液採取: 通常4本に各1-2mL（①細胞数/蛋白/糖、②培養/グラム染色、③特殊検査、④保存）',
      '終圧測定→抜針→絆創膏。穿刺後は1-2時間安静（頭痛予防のエビデンスは弱い）',
    ],
    tips: ['atraumatic needle（Sprotte/Whitacre）でpost-LP headache↓', '髄液検査にはペア血糖も同時採取', '血性髄液: 外傷性穿刺 vs SAH→4本目で血液がクリアになれば外傷性'],
    complications: ['穿刺後頭痛（10-30%: caffeine/blood patch）', '脳ヘルニア（占拠性病変の除外が重要）', '感染', '出血/硬膜下血腫', '腰背部痛'],
    youtubeQuery: '腰椎穿刺 手技 ルンバール',
  },
  {
    id: 'ng-tube', name: '胃管挿入（NGチューブ）', icon: '🟡', category: '消化器手技',
    steps: [
      '適応: 胃内容物の減圧（イレウス）、胃洗浄、経管栄養',
      'チューブの長さ測定: 鼻尖→耳朶→剣状突起（NEX法、約50-55cm）。マーキング',
      '患者を座位 or ファウラー位にし、片方の鼻孔を選択',
      'チューブ先端に潤滑ゼリーを塗布',
      '鼻孔から挿入→下鼻道に沿って水平に進める（上方に向けない）',
      '咽頭到達時（約15cm）に嚥下を促す: 「ゴクンと飲み込んでください」',
      '嚥下のタイミングに合わせてチューブを進める（NV距離まで）',
      '位置確認: ①シリンジで胃液を吸引（pH≦5）、②聴診（空気注入で心窩部にグル音）',
      '※聴診のみでは不十分 → X線で先端位置確認が最も確実',
      'テープで鼻翼に固定。チューブの折れ・ねじれがないか確認',
    ],
    tips: ['嚥下反射がある患者: 水を少量含んでもらい、飲み込む動作と同時に進めると通りやすい', '経鼻挿入困難→経口ルートを検討', '食道裂孔ヘルニアの既往がある場合は注意（食道に留まりやすい）'],
    complications: ['気管内誤挿入（最も重要: X線確認が必須）', '鼻出血', '食道/胃穿孔（特に食道狭窄部）', '誤嚥', '副鼻腔炎（長期留置）'],
    youtubeQuery: '胃管挿入 NGチューブ 手技',
  },
  {
    id: 'gastric-lavage', name: '胃洗浄', icon: '🟢', category: '消化器手技',
    steps: [
      '適応: 薬物中毒（服用1時間以内が原則）。致死量の毒物摂取時に検討',
      '禁忌: 腐食性物質（酸/アルカリ）、石油製品、痙攣リスク高い物質（気道確保なしの場合）、消化管穿孔',
      '気道保護: 意識低下時は挿管してから行う（誤嚥予防）',
      '左側臥位+頭低位（Trendelenburg）: 胃内容物の通過と誤嚥リスクを減少',
      '太い胃管（36-40Fr）を経口挿入。位置確認',
      '微温水（37℃前後）200-300mLを注入→排液をカウント・観察',
      '排液が清明になるまで繰り返す（通常5-10L程度）',
      '洗浄後: 活性炭 50g（1g/kg）を胃管から注入（毒物吸着）',
      '胃管抜去。バイタルサイン・意識レベルを継続監視',
    ],
    tips: ['注入量>排液量の場合は胃内容が腸管に流れている→追加の排液努力', '活性炭が無効: リチウム、鉄、アルコール、シアン、腐食性物質', '現在は胃洗浄の適応は限定的: 活性炭単独or全腸洗浄が主流'],
    complications: ['誤嚥性肺炎', '食道/胃穿孔', '低体温（大量の洗浄液）', '電解質異常', '不整脈（迷走神経反射）'],
    youtubeQuery: '胃洗浄 手技 中毒',
  },
  {
    id: 'urinary-catheter', name: '尿道カテーテル', icon: '🚿', category: '基本手技',
    steps: [
      '適応: 尿閉、正確な尿量測定（重症患者）、手術、血尿の持続灌流',
      '【男性】陰茎を90°に保持しカテーテルをゆっくり挿入（16-18Fr）',
      '前立腺部で抵抗を感じたら→陰茎を下腹部方向に倒しながら進める',
      '尿の流出を確認後、さらに5cm程度進めてからバルーン注入（10mL蒸留水）',
      '【女性】仰臥位で膝を屈曲・開脚。陰唇を開き外尿道口を確認（12-14Fr）',
      '尿道口にカテーテルをゆっくり挿入。尿の流出を確認後バルーン注入',
      '軽く引いて抵抗を感じれば膀胱頸部に留置されている',
      '蓄尿バッグを膀胱より低い位置に固定',
      '清潔操作: 滅菌手袋、消毒液で尿道口周囲を消毒。潤滑ゼリー使用',
    ],
    tips: ['男性で挿入困難→リドカインゼリーを尿道内に注入し数分待つ', '前立腺肥大で困難→Coudéカテーテル or 膀胱上穿刺', 'CAUTI予防: 不要なカテーテルは毎日評価→早期抜去'],
    complications: ['尿道損傷/出血', 'CAUTI（カテーテル関連尿路感染）', 'バルーン膨張による尿道損傷（尿道内で膨張）', '尿道狭窄（長期留置後）'],
    youtubeQuery: '尿道カテーテル 留置 手技',
  },
  {
    id: 'enema', name: '浣腸', icon: '💧', category: '消化器手技',
    steps: [
      '適応: 便秘、術前処置、薬剤投与（座薬無効時）',
      '禁忌: 腸管穿孔/穿孔疑い、急性腹症、直腸手術直後',
      'グリセリン浣腸液（60-120mL）を人肌に温める（約40℃。冷たいと腸管攣縮）',
      '左側臥位（下行結腸が下になり液が流入しやすい）',
      'チューブ先端に潤滑ゼリーを塗布。肛門に5-6cm挿入（直腸壁に沿わせて）',
      'ゆっくり注入（急速注入は腸管攣縮・穿孔リスク）',
      '注入後3-10分保持してから排便を促す',
      '排便量・性状・混入物を観察。バイタル確認',
    ],
    tips: ['高齢者は腸管壁が脆弱→穿孔リスクに注意。挿入は愛護的に', '直腸内に硬便が触知される場合は用手摘便を先に検討', 'グリセリン浣腸の体内温度が高すぎると直腸粘膜熱傷のリスク'],
    complications: ['腸管穿孔（特に高齢者/ステロイド使用中）', '迷走神経反射（徐脈/血圧低下）', '電解質異常（大量/頻回使用時）', '直腸粘膜損傷'],
    youtubeQuery: '浣腸 手技 看護',
  },
  {
    id: 'chest-drain', name: '胸腔ドレーン', icon: '🫁', category: '救急・ICU',
    steps: [
      '適応: 気胸（中等度以上/緊張性）、大量胸水、血胸、膿胸',
      '穿刺部位: 中腋窩線〜前腋窩線の第4-5肋間（safe triangle）',
      '半座位 or 仰臥位。エコーで胸水の位置を確認（可能なら）',
      '十分な消毒+ドレーピング。局所麻酔（皮膚→皮下→肋間筋→壁側胸膜）',
      '肋骨上縁に沿って皮膚切開（2-3cm）。ペアン鉗子で鈍的に肋間筋を剥離',
      '壁側胸膜を鈍的に穿破（指 or ペアン）。指を挿入して肺/癒着の確認',
      '胸腔ドレーン（成人: 24-32Fr）をクランプした状態で挿入。気胸→上方へ、胸水→下後方へ誘導',
      'ドレーンの側孔が全て胸腔内にあることを確認',
      '絹糸で固定縫合。水封ドレーンに接続（-10〜-20cmH2O）',
      '呼吸性変動（呼吸に合わせた水位の変動）を確認。胸部X線でドレーン位置確認',
    ],
    tips: ['safe triangle: 大胸筋外側縁、広背筋外側縁、乳頭ライン（第5肋間）で囲まれた三角', 'トロッカー法は臓器損傷リスク高い→鈍的剥離法推奨', '呼吸性変動がない→ドレーン閉塞/肺が膨張完了の可能性'],
    complications: ['臓器損傷（肺/肝/脾/横隔膜）', '出血（肋間動脈損傷）', '皮下気腫', '再膨張性肺水腫（大量排液後）', '感染'],
    youtubeQuery: '胸腔ドレーン 挿入 手技',
  },
  {
    id: 'abdominal-drain', name: '腹腔ドレーン（腹腔穿刺）', icon: '🩺', category: '消化器手技',
    steps: [
      '適応: 腹水の診断的穿刺、緊張性腹水の排液、腹膜炎の排液',
      '穿刺部位: 左下腹部（McBurney点の対側）が推奨。エコーで腹水を確認+腸管/血管を避ける',
      '膀胱を空にしておく（カテ留置 or 排尿確認）',
      '消毒+局所麻酔。Z-tracking technique（皮膚を引いてから穿刺→抜針後の漏出防止）',
      '穿刺針 or カテーテル（14-16G）をエコーガイド下で刺入',
      '腹水を吸引: 診断的→30-60mL（細胞数/蛋白/Alb/培養/LDH/Glu/TP）、治療的→大量排液',
      '大量排液: 5L以上→アルブミン補充（6-8g/L排液ごと）で循環不全予防',
      '抜針→圧迫・ガーゼ固定。排液量・性状を記録',
      '腹水検査: SAAG（血清-腹水Alb差）≧1.1→門脈圧亢進性。細胞数>250/μL PMN→SBP疑い',
    ],
    tips: ['エコーガイド下が標準→穿刺成功率↑、合併症↓', 'SBP疑い: 培養は血液培養ボトルに直接接種（感度↑）', '大量排液後のアルブミン補充を忘れない（循環虚脱予防）'],
    complications: ['腸管穿孔', '出血（腹壁動脈/腸間膜血管）', '腹水漏出', '循環虚脱（大量排液時）', '感染/腹膜炎'],
    youtubeQuery: '腹腔穿刺 腹水 手技 エコーガイド',
  },
  {
    id: 'pericardiocentesis', name: '心嚢ドレナージ（心嚢穿刺）', icon: '❤️', category: '救急・ICU',
    steps: [
      '適応: 心タンポナーデ（Beck 3徴: 低血圧+頸静脈怒張+心音減弱）',
      '心エコーで心嚢液の量と最適な穿刺部位を確認',
      '半座位（心嚢液が心尖部に集まりやすい）。持続心電図モニタリング',
      '【剣状突起下アプローチ（Marfanアプローチ）】剣状突起の左側から',
      '局所麻酔後、16-18G穿刺針を45°で頭側・左肩方向に向けて刺入',
      'エコーガイド下で穿刺するのが最も安全',
      '心嚢液の吸引を確認→ガイドワイヤー挿入→ダイレーター→ドレーンカテーテル留置',
      '少量（20-50mL）の排液でも血行動態が劇的に改善することがある',
      '排液を検査に提出（細胞診/培養/蛋白/LDH/Glu）。ドレーンは持続排液 or クランプ管理',
      '心エコーで残存心嚢液を確認。バイタル安定を確認',
    ],
    tips: ['緊急時は心エコーで確認後すぐに穿刺。CTまで待たない', '穿刺時にST上昇が出現したら心筋に触れている→少し引き戻す', '外傷性タンポナーデは穿刺では不十分な場合が多い→開胸術の準備を並行'],
    complications: ['心筋穿刺/損傷', '冠動脈損傷', '不整脈', '気胸', '感染', '死亡（稀だが最重症の合併症）'],
    youtubeQuery: '心嚢穿刺 心タンポナーデ ドレナージ',
  },
]

const CATEGORIES = ['基本手技', '救急・ICU', '検査手技', '消化器手技']

export default function ProceduresPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('')

  const filtered = filterCat ? PROCEDURES.filter(p => p.category === filterCat) : PROCEDURES

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>手技ガイド</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-tx mb-1">手技ガイド</h1>
            <p className="text-sm text-muted">15手技の手順・コツ・合併症を確認。タップで展開、動画リンク付き。</p>
          </div>
          <ProPulseHint><FavoriteButton slug="app-procedures" title="手技ガイド" href="/tools/procedures" type="app" /></ProPulseHint>
        </div>
      </header>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${!filterCat ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'}`}>
          すべて ({PROCEDURES.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = PROCEDURES.filter(p => p.category === cat).length
          return (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${filterCat === cat ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'}`}>
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* 手技リスト */}
      <div className="space-y-2">
        {filtered.map(proc => {
          const isOpen = openId === proc.id
          return (
            <div key={proc.id} className="bg-s0 border border-br rounded-xl overflow-hidden transition-all">
              <button onClick={() => setOpenId(isOpen ? null : proc.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-s1/30 transition-colors">
                <span className="text-lg flex-shrink-0">{proc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-tx">{proc.name}</p>
                  <p className="text-[10px] text-muted">{proc.category} · {proc.steps.length}ステップ</p>
                </div>
                <svg className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-br pt-3 space-y-4">
                  {/* 手順 */}
                  <div>
                    <h3 className="text-xs font-bold text-tx mb-2 flex items-center gap-1">
                      <span className="text-ac">📋</span> 手順
                    </h3>
                    <ol className="space-y-1.5">
                      {proc.steps.map((step, i) => (
                        <li key={i} className="text-xs text-tx/80 leading-relaxed flex gap-2">
                          <span className="text-ac font-mono font-bold flex-shrink-0 mt-0.5 w-5 text-right">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* コツ */}
                  <div className="bg-acl/50 rounded-lg p-3">
                    <h3 className="text-xs font-bold text-ac mb-1.5">💡 Tips & コツ</h3>
                    <ul className="space-y-1">
                      {proc.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-tx/80 leading-relaxed flex gap-2">
                          <span className="text-ac flex-shrink-0 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 合併症 */}
                  <div className="bg-wnl/50 rounded-lg p-3">
                    <h3 className="text-xs font-bold text-wn mb-1.5">⚠️ 合併症</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {proc.complications.map((comp, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-white/60 text-wn border border-wnb/30">{comp}</span>
                      ))}
                    </div>
                  </div>

                  {/* YouTube動画リンク */}
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(proc.youtubeQuery)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-br bg-s1/50 hover:bg-s1 transition-colors group">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-tx group-hover:text-ac transition-colors">YouTubeで手技動画を見る</p>
                      <p className="text-[10px] text-muted truncate">{proc.youtubeQuery}</p>
                    </div>
                    <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mt-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ガイドは手技の手順を学習目的で提供するものです。実際の手技は必ず指導医の監督下で行ってください。施設のプロトコルを優先してください。</p>
      </div>
    </main>
  )
}
