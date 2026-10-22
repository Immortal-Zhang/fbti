import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect } from "vitest";
import { DeviceIllustration } from "@/components/device-illustration";
import { COMEDY_PROFILES } from "@/data/creative";
import { PERSONALITY_TYPES } from "@/data/personality-types";
import { DIMENSION_IDS, type Scores } from "@/lib/domain";
import { sampleAnswers } from "@/lib/results/samples";
import { selectShareCopy, SHARE_LAYOUTS, type ShareFormat } from "@/lib/share-copy/select";

const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const labels = { faults: "特色故障 / 厂家口供", hidden: "隐藏功能 / 未经认领", warnings: "使用警告 / 厂家补充条款" } as const;

it("writes reproducible share-copy inventories and 96 exact-size editorial layout proofs", () => {
  const directory = fileURLToPath(new URL("../docs/qa/abstract-copy/", import.meta.url));
  mkdirSync(directory, { recursive: true });
  const records = PERSONALITY_TYPES.flatMap((device) => (["strong", "middle", "extreme"] as const).flatMap((variant) => {
    const levels = variant === "middle" ? [45, 55] : variant === "extreme" ? [0, 100] : [25, 75];
    const scores = Object.fromEntries(DIMENSION_IDS.map((id, index) => [id, levels[Number(device.key[index])]])) as Scores;
    return (Object.keys(SHARE_LAYOUTS) as ShareFormat[]).map((format) => ({ variant, answers: sampleAnswers(scores), ...selectShareCopy(sampleAnswers(scores), format) }));
  }));
  expect(records).toHaveLength(96);
  writeFileSync(`${directory}share-inventory.json`, JSON.stringify(COMEDY_PROFILES.map(({ key, direction, share, highlights }) => ({ key, direction, share, highlights })), null, 2));
  writeFileSync(`${directory}poster-selection.json`, JSON.stringify(records, null, 2));
  const cards = records.map((record) => {
    const art = renderToStaticMarkup(createElement(DeviceIllustration, { shape: record.device.shape, color: record.device.color, name: record.device.name, decorative: true }));
    const title = record.copy.titles[0].text;
    return `<article class="poster ${record.format}" data-model="${record.device.id}" data-variant="${record.variant}" data-format="${record.format}" style="--accent:${record.device.color};--accent-ink:${record.device.ink}" hidden>
      <header><span>人类非标制造有限公司</span><span>HUM / ${record.device.id}</span></header>
      <div class="cover"><div><span class="kicker">抽象人类观察计划</span><h1 data-fit>${escape(title)}</h1><p class="model-name" data-fit>${escape(record.device.name)}</p></div><div class="art">${art}</div></div>
      <div class="claim">出厂设置审查部：已阅，但没完全理解。</div>
      <section class="quote-grid">${(["faults", "hidden", "warnings"] as const).map((category) => `<div class="quote-group ${category}"><h2>${labels[category]}</h2>${record.copy[category].map((line) => `<p data-fit data-copy-id="${line.id}">${escape(line.text)}</p>`).join("")}</div>`).join("")}</section>
      <blockquote data-fit>${escape(record.copy.summaries[0].text)}</blockquote>
      <footer><span data-fit>${record.serial}</span><span>虚构公司 · 娱乐文案 · 非科学认证</span></footer>
    </article>`;
  }).join("\n");
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>抽象文案排版校样 · 非正式导出功能</title><style>
    *{box-sizing:border-box}body{margin:0;background:#d9d9d2;color:#242923;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}.toolbar{position:sticky;top:0;z-index:2;padding:12px 20px;background:#242923;color:#f6f3e9;display:flex;gap:14px;flex-wrap:wrap;align-items:center;font-size:14px}.toolbar strong{width:100%;font-size:16px}.toolbar select{font:inherit;padding:5px;min-height:36px}.notice{padding:0 20px;font-size:14px}.frame{margin:20px auto;position:relative;width:540px;height:960px}.poster{width:1080px;height:1920px;position:absolute;top:0;left:0;transform:scale(.5);transform-origin:top left;display:flex;flex-direction:column;padding:64px;background:#f6f3e9;border:2px solid #242923;overflow:visible}.poster[hidden]{display:none}.poster.rednote{height:1440px;padding:52px 64px}.poster header{display:flex;justify-content:space-between;border-bottom:3px solid;padding-bottom:24px;font-size:26px;letter-spacing:2px}.cover{display:grid;grid-template-columns:1fr 390px;align-items:center;gap:16px;padding:35px 0 16px;min-height:400px}.kicker{font-size:24px;letter-spacing:5px}.cover h1{font-size:64px;line-height:1.35;margin:28px 0 20px;padding:3px 0;max-height:196px;overflow-wrap:anywhere;text-wrap:balance}.model-name{font-size:31px;line-height:1.5;margin:0;max-height:100px}.art svg{width:100%;height:350px}.claim{padding:24px;background:var(--accent);color:var(--accent-ink);font-size:29px;border:2px solid;margin-bottom:30px}.quote-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.quote-group{border-top:3px solid;padding-top:18px}.quote-group h2{font-size:23px;margin:0 0 16px;letter-spacing:1px}.quote-group p{font-size:38px;font-weight:600;line-height:1.6;margin:18px 0 26px;max-height:192px;overflow-wrap:anywhere}.warnings{grid-column:1/-1;padding:22px 28px;background:#e8e6db;border:2px solid}.warnings p{font-size:35px;margin:8px 0;max-height:112px}.poster blockquote{font-size:43px;font-weight:750;line-height:1.6;margin:36px 0 28px;padding:28px 0;border-top:3px double;border-bottom:3px double;max-height:272px;overflow-wrap:anywhere}.poster footer{margin-top:auto;display:flex;justify-content:space-between;gap:20px;font-size:21px;line-height:1.5;padding-top:18px}.poster footer span:first-child{font-family:monospace;max-width:440px}.rednote .cover{min-height:310px;padding-top:24px;grid-template-columns:1fr 320px}.rednote .art svg{height:285px}.rednote .cover h1{font-size:66px;max-height:186px;margin-top:20px}.rednote .claim{padding:18px 24px;margin-bottom:24px}.rednote .quote-grid{gap:24px}.rednote .quote-group p{font-size:35px;line-height:1.55;max-height:166px;margin-bottom:18px}.rednote .warnings p{font-size:31px;max-height:100px}.rednote blockquote{font-size:37px;padding:20px 0;margin:28px 0 20px;max-height:220px}.rednote footer{font-size:20px}
  </style><div class="toolbar"><strong>文案排版校样 · 不是用户分享／PNG导出功能</strong><label>型号 <select id="model">${PERSONALITY_TYPES.map(({ id, name }) => `<option value="${id}">${id} ${name}</option>`).join("")}</select></label><label>分数 <select id="variant"><option value="strong">清晰倾向25/75</option><option value="middle">中间带45/55</option><option value="extreme">极端0/100</option></select></label><label>尺寸 <select id="format"><option value="moments">朋友圈1080×1920</option><option value="rednote">小红书1080×1440</option></select></label><label>预览比例 <select id="zoom"><option value="0.5">50%</option><option value="1">100%</option></select></label><output id="selection"></output></div><p class="notice">虚构样本；只验证原SVG、中文排版和条件选句。没有模拟下载、分享或图片导出按钮。</p><main class="frame">${cards}</main><script>
    const controls=['model','variant','format','zoom'].map(id=>document.getElementById(id));
    function show(){const [model,variant,format,zoom]=controls.map(e=>e.value);const scale=Number(zoom);document.querySelectorAll('.poster').forEach(card=>{const active=card.dataset.model===model&&card.dataset.variant===variant&&card.dataset.format===format;card.hidden=!active;if(active){card.style.transform='scale('+scale+')';const frame=document.querySelector('.frame');frame.style.width=(1080*scale)+'px';frame.style.height=((format==='moments'?1920:1440)*scale)+'px';document.getElementById('selection').textContent=model+' / '+variant+' / '+format;}});}
    controls.forEach(control=>control.addEventListener('change',show));show();
  </script></html>`;
  writeFileSync(`${directory}poster-proof.html`, html);
  writeFileSync(`${directory}COMEDY_SHOWCASE.md`, ["# 十六台人类，各有各的离谱", "以下金句均来自已入库字段；定位按真实四轴组合创作。", ...COMEDY_PROFILES.map((profile) => { const device = PERSONALITY_TYPES.find(({ key }) => key === profile.key)!; return `## ${device.id} ${device.name}\n\n喜剧定位：${profile.direction}\n\n${profile.highlights.map((line) => `- ${line}`).join("\n")}`; })].join("\n\n") + "\n");
});
