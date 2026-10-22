import { COMEDY_PROFILES, creativeDevice } from "@/data/creative";
import { SHARE_CATEGORIES, type ShareCategory } from "@/data/creative/schema";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { DIMENSION_IDS, type Answer, type Scores } from "@/lib/domain";
import { classifyScores, readScores, validateScores } from "@/lib/scoring";
import { getResultIntroduction } from "@/lib/results/introduction";
import {
  selectShareCopy,
  SHARE_LAYOUTS,
  type ShareFormat,
} from "@/lib/share-copy/select";

/** Public aggregate data only. The private HUM2 serial reversibly encodes answers and MUST NOT be shared here. */
export interface PublicSelf {
  scores: Scores;
  lines: Record<ShareCategory, number[]>;
}
export type SharePacket =
  | { kind: "self"; self: PublicSelf }
  | { kind: "invite"; self: PublicSelf; invitationId: string }
  | {
      kind: "compare";
      self: PublicSelf;
      observer: Scores;
      invitationId: string;
    };
export const SNAPSHOT_VERSION = "H1";
export const MAX_TOKEN_LENGTH = 1400;
const COUNTS = {
  titles: [1, 1],
  faults: [1, 2],
  hidden: [1, 2],
  warnings: [1, 1],
  summaries: [1, 1],
} as const;

export class SnapshotError extends Error {
  constructor(
    message = "这份链接缺少可读的出厂档案，请让朋友重新复制完整链接。",
  ) {
    super(message);
    this.name = "SnapshotError";
  }
}
function fail(): never {
  throw new SnapshotError();
}
function array(value: unknown, length: number): unknown[] {
  if (!Array.isArray(value) || value.length !== length) return fail();
  return value;
}
export function scoreTuple(scores: Scores): number[] {
  validateScores(scores);
  return DIMENSION_IDS.map((id) => scores[id]);
}
function scoresFrom(value: unknown, step: 5 | 12.5): Scores {
  const values = array(value, 4);
  if (
    !values.every(
      (v) =>
        typeof v === "number" &&
        Number.isFinite(v) &&
        v >= 0 &&
        v <= 100 &&
        v % step === 0,
    )
  )
    return fail();
  return Object.fromEntries(
    DIMENSION_IDS.map((id, i) => [id, values[i]]),
  ) as Scores;
}
export function publicIdentity(scores: Scores) {
  const typeKey = classifyScores(scores);
  const device = creativeDevice(
    PERSONALITY_TYPES.find((item) => item.key === typeKey)!,
  );
  const result = {
    version: "hum-1" as const,
    scores: { ...scores },
    typeKey,
    readings: readScores(scores),
    fingerprint: "public-aggregate",
  };
  return { device, result, ...getResultIntroduction(result, device) };
}
function selfTuple(self: PublicSelf): unknown[] {
  return [
    scoreTuple(self.scores),
    SHARE_CATEGORIES.map((category) => self.lines[category]),
  ];
}
function selfFrom(value: unknown): PublicSelf {
  const [rawScores, rawLines] = array(value, 2);
  const scores = scoresFrom(rawScores, 5);
  const profile = COMEDY_PROFILES.find(
    (item) => item.key === classifyScores(scores),
  )!;
  const groups = array(rawLines, SHARE_CATEGORIES.length);
  const texts = new Set<string>();
  const lines = {} as PublicSelf["lines"];
  SHARE_CATEGORIES.forEach((category, i) => {
    const group = groups[i];
    const [min, max] = COUNTS[category];
    if (
      !Array.isArray(group) ||
      group.length < min ||
      group.length > max ||
      new Set(group).size !== group.length
    )
      return fail();
    lines[category] = group.map((index) => {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= profile.share[category].length
      )
        return fail();
      const line = profile.share[category][index];
      if (line.when?.typeKey && line.when.typeKey !== profile.key)
        return fail();
      if (
        line.when?.scores?.some(
          ({ dimension, min, max }) =>
            scores[dimension] < min || scores[dimension] > max,
        )
      )
        return fail();
      if (texts.has(line.text)) return fail();
      texts.add(line.text);
      return index as number;
    });
  });
  return { scores, lines };
}
/** Damage detection, NOT a signature, encryption, identity proof or a random content seed. */
export function checksum(source: string): string {
  let value = 0x811c9dc5;
  for (let i = 0; i < source.length; i++)
    value = Math.imul(value ^ source.charCodeAt(i), 0x01000193);
  return (value >>> 0).toString(16).padStart(8, "0");
}
function rawPacket(packet: SharePacket): unknown[] {
  if (packet.kind === "self") return [1, "s", selfTuple(packet.self)];
  return packet.kind === "compare"
    ? [
        2,
        "c",
        selfTuple(packet.self),
        scoreTuple(packet.observer),
        packet.invitationId,
      ]
    : [2, "i", selfTuple(packet.self), packet.invitationId];
}
export function isInvitationId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{16}$/.test(value);
}
function fromRaw(raw: unknown): SharePacket {
  if (
    !Array.isArray(raw) ||
    ![1, 2].includes(raw[0]) ||
    !["s", "i", "c"].includes(raw[1])
  )
    return fail();
  const modern = raw[0] === 2;
  if (modern && raw[1] === "s") return fail();
  if (raw.length !== (raw[1] === "c" ? (modern ? 5 : 4) : modern ? 4 : 3))
    return fail();
  const self = selfFrom(raw[2]);
  if (raw[1] === "s") return { kind: "self", self };
  const source = JSON.stringify(selfTuple(self));
  // H1 remains readable. H2 separates otherwise identical invitations with a non-identifying nonce.
  const invitationId = modern
    ? raw.at(-1)
    : checksum(source) + checksum(`legacy:${source}`);
  if (!isInvitationId(invitationId)) return fail();
  if (raw[1] === "c")
    return {
      kind: "compare",
      self,
      observer: scoresFrom(raw[3], 12.5),
      invitationId,
    };
  return { kind: "invite", self, invitationId };
}
export function encodePacket(packet: SharePacket): string {
  const raw = rawPacket(packet);
  fromRaw(raw);
  const json = JSON.stringify(raw);
  const base = btoa(json)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const token = `H${raw[0]}.${base}.${checksum(json)}`;
  if (token.length > MAX_TOKEN_LENGTH) return fail();
  return token;
}
export function decodePacket(input: unknown): SharePacket {
  try {
    if (
      typeof input !== "string" ||
      input.length > MAX_TOKEN_LENGTH ||
      !/^H[12]\.[A-Za-z0-9_-]+\.[a-f0-9]{8}$/.test(input)
    )
      return fail();
    const [version, base, check] = input.split(".");
    const json = atob(base.replaceAll("-", "+").replaceAll("_", "/"));
    if (checksum(json) !== check) return fail();
    const raw: unknown = JSON.parse(json);
    const packet = fromRaw(raw);
    if (
      !Array.isArray(raw) ||
      version !== `H${raw[0]}` ||
      JSON.stringify(raw) !== json
    )
      return fail();
    if (
      btoa(json)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "") !== base
    )
      return fail();
    return packet;
  } catch {
    return fail();
  }
}
export function publicSelfFromAnswers(answers: readonly Answer[]): PublicSelf {
  const selection = selectShareCopy(answers, "moments");
  const lines = Object.fromEntries(
    SHARE_CATEGORIES.map((category) => [
      category,
      selection.copy[category].map((line) => Number(line.id.split(":").at(-1))),
    ]),
  ) as PublicSelf["lines"];
  return selfFrom([
    scoreTuple(selection.result.scores),
    SHARE_CATEGORIES.map((category) => lines[category]),
  ]);
}
export function publicCopy(self: PublicSelf, format: ShareFormat) {
  const valid = selfFrom(selfTuple(self));
  const identity = publicIdentity(valid.scores);
  const profile = COMEDY_PROFILES.find(
    (item) => item.key === identity.device.key,
  )!;
  const copy = Object.fromEntries(
    SHARE_CATEGORIES.map((category) => [
      category,
      valid.lines[category]
        .slice(0, SHARE_LAYOUTS[format].counts[category])
        .map((i) => profile.share[category][i].text),
    ]),
  ) as Record<ShareCategory, string[]>;
  return {
    ...identity,
    copy,
    warranty: profile.warranty,
    publicId: `HUM-P-${checksum(JSON.stringify(selfTuple(valid))).toUpperCase()}`,
  };
}
export const SHARE_ROUTES = {
  self: "/s",
  invite: "/friends",
  compare: "/compare",
} as const;
export function packetPath(packet: SharePacket): string {
  return `${SHARE_ROUTES[packet.kind]}#h=${encodePacket(packet)}`;
}
export function decodeHash(hash: string): SharePacket {
  if (!hash.startsWith("#h=") || hash.length > MAX_TOKEN_LENGTH + 3)
    return fail();
  return decodePacket(hash.slice(3));
}
