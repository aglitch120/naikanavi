// .apkgインポーター
// .apkg = ZIP(collection.anki2 or collection.anki21 = SQLite DB + media)
// ノートの最初2フィールドをfront/backとして取り込む

import JSZip from 'jszip'
import type { FlashCard } from './cbt-cards'

interface AnkiNote {
  front: string
  back: string
  tags: string
}

// HTMLタグを除去してプレーンテキストに変換
function stripHtml(html: string): string {
  // <br>, <br/>, <div> → 改行
  let text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<div>/gi, '')
  // 残りのHTMLタグを除去
  text = text.replace(/<[^>]*>/g, '')
  // HTMLエンティティをデコード
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  // 連続改行を1つに
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

// Cloze deletion {{c1::answer::hint}} → [answer] に変換
function processCloze(text: string): { front: string; back: string } {
  const clozePattern = /\{\{c\d+::([^}]*?)(?:::([^}]*?))?\}\}/g
  // front: cloze部分を [...] or [hint] に置換
  const front = text.replace(clozePattern, (_match, _answer, hint) => {
    return hint ? `[${hint}]` : '[...]'
  })
  // back: cloze部分を答えのみに置換
  const back = text.replace(clozePattern, (_match, answer) => answer)
  return { front: stripHtml(front), back: stripHtml(back) }
}

export interface ApkgImportResult {
  deckName: string
  cards: FlashCard[]
  totalNotes: number
  importedCards: number
  skippedEmpty: number
}

export async function parseApkgFile(file: File): Promise<ApkgImportResult> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // SQLiteファイルを探す (collection.anki21 → collection.anki2)
  let dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
  if (!dbFile) {
    throw new Error('Ankiデータベースが見つかりません。有効な.apkgファイルを選択してください。')
  }

  const dbBuffer = await dbFile.async('arraybuffer')

  // sql.js初期化（WASMをpublicから読み込み）
  const initSqlJs = (await import('sql.js')).default
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  })
  const db = new SQL.Database(new Uint8Array(dbBuffer))

  // デッキ名を取得
  let deckName = file.name.replace(/\.apkg$/i, '')
  try {
    const colResult = db.exec("SELECT decks FROM col LIMIT 1")
    if (colResult.length > 0 && colResult[0].values.length > 0) {
      const decksJson = JSON.parse(colResult[0].values[0][0] as string)
      // 最初の非デフォルトデッキ名を使用
      const deckEntries = Object.values(decksJson) as Array<{ name: string; id: number }>
      const nonDefault = deckEntries.find(d => d.name !== 'Default' && d.name !== 'デフォルト')
      if (nonDefault) deckName = nonDefault.name
    }
  } catch {
    // デッキ名取得失敗時はファイル名を使用
  }

  // モデル情報を取得（Cloze判定用）
  const clozeModelIds = new Set<number>()
  try {
    const colResult = db.exec("SELECT models FROM col LIMIT 1")
    if (colResult.length > 0 && colResult[0].values.length > 0) {
      const modelsJson = JSON.parse(colResult[0].values[0][0] as string)
      for (const [id, model] of Object.entries(modelsJson)) {
        const m = model as { type?: number }
        if (m.type === 1) clozeModelIds.add(Number(id))
      }
    }
  } catch {
    // Cloze判定失敗時は全てBasicとして処理
  }

  // ノートを取得
  const notes: AnkiNote[] = []
  let skippedEmpty = 0

  try {
    const result = db.exec("SELECT mid, flds, tags FROM notes")
    if (result.length > 0) {
      for (const row of result[0].values) {
        const modelId = Number(row[0])
        const fields = (row[1] as string).split('\x1f') // フィールド区切り
        const tags = (row[2] as string).trim()

        if (clozeModelIds.has(modelId)) {
          // Clozeカード: テキスト全体からfront/backを生成
          const { front, back } = processCloze(fields[0] || '')
          if (front && back && front !== back) {
            notes.push({ front, back, tags })
          } else {
            skippedEmpty++
          }
        } else {
          // Basicカード: 最初の2フィールドをfront/backに
          const front = stripHtml(fields[0] || '')
          const back = stripHtml(fields[1] || '')
          if (front && back) {
            notes.push({ front, back, tags })
          } else {
            skippedEmpty++
          }
        }
      }
    }
  } finally {
    db.close()
  }

  if (notes.length === 0) {
    throw new Error('インポート可能なカードが見つかりませんでした。')
  }

  // FlashCard形式に変換
  const deckId = `import-${Date.now()}`
  const cards: FlashCard[] = notes.map((note, i) => {
    // タグの最初の1つを使用
    const tag = note.tags.split(/\s+/).filter(Boolean)[0] || ''
    return {
      id: `${deckId}-${i + 1}`,
      front: note.front,
      back: note.back,
      tag,
    }
  })

  return {
    deckName,
    cards,
    totalNotes: notes.length + skippedEmpty,
    importedCards: cards.length,
    skippedEmpty,
  }
}
