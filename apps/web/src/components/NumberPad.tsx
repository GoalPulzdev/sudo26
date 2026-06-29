"use client";

import { motion } from "framer-motion";
import type React from "react";
import type { CellValue } from "@sudoku-2026/core";

interface NumberPadProps {
  onNumber: (value: CellValue) => void;
  onErase: () => void;
  onNote: () => void;
  onHint: () => void;
  noteMode: boolean;
}

const NUMBERS: CellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function IconBackspace() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
      <line x1="18" y1="9" x2="12" y2="15"/>
      <line x1="12" y1="9" x2="18" y2="15"/>
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="9" y1="18" x2="15" y2="18"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  );
}

export default function NumberPad({
  onNumber,
  onErase,
  onNote,
  onHint,
  noteMode,
}: NumberPadProps) {
  return (
    <div className="flex flex-col gap-3" style={{ width: "min(92vw, 480px)" }}>
      {/* Number buttons */}
      <div className="grid grid-cols-9 gap-1.5">
        {NUMBERS.map((n) => (
          <motion.button
            key={n}
            onClick={() => onNumber(n)}
            whileTap={{ scale: 0.88, y: 2 }}
            transition={{ type: "spring", stiffness: 700, damping: 22 }}
            className="key-press relative flex items-center justify-center rounded-xl
                       text-[17px] font-black cursor-pointer select-none
                       focus:outline-none"
            style={{
              aspectRatio: "3/4",
              background: "var(--surface)",
              border: "1.5px solid var(--border-2)",
              color: "var(--text)",
              boxShadow: "var(--key-shadow)",
              transition: "background 0.1s, color 0.1s, box-shadow 0.1s, border-color 0.1s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "rgba(124,58,237,0.08)";
              el.style.borderColor = "var(--accent)";
              el.style.color = "var(--accent)";
              el.style.boxShadow = "var(--key-shadow-hover)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "var(--surface)";
              el.style.borderColor = "var(--border-2)";
              el.style.color = "var(--text)";
              el.style.boxShadow = "var(--key-shadow)";
            }}
          >
            {n}
          </motion.button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <ActionBtn onClick={onErase} icon={<IconBackspace />} label="Slett"    accent="#f43f5e" />
        <ActionBtn onClick={onNote}  icon={<IconPencil />}    label={noteMode ? "Notat ON" : "Notat"} accent="#0891b2" active={noteMode} />
        <ActionBtn onClick={onHint}  icon={<IconLightbulb />} label="AI-hint"  accent="#d97706" />
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  accent,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accent: string;
  active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94, y: 1 }}
      transition={{ type: "spring", stiffness: 600, damping: 24 }}
      className="key-press flex flex-col items-center justify-center gap-1.5 py-3
                 rounded-xl cursor-pointer focus:outline-none select-none"
      style={{
        background: active ? accent + "15" : "var(--surface)",
        border: `1.5px solid ${active ? accent + "80" : "var(--border-2)"}`,
        color: active ? accent : "var(--text-muted)",
        boxShadow: active
          ? `0 3px 0 ${accent}30, 0 1px 3px rgba(0,0,0,0.06)`
          : "var(--key-shadow)",
        transition: "background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = accent + "10";
          el.style.borderColor = accent + "70";
          el.style.color = accent;
          el.style.boxShadow = `0 4px 0 ${accent}25, 0 2px 6px rgba(0,0,0,0.06)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = "var(--surface)";
          el.style.borderColor = "var(--border-2)";
          el.style.color = "var(--text-muted)";
          el.style.boxShadow = "var(--key-shadow)";
        }
      }}
    >
      {icon}
      <span className="text-[11px] font-bold tracking-wide leading-none">{label}</span>
    </motion.button>
  );
}