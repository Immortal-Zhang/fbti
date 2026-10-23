/** Hosting prefix only; it never enters personality or snapshot calculations. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function normalizeAppPath(
  pathname: string,
  basePath = BASE_PATH,
): string | null {
  if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`))
    return null;
  const path = pathname.slice(basePath.length).replace(/\/+$/, "");
  return path || "/";
}

export function hostedPath(path: string, basePath = BASE_PATH): string {
  return `${basePath}${path}`;
}
