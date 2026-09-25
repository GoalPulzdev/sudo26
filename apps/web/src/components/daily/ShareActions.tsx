"use client";

import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { RANK_TITLES, dailyShareText } from "@sudoku-2026/core";
import type { StoredDaily } from "@/store/dailyStore";

type Status = "idle" | "working" | "shared" | "copied-text" | "copied-link" | "error";

/**
 * Share a daily result. On phones that can share files, the card image goes
 * along with the text; otherwise the text (with link) is shared or copied.
 */
export default function ShareActions({ stored }: { stored: StoredDaily }): React.ReactElement {
  const [status, setStatus] = useState<Status>("idle");
  const path = `/d/${stored.code}`;

  function flash(s: Status) {
    setStatus(s);
    setTimeout(() => setStatus("idle"), 2200);
  }

  const url = () => `${window.location.origin}${path}`;
  const text = (withUrl: boolean) =>
    dailyShareText(stored.result, RANK_TITLES[stored.result.titleId].name, withUrl ? url() : undefined);

  async function share() {
    setStatus("working");
    try {
      if (typeof navigator.share === "function") {
        const file = await cardFile(`${path}/card.png`);
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: text(false), url: url() });
        } else {
          await navigator.share({ text: text(false), url: url() });
        }
        flash("shared");
      } else {
        await navigator.clipboard.writeText(text(true));
        flash("copied-text");
      }
    } catch (e) {
      // AbortError = the user closed the share sheet; not an error worth showing.
      if (e instanceof DOMException && e.name === "AbortError") setStatus("idle");
      else flash("error");
    }
  }

  async function copy(kind: "text" | "link") {
    try {
      await navigator.clipboard.writeText(kind === "text" ? text(true) : url());
      flash(kind === "text" ? "copied-text" : "copied-link");
    } catch {
      flash("error");
    }
  }

  const primaryLabel =
    status === "working"
      ? "Lager kort…"
      : status === "shared"
      ? "✓ Delt"
      : status === "copied-text"
      ? "✓ Resultat kopiert"
      : status === "error"
      ? "Kunne ikke dele"
      : "Del resultatet";

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.button
        onClick={() => void share()}
        whileTap={{ scale: 0.97 }}
        disabled={status === "working"}
        className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest cursor-pointer"
        style={{
          background: status === "shared" || status === "copied-text" ? "linear-gradient(135deg,#5f8a6a,#4f7a5c)" : "var(--gradient-brand)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(58,74,102,0.3)",
        }}
      >
        {primaryLabel}
      </motion.button>
      <div className="grid grid-cols-2 gap-2">
        <SecondaryButton onClick={() => void copy("text")} label={status === "copied-text" ? "✓ Kopiert" : "Kopier tekst"} />
        <SecondaryButton onClick={() => void copy("link")} label={status === "copied-link" ? "✓ Kopiert" : "Kopier lenke"} />
      </div>
    </div>
  );
}

function SecondaryButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
      style={{ background: "var(--surface-2)", color: "var(--text)", border: "1.5px solid var(--border-2)" }}
    >
      {label}
    </motion.button>
  );
}

async function cardFile(src: string): Promise<File | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], "sudoku-daglig.png", { type: "image/png" });
  } catch {
    return null;
  }
}
