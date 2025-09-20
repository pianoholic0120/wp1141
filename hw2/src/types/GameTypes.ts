// 遊戲基本類型定義

export interface Position {
  row: number;
  col: number;
}

export interface Level {
  id: string;
  difficulty: 'Easy' | 'Normal' | 'Normal+' | 'Hard' | 'Hard+' | 'Expert';
  gridSize: [number, number]; // [rows, cols]
  obstacles: Position[];
  blocks: Position[];
  goal: 'cover_all_cells';
  minSteps: number;
  turnLimit: number;
  solution: string[];
}

export interface GameState {
  currentLevel: Level;
  blockPositions: Position[];
  coveredCells: Set<string>; // 使用 "row,col" 格式作為 key
  currentTurn: number;
  isGameWon: boolean;
  isGameLost: boolean;
  moveHistory: Position[][]; // 每回合的方塊位置歷史
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GameConfig {
  animationDuration: number;
  showHints: boolean;
  soundEnabled: boolean;
  colorBlindMode: boolean;
}

export interface StarRating {
  stars: 1 | 2 | 3;
  description: string;
}

// 遊戲統計
export interface GameStats {
  totalMoves: number;
  optimalMoves: number;
  timeElapsed: number;
  stars: StarRating;
}
