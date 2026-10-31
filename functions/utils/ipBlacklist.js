// IP 黑名单匹配器（纯 JS、零依赖、Cloudflare Workers 兼容）
// 规则语法：精确 IPv4/IPv6、CIDR 网段（1.2.3.0/24、2001:db8::/32）、通配符（1.2.3.*、*）

let cachedRaw = null;
let cachedRules = [];

/** 解析点分 IPv4 为 uint32，非法返回 null */
function parseIPv4(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const v = Number(part);
    if (v > 255) return null;
    n = ((n << 8) | v) >>> 0;
  }
  return n;
}

/** 将 8 个 16 位组转为 16 字节 */
function groupsToBytes(groups) {
  const bytes = new Uint8Array(16);
  groups.forEach((g, i) => {
    bytes[i * 2] = (g >>> 8) & 0xff;
    bytes[i * 2 + 1] = g & 0xff;
  });
  return bytes;
}

/** 解析 IPv6 一侧（:: 之前或之后）为 16 位组数组，非法返回 null */
function expandGroups(side) {
  if (side === "") return [];
  const groups = [];
  for (const part of side.split(":")) {
    if (part.includes(".")) {
      const v4 = parseIPv4(part);
      if (v4 === null) return null;
      groups.push((v4 >>> 16) & 0xffff, v4 & 0xffff);
    } else {
      if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
      groups.push(parseInt(part, 16));
    }
  }
  return groups;
}

/** 解析 IPv6（支持 :: 压缩与内嵌 IPv4）为 16 字节，非法返回 null */
function parseIPv6(ip) {
  if (!ip.includes(":")) return null;
  let head = ip;
  let tail = "";
  let compressed = false;
  const idx = ip.indexOf("::");
  if (idx !== -1) {
    if (ip.indexOf("::", idx + 1) !== -1) return null;
    compressed = true;
    head = ip.slice(0, idx);
    tail = ip.slice(idx + 2);
  }
  const headGroups = expandGroups(head);
  const tailGroups = expandGroups(tail);
  if (!headGroups || !tailGroups) return null;
  const groups = [...headGroups, ...tailGroups];
  if (compressed) {
    if (groups.length > 7) return null;
    groups.splice(headGroups.length, 0, ...new Array(8 - groups.length).fill(0));
  } else if (groups.length !== 8) {
    return null;
  }
  return groupsToBytes(groups);
}

/** 比较两个 IPv6 地址的前 prefix 个比特 */
function ipv6PrefixMatch(a, b, prefix) {
  const fullBytes = prefix >> 3;
  for (let i = 0; i < fullBytes; i++) if (a[i] !== b[i]) return false;
  const remBits = prefix & 7;
  if (!remBits) return true;
  const mask = (0xff << (8 - remBits)) & 0xff;
  return (a[fullBytes] & mask) === (b[fullBytes] & mask);
}

/** 若为 ::ffff:0:0/96 形式则取出内嵌 IPv4，否则返回 null */
function extractV4Mapped(v6) {
  for (let i = 0; i < 10; i++) if (v6[i] !== 0) return null;
  if (v6[10] !== 0xff || v6[11] !== 0xff) return null;
  return ((v6[12] << 24) | (v6[13] << 16) | (v6[14] << 8) | v6[15]) >>> 0;
}

/** 由 IPv4 构造 ::ffff:0:0/96 映射形式的 16 字节 */
function toV4Mapped(v4) {
  const bytes = new Uint8Array(16);
  bytes[10] = 0xff;
  bytes[11] = 0xff;
  bytes[12] = (v4 >>> 24) & 0xff;
  bytes[13] = (v4 >>> 16) & 0xff;
  bytes[14] = (v4 >>> 8) & 0xff;
  bytes[15] = v4 & 0xff;
  return bytes;
}

/** 编译 CIDR 规则为匹配器，非法返回 null */
function compileCidr(entry) {
  const [addr, prefixStr, ...rest] = entry.split("/");
  if (rest.length || !/^\d{1,3}$/.test(prefixStr)) return null;
  const prefix = Number(prefixStr);
  const v4 = parseIPv4(addr);
  if (v4 !== null) {
    if (prefix > 32) return null;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const net = (v4 & mask) >>> 0;
    return (_ip, ipV4) => ipV4 !== null && (ipV4 & mask) >>> 0 === net;
  }
  const v6 = parseIPv6(addr);
  if (v6 !== null) {
    if (prefix > 128) return null;
    return (_ip, _ipV4, ipV6) => ipV6 !== null && ipv6PrefixMatch(ipV6, v6, prefix);
  }
  return null;
}

/** 编译 IPv4 通配符规则（每段为数字或 *，单独的 * 匹配任意 IP），非法返回 null */
function compileWildcard(entry) {
  if (entry === "*") return (_ip, ipV4, ipV6) => ipV4 !== null || ipV6 !== null;
  const parts = entry.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => (p === "*" ? -1 : /^\d{1,3}$/.test(p) && Number(p) <= 255 ? Number(p) : NaN));
  if (octets.some(Number.isNaN)) return null;
  return (_ip, ipV4) => {
    if (ipV4 === null) return false;
    return octets.every((o, i) => o === -1 || o === ((ipV4 >>> (24 - i * 8)) & 0xff));
  };
}

/** 将单条规则编译为 (ip, ipV4, ipV6) => boolean 匹配器，非法返回 null */
function compileRule(entry) {
  if (entry.includes("/")) return compileCidr(entry);
  if (entry.includes("*")) return compileWildcard(entry);
  const v4 = parseIPv4(entry);
  if (v4 !== null) return (_ip, ipV4) => ipV4 === v4;
  const v6 = parseIPv6(entry);
  if (v6 !== null) return (_ip, _ipV4, ipV6) => ipV6 !== null && ipV6.every((b, i) => b === v6[i]);
  return null;
}

/**
 * 判断客户端 IP 是否命中黑名单。
 * 规则以逗号/换行分隔：精确 IP、CIDR 网段、通配符（1.2.3.*、*）；非法条目跳过并输出警告；解析结果按配置字符串缓存。
 * IPv4 与 IPv4-mapped IPv6（::ffff:0:0/96）互相归一化，两种写法的规则均可命中。
 * @param {string|null|undefined} ip 客户端 IP（如 cf-connecting-ip）
 * @param {string|null|undefined} raw CLOUDFLARE_IP_BLACKLIST 配置原文
 * @returns {boolean}
 */
export function isIpBlacklisted(ip, raw) {
  if (!ip || !raw) return false;
  if (raw !== cachedRaw) {
    const rules = [];
    for (const part of raw.split(/[\n,]+/)) {
      const entry = part.trim();
      if (!entry) continue;
      const rule = compileRule(entry);
      if (rule) rules.push(rule);
      else console.warn(`CLOUDFLARE_IP_BLACKLIST: skipped invalid rule "${entry}"`);
    }
    cachedRules = rules;
    cachedRaw = raw;
  }
  if (!cachedRules.length) return false;
  let v4 = parseIPv4(ip);
  let v6 = v4 === null ? parseIPv6(ip) : null;
  if (v4 === null && v6 !== null) {
    const mapped = extractV4Mapped(v6);
    if (mapped !== null) v4 = mapped;
  } else if (v4 !== null && v6 === null) {
    v6 = toV4Mapped(v4);
  }
  if (v4 === null && v6 === null) return false;
  return cachedRules.some((match) => match(ip, v4, v6));
}
