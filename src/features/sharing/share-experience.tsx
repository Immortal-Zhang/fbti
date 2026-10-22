"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useQuizSession } from "@/lib/quiz/use-quiz-session";
import { publicSelfFromAnswers, packetPath } from "@/lib/sharing/snapshot";
import { usePacket } from "@/lib/sharing/use-packet";
import {
  ReportLoading,
  ReportUnavailable,
} from "@/features/result/flow-states";
import { PosterStudio } from "./poster-studio";
import { ShareLinks } from "./share-links";
import {
  InvalidLink,
  LinkLoading,
  PublicIdentity,
  SharedFrame,
} from "./shared-ui";

export function useOwnerSnapshot() {
  const session = useQuizSession();
  const self = useMemo(() => {
    if (!session.progress.completed) return null;
    try {
      return publicSelfFromAnswers(session.progress.answers);
    } catch {
      return null;
    }
  }, [session.progress]);
  return { session, self };
}
export function ShareExperience() {
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
  const packet = { kind: "self" as const, self };
  return (
    <SharedFrame>
      <main id="main" className="release-main">
        <nav className="release-breadcrumb" aria-label="位置">
          <Link href="/result">← 返回完整说明书</Link>
          <span>个人档案 / 印制与分享</span>
        </nav>
        <PosterStudio packet={packet} primary />
        <div className="release-section-heading">
          <span className="eyebrow">PUBLIC COPY / 公开摘要</span>
          <h2>
            图片带得走，
            <br />
            链接也能认出你。
          </h2>
          <p>只公开四维分数与选中的短句。完整答题和私人设备编号留在本机。</p>
        </div>
        <ShareLinks packet={packet} />
        <div className="release-actions">
          <Link className="button-secondary" href="/invite">
            让朋友看看你的出厂设置 ↗
          </Link>
          <Link className="text-link" href={packetPath(packet)}>
            预览公开摘要 →
          </Link>
        </div>
      </main>
    </SharedFrame>
  );
}
export function PublicReportExperience() {
  const { ready, packet } = usePacket("/s");
  if (!ready || packet?.kind !== "self")
    return (
      <SharedFrame>{!ready ? <LinkLoading /> : <InvalidLink />}</SharedFrame>
    );
  return (
    <SharedFrame>
      <main id="main" className="release-main">
        <PublicIdentity self={packet.self} />
        <div className="public-convert">
          <p>这台设备有说明书了。你的呢？</p>
          <Link className="button-primary" href="/quiz">
            我也要检测出厂设置 ↗
          </Link>
        </div>
        <PosterStudio packet={packet} />
        <ShareLinks packet={packet} />
      </main>
    </SharedFrame>
  );
}
