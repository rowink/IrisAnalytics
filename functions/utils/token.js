/**
 * HMAC-SHA256 token 签发 / 验签
 * 用 CLOUDFLARE_WEBSITE_PWD 作为 HMAC secret
 * 7 天滑动过期
 */

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7天 (ms)

export { createToken, verifyToken, parseCookies };

/**
 * 签发 token：base64(payload) + "." + base64(HMAC-SHA256(payload, secret))
 */
async function createToken(secret) {
  const encoder = new TextEncoder();
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_MAX_AGE });
  const payloadBase64 = btoa(payload);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadBase64));
  const sigBytes = new Uint8Array(signature);
  let sigBinary = "";
  for (let i = 0; i < sigBytes.length; i++) {
    sigBinary += String.fromCharCode(sigBytes[i]);
  }
  const sigBase64 = btoa(sigBinary);

  return payloadBase64 + "." + sigBase64;
}

/**
 * 验签，成功返回 payload 对象，失败返回 null
 */
async function verifyToken(token, secret) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, sigBase64] = parts;
  const encoder = new TextEncoder();

  let sigBinary;
  let decodedPayload;
  try {
    sigBinary = atob(sigBase64);
    decodedPayload = atob(payloadBase64);
  } catch {
    return null;
  }

  const sigBytes = new Uint8Array(sigBinary.length);
  for (let i = 0; i < sigBinary.length; i++) {
    sigBytes[i] = sigBinary.charCodeAt(i);
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payloadBase64));
    if (!valid) return null;

    const payload = JSON.parse(decodedPayload);
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * 解析 Cookie 头为键值对象
 */
function parseCookies(request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(";").forEach((c) => {
    const trimmed = c.trim();
    if (!trimmed) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const name = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    cookies[name] = value;
  });
  return cookies;
}
