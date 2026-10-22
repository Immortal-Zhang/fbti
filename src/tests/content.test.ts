import { describe, expect, it } from "vitest";
import { DIMENSIONS } from "../data/dimensions";
import { PERSONALITY_TYPES } from "../data/personality-types";
import { SELF_QUESTIONS } from "../data/questions/self";
import { DIMENSION_IDS } from "../lib/domain";

describe("published content contract", () => {
  it("contains four complete dimensions in canonical order", () => {
    expect(DIMENSIONS.map((dimension) => dimension.id)).toEqual([
      ...DIMENSION_IDS,
    ]);
    for (const dimension of DIMENSIONS) {
      for (const value of Object.values(dimension))
        expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains exactly 20 unique questions and 100 complete options", () => {
    expect(SELF_QUESTIONS).toHaveLength(20);
    expect(new Set(SELF_QUESTIONS.map((question) => question.id)).size).toBe(
      20,
    );
    expect(
      new Set(SELF_QUESTIONS.map((question) => question.prompt)).size,
    ).toBe(20);
    for (const question of SELF_QUESTIONS) {
      expect(DIMENSION_IDS).toContain(question.dimension);
      expect(question.scene.trim().length).toBeGreaterThan(0);
      expect(question.prompt.trim().length).toBeGreaterThan(0);
      expect(typeof question.reverse).toBe("boolean");
      expect(question.options).toHaveLength(5);
      expect(new Set(question.options.map((option) => option.id)).size).toBe(5);
      expect(new Set(question.options.map((option) => option.text)).size).toBe(
        5,
      );
      expect(question.options.map((option) => option.value).sort()).toEqual([
        0, 1, 2, 3, 4,
      ]);
      for (const option of question.options)
        expect(option.text.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(DIMENSION_IDS)(
    "balances forward and reverse items for %s",
    (dimension) => {
      const questions = SELF_QUESTIONS.filter(
        (question) => question.dimension === dimension,
      );
      expect(questions).toHaveLength(5);
      expect(
        questions.filter((question) => question.reverse).length,
      ).toBeGreaterThanOrEqual(2);
      expect(
        questions.filter((question) => !question.reverse).length,
      ).toBeGreaterThanOrEqual(2);
    },
  );

  it("covers all sixteen catalogue keys exactly once", () => {
    expect(PERSONALITY_TYPES).toHaveLength(16);
    const expected = Array.from({ length: 16 }, (_, index) =>
      index.toString(2).padStart(4, "0"),
    );
    expect(PERSONALITY_TYPES.map((device) => device.key).sort()).toEqual(
      expected,
    );
    for (const field of [
      "id",
      "name",
      "shape",
      "concept",
      "description",
      "positioning",
      "warranty",
    ] as const) {
      expect(
        new Set(PERSONALITY_TYPES.map((device) => device[field])).size,
      ).toBe(16);
    }
  });

  it("provides a complete and distinct device specification for every type", () => {
    for (const device of PERSONALITY_TYPES) {
      expect(device.id).toMatch(/^HUM-1\d{2}$/);
      expect(device.color).toMatch(/^#[\da-f]{6}$/i);
      expect(device.ink).toMatch(/^#[\da-f]{6}$/i);
      expect(device.tags).toHaveLength(3);
      expect(new Set(device.tags).size).toBe(3);
      for (const [field, value] of Object.entries(device)) {
        if (field === "tags") continue;
        expect(typeof value).toBe("string");
        expect((value as string).trim().length).toBeGreaterThan(0);
      }
      expect(
        new Set([
          device.description,
          device.strength,
          device.fault,
          device.hidden,
          device.environment,
          device.warranty,
        ]).size,
      ).toBe(6);
    }
  });
});
