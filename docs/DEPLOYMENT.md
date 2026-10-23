# 部署 / Deployment

[打开 FBTI / Open FBTI](https://immortal-zhang.github.io/fbti/)

GitHub Pages托管静态导出。main更新后，GitHub Actions先检查再发布；状态见仓库Actions。无需服务器、数据库或API密钥。  
GitHub Pages hosts the static export. Updates to main trigger checks and deployment through GitHub Actions. No server, database or API keys are required.

构建配置 / Build environment:

```sh
FBTI_STATIC_EXPORT=1 \
NEXT_PUBLIC_BASE_PATH=/fbti \
NEXT_PUBLIC_SITE_URL=https://immortal-zhang.github.io \
npm run build
```

输出为 `out/`。分享链接和页面资源自动带上 `/fbti`。不要把带路径的地址填入 `NEXT_PUBLIC_SITE_URL`；该变量只接受HTTPS根地址。  
Output is written to `out/`. Share links and assets include `/fbti`. `NEXT_PUBLIC_SITE_URL` accepts the HTTPS origin only; use `NEXT_PUBLIC_BASE_PATH` for the project path.

本机开发 / Local development:

```sh
npm ci
npm run dev -- --port 3127
```

Node.js 24。留空上述环境变量时仍可正常本地开发或使用Next.js服务器部署。GitHub Pages不能提供Next自定义响应头；服务器部署仍保留这些安全头。静态版设置no-referrer，答案与评分在浏览器内完成。  
Use Node.js 24. Leave the deployment variables unset for local development or a standard Next.js server. GitHub Pages cannot apply Next.js custom response headers; server deployments retain them. The static site uses no-referrer, with answers and scoring handled in the browser.

仍需真机/内置浏览器和全部海报变体验收；开发工具链5条既有high依赖通报保留待处理。  
Real-device/in-app-browser checks and full poster coverage remain pending, along with five existing high-severity development dependency advisories.
