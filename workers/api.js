// ═══════════════════════════════════════════════════════════════
//  iwor PRO — Cloudflare Worker API
//
//  KV namespace binding: IWOR_KV
//  Secrets: ADMIN_KEY, GAS_KEY
//
//  エンドポイント:
//    POST /api/store-order   — GASから注文を保存（GAS_KEY認証）
//    POST /api/activate      — 注文番号でPROを有効化
//    GET  /api/admin/orders  — 管理者: 注文一覧
//    POST /api/admin/add-order — 管理者: 手動で注文追加
//    DELETE /api/admin/order  — 管理者: 注文削除
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = ["https://iwor.jp", "http://localhost:3000"];

function getCors(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Api-Key,X-Admin-Key",
    "Vary": "Origin",
  };
}

const json = (data, status = 200, request = null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...getCors(request) },
  });

// ── プラン判定 ──
function detectPlan(productName) {
  if (!productName) return { plan: "pro_1y", durationDays: 365, label: "1年パス" };
  if (productName.includes("3年") || productName.includes("3year"))
    return { plan: "pro_3y", durationDays: 1095, label: "3年パス" };
  if (productName.includes("2年") || productName.includes("2year"))
    return { plan: "pro_2y", durationDays: 730, label: "2年パス" };
  // デフォルト: 1年（商品名が不明でも1年パスとして扱う）
  return { plan: "pro_1y", durationDays: 365, label: "1年パス" };
}

// ── KVキー ──
const orderKey = (n) => `order:${n}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: getCors(request) });
    }

    // ══════════════════════════════════════════════════
    //  GAS → 注文保存
    //  POST /api/store-order
    //  Header: X-Api-Key: {GAS_KEY}
    //  Body: { orderNumber, productName, buyerEmail? }
    // ══════════════════════════════════════════════════
    if (path === "/api/store-order" && request.method === "POST") {
      const key = request.headers.get("X-Api-Key");
      if (key !== env.GAS_KEY) return json({ error: "Forbidden" }, 403, request);

      const { orderNumber, productName, buyerEmail } = await request.json();
      if (!orderNumber) return json({ error: "orderNumber required" }, 400, request);

      // 重複チェック
      const existing = await env.IWOR_KV.get(orderKey(orderNumber));
      if (existing) return json({ ok: true, message: "already stored", orderNumber }, 200, request);

      const plan = detectPlan(productName);

      await env.IWOR_KV.put(
        orderKey(orderNumber),
        JSON.stringify({
          orderNumber,
          productName: productName || "",
          buyerEmail: buyerEmail || "",
          plan: plan.plan,
          durationDays: plan.durationDays,
          storedAt: new Date().toISOString(),
          activated: false,
          activatedAt: null,
          expiresAt: null,
        })
      );

      return json({ ok: true, orderNumber, plan: plan.plan }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ユーザー → PRO有効化
    //  POST /api/activate
    //  Body: { orderNumber }
    // ══════════════════════════════════════════════════
    if (path === "/api/activate" && request.method === "POST") {
      const { orderNumber } = await request.json();

      if (!orderNumber || !/^\d{5,12}$/.test(String(orderNumber).trim())) {
        return json({ error: "注文番号を正しく入力してください（数字5〜12桁）" }, 400, request);
      }

      const raw = await env.IWOR_KV.get(orderKey(orderNumber));
      if (!raw) {
        return json(
          { error: "注文番号が見つかりません。BOOTHの注文確認メールに記載の番号をご確認ください。" },
          404,
          request
        );
      }

      const order = JSON.parse(raw);

      if (order.activated) {
        return json(
          { error: "この注文番号は既に使用済みです。" },
          409,
          request
        );
      }

      // 有効化
      const now = new Date();
      const expiresAt = new Date(now.getTime() + order.durationDays * 24 * 60 * 60 * 1000);

      const updated = {
        ...order,
        activated: true,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await env.IWOR_KV.put(orderKey(orderNumber), JSON.stringify(updated));

      return json(
        {
          ok: true,
          plan: order.plan,
          durationDays: order.durationDays,
          activatedAt: updated.activatedAt,
          expiresAt: updated.expiresAt,
        },
        200,
        request
      );
    }

    // ══════════════════════════════════════════════════
    //  管理者: 注文一覧
    //  GET /api/admin/orders?key={ADMIN_KEY}
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/orders" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const list = await env.IWOR_KV.list({ prefix: "order:" });
      const orders = [];
      for (const item of list.keys) {
        const raw = await env.IWOR_KV.get(item.name);
        if (raw) orders.push(JSON.parse(raw));
      }

      // 新しい順
      orders.sort((a, b) => new Date(b.storedAt) - new Date(a.storedAt));

      return json({ orders, total: orders.length }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  管理者: 手動注文追加
    //  POST /api/admin/add-order
    //  Header: X-Admin-Key: {ADMIN_KEY}
    //  Body: { orderNumber, productName, buyerEmail? }
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/add-order" && request.method === "POST") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const { orderNumber, productName, buyerEmail } = await request.json();
      if (!orderNumber) return json({ error: "orderNumber required" }, 400, request);

      const plan = detectPlan(productName || "iwor PRO 1年パス");

      await env.IWOR_KV.put(
        orderKey(orderNumber),
        JSON.stringify({
          orderNumber,
          productName: productName || "手動追加",
          buyerEmail: buyerEmail || "",
          plan: plan?.plan || "pro_1y",
          durationDays: plan?.durationDays || 365,
          storedAt: new Date().toISOString(),
          activated: false,
          activatedAt: null,
          expiresAt: null,
        })
      );

      return json({ ok: true, orderNumber }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  管理者: 注文削除
    //  DELETE /api/admin/order?key={ADMIN_KEY}&order={orderNumber}
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/order" && request.method === "DELETE") {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const orderNumber = url.searchParams.get("order");
      if (!orderNumber) return json({ error: "order param required" }, 400, request);

      await env.IWOR_KV.delete(orderKey(orderNumber));
      return json({ ok: true, deleted: orderNumber }, 200, request);
    }

    // ── 404 ──
    return json({ error: "Not Found" }, 404, request);
  },
};
