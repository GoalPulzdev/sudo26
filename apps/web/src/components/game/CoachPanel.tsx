"use client";

import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TECHNIQUE_INFO, cellName } from "@sudoku-2026/core";
import type { CoachView } from "@/lib/useCoach";
import { Rich } from "@/lib/rich";

interface CoachPanelProps {
  view: CoachView | null;
  missingNotes: number[];
  onExplain: () => void;
  onAct: () => void;
  onClose: () => void;
}

const GOLD = "#bf9c45";

/** The coach's voice: nudge → reasoning → action, above the board. */
export default function CoachPanel({ view, missingNotes, onExplain, onAct, onClose }: CoachPanelProps): React.ReactElement {
  return (
    <AnimatePresence>
      {view && (
        <motion.section
          key="coach"
          aria-live="polite"
          aria-label="Coach"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{
            width: "min(92vw, 480px)",
            background: "var(--surface)",
            border: "1.5px solid rgba(191,156,69,0.45)",
            boxShadow: "0 6px 24px rgba(191,156,69,0.14), var(--shadow-sm)",
          }}
        >
          <div className="px-4 pt-3 pb-3.5 flex flex-col gap-2.5">
            <Header view={view} onClose={onClose} />
            <Body view={view} />
            {missingNotes.length > 0 && view.kind !== "issues" && (
              <p className="text-xs leading-snug" style={{ color: "var(--error)" }}>
                Obs: notatene i {missingNotes.slice(0, 3).map(cellName).join(", ")}
                {missingNotes.length > 3 ? " m.fl." : ""} utelukker det riktige sifferet.
              </p>
            )}
            <Actions view={view} onExplain={onExplain} onAct={onAct} />
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Header({ view, onClose }: { view: CoachView; onClose: () => void }) {
  const label =
    view.kind === "issues"
      ? "Feil på brettet"
      : view.kind === "reveal"
      ? "Utover coachens teknikker"
      : TECHNIQUE_INFO[view.step.technique].name;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: GOLD }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} aria-hidden="true" />
        Coach
        <span className="font-semibold normal-case tracking-normal text-xs" style={{ color: "var(--text-muted)" }}>
          · {view.kind === "step" && view.level === 1 ? "Hvor du bør se" : label}
        </span>
      </p>
      <div className="flex items-center gap-2">
        {view.kind === "step" && view.total > 1 && (
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: "var(--accent-2-light)", color: "var(--text-muted)" }}
          >
            Steg {view.index + 1}/{view.total}
          </span>
        )}
        <button
          onClick={onClose}
          aria-label="Lukk coach"
          className="w-6 h-6 flex items-center justify-center rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ color: "var(--text)", background: "rgba(0,0,0,0.05)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Body({ view }: { view: CoachView }) {
  const text = (() => {
    if (view.kind === "issues") {
      return view.wrong.length === 1
        ? `**${cellName(view.wrong[0])}** har feil siffer (**${view.wrongValues[0]}**). Rett det opp før vi går videre.`
        : `**${view.wrong.length} ruter** har feil siffer. Rett dem opp før vi går videre.`;
    }
    if (view.kind === "reveal") {
      return view.level === 1
        ? "Brettet krever nå teknikker utover det coachen kan forklare. Se på den markerte boksen."
        : `Her må det prøving og feiling til. Svaret i **${cellName(view.cell)}** er **${view.value}**.`;
    }
    if (view.level === 1) return view.step.nudge;
    if (view.total > 1 && view.index < view.total - 1) {
      return `${view.step.explanation} Det åpner for neste steg.`;
    }
    return view.step.explanation;
  })();

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
        <Rich text={text} />
      </p>
      {view.kind === "step" && view.level === 2 && (
        <p className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
          {TECHNIQUE_INFO[view.step.technique].summary}
        </p>
      )}
    </div>
  );
}

function Actions({ view, onExplain, onAct }: { view: CoachView; onExplain: () => void; onAct: () => void }) {
  let primary: { label: string; onClick: () => void };

  if (view.kind === "issues") {
    primary = { label: view.wrong.length === 1 ? "Fjern feilen" : "Fjern feilene", onClick: onAct };
  } else if (view.level === 1) {
    primary = { label: "Vis hvorfor", onClick: onExplain };
  } else if (view.kind === "reveal") {
    primary = { label: `Sett inn ${view.value}`, onClick: onAct };
  } else if (view.step.placement) {
    primary = { label: `Sett inn ${view.step.placement.value}`, onClick: onAct };
  } else {
    primary = { label: "Neste steg →", onClick: onAct };
  }

  return (
    <div className="flex justify-end">
      <CoachButton {...primary} />
    </div>
  );
}

function CoachButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
      style={{ background: "var(--gradient-brand)", color: "#fff", boxShadow: "0 3px 12px rgba(58,74,102,0.25)" }}
    >
      {label}
    </motion.button>
  );
}
