import { ImageResponse } from "next/og";
import { decodeDailyResult } from "@sudoku-2026/core";
import { DailyCardImage } from "@/lib/og/DailyCardImage";
import { ogFonts } from "@/lib/og/fonts";

/** PNG share card for `/d/<code>` — link previews and the native share sheet. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  const { code } = await params;
  const result = decodeDailyResult(code);
  if (!result) return new Response("Ukjent resultat", { status: 404 });
  const fonts = await ogFonts();
  return new ImageResponse(<DailyCardImage r={result} />, {
    width: 1200,
    height: 630,
    ...(fonts.length > 0 ? { fonts } : {}),
    // The code fully determines the image.
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
