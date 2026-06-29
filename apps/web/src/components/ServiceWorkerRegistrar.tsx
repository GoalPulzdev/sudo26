"use client";

import { useEffect } from "react";

/** Registers the service worker for PWA offline support (production only) */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      } else {
        // In dev: unregister any existing SW so stale caches never block updates
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) reg.unregister();
        });
      }
    }
  }, []);

  return null;
}
