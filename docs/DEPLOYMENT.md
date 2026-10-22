# 部署 / Deployment

项目目前可本地运行，尚未部署到公开站点。<br>
The project runs locally and is not hosted yet.

```sh
npm ci
npm run build
npm run start -- --port 3127
```

Node.js 24；默认只监听127.0.0.1。Vercel使用仓库根目录和现有 `vercel.json`。<br>
Use Node.js 24. The local server binds to 127.0.0.1. For Vercel, use the repository root and the included `vercel.json`.

将实际HTTPS根地址设为 `NEXT_PUBLIC_SITE_URL` 后重新构建；留空时保持noindex，不生成假公网链接。<br>
Set `NEXT_PUBLIC_SITE_URL` to your real HTTPS origin and rebuild. Leaving it empty keeps the site unindexed without inventing public URLs.

正式上线前仍需真机/内置浏览器、全部海报变体和性能复验。开发工具链有5条既有high依赖通报；最近生产依赖审计为0条。<br>
Before launch, finish real-device/in-app-browser checks, full poster coverage and performance verification. Five high-severity development dependency advisories remain; the latest production-only audit reported none.
