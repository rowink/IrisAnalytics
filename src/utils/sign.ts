/**
 * 徽标访问签名（Badge Sign）— 前后端唯一实现
 *
 * 签名公式：sign = 6 位十进制数字
 *   FNV-1a 32bit hash(`${siteID}|${host}|${SALT}`) % 1000000 → padStart(6, "0")
 *
 * 设计说明：
 *   - 基于 网站ID(siteID) + 部署域名(host) + 盐(SALT) 生成
 *   - 静态签名（不随时间轮换），盐固定不变，URL 长期有效
 */

// 内置盐，修改后所有旧徽标 URL 失效
const SALT = "iris-b6d2-9f4a-7c1e";

// FNV-1a 32bit 哈希
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 生成 6 位签名
 * @param siteID 网站标识
 * @param host   iris 部署域名（须与访问徽标时的 Host 一致）
 * @returns 6 位十进制数字
 */
export function createSign(siteID: string, host: string): string {
  const num = hashString(`${siteID}|${host}|${SALT}`) % 1000000;
  return String(num).padStart(6, "0");
}

/**
 * 校验签名（服务端 badge.js 使用）
 * @param siteID 网站标识
 * @param host   iris 部署域名
 * @param sign   待校验签名
 * @returns 签名是否合法
 */
export function verifySign(siteID: string, host: string, sign: string): boolean {
  return !!sign && sign === createSign(siteID, host);
}
