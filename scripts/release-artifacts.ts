import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DeviceIllustration } from "@/components/device-illustration";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { DIMENSION_IDS, type Scores } from "@/lib/domain";
import { sampleAnswers } from "@/lib/results/samples";
import { generatePersonalManual } from "@/lib/personal-manual/generate";
import {
  decodePacket,
  encodePacket,
  packetPath,
  publicSelfFromAnswers,
} from "@/lib/sharing/snapshot";
import { compareObservations } from "@/lib/friends/compare";

it("prepares complete release samples and links using real scoring", () => {
  const directory = fileURLToPath(
    new URL("../docs/qa/phase-6/", import.meta.url),
  );
  mkdirSync(`${directory}reports`, { recursive: true });
  const cases = PERSONALITY_TYPES.flatMap((device) =>
    (["strong", "middle", "extreme"] as const).map((variant) => {
      const levels =
        variant === "strong"
          ? [25, 75]
          : variant === "middle"
            ? [45, 55]
            : [0, 100];
      const scores = Object.fromEntries(
        DIMENSION_IDS.map((id, i) => [id, levels[Number(device.key[i])]]),
      ) as Scores;
      const invitationId =
        device.id.slice(4).padStart(14, "0") +
        String(["strong", "middle", "extreme"].indexOf(variant)).padStart(
          2,
          "0",
        );
      const answers = sampleAnswers(scores);
      const manual = generatePersonalManual(answers);
      const self = publicSelfFromAnswers(answers);
      expect(manual.device.id).toBe(device.id);
      expect(manual.chapters.flatMap((c) => c.entries)).toHaveLength(37);
      const packet = { kind: "self" as const, self };
      expect(decodePacket(encodePacket(packet))).toEqual(packet);
      writeFileSync(
        `${directory}reports/${device.id}-${variant}.json`,
        JSON.stringify({ answers, manual }, null, 2),
      );
      return {
        id: device.id,
        name: device.name,
        variant,
        invitationId,
        answers,
        selfPath: packetPath(packet),
        invitePath: packetPath({ kind: "invite", self, invitationId }),
        serial: manual.serial,
        scores,
      };
    }),
  );
  const comparisons = cases
    .filter((item) => item.variant === "strong")
    .map((item) => {
      const self = publicSelfFromAnswers(item.answers);
      const observer = Object.fromEntries(
        DIMENSION_IDS.map((id) => [id, self.scores[id] < 50 ? 100 : 0]),
      ) as Scores;
      return {
        id: item.id,
        case: "opposite",
        path: packetPath({
          kind: "compare",
          self,
          observer,
          invitationId: item.invitationId,
        }),
        report: compareObservations(self.scores, observer),
      };
    });
  for (const [name, selfValues, friendValues] of [
    ["equal", [50, 50, 50, 50], [50, 50, 50, 50]],
    ["maximum", [0, 0, 0, 0], [100, 100, 100, 100]],
    ["mild", [50, 50, 50, 50], [62.5, 50, 50, 50]],
    ["same-band", [75, 75, 75, 75], [100, 75, 75, 75]],
    ["internal-output", [75, 100, 75, 75], [75, 0, 75, 75]],
    ["navigation", [25, 25, 100, 25], [25, 25, 0, 25]],
  ] as const) {
    const scores = Object.fromEntries(
      DIMENSION_IDS.map((id, i) => [id, selfValues[i]]),
    ) as Scores;
    const observer = Object.fromEntries(
      DIMENSION_IDS.map((id, i) => [id, friendValues[i]]),
    ) as Scores;
    const self = publicSelfFromAnswers(sampleAnswers(scores));
    comparisons.push({
      id: name,
      case: name,
      path: packetPath({
        kind: "compare",
        self,
        observer,
        invitationId: (1000 + comparisons.length)
          .toString(16)
          .padStart(16, "0"),
      }),
      report: compareObservations(scores, observer),
    });
  }
  expect(cases).toHaveLength(48);
  expect(comparisons).toHaveLength(22);
  writeFileSync(
    `${directory}fixtures.json`,
    JSON.stringify({ cases, comparisons }, null, 2),
  );
  const art = renderToStaticMarkup(
    createElement(DeviceIllustration, {
      shape: "console",
      color: "#254bfa",
      name: "人类设备样机",
      decorative: true,
    }),
  );
  const icon = readFileSync(
    new URL("../src/app/icon.svg", import.meta.url),
    "utf8",
  );
  writeFileSync(
    `${directory}brand-assets.html`,
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>HUM品牌PNG生成器 · 本地构建工具</title><style>body{background:#dddcd2;font-family:system-ui;padding:30px;color:#242923}img{display:block;max-width:100%;height:auto;margin:25px 0}a{display:inline-block;background:#254bfa;color:white;padding:15px;margin-right:15px}</style><h1>品牌PNG生成器 · 本地构建工具</h1><p>使用项目原创SVG与当前系统中文字体；不是产品功能或手动截图。</p><div id="output"></div><script>
  async function imageOf(svg){return new Promise((ok,no)=>{const image=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));image.onload=()=>{URL.revokeObjectURL(url);ok(image)};image.onerror=no;image.src=url})}
  function output(canvas,name){const src=canvas.toDataURL('image/png'),img=document.createElement('img'),a=document.createElement('a');img.src=src;img.alt=name;img.width=canvas.width;img.height=canvas.height;a.href=src;a.download=name;a.textContent='下载 '+name;document.getElementById('output').append(a,img)}
  async function draw(){await document.fonts.ready;const art=await imageOf(${JSON.stringify(art)}),icon=await imageOf(${JSON.stringify(icon)});const c=document.createElement('canvas');c.width=1200;c.height=630;const g=c.getContext('2d');g.fillStyle='#f6f3e9';g.fillRect(0,0,1200,630);g.strokeStyle='#242923';g.lineWidth=2;g.strokeRect(26,26,1148,578);g.drawImage(icon,60,54,74,74);g.textBaseline='top';g.fillStyle='#242923';g.font='600 29px "PingFang SC",sans-serif';g.fillText('人类非标制造有限公司',155,67);g.font='20px "PingFang SC",sans-serif';g.fillText('HUMAN USER MANUAL / ORIGINAL ENTERTAINMENT',155,106);g.font='750 76px "PingFang SC",sans-serif';g.fillText('你哪个厂的？',60,207);g.font='550 33px "PingFang SC",sans-serif';g.fillText('你可能不了解自己，',64,333);g.fillText('但你的出厂设置已经暴露了。',64,386);g.drawImage(art,760,174,370,308);g.fillStyle='#242923';g.fillRect(60,495,1080,66);g.fillStyle='#f6f3e9';g.font='500 25px "PingFang SC",sans-serif';g.fillText('20个日常场景   /   16种人类设备   /   朋友观察与原创海报',84,515);g.fillStyle='#66685f';g.font='18px "PingFang SC",sans-serif';g.fillText('虚构公司 · 认真娱乐 · 不用于心理诊断',64,577);output(c,'social-card.png');const a=document.createElement('canvas');a.width=180;a.height=180;a.getContext('2d').drawImage(icon,0,0,180,180);output(a,'apple-icon.png')};draw().catch(e=>document.getElementById('output').textContent=String(e));
  </script></html>`,
  );
});
