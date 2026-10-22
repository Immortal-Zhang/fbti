import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
const directory = "docs/qa/phase-6/lighthouse";
mkdirSync(directory, { recursive: true });
const fixtures = JSON.parse(readFileSync("docs/qa/phase-6/fixtures.json", "utf8"));
const base = process.env.HUM_QA_BASE || "http://127.0.0.1:3130";
const cases = [
  { name: "home-mobile", path: "/", desktop: false },
  { name: "home-desktop", path: "/", desktop: true },
  { name: "public-mobile", path: fixtures.cases.find((item) => item.id === "HUM-116" && item.variant === "strong").selfPath, desktop: false },
  { name: "comparison-mobile", path: fixtures.comparisons[0].path, desktop: false },
];
const summary = [];
for (const item of cases) {
  const log = openSync(`${directory}/${item.name}.log`, "w");
  const args = ["--yes", "lighthouse@13.5.0", `${base}${item.path}`, "--output=json", `--output-path=${directory}/${item.name}.json`, "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new", ...(item.desktop ? ["--preset=desktop"] : [])];
  const exit = await new Promise((resolve, reject) => {
    const child = spawn("npx", args, { stdio: ["ignore", log, log], env: process.env });
    child.once("error", reject); child.once("exit", resolve);
  });
  closeSync(log);
  if (exit !== 0) throw new Error(`Lighthouse failed: ${item.name}. See its preserved log.`);
  const result = JSON.parse(readFileSync(`${directory}/${item.name}.json`, "utf8"));
  if (result.runtimeError) throw new Error(`${item.name}: ${JSON.stringify(result.runtimeError)}`);
  const row = {
    name: item.name, url: result.finalDisplayedUrl, lighthouseVersion: result.lighthouseVersion,
    environment: result.environment, config: result.configSettings,
    scores: Object.fromEntries(Object.entries(result.categories).map(([key, category]) => [key, Math.round(category.score * 100)])),
    lcpMs: result.audits["largest-contentful-paint"].numericValue,
    cls: result.audits["cumulative-layout-shift"].numericValue,
    totalBlockingTimeMs: result.audits["total-blocking-time"].numericValue,
    transferBytes: result.audits["total-byte-weight"].numericValue,
    failedAudits: Object.entries(result.audits).filter(([, audit]) => audit.score !== null && audit.score < 1).map(([id, audit]) => ({ id, title: audit.title, score: audit.score, displayValue: audit.displayValue })),
  };
  summary.push(row); writeFileSync(`${directory}/summary.json`, JSON.stringify(summary, null, 2) + "\n");
  const screenshot = result.audits["final-screenshot"]?.details?.data;
  if (screenshot) { const [, mime, data] = screenshot.match(/^data:([^;]+);base64,(.*)$/); writeFileSync(`${directory}/${item.name}.${mime === "image/png" ? "png" : "jpg"}`, Buffer.from(data, "base64")); }
  console.log(JSON.stringify({ name: row.name, scores: row.scores, lcpMs: row.lcpMs, cls: row.cls, tbtMs: row.totalBlockingTimeMs }));
}
