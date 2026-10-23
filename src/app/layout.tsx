import type { Viewport } from "next";
import "@/styles/globals.css";
import { JumpLink } from "@/components/jump-link";
import { routeMetadata } from "@/lib/metadata";

export const metadata = {
  ...routeMetadata("FBTI", "/"),
  referrer: "no-referrer" as const,
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3e9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <JumpLink className="skip-link" target="main">
          跳至主要内容
        </JumpLink>
        {children}
      </body>
    </html>
  );
}
