import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '内科専門医 取得ナビ | 内科ナビ',
  description: 'J-OSLER進捗管理、病歴要約テンプレート、試験対策クイズなど、内科専攻医に必要なツールをすべて無料で提供。',
  openGraph: {
    title: '内科専門医 取得ナビ | 内科ナビ',
    description: 'J-OSLER進捗管理、病歴要約テンプレート、試験対策クイズなど、内科専攻医に必要なツールをすべて無料で提供。',
    type: 'website',
  },
}

export default function AppPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* プレースホルダー - 実際のアプリは別途統合 */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-s0 border border-br rounded-xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-ac rounded-xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-tx mb-4">
            内科専門医 取得ナビ
          </h1>
          
          <p className="text-muted mb-8 max-w-md mx-auto">
            J-OSLER進捗管理、病歴要約テンプレート、試験対策クイズなど、
            内科専攻医に必要なツールをすべて提供しています。
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-acl rounded-lg p-4">
              <div className="text-2xl font-bold text-ac">56</div>
              <div className="text-sm text-muted">症例登録</div>
            </div>
            <div className="bg-acl rounded-lg p-4">
              <div className="text-2xl font-bold text-ac">29</div>
              <div className="text-sm text-muted">病歴要約</div>
            </div>
            <div className="bg-acl rounded-lg p-4">
              <div className="text-2xl font-bold text-ac">120h</div>
              <div className="text-sm text-muted">学習時間</div>
            </div>
          </div>

          <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8">
            <p className="text-wn text-sm">
              🚧 アプリ統合作業中です。現在はデモ版をご利用いただけます。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/demo_v14_app.html"
              className="bg-ac text-white px-6 py-3 rounded-lg font-medium hover:bg-ac2 transition-colors"
            >
              デモ版を開く
            </a>
            <a
              href="/blog"
              className="bg-s0 text-ac border border-br px-6 py-3 rounded-lg font-medium hover:bg-acl hover:border-ac transition-colors"
            >
              ブログを読む
            </a>
          </div>
        </div>

        {/* 機能紹介セクション */}
        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          <div className="bg-s0 border border-br rounded-xl p-6 text-left">
            <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-tx mb-2">J-OSLER 進捗管理</h3>
            <p className="text-sm text-muted">
              症例登録・病歴要約の進捗を可視化。目標達成までの残り日数と必要ペースを自動計算。
            </p>
          </div>

          <div className="bg-s0 border border-br rounded-xl p-6 text-left">
            <div className="w-10 h-10 bg-ac rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-tx mb-2">病歴要約テンプレート</h3>
            <p className="text-sm text-muted">
              AIが病歴要約の下書きを自動生成。指導医に見せやすい文章フォーマットで出力。
            </p>
          </div>

          <div className="bg-s0 border border-br rounded-xl p-6 text-left">
            <div className="w-10 h-10 bg-[#7F1D1D] rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-tx mb-2">内科専門医試験対策</h3>
            <p className="text-sm text-muted">
              過去問演習・分野別クイズで試験対策。弱点分野を自動分析して効率学習。
            </p>
          </div>

          <div className="bg-s0 border border-br rounded-xl p-6 text-left">
            <div className="w-10 h-10 bg-[#4C1D95] rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-tx mb-2">バイト・確定申告</h3>
            <p className="text-sm text-muted">
              医師バイト情報や確定申告のやり方をわかりやすく解説。専攻医のお金の不安を解消。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
