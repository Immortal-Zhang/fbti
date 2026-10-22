import { describe, expect, it } from "vitest";
import { FRIEND_QUESTIONS } from "@/data/questions/friend";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { DIMENSION_IDS, type Answer } from "@/lib/domain";
import { scoreFriendAnswers } from "@/lib/friends/score";
import { compareObservations } from "@/lib/friends/compare";
import {
  createFriendProgress,
  decodeFriendProgress,
  friendStorageKey,
} from "@/lib/friends/progress";
import { createFriendStore } from "@/lib/friends/store";
import { encodePacket, publicSelfFromAnswers } from "@/lib/sharing/snapshot";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";

const answersAt = (value: number): Answer[] =>
  FRIEND_QUESTIONS.map((q) => ({
    questionId: q.id,
    optionId: q.options.find(
      (o) => (q.reverse ? 4 - o.value : o.value) === value,
    )!.id,
  }));
const self = publicSelfFromAnswers(sampleAnswers(sampleScores("0101")));
const invitation = encodePacket({
  kind: "invite",
  self,
  invitationId: "0101010101010101",
});
describe("eight independent observations", () => {
  for (const device of PERSONALITY_TYPES)
    it(`maps the fixed eight-question contract to ${device.id}`, () => {
      const answers = Array.from({ length: 8 }, (_, i) => ({
        questionId: `F0${i + 1}`,
        // Independent oracle for F01–04 forward / F05–08 reverse in fixed axis order.
        optionId:
          i < 4
            ? device.key[i] === "1"
              ? "d"
              : "b"
            : device.key[i - 4] === "1"
              ? "b"
              : "d",
      }));
      expect(scoreFriendAnswers(answers).typeKey).toBe(device.key);
      expect(Object.values(scoreFriendAnswers(answers).scores)).toEqual(
        [...device.key].map((bit) => (bit === "1" ? 75 : 25)),
      );
    });
  it("has two questions and balanced direction on every unchanged axis", () => {
    expect(FRIEND_QUESTIONS).toHaveLength(8);
    for (const id of DIMENSION_IDS) {
      const questions = FRIEND_QUESTIONS.filter((q) => q.dimension === id);
      expect(questions).toHaveLength(2);
      expect(questions.filter((q) => q.reverse)).toHaveLength(1);
    }
  });
  for (let value = 0; value <= 4; value++)
    it(`normalizes both directions exactly once at ${value}`, () => {
      const answers = answersAt(value);
      expect(Object.values(scoreFriendAnswers(answers).scores)).toEqual([
        value * 25,
        value * 25,
        value * 25,
        value * 25,
      ]);
      expect(scoreFriendAnswers([...answers].reverse())).toEqual(
        scoreFriendAnswers(answers),
      );
    });
  it("preserves half steps and does not accept incomplete or forged observations", () => {
    const answers = answersAt(0);
    answers[0] = { questionId: "F01", optionId: "b" };
    expect(scoreFriendAnswers(answers).scores.energy).toBe(12.5);
    for (const bad of [
      [],
      answers.slice(1),
      [...answers, answers[0]],
      [...answers.slice(1), answers[1]],
      [{ ...answers[0], optionId: "x" }, ...answers.slice(1)],
    ])
      expect(() => scoreFriendAnswers(bad)).toThrow();
  });
});
describe("coordinate agreement, not friendship rating", () => {
  const zero = { energy: 0, expression: 0, navigation: 0, connection: 0 };
  const full = {
    energy: 100,
    expression: 100,
    navigation: 100,
    connection: 100,
  };
  it("returns 100 for equal coordinates and 0 for opposites", () => {
    expect(compareObservations(zero, zero).synchronization).toBe(100);
    expect(compareObservations(zero, full).synchronization).toBe(0);
    expect(
      compareObservations(zero, { ...zero, energy: 100 }).synchronization,
    ).toBe(75);
  });
  it("is symmetric in its score, direction aware in its prose and stable on ties", () => {
    expect(compareObservations(zero, full).synchronization).toBe(
      compareObservations(full, zero).synchronization,
    );
    expect(compareObservations(zero, full).summary).not.toBe(
      compareObservations(full, zero).summary,
    );
    expect(compareObservations(zero, full).biggest.id).toBe("energy");
    expect(compareObservations(zero, zero).code).toBe("OBS-000");
    expect(compareObservations(zero, { ...zero, energy: 12.5 }).title).toBe(
      "图纸出现轻微错位",
    );
    expect(compareObservations(zero, full).closestText).toContain(
      "没有很接近的坐标",
    );
    expect(compareObservations(zero, full).closestLabel).toBe("相对接近");
    expect(
      compareObservations({ ...zero, energy: 75 }, { ...zero, energy: 100 })
        .summary,
    ).toContain("多接了几张人类座位");
  });
  it("covers 21 self positions against 9 observer positions on one axis without out-of-range scores", () => {
    for (let a = 0; a <= 100; a += 5)
      for (let b = 0; b <= 100; b += 12.5) {
        const result = compareObservations(
          { ...zero, expression: a },
          { ...zero, expression: b },
        );
        expect(result.synchronization).toBeGreaterThanOrEqual(0);
        expect(result.synchronization).toBeLessThanOrEqual(100);
        expect(result.dimensions[1].delta).toBe(b - a);
      }
  });
});
describe("friend progress remains separate from personal answers", () => {
  it("persists, restores, edits and rejects another invitation's record", () => {
    const data = new Map<string, string>([
      ["hum:quiz-progress", "private-owner-record"],
    ]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    const store = createFriendStore(invitation, () => storage);
    store.subscribe(() => {});
    for (const answer of answersAt(3)) store.choose(answer);
    store.move(7);
    store.complete();
    const restored = createFriendStore(invitation, () => storage);
    restored.subscribe(() => {});
    expect(restored.getSnapshot().progress).toEqual(
      store.getSnapshot().progress,
    );
    restored.choose(answersAt(0)[0]);
    expect(restored.getSnapshot().progress.completed).toBe(false);
    expect(data.get("hum:quiz-progress")).toBe("private-owner-record");
    expect(
      decodeFriendProgress(
        data.get(friendStorageKey(invitation))!,
        encodePacket({
          kind: "invite",
          invitationId: "0202020202020202",
          self: publicSelfFromAnswers(sampleAnswers(sampleScores("0000"))),
        }),
      ).invalid,
    ).toBe(true);
    restored.restart();
    expect(restored.getSnapshot().progress.answers).toHaveLength(0);
  });
  it("keeps memory on storage denial and can retry", () => {
    let broken = true;
    let saved = "";
    const store = createFriendStore(invitation, () => ({
      getItem: () => null,
      setItem: (_, value) => {
        if (broken) throw new Error("quota");
        saved = value;
      },
    }));
    store.subscribe(() => {});
    store.choose(answersAt(2)[0]);
    expect(store.getSnapshot().persistent).toBe(false);
    expect(store.getSnapshot().progress.answers).toHaveLength(1);
    broken = false;
    store.retry();
    expect(store.getSnapshot().persistent).toBe(true);
    expect(saved).toContain("F01");
  });
  it("handles malformed and incompatible stored records", () => {
    const valid = createFriendProgress(invitation);
    for (const raw of [
      "{",
      "x".repeat(8001),
      JSON.stringify({ ...valid, version: "fp-99" }),
      JSON.stringify({ ...valid, completed: true }),
      JSON.stringify({ ...valid, currentIndex: 8 }),
      JSON.stringify({ ...valid, extra: true }),
    ])
      expect(decodeFriendProgress(raw, invitation).invalid).toBe(true);
  });
});
