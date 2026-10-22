"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { DIMENSIONS } from "@/data/dimensions";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import type { Scores, TypeKey } from "@/lib/domain";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import { sampleAnswers, sampleScores } from "@/lib/results/samples";
import { DeviceIllustration } from "./device-illustration";

export function Catalog() {
  const [scores, setScores] = useState<Scores>(() => sampleScores("0000"));
  const manual = useMemo(() => generatePersonalManual(sampleAnswers(scores)), [scores]);
  const result = manual.result;
  const sections = manual.chapters.filter(({ id }) => !["identity", "factory"].includes(id)).map((chapter) => ({ id: chapter.id, label: chapter.title, text: chapter.entries[0].text }));
  const { device } = manual;
  const isBalanced = Object.values(result.readings).some(
    (reading) => reading.band === "middle",
  );
  function selectDevice(key: TypeKey) {
    setScores(sampleScores(key));
    document
      .getElementById("specimen")
      ?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  return (
    <>
      <div
        className="specimen"
        id="specimen"
        style={{ "--device-color": device.color } as CSSProperties}
      >
        <div className="specimen-art">
          <div className="specimen-topline mono">
            <span>ARCHIVE / {device.id}</span>
            <span>● SAMPLE</span>
          </div>
          <div className="specimen-orbit" />
          <DeviceIllustration
            shape={device.shape}
            color={device.color}
            name={device.name}
          />
          <span className="specimen-sticker">
            非标准件
            <br />
            <b>妥善对待</b>
          </span>
          <div className="specimen-bottom mono">
            <span>人类非标制造有限公司</span>
            <span>FIG. {device.id.slice(-3)}</span>
          </div>
        </div>
        <div className="specimen-copy" aria-live="polite" aria-atomic="true">
          <span className="eyebrow">设备档案 / {device.id}</span>
          <h3>{device.name}</h3>
          <p className="device-positioning">
            {isBalanced
              ? "部分坐标处于中间带，支持按场景切换模式。"
              : device.positioning}
          </p>
          <p className="device-description">
            {isBalanced
              ? "这些坐标靠近两端之间：你可能按场景切换运行方式。型号仅用于查找档案，下面的说明会保留这种弹性。"
              : device.description}
          </p>
          <div className="tags">
            {(isBalanced
              ? ["场景切换", "保留弹性", "拒绝定型"]
              : device.tags
            ).map((tag) => (
              <span key={tag}># {tag}</span>
            ))}
          </div>
          <dl className="device-quick-spec">
            <div>
              <dt>擅长的事</dt>
              <dd>
                {isBalanced
                  ? "在不同场景里尝试不同做法，四个坐标不需要排成同一种形状。"
                  : device.strength}
              </dd>
            </div>
            <div>
              <dt>外观设定</dt>
              <dd>{device.concept}</dd>
            </div>
          </dl>
          <p className="sample-note">这是可调节的虚构样本，非你的测试结果。</p>
        </div>
      </div>

      <div className="catalog-caption">
        <span className="mono">SELECT A DEVICE ↓</span>
        <span>16 份档案，点击换一台看看。</span>
      </div>
      <div className="device-grid">
        {PERSONALITY_TYPES.map((item) => (
          <button
            key={item.id}
            className={`device-tile ${item.key === device.key ? "is-active" : ""}`}
            onClick={() => selectDevice(item.key)}
            aria-pressed={item.key === device.key}
            aria-label={`查看${item.name}，${item.id}`}
            style={{ "--tile-color": item.color } as CSSProperties}
          >
            <span className="tile-id mono">
              {item.id}
              <span aria-hidden="true">
                {item.key === device.key ? "↗" : "+"}
              </span>
            </span>
            <DeviceIllustration
              shape={item.shape}
              color={item.color}
              name={item.name}
              decorative
            />
            <span className="tile-name">{item.name}</span>
            <span className="tile-tags">
              {item.tags.slice(0, 2).join(" / ")}
            </span>
          </button>
        ))}
      </div>

      <section className="workbench" aria-labelledby="workbench-title">
        <div className="workbench-intro">
          <span className="eyebrow">02 / THE SETTINGS</span>
          <h2 id="workbench-title">
            型号之外，
            <br />
            还有刻度。
          </h2>
          <p>
            两个同型号的人，也可能有不同的运行习惯。移动坐标，看看说明书如何跟着变化。
          </p>
          <div className="test-stamp">
            <span>DETERMINISTIC</span>
            <b>
              相同输入
              <br />
              相同输出
            </b>
            <span>COPY / PM-2</span>
          </div>
        </div>
        <div className="settings-panel">
          <div className="panel-label mono">
            <span>FACTORY SETTINGS</span>
            <span>可调节样本</span>
          </div>
          {DIMENSIONS.map((dimension) => (
            <div className="setting" key={dimension.id}>
              <div className="setting-head">
                <label htmlFor={`score-${dimension.id}`}>
                  {dimension.index} / {dimension.name}
                </label>
                <output htmlFor={`score-${dimension.id}`}>
                  {scores[dimension.id]}
                  <small> / 100</small>
                </output>
              </div>
              <input
                type="range"
                id={`score-${dimension.id}`}
                min="0"
                max="100"
                step="5"
                value={scores[dimension.id]}
                onChange={(event) =>
                  setScores({
                    ...scores,
                    [dimension.id]: Number(event.target.value),
                  })
                }
                aria-valuetext={`${scores[dimension.id]}，${result.readings[dimension.id].band === "middle" ? "中间倾向" : scores[dimension.id] < 50 ? dimension.lowLabel : dimension.highLabel}`}
              />
              <div className="setting-ends">
                <span>{dimension.lowLabel}</span>
                <span className="balanced-hint">40–60 中间倾向</span>
                <span>{dimension.highLabel}</span>
              </div>
            </div>
          ))}
          <p className="panel-footnote">
            刻度描述行为偏好，不代表能力高低。分数不用于心理诊断。
          </p>
        </div>
      </section>

      <section className="manual-preview" aria-labelledby="manual-title">
        <div className="manual-heading">
          <div>
            <span className="eyebrow">03 / OWNER’S NOTES</span>
            <h2 id="manual-title">厂家偷偷塞进来的，使用须知。</h2>
          </div>
          <span className="mono manual-id">
            {device.id}
            <br />
            {manual.serial}
          </span>
        </div>
        <p className="manual-context" aria-live="polite">
          当前样本：{device.name} · 说明随上方坐标实时更新
        </p>
        <div className="manual-grid">
          {sections.map((section, index) => (
            <article
              key={section.id}
              className={`manual-item ${section.id === "warranty" ? "warranty" : ""}`}
            >
              <span className="manual-number mono">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{section.label}</h3>
              <p>{section.text}</p>
              {section.id === "warranty" && (
                <span className="warranty-symbol" aria-hidden="true">
                  ✳
                </span>
              )}
            </article>
          ))}
        </div>
        <div className="manual-bottom mono">
          <span>PLEASE KEEP THIS MANUAL. AND YOURSELF.</span>
          <span>请保留说明书，厂家没有备用的你。</span>
        </div>
      </section>
    </>
  );
}
