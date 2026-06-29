// ─── Cell & Board ────────────────────────────────────────────────────────────

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Cell {
  value: CellValue;
  /** Original puzzle value; 0 = empty */
  given: boolean;
  /** Correct solution value for this cell */
  solution: CellValue;
  /** Player's pencil marks */
  notes: Set<CellValue>;
  /** Marks this cell as incorrect */
  error: boolean;
  /** Marks this cell as highlighted */
  highlighted: boolean;
}

export type Board = Cell[][];

// ─── Game Variants ────────────────────────────────────────────────────────────

export type GameVariant = "classic" | "killer" | "samurai" | "mini";

export type Difficulty = "easy" | "medium" | "hard" | "extreme" | "daily" | "mini";

// ─── Killer Sudoku ────────────────────────────────────────────────────────────

export interface KillerCage {
  id: string;
  sum: number;
  cells: [row: number, col: number][];
}

// ─── Samurai Sudoku ──────────────────────────────────────────────────────────
// 5 overlapping 9×9 grids: top-left, top-right, center, bottom-left, bottom-right

export interface SamuraiGrid {
  boards: [Board, Board, Board, Board, Board];
  /** Offset [row, col] of each sub-grid in the 21×21 master grid */
  offsets: [[0, 0], [0, 12], [6, 6], [12, 0], [12, 12]];
}

// ─── Puzzle & Game State ──────────────────────────────────────────────────────

export interface Puzzle {
  id: string;
  variant: GameVariant;
  difficulty: Difficulty;
  /** Flattened 81-cell string, '0' = empty (classic + killer) */
  clues: string;
  solution: string;
  killerCages?: KillerCage[];
  /** ISO date for daily puzzles */
  date?: string;
  /** Seed used for generation */
  seed?: string;
}

export interface GameState {
  puzzle: Puzzle;
  board: Board;
  /** Elapsed seconds */
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  status: "idle" | "playing" | "paused" | "won" | "failed";
  selectedCell: [row: number, col: number] | null;
  noteMode: boolean;
  /** Stack of previous boards for undo (last entry = previous state) */
  history: Board[];
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  puzzleId: string;
  elapsed: number;
  mistakes: number;
  completedAt: string;
}

// ─── Multiplayer ─────────────────────────────────────────────────────────────

export type MultiplayerEventType =
  | "cell_update"
  | "player_won"
  | "player_joined"
  | "player_left"
  | "game_start"
  | "game_end";

export interface MultiplayerEvent {
  type: MultiplayerEventType;
  playerId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface MultiplayerRoom {
  id: string;
  puzzleId: string;
  players: MultiplayerPlayer[];
  status: "waiting" | "playing" | "finished";
  createdAt: number;
}

export interface MultiplayerPlayer {
  id: string;
  username: string;
  avatarUrl?: string;
  progress: number;
  finished: boolean;
  elapsed?: number;
}

// ─── Streaks & Daily ─────────────────────────────────────────────────────────

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completedDates: string[];
}

// ─── Hint ────────────────────────────────────────────────────────────────────

export type HintStrategy =
  | "naked_single"
  | "hidden_single"
  | "naked_pair"
  | "pointing_pair"
  | "x_wing"
  | "ai_suggestion";

export interface Hint {
  strategy: HintStrategy;
  row: number;
  col: number;
  value: CellValue;
  explanation: string;
}
