import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Noto_Sans_KR, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
// Client Component SSR의 `.suspend()` queryFn이 Server Function을 같은 요청 scope로 실행하게 한다.
import "@/lib/server-action/ssr-bridge";
import { RootLayout } from "@/lib/layout";
import { AppVersionGuard } from "@/lib/components/app-version-guard";
import { ServiceWorkerRegister } from "@/lib/components/service-worker-register";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
});

// Set maximum execution time for server actions and routes (5 minutes)
export const maxDuration = 300;

// Viewport settings - prevent zoom on mobile input focus
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * SEO & Open Graph Metadata
 *
 * TODO: 서비스에 맞게 title/description 을 채우고, 필요하면 og 이미지를 추가하세요.
 * metadataBase와 서비스별 값은 SEO 설정 단계에서 추가합니다. 기본 메타데이터는
 * Cache Components가 정적 App Shell에 포함할 수 있도록 요청 데이터에 의존하지 않습니다.
 */
export const metadata: Metadata = {
  title: {
    default: "App",
    template: "%s | App", // Page titles will be "Page Title | App"
  },
  description: "",
  manifest: "/manifest.webmanifest",

  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "App",
    description: "",
    siteName: "App",
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "App",
    description: "",
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendard.variable} ${notoSansKr.variable} ${notoSansMono.variable} antialiased`}
      >
        <RootLayout>
          {/* 전역 동적 경계 — 서비스 레이아웃·페이지가 요청 시점 데이터를 읽어도 정적 셸이 깨지지 않게 한다. */}
          <Suspense fallback={null}>{children}</Suspense>
        </RootLayout>
        <AppVersionGuard />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
