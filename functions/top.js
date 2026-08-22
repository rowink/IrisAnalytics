import { formatTime } from "./utils/index.js";
import { verifySign } from "../src/utils/sign.ts";

/**
 * Public top pages API (JSON)
 *
 * GET /top?siteID=<id>&time=<period>&limit=<n>&sign=<6-digit sign>
 *   - siteID: website identifier (required)
 *   - time:   stats period, default today (today/1d/week/month/7d/30d/60d/90d)
 *   - limit:  number of pages to return, default 10, range 1-100
 *   - sign:   6-digit access sign (computed from websiteID|deploy-host|salt);
 *            invalid or missing sign returns 401
 *
 * Returns the top N most-visited pages for a tracked site (siteID):
 *   { success: true, data: [{ name: "/about", value: 123 }, ...] }
 * value is the raw view count (SUM(_sample_interval), same pv measure as /stats).
 * Sign mechanism matches /stats and /badge: salt is the server-side
 * CLOUDFLARE_ACCOUNT_ID, never exposed to the client.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

const TIME_ARR = ["today", "1d", "week", "month", "7d", "30d", "60d", "90d"];

// 转义 SQL 字符串字面量中的单引号（SQLite 方言：'' 表示一个字面单引号），防止拼接注入
const escapeSql = (str) => String(str).replace(/'/g, "''");

const json = (body, status = 200, extraHeaders = {}) =>
  Response.json(body, { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...extraHeaders } });

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const siteID = (url.searchParams.get("siteID") || "").trim();
    const time = TIME_ARR.includes(url.searchParams.get("time")) ? url.searchParams.get("time") : "today";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10) || 10, 1), 100);

    // 参数校验
    if (!siteID) {
      return json({ success: false, code: 400, message: "siteID is required" }, 400);
    }
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
      return json({ success: false, code: 500, message: "Analytics not configured" }, 500);
    }

    // 签名校验（严格模式：无效签名直接拒绝，避免无意义的配额消耗）
    const host = request.headers.get("host") || url.host;
    const sign = url.searchParams.get("sign") || "";
    if (!verifySign(siteID, host, sign, env.CLOUDFLARE_ACCOUNT_ID)) {
      return json({ success: false, code: 401, message: "Invalid sign" }, 401, { "Cache-Control": "no-store" });
    }

    // 查询热门页面（pv 口径与 /stats 一致，用 SUM(_sample_interval)）
    const tz = (request.cf && request.cf.timezone) || "Asia/Shanghai";
    const query = `SELECT blob3 AS page, SUM(_sample_interval) AS count FROM AnalyticsDataset WHERE timestamp >= ${formatTime(time, tz)} AND blob1 = '${escapeSql(siteID)}' GROUP BY blob3 ORDER BY count DESC LIMIT ${limit}`;
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`, {
      method: "POST",
      body: query,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "X-Source": "Cloudflare-Workers",
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    });
    const { data } = await cfRes.json();
    const list = (data || []).map((row) => ({ name: row.page || "/", value: Math.round(Number(row.count) || 0) }));

    return json({ success: true, data: list }, 200, { "Cache-Control": "public, max-age=300, s-maxage=300" });
  } catch (error) {
    console.log(error);
    return json({ success: false, code: 500, message: "Top Error" }, 500, { "Cache-Control": "no-store" });
  }
}
