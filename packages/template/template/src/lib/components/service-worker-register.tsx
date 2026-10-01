"use client";

import { useEffect } from "react";

/**
 * Registers the production service worker after load. Development unregisters
 * old workers and removes their caches so local debugging never uses stale code.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      void disableServiceWorkerInDevelopment();
      return;
    }

    // Native app embeds have their own offline/cache behavior.
    try {
      if (window.parent !== window) return;
    } catch {
      return;
    }

    let cancelled = false;
    let cleanupRegistration: (() => void) | undefined;
    let removeLoadListener: (() => void) | undefined;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          if (cancelled) return;
          cleanupRegistration = setupServiceWorkerUpdates(registration);
        })
        .catch(() => {
          // Registration failure is non-fatal; the app continues as a normal web app.
        });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      removeLoadListener = () => window.removeEventListener("load", register);
    }

    return () => {
      cancelled = true;
      removeLoadListener?.();
      cleanupRegistration?.();
    };
  }, []);

  return null;
}

async function disableServiceWorkerInDevelopment() {
  const wasControlled = navigator.serviceWorker.controller !== null;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("app-"))
          .map((cacheName) => window.caches.delete(cacheName)),
      );
    }

    const reloadKey = "app-dev-service-worker-cleanup";
    if (!wasControlled) {
      window.sessionStorage.removeItem(reloadKey);
      return;
    }

    if (window.sessionStorage.getItem(reloadKey) !== "done") {
      window.sessionStorage.setItem(reloadKey, "done");
      window.location.reload();
    }
  } catch {
    // Development cleanup is best-effort.
  }
}

function setupServiceWorkerUpdates(registration: ServiceWorkerRegistration) {
  let shouldReloadOnControllerChange = false;
  let hasReloaded = false;
  const trackedWorkers = new WeakSet<ServiceWorker>();

  const requestUpdate = () => {
    void registration.update().catch(() => {
      // Update checks are best-effort.
    });
  };

  const promoteWaitingWorker = () => {
    const waiting = registration.waiting;
    if (!waiting || !navigator.serviceWorker.controller) return;
    shouldReloadOnControllerChange = true;
    waiting.postMessage("skip-waiting");
  };

  const trackInstallingWorker = (installing: ServiceWorker) => {
    if (trackedWorkers.has(installing)) return;
    trackedWorkers.add(installing);

    const handleStateChange = () => {
      if (installing.state !== "installed") return;
      installing.removeEventListener("statechange", handleStateChange);
      promoteWaitingWorker();
    };

    installing.addEventListener("statechange", handleStateChange);
  };

  const handleUpdateFound = () => {
    const installing = registration.installing;
    if (installing) trackInstallingWorker(installing);
  };

  const handleControllerChange = () => {
    if (!shouldReloadOnControllerChange || hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") requestUpdate();
  };

  registration.addEventListener("updatefound", handleUpdateFound);
  navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
  window.addEventListener("focus", requestUpdate);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (registration.installing) trackInstallingWorker(registration.installing);
  promoteWaitingWorker();
  requestUpdate();

  return () => {
    registration.removeEventListener("updatefound", handleUpdateFound);
    navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    window.removeEventListener("focus", requestUpdate);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
