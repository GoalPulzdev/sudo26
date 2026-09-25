"use client";

import { useEffect, useState } from "react";

/**
 * False during SSR and the hydration render, true after mount. Persisted
 * stores read their pre-hydration initial state until then, so UI that
 * depends on saved data (or on the clock) should wait for this.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
