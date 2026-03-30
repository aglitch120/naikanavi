'use client'

import { useState } from 'react'
import Badge from './Badge'
import KokushiGlowButton from './KokushiGlowButton'

interface AIFromPracticeProps {
  onBack: () => void
}

export default function AIFromPractice({ onBack }: AIFromPracticeProps) {
  const [chatInput, setChatInput] = useState('')

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-6">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} className="text-sm text-muted hover:text-tx transition-colors">
          ← 問題に戻る
        </button>
        <Badge>119A1</Badge>
        <Badge color="ai">AI対話</Badge>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4">
        {/* User message */}
        <div className="flex items-end justify-end gap-2">
          <div className="bg-ac text-white rounded-[14px] px-4 py-2.5 max-w-[75%] text-sm">
            IgG4が上がるメカニズムは？
          </div>
          <div className="w-7 h-7 rounded-full bg-s2 text-muted flex items-center justify-center text-xs font-semibold shrink-0">
            U
          </div>
        </div>

        {/* AI message */}
        <div className="flex items-end gap-2">
          <div className="w-7 h-7 rounded-full bg-acl text-ac flex items-center justify-center text-xs font-semibold shrink-0">
            i
          </div>
          <div
            className="bg-s0 border border-br px-4 py-2.5 max-w-[80%] text-sm text-tx"
            style={{ borderRadius: '14px', borderTopLeftRadius: '4px' }}
          >
            自己免疫性膵炎ではTh2優位の免疫応答が亢進し、IL-4・IL-10・IL-13が産生されます。これらがB細胞のクラススイッチを誘導してIgG4を選択的に上昇させます。IgG4自体は抗炎症的に働くとされ、組織傷害を制御する役割もあります。
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-br">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="追加で質問…"
          className="flex-1 px-4 py-3 rounded-xl border border-br bg-s0 text-sm text-tx outline-none focus:border-ac transition-colors"
        />
        <KokushiGlowButton small onClick={() => setChatInput('')}>
          送信
        </KokushiGlowButton>
      </div>
    </div>
  )
}
