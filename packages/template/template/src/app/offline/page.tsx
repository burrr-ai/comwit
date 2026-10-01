import type { Metadata } from "next";

// The service worker precaches this page. Inline styles and fallbacks keep it
// readable even when no CSS asset is available yet.
export const metadata: Metadata = {
  title: "오프라인",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        background: "var(--background, #ffffff)",
        color: "var(--foreground, #1d1d1f)",
      }}
    >
      <img
        decoding="sync"
        src="/favicon.ico"
        alt=""
        aria-hidden
        width={48}
        height={48}
      />
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
        인터넷 연결이 끊겼어요
      </h1>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--muted-foreground, #6e6e73)",
          margin: 0,
          maxWidth: 320,
        }}
      >
        네트워크가 돌아오면 다시 시도해 주세요. 연결되면 앱이 바로 켜집니다.
      </p>
    </main>
  );
}
