import { describe, expect, it } from "vitest";
import { hostedPath, normalizeAppPath } from "@/lib/paths";

describe("static hosting paths", () => {
  it("keeps root deployment and trailing-slash routes readable", () => {
    expect(normalizeAppPath("/s", "")).toBe("/s");
    expect(normalizeAppPath("/s/", "")).toBe("/s");
  });
  it("reads a Pages share route without changing its fragment", () => {
    expect(normalizeAppPath("/fbti/compare/", "/fbti")).toBe("/compare");
    expect(hostedPath("/compare/#h=H1.example.checksum", "/fbti")).toBe(
      "/fbti/compare/#h=H1.example.checksum",
    );
  });
  it("preserves the project homepage", () => {
    expect(normalizeAppPath("/fbti/", "/fbti")).toBe("/");
    expect(normalizeAppPath("/fbti", "/fbti")).toBe("/");
  });
  it("does not mistake a different project for this one", () => {
    expect(normalizeAppPath("/fbti-other/s/", "/fbti")).toBeNull();
    expect(normalizeAppPath("/s/", "/fbti")).toBeNull();
  });
});
