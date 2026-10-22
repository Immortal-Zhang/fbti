"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { Brand, Footer } from "@/components/brand";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { useQuizSession } from "@/lib/quiz/use-quiz-session";
import { getPersonalManual } from "@/lib/personal-manual/generate";
import type { ChapterId, PersonalManual } from "@/lib/personal-manual/schema";
import {
  PersistenceNotice,
  ReportLoading,
  ReportUnavailable,
} from "@/features/result/flow-states";
import { ManualCover } from "./manual-cover";
import { ChapterFrame, ChapterContent } from "./chapter-content";
import { ChapterNavigation } from "./chapter-navigation";
import { ThemePicker } from "./theme-picker";
import { useManualTheme } from "./theme-preference";
import { ConfirmAction } from "@/components/confirm-action";

const OPTIONAL_CHAPTERS: readonly ChapterId[] = [
  "social",
  "environment",
  "compatibility",
];

function Reader({
  manual,
  edit,
  restart,
}: {
  manual: PersonalManual;
  edit: () => void;
  restart: () => void;
}) {
  const theme = useManualTheme();
  const colorDevice =
    PERSONALITY_TYPES.find((device) => device.key === theme.key) ||
    manual.device;
  const [collapsed, setCollapsed] = useState<ReadonlySet<ChapterId>>(
    () => new Set(OPTIONAL_CHAPTERS),
  );

  function toggleChapter(id: ChapterId) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function revealChapter(id: ChapterId) {
    setCollapsed((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }

  return (
    <div
      className="pm-page"
      style={
        {
          "--pm-theme": colorDevice.color,
          "--pm-theme-ink": colorDevice.ink,
        } as CSSProperties
      }
    >
      <header className="report-nav pm-report-nav">
        <Brand />
        <button className="report-nav-link" type="button" onClick={edit}>
          修改我的回答 <span aria-hidden="true">↗</span>
        </button>
      </header>
      <div className="pm-reading-layout">
        <ChapterNavigation
          chapters={manual.chapters}
          navigate={revealChapter}
        />
        <main id="main" className="pm-book">
          <div className="pm-book-preface">
            <span className="mono">
              FBTI / FACTORY BUG TYPE INDICATOR
            </span>
            <span>13 章厂家口供。</span>
          </div>
          <ManualCover manual={manual} color={colorDevice.color} />
          <div className="pm-publish-actions"><Link className="button-primary" href="/share">保存我的出厂海报 ↗</Link><Link className="text-link" href="/invite">让朋友看看你的出厂设置 →</Link></div>
          <div className="pm-reader-tools">
            <ThemePicker
              selected={theme.key}
              choose={theme.choose}
              persistent={theme.persistent}
            />
            <button
              type="button"
              className="pm-reading-mode"
              onClick={() =>
                setCollapsed(
                  collapsed.size > 0 ? new Set() : new Set(OPTIONAL_CHAPTERS),
                )
              }
            >
              {collapsed.size > 0 ? "展开全部章节" : "收起辅助章节"}
              <span aria-hidden="true">{collapsed.size > 0 ? "+" : "−"}</span>
            </button>
          </div>
          <p className="pm-reading-intro">
            型号是厂家的分类习惯，细节来自你的这次回答。请按目录检修，禁止拿别人的说明书拧自己的螺丝。
          </p>
          {manual.chapters
            .filter((chapter) => chapter.id !== "identity")
            .map((chapter) => (
              <ChapterFrame
                key={chapter.id}
                chapter={chapter}
                collapsed={collapsed.has(chapter.id)}
                toggle={() => toggleChapter(chapter.id)}
              >
                <ChapterContent chapter={chapter} manual={manual} />
              </ChapterFrame>
            ))}
          <section className="pm-ending" aria-label="阅读完成">
            <span className="mono">END OF MANUAL. NOT THE END OF YOU.</span>
            <h2>
              说明书已经写完，
              <br />
              工程师还没想通。
            </h2>
            <div className="pm-ending-actions">
              <Link href="/share">保存海报 ↗</Link>
              <Link href="/invite">邀请朋友观察 →</Link>
              <ConfirmAction label="重新测试" title="重新检测这台人类？" description="确认后会清空本机这轮20题回答与私人说明书。已经保存的图片、发出的公开链接仍可使用。你也可以取消，先保存海报。" confirmLabel="确认重新测试" onConfirm={restart} className="pm-restart-button" />
              <Link href="/">
                返回首页 <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#manual-identity"
                onClick={() => revealChapter("identity")}
              >
                返回顶部 <span aria-hidden="true">↑</span>
              </a>
            </div>
            <p>
              重测会替换本机本轮回答。此说明书仅供娱乐与自我探索，不用于心理诊断。
            </p>
            <p className="mono pm-edition">
              {manual.device.id} · {manual.version.toUpperCase()}
            </p>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export function PersonalManualReader() {
  const router = useRouter();
  const session = useQuizSession();
  const manual = useMemo(
    () => getPersonalManual(session.progress),
    [session.progress],
  );
  function edit() {
    session.goToQuestion(0);
    router.push("/quiz");
  }
  function restart() {
    session.restartQuiz();
    router.push("/quiz");
  }

  if (!session.ready || !manual)
    return (
      <>
        <header className="report-nav">
          <Brand />
          <Link className="report-nav-link" href="/">
            返回首页
          </Link>
        </header>
        {!session.ready ? (
          <ReportLoading />
        ) : (
          <ReportUnavailable
            count={session.progress.answers.length}
            notice={session.notice}
          />
        )}
        <Footer />
      </>
    );

  return (
    <>
      <div className="pm-persistence-wrap">
        <PersistenceNotice
          notice={session.notice}
          memory={session.persistence === "memory"}
          retry={session.retryPersistence}
        />
      </div>
      <Reader
        key={manual.serial}
        manual={manual}
        edit={edit}
        restart={restart}
      />
    </>
  );
}
