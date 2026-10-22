import { describe, expect, it } from "vitest";
import { COMEDY_PROFILES, MODEL_VOICE_RULES, ABSTRACT_COPY_RULES } from "@/data/creative";
import { MODEL_VOICE_SLOTS, SHARE_CATEGORIES } from "@/data/creative/schema";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { DIMENSION_IDS, type Scores } from "@/lib/domain";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { selectShareCopy, SHARE_LAYOUTS, SHARE_TEXT_LIMITS, type ShareFormat } from "@/lib/share-copy/select";

describe("abstract manufacturer content", () => {
  it("has 16 separate comedy directions, 5 authored notes with neutral alternatives and the complete 304-line share inventory", () => {
    expect(COMEDY_PROFILES).toHaveLength(16);
    expect(new Set(COMEDY_PROFILES.map(({ direction }) => direction)).size).toBe(16);
    expect(MODEL_VOICE_RULES).toHaveLength(160);
    expect(ABSTRACT_COPY_RULES).toHaveLength(324);
    const counts = { titles: 3, faults: 5, hidden: 5, warnings: 3, summaries: 3 };
    const allNotes: string[] = [];
    const allSnippets: string[] = [];
    for (const profile of COMEDY_PROFILES) {
      expect(profile.manual.map(({ slot }) => slot).sort()).toEqual([...MODEL_VOICE_SLOTS].sort());
      for (const note of profile.manual) {
        expect(note.strong).not.toBe(note.middle);
        allNotes.push(note.strong, note.middle);
      }
      for (const category of SHARE_CATEGORIES) {
        expect(profile.share[category]).toHaveLength(counts[category]);
        expect(profile.share[category].some(({ when }) => !when)).toBe(true);
        for (const line of profile.share[category]) {
          expect([...line.text].length).toBeLessThanOrEqual(SHARE_TEXT_LIMITS[category]);
          expect(line.text.trim().length).toBeGreaterThan(0);
          allSnippets.push(line.text);
          for (const condition of line.when?.scores || []) {
            expect(DIMENSION_IDS).toContain(condition.dimension);
            expect(condition.min).toBeGreaterThanOrEqual(0);
            expect(condition.max).toBeLessThanOrEqual(100);
            expect(condition.min).toBeLessThanOrEqual(condition.max);
          }
        }
      }
      const pool = [...SHARE_CATEGORIES.flatMap((category) => profile.share[category].map(({ text }) => text)), profile.description, profile.signature, profile.warranty];
      expect(profile.highlights.every((line) => pool.includes(line))).toBe(true);
    }
    expect(new Set(allNotes).size).toBe(160);
    expect(allSnippets).toHaveLength(304);
    expect(new Set(allSnippets).size).toBe(304);
  });

  it.each(PERSONALITY_TYPES)("gives $id at least five actually displayed unique notes, even with all axes in the middle band", (device) => {
    const scenarios = [sampleScores(device.key), Object.fromEntries(DIMENSION_IDS.map((id, i) => [id, device.key[i] === "0" ? 45 : 55])) as Scores];
    for (const scores of scenarios) {
      const manual = generatePersonalManual(sampleAnswers(scores));
      const entries = manual.chapters.flatMap(({ entries }) => entries);
      const modelNotes = entries.filter(({ source }) => source.ruleId.startsWith(`model:${device.key}:`));
      expect(modelNotes).toHaveLength(5);
      expect(new Set(modelNotes.map(({ text }) => text)).size).toBe(5);
      expect(manual.result.typeKey).toBe(device.key);
      if (scores.energy === 45 || scores.energy === 55) expect(modelNotes.every(({ source }) => source.claims.every((claim) => claim.endsWith(":middle")))).toBe(true);
    }
  });
});

describe("score and space aware share copy", () => {
  it.each(PERSONALITY_TYPES)("selects truthful, complete short lines for $id in both poster sizes and all strength regimes", (device) => {
    for (const levels of [[25, 75], [45, 55], [0, 100]]) {
      const scores = Object.fromEntries(DIMENSION_IDS.map((id, i) => [id, levels[Number(device.key[i])]])) as Scores;
      const answers = sampleAnswers(scores);
      for (const format of Object.keys(SHARE_LAYOUTS) as ShareFormat[]) {
        const selected = selectShareCopy(answers, format);
        expect(selectShareCopy([...answers].reverse(), format)).toEqual(selected);
        const all = SHARE_CATEGORIES.flatMap((category) => selected.copy[category]);
        expect(new Set(all.map(({ text }) => text)).size).toBe(all.length);
        for (const category of SHARE_CATEGORIES) {
          expect(selected.copy[category].length).toBeGreaterThan(0);
          expect(selected.copy[category].length).toBeLessThanOrEqual(selected.layout.counts[category]);
          for (const line of selected.copy[category]) {
            expect([...line.text].length).toBeLessThanOrEqual(SHARE_TEXT_LIMITS[category]);
            for (const condition of line.when.scores || []) {
              expect(scores[condition.dimension]).toBeGreaterThanOrEqual(condition.min);
              expect(scores[condition.dimension]).toBeLessThanOrEqual(condition.max);
            }
          }
        }
      }
    }
  });

  it("does not accept incomplete answers or unknown layouts", () => {
    const answers = sampleAnswers(sampleScores("1111"));
    expect(() => selectShareCopy(answers.slice(0, 19), "moments")).toThrow();
    expect(() => selectShareCopy(answers, "unknown" as ShareFormat)).toThrow();
  });
});
