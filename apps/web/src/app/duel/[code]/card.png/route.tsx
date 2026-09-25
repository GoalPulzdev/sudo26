import { ImageResponse } from "next/og";
import { decodeReplay, ghostTimeline, puzzleFromRef } from "@sudoku-2026/core";
import { DuelCardImage } from "@/lib/og/DuelCardImage";
import { ogFonts } from "@/lib/og/fonts";

/** PNG share card for duel and replay links. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  const { code } = await params;
  const replay = decodeReplay(code);
  if (!replay) return new Response("Ukjent duell", { status: 404 });
  const puzzle = puzzleFromRef(replay.puzzle);
  const timeline = ghostTimeline(replay, puzzle.clues, puzzle.solution);
  const fonts = await ogFonts();
  return new ImageResponse(<DuelCardImage replay={replay} timeline={timeline} level={puzzle.rating?.label} />, {
    width: 1200,
    height: 630,
    ...(fonts.length > 0 ? { fonts } : {}),
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
