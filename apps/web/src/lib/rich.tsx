import type React from "react";

/**
 * Render engine text where `**x**` marks emphasis — without innerHTML, so the
 * text can never inject markup.
 */
export function Rich({ text, strongColor }: { text: string; strongColor?: string }): React.ReactElement {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} style={{ color: strongColor ?? "var(--text)", fontWeight: 800 }}>
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
