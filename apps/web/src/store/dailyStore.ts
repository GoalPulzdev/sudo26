"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DailyResult } from "@sudoku-2026/core";
import { encodeDailyResult } from "@sudoku-2026/core";

export interface StoredDaily {
  result: DailyResult;
  /** Share code for `/d/<code>`. */
  code: string;
}

interface DailyStore {
  /** First completion per date (YYYY-MM-DD). Replays never overwrite it. */
  results: Record<string, StoredDaily>;
  record: (result: DailyResult) => StoredDaily;
}

export const useDailyStore = create<DailyStore>()(
  persist(
    (set, get) => ({
      results: {},
      record: (result) => {
        const existing = get().results[result.date];
        if (existing) return existing;
        const entry = { result, code: encodeDailyResult(result) };
        set((s) => ({ results: { ...s.results, [result.date]: entry } }));
        return entry;
      },
    }),
    {
      name: "sudoku-daily-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : window.localStorage
      ),
    }
  )
);
