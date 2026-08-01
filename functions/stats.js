import { formatTime } from "./utils/index.js";
import { verifySign } from "../src/utils/sign.ts";

/**
 * 公开统计数据接口（JSON）
 *
 * GET /stats?siteID=<id>&time=<period>&sign=<6位签名>
 *   - siteID: 网站标识（必填）
 *   - time:   统计周期，默认 today（today/1d/week/month/7d/30d/60d/90d）
 *   - sign:   6 位访问签名（由 网站ID|部署域名|盐 计算）；无效/缺失时返回 401
 *
 * 返回聚合数据（仅 pv/uv/visit 三个数字，不含路径/来源等明细），
 * 供外部网站免登录展示统计数字。签名机制与 /badge 一致：
 * 盐为服务端 CLOUDFLARE_ACCOUNT_ID，前端不可见。
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

    // 查询聚合数据（pv=浏览量，uv=访客数，visit=访问次数）
    const tz = (request.cf && request.cf.timezone) || "Asia/Shanghai";
    const query = `SELECT SUM(_sample_interval) AS views, SUM(IF(double1 = '1', double1, 0.0)) AS visitor, SUM(IF(double2 = '1', double2, 0.0)) AS visit ` + `FROM AnalyticsDataset WHERE timestamp >= ${formatTime(time, tz)} AND blob1 = '${escapeSql(siteID)}'`;
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
    const row = (data && data[0]) || {};

    return json(
      {
        success: true,
        data: {
          siteID,
          time,
          pv: Math.round(Number(row.views) || 0),
          uv: Math.round(Number(row.visitor) || 0),
          visit: Math.round(Number(row.visit) || 0)
        }
      },
      200,
      { "Cache-Control": "public, max-age=300, s-maxage=300" }
    );
  } catch (error) {
    console.log(error);
    return json({ success: false, code: 500, message: "Stats Error" }, 500, { "Cache-Control": "no-store" });
  }
}
