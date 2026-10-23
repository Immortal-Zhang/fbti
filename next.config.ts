import type { NextConfig } from "next";
const staticExport = process.env.FBTI_STATIC_EXPORT === "1";
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  ...(staticExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  ...(staticExport
    ? {}
    : {
        async headers() {
          const development = process.env.NODE_ENV !== "production";
          const policy = [
            "default-src 'self'",
            "base-uri 'none'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            `connect-src 'self'${development ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
          ].join("; ");
          return [
            {
              source: "/:path*",
              headers: [
                { key: "Content-Security-Policy", value: policy },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "no-referrer" },
                {
                  key: "Permissions-Policy",
                  value:
                    "camera=(), microphone=(), geolocation=(), payment=(), web-share=(self)",
                },
              ],
            },
          ];
        },
      }),
};
export default nextConfig;
