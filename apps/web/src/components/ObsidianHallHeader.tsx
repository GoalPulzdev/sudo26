"use client";

import type React from "react";
import Link from "next/link";

interface ObsidianHallHeaderProps {
  chapter: string;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

/** Shared editorial page hero for the Obsidian player-facing account screens. */
export default function ObsidianHallHeader({
  chapter,
  eyebrow,
  title,
  description,
  children,
}: ObsidianHallHeaderProps): React.ReactElement {
  return (
    <header className="obsidian-hall-header w-full">
      <nav className="obsidian-hall-nav" aria-label="Kontonavigasjon">
        <Link href="/" className="obsidian-hall-wordmark" aria-label="Tilbake til Sudoku 26">
          <span aria-hidden="true">◈</span> SUDOKU<span>26</span>
        </Link>
        <div className="obsidian-hall-nav-links">
          <Link href="/stats">Statistikk</Link>
          <Link href="/leaderboard">Rekorder</Link>
          <Link href="/profile">Profil</Link>
        </div>
      </nav>

      <div className="obsidian-hall-title-wrap">
        <div className="obsidian-hall-title-block">
          <span className="obsidian-hall-eyebrow">
            <span className="obsidian-status-dot" aria-hidden="true" />
            {chapter} <span aria-hidden="true">/</span> {eyebrow}
          </span>
          <h1 className="obsidian-hall-title">{title}</h1>
          <p className="obsidian-hall-description">{description}</p>
        </div>
        {children && <div className="obsidian-hall-title-side">{children}</div>}
      </div>
    </header>
  );
}
