"use client";

import Link from "next/link";
import { useQuizSession } from "@/lib/quiz/use-quiz-session";

export function StartTest() {
  const session = useQuizSession();
  const count = session.ready ? session.progress.answers.length : 0;
  const complete = session.ready && session.progress.completed;
  return (
    <div className="home-start">
      <div className="hero-actions">
        <Link className="button-primary" href={complete ? "/result" : "/quiz"}>
          {complete ? "查看我的使用说明书" : "检测我的出厂设置"}
          <span aria-hidden="true">↗</span>
        </Link>
        <Link className="text-link" href="#manual-preview">
          先翻翻说明书 <span aria-hidden="true">→</span>
        </Link>
      </div>
      <p className="home-save-status" aria-live="polite">
        {complete
          ? session.persistence === "saved"
            ? "你的说明书已在本机保存，随时回来翻阅。"
            : "说明书仍在本次会话中；刷新或关闭后可能丢失。"
          : count > 0
            ? `已保留 ${count} / 20 道回答，点一下就能接着来。`
            : "20 个日常片段 · 无需注册 · 完整结果免费"}
      </p>
      {session.ready && session.notice && (
        <p className="home-storage-note">{session.notice}</p>
      )}
    </div>
  );
}
