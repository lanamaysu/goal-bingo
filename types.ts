
export interface User {
  id: string;
  name: string;
  colorId: number; // Replaced 'color' string with semantic ID
  color?: string; // Kept optional for backward compatibility with old data
  individualPenalty: string;
  isReady: boolean; // Track if user finished personal setup
}

export type GoalType = 'habit' | 'step' | 'simple';

export interface Milestone {
  id: string;
  title: string;
  points: number;
  isCompleted: boolean;
}

export interface GoalStructure {
  type: GoalType;
  // For Habit (Recurring)
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'; 
  periodCount?: number; // New: N times per period (e.g., 3 times per week)
  targetCount?: number; // Total occurrences needed for 100 pts (Calculated)
  exemptionCount?: number; // New: Number of periods allowed to skip (e.g. 2 weeks)
  currentCount?: number;
  unit?: string; // e.g. "次", "小時", "篇"
  
  // For Step (Phase)
  milestones?: Milestone[];
  
  // Bonus
  bonusPoints?: number; // Points added ON TOP of the calculated score
}

export interface Goal {
  id: number;
  userId: string;
  title: string;
  description: string;
  targetScore: number; // Standard is 100
  currentScore: number; 
  structure?: GoalStructure; // New field for structured tracking
  logs: Log[];
  lastUpdated?: number; // Timestamp for sync merging
}

export interface Log {
  id: string;
  date: string;
  content: string;
}

export interface GameConfig {
  year: string;
  groupPenalty: string;
  groupTargetScore: number; // e.g., 450
  minLinesForSafe: number; // e.g., 1
  individualSafeScore: number; // e.g., 100
  gridSize: number; // e.g., 3 for 3x3, 4 for 4x4
  goalsPerUser: number; // e.g., 3
  totalPlayers: number; // Expected number of players
  activeMonths: number; // New: Number of active months in the year (e.g. 11 for excluding rest month)
}

export interface GameState {
  phase: 'setup' | 'active' | 'review' | 'complete'; // Added 'complete'
  users: User[];
  goals: Goal[];
  gridMapping: number[]; // Array of Goal IDs representing the grid
  config: GameConfig;
}
