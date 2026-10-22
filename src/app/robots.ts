import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return SITE_URL
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/quiz",
            "/result",
            "/reveal",
            "/share",
            "/s",
            "/invite",
            "/friends",
            "/compare",
          ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
