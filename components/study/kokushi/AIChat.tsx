'use client'

import { useState } from 'react'
import TabBar from './TabBar'
import KokushiGlowButton from './KokushiGlowButton'
import { CHAT_HISTORY } from './mock-data'

const SUGGESTIONS = ['循環器の苦手克服', '119回の頻出テーマ', '学習プラン作成']

export default function AIChat() {
  const [chatTab, setChatTab] = useState<'free' | 'history'>('free')
  const [chatInput, setChatInput] = useState('')

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-xl font-bold text-tx mb-5">iwor AI</h1>
        <TabBar
          items={[['free', 'フリーチャット'], ['history', 'チャット履歴']]}
          active={chatTab}
          onChange={(k) => setChatTab(k as 'free' | 'history')}
        />
      </div>

      {chatTab === 'free' ? (
        <div className="flex flex-col flex-1 overflow-hidden px-6 pb-6">
          <div className="flex-1 overflow-y-auto">
            <div className="flex gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-acl text-ac flex items-center justify-center font-bold text-sm shrink-0">
                i
              </div>
              <div className="bg-s0 border border-br rounded-xl p-4 flex-1">
                <p className="text-sm text-tx mb-3">何でも聞いてください。</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setChatInput(s)}
                      className="px-3 py-1.5 rounded-lg bg-s1 border border-br text-xs text-tx hover:bg-s2 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-br">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="質問を入力…"
              className="flex-1 px-4 py-3 rounded-xl border border-br bg-s0 text-sm text-tx outline-none focus:border-ac transition-colors"
            />
            <KokushiGlowButton small onClick={() => setChatInput('')}>
              送信 3cr
            </KokushiGlowButton>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <p className="text-xs text-muted mb-4">過去のチャット（演習中AI対話含む）</p>
          <div className="flex flex-col gap-3">
            {CHAT_HISTORY.map((h) => (
              <div key={h.id} className="bg-s0 border border-br rounded-xl p-4 cursor-pointer hover:border-ac transition-colors">
                <p className="text-sm font-semibold text-tx mb-1">{h.title}</p>
                <p className="text-xs text-muted">出典: {h.src} | {h.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
