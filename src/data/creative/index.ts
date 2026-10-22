import { DIMENSION_IDS, type PersonalityType } from "@/lib/domain";
import type { ManualCopyRule } from "@/lib/personal-manual/schema";
import { PERSONAL_COPY_RULES } from "@/data/personal-manual/rules";
import { COMEDY_MODELS_A } from "./models-a";
import { COMEDY_MODELS_B } from "./models-b";
import type { ModelVoiceSlot } from "./schema";

export const COMEDY_PROFILES = [...COMEDY_MODELS_A, ...COMEDY_MODELS_B];
const TOPICS: Record<ModelVoiceSlot, string> = {
  "charging.drain": "energy-draining-situation",
  "prohibited.decisions": "decision-load-boundary",
  "hidden.connection": "social-observation-strength",
  "social.boundary": "availability-agreement",
  "environment.balance": "alone-together-rhythm",
};

/** Each model has five authored notes, including genuinely neutral alternatives. */
export const MODEL_VOICE_RULES: readonly ManualCopyRule[] = COMEDY_PROFILES.flatMap((profile) =>
  profile.manual.flatMap((note) => {
    const high = profile.key[DIMENSION_IDS.indexOf(note.dimension)] === "1";
    return (["strong", "middle"] as const).map((strength) => {
      const band = strength === "middle" ? "middle" : high ? "high" : "low";
      return {
        id: `model:${profile.key}:${note.slot}:${strength}`,
        slot: note.slot,
        label: note.label,
        text: note[strength],
        priority: 75,
        topic: TOPICS[note.slot],
        when: { typeKey: profile.key, scores: [{ dimension: note.dimension, min: band === "middle" ? 40 : high ? 61 : 0, max: band === "middle" ? 60 : high ? 100 : 39 }] },
        claims: [`${note.dimension}:${band}`],
        conflicts: ["low", "middle", "high"].filter((other) => other !== band).map((other) => `${note.dimension}:${other}`),
      };
    });
  }),
);

export const ABSTRACT_COPY_RULES: readonly ManualCopyRule[] = [...PERSONAL_COPY_RULES, ...MODEL_VOICE_RULES];

/** Editorial overlay only: identifiers, bits, colors and illustrations stay intact. */
export function creativeDevice(device: PersonalityType): PersonalityType {
  const profile = COMEDY_PROFILES.find(({ key }) => key === device.key);
  if (!profile) throw new Error(`缺少型号文案：${device.id}`);
  return { ...device, description: profile.description, positioning: profile.positioning, warranty: profile.warranty,
    strength: profile.manual.find(({ slot }) => slot === "hidden.connection")!.strong,
    environment: profile.manual.find(({ slot }) => slot === "environment.balance")!.strong,
  };
}
