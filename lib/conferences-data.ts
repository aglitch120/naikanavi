// ═══════════════════════════════════════════════════════════════
//  学会カレンダー マスターデータ
//  基本領域19学会 + サブスペシャルティ + 主要学会
//  2026年度（各学会公式HP確認済み 2026-03-21）
// ═══════════════════════════════════════════════════════════════

export interface Conference {
  id: string
  society: string
  societyShort: string
  specialtyArea: string
  /** 'basic': 基本領域19学会, 'sub': サブスペシャルティ, 'major': その他主要学会 */
  tier: 'basic' | 'sub' | 'major'
  meetingName: string
  theme?: string
  president?: string
  presidentAffiliation?: string
  startDate: string
  endDate: string
  venue: string
  city: string
  url?: string
  year: number
  estimated?: boolean  // 日程未確定（例年の傾向から推定）
  meetingType?: 'annual' | 'regional' | 'seminar'  // 年次総会 / 地方会 / セミナー
}

// 診療科カテゴリ色（カレンダー表示用）
export const SPECIALTY_COLORS: Record<string, string> = {
  '内科系': '#059669',
  '外科系': '#2563EB',
  'その他': '#6B7280',
}

export function getSpecialtyCategory(area: string): string {
  const naika = ['内科', '精神科', '皮膚科', '小児科', '放射線科', '臨床検査', '病理', '総合診療', '循環器', '消化器', '呼吸器', '腎臓', '血液', '内分泌', '糖尿病', '神経内科', '感染症', 'アレルギー', 'リウマチ', '老年病', '肝臓', '腫瘍内科']
  const geka = ['外科', '整形外科', '脳神経外科', '形成外科', '産婦人科', '泌尿器科', '眼科', '耳鼻咽喉科', '消化器外科', '呼吸器外科', '心臓血管外科', '小児外科', '乳腺外科']
  if (naika.includes(area)) return '内科系'
  if (geka.includes(area)) return '外科系'
  return 'その他'
}

export const TIER_LABELS: Record<string, string> = {
  basic: '基本領域',
  sub: 'サブスペシャルティ',
  major: '主要学会',
}

export const CONFERENCES_2026: Conference[] = [
  // ═══════════════════════════════════════
  //  基本領域 19学会（専門医機構認定）
  // ═══════════════════════════════════════

  // ── 2月 ──
  // （なし）

  // ── 3月 ──
  { id: 'junkanki-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic',
    meetingName: '第90回日本循環器学会学術集会（JCS2026）', theme: '社会を拓く新循環器学', president: '野出 孝一', presidentAffiliation: '佐賀大学',
    startDate: '2026-03-20', endDate: '2026-03-22', venue: '福岡国際会議場/福岡サンパレス/マリンメッセ福岡', city: '福岡', url: 'https://www.congre.co.jp/jcs2026/', year: 2026 },

  // ── 4月 ──
  { id: 'ganka-2026', society: '日本眼科学会', societyShort: '眼科', specialtyArea: '眼科', tier: 'basic',
    meetingName: '第130回日本眼科学会総会', president: '園田 康平', presidentAffiliation: '九州大学',
    startDate: '2026-04-09', endDate: '2026-04-12', venue: '福岡国際会議場/マリンメッセ福岡', city: '福岡', url: 'https://www.congre.co.jp/130jos/', year: 2026 },
  { id: 'naika-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic',
    meetingName: '第123回日本内科学会総会・講演会', theme: '包摂する内科学', president: '張替 秀郎', presidentAffiliation: '東北大学',
    startDate: '2026-04-10', endDate: '2026-04-12', venue: '東京国際フォーラム', city: '東京', url: 'https://www.naika.or.jp/meeting/123-info/', year: 2026 },
  { id: 'hoshasen-2026', society: '日本医学放射線学会', societyShort: '放射線科', specialtyArea: '放射線科', tier: 'basic',
    meetingName: '第85回日本医学放射線学会総会（JRC2026）', theme: 'Radiology Connectome', president: '阿部 修', presidentAffiliation: '東京大学',
    startDate: '2026-04-16', endDate: '2026-04-19', venue: 'パシフィコ横浜', city: '横浜', url: 'https://site2.convention.co.jp/jrs85/', year: 2026 },
  { id: 'byori-2026', society: '日本病理学会', societyShort: '病理', specialtyArea: '病理', tier: 'basic',
    meetingName: '第115回日本病理学会総会', theme: 'Pathologists, be ambitious!', president: '田中 伸哉', presidentAffiliation: '北海道大学',
    startDate: '2026-04-16', endDate: '2026-04-18', venue: 'グランドメルキュール札幌大通公園', city: '札幌', url: 'https://www.congre.co.jp/115jsp/', year: 2026 },
  { id: 'shonika-2026', society: '日本小児科学会', societyShort: '小児科', specialtyArea: '小児科', tier: 'basic',
    meetingName: '第129回日本小児科学会学術集会', theme: 'No dream, No success!', president: '長谷川 俊史', presidentAffiliation: '山口大学',
    startDate: '2026-04-17', endDate: '2026-04-19', venue: '海峡メッセ下関', city: '下関', url: 'https://site2.convention.co.jp/129jps/', year: 2026 },
  { id: 'keisei-2026', society: '日本形成外科学会', societyShort: '形成外科', specialtyArea: '形成外科', tier: 'basic',
    meetingName: '第69回日本形成外科学会総会・学術集会', president: '橋本 一郎', presidentAffiliation: '徳島大学',
    startDate: '2026-04-22', endDate: '2026-04-24', venue: 'あわぎんホール', city: '徳島', url: 'https://convention.jtbcom.co.jp/jsprs69/', year: 2026 },
  { id: 'geka-2026', society: '日本外科学会', societyShort: '外科', specialtyArea: '外科', tier: 'basic',
    meetingName: '第126回日本外科学会定期学術集会', theme: '新たなる外科医療の共創', president: '平野 聡', presidentAffiliation: '北海道大学',
    startDate: '2026-04-23', endDate: '2026-04-25', venue: '京王プラザホテル札幌他', city: '札幌', url: 'https://www.jssoc.or.jp/jss126/', year: 2026 },
  { id: 'hinyokika-2026', society: '日本泌尿器科学会', societyShort: '泌尿器科', specialtyArea: '泌尿器科', tier: 'basic',
    meetingName: '第113回日本泌尿器科学会総会', theme: '愛と叡智の結晶', president: '浮村 理', presidentAffiliation: '京都府立医科大学',
    startDate: '2026-04-23', endDate: '2026-04-26', venue: '国立京都国際会館', city: '京都', url: 'https://www.c-linkage.co.jp/jua2026/', year: 2026 },

  // ── 5月 ──
  { id: 'sanfujinka-2026', society: '日本産科婦人科学会', societyShort: '産婦人科', specialtyArea: '産婦人科', tier: 'basic',
    meetingName: '第78回日本産科婦人科学会学術講演会', president: '渡利 英道', presidentAffiliation: '北海道大学',
    startDate: '2026-05-15', endDate: '2026-05-17', venue: 'グランドメルキュール札幌大通公園他', city: '札幌', url: 'https://www.congre.co.jp/jsog2026/', year: 2026 },
  { id: 'jibika-2026', society: '日本耳鼻咽喉科頭頸部外科学会', societyShort: '耳鼻咽喉科', specialtyArea: '耳鼻咽喉科', tier: 'basic',
    meetingName: '第127回日本耳鼻咽喉科頭頸部外科学会総会・学術講演会', president: '香取 幸夫', presidentAffiliation: '東北大学',
    startDate: '2026-05-20', endDate: '2026-05-23', venue: '東北大学百周年記念館/仙台国際センター', city: '仙台', url: 'https://www.congre.co.jp/jibika127/', year: 2026 },
  { id: 'seikei-2026', society: '日本整形外科学会', societyShort: '整形外科', specialtyArea: '整形外科', tier: 'basic',
    meetingName: '第99回日本整形外科学会学術総会', president: '田中 栄', presidentAffiliation: '東京大学',
    startDate: '2026-05-21', endDate: '2026-05-24', venue: '神戸コンベンションセンター', city: '神戸', url: 'https://www.congre.co.jp/joa2026/', year: 2026 },
  { id: 'masui-2026', society: '日本麻酔科学会', societyShort: '麻酔科', specialtyArea: '麻酔科', tier: 'basic',
    meetingName: '第73回日本麻酔科学会学術集会', president: '山蔭 道明', presidentAffiliation: '札幌医科大学',
    startDate: '2026-05-21', endDate: '2026-05-23', venue: 'パシフィコ横浜', city: '横浜', url: 'https://73rd.anesth-meeting.org/', year: 2026 },
  { id: 'sogo-shinryo-2026', society: '日本プライマリ・ケア連合学会', societyShort: '総合診療', specialtyArea: '総合診療', tier: 'basic',
    meetingName: '第17回日本プライマリ・ケア連合学会学術大会', theme: 'つながる、つなげる。', president: '鈴木 富雄', presidentAffiliation: '大阪医科薬科大学',
    startDate: '2026-05-29', endDate: '2026-05-31', venue: '国立京都国際会館', city: '京都', url: 'https://jpca2026.jp/', year: 2026 },

  // ── 6月 ──
  { id: 'riha-2026', society: '日本リハビリテーション医学会', societyShort: 'リハビリ', specialtyArea: 'リハビリ', tier: 'basic',
    meetingName: '第63回日本リハビリテーション医学会学術集会', president: '佐伯 覚', presidentAffiliation: '産業医科大学',
    startDate: '2026-06-04', endDate: '2026-06-07', venue: '福岡国際会議場/マリンメッセ福岡B', city: '福岡', url: 'https://www.congre.co.jp/63jarm2026/', year: 2026 },
  { id: 'hifuka-2026', society: '日本皮膚科学会', societyShort: '皮膚科', specialtyArea: '皮膚科', tier: 'basic',
    meetingName: '第125回日本皮膚科学会総会', president: '奥山 隆平', presidentAffiliation: '信州大学',
    startDate: '2026-06-11', endDate: '2026-06-14', venue: '国立京都国際会館', city: '京都', url: 'https://jda125.jda-conv.jp/', year: 2026 },
  { id: 'seishin-2026', society: '日本精神神経学会', societyShort: '精神科', specialtyArea: '精神科', tier: 'basic',
    meetingName: '第122回日本精神神経学会学術総会', theme: '社会の中の精神医療', president: '水野 雅文', presidentAffiliation: '東京都立松沢病院',
    startDate: '2026-06-18', endDate: '2026-06-20', venue: 'パシフィコ横浜ノース', city: '横浜', url: 'https://www.congre.co.jp/jspn122/', year: 2026 },

  // ── 10月 ──
  { id: 'noshinkei-2026', society: '日本脳神経外科学会', societyShort: '脳神経外科', specialtyArea: '脳神経外科', tier: 'basic',
    meetingName: '第85回日本脳神経外科学会学術総会', theme: 'VISION OF NEUROSURGERY', president: '三國 信啓', presidentAffiliation: '札幌医科大学',
    startDate: '2026-10-21', endDate: '2026-10-23', venue: '札幌文化芸術劇場hitaru', city: '札幌', url: 'https://www.congre.co.jp/jns2026/', year: 2026 },
  { id: 'kyukyu-2026', society: '日本救急医学会', societyShort: '救急科', specialtyArea: '救急科', tier: 'basic',
    meetingName: '第54回日本救急医学会総会・学術集会', president: '田﨑 修', presidentAffiliation: '長崎大学病院',
    startDate: '2026-10-27', endDate: '2026-10-29', venue: '出島メッセ長崎', city: '長崎', url: 'https://site2.convention.co.jp/jaam54/', year: 2026 },

  // ── 12月 ──
  { id: 'rinsho-kensa-2026', society: '日本臨床検査医学会', societyShort: '臨床検査', specialtyArea: '臨床検査', tier: 'basic',
    meetingName: '第73回日本臨床検査医学会学術集会', theme: 'プラネタリーヘルスへと進む新時代への医療', president: '吉田 博', presidentAffiliation: '東京慈恵会医科大学',
    startDate: '2026-12-17', endDate: '2026-12-20', venue: '幕張メッセ', city: '千葉', url: 'https://square.umin.ac.jp/jslm73/', year: 2026 },

  // ═══════════════════════════════════════
  //  サブスペシャルティ領域学会
  // ═══════════════════════════════════════

  // 心臓血管外科
  { id: 'shinzou-geka-2026', society: '日本心臓血管外科学会', societyShort: '心臓血管外科', specialtyArea: '心臓血管外科', tier: 'sub',
    meetingName: '第56回日本心臓血管外科学会学術総会', president: '松宮 護郎', presidentAffiliation: '千葉大学',
    startDate: '2026-02-21', endDate: '2026-02-23', venue: '幕張メッセ', city: '千葉', url: 'https://www.congre.co.jp/jscvs2026/', year: 2026 },

  // 集中治療
  { id: 'icu-2026', society: '日本集中治療医学会', societyShort: '集中治療', specialtyArea: '集中治療', tier: 'sub',
    meetingName: '第53回日本集中治療医学会学術集会', theme: 'TO BE HAPPY', president: '佐藤 直樹',
    startDate: '2026-03-05', endDate: '2026-03-07', venue: 'パシフィコ横浜', city: '横浜', url: 'https://www.jsicm.org/meeting/jsicm53/', year: 2026 },

  // 臨床腫瘍
  { id: 'jsmo-2026', society: '日本臨床腫瘍学会', societyShort: '腫瘍内科', specialtyArea: '腫瘍内科', tier: 'sub',
    meetingName: '第23回日本臨床腫瘍学会学術集会（JSMO2026）', president: '田村 研治', presidentAffiliation: '島根大学',
    startDate: '2026-03-26', endDate: '2026-03-28', venue: 'パシフィコ横浜ノース', city: '横浜', url: 'https://www.congre.co.jp/jsmo2026/', year: 2026 },

  // 腎臓（WCN2026と合同）
  { id: 'jinzou-2026', society: '日本腎臓学会', societyShort: '腎臓', specialtyArea: '腎臓', tier: 'sub',
    meetingName: 'WCN2026 / 第69回日本腎臓学会学術総会',
    startDate: '2026-03-28', endDate: '2026-03-31', venue: 'パシフィコ横浜', city: '横浜', year: 2026 },

  // 消化器病
  { id: 'shoukaki-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub',
    meetingName: '第112回日本消化器病学会総会', president: '中本 安成', presidentAffiliation: '福井大学',
    startDate: '2026-04-16', endDate: '2026-04-18', venue: 'コートヤード・バイ・マリオット福井他', city: '福井/金沢', url: 'https://site2.convention.co.jp/112jsge/', year: 2026 },

  // 呼吸器
  { id: 'kokyuuki-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub',
    meetingName: '第66回日本呼吸器学会学術講演会', theme: 'Weaving the Future', president: '花岡 正幸', presidentAffiliation: '信州大学',
    startDate: '2026-04-17', endDate: '2026-04-19', venue: '神戸国際会議場/神戸国際展示場', city: '神戸', url: 'https://www.jrs.or.jp/jrs66/', year: 2026 },

  // リウマチ
  { id: 'ryumachi-2026', society: '日本リウマチ学会', societyShort: 'リウマチ', specialtyArea: 'リウマチ', tier: 'sub',
    meetingName: '第70回日本リウマチ学会総会・学術集会', president: '渥美 達也', presidentAffiliation: '北海道大学',
    startDate: '2026-04-22', endDate: '2026-04-24', venue: '福岡国際会議場/福岡サンパレス', city: '福岡', url: 'https://www.jcr2026.com/', year: 2026 },

  // 消化器内視鏡
  { id: 'naishikyo-2026', society: '日本消化器内視鏡学会', societyShort: '消化器内視鏡', specialtyArea: '消化器', tier: 'sub',
    meetingName: '第111回日本消化器内視鏡学会総会', president: '良沢 昭銘', presidentAffiliation: '埼玉医科大学',
    startDate: '2026-05-08', endDate: '2026-05-10', venue: 'パシフィコ横浜', city: '横浜', url: 'https://www.convention-plus.jp/111jges/', year: 2026 },

  // 呼吸器外科
  { id: 'kokyuuki-geka-2026', society: '日本呼吸器外科学会', societyShort: '呼吸器外科', specialtyArea: '呼吸器外科', tier: 'sub',
    meetingName: '第43回日本呼吸器外科学会学術集会', theme: 'DESIGN THE FUTURE', president: '佐藤 幸夫', presidentAffiliation: '筑波大学',
    startDate: '2026-05-14', endDate: '2026-05-15', venue: 'つくば国際会議場', city: 'つくば', url: 'https://www.congre.co.jp/jacs2026/', year: 2026 },

  // 神経
  { id: 'shinkei-2026', society: '日本神経学会', societyShort: '神経内科', specialtyArea: '神経内科', tier: 'sub',
    meetingName: '第67回日本神経学会学術大会', president: '西山 和利', presidentAffiliation: '北里大学',
    startDate: '2026-05-20', endDate: '2026-05-23', venue: 'パシフィコ横浜', city: '横浜', url: 'https://www.neurology-jp.org/neuro2026/', year: 2026 },

  // 糖尿病
  { id: 'tounyoubyou-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub',
    meetingName: '第69回日本糖尿病学会年次学術集会', theme: 'IMAGINE いのち輝く糖尿病の医療・医学', president: '下村 伊一郎', presidentAffiliation: '大阪大学',
    startDate: '2026-05-21', endDate: '2026-05-23', venue: '大阪国際会議場/リーガロイヤルホテル大阪', city: '大阪', url: 'https://site.convention.co.jp/69jds/', year: 2026 },

  // 感染症
  { id: 'kansenshou-2026', society: '日本感染症学会', societyShort: '感染症', specialtyArea: '感染症', tier: 'sub',
    meetingName: '第100回日本感染症学会総会・学術講演会', theme: 'Pioneering Our Next Hundred Years', president: '大毛 宏喜', presidentAffiliation: '広島大学病院',
    startDate: '2026-05-22', endDate: '2026-05-24', venue: '東京国際フォーラム', city: '東京', url: 'https://www.c-linkage.co.jp/jaid100-jsc74/', year: 2026 },

  // 内分泌
  { id: 'naibunpitsu-2026', society: '日本内分泌学会', societyShort: '内分泌', specialtyArea: '内分泌', tier: 'sub',
    meetingName: '第99回日本内分泌学会学術総会 / ICE2026', president: '',
    startDate: '2026-06-02', endDate: '2026-06-06', venue: '国立京都国際会館', city: '京都', url: 'https://www.c-linkage.co.jp/icejes2026/jp/', year: 2026 },

  // 小児外科
  { id: 'shoni-geka-2026', society: '日本小児外科学会', societyShort: '小児外科', specialtyArea: '小児外科', tier: 'sub',
    meetingName: '第63回日本小児外科学会学術集会', theme: 'Bright Future for Children', president: '内田 広夫', presidentAffiliation: '名古屋大学',
    startDate: '2026-06-09', endDate: '2026-06-13', venue: '名古屋コンベンションホール', city: '名古屋', url: 'https://site2.convention.co.jp/jsps-aaps2026/', year: 2026 },

  // 老年病
  { id: 'roujin-2026', society: '日本老年医学会', societyShort: '老年病', specialtyArea: '老年病', tier: 'sub',
    meetingName: '第68回日本老年医学会学術集会', president: '新村 健', presidentAffiliation: '兵庫医科大学',
    startDate: '2026-06-11', endDate: '2026-06-13', venue: '神戸国際会議場/神戸ポートピアホテル', city: '神戸', url: 'https://www.congre.co.jp/68jgs2026/', year: 2026 },

  // 肝臓
  { id: 'kanzou-2026', society: '日本肝臓学会', societyShort: '肝臓', specialtyArea: '肝臓', tier: 'sub',
    meetingName: '第62回日本肝臓学会総会',
    startDate: '2026-06-18', endDate: '2026-06-19', venue: '新潟', city: '新潟', year: 2026 },

  // 乳癌（乳腺外科）
  { id: 'nyuugan-2026', society: '日本乳癌学会', societyShort: '乳腺外科', specialtyArea: '乳腺外科', tier: 'sub',
    meetingName: '第34回日本乳癌学会学術総会', president: '佐治 重衡', presidentAffiliation: '福島県立医科大学',
    startDate: '2026-06-25', endDate: '2026-06-27', venue: '国立京都国際会館', city: '京都', url: 'https://www.jbcs2026.org/', year: 2026 },

  // 消化器外科
  { id: 'shoukaki-geka-2026', society: '日本消化器外科学会', societyShort: '消化器外科', specialtyArea: '消化器外科', tier: 'sub',
    meetingName: '第81回日本消化器外科学会総会', president: '比企 直樹', presidentAffiliation: '北里大学',
    startDate: '2026-07-15', endDate: '2026-07-17', venue: 'パシフィコ横浜ノース', city: '横浜', url: 'https://jsgs-meeting.jp/81/', year: 2026 },

  // 血液
  { id: 'ketsueki-2026', society: '日本血液学会', societyShort: '血液', specialtyArea: '血液', tier: 'sub',
    meetingName: '第88回日本血液学会学術集会',
    startDate: '2026-10-09', endDate: '2026-10-11', venue: '国立京都国際会館', city: '京都', year: 2026 },

  // アレルギー
  { id: 'allergy-2026', society: '日本アレルギー学会', societyShort: 'アレルギー', specialtyArea: 'アレルギー', tier: 'sub',
    meetingName: '第75回日本アレルギー学会学術大会', president: '佐伯 秀久', presidentAffiliation: '日本医科大学',
    startDate: '2026-10-15', endDate: '2026-10-18', venue: '国立京都国際会館', city: '京都', url: 'https://site2.convention.co.jp/jsa2026/', year: 2026 },

  // 胸部外科
  { id: 'kyoubu-geka-2026', society: '日本胸部外科学会', societyShort: '胸部外科', specialtyArea: '心臓血管外科', tier: 'sub',
    meetingName: '第79回日本胸部外科学会定期学術集会',
    startDate: '2026-10-20', endDate: '2026-10-22', venue: '国立京都国際会館', city: '京都', url: 'https://site2.convention.co.jp/jats2026/', year: 2026 },

  // JDDW（消化器関連学会週間）
  { id: 'jddw-2026', society: 'JDDW（消化器関連学会週間）', societyShort: 'JDDW', specialtyArea: '消化器', tier: 'major',
    meetingName: 'JDDW 2026 KOBE',
    startDate: '2026-11-05', endDate: '2026-11-07', venue: '神戸コンベンションセンター', city: '神戸', url: 'https://www.jddw.jp/jddw2026/', year: 2026 },

  // ═══════════════════════════════════════
  //  地方会（基本領域）
  // ═══════════════════════════════════════

  // ── 内科学会 地方会 ──
  { id: 'naika-tohoku-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第231回東北地方会', startDate: '2026-02-17', endDate: '2026-02-17', venue: '東北大学', city: '仙台', year: 2026 },
  { id: 'naika-tokai-s-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第252回東海地方会', startDate: '2026-02-18', endDate: '2026-02-18', venue: '名古屋', city: '名古屋', year: 2026 },
  { id: 'naika-kyushu-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第353回九州地方会', startDate: '2026-05-23', endDate: '2026-05-23', venue: '福岡', city: '福岡', year: 2026 },
  { id: 'naika-shikoku-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第134回四国地方会', startDate: '2026-06-07', endDate: '2026-06-07', venue: '四国', city: '高松', year: 2026 },
  { id: 'naika-shinetsu-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第158回信越地方会', startDate: '2026-06-13', endDate: '2026-06-13', venue: '新潟', city: '新潟', year: 2026 },
  { id: 'naika-hokuriku-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第259回北陸地方会', startDate: '2026-06-14', endDate: '2026-06-14', venue: '金沢', city: '金沢', year: 2026 },
  { id: 'naika-tokai-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第259回東海地方会', startDate: '2026-06-21', endDate: '2026-06-21', venue: '名古屋', city: '名古屋', year: 2026 },
  { id: 'naika-hokkaido-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第307回北海道地方会', startDate: '2026-07-04', endDate: '2026-07-04', venue: '札幌', city: '札幌', year: 2026 },
  { id: 'naika-kinki-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional',
    meetingName: '第252回近畿地方会', startDate: '2026-07-04', endDate: '2026-07-04', venue: '大阪', city: '大阪', year: 2026 },
  { id: 'naika-kanto-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '関東地方会（秋季）', startDate: '2026-10-03', endDate: '2026-10-03', venue: '東京', city: '東京', year: 2026 },
  { id: 'naika-chugoku-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '中国地方会', startDate: '2026-11-14', endDate: '2026-11-14', venue: '広島', city: '広島', year: 2026 },

  // ── 循環器学会 地方会 ──
  { id: 'junkanki-kanto-1-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '関東甲信越地方会（第1回）', startDate: '2026-02-14', endDate: '2026-02-14', venue: 'ステーションコンファレンス東京', city: '東京', year: 2026 },
  { id: 'junkanki-chugoku-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '第128回中国四国合同地方会', startDate: '2026-06-06', endDate: '2026-06-07', venue: '岡山コンベンションセンター', city: '岡山', year: 2026 },
  { id: 'junkanki-kanto-2-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '関東甲信越地方会（第2回）', startDate: '2026-06-13', endDate: '2026-06-13', venue: 'ステーションコンファレンス東京', city: '東京', year: 2026 },
  { id: 'junkanki-kanto-3-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '関東甲信越地方会（第3回）', startDate: '2026-09-26', endDate: '2026-09-26', venue: 'ステーションコンファレンス東京', city: '東京', year: 2026 },
  { id: 'junkanki-tohoku-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '東北地方会', startDate: '2026-10-03', endDate: '2026-10-04', venue: 'ホテルハマツ', city: '郡山', year: 2026 },
  { id: 'junkanki-chugoku2-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '第129回中国地方会', startDate: '2026-11-14', endDate: '2026-11-14', venue: 'くにびきメッセ', city: '松江', year: 2026 },
  { id: 'junkanki-kanto-4-2026', society: '日本循環器学会', societyShort: '循環器', specialtyArea: '循環器', tier: 'basic', meetingType: 'regional',
    meetingName: '関東甲信越地方会（第4回）', startDate: '2026-12-12', endDate: '2026-12-12', venue: 'ステーションコンファレンス東京', city: '東京', year: 2026 },

  // ── 消化器病学会 地方会 ──
  { id: 'shoukaki-kanto-1-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第388回関東支部例会', startDate: '2026-02-14', endDate: '2026-02-14', venue: '海運クラブ', city: '東京', year: 2026 },
  { id: 'shoukaki-kanto-2-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第389回関東支部例会', startDate: '2026-04-11', endDate: '2026-04-11', venue: '順天堂大学', city: '東京', year: 2026 },
  { id: 'shoukaki-kyushu-1-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第127回九州支部例会', startDate: '2026-06-12', endDate: '2026-06-13', venue: '電気ビル共創館', city: '福岡', year: 2026 },
  { id: 'shoukaki-kanto-3-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第390回関東支部例会', startDate: '2026-07-11', endDate: '2026-07-11', venue: '帝京大学板橋キャンパス', city: '東京', year: 2026 },
  { id: 'shoukaki-kanto-4-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第391回関東支部例会', startDate: '2026-09-19', endDate: '2026-09-19', venue: '海運クラブ', city: '東京', year: 2026 },
  { id: 'shoukaki-kyushu-2-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第128回九州支部例会', startDate: '2026-10-30', endDate: '2026-10-31', venue: '宮崎観光ホテル', city: '宮崎', year: 2026 },
  { id: 'shoukaki-kanto-5-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional',
    meetingName: '第392回関東支部例会', startDate: '2026-12-12', endDate: '2026-12-12', venue: '海運クラブ', city: '東京', year: 2026 },
  { id: 'shoukaki-kinki-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '近畿支部例会', startDate: '2026-09-12', endDate: '2026-09-12', venue: '大阪', city: '大阪', year: 2026 },
  { id: 'shoukaki-tohoku-2026', society: '日本消化器病学会', societyShort: '消化器', specialtyArea: '消化器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '東北支部例会', startDate: '2026-07-18', endDate: '2026-07-18', venue: '仙台', city: '仙台', year: 2026 },

  // ── 糖尿病学会 地方会 ──
  { id: 'tounyoubyou-chubu-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional',
    meetingName: '第100回中部地方会', president: '森田浩', startDate: '2026-09-05', endDate: '2026-09-06', venue: '岡本石井病院', city: '名古屋', year: 2026 },
  { id: 'tounyoubyou-chugoku-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional',
    meetingName: '第64回中国・四国地方会', president: '大倉毅', startDate: '2026-10-16', endDate: '2026-10-17', venue: '鳥取大学', city: '鳥取', year: 2026 },
  { id: 'tounyoubyou-kyushu-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional',
    meetingName: '第64回九州地方会', president: '野村政壽', startDate: '2026-10-30', endDate: '2026-10-31', venue: '久留米大学', city: '久留米', year: 2026 },
  { id: 'tounyoubyou-tohoku-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional',
    meetingName: '第64回東北地方会', president: '澤田正二郎', startDate: '2026-11-07', endDate: '2026-11-07', venue: '東北医科薬科大学', city: '仙台', year: 2026 },
  { id: 'tounyoubyou-hokkaido-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional',
    meetingName: '第60回北海道地方会', president: '古橋眞人', startDate: '2026-11-15', endDate: '2026-11-15', venue: '札幌医科大学', city: '札幌', year: 2026 },
  { id: 'tounyoubyou-kinki-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional',
    meetingName: '第63回近畿地方会', president: '今川彰久', startDate: '2026-11-28', endDate: '2026-11-28', venue: '大阪医科薬科大学', city: '大阪', year: 2026 },
  { id: 'tounyoubyou-kanto-2026', society: '日本糖尿病学会', societyShort: '糖尿病', specialtyArea: '糖尿病', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '関東甲信越地方会', startDate: '2026-01-24', endDate: '2026-01-24', venue: '東京', city: '東京', year: 2026 },

  // ── 神経学会 地方会 ──
  { id: 'shinkei-tokai-2026', society: '日本神経学会', societyShort: '神経内科', specialtyArea: '神経内科', tier: 'sub', meetingType: 'regional',
    meetingName: '第174回東海北陸地方会', startDate: '2026-03-07', endDate: '2026-03-08', venue: '名古屋', city: '名古屋', year: 2026 },
  { id: 'shinkei-kanto-2026', society: '日本神経学会', societyShort: '神経内科', specialtyArea: '神経内科', tier: 'sub', meetingType: 'regional',
    meetingName: '第256回関東甲信越地方会', startDate: '2026-03-07', endDate: '2026-03-07', venue: '東京', city: '東京', year: 2026 },
  { id: 'shinkei-kinki-2026', society: '日本神経学会', societyShort: '神経内科', specialtyArea: '神経内科', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-06-06', endDate: '2026-06-06', venue: '大阪', city: '大阪', year: 2026 },
  { id: 'shinkei-kyushu-2026', society: '日本神経学会', societyShort: '神経内科', specialtyArea: '神経内科', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '九州地方会', startDate: '2026-09-05', endDate: '2026-09-05', venue: '福岡', city: '福岡', year: 2026 },
  { id: 'shinkei-tohoku-2026', society: '日本神経学会', societyShort: '神経内科', specialtyArea: '神経内科', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '東北地方会', startDate: '2026-10-24', endDate: '2026-10-24', venue: '仙台', city: '仙台', year: 2026 },

  // ── 血液学会 地方会 ──
  { id: 'ketsueki-tokai-2026', society: '日本血液学会', societyShort: '血液', specialtyArea: '血液', tier: 'sub', meetingType: 'regional',
    meetingName: '第15回東海地方会', president: '俵功', startDate: '2026-04-26', endDate: '2026-04-26', venue: 'ウインクあいち', city: '名古屋', year: 2026 },
  { id: 'ketsueki-kanto-2026', society: '日本血液学会', societyShort: '血液', specialtyArea: '血液', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '関東地方会', startDate: '2026-07-11', endDate: '2026-07-11', venue: '東京', city: '東京', year: 2026 },
  { id: 'ketsueki-kinki-2026', society: '日本血液学会', societyShort: '血液', specialtyArea: '血液', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-09-19', endDate: '2026-09-19', venue: '大阪', city: '大阪', year: 2026 },

  // ── 整形外科学会 地方会 ──
  { id: 'seikei-chubu-2026', society: '日本整形外科学会', societyShort: '整形外科', specialtyArea: '整形外科', tier: 'basic', meetingType: 'regional',
    meetingName: '第146回中部日本整形外科災害外科学会', startDate: '2026-04-03', endDate: '2026-04-04', venue: 'アスティとくしま', city: '徳島', year: 2026 },
  { id: 'seikei-kanto-2026', society: '日本整形外科学会', societyShort: '整形外科', specialtyArea: '整形外科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '関東地方会', startDate: '2026-09-05', endDate: '2026-09-05', venue: '東京', city: '東京', year: 2026 },
  { id: 'seikei-kinki-2026', society: '日本整形外科学会', societyShort: '整形外科', specialtyArea: '整形外科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-11-07', endDate: '2026-11-07', venue: '大阪', city: '大阪', year: 2026 },

  // ── 呼吸器学会 地方会 ──
  { id: 'kokyuuki-kanto-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '第264回関東地方会', startDate: '2026-02-28', endDate: '2026-02-28', venue: '東京', city: '東京', year: 2026 },
  { id: 'kokyuuki-kinki-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-06-20', endDate: '2026-06-20', venue: '大阪', city: '大阪', year: 2026 },
  { id: 'kokyuuki-tokai-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '東海地方会', startDate: '2026-06-27', endDate: '2026-06-27', venue: '名古屋', city: '名古屋', year: 2026 },
  { id: 'kokyuuki-kyushu-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '九州地方会', startDate: '2026-07-04', endDate: '2026-07-04', venue: '福岡', city: '福岡', year: 2026 },
  { id: 'kokyuuki-tohoku-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '東北地方会', startDate: '2026-09-12', endDate: '2026-09-12', venue: '仙台', city: '仙台', year: 2026 },
  { id: 'kokyuuki-hokkaido-2026', society: '日本呼吸器学会', societyShort: '呼吸器', specialtyArea: '呼吸器', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '北海道地方会', startDate: '2026-09-26', endDate: '2026-09-26', venue: '札幌', city: '札幌', year: 2026 },

  // ── 皮膚科学会 地方会 ──
  { id: 'hifuka-tokyo-2026', society: '日本皮膚科学会', societyShort: '皮膚科', specialtyArea: '皮膚科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '東京支部地方会（春季）', startDate: '2026-05-09', endDate: '2026-05-09', venue: '東京', city: '東京', year: 2026 },
  { id: 'hifuka-tokyo-a-2026', society: '日本皮膚科学会', societyShort: '皮膚科', specialtyArea: '皮膚科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '東京支部地方会（秋季）', startDate: '2026-11-14', endDate: '2026-11-14', venue: '東京', city: '東京', year: 2026 },
  { id: 'hifuka-kinki-2026', society: '日本皮膚科学会', societyShort: '皮膚科', specialtyArea: '皮膚科', tier: 'basic', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-07-04', endDate: '2026-07-04', venue: '大阪', city: '大阪', year: 2026 },

  // ── 腎臓学会 特別企画 ──
  { id: 'jinzou-tokubetsu-2026', society: '日本腎臓学会', societyShort: '腎臓', specialtyArea: '腎臓', tier: 'sub', meetingType: 'annual',
    meetingName: '令和8年度定時総会特別企画', startDate: '2026-06-26', endDate: '2026-06-27', venue: '金沢文化ホール', city: '金沢', year: 2026 },
  { id: 'wcn-2026', society: '世界腎臓学会議', societyShort: 'WCN', specialtyArea: '腎臓', tier: 'major', meetingType: 'annual',
    meetingName: 'World Congress of Nephrology 2026', startDate: '2026-03-28', endDate: '2026-03-31', venue: 'パシフィコ横浜', city: '横浜', year: 2026 },

  // ── 感染症学会 地方会 ──
  { id: 'kansenshou-kanto-2026', society: '日本感染症学会', societyShort: '感染症', specialtyArea: '感染症', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '関東地方会', startDate: '2026-09-05', endDate: '2026-09-05', venue: '東京', city: '東京', year: 2026 },
  { id: 'kansenshou-kinki-2026', society: '日本感染症学会', societyShort: '感染症', specialtyArea: '感染症', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-11-14', endDate: '2026-11-14', venue: '大阪', city: '大阪', year: 2026 },

  // ── その他サブスペシャルティ 地方会 ──
  { id: 'naibunpitsu-kanto-2026', society: '日本内分泌学会', societyShort: '内分泌', specialtyArea: '内分泌', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '関東甲信越地方会', startDate: '2026-09-19', endDate: '2026-09-19', venue: '東京', city: '東京', year: 2026 },
  { id: 'naibunpitsu-kinki-2026', society: '日本内分泌学会', societyShort: '内分泌', specialtyArea: '内分泌', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '近畿地方会', startDate: '2026-11-07', endDate: '2026-11-07', venue: '大阪', city: '大阪', year: 2026 },

  { id: 'ryumachi-kanto-2026', society: '日本リウマチ学会', societyShort: 'リウマチ', specialtyArea: 'リウマチ', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '関東支部学術集会', startDate: '2026-12-05', endDate: '2026-12-05', venue: '東京', city: '東京', year: 2026 },

  { id: 'allergy-kanto-2026', society: '日本アレルギー学会', societyShort: 'アレルギー', specialtyArea: 'アレルギー', tier: 'sub', meetingType: 'regional', estimated: true,
    meetingName: '関東地方会', startDate: '2026-07-18', endDate: '2026-07-18', venue: '東京', city: '東京', year: 2026 },

  // ── JMECC・共通講習 ──
  { id: 'jmecc-spring-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'major', meetingType: 'seminar',
    meetingName: 'JMECC（春季開催）', startDate: '2026-04-01', endDate: '2026-09-30', venue: '全国各地', city: '各地', year: 2026, estimated: true },
  { id: 'jmecc-autumn-2026', society: '日本内科学会', societyShort: '内科', specialtyArea: '内科', tier: 'major', meetingType: 'seminar',
    meetingName: 'JMECC（秋季開催）', startDate: '2026-10-01', endDate: '2027-03-31', venue: '全国各地', city: '各地', year: 2026, estimated: true },

  // ── 日本外科系連合学会 ──
  { id: 'gekakei-rengo-2026', society: '日本外科系連合学会', societyShort: '外科系連合', specialtyArea: '外科', tier: 'major', meetingType: 'annual',
    meetingName: '第51回日本外科系連合学会学術集会', startDate: '2026-06-25', endDate: '2026-06-26', venue: '東京', city: '東京', year: 2026 },

  // ── 日本臨床外科学会 ──
  { id: 'rinsho-geka-2026', society: '日本臨床外科学会', societyShort: '臨床外科', specialtyArea: '外科', tier: 'major', meetingType: 'annual', estimated: true,
    meetingName: '第88回日本臨床外科学会総会', startDate: '2026-11-19', endDate: '2026-11-21', venue: '東京', city: '東京', year: 2026 },

  // ── 糖尿病合併症学会 ──
  { id: 'tounyou-gappeishou-2026', society: '日本糖尿病合併症学会', societyShort: '糖尿病合併症', specialtyArea: '糖尿病', tier: 'major', meetingType: 'annual',
    meetingName: '第41回日本糖尿病合併症学会', president: '西尾善彦', startDate: '2026-11-20', endDate: '2026-11-21', venue: '鹿児島', city: '鹿児島', year: 2026 },
]
