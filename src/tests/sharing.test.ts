import { describe, expect, it } from "vitest";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import { selectShareCopy } from "@/lib/share-copy/select";
import {
  checksum,
  decodeHash,
  decodePacket,
  encodePacket,
  packetPath,
  publicCopy,
  publicSelfFromAnswers,
  scoreTuple,
} from "@/lib/sharing/snapshot";
import { parsePublicSiteUrl, shareAddress } from "@/lib/site";

const self = publicSelfFromAnswers(sampleAnswers(sampleScores("0101")));
function forged(raw: unknown) {
  const json = JSON.stringify(raw);
  return `H1.${btoa(json).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")}.${checksum(json)}`;
}
describe("public snapshot contract", () => {
  for (const device of PERSONALITY_TYPES)
    for (const [low, high] of [
      [25, 75],
      [45, 55],
      [0, 100],
    ]) {
      it(`${device.id}: ${low}/${high} keeps both poster selections without raw answers`, () => {
        const scores = sampleScores(device.key);
        Object.keys(scores).forEach((key) => {
          scores[key as keyof typeof scores] =
            scores[key as keyof typeof scores] < 50 ? low : high;
        });
        const answers = sampleAnswers(scores);
        const original = publicSelfFromAnswers(answers);
        const token = encodePacket({ kind: "self", self: original });
        const decoded = decodePacket(token);
        expect(decoded).toEqual({ kind: "self", self: original });
        expect(token.length).toBeLessThan(500);
        for (const format of ["moments", "rednote"] as const) {
          const source = selectShareCopy(answers, format);
          const result = publicCopy(decoded.self, format);
          expect(result.device.id).toBe(device.id);
          expect(result.result.scores).toEqual(source.result.scores);
          Object.keys(source.copy).forEach((c) => {
            const category = c as keyof typeof source.copy;
            expect(result.copy[category]).toEqual(
              source.copy[category].map((line) => line.text),
            );
          });
        }
        const raw = atob(
          token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/"),
        );
        expect(raw).not.toMatch(
          /answer|serial|fingerprint|name|HUM2|Q\d\d|optionId/,
        );
      });
    }
  it("round trips invitation and response independently of storage", () => {
    const observer = {
      energy: 12.5,
      expression: 100,
      navigation: 50,
      connection: 87.5,
    };
    for (const packet of [
      { kind: "invite" as const, self, invitationId: "0101010101010101" },
      {
        kind: "compare" as const,
        self,
        observer,
        invitationId: "0101010101010101",
      },
    ]) {
      expect(decodeHash(packetPath(packet).split(/(?=#)/)[1])).toEqual(packet);
    }
  });
  it("rejects damage, wrong versions, excessive length and injection", () => {
    const valid = encodePacket({ kind: "self", self });
    for (const bad of [
      null,
      {},
      [],
      "",
      "<script>alert(1)</script>",
      valid + "x",
      valid.replace("H1.", "H2."),
      "a".repeat(5000),
      valid + "#x",
      valid.replace(/.$/, valid.endsWith("0") ? "1" : "0"),
    ])
      expect(() => decodePacket(bad)).toThrow();
    const raw = JSON.parse(
      atob(valid.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")),
    );
    for (const bad of [
      [1, "s", [[], []]],
      [
        1,
        "s",
        [
          scoreTuple(self.scores),
          [["<img onerror=alert(1)>"], [0], [0], [0], [0]],
        ],
      ],
      [...raw, "extra"],
      [1, "x", raw[2]],
      [1, "s", [[-1, 50, 50, 50], raw[2][1]]],
      [1, "s", [[12.5, 50, 50, 50], raw[2][1]]],
      [1, "c", raw[2], [10, 50, 50, 50]],
    ])
      expect(() => decodePacket(forged(bad))).toThrow();
  });
  it("rejects cross-model indexes, duplicate lines and incompatible score claims", () => {
    const raw = [
      1,
      "s",
      [scoreTuple(self.scores), [[100], [0], [0], [0], [0]]],
    ];
    expect(() => decodePacket(forged(raw))).toThrow();
    expect(() =>
      decodePacket(
        forged([
          1,
          "s",
          [scoreTuple(self.scores), [[0], [0, 0], [0], [0], [0]]],
        ]),
      ),
    ).toThrow();
  });
});
describe("public site boundary", () => {
  it("does not invent a production origin", () => {
    expect(parsePublicSiteUrl(undefined)).toBeNull();
    expect(parsePublicSiteUrl("https://human.example.org/")).toBe(
      "https://human.example.org",
    );
    for (const bad of [
      "http://example.org",
      "https://localhost",
      "https://127.0.0.1",
      "https://u:p@example.org",
      "https://example.org/path",
      "https://example.org/?key=value",
      "https://example.org/#x",
    ])
      expect(() => parsePublicSiteUrl(bad)).toThrow();
  });
  it("allows local QA but does not allow executable or unrelated share routes", () => {
    const path = packetPath({ kind: "self", self });
    expect(shareAddress(path, "http://localhost:3127")).toContain("#h=H1.");
    expect(() =>
      shareAddress("javascript:alert(1)", "https://example.org"),
    ).toThrow();
    expect(() => shareAddress(path, "http://example.org")).toThrow();
  });
});
