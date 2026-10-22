import type { DimensionId, TypeKey } from "@/lib/domain";
import type { RuleCondition } from "@/lib/personal-manual/schema";

export const MODEL_VOICE_SLOTS = ["charging.drain", "prohibited.decisions", "hidden.connection", "social.boundary", "environment.balance"] as const;
export type ModelVoiceSlot = (typeof MODEL_VOICE_SLOTS)[number];
export interface ModelVoiceNote {
  slot: ModelVoiceSlot;
  label: string;
  dimension: DimensionId;
  /** Used only when the model's relevant axis is clearly low/high. */
  strong: string;
  /** Specifically authored neutral interpretation for the 40–60 band. */
  middle: string;
}
export interface ShareSnippet {
  text: string;
  /** Real score/answer predicates; omitted only for non-assertive fictional captions. */
  when?: RuleCondition;
  priority?: number;
}
export const SHARE_CATEGORIES = ["titles", "faults", "hidden", "warnings", "summaries"] as const;
export type ShareCategory = (typeof SHARE_CATEGORIES)[number];
export interface ComedyProfile {
  key: TypeKey;
  direction: string;
  positioning: string;
  description: string;
  signature: string;
  warranty: string;
  manual: readonly ModelVoiceNote[];
  share: Readonly<Record<ShareCategory, readonly ShareSnippet[]>>;
  /** Three authored highlights already present in share/description/signature/warranty. */
  highlights: readonly [string, string, string];
}
