export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { hostedPath } from "@/lib/paths";
import { SITE_URL } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return SITE_URL
    ? {
        rules: {
          userAgent: "*",
          allow: hostedPath("/"),
          disallow: [
            "/quiz",
            "/result",
            "/reveal",
            "/share",
            "/s",
            "/invite",
            "/friends",
            "/compare",
          ].map((path) => hostedPath(path)),
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
