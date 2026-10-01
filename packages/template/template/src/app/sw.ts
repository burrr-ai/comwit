/// <reference lib="webworker" />

import type {
  PrecacheEntry,
  SerwistGlobalConfig,
  SerwistPlugin,
} from "serwist";
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";

import { cacheableDocument } from "../lib/service-worker";

declare const __APP_VERSION__: string;

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_VERSION = __APP_VERSION__;
const CACHE_NAMESPACE = `app-${APP_VERSION}`;
const STATIC_RSC_STALE_SECONDS = 365 * 24 * 60 * 60;
const OFFLINE_URL = "/offline";
const DYNAMIC_PREFIXES = [
  "/api/",
  "/app/api/",
  "/admin/api/",
];
const STATIC_ASSET_EXTENSIONS =
  /\.(?:css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|webmanifest)$/i;

function hasDynamicPrefix(pathname: string) {
  return DYNAMIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStaticAsset(request: Request, url: URL) {
  if (hasDynamicPrefix(url.pathname)) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/_next/image")) return true;
  if (STATIC_ASSET_EXTENSIONS.test(url.pathname)) return true;

  return ["font", "image", "manifest", "script", "style", "worker"].includes(
    request.destination,
  );
}

function hasPrivateCacheControl(response: Response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  return /(?:^|,)\s*(?:no-store|private)\b/i.test(cacheControl);
}

const cacheSuccessfulResponse: SerwistPlugin = {
  async cacheWillUpdate({ response }) {
    return response.status === 200 ? response : null;
  },
};

const cachePublicResponse: SerwistPlugin = {
  async cacheWillUpdate({ response }) {
    if (response.status !== 200 || hasPrivateCacheControl(response)) return null;
    return response;
  },
};

const cacheStaticDocumentResponse: SerwistPlugin = {
  cacheWillUpdate: ({ response }) => cacheableDocument(response),
};

const cacheStaticRscResponse: SerwistPlugin = {
  async cacheWillUpdate({ request, response }) {
    if (response.status !== 200 || hasPrivateCacheControl(response)) return null;
    if (!(response.headers.get("content-type") ?? "").startsWith("text/x-component")) {
      return null;
    }

    // Cache Components route-tree prefetches are deployment-pinned static RSC,
    // but they do not include x-nextjs-stale-time. Detect that special shell.
    if (request.headers.get("next-router-segment-prefetch") === "/_tree") {
      return response;
    }

    const staleSeconds = Number(response.headers.get("x-nextjs-stale-time"));
    return Number.isFinite(staleSeconds) && staleSeconds >= STATIC_RSC_STALE_SECONDS
      ? response
      : null;
  },
};

const normalizeRscCacheKey: SerwistPlugin = {
  async cacheKeyWillBeUsed({ request }) {
    const url = new URL(request.url);
    url.searchParams.delete("_rsc");
    // Preserve Next's Vary-based router distinctions while removing the
    // transport-only salt that changes on otherwise identical RSC requests.
    return new Request(url, request);
  },
};

const staticAssets = new CacheFirst({
  cacheName: `${CACHE_NAMESPACE}-assets`,
  plugins: [cacheSuccessfulResponse],
});
const staticRsc = new CacheFirst({
  cacheName: `${CACHE_NAMESPACE}-static-rsc`,
  plugins: [normalizeRscCacheKey, cacheStaticRscResponse],
});
const staticDocuments = new CacheFirst({
  cacheName: `${CACHE_NAMESPACE}-documents`,
  plugins: [cacheStaticDocumentResponse],
});
const dynamicRsc = new NetworkFirst({
  cacheName: `${CACHE_NAMESPACE}-dynamic-rsc`,
  networkTimeoutSeconds: 4,
  plugins: [normalizeRscCacheKey, cachePublicResponse],
});
const dynamicRequests = new NetworkFirst({
  cacheName: `${CACHE_NAMESPACE}-dynamic`,
  networkTimeoutSeconds: 4,
  plugins: [cachePublicResponse],
});

const serwist = new Serwist({
  cacheId: CACHE_NAMESPACE,
  precacheEntries: [
    { url: OFFLINE_URL, revision: APP_VERSION },
    { url: "/manifest.webmanifest", revision: APP_VERSION },
    { url: "/favicon.ico", revision: APP_VERSION },
  ],
  precacheOptions: {
    cacheName: `${CACHE_NAMESPACE}-precache`,
    cleanupOutdatedCaches: true,
  },
  // The registration component promotes an installed worker and reloads once
  // on controllerchange so HTML, client bundles, and SW versions stay aligned.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin &&
        (url.pathname === "/sw.js" || url.pathname === "/version.json"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin && isStaticAsset(request, url),
      handler: staticAssets,
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        !hasDynamicPrefix(url.pathname) &&
        request.headers.get("rsc") === "1" &&
        // Include normal, runtime, and app-shell Cache Components prefetches.
        // The response plugin decides which ones qualify for persistent cache.
        request.headers.has("next-router-prefetch"),
      handler: staticRsc,
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        !hasDynamicPrefix(url.pathname) &&
        request.headers.get("rsc") === "1",
      handler: dynamicRsc,
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        !hasDynamicPrefix(url.pathname) &&
        (request.mode === "navigate" || request.destination === "document"),
      handler: staticDocuments,
    },
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/api/auth/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ sameOrigin }) => sameOrigin,
      handler: dynamicRequests,
    },
    {
      matcher: ({ sameOrigin }) => !sameOrigin,
      handler: new NetworkFirst({
        cacheName: `${CACHE_NAMESPACE}-cross-origin`,
        networkTimeoutSeconds: 4,
        plugins: [cachePublicResponse],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: OFFLINE_URL,
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Remove caches created by older hand-written or Serwist workers after a new
// deployment version activates.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith("app-") &&
              !cacheName.startsWith(`${CACHE_NAMESPACE}-`),
          )
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );
});

// Backward-compatible with the message used by the previous registration code.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") void self.skipWaiting();
});

// Focus a matching app window when a push notification is clicked, or open the
// target path in a new window when there is no matching client.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: unknown } | undefined;
  const targetUrl = typeof data?.url === "string" ? data.url : "/";

  let targetPath = "/";
  try {
    targetPath = new URL(targetUrl, self.location.origin).pathname;
  } catch {
    targetPath = "/";
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        try {
          if (new URL(client.url).pathname === targetPath) {
            await client.focus();
            return;
          }
        } catch {
          // Ignore clients with unreadable URLs such as about:blank.
        }
      }

      if (self.clients.openWindow) {
        try {
          await self.clients.openWindow(targetUrl);
          return;
        } catch {
          // Fall back to an existing client if a new window cannot be opened.
        }
      }

      for (const client of windows) {
        try {
          await client.focus();
          await client.navigate(targetUrl);
          return;
        } catch {
          // Try the next available client.
        }
      }
    })(),
  );
});
