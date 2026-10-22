import Link from "next/link";
import { Header, Footer } from "@/components/brand";
import { DeviceIllustration } from "@/components/device-illustration";
import { DIMENSIONS } from "@/data/dimensions";
import { publicCopy, type PublicSelf } from "@/lib/sharing/snapshot";

export function SharedFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
export function LinkLoading() {
  return (
    <main id="main" className="release-empty release-loading" aria-busy="true">
      <span className="eyebrow">HUM / LINK READER</span>
      <h1>档案正在展开。</h1>
      <p role="status">正在核对这份链接里的公开数据。</p>
      <noscript>读取分享档案需要JavaScript，请启用后重试。</noscript>
    </main>
  );
}
export function InvalidLink() {
  return (
    <main id="main" className="release-empty">
      <span className="eyebrow">ERR. LINK / 档案无法辨认</span>
      <h1>
        这页说明书，
        <br />
        可能被折掉了一角。
      </h1>
      <p>
        链接缺失、损坏、版本不兼容，或不属于当前页面。请让朋友重新复制完整链接，保留“#”后面的内容。
      </p>
      <p>你的本机测试记录没有被改动。</p>
      <div className="release-actions">
        <Link className="button-primary" href="/quiz">
          我也要检测出厂设置 ↗
        </Link>
        <Link className="text-link" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}
export function PublicIdentity({ self }: { self: PublicSelf }) {
  const result = publicCopy(self, "moments");
  return (
    <section className="public-identity">
      <div>
        <span className="eyebrow">PUBLIC EDITION / 公开出厂摘要</span>
        <span className="mono public-model-id">{result.device.id}</span>
        <h1>{result.device.name}</h1>
        <p className="public-description">{result.description}</p>
        <ul className="public-tags" aria-label="人格关键词">
          {result.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
        <p className="fine-print">
          这是一份由20题本人自评生成的公开摘要。完整私人说明书保留在测试者自己的浏览器。
        </p>
      </div>
      <div className="public-device">
        <DeviceIllustration
          shape={result.device.shape}
          color={result.device.color}
          name={result.device.name}
        />
        <span className="mono">PUBLIC COPY / 别拍，里面有人。</span>
      </div>
      <div className="public-axes">
        {DIMENSIONS.map((dimension) => (
          <div key={dimension.id}>
            <h2>
              {dimension.name}
              <b>{self.scores[dimension.id]}</b>
            </h2>
            <meter
              min={0}
              max={100}
              value={self.scores[dimension.id]}
              aria-label={`${dimension.name} ${self.scores[dimension.id]}分`}
            />
            <p>
              {dimension.lowLabel}
              <span>{dimension.highLabel}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
