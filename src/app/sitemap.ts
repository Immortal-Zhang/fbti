export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_URL
    ? ["/", "/devices", "/questions", "/privacy"].map((path) => ({
        url: `${SITE_URL}${path}`,
        changeFrequency: "monthly",
        priority: path === "/" ? 1 : 0.5,
      }))
    : [];
}
