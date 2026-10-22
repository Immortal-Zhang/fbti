"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { DeviceIllustration } from "@/components/device-illustration";
import { useQuizSession } from "@/lib/quiz/use-quiz-session";
import { getCompletedReport } from "./presentation";
import { ReportLoading, ReportUnavailable } from "./flow-states";
import { startRevealTiming } from "./reveal-timing";

const REVEAL_LINES = [
  "正在清点灵魂里的非标零件……",
  "正在核对友情供电线路……",
  "发现隐藏功能，研发部拒绝认领……",
  "型号已查明。厂家暂不方便解释。",
];

function RevealSequence({
  device,
}: {
  device: NonNullable<
    ReturnType<typeof getCompletedReport>
  >["manual"]["device"];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  useEffect(() => {
    return startRevealTiming({
      motion: window.matchMedia("(prefers-reduced-motion: reduce)"),
      onStep: setStep,
      onFinish: () => router.replace("/result"),
    });
  }, [router]);

  return (
    <main
      id="main"
      className="reveal-main"
      style={{ "--result-color": device.color } as CSSProperties}
    >
      <div className="reveal-topline mono">
        <span>HUMAN DEVICE LAB</span>
        <span>20 / 20 · INPUT COMPLETE</span>
      </div>
      <div className="reveal-device" aria-hidden="true">
        <div className="reveal-ring" />
        <DeviceIllustration
          shape={device.shape}
          color={device.color}
          name={device.name}
          decorative
        />
        <div className="reveal-scanline" />
      </div>
      <span className="eyebrow">FACTORY SETTINGS / READING</span>
      <h1 aria-live="polite" aria-atomic="true">
        {REVEAL_LINES[step]}
      </h1>
      <p className="reveal-subtitle">
        {step === 3
          ? `欢迎认识：${device.name}`
          : "出厂设置审查部正在翻阅你的二十份现场证词。"}
      </p>
      <div className="reveal-steps" aria-label={`揭晓进度：${step + 1} / 4`}>
        {REVEAL_LINES.map((line, index) => (
          <span key={line} className={index <= step ? "is-lit" : ""} />
        ))}
      </div>
      <Link href="/result" replace className="reveal-skip">
        跳过动画，直接看结果 <span aria-hidden="true">↗</span>
      </Link>
      <p className="reveal-footnote">
        虚构检测，认真逗你。不代表心理诊断或科学认证。
      </p>
    </main>
  );
}

export function RevealExperience() {
  const session = useQuizSession();
  const report = useMemo(
    () => getCompletedReport(session.progress),
    [session.progress],
  );
  return (
    <div className="reveal-page">
      <header className="report-nav">
        <Brand />
        <Link className="report-nav-link" href="/">
          返回首页
        </Link>
      </header>
      {!session.ready ? (
        <ReportLoading />
      ) : !report ? (
        <ReportUnavailable
          count={session.progress.answers.length}
          notice={session.notice}
        />
      ) : (
        <RevealSequence
          key={report.result.fingerprint}
          device={report.manual.device}
        />
      )}
    </div>
  );
}
