/**
 * Light anti-cheat for game submissions (roadmap Fase 4 / docx 7.3).
 *
 * Pure and framework-free so it can run on the server (Supabase edge function,
 * API route) *and* be unit-tested. It does not delete results — structurally
 * invalid ones are `rejected`, implausible-but-valid ones are flagged
 * `suspicious` for later review.
 *
 * Rate limiting is stateful and belongs at the API/database layer, not here.
 */

export interface SubmissionInput {
  variant: string;
  difficulty: string;
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
  /** ISO timestamps reported by the client (optional). */
  clientStartedAt?: string;
  clientCompletedAt?: string;
}

export interface SubmissionContext {
  /** Does a puzzle with the submitted id actually exist? */
  puzzleExists: boolean;
  expectedVariant: string;
  expectedDifficulty: string;
  /** Fastest plausible solve for this variant/difficulty, in seconds. */
  minPlausibleSeconds?: number;
}

export type SubmissionVerdict = "accepted" | "suspicious" | "rejected";

export interface SubmissionResult {
  verdict: SubmissionVerdict;
  reasons: string[];
}

/**
 * Validate a completed-game submission.
 *
 * - `rejected`   → structurally invalid; do not store as a real result.
 * - `suspicious` → valid shape but implausible; store and flag for review.
 * - `accepted`   → looks legitimate.
 */
export function validateSubmission(
  input: SubmissionInput,
  ctx: SubmissionContext
): SubmissionResult {
  const reject: string[] = [];
  const suspect: string[] = [];

  // ── Structural / hard rules → reject ──────────────────────────────────────
  if (!ctx.puzzleExists) reject.push("puzzle does not exist");
  if (input.variant !== ctx.expectedVariant) reject.push("variant does not match puzzle");
  if (input.difficulty !== ctx.expectedDifficulty) reject.push("difficulty does not match puzzle");

  if (!Number.isFinite(input.elapsedSeconds) || input.elapsedSeconds <= 0)
    reject.push("elapsed time must be positive");
  if (!Number.isInteger(input.elapsedSeconds))
    reject.push("elapsed time must be a whole number of seconds");

  if (!Number.isInteger(input.mistakes) || input.mistakes < 0)
    reject.push("mistakes must be a non-negative integer");
  if (!Number.isInteger(input.hintsUsed) || input.hintsUsed < 0)
    reject.push("hints used must be a non-negative integer");

  // ── Plausibility → suspicious ─────────────────────────────────────────────
  if (
    typeof ctx.minPlausibleSeconds === "number" &&
    input.elapsedSeconds > 0 &&
    input.elapsedSeconds < ctx.minPlausibleSeconds
  ) {
    suspect.push("solve time faster than humanly plausible");
  }

  if (input.clientStartedAt && input.clientCompletedAt) {
    const start = Date.parse(input.clientStartedAt);
    const end = Date.parse(input.clientCompletedAt);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      suspect.push("client timestamps are unparseable");
    } else {
      if (end < start) suspect.push("client completed before it started");
      else {
        const wallSeconds = (end - start) / 1000;
        // Elapsed should not exceed wall-clock time by more than a small margin.
        if (input.elapsedSeconds > wallSeconds + 5) {
          suspect.push("elapsed time exceeds client wall-clock time");
        }
      }
    }
  }

  if (reject.length > 0) return { verdict: "rejected", reasons: reject };
  if (suspect.length > 0) return { verdict: "suspicious", reasons: suspect };
  return { verdict: "accepted", reasons: [] };
}
