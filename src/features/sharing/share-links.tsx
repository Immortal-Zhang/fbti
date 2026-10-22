"use client";
import { useRef, useState } from "react";
import { packetPath, type SharePacket } from "@/lib/sharing/snapshot";
import { useBrowserOrigin } from "@/lib/sharing/use-packet";
import { isLocalOrigin, shareAddress } from "@/lib/site";

export function ShareLinks({
  packet,
  label = "复制公开结果链接",
}: {
  packet: SharePacket;
  label?: string;
}) {
  const origin = useBrowserOrigin();
  const input = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState("");
  let url = "",
    error = "";
  try {
    if (origin) url = shareAddress(packetPath(packet), origin);
  } catch {
    error = "当前网址不能用于分享，请从正式HTTPS站点重新打开。";
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("链接已复制。把它发给朋友，对方打开即可读取。");
    } catch {
      input.current?.focus();
      input.current?.select();
      setStatus("浏览器没有完成自动复制，已选中下方完整链接，请手动复制。");
    }
  }
  async function share() {
    if (!navigator.share) {
      setStatus("此浏览器没有系统分享面板，请使用复制链接。");
      return;
    }
    try {
      await navigator.share({
        title: "你哪个厂的？",
        text:
          packet.kind === "invite"
            ? "你真的了解这台人类设备吗？来做8题朋友观察。"
            : "厂家口供已出，请查阅这份人类设备档案。",
        url,
      });
      setStatus("已交给系统分享面板；不会自动通知任何人。");
    } catch (cause) {
      setStatus(
        cause instanceof Error && cause.name === "AbortError"
          ? "已取消分享，链接仍然保留。"
          : "系统分享未完成，可以复制下方链接。",
      );
    }
  }
  return (
    <section className="share-links" aria-label="分享链接">
      <div className="share-link-actions">
        <button
          className="button-primary"
          type="button"
          disabled={!url}
          onClick={copy}
        >
          {label} <span aria-hidden="true">↗</span>
        </button>
        <button
          className="button-secondary"
          type="button"
          disabled={!url}
          onClick={share}
        >
          系统分享链接
        </button>
      </div>
      <label className="share-url-label">
        完整链接（也可以手动复制）
        <textarea
          ref={input}
          readOnly
          value={url}
          rows={3}
          spellCheck={false}
          aria-label="完整分享链接"
          onFocus={(event) => event.currentTarget.select()}
        />
      </label>
      <p className="share-message" role="status">
        {status ||
          error ||
          (url && isLocalOrigin(url)
            ? "这是本机预览链接，尚不能发给其他设备。正式部署后请在公开站点重新生成。"
            : "链接公开展示分数和摘要；不包含姓名、联系方式或原始答题选项。")}
      </p>
      <p className="fine-print">
        任何拿到完整链接的人都可以查看。链接没有加密，也不验证发送者身份；只用于娱乐交流。
      </p>
    </section>
  );
}
