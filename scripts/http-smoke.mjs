import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const base = process.env.HUM_QA_BASE || "http://127.0.0.1:3130";
const routes = ["/", "/quiz", "/reveal", "/result", "/share", "/s", "/invite", "/friends", "/compare", "/devices", "/questions", "/privacy"];
const rows = [];
for (const path of routes) {
  const response = await fetch(new URL(path, base));
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(html.includes('lang="zh-CN"'), path);
  assert.ok(html.includes('id="main"'), path);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const csp = response.headers.get("content-security-policy");
  assert.ok(csp.includes("object-src 'none'") && !csp.includes("unsafe-eval"), path);
  assert.ok(!html.includes("localhost") && !html.includes("127.0.0.1"), `${path}: no built-in local production URLs`);
  rows.push({ path, status: response.status, title: html.match(/<title>(.*?)<\/title>/)?.[1], htmlBytes: Buffer.byteLength(html), securityHeaders: true, noLocalProductionURLs: true });
}
for (const [path, width, height] of [["/social-card.png", 1200, 630], ["/apple-icon.png", 180, 180]]) {
  const response = await fetch(new URL(path, base)); const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200); assert.equal(buffer.subarray(1, 4).toString(), "PNG");
  assert.equal(buffer.readUInt32BE(16), width); assert.equal(buffer.readUInt32BE(20), height);
  rows.push({ path, status: response.status, bytes: buffer.length, width, height });
}
const missing = await fetch(new URL("/not-a-human-device", base)); assert.equal(missing.status, 404); rows.push({ path: "/not-a-human-device", status: 404 });
const robots = await (await fetch(new URL("/robots.txt", base))).text();
const sitemap = await (await fetch(new URL("/sitemap.xml", base))).text();
assert.ok(!robots.includes("localhost") && !sitemap.includes("localhost"));
assert.ok(robots.includes("Disallow: /")); // This local release candidate intentionally has no public domain configured.
writeFileSync("docs/qa/phase-6/http-smoke.json", JSON.stringify({ base, rows, robots, sitemap, status: "passed" }, null, 2) + "\n");
console.log(`HTTP integration passed: ${rows.length} routes/assets, security headers, unpublished robots and sitemap.`);
