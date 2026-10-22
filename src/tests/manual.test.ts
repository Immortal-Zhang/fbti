import { describe, expect, it } from "vitest";
import { COPY_RULES, SECTION_LABELS } from "../data/copywriting";
import { PERSONALITY_TYPES } from "../data/personality-types";
import { SELF_QUESTIONS } from "../data/questions/self";
import {
  CONTENT_VERSION,
  DIMENSION_IDS,
  MANUAL_SECTION_IDS,
  type Answer,
  type Scores,
  type ScoredResult,
} from "../lib/domain";
import { generateManual } from "../lib/results/manual";
import { classifyScores, readScores, scoreAnswers } from "../lib/scoring";

function fromScores(scores: Scores): ScoredResult {
  return {
    version: CONTENT_VERSION,
    scores,
    typeKey: classifyScores(scores),
    readings: readScores(scores),
    fingerprint: `${CONTENT_VERSION}-a1b2c3d4`,
  };
}

function answersAt(value: 0 | 1 | 2 | 3 | 4): Answer[] {
  return SELF_QUESTIONS.map((question) => {
    const raw = question.reverse ? 4 - value : value;
    return {
      questionId: question.id,
      optionId: question.options.find((option) => option.value === raw)!.id,
    };
  });
}

function verifyManual(result: ScoredResult): void {
  const manual = generateManual(result);
  expect(manual.version).toBe(CONTENT_VERSION);
  expect(manual.device.key).toBe(result.typeKey);
  expect(manual.sections.map(({ id }) => id)).toEqual(MANUAL_SECTION_IDS);
  expect(new Set(manual.sections.map(({ text }) => text)).size).toBe(
    MANUAL_SECTION_IDS.length,
  );
  const topics: string[] = [];
  for (const section of manual.sections) {
    expect(section.label).toBe(SECTION_LABELS[section.id]);
    expect(section.text.length).toBeGreaterThan(8);
    if (section.id === "warranty") {
      expect(section.ruleId).toBe(`model-warranty:${manual.device.id}`);
      expect(section.text).toBe(manual.device.warranty);
      topics.push("unconditional-care");
    } else {
      const rule = COPY_RULES.find(({ id }) => id === section.ruleId)!;
      expect(rule.section).toBe(section.id);
      expect(rule.variants).toContain(section.text);
      for (const condition of rule.conditions) {
        expect(result.scores[condition.dimension]).toBeGreaterThanOrEqual(
          condition.min,
        );
        expect(result.scores[condition.dimension]).toBeLessThanOrEqual(
          condition.max,
        );
      }
      topics.push(rule.topic);
    }
  }
  expect(new Set(topics).size).toBe(topics.length);
}

describe("copy library", () => {
  it("contains at least 60 rules and 120 original complete variants", () => {
    expect(COPY_RULES.length).toBeGreaterThanOrEqual(60);
    expect(
      COPY_RULES.flatMap(({ variants }) => variants).length,
    ).toBeGreaterThanOrEqual(120);
    expect(new Set(COPY_RULES.map(({ id }) => id)).size).toBe(
      COPY_RULES.length,
    );
    const variants = COPY_RULES.flatMap(({ variants }) => variants);
    expect(new Set(variants).size).toBe(variants.length);
    for (const rule of COPY_RULES) {
      expect(rule.id.length).toBeGreaterThan(0);
      expect(rule.topic.length).toBeGreaterThan(0);
      expect(rule.variants.length).toBeGreaterThan(0);
      for (const text of rule.variants) {
        expect(text.length).toBeGreaterThan(8);
        expect(text.length).toBeLessThanOrEqual(75);
        expect(text).not.toMatch(/TODO|待补充|占位|科学证明|诊断结果/);
      }
      for (const condition of rule.conditions) {
        expect(DIMENSION_IDS).toContain(condition.dimension);
        expect(condition.min).toBeGreaterThanOrEqual(0);
        expect(condition.max).toBeLessThanOrEqual(100);
        expect(condition.min).toBeLessThanOrEqual(condition.max);
      }
    }
  });

  it("provides an unconditional fallback for every manual module", () => {
    for (const section of MANUAL_SECTION_IDS) {
      expect(
        COPY_RULES.some(
          (rule) =>
            rule.section === section &&
            rule.conditions.length === 0 &&
            rule.priority === 0,
        ),
      ).toBe(true);
    }
  });
});

describe("manual composition", () => {
  it("reproduces the same full report, including reordered answer input", () => {
    const answers = answersAt(1);
    const expected = generateManual(scoreAnswers(answers));
    expect(generateManual(scoreAnswers(answers))).toEqual(expected);
    expect(generateManual(scoreAnswers([...answers].reverse()))).toEqual(
      expected,
    );
  });

  it("does not mutate its input and does not return the input scores object", () => {
    const result = scoreAnswers(answersAt(2));
    const before = structuredClone(result);
    const manual = generateManual(result);
    expect(result).toEqual(before);
    expect(manual.scores).not.toBe(result.scores);
  });

  it("generates all ten modules for every device", () => {
    for (const device of PERSONALITY_TYPES) {
      const scores = Object.fromEntries(
        DIMENSION_IDS.map((id, index) => [
          id,
          device.key[index] === "0" ? 0 : 100,
        ]),
      ) as Scores;
      verifyManual(fromScores(scores));
    }
  });

  it("produces a different report for different strengths of the same type", () => {
    const strong = generateManual(
      fromScores({
        energy: 10,
        expression: 10,
        navigation: 10,
        connection: 10,
      }),
    );
    const moderate = generateManual(
      fromScores({
        energy: 35,
        expression: 35,
        navigation: 35,
        connection: 35,
      }),
    );
    expect(strong.device.id).toBe(moderate.device.id);
    const changes = strong.sections.filter(
      (section, index) => section.text !== moderate.sections[index].text,
    );
    expect(changes.length).toBeGreaterThanOrEqual(4);
  });

  it("prefers middle wording on both inclusive middle boundaries", () => {
    for (const value of [40, 50, 60]) {
      const manual = generateManual(
        fromScores({
          energy: value,
          expression: value,
          navigation: value,
          connection: value,
        }),
      );
      const rules = Object.fromEntries(
        manual.sections.map(({ id, ruleId }) => [id, ruleId]),
      );
      expect(rules.charging).toBe("charge-middle");
      expect(rules.malfunction).toBe("fault-middle");
      expect(rules.prohibited).toBe("prohibit-middle");
      expect(rules.hidden).toBe("hidden-middle");
      expect(rules.warning).toBe("warning-middle");
      expect(rules.social).toBe("social-middle");
      expect(rules.environment).toBe("env-middle");
      expect(rules.reboot).toBe("reboot-middle");
    }
  });

  it("keeps energy supply independent from how fast someone becomes familiar", () => {
    const socialSlow = generateManual(
      fromScores({
        energy: 85,
        expression: 50,
        navigation: 50,
        connection: 15,
      }),
    );
    expect(
      socialSlow.sections.find(({ id }) => id === "charging")?.ruleId,
    ).toBe("charge-outgoing-slow");
    expect(socialSlow.sections.find(({ id }) => id === "social")?.ruleId).toBe(
      "social-slow-strong",
    );
    const quietFast = generateManual(
      fromScores({
        energy: 15,
        expression: 50,
        navigation: 50,
        connection: 85,
      }),
    );
    expect(quietFast.sections.find(({ id }) => id === "charging")?.ruleId).toBe(
      "charge-low-strong",
    );
    expect(quietFast.sections.find(({ id }) => id === "social")?.ruleId).toBe(
      "social-quiet-fast",
    );
  });

  it("does not repeat middle-energy charging advice in the observed easter-egg regression", () => {
    const manual = generateManual(
      fromScores({
        energy: 50,
        expression: 75,
        navigation: 50,
        connection: 75,
      }),
    );
    expect(manual.sections.find(({ id }) => id === "charging")?.ruleId).toBe(
      "charge-middle",
    );
    expect(manual.sections.find(({ id }) => id === "easterEgg")?.ruleId).toBe(
      "egg-energy-middle",
    );
    const rule = COPY_RULES.find(({ id }) => id === "egg-energy-middle")!;
    // A guard against the specifically observed repeated motif, not a semantic proof.
    for (const text of rule.variants) {
      expect(text).not.toMatch(
        /独处|聚会|有人约|安排取消|单人模式|双人模式|动态偏好/,
      );
    }
  });

  it("matches rule conditions without duplicate topics across a 625-point boundary grid", () => {
    const values = [0, 20, 50, 80, 100];
    for (const energy of values)
      for (const expression of values) {
        for (const navigation of values)
          for (const connection of values) {
            verifyManual(
              fromScores({ energy, expression, navigation, connection }),
            );
          }
      }
  });

  it("handles continuous scores and fixed-seed answer samples deterministically", () => {
    verifyManual(
      fromScores({
        energy: 39.9,
        expression: 60.1,
        navigation: 49.9,
        connection: 50.1,
      }),
    );
    let seed = 0x3157;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    for (let sample = 0; sample < 150; sample++) {
      const answers = SELF_QUESTIONS.map((question) => ({
        questionId: question.id,
        optionId: question.options[next() % 5].id,
      }));
      const result = scoreAnswers(answers);
      verifyManual(result);
      expect(generateManual(result)).toEqual(
        generateManual(scoreAnswers(answers)),
      );
    }
  });

  it("rejects malformed, mismatched, unsupported or incomplete results", () => {
    const valid = scoreAnswers(answersAt(2));
    const bad: unknown[] = [
      null,
      [],
      {},
      { ...valid, version: "hum-99" },
      { ...valid, typeKey: "0000" },
      { ...valid, fingerprint: "unsafe" },
      { ...valid, fingerprint: `${CONTENT_VERSION}-A1B2C3D4` },
      { ...valid, scores: { ...valid.scores, energy: Infinity } },
      { ...valid, readings: {} },
      {
        ...valid,
        readings: {
          ...valid.readings,
          energy: { ...valid.readings.energy, dominant: "low" },
        },
      },
      {
        ...valid,
        readings: {
          ...valid.readings,
          energy: { ...valid.readings.energy, extra: true },
        },
      },
      { ...valid, extra: "injected" },
    ];
    for (const result of bad)
      expect(() => generateManual(result as ScoredResult)).toThrow();
  });
});
