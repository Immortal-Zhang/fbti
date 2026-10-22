import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "./site";
export function routeMetadata(
  title: string,
  path: string,
  privatePage = false,
): Metadata {
  const fullTitle = title === SITE_TITLE ? title : `${title} · ${SITE_TITLE}`;
  return {
    title: fullTitle,
    description: SITE_DESCRIPTION,
    robots: { index: Boolean(SITE_URL) && !privatePage, follow: !privatePage },
    ...(SITE_URL
      ? {
          metadataBase: new URL(SITE_URL),
          alternates: { canonical: `${SITE_URL}${path}` },
          openGraph: {
            title: fullTitle,
            description: SITE_DESCRIPTION,
            type: "website",
            locale: "zh_CN",
            siteName: SITE_TITLE,
            url: `${SITE_URL}${path}`,
            images: [
              {
                url: `${SITE_URL}/social-card.png`,
                width: 1200,
                height: 630,
                alt: "你哪个厂的？：你可能不了解自己，但你的出厂设置已经暴露了。",
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description: SITE_DESCRIPTION,
            images: [`${SITE_URL}/social-card.png`],
          },
        }
      : {}),
  };
}
