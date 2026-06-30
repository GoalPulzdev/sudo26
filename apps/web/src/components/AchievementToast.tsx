"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENT_DEFS, type AchievementDef } from "@/lib/achievements";

interface Toast {
  id: number;
  def: AchievementDef;
}

let toastCounter = 0;
type ToastListener = (key: string) => void;
const listeners = new Set<ToastListener>();

/** Call this from anywhere to trigger an achievement toast. */
export function triggerAchievementToast(key: string) {
  listeners.forEach((fn) => fn(key));
}

export default function AchievementToastContainer(): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handle: ToastListener = (key) => {
      const def = ACHIEVEMENT_DEFS.find((d) => d.key === key);
      if (!def) return;
      const id = ++toastCounter;
      setToasts((prev) => [...prev, { id, def }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    listeners.add(handle);
    return () => { listeners.delete(handle); };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-none"
      style={{ width: "min(calc(100vw - 32px), 360px)" }}>
      <AnimatePresence>
        {toasts.map(({ id, def }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--border-2)",
              boxShadow: "0 8px 32px rgba(58,74,102,0.22), var(--shadow)",
            }}
          >
            <span className="text-2xl flex-shrink-0">{def.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black" style={{ color: "var(--accent)" }}>Achievement unlåst!</p>
              <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{def.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{def.desc}</p>
            </div>
            <span className="text-lg flex-shrink-0">✨</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
