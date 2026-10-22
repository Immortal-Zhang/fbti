"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DeviceIllustration } from "@/components/device-illustration";
import {
  publicCopy,
  publicIdentity,
  type SharePacket,
} from "@/lib/sharing/snapshot";
import { compareObservations } from "@/lib/friends/compare";
import { SITE_URL } from "@/lib/site";
import type { PosterFormat } from "@/lib/poster/render";

interface ReadyImage {
  key: string;
  url: string;
  blob: Blob;
  width: number;
  height: number;
  elapsedMs: number;
  textCount: number;
}
export function PosterStudio({
  packet,
  comparison = false,
  primary = false,
}: {
  packet: SharePacket;
  comparison?: boolean;
  primary?: boolean;
}) {
  const Heading = primary ? "h1" : "h2";
  const [format, setFormat] = useState<PosterFormat>(
    comparison ? "comparison" : "moments",
  );
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState<ReadyImage | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [canShareFile, setCanShareFile] = useState(false);
  const [enabled, setEnabled] = useState(primary);
  const art = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLElement>(null);
  const packetKey = JSON.stringify(packet);
  const key = `${packetKey}:${format}:${retry}`;
  const current = ready?.key === key ? ready : null;
  const error = failure?.key === key ? failure.message : null;
  const identity = publicIdentity(packet.self.scores);
  const observer =
    packet.kind === "compare" ? publicIdentity(packet.observer) : null;
  const copy = publicCopy(
    packet.self,
    format === "rednote" ? "rednote" : "moments",
  );
  const report =
    packet.kind === "compare"
      ? compareObservations(packet.self.scores, packet.observer)
      : null;

  useEffect(() => {
    if (
      primary ||
      enabled ||
      !preview.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(preview.current);
    return () => observer.disconnect();
  }, [primary, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false,
      objectUrl: string | null = null;
    const controller = new AbortController();
    const markup = Array.from(art.current?.querySelectorAll("svg") || []).map(
      (svg) => new XMLSerializer().serializeToString(svg),
    );
    // The code and image generation load only in the print studio, never on the first-test route.
    import("@/lib/poster/render")
      .then(({ renderPoster }) =>
        renderPoster(
          JSON.parse(packetKey) as SharePacket,
          format,
          markup,
          SITE_URL ? new URL(SITE_URL).hostname : null,
          controller.signal,
        ),
      )
      .then((result) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(result.blob);
        setReady({
          key,
          url: objectUrl,
          ...result,
          textCount: result.placements.length,
        });
        const file = new File([result.blob], "human-user-manual.png", {
          type: "image/png",
        });
        try {
          setCanShareFile(
            typeof navigator.share === "function" &&
              typeof navigator.canShare === "function" &&
              navigator.canShare({ files: [file] }),
          );
        } catch {
          // A denied native-sharing capability must not invalidate a successfully generated PNG.
          setCanShareFile(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setFailure({
            key,
            message:
              cause instanceof Error ? cause.message : "图片生成失败，请重试。",
          });
      });
    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, packetKey, format, enabled]);

  async function nativeShare() {
    if (!current) return;
    try {
      // PNG is already prepared; calling share directly inside this gesture preserves transient activation.
      await navigator.share({
        files: [
          new File([current.blob], `HUM-${format}.png`, { type: "image/png" }),
        ],
        title: "你哪个厂的？｜我的出厂说明书",
      });
      setMessage("已交给系统分享面板，图片仍可在这里保存。");
    } catch (cause) {
      setMessage(
        cause instanceof Error && cause.name === "AbortError"
          ? "已取消系统分享，图片仍然保留。"
          : "系统分享未完成，可以下载或打开高清图保存。",
      );
    }
  }

  return (
    <section
      className="print-studio"
      aria-label={comparison ? "双视角海报印制室" : "人格海报印制室"}
    >
      <div className="print-toolbar">
        <div>
          <span className="eyebrow">HUM PRINT SHOP / 档案印制室</span>
          <Heading>
            把这台人类，
            <br />
            带出说明书。
          </Heading>
        </div>
        {!comparison && (
          <fieldset className="template-switch">
            <legend>选择海报模板</legend>
            {(["moments", "rednote"] as const).map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="poster-format"
                  value={option}
                  checked={format === option}
                  onChange={() => {
                    setFormat(option);
                    setMessage("");
                  }}
                />
                <span>
                  {option === "moments" ? "朋友圈出厂证书" : "小红书人格卡片"}
                  <small>
                    {option === "moments" ? "1080 × 1920" : "1080 × 1440"}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <p className="print-instruction">
          生成的是完整PNG。预览缩小了，保存的图片不会缩水。
          <br />
          厂家建议：分享给朋友之前，允许先笑一下。
        </p>
        <div className="print-actions">
          {current ? (
            <>
              <a
                className="button-primary"
                href={current.url}
                download={`${identity.device.id}-${format}.png`}
                onClick={() =>
                  setMessage(
                    "已请求浏览器保存PNG；如果没有下载提示，请打开高清图长按保存。",
                  )
                }
              >
                保存PNG图片 <span aria-hidden="true">↓</span>
              </a>
              <a
                className="button-secondary"
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                打开高清图／长按保存 ↗
              </a>
              {canShareFile && (
                <button
                  className="button-secondary"
                  type="button"
                  onClick={nativeShare}
                >
                  使用系统分享
                </button>
              )}
            </>
          ) : (
            <button
              className="button-primary"
              type="button"
              disabled={enabled}
              onClick={() => setEnabled(true)}
            >
              {!enabled ? "生成海报" : error ? "图片尚未生成" : "正在印制PNG…"}
            </button>
          )}
          {error && (
            <div role="alert">
              <p>{error}</p>
              <button
                className="text-link"
                type="button"
                onClick={() => {
                  setFailure(null);
                  setRetry((v) => v + 1);
                }}
              >
                重新生成 ↻
              </button>
            </div>
          )}
        </div>
        <p className="print-status" role="status">
          {message ||
            (current
              ? `已生成 ${current.width} × ${current.height} PNG，完整文字已排入版面。`
              : error
                ? "印制未完成，原报告仍然保留。"
                : enabled
                  ? "正在装入原创设备插画与中文字体。"
                  : "滚动到海报附近会开始印制，也可以点击生成海报。")}
        </p>
        <p className="fine-print">
          微信等内置浏览器可能限制下载或系统分享，可打开高清图长按保存，或用系统浏览器打开。这里不自动发送给任何人。
        </p>
      </div>
      <figure
        ref={preview}
        className={`poster-preview ${format}`}
        data-export-width={current?.width}
        data-export-height={current?.height}
        data-export-ms={current?.elapsedMs}
        data-export-text-count={current?.textCount}
        aria-busy={enabled && !current && !error}
      >
        {current ? (
          <Image
            unoptimized
            loading="eager"
            src={current.url}
            width={current.width}
            height={current.height}
            alt={
              comparison
                ? `本人自评与朋友观察的双视角海报，同步率${report?.synchronization}%。完整文字见下方。`
                : `${identity.device.name}的${format === "moments" ? "朋友圈出厂证书" : "小红书人格卡片"}。完整文字见下方。`
            }
          />
        ) : (
          <div className="print-placeholder">
            <span className="mono">HUM / PRINT SHOP</span>
            <DeviceIllustration
              shape={identity.device.shape}
              color={identity.device.color}
              name={identity.device.name}
            />
            <p>
              {error
                ? "印刷机需要再来一次。"
                : enabled
                  ? "插画到岗，文字正在排队。"
                  : "你的海报，在这里等候印制。"}
            </p>
          </div>
        )}
        <figcaption>
          {comparison
            ? "双视角观察报告"
            : format === "moments"
              ? "朋友圈出厂证书"
              : "小红书人格卡片"}{" "}
          · 原创SVG与中文排版
        </figcaption>
      </figure>
      <details className="poster-transcript">
        <summary>
          阅读海报文字 <span aria-hidden="true">＋</span>
        </summary>
        {comparison && report ? (
          <div>
            <h3>
              本人自评：{report.self.device.name} / 朋友观察：
              {report.observer.device.name}
            </h3>
            <p>认知同步率：{report.synchronization}%</p>
            <p>{report.summary}</p>
            {report.dimensions.map((d) => (
              <p key={d.id}>
                {d.name}：本人{d.self} / 朋友{d.observer}
              </p>
            ))}
            <p>{report.disclaimer}</p>
          </div>
        ) : (
          <div>
            <h3>
              {copy.device.name} · {copy.copy.titles[0]}
            </h3>
            <p>{copy.description}</p>
            {Object.entries(copy.copy)
              .filter(([category]) => category !== "titles")
              .flatMap(([category, values]) =>
                values.map((value, i) => (
                  <p key={`${category}-${i}`}>{value}</p>
                )),
              )}
            <p>{copy.warranty}</p>
          </div>
        )}
      </details>
      <div className="poster-art-source" ref={art} aria-hidden="true">
        <DeviceIllustration
          shape={identity.device.shape}
          color={identity.device.color}
          name={identity.device.name}
          decorative
        />
        {comparison && observer && (
          <DeviceIllustration
            shape={observer.device.shape}
            color={observer.device.color}
            name={observer.device.name}
            decorative
          />
        )}
      </div>
    </section>
  );
}
