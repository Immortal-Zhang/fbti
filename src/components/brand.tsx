import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="你哪个厂的？首页">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="16" fill="#254bfa" />
          <path
            d="M16 15v34m32-34v34M16 32h32"
            stroke="#f6f3e9"
            strokeWidth="10"
          />
          <circle cx="32" cy="17" r="4" fill="#d8f76b" />
        </svg>
      </span>
      <span>
        你哪个厂的？<small>HUMAN USER MANUAL</small>
      </span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="主要导航">
        <Link href="/devices">
          设备图鉴 <span>16</span>
        </Link>
        <Link href="/quiz">开始检测</Link>
        <Link href="/#system" className="nav-system">
          系统说明 ↗
        </Link>
      </nav>
      <span className="build-label">
        <i /> 非标批次 03
      </span>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <Brand />
      <div>
        <p>人类非标制造有限公司 · 品控在场，但不一定有用。</p>
        <p className="muted">
          虚构公司，原创娱乐。所有认证均属剧情道具，不用于心理诊断或科学人格测量。
        </p>
      </div>
      <Link href="/privacy" className="footer-privacy">
        隐私与使用须知 ↗
      </Link>
      <span className="mono">
        HUM / V0.6.0
        <br />
        PERSONAL EDITION
      </span>
    </footer>
  );
}
