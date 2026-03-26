'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface IndexEntry {
  s: string  // slug
  t: string  // title
  d: string  // description
  c: string  // categoryName
  g: string  // tags
}

interface SearchResult {
  slug: string
  title: string
  description: string
  categoryName: string
}

let cachedIndex: IndexEntry[] | null = null

async function loadIndex(): Promise<IndexEntry[]> {
  if (cachedIndex) return cachedIndex
  const res = await fetch('/search-index.json')
  cachedIndex = await res.json()
  return cachedIndex!
}

import { tools, implementedTools } from '@/lib/tools-config'

// ローマ字→ひらがなマッピング（長いものから優先マッチ）
const ROMAJI: [string, string][] = [
  ['sha','しゃ'],['shi','し'],['shu','しゅ'],['sho','しょ'],
  ['cha','ちゃ'],['chi','ち'],['chu','ちゅ'],['cho','ちょ'],['tsu','つ'],
  ['nya','にゃ'],['nyu','にゅ'],['nyo','にょ'],
  ['hya','ひゃ'],['hyu','ひゅ'],['hyo','ひょ'],
  ['mya','みゃ'],['myu','みゅ'],['myo','みょ'],
  ['rya','りゃ'],['ryu','りゅ'],['ryo','りょ'],
  ['gya','ぎゃ'],['gyu','ぎゅ'],['gyo','ぎょ'],
  ['bya','びゃ'],['byu','びゅ'],['byo','びょ'],
  ['pya','ぴゃ'],['pyu','ぴゅ'],['pyo','ぴょ'],
  ['ja','じゃ'],['ju','じゅ'],['jo','じょ'],
  ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
  ['sa','さ'],['si','し'],['su','す'],['se','せ'],['so','そ'],
  ['ta','た'],['ti','ち'],['tu','つ'],['te','て'],['to','と'],
  ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
  ['ha','は'],['hi','ひ'],['hu','ふ'],['fu','ふ'],['he','へ'],['ho','ほ'],
  ['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
  ['ya','や'],['yu','ゆ'],['yo','よ'],
  ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
  ['wa','わ'],['wi','ゐ'],['we','ゑ'],['wo','を'],
  ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
  ['za','ざ'],['zi','じ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
  ['da','だ'],['di','ぢ'],['du','づ'],['de','で'],['do','ど'],
  ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
  ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
  ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お'],
  ['n','ん'],
]

function romajiToHiragana(s: string): string {
  let result = ''; let i = 0
  while (i < s.length) {
    // 促音: 同じ子音が連続 (kk→っk)
    if (i + 1 < s.length && s[i] === s[i + 1] && /[bcdfghjklmpqrstvwxyz]/.test(s[i])) {
      result += 'っ'; i++; continue
    }
    let matched = false
    for (const [rom, hira] of ROMAJI) {
      if (s.startsWith(rom, i)) { result += hira; i += rom.length; matched = true; break }
    }
    if (!matched) { result += s[i]; i++ }
  }
  return result
}

function hiraganaToKatakana(s: string): string {
  return s.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}

function katakanaToHiragana(s: string): string {
  return s.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

function normalize(s: string): string {
  // カタカナ→ひらがなに統一、ローマ字→ひらがなに変換
  const stripped = s.toLowerCase().replace(/[-_・．.　\s₂]/g, '')
  return katakanaToHiragana(stripped)
}

// 医学略語→日本語読み辞書（部分一致用）
const ABBR_READINGS: Record<string, string[]> = {
  'ckd': ['しーけーでぃー','まんせいじんぞうびょう'],
  'aki': ['えーけーあい','きゅうせいじんしょうがい'],
  'copd': ['しーおーぴーでぃー','まんせいへいそくせいはいしっかん'],
  'dvt': ['でぃーぶいてぃー','しんぶじょうみゃくけっせん'],
  'pe': ['ぴーいー','はいそくせん'],
  'dic': ['でぃーあいしー'],
  'hba1c': ['えいちびーえーわんしー','へもぐろびん'],
  'bmi': ['びーえむあい'],
  'egfr': ['いーじーえふあーる'],
  'na': ['なとりうむ','そでぃうむ'],
  'k': ['かりうむ'],
  'ca': ['かるしうむ'],
  'mg': ['まぐねしうむ'],
  'sofa': ['そふぁ'],
  'apache': ['あぱっち'],
  'chads': ['ちゃっず'],
  'meld': ['めるど'],
  'nihss': ['えぬあいえいちえすえす'],
  'gcs': ['じーしーえす'],
  'wells': ['うぇるず'],
  'curb': ['かーぶ'],
  'grace': ['ぐれいす'],
  'child': ['ちゃいるど'],
  'qtc': ['きゅーてぃーしー'],
  'bsa': ['びーえすえー','たいひょうめんせき'],
  'ibw': ['あいびーだぶりゅー','りそうたいじゅう'],
  'fio2': ['えふあいおーつー'],
  'psi': ['ぴーえすあい'],
  'has': ['はす'],
  'bled': ['ぶれっど'],
  'timi': ['てぃみ'],
  'heart': ['はーと'],
}

// クエリを複数形式に展開して検索ヒット率を上げる
function expandQuery(q: string): string[] {
  const base = normalize(q)
  const hiragana = romajiToHiragana(base)
  const katakana = hiraganaToKatakana(hiragana)
  const results = [base, hiragana, katakanaToHiragana(katakana)]

  // 略語辞書から逆引き: ひらがなクエリ→英語略語
  const hiraQuery = katakanaToHiragana(hiragana)
  for (const [abbr, readings] of Object.entries(ABBR_READINGS)) {
    if (readings.some(r => r.startsWith(hiraQuery) || hiraQuery.startsWith(r))) {
      results.push(abbr)
    }
  }
  // 英語クエリ→日本語読み
  const lower = q.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (ABBR_READINGS[lower]) {
    results.push(...ABBR_READINGS[lower])
  }
  // 部分一致: 辞書のキーが入力に含まれる or 入力がキーに含まれる
  for (const [abbr, readings] of Object.entries(ABBR_READINGS)) {
    if (lower.includes(abbr) || abbr.includes(lower)) {
      results.push(abbr, ...readings)
    }
  }

  return results.filter((v, i, a) => a.indexOf(v) === i)
}

// ツール+アプリのエントリ
const toolEntries = tools.filter(t => implementedTools.has(t.slug)).map(t => ({
  s: t.slug, t: t.name, d: `${t.nameEn || ''} ${t.description} ${(t.keywords || []).join(' ')}`, c: '計算ツール', g: t.slug, href: `/tools/calc/${t.slug}`,
}))
const appFixedEntries = [
  { s: 'josler', t: '研修記録（J-OSLER）', d: 'J-OSLER JOSLER ジェイオスラー 症例登録 EPOC 内科', c: 'アプリ', g: 'josler', href: '/josler' },
  { s: 'study', t: 'iwor Study', d: 'フラッシュカード CBT 国試 専門医 暗記', c: 'アプリ', g: 'study', href: '/study' },
  { s: 'matching', t: 'マッチング・転職対策', d: '履歴書 病院検索 マッチング', c: 'アプリ', g: 'matching', href: '/matching' },
  { s: 'journal', t: '論文フィード', d: '論文 PubMed 最新 日本語', c: 'アプリ', g: 'journal', href: '/journal' },
  { s: 'credits', t: '専門医単位', d: '専門医 単位 更新 学会', c: 'アプリ', g: 'credits', href: '/credits' },
  { s: 'conferences', t: '学会カレンダー', d: '学会 日程 カレンダー', c: 'アプリ', g: 'conferences', href: '/conferences' },
  { s: 'money', t: 'マネー', d: 'ふるさと納税 手取り NISA 確定申告 節税', c: 'アプリ', g: 'money', href: '/money' },
  { s: 'presenter', t: 'プレゼン資料生成', d: '学会 カンファ 抄読会 スライド', c: 'アプリ', g: 'presenter', href: '/presenter' },
  { s: 'shift', t: 'シフト', d: 'シフト 当直 カレンダー', c: 'アプリ', g: 'shift', href: '/shift' },
]

function search(index: IndexEntry[], query: string): SearchResult[] {
  const normalizedQuery = normalize(query)
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return []

  const allEntries = [...appFixedEntries, ...toolEntries, ...index.map(e => ({ ...e, href: `/blog/${e.s}` }))]

  return allEntries
    .map((entry) => {
      const haystack = normalize(`${entry.t} ${entry.d} ${entry.c} ${entry.g} ${entry.s}`)
      const queries = expandQuery(query)
      const normalMatch = queries.some(q => haystack.includes(q)) ? 1 : 0
      const kwHaystack = `${entry.t} ${entry.d} ${entry.c} ${entry.g}`.toLowerCase()
      const matchCount = keywords.filter((kw) => kwHaystack.includes(kw)).length
      const score = normalMatch + matchCount / keywords.length
      if (score === 0) return null
      const isApp = appFixedEntries.some(a => a.s === entry.s)
      return {
        slug: entry.s,
        title: entry.t,
        description: entry.d,
        categoryName: entry.c,
        href: (entry as any).href || `/blog/${entry.s}`,
        relevance: score + (isApp ? 0.5 : 0),
      }
    })
    .filter((r): r is SearchResult & { relevance: number; href: string } => r !== null)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 12)
}

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [index, setIndex] = useState<IndexEntry[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setResults([])
    setSelectedIndex(0)
    if (!index) {
      loadIndex().then(setIndex)
    }
  }, [index])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        isOpen ? close() : open()
      }
      if (e.key === 'Escape' && isOpen) close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, open, close])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!index || !query.trim()) {
      setResults([])
      return
    }
    setResults(search(index, query.trim()))
    setSelectedIndex(0)
  }, [query, index])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      const r = results[selectedIndex] as any
      router.push(r.href || `/blog/${r.slug}`)
      close()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-ac hover:bg-s1 transition-colors"
        aria-label="サイト内検索"
        title="検索（⌘K）"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-tx/40 z-[60] backdrop-blur-sm"
        onClick={close}
      />
      <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] px-4" onClick={close}>
        <div
          className="w-full max-w-lg bg-s0 rounded-xl shadow-2xl border border-br overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 border-b border-br">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted flex-shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="記事を検索..."
              className="flex-1 py-3.5 bg-transparent text-tx text-sm outline-none placeholder:text-muted/60"
            />
            <button
              onClick={close}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-tx hover:bg-s1 transition-colors"
              aria-label="閉じる"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                「{query}」に一致する結果が見つかりませんでした
              </div>
            )}
            {results.length > 0 && (
              <ul className="py-2">
                {results.map((result, i) => (
                  <li key={result.slug}>
                    <Link
                      href={(result as any).href || `/blog/${result.slug}`}
                      onClick={close}
                      className={`block px-4 py-3 transition-colors ${
                        i === selectedIndex ? 'bg-acl' : 'hover:bg-s1'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted bg-s1 px-2 py-0.5 rounded">
                          {result.categoryName}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-tx leading-snug">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">
                        {result.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!query.trim() && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                キーワードを入力して記事を検索
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-br bg-s1/50 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <kbd className="bg-s0 border border-br px-1 py-0.5 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="bg-s0 border border-br px-1 py-0.5 rounded font-mono text-[10px]">↓</kbd>
              移動
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-s0 border border-br px-1 py-0.5 rounded font-mono text-[10px]">Enter</kbd>
              開く
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
