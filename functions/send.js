import { isbot } from "isbot";
import { UAParser } from "ua-parser-js";
export async function onRequest({ request, env }) {
  try {
    const { host, path, referrer, website, visitor, visit } = await request.json();
    // 校验统计白名单
    if (env.CLOUDFLARE_WEBSITE_WHITELIST) {
      const lines = env.CLOUDFLARE_WEBSITE_WHITELIST.split(/[\n,]+/).map((line) => line.trim()).filter(Boolean);
      const isAllowed = lines.some((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        const [siteId, domain] = trimmed.split("|").map((s) => s.trim());
        return siteId === website && domain === host;
      });
      if (!isAllowed) return Response.json({ success: false, message: "当前网站不在白名单内" }, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    }
    // UA
    const userAgent = request.headers.get("user-agent") || undefined;
    if (userAgent && isbot(userAgent)) {
      return Response.json({ success: true, message: "ok" }, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    }
    const parsedUserAgent = new UAParser(userAgent);
    const { browser, os, device } = parsedUserAgent.getResult();
    // Area
    const area = request.cf ? String(request.cf.country).trim() || "Unknown" : "Unknown";
    // Referrer
    let referrerUrl = "";
    try {
      referrerUrl = new URL(referrer).host == host ? "" : referrer;
    } catch (error) {
      referrerUrl = referrer;
    }
    const deviceType = (() => {
      const type = device.type;
      if (type === "mobile") return "Mobile";
      if (type === "tablet") return "Tablet";
      if (type === "smarttv") return "Smart TV";
      if (type === "wearable") return "Wearable";
      return "Desktop";
    })();

    // 写数据
    website &&
      host &&
      env.AnalyticsBinding.writeDataPoint({
        blobs: [
          website, //website - blob1
          host, //Host - blob2
          path || "/", //path - blob3
          referrerUrl, //referrer - blob4
          os.name == "android" ? "Android" : os.name || "Unknown", //osName - blob5
          browser.name == "Chrome WebView" ? "Chrome" : browser.name || "Unknown", //browserName - blob6
          area, //areaCode - blob7
          userAgent, //UA - blob8
          deviceType, //deviceType - blob9
          device.vendor || "Unknown", //deviceVendor - blob10
          device.model || "Unknown" //deviceModel - blob11
        ],
        doubles: [visitor ? 1 : 0, visit ? 1 : 0]
      }); // Response
  } catch (error) {
    return Response.json({ success: false, error, message: "Analytics Send Error" }, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  return Response.json({ success: true, message: "ok" }, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
