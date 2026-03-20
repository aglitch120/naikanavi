// ═══════════════════════════════════════════════════════════════
//  学会カレンダー マスターデータ
//  基本領域19学会 2026年度
// ═══════════════════════════════════════════════════════════════

export interface Conference {
  id: string
  society: string
  societyShort: string
  specialtyArea: string
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
}

// 診療科カテゴリ色（カレンダー表示用）
export const SPECIALTY_COLORS: Record<string, string> = {
  '内科系': '#059669',
  '外科系': '#2563EB',
  'その他': '#6B7280',
}

export function getSpecialtyCategory(area: string): string {
  const naika = ['内科', '精神科', '皮膚科', '小児科', '放射線科', '臨床検査', '病理', '総合診療']
  const geka = ['外科', '整形外科', '脳神経外科', '形成外科', '産婦人科', '泌尿器科', '眼科', '耳鼻咽喉科']
  if (naika.includes(area)) return '内科系'
  if (geka.includes(area)) return '外科系'
  return 'その他'
}

export const CONFERENCES_2026: Conference[] = [
  {
    id: 'naika-2026',
    society: '日本内科学会',
    societyShort: '内科',
    specialtyArea: '内科',
    meetingName: '第123回日本内科学会総会・講演会',
    theme: '包摂する内科学',
    president: '張替 秀郎',
    presidentAffiliation: '東北大学',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    venue: '東京国際フォーラム',
    city: '東京',
    year: 2026,
  },
  {
    id: 'geka-2026',
    society: '日本外科学会',
    societyShort: '外科',
    specialtyArea: '外科',
    meetingName: '第126回日本外科学会定期学術集会',
    startDate: '2026-04-23',
    endDate: '2026-04-25',
    venue: '京王プラザホテル札幌他',
    city: '札幌',
    year: 2026,
  },
  {
    id: 'shonika-2026',
    society: '日本小児科学会',
    societyShort: '小児科',
    specialtyArea: '小児科',
    meetingName: '第129回日本小児科学会学術集会',
    startDate: '2026-04-17',
    endDate: '2026-04-19',
    venue: '海峡メッセ下関',
    city: '下関',
    year: 2026,
  },
  {
    id: 'sanfujinka-2026',
    society: '日本産科婦人科学会',
    societyShort: '産婦人科',
    specialtyArea: '産婦人科',
    meetingName: '第78回日本産科婦人科学会学術講演会',
    startDate: '2026-05-15',
    endDate: '2026-05-17',
    venue: 'グランドメルキュール札幌大通公園他',
    city: '札幌',
    year: 2026,
  },
  {
    id: 'seishin-2026',
    society: '日本精神神経学会',
    societyShort: '精神科',
    specialtyArea: '精神科',
    meetingName: '第122回日本精神神経学会学術総会',
    startDate: '2026-06-18',
    endDate: '2026-06-20',
    venue: 'パシフィコ横浜ノース',
    city: '横浜',
    year: 2026,
  },
  {
    id: 'hifuka-2026',
    society: '日本皮膚科学会',
    societyShort: '皮膚科',
    specialtyArea: '皮膚科',
    meetingName: '第125回日本皮膚科学会総会',
    startDate: '2026-06-11',
    endDate: '2026-06-14',
    venue: '国立京都国際会館',
    city: '京都',
    year: 2026,
  },
  {
    id: 'ganka-2026',
    society: '日本眼科学会',
    societyShort: '眼科',
    specialtyArea: '眼科',
    meetingName: '第130回日本眼科学会総会',
    startDate: '2026-04-09',
    endDate: '2026-04-12',
    venue: '福岡国際会議場/マリンメッセ',
    city: '福岡',
    year: 2026,
  },
  {
    id: 'jibika-2026',
    society: '日本耳鼻咽喉科頭頸部外科学会',
    societyShort: '耳鼻咽喉科',
    specialtyArea: '耳鼻咽喉科',
    meetingName: '第127回日本耳鼻咽喉科頭頸部外科学会総会・学術講演会',
    president: '香取 幸夫',
    presidentAffiliation: '東北大学',
    startDate: '2026-05-20',
    endDate: '2026-05-23',
    venue: '東北大学百周年記念館 川内萩ホール他',
    city: '仙台',
    year: 2026,
  },
  {
    id: 'hinyokika-2026',
    society: '日本泌尿器科学会',
    societyShort: '泌尿器科',
    specialtyArea: '泌尿器科',
    meetingName: '第113回日本泌尿器科学会総会',
    startDate: '2026-04-23',
    endDate: '2026-04-26',
    venue: '国立京都国際会館',
    city: '京都',
    year: 2026,
  },
  {
    id: 'seikei-2026',
    society: '日本整形外科学会',
    societyShort: '整形外科',
    specialtyArea: '整形外科',
    meetingName: '第99回日本整形外科学会学術総会',
    startDate: '2026-05-21',
    endDate: '2026-05-24',
    venue: '神戸コンベンションセンター',
    city: '神戸',
    year: 2026,
  },
  {
    id: 'noshinkei-2026',
    society: '日本脳神経外科学会',
    societyShort: '脳神経外科',
    specialtyArea: '脳神経外科',
    meetingName: '第85回日本脳神経外科学会学術総会',
    startDate: '2026-10-21',
    endDate: '2026-10-23',
    venue: '札幌文化芸術劇場hitaru他',
    city: '札幌',
    year: 2026,
  },
  {
    id: 'hoshasen-2026',
    society: '日本医学放射線学会',
    societyShort: '放射線科',
    specialtyArea: '放射線科',
    meetingName: '第85回日本医学放射線学会総会（JRC2026）',
    startDate: '2026-04-16',
    endDate: '2026-04-19',
    venue: 'パシフィコ横浜',
    city: '横浜',
    year: 2026,
  },
  {
    id: 'masui-2026',
    society: '日本麻酔科学会',
    societyShort: '麻酔科',
    specialtyArea: '麻酔科',
    meetingName: '第73回日本麻酔科学会学術集会',
    startDate: '2026-05-21',
    endDate: '2026-05-23',
    venue: 'パシフィコ横浜',
    city: '横浜',
    year: 2026,
  },
  {
    id: 'byori-2026',
    society: '日本病理学会',
    societyShort: '病理',
    specialtyArea: '病理',
    meetingName: '第115回日本病理学会総会',
    theme: 'Pathologists, be ambitious! 病理医よ大志を抱け',
    president: '田中 伸哉',
    presidentAffiliation: '北海道大学',
    startDate: '2026-04-16',
    endDate: '2026-04-18',
    venue: 'グランドメルキュール札幌大通公園他',
    city: '札幌',
    year: 2026,
  },
  {
    id: 'rinsho-kensa-2026',
    society: '日本臨床検査医学会',
    societyShort: '臨床検査',
    specialtyArea: '臨床検査',
    meetingName: '第73回日本臨床検査医学会学術集会',
    startDate: '2026-12-17',
    endDate: '2026-12-20',
    venue: '幕張メッセ',
    city: '千葉',
    year: 2026,
  },
  {
    id: 'kyukyu-2026',
    society: '日本救急医学会',
    societyShort: '救急科',
    specialtyArea: '救急科',
    meetingName: '第54回日本救急医学会総会・学術集会',
    startDate: '2026-10-27',
    endDate: '2026-10-29',
    venue: '出島メッセ長崎',
    city: '長崎',
    year: 2026,
  },
  {
    id: 'keisei-2026',
    society: '日本形成外科学会',
    societyShort: '形成外科',
    specialtyArea: '形成外科',
    meetingName: '第69回日本形成外科学会総会・学術集会',
    startDate: '2026-04-22',
    endDate: '2026-04-24',
    venue: 'あわぎんホール/JRホテルクレメント徳島',
    city: '徳島',
    year: 2026,
  },
  {
    id: 'riha-2026',
    society: '日本リハビリテーション医学会',
    societyShort: 'リハビリ',
    specialtyArea: 'リハビリ',
    meetingName: '第63回日本リハビリテーション医学会学術集会',
    startDate: '2026-06-04',
    endDate: '2026-06-07',
    venue: '福岡国際会議場/マリンメッセ福岡Bホール',
    city: '福岡',
    year: 2026,
  },
  {
    id: 'sogo-shinryo-2026',
    society: '日本プライマリ・ケア連合学会',
    societyShort: '総合診療',
    specialtyArea: '総合診療',
    meetingName: '第17回日本プライマリ・ケア連合学会学術大会',
    theme: 'つながる、つなげる。つなげる、つながる。',
    president: '鈴木 富雄',
    presidentAffiliation: '大阪医科薬科大学',
    startDate: '2026-05-29',
    endDate: '2026-05-31',
    venue: '国立京都国際会館',
    city: '京都',
    year: 2026,
  },
]
