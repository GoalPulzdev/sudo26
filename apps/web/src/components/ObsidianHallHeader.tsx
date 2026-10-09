"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
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
      <nav className="obsidian-hall-mobile-tabs" aria-label="Hovedmeny mobil">
        {[
          { href: "/", label: "Spill", glyph: "⌂" },
          { href: "/stats", label: "Statistikk", glyph: "▥" },
          { href: "/leaderboard", label: "Rekorder", glyph: "✦" },
          { href: "/profile", label: "Profil", glyph: "◉" },
        ].map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={pathname === item.href ? "is-active" : ""}>
            <span aria-hidden="true">{item.glyph}</span>
            <small>{item.label}</small>
          </Link>
        ))}
      </nav>
    </header>
  );
}
