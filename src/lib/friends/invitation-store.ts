import type { ProgressStorage } from "@/lib/quiz/store";
import {
  decodePacket,
  encodePacket,
  isInvitationId,
  type PublicSelf,
  type SharePacket,
} from "@/lib/sharing/snapshot";

export const INVITATION_STORAGE_KEY = "hum:invitation-session";
type Invitation = Extract<SharePacket, { kind: "invite" }>;
interface InvitationState {
  ready: boolean;
  packet: Invitation | null;
  notice: string | null;
}
/** The nonce isolates invitations only. It never enters scoring, copy selection or private serials. */
export function createInvitationStore(
  self: PublicSelf,
  storage: () => ProgressStorage,
  newId: () => string,
) {
  const owner = encodePacket({ kind: "self", self });
  const initial: InvitationState = { ready: false, packet: null, notice: null };
  let snapshot = initial;
  const listeners = new Set<() => void>();
  function initialize() {
    if (snapshot.ready) return;
    let id: string | null = null;
    let notice: string | null = null;
    try {
      const raw = storage().getItem(INVITATION_STORAGE_KEY);
      if (raw && raw.length <= 2200) {
        const saved: unknown = JSON.parse(raw);
        if (
          saved &&
          typeof saved === "object" &&
          !Array.isArray(saved) &&
          Object.keys(saved).sort().join(",") === "invitationId,owner,version"
        ) {
          const record = saved as Record<string, unknown>;
          if (
            record.version === "inv-1" &&
            record.owner === owner &&
            isInvitationId(record.invitationId)
          )
            id = record.invitationId;
        }
      }
    } catch {
      /* A damaged or unavailable optional invitation record never changes personal answers. */
    }
    try {
      id ||= newId();
      if (!isInvitationId(id)) throw new Error("invalid nonce");
      try {
        storage().setItem(
          INVITATION_STORAGE_KEY,
          JSON.stringify({ version: "inv-1", owner, invitationId: id }),
        );
      } catch {
        notice =
          "邀请已生成，但本机未能保存它。请先复制链接；刷新可能生成新邀请，已发出的链接仍然有效。";
      }
      snapshot = {
        ready: true,
        packet: {
          kind: "invite",
          self: decodePacket(owner).self,
          invitationId: id,
        },
        notice,
      };
    } catch {
      snapshot = {
        ready: true,
        packet: null,
        notice:
          "当前浏览器无法生成独立邀请编号，请使用支持安全随机数的Safari或Chrome重试。你的自测结果仍然保留。",
      };
    }
    for (const listener of listeners) listener();
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      initialize();
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
  };
}
