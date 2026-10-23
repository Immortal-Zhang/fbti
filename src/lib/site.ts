import { BASE_PATH, hostedPath } from "./paths";
export const SITE_TITLE = "FBTI";
export const SITE_DESCRIPTION =
  "FBTI · Factory Bug Type Indicator · 人类出厂 BUG 类型指标。你可能不了解自己，但你的出厂设置已经暴露了。原创趣味人格测试、人类设备说明书、好友互测与个性化分享海报。虚构公司，认真娱乐。";

export function parsePublicSiteUrl(input: string | undefined): string | null {
  if (!input?.trim()) return null;
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !url.hostname.includes(".") ||
    /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      url.hostname,
    ) ||
    url.hostname.endsWith(".local") ||
    url.hostname.endsWith(".test") ||
    url.hostname.includes(":")
  )
    throw new Error("NEXT_PUBLIC_SITE_URL需要真实公开的HTTPS站点根地址。");
  return url.origin;
}
export const SITE_ORIGIN = parsePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_URL = SITE_ORIGIN ? `${SITE_ORIGIN}${BASE_PATH}` : null;
export function isLocalOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".localhost")
    );
  } catch {
    return true;
  }
}
export function shareAddress(path: string, browserOrigin: string): string {
  const origin = SITE_ORIGIN || browserOrigin;
  const url = new URL(origin);
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && isLocalOrigin(origin))
  )
    throw new Error("请通过HTTPS打开网站后再分享。");
  if (
    !/^\/(s|friends|compare)#h=H[12]\.[A-Za-z0-9_-]+\.[a-f0-9]{8}$/.test(path)
  )
    throw new Error("分享路径无效。");
  return `${url.origin}${hostedPath(BASE_PATH ? path.replace("#", "/#") : path)}`;
}
