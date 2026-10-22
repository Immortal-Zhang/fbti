import { describe, expect, it } from "vitest";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { decodeThemePreference } from "@/features/personal-manual/theme-preference";

describe("manual appearance preference", () => {
  it("accepts each known model palette without introducing a new identity", () => {
    for (const device of PERSONALITY_TYPES) {
      expect(
        decodeThemePreference(JSON.stringify({ version: 1, key: device.key })),
      ).toBe(device.key);
    }
  });

  it("recovers from malformed, unknown, and future-version preferences", () => {
    const knownKey = PERSONALITY_TYPES[0].key;
    const malformed: (string | null)[] = [
      null,
      "",
      "{",
      "null",
      "[]",
      "9",
      "a".repeat(129),
    ];
    const incompatible = [
      { version: 2, key: knownKey },
      { version: 1, key: "not-a-device" },
      { version: 1, key: knownKey, injected: true },
      { version: 1 },
      { key: knownKey },
    ];
    for (const raw of [
      ...malformed,
      ...incompatible.map((value) => JSON.stringify(value)),
    ]) {
      expect(decodeThemePreference(raw)).toBeNull();
    }
  });

  it("keeps the explicit original-model preference as the default", () => {
    expect(
      decodeThemePreference(JSON.stringify({ version: 1, key: null })),
    ).toBeNull();
  });
});
