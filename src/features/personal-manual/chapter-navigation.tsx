"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAPTER_IDS,
  type ChapterId,
  type PersonalChapter,
} from "@/lib/personal-manual/schema";

export function ChapterNavigation({
  chapters,
  navigate,
}: {
  chapters: readonly PersonalChapter[];
  navigate: (id: ChapterId) => void;
}) {
  const [active, setActive] = useState<ChapterId>("identity");
  const list = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      // Native anchors include the page's 24px scroll padding and the chapter margin.
      const marker = window.innerWidth < 1000 ? 140 : 130;
      let current: ChapterId = "identity";
      for (const id of CHAPTER_IDS) {
        const element = document.getElementById(`manual-${id}`);
        if (element && element.getBoundingClientRect().top <= marker)
          current = id;
      }
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8
      )
        current = "warranty";
      setActive(current);
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1000 || !list.current) return;
    const selected = list.current.querySelector<HTMLElement>(
      `[data-chapter-link="${active}"]`,
    );
    if (!selected) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.current.scrollTo({
      left:
        selected.offsetLeft -
        list.current.clientWidth / 2 +
        selected.offsetWidth / 2,
      behavior: reduce ? "instant" : "smooth",
    });
  }, [active]);

  const current = chapters.find((chapter) => chapter.id === active)!;
  return (
    <aside className="pm-index">
      <div className="pm-index-title">
        <span className="mono">CONTENTS</span>
        <span>
          阅读目录 <b>{current.number} / 13</b>
        </span>
      </div>
      <nav ref={list} className="pm-index-links" aria-label="说明书章节导航">
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            href={`#manual-${chapter.id}`}
            data-chapter-link={chapter.id}
            aria-current={active === chapter.id ? "location" : undefined}
            onClick={() => {
              setActive(chapter.id);
              navigate(chapter.id);
            }}
          >
            <span className="mono">{chapter.number}</span>
            <span>{chapter.shortTitle}</span>
            <span className="pm-index-indicator" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </nav>
      <div className="pm-index-note">
        <span aria-hidden="true">✳</span>
        <p>
          慢慢翻。
          <br />
          先找到今天
          <br />
          最像事故的那页。
        </p>
      </div>
    </aside>
  );
}
