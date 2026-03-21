'use client'

/**
 * SourceCitation — 出典情報の表示コンポーネント
 *
 * 全ての医学情報ツールに付与する。
 * 方針: 情報は出典からの転記のみ。一切の編集・レイアウト変更・解釈を加えない。
 */

export interface SourceInfo {
  /** 出典名（ガイドライン名/教科書名/添付文書） */
  name: string
  /** 出典の版/年度 */
  edition?: string
  /** ページ番号/セクション */
  section?: string
  /** URL（オンラインアクセス可能な場合） */
  url?: string
  /** 転記日（YYYY-MM-DD） */
  transcribedAt: string
  /** 最終照合日（YYYY-MM-DD）— 自動チェック or 手動照合 */
  lastVerifiedAt: string
}

interface Props {
  sources: SourceInfo[]
  /** 免責文言のカスタマイズ（デフォルトあり） */
  disclaimer?: string
}

export default function SourceCitation({ sources, disclaimer }: Props) {
  return (
    <div className="mt-6 border-t border-br pt-4 space-y-3">
      {/* 出典一覧 */}
      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
          📖 出典（転記元）
        </h3>
        <ul className="space-y-1.5">
          {sources.map((s, i) => (
            <li key={i} className="text-xs text-muted leading-relaxed">
              <span className="font-medium text-tx">[{i + 1}]</span>{' '}
              {s.name}
              {s.edition && <span>（{s.edition}）</span>}
              {s.section && <span> — {s.section}</span>}
              {s.url && (
                <>
                  {' '}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ac hover:underline"
                  >
                    [リンク]
                  </a>
                </>
              )}
              <br />
              <span className="text-[11px]">
                転記日: {s.transcribedAt} ｜ 最終照合: {s.lastVerifiedAt}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 免責文言 */}
      <div className="bg-wnl border border-wnb/40 rounded-lg p-3">
        <p className="text-xs text-muted leading-relaxed">
          {disclaimer ||
            '⚠️ 本ツールのデータは上記出典からの転記です。情報の編集・解釈は一切加えていません。臨床判断は必ず原典・最新のガイドライン・各施設プロトコルに基づいて行ってください。誤りを発見された場合はお問い合わせよりご報告ください。'}
        </p>
      </div>
    </div>
  )
}
