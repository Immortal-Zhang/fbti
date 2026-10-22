import type { Answer } from "@/lib/domain";
import { decodePacket } from "@/lib/sharing/snapshot";
import { validateFriendAnswers } from "./score";

export interface FriendProgress {
  version: "fp-1";
  invitation: string;
  answers: Answer[];
  currentIndex: number;
  completed: boolean;
}
export function createFriendProgress(invitation: string): FriendProgress {
  if (decodePacket(invitation).kind !== "invite")
    throw new Error("这不是好友邀请。");
  return {
    version: "fp-1",
    invitation,
    answers: [],
    currentIndex: 0,
    completed: false,
  };
}
export function validateFriendProgress(
  input: unknown,
  invitation: string,
): FriendProgress {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("无效的朋友观察记录。");
  if (
    Object.keys(input).sort().join(",") !==
    "answers,completed,currentIndex,invitation,version"
  )
    throw new Error("朋友观察版本无法恢复。");
  const p = input as FriendProgress;
  if (
    p.version !== "fp-1" ||
    p.invitation !== invitation ||
    typeof p.completed !== "boolean" ||
    !Number.isInteger(p.currentIndex) ||
    p.currentIndex < 0 ||
    p.currentIndex > 7
  )
    throw new Error("这份进度不属于当前邀请。");
  const answers = validateFriendAnswers(p.answers, !p.completed);
  return {
    ...createFriendProgress(invitation),
    answers,
    completed: p.completed,
    currentIndex: p.currentIndex,
  };
}
export function friendStorageKey(invitation: string): string {
  return `hum:friend:${invitation}`;
}

export function decodeFriendProgress(
  raw: string | null,
  invitation: string,
): { progress: FriendProgress; invalid: boolean } {
  if (raw === null)
    return { progress: createFriendProgress(invitation), invalid: false };
  try {
    if (raw.length > 8000) throw new Error("记录过长。");
    return {
      progress: validateFriendProgress(JSON.parse(raw), invitation),
      invalid: false,
    };
  } catch {
    return { progress: createFriendProgress(invitation), invalid: true };
  }
}
