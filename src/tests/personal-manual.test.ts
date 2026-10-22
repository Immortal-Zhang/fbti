import { describe, expect, it } from "vitest";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { MANUAL_PROFILES } from "@/data/personal-manual/model-profiles";
import { ABSTRACT_COPY_RULES as PERSONAL_COPY_RULES, creativeDevice } from "@/data/creative";
import { DIMENSION_IDS, type Answer, type Scores } from "@/lib/domain";
import { generatePersonalManual, getPersonalManual, selectCompatibleRule } from "@/lib/personal-manual/generate";
import { CHAPTER_DEFINITIONS, CHAPTER_IDS, type ManualCopyRule, type PersonalManual } from "@/lib/personal-manual/schema";
import { completeProgress, createProgress, type QuizProgress } from "@/lib/quiz/progress";
import { createQuizStore } from "@/lib/quiz/store";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import { scoreAnswers } from "@/lib/scoring";

function uniform(value: number): Scores {
  return { energy: value, expression: value, navigation: value, connection: value };
}

/** The fixture describes effective responses, independent of displayed option order. */
function trajectory(values: readonly number[]): Answer[] {
  const positions = { energy: 0, expression: 0, navigation: 0, connection: 0 };
  return SELF_QUESTIONS.map((question) => {
    const effective = values[positions[question.dimension]++];
    const raw = question.reverse ? 4 - effective : effective;
    return { questionId: question.id, optionId: question.options.find((option) => option.value === raw)!.id };
  });
}

function entries(manual: PersonalManual) {
  return manual.chapters.flatMap((chapter) => chapter.entries);
}

function changedChapters(first: PersonalManual, second: PersonalManual): string[] {
  return first.chapters.filter((chapter, index) =>
    chapter.entries.some((entry, position) => entry.text !== second.chapters[index].entries[position].text),
  ).map((chapter) => chapter.id);
}

function assertComplete(manual: PersonalManual, answers: readonly Answer[]) {
  expect(manual.result).toEqual(scoreAnswers(answers));
  expect(manual.version).toBe("pm-2");
  expect(manual.scoringVersion).toBe("hum-1");
  expect(manual.chapters.map(({ id }) => id)).toEqual(CHAPTER_IDS);
  expect(manual.keywords).toHaveLength(3);
  const all = entries(manual);
  expect(all).toHaveLength(37);
  expect(new Set(all.map(({ text }) => text)).size).toBe(37);
  expect(new Set(all.map(({ source }) => source.topic)).size).toBe(37);
  expect(all.map(({ id }) => id)).toEqual(CHAPTER_DEFINITIONS.flatMap(({ slots }) => [...slots]));
  expect(JSON.stringify(manual)).not.toMatch(/undefined|NaN|待补充|占位文案/);
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.optionId]));
  const selected = all.map(({ source }) => PERSONAL_COPY_RULES.find((rule) => rule.id === source.ruleId)).filter((rule): rule is ManualCopyRule => Boolean(rule));
  expect(selected).toHaveLength(34);
  for (const entry of all) {
    expect(entry.label.trim().length).toBeGreaterThan(0);
    expect(entry.text.trim().length).toBeGreaterThan(0);
    for (const condition of entry.source.conditions.scores || []) {
      expect(manual.result.scores[condition.dimension]).toBeGreaterThanOrEqual(condition.min);
      expect(manual.result.scores[condition.dimension]).toBeLessThanOrEqual(condition.max);
    }
    for (const condition of entry.source.conditions.answers || []) {
      const question = SELF_QUESTIONS.find(({ id }) => id === condition.questionId)!;
      const option = question.options.find(({ id }) => id === answerMap.get(question.id))!;
      const effective = question.reverse ? 4 - option.value : option.value;
      expect(effective).toBeGreaterThanOrEqual(condition.min);
      expect(effective).toBeLessThanOrEqual(condition.max);
    }
    if (entry.source.conditions.typeKey) expect(entry.source.conditions.typeKey).toBe(manual.result.typeKey);
    for (const dimension of DIMENSION_IDS) {
      for (const band of ["low", "middle", "high"]) {
        if (entry.source.claims.includes(`${dimension}:${band}`)) expect(manual.result.readings[dimension].band).toBe(band);
      }
    }
  }
  for (const rule of selected) {
    const otherTokens = selected.filter(({ id }) => id !== rule.id).flatMap((other) => [other.id, ...(other.claims || [])]);
    expect(otherTokens.filter((token) => rule.conflicts?.includes(token))).toEqual([]);
  }
}

describe("complete personal manual", () => {
  it.each(PERSONALITY_TYPES)("generates a complete report for $id $name from its true 25/75 answers", (device) => {
    const answers = sampleAnswers(sampleScores(device.key));
    const manual = generatePersonalManual(answers);
    expect(manual.device).toEqual(creativeDevice(device));
    expect(manual.result.typeKey).toBe(device.key);
    assertComplete(manual, answers);
    expect(manual.certification.disclaimer).toContain("虚构");
    expect(manual.certification.disclaimer).toContain("不代表心理测量");
  });

  it("has independently authored complete model profiles and all rule slots", () => {
    expect(MANUAL_PROFILES).toHaveLength(16);
    expect(new Set(MANUAL_PROFILES.map(({ key }) => key)).size).toBe(16);
    expect(new Set(MANUAL_PROFILES.map(({ signature }) => signature)).size).toBe(16);
    expect(new Set(MANUAL_PROFILES.map(({ warranty }) => warranty)).size).toBe(16);
    expect(new Set(PERSONAL_COPY_RULES.map(({ id }) => id)).size).toBe(PERSONAL_COPY_RULES.length);
    const fixed = ["identity.description", "easterEgg.signature", "warranty.promise"];
    const slots = CHAPTER_DEFINITIONS.flatMap(({ slots }) => [...slots]).filter((slot) => !fixed.includes(slot));
    expect([...new Set(PERSONAL_COPY_RULES.map(({ slot }) => slot))].sort()).toEqual(slots.sort());
    for (const rule of PERSONAL_COPY_RULES) {
      expect(rule.text.trim()).not.toBe("");
      expect(rule.topic.trim()).not.toBe("");
      expect(rule.when.scores?.length || rule.when.answers?.length || rule.when.typeKey).toBeTruthy();
      for (const condition of rule.when.scores || []) {
        expect(condition.min).toBeGreaterThanOrEqual(0);
        expect(condition.max).toBeLessThanOrEqual(100);
        expect(condition.min).toBeLessThanOrEqual(condition.max);
      }
      for (const condition of rule.when.answers || []) {
        expect(SELF_QUESTIONS.some(({ id }) => id === condition.questionId)).toBe(true);
        expect(condition.min).toBeGreaterThanOrEqual(0);
        expect(condition.max).toBeLessThanOrEqual(4);
        expect(condition.min).toBeLessThanOrEqual(condition.max);
      }
    }
  });

  it("keeps all 625 combinations of extreme and 40/50/60 boundary scores complete and compatible", () => {
    const levels = [0, 40, 50, 60, 100];
    for (const energy of levels) for (const expression of levels) for (const navigation of levels) for (const connection of levels) {
      const answers = sampleAnswers({ energy, expression, navigation, connection });
      assertComplete(generatePersonalManual(answers), answers);
    }
  }, 15000);

  it.each([40, 50, 60])("describes a fully middle-band report without turning catalogue bits into extremes (%s)", (value) => {
    const manual = generatePersonalManual(sampleAnswers(uniform(value)));
    expect(manual.introduction).toContain("四条坐标都留在中间带");
    expect(manual.keywords).toEqual(["弹性模式", "保留余地", "随场景调整"]);
    expect(entries(manual).flatMap(({ source }) => source.claims).filter((claim) => /:(low|high)$/.test(claim))).toEqual([]);
  });

  it.each(PERSONALITY_TYPES)("adapts at least three chapters for stronger responses within model $id", (device) => {
    const mild = Object.fromEntries(DIMENSION_IDS.map((id, index) => [id, device.key[index] === "0" ? 35 : 65])) as Scores;
    const strong = Object.fromEntries(DIMENSION_IDS.map((id, index) => [id, device.key[index] === "0" ? 0 : 100])) as Scores;
    const first = generatePersonalManual(sampleAnswers(mild));
    const second = generatePersonalManual(sampleAnswers(strong));
    expect(first.result.typeKey).toBe(second.result.typeKey);
    expect(changedChapters(first, second).length).toBeGreaterThanOrEqual(3);
  });

  it("distinguishes at least three chapters for different concrete answers with identical four scores", () => {
    const first = generatePersonalManual(trajectory([2, 2, 2, 2, 2]));
    const second = generatePersonalManual(trajectory([0, 4, 0, 4, 2]));
    expect(first.result.scores).toEqual(second.result.scores);
    expect(first.result.typeKey).toBe(second.result.typeKey);
    expect(first.serial).not.toBe(second.serial);
    expect(changedChapters(first, second).length).toBeGreaterThanOrEqual(3);
  });

  it.each([
    [4, 40, "charging.tip:day-off-private"],
    [0, 60, "charging.tip:day-off-company"],
  ] as const)("inverts the real Q05 raw value %s exactly once before choosing answer-specific prose", (raw, energy, expectedRule) => {
    const question = SELF_QUESTIONS.find(({ id }) => id === "Q05")!;
    expect(question.reverse).toBe(true);
    const answers = sampleAnswers(uniform(50)).map((answer) => answer.questionId === question.id
      ? { ...answer, optionId: question.options.find(({ value }) => value === raw)!.id }
      : answer);
    const manual = generatePersonalManual(answers);
    expect(manual.result.scores.energy).toBe(energy);
    expect(entries(manual).find(({ id }) => id === "charging.tip")?.source.ruleId).toBe(expectedRule);
    assertComplete(manual, answers);
  });

  it("is deterministic, ignores supplied answer order and does not mutate shared content", () => {
    const answers = trajectory([0, 4, 0, 4, 2]);
    const before = JSON.stringify(answers);
    const manual = generatePersonalManual(answers);
    expect(generatePersonalManual([...answers].reverse())).toEqual(manual);
    expect(generatePersonalManual(answers)).toEqual(manual);
    expect(JSON.stringify(answers)).toBe(before);
    (manual.device.tags as unknown as string[])[0] = "changed by caller";
    const trace = manual.chapters[1].entries[0].source;
    (trace.claims as string[]).push("mutated");
    if (trace.conditions.scores?.length) (trace.conditions.scores[0] as { min: number }).min = 999;
    expect(generatePersonalManual(answers)).toEqual(generatePersonalManual([...answers].reverse()));
    expect(JSON.stringify(generatePersonalManual(answers))).not.toMatch(/changed by caller|mutated|999/);
  });

  it("encodes the canonical option positions exactly, without timestamps or fingerprints", () => {
    const answers = trajectory([0, 4, 0, 4, 2]);
    const manual = generatePersonalManual(answers);
    const encoded = manual.serial.split("-").at(-1)!;
    let number = parseInt(encoded, 36);
    const positions = Array.from({ length: 20 }, () => 0);
    for (let index = 19; index >= 0; index--) {
      positions[index] = number % 5;
      number = Math.floor(number / 5);
    }
    expect(number).toBe(0);
    expect(positions).toEqual(SELF_QUESTIONS.map((question, index) => question.options.findIndex(({ id }) => id === answers[index].optionId)));
    expect(encoded).toHaveLength(9);
    const serials = new Set<string>();
    for (let questionIndex = 0; questionIndex < 20; questionIndex++) {
      for (const option of SELF_QUESTIONS[questionIndex].options) {
        const altered = answers.map((answer, index) => index === questionIndex ? { ...answer, optionId: option.id } : answer);
        serials.add(generatePersonalManual(altered).serial);
      }
    }
    expect(serials.size).toBe(81); // Original + four alternatives for each of twenty positions.
  });

  it("rejects unsupported manual versions and incomplete or corrupt answers", () => {
    const answers = sampleAnswers(uniform(50));
    expect(() => generatePersonalManual(answers, "pm-unknown")).toThrow();
    expect(() => generatePersonalManual(answers.slice(1))).toThrow();
    expect(() => generatePersonalManual([...answers.slice(1), answers[1]])).toThrow();
    expect(() => generatePersonalManual([{ ...answers[0], optionId: "unknown" }, ...answers.slice(1)])).toThrow();
  });

  it("gates results on completion and valid versions, then regenerates the identical report after storage reload", () => {
    const answers = trajectory([0, 4, 0, 4, 2]);
    const partial = { ...createProgress(), answers };
    expect(getPersonalManual(partial)).toBeNull();
    const completed = completeProgress(partial).progress;
    expect(getPersonalManual(completed)).toEqual(generatePersonalManual(answers));
    expect(getPersonalManual({ ...completed, manualVersion: "pm-unknown" } as unknown as QuizProgress)).toBeNull();
    expect(getPersonalManual({ ...completed, answers: [] })).toBeNull();
    expect(getPersonalManual(null as unknown as QuizProgress)).toBeNull();
    let serialized = JSON.stringify({ schemaVersion: 1, contentVersion: "hum-1", answers, currentIndex: 19, completed: true });
    const storage = { getItem: () => serialized, setItem: (_key: string, value: string) => { serialized = value; } };
    const migrated = createQuizStore(() => storage);
    migrated.subscribe(() => {});
    const firstReport = getPersonalManual(migrated.getSnapshot().progress);
    const refreshed = createQuizStore(() => storage);
    refreshed.subscribe(() => {});
    expect(getPersonalManual(refreshed.getSnapshot().progress)).toEqual(firstReport);
    expect(firstReport).toEqual(generatePersonalManual(answers));
    expect(JSON.parse(serialized).schemaVersion).toBe(2);
  });
});

describe("rule selection invariants", () => {
  const result = scoreAnswers(sampleAnswers(uniform(50)));
  const responses = new Map([["Q01", 2]]);
  const rule = (id: string, overrides: Partial<ManualCopyRule> = {}): ManualCopyRule => ({
    id, slot: "charging.method", label: "充电", text: `text-${id}`, when: {}, priority: 1, topic: `topic-${id}`, ...overrides,
  });
  const pick = (rules: readonly ManualCopyRule[], selected: readonly ManualCopyRule[] = [], topics = new Set<string>(), texts = new Set<string>()) =>
    selectCompatibleRule("charging.method", rules, result, responses, selected, topics, texts);

  it("uses priority, then number of conditions, then lexical ID instead of input order", () => {
    const fallback = rule("fallback");
    const high = rule("high", { priority: 10 });
    const specific = rule("specific", { priority: 10, when: { answers: [{ questionId: "Q01", min: 2, max: 2 }] } });
    const tied = rule("a-tied", { priority: 10, when: specific.when });
    expect(pick([fallback, high])?.id).toBe("high");
    expect(pick([high, specific])?.id).toBe("specific");
    expect(pick([specific, tied])?.id).toBe("a-tied");
    expect(pick([tied, specific])?.id).toBe("a-tied");
  });

  it("requires every score, answer and model condition to hold", () => {
    const fallback = rule("fallback");
    expect(pick([rule("score-fail", { priority: 10, when: { scores: [{ dimension: "energy", min: 61, max: 100 }] } }), fallback])?.id).toBe("fallback");
    expect(pick([rule("answer-fail", { priority: 10, when: { answers: [{ questionId: "Q01", min: 0, max: 1 }] } }), fallback])?.id).toBe("fallback");
    expect(pick([rule("missing-answer", { priority: 10, when: { answers: [{ questionId: "Q99", min: 0, max: 4 }] } }), fallback])?.id).toBe("fallback");
    expect(pick([rule("type-fail", { priority: 10, when: { typeKey: "0000" } }), fallback])?.id).toBe("fallback");
  });

  it("rejects a contradictory broad claim even if its explicit predicates match", () => {
    expect(pick([rule("wrong", { priority: 100, claims: ["energy:low"] }), rule("right", { claims: ["energy:middle"] })])?.id).toBe("right");
  });

  it("filters explicit conflicts in both directions, including claim tokens", () => {
    const previous = rule("already", { slot: "factory.energy", claims: ["quiet-space"], conflicts: ["incompatible-claim"] });
    const fallback = rule("fallback");
    for (const conflict of [
      rule("id-conflict", { priority: 10, conflicts: ["already"] }),
      rule("claim-conflict", { priority: 10, conflicts: ["quiet-space"] }),
      rule("reverse-conflict", { priority: 10, claims: ["incompatible-claim"] }),
    ]) expect(pick([conflict, fallback], [previous])?.id).toBe("fallback");
  });

  it("rejects repeated semantic topics and exact text, selecting a compatible fallback", () => {
    const fallback = rule("fallback");
    expect(pick([rule("duplicate-topic", { priority: 10, topic: "used-topic" }), fallback], [], new Set(["used-topic"]))?.id).toBe("fallback");
    expect(pick([rule("duplicate-text", { priority: 10, text: "used-text" }), fallback], [], new Set(), new Set(["used-text"]))?.id).toBe("fallback");
    expect(pick([rule("wrong-slot", { slot: "reboot.pause" })])).toBeUndefined();
  });
});
