import { routeMetadata } from "@/lib/metadata";
import Link from "next/link";
import { Header, Footer } from "@/components/brand";
import { Catalog } from "@/components/catalog";

export const metadata = routeMetadata("人类设备图鉴", "/devices", false);

export default function DevicesPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="catalog-section device-archive-page">
          <Link className="text-link" href="/">
            ← 返回厂家首页
          </Link>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                THE HUMAN COLLECTION / 16 SPECIMENS
              </span>
              <h1>十六种型号，十六种离谱。</h1>
            </div>
            <p>
              这里展示可调节的虚构样本。
              <br />
              你的那一台，由自己的回答决定。
            </p>
          </div>
          <Catalog />
          <div className="archive-cta">
            <p>
              参观完别人的零件，
              <br />
              也查查自己的装法。
            </p>
            <Link className="button-primary" href="/quiz">
              检测我的出厂设置 <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/questions">
              查看完整题库 →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
