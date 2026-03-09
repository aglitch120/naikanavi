import Link from 'next/link';

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="text-center py-16">
        <h1 className="text-3xl font-bold mb-4">
          内科専攻医の悩みを<br />
          すべて解決する
        </h1>
        <p className="text-[var(--m)] mb-8">
          J-OSLER、病歴要約、試験対策からキャリアまで。
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/blog/" className="btn-primary px-8 py-3">
            ブログを読む
          </Link>
          <Link href="/" className="btn-ghost px-8 py-3">
            アプリを使う
          </Link>
        </div>
      </section>
    </div>
  );
}
