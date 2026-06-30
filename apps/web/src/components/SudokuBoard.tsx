"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Board, CellValue } from "@sudoku-2026/core";
import clsx from "clsx";

interface SudokuBoardProps {
  board: Board;
  selectedCell: [number, number] | null;
  onCellClick: (row: number, col: number) => void;
  hintCell?: [number, number] | null;
}

export default function SudokuBoard({ board, selectedCell, onCellClick, hintCell }: SudokuBoardProps): React.ReactElement {
  const selVal = selectedCell ? board[selectedCell[0]][selectedCell[1]].value : 0;

  return (
    <div
      className="relative select-none"
      style={{ width: "min(92vw, 480px)", aspectRatio: "1" }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-[18px] pointer-events-none"
        style={{ boxShadow: "0 0 0 2px rgba(109,40,217,0.25), var(--shadow-lg)" }}
      />

      <div
        className="relative w-full h-full rounded-[14px] overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(9, 1fr)",
          background: "var(--surface)",
          border: "2.5px solid var(--box-border)",
          boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(109,40,217,0.05)",
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected  = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isHint      = hintCell?.[0] === r && hintCell?.[1] === c;
            const isSameValue = !isSelected && selVal !== 0 && cell.value === selVal;
            const isPeer      = !isSelected && cell.highlighted;

            const borderRight =
              c === 2 || c === 5 ? "2.5px solid var(--box-border)"
              : c === 8          ? "none"
              :                    "1px solid var(--border)";
            const borderBottom =
              r === 2 || r === 5 ? "2.5px solid var(--box-border)"
              : r === 8          ? "none"
              :                    "1px solid var(--border)";

            return (
              <motion.button
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 700, damping: 25 }}
                style={{
                  borderRight,
                  borderBottom,
                  background: "transparent",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
                className={clsx(
                  "relative flex items-center justify-center font-bold cursor-pointer",
                  "focus:outline-none",
                  "text-base sm:text-lg"
                )}
              >
                {/* Cell fills */}
                {isSelected && (
                  <span className="absolute inset-0"
                    style={{
                      background: "rgba(58,74,102,0.18)",
                      boxShadow: "inset 0 0 0 2px rgba(58,74,102,0.55)",
                    }}
                  />
                )}
                {isSameValue && (
                  <span className="absolute inset-0"
                    style={{ background: "rgba(58,107,115,0.13)" }}
                  />
                )}
                {isPeer && !isSameValue && (
                  <span className="absolute inset-0"
                    style={{ background: "rgba(58,74,102,0.07)" }}
                  />
                )}
                {isHint && (
                  <motion.span
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ boxShadow: "inset 0 0 0 2.5px #bf9c45" }}
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="absolute inset-0" style={{ background: "rgba(224,200,115,0.22)" }} />
                  </motion.span>
                )}

                {/* Value */}
                <AnimatePresence mode="wait">
                  {cell.value !== 0 ? (
                    <motion.span
                      key={`v-${cell.value}-${r}-${c}`}
                      initial={{ scale: 0.35, opacity: 0 }}
                      animate={{ scale: 1,    opacity: 1 }}
                      exit={{   scale: 0.35, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 700, damping: 22 }}
                      className={clsx(
                        "relative z-10 tabular-nums",
                        cell.error
                          ? "text-[var(--error)]"
                          : cell.given
                          ? "text-[var(--given)] font-extrabold"
                          : "text-[var(--player)]",
                      )}
                    >
                      {cell.value}
                    </motion.span>
                  ) : cell.notes.size > 0 ? (
                    <NoteGrid notes={cell.notes} />
                  ) : null}
                </AnimatePresence>

                {/* Error flash */}
                {cell.error && (
                  <motion.span
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{ background: "rgba(180,85,74,0.18)" }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.55 }}
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

function NoteGrid({ notes }: { notes: Set<CellValue> }) {
  return (
    <div className="relative z-10 grid grid-cols-3 w-full h-full p-[2px]">
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[]).map((n) => (
        <span
          key={n}
          className="flex items-center justify-center leading-none font-semibold"
          style={{
            fontSize: "clamp(6px, 1.6vw, 9px)",
            color: notes.has(n) ? "#2c3a4f" : "transparent",
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}