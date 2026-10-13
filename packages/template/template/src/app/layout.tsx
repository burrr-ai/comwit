import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Noto_Sans_KR, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
// Let Client Component SSR .suspend() queryFn execute Server Functions in the same request scope.
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
 * TODO: Set the service title/description and add an OG image when needed.
 * Add metadataBase and service-specific values during SEO setup. Basic metadata
 * does not depend on request data, so Cache Components can include it in the static app shell.
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
          {/* Global dynamic boundary: let service layouts/pages read request data without breaking the static shell. */}
          <Suspense fallback={null}>{children}</Suspense>
        </RootLayout>
        <AppVersionGuard />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
