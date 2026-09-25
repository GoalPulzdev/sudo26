/**
 * Small binary helpers shared by the share-link formats (results, replays):
 * base64url, strict UTF-8, date <-> day index, clamping. No Buffer/btoa/
 * TextEncoder, so they run unchanged in browsers, Node and edge runtimes.
 */

// ─── Date <-> day index ────────────────────────────────────────────────────────

const EPOCH = Date.UTC(2024, 0, 1);
const DAY = 86_400_000;

export function dayIndex(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - EPOCH) / DAY);
}

export function dateFromIndex(i: number): string {
  return new Date(EPOCH + i * DAY).toISOString().slice(0, 10);
}

// ─── base64url (no Buffer / btoa, so it runs in any runtime) ───────────────────

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function toBase64Url(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let k = 0; k < chars; k++) out += B64[(n >> (18 - 6 * k)) & 63];
  }
  return out;
}

export function fromBase64Url(s: string): number[] | null {
  const bytes: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buf >> bits) & 255);
    }
  }
  return bytes;
}

// ─── Numbers & text ─────────────────────────────────────────────────────────────

export function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(n)));
}

export function utf8Encode(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

/** Strict UTF-8 decode; null on malformed input. */
export function utf8Decode(bytes: number[]): string | null {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    const n = b < 0x80 ? 0 : (b & 0xe0) === 0xc0 ? 1 : (b & 0xf0) === 0xe0 ? 2 : (b & 0xf8) === 0xf0 ? 3 : -1;
    if (n < 0) return null;
    let c = n === 0 ? b : b & (0x3f >> n);
    for (let k = 1; k <= n; k++) {
      const cont = bytes[i + k];
      if (cont === undefined || (cont & 0xc0) !== 0x80) return null;
      c = (c << 6) | (cont & 63);
    }
    const min = [0, 0x80, 0x800, 0x10000][n];
    if (c < min || c > 0x10ffff || (c >= 0xd800 && c <= 0xdfff)) return null; // overlong / out of range / surrogate
    out += String.fromCodePoint(c);
    i += n + 1;
  }
  return out;
}

/** UTF-8 bytes of a trimmed name, capped at `maxBytes` without splitting a character. */
export function nameBytes(name: string, maxBytes: number): number[] {
  const bytes = utf8Encode(name.trim());
  let end = Math.min(bytes.length, maxBytes);
  while (end > 0 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.slice(0, end);
}
