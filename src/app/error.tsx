"use client";
import Link from "next/link";
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main id="main" className="error-page">
      <span className="eyebrow">HUM / 临时检修</span>
      <h1>这一页暂时卡纸了。</h1>
      <p>页面没能正常展开。可以重试一次，或返回首页继续。</p>
      <div>
        <button className="button-primary" type="button" onClick={retry}>
          重新打开这一页 ↻
        </button>
        <Link className="text-link" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}
