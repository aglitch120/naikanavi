'use client'

export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'var(--wnl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--wn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0122.56 9" />
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
          <path d="M8.53 16.11a6 6 0 016.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <h1 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--tx)',
        marginBottom: '0.75rem',
      }}>
        オフラインです
      </h1>

      <p style={{
        fontSize: '0.9rem',
        color: 'var(--m)',
        maxWidth: '24rem',
        lineHeight: 1.6,
        marginBottom: '1.5rem',
      }}>
        インターネット接続がありません。
        <br />
        一度開いた臨床ツールはオフラインでも使えます。
      </p>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <a
          href="/tools"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'var(--ac)',
            color: '#fff',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          臨床ツールへ
        </a>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'var(--s0)',
            color: 'var(--tx)',
            border: '1px solid var(--br)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          再読み込み
        </button>
      </div>

      <p style={{
        fontSize: '0.75rem',
        color: 'var(--m)',
        marginTop: '2rem',
        maxWidth: '20rem',
        lineHeight: 1.5,
      }}>
        💡 よく使うツールを事前に開いておくと、電波の弱い病棟や手術室でも使えます
      </p>
    </div>
  )
}
