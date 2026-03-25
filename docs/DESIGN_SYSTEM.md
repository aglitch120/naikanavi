# iwor デザインシステム

> 最終更新: 2026年3月26日

---

## 🎨 カラーパレット

### ベースカラー（CSS変数）

```css
:root {
  /* ── ページ背景 ── */
  --bg:  #F5F4F0;   /* ページ地 */
  
  /* ── サーフェス（カード等） ── */
  --s0:  #FEFEFC;   /* カード最表面 */
  --s1:  #F0EDE7;   /* カード内ネスト */
  --s2:  #E8E5DF;   /* さらに深いネスト */
  
  /* ── ボーダー ── */
  --br:  #DDD9D2;   /* 通常ボーダー */
  --br2: #C8C4BC;   /* 強めボーダー */
  
  /* ── テキスト ── */
  --tx:  #1A1917;   /* メインテキスト */
  --m:   #6B6760;   /* ミュートテキスト */
  
  /* ── アクセント（ブランドカラー） ── */
  --ac:  #1B4F3A;   /* グリーンアクセント */
  --acl: #E8F0EC;   /* アクセント薄 */
  --ac2: #155230;   /* アクセントhover */
  
  /* ── ステータス ── */
  --ok:  #166534;   /* 成功 */
  --okl: #DCFCE7;   /* 成功薄 */
  --okb: #86EFAC;   /* 成功ボーダー */
  
  --wn:  #92400E;   /* 警告 */
  --wnl: #FEF3C7;   /* 警告薄 */
  --wnb: #FCD34D;   /* 警告ボーダー */
  
  --dn:  #991B1B;   /* エラー */
  --dnl: #FEE2E2;   /* エラー薄 */
  --dnb: #FCA5A5;   /* エラーボーダー */
  
  /* ── フォント ── */
  --mono: 'DM Mono', 'Courier New', monospace;
  
  /* ── アニメーション ── */
  --ease: .18s cubic-bezier(.4, 0, .2, 1);
}
```

---

## 🏷️ クラスターカラー（ブログ用）

| クラスター | カラーコード | 用途 |
|-----------|-------------|------|
| A: J-OSLER基礎 | `#1E3A5F` | 信頼感（ネイビー） |
| B: 病歴要約 | `#1B4F3A` | ブランドカラー（グリーン） |
| C: 症例登録 | `#3D5A80` | 実務（ブルー） |
| D: 進捗管理 | `#2D6A4F` | 効率（ティール） |
| E: 試験対策 | `#7F1D1D` | 緊急（レッド） |
| F: バイト | `#4C1D95` | 副収入（パープル） |
| G: 確定申告 | `#92400E` | お金（オレンジ） |
| H: 結婚 | `#9D174D` | ライフ（ピンク） |
| I: メンタル | `#134E4A` | 癒し（ダークティール） |
| J: キャリア | `#4338CA` | 成長（インディゴ） |
| K: 学会 | `#6D28D9` | 学術（バイオレット） |

---

## 📝 タイポグラフィ

### フォントファミリー

```css
body {
  font-family: 'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

### フォントサイズ

| 用途 | サイズ | 備考 |
|------|--------|------|
| 見出し1 | clamp(18px, 4vw, 22px) | レスポンシブ |
| 見出し2 | clamp(14px, 3.5vw, 17px) | アプリヘッダー |
| 本文 | 14px〜16px | 標準 |
| キャプション | 11px〜13px | ラベル、補足 |
| 極小 | 9px〜11px | サブテキスト |

---

## 📦 コンポーネント

### デザイン原則（2026-03-16 確定）

- **フラットデザイン統一**: ガラスモーフィズム（backdrop-blur, gradient-to-br, bg-opacity）は使用禁止
- **カードスタイル**: `bg-s0 border border-br rounded-xl` で統一。hover時は `hover:border-ac/30 hover:shadow-md`
- **アイコン背景**: `bg-s1 border border-br`（フラット）。`bg-acl border-ac/10`（ガラス風）は廃止
- **CTAバナー**: ダーク背景（`#1A1917`）+ GlowButton 回転ボーダーグロー。メインCTA・PRO訴求に使用
- **GlowButton**: `components/GlowButton.tsx`。細い回転グラデーションボーダー（conic-gradient）。`intensity="default"` は通常CTA、`"strong"` はLP末尾等の強調CTA。グロー適用はCTA限定、通常カード・UIには使用禁止
- **比較表PRO列**: `-translate-y-2 shadow-lg` で浮き上がり表現
- **価格表示**: 「月額¥980 / 年額¥9,800（2ヶ月分無料）」形式。年払いアンカリングで年払い誘導

### カード

```css
.card {
  background: var(--s0);
  border: 1px solid var(--br);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}
```

### ボタン（プライマリ）

```css
.btn-p {
  width: 100%;
  padding: 14px;
  background: var(--ac);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 15px;
  font-weight: 500;
  transition: var(--ease);
  min-height: 48px;
}

.btn-p:hover {
  background: var(--ac2);
}
```

### ボタン（ゴースト）

```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--ac);
  border: 1.5px solid var(--br);
  border-radius: 9px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 500;
  transition: var(--ease);
  min-height: 44px;
  width: 100%;
}

.btn-ghost:hover {
  background: var(--acl);
  border-color: var(--ac);
}
```

### アラート

```css
.alert {
  padding: 11px 14px;
  border-radius: 9px;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  line-height: 1.5;
}

.alert-err { background: var(--dnl); color: var(--dn); border: 1px solid var(--dnb); }
.alert-ok  { background: var(--okl); color: var(--ok); border: 1px solid var(--okb); }
.alert-info { background: #EEF4FF; color: #1E40AF; border: 1px solid #BFDBFE; }
```

### 入力フィールド

```css
.field input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--br);
  border-radius: 9px;
  background: var(--bg);
  font-size: 16px;
  color: var(--tx);
  transition: var(--ease);
  outline: none;
}

.field input:focus {
  border-color: var(--ac);
  background: var(--s0);
  box-shadow: 0 0 0 3px rgba(27, 79, 58, .10);
}
```

---

## 📐 スペーシング

| 名前 | 値 | 用途 |
|------|-----|------|
| xs | 4px | 最小間隔 |
| sm | 8px | コンパクト |
| md | 12px〜14px | 標準 |
| lg | 16px〜20px | セクション間 |
| xl | 24px〜28px | 大きな区切り |

---

## 📱 レスポンシブ

### ブレークポイント

```css
/* モバイル最適化 */
@media (max-width: 480px) {
  .uname { display: none; }
}
```

### Safe Area（iOS対応）

```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
}
```

---

## 🖼️ アイコン・画像

### ロゴマーク
- サイズ: 38px × 38px
- 角丸: 9px
- 背景: `var(--ac)`

### ファビコン
- SVG形式
- パス: `/favicon.svg`

### OGP画像
- サイズ: 1200px × 630px
- フォーマット: PNG

---

## 🔒 PROゲート コンポーネント

### ProGate モザイク

```css
.pro-gate-blur {
  position: relative;
  overflow: hidden;
}

.pro-gate-blur::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70%;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: linear-gradient(to bottom, transparent, var(--s0));
}
```

### ProGate オーバーレイ

```css
.pro-gate-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  z-index: 10;
}

.pro-gate-overlay button {
  background: var(--ac);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  min-height: 44px;
  transition: var(--ease);
}
```

### お気に入りパルスアニメーション

```css
@keyframes pro-pulse {
  0% { box-shadow: 0 0 0 0 rgba(249, 168, 37, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(249, 168, 37, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 168, 37, 0); }
}

.fav-pulse {
  animation: pro-pulse 1.5s ease-out 2;  /* 2回で終了 */
}
```

### PRO バッジ

```css
.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, var(--ac), #2D6A4F);
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
```

---

## ✅ アクセシビリティ

- コントラスト比: WCAG AA準拠
- フォーカス表示: box-shadow で明示
- タップターゲット: 最小44px × 44px

---

## 📝 MDX記事スタイリングルール

### コードブロック（`pre > code`）＋コピーボタン

MDX記事内の ``` コードブロックは `CopyableCodeBlock` コンポーネント（`components/blog/CopyableCodeBlock.tsx`）で描画される。MDXコンパイラの `components.pre` にカスタムコンポーネントとして登録済み。

**主な仕様**：
- ダーク背景（`bg-tx`）＋白文字（`text-s0`）
- **テキスト折り返し**（`white-space: pre-wrap; word-break: break-all;`）— 横スクロール禁止
- 右上にコピーボタン（アイコン＋ラベル）付き
- モバイルではコピーラベルを非表示（アイコンのみ）

**注意**: `.prose pre code` には必ず背景色・テキスト色をリセットすること。インラインの `.prose code` スタイル（`bg-s1` 薄ベージュ背景）が継承されるとダーク背景上で文字が読めなくなる。

```css
/* インラインcode */
.prose code { @apply bg-s1 px-1.5 py-0.5 rounded text-sm font-mono; }

/* コードブロック（CopyableCodeBlock内のpre） */
.code-block-wrapper pre {
  @apply bg-tx text-s0 p-4 rounded-lg;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

/* ⚠️ pre内codeのリセット（必須） */
.prose pre code {
  @apply bg-transparent p-0 rounded-none text-inherit;
  white-space: pre-wrap;
  word-break: break-all;
}

/* コピーボタン */
.code-copy-btn {
  @apply absolute top-2 right-2 flex items-center gap-1.5 text-xs text-s0/70 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md transition-colors z-10;
}
```

### コードブロック使用時のチェックリスト

- 新しいCSSクラスを `.prose` 配下に追加する際は、`pre` 内でのスタイル継承に注意すること
- 例文・テンプレートは必ず ``` コードブロックで記述する（自動的にコピーボタン付きで描画される）
- `overflow-x-auto` や `whitespace-nowrap` は使用禁止（横スクロールはUX上問題がある）

---

*このデザインシステムはdemo_v14_app.htmlから抽出されました。*
