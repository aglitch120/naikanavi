// コードで描画するアプリダッシュボードのモックアップ
// BOOTH画像のようなスクリーンショット風だが、SVG/CSSで軽量に

export function AppMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true" role="presentation">
      {/* Desktop mockup */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-[520px] mx-auto">
        {/* ブラウザバー */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 font-mono border border-gray-200">
              iwor.jp
            </div>
          </div>
        </div>

        {/* アプリヘッダー */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-ac flex items-center justify-center">
                <div className="w-3 h-3 flex flex-col gap-[2px]">
                  <div className="h-[2px] bg-white/40 rounded-full" />
                  <div className="h-[2px] bg-white/70 rounded-full" />
                  <div className="h-[2px] bg-white rounded-full" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-tx">内科専門医 取得ナビ</span>
            </div>
            <div className="flex gap-1">
              {['ダッシュボード', '症例', '疾患群', '病歴要約'].map((t, i) => (
                <span
                  key={t}
                  className={`text-[9px] px-2 py-1 rounded ${
                    i === 0
                      ? 'bg-ac text-white font-semibold'
                      : 'text-gray-400'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ダッシュボード本体 */}
        <div className="p-4 bg-gray-50/50">
          {/* 進捗サークル + サマリー */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 shrink-0">
              <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#E8E5DF" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none" stroke="#1B4F3A"
                  strokeWidth="3" strokeDasharray="56.5 94.2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-ac leading-none">60%</span>
                <span className="text-[6px] text-gray-400">総合進捗</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-tx mb-1">内科専門医 取得ナビ</div>
              <div className="text-[9px] text-gray-400">120症例 / 56疾患群 / 29病歴要約</div>
            </div>
          </div>

          {/* 3カラムスタッツ */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard label="症例数" current={16} total={120} />
            <StatCard label="疾患群" current={6} total={56} />
            <StatCard label="病歴要約" current={2} total={29} />
          </div>

          {/* 領域別テーブル */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <span className="text-[10px] font-bold text-tx">領域別 達成状況</span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { name: '総合 I', color: '#22C55E', cases: '0/-', groups: '0/1', summary: '1/1' },
                { name: '総合 II', color: '#22C55E', cases: '3/-', groups: '1/1', summary: '0/1' },
                { name: '消化器', color: '#F59E0B', cases: '5/10', groups: '2/5', summary: '1/3' },
                { name: '循環器', color: '#EF4444', cases: '0/10', groups: '0/5', summary: '0/3' },
                { name: '呼吸器', color: '#EF4444', cases: '2/10', groups: '1/4', summary: '0/3' },
              ].map((row) => (
                <div key={row.name} className="flex items-center px-3 py-1.5 text-[9px]">
                  <div className="flex items-center gap-1.5 w-16">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="text-gray-600 font-medium">{row.name}</span>
                  </div>
                  <span className="flex-1 text-center text-gray-400 font-mono">{row.cases}</span>
                  <span className="flex-1 text-center text-gray-400 font-mono">{row.groups}</span>
                  <span className="flex-1 text-center text-gray-400 font-mono">{row.summary}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile mockup (スマホらしい縦横比で右下に重ねる) */}
      <div className="absolute -right-2 -bottom-2 md:right-[-24px] md:bottom-[-16px] w-[120px] md:w-[140px]">
        <div className="bg-gray-900 rounded-[18px] p-[3px] shadow-2xl" style={{ aspectRatio: '9 / 19' }}>
          {/* ノッチ */}
          <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-10 h-[4px] bg-gray-900 rounded-b-md z-20" />
          <div className="bg-white rounded-[15px] overflow-hidden h-full flex flex-col">
            {/* ステータスバー */}
            <div className="bg-gray-50 px-2.5 py-1.5 flex items-center justify-between border-b border-gray-100 shrink-0">
              <span className="text-[6px] font-bold text-tx truncate">≡ iwor</span>
              <span className="text-[5px] text-green-600 font-medium shrink-0">✓ 保存済み</span>
            </div>
            {/* タブバー */}
            <div className="flex border-b border-gray-100 px-1.5 shrink-0">
              {['ダッシュボード', '症例', '疾患群', '要約'].map((t, i) => (
                <span
                  key={t}
                  className={`text-[4.5px] px-1 py-1 ${
                    i === 0 ? 'text-ac font-bold border-b border-ac' : 'text-gray-300'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
            {/* ミニダッシュボード */}
            <div className="p-2 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="relative w-7 h-7 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#E8E5DF" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1B4F3A" strokeWidth="3.5" strokeDasharray="56.5 94.2" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[6px] font-bold text-ac">60%</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[6px] font-bold text-tx truncate">内科専門医 取得ナビ</div>
                  <div className="text-[4.5px] text-gray-400">120症例 / 56疾患群 / 29要約</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {[
                  { l: '症例数', v: '16', t: '/120' },
                  { l: '疾患群', v: '6', t: '/56' },
                  { l: '要約', v: '2', t: '/29' },
                ].map((s) => (
                  <div key={s.l} className="bg-gray-50 rounded px-1 py-0.5 text-center">
                    <div className="text-[4.5px] text-gray-400">{s.l}</div>
                    <div className="text-[8px] font-bold text-tx leading-none">
                      {s.v}<span className="text-[5px] text-gray-300 font-normal">{s.t}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* ミニ領域リスト */}
              <div className="text-[5px] font-bold text-tx mb-0.5">領域別 達成状況</div>
              {[
                { name: '総合 I', color: '#22C55E', v: '0/1' },
                { name: '消化器', color: '#F59E0B', v: '2/5' },
                { name: '循環器', color: '#EF4444', v: '0/5' },
                { name: '呼吸器', color: '#EF4444', v: '1/4' },
                { name: '腎臓', color: '#EF4444', v: '1/5' },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between py-[1px]">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-[4.5px] text-gray-500">{r.name}</span>
                  </div>
                  <span className="text-[4.5px] text-gray-400 font-mono">{r.v}</span>
                </div>
              ))}
            </div>
            {/* ホームバー */}
            <div className="shrink-0 flex justify-center pb-1 pt-0.5">
              <div className="w-8 h-[2px] bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, current, total }: { label: string; current: number; total: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
      <div className="text-[8px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-[18px] font-bold text-tx leading-none">
        {current}<span className="text-[10px] text-gray-300 font-normal">/{total}</span>
      </div>
    </div>
  )
}

// 幾何学的デコレーション（ヒーロー背景用）
export function GeometricDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 左上: ドットグリッド */}
      <svg className="absolute -top-8 -left-8 w-48 h-48 text-ac/[0.06]" viewBox="0 0 200 200">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={15 + col * 25} cy={15 + row * 25} r="2" fill="currentColor" />
          ))
        )}
      </svg>

      {/* 右上: 同心円 */}
      <svg className="absolute -top-12 -right-12 w-64 h-64 text-ac/[0.04]" viewBox="0 0 200 200">
        {[30, 50, 70, 90].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>

      {/* 左下: 斜線パターン */}
      <svg className="absolute -bottom-4 -left-4 w-40 h-40 text-ac/[0.05]" viewBox="0 0 160 160">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={0} y1={i * 22} x2={i * 22} y2={0} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>

      {/* 右下: ダイヤモンドグリッド */}
      <svg className="absolute -bottom-6 -right-6 w-36 h-36 text-ac/[0.05]" viewBox="0 0 140 140">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={15 + col * 40}
              y={15 + row * 40}
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              transform={`rotate(45, ${25 + col * 40}, ${25 + row * 40})`}
            />
          ))
        )}
      </svg>
    </div>
  )
}

// 機能バッジ（ヒーロー下のタグライン）
export function FeatureBadges() {
  const badges = [
    'スマホ対応',
    '買い切り・月額なし',
    '改定第2版対応',
    'AI病歴要約テンプレート',
    '問題演習',
  ]

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {badges.map((badge, i) => (
        <span
          key={badge}
          className={`text-xs px-3 py-1.5 rounded-full border ${
            i === badges.length - 1
              ? 'bg-orange-50 border-orange-200 text-orange-700 font-semibold'
              : 'bg-s0 border-br text-muted'
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  )
}
