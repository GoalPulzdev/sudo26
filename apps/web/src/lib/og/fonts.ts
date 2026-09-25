/**
 * Fonts for share images. Satori (next/og) needs TTF/OTF, and next/og only
 * bundles Noto Sans Regular — so fetch Inter from Google Fonts once per server
 * instance. Asking without a browser user agent makes Google serve TrueType.
 * Any failure (offline, timeout) falls back to the bundled font.
 */

type OgFont = { name: string; data: ArrayBuffer; weight: 600 | 800; style: "normal" };

let cached: Promise<OgFont[]> | null = null;

async function load(weight: 600 | 800): Promise<OgFont> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, { signal: AbortSignal.timeout(2500) })
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error("no truetype source");
  const data = await (await fetch(url, { signal: AbortSignal.timeout(2500) })).arrayBuffer();
  return { name: "Inter", data, weight, style: "normal" };
}

export function ogFonts(): Promise<OgFont[]> {
  cached ??= Promise.all([load(600), load(800)]).catch(() => {
    cached = null; // retry on a later request
    return [];
  });
  return cached;
}
