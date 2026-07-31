import { createSign } from "../src/utils/sign.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*"
};

const json = (body, status = 200) => Response.json(body, { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const siteID = (url.searchParams.get("siteID") || "").trim();
  if (!siteID) return json({ success: false, message: "siteID is required" }, 400);
  if (!env.CLOUDFLARE_ACCOUNT_ID) return json({ success: false, message: "Analytics not configured" }, 500);

  // 盐复用必配的 CLOUDFLARE_ACCOUNT_ID（仅服务端 env，前端不可见）
  const host = request.headers.get("host") || url.host;
  const sign = createSign(siteID, host, env.CLOUDFLARE_ACCOUNT_ID);
  return json({ success: true, sign });
}
