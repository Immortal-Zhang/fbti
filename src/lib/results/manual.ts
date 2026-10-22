import { COPY_RULES, SECTION_LABELS } from "../../data/copywriting";
import { PERSONALITY_TYPES } from "../../data/personality-types";
import {
  CONTENT_VERSION,
  DIMENSION_IDS,
  MANUAL_SECTION_IDS,
  type CopyRule,
  type Manual,
  type ScoredResult,
} from "../domain";
import { classifyScores, readScores, validateScores } from "../scoring";

function record(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
}

/** Results are an internal contract. Future shared URLs must reconstruct from validated answers. */
function validateResult(result: ScoredResult): void {
  if (
    !record(result) ||
    !exactKeys(result, [
      "version",
      "scores",
      "typeKey",
      "readings",
      "fingerprint",
    ])
  ) {
    throw new Error("说明书输入必须是完整的评分结果。");
  }
  if (result.version !== CONTENT_VERSION)
    throw new Error("暂不支持此说明书版本。");
  validateScores(result.scores);
  if (result.typeKey !== classifyScores(result.scores))
    throw new Error("设备型号与维度分数不一致。");
  if (
    typeof result.fingerprint !== "string" ||
    !/^hum-1-[0-9a-f]{8}$/.test(result.fingerprint)
  ) {
    throw new Error("结果指纹格式无效。");
  }
  if (!record(result.readings) || !exactKeys(result.readings, DIMENSION_IDS)) {
    throw new Error("维度解读不完整。");
  }
  const expected = readScores(result.scores);
  for (const dimension of DIMENSION_IDS) {
    const reading = result.readings[dimension];
    if (
      !record(reading) ||
      !exactKeys(reading, ["score", "band", "dominant", "intensity"]) ||
      reading.score !== expected[dimension].score ||
      reading.band !== expected[dimension].band ||
      reading.dominant !== expected[dimension].dominant ||
      reading.intensity !== expected[dimension].intensity
    ) {
      throw new Error("维度解读与分数不一致。");
    }
  }
}

/** Small deterministic hash, deliberately not used for security or proof of authenticity. */
function variantIndex(seed: string, length: number): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0) % length;
}

function byPriority(a: CopyRule, b: CopyRule): number {
  return (
    b.priority - a.priority ||
    b.conditions.length - a.conditions.length ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export function generateManual(result: ScoredResult): Manual {
  validateResult(result);
  const device = PERSONALITY_TYPES.find((item) => item.key === result.typeKey);
  if (!device) throw new Error("未找到对应的设备档案。");
  const topics = new Set<string>();
  const texts = new Set<string>();
  const scoreSeed = DIMENSION_IDS.map((id) => result.scores[id]).join(",");
  const sections = MANUAL_SECTION_IDS.map((section) => {
    if (section === "warranty") {
      // Each model has a deliberately non-diagnostic, non-conditional warranty.
      topics.add("unconditional-care");
      return {
        id: section,
        label: SECTION_LABELS[section],
        text: device.warranty,
        ruleId: `model-warranty:${device.id}`,
      };
    }
    const candidates = COPY_RULES.filter(
      (candidate) =>
        candidate.section === section &&
        !topics.has(candidate.topic) &&
        candidate.conditions.every(
          ({ dimension, min, max }) =>
            result.scores[dimension] >= min && result.scores[dimension] <= max,
        ),
    ).sort(byPriority);
    for (const candidate of candidates) {
      const offset = variantIndex(
        `${result.version}|${result.fingerprint}|${scoreSeed}|${candidate.id}`,
        candidate.variants.length,
      );
      for (let step = 0; step < candidate.variants.length; step++) {
        const text =
          candidate.variants[(offset + step) % candidate.variants.length];
        if (texts.has(text)) continue;
        topics.add(candidate.topic);
        texts.add(text);
        return {
          id: section,
          label: SECTION_LABELS[section],
          text,
          ruleId: candidate.id,
        };
      }
    }
    throw new Error(`说明书模块 ${section} 缺少兼容文案。`);
  });
  return {
    version: CONTENT_VERSION,
    device,
    scores: { ...result.scores },
    fingerprint: result.fingerprint,
    sections,
  };
}
