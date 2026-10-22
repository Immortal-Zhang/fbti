/** Versioned domain contract. UI, content and scoring all depend on this file. */
export const CONTENT_VERSION = "hum-1" as const;
export const DIMENSION_IDS = [
  "energy",
  "expression",
  "navigation",
  "connection",
] as const;
export type DimensionId = (typeof DIMENSION_IDS)[number];
export type Scores = Record<DimensionId, number>;
export type Bit = 0 | 1;
export type TypeKey = `${Bit}${Bit}${Bit}${Bit}`;
export type Band = "low" | "middle" | "high";

export interface Dimension {
  id: DimensionId;
  index: string;
  name: string;
  lowLabel: string;
  highLabel: string;
  description: string;
  color: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  /** Raw ordinal response (0..4). Reverse items invert this exactly once. */
  value: 0 | 1 | 2 | 3 | 4;
}
export interface Question {
  id: string;
  dimension: DimensionId;
  scene: string;
  prompt: string;
  reverse: boolean;
  options: readonly QuestionOption[];
}
export interface Answer {
  questionId: string;
  optionId: string;
}

export type DeviceShape =
  | "archive"
  | "beacon"
  | "terrarium"
  | "radar"
  | "kettle"
  | "radio"
  | "projector"
  | "capsule"
  | "console"
  | "router"
  | "sampler"
  | "satellite"
  | "printer"
  | "mixer"
  | "rover"
  | "jukebox";

export interface PersonalityType {
  key: TypeKey;
  id: string;
  name: string;
  positioning: string;
  color: string;
  ink: string;
  shape: DeviceShape;
  concept: string;
  tags: readonly [string, string, string];
  description: string;
  strength: string;
  fault: string;
  hidden: string;
  environment: string;
  warranty: string;
}

export interface DimensionReading {
  score: number;
  band: Band;
  dominant: "low" | "high" | "balanced";
  intensity: number;
}
export interface ScoredResult {
  version: typeof CONTENT_VERSION;
  scores: Scores;
  typeKey: TypeKey;
  readings: Record<DimensionId, DimensionReading>;
  /** Canonical fingerprint, independent of input answer ordering. Not a security hash. */
  fingerprint: string;
}

export const MANUAL_SECTION_IDS = [
  "charging",
  "malfunction",
  "prohibited",
  "hidden",
  "warning",
  "social",
  "environment",
  "reboot",
  "easterEgg",
  "warranty",
] as const;
export type ManualSectionId = (typeof MANUAL_SECTION_IDS)[number];
export interface CopyCondition {
  dimension: DimensionId;
  min: number;
  max: number;
}
export interface CopyRule {
  id: string;
  section: ManualSectionId;
  conditions: readonly CopyCondition[];
  priority: number;
  /** Prevent the same semantic topic from appearing in multiple sections. */
  topic: string;
  variants: readonly string[];
}
export interface ManualSection {
  id: ManualSectionId;
  label: string;
  text: string;
  ruleId: string;
}
export interface Manual {
  version: typeof CONTENT_VERSION;
  device: PersonalityType;
  scores: Scores;
  fingerprint: string;
  sections: readonly ManualSection[];
}
