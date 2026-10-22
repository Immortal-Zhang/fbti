import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeviceIllustration } from "@/components/device-illustration";
import { PERSONALITY_TYPES } from "@/data/personality-types";

describe("SVG server-rendering contract", () => {
  it.each(PERSONALITY_TYPES)(
    "$id uses one accessible title text node without hydration markers",
    (device) => {
      const html = renderToString(
        createElement(DeviceIllustration, {
          shape: device.shape,
          color: device.color,
          name: device.name,
        }),
      );
      // Split JSX text children produce SSR markers that SVG title parsing does not preserve.
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
      expect(title).toBe(`${device.name}的原创设备插画`);
      expect(html).toContain('role="img"');
      expect(html).toContain("aria-labelledby=");
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("<image");
    },
  );

  it("keeps decorative thumbnails out of the accessibility tree", () => {
    const html = renderToString(
      createElement(DeviceIllustration, {
        shape: "console",
        color: "#254bfa",
        name: "样本",
        decorative: true,
      }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<title");
    expect(html).not.toContain("aria-labelledby");
  });
});
