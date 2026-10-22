import type { ReactNode } from "react";
import { DIMENSIONS } from "@/data/dimensions";
import type {
  PersonalChapter,
  PersonalManual,
} from "@/lib/personal-manual/schema";

export function ChapterFrame({
  chapter,
  collapsed,
  toggle,
  children,
}: {
  chapter: PersonalChapter;
  collapsed: boolean;
  toggle: () => void;
  children: ReactNode;
}) {
  return (
    <section
      id={`manual-${chapter.id}`}
      className={`pm-chapter pm-chapter-${chapter.id} ${collapsed ? "is-collapsed" : ""}`}
      data-manual-chapter={chapter.id}
      aria-labelledby={`heading-${chapter.id}`}
    >
      <header className="pm-chapter-heading">
        <div>
          <span className="pm-chapter-number mono">
            {chapter.number} / OWNER’S NOTES
          </span>
          <h2 id={`heading-${chapter.id}`}>{chapter.title}</h2>
          <p>{chapter.subtitle}</p>
        </div>
        <button
          type="button"
          className="pm-chapter-toggle"
          aria-expanded={!collapsed}
          aria-controls={`content-${chapter.id}`}
          aria-label={`${chapter.title}：${collapsed ? "展开章节" : "收起章节"}`}
          onClick={toggle}
        >
          <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
          <small>{collapsed ? "展开" : "收起"}</small>
        </button>
      </header>
      <div
        id={`content-${chapter.id}`}
        className="pm-chapter-content"
        hidden={collapsed}
      >
        {children}
      </div>
    </section>
  );
}

function FactorySettings({
  chapter,
  manual,
}: {
  chapter: PersonalChapter;
  manual: PersonalManual;
}) {
  return (
    <>
      <div className="pm-dimension-list">
        {DIMENSIONS.map((dimension) => {
          const score = manual.result.scores[dimension.id];
          const reading = manual.result.readings[dimension.id];
          const entry = chapter.entries.find(
            (item) => item.id === `factory.${dimension.id}`,
          )!;
          const side =
            reading.band === "middle"
              ? "中间倾向"
              : score < 50
                ? dimension.lowLabel
                : dimension.highLabel;
          return (
            <article className="pm-dimension" key={dimension.id}>
              <div className="pm-dimension-head">
                <div>
                  <span className="mono">{dimension.index}</span>
                  <h3>{dimension.name}</h3>
                </div>
                <strong data-testid={`score-${dimension.id}`}>
                  {score}
                  <small> / 100</small>
                </strong>
              </div>
              <div
                className="pm-axis"
                role="meter"
                aria-label={dimension.name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={score}
                aria-valuetext={`${score} / 100，${side}`}
              >
                <span className="pm-axis-middle" />
                <span className="pm-axis-line" />
                <span
                  className="pm-axis-point"
                  style={{ left: `calc(8px + (100% - 16px) * ${score / 100})` }}
                />
              </div>
              <div className="pm-axis-labels">
                <span>{dimension.lowLabel}</span>
                <span className="pm-axis-tendency">{side}</span>
                <span>{dimension.highLabel}</span>
              </div>
              <p className="pm-dimension-explanation">{entry.text}</p>
            </article>
          );
        })}
      </div>
      <p className="pm-scale-note">
        浅色区间为 40–60
        的中间带。坐标描述这次回答呈现的习惯，不是能力、健康或关系质量的分数。
      </p>
    </>
  );
}

export function ChapterContent({
  chapter,
  manual,
}: {
  chapter: PersonalChapter;
  manual: PersonalManual;
}) {
  const entries = chapter.entries;
  switch (chapter.id) {
    case "factory":
      return <FactorySettings chapter={chapter} manual={manual} />;
    case "charging":
      return (
        <div className="pm-charging-layout">
          <div className="pm-charge-illustration" aria-hidden="true">
            <div className="pm-battery">
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="mono">
              RECHARGE
              <br />
              IN YOUR OWN WAY.
            </span>
            <span className="pm-charge-bolt">↯</span>
          </div>
          <dl className="pm-charge-notes">
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <dt>
                  <span className="mono">0{i + 1}</span>
                  {entry.label}
                </dt>
                <dd>{entry.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "faults":
      return (
        <div className="pm-fault-list">
          {entries.map((entry, i) => (
            <details key={entry.id} open={i === 0} className="pm-fault">
              <summary>
                <span className="pm-fault-code mono">
                  ERR.
                  <br />
                  00{i + 1}
                </span>
                <h3>{entry.label}</h3>
                <span className="pm-details-mark" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="pm-fault-description">
                <p>{entry.text}</p>
                <span className="mono">STATUS / 厂家已收到，但正在互相转接</span>
              </div>
            </details>
          ))}
        </div>
      );
    case "prohibited":
      return (
        <div className="pm-caution-sheet">
          <div className="pm-caution-top">
            <span aria-hidden="true">△ !</span>
            <span className="mono">READ BEFORE OPERATING</span>
          </div>
          {entries.map((entry, i) => (
            <article key={entry.id}>
              <span className="pm-caution-index mono">0{i + 1}</span>
              <div>
                <h3>{entry.label}</h3>
                <p>{entry.text}</p>
              </div>
            </article>
          ))}
          <p className="pm-caution-foot">
            以上为厂家友情提醒，不具备管理你人生的执照。
          </p>
        </div>
      );
    case "hidden":
      return (
        <div className="pm-hidden-panel">
          <div className="pm-hidden-top">
            <span className="mono">EXTRA FEATURES / 已配备</span>
            <span aria-hidden="true">✳</span>
          </div>
          {entries.map((entry, i) => (
            <article key={entry.id}>
              <span className="pm-feature-symbol" aria-hidden="true">
                {i === 0 ? "↗" : "⊕"}
              </span>
              <div>
                <h3>{entry.label}</h3>
                <p>{entry.text}</p>
              </div>
            </article>
          ))}
          <div className="pm-hidden-bottom mono">
            SOME GOOD THINGS DON’T NEED TO BE LOUD.
          </div>
        </div>
      );
    case "warning":
      return (
        <ol className="pm-warning-lights">
          {entries.map((entry, i) => (
            <li key={entry.id} className={`pm-warning-level pm-warning-${i}`}>
              <div className="pm-signal-line">
                <span className="pm-signal-dot" />
                <span className="mono">
                  {["NORMAL", "NOTICE", "LOW POWER", "RECOVER"][i]}
                </span>
              </div>
              <div>
                <h3>{entry.label}</h3>
                <p>{entry.text}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "social":
      return (
        <div className="pm-social-layout">
          <div className="pm-social-plug" aria-hidden="true">
            <span />
            <span />
            <i />
            <b>
              HELLO,
              <br />
              HUMAN.
            </b>
          </div>
          <div className="pm-social-list">
            {entries.map((entry, i) => (
              <details key={entry.id} open={i === 0}>
                <summary>
                  <span className="mono">0{i + 1}</span>
                  <h3>{entry.label}</h3>
                  <span className="pm-details-mark" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{entry.text}</p>
              </details>
            ))}
          </div>
        </div>
      );
    case "environment":
      return (
        <dl className="pm-environment-spec">
          {entries.map((entry, i) => (
            <div key={entry.id}>
              <dt>
                <span
                  className={`pm-environment-icon pm-environment-icon-${i}`}
                  aria-hidden="true"
                >
                  {["◷", "≋", "↔"][i]}
                </span>
                <span>{entry.label}</span>
              </dt>
              <dd>{entry.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "reboot":
      return (
        <div className="pm-reboot-paper">
          <div className="pm-reboot-top">
            <span className="mono">QUICK REPAIR / 随时可用</span>
            <span aria-hidden="true">⏻</span>
          </div>
          <ol>
            {entries.map((entry, i) => (
              <li key={entry.id}>
                <span className="pm-step-number mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{entry.label}</h3>
                  <p>{entry.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pm-reboot-footer">
            <span aria-hidden="true">✓</span>开机成功的标准：先做一件小事，别顺手重建宇宙。
          </div>
        </div>
      );
    case "compatibility":
      return (
        <div className="pm-compatibility">
          <div className="pm-ports" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <dl>
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <dt>
                  <span className="mono">0{i + 1}</span>
                  {entry.label}
                </dt>
                <dd>{entry.text}</dd>
              </div>
            ))}
          </dl>
          <p className="pm-compatibility-note">
            没有天生不兼容的型号。能否相处，留给具体的人、边界和沟通。
          </p>
        </div>
      );
    case "easterEgg":
      return (
        <div className="pm-easter-egg">
          <span className="pm-egg-star" aria-hidden="true">
            ✳
          </span>
          <span className="mono pm-egg-label">
            SMALL PRINT. BIG PERSONALITY.
          </span>
          <blockquote>{entries[0].text}</blockquote>
          <div className="pm-egg-observation">
            <span>另一个小发现</span>
            <p>{entries[1].text}</p>
          </div>
          <span className="pm-egg-model mono">
            {manual.device.id} / FACTORY BONUS
          </span>
        </div>
      );
    case "warranty":
      return (
        <div className="pm-warranty-certificate">
          <div className="pm-warranty-rule" />
          <div className="pm-warranty-top">
            <span className="mono">LIFETIME CARE / 终身保修卡</span>
            <span className="pm-warranty-seal" aria-hidden="true">
              HUM
              <br />
              CARE
            </span>
          </div>
          <p className="pm-warranty-promise">{entries[0].text}</p>
          <p className="pm-warranty-care">{entries[1].text}</p>
          <div className="pm-warranty-signature">
            <div>
              <span>保修对象</span>
              <b>{manual.device.name}</b>
            </div>
            <div>
              <span>有效期限</span>
              <b>包括摆烂但仍在呼吸的周二</b>
            </div>
          </div>
          <div className="pm-warranty-bottom">
            <span className="mono">{manual.serial}</span>
            <span>虚构保修凭证 · 厂家没资格嫌弃原装的你</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}
