export type RuneGrade = 'mythic' | 'legendary' | 'epic' | 'normal';
export type RuneSlot = '무기' | '방어구' | '장신구' | '엠블럼' | '보석';

export interface Rune {
  id: string; // Unique identifier (can be the name for simplicity if unique)
  name: string;
  slot: RuneSlot;
  effect: string;
  grade: RuneGrade;
}

// Deprecated: Valid source of truth is now the MongoDB database.
// This is kept as an empty object or for legacy reference if needed, but should not be populated.
export const RUNE_DATABASE: Record<string, Rune> = {};
