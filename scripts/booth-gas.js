/**
 * iwor PRO — BOOTH注文自動処理 (Google Apps Script)
 *
 * セットアップ手順:
 *   1. https://script.google.com で新しいプロジェクトを作成
 *   2. このコードを貼り付け
 *   3. API_URL と GAS_KEY を自分の値に変更
 *   4. checkBoothOrders を1分間隔のトリガーに設定
 *      → 「トリガー」→「トリガーを追加」→ 関数: checkBoothOrders
 *        → イベントのソース: 時間主導型 → 分ベースのタイマー → 1分ごと
 *   5. 初回実行時にGmail権限を許可
 *
 * 処理フロー:
 *   BOOTH注文メール → Gmail受信 → GAS(1分ごと) → Worker API → KV保存
 */

// ═══ 設定（必ず変更） ═══
const API_URL = "https://iwor-api.YOUR_SUBDOMAIN.workers.dev"; // Worker デプロイ後のURL
const GAS_KEY = "YOUR_GAS_KEY_HERE"; // Worker の GAS_KEY secret と同じ値
const LABEL_NAME = "booth-processed"; // 処理済みラベル名

/**
 * メイン関数: BOOTHの注文メールをチェックして Worker に送信
 * トリガーで1分ごとに実行
 */
function checkBoothOrders() {
  // 処理済みラベルを取得（なければ作成）
  let label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    label = GmailApp.createLabel(LABEL_NAME);
  }

  // 未処理のBOOTH注文メールを検索
  // 「商品が購入されました」+ BOOTH + 処理済みラベルなし
  const query = 'from:noreply@booth.pm subject:"商品が購入されました" -label:' + LABEL_NAME;
  const threads = GmailApp.search(query, 0, 20);

  if (threads.length === 0) return;

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      try {
        const result = processOrderEmail(message);
        if (result) {
          Logger.log("注文処理成功: #" + result.orderNumber);
        }
      } catch (e) {
        Logger.log("処理エラー: " + e.message);
      }
    }
    // 処理済みラベルを付与
    thread.addLabel(label);
  }
}

/**
 * メール本文から注文情報を抽出して Worker API に送信
 */
function processOrderEmail(message) {
  const body = message.getPlainBody();
  const subject = message.getSubject();

  // 注文番号を抽出（件名 or 本文から）
  let orderNumber = null;

  // 件名から: "商品が購入されました（注文番号 77836313）[BOOTH]"
  const subjectMatch = subject.match(/注文番号\s*(\d+)/);
  if (subjectMatch) {
    orderNumber = subjectMatch[1];
  }

  // 本文からもフォールバック
  if (!orderNumber) {
    const bodyMatch = body.match(/注文番号[^\d]*(\d{5,12})/);
    if (bodyMatch) {
      orderNumber = bodyMatch[1];
    }
  }

  if (!orderNumber) {
    Logger.log("注文番号が見つかりません: " + subject);
    return null;
  }

  // 商品名を抽出（「注文内容」セクションの次の行）
  let productName = "";
  const contentMatch = body.match(/注文内容[\s\S]*?-{5,}\s*\n(.*)/);
  if (contentMatch) {
    productName = contentMatch[1].trim();
  }

  // 購入者メール（あれば）
  let buyerEmail = "";
  const emailMatch = body.match(/購入者.*?([^\s@]+@[^\s@]+\.[^\s@]+)/);
  if (emailMatch) {
    buyerEmail = emailMatch[1];
  }

  // Worker API に送信
  const response = UrlFetchApp.fetch(API_URL + "/api/store-order", {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Api-Key": GAS_KEY,
    },
    payload: JSON.stringify({
      orderNumber: orderNumber,
      productName: productName,
      buyerEmail: buyerEmail,
    }),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  const result = JSON.parse(response.getContentText());

  if (status === 200 && result.ok) {
    return { orderNumber, productName };
  } else {
    Logger.log("API エラー: " + response.getContentText());
    return null;
  }
}

/**
 * テスト用: 手動で1通テスト処理
 * スクリプトエディタから直接実行して動作確認
 */
function testWithLatestOrder() {
  const threads = GmailApp.search('from:noreply@booth.pm subject:"商品が購入されました"', 0, 1);
  if (threads.length === 0) {
    Logger.log("BOOTH注文メールが見つかりません");
    return;
  }
  const message = threads[0].getMessages()[0];
  Logger.log("件名: " + message.getSubject());
  Logger.log("本文: " + message.getPlainBody().substring(0, 500));

  const result = processOrderEmail(message);
  Logger.log("結果: " + JSON.stringify(result));
}
