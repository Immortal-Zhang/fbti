"use client";

import { useState } from "react";
import type { PersonalManual } from "@/lib/personal-manual/schema";
import { DeviceIllustration } from "@/components/device-illustration";

export function ManualCover({
  manual,
  color,
}: {
  manual: PersonalManual;
  color: string;
}) {
  const [awake, setAwake] = useState(false);
  const { device } = manual;
  return (
    <section
      className="pm-cover"
      id="manual-identity"
      data-manual-chapter="identity"
      aria-labelledby="manual-title"
    >
      <div className="pm-cover-band mono">
        <span>01 / PERSONAL OWNER’S MANUAL</span>
        <span>品控已阅。品控选择沉默。</span>
      </div>
      <div className="pm-cover-body">
        <div className="pm-cover-copy">
          <span className="pm-cover-eyebrow">查到了，出厂时确实这么装的。</span>
          <h1 id="manual-title" data-testid="result-device-name">
            {device.name}
          </h1>
          <div className="pm-model-line">
            <span className="mono" data-testid="result-device-id">
              {device.id}
            </span>
            <span>FBTI / 个人版</span>
          </div>
          <p className="pm-introduction">{manual.introduction}</p>
          <div className="pm-keywords">
            {manual.keywords.map((word) => (
              <span key={word}># {word}</span>
            ))}
          </div>
          <div className="pm-cover-cert">
            <span className="pm-cert-symbol" aria-hidden="true">
              ✳
            </span>
            <div>
              <span className="mono">{manual.certification.mark}</span>
              <b>{manual.certification.label}</b>
              <span>{manual.certification.disclaimer}</span>
            </div>
          </div>
        </div>
        <div className={`pm-device-area ${awake ? "is-awake" : ""}`}>
          <span className="pm-figure mono">
            FIG. {device.id.slice(-3)}
            <br />
            HUMAN DEVICE
          </span>
          <div className="pm-device-orbit" />
          <button
            type="button"
            className="pm-device-button"
            aria-label={awake ? "让设备休息" : "点亮我的设备"}
            aria-pressed={awake}
            onClick={() => setAwake(!awake)}
          >
            <DeviceIllustration
              shape={device.shape}
              color={color}
              name={device.name}
            />
          </button>
          <div className="pm-device-status" role="status">
            <i />
            <span>
              {awake
                ? "灯亮了 · 厂家认为你还可以再离谱一会儿"
                : "轻触设备 · 点亮你的运行指示灯"}
            </span>
          </div>
          <span className="pm-care-sticker">
            HANDLE WITH CARE
            <br />
            <b>别拍，里面有人。</b>
          </span>
        </div>
      </div>
      <dl className="pm-cover-spec">
        <div>
          <dt>设备编号</dt>
          <dd className="mono" data-testid="manual-serial">
            {manual.serial}
          </dd>
        </div>
        <div>
          <dt>设备型号</dt>
          <dd>
            {device.id} / {device.name}
          </dd>
        </div>
        <div>
          <dt>说明书版本</dt>
          <dd className="mono">{manual.version.toUpperCase()} · 13 CHAPTERS</dd>
        </div>
      </dl>
    </section>
  );
}
