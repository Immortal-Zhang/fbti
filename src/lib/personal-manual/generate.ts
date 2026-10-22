import { PERSONALITY_TYPES } from "@/data/personality-types";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { MANUAL_PROFILES as LEGACY_PROFILES } from "@/data/personal-manual/legacy/model-profiles";
import { PERSONAL_COPY_RULES as LEGACY_RULES } from "@/data/personal-manual/legacy/rules";
import { LEGACY_CHAPTER_META } from "@/data/personal-manual/legacy/chapters";
import { ABSTRACT_COPY_RULES, COMEDY_PROFILES, creativeDevice } from "@/data/creative";
import { getResultIntroduction } from "@/lib/results/introduction";
import { getResultIntroduction as getLegacyIntroduction } from "@/lib/results/introduction-v1";
import { DIMENSION_IDS, type Answer, type ScoredResult } from "@/lib/domain";
import { validateProgress, type QuizProgress } from "@/lib/quiz/progress";
import { scoreAnswers } from "@/lib/scoring";
import {
  CHAPTER_DEFINITIONS,
  PERSONAL_MANUAL_VERSION,
  type EntrySlot,
  type ManualCopyRule,
  type PersonalEntry,
  type PersonalManual,
  type RuleCondition,
  type RuleSlot,
} from "./schema";

function copyCondition(condition: RuleCondition): RuleCondition {
  return {
    ...(condition.typeKey ? { typeKey: condition.typeKey } : {}),
    ...(condition.scores ? { scores: condition.scores.map((item) => ({ ...item })) } : {}),
    ...(condition.answers ? { answers: condition.answers.map((item) => ({ ...item })) } : {}),
  };
}

function specificity(rule: ManualCopyRule): number {
  return (rule.when.scores?.length || 0) + (rule.when.answers?.length || 0) + Number(Boolean(rule.when.typeKey));
}

function compareRules(a: ManualCopyRule, b: ManualCopyRule): number {
  return b.priority - a.priority || specificity(b) - specificity(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function matches(rule: ManualCopyRule, result: ScoredResult, responses: Map<string, number>): boolean {
  return matchesManualCondition(rule.when, result, responses);
}

export function matchesManualCondition(condition: RuleCondition, result: ScoredResult, responses: ReadonlyMap<string, number>): boolean {
  return (!condition.typeKey || condition.typeKey === result.typeKey) &&
    (condition.scores || []).every(({ dimension, min, max }) => result.scores[dimension] >= min && result.scores[dimension] <= max) &&
    (condition.answers || []).every(({ questionId, min, max }) => {
      const value = responses.get(questionId);
      return value !== undefined && value >= min && value <= max;
    });
}

/** Broad claims must agree with the unchanged continuous-score interpretation. */
function claimsAgree(rule: ManualCopyRule, result: ScoredResult): boolean {
  return (rule.claims || []).every((claim) => {
    const [dimension, band] = claim.split(":");
    if (!DIMENSION_IDS.includes(dimension as (typeof DIMENSION_IDS)[number]) || !["low", "middle", "high"].includes(band)) return true;
    return result.readings[dimension as (typeof DIMENSION_IDS)[number]].band === band;
  });
}

function conflictsWith(candidate: ManualCopyRule, selected: readonly ManualCopyRule[]): boolean {
  const candidateTokens = new Set([candidate.id, ...(candidate.claims || [])]);
  const candidateConflicts = new Set(candidate.conflicts || []);
  return selected.some((previous) => {
    const previousTokens = [previous.id, ...(previous.claims || [])];
    return previousTokens.some((token) => candidateConflicts.has(token)) ||
      (previous.conflicts || []).some((token) => candidateTokens.has(token));
  });
}

/** Pure selection boundary, exported for invariant tests and future reviewed content packs. */
export function selectCompatibleRule(
  slot: RuleSlot,
  rules: readonly ManualCopyRule[],
  result: ScoredResult,
  responses: Map<string, number>,
  selected: readonly ManualCopyRule[],
  topics: ReadonlySet<string>,
  texts: ReadonlySet<string>,
): ManualCopyRule | undefined {
  return rules.filter((rule) =>
    rule.slot === slot && matches(rule, result, responses) && claimsAgree(rule, result) &&
    !topics.has(rule.topic) && !texts.has(rule.text) && !conflictsWith(rule, selected),
  ).sort(compareRules)[0];
}

/** Exact base-five encoding, not the non-unique FNV copy seed and not encryption. */
function serialFor(answers: readonly Answer[], modelId: string): string {
  const byId = new Map(answers.map((answer) => [answer.questionId, answer.optionId]));
  let code = 0;
  for (const question of SELF_QUESTIONS) {
    const option = question.options.findIndex((item) => item.id === byId.get(question.id));
    if (option < 0 || option > 4) throw new Error("无法生成设备编号。");
    code = code * 5 + option;
  }
  if (!Number.isSafeInteger(code)) throw new Error("设备编号编码超出当前版本范围。");
  return `HUM2-${modelId.slice(-3)}-${code.toString(36).toUpperCase().padStart(9, "0")}`;
}

export function generatePersonalManual(
  answers: readonly Answer[],
  version: string = PERSONAL_MANUAL_VERSION,
): PersonalManual {
  if (version !== PERSONAL_MANUAL_VERSION && version !== "pm-1") throw new Error("不支持此版本的完整说明书。");
  const legacy = version === "pm-1";
  const rules = legacy ? LEGACY_RULES : ABSTRACT_COPY_RULES;
  // This is the only scoring path. No caller-provided scores/type/strength are trusted.
  const result = scoreAnswers(answers);
  const definition = PERSONALITY_TYPES.find((item) => item.key === result.typeKey);
  const profile = (legacy ? LEGACY_PROFILES : COMEDY_PROFILES).find((item) => item.key === result.typeKey);
  if (!definition || !profile) throw new Error("当前型号缺少完整说明书档案。");
  const device = { ...(legacy ? definition : creativeDevice(definition)), tags: [...definition.tags] as [string, string, string] };
  const introduction = (legacy ? getLegacyIntroduction : getResultIntroduction)(result, device);
  const byId = new Map(answers.map((answer) => [answer.questionId, answer.optionId]));
  const responses = new Map(SELF_QUESTIONS.map((question) => {
    const option = question.options.find((item) => item.id === byId.get(question.id))!;
    return [question.id, question.reverse ? 4 - option.value : option.value];
  }));

  const selected: ManualCopyRule[] = [];
  const topics = new Set<string>();
  const texts = new Set<string>();

  function fixed(id: EntrySlot, label: string, text: string, topic: string): PersonalEntry {
    if (!text.trim() || texts.has(text) || topics.has(topic)) throw new Error(`固定说明重复或为空：${id}`);
    texts.add(text);
    topics.add(topic);
    return {
      id, label, text,
      source: { ruleId: `${id}:${result.typeKey}`, topic, conditions: { typeKey: result.typeKey }, claims: [] },
    };
  }

  function choose(slot: EntrySlot): PersonalEntry {
    if (slot === "identity.description") return fixed(slot, "产品介绍", introduction.description, "identity-overview");
    if (slot === "easterEgg.signature") return fixed(slot, "型号限定彩蛋", profile!.signature, "model-signature-surprise");
    if (slot === "warranty.promise") return fixed(slot, "终身保修承诺", profile!.warranty, "model-unconditional-warranty");
    const candidate = selectCompatibleRule(slot, rules, result, responses, selected, topics, texts);
    if (!candidate) throw new Error(`完整说明书缺少兼容文案：${slot}`);
    if (!candidate.text.trim() || !candidate.label.trim()) throw new Error(`完整说明书文案为空：${candidate.id}`);
    selected.push(candidate);
    topics.add(candidate.topic);
    texts.add(candidate.text);
    return {
      id: slot, label: candidate.label, text: candidate.text,
      source: {
        ruleId: candidate.id, topic: candidate.topic,
        conditions: copyCondition(candidate.when), claims: [...(candidate.claims || [])],
      },
    };
  }

  const chapters = CHAPTER_DEFINITIONS.map((chapter, index) => ({
    id: chapter.id, number: String(index + 1).padStart(2, "0"),
    title: chapter.title, shortTitle: chapter.shortTitle, subtitle: legacy ? LEGACY_CHAPTER_META[index].subtitle : chapter.subtitle,
    entries: chapter.slots.map(choose),
  }));
  return {
    version,
    scoringVersion: result.version,
    serial: serialFor(answers, device.id),
    result, device,
    introduction: introduction.description,
    keywords: [...introduction.tags],
    certification: {
      mark: legacy ? "HUM LAB / NS-01" : "HUM MFG. / FICTIONAL INSPECTION",
      label: legacy ? "非标准件 · 妥善对待" : "出厂设置审查部 · 已阅，但没完全理解",
      disclaimer: "虚构产品标识，仅供娱乐与自我探索，不代表心理测量或质量认证。",
    },
    chapters,
  };
}

/** Graceful route gate, including malformed storage and unavailable report versions. */
export function getPersonalManual(progress: QuizProgress): PersonalManual | null {
  try {
    const validated = validateProgress(progress);
    if (!validated.completed) return null;
    return generatePersonalManual(validated.answers, validated.manualVersion);
  } catch {
    return null;
  }
}
