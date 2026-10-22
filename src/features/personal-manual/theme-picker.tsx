import { PERSONALITY_TYPES } from "@/data/personality-types";
import type { TypeKey } from "@/lib/domain";
import type { CSSProperties } from "react";

export function ThemePicker({
  selected,
  choose,
  persistent,
}: {
  selected: TypeKey | null;
  choose: (key: TypeKey | null) => void;
  persistent: boolean;
}) {
  return (
    <details className="pm-theme-picker">
      <summary>
        <span aria-hidden="true">◉</span> 选择设备配色{" "}
        <span aria-hidden="true">+</span>
      </summary>
      <div className="pm-theme-options">
        <p>只换阅读配色，你的型号和说明书内容保持不变。</p>
        <div className="pm-theme-grid">
          {PERSONALITY_TYPES.map((device) => (
            <button
              type="button"
              key={device.key}
              aria-label={`使用${device.name}配色`}
              aria-pressed={selected === device.key}
              title={device.name}
              style={{ "--swatch": device.color } as CSSProperties}
              onClick={() => choose(device.key)}
            >
              <span aria-hidden="true" />
              <span>{device.name}</span>
              <b aria-hidden="true">{selected === device.key ? "✓" : ""}</b>
            </button>
          ))}
        </div>
        <div className="pm-theme-footer">
          <button type="button" onClick={() => choose(null)}>
            恢复我的型号原色 ↺
          </button>
          <span role="status">
            {persistent
              ? "配色偏好保存在当前浏览器"
              : "本次配色仅在当前页面会话保留"}
          </span>
        </div>
      </div>
    </details>
  );
}
