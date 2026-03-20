/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.mdx',
  ],
  theme: {
    extend: {
      colors: {
        // ベースカラー
        bg: '#F5F4F0',
        s0: '#FEFEFC',
        s1: '#F0EDE7',
        s2: '#E8E5DF',
        br: '#DDD9D2',
        br2: '#C8C4BC',
        tx: '#1A1917',
        muted: '#6B6760',
        ac: '#1B4F3A',
        acl: '#E8F0EC',
        ac2: '#155230',
        // ステータス
        ok: '#166534',
        okl: '#DCFCE7',
        okb: '#86EFAC',
        wn: '#92400E',
        wnl: '#FEF3C7',
        wnb: '#FCD34D',
        dn: '#991B1B',
        dnl: '#FEE2E2',
        dnb: '#FCA5A5',
        // クラスターカラー
        cluster: {
          a: '#1E3A5F', // J-OSLER基礎
          b: '#1B4F3A', // 病歴要約
          c: '#3D5A80', // 症例登録
          d: '#2D6A4F', // 進捗管理
          e: '#7F1D1D', // 試験対策
          f: '#4C1D95', // バイト
          g: '#92400E', // 確定申告
          h: '#9D174D', // 結婚
          i: '#134E4A', // メンタル
          j: '#4338CA', // キャリア
          k: '#6D28D9', // 学会
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', 'sans-serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
