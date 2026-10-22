import { describe, expect, it } from "vitest";
import { wrapText } from "@/lib/poster/text";
const measure = (text: string) => [...text].length * 10;
describe("complete measured poster text", () => {
  it("preserves every character and paragraph without splitting Unicode", () => {
    const input = "人类🛠️说明书\n厂家正在认真排队";
    const lines = wrapText(input, 50, measure);
    expect(lines.join("")).toBe(input.replaceAll("\n", ""));
    expect(lines.every((line) => measure(line) <= 50)).toBe(true);
  });
  it("keeps Chinese closing punctuation with the preceding character", () => {
    expect(wrapText("一二三四，五六。", 40, measure)).toEqual([
      "一二三",
      "四，五",
      "六。",
    ]);
  });
  it("rejects impossible geometry instead of cutting off text", () => {
    expect(() => wrapText("完整句子", 0, measure)).toThrow();
    expect(() => wrapText("字", 5, measure)).toThrow();
  });
});
