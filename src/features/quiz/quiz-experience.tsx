"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { QuestionFieldNote } from "@/components/question-field-note";
import { SELF_QUESTIONS } from "@/data/questions/self";
import { quizProgressLine } from "@/data/creative/quiz-voice";
import { useQuizSession } from "@/lib/quiz/use-quiz-session";

export function QuizExperience() {
  const session = useQuizSession();
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { progress } = session;
  const question = SELF_QUESTIONS[progress.currentIndex];
  const selected = progress.answers.find(
    (answer) => answer.questionId === question.id,
  )?.optionId;
  const count = progress.answers.length;
  const lastQuestion = progress.currentIndex === SELF_QUESTIONS.length - 1;

  useEffect(() => {
    if (!session.ready) return;
    titleRef.current?.focus({ preventScroll: true });
  }, [session.ready, progress.currentIndex]);

  function move(index: number) {
    setError(null);
    session.goToQuestion(index);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById("quiz-workspace")
      ?.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "instant" : "smooth",
      });
  }

  function next() {
    if (!selected || submitting.current) return;
    if (!lastQuestion) {
      move(progress.currentIndex + 1);
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      session.finishQuiz();
      router.push("/reveal");
    } catch {
      submitting.current = false;
      setIsSubmitting(false);
      setError("还有回答没有确认。请检查未完成的题目，再生成说明书。");
    }
  }

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <Brand />
        <Link className="quiz-exit" href="/">
          暂存退出 <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main id="main" className="quiz-layout">
        <aside className="quiz-aside">
          <span className="eyebrow">HUM / FACTORY SCAN</span>
          <h2>
            不用演示，
            <br />
            出厂味藏不住。
          </h2>
          <p>
            不用装成旗舰款。
            <br />
            选最近的日常里，
            <br />
            更常出现的那个自己。
          </p>
          <div className="quiz-aside-device" aria-hidden="true">
            <span className="ascii-face">: )</span>
            <div className="aside-device-slots" />
            <span className="mono">NO STANDARD PARTS.</span>
          </div>
          <div className="quiz-aside-note">
            <b>工程师留下的小纸条</b>
            <p>
              有两个都像？选更经常发生的。
              <br />
              想改答案？随时回到上一题。
            </p>
          </div>
        </aside>
        <div className="quiz-workspace" id="quiz-workspace">
          {!session.ready ? (
            <section className="quiz-loading" aria-live="polite">
              <span className="eyebrow">OPENING YOUR FILE</span>
              <h1>正在打开检测记录…</h1>
              <p>档案员正在检查你上次留下的证词。</p>
            </section>
          ) : (
            <>
              <div className="quiz-topline">
                <span className="mono">SELF CHECK / {question.id}</span>
                <span className="quiz-save-indicator">
                  <i
                    className={
                      session.persistence === "memory" ? "is-memory" : ""
                    }
                  />
                  {session.persistence === "saved"
                    ? "本机自动保存"
                    : "暂存于本页"}
                </span>
              </div>
              <div className="quiz-progress-heading">
                <span>
                  第 <b>{String(progress.currentIndex + 1).padStart(2, "0")}</b>{" "}
                  / 20 题
                </span>
                <span>
                  已回答 <b>{count}</b> / 20
                </span>
              </div>
              <progress
                className="quiz-progress"
                max={20}
                value={count}
                aria-label={`已回答 ${count} 道，共 20 道`}
              />
              {session.notice && (
                <div
                  className={`quiz-notice ${session.persistence === "memory" ? "storage-warning" : ""}`}
                  role="status"
                >
                  <p>{session.notice}</p>
                  {session.persistence === "memory" && (
                    <button type="button" onClick={session.retryPersistence}>
                      重试保存
                    </button>
                  )}
                </div>
              )}
              {!session.notice && session.restored && (
                <p className="quiz-restored">欢迎返厂。你上次的选择都还在，没有被工程师拿去垫桌脚。</p>
              )}
              {progress.completed && (
                <p className="quiz-restored">
                  这是你已完成的回答。改选后，新的说明书会按新答案重新生成。
                </p>
              )}
              <section
                className="quiz-question"
                key={question.id}
                aria-labelledby="question-title"
              >
                <div className="quiz-scene">
                  <span className="scene-marker" aria-hidden="true">
                    ◈
                  </span>
                  {question.scene}
                </div>
                <h1 id="question-title" ref={titleRef} tabIndex={-1}>
                  {question.prompt}
                </h1>
                <fieldset className="quiz-options" disabled={isSubmitting}>
                  <legend className="visually-hidden">
                    选择最接近你的情况
                  </legend>
                  {question.options.map((option, i) => (
                    <label
                      className={`quiz-option ${selected === option.id ? "is-selected" : ""}`}
                      key={option.id}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={selected === option.id}
                        onChange={() => {
                          setError(null);
                          session.chooseAnswer(question.id, option.id);
                        }}
                      />
                      <span
                        className="quiz-option-letter mono"
                        aria-hidden="true"
                      >
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
              {error && (
                <p className="quiz-error" role="alert">
                  {error}
                </p>
              )}
              <div className="quiz-controls">
                <button
                  type="button"
                  className="quiz-previous"
                  disabled={progress.currentIndex === 0 || isSubmitting}
                  onClick={() => move(progress.currentIndex - 1)}
                >
                  ← 上一题
                </button>
                <button
                  type="button"
                  className="button-primary quiz-next"
                  onClick={next}
                  disabled={
                    !selected || isSubmitting || (lastQuestion && count !== 20)
                  }
                >
                  {isSubmitting
                    ? "正在确认答案…"
                    : lastQuestion
                      ? "生成我的使用说明书"
                      : "下一题"}
                  <span aria-hidden="true">{lastQuestion ? "↗" : "→"}</span>
                </button>
              </div>
              <p className="quiz-bottom-note">
                {!selected
                  ? "选一个更接近你的答案，就可以继续。"
                  : lastQuestion && count < 20
                    ? "还有未回答的题目，请回到上一题补齐。"
                    : lastQuestion
                      ? "20 份现场证词已齐，准备请厂家出来解释。"
                      : quizProgressLine(count)}
              </p>
              {selected && <QuestionFieldNote questionId={question.id} />}
            </>
          )}
        </div>
      </main>
      <footer className="quiz-footer">
        <span className="mono">HUM / PERSONAL EDITION</span>
        <p>
          仅供娱乐与自我探索 ·{" "}
          {session.persistence === "memory"
            ? "本次仅暂存于当前会话"
            : "答案保存在当前浏览器"}
        </p>
        <Link href="/">人类非标制造有限公司 ↗</Link>
      </footer>
    </div>
  );
}
