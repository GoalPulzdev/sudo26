import type { Metadata } from "next";
import type React from "react";
import { notFound } from "next/navigation";
import { RANK_TITLES, decodeDailyResult, levelName } from "@sudoku-2026/core";
import { dailyDateLabel, formatClock } from "@/lib/dailyFormat";
import ResultCard from "@/components/daily/ResultCard";
import ChallengeCta from "./ChallengeCta";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const r = decodeDailyResult(code);
  if (!r) return { title: "Sudoku 2026" };
  const who = r.name ?? "En spiller";
  const title = `${RANK_TITLES[r.titleId].name} · ${formatClock(r.elapsed)} · Sudoku 2026`;
  const description = `${who} løste ${dailyDateLabel(r.date).toLowerCase()} (${levelName(r.level).toLowerCase()}) på ${formatClock(
    r.elapsed
  )}. Klarer du å slå det?`;
  const image = { url: `/d/${code}/card.png`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function SharedResultPage({ params }: Props): Promise<React.ReactElement> {
  const { code } = await params;
  const result = decodeDailyResult(code);
  if (!result) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--accent-2)" }}>
            Utfordring
          </p>
          <h1 className="text-2xl font-black tracking-tight mt-1" style={{ color: "var(--text)" }}>
            {result.name ?? "Noen"} løste {weekdayGenitive(result.date)} brett på {formatClock(result.elapsed)}
          </h1>
        </div>
        <ResultCard result={result} />
        <ChallengeCta result={result} code={code} />
      </div>
    </main>
  );
}

/** "fredagens" — every Norwegian weekday takes -ens. */
function weekdayGenitive(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString("nb-NO", { weekday: "long", timeZone: "UTC" });
  return `${weekday}ens`;
}
