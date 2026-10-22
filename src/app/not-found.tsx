import Link from "next/link";
import { Header, Footer } from "@/components/brand";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="missing-page">
        <span className="eyebrow">ERROR 404 / 未收录的档案</span>
        <h1>
          这页被工程师，
          <br />
          拿去垫泡面了。
        </h1>
        <p>当前地址没有对应页面。已有的设备档案都在这里。</p>
        <Link className="button-primary" href="/">
          返回厂家首页 ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
