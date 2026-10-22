import { COMEDY_PROFILES } from "@/data/creative";
import { SHARE_CATEGORIES, type ShareCategory } from "@/data/creative/schema";
import { SELF_QUESTIONS } from "@/data/questions/self";
import type { Answer } from "@/lib/domain";
import { generatePersonalManual, matchesManualCondition } from "@/lib/personal-manual/generate";
import type { RuleCondition } from "@/lib/personal-manual/schema";

export const SHARE_COPY_VERSION = "sc-1" as const;
export const SHARE_LAYOUTS = {
  moments: { width: 1080, height: 1920, label: "朋友圈", counts: { titles: 1, faults: 2, hidden: 2, warnings: 1, summaries: 1 } },
  rednote: { width: 1080, height: 1440, label: "小红书", counts: { titles: 1, faults: 1, hidden: 1, warnings: 1, summaries: 1 } },
} as const;
export type ShareFormat = keyof typeof SHARE_LAYOUTS;
export const SHARE_TEXT_LIMITS: Readonly<Record<ShareCategory, number>> = { titles: 16, faults: 35, hidden: 35, warnings: 35, summaries: 35 };
export interface SelectedShareLine { id: string; text: string; when: RuleCondition }

/** Text selection for layout proofs/future export. This is not a PNG exporter. */
export function selectShareCopy(answers: readonly Answer[], format: ShareFormat) {
  if (!(format in SHARE_LAYOUTS)) throw new Error("未知的文案版式。");
  const manual = generatePersonalManual(answers);
  const profile = COMEDY_PROFILES.find(({ key }) => key === manual.result.typeKey)!;
  const byId = new Map(answers.map(({ questionId, optionId }) => [questionId, optionId]));
  const responses = new Map(SELF_QUESTIONS.map((question) => {
    const option = question.options.find(({ id }) => id === byId.get(question.id))!;
    return [question.id, question.reverse ? 4 - option.value : option.value];
  }));
  const layout = SHARE_LAYOUTS[format];
  const seen = new Set<string>();
  const copy = {} as Record<ShareCategory, SelectedShareLine[]>;
  for (const category of SHARE_CATEGORIES) {
    const candidates = profile.share[category].map((line, index) => ({ ...line, id: `${profile.key}:${category}:${index}`, index }))
      .filter((line) => [...line.text].length <= SHARE_TEXT_LIMITS[category] && matchesManualCondition(line.when || {}, manual.result, responses))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0) ||
        ((b.when?.scores?.length || 0) + (b.when?.answers?.length || 0)) - ((a.when?.scores?.length || 0) + (a.when?.answers?.length || 0)) || a.index - b.index);
    const chosen: SelectedShareLine[] = [];
    for (const candidate of candidates) {
      if (seen.has(candidate.text)) continue;
      chosen.push({ id: candidate.id, text: candidate.text, when: candidate.when ? {
        ...(candidate.when.typeKey ? { typeKey: candidate.when.typeKey } : {}),
        ...(candidate.when.scores ? { scores: candidate.when.scores.map((item) => ({ ...item })) } : {}),
        ...(candidate.when.answers ? { answers: candidate.when.answers.map((item) => ({ ...item })) } : {}),
      } : {} });
      seen.add(candidate.text);
      if (chosen.length === layout.counts[category]) break;
    }
    // Neutral/short options are authored in the library. Never truncate a joke
    // or borrow a contradictory sentence merely to fill the card.
    if (chosen.length === 0) throw new Error(`缺少适合当前分数和空间的分享文案：${profile.key}/${category}`);
    copy[category] = chosen;
  }
  return { version: SHARE_COPY_VERSION, manualVersion: manual.version, format, layout, device: manual.device, result: manual.result, serial: manual.serial, copy };
}
