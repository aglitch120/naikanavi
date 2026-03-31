#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
medu4実験: 厚労省由来の公開情報（問題文・選択肢）のみ取得。
QR認証はユーザーが手動で行い、ページ遷移を自動検出して進む。
"""

import json, time
from playwright.sync_api import sync_playwright

TARGETS = [f"https://www.medu4.net/q/118A{i}" for i in range(1, 6)]

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--window-size=1280,900"]
        )
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # ログインページへ
        print("ブラウザを開きました。QR認証してください。")
        print("認証完了を自動検出します（最大3分待機）...")
        page.goto("https://www.medu4.net/login", wait_until="networkidle", timeout=30000)
        login_url = page.url

        # 認証完了を自動検出: URLがloginから変わるか、ページ内容が変化するまで待つ
        for i in range(180):  # 3分
            time.sleep(1)
            current = page.url
            if "login" not in current.lower() and current != login_url:
                print(f"認証検出！ URL: {current}")
                break
            # ページ内にダッシュボード要素が出たかチェック
            try:
                if page.query_selector("text=ログアウト") or page.query_selector("text=Dashboard"):
                    print("認証検出！（ページ内要素）")
                    break
            except:
                pass
            if i % 30 == 0 and i > 0:
                print(f"  待機中... {i}秒")
        else:
            print("タイムアウト。終了します。")
            browser.close()
            return

        page.wait_for_timeout(2000)
        print(f"現在のURL: {page.url}")
        print()

        # 問題ページを取得
        results = []
        for url in TARGETS:
            qid = url.split("/")[-1]
            print(f"取得中: {qid}")
            try:
                page.goto(url, wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(1500)

                data = page.evaluate("""() => {
                    return {
                        url: location.href,
                        title: document.title,
                        body: document.body.innerText.substring(0, 6000),
                    };
                }""")
                results.append({"qid": qid, **data})
                # 先頭200文字だけ表示
                print(f"  OK: {data['body'][:200].replace(chr(10), ' | ')}")
                print()
            except Exception as e:
                print(f"  ERROR: {e}")
                results.append({"qid": qid, "error": str(e)})

            # 普通のユーザーの閲覧速度
            time.sleep(2)

        # 保存
        out = "/tmp/medu4_experiment.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n保存: {out}")

        browser.close()
        print("完了。")

if __name__ == "__main__":
    main()
