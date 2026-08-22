import { vh_INIT } from "./utils/init.js";
import { createToken, verifyToken, parseCookies } from "./utils/token.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*"
};

function setCookie(token) {
  return `iris_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}

function jsonResp(data, token = null) {
  const headers = { ...CORS_HEADERS, "Content-Type": "application/json" };
  if (token) headers["Set-Cookie"] = setCookie(token);
  return Response.json(data, { headers });
}

export async function onRequest({ request, env }) {
  try {
    let { time, siteID, type, session } = await request.json();

    let refreshedToken = null;

    if (env.CLOUDFLARE_WEBSITE_PWD) {
      if (type === "Login") {
        if (session !== env.CLOUDFLARE_WEBSITE_PWD) {
          return jsonResp({ success: false, code: 401, message: "密码校验失败" });
        }
        const token = await createToken(env.CLOUDFLARE_WEBSITE_PWD);
        return jsonResp({ success: true, message: "登录成功" }, token);
      }

      const cookies = parseCookies(request);
      const payload = await verifyToken(cookies.iris_session, env.CLOUDFLARE_WEBSITE_PWD);
      if (!payload) {
        return jsonResp({ success: false, code: 401, message: "密码校验失败" });
      }
      refreshedToken = await createToken(env.CLOUDFLARE_WEBSITE_PWD);
    }

    // 是否配置Cloudflare信息
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return jsonResp({ success: false, message: "请设置 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN" });
    // 参数校验
    const typeARR = ["visit", "list", "path", "referrer", "os", "soft", "area", "echarts", "device", "ip", "ua"];
    if (!typeARR.includes(type)) return jsonResp({ success: false, message: "参数错误" });
    // 时区
    const tz = request.cf.timezone || "Asia/Shanghai";
    // 周期校验
    const timeArr = ["today", "1d", "week", "month", "7d", "30d", "60d", "90d"];
    if (!timeArr.includes(time)) time = "today";
    const data = await vh_INIT(env, time, siteID, tz, type);
    return jsonResp({ success: true, data }, refreshedToken);
  } catch (error) {
    return jsonResp({ success: false, error });
  }
}
