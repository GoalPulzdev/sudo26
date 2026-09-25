import type { Metadata } from "next";
import type React from "react";
import { decodeReplay, formatClock, levelName, puzzleFromRef } from "@sudoku-2026/core";
import DuelGame from "./DuelGame";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const replay = decodeReplay(code);
  if (!replay) return { title: "Sudoku 2026" };
  const who = replay.name ?? "En venn";
  const level = puzzleFromRef(replay.puzzle).rating?.label;
  const title = `${who} utfordrer deg · Sudoku 2026`;
  const description = `Slå ${formatClock(replay.elapsed)} på ${level ? `et ${levelName(level).toLowerCase()}` : "samme"} brett — du spiller mot spøkelset.`;
  const image = { url: `/duel/${code}/card.png`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function DuelPage({ params }: Props): Promise<React.ReactElement> {
  const { code } = await params;
  return <DuelGame code={code} />;
}
