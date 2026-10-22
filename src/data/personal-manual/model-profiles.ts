import { COMEDY_PROFILES } from "@/data/creative";
import type { ManualModelProfile } from "@/lib/personal-manual/schema";

/** Current editorial profiles. The immutable pm-1 pack lives in legacy/. */
export const MANUAL_PROFILES: readonly ManualModelProfile[] = COMEDY_PROFILES.map(({ key, signature, warranty }) => ({ key, signature, warranty }));
