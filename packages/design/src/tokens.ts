/**
 * Shared design tokens — single source of truth for web and mobile.
 *
 * Web consumes these as CSS variables (see `apps/web/src/app/globals.css`, whose
 * `:root` mirrors these values). Mobile will consume them directly via
 * StyleSheet (roadmap Fase 6). Keep this file and the web `:root` block in sync.
 *
 * "Nordic premium puzzle" identity: violet brand, cyan accent, warm gold for
 * achievements, on calm light surfaces.
 */

export const colors = {
  // Surfaces
  bg: "#f5f3ff",
  bgRaised: "#ede9fe",
  surface: "#ffffff",
  surfaceRaised: "#faf9ff",

  // Borders
  border: "#e4e0f8",
  borderStrong: "#c4b5fd",
  boxBorder: "#6d28d9",

  // Brand / accent
  accent: "#7c3aed",
  accentLight: "#ede9fe",
  accent2: "#0891b2",
  accent2Light: "#e0f2fe",

  // Text
  text: "#1e1b4b",
  textMuted: "#6d64a0",
  textDim: "#a39fc8",

  // Game
  given: "#4f46e5",
  player: "#0369a1",

  // Semantic state
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
} as const;

export const radius = {
  button: "16px",
  card: "24px",
  pill: "9999px",
} as const;

export const shadow = {
  sm: "0 1px 3px rgba(79,70,229,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  card: "0 4px 16px rgba(79,70,229,0.10), 0 2px 4px rgba(0,0,0,0.04)",
  lg: "0 16px 48px rgba(79,70,229,0.14), 0 4px 12px rgba(0,0,0,0.06)",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const tokens = { colors, radius, shadow, space } as const;

export type Tokens = typeof tokens;
