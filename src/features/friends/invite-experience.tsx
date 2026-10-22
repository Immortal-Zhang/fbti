"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { DeviceIllustration } from "@/components/device-illustration";
import {
  publicIdentity,
  packetPath,
  encodePacket,
  type PublicSelf,
} from "@/lib/sharing/snapshot";
import { createInvitationStore } from "@/lib/friends/invitation-store";
import {
  ReportLoading,
  ReportUnavailable,
} from "@/features/result/flow-states";
import { useOwnerSnapshot } from "@/features/sharing/share-experience";
import { LinkLoading, SharedFrame } from "@/features/sharing/shared-ui";
import { ShareLinks } from "@/features/sharing/share-links";

export function InviteExperience() {
  const { session, self } = useOwnerSnapshot();
  if (!session.ready || !self)
    return (
      <SharedFrame>
        {!session.ready ? (
          <ReportLoading />
        ) : (
          <ReportUnavailable
            count={session.progress.answers.length}
            notice={session.notice}
          />
        )}
      </SharedFrame>
    );
  return <OwnedInvite key={encodePacket({ kind: "self", self })} self={self} />;
}

function OwnedInvite({ self }: { self: PublicSelf }) {
  const [store] = useState(() =>
    createInvitationStore(
      self,
      () => window.localStorage,
      () =>
        Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join(""),
    ),
  );
  const { ready, packet, notice } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  if (!ready)
    return (
      <SharedFrame>
        <LinkLoading />
      </SharedFrame>
    );
  if (!packet)
    return (
      <SharedFrame>
        <main id="main" className="release-empty">
          <h1>邀请暂时未能生成。</h1>
          <p role="alert">{notice}</p>
          <Link className="button-secondary" href="/result">
            返回我的说明书
          </Link>
        </main>
      </SharedFrame>
    );
  const identity = publicIdentity(self.scores);
  return (
    <SharedFrame>
      <main id="main" className="release-main">
        <Link className="text-link" href="/result">
          ← 返回我的说明书
        </Link>
        <section className="invite-cover">
          <div>
            <span className="eyebrow">EXTERNAL INSPECTION / 征集旁观证词</span>
            <h1>
              请朋友来，
              <br />
              拆穿你的
              <br />
              <em>出厂滤镜。</em>
            </h1>
            <p>
              你写了一份本人自述。现在请一位朋友用8个日常场景，补一份《TA眼中的你》。
            </p>
            <p>厂家负责把两份图纸摊开，不负责裁定谁才是真正懂你的人。</p>
          </div>
          <div className="invite-art">
            <DeviceIllustration
              shape={identity.device.shape}
              color={identity.device.color}
              name={identity.device.name}
            />
            <span className="invite-stamp">
              本人已自检
              <br />
              等待旁观证词
            </span>
          </div>
        </section>
        <ol className="invite-steps">
          <li>
            <b>01</b>
            <span>复制邀请发给朋友</span>
          </li>
          <li>
            <b>02</b>
            <span>朋友回答8道观察题</span>
          </li>
          <li>
            <b>03</b>
            <span>朋友把结果链接发回给你</span>
          </li>
        </ol>
        {notice && <p role="status">{notice}</p>}
        <ShareLinks packet={packet} label="复制好友邀请链接" />
        <div className="release-actions">
          <Link className="button-secondary" href={packetPath(packet)}>
            预览朋友收到的邀请 ↗
          </Link>
          <Link className="text-link" href="/share">
            先保存我的海报 →
          </Link>
        </div>
        <p className="fine-print">
          没有登录和后台通知。朋友完成后需要主动把结果链接发回；结果链接包含双方观察的四维坐标，不包含原始选项。
        </p>
      </main>
    </SharedFrame>
  );
}
