"use client";
import Link from "next/link";
import { DeviceIllustration } from "@/components/device-illustration";
import { compareObservations } from "@/lib/friends/compare";
import { packetPath } from "@/lib/sharing/snapshot";
import { usePacket } from "@/lib/sharing/use-packet";
import {
  InvalidLink,
  LinkLoading,
  SharedFrame,
} from "@/features/sharing/shared-ui";
import { ShareLinks } from "@/features/sharing/share-links";
import { PosterStudio } from "@/features/sharing/poster-studio";
import { JumpLink } from "@/components/jump-link";

export function ComparisonExperience() {
  const { ready, packet } = usePacket("/compare");
  if (!ready || packet?.kind !== "compare")
    return (
      <SharedFrame>{!ready ? <LinkLoading /> : <InvalidLink />}</SharedFrame>
    );
  const report = compareObservations(packet.self.scores, packet.observer);
  return (
    <SharedFrame>
      <main id="main" className="release-main comparison-main">
        <div className="comparison-heading">
          <span className="eyebrow">
            TWO VIEWS. ONE HUMAN. / 双视角观察档案
          </span>
          <h1>
            你眼中的TA，
            <br />
            与TA自述的出厂设置。
          </h1>
          <p>两份观察已到齐。先看看坐标，再听听对方为什么这样选。</p>
        </div>
        <div className="comparison-cover">
          {[report.self, report.observer].map((identity, i) => (
            <section className="comparison-device" key={i}>
              <span className="mono">
                {i === 0 ? "01 / 本人自评 · 20题" : "02 / 朋友观察 · 8题"}
              </span>
              <DeviceIllustration
                shape={identity.device.shape}
                color={identity.device.color}
                name={identity.device.name}
              />
              <h2
                data-testid={
                  i === 0 ? "compare-self-model" : "compare-observer-model"
                }
              >
                {identity.device.name}
              </h2>
              <p>{identity.description}</p>
            </section>
          ))}
          <div className="comparison-vs" aria-hidden="true">
            VS
          </div>
        </div>
        <section className="sync-section">
          <div className="sync-number">
            <span>认知同步率</span>
            <strong data-testid="synchronization">
              {report.synchronization}
              <small>%</small>
            </strong>
          </div>
          <div>
            <h2>{report.title}</h2>
            <p>{report.summary}</p>
            <p className="fine-print">{report.disclaimer}</p>
            <JumpLink target="incident" className="text-link">
              查看认知偏差事故报告 ↓
            </JumpLink>
          </div>
        </section>
        <details className="sync-explanation">
          <summary>同步率怎样计算？</summary>
          <p>
            逐一比较四条坐标相差多少，用100减去四条差值的平均数，保留一位小数。它只描述本次坐标的接近程度。8题旁观和20题自述覆盖的场景不同，数字不能代替面对面的交流。
          </p>
        </details>
        <section className="comparison-chart" aria-label="四维坐标对比">
          <div className="chart-legend">
            <span>● 本人自评</span>
            <span>● 朋友观察</span>
          </div>
          {report.dimensions.map((d) => (
            <div className="comparison-axis" key={d.id}>
              <h3>{d.name}</h3>
              <div className="comparison-axis-bars">
                <div>
                  <label htmlFor={`self-${d.id}`}>本人 {d.self}</label>
                  <meter id={`self-${d.id}`} min={0} max={100} value={d.self} />
                </div>
                <div>
                  <label htmlFor={`observer-${d.id}`}>朋友 {d.observer}</label>
                  <meter
                    id={`observer-${d.id}`}
                    min={0}
                    max={100}
                    value={d.observer}
                  />
                </div>
                <p>
                  {d.lowLabel}
                  <span>{d.highLabel}</span>
                </p>
              </div>
              <b>相差 {d.gap} 分</b>
            </div>
          ))}
        </section>
        <article className="incident-report" id="incident">
          <div className="incident-rail">
            <span className="mono">{report.code}</span>
            <span>
              出厂设置审查部
              <br />
              已受理，先别拆机。
            </span>
          </div>
          <div>
            <span className="eyebrow">
              认知偏差事故报告 / FICTIONAL CASE FILE
            </span>
            <h2>{report.title}</h2>
            <dl>
              <div>
                <dt>现场记录</dt>
                <dd>
                  {report.biggest.gap === 0
                    ? "四条坐标一致，本次未检出偏差。"
                    : `最大差异是${report.biggest.name}：本人${report.biggest.self}分，朋友${report.biggest.observer}分，相差${report.biggest.gap}分。`}
                </dd>
              </div>
              <div>
                <dt>厂家口供</dt>
                <dd>{report.summary}</dd>
              </div>
              <div>
                <dt>{report.closestLabel}</dt>
                <dd>{report.closestText}</dd>
              </div>
              <div>
                <dt>建议处理</dt>
                <dd>{report.repair}</dd>
              </div>
            </dl>
            <p className="fine-print">
              “事故”是虚构报告的叙述方式，不表示任何人存在缺陷。8题旁观与20题自述不是同一份问卷，分差不证明谁对谁错。
            </p>
          </div>
        </article>
        <div className="release-section-heading">
          <span className="eyebrow">RETURN TO SENDER / 请观察员亲自递送</span>
          <h2>
            报告写好了，
            <br />
            把它发回当事人。
          </h2>
          <p>
            复制下面的结果链接，发回邀请者。对方换一台设备也能打开；没有自动通知。
          </p>
        </div>
        <ShareLinks packet={packet} label="复制结果链接发回朋友" />
        <PosterStudio packet={packet} comparison />
        <section className="public-convert">
          <p>看完朋友，轮到你自己的出厂设置。</p>
          <Link className="button-primary" href="/quiz">
            我也要检测出厂设置 ↗
          </Link>
          <Link
            className="text-link"
            href={packetPath({
              kind: "invite",
              self: packet.self,
              invitationId: packet.invitationId,
            })}
          >
            返回这份朋友观察 →
          </Link>
        </section>
      </main>
    </SharedFrame>
  );
}
