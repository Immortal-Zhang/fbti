"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FRIEND_QUESTIONS } from "@/data/questions/friend";
import { createFriendStore } from "@/lib/friends/store";
import {
  encodePacket,
  packetPath,
  type SharePacket,
} from "@/lib/sharing/snapshot";
import { usePacket } from "@/lib/sharing/use-packet";
import {
  InvalidLink,
  LinkLoading,
  SharedFrame,
} from "@/features/sharing/shared-ui";
import { ConfirmAction } from "@/components/confirm-action";

function Observation({
  invitation,
}: {
  invitation: Extract<SharePacket, { kind: "invite" }>;
}) {
  const token = encodePacket(invitation);
  const [store] = useState(() =>
    createFriendStore(token, () => window.localStorage),
  );
  const session = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const q = FRIEND_QUESTIONS[session.progress.currentIndex];
  const selected = session.progress.answers.find(
    (a) => a.questionId === q.id,
  )?.optionId;
  useEffect(() => {
    if (started) title.current?.focus({ preventScroll: true });
  }, [started, session.progress.currentIndex]);
  function move(index: number) {
    store.move(index);
    document.getElementById("friend-workspace")?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function next() {
    if (!selected || lock.current) return;
    if (session.progress.currentIndex < 7) {
      move(session.progress.currentIndex + 1);
      return;
    }
    lock.current = true;
    setSubmitting(true);
    try {
      const result = store.complete();
      router.push(
        packetPath({
          kind: "compare",
          invitationId: invitation.invitationId,
          self: invitation.self,
          observer: result.scores,
        }),
      );
    } catch {
      lock.current = false;
      setSubmitting(false);
      setError("还缺少完整观察，请返回补齐8道题。记录仍然保留。");
    }
  }
  if (!session.ready) return <LinkLoading />;
  if (!started)
    return (
      <main id="main" className="release-main friend-welcome">
        <span className="eyebrow">FRIEND INSPECTION / 朋友观察模式</span>
        <h1>
          你真的了解
          <br />
          这台人类设备吗？
        </h1>
        <div className="observer-mark" aria-hidden="true">
          <span>?</span>
          <i>旁观者请就位</i>
        </div>
        <p className="friend-welcome-lead">
          请按你对<strong>邀请者</strong>
          的日常印象回答8题。这里记录的是“你眼中的TA”，并不是你的个人测试。
        </p>
        <p>
          没有标准答案，也不评判关系好坏。具体相处场景不同，看到的那一面也会不同。
        </p>
        {session.notice && <p role="status">{session.notice}</p>}
        <button
          className="button-primary"
          type="button"
          onClick={() => setStarted(true)}
        >
          {session.progress.answers.length
            ? `继续朋友观察（${session.progress.answers.length}/8）`
            : "开始8题朋友观察"}{" "}
          ↗
        </button>
        <Link className="text-link" href="/quiz">
          我想做自己的20题测试 →
        </Link>
      </main>
    );
  return (
    <main id="main" className="friend-quiz release-main">
      <div className="friend-mode-label">
        <span className="eyebrow">正在观察邀请者 · 不是给自己作答</span>
        <button
          className="text-link"
          type="button"
          onClick={() => setStarted(false)}
          disabled={submitting}
        >
          暂存返回
        </button>
      </div>
      <div id="friend-workspace" className="friend-workspace">
        <div className="friend-progress">
          <span className="mono">
            OBS. {String(session.progress.currentIndex + 1).padStart(2, "0")} /
            08
          </span>
          <span>已回答 {session.progress.answers.length}/8</span>
        </div>
        <progress
          max={8}
          value={session.progress.answers.length}
          aria-label={`已回答${session.progress.answers.length}道，共8道`}
        />
        {session.notice && (
          <div className="release-notice" role="status">
            <p>{session.notice}</p>
            {!session.persistent && (
              <button type="button" onClick={store.retry}>
                重试保存
              </button>
            )}
          </div>
        )}
        <section className="quiz-question-panel" key={q.id}>
          <p className="friend-scene">{q.scene}</p>
          <h1 ref={title} tabIndex={-1}>
            {q.prompt}
          </h1>
          <fieldset className="quiz-options" disabled={submitting}>
            <legend className="sr-only">选择最符合你观察的情况</legend>
            {q.options.map((option, i) => (
              <label
                key={option.id}
                className={`quiz-option ${selected === option.id ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => {
                    store.choose({ questionId: q.id, optionId: option.id });
                    setError("");
                  }}
                />
                <span className="quiz-option-letter mono" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="quiz-option-text">{option.text}</span>
                <span className="quiz-option-check" aria-hidden="true">
                  {selected === option.id ? "✓" : ""}
                </span>
              </label>
            ))}
          </fieldset>
        </section>
        {error && <p role="alert">{error}</p>}
        <div className="quiz-controls">
          <button
            className="quiz-previous"
            type="button"
            disabled={session.progress.currentIndex === 0 || submitting}
            onClick={() => move(session.progress.currentIndex - 1)}
          >
            ← 上一题
          </button>
          <button
            className="button-primary quiz-next"
            type="button"
            disabled={
              !selected ||
              submitting ||
              (session.progress.currentIndex === 7 &&
                session.progress.answers.length !== 8)
            }
            onClick={next}
          >
            {submitting
              ? "正在整理观察…"
              : session.progress.currentIndex === 7
                ? "生成朋友观察报告"
                : "下一题"}{" "}
            ↗
          </button>
        </div>
        <p className="quiz-bottom-note">
          观察员仅记录所见。厂家暂不接受“我比本人更懂本人”的加急申请。
        </p>
        <ConfirmAction
          label="重新填写这份观察"
          title="重新填写这8题？"
          description="只清空当前邀请的朋友观察。你自己的20题测试和邀请者的档案不会改变。"
          confirmLabel="确认重新观察"
          className="text-link friend-restart"
          onConfirm={() => {
            store.restart();
            setError("");
          }}
        />
      </div>
    </main>
  );
}
export function FriendExperience() {
  const { ready, packet } = usePacket("/friends");
  return (
    <SharedFrame>
      {!ready ? (
        <LinkLoading />
      ) : packet?.kind === "invite" ? (
        <Observation key={encodePacket(packet)} invitation={packet} />
      ) : (
        <InvalidLink />
      )}
    </SharedFrame>
  );
}
