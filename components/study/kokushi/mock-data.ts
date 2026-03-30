import type {
  NavItem, MarkDef, FieldGroup, ExamEntry, QuestionItem,
  MockSet, DeckItem, ChatHistoryItem, NoteItem, GenCard,
} from './types'

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '◫', label: 'ダッシュボード' },
  { id: 'practice', icon: '✎', label: '演習' },
  { id: 'cards', icon: '⊞', label: '暗記カード' },
  { id: 'stats', icon: '◔', label: '統計' },
  { id: 'chat', icon: '◇', label: 'iwor AI' },
  { id: 'notes', icon: '☰', label: 'ノート' },
]

export const MARKS: MarkDef[] = [
  { key: 'dbl', icon: '◎', color: '#6C5CE7', label: '完璧' },
  { key: 'ok', icon: '○', color: '#166534', label: '正解' },
  { key: 'tri', icon: '△', color: '#92400E', label: '曖昧' },
  { key: 'x', icon: '✕', color: '#991B1B', label: '不正解' },
  { key: 'none', icon: '—', color: '#9B9790', label: '未演習' },
]

export const EXAM_MODES = ['すべて', '医師国家試験', 'CBT', '初期研修', '専攻医', '一般医師']

export const FIELDS: FieldGroup[] = [
  { id: 'A', label: '内科系メジャー', subs: [
    { id: 'A1', label: '循環器', total: 420, done: 357, pct: 82, marks: { dbl: 89, ok: 180, tri: 52, x: 36, none: 63 } },
    { id: 'A2', label: '呼吸器', total: 280, done: 182, pct: 68, marks: { dbl: 40, ok: 98, tri: 28, x: 16, none: 98 } },
    { id: 'A3', label: '消化管', total: 310, done: 233, pct: 75, marks: { dbl: 65, ok: 120, tri: 30, x: 18, none: 77 } },
    { id: 'A4', label: '肝胆膵', total: 220, done: 140, pct: 64, marks: { dbl: 30, ok: 72, tri: 24, x: 14, none: 80 } },
    { id: 'A5', label: '腎・電解質', total: 190, done: 105, pct: 55, marks: { dbl: 18, ok: 52, tri: 22, x: 13, none: 85 } },
    { id: 'A6', label: '内分泌', total: 200, done: 84, pct: 42, marks: { dbl: 10, ok: 38, tri: 20, x: 16, none: 116 } },
    { id: 'A7', label: '血液', total: 180, done: 110, pct: 61, marks: { dbl: 22, ok: 55, tri: 20, x: 13, none: 70 } },
    { id: 'A9', label: '感染症', total: 210, done: 140, pct: 67, marks: { dbl: 35, ok: 68, tri: 22, x: 15, none: 70 } },
    { id: 'A10', label: '神経', total: 250, done: 113, pct: 48, marks: { dbl: 12, ok: 50, tri: 30, x: 21, none: 137 } },
  ] },
  { id: 'B', label: '外科系・専門科', subs: [
    { id: 'B1', label: '整形外科', total: 120, done: 50, pct: 42, marks: { dbl: 8, ok: 22, tri: 12, x: 8, none: 70 } },
    { id: 'B5', label: '皮膚科', total: 95, done: 40, pct: 42, marks: { dbl: 6, ok: 18, tri: 10, x: 6, none: 55 } },
    { id: 'B6', label: '精神科', total: 130, done: 65, pct: 50, marks: { dbl: 10, ok: 30, tri: 15, x: 10, none: 65 } },
  ] },
  { id: 'C', label: '周産期・小児', subs: [
    { id: 'C1', label: '産婦人科', total: 200, done: 56, pct: 28, marks: { dbl: 5, ok: 25, tri: 15, x: 11, none: 144 } },
    { id: 'C2', label: '小児科', total: 180, done: 55, pct: 31, marks: { dbl: 5, ok: 22, tri: 16, x: 12, none: 125 } },
  ] },
  { id: 'D', label: '横断領域', subs: [
    { id: 'D1', label: '救急', total: 150, done: 82, pct: 55, marks: { dbl: 15, ok: 38, tri: 18, x: 11, none: 68 } },
    { id: 'D3', label: '公衆衛生', total: 320, done: 192, pct: 60, marks: { dbl: 40, ok: 95, tri: 35, x: 22, none: 128 } },
  ] },
]

export const EXAMS: ExamEntry[] = [
  { year: 120, total: 400, done: 0, pct: 0 },
  { year: 119, total: 400, done: 368, pct: 76 },
  { year: 118, total: 400, done: 312, pct: 72 },
  { year: 117, total: 400, done: 260, pct: 65 },
  { year: 116, total: 400, done: 180, pct: 58 },
  { year: 115, total: 400, done: 120, pct: 52 },
]

export const Q_LIST: QuestionItem[] = [
  { id: '119A1', stem: '自己免疫性膵炎で誤っているのはどれか。', field: '肝胆膵', mark: 'ok', last: '03/30' },
  { id: '119A2', stem: '68歳の男性。胸痛を主訴に来院した。2時間前…', field: '循環器', mark: 'dbl', last: '03/29' },
  { id: '119A3', stem: 'インフルエンザの治療薬として正しいのはどれか。', field: '感染症', mark: 'tri', last: '03/28' },
  { id: '119A4', stem: '72歳の女性。歩行障害を主訴に来院した。', field: '神経', mark: 'x', last: '03/27' },
  { id: '119A5', stem: '生後3日の新生児。全身の黄染を認める。', field: '小児科', mark: 'ok', last: '03/26' },
  { id: '119A6', stem: '45歳の男性。心窩部痛と黒色便を主訴に来院。', field: '消化管', mark: 'none', last: null },
  { id: '119A7', stem: '35歳の女性。動悸、体重減少、手指振戦。', field: '内分泌', mark: 'ok', last: '03/25' },
  { id: '119A8', stem: '22歳の男性。「テレビが命令してくる」…', field: '精神科', mark: 'dbl', last: '03/24' },
]

export const MOCK_SETS: MockSet[] = [
  { name: '苦手科目集中', count: 85, created: '03/28' },
  { name: '119回 要復習', count: 42, created: '03/25' },
]

export const MOCK_DECKS: DeckItem[] = [
  { id: 1, name: 'CBT基礎', cards: 150, due: 12, folder: 'CBT' },
  { id: 2, name: '国試 循環器', cards: 86, due: 8, folder: '国試' },
  { id: 3, name: '国試 消化管', cards: 42, due: 3, folder: '国試' },
]

export const DECK_FOLDERS = ['CBT', '国試', 'カスタム']

export const CHAT_HISTORY: ChatHistoryItem[] = [
  { id: 1, title: 'IgG4関連疾患の機序', date: '03/30', src: '119A1' },
  { id: 2, title: '循環器の苦手克服プラン', date: '03/29', src: 'フリー' },
  { id: 3, title: '高K血症の対応順序', date: '03/27', src: '119A11' },
]

export const NOTE_FOLDERS = ['循環器', '感染症', '国試メモ', '未整理']

export const NOTES: NoteItem[] = [
  { id: 1, title: '心不全まとめ', folder: '循環器', updated: '03/30', preview: 'HFrEF: EF<40% / HFpEF: EF≥50%' },
  { id: 2, title: '抗菌薬一覧', folder: '感染症', updated: '03/29', preview: 'ABPC→腸球菌 / AMPC→市中肺炎' },
  { id: 3, title: '119回メモ', folder: '国試メモ', updated: '03/28', preview: '119A4: iNPH Hakim三徴' },
]

export const GEN_CARDS: GenCard[] = [
  { front: '自己免疫性膵炎の画像所見は？', back: 'びまん性膵腫大（ソーセージ様）+ capsule-like rim', type: '事実' },
  { front: 'IgG4クラススイッチを誘導するサイトカインは？', back: 'IL-4, IL-10, IL-13（Th2サイトカイン）', type: '機序' },
  { front: 'AIP 1型 vs 2型の違い', back: '1型: IgG4関連, 高齢男性, 膵外病変\n2型: 好中球性, 若年, IBD合併', type: '鑑別' },
  { front: 'AIPの治療 第一選択は？', back: 'グルココルチコイド（ステロイド）', type: '事実' },
  { front: 'AIP確定診断(ICDC)の要素は？', back: '①画像②血清学③膵外病変④病理⑤ステロイド反応性', type: '事実' },
]

export const MOCK_DECK_CARDS = [
  { front: '自己免疫性膵炎の画像所見は？', back: 'びまん性膵腫大（ソーセージ様）+ capsule-like rim', next: '明日' },
  { front: 'IgG4クラススイッチを誘導するサイトカインは？', back: 'IL-4, IL-10, IL-13', next: '3日後' },
  { front: 'AIPの治療 第一選択は？', back: 'グルココルチコイド（ステロイド）', next: '1週後' },
  { front: 'AIP 1型 vs 2型の違い', back: '1型:IgG4関連,高齢男性 / 2型:好中球性,若年', next: '今日' },
  { front: 'IgG4-RDの診断基準は？', back: '①臓器腫大②IgG4高値③病理（リンパ球浸潤+線維化）', next: '2日後' },
]

// 集計ヘルパー
export function getTotals() {
  const totalQ = FIELDS.reduce((s, f) => s + f.subs.reduce((ss, sub) => ss + sub.total, 0), 0)
  const totalDone = FIELDS.reduce((s, f) => s + f.subs.reduce((ss, sub) => ss + sub.done, 0), 0)
  return { totalQ, totalDone }
}
