import { formatTime } from "./utils/index.js";
import { verifySign } from "../src/utils/sign.ts";

/**
 * 动态 SVG 徽标
 *
 * GET /badge?siteID=<id>&time=<period>&style=<uv|pv>&label=<title>&sign=<6位签名>
 *   - siteID: 网站标识（必填）
 *   - time:   统计周期，默认 today（today/1d/week/month/7d/30d/60d/90d）
 *   - style:  徽标模板，默认 uv（uv=访客数 / pv=浏览量）
 *   - label:  自定义标题文字（URL 编码），缺省时保留模板默认标题
 *   - sign:   6 位访问签名（由 网站ID|部署域名|盐 计算）；缺省/错误时返回占位数据（value=0）
 *
 * SVG 模板来自 public/image/{style}.xml（本站静态资源，运行时拉取），
 * 仅替换其中 id="title" 与 id="value" 的 text 内容，保留原有样式属性。
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

const TIME_ARR = ["today", "1d", "week", "month", "7d", "30d", "60d", "90d"];
const STYLE_ARR = ["uv", "pv"];
const MAX_LABEL_LENGTH = 50;

// 转义 XML 特殊字符，防止 SVG 注入
const escapeXml = (str) => String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// 千分位格式化：1234567 -> "1,234,567"
const formatNumber = (n) => {
  const num = Math.round(Number(n) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 替换 SVG 模板中指定 id 的 text 元素内容，保留原有属性
const replaceTextContent = (svg, id, content) => svg.replace(new RegExp(`(<text[\\s\\S]*?id="${id}"[\\s\\S]*?>)[\\s\\S]*?(</text>)`), `$1${content}$2`);

// 转义 SQL 字符串字面量中的单引号（SQLite 方言：'' 表示一个字面单引号），防止拼接注入
const escapeSql = (str) => String(str).replace(/'/g, "''");

// 错误时返回简易 SVG，避免页面出现破图
const errorSvg = (message, status) => new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60">` + `<rect width="240" height="60" rx="8" fill="#fef2f2"/>` + `<rect width="240" height="60" rx="8" fill="none" stroke="#fecaca"/>` + `<text x="120" y="36" font-size="14" fill="#dc2626" text-anchor="middle">${escapeXml(message)}</text>` + `</svg>`, { status, headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store", ...CORS_HEADERS } });

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const siteID = (url.searchParams.get("siteID") || "").trim();
    const time = TIME_ARR.includes(url.searchParams.get("time")) ? url.searchParams.get("time") : "today";
    const style = STYLE_ARR.includes(url.searchParams.get("style")) ? url.searchParams.get("style") : "uv";
    const label = (url.searchParams.get("label") || "").trim().slice(0, MAX_LABEL_LENGTH);

    // 参数校验
    if (!siteID) {
      return errorSvg("Invalid siteID", 400);
    }
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
      return errorSvg("Analytics not configured", 500);
    }

    // 签名校验（宽松模式：无/错 sign 时返回占位数据 value=0，不报错）
    const host = request.headers.get("host") || url.host;
    const sign = url.searchParams.get("sign") || "";
    const valid = verifySign(siteID, host, sign);

    // 查询统计数据（uv=访客数，pv=浏览量；仅签名有效时查询，节省配额）
    let value = 0;
    if (valid) {
      const tz = (request.cf && request.cf.timezone) || "Asia/Shanghai";
      const query = `SELECT SUM(_sample_interval) AS views, SUM(IF(double1 = '1', double1, 0.0)) AS visitor, ` + `SUM(IF(double2 = '1', double2, 0.0)) AS visit ` + `FROM AnalyticsDataset WHERE timestamp >= ${formatTime(time, tz)} AND blob1 = '${escapeSql(siteID)}'`;
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
      value = style === "pv" ? row.views : row.visitor;
    }

    // 拉取 SVG 模板（本站静态资源，单一来源）
    const tplRes = await fetch(`${url.origin}/svg/${style}.svg`);
    if (!tplRes.ok) {
      return errorSvg(`Template ${style}.xml not found`, 502);
    }
    let svg = await tplRes.text();

    // 填充动态内容：label 缺省时保留模板原标题
    if (label) svg = replaceTextContent(svg, "title", escapeXml(label));
    svg = replaceTextContent(svg, "value", formatNumber(value));

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": valid ? "public, max-age=300, s-maxage=300" : "no-store",
        ...CORS_HEADERS
      }
    });
  } catch (error) {
    console.log(error);
    return errorSvg("Badge Error", 500);
  }
}
