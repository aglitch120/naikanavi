'use client'

const ADD_OPTIONS = [
  { icon: '✏️', label: '自分でテキスト入力', desc: '表面・裏面を手動で作成' },
  { icon: '✕', label: '間違えた問題から', desc: '✕マークの問題からAI生成' },
  { icon: '🔍', label: '特定の問題から', desc: '問題番号を指定してAI生成' },
  { icon: '📄', label: 'CSVインポート', desc: '表面,裏面 のCSVファイル' },
  { icon: '📦', label: 'Ankiファイルインポート', desc: '.apkgファイルを読み込み' },
  { icon: '🌐', label: '共有デッキからインポート', desc: '他のユーザーのデッキを追加' },
]

interface AddCardsModalProps {
  onClose: () => void
}

export default function AddCardsModal({ onClose }: AddCardsModalProps) {
  return (
    <div className="bg-s0 border-2 border-ac rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-tx">カードを追加</span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-s1 text-muted text-lg leading-none border-none bg-transparent cursor-pointer"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-2.5">
        {ADD_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className="flex items-start gap-3 p-3.5 rounded-[10px] border border-br bg-s0 text-left w-full hover:border-br2 transition-colors cursor-pointer"
          >
            <span className="text-xl leading-none mt-0.5">{opt.icon}</span>
            <div>
              <div className="text-[13px] font-semibold text-tx">{opt.label}</div>
              <div className="text-[11px] text-muted mt-0.5">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
