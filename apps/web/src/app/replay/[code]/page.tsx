import type { Metadata } from "next";
import type React from "react";
import { decodeReplay, formatClock } from "@sudoku-2026/core";
import ReplayPlayer from "./ReplayPlayer";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const replay = decodeReplay(code);
  if (!replay) return { title: "Sudoku 2026" };
  const title = `Replay: ${replay.name ?? "et parti"} på ${formatClock(replay.elapsed)} · Sudoku 2026`;
  const description = "Se hele partiet trekk for trekk — og spill mot spøkelset etterpå.";
  const image = { url: `/duel/${code}/card.png`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function ReplayPage({ params }: Props): Promise<React.ReactElement> {
  const { code } = await params;
  return <ReplayPlayer code={code} />;
}
